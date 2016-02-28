// user-device.js

var db = require('../lib/db');
var sequelize = require('sequelize');
var User = require('./user');
var Device = require('./device');

var UserDevice = db.define('user_device', {});

User.belongsToMany(Device, {
    through: UserDevice,
    foreignKey: 'user_email'
});

Device.belongsToMany(User, {
    through: UserDevice,
    foreignKey: 'device_id'
});

module.exports = UserDevice;
