angular.module('DroneApp.factories', [])
.factory('Users', ['$resource', function($resource) {
    return $resource('http://localhost:3000/api/users/:id', { id:'@id' });
}])
.factory('Buildings', ['$resource', function($resource) {
    return $resource('http://localhost:3000/api/buildings/:id', { id:'@id' }, {
        filter: {
            url: 'http://localhost:3000/api/buildings/user/:userid',
            method: 'GET',
            isArray: true
        }
    });
}])
.factory('Routes', ['$resource', function($resource) {
    return $resource('http://localhost:3000/api/routes/:id', { id:'@id' }, {
        filter: {
            url: 'http://localhost:3000/api/routes/user/:userid',
            method: 'GET',
            isArray: true
        },
        building: {
            url: 'http://localhost:3000/api/routes/building/:buildingid',
            method: 'GET',
            isArray: true
        }
    });
}])