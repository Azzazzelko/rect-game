var C = require('./_const.js');

function createMatrix(){
  var matrix = []; //массив для матричного вида уровня

  for (var i = 0; i < 10; i++){ //заполняем объект
    for (var j = 0; j < 9; j++){
      matrix.push( new Rect(C.PDNG+j*(50+C.PDNG), C.PDNG+i*(50+C.PDNG), 50, 50, "#FEA3A3") );
    }
  };

  return matrix
};

function createMenu(txtArr, nameArr){  //создаем главное меню
  var menu = [];
  var names = nameArr;
  var txt = txtArr;
  var amounts = txtArr.length;
  
  var _height = (C.HEIGHT/2) - (75*amounts/2); 
  var _width = C.WIDTH/2-200/2;

  for (var i = 0; i < amounts; i++){
    menu.push( new Button( _width, _height+i*75, 200, 50, "black", txt[i], names[i], 30 ) );
  };

  return menu;
};

var matrix = createMatrix();
var menu = createMenu(["Играть","Настройки"],["play", "options"]);
var header = new Rect( 0, 0, C.WIDTH, 50+C.PDNG, "black" );
var bRestart = new Button( C.WIDTH-90-5, header.h/2-1 - 40/2, 90, 40, "#34BACA", "Restart", "restart", 25 );

var pl = new Rect(C.PDNG,C.PDNG*2+50,50,50,"black");  //игрок
var box = new Rect(C.PDNG,C.PDNG*2+50,50,50,"blue"); //бокс
var door = new Rect(C.PDNG,C.PDNG*2+50,50,50, "rgba(231, 23, 32, 0.8)"); //дверь
var bg = new Image("img/rect-bg.jpg");
var walls = [];

module.exports = {

	matrix : matrix,
	menu : menu,
	header : header,
	bRestart : bRestart,
	pl : pl,
	box : box,
	door : door,
	bg : bg,
	walls : walls

};