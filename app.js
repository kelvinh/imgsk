// app.js

var config = require('./config');
var express = require('express');
var httpLogger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var session = require('express-session');
var passport = require('passport');
var auth = require('./lib/auth.js');
var http = require('http');
var log = require('./lib/logger');
var web = require('./routes/index');
var api = require('./routes/api');
var db = require('./lib/db');
var userModel = require('./models/user');
var imageModel = require('./models/image');
var userImageModel = require('./models/user-image');

passport.serializeUser(function(user, done) {
    log.debug('serializeUser: ', user);
    // TODO complete the logic here
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    log.debug('deserializeUser: ', obj);
    // TODO complete the logic here
    done(null, obj);
});

var app = express();

if (config.debug) {
    app.use(httpLogger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

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

// under debug mode, we drop all tables and re-create them; under
// production mode, we only test if connection can be established.
//
// TODO: currently the application can still run even if there is
// error connecting database, the control flow should be chained,
// the followed steps should only continue when there is no error.
if (config.debug) {
    log.debug('re-creating tables...');
    db.sync({ force: true }).then(function() {
        log.debug('tables re-created.');
    }).catch(function(err) {
        log.error('table re-creation error: ', err);
    });
} else {
    log.debug('test db connection...');
    db.authenticate().then(function() {
        log.debug('db connected.');
    }).catch(function(err) {
        log.error('db connection error: ', err);
    });
}

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
