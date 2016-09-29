var C = require('./_const.js');
var cnvs = require('./_canvas.js');

function createMatrix(){
  var matrix = []; //массив для матричного вида уровня

  for (var i = 0; i < 10; i++){ //заполняем объект
    for (var j = 0; j < 9; j++){
      matrix.push( new Rect(C.PDNG+j*(50+C.PDNG), C.PDNG+i*(50+C.PDNG), 50, 50, "#FEA3A3") );
    }
  };

  return matrix
};

function createMenu(txtArr, nameArr, fontsize){  //создаем главное меню
  var menu = [];
  var names = nameArr;
  var txt = txtArr;
  var _fontsize = fontsize;
  var amounts = txtArr.length;
  
  var _height = (C.HEIGHT/2) - (75*amounts/2); 
  var _width = C.WIDTH/2-200/2;

  for (var i = 0; i < amounts; i++){
    menu.push( new Button( _width, _height+i*75, 200, 50, "black", txt[i], names[i], _fontsize ) );
  };

  return menu;
};

function createWinPopUp(){

  var winPopBG = new Rect( C.WIDTH/2-275/2, C.HEIGHT/2-125/2, 275, 125, "red" );
  var bPopExit = new Button( winPopBG.x+5, winPopBG.y+winPopBG.h-5-40, 90, 40, "black", "Выход", "pop_exit", 20 );
  var bPopNext = new Button( winPopBG.x+winPopBG.w-5-90, winPopBG.y+winPopBG.h-5-40, 90, 40, "black", "Далее", "pop_next", 20 );
  var winText = new Button( C.WIDTH/2-90/2, winPopBG.y+10, 90, 40, "transparent", "Уровень N пройден!", "win_text", 25 );
  winText.txtColor = "black";

  var winPopUp = [];
  winPopUp.push(winPopBG, bPopExit, bPopNext, winText);

  return winPopUp;
};

function createPausePopUp(txtArr, nameArr, fontsize){

  var names = nameArr;
  var txt = txtArr;
  var _fontsize = fontsize;
  var amounts = txtArr.length;

  var _height = (C.HEIGHT/2) - (60*amounts/2); 
  var _width = C.WIDTH/2-150/2;

  var pausePopUp = [new Rect( C.WIDTH/2-200/2, _height-30, 200, 60*amounts+40, "red" )];

  for (var i=0; i<amounts; i++){
    pausePopUp.push( new Button( _width, _height+i*60, 150, 40, "black", txt[i], names[i], _fontsize ) ); 
  };

  return pausePopUp;
};

var grd = cnvs.ctx.createLinearGradient(C.WIDTH, 0, C.WIDTH, 50+C.PDNG);
grd.addColorStop(0, 'black');   
grd.addColorStop(1, 'grey');




//menu
var menu = createMenu(["Играть","Настройки"],["play", "options"], "30");


//background 
var matrix = createMatrix(); //bg уровня
var bg = new Image("img/rect-bg.jpg"); //bg в главном меню
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//header
var header = new Rect( 0, 0, C.WIDTH, 50+C.PDNG, grd );
var bFullScr = new Button( C.WIDTH-50-5, header.h/2-C.CNV_BORDER/2 - 40/2, 50, 40, "#34BACA", "FS", "fullScr", 25 );
var stopWatch = new Button( 5, header.h/2-C.CNV_BORDER/2 - 40/2, 145, 40, "#34BACA", "00 : 00 : 00", "stopwatch", 25 );
var bPause = new Button( C.WIDTH-90-5-bFullScr.w-10, header.h/2-C.CNV_BORDER/2 - 40/2, 90, 40, "#34BACA", "Пауза", "pause", 25 );


//win pop-up
var winPopUp = createWinPopUp();


//pause pop-up
var pausePopUp = createPausePopUp(["Вернуться", "Заново", "Выход"],["return", "restart", "exit"], "20");


//playable obj
var pl = new Rect(C.PDNG,C.PDNG*2+50,50,50,"black");  //игрок
var box = new Rect(C.PDNG,C.PDNG*2+50,50,50,"#3D5DFF"); //бокс
var door = new Rect(C.PDNG,C.PDNG*2+50,50,50, "rgba(231, 23, 32, 0.8)"); //дверь
var walls = []; //стены на уровне, заполняется выбранным уровнем.




module.exports = {

	matrix : matrix,
	menu : menu,
	header : header,
  stopWatch : stopWatch,
  bPause : bPause,
  bFullScr : bFullScr,
  pl : pl,
  box : box,
  door : door,
  bg : bg,
  walls : walls,
  winPopUp : winPopUp,
  pausePopUp : pausePopUp,
  bgOpacity : bgOpacity

};