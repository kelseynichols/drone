var fs = require("fs"),
    Client = require('ftp');

var c = new Client(),
    mediaDir = "internal_000/Bebop_2/media/";

c.on('ready', function() {
    var fileList = [];
    c.list('internal_000/Bebop_2/media', function(err, list) {
        if (err) throw err;
        list.forEach(function(mediaFile) {
            fileList.push(mediaFile.name);
            console.log('file found:', mediaFile.name);
        });
        console.dir(list);
        c.end();
    });
    
    fileList.forEach(function(fileName) {
        c.get(mediaDir + fileName, function(err, stream) {
            if (err) throw err;
            stream.once('close', function() {
                console.log('done with the stream for:', fileName);
                c.end();
            });
            stream.pipe(fs.createWriteStream('Bebop_2_1970-01-01T000942+0000_0DC36E.mp4'));
        });
    });
});
  
c.connect({
    host:"192.168.42.1",
    port: 21,
    user:'anonymous'
});