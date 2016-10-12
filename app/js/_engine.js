//*****************************************
//**кросбраузерное упрвление циклами игры**
//*****************************************
var canvas = require("./_canvas.js");

var gameEngine;

var nextGameStep = (function(){
	return requestAnimationFrame ||
	webkitRequestAnimationFrame ||
	mozRequestAnimationFrame ||
	oRequestAnimationFrame ||
	msRequestAnimationFrame ||
	function (callback){
		setInterval(callback, 1000/60)
	};
})();

function gameEngineStep(){
	gameEngine();
	nextGameStep(gameEngineStep);
};

module.exports = {

	gameEngineStart : function (callback){
		gameEngine = callback;
		gameEngineStep();
	},

	setGameEngine : function(callback){
		if ( canvas.cnv.style.cursor != "default" ) canvas.cnv.style.cursor = "default";  //всегда при клике на любую кнопку, что б курсор стандартизировался
		gameEngine = callback;
	}

};
