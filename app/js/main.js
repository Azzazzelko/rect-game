var engin = require('./_engine.js'),
Audio     = require('./classes/Audio.js'),
Playeble  = require('./classes/Playable.js'),
Wall      = require('./classes/Wall.js'),
ImgButton = require('./classes/ImgButton.js'),
Video     = require('./classes/Video.js'),
Button    = require('./classes/Button.js'),
Rect      = require('./classes/Rect.js'),
Image     = require('./classes/Image.js'),
C         = require('./_const.js'),
events    = require('./_events.js'),
levels    = require('./_levels.js'),
o         = require('./_objects.js'),
cnvs      = require('./_canvas.js'),
key 	  = require('./_key.js');

engin.gameEngineStart(gameLoops.loader);


// музыку громкость отрегулировать, найти че-нить другое для меню
// ховеры запилить в классы.



// настройки - шоб там управлять размерами наверное.. хз пока, музыкой управлять!!!
// шрифт надо подгружать ранее, например отрисовать его в прелойдере невидимо.
// хайдить кнопки в выборе уровня