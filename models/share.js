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
        name: 'user_email',
        allowNull: false
    }
});

Device.hasMany(Share, {
    foreignKey: {
        name: 'device_id',
        allowNull: false
    }
});

Image.hasMany(Share, {
    foreignKey: {
        name: 'image_md5',
        allowNull: false
    }
});

Share.belongsTo(User, {
    foreignKey: {
        name: 'user_email',
        allowNull: false
    }
});

Share.belongsTo(Device, {
    foreignKey: {
        name: 'device_id',
        allowNull: false
    }
});

Share.belongsTo(Image, {
    foreignKey: {
        name: 'image_md5',
        allowNull: false
    }
});

module.exports = Share;
