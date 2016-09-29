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
  levels[number](); 
  gameLoops.currentLevel = number; 
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

window.onmousedown = function(e){

  var x = e.pageX-canvas.cnv.offsetLeft;
  var y = e.pageY-canvas.cnv.offsetTop;

  for ( i in o.menu ){
    if( isCursorInButton(x,y,o.menu[i]) && gLoo.status == "menu" ){  
      if ( o.menu[i].name == "play" ){    //если нажата кнопка играть, запускаем уровень.
        sw.start();
        loadLevel(1);
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
        loadLevel(1);
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
      o.winPopUp[i].draw();
    };
  },

  pause : function(){

    gameLoops.status = "pause";

    for ( i in o.pausePopUp ){
      o.pausePopUp[i].draw();
    };
  },

  status : "",

  currentLevel : ""

};
},{"./_const.js":2,"./_engine.js":3,"./_helperFunctions.js":7,"./_objects.js":9}],7:[function(require,module,exports){
var canvas = require('./_canvas.js');
var o = require('./_objects.js');
var C = require('./_const.js');

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

},{"./_canvas.js":1,"./_const.js":2,"./_objects.js":9}],8:[function(require,module,exports){
var C = require('./_const.js');
var o = require('./_objects.js');

module.exports = {

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

	}


};
},{"./_const.js":2,"./_objects.js":9}],9:[function(require,module,exports){
var C = require('./_const.js');
var cnvs = require('./_canvas.js');

function createMatrix(){
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
  var _width = C.WIDTH/2-200/2;

  for (var i = 0; i < amounts; i++){
    menu.push( new Button( _width, _height+i*75, 200, 50, "black", txt[i], names[i], _fontsize ) );
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

var grd = cnvs.ctx.createLinearGradient(C.WIDTH, 0, C.WIDTH, 50+C.PDNG);
grd.addColorStop(0, 'black');   
grd.addColorStop(1, 'grey');




//menu
var menu = createMenu(["Играть","Настройки"],["play", "options"], "30");


//background 
var matrix = createMatrix(); //bg уровня
var bg = new Image("img/rect-bg.jpg"); //bg в главном меню
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//header
var header = new Rect( 0, 0, C.WIDTH, 50+C.PDNG, grd );
var bFullScr = new Button( C.WIDTH-50-5, header.h/2-C.CNV_BORDER/2 - 40/2, 50, 40, "#34BACA", "FS", "fullScr", 25 );
var stopWatch = new Button( 5, header.h/2-C.CNV_BORDER/2 - 40/2, 145, 40, "#34BACA", "00 : 00 : 00", "stopwatch", 25 );
var bPause = new Button( C.WIDTH-90-5-bFullScr.w-10, header.h/2-C.CNV_BORDER/2 - 40/2, 90, 40, "#34BACA", "Пауза", "pause", 25 );


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
  bgOpacity : bgOpacity

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
		if (game.status == 'game' || gameLoops.status == "menu" || gameLoops.status == "pause") {
			upTime(new Date());
			var nowT = new Date();
			beginTime = nowT.getTime();
		} else {
			this.reset();
		};
	},

	reset : function() {
		currentTime = 0;
		clearTimeout(upTimeTO);

		o.stopWatch.txt = "00 : 00 : 00";
		this.start();
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
    o = require('./_objects.js'),
    events = require('./_events.js');
    canvas = require('./_canvas.js');

engin.gameEngineStart(gameLoops.menu);

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_objects.js":9,"./classes/Button.js":11,"./classes/Image.js":12,"./classes/Rect.js":13}]},{},[14])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19sZXZlbHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fb2JqZWN0cy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19zdG9wd2F0Y2guanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0J1dHRvbi5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvSW1hZ2UuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1JlY3QuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9mYWtlX2RiYjRkZGNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIGNudiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG52YXIgY3R4ID0gY252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbmNudi5zdHlsZS5ib3JkZXIgPSBcIjJweCBzb2xpZCBibGFja1wiO1xyXG5jbnYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ3aGl0ZVwiO1xyXG5jbnYud2lkdGggPSBDLldJRFRIO1xyXG5jbnYuaGVpZ2h0ID0gQy5IRUlHSFQ7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Y252IDogY252LFxyXG5cclxuXHRjdHggOiBjdHhcclxuXHJcbn07IiwidmFyIFBBREQgPSAxOyBcdFx0XHRcdFx0XHQvL9C/0LDQtNC00LjQvdCzLCDQutC+0YLQvtGA0YvQuSDRjyDRhdC+0YfRgyDRh9GC0L7QsdGLINCx0YvQuywg0LzQtdC2INC60LLQsNC00YDQsNGC0LDQvNC4XHJcbnZhciBXSURUSCA9IFBBREQgKyAoUEFERCs1MCkqOTsgXHQvL9GI0LjRgNC40L3QsCDQutCw0L3QstGLXHJcbnZhciBIRUlHSFQgPSBQQUREICsgKFBBREQrNTApKjEwOyAgIC8v0LLRi9GB0L7RgtCwINC60LDQvdCy0YtcclxudmFyIENOVl9CT1JERVIgPSAyO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdFBETkcgOiBQQURELFxyXG5cclxuXHRXSURUSCA6IFdJRFRILFxyXG5cclxuXHRIRUlHSFQgOiBIRUlHSFQsXHJcblxyXG5cdENOVl9CT1JERVIgOiBDTlZfQk9SREVSXHJcblxyXG59OyIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKtC60YDQvtGB0LHRgNCw0YPQt9C10YDQvdC+0LUg0YPQv9GA0LLQu9C10L3QuNC1INGG0LjQutC70LDQvNC4INC40LPRgNGLKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNldEdhbWVFbmdpbmUoKXtcclxuXHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0XHRnYW1lRW5naW5lU3RlcCgpO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgc3cgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIGZzID0gcmVxdWlyZSgnLi9fZnVsbFNjcmVlbi5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgZ2FtZUxvb3BzID0gZ0xvbztcclxuXHJcblxyXG52YXIgaXNOZWFyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiAyINC+0LHRitC10LrRgtCwLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvNC+0Lkg0YHRgtC+0YDQvtC90YsgMdGL0Lkg0L7RgiAy0LPQvi5cclxuXHJcbiAgdXAgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS55ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi55ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBkb3duIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnggKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnggKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH0sXHJcblxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gbW92ZVJlY3RzKGRpcmVjdGlvbil7ICAvLyjQvtC/0LjRgdGL0LLQsNC10Lwg0LPRgNCw0L3QuNGG0Ysg0LTQstC40LbQtdC90LjRjykg0YDQsNC30YDQtdGI0LDQtdGCINC00LLQuNC20LXQvdC40LUg0LIg0L/RgNC10LTQtdC70LDRhSDRg9GA0L7QstC90Y9cclxuXHJcbiAgaWYgKCBpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWhmLmlzQm9yZGVyW2RpcmVjdGlvbl0oby5ib3gpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLmJveCwgby53YWxscykgKXsgLy/QtdGB0LvQuCDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDRj9GJ0LjQuiDQvdC1INGDINCz0YDQsNC90LjRhiwg0LTQstC40LPQsNC10LwuXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIG8uYm94Lm1vdmUoZGlyZWN0aW9uKTtcclxuICB9IGVsc2UgaWYoICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWhmLmlzQm9yZGVyW2RpcmVjdGlvbl0oby5wbCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0L3QtSDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0LPRgNCw0L3QuNGG0LXQuSwg0LTQstC40LPQsNC10LzRgdGPLlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNDdXJzb3JJbkJ1dHRvbih4LHksYnV0KXsgLy/QstC+0LfQstGA0LDRidCw0LXRgiDRgtGA0YMsINC10YHQu9C4INC60YPRgNGB0L7RgCDQv9C+0L/QsNC7INCyINC60L7QvtGA0LTQuNC90LDRgtGLINC+0LHRitC10LrRgtCwXHJcbiAgcmV0dXJuIHggPj0gYnV0LnggJiYgXHJcbiAgeCA8PSBidXQueCtidXQudyAmJiBcclxuICB5ID49IGJ1dC55ICYmIFxyXG4gIHkgPD0gYnV0LnkrYnV0LmhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGxvYWRMZXZlbChudW1iZXIpeyAvL9C30LDQs9GA0YPQt9C60LAg0YPRgNC+0LLQvdGPXHJcbiAgbGV2ZWxzW251bWJlcl0oKTsgXHJcbiAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9IG51bWJlcjsgXHJcbiAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wbExldmVsKTtcclxufTtcclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQutC70LDQstC40YjRjFxyXG5cclxuICBpZiAoIGdMb28uc3RhdHVzID09IFwiZ2FtZVwiICl7IC8v0L/QtdGA0LXQtNCy0LjQs9Cw0YLRjNGB0Y8g0YLQvtC70YzQutC+INC10YHQu9C4INC40LTQtdGCINC40LPRgNCwLlxyXG5cclxuICAgIGlmICggZS5rZXkgPT0gXCJkXCIgfHwgZS5rZXkgPT0gXCJBcnJvd1JpZ2h0XCIgKSAgXHJcbiAgICAgIG1vdmVSZWN0cyhcInJpZ2h0XCIpO1xyXG5cclxuICAgIGlmICggZS5rZXkgPT0gXCJzXCIgfHwgZS5rZXkgPT0gXCJBcnJvd0Rvd25cIiApICBcclxuICAgICAgbW92ZVJlY3RzKFwiZG93blwiKTtcclxuXHJcbiAgICBpZiAoIGUua2V5ID09IFwid1wiIHx8IGUua2V5ID09IFwiQXJyb3dVcFwiIClcclxuICAgICAgbW92ZVJlY3RzKFwidXBcIik7XHJcblxyXG4gICAgaWYgKCBlLmtleSA9PSBcImFcIiB8fCBlLmtleSA9PSBcIkFycm93TGVmdFwiIClcclxuICAgICAgbW92ZVJlY3RzKFwibGVmdFwiKTtcclxuXHJcbiAgfTtcclxuXHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKXtcclxuXHJcbiAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcblxyXG4gIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSAmJiBnTG9vLnN0YXR1cyA9PSBcIm1lbnVcIiApeyAgXHJcbiAgICAgIGlmICggby5tZW51W2ldLm5hbWUgPT0gXCJwbGF5XCIgKXsgICAgLy/QtdGB0LvQuCDQvdCw0LbQsNGC0LAg0LrQvdC+0L/QutCwINC40LPRgNCw0YLRjCwg0LfQsNC/0YPRgdC60LDQtdC8INGD0YDQvtCy0LXQvdGMLlxyXG4gICAgICAgIHN3LnN0YXJ0KCk7XHJcbiAgICAgICAgbG9hZExldmVsKDEpO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgIGlmKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLndpblBvcFVwW2ldKSAmJiBnTG9vLnN0YXR1cyA9PSBcIndpblwiICl7XHJcbiAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwicG9wX2V4aXRcIiApe1xyXG4gICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIGZvciAoIGkgaW4gby5wYXVzZVBvcFVwICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5wYXVzZVBvcFVwW2ldKSAmJiBnTG9vLnN0YXR1cyA9PSBcInBhdXNlXCIgKXtcclxuICAgICAgaWYgKCBvLnBhdXNlUG9wVXBbaV0ubmFtZSA9PSBcInJldHVyblwiICl7XHJcbiAgICAgICAgc3cuc3RhcnQoKTtcclxuICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLnBsTGV2ZWwpO1xyXG4gICAgICB9IGVsc2UgaWYgKCBvLnBhdXNlUG9wVXBbaV0ubmFtZSA9PSBcInJlc3RhcnRcIiApe1xyXG4gICAgICAgIHN3LnJlc2V0KCk7XHJcbiAgICAgICAgbG9hZExldmVsKDEpO1xyXG4gICAgICB9IGVsc2UgaWYgKCBvLnBhdXNlUG9wVXBbaV0ubmFtZSA9PSBcImV4aXRcIiApe1xyXG4gICAgICAgIHN3LnJlc2V0KCk7XHJcbiAgICAgICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5tZW51KTtcclxuICAgICAgfTtcclxuICAgIH07XHJcbiAgfTtcclxuICBcclxuICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iUGF1c2UpICYmIGdMb28uc3RhdHVzID09IFwiZ2FtZVwiICl7XHJcbiAgICBzdy5wYXVzZVRpbWVyKCk7XHJcbiAgICBvLmJnT3BhY2l0eS5kcmF3KCk7XHJcbiAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLnBhdXNlKTtcclxuICB9O1xyXG5cclxuICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iRnVsbFNjcikgJiYgZ0xvby5zdGF0dXMgPT0gXCJnYW1lXCIpe1xyXG4gICAgKCAhZnMuc3RhdHVzICkgPyBmcy5sYXVuY2hGdWxsU2NyZWVuKGNhbnZhcy5jbnYpIDogZnMuY2Fuc2VsRnVsbFNjcmVlbigpOyBcclxuICB9O1xyXG5cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRsYXVuY2hGdWxsU2NyZWVuIDogZnVuY3Rpb24oZWxlbSl7XHJcblxyXG5cdFx0aWYgKCBlbGVtLnJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ubW96UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5tb3pSZXF1c3RGdWxsU2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBlbGVtLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuICl7XHJcblx0XHRcdGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5zdGF0dXMgPSB0cnVlOyBcclxuXHR9LFxyXG5cclxuXHRjYW5zZWxGdWxsU2NyZWVuIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHRpZiAoIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XHJcblx0XHR9IGVsc2UgaWYgKCBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuICl7XHJcblx0XHRcdGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuc3RhdHVzID0gZmFsc2U7XHJcblx0fSxcclxuXHJcblx0c3RhdHVzIDogZmFsc2VcclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnYW1lTG9vcHMgPSAge1xyXG5cclxuICBwbExldmVsIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJnYW1lXCI7IFxyXG5cclxuICAgIGhmLmNsZWFyUmVjdCgwLDAsQy5XSURUSCxDLkhFSUdIVCk7IC8v0L7Rh9C40YHRgtC60LAg0L7QsdC70LDRgdGC0LhcclxuXHJcbiAgICAvL9Cy0YvQstC+0LTQuNC8INC80LDRgtGA0LjRh9C90L7QtSDQv9C+0LvQtSDQuNCz0YDRi1xyXG4gICAgZm9yICggaSBpbiBvLm1hdHJpeCApe1xyXG4gICAgICBvLm1hdHJpeFtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0LLRi9Cy0L7QtNC40Lwg0YHRgtC10L3Ri1xc0L/RgNC10LPRgNCw0LTRi1xyXG4gICAgZm9yICggaSBpbiBvLndhbGxzICl7XHJcbiAgICAgIG8ud2FsbHNbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKioqKtCS0YvQstC+0LTQuNC8INCl0LXQtNC10YAqKioqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBvLmhlYWRlci5kcmF3KCk7XHJcbiAgICBvLnN0b3BXYXRjaC5kcmF3KDEsMTApO1xyXG4gICAgby5iRnVsbFNjci5kcmF3KCk7XHJcbiAgICBvLmJQYXVzZS5kcmF3KCk7XHJcblxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyoqKirQktGL0LLQvtC00LjQvCDQvtCx0YrQtdC60YLRiyoqKioqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIG8ucGwuZHJhdygpO1xyXG4gICAgby5ib3guZHJhdygpO1xyXG4gICAgby5kb29yLmRyYXcoKTtcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKioqKtCV0YHQu9C4INC/0L7QsdC10LTQuNC70LgqKioqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBpZiAoIGhmLmlzV2luKCkgKXtcclxuICAgICAgby5iZ09wYWNpdHkuZHJhdygpO1xyXG4gICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLndpbik7XHJcbiAgICB9O1xyXG5cclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJtZW51XCI7XHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTtcclxuXHJcbiAgICBvLmJnLmRyYXdJbWcoKTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ubWVudSApe1xyXG4gICAgICBvLm1lbnVbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgfSxcclxuXHJcbiAgd2luIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBnYW1lTG9vcHMuc3RhdHVzID0gXCJ3aW5cIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ud2luUG9wVXAgKXtcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJ3aW5fdGV4dFwiICkgby53aW5Qb3BVcFtpXS50eHQgPSBcItCj0YDQvtCy0LXQvdGMIFwiK2dhbWVMb29wcy5jdXJyZW50TGV2ZWwrXCIg0L/RgNC+0LnQtNC10L0hXCI7XHJcbiAgICAgIG8ud2luUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBwYXVzZSA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwicGF1c2VcIjtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ucGF1c2VQb3BVcCApe1xyXG4gICAgICBvLnBhdXNlUG9wVXBbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBzdGF0dXMgOiBcIlwiLFxyXG5cclxuICBjdXJyZW50TGV2ZWwgOiBcIlwiXHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICBjbGVhclJlY3QgOiBmdW5jdGlvbih4LHksdyxoKXsgIC8v0L7Rh9C40YHRgtC40YLQtdC70YxcclxuICAgIGN0eC5jbGVhclJlY3QoeCx5LHcsaCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UmFuZG9tSW50IDogZnVuY3Rpb24obWluLCBtYXgpIHsgLy/RhNGD0L3QutGG0LjRjyDQtNC70Y8g0YDQsNC90LTQvtC80LAg0YbQtdC70L7Rh9C40YHQu9C10L3QvdC+0LPQviDQt9C90LDRh9C10L3QuNGPXHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxuICB9LFxyXG5cclxuICBpc0JvcmRlciA6IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIg0L7QsdGK0LXQutGCLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvtC80Lkg0LPRgNCw0L3QuNGG0Ysg0LrQsNC90LLRi1xyXG4gICAgdXAgOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gb2JqLnkgPT0gQy5QRE5HICsgb2JqLmggKyBDLlBETkc7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvd24gOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gb2JqLnkgPT0gQy5IRUlHSFQgLSBvYmouaCAtIEMuUERORztcclxuICAgIH0sXHJcblxyXG4gICAgbGVmdCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueCA9PSBDLlBETkc7XHJcbiAgICB9LFxyXG5cclxuICAgIHJpZ2h0IDogZnVuY3Rpb24ob2JqKXtcclxuICAgICAgcmV0dXJuIG9iai54ID09IEMuV0lEVEggLSBvYmoudyAtIEMuUEROR1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGlzV2luIDogZnVuY3Rpb24oKXsgLy/Qv9C+0LHQtdC00LjQu9C4P1xyXG4gICAgcmV0dXJuIG8uYm94LnggPT0gby5kb29yLnggJiYgby5ib3gueSA9PSBvLmRvb3IueTtcclxuICB9XHJcbn07XHJcbiIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0MSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgLy/QvNCw0YHRgdC40LIg0YEg0LHRg9C00YPRidC10L/QvtGB0YLRgNC+0LXQvdC90YvQvNC4INGB0YLQtdC90LrQsNC80LhcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzIsM10sWzIsNF0sWzIsNV0sWzMsMF0sWzMsNl0sWzMsOF0sWzQsMl0sWzUsMV0sWzUsM10sWzUsN10sWzYsNF0sWzcsNF0sWzcsNl0sWzgsMV0sWzgsOF0sWzksMF0sWzksNF0sWzksNV1cclxuXHRcdF07XHRcdFx0XHQgIC8v0L/RgNC40LTRg9C80LDQvdC90YvQuSDQvNCw0YHRgdC40LIg0YHQviDRgdGC0LXQvdC60LDQvNC4XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBSZWN0KEMuUERORythcnJbaV1bMV0qKDUwK0MuUERORyksIEMuUERORythcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCwgXCIjNjIyREExXCIpICk7XHJcblx0XHR9O1x0XHRcdFx0ICAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvNCw0YHRgdC40LIgd2FsbHNcclxuXHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggQy5QRE5HKzIqKDUwK0MuUERORyksIEMuUERORys4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCBDLlBETkcsIEMuUERORyoyKzUwICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIEMuUERORys4Kig1MCtDLlBETkcpLCBDLlBETkcrMSooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH1cclxuXHJcblxyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGNudnMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1hdHJpeCgpe1xyXG4gIHZhciBtYXRyaXggPSBbXTsgLy/QvNCw0YHRgdC40LIg0LTQu9GPINC80LDRgtGA0LjRh9C90L7Qs9C+INCy0LjQtNCwINGD0YDQvtCy0L3Rj1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspeyAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvtCx0YrQtdC60YJcclxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgOTsgaisrKXtcclxuICAgICAgbWF0cml4LnB1c2goIG5ldyBSZWN0KEMuUERORytqKig1MCtDLlBETkcpLCBDLlBETkcraSooNTArQy5QRE5HKSwgNTAsIDUwLCBcIiNGRUEzQTNcIikgKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gbWF0cml4XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNZW51KHR4dEFyciwgbmFtZUFyciwgZm9udHNpemUpeyAgLy/RgdC+0LfQtNCw0LXQvCDQs9C70LDQstC90L7QtSDQvNC10L3RjlxyXG4gIHZhciBtZW51ID0gW107XHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBfZm9udHNpemUgPSBmb250c2l6ZTtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcbiAgXHJcbiAgdmFyIF9oZWlnaHQgPSAoQy5IRUlHSFQvMikgLSAoNzUqYW1vdW50cy8yKTsgXHJcbiAgdmFyIF93aWR0aCA9IEMuV0lEVEgvMi0yMDAvMjtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbW91bnRzOyBpKyspe1xyXG4gICAgbWVudS5wdXNoKCBuZXcgQnV0dG9uKCBfd2lkdGgsIF9oZWlnaHQraSo3NSwgMjAwLCA1MCwgXCJibGFja1wiLCB0eHRbaV0sIG5hbWVzW2ldLCBfZm9udHNpemUgKSApO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBtZW51O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlV2luUG9wVXAoKXtcclxuXHJcbiAgdmFyIHdpblBvcEJHID0gbmV3IFJlY3QoIEMuV0lEVEgvMi0yNzUvMiwgQy5IRUlHSFQvMi0xMjUvMiwgMjc1LCAxMjUsIFwicmVkXCIgKTtcclxuICB2YXIgYlBvcEV4aXQgPSBuZXcgQnV0dG9uKCB3aW5Qb3BCRy54KzUsIHdpblBvcEJHLnkrd2luUG9wQkcuaC01LTQwLCA5MCwgNDAsIFwiYmxhY2tcIiwgXCLQktGL0YXQvtC0XCIsIFwicG9wX2V4aXRcIiwgMjAgKTtcclxuICB2YXIgYlBvcE5leHQgPSBuZXcgQnV0dG9uKCB3aW5Qb3BCRy54K3dpblBvcEJHLnctNS05MCwgd2luUG9wQkcueSt3aW5Qb3BCRy5oLTUtNDAsIDkwLCA0MCwgXCJibGFja1wiLCBcItCU0LDQu9C10LVcIiwgXCJwb3BfbmV4dFwiLCAyMCApO1xyXG4gIHZhciB3aW5UZXh0ID0gbmV3IEJ1dHRvbiggQy5XSURUSC8yLTkwLzIsIHdpblBvcEJHLnkrMTAsIDkwLCA0MCwgXCJ0cmFuc3BhcmVudFwiLCBcItCj0YDQvtCy0LXQvdGMIE4g0L/RgNC+0LnQtNC10L0hXCIsIFwid2luX3RleHRcIiwgMjUgKTtcclxuICB3aW5UZXh0LnR4dENvbG9yID0gXCJibGFja1wiO1xyXG5cclxuICB2YXIgd2luUG9wVXAgPSBbXTtcclxuICB3aW5Qb3BVcC5wdXNoKHdpblBvcEJHLCBiUG9wRXhpdCwgYlBvcE5leHQsIHdpblRleHQpO1xyXG5cclxuICByZXR1cm4gd2luUG9wVXA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQYXVzZVBvcFVwKHR4dEFyciwgbmFtZUFyciwgZm9udHNpemUpe1xyXG5cclxuICB2YXIgbmFtZXMgPSBuYW1lQXJyO1xyXG4gIHZhciB0eHQgPSB0eHRBcnI7XHJcbiAgdmFyIF9mb250c2l6ZSA9IGZvbnRzaXplO1xyXG4gIHZhciBhbW91bnRzID0gdHh0QXJyLmxlbmd0aDtcclxuXHJcbiAgdmFyIF9oZWlnaHQgPSAoQy5IRUlHSFQvMikgLSAoNjAqYW1vdW50cy8yKTsgXHJcbiAgdmFyIF93aWR0aCA9IEMuV0lEVEgvMi0xNTAvMjtcclxuXHJcbiAgdmFyIHBhdXNlUG9wVXAgPSBbbmV3IFJlY3QoIEMuV0lEVEgvMi0yMDAvMiwgX2hlaWdodC0zMCwgMjAwLCA2MCphbW91bnRzKzQwLCBcInJlZFwiICldO1xyXG5cclxuICBmb3IgKHZhciBpPTA7IGk8YW1vdW50czsgaSsrKXtcclxuICAgIHBhdXNlUG9wVXAucHVzaCggbmV3IEJ1dHRvbiggX3dpZHRoLCBfaGVpZ2h0K2kqNjAsIDE1MCwgNDAsIFwiYmxhY2tcIiwgdHh0W2ldLCBuYW1lc1tpXSwgX2ZvbnRzaXplICkgKTsgXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHBhdXNlUG9wVXA7XHJcbn07XHJcblxyXG52YXIgZ3JkID0gY252cy5jdHguY3JlYXRlTGluZWFyR3JhZGllbnQoQy5XSURUSCwgMCwgQy5XSURUSCwgNTArQy5QRE5HKTtcclxuZ3JkLmFkZENvbG9yU3RvcCgwLCAnYmxhY2snKTsgICBcclxuZ3JkLmFkZENvbG9yU3RvcCgxLCAnZ3JleScpO1xyXG5cclxuXHJcblxyXG5cclxuLy9tZW51XHJcbnZhciBtZW51ID0gY3JlYXRlTWVudShbXCLQmNCz0YDQsNGC0YxcIixcItCd0LDRgdGC0YDQvtC50LrQuFwiXSxbXCJwbGF5XCIsIFwib3B0aW9uc1wiXSwgXCIzMFwiKTtcclxuXHJcblxyXG4vL2JhY2tncm91bmQgXHJcbnZhciBtYXRyaXggPSBjcmVhdGVNYXRyaXgoKTsgLy9iZyDRg9GA0L7QstC90Y9cclxudmFyIGJnID0gbmV3IEltYWdlKFwiaW1nL3JlY3QtYmcuanBnXCIpOyAvL2JnINCyINCz0LvQsNCy0L3QvtC8INC80LXQvdGOXHJcbnZhciBiZ09wYWNpdHkgPSBuZXcgUmVjdCgwLCAwLCBDLldJRFRILCBDLkhFSUdIVCwgXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIik7XHJcblxyXG5cclxuLy9oZWFkZXJcclxudmFyIGhlYWRlciA9IG5ldyBSZWN0KCAwLCAwLCBDLldJRFRILCA1MCtDLlBETkcsIGdyZCApO1xyXG52YXIgYkZ1bGxTY3IgPSBuZXcgQnV0dG9uKCBDLldJRFRILTUwLTUsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCA1MCwgNDAsIFwiIzM0QkFDQVwiLCBcIkZTXCIsIFwiZnVsbFNjclwiLCAyNSApO1xyXG52YXIgc3RvcFdhdGNoID0gbmV3IEJ1dHRvbiggNSwgaGVhZGVyLmgvMi1DLkNOVl9CT1JERVIvMiAtIDQwLzIsIDE0NSwgNDAsIFwiIzM0QkFDQVwiLCBcIjAwIDogMDAgOiAwMFwiLCBcInN0b3B3YXRjaFwiLCAyNSApO1xyXG52YXIgYlBhdXNlID0gbmV3IEJ1dHRvbiggQy5XSURUSC05MC01LWJGdWxsU2NyLnctMTAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCA5MCwgNDAsIFwiIzM0QkFDQVwiLCBcItCf0LDRg9C30LBcIiwgXCJwYXVzZVwiLCAyNSApO1xyXG5cclxuXHJcbi8vd2luIHBvcC11cFxyXG52YXIgd2luUG9wVXAgPSBjcmVhdGVXaW5Qb3BVcCgpO1xyXG5cclxuXHJcbi8vcGF1c2UgcG9wLXVwXHJcbnZhciBwYXVzZVBvcFVwID0gY3JlYXRlUGF1c2VQb3BVcChbXCLQktC10YDQvdGD0YLRjNGB0Y9cIiwgXCLQl9Cw0L3QvtCy0L5cIiwgXCLQktGL0YXQvtC0XCJdLFtcInJldHVyblwiLCBcInJlc3RhcnRcIiwgXCJleGl0XCJdLCBcIjIwXCIpO1xyXG5cclxuXHJcbi8vcGxheWFibGUgb2JqXHJcbnZhciBwbCA9IG5ldyBSZWN0KEMuUERORyxDLlBETkcqMis1MCw1MCw1MCxcImJsYWNrXCIpOyAgLy/QuNCz0YDQvtC6XHJcbnZhciBib3ggPSBuZXcgUmVjdChDLlBETkcsQy5QRE5HKjIrNTAsNTAsNTAsXCIjM0Q1REZGXCIpOyAvL9Cx0L7QutGBXHJcbnZhciBkb29yID0gbmV3IFJlY3QoQy5QRE5HLEMuUERORyoyKzUwLDUwLDUwLCBcInJnYmEoMjMxLCAyMywgMzIsIDAuOClcIik7IC8v0LTQstC10YDRjFxyXG52YXIgd2FsbHMgPSBbXTsgLy/RgdGC0LXQvdGLINC90LAg0YPRgNC+0LLQvdC1LCDQt9Cw0L/QvtC70L3Rj9C10YLRgdGPINCy0YvQsdGA0LDQvdC90YvQvCDRg9GA0L7QstC90LXQvC5cclxuXHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRtYXRyaXggOiBtYXRyaXgsXHJcblx0bWVudSA6IG1lbnUsXHJcblx0aGVhZGVyIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCA6IHN0b3BXYXRjaCxcclxuICBiUGF1c2UgOiBiUGF1c2UsXHJcbiAgYkZ1bGxTY3IgOiBiRnVsbFNjcixcclxuICBwbCA6IHBsLFxyXG4gIGJveCA6IGJveCxcclxuICBkb29yIDogZG9vcixcclxuICBiZyA6IGJnLFxyXG4gIHdhbGxzIDogd2FsbHMsXHJcbiAgd2luUG9wVXAgOiB3aW5Qb3BVcCxcclxuICBwYXVzZVBvcFVwIDogcGF1c2VQb3BVcCxcclxuICBiZ09wYWNpdHkgOiBiZ09wYWNpdHlcclxuXHJcbn07IiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBnYW1lID0gcmVxdWlyZSgnLi9fZ2FtZUxvb3BzLmpzJyk7XHJcblxyXG52YXIgcGF1c2UgPSAwO1xyXG52YXIgYmVnaW5UaW1lID0gMDtcclxudmFyIGN1cnJlbnRUaW1lID0gMDtcclxudmFyIHVwVGltZVRPO1xyXG5cclxuZnVuY3Rpb24gdXBUaW1lKGNvdW50RnJvbSkge1xyXG5cdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG5cdHZhciBkaWZmZXJlbmNlID0gKG5vdy1jb3VudEZyb20gKyBjdXJyZW50VGltZSk7XHJcblxyXG5cdHZhciBob3Vycz1NYXRoLmZsb29yKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSkvKDYwKjYwKjEwMDApKjEpO1xyXG5cdHZhciBtaW5zPU1hdGguZmxvb3IoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKS8oNjAqMTAwMCkqMSk7XHJcblx0dmFyIHNlY3M9TWF0aC5mbG9vcigoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKSUoNjAqMTAwMCkpLzEwMDAqMSk7XHJcblxyXG5cdGhvdXJzID0gKCBob3VycyA8IDEwKSA/IFwiMFwiK2hvdXJzIDogaG91cnM7XHJcblx0bWlucyA9ICggbWlucyA8IDEwKSA/IFwiMFwiK21pbnMgOiBtaW5zO1xyXG5cdHNlY3MgPSAoIHNlY3MgPCAxMCkgPyBcIjBcIitzZWNzIDogc2VjcztcclxuXHJcblx0by5zdG9wV2F0Y2gudHh0ID0gaG91cnMrXCIgOiBcIittaW5zK1wiIDogXCIrc2VjcztcclxuXHJcblx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR1cFRpbWVUTz1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHVwVGltZShjb3VudEZyb20pOyB9LDEwMDAvNjApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRzdGFydCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKGdhbWUuc3RhdHVzID09ICdnYW1lJyB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibWVudVwiIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJwYXVzZVwiKSB7XHJcblx0XHRcdHVwVGltZShuZXcgRGF0ZSgpKTtcclxuXHRcdFx0dmFyIG5vd1QgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0XHRiZWdpblRpbWUgPSBub3dULmdldFRpbWUoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMucmVzZXQoKTtcclxuXHRcdH07XHJcblx0fSxcclxuXHJcblx0cmVzZXQgOiBmdW5jdGlvbigpIHtcclxuXHRcdGN1cnJlbnRUaW1lID0gMDtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblxyXG5cdFx0by5zdG9wV2F0Y2gudHh0ID0gXCIwMCA6IDAwIDogMDBcIjtcclxuXHRcdHRoaXMuc3RhcnQoKTtcclxuXHR9LFxyXG5cclxuXHRwYXVzZVRpbWVyIDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjdXJEYXRhID0gbmV3IERhdGUoKTtcclxuXHRcdGN1cnJlbnRUaW1lID0gY3VyRGF0YS5nZXRUaW1lKCkgLSBiZWdpblRpbWUgKyBjdXJyZW50VGltZTtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbiA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCB0eHQsIG5hbWUsIGZTaXplKXtcclxuICBcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuICB0aGlzLnR4dCA9IHR4dDtcclxuICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIHRoaXMuZlNpemUgPSBmU2l6ZTtcclxuICB0aGlzLnR4dENvbG9yID0gXCJ3aGl0ZVwiO1xyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbihub0NlbnRlciwgcGFkZCl7XHJcblxyXG4gICAgdmFyIF9wYWRkID0gcGFkZCB8fCA1O1xyXG4gICAgdmFyIF94ID0gKCAhbm9DZW50ZXIgKSA/IHRoaXMueCt0aGlzLncvMiA6IHRoaXMueCtfcGFkZDtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnR4dENvbG9yO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIW5vQ2VudGVyICkgPyBcImNlbnRlclwiIDogXCJzdGFydFwiO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZTaXplICsgJ3B4IEFyaWFsJztcclxuICAgIGN0eC50ZXh0QmFzZWxpbmU9XCJtaWRkbGVcIjsgXHJcbiAgICBjdHguZmlsbFRleHQodGhpcy50eHQsIF94LCB0aGlzLnkrdGhpcy5oLzIpO1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2UgPSBmdW5jdGlvbihzcmMpe1xyXG4gIHRoaXMuc3JjID0gc3JjO1xyXG4gIHRoaXMubG9hZGVkID0gZmFsc2U7XHJcblxyXG4gIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHJcbiAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcbiAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICBpbWcuc3JjID0gc3JjO1xyXG5cclxuICB0aGlzLmRvbSA9IGltZztcclxuXHJcbiAgdGhpcy5kcmF3SW1nID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBpZiAoICF0aGlzLmxvYWRlZCApIHJldHVybjtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuZG9tLDAsMCk7XHJcblxyXG4gIH07XHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3QgPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvcil7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5tb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHN3aXRjaChkaXJlY3Rpb24pe1xyXG4gICAgICBjYXNlIFwidXBcIiA6IFxyXG4gICAgICB0aGlzLnkgLT0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJkb3duXCIgOiBcclxuICAgICAgdGhpcy55ICs9IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwibGVmdFwiIDpcclxuICAgICAgdGhpcy54IC09IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwicmlnaHRcIiA6IFxyXG4gICAgICB0aGlzLnggKz0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG5cclxuICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCx5KXtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH07XHJcblxyXG59OyIsInZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpLFxyXG4gICAgQnV0dG9uID0gcmVxdWlyZSgnLi9jbGFzc2VzL0J1dHRvbi5qcycpLFxyXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9SZWN0LmpzJyksXHJcbiAgICBJbWFnZSA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWFnZS5qcycpLFxyXG4gICAgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyksXHJcbiAgICBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpLFxyXG4gICAgZXZlbnRzID0gcmVxdWlyZSgnLi9fZXZlbnRzLmpzJyk7XHJcbiAgICBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxuXHJcbmVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiJdfQ==
