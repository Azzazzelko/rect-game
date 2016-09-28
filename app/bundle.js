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

  var x = e.pageX-10;
  var y = e.pageY-10;

  for ( i in o.menu ){
    if( isCursorInButton(x,y,o.menu[i]) ){  
      if ( o.menu[i].name == "play" && gLoo.status == "menu" ){    //если нажата кнопка играть, запускаем уровень.
        sw.start();
        levels[1]();  
        engin.gameEngineStart(gameLoops.plLevel);
      };
    };
  };

  if( isCursorInButton(x,y,o.bRestart) ){
    sw.reset();
    levels[1]();  
    engin.gameEngineStart(gameLoops.plLevel);
  };
};

},{"./_const.js":2,"./_engine.js":3,"./_gameLoops.js":5,"./_helperFunctions.js":6,"./_levels.js":7,"./_objects.js":8,"./_stopwatch.js":9}],5:[function(require,module,exports){
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
      console.log("WIN!");
      engin.gameEngineStart(gameLoops.menu);
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

  status : ""

};
},{"./_const.js":2,"./_engine.js":3,"./_helperFunctions.js":6,"./_objects.js":8}],6:[function(require,module,exports){
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

},{"./_canvas.js":1,"./_const.js":2,"./_objects.js":8}],7:[function(require,module,exports){
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
},{"./_const.js":2,"./_objects.js":8}],8:[function(require,module,exports){
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

var grd = cnvs.ctx.createLinearGradient(C.WIDTH, 0, C.WIDTH, 50+C.PDNG);
grd.addColorStop(0, 'black');   
grd.addColorStop(1, 'grey');


var menu = createMenu(["Играть","Настройки"],["play", "options"]);

var header = new Rect( 0, 0, C.WIDTH, 50+C.PDNG, grd );
var bRestart = new Button( C.WIDTH-90-5, header.h/2-C.CNV_BORDER/2 - 40/2, 90, 40, "#34BACA", "Restart", "restart", 25 );
var stopWatch = new Button( 5, header.h/2-C.CNV_BORDER/2 - 40/2, 145, 40, "#34BACA", "00:00:00:000", "stopwatch", 25 );

var matrix = createMatrix();

var pl = new Rect(C.PDNG,C.PDNG*2+50,50,50,"black");  //игрок
var box = new Rect(C.PDNG,C.PDNG*2+50,50,50,"#3D5DFF"); //бокс
var door = new Rect(C.PDNG,C.PDNG*2+50,50,50, "rgba(231, 23, 32, 0.8)"); //дверь
var bg = new Image("img/rect-bg.jpg");
var walls = [];

module.exports = {

	matrix : matrix,
	menu : menu,
	header : header,
  stopWatch : stopWatch,
	bRestart : bRestart,
	pl : pl,
	box : box,
	door : door,
	bg : bg,
	walls : walls

};
},{"./_canvas.js":1,"./_const.js":2}],9:[function(require,module,exports){
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
},{"./_gameLoops.js":5,"./_objects.js":8}],10:[function(require,module,exports){
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

  this.draw = function(noCenter, padd){

    var _padd = padd || 5;
    var _x = ( !noCenter ) ? this.x+this.w/2 : this.x+_padd;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "white";
    ctx.textAlign = ( !noCenter ) ? "center" : "start";
    ctx.font = this.fSize + 'px Arial';
    ctx.textBaseline="middle"; 
    ctx.fillText(this.txt, _x, this.y+this.h/2);
  };

};
},{"./../_canvas.js":1}],11:[function(require,module,exports){
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
},{"./../_canvas.js":1}],12:[function(require,module,exports){
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
},{"./../_canvas.js":1,"./../_const.js":2}],13:[function(require,module,exports){
var engin = require('./_engine.js'),
    Button = require('./classes/Button.js'),
    Rect = require('./classes/Rect.js'),
    Image = require('./classes/Image.js'),
    C = require('./_const.js'),
    o = require('./_objects.js'),
    events = require('./_events.js');
    canvas = require('./_canvas.js');

engin.gameEngineStart(gameLoops.menu);

},{"./_canvas.js":1,"./_const.js":2,"./_engine.js":3,"./_events.js":4,"./_objects.js":8,"./classes/Button.js":10,"./classes/Image.js":11,"./classes/Rect.js":12}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19lbmdpbmUuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZXZlbnRzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2dhbWVMb29wcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19oZWxwZXJGdW5jdGlvbnMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fbGV2ZWxzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX29iamVjdHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fc3RvcHdhdGNoLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9CdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0ltYWdlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9SZWN0LmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvZmFrZV9lZWI4ZmJhNC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIGNudiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG52YXIgY3R4ID0gY252LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbmNudi5zdHlsZS5ib3JkZXIgPSBcIjJweCBzb2xpZCBibGFja1wiO1xyXG5jbnYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ3aGl0ZVwiO1xyXG5jbnYud2lkdGggPSBDLldJRFRIO1xyXG5jbnYuaGVpZ2h0ID0gQy5IRUlHSFQ7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Y252IDogY252LFxyXG5cclxuXHRjdHggOiBjdHhcclxuXHJcbn07IiwidmFyIFBBREQgPSAxOyBcdFx0XHRcdFx0XHQvL9C/0LDQtNC00LjQvdCzLCDQutC+0YLQvtGA0YvQuSDRjyDRhdC+0YfRgyDRh9GC0L7QsdGLINCx0YvQuywg0LzQtdC2INC60LLQsNC00YDQsNGC0LDQvNC4XHJcbnZhciBXSURUSCA9IFBBREQgKyAoUEFERCs1MCkqOTsgXHQvL9GI0LjRgNC40L3QsCDQutCw0L3QstGLXHJcbnZhciBIRUlHSFQgPSBQQUREICsgKFBBREQrNTApKjEwOyAgIC8v0LLRi9GB0L7RgtCwINC60LDQvdCy0YtcclxudmFyIENOVl9CT1JERVIgPSAyO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdFBETkcgOiBQQURELFxyXG5cclxuXHRXSURUSCA6IFdJRFRILFxyXG5cclxuXHRIRUlHSFQgOiBIRUlHSFQsXHJcblxyXG5cdENOVl9CT1JERVIgOiBDTlZfQk9SREVSXHJcblxyXG59OyIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKtC60YDQvtGB0LHRgNCw0YPQt9C10YDQvdC+0LUg0YPQv9GA0LLQu9C10L3QuNC1INGG0LjQutC70LDQvNC4INC40LPRgNGLKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxudmFyIGdhbWVFbmdpbmU7XHJcblxyXG52YXIgbmV4dEdhbWVTdGVwID0gKGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdHdlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuXHRtc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRzZXRJbnRlcnZhbChjYWxsYmFjaywgMTAwMC82MClcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2FtZUVuZ2luZVN0ZXAoKXtcclxuXHRnYW1lRW5naW5lKCk7XHJcblx0bmV4dEdhbWVTdGVwKGdhbWVFbmdpbmVTdGVwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNldEdhbWVFbmdpbmUoKXtcclxuXHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcblx0XHRnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcblx0XHRnYW1lRW5naW5lU3RlcCgpO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsInZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgc3cgPSByZXF1aXJlKCcuL19zdG9wd2F0Y2guanMnKTtcclxudmFyIGxldmVscyA9IHJlcXVpcmUoJy4vX2xldmVscy5qcycpO1xyXG52YXIgZW5naW4gPSByZXF1aXJlKCcuL19lbmdpbmUuanMnKTtcclxudmFyIGdMb28gPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBnYW1lTG9vcHMgPSBnTG9vO1xyXG5cclxudmFyIGlzTmVhciA9IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIgMiDQvtCx0YrQtdC60YLQsCwg0LLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtC+0LjRgiDQu9C4INGBINC30LDQv9GA0LDRiNC40LLQsNC10LzQvtC5INGB0YLQvtGA0L7QvdGLIDHRi9C5INC+0YIgMtCz0L4uXHJcbiAgICBcclxuICAgIHVwIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICAgIG1vdmUgPSBvYmpfMltpXS55ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9ial8yLnkgKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gICAgfSxcclxuXHJcbiAgICBkb3duIDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICAgIG1vdmUgPSBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMltpXS55ICYmIG9ial8xLnggPT0gb2JqXzJbaV0ueDtcclxuICAgICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9ial8xLnkgKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yLnkgJiYgb2JqXzEueCA9PSBvYmpfMi54O1xyXG4gICAgfSxcclxuXHJcbiAgICBsZWZ0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqXzIpID09ICdbb2JqZWN0IEFycmF5XScgKSB7XHJcbiAgICAgICAgdmFyIG1vdmUgPSBmYWxzZTtcclxuICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9ial8yLmxlbmd0aDtpKysgKXtcclxuICAgICAgICAgIG1vdmUgPSBvYmpfMltpXS54ICsgb2JqXzJbaV0udyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzJbaV0ueTtcclxuICAgICAgICAgIGlmIChtb3ZlKSByZXR1cm4gbW92ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9ial8yLnggKyBvYmpfMi53ICsgQy5QRE5HID09IG9ial8xLnggJiYgb2JqXzEueSA9PSBvYmpfMi55O1xyXG4gICAgfSxcclxuXHJcbiAgICByaWdodCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgICBtb3ZlID0gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvYmpfMS54ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIG1vdmVSZWN0cyhkaXJlY3Rpb24peyAgLy8o0L7Qv9C40YHRi9Cy0LDQtdC8INCz0YDQsNC90LjRhtGLINC00LLQuNC20LXQvdC40Y8pINGA0LDQt9GA0LXRiNCw0LXRgiDQtNCy0LjQttC10L3QuNC1INCyINC/0YDQtdC00LXQu9Cw0YUg0YPRgNC+0LLQvdGPXHJcbiAgIFxyXG4gIGlmICggaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby5ib3gpICYmICFoZi5pc0JvcmRlcltkaXJlY3Rpb25dKG8uYm94KSAmJiAhaXNOZWFyW2RpcmVjdGlvbl0oby5ib3gsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0YDRj9C00L7QvCDRgSDRj9GJ0LjQutC+0Lwg0Lgg0Y/RidC40Log0L3QtSDRgyDQs9GA0LDQvdC40YYsINC00LLQuNCz0LDQtdC8LlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgICBvLmJveC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfSBlbHNlIGlmKCAhaXNOZWFyW2RpcmVjdGlvbl0oby5wbCwgby5ib3gpICYmICFoZi5pc0JvcmRlcltkaXJlY3Rpb25dKG8ucGwpICYmICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLndhbGxzKSApeyAvL9C10YHQu9C4INC90LUg0YDRj9C00L7QvCDRgSDRj9GJ0LjQutC+0Lwg0Lgg0L3QtSDRgNGP0LTQvtC8INGBINCz0YDQsNC90LjRhtC10LksINC00LLQuNCz0LDQtdC80YHRjy5cclxuICAgIG8ucGwubW92ZShkaXJlY3Rpb24pO1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGlzQ3Vyc29ySW5CdXR0b24oeCx5LGJ1dCl7XHJcbiAgcmV0dXJuIHggPj0gYnV0LnggJiYgXHJcbiAgICAgICAgIHggPD0gYnV0LngrYnV0LncgJiYgXHJcbiAgICAgICAgIHkgPj0gYnV0LnkgJiYgXHJcbiAgICAgICAgIHkgPD0gYnV0LnkrYnV0LmhcclxufTtcclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQutC70LDQstC40YjRjFxyXG5cclxuICBpZiAoIGUua2V5ID09IFwiZFwiIHx8IGUua2V5ID09IFwiQXJyb3dSaWdodFwiICkgIFxyXG4gICAgbW92ZVJlY3RzKFwicmlnaHRcIik7XHJcblxyXG4gIGlmICggZS5rZXkgPT0gXCJzXCIgfHwgZS5rZXkgPT0gXCJBcnJvd0Rvd25cIiApICBcclxuICAgIG1vdmVSZWN0cyhcImRvd25cIik7XHJcblxyXG4gIGlmICggZS5rZXkgPT0gXCJ3XCIgfHwgZS5rZXkgPT0gXCJBcnJvd1VwXCIgKVxyXG4gICAgbW92ZVJlY3RzKFwidXBcIik7XHJcblxyXG4gIGlmICggZS5rZXkgPT0gXCJhXCIgfHwgZS5rZXkgPT0gXCJBcnJvd0xlZnRcIiApXHJcbiAgICBtb3ZlUmVjdHMoXCJsZWZ0XCIpO1xyXG59O1xyXG5cclxud2luZG93Lm9ubW91c2Vkb3duID0gZnVuY3Rpb24oZSl7XHJcblxyXG4gIHZhciB4ID0gZS5wYWdlWC0xMDtcclxuICB2YXIgeSA9IGUucGFnZVktMTA7XHJcblxyXG4gIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApeyAgXHJcbiAgICAgIGlmICggby5tZW51W2ldLm5hbWUgPT0gXCJwbGF5XCIgJiYgZ0xvby5zdGF0dXMgPT0gXCJtZW51XCIgKXsgICAgLy/QtdGB0LvQuCDQvdCw0LbQsNGC0LAg0LrQvdC+0L/QutCwINC40LPRgNCw0YLRjCwg0LfQsNC/0YPRgdC60LDQtdC8INGD0YDQvtCy0LXQvdGMLlxyXG4gICAgICAgIHN3LnN0YXJ0KCk7XHJcbiAgICAgICAgbGV2ZWxzWzFdKCk7ICBcclxuICAgICAgICBlbmdpbi5nYW1lRW5naW5lU3RhcnQoZ2FtZUxvb3BzLnBsTGV2ZWwpO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5iUmVzdGFydCkgKXtcclxuICAgIHN3LnJlc2V0KCk7XHJcbiAgICBsZXZlbHNbMV0oKTsgIFxyXG4gICAgZW5naW4uZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wbExldmVsKTtcclxuICB9O1xyXG59O1xyXG4iLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcbnZhciBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpO1xyXG52YXIgaGYgPSByZXF1aXJlKCcuL19oZWxwZXJGdW5jdGlvbnMuanMnKTtcclxudmFyIGVuZ2luID0gcmVxdWlyZSgnLi9fZW5naW5lLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVMb29wcyA9ICB7XHJcblxyXG4gIHBsTGV2ZWwgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcInBsTGV2ZWxcIjsgXHJcblxyXG4gICAgaGYuY2xlYXJSZWN0KDAsMCxDLldJRFRILEMuSEVJR0hUKTsgLy/QvtGH0LjRgdGC0LrQsCDQvtCx0LvQsNGB0YLQuFxyXG5cclxuICAgIC8v0LLRi9Cy0L7QtNC40Lwg0LzQsNGC0YDQuNGH0L3QvtC1INC/0L7Qu9C1INC40LPRgNGLXHJcbiAgICBmb3IgKCBpIGluIG8ubWF0cml4ICl7XHJcbiAgICAgIG8ubWF0cml4W2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy/QstGL0LLQvtC00LjQvCDRgdGC0LXQvdGLXFzQv9GA0LXQs9GA0LDQtNGLXHJcbiAgICBmb3IgKCBpIGluIG8ud2FsbHMgKXtcclxuICAgICAgby53YWxsc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8qKioq0JLRi9Cy0L7QtNC40Lwg0KXQtdC00LXRgCoqKioqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIG8uaGVhZGVyLmRyYXcoKTtcclxuICAgIG8uc3RvcFdhdGNoLmRyYXcoMSwxMCk7XHJcbiAgICBvLmJSZXN0YXJ0LmRyYXcoKTtcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKioqKtCS0YvQstC+0LTQuNC8INC+0LHRitC10LrRgtGLKioqKipcclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgby5wbC5kcmF3KCk7XHJcbiAgICBvLmJveC5kcmF3KCk7XHJcbiAgICBvLmRvb3IuZHJhdygpO1xyXG5cclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8qKioq0JXRgdC70Lgg0L/QvtCx0LXQtNC40LvQuCoqKioqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgIGlmICggaGYuaXNXaW4oKSApe1xyXG4gICAgICBjb25zb2xlLmxvZyhcIldJTiFcIik7XHJcbiAgICAgIGVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICB9O1xyXG5cclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuICAgIGdhbWVMb29wcy5zdGF0dXMgPSBcIm1lbnVcIjtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8uYmcuZHJhd0ltZygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgIG8ubWVudVtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICB9LFxyXG5cclxuICBzdGF0dXMgOiBcIlwiXHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICBjbGVhclJlY3QgOiBmdW5jdGlvbih4LHksdyxoKXsgIC8v0L7Rh9C40YHRgtC40YLQtdC70YxcclxuICAgIGN0eC5jbGVhclJlY3QoeCx5LHcsaCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UmFuZG9tSW50IDogZnVuY3Rpb24obWluLCBtYXgpIHsgLy/RhNGD0L3QutGG0LjRjyDQtNC70Y8g0YDQsNC90LTQvtC80LAg0YbQtdC70L7Rh9C40YHQu9C10L3QvdC+0LPQviDQt9C90LDRh9C10L3QuNGPXHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxuICB9LFxyXG5cclxuICBpc0JvcmRlciA6IHsgLy/Qv9GA0LjQvdC40LzQsNC10YIg0L7QsdGK0LXQutGCLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvtC80Lkg0LPRgNCw0L3QuNGG0Ysg0LrQsNC90LLRi1xyXG4gICAgdXAgOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gb2JqLnkgPT0gQy5QRE5HICsgb2JqLmggKyBDLlBETkc7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvd24gOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gb2JqLnkgPT0gQy5IRUlHSFQgLSBvYmouaCAtIEMuUERORztcclxuICAgIH0sXHJcblxyXG4gICAgbGVmdCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueCA9PSBDLlBETkc7XHJcbiAgICB9LFxyXG5cclxuICAgIHJpZ2h0IDogZnVuY3Rpb24ob2JqKXtcclxuICAgICAgcmV0dXJuIG9iai54ID09IEMuV0lEVEggLSBvYmoudyAtIEMuUEROR1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGlzV2luIDogZnVuY3Rpb24oKXsgLy/Qv9C+0LHQtdC00LjQu9C4P1xyXG5cclxuICAgIHJldHVybiBvLmJveC54ID09IG8uZG9vci54ICYmIG8uYm94LnkgPT0gby5kb29yLnk7XHJcblxyXG4gIH1cclxuXHJcbn07XHJcbiIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0MSA6IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0dmFyIF93YWxscyA9IFtdOyAgLy/QvNCw0YHRgdC40LIg0YEg0LHRg9C00YPRidC10L/QvtGB0YLRgNC+0LXQvdC90YvQvNC4INGB0YLQtdC90LrQsNC80LhcclxuXHRcdHZhciBhcnIgPSBbICAgICAgIFxyXG5cdFx0WzIsM10sWzIsNF0sWzIsNV0sWzMsMF0sWzMsNl0sWzMsOF0sWzQsMl0sWzUsMV0sWzUsM10sWzUsN10sWzYsNF0sWzcsNF0sWzcsNl0sWzgsMV0sWzgsOF0sWzksMF0sWzksNF0sWzksNV1cclxuXHRcdF07XHRcdFx0XHQgIC8v0L/RgNC40LTRg9C80LDQvdC90YvQuSDQvNCw0YHRgdC40LIg0YHQviDRgdGC0LXQvdC60LDQvNC4XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBSZWN0KEMuUERORythcnJbaV1bMV0qKDUwK0MuUERORyksIEMuUERORythcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCwgXCIjNjIyREExXCIpICk7XHJcblx0XHR9O1x0XHRcdFx0ICAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvNCw0YHRgdC40LIgd2FsbHNcclxuXHJcblx0XHRvLmJveC5zZXRQb3NpdGlvbiggQy5QRE5HKzIqKDUwK0MuUERORyksIEMuUERORys4Kig1MCtDLlBETkcpICk7XHJcblx0XHRvLnBsLnNldFBvc2l0aW9uKCBDLlBETkcsIEMuUERORyoyKzUwICk7XHJcblx0XHRvLmRvb3Iuc2V0UG9zaXRpb24oIEMuUERORys4Kig1MCtDLlBETkcpLCBDLlBETkcrMSooNTArQy5QRE5HKSApO1xyXG5cclxuXHRcdG8ud2FsbHMgPSBfd2FsbHM7XHJcblxyXG5cdH1cclxuXHJcblxyXG59OyIsInZhciBDID0gcmVxdWlyZSgnLi9fY29uc3QuanMnKTtcclxudmFyIGNudnMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1hdHJpeCgpe1xyXG4gIHZhciBtYXRyaXggPSBbXTsgLy/QvNCw0YHRgdC40LIg0LTQu9GPINC80LDRgtGA0LjRh9C90L7Qs9C+INCy0LjQtNCwINGD0YDQvtCy0L3Rj1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspeyAvL9C30LDQv9C+0LvQvdGP0LXQvCDQvtCx0YrQtdC60YJcclxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgOTsgaisrKXtcclxuICAgICAgbWF0cml4LnB1c2goIG5ldyBSZWN0KEMuUERORytqKig1MCtDLlBETkcpLCBDLlBETkcraSooNTArQy5QRE5HKSwgNTAsIDUwLCBcIiNGRUEzQTNcIikgKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gbWF0cml4XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNZW51KHR4dEFyciwgbmFtZUFycil7ICAvL9GB0L7Qt9C00LDQtdC8INCz0LvQsNCy0L3QvtC1INC80LXQvdGOXHJcbiAgdmFyIG1lbnUgPSBbXTtcclxuICB2YXIgbmFtZXMgPSBuYW1lQXJyO1xyXG4gIHZhciB0eHQgPSB0eHRBcnI7XHJcbiAgdmFyIGFtb3VudHMgPSB0eHRBcnIubGVuZ3RoO1xyXG4gIFxyXG4gIHZhciBfaGVpZ2h0ID0gKEMuSEVJR0hULzIpIC0gKDc1KmFtb3VudHMvMik7IFxyXG4gIHZhciBfd2lkdGggPSBDLldJRFRILzItMjAwLzI7XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYW1vdW50czsgaSsrKXtcclxuICAgIG1lbnUucHVzaCggbmV3IEJ1dHRvbiggX3dpZHRoLCBfaGVpZ2h0K2kqNzUsIDIwMCwgNTAsIFwiYmxhY2tcIiwgdHh0W2ldLCBuYW1lc1tpXSwgMzAgKSApO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBtZW51O1xyXG59O1xyXG5cclxudmFyIGdyZCA9IGNudnMuY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KEMuV0lEVEgsIDAsIEMuV0lEVEgsIDUwK0MuUERORyk7XHJcbmdyZC5hZGRDb2xvclN0b3AoMCwgJ2JsYWNrJyk7ICAgXHJcbmdyZC5hZGRDb2xvclN0b3AoMSwgJ2dyZXknKTtcclxuXHJcblxyXG52YXIgbWVudSA9IGNyZWF0ZU1lbnUoW1wi0JjQs9GA0LDRgtGMXCIsXCLQndCw0YHRgtGA0L7QudC60LhcIl0sW1wicGxheVwiLCBcIm9wdGlvbnNcIl0pO1xyXG5cclxudmFyIGhlYWRlciA9IG5ldyBSZWN0KCAwLCAwLCBDLldJRFRILCA1MCtDLlBETkcsIGdyZCApO1xyXG52YXIgYlJlc3RhcnQgPSBuZXcgQnV0dG9uKCBDLldJRFRILTkwLTUsIGhlYWRlci5oLzItQy5DTlZfQk9SREVSLzIgLSA0MC8yLCA5MCwgNDAsIFwiIzM0QkFDQVwiLCBcIlJlc3RhcnRcIiwgXCJyZXN0YXJ0XCIsIDI1ICk7XHJcbnZhciBzdG9wV2F0Y2ggPSBuZXcgQnV0dG9uKCA1LCBoZWFkZXIuaC8yLUMuQ05WX0JPUkRFUi8yIC0gNDAvMiwgMTQ1LCA0MCwgXCIjMzRCQUNBXCIsIFwiMDA6MDA6MDA6MDAwXCIsIFwic3RvcHdhdGNoXCIsIDI1ICk7XHJcblxyXG52YXIgbWF0cml4ID0gY3JlYXRlTWF0cml4KCk7XHJcblxyXG52YXIgcGwgPSBuZXcgUmVjdChDLlBETkcsQy5QRE5HKjIrNTAsNTAsNTAsXCJibGFja1wiKTsgIC8v0LjQs9GA0L7QulxyXG52YXIgYm94ID0gbmV3IFJlY3QoQy5QRE5HLEMuUERORyoyKzUwLDUwLDUwLFwiIzNENURGRlwiKTsgLy/QsdC+0LrRgVxyXG52YXIgZG9vciA9IG5ldyBSZWN0KEMuUERORyxDLlBETkcqMis1MCw1MCw1MCwgXCJyZ2JhKDIzMSwgMjMsIDMyLCAwLjgpXCIpOyAvL9C00LLQtdGA0YxcclxudmFyIGJnID0gbmV3IEltYWdlKFwiaW1nL3JlY3QtYmcuanBnXCIpO1xyXG52YXIgd2FsbHMgPSBbXTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRtYXRyaXggOiBtYXRyaXgsXHJcblx0bWVudSA6IG1lbnUsXHJcblx0aGVhZGVyIDogaGVhZGVyLFxyXG4gIHN0b3BXYXRjaCA6IHN0b3BXYXRjaCxcclxuXHRiUmVzdGFydCA6IGJSZXN0YXJ0LFxyXG5cdHBsIDogcGwsXHJcblx0Ym94IDogYm94LFxyXG5cdGRvb3IgOiBkb29yLFxyXG5cdGJnIDogYmcsXHJcblx0d2FsbHMgOiB3YWxsc1xyXG5cclxufTsiLCJ2YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGdhbWUgPSByZXF1aXJlKCcuL19nYW1lTG9vcHMuanMnKTtcclxuXHJcbi8vIHZhciBjdXJyZW50QnV0dG9uID0gXCJTdGFydFwiO1xyXG52YXIgcGF1c2UgPSAwO1xyXG52YXIgYmVnaW5UaW1lID0gMDtcclxudmFyIGN1cnJlbnRUaW1lID0gMDtcclxudmFyIHVwVGltZVRPO1xyXG5cclxuZnVuY3Rpb24gdXBUaW1lKGNvdW50RnJvbSkge1xyXG5cdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG5cdHZhciBkaWZmZXJlbmNlID0gKG5vdy1jb3VudEZyb20gKyBjdXJyZW50VGltZSk7XHJcblxyXG5cdHZhciBob3Vycz1NYXRoLmZsb29yKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSkvKDYwKjYwKjEwMDApKjEpO1xyXG5cdHZhciBtaW5zPU1hdGguZmxvb3IoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKS8oNjAqMTAwMCkqMSk7XHJcblx0dmFyIHNlY3M9TWF0aC5mbG9vcigoKChkaWZmZXJlbmNlJSg2MCo2MCoxMDAwKjI0KSklKDYwKjYwKjEwMDApKSUoNjAqMTAwMCkpLzEwMDAqMSk7XHJcblxyXG5cdGhvdXJzID0gKCBob3VycyA8IDEwKSA/IFwiMFwiK2hvdXJzIDogaG91cnM7XHJcblx0bWlucyA9ICggbWlucyA8IDEwKSA/IFwiMFwiK21pbnMgOiBtaW5zO1xyXG5cdHNlY3MgPSAoIHNlY3MgPCAxMCkgPyBcIjBcIitzZWNzIDogc2VjcztcclxuXHJcblx0by5zdG9wV2F0Y2gudHh0ID0gaG91cnMrXCIgOiBcIittaW5zK1wiIDogXCIrc2VjcztcclxuXHJcblx0Y2xlYXJUaW1lb3V0KHVwVGltZVRPKTtcclxuXHR1cFRpbWVUTz1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHVwVGltZShjb3VudEZyb20pOyB9LDEwMDAvNjApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IFxyXG5cclxuXHRzdGFydCA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKGdhbWUuc3RhdHVzID09ICdwbExldmVsJyB8fCBnYW1lTG9vcHMuc3RhdHVzID09IFwibWVudVwiKSB7XHJcblx0XHRcdHVwVGltZShuZXcgRGF0ZSgpKTtcclxuXHRcdFx0dmFyIG5vd1QgPSBuZXcgRGF0ZSgpO1xyXG5cdFx0XHRiZWdpblRpbWUgPSBub3dULmdldFRpbWUoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHBhdXNlVGltZXIoKTtcclxuXHRcdH07XHJcblx0fSxcclxuXHJcblx0cmVzZXQgOiBmdW5jdGlvbigpIHtcclxuXHRcdGN1cnJlbnRUaW1lID0gMDtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblxyXG5cdFx0by5zdG9wV2F0Y2gudHh0ID0gXCIwMCA6IDAwIDogMDBcIjtcclxuXHRcdHRoaXMuc3RhcnQoKTtcclxuXHR9LFxyXG5cclxuXHRwYXVzZVRpbWVyIDogZnVuY3Rpb24oKXtcclxuXHRcdHZhciBjdXJEYXRhID0gbmV3IERhdGUoKTtcclxuXHRcdGN1cnJlbnRUaW1lID0gY3VyRGF0YS5nZXRUaW1lKCkgLSBiZWdpblRpbWUgKyBjdXJyZW50VGltZTtcclxuXHRcdGNsZWFyVGltZW91dCh1cFRpbWVUTyk7XHJcblx0fVxyXG5cclxufTsiLCJ2YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbiA9IGZ1bmN0aW9uKHgsIHksIHcsIGgsIGNvbG9yLCB0eHQsIG5hbWUsIGZTaXplKXtcclxuICBcclxuICB0aGlzLnggPSB4O1xyXG4gIHRoaXMueSA9IHk7XHJcbiAgdGhpcy53ID0gdztcclxuICB0aGlzLmggPSBoO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuICB0aGlzLnR4dCA9IHR4dDtcclxuICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIHRoaXMuZlNpemUgPSBmU2l6ZTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24obm9DZW50ZXIsIHBhZGQpe1xyXG5cclxuICAgIHZhciBfcGFkZCA9IHBhZGQgfHwgNTtcclxuICAgIHZhciBfeCA9ICggIW5vQ2VudGVyICkgPyB0aGlzLngrdGhpcy53LzIgOiB0aGlzLngrX3BhZGQ7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gXCJ3aGl0ZVwiO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9ICggIW5vQ2VudGVyICkgPyBcImNlbnRlclwiIDogXCJzdGFydFwiO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZTaXplICsgJ3B4IEFyaWFsJztcclxuICAgIGN0eC50ZXh0QmFzZWxpbmU9XCJtaWRkbGVcIjsgXHJcbiAgICBjdHguZmlsbFRleHQodGhpcy50eHQsIF94LCB0aGlzLnkrdGhpcy5oLzIpO1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2UgPSBmdW5jdGlvbihzcmMpe1xyXG4gIHRoaXMuc3JjID0gc3JjO1xyXG4gIHRoaXMubG9hZGVkID0gZmFsc2U7XHJcblxyXG4gIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHJcbiAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcbiAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICBpbWcuc3JjID0gc3JjO1xyXG5cclxuICB0aGlzLmRvbSA9IGltZztcclxuXHJcbiAgdGhpcy5kcmF3SW1nID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBpZiAoICF0aGlzLmxvYWRlZCApIHJldHVybjtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuZG9tLDAsMCk7XHJcblxyXG4gIH07XHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3QgPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvcil7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcblxyXG5cclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgfTtcclxuICBcclxuICB0aGlzLm1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG4gICAgc3dpdGNoKGRpcmVjdGlvbil7XHJcbiAgICAgIGNhc2UgXCJ1cFwiIDogXHJcbiAgICAgIHRoaXMueSAtPSB0aGlzLmgrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImRvd25cIiA6IFxyXG4gICAgICB0aGlzLnkgKz0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJyaWdodFwiIDogXHJcbiAgICAgIHRoaXMueCArPSB0aGlzLncrQy5QRE5HO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJhbmRvbVBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMueCA9IGdldFJhbmRvbUludCgxLDcpKih0aGlzLncrQy5QRE5HKStDLlBETkc7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK0MuUERORykrQy5QRE5HO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LHkpe1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfVxyXG59OyIsInZhciBlbmdpbiA9IHJlcXVpcmUoJy4vX2VuZ2luZS5qcycpLFxyXG4gICAgQnV0dG9uID0gcmVxdWlyZSgnLi9jbGFzc2VzL0J1dHRvbi5qcycpLFxyXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9SZWN0LmpzJyksXHJcbiAgICBJbWFnZSA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWFnZS5qcycpLFxyXG4gICAgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyksXHJcbiAgICBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpLFxyXG4gICAgZXZlbnRzID0gcmVxdWlyZSgnLi9fZXZlbnRzLmpzJyk7XHJcbiAgICBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxuXHJcbmVuZ2luLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiJdfQ==
