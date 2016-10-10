var canvas = require('./_canvas.js');
var C = require('./_const.js');

var zoom = 0;

function fullCanvas(){

	var deviceWidth = window.screen.availWidth;
	var deviceHeight = window.screen.availHeight;
	zoom = (deviceHeight / C.HEIGHT).toFixed(1);

	canvas.cnv.width = canvas.cnv.width*zoom;
	canvas.cnv.height = canvas.cnv.height*zoom;
	canvas.ctx.scale(zoom,zoom);
};

function normalCanvas(){
	canvas.cnv.width = canvas.cnv.width/zoom;
	canvas.cnv.height = canvas.cnv.height/zoom;
	canvas.ctx.scale(1,1);
};

module.exports = { 

	launchFullScreen : function(elem){

		if ( elem.requestFullScreen ){
			elem.requestFullScreen();
		} else if ( elem.mozRequestFullScreen ){
			elem.mozRequstFullScreen();
		} else if ( elem.webkitRequestFullScreen ){
			elem.webkitRequestFullScreen();
		};

		fullCanvas();
		this.isFullScreen = true; 
	},

	canselFullScreen : function(){

		if ( document.exitFullscreen ){
			document.exitFullscreen();
		} else if ( document.mozCancelFullScreen ){
			document.mozCancelFullScreen();
		} else if ( document.webkitExitFullscreen ){
			document.webkitExitFullscreen();
		};

		normalCanvas();
		this.isFullScreen = false;
	},

	isFullScreen : false,

	zoom : zoom

};