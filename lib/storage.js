// storage.js

var fs = require('fs');
var multer = require('multer');
var config = require('../config');
var log = require('./logger');

var upload = multer({
    dest: config.imageUploadDir
});

exports.saveSingleImage = function(req, res, next) {
    upload.single('image')(req, res, function(err) {
        if (err) {
            log.error(err);
            res.status(err.status).json({ message: err.message }).end();
            return;
        }

        log.debug('image saved: ', req.file);
        res.json({ message: 'ok' });
    });
};

exports.listImages = function(req, res, next) {
    fs.readdir(config.imageUploadDir, function(err, files) {
        if (err) {
            log.error(err);
            res.status(err.status).json({ message: err.message }).end();
            return;
        }

        res.json({ message: 'ok', images: files });
    });
};

exports.sendImage = function(name, res, next) {
    var options = {
        root: config.imageUploadDir,
    };
    res.type('png').sendFile(name, options, function(err) {
        if (err) {
            log.error(err);
            res.type('json').status(err.status).json({ message: err.message }).end();
            return;
        }

        log.debug('file sent: ', name);
    });
};
