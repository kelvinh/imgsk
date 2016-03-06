// client.js

var fs = require('fs');
var net = require('net');
var path = require('path');
var protobuf = require('protobufjs');
var proto = require('../lib/proto');

var host = 'localhost';
var port = 8080;

function parseArgs() {
    var args = process.argv.slice(2);
    if (args[0] === '-h' || args[0] === '--help') {
        console.log('Usage: node client.js [host] [port]');
        process.exit(0);
    }

    if (args[0])
        host = args[0];

    if (args[1])
        port = args[1];
}

function processLoginRsp(conn, header, rsp) {
    if (rsp.ret != proto.messages.ErrorCode.Ok) {
        console.log('login failed, error code:', rsp.ret);
        return;
    }

    console.log('welcome user:', rsp.name);

    conn.heartbeatTimer = setInterval(function(socket) {
        console.log('send heartbeat');
        var heartbeat = new proto.messages.HeartbeatReq();
        var buf = proto.encodeMessage(proto.messages.MessageId.HeartbeatReq, heartbeat);
        socket.write(buf);
    }, 30000, conn.socket);

    shareImage(conn, './test.jpg');
}

function processFetchImageRsp(conn, header, rsp) {
    console.log('fetch result:', rsp.ret);
    if (rsp.ret == 0) {
        fs.writeFile('./downloads/' + rsp.name, rsp.image.toBuffer(), function(err) {
            if (err)
                throw err;

            console.log('image', rsp.name, 'saved.');
        });
    }
}

function processMessage(conn, header, body) {
    switch (header.msgId) {
    case proto.messages.MessageId.LoginRsp:
        processLoginRsp(conn, header, body);
        break;
    case proto.messages.MessageId.HeartbeatRsp:
        console.log('heartbeat rsp');
        break;
    case proto.messages.MessageId.ShareImageRsp:
        console.log('share result:', body.ret, ', id:', body.shareId);
        if (body.ret == 0)
            fetchImage(conn, body.shareId);
        break;
    case proto.messages.MessageId.FetchImageRsp:
        processFetchImageRsp(conn, header, body);
        break;
    case proto.messages.MessageId.ShareImageNotify:
        console.log('image', body.imageName, 'shared by:', body.userName);
        break;
    case proto.messages.MessageId.KickNotify:
        console.log('kicked, reason:', body.reason);
        break;
    default:
        console.log('unknown msgid:', header.msgId);
    }
}

function shareImage(conn, imagePath) {
    var filename = path.basename(imagePath);
    var content = fs.readFileSync(imagePath);

    var req = new proto.messages.ShareImageReq();
    req.setName(filename);
    req.setImage(content);
    req.setScope(proto.messages.ShareImageReq.ShareScope.User);

    var buf = proto.encodeMessage(proto.messages.MessageId.ShareImageReq, req);
    conn.socket.write(buf);
}

function fetchImage(conn, shareId) {
    var req = new proto.messages.FetchImageReq();
    req.setShareId(shareId);

    var buf = proto.encodeMessage(proto.messages.MessageId.FetchImageReq, req);
    conn.socket.write(buf);
}

function handleData(conn, data) {
    if (conn.msgBuffer)
        conn.msgBuffer = Buffer.concat([conn.msgBuffer, data]);
    else
        conn.msgBuffer = data;

    while (true) {
        // header has not been extracted
        if (!conn.msgHeader) {
            var headerLength = conn.msgBuffer[0];

            // received data length is less than the header length, continue
            if (conn.msgBuffer.length < headerLength + 1) {
                console.log('INCOMPLETE HEADER');
                return;
            }

            var rawHeader = conn.msgBuffer.slice(1, 1 + headerLength);
            conn.msgHeader = proto.readMessageHeader(rawHeader);
            if (!conn.msgHeader)
                // TODO: error handling
                return;

            // if there is no content left in buffer
            if (conn.msgBuffer.length - headerLength - 1 <= 0) {
                if (conn.msgHeader.bodyLength > 0) {
                    conn.msgBuffer = undefined;
                    return;
                }
            }

            conn.msgBuffer = conn.msgBuffer.slice(1 + headerLength);
        }

        // body has not been extracted
        if (!conn.msgBody) {
            var bodyLength = conn.msgHeader.bodyLength;
            if (conn.msgBuffer.length < bodyLength) {
                console.log('INCOMPLETE BODY');
                return;
            }

            var rawBody = conn.msgBuffer.slice(0, bodyLength);
            conn.msgBody = proto.readMessageBody(conn.msgHeader.msgId, rawBody);
            if (!conn.msgBody)
                // TODO: error handling
                return;

            // if there is no content left in buffer
            if (conn.msgBuffer.length - bodyLength <= 0)
                conn.msgBuffer = undefined;
            else
                conn.msgBuffer = conn.msgBuffer.slice(bodyLength);
        }

        processMessage(conn, conn.msgHeader, conn.msgBody);

        conn.msgHeader = undefined;
        conn.msgBody = undefined;

        if (!conn.msgBuffer)
            break;
    }
}

function cleanup(conn) {
    if (conn.heartbeatTimer)
        clearInterval(conn.heartbeatTimer);
}

function start() {
    parseArgs();
    proto.init();

    var client = new net.Socket();
    var conn = {};
    conn.socket = client;

    client.connect(port, host, function() {
        console.log('CONNECTED: ' + host + ':' + port);

        var login = new proto.messages.LoginReq();
        login.setEmail('i@a.com');
        login.setPassword('123');
        login.setDeviceId('iphone');
        var buf = proto.encodeMessage(proto.messages.MessageId.LoginReq, login);

        client.write(buf);
    });

    client.on('error', function(err) {
        if (err.syscall !== 'connect')
            throw err;

        switch (err.code) {
        case 'ECONNREFUSED':
            console.log('Failed to connect ' + host + ':' + port + ', server started?');
            process.exit(1);

        default:
            throw err;
        }
    });

    client.on('data', function(data) {
        handleData(conn, data);
    });

    client.on('close', function() {
        console.log('Connection closed.');
        cleanup(conn);
    });
}

start();
