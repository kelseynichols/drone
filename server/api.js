var express = require('express');
var users = require('./controllers/users.ctrl');
var buildings = require('./controllers/buildings.ctrl');
var routes = require('./controllers/routes.ctrl');
var appServer = require('./app-server/index.js');

var router = express.Router();

router.use(function(req, res, next) {
    next();
});

router.use('/users', users);
router.use('/buildings', buildings);
router.use('/routes', routes);
router.use('/flyroute', appServer);

module.exports = router;