var express = require('express');
var users = require('./controllers/users.ctrl');
var buildings = require('./controllers/buildings.ctrl');
var routes = require('./controllers/routes.ctrl');

var router = express.Router();

router.use(function(req, res, next) {
    next();
});

router.use('/users', users);
router.use('/buildings', buildings);
router.use('/routes', routes);

module.exports = router;