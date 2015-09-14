// config.js

var config = {
    debug: true,
    port: 8080,
    logLevel: 'debug',
    imageUploadDir: './uploads/',
    sessionSecret: 'sillykelvin',
    qqAppKey: '',
    qqAppSecret: '',
    qqAuthCallback: 'http://127.0.0.1:8080/api/auth/qq/callback',
    wechatAppKey: '',
    wechatAppSecret: '',
    wechatAuthCallback: 'http://127.0.0.1:8080/api/auth/wechat/callback'
};

module.exports = config;
