var db = require('../config/db');

exports.all = function() {
    return db.rows('GetRoutes');
}
exports.read = function(id) {
    return db.rows('GetRoute', [id]);
}
exports.create = function(userid, buildingid, commands) {
    return db.row('NewRoute', [userid, buildingid, commands]);
}