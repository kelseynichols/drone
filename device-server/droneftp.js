var fs = require("fs"),
    Client = require('ftp');

var c = new Client(), // ftp handler
    mediaDir = "internal_000/Bebop_2/media/"; // parrot api docs

// status object
function Status () {
    this.state = 'NOT_CONNECTED';
    this.drive = 'DEFAULT';
    this.file = 'DEFAULT';
}

Status.prototype.updateStatus = function (state, drive, file) {
    // update properties
    this.state = state;
    if (drive !== undefined) {
        this.drive = drive;
    }
    if (file !== undefined) {
        this.file = file;
    }
    
    // send update message
    switch(this.state) {
        case 'DEVICE_CONNECTED':
            console.log('connected to internal storage drive:', this.drive);
            break;
        case 'DEVICE_DISCONNECTED':
            console.log('disconnected from internal storage drive:', this.drive);
            break;
        case 'DEVICE_DIRECTORY_SEARCH_FILE_FOUND':
            console.log('found file:', this.file, 'in drive:', this.drive);
            break;
        case 'DEVICE_DIRECTORY_SEARCH_COMPLETE':
            console.log('completed directory search for drive:', this.drive);
            break;
        case 'DEVICE_DIRECTORY_WRITE_FILE_COMPLETE':
            console.log('completed writing file:', this.file);
            break;
        case 'DEVICE_DIRECTORY_WRITE_COMPLETE':
            console.log('completed writing all files from drive:', this.drive);
            break;
    }
}

// available known states
var states = {
    notConnected: 'NOT_CONNECTED',
    connected: 'DEVICE_CONNECTED',
    disconnected: 'DEVICE_DISCONNECTED',
    fileFound: 'DEVICE_DIRECTORY_SEARCH_FILE_FOUND',
    searchComplete: 'DEVICE_DIRECTORY_SEARCH_COMPLETE',
    writeFileComplete: 'DEVICE_DIRECTORY_WRITE_FILE_COMPLETE',
    writeComplete: 'DEVICE_DIRECTORY_WRITE_COMPLETE',
    errorDirectory: 'ERROR_DIRECTORY',
    errorFileWrite: 'ERROR_FILE_WRITE'
};

// create status handler instance
var statusHandler = new Status();

// connection handler
c.on('ready', function() {
    statusHandler.updateStatus(states.connected, mediaDir);
    var fileList = [];
    
    try {
        // get list of media files
        c.list(mediaDir, function(err, list) {
            if (err) {
                throw {
                    type: states.errorDirectory,
                    dir: mediaDir
                }
            }
            list.forEach(function(mediaFile) {
                fileList.push(mediaFile.name);
                statusHandler.updateStatus(states.fileFound, mediaDir, mediaFile.name);
            });
            statusHandler.updateStatus(states.searchComplete, mediaDir);
            // write to indicated storage
            fileList.forEach(function(fileName, index) {
                c.get(mediaDir + fileName, function(err, stream) {
                    if (err) {
                        throw {
                            type: states.errorFileWrite,
                            file: fileName
                        }
                    }
                    stream.once('close', function() {
                        statusHandler.updateStatus(states.writeFileComplete, mediaDir, fileName);
                        if (index === fileList.length - 1) {
                            statusHandler.updateStatus(states.writeComplete, mediaDir);
                        }
                    });
                    stream.pipe(fs.createWriteStream(fileName));
                });
            });
        });
    } catch (e) {
        switch (e.type) {
            case 'ERROR_DIRECTORY':
                console.log('could not find media directory:', e.dir);
                break;
            case 'ERROR_FILE_WRITE':
                console.log('could not write file:', e.file);
                break;
        }
    }
}).end(function() {
    statusHandler.updateStatus(states.disconnected, mediaDir);
});

// connect to device
c.connect({
    host:"192.168.42.1",
    port: 21,
    user:'anonymous'
});