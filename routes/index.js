var express = require('express');
var router = express.Router();

var uploadManager = require('./uploadManager')(router);

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'advanced pdf/jpg to pdf' });
});

/* GET error pages. */
router.get('/convertingerror', function(req, res) {
  res.render('convertererror', { title: 'Error converting' });
});

router.get('/downloaderror', function(req, res) {
  res.render('downloaderror', { title: 'Error downloading' });
});




module.exports = router;
