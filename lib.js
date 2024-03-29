/* internal modules */
var fs = require('fs');
var path = require('path');

/* external modules */
var mime = require('mime');

var lib = module.exports = {

    sendErrorOnStaticContent: function (response, code) {
        console.log('>>> sending error ' + code + ' page');
        response.writeHead(code, {'Content-Type': 'text/plain; charset=utf-8'});
        switch (code) {
            case 404:
                response.write('Error 404: file not found.');
                break;
            case 403:
                response.write('Error 403: access denied.');
                break;
            case 406:
                response.write('Error 406: not acceptable');
                break;
            default:
                response.write('Error ' + code);
        }
        response.end();
    },

    sendFile: function (response, filePath, fileContents) {
        var mimeType = mime.getType(path.basename(filePath));
        console.log('>>> sending file ' + filePath + ' ' + mimeType);
        response.writeHead(200, {'Content-Type': mimeType });
        response.end(fileContents);
    },

    serveStaticContent: function (response, absPath) {
        var n = absPath.indexOf('?');
        var fileName = absPath.substring(0, n != -1 ? n : absPath.length);
        fs.exists(fileName, function (exists) {
            if (exists) {
                fs.readFile(fileName, function (err, data) {
                    if (err) {
                        lib.sendErrorOnStaticContent(response, 406);
                    } else {
                        lib.sendFile(response, fileName, data);
                    }
                });
            } else {
                if(fileName.endsWith('.map')) {
                    console.log('>>> generating empty response for ' + absPath);
                    response.writeHead(200, {'Content-Type': 'application/octet-stream'});
                    response.end();
                } else {
                    lib.sendErrorOnStaticContent(response, 404);
                }
            }
        });
    },
    
    sendJSON: function(rep, op) {
        var repStr = JSON.stringify(op);
        console.log('>>> sending JSON ' + repStr);
        rep.writeHead(200, 'OK', { 'Content-type': 'application/json' });
        rep.end(repStr);
    },
    
    sendJSONWithError: function (response, code, text) {
        console.log('>>> sending JSON with error ' + code + ' \'' + text + '\'');
        response.writeHead(code, 'ERROR', { 'Content-type': 'application/json'});
        response.end(JSON.stringify({ error: text }));
    },
    
    payload2JSON: function(req, rep, callback) {
        req.setEncoding('utf8');
        var payload = '';
        req.on('data', function(data) {
            payload += data;
        }).on('end', function() {
            try {
                op = JSON.parse(payload);
                err = null;
            } catch(ex) {
                op = null;
                err = { text: "Payload is not a valid JSON" };
            }
            callback(req, rep, op, err);
        });
    }   
};