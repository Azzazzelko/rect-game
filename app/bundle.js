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

            case "options" :
              a.button.play();
              engin.setGameEngine(gameLoops.options);
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

    case "options" :
      for ( var i = 0; i < o.bOptions.length; i++ ){
        if ( isCursorInButton(x,y,o.bOptions[i]) ){
          switch (o.bOptions[i].name) {

            case "bMenuMusic" :
              a.button.play(1);
              o.bOptions[i].check();
              a.bgInMenu.changeDisable(1); 
              break;

            case "bGameMusic" :
              a.button.play(1);
              o.bOptions[i].check();
              a.bgInGame.changeDisable();
              break;

            case "bSfxMusic" :
              a.button.play(1);
              o.bOptions[i].check();
              a.button.changeDisable();
              a.win.changeDisable();
              a.player.changeDisable();
              a.crystal.changeDisable();
              a.button.play(1);
              break;

            case "to_menu" :
              a.button.play();
              engin.setGameEngine(gameLoops.menu);
              break;

          };
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
  
    case "options" :
      for ( var i = 0; i < o.bOptions.length; i++ ){
        ( isCursorInButton(x,y,o.bOptions[i]) ) ? o.bOptions[i].hover(1) : o.bOptions[i].hover();
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
var C         = require('./_const.js');
var o         = require('./_objects.js');
var hf        = require('./_helperFunctions.js');
var engin     = require('./_engine.js');
var res       = require('./_resourses.js');
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

    if (a.bgInMenu.state == "stop") a.bgInMenu.play();

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.videoBgLevels.draw();

    o.levelsHeader.draw();

    for ( i in o.bLevelsButtons ){
      o.bLevelsButtons[i].draw();
    };

    for ( i in o.levelsFooter ){
      if ( o.levelsFooter[i].name == "to_menu" ) o.levelsFooter[i].draw();
    };
  },

  options : function(){

    gameLoops.status = "options";

    if (a.bgInMenu.state == "stop") a.bgInMenu.play();

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.videoBgLevels.draw();

    o.optionsHeader.draw();
    o.optionsMusic.draw();

    for ( i in o.bOptions ){
      o.bOptions[i].draw();
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
		[0,2],[0,6],[1,1],[1,4],[1,7],[2,2],[2,5],[2,8],[3,0],[3,2],[3,3],[3,5],[3,6],[3,8],[4,2],[4,5],[4,8],[5,1],[5,4],[5,7],[6,2],[6,5],[7,0],[7,2],[7,3],[7,5],[7,6],[7,7],[8,5],
		];				  //придуманный массив со стенками

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  //заполняем массив walls

		o.pl.setPosition( 0, 0 );
		o.pl.setDirection( hf.directionIs("down") );
		o.box.setPosition( 0+7*(50+C.PDNG), 8*(50+C.PDNG) );
		o.door.setPosition( 0+6*(50+C.PDNG), 8*(50+C.PDNG) );

		o.walls = _walls;

	},

	2 : function(){

		var _walls = [];  
		var arr = [       
		[0,0],[0,4],[0,3],[0,6],[2,2],[2,4],[3,8],[3,0],[3,7],[4,2],[4,4],[4,5],[4,6],[5,0],[6,2],[6,5],[6,6],[6,7],[7,0],[8,3],[8,4],[8,7]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
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
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
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
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
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
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 0, 0+0*(50+C.PDNG) );
		o.pl.setDirection( hf.directionIs("down") );
		o.box.setPosition( 0+1*(50+C.PDNG), 0+1*(50+C.PDNG) );
		o.door.setPosition( 0, 0+8*(50+C.PDNG) );

		o.walls = _walls;

	},

	6 : function(){

		var _walls = [];  
		var arr = [       
		[1,3],[1,4],[1,5],[2,0],[2,6],[2,8],[3,2],[4,1],[4,3],[4,7],[5,4],[6,4],[6,6],[7,1],[7,8],[8,0],[8,4],[8,5]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 0, 0 );
		o.pl.setDirection( hf.directionIs("right") );
		o.box.setPosition( 0+2*(50+C.PDNG), 7*(50+C.PDNG) );
		o.door.setPosition( 0+8*(50+C.PDNG), 0*(50+C.PDNG) );

		o.walls = _walls;

	},

	7 : function(){

		var _walls = [];  
		var arr = [       
		[0,0],[0,8],[1,3],[1,4],[1,5],[3,1],[3,3],[3,7],[4,1],[4,4],[5,1],[5,7],[7,3],[7,4],[7,5],[7,6],[8,0],[8,8]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 0, 0+1*(50+C.PDNG) );
		o.pl.setDirection( hf.directionIs("right") );
		o.box.setPosition( 0+7*(50+C.PDNG), 7*(50+C.PDNG) );
		o.door.setPosition( 0+3*(50+C.PDNG), 0+4*(50+C.PDNG) );

		o.walls = _walls;

	},

	8 : function(){

		var _walls = [];  
		var arr = [       
		[0,2],[1,5],[1,8],[2,1],[2,5],[3,1],[3,7],[4,2],[4,4],[5,2],[5,8],[6,3],[6,5],[6,6],[7,1],[7,3],[7,7]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 0, 0 );
		o.pl.setDirection( hf.directionIs("down") );
		o.box.setPosition( 0+5*(50+C.PDNG), 7*(50+C.PDNG) );
		o.door.setPosition( 0*(50+C.PDNG), 0+7*(50+C.PDNG) );

		o.walls = _walls;

	},

	9 : function(){

		var _walls = [];  
		var arr = [       
		[0,0],[0,5],[1,4],[1,5],[1,8],[2,2],[2,7],[3,0],[3,3],[4,3],[4,5],[4,6],[5,0],[5,2],[6,4],[6,5],[7,0],[7,8],[8,1],[8,5]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Wall( res.objImages["game__wall.svg"], arr[i][1]*(50+C.PDNG), arr[i][0]*(50+C.PDNG), 50, 50) );
		};				  

		o.pl.setPosition( 8*(50+C.PDNG), 0 );
		o.pl.setDirection( hf.directionIs("left") );
		o.box.setPosition( 0+6*(50+C.PDNG), 1*(50+C.PDNG) );
		o.door.setPosition( 0+3*(50+C.PDNG), 0*(50+C.PDNG) );

		o.walls = _walls;

	}

};

},{"./_const.js":2,"./_helperFunctions.js":7,"./_objects.js":10,"./_resourses.js":12}],10:[function(require,module,exports){
var C    = require('./_const.js');
var cnvs = require('./_canvas.js');
var res  = require('./_resourses.js');


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
    menu.push( new ImgButton( res.objImages["menu__button-menu.svg"], res.objImages["menu__button-menu_hover.svg"], _x, _y+i*85, 300, 60, txt[i], names[i], _fontsize, 83 ) );
  };

  return menu;
};

