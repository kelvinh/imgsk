// handler.js

var log = require('./logger');
var server = require('./server');
var config = require('../config');

var handlers = {};

handlers.handleHeartbeatReq = function(socket, header, body) {
    server.refreshTimer(socket, config.heartbeatTimeout);
    // TODO: send heartbeat response here
};

handlers.handleLoginReq = function(socket, header, body) {
    // TODO: check credential here
    log.info('LOGIN: ' + server.socketString(socket));
    server.refreshTimer(socket, config.heartbeatTimeout);
    // TODO: send login response here
};

exports.handlers = handlers;
