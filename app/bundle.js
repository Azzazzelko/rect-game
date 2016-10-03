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
var HEIGHT = PADD + (PADD+50)*10;   //высота канвы
var CNV_BORDER = 2;

module.exports = {

	PDNG : PADD,

	WIDTH : WIDTH,

	HEIGHT : HEIGHT,

	CNV_BORDER : CNV_BORDER

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

  if ( isNear[direction](o.pl, o.box) && !hf.isBorder[direction](o.box) && !isNear[direction](o.box, o.walls) ){ //если рядом с ящиком и ящик не у границ, двигаем.
    o.pl.move(direction);
    o.box.move(direction);
  } else if( !isNear[direction](o.pl, o.box) && !hf.isBorder[direction](o.pl) && !isNear[direction](o.pl, o.walls) ){ //если не рядом с ящиком и не рядом с границей, двигаемся.
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
  engin.gameEngineStart(gameLoops.plLevel);
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
        engin.gameEngineStart(gameLoops.plLevel);
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

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_fullScreen.js":5,"./_gameLoops.js":6,"./_helperFunctions.js":7,"./_levels.js":8,"./_objects.js":9,"./_stopwatch.js":10}],5:[function(require,module,exports){
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

module.exports = gameLoops =  {

  plLevel : function(){

    gameLoops.status = "game"; 

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT); //очистка области

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

    o.bg.drawImg();

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
},{"./_const.js":2,"./_engine.js":3,"./_helperFunctions.js":7,"./_objects.js":9}],7:[function(require,module,exports){
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

  isBorder : { //принимает объект, возвращает стоит ли с запрашиваеомй границы канвы
    up : function(obj){
      return obj.y == C.PDNG + obj.h + C.PDNG;
    },

    down : function(obj){
      return obj.y == C.HEIGHT - obj.h - C.PDNG;
    },

    left : function(obj){
      return obj.x == C.PDNG;
    },

    right : function(obj){
      return obj.x == C.WIDTH - obj.w - C.PDNG
    }
  },

  isWin : function(){ //победили?
    return o.box.x == o.door.x && o.box.y == o.door.y;
  }
};

},{"./_canvas.js":1,"./_const.js":2,"./_levels.js":8,"./_objects.js":9}],8:[function(require,module,exports){
var C = require('./_const.js');
var o = require('./_objects.js');

module.exports = levels = {

	lvlsCount : function(){
		var count = 0;
		for (key in levels){ count++ };
			return count-1;
	},

	1 : function(){

		var _walls = [];  //массив с будущепостроенными стенками
		var arr = [       
		[2,3],[2,4],[2,5],[3,0],[3,6],[3,8],[4,2],[5,1],[5,3],[5,7],[6,4],[7,4],[7,6],[8,1],[8,8],[9,0],[9,4],[9,5]
		];				  //придуманный массив со стенками

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  //заполняем массив walls

		o.box.setPosition( C.PDNG+2*(50+C.PDNG), C.PDNG+8*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG, C.PDNG*2+50 );
		o.door.setPosition( C.PDNG+8*(50+C.PDNG), C.PDNG+1*(50+C.PDNG) );

		o.walls = _walls;

	},

	2 : function(){

		var _walls = [];  
		var arr = [       
		[1,0],[1,4],[1,6],[3,2],[3,4],[4,8],[4,0],[1,3],[4,7],[5,2],[5,4],[5,5],[5,6],[6,0],[7,2],[7,5],[7,6],[7,7],[8,0],[9,3],[9,4],[9,7]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.box.setPosition( C.PDNG+6*(50+C.PDNG), C.PDNG+8*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG, C.PDNG+9*(50+C.PDNG) );
		o.door.setPosition( C.PDNG+8*(50+C.PDNG), C.PDNG+7*(50+C.PDNG) );

		o.walls = _walls;

	},

	3 : function(){

		var _walls = [];  
		var arr = [       
		[1,2],[1,7],[2,5],[2,8],[3,2],[3,7],[4,4],[5,1],[5,4],[5,6],[7,2],[7,3],[7,4],[7,6],[7,8],[8,0],[8,5],[9,0],[9,1],[9,3],[9,7]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.box.setPosition( C.PDNG+1*(50+C.PDNG), C.PDNG+7*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG+8*(50+C.PDNG), C.PDNG+9*(50+C.PDNG) );
		o.door.setPosition( C.PDNG+2*(50+C.PDNG), C.PDNG+4*(50+C.PDNG) );

		o.walls = _walls;

	},

	4 : function(){

		var _walls = [];  
		var arr = [       
		[1,1],[2,5],[2,7],[3,4],[4,1],[4,3],[4,6],[4,8],[5,3],[6,5],[6,7],[7,0],[7,2],[7,3],[7,5],[8,8],[9,0],[9,8]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.box.setPosition( C.PDNG+7*(50+C.PDNG), C.PDNG+8*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG+7*(50+C.PDNG), C.PDNG+9*(50+C.PDNG) );
		o.door.setPosition( C.PDNG+6*(50+C.PDNG), C.PDNG+1*(50+C.PDNG) );

		o.walls = _walls;

	},

	5 : function(){

		var _walls = [];  
		var arr = [       
		[1,1],[1,3],[1,5],[1,8],[3,2],[3,4],[3,6],[3,8],[5,0],[5,3],[5,5],[5,7],[7,1],[7,2],[7,4],[7,7],[8,8],[9,2],[9,4],[9,8]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.box.setPosition( C.PDNG+1*(50+C.PDNG), C.PDNG+2*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG, C.PDNG+1*(50+C.PDNG) );
		o.door.setPosition( C.PDNG, C.PDNG+9*(50+C.PDNG) );

		o.walls = _walls;

	}

};

},{"./_const.js":2,"./_objects.js":9}],9:[function(require,module,exports){
var C = require('./_const.js');
var cnvs = require('./_canvas.js');


function createMatrixBG(){
  var matrix = []; //массив для матричного вида уровня

  for (var i = 0; i < 10; i++){ //заполняем объект
    for (var j = 0; j < 9; j++){
      matrix.push( new Rect(C.PDNG+j*(50+C.PDNG), C.PDNG+i*(50+C.PDNG), 50, 50, "#FEA3A3") );
    }
  };

  return matrix
};

function createMenu(txtArr, nameArr, fontsize){  //создаем главное меню
  var menu = [];
  var names = nameArr;
  var txt = txtArr;
  var _fontsize = fontsize;
  var amounts = txtArr.length;
  
  var _height = (C.HEIGHT/2) - (75*amounts/2); 
  var _width = C.WIDTH/2-230/2;

  for (var i = 0; i < amounts; i++){
    menu.push( new Button( _width, _height+i*75, 230, 50, "black", txt[i], names[i], _fontsize ) );
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

var grd = cnvs.ctx.createLinearGradient(C.WIDTH, 0, C.WIDTH, 50+C.PDNG);
grd.addColorStop(0, 'black');   
grd.addColorStop(1, 'grey');



//menu
var menu = createMenu(["Играть", "Выбор уровня", "Настройки"],["play", "change_level", "options"], "30");


//background 
var matrix = createMatrixBG(); //bg уровня
var bg = new Image("img/rect-bg.jpg"); //bg в главном меню
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//game header
var header = new Rect( 0, 0, C.WIDTH, 50+C.PDNG, grd );
var bFullScr = new Button( C.WIDTH-50-5, header.h/2-C.CNV_BORDER/2 - 40/2, 50, 40, "#34BACA", "FS", "fullScr", 25 );
var stopWatch = new Button( 5, header.h/2-C.CNV_BORDER/2 - 40/2, 145, 40, "#34BACA", "00 : 00 : 00", "stopwatch", 25 );
var bPause = new Button( C.WIDTH-90-5-bFullScr.w-8, header.h/2-C.CNV_BORDER/2 - 40/2, 90, 40, "#34BACA", "Пауза", "pause", 25 );
var currLevel = new Button( (stopWatch.x+stopWatch.w+bPause.x)/2-140/2, header.h/2-C.CNV_BORDER/2 - 40/2, 140, 40, "#34BACA", "Уровень", "curr_level", 25 );


//change level
var levelsHeader = new Button( 0, 0, C.WIDTH, 50+C.PDNG, grd, "Выбор уровня", "levels_header", 25 );
var bLevelsButtons = createLevelsButtons(5);
var levelsFooter = createLevelsFooter();


//win pop-up
var winPopUp = createWinPopUp();


//pause pop-up
var pausePopUp = createPausePopUp(["Вернуться", "Заново", "Выход"],["return", "restart", "exit"], "20");


//playable obj
var pl = new Rect(C.PDNG,C.PDNG*2+50,50,50,"black");  //игрок
var box = new Rect(C.PDNG,C.PDNG*2+50,50,50,"#3D5DFF"); //бокс
var door = new Rect(C.PDNG,C.PDNG*2+50,50,50, "rgba(231, 23, 32, 0.8)"); //дверь
var walls = []; //стены на уровне, заполняется выбранным уровнем.


module.exports = {

	matrix : matrix,
	menu : menu,
	header : header,
  stopWatch : stopWatch,
  bPause : bPause,
  bFullScr : bFullScr,
  pl : pl,
  box : box,
  door : door,
  bg : bg,
  walls : walls,
  winPopUp : winPopUp,
  pausePopUp : pausePopUp,
  bgOpacity : bgOpacity,
  currLevel : currLevel,
  levelsHeader : levelsHeader,
  bLevelsButtons : bLevelsButtons,
  levelsFooter : levelsFooter

};


},{"./_canvas.js":1,"./_const.js":2}],10:[function(require,module,exports){
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
},{"./_gameLoops.js":6,"./_objects.js":9}],11:[function(require,module,exports){
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Button = function(x, y, w, h, color, txt, name, fSize){
  
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = color;
  this.txt = txt;
  this.name = name;
  this.fSize = fSize;
  this.txtColor = "white";

  this.draw = function(noCenter, padd){

    var _padd = padd || 5;
    var _x = ( !noCenter ) ? this.x+this.w/2 : this.x+_padd;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = this.txtColor;
    ctx.textAlign = ( !noCenter ) ? "center" : "start";
    ctx.font = this.fSize + 'px Arial';
    ctx.textBaseline="middle"; 
    ctx.fillText(this.txt, _x, this.y+this.h/2);
  };

};
},{"./../_canvas.js":1}],12:[function(require,module,exports){
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
},{"./../_canvas.js":1}],13:[function(require,module,exports){
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
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
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
},{"./../_canvas.js":1,"./../_const.js":2}],14:[function(require,module,exports){
var engin = require('./_engine.js'),
    Button = require('./classes/Button.js'),
    Rect = require('./classes/Rect.js'),
    Image = require('./classes/Image.js'),
    C = require('./_const.js'),
    events = require('./_events.js'),
    levels = require('./_levels.js'),
    o = require('./_objects.js'),
    canvas = require('./_canvas.js');

engin.gameEngineStart(gameLoops.menu);





},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_levels.js":8,"./_objects.js":9,"./classes/Button.js":11,"./classes/Image.js":12,"./classes/Rect.js":13}]},{},[14])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19sZXZlbHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fb2JqZWN0cy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19zdG9wd2F0Y2guanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0J1dHRvbi5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvSW1hZ2UuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1JlY3QuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9mYWtlXzVhNzE5MDg2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgY252ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcbnZhciBjdHggPSBjbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuY252LnN0eWxlLmJvcmRlciA9IFwiMnB4IHNvbGlkIGJsYWNrXCI7XHJcbmNudi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIndoaXRlXCI7XHJcbmNudi53aWR0aCA9IEMuV0lEVEg7XHJcbmNudi5oZWlnaHQgPSBDLkhFSUdIVDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRjbnYgOiBjbnYsXHJcblxyXG5cdGN0eCA6IGN0eFxyXG5cclxufTsiLCJ2YXIgUEFERCA9IDE7IFx0XHRcdFx0XHRcdC8v0L/QsNC00LTQuNC90LMsINC60L7RgtC+0YDRi9C5INGPINGF0L7Rh9GDINGH0YLQvtCx0Ysg0LHRi9C7LCDQvNC10LYg0LrQstCw0LTRgNCw0YLQsNC80LhcclxudmFyIFdJRFRIID0gUEFERCArIChQQUREKzUwKSo5OyBcdC8v0YjQuNGA0LjQvdCwINC60LDQvdCy0YtcclxudmFyIEhFSUdIVCA9IFBBREQgKyAoUEFERCs1MCkqMTA7ICAgLy/QstGL0YHQvtGC0LAg0LrQsNC90LLRi1xyXG52YXIgQ05WX0JPUkRFUiA9IDI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0UERORyA6IFBBREQsXHJcblxyXG5cdFdJRFRIIDogV0lEVEgsXHJcblxyXG5cdEhFSUdIVCA6IEhFSUdIVCxcclxuXHJcblx0Q05WX0JPUkRFUiA6IENOVl9CT1JERVJcclxuXHJcbn07IiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4vLyoq0LrRgNC+0YHQsdGA0LDRg9C30LXRgNC90L7QtSDRg9C/0YDQstC70LXQvdC40LUg0YbQuNC60LvQsNC80Lgg0LjQs9GA0YsqKlxyXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG52YXIgZ2FtZUVuZ2luZTtcclxuXHJcbnZhciBuZXh0R2FtZVN0ZXAgPSAoZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0d2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0bW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0b1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0ZnVuY3Rpb24gKGNhbGxiYWNrKXtcclxuXHRcdHNldEludGVydmFsKGNhbGxiYWNrLCAxMDAwLzYwKVxyXG5cdH07XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBnYW1lRW5naW5lU3RlcCgpe1xyXG5cdGdhbWVFbmdpbmUoKTtcclxuXHRuZXh0R2FtZVN0ZXAoZ2FtZUVuZ2luZVN0ZXApO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gc2V0R2FtZUVuZ2luZSgpe1xyXG5cdGdhbWVFbmdpbmUgPSBjYWxsYmFjaztcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Z2FtZUVuZ2luZVN0YXJ0IDogZnVuY3Rpb24gKGNhbGxiYWNrKXtcclxuXHRcdGdhbWVFbmdpbmUgPSBjYWxsYmFjaztcclxuXHRcdGdhbWVFbmdpbmVTdGVwKCk7XHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBzdyA9IHJlcXVpcmUoJy4vX3N0b3B3YXRjaC5qcycpO1xyXG52YXIgbGV2ZWxzID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyk7XHJcbnZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG52YXIgZ0xvbyA9IHJlcXVpcmUoJy4vX2dhbWVMb29wcy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgZnMgPSByZXF1aXJlKCcuL19mdWxsU2NyZWVuLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBnYW1lTG9vcHMgPSBnTG9vO1xyXG5cclxuXHJcbnZhciBpc05lYXIgPSB7IC8v0L/RgNC40L3QuNC80LDQtdGCIDIg0L7QsdGK0LXQutGC0LAsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC80L7QuSDRgdGC0L7RgNC+0L3RiyAx0YvQuSDQvtGCIDLQs9C+LlxyXG5cclxuICB1cCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnkgKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMltpXS54O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnkgKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gIH0sXHJcblxyXG4gIGRvd24gOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBsZWZ0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueCArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzIueCArIG9ial8yLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfSxcclxuXHJcbiAgcmlnaHQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBtb3ZlUmVjdHMoZGlyZWN0aW9uKXsgIC8vKNC+0L/QuNGB0YvQstCw0LXQvCDQs9GA0LDQvdC40YbRiyDQtNCy0LjQttC10L3QuNGPKSDRgNCw0LfRgNC10YjQsNC10YIg0LTQstC40LbQtdC90LjQtSDQsiDQv9GA0LXQtNC10LvQsNGFINGD0YDQvtCy0L3Rj1xyXG5cclxuICBpZiAoIGlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8uYm94KSAmJiAhaGYuaXNCb3JkZXJbZGlyZWN0aW9uXShvLmJveCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8uYm94LCBvLndhbGxzKSApeyAvL9C10YHQu9C4INGA0Y/QtNC+0Lwg0YEg0Y/RidC40LrQvtC8INC4INGP0YnQuNC6INC90LUg0YMg0LPRgNCw0L3QuNGGLCDQtNCy0LjQs9Cw0LXQvC5cclxuICAgIG8ucGwubW92ZShkaXJlY3Rpb24pO1xyXG4gICAgby5ib3gubW92ZShkaXJlY3Rpb24pO1xyXG4gIH0gZWxzZSBpZiggIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8uYm94KSAmJiAhaGYuaXNCb3JkZXJbZGlyZWN0aW9uXShvLnBsKSAmJiAhaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby53YWxscykgKXsgLy/QtdGB0LvQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0Y/RidC40LrQvtC8INC4INC90LUg0YDRj9C00L7QvCDRgSDQs9GA0LDQvdC40YbQtdC5LCDQtNCy0LjQs9Cw0LXQvNGB0Y8uXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBpc0N1cnNvckluQnV0dG9uKHgseSxidXQpeyAvL9Cy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGC0YDRgywg0LXRgdC70Lgg0LrRg9GA0YHQvtGAINC/0L7Qv9Cw0Lsg0LIg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L7QsdGK0LXQutGC0LBcclxuICByZXR1cm4geCA+PSBidXQueCAmJiBcclxuICB4IDw9IGJ1dC54K2J1dC53ICYmIFxyXG4gIHkgPj0gYnV0LnkgJiYgXHJcbiAgeSA8PSBidXQueStidXQuaFxyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZExldmVsKG51bWJlcil7IC8v0LfQsNCz0YDRg9C30LrQsCDRg9GA0L7QstC90Y9cclxuICBzdy5zdGFydCgpO1xyXG4gIGxldmVsc1tudW1iZXJdKCk7IFxyXG4gIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBudW1iZXI7IFxyXG4gIG8uY3VyckxldmVsLnR4dCA9IFwi0KPRgNC+0LLQtdC90YwgXCIrbnVtYmVyO1xyXG4gIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMucGxMZXZlbCk7XHJcbn07XHJcblxyXG53aW5kb3cub25rZXlkb3duID0gZnVuY3Rpb24oZSl7IC8v0YHQvtCx0YvRgtC40LUg0L3QsNC20LDRgtC40Y8g0LrQu9Cw0LLQuNGI0YxcclxuXHJcbiAgaWYgKCBnTG9vLnN0YXR1cyA9PSBcImdhbWVcIiApeyAvL9C/0LXRgNC10LTQstC40LPQsNGC0YzRgdGPINGC0L7Qu9GM0LrQviDQtdGB0LvQuCDQuNC00LXRgiDQuNCz0YDQsC5cclxuXHJcbiAgICBpZiAoIGUua2V5ID09IFwiZFwiIHx8IGUua2V5ID09IFwiQXJyb3dSaWdodFwiICkgIFxyXG4gICAgICBtb3ZlUmVjdHMoXCJyaWdodFwiKTtcclxuXHJcbiAgICBpZiAoIGUua2V5ID09IFwic1wiIHx8IGUua2V5ID09IFwiQXJyb3dEb3duXCIgKSAgXHJcbiAgICAgIG1vdmVSZWN0cyhcImRvd25cIik7XHJcblxyXG4gICAgaWYgKCBlLmtleSA9PSBcIndcIiB8fCBlLmtleSA9PSBcIkFycm93VXBcIiApXHJcbiAgICAgIG1vdmVSZWN0cyhcInVwXCIpO1xyXG5cclxuICAgIGlmICggZS5rZXkgPT0gXCJhXCIgfHwgZS5rZXkgPT0gXCJBcnJvd0xlZnRcIiApXHJcbiAgICAgIG1vdmVSZWN0cyhcImxlZnRcIik7XHJcblxyXG4gIH07XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKXsgLy9j0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC80YvRiNC60LhcclxuXHJcbiAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcblxyXG4gIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSAmJiBnTG9vLnN0YXR1cyA9PSBcIm1lbnVcIiApeyAgXHJcbiAgICAgIGlmICggby5tZW51W2ldLm5hbWUgPT0gXCJwbGF5XCIgKXsgICAgLy/QtdGB0LvQuCDQvdCw0LbQsNGC0LAg0LrQvdC+0L/QutCwINC40LPRgNCw0YLRjCwg0LfQsNC/0YPRgdC60LDQtdC8INGD0YDQvtCy0LXQvdGMLlxyXG4gICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgfSBlbHNlIGlmICggby5tZW51W2ldLm5hbWUgPT0gXCJjaGFuZ2VfbGV2ZWxcIiApeyAgIFxyXG4gICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubGV2ZWxzKTtcclxuICAgICAgfTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby53aW5Qb3BVcFtpXSkgJiYgZ0xvby5zdGF0dXMgPT0gXCJ3aW5cIiApe1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgaWYoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8ucGF1c2VQb3BVcFtpXSkgJiYgZ0xvby5zdGF0dXMgPT0gXCJwYXVzZVwiICl7XHJcbiAgICAgIGlmICggby5wYXVzZVBvcFVwW2ldLm5hbWUgPT0gXCJyZXR1cm5cIiApe1xyXG4gICAgICAgIHN3LnN0YXJ0KCk7XHJcbiAgICAgICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wbExldmVsKTtcclxuICAgICAgfSBlbHNlIGlmICggby5wYXVzZVBvcFVwW2ldLm5hbWUgPT0gXCJyZXN0YXJ0XCIgKXtcclxuICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgIGxvYWRMZXZlbChnYW1lTG9vcHMuY3VycmVudExldmVsKTtcclxuICAgICAgfSBlbHNlIGlmICggby5wYXVzZVBvcFVwW2ldLm5hbWUgPT0gXCJleGl0XCIgKXtcclxuICAgICAgICBzdy5yZXNldCgpO1xyXG4gICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG4gIH07XHJcbiAgXHJcbiAgaWYoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYlBhdXNlKSAmJiBnTG9vLnN0YXR1cyA9PSBcImdhbWVcIiApe1xyXG4gICAgc3cucGF1c2VUaW1lcigpO1xyXG4gICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wYXVzZSk7XHJcbiAgfTtcclxuXHJcbiAgaWYoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkZ1bGxTY3IpICYmIGdMb28uc3RhdHVzID09IFwiZ2FtZVwiKXtcclxuICAgICggIWZzLnN0YXR1cyApID8gZnMubGF1bmNoRnVsbFNjcmVlbihjYW52YXMuY252KSA6IGZzLmNhbnNlbEZ1bGxTY3JlZW4oKTsgXHJcbiAgfTtcclxuXHJcbiAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby53aW5Qb3BVcFtpXSkgJiYgZ0xvby5zdGF0dXMgPT0gXCJ3aW5cIiApe1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcInBvcF9leGl0XCIgKXtcclxuICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLm1lbnUpO1xyXG4gICAgICB9IGVsc2UgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgIT0gbGV2ZWxzLmx2bHNDb3VudCgpICl7XHJcbiAgICAgICAgc3cucmVzZXQoKTtcclxuICAgICAgICBnYW1lTG9vcHMuY3VycmVudExldmVsKys7XHJcbiAgICAgICAgbG9hZExldmVsKGdhbWVMb29wcy5jdXJyZW50TGV2ZWwpO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBmb3IgKCBpIGluIG8ubGV2ZWxzRm9vdGVyICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5sZXZlbHNGb290ZXJbaV0pICYmIGdMb28uc3RhdHVzID09IFwibGV2ZWxzXCIgKXtcclxuICAgICAgaWYgKCBvLmxldmVsc0Zvb3RlcltpXS5uYW1lID09IFwicHJldlwiICl7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLQmtC90L7Qv9C60LAg0L3QsNC30LDQtCwg0L/QvtC60LAg0YLQsNC6LlwiKTtcclxuICAgICAgfSBlbHNlIGlmICggby5sZXZlbHNGb290ZXJbaV0ubmFtZSA9PSBcInRvX21lbnVcIiApe1xyXG4gICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoIG8ubGV2ZWxzRm9vdGVyW2ldLm5hbWUgPT0gXCJuZXh0XCIgKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcItCa0L3QvtC/0LrQsCDQstC/0LXRgNC10LQsINC/0L7QutCwINGC0LDQui5cIik7XHJcbiAgICAgIH07IFxyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvLmJMZXZlbHNCdXR0b25zLmxlbmd0aDsgaSsrICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iTGV2ZWxzQnV0dG9uc1tpXSkgJiYgZ0xvby5zdGF0dXMgPT0gXCJsZXZlbHNcIiApe1xyXG4gICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBpKzE7XHJcbiAgICAgICAgbG9hZExldmVsKGkrMSk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdGxhdW5jaEZ1bGxTY3JlZW4gOiBmdW5jdGlvbihlbGVtKXtcclxuXHJcblx0XHRpZiAoIGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5yZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZWxlbS5tb3pSZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLm1velJlcXVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLnN0YXR1cyA9IHRydWU7IFxyXG5cdH0sXHJcblxyXG5cdGNhbnNlbEZ1bGxTY3JlZW4gOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdGlmICggZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5zdGF0dXMgPSBmYWxzZTtcclxuXHR9LFxyXG5cclxuXHRzdGF0dXMgOiBmYWxzZVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVMb29wcyA9ICB7XHJcblxyXG4gIHBsTGV2ZWwgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcImdhbWVcIjsgXHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTsgLy/QvtGH0LjRgdGC0LrQsCDQvtCx0LvQsNGB0YLQuFxyXG5cclxuICAgIC8v0LLRi9Cy0L7QtNC40Lwg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1INC40LPRgNGLXHJcbiAgICBmb3IgKCBpIGluIG8ubWF0cml4ICl7XHJcbiAgICAgIG8ubWF0cml4W2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy/QstGL0LLQvtC00LjQvCDRgdGC0LXQvdGLXFzQv9GA0LXQs9GA0LDQtNGLXHJcbiAgICBmb3IgKCBpIGluIG8ud2FsbHMgKXtcclxuICAgICAgby53YWxsc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8qKioq0JLRi9Cy0L7QtNC40Lwg0KXQtdC00LXRgCoqKioqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIG8uaGVhZGVyLmRyYXcoKTtcclxuICAgIG8uc3RvcFdhdGNoLmRyYXcoMSwxMCk7XHJcbiAgICBvLmJGdWxsU2NyLmRyYXcoKTtcclxuICAgIG8uYlBhdXNlLmRyYXcoKTtcclxuICAgIG8uY3VyckxldmVsLmRyYXcoKTtcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKioqKtCS0YvQstC+0LTQuNC8INC+0LHRitC10LrRgtGLKioqKipcclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgby5wbC5kcmF3KCk7XHJcbiAgICBvLmJveC5kcmF3KCk7XHJcbiAgICBvLmRvb3IuZHJhdygpO1xyXG5cclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8qKioq0JXRgdC70Lgg0L/QvtCx0LXQtNC40LvQuCoqKioqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIGlmICggaGYuaXNXaW4oKSApe1xyXG4gICAgICBvLmJnT3BhY2l0eS5kcmF3KCk7XHJcbiAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMud2luKTtcclxuICAgIH07XHJcblxyXG4gIH0sXHJcblxyXG4gIG1lbnUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIm1lbnVcIjtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8uYmcuZHJhd0ltZygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgIG8ubWVudVtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICB9LFxyXG5cclxuICB3aW4gOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIndpblwiO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby53aW5Qb3BVcCApe1xyXG4gICAgICBpZiAoIG8ud2luUG9wVXBbaV0ubmFtZSA9PSBcIndpbl90ZXh0XCIgKSBvLndpblBvcFVwW2ldLnR4dCA9IFwi0KPRgNC+0LLQtdC90YwgXCIrZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCtcIiDQv9GA0L7QudC00LXQvSFcIjtcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfbmV4dFwiICYmIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPT0gbGV2ZWxzLmx2bHNDb3VudCgpICkge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG8ud2luUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgICB9ICBcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgcGF1c2UgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcInBhdXNlXCI7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLnBhdXNlUG9wVXAgKXtcclxuICAgICAgby5wYXVzZVBvcFVwW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgbGV2ZWxzIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJsZXZlbHNcIjtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8ubGV2ZWxzSGVhZGVyLmRyYXcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8uYkxldmVsc0J1dHRvbnMgKXtcclxuICAgICAgby5iTGV2ZWxzQnV0dG9uc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5sZXZlbHNGb290ZXIgKXtcclxuICAgICAgby5sZXZlbHNGb290ZXJbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgfSxcclxuXHJcbiAgc3RhdHVzIDogXCJcIixcclxuXHJcbiAgY3VycmVudExldmVsIDogXCIxXCJcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbGV2ZWxzID0gcmVxdWlyZSgnLi9fbGV2ZWxzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgY2xlYXJSZWN0IDogZnVuY3Rpb24oeCx5LHcsaCl7ICAvL9C+0YfQuNGB0YLQuNGC0LXQu9GMXHJcbiAgICBjdHguY2xlYXJSZWN0KHgseSx3LGgpO1xyXG4gIH0sXHJcblxyXG4gIGdldFJhbmRvbUludCA6IGZ1bmN0aW9uKG1pbiwgbWF4KSB7IC8v0YTRg9C90LrRhtC40Y8g0LTQu9GPINGA0LDQvdC00L7QvNCwINGG0LXQu9C+0YfQuNGB0LvQtdC90L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRj1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbiAgfSxcclxuXHJcbiAgaXNCb3JkZXIgOiB7IC8v0L/RgNC40L3QuNC80LDQtdGCINC+0LHRitC10LrRgiwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10L7QvNC5INCz0YDQsNC90LjRhtGLINC60LDQvdCy0YtcclxuICAgIHVwIDogZnVuY3Rpb24ob2JqKXtcclxuICAgICAgcmV0dXJuIG9iai55ID09IEMuUERORyArIG9iai5oICsgQy5QRE5HO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb3duIDogZnVuY3Rpb24ob2JqKXtcclxuICAgICAgcmV0dXJuIG9iai55ID09IEMuSEVJR0hUIC0gb2JqLmggLSBDLlBETkc7XHJcbiAgICB9LFxyXG5cclxuICAgIGxlZnQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gb2JqLnggPT0gQy5QRE5HO1xyXG4gICAgfSxcclxuXHJcbiAgICByaWdodCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueCA9PSBDLldJRFRIIC0gb2JqLncgLSBDLlBETkdcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBpc1dpbiA6IGZ1bmN0aW9uKCl7IC8v0L/QvtCx0LXQtNC40LvQuD9cclxuICAgIHJldHVybiBvLmJveC54ID09IG8uZG9vci54ICYmIG8uYm94LnkgPT0gby5kb29yLnk7XHJcbiAgfVxyXG59O1xyXG4iLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbHMgPSB7XHJcblxyXG5cdGx2bHNDb3VudCA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0Zm9yIChrZXkgaW4gbGV2ZWxzKXsgY291bnQrKyB9O1xyXG5cdFx0XHRyZXR1cm4gY291bnQtMTtcclxuXHR9LFxyXG5cclxuXHQxIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICAvL9C80LDRgdGB0LjQsiDRgSDQsdGD0LTRg9GJ0LXQv9C+0YHRgtGA0L7QtdC90L3Ri9C80Lgg0YHRgtC10L3QutCw0LzQuFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMiwzXSxbMiw0XSxbMiw1XSxbMywwXSxbMyw2XSxbMyw4XSxbNCwyXSxbNSwxXSxbNSwzXSxbNSw3XSxbNiw0XSxbNyw0XSxbNyw2XSxbOCwxXSxbOCw4XSxbOSwwXSxbOSw0XSxbOSw1XVxyXG5cdFx0XTtcdFx0XHRcdCAgLy/Qv9GA0LjQtNGD0LzQsNC90L3Ri9C5INC80LDRgdGB0LjQsiDRgdC+INGB0YLQtdC90LrQsNC80LhcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFJlY3QoQy5QRE5HK2FycltpXVsxXSooNTArQy5QRE5HKSwgQy5QRE5HK2FycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwLCBcIiM2MjJEQTFcIikgKTtcclxuXHRcdH07XHRcdFx0XHQgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC80LDRgdGB0LjQsiB3YWxsc1xyXG5cclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCBDLlBETkcrMiooNTArQy5QRE5HKSwgQy5QRE5HKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIEMuUERORywgQy5QRE5HKjIrNTAgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggQy5QRE5HKzgqKDUwK0MuUERORyksIEMuUERORysxKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MiA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFsxLDBdLFsxLDRdLFsxLDZdLFszLDJdLFszLDRdLFs0LDhdLFs0LDBdLFsxLDNdLFs0LDddLFs1LDJdLFs1LDRdLFs1LDVdLFs1LDZdLFs2LDBdLFs3LDJdLFs3LDVdLFs3LDZdLFs3LDddLFs4LDBdLFs5LDNdLFs5LDRdLFs5LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFJlY3QoQy5QRE5HK2FycltpXVsxXSooNTArQy5QRE5HKSwgQy5QRE5HK2FycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwLCBcIiM2MjJEQTFcIikgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCBDLlBETkcrNiooNTArQy5QRE5HKSwgQy5QRE5HKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIEMuUERORywgQy5QRE5HKzkqKDUwK0MuUERORykgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggQy5QRE5HKzgqKDUwK0MuUERORyksIEMuUERORys3Kig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fSxcclxuXHJcblx0MyA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgXHJcblx0XHR2YXIgYXJyID0gWyAgICAgICBcclxuXHRcdFsxLDJdLFsxLDddLFsyLDVdLFsyLDhdLFszLDJdLFszLDddLFs0LDRdLFs1LDFdLFs1LDRdLFs1LDZdLFs3LDJdLFs3LDNdLFs3LDRdLFs3LDZdLFs3LDhdLFs4LDBdLFs4LDVdLFs5LDBdLFs5LDFdLFs5LDNdLFs5LDddXHJcblx0XHRdO1x0XHRcdFx0ICBcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFJlY3QoQy5QRE5HK2FycltpXVsxXSooNTArQy5QRE5HKSwgQy5QRE5HK2FycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwLCBcIiM2MjJEQTFcIikgKTtcclxuXHRcdH07XHRcdFx0XHQgIFxyXG5cclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCBDLlBETkcrMSooNTArQy5QRE5HKSwgQy5QRE5HKzcqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIEMuUERORys4Kig1MCtDLlBETkcpLCBDLlBETkcrOSooNTArQy5QRE5HKSApO1xyXG5cdFx0by5kb29yLnNldFBvc2l0aW9uKCBDLlBETkcrMiooNTArQy5QRE5HKSwgQy5QRE5HKzQqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9LFxyXG5cclxuXHQ0IDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICBcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzEsMV0sWzIsNV0sWzIsN10sWzMsNF0sWzQsMV0sWzQsM10sWzQsNl0sWzQsOF0sWzUsM10sWzYsNV0sWzYsN10sWzcsMF0sWzcsMl0sWzcsM10sWzcsNV0sWzgsOF0sWzksMF0sWzksOF1cclxuXHRcdF07XHRcdFx0XHQgIFxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXsgXHJcblx0XHRcdF93YWxscy5wdXNoKCBuZXcgUmVjdChDLlBETkcrYXJyW2ldWzFdKig1MCtDLlBETkcpLCBDLlBETkcrYXJyW2ldWzBdKig1MCtDLlBETkcpLCA1MCwgNTAsIFwiIzYyMkRBMVwiKSApO1xyXG5cdFx0fTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0by5ib3guc2V0UG9zaXRpb24oIEMuUERORys3Kig1MCtDLlBETkcpLCBDLlBETkcrOCooNTArQy5QRE5HKSApO1xyXG5cdFx0by5wbC5zZXRQb3NpdGlvbiggQy5QRE5HKzcqKDUwK0MuUERORyksIEMuUERORys5Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIEMuUERORys2Kig1MCtDLlBETkcpLCBDLlBETkcrMSooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH0sXHJcblxyXG5cdDUgOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdHZhciBfd2FsbHMgPSBbXTsgIFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMSwxXSxbMSwzXSxbMSw1XSxbMSw4XSxbMywyXSxbMyw0XSxbMyw2XSxbMyw4XSxbNSwwXSxbNSwzXSxbNSw1XSxbNSw3XSxbNywxXSxbNywyXSxbNyw0XSxbNyw3XSxbOCw4XSxbOSwyXSxbOSw0XSxbOSw4XVxyXG5cdFx0XTtcdFx0XHRcdCAgXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBSZWN0KEMuUERORythcnJbaV1bMV0qKDUwK0MuUERORyksIEMuUERORythcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCwgXCIjNjIyREExXCIpICk7XHJcblx0XHR9O1x0XHRcdFx0ICBcclxuXHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggQy5QRE5HKzEqKDUwK0MuUERORyksIEMuUERORysyKig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCBDLlBETkcsIEMuUERORysxKig1MCtDLlBETkcpICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIEMuUERORywgQy5QRE5HKzkqKDUwK0MuUERORykgKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9XHJcblxyXG59O1xyXG4iLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBjbnZzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWF0cml4QkcoKXtcclxuICB2YXIgbWF0cml4ID0gW107IC8v0LzQsNGB0YHQuNCyINC00LvRjyDQvNCw0YLRgNC40YfQvdC+0LPQviDQstC40LTQsCDRg9GA0L7QstC90Y9cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKXsgLy/Qt9Cw0L/QvtC70L3Rj9C10Lwg0L7QsdGK0LXQutGCXHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDk7IGorKyl7XHJcbiAgICAgIG1hdHJpeC5wdXNoKCBuZXcgUmVjdChDLlBETkcraiooNTArQy5QRE5HKSwgQy5QRE5HK2kqKDUwK0MuUERORyksIDUwLCA1MCwgXCIjRkVBM0EzXCIpICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1hdHJpeFxyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWVudSh0eHRBcnIsIG5hbWVBcnIsIGZvbnRzaXplKXsgIC8v0YHQvtC30LTQsNC10Lwg0LPQu9Cw0LLQvdC+0LUg0LzQtdC90Y5cclxuICB2YXIgbWVudSA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IG5hbWVBcnI7XHJcbiAgdmFyIHR4dCA9IHR4dEFycjtcclxuICB2YXIgX2ZvbnRzaXplID0gZm9udHNpemU7XHJcbiAgdmFyIGFtb3VudHMgPSB0eHRBcnIubGVuZ3RoO1xyXG4gIFxyXG4gIHZhciBfaGVpZ2h0ID0gKEMuSEVJR0hULzIpIC0gKDc1KmFtb3VudHMvMik7IFxyXG4gIHZhciBfd2lkdGggPSBDLldJRFRILzItMjMwLzI7XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYW1vdW50czsgaSsrKXtcclxuICAgIG1lbnUucHVzaCggbmV3IEJ1dHRvbiggX3dpZHRoLCBfaGVpZ2h0K2kqNzUsIDIzMCwgNTAsIFwiYmxhY2tcIiwgdHh0W2ldLCBuYW1lc1tpXSwgX2ZvbnRzaXplICkgKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gbWVudTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpblBvcFVwKCl7XHJcblxyXG4gIHZhciB3aW5Qb3BCRyA9IG5ldyBSZWN0KCBDLldJRFRILzItMjc1LzIsIEMuSEVJR0hULzItMTI1LzIsIDI3NSwgMTI1LCBcInJlZFwiICk7XHJcbiAgdmFyIGJQb3BFeGl0ID0gbmV3IEJ1dHRvbiggd2luUG9wQkcueCs1LCB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNS00MCwgOTAsIDQwLCBcImJsYWNrXCIsIFwi0JLRi9GF0L7QtFwiLCBcInBvcF9leGl0XCIsIDIwICk7XHJcbiAgdmFyIGJQb3BOZXh0ID0gbmV3IEJ1dHRvbiggd2luUG9wQkcueCt3aW5Qb3BCRy53LTUtOTAsIHdpblBvcEJHLnkrd2luUG9wQkcuaC01LTQwLCA5MCwgNDAsIFwiYmxhY2tcIiwgXCLQlNCw0LvQtdC1XCIsIFwicG9wX25leHRcIiwgMjAgKTtcclxuICB2YXIgd2luVGV4dCA9IG5ldyBCdXR0b24oIEMuV0lEVEgvMi05MC8yLCB3aW5Qb3BCRy55KzEwLCA5MCwgNDAsIFwidHJhbnNwYXJlbnRcIiwgXCLQo9GA0L7QstC10L3RjCBOINC/0YDQvtC50LTQtdC9IVwiLCBcIndpbl90ZXh0XCIsIDI1ICk7XHJcbiAgd2luVGV4dC50eHRDb2xvciA9IFwiYmxhY2tcIjtcclxuXHJcbiAgdmFyIHdpblBvcFVwID0gW107XHJcbiAgd2luUG9wVXAucHVzaCh3aW5Qb3BCRywgYlBvcEV4aXQsIGJQb3BOZXh0LCB3aW5UZXh0KTtcclxuXHJcbiAgcmV0dXJuIHdpblBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGF1c2VQb3BVcCh0eHRBcnIsIG5hbWVBcnIsIGZvbnRzaXplKXtcclxuXHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBfZm9udHNpemUgPSBmb250c2l6ZTtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcblxyXG4gIHZhciBfaGVpZ2h0ID0gKEMuSEVJR0hULzIpIC0gKDYwKmFtb3VudHMvMik7IFxyXG4gIHZhciBfd2lkdGggPSBDLldJRFRILzItMTUwLzI7XHJcblxyXG4gIHZhciBwYXVzZVBvcFVwID0gW25ldyBSZWN0KCBDLldJRFRILzItMjAwLzIsIF9oZWlnaHQtMzAsIDIwMCwgNjAqYW1vdW50cys0MCwgXCJyZWRcIiApXTtcclxuXHJcbiAgZm9yICh2YXIgaT0wOyBpPGFtb3VudHM7IGkrKyl7XHJcbiAgICBwYXVzZVBvcFVwLnB1c2goIG5ldyBCdXR0b24oIF93aWR0aCwgX2hlaWdodCtpKjYwLCAxNTAsIDQwLCBcImJsYWNrXCIsIHR4dFtpXSwgbmFtZXNbaV0sIF9mb250c2l6ZSApICk7IFxyXG4gIH07XHJcblxyXG4gIHJldHVybiBwYXVzZVBvcFVwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzQnV0dG9ucyhsZXZlbHNfY291bnQpe1xyXG5cclxuICB2YXIgYkxldmVsc0J1dHRvbnMgPSBbXTtcclxuICB2YXIgaiA9IDAsIGR5ID0gNzUsIGR4ID0gMDtcclxuXHJcbiAgZm9yICggaT0wOyBpIDwgbGV2ZWxzX2NvdW50OyBpKyspe1xyXG4gICAgZHggPSA4K2oqKDEwMCsxNSk7XHJcblxyXG4gICAgYkxldmVsc0J1dHRvbnMucHVzaCggbmV3IEJ1dHRvbiggZHgsIGR5LCAxMDAsIDEwMCwgXCJibGFja1wiLCBpKzEsIFwibGV2ZWxfXCIrKGkrMSksIDI1ICkgKTtcclxuXHJcbiAgICBqKys7XHJcblxyXG4gICAgaWYgKCBkeCA+IEMuV0lEVEgtMTE1ICl7XHJcbiAgICAgIGR5ICs9ICgxMjUpO1xyXG4gICAgICBqID0gMDtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGJMZXZlbHNCdXR0b25zO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGV2ZWxzRm9vdGVyKCl7XHJcblxyXG4gIHZhciBsZXZlbHNGb290ZXIgPSBbXTtcclxuXHJcbiAgdmFyIGJQcmV2ID0gbmV3IEJ1dHRvbiggMTAsIEMuSEVJR0hULTEwLTUwLCAxMDAsIDUwLCBcIiMzNEJBQ0FcIiwgXCLQndCw0LfQsNC0XCIsIFwicHJldlwiLCAyNSApO1xyXG4gIHZhciBiTmV4dCA9IG5ldyBCdXR0b24oIEMuV0lEVEgtMTAtMTAwLCBDLkhFSUdIVC0xMC01MCwgMTAwLCA1MCwgXCIjMzRCQUNBXCIsIFwi0JTQsNC70LXQtVwiLCBcIm5leHRcIiwgMjUgKTtcclxuICB2YXIgYlRvTWVudSA9IG5ldyBCdXR0b24oIChiUHJldi54K2JQcmV2LncrYk5leHQueCkvMi0yMjUvMiwgQy5IRUlHSFQtMTAtNTAsIDIyNSwgNTAsIFwiIzM0QkFDQVwiLCBcItCS0LXRgNC90YPRgtGM0YHRjyDQsiDQvNC10L3RjlwiLCBcInRvX21lbnVcIiwgMjUgKTtcclxuXHJcbiAgbGV2ZWxzRm9vdGVyLnB1c2goYlByZXYsYk5leHQsYlRvTWVudSk7XHJcblxyXG4gIHJldHVybiBsZXZlbHNGb290ZXI7XHJcbn07XHJcblxyXG52YXIgZ3JkID0gY252cy5jdHguY3JlYXRlTGluZWFyR3JhZGllbnQoQy5XSURUSCwgMCwgQy5XSURUSCwgNTArQy5QRE5HKTtcclxuZ3JkLmFkZENvbG9yU3RvcCgwLCAnYmxhY2snKTsgICBcclxuZ3JkLmFkZENvbG9yU3RvcCgxLCAnZ3JleScpO1xyXG5cclxuXHJcblxyXG4vL21lbnVcclxudmFyIG1lbnUgPSBjcmVhdGVNZW51KFtcItCY0LPRgNCw0YLRjFwiLCBcItCS0YvQsdC+0YAg0YPRgNC+0LLQvdGPXCIsIFwi0J3QsNGB0YLRgNC+0LnQutC4XCJdLFtcInBsYXlcIiwgXCJjaGFuZ2VfbGV2ZWxcIiwgXCJvcHRpb25zXCJdLCBcIjMwXCIpO1xyXG5cclxuXHJcbi8vYmFja2dyb3VuZCBcclxudmFyIG1hdHJpeCA9IGNyZWF0ZU1hdHJpeEJHKCk7IC8vYmcg0YPRgNC+0LLQvdGPXHJcbnZhciBiZyA9IG5ldyBJbWFnZShcImltZy9yZWN0LWJnLmpwZ1wiKTsgLy9iZyDQsiDQs9C70LDQstC90L7QvCDQvNC10L3RjlxyXG52YXIgYmdPcGFjaXR5ID0gbmV3IFJlY3QoMCwgMCwgQy5XSURUSCwgQy5IRUlHSFQsIFwicmdiYSgwLCAwLCAwLCAwLjUpXCIpO1xyXG5cclxuXHJcbi8vZ2FtZSBoZWFkZXJcclxudmFyIGhlYWRlciA9IG5ldyBSZWN0KCAwLCAwLCBDLldJRFRILCA1MCtDLlBETkcsIGdyZCApO1xyXG52YXIgYkZ1bGxTY3IgPSBuZXcgQnV0dG9uKCBDLldJRFRILTUwLTUsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCA1MCwgNDAsIFwiIzM0QkFDQVwiLCBcIkZTXCIsIFwiZnVsbFNjclwiLCAyNSApO1xyXG52YXIgc3RvcFdhdGNoID0gbmV3IEJ1dHRvbiggNSwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDE0NSwgNDAsIFwiIzM0QkFDQVwiLCBcIjAwIDogMDAgOiAwMFwiLCBcInN0b3B3YXRjaFwiLCAyNSApO1xyXG52YXIgYlBhdXNlID0gbmV3IEJ1dHRvbiggQy5XSURUSC05MC01LWJGdWxsU2NyLnctOCwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDkwLCA0MCwgXCIjMzRCQUNBXCIsIFwi0J/QsNGD0LfQsFwiLCBcInBhdXNlXCIsIDI1ICk7XHJcbnZhciBjdXJyTGV2ZWwgPSBuZXcgQnV0dG9uKCAoc3RvcFdhdGNoLngrc3RvcFdhdGNoLncrYlBhdXNlLngpLzItMTQwLzIsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCAxNDAsIDQwLCBcIiMzNEJBQ0FcIiwgXCLQo9GA0L7QstC10L3RjFwiLCBcImN1cnJfbGV2ZWxcIiwgMjUgKTtcclxuXHJcblxyXG4vL2NoYW5nZSBsZXZlbFxyXG52YXIgbGV2ZWxzSGVhZGVyID0gbmV3IEJ1dHRvbiggMCwgMCwgQy5XSURUSCwgNTArQy5QRE5HLCBncmQsIFwi0JLRi9Cx0L7RgCDRg9GA0L7QstC90Y9cIiwgXCJsZXZlbHNfaGVhZGVyXCIsIDI1ICk7XHJcbnZhciBiTGV2ZWxzQnV0dG9ucyA9IGNyZWF0ZUxldmVsc0J1dHRvbnMoNSk7XHJcbnZhciBsZXZlbHNGb290ZXIgPSBjcmVhdGVMZXZlbHNGb290ZXIoKTtcclxuXHJcblxyXG4vL3dpbiBwb3AtdXBcclxudmFyIHdpblBvcFVwID0gY3JlYXRlV2luUG9wVXAoKTtcclxuXHJcblxyXG4vL3BhdXNlIHBvcC11cFxyXG52YXIgcGF1c2VQb3BVcCA9IGNyZWF0ZVBhdXNlUG9wVXAoW1wi0JLQtdGA0L3Rg9GC0YzRgdGPXCIsIFwi0JfQsNC90L7QstC+XCIsIFwi0JLRi9GF0L7QtFwiXSxbXCJyZXR1cm5cIiwgXCJyZXN0YXJ0XCIsIFwiZXhpdFwiXSwgXCIyMFwiKTtcclxuXHJcblxyXG4vL3BsYXlhYmxlIG9ialxyXG52YXIgcGwgPSBuZXcgUmVjdChDLlBETkcsQy5QRE5HKjIrNTAsNTAsNTAsXCJibGFja1wiKTsgIC8v0LjQs9GA0L7QulxyXG52YXIgYm94ID0gbmV3IFJlY3QoQy5QRE5HLEMuUERORyoyKzUwLDUwLDUwLFwiIzNENURGRlwiKTsgLy/QsdC+0LrRgVxyXG52YXIgZG9vciA9IG5ldyBSZWN0KEMuUERORyxDLlBETkcqMis1MCw1MCw1MCwgXCJyZ2JhKDIzMSwgMjMsIDMyLCAwLjgpXCIpOyAvL9C00LLQtdGA0YxcclxudmFyIHdhbGxzID0gW107IC8v0YHRgtC10L3RiyDQvdCwINGD0YDQvtCy0L3QtSwg0LfQsNC/0L7Qu9C90Y/QtdGC0YHRjyDQstGL0LHRgNCw0L3QvdGL0Lwg0YPRgNC+0LLQvdC10LwuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdG1hdHJpeCA6IG1hdHJpeCxcclxuXHRtZW51IDogbWVudSxcclxuXHRoZWFkZXIgOiBoZWFkZXIsXHJcbiAgc3RvcFdhdGNoIDogc3RvcFdhdGNoLFxyXG4gIGJQYXVzZSA6IGJQYXVzZSxcclxuICBiRnVsbFNjciA6IGJGdWxsU2NyLFxyXG4gIHBsIDogcGwsXHJcbiAgYm94IDogYm94LFxyXG4gIGRvb3IgOiBkb29yLFxyXG4gIGJnIDogYmcsXHJcbiAgd2FsbHMgOiB3YWxscyxcclxuICB3aW5Qb3BVcCA6IHdpblBvcFVwLFxyXG4gIHBhdXNlUG9wVXAgOiBwYXVzZVBvcFVwLFxyXG4gIGJnT3BhY2l0eSA6IGJnT3BhY2l0eSxcclxuICBjdXJyTGV2ZWwgOiBjdXJyTGV2ZWwsXHJcbiAgbGV2ZWxzSGVhZGVyIDogbGV2ZWxzSGVhZGVyLFxyXG4gIGJMZXZlbHNCdXR0b25zIDogYkxldmVsc0J1dHRvbnMsXHJcbiAgbGV2ZWxzRm9vdGVyIDogbGV2ZWxzRm9vdGVyXHJcblxyXG59O1xyXG5cclxuIiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBnYW1lID0gcmVxdWlyZSgnLi9fZ2FtZUxvb3BzLmpzJyk7XHJcblxyXG52YXIgcGF1c2UgPSAwO1xyXG52YXIgYmVnaW5UaW1lID0gMDtcclxudmFyIGN1cnJlbnRUaW1lID0gMDtcclxudmFyIHVwVGltZVRPO1xyXG5cclxuZnVuY3Rpb24gdXBUaW1lKGNvdW50RnJvbSkge1xyXG5cdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG5cdHZhciBkaWZmZXJlbmNlID0gKG5vdy1jb3VudEZyb20gKyBjdXJyZW50VGltZSk7XHJcblxyXG5cdHZhciBob3Vycz1NYXRoLmZsb29yKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSkvKDYwKjYwKjEwMDApKjEpO1xyXG5cdHZhciBtaW5zPU1hdGguZmxvb3IoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKS8oNjAqMTAwMCkqMSk7XHJcblx0dmFyIHNlY3M9TWF0aC5mbG9vcigoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKSUoNjAqMTAwMCkpLzEwMDAqMSk7XHJcblxyXG5cdGhvdXJzID0gKCBob3VycyA8IDEwKSA/IFwiMFwiK2hvdXJzIDogaG91cnM7XHJcblx0bWlucyA9ICggbWlucyA8IDEwKSA/IFwiMFwiK21pbnMgOiBtaW5zO1xyXG5cdHNlY3MgPSAoIHNlY3MgPCAxMCkgPyBcIjBcIitzZWNzIDogc2VjcztcclxuXHJcblx0by5zdG9wV2F0Y2gudHh0ID0gaG91cnMrXCIgOiBcIittaW5zK1wiIDogXCIrc2VjcztcclxuXHJcblx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR1cFRpbWVUTz1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHVwVGltZShjb3VudEZyb20pOyB9LDEwMDAvNjApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRzdGFydCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly8gaWYgKGdhbWUuc3RhdHVzID09ICdnYW1lJyB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibWVudVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJwYXVzZVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJsZXZlbHNcIikge1xyXG5cdFx0XHR1cFRpbWUobmV3IERhdGUoKSk7XHJcblx0XHRcdHZhciBub3dUID0gbmV3IERhdGUoKTtcclxuXHRcdFx0YmVnaW5UaW1lID0gbm93VC5nZXRUaW1lKCk7XHJcblx0XHQvLyB9IGVsc2Uge1xyXG5cdFx0Ly8gXHR0aGlzLnJlc2V0KCk7XHJcblx0XHQvLyB9O1xyXG5cdH0sXHJcblxyXG5cdHJlc2V0IDogZnVuY3Rpb24oKSB7XHJcblx0XHRjdXJyZW50VGltZSA9IDA7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cclxuXHRcdG8uc3RvcFdhdGNoLnR4dCA9IFwiMDAgOiAwMCA6IDAwXCI7XHJcblx0XHQvLyB0aGlzLnN0YXJ0KCk7XHJcblx0fSxcclxuXHJcblx0cGF1c2VUaW1lciA6IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgY3VyRGF0YSA9IG5ldyBEYXRlKCk7XHJcblx0XHRjdXJyZW50VGltZSA9IGN1ckRhdGEuZ2V0VGltZSgpIC0gYmVnaW5UaW1lICsgY3VycmVudFRpbWU7XHJcblx0XHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdH1cclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b24gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvciwgdHh0LCBuYW1lLCBmU2l6ZSl7XHJcbiAgXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcbiAgdGhpcy50eHRDb2xvciA9IFwid2hpdGVcIjtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24obm9DZW50ZXIsIHBhZGQpe1xyXG5cclxuICAgIHZhciBfcGFkZCA9IHBhZGQgfHwgNTtcclxuICAgIHZhciBfeCA9ICggIW5vQ2VudGVyICkgPyB0aGlzLngrdGhpcy53LzIgOiB0aGlzLngrX3BhZGQ7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy50eHRDb2xvcjtcclxuICAgIGN0eC50ZXh0QWxpZ24gPSAoICFub0NlbnRlciApID8gXCJjZW50ZXJcIiA6IFwic3RhcnRcIjtcclxuICAgIGN0eC5mb250ID0gdGhpcy5mU2l6ZSArICdweCBBcmlhbCc7XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCBfeCwgdGhpcy55K3RoaXMuaC8yKTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlID0gZnVuY3Rpb24oc3JjKXtcclxuICB0aGlzLnNyYyA9IHNyYztcclxuICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xyXG5cclxuICB2YXIgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcblxyXG4gIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xyXG4gIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgaW1nLnNyYyA9IHNyYztcclxuXHJcbiAgdGhpcy5kb20gPSBpbWc7XHJcblxyXG4gIHRoaXMuZHJhd0ltZyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5sb2FkZWQgKSByZXR1cm47XHJcblxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmRvbSwwLDApO1xyXG5cclxuICB9O1xyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi8uLi9fY29uc3QuanMnKTtcclxudmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWN0ID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9O1xyXG5cclxufTsiLCJ2YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKSxcclxuICAgIEJ1dHRvbiA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9CdXR0b24uanMnKSxcclxuICAgIFJlY3QgPSByZXF1aXJlKCcuL2NsYXNzZXMvUmVjdC5qcycpLFxyXG4gICAgSW1hZ2UgPSByZXF1aXJlKCcuL2NsYXNzZXMvSW1hZ2UuanMnKSxcclxuICAgIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpLFxyXG4gICAgZXZlbnRzID0gcmVxdWlyZSgnLi9fZXZlbnRzLmpzJyksXHJcbiAgICBsZXZlbHMgPSByZXF1aXJlKCcuL19sZXZlbHMuanMnKSxcclxuICAgIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyksXHJcbiAgICBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxuXHJcbmVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcblxyXG5cclxuXHJcblxyXG4iXX0=
