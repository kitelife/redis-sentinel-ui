/**
 * @file: routes.js
 * @author: gejiawen
 * @date: 15/12/4 17:19
 * @description: routes.js
 */

'use strict';

const fs = require('fs');
const urlParser = require('url');

const controllers = require('./controllers');
const StaticServ = require('./utils/staticServ');

// Web路由
const routes = {
    '/': {
        'verb': ['GET'],
        'action': controllers.Home
    },
    '/cmd': {
        'verb': ['POST'],
        'action': controllers.Cmd
    }
};

function _router(req, res) {
    var urlParts = urlParser.parse(req.url),
        pathname = urlParts.pathname;

    // 匹配路由表
    if ((pathname in routes) && (routes[pathname].verb.indexOf(req.method) != -1)) {
        routes[pathname].action(req, res);
        return;
    }

    StaticServ(pathname, function(err, data) {
        if (err) {
            res.write(err.message);
        } else {
            res.write(data);
        }
        res.end();
    });
}


/**
 * Module Exports.
 */
module.exports = _router;
