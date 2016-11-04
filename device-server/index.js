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

function generateState (cState) {
    var reported = {
        connect: false,
        takeoff: false,
        land: false
    };
    
    switch (cState) {
        case 'connect':
            reported.connect = true;
            reported.takeoff = false;
            reported.land = false;
            break;
        case 'takeoff':
            reported.connect = true;
            reported.takeoff = true;
            reported.land = false;
            break;
        case 'land':
            reported.connect = true;
            reported.takeoff = false;
            reported.land = true;
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
        if (currentTimeout !== null) {
            currentTimeout = setTimeout(function() {
                executeOperation(oName, stateObject);
            }, operationTimeout * 2);
        }
    } else {
        console.log('execute operation succeeded', clientToken);
        stack.push(clientToken);
    }
}

function handleConnect () {
    // after connecting to aws iot register interest in thing shadow
    console.log('connected to aws');
    var droneState = {state: {reported: generateState('connect')}};
    registerShadow(thingName, droneState);
}

function handleStatus (thingName, stat, clientToken, stateObject) {
    // reports status completion of update(), get(), and delete() calls
    var expectedClientToken = stack.pop();
    console.log('STATE OBJECT:', stateObject);
    if (expectedClientToken === clientToken) {
        console.log('stat', stat, 'status on', thingName, 'state:', JSON.stringify(stateObject));
        var isConnected = stateObject.state.reported.connect;
        var isTakeoff = stateObject.state.reported.takeoff;
        var isLand = stateObject.state.reported.land;
        if (isConnected && !isTakeoff && !isLand) {
            var takeoffState = {state: {reported: generateState('takeoff')}};
            executeOperation('update', takeoffState);
        }
    } else {
        console.log('client token mismatch on', thingName);
    }
}

function handleDelta (thingName, stateObject) {
    console.log('delta on', thingName, ':', JSON.stringify(stateObject));
    if (stateObject.state.land) {
        var landState = {state: {reported: generateState('land')}};
        executeOperation('update', landState);
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
        handleDelta(thingName, stateObject);
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