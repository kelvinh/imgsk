// user-image.js

var db = require('../lib/db');
var sequelize = require('sequelize');
var User = require('./user');
var Image = require('./image');

var UserImage = db.define('user_image', {});

User.belongsToMany(Image, {
    through: UserImage,
    foreignKey: 'user_email'
});

Image.belongsToMany(User, {
    through: UserImage,
    foreignKey: 'image_md5'
});

module.exports = UserImage;
