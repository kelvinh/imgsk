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

function disconnect(socket) {
    delConnection(socket);
    socket.end();
}

function timeoutHandler(socket) {
    log.debug('TIMEOUT: ' + socketString(socket));
    // TODO: may send a kick notify here, tell client the reason
    disconnect(socket);
}

function refreshTimer(socket, delay) {
    var conn = getConnection(socket);
    if (!conn) {
        log.error('Connection not found: ' + socketString(socket));
        return;
    }

    if (conn.disconnectTimer)
        clearTimeout(conn.disconnectTimer);

    conn.disconnectTimer = setTimeout(timeoutHandler, delay, socket);
}

function sendMessage(socket, msgid, msg) {
    var buf = proto.encodeMessage(msgid, msg);
    socket.write(buf);
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
                log.debug('INCOMPLETE BODY: ' + socketString(socket));
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
        refreshTimer(socket, config.connectTimeout);

        socket.on('data', function(data) {
            log.debug('DATA: ', data);
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
exports.socketString = socketString;
exports.refreshTimer = refreshTimer;
exports.sendMessage = sendMessage;
exports.disconnect = disconnect;
