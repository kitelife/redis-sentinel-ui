'use strict';

var http = require('http');
var urlParser = require('url');
var childProcess = require('child_process');

var controllers = require('./controllers');
var config = require('./config.json');

// 后端监控进程
var monitorProcess = childProcess.fork('./monitor.js');
monitorProcess.on('exit', function(code, signal) {});


// Web服务
var routes = {
    '/': controllers.index,
    '/cmd': controllers.cmd
};

function router(req, res) {
    var urlParts = urlParser.parse(req.url),
        pathname = urlParts.pathname;

    if (routes.hasOwnProperty(pathname)) {
        routes[pathname](req, res);
        return;
    }

    res.statusCode = 404;
    res.write('不存在目标资源!');
    res.end();
}

var server = http.createServer(router);
server.listen(config.port ? config.port : 8080);
