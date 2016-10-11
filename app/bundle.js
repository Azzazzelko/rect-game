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

module.exports = {

	gameEngineStart : function (callback){
		gameEngine = callback;
		gameEngineStep();
	},

	setGameEngine : function(callback){
		gameEngine = callback;
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
  engin.setGameEngine(gameLoops.game);
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

  if ( canvas.cnv.style.cursor != "default" ) canvas.cnv.style.cursor = "default";  //всегда при клике на любую кнопку, что б курсор стандартизировался

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


window.onmousemove = function(e){ //события движения мышки

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
        o.menu[i].hover();
        if ( isCursorInButton(x,y,o.menu[i]) ){
          switch (o.menu[i].name) {

            case "play" :
              o.menu[i].hover(1);
              break;

            case "change_level" :
              o.menu[i].hover(1);
              break;
          };
        };
      };
      break;

    case "game" :
      if ( isCursorInButton(x,y,o.bPause) ){
        // document.body.style.cursor = "pointer";
      };

      if ( isCursorInButton(x,y,o.bFullScr) ){
        // document.body.style.cursor = "pointer";
      };
      break;

    case "win" :
      for ( i in o.winPopUp ){
        if ( isCursorInButton(x,y,o.winPopUp[i]) ){
          if ( o.winPopUp[i].name == "pop_exit" ){

          } else if ( o.winPopUp[i].name == "pop_next" && gameLoops.currentLevel != levels.lvlsCount() ){
            
          };
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
  var bPopNext = new ImgButton( res.arrImages[15], winPopBG.x+30+110+80,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_next", 0 );

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
  var bExitToMenu = new ImgButton( res.arrImages[12],  bgPause.x+50,  bgPause.y+bgPause.h-50, 85, 70, "", "exit", 0 );
  var bRestart = new ImgButton( res.arrImages[11],  bgPause.x+50+30+85,  bgPause.y+bgPause.h-50, 85, 70, "", "restart", 0 );
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
var stopWatch = new Button( 10, header.h/2-C.CNV_BORDER/2 - 40/2, 120, 40, "transparent", "00 : 00 : 00", "stopwatch", 25, "dited" );
var bPause = new ImgButton( res.arrImages[4], C.WIDTH-45-7-bFullScr.w-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "pause", 0 );
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
  "img/button-menu.svg",         //0 
  "img/logo.png",                //1 
  "img/header3.svg",             //2 
  "img/fullscreen.svg",          //3 
  "img/pause.svg",               //4 
  "img/wall.svg",                //5 
  "img/crystall-01.svg",         //6 
  "img/portal.svg",              //7 
  "img/ground.jpg",              //8 
  'img/player.png',              //9 
  "img/exit-button.svg",         //10
  "img/restart-button.svg",      //11
  "img/exit_in_menu-button.svg", //12
  "img/pause-bg.svg",            //13
  "img/pause_text.svg",          //14
  "img/button_next.svg",         //15
  "img/bg_win.svg",              //16
  "img/levels_2.svg",            //17
  "img/levels_next.svg",         //18
  "img/levels_prev.svg",         //19
  "img/levels_in_menu.svg",      //20

  "img/hovers/button-menu_hover.svg" //21
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

// направление персонажа в уровнях
// настройки - шоб там управлять размерами наверное.. хз пока
// ховеры над кнопками - хотябы мауз поинтер.
// музыку думать
// прелоадер запилить

// хайдить кнопки в выборе уровня
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Button.js":13,"./classes/Image.js":14,"./classes/ImgButton.js":15,"./classes/Playable.js":16,"./classes/Rect.js":17,"./classes/Video.js":18,"./classes/Wall.js":19}]},{},[20])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcmVzb3Vyc2VzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3N0b3B3YXRjaC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvQnV0dG9uLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWFnZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvSW1nQnV0dG9uLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9QbGF5YWJsZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvUmVjdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvVmlkZW8uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1dhbGwuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9mYWtlX2JmMjNhNzRjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIGNudiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG52YXIgY3R4ID0gY252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbmNudi5zdHlsZS5ib3JkZXIgPSBcIjJweCBzb2xpZCBibGFja1wiO1xyXG5jbnYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ3aGl0ZVwiO1xyXG5jbnYud2lkdGggPSBDLldJRFRIO1xyXG5jbnYuaGVpZ2h0ID0gQy5IRUlHSFQ7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Y252IDogY252LFxyXG5cclxuXHRjdHggOiBjdHhcclxuXHJcbn07IiwidmFyIFBBREQgPSAxOyBcdFx0XHRcdFx0XHQvL9C/0LDQtNC00LjQvdCzLCDQutC+0YLQvtGA0YvQuSDRjyDRhdC+0YfRgyDRh9GC0L7QsdGLINCx0YvQuywg0LzQtdC2INC60LLQsNC00YDQsNGC0LDQvNC4XHJcbnZhciBXSURUSCA9IFBBREQgKyAoUEFERCs1MCkqOTsgXHQvL9GI0LjRgNC40L3QsCDQutCw0L3QstGLXHJcbnZhciBIRUlHSFQgPSAyMCtQQUREICsgKFBBREQrNTApKjEwOyAgIC8v0LLRi9GB0L7RgtCwINC60LDQvdCy0YtcclxudmFyIENOVl9CT1JERVIgPSAyO1xyXG52YXIgSEVBREVSX0ggPSA3MTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRQRE5HIDogUEFERCxcclxuXHJcblx0V0lEVEggOiBXSURUSCxcclxuXHJcblx0SEVJR0hUIDogSEVJR0hULFxyXG5cclxuXHRDTlZfQk9SREVSIDogQ05WX0JPUkRFUixcclxuXHJcblx0SEVBREVSX0ggOiBIRUFERVJfSFxyXG5cclxufTtcclxuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4vLyoq0LrRgNC+0YHQsdGA0LDRg9C30LXRgNC90L7QtSDRg9C/0YDQstC70LXQvdC40LUg0YbQuNC60LvQsNC80Lgg0LjQs9GA0YsqKlxyXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG52YXIgZ2FtZUVuZ2luZTtcclxuXHJcbnZhciBuZXh0R2FtZVN0ZXAgPSAoZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0d2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0bW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0b1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0ZnVuY3Rpb24gKGNhbGxiYWNrKXtcclxuXHRcdHNldEludGVydmFsKGNhbGxiYWNrLCAxMDAwLzYwKVxyXG5cdH07XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBnYW1lRW5naW5lU3RlcCgpe1xyXG5cdGdhbWVFbmdpbmUoKTtcclxuXHRuZXh0R2FtZVN0ZXAoZ2FtZUVuZ2luZVN0ZXApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0XHRnYW1lRW5naW5lU3RlcCgpO1xyXG5cdH0sXHJcblxyXG5cdHNldEdhbWVFbmdpbmUgOiBmdW5jdGlvbihjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBzdyA9IHJlcXVpcmUoJy4vX3N0b3B3YXRjaC5qcycpO1xyXG52YXIgbGV2ZWxzID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyk7XHJcbnZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG52YXIgZ0xvbyA9IHJlcXVpcmUoJy4vX2dhbWVMb29wcy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgZnMgPSByZXF1aXJlKCcuL19mdWxsU2NyZWVuLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGtleSA9IHJlcXVpcmUoJy4vX2tleS5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG52YXIgZ2FtZUxvb3BzID0gZ0xvbztcclxuXHJcbnZhciBpc0JvcmRlciA9IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIg0L7QsdGK0LXQutGCLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvtC80Lkg0LPRgNCw0L3QuNGG0Ysg0LrQsNC90LLRi1xyXG4gIHVwIDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueSA9PSAwO1xyXG4gIH0sXHJcblxyXG4gIGRvd24gOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai55ID09IEMuSEVJR0hUIC0gb2JqLmggLSBDLlBETkcgLSBDLkhFQURFUl9IIC0gQy5QRE5HO1xyXG4gIH0sXHJcblxyXG4gIGxlZnQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai54ID09IDA7XHJcbiAgfSxcclxuXHJcbiAgcmlnaHQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai54ID09IEMuV0lEVEggLSBvYmoudyAtIEMuUERORyAtIEMuUEROR1xyXG4gIH1cclxufTtcclxuXHJcbnZhciBpc05lYXIgPSB7IC8v0L/RgNC40L3QuNC80LDQtdGCIDIg0L7QsdGK0LXQutGC0LAsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC80L7QuSDRgdGC0L7RgNC+0L3RiyAx0YvQuSDQvtGCIDLQs9C+LlxyXG5cclxuICB1cCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnkgKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMltpXS54O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnkgKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gIH0sXHJcblxyXG4gIGRvd24gOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBsZWZ0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueCArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzIueCArIG9ial8yLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfSxcclxuXHJcbiAgcmlnaHQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBkaXJlY3Rpb25JcyhkaXJlY3Rpb24peyAgLy/QstC+0LfQstGA0LDRidCw0LXRgiDRg9Cz0L7QuyDQv9C+0LLQvtGA0L7RgtCwINCyINCz0YDQsNC00YPRgdCw0YVcclxuXHJcbiAgc3dpdGNoKGRpcmVjdGlvbil7XHJcblxyXG4gICAgY2FzZSBcInVwXCIgICA6IHJldHVybiAzNjA7XHJcbiAgICBicmVhaztcclxuICAgIGNhc2UgXCJkb3duXCIgOiByZXR1cm4gMTgwO1xyXG4gICAgYnJlYWs7XHJcbiAgICBjYXNlIFwibGVmdFwiIDogcmV0dXJuIDI3MDtcclxuICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcInJpZ2h0XCI6IHJldHVybiA5MDtcclxuICAgIGJyZWFrO1xyXG5cclxuICB9O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY2FuTW92ZU9iaihkaXJlY3Rpb24peyAgLy8o0L7Qv9C40YHRi9Cy0LDQtdC8INCz0YDQsNC90LjRhtGLINC00LLQuNC20LXQvdC40Y8pINGA0LDQt9GA0LXRiNCw0LXRgiDQtNCy0LjQttC10L3QuNC1INCyINC/0YDQtdC00LXQu9Cw0YUg0YPRgNC+0LLQvdGPXHJcblxyXG4gIG8ucGwuZGlyZWN0aW9uID0gby5wbC5pc01vdmUgPSBkaXJlY3Rpb25JcyhkaXJlY3Rpb24pO1xyXG4gIGlmICggaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby5ib3gpICYmICFpc0JvcmRlcltkaXJlY3Rpb25dKG8uYm94KSAmJiAhaXNOZWFyW2RpcmVjdGlvbl0oby5ib3gsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0YDRj9C00L7QvCDRgSDRj9GJ0LjQutC+0Lwg0Lgg0Y/RidC40Log0L3QtSDRgyDQs9GA0LDQvdC40YYsINC00LLQuNCz0LDQtdC8LlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgICBvLmJveC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfSBlbHNlIGlmKCAhaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby5ib3gpICYmICFpc0JvcmRlcltkaXJlY3Rpb25dKG8ucGwpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLndhbGxzKSApeyAvL9C10YHQu9C4INC90LUg0YDRj9C00L7QvCDRgSDRj9GJ0LjQutC+0Lwg0Lgg0L3QtSDRgNGP0LTQvtC8INGBINCz0YDQsNC90LjRhtC10LksINC00LLQuNCz0LDQtdC80YHRjy5cclxuICAgIG8ucGwubW92ZShkaXJlY3Rpb24pO1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGlzQ3Vyc29ySW5CdXR0b24oeCx5LGJ1dCl7IC8v0LLQvtC30LLRgNCw0YnQsNC10YIg0YLRgNGDLCDQtdGB0LvQuCDQutGD0YDRgdC+0YAg0L/QvtC/0LDQuyDQsiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvtCx0YrQtdC60YLQsFxyXG4gIHJldHVybiB4ID49IGJ1dC54ICYmIFxyXG4gIHggPD0gYnV0LngrYnV0LncgJiYgXHJcbiAgeSA+PSBidXQueSAmJiBcclxuICB5IDw9IGJ1dC55K2J1dC5oXHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkTGV2ZWwobnVtYmVyKXsgLy/Qt9Cw0LPRgNGD0LfQutCwINGD0YDQvtCy0L3Rj1xyXG4gIHN3LnN0YXJ0KCk7XHJcbiAgbGV2ZWxzW251bWJlcl0oKTsgXHJcbiAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9IG51bWJlcjsgXHJcbiAgby5jdXJyTGV2ZWwudHh0ID0gXCLQo9GA0L7QstC10L3RjCBcIitudW1iZXI7XHJcbiAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMuZ2FtZSk7XHJcbn07XHJcblxyXG53aW5kb3cub25rZXlkb3duID0gZnVuY3Rpb24oZSl7IC8v0YHQvtCx0YvRgtC40LUg0L3QsNC20LDRgtC40Y8g0LrQu9Cw0LLQuNGIXHJcblxyXG4gIGlmICggZ0xvby5zdGF0dXMgPT0gXCJnYW1lXCIgKXsgLy/Qv9C10YDQtdC00LLQuNCz0LDRgtGM0YHRjyDRgtC+0LvRjNC60L4g0LXRgdC70Lgg0LjQtNC10YIg0LjQs9GA0LAuXHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiRFwiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJyaWdodFwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJTXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcImRvd25cIik7XHJcblxyXG4gICAgaWYgKCBrZXkuaXNLZXlEb3duKFwiV1wiKSApXHJcbiAgICAgIGNhbk1vdmVPYmooXCJ1cFwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJBXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcImxlZnRcIik7XHJcblxyXG4gIH07XHJcblxyXG4gIHdpbmRvdy5vbmtleXVwID0gZnVuY3Rpb24oZSl7XHJcbiAgICBvLnBsLmlzTW92ZSA9IGZhbHNlO1xyXG4gIH07XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKXsgLy9j0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC80YvRiNC60LhcclxuXHJcbiAgaWYgKCBjYW52YXMuY252LnN0eWxlLmN1cnNvciAhPSBcImRlZmF1bHRcIiApIGNhbnZhcy5jbnYuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7ICAvL9Cy0YHQtdCz0LTQsCDQv9GA0Lgg0LrQu9C40LrQtSDQvdCwINC70Y7QsdGD0Y4g0LrQvdC+0L/QutGDLCDRh9GC0L4g0LEg0LrRg9GA0YHQvtGAINGB0YLQsNC90LTQsNGA0YLQuNC30LjRgNC+0LLQsNC70YHRj1xyXG5cclxuICBpZiAoIGZzLmlzRnVsbFNjcmVlbiApeyAgICAgIFxyXG4gICAgdmFyIHggPSAoZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQpL2ZzLnpvb207XHJcbiAgICB2YXIgeSA9IChlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wKS9mcy56b29tO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgeCA9IGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0O1xyXG4gICAgdmFyIHkgPSBlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wO1xyXG4gIH07XHJcblxyXG4gIHN3aXRjaCAoZ0xvby5zdGF0dXMpe1xyXG5cclxuICAgIGNhc2UgXCJtZW51XCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLm1lbnVbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInBsYXlcIiA6XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiY2hhbmdlX2xldmVsXCIgOlxyXG4gICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5sZXZlbHMpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJsZXZlbHNcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5sZXZlbHNGb290ZXIgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubGV2ZWxzRm9vdGVyW2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLmxldmVsc0Zvb3RlcltpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicHJldlwiIDpcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0L3QsNC30LDQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwidG9fbWVudVwiIDpcclxuICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcIm5leHRcIiA6XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi0JrQvdC+0L/QutCwINCy0L/QtdGA0LXQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgby5iTGV2ZWxzQnV0dG9ucy5sZW5ndGg7IGkrKyApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iTGV2ZWxzQnV0dG9uc1tpXSkgKXtcclxuICAgICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBpKzE7XHJcbiAgICAgICAgICBsb2FkTGV2ZWwoaSsxKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiZ2FtZVwiIDpcclxuICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJQYXVzZSkgKXtcclxuICAgICAgICBzdy5wYXVzZVRpbWVyKCk7XHJcbiAgICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLnBhdXNlKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKXtcclxuICAgICAgICAoICFmcy5pc0Z1bGxTY3JlZW4gKSA/IGZzLmxhdW5jaEZ1bGxTY3JlZW4oY2FudmFzLmNudikgOiBmcy5jYW5zZWxGdWxsU2NyZWVuKCk7IFxyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwid2luXCIgOlxyXG5cclxuICAgICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLndpblBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfZXhpdFwiICl7XHJcbiAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX25leHRcIiAmJiBnYW1lTG9vcHMuY3VycmVudExldmVsICE9IGxldmVscy5sdmxzQ291bnQoKSApe1xyXG4gICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsKys7XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcInBhdXNlXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5wYXVzZVBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLnBhdXNlUG9wVXBbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJldHVyblwiIDpcclxuICAgICAgICAgICAgICBzdy5zdGFydCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmdhbWUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJlc3RhcnRcIiA6XHJcbiAgICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiZXhpdFwiIDpcclxuICAgICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG5cclxud2luZG93Lm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSl7IC8v0YHQvtCx0YvRgtC40Y8g0LTQstC40LbQtdC90LjRjyDQvNGL0YjQutC4XHJcblxyXG4gIGlmICggZnMuaXNGdWxsU2NyZWVuICl7XHJcbiAgICB2YXIgeCA9IChlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdCkvZnMuem9vbTtcclxuICAgIHZhciB5ID0gKGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3ApL2ZzLnpvb207XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciB4ID0gZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQ7XHJcbiAgICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcbiAgfTtcclxuXHJcbiAgc3dpdGNoIChnTG9vLnN0YXR1cyl7XHJcblxyXG4gICAgY2FzZSBcIm1lbnVcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgICAgby5tZW51W2ldLmhvdmVyKCk7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLm1lbnVbaV0pICl7XHJcbiAgICAgICAgICBzd2l0Y2ggKG8ubWVudVtpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicGxheVwiIDpcclxuICAgICAgICAgICAgICBvLm1lbnVbaV0uaG92ZXIoMSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiY2hhbmdlX2xldmVsXCIgOlxyXG4gICAgICAgICAgICAgIG8ubWVudVtpXS5ob3ZlcigxKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcImdhbWVcIiA6XHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iUGF1c2UpICl7XHJcbiAgICAgICAgLy8gZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKXtcclxuICAgICAgICAvLyBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwid2luXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ud2luUG9wVXBbaV0pICl7XHJcbiAgICAgICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgIT0gbGV2ZWxzLmx2bHNDb3VudCgpICl7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICB9O1xyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIHpvb20gPSAwO1xyXG5cclxuZnVuY3Rpb24gZnVsbENhbnZhcygpe1x0Ly/QutCw0L3QstCwINCy0L4g0LLQtdGB0Ywg0Y3QutGA0LDQvVxyXG5cclxuXHR2YXIgZGV2aWNlV2lkdGggPSB3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGg7XHJcblx0dmFyIGRldmljZUhlaWdodCA9IHdpbmRvdy5zY3JlZW4uYXZhaWxIZWlnaHQ7XHJcblx0ZnVsbFNjcmVlbi56b29tID0gKGRldmljZUhlaWdodCAvIEMuSEVJR0hUKS50b0ZpeGVkKDEpO1x0Ly/QutCw0LrQvtC1INGD0LLQtdC70LjRh9C10L3QuNC1INGB0LTQtdC70LDRgtGMINC40YHRhdC+0LTRjyDQuNC3INGA0LDQt9C80LXRgNC+0LIg0Y3QutGA0LDQvdCwLlxyXG5cclxuXHRjYW52YXMuY252LndpZHRoID0gY2FudmFzLmNudi53aWR0aCpmdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodCpmdWxsU2NyZWVuLnpvb207XHJcblx0Y2FudmFzLmN0eC5zY2FsZShmdWxsU2NyZWVuLnpvb20sZnVsbFNjcmVlbi56b29tKTtcclxuXHJcblx0ZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW4gPSAhZnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW47XHJcbn07XHJcblxyXG5mdW5jdGlvbiBub3JtYWxDYW52YXMoKXtcdC8v0LjRgdGF0L7QtNC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUg0LrQsNC90LLRi1xyXG5cclxuXHQvL2PQvtGF0YDQsNC90Y/QtdC8INC/0L7RgdC70LXQtNC90LjQuSDQutCw0LTRgCDQuNCz0YDRiywg0LTQsNCx0Ysg0L/RgNC4INCy0L7Qt9Cy0YDQsNGJ0LXQvdC40Lgg0YDQsNC30LzQtdGA0LAg0L/QvtGB0LvQtSDRhNGD0LvRgdC60YDQuNC90LAsINC+0L0g0L7RgtGA0LjRgdC+0LLQsNC70YHRjywg0LjQvdCw0YfQtSDQsdGD0LTQtdGCINCx0LXQu9GL0Lkg0YXQvtC70YHRgi5cclxuXHR2YXIgYnVmQ252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuXHR2YXIgYnVmQ3R4ID0gYnVmQ252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHRidWZDbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbTtcclxuXHRidWZDbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tO1xyXG5cdGJ1ZkN0eC5kcmF3SW1hZ2UoY2FudmFzLmNudiwgMCwwLCBjYW52YXMuY252LndpZHRoL2Z1bGxTY3JlZW4uem9vbSwgY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tKTtcclxuXHJcblx0Y2FudmFzLmNudi53aWR0aCA9IGNhbnZhcy5jbnYud2lkdGgvZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jbnYuaGVpZ2h0ID0gY2FudmFzLmNudi5oZWlnaHQvZnVsbFNjcmVlbi56b29tO1xyXG5cdGNhbnZhcy5jdHguc2NhbGUoMSwxKTtcclxuXHRjYW52YXMuY3R4LmRyYXdJbWFnZShidWZDbnYsMCwwLGNhbnZhcy5jbnYud2lkdGgsY2FudmFzLmNudi5oZWlnaHQpO1xyXG5cclxuXHRmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbiA9ICFmdWxsU2NyZWVuLmlzRnVsbFNjcmVlbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uRnVsbFNjcmVlbkNoYW5nZSgpe1x0Ly/Qv9GA0Lgg0LjQt9C80LXQvdC40Lgg0YHQvtGB0YLQvtGP0L3QuNC1INGE0YPQu9GB0LrRgNC40L3QsFxyXG5cclxuXHQoIGZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuICkgPyBub3JtYWxDYW52YXMoKSA6IGZ1bGxDYW52YXMoKTtcclxufTtcclxuXHJcbmNhbnZhcy5jbnYuYWRkRXZlbnRMaXN0ZW5lcihcIndlYmtpdGZ1bGxzY3JlZW5jaGFuZ2VcIiwgb25GdWxsU2NyZWVuQ2hhbmdlKTtcclxuY2FudmFzLmNudi5hZGRFdmVudExpc3RlbmVyKFwibW96ZnVsbHNjcmVlbmNoYW5nZVwiLCAgICBvbkZ1bGxTY3JlZW5DaGFuZ2UpO1xyXG5jYW52YXMuY252LmFkZEV2ZW50TGlzdGVuZXIoXCJmdWxsc2NyZWVuY2hhbmdlXCIsICAgICAgIG9uRnVsbFNjcmVlbkNoYW5nZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bGxTY3JlZW4gPSB7IFxyXG5cclxuXHRsYXVuY2hGdWxsU2NyZWVuIDogZnVuY3Rpb24oZWxlbSl7XHJcblxyXG5cdFx0aWYgKCBlbGVtLnJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ubW96UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5tb3pSZXF1c3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBlbGVtLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH07XHJcblx0fSxcclxuXHJcblx0Y2Fuc2VsRnVsbFNjcmVlbiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0aWYgKCBkb2N1bWVudC5leGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRpc0Z1bGxTY3JlZW4gOiBmYWxzZSxcclxuXHJcblx0em9vbSA6IHpvb21cclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVMb29wcyA9ICB7XHJcblxyXG4gIGxvYWRlciA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwibG9hZGVyXCI7XHJcblxyXG4gICAgby5QUkVMT0FERVIuZHJhdygpO1xyXG4gICAgaWYgKCByZXMucmVzb3Vyc2VzLmFyZUxvYWRlZCgpICkgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwiZ2FtZVwiOyBcclxuXHJcbiAgICAvL9C+0YfQuNGB0YLQutCwINC+0LHQu9Cw0YHRgtC4XHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINCx0LMg0YPRgNC+0LLQvdGPXHJcbiAgICBvLmJnTGV2ZWwuZHJhdygpO1xyXG4gICAgXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDQvNCw0YLRgNC40YfQvdC+0LUg0L/QvtC70LUg0LjQs9GA0YtcclxuICAgIGZvciAoIGkgaW4gby5tYXRyaXggKXtcclxuICAgICAgby5tYXRyaXhbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDRgdGC0LXQvdGLXFzQv9GA0LXQs9GA0LDQtNGLXHJcbiAgICBmb3IgKCBpIGluIG8ud2FsbHMgKXtcclxuICAgICAgby53YWxsc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0L7RgtGA0LjRgdC+0LLQutCwINGF0LXQtNC10YDQsCDRg9GA0L7QstC90Y9cclxuICAgIG8uaGVhZGVyLmRyYXcoKTtcclxuICAgIG8uc3RvcFdhdGNoLmRyYXcoMSwxMCk7XHJcbiAgICBvLmJGdWxsU2NyLmRyYXcoKTtcclxuICAgIG8uYlBhdXNlLmRyYXcoKTtcclxuICAgIG8uY3VyckxldmVsLmRyYXcoKTtcclxuXHJcbiAgICAvL9C+0YLRgNC40YHQvtCy0LrQsCDQuNCz0YDQvtCy0YvRhSDQvtCx0YrQtdC60YLQvtCyXHJcbiAgICBvLmRvb3IuZHJhdygpO1xyXG4gICAgby5wbC5kcmF3KCk7XHJcbiAgICBvLmJveC5kcmF3KCk7XHJcblxyXG4gICAgLy/QtdGB0LvQuCDQv9C+0LHQtdC00LjQu9C4XHJcbiAgICBpZiAoIGhmLmlzV2luKCkgKXtcclxuICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy53aW4pO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJtZW51XCI7XHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICBvLmFuaW1hdGVCZy5kcmF3KCk7XHJcblxyXG4gICAgby5sb2dvLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICBvLm1lbnVbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgfSxcclxuXHJcbiAgd2luIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJ3aW5cIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJ3aW5fdGV4dFwiICkgby53aW5Qb3BVcFtpXS50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK2dhbWVMb29wcy5jdXJyZW50TGV2ZWw7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9PSBsZXZlbHMubHZsc0NvdW50KCkgKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgby53aW5Qb3BVcFtpXS5kcmF3KCk7XHJcbiAgICAgIH0gIFxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBwYXVzZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwicGF1c2VcIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICBvLnBhdXNlUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBsZXZlbHMgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImxldmVsc1wiO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby52aWRlb0JnTGV2ZWxzLmRyYXcoKTtcclxuXHJcbiAgICBvLmxldmVsc0hlYWRlci5kcmF3KCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLmJMZXZlbHNCdXR0b25zICl7XHJcbiAgICAgIG8uYkxldmVsc0J1dHRvbnNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgIG8ubGV2ZWxzRm9vdGVyW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgc3RhdHVzIDogXCJcIixcclxuXHJcbiAgY3VycmVudExldmVsIDogXCIxXCJcclxuXHJcbn07XHJcbiIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gIGNsZWFyUmVjdCA6IGZ1bmN0aW9uKHgseSx3LGgpeyAgLy/QvtGH0LjRgdGC0LjRgtC10LvRjFxyXG4gICAgY3R4LmNsZWFyUmVjdCh4LHksdyxoKTtcclxuICB9LFxyXG5cclxuICBnZXRSYW5kb21JbnQgOiBmdW5jdGlvbihtaW4sIG1heCkgeyAvL9GE0YPQvdC60YbQuNGPINC00LvRjyDRgNCw0L3QtNC+0LzQsCDRhtC10LvQvtGH0LjRgdC70LXQvdC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y9cclxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xyXG4gIH0sXHJcblxyXG4gIGlzV2luIDogZnVuY3Rpb24oKXsgLy/Qv9C+0LHQtdC00LjQu9C4P1xyXG4gICAgcmV0dXJuIG8uYm94LnggPT0gby5kb29yLnggJiYgby5ib3gueSA9PSBvLmRvb3IueTtcclxuICB9XHJcbn07XHJcbiIsInZhciBrZXlzID0ge1xyXG5cdFwiV1wiIDogODcsXHJcblx0XCJTXCIgOiA4MyxcclxuXHRcIkFcIiA6IDY1LFxyXG5cdFwiRFwiIDogNjhcclxufTtcclxuXHJcbnZhciBrZXlEb3duID0gMDtcclxuLy8gdmFyIGtleURvd24gPSB7fTtcclxuXHJcbmZ1bmN0aW9uIHNldEtleShrZXlDb2RlKXtcclxuXHRrZXlEb3duID0ga2V5Q29kZTtcclxuXHQvLyBrZXlEb3duW2tleWNvZGVdID0gdHJ1ZTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNsZWFyS2V5KGtleUNvZGUpe1xyXG5cdGtleURvd24gPSAwO1xyXG5cdC8vIGtleURvd25ba2V5Q29kZV0gPSBmYWxzZTtcclxufTtcclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKXtcclxuXHRzZXRLZXkoZS5rZXlDb2RlKTtcclxufSk7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgZnVuY3Rpb24oZSl7XHJcblx0Y2xlYXJLZXkoZS5rZXlDb2RlKTtcclxufSk7XHJcblxyXG5cclxuZnVuY3Rpb24gaXNLZXlEb3duKGtleU5hbWUpe1xyXG5cdHJldHVybiBrZXlEb3duW2tleXNba2V5TmFtZV1dID09IHRydWU7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRpc0tleURvd24gOiBmdW5jdGlvbihrZXlOYW1lKXtcclxuXHRcdHJldHVybiBrZXlEb3duID09IGtleXNba2V5TmFtZV07XHJcblx0XHQvLyByZXR1cm4ga2V5RG93bltrZXlzW2tleU5hbWVdXSA9PSB0cnVlO1xyXG5cdH1cclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbHMgPSB7XHJcblxyXG5cdGx2bHNDb3VudCA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0Zm9yKGtleSBpbiBsZXZlbHMpeyBjb3VudCsrIH07XHJcblx0XHRcdHJldHVybiBjb3VudC0xO1xyXG5cdH0sXHJcblxyXG5cdDEgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIC8v0LzQsNGB0YHQuNCyINGBINCx0YPQtNGD0YnQtdC/0L7RgdGC0YDQvtC10L3QvdGL0LzQuCDRgdGC0LXQvdC60LDQvNC4XHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFsxLDNdLFsxLDRdLFsxLDVdLFsyLDBdLFsyLDZdLFsyLDhdLFszLDJdLFs0LDFdLFs0LDNdLFs0LDddLFs1LDRdLFs2LDRdLFs2LDZdLFs3LDFdLFs3LDhdLFs4LDBdLFs4LDRdLFs4LDVdXHJcblx0XHRdO1x0XHRcdFx0ICAvL9C/0YDQuNC00YPQvNCw0L3QvdGL0Lkg0LzQsNGB0YHQuNCyINGB0L4g0YHRgtC10L3QutCw0LzQuFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC80LDRgdGB0LjQsiB3YWxsc1xyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDAgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzIqKDUwK0MuUERORyksIDcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDBdLFswLDRdLFswLDNdLFswLDZdLFsyLDJdLFsyLDRdLFszLDhdLFszLDBdLFszLDddLFs0LDJdLFs0LDRdLFs0LDVdLFs0LDZdLFs1LDBdLFs2LDJdLFs2LDVdLFs2LDZdLFs2LDddLFs3LDBdLFs4LDNdLFs4LDRdLFs4LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzYqKDUwK0MuUERORyksIDArNyooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDArNiooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDMgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwyXSxbMCw3XSxbMSw1XSxbMSw4XSxbMiwyXSxbMiw3XSxbMyw0XSxbNCwxXSxbNCw0XSxbNCw2XSxbNiwyXSxbNiwzXSxbNiw0XSxbNiw2XSxbNiw4XSxbNywwXSxbNyw1XSxbOCwwXSxbOCwxXSxbOCwzXSxbOCw3XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzEqKDUwK0MuUERORyksIDArNiooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzIqKDUwK0MuUERORyksIDArMyooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDQgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwxXSxbMSw1XSxbMSw3XSxbMiw0XSxbMywxXSxbMywzXSxbMyw2XSxbMyw4XSxbNCwzXSxbNSw1XSxbNSw3XSxbNiwwXSxbNiwyXSxbNiwzXSxbNiw1XSxbNyw4XSxbOCwwXSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzcqKDUwK0MuUERORyksIDArNyooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzYqKDUwK0MuUERORyksIDArMCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDUgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwxXSxbMCwzXSxbMCw1XSxbMCw4XSxbMiwyXSxbMiw0XSxbMiw2XSxbMiw4XSxbNCwwXSxbNCwzXSxbNCw1XSxbNCw3XSxbNiwxXSxbNiwyXSxbNiw0XSxbNiw3XSxbNyw4XSxbOCwyXSxbOCw0XSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCswKig1MCtDLlBETkcpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsxKig1MCtDLlBETkcpLCAwKzEqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCwgMCs4Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgY252cyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWF0cml4QkcoKXsgLy/RgdC+0LfQtNCw0LXQvCDQvNCw0YLRgNC40YfQvdC+0LUg0L/QvtC70LVcclxuICB2YXIgbWF0cml4ID0gW107ICAgICAgICAgICAgICAgICAgICAgLy/QvNCw0YHRgdC40LIg0LTQu9GPINC80LDRgtGA0LjRh9C90L7Qs9C+INCy0LjQtNCwINGD0YDQvtCy0L3Rj1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKyl7ICAgICAgICAgLy/Qt9Cw0L/QvtC70L3Rj9C10Lwg0L7QsdGK0LXQutGCXHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDk7IGorKyl7XHJcbiAgICAgIG1hdHJpeC5wdXNoKCBuZXcgUmVjdChDLlBETkcraiooNTArQy5QRE5HKSwgNzErQy5QRE5HK2kqKDUwK0MuUERORyksIDUwLCA1MCwgXCJyZ2JhKDAsMCwwLDAuNSlcIiwgdHJ1ZSkgKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gbWF0cml4XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNZW51KHR4dEFyciwgbmFtZUFycil7ICAvL9GB0L7Qt9C00LDQtdC8INCz0LvQsNCy0L3QvtC1INC80LXQvdGOXHJcbiAgdmFyIG1lbnUgPSBbXTtcclxuICB2YXIgbmFtZXMgPSBuYW1lQXJyO1xyXG4gIHZhciB0eHQgPSB0eHRBcnI7XHJcbiAgdmFyIGFtb3VudHMgPSB0eHRBcnIubGVuZ3RoO1xyXG4gIFxyXG4gIHZhciBfZm9udHNpemUgPSBcIjI4XCI7XHJcbiAgdmFyIF94ID0gQy5XSURUSC8yLTMwMC8yO1xyXG4gIHZhciBfeSA9IChDLkhFSUdIVC8yKSAtICg4NSphbW91bnRzLzIpICsgODU7IFxyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFtb3VudHM7IGkrKyl7XHJcbiAgICBtZW51LnB1c2goIG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMF0sIF94LCBfeStpKjg1LCAzMDAsIDYwLCB0eHRbaV0sIG5hbWVzW2ldLCBfZm9udHNpemUsIDgzICkgKTtcclxuICAgIG1lbnVbaV0uaG92ZXJJbWcgPSByZXMuYXJySW1hZ2VzWzIxXTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gbWVudTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpblBvcFVwKCl7IC8v0YHQvtC30LTQsNC10Lwg0L/QvtCx0LXQtNC90YPRjiDQstGB0L/Qu9C70YvQstCw0YjQutGDXHJcblxyXG4gIHZhciB3aW5Qb3BCRyA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxNl0sIEMuV0lEVEgvMi0zMjAvMiwgQy5IRUlHSFQvMi0yMDAvMiwgMzIwLCAyMDApO1xyXG4gIHZhciBiUG9wRXhpdCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTJdLCB3aW5Qb3BCRy54KzMwLCAgd2luUG9wQkcueSt3aW5Qb3BCRy5oLTUwLCA4MCwgNjUsIFwiXCIsIFwicG9wX2V4aXRcIiwgMCApO1xyXG4gIHZhciBiUG9wTmV4dCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTVdLCB3aW5Qb3BCRy54KzMwKzExMCs4MCwgIHdpblBvcEJHLnkrd2luUG9wQkcuaC01MCwgODAsIDY1LCBcIlwiLCBcInBvcF9uZXh0XCIsIDAgKTtcclxuXHJcbiAgdmFyIHdpblRleHQgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMiwgd2luUG9wQkcueSsxNSwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0KPRgNC+0LLQtdC90YwgTlwiLCBcIndpbl90ZXh0XCIsIDMwLCBcIkJ1Y2NhbmVlclwiICk7XHJcbiAgdmFyIHdpblRleHRfMiA9IG5ldyBCdXR0b24oIEMuV0lEVEgvMi05MC8yKzEwLCB3aW5Qb3BCRy55KzgwLCA5MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQn9Cg0J7QmdCU0JXQnSFcIiwgXCJ3aW5fdGV4dF8yXCIsIDUwLCBcImFaWl9UcmlidXRlX0JvbGRcIiApO1xyXG5cclxuICB3aW5UZXh0LnR4dENvbG9yID0gXCIjRDlDNDI1XCI7XHJcblxyXG4gIHZhciB3aW5Qb3BVcCA9IFtdO1xyXG4gIHdpblBvcFVwLnB1c2god2luUG9wQkcsIGJQb3BFeGl0LCBiUG9wTmV4dCwgd2luVGV4dCwgd2luVGV4dF8yKTtcclxuXHJcbiAgcmV0dXJuIHdpblBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGF1c2VQb3BVcCgpeyAgLy/RgdC+0LfQtNCw0LXQvCDQv9Cw0YPQtyDQstGB0L/Qu9GL0LLQsNGI0LrRg1xyXG5cclxuICB2YXIgcGF1c2VQb3BVcCA9IFtdO1xyXG4gIHZhciBiZ1BhdXNlID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzEzXSwgQy5XSURUSC8yLTMwMC8yLCBDLkhFSUdIVC8yLTIwNy8yLCAzMDAsIDIwNyk7XHJcbiAgdmFyIGJSZXR1cm4gPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzEwXSwgYmdQYXVzZS54KzE5MCwgIGJnUGF1c2UueS0yNSwgNjMsIDU3LCBcIlwiLCBcInJldHVyblwiLCAwICk7XHJcbiAgdmFyIGJFeGl0VG9NZW51ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMl0sICBiZ1BhdXNlLngrNTAsICBiZ1BhdXNlLnkrYmdQYXVzZS5oLTUwLCA4NSwgNzAsIFwiXCIsIFwiZXhpdFwiLCAwICk7XHJcbiAgdmFyIGJSZXN0YXJ0ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMV0sICBiZ1BhdXNlLngrNTArMzArODUsICBiZ1BhdXNlLnkrYmdQYXVzZS5oLTUwLCA4NSwgNzAsIFwiXCIsIFwicmVzdGFydFwiLCAwICk7XHJcbiAgdmFyIHBhdXNlVGV4dCA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxNF0sIGJnUGF1c2UueCArIGJnUGF1c2Uudy8yIC0gMTUwLzIsIGJnUGF1c2UueSArIGJnUGF1c2UuaC8yIC0gMTAwLzIsIDE1MCwgMTAwKTtcclxuXHJcbiAgcGF1c2VQb3BVcC5wdXNoKGJnUGF1c2UsIGJSZXR1cm4sIGJFeGl0VG9NZW51LCBiUmVzdGFydCwgcGF1c2VUZXh0KTtcclxuXHJcbiAgcmV0dXJuIHBhdXNlUG9wVXA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVMZXZlbHNCdXR0b25zKGxldmVsc19jb3VudCl7IC8v0YHQvtC30LTQsNC10Lwg0LrQvdC+0L/QutC4INCyINCy0YvQsdC+0YDQtSDRg9GA0L7QstC90Y9cclxuXHJcbiAgdmFyIGJMZXZlbHNCdXR0b25zID0gW107XHJcbiAgdmFyIGogPSAwLCBkeSA9IDg1LCBkeCA9IDA7XHJcblxyXG4gIGZvciAoIGk9MDsgaSA8IGxldmVsc19jb3VudDsgaSsrKXtcclxuICAgIGR4ID0gOCtqKigxMDArMTUpO1xyXG5cclxuICAgIGJMZXZlbHNCdXR0b25zLnB1c2goIG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTddLCBkeCwgZHksIDEwMCwgMTAwLCBpKzEsIFwibGV2ZWxfXCIrKGkrMSksIDM1ICkgKTtcclxuXHJcbiAgICBqKys7XHJcblxyXG4gICAgaWYgKCBkeCA+IEMuV0lEVEgtMTE1ICl7XHJcbiAgICAgIGR5ICs9ICgxMjUpO1xyXG4gICAgICBqID0gMDtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGJMZXZlbHNCdXR0b25zO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzRm9vdGVyKCl7ICAvL9GB0L7Qt9C00LDQtdC8INGE0YPRgtC10YAg0LIg0LLRi9Cx0L7RgNC1INGD0YDQvtCy0L3Rj1xyXG5cclxuICB2YXIgbGV2ZWxzRm9vdGVyID0gW107XHJcblxyXG4gIHZhciBiUHJldiA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTldLCAyMCwgQy5IRUlHSFQtMTAtNjcsIDQwLCA2NywgXCJcIiwgXCJwcmV2XCIsIDAgKTtcclxuICB2YXIgYk5leHQgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE4XSwgQy5XSURUSC0yMC00MCwgQy5IRUlHSFQtMTAtNjcsIDQwLCA2NywgXCJcIiwgXCJuZXh0XCIsIDAgKTtcclxuICB2YXIgYlRvTWVudSA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMjBdLCBDLldJRFRILzIgLSAzMjAvMiwgQy5IRUlHSFQtMTAtNjcsIDMyMCwgNjcsIFwi0JLQtdGA0L3Rg9GC0YzRgdGPINCyINC80LXQvdGOXCIsIFwidG9fbWVudVwiLCAyNSApO1xyXG4gIGJUb01lbnUudHh0Q29sb3IgPSBcIiMwMDAwNDZcIjtcclxuXHJcbiAgbGV2ZWxzRm9vdGVyLnB1c2goYlByZXYsYk5leHQsYlRvTWVudSk7XHJcblxyXG4gIHJldHVybiBsZXZlbHNGb290ZXI7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQbGF5ZXIoKXsgIC8v0YHQvtC30LTQsNC10Lwg0LjQs9GA0L7QutCwINGBINGD0L3QuNC60LDQu9GM0L3Ri9C80Lgg0LzQtdGC0L7QtNCw0LzQuFxyXG5cclxuICB2YXIgcGxheWVyID0gbmV3IFBsYXlhYmxlKHJlcy5hcnJJbWFnZXNbOV0sMCwwLDUwLDUwKTtcclxuICBwbGF5ZXIuZGlyZWN0aW9uID0gZmFsc2U7XHJcbiAgcGxheWVyLmlzTW92ZSA9IGZhbHNlO1xyXG5cclxuICBwbGF5ZXIuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgaWYodGhpcy5pc01vdmUpe1xyXG4gICAgICB0aGlzLmRyYXdBbmltYXRpb24oMywgMiwgdGhpcy5kaXJlY3Rpb24pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuZHJhd0ZyYW1lKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5kcmF3QW5pbWF0aW9uID0gZnVuY3Rpb24oZnJhbWVzLCBkZWxheSwgYW5nbGUpe1xyXG5cclxuICAgIHRoaXMuaW1nLmNhbkRyYXcgPSAoIHRoaXMuaW1nLmNhbkRyYXcgPT09IHVuZGVmaW5lZCApID8gMSA6IHRoaXMuaW1nLmNhbkRyYXc7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgdmFyIF9keCA9IHRoaXMueCtDLlBETkcgKyB0aGlzLncgLyAyO1xyXG4gICAgICB2YXIgX2R5ID0gdGhpcy55KzcxK0MuUERORyArIHRoaXMuaCAvIDI7XHJcbiAgICAgIGFuZ2xlID0gYW5nbGUgKiAoTWF0aC5QSS8xODApO1xyXG4gICAgICBjbnZzLmN0eC5zYXZlKCk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZShfZHgsX2R5KTtcclxuICAgICAgY252cy5jdHgucm90YXRlKGFuZ2xlKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKC1fZHgsLV9keSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0aGlzLmltZy5jYW5EcmF3ID09IDEpe1xyXG4gICAgICBpZiAodGhpcy5pbWcuY291bnQgPT0gZnJhbWVzKSB0aGlzLmltZy5jb3VudCA9IDE7XHJcblxyXG4gICAgICB0aGlzLmltZy5jYW5EcmF3ID0gMDtcclxuICAgICAgdGhpcy5pbWcuY291bnQgPSB0aGlzLmltZy5jb3VudCArIDEgfHwgMTtcclxuXHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICBwbGF5ZXIuaW1nLmNhbkRyYXcgPSAxO1xyXG4gICAgICB9LCAxMDAwLyhkZWxheSoyKSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY252cy5jdHguZHJhd0ltYWdlKHRoaXMuaW1nLCA1MCoodGhpcy5pbWcuY291bnQtMSksIDAsIHRoaXMudywgdGhpcy5oLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKC1DLlBETkcsIC0oNzErQy5QRE5HKSk7XHJcblxyXG4gICAgaWYgKGFuZ2xlKXtcclxuICAgICAgY252cy5jdHgucmVzdG9yZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuZHJhd0ZyYW1lID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICB2YXIgYW5nbGUgPSB0aGlzLmRpcmVjdGlvbiB8fCAwO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIHZhciBfZHggPSB0aGlzLngrQy5QRE5HICsgdGhpcy53IC8gMjtcclxuICAgICAgdmFyIF9keSA9IHRoaXMueSs3MStDLlBETkcgKyB0aGlzLmggLyAyO1xyXG4gICAgICBhbmdsZSA9IGFuZ2xlICogKE1hdGguUEkvMTgwKTtcclxuICAgICAgY252cy5jdHguc2F2ZSgpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoX2R4LF9keSk7XHJcbiAgICAgIGNudnMuY3R4LnJvdGF0ZShhbmdsZSk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtX2R4LC1fZHkpO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgY252cy5jdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLncsIHRoaXMuaCwgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtQy5QRE5HLCAtKDcxK0MuUERORykpO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIGNudnMuY3R4LnJlc3RvcmUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLnNldERpcmVjdGlvbiA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcclxuICB9O1xyXG5cclxuICByZXR1cm4gcGxheWVyO1xyXG59O1xyXG5cclxuXHJcblxyXG4vL21lbnVcclxudmFyIGxvZ28gPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzFdLCBDLldJRFRILzItNDUwLzIsIDIwLCA0NTAsIDE1MCwgXCJcIiwgXCJsb2dvXCIsIDAgKTtcclxudmFyIG1lbnUgPSBjcmVhdGVNZW51KFtcItCY0LPRgNCw0YLRjFwiLCBcItCj0YDQvtCy0L3QuFwiLCBcItCd0LDRgdGC0YDQvtC50LrQuFwiXSxbXCJwbGF5XCIsIFwiY2hhbmdlX2xldmVsXCIsIFwib3B0aW9uc1wiXSk7XHJcblxyXG5cclxuLy9iYWNrZ3JvdW5kIFxyXG52YXIgbWF0cml4ID0gY3JlYXRlTWF0cml4QkcoKTsgLy9iZyDRg9GA0L7QstC90Y9cclxudmFyIGJnTGV2ZWwgPSBuZXcgSW1hZ2UoIHJlcy5hcnJJbWFnZXNbOF0sIDAsIDAsIEMuV0lEVEgsIEMuSEVJR0hUICk7XHJcbnZhciBiZ09wYWNpdHkgPSBuZXcgUmVjdCgwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIik7XHJcblxyXG5cclxuLy9nYW1lIGhlYWRlclxyXG52YXIgaGVhZGVyID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzJdLCAwLCAwLCBDLldJRFRILCA3MStDLlBETkcgKTtcclxudmFyIGJGdWxsU2NyID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1szXSwgQy5XSURUSC00NS0yMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQ1LzIsIDQ1LCA0NSwgXCJcIiwgXCJmdWxsU2NyXCIsIDAgKTtcclxudmFyIHN0b3BXYXRjaCA9IG5ldyBCdXR0b24oIDEwLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTIwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcIjAwIDogMDAgOiAwMFwiLCBcInN0b3B3YXRjaFwiLCAyNSwgXCJkaXRlZFwiICk7XHJcbnZhciBiUGF1c2UgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzRdLCBDLldJRFRILTQ1LTctYkZ1bGxTY3Iudy0yMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQ1LzIsIDQ1LCA0NSwgXCJcIiwgXCJwYXVzZVwiLCAwICk7XHJcbnZhciBjdXJyTGV2ZWwgPSBuZXcgQnV0dG9uKCAoc3RvcFdhdGNoLngrc3RvcFdhdGNoLncrYlBhdXNlLngpLzItMTQwLzIsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCAxNDAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0KPRgNC+0LLQtdC90YxcIiwgXCJjdXJyX2xldmVsXCIsIDI1LCBcImNhcHR1cmVfaXRcIiApO1xyXG5cclxuXHJcbi8vY2hhbmdlIGxldmVsXHJcbnZhciBsZXZlbHNIZWFkZXIgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzJdLCAwLCAwLCBDLldJRFRILCA3MStDLlBETkcsIFwi0JLRi9Cx0L7RgCDRg9GA0L7QstC90Y9cIiwgXCJsZXZlbHNfaGVhZGVyXCIsIDI1ICk7XHJcbnZhciBiTGV2ZWxzQnV0dG9ucyA9IGNyZWF0ZUxldmVsc0J1dHRvbnMoNSk7XHJcbnZhciBsZXZlbHNGb290ZXIgPSBjcmVhdGVMZXZlbHNGb290ZXIoKTtcclxuXHJcblxyXG4vL3dpbiBwb3AtdXBcclxudmFyIHdpblBvcFVwID0gY3JlYXRlV2luUG9wVXAoKTtcclxuXHJcblxyXG4vL3BhdXNlIHBvcC11cFxyXG52YXIgcGF1c2VQb3BVcCA9IGNyZWF0ZVBhdXNlUG9wVXAoKTtcclxuXHJcblxyXG4vL3BsYXlhYmxlIG9ialxyXG52YXIgcGwgPSBjcmVhdGVQbGF5ZXIoKTtcclxudmFyIGJveCA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzZdLDAsMCw1MCw1MCk7IC8v0LHQvtC60YFcclxudmFyIGRvb3IgPSBuZXcgUGxheWFibGUocmVzLmFyckltYWdlc1s3XSwwLDAsNTAsNTApOyAvL9C00LLQtdGA0YxcclxudmFyIHdhbGxzID0gW107IC8v0YHRgtC10L3RiyDQvdCwINGD0YDQvtCy0L3QtSwg0LfQsNC/0L7Qu9C90Y/QtdGC0YHRjyDQstGL0LHRgNCw0L3QvdGL0Lwg0YPRgNC+0LLQvdC10LwuXHJcblxyXG5cclxuLy92aWRlb3NcclxudmFyIGFuaW1hdGVCZyA9IG5ldyBWaWRlbygwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgcmVzLmFyclZpZGVvc1swXSk7XHJcbnZhciB2aWRlb0JnTGV2ZWxzID0gbmV3IFZpZGVvKDAsIDAsIEMuV0lEVEgsIEMuSEVJR0hULCByZXMuYXJyVmlkZW9zWzFdKTtcclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RzID0ge1xyXG5cclxuICBtYXRyaXggOiBtYXRyaXgsXHJcbiAgbG9nbyA6IGxvZ28sXHJcbiAgbWVudSA6IG1lbnUsXHJcbiAgaGVhZGVyIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCA6IHN0b3BXYXRjaCxcclxuICBiUGF1c2UgOiBiUGF1c2UsXHJcbiAgYkZ1bGxTY3IgOiBiRnVsbFNjcixcclxuICBwbCA6IHBsLFxyXG4gIGJveCA6IGJveCxcclxuICBkb29yIDogZG9vcixcclxuICB3YWxscyA6IHdhbGxzLFxyXG4gIGJnTGV2ZWwgOiBiZ0xldmVsLFxyXG4gIHdpblBvcFVwIDogd2luUG9wVXAsXHJcbiAgcGF1c2VQb3BVcCA6IHBhdXNlUG9wVXAsXHJcbiAgYmdPcGFjaXR5IDogYmdPcGFjaXR5LFxyXG4gIGN1cnJMZXZlbCA6IGN1cnJMZXZlbCxcclxuICBsZXZlbHNIZWFkZXIgOiBsZXZlbHNIZWFkZXIsXHJcbiAgYkxldmVsc0J1dHRvbnMgOiBiTGV2ZWxzQnV0dG9ucyxcclxuICBsZXZlbHNGb290ZXIgOiBsZXZlbHNGb290ZXIsXHJcbiAgYW5pbWF0ZUJnIDogYW5pbWF0ZUJnLFxyXG4gIHZpZGVvQmdMZXZlbHMgOiB2aWRlb0JnTGV2ZWxzLFxyXG4gIFBSRUxPQURFUiA6IG5ldyBSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hULFwiYmxhY2tcIilcclxuICBcclxufTtcclxuIiwidmFyIHJlc291cnNlcyA9IHtcclxuICBpbWFnZXMgOiBmYWxzZSxcclxuICB2aWRlbyA6IGZhbHNlLFxyXG5cclxuICBhcmVMb2FkZWQgOiBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHRoaXMudmlkZW8gJiYgdGhpcy5pbWFnZXNcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlkZW8oYXJyU3Jjc09mVmlkZW8pe1xyXG5cclxuICB2YXIgYXJyVmlkZW9zID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZlZpZGVvLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgIHZpZGVvLnNyYyA9IGFyclNyY3NPZlZpZGVvW2ldO1xyXG4gICAgdmlkZW8ub25jYW5wbGF5dGhyb3VnaCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGxvYWRDb3VudCsrO1xyXG4gICAgICB2aWRlby5sb29wID0gdHJ1ZTtcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMudmlkZW8gPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBhcnJWaWRlb3MucHVzaCh2aWRlbyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJWaWRlb3M7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2VzKGFyclNyY3NPZkltYWdlcyl7XHJcblxyXG4gIHZhciBhcnJJbWFnZXMgPSBbXTsgXHJcbiAgdmFyIGNvdW50ID0gYXJyU3Jjc09mSW1hZ2VzLmxlbmd0aDtcclxuICB2YXIgbG9hZENvdW50ID0gMDtcclxuXHJcbiAgZm9yKHZhciBpPTA7IGk8Y291bnQ7IGkrKyl7XHJcblxyXG4gICAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgaW1nLnNyYyA9IGFyclNyY3NPZkltYWdlc1tpXTtcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICBsb2FkQ291bnQrKztcclxuICAgICAgaWYgKCBsb2FkQ291bnQgPT0gY291bnQgKSByZXNvdXJzZXMuaW1hZ2VzID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGFyckltYWdlcy5wdXNoKGltZyk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhcnJJbWFnZXM7XHJcbn07XHJcblxyXG52YXIgYXJyVmlkZW9zID0gbG9hZFZpZGVvKFtcclxuICBcInZpZGVvL2JnLm1wNFwiLFxyXG4gIFwidmlkZW8vTGlnaHRtaXJyb3IubXA0XCJcclxuXSk7XHJcblxyXG52YXIgYXJySW1hZ2VzID0gbG9hZEltYWdlcyhbXHJcbiAgXCJpbWcvYnV0dG9uLW1lbnUuc3ZnXCIsICAgICAgICAgLy8wIFxyXG4gIFwiaW1nL2xvZ28ucG5nXCIsICAgICAgICAgICAgICAgIC8vMSBcclxuICBcImltZy9oZWFkZXIzLnN2Z1wiLCAgICAgICAgICAgICAvLzIgXHJcbiAgXCJpbWcvZnVsbHNjcmVlbi5zdmdcIiwgICAgICAgICAgLy8zIFxyXG4gIFwiaW1nL3BhdXNlLnN2Z1wiLCAgICAgICAgICAgICAgIC8vNCBcclxuICBcImltZy93YWxsLnN2Z1wiLCAgICAgICAgICAgICAgICAvLzUgXHJcbiAgXCJpbWcvY3J5c3RhbGwtMDEuc3ZnXCIsICAgICAgICAgLy82IFxyXG4gIFwiaW1nL3BvcnRhbC5zdmdcIiwgICAgICAgICAgICAgIC8vNyBcclxuICBcImltZy9ncm91bmQuanBnXCIsICAgICAgICAgICAgICAvLzggXHJcbiAgJ2ltZy9wbGF5ZXIucG5nJywgICAgICAgICAgICAgIC8vOSBcclxuICBcImltZy9leGl0LWJ1dHRvbi5zdmdcIiwgICAgICAgICAvLzEwXHJcbiAgXCJpbWcvcmVzdGFydC1idXR0b24uc3ZnXCIsICAgICAgLy8xMVxyXG4gIFwiaW1nL2V4aXRfaW5fbWVudS1idXR0b24uc3ZnXCIsIC8vMTJcclxuICBcImltZy9wYXVzZS1iZy5zdmdcIiwgICAgICAgICAgICAvLzEzXHJcbiAgXCJpbWcvcGF1c2VfdGV4dC5zdmdcIiwgICAgICAgICAgLy8xNFxyXG4gIFwiaW1nL2J1dHRvbl9uZXh0LnN2Z1wiLCAgICAgICAgIC8vMTVcclxuICBcImltZy9iZ193aW4uc3ZnXCIsICAgICAgICAgICAgICAvLzE2XHJcbiAgXCJpbWcvbGV2ZWxzXzIuc3ZnXCIsICAgICAgICAgICAgLy8xN1xyXG4gIFwiaW1nL2xldmVsc19uZXh0LnN2Z1wiLCAgICAgICAgIC8vMThcclxuICBcImltZy9sZXZlbHNfcHJldi5zdmdcIiwgICAgICAgICAvLzE5XHJcbiAgXCJpbWcvbGV2ZWxzX2luX21lbnUuc3ZnXCIsICAgICAgLy8yMFxyXG5cclxuICBcImltZy9ob3ZlcnMvYnV0dG9uLW1lbnVfaG92ZXIuc3ZnXCIgLy8yMVxyXG5dKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcbiAgcmVzb3Vyc2VzIDogcmVzb3Vyc2VzLFxyXG5cclxuICBhcnJWaWRlb3MgOiBhcnJWaWRlb3MsXHJcblxyXG4gIGFyckltYWdlcyA6IGFyckltYWdlcyAgXHJcblxyXG59O1xyXG5cclxuXHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vX2dhbWVMb29wcy5qcycpO1xyXG5cclxudmFyIHBhdXNlID0gMDtcclxudmFyIGJlZ2luVGltZSA9IDA7XHJcbnZhciBjdXJyZW50VGltZSA9IDA7XHJcbnZhciB1cFRpbWVUTztcclxuXHJcbmZ1bmN0aW9uIHVwVGltZShjb3VudEZyb20pIHtcclxuXHR2YXIgbm93ID0gbmV3IERhdGUoKTtcclxuXHR2YXIgZGlmZmVyZW5jZSA9IChub3ctY291bnRGcm9tICsgY3VycmVudFRpbWUpO1xyXG5cclxuXHR2YXIgaG91cnM9TWF0aC5mbG9vcigoZGlmZmVyZW5jZSUoNjAqNjAqMTAwMCoyNCkpLyg2MCo2MCoxMDAwKSoxKTtcclxuXHR2YXIgbWlucz1NYXRoLmZsb29yKCgoZGlmZmVyZW5jZSUoNjAqNjAqMTAwMCoyNCkpJSg2MCo2MCoxMDAwKSkvKDYwKjEwMDApKjEpO1xyXG5cdHZhciBzZWNzPU1hdGguZmxvb3IoKCgoZGlmZmVyZW5jZSUoNjAqNjAqMTAwMCoyNCkpJSg2MCo2MCoxMDAwKSklKDYwKjEwMDApKS8xMDAwKjEpO1xyXG5cclxuXHRob3VycyA9ICggaG91cnMgPCAxMCkgPyBcIjBcIitob3VycyA6IGhvdXJzO1xyXG5cdG1pbnMgPSAoIG1pbnMgPCAxMCkgPyBcIjBcIittaW5zIDogbWlucztcclxuXHRzZWNzID0gKCBzZWNzIDwgMTApID8gXCIwXCIrc2VjcyA6IHNlY3M7XHJcblxyXG5cdG8uc3RvcFdhdGNoLnR4dCA9IGhvdXJzK1wiIDogXCIrbWlucytcIiA6IFwiK3NlY3M7XHJcblxyXG5cdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblx0dXBUaW1lVE89c2V0VGltZW91dChmdW5jdGlvbigpeyB1cFRpbWUoY291bnRGcm9tKTsgfSwxMDAwLzYwKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcblx0c3RhcnQgOiBmdW5jdGlvbigpIHtcclxuXHRcdC8vIGlmIChnYW1lLnN0YXR1cyA9PSAnZ2FtZScgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcIm1lbnVcIiB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwicGF1c2VcIiB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibGV2ZWxzXCIpIHtcclxuXHRcdFx0dXBUaW1lKG5ldyBEYXRlKCkpO1xyXG5cdFx0XHR2YXIgbm93VCA9IG5ldyBEYXRlKCk7XHJcblx0XHRcdGJlZ2luVGltZSA9IG5vd1QuZ2V0VGltZSgpO1xyXG5cdFx0Ly8gfSBlbHNlIHtcclxuXHRcdC8vIFx0dGhpcy5yZXNldCgpO1xyXG5cdFx0Ly8gfTtcclxuXHR9LFxyXG5cclxuXHRyZXNldCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y3VycmVudFRpbWUgPSAwO1xyXG5cdFx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHJcblx0XHRvLnN0b3BXYXRjaC50eHQgPSBcIjAwIDogMDAgOiAwMFwiO1xyXG5cdFx0Ly8gdGhpcy5zdGFydCgpO1xyXG5cdH0sXHJcblxyXG5cdHBhdXNlVGltZXIgOiBmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGN1ckRhdGEgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0Y3VycmVudFRpbWUgPSBjdXJEYXRhLmdldFRpbWUoKSAtIGJlZ2luVGltZSArIGN1cnJlbnRUaW1lO1xyXG5cdFx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR9XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IsIHR4dCwgbmFtZSwgZlNpemUsIGZvbnRGYW0pe1xyXG4gIFxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG4gIHRoaXMudHh0Q29sb3IgPSBcIndoaXRlXCI7XHJcbiAgdGhpcy5mb250RmFtID0gZm9udEZhbSB8fCBcIkFyaWFsXCI7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKG5vQ2VudGVyLCBwYWRkKXtcclxuXHJcbiAgICB2YXIgX3BhZGQgPSBwYWRkIHx8IDU7XHJcbiAgICB2YXIgX3ggPSAoICFub0NlbnRlciApID8gdGhpcy54K3RoaXMudy8yIDogdGhpcy54K19wYWRkO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMudHh0Q29sb3I7XHJcbiAgICBjdHgudGV4dEFsaWduID0gKCAhbm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggJyt0aGlzLmZvbnRGYW07XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoLCBvcGFjaXR5KXtcclxuXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLm9wYWNpdHkgPSBvcGFjaXR5IHx8IDE7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4Lmdsb2JhbEFscGhhID0gdGhpcy5vcGFjaXR5O1xyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgfTtcclxuXHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1nQnV0dG9uID0gZnVuY3Rpb24oaW1nLCB4LCB5LCB3LCBoLCB0eHQsIG5hbWUsIGZTaXplLCBzZXRDZW50ZXIsIG5vQ2VudGVyLCBwYWRkKXtcclxuXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmltZyA9IGltZztcclxuICB0aGlzLnR4dCA9IHR4dDtcclxuICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIHRoaXMuZlNpemUgPSBmU2l6ZTtcclxuICB0aGlzLnR4dENvbG9yID0gXCJ3aGl0ZVwiO1xyXG4gIHRoaXMuc2V0Q2VudGVyID0gc2V0Q2VudGVyIHx8IHRoaXMueDtcclxuICB0aGlzLm5vQ2VudGVyID0gbm9DZW50ZXIgfHwgZmFsc2U7XHJcbiAgdGhpcy5wYWRkID0gcGFkZCB8fCA1O1xyXG4gIHRoaXMuaG92ZXJJbWcgPSBmYWxzZTtcclxuXHJcbiAgdmFyIG1ldHJpY3MgPSBjdHgubWVhc3VyZVRleHQodGhpcy50eHQpLndpZHRoO1xyXG4gIHZhciBfeCA9ICggIXRoaXMubm9DZW50ZXIgKSA/IHRoaXMuc2V0Q2VudGVyK3RoaXMudy8yIDogdGhpcy54K3RoaXMucGFkZDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIXRoaXMubm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggY2FwdHVyZV9pdCc7XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxuICB2YXIgX2ltZyA9IGZhbHNlOyAvL9Cx0YPQtNC10YIg0YXRgNCw0L3QuNGC0Ywg0LLRgNC10LzQtdC90L3QviDQutCw0YDRgtC40L3QutGDINGB0YLQsNC90LTQsNGA0YLQvdGD0Y4uXHJcblxyXG4gIHRoaXMuaG92ZXIgPSBmdW5jdGlvbihkcmF3KXtcclxuXHJcbiAgICAvLyBpZiAodGhpcy5ob3ZlckltZykgeyAgICAgICAgICAgICAgICAgICAgIC8v0LXRgdC70Lgg0L3QsNCy0LXQu9C4INC4INC/0LXRgNC10LTQsNC70Lgg0LrQsNGA0YLQuNC90LrRgyDQtNC70Y8g0Y3RgtC+0LPQviwg0YLQvlxyXG4gICAgLy8gICBpZiAoIV9pbWcpIF9pbWcgPSB0aGlzLmltZzsgICAgICAgICAgICAvLyDQtdGB0LvQuCDQtdGJ0LUg0L3QtSDQsdGL0LvQsCDRgdC+0YXRgNCw0L3QtdC90LAg0YHRgtCw0L3QtNCw0YDRgtC90LDRjyDQutCw0YDRgtC40L3QutCwLCDRgtC+INGB0L7RhdGA0LDQvdGP0LXQvCDQuC4uXHJcbiAgICAvLyAgIHRoaXMuaW1nID0gdGhpcy5ob3ZlckltZzsgICAgICAgICAgICAgIC8vLi7QvdC+0LLQvtC5INCx0YPQtNC10YIg0LLRi9Cy0L7QtNC40YLRgdGPINC/0LXRgNC10LTQsNC90L3QsNGPXHJcbiAgICAvLyAgIGNudi5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjsgICAgICAgICAgLy/QuCDQutGD0YDRgdC+0YAg0LHRg9C00LXRgiDQv9C+0LjQvdGC0LXRgFxyXG4gICAgLy8gfSBlbHNlIGlmICggX2ltZyAmJiBfaW1nICE9IHRoaXMuaW1nKXsgICAvL9C40L3QsNGH0LUg0LXRgdC70Lgg0LHRi9C70LAg0YHQvtGF0YDQsNC90LXQvdCwINC60LDRgNGC0LjQvdC60LAg0Lgg0L3QtSDQvtC90LAg0LIg0LTQsNC90L3Ri9C5INC80L7QvNC10L3RgiDQvtGC0YDQuNGB0L7QstGL0LLQsNC10YLRgdGPLCDRgtC+XHJcbiAgICAvLyAgIHRoaXMuaW1nID0gX2ltZzsgICAgICAgICAgICAgICAgICAgICAgIC8v0LLQvtC30LLRgNCw0YnQsNC10Lwg0YHRgtCw0L3QtNCw0YDRgiDQutCw0YDRgtC40L3QutGDINC90LAg0LzQtdGB0YLQvlxyXG4gICAgLy8gICBjbnYuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7ICAgICAgICAgIC8v0Lgg0LrRg9GA0YHQvtGAINC00LXQu9Cw0LXQvCDRgdGC0LDQvdC00LDRgNGC0L3Ri9C8XHJcbiAgICAvLyB9O1xyXG5cclxuICAgIGlmIChkcmF3ICYmIHRoaXMuaG92ZXJJbWcpIHsgICAgICAgICAgICAgLy/QtdGB0LvQuCDQv9C10YDQtdC00LDQu9C4INC40YHRgtC40L3RgyDQuCDRhdC+0LLQtdGAINGDINGN0YLQvtCz0L4g0L7QsdGK0LXQutGC0LAg0LXRgdGC0YwsINGC0L4g0L7RgtGA0LjRgdC+0LLRi9Cy0LDQtdC8INGF0L7QstC10YBcclxuICAgICAgaWYgKCFfaW1nKSBfaW1nID0gdGhpcy5pbWc7ICAgICAgICAgICAgLy8g0LXRgdC70Lgg0LXRidC1INC90LUg0LHRi9C70LAg0YHQvtGF0YDQsNC90LXQvdCwINGB0YLQsNC90LTQsNGA0YLQvdCw0Y8g0LrQsNGA0YLQuNC90LrQsCwg0YLQviDRgdC+0YXRgNCw0L3Rj9C10Lwg0LguLlxyXG4gICAgICB0aGlzLmltZyA9IHRoaXMuaG92ZXJJbWc7ICAgICAgICAgICAgICAvLy4u0L3QvtCy0L7QuSDQsdGD0LTQtdGCINCy0YvQstC+0LTQuNGC0YHRjyDQv9C10YDQtdC00LDQvdC90LDRj1xyXG4gICAgICBjbnYuc3R5bGUuY3Vyc29yID0gXCJwb2ludGVyXCI7ICAgICAgICAgIC8v0Lgg0LrRg9GA0YHQvtGAINCx0YPQtNC10YIg0L/QvtC40L3RgtC10YBcclxuICAgIH0gZWxzZSBpZiAoIF9pbWcgJiYgX2ltZyAhPSB0aGlzLmltZyl7ICAgLy/QuNC90LDRh9C1INC10YHQu9C4INCx0YvQu9CwINGB0L7RhdGA0LDQvdC10L3QsCDQutCw0YDRgtC40L3QutCwINC4INC90LUg0L7QvdCwINCyINC00LDQvdC90YvQuSDQvNC+0LzQtdC90YIg0L7RgtGA0LjRgdC+0LLRi9Cy0LDQtdGC0YHRjywg0YLQvlxyXG4gICAgICB0aGlzLmltZyA9IF9pbWc7ICAgICAgICAgICAgICAgICAgICAgICAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdC8INGB0YLQsNC90LTQsNGA0YIg0LrQsNGA0YLQuNC90LrRgyDQvdCwINC80LXRgdGC0L5cclxuICAgICAgY252LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiOyAgICAgICAgICAvL9C4INC60YPRgNGB0L7RgCDQtNC10LvQsNC10Lwg0YHRgtCw0L3QtNCw0YDRgtC90YvQvFxyXG4gICAgfTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGxheWFibGUgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVjdCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCBpc1N0cm9rZSl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgdGhpcy5pc1N0cm9rZSA9IGlzU3Ryb2tlIHx8IGZhbHNlO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKCF0aGlzLmlzU3Ryb2tlKSB7XHJcbiAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgIGN0eC5zdHJva2VSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJylcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVmlkZW8gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCB2aWRlbyl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy52aWRlbyA9IHZpZGVvO1xyXG5cclxuICB2YXIgc2F2ZSA9IGZhbHNlO1xyXG4gIHZhciBidWZDbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG4gIHZhciBidWZDdHggPSBidWZDbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gIGJ1ZkNudi53aWR0aCA9IEMuV0lEVEg7XHJcbiAgYnVmQ252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMudmlkZW8pIHtcclxuICAgICAgaWYgKCAhc2F2ZSApe1xyXG4gICAgICAgIGJ1ZkN0eC5kcmF3SW1hZ2UodGhpcy52aWRlbywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgICAgICBzYXZlID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgICAgXHJcbiAgICAgIHRoaXMudmlkZW8ucGxheSgpO1xyXG4gICAgICBjYW52YXMuY3R4LmRyYXdJbWFnZShidWZDbnYsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgIGNhbnZhcy5jdHguZHJhd0ltYWdlKHRoaXMudmlkZW8sIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgfTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2FsbCA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpLFxyXG5QbGF5ZWJsZSAgPSByZXF1aXJlKCcuL2NsYXNzZXMvUGxheWFibGUuanMnKSxcclxuV2FsbCAgICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1dhbGwuanMnKSxcclxuSW1nQnV0dG9uID0gcmVxdWlyZSgnLi9jbGFzc2VzL0ltZ0J1dHRvbi5qcycpLFxyXG5WaWRlbyAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvVmlkZW8uanMnKSxcclxuQnV0dG9uICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0J1dHRvbi5qcycpLFxyXG5SZWN0ICAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvUmVjdC5qcycpLFxyXG5JbWFnZSAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1hZ2UuanMnKSxcclxuQyAgICAgICAgID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKSxcclxuZXZlbnRzICAgID0gcmVxdWlyZSgnLi9fZXZlbnRzLmpzJyksXHJcbmxldmVscyAgICA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpLFxyXG5vICAgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyksXHJcbmNudnMgICAgICA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpLFxyXG5rZXkgXHQgID0gcmVxdWlyZSgnLi9fa2V5LmpzJyk7XHJcblxyXG5lbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLmxvYWRlcik7XHJcblxyXG4vLyDQvdCw0L/RgNCw0LLQu9C10L3QuNC1INC/0LXRgNGB0L7QvdCw0LbQsCDQsiDRg9GA0L7QstC90Y/RhVxyXG4vLyDQvdCw0YHRgtGA0L7QudC60LggLSDRiNC+0LEg0YLQsNC8INGD0L/RgNCw0LLQu9GP0YLRjCDRgNCw0LfQvNC10YDQsNC80Lgg0L3QsNCy0LXRgNC90L7QtS4uINGF0Lcg0L/QvtC60LBcclxuLy8g0YXQvtCy0LXRgNGLINC90LDQtCDQutC90L7Qv9C60LDQvNC4IC0g0YXQvtGC0Y/QsdGLINC80LDRg9C3INC/0L7QuNC90YLQtdGALlxyXG4vLyDQvNGD0LfRi9C60YMg0LTRg9C80LDRgtGMXHJcbi8vINC/0YDQtdC70L7QsNC00LXRgCDQt9Cw0L/QuNC70LjRgtGMXHJcblxyXG4vLyDRhdCw0LnQtNC40YLRjCDQutC90L7Qv9C60Lgg0LIg0LLRi9Cx0L7RgNC1INGD0YDQvtCy0L3RjyJdfQ==
