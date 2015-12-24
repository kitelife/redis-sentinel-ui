'use strict';

// store global var
global.RootDir = __dirname;

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var http = require('http');

var config = require('./config');
var routes = require('./routes');

// 配置检查
if (!config.sentinels.length) {
    console.error('请配置sentinel服务器');
}

if (cluster.isMaster) {
    // Fork workers.
    console.log('主进程id:', process.pid);
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
    });
} else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    http.createServer(routes).listen(config.port);
    console.log('进程id:', process.pid, ', 监听端口:', config.port);
}