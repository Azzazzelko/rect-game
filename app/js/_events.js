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
