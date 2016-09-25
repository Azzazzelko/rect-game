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