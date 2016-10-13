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
//=========================================
//  кросбраузерное упрвление циклами игры
//=========================================
var canvas = require("./_canvas.js");

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

module.exports = {

	gameEngineStart : function (callback){
		gameEngine = callback;
		gameEngineStep();
	},

	setGameEngine : function(callback){
		if ( canvas.cnv.style.cursor != "default" ) canvas.cnv.style.cursor = "default";  //всегда при клике на любую кнопку, что б курсор стандартизировался
		gameEngine = callback;
	}

};

},{"./_canvas.js":1}],4:[function(require,module,exports){
var o      = require('./_objects.js');
var sw     = require('./_stopwatch.js');
var levels = require('./_levels.js');
var engin  = require('./_engine.js');
var gLoo   = require('./_gameLoops.js');
var hf     = require('./_helperFunctions.js');
var canvas = require('./_canvas.js');
var fs     = require('./_fullScreen.js');
var C      = require('./_const.js');
var key    = require('./_key.js');
var res    = require('./_resourses.js');

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

var isNear = {   //принимает 2 объекта, возвращает стоит ли с запрашиваемой стороны 1ый от 2го.

  up : function(obj_1, obj_2){
    if ( Object.prototype.toString.call(obj_2) == '[object Array]' ) {  //проверка передаваемый элемент массив объектов или объект.
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

function canMoveObj(direction){  //(описываем границы движения) разрешает движение в пределах уровня

  o.pl.direction = o.pl.isMove = hf.directionIs(direction);
  if ( isNear[direction](o.pl, o.box) && !isBorder[direction](o.box) && !isNear[direction](o.box, o.walls) ){      //если рядом с ящиком и ящик не у границ, двигаем.
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

function loadLevel(number){       //загрузка уровня
  sw.start();                          //запускаем таймер
  levels[number]();                    //запускаем уроверь который запросили
  gameLoops.currentLevel = number;     //запоминаем какой сейчас уровень играть будем 
  o.currLevel.txt = "Уровень "+number; //в хедере выводим номер уровня
  engin.setGameEngine(gameLoops.game); //ну и запускаем цикл игры 
};

window.onkeydown = function(e){   //событие нажатия клавиш

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

  if ( fs.isFullScreen ){      
    var x = (e.pageX-canvas.cnv.offsetLeft)/fs.zoom;
    var y = (e.pageY-canvas.cnv.offsetTop)/fs.zoom;
  } else {
    var x = e.pageX-canvas.cnv.offsetLeft;
    var y = e.pageY-canvas.cnv.offsetTop;
  };

  switch (gLoo.status){

    case "menu" :
      for ( i in o.menu ){
        if ( isCursorInButton(x,y,o.menu[i]) ){
          switch (o.menu[i].name) {

            case "play" :
            loadLevel(gameLoops.currentLevel);
            break;

            case "change_level" :
            engin.setGameEngine(gameLoops.levels);
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
            engin.setGameEngine(gameLoops.menu);
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
        engin.setGameEngine(gameLoops.pause);
      };

      if ( isCursorInButton(x,y,o.bFullScr) ){
        ( !fs.isFullScreen ) ? fs.launchFullScreen(canvas.cnv) : fs.canselFullScreen(); 
      };
      break;

    case "win" :

      for ( i in o.winPopUp ){
        if ( isCursorInButton(x,y,o.winPopUp[i]) ){
          if ( o.winPopUp[i].name == "pop_exit" ){
            engin.setGameEngine(gameLoops.menu);
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
              engin.setGameEngine(gameLoops.game);
              break;

            case "restart" :
              sw.reset();
              loadLevel(gameLoops.currentLevel);
              break;

            case "exit" :
              sw.reset();
              engin.setGameEngine(gameLoops.menu);
              break;

          };
        };
      };
      break;

  };
};

window.onmousemove = function(e){ //события движения мышки, тут ховеры обработаем

  if ( fs.isFullScreen ){
    var x = (e.pageX-canvas.cnv.offsetLeft)/fs.zoom;
    var y = (e.pageY-canvas.cnv.offsetTop)/fs.zoom;
  } else {
    var x = e.pageX-canvas.cnv.offsetLeft;
    var y = e.pageY-canvas.cnv.offsetTop;
  };

  switch (gLoo.status){

    case "menu" :
      for ( i in o.menu ){
        ( isCursorInButton(x,y,o.menu[i]) ) ? o.menu[i].hover(1) : o.menu[i].hover();
      };
      break;

    case "game" :
      ( isCursorInButton(x,y,o.bPause) ) ? o.bPause.hover(1) : o.bPause.hover();

      ( isCursorInButton(x,y,o.bFullScr) ) ? o.bFullScr.hover(1) : o.bFullScr.hover();  
      break;

    case "win" :
      for ( i in o.winPopUp ){
        if ( isCursorInButton(x,y,o.winPopUp[i]) ){
          if ( o.winPopUp[i].name == "pop_exit" ){
            o.winPopUp[i].hover(1);
          } else if ( o.winPopUp[i].name == "pop_next" && gameLoops.currentLevel != levels.lvlsCount() ){
            o.winPopUp[i].hover(1);
          };
        } else {
          if ( o.winPopUp[i].hover ) o.winPopUp[i].hover();
        };
      };
      break;

    case "levels" :
      for ( i in o.levelsFooter ){
        ( isCursorInButton(x,y,o.levelsFooter[i]) ) ? o.levelsFooter[i].hover(1) : o.levelsFooter[i].hover();
      };

      for ( var i = 0; i < o.bLevelsButtons.length; i++ ){
        ( isCursorInButton(x,y,o.bLevelsButtons[i]) ) ? o.bLevelsButtons[i].hover(1) : o.bLevelsButtons[i].hover();
      };
      break;
  
    case "pause" :
      for ( i in o.pausePopUp ){
        if ( isCursorInButton(x,y,o.pausePopUp[i]) ){
          if ( o.pausePopUp[i].hover ) o.pausePopUp[i].hover(1);
        } else {
          if ( o.pausePopUp[i].hover ) o.pausePopUp[i].hover();
        };
      };
      break;
  };
};
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_fullScreen.js":5,"./_gameLoops.js":6,"./_helperFunctions.js":7,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./_resourses.js":12,"./_stopwatch.js":13}],5:[function(require,module,exports){
var canvas = require('./_canvas.js');
var C = require('./_const.js');

var zoom = 0;

function fullCanvas(){	//канва во весь экран

	var deviceWidth = window.screen.availWidth;
	var deviceHeight = window.screen.availHeight;
	fullScreen.zoom = (deviceHeight / C.HEIGHT).toFixed(1);	//какое увеличение сделать исходя из размеров экрана.

	canvas.cnv.width = canvas.cnv.width*fullScreen.zoom;
	canvas.cnv.height = canvas.cnv.height*fullScreen.zoom;
	canvas.ctx.scale(fullScreen.zoom,fullScreen.zoom);

	fullScreen.isFullScreen = !fullScreen.isFullScreen;
};

function normalCanvas(){	//исходное состояние канвы

	//cохраняем последний кадр игры, дабы при возвращении размера после фулскрина, он отрисовался, иначе будет белый холст.
	var bufCnv = document.createElement("canvas");
	var bufCtx = bufCnv.getContext("2d");
	bufCnv.width = canvas.cnv.width/fullScreen.zoom;
	bufCnv.height = canvas.cnv.height/fullScreen.zoom;
	bufCtx.drawImage(canvas.cnv, 0,0, canvas.cnv.width/fullScreen.zoom, canvas.cnv.height/fullScreen.zoom);

	canvas.cnv.width = canvas.cnv.width/fullScreen.zoom;
	canvas.cnv.height = canvas.cnv.height/fullScreen.zoom;
	canvas.ctx.scale(1,1);
	canvas.ctx.drawImage(bufCnv,0,0,canvas.cnv.width,canvas.cnv.height);

	fullScreen.isFullScreen = !fullScreen.isFullScreen;
};

function onFullScreenChange(){	//при измении состояние фулскрина

	( fullScreen.isFullScreen ) ? normalCanvas() : fullCanvas();
};

canvas.cnv.addEventListener("webkitfullscreenchange", onFullScreenChange);
canvas.cnv.addEventListener("mozfullscreenchange",    onFullScreenChange);
canvas.cnv.addEventListener("fullscreenchange",       onFullScreenChange);

module.exports = fullScreen = { 

	launchFullScreen : function(elem){

		if ( elem.requestFullScreen ){
			elem.requestFullScreen();
		} else if ( elem.mozRequestFullScreen ){
			elem.mozRequstFullScreen();
		} else if ( elem.webkitRequestFullScreen ){
			elem.webkitRequestFullScreen();
		};
	},

	canselFullScreen : function(){

		if ( document.exitFullscreen ){
			document.exitFullscreen();
		} else if ( document.mozCancelFullScreen ){
			document.mozCancelFullScreen();
		} else if ( document.webkitExitFullscreen ){
			document.webkitExitFullscreen();
		};
	},

	isFullScreen : false,

	zoom : zoom

};
},{"./_canvas.js":1,"./_const.js":2}],6:[function(require,module,exports){
var C = require('./_const.js');
var o = require('./_objects.js');
var hf = require('./_helperFunctions.js');
var engin = require('./_engine.js');
var res = require('./_resourses.js');
var preloader = require('./_preloader.js');

module.exports = gameLoops =  {

  loader : function(){

    gameLoops.status = "loader";

    preloader.updateLoader();
    preloader.drawLoader();
    preloader.drawLoadText();
    
    if ( res.resourses.areLoaded() ) engin.setGameEngine(gameLoops.menu);
  },

  game : function(){

    gameLoops.status = "game"; 

    //очистка области
    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    //отрисовка бг уровня
    o.bgLevel.draw();
    
    //отрисовка матричное поле игры
    for ( i in o.matrix ){
      o.matrix[i].draw();
    };

    //отрисовка стены\преграды
    for ( i in o.walls ){
      o.walls[i].draw();
    };

    //отрисовка хедера уровня
    o.header.draw();
    o.stopWatch.draw(1,10);
    o.bFullScr.draw();
    o.bPause.draw();
    o.currLevel.draw();

    //отрисовка игровых объектов
    o.door.draw();
    o.pl.draw();
    o.box.draw();

    //если победили
    if ( hf.isWin() ){
      o.bgOpacity.draw();
      engin.setGameEngine(gameLoops.win);
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
      if ( o.winPopUp[i].name == "win_text" ) o.winPopUp[i].txt = "Уровень "+gameLoops.currentLevel;
      
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

    o.videoBgLevels.draw();

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

},{"./_const.js":2,"./_engine.js":3,"./_helperFunctions.js":7,"./_objects.js":10,"./_preloader.js":11,"./_resourses.js":12}],7:[function(require,module,exports){
var canvas = require('./_canvas.js');
var o = require('./_objects.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = {

  clearRect : function(x,y,w,h){      //очиститель
    ctx.clearRect(x,y,w,h);
  },

  getRandomInt : function(min, max) { //функция для рандома целочисленного значения
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  isWin : function(){                 //победили?
    return o.box.x == o.door.x && o.box.y == o.door.y;
  },

  directionIs : function(direction){  //возвращает угол поворота в градусах, можно было и сделать проще - объектом.
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
  }
};

},{"./_canvas.js":1,"./_objects.js":10}],8:[function(require,module,exports){
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
var hf = require('./_helperFunctions.js');

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
		o.pl.setDirection( hf.directionIs("right") );
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
		o.pl.setDirection( hf.directionIs("right") );
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
		o.pl.setDirection( hf.directionIs("up") );
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
		o.pl.setDirection( hf.directionIs("up") );
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
		o.pl.setDirection( hf.directionIs("down") );
		o.box.setPosition( 0+1*(50+C.PDNG), 0+1*(50+C.PDNG) );
		o.door.setPosition( 0, 0+8*(50+C.PDNG) );

		o.walls = _walls;

	}

};

},{"./_const.js":2,"./_helperFunctions.js":7,"./_objects.js":10,"./_resourses.js":12}],10:[function(require,module,exports){
var C = require('./_const.js');
var cnvs = require('./_canvas.js');
var res = require('./_resourses.js');


function createMatrixBG(){             //создаем матричное поле
  var matrix = [];                     //массив для матричного вида уровня

  for (var i = 0; i < 9; i++){         //заполняем объект
    for (var j = 0; j < 9; j++){
      matrix.push( new Rect(C.PDNG+j*(50+C.PDNG), 71+C.PDNG+i*(50+C.PDNG), 50, 50, "rgba(0,0,0,0.5)", true) );
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
    menu.push( new ImgButton( res.arrImages[0], _x, _y+i*85, 300, 60, txt[i], names[i], _fontsize, 83 ) );
    menu[i].hoverImg = res.arrImages[21];
  };

  return menu;
};

function createWinPopUp(){             //создаем победную вспллывашку

  var winPopBG = new Image( res.arrImages[16], C.WIDTH/2-320/2, C.HEIGHT/2-200/2, 320, 200);
  var bPopExit = new ImgButton( res.arrImages[12], winPopBG.x+30,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_exit", 0 );
  bPopExit.hoverImg = res.arrImages[26];
  var bPopNext = new ImgButton( res.arrImages[15], winPopBG.x+30+110+80,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_next", 0 );
  bPopNext.hoverImg = res.arrImages[29];
  var winText = new Button( C.WIDTH/2-90/2, winPopBG.y+15, 90, 40, "transparent", "Уровень N", "win_text", 30, "Buccaneer" );
  var winText_2 = new Button( C.WIDTH/2-90/2+10, winPopBG.y+80, 90, 40, "transparent", "ПРОЙДЕН!", "win_text_2", 50, "aZZ_Tribute_Bold" );

  winText.txtColor = "#D9C425";

  var winPopUp = [];
  winPopUp.push(winPopBG, bPopExit, bPopNext, winText, winText_2);

  return winPopUp;
};

function createPausePopUp(){           //создаем пауз всплывашку

  var pausePopUp = [];
  var bgPause = new Image( res.arrImages[13], C.WIDTH/2-300/2, C.HEIGHT/2-207/2, 300, 207);
  var bReturn = new ImgButton( res.arrImages[10], bgPause.x+190,  bgPause.y-25, 63, 57, "", "return", 0 );
  bReturn.hoverImg = res.arrImages[24];
  var bExitToMenu = new ImgButton( res.arrImages[12],  bgPause.x+50,  bgPause.y+bgPause.h-50, 85, 70, "", "exit", 0 );
  bExitToMenu.hoverImg = res.arrImages[26];
  var bRestart = new ImgButton( res.arrImages[11],  bgPause.x+50+30+85,  bgPause.y+bgPause.h-50, 85, 70, "", "restart", 0 );
  bRestart.hoverImg = res.arrImages[25];
  var pauseText = new Image( res.arrImages[14], bgPause.x + bgPause.w/2 - 150/2, bgPause.y + bgPause.h/2 - 100/2, 150, 100);

  pausePopUp.push(bgPause, bReturn, bExitToMenu, bRestart, pauseText);

  return pausePopUp;
};

function createLevelsButtons(levels_count){ //создаем кнопки в выборе уровня

  var bLevelsButtons = [];
  var j = 0, dy = 85, dx = 0;

  for ( i=0; i < levels_count; i++){
    dx = 8+j*(100+15);

    bLevelsButtons.push( new ImgButton( res.arrImages[17], dx, dy, 100, 100, i+1, "level_"+(i+1), 35 ) );
    bLevelsButtons[i].hoverImg = res.arrImages[27];

    j++;

    if ( dx > C.WIDTH-115 ){
      dy += (125);
      j = 0;
    }

  };

  return bLevelsButtons;
};
                                       
function createLevelsFooter(){         //создаем футер в выборе уровня

  var levelsFooter = [];

  var bPrev = new ImgButton( res.arrImages[19], 20, C.HEIGHT-10-67, 40, 67, "", "prev", 0 );
  var bNext = new ImgButton( res.arrImages[18], C.WIDTH-20-40, C.HEIGHT-10-67, 40, 67, "", "next", 0 );
  var bToMenu = new ImgButton( res.arrImages[20], C.WIDTH/2 - 320/2, C.HEIGHT-10-67, 320, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.hoverImg = res.arrImages[28];
  bToMenu.txtColor = "#000046";

  levelsFooter.push(bPrev,bNext,bToMenu);

  return levelsFooter;
};

function createPlayer(){               //создаем игрока с уникальными методами

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
var matrix = createMatrixBG();         //bg уровня
var bgLevel = new Image( res.arrImages[8], 0, 0, C.WIDTH, C.HEIGHT );
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//game header
var header = new Image( res.arrImages[2], 0, 0, C.WIDTH, 71+C.PDNG );
var bFullScr = new ImgButton( res.arrImages[3], C.WIDTH-45-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "fullScr", 0 );
bFullScr.hoverImg = res.arrImages[22];
var stopWatch = new Button( 10, header.h/2-C.CNV_BORDER/2 - 40/2, 120, 40, "transparent", "00 : 00 : 00", "stopwatch", 25, "dited" );
var bPause = new ImgButton( res.arrImages[4], C.WIDTH-45-7-bFullScr.w-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "pause", 0 );
bPause.hoverImg = res.arrImages[23];
var currLevel = new Button( (stopWatch.x+stopWatch.w+bPause.x)/2-140/2, header.h/2-C.CNV_BORDER/2 - 40/2, 140, 40, "transparent", "Уровень", "curr_level", 25, "capture_it" );


//change level
var levelsHeader = new ImgButton( res.arrImages[2], 0, 0, C.WIDTH, 71+C.PDNG, "Выбор уровня", "levels_header", 25 );
var bLevelsButtons = createLevelsButtons(5);
var levelsFooter = createLevelsFooter();


//win pop-up
var winPopUp = createWinPopUp();


//pause pop-up
var pausePopUp = createPausePopUp();


//playable obj
var pl = createPlayer();                             //персонаж
var box = new Playable(res.arrImages[6],0,0,50,50);  //бокс
var door = new Playable(res.arrImages[7],0,0,50,50); //дверь
var walls = [];                                      //стены на уровне, заполняется выбранным уровнем.


//videos
var animateBg = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[0]);
var videoBgLevels = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[1]);



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
  animateBg : animateBg,
  videoBgLevels : videoBgLevels,
  PRELOADER : new Rect(0,0,C.WIDTH,C.HEIGHT,"black")
  
};

},{"./_canvas.js":1,"./_const.js":2,"./_resourses.js":12}],11:[function(require,module,exports){
var canvas = require('./_canvas.js');
var C = require('./_const.js');
	
var count    = 75;
var rotation = 270*(Math.PI/180);		
var speed    = 6;
	
module.exports = { 
  
 	updateLoader : function(){
 		canvas.ctx.save();
 		canvas.ctx.globalCompositeOperation = 'destination-out';
 		canvas.ctx.fillStyle = 'rgba(255,255,255,.035)';
 		canvas.ctx.fillRect(0,0,500,500);
 		rotation += speed/100;
 		canvas.ctx.restore();									
 	},

 	drawLoader : function(){							
 		canvas.ctx.save();
 		canvas.ctx.globalCompositeOperation = 'source-over';
 		canvas.ctx.translate(C.WIDTH/2, C.HEIGHT/2);
 		canvas.ctx.lineWidth = 0.25;
		canvas.ctx.strokeStyle = 'rgba(255,255,255,1.0)';
 		canvas.ctx.rotate(rotation);	
 		var i = count;
 		while(i--){								
 			canvas.ctx.beginPath();
 			canvas.ctx.arc(0, 0, i+(Math.random()*35), Math.random(), Math.PI/3+(Math.random()/12), false);								
 			canvas.ctx.stroke();
 		}	
 		canvas.ctx.restore();

 		canvas.ctx.save();
 		canvas.ctx.globalCompositeOperation = 'destination-over';
 		canvas.ctx.fillStyle = 'rgba(0,0,0,1)';
 		canvas.ctx.fillRect(0,0,C.WIDTH,C.HEIGHT);	
 		canvas.ctx.restore();										
 	},

 	drawLoadText : function(){
 		var winText = new Button( C.WIDTH/2-250/2, 25, 250, 40, "black", "Идет загрузка..", "load-text", 30, "Buccaneer" );
  		return winText.draw();
 	}
}; 

  
},{"./_canvas.js":1,"./_const.js":2}],12:[function(require,module,exports){
var resourses = {
  images : false,
  video  : false,

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
    video.oncanplaythrough = function(){
      loadCount++;
      video.loop = true;
      if ( loadCount == count ) resourses.video = true;
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
  "video/bg.mp4",
  "video/Lightmirror.mp4"
]);

var arrImages = loadImages([
  "img/menu__button-menu.svg",                //0 
  "img/menu__logo.png",                       //1

  "img/game__bg-header.svg",                  //2 
  "img/game__button-fullscreen.svg",          //3 
  "img/game__button-pause.svg",               //4 
  "img/game__wall.svg",                       //5 
  "img/game__crystall.svg",                   //6 
  "img/game__portal.svg",                     //7 
  "img/game__ground.jpg",                     //8 
  'img/game__player.png',                     //9 

  "img/pause__button-close.svg",              //10
  "img/pause__button-restart.svg",            //11
  "img/pause__button-toMenu.svg",             //12
  "img/pause__bg.svg",                        //13
  "img/pause__text.svg",                      //14

  "img/win__button-next.svg",                 //15
  "img/win__bg.svg",                          //16

  "img/levels__button-levels.svg",            //17
  "img/levels__button-next.svg",              //18
  "img/levels__button-prev.svg",              //19
  "img/levels__button-toMenu.svg",            //20

  "img/hovers/menu__button-menu_hover.svg",       //21
  "img/hovers/game__button-fullscreen_hover.svg", //22
  "img/hovers/game__button-pause_hover.svg",      //23
  "img/hovers/pause__button-close_hover.svg",     //24
  "img/hovers/pause__button-restart_hover.svg",   //25
  "img/hovers/pause__button-toMenu_hover.svg",    //26
  "img/hovers/levels__button-levels_hover.svg",   //27
  "img/hovers/levels__button-toMenu_hover.svg",   //28
  "img/hovers/win__button-next_hover.svg"         //29

]);

module.exports = { 

  resourses : resourses,

  arrVideos : arrVideos,

  arrImages : arrImages  

};



},{}],13:[function(require,module,exports){
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
},{"./_gameLoops.js":6,"./_objects.js":10}],14:[function(require,module,exports){
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
},{"./../_canvas.js":1}],15:[function(require,module,exports){
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
},{"./../_canvas.js":1}],16:[function(require,module,exports){
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
  this.hoverImg = false;

  var metrics = ctx.measureText(this.txt).width; //размер-ширина передаваемого текста
  var _x = ( !this.noCenter ) ? this.setCenter+this.w/2 : this.x+this.padd;

  this.draw = function(){

    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);

    ctx.fillStyle = this.txtColor;
    ctx.textAlign = ( !this.noCenter ) ? "center" : "start";
    ctx.font = this.fSize + 'px capture_it';
    ctx.textBaseline="middle"; 
    ctx.fillText(this.txt, _x, this.y+this.h/2);
  };

  var _img = false; //будет хранить временно картинку стандартную.

  this.hover = function(draw){

    if (draw && this.hoverImg) {             //если передали истину и ховер у этого объекта есть, то отрисовываем ховер
      if (!_img) _img = this.img;            // если еще не была сохранена стандартная картинка, то сохраняем и..
      this.img = this.hoverImg;              //..новой будет выводится переданная
      cnv.style.cursor = "pointer";          //и курсор будет поинтер
    } else if ( _img && _img != this.img){   //иначе если была сохранена картинка и не она в данный момент отрисовывается, то
      this.img = _img;                       //возвращаем стандарт картинку на место
      cnv.style.cursor = "default";          //и курсор делаем стандартным
    };
  };

};
},{"./../_canvas.js":1}],17:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],18:[function(require,module,exports){
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
    if (!this.isStroke) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    } else {
      ctx.strokeStyle = this.color;
      ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
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
},{"./../_canvas.js":1,"./../_const.js":2}],19:[function(require,module,exports){
var canvas = require('./../_canvas.js');
var C = require('./../_const.js')

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Video = function(x, y, w, h, video){

  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.video = video;

  var save = false;
  var bufCnv = document.createElement("canvas");
  var bufCtx = bufCnv.getContext("2d");
  bufCnv.width = C.WIDTH;
  bufCnv.height = C.HEIGHT;

  this.draw = function(){
    if (this.video) {
      if ( !save ){
        bufCtx.drawImage(this.video, this.x, this.y, this.w, this.h);
        save = true;
      };
      
      this.video.play();
      canvas.ctx.drawImage(bufCnv, this.x, this.y, this.w, this.h);
      canvas.ctx.drawImage(this.video, this.x, this.y, this.w, this.h);

    };
  };

};
},{"./../_canvas.js":1,"./../_const.js":2}],20:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],21:[function(require,module,exports){
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

// музыку думать




// настройки - шоб там управлять размерами наверное.. хз пока
// шрифт надо подгружать ранее, например отрисовать его в прелойдере невидимо.
// хайдить кнопки в выборе уровня
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Button.js":14,"./classes/Image.js":15,"./classes/ImgButton.js":16,"./classes/Playable.js":17,"./classes/Rect.js":18,"./classes/Video.js":19,"./classes/Wall.js":20}]},{},[21])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcHJlbG9hZGVyLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3Jlc291cnNlcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19zdG9wd2F0Y2guanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0J1dHRvbi5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvSW1hZ2UuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0ltZ0J1dHRvbi5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvUGxheWFibGUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1JlY3QuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1ZpZGVvLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9XYWxsLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvZmFrZV9mYjM1MGM4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgY252ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcbnZhciBjdHggPSBjbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuY252LnN0eWxlLmJvcmRlciA9IFwiMnB4IHNvbGlkIGJsYWNrXCI7XHJcbmNudi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIndoaXRlXCI7XHJcbmNudi53aWR0aCA9IEMuV0lEVEg7XHJcbmNudi5oZWlnaHQgPSBDLkhFSUdIVDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRjbnYgOiBjbnYsXHJcblxyXG5cdGN0eCA6IGN0eFxyXG5cclxufTsiLCJ2YXIgUEFERCA9IDE7IFx0XHRcdFx0XHRcdC8v0L/QsNC00LTQuNC90LMsINC60L7RgtC+0YDRi9C5INGPINGF0L7Rh9GDINGH0YLQvtCx0Ysg0LHRi9C7LCDQvNC10LYg0LrQstCw0LTRgNCw0YLQsNC80LhcclxudmFyIFdJRFRIID0gUEFERCArIChQQUREKzUwKSo5OyBcdC8v0YjQuNGA0LjQvdCwINC60LDQvdCy0YtcclxudmFyIEhFSUdIVCA9IDIwK1BBREQgKyAoUEFERCs1MCkqMTA7ICAgLy/QstGL0YHQvtGC0LAg0LrQsNC90LLRi1xyXG52YXIgQ05WX0JPUkRFUiA9IDI7XHJcbnZhciBIRUFERVJfSCA9IDcxO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdFBETkcgOiBQQURELFxyXG5cclxuXHRXSURUSCA6IFdJRFRILFxyXG5cclxuXHRIRUlHSFQgOiBIRUlHSFQsXHJcblxyXG5cdENOVl9CT1JERVIgOiBDTlZfQk9SREVSLFxyXG5cclxuXHRIRUFERVJfSCA6IEhFQURFUl9IXHJcblxyXG59O1xyXG4iLCIvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vICDQutGA0L7RgdCx0YDQsNGD0LfQtdGA0L3QvtC1INGD0L/RgNCy0LvQtdC90LjQtSDRhtC40LrQu9Cw0LzQuCDQuNCz0YDRi1xyXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKFwiLi9fY2FudmFzLmpzXCIpO1xyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRnYW1lRW5naW5lU3RhcnQgOiBmdW5jdGlvbiAoY2FsbGJhY2spe1xyXG5cdFx0Z2FtZUVuZ2luZSA9IGNhbGxiYWNrO1xyXG5cdFx0Z2FtZUVuZ2luZVN0ZXAoKTtcclxuXHR9LFxyXG5cclxuXHRzZXRHYW1lRW5naW5lIDogZnVuY3Rpb24oY2FsbGJhY2spe1xyXG5cdFx0aWYgKCBjYW52YXMuY252LnN0eWxlLmN1cnNvciAhPSBcImRlZmF1bHRcIiApIGNhbnZhcy5jbnYuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7ICAvL9Cy0YHQtdCz0LTQsCDQv9GA0Lgg0LrQu9C40LrQtSDQvdCwINC70Y7QsdGD0Y4g0LrQvdC+0L/QutGDLCDRh9GC0L4g0LEg0LrRg9GA0YHQvtGAINGB0YLQsNC90LTQsNGA0YLQuNC30LjRgNC+0LLQsNC70YHRj1xyXG5cdFx0Z2FtZUVuZ2luZSA9IGNhbGxiYWNrO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvICAgICAgPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBzdyAgICAgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyk7XHJcbnZhciBnTG9vICAgPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmICAgICA9IHJlcXVpcmUoJy4vX2hlbHBlckZ1bmN0aW9ucy5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBmcyAgICAgPSByZXF1aXJlKCcuL19mdWxsU2NyZWVuLmpzJyk7XHJcbnZhciBDICAgICAgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIga2V5ICAgID0gcmVxdWlyZSgnLi9fa2V5LmpzJyk7XHJcbnZhciByZXMgICAgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxuXHJcbnZhciBnYW1lTG9vcHMgPSBnTG9vO1xyXG5cclxudmFyIGlzQm9yZGVyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiDQvtCx0YrQtdC60YIsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC+0LzQuSDQs9GA0LDQvdC40YbRiyDQutCw0L3QstGLXHJcbiAgdXAgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai55ID09IDA7XHJcbiAgfSxcclxuXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnkgPT0gQy5IRUlHSFQgLSBvYmouaCAtIEMuUERORyAtIEMuSEVBREVSX0ggLSBDLlBETkc7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gMDtcclxuICB9LFxyXG5cclxuICByaWdodCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gQy5XSURUSCAtIG9iai53IC0gQy5QRE5HIC0gQy5QRE5HXHJcbiAgfVxyXG59O1xyXG5cclxudmFyIGlzTmVhciA9IHsgICAvL9C/0YDQuNC90LjQvNCw0LXRgiAyINC+0LHRitC10LrRgtCwLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvNC+0Lkg0YHRgtC+0YDQvtC90YsgMdGL0Lkg0L7RgiAy0LPQvi5cclxuXHJcbiAgdXAgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7ICAvL9C/0YDQvtCy0LXRgNC60LAg0L/QtdGA0LXQtNCw0LLQsNC10LzRi9C5INGN0LvQtdC80LXQvdGCINC80LDRgdGB0LjQsiDQvtCx0YrQtdC60YLQvtCyINC40LvQuCDQvtCx0YrQtdC60YIuXHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS55ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi55ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBkb3duIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnggKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnggKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH0sXHJcblxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gY2FuTW92ZU9iaihkaXJlY3Rpb24peyAgLy8o0L7Qv9C40YHRi9Cy0LDQtdC8INCz0YDQsNC90LjRhtGLINC00LLQuNC20LXQvdC40Y8pINGA0LDQt9GA0LXRiNCw0LXRgiDQtNCy0LjQttC10L3QuNC1INCyINC/0YDQtdC00LXQu9Cw0YUg0YPRgNC+0LLQvdGPXHJcblxyXG4gIG8ucGwuZGlyZWN0aW9uID0gby5wbC5pc01vdmUgPSBoZi5kaXJlY3Rpb25JcyhkaXJlY3Rpb24pO1xyXG4gIGlmICggaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby5ib3gpICYmICFpc0JvcmRlcltkaXJlY3Rpb25dKG8uYm94KSAmJiAhaXNOZWFyW2RpcmVjdGlvbl0oby5ib3gsIG8ud2FsbHMpICl7ICAgICAgLy/QtdGB0LvQuCDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDRj9GJ0LjQuiDQvdC1INGDINCz0YDQsNC90LjRhiwg0LTQstC40LPQsNC10LwuXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIG8uYm94Lm1vdmUoZGlyZWN0aW9uKTtcclxuICB9IGVsc2UgaWYoICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5wbCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0L3QtSDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0LPRgNCw0L3QuNGG0LXQuSwg0LTQstC40LPQsNC10LzRgdGPLlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNDdXJzb3JJbkJ1dHRvbih4LHksYnV0KXsgLy/QstC+0LfQstGA0LDRidCw0LXRgiDRgtGA0YMsINC10YHQu9C4INC60YPRgNGB0L7RgCDQv9C+0L/QsNC7INCyINC60L7QvtGA0LTQuNC90LDRgtGLINC+0LHRitC10LrRgtCwXHJcbiAgcmV0dXJuIHggPj0gYnV0LnggJiYgXHJcbiAgeCA8PSBidXQueCtidXQudyAmJiBcclxuICB5ID49IGJ1dC55ICYmIFxyXG4gIHkgPD0gYnV0LnkrYnV0LmhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGxvYWRMZXZlbChudW1iZXIpeyAgICAgICAvL9C30LDQs9GA0YPQt9C60LAg0YPRgNC+0LLQvdGPXHJcbiAgc3cuc3RhcnQoKTsgICAgICAgICAgICAgICAgICAgICAgICAgIC8v0LfQsNC/0YPRgdC60LDQtdC8INGC0LDQudC80LXRgFxyXG4gIGxldmVsc1tudW1iZXJdKCk7ICAgICAgICAgICAgICAgICAgICAvL9C30LDQv9GD0YHQutCw0LXQvCDRg9GA0L7QstC10YDRjCDQutC+0YLQvtGA0YvQuSDQt9Cw0L/RgNC+0YHQuNC70LhcclxuICBnYW1lTG9vcHMuY3VycmVudExldmVsID0gbnVtYmVyOyAgICAgLy/Qt9Cw0L/QvtC80LjQvdCw0LXQvCDQutCw0LrQvtC5INGB0LXQudGH0LDRgSDRg9GA0L7QstC10L3RjCDQuNCz0YDQsNGC0Ywg0LHRg9C00LXQvCBcclxuICBvLmN1cnJMZXZlbC50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK251bWJlcjsgLy/QsiDRhdC10LTQtdGA0LUg0LLRi9Cy0L7QtNC40Lwg0L3QvtC80LXRgCDRg9GA0L7QstC90Y9cclxuICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5nYW1lKTsgLy/QvdGDINC4INC30LDQv9GD0YHQutCw0LXQvCDRhtC40LrQuyDQuNCz0YDRiyBcclxufTtcclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbihlKXsgICAvL9GB0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC60LvQsNCy0LjRiFxyXG5cclxuICBpZiAoIGdMb28uc3RhdHVzID09IFwiZ2FtZVwiICl7IC8v0L/QtdGA0LXQtNCy0LjQs9Cw0YLRjNGB0Y8g0YLQvtC70YzQutC+INC10YHQu9C4INC40LTQtdGCINC40LPRgNCwLlxyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIkRcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwicmlnaHRcIik7XHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiU1wiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJkb3duXCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIldcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwidXBcIik7XHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiQVwiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJsZWZ0XCIpO1xyXG5cclxuICB9O1xyXG5cclxuICB3aW5kb3cub25rZXl1cCA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgby5wbC5pc01vdmUgPSBmYWxzZTtcclxuICB9O1xyXG59O1xyXG5cclxud2luZG93Lm9ubW91c2Vkb3duID0gZnVuY3Rpb24oZSl7IC8vY9C+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQvNGL0YjQutC4XHJcblxyXG4gIGlmICggZnMuaXNGdWxsU2NyZWVuICl7ICAgICAgXHJcbiAgICB2YXIgeCA9IChlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdCkvZnMuem9vbTtcclxuICAgIHZhciB5ID0gKGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3ApL2ZzLnpvb207XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciB4ID0gZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQ7XHJcbiAgICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcbiAgfTtcclxuXHJcbiAgc3dpdGNoIChnTG9vLnN0YXR1cyl7XHJcblxyXG4gICAgY2FzZSBcIm1lbnVcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLm1lbnVbaV0pICl7XHJcbiAgICAgICAgICBzd2l0Y2ggKG8ubWVudVtpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicGxheVwiIDpcclxuICAgICAgICAgICAgbG9hZExldmVsKGdhbWVMb29wcy5jdXJyZW50TGV2ZWwpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJjaGFuZ2VfbGV2ZWxcIiA6XHJcbiAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmxldmVscyk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImxldmVsc1wiIDpcclxuICAgICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5sZXZlbHNGb290ZXJbaV0pICl7XHJcbiAgICAgICAgICBzd2l0Y2ggKG8ubGV2ZWxzRm9vdGVyW2ldLm5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmV2XCIgOlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcItCa0L3QvtC/0LrQsCDQvdCw0LfQsNC0LCDQv9C+0LrQsCDRgtCw0LouXCIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJ0b19tZW51XCIgOlxyXG4gICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwibmV4dFwiIDpcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0LLQv9C10YDQtdC0LCDQv9C+0LrQsCDRgtCw0LouXCIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJMZXZlbHNCdXR0b25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJMZXZlbHNCdXR0b25zW2ldKSApe1xyXG4gICAgICAgICAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9IGkrMTtcclxuICAgICAgICAgIGxvYWRMZXZlbChpKzEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJnYW1lXCIgOlxyXG4gICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYlBhdXNlKSApe1xyXG4gICAgICAgIHN3LnBhdXNlVGltZXIoKTtcclxuICAgICAgICBvLmJnT3BhY2l0eS5kcmF3KCk7XHJcbiAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMucGF1c2UpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJGdWxsU2NyKSApe1xyXG4gICAgICAgICggIWZzLmlzRnVsbFNjcmVlbiApID8gZnMubGF1bmNoRnVsbFNjcmVlbihjYW52YXMuY252KSA6IGZzLmNhbnNlbEZ1bGxTY3JlZW4oKTsgXHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJ3aW5cIiA6XHJcblxyXG4gICAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ud2luUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgIT0gbGV2ZWxzLmx2bHNDb3VudCgpICl7XHJcbiAgICAgICAgICAgIHN3LnJlc2V0KCk7XHJcbiAgICAgICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwrKztcclxuICAgICAgICAgICAgbG9hZExldmVsKGdhbWVMb29wcy5jdXJyZW50TGV2ZWwpO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwicGF1c2VcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5wYXVzZVBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLnBhdXNlUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBzd2l0Y2ggKG8ucGF1c2VQb3BVcFtpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicmV0dXJuXCIgOlxyXG4gICAgICAgICAgICAgIHN3LnN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMuZ2FtZSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicmVzdGFydFwiIDpcclxuICAgICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJleGl0XCIgOlxyXG4gICAgICAgICAgICAgIHN3LnJlc2V0KCk7XHJcbiAgICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgfTtcclxufTtcclxuXHJcbndpbmRvdy5vbm1vdXNlbW92ZSA9IGZ1bmN0aW9uKGUpeyAvL9GB0L7QsdGL0YLQuNGPINC00LLQuNC20LXQvdC40Y8g0LzRi9GI0LrQuCwg0YLRg9GCINGF0L7QstC10YDRiyDQvtCx0YDQsNCx0L7RgtCw0LXQvFxyXG5cclxuICBpZiAoIGZzLmlzRnVsbFNjcmVlbiApe1xyXG4gICAgdmFyIHggPSAoZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQpL2ZzLnpvb207XHJcbiAgICB2YXIgeSA9IChlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wKS9mcy56b29tO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgeCA9IGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0O1xyXG4gICAgdmFyIHkgPSBlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wO1xyXG4gIH07XHJcblxyXG4gIHN3aXRjaCAoZ0xvby5zdGF0dXMpe1xyXG5cclxuICAgIGNhc2UgXCJtZW51XCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApID8gby5tZW51W2ldLmhvdmVyKDEpIDogby5tZW51W2ldLmhvdmVyKCk7XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJnYW1lXCIgOlxyXG4gICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYlBhdXNlKSApID8gby5iUGF1c2UuaG92ZXIoMSkgOiBvLmJQYXVzZS5ob3ZlcigpO1xyXG5cclxuICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJGdWxsU2NyKSApID8gby5iRnVsbFNjci5ob3ZlcigxKSA6IG8uYkZ1bGxTY3IuaG92ZXIoKTsgIFxyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwid2luXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ud2luUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICAgICAgby53aW5Qb3BVcFtpXS5ob3ZlcigxKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCAhPSBsZXZlbHMubHZsc0NvdW50KCkgKXtcclxuICAgICAgICAgICAgby53aW5Qb3BVcFtpXS5ob3ZlcigxKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICggby53aW5Qb3BVcFtpXS5ob3ZlciApIG8ud2luUG9wVXBbaV0uaG92ZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwibGV2ZWxzXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmxldmVsc0Zvb3RlcltpXSkgKSA/IG8ubGV2ZWxzRm9vdGVyW2ldLmhvdmVyKDEpIDogby5sZXZlbHNGb290ZXJbaV0uaG92ZXIoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG8uYkxldmVsc0J1dHRvbnMubGVuZ3RoOyBpKysgKXtcclxuICAgICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkxldmVsc0J1dHRvbnNbaV0pICkgPyBvLmJMZXZlbHNCdXR0b25zW2ldLmhvdmVyKDEpIDogby5iTGV2ZWxzQnV0dG9uc1tpXS5ob3ZlcigpO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICBcclxuICAgIGNhc2UgXCJwYXVzZVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ucGF1c2VQb3BVcFtpXSkgKXtcclxuICAgICAgICAgIGlmICggby5wYXVzZVBvcFVwW2ldLmhvdmVyICkgby5wYXVzZVBvcFVwW2ldLmhvdmVyKDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIG8ucGF1c2VQb3BVcFtpXS5ob3ZlciApIG8ucGF1c2VQb3BVcFtpXS5ob3ZlcigpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gIH07XHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgem9vbSA9IDA7XHJcblxyXG5mdW5jdGlvbiBmdWxsQ2FudmFzKCl7XHQvL9C60LDQvdCy0LAg0LLQviDQstC10YHRjCDRjdC60YDQsNC9XHJcblxyXG5cdHZhciBkZXZpY2VXaWR0aCA9IHdpbmRvdy5zY3JlZW4uYXZhaWxXaWR0aDtcclxuXHR2YXIgZGV2aWNlSGVpZ2h0ID0gd2luZG93LnNjcmVlbi5hdmFpbEhlaWdodDtcclxuXHRmdWxsU2NyZWVuLnpvb20gPSAoZGV2aWNlSGVpZ2h0IC8gQy5IRUlHSFQpLnRvRml4ZWQoMSk7XHQvL9C60LDQutC+0LUg0YPQstC10LvQuNGH0LXQvdC40LUg0YHQtNC10LvQsNGC0Ywg0LjRgdGF0L7QtNGPINC40Lcg0YDQsNC30LzQtdGA0L7QsiDRjdC60YDQsNC90LAuXHJcblxyXG5cdGNhbnZhcy5jbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoKmZ1bGxTY3JlZW4uem9vbTtcclxuXHRjYW52YXMuY252LmhlaWdodCA9IGNhbnZhcy5jbnYuaGVpZ2h0KmZ1bGxTY3JlZW4uem9vbTtcclxuXHRjYW52YXMuY3R4LnNjYWxlKGZ1bGxTY3JlZW4uem9vbSxmdWxsU2NyZWVuLnpvb20pO1xyXG5cclxuXHRmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbiA9ICFmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG5vcm1hbENhbnZhcygpe1x0Ly/QuNGB0YXQvtC00L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtSDQutCw0L3QstGLXHJcblxyXG5cdC8vY9C+0YXRgNCw0L3Rj9C10Lwg0L/QvtGB0LvQtdC00L3QuNC5INC60LDQtNGAINC40LPRgNGLLCDQtNCw0LHRiyDQv9GA0Lgg0LLQvtC30LLRgNCw0YnQtdC90LjQuCDRgNCw0LfQvNC10YDQsCDQv9C+0YHQu9C1INGE0YPQu9GB0LrRgNC40L3QsCwg0L7QvSDQvtGC0YDQuNGB0L7QstCw0LvRgdGPLCDQuNC90LDRh9C1INCx0YPQtNC10YIg0LHQtdC70YvQuSDRhdC+0LvRgdGCLlxyXG5cdHZhciBidWZDbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG5cdHZhciBidWZDdHggPSBidWZDbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdGJ1ZkNudi53aWR0aCA9IGNhbnZhcy5jbnYud2lkdGgvZnVsbFNjcmVlbi56b29tO1xyXG5cdGJ1ZkNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodC9mdWxsU2NyZWVuLnpvb207XHJcblx0YnVmQ3R4LmRyYXdJbWFnZShjYW52YXMuY252LCAwLDAsIGNhbnZhcy5jbnYud2lkdGgvZnVsbFNjcmVlbi56b29tLCBjYW52YXMuY252LmhlaWdodC9mdWxsU2NyZWVuLnpvb20pO1xyXG5cclxuXHRjYW52YXMuY252LndpZHRoID0gY2FudmFzLmNudi53aWR0aC9mdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodC9mdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmN0eC5zY2FsZSgxLDEpO1xyXG5cdGNhbnZhcy5jdHguZHJhd0ltYWdlKGJ1ZkNudiwwLDAsY2FudmFzLmNudi53aWR0aCxjYW52YXMuY252LmhlaWdodCk7XHJcblxyXG5cdGZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuID0gIWZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gb25GdWxsU2NyZWVuQ2hhbmdlKCl7XHQvL9C/0YDQuCDQuNC30LzQtdC90LjQuCDRgdC+0YHRgtC+0Y/QvdC40LUg0YTRg9C70YHQutGA0LjQvdCwXHJcblxyXG5cdCggZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW4gKSA/IG5vcm1hbENhbnZhcygpIDogZnVsbENhbnZhcygpO1xyXG59O1xyXG5cclxuY2FudmFzLmNudi5hZGRFdmVudExpc3RlbmVyKFwid2Via2l0ZnVsbHNjcmVlbmNoYW5nZVwiLCBvbkZ1bGxTY3JlZW5DaGFuZ2UpO1xyXG5jYW52YXMuY252LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3pmdWxsc2NyZWVuY2hhbmdlXCIsICAgIG9uRnVsbFNjcmVlbkNoYW5nZSk7XHJcbmNhbnZhcy5jbnYuYWRkRXZlbnRMaXN0ZW5lcihcImZ1bGxzY3JlZW5jaGFuZ2VcIiwgICAgICAgb25GdWxsU2NyZWVuQ2hhbmdlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVsbFNjcmVlbiA9IHsgXHJcblxyXG5cdGxhdW5jaEZ1bGxTY3JlZW4gOiBmdW5jdGlvbihlbGVtKXtcclxuXHJcblx0XHRpZiAoIGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5yZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZWxlbS5tb3pSZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLm1velJlcXVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRjYW5zZWxGdWxsU2NyZWVuIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHRpZiAoIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XHJcblx0XHR9O1xyXG5cdH0sXHJcblxyXG5cdGlzRnVsbFNjcmVlbiA6IGZhbHNlLFxyXG5cclxuXHR6b29tIDogem9vbVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyk7XHJcbnZhciByZXMgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxudmFyIHByZWxvYWRlciA9IHJlcXVpcmUoJy4vX3ByZWxvYWRlci5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnYW1lTG9vcHMgPSAge1xyXG5cclxuICBsb2FkZXIgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImxvYWRlclwiO1xyXG5cclxuICAgIHByZWxvYWRlci51cGRhdGVMb2FkZXIoKTtcclxuICAgIHByZWxvYWRlci5kcmF3TG9hZGVyKCk7XHJcbiAgICBwcmVsb2FkZXIuZHJhd0xvYWRUZXh0KCk7XHJcbiAgICBcclxuICAgIGlmICggcmVzLnJlc291cnNlcy5hcmVMb2FkZWQoKSApIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImdhbWVcIjsgXHJcblxyXG4gICAgLy/QvtGH0LjRgdGC0LrQsCDQvtCx0LvQsNGB0YLQuFxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDQsdCzINGD0YDQvtCy0L3Rj1xyXG4gICAgby5iZ0xldmVsLmRyYXcoKTtcclxuICAgIFxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1INC40LPRgNGLXHJcbiAgICBmb3IgKCBpIGluIG8ubWF0cml4ICl7XHJcbiAgICAgIG8ubWF0cml4W2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0YHRgtC10L3Ri1xc0L/RgNC10LPRgNCw0LTRi1xyXG4gICAgZm9yICggaSBpbiBvLndhbGxzICl7XHJcbiAgICAgIG8ud2FsbHNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDRhdC10LTQtdGA0LAg0YPRgNC+0LLQvdGPXHJcbiAgICBvLmhlYWRlci5kcmF3KCk7XHJcbiAgICBvLnN0b3BXYXRjaC5kcmF3KDEsMTApO1xyXG4gICAgby5iRnVsbFNjci5kcmF3KCk7XHJcbiAgICBvLmJQYXVzZS5kcmF3KCk7XHJcbiAgICBvLmN1cnJMZXZlbC5kcmF3KCk7XHJcblxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0LjQs9GA0L7QstGL0YUg0L7QsdGK0LXQutGC0L7QslxyXG4gICAgby5kb29yLmRyYXcoKTtcclxuICAgIG8ucGwuZHJhdygpO1xyXG4gICAgby5ib3guZHJhdygpO1xyXG5cclxuICAgIC8v0LXRgdC70Lgg0L/QvtCx0LXQtNC40LvQuFxyXG4gICAgaWYgKCBoZi5pc1dpbigpICl7XHJcbiAgICAgIG8uYmdPcGFjaXR5LmRyYXcoKTtcclxuICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMud2luKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgbWVudSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwibWVudVwiO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby5hbmltYXRlQmcuZHJhdygpO1xyXG5cclxuICAgIG8ubG9nby5kcmF3KCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLm1lbnUgKXtcclxuICAgICAgby5tZW51W2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gIH0sXHJcblxyXG4gIHdpbiA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwid2luXCI7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwid2luX3RleHRcIiApIG8ud2luUG9wVXBbaV0udHh0ID0gXCLQo9GA0L7QstC10L3RjCBcIitnYW1lTG9vcHMuY3VycmVudExldmVsO1xyXG4gICAgICBcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPT0gbGV2ZWxzLmx2bHNDb3VudCgpICkge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG8ud2luUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgICB9ICBcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgcGF1c2UgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcInBhdXNlXCI7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgby5wYXVzZVBvcFVwW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgbGV2ZWxzIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJsZXZlbHNcIjtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8udmlkZW9CZ0xldmVscy5kcmF3KCk7XHJcblxyXG4gICAgby5sZXZlbHNIZWFkZXIuZHJhdygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5iTGV2ZWxzQnV0dG9ucyApe1xyXG4gICAgICBvLmJMZXZlbHNCdXR0b25zW2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICBvLmxldmVsc0Zvb3RlcltpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHN0YXR1cyA6IFwiXCIsXHJcblxyXG4gIGN1cnJlbnRMZXZlbCA6IFwiMVwiXHJcblxyXG59O1xyXG4iLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gIGNsZWFyUmVjdCA6IGZ1bmN0aW9uKHgseSx3LGgpeyAgICAgIC8v0L7Rh9C40YHRgtC40YLQtdC70YxcclxuICAgIGN0eC5jbGVhclJlY3QoeCx5LHcsaCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UmFuZG9tSW50IDogZnVuY3Rpb24obWluLCBtYXgpIHsgLy/RhNGD0L3QutGG0LjRjyDQtNC70Y8g0YDQsNC90LTQvtC80LAg0YbQtdC70L7Rh9C40YHQu9C10L3QvdC+0LPQviDQt9C90LDRh9C10L3QuNGPXHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxuICB9LFxyXG5cclxuICBpc1dpbiA6IGZ1bmN0aW9uKCl7ICAgICAgICAgICAgICAgICAvL9C/0L7QsdC10LTQuNC70Lg/XHJcbiAgICByZXR1cm4gby5ib3gueCA9PSBvLmRvb3IueCAmJiBvLmJveC55ID09IG8uZG9vci55O1xyXG4gIH0sXHJcblxyXG4gIGRpcmVjdGlvbklzIDogZnVuY3Rpb24oZGlyZWN0aW9uKXsgIC8v0LLQvtC30LLRgNCw0YnQsNC10YIg0YPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQsiDQs9GA0LDQtNGD0YHQsNGFLCDQvNC+0LbQvdC+INCx0YvQu9C+INC4INGB0LTQtdC70LDRgtGMINC/0YDQvtGJ0LUgLSDQvtCx0YrQtdC60YLQvtC8LlxyXG4gIFx0c3dpdGNoKGRpcmVjdGlvbil7XHJcblxyXG4gIFx0XHRjYXNlIFwidXBcIiAgIDogcmV0dXJuIDM2MDtcclxuICBcdFx0YnJlYWs7XHJcbiAgXHRcdGNhc2UgXCJkb3duXCIgOiByZXR1cm4gMTgwO1xyXG4gIFx0XHRicmVhaztcclxuICBcdFx0Y2FzZSBcImxlZnRcIiA6IHJldHVybiAyNzA7XHJcbiAgXHRcdGJyZWFrO1xyXG4gIFx0XHRjYXNlIFwicmlnaHRcIjogcmV0dXJuIDkwO1xyXG4gIFx0XHRicmVhaztcclxuXHJcbiAgXHR9O1xyXG4gIH1cclxufTtcclxuIiwidmFyIGtleXMgPSB7XHJcblx0XCJXXCIgOiA4NyxcclxuXHRcIlNcIiA6IDgzLFxyXG5cdFwiQVwiIDogNjUsXHJcblx0XCJEXCIgOiA2OFxyXG59O1xyXG5cclxudmFyIGtleURvd24gPSAwO1xyXG4vLyB2YXIga2V5RG93biA9IHt9O1xyXG5cclxuZnVuY3Rpb24gc2V0S2V5KGtleUNvZGUpe1xyXG5cdGtleURvd24gPSBrZXlDb2RlO1xyXG5cdC8vIGtleURvd25ba2V5Y29kZV0gPSB0cnVlO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY2xlYXJLZXkoa2V5Q29kZSl7XHJcblx0a2V5RG93biA9IDA7XHJcblx0Ly8ga2V5RG93bltrZXlDb2RlXSA9IGZhbHNlO1xyXG59O1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdHNldEtleShlLmtleUNvZGUpO1xyXG59KTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBmdW5jdGlvbihlKXtcclxuXHRjbGVhcktleShlLmtleUNvZGUpO1xyXG59KTtcclxuXHJcblxyXG5mdW5jdGlvbiBpc0tleURvd24oa2V5TmFtZSl7XHJcblx0cmV0dXJuIGtleURvd25ba2V5c1trZXlOYW1lXV0gPT0gdHJ1ZTtcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdGlzS2V5RG93biA6IGZ1bmN0aW9uKGtleU5hbWUpe1xyXG5cdFx0cmV0dXJuIGtleURvd24gPT0ga2V5c1trZXlOYW1lXTtcclxuXHRcdC8vIHJldHVybiBrZXlEb3duW2tleXNba2V5TmFtZV1dID09IHRydWU7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcbnZhciBoZiA9IHJlcXVpcmUoJy4vX2hlbHBlckZ1bmN0aW9ucy5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbHMgPSB7XHJcblxyXG5cdGx2bHNDb3VudCA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0Zm9yKGtleSBpbiBsZXZlbHMpeyBjb3VudCsrIH07XHJcblx0XHRcdHJldHVybiBjb3VudC0xO1xyXG5cdH0sXHJcblxyXG5cdDEgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIC8v0LzQsNGB0YHQuNCyINGBINCx0YPQtNGD0YnQtdC/0L7RgdGC0YDQvtC10L3QvdGL0LzQuCDRgdGC0LXQvdC60LDQvNC4XHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFsxLDNdLFsxLDRdLFsxLDVdLFsyLDBdLFsyLDZdLFsyLDhdLFszLDJdLFs0LDFdLFs0LDNdLFs0LDddLFs1LDRdLFs2LDRdLFs2LDZdLFs3LDFdLFs3LDhdLFs4LDBdLFs4LDRdLFs4LDVdXHJcblx0XHRdO1x0XHRcdFx0ICAvL9C/0YDQuNC00YPQvNCw0L3QvdGL0Lkg0LzQsNGB0YHQuNCyINGB0L4g0YHRgtC10L3QutCw0LzQuFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC80LDRgdGB0LjQsiB3YWxsc1xyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDAgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInJpZ2h0XCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsyKig1MCtDLlBETkcpLCA3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDIgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwwXSxbMCw0XSxbMCwzXSxbMCw2XSxbMiwyXSxbMiw0XSxbMyw4XSxbMywwXSxbMyw3XSxbNCwyXSxbNCw0XSxbNCw1XSxbNCw2XSxbNSwwXSxbNiwyXSxbNiw1XSxbNiw2XSxbNiw3XSxbNywwXSxbOCwzXSxbOCw0XSxbOCw3XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCs4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJyaWdodFwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArNiooNTArQy5QRE5HKSwgMCs3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCs2Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MyA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDJdLFswLDddLFsxLDVdLFsxLDhdLFsyLDJdLFsyLDddLFszLDRdLFs0LDFdLFs0LDRdLFs0LDZdLFs2LDJdLFs2LDNdLFs2LDRdLFs2LDZdLFs2LDhdLFs3LDBdLFs3LDVdLFs4LDBdLFs4LDFdLFs4LDNdLFs4LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwidXBcIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzEqKDUwK0MuUERORyksIDArNiooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzIqKDUwK0MuUERORyksIDArMyooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDQgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwxXSxbMSw1XSxbMSw3XSxbMiw0XSxbMywxXSxbMywzXSxbMyw2XSxbMyw4XSxbNCwzXSxbNSw1XSxbNSw3XSxbNiwwXSxbNiwyXSxbNiwzXSxbNiw1XSxbNyw4XSxbOCwwXSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInVwXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs2Kig1MCtDLlBETkcpLCAwKzAqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQ1IDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMV0sWzAsM10sWzAsNV0sWzAsOF0sWzIsMl0sWzIsNF0sWzIsNl0sWzIsOF0sWzQsMF0sWzQsM10sWzQsNV0sWzQsN10sWzYsMV0sWzYsMl0sWzYsNF0sWzYsN10sWzcsOF0sWzgsMl0sWzgsNF0sWzgsOF1cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDArMCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwiZG93blwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArMSooNTArQy5QRE5HKSwgMCsxKig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDAsIDArOCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGNudnMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1hdHJpeEJHKCl7ICAgICAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1XHJcbiAgdmFyIG1hdHJpeCA9IFtdOyAgICAgICAgICAgICAgICAgICAgIC8v0LzQsNGB0YHQuNCyINC00LvRjyDQvNCw0YLRgNC40YfQvdC+0LPQviDQstC40LTQsCDRg9GA0L7QstC90Y9cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspeyAgICAgICAgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC+0LHRitC10LrRglxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCA5OyBqKyspe1xyXG4gICAgICBtYXRyaXgucHVzaCggbmV3IFJlY3QoQy5QRE5HK2oqKDUwK0MuUERORyksIDcxK0MuUERORytpKig1MCtDLlBETkcpLCA1MCwgNTAsIFwicmdiYSgwLDAsMCwwLjUpXCIsIHRydWUpICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1hdHJpeFxyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWVudSh0eHRBcnIsIG5hbWVBcnIpeyAgLy/RgdC+0LfQtNCw0LXQvCDQs9C70LDQstC90L7QtSDQvNC10L3RjlxyXG4gIHZhciBtZW51ID0gW107XHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBhbW91bnRzID0gdHh0QXJyLmxlbmd0aDtcclxuICBcclxuICB2YXIgX2ZvbnRzaXplID0gXCIyOFwiO1xyXG4gIHZhciBfeCA9IEMuV0lEVEgvMi0zMDAvMjtcclxuICB2YXIgX3kgPSAoQy5IRUlHSFQvMikgLSAoODUqYW1vdW50cy8yKSArIDg1OyBcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbW91bnRzOyBpKyspe1xyXG4gICAgbWVudS5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzBdLCBfeCwgX3kraSo4NSwgMzAwLCA2MCwgdHh0W2ldLCBuYW1lc1tpXSwgX2ZvbnRzaXplLCA4MyApICk7XHJcbiAgICBtZW51W2ldLmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syMV07XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1lbnU7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXaW5Qb3BVcCgpeyAgICAgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INC/0L7QsdC10LTQvdGD0Y4g0LLRgdC/0LvQu9GL0LLQsNGI0LrRg1xyXG5cclxuICB2YXIgd2luUG9wQkcgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbMTZdLCBDLldJRFRILzItMzIwLzIsIEMuSEVJR0hULzItMjAwLzIsIDMyMCwgMjAwKTtcclxuICB2YXIgYlBvcEV4aXQgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzEyXSwgd2luUG9wQkcueCszMCwgIHdpblBvcEJHLnkrd2luUG9wQkcuaC01MCwgODAsIDY1LCBcIlwiLCBcInBvcF9leGl0XCIsIDAgKTtcclxuICBiUG9wRXhpdC5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjZdO1xyXG4gIHZhciBiUG9wTmV4dCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTVdLCB3aW5Qb3BCRy54KzMwKzExMCs4MCwgIHdpblBvcEJHLnkrd2luUG9wQkcuaC01MCwgODAsIDY1LCBcIlwiLCBcInBvcF9uZXh0XCIsIDAgKTtcclxuICBiUG9wTmV4dC5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjldO1xyXG4gIHZhciB3aW5UZXh0ID0gbmV3IEJ1dHRvbiggQy5XSURUSC8yLTkwLzIsIHdpblBvcEJHLnkrMTUsIDkwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMIE5cIiwgXCJ3aW5fdGV4dFwiLCAzMCwgXCJCdWNjYW5lZXJcIiApO1xyXG4gIHZhciB3aW5UZXh0XzIgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMisxMCwgd2luUG9wQkcueSs4MCwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0J/QoNCe0JnQlNCV0J0hXCIsIFwid2luX3RleHRfMlwiLCA1MCwgXCJhWlpfVHJpYnV0ZV9Cb2xkXCIgKTtcclxuXHJcbiAgd2luVGV4dC50eHRDb2xvciA9IFwiI0Q5QzQyNVwiO1xyXG5cclxuICB2YXIgd2luUG9wVXAgPSBbXTtcclxuICB3aW5Qb3BVcC5wdXNoKHdpblBvcEJHLCBiUG9wRXhpdCwgYlBvcE5leHQsIHdpblRleHQsIHdpblRleHRfMik7XHJcblxyXG4gIHJldHVybiB3aW5Qb3BVcDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVBhdXNlUG9wVXAoKXsgICAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0L/QsNGD0Lcg0LLRgdC/0LvRi9Cy0LDRiNC60YNcclxuXHJcbiAgdmFyIHBhdXNlUG9wVXAgPSBbXTtcclxuICB2YXIgYmdQYXVzZSA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxM10sIEMuV0lEVEgvMi0zMDAvMiwgQy5IRUlHSFQvMi0yMDcvMiwgMzAwLCAyMDcpO1xyXG4gIHZhciBiUmV0dXJuID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMF0sIGJnUGF1c2UueCsxOTAsICBiZ1BhdXNlLnktMjUsIDYzLCA1NywgXCJcIiwgXCJyZXR1cm5cIiwgMCApO1xyXG4gIGJSZXR1cm4uaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzI0XTtcclxuICB2YXIgYkV4aXRUb01lbnUgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzEyXSwgIGJnUGF1c2UueCs1MCwgIGJnUGF1c2UueStiZ1BhdXNlLmgtNTAsIDg1LCA3MCwgXCJcIiwgXCJleGl0XCIsIDAgKTtcclxuICBiRXhpdFRvTWVudS5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjZdO1xyXG4gIHZhciBiUmVzdGFydCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTFdLCAgYmdQYXVzZS54KzUwKzMwKzg1LCAgYmdQYXVzZS55K2JnUGF1c2UuaC01MCwgODUsIDcwLCBcIlwiLCBcInJlc3RhcnRcIiwgMCApO1xyXG4gIGJSZXN0YXJ0LmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syNV07XHJcbiAgdmFyIHBhdXNlVGV4dCA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxNF0sIGJnUGF1c2UueCArIGJnUGF1c2Uudy8yIC0gMTUwLzIsIGJnUGF1c2UueSArIGJnUGF1c2UuaC8yIC0gMTAwLzIsIDE1MCwgMTAwKTtcclxuXHJcbiAgcGF1c2VQb3BVcC5wdXNoKGJnUGF1c2UsIGJSZXR1cm4sIGJFeGl0VG9NZW51LCBiUmVzdGFydCwgcGF1c2VUZXh0KTtcclxuXHJcbiAgcmV0dXJuIHBhdXNlUG9wVXA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVMZXZlbHNCdXR0b25zKGxldmVsc19jb3VudCl7IC8v0YHQvtC30LTQsNC10Lwg0LrQvdC+0L/QutC4INCyINCy0YvQsdC+0YDQtSDRg9GA0L7QstC90Y9cclxuXHJcbiAgdmFyIGJMZXZlbHNCdXR0b25zID0gW107XHJcbiAgdmFyIGogPSAwLCBkeSA9IDg1LCBkeCA9IDA7XHJcblxyXG4gIGZvciAoIGk9MDsgaSA8IGxldmVsc19jb3VudDsgaSsrKXtcclxuICAgIGR4ID0gOCtqKigxMDArMTUpO1xyXG5cclxuICAgIGJMZXZlbHNCdXR0b25zLnB1c2goIG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTddLCBkeCwgZHksIDEwMCwgMTAwLCBpKzEsIFwibGV2ZWxfXCIrKGkrMSksIDM1ICkgKTtcclxuICAgIGJMZXZlbHNCdXR0b25zW2ldLmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syN107XHJcblxyXG4gICAgaisrO1xyXG5cclxuICAgIGlmICggZHggPiBDLldJRFRILTExNSApe1xyXG4gICAgICBkeSArPSAoMTI1KTtcclxuICAgICAgaiA9IDA7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBiTGV2ZWxzQnV0dG9ucztcclxufTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbmZ1bmN0aW9uIGNyZWF0ZUxldmVsc0Zvb3RlcigpeyAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0YTRg9GC0LXRgCDQsiDQstGL0LHQvtGA0LUg0YPRgNC+0LLQvdGPXHJcblxyXG4gIHZhciBsZXZlbHNGb290ZXIgPSBbXTtcclxuXHJcbiAgdmFyIGJQcmV2ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxOV0sIDIwLCBDLkhFSUdIVC0xMC02NywgNDAsIDY3LCBcIlwiLCBcInByZXZcIiwgMCApO1xyXG4gIHZhciBiTmV4dCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMThdLCBDLldJRFRILTIwLTQwLCBDLkhFSUdIVC0xMC02NywgNDAsIDY3LCBcIlwiLCBcIm5leHRcIiwgMCApO1xyXG4gIHZhciBiVG9NZW51ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1syMF0sIEMuV0lEVEgvMiAtIDMyMC8yLCBDLkhFSUdIVC0xMC02NywgMzIwLCA2NywgXCLQktC10YDQvdGD0YLRjNGB0Y8g0LIg0LzQtdC90Y5cIiwgXCJ0b19tZW51XCIsIDI1ICk7XHJcbiAgYlRvTWVudS5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjhdO1xyXG4gIGJUb01lbnUudHh0Q29sb3IgPSBcIiMwMDAwNDZcIjtcclxuXHJcbiAgbGV2ZWxzRm9vdGVyLnB1c2goYlByZXYsYk5leHQsYlRvTWVudSk7XHJcblxyXG4gIHJldHVybiBsZXZlbHNGb290ZXI7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQbGF5ZXIoKXsgICAgICAgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INC40LPRgNC+0LrQsCDRgSDRg9C90LjQutCw0LvRjNC90YvQvNC4INC80LXRgtC+0LTQsNC80LhcclxuXHJcbiAgdmFyIHBsYXllciA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzldLDAsMCw1MCw1MCk7XHJcbiAgcGxheWVyLmRpcmVjdGlvbiA9IGZhbHNlO1xyXG4gIHBsYXllci5pc01vdmUgPSBmYWxzZTtcclxuXHJcbiAgcGxheWVyLmRyYXcgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIGlmKHRoaXMuaXNNb3ZlKXtcclxuICAgICAgdGhpcy5kcmF3QW5pbWF0aW9uKDMsIDIsIHRoaXMuZGlyZWN0aW9uKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRyYXdGcmFtZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuZHJhd0FuaW1hdGlvbiA9IGZ1bmN0aW9uKGZyYW1lcywgZGVsYXksIGFuZ2xlKXtcclxuXHJcbiAgICB0aGlzLmltZy5jYW5EcmF3ID0gKCB0aGlzLmltZy5jYW5EcmF3ID09PSB1bmRlZmluZWQgKSA/IDEgOiB0aGlzLmltZy5jYW5EcmF3O1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIHZhciBfZHggPSB0aGlzLngrQy5QRE5HICsgdGhpcy53IC8gMjtcclxuICAgICAgdmFyIF9keSA9IHRoaXMueSs3MStDLlBETkcgKyB0aGlzLmggLyAyO1xyXG4gICAgICBhbmdsZSA9IGFuZ2xlICogKE1hdGguUEkvMTgwKTtcclxuICAgICAgY252cy5jdHguc2F2ZSgpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoX2R4LF9keSk7XHJcbiAgICAgIGNudnMuY3R4LnJvdGF0ZShhbmdsZSk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtX2R4LC1fZHkpO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodGhpcy5pbWcuY2FuRHJhdyA9PSAxKXtcclxuICAgICAgaWYgKHRoaXMuaW1nLmNvdW50ID09IGZyYW1lcykgdGhpcy5pbWcuY291bnQgPSAxO1xyXG5cclxuICAgICAgdGhpcy5pbWcuY2FuRHJhdyA9IDA7XHJcbiAgICAgIHRoaXMuaW1nLmNvdW50ID0gdGhpcy5pbWcuY291bnQgKyAxIHx8IDE7XHJcblxyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcGxheWVyLmltZy5jYW5EcmF3ID0gMTtcclxuICAgICAgfSwgMTAwMC8oZGVsYXkqMikgKTtcclxuICAgIH07XHJcblxyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGNudnMuY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgNTAqKHRoaXMuaW1nLmNvdW50LTEpLCAwLCB0aGlzLncsIHRoaXMuaCwgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtQy5QRE5HLCAtKDcxK0MuUERORykpO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIGNudnMuY3R4LnJlc3RvcmUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLmRyYXdGcmFtZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgdmFyIGFuZ2xlID0gdGhpcy5kaXJlY3Rpb24gfHwgMDtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICB2YXIgX2R4ID0gdGhpcy54K0MuUERORyArIHRoaXMudyAvIDI7XHJcbiAgICAgIHZhciBfZHkgPSB0aGlzLnkrNzErQy5QRE5HICsgdGhpcy5oIC8gMjtcclxuICAgICAgYW5nbGUgPSBhbmdsZSAqIChNYXRoLlBJLzE4MCk7XHJcbiAgICAgIGNudnMuY3R4LnNhdmUoKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKF9keCxfZHkpO1xyXG4gICAgICBjbnZzLmN0eC5yb3RhdGUoYW5nbGUpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoLV9keCwtX2R5KTtcclxuICAgIH07XHJcblxyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGNudnMuY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy53LCB0aGlzLmgsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoLUMuUERORywgLSg3MStDLlBETkcpKTtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICBjbnZzLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5zZXREaXJlY3Rpb24gPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHBsYXllcjtcclxufTtcclxuXHJcblxyXG5cclxuLy9tZW51XHJcbnZhciBsb2dvID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxXSwgQy5XSURUSC8yLTQ1MC8yLCAyMCwgNDUwLCAxNTAsIFwiXCIsIFwibG9nb1wiLCAwICk7XHJcbnZhciBtZW51ID0gY3JlYXRlTWVudShbXCLQmNCz0YDQsNGC0YxcIiwgXCLQo9GA0L7QstC90LhcIiwgXCLQndCw0YHRgtGA0L7QudC60LhcIl0sW1wicGxheVwiLCBcImNoYW5nZV9sZXZlbFwiLCBcIm9wdGlvbnNcIl0pO1xyXG5cclxuXHJcbi8vYmFja2dyb3VuZCBcclxudmFyIG1hdHJpeCA9IGNyZWF0ZU1hdHJpeEJHKCk7ICAgICAgICAgLy9iZyDRg9GA0L7QstC90Y9cclxudmFyIGJnTGV2ZWwgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbOF0sIDAsIDAsIEMuV0lEVEgsIEMuSEVJR0hUICk7XHJcbnZhciBiZ09wYWNpdHkgPSBuZXcgUmVjdCgwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIik7XHJcblxyXG5cclxuLy9nYW1lIGhlYWRlclxyXG52YXIgaGVhZGVyID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzJdLCAwLCAwLCBDLldJRFRILCA3MStDLlBETkcgKTtcclxudmFyIGJGdWxsU2NyID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1szXSwgQy5XSURUSC00NS0yMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQ1LzIsIDQ1LCA0NSwgXCJcIiwgXCJmdWxsU2NyXCIsIDAgKTtcclxuYkZ1bGxTY3IuaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzIyXTtcclxudmFyIHN0b3BXYXRjaCA9IG5ldyBCdXR0b24oIDEwLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTIwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcIjAwIDogMDAgOiAwMFwiLCBcInN0b3B3YXRjaFwiLCAyNSwgXCJkaXRlZFwiICk7XHJcbnZhciBiUGF1c2UgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzRdLCBDLldJRFRILTQ1LTctYkZ1bGxTY3Iudy0yMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQ1LzIsIDQ1LCA0NSwgXCJcIiwgXCJwYXVzZVwiLCAwICk7XHJcbmJQYXVzZS5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjNdO1xyXG52YXIgY3VyckxldmVsID0gbmV3IEJ1dHRvbiggKHN0b3BXYXRjaC54K3N0b3BXYXRjaC53K2JQYXVzZS54KS8yLTE0MC8yLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTQwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMXCIsIFwiY3Vycl9sZXZlbFwiLCAyNSwgXCJjYXB0dXJlX2l0XCIgKTtcclxuXHJcblxyXG4vL2NoYW5nZSBsZXZlbFxyXG52YXIgbGV2ZWxzSGVhZGVyID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1syXSwgMCwgMCwgQy5XSURUSCwgNzErQy5QRE5HLCBcItCS0YvQsdC+0YAg0YPRgNC+0LLQvdGPXCIsIFwibGV2ZWxzX2hlYWRlclwiLCAyNSApO1xyXG52YXIgYkxldmVsc0J1dHRvbnMgPSBjcmVhdGVMZXZlbHNCdXR0b25zKDUpO1xyXG52YXIgbGV2ZWxzRm9vdGVyID0gY3JlYXRlTGV2ZWxzRm9vdGVyKCk7XHJcblxyXG5cclxuLy93aW4gcG9wLXVwXHJcbnZhciB3aW5Qb3BVcCA9IGNyZWF0ZVdpblBvcFVwKCk7XHJcblxyXG5cclxuLy9wYXVzZSBwb3AtdXBcclxudmFyIHBhdXNlUG9wVXAgPSBjcmVhdGVQYXVzZVBvcFVwKCk7XHJcblxyXG5cclxuLy9wbGF5YWJsZSBvYmpcclxudmFyIHBsID0gY3JlYXRlUGxheWVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL9C/0LXRgNGB0L7QvdCw0LZcclxudmFyIGJveCA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzZdLDAsMCw1MCw1MCk7ICAvL9Cx0L7QutGBXHJcbnZhciBkb29yID0gbmV3IFBsYXlhYmxlKHJlcy5hcnJJbWFnZXNbN10sMCwwLDUwLDUwKTsgLy/QtNCy0LXRgNGMXHJcbnZhciB3YWxscyA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/RgdGC0LXQvdGLINC90LAg0YPRgNC+0LLQvdC1LCDQt9Cw0L/QvtC70L3Rj9C10YLRgdGPINCy0YvQsdGA0LDQvdC90YvQvCDRg9GA0L7QstC90LXQvC5cclxuXHJcblxyXG4vL3ZpZGVvc1xyXG52YXIgYW5pbWF0ZUJnID0gbmV3IFZpZGVvKDAsIDAsIEMuV0lEVEgsIEMuSEVJR0hULCByZXMuYXJyVmlkZW9zWzBdKTtcclxudmFyIHZpZGVvQmdMZXZlbHMgPSBuZXcgVmlkZW8oMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIHJlcy5hcnJWaWRlb3NbMV0pO1xyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdHMgPSB7XHJcblxyXG4gIG1hdHJpeCA6IG1hdHJpeCxcclxuICBsb2dvIDogbG9nbyxcclxuICBtZW51IDogbWVudSxcclxuICBoZWFkZXIgOiBoZWFkZXIsXHJcbiAgc3RvcFdhdGNoIDogc3RvcFdhdGNoLFxyXG4gIGJQYXVzZSA6IGJQYXVzZSxcclxuICBiRnVsbFNjciA6IGJGdWxsU2NyLFxyXG4gIHBsIDogcGwsXHJcbiAgYm94IDogYm94LFxyXG4gIGRvb3IgOiBkb29yLFxyXG4gIHdhbGxzIDogd2FsbHMsXHJcbiAgYmdMZXZlbCA6IGJnTGV2ZWwsXHJcbiAgd2luUG9wVXAgOiB3aW5Qb3BVcCxcclxuICBwYXVzZVBvcFVwIDogcGF1c2VQb3BVcCxcclxuICBiZ09wYWNpdHkgOiBiZ09wYWNpdHksXHJcbiAgY3VyckxldmVsIDogY3VyckxldmVsLFxyXG4gIGxldmVsc0hlYWRlciA6IGxldmVsc0hlYWRlcixcclxuICBiTGV2ZWxzQnV0dG9ucyA6IGJMZXZlbHNCdXR0b25zLFxyXG4gIGxldmVsc0Zvb3RlciA6IGxldmVsc0Zvb3RlcixcclxuICBhbmltYXRlQmcgOiBhbmltYXRlQmcsXHJcbiAgdmlkZW9CZ0xldmVscyA6IHZpZGVvQmdMZXZlbHMsXHJcbiAgUFJFTE9BREVSIDogbmV3IFJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQsXCJibGFja1wiKVxyXG4gIFxyXG59O1xyXG4iLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHRcclxudmFyIGNvdW50ICAgID0gNzU7XHJcbnZhciByb3RhdGlvbiA9IDI3MCooTWF0aC5QSS8xODApO1x0XHRcclxudmFyIHNwZWVkICAgID0gNjtcclxuXHRcclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG4gIFxyXG4gXHR1cGRhdGVMb2FkZXIgOiBmdW5jdGlvbigpe1xyXG4gXHRcdGNhbnZhcy5jdHguc2F2ZSgpO1xyXG4gXHRcdGNhbnZhcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XHJcbiBcdFx0Y2FudmFzLmN0eC5maWxsU3R5bGUgPSAncmdiYSgyNTUsMjU1LDI1NSwuMDM1KSc7XHJcbiBcdFx0Y2FudmFzLmN0eC5maWxsUmVjdCgwLDAsNTAwLDUwMCk7XHJcbiBcdFx0cm90YXRpb24gKz0gc3BlZWQvMTAwO1xyXG4gXHRcdGNhbnZhcy5jdHgucmVzdG9yZSgpO1x0XHRcdFx0XHRcdFx0XHRcdFxyXG4gXHR9LFxyXG5cclxuIFx0ZHJhd0xvYWRlciA6IGZ1bmN0aW9uKCl7XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRjYW52YXMuY3R4LnNhdmUoKTtcclxuIFx0XHRjYW52YXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XHJcbiBcdFx0Y2FudmFzLmN0eC50cmFuc2xhdGUoQy5XSURUSC8yLCBDLkhFSUdIVC8yKTtcclxuIFx0XHRjYW52YXMuY3R4LmxpbmVXaWR0aCA9IDAuMjU7XHJcblx0XHRjYW52YXMuY3R4LnN0cm9rZVN0eWxlID0gJ3JnYmEoMjU1LDI1NSwyNTUsMS4wKSc7XHJcbiBcdFx0Y2FudmFzLmN0eC5yb3RhdGUocm90YXRpb24pO1x0XHJcbiBcdFx0dmFyIGkgPSBjb3VudDtcclxuIFx0XHR3aGlsZShpLS0pe1x0XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRcdGNhbnZhcy5jdHguYmVnaW5QYXRoKCk7XHJcbiBcdFx0XHRjYW52YXMuY3R4LmFyYygwLCAwLCBpKyhNYXRoLnJhbmRvbSgpKjM1KSwgTWF0aC5yYW5kb20oKSwgTWF0aC5QSS8zKyhNYXRoLnJhbmRvbSgpLzEyKSwgZmFsc2UpO1x0XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRcdGNhbnZhcy5jdHguc3Ryb2tlKCk7XHJcbiBcdFx0fVx0XHJcbiBcdFx0Y2FudmFzLmN0eC5yZXN0b3JlKCk7XHJcblxyXG4gXHRcdGNhbnZhcy5jdHguc2F2ZSgpO1xyXG4gXHRcdGNhbnZhcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW92ZXInO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsMSknO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1x0XHJcbiBcdFx0Y2FudmFzLmN0eC5yZXN0b3JlKCk7XHRcdFx0XHRcdFx0XHRcdFx0XHRcclxuIFx0fSxcclxuXHJcbiBcdGRyYXdMb2FkVGV4dCA6IGZ1bmN0aW9uKCl7XHJcbiBcdFx0dmFyIHdpblRleHQgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItMjUwLzIsIDI1LCAyNTAsIDQwLCBcImJsYWNrXCIsIFwi0JjQtNC10YIg0LfQsNCz0YDRg9C30LrQsC4uXCIsIFwibG9hZC10ZXh0XCIsIDMwLCBcIkJ1Y2NhbmVlclwiICk7XHJcbiAgXHRcdHJldHVybiB3aW5UZXh0LmRyYXcoKTtcclxuIFx0fVxyXG59OyBcclxuXHJcbiAgIiwidmFyIHJlc291cnNlcyA9IHtcclxuICBpbWFnZXMgOiBmYWxzZSxcclxuICB2aWRlbyAgOiBmYWxzZSxcclxuXHJcbiAgYXJlTG9hZGVkIDogZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB0aGlzLnZpZGVvICYmIHRoaXMuaW1hZ2VzXHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZFZpZGVvKGFyclNyY3NPZlZpZGVvKXtcclxuXHJcbiAgdmFyIGFyclZpZGVvcyA9IFtdOyBcclxuICB2YXIgY291bnQgPSBhcnJTcmNzT2ZWaWRlby5sZW5ndGg7XHJcbiAgdmFyIGxvYWRDb3VudCA9IDA7XHJcblxyXG4gIGZvcih2YXIgaT0wOyBpPGNvdW50OyBpKyspe1xyXG5cclxuICAgIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XHJcbiAgICB2aWRlby5zcmMgPSBhcnJTcmNzT2ZWaWRlb1tpXTtcclxuICAgIHZpZGVvLm9uY2FucGxheXRocm91Z2ggPSBmdW5jdGlvbigpe1xyXG4gICAgICBsb2FkQ291bnQrKztcclxuICAgICAgdmlkZW8ubG9vcCA9IHRydWU7XHJcbiAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLnZpZGVvID0gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgYXJyVmlkZW9zLnB1c2godmlkZW8pO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXJyVmlkZW9zO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZEltYWdlcyhhcnJTcmNzT2ZJbWFnZXMpe1xyXG5cclxuICB2YXIgYXJySW1hZ2VzID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZkltYWdlcy5sZW5ndGg7XHJcbiAgdmFyIGxvYWRDb3VudCA9IDA7XHJcblxyXG4gIGZvcih2YXIgaT0wOyBpPGNvdW50OyBpKyspe1xyXG5cclxuICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgIGltZy5zcmMgPSBhcnJTcmNzT2ZJbWFnZXNbaV07XHJcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgbG9hZENvdW50Kys7XHJcbiAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLmltYWdlcyA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBhcnJJbWFnZXMucHVzaChpbWcpO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXJySW1hZ2VzO1xyXG59O1xyXG5cclxudmFyIGFyclZpZGVvcyA9IGxvYWRWaWRlbyhbXHJcbiAgXCJ2aWRlby9iZy5tcDRcIixcclxuICBcInZpZGVvL0xpZ2h0bWlycm9yLm1wNFwiXHJcbl0pO1xyXG5cclxudmFyIGFyckltYWdlcyA9IGxvYWRJbWFnZXMoW1xyXG4gIFwiaW1nL21lbnVfX2J1dHRvbi1tZW51LnN2Z1wiLCAgICAgICAgICAgICAgICAvLzAgXHJcbiAgXCJpbWcvbWVudV9fbG9nby5wbmdcIiwgICAgICAgICAgICAgICAgICAgICAgIC8vMVxyXG5cclxuICBcImltZy9nYW1lX19iZy1oZWFkZXIuc3ZnXCIsICAgICAgICAgICAgICAgICAgLy8yIFxyXG4gIFwiaW1nL2dhbWVfX2J1dHRvbi1mdWxsc2NyZWVuLnN2Z1wiLCAgICAgICAgICAvLzMgXHJcbiAgXCJpbWcvZ2FtZV9fYnV0dG9uLXBhdXNlLnN2Z1wiLCAgICAgICAgICAgICAgIC8vNCBcclxuICBcImltZy9nYW1lX193YWxsLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgLy81IFxyXG4gIFwiaW1nL2dhbWVfX2NyeXN0YWxsLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAvLzYgXHJcbiAgXCJpbWcvZ2FtZV9fcG9ydGFsLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgIC8vNyBcclxuICBcImltZy9nYW1lX19ncm91bmQuanBnXCIsICAgICAgICAgICAgICAgICAgICAgLy84IFxyXG4gICdpbWcvZ2FtZV9fcGxheWVyLnBuZycsICAgICAgICAgICAgICAgICAgICAgLy85IFxyXG5cclxuICBcImltZy9wYXVzZV9fYnV0dG9uLWNsb3NlLnN2Z1wiLCAgICAgICAgICAgICAgLy8xMFxyXG4gIFwiaW1nL3BhdXNlX19idXR0b24tcmVzdGFydC5zdmdcIiwgICAgICAgICAgICAvLzExXHJcbiAgXCJpbWcvcGF1c2VfX2J1dHRvbi10b01lbnUuc3ZnXCIsICAgICAgICAgICAgIC8vMTJcclxuICBcImltZy9wYXVzZV9fYmcuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgICAgLy8xM1xyXG4gIFwiaW1nL3BhdXNlX190ZXh0LnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgICAvLzE0XHJcblxyXG4gIFwiaW1nL3dpbl9fYnV0dG9uLW5leHQuc3ZnXCIsICAgICAgICAgICAgICAgICAvLzE1XHJcbiAgXCJpbWcvd2luX19iZy5zdmdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vMTZcclxuXHJcbiAgXCJpbWcvbGV2ZWxzX19idXR0b24tbGV2ZWxzLnN2Z1wiLCAgICAgICAgICAgIC8vMTdcclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi1uZXh0LnN2Z1wiLCAgICAgICAgICAgICAgLy8xOFxyXG4gIFwiaW1nL2xldmVsc19fYnV0dG9uLXByZXYuc3ZnXCIsICAgICAgICAgICAgICAvLzE5XHJcbiAgXCJpbWcvbGV2ZWxzX19idXR0b24tdG9NZW51LnN2Z1wiLCAgICAgICAgICAgIC8vMjBcclxuXHJcbiAgXCJpbWcvaG92ZXJzL21lbnVfX2J1dHRvbi1tZW51X2hvdmVyLnN2Z1wiLCAgICAgICAvLzIxXHJcbiAgXCJpbWcvaG92ZXJzL2dhbWVfX2J1dHRvbi1mdWxsc2NyZWVuX2hvdmVyLnN2Z1wiLCAvLzIyXHJcbiAgXCJpbWcvaG92ZXJzL2dhbWVfX2J1dHRvbi1wYXVzZV9ob3Zlci5zdmdcIiwgICAgICAvLzIzXHJcbiAgXCJpbWcvaG92ZXJzL3BhdXNlX19idXR0b24tY2xvc2VfaG92ZXIuc3ZnXCIsICAgICAvLzI0XHJcbiAgXCJpbWcvaG92ZXJzL3BhdXNlX19idXR0b24tcmVzdGFydF9ob3Zlci5zdmdcIiwgICAvLzI1XHJcbiAgXCJpbWcvaG92ZXJzL3BhdXNlX19idXR0b24tdG9NZW51X2hvdmVyLnN2Z1wiLCAgICAvLzI2XHJcbiAgXCJpbWcvaG92ZXJzL2xldmVsc19fYnV0dG9uLWxldmVsc19ob3Zlci5zdmdcIiwgICAvLzI3XHJcbiAgXCJpbWcvaG92ZXJzL2xldmVsc19fYnV0dG9uLXRvTWVudV9ob3Zlci5zdmdcIiwgICAvLzI4XHJcbiAgXCJpbWcvaG92ZXJzL3dpbl9fYnV0dG9uLW5leHRfaG92ZXIuc3ZnXCIgICAgICAgICAvLzI5XHJcblxyXG5dKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcbiAgcmVzb3Vyc2VzIDogcmVzb3Vyc2VzLFxyXG5cclxuICBhcnJWaWRlb3MgOiBhcnJWaWRlb3MsXHJcblxyXG4gIGFyckltYWdlcyA6IGFyckltYWdlcyAgXHJcblxyXG59O1xyXG5cclxuXHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vX2dhbWVMb29wcy5qcycpO1xyXG5cclxudmFyIHBhdXNlID0gMDtcclxudmFyIGJlZ2luVGltZSA9IDA7XHJcbnZhciBjdXJyZW50VGltZSA9IDA7XHJcbnZhciB1cFRpbWVUTztcclxuXHJcbmZ1bmN0aW9uIHVwVGltZShjb3VudEZyb20pIHtcclxuXHR2YXIgbm93ID0gbmV3IERhdGUoKTtcclxuXHR2YXIgZGlmZmVyZW5jZSA9IChub3ctY291bnRGcm9tICsgY3VycmVudFRpbWUpO1xyXG5cclxuXHR2YXIgaG91cnM9TWF0aC5mbG9vcigoZGlmZmVyZW5jZSUoNjAqNjAqMTAwMCoyNCkpLyg2MCo2MCoxMDAwKSoxKTtcclxuXHR2YXIgbWlucz1NYXRoLmZsb29yKCgoZGlmZmVyZW5jZSUoNjAqNjAqMTAwMCoyNCkpJSg2MCo2MCoxMDAwKSkvKDYwKjEwMDApKjEpO1xyXG5cdHZhciBzZWNzPU1hdGguZmxvb3IoKCgoZGlmZmVyZW5jZSUoNjAqNjAqMTAwMCoyNCkpJSg2MCo2MCoxMDAwKSklKDYwKjEwMDApKS8xMDAwKjEpO1xyXG5cclxuXHRob3VycyA9ICggaG91cnMgPCAxMCkgPyBcIjBcIitob3VycyA6IGhvdXJzO1xyXG5cdG1pbnMgPSAoIG1pbnMgPCAxMCkgPyBcIjBcIittaW5zIDogbWlucztcclxuXHRzZWNzID0gKCBzZWNzIDwgMTApID8gXCIwXCIrc2VjcyA6IHNlY3M7XHJcblxyXG5cdG8uc3RvcFdhdGNoLnR4dCA9IGhvdXJzK1wiIDogXCIrbWlucytcIiA6IFwiK3NlY3M7XHJcblxyXG5cdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblx0dXBUaW1lVE89c2V0VGltZW91dChmdW5jdGlvbigpeyB1cFRpbWUoY291bnRGcm9tKTsgfSwxMDAwLzYwKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcblx0c3RhcnQgOiBmdW5jdGlvbigpIHtcclxuXHRcdC8vIGlmIChnYW1lLnN0YXR1cyA9PSAnZ2FtZScgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcIm1lbnVcIiB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwicGF1c2VcIiB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibGV2ZWxzXCIpIHtcclxuXHRcdFx0dXBUaW1lKG5ldyBEYXRlKCkpO1xyXG5cdFx0XHR2YXIgbm93VCA9IG5ldyBEYXRlKCk7XHJcblx0XHRcdGJlZ2luVGltZSA9IG5vd1QuZ2V0VGltZSgpO1xyXG5cdFx0Ly8gfSBlbHNlIHtcclxuXHRcdC8vIFx0dGhpcy5yZXNldCgpO1xyXG5cdFx0Ly8gfTtcclxuXHR9LFxyXG5cclxuXHRyZXNldCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y3VycmVudFRpbWUgPSAwO1xyXG5cdFx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHJcblx0XHRvLnN0b3BXYXRjaC50eHQgPSBcIjAwIDogMDAgOiAwMFwiO1xyXG5cdFx0Ly8gdGhpcy5zdGFydCgpO1xyXG5cdH0sXHJcblxyXG5cdHBhdXNlVGltZXIgOiBmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGN1ckRhdGEgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0Y3VycmVudFRpbWUgPSBjdXJEYXRhLmdldFRpbWUoKSAtIGJlZ2luVGltZSArIGN1cnJlbnRUaW1lO1xyXG5cdFx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR9XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IsIHR4dCwgbmFtZSwgZlNpemUsIGZvbnRGYW0pe1xyXG4gIFxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG4gIHRoaXMudHh0Q29sb3IgPSBcIndoaXRlXCI7XHJcbiAgdGhpcy5mb250RmFtID0gZm9udEZhbSB8fCBcIkFyaWFsXCI7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKG5vQ2VudGVyLCBwYWRkKXtcclxuXHJcbiAgICB2YXIgX3BhZGQgPSBwYWRkIHx8IDU7XHJcbiAgICB2YXIgX3ggPSAoICFub0NlbnRlciApID8gdGhpcy54K3RoaXMudy8yIDogdGhpcy54K19wYWRkO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMudHh0Q29sb3I7XHJcbiAgICBjdHgudGV4dEFsaWduID0gKCAhbm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggJyt0aGlzLmZvbnRGYW07XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoLCBvcGFjaXR5KXtcclxuXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLm9wYWNpdHkgPSBvcGFjaXR5IHx8IDE7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4Lmdsb2JhbEFscGhhID0gdGhpcy5vcGFjaXR5O1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuXHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1nQnV0dG9uID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoLCB0eHQsIG5hbWUsIGZTaXplLCBzZXRDZW50ZXIsIG5vQ2VudGVyLCBwYWRkKXtcclxuXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLnR4dCA9IHR4dDtcclxuICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIHRoaXMuZlNpemUgPSBmU2l6ZTtcclxuICB0aGlzLnR4dENvbG9yID0gXCJ3aGl0ZVwiO1xyXG4gIHRoaXMuc2V0Q2VudGVyID0gc2V0Q2VudGVyIHx8IHRoaXMueDtcclxuICB0aGlzLm5vQ2VudGVyID0gbm9DZW50ZXIgfHwgZmFsc2U7XHJcbiAgdGhpcy5wYWRkID0gcGFkZCB8fCA1O1xyXG4gIHRoaXMuaG92ZXJJbWcgPSBmYWxzZTtcclxuXHJcbiAgdmFyIG1ldHJpY3MgPSBjdHgubWVhc3VyZVRleHQodGhpcy50eHQpLndpZHRoOyAvL9GA0LDQt9C80LXRgC3RiNC40YDQuNC90LAg0L/QtdGA0LXQtNCw0LLQsNC10LzQvtCz0L4g0YLQtdC60YHRgtCwXHJcbiAgdmFyIF94ID0gKCAhdGhpcy5ub0NlbnRlciApID8gdGhpcy5zZXRDZW50ZXIrdGhpcy53LzIgOiB0aGlzLngrdGhpcy5wYWRkO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMudHh0Q29sb3I7XHJcbiAgICBjdHgudGV4dEFsaWduID0gKCAhdGhpcy5ub0NlbnRlciApID8gXCJjZW50ZXJcIiA6IFwic3RhcnRcIjtcclxuICAgIGN0eC5mb250ID0gdGhpcy5mU2l6ZSArICdweCBjYXB0dXJlX2l0JztcclxuICAgIGN0eC50ZXh0QmFzZWxpbmU9XCJtaWRkbGVcIjsgXHJcbiAgICBjdHguZmlsbFRleHQodGhpcy50eHQsIF94LCB0aGlzLnkrdGhpcy5oLzIpO1xyXG4gIH07XHJcblxyXG4gIHZhciBfaW1nID0gZmFsc2U7IC8v0LHRg9C00LXRgiDRhdGA0LDQvdC40YLRjCDQstGA0LXQvNC10L3QvdC+INC60LDRgNGC0LjQvdC60YMg0YHRgtCw0L3QtNCw0YDRgtC90YPRji5cclxuXHJcbiAgdGhpcy5ob3ZlciA9IGZ1bmN0aW9uKGRyYXcpe1xyXG5cclxuICAgIGlmIChkcmF3ICYmIHRoaXMuaG92ZXJJbWcpIHsgICAgICAgICAgICAgLy/QtdGB0LvQuCDQv9C10YDQtdC00LDQu9C4INC40YHRgtC40L3RgyDQuCDRhdC+0LLQtdGAINGDINGN0YLQvtCz0L4g0L7QsdGK0LXQutGC0LAg0LXRgdGC0YwsINGC0L4g0L7RgtGA0LjRgdC+0LLRi9Cy0LDQtdC8INGF0L7QstC10YBcclxuICAgICAgaWYgKCFfaW1nKSBfaW1nID0gdGhpcy5pbWc7ICAgICAgICAgICAgLy8g0LXRgdC70Lgg0LXRidC1INC90LUg0LHRi9C70LAg0YHQvtGF0YDQsNC90LXQvdCwINGB0YLQsNC90LTQsNGA0YLQvdCw0Y8g0LrQsNGA0YLQuNC90LrQsCwg0YLQviDRgdC+0YXRgNCw0L3Rj9C10Lwg0LguLlxyXG4gICAgICB0aGlzLmltZyA9IHRoaXMuaG92ZXJJbWc7ICAgICAgICAgICAgICAvLy4u0L3QvtCy0L7QuSDQsdGD0LTQtdGCINCy0YvQstC+0LTQuNGC0YHRjyDQv9C10YDQtdC00LDQvdC90LDRj1xyXG4gICAgICBjbnYuc3R5bGUuY3Vyc29yID0gXCJwb2ludGVyXCI7ICAgICAgICAgIC8v0Lgg0LrRg9GA0YHQvtGAINCx0YPQtNC10YIg0L/QvtC40L3RgtC10YBcclxuICAgIH0gZWxzZSBpZiAoIF9pbWcgJiYgX2ltZyAhPSB0aGlzLmltZyl7ICAgLy/QuNC90LDRh9C1INC10YHQu9C4INCx0YvQu9CwINGB0L7RhdGA0LDQvdC10L3QsCDQutCw0YDRgtC40L3QutCwINC4INC90LUg0L7QvdCwINCyINC00LDQvdC90YvQuSDQvNC+0LzQtdC90YIg0L7RgtGA0LjRgdC+0LLRi9Cy0LDQtdGC0YHRjywg0YLQvlxyXG4gICAgICB0aGlzLmltZyA9IF9pbWc7ICAgICAgICAgICAgICAgICAgICAgICAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdC8INGB0YLQsNC90LTQsNGA0YIg0LrQsNGA0YLQuNC90LrRgyDQvdCwINC80LXRgdGC0L5cclxuICAgICAgY252LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiOyAgICAgICAgICAvL9C4INC60YPRgNGB0L7RgCDQtNC10LvQsNC10Lwg0YHRgtCw0L3QtNCw0YDRgtC90YvQvFxyXG4gICAgfTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGxheWFibGUgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVjdCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCBpc1N0cm9rZSl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgdGhpcy5pc1N0cm9rZSA9IGlzU3Ryb2tlIHx8IGZhbHNlO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKCF0aGlzLmlzU3Ryb2tlKSB7XHJcbiAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgIGN0eC5zdHJva2VSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJylcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVmlkZW8gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCB2aWRlbyl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy52aWRlbyA9IHZpZGVvO1xyXG5cclxuICB2YXIgc2F2ZSA9IGZhbHNlO1xyXG4gIHZhciBidWZDbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG4gIHZhciBidWZDdHggPSBidWZDbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gIGJ1ZkNudi53aWR0aCA9IEMuV0lEVEg7XHJcbiAgYnVmQ252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMudmlkZW8pIHtcclxuICAgICAgaWYgKCAhc2F2ZSApe1xyXG4gICAgICAgIGJ1ZkN0eC5kcmF3SW1hZ2UodGhpcy52aWRlbywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgICAgICBzYXZlID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgICAgXHJcbiAgICAgIHRoaXMudmlkZW8ucGxheSgpO1xyXG4gICAgICBjYW52YXMuY3R4LmRyYXdJbWFnZShidWZDbnYsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgIGNhbnZhcy5jdHguZHJhd0ltYWdlKHRoaXMudmlkZW8sIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgfTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2FsbCA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpLFxyXG5QbGF5ZWJsZSAgPSByZXF1aXJlKCcuL2NsYXNzZXMvUGxheWFibGUuanMnKSxcclxuV2FsbCAgICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1dhbGwuanMnKSxcclxuSW1nQnV0dG9uID0gcmVxdWlyZSgnLi9jbGFzc2VzL0ltZ0J1dHRvbi5qcycpLFxyXG5WaWRlbyAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvVmlkZW8uanMnKSxcclxuQnV0dG9uICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0J1dHRvbi5qcycpLFxyXG5SZWN0ICAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvUmVjdC5qcycpLFxyXG5JbWFnZSAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1hZ2UuanMnKSxcclxuQyAgICAgICAgID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKSxcclxuZXZlbnRzICAgID0gcmVxdWlyZSgnLi9fZXZlbnRzLmpzJyksXHJcbmxldmVscyAgICA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpLFxyXG5vICAgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyksXHJcbmNudnMgICAgICA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpLFxyXG5rZXkgXHQgID0gcmVxdWlyZSgnLi9fa2V5LmpzJyk7XHJcblxyXG5lbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLmxvYWRlcik7XHJcblxyXG4vLyDQvNGD0LfRi9C60YMg0LTRg9C80LDRgtGMXHJcblxyXG5cclxuXHJcblxyXG4vLyDQvdCw0YHRgtGA0L7QudC60LggLSDRiNC+0LEg0YLQsNC8INGD0L/RgNCw0LLQu9GP0YLRjCDRgNCw0LfQvNC10YDQsNC80Lgg0L3QsNCy0LXRgNC90L7QtS4uINGF0Lcg0L/QvtC60LBcclxuLy8g0YjRgNC40YTRgiDQvdCw0LTQviDQv9C+0LTQs9GA0YPQttCw0YLRjCDRgNCw0L3QtdC1LCDQvdCw0L/RgNC40LzQtdGAINC+0YLRgNC40YHQvtCy0LDRgtGMINC10LPQviDQsiDQv9GA0LXQu9C+0LnQtNC10YDQtSDQvdC10LLQuNC00LjQvNC+LlxyXG4vLyDRhdCw0LnQtNC40YLRjCDQutC90L7Qv9C60Lgg0LIg0LLRi9Cx0L7RgNC1INGD0YDQvtCy0L3RjyJdfQ==
