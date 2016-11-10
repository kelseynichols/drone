var db = require('../server/config/db');
var awsIot = require('aws-iot-device-sdk');
var thingShadow = awsIot.thingShadow;
const operationTimeout = 10000;
const thingName = 'bebop';
var currentTimeout = null;
var stack = [];
const thingShadows = thingShadow({
    host: "ams6ieb4v4dry.iot.us-east-1.amazonaws.com",
    port: 8883,
    region: 'us-east-1',
    clientId: 'droneGateway',
    caCert: '../aws-certs/root-CA.crt',
    clientCert: '../aws-certs/afa4bee0c2-certificate.pem.crt',
    privateKey: '../aws-certs/afa4bee0c2-private.pem.key'
});

var bebop = require('node-bebop'),
    temporal = require('temporal'),
    droneHost = '192.168.42.1';
var drone = bebop.createClient({ip:droneHost});
var PilotingSettings = drone.PilotingSettings,
    SpeedSettings = drone.SpeedSettings,
    MediaStreaming = drone.MediaStreaming;

// returns current route
function getRoute(id) {
    console.log('getting route for id:', id);
    return db.rows('GetRouteById', [id]);
}

var droneState = {
    isSet: false,
    isLanded: true
};
var cmdIndex = 0;

var flightPath = [];

function buildFlightPath(aRoute, aDrone) {
    var flightQueue = [];
        
    aRoute.forEach(function (routeLeg) {
        if (routeLeg.cmd === 'stop') {
            var routeStop = cmdFactory(routeLeg, aDrone);
            flightQueue.push(routeStop);
        } else if (routeLeg.cmd === 'land') {
            var routeLand = cmdFactory(routeLeg, aDrone);
            flightQueue.push(routeLand);
        } else if (routeLeg.cmd === 'takePicture') {
            var routePicture = cmdFactory(routeLeg, aDrone);
            flightQueue.push(routePicture);
        } else if (routeLeg.cmd === 'startRecording') {
            var routeRecording = cmdFactory(routeLeg, aDrone);
            flightQueue.push(routeRecording);
        } else if (routeLeg.cmd === 'stopRecording') {
            var routeStopRecording = cmdFactory(routeLeg, aDrone);
            flightQueue.push(routeStopRecording);
        } else {
            var theRoute = cmdFactory(routeLeg, aDrone);
            flightQueue.push(theRoute.start, theRoute.stop);
        }
    });

    return flightQueue;
}

function cmdFactory (aRoute, aDrone) {
    
    if (aRoute.cmd === 'land') {
        var theRoute = {
            delay: 2000,
            task: function () {
                aDrone.land();
                console.log('LANDING');
            }
        };
        return theRoute;
    } else if (aRoute.cmd === 'stop') {
        var theRoute = {
            delay: 2000,
            task: function () {
                aDrone.stop();
                console.log('STOPPING');
            }
        };
        return theRoute;
    } else if (aRoute.cmd ==='takePicture') {
        var theRoute = {
            delay: 2000,
            task: function() {
                aDrone.takePicture();
                console.log('TAKING PICTURE');
            }
        };
        return theRoute;
    } else if (aRoute.cmd === 'startRecording') {
        var theRoute = {
            delay: 2000,
            task: function() {
                aDrone.startRecording();
                console.log('START RECORDING');
            }
        };
        return theRoute;
    } else if (aRoute.cmd === 'stopRecording') {
        var theRoute = {
            delay: 2000,
            task: function() {
                aDrone.stopRecording();
                console.log('STOP RECORDING');
            }
        };
        return theRoute;
    } else {
        var theRoute = {
            start: {
                delay: 2000,
                task: function () {
                    aDrone[aRoute.cmd](aRoute.amt);
                    console.log('RUNNING COMMAND:', aRoute.cmd);
                }
            },
            stop: {
                delay: 2000,
                task: function () {
                    aDrone[aRoute.cmd](0);
                    console.log('STOPPING COMMAND:', aRoute.cmd);
                }
            }
        };
        return theRoute;
    }
}

drone.connect(function() {
    console.log('connected to host:', drone.ip);
    // drone.MediaStreaming.videoEnable(1);
}.bind(drone));


function generateState (cState, id) {
    
    var reported = {
        connect: false,
        takeoff: false,
        land: false,
        routeSet: false,
        routeId: id
    };
    
    switch (cState) {
        case 'connect':
            reported.connect = true;
            reported.takeoff = false;
            reported.land = false;
            reported.routeSet = false;
            reported.routeId = id;
            break;
        case 'takeoff':
            reported.connect = true;
            reported.takeoff = true;
            reported.land = false;
            reported.routeSet = true;
            reported.routeId = id;
            break;
        case 'land':
            reported.connect = true;
            reported.takeoff = false;
            reported.land = true;
            reported.routeSet = true;
            reported.routeId = id;
            break;
    }
    
    return reported;
}

function registerShadow (thingName, state) {
    // update method returns clientToken
    thingShadows.register(thingName, {
        ignoreDeltas: false,
        operationTimeout: operationTimeout
    }, function(err, failedTopics) {
        if (err) {
            console.log('connection error:', err);
        }
        if (failedTopics) {
            console.log('connection failed topics:', failedTopics);
        }
        if (typeof err === 'undefined' && typeof failedTopics === 'undefined') {
            console.log('device thing registered');
            executeOperation('update', state);
        }
    });
}

