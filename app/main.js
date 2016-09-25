
var cnv = document.getElementById("canvas");
var ctx = cnv.getContext("2d");

var width = 500; //ширина канвы
var height = 555; //высота канвы

var padd = 5; //паддинг, который я хочу чтобы был, меж квадратами

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
    matrix.push( new Rect(5+j*55, 5+i*55, 50, 50, "#FEA3A3") );
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
var header = new Rect( 0, 0, width, 55, "black" );
var bRestart = new Button( width-90-5, 7, 90, 40, "#34BACA", "Restart", "restart", 25 );

var pl = new Rect(padd,60,50,50,"black");  //игрок
var box = new Rect(padd,60,50,50,"blue"); //бокс
var door = new Rect(padd,60,50,50, "rgba(231, 23, 32, 0.8)"); //дверь

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
      _walls.push( new Rect(5+arr[i][1]*55, 5+arr[i][0]*55, 50, 50, "#622DD1") );
    };

    box.x = 5+2*55;
    box.y = 5+8*55;

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




