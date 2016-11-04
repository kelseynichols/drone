angular.module('DroneApp.directives', [])
    .directive('customNavbar', function () {
        return {
            templateUrl: 'directives/navbar.html',
            restrict: 'E',
            controller: ['$scope', '$rootScope', 'UserService', '$location', function ($scope, $rootScope, UserService, $location) {
                $rootScope.showLogin = true;
                $rootScope.hideLogout = true;
                var user = UserService.me().then(function(success) {
                    if (success) {
                        $rootScope.showLogin = false;
                        $rootScope.hideLogout = false;
                    }
                });

                $scope.logout = function () {
                    console.log('clicked logout');
                    UserService.logout().then(function (success) {
                        $rootScope.hideLogout = true;
                        $rootScope.showLogin = true;
                        $location.url('/');
                    });
                }

                $(window).scroll(function () {
                    var scrollPos = $(window).scrollTop(),
                        navbar = $('.nav-fluid');

                    if (scrollPos > 20) {
                        navbar.addClass('change-color');
                    } else {
                        navbar.removeClass('change-color');
                    }
                });
            }]
        };
    })
    .directive('createBuilding', function () {
        return {
            templateUrl: 'directives/createbuilding.html',
            restrict: 'E',
            controller: ['$scope', 'Buildings', 'UserService', function ($scope, Buildings, UserService) {
                var user = UserService.me().then(function (success) {
                    user = success.id;
                    $scope.buildings = Buildings.filter({ userid: success.id });
                });
                $scope.createBuilding = function () {
                    var buildingData = {
                        userid: user,
                        name: $scope.buildingName,
                        height: $scope.height,
                        width: $scope.width,
                        length: $scope.length
                    };
                    console.log(user);
                    var building = new Buildings(buildingData);
                    building.$save(function (success) {
                        console.log(success);
                    });
                }

            }]
        }
    })
    .directive('createRoute', function () {
        return {
            templateUrl: 'directives/createroute.html',
            restrict: 'E',
            controller: ['$scope', 'Buildings', 'UserService', 'Routes', function ($scope, Buildings, UserService, Routes) {
                var user = UserService.me().then(function (success) {
                    user = success.id;
                    $scope.buildings = Buildings.filter({ userid: success.id });
                });

                $scope.routeCommands = [];

                $scope.addRoute = function () {
                    console.log('clicked add route');
                    $scope.routeCommands.push({
                        command: $scope.selectedCommand,
                        amount: $scope.inputAmount
                    });
                }

                $scope.submitRoute = function () {
                    console.log('clicked submit route');
                    var commandString = JSON.stringify($scope.routeCommands);
                    var selectedBuilding;
                    try {
                        selectedBuilding = JSON.parse($scope.selectedBuilding);
                    } catch (err) {
                        console.log(err);
                        selectedBuilding = {};
                    }

                    var routeData = {
                        userid: user,
                        buildingid: selectedBuilding.id,
                        commands: commandString
                    }
                    var route = new Routes(routeData);
                    route.$save(function (success) {
                        console.log(success);
                    });
                }

                $scope.clearRoute = function () {
                    console.log('clicked claer route');
                    $scope.routeCommands = [];
                }

                $scope.changeBuilding = function () {
                    console.log($scope.selectedBuilding);
                    var selectedBuilding;
                    try {
                        selectedBuilding = JSON.parse($scope.selectedBuilding);
                    } catch (err) {
                        console.log(err);
                        selectedBuilding = {};
                    }
                    $(document).ready(function () {
                        console.log('in the jquery handler');
                        $('.routebuilding-shape').remove();
                        var createShape = function () {
                            console.log('creating shape');
                            var canvas = $('.buildingroutediv');
                            var Shape = function (width, height) {
                                this.width = width;
                                this.height = height;
                            }
                            Shape.prototype.draw = function () {
                                this.div = $('<div></div>');
                                this.div.addClass('routebuilding-shape');
                                this.div.css({
                                    position: "relative",
                                    background: "rgba(255,0,0,0.5)",
                                    width: (this.width * 10) + "px",
                                    height: (this.height * 10) + "px",
                                    top: "50px",
                                    left: "50px"
                                });
                                canvas.append(this.div);
                            }
                            var Rectangle = function (width, height) {
                                Shape.call(this, width, height);
                                this.cssClass = 'new-rectangle';
                                this.draw();
                            }
                            Rectangle.prototype = Object.create(Shape.prototype);
                            Rectangle.prototype.constructor = Rectangle;
                            function createRectangle() {
                                console.log('drawing building');
                                new Rectangle(selectedBuilding.width, selectedBuilding.length);
                            }
                            createRectangle();
                        }

                        createShape();
                    });

                }
            }]
        }
    })
