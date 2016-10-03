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
    o.currLevel.draw();

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
      if ( o.winPopUp[i].name == "pop_next" && gameLoops.currentLevel == levels.lvlsCount() ) {
        continue;
      } else {
        o.winPopUp[i].draw();
      }  
    };
  },

  pause : function(){

    gameLoops.status = "pause";

    for ( i in o.pausePopUp ){
      o.pausePopUp[i].draw();
    };
  },

  levels : function(){

    gameLoops.status = "levels";

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.levelsHeader.draw();

    for ( i in o.bLevelsButtons ){
      o.bLevelsButtons[i].draw();
    };

    for ( i in o.levelsFooter ){
      o.levelsFooter[i].draw();
    };

  },

  status : "",

  currentLevel : "1"

};