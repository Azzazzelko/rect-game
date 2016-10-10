var resourses = {
  images : false,
  video : false,

  areLoaded : function(){
    return this.video && this.images
  }
};

function loadVideo(arrSrcsOfVideo){

  var arrVideos = []; 
  var count = arrSrcsOfVideo.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var video = document.createElement('video');
    video.src = arrSrcsOfVideo[i];
    // video.onloadeddata = function(){
      video.oncanplaythrough = function(){
        loadCount++;
        video.loop = true;
        if ( loadCount == count ) resourses.video = true;
      };
    // };

    arrVideos.push(video);

  };

  return arrVideos;
};

function loadImages(arrSrcsOfImages){

  var arrImages = []; 
  var count = arrSrcsOfImages.length;
  var loadCount = 0;

  for(var i=0; i<count; i++){

    var img = document.createElement('img');
    img.src = arrSrcsOfImages[i];
    img.onload = function(){
      loadCount++;
      if ( loadCount == count ) resourses.images = true;
    };
    
    arrImages.push(img);

  };

  return arrImages;
};

var arrVideos = loadVideo([
  "video/bg.mp4",
  "video/Lightmirror.mp4"
]);

var arrImages = loadImages([
  "img/button-menu.svg",     //0
  "img/logo.png",            //1
  "img/header3.svg",         //2
  "img/fullscreen.svg",      //3
  "img/pause.svg",           //4
  "img/wall.svg",            //5
  "img/crystall-01.svg",     //6
  "img/portal.svg",          //7
  "img/ground.jpg",          //8
  'img/player.png',          //9
  "img/exit-button.svg",     //10
  "img/restart-button.svg",  //11
  "img/exit_in_menu-button.svg", //12
  "img/pause-bg.svg",        //13
  "img/pause_text.svg",      //14
  "img/button_next.svg",     //15
  "img/bg_win.svg",          //16
  "img/levels_2.svg",        //17
  "img/levels_next.svg",     //18
  "img/levels_prev.svg",     //19
  "img/levels_in_menu.svg"   //20
]);

module.exports = { 

  resourses : resourses,

  arrVideos : arrVideos,

  arrImages : arrImages  

};


