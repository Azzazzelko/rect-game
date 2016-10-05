var canvas = require('./../_canvas.js');

var cnv = canvas.cnv;
var ctx = canvas.ctx;

module.exports = Video = function(x, y, w, h, video){

  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.video = video;

  this.draw = function(){
    if (this.video) {
      this.video.play();
      canvas.ctx.drawImage(this.video, this.x, this.y, this.w, this.h);
    };
  };

};