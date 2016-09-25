var game = require('./_gameEngine.js'),
    Button = require('./classes/Button.js'),
    Rect = require('./classes/Rect.js'),
    Image = require('./classes/Image.js'),
    C = require('./_const.js'),
    o = require('./_objects.js'),
    events = require('./_events.js');
    canvas = require('./_canvas.js');

game.gameEngineStart(gameLoops.menu);
