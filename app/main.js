
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

var Button = function(x, y, w, h, color, txt){
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = color;
  this.txt = txt;
};
Button.prototype = {

  draw : function(){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "white";
    ctx.textAlign="center";
    ctx.font = '30px Arial';
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


function createMenu(txtArr){  //создаем главное меню

  var menu = [];
  var txt = txtArr;
  var amounts = txtArr.length;
  
  var _height = (height/2) - (75*amounts/2); 
  var _width = width/2-200/2;

  for (var i = 0; i < amounts; i++){
    menu.push( new Button( _width , _height+i*75 , 200, 50, "black", txt[i]) );
  };

  return menu;

};

var menu = createMenu(["Играть","Настройки"]);

var pl = new Rect(padd,60,50,50,"black");  //игрок
var box = new Rect(padd,60,50,50,"blue"); //бокс
var door = new Rect(padd,60,50,50, "rgba(231, 23, 32, 0.8)"); //дверь

door.randomPosition = function(){ //Рандомит позицию двери
  door.x = getRandomInt(1,7)*(door.w+padd)+padd;
  door.y = getRandomInt(2,8)*(door.h+padd)+padd;
};

box.randomPosition = function(){ //Рандомит позицию бокса
  box.x = getRandomInt(1,7)*(box.w+padd)+padd;
  box.y = getRandomInt(2,8)*(box.h+padd)+padd;
};

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


box.randomPosition();  //рандомим позицию бокса
door.randomPosition(); //рандомим позицию двери


var gameLoops = {

  plLevel : function(){

    for ( i in matrix ){
      matrix[i].draw();
    };

    clearRect(0,0,width,55);

    pl.draw();

    box.draw();

    door.draw();

    if ( box.x == door.x && box.y == door.y ){
      console.log("WIN!");

      box.randomPosition();
      door.randomPosition();

      game.gameEngineStart(gameLoops.plLevel);
    };

  },

  menu : function(){

    clearRect(0,0,width,height);

    for ( i in menu ){
      menu[i].draw();
    };

  }

};

game.gameEngineStart(gameLoops.menu);
