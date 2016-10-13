var canvas = require('./_canvas.js');
var C = require('./_const.js');
	
var count    = 75;
var rotation = 270*(Math.PI/180);		
var speed    = 6;
	
module.exports = { 
  
 	updateLoader : function(){
 		canvas.ctx.save();
 		canvas.ctx.globalCompositeOperation = 'destination-out';
 		canvas.ctx.fillStyle = 'rgba(255,255,255,.035)';
 		canvas.ctx.fillRect(0,0,500,500);
 		rotation += speed/100;
 		canvas.ctx.restore();									
 	},

 	drawLoader : function(){							
 		canvas.ctx.save();
 		canvas.ctx.globalCompositeOperation = 'source-over';
 		canvas.ctx.translate(C.WIDTH/2, C.HEIGHT/2);
 		canvas.ctx.lineWidth = 0.25;
		canvas.ctx.strokeStyle = 'rgba(255,255,255,1.0)';
 		canvas.ctx.rotate(rotation);	
 		var i = count;
 		while(i--){								
 			canvas.ctx.beginPath();
 			canvas.ctx.arc(0, 0, i+(Math.random()*35), Math.random(), Math.PI/3+(Math.random()/12), false);								
 			canvas.ctx.stroke();
 		}	
 		canvas.ctx.restore();

 		canvas.ctx.save();
 		canvas.ctx.globalCompositeOperation = 'destination-over';
 		canvas.ctx.fillStyle = 'rgba(0,0,0,1)';
 		canvas.ctx.fillRect(0,0,C.WIDTH,C.HEIGHT);	
 		canvas.ctx.restore();										
 	},

 	drawLoadText : function(){
 		var winText = new Button( C.WIDTH/2-250/2, 25, 250, 40, "black", "Идет загрузка..", "load-text", 30, "Buccaneer" );
  		return winText.draw();
 	}
}; 

  