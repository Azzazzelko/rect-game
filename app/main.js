
var cnv = document.getElementById("canvas");
var ctx = cnv.getContext("2d");

var width = 500; //ширина канвы
var height = 555; //выоста канвы

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
    matrix.push( new Rect(5+j*55, 5+i*55, 50, 50, "red") );
  }
}

var pl = new Rect(padd,60,50,50,"black");  //игрок
var door = new Rect(padd,60,50,50,"blue"); //бокс

door.randomDoorPosition = function(){ //Рандомит позицию бокса
  door.x = getRandomInt(1,7)*(door.w+padd)+padd;
  door.y = getRandomInt(2,8)*(door.h+padd)+padd;
};

var isBorder = {
  
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
  
}; //принимает объект, возвращает стоит ли с запрашиваеомй границы канвы

var isNear = {
  
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
  
}; //принимает 2 объекта, возвращает стоит ли с запрашиваемой стороны 1ый от 2го.

window.onkeydown = function(e){ //события клацанья
  if ( e.key == "d" || e.key == "ArrowRight" ) {
    
    if ( isNear.right(pl, door) && !isBorder.right(door)){ 
      pl.move("right");
      door.move("right");
    } else if( !isNear.right(pl, door) && !isBorder.right(pl) ){
      pl.move("right");
    } 
   
  }
  if ( e.key == "s" || e.key == "ArrowDown" ) {
    
    if ( isNear.down(pl, door) && !isBorder.down(door)){
      pl.move("down");
      door.move("down");
    } else if( !isNear.down(pl, door) && !isBorder.down(pl) ){
      pl.move("down");
    } 
    
  }
  if ( e.key == "w" || e.key == "ArrowUp" ) {
    
    if ( isNear.up(pl, door) && !isBorder.up(door)){
      pl.move("up");
      door.move("up");
    } else if( !isNear.up(pl, door) && !isBorder.up(pl) ){
      pl.move("up");
    } 

  }
  if ( e.key == "a" || e.key == "ArrowLeft" ) {
    
    if ( isNear.left(pl, door) && !isBorder.left(door)){
      pl.move("left");
      door.move("left");
    } else if( !isNear.left(pl, door) && !isBorder.left(pl) ){
      pl.move("left");
    } 
    
  }
}

door.randomDoorPosition(); //рандомим позицию бокса

game.gameEngineStart(function(){
  
  for ( i in matrix ){
    matrix[i].draw();
  }
  
  clearRect(0,0,width,55);
  
  pl.draw();

  door.draw();
  
});
