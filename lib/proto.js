// proto.js

var protobuf = require('protobufjs');
var mushroom = protobuf.loadProtoFile('proto/mushroom.proto');
var messageHeader = mushroom.build('mushroom.MessageHeader');
// TODO: build a msgid -> type mapping here
var heartbeatReq = mushroom.build('HeartbeatReq');

function readMessageHeader(buffer) {
    var header;

    try {
        header = messageHeader.decode(buffer);
    } catch (e) {
        log.error('DECODE FAILURE: ' + e);
        return undefined;
    }

    return header;
}

function readMessageBody(msgid, buffer) {
    // TODO: we need a msgid -> type mapping here
    var body;

    try {
        body = heartbeatReq.decode(buffer);
    } catch (e) {
        log.error('DECODE FAILURE: ' + e);
        return undefined;
    }

    return body;
}

function processMessage(socket, msgid, header, body) {
    // TODO: need a msgid -> handler mapping here
}

exports.readMessageHeader = readMessageHeader;
exports.readMessageBody = readMessageBody;
