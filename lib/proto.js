// proto.js

var protobuf = require('protobufjs');
var handler = require('./handler');
var log = require('./logger');
var mushroom = protobuf.loadProtoFile('proto/mushroom.proto');
var root = mushroom.build('mushroom');

var messages = {};
var handlers = {};

function getMessageById(msgid) {
    return messages[msgid];
}

function getHandlerById(msgid) {
    return handlers[msgid];
}

function init() {
    for (var k in root.MessageId) {
        if (!root[k])
            throw new Error('Message id ' + k + ' defined, but message not defined.');

        log.debug('MESSAGE REGISTER: ' + root.MessageId[k] + ' => ' + k);
        messages[root.MessageId[k]] = root[k];
    }

    for (var k in root.MessageId) {
        if (k.endsWith('Req')) {
            var h = 'handle' + k;
            if (!handler.handlers[h])
                throw new Error('Message ' + k + ' does not have a handler ' + h);

            log.debug('HANDLER REGISTER: ' + root.MessageId[k] + ' => ' + h);
            handlers[root.MessageId[k]] = handler.handlers[h];
        }
    }
}

function readMessageHeader(buffer) {
    try {
        return root.MessageHeader.decode(buffer);
    } catch (e) {
        log.error('DECODE FAILURE: ', e);
        return undefined;
    }
}

function readMessageBody(msgid, buffer) {
    var msg = getMessageById(msgid);
    if (!msg) {
        log.error('Message id ' + msgid + ' not registered.');
        return undefined;
    }

    try {
        return msg.decode(buffer);
    } catch (e) {
        log.error('DECODE FAILURE: ', e);
        return undefined;
    }
}

function encodeMessage(msgid, msg) {
    var msgBuf = msg.toBuffer();

    var header = new root.MessageHeader();
    header.setMsgId(msgid).setBodyLength(msgBuf.length);

    var headerBuf = header.toBuffer();

    var prefixBuf = new Buffer(1);
    prefixBuf.writeUInt8(headerBuf.length);

    return Buffer.concat([prefixBuf, headerBuf, msgBuf]);
}

function processMessage(socket, header, body) {
    var h = getHandlerById(header.msgId);
    if (!h) {
        log.error('No handler found for message id: ' + header.msgId);
        return;
    }

    h(socket, header, body);
}

exports.init = init;
exports.readMessageHeader = readMessageHeader;
exports.readMessageBody = readMessageBody;
exports.encodeMessage = encodeMessage;
exports.processMessage = processMessage;
