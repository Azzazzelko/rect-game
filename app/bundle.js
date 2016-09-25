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
var padd = 1; 						//паддинг, который я хочу чтобы был, меж квадратами
var width = padd + (padd+50)*9; 	//ширина канвы
var height = padd + (padd+50)*10;   //высота канвы

module.exports = {

	PDNG : padd,

	WIDTH : width,

	HEIGHT : height

};
},{}],3:[function(require,module,exports){
var o = require('./_objects.js');
var levels = require('./_levels.js');
var game = require('./_gameEngine.js');
var gloo = require('./_gameLoops.js');
var hf = require('./_helperFunctions.js');
var C = require('./_const.js');

var gameLoops = gloo;

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
 
  if ( isNear[direction](o.pl, o.box) && !hf.isBorder[direction](o.box)){ //если рядом с ящиком и ящик не у границ, двигаем.
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
      if ( o.menu[i].name == "play" ){
        levels[1](o.box.x,o.box.y);  
        game.gameEngineStart(gameLoops.plLevel);
      };
    };
  };

  if( isCursorInButton(x,y,o.bRestart) ){
    levels[1](o.box.x,o.box.y);  
    game.gameEngineStart(gameLoops.plLevel);
  };
};

},{"./_const.js":2,"./_gameEngine.js":4,"./_gameLoops.js":5,"./_helperFunctions.js":6,"./_levels.js":7,"./_objects.js":8}],4:[function(require,module,exports){
//*****************************************
//**кросбраузерное упрвление циклами игры**
//*****************************************

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

},{}],5:[function(require,module,exports){
var C = require('./_const.js');
var o = require('./_objects.js');
var hf = require('./_helperFunctions.js');
var game = require('./_gameEngine.js');

module.exports = gameLoops =  {

  plLevel : function(){

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    for ( i in o.matrix ){
      o.matrix[i].draw();
    };

    for ( i in o.walls ){
      o.walls[i].draw();
    };

    o.header.draw();
    o.bRestart.draw();

    o.pl.draw();
    o.box.draw();
    o.door.draw();

    if ( o.box.x == o.door.x && o.box.y == o.door.y ){
      console.log("WIN!");

      game.gameEngineStart(gameLoops.menu);
    };

  },

  menu : function(){

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.bg.drawImg();

    for ( i in o.menu ){
      o.menu[i].draw();
    };

  }

};
},{"./_const.js":2,"./_gameEngine.js":4,"./_helperFunctions.js":6,"./_objects.js":8}],6:[function(require,module,exports){
var canvas = require('./_canvas.js');
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
  }

};

},{"./_canvas.js":1,"./_const.js":2}],7:[function(require,module,exports){
var C = require('./_const.js');
var o = require('./_objects.js');

module.exports = {

	1 : function(){

		var _walls = [];
		var arr = [
		[2,3],[2,4],[2,5],[2,6],[3,0],[3,6],[3,8],[4,2],[5,1],[5,2],[5,3],[5,7],[6,4],[7,4],[7,6],[8,0],[8,1],[8,8],[9,0],[9,4],[9,5]
		];

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DD1") );
		};

		o.box.x = C.PDNG+2*(50+C.PDNG);
		o.box.y = C.PDNG+8*(50+C.PDNG);

		o.walls = _walls;

	}


};
},{"./_const.js":2,"./_objects.js":8}],8:[function(require,module,exports){
var C = require('./_const.js');

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

var matrix = createMatrix();
var menu = createMenu(["Играть","Настройки"],["play", "options"]);
var header = new Rect( 0, 0, C.WIDTH, 50+C.PDNG, "black" );
var bRestart = new Button( C.WIDTH-90-5, header.h/2-1 - 40/2, 90, 40, "#34BACA", "Restart", "restart", 25 );

var pl = new Rect(C.PDNG,C.PDNG*2+50,50,50,"black");  //игрок
var box = new Rect(C.PDNG,C.PDNG*2+50,50,50,"blue"); //бокс
var door = new Rect(C.PDNG,C.PDNG*2+50,50,50, "rgba(231, 23, 32, 0.8)"); //дверь
var bg = new Image("img/rect-bg.jpg");
var walls = [];

module.exports = {

	matrix : matrix,
	menu : menu,
	header : header,
	bRestart : bRestart,
	pl : pl,
	box : box,
	door : door,
	bg : bg,
	walls : walls

};
},{"./_const.js":2}],9:[function(require,module,exports){
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

  this.draw = function(){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "white";
    ctx.textAlign="center";
    ctx.font = this.fSize + 'px Arial';
    ctx.textBaseline="middle"; 
    ctx.fillText(this.txt, this.x+this.w/2, this.y+this.h/2);
  };

};
},{"./../_canvas.js":1}],10:[function(require,module,exports){
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
},{"./../_canvas.js":1}],11:[function(require,module,exports){
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
};
},{"./../_canvas.js":1,"./../_const.js":2}],12:[function(require,module,exports){
var game = require('./_gameEngine.js'),
    Button = require('./classes/Button.js'),
    Rect = require('./classes/Rect.js'),
    Image = require('./classes/Image.js'),
    C = require('./_const.js'),
    o = require('./_objects.js'),
    events = require('./_events.js');
    canvas = require('./_canvas.js');

game.gameEngineStart(gameLoops.menu);

},{"./_canvas.js":1,"./_const.js":2,"./_events.js":3,"./_gameEngine.js":4,"./_objects.js":8,"./classes/Button.js":9,"./classes/Image.js":10,"./classes/Rect.js":11}]},{},[12])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2NhbnZhcy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19jb25zdC5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19ldmVudHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9fZ2FtZUVuZ2luZS5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19nYW1lTG9vcHMuanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9faGVscGVyRnVuY3Rpb25zLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvX2xldmVscy5qcyIsIkI6L09wZW5Tb3VyY2UvT3BlblNlcnZlci9kb21haW5zL2xvY2FsaG9zdC9yZWN0LWdhbWUvYXBwL2pzL19vYmplY3RzLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9CdXR0b24uanMiLCJCOi9PcGVuU291cmNlL09wZW5TZXJ2ZXIvZG9tYWlucy9sb2NhbGhvc3QvcmVjdC1nYW1lL2FwcC9qcy9jbGFzc2VzL0ltYWdlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvY2xhc3Nlcy9SZWN0LmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvZmFrZV84ZWM1ZWM3YS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgY252ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcbnZhciBjdHggPSBjbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuY252LnN0eWxlLmJvcmRlciA9IFwiMnB4IHNvbGlkIGJsYWNrXCI7XHJcbmNudi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIndoaXRlXCI7XHJcbmNudi53aWR0aCA9IEMuV0lEVEg7XHJcbmNudi5oZWlnaHQgPSBDLkhFSUdIVDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHRjbnYgOiBjbnYsXHJcblxyXG5cdGN0eCA6IGN0eFxyXG5cclxufTsiLCJ2YXIgcGFkZCA9IDE7IFx0XHRcdFx0XHRcdC8v0L/QsNC00LTQuNC90LMsINC60L7RgtC+0YDRi9C5INGPINGF0L7Rh9GDINGH0YLQvtCx0Ysg0LHRi9C7LCDQvNC10LYg0LrQstCw0LTRgNCw0YLQsNC80LhcclxudmFyIHdpZHRoID0gcGFkZCArIChwYWRkKzUwKSo5OyBcdC8v0YjQuNGA0LjQvdCwINC60LDQvdCy0YtcclxudmFyIGhlaWdodCA9IHBhZGQgKyAocGFkZCs1MCkqMTA7ICAgLy/QstGL0YHQvtGC0LAg0LrQsNC90LLRi1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdFBETkcgOiBwYWRkLFxyXG5cclxuXHRXSURUSCA6IHdpZHRoLFxyXG5cclxuXHRIRUlHSFQgOiBoZWlnaHRcclxuXHJcbn07IiwidmFyIG8gPSByZXF1aXJlKCcuL19vYmplY3RzLmpzJyk7XHJcbnZhciBsZXZlbHMgPSByZXF1aXJlKCcuL19sZXZlbHMuanMnKTtcclxudmFyIGdhbWUgPSByZXF1aXJlKCcuL19nYW1lRW5naW5lLmpzJyk7XHJcbnZhciBnbG9vID0gcmVxdWlyZSgnLi9fZ2FtZUxvb3BzLmpzJyk7XHJcbnZhciBoZiA9IHJlcXVpcmUoJy4vX2hlbHBlckZ1bmN0aW9ucy5qcycpO1xyXG52YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG52YXIgZ2FtZUxvb3BzID0gZ2xvbztcclxuXHJcbnZhciBpc05lYXIgPSB7IC8v0L/RgNC40L3QuNC80LDQtdGCIDIg0L7QsdGK0LXQutGC0LAsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC80L7QuSDRgdGC0L7RgNC+0L3RiyAx0YvQuSDQvtGCIDLQs9C+LlxyXG4gICAgXHJcbiAgICB1cCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueSArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvYmpfMi55ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICAgIH0sXHJcblxyXG4gICAgZG93biA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgICBtb3ZlID0gb2JqXzEueSArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzJbaV0ueSAmJiBvYmpfMS54ID09IG9ial8yW2ldLng7XHJcbiAgICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvYmpfMS55ICsgb2JqXzEudyArIEMuUERORyA9PSBvYmpfMi55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICAgIH0sXHJcblxyXG4gICAgbGVmdCA6IGZ1bmN0aW9uKG9ial8xLCBvYmpfMil7XHJcbiAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ial8yKSA9PSAnW29iamVjdCBBcnJheV0nICkge1xyXG4gICAgICAgIHZhciBtb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmpfMi5sZW5ndGg7aSsrICl7XHJcbiAgICAgICAgICBtb3ZlID0gb2JqXzJbaV0ueCArIG9ial8yW2ldLncgKyBDLlBETkcgPT0gb2JqXzEueCAmJiBvYmpfMS55ID09IG9ial8yW2ldLnk7XHJcbiAgICAgICAgICBpZiAobW92ZSkgcmV0dXJuIG1vdmU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvYmpfMi54ICsgb2JqXzIudyArIEMuUERORyA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICAgIH0sXHJcblxyXG4gICAgcmlnaHQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpfMikgPT0gJ1tvYmplY3QgQXJyYXldJyApIHtcclxuICAgICAgICB2YXIgbW92ZSA9IGZhbHNlO1xyXG4gICAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqXzIubGVuZ3RoO2krKyApe1xyXG4gICAgICAgICAgbW92ZSA9IG9ial8xLnggKyBvYmpfMS53ICsgQy5QRE5HID09IG9ial8yW2ldLnggJiYgb2JqXzEueSA9PSBvYmpfMltpXS55O1xyXG4gICAgICAgICAgaWYgKG1vdmUpIHJldHVybiBtb3ZlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gb2JqXzEueCArIG9ial8xLncgKyBDLlBETkcgPT0gb2JqXzIueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBtb3ZlUmVjdHMoZGlyZWN0aW9uKXsgIC8vKNC+0L/QuNGB0YvQstCw0LXQvCDQs9GA0LDQvdC40YbRiyDQtNCy0LjQttC10L3QuNGPKSDRgNCw0LfRgNC10YjQsNC10YIg0LTQstC40LbQtdC90LjQtSDQsiDQv9GA0LXQtNC10LvQsNGFINGD0YDQvtCy0L3Rj1xyXG4gXHJcbiAgaWYgKCBpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWhmLmlzQm9yZGVyW2RpcmVjdGlvbl0oby5ib3gpKXsgLy/QtdGB0LvQuCDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDRj9GJ0LjQuiDQvdC1INGDINCz0YDQsNC90LjRhiwg0LTQstC40LPQsNC10LwuXHJcbiAgICBvLnBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIG8uYm94Lm1vdmUoZGlyZWN0aW9uKTtcclxuICB9IGVsc2UgaWYoICFpc05lYXJbZGlyZWN0aW9uXShvLnBsLCBvLmJveCkgJiYgIWhmLmlzQm9yZGVyW2RpcmVjdGlvbl0oby5wbCkgJiYgIWlzTmVhcltkaXJlY3Rpb25dKG8ucGwsIG8ud2FsbHMpICl7IC8v0LXRgdC70Lgg0L3QtSDRgNGP0LTQvtC8INGBINGP0YnQuNC60L7QvCDQuCDQvdC1INGA0Y/QtNC+0Lwg0YEg0LPRgNCw0L3QuNGG0LXQuSwg0LTQstC40LPQsNC10LzRgdGPLlxyXG4gICAgby5wbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG5cclxufTtcclxuXHJcbmZ1bmN0aW9uIGlzQ3Vyc29ySW5CdXR0b24oeCx5LGJ1dCl7XHJcbiAgcmV0dXJuIHggPj0gYnV0LnggJiYgXHJcbiAgICAgICAgIHggPD0gYnV0LngrYnV0LncgJiYgXHJcbiAgICAgICAgIHkgPj0gYnV0LnkgJiYgXHJcbiAgICAgICAgIHkgPD0gYnV0LnkrYnV0LmhcclxufTtcclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjQtSDQvdCw0LbQsNGC0LjRjyDQutC70LDQstC40YjRjFxyXG5cclxuICBpZiAoIGUua2V5ID09IFwiZFwiIHx8IGUua2V5ID09IFwiQXJyb3dSaWdodFwiICkgIFxyXG4gICAgbW92ZVJlY3RzKFwicmlnaHRcIik7XHJcblxyXG4gIGlmICggZS5rZXkgPT0gXCJzXCIgfHwgZS5rZXkgPT0gXCJBcnJvd0Rvd25cIiApICBcclxuICAgIG1vdmVSZWN0cyhcImRvd25cIik7XHJcblxyXG4gIGlmICggZS5rZXkgPT0gXCJ3XCIgfHwgZS5rZXkgPT0gXCJBcnJvd1VwXCIgKVxyXG4gICAgbW92ZVJlY3RzKFwidXBcIik7XHJcblxyXG4gIGlmICggZS5rZXkgPT0gXCJhXCIgfHwgZS5rZXkgPT0gXCJBcnJvd0xlZnRcIiApXHJcbiAgICBtb3ZlUmVjdHMoXCJsZWZ0XCIpO1xyXG59O1xyXG5cclxud2luZG93Lm9ubW91c2Vkb3duID0gZnVuY3Rpb24oZSl7XHJcblxyXG4gIHZhciB4ID0gZS5wYWdlWC0xMDtcclxuICB2YXIgeSA9IGUucGFnZVktMTA7XHJcblxyXG4gIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksby5tZW51W2ldKSApe1xyXG4gICAgICBpZiAoIG8ubWVudVtpXS5uYW1lID09IFwicGxheVwiICl7XHJcbiAgICAgICAgbGV2ZWxzWzFdKG8uYm94Lngsby5ib3gueSk7ICBcclxuICAgICAgICBnYW1lLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMucGxMZXZlbCk7XHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIGlmKCBpc0N1cnNvckluQnV0dG9uKHgseSxvLmJSZXN0YXJ0KSApe1xyXG4gICAgbGV2ZWxzWzFdKG8uYm94Lngsby5ib3gueSk7ICBcclxuICAgIGdhbWUuZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wbExldmVsKTtcclxuICB9O1xyXG59O1xyXG4iLCIvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbi8vKirQutGA0L7RgdCx0YDQsNGD0LfQtdGA0L3QvtC1INGD0L/RgNCy0LvQtdC90LjQtSDRhtC40LrQu9Cw0LzQuCDQuNCz0YDRiyoqXHJcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuXHJcbnZhciBuZXh0R2FtZVN0ZXAgPSAoZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0d2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0bW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0b1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdG1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0ZnVuY3Rpb24gKGNhbGxiYWNrKXtcclxuXHRcdHNldEludGVydmFsKGNhbGxiYWNrLCAxMDAwLzYwKVxyXG5cdH07XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBnYW1lRW5naW5lU3RlcCgpe1xyXG5cdGdhbWVFbmdpbmUoKTtcclxuXHRuZXh0R2FtZVN0ZXAoZ2FtZUVuZ2luZVN0ZXApO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gc2V0R2FtZUVuZ2luZSgpe1xyXG5cdGdhbWVFbmdpbmUgPSBjYWxsYmFjaztcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0Z2FtZUVuZ2luZVN0YXJ0IDogZnVuY3Rpb24gKGNhbGxiYWNrKXtcclxuXHRcdGdhbWVFbmdpbmUgPSBjYWxsYmFjaztcclxuXHRcdGdhbWVFbmdpbmVTdGVwKCk7XHJcblx0fVxyXG5cclxufTtcclxuIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxudmFyIGhmID0gcmVxdWlyZSgnLi9faGVscGVyRnVuY3Rpb25zLmpzJyk7XHJcbnZhciBnYW1lID0gcmVxdWlyZSgnLi9fZ2FtZUVuZ2luZS5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnYW1lTG9vcHMgPSAge1xyXG5cclxuICBwbExldmVsIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5tYXRyaXggKXtcclxuICAgICAgby5tYXRyaXhbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG8ud2FsbHMgKXtcclxuICAgICAgby53YWxsc1tpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIG8uaGVhZGVyLmRyYXcoKTtcclxuICAgIG8uYlJlc3RhcnQuZHJhdygpO1xyXG5cclxuICAgIG8ucGwuZHJhdygpO1xyXG4gICAgby5ib3guZHJhdygpO1xyXG4gICAgby5kb29yLmRyYXcoKTtcclxuXHJcbiAgICBpZiAoIG8uYm94LnggPT0gby5kb29yLnggJiYgby5ib3gueSA9PSBvLmRvb3IueSApe1xyXG4gICAgICBjb25zb2xlLmxvZyhcIldJTiFcIik7XHJcblxyXG4gICAgICBnYW1lLmdhbWVFbmdpbmVTdGFydChnYW1lTG9vcHMubWVudSk7XHJcbiAgICB9O1xyXG5cclxuICB9LFxyXG5cclxuICBtZW51IDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBoZi5jbGVhclJlY3QoMCwwLEMuV0lEVEgsQy5IRUlHSFQpO1xyXG5cclxuICAgIG8uYmcuZHJhd0ltZygpO1xyXG5cclxuICAgIGZvciAoIGkgaW4gby5tZW51ICl7XHJcbiAgICAgIG8ubWVudVtpXS5kcmF3KCk7XHJcbiAgICB9O1xyXG5cclxuICB9XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxudmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gIGNsZWFyUmVjdCA6IGZ1bmN0aW9uKHgseSx3LGgpeyAgLy/QvtGH0LjRgdGC0LjRgtC10LvRjFxyXG4gICAgY3R4LmNsZWFyUmVjdCh4LHksdyxoKTtcclxuICB9LFxyXG5cclxuICBnZXRSYW5kb21JbnQgOiBmdW5jdGlvbihtaW4sIG1heCkgeyAvL9GE0YPQvdC60YbQuNGPINC00LvRjyDRgNCw0L3QtNC+0LzQsCDRhtC10LvQvtGH0LjRgdC70LXQvdC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y9cclxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xyXG4gIH0sXHJcblxyXG4gIGlzQm9yZGVyIDogeyAvL9C/0YDQuNC90LjQvNCw0LXRgiDQvtCx0YrQtdC60YIsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC+0LzQuSDQs9GA0LDQvdC40YbRiyDQutCw0L3QstGLXHJcbiAgICB1cCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueSA9PSBDLlBETkcgKyBvYmouaCArIEMuUERORztcclxuICAgIH0sXHJcblxyXG4gICAgZG93biA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgIHJldHVybiBvYmoueSA9PSBDLkhFSUdIVCAtIG9iai5oIC0gQy5QRE5HO1xyXG4gICAgfSxcclxuXHJcbiAgICBsZWZ0IDogZnVuY3Rpb24ob2JqKXtcclxuICAgICAgcmV0dXJuIG9iai54ID09IEMuUERORztcclxuICAgIH0sXHJcblxyXG4gICAgcmlnaHQgOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gb2JqLnggPT0gQy5XSURUSCAtIG9iai53IC0gQy5QRE5HXHJcbiAgICB9XHJcbiAgfVxyXG5cclxufTtcclxuIiwidmFyIEMgPSByZXF1aXJlKCcuL19jb25zdC5qcycpO1xyXG52YXIgbyA9IHJlcXVpcmUoJy4vX29iamVjdHMuanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHQxIDogZnVuY3Rpb24oKXtcclxuXHJcblx0XHR2YXIgX3dhbGxzID0gW107XHJcblx0XHR2YXIgYXJyID0gW1xyXG5cdFx0WzIsM10sWzIsNF0sWzIsNV0sWzIsNl0sWzMsMF0sWzMsNl0sWzMsOF0sWzQsMl0sWzUsMV0sWzUsMl0sWzUsM10sWzUsN10sWzYsNF0sWzcsNF0sWzcsNl0sWzgsMF0sWzgsMV0sWzgsOF0sWzksMF0sWzksNF0sWzksNV1cclxuXHRcdF07XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspeyBcclxuXHRcdFx0X3dhbGxzLnB1c2goIG5ldyBSZWN0KEMuUERORythcnJbaV1bMV0qKDUwK0MuUERORyksIEMuUERORythcnJbaV1bMF0qKDUwK0MuUERORyksIDUwLCA1MCwgXCIjNjIyREQxXCIpICk7XHJcblx0XHR9O1xyXG5cclxuXHRcdG8uYm94LnggPSBDLlBETkcrMiooNTArQy5QRE5HKTtcclxuXHRcdG8uYm94LnkgPSBDLlBETkcrOCooNTArQy5QRE5HKTtcclxuXHJcblx0XHRvLndhbGxzID0gX3dhbGxzO1xyXG5cclxuXHR9XHJcblxyXG5cclxufTsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyk7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNYXRyaXgoKXtcclxuICB2YXIgbWF0cml4ID0gW107IC8v0LzQsNGB0YHQuNCyINC00LvRjyDQvNCw0YLRgNC40YfQvdC+0LPQviDQstC40LTQsCDRg9GA0L7QstC90Y9cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKXsgLy/Qt9Cw0L/QvtC70L3Rj9C10Lwg0L7QsdGK0LXQutGCXHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDk7IGorKyl7XHJcbiAgICAgIG1hdHJpeC5wdXNoKCBuZXcgUmVjdChDLlBETkcraiooNTArQy5QRE5HKSwgQy5QRE5HK2kqKDUwK0MuUERORyksIDUwLCA1MCwgXCIjRkVBM0EzXCIpICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1hdHJpeFxyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWVudSh0eHRBcnIsIG5hbWVBcnIpeyAgLy/RgdC+0LfQtNCw0LXQvCDQs9C70LDQstC90L7QtSDQvNC10L3RjlxyXG4gIHZhciBtZW51ID0gW107XHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBhbW91bnRzID0gdHh0QXJyLmxlbmd0aDtcclxuICBcclxuICB2YXIgX2hlaWdodCA9IChDLkhFSUdIVC8yKSAtICg3NSphbW91bnRzLzIpOyBcclxuICB2YXIgX3dpZHRoID0gQy5XSURUSC8yLTIwMC8yO1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFtb3VudHM7IGkrKyl7XHJcbiAgICBtZW51LnB1c2goIG5ldyBCdXR0b24oIF93aWR0aCwgX2hlaWdodCtpKjc1LCAyMDAsIDUwLCBcImJsYWNrXCIsIHR4dFtpXSwgbmFtZXNbaV0sIDMwICkgKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gbWVudTtcclxufTtcclxuXHJcbnZhciBtYXRyaXggPSBjcmVhdGVNYXRyaXgoKTtcclxudmFyIG1lbnUgPSBjcmVhdGVNZW51KFtcItCY0LPRgNCw0YLRjFwiLFwi0J3QsNGB0YLRgNC+0LnQutC4XCJdLFtcInBsYXlcIiwgXCJvcHRpb25zXCJdKTtcclxudmFyIGhlYWRlciA9IG5ldyBSZWN0KCAwLCAwLCBDLldJRFRILCA1MCtDLlBETkcsIFwiYmxhY2tcIiApO1xyXG52YXIgYlJlc3RhcnQgPSBuZXcgQnV0dG9uKCBDLldJRFRILTkwLTUsIGhlYWRlci5oLzItMSAtIDQwLzIsIDkwLCA0MCwgXCIjMzRCQUNBXCIsIFwiUmVzdGFydFwiLCBcInJlc3RhcnRcIiwgMjUgKTtcclxuXHJcbnZhciBwbCA9IG5ldyBSZWN0KEMuUERORyxDLlBETkcqMis1MCw1MCw1MCxcImJsYWNrXCIpOyAgLy/QuNCz0YDQvtC6XHJcbnZhciBib3ggPSBuZXcgUmVjdChDLlBETkcsQy5QRE5HKjIrNTAsNTAsNTAsXCJibHVlXCIpOyAvL9Cx0L7QutGBXHJcbnZhciBkb29yID0gbmV3IFJlY3QoQy5QRE5HLEMuUERORyoyKzUwLDUwLDUwLCBcInJnYmEoMjMxLCAyMywgMzIsIDAuOClcIik7IC8v0LTQstC10YDRjFxyXG52YXIgYmcgPSBuZXcgSW1hZ2UoXCJpbWcvcmVjdC1iZy5qcGdcIik7XHJcbnZhciB3YWxscyA9IFtdO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdG1hdHJpeCA6IG1hdHJpeCxcclxuXHRtZW51IDogbWVudSxcclxuXHRoZWFkZXIgOiBoZWFkZXIsXHJcblx0YlJlc3RhcnQgOiBiUmVzdGFydCxcclxuXHRwbCA6IHBsLFxyXG5cdGJveCA6IGJveCxcclxuXHRkb29yIDogZG9vcixcclxuXHRiZyA6IGJnLFxyXG5cdHdhbGxzIDogd2FsbHNcclxuXHJcbn07IiwidmFyIGNhbnZhcyA9IHJlcXVpcmUoJy4vLi4vX2NhbnZhcy5qcycpO1xyXG5cclxudmFyIGNudiA9IGNhbnZhcy5jbnY7XHJcbnZhciBjdHggPSBjYW52YXMuY3R4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b24gPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvciwgdHh0LCBuYW1lLCBmU2l6ZSl7XHJcbiAgXHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgdGhpcy50eHQgPSB0eHQ7XHJcbiAgdGhpcy5uYW1lID0gbmFtZTtcclxuICB0aGlzLmZTaXplID0gZlNpemU7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSBcIndoaXRlXCI7XHJcbiAgICBjdHgudGV4dEFsaWduPVwiY2VudGVyXCI7XHJcbiAgICBjdHguZm9udCA9IHRoaXMuZlNpemUgKyAncHggQXJpYWwnO1xyXG4gICAgY3R4LnRleHRCYXNlbGluZT1cIm1pZGRsZVwiOyBcclxuICAgIGN0eC5maWxsVGV4dCh0aGlzLnR4dCwgdGhpcy54K3RoaXMudy8yLCB0aGlzLnkrdGhpcy5oLzIpO1xyXG4gIH07XHJcblxyXG59OyIsInZhciBjYW52YXMgPSByZXF1aXJlKCcuLy4uL19jYW52YXMuanMnKTtcclxuXHJcbnZhciBjbnYgPSBjYW52YXMuY252O1xyXG52YXIgY3R4ID0gY2FudmFzLmN0eDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2UgPSBmdW5jdGlvbihzcmMpe1xyXG4gIHRoaXMuc3JjID0gc3JjO1xyXG4gIHRoaXMubG9hZGVkID0gZmFsc2U7XHJcblxyXG4gIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHJcbiAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcbiAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICBpbWcuc3JjID0gc3JjO1xyXG5cclxuICB0aGlzLmRvbSA9IGltZztcclxuXHJcbiAgdGhpcy5kcmF3SW1nID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICBpZiAoICF0aGlzLmxvYWRlZCApIHJldHVybjtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuZG9tLDAsMCk7XHJcblxyXG4gIH07XHJcbn07IiwidmFyIEMgPSByZXF1aXJlKCcuLy4uL19jb25zdC5qcycpO1xyXG52YXIgY2FudmFzID0gcmVxdWlyZSgnLi8uLi9fY2FudmFzLmpzJyk7XHJcblxyXG52YXIgY252ID0gY2FudmFzLmNudjtcclxudmFyIGN0eCA9IGNhbnZhcy5jdHg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3QgPSBmdW5jdGlvbih4LCB5LCB3LCBoLCBjb2xvcil7IC8v0LrQu9Cw0YHRgSDQutGD0LHQuNC6XHJcbiAgdGhpcy54ID0geDtcclxuICB0aGlzLnkgPSB5O1xyXG4gIHRoaXMudyA9IHc7XHJcbiAgdGhpcy5oID0gaDtcclxuICB0aGlzLmNvbG9yID0gY29sb3I7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gIH07XHJcbiAgXHJcbiAgdGhpcy5tb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uKXtcclxuICAgIHN3aXRjaChkaXJlY3Rpb24pe1xyXG4gICAgICBjYXNlIFwidXBcIiA6IFxyXG4gICAgICB0aGlzLnkgLT0gdGhpcy5oK0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJkb3duXCIgOiBcclxuICAgICAgdGhpcy55ICs9IHRoaXMuaCtDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwibGVmdFwiIDpcclxuICAgICAgdGhpcy54IC09IHRoaXMudytDLlBETkc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwicmlnaHRcIiA6IFxyXG4gICAgICB0aGlzLnggKz0gdGhpcy53K0MuUERORztcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yYW5kb21Qb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K0MuUERORykrQy5QRE5HO1xyXG4gICAgdGhpcy55ID0gZ2V0UmFuZG9tSW50KDIsOCkqKHRoaXMuaCtDLlBETkcpK0MuUERORztcclxuICB9O1xyXG59OyIsInZhciBnYW1lID0gcmVxdWlyZSgnLi9fZ2FtZUVuZ2luZS5qcycpLFxyXG4gICAgQnV0dG9uID0gcmVxdWlyZSgnLi9jbGFzc2VzL0J1dHRvbi5qcycpLFxyXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9SZWN0LmpzJyksXHJcbiAgICBJbWFnZSA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9JbWFnZS5qcycpLFxyXG4gICAgQyA9IHJlcXVpcmUoJy4vX2NvbnN0LmpzJyksXHJcbiAgICBvID0gcmVxdWlyZSgnLi9fb2JqZWN0cy5qcycpLFxyXG4gICAgZXZlbnRzID0gcmVxdWlyZSgnLi9fZXZlbnRzLmpzJyk7XHJcbiAgICBjYW52YXMgPSByZXF1aXJlKCcuL19jYW52YXMuanMnKTtcclxuXHJcbmdhbWUuZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5tZW51KTtcclxuIl19
