'use strict';

var http = require('http');
var urlParser = require('url');

function router(req, res) {
  var urlParts = urlParser.parse(req.url);
  if (urlParts.pathname === '/hello') {
    res.write('world');
    res.end();
    return;
  }
  res.write(urlParts.pathname);
  res.end();
  return;
}

var server = http.createServer(router);
server.listen(8080);
