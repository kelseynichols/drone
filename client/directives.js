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
                var map;
                $scope.mapVertices = [];
                var markers = [];
                function initMap() {
                    map = new google.maps.Map(document.getElementById('map'), {
                    center: {lat: 33.511695, lng: -86.812542},
                    zoom: 18
                    });
                }
                initMap();
                map.setOptions({disableDoubleClickZoom: true });
                $("#myModal").on("shown.bs.modal", function () {
                    google.maps.event.trigger(map, "resize");
                    // map.setCenter(latlng);
                });     
                
                google.maps.event.addListener(map, 'dblclick', function( event ){
                    var markerPosition = {
                        latitude: event.latLng.lat(), 
                        longitude: event.latLng.lng()
                    };
                    marker = new google.maps.Marker({position: event.latLng, map: map});
                    markers.push(marker);
                    $scope.mapVertices.push(markerPosition);
                    console.log($scope.mapVertices);
                    $scope.$apply();
                    
                    var infoWindow = new google.maps.InfoWindow({
                        content: 'Lat: ' + event.latLng.lat() + ', Long: ' + event.latLng.lng()
                    })
                    marker.addListener('click', function() {
                        infoWindow.open(map, marker);
                    });
                });
                
                var user = UserService.me().then(function (success) {
                    user = success.id;
                    $scope.buildings = Buildings.filter({ userid: success.id });
                });

                $scope.routeHeights = [];

                $scope.addRouteHeight = function () {
                    console.log('clicked add route');
                    var rHeight = {
                        height: $scope.inputAmount
                    }
                    $scope.routeHeights.push(rHeight);
                    console.log($scope.routeHeights);
                }

                $scope.submitRoute = function () {
                    console.log('clicked submit route');
                    var heightString = JSON.stringify($scope.routeHeights);
                    var commandString = JSON.stringify($scope.mapVertices);
                    var selectedBuilding;
                    try {
                        selectedBuilding = JSON.parse($scope.selectedBuilding);
                        console.log(selectedBuilding);
                    } catch (err) {
                        console.log(err);
                        selectedBuilding = {};
                        console.log(selectedBuilding);
                    }

                    var routeData = {
                        userid: user,
                        buildingid: selectedBuilding.id,
                        commands: commandString,
                        heights: heightString
                    }
                    var route = new Routes(routeData);
                    route.$save(function (success) {
                        console.log(success);
                    });
                }
                var clearMarkers = function() {
                    markers.forEach(function(marker) {
                        marker.setMap(null);
                    });
                }
                $scope.clearRoute = function () {
                    console.log('clicked clear route');
                    $scope.mapVertices = [];
                    $scope.routeHeights = [];
                    $scope.routeCommands = [];
                    clearMarkers();
                    markers = [];
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

                }
                // testing route commands up, down, left, right

                $scope.routeCommands = [];
                $scope.addRouteParam = function() {
                    $scope.routeCommands.push({
                        cmd: $scope.selectedCommand,
                        amt: $scope.inputAmount
                    });
                    console.log($scope.routeCommands);
                }
                $scope.submitRouteCmds = function() {
                    console.log('clicked to submit commands');
                    var cmdString = JSON.stringify($scope.routeCommands);
                    var selBuilding;
                    try {
                        selBuilding = JSON.parse($scope.selectedBuilding);
                        console.log(selBuilding);
                    } catch (err) {
                        console.log(err);
                        selBuilding = {};
                        console.log(selectedBuilding);
                    };
                    var rteData = {
                        userid: user,
                        buildingid: selBuilding.id,
                        commands: cmdString,
                        heights: 0                        
                    }
                    var rte = new Routes(rteData);
                    rte.$save();
                }
            }]
        }
    })
    .directive('googleMap', function() {
        return {
            templateUrl: '/directives/map.html',
            restrict: 'E',
            controller: ['$scope', function($scope) {
                var map;
                function initMap() {
                    map = new google.maps.Map(document.getElementById('map'), {
                    center: {lat: 33.511695, lng: -86.812542},
                    zoom: 18
                    });
                }
                initMap();

                google.maps.event.addListener(map, 'click', function(event) {
                    marker = new google.maps.Marker({position: event.latLng, map: map});
                });
                google.maps.event.addListener(map, 'dblclick', function( event ){
                    alert( "Latitude: "+event.latLng.lat()+" "+", longitude: "+event.latLng.lng() );
                    $scope.lat = "Latitude: " + event.latLng.lat();
                    $scope.long = "longitude: " + event.latLng.lng();
                });
            }]
        };
    })
