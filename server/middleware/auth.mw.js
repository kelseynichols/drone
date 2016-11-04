exports.isLoggedIn = function(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
}

exports.isAdmin = function(req, res, next) {
    if (req.user.role === 'admin') {
        console.log(req.user);
        next();
    } else {
        console.log(req.user);
        res.sendStatus(401);
    }
}