(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var C = require('./_const.js');

var cnv = document.getElementById("canvas");
var ctx = cnv.getContext("2d");

cnv.style.border = "2px solid black";
cnv.style.backgroundColor = "white";
cnv.width = C.WIDTH;
cnv.height = C.HEIGHT;

module.exports = {

	cnv : cnv,

	ctx : ctx

};
},{"./_const.js":2}],2:[function(require,module,exports){
var PADD = 1; 						//паддинг, который я хочу чтобы был, меж квадратами
var WIDTH = PADD + (PADD+50)*9; 	//ширина канвы
var HEIGHT = 20+PADD + (PADD+50)*10;   //высота канвы
var CNV_BORDER = 2;
var HEADER_H = 71;

module.exports = {

	PDNG : PADD,

	WIDTH : WIDTH,

	HEIGHT : HEIGHT,

	CNV_BORDER : CNV_BORDER,

	HEADER_H : HEADER_H

};

},{}],3:[function(require,module,exports){
//*****************************************
//**кросбраузерное упрвление циклами игры**
//*****************************************

var gameEngine;

var nextGameStep = (function(){
	return requestAnimationFrame ||
	webkitRequestAnimationFrame ||
	mozRequestAnimationFrame ||
	oRequestAnimationFrame ||
	msRequestAnimationFrame ||
	function (callback){
		setInterval(callback, 1000/60)
	};
})();

function gameEngineStep(){
	gameEngine();
	nextGameStep(gameEngineStep);
};

function setGameEngine(){
	gameEngine = callback;
};


module.exports = {

	gameEngineStart : function (callback){
		gameEngine = callback;
		gameEngineStep();
	}

};

},{}],4:[function(require,module,exports){
var o = require('./_objects.js');
var sw = require('./_stopwatch.js');
var levels = require('./_levels.js');
var engin = require('./_engine.js');
var gLoo = require('./_gameLoops.js');
var hf = require('./_helperFunctions.js');
var canvas = require('./_canvas.js');
var fs = require('./_fullScreen.js');
var C = require('./_const.js');
var key = require('./_key.js');

var gameLoops = gLoo;

var isBorder = { //принимает объект, возвращает стоит ли с запрашиваеомй границы канвы
  up : function(obj){
    return obj.y == 0;
  },

  down : function(obj){
    return obj.y == C.HEIGHT - obj.h - C.PDNG - C.HEADER_H - C.PDNG;
  },

  left : function(obj){
    return obj.x == 0;
  },

  right : function(obj){
    return obj.x == C.WIDTH - obj.w - C.PDNG - C.PDNG
  }
};

var isNear = { //принимает 2 объекта, возвращает стоит ли с запрашиваемой стороны 1ый от 2го.

  up : function(obj_1, obj_2){
    if ( Object.prototype.toString.call(obj_2) == '[object Array]' ) {
      var move = false;
      for ( var i=0; i<obj_2.length;i++ ){
        move = obj_2[i].y + obj_2[i].w + C.PDNG == obj_1.y && obj_1.x == obj_2[i].x;
        if (move) return move;
      }
    }
    return obj_2.y + obj_2.w + C.PDNG == obj_1.y && obj_1.x == obj_2.x;
  },

  down : function(obj_1, obj_2){
    if ( Object.prototype.toString.call(obj_2) == '[object Array]' ) {
      var move = false;
      for ( var i=0; i<obj_2.length;i++ ){
        move = obj_1.y + obj_1.w + C.PDNG == obj_2[i].y && obj_1.x == obj_2[i].x;
        if (move) return move;
      }
    }
    return obj_1.y + obj_1.w + C.PDNG == obj_2.y && obj_1.x == obj_2.x;
  },

  left : function(obj_1, obj_2){
    if ( Object.prototype.toString.call(obj_2) == '[object Array]' ) {
      var move = false;
      for ( var i=0; i<obj_2.length;i++ ){
        move = obj_2[i].x + obj_2[i].w + C.PDNG == obj_1.x && obj_1.y == obj_2[i].y;
        if (move) return move;
      }
    }
    return obj_2.x + obj_2.w + C.PDNG == obj_1.x && obj_1.y == obj_2.y;
  },

  right : function(obj_1, obj_2){
    if ( Object.prototype.toString.call(obj_2) == '[object Array]' ) {
      var move = false;
      for ( var i=0; i<obj_2.length;i++ ){
        move = obj_1.x + obj_1.w + C.PDNG == obj_2[i].x && obj_1.y == obj_2[i].y;
        if (move) return move;
      }
    }
    return obj_1.x + obj_1.w + C.PDNG == obj_2.x && obj_1.y == obj_2.y;
  }
};

function directionIs(direction){  //возвращает угол поворота в градусах

  switch(direction){

    case "up"   : return 360;
    break;
    case "down" : return 180;
    break;
    case "left" : return 270;
    break;
    case "right": return 90;
    break;

  };
};

function canMoveObj(direction){  //(описываем границы движения) разрешает движение в пределах уровня

  o.pl.direction = o.pl.isMove = directionIs(direction);
  if ( isNear[direction](o.pl, o.box) && !isBorder[direction](o.box) && !isNear[direction](o.box, o.walls) ){ //если рядом с ящиком и ящик не у границ, двигаем.
    o.pl.move(direction);
    o.box.move(direction);
  } else if( !isNear[direction](o.pl, o.box) && !isBorder[direction](o.pl) && !isNear[direction](o.pl, o.walls) ){ //если не рядом с ящиком и не рядом с границей, двигаемся.
    o.pl.move(direction);
  }
};

function isCursorInButton(x,y,but){ //возвращает тру, если курсор попал в координаты объекта
  return x >= but.x && 
  x <= but.x+but.w && 
  y >= but.y && 
  y <= but.y+but.h
};

function loadLevel(number){ //загрузка уровня
  sw.start();
  levels[number](); 
  gameLoops.currentLevel = number; 
  o.currLevel.txt = "Уровень "+number;
  engin.gameEngineStart(gameLoops.game);
};

window.onkeydown = function(e){ //событие нажатия клавишь

  if ( gLoo.status == "game" ){ //передвигаться только если идет игра.

    if ( key.isKeyDown("D") )
      canMoveObj("right");

    if ( key.isKeyDown("S") )
      canMoveObj("down");

    if ( key.isKeyDown("W") )
      canMoveObj("up");

    if ( key.isKeyDown("A") )
      canMoveObj("left");

  };

  window.onkeyup = function(e){
    o.pl.isMove = false;
  };
};

window.onmousedown = function(e){ //cобытие нажатия мышки

  var x = e.pageX-canvas.cnv.offsetLeft;
  var y = e.pageY-canvas.cnv.offsetTop;

  switch (gLoo.status){

    case "menu" :
      for ( i in o.menu ){
        if ( isCursorInButton(x,y,o.menu[i]) ){
          switch (o.menu[i].name) {

            case "play" :
            loadLevel(gameLoops.currentLevel);
            break;

            case "change_level" :
            engin.gameEngineStart(gameLoops.levels);
            break;

          };
        };
      };
      break;

    case "levels" :
      for ( i in o.levelsFooter ){
        if ( isCursorInButton(x,y,o.levelsFooter[i]) ){
          switch (o.levelsFooter[i].name) {

            case "prev" :
            console.log("Кнопка назад, пока так.");
            break;

            case "to_menu" :
            engin.gameEngineStart(gameLoops.menu);
            break;

            case "next" :
            console.log("Кнопка вперед, пока так.");
            break;

          };
        };
      };

      for ( var i = 0; i < o.bLevelsButtons.length; i++ ){
        if ( isCursorInButton(x,y,o.bLevelsButtons[i]) ){
          gameLoops.currentLevel = i+1;
          loadLevel(i+1);
        };
      };
      break;

    case "game" :
      if ( isCursorInButton(x,y,o.bPause) ){
        sw.pauseTimer();
        o.bgOpacity.draw();
        engin.gameEngineStart(gameLoops.pause);
      };

      if ( isCursorInButton(x,y,o.bFullScr) ){
        // console.log(C.HEIGHT);
        // canvas.cnv.width = canvas.cnv.width*2;
        // canvas.cnv.height = canvas.cnv.height*2;
        // canvas.ctx.scale(2,2);
        ( !fs.status ) ? fs.launchFullScreen(canvas.cnv) : fs.canselFullScreen(); 
      };
      break;

    case "win" :

      for ( i in o.winPopUp ){
        if ( isCursorInButton(x,y,o.winPopUp[i]) ){
          if ( o.winPopUp[i].name == "pop_exit" ){
            engin.gameEngineStart(gameLoops.menu);
          } else if ( o.winPopUp[i].name == "pop_next" && gameLoops.currentLevel != levels.lvlsCount() ){
            sw.reset();
            gameLoops.currentLevel++;
            loadLevel(gameLoops.currentLevel);
          };
        };
      };
      break;

    case "pause" :
      for ( i in o.pausePopUp ){
        if ( isCursorInButton(x,y,o.pausePopUp[i]) ){
          switch (o.pausePopUp[i].name) {

            case "return" :
              sw.start();
              engin.gameEngineStart(gameLoops.game);
              break;

            case "restart" :
              sw.reset();
              loadLevel(gameLoops.currentLevel);
              break;

            case "exit" :
              sw.reset();
              engin.gameEngineStart(gameLoops.menu);
              break;

          };
        };
      };
      break;

  };
};

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_fullScreen.js":5,"./_gameLoops.js":6,"./_helperFunctions.js":7,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./_stopwatch.js":12}],5:[function(require,module,exports){
module.exports = { 

	launchFullScreen : function(elem){

		if ( elem.requestFullScreen ){
			elem.requestFullScreen();
		} else if ( elem.mozRequestFullScreen ){
			elem.mozRequstFullScreen();
		} else if ( elem.webkitRequestFullScreen ){
			elem.webkitRequestFullScreen();
		};

		this.status = true; 
	},

	canselFullScreen : function(){

		if ( document.exitFullscreen ){
			document.exitFullscreen();
		} else if ( document.mozCancelFullScreen ){
			document.mozCancelFullScreen();
		} else if ( document.webkitExitFullscreen ){
			document.webkitExitFullscreen();
		};

		this.status = false;
	},

	status : false

};
},{}],6:[function(require,module,exports){
var C = require('./_const.js');
var o = require('./_objects.js');
var hf = require('./_helperFunctions.js');
var engin = require('./_engine.js');
var res = require('./_resourses.js');

//VREMENNO!!!
var ctx = require('./_canvas.js').ctx;

module.exports = gameLoops =  {

  loader : function(){

    gameLoops.status = "loader";

    o.TEST.draw();
    if ( res.resourses.areLoaded() ) engin.gameEngineStart(gameLoops.menu);

  },

  game : function(){

    gameLoops.status = "game"; 

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT); //очистка области

    //ВРЕМЕННО!!!
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,C.WIDTH,C.HEIGHT);

    o.bgLevel.draw();
    //выводим матричное поле игры
    for ( i in o.matrix ){
      o.matrix[i].draw();
    };
    //выводим стены\преграды
    for ( i in o.walls ){
      o.walls[i].draw();
    };

    //**********************
    //****Выводим Хедер*****
    //**********************
    o.header.draw();
    o.stopWatch.draw(1,10);
    o.bFullScr.draw();
    o.bPause.draw();
    o.currLevel.draw();

    //**********************
    //****Выводим объекты*****
    //**********************
    o.door.draw();
    o.pl.draw();
    o.box.draw();

    //**********************
    //****Если победили*****
    //**********************
    if ( hf.isWin() ){
      o.bgOpacity.draw();
      engin.gameEngineStart(gameLoops.win);
    };
  },

  menu : function(){

    gameLoops.status = "menu";

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.animateBg.draw();

    o.logo.draw();

    for ( i in o.menu ){
      o.menu[i].draw();
    };
  },

  win : function(){

    gameLoops.status = "win";

    for ( i in o.winPopUp ){
      if ( o.winPopUp[i].name == "win_text" ) o.winPopUp[i].txt = "Уровень "+gameLoops.currentLevel+" пройден!";
      if ( o.winPopUp[i].name == "pop_next" && gameLoops.currentLevel == levels.lvlsCount() ) {
        continue;
      } else {
        o.winPopUp[i].draw();
      }  
    };
  },

  pause : function(){

    gameLoops.status = "pause";

    for ( i in o.pausePopUp ){
      o.pausePopUp[i].draw();
    };
  },

  levels : function(){

    gameLoops.status = "levels";

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.levelsHeader.draw();

    for ( i in o.bLevelsButtons ){
      o.bLevelsButtons[i].draw();
    };

    for ( i in o.levelsFooter ){
      o.levelsFooter[i].draw();
    };
  },

  status : "",

  currentLevel : "1"

};

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_helperFunctions.js":7,"./_objects.js":10,"./_resourses.js":11}],7:[function(require,module,exports){
var canvas = require('./_canvas.js');
var o = require('./_objects.js');
var C = require('./_const.js');
var levels = require('./_levels.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = {

  clearRect : function(x,y,w,h){  //очиститель
    ctx.clearRect(x,y,w,h);
  },

  getRandomInt : function(min, max) { //функция для рандома целочисленного значения
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  isWin : function(){ //победили?
    return o.box.x == o.door.x && o.box.y == o.door.y;
  }
};

},{"./_canvas.js":1,"./_const.js":2,"./_levels.js":9,"./_objects.js":10}],8:[function(require,module,exports){
var keys = {
	"W" : 87,
	"S" : 83,
	"A" : 65,
	"D" : 68
};

var keyDown = 0;
// var keyDown = {};

function setKey(keyCode){
	keyDown = keyCode;
	// keyDown[keycode] = true;
};

function clearKey(keyCode){
	keyDown = 0;
	// keyDown[keyCode] = false;
};

window.addEventListener("keydown", function(e){
	setKey(e.keyCode);
});
window.addEventListener("keyup", function(e){
	clearKey(e.keyCode);
});


function isKeyDown(keyName){
	return keyDown[keys[keyName]] == true;
};


module.exports = { 

	isKeyDown : function(keyName){
		return keyDown == keys[keyName];
		// return keyDown[keys[keyName]] == true;
	}

};
},{}],9:[function(require,module,exports){
var C = require('./_const.js');
var o = require('./_objects.js');
var res = require('./_resourses.js');

module.exports = levels = {

	lvlsCount : function(){
		var count = 0;
		for(key in levels){ count++ };
			return count-1;
	},

	1 : function(){

		var _walls = [];  //массив с будущепостроенными стенками
		var arr = [       
		[1,3],[1,4],[1,5],[2,0],[2,6],[2,8],[3,2],[4,1],[4,3],[4,7],[5,4],[6,4],[6,6],[7,1],[7,8],[8,0],[8,4],[8,5]
		];				  //придуманный массив со стенками

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.arrImages[5], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  //заполняем массив walls

		o.pl.setPosition( 0, 0 );
		o.box.setPosition( 0+2*(50+C.PDNG), 7*(50+C.PDNG) );
		o.door.setPosition( 0+8*(50+C.PDNG), 0*(50+C.PDNG) );

		o.walls = _walls;

	},

	2 : function(){

		var _walls = [];  
		var arr = [       
		[0,0],[0,4],[0,3],[0,6],[2,2],[2,4],[3,8],[3,0],[3,7],[4,2],[4,4],[4,5],[4,6],[5,0],[6,2],[6,5],[6,6],[6,7],[7,0],[8,3],[8,4],[8,7]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.arrImages[5], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 0, 0+8*(50+C.PDNG) );
		o.box.setPosition( 0+6*(50+C.PDNG), 0+7*(50+C.PDNG) );
		o.door.setPosition( 0+8*(50+C.PDNG), 0+6*(50+C.PDNG) );

		o.walls = _walls;

	},

	3 : function(){

		var _walls = [];  
		var arr = [       
		[0,2],[0,7],[1,5],[1,8],[2,2],[2,7],[3,4],[4,1],[4,4],[4,6],[6,2],[6,3],[6,4],[6,6],[6,8],[7,0],[7,5],[8,0],[8,1],[8,3],[8,7]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.arrImages[5], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 0+8*(50+C.PDNG), 0+8*(50+C.PDNG) );
		o.box.setPosition( 0+1*(50+C.PDNG), 0+6*(50+C.PDNG) );
		o.door.setPosition( 0+2*(50+C.PDNG), 0+3*(50+C.PDNG) );

		o.walls = _walls;

	},

	4 : function(){

		var _walls = [];  
		var arr = [       
		[0,1],[1,5],[1,7],[2,4],[3,1],[3,3],[3,6],[3,8],[4,3],[5,5],[5,7],[6,0],[6,2],[6,3],[6,5],[7,8],[8,0],[8,8]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.arrImages[5], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 0+7*(50+C.PDNG), 0+8*(50+C.PDNG) );
		o.box.setPosition( 0+7*(50+C.PDNG), 0+7*(50+C.PDNG) );
		o.door.setPosition( 0+6*(50+C.PDNG), 0+0*(50+C.PDNG) );

		o.walls = _walls;

	},

	5 : function(){

		var _walls = [];  
		var arr = [       
		[0,1],[0,3],[0,5],[0,8],[2,2],[2,4],[2,6],[2,8],[4,0],[4,3],[4,5],[4,7],[6,1],[6,2],[6,4],[6,7],[7,8],[8,2],[8,4],[8,8]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.arrImages[5], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 0, 0+0*(50+C.PDNG) );
		o.box.setPosition( 0+1*(50+C.PDNG), 0+1*(50+C.PDNG) );
		o.door.setPosition( 0, 0+8*(50+C.PDNG) );

		o.walls = _walls;

	}

};

},{"./_const.js":2,"./_objects.js":10,"./_resourses.js":11}],10:[function(require,module,exports){
var C = require('./_const.js');
var cnvs = require('./_canvas.js');
var res = require('./_resourses.js');


function createMatrixBG(){
  var matrix = []; //массив для матричного вида уровня

  for (var i = 0; i < 9; i++){ //заполняем объект
    for (var j = 0; j < 9; j++){
      matrix.push( new Rect(j*(50+C.PDNG), i*(50+C.PDNG), 50, 50, "rgba(0,0,0,0.5)", true) );
    }
  };

  return matrix
};

function createMenu(txtArr, nameArr){  //создаем главное меню
  var menu = [];
  var names = nameArr;
  var txt = txtArr;
  var amounts = txtArr.length;
  
  var _fontsize = "28";
  var _x = C.WIDTH/2-300/2;
  var _y = (C.HEIGHT/2) - (85*amounts/2) + 85; 

  for (var i = 0; i < amounts; i++){
    menu.push( new ImgButton( res.arrImages[0], _x, _y+i*85, 300, 60, txt[i], names[i], _fontsize, 135 ) );
  };

  return menu;
};

function createWinPopUp(){

  var winPopBG = new Rect( C.WIDTH/2-275/2, C.HEIGHT/2-125/2, 275, 125, "red" );
  var bPopExit = new Button( winPopBG.x+5, winPopBG.y+winPopBG.h-5-40, 90, 40, "black", "Выход", "pop_exit", 20 );
  var bPopNext = new Button( winPopBG.x+winPopBG.w-5-90, winPopBG.y+winPopBG.h-5-40, 90, 40, "black", "Далее", "pop_next", 20 );
  var winText = new Button( C.WIDTH/2-90/2, winPopBG.y+10, 90, 40, "transparent", "Уровень N пройден!", "win_text", 25 );
  winText.txtColor = "black";

  var winPopUp = [];
  winPopUp.push(winPopBG, bPopExit, bPopNext, winText);

  return winPopUp;
};

function createPausePopUp(txtArr, nameArr, fontsize){

  var names = nameArr;
  var txt = txtArr;
  var _fontsize = fontsize;
  var amounts = txtArr.length;

  var _height = (C.HEIGHT/2) - (60*amounts/2); 
  var _width = C.WIDTH/2-150/2;

  var pausePopUp = [new Rect( C.WIDTH/2-200/2, _height-30, 200, 60*amounts+40, "red" )];

  for (var i=0; i<amounts; i++){
    pausePopUp.push( new Button( _width, _height+i*60, 150, 40, "black", txt[i], names[i], _fontsize ) ); 
  };

  return pausePopUp;
};

function createLevelsButtons(levels_count){

  var bLevelsButtons = [];
  var j = 0, dy = 75, dx = 0;

  for ( i=0; i < levels_count; i++){
    dx = 8+j*(100+15);

    bLevelsButtons.push( new Button( dx, dy, 100, 100, "black", i+1, "level_"+(i+1), 25 ) );

    j++;

    if ( dx > C.WIDTH-115 ){
      dy += (125);
      j = 0;
    }

  };

  return bLevelsButtons;
};

function createLevelsFooter(){

  var levelsFooter = [];

  var bPrev = new Button( 10, C.HEIGHT-10-50, 100, 50, "#34BACA", "Назад", "prev", 25 );
  var bNext = new Button( C.WIDTH-10-100, C.HEIGHT-10-50, 100, 50, "#34BACA", "Далее", "next", 25 );
  var bToMenu = new Button( (bPrev.x+bPrev.w+bNext.x)/2-225/2, C.HEIGHT-10-50, 225, 50, "#34BACA", "Вернуться в меню", "to_menu", 25 );

  levelsFooter.push(bPrev,bNext,bToMenu);

  return levelsFooter;
};




function createPlayer(){

  var player = new Playable(res.arrImages[9],0,0,50,50);
  player.direction = false;
  player.isMove = false;

  player.draw = function(){

    if(this.isMove){
      this.drawAnimation(3, 2, this.direction);
    }else{
      this.drawFrame();
    };
  };

  player.drawAnimation = function(frames, delay, angle){

    this.img.canDraw = ( this.img.canDraw === undefined ) ? 1 : this.img.canDraw;

    if (angle){
      var _dx = this.x+C.PDNG + this.w / 2;
      var _dy = this.y+71+C.PDNG + this.h / 2;
      angle = angle * (Math.PI/180);
      cnvs.ctx.save();
      cnvs.ctx.translate(_dx,_dy);
      cnvs.ctx.rotate(angle);
      cnvs.ctx.translate(-_dx,-_dy);
    };

    if (this.img.canDraw == 1){
      if (this.img.count == frames) this.img.count = 1;

      this.img.canDraw = 0;
      this.img.count = this.img.count + 1 || 1;

      setTimeout(function(){
        player.img.canDraw = 1;
      }, 1000/(delay*2) );
    };

      cnvs.ctx.translate(C.PDNG, 71+C.PDNG);
      cnvs.ctx.drawImage(this.img, 50*(this.img.count-1), 0, this.w, this.h, this.x, this.y, this.w, this.h);
      cnvs.ctx.translate(-C.PDNG, -(71+C.PDNG));

    if (angle){
      cnvs.ctx.restore();
    };
  };

  player.drawFrame = function(){

    var angle = this.direction || 0;

    if (angle){
      var _dx = this.x+C.PDNG + this.w / 2;
      var _dy = this.y+71+C.PDNG + this.h / 2;
      angle = angle * (Math.PI/180);
      cnvs.ctx.save();
      cnvs.ctx.translate(_dx,_dy);
      cnvs.ctx.rotate(angle);
      cnvs.ctx.translate(-_dx,-_dy);
    };

    cnvs.ctx.translate(C.PDNG, 71+C.PDNG);
    cnvs.ctx.drawImage(this.img, 0, 0, this.w, this.h, this.x, this.y, this.w, this.h);
    cnvs.ctx.translate(-C.PDNG, -(71+C.PDNG));

    if (angle){
      cnvs.ctx.restore();
    };
  };

  player.setDirection = function(direction){
    this.direction = direction;
  };

  return player;
};



//menu
var logo = new ImgButton( res.arrImages[1], C.WIDTH/2-450/2, 20, 450, 150, "", "logo", 0 );
var menu = createMenu(["Играть", "Уровни", "Настройки"],["play", "change_level", "options"]);


//background 
var matrix = createMatrixBG(); //bg уровня
var bgLevel = new Image( res.arrImages[8], 0, 0, C.WIDTH, C.HEIGHT );
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//game header
var header = new Image( res.arrImages[2], 0, 0, C.WIDTH, 70+C.PDNG );
var bFullScr = new ImgButton( res.arrImages[3], C.WIDTH-45-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "fullScr", 0 );
var stopWatch = new Button( 10, header.h/2-C.CNV_BORDER/2 - 40/2, 120, 40, "transparent", "00 : 00 : 00", "stopwatch", 25, "dited" );
var bPause = new ImgButton( res.arrImages[4], C.WIDTH-45-7-bFullScr.w-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "pause", 0 );
var currLevel = new Button( (stopWatch.x+stopWatch.w+bPause.x)/2-140/2, header.h/2-C.CNV_BORDER/2 - 40/2, 140, 40, "transparent", "Уровень", "curr_level", 25, "capture_it" );


//change level
var levelsHeader = new Button( 0, 0, C.WIDTH, 50+C.PDNG, "black", "Выбор уровня", "levels_header", 27 );
var bLevelsButtons = createLevelsButtons(5);
var levelsFooter = createLevelsFooter();


//win pop-up
var winPopUp = createWinPopUp();


//pause pop-up
var pausePopUp = createPausePopUp(["Вернуться", "Заново", "Выход"],["return", "restart", "exit"], "20");


//playable obj
var pl = new Rect(0,0,50,50,"black");  //игрок
var box = new Playable(res.arrImages[6],0,0,50,50); //бокс
var door = new Playable(res.arrImages[7],0,0,50,50); //дверь
var walls = []; //стены на уровне, заполняется выбранным уровнем.
var pl = createPlayer();


//videos
var animateBg = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[0]);


module.exports = objects = {

  matrix : matrix,
  logo : logo,
  menu : menu,
  header : header,
  stopWatch : stopWatch,
  bPause : bPause,
  bFullScr : bFullScr,
  pl : pl,
  box : box,
  door : door,
  walls : walls,
  bgLevel : bgLevel,
  winPopUp : winPopUp,
  pausePopUp : pausePopUp,
  bgOpacity : bgOpacity,
  currLevel : currLevel,
  levelsHeader : levelsHeader,
  bLevelsButtons : bLevelsButtons,
  levelsFooter : levelsFooter,
  TEST : new Rect(0,0,C.WIDTH,C.HEIGHT,"black"),
  animateBg : animateBg
  
};

},{"./_canvas.js":1,"./_const.js":2,"./_resourses.js":11}],11:[function(require,module,exports){
var resourses = {
  images : true,
  video : false,

  areLoaded : function(){
    return this.video && this.images
  }
};

function loadVideo(arrSrcsOfVideo){

  var arrVideos = []; 
  var count = arrSrcsOfVideo.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var video = document.createElement('video');
    video.src = arrSrcsOfVideo[i];
    video.onloadeddata = function(){
      video.oncanplaythrough = function(){
        loadCount++;
        video.loop = true;
        if ( loadCount == count ) resourses.video = true;
      };
    };

    arrVideos.push(video);

  };

  return arrVideos;
};

function loadImages(arrSrcsOfImages){

  var arrImages = []; 
  var count = arrSrcsOfImages.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var img = document.createElement('img');
    img.src = arrSrcsOfImages[i];
    img.onload = function(){
      loadCount++;
      if ( loadCount == count ) resourses.images = true;
    };
    
    arrImages.push(img);

  };

  return arrImages;
};

