/**
 * @file: routes.js
 * @author: gejiawen
 * @date: 15/12/4 17:19
 * @description: routes.js
 */

'use strict';

var urlParser = require('url');
var controllers = require('./controllers');


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


/**
 * Module Exports.
 */
module.exports = router;
