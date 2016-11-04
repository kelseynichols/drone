angular.module('DroneApp.services', [])
.service('UserService', ['$http', '$location', function($http, $location) {
    var user;
    this.isLoggedIn = function() {
        if (user) {
            return true;
        } else {
            return false;
        }
    }
    this.requireLogin = function() {
        if (!this.isLoggedIn()) {
            var current = $location.path();
            $location.path('/login').search('p', current);
        }
    }
    this.login = function(email, password) {
        return $http({
            method: 'POST',
            url: '/api/users/login',
            data: { email: email, password: password }
        }).then(function(success) {
            user = success.data;
            return success.data;
        });
    }
    this.logout = function() {
        return $http({
            method: 'GET',
            url: '/api/users/logout'
        }).then(function(success) {
            console.log('logging out');
            user = undefined;
        });
    }
    this.me = function() {
        if (user) {
            return Promise.resolve(user);
        } else {
            return $http({
                url: '/api/users/me'
            }).then(function(success) {
                user = success.data;
                return success.data;
            });
        }
    }
}])

.service('SEOService', ['$rootScope', function($rootScope) {
    this.setSEO = function(data) {
        $rootScope.seo = {};
        for (var p in data) {
            $rootScope.seo[p] = data[p];
        }
    }
}]);