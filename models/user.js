// user.js

var db = require('../lib/db');
var sequelize = require('sequelize');

var User = db.define('user', {
    id: {
        type: sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    name: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'name'
    },
    email: {
        type: sequelize.STRING,
        unique: true,
        allowNull: false,
        field: 'email'
    },
    password: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'password'
    }
});

module.exports = User;
