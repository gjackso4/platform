var GameState = {
	init: function() {
		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.scale.setScreenSize(true);
		this.scale.pageAlignHorizontally = true;
		this.scale.pageAlignVertically = true;

		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.game.physics.arcade.gravity.y = 1000;

		this.cursors = this.game.input.keyboard.createCursorKeys();
		this.RUNNING_SPEED = 180;
		this.JUMPING_SPEED = 550;

		this.game.world.setBounds(0,0,360,700);
	},
	preload: function() {
		this.load.image('ground', 'assets/images/ground.png');
		this.load.image('actionButton', 'assets/images/actionButton.png');
		this.load.image('arrowButton', 'assets/images/arrowButton.png');
		this.load.image('barrel', 'assets/images/barrel.png');
		this.load.image('gorilla', 'assets/images/gorilla3.png');
		this.load.image('platform', 'assets/images/platform.png');

		this.load.spritesheet('player', 'assets/images/player_spritesheet.png', 28, 30, 5, 1, 1);
		this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', 20, 21, 2, 1, 1);
	
		this.load.text('level', 'assets/data/level.json');
	},
	create: function() {
		this.ground = this.add.sprite(0, 638 , 'ground');
		this.game.physics.arcade.enable(this.ground);
		this.ground.body.allowGravity = false;
		this.ground.body.immovable = true;


		// this.platform = this.add.sprite(0, 300, 'platform');
		// this.game.physics.arcade.enable(this.platform);
		// this.platform.body.allowGravity = false;
		// this.platform.body.immovable = true;

		this.levelData = JSON.parse(this.game.cache.getText('level'));

		console.log(this.levelData);

		this.platforms = this.add.group();
		this.platforms.enableBody = true;

		this.levelData.platformData.forEach(function(element){
			this.platforms.create(element.x, element.y, 'platform');
		}, this);

		this.platforms.setAll('body.immovable', true);
		this.platforms.setAll('body.allowGravity', false);

		//fire
		this.fires = this.add.group();
		this.fires.enableBody = true;

		var fire;
		this.levelData.fireData.forEach(function(element){
			fire = this.fires.create(element.x, element.y, 'fire');
			fire.animations.add('fire', [0, 1], 4, true);
			fire.play("fire");
		}, this);

		this.fires.setAll('body.allowGravity', false);

		//goal
		this.goal = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'gorilla');
		this.game.physics.arcade.enable(this.goal);
		this.goal.body.allowGravity = false;

		this.player = this.add.sprite(this.levelData.playerStart.x, this.levelData.playerStart.y , 'player', 3);
		this.player.anchor.setTo(0.5);
		this.player.animations.add('walking', [0, 1, 2, 1], 6, true);
		this.game.physics.arcade.enable(this.player);
		this.player.customParams = {};

		//Camera follow player
		this.game.camera.follow(this.player);

		this.createOnscreenControls();

		this.barrels = this.add.group();
		this.barrels.enableBody = true;

		this.createBarrel();
		this.barrelCreator = this.game.time.events.loop(Phaser.Timer.SECOND * this.levelData.barrelFrequency, this.createBarrel, this);

	}, 
	update: function() {
		this.game.physics.arcade.collide(this.player, this.ground, this.landed);
		this.game.physics.arcade.collide(this.player, this.platforms, this.landed);
		this.game.physics.arcade.collide(this.barrels, this.platforms);
		this.game.physics.arcade.collide(this.barrels, this.ground);

		this.game.physics.arcade.overlap(this.player, this.fires, this.killPlayer);
		this.game.physics.arcade.overlap(this.player, this.barrels, this.killPlayer);
		this.game.physics.arcade.overlap(this.player, this.goal, this.win);

		// PRO TIP - Overlap is to check for overlaping without effecting physics
		// this.game.physics.arcade.overlap(this.player, this.platform, this.landed);

		this.player.body.velocity.x = 0;
		this.player.body.collideWorldBounds = true;
		if(this.cursors.left.isDown || this.player.customParams.isMovingLeft) {
			this.player.body.velocity.x = -this.RUNNING_SPEED;	
			this.player.scale.setTo(1);
			this.player.play("walking");
		}
		else if(this.cursors.right.isDown || this.player.customParams.isMovingRight) {
			this.player.body.velocity.x = this.RUNNING_SPEED;
			this.player.scale.setTo(-1, 1);
			this.player.play("walking");
		}
		else {
			this.player.animations.stop();
			this.player.frame = 3;
		}

		// Checking if up key is pressed & if you're touching the ground
		if((this.cursors.up.isDown || this.player.customParams.mustJump) && this.player.body.touching.down) {
			this.player.body.velocity.y = -this.JUMPING_SPEED;
			this.player.customParams.mustJump = false;
		}

		this.barrels.forEach(function(element){
			if(element.x < 10 && element.y > 600) {
				element.kill();
			}
		}, this);

	},
	landed: function(player, ground) {
		//console.log("landed");

	},
	createOnscreenControls: function() {
		this.leftArrow = this.add.button(20, 535, 'arrowButton');
		this.rightArrow = this.add.button(110, 535, 'arrowButton');
		this.actionButton = this.add.button(280, 535, 'actionButton');

		this.leftArrow.alpha = 0.5;
		this.rightArrow.alpha = 0.5;
		this.actionButton.alpha = 0.5;

		this.leftArrow.fixedToCamera = true;
		this.rightArrow.fixedToCamera = true;
		this.actionButton.fixedToCamera = true;

		this.actionButton.events.onInputDown.add(function(){
			this.player.customParams.mustJump = true;
		}, this);
		this.actionButton.events.onInputUp.add(function(){
			this.player.customParams.mustJump = false;
		}, this);

		//left
		this.leftArrow.events.onInputDown.add(function(){
			this.player.customParams.isMovingLeft = true;
		}, this);
		this.leftArrow.events.onInputUp.add(function(){
			this.player.customParams.isMovingLeft = false;
		}, this);

		//fix for mobile not firing onInputDown / Up
		this.leftArrow.events.onInputOver.add(function(){
			this.player.customParams.isMovingLeft = true;
		}, this);
		this.leftArrow.events.onInputOut.add(function(){
			this.player.customParams.isMovingLeft = false;
		}, this);


		//right
		this.rightArrow.events.onInputDown.add(function(){
			this.player.customParams.isMovingRight = true;
		}, this);
		this.rightArrow.events.onInputUp.add(function(){
			this.player.customParams.isMovingRight = false;
		}, this);

		//fix for mobile not firing onInputDown / Up
		this.rightArrow.events.onInputOver.add(function(){
			this.player.customParams.isMovingRight = true;
		}, this);
		this.rightArrow.events.onInputOut.add(function(){
			this.player.customParams.isMovingRight = false;
		}, this);

	},
	killPlayer: function(player, fire){
		console.log('ouch');
		game.state.start('GameState');
	}, 
	win: function() {
		console.log('You Win');
		game.state.start('GameState');	
	}, 
	createBarrel: function() {
	    //give me the first dead sprite
	    var barrel = this.barrels.getFirstExists(false);

	    if(!barrel) {
	      barrel = this.barrels.create(0, 0, 'barrel');
	    }

	    barrel.body.collideWorldBounds = true;
	    barrel.body.bounce.set(1, 0);

	    barrel.reset(this.levelData.goal.x, this.levelData.goal.y);
	    barrel.body.velocity.x = this.levelData.barrelSpeed;
	  }

};

var game = new Phaser.Game(360, 592, Phaser.AUTO);

game.state.add('GameState', GameState);
game.state.start('GameState');