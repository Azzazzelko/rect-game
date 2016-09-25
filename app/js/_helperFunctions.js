var canvas = require('./_canvas.js');
var C = require('./_const.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = {

  clearRect : function(x,y,w,h){  //очиститель
    ctx.clearRect(x,y,w,h);
  },

  getRandomInt : function(min, max) { //функция для рандома целочисленного значения
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  isBorder : { //принимает объект, возвращает стоит ли с запрашиваеомй границы канвы
    up : function(obj){
      return obj.y == C.PDNG + obj.h + C.PDNG;
    },

    down : function(obj){
      return obj.y == C.HEIGHT - obj.h - C.PDNG;
    },

    left : function(obj){
      return obj.x == C.PDNG;
    },

    right : function(obj){
      return obj.x == C.WIDTH - obj.w - C.PDNG
    }
  }

};
