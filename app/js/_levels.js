var C = require('./_const.js');
var o = require('./_objects.js');

module.exports = levels = {

	lvlsCount : function(){
		var count = 0;
		for (key in levels){ count++ };
			return count-1;
	},

	1 : function(){

		var _walls = [];  //массив с будущепостроенными стенками
		var arr = [       
		[2,3],[2,4],[2,5],[3,0],[3,6],[3,8],[4,2],[5,1],[5,3],[5,7],[6,4],[7,4],[7,6],[8,1],[8,8],[9,0],[9,4],[9,5]
		];				  //придуманный массив со стенками

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  //заполняем массив walls

		o.box.setPosition( C.PDNG+2*(50+C.PDNG), C.PDNG+8*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG, C.PDNG*2+50 );
		o.door.setPosition( C.PDNG+8*(50+C.PDNG), C.PDNG+1*(50+C.PDNG) );

		o.walls = _walls;

	},

	2 : function(){

		var _walls = [];  
		var arr = [       
		[1,0],[1,4],[1,6],[3,2],[3,4],[4,8],[4,0],[1,3],[4,7],[5,2],[5,4],[5,5],[5,6],[6,0],[7,2],[7,5],[7,6],[7,7],[8,0],[9,3],[9,4],[9,7]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.box.setPosition( C.PDNG+6*(50+C.PDNG), C.PDNG+8*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG, C.PDNG+9*(50+C.PDNG) );
		o.door.setPosition( C.PDNG+8*(50+C.PDNG), C.PDNG+7*(50+C.PDNG) );

		o.walls = _walls;

	},

	3 : function(){

		var _walls = [];  
		var arr = [       
		[1,2],[1,7],[2,5],[2,8],[3,2],[3,7],[4,4],[5,1],[5,4],[5,6],[7,2],[7,3],[7,4],[7,6],[7,8],[8,0],[8,5],[9,0],[9,1],[9,3],[9,7]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.box.setPosition( C.PDNG+1*(50+C.PDNG), C.PDNG+7*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG+8*(50+C.PDNG), C.PDNG+9*(50+C.PDNG) );
		o.door.setPosition( C.PDNG+2*(50+C.PDNG), C.PDNG+4*(50+C.PDNG) );

		o.walls = _walls;

	},

	4 : function(){

		var _walls = [];  
		var arr = [       
		[1,1],[2,5],[2,7],[3,4],[4,1],[4,3],[4,6],[4,8],[5,3],[6,5],[6,7],[7,0],[7,2],[7,3],[7,5],[8,8],[9,0],[9,8]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.box.setPosition( C.PDNG+7*(50+C.PDNG), C.PDNG+8*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG+7*(50+C.PDNG), C.PDNG+9*(50+C.PDNG) );
		o.door.setPosition( C.PDNG+6*(50+C.PDNG), C.PDNG+1*(50+C.PDNG) );

		o.walls = _walls;

	},

	5 : function(){

		var _walls = [];  
		var arr = [       
		[1,1],[1,3],[1,5],[1,8],[3,2],[3,4],[3,6],[3,8],[5,0],[5,3],[5,5],[5,7],[7,1],[7,2],[7,4],[7,7],[8,8],[9,2],[9,4],[9,8]
		];				  

		for (var i = 0; i < arr.length; i++){ 
			_walls.push( new Rect(C.PDNG+arr[i][1]*(50+C.PDNG), C.PDNG+arr[i][0]*(50+C.PDNG), 50, 50, "#622DA1") );
		};				  

		o.box.setPosition( C.PDNG+1*(50+C.PDNG), C.PDNG+2*(50+C.PDNG) );
		o.pl.setPosition( C.PDNG, C.PDNG+1*(50+C.PDNG) );
		o.door.setPosition( C.PDNG, C.PDNG+9*(50+C.PDNG) );

		o.walls = _walls;

	}

};
