// auth.js

var passport = require('passport');
var QQStrategy = require('passport-qq').Strategy;
var WechatStrategy = require('passport-wechat').Strategy;
var config = require('../config');
var log = require('./logger');

passport.use(new QQStrategy({
    clientID: config.qqAppKey,
    clientSecret: config.qqAppSecret,
    callbackURL: config.qqAuthCallback
}, function(accessToken, refreshToken, profile, done) {
    // TODO: update logic
    log.debug('qq login: ', profile);
    return done(null, profile);
}));

passport.use(new WechatStrategy({
    appid: config.wechatAppKey,
    appsecret: config.wechatAppSecret,
    callbackURL: config.wechatAuthCallback,
    scope: 'snsapi_base',
    state: true
}, function(openid, profile, token, done) {
    // TODO: update logic
    log.debug('wechat login: ', profile);
    return done(null, openid, profile);
}));

exports.ensureAuthenticated = function(req, res, next) {
    if (req.isAuthenticated())
        return next();

    // TODO: may return 401 status code and message then
    res.redirect('/');
}
