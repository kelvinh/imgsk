// user.js

var db = require('../lib/db');
var sequelize = require('sequelize');

var User = db.define('user', {
    email: {
        type: sequelize.STRING,
        unique: true,
        primaryKey: true,
        allowNull: false,
        field: 'email'
    },
    name: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'name'
    },
    password: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'password'
    }
});

module.exports = User;
