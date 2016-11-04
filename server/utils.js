var bcrypt = require('bcrypt');
var saltRounds = 12;

exports.encryptPassword = function(pw) {
    return new Promise(function(resolve, reject) {
        bcrypt.hash(pw, saltRounds, function(err, hash) {
            if (err) {
                reject(err);
            } else {
                resolve(hash);
            }
        });
    });
}

exports.checkPassword = function(pw, hash) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(pw, hash, function(err, passwordMatches) {
            if (err) {
                reject(err);
            } else {
                resolve(passwordMatches);
            }
        });
    });
}