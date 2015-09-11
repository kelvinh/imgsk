// app.js

var config = require('./config');
var express = require('express');
var httpLogger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var http = require('http');
var log = require('./lib/logger');
var web = require('./routes/index');
var api = require('./routes/api');

var app = express();

if (config.debug) {
    app.use(httpLogger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', web);
app.use('/api', api);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (config.debug) {
    app.use(errorhandler());
} else {
    app.use(function(err, req, res, next) {
        var status = err.status || 500;
        log.error('server error, status: ' + status + ', error: ' + err);
        res.status(status);
        res.json({ message: err.message });
    });
}

// TODO: remove openshift config
var port = process.env.OPENSHIFT_NODEJS_PORT || config.port;
var addr = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
app.set('port', port);

var server = http.createServer(app);
server.listen(port, addr);
server.on('error', function(err) {
    if (err.syscall !== 'listen') {
        throw err;
    }

    switch (err.code) {
    case 'EACCES':
        log.error('Port ' + port + ' requires elevated privileges.');
        process.exit(1);
        break;
    case 'EADDRINUSE':
        log.error('Port ' + port + ' is already in use.');
        process.exit(1);
        break;
    default:
        throw err;
    }
});

server.on('listening', function() {
    var addr = server.address();
    log.info('Listening on ' + addr.address + ':' + addr.port);
});

module.exports = app;
