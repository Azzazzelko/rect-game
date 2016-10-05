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

var isBorder = { //принимает объект, возвращает стоит ли с запрашиваеомй границы канвы
    up : function(obj){
      return obj.y == 0;
    },

    down : function(obj){
      return obj.y == C.HEIGHT - obj.h - C.PDNG - C.HEADER_H - C.PDNG;
    },

    left : function(obj){
      return obj.x == 0;
    },

    right : function(obj){
      return obj.x == C.WIDTH - obj.w - C.PDNG - C.PDNG
    }
};

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

  if ( isNear[direction](o.pl, o.box) && !isBorder[direction](o.box) && !isNear[direction](o.box, o.walls) ){ //если рядом с ящиком и ящик не у границ, двигаем.
    o.pl.move(direction);
    o.box.move(direction);
  } else if( !isNear[direction](o.pl, o.box) && !isBorder[direction](o.pl) && !isNear[direction](o.pl, o.walls) ){ //если не рядом с ящиком и не рядом с границей, двигаемся.
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
  engin.gameEngineStart(gameLoops.game);
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
        engin.gameEngineStart(gameLoops.game);
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
