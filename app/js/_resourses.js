var resourses = {
  images : true,
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
    video.onloadeddata = function(){
      video.oncanplaythrough = function(){
        loadCount++;
        video.loop = true;
        if ( loadCount == count ) resourses.video = true;
      };
    };

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
  "../video/bg.mp4"
]);

var arrImages = loadImages([
  "../img/button-menu.svg",
  "../img/logo.png",
  "../img/header3.svg",
  "../img/fullscreen.svg",
  "../img/pause.svg",
  "../img/wall.svg",
  "../img/crystall-01.svg",
  "../img/portal.svg",
  "../img/ground.jpg",
  '../img/player.png'
]);

module.exports = { 

  resourses : resourses,

  arrVideos : arrVideos,

  arrImages : arrImages  

};


