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
    // if ( res.resourses.areLoaded() ) engin.setGameEngine(gameLoops.options);
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

  options : function(){

    gameLoops.status = "options";

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

  var bPrev   = new ImgButton( res.arrImages[19], false,             20,                C.HEIGHT-10-67, 40,  67, "",                 "prev",    0 );
  var bNext   = new ImgButton( res.arrImages[18], false,             C.WIDTH-20-40,     C.HEIGHT-10-67, 40,  67, "",                 "next",    0 );
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

function createOptionsBut(){           //cоздаем чекбоксы в настройках

  var arrOpt = [];
  var buttons = ["Музыка в меню", "Музыка в игре", "Звуки в игре"];
  var idButtons = ["bMenuMusic", "bGameMusic", "bSfxMusic"];

  for (var i=0; i<buttons.length; i++){
    arrOpt.push( new ImgButton( res.arrImages[31], false, C.WIDTH/2 - 150, 160+(i*70), 45, 45, buttons[i], idButtons[i], 25, 1, 1, 65 ) );
    arrOpt[i].fFam = "Buccaneer";
    arrOpt[i].checked = false;
    arrOpt[i].check = function(){

      if ( !this.checked ) {
        _img = this.img;
        this.img = res.arrImages[30];
        this.checked = !this.checked;
      } else {
        this.img = _img;
        this.checked = !this.checked;
      };
    };
  };

  var bToMenu = new ImgButton( res.arrImages[20], res.arrImages[28], C.WIDTH/2 - 400/2, C.HEIGHT-10-67, 400, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.txtColor = "#000046";

  arrOpt.push( bToMenu );


  return arrOpt;
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
var levelsFooter   = createLevelsFooter();
var bLevelsButtons = createLevelsButtons(5);


//options
var optionsHeader  = new ImgButton( res.arrImages[2], false, 0, 0, C.WIDTH, 71+C.PDNG, "Настройки", "options_header", 25 );
var optionsMusic   = new Button( C.WIDTH/2-140/2, 90, 140, 40, "transparent", "Музыка", "music", 25, "capture_it" );
var bOptions       = createOptionsBut();

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
  "img/hovers/win__button-next_hover.svg",        //29

  "img/options__uncheck_white.svg",           //30
  "img/options__check_white.svg"              //31
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


// настройки - шоб там управлять размерами наверное.. хз пока, музыкой управлять!!!
// шрифт надо подгружать ранее, например отрисовать его в прелойдере невидимо.



// хайдить кнопки в выборе уровня
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Audio.js":14,"./classes/Button.js":15,"./classes/Image.js":16,"./classes/ImgButton.js":17,"./classes/Playable.js":18,"./classes/Rect.js":19,"./classes/Video.js":20,"./classes/Wall.js":21}]},{},[22])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcHJlbG9hZGVyLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3Jlc291cnNlcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19zdG9wd2F0Y2guanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0F1ZGlvLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9CdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0ltYWdlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWdCdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1BsYXlhYmxlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9SZWN0LmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9WaWRlby5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvV2FsbC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2Zha2VfNjc2MmM3YTIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBjbnYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxudmFyIGN0eCA9IGNudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG5jbnYuc3R5bGUuYm9yZGVyID0gXCIycHggc29saWQgYmxhY2tcIjtcclxuY252LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcclxuY252LndpZHRoID0gQy5XSURUSDtcclxuY252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGNudiA6IGNudixcclxuXHJcblx0Y3R4IDogY3R4XHJcblxyXG59OyIsInZhciBQQUREID0gMTsgXHRcdFx0XHRcdFx0Ly/Qv9Cw0LTQtNC40L3Qsywg0LrQvtGC0L7RgNGL0Lkg0Y8g0YXQvtGH0YMg0YfRgtC+0LHRiyDQsdGL0LssINC80LXQtiDQutCy0LDQtNGA0LDRgtCw0LzQuFxyXG52YXIgV0lEVEggPSBQQUREICsgKFBBREQrNTApKjk7IFx0Ly/RiNC40YDQuNC90LAg0LrQsNC90LLRi1xyXG52YXIgSEVJR0hUID0gMjArUEFERCArIChQQUREKzUwKSoxMDsgICAvL9Cy0YvRgdC+0YLQsCDQutCw0L3QstGLXHJcbnZhciBDTlZfQk9SREVSID0gMjtcclxudmFyIEhFQURFUl9IID0gNzE7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0UERORyA6IFBBREQsXHJcblxyXG5cdFdJRFRIIDogV0lEVEgsXHJcblxyXG5cdEhFSUdIVCA6IEhFSUdIVCxcclxuXHJcblx0Q05WX0JPUkRFUiA6IENOVl9CT1JERVIsXHJcblxyXG5cdEhFQURFUl9IIDogSEVBREVSX0hcclxuXHJcbn07XHJcbiIsIi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8gINC60YDQvtGB0LHRgNCw0YPQt9C10YDQvdC+0LUg0YPQv9GA0LLQu9C10L3QuNC1INGG0LjQutC70LDQvNC4INC40LPRgNGLXHJcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoXCIuL19jYW52YXMuanNcIik7XHJcblxyXG52YXIgZ2FtZUVuZ2luZTtcclxuXHJcbnZhciBuZXh0R2FtZVN0ZXAgPSAoZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0d2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0bW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0b1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0ZnVuY3Rpb24gKGNhbGxiYWNrKXtcclxuXHRcdHNldEludGVydmFsKGNhbGxiYWNrLCAxMDAwLzYwKVxyXG5cdH07XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBnYW1lRW5naW5lU3RlcCgpe1xyXG5cdGdhbWVFbmdpbmUoKTtcclxuXHRuZXh0R2FtZVN0ZXAoZ2FtZUVuZ2luZVN0ZXApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0XHRnYW1lRW5naW5lU3RlcCgpO1xyXG5cdH0sXHJcblxyXG5cdHNldEdhbWVFbmdpbmUgOiBmdW5jdGlvbihjYWxsYmFjayl7XHJcblx0XHRpZiAoIGNhbnZhcy5jbnYuc3R5bGUuY3Vyc29yICE9IFwiZGVmYXVsdFwiICkgY2FudmFzLmNudi5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjsgIC8v0LLRgdC10LPQtNCwINC/0YDQuCDQutC70LjQutC1INC90LAg0LvRjtCx0YPRjiDQutC90L7Qv9C60YMsINGH0YLQviDQsSDQutGD0YDRgdC+0YAg0YHRgtCw0L3QtNCw0YDRgtC40LfQuNGA0L7QstCw0LvRgdGPXHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIG8gICAgICA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIHN3ICAgICA9IHJlcXVpcmUoJy4vX3N0b3B3YXRjaC5qcycpO1xyXG52YXIgbGV2ZWxzID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyk7XHJcbnZhciBlbmdpbiAgPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gICA9IHJlcXVpcmUoJy4vX2dhbWVMb29wcy5qcycpO1xyXG52YXIgaGYgICAgID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIGZzICAgICA9IHJlcXVpcmUoJy4vX2Z1bGxTY3JlZW4uanMnKTtcclxudmFyIEMgICAgICA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBrZXkgICAgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxudmFyIHJlcyAgICA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxudmFyIGEgPSBvLmF1ZGlvO1xyXG52YXIgZ2FtZUxvb3BzID0gZ0xvbztcclxuXHJcbnZhciBpc0JvcmRlciA9IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIg0L7QsdGK0LXQutGCLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvtC80Lkg0LPRgNCw0L3QuNGG0Ysg0LrQsNC90LLRi1xyXG4gIHVwIDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueSA9PSAwO1xyXG4gIH0sXHJcblxyXG4gIGRvd24gOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai55ID09IEMuSEVJR0hUIC0gb2JqLmggLSBDLlBETkcgLSBDLkhFQURFUl9IIC0gQy5QRE5HO1xyXG4gIH0sXHJcblxyXG4gIGxlZnQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai54ID09IDA7XHJcbiAgfSxcclxuXHJcbiAgcmlnaHQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai54ID09IEMuV0lEVEggLSBvYmoudyAtIEMuUERORyAtIEMuUEROR1xyXG4gIH1cclxufTtcclxuXHJcbnZhciBpc05lYXIgPSB7ICAgLy/Qv9GA0LjQvdC40LzQsNC10YIgMiDQvtCx0YrQtdC60YLQsCwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10LzQvtC5INGB0YLQvtGA0L7QvdGLIDHRi9C5INC+0YIgMtCz0L4uXHJcblxyXG4gIHVwIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkgeyAgLy/Qv9GA0L7QstC10YDQutCwINC/0LXRgNC10LTQsNCy0LDQtdC80YvQuSDRjdC70LXQvNC10L3RgiDQvNCw0YHRgdC40LIg0L7QsdGK0LXQutGC0L7QsiDQuNC70Lgg0L7QsdGK0LXQutGCLlxyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueSArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzIueSArIG9ial8yLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnkgJiYgb2JqXzEueCA9PSBvYmpfMltpXS54O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gIH0sXHJcblxyXG4gIGxlZnQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS54ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi54ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9LFxyXG5cclxuICByaWdodCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGNhbk1vdmVPYmooZGlyZWN0aW9uKXsgIC8vKNC+0L/QuNGB0YvQstCw0LXQvCDQs9GA0LDQvdC40YbRiyDQtNCy0LjQttC10L3QuNGPKSDRgNCw0LfRgNC10YjQsNC10YIg0LTQstC40LbQtdC90LjQtSDQsiDQv9GA0LXQtNC10LvQsNGFINGD0YDQvtCy0L3Rj1xyXG5cclxuICBhLnBsYXllci5wbGF5KDEpOyAgICAgICAgICAgICAgIC8v0L7Qt9Cy0YPRh9C60LAg0LTQstC40LbQtdC90LjRj1xyXG4gIG8ucGwuZGlyZWN0aW9uID0gby5wbC5pc01vdmUgPSBoZi5kaXJlY3Rpb25JcyhkaXJlY3Rpb24pO1xyXG4gIGlmICggaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby5ib3gpICYmICFpc0JvcmRlcltkaXJlY3Rpb25dKG8uYm94KSAmJiAhaXNOZWFyW2RpcmVjdGlvbl0oby5ib3gsIG8ud2FsbHMpICl7ICAgICAgLy/QtdGB0LvQuCDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDRj9GJ0LjQuiDQvdC1INGDINCz0YDQsNC90LjRhiwg0LTQstC40LPQsNC10LwuXHJcbiAgICBhLmNyeXN0YWwucGxheSgxKTsgICAgICAgICAgIC8v0L7Qt9Cy0YPRh9C60LAg0YLQvtC70LrQsNC90LjRjyDQutGA0LjRgdGC0LDQu9C70LBcclxuICAgIG8ucGwubW92ZShkaXJlY3Rpb24pO1xyXG4gICAgby5ib3gubW92ZShkaXJlY3Rpb24pO1xyXG4gIH0gZWxzZSBpZiggIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8uYm94KSAmJiAhaXNCb3JkZXJbZGlyZWN0aW9uXShvLnBsKSAmJiAhaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby53YWxscykgKXsgLy/QtdGB0LvQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0Y/RidC40LrQvtC8INC4INC90LUg0YDRj9C00L7QvCDRgSDQs9GA0LDQvdC40YbQtdC5LCDQtNCy0LjQs9Cw0LXQvNGB0Y8uXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBpc0N1cnNvckluQnV0dG9uKHgseSxidXQpeyAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGC0YDRgywg0LXRgdC70Lgg0LrRg9GA0YHQvtGAINC/0L7Qv9Cw0Lsg0LIg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L7QsdGK0LXQutGC0LBcclxuICByZXR1cm4geCA+PSBidXQueCAmJiBcclxuICB4IDw9IGJ1dC54K2J1dC53ICYmIFxyXG4gIHkgPj0gYnV0LnkgJiYgXHJcbiAgeSA8PSBidXQueStidXQuaFxyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZExldmVsKG51bWJlcil7ICAgICAgIC8v0LfQsNCz0YDRg9C30LrQsCDRg9GA0L7QstC90Y9cclxuICBzdy5zdGFydCgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgLy/Qt9Cw0L/Rg9GB0LrQsNC10Lwg0YLQsNC50LzQtdGAXHJcbiAgbGV2ZWxzW251bWJlcl0oKTsgICAgICAgICAgICAgICAgICAgIC8v0LfQsNC/0YPRgdC60LDQtdC8INGD0YDQvtCy0LXRgNGMINC60L7RgtC+0YDRi9C5INC30LDQv9GA0L7RgdC40LvQuFxyXG4gIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBudW1iZXI7ICAgICAvL9C30LDQv9C+0LzQuNC90LDQtdC8INC60LDQutC+0Lkg0YHQtdC50YfQsNGBINGD0YDQvtCy0LXQvdGMINC40LPRgNCw0YLRjCDQsdGD0LTQtdC8IFxyXG4gIG8uY3VyckxldmVsLnR4dCA9IFwi0KPRgNC+0LLQtdC90YwgXCIrbnVtYmVyOyAvL9CyINGF0LXQtNC10YDQtSDQstGL0LLQvtC00LjQvCDQvdC+0LzQtdGAINGD0YDQvtCy0L3Rj1xyXG4gIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmdhbWUpOyAvL9C90YMg0Lgg0LfQsNC/0YPRgdC60LDQtdC8INGG0LjQutC7INC40LPRgNGLIFxyXG59O1xyXG5cclxud2luZG93Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGUpeyAgIC8v0YHQvtCx0YvRgtC40LUg0L3QsNC20LDRgtC40Y8g0LrQu9Cw0LLQuNGIXHJcblxyXG4gIGlmICggZ0xvby5zdGF0dXMgPT0gXCJnYW1lXCIgKXsgLy/Qv9C10YDQtdC00LLQuNCz0LDRgtGM0YHRjyDRgtC+0LvRjNC60L4g0LXRgdC70Lgg0LjQtNC10YIg0LjQs9GA0LAuXHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiRFwiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJyaWdodFwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJTXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcImRvd25cIik7XHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiV1wiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJ1cFwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJBXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcImxlZnRcIik7XHJcblxyXG4gIH07XHJcblxyXG4gIHdpbmRvdy5vbmtleXVwID0gZnVuY3Rpb24oZSl7XHJcbiAgICBvLnBsLmlzTW92ZSA9IGZhbHNlO1xyXG4gIH07XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKXsgLy9j0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC80YvRiNC60LhcclxuXHJcbiAgaWYgKCBmcy5pc0Z1bGxTY3JlZW4gKXsgICAgICBcclxuICAgIHZhciB4ID0gKGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0KS9mcy56b29tO1xyXG4gICAgdmFyIHkgPSAoZS5wYWdlWS1jYW52YXMuY252Lm9mZnNldFRvcCkvZnMuem9vbTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICAgIHZhciB5ID0gZS5wYWdlWS1jYW52YXMuY252Lm9mZnNldFRvcDtcclxuICB9O1xyXG5cclxuICBzd2l0Y2ggKGdMb28uc3RhdHVzKXtcclxuXHJcbiAgICBjYXNlIFwibWVudVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLm1lbnUgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubWVudVtpXSkgKXtcclxuICAgICAgICAgIHN3aXRjaCAoby5tZW51W2ldLm5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJwbGF5XCIgOlxyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgICAgICBhLmJnSW5NZW51LnN0b3AoKTtcclxuICAgICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiY2hhbmdlX2xldmVsXCIgOlxyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5sZXZlbHMpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcIm9wdGlvbnNcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImxldmVsc1wiIDpcclxuICAgICAgZm9yICggaSBpbiBvLmxldmVsc0Zvb3RlciApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5sZXZlbHNGb290ZXJbaV0pICl7XHJcbiAgICAgICAgICBzd2l0Y2ggKG8ubGV2ZWxzRm9vdGVyW2ldLm5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmV2XCIgOlxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi0JrQvdC+0L/QutCwINC90LDQt9Cw0LQsINC/0L7QutCwINGC0LDQui5cIik7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwidG9fbWVudVwiIDpcclxuICAgICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwibmV4dFwiIDpcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcItCa0L3QvtC/0LrQsCDQstC/0LXRgNC10LQsINC/0L7QutCwINGC0LDQui5cIik7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgby5iTGV2ZWxzQnV0dG9ucy5sZW5ndGg7IGkrKyApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iTGV2ZWxzQnV0dG9uc1tpXSkgKXtcclxuICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgIGEuYmdJbk1lbnUuc3RvcCgpO1xyXG4gICAgICAgICAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9IGkrMTtcclxuICAgICAgICAgIGxvYWRMZXZlbChpKzEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJvcHRpb25zXCIgOlxyXG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJPcHRpb25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJPcHRpb25zW2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLmJPcHRpb25zW2ldLm5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJiTWVudU11c2ljXCIgOlxyXG4gICAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoMSk7XHJcbiAgICAgICAgICAgICAgby5iT3B0aW9uc1tpXS5jaGVjaygpO1xyXG4gICAgICAgICAgICAgIGEuYmdJbk1lbnUuY2hhbmdlRGlzYWJsZSgxKTsgXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiYkdhbWVNdXNpY1wiIDpcclxuICAgICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KDEpO1xyXG4gICAgICAgICAgICAgIG8uYk9wdGlvbnNbaV0uY2hlY2soKTtcclxuICAgICAgICAgICAgICBhLmJnSW5HYW1lLmNoYW5nZURpc2FibGUoKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJiU2Z4TXVzaWNcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgxKTtcclxuICAgICAgICAgICAgICBvLmJPcHRpb25zW2ldLmNoZWNrKCk7XHJcbiAgICAgICAgICAgICAgYS5idXR0b24uY2hhbmdlRGlzYWJsZSgpO1xyXG4gICAgICAgICAgICAgIGEud2luLmNoYW5nZURpc2FibGUoKTtcclxuICAgICAgICAgICAgICBhLnBsYXllci5jaGFuZ2VEaXNhYmxlKCk7XHJcbiAgICAgICAgICAgICAgYS5jcnlzdGFsLmNoYW5nZURpc2FibGUoKTtcclxuICAgICAgICAgICAgICBhLmJ1dHRvbi5wbGF5KDEpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInRvX21lbnVcIiA6XHJcbiAgICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7IFxyXG5cclxuICAgIGNhc2UgXCJnYW1lXCIgOlxyXG4gICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYlBhdXNlKSApe1xyXG4gICAgICAgIGEuYmdJbkdhbWUucGF1c2UoKTtcclxuICAgICAgICBhLmJ1dHRvbi5wbGF5KCk7XHJcbiAgICAgICAgc3cucGF1c2VUaW1lcigpO1xyXG4gICAgICAgIG8uYmdPcGFjaXR5LmRyYXcoKTtcclxuICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5wYXVzZSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkZ1bGxTY3IpICl7XHJcbiAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICggIWZzLmlzRnVsbFNjcmVlbiApID8gZnMubGF1bmNoRnVsbFNjcmVlbihjYW52YXMuY252KSA6IGZzLmNhbnNlbEZ1bGxTY3JlZW4oKTsgXHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJ3aW5cIiA6XHJcblxyXG4gICAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ud2luUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICAgICAgYS5idXR0b24ucGxheSgpO1xyXG4gICAgICAgICAgICBhLmJnSW5HYW1lLnN0b3AoKTtcclxuICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgIT0gbGV2ZWxzLmx2bHNDb3VudCgpICl7XHJcbiAgICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCsrO1xyXG4gICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJwYXVzZVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ucGF1c2VQb3BVcFtpXSkgKXtcclxuICAgICAgICAgIGEuYnV0dG9uLnBsYXkoKTtcclxuICAgICAgICAgIHN3aXRjaCAoby5wYXVzZVBvcFVwW2ldLm5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJyZXR1cm5cIiA6XHJcbiAgICAgICAgICAgICAgc3cuc3RhcnQoKTtcclxuICAgICAgICAgICAgICBhLmJnSW5HYW1lLnBsYXkoKTtcclxuICAgICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5nYW1lKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJyZXN0YXJ0XCIgOlxyXG4gICAgICAgICAgICAgIHN3LnJlc2V0KCk7XHJcbiAgICAgICAgICAgICAgYS5iZ0luR2FtZS5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgbG9hZExldmVsKGdhbWVMb29wcy5jdXJyZW50TGV2ZWwpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcImV4aXRcIiA6XHJcbiAgICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgICBhLmJnSW5HYW1lLnN0b3AoKTtcclxuICAgICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICB9O1xyXG59O1xyXG5cclxud2luZG93Lm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSl7IC8v0YHQvtCx0YvRgtC40Y8g0LTQstC40LbQtdC90LjRjyDQvNGL0YjQutC4LCDRgtGD0YIg0YXQvtCy0LXRgNGLINC+0LHRgNCw0LHQvtGC0LDQtdC8XHJcblxyXG4gIGlmICggZnMuaXNGdWxsU2NyZWVuICl7XHJcbiAgICB2YXIgeCA9IChlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdCkvZnMuem9vbTtcclxuICAgIHZhciB5ID0gKGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3ApL2ZzLnpvb207XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciB4ID0gZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQ7XHJcbiAgICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcbiAgfTtcclxuXHJcbiAgc3dpdGNoIChnTG9vLnN0YXR1cyl7XHJcblxyXG4gICAgY2FzZSBcIm1lbnVcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLm1lbnVbaV0pICkgPyBvLm1lbnVbaV0uaG92ZXIoMSkgOiBvLm1lbnVbaV0uaG92ZXIoKTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImdhbWVcIiA6XHJcbiAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iUGF1c2UpICkgICA/IG8uYlBhdXNlLmhvdmVyKDEpICAgOiBvLmJQYXVzZS5ob3ZlcigpO1xyXG5cclxuICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJGdWxsU2NyKSApID8gby5iRnVsbFNjci5ob3ZlcigxKSA6IG8uYkZ1bGxTY3IuaG92ZXIoKTsgIFxyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwid2luXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ud2luUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICAgICAgby53aW5Qb3BVcFtpXS5ob3ZlcigxKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCAhPSBsZXZlbHMubHZsc0NvdW50KCkgKXtcclxuICAgICAgICAgICAgby53aW5Qb3BVcFtpXS5ob3ZlcigxKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICggby53aW5Qb3BVcFtpXS5ob3ZlciApIG8ud2luUG9wVXBbaV0uaG92ZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwibGV2ZWxzXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmxldmVsc0Zvb3RlcltpXSkgKSAgID8gby5sZXZlbHNGb290ZXJbaV0uaG92ZXIoMSkgICA6IG8ubGV2ZWxzRm9vdGVyW2ldLmhvdmVyKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJMZXZlbHNCdXR0b25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICAgICAgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJMZXZlbHNCdXR0b25zW2ldKSApID8gby5iTGV2ZWxzQnV0dG9uc1tpXS5ob3ZlcigxKSA6IG8uYkxldmVsc0J1dHRvbnNbaV0uaG92ZXIoKTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgXHJcbiAgICBjYXNlIFwib3B0aW9uc1wiIDpcclxuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgby5iT3B0aW9ucy5sZW5ndGg7IGkrKyApe1xyXG4gICAgICAgICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iT3B0aW9uc1tpXSkgKSA/IG8uYk9wdGlvbnNbaV0uaG92ZXIoMSkgOiBvLmJPcHRpb25zW2ldLmhvdmVyKCk7XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJwYXVzZVwiIDpcclxuICAgICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ucGF1c2VQb3BVcFtpXSkgKXtcclxuICAgICAgICAgIGlmICggby5wYXVzZVBvcFVwW2ldLmhvdmVyICkgby5wYXVzZVBvcFVwW2ldLmhvdmVyKDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIG8ucGF1c2VQb3BVcFtpXS5ob3ZlciApIG8ucGF1c2VQb3BVcFtpXS5ob3ZlcigpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gIH07XHJcbn07XHJcbiIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIHpvb20gPSAwO1xyXG5cclxuZnVuY3Rpb24gZnVsbENhbnZhcygpe1x0Ly/QutCw0L3QstCwINCy0L4g0LLQtdGB0Ywg0Y3QutGA0LDQvVxyXG5cclxuXHR2YXIgZGV2aWNlV2lkdGggPSB3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGg7XHJcblx0dmFyIGRldmljZUhlaWdodCA9IHdpbmRvdy5zY3JlZW4uYXZhaWxIZWlnaHQ7XHJcblx0ZnVsbFNjcmVlbi56b29tID0gKGRldmljZUhlaWdodCAvIEMuSEVJR0hUKS50b0ZpeGVkKDEpO1x0Ly/QutCw0LrQvtC1INGD0LLQtdC70LjRh9C10L3QuNC1INGB0LTQtdC70LDRgtGMINC40YHRhdC+0LTRjyDQuNC3INGA0LDQt9C80LXRgNC+0LIg0Y3QutGA0LDQvdCwLlxyXG5cclxuXHRjYW52YXMuY252LndpZHRoID0gY2FudmFzLmNudi53aWR0aCpmdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodCpmdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmN0eC5zY2FsZShmdWxsU2NyZWVuLnpvb20sZnVsbFNjcmVlbi56b29tKTtcclxuXHJcblx0ZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW4gPSAhZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW47XHJcbn07XHJcblxyXG5mdW5jdGlvbiBub3JtYWxDYW52YXMoKXtcdC8v0LjRgdGF0L7QtNC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUg0LrQsNC90LLRi1xyXG5cclxuXHQvL2PQvtGF0YDQsNC90Y/QtdC8INC/0L7RgdC70LXQtNC90LjQuSDQutCw0LTRgCDQuNCz0YDRiywg0LTQsNCx0Ysg0L/RgNC4INCy0L7Qt9Cy0YDQsNGJ0LXQvdC40Lgg0YDQsNC30LzQtdGA0LAg0L/QvtGB0LvQtSDRhNGD0LvRgdC60YDQuNC90LAsINC+0L0g0L7RgtGA0LjRgdC+0LLQsNC70YHRjywg0LjQvdCw0YfQtSDQsdGD0LTQtdGCINCx0LXQu9GL0Lkg0YXQvtC70YHRgi5cclxuXHR2YXIgYnVmQ252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuXHR2YXIgYnVmQ3R4ID0gYnVmQ252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHRidWZDbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbTtcclxuXHRidWZDbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tO1xyXG5cdGJ1ZkN0eC5kcmF3SW1hZ2UoY2FudmFzLmNudiwgMCwwLCBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbSwgY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tKTtcclxuXHJcblx0Y2FudmFzLmNudi53aWR0aCA9IGNhbnZhcy5jbnYud2lkdGgvZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jdHguc2NhbGUoMSwxKTtcclxuXHRjYW52YXMuY3R4LmRyYXdJbWFnZShidWZDbnYsMCwwLGNhbnZhcy5jbnYud2lkdGgsY2FudmFzLmNudi5oZWlnaHQpO1xyXG5cclxuXHRmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbiA9ICFmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uRnVsbFNjcmVlbkNoYW5nZSgpe1x0Ly/Qv9GA0Lgg0LjQt9C80LXQvdC40Lgg0YHQvtGB0YLQvtGP0L3QuNC1INGE0YPQu9GB0LrRgNC40L3QsFxyXG5cclxuXHQoIGZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuICkgPyBub3JtYWxDYW52YXMoKSA6IGZ1bGxDYW52YXMoKTtcclxufTtcclxuXHJcbmNhbnZhcy5jbnYuYWRkRXZlbnRMaXN0ZW5lcihcIndlYmtpdGZ1bGxzY3JlZW5jaGFuZ2VcIiwgb25GdWxsU2NyZWVuQ2hhbmdlKTtcclxuY2FudmFzLmNudi5hZGRFdmVudExpc3RlbmVyKFwibW96ZnVsbHNjcmVlbmNoYW5nZVwiLCAgICBvbkZ1bGxTY3JlZW5DaGFuZ2UpO1xyXG5jYW52YXMuY252LmFkZEV2ZW50TGlzdGVuZXIoXCJmdWxsc2NyZWVuY2hhbmdlXCIsICAgICAgIG9uRnVsbFNjcmVlbkNoYW5nZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bGxTY3JlZW4gPSB7IFxyXG5cclxuXHRsYXVuY2hGdWxsU2NyZWVuIDogZnVuY3Rpb24oZWxlbSl7XHJcblxyXG5cdFx0aWYgKCBlbGVtLnJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ubW96UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5tb3pSZXF1c3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBlbGVtLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH07XHJcblx0fSxcclxuXHJcblx0Y2Fuc2VsRnVsbFNjcmVlbiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0aWYgKCBkb2N1bWVudC5leGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRpc0Z1bGxTY3JlZW4gOiBmYWxzZSxcclxuXHJcblx0em9vbSA6IHpvb21cclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcbnZhciBwcmVsb2FkZXIgPSByZXF1aXJlKCcuL19wcmVsb2FkZXIuanMnKTtcclxuXHJcbnZhciBhID0gby5hdWRpbztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2FtZUxvb3BzID0gIHtcclxuXHJcbiAgbG9hZGVyIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJsb2FkZXJcIjtcclxuXHJcbiAgICBwcmVsb2FkZXIudXBkYXRlTG9hZGVyKCk7XHJcbiAgICBwcmVsb2FkZXIuZHJhd0xvYWRlcigpO1xyXG4gICAgcHJlbG9hZGVyLmRyYXdMb2FkVGV4dCgpO1xyXG4gICAgXHJcbiAgICBpZiAoIHJlcy5yZXNvdXJzZXMuYXJlTG9hZGVkKCkgKSBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5tZW51KTtcclxuICAgIC8vIGlmICggcmVzLnJlc291cnNlcy5hcmVMb2FkZWQoKSApIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm9wdGlvbnMpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImdhbWVcIjsgXHJcblxyXG4gICAgaWYgKGEuYmdJbkdhbWUuc3RhdGUgPT0gXCJzdG9wXCIpIGEuYmdJbkdhbWUucGxheSgpO1xyXG5cclxuICAgIC8v0L7Rh9C40YHRgtC60LAg0L7QsdC70LDRgdGC0LhcclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0LHQsyDRg9GA0L7QstC90Y9cclxuICAgIG8uYmdMZXZlbC5kcmF3KCk7XHJcbiAgICBcclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINC80LDRgtGA0LjRh9C90L7QtSDQv9C+0LvQtSDQuNCz0YDRi1xyXG4gICAgZm9yICggaSBpbiBvLm1hdHJpeCApe1xyXG4gICAgICBvLm1hdHJpeFtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINGB0YLQtdC90YtcXNC/0YDQtdCz0YDQsNC00YtcclxuICAgIGZvciAoIGkgaW4gby53YWxscyApe1xyXG4gICAgICBvLndhbGxzW2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy/QvtGC0YDQuNGB0L7QstC60LAg0YXQtdC00LXRgNCwINGD0YDQvtCy0L3Rj1xyXG4gICAgby5oZWFkZXIuZHJhdygpO1xyXG4gICAgby5zdG9wV2F0Y2guZHJhdygxLDEwKTtcclxuICAgIG8uYkZ1bGxTY3IuZHJhdygpO1xyXG4gICAgby5iUGF1c2UuZHJhdygpO1xyXG4gICAgby5jdXJyTGV2ZWwuZHJhdygpO1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINC40LPRgNC+0LLRi9GFINC+0LHRitC10LrRgtC+0LJcclxuICAgIG8uZG9vci5kcmF3KCk7XHJcbiAgICBvLnBsLmRyYXcoKTtcclxuICAgIG8uYm94LmRyYXcoKTtcclxuXHJcbiAgICAvL9C10YHQu9C4INC/0L7QsdC10LTQuNC70LhcclxuICAgIGlmICggaGYuaXNXaW4oKSApe1xyXG4gICAgICBvLmJnT3BhY2l0eS5kcmF3KCk7IC8v0L7RgtGA0LjRgdC+0LLQutCwINC30LDRgtC10LzQvdC10L3QuNGPXHJcbiAgICAgIGEud2luLnBsYXkoKTsgICAgICAgLy/QvtC30LLRg9GH0LrQsCDQv9C+0LHQtdC00LrQuFxyXG4gICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy53aW4pO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJtZW51XCI7XHJcblxyXG4gICAgaWYgKGEuYmdJbk1lbnUuc3RhdGUgPT0gXCJzdG9wXCIpIGEuYmdJbk1lbnUucGxheSgpO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby5hbmltYXRlQmcuZHJhdygpO1xyXG5cclxuICAgIG8ubG9nby5kcmF3KCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLm1lbnUgKXtcclxuICAgICAgby5tZW51W2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgd2luIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJ3aW5cIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJ3aW5fdGV4dFwiICkgby53aW5Qb3BVcFtpXS50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK2dhbWVMb29wcy5jdXJyZW50TGV2ZWw7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9PSBsZXZlbHMubHZsc0NvdW50KCkgKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgby53aW5Qb3BVcFtpXS5kcmF3KCk7XHJcbiAgICAgIH0gIFxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBwYXVzZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwicGF1c2VcIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICBvLnBhdXNlUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBsZXZlbHMgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImxldmVsc1wiO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby52aWRlb0JnTGV2ZWxzLmRyYXcoKTtcclxuXHJcbiAgICBvLmxldmVsc0hlYWRlci5kcmF3KCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLmJMZXZlbHNCdXR0b25zICl7XHJcbiAgICAgIG8uYkxldmVsc0J1dHRvbnNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgIG8ubGV2ZWxzRm9vdGVyW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgb3B0aW9ucyA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwib3B0aW9uc1wiO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby52aWRlb0JnTGV2ZWxzLmRyYXcoKTtcclxuXHJcbiAgICBvLm9wdGlvbnNIZWFkZXIuZHJhdygpO1xyXG4gICAgby5vcHRpb25zTXVzaWMuZHJhdygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5iT3B0aW9ucyApe1xyXG4gICAgICBvLmJPcHRpb25zW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgc3RhdHVzIDogXCJcIixcclxuXHJcbiAgY3VycmVudExldmVsIDogXCIxXCJcclxuXHJcbn07XHJcbiIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgY2xlYXJSZWN0IDogZnVuY3Rpb24oeCx5LHcsaCl7ICAgICAgLy/QvtGH0LjRgdGC0LjRgtC10LvRjFxyXG4gICAgY3R4LmNsZWFyUmVjdCh4LHksdyxoKTtcclxuICB9LFxyXG5cclxuICBnZXRSYW5kb21JbnQgOiBmdW5jdGlvbihtaW4sIG1heCkgeyAvL9GE0YPQvdC60YbQuNGPINC00LvRjyDRgNCw0L3QtNC+0LzQsCDRhtC10LvQvtGH0LjRgdC70LXQvdC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y9cclxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xyXG4gIH0sXHJcblxyXG4gIGlzV2luIDogZnVuY3Rpb24oKXsgICAgICAgICAgICAgICAgIC8v0L/QvtCx0LXQtNC40LvQuD9cclxuICAgIHJldHVybiBvLmJveC54ID09IG8uZG9vci54ICYmIG8uYm94LnkgPT0gby5kb29yLnk7XHJcbiAgfSxcclxuXHJcbiAgZGlyZWN0aW9uSXMgOiBmdW5jdGlvbihkaXJlY3Rpb24peyAgLy/QstC+0LfQstGA0LDRidCw0LXRgiDRg9Cz0L7QuyDQv9C+0LLQvtGA0L7RgtCwINCyINCz0YDQsNC00YPRgdCw0YUsINC80L7QttC90L4g0LHRi9C70L4g0Lgg0YHQtNC10LvQsNGC0Ywg0L/RgNC+0YnQtSAtINC+0LHRitC10LrRgtC+0LwuXHJcbiAgXHRzd2l0Y2goZGlyZWN0aW9uKXtcclxuXHJcbiAgXHRcdGNhc2UgXCJ1cFwiICAgOiByZXR1cm4gMzYwO1xyXG4gIFx0XHRicmVhaztcclxuICBcdFx0Y2FzZSBcImRvd25cIiA6IHJldHVybiAxODA7XHJcbiAgXHRcdGJyZWFrO1xyXG4gIFx0XHRjYXNlIFwibGVmdFwiIDogcmV0dXJuIDI3MDtcclxuICBcdFx0YnJlYWs7XHJcbiAgXHRcdGNhc2UgXCJyaWdodFwiOiByZXR1cm4gOTA7XHJcbiAgXHRcdGJyZWFrO1xyXG5cclxuICBcdH07XHJcbiAgfVxyXG59O1xyXG4iLCJ2YXIga2V5cyA9IHtcclxuXHRcIldcIiA6IDg3LFxyXG5cdFwiU1wiIDogODMsXHJcblx0XCJBXCIgOiA2NSxcclxuXHRcIkRcIiA6IDY4XHJcbn07XHJcblxyXG52YXIga2V5RG93biA9IDA7XHJcbi8vIHZhciBrZXlEb3duID0ge307XHJcblxyXG5mdW5jdGlvbiBzZXRLZXkoa2V5Q29kZSl7XHJcblx0a2V5RG93biA9IGtleUNvZGU7XHJcblx0Ly8ga2V5RG93bltrZXljb2RlXSA9IHRydWU7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjbGVhcktleShrZXlDb2RlKXtcclxuXHRrZXlEb3duID0gMDtcclxuXHQvLyBrZXlEb3duW2tleUNvZGVdID0gZmFsc2U7XHJcbn07XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZSl7XHJcblx0c2V0S2V5KGUua2V5Q29kZSk7XHJcbn0pO1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdGNsZWFyS2V5KGUua2V5Q29kZSk7XHJcbn0pO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGlzS2V5RG93bihrZXlOYW1lKXtcclxuXHRyZXR1cm4ga2V5RG93bltrZXlzW2tleU5hbWVdXSA9PSB0cnVlO1xyXG59O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcblx0aXNLZXlEb3duIDogZnVuY3Rpb24oa2V5TmFtZSl7XHJcblx0XHRyZXR1cm4ga2V5RG93biA9PSBrZXlzW2tleU5hbWVdO1xyXG5cdFx0Ly8gcmV0dXJuIGtleURvd25ba2V5c1trZXlOYW1lXV0gPT0gdHJ1ZTtcclxuXHR9XHJcblxyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciByZXMgPSByZXF1aXJlKCcuL19yZXNvdXJzZXMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGxldmVscyA9IHtcclxuXHJcblx0bHZsc0NvdW50IDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjb3VudCA9IDA7XHJcblx0XHRmb3Ioa2V5IGluIGxldmVscyl7IGNvdW50KysgfTtcclxuXHRcdFx0cmV0dXJuIGNvdW50LTE7XHJcblx0fSxcclxuXHJcblx0MSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgLy/QvNCw0YHRgdC40LIg0YEg0LHRg9C00YPRidC10L/QvtGB0YLRgNC+0LXQvdC90YvQvNC4INGB0YLQtdC90LrQsNC80LhcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzEsM10sWzEsNF0sWzEsNV0sWzIsMF0sWzIsNl0sWzIsOF0sWzMsMl0sWzQsMV0sWzQsM10sWzQsN10sWzUsNF0sWzYsNF0sWzYsNl0sWzcsMV0sWzcsOF0sWzgsMF0sWzgsNF0sWzgsNV1cclxuXHRcdF07XHRcdFx0XHQgIC8v0L/RgNC40LTRg9C80LDQvdC90YvQuSDQvNCw0YHRgdC40LIg0YHQviDRgdGC0LXQvdC60LDQvNC4XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgLy/Qt9Cw0L/QvtC70L3Rj9C10Lwg0LzQsNGB0YHQuNCyIHdhbGxzXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwicmlnaHRcIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzIqKDUwK0MuUERORyksIDcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDBdLFswLDRdLFswLDNdLFswLDZdLFsyLDJdLFsyLDRdLFszLDhdLFszLDBdLFszLDddLFs0LDJdLFs0LDRdLFs0LDVdLFs0LDZdLFs1LDBdLFs2LDJdLFs2LDVdLFs2LDZdLFs2LDddLFs3LDBdLFs4LDNdLFs4LDRdLFs4LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0RGlyZWN0aW9uKCBoZi5kaXJlY3Rpb25JcyhcInJpZ2h0XCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCs2Kig1MCtDLlBETkcpLCAwKzcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKzYqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQzIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzAsMl0sWzAsN10sWzEsNV0sWzEsOF0sWzIsMl0sWzIsN10sWzMsNF0sWzQsMV0sWzQsNF0sWzQsNl0sWzYsMl0sWzYsM10sWzYsNF0sWzYsNl0sWzYsOF0sWzcsMF0sWzcsNV0sWzgsMF0sWzgsMV0sWzgsM10sWzgsN11cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDArOCooNTArQy5QRE5HKSwgMCs4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJ1cFwiKSApO1xyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIDArMSooNTArQy5QRE5HKSwgMCs2Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIDArMiooNTArQy5QRE5HKSwgMCszKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0NCA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDFdLFsxLDVdLFsxLDddLFsyLDRdLFszLDFdLFszLDNdLFszLDZdLFszLDhdLFs0LDNdLFs1LDVdLFs1LDddLFs2LDBdLFs2LDJdLFs2LDNdLFs2LDVdLFs3LDhdLFs4LDBdLFs4LDhdXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwKzcqKDUwK0MuUERORyksIDArOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXREaXJlY3Rpb24oIGhmLmRpcmVjdGlvbklzKFwidXBcIikgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzcqKDUwK0MuUERORyksIDArNyooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzYqKDUwK0MuUERORyksIDArMCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDUgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwxXSxbMCwzXSxbMCw1XSxbMCw4XSxbMiwyXSxbMiw0XSxbMiw2XSxbMiw4XSxbNCwwXSxbNCwzXSxbNCw1XSxbNCw3XSxbNiwxXSxbNiwyXSxbNiw0XSxbNiw3XSxbNyw4XSxbOCwyXSxbOCw0XSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCswKig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldERpcmVjdGlvbiggaGYuZGlyZWN0aW9uSXMoXCJkb3duXCIpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsxKig1MCtDLlBETkcpLCAwKzEqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCwgMCs4Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgY252cyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWF0cml4QkcoKXsgICAgICAgICAgICAgLy/RgdC+0LfQtNCw0LXQvCDQvNCw0YLRgNC40YfQvdC+0LUg0L/QvtC70LVcclxuICB2YXIgbWF0cml4ID0gW107ICAgICAgICAgICAgICAgICAgICAgLy/QvNCw0YHRgdC40LIg0LTQu9GPINC80LDRgtGA0LjRh9C90L7Qs9C+INCy0LjQtNCwINGD0YDQvtCy0L3Rj1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKyl7ICAgICAgICAgLy/Qt9Cw0L/QvtC70L3Rj9C10Lwg0L7QsdGK0LXQutGCXHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDk7IGorKyl7XHJcbiAgICAgIG1hdHJpeC5wdXNoKCBuZXcgUmVjdChDLlBETkcraiooNTArQy5QRE5HKSwgNzErQy5QRE5HK2kqKDUwK0MuUERORyksIDUwLCA1MCwgXCJyZ2JhKDAsMCwwLDAuNSlcIiwgdHJ1ZSkgKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gbWF0cml4XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNZW51KHR4dEFyciwgbmFtZUFycil7ICAvL9GB0L7Qt9C00LDQtdC8INCz0LvQsNCy0L3QvtC1INC80LXQvdGOXHJcbiAgdmFyIG1lbnUgPSBbXTtcclxuICB2YXIgbmFtZXMgPSBuYW1lQXJyO1xyXG4gIHZhciB0eHQgPSB0eHRBcnI7XHJcbiAgdmFyIGFtb3VudHMgPSB0eHRBcnIubGVuZ3RoO1xyXG4gIFxyXG4gIHZhciBfZm9udHNpemUgPSBcIjI4XCI7XHJcbiAgdmFyIF94ID0gQy5XSURUSC8yLTMwMC8yO1xyXG4gIHZhciBfeSA9IChDLkhFSUdIVC8yKSAtICg4NSphbW91bnRzLzIpICsgODU7IFxyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFtb3VudHM7IGkrKyl7XHJcbiAgICBtZW51LnB1c2goIG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMF0sIHJlcy5hcnJJbWFnZXNbMjFdLCBfeCwgX3kraSo4NSwgMzAwLCA2MCwgdHh0W2ldLCBuYW1lc1tpXSwgX2ZvbnRzaXplLCA4MyApICk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1lbnU7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXaW5Qb3BVcCgpeyAgICAgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INC/0L7QsdC10LTQvdGD0Y4g0LLRgdC/0LvQu9GL0LLQsNGI0LrRg1xyXG5cclxuICB2YXIgd2luUG9wQkcgICAgICA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxNl0sIEMuV0lEVEgvMi0zMjAvMiwgQy5IRUlHSFQvMi0yMDAvMiwgMzIwLCAyMDApO1xyXG4gIHZhciBiUG9wRXhpdCAgICAgID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMl0sIHJlcy5hcnJJbWFnZXNbMjZdLCB3aW5Qb3BCRy54KzMwLCAgd2luUG9wQkcueSt3aW5Qb3BCRy5oLTUwLCA4MCwgNjUsIFwiXCIsIFwicG9wX2V4aXRcIiwgMCApO1xyXG4gIHZhciBiUG9wTmV4dCAgICAgID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxNV0sIHJlcy5hcnJJbWFnZXNbMjldLCB3aW5Qb3BCRy54KzMwKzExMCs4MCwgIHdpblBvcEJHLnkrd2luUG9wQkcuaC01MCwgODAsIDY1LCBcIlwiLCBcInBvcF9uZXh0XCIsIDAgKTtcclxuICB2YXIgd2luVGV4dCAgICAgICA9IG5ldyBCdXR0b24oIEMuV0lEVEgvMi05MC8yLCB3aW5Qb3BCRy55KzE1LCA5MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQo9GA0L7QstC10L3RjCBOXCIsIFwid2luX3RleHRcIiwgMzAsIFwiQnVjY2FuZWVyXCIgKTtcclxuICB2YXIgd2luVGV4dF8yICAgICA9IG5ldyBCdXR0b24oIEMuV0lEVEgvMi05MC8yKzEwLCB3aW5Qb3BCRy55KzgwLCA5MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQn9Cg0J7QmdCU0JXQnSFcIiwgXCJ3aW5fdGV4dF8yXCIsIDUwLCBcImFaWl9UcmlidXRlX0JvbGRcIiApO1xyXG5cclxuICB3aW5UZXh0LnR4dENvbG9yID0gXCIjRDlDNDI1XCI7XHJcblxyXG4gIHZhciB3aW5Qb3BVcCA9IFtdO1xyXG4gIHdpblBvcFVwLnB1c2god2luUG9wQkcsIGJQb3BFeGl0LCBiUG9wTmV4dCwgd2luVGV4dCwgd2luVGV4dF8yKTtcclxuXHJcbiAgcmV0dXJuIHdpblBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGF1c2VQb3BVcCgpeyAgICAgICAgICAgLy/RgdC+0LfQtNCw0LXQvCDQv9Cw0YPQtyDQstGB0L/Qu9GL0LLQsNGI0LrRg1xyXG5cclxuICB2YXIgcGF1c2VQb3BVcCA9IFtdO1xyXG4gIHZhciBiZ1BhdXNlICAgICAgICAgID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzEzXSwgQy5XSURUSC8yLTMwMC8yLCBDLkhFSUdIVC8yLTIwNy8yLCAzMDAsIDIwNyk7XHJcbiAgdmFyIGJSZXR1cm4gICAgICAgICAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzEwXSwgcmVzLmFyckltYWdlc1syNF0sIGJnUGF1c2UueCsxOTAsICBiZ1BhdXNlLnktMjUsIDYzLCA1NywgXCJcIiwgXCJyZXR1cm5cIiwgMCApO1xyXG4gIHZhciBiRXhpdFRvTWVudSAgICAgID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMl0sIHJlcy5hcnJJbWFnZXNbMjZdLCBiZ1BhdXNlLngrNTAsICBiZ1BhdXNlLnkrYmdQYXVzZS5oLTUwLCA4NSwgNzAsIFwiXCIsIFwiZXhpdFwiLCAwICk7XHJcbiAgdmFyIGJSZXN0YXJ0ICAgICAgICAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzExXSwgcmVzLmFyckltYWdlc1syNV0sIGJnUGF1c2UueCs1MCszMCs4NSwgIGJnUGF1c2UueStiZ1BhdXNlLmgtNTAsIDg1LCA3MCwgXCJcIiwgXCJyZXN0YXJ0XCIsIDAgKTtcclxuICB2YXIgcGF1c2VUZXh0ICAgICAgICA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxNF0sIGJnUGF1c2UueCArIGJnUGF1c2Uudy8yIC0gMTUwLzIsIGJnUGF1c2UueSArIGJnUGF1c2UuaC8yIC0gMTAwLzIsIDE1MCwgMTAwKTtcclxuXHJcbiAgcGF1c2VQb3BVcC5wdXNoKGJnUGF1c2UsIGJSZXR1cm4sIGJFeGl0VG9NZW51LCBiUmVzdGFydCwgcGF1c2VUZXh0KTtcclxuXHJcbiAgcmV0dXJuIHBhdXNlUG9wVXA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVMZXZlbHNCdXR0b25zKGxldmVsc19jb3VudCl7IC8v0YHQvtC30LTQsNC10Lwg0LrQvdC+0L/QutC4INCyINCy0YvQsdC+0YDQtSDRg9GA0L7QstC90Y9cclxuXHJcbiAgdmFyIGJMZXZlbHNCdXR0b25zID0gW107XHJcbiAgdmFyIGogPSAwLCBkeSA9IDg1LCBkeCA9IDA7XHJcblxyXG4gIGZvciAoIGk9MDsgaSA8IGxldmVsc19jb3VudDsgaSsrKXtcclxuICAgIGR4ID0gOCtqKigxMDArMTUpO1xyXG5cclxuICAgIGJMZXZlbHNCdXR0b25zLnB1c2goIG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTddLCByZXMuYXJySW1hZ2VzWzI3XSwgZHgsIGR5LCAxMDAsIDEwMCwgaSsxLCBcImxldmVsX1wiKyhpKzEpLCAzNSApICk7XHJcblxyXG4gICAgaisrO1xyXG5cclxuICAgIGlmICggZHggPiBDLldJRFRILTExNSApe1xyXG4gICAgICBkeSArPSAoMTI1KTtcclxuICAgICAgaiA9IDA7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBiTGV2ZWxzQnV0dG9ucztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUxldmVsc0Zvb3RlcigpeyAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0YTRg9GC0LXRgCDQsiDQstGL0LHQvtGA0LUg0YPRgNC+0LLQvdGPXHJcblxyXG4gIHZhciBsZXZlbHNGb290ZXIgPSBbXTtcclxuXHJcbiAgdmFyIGJQcmV2ICAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE5XSwgZmFsc2UsICAgICAgICAgICAgIDIwLCAgICAgICAgICAgICAgICBDLkhFSUdIVC0xMC02NywgNDAsICA2NywgXCJcIiwgICAgICAgICAgICAgICAgIFwicHJldlwiLCAgICAwICk7XHJcbiAgdmFyIGJOZXh0ICAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE4XSwgZmFsc2UsICAgICAgICAgICAgIEMuV0lEVEgtMjAtNDAsICAgICBDLkhFSUdIVC0xMC02NywgNDAsICA2NywgXCJcIiwgICAgICAgICAgICAgICAgIFwibmV4dFwiLCAgICAwICk7XHJcbiAgdmFyIGJUb01lbnUgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzIwXSwgcmVzLmFyckltYWdlc1syOF0sIEMuV0lEVEgvMiAtIDMyMC8yLCBDLkhFSUdIVC0xMC02NywgMzIwLCA2NywgXCLQktC10YDQvdGD0YLRjNGB0Y8g0LIg0LzQtdC90Y5cIiwgXCJ0b19tZW51XCIsIDI1ICk7XHJcbiAgYlRvTWVudS50eHRDb2xvciA9IFwiIzAwMDA0NlwiO1xyXG5cclxuICBsZXZlbHNGb290ZXIucHVzaChiUHJldixiTmV4dCxiVG9NZW51KTtcclxuXHJcbiAgcmV0dXJuIGxldmVsc0Zvb3RlcjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVBsYXllcigpeyAgICAgICAgICAgICAgIC8v0YHQvtC30LTQsNC10Lwg0LjQs9GA0L7QutCwINGBINGD0L3QuNC60LDQu9GM0L3Ri9C80Lgg0LzQtdGC0L7QtNCw0LzQuFxyXG5cclxuICB2YXIgcGxheWVyID0gbmV3IFBsYXlhYmxlKHJlcy5hcnJJbWFnZXNbOV0sMCwwLDUwLDUwKTtcclxuICBwbGF5ZXIuZGlyZWN0aW9uID0gZmFsc2U7XHJcbiAgcGxheWVyLmlzTW92ZSAgICA9IGZhbHNlO1xyXG5cclxuICBwbGF5ZXIuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgaWYodGhpcy5pc01vdmUpe1xyXG4gICAgICB0aGlzLmRyYXdBbmltYXRpb24oMywgMiwgdGhpcy5kaXJlY3Rpb24pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuZHJhd0ZyYW1lKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5kcmF3QW5pbWF0aW9uID0gZnVuY3Rpb24oZnJhbWVzLCBkZWxheSwgYW5nbGUpe1xyXG5cclxuICAgIHRoaXMuaW1nLmNhbkRyYXcgPSAoIHRoaXMuaW1nLmNhbkRyYXcgPT09IHVuZGVmaW5lZCApID8gMSA6IHRoaXMuaW1nLmNhbkRyYXc7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgdmFyIF9keCA9IHRoaXMueCtDLlBETkcgKyB0aGlzLncgLyAyO1xyXG4gICAgICB2YXIgX2R5ID0gdGhpcy55KzcxK0MuUERORyArIHRoaXMuaCAvIDI7XHJcbiAgICAgIGFuZ2xlID0gYW5nbGUgKiAoTWF0aC5QSS8xODApO1xyXG4gICAgICBjbnZzLmN0eC5zYXZlKCk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZShfZHgsX2R5KTtcclxuICAgICAgY252cy5jdHgucm90YXRlKGFuZ2xlKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKC1fZHgsLV9keSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0aGlzLmltZy5jYW5EcmF3ID09IDEpe1xyXG4gICAgICBpZiAodGhpcy5pbWcuY291bnQgPT0gZnJhbWVzKSB0aGlzLmltZy5jb3VudCA9IDE7XHJcblxyXG4gICAgICB0aGlzLmltZy5jYW5EcmF3ID0gMDtcclxuICAgICAgdGhpcy5pbWcuY291bnQgPSB0aGlzLmltZy5jb3VudCArIDEgfHwgMTtcclxuXHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICBwbGF5ZXIuaW1nLmNhbkRyYXcgPSAxO1xyXG4gICAgICB9LCAxMDAwLyhkZWxheSoyKSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY252cy5jdHguZHJhd0ltYWdlKHRoaXMuaW1nLCA1MCoodGhpcy5pbWcuY291bnQtMSksIDAsIHRoaXMudywgdGhpcy5oLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKC1DLlBETkcsIC0oNzErQy5QRE5HKSk7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgY252cy5jdHgucmVzdG9yZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuZHJhd0ZyYW1lID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICB2YXIgYW5nbGUgPSB0aGlzLmRpcmVjdGlvbiB8fCAwO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIHZhciBfZHggPSB0aGlzLngrQy5QRE5HICsgdGhpcy53IC8gMjtcclxuICAgICAgdmFyIF9keSA9IHRoaXMueSs3MStDLlBETkcgKyB0aGlzLmggLyAyO1xyXG4gICAgICBhbmdsZSA9IGFuZ2xlICogKE1hdGguUEkvMTgwKTtcclxuICAgICAgY252cy5jdHguc2F2ZSgpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoX2R4LF9keSk7XHJcbiAgICAgIGNudnMuY3R4LnJvdGF0ZShhbmdsZSk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtX2R4LC1fZHkpO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY252cy5jdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLncsIHRoaXMuaCwgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtQy5QRE5HLCAtKDcxK0MuUERORykpO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIGNudnMuY3R4LnJlc3RvcmUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLnNldERpcmVjdGlvbiA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcclxuICB9O1xyXG5cclxuICByZXR1cm4gcGxheWVyO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlT3B0aW9uc0J1dCgpeyAgICAgICAgICAgLy9j0L7Qt9C00LDQtdC8INGH0LXQutCx0L7QutGB0Ysg0LIg0L3QsNGB0YLRgNC+0LnQutCw0YVcclxuXHJcbiAgdmFyIGFyck9wdCA9IFtdO1xyXG4gIHZhciBidXR0b25zID0gW1wi0JzRg9C30YvQutCwINCyINC80LXQvdGOXCIsIFwi0JzRg9C30YvQutCwINCyINC40LPRgNC1XCIsIFwi0JfQstGD0LrQuCDQsiDQuNCz0YDQtVwiXTtcclxuICB2YXIgaWRCdXR0b25zID0gW1wiYk1lbnVNdXNpY1wiLCBcImJHYW1lTXVzaWNcIiwgXCJiU2Z4TXVzaWNcIl07XHJcblxyXG4gIGZvciAodmFyIGk9MDsgaTxidXR0b25zLmxlbmd0aDsgaSsrKXtcclxuICAgIGFyck9wdC5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzMxXSwgZmFsc2UsIEMuV0lEVEgvMiAtIDE1MCwgMTYwKyhpKjcwKSwgNDUsIDQ1LCBidXR0b25zW2ldLCBpZEJ1dHRvbnNbaV0sIDI1LCAxLCAxLCA2NSApICk7XHJcbiAgICBhcnJPcHRbaV0uZkZhbSA9IFwiQnVjY2FuZWVyXCI7XHJcbiAgICBhcnJPcHRbaV0uY2hlY2tlZCA9IGZhbHNlO1xyXG4gICAgYXJyT3B0W2ldLmNoZWNrID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgIGlmICggIXRoaXMuY2hlY2tlZCApIHtcclxuICAgICAgICBfaW1nID0gdGhpcy5pbWc7XHJcbiAgICAgICAgdGhpcy5pbWcgPSByZXMuYXJySW1hZ2VzWzMwXTtcclxuICAgICAgICB0aGlzLmNoZWNrZWQgPSAhdGhpcy5jaGVja2VkO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaW1nID0gX2ltZztcclxuICAgICAgICB0aGlzLmNoZWNrZWQgPSAhdGhpcy5jaGVja2VkO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICB2YXIgYlRvTWVudSA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMjBdLCByZXMuYXJySW1hZ2VzWzI4XSwgQy5XSURUSC8yIC0gNDAwLzIsIEMuSEVJR0hULTEwLTY3LCA0MDAsIDY3LCBcItCS0LXRgNC90YPRgtGM0YHRjyDQsiDQvNC10L3RjlwiLCBcInRvX21lbnVcIiwgMjUgKTtcclxuICBiVG9NZW51LnR4dENvbG9yID0gXCIjMDAwMDQ2XCI7XHJcblxyXG4gIGFyck9wdC5wdXNoKCBiVG9NZW51ICk7XHJcblxyXG5cclxuICByZXR1cm4gYXJyT3B0O1xyXG59O1xyXG5cclxuXHJcbi8vbWVudVxyXG52YXIgbG9nbyA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMV0sIGZhbHNlLCBDLldJRFRILzItNDUwLzIsIDIwLCA0NTAsIDE1MCwgXCJcIiwgXCJsb2dvXCIsIDAgKTtcclxudmFyIG1lbnUgPSBjcmVhdGVNZW51KFtcItCY0LPRgNCw0YLRjFwiLCBcItCj0YDQvtCy0L3QuFwiLCBcItCd0LDRgdGC0YDQvtC50LrQuFwiXSxbXCJwbGF5XCIsIFwiY2hhbmdlX2xldmVsXCIsIFwib3B0aW9uc1wiXSk7XHJcblxyXG5cclxuLy9iYWNrZ3JvdW5kIFxyXG52YXIgbWF0cml4ICAgID0gY3JlYXRlTWF0cml4QkcoKTsgICAgICAgICAvL2JnINGD0YDQvtCy0L3Rj1xyXG52YXIgYmdMZXZlbCAgID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzhdLCAwLCAwLCBDLldJRFRILCBDLkhFSUdIVCApO1xyXG52YXIgYmdPcGFjaXR5ID0gbmV3IFJlY3QoMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIFwicmdiYSgwLCAwLCAwLCAwLjUpXCIpO1xyXG5cclxuXHJcbi8vZ2FtZSBoZWFkZXJcclxudmFyIGhlYWRlciAgICA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1syXSwgMCwgMCwgQy5XSURUSCwgNzErQy5QRE5HICk7XHJcbnZhciBiRnVsbFNjciAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzNdLCByZXMuYXJySW1hZ2VzWzIyXSwgQy5XSURUSC00NS0yMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQ1LzIsIDQ1LCA0NSwgXCJcIiwgXCJmdWxsU2NyXCIsIDAgKTtcclxudmFyIHN0b3BXYXRjaCA9IG5ldyBCdXR0b24oIDEwLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTIwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcIjAwIDogMDAgOiAwMFwiLCBcInN0b3B3YXRjaFwiLCAyNSwgXCJkaXRlZFwiICk7XHJcbnZhciBiUGF1c2UgICAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzRdLCByZXMuYXJySW1hZ2VzWzIzXSwgQy5XSURUSC00NS03LWJGdWxsU2NyLnctMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwicGF1c2VcIiwgMCApO1xyXG52YXIgY3VyckxldmVsID0gbmV3IEJ1dHRvbiggKHN0b3BXYXRjaC54K3N0b3BXYXRjaC53K2JQYXVzZS54KS8yLTE0MC8yLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTQwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMXCIsIFwiY3Vycl9sZXZlbFwiLCAyNSwgXCJjYXB0dXJlX2l0XCIgKTtcclxuXHJcblxyXG4vL2NoYW5nZSBsZXZlbFxyXG52YXIgbGV2ZWxzSGVhZGVyICAgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzJdLCBmYWxzZSwgMCwgMCwgQy5XSURUSCwgNzErQy5QRE5HLCBcItCS0YvQsdC+0YAg0YPRgNC+0LLQvdGPXCIsIFwibGV2ZWxzX2hlYWRlclwiLCAyNSApO1xyXG52YXIgbGV2ZWxzRm9vdGVyICAgPSBjcmVhdGVMZXZlbHNGb290ZXIoKTtcclxudmFyIGJMZXZlbHNCdXR0b25zID0gY3JlYXRlTGV2ZWxzQnV0dG9ucyg1KTtcclxuXHJcblxyXG4vL29wdGlvbnNcclxudmFyIG9wdGlvbnNIZWFkZXIgID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1syXSwgZmFsc2UsIDAsIDAsIEMuV0lEVEgsIDcxK0MuUERORywgXCLQndCw0YHRgtGA0L7QudC60LhcIiwgXCJvcHRpb25zX2hlYWRlclwiLCAyNSApO1xyXG52YXIgb3B0aW9uc011c2ljICAgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItMTQwLzIsIDkwLCAxNDAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0JzRg9C30YvQutCwXCIsIFwibXVzaWNcIiwgMjUsIFwiY2FwdHVyZV9pdFwiICk7XHJcbnZhciBiT3B0aW9ucyAgICAgICA9IGNyZWF0ZU9wdGlvbnNCdXQoKTtcclxuXHJcbi8vd2luIHBvcC11cFxyXG52YXIgd2luUG9wVXAgICA9IGNyZWF0ZVdpblBvcFVwKCk7XHJcblxyXG5cclxuLy9wYXVzZSBwb3AtdXBcclxudmFyIHBhdXNlUG9wVXAgPSBjcmVhdGVQYXVzZVBvcFVwKCk7XHJcblxyXG5cclxuLy9wbGF5YWJsZSBvYmpcclxudmFyIHBsICAgID0gY3JlYXRlUGxheWVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/Qv9C10YDRgdC+0L3QsNC2XHJcbnZhciBib3ggICA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzZdLDAsMCw1MCw1MCk7IC8v0LHQvtC60YFcclxudmFyIGRvb3IgID0gbmV3IFBsYXlhYmxlKHJlcy5hcnJJbWFnZXNbN10sMCwwLDUwLDUwKTsgLy/QtNCy0LXRgNGMXHJcbnZhciB3YWxscyA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v0YHRgtC10L3RiyDQvdCwINGD0YDQvtCy0L3QtSwg0LfQsNC/0L7Qu9C90Y/QtdGC0YHRjyDQstGL0LHRgNCw0L3QvdGL0Lwg0YPRgNC+0LLQvdC10LwuXHJcblxyXG5cclxuLy92aWRlb1xyXG52YXIgYW5pbWF0ZUJnICAgICA9IG5ldyBWaWRlbygwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgcmVzLmFyclZpZGVvc1swXSk7XHJcbnZhciB2aWRlb0JnTGV2ZWxzID0gbmV3IFZpZGVvKDAsIDAsIEMuV0lEVEgsIEMuSEVJR0hULCByZXMuYXJyVmlkZW9zWzFdKTtcclxuXHJcblxyXG4vL2F1ZGlvXHJcbnZhciBhdWRpbyA9IHtcclxuXHJcbiAgYnV0dG9uICAgOiBuZXcgQXVkaW8ocmVzLmFyckF1ZGlvWzBdLCAwLjUpLFxyXG4gIHdpbiAgICAgIDogbmV3IEF1ZGlvKHJlcy5hcnJBdWRpb1sxXSwgMC41KSxcclxuICBwbGF5ZXIgICA6IG5ldyBBdWRpbyhyZXMuYXJyQXVkaW9bMl0sIDAuMjUpLFxyXG4gIGNyeXN0YWwgIDogbmV3IEF1ZGlvKHJlcy5hcnJBdWRpb1szXSwgMC4yNSksXHJcbiAgYmdJbkdhbWUgOiBuZXcgQXVkaW8ocmVzLmFyckF1ZGlvWzRdLCAwLjUpLFxyXG4gIGJnSW5NZW51IDogbmV3IEF1ZGlvKHJlcy5hcnJBdWRpb1s1XSwgMC41KSxcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdHMgPSB7XHJcblxyXG4gIG1hdHJpeCAgICAgICAgIDogbWF0cml4LFxyXG4gIGxvZ28gICAgICAgICAgIDogbG9nbyxcclxuICBtZW51ICAgICAgICAgICA6IG1lbnUsXHJcbiAgaGVhZGVyICAgICAgICAgOiBoZWFkZXIsXHJcbiAgc3RvcFdhdGNoICAgICAgOiBzdG9wV2F0Y2gsXHJcbiAgYlBhdXNlICAgICAgICAgOiBiUGF1c2UsXHJcbiAgYkZ1bGxTY3IgICAgICAgOiBiRnVsbFNjcixcclxuICBwbCAgICAgICAgICAgICA6IHBsLFxyXG4gIGJveCAgICAgICAgICAgIDogYm94LFxyXG4gIGRvb3IgICAgICAgICAgIDogZG9vcixcclxuICB3YWxscyAgICAgICAgICA6IHdhbGxzLFxyXG4gIGJnTGV2ZWwgICAgICAgIDogYmdMZXZlbCxcclxuICB3aW5Qb3BVcCAgICAgICA6IHdpblBvcFVwLFxyXG4gIHBhdXNlUG9wVXAgICAgIDogcGF1c2VQb3BVcCxcclxuICBiZ09wYWNpdHkgICAgICA6IGJnT3BhY2l0eSxcclxuICBjdXJyTGV2ZWwgICAgICA6IGN1cnJMZXZlbCxcclxuICBsZXZlbHNIZWFkZXIgICA6IGxldmVsc0hlYWRlcixcclxuICBiTGV2ZWxzQnV0dG9ucyA6IGJMZXZlbHNCdXR0b25zLFxyXG4gIGxldmVsc0Zvb3RlciAgIDogbGV2ZWxzRm9vdGVyLFxyXG4gIGFuaW1hdGVCZyAgICAgIDogYW5pbWF0ZUJnLFxyXG4gIHZpZGVvQmdMZXZlbHMgIDogdmlkZW9CZ0xldmVscyxcclxuICBhdWRpbyAgICAgICAgICA6IGF1ZGlvLFxyXG4gIG9wdGlvbnNIZWFkZXIgIDogb3B0aW9uc0hlYWRlcixcclxuICBvcHRpb25zTXVzaWMgICA6IG9wdGlvbnNNdXNpYyxcclxuICBiT3B0aW9ucyAgICAgICA6IGJPcHRpb25zXHJcblxyXG59O1xyXG4iLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHRcclxudmFyIGNvdW50ICAgID0gNzU7XHJcbnZhciByb3RhdGlvbiA9IDI3MCooTWF0aC5QSS8xODApO1x0XHRcclxudmFyIHNwZWVkICAgID0gNjtcclxuXHRcclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG4gIFxyXG4gXHR1cGRhdGVMb2FkZXIgOiBmdW5jdGlvbigpe1xyXG4gXHRcdGNhbnZhcy5jdHguc2F2ZSgpO1xyXG4gXHRcdGNhbnZhcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XHJcbiBcdFx0Y2FudmFzLmN0eC5maWxsU3R5bGUgPSAncmdiYSgyNTUsMjU1LDI1NSwuMDM1KSc7XHJcbiBcdFx0Y2FudmFzLmN0eC5maWxsUmVjdCgwLDAsNTAwLDUwMCk7XHJcbiBcdFx0cm90YXRpb24gKz0gc3BlZWQvMTAwO1xyXG4gXHRcdGNhbnZhcy5jdHgucmVzdG9yZSgpO1x0XHRcdFx0XHRcdFx0XHRcdFxyXG4gXHR9LFxyXG5cclxuIFx0ZHJhd0xvYWRlciA6IGZ1bmN0aW9uKCl7XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRjYW52YXMuY3R4LnNhdmUoKTtcclxuIFx0XHRjYW52YXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XHJcbiBcdFx0Y2FudmFzLmN0eC50cmFuc2xhdGUoQy5XSURUSC8yLCBDLkhFSUdIVC8yKTtcclxuIFx0XHRjYW52YXMuY3R4LmxpbmVXaWR0aCA9IDAuMjU7XHJcblx0XHRjYW52YXMuY3R4LnN0cm9rZVN0eWxlID0gJ3JnYmEoMjU1LDI1NSwyNTUsMS4wKSc7XHJcbiBcdFx0Y2FudmFzLmN0eC5yb3RhdGUocm90YXRpb24pO1x0XHJcbiBcdFx0dmFyIGkgPSBjb3VudDtcclxuIFx0XHR3aGlsZShpLS0pe1x0XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRcdGNhbnZhcy5jdHguYmVnaW5QYXRoKCk7XHJcbiBcdFx0XHRjYW52YXMuY3R4LmFyYygwLCAwLCBpKyhNYXRoLnJhbmRvbSgpKjM1KSwgTWF0aC5yYW5kb20oKSwgTWF0aC5QSS8zKyhNYXRoLnJhbmRvbSgpLzEyKSwgZmFsc2UpO1x0XHRcdFx0XHRcdFx0XHRcclxuIFx0XHRcdGNhbnZhcy5jdHguc3Ryb2tlKCk7XHJcbiBcdFx0fVx0XHJcbiBcdFx0Y2FudmFzLmN0eC5yZXN0b3JlKCk7XHJcblxyXG4gXHRcdGNhbnZhcy5jdHguc2F2ZSgpO1xyXG4gXHRcdGNhbnZhcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW92ZXInO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsMSknO1xyXG4gXHRcdGNhbnZhcy5jdHguZmlsbFJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1x0XHJcbiBcdFx0Y2FudmFzLmN0eC5yZXN0b3JlKCk7XHRcdFx0XHRcdFx0XHRcdFx0XHRcclxuIFx0fSxcclxuXHJcbiBcdGRyYXdMb2FkVGV4dCA6IGZ1bmN0aW9uKCl7XHJcbiBcdFx0dmFyIHdpblRleHQgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItMjUwLzIsIDI1LCAyNTAsIDQwLCBcImJsYWNrXCIsIFwi0JjQtNC10YIg0LfQsNCz0YDRg9C30LrQsC4uXCIsIFwibG9hZC10ZXh0XCIsIDMwLCBcIkJ1Y2NhbmVlclwiICk7XHJcbiAgXHRcdHJldHVybiB3aW5UZXh0LmRyYXcoKTtcclxuIFx0fVxyXG59OyBcclxuXHJcbiAgIiwidmFyIHJlc291cnNlcyA9IHtcclxuICBpbWFnZXMgOiBmYWxzZSxcclxuICB2aWRlbyAgOiBmYWxzZSxcclxuICBhdWRpbyAgOiBmYWxzZSxcclxuXHJcbiAgYXJlTG9hZGVkIDogZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB0aGlzLnZpZGVvICYmIHRoaXMuaW1hZ2VzICYmIHRoaXMuYXVkaW9cclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlkZW8oYXJyU3Jjc09mVmlkZW8pe1xyXG5cclxuICB2YXIgYXJyVmlkZW9zID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZlZpZGVvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgIHZpZGVvLnNyYyA9IGFyclNyY3NPZlZpZGVvW2ldO1xyXG4gICAgdmlkZW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGxvYWRDb3VudCsrO1xyXG4gICAgICB2aWRlby5sb29wID0gdHJ1ZTtcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMudmlkZW8gPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBhcnJWaWRlb3MucHVzaCh2aWRlbyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJWaWRlb3M7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2VzKGFyclNyY3NPZkltYWdlcyl7XHJcblxyXG4gIHZhciBhcnJJbWFnZXMgPSBbXTsgXHJcbiAgdmFyIGNvdW50ID0gYXJyU3Jjc09mSW1hZ2VzLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgaW1nLnNyYyA9IGFyclNyY3NPZkltYWdlc1tpXTtcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICBsb2FkQ291bnQrKztcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMuaW1hZ2VzID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGFyckltYWdlcy5wdXNoKGltZyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJJbWFnZXM7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkQXVkaW8oYXJyU3Jjc09mQXVkaW8pe1xyXG5cclxuICB2YXIgYXJyQXVkaW8gPSBbXTsgXHJcbiAgdmFyIGNvdW50ID0gYXJyU3Jjc09mQXVkaW8ubGVuZ3RoO1xyXG4gIHZhciBsb2FkQ291bnQgPSAwO1xyXG5cclxuICBmb3IodmFyIGk9MDsgaTxjb3VudDsgaSsrKXtcclxuXHJcbiAgICB2YXIgYXVkaW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xyXG4gICAgYXVkaW8uc3JjID0gYXJyU3Jjc09mQXVkaW9baV07XHJcbiAgICBhdWRpby5vbmNhbnBsYXl0aHJvdWdoID0gZnVuY3Rpb24oKXtcclxuICAgICAgbG9hZENvdW50Kys7XHJcbiAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLmF1ZGlvID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGFyckF1ZGlvLnB1c2goYXVkaW8pO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXJyQXVkaW87XHJcbn07XHJcblxyXG52YXIgYXJyQXVkaW8gPSBsb2FkQXVkaW8oW1xyXG4gIFwiYXVkaW8vYnV0dG9uLWNsaWNrLm1wM1wiLFxyXG4gIFwiYXVkaW8vd2luLWF1ZGlvLm1wM1wiLFxyXG4gIFwiYXVkaW8vcGxheWVyLW1vdmUubXAzXCIsXHJcbiAgXCJhdWRpby9jcnlzdGFsLW1vdmUubXAzXCIsXHJcbiAgXCJhdWRpby9iZy1pbkdhbWUubXAzXCIsXHJcbiAgXCJhdWRpby9iZy1pbk1lbnUubXAzXCJcclxuXSk7XHJcblxyXG52YXIgYXJyVmlkZW9zID0gbG9hZFZpZGVvKFtcclxuICBcInZpZGVvL2JnLm1wNFwiLFxyXG4gIFwidmlkZW8vTGlnaHRtaXJyb3IubXA0XCJcclxuXSk7XHJcblxyXG52YXIgYXJySW1hZ2VzID0gbG9hZEltYWdlcyhbXHJcbiAgXCJpbWcvbWVudV9fYnV0dG9uLW1lbnUuc3ZnXCIsICAgICAgICAgICAgICAgIC8vMCBcclxuICBcImltZy9tZW51X19sb2dvLnBuZ1wiLCAgICAgICAgICAgICAgICAgICAgICAgLy8xXHJcblxyXG4gIFwiaW1nL2dhbWVfX2JnLWhlYWRlci5zdmdcIiwgICAgICAgICAgICAgICAgICAvLzIgXHJcbiAgXCJpbWcvZ2FtZV9fYnV0dG9uLWZ1bGxzY3JlZW4uc3ZnXCIsICAgICAgICAgIC8vMyBcclxuICBcImltZy9nYW1lX19idXR0b24tcGF1c2Uuc3ZnXCIsICAgICAgICAgICAgICAgLy80IFxyXG4gIFwiaW1nL2dhbWVfX3dhbGwuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgICAvLzUgXHJcbiAgXCJpbWcvZ2FtZV9fY3J5c3RhbGwuc3ZnXCIsICAgICAgICAgICAgICAgICAgIC8vNiBcclxuICBcImltZy9nYW1lX19wb3J0YWwuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgLy83IFxyXG4gIFwiaW1nL2dhbWVfX2dyb3VuZC5qcGdcIiwgICAgICAgICAgICAgICAgICAgICAvLzggXHJcbiAgJ2ltZy9nYW1lX19wbGF5ZXIucG5nJywgICAgICAgICAgICAgICAgICAgICAvLzkgXHJcblxyXG4gIFwiaW1nL3BhdXNlX19idXR0b24tY2xvc2Uuc3ZnXCIsICAgICAgICAgICAgICAvLzEwXHJcbiAgXCJpbWcvcGF1c2VfX2J1dHRvbi1yZXN0YXJ0LnN2Z1wiLCAgICAgICAgICAgIC8vMTFcclxuICBcImltZy9wYXVzZV9fYnV0dG9uLXRvTWVudS5zdmdcIiwgICAgICAgICAgICAgLy8xMlxyXG4gIFwiaW1nL3BhdXNlX19iZy5zdmdcIiwgICAgICAgICAgICAgICAgICAgICAgICAvLzEzXHJcbiAgXCJpbWcvcGF1c2VfX3RleHQuc3ZnXCIsICAgICAgICAgICAgICAgICAgICAgIC8vMTRcclxuXHJcbiAgXCJpbWcvd2luX19idXR0b24tbmV4dC5zdmdcIiwgICAgICAgICAgICAgICAgIC8vMTVcclxuICBcImltZy93aW5fX2JnLnN2Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8xNlxyXG5cclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi1sZXZlbHMuc3ZnXCIsICAgICAgICAgICAgLy8xN1xyXG4gIFwiaW1nL2xldmVsc19fYnV0dG9uLW5leHQuc3ZnXCIsICAgICAgICAgICAgICAvLzE4XHJcbiAgXCJpbWcvbGV2ZWxzX19idXR0b24tcHJldi5zdmdcIiwgICAgICAgICAgICAgIC8vMTlcclxuICBcImltZy9sZXZlbHNfX2J1dHRvbi10b01lbnUuc3ZnXCIsICAgICAgICAgICAgLy8yMFxyXG5cclxuICBcImltZy9ob3ZlcnMvbWVudV9fYnV0dG9uLW1lbnVfaG92ZXIuc3ZnXCIsICAgICAgIC8vMjFcclxuICBcImltZy9ob3ZlcnMvZ2FtZV9fYnV0dG9uLWZ1bGxzY3JlZW5faG92ZXIuc3ZnXCIsIC8vMjJcclxuICBcImltZy9ob3ZlcnMvZ2FtZV9fYnV0dG9uLXBhdXNlX2hvdmVyLnN2Z1wiLCAgICAgIC8vMjNcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi1jbG9zZV9ob3Zlci5zdmdcIiwgICAgIC8vMjRcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi1yZXN0YXJ0X2hvdmVyLnN2Z1wiLCAgIC8vMjVcclxuICBcImltZy9ob3ZlcnMvcGF1c2VfX2J1dHRvbi10b01lbnVfaG92ZXIuc3ZnXCIsICAgIC8vMjZcclxuICBcImltZy9ob3ZlcnMvbGV2ZWxzX19idXR0b24tbGV2ZWxzX2hvdmVyLnN2Z1wiLCAgIC8vMjdcclxuICBcImltZy9ob3ZlcnMvbGV2ZWxzX19idXR0b24tdG9NZW51X2hvdmVyLnN2Z1wiLCAgIC8vMjhcclxuICBcImltZy9ob3ZlcnMvd2luX19idXR0b24tbmV4dF9ob3Zlci5zdmdcIiwgICAgICAgIC8vMjlcclxuXHJcbiAgXCJpbWcvb3B0aW9uc19fdW5jaGVja193aGl0ZS5zdmdcIiwgICAgICAgICAgIC8vMzBcclxuICBcImltZy9vcHRpb25zX19jaGVja193aGl0ZS5zdmdcIiAgICAgICAgICAgICAgLy8zMVxyXG5dKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcbiAgcmVzb3Vyc2VzIDogcmVzb3Vyc2VzLFxyXG5cclxuICBhcnJWaWRlb3MgOiBhcnJWaWRlb3MsXHJcblxyXG4gIGFyckltYWdlcyA6IGFyckltYWdlcyxcclxuXHJcbiAgYXJyQXVkaW8gIDogYXJyQXVkaW9cclxuXHJcbn07XHJcblxyXG5cclxuIiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBnYW1lID0gcmVxdWlyZSgnLi9fZ2FtZUxvb3BzLmpzJyk7XHJcblxyXG52YXIgcGF1c2UgPSAwO1xyXG52YXIgYmVnaW5UaW1lID0gMDtcclxudmFyIGN1cnJlbnRUaW1lID0gMDtcclxudmFyIHVwVGltZVRPO1xyXG5cclxuZnVuY3Rpb24gdXBUaW1lKGNvdW50RnJvbSkge1xyXG5cdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG5cdHZhciBkaWZmZXJlbmNlID0gKG5vdy1jb3VudEZyb20gKyBjdXJyZW50VGltZSk7XHJcblxyXG5cdHZhciBob3Vycz1NYXRoLmZsb29yKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSkvKDYwKjYwKjEwMDApKjEpO1xyXG5cdHZhciBtaW5zPU1hdGguZmxvb3IoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKS8oNjAqMTAwMCkqMSk7XHJcblx0dmFyIHNlY3M9TWF0aC5mbG9vcigoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKSUoNjAqMTAwMCkpLzEwMDAqMSk7XHJcblxyXG5cdGhvdXJzID0gKCBob3VycyA8IDEwKSA/IFwiMFwiK2hvdXJzIDogaG91cnM7XHJcblx0bWlucyA9ICggbWlucyA8IDEwKSA/IFwiMFwiK21pbnMgOiBtaW5zO1xyXG5cdHNlY3MgPSAoIHNlY3MgPCAxMCkgPyBcIjBcIitzZWNzIDogc2VjcztcclxuXHJcblx0by5zdG9wV2F0Y2gudHh0ID0gaG91cnMrXCIgOiBcIittaW5zK1wiIDogXCIrc2VjcztcclxuXHJcblx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR1cFRpbWVUTz1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHVwVGltZShjb3VudEZyb20pOyB9LDEwMDAvNjApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRzdGFydCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly8gaWYgKGdhbWUuc3RhdHVzID09ICdnYW1lJyB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibWVudVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJwYXVzZVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJsZXZlbHNcIikge1xyXG5cdFx0XHR1cFRpbWUobmV3IERhdGUoKSk7XHJcblx0XHRcdHZhciBub3dUID0gbmV3IERhdGUoKTtcclxuXHRcdFx0YmVnaW5UaW1lID0gbm93VC5nZXRUaW1lKCk7XHJcblx0XHQvLyB9IGVsc2Uge1xyXG5cdFx0Ly8gXHR0aGlzLnJlc2V0KCk7XHJcblx0XHQvLyB9O1xyXG5cdH0sXHJcblxyXG5cdHJlc2V0IDogZnVuY3Rpb24oKSB7XHJcblx0XHRjdXJyZW50VGltZSA9IDA7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cclxuXHRcdG8uc3RvcFdhdGNoLnR4dCA9IFwiMDAgOiAwMCA6IDAwXCI7XHJcblx0XHQvLyB0aGlzLnN0YXJ0KCk7XHJcblx0fSxcclxuXHJcblx0cGF1c2VUaW1lciA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY3VyRGF0YSA9IG5ldyBEYXRlKCk7XHJcblx0XHRjdXJyZW50VGltZSA9IGN1ckRhdGEuZ2V0VGltZSgpIC0gYmVnaW5UaW1lICsgY3VycmVudFRpbWU7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdH1cclxuXHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBBdWRpbyA9IGZ1bmN0aW9uKGF1ZGlvLCB2b2x1bWUpeyBcclxuXHJcblx0dGhpcy5hID0gYXVkaW87XHJcblx0dGhpcy5hLnZvbHVtZSA9IHZvbHVtZSB8fCAxO1xyXG5cdHRoaXMuc3RhdGUgPSBcInN0b3BcIjtcclxuXHR0aGlzLmRpc2FibGVkID0gZmFsc2U7XHJcblxyXG5cdHZhciB0bXBWb2wgPSB2b2x1bWU7XHRcdFx0XHRcdFx0XHRcdFx0ICAgIC8v0LHRg9C00LXRgiDRhdGA0LDQvdC40YLRjCDQvdCw0YHRgtGA0L7QtdC90L3QvtC1INC30L3QsNGH0LXQvdC40Y8g0LPRgNC+0LzQutC+0YHRgtC4LCDQv9GA0Lgg0LjQt9C80LXQvdC10L3QuNC4INCz0YDQvtC80LrQvtGB0YLQuCDQsiDRhtC10LvQvtC8LCDRh9GC0L4g0LEg0LzQvtC20L3QviDQsdGL0LvQviDQstC+0YHRgdGC0LDQvdC+0LLQuNGC0Ywg0Log0L3QsNGB0YLRgNC+0LXQvdC90L7QuS5cclxuXHJcblx0dGhpcy5wbGF5ID0gZnVuY3Rpb24oZG9udFN0b3Ape1xyXG5cdFx0aWYgKCF0aGlzLmRpc2FibGVkKXtcclxuXHRcdFx0aWYgKCB0aGlzLnN0YXRlID09IFwicGxheVwiICYmIGRvbnRTdG9wICl7XHRcdFx0Ly/QtdGB0LvQuCDQtdGJ0LUg0L3QtSDQt9Cw0LrQvtC90YfQuNC70YHRjyDQv9GA0LXQtNGL0LTRg9GJ0LjQuSDRjdGC0L7RgiDQt9Cy0YPQuiwg0YLQviDRgdC+0LfQtNCw0LXQvCDQvdC+0LLRi9C5INC30LLRg9C6INC4INCy0L7RgdC/0YDQvtC40LfQstC+0LTQuNC8INC10LPQviwg0L3QtSDQvNC10YjQsNGPINCy0L7RgdC/0YDQvtC40LfQstC10LTQtdC90LjRjiDQv9GA0LXQtNGL0LTRg9GJ0LXQs9C+LlxyXG5cdFx0XHRcdHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIpO1xyXG5cdFx0XHRcdGEuc3JjID0gdGhpcy5hLnNyYztcclxuXHRcdFx0XHRhLnZvbHVtZSA9IHRoaXMuYS52b2x1bWU7XHJcblx0XHRcdFx0YS5wbGF5KCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5hLnBsYXkoKTtcclxuXHRcdFx0XHR0aGlzLnN0YXRlID0gXCJwbGF5XCI7XHJcblx0XHRcdFx0dGhpcy5hLm9uZW5kZWQgPSBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0dGhpcy5zdGF0ZSA9IFwic3RvcFwiO1xyXG5cdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0fTtcclxuXHJcblx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLmEucGF1c2UoKTtcclxuXHRcdHRoaXMuc3RhdGUgPSBcInBhdXNlXCI7XHJcblx0fTtcclxuXHJcblx0dGhpcy5zdG9wID0gZnVuY3Rpb24oKXtcclxuXHRcdHRoaXMuYS5wYXVzZSgpO1xyXG5cdFx0dGhpcy5hLmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdHRoaXMuc3RhdGUgPSBcInN0b3BcIjtcclxuXHR9O1xyXG5cclxuXHR0aGlzLmNoYW5nZVZvbHVtZSA9IGZ1bmN0aW9uKHBlcmNlbnRWb2wpe1xyXG5cdFx0dGhpcy5hLnZvbHVtZSA9IHRtcFZvbC8xMDAgKiBwZXJjZW50Vm9sO1xyXG5cdH07XHJcblxyXG5cdHRoaXMuY2hhbmdlRGlzYWJsZSA9IGZ1bmN0aW9uKHBsYXkpe1xyXG5cdFx0dGhpcy5kaXNhYmxlZCA9ICF0aGlzLmRpc2FibGVkO1xyXG5cdFx0aWYgKHBsYXkpICggdGhpcy5zdGF0ZSA9PSBcInBsYXlcIiApID8gdGhpcy5zdG9wKCkgOiB0aGlzLnBsYXkoKTtcclxuXHR9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbiA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCB0eHQsIG5hbWUsIGZTaXplLCBmb250RmFtKXtcclxuICBcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuICB0aGlzLnR4dCA9IHR4dDtcclxuICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIHRoaXMuZlNpemUgPSBmU2l6ZTtcclxuICB0aGlzLnR4dENvbG9yID0gXCJ3aGl0ZVwiO1xyXG4gIHRoaXMuZm9udEZhbSA9IGZvbnRGYW0gfHwgXCJBcmlhbFwiO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbihub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gICAgdmFyIF9wYWRkID0gcGFkZCB8fCA1O1xyXG4gICAgdmFyIF94ID0gKCAhbm9DZW50ZXIgKSA/IHRoaXMueCt0aGlzLncvMiA6IHRoaXMueCtfcGFkZDtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIW5vQ2VudGVyICkgPyBcImNlbnRlclwiIDogXCJzdGFydFwiO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZTaXplICsgJ3B4ICcrdGhpcy5mb250RmFtO1xyXG4gICAgY3R4LnRleHRCYXNlbGluZT1cIm1pZGRsZVwiOyBcclxuICAgIGN0eC5maWxsVGV4dCh0aGlzLnR4dCwgX3gsIHRoaXMueSt0aGlzLmgvMik7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZSA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCwgb3BhY2l0eSl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy5vcGFjaXR5ID0gb3BhY2l0eSB8fCAxO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5nbG9iYWxBbHBoYSA9IHRoaXMub3BhY2l0eTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcblxyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltZ0J1dHRvbiA9IGZ1bmN0aW9uKGltZywgaG92ZXJJbWcsIHgsIHksIHcsIGgsIHR4dCwgbmFtZSwgZlNpemUsIHNldENlbnRlciwgbm9DZW50ZXIsIHBhZGQpe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG4gIHRoaXMudHh0Q29sb3IgPSBcIndoaXRlXCI7XHJcbiAgdGhpcy5zZXRDZW50ZXIgPSBzZXRDZW50ZXIgfHwgdGhpcy54O1xyXG4gIHRoaXMubm9DZW50ZXIgPSBub0NlbnRlciB8fCBmYWxzZTtcclxuICB0aGlzLnBhZGQgPSBwYWRkIHx8IDU7XHJcbiAgdGhpcy5ob3ZlckltZyA9IGhvdmVySW1nO1xyXG4gIHRoaXMuZkZhbSA9IFwiY2FwdHVyZV9pdFwiO1xyXG5cclxuICB2YXIgbWV0cmljcyA9IGN0eC5tZWFzdXJlVGV4dCh0aGlzLnR4dCkud2lkdGg7IC8v0YDQsNC30LzQtdGALdGI0LjRgNC40L3QsCDQv9C10YDQtdC00LDQstCw0LXQvNC+0LPQviDRgtC10LrRgdGC0LBcclxuICB2YXIgX3ggPSAoICF0aGlzLm5vQ2VudGVyICkgPyB0aGlzLnNldENlbnRlcit0aGlzLncvMiA6IHRoaXMueCt0aGlzLnBhZGQ7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy50eHRDb2xvcjtcclxuICAgIGN0eC50ZXh0QWxpZ24gPSAoICF0aGlzLm5vQ2VudGVyICkgPyBcImNlbnRlclwiIDogXCJzdGFydFwiO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZTaXplICsgJ3B4ICcgKyB0aGlzLmZGYW07XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxuICB2YXIgX2ltZyA9IGZhbHNlOyAvL9Cx0YPQtNC10YIg0YXRgNCw0L3QuNGC0Ywg0LLRgNC10LzQtdC90L3QviDQutCw0YDRgtC40L3QutGDINGB0YLQsNC90LTQsNGA0YLQvdGD0Y4uXHJcblxyXG4gIHRoaXMuaG92ZXIgPSBmdW5jdGlvbihkcmF3KXtcclxuXHJcbiAgICBpZiAoZHJhdyAmJiB0aGlzLmhvdmVySW1nKSB7ICAgICAgICAgICAgIC8v0LXRgdC70Lgg0L/QtdGA0LXQtNCw0LvQuCDQuNGB0YLQuNC90YMg0Lgg0YXQvtCy0LXRgCDRgyDRjdGC0L7Qs9C+INC+0LHRitC10LrRgtCwINC10YHRgtGMLCDRgtC+INC+0YLRgNC40YHQvtCy0YvQstCw0LXQvCDRhdC+0LLQtdGAXHJcbiAgICAgIGlmICghX2ltZykgX2ltZyA9IHRoaXMuaW1nOyAgICAgICAgICAgIC8vINC10YHQu9C4INC10YnQtSDQvdC1INCx0YvQu9CwINGB0L7RhdGA0LDQvdC10L3QsCDRgdGC0LDQvdC00LDRgNGC0L3QsNGPINC60LDRgNGC0LjQvdC60LAsINGC0L4g0YHQvtGF0YDQsNC90Y/QtdC8INC4Li5cclxuICAgICAgdGhpcy5pbWcgPSB0aGlzLmhvdmVySW1nOyAgICAgICAgICAgICAgLy8uLtC90L7QstC+0Lkg0LHRg9C00LXRgiDQstGL0LLQvtC00LjRgtGB0Y8g0L/QtdGA0LXQtNCw0L3QvdCw0Y9cclxuICAgICAgY252LnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiOyAgICAgICAgICAvL9C4INC60YPRgNGB0L7RgCDQsdGD0LTQtdGCINC/0L7QuNC90YLQtdGAXHJcbiAgICB9IGVsc2UgaWYgKCBfaW1nICYmIF9pbWcgIT0gdGhpcy5pbWcpeyAgIC8v0LjQvdCw0YfQtSDQtdGB0LvQuCDQsdGL0LvQsCDRgdC+0YXRgNCw0L3QtdC90LAg0LrQsNGA0YLQuNC90LrQsCDQuCDQvdC1INC+0L3QsCDQsiDQtNCw0L3QvdGL0Lkg0LzQvtC80LXQvdGCINC+0YLRgNC40YHQvtCy0YvQstCw0LXRgtGB0Y8sINGC0L5cclxuICAgICAgdGhpcy5pbWcgPSBfaW1nOyAgICAgICAgICAgICAgICAgICAgICAgLy/QstC+0LfQstGA0LDRidCw0LXQvCDRgdGC0LDQvdC00LDRgNGCINC60LDRgNGC0LjQvdC60YMg0L3QsCDQvNC10YHRgtC+XHJcbiAgICAgIGNudi5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjsgICAgICAgICAgLy/QuCDQutGD0YDRgdC+0YAg0LTQtdC70LDQtdC8INGB0YLQsNC90LTQsNGA0YLQvdGL0LxcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlhYmxlID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3QgPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvciwgaXNTdHJva2UpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMuaXNTdHJva2UgPSBpc1N0cm9rZSB8fCBmYWxzZTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGlmICghdGhpcy5pc1N0cm9rZSkge1xyXG4gICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICBjdHguc3Ryb2tlUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5tb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHN3aXRjaChkaXJlY3Rpb24pe1xyXG4gICAgICBjYXNlIFwidXBcIiA6IFxyXG4gICAgICB0aGlzLnkgLT0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJkb3duXCIgOiBcclxuICAgICAgdGhpcy55ICs9IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwibGVmdFwiIDpcclxuICAgICAgdGhpcy54IC09IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwicmlnaHRcIiA6IFxyXG4gICAgICB0aGlzLnggKz0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpXHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFZpZGVvID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgdmlkZW8pe1xyXG5cclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMudmlkZW8gPSB2aWRlbztcclxuXHJcbiAgdmFyIHNhdmUgPSBmYWxzZTtcclxuICB2YXIgYnVmQ252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICB2YXIgYnVmQ3R4ID0gYnVmQ252LmdldENvbnRleHQoXCIyZFwiKTtcclxuICBidWZDbnYud2lkdGggPSBDLldJRFRIO1xyXG4gIGJ1ZkNudi5oZWlnaHQgPSBDLkhFSUdIVDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLnZpZGVvKSB7XHJcbiAgICAgIGlmICggIXNhdmUgKXtcclxuICAgICAgICBidWZDdHguZHJhd0ltYWdlKHRoaXMudmlkZW8sIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgICAgc2F2ZSA9IHRydWU7XHJcbiAgICAgIH07XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLnZpZGVvLnBsYXkoKTtcclxuICAgICAgY2FudmFzLmN0eC5kcmF3SW1hZ2UoYnVmQ252LCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgICBjYW52YXMuY3R4LmRyYXdJbWFnZSh0aGlzLnZpZGVvLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIH07XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdhbGwgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKSxcclxuQXVkaW8gICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0F1ZGlvLmpzJyksXHJcblBsYXllYmxlICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9QbGF5YWJsZS5qcycpLFxyXG5XYWxsICAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvV2FsbC5qcycpLFxyXG5JbWdCdXR0b24gPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1nQnV0dG9uLmpzJyksXHJcblZpZGVvICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9WaWRlby5qcycpLFxyXG5CdXR0b24gICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvQnV0dG9uLmpzJyksXHJcblJlY3QgICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9SZWN0LmpzJyksXHJcbkltYWdlICAgICA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWFnZS5qcycpLFxyXG5DICAgICAgICAgPSByZXF1aXJlKCcuL19jb25zdC5qcycpLFxyXG5ldmVudHMgICAgPSByZXF1aXJlKCcuL19ldmVudHMuanMnKSxcclxubGV2ZWxzICAgID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyksXHJcbm8gICAgICAgICA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKSxcclxuY252cyAgICAgID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyksXHJcbmtleSBcdCAgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxuXHJcbmVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubG9hZGVyKTtcclxuXHJcblxyXG4vLyDQvdCw0YHRgtGA0L7QudC60LggLSDRiNC+0LEg0YLQsNC8INGD0L/RgNCw0LLQu9GP0YLRjCDRgNCw0LfQvNC10YDQsNC80Lgg0L3QsNCy0LXRgNC90L7QtS4uINGF0Lcg0L/QvtC60LAsINC80YPQt9GL0LrQvtC5INGD0L/RgNCw0LLQu9GP0YLRjCEhIVxyXG4vLyDRiNGA0LjRhNGCINC90LDQtNC+INC/0L7QtNCz0YDRg9C20LDRgtGMINGA0LDQvdC10LUsINC90LDQv9GA0LjQvNC10YAg0L7RgtGA0LjRgdC+0LLQsNGC0Ywg0LXQs9C+INCyINC/0YDQtdC70L7QudC00LXRgNC1INC90LXQstC40LTQuNC80L4uXHJcblxyXG5cclxuXHJcbi8vINGF0LDQudC00LjRgtGMINC60L3QvtC/0LrQuCDQsiDQstGL0LHQvtGA0LUg0YPRgNC+0LLQvdGPIl19
