var db = require('../config/db');

exports.all = function() {
    return db.rows('GetUsers');
}
exports.read = function(id) {
    return db.row('GetUser', [id]);
}
exports.readByEmail = function(email) {
    return db.row('GetUserByEmail', [email]);
}
exports.create = function(firstname, lastname, email, password) {
    return db.row('NewUser', [firstname, lastname, email, password]);
}
