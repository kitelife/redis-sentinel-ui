/**
 * @file: routes.js
 * @author: gejiawen
 * @date: 15/12/4 17:19
 * @description: routes.js
 */

'use strict';

var fs = require('fs');
var path = require('path');
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

    // 匹配路由表
    if (routes.hasOwnProperty(pathname)) {
        routes[pathname](req, res);
        return;
    }

    // 尝试处理静态文件请求
    if (pathname.indexOf('/assets') === 0) {
        var filePath = path.join(global.RootDir, pathname);
        if (fs.existsSync(filePath)) {
            fs.readFile(filePath, function(err, data) {
                if (err) {
                    res.statusCode = 500;
                } else {
                    res.write(data);
                }
                res.end();
            });
            return;
        }
    }

    res.statusCode = 404;
    res.write('不存在目标资源!');
    res.end();
}


/**
 * Module Exports.
 */
module.exports = router;
