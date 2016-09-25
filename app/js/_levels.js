var C = require('./_const.js');
var o = require('./_objects.js');

module.exports = {

	1 : function(){

		var _walls = [];
		var arr = [
		[2,3],[2,4],[2,5],[2,6],[3,0],[3,6],[3,8],[4,2],[5,1],[5,2],[5,3],[5,7],[6,4],[7,4],[7,6],[8,0],[8,1],[8,8],[9,0],[9,4],[9,5]
		];

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DD1") );
		};

		o.box.x = C.PDNG+2*(50+C.PDNG);
		o.box.y = C.PDNG+8*(50+C.PDNG);

		o.walls = _walls;

	}


};