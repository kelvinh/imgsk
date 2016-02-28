// device.js

var db = require('../lib/db');
var sequelize = require('sequelize');

var Device = db.define('device', {
    id: {
        type: sequelize.STRING,
        unique: true,
        primaryKey: true,
        allowNull: false,
        field: 'id'
    }
});

module.exports = Device;
