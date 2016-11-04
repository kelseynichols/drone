var express = require('express');
var procedures = require('../procedures/buildings.proc');
var passport = require('../config/passport');
var utils = require('../utils');
var auth = require('../middleware/auth.mw');

var router = express.Router();

router.all('*', auth.isLoggedIn);

router.route('/')
    .get(function(req, res) {
        procedures.all().then(function(buildings) {
            res.send(buildings);
        }, function(err) {
            res.status(500).send(err);
        })
    })
    .post(function(req, res) {
        procedures.create(req.body.userid, req.body.name, req.body.height, req.body.width, req.body.length).then(function(building) {
            res.send(building);
        }, function(err) {
            console.log(err);
            res.status(500).send(err);
        });
    });

router.route('/building/:buildingid')
    .get(function(req, res) {
        procedures.read(req.params.id).then(function(building) {
            res.send(building);
        }, function(err) {
            res.status(500).send(err);
        });
    });

router.route('/user/:userid')
    .get(function(req, res) {
        procedures.read(req.params.userid).then(function(route) {
            res.send(route);
        }, function(err) {
            res.status(500).send(err);
        });
    });

router.route('/:id')
    .get(function(req, res) {
        procedures.read(req.params.id).then(function(building) {
            res.send(building);
        }, function(err) {
            res.status(500).send(err);
        });
    });

module.exports = router;