var C = require('./_const.js');
var cnvs = require('./_canvas.js');
var res = require('./_resourses.js');


function createMatrixBG(){             //создаем матричное поле
  var matrix = [];                     //массив для матричного вида уровня

  for (var i = 0; i < 9; i++){         //заполняем объект
    for (var j = 0; j < 9; j++){
      matrix.push( new Rect(C.PDNG+j*(50+C.PDNG), 71+C.PDNG+i*(50+C.PDNG), 50, 50, "rgba(0,0,0,0.5)", true) );
    }
  };

  return matrix
};

function createMenu(txtArr, nameArr){  //создаем главное меню
  var menu = [];
  var names = nameArr;
  var txt = txtArr;
  var amounts = txtArr.length;
  
  var _fontsize = "28";
  var _x = C.WIDTH/2-300/2;
  var _y = (C.HEIGHT/2) - (85*amounts/2) + 85; 

  for (var i = 0; i < amounts; i++){
    menu.push( new ImgButton( res.arrImages[0], res.arrImages[21], _x, _y+i*85, 300, 60, txt[i], names[i], _fontsize, 83 ) );
  };

  return menu;
};

function createWinPopUp(){             //создаем победную вспллывашку

  var winPopBG      = new Image( res.arrImages[16], C.WIDTH/2-320/2, C.HEIGHT/2-200/2, 320, 200);
  var bPopExit      = new ImgButton( res.arrImages[12], res.arrImages[26], winPopBG.x+30,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_exit", 0 );
  var bPopNext      = new ImgButton( res.arrImages[15], res.arrImages[29], winPopBG.x+30+110+80,  winPopBG.y+winPopBG.h-50, 80, 65, "", "pop_next", 0 );
  var winText       = new Button( C.WIDTH/2-90/2, winPopBG.y+15, 90, 40, "transparent", "Уровень N", "win_text", 30, "Buccaneer" );
  var winText_2     = new Button( C.WIDTH/2-90/2+10, winPopBG.y+80, 90, 40, "transparent", "ПРОЙДЕН!", "win_text_2", 50, "aZZ_Tribute_Bold" );

  winText.txtColor = "#D9C425";

  var winPopUp = [];
  winPopUp.push(winPopBG, bPopExit, bPopNext, winText, winText_2);

  return winPopUp;
};

function createPausePopUp(){           //создаем пауз всплывашку

  var pausePopUp = [];
  var bgPause          = new Image( res.arrImages[13], C.WIDTH/2-300/2, C.HEIGHT/2-207/2, 300, 207);
  var bReturn          = new ImgButton( res.arrImages[10], res.arrImages[24], bgPause.x+190,  bgPause.y-25, 63, 57, "", "return", 0 );
  var bExitToMenu      = new ImgButton( res.arrImages[12], res.arrImages[26], bgPause.x+50,  bgPause.y+bgPause.h-50, 85, 70, "", "exit", 0 );
  var bRestart         = new ImgButton( res.arrImages[11], res.arrImages[25], bgPause.x+50+30+85,  bgPause.y+bgPause.h-50, 85, 70, "", "restart", 0 );
  var pauseText        = new Image( res.arrImages[14], bgPause.x + bgPause.w/2 - 150/2, bgPause.y + bgPause.h/2 - 100/2, 150, 100);

  pausePopUp.push(bgPause, bReturn, bExitToMenu, bRestart, pauseText);

  return pausePopUp;
};

function createLevelsButtons(levels_count){ //создаем кнопки в выборе уровня

  var bLevelsButtons = [];
  var j = 0, dy = 85, dx = 0;

  for ( i=0; i < levels_count; i++){
    dx = 8+j*(100+15);

    bLevelsButtons.push( new ImgButton( res.arrImages[17], res.arrImages[27], dx, dy, 100, 100, i+1, "level_"+(i+1), 35 ) );

    j++;

    if ( dx > C.WIDTH-115 ){
      dy += (125);
      j = 0;
    }

  };

  return bLevelsButtons;
};

function createLevelsFooter(){         //создаем футер в выборе уровня

  var levelsFooter = [];

  var bPrev   = new ImgButton( res.arrImages[19], false,             20,                C.HEIGHT-10-67, 40,  67, "",                 "prev",    0 );
  var bNext   = new ImgButton( res.arrImages[18], false,             C.WIDTH-20-40,     C.HEIGHT-10-67, 40,  67, "",                 "next",    0 );
  var bToMenu = new ImgButton( res.arrImages[20], res.arrImages[28], C.WIDTH/2 - 320/2, C.HEIGHT-10-67, 320, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.txtColor = "#000046";

  levelsFooter.push(bPrev,bNext,bToMenu);

  return levelsFooter;
};

function createPlayer(){               //создаем игрока с уникальными методами

  var player = new Playable(res.arrImages[9],0,0,50,50);
  player.direction = false;
  player.isMove    = false;

  player.draw = function(){

    if(this.isMove){
      this.drawAnimation(3, 2, this.direction);
    }else{
      this.drawFrame();
    };
  };

  player.drawAnimation = function(frames, delay, angle){

    this.img.canDraw = ( this.img.canDraw === undefined ) ? 1 : this.img.canDraw;

    if (angle){
      var _dx = this.x+C.PDNG + this.w / 2;
      var _dy = this.y+71+C.PDNG + this.h / 2;
      angle = angle * (Math.PI/180);
      cnvs.ctx.save();
      cnvs.ctx.translate(_dx,_dy);
      cnvs.ctx.rotate(angle);
      cnvs.ctx.translate(-_dx,-_dy);
    };

    if (this.img.canDraw == 1){
      if (this.img.count == frames) this.img.count = 1;

      this.img.canDraw = 0;
      this.img.count = this.img.count + 1 || 1;

      setTimeout(function(){
        player.img.canDraw = 1;
      }, 1000/(delay*2) );
    };

    cnvs.ctx.translate(C.PDNG, 71+C.PDNG);
    cnvs.ctx.drawImage(this.img, 50*(this.img.count-1), 0, this.w, this.h, this.x, this.y, this.w, this.h);
    cnvs.ctx.translate(-C.PDNG, -(71+C.PDNG));

    if (angle){
      cnvs.ctx.restore();
    };
  };

  player.drawFrame = function(){

    var angle = this.direction || 0;

    if (angle){
      var _dx = this.x+C.PDNG + this.w / 2;
      var _dy = this.y+71+C.PDNG + this.h / 2;
      angle = angle * (Math.PI/180);
      cnvs.ctx.save();
      cnvs.ctx.translate(_dx,_dy);
      cnvs.ctx.rotate(angle);
      cnvs.ctx.translate(-_dx,-_dy);
    };

    cnvs.ctx.translate(C.PDNG, 71+C.PDNG);
    cnvs.ctx.drawImage(this.img, 0, 0, this.w, this.h, this.x, this.y, this.w, this.h);
    cnvs.ctx.translate(-C.PDNG, -(71+C.PDNG));

    if (angle){
      cnvs.ctx.restore();
    };
  };

  player.setDirection = function(direction){
    this.direction = direction;
  };

  return player;
};

function createOptionsBut(){           //cоздаем чекбоксы в настройках

  var arrOpt = [];
  var buttons = ["Музыка в меню", "Музыка в игре", "Звуки в игре"];
  var idButtons = ["bMenuMusic", "bGameMusic", "bSfxMusic"];

  for (var i=0; i<buttons.length; i++){
    arrOpt.push( new ImgButton( res.arrImages[31], false, C.WIDTH/2 - 150, 160+(i*70), 45, 45, buttons[i], idButtons[i], 25, 1, 1, 65 ) );
    arrOpt[i].fFam = "Buccaneer";
    arrOpt[i].checked = false;
    arrOpt[i].check = function(){

      if ( !this.checked ) {
        _img = this.img;
        this.img = res.arrImages[30];
        this.checked = !this.checked;
      } else {
        this.img = _img;
        this.checked = !this.checked;
      };
    };
  };

  var bToMenu = new ImgButton( res.arrImages[20], res.arrImages[28], C.WIDTH/2 - 400/2, C.HEIGHT-10-67, 400, 67, "Вернуться в меню", "to_menu", 25 );
  bToMenu.txtColor = "#000046";

  arrOpt.push( bToMenu );


  return arrOpt;
};


//menu
var logo = new ImgButton( res.arrImages[1], false, C.WIDTH/2-450/2, 20, 450, 150, "", "logo", 0 );
var menu = createMenu(["Играть", "Уровни", "Настройки"],["play", "change_level", "options"]);


//background 
var matrix    = createMatrixBG();         //bg уровня
var bgLevel   = new Image( res.arrImages[8], 0, 0, C.WIDTH, C.HEIGHT );
var bgOpacity = new Rect(0, 0, C.WIDTH, C.HEIGHT, "rgba(0, 0, 0, 0.5)");


//game header
var header    = new Image( res.arrImages[2], 0, 0, C.WIDTH, 71+C.PDNG );
var bFullScr  = new ImgButton( res.arrImages[3], res.arrImages[22], C.WIDTH-45-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "fullScr", 0 );
var stopWatch = new Button( 10, header.h/2-C.CNV_BORDER/2 - 40/2, 120, 40, "transparent", "00 : 00 : 00", "stopwatch", 25, "dited" );
var bPause    = new ImgButton( res.arrImages[4], res.arrImages[23], C.WIDTH-45-7-bFullScr.w-20, header.h/2-C.CNV_BORDER/2 - 45/2, 45, 45, "", "pause", 0 );
var currLevel = new Button( (stopWatch.x+stopWatch.w+bPause.x)/2-140/2, header.h/2-C.CNV_BORDER/2 - 40/2, 140, 40, "transparent", "Уровень", "curr_level", 25, "capture_it" );


//change level
var levelsHeader   = new ImgButton( res.arrImages[2], false, 0, 0, C.WIDTH, 71+C.PDNG, "Выбор уровня", "levels_header", 25 );
var levelsFooter   = createLevelsFooter();
var bLevelsButtons = createLevelsButtons(5);


//options
var optionsHeader  = new ImgButton( res.arrImages[2], false, 0, 0, C.WIDTH, 71+C.PDNG, "Настройки", "options_header", 25 );
var optionsMusic   = new Button( C.WIDTH/2-140/2, 90, 140, 40, "transparent", "Музыка", "music", 25, "capture_it" );
var bOptions       = createOptionsBut();

//win pop-up
var winPopUp   = createWinPopUp();


//pause pop-up
var pausePopUp = createPausePopUp();


//playable obj
var pl    = createPlayer();                           //персонаж
var box   = new Playable(res.arrImages[6],0,0,50,50); //бокс
var door  = new Playable(res.arrImages[7],0,0,50,50); //дверь
var walls = [];                                       //стены на уровне, заполняется выбранным уровнем.


//video
var animateBg     = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[0]);
var videoBgLevels = new Video(0, 0, C.WIDTH, C.HEIGHT, res.arrVideos[1]);


//audio
var audio = {

  button   : new Audio(res.arrAudio[0], 0.5),
  win      : new Audio(res.arrAudio[1], 0.5),
  player   : new Audio(res.arrAudio[2], 0.25),
  crystal  : new Audio(res.arrAudio[3], 0.25),
  bgInGame : new Audio(res.arrAudio[4], 0.5),
  bgInMenu : new Audio(res.arrAudio[5], 0.5),
};


module.exports = objects = {

  matrix         : matrix,
  logo           : logo,
  menu           : menu,
  header         : header,
  stopWatch      : stopWatch,
  bPause         : bPause,
  bFullScr       : bFullScr,
  pl             : pl,
  box            : box,
  door           : door,
  walls          : walls,
  bgLevel        : bgLevel,
  winPopUp       : winPopUp,
  pausePopUp     : pausePopUp,
  bgOpacity      : bgOpacity,
  currLevel      : currLevel,
  levelsHeader   : levelsHeader,
  bLevelsButtons : bLevelsButtons,
  levelsFooter   : levelsFooter,
  animateBg      : animateBg,
  videoBgLevels  : videoBgLevels,
  audio          : audio,
  optionsHeader  : optionsHeader,
  optionsMusic   : optionsMusic,
  bOptions       : bOptions

};
