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

function moveRects(direction){  //(описываем границы движения) разрешает движение в пределах уровня

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

    if ( e.key == "d" || e.key == "ArrowRight" )  
      moveRects("right");

    if ( e.key == "s" || e.key == "ArrowDown" )  
      moveRects("down");

    if ( e.key == "w" || e.key == "ArrowUp" )
      moveRects("up");

    if ( e.key == "a" || e.key == "ArrowLeft" )
      moveRects("left");

  };
};

window.onmousedown = function(e){ //cобытие нажатия мышки

  var x = e.pageX-canvas.cnv.offsetLeft;
  var y = e.pageY-canvas.cnv.offsetTop;

  for ( i in o.menu ){
    if( isCursorInButton(x,y,o.menu[i]) && gLoo.status == "menu" ){  
      if ( o.menu[i].name == "play" ){    //если нажата кнопка играть, запускаем уровень.
        loadLevel(gameLoops.currentLevel);
      } else if ( o.menu[i].name == "change_level" ){   
        engin.gameEngineStart(gameLoops.levels);
      };
    };
  };

  for ( i in o.winPopUp ){
    if( isCursorInButton(x,y,o.winPopUp[i]) && gLoo.status == "win" ){
      if ( o.winPopUp[i].name == "pop_exit" ){
        engin.gameEngineStart(gameLoops.menu);
      };
    };
  };

  for ( i in o.pausePopUp ){
    if( isCursorInButton(x,y,o.pausePopUp[i]) && gLoo.status == "pause" ){
      if ( o.pausePopUp[i].name == "return" ){
        sw.start();
        engin.gameEngineStart(gameLoops.game);
      } else if ( o.pausePopUp[i].name == "restart" ){
        sw.reset();
        loadLevel(gameLoops.currentLevel);
      } else if ( o.pausePopUp[i].name == "exit" ){
        sw.reset();
        engin.gameEngineStart(gameLoops.menu);
      };
    };
  };
  
  if( isCursorInButton(x,y,o.bPause) && gLoo.status == "game" ){
    sw.pauseTimer();
    o.bgOpacity.draw();
    engin.gameEngineStart(gameLoops.pause);
  };

  if( isCursorInButton(x,y,o.bFullScr) && gLoo.status == "game"){
    ( !fs.status ) ? fs.launchFullScreen(canvas.cnv) : fs.canselFullScreen(); 
  };

  for ( i in o.winPopUp ){
    if( isCursorInButton(x,y,o.winPopUp[i]) && gLoo.status == "win" ){
      if ( o.winPopUp[i].name == "pop_exit" ){
        engin.gameEngineStart(gameLoops.menu);
      } else if ( o.winPopUp[i].name == "pop_next" && gameLoops.currentLevel != levels.lvlsCount() ){
        sw.reset();
        gameLoops.currentLevel++;
        loadLevel(gameLoops.currentLevel);
      };
    };
  };

  for ( i in o.levelsFooter ){
    if( isCursorInButton(x,y,o.levelsFooter[i]) && gLoo.status == "levels" ){
      if ( o.levelsFooter[i].name == "prev" ){
        console.log("Кнопка назад, пока так.");
      } else if ( o.levelsFooter[i].name == "to_menu" ){
        engin.gameEngineStart(gameLoops.menu);
      } else if ( o.levelsFooter[i].name == "next" ){
        console.log("Кнопка вперед, пока так.");
      }; 
    };
  };

  for ( var i = 0; i < o.bLevelsButtons.length; i++ ){
    if( isCursorInButton(x,y,o.bLevelsButtons[i]) && gLoo.status == "levels" ){
        gameLoops.currentLevel = i+1;
        loadLevel(i+1);
    };
  };

};

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_fullScreen.js":5,"./_gameLoops.js":6,"./_helperFunctions.js":7,"./_levels.js":8,"./_objects.js":9,"./_stopwatch.js":11}],5:[function(require,module,exports){
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
    o.pl.draw();
    o.box.draw();
    o.door.draw();

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

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_helperFunctions.js":7,"./_objects.js":9,"./_resourses.js":10}],7:[function(require,module,exports){
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

},{"./_canvas.js":1,"./_const.js":2,"./_levels.js":8,"./_objects.js":9}],8:[function(require,module,exports){
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
			// _walls.push( new Rect(arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
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
			_walls.push( new Rect(arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
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
			_walls.push( new Rect(arr[i][1]*(50+C.PDNG), +arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
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
			_walls.push( new Rect(arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
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
			_walls.push( new Rect(arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.pl.setPosition( 0, 0+0*(50+C.PDNG) );
		o.box.setPosition( 0+1*(50+C.PDNG), 0+1*(50+C.PDNG) );
		o.door.setPosition( 0, 0+8*(50+C.PDNG) );

		o.walls = _walls;

	}

};

},{"./_const.js":2,"./_objects.js":9,"./_resourses.js":10}],9:[function(require,module,exports){
var C = require('./_const.js');
var cnvs = require('./_canvas.js');
var res = require('./_resourses.js');

function createMatrixBG(){
  var matrix = []; //массив для матричного вида уровня

  for (var i = 0; i < 9; i++){ //заполняем объект
    for (var j = 0; j < 9; j++){
      matrix.push( new Rect(j*(50+C.PDNG), i*(50+C.PDNG), 50, 50, "#FEA3A3") );
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


//menu
var logo = new ImgButton( res.arrImages[1], C.WIDTH/2-450/2, 20, 450, 150, "", "logo", 0 );
var menu = createMenu(["Играть", "Уровни", "Настройки"],["play", "change_level", "options"]);


//background 
var matrix = createMatrixBG(); //bg уровня
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//game header
var header = new ImgButton( res.arrImages[2], 0, 0, C.WIDTH, 70+C.PDNG, "", "header", 0 );
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
var door = new Rect(0,0,50,50, "rgba(231, 23, 32, 0.8)"); //дверь
var walls = []; //стены на уровне, заполняется выбранным уровнем.


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

},{"./_canvas.js":1,"./_const.js":2,"./_resourses.js":10}],10:[function(require,module,exports){
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
  "../img/crystall-01.svg"
]);

module.exports = { 

  resourses : resourses,

  arrVideos : arrVideos,

  arrImages : arrImages  

};
},{}],11:[function(require,module,exports){
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
},{"./_gameLoops.js":6,"./_objects.js":9}],12:[function(require,module,exports){
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
},{"./../_canvas.js":1}],13:[function(require,module,exports){
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Image = function(src){
  this.src = src;
  this.loaded = false;

  var img = document.createElement('img');

  img.onload = function(){
    this.loaded = true;
  }.bind(this);

  img.src = src;

  this.dom = img;

  this.drawImg = function(){

    if ( !this.loaded ) return;

    ctx.drawImage(this.dom,0,0);

  };
};
},{"./../_canvas.js":1}],14:[function(require,module,exports){
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
},{"./../_canvas.js":1}],15:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],16:[function(require,module,exports){
var C = require('./../_const.js');
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Rect = function(x, y, w, h, color){ //класс кубик
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = color;

  this.draw = function(){
    ctx.save();
    ctx.translate(C.PDNG, 71+C.PDNG);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
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
},{"./../_canvas.js":1}],18:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],19:[function(require,module,exports){
var engin = require('./_engine.js'),
Playeble = require('./classes/Playable.js'),
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
canvas    = require('./_canvas.js');

engin.gameEngineStart(gameLoops.loader);

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_levels.js":8,"./_objects.js":9,"./classes/Button.js":12,"./classes/Image.js":13,"./classes/ImgButton.js":14,"./classes/Playable.js":15,"./classes/Rect.js":16,"./classes/Video.js":17,"./classes/Wall.js":18}]},{},[19])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19sZXZlbHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fb2JqZWN0cy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19yZXNvdXJzZXMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fc3RvcHdhdGNoLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9CdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0ltYWdlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWdCdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1BsYXlhYmxlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9SZWN0LmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9WaWRlby5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvV2FsbC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2Zha2VfYThmMzA1ZmYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBjbnYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxudmFyIGN0eCA9IGNudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG5jbnYuc3R5bGUuYm9yZGVyID0gXCIycHggc29saWQgYmxhY2tcIjtcclxuY252LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcclxuY252LndpZHRoID0gQy5XSURUSDtcclxuY252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGNudiA6IGNudixcclxuXHJcblx0Y3R4IDogY3R4XHJcblxyXG59OyIsInZhciBQQUREID0gMTsgXHRcdFx0XHRcdFx0Ly/Qv9Cw0LTQtNC40L3Qsywg0LrQvtGC0L7RgNGL0Lkg0Y8g0YXQvtGH0YMg0YfRgtC+0LHRiyDQsdGL0LssINC80LXQtiDQutCy0LDQtNGA0LDRgtCw0LzQuFxyXG52YXIgV0lEVEggPSBQQUREICsgKFBBREQrNTApKjk7IFx0Ly/RiNC40YDQuNC90LAg0LrQsNC90LLRi1xyXG52YXIgSEVJR0hUID0gMjArUEFERCArIChQQUREKzUwKSoxMDsgICAvL9Cy0YvRgdC+0YLQsCDQutCw0L3QstGLXHJcbnZhciBDTlZfQk9SREVSID0gMjtcclxudmFyIEhFQURFUl9IID0gNzE7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0UERORyA6IFBBREQsXHJcblxyXG5cdFdJRFRIIDogV0lEVEgsXHJcblxyXG5cdEhFSUdIVCA6IEhFSUdIVCxcclxuXHJcblx0Q05WX0JPUkRFUiA6IENOVl9CT1JERVIsXHJcblxyXG5cdEhFQURFUl9IIDogSEVBREVSX0hcclxuXHJcbn07XHJcbiIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKtC60YDQvtGB0LHRgNCw0YPQt9C10YDQvdC+0LUg0YPQv9GA0LLQu9C10L3QuNC1INGG0LjQutC70LDQvNC4INC40LPRgNGLKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNldEdhbWVFbmdpbmUoKXtcclxuXHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0XHRnYW1lRW5naW5lU3RlcCgpO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgc3cgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIGZzID0gcmVxdWlyZSgnLi9fZnVsbFNjcmVlbi5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgZ2FtZUxvb3BzID0gZ0xvbztcclxuXHJcbnZhciBpc0JvcmRlciA9IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIg0L7QsdGK0LXQutGCLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvtC80Lkg0LPRgNCw0L3QuNGG0Ysg0LrQsNC90LLRi1xyXG4gICAgdXAgOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gb2JqLnkgPT0gMDtcclxuICAgIH0sXHJcblxyXG4gICAgZG93biA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueSA9PSBDLkhFSUdIVCAtIG9iai5oIC0gQy5QRE5HIC0gQy5IRUFERVJfSCAtIEMuUERORztcclxuICAgIH0sXHJcblxyXG4gICAgbGVmdCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueCA9PSAwO1xyXG4gICAgfSxcclxuXHJcbiAgICByaWdodCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueCA9PSBDLldJRFRIIC0gb2JqLncgLSBDLlBETkcgLSBDLlBETkdcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBpc05lYXIgPSB7IC8v0L/RgNC40L3QuNC80LDQtdGCIDIg0L7QsdGK0LXQutGC0LAsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC80L7QuSDRgdGC0L7RgNC+0L3RiyAx0YvQuSDQvtGCIDLQs9C+LlxyXG5cclxuICB1cCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnkgKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMltpXS54O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnkgKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gIH0sXHJcblxyXG4gIGRvd24gOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBsZWZ0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueCArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzIueCArIG9ial8yLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfSxcclxuXHJcbiAgcmlnaHQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBtb3ZlUmVjdHMoZGlyZWN0aW9uKXsgIC8vKNC+0L/QuNGB0YvQstCw0LXQvCDQs9GA0LDQvdC40YbRiyDQtNCy0LjQttC10L3QuNGPKSDRgNCw0LfRgNC10YjQsNC10YIg0LTQstC40LbQtdC90LjQtSDQsiDQv9GA0LXQtNC10LvQsNGFINGD0YDQvtCy0L3Rj1xyXG5cclxuICBpZiAoIGlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8uYm94KSAmJiAhaXNCb3JkZXJbZGlyZWN0aW9uXShvLmJveCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8uYm94LCBvLndhbGxzKSApeyAvL9C10YHQu9C4INGA0Y/QtNC+0Lwg0YEg0Y/RidC40LrQvtC8INC4INGP0YnQuNC6INC90LUg0YMg0LPRgNCw0L3QuNGGLCDQtNCy0LjQs9Cw0LXQvC5cclxuICAgIG8ucGwubW92ZShkaXJlY3Rpb24pO1xyXG4gICAgby5ib3gubW92ZShkaXJlY3Rpb24pO1xyXG4gIH0gZWxzZSBpZiggIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8uYm94KSAmJiAhaXNCb3JkZXJbZGlyZWN0aW9uXShvLnBsKSAmJiAhaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby53YWxscykgKXsgLy/QtdGB0LvQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0Y/RidC40LrQvtC8INC4INC90LUg0YDRj9C00L7QvCDRgSDQs9GA0LDQvdC40YbQtdC5LCDQtNCy0LjQs9Cw0LXQvNGB0Y8uXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBpc0N1cnNvckluQnV0dG9uKHgseSxidXQpeyAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGC0YDRgywg0LXRgdC70Lgg0LrRg9GA0YHQvtGAINC/0L7Qv9Cw0Lsg0LIg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L7QsdGK0LXQutGC0LBcclxuICByZXR1cm4geCA+PSBidXQueCAmJiBcclxuICB4IDw9IGJ1dC54K2J1dC53ICYmIFxyXG4gIHkgPj0gYnV0LnkgJiYgXHJcbiAgeSA8PSBidXQueStidXQuaFxyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZExldmVsKG51bWJlcil7IC8v0LfQsNCz0YDRg9C30LrQsCDRg9GA0L7QstC90Y9cclxuICBzdy5zdGFydCgpO1xyXG4gIGxldmVsc1tudW1iZXJdKCk7IFxyXG4gIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBudW1iZXI7IFxyXG4gIG8uY3VyckxldmVsLnR4dCA9IFwi0KPRgNC+0LLQtdC90YwgXCIrbnVtYmVyO1xyXG4gIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMuZ2FtZSk7XHJcbn07XHJcblxyXG53aW5kb3cub25rZXlkb3duID0gZnVuY3Rpb24oZSl7IC8v0YHQvtCx0YvRgtC40LUg0L3QsNC20LDRgtC40Y8g0LrQu9Cw0LLQuNGI0YxcclxuXHJcbiAgaWYgKCBnTG9vLnN0YXR1cyA9PSBcImdhbWVcIiApeyAvL9C/0LXRgNC10LTQstC40LPQsNGC0YzRgdGPINGC0L7Qu9GM0LrQviDQtdGB0LvQuCDQuNC00LXRgiDQuNCz0YDQsC5cclxuXHJcbiAgICBpZiAoIGUua2V5ID09IFwiZFwiIHx8IGUua2V5ID09IFwiQXJyb3dSaWdodFwiICkgIFxyXG4gICAgICBtb3ZlUmVjdHMoXCJyaWdodFwiKTtcclxuXHJcbiAgICBpZiAoIGUua2V5ID09IFwic1wiIHx8IGUua2V5ID09IFwiQXJyb3dEb3duXCIgKSAgXHJcbiAgICAgIG1vdmVSZWN0cyhcImRvd25cIik7XHJcblxyXG4gICAgaWYgKCBlLmtleSA9PSBcIndcIiB8fCBlLmtleSA9PSBcIkFycm93VXBcIiApXHJcbiAgICAgIG1vdmVSZWN0cyhcInVwXCIpO1xyXG5cclxuICAgIGlmICggZS5rZXkgPT0gXCJhXCIgfHwgZS5rZXkgPT0gXCJBcnJvd0xlZnRcIiApXHJcbiAgICAgIG1vdmVSZWN0cyhcImxlZnRcIik7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKXsgLy9j0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC80YvRiNC60LhcclxuXHJcbiAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcblxyXG4gIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSAmJiBnTG9vLnN0YXR1cyA9PSBcIm1lbnVcIiApeyAgXHJcbiAgICAgIGlmICggby5tZW51W2ldLm5hbWUgPT0gXCJwbGF5XCIgKXsgICAgLy/QtdGB0LvQuCDQvdCw0LbQsNGC0LAg0LrQvdC+0L/QutCwINC40LPRgNCw0YLRjCwg0LfQsNC/0YPRgdC60LDQtdC8INGD0YDQvtCy0LXQvdGMLlxyXG4gICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgfSBlbHNlIGlmICggby5tZW51W2ldLm5hbWUgPT0gXCJjaGFuZ2VfbGV2ZWxcIiApeyAgIFxyXG4gICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubGV2ZWxzKTtcclxuICAgICAgfTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby53aW5Qb3BVcFtpXSkgJiYgZ0xvby5zdGF0dXMgPT0gXCJ3aW5cIiApe1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgaWYoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ucGF1c2VQb3BVcFtpXSkgJiYgZ0xvby5zdGF0dXMgPT0gXCJwYXVzZVwiICl7XHJcbiAgICAgIGlmICggby5wYXVzZVBvcFVwW2ldLm5hbWUgPT0gXCJyZXR1cm5cIiApe1xyXG4gICAgICAgIHN3LnN0YXJ0KCk7XHJcbiAgICAgICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5nYW1lKTtcclxuICAgICAgfSBlbHNlIGlmICggby5wYXVzZVBvcFVwW2ldLm5hbWUgPT0gXCJyZXN0YXJ0XCIgKXtcclxuICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgfSBlbHNlIGlmICggby5wYXVzZVBvcFVwW2ldLm5hbWUgPT0gXCJleGl0XCIgKXtcclxuICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG4gIH07XHJcbiAgXHJcbiAgaWYoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYlBhdXNlKSAmJiBnTG9vLnN0YXR1cyA9PSBcImdhbWVcIiApe1xyXG4gICAgc3cucGF1c2VUaW1lcigpO1xyXG4gICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wYXVzZSk7XHJcbiAgfTtcclxuXHJcbiAgaWYoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkZ1bGxTY3IpICYmIGdMb28uc3RhdHVzID09IFwiZ2FtZVwiKXtcclxuICAgICggIWZzLnN0YXR1cyApID8gZnMubGF1bmNoRnVsbFNjcmVlbihjYW52YXMuY252KSA6IGZzLmNhbnNlbEZ1bGxTY3JlZW4oKTsgXHJcbiAgfTtcclxuXHJcbiAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby53aW5Qb3BVcFtpXSkgJiYgZ0xvby5zdGF0dXMgPT0gXCJ3aW5cIiApe1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICB9IGVsc2UgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgIT0gbGV2ZWxzLmx2bHNDb3VudCgpICl7XHJcbiAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsKys7XHJcbiAgICAgICAgbG9hZExldmVsKGdhbWVMb29wcy5jdXJyZW50TGV2ZWwpO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5sZXZlbHNGb290ZXJbaV0pICYmIGdMb28uc3RhdHVzID09IFwibGV2ZWxzXCIgKXtcclxuICAgICAgaWYgKCBvLmxldmVsc0Zvb3RlcltpXS5uYW1lID09IFwicHJldlwiICl7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0L3QsNC30LDQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgfSBlbHNlIGlmICggby5sZXZlbHNGb290ZXJbaV0ubmFtZSA9PSBcInRvX21lbnVcIiApe1xyXG4gICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoIG8ubGV2ZWxzRm9vdGVyW2ldLm5hbWUgPT0gXCJuZXh0XCIgKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcItCa0L3QvtC/0LrQsCDQstC/0LXRgNC10LQsINC/0L7QutCwINGC0LDQui5cIik7XHJcbiAgICAgIH07IFxyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJMZXZlbHNCdXR0b25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iTGV2ZWxzQnV0dG9uc1tpXSkgJiYgZ0xvby5zdGF0dXMgPT0gXCJsZXZlbHNcIiApe1xyXG4gICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBpKzE7XHJcbiAgICAgICAgbG9hZExldmVsKGkrMSk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdGxhdW5jaEZ1bGxTY3JlZW4gOiBmdW5jdGlvbihlbGVtKXtcclxuXHJcblx0XHRpZiAoIGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5yZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZWxlbS5tb3pSZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLm1velJlcXVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLnN0YXR1cyA9IHRydWU7IFxyXG5cdH0sXHJcblxyXG5cdGNhbnNlbEZ1bGxTY3JlZW4gOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdGlmICggZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5zdGF0dXMgPSBmYWxzZTtcclxuXHR9LFxyXG5cclxuXHRzdGF0dXMgOiBmYWxzZVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyk7XHJcbnZhciByZXMgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxuXHJcbi8vVlJFTUVOTk8hISFcclxudmFyIGN0eCA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2FtZUxvb3BzID0gIHtcclxuXHJcbiAgbG9hZGVyIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJsb2FkZXJcIjtcclxuXHJcbiAgICBvLlRFU1QuZHJhdygpO1xyXG4gICAgaWYgKCByZXMucmVzb3Vyc2VzLmFyZUxvYWRlZCgpICkgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5tZW51KTtcclxuICB9LFxyXG5cclxuICBnYW1lIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJnYW1lXCI7IFxyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7IC8v0L7Rh9C40YHRgtC60LAg0L7QsdC70LDRgdGC0LhcclxuXHJcbiAgICAvL9CS0KDQldCc0JXQndCd0J4hISFcclxuICAgIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICBjdHguZmlsbFJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuXHJcbiAgICAvL9Cy0YvQstC+0LTQuNC8INC80LDRgtGA0LjRh9C90L7QtSDQv9C+0LvQtSDQuNCz0YDRi1xyXG4gICAgZm9yICggaSBpbiBvLm1hdHJpeCApe1xyXG4gICAgICBvLm1hdHJpeFtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0LLRi9Cy0L7QtNC40Lwg0YHRgtC10L3Ri1xc0L/RgNC10LPRgNCw0LTRi1xyXG4gICAgZm9yICggaSBpbiBvLndhbGxzICl7XHJcbiAgICAgIG8ud2FsbHNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKioqKtCS0YvQstC+0LTQuNC8INCl0LXQtNC10YAqKioqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBvLmhlYWRlci5kcmF3KCk7XHJcbiAgICBvLnN0b3BXYXRjaC5kcmF3KDEsMTApO1xyXG4gICAgby5iRnVsbFNjci5kcmF3KCk7XHJcbiAgICBvLmJQYXVzZS5kcmF3KCk7XHJcbiAgICBvLmN1cnJMZXZlbC5kcmF3KCk7XHJcblxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyoqKirQktGL0LLQvtC00LjQvCDQvtCx0YrQtdC60YLRiyoqKioqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIG8ucGwuZHJhdygpO1xyXG4gICAgby5ib3guZHJhdygpO1xyXG4gICAgby5kb29yLmRyYXcoKTtcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKioqKtCV0YHQu9C4INC/0L7QsdC10LTQuNC70LgqKioqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBpZiAoIGhmLmlzV2luKCkgKXtcclxuICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLndpbik7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIG1lbnUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIm1lbnVcIjtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8uYW5pbWF0ZUJnLmRyYXcoKTtcclxuXHJcbiAgICBvLmxvZ28uZHJhdygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgIG8ubWVudVtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHdpbiA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwid2luXCI7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwid2luX3RleHRcIiApIG8ud2luUG9wVXBbaV0udHh0ID0gXCLQo9GA0L7QstC10L3RjCBcIitnYW1lTG9vcHMuY3VycmVudExldmVsK1wiINC/0YDQvtC50LTQtdC9IVwiO1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9PSBsZXZlbHMubHZsc0NvdW50KCkgKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgby53aW5Qb3BVcFtpXS5kcmF3KCk7XHJcbiAgICAgIH0gIFxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBwYXVzZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwicGF1c2VcIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICBvLnBhdXNlUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBsZXZlbHMgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImxldmVsc1wiO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby5sZXZlbHNIZWFkZXIuZHJhdygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5iTGV2ZWxzQnV0dG9ucyApe1xyXG4gICAgICBvLmJMZXZlbHNCdXR0b25zW2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICBvLmxldmVsc0Zvb3RlcltpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHN0YXR1cyA6IFwiXCIsXHJcblxyXG4gIGN1cnJlbnRMZXZlbCA6IFwiMVwiXHJcblxyXG59O1xyXG4iLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBsZXZlbHMgPSByZXF1aXJlKCcuL19sZXZlbHMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICBjbGVhclJlY3QgOiBmdW5jdGlvbih4LHksdyxoKXsgIC8v0L7Rh9C40YHRgtC40YLQtdC70YxcclxuICAgIGN0eC5jbGVhclJlY3QoeCx5LHcsaCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UmFuZG9tSW50IDogZnVuY3Rpb24obWluLCBtYXgpIHsgLy/RhNGD0L3QutGG0LjRjyDQtNC70Y8g0YDQsNC90LTQvtC80LAg0YbQtdC70L7Rh9C40YHQu9C10L3QvdC+0LPQviDQt9C90LDRh9C10L3QuNGPXHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxuICB9LFxyXG5cclxuICBpc1dpbiA6IGZ1bmN0aW9uKCl7IC8v0L/QvtCx0LXQtNC40LvQuD9cclxuICAgIHJldHVybiBvLmJveC54ID09IG8uZG9vci54ICYmIG8uYm94LnkgPT0gby5kb29yLnk7XHJcbiAgfVxyXG59O1xyXG4iLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGxldmVscyA9IHtcclxuXHJcblx0bHZsc0NvdW50IDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjb3VudCA9IDA7XHJcblx0XHRmb3Ioa2V5IGluIGxldmVscyl7IGNvdW50KysgfTtcclxuXHRcdFx0cmV0dXJuIGNvdW50LTE7XHJcblx0fSxcclxuXHJcblx0MSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgLy/QvNCw0YHRgdC40LIg0YEg0LHRg9C00YPRidC10L/QvtGB0YLRgNC+0LXQvdC90YvQvNC4INGB0YLQtdC90LrQsNC80LhcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzEsM10sWzEsNF0sWzEsNV0sWzIsMF0sWzIsNl0sWzIsOF0sWzMsMl0sWzQsMV0sWzQsM10sWzQsN10sWzUsNF0sWzYsNF0sWzYsNl0sWzcsMV0sWzcsOF0sWzgsMF0sWzgsNF0sWzgsNV1cclxuXHRcdF07XHRcdFx0XHQgIC8v0L/RgNC40LTRg9C80LDQvdC90YvQuSDQvNCw0YHRgdC40LIg0YHQviDRgdGC0LXQvdC60LDQvNC4XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0Ly8gX3dhbGxzLnB1c2goIG5ldyBSZWN0KGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTAsIFwiIzYyMkRBMVwiKSApO1xyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvNCw0YHRgdC40LIgd2FsbHNcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsyKig1MCtDLlBETkcpLCA3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDIgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwwXSxbMCw0XSxbMCwzXSxbMCw2XSxbMiwyXSxbMiw0XSxbMyw4XSxbMywwXSxbMyw3XSxbNCwyXSxbNCw0XSxbNCw1XSxbNCw2XSxbNSwwXSxbNiwyXSxbNiw1XSxbNiw2XSxbNiw3XSxbNywwXSxbOCwzXSxbOCw0XSxbOCw3XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBSZWN0KGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTAsIFwiIzYyMkRBMVwiKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCs4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs2Kig1MCtDLlBETkcpLCAwKzcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKzYqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQzIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMl0sWzAsN10sWzEsNV0sWzEsOF0sWzIsMl0sWzIsN10sWzMsNF0sWzQsMV0sWzQsNF0sWzQsNl0sWzYsMl0sWzYsM10sWzYsNF0sWzYsNl0sWzYsOF0sWzcsMF0sWzcsNV0sWzgsMF0sWzgsMV0sWzgsM10sWzgsN11cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgUmVjdChhcnJbaV1bMV0qKDUwK0MuUERORyksICthcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCwgXCIjNjIyREExXCIpICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArMSooNTArQy5QRE5HKSwgMCs2Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArMiooNTArQy5QRE5HKSwgMCszKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0NCA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDFdLFsxLDVdLFsxLDddLFsyLDRdLFszLDFdLFszLDNdLFszLDZdLFszLDhdLFs0LDNdLFs1LDVdLFs1LDddLFs2LDBdLFs2LDJdLFs2LDNdLFs2LDVdLFs3LDhdLFs4LDBdLFs4LDhdXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFJlY3QoYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCwgXCIjNjIyREExXCIpICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwKzcqKDUwK0MuUERORyksIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArNyooNTArQy5QRE5HKSwgMCs3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArNiooNTArQy5QRE5HKSwgMCswKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0NSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDFdLFswLDNdLFswLDVdLFswLDhdLFsyLDJdLFsyLDRdLFsyLDZdLFsyLDhdLFs0LDBdLFs0LDNdLFs0LDVdLFs0LDddLFs2LDFdLFs2LDJdLFs2LDRdLFs2LDddLFs3LDhdLFs4LDJdLFs4LDRdLFs4LDhdXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFJlY3QoYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCwgXCIjNjIyREExXCIpICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwKzAqKDUwK0MuUERORykgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzEqKDUwK0MuUERORyksIDArMSooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9XHJcblxyXG59O1xyXG4iLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBjbnZzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciByZXMgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1hdHJpeEJHKCl7XHJcbiAgdmFyIG1hdHJpeCA9IFtdOyAvL9C80LDRgdGB0LjQsiDQtNC70Y8g0LzQsNGC0YDQuNGH0L3QvtCz0L4g0LLQuNC00LAg0YPRgNC+0LLQvdGPXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKXsgLy/Qt9Cw0L/QvtC70L3Rj9C10Lwg0L7QsdGK0LXQutGCXHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDk7IGorKyl7XHJcbiAgICAgIG1hdHJpeC5wdXNoKCBuZXcgUmVjdChqKig1MCtDLlBETkcpLCBpKig1MCtDLlBETkcpLCA1MCwgNTAsIFwiI0ZFQTNBM1wiKSApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBtYXRyaXhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnUodHh0QXJyLCBuYW1lQXJyKXsgIC8v0YHQvtC30LTQsNC10Lwg0LPQu9Cw0LLQvdC+0LUg0LzQtdC90Y5cclxuICB2YXIgbWVudSA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IG5hbWVBcnI7XHJcbiAgdmFyIHR4dCA9IHR4dEFycjtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcbiAgXHJcbiAgdmFyIF9mb250c2l6ZSA9IFwiMjhcIjtcclxuICB2YXIgX3ggPSBDLldJRFRILzItMzAwLzI7XHJcbiAgdmFyIF95ID0gKEMuSEVJR0hULzIpIC0gKDg1KmFtb3VudHMvMikgKyA4NTsgXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYW1vdW50czsgaSsrKXtcclxuICAgIG1lbnUucHVzaCggbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1swXSwgX3gsIF95K2kqODUsIDMwMCwgNjAsIHR4dFtpXSwgbmFtZXNbaV0sIF9mb250c2l6ZSwgMTM1ICkgKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gbWVudTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpblBvcFVwKCl7XHJcblxyXG4gIHZhciB3aW5Qb3BCRyA9IG5ldyBSZWN0KCBDLldJRFRILzItMjc1LzIsIEMuSEVJR0hULzItMTI1LzIsIDI3NSwgMTI1LCBcInJlZFwiICk7XHJcbiAgdmFyIGJQb3BFeGl0ID0gbmV3IEJ1dHRvbiggd2luUG9wQkcueCs1LCB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNS00MCwgOTAsIDQwLCBcImJsYWNrXCIsIFwi0JLRi9GF0L7QtFwiLCBcInBvcF9leGl0XCIsIDIwICk7XHJcbiAgdmFyIGJQb3BOZXh0ID0gbmV3IEJ1dHRvbiggd2luUG9wQkcueCt3aW5Qb3BCRy53LTUtOTAsIHdpblBvcEJHLnkrd2luUG9wQkcuaC01LTQwLCA5MCwgNDAsIFwiYmxhY2tcIiwgXCLQlNCw0LvQtdC1XCIsIFwicG9wX25leHRcIiwgMjAgKTtcclxuICB2YXIgd2luVGV4dCA9IG5ldyBCdXR0b24oIEMuV0lEVEgvMi05MC8yLCB3aW5Qb3BCRy55KzEwLCA5MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQo9GA0L7QstC10L3RjCBOINC/0YDQvtC50LTQtdC9IVwiLCBcIndpbl90ZXh0XCIsIDI1ICk7XHJcbiAgd2luVGV4dC50eHRDb2xvciA9IFwiYmxhY2tcIjtcclxuXHJcbiAgdmFyIHdpblBvcFVwID0gW107XHJcbiAgd2luUG9wVXAucHVzaCh3aW5Qb3BCRywgYlBvcEV4aXQsIGJQb3BOZXh0LCB3aW5UZXh0KTtcclxuXHJcbiAgcmV0dXJuIHdpblBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGF1c2VQb3BVcCh0eHRBcnIsIG5hbWVBcnIsIGZvbnRzaXplKXtcclxuXHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBfZm9udHNpemUgPSBmb250c2l6ZTtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcblxyXG4gIHZhciBfaGVpZ2h0ID0gKEMuSEVJR0hULzIpIC0gKDYwKmFtb3VudHMvMik7IFxyXG4gIHZhciBfd2lkdGggPSBDLldJRFRILzItMTUwLzI7XHJcblxyXG4gIHZhciBwYXVzZVBvcFVwID0gW25ldyBSZWN0KCBDLldJRFRILzItMjAwLzIsIF9oZWlnaHQtMzAsIDIwMCwgNjAqYW1vdW50cys0MCwgXCJyZWRcIiApXTtcclxuXHJcbiAgZm9yICh2YXIgaT0wOyBpPGFtb3VudHM7IGkrKyl7XHJcbiAgICBwYXVzZVBvcFVwLnB1c2goIG5ldyBCdXR0b24oIF93aWR0aCwgX2hlaWdodCtpKjYwLCAxNTAsIDQwLCBcImJsYWNrXCIsIHR4dFtpXSwgbmFtZXNbaV0sIF9mb250c2l6ZSApICk7IFxyXG4gIH07XHJcblxyXG4gIHJldHVybiBwYXVzZVBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzQnV0dG9ucyhsZXZlbHNfY291bnQpe1xyXG5cclxuICB2YXIgYkxldmVsc0J1dHRvbnMgPSBbXTtcclxuICB2YXIgaiA9IDAsIGR5ID0gNzUsIGR4ID0gMDtcclxuXHJcbiAgZm9yICggaT0wOyBpIDwgbGV2ZWxzX2NvdW50OyBpKyspe1xyXG4gICAgZHggPSA4K2oqKDEwMCsxNSk7XHJcblxyXG4gICAgYkxldmVsc0J1dHRvbnMucHVzaCggbmV3IEJ1dHRvbiggZHgsIGR5LCAxMDAsIDEwMCwgXCJibGFja1wiLCBpKzEsIFwibGV2ZWxfXCIrKGkrMSksIDI1ICkgKTtcclxuXHJcbiAgICBqKys7XHJcblxyXG4gICAgaWYgKCBkeCA+IEMuV0lEVEgtMTE1ICl7XHJcbiAgICAgIGR5ICs9ICgxMjUpO1xyXG4gICAgICBqID0gMDtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGJMZXZlbHNCdXR0b25zO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzRm9vdGVyKCl7XHJcblxyXG4gIHZhciBsZXZlbHNGb290ZXIgPSBbXTtcclxuXHJcbiAgdmFyIGJQcmV2ID0gbmV3IEJ1dHRvbiggMTAsIEMuSEVJR0hULTEwLTUwLCAxMDAsIDUwLCBcIiMzNEJBQ0FcIiwgXCLQndCw0LfQsNC0XCIsIFwicHJldlwiLCAyNSApO1xyXG4gIHZhciBiTmV4dCA9IG5ldyBCdXR0b24oIEMuV0lEVEgtMTAtMTAwLCBDLkhFSUdIVC0xMC01MCwgMTAwLCA1MCwgXCIjMzRCQUNBXCIsIFwi0JTQsNC70LXQtVwiLCBcIm5leHRcIiwgMjUgKTtcclxuICB2YXIgYlRvTWVudSA9IG5ldyBCdXR0b24oIChiUHJldi54K2JQcmV2LncrYk5leHQueCkvMi0yMjUvMiwgQy5IRUlHSFQtMTAtNTAsIDIyNSwgNTAsIFwiIzM0QkFDQVwiLCBcItCS0LXRgNC90YPRgtGM0YHRjyDQsiDQvNC10L3RjlwiLCBcInRvX21lbnVcIiwgMjUgKTtcclxuXHJcbiAgbGV2ZWxzRm9vdGVyLnB1c2goYlByZXYsYk5leHQsYlRvTWVudSk7XHJcblxyXG4gIHJldHVybiBsZXZlbHNGb290ZXI7XHJcbn07XHJcblxyXG5cclxuLy9tZW51XHJcbnZhciBsb2dvID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxXSwgQy5XSURUSC8yLTQ1MC8yLCAyMCwgNDUwLCAxNTAsIFwiXCIsIFwibG9nb1wiLCAwICk7XHJcbnZhciBtZW51ID0gY3JlYXRlTWVudShbXCLQmNCz0YDQsNGC0YxcIiwgXCLQo9GA0L7QstC90LhcIiwgXCLQndCw0YHRgtGA0L7QudC60LhcIl0sW1wicGxheVwiLCBcImNoYW5nZV9sZXZlbFwiLCBcIm9wdGlvbnNcIl0pO1xyXG5cclxuXHJcbi8vYmFja2dyb3VuZCBcclxudmFyIG1hdHJpeCA9IGNyZWF0ZU1hdHJpeEJHKCk7IC8vYmcg0YPRgNC+0LLQvdGPXHJcbnZhciBiZ09wYWNpdHkgPSBuZXcgUmVjdCgwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIik7XHJcblxyXG5cclxuLy9nYW1lIGhlYWRlclxyXG52YXIgaGVhZGVyID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1syXSwgMCwgMCwgQy5XSURUSCwgNzArQy5QRE5HLCBcIlwiLCBcImhlYWRlclwiLCAwICk7XHJcbnZhciBiRnVsbFNjciA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbM10sIEMuV0lEVEgtNDUtMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwiZnVsbFNjclwiLCAwICk7XHJcbnZhciBzdG9wV2F0Y2ggPSBuZXcgQnV0dG9uKCAxMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDEyMCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCIwMCA6IDAwIDogMDBcIiwgXCJzdG9wd2F0Y2hcIiwgMjUsIFwiZGl0ZWRcIiApO1xyXG52YXIgYlBhdXNlID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1s0XSwgQy5XSURUSC00NS03LWJGdWxsU2NyLnctMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwicGF1c2VcIiwgMCApO1xyXG52YXIgY3VyckxldmVsID0gbmV3IEJ1dHRvbiggKHN0b3BXYXRjaC54K3N0b3BXYXRjaC53K2JQYXVzZS54KS8yLTE0MC8yLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTQwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMXCIsIFwiY3Vycl9sZXZlbFwiLCAyNSwgXCJjYXB0dXJlX2l0XCIgKTtcclxuXHJcblxyXG4vL2NoYW5nZSBsZXZlbFxyXG52YXIgbGV2ZWxzSGVhZGVyID0gbmV3IEJ1dHRvbiggMCwgMCwgQy5XSURUSCwgNTArQy5QRE5HLCBcImJsYWNrXCIsIFwi0JLRi9Cx0L7RgCDRg9GA0L7QstC90Y9cIiwgXCJsZXZlbHNfaGVhZGVyXCIsIDI3ICk7XHJcbnZhciBiTGV2ZWxzQnV0dG9ucyA9IGNyZWF0ZUxldmVsc0J1dHRvbnMoNSk7XHJcbnZhciBsZXZlbHNGb290ZXIgPSBjcmVhdGVMZXZlbHNGb290ZXIoKTtcclxuXHJcblxyXG4vL3dpbiBwb3AtdXBcclxudmFyIHdpblBvcFVwID0gY3JlYXRlV2luUG9wVXAoKTtcclxuXHJcblxyXG4vL3BhdXNlIHBvcC11cFxyXG52YXIgcGF1c2VQb3BVcCA9IGNyZWF0ZVBhdXNlUG9wVXAoW1wi0JLQtdGA0L3Rg9GC0YzRgdGPXCIsIFwi0JfQsNC90L7QstC+XCIsIFwi0JLRi9GF0L7QtFwiXSxbXCJyZXR1cm5cIiwgXCJyZXN0YXJ0XCIsIFwiZXhpdFwiXSwgXCIyMFwiKTtcclxuXHJcblxyXG4vL3BsYXlhYmxlIG9ialxyXG52YXIgcGwgPSBuZXcgUmVjdCgwLDAsNTAsNTAsXCJibGFja1wiKTsgIC8v0LjQs9GA0L7QulxyXG52YXIgYm94ID0gbmV3IFBsYXlhYmxlKHJlcy5hcnJJbWFnZXNbNl0sMCwwLDUwLDUwKTsgLy/QsdC+0LrRgVxyXG52YXIgZG9vciA9IG5ldyBSZWN0KDAsMCw1MCw1MCwgXCJyZ2JhKDIzMSwgMjMsIDMyLCAwLjgpXCIpOyAvL9C00LLQtdGA0YxcclxudmFyIHdhbGxzID0gW107IC8v0YHRgtC10L3RiyDQvdCwINGD0YDQvtCy0L3QtSwg0LfQsNC/0L7Qu9C90Y/QtdGC0YHRjyDQstGL0LHRgNCw0L3QvdGL0Lwg0YPRgNC+0LLQvdC10LwuXHJcblxyXG5cclxudmFyIGFuaW1hdGVCZyA9IG5ldyBWaWRlbygwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgcmVzLmFyclZpZGVvc1swXSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RzID0ge1xyXG5cclxuICBtYXRyaXggOiBtYXRyaXgsXHJcbiAgbG9nbyA6IGxvZ28sXHJcbiAgbWVudSA6IG1lbnUsXHJcbiAgaGVhZGVyIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCA6IHN0b3BXYXRjaCxcclxuICBiUGF1c2UgOiBiUGF1c2UsXHJcbiAgYkZ1bGxTY3IgOiBiRnVsbFNjcixcclxuICBwbCA6IHBsLFxyXG4gIGJveCA6IGJveCxcclxuICBkb29yIDogZG9vcixcclxuICB3YWxscyA6IHdhbGxzLFxyXG4gIHdpblBvcFVwIDogd2luUG9wVXAsXHJcbiAgcGF1c2VQb3BVcCA6IHBhdXNlUG9wVXAsXHJcbiAgYmdPcGFjaXR5IDogYmdPcGFjaXR5LFxyXG4gIGN1cnJMZXZlbCA6IGN1cnJMZXZlbCxcclxuICBsZXZlbHNIZWFkZXIgOiBsZXZlbHNIZWFkZXIsXHJcbiAgYkxldmVsc0J1dHRvbnMgOiBiTGV2ZWxzQnV0dG9ucyxcclxuICBsZXZlbHNGb290ZXIgOiBsZXZlbHNGb290ZXIsXHJcbiAgVEVTVCA6IG5ldyBSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hULFwiYmxhY2tcIiksXHJcbiAgYW5pbWF0ZUJnIDogYW5pbWF0ZUJnXHJcbiAgXHJcbn07XHJcbiIsInZhciByZXNvdXJzZXMgPSB7XHJcbiAgaW1hZ2VzIDogdHJ1ZSxcclxuICB2aWRlbyA6IGZhbHNlLFxyXG5cclxuICBhcmVMb2FkZWQgOiBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHRoaXMudmlkZW8gJiYgdGhpcy5pbWFnZXNcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlkZW8oYXJyU3Jjc09mVmlkZW8pe1xyXG5cclxuICB2YXIgYXJyVmlkZW9zID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZlZpZGVvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgIHZpZGVvLnNyYyA9IGFyclNyY3NPZlZpZGVvW2ldO1xyXG4gICAgdmlkZW8ub25sb2FkZWRkYXRhID0gZnVuY3Rpb24oKXtcclxuICAgICAgdmlkZW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgbG9hZENvdW50Kys7XHJcbiAgICAgICAgdmlkZW8ubG9vcCA9IHRydWU7XHJcbiAgICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMudmlkZW8gPSB0cnVlO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBhcnJWaWRlb3MucHVzaCh2aWRlbyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJWaWRlb3M7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2VzKGFyclNyY3NPZkltYWdlcyl7XHJcblxyXG4gIHZhciBhcnJJbWFnZXMgPSBbXTsgXHJcbiAgdmFyIGNvdW50ID0gYXJyU3Jjc09mSW1hZ2VzLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgaW1nLnNyYyA9IGFyclNyY3NPZkltYWdlc1tpXTtcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICBsb2FkQ291bnQrKztcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMuaW1hZ2VzID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGFyckltYWdlcy5wdXNoKGltZyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJJbWFnZXM7XHJcbn07XHJcblxyXG52YXIgYXJyVmlkZW9zID0gbG9hZFZpZGVvKFtcclxuICBcIi4uL3ZpZGVvL2JnLm1wNFwiXHJcbl0pO1xyXG5cclxudmFyIGFyckltYWdlcyA9IGxvYWRJbWFnZXMoW1xyXG4gIFwiLi4vaW1nL2J1dHRvbi1tZW51LnN2Z1wiLFxyXG4gIFwiLi4vaW1nL2xvZ28ucG5nXCIsXHJcbiAgXCIuLi9pbWcvaGVhZGVyMy5zdmdcIixcclxuICBcIi4uL2ltZy9mdWxsc2NyZWVuLnN2Z1wiLFxyXG4gIFwiLi4vaW1nL3BhdXNlLnN2Z1wiLFxyXG4gIFwiLi4vaW1nL3dhbGwuc3ZnXCIsXHJcbiAgXCIuLi9pbWcvY3J5c3RhbGwtMDEuc3ZnXCJcclxuXSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG4gIHJlc291cnNlcyA6IHJlc291cnNlcyxcclxuXHJcbiAgYXJyVmlkZW9zIDogYXJyVmlkZW9zLFxyXG5cclxuICBhcnJJbWFnZXMgOiBhcnJJbWFnZXMgIFxyXG5cclxufTsiLCJ2YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGdhbWUgPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxuXHJcbnZhciBwYXVzZSA9IDA7XHJcbnZhciBiZWdpblRpbWUgPSAwO1xyXG52YXIgY3VycmVudFRpbWUgPSAwO1xyXG52YXIgdXBUaW1lVE87XHJcblxyXG5mdW5jdGlvbiB1cFRpbWUoY291bnRGcm9tKSB7XHJcblx0dmFyIG5vdyA9IG5ldyBEYXRlKCk7XHJcblx0dmFyIGRpZmZlcmVuY2UgPSAobm93LWNvdW50RnJvbSArIGN1cnJlbnRUaW1lKTtcclxuXHJcblx0dmFyIGhvdXJzPU1hdGguZmxvb3IoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKS8oNjAqNjAqMTAwMCkqMSk7XHJcblx0dmFyIG1pbnM9TWF0aC5mbG9vcigoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpLyg2MCoxMDAwKSoxKTtcclxuXHR2YXIgc2Vjcz1NYXRoLmZsb29yKCgoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpJSg2MCoxMDAwKSkvMTAwMCoxKTtcclxuXHJcblx0aG91cnMgPSAoIGhvdXJzIDwgMTApID8gXCIwXCIraG91cnMgOiBob3VycztcclxuXHRtaW5zID0gKCBtaW5zIDwgMTApID8gXCIwXCIrbWlucyA6IG1pbnM7XHJcblx0c2VjcyA9ICggc2VjcyA8IDEwKSA/IFwiMFwiK3NlY3MgOiBzZWNzO1xyXG5cclxuXHRvLnN0b3BXYXRjaC50eHQgPSBob3VycytcIiA6IFwiK21pbnMrXCIgOiBcIitzZWNzO1xyXG5cclxuXHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdHVwVGltZVRPPXNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdXBUaW1lKGNvdW50RnJvbSk7IH0sMTAwMC82MCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdHN0YXJ0IDogZnVuY3Rpb24oKSB7XHJcblx0XHQvLyBpZiAoZ2FtZS5zdGF0dXMgPT0gJ2dhbWUnIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJtZW51XCIgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcInBhdXNlXCIgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcImxldmVsc1wiKSB7XHJcblx0XHRcdHVwVGltZShuZXcgRGF0ZSgpKTtcclxuXHRcdFx0dmFyIG5vd1QgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0XHRiZWdpblRpbWUgPSBub3dULmdldFRpbWUoKTtcclxuXHRcdC8vIH0gZWxzZSB7XHJcblx0XHQvLyBcdHRoaXMucmVzZXQoKTtcclxuXHRcdC8vIH07XHJcblx0fSxcclxuXHJcblx0cmVzZXQgOiBmdW5jdGlvbigpIHtcclxuXHRcdGN1cnJlbnRUaW1lID0gMDtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblxyXG5cdFx0by5zdG9wV2F0Y2gudHh0ID0gXCIwMCA6IDAwIDogMDBcIjtcclxuXHRcdC8vIHRoaXMuc3RhcnQoKTtcclxuXHR9LFxyXG5cclxuXHRwYXVzZVRpbWVyIDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjdXJEYXRhID0gbmV3IERhdGUoKTtcclxuXHRcdGN1cnJlbnRUaW1lID0gY3VyRGF0YS5nZXRUaW1lKCkgLSBiZWdpblRpbWUgKyBjdXJyZW50VGltZTtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbiA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCB0eHQsIG5hbWUsIGZTaXplLCBmb250RmFtKXtcclxuICBcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuICB0aGlzLnR4dCA9IHR4dDtcclxuICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIHRoaXMuZlNpemUgPSBmU2l6ZTtcclxuICB0aGlzLnR4dENvbG9yID0gXCJ3aGl0ZVwiO1xyXG4gIHRoaXMuZm9udEZhbSA9IGZvbnRGYW0gfHwgXCJBcmlhbFwiO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbihub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gICAgdmFyIF9wYWRkID0gcGFkZCB8fCA1O1xyXG4gICAgdmFyIF94ID0gKCAhbm9DZW50ZXIgKSA/IHRoaXMueCt0aGlzLncvMiA6IHRoaXMueCtfcGFkZDtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIW5vQ2VudGVyICkgPyBcImNlbnRlclwiIDogXCJzdGFydFwiO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZTaXplICsgJ3B4ICcrdGhpcy5mb250RmFtO1xyXG4gICAgY3R4LnRleHRCYXNlbGluZT1cIm1pZGRsZVwiOyBcclxuICAgIGN0eC5maWxsVGV4dCh0aGlzLnR4dCwgX3gsIHRoaXMueSt0aGlzLmgvMik7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZSA9IGZ1bmN0aW9uKHNyYyl7XHJcbiAgdGhpcy5zcmMgPSBzcmM7XHJcbiAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcclxuXHJcbiAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG5cclxuICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxuICB9LmJpbmQodGhpcyk7XHJcblxyXG4gIGltZy5zcmMgPSBzcmM7XHJcblxyXG4gIHRoaXMuZG9tID0gaW1nO1xyXG5cclxuICB0aGlzLmRyYXdJbWcgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIGlmICggIXRoaXMubG9hZGVkICkgcmV0dXJuO1xyXG5cclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5kb20sMCwwKTtcclxuXHJcbiAgfTtcclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltZ0J1dHRvbiA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCwgdHh0LCBuYW1lLCBmU2l6ZSwgc2V0Q2VudGVyLCBub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcbiAgdGhpcy50eHRDb2xvciA9IFwid2hpdGVcIjtcclxuICB0aGlzLnNldENlbnRlciA9IHNldENlbnRlciB8fCB0aGlzLng7XHJcbiAgdGhpcy5ub0NlbnRlciA9IG5vQ2VudGVyIHx8IGZhbHNlO1xyXG4gIHRoaXMucGFkZCA9IHBhZGQgfHwgNTtcclxuXHJcbiAgdmFyIG1ldHJpY3MgPSBjdHgubWVhc3VyZVRleHQodGhpcy50eHQpLndpZHRoO1xyXG4gIHZhciBfeCA9ICggIXRoaXMubm9DZW50ZXIgKSA/IHRoaXMuc2V0Q2VudGVyK3RoaXMudy8yIDogdGhpcy54K3RoaXMucGFkZDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIXRoaXMubm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggY2FwdHVyZV9pdCc7XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGxheWFibGUgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVjdCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5tb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHN3aXRjaChkaXJlY3Rpb24pe1xyXG4gICAgICBjYXNlIFwidXBcIiA6IFxyXG4gICAgICB0aGlzLnkgLT0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJkb3duXCIgOiBcclxuICAgICAgdGhpcy55ICs9IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwibGVmdFwiIDpcclxuICAgICAgdGhpcy54IC09IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwicmlnaHRcIiA6IFxyXG4gICAgICB0aGlzLnggKz0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVmlkZW8gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCB2aWRlbyl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy52aWRlbyA9IHZpZGVvO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMudmlkZW8pIHtcclxuICAgICAgdGhpcy52aWRlby5wbGF5KCk7XHJcbiAgICAgIGNhbnZhcy5jdHguZHJhd0ltYWdlKHRoaXMudmlkZW8sIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi8uLi9fY29uc3QuanMnKTtcclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXYWxsID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuICBcclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyksXHJcblBsYXllYmxlID0gcmVxdWlyZSgnLi9jbGFzc2VzL1BsYXlhYmxlLmpzJyksXHJcbldhbGwgICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9XYWxsLmpzJyksXHJcbkltZ0J1dHRvbiA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWdCdXR0b24uanMnKSxcclxuVmlkZW8gICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1ZpZGVvLmpzJyksXHJcbkJ1dHRvbiAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9CdXR0b24uanMnKSxcclxuUmVjdCAgICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1JlY3QuanMnKSxcclxuSW1hZ2UgICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0ltYWdlLmpzJyksXHJcbkMgICAgICAgICA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyksXHJcbmV2ZW50cyAgICA9IHJlcXVpcmUoJy4vX2V2ZW50cy5qcycpLFxyXG5sZXZlbHMgICAgPSByZXF1aXJlKCcuL19sZXZlbHMuanMnKSxcclxubyAgICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpLFxyXG5jYW52YXMgICAgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxuXHJcbmVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubG9hZGVyKTtcclxuIl19
