// index.js

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    if (req.isAuthenticated())
        res.json({
            message: "hello, user: " + req
        }).end();
    else
        res.json({
            message: "hello stranger, please login through /api/auth/qq or /api/auth/wechat."
        }).end();
});

module.exports = router;
