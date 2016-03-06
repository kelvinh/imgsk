// server.js

var net = require('net');
var log = require('./logger');
var proto = require('./proto');

//
// it's a socket <-> user data map here, user data is
// an object, includes these fields:
//
// 1. disconnectTimer: disconnect the connection if no
//    heartbeat or not logged in for some time
//
// 2. msgBuffer: the buffer to store raw contents received
//    from client, for later parsing and handling
//
// 3. msgHeader: the message header parsed from msgBuffer
//
// 4. msgBody: the message body parsed from msgBuffer
//
// 5. context: the context of a logged in user, includes:
//    1) user: the User model instance
//    2) device: the Device model instance
//
// example:
//
// connections = {
//     '127.0.0.1:12345': {
//         disconnectTimer: timer handle,
//         msgBuffer: Buffer instance,
//         msgHeader: instance of proto.messages.MessageHeader,
//         msgBody: the message under namespace proto.messages,
//         context: {
//             user: instance of User,
//             device: instance of Device
//         }
//     },
//     '127.0.0.1:54321': {
//         ...
//     }
// };
//
var connections = {};

//
// the object is something like:
//
// {
//     user1_email: {
//         device1_id: socket1,
//         device2_id: socket2
//     },
//     user2_email: {
//         ...
//     }
// };
//
// because object connections stores socket -> user
// mapping relationship, then this object stores
// user(device) -> socket mapping relationship
//
var users = {};

function addContext(user, device, socket) {
    var item = users[user.email];

    if (!item) {
        item = users[user.email] = {};
        item[device.id] = socket;
    } else {
        if (item[device.id])
            kick(item[device.id], proto.messages.KickNotify.Reason.Relogin);

        item[device.id] = socket;
    }

    var conn = getConnection(socket);
    var ctx = conn.context;
    if (!ctx)
        ctx = conn.context = {};

    ctx.user = user;
    ctx.device = device;
}

function getContext(socket) {
    var conn = getConnection(socket);
    if (!conn)
        return undefined;

    return conn.context;
}

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
    var conn = getConnection(socket);
    if (conn) {
        if (conn.disconnectTimer)
            clearTimeout(conn.disconnectTimer);

        if (conn.user) {
            var user = users[conn.user.email];
            if (user && conn.device)
                user[conn.device.id] = undefined;
        }
    }

    delConnection(socket);
    socket.end();
}

function kick(socket, reason) {
    var notify = new proto.messages.KickNotify();
    notify.setReason(reason);

    sendMessage(socket, proto.messages.MessageId.KickNotify, notify);
    disconnect(socket);
}

function timeoutHandler(socket) {
    log.debug('TIMEOUT: ' + socketString(socket));
    kick(socket, proto.messages.KickNotify.Reason.Timeout);
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

        // TODO: check if the user has logged in here, disconnect if
        // not logged in and the message is not login request
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
            handleData(socket, data);
        });

        socket.on('end', function() {
            log.debug('DISCONNECTED: ' + socketString(socket));
            disconnect(socket);
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
exports.addContext = addContext;
exports.getContext = getContext;
exports.socketString = socketString;
exports.refreshTimer = refreshTimer;
exports.sendMessage = sendMessage;
exports.disconnect = disconnect;