function executeOperation(oName, stateObject) {
    console.log('operation name:', oName, 'thingName:', thingName, 'stateObj:', stateObject);
    var clientToken = thingShadows[oName](thingName, stateObject);
    // if token is non-null it gets sent in a status event upon operation completion
    // if token null another operation is in progress
    if (clientToken === null) {
        console.log('execute operation failed, operation in progress');
        currentTimeout = setTimeout(function() {
            if (stateObject.state.land) {
                console.log('PLEASE LAND');
                executeOperation(oName, stateObject);
            }
        }, operationTimeout * 2);
    } else {
        console.log('execute operation succeeded', clientToken);
        if (stateObject.state.land) {
            console.log('THANK YOU VERY MUCH FOR LANDING');
        }
        stack.push(clientToken);
    }
}

function handleConnect () {
    // after connecting to aws iot register interest in thing shadow
    console.log('connected to aws');
    var droneState = {state: {reported: generateState('connect', null)}};
    registerShadow(thingName, droneState);
}

function handleStatus (thingName, stat, clientToken, stateObject) {
    // reports status completion of update(), get(), and delete() calls
    var expectedClientToken = stack.pop();
    if (expectedClientToken === clientToken) {
        console.log('stat', stat, 'status on', thingName, 'state:', JSON.stringify(stateObject));
    } else {
        console.log('client token mismatch on', thingName);
    }
}

function handleDelta (thingName, stateObject, aDrone) {
    console.log('delta on', thingName, ':', JSON.stringify(stateObject));
    if (stateObject.state.takeoff) {
        getRoute(stateObject.state.routeId).then(function(theRoute) {
            flightPath = buildFlightPath(JSON.parse(theRoute[0].commands), aDrone);
            takeoff(drone);
            var takeoffState = {state: {reported: generateState('takeoff', stateObject.state.routeId)}};
            executeOperation('update', takeoffState);
            droneState.isSet = true;
            droneState.isLanded = false;
        }, function(err) {
            console.log('error retrieving route could not take off', err);
            landDrone(drone);
        });
    }
}

function handleTimeout (thingName, clientToken) {
    var expectedClientToken = stack.pop();
    if (expectedClientToken === clientToken) {
        console.log('received timeout on', thingName, ':', JSON.stringify(clientToken));
    } else {
        console.log('timeout client mismatch on', thingName);
    }
}

function handleClose (thingName) {
    console.log('close');
    thingShadows.unregister(thingName);
}

function handleOffline () {
    console.log('offline');
    // if any timeout is pending cancel it
    if (currentTimeout !== null) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }
    // cancel any operation currently underway
    while (stack.length) {
        stack.pop();
    }
}

function handleMessage (topic, payload) {
    console.log('message', topic, payload.toString());
}

// shadow handling
thingShadows
    .on('connect', function() {
        handleConnect();
    })
    .on('status', function(thingName, stat, clientToken, stateObject) {
        handleStatus(thingName, stat, clientToken, stateObject);
    })
    .on('delta', function(thingName, stateObject) {
        handleDelta(thingName, stateObject, drone);
    })
    .on('timeout', function(thingName, clientToken) {
        handleTimeout(thingName, clientToken);
    })
    .on('close', function() {
        handleClose(thingName);
    })
    .on('reconnect', function() {
        console.log('reconnect');
    })
    .on('offline', function() {
        handleOffline();
    })
    .on('error', function(err) {
        console.log('error', err);
    })
    .on('message', function(topic, payload) {
        handleMessage(topic, payload);
    });

drone
    .on('ready', function() {
        console.log('ready to fly');
        // settingsIntervalId = setInterval(function() {
        //     settingsLoop(drone);
        // }, 1000);
    })
    .on('battery', function(level) {
        console.log('battery level:', level);
    })
    .on('flying', function() {
        console.log('flying');
        droneState.isLanded = false;
    })
    .on('hovering', function() {
        console.log('hovering');
        droneState.isLanded = false;
        if (cmdIndex === 0) {
            console.log('starting queue');
            runQueue(flightPath, this);
            cmdIndex++;
        }
    })
    .on('landed', function() {
        console.log('landed');
        droneState.isLanded = true;
        var landState = {state: {desired: generateState('land', null)}};
        executeOperation('update', landState);
    })
    .on('landing', function() {
        console.log('landing');
        droneState.isLanded = true;
    })
    .on('takingOff', function() {
        console.log('taking off');
        droneState.isLanded = false;
    })
    .on('emergency', function() {
        console.log('emergency');
        landDrone(this);
    })
    .on('VideoEnableChanged', function(status) {
        console.log('video enable changed - status:', status);
        if (status.enabled !== 'enabled') {
            // drone.MediaStreaming.videoEnable(1);
        }
    });

function runQueue(theRoute, aDrone) {
    var aQueue = temporal.queue(theRoute);
    aQueue.on('end', function() {
        console.log('flight plan complete');
        landDrone(aDrone);
    });
}

function landDrone(aDrone) {
    var landId = setInterval(function() {
        if (!droneState.isLanded) {
            console.log('land attempt');
            aDrone.land();
        } else {
            clearInterval(landId);
        }
    }, 1000);
}

function takeoff(aDrone) {
    aDrone.takeOff();
    droneState.isLanded = false;
}