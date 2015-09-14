// api.js

var express = require('express');
var passport = require('passport');
var router = express.Router();
var storage = require('../lib/storage');
var config = require('../config');
var auth = require('../lib/auth');

router.get('/auth/qq', passport.authenticate('qq'), function(req, res) {
    log.debug('doing qq authentication: ', req);
});

router.get('/auth/qq/callback', passport.authenticate('qq', { failureRedirect: '/' }), function(req, res) {
    res.json({ message: 'qq login ok' }).end();
});

router.get('/auth/wechat', passport.authenticate('wechat'), function(req, res) {
    log.debug("doing wechat authentication: ", req);
});

router.get('/auth/wechat/callback', passport.authenticate('wechat', { failureRedirect: '/' }), function(req, res) {
    res.json({ message: 'wechat login ok' }).end();
});

router.get('/images', auth.ensureAuthenticated, function(req, res, next) {
    storage.listImages(req, res, next);
});

router.get('/image/:name', auth.ensureAuthenticated, function(req, res, next) {
    storage.sendImage(req.params.name, res, next);
});

router.post('/upload', auth.ensureAuthenticated, function(req, res, next) {
    storage.saveSingleImage(req, res, next);
});

if (config.debug) {
    router.get('/form', auth.ensureAuthenticated, function(req, res, next) {
        res.send('<form method="post" enctype="multipart/form-data" action="/api/upload"><input type="file" name="image"/><input type="submit"/></form>');
    });
}

module.exports = router;
