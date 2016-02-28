// handler.js

var log = require('./logger');
var proto = require('./proto');
var server = require('./server');
var config = require('../config');
var User = require('../models/user');

var handlers = {};

handlers.handleHeartbeatReq = function(socket, header, body) {
    server.refreshTimer(socket, config.heartbeatTimeout);
    var rsp = new proto.messages.HeartbeatRsp();
    server.sendMessage(socket, proto.messages.MessageId.HeartbeatRsp, rsp);
};

handlers.handleLoginReq = function(socket, header, body) {
    log.info('LOGIN REQUEST:', body.email, server.socketString(socket));
    server.refreshTimer(socket, config.heartbeatTimeout);

    User.findOne({
        where: {
            email: body.email
        }
    }).then(function(user) {
        var rsp = new proto.messages.LoginRsp();

        if (!user) {
            rsp.setRet(proto.messages.ErrorCode.UserNotFound);
            server.sendMessage(socket, proto.messages.MessageId.LoginRsp, rsp);
            server.disconnect(socket);
            return;
        }

        if (body.password != user.password) {
            rsp.setRet(proto.messages.ErrorCode.IncorrectPassword);
            server.sendMessage(socket, proto.messages.MessageId.LoginRsp, rsp);
            server.disconnect(socket);
            return;
        }

        // TODO: kick the connection with the same account

        log.info('LOGIN:', user.name + ':' + user.email, '@', server.socketString(socket));

        rsp.setRet(proto.messages.ErrorCode.Ok);
        rsp.setName(user.name);
        server.sendMessage(socket, proto.messages.MessageId.LoginRsp, rsp);
    });
};

exports.handlers = handlers;
