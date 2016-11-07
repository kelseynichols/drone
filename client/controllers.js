angular.module('DroneApp.controllers', [])
    .controller('WelcomeController', ['$scope', function ($scope) {
        console.log('Welcome!');

        var vid = document.getElementById("bgvid");

    }])
    .controller('LoginController', ['$scope', '$rootScope', 'UserService', '$location', function ($scope, $rootScope, UserService, $location, customNavbar) {
        UserService.me().then(function(success) {
            redirect();
        });
        function redirect() {
            var dest = $location.search().p;
            if (!dest) {
                dest = '/';
            }
            $location.path(dest).search('p', null).replace();
        }
        $scope.login = function () {
            console.log('clicked login');
            UserService.login($scope.email, $scope.password)
                .then(function (success) {
                    console.log('logged in!');
                    $rootScope.showLogin = false;
                    $rootScope.hideLogout = false;
                    redirect();
                }, function (err) {
                    console.log(err);
                });
        }

        $(document).ready(function () {
            $(".user-creator-login").delay(75).animate({ opacity: 1 }, 200)
        })

    }])
    .controller('AccountController', ['$scope', 'Buildings', 'UserService', 'Routes', function ($scope, Buildings, UserService, Routes) {
        $scope.showDetails = function (building, index) {
            console.log('clicked to see building details');
            console.log(building);
            building.hideDetails = !building.hideDetails;
                $(document).ready(function() {
                    $('#shape-' + index).empty();
                    var createShape = function() {
                        console.log('creating 3d object');
                        var canvas = $('#shape-' + index);
                        var Shape = function(width, height, depth) {
                            this.width = width;
                            this.height = height;
                            this.depth = depth;
                        }
                        Shape.prototype.draw = function() {
                            var scene = new THREE.Scene();
                            // scene.background = new THREE.Color( 0xffffff );
                            var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

                            var renderer = new THREE.WebGLRenderer({ alpha: true });
                            renderer.setClearColor(0xffffff, 0.5);
                            renderer.setSize( window.innerWidth/3, window.innerHeight/3 );
                            renderer.setClearColor(0xffffff, 0);
                            var container = $('#shape-' + index);
                            console.log(container);
                            container.empty();
                            container.append($( renderer.domElement ).addClass('threed'));

                            var geometry = new THREE.BoxGeometry( building.width/10, building.height/10, building.length/10 );
                            var material = new THREE.MeshBasicMaterial( { color: 0x778899 } );
                            var cube = new THREE.Mesh( geometry, material );
                            var eGeometry = new THREE.EdgesGeometry( cube.geometry );
                            var eMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1.5 });
                            var edges = new THREE.LineSegments( eGeometry, eMaterial );
                            cube.add(edges);
                            scene.add( cube );

                            camera.position.z = 5;

                            function render() {
                                requestAnimationFrame( render );
                                cube.rotation.x = 0;
                                cube.rotation.y += 0.01;
                                cube.rotation.z = 0;
                                renderer.render( scene, camera );
                            }
                            render();
                        }
                        var Rectangle = function(width, height, depth) {
                            Shape.call(this, width, height, depth);
                            this.draw();
                        }
                        Rectangle.prototype = Object.create(Shape.prototype);
                        Rectangle.prototype.constructor = Rectangle;
                        function createRectangle() {
                            new Rectangle(building.width/10, building.height/10, building.length/10);
                        }
                        createRectangle();
                    }
                    createShape();
                })		

        };
        $scope.showRoutes = function (building) {
            console.log('clicked to see routes');
            building.hideRoutes = !building.hideRoutes;
            if (!building.hideRoutes) {
                console.log(building);
                building.routes = Routes.building({ buildingid: building.id });
                console.log(building.routes);
            }
        };


        var user = UserService.me().then(function (success) {
            user = success.id;
            $scope.buildings = Buildings.filter({ userid: success.id });
            console.log($scope.buildings);
        });


    }])
    .controller('InfoController', ['$scope', function ($scope) {

        $(".pic-container").mouseenter(function () {
            var $text1 = $(this).children('.text1');
            $text1.stop();
            // $text1.slideDown(500);
            $text1.fadeIn(600);
        });

        $(".pic-container").mouseleave(function () {
            var $text1 = $(this).children('.text1');
            $text1.stop();
            // $text1.slideUp(500);
            $text1.fadeOut(600);
        });

        $(document).ready(function () {
            $(".info-page").delay(75).animate({ opacity: 1 }, 200)
        })

        $scope.software = function () {
            let destination = document.getElementById('software');
            let distance = destination.offsetTop - (document.body.scrollTop - 220);
            console.log(distance);
            // document.body.scrollTop = destination.offsetTop;
            let increment = distance / 25;
            console.log(increment);
            let prevValue;
            let t = setInterval(() => {
                prevValue = document.body.scrollTop;
                document.body.scrollTop += increment;
                if (document.body.scrollTop === prevValue || document.body.scrollTop >= destination.offsetTop) {
                    clearTimeout(t);
                }
            }, 25);
        }

        $scope.hardware = function () {
            console.log('working');
            let destination = document.getElementById('hardware');
            let distance = destination.offsetTop - document.body.scrollTop;
            // document.body.scrollTop = destination.offsetTop;
            let increment = distance / 25;
            let prevValue;
            let t = setInterval(() => {
                prevValue = document.body.scrollTop;
                document.body.scrollTop += increment;
                if (document.body.scrollTop === prevValue || document.body.scrollTop >= destination.offsetTop) {
                    clearTimeout(t);
                }
            }, 25);
        }

    }])
    .controller('PastWorkController', ['$scope', function ($scope) {

    }])

    .controller('ContactController', ['$scope', function ($scope) {

        $(document).ready(function () {
            $(".contact-row").delay(75).animate({ opacity: 1 }, 200)
        })

    }])
    .controller('RegisterController', ['$scope', 'Users', '$location', function ($scope, Users, $location) {
        $scope.newUser = function () {
            var userData = {
                firstname: $scope.firstname,
                lastname: $scope.lastname,
                email: $scope.email,
                password: $scope.password
            };
            var user = new Users(userData);
            user.$save(function (success) {
                $location.url('/');
            });
        }

        $(document).ready(function () {
            $(".user-creator").delay(75).animate({ opacity: 1 }, 200)
        })

    }])

            // $(document).ready(function () {
                // console.log('in the jquery handler');
                // $('.building-shape').remove();
                // var createShape = function () {
                //     console.log('creating shape');
                //     var canvas = $('.shape-div');
                //     var Shape = function (width, height) {
                //         this.width = width;
                //         this.height = height;
                //     }
                //     Shape.prototype.draw = function () {
                //         this.div = $('<div></div>');
                //         this.div.addClass('building-shape');
                //         this.div.css({
                //             position: "relative",
                //             background: "rgba(255,0,0,0.5)",
                //             width: (this.width * 10) + "px",
                //             height: (this.height * 10) + "px",
                //             top: "50px",
                //             left: "50px"
                //         });
                //         canvas.append(this.div);
                //     }
                //     var Rectangle = function (width, height) {
                //         Shape.call(this, width, height);
                //         this.cssClass = 'new-rectangle';
                //         this.draw();
                //     }
                //     Rectangle.prototype = Object.create(Shape.prototype);
                //     Rectangle.prototype.constructor = Rectangle;
                //     function createRectangle() {
                //         console.log('drawing building');
                //         new Rectangle(building.width, building.length);
                //     }
                //     createRectangle();
                // }

                // createShape();
                // })

