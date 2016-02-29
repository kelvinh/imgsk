// share.js

var db = require('../lib/db');
var sequelize = require('sequelize');
var User = require('./user');
var Device = require('./device');
var Image = require('./image');

var Share = db.define('share', {
    id: {
        type: sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        field: 'id'
    },
    startTime: {
        type: sequelize.DATE,
        allowNull: false,
        field: 'start_time'
    },
    scope: {
        type: sequelize.INTEGER,
        allowNull: false,
        field: 'scope'
    }
});

User.hasMany(Share, {
    foreignKey: {
        name: 'userEmail',
        field: 'user_email',
        allowNull: false
    }
});

Device.hasMany(Share, {
    foreignKey: {
        name: 'deviceId',
        field: 'device_id',
        allowNull: false
    }
});

Image.hasMany(Share, {
    foreignKey: {
        name: 'imageMd5',
        field: 'image_md5',
        allowNull: false
    }
});

Share.belongsTo(User, {
    foreignKey: {
        name: 'userEmail',
        field: 'user_email',
        allowNull: false
    }
});

Share.belongsTo(Device, {
    foreignKey: {
        name: 'deviceId',
        field: 'device_id',
        allowNull: false
    }
});

Share.belongsTo(Image, {
    foreignKey: {
        name: 'imageMd5',
        field: 'image_md5',
        allowNull: false
    }
});

module.exports = Share;
