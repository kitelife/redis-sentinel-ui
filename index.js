'use strict';

var http = require('http');
var urlParser = require('url');
var childProcess = require('child_process');
var config = require('./config.json');

var monitorProcess = childProcess.fork('./monitor.js');
monitorProcess.on('exit', function(code, signal) {});

function router(req, res) {
  var urlParts = urlParser.parse(req.url);
  if (urlParts.pathname === '/hello') {
    res.write('world');
    res.end();
    return;
  }
  res.write(urlParts.pathname);
  res.end();
}

var server = http.createServer(router);
server.listen(config.port ? config.port : 8080);
