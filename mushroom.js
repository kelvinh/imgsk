// mushroom.js

var config = require('./config');
var server = require('./lib/server');
var db = require('./lib/db');
var log = require('./lib/logger');
var User = require('./models/user');
var Image = require('./models/image');
var Device = require('./models/device');
var Share = require('./models/share');
var UserDevice = require('./models/user-device');

if (config.debug) {
    log.info('recreating tables...');
    db.sync({
        force: true,
        logging: log.debug
    }).then(function() {
        log.info('tables recreated.');

        var user = User.build({
            name: 'kelvin',
            email: 'i@a.com',
            password: '123'
        });
        user.save().then(function() {
            log.info('user', user.name, 'saved.');
        }).catch(function(err) {
            log.error('failed to save user', user.name);
        });

        var device = Device.build({
            id: 'android'
        });
        device.save().then(function() {
            log.info('device', device.id, 'saved.');
        }).catch(function(err) {
            log.error('failed to save device', device.id);
        });

        user.addDevice(device);

        var image = Image.build({
            md5: 'abcdefg',
            name: 'test.jpg',
            path: 'upload/test.jpg'
        });
        image.save().then(function() {
            log.info('image', image.path, 'saved.');
        }).catch(function(err) {
            log.error('failed to save image', image.path);
        });

        var share = Share.build({
            startTime: new Date(),
            scope: 1,
            userEmail: user.email,
            deviceId: device.id,
            imageMd5: image.md5
        });

        share.save().then(function() {
            log.info('share', share.id, 'saved.');
        }).catch(function(err) {
            log.error('failed to save share', err);
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
