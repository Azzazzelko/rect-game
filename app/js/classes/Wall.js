var C = require('./../_const.js');
var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Wall = function(img, x, y, w, h){ //класс кубик
  this.img = img;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  this.draw = function(){
    ctx.save();
    ctx.translate(C.PDNG, 71+C.PDNG);
    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    ctx.restore();
  };
  
  this.randomPosition = function(){
    this.x = getRandomInt(1,7)*(this.w+C.PDNG)+C.PDNG;
    this.y = getRandomInt(2,8)*(this.h+C.PDNG)+C.PDNG;
  };

  this.setPosition = function(x,y){
    this.x = x;
    this.y = y;
  };

};