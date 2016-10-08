var engin = require('./_engine.js'),
Playeble  = require('./classes/Playable.js'),
Wall      = require('./classes/Wall.js'),
ImgButton = require('./classes/ImgButton.js'),
Video     = require('./classes/Video.js'),
Button    = require('./classes/Button.js'),
Rect      = require('./classes/Rect.js'),
Image     = require('./classes/Image.js'),
C         = require('./_const.js'),
events    = require('./_events.js'),
levels    = require('./_levels.js'),
o         = require('./_objects.js'),
cnvs      = require('./_canvas.js'),
key 	  = require('./_key.js');

engin.gameEngineStart(gameLoops.loader);



// var player = {
// 	x : 0,
// 	y : 0,
// 	w : 50,
// 	h : 50,

// 	drawAnimation : function(img, frames, delay, angle){

// 		if ( res.resourses.areLoaded() ){

// 			img.canDraw = ( img.canDraw === undefined ) ? 1 : img.canDraw;

// 			if (angle){
// 				var _dx = this.x + this.w / 2;
// 				var _dy = this.y + this.h / 2;
// 				angle = angle * (Math.PI/180);
// 				cnvs.ctx.save();
// 				cnvs.ctx.translate(_dx,_dy);
// 				cnvs.ctx.rotate(angle);
// 				cnvs.ctx.translate(-_dx,-_dy);
// 			};

// 			if (img.canDraw == 1){
// 				if (img.count == frames) img.count = 1;

// 				img.canDraw = 0;
// 				img.count = img.count + 1 || 1;

// 		        setTimeout(function(){
// 		        	img.canDraw = 1;
// 		        }, 1000/(delay*2) );
// 		    };

// 		    cnvs.ctx.drawImage(img, 50*(img.count-1), 0, this.w, this.h, this.x, this.y, this.w, this.h);

// 		    if (angle){
// 		    	cnvs.ctx.restore();
// 		    };

// 		};
// 	},

// 	draw : function(){

// 		if(this.isMove){
// 			this.drawAnimation(res.arrImages[9],  3, 2,  this.direction);
// 		}else{
// 			this.drawFrame(res.arrImages[9]);
// 		}
// 	},

// 	drawFrame : function(img, angle){

// 		var angle = this.direction || angle || 0;

// 		if (angle){
// 			var _dx = this.x + 50 / 2;
// 			var _dy = this.y + 50 / 2;
// 			angle = angle * (Math.PI/180);
// 			cnvs.ctx.save();
// 			cnvs.ctx.translate(_dx,_dy);
// 			cnvs.ctx.rotate(angle);
// 			cnvs.ctx.translate(-_dx,-_dy);
// 		};

// 		cnvs.ctx.drawImage(img, 0, 0, 50, 50, this.x, this.y, 50, 50);

// 		if (angle){
// 			cnvs.ctx.restore();
// 		};
// 	},

// 	direction : false,
// 	isMove : false
// };



// var res = require('./_resourses.js');
// setInterval(function(){

// 	cnvs.ctx.clearRect(0,0,500,500);

// 	player.draw();

// 	cnvs.ctx.fillRect(50,50,50,50);

// }, 1000/60);


// window.onkeydown = function(e){

// 	if ( e.key == "d" || e.key == "ArrowRight" ){
// 		player.direction = player.isMove = 90;
// 		player.x = player.x + 50;
// 	};

// 	if ( e.key == "s" || e.key == "ArrowDown" ){
// 		player.direction = player.isMove = 180;
// 		player.y = player.y + 50;
// 	};

// 	if ( e.key == "w" || e.key == "ArrowUp" ){
// 		player.direction = player.isMove = 360;
// 		player.y = player.y - 50;
// 	};

// 	if ( e.key == "a" || e.key == "ArrowLeft" ){
// 		player.direction = player.isMove = 270;
// 		player.x = player.x - 50;
// 	};

// 	window.onkeyup = function(e){
// 		player.isMove = false;
// 	};

// };

