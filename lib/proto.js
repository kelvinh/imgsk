// proto.js

var protobuf = require('protobufjs');
var log = require('./logger');
var mushroom = protobuf.loadProtoFile('proto/mushroom.proto');
var root = mushroom.build('mushroom');

var messages = {};

function getMessageById(msgid) {
    return messages[msgid];
}

function init() {
    for (var k in root.MessageId) {
        if (!root[k])
            throw new Error('Message id ' + k + ' defined, but message not defined.');

        log.debug('REGISTER: ' + root.MessageId[k] + ' => ' + k);
        messages[root.MessageId[k]] = root[k];
    }
}

function readMessageHeader(buffer) {
    try {
        return root.MessageHeader.decode(buffer);
    } catch (e) {
        log.error('DECODE FAILURE: ' + e);
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
        log.error('DECODE FAILURE: ' + e);
        return undefined;
    }
}

function processMessage(socket, header, body) {
    // TODO: need a msgid -> handler mapping here
}

exports.init = init;
exports.readMessageHeader = readMessageHeader;
exports.readMessageBody = readMessageBody;
exports.processMessage = processMessage;