function createWinPopUp(){             //создаем победную вспллывашку

  var winPopBG      = new Image( res.objImages["win__bg.svg"], C.WIDTH/2-320/2, C.HEIGHT/2-200/2, 320, 200);
  var bPopExit      = new ImgButton( res.objImages["pause__button-toMenu.svg"], res.objImages["pause__button-toMenu_hover.svg"], winPopBG.x+30,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_exit", 0 );
  var bPopNext      = new ImgButton( res.objImages["win__button-next.svg"], res.objImages["win__button-next_hover.svg"], winPopBG.x+30+110+80,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_next", 0 );
  var winText       = new Button( C.WIDTH/2-90/2, winPopBG.y+15, 90, 40, "transparent", "Уровень N", "win_text", 30, "Buccaneer" );
  var winText_2     = new Button( C.WIDTH/2-90/2+10, winPopBG.y+80, 90, 40, "transparent", "ПРОЙДЕН!", "win_text_2", 50, "aZZ_Tribute_Bold" );

  winText.txtColor = "#D9C425";

  var winPopUp = [];
  winPopUp.push(winPopBG, bPopExit, bPopNext, winText, winText_2);

  return winPopUp;
};

function createPausePopUp(){           //создаем пауз всплывашку

  var pausePopUp = [];
  var bgPause     = new Image( res.objImages["pause__bg.svg"], C.WIDTH/2-300/2, C.HEIGHT/2-207/2, 300, 207);
  var bReturn     = new ImgButton( res.objImages["pause__button-close.svg"], res.objImages["pause__button-close_hover.svg"], bgPause.x+190,  bgPause.y-25, 63, 57, "", "return", 0 );
  var bExitToMenu = new ImgButton( res.objImages["pause__button-toMenu.svg"], res.objImages["pause__button-toMenu_hover.svg"], bgPause.x+50,  bgPause.y+bgPause.h-50, 85, 70, "", "exit", 0 );
  var bRestart    = new ImgButton( res.objImages["pause__button-restart.svg"], res.objImages["pause__button-restart_hover.svg"], bgPause.x+50+30+85,  bgPause.y+bgPause.h-50, 85, 70, "", "restart", 0 );
  var pauseText   = new Image( res.objImages["pause__text.svg"], bgPause.x + bgPause.w/2 - 150/2, bgPause.y + bgPause.h/2 - 100/2, 150, 100);

  pausePopUp.push(bgPause, bReturn, bExitToMenu, bRestart, pauseText);

  return pausePopUp;
};

function createLevelsButtons(levels_count){ //создаем кнопки в выборе уровня

  var bLevelsButtons = [];
  var j = 0, dy = 85, dx = 0;

  for ( i=0; i < levels_count; i++){
    dx = 8+j*(100+15);

    bLevelsButtons.push( new ImgButton( res.objImages["levels__button-levels.svg"], res.objImages["levels__button-levels_hover.svg"], dx, dy, 100, 100, i+1, "level_"+(i+1), 35 ) );

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

  var bPrev   = new ImgButton( res.objImages["levels__button-prev.svg"], false,             20,                C.HEIGHT-10-67, 40,  67, "",                 "prev",    0 );
  var bNext   = new ImgButton( res.objImages["levels__button-next.svg"], false,             C.WIDTH-20-40,     C.HEIGHT-10-67, 40,  67, "",                 "next",    0 );
  var bToMenu = new ImgButton( res.objImages["levels__button-toMenu.svg"], res.objImages["levels__button-toMenu_hover.svg"], C.WIDTH/2 - 320/2, C.HEIGHT-10-67, 320, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.txtColor = "#000046";

  levelsFooter.push(bPrev,bNext,bToMenu);

  return levelsFooter;
};

function createPlayer(){               //создаем игрока с уникальными методами

  var player = new Playable(res.objImages["game__player.png"], 0,0,50,50);
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

function createOptionsBut(){           //cоздаем чекбоксы в настройках

  var arrOpt = [];
  var buttons = ["Музыка в меню", "Музыка в игре", "Звуки в игре"];
  var idButtons = ["bMenuMusic", "bGameMusic", "bSfxMusic"];

  for (var i=0; i<buttons.length; i++){
    arrOpt.push( new ImgButton( res.objImages["options__check_white.svg"], false, C.WIDTH/2 - 150, 160+(i*70), 45, 45, buttons[i], idButtons[i], 25, 1, 1, 65 ) );
    arrOpt[i].fFam = "Buccaneer";
    arrOpt[i].checked = false;
    arrOpt[i].check = function(){

      if ( !this.checked ) {
        _img = this.img;
        this.img = res.objImages["options__uncheck_white.svg"];
        this.checked = !this.checked;
      } else {
        this.img = _img;
        this.checked = !this.checked;
      };
    };
  };

  var bToMenu = new ImgButton( res.objImages["levels__button-toMenu.svg"], res.objImages["levels__button-toMenu_hover.svg"], C.WIDTH/2 - 400/2, C.HEIGHT-10-67, 400, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.txtColor = "#000046";

  arrOpt.push( bToMenu );


  return arrOpt;
};


//menu
var logo = new ImgButton( res.objImages["menu__logo.png"], false, C.WIDTH/2-450/2, 20, 450, 150, "", "logo", 0 );
var menu = createMenu(["Играть", "Уровни", "Настройки"],["play", "change_level", "options"]);


//background 
var matrix    = createMatrixBG();         //bg уровня
var bgLevel   = new Image( res.objImages["game__ground.jpg"], 0, 0, C.WIDTH, C.HEIGHT );
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//game header
var header    = new Image( res.objImages["game__bg-header.svg"], 0, 0, C.WIDTH, 71+C.PDNG );
var bFullScr  = new ImgButton( res.objImages["game__button-fullscreen.svg"], res.objImages["game__button-fullscreen_hover.svg"], C.WIDTH-45-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "fullScr", 0 );
var stopWatch = new Button( 10, header.h/2-C.CNV_BORDER/2 - 40/2, 120, 40, "transparent", "00 : 00 : 00", "stopwatch", 25, "dited" );
var bPause    = new ImgButton( res.objImages["game__button-pause.svg"], res.objImages["game__button-pause_hover.svg"], C.WIDTH-45-7-bFullScr.w-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "pause", 0 );
var currLevel = new Button( (stopWatch.x+stopWatch.w+bPause.x)/2-140/2, header.h/2-C.CNV_BORDER/2 - 40/2, 140, 40, "transparent", "Уровень", "curr_level", 25, "capture_it" );


//change level
var levelsHeader   = new ImgButton( res.objImages["game__bg-header.svg"], false, 0, 0, C.WIDTH, 71+C.PDNG, "Выбор уровня", "levels_header", 25 );
var levelsFooter   = createLevelsFooter();
var bLevelsButtons = createLevelsButtons(9);


//options
var optionsHeader  = new ImgButton( res.objImages["game__bg-header.svg"], false, 0, 0, C.WIDTH, 71+C.PDNG, "Настройки", "options_header", 25 );
var optionsMusic   = new Button( C.WIDTH/2-140/2, 90, 140, 40, "transparent", "Музыка", "music", 25, "capture_it" );
var bOptions       = createOptionsBut();

//win pop-up
var winPopUp   = createWinPopUp();


//pause pop-up
var pausePopUp = createPausePopUp();


//playable obj
var pl    = createPlayer();                           //персонаж
var box   = new Playable(res.objImages["game__crystall.svg"], 0,0,50,50); //бокс
var door  = new Playable(res.objImages["game__portal.svg"], 0,0,50,50); //дверь
var walls = [];                                       //стены на уровне, заполняется выбранным уровнем.


//video
var animateBg     = new Video(0, 0, C.WIDTH, C.HEIGHT, res.objVideo["bg.mp4"]);
var videoBgLevels = new Video(0, 0, C.WIDTH, C.HEIGHT, res.objVideo["Lightmirror.mp4"]);


//audio
var audio = {

  button   : new Audio(res.objAudio["button-click.mp3"], 0.5),
  win      : new Audio(res.objAudio["win-audio.mp3"],    0.5),
  player   : new Audio(res.objAudio["player-move.mp3"],  0.25),
  crystal  : new Audio(res.objAudio["crystal-move.mp3"], 0.25),
  bgInGame : new Audio(res.objAudio["bg-inGame.mp3"],    0.5),
  bgInMenu : new Audio(res.objAudio["bg-inMenu.mp3"],    0.0000005),
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
  audio          : audio,
  optionsHeader  : optionsHeader,
  optionsMusic   : optionsMusic,
  bOptions       : bOptions

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

  var objVideo = {}; 
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

    var sliceStart = arrSrcsOfVideo[i].lastIndexOf("\/")+1;
    var key        = arrSrcsOfVideo[i].slice(sliceStart);

    objVideo[key] = video;

  };

  return objVideo;
};

function loadImages(arrSrcsOfImages){

  var objImages = []; 
  var count = arrSrcsOfImages.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var img = document.createElement('img');
    img.src = arrSrcsOfImages[i];
    img.onload = function(){
      loadCount++;
      if ( loadCount == count ) resourses.images = true;
    };
    
    var sliceStart = arrSrcsOfImages[i].lastIndexOf("\/")+1;
    var key        = arrSrcsOfImages[i].slice(sliceStart);
    
    objImages[key] = img;

  };

  return objImages;
};

function loadAudio(arrSrcsOfAudio){

  var objAudio = []; 
  var count = arrSrcsOfAudio.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var audio = document.createElement('audio');
    audio.src = arrSrcsOfAudio[i];
    audio.oncanplaythrough = function(){
      loadCount++;
      if ( loadCount == count ) resourses.audio = true;
    };
    
    var sliceStart = arrSrcsOfAudio[i].lastIndexOf("\/")+1;
    var key        = arrSrcsOfAudio[i].slice(sliceStart);

    objAudio[key] = audio;

  };

  return objAudio;
};

var objAudio = loadAudio([
  "audio/button-click.mp3",
  "audio/win-audio.mp3",
  "audio/player-move.mp3",
  "audio/crystal-move.mp3",
  "audio/bg-inGame.mp3",
  "audio/bg-inMenu.mp3"
]);

var objVideo = loadVideo([
  "video/bg.mp4",
  "video/Lightmirror.mp4"
]);

var objImages = loadImages([
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
  "img/hovers/win__button-next_hover.svg",        //29

  "img/options__uncheck_white.svg",           //30
  "img/options__check_white.svg"              //31
]);

module.exports = { 

  resourses : resourses,

  objVideo  : objVideo,

  objImages : objImages,

  objAudio  : objAudio

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
	this.disabled = false;

	var tmpVol = volume;									    //будет хранить настроенное значения громкости, при изменении громкости в целом, что б можно было восстановить к настроенной.

	this.play = function(dontStop){
		if (!this.disabled){
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

	this.changeVolume = function(percentVol){
		this.a.volume = tmpVol/100 * percentVol;
	};

	this.changeDisable = function(play){
		this.disabled = !this.disabled;
		if (play) ( this.state == "play" ) ? this.stop() : this.play();
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
  this.fFam = "capture_it";

  var metrics = ctx.measureText(this.txt).width; //размер-ширина передаваемого текста
  var _x = ( !this.noCenter ) ? this.setCenter+this.w/2 : this.x+this.padd;

  this.draw = function(){

    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);

    ctx.fillStyle = this.txtColor;
    ctx.textAlign = ( !this.noCenter ) ? "center" : "start";
    ctx.font = this.fSize + 'px ' + this.fFam;
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


},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Audio.js":14,"./classes/Button.js":15,"./classes/Image.js":16,"./classes/ImgButton.js":17,"./classes/Playable.js":18,"./classes/Rect.js":19,"./classes/Video.js":20,"./classes/Wall.js":21}]},{},[22])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcHJlbG9hZGVyLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3Jlc291cnNlcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19zdG9wd2F0Y2guanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0F1ZGlvLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9CdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0ltYWdlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWdCdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1BsYXlhYmxlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9SZWN0LmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9WaWRlby5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvV2FsbC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2Zha2VfYmIwYjM5M2MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgY252ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcbnZhciBjdHggPSBjbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuY252LnN0eWxlLmJvcmRlciA9IFwiMnB4IHNvbGlkIGJsYWNrXCI7XHJcbmNudi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIndoaXRlXCI7XHJcbmNudi53aWR0aCA9IEMuV0lEVEg7XHJcbmNudi5oZWlnaHQgPSBDLkhFSUdIVDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRjbnYgOiBjbnYsXHJcblxyXG5cdGN0eCA6IGN0eFxyXG5cclxufTsiLCJ2YXIgUEFERCA9IDE7IFx0XHRcdFx0XHRcdC8v0L/QsNC00LTQuNC90LMsINC60L7RgtC+0YDRi9C5INGPINGF0L7Rh9GDINGH0YLQvtCx0Ysg0LHRi9C7LCDQvNC10LYg0LrQstCw0LTRgNCw0YLQsNC80LhcclxudmFyIFdJRFRIID0gUEFERCArIChQQUREKzUwKSo5OyBcdC8v0YjQuNGA0LjQvdCwINC60LDQvdCy0YtcclxudmFyIEhFSUdIVCA9IDIwK1BBREQgKyAoUEFERCs1MCkqMTA7ICAgLy/QstGL0YHQvtGC0LAg0LrQsNC90LLRi1xyXG52YXIgQ05WX0JPUkRFUiA9IDI7XHJcbnZhciBIRUFERVJfSCA9IDcxO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdFBETkcgOiBQQURELFxyXG5cclxuXHRXSURUSCA6IFdJRFRILFxyXG5cclxuXHRIRUlHSFQgOiBIRUlHSFQsXHJcblxyXG5cdENOVl9CT1JERVIgOiBDTlZfQk9SREVSLFxyXG5cclxuXHRIRUFERVJfSCA6IEhFQURFUl9IXHJcblxyXG59O1xyXG4iLCIvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vICDQutGA0L7RgdCx0YDQsNGD0LfQtdGA0L3QvtC1INGD0L/RgNCy0LvQtdC90LjQtSDRhtC40LrQu9Cw0LzQuCDQuNCz0YDRi1xyXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKFwiLi9fY2FudmFzLmpzXCIpO1xyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRnYW1lRW5naW5lU3RhcnQgOiBmdW5jdGlvbiAoY2FsbGJhY2spe1xyXG5cdFx0Z2FtZUVuZ2luZSA9IGNhbGxiYWNrO1xyXG5cdFx0Z2FtZUVuZ2luZVN0ZXAoKTtcclxuXHR9LFxyXG5cclxuXHRzZXRHYW1lRW5naW5lIDogZnVuY3Rpb24oY2FsbGJhY2spe1xyXG5cdFx0aWYgKCBjYW52YXMuY252LnN0eWxlLmN1cnNvciAhPSBcImRlZmF1bHRcIiApIGNhbnZhcy5jbnYuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7ICAvL9Cy0YHQtdCz0LTQsCDQv9GA0Lgg0LrQu9C40LrQtSDQvdCwINC70Y7QsdGD0Y4g0LrQvdC+0L/QutGDLCDRh9GC0L4g0LEg0LrRg9GA0YHQvtGAINGB0YLQsNC90LTQsNGA0YLQuNC30LjRgNC+0LLQsNC70YHRj1xyXG5cdFx0Z2FtZUVuZ2luZSA9IGNhbGxiYWNrO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvICAgICAgPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBzdyAgICAgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyk7XHJcbnZhciBnTG9vICAgPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmICAgICA9IHJlcXVpcmUoJy4vX2hlbHBlckZ1bmN0aW9ucy5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBmcyAgICAgPSByZXF1aXJlKCcuL19mdWxsU2NyZWVuLmpzJyk7XHJcbnZhciBDICAgICAgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIga2V5ICAgID0gcmVxdWlyZSgnLi9fa2V5LmpzJyk7XHJcbnZhciByZXMgICAgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxuXHJcbnZhciBhID0gby5hdWRpbztcclxudmFyIGdhbWVMb29wcyA9IGdMb287XHJcblxyXG52YXIgaXNCb3JkZXIgPSB7IC8v0L/RgNC40L3QuNC80LDQtdGCINC+0LHRitC10LrRgiwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10L7QvNC5INCz0YDQsNC90LjRhtGLINC60LDQvdCy0YtcclxuICB1cCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnkgPT0gMDtcclxuICB9LFxyXG5cclxuICBkb3duIDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueSA9PSBDLkhFSUdIVCAtIG9iai5oIC0gQy5QRE5HIC0gQy5IRUFERVJfSCAtIEMuUERORztcclxuICB9LFxyXG5cclxuICBsZWZ0IDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueCA9PSAwO1xyXG4gIH0sXHJcblxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueCA9PSBDLldJRFRIIC0gb2JqLncgLSBDLlBETkcgLSBDLlBETkdcclxuICB9XHJcbn07XHJcblxyXG52YXIgaXNOZWFyID0geyAgIC8v0L/RgNC40L3QuNC80LDQtdGCIDIg0L7QsdGK0LXQutGC0LAsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC80L7QuSDRgdGC0L7RgNC+0L3RiyAx0YvQuSDQvtGCIDLQs9C+LlxyXG5cclxuICB1cCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHsgIC8v0L/RgNC+0LLQtdGA0LrQsCDQv9C10YDQtdC00LDQstCw0LXQvNGL0Lkg0Y3Qu9C10LzQtdC90YIg0LzQsNGB0YHQuNCyINC+0LHRitC10LrRgtC+0LIg0LjQu9C4INC+0LHRitC10LrRgi5cclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnkgKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMltpXS54O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnkgKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gIH0sXHJcblxyXG4gIGRvd24gOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBsZWZ0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueCArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzIueCArIG9ial8yLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfSxcclxuXHJcbiAgcmlnaHQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjYW5Nb3ZlT2JqKGRpcmVjdGlvbil7ICAvLyjQvtC/0LjRgdGL0LLQsNC10Lwg0LPRgNCw0L3QuNGG0Ysg0LTQstC40LbQtdC90LjRjykg0YDQsNC30YDQtdGI0LDQtdGCINC00LLQuNC20LXQvdC40LUg0LIg0L/RgNC10LTQtdC70LDRhSDRg9GA0L7QstC90Y9cclxuXHJcbiAgYS5wbGF5ZXIucGxheSgxKTsgICAgICAgICAgICAgICAvL9C+0LfQstGD0YfQutCwINC00LLQuNC20LXQvdC40Y9cclxuICBvLnBsLmRpcmVjdGlvbiA9IG8ucGwuaXNNb3ZlID0gaGYuZGlyZWN0aW9uSXMoZGlyZWN0aW9uKTtcclxuICBpZiAoIGlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8uYm94KSAmJiAhaXNCb3JkZXJbZGlyZWN0aW9uXShvLmJveCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8uYm94LCBvLndhbGxzKSApeyAgICAgIC8v0LXRgdC70Lgg0YDRj9C00L7QvCDRgSDRj9GJ0LjQutC+0Lwg0Lgg0Y/RidC40Log0L3QtSDRgyDQs9GA0LDQvdC40YYsINC00LLQuNCz0LDQtdC8LlxyXG4gICAgYS5jcnlzdGFsLnBsYXkoMSk7ICAgICAgICAgICAvL9C+0LfQstGD0YfQutCwINGC0L7Qu9C60LDQvdC40Y8g0LrRgNC40YHRgtCw0LvQu9CwXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIG8uYm94Lm1vdmUoZGlyZWN0aW9uKTtcclxuICB9IGVsc2UgaWYoICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5wbCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0L3QtSDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0LPRgNCw0L3QuNGG0LXQuSwg0LTQstC40LPQsNC10LzRgdGPLlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNDdXJzb3JJbkJ1dHRvbih4LHksYnV0KXsgLy/QstC+0LfQstGA0LDRidCw0LXRgiDRgtGA0YMsINC10YHQu9C4INC60YPRgNGB0L7RgCDQv9C+0L/QsNC7INCyINC60L7QvtGA0LTQuNC90LDRgtGLINC+0LHRitC10LrRgtCwXHJcbiAgcmV0dXJuIHggPj0gYnV0LnggJiYgXHJcbiAgeCA8PSBidXQueCtidXQudyAmJiBcclxuICB5ID49IGJ1dC55ICYmIFxyXG4gIHkgPD0gYnV0LnkrYnV0LmhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGxvYWRMZXZlbChudW1iZXIpeyAgICAgICAvL9C30LDQs9GA0YPQt9C60LAg0YPRgNC+0LLQvdGPXHJcbiAgc3cuc3RhcnQoKTsgICAgICAgICAgICAgICAgICAgICAgICAgIC8v0LfQsNC/0YPRgdC60LDQtdC8INGC0LDQudC80LXRgFxyXG4gIGxldmVsc1tudW1iZXJdKCk7ICAgICAgICAgICAgICAgICAgICAvL9C30LDQv9GD0YHQutCw0LXQvCDRg9GA0L7QstC10YDRjCDQutC+0YLQvtGA0YvQuSDQt9Cw0L/RgNC+0YHQuNC70LhcclxuICBnYW1lTG9vcHMuY3VycmVudExldmVsID0gbnVtYmVyOyAgICAgLy/Qt9Cw0L/QvtC80LjQvdCw0LXQvCDQutCw0LrQvtC5INGB0LXQudGH0LDRgSDRg9GA0L7QstC10L3RjCDQuNCz0YDQsNGC0Ywg0LHRg9C00LXQvCBcclxuICBvLmN1cnJMZXZlbC50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK251bWJlcjsgLy/QsiDRhdC10LTQtdGA0LUg0LLRi9Cy0L7QtNC40Lwg0L3QvtC80LXRgCDRg9GA0L7QstC90Y9cclxuICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5nYW1lKTsgLy/QvdGDINC4INC30LDQv9GD0YHQutCw0LXQvCDRhtC40LrQuyDQuNCz0YDRiyBcclxufTtcclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbihlKXsgICAvL9GB0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC60LvQsNCy0LjRiFxyXG5cclxuICBpZiAoIGdMb28uc3RhdHVzID09IFwiZ2FtZVwiICl7IC8v0L/QtdGA0LXQtNCy0LjQs9Cw0YLRjNGB0Y8g0YLQvtC70YzQutC+INC10YHQu9C4INC40LTQtdGCINC40LPRgNCwLlxyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIkRcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwicmlnaHRcIik7XHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiU1wiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJkb3duXCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIldcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwidXBcIik7XHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiQVwiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJsZWZ0XCIpO1xyXG5cclxuICB9O1xyXG5cclxuICB3aW5kb3cub25rZXl1cCA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgby5wbC5pc01vdmUgPSBmYWxzZTtcclxuICB9O1xyXG59O1xyXG5cclxud2luZG93Lm9ubW91c2Vkb3duID0gZnVuY3Rpb24oZSl7IC8vY9C+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQvNGL0YjQutC4XHJcblxyXG4gIGlmICggZnMuaXNGdWxsU2NyZWVuICl7ICAgICAgXHJcbiAgICB2YXIgeCA9IChlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdCkvZnMuem9vbTtcclxuICAgIHZhciB5ID0gKGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3ApL2ZzLnpvb207XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciB4ID0gZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQ7XHJcbiAgICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcbiAgfTtcclxuXHJcbiAgc3dpdGNoIChnTG9vLnN0YXR1cyl7XHJcblxyXG4gICAgY2FzZSBcIm1lbnVcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLm1lbnVbaV0pICl7XHJcbiAgICAgICAgICBzd2l0Y2ggKG8ubWVudVtpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicGxheVwiIDpcclxuICAgICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgICAgICAgYS5iZ0luTWVudS5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgbG9hZExldmVsKGdhbWVMb29wcy5jdXJyZW50TGV2ZWwpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcImNoYW5nZV9sZXZlbFwiIDpcclxuICAgICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubGV2ZWxzKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJvcHRpb25zXCIgOlxyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5vcHRpb25zKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJsZXZlbHNcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5sZXZlbHNGb290ZXIgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubGV2ZWxzRm9vdGVyW2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLmxldmVsc0Zvb3RlcltpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicHJldlwiIDpcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcItCa0L3QvtC/0LrQsCDQvdCw0LfQsNC0LCDQv9C+0LrQsCDRgtCw0LouXCIpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInRvX21lbnVcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcIm5leHRcIiA6XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0LLQv9C10YDQtdC0LCDQv9C+0LrQsCDRgtCw0LouXCIpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG8uYkxldmVsc0J1dHRvbnMubGVuZ3RoOyBpKysgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkxldmVsc0J1dHRvbnNbaV0pICl7XHJcbiAgICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgICBhLmJnSW5NZW51LnN0b3AoKTtcclxuICAgICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBpKzE7XHJcbiAgICAgICAgICBsb2FkTGV2ZWwoaSsxKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwib3B0aW9uc1wiIDpcclxuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgby5iT3B0aW9ucy5sZW5ndGg7IGkrKyApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iT3B0aW9uc1tpXSkgKXtcclxuICAgICAgICAgIHN3aXRjaCAoby5iT3B0aW9uc1tpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiYk1lbnVNdXNpY1wiIDpcclxuICAgICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KDEpO1xyXG4gICAgICAgICAgICAgIG8uYk9wdGlvbnNbaV0uY2hlY2soKTtcclxuICAgICAgICAgICAgICBhLmJnSW5NZW51LmNoYW5nZURpc2FibGUoMSk7IFxyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcImJHYW1lTXVzaWNcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgxKTtcclxuICAgICAgICAgICAgICBvLmJPcHRpb25zW2ldLmNoZWNrKCk7XHJcbiAgICAgICAgICAgICAgYS5iZ0luR2FtZS5jaGFuZ2VEaXNhYmxlKCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiYlNmeE11c2ljXCIgOlxyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoMSk7XHJcbiAgICAgICAgICAgICAgby5iT3B0aW9uc1tpXS5jaGVjaygpO1xyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLmNoYW5nZURpc2FibGUoKTtcclxuICAgICAgICAgICAgICBhLndpbi5jaGFuZ2VEaXNhYmxlKCk7XHJcbiAgICAgICAgICAgICAgYS5wbGF5ZXIuY2hhbmdlRGlzYWJsZSgpO1xyXG4gICAgICAgICAgICAgIGEuY3J5c3RhbC5jaGFuZ2VEaXNhYmxlKCk7XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgxKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJ0b19tZW51XCIgOlxyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrOyBcclxuXHJcbiAgICBjYXNlIFwiZ2FtZVwiIDpcclxuICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJQYXVzZSkgKXtcclxuICAgICAgICBhLmJnSW5HYW1lLnBhdXNlKCk7XHJcbiAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgIHN3LnBhdXNlVGltZXIoKTtcclxuICAgICAgICBvLmJnT3BhY2l0eS5kcmF3KCk7XHJcbiAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMucGF1c2UpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJGdWxsU2NyKSApe1xyXG4gICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAoICFmcy5pc0Z1bGxTY3JlZW4gKSA/IGZzLmxhdW5jaEZ1bGxTY3JlZW4oY2FudmFzLmNudikgOiBmcy5jYW5zZWxGdWxsU2NyZWVuKCk7IFxyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwid2luXCIgOlxyXG5cclxuICAgICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLndpblBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfZXhpdFwiICl7XHJcbiAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgICAgYS5iZ0luR2FtZS5zdG9wKCk7XHJcbiAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX25leHRcIiAmJiBnYW1lTG9vcHMuY3VycmVudExldmVsICE9IGxldmVscy5sdmxzQ291bnQoKSApe1xyXG4gICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgICAgIHN3LnJlc2V0KCk7XHJcbiAgICAgICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwrKztcclxuICAgICAgICAgICAgbG9hZExldmVsKGdhbWVMb29wcy5jdXJyZW50TGV2ZWwpO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwicGF1c2VcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5wYXVzZVBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLnBhdXNlUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgICBzd2l0Y2ggKG8ucGF1c2VQb3BVcFtpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicmV0dXJuXCIgOlxyXG4gICAgICAgICAgICAgIHN3LnN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgYS5iZ0luR2FtZS5wbGF5KCk7XHJcbiAgICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMuZ2FtZSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicmVzdGFydFwiIDpcclxuICAgICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgIGEuYmdJbkdhbWUuc3RvcCgpO1xyXG4gICAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJleGl0XCIgOlxyXG4gICAgICAgICAgICAgIHN3LnJlc2V0KCk7XHJcbiAgICAgICAgICAgICAgYS5iZ0luR2FtZS5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgfTtcclxufTtcclxuXHJcbndpbmRvdy5vbm1vdXNlbW92ZSA9IGZ1bmN0aW9uKGUpeyAvL9GB0L7QsdGL0YLQuNGPINC00LLQuNC20LXQvdC40Y8g0LzRi9GI0LrQuCwg0YLRg9GCINGF0L7QstC10YDRiyDQvtCx0YDQsNCx0L7RgtCw0LXQvFxyXG5cclxuICBpZiAoIGZzLmlzRnVsbFNjcmVlbiApe1xyXG4gICAgdmFyIHggPSAoZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQpL2ZzLnpvb207XHJcbiAgICB2YXIgeSA9IChlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wKS9mcy56b29tO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgeCA9IGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0O1xyXG4gICAgdmFyIHkgPSBlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wO1xyXG4gIH07XHJcblxyXG4gIHN3aXRjaCAoZ0xvby5zdGF0dXMpe1xyXG5cclxuICAgIGNhc2UgXCJtZW51XCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApID8gby5tZW51W2ldLmhvdmVyKDEpIDogby5tZW51W2ldLmhvdmVyKCk7XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJnYW1lXCIgOlxyXG4gICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYlBhdXNlKSApICAgPyBvLmJQYXVzZS5ob3ZlcigxKSAgIDogby5iUGF1c2UuaG92ZXIoKTtcclxuXHJcbiAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKSA/IG8uYkZ1bGxTY3IuaG92ZXIoMSkgOiBvLmJGdWxsU2NyLmhvdmVyKCk7ICBcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcIndpblwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLndpblBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfZXhpdFwiICl7XHJcbiAgICAgICAgICAgIG8ud2luUG9wVXBbaV0uaG92ZXIoMSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgIT0gbGV2ZWxzLmx2bHNDb3VudCgpICl7XHJcbiAgICAgICAgICAgIG8ud2luUG9wVXBbaV0uaG92ZXIoMSk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0uaG92ZXIgKSBvLndpblBvcFVwW2ldLmhvdmVyKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImxldmVsc1wiIDpcclxuICAgICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5sZXZlbHNGb290ZXJbaV0pICkgICA/IG8ubGV2ZWxzRm9vdGVyW2ldLmhvdmVyKDEpICAgOiBvLmxldmVsc0Zvb3RlcltpXS5ob3ZlcigpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgby5iTGV2ZWxzQnV0dG9ucy5sZW5ndGg7IGkrKyApe1xyXG4gICAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iTGV2ZWxzQnV0dG9uc1tpXSkgKSA/IG8uYkxldmVsc0J1dHRvbnNbaV0uaG92ZXIoMSkgOiBvLmJMZXZlbHNCdXR0b25zW2ldLmhvdmVyKCk7XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gIFxyXG4gICAgY2FzZSBcIm9wdGlvbnNcIiA6XHJcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG8uYk9wdGlvbnMubGVuZ3RoOyBpKysgKXtcclxuICAgICAgICAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYk9wdGlvbnNbaV0pICkgPyBvLmJPcHRpb25zW2ldLmhvdmVyKDEpIDogby5iT3B0aW9uc1tpXS5ob3ZlcigpO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwicGF1c2VcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5wYXVzZVBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLnBhdXNlUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ucGF1c2VQb3BVcFtpXS5ob3ZlciApIG8ucGF1c2VQb3BVcFtpXS5ob3ZlcigxKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKCBvLnBhdXNlUG9wVXBbaV0uaG92ZXIgKSBvLnBhdXNlUG9wVXBbaV0uaG92ZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICB9O1xyXG59O1xyXG4iLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciB6b29tID0gMDtcclxuXHJcbmZ1bmN0aW9uIGZ1bGxDYW52YXMoKXtcdC8v0LrQsNC90LLQsCDQstC+INCy0LXRgdGMINGN0LrRgNCw0L1cclxuXHJcblx0dmFyIGRldmljZVdpZHRoID0gd2luZG93LnNjcmVlbi5hdmFpbFdpZHRoO1xyXG5cdHZhciBkZXZpY2VIZWlnaHQgPSB3aW5kb3cuc2NyZWVuLmF2YWlsSGVpZ2h0O1xyXG5cdGZ1bGxTY3JlZW4uem9vbSA9IChkZXZpY2VIZWlnaHQgLyBDLkhFSUdIVCkudG9GaXhlZCgxKTtcdC8v0LrQsNC60L7QtSDRg9Cy0LXQu9C40YfQtdC90LjQtSDRgdC00LXQu9Cw0YLRjCDQuNGB0YXQvtC00Y8g0LjQtyDRgNCw0LfQvNC10YDQvtCyINGN0LrRgNCw0L3QsC5cclxuXHJcblx0Y2FudmFzLmNudi53aWR0aCA9IGNhbnZhcy5jbnYud2lkdGgqZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQqZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jdHguc2NhbGUoZnVsbFNjcmVlbi56b29tLGZ1bGxTY3JlZW4uem9vbSk7XHJcblxyXG5cdGZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuID0gIWZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbm9ybWFsQ2FudmFzKCl7XHQvL9C40YHRhdC+0LTQvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1INC60LDQvdCy0YtcclxuXHJcblx0Ly9j0L7RhdGA0LDQvdGP0LXQvCDQv9C+0YHQu9C10LTQvdC40Lkg0LrQsNC00YAg0LjQs9GA0YssINC00LDQsdGLINC/0YDQuCDQstC+0LfQstGA0LDRidC10L3QuNC4INGA0LDQt9C80LXRgNCwINC/0L7RgdC70LUg0YTRg9C70YHQutGA0LjQvdCwLCDQvtC9INC+0YLRgNC40YHQvtCy0LDQu9GB0Y8sINC40L3QsNGH0LUg0LHRg9C00LXRgiDQsdC10LvRi9C5INGF0L7Qu9GB0YIuXHJcblx0dmFyIGJ1ZkNudiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcblx0dmFyIGJ1ZkN0eCA9IGJ1ZkNudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcblx0YnVmQ252LndpZHRoID0gY2FudmFzLmNudi53aWR0aC9mdWxsU2NyZWVuLnpvb207XHJcblx0YnVmQ252LmhlaWdodCA9IGNhbnZhcy5jbnYuaGVpZ2h0L2Z1bGxTY3JlZW4uem9vbTtcclxuXHRidWZDdHguZHJhd0ltYWdlKGNhbnZhcy5jbnYsIDAsMCwgY2FudmFzLmNudi53aWR0aC9mdWxsU2NyZWVuLnpvb20sIGNhbnZhcy5jbnYuaGVpZ2h0L2Z1bGxTY3JlZW4uem9vbSk7XHJcblxyXG5cdGNhbnZhcy5jbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbTtcclxuXHRjYW52YXMuY252LmhlaWdodCA9IGNhbnZhcy5jbnYuaGVpZ2h0L2Z1bGxTY3JlZW4uem9vbTtcclxuXHRjYW52YXMuY3R4LnNjYWxlKDEsMSk7XHJcblx0Y2FudmFzLmN0eC5kcmF3SW1hZ2UoYnVmQ252LDAsMCxjYW52YXMuY252LndpZHRoLGNhbnZhcy5jbnYuaGVpZ2h0KTtcclxuXHJcblx0ZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW4gPSAhZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW47XHJcbn07XHJcblxyXG5mdW5jdGlvbiBvbkZ1bGxTY3JlZW5DaGFuZ2UoKXtcdC8v0L/RgNC4INC40LfQvNC10L3QuNC4INGB0L7RgdGC0L7Rj9C90LjQtSDRhNGD0LvRgdC60YDQuNC90LBcclxuXHJcblx0KCBmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbiApID8gbm9ybWFsQ2FudmFzKCkgOiBmdWxsQ2FudmFzKCk7XHJcbn07XHJcblxyXG5jYW52YXMuY252LmFkZEV2ZW50TGlzdGVuZXIoXCJ3ZWJraXRmdWxsc2NyZWVuY2hhbmdlXCIsIG9uRnVsbFNjcmVlbkNoYW5nZSk7XHJcbmNhbnZhcy5jbnYuYWRkRXZlbnRMaXN0ZW5lcihcIm1vemZ1bGxzY3JlZW5jaGFuZ2VcIiwgICAgb25GdWxsU2NyZWVuQ2hhbmdlKTtcclxuY2FudmFzLmNudi5hZGRFdmVudExpc3RlbmVyKFwiZnVsbHNjcmVlbmNoYW5nZVwiLCAgICAgICBvbkZ1bGxTY3JlZW5DaGFuZ2UpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdWxsU2NyZWVuID0geyBcclxuXHJcblx0bGF1bmNoRnVsbFNjcmVlbiA6IGZ1bmN0aW9uKGVsZW0pe1xyXG5cclxuXHRcdGlmICggZWxlbS5yZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLnJlcXVlc3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBlbGVtLm1velJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ubW96UmVxdXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZWxlbS53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9O1xyXG5cdH0sXHJcblxyXG5cdGNhbnNlbEZ1bGxTY3JlZW4gOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdGlmICggZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdH07XHJcblx0fSxcclxuXHJcblx0aXNGdWxsU2NyZWVuIDogZmFsc2UsXHJcblxyXG5cdHpvb20gOiB6b29tXHJcblxyXG59OyIsInZhciBDICAgICAgICAgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyAgICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgaGYgICAgICAgID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBlbmdpbiAgICAgPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIHJlcyAgICAgICA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG52YXIgcHJlbG9hZGVyID0gcmVxdWlyZSgnLi9fcHJlbG9hZGVyLmpzJyk7XHJcblxyXG52YXIgYSA9IG8uYXVkaW87XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVMb29wcyA9ICB7XHJcblxyXG4gIGxvYWRlciA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwibG9hZGVyXCI7XHJcblxyXG4gICAgcHJlbG9hZGVyLnVwZGF0ZUxvYWRlcigpO1xyXG4gICAgcHJlbG9hZGVyLmRyYXdMb2FkZXIoKTtcclxuICAgIHByZWxvYWRlci5kcmF3TG9hZFRleHQoKTtcclxuICAgIFxyXG4gICAgaWYgKCByZXMucmVzb3Vyc2VzLmFyZUxvYWRlZCgpICkgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwiZ2FtZVwiOyBcclxuXHJcbiAgICBpZiAoYS5iZ0luR2FtZS5zdGF0ZSA9PSBcInN0b3BcIikgYS5iZ0luR2FtZS5wbGF5KCk7XHJcblxyXG4gICAgLy/QvtGH0LjRgdGC0LrQsCDQvtCx0LvQsNGB0YLQuFxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDQsdCzINGD0YDQvtCy0L3Rj1xyXG4gICAgby5iZ0xldmVsLmRyYXcoKTtcclxuICAgIFxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1INC40LPRgNGLXHJcbiAgICBmb3IgKCBpIGluIG8ubWF0cml4ICl7XHJcbiAgICAgIG8ubWF0cml4W2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0YHRgtC10L3Ri1xc0L/RgNC10LPRgNCw0LTRi1xyXG4gICAgZm9yICggaSBpbiBvLndhbGxzICl7XHJcbiAgICAgIG8ud2FsbHNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDRhdC10LTQtdGA0LAg0YPRgNC+0LLQvdGPXHJcbiAgICBvLmhlYWRlci5kcmF3KCk7XHJcbiAgICBvLnN0b3BXYXRjaC5kcmF3KDEsMTApO1xyXG4gICAgby5iRnVsbFNjci5kcmF3KCk7XHJcbiAgICBvLmJQYXVzZS5kcmF3KCk7XHJcbiAgICBvLmN1cnJMZXZlbC5kcmF3KCk7XHJcblxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0LjQs9GA0L7QstGL0YUg0L7QsdGK0LXQutGC0L7QslxyXG4gICAgby5kb29yLmRyYXcoKTtcclxuICAgIG8ucGwuZHJhdygpO1xyXG4gICAgby5ib3guZHJhdygpO1xyXG5cclxuICAgIC8v0LXRgdC70Lgg0L/QvtCx0LXQtNC40LvQuFxyXG4gICAgaWYgKCBoZi5pc1dpbigpICl7XHJcbiAgICAgIG8uYmdPcGFjaXR5LmRyYXcoKTsgLy/QvtGC0YDQuNGB0L7QstC60LAg0LfQsNGC0LXQvNC90LXQvdC40Y9cclxuICAgICAgYS53aW4ucGxheSgpOyAgICAgICAvL9C+0LfQstGD0YfQutCwINC/0L7QsdC10LTQutC4XHJcbiAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLndpbik7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIG1lbnUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIm1lbnVcIjtcclxuXHJcbiAgICBpZiAoYS5iZ0luTWVudS5zdGF0ZSA9PSBcInN0b3BcIikgYS5iZ0luTWVudS5wbGF5KCk7XHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICBvLmFuaW1hdGVCZy5kcmF3KCk7XHJcblxyXG4gICAgby5sb2dvLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICBvLm1lbnVbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICB3aW4gOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIndpblwiO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby53aW5Qb3BVcCApe1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcIndpbl90ZXh0XCIgKSBvLndpblBvcFVwW2ldLnR4dCA9IFwi0KPRgNC+0LLQtdC90YwgXCIrZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbDtcclxuICAgICAgXHJcbiAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX25leHRcIiAmJiBnYW1lTG9vcHMuY3VycmVudExldmVsID09IGxldmVscy5sdmxzQ291bnQoKSApIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvLndpblBvcFVwW2ldLmRyYXcoKTtcclxuICAgICAgfSAgXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHBhdXNlIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJwYXVzZVwiO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5wYXVzZVBvcFVwICl7XHJcbiAgICAgIG8ucGF1c2VQb3BVcFtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGxldmVscyA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwibGV2ZWxzXCI7XHJcblxyXG4gICAgaWYgKGEuYmdJbk1lbnUuc3RhdGUgPT0gXCJzdG9wXCIpIGEuYmdJbk1lbnUucGxheSgpO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby52aWRlb0JnTGV2ZWxzLmRyYXcoKTtcclxuXHJcbiAgICBvLmxldmVsc0hlYWRlci5kcmF3KCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLmJMZXZlbHNCdXR0b25zICl7XHJcbiAgICAgIG8uYkxldmVsc0J1dHRvbnNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgIGlmICggby5sZXZlbHNGb290ZXJbaV0ubmFtZSA9PSBcInRvX21lbnVcIiApIG8ubGV2ZWxzRm9vdGVyW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgb3B0aW9ucyA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwib3B0aW9uc1wiO1xyXG5cclxuICAgIGlmIChhLmJnSW5NZW51LnN0YXRlID09IFwic3RvcFwiKSBhLmJnSW5NZW51LnBsYXkoKTtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8udmlkZW9CZ0xldmVscy5kcmF3KCk7XHJcblxyXG4gICAgby5vcHRpb25zSGVhZGVyLmRyYXcoKTtcclxuICAgIG8ub3B0aW9uc011c2ljLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8uYk9wdGlvbnMgKXtcclxuICAgICAgby5iT3B0aW9uc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHN0YXR1cyA6IFwiXCIsXHJcblxyXG4gIGN1cnJlbnRMZXZlbCA6IFwiMVwiXHJcblxyXG59O1xyXG4iLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gIGNsZWFyUmVjdCA6IGZ1bmN0aW9uKHgseSx3LGgpeyAgICAgIC8v0L7Rh9C40YHRgtC40YLQtdC70YxcclxuICAgIGN0eC5jbGVhclJlY3QoeCx5LHcsaCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UmFuZG9tSW50IDogZnVuY3Rpb24obWluLCBtYXgpIHsgLy/RhNGD0L3QutGG0LjRjyDQtNC70Y8g0YDQsNC90LTQvtC80LAg0YbQtdC70L7Rh9C40YHQu9C10L3QvdC+0LPQviDQt9C90LDRh9C10L3QuNGPXHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxuICB9LFxyXG5cclxuICBpc1dpbiA6IGZ1bmN0aW9uKCl7ICAgICAgICAgICAgICAgICAvL9C/0L7QsdC10LTQuNC70Lg/XHJcbiAgICByZXR1cm4gby5ib3gueCA9PSBvLmRvb3IueCAmJiBvLmJveC55ID09IG8uZG9vci55O1xyXG4gIH0sXHJcblxyXG4gIGRpcmVjdGlvbklzIDogZnVuY3Rpb24oZGlyZWN0aW9uKXsgIC8v0LLQvtC30LLRgNCw0YnQsNC10YIg0YPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQsiDQs9GA0LDQtNGD0YHQsNGFLCDQvNC+0LbQvdC+INCx0YvQu9C+INC4INGB0LTQtdC70LDRgtGMINC/0YDQvtGJ0LUgLSDQvtCx0YrQtdC60YLQvtC8LlxyXG4gIFx0c3dpdGNoKGRpcmVjdGlvbil7XHJcblxyXG4gIFx0XHRjYXNlIFwidXBcIiAgIDogcmV0dXJuIDM2MDtcclxuICBcdFx0YnJlYWs7XHJcbiAgXHRcdGNhc2UgXCJkb3duXCIgOiByZXR1cm4gMTgwO1xyXG4gIFx0XHRicmVhaztcclxuICBcdFx0Y2FzZSBcImxlZnRcIiA6IHJldHVybiAyNzA7XHJcbiAgXHRcdGJyZWFrO1xyXG4gIFx0XHRjYXNlIFwicmlnaHRcIjogcmV0dXJuIDkwO1xyXG4gIFx0XHRicmVhaztcclxuXHJcbiAgXHR9O1xyXG4gIH1cclxufTtcclxuIiwidmFyIGtleXMgPSB7XHJcblx0XCJXXCIgOiA4NyxcclxuXHRcIlNcIiA6IDgzLFxyXG5cdFwiQVwiIDogNjUsXHJcblx0XCJEXCIgOiA2OFxyXG59O1xyXG5cclxudmFyIGtleURvd24gPSAwO1xyXG4vLyB2YXIga2V5RG93biA9IHt9O1xyXG5cclxuZnVuY3Rpb24gc2V0S2V5KGtleUNvZGUpe1xyXG5cdGtleURvd24gPSBrZXlDb2RlO1xyXG5cdC8vIGtleURvd25ba2V5Y29kZV0gPSB0cnVlO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY2xlYXJLZXkoa2V5Q29kZSl7XHJcblx0a2V5RG93biA9IDA7XHJcblx0Ly8ga2V5RG93bltrZXlDb2RlXSA9IGZhbHNlO1xyXG59O1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdHNldEtleShlLmtleUNvZGUpO1xyXG59KTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBmdW5jdGlvbihlKXtcclxuXHRjbGVhcktleShlLmtleUNvZGUpO1xyXG59KTtcclxuXHJcblxyXG5mdW5jdGlvbiBpc0tleURvd24oa2V5TmFtZSl7XHJcblx0cmV0dXJuIGtleURvd25ba2V5c1trZXlOYW1lXV0gPT0gdHJ1ZTtcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdGlzS2V5RG93biA6IGZ1bmN0aW9uKGtleU5hbWUpe1xyXG5cdFx0cmV0dXJuIGtleURvd24gPT0ga2V5c1trZXlOYW1lXTtcclxuXHRcdC8vIHJldHVybiBrZXlEb3duW2tleXNba2V5TmFtZV1dID09IHRydWU7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcbnZhciBoZiA9IHJlcXVpcmUoJy4vX2hlbHBlckZ1bmN0aW9ucy5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbHMgPSB7XHJcblxyXG5cdGx2bHNDb3VudCA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0Zm9yKGtleSBpbiBsZXZlbHMpeyBjb3VudCsrIH07XHJcblx0XHRyZXR1cm4gY291bnQtMTtcclxuXHR9LFxyXG5cclxuXHQxIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICAvL9C80LDRgdGB0LjQsiDRgSDQsdGD0LTRg9GJ0LXQv9C+0YHRgtGA0L7QtdC90L3Ri9C80Lgg0YHRgtC10L3QutCw0LzQuFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwyXSxbMCw2XSxbMSwxXSxbMSw0XSxbMSw3XSxbMiwyXSxbMiw1XSxbMiw4XSxbMywwXSxbMywyXSxbMywzXSxbMyw1XSxbMyw2XSxbMyw4XSxbNCwyXSxbNCw1XSxbNCw4XSxbNSwxXSxbNSw0XSxbNSw3XSxbNiwyXSxbNiw1XSxbNywwXSxbNywyXSxbNywzXSxbNyw1XSxbNyw2XSxbNyw3XSxbOCw1XSxcclxuXHRcdF07XHRcdFx0XHQgIC8v0L/RgNC40LTRg9C80LDQvdC90YvQuSDQvNCw0YHRgdC40LIg0YHQviDRgdGC0LXQvdC60LDQvNC4XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMub2JqSW1hZ2VzW1wiZ2FtZV9fd2FsbC5zdmdcIl0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvNCw0YHRgdC40LIgd2FsbHNcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJkb3duXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCA4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArNiooNTArQy5QRE5HKSwgOCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDIgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwwXSxbMCw0XSxbMCwzXSxbMCw2XSxbMiwyXSxbMiw0XSxbMyw4XSxbMywwXSxbMyw3XSxbNCwyXSxbNCw0XSxbNCw1XSxbNCw2XSxbNSwwXSxbNiwyXSxbNiw1XSxbNiw2XSxbNiw3XSxbNywwXSxbOCwzXSxbOCw0XSxbOCw3XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMub2JqSW1hZ2VzW1wiZ2FtZV9fd2FsbC5zdmdcIl0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInJpZ2h0XCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs2Kig1MCtDLlBETkcpLCAwKzcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKzYqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQzIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMl0sWzAsN10sWzEsNV0sWzEsOF0sWzIsMl0sWzIsN10sWzMsNF0sWzQsMV0sWzQsNF0sWzQsNl0sWzYsMl0sWzYsM10sWzYsNF0sWzYsNl0sWzYsOF0sWzcsMF0sWzcsNV0sWzgsMF0sWzgsMV0sWzgsM10sWzgsN11cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLm9iakltYWdlc1tcImdhbWVfX3dhbGwuc3ZnXCJdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInVwXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsxKig1MCtDLlBETkcpLCAwKzYqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCsyKig1MCtDLlBETkcpLCAwKzMqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQ0IDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMV0sWzEsNV0sWzEsN10sWzIsNF0sWzMsMV0sWzMsM10sWzMsNl0sWzMsOF0sWzQsM10sWzUsNV0sWzUsN10sWzYsMF0sWzYsMl0sWzYsM10sWzYsNV0sWzcsOF0sWzgsMF0sWzgsOF1cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLm9iakltYWdlc1tcImdhbWVfX3dhbGwuc3ZnXCJdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInVwXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs2Kig1MCtDLlBETkcpLCAwKzAqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQ1IDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMV0sWzAsM10sWzAsNV0sWzAsOF0sWzIsMl0sWzIsNF0sWzIsNl0sWzIsOF0sWzQsMF0sWzQsM10sWzQsNV0sWzQsN10sWzYsMV0sWzYsMl0sWzYsNF0sWzYsN10sWzcsOF0sWzgsMl0sWzgsNF0sWzgsOF1cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLm9iakltYWdlc1tcImdhbWVfX3dhbGwuc3ZnXCJdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCswKig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJkb3duXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsxKig1MCtDLlBETkcpLCAwKzEqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCwgMCs4Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0NiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFsxLDNdLFsxLDRdLFsxLDVdLFsyLDBdLFsyLDZdLFsyLDhdLFszLDJdLFs0LDFdLFs0LDNdLFs0LDddLFs1LDRdLFs2LDRdLFs2LDZdLFs3LDFdLFs3LDhdLFs4LDBdLFs4LDRdLFs4LDVdXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5vYmpJbWFnZXNbXCJnYW1lX193YWxsLnN2Z1wiXSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDAgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInJpZ2h0XCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsyKig1MCtDLlBETkcpLCA3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDcgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwwXSxbMCw4XSxbMSwzXSxbMSw0XSxbMSw1XSxbMywxXSxbMywzXSxbMyw3XSxbNCwxXSxbNCw0XSxbNSwxXSxbNSw3XSxbNywzXSxbNyw0XSxbNyw1XSxbNyw2XSxbOCwwXSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMub2JqSW1hZ2VzW1wiZ2FtZV9fd2FsbC5zdmdcIl0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwKzEqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInJpZ2h0XCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCA3Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArMyooNTArQy5QRE5HKSwgMCs0Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0OCA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDJdLFsxLDVdLFsxLDhdLFsyLDFdLFsyLDVdLFszLDFdLFszLDddLFs0LDJdLFs0LDRdLFs1LDJdLFs1LDhdLFs2LDNdLFs2LDVdLFs2LDZdLFs3LDFdLFs3LDNdLFs3LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5vYmpJbWFnZXNbXCJnYW1lX193YWxsLnN2Z1wiXSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDAgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcImRvd25cIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzUqKDUwK0MuUERORyksIDcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCooNTArQy5QRE5HKSwgMCs3Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0OSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDBdLFswLDVdLFsxLDRdLFsxLDVdLFsxLDhdLFsyLDJdLFsyLDddLFszLDBdLFszLDNdLFs0LDNdLFs0LDVdLFs0LDZdLFs1LDBdLFs1LDJdLFs2LDRdLFs2LDVdLFs3LDBdLFs3LDhdLFs4LDFdLFs4LDVdXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5vYmpJbWFnZXNbXCJnYW1lX193YWxsLnN2Z1wiXSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDgqKDUwK0MuUERORyksIDAgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcImxlZnRcIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzYqKDUwK0MuUERORyksIDEqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCszKig1MCtDLlBETkcpLCAwKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIEMgICAgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgY252cyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgcmVzICA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1hdHJpeEJHKCl7ICAgICAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1XHJcbiAgdmFyIG1hdHJpeCA9IFtdOyAgICAgICAgICAgICAgICAgICAgIC8v0LzQsNGB0YHQuNCyINC00LvRjyDQvNCw0YLRgNC40YfQvdC+0LPQviDQstC40LTQsCDRg9GA0L7QstC90Y9cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspeyAgICAgICAgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC+0LHRitC10LrRglxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCA5OyBqKyspe1xyXG4gICAgICBtYXRyaXgucHVzaCggbmV3IFJlY3QoQy5QRE5HK2oqKDUwK0MuUERORyksIDcxK0MuUERORytpKig1MCtDLlBETkcpLCA1MCwgNTAsIFwicmdiYSgwLDAsMCwwLjUpXCIsIHRydWUpICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1hdHJpeFxyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWVudSh0eHRBcnIsIG5hbWVBcnIpeyAgLy/RgdC+0LfQtNCw0LXQvCDQs9C70LDQstC90L7QtSDQvNC10L3RjlxyXG4gIHZhciBtZW51ID0gW107XHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBhbW91bnRzID0gdHh0QXJyLmxlbmd0aDtcclxuICBcclxuICB2YXIgX2ZvbnRzaXplID0gXCIyOFwiO1xyXG4gIHZhciBfeCA9IEMuV0lEVEgvMi0zMDAvMjtcclxuICB2YXIgX3kgPSAoQy5IRUlHSFQvMikgLSAoODUqYW1vdW50cy8yKSArIDg1OyBcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbW91bnRzOyBpKyspe1xyXG4gICAgbWVudS5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMub2JqSW1hZ2VzW1wibWVudV9fYnV0dG9uLW1lbnUuc3ZnXCJdLCByZXMub2JqSW1hZ2VzW1wibWVudV9fYnV0dG9uLW1lbnVfaG92ZXIuc3ZnXCJdLCBfeCwgX3kraSo4NSwgMzAwLCA2MCwgdHh0W2ldLCBuYW1lc1tpXSwgX2ZvbnRzaXplLCA4MyApICk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1lbnU7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXaW5Qb3BVcCgpeyAgICAgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INC/0L7QsdC10LTQvdGD0Y4g0LLRgdC/0LvQu9GL0LLQsNGI0LrRg1xyXG5cclxuICB2YXIgd2luUG9wQkcgICAgICA9IG5ldyBJbWFnZSggcmVzLm9iakltYWdlc1tcIndpbl9fYmcuc3ZnXCJdLCBDLldJRFRILzItMzIwLzIsIEMuSEVJR0hULzItMjAwLzIsIDMyMCwgMjAwKTtcclxuICB2YXIgYlBvcEV4aXQgICAgICA9IG5ldyBJbWdCdXR0b24oIHJlcy5vYmpJbWFnZXNbXCJwYXVzZV9fYnV0dG9uLXRvTWVudS5zdmdcIl0sIHJlcy5vYmpJbWFnZXNbXCJwYXVzZV9fYnV0dG9uLXRvTWVudV9ob3Zlci5zdmdcIl0sIHdpblBvcEJHLngrMzAsICB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNTAsIDgwLCA2NSwgXCJcIiwgXCJwb3BfZXhpdFwiLCAwICk7XHJcbiAgdmFyIGJQb3BOZXh0ICAgICAgPSBuZXcgSW1nQnV0dG9uKCByZXMub2JqSW1hZ2VzW1wid2luX19idXR0b24tbmV4dC5zdmdcIl0sIHJlcy5vYmpJbWFnZXNbXCJ3aW5fX2J1dHRvbi1uZXh0X2hvdmVyLnN2Z1wiXSwgd2luUG9wQkcueCszMCsxMTArODAsICB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNTAsIDgwLCA2NSwgXCJcIiwgXCJwb3BfbmV4dFwiLCAwICk7XHJcbiAgdmFyIHdpblRleHQgICAgICAgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMiwgd2luUG9wQkcueSsxNSwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0KPRgNC+0LLQtdC90YwgTlwiLCBcIndpbl90ZXh0XCIsIDMwLCBcIkJ1Y2NhbmVlclwiICk7XHJcbiAgdmFyIHdpblRleHRfMiAgICAgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMisxMCwgd2luUG9wQkcueSs4MCwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0J/QoNCe0JnQlNCV0J0hXCIsIFwid2luX3RleHRfMlwiLCA1MCwgXCJhWlpfVHJpYnV0ZV9Cb2xkXCIgKTtcclxuXHJcbiAgd2luVGV4dC50eHRDb2xvciA9IFwiI0Q5QzQyNVwiO1xyXG5cclxuICB2YXIgd2luUG9wVXAgPSBbXTtcclxuICB3aW5Qb3BVcC5wdXNoKHdpblBvcEJHLCBiUG9wRXhpdCwgYlBvcE5leHQsIHdpblRleHQsIHdpblRleHRfMik7XHJcblxyXG4gIHJldHVybiB3aW5Qb3BVcDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVBhdXNlUG9wVXAoKXsgICAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0L/QsNGD0Lcg0LLRgdC/0LvRi9Cy0LDRiNC60YNcclxuXHJcbiAgdmFyIHBhdXNlUG9wVXAgPSBbXTtcclxuICB2YXIgYmdQYXVzZSAgICAgPSBuZXcgSW1hZ2UoIHJlcy5vYmpJbWFnZXNbXCJwYXVzZV9fYmcuc3ZnXCJdLCBDLldJRFRILzItMzAwLzIsIEMuSEVJR0hULzItMjA3LzIsIDMwMCwgMjA3KTtcclxuICB2YXIgYlJldHVybiAgICAgPSBuZXcgSW1nQnV0dG9uKCByZXMub2JqSW1hZ2VzW1wicGF1c2VfX2J1dHRvbi1jbG9zZS5zdmdcIl0sIHJlcy5vYmpJbWFnZXNbXCJwYXVzZV9fYnV0dG9uLWNsb3NlX2hvdmVyLnN2Z1wiXSwgYmdQYXVzZS54KzE5MCwgIGJnUGF1c2UueS0yNSwgNjMsIDU3LCBcIlwiLCBcInJldHVyblwiLCAwICk7XHJcbiAgdmFyIGJFeGl0VG9NZW51ID0gbmV3IEltZ0J1dHRvbiggcmVzLm9iakltYWdlc1tcInBhdXNlX19idXR0b24tdG9NZW51LnN2Z1wiXSwgcmVzLm9iakltYWdlc1tcInBhdXNlX19idXR0b24tdG9NZW51X2hvdmVyLnN2Z1wiXSwgYmdQYXVzZS54KzUwLCAgYmdQYXVzZS55K2JnUGF1c2UuaC01MCwgODUsIDcwLCBcIlwiLCBcImV4aXRcIiwgMCApO1xyXG4gIHZhciBiUmVzdGFydCAgICA9IG5ldyBJbWdCdXR0b24oIHJlcy5vYmpJbWFnZXNbXCJwYXVzZV9fYnV0dG9uLXJlc3RhcnQuc3ZnXCJdLCByZXMub2JqSW1hZ2VzW1wicGF1c2VfX2J1dHRvbi1yZXN0YXJ0X2hvdmVyLnN2Z1wiXSwgYmdQYXVzZS54KzUwKzMwKzg1LCAgYmdQYXVzZS55K2JnUGF1c2UuaC01MCwgODUsIDcwLCBcIlwiLCBcInJlc3RhcnRcIiwgMCApO1xyXG4gIHZhciBwYXVzZVRleHQgICA9IG5ldyBJbWFnZSggcmVzLm9iakltYWdlc1tcInBhdXNlX190ZXh0LnN2Z1wiXSwgYmdQYXVzZS54ICsgYmdQYXVzZS53LzIgLSAxNTAvMiwgYmdQYXVzZS55ICsgYmdQYXVzZS5oLzIgLSAxMDAvMiwgMTUwLCAxMDApO1xyXG5cclxuICBwYXVzZVBvcFVwLnB1c2goYmdQYXVzZSwgYlJldHVybiwgYkV4aXRUb01lbnUsIGJSZXN0YXJ0LCBwYXVzZVRleHQpO1xyXG5cclxuICByZXR1cm4gcGF1c2VQb3BVcDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUxldmVsc0J1dHRvbnMobGV2ZWxzX2NvdW50KXsgLy/RgdC+0LfQtNCw0LXQvCDQutC90L7Qv9C60Lgg0LIg0LLRi9Cx0L7RgNC1INGD0YDQvtCy0L3Rj1xyXG5cclxuICB2YXIgYkxldmVsc0J1dHRvbnMgPSBbXTtcclxuICB2YXIgaiA9IDAsIGR5ID0gODUsIGR4ID0gMDtcclxuXHJcbiAgZm9yICggaT0wOyBpIDwgbGV2ZWxzX2NvdW50OyBpKyspe1xyXG4gICAgZHggPSA4K2oqKDEwMCsxNSk7XHJcblxyXG4gICAgYkxldmVsc0J1dHRvbnMucHVzaCggbmV3IEltZ0J1dHRvbiggcmVzLm9iakltYWdlc1tcImxldmVsc19fYnV0dG9uLWxldmVscy5zdmdcIl0sIHJlcy5vYmpJbWFnZXNbXCJsZXZlbHNfX2J1dHRvbi1sZXZlbHNfaG92ZXIuc3ZnXCJdLCBkeCwgZHksIDEwMCwgMTAwLCBpKzEsIFwibGV2ZWxfXCIrKGkrMSksIDM1ICkgKTtcclxuXHJcbiAgICBqKys7XHJcblxyXG4gICAgaWYgKCBkeCA+IEMuV0lEVEgtMTE1ICl7XHJcbiAgICAgIGR5ICs9ICgxMjUpO1xyXG4gICAgICBqID0gMDtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGJMZXZlbHNCdXR0b25zO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzRm9vdGVyKCl7ICAgICAgICAgLy/RgdC+0LfQtNCw0LXQvCDRhNGD0YLQtdGAINCyINCy0YvQsdC+0YDQtSDRg9GA0L7QstC90Y9cclxuXHJcbiAgdmFyIGxldmVsc0Zvb3RlciA9IFtdO1xyXG5cclxuICB2YXIgYlByZXYgICA9IG5ldyBJbWdCdXR0b24oIHJlcy5vYmpJbWFnZXNbXCJsZXZlbHNfX2J1dHRvbi1wcmV2LnN2Z1wiXSwgZmFsc2UsICAgICAgICAgICAgIDIwLCAgICAgICAgICAgICAgICBDLkhFSUdIVC0xMC02NywgNDAsICA2NywgXCJcIiwgICAgICAgICAgICAgICAgIFwicHJldlwiLCAgICAwICk7XHJcbiAgdmFyIGJOZXh0ICAgPSBuZXcgSW1nQnV0dG9uKCByZXMub2JqSW1hZ2VzW1wibGV2ZWxzX19idXR0b24tbmV4dC5zdmdcIl0sIGZhbHNlLCAgICAgICAgICAgICBDLldJRFRILTIwLTQwLCAgICAgQy5IRUlHSFQtMTAtNjcsIDQwLCAgNjcsIFwiXCIsICAgICAgICAgICAgICAgICBcIm5leHRcIiwgICAgMCApO1xyXG4gIHZhciBiVG9NZW51ID0gbmV3IEltZ0J1dHRvbiggcmVzLm9iakltYWdlc1tcImxldmVsc19fYnV0dG9uLXRvTWVudS5zdmdcIl0sIHJlcy5vYmpJbWFnZXNbXCJsZXZlbHNfX2J1dHRvbi10b01lbnVfaG92ZXIuc3ZnXCJdLCBDLldJRFRILzIgLSAzMjAvMiwgQy5IRUlHSFQtMTAtNjcsIDMyMCwgNjcsIFwi0JLQtdGA0L3Rg9GC0YzRgdGPINCyINC80LXQvdGOXCIsIFwidG9fbWVudVwiLCAyNSApO1xyXG4gIGJUb01lbnUudHh0Q29sb3IgPSBcIiMwMDAwNDZcIjtcclxuXHJcbiAgbGV2ZWxzRm9vdGVyLnB1c2goYlByZXYsYk5leHQsYlRvTWVudSk7XHJcblxyXG4gIHJldHVybiBsZXZlbHNGb290ZXI7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQbGF5ZXIoKXsgICAgICAgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INC40LPRgNC+0LrQsCDRgSDRg9C90LjQutCw0LvRjNC90YvQvNC4INC80LXRgtC+0LTQsNC80LhcclxuXHJcbiAgdmFyIHBsYXllciA9IG5ldyBQbGF5YWJsZShyZXMub2JqSW1hZ2VzW1wiZ2FtZV9fcGxheWVyLnBuZ1wiXSwgMCwwLDUwLDUwKTtcclxuICBwbGF5ZXIuZGlyZWN0aW9uID0gZmFsc2U7XHJcbiAgcGxheWVyLmlzTW92ZSAgICA9IGZhbHNlO1xyXG5cclxuICBwbGF5ZXIuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgaWYodGhpcy5pc01vdmUpe1xyXG4gICAgICB0aGlzLmRyYXdBbmltYXRpb24oMywgMiwgdGhpcy5kaXJlY3Rpb24pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuZHJhd0ZyYW1lKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5kcmF3QW5pbWF0aW9uID0gZnVuY3Rpb24oZnJhbWVzLCBkZWxheSwgYW5nbGUpe1xyXG5cclxuICAgIHRoaXMuaW1nLmNhbkRyYXcgPSAoIHRoaXMuaW1nLmNhbkRyYXcgPT09IHVuZGVmaW5lZCApID8gMSA6IHRoaXMuaW1nLmNhbkRyYXc7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgdmFyIF9keCA9IHRoaXMueCtDLlBETkcgKyB0aGlzLncgLyAyO1xyXG4gICAgICB2YXIgX2R5ID0gdGhpcy55KzcxK0MuUERORyArIHRoaXMuaCAvIDI7XHJcbiAgICAgIGFuZ2xlID0gYW5nbGUgKiAoTWF0aC5QSS8xODApO1xyXG4gICAgICBjbnZzLmN0eC5zYXZlKCk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZShfZHgsX2R5KTtcclxuICAgICAgY252cy5jdHgucm90YXRlKGFuZ2xlKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKC1fZHgsLV9keSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0aGlzLmltZy5jYW5EcmF3ID09IDEpe1xyXG4gICAgICBpZiAodGhpcy5pbWcuY291bnQgPT0gZnJhbWVzKSB0aGlzLmltZy5jb3VudCA9IDE7XHJcblxyXG4gICAgICB0aGlzLmltZy5jYW5EcmF3ID0gMDtcclxuICAgICAgdGhpcy5pbWcuY291bnQgPSB0aGlzLmltZy5jb3VudCArIDEgfHwgMTtcclxuXHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICBwbGF5ZXIuaW1nLmNhbkRyYXcgPSAxO1xyXG4gICAgICB9LCAxMDAwLyhkZWxheSoyKSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY252cy5jdHguZHJhd0ltYWdlKHRoaXMuaW1nLCA1MCoodGhpcy5pbWcuY291bnQtMSksIDAsIHRoaXMudywgdGhpcy5oLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKC1DLlBETkcsIC0oNzErQy5QRE5HKSk7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgY252cy5jdHgucmVzdG9yZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuZHJhd0ZyYW1lID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICB2YXIgYW5nbGUgPSB0aGlzLmRpcmVjdGlvbiB8fCAwO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIHZhciBfZHggPSB0aGlzLngrQy5QRE5HICsgdGhpcy53IC8gMjtcclxuICAgICAgdmFyIF9keSA9IHRoaXMueSs3MStDLlBETkcgKyB0aGlzLmggLyAyO1xyXG4gICAgICBhbmdsZSA9IGFuZ2xlICogKE1hdGguUEkvMTgwKTtcclxuICAgICAgY252cy5jdHguc2F2ZSgpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoX2R4LF9keSk7XHJcbiAgICAgIGNudnMuY3R4LnJvdGF0ZShhbmdsZSk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtX2R4LC1fZHkpO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY252cy5jdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLncsIHRoaXMuaCwgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtQy5QRE5HLCAtKDcxK0MuUERORykpO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIGNudnMuY3R4LnJlc3RvcmUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLnNldERpcmVjdGlvbiA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcclxuICB9O1xyXG5cclxuICByZXR1cm4gcGxheWVyO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlT3B0aW9uc0J1dCgpeyAgICAgICAgICAgLy9j0L7Qt9C00LDQtdC8INGH0LXQutCx0L7QutGB0Ysg0LIg0L3QsNGB0YLRgNC+0LnQutCw0YVcclxuXHJcbiAgdmFyIGFyck9wdCA9IFtdO1xyXG4gIHZhciBidXR0b25zID0gW1wi0JzRg9C30YvQutCwINCyINC80LXQvdGOXCIsIFwi0JzRg9C30YvQutCwINCyINC40LPRgNC1XCIsIFwi0JfQstGD0LrQuCDQsiDQuNCz0YDQtVwiXTtcclxuICB2YXIgaWRCdXR0b25zID0gW1wiYk1lbnVNdXNpY1wiLCBcImJHYW1lTXVzaWNcIiwgXCJiU2Z4TXVzaWNcIl07XHJcblxyXG4gIGZvciAodmFyIGk9MDsgaTxidXR0b25zLmxlbmd0aDsgaSsrKXtcclxuICAgIGFyck9wdC5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMub2JqSW1hZ2VzW1wib3B0aW9uc19fY2hlY2tfd2hpdGUuc3ZnXCJdLCBmYWxzZSwgQy5XSURUSC8yIC0gMTUwLCAxNjArKGkqNzApLCA0NSwgNDUsIGJ1dHRvbnNbaV0sIGlkQnV0dG9uc1tpXSwgMjUsIDEsIDEsIDY1ICkgKTtcclxuICAgIGFyck9wdFtpXS5mRmFtID0gXCJCdWNjYW5lZXJcIjtcclxuICAgIGFyck9wdFtpXS5jaGVja2VkID0gZmFsc2U7XHJcbiAgICBhcnJPcHRbaV0uY2hlY2sgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgaWYgKCAhdGhpcy5jaGVja2VkICkge1xyXG4gICAgICAgIF9pbWcgPSB0aGlzLmltZztcclxuICAgICAgICB0aGlzLmltZyA9IHJlcy5vYmpJbWFnZXNbXCJvcHRpb25zX191bmNoZWNrX3doaXRlLnN2Z1wiXTtcclxuICAgICAgICB0aGlzLmNoZWNrZWQgPSAhdGhpcy5jaGVja2VkO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaW1nID0gX2ltZztcclxuICAgICAgICB0aGlzLmNoZWNrZWQgPSAhdGhpcy5jaGVja2VkO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICB2YXIgYlRvTWVudSA9IG5ldyBJbWdCdXR0b24oIHJlcy5vYmpJbWFnZXNbXCJsZXZlbHNfX2J1dHRvbi10b01lbnUuc3ZnXCJdLCByZXMub2JqSW1hZ2VzW1wibGV2ZWxzX19idXR0b24tdG9NZW51X2hvdmVyLnN2Z1wiXSwgQy5XSURUSC8yIC0gNDAwLzIsIEMuSEVJR0hULTEwLTY3LCA0MDAsIDY3LCBcItCS0LXRgNC90YPRgtGM0YHRjyDQsiDQvNC10L3RjlwiLCBcInRvX21lbnVcIiwgMjUgKTtcclxuICBiVG9NZW51LnR4dENvbG9yID0gXCIjMDAwMDQ2XCI7XHJcblxyXG4gIGFyck9wdC5wdXNoKCBiVG9NZW51ICk7XHJcblxyXG5cclxuICByZXR1cm4gYXJyT3B0O1xyXG59O1xyXG5cclxuXHJcbi8vbWVudVxyXG52YXIgbG9nbyA9IG5ldyBJbWdCdXR0b24oIHJlcy5vYmpJbWFnZXNbXCJtZW51X19sb2dvLnBuZ1wiXSwgZmFsc2UsIEMuV0lEVEgvMi00NTAvMiwgMjAsIDQ1MCwgMTUwLCBcIlwiLCBcImxvZ29cIiwgMCApO1xyXG52YXIgbWVudSA9IGNyZWF0ZU1lbnUoW1wi0JjQs9GA0LDRgtGMXCIsIFwi0KPRgNC+0LLQvdC4XCIsIFwi0J3QsNGB0YLRgNC+0LnQutC4XCJdLFtcInBsYXlcIiwgXCJjaGFuZ2VfbGV2ZWxcIiwgXCJvcHRpb25zXCJdKTtcclxuXHJcblxyXG4vL2JhY2tncm91bmQgXHJcbnZhciBtYXRyaXggICAgPSBjcmVhdGVNYXRyaXhCRygpOyAgICAgICAgIC8vYmcg0YPRgNC+0LLQvdGPXHJcbnZhciBiZ0xldmVsICAgPSBuZXcgSW1hZ2UoIHJlcy5vYmpJbWFnZXNbXCJnYW1lX19ncm91bmQuanBnXCJdLCAwLCAwLCBDLldJRFRILCBDLkhFSUdIVCApO1xyXG52YXIgYmdPcGFjaXR5ID0gbmV3IFJlY3QoMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIFwicmdiYSgwLCAwLCAwLCAwLjUpXCIpO1xyXG5cclxuXHJcbi8vZ2FtZSBoZWFkZXJcclxudmFyIGhlYWRlciAgICA9IG5ldyBJbWFnZSggcmVzLm9iakltYWdlc1tcImdhbWVfX2JnLWhlYWRlci5zdmdcIl0sIDAsIDAsIEMuV0lEVEgsIDcxK0MuUERORyApO1xyXG52YXIgYkZ1bGxTY3IgID0gbmV3IEltZ0J1dHRvbiggcmVzLm9iakltYWdlc1tcImdhbWVfX2J1dHRvbi1mdWxsc2NyZWVuLnN2Z1wiXSwgcmVzLm9iakltYWdlc1tcImdhbWVfX2J1dHRvbi1mdWxsc2NyZWVuX2hvdmVyLnN2Z1wiXSwgQy5XSURUSC00NS0yMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQ1LzIsIDQ1LCA0NSwgXCJcIiwgXCJmdWxsU2NyXCIsIDAgKTtcclxudmFyIHN0b3BXYXRjaCA9IG5ldyBCdXR0b24oIDEwLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTIwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcIjAwIDogMDAgOiAwMFwiLCBcInN0b3B3YXRjaFwiLCAyNSwgXCJkaXRlZFwiICk7XHJcbnZhciBiUGF1c2UgICAgPSBuZXcgSW1nQnV0dG9uKCByZXMub2JqSW1hZ2VzW1wiZ2FtZV9fYnV0dG9uLXBhdXNlLnN2Z1wiXSwgcmVzLm9iakltYWdlc1tcImdhbWVfX2J1dHRvbi1wYXVzZV9ob3Zlci5zdmdcIl0sIEMuV0lEVEgtNDUtNy1iRnVsbFNjci53LTIwLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDUvMiwgNDUsIDQ1LCBcIlwiLCBcInBhdXNlXCIsIDAgKTtcclxudmFyIGN1cnJMZXZlbCA9IG5ldyBCdXR0b24oIChzdG9wV2F0Y2gueCtzdG9wV2F0Y2gudytiUGF1c2UueCkvMi0xNDAvMiwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDE0MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQo9GA0L7QstC10L3RjFwiLCBcImN1cnJfbGV2ZWxcIiwgMjUsIFwiY2FwdHVyZV9pdFwiICk7XHJcblxyXG5cclxuLy9jaGFuZ2UgbGV2ZWxcclxudmFyIGxldmVsc0hlYWRlciAgID0gbmV3IEltZ0J1dHRvbiggcmVzLm9iakltYWdlc1tcImdhbWVfX2JnLWhlYWRlci5zdmdcIl0sIGZhbHNlLCAwLCAwLCBDLldJRFRILCA3MStDLlBETkcsIFwi0JLRi9Cx0L7RgCDRg9GA0L7QstC90Y9cIiwgXCJsZXZlbHNfaGVhZGVyXCIsIDI1ICk7XHJcbnZhciBsZXZlbHNGb290ZXIgICA9IGNyZWF0ZUxldmVsc0Zvb3RlcigpO1xyXG52YXIgYkxldmVsc0J1dHRvbnMgPSBjcmVhdGVMZXZlbHNCdXR0b25zKDkpO1xyXG5cclxuXHJcbi8vb3B0aW9uc1xyXG52YXIgb3B0aW9uc0hlYWRlciAgPSBuZXcgSW1nQnV0dG9uKCByZXMub2JqSW1hZ2VzW1wiZ2FtZV9fYmctaGVhZGVyLnN2Z1wiXSwgZmFsc2UsIDAsIDAsIEMuV0lEVEgsIDcxK0MuUERORywgXCLQndCw0YHRgtGA0L7QudC60LhcIiwgXCJvcHRpb25zX2hlYWRlclwiLCAyNSApO1xyXG52YXIgb3B0aW9uc011c2ljICAgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItMTQwLzIsIDkwLCAxNDAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0JzRg9C30YvQutCwXCIsIFwibXVzaWNcIiwgMjUsIFwiY2FwdHVyZV9pdFwiICk7XHJcbnZhciBiT3B0aW9ucyAgICAgICA9IGNyZWF0ZU9wdGlvbnNCdXQoKTtcclxuXHJcbi8vd2luIHBvcC11cFxyXG52YXIgd2luUG9wVXAgICA9IGNyZWF0ZVdpblBvcFVwKCk7XHJcblxyXG5cclxuLy9wYXVzZSBwb3AtdXBcclxudmFyIHBhdXNlUG9wVXAgPSBjcmVhdGVQYXVzZVBvcFVwKCk7XHJcblxyXG5cclxuLy9wbGF5YWJsZSBvYmpcclxudmFyIHBsICAgID0gY3JlYXRlUGxheWVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/Qv9C10YDRgdC+0L3QsNC2XHJcbnZhciBib3ggICA9IG5ldyBQbGF5YWJsZShyZXMub2JqSW1hZ2VzW1wiZ2FtZV9fY3J5c3RhbGwuc3ZnXCJdLCAwLDAsNTAsNTApOyAvL9Cx0L7QutGBXHJcbnZhciBkb29yICA9IG5ldyBQbGF5YWJsZShyZXMub2JqSW1hZ2VzW1wiZ2FtZV9fcG9ydGFsLnN2Z1wiXSwgMCwwLDUwLDUwKTsgLy/QtNCy0LXRgNGMXHJcbnZhciB3YWxscyA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v0YHRgtC10L3RiyDQvdCwINGD0YDQvtCy0L3QtSwg0LfQsNC/0L7Qu9C90Y/QtdGC0YHRjyDQstGL0LHRgNCw0L3QvdGL0Lwg0YPRgNC+0LLQvdC10LwuXHJcblxyXG5cclxuLy92aWRlb1xyXG52YXIgYW5pbWF0ZUJnICAgICA9IG5ldyBWaWRlbygwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgcmVzLm9ialZpZGVvW1wiYmcubXA0XCJdKTtcclxudmFyIHZpZGVvQmdMZXZlbHMgPSBuZXcgVmlkZW8oMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIHJlcy5vYmpWaWRlb1tcIkxpZ2h0bWlycm9yLm1wNFwiXSk7XHJcblxyXG5cclxuLy9hdWRpb1xyXG52YXIgYXVkaW8gPSB7XHJcblxyXG4gIGJ1dHRvbiAgIDogbmV3IEF1ZGlvKHJlcy5vYmpBdWRpb1tcImJ1dHRvbi1jbGljay5tcDNcIl0sIDAuNSksXHJcbiAgd2luICAgICAgOiBuZXcgQXVkaW8ocmVzLm9iakF1ZGlvW1wid2luLWF1ZGlvLm1wM1wiXSwgICAgMC41KSxcclxuICBwbGF5ZXIgICA6IG5ldyBBdWRpbyhyZXMub2JqQXVkaW9bXCJwbGF5ZXItbW92ZS5tcDNcIl0sICAwLjI1KSxcclxuICBjcnlzdGFsICA6IG5ldyBBdWRpbyhyZXMub2JqQXVkaW9bXCJjcnlzdGFsLW1vdmUubXAzXCJdLCAwLjI1KSxcclxuICBiZ0luR2FtZSA6IG5ldyBBdWRpbyhyZXMub2JqQXVkaW9bXCJiZy1pbkdhbWUubXAzXCJdLCAgICAwLjUpLFxyXG4gIGJnSW5NZW51IDogbmV3IEF1ZGlvKHJlcy5vYmpBdWRpb1tcImJnLWluTWVudS5tcDNcIl0sICAgIDAuMDAwMDAwNSksXHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RzID0ge1xyXG5cclxuICBtYXRyaXggICAgICAgICA6IG1hdHJpeCxcclxuICBsb2dvICAgICAgICAgICA6IGxvZ28sXHJcbiAgbWVudSAgICAgICAgICAgOiBtZW51LFxyXG4gIGhlYWRlciAgICAgICAgIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCAgICAgIDogc3RvcFdhdGNoLFxyXG4gIGJQYXVzZSAgICAgICAgIDogYlBhdXNlLFxyXG4gIGJGdWxsU2NyICAgICAgIDogYkZ1bGxTY3IsXHJcbiAgcGwgICAgICAgICAgICAgOiBwbCxcclxuICBib3ggICAgICAgICAgICA6IGJveCxcclxuICBkb29yICAgICAgICAgICA6IGRvb3IsXHJcbiAgd2FsbHMgICAgICAgICAgOiB3YWxscyxcclxuICBiZ0xldmVsICAgICAgICA6IGJnTGV2ZWwsXHJcbiAgd2luUG9wVXAgICAgICAgOiB3aW5Qb3BVcCxcclxuICBwYXVzZVBvcFVwICAgICA6IHBhdXNlUG9wVXAsXHJcbiAgYmdPcGFjaXR5ICAgICAgOiBiZ09wYWNpdHksXHJcbiAgY3VyckxldmVsICAgICAgOiBjdXJyTGV2ZWwsXHJcbiAgbGV2ZWxzSGVhZGVyICAgOiBsZXZlbHNIZWFkZXIsXHJcbiAgYkxldmVsc0J1dHRvbnMgOiBiTGV2ZWxzQnV0dG9ucyxcclxuICBsZXZlbHNGb290ZXIgICA6IGxldmVsc0Zvb3RlcixcclxuICBhbmltYXRlQmcgICAgICA6IGFuaW1hdGVCZyxcclxuICB2aWRlb0JnTGV2ZWxzICA6IHZpZGVvQmdMZXZlbHMsXHJcbiAgYXVkaW8gICAgICAgICAgOiBhdWRpbyxcclxuICBvcHRpb25zSGVhZGVyICA6IG9wdGlvbnNIZWFkZXIsXHJcbiAgb3B0aW9uc011c2ljICAgOiBvcHRpb25zTXVzaWMsXHJcbiAgYk9wdGlvbnMgICAgICAgOiBiT3B0aW9uc1xyXG5cclxufTtcclxuIiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblx0XHJcbnZhciBjb3VudCAgICA9IDc1O1xyXG52YXIgcm90YXRpb24gPSAyNzAqKE1hdGguUEkvMTgwKTtcdFx0XHJcbnZhciBzcGVlZCAgICA9IDY7XHJcblx0XHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuICBcclxuIFx0dXBkYXRlTG9hZGVyIDogZnVuY3Rpb24oKXtcclxuIFx0XHRjYW52YXMuY3R4LnNhdmUoKTtcclxuIFx0XHRjYW52YXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFN0eWxlID0gJ3JnYmEoMjU1LDI1NSwyNTUsLjAzNSknO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFJlY3QoMCwwLDUwMCw1MDApO1xyXG4gXHRcdHJvdGF0aW9uICs9IHNwZWVkLzEwMDtcclxuIFx0XHRjYW52YXMuY3R4LnJlc3RvcmUoKTtcdFx0XHRcdFx0XHRcdFx0XHRcclxuIFx0fSxcclxuXHJcbiBcdGRyYXdMb2FkZXIgOiBmdW5jdGlvbigpe1x0XHRcdFx0XHRcdFx0XHJcbiBcdFx0Y2FudmFzLmN0eC5zYXZlKCk7XHJcbiBcdFx0Y2FudmFzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gXHRcdGNhbnZhcy5jdHgudHJhbnNsYXRlKEMuV0lEVEgvMiwgQy5IRUlHSFQvMik7XHJcbiBcdFx0Y2FudmFzLmN0eC5saW5lV2lkdGggPSAwLjI1O1xyXG5cdFx0Y2FudmFzLmN0eC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwyNTUsMjU1LDEuMCknO1xyXG4gXHRcdGNhbnZhcy5jdHgucm90YXRlKHJvdGF0aW9uKTtcdFxyXG4gXHRcdHZhciBpID0gY291bnQ7XHJcbiBcdFx0d2hpbGUoaS0tKXtcdFx0XHRcdFx0XHRcdFx0XHJcbiBcdFx0XHRjYW52YXMuY3R4LmJlZ2luUGF0aCgpO1xyXG4gXHRcdFx0Y2FudmFzLmN0eC5hcmMoMCwgMCwgaSsoTWF0aC5yYW5kb20oKSozNSksIE1hdGgucmFuZG9tKCksIE1hdGguUEkvMysoTWF0aC5yYW5kb20oKS8xMiksIGZhbHNlKTtcdFx0XHRcdFx0XHRcdFx0XHJcbiBcdFx0XHRjYW52YXMuY3R4LnN0cm9rZSgpO1xyXG4gXHRcdH1cdFxyXG4gXHRcdGNhbnZhcy5jdHgucmVzdG9yZSgpO1xyXG5cclxuIFx0XHRjYW52YXMuY3R4LnNhdmUoKTtcclxuIFx0XHRjYW52YXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdmVyJztcclxuIFx0XHRjYW52YXMuY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDEpJztcclxuIFx0XHRjYW52YXMuY3R4LmZpbGxSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcdFxyXG4gXHRcdGNhbnZhcy5jdHgucmVzdG9yZSgpO1x0XHRcdFx0XHRcdFx0XHRcdFx0XHJcbiBcdH0sXHJcblxyXG4gXHRkcmF3TG9hZFRleHQgOiBmdW5jdGlvbigpe1xyXG4gXHRcdHZhciB3aW5UZXh0ID0gbmV3IEJ1dHRvbiggQy5XSURUSC8yLTI1MC8yLCAyNSwgMjUwLCA0MCwgXCJibGFja1wiLCBcItCY0LTQtdGCINC30LDQs9GA0YPQt9C60LAuLlwiLCBcImxvYWQtdGV4dFwiLCAzMCwgXCJCdWNjYW5lZXJcIiApO1xyXG4gIFx0XHRyZXR1cm4gd2luVGV4dC5kcmF3KCk7XHJcbiBcdH1cclxufTsgXHJcblxyXG4gICIsInZhciByZXNvdXJzZXMgPSB7XHJcbiAgaW1hZ2VzIDogZmFsc2UsXHJcbiAgdmlkZW8gIDogZmFsc2UsXHJcbiAgYXVkaW8gIDogZmFsc2UsXHJcblxyXG4gIGFyZUxvYWRlZCA6IGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gdGhpcy52aWRlbyAmJiB0aGlzLmltYWdlcyAmJiB0aGlzLmF1ZGlvXHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZFZpZGVvKGFyclNyY3NPZlZpZGVvKXtcclxuXHJcbiAgdmFyIG9ialZpZGVvID0ge307IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZlZpZGVvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgIHZpZGVvLnNyYyA9IGFyclNyY3NPZlZpZGVvW2ldO1xyXG4gICAgdmlkZW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGxvYWRDb3VudCsrO1xyXG4gICAgICB2aWRlby5sb29wID0gdHJ1ZTtcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMudmlkZW8gPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgc2xpY2VTdGFydCA9IGFyclNyY3NPZlZpZGVvW2ldLmxhc3RJbmRleE9mKFwiXFwvXCIpKzE7XHJcbiAgICB2YXIga2V5ICAgICAgICA9IGFyclNyY3NPZlZpZGVvW2ldLnNsaWNlKHNsaWNlU3RhcnQpO1xyXG5cclxuICAgIG9ialZpZGVvW2tleV0gPSB2aWRlbztcclxuXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG9ialZpZGVvO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZEltYWdlcyhhcnJTcmNzT2ZJbWFnZXMpe1xyXG5cclxuICB2YXIgb2JqSW1hZ2VzID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZkltYWdlcy5sZW5ndGg7XHJcbiAgdmFyIGxvYWRDb3VudCA9IDA7XHJcblxyXG4gIGZvcih2YXIgaT0wOyBpPGNvdW50OyBpKyspe1xyXG5cclxuICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgIGltZy5zcmMgPSBhcnJTcmNzT2ZJbWFnZXNbaV07XHJcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgbG9hZENvdW50Kys7XHJcbiAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLmltYWdlcyA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB2YXIgc2xpY2VTdGFydCA9IGFyclNyY3NPZkltYWdlc1tpXS5sYXN0SW5kZXhPZihcIlxcL1wiKSsxO1xyXG4gICAgdmFyIGtleSAgICAgICAgPSBhcnJTcmNzT2ZJbWFnZXNbaV0uc2xpY2Uoc2xpY2VTdGFydCk7XHJcbiAgICBcclxuICAgIG9iakltYWdlc1trZXldID0gaW1nO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gb2JqSW1hZ2VzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZEF1ZGlvKGFyclNyY3NPZkF1ZGlvKXtcclxuXHJcbiAgdmFyIG9iakF1ZGlvID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZkF1ZGlvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIGF1ZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcclxuICAgIGF1ZGlvLnNyYyA9IGFyclNyY3NPZkF1ZGlvW2ldO1xyXG4gICAgYXVkaW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGxvYWRDb3VudCsrO1xyXG4gICAgICBpZiAoIGxvYWRDb3VudCA9PSBjb3VudCApIHJlc291cnNlcy5hdWRpbyA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB2YXIgc2xpY2VTdGFydCA9IGFyclNyY3NPZkF1ZGlvW2ldLmxhc3RJbmRleE9mKFwiXFwvXCIpKzE7XHJcbiAgICB2YXIga2V5ICAgICAgICA9IGFyclNyY3NPZkF1ZGlvW2ldLnNsaWNlKHNsaWNlU3RhcnQpO1xyXG5cclxuICAgIG9iakF1ZGlvW2tleV0gPSBhdWRpbztcclxuXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG9iakF1ZGlvO1xyXG59O1xyXG5cclxudmFyIG9iakF1ZGlvID0gbG9hZEF1ZGlvKFtcclxuICBcImF1ZGlvL2J1dHRvbi1jbGljay5tcDNcIixcclxuICBcImF1ZGlvL3dpbi1hdWRpby5tcDNcIixcclxuICBcImF1ZGlvL3BsYXllci1tb3ZlLm1wM1wiLFxyXG4gIFwiYXVkaW8vY3J5c3RhbC1tb3ZlLm1wM1wiLFxyXG4gIFwiYXVkaW8vYmctaW5HYW1lLm1wM1wiLFxyXG4gIFwiYXVkaW8vYmctaW5NZW51Lm1wM1wiXHJcbl0pO1xyXG5cclxudmFyIG9ialZpZGVvID0gbG9hZFZpZGVvKFtcclxuICBcInZpZGVvL2JnLm1wNFwiLFxyXG4gIFwidmlkZW8vTGlnaHRtaXJyb3IubXA0XCJcclxuXSk7XHJcblxyXG52YXIgb2JqSW1hZ2VzID0gbG9hZEltYWdlcyhbXHJcbiAgXCJpbWcvbWVudV9fYnV0dG9uLW1lbnUuc3ZnXCIsICAgICAgICAgICAgICAgIC8vMCBcclxuICBcImltZy9tZW51X19sb2dvLnBuZ1wiLCAgICAgICAgICAgICAgICAgICAgICAgLy8xXHJcblxyXG4gIFwiaW1nL2dhbWVfX2JnLWhlYWRlci5zdmdcIiwgICAgICAgICAgICAgICAgICAvLzIgXHJcbiAgXCJpbWcvZ2FtZV9fYnV0dG9uLWZ1bGxzY3JlZW4uc3ZnXCIsICAgICAgICAgIC8vMyBcclxuICBcImltZy9nYW1lX19idXR0b24tcGF1c2Uuc3ZnXCIsICAgICAgICAgICAgICAgLy80IFxyXG4gIFwiaW1nL2dhbWVfX3dhbGwuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgICAvLzUgXHJcbiAgXCJpbWcvZ2FtZV9fY3J5c3RhbGwuc3ZnXCIsICAgICAgICAgICAgICAgICAgIC8vNiBcclxuICBcImltZy9nYW1lX19wb3J0YWwuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgLy83IFxyXG4gIFwiaW1nL2dhbWVfX2dyb3VuZC5qcGdcIiwgICAgICAgICAgICAgICAgICAgICAvLzggXHJcbiAgJ2ltZy9nYW1lX19wbGF5ZXIucG5nJywgICAgICAgICAgICAgICAgICAgICAvLzkgXHJcblxyXG4gIFwiaW1nL3BhdXNlX19idXR0b24tY2xvc2Uuc3ZnXCIsICAgICAgICAgICAgICAvLzEwXHJcbiAgXCJpbWcvcGF1c2VfX2J1dHRvbi1yZXN0YXJ0LnN2Z1wiLCAgICAgICAgICAgIC8vMTFcclxuICBcImltZy9wYXVzZV9fYnV0dG9uLXRvTWVudS5zdmdcIiwgICAgICAgICAgICAgLy8xMlxyXG4gIFwiaW1nL3BhdXNlX19iZy5zdmdcIiwgICAgICAgICAgICAgICAgICAgICAgICAvLzEzXHJcbiAgXCJpbWcvcGF1c2VfX3RleHQuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgIC8vMTRcclxuXHJcbiAgXCJpbWcvd2luX19idXR0b24tbmV4dC5zdmdcIiwgICAgICAgICAgICAgICAgIC8vMTVcclxuICBcImltZy93aW5fX2JnLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8xNlxyXG5cclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi1sZXZlbHMuc3ZnXCIsICAgICAgICAgICAgLy8xN1xyXG4gIFwiaW1nL2xldmVsc19fYnV0dG9uLW5leHQuc3ZnXCIsICAgICAgICAgICAgICAvLzE4XHJcbiAgXCJpbWcvbGV2ZWxzX19idXR0b24tcHJldi5zdmdcIiwgICAgICAgICAgICAgIC8vMTlcclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi10b01lbnUuc3ZnXCIsICAgICAgICAgICAgLy8yMFxyXG5cclxuICBcImltZy9ob3ZlcnMvbWVudV9fYnV0dG9uLW1lbnVfaG92ZXIuc3ZnXCIsICAgICAgIC8vMjFcclxuICBcImltZy9ob3ZlcnMvZ2FtZV9fYnV0dG9uLWZ1bGxzY3JlZW5faG92ZXIuc3ZnXCIsIC8vMjJcclxuICBcImltZy9ob3ZlcnMvZ2FtZV9fYnV0dG9uLXBhdXNlX2hvdmVyLnN2Z1wiLCAgICAgIC8vMjNcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi1jbG9zZV9ob3Zlci5zdmdcIiwgICAgIC8vMjRcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi1yZXN0YXJ0X2hvdmVyLnN2Z1wiLCAgIC8vMjVcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi10b01lbnVfaG92ZXIuc3ZnXCIsICAgIC8vMjZcclxuICBcImltZy9ob3ZlcnMvbGV2ZWxzX19idXR0b24tbGV2ZWxzX2hvdmVyLnN2Z1wiLCAgIC8vMjdcclxuICBcImltZy9ob3ZlcnMvbGV2ZWxzX19idXR0b24tdG9NZW51X2hvdmVyLnN2Z1wiLCAgIC8vMjhcclxuICBcImltZy9ob3ZlcnMvd2luX19idXR0b24tbmV4dF9ob3Zlci5zdmdcIiwgICAgICAgIC8vMjlcclxuXHJcbiAgXCJpbWcvb3B0aW9uc19fdW5jaGVja193aGl0ZS5zdmdcIiwgICAgICAgICAgIC8vMzBcclxuICBcImltZy9vcHRpb25zX19jaGVja193aGl0ZS5zdmdcIiAgICAgICAgICAgICAgLy8zMVxyXG5dKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcbiAgcmVzb3Vyc2VzIDogcmVzb3Vyc2VzLFxyXG5cclxuICBvYmpWaWRlbyAgOiBvYmpWaWRlbyxcclxuXHJcbiAgb2JqSW1hZ2VzIDogb2JqSW1hZ2VzLFxyXG5cclxuICBvYmpBdWRpbyAgOiBvYmpBdWRpb1xyXG5cclxufTtcclxuXHJcblxyXG4iLCJ2YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGdhbWUgPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxuXHJcbnZhciBwYXVzZSA9IDA7XHJcbnZhciBiZWdpblRpbWUgPSAwO1xyXG52YXIgY3VycmVudFRpbWUgPSAwO1xyXG52YXIgdXBUaW1lVE87XHJcblxyXG5mdW5jdGlvbiB1cFRpbWUoY291bnRGcm9tKSB7XHJcblx0dmFyIG5vdyA9IG5ldyBEYXRlKCk7XHJcblx0dmFyIGRpZmZlcmVuY2UgPSAobm93LWNvdW50RnJvbSArIGN1cnJlbnRUaW1lKTtcclxuXHJcblx0dmFyIGhvdXJzPU1hdGguZmxvb3IoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKS8oNjAqNjAqMTAwMCkqMSk7XHJcblx0dmFyIG1pbnM9TWF0aC5mbG9vcigoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpLyg2MCoxMDAwKSoxKTtcclxuXHR2YXIgc2Vjcz1NYXRoLmZsb29yKCgoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpJSg2MCoxMDAwKSkvMTAwMCoxKTtcclxuXHJcblx0aG91cnMgPSAoIGhvdXJzIDwgMTApID8gXCIwXCIraG91cnMgOiBob3VycztcclxuXHRtaW5zID0gKCBtaW5zIDwgMTApID8gXCIwXCIrbWlucyA6IG1pbnM7XHJcblx0c2VjcyA9ICggc2VjcyA8IDEwKSA/IFwiMFwiK3NlY3MgOiBzZWNzO1xyXG5cclxuXHRvLnN0b3BXYXRjaC50eHQgPSBob3VycytcIiA6IFwiK21pbnMrXCIgOiBcIitzZWNzO1xyXG5cclxuXHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdHVwVGltZVRPPXNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdXBUaW1lKGNvdW50RnJvbSk7IH0sMTAwMC82MCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdHN0YXJ0IDogZnVuY3Rpb24oKSB7XHJcblx0XHQvLyBpZiAoZ2FtZS5zdGF0dXMgPT0gJ2dhbWUnIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJtZW51XCIgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcInBhdXNlXCIgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcImxldmVsc1wiKSB7XHJcblx0XHRcdHVwVGltZShuZXcgRGF0ZSgpKTtcclxuXHRcdFx0dmFyIG5vd1QgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0XHRiZWdpblRpbWUgPSBub3dULmdldFRpbWUoKTtcclxuXHRcdC8vIH0gZWxzZSB7XHJcblx0XHQvLyBcdHRoaXMucmVzZXQoKTtcclxuXHRcdC8vIH07XHJcblx0fSxcclxuXHJcblx0cmVzZXQgOiBmdW5jdGlvbigpIHtcclxuXHRcdGN1cnJlbnRUaW1lID0gMDtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblxyXG5cdFx0by5zdG9wV2F0Y2gudHh0ID0gXCIwMCA6IDAwIDogMDBcIjtcclxuXHRcdC8vIHRoaXMuc3RhcnQoKTtcclxuXHR9LFxyXG5cclxuXHRwYXVzZVRpbWVyIDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjdXJEYXRhID0gbmV3IERhdGUoKTtcclxuXHRcdGN1cnJlbnRUaW1lID0gY3VyRGF0YS5nZXRUaW1lKCkgLSBiZWdpblRpbWUgKyBjdXJyZW50VGltZTtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblx0fVxyXG5cclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IEF1ZGlvID0gZnVuY3Rpb24oYXVkaW8sIHZvbHVtZSl7IFxyXG5cclxuXHR0aGlzLmEgPSBhdWRpbztcclxuXHR0aGlzLmEudm9sdW1lID0gdm9sdW1lIHx8IDE7XHJcblx0dGhpcy5zdGF0ZSA9IFwic3RvcFwiO1xyXG5cdHRoaXMuZGlzYWJsZWQgPSBmYWxzZTtcclxuXHJcblx0dmFyIHRtcFZvbCA9IHZvbHVtZTtcdFx0XHRcdFx0XHRcdFx0XHQgICAgLy/QsdGD0LTQtdGCINGF0YDQsNC90LjRgtGMINC90LDRgdGC0YDQvtC10L3QvdC+0LUg0LfQvdCw0YfQtdC90LjRjyDQs9GA0L7QvNC60L7RgdGC0LgsINC/0YDQuCDQuNC30LzQtdC90LXQvdC40Lgg0LPRgNC+0LzQutC+0YHRgtC4INCyINGG0LXQu9C+0LwsINGH0YLQviDQsSDQvNC+0LbQvdC+INCx0YvQu9C+INCy0L7RgdGB0YLQsNC90L7QstC40YLRjCDQuiDQvdCw0YHRgtGA0L7QtdC90L3QvtC5LlxyXG5cclxuXHR0aGlzLnBsYXkgPSBmdW5jdGlvbihkb250U3RvcCl7XHJcblx0XHRpZiAoIXRoaXMuZGlzYWJsZWQpe1xyXG5cdFx0XHRpZiAoIHRoaXMuc3RhdGUgPT0gXCJwbGF5XCIgJiYgZG9udFN0b3AgKXtcdFx0XHQvL9C10YHQu9C4INC10YnQtSDQvdC1INC30LDQutC+0L3Rh9C40LvRgdGPINC/0YDQtdC00YvQtNGD0YnQuNC5INGN0YLQvtGCINC30LLRg9C6LCDRgtC+INGB0L7Qt9C00LDQtdC8INC90L7QstGL0Lkg0LfQstGD0Log0Lgg0LLQvtGB0L/RgNC+0LjQt9Cy0L7QtNC40Lwg0LXQs9C+LCDQvdC1INC80LXRiNCw0Y8g0LLQvtGB0L/RgNC+0LjQt9Cy0LXQtNC10L3QuNGOINC/0YDQtdC00YvQtNGD0YnQtdCz0L4uXHJcblx0XHRcdFx0dmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXVkaW9cIik7XHJcblx0XHRcdFx0YS5zcmMgPSB0aGlzLmEuc3JjO1xyXG5cdFx0XHRcdGEudm9sdW1lID0gdGhpcy5hLnZvbHVtZTtcclxuXHRcdFx0XHRhLnBsYXkoKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmEucGxheSgpO1xyXG5cdFx0XHRcdHRoaXMuc3RhdGUgPSBcInBsYXlcIjtcclxuXHRcdFx0XHR0aGlzLmEub25lbmRlZCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHR0aGlzLnN0YXRlID0gXCJzdG9wXCI7XHJcblx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHR9O1xyXG5cclxuXHR0aGlzLnBhdXNlID0gZnVuY3Rpb24oKXtcclxuXHRcdHRoaXMuYS5wYXVzZSgpO1xyXG5cdFx0dGhpcy5zdGF0ZSA9IFwicGF1c2VcIjtcclxuXHR9O1xyXG5cclxuXHR0aGlzLnN0b3AgPSBmdW5jdGlvbigpe1xyXG5cdFx0dGhpcy5hLnBhdXNlKCk7XHJcblx0XHR0aGlzLmEuY3VycmVudFRpbWUgPSAwO1xyXG5cdFx0dGhpcy5zdGF0ZSA9IFwic3RvcFwiO1xyXG5cdH07XHJcblxyXG5cdHRoaXMuY2hhbmdlVm9sdW1lID0gZnVuY3Rpb24ocGVyY2VudFZvbCl7XHJcblx0XHR0aGlzLmEudm9sdW1lID0gdG1wVm9sLzEwMCAqIHBlcmNlbnRWb2w7XHJcblx0fTtcclxuXHJcblx0dGhpcy5jaGFuZ2VEaXNhYmxlID0gZnVuY3Rpb24ocGxheSl7XHJcblx0XHR0aGlzLmRpc2FibGVkID0gIXRoaXMuZGlzYWJsZWQ7XHJcblx0XHRpZiAocGxheSkgKCB0aGlzLnN0YXRlID09IFwicGxheVwiICkgPyB0aGlzLnN0b3AoKSA6IHRoaXMucGxheSgpO1xyXG5cdH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IsIHR4dCwgbmFtZSwgZlNpemUsIGZvbnRGYW0pe1xyXG4gIFxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG4gIHRoaXMudHh0Q29sb3IgPSBcIndoaXRlXCI7XHJcbiAgdGhpcy5mb250RmFtID0gZm9udEZhbSB8fCBcIkFyaWFsXCI7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKG5vQ2VudGVyLCBwYWRkKXtcclxuXHJcbiAgICB2YXIgX3BhZGQgPSBwYWRkIHx8IDU7XHJcbiAgICB2YXIgX3ggPSAoICFub0NlbnRlciApID8gdGhpcy54K3RoaXMudy8yIDogdGhpcy54K19wYWRkO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMudHh0Q29sb3I7XHJcbiAgICBjdHgudGV4dEFsaWduID0gKCAhbm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggJyt0aGlzLmZvbnRGYW07XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoLCBvcGFjaXR5KXtcclxuXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLm9wYWNpdHkgPSBvcGFjaXR5IHx8IDE7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4Lmdsb2JhbEFscGhhID0gdGhpcy5vcGFjaXR5O1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuXHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1nQnV0dG9uID0gZnVuY3Rpb24oaW1nLCBob3ZlckltZywgeCwgeSwgdywgaCwgdHh0LCBuYW1lLCBmU2l6ZSwgc2V0Q2VudGVyLCBub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcbiAgdGhpcy50eHRDb2xvciA9IFwid2hpdGVcIjtcclxuICB0aGlzLnNldENlbnRlciA9IHNldENlbnRlciB8fCB0aGlzLng7XHJcbiAgdGhpcy5ub0NlbnRlciA9IG5vQ2VudGVyIHx8IGZhbHNlO1xyXG4gIHRoaXMucGFkZCA9IHBhZGQgfHwgNTtcclxuICB0aGlzLmhvdmVySW1nID0gaG92ZXJJbWc7XHJcbiAgdGhpcy5mRmFtID0gXCJjYXB0dXJlX2l0XCI7XHJcblxyXG4gIHZhciBtZXRyaWNzID0gY3R4Lm1lYXN1cmVUZXh0KHRoaXMudHh0KS53aWR0aDsgLy/RgNCw0LfQvNC10YAt0YjQuNGA0LjQvdCwINC/0LXRgNC10LTQsNCy0LDQtdC80L7Qs9C+INGC0LXQutGB0YLQsFxyXG4gIHZhciBfeCA9ICggIXRoaXMubm9DZW50ZXIgKSA/IHRoaXMuc2V0Q2VudGVyK3RoaXMudy8yIDogdGhpcy54K3RoaXMucGFkZDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIXRoaXMubm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggJyArIHRoaXMuZkZhbTtcclxuICAgIGN0eC50ZXh0QmFzZWxpbmU9XCJtaWRkbGVcIjsgXHJcbiAgICBjdHguZmlsbFRleHQodGhpcy50eHQsIF94LCB0aGlzLnkrdGhpcy5oLzIpO1xyXG4gIH07XHJcblxyXG4gIHZhciBfaW1nID0gZmFsc2U7IC8v0LHRg9C00LXRgiDRhdGA0LDQvdC40YLRjCDQstGA0LXQvNC10L3QvdC+INC60LDRgNGC0LjQvdC60YMg0YHRgtCw0L3QtNCw0YDRgtC90YPRji5cclxuXHJcbiAgdGhpcy5ob3ZlciA9IGZ1bmN0aW9uKGRyYXcpe1xyXG5cclxuICAgIGlmIChkcmF3ICYmIHRoaXMuaG92ZXJJbWcpIHsgICAgICAgICAgICAgLy/QtdGB0LvQuCDQv9C10YDQtdC00LDQu9C4INC40YHRgtC40L3RgyDQuCDRhdC+0LLQtdGAINGDINGN0YLQvtCz0L4g0L7QsdGK0LXQutGC0LAg0LXRgdGC0YwsINGC0L4g0L7RgtGA0LjRgdC+0LLRi9Cy0LDQtdC8INGF0L7QstC10YBcclxuICAgICAgaWYgKCFfaW1nKSBfaW1nID0gdGhpcy5pbWc7ICAgICAgICAgICAgLy8g0LXRgdC70Lgg0LXRidC1INC90LUg0LHRi9C70LAg0YHQvtGF0YDQsNC90LXQvdCwINGB0YLQsNC90LTQsNGA0YLQvdCw0Y8g0LrQsNGA0YLQuNC90LrQsCwg0YLQviDRgdC+0YXRgNCw0L3Rj9C10Lwg0LguLlxyXG4gICAgICB0aGlzLmltZyA9IHRoaXMuaG92ZXJJbWc7ICAgICAgICAgICAgICAvLy4u0L3QvtCy0L7QuSDQsdGD0LTQtdGCINCy0YvQstC+0LTQuNGC0YHRjyDQv9C10YDQtdC00LDQvdC90LDRj1xyXG4gICAgICBjbnYuc3R5bGUuY3Vyc29yID0gXCJwb2ludGVyXCI7ICAgICAgICAgIC8v0Lgg0LrRg9GA0YHQvtGAINCx0YPQtNC10YIg0L/QvtC40L3RgtC10YBcclxuICAgIH0gZWxzZSBpZiAoIF9pbWcgJiYgX2ltZyAhPSB0aGlzLmltZyl7ICAgLy/QuNC90LDRh9C1INC10YHQu9C4INCx0YvQu9CwINGB0L7RhdGA0LDQvdC10L3QsCDQutCw0YDRgtC40L3QutCwINC4INC90LUg0L7QvdCwINCyINC00LDQvdC90YvQuSDQvNC+0LzQtdC90YIg0L7RgtGA0LjRgdC+0LLRi9Cy0LDQtdGC0YHRjywg0YLQvlxyXG4gICAgICB0aGlzLmltZyA9IF9pbWc7ICAgICAgICAgICAgICAgICAgICAgICAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdC8INGB0YLQsNC90LTQsNGA0YIg0LrQsNGA0YLQuNC90LrRgyDQvdCwINC80LXRgdGC0L5cclxuICAgICAgY252LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiOyAgICAgICAgICAvL9C4INC60YPRgNGB0L7RgCDQtNC10LvQsNC10Lwg0YHRgtCw0L3QtNCw0YDRgtC90YvQvFxyXG4gICAgfTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGxheWFibGUgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVjdCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCBpc1N0cm9rZSl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgdGhpcy5pc1N0cm9rZSA9IGlzU3Ryb2tlIHx8IGZhbHNlO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKCF0aGlzLmlzU3Ryb2tlKSB7XHJcbiAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgIGN0eC5zdHJva2VSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJylcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVmlkZW8gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCB2aWRlbyl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy52aWRlbyA9IHZpZGVvO1xyXG5cclxuICB2YXIgc2F2ZSA9IGZhbHNlO1xyXG4gIHZhciBidWZDbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG4gIHZhciBidWZDdHggPSBidWZDbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gIGJ1ZkNudi53aWR0aCA9IEMuV0lEVEg7XHJcbiAgYnVmQ252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMudmlkZW8pIHtcclxuICAgICAgaWYgKCAhc2F2ZSApe1xyXG4gICAgICAgIGJ1ZkN0eC5kcmF3SW1hZ2UodGhpcy52aWRlbywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgICAgICBzYXZlID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgICAgXHJcbiAgICAgIHRoaXMudmlkZW8ucGxheSgpO1xyXG4gICAgICBjYW52YXMuY3R4LmRyYXdJbWFnZShidWZDbnYsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgIGNhbnZhcy5jdHguZHJhd0ltYWdlKHRoaXMudmlkZW8sIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgfTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2FsbCA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpLFxyXG5BdWRpbyAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvQXVkaW8uanMnKSxcclxuUGxheWVibGUgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1BsYXlhYmxlLmpzJyksXHJcbldhbGwgICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9XYWxsLmpzJyksXHJcbkltZ0J1dHRvbiA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWdCdXR0b24uanMnKSxcclxuVmlkZW8gICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1ZpZGVvLmpzJyksXHJcbkJ1dHRvbiAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9CdXR0b24uanMnKSxcclxuUmVjdCAgICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1JlY3QuanMnKSxcclxuSW1hZ2UgICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0ltYWdlLmpzJyksXHJcbkMgICAgICAgICA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyksXHJcbmV2ZW50cyAgICA9IHJlcXVpcmUoJy4vX2V2ZW50cy5qcycpLFxyXG5sZXZlbHMgICAgPSByZXF1aXJlKCcuL19sZXZlbHMuanMnKSxcclxubyAgICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpLFxyXG5jbnZzICAgICAgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKSxcclxua2V5IFx0ICA9IHJlcXVpcmUoJy4vX2tleS5qcycpO1xyXG5cclxuZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5sb2FkZXIpO1xyXG5cclxuIl19
