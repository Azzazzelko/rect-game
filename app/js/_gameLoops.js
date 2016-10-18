var C         = require('./_const.js');
var o         = require('./_objects.js');
var hf        = require('./_helperFunctions.js');
var engin     = require('./_engine.js');
var res       = require('./_resourses.js');
var preloader = require('./_preloader.js');

var a = o.audio;

module.exports = gameLoops =  {

  loader : function(){

    gameLoops.status = "loader";

    preloader.updateLoader();
    preloader.drawLoader();
    preloader.drawLoadText();
    
    if ( res.resourses.areLoaded() ) engin.setGameEngine(gameLoops.menu);
  },

  game : function(){

    gameLoops.status = "game"; 

    if (a.bgInGame.state == "stop") a.bgInGame.play();

    //очистка области
    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    //отрисовка бг уровня
    o.bgLevel.draw();
    
    //отрисовка матричное поле игры
    for ( i in o.matrix ){
      o.matrix[i].draw();
    };

    //отрисовка стены\преграды
    for ( i in o.walls ){
      o.walls[i].draw();
    };

    //отрисовка хедера уровня
    o.header.draw();
    o.stopWatch.draw(1,10);
    o.bFullScr.draw();
    o.bPause.draw();
    o.currLevel.draw();

    //отрисовка игровых объектов
    o.door.draw();
    o.pl.draw();
    o.box.draw();

    //если победили
    if ( hf.isWin() ){
      o.bgOpacity.draw(); //отрисовка затемнения
      a.win.play();       //озвучка победки
      engin.setGameEngine(gameLoops.win);
    };
  },

  menu : function(){

    gameLoops.status = "menu";

    if (a.bgInMenu.state == "stop") a.bgInMenu.play();

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.animateBg.draw();

    o.logo.draw();

    for ( i in o.menu ){
      o.menu[i].draw();
    };
  },

  win : function(){

    gameLoops.status = "win";

    for ( i in o.winPopUp ){
      if ( o.winPopUp[i].name == "win_text" ) o.winPopUp[i].txt = "Уровень "+gameLoops.currentLevel;
      
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

    if (a.bgInMenu.state == "stop") a.bgInMenu.play();

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.videoBgLevels.draw();

    o.levelsHeader.draw();

    for ( i in o.bLevelsButtons ){
      o.bLevelsButtons[i].draw();
    };

    for ( i in o.levelsFooter ){
      if ( o.levelsFooter[i].name == "to_menu" ) o.levelsFooter[i].draw();
    };
  },

  options : function(){

    gameLoops.status = "options";

    if (a.bgInMenu.state == "stop") a.bgInMenu.play();

    hf.clearRect(0,0,C.WIDTH,C.HEIGHT);

    o.videoBgLevels.draw();

    o.optionsHeader.draw();
    o.optionsMusic.draw();

    for ( i in o.bOptions ){
      o.bOptions[i].draw();
    };
  },

  status : "",

  currentLevel : "1"

};
