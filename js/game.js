var game = new Phaser.Game(500,300,Phaser.AUTO,'game'); //game
game.States = {}; //存放state

game.States.boot = function(){
	this.preload = function(){
		if(!game.device.desktop){//RWD設定
			this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.scale.forcePortrait = true;
			this.scale.refresh();
		}
		game.load.image('loading','assets/preloader.gif');
	};
	this.create = function(){
		game.state.start('preload'); //跳到載入畫面
	};
}

game.States.preload = function(){
	this.preload = function(){
		var preloadSprite = game.add.sprite(35,game.height/2,'loading'); //顯示進度條sprite
		game.load.setPreloadSprite(preloadSprite);
		//下面是要加載的資源
		game.load.image('background','assets/background.jpg'); //背景
    	game.load.image('ground','assets/ground.png'); //地面
    	game.load.image('title','assets/title.png'); //遊戲標題
    	game.load.spritesheet('bird','assets/plane.png',48,16,3); //鳥
    	game.load.image('btn','assets/start-button.png');  //按钮
    	game.load.spritesheet('pipe','assets/pipes.png',54,320,2); //管道
    	game.load.bitmapFont('flappy_font', 'assets/fonts/flappyfont/flappyfont.png', 'assets/fonts/flappyfont/flappyfont.fnt');
    	game.load.audio('fly_sound', 'assets/flap.wav');//飞翔的音效
    	game.load.audio('score_sound', 'assets/score.wav');//得分的音效
    	game.load.audio('hit_pipe_sound', 'assets/pipe-hit.wav'); //撞击管道的音效
    	game.load.audio('hit_ground_sound', 'assets/ouch.wav'); //撞击地面的音效

    	game.load.image('ready_text','assets/get-ready.png');
    	game.load.image('play_tip','assets/instructions.png');
    	game.load.image('game_over','assets/gameover.png');
    	game.load.image('score_board','assets/scoreboard.png');
	}
	this.create = function(){
		game.state.start('menu');
	}
}

game.States.menu = function(){
	this.create = function(){
		game.add.tileSprite(0,0,game.width,game.height,'background').autoScroll(-10,0); //背景图
		game.add.tileSprite(0,game.height-30,game.width,30,'ground').autoScroll(20,0); //地板
		var titleGroup = game.add.group(); //標題的群組
		titleGroup.create(150,0,'title'); //标题
		var bird = titleGroup.create(350, 10, 'bird'); //添加bird到组里
		bird.animations.add('fly'); //標題動畫
		bird.animations.play('fly',12,true); //播放動畫
		titleGroup.x = 10;
		titleGroup.y = 10;
		game.add.tween(titleGroup).to({ y:50 },1000,null,true,0,Number.MAX_VALUE,true); //標題移動y軸動畫
		var btn = game.add.button(game.width/2,game.height/2,'btn',function(){//開始按鈕
			game.state.start('play');
		});
		btn.anchor.setTo(0.5,0.5);
	}
}

