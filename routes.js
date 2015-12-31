/**
 * @file: routes.js
 * @author: youngsterxyf, gejiawen
 * @date: 15/12/4 17:19
 * @description: routes.js
 */

'use strict';

var fs = require('fs');
var urlParser = require('url');
//const qs = require('querystring');

var Parser = require('co-body');

var controllers = require('./controllers');
var StaticServ = require('./utils/staticServ');
var RespUtil = require('./utils/resp');
var Logger = require('./utils/logger');

// Web路由
var routes = {
    '/': {
        'verb': ['GET'],
        'action': controllers.Home
    },
    '/cmd_page': {
        'verb': ['GET'],
        'action': controllers.Cmd_page
    },
    '/cmd': {
        'verb': ['POST'],
        'action': controllers.Cmd
    },
    '/stat_page': {
        'verb': ['GET'],
        'action': controllers.Stat_page
    },
    '/stat': {
        'verb': ['POST'],
        'action': controllers.Stat
    }
};

function* _parseReqBody(req) {
    var type = 'form';
    var body;

    var headers = req.headers;
    if ('content-type' in headers) {
        if (headers['content-type'] === 'application/json') {
            type = 'json';
        }
    }
    if (type === 'json') {
        body = yield Parser.json(req);
    } else {
        body = yield Parser.form(req);
    }
    return body;
}

function _router(req, res) {
    let urlParts = urlParser.parse(req.url, true);
    let pathname = urlParts.pathname;

    Logger.info('%s %s', req.method, pathname);

    // 输出请求路径及方法
    // console.log(pathname, req.method);

    // 绑定一些方法
    res.toResponse = RespUtil.toRespone;

    // 匹配路由表
    if ((pathname in routes) && (routes[pathname].verb.indexOf(req.method) != -1)) {
        // 统一解析保存URL查询字符串的请求参数
        // req.query = qs.parse(urlParts.query);
        req.query = urlParts.query;

        if (req.method === 'POST' || req.method === 'PUT') {
            // 统一解析并保存请求体数据
            _parseReqBody(req).next().value.then(function(parsedBody) {
                req.body = parsedBody;
                // console.log(req.body);
                routes[pathname].action(req, res);
            });
        } else {
            req.body = {};
            // 执行对应的处理方法
            routes[pathname].action(req, res);
        }
        return;
    }

    StaticServ(pathname, function(err, result) {
        if (err) {
            Logger.error(err);

            res.toResponse(err.msg, err.code);
            return;
        }
        if (result.cached) {
            var data = result.data;

            var statusCode = 200;
            // 写响应头, 以及可能相应304
            var ifNoneMatch = req.headers['if-none-match'];
            if (ifNoneMatch && ifNoneMatch == data.md5) {
                statusCode = 304;
            }

            res.statusCode = statusCode;
            res.setHeader('Cache-Control', data.cacheControl || 'public, max-age=' + data.maxAge);
            res.setHeader('ETag', data.md5);
            res.setHeader('Expires', (new Date(Date.now() + data.maxAge * 1000)).toUTCString());

            if (statusCode === 200) {
                res.write(data.buffer);
            }
        } else {
            res.write(result.data);
        }
        res.end();
    });
}


/**
 * Module Exports.
 */
module.exports = _router;
