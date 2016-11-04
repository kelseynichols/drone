var bebop = require('node-bebop'),
    temporal = require('temporal'),
    cv = require('opencv'),
    fs = require('fs');

var output = fs.createWriteStream('./video.h264'),
    drone = bebop.createClient({ip:'192.168.42.1'}),
    video = drone.getVideoStream();

video.pipe(output);

var PilotingSettings = drone.PilotingSettings,
    SpeedSettings = drone.SpeedSettings;

/*
* initial settings
*/
var settingsIntervalId;
var cmdIndex = 0;

var droneState = {
    settings: currentSettings,
    isSet: false,
    isHovering: false,
    isLanded: true
};

/*
    * Device Max
    * maxAltitude 150 meters
    * maxTilt 35 degrees
    * maxRotation 200 degrees / second
    * maxDistance 2000 meters
*/
var currentSettings = {
    maxAltitude: 0,
    maxTilt: 0,
    maxDistance: 0,
    maxVerticalSpeed: 0,
    maxRotationSpeed: 0
};

var desiredSettings = {
    maxAltitude: 150,
    maxTilt: 15,
    maxDistance: 2000,
    maxVerticalSpeed: 6,
    maxRotationSpeed: 100
};

/*
* flightpath builder
*/
var routeArry = [
    {
        cmd: 'stopRecording'
    },
    {
        cmd: 'up',
        amt: 10
    },
    {
        cmd: 'startRecording'
    },
    {
        cmd: 'down',
        amt: 10
    },
    {
        cmd: 'clockwise',
        amt: 20
    },
    {
        cmd: 'stop'
    },
    {
        cmd: 'stopRecording'
    },
    {
        cmd: 'counterClockwise',
        amt: 20
    },
    {
        cmd: 'stop'
    },
    {
        cmd: 'up',
        amt: 15
    },
    {
        cmd: 'down',
        amt: 15
    },
    {
        cmd: 'stop'
    },
    {
        cmd: 'land'
    }
];

var flightPath = buildFlightPath(routeArry, drone);

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

/*
    * called once after drone has connected and is in ready state
    * initializes flight settings
*/
function settingsLoop(aDrone) {
    var readyCount = 0;
    var propertyCount = 0;
    for (setting in currentSettings) {
        propertyCount++;
        if (currentSettings[setting] !== desiredSettings[setting]) {
            console.log(setting);
            if (setting === 'maxVerticalSpeed' || setting === 'maxRotationSpeed') {
                SpeedSettings.self = SpeedSettings[setting](desiredSettings[setting]);
            } else if (setting === 'videoEnable') {
                MediaStreaming[setting](desiredSettings[setting]);
            } else {
                PilotingSettings.self = PilotingSettings[setting](desiredSettings[setting]);
            }  
        } else {
            readyCount++;
        }
    }
    if (readyCount === propertyCount) {
        droneState.isSet = true;
        clearInterval(settingsIntervalId);
        console.log('drone state:', droneState);
        // aDrone.takeOff();
    } else {
        console.log('update:', currentSettings);
        droneState.isSet = false;
    }
}

/*
* roll: y-axis rotation (left and right)
* yaw: x-axis rotation (clockwise and counterclockwise)
* pitch: z-axis rotation (forward and back)
* gaz: throttle (altitude)
*/

drone.connect(function() {
    console.log('connected');
    drone.MediaStreaming.videoEnable(1);
    setTimeout(function() {
        drone.MediaStreaming.videoEnable(1);
    }, 5000);
    setTimeout(function() {
        drone.land();
        console.log('CONNECT TIMEOUT FORCED LAND');
    }, 60000);
});

drone
    .on('MaxAltitudeChanged', function(settingObj) {
        console.log('max altitude changed:', settingObj);
        currentSettings.maxAltitude = settingObj.current;
    })
    .on('MaxTiltChanged', function(settingObj) {
        console.log('max tilt changed', settingObj);
        currentSettings.maxTilt = settingObj.current;
    })
    .on('MaxDistanceChanged', function(settingObj) {
        console.log('max distance changed', settingObj);
        currentSettings.maxDistance = settingObj.current;
    })
    .on('MaxVerticalSpeedChanged', function(settingObj) {
        console.log('max vertical speed changed', settingObj);
        currentSettings.maxVerticalSpeed = settingObj.current;
    })
    .on('MaxRotationSpeedChanged', function(settingObj) {
        console.log('max rotation speed changed', settingObj);
        currentSettings.maxRotationSpeed = settingObj.current;
    })
    .on('ready', function() {
        console.log('ready to fly');
        drone.MediaStreaming.videoEnable(1);
        settingsIntervalId = setInterval(function() {
            settingsLoop(drone);
        }, 1000);
    })
    .on('battery', function(level) {
        console.log('battery level:', level);
    })
    .on('flying', function() {
        console.log('flying');
        droneState.isLanded = false;
        if (droneState.isHovering) {
            droneState.isHovering = false;
        }
    })
    .on('hovering', function() {
        console.log('hovering');
        droneState.isLanded = false;
        if (cmdIndex === 0) {
            console.log('starting queue');
            // runQueue(flightPath, this);
            cmdIndex++;
        }
    })
    .on('landed', function() {
        console.log('landed');
    })
    .on('landing', function() {
        console.log('landing');
        droneState.isLanded = true;
    })
    .on('takingOff', function() {
        console.log('taking off');
    })
    .on('emergency', function() {
        console.log('emergency');
    })
    .on('video', function(frame) {
        console.log('video frame');
    })
    .on('VideoEnableChanged', function(status) {
        console.log('video enable changed - status:', status);
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