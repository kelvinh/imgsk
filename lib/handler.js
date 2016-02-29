// handler.js

var log = require('./logger');
var proto = require('./proto');
var server = require('./server');
var config = require('../config');
var User = require('../models/user');
var Device = require('../models/device');

var handlers = {};

handlers.handleHeartbeatReq = function(socket, header, body) {
    server.refreshTimer(socket, config.heartbeatTimeout);
    var rsp = new proto.messages.HeartbeatRsp();
    server.sendMessage(socket, proto.messages.MessageId.HeartbeatRsp, rsp);
};

handlers.handleLoginReq = function(socket, header, body) {
    log.info('LOGIN REQUEST:', body.email, server.socketString(socket));
    server.refreshTimer(socket, config.heartbeatTimeout);

    var sendRsp = function(ret, user) {
        var rsp = new proto.messages.LoginRsp();
        rsp.setRet(ret);
        if (ret != proto.messages.ErrorCode.Ok) {
            server.sendMessage(socket, proto.messages.MessageId.LoginRsp, rsp);
            server.disconnect(socket);
            return;
        }

        log.info('LOGIN:', user.name + ':' + user.email, '@', server.socketString(socket));
        rsp.setName(user.name);
        server.sendMessage(socket, proto.messages.MessageId.LoginRsp, rsp);
    };

    User.findOne({
        where: {
            email: body.email
        }
    }).then(function(user) {
        if (!user) {
            sendRsp(proto.messages.ErrorCode.UserNotFound);
            return;
        }

        if (body.password != user.password) {
            sendRsp(proto.messages.ErrorCode.IncorrectPassword);
            return;
        }

        user.getDevices({
            where: {
                id: body.deviceId
            }
        }).then(function(devices) {
            if (devices.length <= 0) {
                log.info('new device:', body.deviceId, 'user: ', user.name);
                var device = Device.build({
                    id: body.deviceId
                });
                device.save().then(function() {
                    user.addDevice(device);
                    sendRsp(proto.messages.ErrorCode.Ok, user);
                    // TODO: kick the connection with the same account
                    // TODO: check if there is unsynced shared image
                }).catch(function(err) {
                    sendRsp(proto.messages.ErrorCode.DatabaseError);
                });
            } else {
                sendRsp(proto.messages.ErrorCode.Ok, user);
                // TODO: kick the connection with the same account
                // TODO: check if there is unsynced shared image
            }
        }).catch(function(err) {
            sendRsp(proto.messages.ErrorCode.DatabaseError);
        });
    }).catch(function(err) {
        sendRsp(proto.messages.ErrorCode.DatabaseError);
    });
};

exports.handlers = handlers;
