var express = require('express');
var procedures = require('../procedures/routes.proc');
var passport = require('passport');
var utils = require('../utils');
var auth = require('../middleware/auth.mw');

var router = express.Router();

router.route('/')
    .get(function(req, res) {
        procedures.all().then(function(routes) {
            res.send(routes);
        }, function(err) {
            console.log(err);
            res.sendStatus(500);
        });
    })
    .post(function(req, res) {
        console.log(req.body);
        procedures.create(req.body.userid, req.body.buildingid, req.body.commands, req.body.heights).then(function(route) {
            console.log(route);
            res.send(route);
        }, function(err) {
            console.log(err);
            res.sendStatus(500);
        })
    });

router.route('/user/:userid')
    .get(function(req, res) {
        procedures.read(req.params.userid).then(function(routes) {
            routes.forEach(function(route) {
                try {
                    var array = JSON.parse(route.commands);
                    route.commands = array;
                } catch (err) {
                    console.log(err);
                    route.commands = [];
                }
            }); 
            res.send(routes);
        }, function(err) {
            console.log(err);
            res.sendStatus(500);
        });
    });

router.route('/building/:buildingid')
    .get(function(req, res) {
        procedures.read(req.params.buildingid).then(function(routes) {
            routes.forEach(function(route) {
                try {
                    var array = JSON.parse(route.commands);
                    var height = JSON.parse(route.heights);
                    route.commands = array;
                    route.heights = height;
                } catch (err) {
                    console.log(err);
                    route.commands = [];
                }
            }); 
            res.send(routes);        
        }, function(err) {
            console.log(err);
            res.status(500).send(err);
        })
    });

router.route('/:id')
    .get(function(req, res) {
        procedures.find(req.params.id).then(function(route) {
            res.send(route);
        }, function(err) {
            console.log(err);
            res.sendStatus(500);
        });
    });

module.exports = router;