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

var a = o.audio;
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

  a.player.play();               //озвучка движения
  o.pl.direction = o.pl.isMove = hf.directionIs(direction);
  if ( isNear[direction](o.pl, o.box) && !isBorder[direction](o.box) && !isNear[direction](o.box, o.walls) ){      //если рядом с ящиком и ящик не у границ, двигаем.
    a.crystal.play(1);           //озвучка толкания кристалла
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
              a.button.play();
              a.bgInMenu.stop();
              loadLevel(gameLoops.currentLevel);
              break;

            case "change_level" :
              a.button.play();
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
              a.button.play();
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
          a.button.play();
          a.bgInMenu.stop();
          gameLoops.currentLevel = i+1;
          loadLevel(i+1);
        };
      };
      break;

    case "game" :
      if ( isCursorInButton(x,y,o.bPause) ){
        a.bgInGame.pause();
        a.button.play();
        sw.pauseTimer();
        o.bgOpacity.draw();
        engin.setGameEngine(gameLoops.pause);
      };

      if ( isCursorInButton(x,y,o.bFullScr) ){
        a.button.play();
        ( !fs.isFullScreen ) ? fs.launchFullScreen(canvas.cnv) : fs.canselFullScreen(); 
      };
      break;

    case "win" :

      for ( i in o.winPopUp ){
        if ( isCursorInButton(x,y,o.winPopUp[i]) ){
          if ( o.winPopUp[i].name == "pop_exit" ){
            a.button.play();
            a.bgInGame.stop();
            engin.setGameEngine(gameLoops.menu);
          } else if ( o.winPopUp[i].name == "pop_next" && gameLoops.currentLevel != levels.lvlsCount() ){
            a.button.play();
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
          a.button.play();
          switch (o.pausePopUp[i].name) {

            case "return" :
              sw.start();
              a.bgInGame.play();
              engin.setGameEngine(gameLoops.game);
              break;

            case "restart" :
              sw.reset();
              a.bgInGame.stop();
              loadLevel(gameLoops.currentLevel);
              break;

            case "exit" :
              sw.reset();
              a.bgInGame.stop();
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

var a = o.audio;

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

    if (a.bgInGame.state == "stop") a.bgInGame.play();

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
      o.bgOpacity.draw(); //отрисовка затемнения
      a.win.play();       //озвучка победки
      engin.setGameEngine(gameLoops.win);
    };
  },

  menu : function(){

    gameLoops.status = "menu";

    if (a.bgInMenu.state == "stop") a.bgInMenu.play();

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


//video
var animateBg = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[0]);
var videoBgLevels = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[1]);


//audio
var audio = {

  button   : new Audio(res.arrAudio[0], 0.5),
  win      : new Audio(res.arrAudio[1], 0.5),
  player   : new Audio(res.arrAudio[2]),
  crystal  : new Audio(res.arrAudio[3], 0.1),
  bgInGame : new Audio(res.arrAudio[4], 0.5),
  bgInMenu : new Audio(res.arrAudio[5], 0.5),
};


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
  audio : audio
  
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
  audio  : false,

  areLoaded : function(){
    return this.video && this.images && this.audio
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

function loadAudio(arrSrcsOfAudio){

  var arrAudio = []; 
  var count = arrSrcsOfAudio.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var audio = document.createElement('audio');
    audio.src = arrSrcsOfAudio[i];
    audio.oncanplaythrough = function(){
      loadCount++;
      if ( loadCount == count ) resourses.audio = true;
    };
    
    arrAudio.push(audio);

  };

  return arrAudio;
};

var arrAudio = loadAudio([
  "audio/button-click.mp3",
  "audio/win-audio.mp3",
  "audio/player-move.mp3",
  "audio/crystal-move.mp3",
  "audio/bg-inGame.mp3",
  "audio/bg-inMenu.mp3"
]);

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

  arrImages : arrImages,

  arrAudio  : arrAudio

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
module.exports = Audio = function(audio, volume){ 

	this.a = audio;
	this.a.volume = volume || 1;
	this.state = "stop";

	this.play = function(dontStop){
		if ( this.state == "play" && dontStop ){			//если еще не закончился предыдущий этот звук, то создаем новый звук и воспроизводим его, не мешая воспроизведению предыдущего.
			var a = document.createElement("audio");
			a.src = this.a.src;
			a.volume = this.a.volume;
			a.play();
		} else {
			this.a.play();
			this.state = "play";
			this.a.onended = function(){
				this.state = "stop";
			}.bind(this);
		};
	};

	this.pause = function(){
		this.a.pause();
		this.state = "pause";
	};

	this.stop = function(){
		this.a.pause();
		this.a.currentTime = 0;
		this.state = "stop";
	};

	this.setVolume = function(volume){
		this.a.volume = volume;
	};

};
},{}],15:[function(require,module,exports){
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
},{"./../_canvas.js":1}],16:[function(require,module,exports){
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
},{"./../_canvas.js":1}],17:[function(require,module,exports){
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
},{"./../_canvas.js":1}],18:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],19:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],20:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],21:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],22:[function(require,module,exports){
var engin = require('./_engine.js'),
Audio     = require('./classes/Audio.js'),
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


// музыку громкость отрегулировать, найти че-нить другое для меню
// ховеры запилить в классы.



// настройки - шоб там управлять размерами наверное.. хз пока, музыкой управлять!!!
// шрифт надо подгружать ранее, например отрисовать его в прелойдере невидимо.
// хайдить кнопки в выборе уровня
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Audio.js":14,"./classes/Button.js":15,"./classes/Image.js":16,"./classes/ImgButton.js":17,"./classes/Playable.js":18,"./classes/Rect.js":19,"./classes/Video.js":20,"./classes/Wall.js":21}]},{},[22])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcHJlbG9hZGVyLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3Jlc291cnNlcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19zdG9wd2F0Y2guanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0F1ZGlvLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9CdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0ltYWdlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWdCdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1BsYXlhYmxlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9SZWN0LmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9WaWRlby5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvV2FsbC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2Zha2VfN2VhNDA4ZmYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBjbnYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxudmFyIGN0eCA9IGNudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG5jbnYuc3R5bGUuYm9yZGVyID0gXCIycHggc29saWQgYmxhY2tcIjtcclxuY252LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcclxuY252LndpZHRoID0gQy5XSURUSDtcclxuY252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGNudiA6IGNudixcclxuXHJcblx0Y3R4IDogY3R4XHJcblxyXG59OyIsInZhciBQQUREID0gMTsgXHRcdFx0XHRcdFx0Ly/Qv9Cw0LTQtNC40L3Qsywg0LrQvtGC0L7RgNGL0Lkg0Y8g0YXQvtGH0YMg0YfRgtC+0LHRiyDQsdGL0LssINC80LXQtiDQutCy0LDQtNGA0LDRgtCw0LzQuFxyXG52YXIgV0lEVEggPSBQQUREICsgKFBBREQrNTApKjk7IFx0Ly/RiNC40YDQuNC90LAg0LrQsNC90LLRi1xyXG52YXIgSEVJR0hUID0gMjArUEFERCArIChQQUREKzUwKSoxMDsgICAvL9Cy0YvRgdC+0YLQsCDQutCw0L3QstGLXHJcbnZhciBDTlZfQk9SREVSID0gMjtcclxudmFyIEhFQURFUl9IID0gNzE7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0UERORyA6IFBBREQsXHJcblxyXG5cdFdJRFRIIDogV0lEVEgsXHJcblxyXG5cdEhFSUdIVCA6IEhFSUdIVCxcclxuXHJcblx0Q05WX0JPUkRFUiA6IENOVl9CT1JERVIsXHJcblxyXG5cdEhFQURFUl9IIDogSEVBREVSX0hcclxuXHJcbn07XHJcbiIsIi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8gINC60YDQvtGB0LHRgNCw0YPQt9C10YDQvdC+0LUg0YPQv9GA0LLQu9C10L3QuNC1INGG0LjQutC70LDQvNC4INC40LPRgNGLXHJcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoXCIuL19jYW52YXMuanNcIik7XHJcblxyXG52YXIgZ2FtZUVuZ2luZTtcclxuXHJcbnZhciBuZXh0R2FtZVN0ZXAgPSAoZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0d2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0bW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0b1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0ZnVuY3Rpb24gKGNhbGxiYWNrKXtcclxuXHRcdHNldEludGVydmFsKGNhbGxiYWNrLCAxMDAwLzYwKVxyXG5cdH07XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBnYW1lRW5naW5lU3RlcCgpe1xyXG5cdGdhbWVFbmdpbmUoKTtcclxuXHRuZXh0R2FtZVN0ZXAoZ2FtZUVuZ2luZVN0ZXApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0XHRnYW1lRW5naW5lU3RlcCgpO1xyXG5cdH0sXHJcblxyXG5cdHNldEdhbWVFbmdpbmUgOiBmdW5jdGlvbihjYWxsYmFjayl7XHJcblx0XHRpZiAoIGNhbnZhcy5jbnYuc3R5bGUuY3Vyc29yICE9IFwiZGVmYXVsdFwiICkgY2FudmFzLmNudi5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjsgIC8v0LLRgdC10LPQtNCwINC/0YDQuCDQutC70LjQutC1INC90LAg0LvRjtCx0YPRjiDQutC90L7Qv9C60YMsINGH0YLQviDQsSDQutGD0YDRgdC+0YAg0YHRgtCw0L3QtNCw0YDRgtC40LfQuNGA0L7QstCw0LvRgdGPXHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIG8gICAgICA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIHN3ICAgICA9IHJlcXVpcmUoJy4vX3N0b3B3YXRjaC5qcycpO1xyXG52YXIgbGV2ZWxzID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyk7XHJcbnZhciBlbmdpbiAgPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gICA9IHJlcXVpcmUoJy4vX2dhbWVMb29wcy5qcycpO1xyXG52YXIgaGYgICAgID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIGZzICAgICA9IHJlcXVpcmUoJy4vX2Z1bGxTY3JlZW4uanMnKTtcclxudmFyIEMgICAgICA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBrZXkgICAgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxudmFyIHJlcyAgICA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxudmFyIGEgPSBvLmF1ZGlvO1xyXG52YXIgZ2FtZUxvb3BzID0gZ0xvbztcclxuXHJcbnZhciBpc0JvcmRlciA9IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIg0L7QsdGK0LXQutGCLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvtC80Lkg0LPRgNCw0L3QuNGG0Ysg0LrQsNC90LLRi1xyXG4gIHVwIDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueSA9PSAwO1xyXG4gIH0sXHJcblxyXG4gIGRvd24gOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai55ID09IEMuSEVJR0hUIC0gb2JqLmggLSBDLlBETkcgLSBDLkhFQURFUl9IIC0gQy5QRE5HO1xyXG4gIH0sXHJcblxyXG4gIGxlZnQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai54ID09IDA7XHJcbiAgfSxcclxuXHJcbiAgcmlnaHQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai54ID09IEMuV0lEVEggLSBvYmoudyAtIEMuUERORyAtIEMuUEROR1xyXG4gIH1cclxufTtcclxuXHJcbnZhciBpc05lYXIgPSB7ICAgLy/Qv9GA0LjQvdC40LzQsNC10YIgMiDQvtCx0YrQtdC60YLQsCwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10LzQvtC5INGB0YLQvtGA0L7QvdGLIDHRi9C5INC+0YIgMtCz0L4uXHJcblxyXG4gIHVwIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkgeyAgLy/Qv9GA0L7QstC10YDQutCwINC/0LXRgNC10LTQsNCy0LDQtdC80YvQuSDRjdC70LXQvNC10L3RgiDQvNCw0YHRgdC40LIg0L7QsdGK0LXQutGC0L7QsiDQuNC70Lgg0L7QsdGK0LXQutGCLlxyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueSArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzIueSArIG9ial8yLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnkgJiYgb2JqXzEueCA9PSBvYmpfMltpXS54O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gIH0sXHJcblxyXG4gIGxlZnQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS54ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi54ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9LFxyXG5cclxuICByaWdodCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGNhbk1vdmVPYmooZGlyZWN0aW9uKXsgIC8vKNC+0L/QuNGB0YvQstCw0LXQvCDQs9GA0LDQvdC40YbRiyDQtNCy0LjQttC10L3QuNGPKSDRgNCw0LfRgNC10YjQsNC10YIg0LTQstC40LbQtdC90LjQtSDQsiDQv9GA0LXQtNC10LvQsNGFINGD0YDQvtCy0L3Rj1xyXG5cclxuICBhLnBsYXllci5wbGF5KCk7ICAgICAgICAgICAgICAgLy/QvtC30LLRg9GH0LrQsCDQtNCy0LjQttC10L3QuNGPXHJcbiAgby5wbC5kaXJlY3Rpb24gPSBvLnBsLmlzTW92ZSA9IGhmLmRpcmVjdGlvbklzKGRpcmVjdGlvbik7XHJcbiAgaWYgKCBpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5ib3gpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLmJveCwgby53YWxscykgKXsgICAgICAvL9C10YHQu9C4INGA0Y/QtNC+0Lwg0YEg0Y/RidC40LrQvtC8INC4INGP0YnQuNC6INC90LUg0YMg0LPRgNCw0L3QuNGGLCDQtNCy0LjQs9Cw0LXQvC5cclxuICAgIGEuY3J5c3RhbC5wbGF5KDEpOyAgICAgICAgICAgLy/QvtC30LLRg9GH0LrQsCDRgtC+0LvQutCw0L3QuNGPINC60YDQuNGB0YLQsNC70LvQsFxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgICBvLmJveC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfSBlbHNlIGlmKCAhaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby5ib3gpICYmICFpc0JvcmRlcltkaXJlY3Rpb25dKG8ucGwpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLndhbGxzKSApeyAvL9C10YHQu9C4INC90LUg0YDRj9C00L7QvCDRgSDRj9GJ0LjQutC+0Lwg0Lgg0L3QtSDRgNGP0LTQvtC8INGBINCz0YDQsNC90LjRhtC10LksINC00LLQuNCz0LDQtdC80YHRjy5cclxuICAgIG8ucGwubW92ZShkaXJlY3Rpb24pO1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGlzQ3Vyc29ySW5CdXR0b24oeCx5LGJ1dCl7IC8v0LLQvtC30LLRgNCw0YnQsNC10YIg0YLRgNGDLCDQtdGB0LvQuCDQutGD0YDRgdC+0YAg0L/QvtC/0LDQuyDQsiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvtCx0YrQtdC60YLQsFxyXG4gIHJldHVybiB4ID49IGJ1dC54ICYmIFxyXG4gIHggPD0gYnV0LngrYnV0LncgJiYgXHJcbiAgeSA+PSBidXQueSAmJiBcclxuICB5IDw9IGJ1dC55K2J1dC5oXHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkTGV2ZWwobnVtYmVyKXsgICAgICAgLy/Qt9Cw0LPRgNGD0LfQutCwINGD0YDQvtCy0L3Rj1xyXG4gIHN3LnN0YXJ0KCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAvL9C30LDQv9GD0YHQutCw0LXQvCDRgtCw0LnQvNC10YBcclxuICBsZXZlbHNbbnVtYmVyXSgpOyAgICAgICAgICAgICAgICAgICAgLy/Qt9Cw0L/Rg9GB0LrQsNC10Lwg0YPRgNC+0LLQtdGA0Ywg0LrQvtGC0L7RgNGL0Lkg0LfQsNC/0YDQvtGB0LjQu9C4XHJcbiAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9IG51bWJlcjsgICAgIC8v0LfQsNC/0L7QvNC40L3QsNC10Lwg0LrQsNC60L7QuSDRgdC10LnRh9Cw0YEg0YPRgNC+0LLQtdC90Ywg0LjQs9GA0LDRgtGMINCx0YPQtNC10LwgXHJcbiAgby5jdXJyTGV2ZWwudHh0ID0gXCLQo9GA0L7QstC10L3RjCBcIitudW1iZXI7IC8v0LIg0YXQtdC00LXRgNC1INCy0YvQstC+0LTQuNC8INC90L7QvNC10YAg0YPRgNC+0LLQvdGPXHJcbiAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMuZ2FtZSk7IC8v0L3RgyDQuCDQt9Cw0L/Rg9GB0LrQsNC10Lwg0YbQuNC60Lsg0LjQs9GA0YsgXHJcbn07XHJcblxyXG53aW5kb3cub25rZXlkb3duID0gZnVuY3Rpb24oZSl7ICAgLy/RgdC+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQutC70LDQstC40YhcclxuXHJcbiAgaWYgKCBnTG9vLnN0YXR1cyA9PSBcImdhbWVcIiApeyAvL9C/0LXRgNC10LTQstC40LPQsNGC0YzRgdGPINGC0L7Qu9GM0LrQviDQtdGB0LvQuCDQuNC00LXRgiDQuNCz0YDQsC5cclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJEXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcInJpZ2h0XCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIlNcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwiZG93blwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJXXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcInVwXCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIkFcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwibGVmdFwiKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgd2luZG93Lm9ua2V5dXAgPSBmdW5jdGlvbihlKXtcclxuICAgIG8ucGwuaXNNb3ZlID0gZmFsc2U7XHJcbiAgfTtcclxufTtcclxuXHJcbndpbmRvdy5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGUpeyAvL2PQvtCx0YvRgtC40LUg0L3QsNC20LDRgtC40Y8g0LzRi9GI0LrQuFxyXG5cclxuICBpZiAoIGZzLmlzRnVsbFNjcmVlbiApeyAgICAgIFxyXG4gICAgdmFyIHggPSAoZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQpL2ZzLnpvb207XHJcbiAgICB2YXIgeSA9IChlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wKS9mcy56b29tO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgeCA9IGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0O1xyXG4gICAgdmFyIHkgPSBlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wO1xyXG4gIH07XHJcblxyXG4gIHN3aXRjaCAoZ0xvby5zdGF0dXMpe1xyXG5cclxuICAgIGNhc2UgXCJtZW51XCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLm1lbnVbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInBsYXlcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICAgIGEuYmdJbk1lbnUuc3RvcCgpO1xyXG4gICAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJjaGFuZ2VfbGV2ZWxcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmxldmVscyk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwibGV2ZWxzXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmxldmVsc0Zvb3RlcltpXSkgKXtcclxuICAgICAgICAgIHN3aXRjaCAoby5sZXZlbHNGb290ZXJbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInByZXZcIiA6XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0L3QsNC30LDQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJ0b19tZW51XCIgOlxyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJuZXh0XCIgOlxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi0JrQvdC+0L/QutCwINCy0L/QtdGA0LXQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJMZXZlbHNCdXR0b25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJMZXZlbHNCdXR0b25zW2ldKSApe1xyXG4gICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgYS5iZ0luTWVudS5zdG9wKCk7XHJcbiAgICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsID0gaSsxO1xyXG4gICAgICAgICAgbG9hZExldmVsKGkrMSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImdhbWVcIiA6XHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iUGF1c2UpICl7XHJcbiAgICAgICAgYS5iZ0luR2FtZS5wYXVzZSgpO1xyXG4gICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICBzdy5wYXVzZVRpbWVyKCk7XHJcbiAgICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLnBhdXNlKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKXtcclxuICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgKCAhZnMuaXNGdWxsU2NyZWVuICkgPyBmcy5sYXVuY2hGdWxsU2NyZWVuKGNhbnZhcy5jbnYpIDogZnMuY2Fuc2VsRnVsbFNjcmVlbigpOyBcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcIndpblwiIDpcclxuXHJcbiAgICAgIGZvciAoIGkgaW4gby53aW5Qb3BVcCApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby53aW5Qb3BVcFtpXSkgKXtcclxuICAgICAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX2V4aXRcIiApe1xyXG4gICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgICAgIGEuYmdJbkdhbWUuc3RvcCgpO1xyXG4gICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCAhPSBsZXZlbHMubHZsc0NvdW50KCkgKXtcclxuICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsKys7XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcInBhdXNlXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5wYXVzZVBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgc3dpdGNoIChvLnBhdXNlUG9wVXBbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJldHVyblwiIDpcclxuICAgICAgICAgICAgICBzdy5zdGFydCgpO1xyXG4gICAgICAgICAgICAgIGEuYmdJbkdhbWUucGxheSgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmdhbWUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJlc3RhcnRcIiA6XHJcbiAgICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgICBhLmJnSW5HYW1lLnN0b3AoKTtcclxuICAgICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiZXhpdFwiIDpcclxuICAgICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgIGEuYmdJbkdhbWUuc3RvcCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZW1vdmUgPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjRjyDQtNCy0LjQttC10L3QuNGPINC80YvRiNC60LgsINGC0YPRgiDRhdC+0LLQtdGA0Ysg0L7QsdGA0LDQsdC+0YLQsNC10LxcclxuXHJcbiAgaWYgKCBmcy5pc0Z1bGxTY3JlZW4gKXtcclxuICAgIHZhciB4ID0gKGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0KS9mcy56b29tO1xyXG4gICAgdmFyIHkgPSAoZS5wYWdlWS1jYW52YXMuY252Lm9mZnNldFRvcCkvZnMuem9vbTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICAgIHZhciB5ID0gZS5wYWdlWS1jYW52YXMuY252Lm9mZnNldFRvcDtcclxuICB9O1xyXG5cclxuICBzd2l0Y2ggKGdMb28uc3RhdHVzKXtcclxuXHJcbiAgICBjYXNlIFwibWVudVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLm1lbnUgKXtcclxuICAgICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubWVudVtpXSkgKSA/IG8ubWVudVtpXS5ob3ZlcigxKSA6IG8ubWVudVtpXS5ob3ZlcigpO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiZ2FtZVwiIDpcclxuICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJQYXVzZSkgKSA/IG8uYlBhdXNlLmhvdmVyKDEpIDogby5iUGF1c2UuaG92ZXIoKTtcclxuXHJcbiAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKSA/IG8uYkZ1bGxTY3IuaG92ZXIoMSkgOiBvLmJGdWxsU2NyLmhvdmVyKCk7ICBcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcIndpblwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLndpblBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfZXhpdFwiICl7XHJcbiAgICAgICAgICAgIG8ud2luUG9wVXBbaV0uaG92ZXIoMSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgIT0gbGV2ZWxzLmx2bHNDb3VudCgpICl7XHJcbiAgICAgICAgICAgIG8ud2luUG9wVXBbaV0uaG92ZXIoMSk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0uaG92ZXIgKSBvLndpblBvcFVwW2ldLmhvdmVyKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImxldmVsc1wiIDpcclxuICAgICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5sZXZlbHNGb290ZXJbaV0pICkgPyBvLmxldmVsc0Zvb3RlcltpXS5ob3ZlcigxKSA6IG8ubGV2ZWxzRm9vdGVyW2ldLmhvdmVyKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJMZXZlbHNCdXR0b25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJMZXZlbHNCdXR0b25zW2ldKSApID8gby5iTGV2ZWxzQnV0dG9uc1tpXS5ob3ZlcigxKSA6IG8uYkxldmVsc0J1dHRvbnNbaV0uaG92ZXIoKTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgXHJcbiAgICBjYXNlIFwicGF1c2VcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5wYXVzZVBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLnBhdXNlUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ucGF1c2VQb3BVcFtpXS5ob3ZlciApIG8ucGF1c2VQb3BVcFtpXS5ob3ZlcigxKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKCBvLnBhdXNlUG9wVXBbaV0uaG92ZXIgKSBvLnBhdXNlUG9wVXBbaV0uaG92ZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICB9O1xyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIHpvb20gPSAwO1xyXG5cclxuZnVuY3Rpb24gZnVsbENhbnZhcygpe1x0Ly/QutCw0L3QstCwINCy0L4g0LLQtdGB0Ywg0Y3QutGA0LDQvVxyXG5cclxuXHR2YXIgZGV2aWNlV2lkdGggPSB3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGg7XHJcblx0dmFyIGRldmljZUhlaWdodCA9IHdpbmRvdy5zY3JlZW4uYXZhaWxIZWlnaHQ7XHJcblx0ZnVsbFNjcmVlbi56b29tID0gKGRldmljZUhlaWdodCAvIEMuSEVJR0hUKS50b0ZpeGVkKDEpO1x0Ly/QutCw0LrQvtC1INGD0LLQtdC70LjRh9C10L3QuNC1INGB0LTQtdC70LDRgtGMINC40YHRhdC+0LTRjyDQuNC3INGA0LDQt9C80LXRgNC+0LIg0Y3QutGA0LDQvdCwLlxyXG5cclxuXHRjYW52YXMuY252LndpZHRoID0gY2FudmFzLmNudi53aWR0aCpmdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodCpmdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmN0eC5zY2FsZShmdWxsU2NyZWVuLnpvb20sZnVsbFNjcmVlbi56b29tKTtcclxuXHJcblx0ZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW4gPSAhZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW47XHJcbn07XHJcblxyXG5mdW5jdGlvbiBub3JtYWxDYW52YXMoKXtcdC8v0LjRgdGF0L7QtNC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUg0LrQsNC90LLRi1xyXG5cclxuXHQvL2PQvtGF0YDQsNC90Y/QtdC8INC/0L7RgdC70LXQtNC90LjQuSDQutCw0LTRgCDQuNCz0YDRiywg0LTQsNCx0Ysg0L/RgNC4INCy0L7Qt9Cy0YDQsNGJ0LXQvdC40Lgg0YDQsNC30LzQtdGA0LAg0L/QvtGB0LvQtSDRhNGD0LvRgdC60YDQuNC90LAsINC+0L0g0L7RgtGA0LjRgdC+0LLQsNC70YHRjywg0LjQvdCw0YfQtSDQsdGD0LTQtdGCINCx0LXQu9GL0Lkg0YXQvtC70YHRgi5cclxuXHR2YXIgYnVmQ252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuXHR2YXIgYnVmQ3R4ID0gYnVmQ252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHRidWZDbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbTtcclxuXHRidWZDbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tO1xyXG5cdGJ1ZkN0eC5kcmF3SW1hZ2UoY2FudmFzLmNudiwgMCwwLCBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbSwgY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tKTtcclxuXHJcblx0Y2FudmFzLmNudi53aWR0aCA9IGNhbnZhcy5jbnYud2lkdGgvZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jdHguc2NhbGUoMSwxKTtcclxuXHRjYW52YXMuY3R4LmRyYXdJbWFnZShidWZDbnYsMCwwLGNhbnZhcy5jbnYud2lkdGgsY2FudmFzLmNudi5oZWlnaHQpO1xyXG5cclxuXHRmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbiA9ICFmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uRnVsbFNjcmVlbkNoYW5nZSgpe1x0Ly/Qv9GA0Lgg0LjQt9C80LXQvdC40Lgg0YHQvtGB0YLQvtGP0L3QuNC1INGE0YPQu9GB0LrRgNC40L3QsFxyXG5cclxuXHQoIGZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuICkgPyBub3JtYWxDYW52YXMoKSA6IGZ1bGxDYW52YXMoKTtcclxufTtcclxuXHJcbmNhbnZhcy5jbnYuYWRkRXZlbnRMaXN0ZW5lcihcIndlYmtpdGZ1bGxzY3JlZW5jaGFuZ2VcIiwgb25GdWxsU2NyZWVuQ2hhbmdlKTtcclxuY2FudmFzLmNudi5hZGRFdmVudExpc3RlbmVyKFwibW96ZnVsbHNjcmVlbmNoYW5nZVwiLCAgICBvbkZ1bGxTY3JlZW5DaGFuZ2UpO1xyXG5jYW52YXMuY252LmFkZEV2ZW50TGlzdGVuZXIoXCJmdWxsc2NyZWVuY2hhbmdlXCIsICAgICAgIG9uRnVsbFNjcmVlbkNoYW5nZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bGxTY3JlZW4gPSB7IFxyXG5cclxuXHRsYXVuY2hGdWxsU2NyZWVuIDogZnVuY3Rpb24oZWxlbSl7XHJcblxyXG5cdFx0aWYgKCBlbGVtLnJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ubW96UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5tb3pSZXF1c3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBlbGVtLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH07XHJcblx0fSxcclxuXHJcblx0Y2Fuc2VsRnVsbFNjcmVlbiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0aWYgKCBkb2N1bWVudC5leGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRpc0Z1bGxTY3JlZW4gOiBmYWxzZSxcclxuXHJcblx0em9vbSA6IHpvb21cclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcbnZhciBwcmVsb2FkZXIgPSByZXF1aXJlKCcuL19wcmVsb2FkZXIuanMnKTtcclxuXHJcbnZhciBhID0gby5hdWRpbztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2FtZUxvb3BzID0gIHtcclxuXHJcbiAgbG9hZGVyIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJsb2FkZXJcIjtcclxuXHJcbiAgICBwcmVsb2FkZXIudXBkYXRlTG9hZGVyKCk7XHJcbiAgICBwcmVsb2FkZXIuZHJhd0xvYWRlcigpO1xyXG4gICAgcHJlbG9hZGVyLmRyYXdMb2FkVGV4dCgpO1xyXG4gICAgXHJcbiAgICBpZiAoIHJlcy5yZXNvdXJzZXMuYXJlTG9hZGVkKCkgKSBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICB9LFxyXG5cclxuICBnYW1lIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJnYW1lXCI7IFxyXG5cclxuICAgIGlmIChhLmJnSW5HYW1lLnN0YXRlID09IFwic3RvcFwiKSBhLmJnSW5HYW1lLnBsYXkoKTtcclxuXHJcbiAgICAvL9C+0YfQuNGB0YLQutCwINC+0LHQu9Cw0YHRgtC4XHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINCx0LMg0YPRgNC+0LLQvdGPXHJcbiAgICBvLmJnTGV2ZWwuZHJhdygpO1xyXG4gICAgXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDQvNCw0YLRgNC40YfQvdC+0LUg0L/QvtC70LUg0LjQs9GA0YtcclxuICAgIGZvciAoIGkgaW4gby5tYXRyaXggKXtcclxuICAgICAgby5tYXRyaXhbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDRgdGC0LXQvdGLXFzQv9GA0LXQs9GA0LDQtNGLXHJcbiAgICBmb3IgKCBpIGluIG8ud2FsbHMgKXtcclxuICAgICAgby53YWxsc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINGF0LXQtNC10YDQsCDRg9GA0L7QstC90Y9cclxuICAgIG8uaGVhZGVyLmRyYXcoKTtcclxuICAgIG8uc3RvcFdhdGNoLmRyYXcoMSwxMCk7XHJcbiAgICBvLmJGdWxsU2NyLmRyYXcoKTtcclxuICAgIG8uYlBhdXNlLmRyYXcoKTtcclxuICAgIG8uY3VyckxldmVsLmRyYXcoKTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDQuNCz0YDQvtCy0YvRhSDQvtCx0YrQtdC60YLQvtCyXHJcbiAgICBvLmRvb3IuZHJhdygpO1xyXG4gICAgby5wbC5kcmF3KCk7XHJcbiAgICBvLmJveC5kcmF3KCk7XHJcblxyXG4gICAgLy/QtdGB0LvQuCDQv9C+0LHQtdC00LjQu9C4XHJcbiAgICBpZiAoIGhmLmlzV2luKCkgKXtcclxuICAgICAgby5iZ09wYWNpdHkuZHJhdygpOyAvL9C+0YLRgNC40YHQvtCy0LrQsCDQt9Cw0YLQtdC80L3QtdC90LjRj1xyXG4gICAgICBhLndpbi5wbGF5KCk7ICAgICAgIC8v0L7Qt9Cy0YPRh9C60LAg0L/QvtCx0LXQtNC60LhcclxuICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMud2luKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgbWVudSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwibWVudVwiO1xyXG5cclxuICAgIGlmIChhLmJnSW5NZW51LnN0YXRlID09IFwic3RvcFwiKSBhLmJnSW5NZW51LnBsYXkoKTtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8uYW5pbWF0ZUJnLmRyYXcoKTtcclxuXHJcbiAgICBvLmxvZ28uZHJhdygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgIG8ubWVudVtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICB9LFxyXG5cclxuICB3aW4gOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIndpblwiO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby53aW5Qb3BVcCApe1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcIndpbl90ZXh0XCIgKSBvLndpblBvcFVwW2ldLnR4dCA9IFwi0KPRgNC+0LLQtdC90YwgXCIrZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbDtcclxuICAgICAgXHJcbiAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX25leHRcIiAmJiBnYW1lTG9vcHMuY3VycmVudExldmVsID09IGxldmVscy5sdmxzQ291bnQoKSApIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvLndpblBvcFVwW2ldLmRyYXcoKTtcclxuICAgICAgfSAgXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHBhdXNlIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJwYXVzZVwiO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5wYXVzZVBvcFVwICl7XHJcbiAgICAgIG8ucGF1c2VQb3BVcFtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGxldmVscyA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwibGV2ZWxzXCI7XHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICBvLnZpZGVvQmdMZXZlbHMuZHJhdygpO1xyXG5cclxuICAgIG8ubGV2ZWxzSGVhZGVyLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8uYkxldmVsc0J1dHRvbnMgKXtcclxuICAgICAgby5iTGV2ZWxzQnV0dG9uc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5sZXZlbHNGb290ZXIgKXtcclxuICAgICAgby5sZXZlbHNGb290ZXJbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBzdGF0dXMgOiBcIlwiLFxyXG5cclxuICBjdXJyZW50TGV2ZWwgOiBcIjFcIlxyXG5cclxufTtcclxuIiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICBjbGVhclJlY3QgOiBmdW5jdGlvbih4LHksdyxoKXsgICAgICAvL9C+0YfQuNGB0YLQuNGC0LXQu9GMXHJcbiAgICBjdHguY2xlYXJSZWN0KHgseSx3LGgpO1xyXG4gIH0sXHJcblxyXG4gIGdldFJhbmRvbUludCA6IGZ1bmN0aW9uKG1pbiwgbWF4KSB7IC8v0YTRg9C90LrRhtC40Y8g0LTQu9GPINGA0LDQvdC00L7QvNCwINGG0LXQu9C+0YfQuNGB0LvQtdC90L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRj1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbiAgfSxcclxuXHJcbiAgaXNXaW4gOiBmdW5jdGlvbigpeyAgICAgICAgICAgICAgICAgLy/Qv9C+0LHQtdC00LjQu9C4P1xyXG4gICAgcmV0dXJuIG8uYm94LnggPT0gby5kb29yLnggJiYgby5ib3gueSA9PSBvLmRvb3IueTtcclxuICB9LFxyXG5cclxuICBkaXJlY3Rpb25JcyA6IGZ1bmN0aW9uKGRpcmVjdGlvbil7ICAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGD0LPQvtC7INC/0L7QstC+0YDQvtGC0LAg0LIg0LPRgNCw0LTRg9GB0LDRhSwg0LzQvtC20L3QviDQsdGL0LvQviDQuCDRgdC00LXQu9Cw0YLRjCDQv9GA0L7RidC1IC0g0L7QsdGK0LXQutGC0L7QvC5cclxuICBcdHN3aXRjaChkaXJlY3Rpb24pe1xyXG5cclxuICBcdFx0Y2FzZSBcInVwXCIgICA6IHJldHVybiAzNjA7XHJcbiAgXHRcdGJyZWFrO1xyXG4gIFx0XHRjYXNlIFwiZG93blwiIDogcmV0dXJuIDE4MDtcclxuICBcdFx0YnJlYWs7XHJcbiAgXHRcdGNhc2UgXCJsZWZ0XCIgOiByZXR1cm4gMjcwO1xyXG4gIFx0XHRicmVhaztcclxuICBcdFx0Y2FzZSBcInJpZ2h0XCI6IHJldHVybiA5MDtcclxuICBcdFx0YnJlYWs7XHJcblxyXG4gIFx0fTtcclxuICB9XHJcbn07XHJcbiIsInZhciBrZXlzID0ge1xyXG5cdFwiV1wiIDogODcsXHJcblx0XCJTXCIgOiA4MyxcclxuXHRcIkFcIiA6IDY1LFxyXG5cdFwiRFwiIDogNjhcclxufTtcclxuXHJcbnZhciBrZXlEb3duID0gMDtcclxuLy8gdmFyIGtleURvd24gPSB7fTtcclxuXHJcbmZ1bmN0aW9uIHNldEtleShrZXlDb2RlKXtcclxuXHRrZXlEb3duID0ga2V5Q29kZTtcclxuXHQvLyBrZXlEb3duW2tleWNvZGVdID0gdHJ1ZTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNsZWFyS2V5KGtleUNvZGUpe1xyXG5cdGtleURvd24gPSAwO1xyXG5cdC8vIGtleURvd25ba2V5Q29kZV0gPSBmYWxzZTtcclxufTtcclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKXtcclxuXHRzZXRLZXkoZS5rZXlDb2RlKTtcclxufSk7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgZnVuY3Rpb24oZSl7XHJcblx0Y2xlYXJLZXkoZS5rZXlDb2RlKTtcclxufSk7XHJcblxyXG5cclxuZnVuY3Rpb24gaXNLZXlEb3duKGtleU5hbWUpe1xyXG5cdHJldHVybiBrZXlEb3duW2tleXNba2V5TmFtZV1dID09IHRydWU7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRpc0tleURvd24gOiBmdW5jdGlvbihrZXlOYW1lKXtcclxuXHRcdHJldHVybiBrZXlEb3duID09IGtleXNba2V5TmFtZV07XHJcblx0XHQvLyByZXR1cm4ga2V5RG93bltrZXlzW2tleU5hbWVdXSA9PSB0cnVlO1xyXG5cdH1cclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbGV2ZWxzID0ge1xyXG5cclxuXHRsdmxzQ291bnQgOiBmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGNvdW50ID0gMDtcclxuXHRcdGZvcihrZXkgaW4gbGV2ZWxzKXsgY291bnQrKyB9O1xyXG5cdFx0XHRyZXR1cm4gY291bnQtMTtcclxuXHR9LFxyXG5cclxuXHQxIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICAvL9C80LDRgdGB0LjQsiDRgSDQsdGD0LTRg9GJ0LXQv9C+0YHRgtGA0L7QtdC90L3Ri9C80Lgg0YHRgtC10L3QutCw0LzQuFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMSwzXSxbMSw0XSxbMSw1XSxbMiwwXSxbMiw2XSxbMiw4XSxbMywyXSxbNCwxXSxbNCwzXSxbNCw3XSxbNSw0XSxbNiw0XSxbNiw2XSxbNywxXSxbNyw4XSxbOCwwXSxbOCw0XSxbOCw1XVxyXG5cdFx0XTtcdFx0XHRcdCAgLy/Qv9GA0LjQtNGD0LzQsNC90L3Ri9C5INC80LDRgdGB0LjQsiDRgdC+INGB0YLQtdC90LrQsNC80LhcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvNCw0YHRgdC40LIgd2FsbHNcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJyaWdodFwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArMiooNTArQy5QRE5HKSwgNyooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDAqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQyIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMF0sWzAsNF0sWzAsM10sWzAsNl0sWzIsMl0sWzIsNF0sWzMsOF0sWzMsMF0sWzMsN10sWzQsMl0sWzQsNF0sWzQsNV0sWzQsNl0sWzUsMF0sWzYsMl0sWzYsNV0sWzYsNl0sWzYsN10sWzcsMF0sWzgsM10sWzgsNF0sWzgsN11cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwicmlnaHRcIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzYqKDUwK0MuUERORyksIDArNyooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDArNiooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDMgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwyXSxbMCw3XSxbMSw1XSxbMSw4XSxbMiwyXSxbMiw3XSxbMyw0XSxbNCwxXSxbNCw0XSxbNCw2XSxbNiwyXSxbNiwzXSxbNiw0XSxbNiw2XSxbNiw4XSxbNywwXSxbNyw1XSxbOCwwXSxbOCwxXSxbOCwzXSxbOCw3XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInVwXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsxKig1MCtDLlBETkcpLCAwKzYqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCsyKig1MCtDLlBETkcpLCAwKzMqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQ0IDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMV0sWzEsNV0sWzEsN10sWzIsNF0sWzMsMV0sWzMsM10sWzMsNl0sWzMsOF0sWzQsM10sWzUsNV0sWzUsN10sWzYsMF0sWzYsMl0sWzYsM10sWzYsNV0sWzcsOF0sWzgsMF0sWzgsOF1cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDArNyooNTArQy5QRE5HKSwgMCs4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJ1cFwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArNyooNTArQy5QRE5HKSwgMCs3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArNiooNTArQy5QRE5HKSwgMCswKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0NSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDFdLFswLDNdLFswLDVdLFswLDhdLFsyLDJdLFsyLDRdLFsyLDZdLFsyLDhdLFs0LDBdLFs0LDNdLFs0LDVdLFs0LDddLFs2LDFdLFs2LDJdLFs2LDRdLFs2LDddLFs3LDhdLFs4LDJdLFs4LDRdLFs4LDhdXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwKzAqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcImRvd25cIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzEqKDUwK0MuUERORyksIDArMSooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9XHJcblxyXG59O1xyXG4iLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBjbnZzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciByZXMgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxuXHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNYXRyaXhCRygpeyAgICAgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INC80LDRgtGA0LjRh9C90L7QtSDQv9C+0LvQtVxyXG4gIHZhciBtYXRyaXggPSBbXTsgICAgICAgICAgICAgICAgICAgICAvL9C80LDRgdGB0LjQsiDQtNC70Y8g0LzQsNGC0YDQuNGH0L3QvtCz0L4g0LLQuNC00LAg0YPRgNC+0LLQvdGPXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKXsgICAgICAgICAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvtCx0YrQtdC60YJcclxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgOTsgaisrKXtcclxuICAgICAgbWF0cml4LnB1c2goIG5ldyBSZWN0KEMuUERORytqKig1MCtDLlBETkcpLCA3MStDLlBETkcraSooNTArQy5QRE5HKSwgNTAsIDUwLCBcInJnYmEoMCwwLDAsMC41KVwiLCB0cnVlKSApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBtYXRyaXhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnUodHh0QXJyLCBuYW1lQXJyKXsgIC8v0YHQvtC30LTQsNC10Lwg0LPQu9Cw0LLQvdC+0LUg0LzQtdC90Y5cclxuICB2YXIgbWVudSA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IG5hbWVBcnI7XHJcbiAgdmFyIHR4dCA9IHR4dEFycjtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcbiAgXHJcbiAgdmFyIF9mb250c2l6ZSA9IFwiMjhcIjtcclxuICB2YXIgX3ggPSBDLldJRFRILzItMzAwLzI7XHJcbiAgdmFyIF95ID0gKEMuSEVJR0hULzIpIC0gKDg1KmFtb3VudHMvMikgKyA4NTsgXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYW1vdW50czsgaSsrKXtcclxuICAgIG1lbnUucHVzaCggbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1swXSwgX3gsIF95K2kqODUsIDMwMCwgNjAsIHR4dFtpXSwgbmFtZXNbaV0sIF9mb250c2l6ZSwgODMgKSApO1xyXG4gICAgbWVudVtpXS5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjFdO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBtZW51O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlV2luUG9wVXAoKXsgICAgICAgICAgICAgLy/RgdC+0LfQtNCw0LXQvCDQv9C+0LHQtdC00L3Rg9GOINCy0YHQv9C70LvRi9Cy0LDRiNC60YNcclxuXHJcbiAgdmFyIHdpblBvcEJHID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzE2XSwgQy5XSURUSC8yLTMyMC8yLCBDLkhFSUdIVC8yLTIwMC8yLCAzMjAsIDIwMCk7XHJcbiAgdmFyIGJQb3BFeGl0ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMl0sIHdpblBvcEJHLngrMzAsICB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNTAsIDgwLCA2NSwgXCJcIiwgXCJwb3BfZXhpdFwiLCAwICk7XHJcbiAgYlBvcEV4aXQuaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzI2XTtcclxuICB2YXIgYlBvcE5leHQgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE1XSwgd2luUG9wQkcueCszMCsxMTArODAsICB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNTAsIDgwLCA2NSwgXCJcIiwgXCJwb3BfbmV4dFwiLCAwICk7XHJcbiAgYlBvcE5leHQuaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzI5XTtcclxuICB2YXIgd2luVGV4dCA9IG5ldyBCdXR0b24oIEMuV0lEVEgvMi05MC8yLCB3aW5Qb3BCRy55KzE1LCA5MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQo9GA0L7QstC10L3RjCBOXCIsIFwid2luX3RleHRcIiwgMzAsIFwiQnVjY2FuZWVyXCIgKTtcclxuICB2YXIgd2luVGV4dF8yID0gbmV3IEJ1dHRvbiggQy5XSURUSC8yLTkwLzIrMTAsIHdpblBvcEJHLnkrODAsIDkwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCf0KDQntCZ0JTQldCdIVwiLCBcIndpbl90ZXh0XzJcIiwgNTAsIFwiYVpaX1RyaWJ1dGVfQm9sZFwiICk7XHJcblxyXG4gIHdpblRleHQudHh0Q29sb3IgPSBcIiNEOUM0MjVcIjtcclxuXHJcbiAgdmFyIHdpblBvcFVwID0gW107XHJcbiAgd2luUG9wVXAucHVzaCh3aW5Qb3BCRywgYlBvcEV4aXQsIGJQb3BOZXh0LCB3aW5UZXh0LCB3aW5UZXh0XzIpO1xyXG5cclxuICByZXR1cm4gd2luUG9wVXA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQYXVzZVBvcFVwKCl7ICAgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INC/0LDRg9C3INCy0YHQv9C70YvQstCw0YjQutGDXHJcblxyXG4gIHZhciBwYXVzZVBvcFVwID0gW107XHJcbiAgdmFyIGJnUGF1c2UgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbMTNdLCBDLldJRFRILzItMzAwLzIsIEMuSEVJR0hULzItMjA3LzIsIDMwMCwgMjA3KTtcclxuICB2YXIgYlJldHVybiA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTBdLCBiZ1BhdXNlLngrMTkwLCAgYmdQYXVzZS55LTI1LCA2MywgNTcsIFwiXCIsIFwicmV0dXJuXCIsIDAgKTtcclxuICBiUmV0dXJuLmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syNF07XHJcbiAgdmFyIGJFeGl0VG9NZW51ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMl0sICBiZ1BhdXNlLngrNTAsICBiZ1BhdXNlLnkrYmdQYXVzZS5oLTUwLCA4NSwgNzAsIFwiXCIsIFwiZXhpdFwiLCAwICk7XHJcbiAgYkV4aXRUb01lbnUuaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzI2XTtcclxuICB2YXIgYlJlc3RhcnQgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzExXSwgIGJnUGF1c2UueCs1MCszMCs4NSwgIGJnUGF1c2UueStiZ1BhdXNlLmgtNTAsIDg1LCA3MCwgXCJcIiwgXCJyZXN0YXJ0XCIsIDAgKTtcclxuICBiUmVzdGFydC5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjVdO1xyXG4gIHZhciBwYXVzZVRleHQgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbMTRdLCBiZ1BhdXNlLnggKyBiZ1BhdXNlLncvMiAtIDE1MC8yLCBiZ1BhdXNlLnkgKyBiZ1BhdXNlLmgvMiAtIDEwMC8yLCAxNTAsIDEwMCk7XHJcblxyXG4gIHBhdXNlUG9wVXAucHVzaChiZ1BhdXNlLCBiUmV0dXJuLCBiRXhpdFRvTWVudSwgYlJlc3RhcnQsIHBhdXNlVGV4dCk7XHJcblxyXG4gIHJldHVybiBwYXVzZVBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzQnV0dG9ucyhsZXZlbHNfY291bnQpeyAvL9GB0L7Qt9C00LDQtdC8INC60L3QvtC/0LrQuCDQsiDQstGL0LHQvtGA0LUg0YPRgNC+0LLQvdGPXHJcblxyXG4gIHZhciBiTGV2ZWxzQnV0dG9ucyA9IFtdO1xyXG4gIHZhciBqID0gMCwgZHkgPSA4NSwgZHggPSAwO1xyXG5cclxuICBmb3IgKCBpPTA7IGkgPCBsZXZlbHNfY291bnQ7IGkrKyl7XHJcbiAgICBkeCA9IDgraiooMTAwKzE1KTtcclxuXHJcbiAgICBiTGV2ZWxzQnV0dG9ucy5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE3XSwgZHgsIGR5LCAxMDAsIDEwMCwgaSsxLCBcImxldmVsX1wiKyhpKzEpLCAzNSApICk7XHJcbiAgICBiTGV2ZWxzQnV0dG9uc1tpXS5ob3ZlckltZyA9IHJlcy5hcnJJbWFnZXNbMjddO1xyXG5cclxuICAgIGorKztcclxuXHJcbiAgICBpZiAoIGR4ID4gQy5XSURUSC0xMTUgKXtcclxuICAgICAgZHkgKz0gKDEyNSk7XHJcbiAgICAgIGogPSAwO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYkxldmVsc0J1dHRvbnM7XHJcbn07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5mdW5jdGlvbiBjcmVhdGVMZXZlbHNGb290ZXIoKXsgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INGE0YPRgtC10YAg0LIg0LLRi9Cx0L7RgNC1INGD0YDQvtCy0L3Rj1xyXG5cclxuICB2YXIgbGV2ZWxzRm9vdGVyID0gW107XHJcblxyXG4gIHZhciBiUHJldiA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTldLCAyMCwgQy5IRUlHSFQtMTAtNjcsIDQwLCA2NywgXCJcIiwgXCJwcmV2XCIsIDAgKTtcclxuICB2YXIgYk5leHQgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE4XSwgQy5XSURUSC0yMC00MCwgQy5IRUlHSFQtMTAtNjcsIDQwLCA2NywgXCJcIiwgXCJuZXh0XCIsIDAgKTtcclxuICB2YXIgYlRvTWVudSA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMjBdLCBDLldJRFRILzIgLSAzMjAvMiwgQy5IRUlHSFQtMTAtNjcsIDMyMCwgNjcsIFwi0JLQtdGA0L3Rg9GC0YzRgdGPINCyINC80LXQvdGOXCIsIFwidG9fbWVudVwiLCAyNSApO1xyXG4gIGJUb01lbnUuaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzI4XTtcclxuICBiVG9NZW51LnR4dENvbG9yID0gXCIjMDAwMDQ2XCI7XHJcblxyXG4gIGxldmVsc0Zvb3Rlci5wdXNoKGJQcmV2LGJOZXh0LGJUb01lbnUpO1xyXG5cclxuICByZXR1cm4gbGV2ZWxzRm9vdGVyO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGxheWVyKCl7ICAgICAgICAgICAgICAgLy/RgdC+0LfQtNCw0LXQvCDQuNCz0YDQvtC60LAg0YEg0YPQvdC40LrQsNC70YzQvdGL0LzQuCDQvNC10YLQvtC00LDQvNC4XHJcblxyXG4gIHZhciBwbGF5ZXIgPSBuZXcgUGxheWFibGUocmVzLmFyckltYWdlc1s5XSwwLDAsNTAsNTApO1xyXG4gIHBsYXllci5kaXJlY3Rpb24gPSBmYWxzZTtcclxuICBwbGF5ZXIuaXNNb3ZlID0gZmFsc2U7XHJcblxyXG4gIHBsYXllci5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBpZih0aGlzLmlzTW92ZSl7XHJcbiAgICAgIHRoaXMuZHJhd0FuaW1hdGlvbigzLCAyLCB0aGlzLmRpcmVjdGlvbik7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5kcmF3RnJhbWUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLmRyYXdBbmltYXRpb24gPSBmdW5jdGlvbihmcmFtZXMsIGRlbGF5LCBhbmdsZSl7XHJcblxyXG4gICAgdGhpcy5pbWcuY2FuRHJhdyA9ICggdGhpcy5pbWcuY2FuRHJhdyA9PT0gdW5kZWZpbmVkICkgPyAxIDogdGhpcy5pbWcuY2FuRHJhdztcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICB2YXIgX2R4ID0gdGhpcy54K0MuUERORyArIHRoaXMudyAvIDI7XHJcbiAgICAgIHZhciBfZHkgPSB0aGlzLnkrNzErQy5QRE5HICsgdGhpcy5oIC8gMjtcclxuICAgICAgYW5nbGUgPSBhbmdsZSAqIChNYXRoLlBJLzE4MCk7XHJcbiAgICAgIGNudnMuY3R4LnNhdmUoKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKF9keCxfZHkpO1xyXG4gICAgICBjbnZzLmN0eC5yb3RhdGUoYW5nbGUpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoLV9keCwtX2R5KTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRoaXMuaW1nLmNhbkRyYXcgPT0gMSl7XHJcbiAgICAgIGlmICh0aGlzLmltZy5jb3VudCA9PSBmcmFtZXMpIHRoaXMuaW1nLmNvdW50ID0gMTtcclxuXHJcbiAgICAgIHRoaXMuaW1nLmNhbkRyYXcgPSAwO1xyXG4gICAgICB0aGlzLmltZy5jb3VudCA9IHRoaXMuaW1nLmNvdW50ICsgMSB8fCAxO1xyXG5cclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgIHBsYXllci5pbWcuY2FuRHJhdyA9IDE7XHJcbiAgICAgIH0sIDEwMDAvKGRlbGF5KjIpICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjbnZzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDUwKih0aGlzLmltZy5jb3VudC0xKSwgMCwgdGhpcy53LCB0aGlzLmgsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoLUMuUERORywgLSg3MStDLlBETkcpKTtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICBjbnZzLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5kcmF3RnJhbWUgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIHZhciBhbmdsZSA9IHRoaXMuZGlyZWN0aW9uIHx8IDA7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgdmFyIF9keCA9IHRoaXMueCtDLlBETkcgKyB0aGlzLncgLyAyO1xyXG4gICAgICB2YXIgX2R5ID0gdGhpcy55KzcxK0MuUERORyArIHRoaXMuaCAvIDI7XHJcbiAgICAgIGFuZ2xlID0gYW5nbGUgKiAoTWF0aC5QSS8xODApO1xyXG4gICAgICBjbnZzLmN0eC5zYXZlKCk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZShfZHgsX2R5KTtcclxuICAgICAgY252cy5jdHgucm90YXRlKGFuZ2xlKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKC1fZHgsLV9keSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjbnZzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHRoaXMudywgdGhpcy5oLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKC1DLlBETkcsIC0oNzErQy5QRE5HKSk7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgY252cy5jdHgucmVzdG9yZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuc2V0RGlyZWN0aW9uID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBwbGF5ZXI7XHJcbn07XHJcblxyXG5cclxuXHJcbi8vbWVudVxyXG52YXIgbG9nbyA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMV0sIEMuV0lEVEgvMi00NTAvMiwgMjAsIDQ1MCwgMTUwLCBcIlwiLCBcImxvZ29cIiwgMCApO1xyXG52YXIgbWVudSA9IGNyZWF0ZU1lbnUoW1wi0JjQs9GA0LDRgtGMXCIsIFwi0KPRgNC+0LLQvdC4XCIsIFwi0J3QsNGB0YLRgNC+0LnQutC4XCJdLFtcInBsYXlcIiwgXCJjaGFuZ2VfbGV2ZWxcIiwgXCJvcHRpb25zXCJdKTtcclxuXHJcblxyXG4vL2JhY2tncm91bmQgXHJcbnZhciBtYXRyaXggPSBjcmVhdGVNYXRyaXhCRygpOyAgICAgICAgIC8vYmcg0YPRgNC+0LLQvdGPXHJcbnZhciBiZ0xldmVsID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzhdLCAwLCAwLCBDLldJRFRILCBDLkhFSUdIVCApO1xyXG52YXIgYmdPcGFjaXR5ID0gbmV3IFJlY3QoMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIFwicmdiYSgwLCAwLCAwLCAwLjUpXCIpO1xyXG5cclxuXHJcbi8vZ2FtZSBoZWFkZXJcclxudmFyIGhlYWRlciA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1syXSwgMCwgMCwgQy5XSURUSCwgNzErQy5QRE5HICk7XHJcbnZhciBiRnVsbFNjciA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbM10sIEMuV0lEVEgtNDUtMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwiZnVsbFNjclwiLCAwICk7XHJcbmJGdWxsU2NyLmhvdmVySW1nID0gcmVzLmFyckltYWdlc1syMl07XHJcbnZhciBzdG9wV2F0Y2ggPSBuZXcgQnV0dG9uKCAxMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDEyMCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCIwMCA6IDAwIDogMDBcIiwgXCJzdG9wd2F0Y2hcIiwgMjUsIFwiZGl0ZWRcIiApO1xyXG52YXIgYlBhdXNlID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1s0XSwgQy5XSURUSC00NS03LWJGdWxsU2NyLnctMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwicGF1c2VcIiwgMCApO1xyXG5iUGF1c2UuaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzIzXTtcclxudmFyIGN1cnJMZXZlbCA9IG5ldyBCdXR0b24oIChzdG9wV2F0Y2gueCtzdG9wV2F0Y2gudytiUGF1c2UueCkvMi0xNDAvMiwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDE0MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQo9GA0L7QstC10L3RjFwiLCBcImN1cnJfbGV2ZWxcIiwgMjUsIFwiY2FwdHVyZV9pdFwiICk7XHJcblxyXG5cclxuLy9jaGFuZ2UgbGV2ZWxcclxudmFyIGxldmVsc0hlYWRlciA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMl0sIDAsIDAsIEMuV0lEVEgsIDcxK0MuUERORywgXCLQktGL0LHQvtGAINGD0YDQvtCy0L3Rj1wiLCBcImxldmVsc19oZWFkZXJcIiwgMjUgKTtcclxudmFyIGJMZXZlbHNCdXR0b25zID0gY3JlYXRlTGV2ZWxzQnV0dG9ucyg1KTtcclxudmFyIGxldmVsc0Zvb3RlciA9IGNyZWF0ZUxldmVsc0Zvb3RlcigpO1xyXG5cclxuXHJcbi8vd2luIHBvcC11cFxyXG52YXIgd2luUG9wVXAgPSBjcmVhdGVXaW5Qb3BVcCgpO1xyXG5cclxuXHJcbi8vcGF1c2UgcG9wLXVwXHJcbnZhciBwYXVzZVBvcFVwID0gY3JlYXRlUGF1c2VQb3BVcCgpO1xyXG5cclxuXHJcbi8vcGxheWFibGUgb2JqXHJcbnZhciBwbCA9IGNyZWF0ZVBsYXllcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/Qv9C10YDRgdC+0L3QsNC2XHJcbnZhciBib3ggPSBuZXcgUGxheWFibGUocmVzLmFyckltYWdlc1s2XSwwLDAsNTAsNTApOyAgLy/QsdC+0LrRgVxyXG52YXIgZG9vciA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzddLDAsMCw1MCw1MCk7IC8v0LTQstC10YDRjFxyXG52YXIgd2FsbHMgPSBbXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v0YHRgtC10L3RiyDQvdCwINGD0YDQvtCy0L3QtSwg0LfQsNC/0L7Qu9C90Y/QtdGC0YHRjyDQstGL0LHRgNCw0L3QvdGL0Lwg0YPRgNC+0LLQvdC10LwuXHJcblxyXG5cclxuLy92aWRlb1xyXG52YXIgYW5pbWF0ZUJnID0gbmV3IFZpZGVvKDAsIDAsIEMuV0lEVEgsIEMuSEVJR0hULCByZXMuYXJyVmlkZW9zWzBdKTtcclxudmFyIHZpZGVvQmdMZXZlbHMgPSBuZXcgVmlkZW8oMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIHJlcy5hcnJWaWRlb3NbMV0pO1xyXG5cclxuXHJcbi8vYXVkaW9cclxudmFyIGF1ZGlvID0ge1xyXG5cclxuICBidXR0b24gICA6IG5ldyBBdWRpbyhyZXMuYXJyQXVkaW9bMF0sIDAuNSksXHJcbiAgd2luICAgICAgOiBuZXcgQXVkaW8ocmVzLmFyckF1ZGlvWzFdLCAwLjUpLFxyXG4gIHBsYXllciAgIDogbmV3IEF1ZGlvKHJlcy5hcnJBdWRpb1syXSksXHJcbiAgY3J5c3RhbCAgOiBuZXcgQXVkaW8ocmVzLmFyckF1ZGlvWzNdLCAwLjEpLFxyXG4gIGJnSW5HYW1lIDogbmV3IEF1ZGlvKHJlcy5hcnJBdWRpb1s0XSwgMC41KSxcclxuICBiZ0luTWVudSA6IG5ldyBBdWRpbyhyZXMuYXJyQXVkaW9bNV0sIDAuNSksXHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RzID0ge1xyXG5cclxuICBtYXRyaXggOiBtYXRyaXgsXHJcbiAgbG9nbyA6IGxvZ28sXHJcbiAgbWVudSA6IG1lbnUsXHJcbiAgaGVhZGVyIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCA6IHN0b3BXYXRjaCxcclxuICBiUGF1c2UgOiBiUGF1c2UsXHJcbiAgYkZ1bGxTY3IgOiBiRnVsbFNjcixcclxuICBwbCA6IHBsLFxyXG4gIGJveCA6IGJveCxcclxuICBkb29yIDogZG9vcixcclxuICB3YWxscyA6IHdhbGxzLFxyXG4gIGJnTGV2ZWwgOiBiZ0xldmVsLFxyXG4gIHdpblBvcFVwIDogd2luUG9wVXAsXHJcbiAgcGF1c2VQb3BVcCA6IHBhdXNlUG9wVXAsXHJcbiAgYmdPcGFjaXR5IDogYmdPcGFjaXR5LFxyXG4gIGN1cnJMZXZlbCA6IGN1cnJMZXZlbCxcclxuICBsZXZlbHNIZWFkZXIgOiBsZXZlbHNIZWFkZXIsXHJcbiAgYkxldmVsc0J1dHRvbnMgOiBiTGV2ZWxzQnV0dG9ucyxcclxuICBsZXZlbHNGb290ZXIgOiBsZXZlbHNGb290ZXIsXHJcbiAgYW5pbWF0ZUJnIDogYW5pbWF0ZUJnLFxyXG4gIHZpZGVvQmdMZXZlbHMgOiB2aWRlb0JnTGV2ZWxzLFxyXG4gIGF1ZGlvIDogYXVkaW9cclxuICBcclxufTtcclxuIiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblx0XHJcbnZhciBjb3VudCAgICA9IDc1O1xyXG52YXIgcm90YXRpb24gPSAyNzAqKE1hdGguUEkvMTgwKTtcdFx0XHJcbnZhciBzcGVlZCAgICA9IDY7XHJcblx0XHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuICBcclxuIFx0dXBkYXRlTG9hZGVyIDogZnVuY3Rpb24oKXtcclxuIFx0XHRjYW52YXMuY3R4LnNhdmUoKTtcclxuIFx0XHRjYW52YXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFN0eWxlID0gJ3JnYmEoMjU1LDI1NSwyNTUsLjAzNSknO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFJlY3QoMCwwLDUwMCw1MDApO1xyXG4gXHRcdHJvdGF0aW9uICs9IHNwZWVkLzEwMDtcclxuIFx0XHRjYW52YXMuY3R4LnJlc3RvcmUoKTtcdFx0XHRcdFx0XHRcdFx0XHRcclxuIFx0fSxcclxuXHJcbiBcdGRyYXdMb2FkZXIgOiBmdW5jdGlvbigpe1x0XHRcdFx0XHRcdFx0XHJcbiBcdFx0Y2FudmFzLmN0eC5zYXZlKCk7XHJcbiBcdFx0Y2FudmFzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gXHRcdGNhbnZhcy5jdHgudHJhbnNsYXRlKEMuV0lEVEgvMiwgQy5IRUlHSFQvMik7XHJcbiBcdFx0Y2FudmFzLmN0eC5saW5lV2lkdGggPSAwLjI1O1xyXG5cdFx0Y2FudmFzLmN0eC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwyNTUsMjU1LDEuMCknO1xyXG4gXHRcdGNhbnZhcy5jdHgucm90YXRlKHJvdGF0aW9uKTtcdFxyXG4gXHRcdHZhciBpID0gY291bnQ7XHJcbiBcdFx0d2hpbGUoaS0tKXtcdFx0XHRcdFx0XHRcdFx0XHJcbiBcdFx0XHRjYW52YXMuY3R4LmJlZ2luUGF0aCgpO1xyXG4gXHRcdFx0Y2FudmFzLmN0eC5hcmMoMCwgMCwgaSsoTWF0aC5yYW5kb20oKSozNSksIE1hdGgucmFuZG9tKCksIE1hdGguUEkvMysoTWF0aC5yYW5kb20oKS8xMiksIGZhbHNlKTtcdFx0XHRcdFx0XHRcdFx0XHJcbiBcdFx0XHRjYW52YXMuY3R4LnN0cm9rZSgpO1xyXG4gXHRcdH1cdFxyXG4gXHRcdGNhbnZhcy5jdHgucmVzdG9yZSgpO1xyXG5cclxuIFx0XHRjYW52YXMuY3R4LnNhdmUoKTtcclxuIFx0XHRjYW52YXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdmVyJztcclxuIFx0XHRjYW52YXMuY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDEpJztcclxuIFx0XHRjYW52YXMuY3R4LmZpbGxSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcdFxyXG4gXHRcdGNhbnZhcy5jdHgucmVzdG9yZSgpO1x0XHRcdFx0XHRcdFx0XHRcdFx0XHJcbiBcdH0sXHJcblxyXG4gXHRkcmF3TG9hZFRleHQgOiBmdW5jdGlvbigpe1xyXG4gXHRcdHZhciB3aW5UZXh0ID0gbmV3IEJ1dHRvbiggQy5XSURUSC8yLTI1MC8yLCAyNSwgMjUwLCA0MCwgXCJibGFja1wiLCBcItCY0LTQtdGCINC30LDQs9GA0YPQt9C60LAuLlwiLCBcImxvYWQtdGV4dFwiLCAzMCwgXCJCdWNjYW5lZXJcIiApO1xyXG4gIFx0XHRyZXR1cm4gd2luVGV4dC5kcmF3KCk7XHJcbiBcdH1cclxufTsgXHJcblxyXG4gICIsInZhciByZXNvdXJzZXMgPSB7XHJcbiAgaW1hZ2VzIDogZmFsc2UsXHJcbiAgdmlkZW8gIDogZmFsc2UsXHJcbiAgYXVkaW8gIDogZmFsc2UsXHJcblxyXG4gIGFyZUxvYWRlZCA6IGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gdGhpcy52aWRlbyAmJiB0aGlzLmltYWdlcyAmJiB0aGlzLmF1ZGlvXHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZFZpZGVvKGFyclNyY3NPZlZpZGVvKXtcclxuXHJcbiAgdmFyIGFyclZpZGVvcyA9IFtdOyBcclxuICB2YXIgY291bnQgPSBhcnJTcmNzT2ZWaWRlby5sZW5ndGg7XHJcbiAgdmFyIGxvYWRDb3VudCA9IDA7XHJcblxyXG4gIGZvcih2YXIgaT0wOyBpPGNvdW50OyBpKyspe1xyXG5cclxuICAgIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XHJcbiAgICB2aWRlby5zcmMgPSBhcnJTcmNzT2ZWaWRlb1tpXTtcclxuICAgIHZpZGVvLm9uY2FucGxheXRocm91Z2ggPSBmdW5jdGlvbigpe1xyXG4gICAgICBsb2FkQ291bnQrKztcclxuICAgICAgdmlkZW8ubG9vcCA9IHRydWU7XHJcbiAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLnZpZGVvID0gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgYXJyVmlkZW9zLnB1c2godmlkZW8pO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXJyVmlkZW9zO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZEltYWdlcyhhcnJTcmNzT2ZJbWFnZXMpe1xyXG5cclxuICB2YXIgYXJySW1hZ2VzID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZkltYWdlcy5sZW5ndGg7XHJcbiAgdmFyIGxvYWRDb3VudCA9IDA7XHJcblxyXG4gIGZvcih2YXIgaT0wOyBpPGNvdW50OyBpKyspe1xyXG5cclxuICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgIGltZy5zcmMgPSBhcnJTcmNzT2ZJbWFnZXNbaV07XHJcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgbG9hZENvdW50Kys7XHJcbiAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLmltYWdlcyA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBhcnJJbWFnZXMucHVzaChpbWcpO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXJySW1hZ2VzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZEF1ZGlvKGFyclNyY3NPZkF1ZGlvKXtcclxuXHJcbiAgdmFyIGFyckF1ZGlvID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZkF1ZGlvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIGF1ZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcclxuICAgIGF1ZGlvLnNyYyA9IGFyclNyY3NPZkF1ZGlvW2ldO1xyXG4gICAgYXVkaW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGxvYWRDb3VudCsrO1xyXG4gICAgICBpZiAoIGxvYWRDb3VudCA9PSBjb3VudCApIHJlc291cnNlcy5hdWRpbyA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBhcnJBdWRpby5wdXNoKGF1ZGlvKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGFyckF1ZGlvO1xyXG59O1xyXG5cclxudmFyIGFyckF1ZGlvID0gbG9hZEF1ZGlvKFtcclxuICBcImF1ZGlvL2J1dHRvbi1jbGljay5tcDNcIixcclxuICBcImF1ZGlvL3dpbi1hdWRpby5tcDNcIixcclxuICBcImF1ZGlvL3BsYXllci1tb3ZlLm1wM1wiLFxyXG4gIFwiYXVkaW8vY3J5c3RhbC1tb3ZlLm1wM1wiLFxyXG4gIFwiYXVkaW8vYmctaW5HYW1lLm1wM1wiLFxyXG4gIFwiYXVkaW8vYmctaW5NZW51Lm1wM1wiXHJcbl0pO1xyXG5cclxudmFyIGFyclZpZGVvcyA9IGxvYWRWaWRlbyhbXHJcbiAgXCJ2aWRlby9iZy5tcDRcIixcclxuICBcInZpZGVvL0xpZ2h0bWlycm9yLm1wNFwiXHJcbl0pO1xyXG5cclxudmFyIGFyckltYWdlcyA9IGxvYWRJbWFnZXMoW1xyXG4gIFwiaW1nL21lbnVfX2J1dHRvbi1tZW51LnN2Z1wiLCAgICAgICAgICAgICAgICAvLzAgXHJcbiAgXCJpbWcvbWVudV9fbG9nby5wbmdcIiwgICAgICAgICAgICAgICAgICAgICAgIC8vMVxyXG5cclxuICBcImltZy9nYW1lX19iZy1oZWFkZXIuc3ZnXCIsICAgICAgICAgICAgICAgICAgLy8yIFxyXG4gIFwiaW1nL2dhbWVfX2J1dHRvbi1mdWxsc2NyZWVuLnN2Z1wiLCAgICAgICAgICAvLzMgXHJcbiAgXCJpbWcvZ2FtZV9fYnV0dG9uLXBhdXNlLnN2Z1wiLCAgICAgICAgICAgICAgIC8vNCBcclxuICBcImltZy9nYW1lX193YWxsLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgLy81IFxyXG4gIFwiaW1nL2dhbWVfX2NyeXN0YWxsLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAvLzYgXHJcbiAgXCJpbWcvZ2FtZV9fcG9ydGFsLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgIC8vNyBcclxuICBcImltZy9nYW1lX19ncm91bmQuanBnXCIsICAgICAgICAgICAgICAgICAgICAgLy84IFxyXG4gICdpbWcvZ2FtZV9fcGxheWVyLnBuZycsICAgICAgICAgICAgICAgICAgICAgLy85IFxyXG5cclxuICBcImltZy9wYXVzZV9fYnV0dG9uLWNsb3NlLnN2Z1wiLCAgICAgICAgICAgICAgLy8xMFxyXG4gIFwiaW1nL3BhdXNlX19idXR0b24tcmVzdGFydC5zdmdcIiwgICAgICAgICAgICAvLzExXHJcbiAgXCJpbWcvcGF1c2VfX2J1dHRvbi10b01lbnUuc3ZnXCIsICAgICAgICAgICAgIC8vMTJcclxuICBcImltZy9wYXVzZV9fYmcuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgICAgLy8xM1xyXG4gIFwiaW1nL3BhdXNlX190ZXh0LnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgICAvLzE0XHJcblxyXG4gIFwiaW1nL3dpbl9fYnV0dG9uLW5leHQuc3ZnXCIsICAgICAgICAgICAgICAgICAvLzE1XHJcbiAgXCJpbWcvd2luX19iZy5zdmdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vMTZcclxuXHJcbiAgXCJpbWcvbGV2ZWxzX19idXR0b24tbGV2ZWxzLnN2Z1wiLCAgICAgICAgICAgIC8vMTdcclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi1uZXh0LnN2Z1wiLCAgICAgICAgICAgICAgLy8xOFxyXG4gIFwiaW1nL2xldmVsc19fYnV0dG9uLXByZXYuc3ZnXCIsICAgICAgICAgICAgICAvLzE5XHJcbiAgXCJpbWcvbGV2ZWxzX19idXR0b24tdG9NZW51LnN2Z1wiLCAgICAgICAgICAgIC8vMjBcclxuXHJcbiAgXCJpbWcvaG92ZXJzL21lbnVfX2J1dHRvbi1tZW51X2hvdmVyLnN2Z1wiLCAgICAgICAvLzIxXHJcbiAgXCJpbWcvaG92ZXJzL2dhbWVfX2J1dHRvbi1mdWxsc2NyZWVuX2hvdmVyLnN2Z1wiLCAvLzIyXHJcbiAgXCJpbWcvaG92ZXJzL2dhbWVfX2J1dHRvbi1wYXVzZV9ob3Zlci5zdmdcIiwgICAgICAvLzIzXHJcbiAgXCJpbWcvaG92ZXJzL3BhdXNlX19idXR0b24tY2xvc2VfaG92ZXIuc3ZnXCIsICAgICAvLzI0XHJcbiAgXCJpbWcvaG92ZXJzL3BhdXNlX19idXR0b24tcmVzdGFydF9ob3Zlci5zdmdcIiwgICAvLzI1XHJcbiAgXCJpbWcvaG92ZXJzL3BhdXNlX19idXR0b24tdG9NZW51X2hvdmVyLnN2Z1wiLCAgICAvLzI2XHJcbiAgXCJpbWcvaG92ZXJzL2xldmVsc19fYnV0dG9uLWxldmVsc19ob3Zlci5zdmdcIiwgICAvLzI3XHJcbiAgXCJpbWcvaG92ZXJzL2xldmVsc19fYnV0dG9uLXRvTWVudV9ob3Zlci5zdmdcIiwgICAvLzI4XHJcbiAgXCJpbWcvaG92ZXJzL3dpbl9fYnV0dG9uLW5leHRfaG92ZXIuc3ZnXCIgICAgICAgICAvLzI5XHJcblxyXG5dKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcbiAgcmVzb3Vyc2VzIDogcmVzb3Vyc2VzLFxyXG5cclxuICBhcnJWaWRlb3MgOiBhcnJWaWRlb3MsXHJcblxyXG4gIGFyckltYWdlcyA6IGFyckltYWdlcyxcclxuXHJcbiAgYXJyQXVkaW8gIDogYXJyQXVkaW9cclxuXHJcbn07XHJcblxyXG5cclxuIiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBnYW1lID0gcmVxdWlyZSgnLi9fZ2FtZUxvb3BzLmpzJyk7XHJcblxyXG52YXIgcGF1c2UgPSAwO1xyXG52YXIgYmVnaW5UaW1lID0gMDtcclxudmFyIGN1cnJlbnRUaW1lID0gMDtcclxudmFyIHVwVGltZVRPO1xyXG5cclxuZnVuY3Rpb24gdXBUaW1lKGNvdW50RnJvbSkge1xyXG5cdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG5cdHZhciBkaWZmZXJlbmNlID0gKG5vdy1jb3VudEZyb20gKyBjdXJyZW50VGltZSk7XHJcblxyXG5cdHZhciBob3Vycz1NYXRoLmZsb29yKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSkvKDYwKjYwKjEwMDApKjEpO1xyXG5cdHZhciBtaW5zPU1hdGguZmxvb3IoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKS8oNjAqMTAwMCkqMSk7XHJcblx0dmFyIHNlY3M9TWF0aC5mbG9vcigoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKSUoNjAqMTAwMCkpLzEwMDAqMSk7XHJcblxyXG5cdGhvdXJzID0gKCBob3VycyA8IDEwKSA/IFwiMFwiK2hvdXJzIDogaG91cnM7XHJcblx0bWlucyA9ICggbWlucyA8IDEwKSA/IFwiMFwiK21pbnMgOiBtaW5zO1xyXG5cdHNlY3MgPSAoIHNlY3MgPCAxMCkgPyBcIjBcIitzZWNzIDogc2VjcztcclxuXHJcblx0by5zdG9wV2F0Y2gudHh0ID0gaG91cnMrXCIgOiBcIittaW5zK1wiIDogXCIrc2VjcztcclxuXHJcblx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR1cFRpbWVUTz1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHVwVGltZShjb3VudEZyb20pOyB9LDEwMDAvNjApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRzdGFydCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly8gaWYgKGdhbWUuc3RhdHVzID09ICdnYW1lJyB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibWVudVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJwYXVzZVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJsZXZlbHNcIikge1xyXG5cdFx0XHR1cFRpbWUobmV3IERhdGUoKSk7XHJcblx0XHRcdHZhciBub3dUID0gbmV3IERhdGUoKTtcclxuXHRcdFx0YmVnaW5UaW1lID0gbm93VC5nZXRUaW1lKCk7XHJcblx0XHQvLyB9IGVsc2Uge1xyXG5cdFx0Ly8gXHR0aGlzLnJlc2V0KCk7XHJcblx0XHQvLyB9O1xyXG5cdH0sXHJcblxyXG5cdHJlc2V0IDogZnVuY3Rpb24oKSB7XHJcblx0XHRjdXJyZW50VGltZSA9IDA7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cclxuXHRcdG8uc3RvcFdhdGNoLnR4dCA9IFwiMDAgOiAwMCA6IDAwXCI7XHJcblx0XHQvLyB0aGlzLnN0YXJ0KCk7XHJcblx0fSxcclxuXHJcblx0cGF1c2VUaW1lciA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY3VyRGF0YSA9IG5ldyBEYXRlKCk7XHJcblx0XHRjdXJyZW50VGltZSA9IGN1ckRhdGEuZ2V0VGltZSgpIC0gYmVnaW5UaW1lICsgY3VycmVudFRpbWU7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdH1cclxuXHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBBdWRpbyA9IGZ1bmN0aW9uKGF1ZGlvLCB2b2x1bWUpeyBcclxuXHJcblx0dGhpcy5hID0gYXVkaW87XHJcblx0dGhpcy5hLnZvbHVtZSA9IHZvbHVtZSB8fCAxO1xyXG5cdHRoaXMuc3RhdGUgPSBcInN0b3BcIjtcclxuXHJcblx0dGhpcy5wbGF5ID0gZnVuY3Rpb24oZG9udFN0b3Ape1xyXG5cdFx0aWYgKCB0aGlzLnN0YXRlID09IFwicGxheVwiICYmIGRvbnRTdG9wICl7XHRcdFx0Ly/QtdGB0LvQuCDQtdGJ0LUg0L3QtSDQt9Cw0LrQvtC90YfQuNC70YHRjyDQv9GA0LXQtNGL0LTRg9GJ0LjQuSDRjdGC0L7RgiDQt9Cy0YPQuiwg0YLQviDRgdC+0LfQtNCw0LXQvCDQvdC+0LLRi9C5INC30LLRg9C6INC4INCy0L7RgdC/0YDQvtC40LfQstC+0LTQuNC8INC10LPQviwg0L3QtSDQvNC10YjQsNGPINCy0L7RgdC/0YDQvtC40LfQstC10LTQtdC90LjRjiDQv9GA0LXQtNGL0LTRg9GJ0LXQs9C+LlxyXG5cdFx0XHR2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiKTtcclxuXHRcdFx0YS5zcmMgPSB0aGlzLmEuc3JjO1xyXG5cdFx0XHRhLnZvbHVtZSA9IHRoaXMuYS52b2x1bWU7XHJcblx0XHRcdGEucGxheSgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5hLnBsYXkoKTtcclxuXHRcdFx0dGhpcy5zdGF0ZSA9IFwicGxheVwiO1xyXG5cdFx0XHR0aGlzLmEub25lbmRlZCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0dGhpcy5zdGF0ZSA9IFwic3RvcFwiO1xyXG5cdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHR9O1xyXG5cdH07XHJcblxyXG5cdHRoaXMucGF1c2UgPSBmdW5jdGlvbigpe1xyXG5cdFx0dGhpcy5hLnBhdXNlKCk7XHJcblx0XHR0aGlzLnN0YXRlID0gXCJwYXVzZVwiO1xyXG5cdH07XHJcblxyXG5cdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLmEucGF1c2UoKTtcclxuXHRcdHRoaXMuYS5jdXJyZW50VGltZSA9IDA7XHJcblx0XHR0aGlzLnN0YXRlID0gXCJzdG9wXCI7XHJcblx0fTtcclxuXHJcblx0dGhpcy5zZXRWb2x1bWUgPSBmdW5jdGlvbih2b2x1bWUpe1xyXG5cdFx0dGhpcy5hLnZvbHVtZSA9IHZvbHVtZTtcclxuXHR9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbiA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCB0eHQsIG5hbWUsIGZTaXplLCBmb250RmFtKXtcclxuICBcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuICB0aGlzLnR4dCA9IHR4dDtcclxuICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIHRoaXMuZlNpemUgPSBmU2l6ZTtcclxuICB0aGlzLnR4dENvbG9yID0gXCJ3aGl0ZVwiO1xyXG4gIHRoaXMuZm9udEZhbSA9IGZvbnRGYW0gfHwgXCJBcmlhbFwiO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbihub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gICAgdmFyIF9wYWRkID0gcGFkZCB8fCA1O1xyXG4gICAgdmFyIF94ID0gKCAhbm9DZW50ZXIgKSA/IHRoaXMueCt0aGlzLncvMiA6IHRoaXMueCtfcGFkZDtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIW5vQ2VudGVyICkgPyBcImNlbnRlclwiIDogXCJzdGFydFwiO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZTaXplICsgJ3B4ICcrdGhpcy5mb250RmFtO1xyXG4gICAgY3R4LnRleHRCYXNlbGluZT1cIm1pZGRsZVwiOyBcclxuICAgIGN0eC5maWxsVGV4dCh0aGlzLnR4dCwgX3gsIHRoaXMueSt0aGlzLmgvMik7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZSA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCwgb3BhY2l0eSl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy5vcGFjaXR5ID0gb3BhY2l0eSB8fCAxO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5nbG9iYWxBbHBoYSA9IHRoaXMub3BhY2l0eTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcblxyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltZ0J1dHRvbiA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCwgdHh0LCBuYW1lLCBmU2l6ZSwgc2V0Q2VudGVyLCBub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcbiAgdGhpcy50eHRDb2xvciA9IFwid2hpdGVcIjtcclxuICB0aGlzLnNldENlbnRlciA9IHNldENlbnRlciB8fCB0aGlzLng7XHJcbiAgdGhpcy5ub0NlbnRlciA9IG5vQ2VudGVyIHx8IGZhbHNlO1xyXG4gIHRoaXMucGFkZCA9IHBhZGQgfHwgNTtcclxuICB0aGlzLmhvdmVySW1nID0gZmFsc2U7XHJcblxyXG4gIHZhciBtZXRyaWNzID0gY3R4Lm1lYXN1cmVUZXh0KHRoaXMudHh0KS53aWR0aDsgLy/RgNCw0LfQvNC10YAt0YjQuNGA0LjQvdCwINC/0LXRgNC10LTQsNCy0LDQtdC80L7Qs9C+INGC0LXQutGB0YLQsFxyXG4gIHZhciBfeCA9ICggIXRoaXMubm9DZW50ZXIgKSA/IHRoaXMuc2V0Q2VudGVyK3RoaXMudy8yIDogdGhpcy54K3RoaXMucGFkZDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIXRoaXMubm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggY2FwdHVyZV9pdCc7XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxuICB2YXIgX2ltZyA9IGZhbHNlOyAvL9Cx0YPQtNC10YIg0YXRgNCw0L3QuNGC0Ywg0LLRgNC10LzQtdC90L3QviDQutCw0YDRgtC40L3QutGDINGB0YLQsNC90LTQsNGA0YLQvdGD0Y4uXHJcblxyXG4gIHRoaXMuaG92ZXIgPSBmdW5jdGlvbihkcmF3KXtcclxuXHJcbiAgICBpZiAoZHJhdyAmJiB0aGlzLmhvdmVySW1nKSB7ICAgICAgICAgICAgIC8v0LXRgdC70Lgg0L/QtdGA0LXQtNCw0LvQuCDQuNGB0YLQuNC90YMg0Lgg0YXQvtCy0LXRgCDRgyDRjdGC0L7Qs9C+INC+0LHRitC10LrRgtCwINC10YHRgtGMLCDRgtC+INC+0YLRgNC40YHQvtCy0YvQstCw0LXQvCDRhdC+0LLQtdGAXHJcbiAgICAgIGlmICghX2ltZykgX2ltZyA9IHRoaXMuaW1nOyAgICAgICAgICAgIC8vINC10YHQu9C4INC10YnQtSDQvdC1INCx0YvQu9CwINGB0L7RhdGA0LDQvdC10L3QsCDRgdGC0LDQvdC00LDRgNGC0L3QsNGPINC60LDRgNGC0LjQvdC60LAsINGC0L4g0YHQvtGF0YDQsNC90Y/QtdC8INC4Li5cclxuICAgICAgdGhpcy5pbWcgPSB0aGlzLmhvdmVySW1nOyAgICAgICAgICAgICAgLy8uLtC90L7QstC+0Lkg0LHRg9C00LXRgiDQstGL0LLQvtC00LjRgtGB0Y8g0L/QtdGA0LXQtNCw0L3QvdCw0Y9cclxuICAgICAgY252LnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiOyAgICAgICAgICAvL9C4INC60YPRgNGB0L7RgCDQsdGD0LTQtdGCINC/0L7QuNC90YLQtdGAXHJcbiAgICB9IGVsc2UgaWYgKCBfaW1nICYmIF9pbWcgIT0gdGhpcy5pbWcpeyAgIC8v0LjQvdCw0YfQtSDQtdGB0LvQuCDQsdGL0LvQsCDRgdC+0YXRgNCw0L3QtdC90LAg0LrQsNGA0YLQuNC90LrQsCDQuCDQvdC1INC+0L3QsCDQsiDQtNCw0L3QvdGL0Lkg0LzQvtC80LXQvdGCINC+0YLRgNC40YHQvtCy0YvQstCw0LXRgtGB0Y8sINGC0L5cclxuICAgICAgdGhpcy5pbWcgPSBfaW1nOyAgICAgICAgICAgICAgICAgICAgICAgLy/QstC+0LfQstGA0LDRidCw0LXQvCDRgdGC0LDQvdC00LDRgNGCINC60LDRgNGC0LjQvdC60YMg0L3QsCDQvNC10YHRgtC+XHJcbiAgICAgIGNudi5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjsgICAgICAgICAgLy/QuCDQutGD0YDRgdC+0YAg0LTQtdC70LDQtdC8INGB0YLQsNC90LTQsNGA0YLQvdGL0LxcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlhYmxlID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3QgPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvciwgaXNTdHJva2UpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMuaXNTdHJva2UgPSBpc1N0cm9rZSB8fCBmYWxzZTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGlmICghdGhpcy5pc1N0cm9rZSkge1xyXG4gICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICBjdHguc3Ryb2tlUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5tb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHN3aXRjaChkaXJlY3Rpb24pe1xyXG4gICAgICBjYXNlIFwidXBcIiA6IFxyXG4gICAgICB0aGlzLnkgLT0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJkb3duXCIgOiBcclxuICAgICAgdGhpcy55ICs9IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwibGVmdFwiIDpcclxuICAgICAgdGhpcy54IC09IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwicmlnaHRcIiA6IFxyXG4gICAgICB0aGlzLnggKz0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpXHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFZpZGVvID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgdmlkZW8pe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMudmlkZW8gPSB2aWRlbztcclxuXHJcbiAgdmFyIHNhdmUgPSBmYWxzZTtcclxuICB2YXIgYnVmQ252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICB2YXIgYnVmQ3R4ID0gYnVmQ252LmdldENvbnRleHQoXCIyZFwiKTtcclxuICBidWZDbnYud2lkdGggPSBDLldJRFRIO1xyXG4gIGJ1ZkNudi5oZWlnaHQgPSBDLkhFSUdIVDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLnZpZGVvKSB7XHJcbiAgICAgIGlmICggIXNhdmUgKXtcclxuICAgICAgICBidWZDdHguZHJhd0ltYWdlKHRoaXMudmlkZW8sIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgICAgc2F2ZSA9IHRydWU7XHJcbiAgICAgIH07XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLnZpZGVvLnBsYXkoKTtcclxuICAgICAgY2FudmFzLmN0eC5kcmF3SW1hZ2UoYnVmQ252LCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgICBjYW52YXMuY3R4LmRyYXdJbWFnZSh0aGlzLnZpZGVvLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIH07XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdhbGwgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKSxcclxuQXVkaW8gICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0F1ZGlvLmpzJyksXHJcblBsYXllYmxlICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9QbGF5YWJsZS5qcycpLFxyXG5XYWxsICAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvV2FsbC5qcycpLFxyXG5JbWdCdXR0b24gPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1nQnV0dG9uLmpzJyksXHJcblZpZGVvICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9WaWRlby5qcycpLFxyXG5CdXR0b24gICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvQnV0dG9uLmpzJyksXHJcblJlY3QgICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9SZWN0LmpzJyksXHJcbkltYWdlICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWFnZS5qcycpLFxyXG5DICAgICAgICAgPSByZXF1aXJlKCcuL19jb25zdC5qcycpLFxyXG5ldmVudHMgICAgPSByZXF1aXJlKCcuL19ldmVudHMuanMnKSxcclxubGV2ZWxzICAgID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyksXHJcbm8gICAgICAgICA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKSxcclxuY252cyAgICAgID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyksXHJcbmtleSBcdCAgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxuXHJcbmVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubG9hZGVyKTtcclxuXHJcblxyXG4vLyDQvNGD0LfRi9C60YMg0LPRgNC+0LzQutC+0YHRgtGMINC+0YLRgNC10LPRg9C70LjRgNC+0LLQsNGC0YwsINC90LDQudGC0Lgg0YfQtS3QvdC40YLRjCDQtNGA0YPQs9C+0LUg0LTQu9GPINC80LXQvdGOXHJcbi8vINGF0L7QstC10YDRiyDQt9Cw0L/QuNC70LjRgtGMINCyINC60LvQsNGB0YHRiy5cclxuXHJcblxyXG5cclxuLy8g0L3QsNGB0YLRgNC+0LnQutC4IC0g0YjQvtCxINGC0LDQvCDRg9C/0YDQsNCy0LvRj9GC0Ywg0YDQsNC30LzQtdGA0LDQvNC4INC90LDQstC10YDQvdC+0LUuLiDRhdC3INC/0L7QutCwLCDQvNGD0LfRi9C60L7QuSDRg9C/0YDQsNCy0LvRj9GC0YwhISFcclxuLy8g0YjRgNC40YTRgiDQvdCw0LTQviDQv9C+0LTQs9GA0YPQttCw0YLRjCDRgNCw0L3QtdC1LCDQvdCw0L/RgNC40LzQtdGAINC+0YLRgNC40YHQvtCy0LDRgtGMINC10LPQviDQsiDQv9GA0LXQu9C+0LnQtNC10YDQtSDQvdC10LLQuNC00LjQvNC+LlxyXG4vLyDRhdCw0LnQtNC40YLRjCDQutC90L7Qv9C60Lgg0LIg0LLRi9Cx0L7RgNC1INGD0YDQvtCy0L3RjyJdfQ==
