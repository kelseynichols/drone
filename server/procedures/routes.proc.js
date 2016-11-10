var db = require('../config/db');

exports.all = function() {
    return db.rows('GetRoutes');
}
exports.read = function(id) {
    return db.rows('GetRoute', [id]);
}
exports.find = function(id) {
    return db.rows('GetRouteById', [id]);
}
exports.create = function(userid, buildingid, commands, heights) {
    return db.row('NewRoute', [userid, buildingid, commands, heights]);
}