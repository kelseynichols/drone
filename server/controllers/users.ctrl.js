var express = require('express');
var procedures = require('../procedures/users.proc');
var passport = require('passport');
var utils = require('../utils');
var auth = require('../middleware/auth.mw')

var router = express.Router();

router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            console.log(err);
            res.sendStatus(500);
        }
        if (!user) {
            console.log(info);
            res.status(401).send(info);
        }
        req.logIn(user, function(err) {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            } else {
                return res.send(user);
            }
        });
    })(req, res, next);
});
router.get('/logout', function(req, res) {
    console.log('logging out');
    req.session.destroy(function() {
        req.logOut();
        res.sendStatus(204);
    })
})

router.route('/')
    .get(function(req, res) {
        procedures.all().then(function(users) {
            res.send(users);
        }, function(err) {
            res.status(500).send(err);
        })
    })
    .post(function(req, res) {
        var u = req.body;
        utils.encryptPassword(u.password).then(function(hash) {
            return procedures.create(u.firstname, u.lastname, u.email, hash);
        }).then(function(id) {
            res.send(id);
        }).catch(function(err) {
            res.status(500).send(err);
        });
    });

router.all('*', auth.isLoggedIn);

router.get('/me', function(req, res) {
    res.send(req.user);
});

router.route('/:id')
    .get(function(req, res) {
        procedures.read(req.params.id).then(function(user) {
            res.send(user);
        }, function(err) {
            console.log(err);
            res.sendStatus(500);
        })
    })    

module.exports = router;