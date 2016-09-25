var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Button = function(x, y, w, h, color, txt, name, fSize){
  
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = color;
  this.txt = txt;
  this.name = name;
  this.fSize = fSize;

  this.draw = function(){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "white";
    ctx.textAlign="center";
    ctx.font = this.fSize + 'px Arial';
    ctx.textBaseline="middle"; 
    ctx.fillText(this.txt, this.x+this.w/2, this.y+this.h/2);
  };

};