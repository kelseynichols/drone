angular.module('DroneApp', ['ngRoute', 'ngResource', 'DroneApp.controllers', 'DroneApp.factories', 'DroneApp.services', 'DroneApp.directives'])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
    .when('/', {
        templateUrl: 'views/welcome.html',
        controller: 'WelcomeController'
    })
    .when('/info', {
        templateUrl: 'views/info.html',
        controller: 'InfoController'
    })
    .when('/past_work', {
        templateUrl: 'views/pastWork.html',
        controller: 'PastWorkController'
    })
    .when('/login', {
        templateUrl: 'views/logIn.html',
        controller: 'LoginController'
    })
    .when('/contact', {
        templateUrl: 'views/contact.html',
        controller: 'ContactController'
    })
    .when('/account_home', {
        templateUrl: 'views/account.html',
        controller: 'AccountController'
    })
    .when('/register', {
        templateUrl: 'views/register.html',
        controller: 'RegisterController'
    })
    .otherwise({
        redirectTo: '/'
    })
}]);