// handler.js

var log = require('./logger');
var server = require('./server');
var config = require('../config');
var User = require('../models/user');

var handlers = {};

handlers.handleHeartbeatReq = function(socket, header, body) {
    server.refreshTimer(socket, config.heartbeatTimeout);
    // TODO: send heartbeat response here
};

handlers.handleLoginReq = function(socket, header, body) {
    log.info('LOGIN REQUEST:', body.email, server.socketString(socket));
    server.refreshTimer(socket, config.heartbeatTimeout);

    User.findOne({
        where: {
            email: body.email
        }
    }).then(function(user) {
        // TODO: check credential here
        if (user)
            log.info('LOGIN:', server.socketString(socket), 'db:', user.name, user.email);

        // TODO: finish the logic here
        // TODO: send login response here
    });
};

exports.handlers = handlers;
