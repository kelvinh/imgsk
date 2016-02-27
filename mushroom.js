// mushroom.js

var config = require('./config');
var server = require('./lib/server');
var db = require('./lib/db');
var log = require('./lib/logger');
var User = require('./models/user');
var Image = require('./models/image');
var UserImage = require('./models/user-image');

if (config.debug) {
    log.info('recreating tables...');
    db.sync({
        force: true
    }).then(function() {
        log.info('tables recreated.');
        return User.create({
            name: 'kelvin',
            email: 'i@a.com',
            password: '123'
        });
    }).catch(function(err) {
        log.error('table recreation error: ', err);
    });
} else {
    log.info('test db connection...');
    db.authenticate().then(function() {
        log.info('db connected.');
    }).catch(function(err) {
        log.error('db connection error: ', err);
    });
}

server.start(config);
