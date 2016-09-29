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

function isCursorInButton(x,y,but){
  return x >= but.x && 
  x <= but.x+but.w && 
  y >= but.y && 
  y <= but.y+but.h
};

window.onkeydown = function(e){ //событие нажатия клавишь

  if ( e.key == "d" || e.key == "ArrowRight" )  
    moveRects("right");

  if ( e.key == "s" || e.key == "ArrowDown" )  
    moveRects("down");

  if ( e.key == "w" || e.key == "ArrowUp" )
    moveRects("up");

  if ( e.key == "a" || e.key == "ArrowLeft" )
    moveRects("left");
};

window.onmousedown = function(e){

  var x = e.pageX-canvas.cnv.offsetLeft;
  var y = e.pageY-canvas.cnv.offsetTop;

  for ( i in o.menu ){
    if( isCursorInButton(x,y,o.menu[i]) ){  
      if ( o.menu[i].name == "play" && gLoo.status == "menu" ){    //если нажата кнопка играть, запускаем уровень.
        sw.start();
        levels[1](); 
        gameLoops.currentLevel = "1"; 
        engin.gameEngineStart(gameLoops.plLevel);
      };
    };
  };

  for ( i in o.winPopUp ){
    if( isCursorInButton(x,y,o.winPopUp[i]) ){
      if ( o.winPopUp[i].name == "pop_exit" && gLoo.status == "win"){
        engin.gameEngineStart(gameLoops.menu);
      };
    };
  };

  if( isCursorInButton(x,y,o.bRestart) ){
    sw.reset();
    levels[1]();
    gameLoops.currentLevel = "1"; 
    engin.gameEngineStart(gameLoops.plLevel);
  };

  if( isCursorInButton(x,y,o.bFullScr) ){
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

    gameLoops.status = "plLevel"; 

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
    o.bRestart.draw();

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
  },
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

function createMenu(txtArr, nameArr){  //создаем главное меню
  var menu = [];
  var names = nameArr;
  var txt = txtArr;
  var amounts = txtArr.length;
  
  var _height = (C.HEIGHT/2) - (75*amounts/2); 
  var _width = C.WIDTH/2-200/2;

  for (var i = 0; i < amounts; i++){
    menu.push( new Button( _width, _height+i*75, 200, 50, "black", txt[i], names[i], 30 ) );
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

var grd = cnvs.ctx.createLinearGradient(C.WIDTH, 0, C.WIDTH, 50+C.PDNG);
grd.addColorStop(0, 'black');   
grd.addColorStop(1, 'grey');

//menu
var menu = createMenu(["Играть","Настройки"],["play", "options"]);


//bg 
var matrix = createMatrix(); //bg уровня
var bg = new Image("img/rect-bg.jpg"); //bg в главном меню


//header
var header = new Rect( 0, 0, C.WIDTH, 50+C.PDNG, grd );
var bFullScr = new Button( C.WIDTH-50-5, header.h/2-C.CNV_BORDER/2 - 40/2, 50, 40, "#34BACA", "FS", "fullScr", 25 );
var bRestart = new Button( C.WIDTH-90-5-bFullScr.w-10, header.h/2-C.CNV_BORDER/2 - 40/2, 90, 40, "#34BACA", "Заново", "restart", 25 );
var stopWatch = new Button( 5, header.h/2-C.CNV_BORDER/2 - 40/2, 145, 40, "#34BACA", "00 : 00 : 00", "stopwatch", 25 );


//win pop-up
var winPopUp = createWinPopUp();


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
	bRestart : bRestart,
  bFullScr : bFullScr,
	pl : pl,
	box : box,
	door : door,
	bg : bg,
	walls : walls,
  winPopUp : winPopUp

};
},{"./_canvas.js":1,"./_const.js":2}],10:[function(require,module,exports){
var o = require('./_objects.js');
var game = require('./_gameLoops.js');

// var currentButton = "Start";
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
		if (game.status == 'plLevel' || gameLoops.status == "menu") {
			upTime(new Date());
			var nowT = new Date();
			beginTime = nowT.getTime();
		} else {
			pauseTimer();
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
  }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2Z1bGxTY3JlZW4uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUxvb3BzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2hlbHBlckZ1bmN0aW9ucy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19sZXZlbHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fb2JqZWN0cy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19zdG9wd2F0Y2guanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0J1dHRvbi5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL2NsYXNzZXMvSW1hZ2UuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL1JlY3QuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9mYWtlXzU2YzkyZWZmLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIGNudiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG52YXIgY3R4ID0gY252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbmNudi5zdHlsZS5ib3JkZXIgPSBcIjJweCBzb2xpZCBibGFja1wiO1xyXG5jbnYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ3aGl0ZVwiO1xyXG5jbnYud2lkdGggPSBDLldJRFRIO1xyXG5jbnYuaGVpZ2h0ID0gQy5IRUlHSFQ7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Y252IDogY252LFxyXG5cclxuXHRjdHggOiBjdHhcclxuXHJcbn07IiwidmFyIFBBREQgPSAxOyBcdFx0XHRcdFx0XHQvL9C/0LDQtNC00LjQvdCzLCDQutC+0YLQvtGA0YvQuSDRjyDRhdC+0YfRgyDRh9GC0L7QsdGLINCx0YvQuywg0LzQtdC2INC60LLQsNC00YDQsNGC0LDQvNC4XHJcbnZhciBXSURUSCA9IFBBREQgKyAoUEFERCs1MCkqOTsgXHQvL9GI0LjRgNC40L3QsCDQutCw0L3QstGLXHJcbnZhciBIRUlHSFQgPSBQQUREICsgKFBBREQrNTApKjEwOyAgIC8v0LLRi9GB0L7RgtCwINC60LDQvdCy0YtcclxudmFyIENOVl9CT1JERVIgPSAyO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdFBETkcgOiBQQURELFxyXG5cclxuXHRXSURUSCA6IFdJRFRILFxyXG5cclxuXHRIRUlHSFQgOiBIRUlHSFQsXHJcblxyXG5cdENOVl9CT1JERVIgOiBDTlZfQk9SREVSXHJcblxyXG59OyIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKtC60YDQvtGB0LHRgNCw0YPQt9C10YDQvdC+0LUg0YPQv9GA0LLQu9C10L3QuNC1INGG0LjQutC70LDQvNC4INC40LPRgNGLKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNldEdhbWVFbmdpbmUoKXtcclxuXHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0XHRnYW1lRW5naW5lU3RlcCgpO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgc3cgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIGZzID0gcmVxdWlyZSgnLi9fZnVsbFNjcmVlbi5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgZ2FtZUxvb3BzID0gZ0xvbztcclxuXHJcblxyXG52YXIgaXNOZWFyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiAyINC+0LHRitC10LrRgtCwLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvNC+0Lkg0YHRgtC+0YDQvtC90YsgMdGL0Lkg0L7RgiAy0LPQvi5cclxuXHJcbiAgdXAgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgIG1vdmUgPSBvYmpfMltpXS55ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmpfMi55ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG5cclxuICBkb3duIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueSAmJiBvYmpfMS54ID09IG9ial8yLng7XHJcbiAgfSxcclxuXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgbW92ZSA9IG9ial8yW2ldLnggKyBvYmpfMltpXS53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9ial8yLnggKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gIH0sXHJcblxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICBtb3ZlID0gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gbW92ZVJlY3RzKGRpcmVjdGlvbil7ICAvLyjQvtC/0LjRgdGL0LLQsNC10Lwg0LPRgNCw0L3QuNGG0Ysg0LTQstC40LbQtdC90LjRjykg0YDQsNC30YDQtdGI0LDQtdGCINC00LLQuNC20LXQvdC40LUg0LIg0L/RgNC10LTQtdC70LDRhSDRg9GA0L7QstC90Y9cclxuXHJcbiAgaWYgKCBpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWhmLmlzQm9yZGVyW2RpcmVjdGlvbl0oby5ib3gpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLmJveCwgby53YWxscykgKXsgLy/QtdGB0LvQuCDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDRj9GJ0LjQuiDQvdC1INGDINCz0YDQsNC90LjRhiwg0LTQstC40LPQsNC10LwuXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIG8uYm94Lm1vdmUoZGlyZWN0aW9uKTtcclxuICB9IGVsc2UgaWYoICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWhmLmlzQm9yZGVyW2RpcmVjdGlvbl0oby5wbCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0L3QtSDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0LPRgNCw0L3QuNGG0LXQuSwg0LTQstC40LPQsNC10LzRgdGPLlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNDdXJzb3JJbkJ1dHRvbih4LHksYnV0KXtcclxuICByZXR1cm4geCA+PSBidXQueCAmJiBcclxuICB4IDw9IGJ1dC54K2J1dC53ICYmIFxyXG4gIHkgPj0gYnV0LnkgJiYgXHJcbiAgeSA8PSBidXQueStidXQuaFxyXG59O1xyXG5cclxud2luZG93Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGUpeyAvL9GB0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC60LvQsNCy0LjRiNGMXHJcblxyXG4gIGlmICggZS5rZXkgPT0gXCJkXCIgfHwgZS5rZXkgPT0gXCJBcnJvd1JpZ2h0XCIgKSAgXHJcbiAgICBtb3ZlUmVjdHMoXCJyaWdodFwiKTtcclxuXHJcbiAgaWYgKCBlLmtleSA9PSBcInNcIiB8fCBlLmtleSA9PSBcIkFycm93RG93blwiICkgIFxyXG4gICAgbW92ZVJlY3RzKFwiZG93blwiKTtcclxuXHJcbiAgaWYgKCBlLmtleSA9PSBcIndcIiB8fCBlLmtleSA9PSBcIkFycm93VXBcIiApXHJcbiAgICBtb3ZlUmVjdHMoXCJ1cFwiKTtcclxuXHJcbiAgaWYgKCBlLmtleSA9PSBcImFcIiB8fCBlLmtleSA9PSBcIkFycm93TGVmdFwiIClcclxuICAgIG1vdmVSZWN0cyhcImxlZnRcIik7XHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKXtcclxuXHJcbiAgdmFyIHggPSBlLnBhZ2VYLWNhbnZhcy5jbnYub2Zmc2V0TGVmdDtcclxuICB2YXIgeSA9IGUucGFnZVktY2FudmFzLmNudi5vZmZzZXRUb3A7XHJcblxyXG4gIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApeyAgXHJcbiAgICAgIGlmICggby5tZW51W2ldLm5hbWUgPT0gXCJwbGF5XCIgJiYgZ0xvby5zdGF0dXMgPT0gXCJtZW51XCIgKXsgICAgLy/QtdGB0LvQuCDQvdCw0LbQsNGC0LAg0LrQvdC+0L/QutCwINC40LPRgNCw0YLRjCwg0LfQsNC/0YPRgdC60LDQtdC8INGD0YDQvtCy0LXQvdGMLlxyXG4gICAgICAgIHN3LnN0YXJ0KCk7XHJcbiAgICAgICAgbGV2ZWxzWzFdKCk7IFxyXG4gICAgICAgIGdhbWVMb29wcy5jdXJyZW50TGV2ZWwgPSBcIjFcIjsgXHJcbiAgICAgICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wbExldmVsKTtcclxuICAgICAgfTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby53aW5Qb3BVcFtpXSkgKXtcclxuICAgICAgaWYgKCBvLndpblBvcFVwW2ldLm5hbWUgPT0gXCJwb3BfZXhpdFwiICYmIGdMb28uc3RhdHVzID09IFwid2luXCIpe1xyXG4gICAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIGlmKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJSZXN0YXJ0KSApe1xyXG4gICAgc3cucmVzZXQoKTtcclxuICAgIGxldmVsc1sxXSgpO1xyXG4gICAgZ2FtZUxvb3BzLmN1cnJlbnRMZXZlbCA9IFwiMVwiOyBcclxuICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMucGxMZXZlbCk7XHJcbiAgfTtcclxuXHJcbiAgaWYoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LG8uYkZ1bGxTY3IpICl7XHJcbiAgICggIWZzLnN0YXR1cyApID8gZnMubGF1bmNoRnVsbFNjcmVlbihjYW52YXMuY252KSA6IGZzLmNhbnNlbEZ1bGxTY3JlZW4oKTsgXHJcbiB9O1xyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdGxhdW5jaEZ1bGxTY3JlZW4gOiBmdW5jdGlvbihlbGVtKXtcclxuXHJcblx0XHRpZiAoIGVsZW0ucmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS5yZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZWxlbS5tb3pSZXF1ZXN0RnVsbFNjcmVlbiApe1xyXG5cdFx0XHRlbGVtLm1velJlcXVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZWxlbS53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLnN0YXR1cyA9IHRydWU7IFxyXG5cdH0sXHJcblxyXG5cdGNhbnNlbEZ1bGxTY3JlZW4gOiBmdW5jdGlvbigpe1xyXG5cclxuXHRcdGlmICggZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdH0gZWxzZSBpZiAoIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xyXG5cdFx0fSBlbHNlIGlmICggZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4gKXtcclxuXHRcdFx0ZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5zdGF0dXMgPSBmYWxzZTtcclxuXHR9LFxyXG5cclxuXHRzdGF0dXMgOiBmYWxzZVxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVMb29wcyA9ICB7XHJcblxyXG4gIHBsTGV2ZWwgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcInBsTGV2ZWxcIjsgXHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTsgLy/QvtGH0LjRgdGC0LrQsCDQvtCx0LvQsNGB0YLQuFxyXG5cclxuICAgIC8v0LLRi9Cy0L7QtNC40Lwg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1INC40LPRgNGLXHJcbiAgICBmb3IgKCBpIGluIG8ubWF0cml4ICl7XHJcbiAgICAgIG8ubWF0cml4W2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy/QstGL0LLQvtC00LjQvCDRgdGC0LXQvdGLXFzQv9GA0LXQs9GA0LDQtNGLXHJcbiAgICBmb3IgKCBpIGluIG8ud2FsbHMgKXtcclxuICAgICAgby53YWxsc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8qKioq0JLRi9Cy0L7QtNC40Lwg0KXQtdC00LXRgCoqKioqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIG8uaGVhZGVyLmRyYXcoKTtcclxuICAgIG8uc3RvcFdhdGNoLmRyYXcoMSwxMCk7XHJcbiAgICBvLmJGdWxsU2NyLmRyYXcoKTtcclxuICAgIG8uYlJlc3RhcnQuZHJhdygpO1xyXG5cclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8qKioq0JLRi9Cy0L7QtNC40Lwg0L7QsdGK0LXQutGC0YsqKioqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBvLnBsLmRyYXcoKTtcclxuICAgIG8uYm94LmRyYXcoKTtcclxuICAgIG8uZG9vci5kcmF3KCk7XHJcblxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyoqKirQldGB0LvQuCDQv9C+0LHQtdC00LjQu9C4KioqKipcclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgaWYgKCBoZi5pc1dpbigpICl7XHJcbiAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMud2luKTtcclxuICAgIH07XHJcblxyXG4gIH0sXHJcblxyXG4gIG1lbnUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIm1lbnVcIjtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8uYmcuZHJhd0ltZygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgIG8ubWVudVtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICB9LFxyXG5cclxuICB3aW4gOiBmdW5jdGlvbigpe1xyXG4gICAgZ2FtZUxvb3BzLnN0YXR1cyA9IFwid2luXCI7XHJcblxyXG4gICAgZm9yICggaSBpbiBvLndpblBvcFVwICl7XHJcbiAgICAgIGlmICggby53aW5Qb3BVcFtpXS5uYW1lID09IFwid2luX3RleHRcIiApIG8ud2luUG9wVXBbaV0udHh0ID0gXCLQo9GA0L7QstC10L3RjCBcIitnYW1lTG9vcHMuY3VycmVudExldmVsK1wiINC/0YDQvtC50LTQtdC9IVwiO1xyXG4gICAgICBvLndpblBvcFVwW2ldLmRyYXcoKTtcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgc3RhdHVzIDogXCJcIixcclxuXHJcbiAgY3VycmVudExldmVsIDogXCJcIlxyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi9fY2FudmFzLmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgY2xlYXJSZWN0IDogZnVuY3Rpb24oeCx5LHcsaCl7ICAvL9C+0YfQuNGB0YLQuNGC0LXQu9GMXHJcbiAgICBjdHguY2xlYXJSZWN0KHgseSx3LGgpO1xyXG4gIH0sXHJcblxyXG4gIGdldFJhbmRvbUludCA6IGZ1bmN0aW9uKG1pbiwgbWF4KSB7IC8v0YTRg9C90LrRhtC40Y8g0LTQu9GPINGA0LDQvdC00L7QvNCwINGG0LXQu9C+0YfQuNGB0LvQtdC90L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRj1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbiAgfSxcclxuXHJcbiAgaXNCb3JkZXIgOiB7IC8v0L/RgNC40L3QuNC80LDQtdGCINC+0LHRitC10LrRgiwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10L7QvNC5INCz0YDQsNC90LjRhtGLINC60LDQvdCy0YtcclxuICAgIHVwIDogZnVuY3Rpb24ob2JqKXtcclxuICAgICAgcmV0dXJuIG9iai55ID09IEMuUERORyArIG9iai5oICsgQy5QRE5HO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb3duIDogZnVuY3Rpb24ob2JqKXtcclxuICAgICAgcmV0dXJuIG9iai55ID09IEMuSEVJR0hUIC0gb2JqLmggLSBDLlBETkc7XHJcbiAgICB9LFxyXG5cclxuICAgIGxlZnQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gb2JqLnggPT0gQy5QRE5HO1xyXG4gICAgfSxcclxuXHJcbiAgICByaWdodCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueCA9PSBDLldJRFRIIC0gb2JqLncgLSBDLlBETkdcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBpc1dpbiA6IGZ1bmN0aW9uKCl7IC8v0L/QvtCx0LXQtNC40LvQuD9cclxuICAgIHJldHVybiBvLmJveC54ID09IG8uZG9vci54ICYmIG8uYm94LnkgPT0gby5kb29yLnk7XHJcbiAgfSxcclxufTtcclxuIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHQxIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107ICAvL9C80LDRgdGB0LjQsiDRgSDQsdGD0LTRg9GJ0LXQv9C+0YHRgtGA0L7QtdC90L3Ri9C80Lgg0YHRgtC10L3QutCw0LzQuFxyXG5cdFx0dmFyIGFyciA9IFsgICAgICAgXHJcblx0XHRbMiwzXSxbMiw0XSxbMiw1XSxbMywwXSxbMyw2XSxbMyw4XSxbNCwyXSxbNSwxXSxbNSwzXSxbNSw3XSxbNiw0XSxbNyw0XSxbNyw2XSxbOCwxXSxbOCw4XSxbOSwwXSxbOSw0XSxbOSw1XVxyXG5cdFx0XTtcdFx0XHRcdCAgLy/Qv9GA0LjQtNGD0LzQsNC90L3Ri9C5INC80LDRgdGB0LjQsiDRgdC+INGB0YLQtdC90LrQsNC80LhcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG5cdFx0XHRfd2FsbHMucHVzaCggbmV3IFJlY3QoQy5QRE5HK2FycltpXVsxXSooNTArQy5QRE5HKSwgQy5QRE5HK2FycltpXVswXSooNTArQy5QRE5HKSwgNTAsIDUwLCBcIiM2MjJEQTFcIikgKTtcclxuXHRcdH07XHRcdFx0XHQgIC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC80LDRgdGB0LjQsiB3YWxsc1xyXG5cclxuXHRcdG8uYm94LnNldFBvc2l0aW9uKCBDLlBETkcrMiooNTArQy5QRE5HKSwgQy5QRE5HKzgqKDUwK0MuUERORykgKTtcclxuXHRcdG8ucGwuc2V0UG9zaXRpb24oIEMuUERORywgQy5QRE5HKjIrNTAgKTtcclxuXHRcdG8uZG9vci5zZXRQb3NpdGlvbiggQy5QRE5HKzgqKDUwK0MuUERORyksIEMuUERORysxKig1MCtDLlBETkcpICk7XHJcblxyXG5cdFx0by53YWxscyA9IF93YWxscztcclxuXHJcblx0fVxyXG5cclxuXHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgY252cyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWF0cml4KCl7XHJcbiAgdmFyIG1hdHJpeCA9IFtdOyAvL9C80LDRgdGB0LjQsiDQtNC70Y8g0LzQsNGC0YDQuNGH0L3QvtCz0L4g0LLQuNC00LAg0YPRgNC+0LLQvdGPXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKyl7IC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC+0LHRitC10LrRglxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCA5OyBqKyspe1xyXG4gICAgICBtYXRyaXgucHVzaCggbmV3IFJlY3QoQy5QRE5HK2oqKDUwK0MuUERORyksIEMuUERORytpKig1MCtDLlBETkcpLCA1MCwgNTAsIFwiI0ZFQTNBM1wiKSApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBtYXRyaXhcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnUodHh0QXJyLCBuYW1lQXJyKXsgIC8v0YHQvtC30LTQsNC10Lwg0LPQu9Cw0LLQvdC+0LUg0LzQtdC90Y5cclxuICB2YXIgbWVudSA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IG5hbWVBcnI7XHJcbiAgdmFyIHR4dCA9IHR4dEFycjtcclxuICB2YXIgYW1vdW50cyA9IHR4dEFyci5sZW5ndGg7XHJcbiAgXHJcbiAgdmFyIF9oZWlnaHQgPSAoQy5IRUlHSFQvMikgLSAoNzUqYW1vdW50cy8yKTsgXHJcbiAgdmFyIF93aWR0aCA9IEMuV0lEVEgvMi0yMDAvMjtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbW91bnRzOyBpKyspe1xyXG4gICAgbWVudS5wdXNoKCBuZXcgQnV0dG9uKCBfd2lkdGgsIF9oZWlnaHQraSo3NSwgMjAwLCA1MCwgXCJibGFja1wiLCB0eHRbaV0sIG5hbWVzW2ldLCAzMCApICk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1lbnU7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXaW5Qb3BVcCgpe1xyXG5cclxuICB2YXIgd2luUG9wQkcgPSBuZXcgUmVjdCggQy5XSURUSC8yLTI3NS8yLCBDLkhFSUdIVC8yLTEyNS8yLCAyNzUsIDEyNSwgXCJyZWRcIiApO1xyXG4gIHZhciBiUG9wRXhpdCA9IG5ldyBCdXR0b24oIHdpblBvcEJHLngrNSwgd2luUG9wQkcueSt3aW5Qb3BCRy5oLTUtNDAsIDkwLCA0MCwgXCJibGFja1wiLCBcItCS0YvRhdC+0LRcIiwgXCJwb3BfZXhpdFwiLCAyMCApO1xyXG4gIHZhciBiUG9wTmV4dCA9IG5ldyBCdXR0b24oIHdpblBvcEJHLngrd2luUG9wQkcudy01LTkwLCB3aW5Qb3BCRy55K3dpblBvcEJHLmgtNS00MCwgOTAsIDQwLCBcImJsYWNrXCIsIFwi0JTQsNC70LXQtVwiLCBcInBvcF9uZXh0XCIsIDIwICk7XHJcbiAgdmFyIHdpblRleHQgPSBuZXcgQnV0dG9uKCBDLldJRFRILzItOTAvMiwgd2luUG9wQkcueSsxMCwgOTAsIDQwLCBcInRyYW5zcGFyZW50XCIsIFwi0KPRgNC+0LLQtdC90YwgTiDQv9GA0L7QudC00LXQvSFcIiwgXCJ3aW5fdGV4dFwiLCAyNSApO1xyXG4gIHdpblRleHQudHh0Q29sb3IgPSBcImJsYWNrXCI7XHJcblxyXG4gIHZhciB3aW5Qb3BVcCA9IFtdO1xyXG4gIHdpblBvcFVwLnB1c2god2luUG9wQkcsIGJQb3BFeGl0LCBiUG9wTmV4dCwgd2luVGV4dCk7XHJcblxyXG4gIHJldHVybiB3aW5Qb3BVcDtcclxufTtcclxuXHJcbnZhciBncmQgPSBjbnZzLmN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudChDLldJRFRILCAwLCBDLldJRFRILCA1MCtDLlBETkcpO1xyXG5ncmQuYWRkQ29sb3JTdG9wKDAsICdibGFjaycpOyAgIFxyXG5ncmQuYWRkQ29sb3JTdG9wKDEsICdncmV5Jyk7XHJcblxyXG4vL21lbnVcclxudmFyIG1lbnUgPSBjcmVhdGVNZW51KFtcItCY0LPRgNCw0YLRjFwiLFwi0J3QsNGB0YLRgNC+0LnQutC4XCJdLFtcInBsYXlcIiwgXCJvcHRpb25zXCJdKTtcclxuXHJcblxyXG4vL2JnIFxyXG52YXIgbWF0cml4ID0gY3JlYXRlTWF0cml4KCk7IC8vYmcg0YPRgNC+0LLQvdGPXHJcbnZhciBiZyA9IG5ldyBJbWFnZShcImltZy9yZWN0LWJnLmpwZ1wiKTsgLy9iZyDQsiDQs9C70LDQstC90L7QvCDQvNC10L3RjlxyXG5cclxuXHJcbi8vaGVhZGVyXHJcbnZhciBoZWFkZXIgPSBuZXcgUmVjdCggMCwgMCwgQy5XSURUSCwgNTArQy5QRE5HLCBncmQgKTtcclxudmFyIGJGdWxsU2NyID0gbmV3IEJ1dHRvbiggQy5XSURUSC01MC01LCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgNTAsIDQwLCBcIiMzNEJBQ0FcIiwgXCJGU1wiLCBcImZ1bGxTY3JcIiwgMjUgKTtcclxudmFyIGJSZXN0YXJ0ID0gbmV3IEJ1dHRvbiggQy5XSURUSC05MC01LWJGdWxsU2NyLnctMTAsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCA5MCwgNDAsIFwiIzM0QkFDQVwiLCBcItCX0LDQvdC+0LLQvlwiLCBcInJlc3RhcnRcIiwgMjUgKTtcclxudmFyIHN0b3BXYXRjaCA9IG5ldyBCdXR0b24oIDUsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCAxNDUsIDQwLCBcIiMzNEJBQ0FcIiwgXCIwMCA6IDAwIDogMDBcIiwgXCJzdG9wd2F0Y2hcIiwgMjUgKTtcclxuXHJcblxyXG4vL3dpbiBwb3AtdXBcclxudmFyIHdpblBvcFVwID0gY3JlYXRlV2luUG9wVXAoKTtcclxuXHJcblxyXG4vL3BsYXlhYmxlIG9ialxyXG52YXIgcGwgPSBuZXcgUmVjdChDLlBETkcsQy5QRE5HKjIrNTAsNTAsNTAsXCJibGFja1wiKTsgIC8v0LjQs9GA0L7QulxyXG52YXIgYm94ID0gbmV3IFJlY3QoQy5QRE5HLEMuUERORyoyKzUwLDUwLDUwLFwiIzNENURGRlwiKTsgLy/QsdC+0LrRgVxyXG52YXIgZG9vciA9IG5ldyBSZWN0KEMuUERORyxDLlBETkcqMis1MCw1MCw1MCwgXCJyZ2JhKDIzMSwgMjMsIDMyLCAwLjgpXCIpOyAvL9C00LLQtdGA0YxcclxudmFyIHdhbGxzID0gW107IC8v0YHRgtC10L3RiyDQvdCwINGD0YDQvtCy0L3QtSwg0LfQsNC/0L7Qu9C90Y/QtdGC0YHRjyDQstGL0LHRgNCw0L3QvdGL0Lwg0YPRgNC+0LLQvdC10LwuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0bWF0cml4IDogbWF0cml4LFxyXG5cdG1lbnUgOiBtZW51LFxyXG5cdGhlYWRlciA6IGhlYWRlcixcclxuICBzdG9wV2F0Y2ggOiBzdG9wV2F0Y2gsXHJcblx0YlJlc3RhcnQgOiBiUmVzdGFydCxcclxuICBiRnVsbFNjciA6IGJGdWxsU2NyLFxyXG5cdHBsIDogcGwsXHJcblx0Ym94IDogYm94LFxyXG5cdGRvb3IgOiBkb29yLFxyXG5cdGJnIDogYmcsXHJcblx0d2FsbHMgOiB3YWxscyxcclxuICB3aW5Qb3BVcCA6IHdpblBvcFVwXHJcblxyXG59OyIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vX2dhbWVMb29wcy5qcycpO1xyXG5cclxuLy8gdmFyIGN1cnJlbnRCdXR0b24gPSBcIlN0YXJ0XCI7XHJcbnZhciBwYXVzZSA9IDA7XHJcbnZhciBiZWdpblRpbWUgPSAwO1xyXG52YXIgY3VycmVudFRpbWUgPSAwO1xyXG52YXIgdXBUaW1lVE87XHJcblxyXG5mdW5jdGlvbiB1cFRpbWUoY291bnRGcm9tKSB7XHJcblx0dmFyIG5vdyA9IG5ldyBEYXRlKCk7XHJcblx0dmFyIGRpZmZlcmVuY2UgPSAobm93LWNvdW50RnJvbSArIGN1cnJlbnRUaW1lKTtcclxuXHJcblx0dmFyIGhvdXJzPU1hdGguZmxvb3IoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKS8oNjAqNjAqMTAwMCkqMSk7XHJcblx0dmFyIG1pbnM9TWF0aC5mbG9vcigoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpLyg2MCoxMDAwKSoxKTtcclxuXHR2YXIgc2Vjcz1NYXRoLmZsb29yKCgoKGRpZmZlcmVuY2UlKDYwKjYwKjEwMDAqMjQpKSUoNjAqNjAqMTAwMCkpJSg2MCoxMDAwKSkvMTAwMCoxKTtcclxuXHJcblx0aG91cnMgPSAoIGhvdXJzIDwgMTApID8gXCIwXCIraG91cnMgOiBob3VycztcclxuXHRtaW5zID0gKCBtaW5zIDwgMTApID8gXCIwXCIrbWlucyA6IG1pbnM7XHJcblx0c2VjcyA9ICggc2VjcyA8IDEwKSA/IFwiMFwiK3NlY3MgOiBzZWNzO1xyXG5cclxuXHRvLnN0b3BXYXRjaC50eHQgPSBob3VycytcIiA6IFwiK21pbnMrXCIgOiBcIitzZWNzO1xyXG5cclxuXHRjbGVhclRpbWVvdXQodXBUaW1lVE8pO1xyXG5cdHVwVGltZVRPPXNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdXBUaW1lKGNvdW50RnJvbSk7IH0sMTAwMC82MCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgXHJcblxyXG5cdHN0YXJ0IDogZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAoZ2FtZS5zdGF0dXMgPT0gJ3BsTGV2ZWwnIHx8IGdhbWVMb29wcy5zdGF0dXMgPT0gXCJtZW51XCIpIHtcclxuXHRcdFx0dXBUaW1lKG5ldyBEYXRlKCkpO1xyXG5cdFx0XHR2YXIgbm93VCA9IG5ldyBEYXRlKCk7XHJcblx0XHRcdGJlZ2luVGltZSA9IG5vd1QuZ2V0VGltZSgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cGF1c2VUaW1lcigpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRyZXNldCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y3VycmVudFRpbWUgPSAwO1xyXG5cdFx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHJcblx0XHRvLnN0b3BXYXRjaC50eHQgPSBcIjAwIDogMDAgOiAwMFwiO1xyXG5cdFx0dGhpcy5zdGFydCgpO1xyXG5cdH0sXHJcblxyXG5cdHBhdXNlVGltZXIgOiBmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGN1ckRhdGEgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0Y3VycmVudFRpbWUgPSBjdXJEYXRhLmdldFRpbWUoKSAtIGJlZ2luVGltZSArIGN1cnJlbnRUaW1lO1xyXG5cdFx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR9XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IsIHR4dCwgbmFtZSwgZlNpemUpe1xyXG4gIFxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG4gIHRoaXMudHh0Q29sb3IgPSBcIndoaXRlXCI7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKG5vQ2VudGVyLCBwYWRkKXtcclxuXHJcbiAgICB2YXIgX3BhZGQgPSBwYWRkIHx8IDU7XHJcbiAgICB2YXIgX3ggPSAoICFub0NlbnRlciApID8gdGhpcy54K3RoaXMudy8yIDogdGhpcy54K19wYWRkO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMudHh0Q29sb3I7XHJcbiAgICBjdHgudGV4dEFsaWduID0gKCAhbm9DZW50ZXIgKSA/IFwiY2VudGVyXCIgOiBcInN0YXJ0XCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggQXJpYWwnO1xyXG4gICAgY3R4LnRleHRCYXNlbGluZT1cIm1pZGRsZVwiOyBcclxuICAgIGN0eC5maWxsVGV4dCh0aGlzLnR4dCwgX3gsIHRoaXMueSt0aGlzLmgvMik7XHJcbiAgfTtcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZSA9IGZ1bmN0aW9uKHNyYyl7XHJcbiAgdGhpcy5zcmMgPSBzcmM7XHJcbiAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcclxuXHJcbiAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG5cclxuICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxuICB9LmJpbmQodGhpcyk7XHJcblxyXG4gIGltZy5zcmMgPSBzcmM7XHJcblxyXG4gIHRoaXMuZG9tID0gaW1nO1xyXG5cclxuICB0aGlzLmRyYXdJbWcgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIGlmICggIXRoaXMubG9hZGVkICkgcmV0dXJuO1xyXG5cclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5kb20sMCwwKTtcclxuXHJcbiAgfTtcclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vLi4vX2NvbnN0LmpzJyk7XHJcbnZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVjdCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yKXsgLy/QutC70LDRgdGBINC60YPQsdC40LpcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuXHJcblxyXG5cclxuICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICB9O1xyXG4gIFxyXG4gIHRoaXMubW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbil7XHJcbiAgICBzd2l0Y2goZGlyZWN0aW9uKXtcclxuICAgICAgY2FzZSBcInVwXCIgOiBcclxuICAgICAgdGhpcy55IC09IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImxlZnRcIiA6XHJcbiAgICAgIHRoaXMueCAtPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcInJpZ2h0XCIgOiBcclxuICAgICAgdGhpcy54ICs9IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmFuZG9tUG9zaXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy54ID0gZ2V0UmFuZG9tSW50KDEsNykqKHRoaXMudytDLlBETkcpK0MuUERORztcclxuICAgIHRoaXMueSA9IGdldFJhbmRvbUludCgyLDgpKih0aGlzLmgrQy5QRE5HKStDLlBETkc7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHgseSl7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICB9XHJcbn07IiwidmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyksXHJcbiAgICBCdXR0b24gPSByZXF1aXJlKCcuL2NsYXNzZXMvQnV0dG9uLmpzJyksXHJcbiAgICBSZWN0ID0gcmVxdWlyZSgnLi9jbGFzc2VzL1JlY3QuanMnKSxcclxuICAgIEltYWdlID0gcmVxdWlyZSgnLi9jbGFzc2VzL0ltYWdlLmpzJyksXHJcbiAgICBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKSxcclxuICAgIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyksXHJcbiAgICBldmVudHMgPSByZXF1aXJlKCcuL19ldmVudHMuanMnKTtcclxuICAgIGNhbnZhcyA9IHJlcXVpcmUoJy4vX2NhbnZhcy5qcycpO1xyXG5cclxuZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5tZW51KTtcclxuIl19
