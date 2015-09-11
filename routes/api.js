// api.js

var express = require('express');
var router = express.Router();
var storage = require('../lib/storage');

router.get('/images', function(req, res, next) {
    storage.listImages(req, res, next);
});

router.post('/upload', function(req, res, next) {
    storage.saveSingleImage(req, res, next);
});

router.get('/form', function(req, res, next) {
    res.send('<form method="post" enctype="multipart/form-data" action="/api/upload"><input type="file" name="image"/><input type="submit"/></form>');
});

module.exports = router;
