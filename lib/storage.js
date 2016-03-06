// storage.js

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var config = require('../config');
var log = require('./logger');
var Image = require('../models/image');

function calcPath(md5) {
    var dir = config.storeDir;
    return path.join(dir, md5);
}

function saveImage(imageName, imageContent, callback) {
    var md5 = crypto.createHash('md5').update(imageContent).digest('hex');
    var savePath = calcPath(md5);

    Image.findOrCreate({
        where: {
            md5: md5,
            name: imageName,
            path: savePath
        }
    }).spread(function(image, created) {
        if (!created) {
            log.info('image:', imageName, '(' + md5 + ')', 'exists');
            callback(undefined, md5);
        } else {
            fs.writeFile(calcPath(md5), imageContent, function(err) {
                callback(err, md5);
            });
        }
    }).catch(function(err) {
        log.error(err);
        callback(err);
        return;
    });
};

function loadImage(path, callback) {
    fs.readFile(path, callback);
};

exports.saveImage = saveImage;
exports.loadImage = loadImage;