var arrVideos = loadVideo([
  "../video/bg.mp4"
]);

var arrImages = loadImages([
  "../img/button-menu.svg",
  "../img/logo.png",
  "../img/header3.svg",
  "../img/fullscreen.svg",
  "../img/pause.svg",
  "../img/wall.svg",
  "../img/crystall-01.svg",
  "../img/portal.svg",
  "../img/ground.jpg",
  '../img/player.png'
]);

module.exports = { 

  resourses : resourses,

  arrVideos : arrVideos,

  arrImages : arrImages  

};



},{}],12:[function(require,module,exports){
var o = require('./_objects.js');
var game = require('./_gameLoops.js');

var pause = 0;
var beginTime = 0;
var currentTime = 0;
var upTimeTO;

function upTime(countFrom) {
	var now = new Date();
	var difference = (now-countFrom + currentTime);

	var hours=Math.floor((difference%(60*60*1000*24))/(60*60*1000)*1);
	var mins=Math.floor(((difference%(60*60*1000*24))%(60*60*1000))/(60*1000)*1);
	var secs=Math.floor((((difference%(60*60*1000*24))%(60*60*1000))%(60*1000))/1000*1);

	hours = ( hours < 10) ? "0"+hours : hours;
	mins = ( mins < 10) ? "0"+mins : mins;
	secs = ( secs < 10) ? "0"+secs : secs;

	o.stopWatch.txt = hours+" : "+mins+" : "+secs;

	clearTimeout(upTimeTO);
	upTimeTO=setTimeout(function(){ upTime(countFrom); },1000/60);
};

module.exports = { 

	start : function() {
		// if (game.status == 'game' || gameLoops.status == "menu" || gameLoops.status == "pause" || gameLoops.status == "levels") {
			upTime(new Date());
			var nowT = new Date();
			beginTime = nowT.getTime();
		// } else {
		// 	this.reset();
		// };
	},

	reset : function() {
		currentTime = 0;
		clearTimeout(upTimeTO);

		o.stopWatch.txt = "00 : 00 : 00";
		// this.start();
	},

	pauseTimer : function(){
		var curData = new Date();
		currentTime = curData.getTime() - beginTime + currentTime;
		clearTimeout(upTimeTO);
	}

};
},{"./_gameLoops.js":6,"./_objects.js":10}],13:[function(require,module,exports){
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Button = function(x, y, w, h, color, txt, name, fSize, fontFam){
  
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = color;
  this.txt = txt;
  this.name = name;
  this.fSize = fSize;
  this.txtColor = "white";
  this.fontFam = fontFam || "Arial";

  this.draw = function(noCenter, padd){

    var _padd = padd || 5;
    var _x = ( !noCenter ) ? this.x+this.w/2 : this.x+_padd;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = this.txtColor;
    ctx.textAlign = ( !noCenter ) ? "center" : "start";
    ctx.font = this.fSize + 'px '+this.fontFam;
    ctx.textBaseline="middle"; 
    ctx.fillText(this.txt, _x, this.y+this.h/2);
  };

};
},{"./../_canvas.js":1}],14:[function(require,module,exports){
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Image = function(img, x, y, w, h, opacity){

  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.img = img;
  this.opacity = opacity || 1;

  this.draw = function(){
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    ctx.restore();
  };


};
},{"./../_canvas.js":1}],15:[function(require,module,exports){
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = ImgButton = function(img, x, y, w, h, txt, name, fSize, setCenter, noCenter, padd){

  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.img = img;
  this.txt = txt;
  this.name = name;
  this.fSize = fSize;
  this.txtColor = "white";
  this.setCenter = setCenter || this.x;
  this.noCenter = noCenter || false;
  this.padd = padd || 5;

  var metrics = ctx.measureText(this.txt).width;
  var _x = ( !this.noCenter ) ? this.setCenter+this.w/2 : this.x+this.padd;

  this.draw = function(){

    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);

    ctx.fillStyle = this.txtColor;
    ctx.textAlign = ( !this.noCenter ) ? "center" : "start";
    ctx.font = this.fSize + 'px capture_it';
    ctx.textBaseline="middle"; 
    ctx.fillText(this.txt, _x, this.y+this.h/2);
  };

};
},{"./../_canvas.js":1}],16:[function(require,module,exports){
var C = require('./../_const.js');
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Playable = function(img, x, y, w, h){ //класс кубик
  this.img = img;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  this.draw = function(){
    ctx.save();
    ctx.translate(C.PDNG, 71+C.PDNG);
    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    ctx.restore();
  };
  
  this.move = function(direction){
    switch(direction){
      case "up" : 
      this.y -= this.h+C.PDNG;
      break;
      case "down" : 
      this.y += this.h+C.PDNG;
      break;
      case "left" :
      this.x -= this.w+C.PDNG;
      break;
      case "right" : 
      this.x += this.w+C.PDNG;
      break;
    }
  };

  this.randomPosition = function(){
    this.x = getRandomInt(1,7)*(this.w+C.PDNG)+C.PDNG;
    this.y = getRandomInt(2,8)*(this.h+C.PDNG)+C.PDNG;
  };

  this.setPosition = function(x,y){
    this.x = x;
    this.y = y;
  };

};
},{"./../_canvas.js":1,"./../_const.js":2}],17:[function(require,module,exports){
var C = require('./../_const.js');
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Rect = function(x, y, w, h, color, isStroke){ //класс кубик
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = color;
  this.isStroke = isStroke || false;

  this.draw = function(){
    ctx.save();
    ctx.translate(C.PDNG, 71+C.PDNG);
    if (!this.isStroke) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    } else {
      ctx.strokeStyle = this.color;
      ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
    ctx.restore();
  };
  
  this.move = function(direction){
    switch(direction){
      case "up" : 
      this.y -= this.h+C.PDNG;
      break;
      case "down" : 
      this.y += this.h+C.PDNG;
      break;
      case "left" :
      this.x -= this.w+C.PDNG;
      break;
      case "right" : 
      this.x += this.w+C.PDNG;
      break;
    }
  };

  this.randomPosition = function(){
    this.x = getRandomInt(1,7)*(this.w+C.PDNG)+C.PDNG;
    this.y = getRandomInt(2,8)*(this.h+C.PDNG)+C.PDNG;
  };

  this.setPosition = function(x,y){
    this.x = x;
    this.y = y;
  };

};
},{"./../_canvas.js":1,"./../_const.js":2}],18:[function(require,module,exports){
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Video = function(x, y, w, h, video){

  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.video = video;

  this.draw = function(){
    if (this.video) {
      this.video.play();
      canvas.ctx.drawImage(this.video, this.x, this.y, this.w, this.h);
    };
  };

};
},{"./../_canvas.js":1}],19:[function(require,module,exports){
var C = require('./../_const.js');
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Wall = function(img, x, y, w, h){ //класс кубик
  this.img = img;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  this.draw = function(){
    ctx.save();
    ctx.translate(C.PDNG, 71+C.PDNG);
    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    ctx.restore();
  };
  
  this.randomPosition = function(){
    this.x = getRandomInt(1,7)*(this.w+C.PDNG)+C.PDNG;
    this.y = getRandomInt(2,8)*(this.h+C.PDNG)+C.PDNG;
  };

  this.setPosition = function(x,y){
    this.x = x;
    this.y = y;
  };

};
},{"./../_canvas.js":1,"./../_const.js":2}],20:[function(require,module,exports){
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


},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Button.js":13,"./classes/Image.js":14,"./classes/ImgButton.js":15,"./classes/Playable.js":16,"./classes/Rect.js":17,"./classes/Video.js":18,"./classes/Wall.js":19}]},{},[20])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcmVzb3Vyc2VzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3N0b3B3YXRjaC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvQnV0dG9uLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWFnZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvSW1nQnV0dG9uLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9QbGF5YWJsZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvUmVjdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvVmlkZW8uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1dhbGwuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9mYWtlXzg2YzQyZGFkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBjbnYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxudmFyIGN0eCA9IGNudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG5jbnYuc3R5bGUuYm9yZGVyID0gXCIycHggc29saWQgYmxhY2tcIjtcclxuY252LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcclxuY252LndpZHRoID0gQy5XSURUSDtcclxuY252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGNudiA6IGNudixcclxuXHJcblx0Y3R4IDogY3R4XHJcblxyXG59OyIsInZhciBQQUREID0gMTsgXHRcdFx0XHRcdFx0Ly/Qv9Cw0LTQtNC40L3Qsywg0LrQvtGC0L7RgNGL0Lkg0Y8g0YXQvtGH0YMg0YfRgtC+0LHRiyDQsdGL0LssINC80LXQtiDQutCy0LDQtNGA0LDRgtCw0LzQuFxyXG52YXIgV0lEVEggPSBQQUREICsgKFBBREQrNTApKjk7IFx0Ly/RiNC40YDQuNC90LAg0LrQsNC90LLRi1xyXG52YXIgSEVJR0hUID0gMjArUEFERCArIChQQUREKzUwKSoxMDsgICAvL9Cy0YvRgdC+0YLQsCDQutCw0L3QstGLXHJcbnZhciBDTlZfQk9SREVSID0gMjtcclxudmFyIEhFQURFUl9IID0gNzE7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0UERORyA6IFBBREQsXHJcblxyXG5cdFdJRFRIIDogV0lEVEgsXHJcblxyXG5cdEhFSUdIVCA6IEhFSUdIVCxcclxuXHJcblx0Q05WX0JPUkRFUiA6IENOVl9CT1JERVIsXHJcblxyXG5cdEhFQURFUl9IIDogSEVBREVSX0hcclxuXHJcbn07XHJcbiIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKtC60YDQvtGB0LHRgNCw0YPQt9C10YDQvdC+0LUg0YPQv9GA0LLQu9C10L3QuNC1INGG0LjQutC70LDQvNC4INC40LPRgNGLKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNldEdhbWVFbmdpbmUoKXtcclxuXHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0XHRnYW1lRW5naW5lU3RlcCgpO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgc3cgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIGZzID0gcmVxdWlyZSgnLi9fZnVsbFNjcmVlbi5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBrZXkgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxuXHJcbnZhciBnYW1lTG9vcHMgPSBnTG9vO1xyXG5cclxudmFyIGlzQm9yZGVyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiDQvtCx0YrQtdC60YIsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC+0LzQuSDQs9GA0LDQvdC40YbRiyDQutCw0L3QstGLXHJcbiAgdXAgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai55ID09IDA7XHJcbiAgfSxcclxuXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnkgPT0gQy5IRUlHSFQgLSBvYmouaCAtIEMuUERORyAtIEMuSEVBREVSX0ggLSBDLlBETkc7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gMDtcclxuICB9LFxyXG5cclxuICByaWdodCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gQy5XSURUSCAtIG9iai53IC0gQy5QRE5HIC0gQy5QRE5HXHJcbiAgfVxyXG59O1xyXG5cclxudmFyIGlzTmVhciA9IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIgMiDQvtCx0YrQtdC60YLQsCwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10LzQvtC5INGB0YLQvtGA0L7QvdGLIDHRi9C5INC+0YIgMtCz0L4uXHJcblxyXG4gIHVwIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueSArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzIueSArIG9ial8yLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnkgJiYgb2JqXzEueCA9PSBvYmpfMltpXS54O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gIH0sXHJcblxyXG4gIGxlZnQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS54ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi54ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9LFxyXG5cclxuICByaWdodCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGRpcmVjdGlvbklzKGRpcmVjdGlvbil7ICAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGD0LPQvtC7INC/0L7QstC+0YDQvtGC0LAg0LIg0LPRgNCw0LTRg9GB0LDRhVxyXG5cclxuICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuXHJcbiAgICBjYXNlIFwidXBcIiAgIDogcmV0dXJuIDM2MDtcclxuICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImRvd25cIiA6IHJldHVybiAxODA7XHJcbiAgICBicmVhaztcclxuICAgIGNhc2UgXCJsZWZ0XCIgOiByZXR1cm4gMjcwO1xyXG4gICAgYnJlYWs7XHJcbiAgICBjYXNlIFwicmlnaHRcIjogcmV0dXJuIDkwO1xyXG4gICAgYnJlYWs7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjYW5Nb3ZlT2JqKGRpcmVjdGlvbil7ICAvLyjQvtC/0LjRgdGL0LLQsNC10Lwg0LPRgNCw0L3QuNGG0Ysg0LTQstC40LbQtdC90LjRjykg0YDQsNC30YDQtdGI0LDQtdGCINC00LLQuNC20LXQvdC40LUg0LIg0L/RgNC10LTQtdC70LDRhSDRg9GA0L7QstC90Y9cclxuXHJcbiAgby5wbC5kaXJlY3Rpb24gPSBvLnBsLmlzTW92ZSA9IGRpcmVjdGlvbklzKGRpcmVjdGlvbik7XHJcbiAgaWYgKCBpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5ib3gpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLmJveCwgby53YWxscykgKXsgLy/QtdGB0LvQuCDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDRj9GJ0LjQuiDQvdC1INGDINCz0YDQsNC90LjRhiwg0LTQstC40LPQsNC10LwuXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIG8uYm94Lm1vdmUoZGlyZWN0aW9uKTtcclxuICB9IGVsc2UgaWYoICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5wbCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0L3QtSDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0LPRgNCw0L3QuNGG0LXQuSwg0LTQstC40LPQsNC10LzRgdGPLlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNDdXJzb3JJbkJ1dHRvbih4LHksYnV0KXsgLy/QstC+0LfQstGA0LDRidCw0LXRgiDRgtGA0YMsINC10YHQu9C4INC60YPRgNGB0L7RgCDQv9C+0L/QsNC7INCyINC60L7QvtGA0LTQuNC90LDRgtGLINC+0LHRitC10LrRgtCwXHJcbiAgcmV0dXJuIHggPj0gYnV0LnggJiYgXHJcbiAgeCA8PSBidXQueCtidXQudyAmJiBcclxuICB5ID49IGJ1dC55ICYmIFxyXG4gIHkgPD0gYnV0LnkrYnV0LmhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGxvYWRMZXZlbChudW1iZXIpeyAvL9C30LDQs9GA0YPQt9C60LAg0YPRgNC+0LLQvdGPXHJcbiAgc3cuc3RhcnQoKTtcclxuICBsZXZlbHNbbnVtYmVyXSgpOyBcclxuICBnYW1lTG9vcHMuY3VycmVudExldmVsID0gbnVtYmVyOyBcclxuICBvLmN1cnJMZXZlbC50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK251bWJlcjtcclxuICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLmdhbWUpO1xyXG59O1xyXG5cclxud2luZG93Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGUpeyAvL9GB0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC60LvQsNCy0LjRiNGMXHJcblxyXG4gIGlmICggZ0xvby5zdGF0dXMgPT0gXCJnYW1lXCIgKXsgLy/Qv9C10YDQtdC00LLQuNCz0LDRgtGM0YHRjyDRgtC+0LvRjNC60L4g0LXRgdC70Lgg0LjQtNC10YIg0LjQs9GA0LAuXHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiRFwiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJyaWdodFwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJTXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcImRvd25cIik7XHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiV1wiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJ1cFwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJBXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcImxlZnRcIik7XHJcblxyXG4gIH07XHJcblxyXG4gIHdpbmRvdy5vbmtleXVwID0gZnVuY3Rpb24oZSl7XHJcbiAgICBvLnBsLmlzTW92ZSA9IGZhbHNlO1xyXG4gIH07XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKXsgLy9j0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC80YvRiNC60LhcclxuXHJcbiAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcblxyXG4gIHN3aXRjaCAoZ0xvby5zdGF0dXMpe1xyXG5cclxuICAgIGNhc2UgXCJtZW51XCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLm1lbnVbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInBsYXlcIiA6XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiY2hhbmdlX2xldmVsXCIgOlxyXG4gICAgICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLmxldmVscyk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImxldmVsc1wiIDpcclxuICAgICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5sZXZlbHNGb290ZXJbaV0pICl7XHJcbiAgICAgICAgICBzd2l0Y2ggKG8ubGV2ZWxzRm9vdGVyW2ldLm5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmV2XCIgOlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcItCa0L3QvtC/0LrQsCDQvdCw0LfQsNC0LCDQv9C+0LrQsCDRgtCw0LouXCIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJ0b19tZW51XCIgOlxyXG4gICAgICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJuZXh0XCIgOlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcItCa0L3QvtC/0LrQsCDQstC/0LXRgNC10LQsINC/0L7QutCwINGC0LDQui5cIik7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG8uYkxldmVsc0J1dHRvbnMubGVuZ3RoOyBpKysgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkxldmVsc0J1dHRvbnNbaV0pICl7XHJcbiAgICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsID0gaSsxO1xyXG4gICAgICAgICAgbG9hZExldmVsKGkrMSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImdhbWVcIiA6XHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iUGF1c2UpICl7XHJcbiAgICAgICAgc3cucGF1c2VUaW1lcigpO1xyXG4gICAgICAgIG8uYmdPcGFjaXR5LmRyYXcoKTtcclxuICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLnBhdXNlKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKXtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhDLkhFSUdIVCk7XHJcbiAgICAgICAgLy8gY2FudmFzLmNudi53aWR0aCA9IGNhbnZhcy5jbnYud2lkdGgqMjtcclxuICAgICAgICAvLyBjYW52YXMuY252LmhlaWdodCA9IGNhbnZhcy5jbnYuaGVpZ2h0KjI7XHJcbiAgICAgICAgLy8gY2FudmFzLmN0eC5zY2FsZSgyLDIpO1xyXG4gICAgICAgICggIWZzLnN0YXR1cyApID8gZnMubGF1bmNoRnVsbFNjcmVlbihjYW52YXMuY252KSA6IGZzLmNhbnNlbEZ1bGxTY3JlZW4oKTsgXHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJ3aW5cIiA6XHJcblxyXG4gICAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ud2luUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICAgICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCAhPSBsZXZlbHMubHZsc0NvdW50KCkgKXtcclxuICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCsrO1xyXG4gICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJwYXVzZVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ucGF1c2VQb3BVcFtpXSkgKXtcclxuICAgICAgICAgIHN3aXRjaCAoby5wYXVzZVBvcFVwW2ldLm5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJyZXR1cm5cIiA6XHJcbiAgICAgICAgICAgICAgc3cuc3RhcnQoKTtcclxuICAgICAgICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLmdhbWUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJlc3RhcnRcIiA6XHJcbiAgICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiZXhpdFwiIDpcclxuICAgICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgfTtcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRsYXVuY2hGdWxsU2NyZWVuIDogZnVuY3Rpb24oZWxlbSl7XHJcblxyXG5cdFx0aWYgKCBlbGVtLnJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ubW96UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5tb3pSZXF1c3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBlbGVtLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5zdGF0dXMgPSB0cnVlOyBcclxuXHR9LFxyXG5cclxuXHRjYW5zZWxGdWxsU2NyZWVuIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHRpZiAoIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuc3RhdHVzID0gZmFsc2U7XHJcblx0fSxcclxuXHJcblx0c3RhdHVzIDogZmFsc2VcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG4vL1ZSRU1FTk5PISEhXHJcbnZhciBjdHggPSByZXF1aXJlKCcuL19jYW52YXMuanMnKS5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVMb29wcyA9ICB7XHJcblxyXG4gIGxvYWRlciA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwibG9hZGVyXCI7XHJcblxyXG4gICAgby5URVNULmRyYXcoKTtcclxuICAgIGlmICggcmVzLnJlc291cnNlcy5hcmVMb2FkZWQoKSApIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIGdhbWUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImdhbWVcIjsgXHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTsgLy/QvtGH0LjRgdGC0LrQsCDQvtCx0LvQsNGB0YLQuFxyXG5cclxuICAgIC8v0JLQoNCV0JzQldCd0J3QniEhIVxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgIGN0eC5maWxsUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby5iZ0xldmVsLmRyYXcoKTtcclxuICAgIC8v0LLRi9Cy0L7QtNC40Lwg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1INC40LPRgNGLXHJcbiAgICBmb3IgKCBpIGluIG8ubWF0cml4ICl7XHJcbiAgICAgIG8ubWF0cml4W2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgICAvL9Cy0YvQstC+0LTQuNC8INGB0YLQtdC90YtcXNC/0YDQtdCz0YDQsNC00YtcclxuICAgIGZvciAoIGkgaW4gby53YWxscyApe1xyXG4gICAgICBvLndhbGxzW2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyoqKirQktGL0LLQvtC00LjQvCDQpdC10LTQtdGAKioqKipcclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgby5oZWFkZXIuZHJhdygpO1xyXG4gICAgby5zdG9wV2F0Y2guZHJhdygxLDEwKTtcclxuICAgIG8uYkZ1bGxTY3IuZHJhdygpO1xyXG4gICAgby5iUGF1c2UuZHJhdygpO1xyXG4gICAgby5jdXJyTGV2ZWwuZHJhdygpO1xyXG5cclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8qKioq0JLRi9Cy0L7QtNC40Lwg0L7QsdGK0LXQutGC0YsqKioqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBvLmRvb3IuZHJhdygpO1xyXG4gICAgby5wbC5kcmF3KCk7XHJcbiAgICBvLmJveC5kcmF3KCk7XHJcblxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyoqKirQldGB0LvQuCDQv9C+0LHQtdC00LjQu9C4KioqKipcclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgaWYgKCBoZi5pc1dpbigpICl7XHJcbiAgICAgIG8uYmdPcGFjaXR5LmRyYXcoKTtcclxuICAgICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy53aW4pO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJtZW51XCI7XHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICBvLmFuaW1hdGVCZy5kcmF3KCk7XHJcblxyXG4gICAgby5sb2dvLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICBvLm1lbnVbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICB3aW4gOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIndpblwiO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby53aW5Qb3BVcCApe1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcIndpbl90ZXh0XCIgKSBvLndpblBvcFVwW2ldLnR4dCA9IFwi0KPRgNC+0LLQtdC90YwgXCIrZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCtcIiDQv9GA0L7QudC00LXQvSFcIjtcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPT0gbGV2ZWxzLmx2bHNDb3VudCgpICkge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG8ud2luUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgICB9ICBcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgcGF1c2UgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcInBhdXNlXCI7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgby5wYXVzZVBvcFVwW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgbGV2ZWxzIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJsZXZlbHNcIjtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8ubGV2ZWxzSGVhZGVyLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8uYkxldmVsc0J1dHRvbnMgKXtcclxuICAgICAgby5iTGV2ZWxzQnV0dG9uc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5sZXZlbHNGb290ZXIgKXtcclxuICAgICAgby5sZXZlbHNGb290ZXJbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBzdGF0dXMgOiBcIlwiLFxyXG5cclxuICBjdXJyZW50TGV2ZWwgOiBcIjFcIlxyXG5cclxufTtcclxuIiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbGV2ZWxzID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgY2xlYXJSZWN0IDogZnVuY3Rpb24oeCx5LHcsaCl7ICAvL9C+0YfQuNGB0YLQuNGC0LXQu9GMXHJcbiAgICBjdHguY2xlYXJSZWN0KHgseSx3LGgpO1xyXG4gIH0sXHJcblxyXG4gIGdldFJhbmRvbUludCA6IGZ1bmN0aW9uKG1pbiwgbWF4KSB7IC8v0YTRg9C90LrRhtC40Y8g0LTQu9GPINGA0LDQvdC00L7QvNCwINGG0LXQu9C+0YfQuNGB0LvQtdC90L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRj1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbiAgfSxcclxuXHJcbiAgaXNXaW4gOiBmdW5jdGlvbigpeyAvL9C/0L7QsdC10LTQuNC70Lg/XHJcbiAgICByZXR1cm4gby5ib3gueCA9PSBvLmRvb3IueCAmJiBvLmJveC55ID09IG8uZG9vci55O1xyXG4gIH1cclxufTtcclxuIiwidmFyIGtleXMgPSB7XHJcblx0XCJXXCIgOiA4NyxcclxuXHRcIlNcIiA6IDgzLFxyXG5cdFwiQVwiIDogNjUsXHJcblx0XCJEXCIgOiA2OFxyXG59O1xyXG5cclxudmFyIGtleURvd24gPSAwO1xyXG4vLyB2YXIga2V5RG93biA9IHt9O1xyXG5cclxuZnVuY3Rpb24gc2V0S2V5KGtleUNvZGUpe1xyXG5cdGtleURvd24gPSBrZXlDb2RlO1xyXG5cdC8vIGtleURvd25ba2V5Y29kZV0gPSB0cnVlO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY2xlYXJLZXkoa2V5Q29kZSl7XHJcblx0a2V5RG93biA9IDA7XHJcblx0Ly8ga2V5RG93bltrZXlDb2RlXSA9IGZhbHNlO1xyXG59O1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdHNldEtleShlLmtleUNvZGUpO1xyXG59KTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBmdW5jdGlvbihlKXtcclxuXHRjbGVhcktleShlLmtleUNvZGUpO1xyXG59KTtcclxuXHJcblxyXG5mdW5jdGlvbiBpc0tleURvd24oa2V5TmFtZSl7XHJcblx0cmV0dXJuIGtleURvd25ba2V5c1trZXlOYW1lXV0gPT0gdHJ1ZTtcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdGlzS2V5RG93biA6IGZ1bmN0aW9uKGtleU5hbWUpe1xyXG5cdFx0cmV0dXJuIGtleURvd24gPT0ga2V5c1trZXlOYW1lXTtcclxuXHRcdC8vIHJldHVybiBrZXlEb3duW2tleXNba2V5TmFtZV1dID09IHRydWU7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGxldmVscyA9IHtcclxuXHJcblx0bHZsc0NvdW50IDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjb3VudCA9IDA7XHJcblx0XHRmb3Ioa2V5IGluIGxldmVscyl7IGNvdW50KysgfTtcclxuXHRcdFx0cmV0dXJuIGNvdW50LTE7XHJcblx0fSxcclxuXHJcblx0MSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgLy/QvNCw0YHRgdC40LIg0YEg0LHRg9C00YPRidC10L/QvtGB0YLRgNC+0LXQvdC90YvQvNC4INGB0YLQtdC90LrQsNC80LhcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzEsM10sWzEsNF0sWzEsNV0sWzIsMF0sWzIsNl0sWzIsOF0sWzMsMl0sWzQsMV0sWzQsM10sWzQsN10sWzUsNF0sWzYsNF0sWzYsNl0sWzcsMV0sWzcsOF0sWzgsMF0sWzgsNF0sWzgsNV1cclxuXHRcdF07XHRcdFx0XHQgIC8v0L/RgNC40LTRg9C80LDQvdC90YvQuSDQvNCw0YHRgdC40LIg0YHQviDRgdGC0LXQvdC60LDQvNC4XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgLy/Qt9Cw0L/QvtC70L3Rj9C10Lwg0LzQsNGB0YHQuNCyIHdhbGxzXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArMiooNTArQy5QRE5HKSwgNyooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDAqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQyIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMF0sWzAsNF0sWzAsM10sWzAsNl0sWzIsMl0sWzIsNF0sWzMsOF0sWzMsMF0sWzMsN10sWzQsMl0sWzQsNF0sWzQsNV0sWzQsNl0sWzUsMF0sWzYsMl0sWzYsNV0sWzYsNl0sWzYsN10sWzcsMF0sWzgsM10sWzgsNF0sWzgsN11cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArNiooNTArQy5QRE5HKSwgMCs3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCs2Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MyA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDJdLFswLDddLFsxLDVdLFsxLDhdLFsyLDJdLFsyLDddLFszLDRdLFs0LDFdLFs0LDRdLFs0LDZdLFs2LDJdLFs2LDNdLFs2LDRdLFs2LDZdLFs2LDhdLFs3LDBdLFs3LDVdLFs4LDBdLFs4LDFdLFs4LDNdLFs4LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArMSooNTArQy5QRE5HKSwgMCs2Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArMiooNTArQy5QRE5HKSwgMCszKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0NCA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDFdLFsxLDVdLFsxLDddLFsyLDRdLFszLDFdLFszLDNdLFszLDZdLFszLDhdLFs0LDNdLFs1LDVdLFs1LDddLFs2LDBdLFs2LDJdLFs2LDNdLFs2LDVdLFs3LDhdLFs4LDBdLFs4LDhdXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwKzcqKDUwK0MuUERORyksIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArNyooNTArQy5QRE5HKSwgMCs3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArNiooNTArQy5QRE5HKSwgMCswKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0NSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDFdLFswLDNdLFswLDVdLFswLDhdLFsyLDJdLFsyLDRdLFsyLDZdLFsyLDhdLFs0LDBdLFs0LDNdLFs0LDVdLFs0LDddLFs2LDFdLFs2LDJdLFs2LDRdLFs2LDddLFs3LDhdLFs4LDJdLFs4LDRdLFs4LDhdXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwKzAqKDUwK0MuUERORykgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzEqKDUwK0MuUERORyksIDArMSooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9XHJcblxyXG59O1xyXG4iLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBjbnZzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciByZXMgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxuXHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNYXRyaXhCRygpe1xyXG4gIHZhciBtYXRyaXggPSBbXTsgLy/QvNCw0YHRgdC40LIg0LTQu9GPINC80LDRgtGA0LjRh9C90L7Qs9C+INCy0LjQtNCwINGD0YDQvtCy0L3Rj1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKyl7IC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC+0LHRitC10LrRglxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCA5OyBqKyspe1xyXG4gICAgICBtYXRyaXgucHVzaCggbmV3IFJlY3QoaiooNTArQy5QRE5HKSwgaSooNTArQy5QRE5HKSwgNTAsIDUwLCBcInJnYmEoMCwwLDAsMC41KVwiLCB0cnVlKSApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBtYXRyaXhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnUodHh0QXJyLCBuYW1lQXJyKXsgIC8v0YHQvtC30LTQsNC10Lwg0LPQu9Cw0LLQvdC+0LUg0LzQtdC90Y5cclxuICB2YXIgbWVudSA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IG5hbWVBcnI7XHJcbiAgdmFyIHR4dCA9IHR4dEFycjtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcbiAgXHJcbiAgdmFyIF9mb250c2l6ZSA9IFwiMjhcIjtcclxuICB2YXIgX3ggPSBDLldJRFRILzItMzAwLzI7XHJcbiAgdmFyIF95ID0gKEMuSEVJR0hULzIpIC0gKDg1KmFtb3VudHMvMikgKyA4NTsgXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYW1vdW50czsgaSsrKXtcclxuICAgIG1lbnUucHVzaCggbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1swXSwgX3gsIF95K2kqODUsIDMwMCwgNjAsIHR4dFtpXSwgbmFtZXNbaV0sIF9mb250c2l6ZSwgMTM1ICkgKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gbWVudTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpblBvcFVwKCl7XHJcblxyXG4gIHZhciB3aW5Qb3BCRyA9IG5ldyBSZWN0KCBDLldJRFRILzItMjc1LzIsIEMuSEVJR0hULzItMTI1LzIsIDI3NSwgMTI1LCBcInJlZFwiICk7XHJcbiAgdmFyIGJQb3BFeGl0ID0gbmV3IEJ1dHRvbiggd2luUG9wQkcueCs1LCB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNS00MCwgOTAsIDQwLCBcImJsYWNrXCIsIFwi0JLRi9GF0L7QtFwiLCBcInBvcF9leGl0XCIsIDIwICk7XHJcbiAgdmFyIGJQb3BOZXh0ID0gbmV3IEJ1dHRvbiggd2luUG9wQkcueCt3aW5Qb3BCRy53LTUtOTAsIHdpblBvcEJHLnkrd2luUG9wQkcuaC01LTQwLCA5MCwgNDAsIFwiYmxhY2tcIiwgXCLQlNCw0LvQtdC1XCIsIFwicG9wX25leHRcIiwgMjAgKTtcclxuICB2YXIgd2luVGV4dCA9IG5ldyBCdXR0b24oIEMuV0lEVEgvMi05MC8yLCB3aW5Qb3BCRy55KzEwLCA5MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQo9GA0L7QstC10L3RjCBOINC/0YDQvtC50LTQtdC9IVwiLCBcIndpbl90ZXh0XCIsIDI1ICk7XHJcbiAgd2luVGV4dC50eHRDb2xvciA9IFwiYmxhY2tcIjtcclxuXHJcbiAgdmFyIHdpblBvcFVwID0gW107XHJcbiAgd2luUG9wVXAucHVzaCh3aW5Qb3BCRywgYlBvcEV4aXQsIGJQb3BOZXh0LCB3aW5UZXh0KTtcclxuXHJcbiAgcmV0dXJuIHdpblBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGF1c2VQb3BVcCh0eHRBcnIsIG5hbWVBcnIsIGZvbnRzaXplKXtcclxuXHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBfZm9udHNpemUgPSBmb250c2l6ZTtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcblxyXG4gIHZhciBfaGVpZ2h0ID0gKEMuSEVJR0hULzIpIC0gKDYwKmFtb3VudHMvMik7IFxyXG4gIHZhciBfd2lkdGggPSBDLldJRFRILzItMTUwLzI7XHJcblxyXG4gIHZhciBwYXVzZVBvcFVwID0gW25ldyBSZWN0KCBDLldJRFRILzItMjAwLzIsIF9oZWlnaHQtMzAsIDIwMCwgNjAqYW1vdW50cys0MCwgXCJyZWRcIiApXTtcclxuXHJcbiAgZm9yICh2YXIgaT0wOyBpPGFtb3VudHM7IGkrKyl7XHJcbiAgICBwYXVzZVBvcFVwLnB1c2goIG5ldyBCdXR0b24oIF93aWR0aCwgX2hlaWdodCtpKjYwLCAxNTAsIDQwLCBcImJsYWNrXCIsIHR4dFtpXSwgbmFtZXNbaV0sIF9mb250c2l6ZSApICk7IFxyXG4gIH07XHJcblxyXG4gIHJldHVybiBwYXVzZVBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzQnV0dG9ucyhsZXZlbHNfY291bnQpe1xyXG5cclxuICB2YXIgYkxldmVsc0J1dHRvbnMgPSBbXTtcclxuICB2YXIgaiA9IDAsIGR5ID0gNzUsIGR4ID0gMDtcclxuXHJcbiAgZm9yICggaT0wOyBpIDwgbGV2ZWxzX2NvdW50OyBpKyspe1xyXG4gICAgZHggPSA4K2oqKDEwMCsxNSk7XHJcblxyXG4gICAgYkxldmVsc0J1dHRvbnMucHVzaCggbmV3IEJ1dHRvbiggZHgsIGR5LCAxMDAsIDEwMCwgXCJibGFja1wiLCBpKzEsIFwibGV2ZWxfXCIrKGkrMSksIDI1ICkgKTtcclxuXHJcbiAgICBqKys7XHJcblxyXG4gICAgaWYgKCBkeCA+IEMuV0lEVEgtMTE1ICl7XHJcbiAgICAgIGR5ICs9ICgxMjUpO1xyXG4gICAgICBqID0gMDtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGJMZXZlbHNCdXR0b25zO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzRm9vdGVyKCl7XHJcblxyXG4gIHZhciBsZXZlbHNGb290ZXIgPSBbXTtcclxuXHJcbiAgdmFyIGJQcmV2ID0gbmV3IEJ1dHRvbiggMTAsIEMuSEVJR0hULTEwLTUwLCAxMDAsIDUwLCBcIiMzNEJBQ0FcIiwgXCLQndCw0LfQsNC0XCIsIFwicHJldlwiLCAyNSApO1xyXG4gIHZhciBiTmV4dCA9IG5ldyBCdXR0b24oIEMuV0lEVEgtMTAtMTAwLCBDLkhFSUdIVC0xMC01MCwgMTAwLCA1MCwgXCIjMzRCQUNBXCIsIFwi0JTQsNC70LXQtVwiLCBcIm5leHRcIiwgMjUgKTtcclxuICB2YXIgYlRvTWVudSA9IG5ldyBCdXR0b24oIChiUHJldi54K2JQcmV2LncrYk5leHQueCkvMi0yMjUvMiwgQy5IRUlHSFQtMTAtNTAsIDIyNSwgNTAsIFwiIzM0QkFDQVwiLCBcItCS0LXRgNC90YPRgtGM0YHRjyDQsiDQvNC10L3RjlwiLCBcInRvX21lbnVcIiwgMjUgKTtcclxuXHJcbiAgbGV2ZWxzRm9vdGVyLnB1c2goYlByZXYsYk5leHQsYlRvTWVudSk7XHJcblxyXG4gIHJldHVybiBsZXZlbHNGb290ZXI7XHJcbn07XHJcblxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQbGF5ZXIoKXtcclxuXHJcbiAgdmFyIHBsYXllciA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzldLDAsMCw1MCw1MCk7XHJcbiAgcGxheWVyLmRpcmVjdGlvbiA9IGZhbHNlO1xyXG4gIHBsYXllci5pc01vdmUgPSBmYWxzZTtcclxuXHJcbiAgcGxheWVyLmRyYXcgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIGlmKHRoaXMuaXNNb3ZlKXtcclxuICAgICAgdGhpcy5kcmF3QW5pbWF0aW9uKDMsIDIsIHRoaXMuZGlyZWN0aW9uKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRyYXdGcmFtZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuZHJhd0FuaW1hdGlvbiA9IGZ1bmN0aW9uKGZyYW1lcywgZGVsYXksIGFuZ2xlKXtcclxuXHJcbiAgICB0aGlzLmltZy5jYW5EcmF3ID0gKCB0aGlzLmltZy5jYW5EcmF3ID09PSB1bmRlZmluZWQgKSA/IDEgOiB0aGlzLmltZy5jYW5EcmF3O1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIHZhciBfZHggPSB0aGlzLngrQy5QRE5HICsgdGhpcy53IC8gMjtcclxuICAgICAgdmFyIF9keSA9IHRoaXMueSs3MStDLlBETkcgKyB0aGlzLmggLyAyO1xyXG4gICAgICBhbmdsZSA9IGFuZ2xlICogKE1hdGguUEkvMTgwKTtcclxuICAgICAgY252cy5jdHguc2F2ZSgpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoX2R4LF9keSk7XHJcbiAgICAgIGNudnMuY3R4LnJvdGF0ZShhbmdsZSk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtX2R4LC1fZHkpO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodGhpcy5pbWcuY2FuRHJhdyA9PSAxKXtcclxuICAgICAgaWYgKHRoaXMuaW1nLmNvdW50ID09IGZyYW1lcykgdGhpcy5pbWcuY291bnQgPSAxO1xyXG5cclxuICAgICAgdGhpcy5pbWcuY2FuRHJhdyA9IDA7XHJcbiAgICAgIHRoaXMuaW1nLmNvdW50ID0gdGhpcy5pbWcuY291bnQgKyAxIHx8IDE7XHJcblxyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcGxheWVyLmltZy5jYW5EcmF3ID0gMTtcclxuICAgICAgfSwgMTAwMC8oZGVsYXkqMikgKTtcclxuICAgIH07XHJcblxyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgICBjbnZzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDUwKih0aGlzLmltZy5jb3VudC0xKSwgMCwgdGhpcy53LCB0aGlzLmgsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtQy5QRE5HLCAtKDcxK0MuUERORykpO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIGNudnMuY3R4LnJlc3RvcmUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLmRyYXdGcmFtZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgdmFyIGFuZ2xlID0gdGhpcy5kaXJlY3Rpb24gfHwgMDtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICB2YXIgX2R4ID0gdGhpcy54K0MuUERORyArIHRoaXMudyAvIDI7XHJcbiAgICAgIHZhciBfZHkgPSB0aGlzLnkrNzErQy5QRE5HICsgdGhpcy5oIC8gMjtcclxuICAgICAgYW5nbGUgPSBhbmdsZSAqIChNYXRoLlBJLzE4MCk7XHJcbiAgICAgIGNudnMuY3R4LnNhdmUoKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKF9keCxfZHkpO1xyXG4gICAgICBjbnZzLmN0eC5yb3RhdGUoYW5nbGUpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoLV9keCwtX2R5KTtcclxuICAgIH07XHJcblxyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGNudnMuY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy53LCB0aGlzLmgsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoLUMuUERORywgLSg3MStDLlBETkcpKTtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICBjbnZzLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5zZXREaXJlY3Rpb24gPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHBsYXllcjtcclxufTtcclxuXHJcblxyXG5cclxuLy9tZW51XHJcbnZhciBsb2dvID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxXSwgQy5XSURUSC8yLTQ1MC8yLCAyMCwgNDUwLCAxNTAsIFwiXCIsIFwibG9nb1wiLCAwICk7XHJcbnZhciBtZW51ID0gY3JlYXRlTWVudShbXCLQmNCz0YDQsNGC0YxcIiwgXCLQo9GA0L7QstC90LhcIiwgXCLQndCw0YHRgtGA0L7QudC60LhcIl0sW1wicGxheVwiLCBcImNoYW5nZV9sZXZlbFwiLCBcIm9wdGlvbnNcIl0pO1xyXG5cclxuXHJcbi8vYmFja2dyb3VuZCBcclxudmFyIG1hdHJpeCA9IGNyZWF0ZU1hdHJpeEJHKCk7IC8vYmcg0YPRgNC+0LLQvdGPXHJcbnZhciBiZ0xldmVsID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzhdLCAwLCAwLCBDLldJRFRILCBDLkhFSUdIVCApO1xyXG52YXIgYmdPcGFjaXR5ID0gbmV3IFJlY3QoMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIFwicmdiYSgwLCAwLCAwLCAwLjUpXCIpO1xyXG5cclxuXHJcbi8vZ2FtZSBoZWFkZXJcclxudmFyIGhlYWRlciA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1syXSwgMCwgMCwgQy5XSURUSCwgNzArQy5QRE5HICk7XHJcbnZhciBiRnVsbFNjciA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbM10sIEMuV0lEVEgtNDUtMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwiZnVsbFNjclwiLCAwICk7XHJcbnZhciBzdG9wV2F0Y2ggPSBuZXcgQnV0dG9uKCAxMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDEyMCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCIwMCA6IDAwIDogMDBcIiwgXCJzdG9wd2F0Y2hcIiwgMjUsIFwiZGl0ZWRcIiApO1xyXG52YXIgYlBhdXNlID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1s0XSwgQy5XSURUSC00NS03LWJGdWxsU2NyLnctMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwicGF1c2VcIiwgMCApO1xyXG52YXIgY3VyckxldmVsID0gbmV3IEJ1dHRvbiggKHN0b3BXYXRjaC54K3N0b3BXYXRjaC53K2JQYXVzZS54KS8yLTE0MC8yLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTQwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMXCIsIFwiY3Vycl9sZXZlbFwiLCAyNSwgXCJjYXB0dXJlX2l0XCIgKTtcclxuXHJcblxyXG4vL2NoYW5nZSBsZXZlbFxyXG52YXIgbGV2ZWxzSGVhZGVyID0gbmV3IEJ1dHRvbiggMCwgMCwgQy5XSURUSCwgNTArQy5QRE5HLCBcImJsYWNrXCIsIFwi0JLRi9Cx0L7RgCDRg9GA0L7QstC90Y9cIiwgXCJsZXZlbHNfaGVhZGVyXCIsIDI3ICk7XHJcbnZhciBiTGV2ZWxzQnV0dG9ucyA9IGNyZWF0ZUxldmVsc0J1dHRvbnMoNSk7XHJcbnZhciBsZXZlbHNGb290ZXIgPSBjcmVhdGVMZXZlbHNGb290ZXIoKTtcclxuXHJcblxyXG4vL3dpbiBwb3AtdXBcclxudmFyIHdpblBvcFVwID0gY3JlYXRlV2luUG9wVXAoKTtcclxuXHJcblxyXG4vL3BhdXNlIHBvcC11cFxyXG52YXIgcGF1c2VQb3BVcCA9IGNyZWF0ZVBhdXNlUG9wVXAoW1wi0JLQtdGA0L3Rg9GC0YzRgdGPXCIsIFwi0JfQsNC90L7QstC+XCIsIFwi0JLRi9GF0L7QtFwiXSxbXCJyZXR1cm5cIiwgXCJyZXN0YXJ0XCIsIFwiZXhpdFwiXSwgXCIyMFwiKTtcclxuXHJcblxyXG4vL3BsYXlhYmxlIG9ialxyXG52YXIgcGwgPSBuZXcgUmVjdCgwLDAsNTAsNTAsXCJibGFja1wiKTsgIC8v0LjQs9GA0L7QulxyXG52YXIgYm94ID0gbmV3IFBsYXlhYmxlKHJlcy5hcnJJbWFnZXNbNl0sMCwwLDUwLDUwKTsgLy/QsdC+0LrRgVxyXG52YXIgZG9vciA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzddLDAsMCw1MCw1MCk7IC8v0LTQstC10YDRjFxyXG52YXIgd2FsbHMgPSBbXTsgLy/RgdGC0LXQvdGLINC90LAg0YPRgNC+0LLQvdC1LCDQt9Cw0L/QvtC70L3Rj9C10YLRgdGPINCy0YvQsdGA0LDQvdC90YvQvCDRg9GA0L7QstC90LXQvC5cclxudmFyIHBsID0gY3JlYXRlUGxheWVyKCk7XHJcblxyXG5cclxuLy92aWRlb3NcclxudmFyIGFuaW1hdGVCZyA9IG5ldyBWaWRlbygwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgcmVzLmFyclZpZGVvc1swXSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RzID0ge1xyXG5cclxuICBtYXRyaXggOiBtYXRyaXgsXHJcbiAgbG9nbyA6IGxvZ28sXHJcbiAgbWVudSA6IG1lbnUsXHJcbiAgaGVhZGVyIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCA6IHN0b3BXYXRjaCxcclxuICBiUGF1c2UgOiBiUGF1c2UsXHJcbiAgYkZ1bGxTY3IgOiBiRnVsbFNjcixcclxuICBwbCA6IHBsLFxyXG4gIGJveCA6IGJveCxcclxuICBkb29yIDogZG9vcixcclxuICB3YWxscyA6IHdhbGxzLFxyXG4gIGJnTGV2ZWwgOiBiZ0xldmVsLFxyXG4gIHdpblBvcFVwIDogd2luUG9wVXAsXHJcbiAgcGF1c2VQb3BVcCA6IHBhdXNlUG9wVXAsXHJcbiAgYmdPcGFjaXR5IDogYmdPcGFjaXR5LFxyXG4gIGN1cnJMZXZlbCA6IGN1cnJMZXZlbCxcclxuICBsZXZlbHNIZWFkZXIgOiBsZXZlbHNIZWFkZXIsXHJcbiAgYkxldmVsc0J1dHRvbnMgOiBiTGV2ZWxzQnV0dG9ucyxcclxuICBsZXZlbHNGb290ZXIgOiBsZXZlbHNGb290ZXIsXHJcbiAgVEVTVCA6IG5ldyBSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hULFwiYmxhY2tcIiksXHJcbiAgYW5pbWF0ZUJnIDogYW5pbWF0ZUJnXHJcbiAgXHJcbn07XHJcbiIsInZhciByZXNvdXJzZXMgPSB7XHJcbiAgaW1hZ2VzIDogdHJ1ZSxcclxuICB2aWRlbyA6IGZhbHNlLFxyXG5cclxuICBhcmVMb2FkZWQgOiBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHRoaXMudmlkZW8gJiYgdGhpcy5pbWFnZXNcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlkZW8oYXJyU3Jjc09mVmlkZW8pe1xyXG5cclxuICB2YXIgYXJyVmlkZW9zID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZlZpZGVvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgIHZpZGVvLnNyYyA9IGFyclNyY3NPZlZpZGVvW2ldO1xyXG4gICAgdmlkZW8ub25sb2FkZWRkYXRhID0gZnVuY3Rpb24oKXtcclxuICAgICAgdmlkZW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgbG9hZENvdW50Kys7XHJcbiAgICAgICAgdmlkZW8ubG9vcCA9IHRydWU7XHJcbiAgICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMudmlkZW8gPSB0cnVlO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBhcnJWaWRlb3MucHVzaCh2aWRlbyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJWaWRlb3M7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2VzKGFyclNyY3NPZkltYWdlcyl7XHJcblxyXG4gIHZhciBhcnJJbWFnZXMgPSBbXTsgXHJcbiAgdmFyIGNvdW50ID0gYXJyU3Jjc09mSW1hZ2VzLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgaW1nLnNyYyA9IGFyclNyY3NPZkltYWdlc1tpXTtcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICBsb2FkQ291bnQrKztcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMuaW1hZ2VzID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGFyckltYWdlcy5wdXNoKGltZyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJJbWFnZXM7XHJcbn07XHJcblxyXG52YXIgYXJyVmlkZW9zID0gbG9hZFZpZGVvKFtcclxuICBcIi4uL3ZpZGVvL2JnLm1wNFwiXHJcbl0pO1xyXG5cclxudmFyIGFyckltYWdlcyA9IGxvYWRJbWFnZXMoW1xyXG4gIFwiLi4vaW1nL2J1dHRvbi1tZW51LnN2Z1wiLFxyXG4gIFwiLi4vaW1nL2xvZ28ucG5nXCIsXHJcbiAgXCIuLi9pbWcvaGVhZGVyMy5zdmdcIixcclxuICBcIi4uL2ltZy9mdWxsc2NyZWVuLnN2Z1wiLFxyXG4gIFwiLi4vaW1nL3BhdXNlLnN2Z1wiLFxyXG4gIFwiLi4vaW1nL3dhbGwuc3ZnXCIsXHJcbiAgXCIuLi9pbWcvY3J5c3RhbGwtMDEuc3ZnXCIsXHJcbiAgXCIuLi9pbWcvcG9ydGFsLnN2Z1wiLFxyXG4gIFwiLi4vaW1nL2dyb3VuZC5qcGdcIixcclxuICAnLi4vaW1nL3BsYXllci5wbmcnXHJcbl0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuICByZXNvdXJzZXMgOiByZXNvdXJzZXMsXHJcblxyXG4gIGFyclZpZGVvcyA6IGFyclZpZGVvcyxcclxuXHJcbiAgYXJySW1hZ2VzIDogYXJySW1hZ2VzICBcclxuXHJcbn07XHJcblxyXG5cclxuIiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBnYW1lID0gcmVxdWlyZSgnLi9fZ2FtZUxvb3BzLmpzJyk7XHJcblxyXG52YXIgcGF1c2UgPSAwO1xyXG52YXIgYmVnaW5UaW1lID0gMDtcclxudmFyIGN1cnJlbnRUaW1lID0gMDtcclxudmFyIHVwVGltZVRPO1xyXG5cclxuZnVuY3Rpb24gdXBUaW1lKGNvdW50RnJvbSkge1xyXG5cdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG5cdHZhciBkaWZmZXJlbmNlID0gKG5vdy1jb3VudEZyb20gKyBjdXJyZW50VGltZSk7XHJcblxyXG5cdHZhciBob3Vycz1NYXRoLmZsb29yKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSkvKDYwKjYwKjEwMDApKjEpO1xyXG5cdHZhciBtaW5zPU1hdGguZmxvb3IoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKS8oNjAqMTAwMCkqMSk7XHJcblx0dmFyIHNlY3M9TWF0aC5mbG9vcigoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKSUoNjAqMTAwMCkpLzEwMDAqMSk7XHJcblxyXG5cdGhvdXJzID0gKCBob3VycyA8IDEwKSA/IFwiMFwiK2hvdXJzIDogaG91cnM7XHJcblx0bWlucyA9ICggbWlucyA8IDEwKSA/IFwiMFwiK21pbnMgOiBtaW5zO1xyXG5cdHNlY3MgPSAoIHNlY3MgPCAxMCkgPyBcIjBcIitzZWNzIDogc2VjcztcclxuXHJcblx0by5zdG9wV2F0Y2gudHh0ID0gaG91cnMrXCIgOiBcIittaW5zK1wiIDogXCIrc2VjcztcclxuXHJcblx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR1cFRpbWVUTz1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHVwVGltZShjb3VudEZyb20pOyB9LDEwMDAvNjApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRzdGFydCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly8gaWYgKGdhbWUuc3RhdHVzID09ICdnYW1lJyB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibWVudVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJwYXVzZVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJsZXZlbHNcIikge1xyXG5cdFx0XHR1cFRpbWUobmV3IERhdGUoKSk7XHJcblx0XHRcdHZhciBub3dUID0gbmV3IERhdGUoKTtcclxuXHRcdFx0YmVnaW5UaW1lID0gbm93VC5nZXRUaW1lKCk7XHJcblx0XHQvLyB9IGVsc2Uge1xyXG5cdFx0Ly8gXHR0aGlzLnJlc2V0KCk7XHJcblx0XHQvLyB9O1xyXG5cdH0sXHJcblxyXG5cdHJlc2V0IDogZnVuY3Rpb24oKSB7XHJcblx0XHRjdXJyZW50VGltZSA9IDA7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cclxuXHRcdG8uc3RvcFdhdGNoLnR4dCA9IFwiMDAgOiAwMCA6IDAwXCI7XHJcblx0XHQvLyB0aGlzLnN0YXJ0KCk7XHJcblx0fSxcclxuXHJcblx0cGF1c2VUaW1lciA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY3VyRGF0YSA9IG5ldyBEYXRlKCk7XHJcblx0XHRjdXJyZW50VGltZSA9IGN1ckRhdGEuZ2V0VGltZSgpIC0gYmVnaW5UaW1lICsgY3VycmVudFRpbWU7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdH1cclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b24gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvciwgdHh0LCBuYW1lLCBmU2l6ZSwgZm9udEZhbSl7XHJcbiAgXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcbiAgdGhpcy50eHRDb2xvciA9IFwid2hpdGVcIjtcclxuICB0aGlzLmZvbnRGYW0gPSBmb250RmFtIHx8IFwiQXJpYWxcIjtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24obm9DZW50ZXIsIHBhZGQpe1xyXG5cclxuICAgIHZhciBfcGFkZCA9IHBhZGQgfHwgNTtcclxuICAgIHZhciBfeCA9ICggIW5vQ2VudGVyICkgPyB0aGlzLngrdGhpcy53LzIgOiB0aGlzLngrX3BhZGQ7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy50eHRDb2xvcjtcclxuICAgIGN0eC50ZXh0QWxpZ24gPSAoICFub0NlbnRlciApID8gXCJjZW50ZXJcIiA6IFwic3RhcnRcIjtcclxuICAgIGN0eC5mb250ID0gdGhpcy5mU2l6ZSArICdweCAnK3RoaXMuZm9udEZhbTtcclxuICAgIGN0eC50ZXh0QmFzZWxpbmU9XCJtaWRkbGVcIjsgXHJcbiAgICBjdHguZmlsbFRleHQodGhpcy50eHQsIF94LCB0aGlzLnkrdGhpcy5oLzIpO1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2UgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgsIG9wYWNpdHkpe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMub3BhY2l0eSA9IG9wYWNpdHkgfHwgMTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguZ2xvYmFsQWxwaGEgPSB0aGlzLm9wYWNpdHk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG5cclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWdCdXR0b24gPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgsIHR4dCwgbmFtZSwgZlNpemUsIHNldENlbnRlciwgbm9DZW50ZXIsIHBhZGQpe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG4gIHRoaXMudHh0Q29sb3IgPSBcIndoaXRlXCI7XHJcbiAgdGhpcy5zZXRDZW50ZXIgPSBzZXRDZW50ZXIgfHwgdGhpcy54O1xyXG4gIHRoaXMubm9DZW50ZXIgPSBub0NlbnRlciB8fCBmYWxzZTtcclxuICB0aGlzLnBhZGQgPSBwYWRkIHx8IDU7XHJcblxyXG4gIHZhciBtZXRyaWNzID0gY3R4Lm1lYXN1cmVUZXh0KHRoaXMudHh0KS53aWR0aDtcclxuICB2YXIgX3ggPSAoICF0aGlzLm5vQ2VudGVyICkgPyB0aGlzLnNldENlbnRlcit0aGlzLncvMiA6IHRoaXMueCt0aGlzLnBhZGQ7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy50eHRDb2xvcjtcclxuICAgIGN0eC50ZXh0QWxpZ24gPSAoICF0aGlzLm5vQ2VudGVyICkgPyBcImNlbnRlclwiIDogXCJzdGFydFwiO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZTaXplICsgJ3B4IGNhcHR1cmVfaXQnO1xyXG4gICAgY3R4LnRleHRCYXNlbGluZT1cIm1pZGRsZVwiOyBcclxuICAgIGN0eC5maWxsVGV4dCh0aGlzLnR4dCwgX3gsIHRoaXMueSt0aGlzLmgvMik7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlhYmxlID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3QgPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvciwgaXNTdHJva2UpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMuaXNTdHJva2UgPSBpc1N0cm9rZSB8fCBmYWxzZTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGlmICghdGhpcy5pc1N0cm9rZSkge1xyXG4gICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICBjdHguc3Ryb2tlUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgfVxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFZpZGVvID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgdmlkZW8pe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMudmlkZW8gPSB2aWRlbztcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLnZpZGVvKSB7XHJcbiAgICAgIHRoaXMudmlkZW8ucGxheSgpO1xyXG4gICAgICBjYW52YXMuY3R4LmRyYXdJbWFnZSh0aGlzLnZpZGVvLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2FsbCA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpLFxyXG5QbGF5ZWJsZSAgPSByZXF1aXJlKCcuL2NsYXNzZXMvUGxheWFibGUuanMnKSxcclxuV2FsbCAgICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1dhbGwuanMnKSxcclxuSW1nQnV0dG9uID0gcmVxdWlyZSgnLi9jbGFzc2VzL0ltZ0J1dHRvbi5qcycpLFxyXG5WaWRlbyAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvVmlkZW8uanMnKSxcclxuQnV0dG9uICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0J1dHRvbi5qcycpLFxyXG5SZWN0ICAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvUmVjdC5qcycpLFxyXG5JbWFnZSAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1hZ2UuanMnKSxcclxuQyAgICAgICAgID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKSxcclxuZXZlbnRzICAgID0gcmVxdWlyZSgnLi9fZXZlbnRzLmpzJyksXHJcbmxldmVscyAgICA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpLFxyXG5vICAgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyksXHJcbmNudnMgICAgICA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpLFxyXG5rZXkgXHQgID0gcmVxdWlyZSgnLi9fa2V5LmpzJyk7XHJcblxyXG5lbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLmxvYWRlcik7XHJcblxyXG5cclxuXHJcbi8vIHZhciBwbGF5ZXIgPSB7XHJcbi8vIFx0eCA6IDAsXHJcbi8vIFx0eSA6IDAsXHJcbi8vIFx0dyA6IDUwLFxyXG4vLyBcdGggOiA1MCxcclxuXHJcbi8vIFx0ZHJhd0FuaW1hdGlvbiA6IGZ1bmN0aW9uKGltZywgZnJhbWVzLCBkZWxheSwgYW5nbGUpe1xyXG5cclxuLy8gXHRcdGlmICggcmVzLnJlc291cnNlcy5hcmVMb2FkZWQoKSApe1xyXG5cclxuLy8gXHRcdFx0aW1nLmNhbkRyYXcgPSAoIGltZy5jYW5EcmF3ID09PSB1bmRlZmluZWQgKSA/IDEgOiBpbWcuY2FuRHJhdztcclxuXHJcbi8vIFx0XHRcdGlmIChhbmdsZSl7XHJcbi8vIFx0XHRcdFx0dmFyIF9keCA9IHRoaXMueCArIHRoaXMudyAvIDI7XHJcbi8vIFx0XHRcdFx0dmFyIF9keSA9IHRoaXMueSArIHRoaXMuaCAvIDI7XHJcbi8vIFx0XHRcdFx0YW5nbGUgPSBhbmdsZSAqIChNYXRoLlBJLzE4MCk7XHJcbi8vIFx0XHRcdFx0Y252cy5jdHguc2F2ZSgpO1xyXG4vLyBcdFx0XHRcdGNudnMuY3R4LnRyYW5zbGF0ZShfZHgsX2R5KTtcclxuLy8gXHRcdFx0XHRjbnZzLmN0eC5yb3RhdGUoYW5nbGUpO1xyXG4vLyBcdFx0XHRcdGNudnMuY3R4LnRyYW5zbGF0ZSgtX2R4LC1fZHkpO1xyXG4vLyBcdFx0XHR9O1xyXG5cclxuLy8gXHRcdFx0aWYgKGltZy5jYW5EcmF3ID09IDEpe1xyXG4vLyBcdFx0XHRcdGlmIChpbWcuY291bnQgPT0gZnJhbWVzKSBpbWcuY291bnQgPSAxO1xyXG5cclxuLy8gXHRcdFx0XHRpbWcuY2FuRHJhdyA9IDA7XHJcbi8vIFx0XHRcdFx0aW1nLmNvdW50ID0gaW1nLmNvdW50ICsgMSB8fCAxO1xyXG5cclxuLy8gXHRcdCAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4vLyBcdFx0ICAgICAgICBcdGltZy5jYW5EcmF3ID0gMTtcclxuLy8gXHRcdCAgICAgICAgfSwgMTAwMC8oZGVsYXkqMikgKTtcclxuLy8gXHRcdCAgICB9O1xyXG5cclxuLy8gXHRcdCAgICBjbnZzLmN0eC5kcmF3SW1hZ2UoaW1nLCA1MCooaW1nLmNvdW50LTEpLCAwLCB0aGlzLncsIHRoaXMuaCwgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuXHJcbi8vIFx0XHQgICAgaWYgKGFuZ2xlKXtcclxuLy8gXHRcdCAgICBcdGNudnMuY3R4LnJlc3RvcmUoKTtcclxuLy8gXHRcdCAgICB9O1xyXG5cclxuLy8gXHRcdH07XHJcbi8vIFx0fSxcclxuXHJcbi8vIFx0ZHJhdyA6IGZ1bmN0aW9uKCl7XHJcblxyXG4vLyBcdFx0aWYodGhpcy5pc01vdmUpe1xyXG4vLyBcdFx0XHR0aGlzLmRyYXdBbmltYXRpb24ocmVzLmFyckltYWdlc1s5XSwgIDMsIDIsICB0aGlzLmRpcmVjdGlvbik7XHJcbi8vIFx0XHR9ZWxzZXtcclxuLy8gXHRcdFx0dGhpcy5kcmF3RnJhbWUocmVzLmFyckltYWdlc1s5XSk7XHJcbi8vIFx0XHR9XHJcbi8vIFx0fSxcclxuXHJcbi8vIFx0ZHJhd0ZyYW1lIDogZnVuY3Rpb24oaW1nLCBhbmdsZSl7XHJcblxyXG4vLyBcdFx0dmFyIGFuZ2xlID0gdGhpcy5kaXJlY3Rpb24gfHwgYW5nbGUgfHwgMDtcclxuXHJcbi8vIFx0XHRpZiAoYW5nbGUpe1xyXG4vLyBcdFx0XHR2YXIgX2R4ID0gdGhpcy54ICsgNTAgLyAyO1xyXG4vLyBcdFx0XHR2YXIgX2R5ID0gdGhpcy55ICsgNTAgLyAyO1xyXG4vLyBcdFx0XHRhbmdsZSA9IGFuZ2xlICogKE1hdGguUEkvMTgwKTtcclxuLy8gXHRcdFx0Y252cy5jdHguc2F2ZSgpO1xyXG4vLyBcdFx0XHRjbnZzLmN0eC50cmFuc2xhdGUoX2R4LF9keSk7XHJcbi8vIFx0XHRcdGNudnMuY3R4LnJvdGF0ZShhbmdsZSk7XHJcbi8vIFx0XHRcdGNudnMuY3R4LnRyYW5zbGF0ZSgtX2R4LC1fZHkpO1xyXG4vLyBcdFx0fTtcclxuXHJcbi8vIFx0XHRjbnZzLmN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCA1MCwgNTAsIHRoaXMueCwgdGhpcy55LCA1MCwgNTApO1xyXG5cclxuLy8gXHRcdGlmIChhbmdsZSl7XHJcbi8vIFx0XHRcdGNudnMuY3R4LnJlc3RvcmUoKTtcclxuLy8gXHRcdH07XHJcbi8vIFx0fSxcclxuXHJcbi8vIFx0ZGlyZWN0aW9uIDogZmFsc2UsXHJcbi8vIFx0aXNNb3ZlIDogZmFsc2VcclxuLy8gfTtcclxuXHJcblxyXG5cclxuLy8gdmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG4vLyBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xyXG5cclxuLy8gXHRjbnZzLmN0eC5jbGVhclJlY3QoMCwwLDUwMCw1MDApO1xyXG5cclxuLy8gXHRwbGF5ZXIuZHJhdygpO1xyXG5cclxuLy8gXHRjbnZzLmN0eC5maWxsUmVjdCg1MCw1MCw1MCw1MCk7XHJcblxyXG4vLyB9LCAxMDAwLzYwKTtcclxuXHJcblxyXG4vLyB3aW5kb3cub25rZXlkb3duID0gZnVuY3Rpb24oZSl7XHJcblxyXG4vLyBcdGlmICggZS5rZXkgPT0gXCJkXCIgfHwgZS5rZXkgPT0gXCJBcnJvd1JpZ2h0XCIgKXtcclxuLy8gXHRcdHBsYXllci5kaXJlY3Rpb24gPSBwbGF5ZXIuaXNNb3ZlID0gOTA7XHJcbi8vIFx0XHRwbGF5ZXIueCA9IHBsYXllci54ICsgNTA7XHJcbi8vIFx0fTtcclxuXHJcbi8vIFx0aWYgKCBlLmtleSA9PSBcInNcIiB8fCBlLmtleSA9PSBcIkFycm93RG93blwiICl7XHJcbi8vIFx0XHRwbGF5ZXIuZGlyZWN0aW9uID0gcGxheWVyLmlzTW92ZSA9IDE4MDtcclxuLy8gXHRcdHBsYXllci55ID0gcGxheWVyLnkgKyA1MDtcclxuLy8gXHR9O1xyXG5cclxuLy8gXHRpZiAoIGUua2V5ID09IFwid1wiIHx8IGUua2V5ID09IFwiQXJyb3dVcFwiICl7XHJcbi8vIFx0XHRwbGF5ZXIuZGlyZWN0aW9uID0gcGxheWVyLmlzTW92ZSA9IDM2MDtcclxuLy8gXHRcdHBsYXllci55ID0gcGxheWVyLnkgLSA1MDtcclxuLy8gXHR9O1xyXG5cclxuLy8gXHRpZiAoIGUua2V5ID09IFwiYVwiIHx8IGUua2V5ID09IFwiQXJyb3dMZWZ0XCIgKXtcclxuLy8gXHRcdHBsYXllci5kaXJlY3Rpb24gPSBwbGF5ZXIuaXNNb3ZlID0gMjcwO1xyXG4vLyBcdFx0cGxheWVyLnggPSBwbGF5ZXIueCAtIDUwO1xyXG4vLyBcdH07XHJcblxyXG4vLyBcdHdpbmRvdy5vbmtleXVwID0gZnVuY3Rpb24oZSl7XHJcbi8vIFx0XHRwbGF5ZXIuaXNNb3ZlID0gZmFsc2U7XHJcbi8vIFx0fTtcclxuXHJcbi8vIH07XHJcblxyXG4iXX0=
