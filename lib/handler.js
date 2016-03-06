// handler.js

var log = require('./logger');
var proto = require('./proto');
var server = require('./server');
var storage = require('./storage');
var config = require('../config');
var User = require('../models/user');
var Device = require('../models/device');
var Share = require('../models/share');

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

    User.findById(body.email, { include: Device }).then(function(user) {
        if (!user) {
            sendRsp(proto.messages.ErrorCode.UserNotFound);
            return;
        }

        if (body.password != user.password) {
            sendRsp(proto.messages.ErrorCode.IncorrectPassword);
            return;
        }

        var device = user.devices.find(function(device) {
            return device.id == body.deviceId;
        });

        if (!device) {
            log.info('new device:', body.deviceId, 'user: ', user.name);
            device = Device.build({
                id: body.deviceId
            });
            device.save().then(function() {
                user.addDevice(device);
                sendRsp(proto.messages.ErrorCode.Ok, user);
                server.addContext(user, device, socket);
                // TODO: check if there is unsynced shared image
            }).catch(function(err) {
                log.error(err);
                sendRsp(proto.messages.ErrorCode.DatabaseError);
            });
        } else {
            sendRsp(proto.messages.ErrorCode.Ok, user);
            server.addContext(user, device, socket);
            // TODO: check if there is unsynced shared image
        }
    }).catch(function(err) {
        log.error(err);
        sendRsp(proto.messages.ErrorCode.DatabaseError);
    });
};

handlers.handleShareImageReq = function(socket, header, body) {
    var ctx = server.getContext(socket);
    log.info('SHARE IMAGE:', ctx.user.email, ctx.device.id, body.name);

    storage.saveImage(body.name, body.image.toBuffer(), function(err, md5) {
        var rsp = new proto.messages.ShareImageRsp();

        if (err) {
            rsp.setRet(proto.messages.ErrorCode.StorageError);
            server.sendMessage(socket, proto.messages.MessageId.ShareImageRsp, rsp);
            return;
        }

        Share.create({
            startTime: new Date(),
            scope: body.scope,
            userEmail: ctx.user.email,
            deviceId: ctx.device.id,
            imageMd5: md5
        }).then(function(share) {
            rsp.setRet(proto.messages.ErrorCode.Ok);
            rsp.setShareId(share.id);
            server.sendMessage(socket, proto.messages.MessageId.ShareImageRsp, rsp);
            // TODO: send ShareImageNotify here
        }).catch(function(err) {
            log.error(err);
            rsp.setRet(proto.messages.ErrorCode.DatabaseError);
            server.sendMessage(socket, proto.messages.MessageId.ShareImageRsp, rsp);
        });
    });
};

handlers.handleFetchImageReq = function(socket, header, body) {
    var ctx = server.getContext(socket);
    log.info('FETCH IMAGE:', body.shareId);

    Share.findById(body.shareId, {
        include: [{ all: true }]
    }).then(function(share) {
        var rsp = new proto.messages.FetchImageRsp();

        if (!share) {
            rsp.setRet(proto.messages.ErrorCode.ShareNotFound);
            server.sendMessage(socket, proto.messages.MessageId.FetchImageRsp, rsp);
            return;
        }

        var ok = false;

        switch (share.scope) {
        case proto.messages.ShareImageReq.ShareScope.Private:
            ok = (share.userEmail == ctx.user.email
                  && share.deviceId == ctx.device.id);
            break;
        case proto.messages.ShareImageReq.ShareScope.User:
            ok = (share.userEmail == ctx.user.email);
            break;
        case proto.messages.ShareImageReq.ShareScope.Public:
            ok = true;
            break;
        default:
            log.error('invalid scope:', share.scope, share.id);
        }

        if (!ok) {
            rsp.setRet(proto.messages.ErrorCode.PermissionDenied);
            server.sendMessage(socket, proto.messages.MessageId.FetchImageRsp, rsp);
            return;
        }

        storage.loadImage(share.image.path, function(err, data) {
            if (err) {
                rsp.setRet(proto.messages.ErrorCode.StorageError);
                server.sendMessage(socket, proto.messages.MessageId.FetchImageRsp, rsp);
                return;
            }

            rsp.setRet(proto.messages.ErrorCode.Ok);
            rsp.setName(share.image.name);
            rsp.setImage(data);
            server.sendMessage(socket, proto.messages.MessageId.FetchImageRsp, rsp);
        });
    }).catch(function(err) {
        log.error(err);
        var rsp = new proto.messages.FetchImageRsp();
        rsp.setRet(proto.messages.ErrorCode.DatabaseError);
        server.sendMessage(socket, proto.messages.MessageId.FetchImageRsp, rsp);
    });
};

exports.handlers = handlers;
