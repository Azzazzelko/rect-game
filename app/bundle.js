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
var res = require('./_resourses.js');

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

// function directionIs(direction){  //возвращает угол поворота в градусах, можно было и сделать проще - объектом.

//   switch(direction){

//     case "up"   : return 360;
//     break;
//     case "down" : return 180;
//     break;
//     case "left" : return 270;
//     break;
//     case "right": return 90;
//     break;

//   };
// };

function canMoveObj(direction){  //(описываем границы движения) разрешает движение в пределах уровня

  o.pl.direction = o.pl.isMove = hf.directionIs(direction);
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
  sw.start();                          //запускаем таймер
  levels[number]();                    //запускаем уроверь который запросили
  gameLoops.currentLevel = number;     //запоминаем какой сейчас уровень играть будем 
  o.currLevel.txt = "Уровень "+number; //в хедере выводим номер уровня
  engin.setGameEngine(gameLoops.game); //ну и запускаем цикл игры 
};

window.onkeydown = function(e){ //событие нажатия клавиш

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
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_fullScreen.js":5,"./_gameLoops.js":6,"./_helperFunctions.js":7,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./_resourses.js":11,"./_stopwatch.js":12}],5:[function(require,module,exports){
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

module.exports = gameLoops =  {

  loader : function(){

    gameLoops.status = "loader";

    o.PRELOADER.draw();
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

},{"./_const.js":2,"./_engine.js":3,"./_helperFunctions.js":7,"./_objects.js":10,"./_resourses.js":11}],7:[function(require,module,exports){
var canvas = require('./_canvas.js');
var o = require('./_objects.js');

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

},{"./_const.js":2,"./_helperFunctions.js":7,"./_objects.js":10,"./_resourses.js":11}],10:[function(require,module,exports){
var C = require('./_const.js');
var cnvs = require('./_canvas.js');
var res = require('./_resourses.js');


function createMatrixBG(){ //создаем матричное поле
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

function createWinPopUp(){ //создаем победную вспллывашку

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

function createPausePopUp(){  //создаем пауз всплывашку

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

function createLevelsFooter(){  //создаем футер в выборе уровня

  var levelsFooter = [];

  var bPrev = new ImgButton( res.arrImages[19], 20, C.HEIGHT-10-67, 40, 67, "", "prev", 0 );
  var bNext = new ImgButton( res.arrImages[18], C.WIDTH-20-40, C.HEIGHT-10-67, 40, 67, "", "next", 0 );
  var bToMenu = new ImgButton( res.arrImages[20], C.WIDTH/2 - 320/2, C.HEIGHT-10-67, 320, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.hoverImg = res.arrImages[28];
  bToMenu.txtColor = "#000046";

  levelsFooter.push(bPrev,bNext,bToMenu);

  return levelsFooter;
};

function createPlayer(){  //создаем игрока с уникальными методами

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
var pl = createPlayer();
var box = new Playable(res.arrImages[6],0,0,50,50); //бокс
var door = new Playable(res.arrImages[7],0,0,50,50); //дверь
var walls = []; //стены на уровне, заполняется выбранным уровнем.


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

},{"./_canvas.js":1,"./_const.js":2,"./_resourses.js":11}],11:[function(require,module,exports){
var resourses = {
  images : false,
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
  this.hoverImg = false;

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

  var _img = false; //будет хранить временно картинку стандартную.

  this.hover = function(draw){

    // if (this.hoverImg) {                     //если навели и передали картинку для этого, то
    //   if (!_img) _img = this.img;            // если еще не была сохранена стандартная картинка, то сохраняем и..
    //   this.img = this.hoverImg;              //..новой будет выводится переданная
    //   cnv.style.cursor = "pointer";          //и курсор будет поинтер
    // } else if ( _img && _img != this.img){   //иначе если была сохранена картинка и не она в данный момент отрисовывается, то
    //   this.img = _img;                       //возвращаем стандарт картинку на место
    //   cnv.style.cursor = "default";          //и курсор делаем стандартным
    // };

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
},{"./../_canvas.js":1,"./../_const.js":2}],18:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],19:[function(require,module,exports){
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


// настройки - шоб там управлять размерами наверное.. хз пока

// музыку думать
// прелоадер запилить

// хайдить кнопки в выборе уровня
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Button.js":13,"./classes/Image.js":14,"./classes/ImgButton.js":15,"./classes/Playable.js":16,"./classes/Rect.js":17,"./classes/Video.js":18,"./classes/Wall.js":19}]},{},[20])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcmVzb3Vyc2VzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3N0b3B3YXRjaC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvQnV0dG9uLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWFnZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvSW1nQnV0dG9uLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9QbGF5YWJsZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvUmVjdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvVmlkZW8uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1dhbGwuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9mYWtlX2VhMjM3OTg3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIGNudiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG52YXIgY3R4ID0gY252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbmNudi5zdHlsZS5ib3JkZXIgPSBcIjJweCBzb2xpZCBibGFja1wiO1xyXG5jbnYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ3aGl0ZVwiO1xyXG5jbnYud2lkdGggPSBDLldJRFRIO1xyXG5jbnYuaGVpZ2h0ID0gQy5IRUlHSFQ7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Y252IDogY252LFxyXG5cclxuXHRjdHggOiBjdHhcclxuXHJcbn07IiwidmFyIFBBREQgPSAxOyBcdFx0XHRcdFx0XHQvL9C/0LDQtNC00LjQvdCzLCDQutC+0YLQvtGA0YvQuSDRjyDRhdC+0YfRgyDRh9GC0L7QsdGLINCx0YvQuywg0LzQtdC2INC60LLQsNC00YDQsNGC0LDQvNC4XHJcbnZhciBXSURUSCA9IFBBREQgKyAoUEFERCs1MCkqOTsgXHQvL9GI0LjRgNC40L3QsCDQutCw0L3QstGLXHJcbnZhciBIRUlHSFQgPSAyMCtQQUREICsgKFBBREQrNTApKjEwOyAgIC8v0LLRi9GB0L7RgtCwINC60LDQvdCy0YtcclxudmFyIENOVl9CT1JERVIgPSAyO1xyXG52YXIgSEVBREVSX0ggPSA3MTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRQRE5HIDogUEFERCxcclxuXHJcblx0V0lEVEggOiBXSURUSCxcclxuXHJcblx0SEVJR0hUIDogSEVJR0hULFxyXG5cclxuXHRDTlZfQk9SREVSIDogQ05WX0JPUkRFUixcclxuXHJcblx0SEVBREVSX0ggOiBIRUFERVJfSFxyXG5cclxufTtcclxuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4vLyoq0LrRgNC+0YHQsdGA0LDRg9C30LXRgNC90L7QtSDRg9C/0YDQstC70LXQvdC40LUg0YbQuNC60LvQsNC80Lgg0LjQs9GA0YsqKlxyXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbnZhciBjYW52YXMgPSByZXF1aXJlKFwiLi9fY2FudmFzLmpzXCIpO1xyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRnYW1lRW5naW5lU3RhcnQgOiBmdW5jdGlvbiAoY2FsbGJhY2spe1xyXG5cdFx0Z2FtZUVuZ2luZSA9IGNhbGxiYWNrO1xyXG5cdFx0Z2FtZUVuZ2luZVN0ZXAoKTtcclxuXHR9LFxyXG5cclxuXHRzZXRHYW1lRW5naW5lIDogZnVuY3Rpb24oY2FsbGJhY2spe1xyXG5cdFx0aWYgKCBjYW52YXMuY252LnN0eWxlLmN1cnNvciAhPSBcImRlZmF1bHRcIiApIGNhbnZhcy5jbnYuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7ICAvL9Cy0YHQtdCz0LTQsCDQv9GA0Lgg0LrQu9C40LrQtSDQvdCwINC70Y7QsdGD0Y4g0LrQvdC+0L/QutGDLCDRh9GC0L4g0LEg0LrRg9GA0YHQvtGAINGB0YLQsNC90LTQsNGA0YLQuNC30LjRgNC+0LLQsNC70YHRj1xyXG5cdFx0Z2FtZUVuZ2luZSA9IGNhbGxiYWNrO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgc3cgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIGZzID0gcmVxdWlyZSgnLi9fZnVsbFNjcmVlbi5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBrZXkgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxudmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxudmFyIGdhbWVMb29wcyA9IGdMb287XHJcblxyXG52YXIgaXNCb3JkZXIgPSB7IC8v0L/RgNC40L3QuNC80LDQtdGCINC+0LHRitC10LrRgiwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10L7QvNC5INCz0YDQsNC90LjRhtGLINC60LDQvdCy0YtcclxuICB1cCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnkgPT0gMDtcclxuICB9LFxyXG5cclxuICBkb3duIDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueSA9PSBDLkhFSUdIVCAtIG9iai5oIC0gQy5QRE5HIC0gQy5IRUFERVJfSCAtIEMuUERORztcclxuICB9LFxyXG5cclxuICBsZWZ0IDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueCA9PSAwO1xyXG4gIH0sXHJcblxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueCA9PSBDLldJRFRIIC0gb2JqLncgLSBDLlBETkcgLSBDLlBETkdcclxuICB9XHJcbn07XHJcblxyXG52YXIgaXNOZWFyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiAyINC+0LHRitC10LrRgtCwLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvNC+0Lkg0YHRgtC+0YDQvtC90YsgMdGL0Lkg0L7RgiAy0LPQvi5cclxuXHJcbiAgdXAgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7ICAvL9C/0YDQvtCy0LXRgNC60LAg0L/QtdGA0LXQtNCw0LLQsNC10LzRi9C5INGN0LvQtdC80LXQvdGCINC80LDRgdGB0LjQsiDQvtCx0YrQtdC60YLQvtCyINC40LvQuCDQvtCx0YrQtdC60YIuXHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS55ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi55ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBkb3duIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnggKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnggKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH0sXHJcblxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gZnVuY3Rpb24gZGlyZWN0aW9uSXMoZGlyZWN0aW9uKXsgIC8v0LLQvtC30LLRgNCw0YnQsNC10YIg0YPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQsiDQs9GA0LDQtNGD0YHQsNGFLCDQvNC+0LbQvdC+INCx0YvQu9C+INC4INGB0LTQtdC70LDRgtGMINC/0YDQvtGJ0LUgLSDQvtCx0YrQtdC60YLQvtC8LlxyXG5cclxuLy8gICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuXHJcbi8vICAgICBjYXNlIFwidXBcIiAgIDogcmV0dXJuIDM2MDtcclxuLy8gICAgIGJyZWFrO1xyXG4vLyAgICAgY2FzZSBcImRvd25cIiA6IHJldHVybiAxODA7XHJcbi8vICAgICBicmVhaztcclxuLy8gICAgIGNhc2UgXCJsZWZ0XCIgOiByZXR1cm4gMjcwO1xyXG4vLyAgICAgYnJlYWs7XHJcbi8vICAgICBjYXNlIFwicmlnaHRcIjogcmV0dXJuIDkwO1xyXG4vLyAgICAgYnJlYWs7XHJcblxyXG4vLyAgIH07XHJcbi8vIH07XHJcblxyXG5mdW5jdGlvbiBjYW5Nb3ZlT2JqKGRpcmVjdGlvbil7ICAvLyjQvtC/0LjRgdGL0LLQsNC10Lwg0LPRgNCw0L3QuNGG0Ysg0LTQstC40LbQtdC90LjRjykg0YDQsNC30YDQtdGI0LDQtdGCINC00LLQuNC20LXQvdC40LUg0LIg0L/RgNC10LTQtdC70LDRhSDRg9GA0L7QstC90Y9cclxuXHJcbiAgby5wbC5kaXJlY3Rpb24gPSBvLnBsLmlzTW92ZSA9IGhmLmRpcmVjdGlvbklzKGRpcmVjdGlvbik7XHJcbiAgaWYgKCBpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5ib3gpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLmJveCwgby53YWxscykgKXsgLy/QtdGB0LvQuCDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDRj9GJ0LjQuiDQvdC1INGDINCz0YDQsNC90LjRhiwg0LTQstC40LPQsNC10LwuXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIG8uYm94Lm1vdmUoZGlyZWN0aW9uKTtcclxuICB9IGVsc2UgaWYoICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5wbCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0L3QtSDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0LPRgNCw0L3QuNGG0LXQuSwg0LTQstC40LPQsNC10LzRgdGPLlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNDdXJzb3JJbkJ1dHRvbih4LHksYnV0KXsgLy/QstC+0LfQstGA0LDRidCw0LXRgiDRgtGA0YMsINC10YHQu9C4INC60YPRgNGB0L7RgCDQv9C+0L/QsNC7INCyINC60L7QvtGA0LTQuNC90LDRgtGLINC+0LHRitC10LrRgtCwXHJcbiAgcmV0dXJuIHggPj0gYnV0LnggJiYgXHJcbiAgeCA8PSBidXQueCtidXQudyAmJiBcclxuICB5ID49IGJ1dC55ICYmIFxyXG4gIHkgPD0gYnV0LnkrYnV0LmhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGxvYWRMZXZlbChudW1iZXIpeyAvL9C30LDQs9GA0YPQt9C60LAg0YPRgNC+0LLQvdGPXHJcbiAgc3cuc3RhcnQoKTsgICAgICAgICAgICAgICAgICAgICAgICAgIC8v0LfQsNC/0YPRgdC60LDQtdC8INGC0LDQudC80LXRgFxyXG4gIGxldmVsc1tudW1iZXJdKCk7ICAgICAgICAgICAgICAgICAgICAvL9C30LDQv9GD0YHQutCw0LXQvCDRg9GA0L7QstC10YDRjCDQutC+0YLQvtGA0YvQuSDQt9Cw0L/RgNC+0YHQuNC70LhcclxuICBnYW1lTG9vcHMuY3VycmVudExldmVsID0gbnVtYmVyOyAgICAgLy/Qt9Cw0L/QvtC80LjQvdCw0LXQvCDQutCw0LrQvtC5INGB0LXQudGH0LDRgSDRg9GA0L7QstC10L3RjCDQuNCz0YDQsNGC0Ywg0LHRg9C00LXQvCBcclxuICBvLmN1cnJMZXZlbC50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK251bWJlcjsgLy/QsiDRhdC10LTQtdGA0LUg0LLRi9Cy0L7QtNC40Lwg0L3QvtC80LXRgCDRg9GA0L7QstC90Y9cclxuICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5nYW1lKTsgLy/QvdGDINC4INC30LDQv9GD0YHQutCw0LXQvCDRhtC40LrQuyDQuNCz0YDRiyBcclxufTtcclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQutC70LDQstC40YhcclxuXHJcbiAgaWYgKCBnTG9vLnN0YXR1cyA9PSBcImdhbWVcIiApeyAvL9C/0LXRgNC10LTQstC40LPQsNGC0YzRgdGPINGC0L7Qu9GM0LrQviDQtdGB0LvQuCDQuNC00LXRgiDQuNCz0YDQsC5cclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJEXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcInJpZ2h0XCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIlNcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwiZG93blwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJXXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcInVwXCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIkFcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwibGVmdFwiKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgd2luZG93Lm9ua2V5dXAgPSBmdW5jdGlvbihlKXtcclxuICAgIG8ucGwuaXNNb3ZlID0gZmFsc2U7XHJcbiAgfTtcclxufTtcclxuXHJcbndpbmRvdy5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGUpeyAvL2PQvtCx0YvRgtC40LUg0L3QsNC20LDRgtC40Y8g0LzRi9GI0LrQuFxyXG5cclxuICBpZiAoIGZzLmlzRnVsbFNjcmVlbiApeyAgICAgIFxyXG4gICAgdmFyIHggPSAoZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQpL2ZzLnpvb207XHJcbiAgICB2YXIgeSA9IChlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wKS9mcy56b29tO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgeCA9IGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0O1xyXG4gICAgdmFyIHkgPSBlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wO1xyXG4gIH07XHJcblxyXG4gIHN3aXRjaCAoZ0xvby5zdGF0dXMpe1xyXG5cclxuICAgIGNhc2UgXCJtZW51XCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLm1lbnVbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInBsYXlcIiA6XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiY2hhbmdlX2xldmVsXCIgOlxyXG4gICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5sZXZlbHMpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJsZXZlbHNcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5sZXZlbHNGb290ZXIgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubGV2ZWxzRm9vdGVyW2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLmxldmVsc0Zvb3RlcltpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicHJldlwiIDpcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0L3QsNC30LDQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwidG9fbWVudVwiIDpcclxuICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcIm5leHRcIiA6XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi0JrQvdC+0L/QutCwINCy0L/QtdGA0LXQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgby5iTGV2ZWxzQnV0dG9ucy5sZW5ndGg7IGkrKyApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iTGV2ZWxzQnV0dG9uc1tpXSkgKXtcclxuICAgICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBpKzE7XHJcbiAgICAgICAgICBsb2FkTGV2ZWwoaSsxKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiZ2FtZVwiIDpcclxuICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJQYXVzZSkgKXtcclxuICAgICAgICBzdy5wYXVzZVRpbWVyKCk7XHJcbiAgICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLnBhdXNlKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKXtcclxuICAgICAgICAoICFmcy5pc0Z1bGxTY3JlZW4gKSA/IGZzLmxhdW5jaEZ1bGxTY3JlZW4oY2FudmFzLmNudikgOiBmcy5jYW5zZWxGdWxsU2NyZWVuKCk7IFxyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwid2luXCIgOlxyXG5cclxuICAgICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLndpblBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfZXhpdFwiICl7XHJcbiAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX25leHRcIiAmJiBnYW1lTG9vcHMuY3VycmVudExldmVsICE9IGxldmVscy5sdmxzQ291bnQoKSApe1xyXG4gICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsKys7XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcInBhdXNlXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5wYXVzZVBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLnBhdXNlUG9wVXBbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJldHVyblwiIDpcclxuICAgICAgICAgICAgICBzdy5zdGFydCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmdhbWUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJlc3RhcnRcIiA6XHJcbiAgICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiZXhpdFwiIDpcclxuICAgICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZW1vdmUgPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjRjyDQtNCy0LjQttC10L3QuNGPINC80YvRiNC60LgsINGC0YPRgiDRhdC+0LLQtdGA0Ysg0L7QsdGA0LDQsdC+0YLQsNC10LxcclxuXHJcbiAgaWYgKCBmcy5pc0Z1bGxTY3JlZW4gKXtcclxuICAgIHZhciB4ID0gKGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0KS9mcy56b29tO1xyXG4gICAgdmFyIHkgPSAoZS5wYWdlWS1jYW52YXMuY252Lm9mZnNldFRvcCkvZnMuem9vbTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICAgIHZhciB5ID0gZS5wYWdlWS1jYW52YXMuY252Lm9mZnNldFRvcDtcclxuICB9O1xyXG5cclxuICBzd2l0Y2ggKGdMb28uc3RhdHVzKXtcclxuXHJcbiAgICBjYXNlIFwibWVudVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLm1lbnUgKXtcclxuICAgICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubWVudVtpXSkgKSA/IG8ubWVudVtpXS5ob3ZlcigxKSA6IG8ubWVudVtpXS5ob3ZlcigpO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiZ2FtZVwiIDpcclxuICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJQYXVzZSkgKSA/IG8uYlBhdXNlLmhvdmVyKDEpIDogby5iUGF1c2UuaG92ZXIoKTtcclxuXHJcbiAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKSA/IG8uYkZ1bGxTY3IuaG92ZXIoMSkgOiBvLmJGdWxsU2NyLmhvdmVyKCk7ICBcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcIndpblwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLndpblBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfZXhpdFwiICl7XHJcbiAgICAgICAgICAgIG8ud2luUG9wVXBbaV0uaG92ZXIoMSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgIT0gbGV2ZWxzLmx2bHNDb3VudCgpICl7XHJcbiAgICAgICAgICAgIG8ud2luUG9wVXBbaV0uaG92ZXIoMSk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0uaG92ZXIgKSBvLndpblBvcFVwW2ldLmhvdmVyKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImxldmVsc1wiIDpcclxuICAgICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5sZXZlbHNGb290ZXJbaV0pICkgPyBvLmxldmVsc0Zvb3RlcltpXS5ob3ZlcigxKSA6IG8ubGV2ZWxzRm9vdGVyW2ldLmhvdmVyKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJMZXZlbHNCdXR0b25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJMZXZlbHNCdXR0b25zW2ldKSApID8gby5iTGV2ZWxzQnV0dG9uc1tpXS5ob3ZlcigxKSA6IG8uYkxldmVsc0J1dHRvbnNbaV0uaG92ZXIoKTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgXHJcbiAgICBjYXNlIFwicGF1c2VcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5wYXVzZVBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLnBhdXNlUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ucGF1c2VQb3BVcFtpXS5ob3ZlciApIG8ucGF1c2VQb3BVcFtpXS5ob3ZlcigxKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKCBvLnBhdXNlUG9wVXBbaV0uaG92ZXIgKSBvLnBhdXNlUG9wVXBbaV0uaG92ZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICB9O1xyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIHpvb20gPSAwO1xyXG5cclxuZnVuY3Rpb24gZnVsbENhbnZhcygpe1x0Ly/QutCw0L3QstCwINCy0L4g0LLQtdGB0Ywg0Y3QutGA0LDQvVxyXG5cclxuXHR2YXIgZGV2aWNlV2lkdGggPSB3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGg7XHJcblx0dmFyIGRldmljZUhlaWdodCA9IHdpbmRvdy5zY3JlZW4uYXZhaWxIZWlnaHQ7XHJcblx0ZnVsbFNjcmVlbi56b29tID0gKGRldmljZUhlaWdodCAvIEMuSEVJR0hUKS50b0ZpeGVkKDEpO1x0Ly/QutCw0LrQvtC1INGD0LLQtdC70LjRh9C10L3QuNC1INGB0LTQtdC70LDRgtGMINC40YHRhdC+0LTRjyDQuNC3INGA0LDQt9C80LXRgNC+0LIg0Y3QutGA0LDQvdCwLlxyXG5cclxuXHRjYW52YXMuY252LndpZHRoID0gY2FudmFzLmNudi53aWR0aCpmdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodCpmdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmN0eC5zY2FsZShmdWxsU2NyZWVuLnpvb20sZnVsbFNjcmVlbi56b29tKTtcclxuXHJcblx0ZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW4gPSAhZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW47XHJcbn07XHJcblxyXG5mdW5jdGlvbiBub3JtYWxDYW52YXMoKXtcdC8v0LjRgdGF0L7QtNC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUg0LrQsNC90LLRi1xyXG5cclxuXHQvL2PQvtGF0YDQsNC90Y/QtdC8INC/0L7RgdC70LXQtNC90LjQuSDQutCw0LTRgCDQuNCz0YDRiywg0LTQsNCx0Ysg0L/RgNC4INCy0L7Qt9Cy0YDQsNGJ0LXQvdC40Lgg0YDQsNC30LzQtdGA0LAg0L/QvtGB0LvQtSDRhNGD0LvRgdC60YDQuNC90LAsINC+0L0g0L7RgtGA0LjRgdC+0LLQsNC70YHRjywg0LjQvdCw0YfQtSDQsdGD0LTQtdGCINCx0LXQu9GL0Lkg0YXQvtC70YHRgi5cclxuXHR2YXIgYnVmQ252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuXHR2YXIgYnVmQ3R4ID0gYnVmQ252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHRidWZDbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbTtcclxuXHRidWZDbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tO1xyXG5cdGJ1ZkN0eC5kcmF3SW1hZ2UoY2FudmFzLmNudiwgMCwwLCBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbSwgY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tKTtcclxuXHJcblx0Y2FudmFzLmNudi53aWR0aCA9IGNhbnZhcy5jbnYud2lkdGgvZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jdHguc2NhbGUoMSwxKTtcclxuXHRjYW52YXMuY3R4LmRyYXdJbWFnZShidWZDbnYsMCwwLGNhbnZhcy5jbnYud2lkdGgsY2FudmFzLmNudi5oZWlnaHQpO1xyXG5cclxuXHRmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbiA9ICFmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uRnVsbFNjcmVlbkNoYW5nZSgpe1x0Ly/Qv9GA0Lgg0LjQt9C80LXQvdC40Lgg0YHQvtGB0YLQvtGP0L3QuNC1INGE0YPQu9GB0LrRgNC40L3QsFxyXG5cclxuXHQoIGZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuICkgPyBub3JtYWxDYW52YXMoKSA6IGZ1bGxDYW52YXMoKTtcclxufTtcclxuXHJcbmNhbnZhcy5jbnYuYWRkRXZlbnRMaXN0ZW5lcihcIndlYmtpdGZ1bGxzY3JlZW5jaGFuZ2VcIiwgb25GdWxsU2NyZWVuQ2hhbmdlKTtcclxuY2FudmFzLmNudi5hZGRFdmVudExpc3RlbmVyKFwibW96ZnVsbHNjcmVlbmNoYW5nZVwiLCAgICBvbkZ1bGxTY3JlZW5DaGFuZ2UpO1xyXG5jYW52YXMuY252LmFkZEV2ZW50TGlzdGVuZXIoXCJmdWxsc2NyZWVuY2hhbmdlXCIsICAgICAgIG9uRnVsbFNjcmVlbkNoYW5nZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bGxTY3JlZW4gPSB7IFxyXG5cclxuXHRsYXVuY2hGdWxsU2NyZWVuIDogZnVuY3Rpb24oZWxlbSl7XHJcblxyXG5cdFx0aWYgKCBlbGVtLnJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ubW96UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5tb3pSZXF1c3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBlbGVtLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH07XHJcblx0fSxcclxuXHJcblx0Y2Fuc2VsRnVsbFNjcmVlbiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0aWYgKCBkb2N1bWVudC5leGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRpc0Z1bGxTY3JlZW4gOiBmYWxzZSxcclxuXHJcblx0em9vbSA6IHpvb21cclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVMb29wcyA9ICB7XHJcblxyXG4gIGxvYWRlciA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwibG9hZGVyXCI7XHJcblxyXG4gICAgby5QUkVMT0FERVIuZHJhdygpO1xyXG4gICAgaWYgKCByZXMucmVzb3Vyc2VzLmFyZUxvYWRlZCgpICkgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwiZ2FtZVwiOyBcclxuXHJcbiAgICAvL9C+0YfQuNGB0YLQutCwINC+0LHQu9Cw0YHRgtC4XHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINCx0LMg0YPRgNC+0LLQvdGPXHJcbiAgICBvLmJnTGV2ZWwuZHJhdygpO1xyXG4gICAgXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDQvNCw0YLRgNC40YfQvdC+0LUg0L/QvtC70LUg0LjQs9GA0YtcclxuICAgIGZvciAoIGkgaW4gby5tYXRyaXggKXtcclxuICAgICAgby5tYXRyaXhbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDRgdGC0LXQvdGLXFzQv9GA0LXQs9GA0LDQtNGLXHJcbiAgICBmb3IgKCBpIGluIG8ud2FsbHMgKXtcclxuICAgICAgby53YWxsc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINGF0LXQtNC10YDQsCDRg9GA0L7QstC90Y9cclxuICAgIG8uaGVhZGVyLmRyYXcoKTtcclxuICAgIG8uc3RvcFdhdGNoLmRyYXcoMSwxMCk7XHJcbiAgICBvLmJGdWxsU2NyLmRyYXcoKTtcclxuICAgIG8uYlBhdXNlLmRyYXcoKTtcclxuICAgIG8uY3VyckxldmVsLmRyYXcoKTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDQuNCz0YDQvtCy0YvRhSDQvtCx0YrQtdC60YLQvtCyXHJcbiAgICBvLmRvb3IuZHJhdygpO1xyXG4gICAgby5wbC5kcmF3KCk7XHJcbiAgICBvLmJveC5kcmF3KCk7XHJcblxyXG4gICAgLy/QtdGB0LvQuCDQv9C+0LHQtdC00LjQu9C4XHJcbiAgICBpZiAoIGhmLmlzV2luKCkgKXtcclxuICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy53aW4pO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJtZW51XCI7XHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICBvLmFuaW1hdGVCZy5kcmF3KCk7XHJcblxyXG4gICAgby5sb2dvLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICBvLm1lbnVbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgfSxcclxuXHJcbiAgd2luIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJ3aW5cIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJ3aW5fdGV4dFwiICkgby53aW5Qb3BVcFtpXS50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK2dhbWVMb29wcy5jdXJyZW50TGV2ZWw7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9PSBsZXZlbHMubHZsc0NvdW50KCkgKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgby53aW5Qb3BVcFtpXS5kcmF3KCk7XHJcbiAgICAgIH0gIFxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBwYXVzZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwicGF1c2VcIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICBvLnBhdXNlUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBsZXZlbHMgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImxldmVsc1wiO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby52aWRlb0JnTGV2ZWxzLmRyYXcoKTtcclxuXHJcbiAgICBvLmxldmVsc0hlYWRlci5kcmF3KCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLmJMZXZlbHNCdXR0b25zICl7XHJcbiAgICAgIG8uYkxldmVsc0J1dHRvbnNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgIG8ubGV2ZWxzRm9vdGVyW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgc3RhdHVzIDogXCJcIixcclxuXHJcbiAgY3VycmVudExldmVsIDogXCIxXCJcclxuXHJcbn07XHJcbiIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgY2xlYXJSZWN0IDogZnVuY3Rpb24oeCx5LHcsaCl7ICAvL9C+0YfQuNGB0YLQuNGC0LXQu9GMXHJcbiAgICBjdHguY2xlYXJSZWN0KHgseSx3LGgpO1xyXG4gIH0sXHJcblxyXG4gIGdldFJhbmRvbUludCA6IGZ1bmN0aW9uKG1pbiwgbWF4KSB7IC8v0YTRg9C90LrRhtC40Y8g0LTQu9GPINGA0LDQvdC00L7QvNCwINGG0LXQu9C+0YfQuNGB0LvQtdC90L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRj1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbiAgfSxcclxuXHJcbiAgaXNXaW4gOiBmdW5jdGlvbigpeyAvL9C/0L7QsdC10LTQuNC70Lg/XHJcbiAgICByZXR1cm4gby5ib3gueCA9PSBvLmRvb3IueCAmJiBvLmJveC55ID09IG8uZG9vci55O1xyXG4gIH0sXHJcblxyXG4gIGRpcmVjdGlvbklzIDogZnVuY3Rpb24oZGlyZWN0aW9uKXsgIC8v0LLQvtC30LLRgNCw0YnQsNC10YIg0YPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQsiDQs9GA0LDQtNGD0YHQsNGFLCDQvNC+0LbQvdC+INCx0YvQu9C+INC4INGB0LTQtdC70LDRgtGMINC/0YDQvtGJ0LUgLSDQvtCx0YrQtdC60YLQvtC8LlxyXG4gIFx0c3dpdGNoKGRpcmVjdGlvbil7XHJcblxyXG4gIFx0XHRjYXNlIFwidXBcIiAgIDogcmV0dXJuIDM2MDtcclxuICBcdFx0YnJlYWs7XHJcbiAgXHRcdGNhc2UgXCJkb3duXCIgOiByZXR1cm4gMTgwO1xyXG4gIFx0XHRicmVhaztcclxuICBcdFx0Y2FzZSBcImxlZnRcIiA6IHJldHVybiAyNzA7XHJcbiAgXHRcdGJyZWFrO1xyXG4gIFx0XHRjYXNlIFwicmlnaHRcIjogcmV0dXJuIDkwO1xyXG4gIFx0XHRicmVhaztcclxuXHJcbiAgXHR9O1xyXG4gIH1cclxufTtcclxuIiwidmFyIGtleXMgPSB7XHJcblx0XCJXXCIgOiA4NyxcclxuXHRcIlNcIiA6IDgzLFxyXG5cdFwiQVwiIDogNjUsXHJcblx0XCJEXCIgOiA2OFxyXG59O1xyXG5cclxudmFyIGtleURvd24gPSAwO1xyXG4vLyB2YXIga2V5RG93biA9IHt9O1xyXG5cclxuZnVuY3Rpb24gc2V0S2V5KGtleUNvZGUpe1xyXG5cdGtleURvd24gPSBrZXlDb2RlO1xyXG5cdC8vIGtleURvd25ba2V5Y29kZV0gPSB0cnVlO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY2xlYXJLZXkoa2V5Q29kZSl7XHJcblx0a2V5RG93biA9IDA7XHJcblx0Ly8ga2V5RG93bltrZXlDb2RlXSA9IGZhbHNlO1xyXG59O1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdHNldEtleShlLmtleUNvZGUpO1xyXG59KTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBmdW5jdGlvbihlKXtcclxuXHRjbGVhcktleShlLmtleUNvZGUpO1xyXG59KTtcclxuXHJcblxyXG5mdW5jdGlvbiBpc0tleURvd24oa2V5TmFtZSl7XHJcblx0cmV0dXJuIGtleURvd25ba2V5c1trZXlOYW1lXV0gPT0gdHJ1ZTtcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdGlzS2V5RG93biA6IGZ1bmN0aW9uKGtleU5hbWUpe1xyXG5cdFx0cmV0dXJuIGtleURvd24gPT0ga2V5c1trZXlOYW1lXTtcclxuXHRcdC8vIHJldHVybiBrZXlEb3duW2tleXNba2V5TmFtZV1dID09IHRydWU7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcbnZhciBoZiA9IHJlcXVpcmUoJy4vX2hlbHBlckZ1bmN0aW9ucy5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbHMgPSB7XHJcblxyXG5cdGx2bHNDb3VudCA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0Zm9yKGtleSBpbiBsZXZlbHMpeyBjb3VudCsrIH07XHJcblx0XHRcdHJldHVybiBjb3VudC0xO1xyXG5cdH0sXHJcblxyXG5cdDEgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIC8v0LzQsNGB0YHQuNCyINGBINCx0YPQtNGD0YnQtdC/0L7RgdGC0YDQvtC10L3QvdGL0LzQuCDRgdGC0LXQvdC60LDQvNC4XHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFsxLDNdLFsxLDRdLFsxLDVdLFsyLDBdLFsyLDZdLFsyLDhdLFszLDJdLFs0LDFdLFs0LDNdLFs0LDddLFs1LDRdLFs2LDRdLFs2LDZdLFs3LDFdLFs3LDhdLFs4LDBdLFs4LDRdLFs4LDVdXHJcblx0XHRdO1x0XHRcdFx0ICAvL9C/0YDQuNC00YPQvNCw0L3QvdGL0Lkg0LzQsNGB0YHQuNCyINGB0L4g0YHRgtC10L3QutCw0LzQuFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC80LDRgdGB0LjQsiB3YWxsc1xyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDAgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInJpZ2h0XCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsyKig1MCtDLlBETkcpLCA3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDIgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwwXSxbMCw0XSxbMCwzXSxbMCw2XSxbMiwyXSxbMiw0XSxbMyw4XSxbMywwXSxbMyw3XSxbNCwyXSxbNCw0XSxbNCw1XSxbNCw2XSxbNSwwXSxbNiwyXSxbNiw1XSxbNiw2XSxbNiw3XSxbNywwXSxbOCwzXSxbOCw0XSxbOCw3XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCs4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJyaWdodFwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArNiooNTArQy5QRE5HKSwgMCs3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCs2Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MyA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDJdLFswLDddLFsxLDVdLFsxLDhdLFsyLDJdLFsyLDddLFszLDRdLFs0LDFdLFs0LDRdLFs0LDZdLFs2LDJdLFs2LDNdLFs2LDRdLFs2LDZdLFs2LDhdLFs3LDBdLFs3LDVdLFs4LDBdLFs4LDFdLFs4LDNdLFs4LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwidXBcIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzEqKDUwK0MuUERORyksIDArNiooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzIqKDUwK0MuUERORyksIDArMyooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDQgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwxXSxbMSw1XSxbMSw3XSxbMiw0XSxbMywxXSxbMywzXSxbMyw2XSxbMyw4XSxbNCwzXSxbNSw1XSxbNSw3XSxbNiwwXSxbNiwyXSxbNiwzXSxbNiw1XSxbNyw4XSxbOCwwXSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInVwXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs2Kig1MCtDLlBETkcpLCAwKzAqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQ1IDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMV0sWzAsM10sWzAsNV0sWzAsOF0sWzIsMl0sWzIsNF0sWzIsNl0sWzIsOF0sWzQsMF0sWzQsM10sWzQsNV0sWzQsN10sWzYsMV0sWzYsMl0sWzYsNF0sWzYsN10sWzcsOF0sWzgsMl0sWzgsNF0sWzgsOF1cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDArMCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwiZG93blwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArMSooNTArQy5QRE5HKSwgMCsxKig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDAsIDArOCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGNudnMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1hdHJpeEJHKCl7IC8v0YHQvtC30LTQsNC10Lwg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1XHJcbiAgdmFyIG1hdHJpeCA9IFtdOyAgICAgICAgICAgICAgICAgICAgIC8v0LzQsNGB0YHQuNCyINC00LvRjyDQvNCw0YLRgNC40YfQvdC+0LPQviDQstC40LTQsCDRg9GA0L7QstC90Y9cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspeyAgICAgICAgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC+0LHRitC10LrRglxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCA5OyBqKyspe1xyXG4gICAgICBtYXRyaXgucHVzaCggbmV3IFJlY3QoQy5QRE5HK2oqKDUwK0MuUERORyksIDcxK0MuUERORytpKig1MCtDLlBETkcpLCA1MCwgNTAsIFwicmdiYSgwLDAsMCwwLjUpXCIsIHRydWUpICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1hdHJpeFxyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWVudSh0eHRBcnIsIG5hbWVBcnIpeyAgLy/RgdC+0LfQtNCw0LXQvCDQs9C70LDQstC90L7QtSDQvNC10L3RjlxyXG4gIHZhciBtZW51ID0gW107XHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBhbW91bnRzID0gdHh0QXJyLmxlbmd0aDtcclxuICBcclxuICB2YXIgX2ZvbnRzaXplID0gXCIyOFwiO1xyXG4gIHZhciBfeCA9IEMuV0lEVEgvMi0zMDAvMjtcclxuICB2YXIgX3kgPSAoQy5IRUlHSFQvMikgLSAoODUqYW1vdW50cy8yKSArIDg1OyBcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbW91bnRzOyBpKyspe1xyXG4gICAgbWVudS5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzBdLCBfeCwgX3kraSo4NSwgMzAwLCA2MCwgdHh0W2ldLCBuYW1lc1tpXSwgX2ZvbnRzaXplLCA4MyApICk7XHJcbiAgICBtZW51W2ldLmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syMV07XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1lbnU7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXaW5Qb3BVcCgpeyAvL9GB0L7Qt9C00LDQtdC8INC/0L7QsdC10LTQvdGD0Y4g0LLRgdC/0LvQu9GL0LLQsNGI0LrRg1xyXG5cclxuICB2YXIgd2luUG9wQkcgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbMTZdLCBDLldJRFRILzItMzIwLzIsIEMuSEVJR0hULzItMjAwLzIsIDMyMCwgMjAwKTtcclxuICB2YXIgYlBvcEV4aXQgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzEyXSwgd2luUG9wQkcueCszMCwgIHdpblBvcEJHLnkrd2luUG9wQkcuaC01MCwgODAsIDY1LCBcIlwiLCBcInBvcF9leGl0XCIsIDAgKTtcclxuICBiUG9wRXhpdC5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjZdO1xyXG4gIHZhciBiUG9wTmV4dCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTVdLCB3aW5Qb3BCRy54KzMwKzExMCs4MCwgIHdpblBvcEJHLnkrd2luUG9wQkcuaC01MCwgODAsIDY1LCBcIlwiLCBcInBvcF9uZXh0XCIsIDAgKTtcclxuICBiUG9wTmV4dC5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjldO1xyXG4gIHZhciB3aW5UZXh0ID0gbmV3IEJ1dHRvbiggQy5XSURUSC8yLTkwLzIsIHdpblBvcEJHLnkrMTUsIDkwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMIE5cIiwgXCJ3aW5fdGV4dFwiLCAzMCwgXCJCdWNjYW5lZXJcIiApO1xyXG4gIHZhciB3aW5UZXh0XzIgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMisxMCwgd2luUG9wQkcueSs4MCwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0J/QoNCe0JnQlNCV0J0hXCIsIFwid2luX3RleHRfMlwiLCA1MCwgXCJhWlpfVHJpYnV0ZV9Cb2xkXCIgKTtcclxuXHJcbiAgd2luVGV4dC50eHRDb2xvciA9IFwiI0Q5QzQyNVwiO1xyXG5cclxuICB2YXIgd2luUG9wVXAgPSBbXTtcclxuICB3aW5Qb3BVcC5wdXNoKHdpblBvcEJHLCBiUG9wRXhpdCwgYlBvcE5leHQsIHdpblRleHQsIHdpblRleHRfMik7XHJcblxyXG4gIHJldHVybiB3aW5Qb3BVcDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVBhdXNlUG9wVXAoKXsgIC8v0YHQvtC30LTQsNC10Lwg0L/QsNGD0Lcg0LLRgdC/0LvRi9Cy0LDRiNC60YNcclxuXHJcbiAgdmFyIHBhdXNlUG9wVXAgPSBbXTtcclxuICB2YXIgYmdQYXVzZSA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxM10sIEMuV0lEVEgvMi0zMDAvMiwgQy5IRUlHSFQvMi0yMDcvMiwgMzAwLCAyMDcpO1xyXG4gIHZhciBiUmV0dXJuID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMF0sIGJnUGF1c2UueCsxOTAsICBiZ1BhdXNlLnktMjUsIDYzLCA1NywgXCJcIiwgXCJyZXR1cm5cIiwgMCApO1xyXG4gIGJSZXR1cm4uaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzI0XTtcclxuICB2YXIgYkV4aXRUb01lbnUgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzEyXSwgIGJnUGF1c2UueCs1MCwgIGJnUGF1c2UueStiZ1BhdXNlLmgtNTAsIDg1LCA3MCwgXCJcIiwgXCJleGl0XCIsIDAgKTtcclxuICBiRXhpdFRvTWVudS5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjZdO1xyXG4gIHZhciBiUmVzdGFydCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTFdLCAgYmdQYXVzZS54KzUwKzMwKzg1LCAgYmdQYXVzZS55K2JnUGF1c2UuaC01MCwgODUsIDcwLCBcIlwiLCBcInJlc3RhcnRcIiwgMCApO1xyXG4gIGJSZXN0YXJ0LmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syNV07XHJcbiAgdmFyIHBhdXNlVGV4dCA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxNF0sIGJnUGF1c2UueCArIGJnUGF1c2Uudy8yIC0gMTUwLzIsIGJnUGF1c2UueSArIGJnUGF1c2UuaC8yIC0gMTAwLzIsIDE1MCwgMTAwKTtcclxuXHJcbiAgcGF1c2VQb3BVcC5wdXNoKGJnUGF1c2UsIGJSZXR1cm4sIGJFeGl0VG9NZW51LCBiUmVzdGFydCwgcGF1c2VUZXh0KTtcclxuXHJcbiAgcmV0dXJuIHBhdXNlUG9wVXA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVMZXZlbHNCdXR0b25zKGxldmVsc19jb3VudCl7IC8v0YHQvtC30LTQsNC10Lwg0LrQvdC+0L/QutC4INCyINCy0YvQsdC+0YDQtSDRg9GA0L7QstC90Y9cclxuXHJcbiAgdmFyIGJMZXZlbHNCdXR0b25zID0gW107XHJcbiAgdmFyIGogPSAwLCBkeSA9IDg1LCBkeCA9IDA7XHJcblxyXG4gIGZvciAoIGk9MDsgaSA8IGxldmVsc19jb3VudDsgaSsrKXtcclxuICAgIGR4ID0gOCtqKigxMDArMTUpO1xyXG5cclxuICAgIGJMZXZlbHNCdXR0b25zLnB1c2goIG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTddLCBkeCwgZHksIDEwMCwgMTAwLCBpKzEsIFwibGV2ZWxfXCIrKGkrMSksIDM1ICkgKTtcclxuICAgIGJMZXZlbHNCdXR0b25zW2ldLmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syN107XHJcblxyXG4gICAgaisrO1xyXG5cclxuICAgIGlmICggZHggPiBDLldJRFRILTExNSApe1xyXG4gICAgICBkeSArPSAoMTI1KTtcclxuICAgICAgaiA9IDA7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBiTGV2ZWxzQnV0dG9ucztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUxldmVsc0Zvb3RlcigpeyAgLy/RgdC+0LfQtNCw0LXQvCDRhNGD0YLQtdGAINCyINCy0YvQsdC+0YDQtSDRg9GA0L7QstC90Y9cclxuXHJcbiAgdmFyIGxldmVsc0Zvb3RlciA9IFtdO1xyXG5cclxuICB2YXIgYlByZXYgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE5XSwgMjAsIEMuSEVJR0hULTEwLTY3LCA0MCwgNjcsIFwiXCIsIFwicHJldlwiLCAwICk7XHJcbiAgdmFyIGJOZXh0ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxOF0sIEMuV0lEVEgtMjAtNDAsIEMuSEVJR0hULTEwLTY3LCA0MCwgNjcsIFwiXCIsIFwibmV4dFwiLCAwICk7XHJcbiAgdmFyIGJUb01lbnUgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzIwXSwgQy5XSURUSC8yIC0gMzIwLzIsIEMuSEVJR0hULTEwLTY3LCAzMjAsIDY3LCBcItCS0LXRgNC90YPRgtGM0YHRjyDQsiDQvNC10L3RjlwiLCBcInRvX21lbnVcIiwgMjUgKTtcclxuICBiVG9NZW51LmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syOF07XHJcbiAgYlRvTWVudS50eHRDb2xvciA9IFwiIzAwMDA0NlwiO1xyXG5cclxuICBsZXZlbHNGb290ZXIucHVzaChiUHJldixiTmV4dCxiVG9NZW51KTtcclxuXHJcbiAgcmV0dXJuIGxldmVsc0Zvb3RlcjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVBsYXllcigpeyAgLy/RgdC+0LfQtNCw0LXQvCDQuNCz0YDQvtC60LAg0YEg0YPQvdC40LrQsNC70YzQvdGL0LzQuCDQvNC10YLQvtC00LDQvNC4XHJcblxyXG4gIHZhciBwbGF5ZXIgPSBuZXcgUGxheWFibGUocmVzLmFyckltYWdlc1s5XSwwLDAsNTAsNTApO1xyXG4gIHBsYXllci5kaXJlY3Rpb24gPSBmYWxzZTtcclxuICBwbGF5ZXIuaXNNb3ZlID0gZmFsc2U7XHJcblxyXG4gIHBsYXllci5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBpZih0aGlzLmlzTW92ZSl7XHJcbiAgICAgIHRoaXMuZHJhd0FuaW1hdGlvbigzLCAyLCB0aGlzLmRpcmVjdGlvbik7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5kcmF3RnJhbWUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLmRyYXdBbmltYXRpb24gPSBmdW5jdGlvbihmcmFtZXMsIGRlbGF5LCBhbmdsZSl7XHJcblxyXG4gICAgdGhpcy5pbWcuY2FuRHJhdyA9ICggdGhpcy5pbWcuY2FuRHJhdyA9PT0gdW5kZWZpbmVkICkgPyAxIDogdGhpcy5pbWcuY2FuRHJhdztcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICB2YXIgX2R4ID0gdGhpcy54K0MuUERORyArIHRoaXMudyAvIDI7XHJcbiAgICAgIHZhciBfZHkgPSB0aGlzLnkrNzErQy5QRE5HICsgdGhpcy5oIC8gMjtcclxuICAgICAgYW5nbGUgPSBhbmdsZSAqIChNYXRoLlBJLzE4MCk7XHJcbiAgICAgIGNudnMuY3R4LnNhdmUoKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKF9keCxfZHkpO1xyXG4gICAgICBjbnZzLmN0eC5yb3RhdGUoYW5nbGUpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoLV9keCwtX2R5KTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRoaXMuaW1nLmNhbkRyYXcgPT0gMSl7XHJcbiAgICAgIGlmICh0aGlzLmltZy5jb3VudCA9PSBmcmFtZXMpIHRoaXMuaW1nLmNvdW50ID0gMTtcclxuXHJcbiAgICAgIHRoaXMuaW1nLmNhbkRyYXcgPSAwO1xyXG4gICAgICB0aGlzLmltZy5jb3VudCA9IHRoaXMuaW1nLmNvdW50ICsgMSB8fCAxO1xyXG5cclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgIHBsYXllci5pbWcuY2FuRHJhdyA9IDE7XHJcbiAgICAgIH0sIDEwMDAvKGRlbGF5KjIpICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjbnZzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDUwKih0aGlzLmltZy5jb3VudC0xKSwgMCwgdGhpcy53LCB0aGlzLmgsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoLUMuUERORywgLSg3MStDLlBETkcpKTtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICBjbnZzLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5kcmF3RnJhbWUgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIHZhciBhbmdsZSA9IHRoaXMuZGlyZWN0aW9uIHx8IDA7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgdmFyIF9keCA9IHRoaXMueCtDLlBETkcgKyB0aGlzLncgLyAyO1xyXG4gICAgICB2YXIgX2R5ID0gdGhpcy55KzcxK0MuUERORyArIHRoaXMuaCAvIDI7XHJcbiAgICAgIGFuZ2xlID0gYW5nbGUgKiAoTWF0aC5QSS8xODApO1xyXG4gICAgICBjbnZzLmN0eC5zYXZlKCk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZShfZHgsX2R5KTtcclxuICAgICAgY252cy5jdHgucm90YXRlKGFuZ2xlKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKC1fZHgsLV9keSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjbnZzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHRoaXMudywgdGhpcy5oLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKC1DLlBETkcsIC0oNzErQy5QRE5HKSk7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgY252cy5jdHgucmVzdG9yZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuc2V0RGlyZWN0aW9uID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBwbGF5ZXI7XHJcbn07XHJcblxyXG5cclxuXHJcbi8vbWVudVxyXG52YXIgbG9nbyA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMV0sIEMuV0lEVEgvMi00NTAvMiwgMjAsIDQ1MCwgMTUwLCBcIlwiLCBcImxvZ29cIiwgMCApO1xyXG52YXIgbWVudSA9IGNyZWF0ZU1lbnUoW1wi0JjQs9GA0LDRgtGMXCIsIFwi0KPRgNC+0LLQvdC4XCIsIFwi0J3QsNGB0YLRgNC+0LnQutC4XCJdLFtcInBsYXlcIiwgXCJjaGFuZ2VfbGV2ZWxcIiwgXCJvcHRpb25zXCJdKTtcclxuXHJcblxyXG4vL2JhY2tncm91bmQgXHJcbnZhciBtYXRyaXggPSBjcmVhdGVNYXRyaXhCRygpOyAvL2JnINGD0YDQvtCy0L3Rj1xyXG52YXIgYmdMZXZlbCA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1s4XSwgMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQgKTtcclxudmFyIGJnT3BhY2l0eSA9IG5ldyBSZWN0KDAsIDAsIEMuV0lEVEgsIEMuSEVJR0hULCBcInJnYmEoMCwgMCwgMCwgMC41KVwiKTtcclxuXHJcblxyXG4vL2dhbWUgaGVhZGVyXHJcbnZhciBoZWFkZXIgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbMl0sIDAsIDAsIEMuV0lEVEgsIDcxK0MuUERORyApO1xyXG52YXIgYkZ1bGxTY3IgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzNdLCBDLldJRFRILTQ1LTIwLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDUvMiwgNDUsIDQ1LCBcIlwiLCBcImZ1bGxTY3JcIiwgMCApO1xyXG5iRnVsbFNjci5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjJdO1xyXG52YXIgc3RvcFdhdGNoID0gbmV3IEJ1dHRvbiggMTAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCAxMjAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwiMDAgOiAwMCA6IDAwXCIsIFwic3RvcHdhdGNoXCIsIDI1LCBcImRpdGVkXCIgKTtcclxudmFyIGJQYXVzZSA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbNF0sIEMuV0lEVEgtNDUtNy1iRnVsbFNjci53LTIwLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDUvMiwgNDUsIDQ1LCBcIlwiLCBcInBhdXNlXCIsIDAgKTtcclxuYlBhdXNlLmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syM107XHJcbnZhciBjdXJyTGV2ZWwgPSBuZXcgQnV0dG9uKCAoc3RvcFdhdGNoLngrc3RvcFdhdGNoLncrYlBhdXNlLngpLzItMTQwLzIsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCAxNDAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0KPRgNC+0LLQtdC90YxcIiwgXCJjdXJyX2xldmVsXCIsIDI1LCBcImNhcHR1cmVfaXRcIiApO1xyXG5cclxuXHJcbi8vY2hhbmdlIGxldmVsXHJcbnZhciBsZXZlbHNIZWFkZXIgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzJdLCAwLCAwLCBDLldJRFRILCA3MStDLlBETkcsIFwi0JLRi9Cx0L7RgCDRg9GA0L7QstC90Y9cIiwgXCJsZXZlbHNfaGVhZGVyXCIsIDI1ICk7XHJcbnZhciBiTGV2ZWxzQnV0dG9ucyA9IGNyZWF0ZUxldmVsc0J1dHRvbnMoNSk7XHJcbnZhciBsZXZlbHNGb290ZXIgPSBjcmVhdGVMZXZlbHNGb290ZXIoKTtcclxuXHJcblxyXG4vL3dpbiBwb3AtdXBcclxudmFyIHdpblBvcFVwID0gY3JlYXRlV2luUG9wVXAoKTtcclxuXHJcblxyXG4vL3BhdXNlIHBvcC11cFxyXG52YXIgcGF1c2VQb3BVcCA9IGNyZWF0ZVBhdXNlUG9wVXAoKTtcclxuXHJcblxyXG4vL3BsYXlhYmxlIG9ialxyXG52YXIgcGwgPSBjcmVhdGVQbGF5ZXIoKTtcclxudmFyIGJveCA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzZdLDAsMCw1MCw1MCk7IC8v0LHQvtC60YFcclxudmFyIGRvb3IgPSBuZXcgUGxheWFibGUocmVzLmFyckltYWdlc1s3XSwwLDAsNTAsNTApOyAvL9C00LLQtdGA0YxcclxudmFyIHdhbGxzID0gW107IC8v0YHRgtC10L3RiyDQvdCwINGD0YDQvtCy0L3QtSwg0LfQsNC/0L7Qu9C90Y/QtdGC0YHRjyDQstGL0LHRgNCw0L3QvdGL0Lwg0YPRgNC+0LLQvdC10LwuXHJcblxyXG5cclxuLy92aWRlb3NcclxudmFyIGFuaW1hdGVCZyA9IG5ldyBWaWRlbygwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgcmVzLmFyclZpZGVvc1swXSk7XHJcbnZhciB2aWRlb0JnTGV2ZWxzID0gbmV3IFZpZGVvKDAsIDAsIEMuV0lEVEgsIEMuSEVJR0hULCByZXMuYXJyVmlkZW9zWzFdKTtcclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RzID0ge1xyXG5cclxuICBtYXRyaXggOiBtYXRyaXgsXHJcbiAgbG9nbyA6IGxvZ28sXHJcbiAgbWVudSA6IG1lbnUsXHJcbiAgaGVhZGVyIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCA6IHN0b3BXYXRjaCxcclxuICBiUGF1c2UgOiBiUGF1c2UsXHJcbiAgYkZ1bGxTY3IgOiBiRnVsbFNjcixcclxuICBwbCA6IHBsLFxyXG4gIGJveCA6IGJveCxcclxuICBkb29yIDogZG9vcixcclxuICB3YWxscyA6IHdhbGxzLFxyXG4gIGJnTGV2ZWwgOiBiZ0xldmVsLFxyXG4gIHdpblBvcFVwIDogd2luUG9wVXAsXHJcbiAgcGF1c2VQb3BVcCA6IHBhdXNlUG9wVXAsXHJcbiAgYmdPcGFjaXR5IDogYmdPcGFjaXR5LFxyXG4gIGN1cnJMZXZlbCA6IGN1cnJMZXZlbCxcclxuICBsZXZlbHNIZWFkZXIgOiBsZXZlbHNIZWFkZXIsXHJcbiAgYkxldmVsc0J1dHRvbnMgOiBiTGV2ZWxzQnV0dG9ucyxcclxuICBsZXZlbHNGb290ZXIgOiBsZXZlbHNGb290ZXIsXHJcbiAgYW5pbWF0ZUJnIDogYW5pbWF0ZUJnLFxyXG4gIHZpZGVvQmdMZXZlbHMgOiB2aWRlb0JnTGV2ZWxzLFxyXG4gIFBSRUxPQURFUiA6IG5ldyBSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hULFwiYmxhY2tcIilcclxuICBcclxufTtcclxuIiwidmFyIHJlc291cnNlcyA9IHtcclxuICBpbWFnZXMgOiBmYWxzZSxcclxuICB2aWRlbyA6IGZhbHNlLFxyXG5cclxuICBhcmVMb2FkZWQgOiBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHRoaXMudmlkZW8gJiYgdGhpcy5pbWFnZXNcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlkZW8oYXJyU3Jjc09mVmlkZW8pe1xyXG5cclxuICB2YXIgYXJyVmlkZW9zID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZlZpZGVvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgIHZpZGVvLnNyYyA9IGFyclNyY3NPZlZpZGVvW2ldO1xyXG4gICAgdmlkZW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGxvYWRDb3VudCsrO1xyXG4gICAgICB2aWRlby5sb29wID0gdHJ1ZTtcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMudmlkZW8gPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBhcnJWaWRlb3MucHVzaCh2aWRlbyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJWaWRlb3M7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2VzKGFyclNyY3NPZkltYWdlcyl7XHJcblxyXG4gIHZhciBhcnJJbWFnZXMgPSBbXTsgXHJcbiAgdmFyIGNvdW50ID0gYXJyU3Jjc09mSW1hZ2VzLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgaW1nLnNyYyA9IGFyclNyY3NPZkltYWdlc1tpXTtcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICBsb2FkQ291bnQrKztcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMuaW1hZ2VzID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGFyckltYWdlcy5wdXNoKGltZyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJJbWFnZXM7XHJcbn07XHJcblxyXG52YXIgYXJyVmlkZW9zID0gbG9hZFZpZGVvKFtcclxuICBcInZpZGVvL2JnLm1wNFwiLFxyXG4gIFwidmlkZW8vTGlnaHRtaXJyb3IubXA0XCJcclxuXSk7XHJcblxyXG52YXIgYXJySW1hZ2VzID0gbG9hZEltYWdlcyhbXHJcbiAgXCJpbWcvbWVudV9fYnV0dG9uLW1lbnUuc3ZnXCIsICAgICAgICAgICAgICAgIC8vMCBcclxuICBcImltZy9tZW51X19sb2dvLnBuZ1wiLCAgICAgICAgICAgICAgICAgICAgICAgLy8xXHJcblxyXG4gIFwiaW1nL2dhbWVfX2JnLWhlYWRlci5zdmdcIiwgICAgICAgICAgICAgICAgICAvLzIgXHJcbiAgXCJpbWcvZ2FtZV9fYnV0dG9uLWZ1bGxzY3JlZW4uc3ZnXCIsICAgICAgICAgIC8vMyBcclxuICBcImltZy9nYW1lX19idXR0b24tcGF1c2Uuc3ZnXCIsICAgICAgICAgICAgICAgLy80IFxyXG4gIFwiaW1nL2dhbWVfX3dhbGwuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgICAvLzUgXHJcbiAgXCJpbWcvZ2FtZV9fY3J5c3RhbGwuc3ZnXCIsICAgICAgICAgICAgICAgICAgIC8vNiBcclxuICBcImltZy9nYW1lX19wb3J0YWwuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgLy83IFxyXG4gIFwiaW1nL2dhbWVfX2dyb3VuZC5qcGdcIiwgICAgICAgICAgICAgICAgICAgICAvLzggXHJcbiAgJ2ltZy9nYW1lX19wbGF5ZXIucG5nJywgICAgICAgICAgICAgICAgICAgICAvLzkgXHJcblxyXG4gIFwiaW1nL3BhdXNlX19idXR0b24tY2xvc2Uuc3ZnXCIsICAgICAgICAgICAgICAvLzEwXHJcbiAgXCJpbWcvcGF1c2VfX2J1dHRvbi1yZXN0YXJ0LnN2Z1wiLCAgICAgICAgICAgIC8vMTFcclxuICBcImltZy9wYXVzZV9fYnV0dG9uLXRvTWVudS5zdmdcIiwgICAgICAgICAgICAgLy8xMlxyXG4gIFwiaW1nL3BhdXNlX19iZy5zdmdcIiwgICAgICAgICAgICAgICAgICAgICAgICAvLzEzXHJcbiAgXCJpbWcvcGF1c2VfX3RleHQuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgIC8vMTRcclxuXHJcbiAgXCJpbWcvd2luX19idXR0b24tbmV4dC5zdmdcIiwgICAgICAgICAgICAgICAgIC8vMTVcclxuICBcImltZy93aW5fX2JnLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8xNlxyXG5cclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi1sZXZlbHMuc3ZnXCIsICAgICAgICAgICAgLy8xN1xyXG4gIFwiaW1nL2xldmVsc19fYnV0dG9uLW5leHQuc3ZnXCIsICAgICAgICAgICAgICAvLzE4XHJcbiAgXCJpbWcvbGV2ZWxzX19idXR0b24tcHJldi5zdmdcIiwgICAgICAgICAgICAgIC8vMTlcclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi10b01lbnUuc3ZnXCIsICAgICAgICAgICAgLy8yMFxyXG5cclxuICBcImltZy9ob3ZlcnMvbWVudV9fYnV0dG9uLW1lbnVfaG92ZXIuc3ZnXCIsICAgICAgIC8vMjFcclxuICBcImltZy9ob3ZlcnMvZ2FtZV9fYnV0dG9uLWZ1bGxzY3JlZW5faG92ZXIuc3ZnXCIsIC8vMjJcclxuICBcImltZy9ob3ZlcnMvZ2FtZV9fYnV0dG9uLXBhdXNlX2hvdmVyLnN2Z1wiLCAgICAgIC8vMjNcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi1jbG9zZV9ob3Zlci5zdmdcIiwgICAgIC8vMjRcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi1yZXN0YXJ0X2hvdmVyLnN2Z1wiLCAgIC8vMjVcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi10b01lbnVfaG92ZXIuc3ZnXCIsICAgIC8vMjZcclxuICBcImltZy9ob3ZlcnMvbGV2ZWxzX19idXR0b24tbGV2ZWxzX2hvdmVyLnN2Z1wiLCAgIC8vMjdcclxuICBcImltZy9ob3ZlcnMvbGV2ZWxzX19idXR0b24tdG9NZW51X2hvdmVyLnN2Z1wiLCAgIC8vMjhcclxuICBcImltZy9ob3ZlcnMvd2luX19idXR0b24tbmV4dF9ob3Zlci5zdmdcIiAgICAgICAgIC8vMjlcclxuXHJcbl0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuICByZXNvdXJzZXMgOiByZXNvdXJzZXMsXHJcblxyXG4gIGFyclZpZGVvcyA6IGFyclZpZGVvcyxcclxuXHJcbiAgYXJySW1hZ2VzIDogYXJySW1hZ2VzICBcclxuXHJcbn07XHJcblxyXG5cclxuIiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBnYW1lID0gcmVxdWlyZSgnLi9fZ2FtZUxvb3BzLmpzJyk7XHJcblxyXG52YXIgcGF1c2UgPSAwO1xyXG52YXIgYmVnaW5UaW1lID0gMDtcclxudmFyIGN1cnJlbnRUaW1lID0gMDtcclxudmFyIHVwVGltZVRPO1xyXG5cclxuZnVuY3Rpb24gdXBUaW1lKGNvdW50RnJvbSkge1xyXG5cdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG5cdHZhciBkaWZmZXJlbmNlID0gKG5vdy1jb3VudEZyb20gKyBjdXJyZW50VGltZSk7XHJcblxyXG5cdHZhciBob3Vycz1NYXRoLmZsb29yKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSkvKDYwKjYwKjEwMDApKjEpO1xyXG5cdHZhciBtaW5zPU1hdGguZmxvb3IoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKS8oNjAqMTAwMCkqMSk7XHJcblx0dmFyIHNlY3M9TWF0aC5mbG9vcigoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKSUoNjAqMTAwMCkpLzEwMDAqMSk7XHJcblxyXG5cdGhvdXJzID0gKCBob3VycyA8IDEwKSA/IFwiMFwiK2hvdXJzIDogaG91cnM7XHJcblx0bWlucyA9ICggbWlucyA8IDEwKSA/IFwiMFwiK21pbnMgOiBtaW5zO1xyXG5cdHNlY3MgPSAoIHNlY3MgPCAxMCkgPyBcIjBcIitzZWNzIDogc2VjcztcclxuXHJcblx0by5zdG9wV2F0Y2gudHh0ID0gaG91cnMrXCIgOiBcIittaW5zK1wiIDogXCIrc2VjcztcclxuXHJcblx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR1cFRpbWVUTz1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHVwVGltZShjb3VudEZyb20pOyB9LDEwMDAvNjApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRzdGFydCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly8gaWYgKGdhbWUuc3RhdHVzID09ICdnYW1lJyB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibWVudVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJwYXVzZVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJsZXZlbHNcIikge1xyXG5cdFx0XHR1cFRpbWUobmV3IERhdGUoKSk7XHJcblx0XHRcdHZhciBub3dUID0gbmV3IERhdGUoKTtcclxuXHRcdFx0YmVnaW5UaW1lID0gbm93VC5nZXRUaW1lKCk7XHJcblx0XHQvLyB9IGVsc2Uge1xyXG5cdFx0Ly8gXHR0aGlzLnJlc2V0KCk7XHJcblx0XHQvLyB9O1xyXG5cdH0sXHJcblxyXG5cdHJlc2V0IDogZnVuY3Rpb24oKSB7XHJcblx0XHRjdXJyZW50VGltZSA9IDA7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cclxuXHRcdG8uc3RvcFdhdGNoLnR4dCA9IFwiMDAgOiAwMCA6IDAwXCI7XHJcblx0XHQvLyB0aGlzLnN0YXJ0KCk7XHJcblx0fSxcclxuXHJcblx0cGF1c2VUaW1lciA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY3VyRGF0YSA9IG5ldyBEYXRlKCk7XHJcblx0XHRjdXJyZW50VGltZSA9IGN1ckRhdGEuZ2V0VGltZSgpIC0gYmVnaW5UaW1lICsgY3VycmVudFRpbWU7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdH1cclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b24gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvciwgdHh0LCBuYW1lLCBmU2l6ZSwgZm9udEZhbSl7XHJcbiAgXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcbiAgdGhpcy50eHRDb2xvciA9IFwid2hpdGVcIjtcclxuICB0aGlzLmZvbnRGYW0gPSBmb250RmFtIHx8IFwiQXJpYWxcIjtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24obm9DZW50ZXIsIHBhZGQpe1xyXG5cclxuICAgIHZhciBfcGFkZCA9IHBhZGQgfHwgNTtcclxuICAgIHZhciBfeCA9ICggIW5vQ2VudGVyICkgPyB0aGlzLngrdGhpcy53LzIgOiB0aGlzLngrX3BhZGQ7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy50eHRDb2xvcjtcclxuICAgIGN0eC50ZXh0QWxpZ24gPSAoICFub0NlbnRlciApID8gXCJjZW50ZXJcIiA6IFwic3RhcnRcIjtcclxuICAgIGN0eC5mb250ID0gdGhpcy5mU2l6ZSArICdweCAnK3RoaXMuZm9udEZhbTtcclxuICAgIGN0eC50ZXh0QmFzZWxpbmU9XCJtaWRkbGVcIjsgXHJcbiAgICBjdHguZmlsbFRleHQodGhpcy50eHQsIF94LCB0aGlzLnkrdGhpcy5oLzIpO1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2UgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgsIG9wYWNpdHkpe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMub3BhY2l0eSA9IG9wYWNpdHkgfHwgMTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguZ2xvYmFsQWxwaGEgPSB0aGlzLm9wYWNpdHk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG5cclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWdCdXR0b24gPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgsIHR4dCwgbmFtZSwgZlNpemUsIHNldENlbnRlciwgbm9DZW50ZXIsIHBhZGQpe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG4gIHRoaXMudHh0Q29sb3IgPSBcIndoaXRlXCI7XHJcbiAgdGhpcy5zZXRDZW50ZXIgPSBzZXRDZW50ZXIgfHwgdGhpcy54O1xyXG4gIHRoaXMubm9DZW50ZXIgPSBub0NlbnRlciB8fCBmYWxzZTtcclxuICB0aGlzLnBhZGQgPSBwYWRkIHx8IDU7XHJcbiAgdGhpcy5ob3ZlckltZyA9IGZhbHNlO1xyXG5cclxuICB2YXIgbWV0cmljcyA9IGN0eC5tZWFzdXJlVGV4dCh0aGlzLnR4dCkud2lkdGg7XHJcbiAgdmFyIF94ID0gKCAhdGhpcy5ub0NlbnRlciApID8gdGhpcy5zZXRDZW50ZXIrdGhpcy53LzIgOiB0aGlzLngrdGhpcy5wYWRkO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMudHh0Q29sb3I7XHJcbiAgICBjdHgudGV4dEFsaWduID0gKCAhdGhpcy5ub0NlbnRlciApID8gXCJjZW50ZXJcIiA6IFwic3RhcnRcIjtcclxuICAgIGN0eC5mb250ID0gdGhpcy5mU2l6ZSArICdweCBjYXB0dXJlX2l0JztcclxuICAgIGN0eC50ZXh0QmFzZWxpbmU9XCJtaWRkbGVcIjsgXHJcbiAgICBjdHguZmlsbFRleHQodGhpcy50eHQsIF94LCB0aGlzLnkrdGhpcy5oLzIpO1xyXG4gIH07XHJcblxyXG4gIHZhciBfaW1nID0gZmFsc2U7IC8v0LHRg9C00LXRgiDRhdGA0LDQvdC40YLRjCDQstGA0LXQvNC10L3QvdC+INC60LDRgNGC0LjQvdC60YMg0YHRgtCw0L3QtNCw0YDRgtC90YPRji5cclxuXHJcbiAgdGhpcy5ob3ZlciA9IGZ1bmN0aW9uKGRyYXcpe1xyXG5cclxuICAgIC8vIGlmICh0aGlzLmhvdmVySW1nKSB7ICAgICAgICAgICAgICAgICAgICAgLy/QtdGB0LvQuCDQvdCw0LLQtdC70Lgg0Lgg0L/QtdGA0LXQtNCw0LvQuCDQutCw0YDRgtC40L3QutGDINC00LvRjyDRjdGC0L7Qs9C+LCDRgtC+XHJcbiAgICAvLyAgIGlmICghX2ltZykgX2ltZyA9IHRoaXMuaW1nOyAgICAgICAgICAgIC8vINC10YHQu9C4INC10YnQtSDQvdC1INCx0YvQu9CwINGB0L7RhdGA0LDQvdC10L3QsCDRgdGC0LDQvdC00LDRgNGC0L3QsNGPINC60LDRgNGC0LjQvdC60LAsINGC0L4g0YHQvtGF0YDQsNC90Y/QtdC8INC4Li5cclxuICAgIC8vICAgdGhpcy5pbWcgPSB0aGlzLmhvdmVySW1nOyAgICAgICAgICAgICAgLy8uLtC90L7QstC+0Lkg0LHRg9C00LXRgiDQstGL0LLQvtC00LjRgtGB0Y8g0L/QtdGA0LXQtNCw0L3QvdCw0Y9cclxuICAgIC8vICAgY252LnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiOyAgICAgICAgICAvL9C4INC60YPRgNGB0L7RgCDQsdGD0LTQtdGCINC/0L7QuNC90YLQtdGAXHJcbiAgICAvLyB9IGVsc2UgaWYgKCBfaW1nICYmIF9pbWcgIT0gdGhpcy5pbWcpeyAgIC8v0LjQvdCw0YfQtSDQtdGB0LvQuCDQsdGL0LvQsCDRgdC+0YXRgNCw0L3QtdC90LAg0LrQsNGA0YLQuNC90LrQsCDQuCDQvdC1INC+0L3QsCDQsiDQtNCw0L3QvdGL0Lkg0LzQvtC80LXQvdGCINC+0YLRgNC40YHQvtCy0YvQstCw0LXRgtGB0Y8sINGC0L5cclxuICAgIC8vICAgdGhpcy5pbWcgPSBfaW1nOyAgICAgICAgICAgICAgICAgICAgICAgLy/QstC+0LfQstGA0LDRidCw0LXQvCDRgdGC0LDQvdC00LDRgNGCINC60LDRgNGC0LjQvdC60YMg0L3QsCDQvNC10YHRgtC+XHJcbiAgICAvLyAgIGNudi5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjsgICAgICAgICAgLy/QuCDQutGD0YDRgdC+0YAg0LTQtdC70LDQtdC8INGB0YLQsNC90LTQsNGA0YLQvdGL0LxcclxuICAgIC8vIH07XHJcblxyXG4gICAgaWYgKGRyYXcgJiYgdGhpcy5ob3ZlckltZykgeyAgICAgICAgICAgICAvL9C10YHQu9C4INC/0LXRgNC10LTQsNC70Lgg0LjRgdGC0LjQvdGDINC4INGF0L7QstC10YAg0YMg0Y3RgtC+0LPQviDQvtCx0YrQtdC60YLQsCDQtdGB0YLRjCwg0YLQviDQvtGC0YDQuNGB0L7QstGL0LLQsNC10Lwg0YXQvtCy0LXRgFxyXG4gICAgICBpZiAoIV9pbWcpIF9pbWcgPSB0aGlzLmltZzsgICAgICAgICAgICAvLyDQtdGB0LvQuCDQtdGJ0LUg0L3QtSDQsdGL0LvQsCDRgdC+0YXRgNCw0L3QtdC90LAg0YHRgtCw0L3QtNCw0YDRgtC90LDRjyDQutCw0YDRgtC40L3QutCwLCDRgtC+INGB0L7RhdGA0LDQvdGP0LXQvCDQuC4uXHJcbiAgICAgIHRoaXMuaW1nID0gdGhpcy5ob3ZlckltZzsgICAgICAgICAgICAgIC8vLi7QvdC+0LLQvtC5INCx0YPQtNC10YIg0LLRi9Cy0L7QtNC40YLRgdGPINC/0LXRgNC10LTQsNC90L3QsNGPXHJcbiAgICAgIGNudi5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjsgICAgICAgICAgLy/QuCDQutGD0YDRgdC+0YAg0LHRg9C00LXRgiDQv9C+0LjQvdGC0LXRgFxyXG4gICAgfSBlbHNlIGlmICggX2ltZyAmJiBfaW1nICE9IHRoaXMuaW1nKXsgICAvL9C40L3QsNGH0LUg0LXRgdC70Lgg0LHRi9C70LAg0YHQvtGF0YDQsNC90LXQvdCwINC60LDRgNGC0LjQvdC60LAg0Lgg0L3QtSDQvtC90LAg0LIg0LTQsNC90L3Ri9C5INC80L7QvNC10L3RgiDQvtGC0YDQuNGB0L7QstGL0LLQsNC10YLRgdGPLCDRgtC+XHJcbiAgICAgIHRoaXMuaW1nID0gX2ltZzsgICAgICAgICAgICAgICAgICAgICAgIC8v0LLQvtC30LLRgNCw0YnQsNC10Lwg0YHRgtCw0L3QtNCw0YDRgiDQutCw0YDRgtC40L3QutGDINC90LAg0LzQtdGB0YLQvlxyXG4gICAgICBjbnYuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7ICAgICAgICAgIC8v0Lgg0LrRg9GA0YHQvtGAINC00LXQu9Cw0LXQvCDRgdGC0LDQvdC00LDRgNGC0L3Ri9C8XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi8uLi9fY29uc3QuanMnKTtcclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQbGF5YWJsZSA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5tb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHN3aXRjaChkaXJlY3Rpb24pe1xyXG4gICAgICBjYXNlIFwidXBcIiA6IFxyXG4gICAgICB0aGlzLnkgLT0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJkb3duXCIgOiBcclxuICAgICAgdGhpcy55ICs9IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwibGVmdFwiIDpcclxuICAgICAgdGhpcy54IC09IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwicmlnaHRcIiA6IFxyXG4gICAgICB0aGlzLnggKz0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi8uLi9fY29uc3QuanMnKTtcclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWN0ID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IsIGlzU3Ryb2tlKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuICB0aGlzLmlzU3Ryb2tlID0gaXNTdHJva2UgfHwgZmFsc2U7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBpZiAoIXRoaXMuaXNTdHJva2UpIHtcclxuICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgY3R4LnN0cm9rZVJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH1cclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi8uLi9fY29uc3QuanMnKVxyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBWaWRlbyA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIHZpZGVvKXtcclxuXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLnZpZGVvID0gdmlkZW87XHJcblxyXG4gIHZhciBzYXZlID0gZmFsc2U7XHJcbiAgdmFyIGJ1ZkNudiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcbiAgdmFyIGJ1ZkN0eCA9IGJ1ZkNudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgYnVmQ252LndpZHRoID0gQy5XSURUSDtcclxuICBidWZDbnYuaGVpZ2h0ID0gQy5IRUlHSFQ7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBpZiAodGhpcy52aWRlbykge1xyXG4gICAgICBpZiAoICFzYXZlICl7XHJcbiAgICAgICAgYnVmQ3R4LmRyYXdJbWFnZSh0aGlzLnZpZGVvLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgICAgIHNhdmUgPSB0cnVlO1xyXG4gICAgICB9O1xyXG4gICAgICBcclxuICAgICAgdGhpcy52aWRlby5wbGF5KCk7XHJcbiAgICAgIGNhbnZhcy5jdHguZHJhd0ltYWdlKGJ1ZkNudiwgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgICAgY2FudmFzLmN0eC5kcmF3SW1hZ2UodGhpcy52aWRlbywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuXHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi8uLi9fY29uc3QuanMnKTtcclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXYWxsID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuICBcclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyksXHJcblBsYXllYmxlICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9QbGF5YWJsZS5qcycpLFxyXG5XYWxsICAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvV2FsbC5qcycpLFxyXG5JbWdCdXR0b24gPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1nQnV0dG9uLmpzJyksXHJcblZpZGVvICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9WaWRlby5qcycpLFxyXG5CdXR0b24gICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvQnV0dG9uLmpzJyksXHJcblJlY3QgICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9SZWN0LmpzJyksXHJcbkltYWdlICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWFnZS5qcycpLFxyXG5DICAgICAgICAgPSByZXF1aXJlKCcuL19jb25zdC5qcycpLFxyXG5ldmVudHMgICAgPSByZXF1aXJlKCcuL19ldmVudHMuanMnKSxcclxubGV2ZWxzICAgID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyksXHJcbm8gICAgICAgICA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKSxcclxuY252cyAgICAgID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyksXHJcbmtleSBcdCAgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxuXHJcbmVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubG9hZGVyKTtcclxuXHJcblxyXG4vLyDQvdCw0YHRgtGA0L7QudC60LggLSDRiNC+0LEg0YLQsNC8INGD0L/RgNCw0LLQu9GP0YLRjCDRgNCw0LfQvNC10YDQsNC80Lgg0L3QsNCy0LXRgNC90L7QtS4uINGF0Lcg0L/QvtC60LBcclxuXHJcbi8vINC80YPQt9GL0LrRgyDQtNGD0LzQsNGC0YxcclxuLy8g0L/RgNC10LvQvtCw0LTQtdGAINC30LDQv9C40LvQuNGC0YxcclxuXHJcbi8vINGF0LDQudC00LjRgtGMINC60L3QvtC/0LrQuCDQsiDQstGL0LHQvtGA0LUg0YPRgNC+0LLQvdGPIl19
