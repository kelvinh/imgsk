// server.js

var net = require('net');
var log = require('./logger');
var proto = require('./proto');

var connections = {};

function getConnection(socket) {
    return connections[socketString(socket)];
}

function setConnection(socket) {
    var conn = getConnection(socket);
    if (conn)
        return conn;

    conn = connections[socketString(socket)] = {};
    return conn;
}

function delConnection(socket) {
    connections[socketString(socket)] = undefined;
}

function socketString(socket) {
    return socket.remoteAddress + ':' + socket.remotePort;
}

function handleData(socket, data) {
    var conn = getConnection(socket);
    if (!conn) {
        log.error('NO CONNECTION: ' + socketString(socket));
        // TODO: error handling
        return;
    }

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
                log.debug('INCOMPLETE HEADER: ' + socketString(socket));
                return;
            }

            var rawHeader = conn.msgBuffer.slice(1, headerLength);
            conn.msgHeader = proto.readMessageHeader(rawHeader);
            if (!conn.msgHeader)
                // TODO: error handling
                return;

            var left = conn.msgBuffer.length - headerLength - 1;
            if (left <= 0) {
                conn.msgBuffer = undefined;
                return;
            }

            conn.msgBuffer = conn.msgBuffer.slice(1 + headerLength, left);
        }

        // body has not been extracted
        if (!conn.msgBody) {
            var bodyLength = conn.msgHeader.bodyLength;
            if (conn.msgBuffer.length < bodyLength) {
                log.debug('INCOMPLETE BODY: ' + socketString(socket));
                return;
            }

            var rawBody = conn.msgBuffer.slice(0, bodyLength);
            conn.msgBody = proto.readMessageBody(conn.msgHeader.msgId, rawBody);
            if (!conn.msgBody)
                // TODO: error handling
                return;

            var left = conn.msgBuffer.length - bodyLength;
            if (left <= 0)
                conn.msgBuffer = undefined;
            else
                conn.msgBuffer = conn.msgBuffer.slice(bodyLength, left);
        }

        proto.processMessage(socket, conn.msgHeader, conn.msgBody);

        conn.msgHeader = undefined;
        conn.msgBody = undefined;

        if (!conn.msgBuffer)
            break;
    }
}

function start(config) {
    var svr = net.createServer();
    svr.on('connection', function(socket) {
        log.debug('CONNECTED: ' + socketString(socket));

        var conn = setConnection(socket);
        conn.connectTimer = setTimeout(function(socket) {
            log.debug('TIMEOUT: ' + socketString(socket));
            delConnection(socket);
            socket.end();
        }, config.connectTimeout, socket);

        socket.on('data', function(data) {
            log.debug('DATA: ' + data.toString());
            handleData(socket, data);
        });

        socket.on('end', function() {
            log.debug('DISCONNECTED: ' + socketString(socket));
            delConnection(socket);
        });
    });

    svr.on('error', function(err) {
        if (err.syscall !== 'listen')
            throw err;

        switch (err.code) {
        case 'EACCES':
            log.error('Port ' + config.port + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log.error('Port ' + config.port + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw err;
        }
    });

    svr.on('listening', function() {
        var addr = svr.address();
        log.info('Listening on ' + addr.address + ':' + addr.port);
    });

    proto.init();

    svr.listen({
        host: config.host,
        port: config.port
    });
}

exports.start = start;
