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

    case "game" :
      if ( isCursorInButton(x,y,o.bPause) ){
        console.log("PAUSE");
        // document.body.style.cursor = "pointer";
      };

      if ( isCursorInButton(x,y,o.bFullScr) ){
        console.log("FULL");
        // document.body.style.cursor = "pointer";
      };
      break;

  };
};
},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_fullScreen.js":5,"./_gameLoops.js":6,"./_helperFunctions.js":7,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./_stopwatch.js":12}],5:[function(require,module,exports){
var canvas = require('./_canvas.js');
var C = require('./_const.js');

var zoom = 0;

function fullCanvas(){

	var deviceWidth = window.screen.availWidth;
	var deviceHeight = window.screen.availHeight;
	zoom = (deviceHeight / C.HEIGHT).toFixed(1);

	canvas.cnv.width = canvas.cnv.width*zoom;
	canvas.cnv.height = canvas.cnv.height*zoom;
	canvas.ctx.scale(zoom,zoom);
};

function normalCanvas(){
	canvas.cnv.width = canvas.cnv.width/zoom;
	canvas.cnv.height = canvas.cnv.height/zoom;
	canvas.ctx.scale(1,1);
};

module.exports = { 

	launchFullScreen : function(elem){

		if ( elem.requestFullScreen ){
			elem.requestFullScreen();
		} else if ( elem.mozRequestFullScreen ){
			elem.mozRequstFullScreen();
		} else if ( elem.webkitRequestFullScreen ){
			elem.webkitRequestFullScreen();
		};

		fullCanvas();
		this.isFullScreen = true; 
	},

	canselFullScreen : function(){

		if ( document.exitFullscreen ){
			document.exitFullscreen();
		} else if ( document.mozCancelFullScreen ){
			document.mozCancelFullScreen();
		} else if ( document.webkitExitFullscreen ){
			document.webkitExitFullscreen();
		};

		normalCanvas();
		this.isFullScreen = false;
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


function createMatrixBG(){
  var matrix = []; //массив для матричного вида уровня

  for (var i = 0; i < 9; i++){ //заполняем объект
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
    menu.push( new ImgButton( res.arrImages[0], _x, _y+i*85, 300, 60, txt[i], names[i], _fontsize, 135 ) );
  };

  return menu;
};

function createWinPopUp(){

  var winPopBG = new Image( res.arrImages[16], C.WIDTH/2-320/2, C.HEIGHT/2-200/2, 320, 200);
  var bPopExit = new ImgButton( res.arrImages[12], winPopBG.x+30,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_exit", 0 );
  var bPopNext = new ImgButton( res.arrImages[15], winPopBG.x+30+110+80,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_next", 0 );

  var winText = new Button( C.WIDTH/2-90/2, winPopBG.y+15, 90, 40, "transparent", "Уровень N", "win_text", 30, "Buccaneer" );
  var winText_2 = new Button( C.WIDTH/2-90/2+10, winPopBG.y+80, 90, 40, "transparent", "пройден!", "win_text_2", 50, "aZZ_Tribute_Bold" );

  winText.txtColor = "#D9C425";

  var winPopUp = [];
  winPopUp.push(winPopBG, bPopExit, bPopNext, winText, winText_2);

  return winPopUp;
};

function createPausePopUp(){

  var pausePopUp = [];
  var bgPause = new Image( res.arrImages[13], C.WIDTH/2-300/2, C.HEIGHT/2-207/2, 300, 207);
  var bReturn = new ImgButton( res.arrImages[10], bgPause.x+190,  bgPause.y-25, 63, 57, "", "return", 0 );
  var bExitToMenu = new ImgButton( res.arrImages[12],  bgPause.x+50,  bgPause.y+bgPause.h-50, 85, 70, "", "exit", 0 );
  var bRestart = new ImgButton( res.arrImages[11],  bgPause.x+50+30+85,  bgPause.y+bgPause.h-50, 85, 70, "", "restart", 0 );
  var pauseText = new Image( res.arrImages[14], bgPause.x + bgPause.w/2 - 150/2, bgPause.y + bgPause.h/2 - 100/2, 150, 100);

  pausePopUp.push(bgPause, bReturn, bExitToMenu, bRestart, pauseText);

  return pausePopUp;
};

function createLevelsButtons(levels_count){

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

function createLevelsFooter(){

  var levelsFooter = [];

  var bPrev = new ImgButton( res.arrImages[19], 20, C.HEIGHT-10-67, 40, 67, "", "prev", 0 );
  var bNext = new ImgButton( res.arrImages[18], C.WIDTH-20-40, C.HEIGHT-10-67, 40, 67, "", "next", 0 );
  var bToMenu = new ImgButton( res.arrImages[20], C.WIDTH/2 - 320/2, C.HEIGHT-10-67, 320, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.txtColor = "#000046";

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
    // video.onloadeddata = function(){
      video.oncanplaythrough = function(){
        loadCount++;
        video.loop = true;
        if ( loadCount == count ) resourses.video = true;
      };
    // };

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
  "img/button-menu.svg",     //0
  "img/logo.png",            //1
  "img/header3.svg",         //2
  "img/fullscreen.svg",      //3
  "img/pause.svg",           //4
  "img/wall.svg",            //5
  "img/crystall-01.svg",     //6
  "img/portal.svg",          //7
  "img/ground.jpg",          //8
  'img/player.png',          //9
  "img/exit-button.svg",     //10
  "img/restart-button.svg",  //11
  "img/exit_in_menu-button.svg", //12
  "img/pause-bg.svg",        //13
  "img/pause_text.svg",      //14
  "img/button_next.svg",     //15
  "img/bg_win.svg",          //16
  "img/levels_2.svg",        //17
  "img/levels_next.svg",     //18
  "img/levels_prev.svg",     //19
  "img/levels_in_menu.svg"   //20
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

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_key.js":8,"./_levels.js":9,"./_objects.js":10,"./classes/Button.js":13,"./classes/Image.js":14,"./classes/ImgButton.js":15,"./classes/Playable.js":16,"./classes/Rect.js":17,"./classes/Video.js":18,"./classes/Wall.js":19}]},{},[20])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19rZXkuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fcmVzb3Vyc2VzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX3N0b3B3YXRjaC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvQnV0dG9uLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9JbWFnZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvSW1nQnV0dG9uLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9QbGF5YWJsZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvUmVjdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvVmlkZW8uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1dhbGwuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9mYWtlX2EyODliMjI1LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBjbnYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxudmFyIGN0eCA9IGNudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG5jbnYuc3R5bGUuYm9yZGVyID0gXCIycHggc29saWQgYmxhY2tcIjtcclxuY252LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcclxuY252LndpZHRoID0gQy5XSURUSDtcclxuY252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGNudiA6IGNudixcclxuXHJcblx0Y3R4IDogY3R4XHJcblxyXG59OyIsInZhciBQQUREID0gMTsgXHRcdFx0XHRcdFx0Ly/Qv9Cw0LTQtNC40L3Qsywg0LrQvtGC0L7RgNGL0Lkg0Y8g0YXQvtGH0YMg0YfRgtC+0LHRiyDQsdGL0LssINC80LXQtiDQutCy0LDQtNGA0LDRgtCw0LzQuFxyXG52YXIgV0lEVEggPSBQQUREICsgKFBBREQrNTApKjk7IFx0Ly/RiNC40YDQuNC90LAg0LrQsNC90LLRi1xyXG52YXIgSEVJR0hUID0gMjArUEFERCArIChQQUREKzUwKSoxMDsgICAvL9Cy0YvRgdC+0YLQsCDQutCw0L3QstGLXHJcbnZhciBDTlZfQk9SREVSID0gMjtcclxudmFyIEhFQURFUl9IID0gNzE7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0UERORyA6IFBBREQsXHJcblxyXG5cdFdJRFRIIDogV0lEVEgsXHJcblxyXG5cdEhFSUdIVCA6IEhFSUdIVCxcclxuXHJcblx0Q05WX0JPUkRFUiA6IENOVl9CT1JERVIsXHJcblxyXG5cdEhFQURFUl9IIDogSEVBREVSX0hcclxuXHJcbn07XHJcbiIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKtC60YDQvtGB0LHRgNCw0YPQt9C10YDQvdC+0LUg0YPQv9GA0LLQu9C10L3QuNC1INGG0LjQutC70LDQvNC4INC40LPRgNGLKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRnYW1lRW5naW5lU3RhcnQgOiBmdW5jdGlvbiAoY2FsbGJhY2spe1xyXG5cdFx0Z2FtZUVuZ2luZSA9IGNhbGxiYWNrO1xyXG5cdFx0Z2FtZUVuZ2luZVN0ZXAoKTtcclxuXHR9LFxyXG5cclxuXHRzZXRHYW1lRW5naW5lIDogZnVuY3Rpb24oY2FsbGJhY2spe1xyXG5cdFx0Z2FtZUVuZ2luZSA9IGNhbGxiYWNrO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgc3cgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIGZzID0gcmVxdWlyZSgnLi9fZnVsbFNjcmVlbi5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBrZXkgPSByZXF1aXJlKCcuL19rZXkuanMnKTtcclxuXHJcbnZhciBnYW1lTG9vcHMgPSBnTG9vO1xyXG5cclxudmFyIGlzQm9yZGVyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiDQvtCx0YrQtdC60YIsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC+0LzQuSDQs9GA0LDQvdC40YbRiyDQutCw0L3QstGLXHJcbiAgdXAgOiBmdW5jdGlvbihvYmope1xyXG4gICAgcmV0dXJuIG9iai55ID09IDA7XHJcbiAgfSxcclxuXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnkgPT0gQy5IRUlHSFQgLSBvYmouaCAtIEMuUERORyAtIEMuSEVBREVSX0ggLSBDLlBETkc7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gMDtcclxuICB9LFxyXG5cclxuICByaWdodCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gQy5XSURUSCAtIG9iai53IC0gQy5QRE5HIC0gQy5QRE5HXHJcbiAgfVxyXG59O1xyXG5cclxudmFyIGlzTmVhciA9IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIgMiDQvtCx0YrQtdC60YLQsCwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10LzQvtC5INGB0YLQvtGA0L7QvdGLIDHRi9C5INC+0YIgMtCz0L4uXHJcblxyXG4gIHVwIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueSArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzIueSArIG9ial8yLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnkgJiYgb2JqXzEueCA9PSBvYmpfMltpXS54O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gIH0sXHJcblxyXG4gIGxlZnQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS54ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi54ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9LFxyXG5cclxuICByaWdodCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGRpcmVjdGlvbklzKGRpcmVjdGlvbil7ICAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGD0LPQvtC7INC/0L7QstC+0YDQvtGC0LAg0LIg0LPRgNCw0LTRg9GB0LDRhVxyXG5cclxuICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuXHJcbiAgICBjYXNlIFwidXBcIiAgIDogcmV0dXJuIDM2MDtcclxuICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImRvd25cIiA6IHJldHVybiAxODA7XHJcbiAgICBicmVhaztcclxuICAgIGNhc2UgXCJsZWZ0XCIgOiByZXR1cm4gMjcwO1xyXG4gICAgYnJlYWs7XHJcbiAgICBjYXNlIFwicmlnaHRcIjogcmV0dXJuIDkwO1xyXG4gICAgYnJlYWs7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjYW5Nb3ZlT2JqKGRpcmVjdGlvbil7ICAvLyjQvtC/0LjRgdGL0LLQsNC10Lwg0LPRgNCw0L3QuNGG0Ysg0LTQstC40LbQtdC90LjRjykg0YDQsNC30YDQtdGI0LDQtdGCINC00LLQuNC20LXQvdC40LUg0LIg0L/RgNC10LTQtdC70LDRhSDRg9GA0L7QstC90Y9cclxuXHJcbiAgby5wbC5kaXJlY3Rpb24gPSBvLnBsLmlzTW92ZSA9IGRpcmVjdGlvbklzKGRpcmVjdGlvbik7XHJcbiAgaWYgKCBpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5ib3gpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLmJveCwgby53YWxscykgKXsgLy/QtdGB0LvQuCDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDRj9GJ0LjQuiDQvdC1INGDINCz0YDQsNC90LjRhiwg0LTQstC40LPQsNC10LwuXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIG8uYm94Lm1vdmUoZGlyZWN0aW9uKTtcclxuICB9IGVsc2UgaWYoICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0oby5wbCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0L3QtSDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0LPRgNCw0L3QuNGG0LXQuSwg0LTQstC40LPQsNC10LzRgdGPLlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNDdXJzb3JJbkJ1dHRvbih4LHksYnV0KXsgLy/QstC+0LfQstGA0LDRidCw0LXRgiDRgtGA0YMsINC10YHQu9C4INC60YPRgNGB0L7RgCDQv9C+0L/QsNC7INCyINC60L7QvtGA0LTQuNC90LDRgtGLINC+0LHRitC10LrRgtCwXHJcbiAgcmV0dXJuIHggPj0gYnV0LnggJiYgXHJcbiAgeCA8PSBidXQueCtidXQudyAmJiBcclxuICB5ID49IGJ1dC55ICYmIFxyXG4gIHkgPD0gYnV0LnkrYnV0LmhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGxvYWRMZXZlbChudW1iZXIpeyAvL9C30LDQs9GA0YPQt9C60LAg0YPRgNC+0LLQvdGPXHJcbiAgc3cuc3RhcnQoKTtcclxuICBsZXZlbHNbbnVtYmVyXSgpOyBcclxuICBnYW1lTG9vcHMuY3VycmVudExldmVsID0gbnVtYmVyOyBcclxuICBvLmN1cnJMZXZlbC50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK251bWJlcjtcclxuICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5nYW1lKTtcclxufTtcclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQutC70LDQstC40YhcclxuXHJcbiAgaWYgKCBnTG9vLnN0YXR1cyA9PSBcImdhbWVcIiApeyAvL9C/0LXRgNC10LTQstC40LPQsNGC0YzRgdGPINGC0L7Qu9GM0LrQviDQtdGB0LvQuCDQuNC00LXRgiDQuNCz0YDQsC5cclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJEXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcInJpZ2h0XCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIlNcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwiZG93blwiKTtcclxuXHJcbiAgICBpZiAoIGtleS5pc0tleURvd24oXCJXXCIpIClcclxuICAgICAgY2FuTW92ZU9iaihcInVwXCIpO1xyXG5cclxuICAgIGlmICgga2V5LmlzS2V5RG93bihcIkFcIikgKVxyXG4gICAgICBjYW5Nb3ZlT2JqKFwibGVmdFwiKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgd2luZG93Lm9ua2V5dXAgPSBmdW5jdGlvbihlKXtcclxuICAgIG8ucGwuaXNNb3ZlID0gZmFsc2U7XHJcbiAgfTtcclxufTtcclxuXHJcbndpbmRvdy5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGUpeyAvL2PQvtCx0YvRgtC40LUg0L3QsNC20LDRgtC40Y8g0LzRi9GI0LrQuFxyXG5cclxuICBpZiAoIGZzLmlzRnVsbFNjcmVlbiApeyAgICAgIFxyXG4gICAgdmFyIHggPSAoZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQpL2ZzLnpvb207XHJcbiAgICB2YXIgeSA9IChlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wKS9mcy56b29tO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgeCA9IGUucGFnZVgtY2FudmFzLmNudi5vZmZzZXRMZWZ0O1xyXG4gICAgdmFyIHkgPSBlLnBhZ2VZLWNhbnZhcy5jbnYub2Zmc2V0VG9wO1xyXG4gIH07XHJcblxyXG4gIHN3aXRjaCAoZ0xvby5zdGF0dXMpe1xyXG5cclxuICAgIGNhc2UgXCJtZW51XCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLm1lbnVbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInBsYXlcIiA6XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiY2hhbmdlX2xldmVsXCIgOlxyXG4gICAgICAgICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy5sZXZlbHMpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJsZXZlbHNcIiA6XHJcbiAgICAgIGZvciAoIGkgaW4gby5sZXZlbHNGb290ZXIgKXtcclxuICAgICAgICBpZiAoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ubGV2ZWxzRm9vdGVyW2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLmxldmVsc0Zvb3RlcltpXS5uYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwicHJldlwiIDpcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0L3QsNC30LDQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwidG9fbWVudVwiIDpcclxuICAgICAgICAgICAgZW5naW4uc2V0R2FtZUVuZ2luZShnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcIm5leHRcIiA6XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi0JrQvdC+0L/QutCwINCy0L/QtdGA0LXQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgby5iTGV2ZWxzQnV0dG9ucy5sZW5ndGg7IGkrKyApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iTGV2ZWxzQnV0dG9uc1tpXSkgKXtcclxuICAgICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBpKzE7XHJcbiAgICAgICAgICBsb2FkTGV2ZWwoaSsxKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiZ2FtZVwiIDpcclxuICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJQYXVzZSkgKXtcclxuICAgICAgICBzdy5wYXVzZVRpbWVyKCk7XHJcbiAgICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLnBhdXNlKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgKXtcclxuICAgICAgICAoICFmcy5pc0Z1bGxTY3JlZW4gKSA/IGZzLmxhdW5jaEZ1bGxTY3JlZW4oY2FudmFzLmNudikgOiBmcy5jYW5zZWxGdWxsU2NyZWVuKCk7IFxyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwid2luXCIgOlxyXG5cclxuICAgICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLndpblBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfZXhpdFwiICl7XHJcbiAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX25leHRcIiAmJiBnYW1lTG9vcHMuY3VycmVudExldmVsICE9IGxldmVscy5sdmxzQ291bnQoKSApe1xyXG4gICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsKys7XHJcbiAgICAgICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcInBhdXNlXCIgOlxyXG4gICAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5wYXVzZVBvcFVwW2ldKSApe1xyXG4gICAgICAgICAgc3dpdGNoIChvLnBhdXNlUG9wVXBbaV0ubmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJldHVyblwiIDpcclxuICAgICAgICAgICAgICBzdy5zdGFydCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLmdhbWUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJlc3RhcnRcIiA6XHJcbiAgICAgICAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICAgICAgICBsb2FkTGV2ZWwoZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiZXhpdFwiIDpcclxuICAgICAgICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG5cclxud2luZG93Lm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSl7IC8v0YHQvtCx0YvRgtC40Y8g0LTQstC40LbQtdC90LjRjyDQvNGL0YjQutC4XHJcblxyXG4gIGlmICggZnMuaXNGdWxsU2NyZWVuICl7XHJcbiAgICB2YXIgeCA9IChlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdCkvZnMuem9vbTtcclxuICAgIHZhciB5ID0gKGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3ApL2ZzLnpvb207XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciB4ID0gZS5wYWdlWC1jYW52YXMuY252Lm9mZnNldExlZnQ7XHJcbiAgICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcbiAgfTtcclxuXHJcbiAgc3dpdGNoIChnTG9vLnN0YXR1cyl7XHJcblxyXG4gICAgY2FzZSBcImdhbWVcIiA6XHJcbiAgICAgIGlmICggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iUGF1c2UpICl7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJQQVVTRVwiKTtcclxuICAgICAgICAvLyBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJGdWxsU2NyKSApe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRlVMTFwiKTtcclxuICAgICAgICAvLyBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgfTtcclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciB6b29tID0gMDtcclxuXHJcbmZ1bmN0aW9uIGZ1bGxDYW52YXMoKXtcclxuXHJcblx0dmFyIGRldmljZVdpZHRoID0gd2luZG93LnNjcmVlbi5hdmFpbFdpZHRoO1xyXG5cdHZhciBkZXZpY2VIZWlnaHQgPSB3aW5kb3cuc2NyZWVuLmF2YWlsSGVpZ2h0O1xyXG5cdHpvb20gPSAoZGV2aWNlSGVpZ2h0IC8gQy5IRUlHSFQpLnRvRml4ZWQoMSk7XHJcblxyXG5cdGNhbnZhcy5jbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoKnpvb207XHJcblx0Y2FudmFzLmNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodCp6b29tO1xyXG5cdGNhbnZhcy5jdHguc2NhbGUoem9vbSx6b29tKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG5vcm1hbENhbnZhcygpe1xyXG5cdGNhbnZhcy5jbnYud2lkdGggPSBjYW52YXMuY252LndpZHRoL3pvb207XHJcblx0Y2FudmFzLmNudi5oZWlnaHQgPSBjYW52YXMuY252LmhlaWdodC96b29tO1xyXG5cdGNhbnZhcy5jdHguc2NhbGUoMSwxKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBcclxuXHJcblx0bGF1bmNoRnVsbFNjcmVlbiA6IGZ1bmN0aW9uKGVsZW0pe1xyXG5cclxuXHRcdGlmICggZWxlbS5yZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLnJlcXVlc3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBlbGVtLm1velJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ubW96UmVxdXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZWxlbS53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9O1xyXG5cclxuXHRcdGZ1bGxDYW52YXMoKTtcclxuXHRcdHRoaXMuaXNGdWxsU2NyZWVuID0gdHJ1ZTsgXHJcblx0fSxcclxuXHJcblx0Y2Fuc2VsRnVsbFNjcmVlbiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0aWYgKCBkb2N1bWVudC5leGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbiApe1xyXG5cdFx0XHRkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHJcblx0XHRub3JtYWxDYW52YXMoKTtcclxuXHRcdHRoaXMuaXNGdWxsU2NyZWVuID0gZmFsc2U7XHJcblx0fSxcclxuXHJcblx0aXNGdWxsU2NyZWVuIDogZmFsc2UsXHJcblxyXG5cdHpvb20gOiB6b29tXHJcblxyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBoZiA9IHJlcXVpcmUoJy4vX2hlbHBlckZ1bmN0aW9ucy5qcycpO1xyXG52YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnYW1lTG9vcHMgPSAge1xyXG5cclxuICBsb2FkZXIgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImxvYWRlclwiO1xyXG5cclxuICAgIG8uUFJFTE9BREVSLmRyYXcoKTtcclxuICAgIGlmICggcmVzLnJlc291cnNlcy5hcmVMb2FkZWQoKSApIGVuZ2luLnNldEdhbWVFbmdpbmUoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImdhbWVcIjsgXHJcblxyXG4gICAgLy/QvtGH0LjRgdGC0LrQsCDQvtCx0LvQsNGB0YLQuFxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICBvLmJnTGV2ZWwuZHJhdygpO1xyXG4gICAgXHJcbiAgICAvL9Cy0YvQstC+0LTQuNC8INC80LDRgtGA0LjRh9C90L7QtSDQv9C+0LvQtSDQuNCz0YDRi1xyXG4gICAgZm9yICggaSBpbiBvLm1hdHJpeCApe1xyXG4gICAgICBvLm1hdHJpeFtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0LLRi9Cy0L7QtNC40Lwg0YHRgtC10L3Ri1xc0L/RgNC10LPRgNCw0LTRi1xyXG4gICAgZm9yICggaSBpbiBvLndhbGxzICl7XHJcbiAgICAgIG8ud2FsbHNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKioqKtCS0YvQstC+0LTQuNC8INCl0LXQtNC10YAqKioqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBvLmhlYWRlci5kcmF3KCk7XHJcbiAgICBvLnN0b3BXYXRjaC5kcmF3KDEsMTApO1xyXG4gICAgby5iRnVsbFNjci5kcmF3KCk7XHJcbiAgICBvLmJQYXVzZS5kcmF3KCk7XHJcbiAgICBvLmN1cnJMZXZlbC5kcmF3KCk7XHJcblxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyoqKirQktGL0LLQvtC00LjQvCDQvtCx0YrQtdC60YLRiyoqKioqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIG8uZG9vci5kcmF3KCk7XHJcbiAgICBvLnBsLmRyYXcoKTtcclxuICAgIG8uYm94LmRyYXcoKTtcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKioqKtCV0YHQu9C4INC/0L7QsdC10LTQuNC70LgqKioqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBpZiAoIGhmLmlzV2luKCkgKXtcclxuICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICBlbmdpbi5zZXRHYW1lRW5naW5lKGdhbWVMb29wcy53aW4pO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJtZW51XCI7XHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICBvLmFuaW1hdGVCZy5kcmF3KCk7XHJcblxyXG4gICAgby5sb2dvLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICBvLm1lbnVbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgfSxcclxuXHJcbiAgd2luIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJ3aW5cIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJ3aW5fdGV4dFwiICkgby53aW5Qb3BVcFtpXS50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK2dhbWVMb29wcy5jdXJyZW50TGV2ZWw7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9uZXh0XCIgJiYgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9PSBsZXZlbHMubHZsc0NvdW50KCkgKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgby53aW5Qb3BVcFtpXS5kcmF3KCk7XHJcbiAgICAgIH0gIFxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBwYXVzZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwicGF1c2VcIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICBvLnBhdXNlUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBsZXZlbHMgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImxldmVsc1wiO1xyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7XHJcblxyXG4gICAgby52aWRlb0JnTGV2ZWxzLmRyYXcoKTtcclxuXHJcbiAgICBvLmxldmVsc0hlYWRlci5kcmF3KCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLmJMZXZlbHNCdXR0b25zICl7XHJcbiAgICAgIG8uYkxldmVsc0J1dHRvbnNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICAgIG8ubGV2ZWxzRm9vdGVyW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgc3RhdHVzIDogXCJcIixcclxuXHJcbiAgY3VycmVudExldmVsIDogXCIxXCJcclxuXHJcbn07XHJcbiIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gIGNsZWFyUmVjdCA6IGZ1bmN0aW9uKHgseSx3LGgpeyAgLy/QvtGH0LjRgdGC0LjRgtC10LvRjFxyXG4gICAgY3R4LmNsZWFyUmVjdCh4LHksdyxoKTtcclxuICB9LFxyXG5cclxuICBnZXRSYW5kb21JbnQgOiBmdW5jdGlvbihtaW4sIG1heCkgeyAvL9GE0YPQvdC60YbQuNGPINC00LvRjyDRgNCw0L3QtNC+0LzQsCDRhtC10LvQvtGH0LjRgdC70LXQvdC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y9cclxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xyXG4gIH0sXHJcblxyXG4gIGlzV2luIDogZnVuY3Rpb24oKXsgLy/Qv9C+0LHQtdC00LjQu9C4P1xyXG4gICAgcmV0dXJuIG8uYm94LnggPT0gby5kb29yLnggJiYgby5ib3gueSA9PSBvLmRvb3IueTtcclxuICB9XHJcbn07XHJcbiIsInZhciBrZXlzID0ge1xyXG5cdFwiV1wiIDogODcsXHJcblx0XCJTXCIgOiA4MyxcclxuXHRcIkFcIiA6IDY1LFxyXG5cdFwiRFwiIDogNjhcclxufTtcclxuXHJcbnZhciBrZXlEb3duID0gMDtcclxuLy8gdmFyIGtleURvd24gPSB7fTtcclxuXHJcbmZ1bmN0aW9uIHNldEtleShrZXlDb2RlKXtcclxuXHRrZXlEb3duID0ga2V5Q29kZTtcclxuXHQvLyBrZXlEb3duW2tleWNvZGVdID0gdHJ1ZTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNsZWFyS2V5KGtleUNvZGUpe1xyXG5cdGtleURvd24gPSAwO1xyXG5cdC8vIGtleURvd25ba2V5Q29kZV0gPSBmYWxzZTtcclxufTtcclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKXtcclxuXHRzZXRLZXkoZS5rZXlDb2RlKTtcclxufSk7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgZnVuY3Rpb24oZSl7XHJcblx0Y2xlYXJLZXkoZS5rZXlDb2RlKTtcclxufSk7XHJcblxyXG5cclxuZnVuY3Rpb24gaXNLZXlEb3duKGtleU5hbWUpe1xyXG5cdHJldHVybiBrZXlEb3duW2tleXNba2V5TmFtZV1dID09IHRydWU7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRpc0tleURvd24gOiBmdW5jdGlvbihrZXlOYW1lKXtcclxuXHRcdHJldHVybiBrZXlEb3duID09IGtleXNba2V5TmFtZV07XHJcblx0XHQvLyByZXR1cm4ga2V5RG93bltrZXlzW2tleU5hbWVdXSA9PSB0cnVlO1xyXG5cdH1cclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIHJlcyA9IHJlcXVpcmUoJy4vX3Jlc291cnNlcy5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbHMgPSB7XHJcblxyXG5cdGx2bHNDb3VudCA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0Zm9yKGtleSBpbiBsZXZlbHMpeyBjb3VudCsrIH07XHJcblx0XHRcdHJldHVybiBjb3VudC0xO1xyXG5cdH0sXHJcblxyXG5cdDEgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIC8v0LzQsNGB0YHQuNCyINGBINCx0YPQtNGD0YnQtdC/0L7RgdGC0YDQvtC10L3QvdGL0LzQuCDRgdGC0LXQvdC60LDQvNC4XHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFsxLDNdLFsxLDRdLFsxLDVdLFsyLDBdLFsyLDZdLFsyLDhdLFszLDJdLFs0LDFdLFs0LDNdLFs0LDddLFs1LDRdLFs2LDRdLFs2LDZdLFs3LDFdLFs3LDhdLFs4LDBdLFs4LDRdLFs4LDVdXHJcblx0XHRdO1x0XHRcdFx0ICAvL9C/0YDQuNC00YPQvNCw0L3QvdGL0Lkg0LzQsNGB0YHQuNCyINGB0L4g0YHRgtC10L3QutCw0LzQuFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgV2FsbCggcmVzLmFyckltYWdlc1s1XSwgYXJyW2ldWzFdKig1MCtDLlBETkcpLCBhcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCkgKTtcclxuXHRcdH07XHRcdFx0XHQgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC80LDRgdGB0LjQsiB3YWxsc1xyXG5cclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIDAsIDAgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzIqKDUwK0MuUERORyksIDcqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFswLDBdLFswLDRdLFswLDNdLFswLDZdLFsyLDJdLFsyLDRdLFszLDhdLFszLDBdLFszLDddLFs0LDJdLFs0LDRdLFs0LDVdLFs0LDZdLFs1LDBdLFs2LDJdLFs2LDVdLFs2LDZdLFs2LDddLFs3LDBdLFs4LDNdLFs4LDRdLFs4LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFdhbGwoIHJlcy5hcnJJbWFnZXNbNV0sIGFycltpXVsxXSooNTArQy5QRE5HKSwgYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTApICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCAwLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzYqKDUwK0MuUERORyksIDArNyooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzgqKDUwK0MuUERORyksIDArNiooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDMgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwyXSxbMCw3XSxbMSw1XSxbMSw4XSxbMiwyXSxbMiw3XSxbMyw0XSxbNCwxXSxbNCw0XSxbNCw2XSxbNiwyXSxbNiwzXSxbNiw0XSxbNiw2XSxbNiw4XSxbNywwXSxbNyw1XSxbOCwwXSxbOCwxXSxbOCwzXSxbOCw3XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs4Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzEqKDUwK0MuUERORyksIDArNiooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzIqKDUwK0MuUERORyksIDArMyooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDQgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwxXSxbMSw1XSxbMSw3XSxbMiw0XSxbMywxXSxbMywzXSxbMyw2XSxbMyw4XSxbNCwzXSxbNSw1XSxbNSw3XSxbNiwwXSxbNiwyXSxbNiwzXSxbNiw1XSxbNyw4XSxbOCwwXSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCs3Kig1MCtDLlBETkcpLCAwKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCAwKzcqKDUwK0MuUERORyksIDArNyooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCAwKzYqKDUwK0MuUERORyksIDArMCooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDUgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMCwxXSxbMCwzXSxbMCw1XSxbMCw4XSxbMiwyXSxbMiw0XSxbMiw2XSxbMiw4XSxbNCwwXSxbNCwzXSxbNCw1XSxbNCw3XSxbNiwxXSxbNiwyXSxbNiw0XSxbNiw3XSxbNyw4XSxbOCwyXSxbOCw0XSxbOCw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBXYWxsKCByZXMuYXJySW1hZ2VzWzVdLCBhcnJbaV1bMV0qKDUwK0MuUERORyksIGFycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggMCwgMCswKig1MCtDLlBETkcpICk7XHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggMCsxKig1MCtDLlBETkcpLCAwKzEqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggMCwgMCs4Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgY252cyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgcmVzID0gcmVxdWlyZSgnLi9fcmVzb3Vyc2VzLmpzJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWF0cml4QkcoKXtcclxuICB2YXIgbWF0cml4ID0gW107IC8v0LzQsNGB0YHQuNCyINC00LvRjyDQvNCw0YLRgNC40YfQvdC+0LPQviDQstC40LTQsCDRg9GA0L7QstC90Y9cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspeyAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvtCx0YrQtdC60YJcclxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgOTsgaisrKXtcclxuICAgICAgbWF0cml4LnB1c2goIG5ldyBSZWN0KEMuUERORytqKig1MCtDLlBETkcpLCA3MStDLlBETkcraSooNTArQy5QRE5HKSwgNTAsIDUwLCBcInJnYmEoMCwwLDAsMC41KVwiLCB0cnVlKSApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBtYXRyaXhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnUodHh0QXJyLCBuYW1lQXJyKXsgIC8v0YHQvtC30LTQsNC10Lwg0LPQu9Cw0LLQvdC+0LUg0LzQtdC90Y5cclxuICB2YXIgbWVudSA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IG5hbWVBcnI7XHJcbiAgdmFyIHR4dCA9IHR4dEFycjtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcbiAgXHJcbiAgdmFyIF9mb250c2l6ZSA9IFwiMjhcIjtcclxuICB2YXIgX3ggPSBDLldJRFRILzItMzAwLzI7XHJcbiAgdmFyIF95ID0gKEMuSEVJR0hULzIpIC0gKDg1KmFtb3VudHMvMikgKyA4NTsgXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYW1vdW50czsgaSsrKXtcclxuICAgIG1lbnUucHVzaCggbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1swXSwgX3gsIF95K2kqODUsIDMwMCwgNjAsIHR4dFtpXSwgbmFtZXNbaV0sIF9mb250c2l6ZSwgMTM1ICkgKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gbWVudTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpblBvcFVwKCl7XHJcblxyXG4gIHZhciB3aW5Qb3BCRyA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxNl0sIEMuV0lEVEgvMi0zMjAvMiwgQy5IRUlHSFQvMi0yMDAvMiwgMzIwLCAyMDApO1xyXG4gIHZhciBiUG9wRXhpdCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTJdLCB3aW5Qb3BCRy54KzMwLCAgd2luUG9wQkcueSt3aW5Qb3BCRy5oLTUwLCA4MCwgNjUsIFwiXCIsIFwicG9wX2V4aXRcIiwgMCApO1xyXG4gIHZhciBiUG9wTmV4dCA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTVdLCB3aW5Qb3BCRy54KzMwKzExMCs4MCwgIHdpblBvcEJHLnkrd2luUG9wQkcuaC01MCwgODAsIDY1LCBcIlwiLCBcInBvcF9uZXh0XCIsIDAgKTtcclxuXHJcbiAgdmFyIHdpblRleHQgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMiwgd2luUG9wQkcueSsxNSwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0KPRgNC+0LLQtdC90YwgTlwiLCBcIndpbl90ZXh0XCIsIDMwLCBcIkJ1Y2NhbmVlclwiICk7XHJcbiAgdmFyIHdpblRleHRfMiA9IG5ldyBCdXR0b24oIEMuV0lEVEgvMi05MC8yKzEwLCB3aW5Qb3BCRy55KzgwLCA5MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQv9GA0L7QudC00LXQvSFcIiwgXCJ3aW5fdGV4dF8yXCIsIDUwLCBcImFaWl9UcmlidXRlX0JvbGRcIiApO1xyXG5cclxuICB3aW5UZXh0LnR4dENvbG9yID0gXCIjRDlDNDI1XCI7XHJcblxyXG4gIHZhciB3aW5Qb3BVcCA9IFtdO1xyXG4gIHdpblBvcFVwLnB1c2god2luUG9wQkcsIGJQb3BFeGl0LCBiUG9wTmV4dCwgd2luVGV4dCwgd2luVGV4dF8yKTtcclxuXHJcbiAgcmV0dXJuIHdpblBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGF1c2VQb3BVcCgpe1xyXG5cclxuICB2YXIgcGF1c2VQb3BVcCA9IFtdO1xyXG4gIHZhciBiZ1BhdXNlID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzEzXSwgQy5XSURUSC8yLTMwMC8yLCBDLkhFSUdIVC8yLTIwNy8yLCAzMDAsIDIwNyk7XHJcbiAgdmFyIGJSZXR1cm4gPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzEwXSwgYmdQYXVzZS54KzE5MCwgIGJnUGF1c2UueS0yNSwgNjMsIDU3LCBcIlwiLCBcInJldHVyblwiLCAwICk7XHJcbiAgdmFyIGJFeGl0VG9NZW51ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMl0sICBiZ1BhdXNlLngrNTAsICBiZ1BhdXNlLnkrYmdQYXVzZS5oLTUwLCA4NSwgNzAsIFwiXCIsIFwiZXhpdFwiLCAwICk7XHJcbiAgdmFyIGJSZXN0YXJ0ID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxMV0sICBiZ1BhdXNlLngrNTArMzArODUsICBiZ1BhdXNlLnkrYmdQYXVzZS5oLTUwLCA4NSwgNzAsIFwiXCIsIFwicmVzdGFydFwiLCAwICk7XHJcbiAgdmFyIHBhdXNlVGV4dCA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1sxNF0sIGJnUGF1c2UueCArIGJnUGF1c2Uudy8yIC0gMTUwLzIsIGJnUGF1c2UueSArIGJnUGF1c2UuaC8yIC0gMTAwLzIsIDE1MCwgMTAwKTtcclxuXHJcbiAgcGF1c2VQb3BVcC5wdXNoKGJnUGF1c2UsIGJSZXR1cm4sIGJFeGl0VG9NZW51LCBiUmVzdGFydCwgcGF1c2VUZXh0KTtcclxuXHJcbiAgcmV0dXJuIHBhdXNlUG9wVXA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVMZXZlbHNCdXR0b25zKGxldmVsc19jb3VudCl7XHJcblxyXG4gIHZhciBiTGV2ZWxzQnV0dG9ucyA9IFtdO1xyXG4gIHZhciBqID0gMCwgZHkgPSA4NSwgZHggPSAwO1xyXG5cclxuICBmb3IgKCBpPTA7IGkgPCBsZXZlbHNfY291bnQ7IGkrKyl7XHJcbiAgICBkeCA9IDgraiooMTAwKzE1KTtcclxuXHJcbiAgICBiTGV2ZWxzQnV0dG9ucy5wdXNoKCBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE3XSwgZHgsIGR5LCAxMDAsIDEwMCwgaSsxLCBcImxldmVsX1wiKyhpKzEpLCAzNSApICk7XHJcblxyXG4gICAgaisrO1xyXG5cclxuICAgIGlmICggZHggPiBDLldJRFRILTExNSApe1xyXG4gICAgICBkeSArPSAoMTI1KTtcclxuICAgICAgaiA9IDA7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIHJldHVybiBiTGV2ZWxzQnV0dG9ucztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUxldmVsc0Zvb3Rlcigpe1xyXG5cclxuICB2YXIgbGV2ZWxzRm9vdGVyID0gW107XHJcblxyXG4gIHZhciBiUHJldiA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMTldLCAyMCwgQy5IRUlHSFQtMTAtNjcsIDQwLCA2NywgXCJcIiwgXCJwcmV2XCIsIDAgKTtcclxuICB2YXIgYk5leHQgPSBuZXcgSW1nQnV0dG9uKCByZXMuYXJySW1hZ2VzWzE4XSwgQy5XSURUSC0yMC00MCwgQy5IRUlHSFQtMTAtNjcsIDQwLCA2NywgXCJcIiwgXCJuZXh0XCIsIDAgKTtcclxuICB2YXIgYlRvTWVudSA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbMjBdLCBDLldJRFRILzIgLSAzMjAvMiwgQy5IRUlHSFQtMTAtNjcsIDMyMCwgNjcsIFwi0JLQtdGA0L3Rg9GC0YzRgdGPINCyINC80LXQvdGOXCIsIFwidG9fbWVudVwiLCAyNSApO1xyXG4gIGJUb01lbnUudHh0Q29sb3IgPSBcIiMwMDAwNDZcIjtcclxuXHJcbiAgbGV2ZWxzRm9vdGVyLnB1c2goYlByZXYsYk5leHQsYlRvTWVudSk7XHJcblxyXG4gIHJldHVybiBsZXZlbHNGb290ZXI7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQbGF5ZXIoKXtcclxuXHJcbiAgdmFyIHBsYXllciA9IG5ldyBQbGF5YWJsZShyZXMuYXJySW1hZ2VzWzldLDAsMCw1MCw1MCk7XHJcbiAgcGxheWVyLmRpcmVjdGlvbiA9IGZhbHNlO1xyXG4gIHBsYXllci5pc01vdmUgPSBmYWxzZTtcclxuXHJcbiAgcGxheWVyLmRyYXcgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIGlmKHRoaXMuaXNNb3ZlKXtcclxuICAgICAgdGhpcy5kcmF3QW5pbWF0aW9uKDMsIDIsIHRoaXMuZGlyZWN0aW9uKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRyYXdGcmFtZSgpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBwbGF5ZXIuZHJhd0FuaW1hdGlvbiA9IGZ1bmN0aW9uKGZyYW1lcywgZGVsYXksIGFuZ2xlKXtcclxuXHJcbiAgICB0aGlzLmltZy5jYW5EcmF3ID0gKCB0aGlzLmltZy5jYW5EcmF3ID09PSB1bmRlZmluZWQgKSA/IDEgOiB0aGlzLmltZy5jYW5EcmF3O1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIHZhciBfZHggPSB0aGlzLngrQy5QRE5HICsgdGhpcy53IC8gMjtcclxuICAgICAgdmFyIF9keSA9IHRoaXMueSs3MStDLlBETkcgKyB0aGlzLmggLyAyO1xyXG4gICAgICBhbmdsZSA9IGFuZ2xlICogKE1hdGguUEkvMTgwKTtcclxuICAgICAgY252cy5jdHguc2F2ZSgpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoX2R4LF9keSk7XHJcbiAgICAgIGNudnMuY3R4LnJvdGF0ZShhbmdsZSk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtX2R4LC1fZHkpO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodGhpcy5pbWcuY2FuRHJhdyA9PSAxKXtcclxuICAgICAgaWYgKHRoaXMuaW1nLmNvdW50ID09IGZyYW1lcykgdGhpcy5pbWcuY291bnQgPSAxO1xyXG5cclxuICAgICAgdGhpcy5pbWcuY2FuRHJhdyA9IDA7XHJcbiAgICAgIHRoaXMuaW1nLmNvdW50ID0gdGhpcy5pbWcuY291bnQgKyAxIHx8IDE7XHJcblxyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcGxheWVyLmltZy5jYW5EcmF3ID0gMTtcclxuICAgICAgfSwgMTAwMC8oZGVsYXkqMikgKTtcclxuICAgIH07XHJcblxyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoQy5QRE5HLCA3MStDLlBETkcpO1xyXG4gICAgICBjbnZzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDUwKih0aGlzLmltZy5jb3VudC0xKSwgMCwgdGhpcy53LCB0aGlzLmgsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgIGNudnMuY3R4LnRyYW5zbGF0ZSgtQy5QRE5HLCAtKDcxK0MuUERORykpO1xyXG5cclxuICAgIGlmIChhbmdsZSl7XHJcbiAgICAgIGNudnMuY3R4LnJlc3RvcmUoKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgcGxheWVyLmRyYXdGcmFtZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgdmFyIGFuZ2xlID0gdGhpcy5kaXJlY3Rpb24gfHwgMDtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICB2YXIgX2R4ID0gdGhpcy54K0MuUERORyArIHRoaXMudyAvIDI7XHJcbiAgICAgIHZhciBfZHkgPSB0aGlzLnkrNzErQy5QRE5HICsgdGhpcy5oIC8gMjtcclxuICAgICAgYW5nbGUgPSBhbmdsZSAqIChNYXRoLlBJLzE4MCk7XHJcbiAgICAgIGNudnMuY3R4LnNhdmUoKTtcclxuICAgICAgY252cy5jdHgudHJhbnNsYXRlKF9keCxfZHkpO1xyXG4gICAgICBjbnZzLmN0eC5yb3RhdGUoYW5nbGUpO1xyXG4gICAgICBjbnZzLmN0eC50cmFuc2xhdGUoLV9keCwtX2R5KTtcclxuICAgIH07XHJcblxyXG4gICAgY252cy5jdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGNudnMuY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy53LCB0aGlzLmgsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjbnZzLmN0eC50cmFuc2xhdGUoLUMuUERORywgLSg3MStDLlBETkcpKTtcclxuXHJcbiAgICBpZiAoYW5nbGUpe1xyXG4gICAgICBjbnZzLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHBsYXllci5zZXREaXJlY3Rpb24gPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHBsYXllcjtcclxufTtcclxuXHJcblxyXG5cclxuLy9tZW51XHJcbnZhciBsb2dvID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1sxXSwgQy5XSURUSC8yLTQ1MC8yLCAyMCwgNDUwLCAxNTAsIFwiXCIsIFwibG9nb1wiLCAwICk7XHJcbnZhciBtZW51ID0gY3JlYXRlTWVudShbXCLQmNCz0YDQsNGC0YxcIiwgXCLQo9GA0L7QstC90LhcIiwgXCLQndCw0YHRgtGA0L7QudC60LhcIl0sW1wicGxheVwiLCBcImNoYW5nZV9sZXZlbFwiLCBcIm9wdGlvbnNcIl0pO1xyXG5cclxuXHJcbi8vYmFja2dyb3VuZCBcclxudmFyIG1hdHJpeCA9IGNyZWF0ZU1hdHJpeEJHKCk7IC8vYmcg0YPRgNC+0LLQvdGPXHJcbnZhciBiZ0xldmVsID0gbmV3IEltYWdlKCByZXMuYXJySW1hZ2VzWzhdLCAwLCAwLCBDLldJRFRILCBDLkhFSUdIVCApO1xyXG52YXIgYmdPcGFjaXR5ID0gbmV3IFJlY3QoMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIFwicmdiYSgwLCAwLCAwLCAwLjUpXCIpO1xyXG5cclxuXHJcbi8vZ2FtZSBoZWFkZXJcclxudmFyIGhlYWRlciA9IG5ldyBJbWFnZSggcmVzLmFyckltYWdlc1syXSwgMCwgMCwgQy5XSURUSCwgNzErQy5QRE5HICk7XHJcbnZhciBiRnVsbFNjciA9IG5ldyBJbWdCdXR0b24oIHJlcy5hcnJJbWFnZXNbM10sIEMuV0lEVEgtNDUtMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwiZnVsbFNjclwiLCAwICk7XHJcbnZhciBzdG9wV2F0Y2ggPSBuZXcgQnV0dG9uKCAxMCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDEyMCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCIwMCA6IDAwIDogMDBcIiwgXCJzdG9wd2F0Y2hcIiwgMjUsIFwiZGl0ZWRcIiApO1xyXG52YXIgYlBhdXNlID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1s0XSwgQy5XSURUSC00NS03LWJGdWxsU2NyLnctMjAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0NS8yLCA0NSwgNDUsIFwiXCIsIFwicGF1c2VcIiwgMCApO1xyXG52YXIgY3VyckxldmVsID0gbmV3IEJ1dHRvbiggKHN0b3BXYXRjaC54K3N0b3BXYXRjaC53K2JQYXVzZS54KS8yLTE0MC8yLCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTQwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMXCIsIFwiY3Vycl9sZXZlbFwiLCAyNSwgXCJjYXB0dXJlX2l0XCIgKTtcclxuXHJcblxyXG4vL2NoYW5nZSBsZXZlbFxyXG52YXIgbGV2ZWxzSGVhZGVyID0gbmV3IEltZ0J1dHRvbiggcmVzLmFyckltYWdlc1syXSwgMCwgMCwgQy5XSURUSCwgNzErQy5QRE5HLCBcItCS0YvQsdC+0YAg0YPRgNC+0LLQvdGPXCIsIFwibGV2ZWxzX2hlYWRlclwiLCAyNSApO1xyXG52YXIgYkxldmVsc0J1dHRvbnMgPSBjcmVhdGVMZXZlbHNCdXR0b25zKDUpO1xyXG52YXIgbGV2ZWxzRm9vdGVyID0gY3JlYXRlTGV2ZWxzRm9vdGVyKCk7XHJcblxyXG5cclxuLy93aW4gcG9wLXVwXHJcbnZhciB3aW5Qb3BVcCA9IGNyZWF0ZVdpblBvcFVwKCk7XHJcblxyXG5cclxuLy9wYXVzZSBwb3AtdXBcclxudmFyIHBhdXNlUG9wVXAgPSBjcmVhdGVQYXVzZVBvcFVwKCk7XHJcblxyXG5cclxuLy9wbGF5YWJsZSBvYmpcclxudmFyIHBsID0gY3JlYXRlUGxheWVyKCk7XHJcbnZhciBib3ggPSBuZXcgUGxheWFibGUocmVzLmFyckltYWdlc1s2XSwwLDAsNTAsNTApOyAvL9Cx0L7QutGBXHJcbnZhciBkb29yID0gbmV3IFBsYXlhYmxlKHJlcy5hcnJJbWFnZXNbN10sMCwwLDUwLDUwKTsgLy/QtNCy0LXRgNGMXHJcbnZhciB3YWxscyA9IFtdOyAvL9GB0YLQtdC90Ysg0L3QsCDRg9GA0L7QstC90LUsINC30LDQv9C+0LvQvdGP0LXRgtGB0Y8g0LLRi9Cx0YDQsNC90L3Ri9C8INGD0YDQvtCy0L3QtdC8LlxyXG5cclxuXHJcbi8vdmlkZW9zXHJcbnZhciBhbmltYXRlQmcgPSBuZXcgVmlkZW8oMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIHJlcy5hcnJWaWRlb3NbMF0pO1xyXG52YXIgdmlkZW9CZ0xldmVscyA9IG5ldyBWaWRlbygwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgcmVzLmFyclZpZGVvc1sxXSk7XHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0cyA9IHtcclxuXHJcbiAgbWF0cml4IDogbWF0cml4LFxyXG4gIGxvZ28gOiBsb2dvLFxyXG4gIG1lbnUgOiBtZW51LFxyXG4gIGhlYWRlciA6IGhlYWRlcixcclxuICBzdG9wV2F0Y2ggOiBzdG9wV2F0Y2gsXHJcbiAgYlBhdXNlIDogYlBhdXNlLFxyXG4gIGJGdWxsU2NyIDogYkZ1bGxTY3IsXHJcbiAgcGwgOiBwbCxcclxuICBib3ggOiBib3gsXHJcbiAgZG9vciA6IGRvb3IsXHJcbiAgd2FsbHMgOiB3YWxscyxcclxuICBiZ0xldmVsIDogYmdMZXZlbCxcclxuICB3aW5Qb3BVcCA6IHdpblBvcFVwLFxyXG4gIHBhdXNlUG9wVXAgOiBwYXVzZVBvcFVwLFxyXG4gIGJnT3BhY2l0eSA6IGJnT3BhY2l0eSxcclxuICBjdXJyTGV2ZWwgOiBjdXJyTGV2ZWwsXHJcbiAgbGV2ZWxzSGVhZGVyIDogbGV2ZWxzSGVhZGVyLFxyXG4gIGJMZXZlbHNCdXR0b25zIDogYkxldmVsc0J1dHRvbnMsXHJcbiAgbGV2ZWxzRm9vdGVyIDogbGV2ZWxzRm9vdGVyLFxyXG4gIGFuaW1hdGVCZyA6IGFuaW1hdGVCZyxcclxuICB2aWRlb0JnTGV2ZWxzIDogdmlkZW9CZ0xldmVscyxcclxuICBQUkVMT0FERVIgOiBuZXcgUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCxcImJsYWNrXCIpXHJcbiAgXHJcbn07XHJcbiIsInZhciByZXNvdXJzZXMgPSB7XHJcbiAgaW1hZ2VzIDogZmFsc2UsXHJcbiAgdmlkZW8gOiBmYWxzZSxcclxuXHJcbiAgYXJlTG9hZGVkIDogZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB0aGlzLnZpZGVvICYmIHRoaXMuaW1hZ2VzXHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZFZpZGVvKGFyclNyY3NPZlZpZGVvKXtcclxuXHJcbiAgdmFyIGFyclZpZGVvcyA9IFtdOyBcclxuICB2YXIgY291bnQgPSBhcnJTcmNzT2ZWaWRlby5sZW5ndGg7XHJcbiAgdmFyIGxvYWRDb3VudCA9IDA7XHJcblxyXG4gIGZvcih2YXIgaT0wOyBpPGNvdW50OyBpKyspe1xyXG5cclxuICAgIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XHJcbiAgICB2aWRlby5zcmMgPSBhcnJTcmNzT2ZWaWRlb1tpXTtcclxuICAgIC8vIHZpZGVvLm9ubG9hZGVkZGF0YSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZpZGVvLm9uY2FucGxheXRocm91Z2ggPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIGxvYWRDb3VudCsrO1xyXG4gICAgICAgIHZpZGVvLmxvb3AgPSB0cnVlO1xyXG4gICAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLnZpZGVvID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgIC8vIH07XHJcblxyXG4gICAgYXJyVmlkZW9zLnB1c2godmlkZW8pO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXJyVmlkZW9zO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZEltYWdlcyhhcnJTcmNzT2ZJbWFnZXMpe1xyXG5cclxuICB2YXIgYXJySW1hZ2VzID0gW107IFxyXG4gIHZhciBjb3VudCA9IGFyclNyY3NPZkltYWdlcy5sZW5ndGg7XHJcbiAgdmFyIGxvYWRDb3VudCA9IDA7XHJcblxyXG4gIGZvcih2YXIgaT0wOyBpPGNvdW50OyBpKyspe1xyXG5cclxuICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgIGltZy5zcmMgPSBhcnJTcmNzT2ZJbWFnZXNbaV07XHJcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgbG9hZENvdW50Kys7XHJcbiAgICAgIGlmICggbG9hZENvdW50ID09IGNvdW50ICkgcmVzb3Vyc2VzLmltYWdlcyA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBhcnJJbWFnZXMucHVzaChpbWcpO1xyXG5cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXJySW1hZ2VzO1xyXG59O1xyXG5cclxudmFyIGFyclZpZGVvcyA9IGxvYWRWaWRlbyhbXHJcbiAgXCJ2aWRlby9iZy5tcDRcIixcclxuICBcInZpZGVvL0xpZ2h0bWlycm9yLm1wNFwiXHJcbl0pO1xyXG5cclxudmFyIGFyckltYWdlcyA9IGxvYWRJbWFnZXMoW1xyXG4gIFwiaW1nL2J1dHRvbi1tZW51LnN2Z1wiLCAgICAgLy8wXHJcbiAgXCJpbWcvbG9nby5wbmdcIiwgICAgICAgICAgICAvLzFcclxuICBcImltZy9oZWFkZXIzLnN2Z1wiLCAgICAgICAgIC8vMlxyXG4gIFwiaW1nL2Z1bGxzY3JlZW4uc3ZnXCIsICAgICAgLy8zXHJcbiAgXCJpbWcvcGF1c2Uuc3ZnXCIsICAgICAgICAgICAvLzRcclxuICBcImltZy93YWxsLnN2Z1wiLCAgICAgICAgICAgIC8vNVxyXG4gIFwiaW1nL2NyeXN0YWxsLTAxLnN2Z1wiLCAgICAgLy82XHJcbiAgXCJpbWcvcG9ydGFsLnN2Z1wiLCAgICAgICAgICAvLzdcclxuICBcImltZy9ncm91bmQuanBnXCIsICAgICAgICAgIC8vOFxyXG4gICdpbWcvcGxheWVyLnBuZycsICAgICAgICAgIC8vOVxyXG4gIFwiaW1nL2V4aXQtYnV0dG9uLnN2Z1wiLCAgICAgLy8xMFxyXG4gIFwiaW1nL3Jlc3RhcnQtYnV0dG9uLnN2Z1wiLCAgLy8xMVxyXG4gIFwiaW1nL2V4aXRfaW5fbWVudS1idXR0b24uc3ZnXCIsIC8vMTJcclxuICBcImltZy9wYXVzZS1iZy5zdmdcIiwgICAgICAgIC8vMTNcclxuICBcImltZy9wYXVzZV90ZXh0LnN2Z1wiLCAgICAgIC8vMTRcclxuICBcImltZy9idXR0b25fbmV4dC5zdmdcIiwgICAgIC8vMTVcclxuICBcImltZy9iZ193aW4uc3ZnXCIsICAgICAgICAgIC8vMTZcclxuICBcImltZy9sZXZlbHNfMi5zdmdcIiwgICAgICAgIC8vMTdcclxuICBcImltZy9sZXZlbHNfbmV4dC5zdmdcIiwgICAgIC8vMThcclxuICBcImltZy9sZXZlbHNfcHJldi5zdmdcIiwgICAgIC8vMTlcclxuICBcImltZy9sZXZlbHNfaW5fbWVudS5zdmdcIiAgIC8vMjBcclxuXSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG4gIHJlc291cnNlcyA6IHJlc291cnNlcyxcclxuXHJcbiAgYXJyVmlkZW9zIDogYXJyVmlkZW9zLFxyXG5cclxuICBhcnJJbWFnZXMgOiBhcnJJbWFnZXMgIFxyXG5cclxufTtcclxuXHJcblxyXG4iLCJ2YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGdhbWUgPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxuXHJcbnZhciBwYXVzZSA9IDA7XHJcbnZhciBiZWdpblRpbWUgPSAwO1xyXG52YXIgY3VycmVudFRpbWUgPSAwO1xyXG52YXIgdXBUaW1lVE87XHJcblxyXG5mdW5jdGlvbiB1cFRpbWUoY291bnRGcm9tKSB7XHJcblx0dmFyIG5vdyA9IG5ldyBEYXRlKCk7XHJcblx0dmFyIGRpZmZlcmVuY2UgPSAobm93LWNvdW50RnJvbSArIGN1cnJlbnRUaW1lKTtcclxuXHJcblx0dmFyIGhvdXJzPU1hdGguZmxvb3IoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKS8oNjAqNjAqMTAwMCkqMSk7XHJcblx0dmFyIG1pbnM9TWF0aC5mbG9vcigoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpLyg2MCoxMDAwKSoxKTtcclxuXHR2YXIgc2Vjcz1NYXRoLmZsb29yKCgoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpJSg2MCoxMDAwKSkvMTAwMCoxKTtcclxuXHJcblx0aG91cnMgPSAoIGhvdXJzIDwgMTApID8gXCIwXCIraG91cnMgOiBob3VycztcclxuXHRtaW5zID0gKCBtaW5zIDwgMTApID8gXCIwXCIrbWlucyA6IG1pbnM7XHJcblx0c2VjcyA9ICggc2VjcyA8IDEwKSA/IFwiMFwiK3NlY3MgOiBzZWNzO1xyXG5cclxuXHRvLnN0b3BXYXRjaC50eHQgPSBob3VycytcIiA6IFwiK21pbnMrXCIgOiBcIitzZWNzO1xyXG5cclxuXHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdHVwVGltZVRPPXNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdXBUaW1lKGNvdW50RnJvbSk7IH0sMTAwMC82MCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdHN0YXJ0IDogZnVuY3Rpb24oKSB7XHJcblx0XHQvLyBpZiAoZ2FtZS5zdGF0dXMgPT0gJ2dhbWUnIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJtZW51XCIgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcInBhdXNlXCIgfHwgZ2FtZUxvb3BzLnN0YXR1cyA9PSBcImxldmVsc1wiKSB7XHJcblx0XHRcdHVwVGltZShuZXcgRGF0ZSgpKTtcclxuXHRcdFx0dmFyIG5vd1QgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0XHRiZWdpblRpbWUgPSBub3dULmdldFRpbWUoKTtcclxuXHRcdC8vIH0gZWxzZSB7XHJcblx0XHQvLyBcdHRoaXMucmVzZXQoKTtcclxuXHRcdC8vIH07XHJcblx0fSxcclxuXHJcblx0cmVzZXQgOiBmdW5jdGlvbigpIHtcclxuXHRcdGN1cnJlbnRUaW1lID0gMDtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblxyXG5cdFx0by5zdG9wV2F0Y2gudHh0ID0gXCIwMCA6IDAwIDogMDBcIjtcclxuXHRcdC8vIHRoaXMuc3RhcnQoKTtcclxuXHR9LFxyXG5cclxuXHRwYXVzZVRpbWVyIDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjdXJEYXRhID0gbmV3IERhdGUoKTtcclxuXHRcdGN1cnJlbnRUaW1lID0gY3VyRGF0YS5nZXRUaW1lKCkgLSBiZWdpblRpbWUgKyBjdXJyZW50VGltZTtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbiA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCB0eHQsIG5hbWUsIGZTaXplLCBmb250RmFtKXtcclxuICBcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuICB0aGlzLnR4dCA9IHR4dDtcclxuICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIHRoaXMuZlNpemUgPSBmU2l6ZTtcclxuICB0aGlzLnR4dENvbG9yID0gXCJ3aGl0ZVwiO1xyXG4gIHRoaXMuZm9udEZhbSA9IGZvbnRGYW0gfHwgXCJBcmlhbFwiO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbihub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gICAgdmFyIF9wYWRkID0gcGFkZCB8fCA1O1xyXG4gICAgdmFyIF94ID0gKCAhbm9DZW50ZXIgKSA/IHRoaXMueCt0aGlzLncvMiA6IHRoaXMueCtfcGFkZDtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIW5vQ2VudGVyICkgPyBcImNlbnRlclwiIDogXCJzdGFydFwiO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZTaXplICsgJ3B4ICcrdGhpcy5mb250RmFtO1xyXG4gICAgY3R4LnRleHRCYXNlbGluZT1cIm1pZGRsZVwiOyBcclxuICAgIGN0eC5maWxsVGV4dCh0aGlzLnR4dCwgX3gsIHRoaXMueSt0aGlzLmgvMik7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZSA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCwgb3BhY2l0eSl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy5vcGFjaXR5ID0gb3BhY2l0eSB8fCAxO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5nbG9iYWxBbHBoYSA9IHRoaXMub3BhY2l0eTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcblxyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltZ0J1dHRvbiA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCwgdHh0LCBuYW1lLCBmU2l6ZSwgc2V0Q2VudGVyLCBub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcbiAgdGhpcy50eHRDb2xvciA9IFwid2hpdGVcIjtcclxuICB0aGlzLnNldENlbnRlciA9IHNldENlbnRlciB8fCB0aGlzLng7XHJcbiAgdGhpcy5ub0NlbnRlciA9IG5vQ2VudGVyIHx8IGZhbHNlO1xyXG4gIHRoaXMucGFkZCA9IHBhZGQgfHwgNTtcclxuXHJcbiAgdmFyIG1ldHJpY3MgPSBjdHgubWVhc3VyZVRleHQodGhpcy50eHQpLndpZHRoO1xyXG4gIHZhciBfeCA9ICggIXRoaXMubm9DZW50ZXIgKSA/IHRoaXMuc2V0Q2VudGVyK3RoaXMudy8yIDogdGhpcy54K3RoaXMucGFkZDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIXRoaXMubm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggY2FwdHVyZV9pdCc7XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGxheWFibGUgPSBmdW5jdGlvbihpbWcsIHgsIHksIHcsIGgpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMuaW1nID0gaW1nO1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShDLlBETkcsIDcxK0MuUERORyk7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVjdCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCBpc1N0cm9rZSl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgdGhpcy5pc1N0cm9rZSA9IGlzU3Ryb2tlIHx8IGZhbHNlO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKCF0aGlzLmlzU3Ryb2tlKSB7XHJcbiAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgIGN0eC5zdHJva2VSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJylcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVmlkZW8gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCB2aWRlbyl7XHJcblxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy52aWRlbyA9IHZpZGVvO1xyXG5cclxuICB2YXIgc2F2ZSA9IGZhbHNlO1xyXG4gIHZhciBidWZDbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG4gIHZhciBidWZDdHggPSBidWZDbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gIGJ1ZkNudi53aWR0aCA9IEMuV0lEVEg7XHJcbiAgYnVmQ252LmhlaWdodCA9IEMuSEVJR0hUO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMudmlkZW8pIHtcclxuICAgICAgaWYgKCAhc2F2ZSApe1xyXG4gICAgICAgIGJ1ZkN0eC5kcmF3SW1hZ2UodGhpcy52aWRlbywgdGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgICAgICBzYXZlID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgICAgXHJcbiAgICAgIHRoaXMudmlkZW8ucGxheSgpO1xyXG4gICAgICBjYW52YXMuY3R4LmRyYXdJbWFnZShidWZDbnYsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICAgIGNhbnZhcy5jdHguZHJhd0ltYWdlKHRoaXMudmlkZW8sIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgfTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2FsbCA9IGZ1bmN0aW9uKGltZywgeCwgeSwgdywgaCl7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKEMuUERORywgNzErQy5QRE5HKTtcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpLFxyXG5QbGF5ZWJsZSAgPSByZXF1aXJlKCcuL2NsYXNzZXMvUGxheWFibGUuanMnKSxcclxuV2FsbCAgICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL1dhbGwuanMnKSxcclxuSW1nQnV0dG9uID0gcmVxdWlyZSgnLi9jbGFzc2VzL0ltZ0J1dHRvbi5qcycpLFxyXG5WaWRlbyAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvVmlkZW8uanMnKSxcclxuQnV0dG9uICAgID0gcmVxdWlyZSgnLi9jbGFzc2VzL0J1dHRvbi5qcycpLFxyXG5SZWN0ICAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvUmVjdC5qcycpLFxyXG5JbWFnZSAgICAgPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1hZ2UuanMnKSxcclxuQyAgICAgICAgID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKSxcclxuZXZlbnRzICAgID0gcmVxdWlyZSgnLi9fZXZlbnRzLmpzJyksXHJcbmxldmVscyAgICA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpLFxyXG5vICAgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyksXHJcbmNudnMgICAgICA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpLFxyXG5rZXkgXHQgID0gcmVxdWlyZSgnLi9fa2V5LmpzJyk7XHJcblxyXG5lbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLmxvYWRlcik7XHJcbiJdfQ==
