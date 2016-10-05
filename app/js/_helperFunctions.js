var canvas = require('./_canvas.js');
var o = require('./_objects.js');
var C = require('./_const.js');
var levels = require('./_levels.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = {

  clearRect : function(x,y,w,h){  //очиститель
    ctx.clearRect(x,y,w,h);
  },

  getRandomInt : function(min, max) { //функция для рандома целочисленного значения
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  isWin : function(){ //победили?
    return o.box.x == o.door.x && o.box.y == o.door.y;
  }
};
