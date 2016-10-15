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

  a.player.play(1);               //озвучка движения
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
      ( isCursorInButton(x,y,o.bPause) )   ? o.bPause.hover(1)   : o.bPause.hover();

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
        ( isCursorInButton(x,y,o.levelsFooter[i]) )   ? o.levelsFooter[i].hover(1)   : o.levelsFooter[i].hover();
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
    menu.push( new ImgButton( res.arrImages[0], res.arrImages[21], _x, _y+i*85, 300, 60, txt[i], names[i], _fontsize, 83 ) );
  };

  return menu;
};

function createWinPopUp(){             //создаем победную вспллывашку

  var winPopBG      = new Image( res.arrImages[16], C.WIDTH/2-320/2, C.HEIGHT/2-200/2, 320, 200);
  var bPopExit      = new ImgButton( res.arrImages[12], res.arrImages[26], winPopBG.x+30,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_exit", 0 );
  var bPopNext      = new ImgButton( res.arrImages[15], res.arrImages[29], winPopBG.x+30+110+80,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_next", 0 );
  var winText       = new Button( C.WIDTH/2-90/2, winPopBG.y+15, 90, 40, "transparent", "Уровень N", "win_text", 30, "Buccaneer" );
  var winText_2     = new Button( C.WIDTH/2-90/2+10, winPopBG.y+80, 90, 40, "transparent", "ПРОЙДЕН!", "win_text_2", 50, "aZZ_Tribute_Bold" );

  winText.txtColor = "#D9C425";

  var winPopUp = [];
  winPopUp.push(winPopBG, bPopExit, bPopNext, winText, winText_2);

  return winPopUp;
};

function createPausePopUp(){           //создаем пауз всплывашку

  var pausePopUp = [];
  var bgPause          = new Image( res.arrImages[13], C.WIDTH/2-300/2, C.HEIGHT/2-207/2, 300, 207);
  var bReturn          = new ImgButton( res.arrImages[10], res.arrImages[24], bgPause.x+190,  bgPause.y-25, 63, 57, "", "return", 0 );
  var bExitToMenu      = new ImgButton( res.arrImages[12], res.arrImages[26], bgPause.x+50,  bgPause.y+bgPause.h-50, 85, 70, "", "exit", 0 );
  var bRestart         = new ImgButton( res.arrImages[11], res.arrImages[25], bgPause.x+50+30+85,  bgPause.y+bgPause.h-50, 85, 70, "", "restart", 0 );
  var pauseText        = new Image( res.arrImages[14], bgPause.x + bgPause.w/2 - 150/2, bgPause.y + bgPause.h/2 - 100/2, 150, 100);

  pausePopUp.push(bgPause, bReturn, bExitToMenu, bRestart, pauseText);

  return pausePopUp;
};

function createLevelsButtons(levels_count){ //создаем кнопки в выборе уровня

  var bLevelsButtons = [];
  var j = 0, dy = 85, dx = 0;

  for ( i=0; i < levels_count; i++){
    dx = 8+j*(100+15);

    bLevelsButtons.push( new ImgButton( res.arrImages[17], res.arrImages[27], dx, dy, 100, 100, i+1, "level_"+(i+1), 35 ) );

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

  var bPrev   = new ImgButton( res.arrImages[19], false, 20, C.HEIGHT-10-67, 40, 67, "", "prev", 0 );
  var bNext   = new ImgButton( res.arrImages[18], false, C.WIDTH-20-40, C.HEIGHT-10-67, 40, 67, "", "next", 0 );
  var bToMenu = new ImgButton( res.arrImages[20], res.arrImages[28], C.WIDTH/2 - 320/2, C.HEIGHT-10-67, 320, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.txtColor = "#000046";

  levelsFooter.push(bPrev,bNext,bToMenu);

  return levelsFooter;
};

function createPlayer(){               //создаем игрока с уникальными методами

  var player = new Playable(res.arrImages[9],0,0,50,50);
  player.direction = false;
  player.isMove    = false;

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
var logo = new ImgButton( res.arrImages[1], false, C.WIDTH/2-450/2, 20, 450, 150, "", "logo", 0 );
var menu = createMenu(["Играть", "Уровни", "Настройки"],["play", "change_level", "options"]);


//background 
var matrix    = createMatrixBG();         //bg уровня
var bgLevel   = new Image( res.arrImages[8], 0, 0, C.WIDTH, C.HEIGHT );
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//game header
var header    = new Image( res.arrImages[2], 0, 0, C.WIDTH, 71+C.PDNG );
var bFullScr  = new ImgButton( res.arrImages[3], res.arrImages[22], C.WIDTH-45-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "fullScr", 0 );
var stopWatch = new Button( 10, header.h/2-C.CNV_BORDER/2 - 40/2, 120, 40, "transparent", "00 : 00 : 00", "stopwatch", 25, "dited" );
var bPause    = new ImgButton( res.arrImages[4], res.arrImages[23], C.WIDTH-45-7-bFullScr.w-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "pause", 0 );
var currLevel = new Button( (stopWatch.x+stopWatch.w+bPause.x)/2-140/2, header.h/2-C.CNV_BORDER/2 - 40/2, 140, 40, "transparent", "Уровень", "curr_level", 25, "capture_it" );


//change level
var levelsHeader   = new ImgButton( res.arrImages[2], false, 0, 0, C.WIDTH, 71+C.PDNG, "Выбор уровня", "levels_header", 25 );
var bLevelsButtons = createLevelsButtons(5);
var levelsFooter   = createLevelsFooter();


//win pop-up
var winPopUp   = createWinPopUp();


//pause pop-up
var pausePopUp = createPausePopUp();


//playable obj
var pl    = createPlayer();                           //персонаж
var box   = new Playable(res.arrImages[6],0,0,50,50); //бокс
var door  = new Playable(res.arrImages[7],0,0,50,50); //дверь
var walls = [];                                       //стены на уровне, заполняется выбранным уровнем.


//video
var animateBg     = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[0]);
var videoBgLevels = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[1]);


//audio
var audio = {

  button   : new Audio(res.arrAudio[0], 0.5),
  win      : new Audio(res.arrAudio[1], 0.5),
  player   : new Audio(res.arrAudio[2], 0.25),
  crystal  : new Audio(res.arrAudio[3], 0.25),
  bgInGame : new Audio(res.arrAudio[4], 0.5),
  bgInMenu : new Audio(res.arrAudio[5], 0.5),
};


module.exports = objects = {

  matrix         : matrix,
  logo           : logo,
  menu           : menu,
  header         : header,
  stopWatch      : stopWatch,
  bPause         : bPause,
  bFullScr       : bFullScr,
  pl             : pl,
  box            : box,
  door           : door,
  walls          : walls,
  bgLevel        : bgLevel,
  winPopUp       : winPopUp,
  pausePopUp     : pausePopUp,
  bgOpacity      : bgOpacity,
  currLevel      : currLevel,
  levelsHeader   : levelsHeader,
  bLevelsButtons : bLevelsButtons,
  levelsFooter   : levelsFooter,
  animateBg      : animateBg,
  videoBgLevels  : videoBgLevels,
  audio          : audio
  
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

module.exports = ImgButton = function(img, hoverImg, x, y, w, h, txt, name, fSize, setCenter, noCenter, padd){

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
  this.hoverImg = hoverImg;

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


// настройки - шоб там управлять размерами наверное.. хз пока, музыкой управлять!!!
// шрифт надо подгружать ранее, например отрисовать его в прелойдере невидимо.



// хайдить кнопки в выборе уровня
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Audio.js":14,"./classes/Button.js":15,"./classes/Image.js":16,"./classes/ImgButton.js":17,"./classes/Playable.js":18,"./classes/Rect.js":19,"./classes/Video.js":20,"./classes/Wall.js":21}]},{},[22])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcHJlbG9hZGVyLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3Jlc291cnNlcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19zdG9wd2F0Y2guanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0F1ZGlvLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9CdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0ltYWdlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWdCdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1BsYXlhYmxlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9SZWN0LmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9WaWRlby5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvV2FsbC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2Zha2VfNWJjZTkxYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIGNudiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG52YXIgY3R4ID0gY252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbmNudi5zdHlsZS5ib3JkZXIgPSBcIjJweCBzb2xpZCBibGFja1wiO1xyXG5jbnYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ3aGl0ZVwiO1xyXG5jbnYud2lkdGggPSBDLldJRFRIO1xyXG5jbnYuaGVpZ2h0ID0gQy5IRUlHSFQ7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Y252IDogY252LFxyXG5cclxuXHRjdHggOiBjdHhcclxuXHJcbn07IiwidmFyIFBBREQgPSAxOyBcdFx0XHRcdFx0XHQvL9C/0LDQtNC00LjQvdCzLCDQutC+0YLQvtGA0YvQuSDRjyDRhdC+0YfRgyDRh9GC0L7QsdGLINCx0YvQuywg0LzQtdC2INC60LLQsNC00YDQsNGC0LDQvNC4XHJcbnZhciBXSURUSCA9IFBBREQgKyAoUEFERCs1MCkqOTsgXHQvL9GI0LjRgNC40L3QsCDQutCw0L3QstGLXHJcbnZhciBIRUlHSFQgPSAyMCtQQUREICsgKFBBREQrNTApKjEwOyAgIC8v0LLRi9GB0L7RgtCwINC60LDQvdCy0YtcclxudmFyIENOVl9CT1JERVIgPSAyO1xyXG52YXIgSEVBREVSX0ggPSA3MTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRQRE5HIDogUEFERCxcclxuXHJcblx0V0lEVEggOiBXSURUSCxcclxuXHJcblx0SEVJR0hUIDogSEVJR0hULFxyXG5cclxuXHRDTlZfQk9SREVSIDogQ05WX0JPUkRFUixcclxuXHJcblx0SEVBREVSX0ggOiBIRUFERVJfSFxyXG5cclxufTtcclxuIiwiLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4vLyAg0LrRgNC+0YHQsdGA0LDRg9C30LXRgNC90L7QtSDRg9C/0YDQstC70LXQvdC40LUg0YbQuNC60LvQsNC80Lgg0LjQs9GA0YtcclxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG52YXIgY2FudmFzID0gcmVxdWlyZShcIi4vX2NhbnZhcy5qc1wiKTtcclxuXHJcbnZhciBnYW1lRW5naW5lO1xyXG5cclxudmFyIG5leHRHYW1lU3RlcCA9IChmdW5jdGlvbigpe1xyXG5cdHJldHVybiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHR3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRvUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0bXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRmdW5jdGlvbiAoY2FsbGJhY2spe1xyXG5cdFx0c2V0SW50ZXJ2YWwoY2FsbGJhY2ssIDEwMDAvNjApXHJcblx0fTtcclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIGdhbWVFbmdpbmVTdGVwKCl7XHJcblx0Z2FtZUVuZ2luZSgpO1xyXG5cdG5leHRHYW1lU3RlcChnYW1lRW5naW5lU3RlcCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Z2FtZUVuZ2luZVN0YXJ0IDogZnVuY3Rpb24gKGNhbGxiYWNrKXtcclxuXHRcdGdhbWVFbmdpbmUgPSBjYWxsYmFjaztcclxuXHRcdGdhbWVFbmdpbmVTdGVwKCk7XHJcblx0fSxcclxuXHJcblx0c2V0R2FtZUVuZ2luZSA6IGZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuXHRcdGlmICggY2FudmFzLmNudi5zdHlsZS5jdXJzb3IgIT0gXCJkZWZhdWx0XCIgKSBjYW52YXMuY252LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiOyAgLy/QstGB0LXQs9C00LAg0L/RgNC4INC60LvQuNC60LUg0L3QsCDQu9GO0LHRg9GOINC60L3QvtC/0LrRgywg0YfRgtC+INCxINC60YPRgNGB0L7RgCDRgdGC0LDQvdC00LDRgNGC0LjQt9C40YDQvtCy0LDQu9GB0Y9cclxuXHRcdGdhbWVFbmdpbmUgPSBjYWxsYmFjaztcclxuXHR9XHJcblxyXG59O1xyXG4iLCJ2YXIgbyAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgc3cgICAgID0gcmVxdWlyZSgnLi9fc3RvcHdhdGNoLmpzJyk7XHJcbnZhciBsZXZlbHMgPSByZXF1aXJlKCcuL19sZXZlbHMuanMnKTtcclxudmFyIGVuZ2luICA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG52YXIgZ0xvbyAgID0gcmVxdWlyZSgnLi9fZ2FtZUxvb3BzLmpzJyk7XHJcbnZhciBoZiAgICAgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgZnMgICAgID0gcmVxdWlyZSgnLi9fZnVsbFNjcmVlbi5qcycpO1xyXG52YXIgQyAgICAgID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGtleSAgICA9IHJlcXVpcmUoJy4vX2tleS5qcycpO1xyXG52YXIgcmVzICAgID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG52YXIgYSA9IG8uYXVkaW87XHJcbnZhciBnYW1lTG9vcHMgPSBnTG9vO1xyXG5cclxudmFyIGlzQm9yZGVyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiDQvtCx0YrQtdC60YIsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC+0LzQuSDQs9GA0LDQvdC40YbRiyDQutCw0L3QstGLXHJcbiAgdXAgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai55ID09IDA7XHJcbiAgfSxcclxuXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnkgPT0gQy5IRUlHSFQgLSBvYmouaCAtIEMuUERORyAtIEMuSEVBREVSX0ggLSBDLlBETkc7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gMDtcclxuICB9LFxyXG5cclxuICByaWdodCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gQy5XSURUSCAtIG9iai53IC0gQy5QRE5HIC0gQy5QRE5HXHJcbiAgfVxyXG59O1xyXG5cclxudmFyIGlzTmVhciA9IHsgICAvL9C/0YDQuNC90LjQvNCw0LXRgiAyINC+0LHRitC10LrRgtCwLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvNC+0Lkg0YHRgtC+0YDQvtC90YsgMdGL0Lkg0L7RgiAy0LPQvi5cclxuXHJcbiAgdXAgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7ICAvL9C/0YDQvtCy0LXRgNC60LAg0L/QtdGA0LXQtNCw0LLQsNC10LzRi9C5INGN0LvQtdC80LXQvdGCINC80LDRgdGB0LjQsiDQvtCx0YrQtdC60YLQvtCyINC40LvQuCDQvtCx0YrQtdC60YIuXHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS55ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi55ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBkb3duIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnggKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnggKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH0sXHJcblxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gY2FuTW92ZU9iaihkaXJlY3Rpb24peyAgLy8o0L7Qv9C40YHRi9Cy0LDQtdC8INCz0YDQsNC90LjRhtGLINC00LLQuNC20LXQvdC40Y8pINGA0LDQt9GA0LXRiNCw0LXRgiDQtNCy0LjQttC10L3QuNC1INCyINC/0YDQtdC00LXQu9Cw0YUg0YPRgNC+0LLQvdGPXHJcblxyXG4gIGEucGxheWVyLnBsYXkoMSk7ICAgICAgICAgICAgICAgLy/QvtC30LLRg9GH0LrQsCDQtNCy0LjQttC10L3QuNGPXHJcbiAgby5wbC5kaXJlY3Rpb24gPSBvLnBsLmlzTW92ZSA9IGhmLmRpcmVjdGlvbklzKGRpcmVjdGlvbik7XHJcbiAgaWYgKCBpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5ib3gpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLmJveCwgby53YWxscykgKXsgICAgICAvL9C10YHQu9C4INGA0Y/QtNC+0Lwg0YEg0Y/RidC40LrQvtC8INC4INGP0YnQuNC6INC90LUg0YMg0LPRgNCw0L3QuNGGLCDQtNCy0LjQs9Cw0LXQvC5cclxuICAgIGEuY3J5c3RhbC5wbGF5KDEpOyAgICAgICAgICAgLy/QvtC30LLRg9GH0LrQsCDRgtC+0LvQutCw0L3QuNGPINC60YDQuNGB0YLQsNC70LvQsFxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgICBvLmJveC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfSBlbHNlIGlmKCAhaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby5ib3gpICYmICFpc0JvcmRlcltkaXJlY3Rpb25dKG8ucGwpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLndhbGxzKSApeyAvL9C10YHQu9C4INC90LUg0YDRj9C00L7QvCDRgSDRj9GJ0LjQutC+0Lwg0Lgg0L3QtSDRgNGP0LTQvtC8INGBINCz0YDQsNC90LjRhtC10LksINC00LLQuNCz0LDQtdC80YHRjy5cclxuICAgIG8ucGwubW92ZShkaXJlY3Rpb24pO1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGlzQ3Vyc29ySW5CdXR0b24oeCx5LGJ1dCl7IC8v0LLQvtC30LLRgNCw0YnQsNC10YIg0YLRgNGDLCDQtdGB0LvQuCDQutGD0YDRgdC+0YAg0L/QvtC/0LDQuyDQsiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvtCx0YrQtdC60YLQsFxyXG4gIHJldHVybiB4ID49IGJ1dC54ICYmIFxyXG4gIHggPD0gYnV0LngrYnV0LncgJiYgXHJcbiAgeSA+PSBidXQueSAmJiBcclxuICB5IDw9IGJ1dC55K2J1dC5oXHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkTGV2ZWwobnVtYmVyKXsgICAgICAgLy/Qt9Cw0LPRgNGD0LfQutCwINGD0YDQvtCy0L3Rj1xyXG4gIHN3LnN0YXJ0KCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAvL9C30LDQv9GD0YHQutCw0LXQvCDRgtCw0LnQvNC10YBcclxuICBsZXZlbHNbbnVtYmVyXSgpOyAgICAgICAgICAgICAgICAgICAgLy/Qt9Cw0L/Rg9GB0LrQsNC10Lwg0YPRgNC+0LLQtdGA0Ywg0LrQvtGC0L7RgNGL0Lkg0LfQsNC/0YDQvtGB0LjQu9C4XHJcbiAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9IG51bWJlcjsgICAgIC8v0LfQsNC/0L7QvNC40L3QsNC10Lwg0LrQsNC60L7QuSDRgdC10LnRh9Cw0YEg0YPRgNC+0LLQtdC90Ywg0LjQs9GA0LDRgtGMINCx0YPQtNC10LwgXHJcbiAgby5jdXJyTGV2ZWwudHh0ID0gXCLQo9GA0L7QstC10L3RjCBcIitudW1iZXI7IC8v0LIg0YXQtdC00LXRgNC1INCy0YvQstC+0LTQuNC8INC90L7QvNC10YAg0YPRgNC+0LLQvdGPXHJcbiAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMuZ2FtZSk7IC8v0L3RgyDQuCDQt9Cw0L/Rg9GB0LrQsNC10Lwg0YbQuNC60Lsg0LjQs9GA0YsgXHJcbn07XHJcblxyXG53aW5kb3cub25rZXlkb3duID0gZnVuY3Rpb24oZSl7ICAgLy/RgdC+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQutC70LDQstC40YhcclxuXHJcbiAgaWYgKCBnTG9vLnN0YXR1cyA9PSBcImdhbWVcIiApeyAvL9C/0LXRgNC10LTQstC40LPQsNGC0YzRgdGPINGC0L7Qu9GM0LrQviDQtdGB0LvQuCDQuNC00LXRgiDQuNCz0YDQsC5cclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJEXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcInJpZ2h0XCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIlNcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwiZG93blwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJXXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcInVwXCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIkFcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwibGVmdFwiKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgd2luZG93Lm9ua2V5dXAgPSBmdW5jdGlvbihlKXtcclxuICAgIG8ucGwuaXNNb3ZlID0gZmFsc2U7XHJcbiAgfTtcclxufTtcclxuXHJcbndpbmRvdy5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGUpeyAvL2PQvtCx0YvRgtC40LUg0L3QsNC20LDRgtC40Y8g0LzRi9GI0LrQuFxyXG5cclxuICBpZiAoIGZzLmlzRnVsbFNjcmVlbiApeyAgICAgIFxyXG4gICAgdmFyIHggPSAoZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQpL2ZzLnpvb207XHJcbiAgICB2YXIgeSA9IChlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wKS9mcy56b29tO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgeCA9IGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0O1xyXG4gICAgdmFyIHkgPSBlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wO1xyXG4gIH07XHJcblxyXG4gIHN3aXRjaCAoZ0xvby5zdGF0dXMpe1xyXG5cclxuICAgIGNhc2UgXCJtZW51XCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLm1lbnVbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInBsYXlcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICAgIGEuYmdJbk1lbnUuc3RvcCgpO1xyXG4gICAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJjaGFuZ2VfbGV2ZWxcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmxldmVscyk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwibGV2ZWxzXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmxldmVsc0Zvb3RlcltpXSkgKXtcclxuICAgICAgICAgIHN3aXRjaCAoby5sZXZlbHNGb290ZXJbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInByZXZcIiA6XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0L3QsNC30LDQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJ0b19tZW51XCIgOlxyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJuZXh0XCIgOlxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi0JrQvdC+0L/QutCwINCy0L/QtdGA0LXQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJMZXZlbHNCdXR0b25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJMZXZlbHNCdXR0b25zW2ldKSApe1xyXG4gICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgYS5iZ0luTWVudS5zdG9wKCk7XHJcbiAgICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsID0gaSsxO1xyXG4gICAgICAgICAgbG9hZExldmVsKGkrMSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImdhbWVcIiA6XHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iUGF1c2UpICl7XHJcbiAgICAgICAgYS5iZ0luR2FtZS5wYXVzZSgpO1xyXG4gICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICBzdy5wYXVzZVRpbWVyKCk7XHJcbiAgICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLnBhdXNlKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKXtcclxuICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgKCAhZnMuaXNGdWxsU2NyZWVuICkgPyBmcy5sYXVuY2hGdWxsU2NyZWVuKGNhbnZhcy5jbnYpIDogZnMuY2Fuc2VsRnVsbFNjcmVlbigpOyBcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcIndpblwiIDpcclxuXHJcbiAgICAgIGZvciAoIGkgaW4gby53aW5Qb3BVcCApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby53aW5Qb3BVcFtpXSkgKXtcclxuICAgICAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX2V4aXRcIiApe1xyXG4gICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgICAgIGEuYmdJbkdhbWUuc3RvcCgpO1xyXG4gICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCAhPSBsZXZlbHMubHZsc0NvdW50KCkgKXtcclxuICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsKys7XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcInBhdXNlXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5wYXVzZVBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgc3dpdGNoIChvLnBhdXNlUG9wVXBbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJldHVyblwiIDpcclxuICAgICAgICAgICAgICBzdy5zdGFydCgpO1xyXG4gICAgICAgICAgICAgIGEuYmdJbkdhbWUucGxheSgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmdhbWUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJlc3RhcnRcIiA6XHJcbiAgICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgICBhLmJnSW5HYW1lLnN0b3AoKTtcclxuICAgICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiZXhpdFwiIDpcclxuICAgICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgIGEuYmdJbkdhbWUuc3RvcCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZW1vdmUgPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjRjyDQtNCy0LjQttC10L3QuNGPINC80YvRiNC60LgsINGC0YPRgiDRhdC+0LLQtdGA0Ysg0L7QsdGA0LDQsdC+0YLQsNC10LxcclxuXHJcbiAgaWYgKCBmcy5pc0Z1bGxTY3JlZW4gKXtcclxuICAgIHZhciB4ID0gKGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0KS9mcy56b29tO1xyXG4gICAgdmFyIHkgPSAoZS5wYWdlWS1jYW52YXMuY252Lm9mZnNldFRvcCkvZnMuem9vbTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICAgIHZhciB5ID0gZS5wYWdlWS1jYW52YXMuY252Lm9mZnNldFRvcDtcclxuICB9O1xyXG5cclxuICBzd2l0Y2ggKGdMb28uc3RhdHVzKXtcclxuXHJcbiAgICBjYXNlIFwibWVudVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLm1lbnUgKXtcclxuICAgICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubWVudVtpXSkgKSA/IG8ubWVudVtpXS5ob3ZlcigxKSA6IG8ubWVudVtpXS5ob3ZlcigpO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiZ2FtZVwiIDpcclxuICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJQYXVzZSkgKSAgID8gby5iUGF1c2UuaG92ZXIoMSkgICA6IG8uYlBhdXNlLmhvdmVyKCk7XHJcblxyXG4gICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkZ1bGxTY3IpICkgPyBvLmJGdWxsU2NyLmhvdmVyKDEpIDogby5iRnVsbFNjci5ob3ZlcigpOyAgXHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJ3aW5cIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby53aW5Qb3BVcCApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby53aW5Qb3BVcFtpXSkgKXtcclxuICAgICAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX2V4aXRcIiApe1xyXG4gICAgICAgICAgICBvLndpblBvcFVwW2ldLmhvdmVyKDEpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX25leHRcIiAmJiBnYW1lTG9vcHMuY3VycmVudExldmVsICE9IGxldmVscy5sdmxzQ291bnQoKSApe1xyXG4gICAgICAgICAgICBvLndpblBvcFVwW2ldLmhvdmVyKDEpO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKCBvLndpblBvcFVwW2ldLmhvdmVyICkgby53aW5Qb3BVcFtpXS5ob3ZlcigpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJsZXZlbHNcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5sZXZlbHNGb290ZXIgKXtcclxuICAgICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubGV2ZWxzRm9vdGVyW2ldKSApICAgPyBvLmxldmVsc0Zvb3RlcltpXS5ob3ZlcigxKSAgIDogby5sZXZlbHNGb290ZXJbaV0uaG92ZXIoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG8uYkxldmVsc0J1dHRvbnMubGVuZ3RoOyBpKysgKXtcclxuICAgICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkxldmVsc0J1dHRvbnNbaV0pICkgPyBvLmJMZXZlbHNCdXR0b25zW2ldLmhvdmVyKDEpIDogby5iTGV2ZWxzQnV0dG9uc1tpXS5ob3ZlcigpO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICBcclxuICAgIGNhc2UgXCJwYXVzZVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ucGF1c2VQb3BVcFtpXSkgKXtcclxuICAgICAgICAgIGlmICggby5wYXVzZVBvcFVwW2ldLmhvdmVyICkgby5wYXVzZVBvcFVwW2ldLmhvdmVyKDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIG8ucGF1c2VQb3BVcFtpXS5ob3ZlciApIG8ucGF1c2VQb3BVcFtpXS5ob3ZlcigpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gIH07XHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgem9vbSA9IDA7XHJcblxyXG5mdW5jdGlvbiBmdWxsQ2FudmFzKCl7XHQvL9C60LDQvdCy0LAg0LLQviDQstC10YHRjCDRjdC60YDQsNC9XHJcblxyXG5cdHZhciBkZXZpY2VXaWR0aCA9IHdpbmRvdy5zY3JlZW4uYXZhaWxXaWR0aDtcclxuXHR2YXIgZGV2aWNlSGVpZ2h0ID0gd2luZG93LnNjcmVlbi5hdmFpbEhlaWdodDtcclxuXHRmdWxsU2NyZWVuLnpvb20gPSAoZGV2aWNlSGVpZ2h0IC8gQy5IRUlHSFQpLnRvRml4ZWQoMSk7XHQvL9C60LDQutC+0LUg0YPQstC10LvQuNGH0LXQvdC40LUg0YHQtNC10LvQsNGC0Ywg0LjRgdGF0L7QtNGPINC40Lcg0YDQsNC30LzQtdGA0L7QsiDRjdC60YDQsNC90LAuXHJcblxyXG5cdGNhbnZhcy5jbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoKmZ1bGxTY3JlZW4uem9vbTtcclxuXHRjYW52YXMuY252LmhlaWdodCA9IGNhbnZhcy5jbnYuaGVpZ2h0KmZ1bGxTY3JlZW4uem9vbTtcclxuXHRjYW52YXMuY3R4LnNjYWxlKGZ1bGxTY3JlZW4uem9vbSxmdWxsU2NyZWVuLnpvb20pO1xyXG5cclxuXHRmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbiA9ICFmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG5vcm1hbENhbnZhcygpe1x0Ly/QuNGB0YXQvtC00L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtSDQutCw0L3QstGLXHJcblxyXG5cdC8vY9C+0YXRgNCw0L3Rj9C10Lwg0L/QvtGB0LvQtdC00L3QuNC5INC60LDQtNGAINC40LPRgNGLLCDQtNCw0LHRiyDQv9GA0Lgg0LLQvtC30LLRgNCw0YnQtdC90LjQuCDRgNCw0LfQvNC10YDQsCDQv9C+0YHQu9C1INGE0YPQu9GB0LrRgNC40L3QsCwg0L7QvSDQvtGC0YDQuNGB0L7QstCw0LvRgdGPLCDQuNC90LDRh9C1INCx0YPQtNC10YIg0LHQtdC70YvQuSDRhdC+0LvRgdGCLlxyXG5cdHZhciBidWZDbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG5cdHZhciBidWZDdHggPSBidWZDbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdGJ1ZkNudi53aWR0aCA9IGNhbnZhcy5jbnYud2lkdGgvZnVsbFNjcmVlbi56b29tO1xyXG5cdGJ1ZkNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodC9mdWxsU2NyZWVuLnpvb207XHJcblx0YnVmQ3R4LmRyYXdJbWFnZShjYW52YXMuY252LCAwLDAsIGNhbnZhcy5jbnYud2lkdGgvZnVsbFNjcmVlbi56b29tLCBjYW52YXMuY252LmhlaWdodC9mdWxsU2NyZWVuLnpvb20pO1xyXG5cclxuXHRjYW52YXMuY252LndpZHRoID0gY2FudmFzLmNudi53aWR0aC9mdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodC9mdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmN0eC5zY2FsZSgxLDEpO1xyXG5cdGNhbnZhcy5jdHguZHJhd0ltYWdlKGJ1ZkNudiwwLDAsY2FudmFzLmNudi53aWR0aCxjYW52YXMuY252LmhlaWdodCk7XHJcblxyXG5cdGZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuID0gIWZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gb25GdWxsU2NyZWVuQ2hhbmdlKCl7XHQvL9C/0YDQuCDQuNC30LzQtdC90LjQuCDRgdC+0YHRgtC+0Y/QvdC40LUg0YTRg9C70YHQutGA0LjQvdCwXHJcblxyXG5cdCggZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW4gKSA/IG5vcm1hbENhbnZhcygpIDogZnVsbENhbnZhcygpO1xyXG59O1xyXG5cclxuY2FudmFzLmNudi5hZGRFdmVudExpc3RlbmVyKFwid2Via2l0ZnVsbHNjcmVlbmNoYW5nZVwiLCBvbkZ1bGxTY3JlZW5DaGFuZ2UpO1xyXG5jYW52YXMuY252LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3pmdWxsc2NyZWVuY2hhbmdlXCIsICAgIG9uRnVsbFNjcmVlbkNoYW5nZSk7XHJcbmNhbnZhcy5jbnYuYWRkRXZlbnRMaXN0ZW5lcihcImZ1bGxzY3JlZW5jaGFuZ2VcIiwgICAgICAgb25GdWxsU2NyZWVuQ2hhbmdlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVsbFNjcmVlbiA9IHsgXHJcblxyXG5cdGxhdW5jaEZ1bGxTY3JlZW4gOiBmdW5jdGlvbihlbGVtKXtcclxuXHJcblx0XHRpZiAoIGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5yZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZWxlbS5tb3pSZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLm1velJlcXVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRjYW5zZWxGdWxsU2NyZWVuIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHRpZiAoIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XHJcblx0XHR9O1xyXG5cdH0sXHJcblxyXG5cdGlzRnVsbFNjcmVlbiA6IGZhbHNlLFxyXG5cclxuXHR6b29tIDogem9vbVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyk7XHJcbnZhciByZXMgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxudmFyIHByZWxvYWRlciA9IHJlcXVpcmUoJy4vX3ByZWxvYWRlci5qcycpO1xyXG5cclxudmFyIGEgPSBvLmF1ZGlvO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnYW1lTG9vcHMgPSAge1xyXG5cclxuICBsb2FkZXIgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImxvYWRlclwiO1xyXG5cclxuICAgIHByZWxvYWRlci51cGRhdGVMb2FkZXIoKTtcclxuICAgIHByZWxvYWRlci5kcmF3TG9hZGVyKCk7XHJcbiAgICBwcmVsb2FkZXIuZHJhd0xvYWRUZXh0KCk7XHJcbiAgICBcclxuICAgIGlmICggcmVzLnJlc291cnNlcy5hcmVMb2FkZWQoKSApIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImdhbWVcIjsgXHJcblxyXG4gICAgaWYgKGEuYmdJbkdhbWUuc3RhdGUgPT0gXCJzdG9wXCIpIGEuYmdJbkdhbWUucGxheSgpO1xyXG5cclxuICAgIC8v0L7Rh9C40YHRgtC60LAg0L7QsdC70LDRgdGC0LhcclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0LHQsyDRg9GA0L7QstC90Y9cclxuICAgIG8uYmdMZXZlbC5kcmF3KCk7XHJcbiAgICBcclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINC80LDRgtGA0LjRh9C90L7QtSDQv9C+0LvQtSDQuNCz0YDRi1xyXG4gICAgZm9yICggaSBpbiBvLm1hdHJpeCApe1xyXG4gICAgICBvLm1hdHJpeFtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINGB0YLQtdC90YtcXNC/0YDQtdCz0YDQsNC00YtcclxuICAgIGZvciAoIGkgaW4gby53YWxscyApe1xyXG4gICAgICBvLndhbGxzW2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0YXQtdC00LXRgNCwINGD0YDQvtCy0L3Rj1xyXG4gICAgby5oZWFkZXIuZHJhdygpO1xyXG4gICAgby5zdG9wV2F0Y2guZHJhdygxLDEwKTtcclxuICAgIG8uYkZ1bGxTY3IuZHJhdygpO1xyXG4gICAgby5iUGF1c2UuZHJhdygpO1xyXG4gICAgby5jdXJyTGV2ZWwuZHJhdygpO1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINC40LPRgNC+0LLRi9GFINC+0LHRitC10LrRgtC+0LJcclxuICAgIG8uZG9vci5kcmF3KCk7XHJcbiAgICBvLnBsLmRyYXcoKTtcclxuICAgIG8uYm94LmRyYXcoKTtcclxuXHJcbiAgICAvL9C10YHQu9C4INC/0L7QsdC10LTQuNC70LhcclxuICAgIGlmICggaGYuaXNXaW4oKSApe1xyXG4gICAgICBvLmJnT3BhY2l0eS5kcmF3KCk7IC8v0L7RgtGA0LjRgdC+0LLQutCwINC30LDRgtC10LzQvdC10L3QuNGPXHJcbiAgICAgIGEud2luLnBsYXkoKTsgICAgICAgLy/QvtC30LLRg9GH0LrQsCDQv9C+0LHQtdC00LrQuFxyXG4gICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy53aW4pO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJtZW51XCI7XHJcblxyXG4gICAgaWYgKGEuYmdJbk1lbnUuc3RhdGUgPT0gXCJzdG9wXCIpIGEuYmdJbk1lbnUucGxheSgpO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby5hbmltYXRlQmcuZHJhdygpO1xyXG5cclxuICAgIG8ubG9nby5kcmF3KCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLm1lbnUgKXtcclxuICAgICAgby5tZW51W2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gIH0sXHJcblxyXG4gIHdpbiA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwid2luXCI7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwid2luX3RleHRcIiApIG8ud2luUG9wVXBbaV0udHh0ID0gXCLQo9GA0L7QstC10L3RjCBcIitnYW1lTG9vcHMuY3VycmVudExldmVsO1xyXG4gICAgICBcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPT0gbGV2ZWxzLmx2bHNDb3VudCgpICkge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG8ud2luUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgICB9ICBcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgcGF1c2UgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcInBhdXNlXCI7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgby5wYXVzZVBvcFVwW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgbGV2ZWxzIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJsZXZlbHNcIjtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8udmlkZW9CZ0xldmVscy5kcmF3KCk7XHJcblxyXG4gICAgby5sZXZlbHNIZWFkZXIuZHJhdygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5iTGV2ZWxzQnV0dG9ucyApe1xyXG4gICAgICBvLmJMZXZlbHNCdXR0b25zW2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICBvLmxldmVsc0Zvb3RlcltpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHN0YXR1cyA6IFwiXCIsXHJcblxyXG4gIGN1cnJlbnRMZXZlbCA6IFwiMVwiXHJcblxyXG59O1xyXG4iLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gIGNsZWFyUmVjdCA6IGZ1bmN0aW9uKHgseSx3LGgpeyAgICAgIC8v0L7Rh9C40YHRgtC40YLQtdC70YxcclxuICAgIGN0eC5jbGVhclJlY3QoeCx5LHcsaCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UmFuZG9tSW50IDogZnVuY3Rpb24obWluLCBtYXgpIHsgLy/RhNGD0L3QutGG0LjRjyDQtNC70Y8g0YDQsNC90LTQvtC80LAg0YbQtdC70L7Rh9C40YHQu9C10L3QvdC+0LPQviDQt9C90LDRh9C10L3QuNGPXHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxuICB9LFxyXG5cclxuICBpc1dpbiA6IGZ1bmN0aW9uKCl7ICAgICAgICAgICAgICAgICAvL9C/0L7QsdC10LTQuNC70Lg/XHJcbiAgICByZXR1cm4gby5ib3gueCA9PSBvLmRvb3IueCAmJiBvLmJveC55ID09IG8uZG9vci55O1xyXG4gIH0sXHJcblxyXG4gIGRpcmVjdGlvbklzIDogZnVuY3Rpb24oZGlyZWN0aW9uKXsgIC8v0LLQvtC30LLRgNCw0YnQsNC10YIg0YPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQsiDQs9GA0LDQtNGD0YHQsNGFLCDQvNC+0LbQvdC+INCx0YvQu9C+INC4INGB0LTQtdC70LDRgtGMINC/0YDQvtGJ0LUgLSDQvtCx0YrQtdC60YLQvtC8LlxyXG4gIFx0c3dpdGNoKGRpcmVjdGlvbil7XHJcblxyXG4gIFx0XHRjYXNlIFwidXBcIiAgIDogcmV0dXJuIDM2MDtcclxuICBcdFx0YnJlYWs7XHJcbiAgXHRcdGNhc2UgXCJkb3duXCIgOiByZXR1cm4gMTgwO1xyXG4gIFx0XHRicmVhaztcclxuICBcdFx0Y2FzZSBcImxlZnRcIiA6IHJldHVybiAyNzA7XHJcbiAgXHRcdGJyZWFrO1xyXG4gIFx0XHRjYXNlIFwicmlnaHRcIjogcmV0dXJuIDkwO1xyXG4gIFx0XHRicmVhaztcclxuXHJcbiAgXHR9O1xyXG4gIH1cclxufTtcclxuIiwidmFyIGtleXMgPSB7XHJcblx0XCJXXCIgOiA4NyxcclxuXHRcIlNcIiA6IDgzLFxyXG5cdFwiQVwiIDogNjUsXHJcblx0XCJEXCIgOiA2OFxyXG59O1xyXG5cclxudmFyIGtleURvd24gPSAwO1xyXG4vLyB2YXIga2V5RG93biA9IHt9O1xyXG5cclxuZnVuY3Rpb24gc2V0S2V5KGtleUNvZGUpe1xyXG5cdGtleURvd24gPSBrZXlDb2RlO1xyXG5cdC8vIGtleURvd25ba2V5Y29kZV0gPSB0cnVlO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY2xlYXJLZXkoa2V5Q29kZSl7XHJcblx0a2V5RG93biA9IDA7XHJcblx0Ly8ga2V5RG93bltrZXlDb2RlXSA9IGZhbHNlO1xyXG59O1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdHNldEtleShlLmtleUNvZGUpO1xyXG59KTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBmdW5jdGlvbihlKXtcclxuXHRjbGVhcktleShlLmtleUNvZGUpO1xyXG59KTtcclxuXHJcblxyXG5mdW5jdGlvbiBpc0tleURvd24oa2V5TmFtZSl7XHJcblx0cmV0dXJuIGtleURvd25ba2V5c1trZXlOYW1lXV0gPT0gdHJ1ZTtcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdGlzS2V5RG93biA6IGZ1bmN0aW9uKGtleU5hbWUpe1xyXG5cdFx0cmV0dXJuIGtleURvd24gPT0ga2V5c1trZXlOYW1lXTtcclxuXHRcdC8vIHJldHVybiBrZXlEb3duW2tleXNba2V5TmFtZV1dID09IHRydWU7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcbnZhciBoZiA9IHJlcXVpcmUoJy4vX2hlbHBlckZ1bmN0aW9ucy5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbHMgPSB7XHJcblxyXG5cdGx2bHNDb3VudCA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0Zm9yKGtleSBpbiBsZXZlbHMpeyBjb3VudCsrIH07XHJcblx0XHRcdHJldHVybiBjb3VudC0xO1xyXG5cdH0sXHJcblxyXG5cdDEgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIC8v0LzQsNGB0YHQuNCyINGBINCx0YPQtNGD0YnQtdC/0L7RgdGC0YDQvtC10L3QvdGL0LzQuCDRgdGC0LXQvdC60LDQvNC4XHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFsxLDNdLFsxLDRdLFsxLDVdLFsyLDBdLFsyLDZdLFsyLDhdLFszLDJdLFs0LDFdLFs0LDNdLFs0LDddLFs1LDRdLFs2LDRdLFs2LDZdLFs3LDFdLFs3LDhdLFs4LDBdLFs4LDRdLFs4LDVdXHJcblx0XHRdO1x0XHRcdFx0ICAvL9C/0YDQuNC00YPQvNCw0L3QvdGL0Lkg0LzQsNGB0YHQuNCyINGB0L4g0YHRgtC10L3QutCw0LzQuFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC80LDRgdGB0LjQsiB3YWxsc1xyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDAgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInJpZ2h0XCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsyKig1MCtDLlBETkcpLCA3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDIgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwwXSxbMCw0XSxbMCwzXSxbMCw2XSxbMiwyXSxbMiw0XSxbMyw4XSxbMywwXSxbMyw3XSxbNCwyXSxbNCw0XSxbNCw1XSxbNCw2XSxbNSwwXSxbNiwyXSxbNiw1XSxbNiw2XSxbNiw3XSxbNywwXSxbOCwzXSxbOCw0XSxbOCw3XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCs4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJyaWdodFwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArNiooNTArQy5QRE5HKSwgMCs3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCs2Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MyA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDJdLFswLDddLFsxLDVdLFsxLDhdLFsyLDJdLFsyLDddLFszLDRdLFs0LDFdLFs0LDRdLFs0LDZdLFs2LDJdLFs2LDNdLFs2LDRdLFs2LDZdLFs2LDhdLFs3LDBdLFs3LDVdLFs4LDBdLFs4LDFdLFs4LDNdLFs4LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwidXBcIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzEqKDUwK0MuUERORyksIDArNiooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzIqKDUwK0MuUERORyksIDArMyooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDQgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwxXSxbMSw1XSxbMSw3XSxbMiw0XSxbMywxXSxbMywzXSxbMyw2XSxbMyw4XSxbNCwzXSxbNSw1XSxbNSw3XSxbNiwwXSxbNiwyXSxbNiwzXSxbNiw1XSxbNyw4XSxbOCwwXSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInVwXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs2Kig1MCtDLlBETkcpLCAwKzAqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQ1IDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMV0sWzAsM10sWzAsNV0sWzAsOF0sWzIsMl0sWzIsNF0sWzIsNl0sWzIsOF0sWzQsMF0sWzQsM10sWzQsNV0sWzQsN10sWzYsMV0sWzYsMl0sWzYsNF0sWzYsN10sWzcsOF0sWzgsMl0sWzgsNF0sWzgsOF1cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDArMCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwiZG93blwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArMSooNTArQy5QRE5HKSwgMCsxKig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDAsIDArOCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGNudnMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1hdHJpeEJHKCl7ICAgICAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1XHJcbiAgdmFyIG1hdHJpeCA9IFtdOyAgICAgICAgICAgICAgICAgICAgIC8v0LzQsNGB0YHQuNCyINC00LvRjyDQvNCw0YLRgNC40YfQvdC+0LPQviDQstC40LTQsCDRg9GA0L7QstC90Y9cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspeyAgICAgICAgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC+0LHRitC10LrRglxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCA5OyBqKyspe1xyXG4gICAgICBtYXRyaXgucHVzaCggbmV3IFJlY3QoQy5QRE5HK2oqKDUwK0MuUERORyksIDcxK0MuUERORytpKig1MCtDLlBETkcpLCA1MCwgNTAsIFwicmdiYSgwLDAsMCwwLjUpXCIsIHRydWUpICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1hdHJpeFxyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWVudSh0eHRBcnIsIG5hbWVBcnIpeyAgLy/RgdC+0LfQtNCw0LXQvCDQs9C70LDQstC90L7QtSDQvNC10L3RjlxyXG4gIHZhciBtZW51ID0gW107XHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBhbW91bnRzID0gdHh0QXJyLmxlbmd0aDtcclxuICBcclxuICB2YXIgX2ZvbnRzaXplID0gXCIyOFwiO1xyXG4gIHZhciBfeCA9IEMuV0lEVEgvMi0zMDAvMjtcclxuICB2YXIgX3kgPSAoQy5IRUlHSFQvMikgLSAoODUqYW1vdW50cy8yKSArIDg1OyBcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbW91bnRzOyBpKyspe1xyXG4gICAgbWVudS5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzBdLCByZXMuYXJySW1hZ2VzWzIxXSwgX3gsIF95K2kqODUsIDMwMCwgNjAsIHR4dFtpXSwgbmFtZXNbaV0sIF9mb250c2l6ZSwgODMgKSApO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBtZW51O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlV2luUG9wVXAoKXsgICAgICAgICAgICAgLy/RgdC+0LfQtNCw0LXQvCDQv9C+0LHQtdC00L3Rg9GOINCy0YHQv9C70LvRi9Cy0LDRiNC60YNcclxuXHJcbiAgdmFyIHdpblBvcEJHICAgICAgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbMTZdLCBDLldJRFRILzItMzIwLzIsIEMuSEVJR0hULzItMjAwLzIsIDMyMCwgMjAwKTtcclxuICB2YXIgYlBvcEV4aXQgICAgICA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTJdLCByZXMuYXJySW1hZ2VzWzI2XSwgd2luUG9wQkcueCszMCwgIHdpblBvcEJHLnkrd2luUG9wQkcuaC01MCwgODAsIDY1LCBcIlwiLCBcInBvcF9leGl0XCIsIDAgKTtcclxuICB2YXIgYlBvcE5leHQgICAgICA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTVdLCByZXMuYXJySW1hZ2VzWzI5XSwgd2luUG9wQkcueCszMCsxMTArODAsICB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNTAsIDgwLCA2NSwgXCJcIiwgXCJwb3BfbmV4dFwiLCAwICk7XHJcbiAgdmFyIHdpblRleHQgICAgICAgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMiwgd2luUG9wQkcueSsxNSwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0KPRgNC+0LLQtdC90YwgTlwiLCBcIndpbl90ZXh0XCIsIDMwLCBcIkJ1Y2NhbmVlclwiICk7XHJcbiAgdmFyIHdpblRleHRfMiAgICAgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMisxMCwgd2luUG9wQkcueSs4MCwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0J/QoNCe0JnQlNCV0J0hXCIsIFwid2luX3RleHRfMlwiLCA1MCwgXCJhWlpfVHJpYnV0ZV9Cb2xkXCIgKTtcclxuXHJcbiAgd2luVGV4dC50eHRDb2xvciA9IFwiI0Q5QzQyNVwiO1xyXG5cclxuICB2YXIgd2luUG9wVXAgPSBbXTtcclxuICB3aW5Qb3BVcC5wdXNoKHdpblBvcEJHLCBiUG9wRXhpdCwgYlBvcE5leHQsIHdpblRleHQsIHdpblRleHRfMik7XHJcblxyXG4gIHJldHVybiB3aW5Qb3BVcDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVBhdXNlUG9wVXAoKXsgICAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0L/QsNGD0Lcg0LLRgdC/0LvRi9Cy0LDRiNC60YNcclxuXHJcbiAgdmFyIHBhdXNlUG9wVXAgPSBbXTtcclxuICB2YXIgYmdQYXVzZSAgICAgICAgICA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxM10sIEMuV0lEVEgvMi0zMDAvMiwgQy5IRUlHSFQvMi0yMDcvMiwgMzAwLCAyMDcpO1xyXG4gIHZhciBiUmV0dXJuICAgICAgICAgID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMF0sIHJlcy5hcnJJbWFnZXNbMjRdLCBiZ1BhdXNlLngrMTkwLCAgYmdQYXVzZS55LTI1LCA2MywgNTcsIFwiXCIsIFwicmV0dXJuXCIsIDAgKTtcclxuICB2YXIgYkV4aXRUb01lbnUgICAgICA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTJdLCByZXMuYXJySW1hZ2VzWzI2XSwgYmdQYXVzZS54KzUwLCAgYmdQYXVzZS55K2JnUGF1c2UuaC01MCwgODUsIDcwLCBcIlwiLCBcImV4aXRcIiwgMCApO1xyXG4gIHZhciBiUmVzdGFydCAgICAgICAgID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMV0sIHJlcy5hcnJJbWFnZXNbMjVdLCBiZ1BhdXNlLngrNTArMzArODUsICBiZ1BhdXNlLnkrYmdQYXVzZS5oLTUwLCA4NSwgNzAsIFwiXCIsIFwicmVzdGFydFwiLCAwICk7XHJcbiAgdmFyIHBhdXNlVGV4dCAgICAgICAgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbMTRdLCBiZ1BhdXNlLnggKyBiZ1BhdXNlLncvMiAtIDE1MC8yLCBiZ1BhdXNlLnkgKyBiZ1BhdXNlLmgvMiAtIDEwMC8yLCAxNTAsIDEwMCk7XHJcblxyXG4gIHBhdXNlUG9wVXAucHVzaChiZ1BhdXNlLCBiUmV0dXJuLCBiRXhpdFRvTWVudSwgYlJlc3RhcnQsIHBhdXNlVGV4dCk7XHJcblxyXG4gIHJldHVybiBwYXVzZVBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzQnV0dG9ucyhsZXZlbHNfY291bnQpeyAvL9GB0L7Qt9C00LDQtdC8INC60L3QvtC/0LrQuCDQsiDQstGL0LHQvtGA0LUg0YPRgNC+0LLQvdGPXHJcblxyXG4gIHZhciBiTGV2ZWxzQnV0dG9ucyA9IFtdO1xyXG4gIHZhciBqID0gMCwgZHkgPSA4NSwgZHggPSAwO1xyXG5cclxuICBmb3IgKCBpPTA7IGkgPCBsZXZlbHNfY291bnQ7IGkrKyl7XHJcbiAgICBkeCA9IDgraiooMTAwKzE1KTtcclxuXHJcbiAgICBiTGV2ZWxzQnV0dG9ucy5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE3XSwgcmVzLmFyckltYWdlc1syN10sIGR4LCBkeSwgMTAwLCAxMDAsIGkrMSwgXCJsZXZlbF9cIisoaSsxKSwgMzUgKSApO1xyXG5cclxuICAgIGorKztcclxuXHJcbiAgICBpZiAoIGR4ID4gQy5XSURUSC0xMTUgKXtcclxuICAgICAgZHkgKz0gKDEyNSk7XHJcbiAgICAgIGogPSAwO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYkxldmVsc0J1dHRvbnM7XHJcbn07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5mdW5jdGlvbiBjcmVhdGVMZXZlbHNGb290ZXIoKXsgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INGE0YPRgtC10YAg0LIg0LLRi9Cx0L7RgNC1INGD0YDQvtCy0L3Rj1xyXG5cclxuICB2YXIgbGV2ZWxzRm9vdGVyID0gW107XHJcblxyXG4gIHZhciBiUHJldiAgID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxOV0sIGZhbHNlLCAyMCwgQy5IRUlHSFQtMTAtNjcsIDQwLCA2NywgXCJcIiwgXCJwcmV2XCIsIDAgKTtcclxuICB2YXIgYk5leHQgICA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMThdLCBmYWxzZSwgQy5XSURUSC0yMC00MCwgQy5IRUlHSFQtMTAtNjcsIDQwLCA2NywgXCJcIiwgXCJuZXh0XCIsIDAgKTtcclxuICB2YXIgYlRvTWVudSA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMjBdLCByZXMuYXJySW1hZ2VzWzI4XSwgQy5XSURUSC8yIC0gMzIwLzIsIEMuSEVJR0hULTEwLTY3LCAzMjAsIDY3LCBcItCS0LXRgNC90YPRgtGM0YHRjyDQsiDQvNC10L3RjlwiLCBcInRvX21lbnVcIiwgMjUgKTtcclxuICBiVG9NZW51LnR4dENvbG9yID0gXCIjMDAwMDQ2XCI7XHJcblxyXG4gIGxldmVsc0Zvb3Rlci5wdXNoKGJQcmV2LGJOZXh0LGJUb01lbnUpO1xyXG5cclxuICByZXR1cm4gbGV2ZWxzRm9vdGVyO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGxheWVyKCl7ICAgICAgICAgICAgICAgLy/RgdC+0LfQtNCw0LXQvCDQuNCz0YDQvtC60LAg0YEg0YPQvdC40LrQsNC70YzQvdGL0LzQuCDQvNC10YLQvtC00LDQvNC4XHJcblxyXG4gIHZhciBwbGF5ZXIgPSBuZXcgUGxheWFibGUocmVzLmFyckltYWdlc1s5XSwwLDAsNTAsNTApO1xyXG4gIHBsYXllci5kaXJlY3Rpb24gPSBmYWxzZTtcclxuICBwbGF5ZXIuaXNNb3ZlICAgID0gZmFsc2U7XHJcblxyXG4gIHBsYXllci5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBpZih0aGlzLmlzTW92ZSl7XHJcbiAgICAgIHRoaXMuZHJhd0FuaW1hdGlvbigzLCAyLCB0aGlzLmRpcmVjdGlvbik7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5kcmF3RnJhbWUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLmRyYXdBbmltYXRpb24gPSBmdW5jdGlvbihmcmFtZXMsIGRlbGF5LCBhbmdsZSl7XHJcblxyXG4gICAgdGhpcy5pbWcuY2FuRHJhdyA9ICggdGhpcy5pbWcuY2FuRHJhdyA9PT0gdW5kZWZpbmVkICkgPyAxIDogdGhpcy5pbWcuY2FuRHJhdztcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICB2YXIgX2R4ID0gdGhpcy54K0MuUERORyArIHRoaXMudyAvIDI7XHJcbiAgICAgIHZhciBfZHkgPSB0aGlzLnkrNzErQy5QRE5HICsgdGhpcy5oIC8gMjtcclxuICAgICAgYW5nbGUgPSBhbmdsZSAqIChNYXRoLlBJLzE4MCk7XHJcbiAgICAgIGNudnMuY3R4LnNhdmUoKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKF9keCxfZHkpO1xyXG4gICAgICBjbnZzLmN0eC5yb3RhdGUoYW5nbGUpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoLV9keCwtX2R5KTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRoaXMuaW1nLmNhbkRyYXcgPT0gMSl7XHJcbiAgICAgIGlmICh0aGlzLmltZy5jb3VudCA9PSBmcmFtZXMpIHRoaXMuaW1nLmNvdW50ID0gMTtcclxuXHJcbiAgICAgIHRoaXMuaW1nLmNhbkRyYXcgPSAwO1xyXG4gICAgICB0aGlzLmltZy5jb3VudCA9IHRoaXMuaW1nLmNvdW50ICsgMSB8fCAxO1xyXG5cclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgIHBsYXllci5pbWcuY2FuRHJhdyA9IDE7XHJcbiAgICAgIH0sIDEwMDAvKGRlbGF5KjIpICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjbnZzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDUwKih0aGlzLmltZy5jb3VudC0xKSwgMCwgdGhpcy53LCB0aGlzLmgsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoLUMuUERORywgLSg3MStDLlBETkcpKTtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICBjbnZzLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5kcmF3RnJhbWUgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIHZhciBhbmdsZSA9IHRoaXMuZGlyZWN0aW9uIHx8IDA7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgdmFyIF9keCA9IHRoaXMueCtDLlBETkcgKyB0aGlzLncgLyAyO1xyXG4gICAgICB2YXIgX2R5ID0gdGhpcy55KzcxK0MuUERORyArIHRoaXMuaCAvIDI7XHJcbiAgICAgIGFuZ2xlID0gYW5nbGUgKiAoTWF0aC5QSS8xODApO1xyXG4gICAgICBjbnZzLmN0eC5zYXZlKCk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZShfZHgsX2R5KTtcclxuICAgICAgY252cy5jdHgucm90YXRlKGFuZ2xlKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKC1fZHgsLV9keSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjbnZzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHRoaXMudywgdGhpcy5oLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKC1DLlBETkcsIC0oNzErQy5QRE5HKSk7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgY252cy5jdHgucmVzdG9yZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuc2V0RGlyZWN0aW9uID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBwbGF5ZXI7XHJcbn07XHJcblxyXG5cclxuXHJcbi8vbWVudVxyXG52YXIgbG9nbyA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMV0sIGZhbHNlLCBDLldJRFRILzItNDUwLzIsIDIwLCA0NTAsIDE1MCwgXCJcIiwgXCJsb2dvXCIsIDAgKTtcclxudmFyIG1lbnUgPSBjcmVhdGVNZW51KFtcItCY0LPRgNCw0YLRjFwiLCBcItCj0YDQvtCy0L3QuFwiLCBcItCd0LDRgdGC0YDQvtC50LrQuFwiXSxbXCJwbGF5XCIsIFwiY2hhbmdlX2xldmVsXCIsIFwib3B0aW9uc1wiXSk7XHJcblxyXG5cclxuLy9iYWNrZ3JvdW5kIFxyXG52YXIgbWF0cml4ICAgID0gY3JlYXRlTWF0cml4QkcoKTsgICAgICAgICAvL2JnINGD0YDQvtCy0L3Rj1xyXG52YXIgYmdMZXZlbCAgID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzhdLCAwLCAwLCBDLldJRFRILCBDLkhFSUdIVCApO1xyXG52YXIgYmdPcGFjaXR5ID0gbmV3IFJlY3QoMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIFwicmdiYSgwLCAwLCAwLCAwLjUpXCIpO1xyXG5cclxuXHJcbi8vZ2FtZSBoZWFkZXJcclxudmFyIGhlYWRlciAgICA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1syXSwgMCwgMCwgQy5XSURUSCwgNzErQy5QRE5HICk7XHJcbnZhciBiRnVsbFNjciAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzNdLCByZXMuYXJySW1hZ2VzWzIyXSwgQy5XSURUSC00NS0yMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQ1LzIsIDQ1LCA0NSwgXCJcIiwgXCJmdWxsU2NyXCIsIDAgKTtcclxudmFyIHN0b3BXYXRjaCA9IG5ldyBCdXR0b24oIDEwLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTIwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcIjAwIDogMDAgOiAwMFwiLCBcInN0b3B3YXRjaFwiLCAyNSwgXCJkaXRlZFwiICk7XHJcbnZhciBiUGF1c2UgICAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzRdLCByZXMuYXJySW1hZ2VzWzIzXSwgQy5XSURUSC00NS03LWJGdWxsU2NyLnctMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwicGF1c2VcIiwgMCApO1xyXG52YXIgY3VyckxldmVsID0gbmV3IEJ1dHRvbiggKHN0b3BXYXRjaC54K3N0b3BXYXRjaC53K2JQYXVzZS54KS8yLTE0MC8yLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTQwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMXCIsIFwiY3Vycl9sZXZlbFwiLCAyNSwgXCJjYXB0dXJlX2l0XCIgKTtcclxuXHJcblxyXG4vL2NoYW5nZSBsZXZlbFxyXG52YXIgbGV2ZWxzSGVhZGVyICAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzJdLCBmYWxzZSwgMCwgMCwgQy5XSURUSCwgNzErQy5QRE5HLCBcItCS0YvQsdC+0YAg0YPRgNC+0LLQvdGPXCIsIFwibGV2ZWxzX2hlYWRlclwiLCAyNSApO1xyXG52YXIgYkxldmVsc0J1dHRvbnMgPSBjcmVhdGVMZXZlbHNCdXR0b25zKDUpO1xyXG52YXIgbGV2ZWxzRm9vdGVyICAgPSBjcmVhdGVMZXZlbHNGb290ZXIoKTtcclxuXHJcblxyXG4vL3dpbiBwb3AtdXBcclxudmFyIHdpblBvcFVwICAgPSBjcmVhdGVXaW5Qb3BVcCgpO1xyXG5cclxuXHJcbi8vcGF1c2UgcG9wLXVwXHJcbnZhciBwYXVzZVBvcFVwID0gY3JlYXRlUGF1c2VQb3BVcCgpO1xyXG5cclxuXHJcbi8vcGxheWFibGUgb2JqXHJcbnZhciBwbCAgICA9IGNyZWF0ZVBsYXllcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v0L/QtdGA0YHQvtC90LDQtlxyXG52YXIgYm94ICAgPSBuZXcgUGxheWFibGUocmVzLmFyckltYWdlc1s2XSwwLDAsNTAsNTApOyAvL9Cx0L7QutGBXHJcbnZhciBkb29yICA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzddLDAsMCw1MCw1MCk7IC8v0LTQstC10YDRjFxyXG52YXIgd2FsbHMgPSBbXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL9GB0YLQtdC90Ysg0L3QsCDRg9GA0L7QstC90LUsINC30LDQv9C+0LvQvdGP0LXRgtGB0Y8g0LLRi9Cx0YDQsNC90L3Ri9C8INGD0YDQvtCy0L3QtdC8LlxyXG5cclxuXHJcbi8vdmlkZW9cclxudmFyIGFuaW1hdGVCZyAgICAgPSBuZXcgVmlkZW8oMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIHJlcy5hcnJWaWRlb3NbMF0pO1xyXG52YXIgdmlkZW9CZ0xldmVscyA9IG5ldyBWaWRlbygwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgcmVzLmFyclZpZGVvc1sxXSk7XHJcblxyXG5cclxuLy9hdWRpb1xyXG52YXIgYXVkaW8gPSB7XHJcblxyXG4gIGJ1dHRvbiAgIDogbmV3IEF1ZGlvKHJlcy5hcnJBdWRpb1swXSwgMC41KSxcclxuICB3aW4gICAgICA6IG5ldyBBdWRpbyhyZXMuYXJyQXVkaW9bMV0sIDAuNSksXHJcbiAgcGxheWVyICAgOiBuZXcgQXVkaW8ocmVzLmFyckF1ZGlvWzJdLCAwLjI1KSxcclxuICBjcnlzdGFsICA6IG5ldyBBdWRpbyhyZXMuYXJyQXVkaW9bM10sIDAuMjUpLFxyXG4gIGJnSW5HYW1lIDogbmV3IEF1ZGlvKHJlcy5hcnJBdWRpb1s0XSwgMC41KSxcclxuICBiZ0luTWVudSA6IG5ldyBBdWRpbyhyZXMuYXJyQXVkaW9bNV0sIDAuNSksXHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RzID0ge1xyXG5cclxuICBtYXRyaXggICAgICAgICA6IG1hdHJpeCxcclxuICBsb2dvICAgICAgICAgICA6IGxvZ28sXHJcbiAgbWVudSAgICAgICAgICAgOiBtZW51LFxyXG4gIGhlYWRlciAgICAgICAgIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCAgICAgIDogc3RvcFdhdGNoLFxyXG4gIGJQYXVzZSAgICAgICAgIDogYlBhdXNlLFxyXG4gIGJGdWxsU2NyICAgICAgIDogYkZ1bGxTY3IsXHJcbiAgcGwgICAgICAgICAgICAgOiBwbCxcclxuICBib3ggICAgICAgICAgICA6IGJveCxcclxuICBkb29yICAgICAgICAgICA6IGRvb3IsXHJcbiAgd2FsbHMgICAgICAgICAgOiB3YWxscyxcclxuICBiZ0xldmVsICAgICAgICA6IGJnTGV2ZWwsXHJcbiAgd2luUG9wVXAgICAgICAgOiB3aW5Qb3BVcCxcclxuICBwYXVzZVBvcFVwICAgICA6IHBhdXNlUG9wVXAsXHJcbiAgYmdPcGFjaXR5ICAgICAgOiBiZ09wYWNpdHksXHJcbiAgY3VyckxldmVsICAgICAgOiBjdXJyTGV2ZWwsXHJcbiAgbGV2ZWxzSGVhZGVyICAgOiBsZXZlbHNIZWFkZXIsXHJcbiAgYkxldmVsc0J1dHRvbnMgOiBiTGV2ZWxzQnV0dG9ucyxcclxuICBsZXZlbHNGb290ZXIgICA6IGxldmVsc0Zvb3RlcixcclxuICBhbmltYXRlQmcgICAgICA6IGFuaW1hdGVCZyxcclxuICB2aWRlb0JnTGV2ZWxzICA6IHZpZGVvQmdMZXZlbHMsXHJcbiAgYXVkaW8gICAgICAgICAgOiBhdWRpb1xyXG4gIFxyXG59O1xyXG4iLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHRcclxudmFyIGNvdW50ICAgID0gNzU7XHJcbnZhciByb3RhdGlvbiA9IDI3MCooTWF0aC5QSS8xODApO1x0XHRcclxudmFyIHNwZWVkICAgID0gNjtcclxuXHRcclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG4gIFxyXG4gXHR1cGRhdGVMb2FkZXIgOiBmdW5jdGlvbigpe1xyXG4gXHRcdGNhbnZhcy5jdHguc2F2ZSgpO1xyXG4gXHRcdGNhbnZhcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XHJcbiBcdFx0Y2FudmFzLmN0eC5maWxsU3R5bGUgPSAncmdiYSgyNTUsMjU1LDI1NSwuMDM1KSc7XHJcbiBcdFx0Y2FudmFzLmN0eC5maWxsUmVjdCgwLDAsNTAwLDUwMCk7XHJcbiBcdFx0cm90YXRpb24gKz0gc3BlZWQvMTAwO1xyXG4gXHRcdGNhbnZhcy5jdHgucmVzdG9yZSgpO1x0XHRcdFx0XHRcdFx0XHRcdFxyXG4gXHR9LFxyXG5cclxuIFx0ZHJhd0xvYWRlciA6IGZ1bmN0aW9uKCl7XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRjYW52YXMuY3R4LnNhdmUoKTtcclxuIFx0XHRjYW52YXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XHJcbiBcdFx0Y2FudmFzLmN0eC50cmFuc2xhdGUoQy5XSURUSC8yLCBDLkhFSUdIVC8yKTtcclxuIFx0XHRjYW52YXMuY3R4LmxpbmVXaWR0aCA9IDAuMjU7XHJcblx0XHRjYW52YXMuY3R4LnN0cm9rZVN0eWxlID0gJ3JnYmEoMjU1LDI1NSwyNTUsMS4wKSc7XHJcbiBcdFx0Y2FudmFzLmN0eC5yb3RhdGUocm90YXRpb24pO1x0XHJcbiBcdFx0dmFyIGkgPSBjb3VudDtcclxuIFx0XHR3aGlsZShpLS0pe1x0XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRcdGNhbnZhcy5jdHguYmVnaW5QYXRoKCk7XHJcbiBcdFx0XHRjYW52YXMuY3R4LmFyYygwLCAwLCBpKyhNYXRoLnJhbmRvbSgpKjM1KSwgTWF0aC5yYW5kb20oKSwgTWF0aC5QSS8zKyhNYXRoLnJhbmRvbSgpLzEyKSwgZmFsc2UpO1x0XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRcdGNhbnZhcy5jdHguc3Ryb2tlKCk7XHJcbiBcdFx0fVx0XHJcbiBcdFx0Y2FudmFzLmN0eC5yZXN0b3JlKCk7XHJcblxyXG4gXHRcdGNhbnZhcy5jdHguc2F2ZSgpO1xyXG4gXHRcdGNhbnZhcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW92ZXInO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsMSknO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1x0XHJcbiBcdFx0Y2FudmFzLmN0eC5yZXN0b3JlKCk7XHRcdFx0XHRcdFx0XHRcdFx0XHRcclxuIFx0fSxcclxuXHJcbiBcdGRyYXdMb2FkVGV4dCA6IGZ1bmN0aW9uKCl7XHJcbiBcdFx0dmFyIHdpblRleHQgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItMjUwLzIsIDI1LCAyNTAsIDQwLCBcImJsYWNrXCIsIFwi0JjQtNC10YIg0LfQsNCz0YDRg9C30LrQsC4uXCIsIFwibG9hZC10ZXh0XCIsIDMwLCBcIkJ1Y2NhbmVlclwiICk7XHJcbiAgXHRcdHJldHVybiB3aW5UZXh0LmRyYXcoKTtcclxuIFx0fVxyXG59OyBcclxuXHJcbiAgIiwidmFyIHJlc291cnNlcyA9IHtcclxuICBpbWFnZXMgOiBmYWxzZSxcclxuICB2aWRlbyAgOiBmYWxzZSxcclxuICBhdWRpbyAgOiBmYWxzZSxcclxuXHJcbiAgYXJlTG9hZGVkIDogZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB0aGlzLnZpZGVvICYmIHRoaXMuaW1hZ2VzICYmIHRoaXMuYXVkaW9cclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlkZW8oYXJyU3Jjc09mVmlkZW8pe1xyXG5cclxuICB2YXIgYXJyVmlkZW9zID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZlZpZGVvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgIHZpZGVvLnNyYyA9IGFyclNyY3NPZlZpZGVvW2ldO1xyXG4gICAgdmlkZW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGxvYWRDb3VudCsrO1xyXG4gICAgICB2aWRlby5sb29wID0gdHJ1ZTtcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMudmlkZW8gPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBhcnJWaWRlb3MucHVzaCh2aWRlbyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJWaWRlb3M7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2VzKGFyclNyY3NPZkltYWdlcyl7XHJcblxyXG4gIHZhciBhcnJJbWFnZXMgPSBbXTsgXHJcbiAgdmFyIGNvdW50ID0gYXJyU3Jjc09mSW1hZ2VzLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgaW1nLnNyYyA9IGFyclNyY3NPZkltYWdlc1tpXTtcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICBsb2FkQ291bnQrKztcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMuaW1hZ2VzID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGFyckltYWdlcy5wdXNoKGltZyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJJbWFnZXM7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkQXVkaW8oYXJyU3Jjc09mQXVkaW8pe1xyXG5cclxuICB2YXIgYXJyQXVkaW8gPSBbXTsgXHJcbiAgdmFyIGNvdW50ID0gYXJyU3Jjc09mQXVkaW8ubGVuZ3RoO1xyXG4gIHZhciBsb2FkQ291bnQgPSAwO1xyXG5cclxuICBmb3IodmFyIGk9MDsgaTxjb3VudDsgaSsrKXtcclxuXHJcbiAgICB2YXIgYXVkaW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xyXG4gICAgYXVkaW8uc3JjID0gYXJyU3Jjc09mQXVkaW9baV07XHJcbiAgICBhdWRpby5vbmNhbnBsYXl0aHJvdWdoID0gZnVuY3Rpb24oKXtcclxuICAgICAgbG9hZENvdW50Kys7XHJcbiAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLmF1ZGlvID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGFyckF1ZGlvLnB1c2goYXVkaW8pO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXJyQXVkaW87XHJcbn07XHJcblxyXG52YXIgYXJyQXVkaW8gPSBsb2FkQXVkaW8oW1xyXG4gIFwiYXVkaW8vYnV0dG9uLWNsaWNrLm1wM1wiLFxyXG4gIFwiYXVkaW8vd2luLWF1ZGlvLm1wM1wiLFxyXG4gIFwiYXVkaW8vcGxheWVyLW1vdmUubXAzXCIsXHJcbiAgXCJhdWRpby9jcnlzdGFsLW1vdmUubXAzXCIsXHJcbiAgXCJhdWRpby9iZy1pbkdhbWUubXAzXCIsXHJcbiAgXCJhdWRpby9iZy1pbk1lbnUubXAzXCJcclxuXSk7XHJcblxyXG52YXIgYXJyVmlkZW9zID0gbG9hZFZpZGVvKFtcclxuICBcInZpZGVvL2JnLm1wNFwiLFxyXG4gIFwidmlkZW8vTGlnaHRtaXJyb3IubXA0XCJcclxuXSk7XHJcblxyXG52YXIgYXJySW1hZ2VzID0gbG9hZEltYWdlcyhbXHJcbiAgXCJpbWcvbWVudV9fYnV0dG9uLW1lbnUuc3ZnXCIsICAgICAgICAgICAgICAgIC8vMCBcclxuICBcImltZy9tZW51X19sb2dvLnBuZ1wiLCAgICAgICAgICAgICAgICAgICAgICAgLy8xXHJcblxyXG4gIFwiaW1nL2dhbWVfX2JnLWhlYWRlci5zdmdcIiwgICAgICAgICAgICAgICAgICAvLzIgXHJcbiAgXCJpbWcvZ2FtZV9fYnV0dG9uLWZ1bGxzY3JlZW4uc3ZnXCIsICAgICAgICAgIC8vMyBcclxuICBcImltZy9nYW1lX19idXR0b24tcGF1c2Uuc3ZnXCIsICAgICAgICAgICAgICAgLy80IFxyXG4gIFwiaW1nL2dhbWVfX3dhbGwuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgICAvLzUgXHJcbiAgXCJpbWcvZ2FtZV9fY3J5c3RhbGwuc3ZnXCIsICAgICAgICAgICAgICAgICAgIC8vNiBcclxuICBcImltZy9nYW1lX19wb3J0YWwuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgLy83IFxyXG4gIFwiaW1nL2dhbWVfX2dyb3VuZC5qcGdcIiwgICAgICAgICAgICAgICAgICAgICAvLzggXHJcbiAgJ2ltZy9nYW1lX19wbGF5ZXIucG5nJywgICAgICAgICAgICAgICAgICAgICAvLzkgXHJcblxyXG4gIFwiaW1nL3BhdXNlX19idXR0b24tY2xvc2Uuc3ZnXCIsICAgICAgICAgICAgICAvLzEwXHJcbiAgXCJpbWcvcGF1c2VfX2J1dHRvbi1yZXN0YXJ0LnN2Z1wiLCAgICAgICAgICAgIC8vMTFcclxuICBcImltZy9wYXVzZV9fYnV0dG9uLXRvTWVudS5zdmdcIiwgICAgICAgICAgICAgLy8xMlxyXG4gIFwiaW1nL3BhdXNlX19iZy5zdmdcIiwgICAgICAgICAgICAgICAgICAgICAgICAvLzEzXHJcbiAgXCJpbWcvcGF1c2VfX3RleHQuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgIC8vMTRcclxuXHJcbiAgXCJpbWcvd2luX19idXR0b24tbmV4dC5zdmdcIiwgICAgICAgICAgICAgICAgIC8vMTVcclxuICBcImltZy93aW5fX2JnLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8xNlxyXG5cclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi1sZXZlbHMuc3ZnXCIsICAgICAgICAgICAgLy8xN1xyXG4gIFwiaW1nL2xldmVsc19fYnV0dG9uLW5leHQuc3ZnXCIsICAgICAgICAgICAgICAvLzE4XHJcbiAgXCJpbWcvbGV2ZWxzX19idXR0b24tcHJldi5zdmdcIiwgICAgICAgICAgICAgIC8vMTlcclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi10b01lbnUuc3ZnXCIsICAgICAgICAgICAgLy8yMFxyXG5cclxuICBcImltZy9ob3ZlcnMvbWVudV9fYnV0dG9uLW1lbnVfaG92ZXIuc3ZnXCIsICAgICAgIC8vMjFcclxuICBcImltZy9ob3ZlcnMvZ2FtZV9fYnV0dG9uLWZ1bGxzY3JlZW5faG92ZXIuc3ZnXCIsIC8vMjJcclxuICBcImltZy9ob3ZlcnMvZ2FtZV9fYnV0dG9uLXBhdXNlX2hvdmVyLnN2Z1wiLCAgICAgIC8vMjNcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi1jbG9zZV9ob3Zlci5zdmdcIiwgICAgIC8vMjRcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi1yZXN0YXJ0X2hvdmVyLnN2Z1wiLCAgIC8vMjVcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi10b01lbnVfaG92ZXIuc3ZnXCIsICAgIC8vMjZcclxuICBcImltZy9ob3ZlcnMvbGV2ZWxzX19idXR0b24tbGV2ZWxzX2hvdmVyLnN2Z1wiLCAgIC8vMjdcclxuICBcImltZy9ob3ZlcnMvbGV2ZWxzX19idXR0b24tdG9NZW51X2hvdmVyLnN2Z1wiLCAgIC8vMjhcclxuICBcImltZy9ob3ZlcnMvd2luX19idXR0b24tbmV4dF9ob3Zlci5zdmdcIiAgICAgICAgIC8vMjlcclxuXHJcbl0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuICByZXNvdXJzZXMgOiByZXNvdXJzZXMsXHJcblxyXG4gIGFyclZpZGVvcyA6IGFyclZpZGVvcyxcclxuXHJcbiAgYXJySW1hZ2VzIDogYXJySW1hZ2VzLFxyXG5cclxuICBhcnJBdWRpbyAgOiBhcnJBdWRpb1xyXG5cclxufTtcclxuXHJcblxyXG4iLCJ2YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGdhbWUgPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxuXHJcbnZhciBwYXVzZSA9IDA7XHJcbnZhciBiZWdpblRpbWUgPSAwO1xyXG52YXIgY3VycmVudFRpbWUgPSAwO1xyXG52YXIgdXBUaW1lVE87XHJcblxyXG5mdW5jdGlvbiB1cFRpbWUoY291bnRGcm9tKSB7XHJcblx0dmFyIG5vdyA9IG5ldyBEYXRlKCk7XHJcblx0dmFyIGRpZmZlcmVuY2UgPSAobm93LWNvdW50RnJvbSArIGN1cnJlbnRUaW1lKTtcclxuXHJcblx0dmFyIGhvdXJzPU1hdGguZmxvb3IoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKS8oNjAqNjAqMTAwMCkqMSk7XHJcblx0dmFyIG1pbnM9TWF0aC5mbG9vcigoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpLyg2MCoxMDAwKSoxKTtcclxuXHR2YXIgc2Vjcz1NYXRoLmZsb29yKCgoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpJSg2MCoxMDAwKSkvMTAwMCoxKTtcclxuXHJcblx0aG91cnMgPSAoIGhvdXJzIDwgMTApID8gXCIwXCIraG91cnMgOiBob3VycztcclxuXHRtaW5zID0gKCBtaW5zIDwgMTApID8gXCIwXCIrbWlucyA6IG1pbnM7XHJcblx0c2VjcyA9ICggc2VjcyA8IDEwKSA/IFwiMFwiK3NlY3MgOiBzZWNzO1xyXG5cclxuXHRvLnN0b3BXYXRjaC50eHQgPSBob3VycytcIiA6IFwiK21pbnMrXCIgOiBcIitzZWNzO1xyXG5cclxuXHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdHVwVGltZVRPPXNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdXBUaW1lKGNvdW50RnJvbSk7IH0sMTAwMC82MCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdHN0YXJ0IDogZnVuY3Rpb24oKSB7XHJcblx0XHQvLyBpZiAoZ2FtZS5zdGF0dXMgPT0gJ2dhbWUnIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJtZW51XCIgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcInBhdXNlXCIgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcImxldmVsc1wiKSB7XHJcblx0XHRcdHVwVGltZShuZXcgRGF0ZSgpKTtcclxuXHRcdFx0dmFyIG5vd1QgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0XHRiZWdpblRpbWUgPSBub3dULmdldFRpbWUoKTtcclxuXHRcdC8vIH0gZWxzZSB7XHJcblx0XHQvLyBcdHRoaXMucmVzZXQoKTtcclxuXHRcdC8vIH07XHJcblx0fSxcclxuXHJcblx0cmVzZXQgOiBmdW5jdGlvbigpIHtcclxuXHRcdGN1cnJlbnRUaW1lID0gMDtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblxyXG5cdFx0by5zdG9wV2F0Y2gudHh0ID0gXCIwMCA6IDAwIDogMDBcIjtcclxuXHRcdC8vIHRoaXMuc3RhcnQoKTtcclxuXHR9LFxyXG5cclxuXHRwYXVzZVRpbWVyIDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjdXJEYXRhID0gbmV3IERhdGUoKTtcclxuXHRcdGN1cnJlbnRUaW1lID0gY3VyRGF0YS5nZXRUaW1lKCkgLSBiZWdpblRpbWUgKyBjdXJyZW50VGltZTtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblx0fVxyXG5cclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IEF1ZGlvID0gZnVuY3Rpb24oYXVkaW8sIHZvbHVtZSl7IFxyXG5cclxuXHR0aGlzLmEgPSBhdWRpbztcclxuXHR0aGlzLmEudm9sdW1lID0gdm9sdW1lIHx8IDE7XHJcblx0dGhpcy5zdGF0ZSA9IFwic3RvcFwiO1xyXG5cclxuXHR0aGlzLnBsYXkgPSBmdW5jdGlvbihkb250U3RvcCl7XHJcblx0XHRpZiAoIHRoaXMuc3RhdGUgPT0gXCJwbGF5XCIgJiYgZG9udFN0b3AgKXtcdFx0XHQvL9C10YHQu9C4INC10YnQtSDQvdC1INC30LDQutC+0L3Rh9C40LvRgdGPINC/0YDQtdC00YvQtNGD0YnQuNC5INGN0YLQvtGCINC30LLRg9C6LCDRgtC+INGB0L7Qt9C00LDQtdC8INC90L7QstGL0Lkg0LfQstGD0Log0Lgg0LLQvtGB0L/RgNC+0LjQt9Cy0L7QtNC40Lwg0LXQs9C+LCDQvdC1INC80LXRiNCw0Y8g0LLQvtGB0L/RgNC+0LjQt9Cy0LXQtNC10L3QuNGOINC/0YDQtdC00YvQtNGD0YnQtdCz0L4uXHJcblx0XHRcdHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIpO1xyXG5cdFx0XHRhLnNyYyA9IHRoaXMuYS5zcmM7XHJcblx0XHRcdGEudm9sdW1lID0gdGhpcy5hLnZvbHVtZTtcclxuXHRcdFx0YS5wbGF5KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmEucGxheSgpO1xyXG5cdFx0XHR0aGlzLnN0YXRlID0gXCJwbGF5XCI7XHJcblx0XHRcdHRoaXMuYS5vbmVuZGVkID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR0aGlzLnN0YXRlID0gXCJzdG9wXCI7XHJcblx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdH07XHJcblx0fTtcclxuXHJcblx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLmEucGF1c2UoKTtcclxuXHRcdHRoaXMuc3RhdGUgPSBcInBhdXNlXCI7XHJcblx0fTtcclxuXHJcblx0dGhpcy5zdG9wID0gZnVuY3Rpb24oKXtcclxuXHRcdHRoaXMuYS5wYXVzZSgpO1xyXG5cdFx0dGhpcy5hLmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdHRoaXMuc3RhdGUgPSBcInN0b3BcIjtcclxuXHR9O1xyXG5cclxuXHR0aGlzLnNldFZvbHVtZSA9IGZ1bmN0aW9uKHZvbHVtZSl7XHJcblx0XHR0aGlzLmEudm9sdW1lID0gdm9sdW1lO1xyXG5cdH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IsIHR4dCwgbmFtZSwgZlNpemUsIGZvbnRGYW0pe1xyXG4gIFxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG4gIHRoaXMudHh0Q29sb3IgPSBcIndoaXRlXCI7XHJcbiAgdGhpcy5mb250RmFtID0gZm9udEZhbSB8fCBcIkFyaWFsXCI7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKG5vQ2VudGVyLCBwYWRkKXtcclxuXHJcbiAgICB2YXIgX3BhZGQgPSBwYWRkIHx8IDU7XHJcbiAgICB2YXIgX3ggPSAoICFub0NlbnRlciApID8gdGhpcy54K3RoaXMudy8yIDogdGhpcy54K19wYWRkO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMudHh0Q29sb3I7XHJcbiAgICBjdHgudGV4dEFsaWduID0gKCAhbm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggJyt0aGlzLmZvbnRGYW07XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoLCBvcGFjaXR5KXtcclxuXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLm9wYWNpdHkgPSBvcGFjaXR5IHx8IDE7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4Lmdsb2JhbEFscGhhID0gdGhpcy5vcGFjaXR5O1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuXHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1nQnV0dG9uID0gZnVuY3Rpb24oaW1nLCBob3ZlckltZywgeCwgeSwgdywgaCwgdHh0LCBuYW1lLCBmU2l6ZSwgc2V0Q2VudGVyLCBub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcbiAgdGhpcy50eHRDb2xvciA9IFwid2hpdGVcIjtcclxuICB0aGlzLnNldENlbnRlciA9IHNldENlbnRlciB8fCB0aGlzLng7XHJcbiAgdGhpcy5ub0NlbnRlciA9IG5vQ2VudGVyIHx8IGZhbHNlO1xyXG4gIHRoaXMucGFkZCA9IHBhZGQgfHwgNTtcclxuICB0aGlzLmhvdmVySW1nID0gaG92ZXJJbWc7XHJcblxyXG4gIHZhciBtZXRyaWNzID0gY3R4Lm1lYXN1cmVUZXh0KHRoaXMudHh0KS53aWR0aDsgLy/RgNCw0LfQvNC10YAt0YjQuNGA0LjQvdCwINC/0LXRgNC10LTQsNCy0LDQtdC80L7Qs9C+INGC0LXQutGB0YLQsFxyXG4gIHZhciBfeCA9ICggIXRoaXMubm9DZW50ZXIgKSA/IHRoaXMuc2V0Q2VudGVyK3RoaXMudy8yIDogdGhpcy54K3RoaXMucGFkZDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIXRoaXMubm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggY2FwdHVyZV9pdCc7XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxuICB2YXIgX2ltZyA9IGZhbHNlOyAvL9Cx0YPQtNC10YIg0YXRgNCw0L3QuNGC0Ywg0LLRgNC10LzQtdC90L3QviDQutCw0YDRgtC40L3QutGDINGB0YLQsNC90LTQsNGA0YLQvdGD0Y4uXHJcblxyXG4gIHRoaXMuaG92ZXIgPSBmdW5jdGlvbihkcmF3KXtcclxuXHJcbiAgICBpZiAoZHJhdyAmJiB0aGlzLmhvdmVySW1nKSB7ICAgICAgICAgICAgIC8v0LXRgdC70Lgg0L/QtdGA0LXQtNCw0LvQuCDQuNGB0YLQuNC90YMg0Lgg0YXQvtCy0LXRgCDRgyDRjdGC0L7Qs9C+INC+0LHRitC10LrRgtCwINC10YHRgtGMLCDRgtC+INC+0YLRgNC40YHQvtCy0YvQstCw0LXQvCDRhdC+0LLQtdGAXHJcbiAgICAgIGlmICghX2ltZykgX2ltZyA9IHRoaXMuaW1nOyAgICAgICAgICAgIC8vINC10YHQu9C4INC10YnQtSDQvdC1INCx0YvQu9CwINGB0L7RhdGA0LDQvdC10L3QsCDRgdGC0LDQvdC00LDRgNGC0L3QsNGPINC60LDRgNGC0LjQvdC60LAsINGC0L4g0YHQvtGF0YDQsNC90Y/QtdC8INC4Li5cclxuICAgICAgdGhpcy5pbWcgPSB0aGlzLmhvdmVySW1nOyAgICAgICAgICAgICAgLy8uLtC90L7QstC+0Lkg0LHRg9C00LXRgiDQstGL0LLQvtC00LjRgtGB0Y8g0L/QtdGA0LXQtNCw0L3QvdCw0Y9cclxuICAgICAgY252LnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiOyAgICAgICAgICAvL9C4INC60YPRgNGB0L7RgCDQsdGD0LTQtdGCINC/0L7QuNC90YLQtdGAXHJcbiAgICB9IGVsc2UgaWYgKCBfaW1nICYmIF9pbWcgIT0gdGhpcy5pbWcpeyAgIC8v0LjQvdCw0YfQtSDQtdGB0LvQuCDQsdGL0LvQsCDRgdC+0YXRgNCw0L3QtdC90LAg0LrQsNGA0YLQuNC90LrQsCDQuCDQvdC1INC+0L3QsCDQsiDQtNCw0L3QvdGL0Lkg0LzQvtC80LXQvdGCINC+0YLRgNC40YHQvtCy0YvQstCw0LXRgtGB0Y8sINGC0L5cclxuICAgICAgdGhpcy5pbWcgPSBfaW1nOyAgICAgICAgICAgICAgICAgICAgICAgLy/QstC+0LfQstGA0LDRidCw0LXQvCDRgdGC0LDQvdC00LDRgNGCINC60LDRgNGC0LjQvdC60YMg0L3QsCDQvNC10YHRgtC+XHJcbiAgICAgIGNudi5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjsgICAgICAgICAgLy/QuCDQutGD0YDRgdC+0YAg0LTQtdC70LDQtdC8INGB0YLQsNC90LTQsNGA0YLQvdGL0LxcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlhYmxlID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3QgPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvciwgaXNTdHJva2UpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMuaXNTdHJva2UgPSBpc1N0cm9rZSB8fCBmYWxzZTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGlmICghdGhpcy5pc1N0cm9rZSkge1xyXG4gICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICBjdHguc3Ryb2tlUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5tb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHN3aXRjaChkaXJlY3Rpb24pe1xyXG4gICAgICBjYXNlIFwidXBcIiA6IFxyXG4gICAgICB0aGlzLnkgLT0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJkb3duXCIgOiBcclxuICAgICAgdGhpcy55ICs9IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwibGVmdFwiIDpcclxuICAgICAgdGhpcy54IC09IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwicmlnaHRcIiA6IFxyXG4gICAgICB0aGlzLnggKz0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpXHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFZpZGVvID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgdmlkZW8pe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMudmlkZW8gPSB2aWRlbztcclxuXHJcbiAgdmFyIHNhdmUgPSBmYWxzZTtcclxuICB2YXIgYnVmQ252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICB2YXIgYnVmQ3R4ID0gYnVmQ252LmdldENvbnRleHQoXCIyZFwiKTtcclxuICBidWZDbnYud2lkdGggPSBDLldJRFRIO1xyXG4gIGJ1ZkNudi5oZWlnaHQgPSBDLkhFSUdIVDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLnZpZGVvKSB7XHJcbiAgICAgIGlmICggIXNhdmUgKXtcclxuICAgICAgICBidWZDdHguZHJhd0ltYWdlKHRoaXMudmlkZW8sIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgICAgc2F2ZSA9IHRydWU7XHJcbiAgICAgIH07XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLnZpZGVvLnBsYXkoKTtcclxuICAgICAgY2FudmFzLmN0eC5kcmF3SW1hZ2UoYnVmQ252LCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgICBjYW52YXMuY3R4LmRyYXdJbWFnZSh0aGlzLnZpZGVvLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIH07XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdhbGwgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKSxcclxuQXVkaW8gICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0F1ZGlvLmpzJyksXHJcblBsYXllYmxlICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9QbGF5YWJsZS5qcycpLFxyXG5XYWxsICAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvV2FsbC5qcycpLFxyXG5JbWdCdXR0b24gPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1nQnV0dG9uLmpzJyksXHJcblZpZGVvICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9WaWRlby5qcycpLFxyXG5CdXR0b24gICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvQnV0dG9uLmpzJyksXHJcblJlY3QgICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9SZWN0LmpzJyksXHJcbkltYWdlICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWFnZS5qcycpLFxyXG5DICAgICAgICAgPSByZXF1aXJlKCcuL19jb25zdC5qcycpLFxyXG5ldmVudHMgICAgPSByZXF1aXJlKCcuL19ldmVudHMuanMnKSxcclxubGV2ZWxzICAgID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyksXHJcbm8gICAgICAgICA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKSxcclxuY252cyAgICAgID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyksXHJcbmtleSBcdCAgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxuXHJcbmVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubG9hZGVyKTtcclxuXHJcblxyXG4vLyDQvdCw0YHRgtGA0L7QudC60LggLSDRiNC+0LEg0YLQsNC8INGD0L/RgNCw0LLQu9GP0YLRjCDRgNCw0LfQvNC10YDQsNC80Lgg0L3QsNCy0LXRgNC90L7QtS4uINGF0Lcg0L/QvtC60LAsINC80YPQt9GL0LrQvtC5INGD0L/RgNCw0LLQu9GP0YLRjCEhIVxyXG4vLyDRiNGA0LjRhNGCINC90LDQtNC+INC/0L7QtNCz0YDRg9C20LDRgtGMINGA0LDQvdC10LUsINC90LDQv9GA0LjQvNC10YAg0L7RgtGA0LjRgdC+0LLQsNGC0Ywg0LXQs9C+INCyINC/0YDQtdC70L7QudC00LXRgNC1INC90LXQstC40LTQuNC80L4uXHJcblxyXG5cclxuXHJcbi8vINGF0LDQudC00LjRgtGMINC60L3QvtC/0LrQuCDQsiDQstGL0LHQvtGA0LUg0YPRgNC+0LLQvdGPIl19
