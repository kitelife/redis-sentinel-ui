/**
 * @file: routes.js
 * @author: gejiawen, youngsterxyf
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
const RespUtil = require('./utils/resp');

// Web路由
const routes = {
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
    let urlParts = urlParser.parse(req.url);
    let pathname = urlParts.pathname;

    // 输出请求路径及方法
    // console.log(pathname, req.method);

    // 匹配路由表
    if ((pathname in routes) && (routes[pathname].verb.indexOf(req.method) != -1)) {
        // 绑定一些方法
        res.toResponse = RespUtil.toRespone;
        // 统一解析保存URL查询字符串的请求参数
        req.query = qs.parse(urlParts.query);

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
