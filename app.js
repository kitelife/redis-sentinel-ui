#!/usr/bin/env node

'use strict';

// store global var
global.RootDir = __dirname;

let cluster = require('cluster');
let numCPUs = require('os').cpus().length;
let http = require('http');

let config = require('./config');
let routes = require('./routes');
let Logger = require('./utils/logger');

// 配置检查
if (!config.sentinels.length) {
    Logger.error('请配置sentinel服务器');
}

if (cluster.isMaster) {
    // Fork workers.
    Logger.info('主进程id: %d', process.pid);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        Logger.info('worker ' + worker.process.pid + ' died; code: ' + code + ', signal: ' + signal);
        cluster.fork();
    });
} else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    http.createServer(routes).listen(config.port);
    Logger.info('进程id:', process.pid, '监听端口:', config.port);
}
