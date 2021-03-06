var resourses = {
  images : false,
  video  : false,
  audio  : false,

  areLoaded : function(){
    return this.video && this.images && this.audio
  }
};

function loadVideo(arrSrcsOfVideo){

  var objVideo = {}; 
  var count = arrSrcsOfVideo.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var video = document.createElement('video');
    video.src = arrSrcsOfVideo[i];
    video.oncanplaythrough = function(){
      loadCount++;
      video.loop = true;
      if ( loadCount == count ) resourses.video = true;
    };

    var sliceStart = arrSrcsOfVideo[i].lastIndexOf("\/")+1;
    var key        = arrSrcsOfVideo[i].slice(sliceStart);

    objVideo[key] = video;

  };

  return objVideo;
};

function loadImages(arrSrcsOfImages){

  var objImages = []; 
  var count = arrSrcsOfImages.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var img = document.createElement('img');
    img.src = arrSrcsOfImages[i];
    img.onload = function(){
      loadCount++;
      if ( loadCount == count ) resourses.images = true;
    };
    
    var sliceStart = arrSrcsOfImages[i].lastIndexOf("\/")+1;
    var key        = arrSrcsOfImages[i].slice(sliceStart);
    
    objImages[key] = img;

  };

  return objImages;
};

function loadAudio(arrSrcsOfAudio){

  var objAudio = []; 
  var count = arrSrcsOfAudio.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var audio = document.createElement('audio');
    audio.src = arrSrcsOfAudio[i];
    audio.oncanplaythrough = function(){
      loadCount++;
      if ( loadCount == count ) resourses.audio = true;
    };
    
    var sliceStart = arrSrcsOfAudio[i].lastIndexOf("\/")+1;
    var key        = arrSrcsOfAudio[i].slice(sliceStart);

    objAudio[key] = audio;

  };

  return objAudio;
};

var objAudio = loadAudio([
  "audio/button-click.mp3",
  "audio/win-audio.mp3",
  "audio/player-move.mp3",
  "audio/crystal-move.mp3",
  "audio/bg-inGame.mp3",
  "audio/bg-inMenu.mp3"
]);

var objVideo = loadVideo([
  "video/bg.mp4",
  "video/Lightmirror.mp4"
]);

var objImages = loadImages([
  "img/menu__button-menu.svg",                //0 
  "img/menu__logo.png",                       //1

  "img/game__bg-header.svg",                  //2 
  "img/game__button-fullscreen.svg",          //3 
  "img/game__button-pause.svg",               //4 
  "img/game__wall.svg",                       //5 
  "img/game__crystall.svg",                   //6 
  "img/game__portal.svg",                     //7 
  "img/game__ground.jpg",                     //8 
  'img/game__player.png',                     //9 

  "img/pause__button-close.svg",              //10
  "img/pause__button-restart.svg",            //11
  "img/pause__button-toMenu.svg",             //12
  "img/pause__bg.svg",                        //13
  "img/pause__text.svg",                      //14

  "img/win__button-next.svg",                 //15
  "img/win__bg.svg",                          //16

  "img/levels__button-levels.svg",            //17
  "img/levels__button-next.svg",              //18
  "img/levels__button-prev.svg",              //19
  "img/levels__button-toMenu.svg",            //20

  "img/hovers/menu__button-menu_hover.svg",       //21
  "img/hovers/game__button-fullscreen_hover.svg", //22
  "img/hovers/game__button-pause_hover.svg",      //23
  "img/hovers/pause__button-close_hover.svg",     //24
  "img/hovers/pause__button-restart_hover.svg",   //25
  "img/hovers/pause__button-toMenu_hover.svg",    //26
  "img/hovers/levels__button-levels_hover.svg",   //27
  "img/hovers/levels__button-toMenu_hover.svg",   //28
  "img/hovers/win__button-next_hover.svg",        //29

  "img/options__uncheck_white.svg",           //30
  "img/options__check_white.svg"              //31
]);

module.exports = { 

  resourses : resourses,

  objVideo  : objVideo,

  objImages : objImages,

  objAudio  : objAudio

};


