'use strict';

var http = require('http');
var childProcess = require('child_process');

var config = require('./config');
var routes = require('./routes');

// 后端监控进程
var monitorProcess = childProcess.fork('./services/monitor');

monitorProcess.on('exit', function (code, signal) {
    console.log('monitor progress exit with code: ' + code + ', signal: ' + signal);
});

// store global var
global.RootDir = __dirname;

// Create HTTP server and listen it.
var server = http.createServer(routes);

server.listen(config.port, function (req, res) {
    console.log('Server start localhost@' + config.port);
});

server.on('error', function (error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});
