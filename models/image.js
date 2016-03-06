// image.js

var db = require('../lib/db');
var sequelize = require('sequelize');

var Image = db.define('image', {
    md5: {
        type: sequelize.STRING,
        unique: true,
        primaryKey: true,
        allowNull: false,
        field: 'md5'
    },
    name: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'name'
    },
    path: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'path'
    }
});

module.exports = Image;
