(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var cnv = document.getElementById("canvas");
var ctx = cnv.getContext("2d");

var padd = 1; //паддинг, который я хочу чтобы был, меж квадратами
var width = padd + (padd+50)*9; //ширина канвы
var height = padd + (padd+50)*10; //высота канвы

cnv.style.border = "2px solid black";
cnv.style.backgroundColor = "white";
cnv.width = width;
cnv.height = height;

var game = {   //кросбраузерная ф-ция для упрвления циклами игры

  nextGameStep : (function(){
    return requestAnimationFrame ||
    webkitRequestAnimationFrame ||
    mozRequestAnimationFrame ||
    oRequestAnimationFrame ||
    msRequestAnimationFrame ||
    function (callback){
      setInterval(callback, 1000/60)
    };
  })(),
  
  gameEngineStart : function (callback){
    gameEngine = callback;
    this.gameEngineStep();
  },
  
  gameEngineStep : function(){
    gameEngine();
    game.nextGameStep.call(window, game.gameEngineStep);
  },
  
  setGameEngine : function(){
    gameEngine = callback;
  }
  
};

var Button = function(x, y, w, h, color, txt, name, fSize){
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = color;
  this.txt = txt;
  this.name = name;
  this.fSize = fSize;
};
Button.prototype = {

  draw : function(){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "white";
    ctx.textAlign="center";
    ctx.font = this.fSize + 'px Arial';
    ctx.textBaseline="middle"; 
    ctx.fillText(this.txt, this.x+this.w/2, this.y+this.h/2);
  }

};

var Rect = function(x, y, w, h, color){ //класс кубик
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = color;
};
Rect.prototype = { //функции для нашего класса-кубик

  draw : function(){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  },
  
  move : function(direction){

    switch(direction){
      case "up" : 
      this.y -= this.h+padd;
      break;
      case "down" : 
      this.y += this.h+padd;
      break;
      case "left" :
      this.x -= this.w+padd;
      break;
      case "right" : 
      this.x += this.w+padd;
      break;
    }

  },

  randomPosition : function(){
    this.x = getRandomInt(1,7)*(this.w+padd)+padd;
    this.y = getRandomInt(2,8)*(this.h+padd)+padd;
  }
  
};

function clearRect(x,y,w,h){  //очиститель
  ctx.clearRect(x,y,w,h);
};

function getRandomInt(min, max) { //функция для рандома целочисленного значения
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var matrix = []; //массив для матричного вида уровня

for (var i = 0; i < 10; i++){ //заполняем объект
  for (var j = 0; j < 9; j++){
    matrix.push( new Rect(padd+j*(50+padd), padd+i*(50+padd), 50, 50, "#FEA3A3") );
  }
};


function createMenu(txtArr, nameArr){  //создаем главное меню

  var menu = [];
  var names = nameArr;
  var txt = txtArr;
  var amounts = txtArr.length;
  
  var _height = (height/2) - (75*amounts/2); 
  var _width = width/2-200/2;

  for (var i = 0; i < amounts; i++){
    menu.push( new Button( _width , _height+i*75 , 200, 50, "black", txt[i], names[i], 30 ) );
  };

  return menu;

};

var menu = createMenu(["Играть","Настройки"],["play", "options"]);
var header = new Rect( 0, 0, width, 50+padd, "black" );
var bRestart = new Button( width-90-5, header.h/2-1 - 40/2, 90, 40, "#34BACA", "Restart", "restart", 25 );

var pl = new Rect(padd,padd*2+50,50,50,"black");  //игрок
var box = new Rect(padd,padd*2+50,50,50,"blue"); //бокс
var door = new Rect(padd,padd*2+50,50,50, "rgba(231, 23, 32, 0.8)"); //дверь

var isBorder = { //принимает объект, возвращает стоит ли с запрашиваеомй границы канвы

  up : function(obj){
    return obj.y == padd + obj.h + padd;
  },
  
  down : function(obj){
    return obj.y == height - obj.h - padd;
  },
  
  left : function(obj){
    return obj.x == padd;
  },
  
  right : function(obj){
    return obj.x == width - obj.w - padd
  }
  
}; 

var isNear = { //принимает 2 объекта, возвращает стоит ли с запрашиваемой стороны 1ый от 2го.

  up : function(obj_1, obj_2){
    return obj_2.y + obj_2.w + padd == obj_1.y && obj_1.x == obj_2.x;
  },
  
  down : function(obj_1, obj_2){
    return obj_1.y + obj_1.w + padd == obj_2.y && obj_1.x == obj_2.x;
  },
  
  left : function(obj_1, obj_2){
    return obj_2.x + obj_2.w + padd == obj_1.x && obj_1.y == obj_2.y;
  },
  
  right : function(obj_1, obj_2){
    return obj_1.x + obj_1.w + padd == obj_2.x && obj_1.y == obj_2.y;
  }
  
}; 

function moveRects(direction){  //разрешает движение в пределах уровня

  if ( isNear[direction](pl, box) && !isBorder[direction](box)){ 
    pl.move(direction);
    box.move(direction);
  } else if( !isNear[direction](pl, box) && !isBorder[direction](pl) ){
    pl.move(direction);
  }

};

window.onkeydown = function(e){ //события клацанья

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

  for ( i in menu ){
    if( isCursorInButton(x,y,menu[i]) ){
      if ( menu[i].name == "play" ){
        levels[1]();  
        game.gameEngineStart(gameLoops.plLevel);
      };
    };
  };

  if( isCursorInButton(x,y,bRestart) ){
    levels[1]();  
    game.gameEngineStart(gameLoops.plLevel);
  };

};

function isCursorInButton(x,y,but){

  return x >= but.x && 
  x <= but.x+but.w && 
  y >= but.y && 
  y <= but.y+but.h

};


var Image = function(src){
  this.src = src;
  this.loaded = false;

  var img = document.createElement('img');

  img.onload = function(){
    this.loaded = true;
  }.bind(this);

  img.src = src;

  this.dom = img;
};

Image.prototype = {

  drawImg : function(){

    if ( !this.loaded ) return;

    ctx.drawImage(this.dom,0,0);

  }

};

var bg = new Image("img/rect-bg.jpg");

var walls = [];

var levels = {

  1 : function(){

    var _walls = [];
    var arr = [
    [2,3],[2,4],[2,5],[2,6],[3,0],[3,6],[3,8],[4,2],[5,1],[5,2],[5,3],[5,7],[6,4],[7,4],[7,6],[8,0],[8,1],[8,8],[9,0],[9,4],[9,5]
    ];

    for (var i = 0; i < arr.length; i++){ 
      _walls.push( new Rect(padd+arr[i][1]*(50+padd), padd+arr[i][0]*(50+padd), 50, 50, "#622DD1") );
    };

    box.x = padd+2*(50+padd);
    box.y = padd+8*(50+padd);

    walls = _walls;

  }

};

var gameLoops = {

  plLevel : function(){

    clearRect(0,0,width,height);

    for ( i in matrix ){
      matrix[i].draw();
    };

    for ( i in walls ){
      walls[i].draw();
    };

    header.draw();
    bRestart.draw();

    pl.draw();
    box.draw();
    door.draw();

    if ( box.x == door.x && box.y == door.y ){
      console.log("WIN!");

      game.gameEngineStart(gameLoops.menu);
    };

  },

  menu : function(){

    clearRect(0,0,width,height);

    bg.drawImg();

    for ( i in menu ){
      menu[i].draw();
    };

  }

};

game.gameEngineStart(gameLoops.menu);





},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkI6XFxPcGVuU291cmNlXFxPcGVuU2VydmVyXFxkb21haW5zXFxsb2NhbGhvc3RcXHJlY3QtZ2FtZVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQjovT3BlblNvdXJjZS9PcGVuU2VydmVyL2RvbWFpbnMvbG9jYWxob3N0L3JlY3QtZ2FtZS9hcHAvanMvZmFrZV9jNjVkNmMxNS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHJcbnZhciBjbnYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxudmFyIGN0eCA9IGNudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG52YXIgcGFkZCA9IDE7IC8v0L/QsNC00LTQuNC90LMsINC60L7RgtC+0YDRi9C5INGPINGF0L7Rh9GDINGH0YLQvtCx0Ysg0LHRi9C7LCDQvNC10LYg0LrQstCw0LTRgNCw0YLQsNC80LhcclxudmFyIHdpZHRoID0gcGFkZCArIChwYWRkKzUwKSo5OyAvL9GI0LjRgNC40L3QsCDQutCw0L3QstGLXHJcbnZhciBoZWlnaHQgPSBwYWRkICsgKHBhZGQrNTApKjEwOyAvL9Cy0YvRgdC+0YLQsCDQutCw0L3QstGLXHJcblxyXG5jbnYuc3R5bGUuYm9yZGVyID0gXCIycHggc29saWQgYmxhY2tcIjtcclxuY252LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcclxuY252LndpZHRoID0gd2lkdGg7XHJcbmNudi5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG52YXIgZ2FtZSA9IHsgICAvL9C60YDQvtGB0LHRgNCw0YPQt9C10YDQvdCw0Y8g0YQt0YbQuNGPINC00LvRjyDRg9C/0YDQstC70LXQvdC40Y8g0YbQuNC60LvQsNC80Lgg0LjQs9GA0YtcclxuXHJcbiAgbmV4dEdhbWVTdGVwIDogKGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICB3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICAgIG1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG4gICAgb1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG4gICAgbXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICAgIGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcbiAgICAgIHNldEludGVydmFsKGNhbGxiYWNrLCAxMDAwLzYwKVxyXG4gICAgfTtcclxuICB9KSgpLFxyXG4gIFxyXG4gIGdhbWVFbmdpbmVTdGFydCA6IGZ1bmN0aW9uIChjYWxsYmFjayl7XHJcbiAgICBnYW1lRW5naW5lID0gY2FsbGJhY2s7XHJcbiAgICB0aGlzLmdhbWVFbmdpbmVTdGVwKCk7XHJcbiAgfSxcclxuICBcclxuICBnYW1lRW5naW5lU3RlcCA6IGZ1bmN0aW9uKCl7XHJcbiAgICBnYW1lRW5naW5lKCk7XHJcbiAgICBnYW1lLm5leHRHYW1lU3RlcC5jYWxsKHdpbmRvdywgZ2FtZS5nYW1lRW5naW5lU3RlcCk7XHJcbiAgfSxcclxuICBcclxuICBzZXRHYW1lRW5naW5lIDogZnVuY3Rpb24oKXtcclxuICAgIGdhbWVFbmdpbmUgPSBjYWxsYmFjaztcclxuICB9XHJcbiAgXHJcbn07XHJcblxyXG52YXIgQnV0dG9uID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IsIHR4dCwgbmFtZSwgZlNpemUpe1xyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gIHRoaXMudHh0ID0gdHh0O1xyXG4gIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgdGhpcy5mU2l6ZSA9IGZTaXplO1xyXG59O1xyXG5CdXR0b24ucHJvdG90eXBlID0ge1xyXG5cclxuICBkcmF3IDogZnVuY3Rpb24oKXtcclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IFwid2hpdGVcIjtcclxuICAgIGN0eC50ZXh0QWxpZ249XCJjZW50ZXJcIjtcclxuICAgIGN0eC5mb250ID0gdGhpcy5mU2l6ZSArICdweCBBcmlhbCc7XHJcbiAgICBjdHgudGV4dEJhc2VsaW5lPVwibWlkZGxlXCI7IFxyXG4gICAgY3R4LmZpbGxUZXh0KHRoaXMudHh0LCB0aGlzLngrdGhpcy53LzIsIHRoaXMueSt0aGlzLmgvMik7XHJcbiAgfVxyXG5cclxufTtcclxuXHJcbnZhciBSZWN0ID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IpeyAvL9C60LvQsNGB0YEg0LrRg9Cx0LjQulxyXG4gIHRoaXMueCA9IHg7XHJcbiAgdGhpcy55ID0geTtcclxuICB0aGlzLncgPSB3O1xyXG4gIHRoaXMuaCA9IGg7XHJcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG59O1xyXG5SZWN0LnByb3RvdHlwZSA9IHsgLy/RhNGD0L3QutGG0LjQuCDQtNC70Y8g0L3QsNGI0LXQs9C+INC60LvQsNGB0YHQsC3QutGD0LHQuNC6XHJcblxyXG4gIGRyYXcgOiBmdW5jdGlvbigpe1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICB9LFxyXG4gIFxyXG4gIG1vdmUgOiBmdW5jdGlvbihkaXJlY3Rpb24pe1xyXG5cclxuICAgIHN3aXRjaChkaXJlY3Rpb24pe1xyXG4gICAgICBjYXNlIFwidXBcIiA6IFxyXG4gICAgICB0aGlzLnkgLT0gdGhpcy5oK3BhZGQ7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiZG93blwiIDogXHJcbiAgICAgIHRoaXMueSArPSB0aGlzLmgrcGFkZDtcclxuICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJsZWZ0XCIgOlxyXG4gICAgICB0aGlzLnggLT0gdGhpcy53K3BhZGQ7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwicmlnaHRcIiA6IFxyXG4gICAgICB0aGlzLnggKz0gdGhpcy53K3BhZGQ7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICByYW5kb21Qb3NpdGlvbiA6IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnggPSBnZXRSYW5kb21JbnQoMSw3KSoodGhpcy53K3BhZGQpK3BhZGQ7XHJcbiAgICB0aGlzLnkgPSBnZXRSYW5kb21JbnQoMiw4KSoodGhpcy5oK3BhZGQpK3BhZGQ7XHJcbiAgfVxyXG4gIFxyXG59O1xyXG5cclxuZnVuY3Rpb24gY2xlYXJSZWN0KHgseSx3LGgpeyAgLy/QvtGH0LjRgdGC0LjRgtC10LvRjFxyXG4gIGN0eC5jbGVhclJlY3QoeCx5LHcsaCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZXRSYW5kb21JbnQobWluLCBtYXgpIHsgLy/RhNGD0L3QutGG0LjRjyDQtNC70Y8g0YDQsNC90LTQvtC80LAg0YbQtdC70L7Rh9C40YHQu9C10L3QvdC+0LPQviDQt9C90LDRh9C10L3QuNGPXHJcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbn07XHJcblxyXG52YXIgbWF0cml4ID0gW107IC8v0LzQsNGB0YHQuNCyINC00LvRjyDQvNCw0YLRgNC40YfQvdC+0LPQviDQstC40LTQsCDRg9GA0L7QstC90Y9cclxuXHJcbmZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKyl7IC8v0LfQsNC/0L7Qu9C90Y/QtdC8INC+0LHRitC10LrRglxyXG4gIGZvciAodmFyIGogPSAwOyBqIDwgOTsgaisrKXtcclxuICAgIG1hdHJpeC5wdXNoKCBuZXcgUmVjdChwYWRkK2oqKDUwK3BhZGQpLCBwYWRkK2kqKDUwK3BhZGQpLCA1MCwgNTAsIFwiI0ZFQTNBM1wiKSApO1xyXG4gIH1cclxufTtcclxuXHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNZW51KHR4dEFyciwgbmFtZUFycil7ICAvL9GB0L7Qt9C00LDQtdC8INCz0LvQsNCy0L3QvtC1INC80LXQvdGOXHJcblxyXG4gIHZhciBtZW51ID0gW107XHJcbiAgdmFyIG5hbWVzID0gbmFtZUFycjtcclxuICB2YXIgdHh0ID0gdHh0QXJyO1xyXG4gIHZhciBhbW91bnRzID0gdHh0QXJyLmxlbmd0aDtcclxuICBcclxuICB2YXIgX2hlaWdodCA9IChoZWlnaHQvMikgLSAoNzUqYW1vdW50cy8yKTsgXHJcbiAgdmFyIF93aWR0aCA9IHdpZHRoLzItMjAwLzI7XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYW1vdW50czsgaSsrKXtcclxuICAgIG1lbnUucHVzaCggbmV3IEJ1dHRvbiggX3dpZHRoICwgX2hlaWdodCtpKjc1ICwgMjAwLCA1MCwgXCJibGFja1wiLCB0eHRbaV0sIG5hbWVzW2ldLCAzMCApICk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1lbnU7XHJcblxyXG59O1xyXG5cclxudmFyIG1lbnUgPSBjcmVhdGVNZW51KFtcItCY0LPRgNCw0YLRjFwiLFwi0J3QsNGB0YLRgNC+0LnQutC4XCJdLFtcInBsYXlcIiwgXCJvcHRpb25zXCJdKTtcclxudmFyIGhlYWRlciA9IG5ldyBSZWN0KCAwLCAwLCB3aWR0aCwgNTArcGFkZCwgXCJibGFja1wiICk7XHJcbnZhciBiUmVzdGFydCA9IG5ldyBCdXR0b24oIHdpZHRoLTkwLTUsIGhlYWRlci5oLzItMSAtIDQwLzIsIDkwLCA0MCwgXCIjMzRCQUNBXCIsIFwiUmVzdGFydFwiLCBcInJlc3RhcnRcIiwgMjUgKTtcclxuXHJcbnZhciBwbCA9IG5ldyBSZWN0KHBhZGQscGFkZCoyKzUwLDUwLDUwLFwiYmxhY2tcIik7ICAvL9C40LPRgNC+0LpcclxudmFyIGJveCA9IG5ldyBSZWN0KHBhZGQscGFkZCoyKzUwLDUwLDUwLFwiYmx1ZVwiKTsgLy/QsdC+0LrRgVxyXG52YXIgZG9vciA9IG5ldyBSZWN0KHBhZGQscGFkZCoyKzUwLDUwLDUwLCBcInJnYmEoMjMxLCAyMywgMzIsIDAuOClcIik7IC8v0LTQstC10YDRjFxyXG5cclxudmFyIGlzQm9yZGVyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiDQvtCx0YrQtdC60YIsINCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLQvtC40YIg0LvQuCDRgSDQt9Cw0L/RgNCw0YjQuNCy0LDQtdC+0LzQuSDQs9GA0LDQvdC40YbRiyDQutCw0L3QstGLXHJcblxyXG4gIHVwIDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueSA9PSBwYWRkICsgb2JqLmggKyBwYWRkO1xyXG4gIH0sXHJcbiAgXHJcbiAgZG93biA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnkgPT0gaGVpZ2h0IC0gb2JqLmggLSBwYWRkO1xyXG4gIH0sXHJcbiAgXHJcbiAgbGVmdCA6IGZ1bmN0aW9uKG9iail7XHJcbiAgICByZXR1cm4gb2JqLnggPT0gcGFkZDtcclxuICB9LFxyXG4gIFxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqKXtcclxuICAgIHJldHVybiBvYmoueCA9PSB3aWR0aCAtIG9iai53IC0gcGFkZFxyXG4gIH1cclxuICBcclxufTsgXHJcblxyXG52YXIgaXNOZWFyID0geyAvL9C/0YDQuNC90LjQvNCw0LXRgiAyINC+0LHRitC10LrRgtCwLCDQstC+0LfQstGA0LDRidCw0LXRgiDRgdGC0L7QuNGCINC70Lgg0YEg0LfQsNC/0YDQsNGI0LjQstCw0LXQvNC+0Lkg0YHRgtC+0YDQvtC90YsgMdGL0Lkg0L7RgiAy0LPQvi5cclxuXHJcbiAgdXAgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgcmV0dXJuIG9ial8yLnkgKyBvYmpfMi53ICsgcGFkZCA9PSBvYmpfMS55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG4gIFxyXG4gIGRvd24gOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgcmV0dXJuIG9ial8xLnkgKyBvYmpfMS53ICsgcGFkZCA9PSBvYmpfMi55ICYmIG9ial8xLnggPT0gb2JqXzIueDtcclxuICB9LFxyXG4gIFxyXG4gIGxlZnQgOiBmdW5jdGlvbihvYmpfMSwgb2JqXzIpe1xyXG4gICAgcmV0dXJuIG9ial8yLnggKyBvYmpfMi53ICsgcGFkZCA9PSBvYmpfMS54ICYmIG9ial8xLnkgPT0gb2JqXzIueTtcclxuICB9LFxyXG4gIFxyXG4gIHJpZ2h0IDogZnVuY3Rpb24ob2JqXzEsIG9ial8yKXtcclxuICAgIHJldHVybiBvYmpfMS54ICsgb2JqXzEudyArIHBhZGQgPT0gb2JqXzIueCAmJiBvYmpfMS55ID09IG9ial8yLnk7XHJcbiAgfVxyXG4gIFxyXG59OyBcclxuXHJcbmZ1bmN0aW9uIG1vdmVSZWN0cyhkaXJlY3Rpb24peyAgLy/RgNCw0LfRgNC10YjQsNC10YIg0LTQstC40LbQtdC90LjQtSDQsiDQv9GA0LXQtNC10LvQsNGFINGD0YDQvtCy0L3Rj1xyXG5cclxuICBpZiAoIGlzTmVhcltkaXJlY3Rpb25dKHBsLCBib3gpICYmICFpc0JvcmRlcltkaXJlY3Rpb25dKGJveCkpeyBcclxuICAgIHBsLm1vdmUoZGlyZWN0aW9uKTtcclxuICAgIGJveC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfSBlbHNlIGlmKCAhaXNOZWFyW2RpcmVjdGlvbl0ocGwsIGJveCkgJiYgIWlzQm9yZGVyW2RpcmVjdGlvbl0ocGwpICl7XHJcbiAgICBwbC5tb3ZlKGRpcmVjdGlvbik7XHJcbiAgfVxyXG5cclxufTtcclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbihlKXsgLy/RgdC+0LHRi9GC0LjRjyDQutC70LDRhtCw0L3RjNGPXHJcblxyXG4gIGlmICggZS5rZXkgPT0gXCJkXCIgfHwgZS5rZXkgPT0gXCJBcnJvd1JpZ2h0XCIgKSAgXHJcbiAgICBtb3ZlUmVjdHMoXCJyaWdodFwiKTtcclxuXHJcbiAgaWYgKCBlLmtleSA9PSBcInNcIiB8fCBlLmtleSA9PSBcIkFycm93RG93blwiICkgIFxyXG4gICAgbW92ZVJlY3RzKFwiZG93blwiKTtcclxuXHJcbiAgaWYgKCBlLmtleSA9PSBcIndcIiB8fCBlLmtleSA9PSBcIkFycm93VXBcIiApXHJcbiAgICBtb3ZlUmVjdHMoXCJ1cFwiKTtcclxuXHJcbiAgaWYgKCBlLmtleSA9PSBcImFcIiB8fCBlLmtleSA9PSBcIkFycm93TGVmdFwiIClcclxuICAgIG1vdmVSZWN0cyhcImxlZnRcIik7XHJcbiAgXHJcbn07XHJcblxyXG53aW5kb3cub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKXtcclxuXHJcbiAgdmFyIHggPSBlLnBhZ2VYLTEwO1xyXG4gIHZhciB5ID0gZS5wYWdlWS0xMDtcclxuXHJcbiAgZm9yICggaSBpbiBtZW51ICl7XHJcbiAgICBpZiggaXNDdXJzb3JJbkJ1dHRvbih4LHksbWVudVtpXSkgKXtcclxuICAgICAgaWYgKCBtZW51W2ldLm5hbWUgPT0gXCJwbGF5XCIgKXtcclxuICAgICAgICBsZXZlbHNbMV0oKTsgIFxyXG4gICAgICAgIGdhbWUuZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wbExldmVsKTtcclxuICAgICAgfTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgaWYoIGlzQ3Vyc29ySW5CdXR0b24oeCx5LGJSZXN0YXJ0KSApe1xyXG4gICAgbGV2ZWxzWzFdKCk7ICBcclxuICAgIGdhbWUuZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5wbExldmVsKTtcclxuICB9O1xyXG5cclxufTtcclxuXHJcbmZ1bmN0aW9uIGlzQ3Vyc29ySW5CdXR0b24oeCx5LGJ1dCl7XHJcblxyXG4gIHJldHVybiB4ID49IGJ1dC54ICYmIFxyXG4gIHggPD0gYnV0LngrYnV0LncgJiYgXHJcbiAgeSA+PSBidXQueSAmJiBcclxuICB5IDw9IGJ1dC55K2J1dC5oXHJcblxyXG59O1xyXG5cclxuXHJcbnZhciBJbWFnZSA9IGZ1bmN0aW9uKHNyYyl7XHJcbiAgdGhpcy5zcmMgPSBzcmM7XHJcbiAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcclxuXHJcbiAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG5cclxuICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxuICB9LmJpbmQodGhpcyk7XHJcblxyXG4gIGltZy5zcmMgPSBzcmM7XHJcblxyXG4gIHRoaXMuZG9tID0gaW1nO1xyXG59O1xyXG5cclxuSW1hZ2UucHJvdG90eXBlID0ge1xyXG5cclxuICBkcmF3SW1nIDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICBpZiAoICF0aGlzLmxvYWRlZCApIHJldHVybjtcclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuZG9tLDAsMCk7XHJcblxyXG4gIH1cclxuXHJcbn07XHJcblxyXG52YXIgYmcgPSBuZXcgSW1hZ2UoXCJpbWcvcmVjdC1iZy5qcGdcIik7XHJcblxyXG52YXIgd2FsbHMgPSBbXTtcclxuXHJcbnZhciBsZXZlbHMgPSB7XHJcblxyXG4gIDEgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIHZhciBfd2FsbHMgPSBbXTtcclxuICAgIHZhciBhcnIgPSBbXHJcbiAgICBbMiwzXSxbMiw0XSxbMiw1XSxbMiw2XSxbMywwXSxbMyw2XSxbMyw4XSxbNCwyXSxbNSwxXSxbNSwyXSxbNSwzXSxbNSw3XSxbNiw0XSxbNyw0XSxbNyw2XSxbOCwwXSxbOCwxXSxbOCw4XSxbOSwwXSxbOSw0XSxbOSw1XVxyXG4gICAgXTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7IFxyXG4gICAgICBfd2FsbHMucHVzaCggbmV3IFJlY3QocGFkZCthcnJbaV1bMV0qKDUwK3BhZGQpLCBwYWRkK2FycltpXVswXSooNTArcGFkZCksIDUwLCA1MCwgXCIjNjIyREQxXCIpICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGJveC54ID0gcGFkZCsyKig1MCtwYWRkKTtcclxuICAgIGJveC55ID0gcGFkZCs4Kig1MCtwYWRkKTtcclxuXHJcbiAgICB3YWxscyA9IF93YWxscztcclxuXHJcbiAgfVxyXG5cclxufTtcclxuXHJcbnZhciBnYW1lTG9vcHMgPSB7XHJcblxyXG4gIHBsTGV2ZWwgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGNsZWFyUmVjdCgwLDAsd2lkdGgsaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKCBpIGluIG1hdHJpeCApe1xyXG4gICAgICBtYXRyaXhbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKCBpIGluIHdhbGxzICl7XHJcbiAgICAgIHdhbGxzW2ldLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG4gICAgaGVhZGVyLmRyYXcoKTtcclxuICAgIGJSZXN0YXJ0LmRyYXcoKTtcclxuXHJcbiAgICBwbC5kcmF3KCk7XHJcbiAgICBib3guZHJhdygpO1xyXG4gICAgZG9vci5kcmF3KCk7XHJcblxyXG4gICAgaWYgKCBib3gueCA9PSBkb29yLnggJiYgYm94LnkgPT0gZG9vci55ICl7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiV0lOIVwiKTtcclxuXHJcbiAgICAgIGdhbWUuZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5tZW51KTtcclxuICAgIH07XHJcblxyXG4gIH0sXHJcblxyXG4gIG1lbnUgOiBmdW5jdGlvbigpe1xyXG5cclxuICAgIGNsZWFyUmVjdCgwLDAsd2lkdGgsaGVpZ2h0KTtcclxuXHJcbiAgICBiZy5kcmF3SW1nKCk7XHJcblxyXG4gICAgZm9yICggaSBpbiBtZW51ICl7XHJcbiAgICAgIG1lbnVbaV0uZHJhdygpO1xyXG4gICAgfTtcclxuXHJcbiAgfVxyXG5cclxufTtcclxuXHJcbmdhbWUuZ2FtZUVuZ2luZVN0YXJ0KGdhbWVMb29wcy5tZW51KTtcclxuXHJcblxyXG5cclxuXHJcbiJdfQ==
