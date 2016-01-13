// config.js

var config = {
    debug: true,
    port: 8080,
    logLevel: 'debug',
    imageUploadDir: './uploads/',
    sessionSecret: 'sillykelvin',

    dbHost: 'localhost',
    dbPort: 3306,
    dbName: 'imgsk',
    dbUser: 'root',
    dbPassword: '',
    dbMaxConn: 5,
    dbMaxIdleTime: 10000,

    qqAuthEnabled: false,
    qqAppKey: '',
    qqAppSecret: '',
    qqAuthCallback: 'http://127.0.0.1:8080/api/auth/qq/callback',

    wechatAuthEnabled: false,
    wechatAppKey: '',
    wechatAppSecret: '',
    wechatAuthCallback: 'http://127.0.0.1:8080/api/auth/wechat/callback'
};

module.exports = config;
