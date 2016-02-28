// config.js

var config = {
    debug: true,

    logName: 'logs/mushroom.log',
    logLevel: 'debug',

    host: '0.0.0.0',
    port: 8080,

    connectTimeout: 5000, // 5 sec
    heartbeatTimeout: 60000, // 60 sec

    dbHost: 'localhost',
    dbPort: 3306,
    dbName: 'mushroom',
    dbUser: 'root',
    dbPassword: '',
    dbMaxConn: 5,
    dbMaxIdleTime: 10000,


    // below fields are obsolete

    imageUploadDir: './uploads/',
    sessionSecret: 'sillykelvin',

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
