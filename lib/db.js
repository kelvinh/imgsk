// db.js

var Sequelize = require('sequelize');
var config = require('../config');
var log = require('./logger');

var sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPassword, {
    host: config.dbHost,
    port: config.dbPort,
    dialect: 'mysql',
    logging: log.debug,

    pool: {
        maxConnections: config.dbMaxConn,
        minConnections: 0,
        maxIdleTime: config.dbMaxIdleTime
    },

    define: {
        charset: 'utf8',
        freezeTableName: true
    }
});

module.exports = sequelize;
