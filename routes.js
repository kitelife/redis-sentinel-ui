/**
 * @file: routes.js
 * @author: gejiawen
 * @date: 15/12/4 17:19
 * @description: routes.js
 */

'use strict';

const fs = require('fs');
const urlParser = require('url');
const qs = require('querystring');

const Parser = require('co-body');

const controllers = require('./controllers');
const StaticServ = require('./utils/staticServ');

// Web路由
const routes = {
    '/': {
        'verb': ['GET'],
        'action': controllers.Home
    },
    '/cmd': {
        'verb': ['POST', 'GET'],
        'action': controllers.Cmd
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
    var urlParts = urlParser.parse(req.url),
        pathname = urlParts.pathname;
    // 匹配路由表
    if ((pathname in routes) && (routes[pathname].verb.indexOf(req.method) != -1)) {
        // 统一解析保存URL查询字符串的请求参数
        req.query = qs.parse(urlParts.query);

        if (req.method === 'POST' || req.method === 'PUT') {
            // 统一解析并保存请求体数据
            _parseReqBody(req).next().value.then(function(parsedBody) {
                req.body = parsedBody;
                console.log(req.body);
                routes[pathname].action(req, res);
            });
        } else {
            req.body = {};
            // 执行对应的处理方法
            routes[pathname].action(req, res);
        }
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
