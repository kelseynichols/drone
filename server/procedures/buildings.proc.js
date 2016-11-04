var db = require('../config/db');

exports.all = function() {
    return db.rows('GetBuildings');
}
exports.read = function(id) {
    return db.rows('GetBuilding', [id]);
}
exports.create = function(userid, name, height, width, length) {
    return db.row('NewBuilding', [userid, name, height, width, length]);
}