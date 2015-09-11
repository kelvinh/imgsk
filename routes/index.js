// index.js

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({
      message: "hello stranger, api is available at /api/xxx."
  });
});

module.exports = router;
