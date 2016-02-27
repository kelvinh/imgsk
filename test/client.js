// client.js

var net = require('net');
var protobuf = require('protobufjs');
var mushroom = protobuf.loadProtoFile('../proto/mushroom.proto');
var root = mushroom.build('mushroom');

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

function encodeMessage(msgid, msg) {
    var msgBuf = msg.toBuffer();

    var header = new root.MessageHeader();
    header.setMsgId(msgid).setBodyLength(msgBuf.length);

    var headerBuf = header.toBuffer();

    var prefixBuf = new Buffer(1);
    prefixBuf.writeUInt8(headerBuf.length);

    return Buffer.concat([prefixBuf, headerBuf, msgBuf]);
}

function start() {
    parseArgs();

    var client = new net.Socket();

    client.connect(port, host, function() {
        console.log('CONNECTED: ' + host + ':' + port);

        var login = new root.LoginReq();
        var buf = encodeMessage(root.MessageId.LoginReq, login);

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
        console.log('DATA: ' + data);
        client.destroy();
    });

    client.on('close', function() {
        console.log('Connection closed.');
    });
}

start();
