// logger.js

var config = require('../config');
var winston = require('winston');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    level: config.logLevel,
    colorize: true,
    timestamp: true
});

winston.add(winston.transports.DailyRotateFile, {
    level: config.logLevel,
    filename: 'imgsk.log',
    maxsize: 1024,
    json: false,
    datePattern: '.HH'
});

module.exports = winston;