game.States.play = function(){
	this.create = function(){
		this.bg = game.add.tileSprite(0,0,game.width,game.height,'background');//背景圖
		this.pipeGroup = game.add.group();
		this.pipeGroup.enableBody = true;
		this.ground = game.add.tileSprite(0,game.height-30,game.width,30,'ground'); //地板
		this.bird = game.add.sprite(50,150,'bird'); //鳥
		this.bird.animations.add('fly');
		this.bird.animations.play('fly',12,true);
		this.bird.anchor.setTo(0.5, 0.5);
		game.physics.enable(this.bird,Phaser.Physics.ARCADE); //鳥的物理系統
		this.bird.body.gravity.y = 0; //鳥的重力,還沒開始，先不動
		game.physics.enable(this.ground,Phaser.Physics.ARCADE);//地面
		this.ground.body.immovable = true; //固定

		this.soundFly = game.add.sound('fly_sound');
		this.soundScore = game.add.sound('score_sound');
		this.soundHitPipe = game.add.sound('hit_pipe_sound');
		this.soundHitGround = game.add.sound('hit_ground_sound');
		this.scoreText = game.add.bitmapText(game.world.centerX-20, 30, 'flappy_font', '0', 36);

		this.readyText = game.add.image(game.width/2, 40, 'ready_text'); //get ready 文字
		this.playTip = game.add.image(game.width/2,100,'play_tip'); //提示
		this.readyText.anchor.setTo(0.5, 0);
		this.playTip.anchor.setTo(0.5, 0);

		this.hasStarted = false; //判斷是否開始
		game.time.events.loop(900, this.generatePipes, this);
		game.time.events.stop(false);
		game.input.onDown.addOnce(this.statrGame, this);
	};
	this.update = function(){
		if(!this.hasStarted) return; //遊戲未開始
		game.physics.arcade.collide(this.bird,this.ground, this.hitGround, null, this); //地板碰撞
		game.physics.arcade.overlap(this.bird, this.pipeGroup, this.hitPipe, null, this); //障礙碰撞
		if(this.bird.angle < 90) this.bird.angle += 2.5; //下降頭朝下
		this.pipeGroup.forEachExists(this.checkScore,this); //分數檢測及更新
	}

	this.statrGame = function(){
		this.gameSpeed = 200; //遊戲速度
		this.gameIsOver = false;
		this.hasHitGround = false;
		this.hasStarted = true;
		this.score = 0;
		this.bg.autoScroll(-(this.gameSpeed/10),0);
		this.ground.autoScroll(-this.gameSpeed,0);
		this.bird.body.gravity.y = 1000; //鳥的重力
		this.readyText.destroy();
		this.playTip.destroy();
		game.input.onDown.add(this.fly, this);
		game.time.events.start();
	}

	this.stopGame = function(){
		this.bg.stopScroll();
		this.ground.stopScroll();
		this.pipeGroup.forEachExists(function(pipe){
			pipe.body.velocity.x = 0;
		}, this);
		this.bird.animations.stop('fly', 0);
		game.input.onDown.remove(this.fly,this);
		game.time.events.stop(true);
	}

	this.fly = function(){
		this.bird.body.velocity.y = -350;
		game.add.tween(this.bird).to({angle:-30}, 100, null, true, 0, 0, false); //上升頭朝上
		this.soundFly.play();
	}

	this.hitPipe = function(){
		if(this.gameIsOver) return;
		this.soundHitPipe.play();
		this.gameOver();
	}
	this.hitGround = function(){
		if(this.hasHitGround) return; //已經撞倒地板
		this.hasHitGround = true;
		this.soundHitGround.play();
		this.gameOver(true);
	}
	this.gameOver = function(show_text){
		this.gameIsOver = true;
		this.stopGame();
		if(show_text) this.showGameOverText();
	};

	this.showGameOverText = function(){
		this.scoreText.destroy();
		game.bestScore = game.bestScore || 0;
		if(this.score > game.bestScore) game.bestScore = this.score; //最好分數
		this.gameOverGroup = game.add.group(); //加一個群組
		var gameOverText = this.gameOverGroup.create(game.width/2,0,'game_over'); //game over 圖片
		var scoreboard = this.gameOverGroup.create(game.width/2,70,'score_board'); //分數板
		var currentScoreText = game.add.bitmapText(game.width/2 + 60, 105, 'flappy_font', this.score+'', 20, this.gameOverGroup); //現在分數
		var bestScoreText = game.add.bitmapText(game.width/2 + 60, 153, 'flappy_font', game.bestScore+'', 20, this.gameOverGroup); //最好分數
		var replayBtn = game.add.button(game.width/2, 210, 'btn', function(){//重新
			game.state.start('play');
		}, this, null, null, null, null, this.gameOverGroup);
		gameOverText.anchor.setTo(0.5, 0);
		scoreboard.anchor.setTo(0.5, 0);
		replayBtn.anchor.setTo(0.5, 0);
		this.gameOverGroup.y = 30;
	}

	this.generatePipes = function(gap){ //產生障礙
		gap = gap || 200; //上下障礙之間的寬度
		var position = (505 - 320 - gap) + Math.floor((505 - 112 - 30 - gap - 505 + 320 + gap) * Math.random());
		var topPipeY = position-360;
		var bottomPipeY = position+gap;

		if(this.resetPipe(topPipeY,bottomPipeY)) return;

		var topPipe = game.add.sprite(game.width, topPipeY, 'pipe', 0, this.pipeGroup);
		var bottomPipe = game.add.sprite(game.width, bottomPipeY, 'pipe', 1, this.pipeGroup);
		this.pipeGroup.setAll('checkWorldBounds',true);
		this.pipeGroup.setAll('outOfBoundsKill',true);
		this.pipeGroup.setAll('body.velocity.x', -this.gameSpeed);
	}

	this.resetPipe = function(topPipeY,bottomPipeY){//重置出了边界的管道，做到回收利用
		var i = 0;
		this.pipeGroup.forEachDead(function(pipe){
			if(pipe.y<=0){ //topPipe
				pipe.reset(game.width, topPipeY);
				pipe.hasScored = false; //重置未得分
			}else{
				pipe.reset(game.width, bottomPipeY);
			}
			pipe.body.velocity.x = -this.gameSpeed;
			i++;
		}, this);
		return i == 2; //如果 i==2 代表有一组管道已经出了边界，可以回收这组管道了
	}

	this.checkScore = function(pipe){//分數檢查和更新
		if(!pipe.hasScored && pipe.y<=0 && pipe.x<=this.bird.x-17-54){
			pipe.hasScored = true;
			this.scoreText.text = ++this.score;
			this.soundScore.play();
			return true;
		}
		return false;
	}
}

//加state到遊戲
game.state.add('boot',game.States.boot);
game.state.add('preload',game.States.preload);
game.state.add('menu',game.States.menu);
game.state.add('play',game.States.play);
game.state.start('boot'); //啟動遊戲

