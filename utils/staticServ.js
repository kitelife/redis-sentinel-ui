/**
 * @file: static.js
 * @author: youngsterxyf, gejiawen
 * @date: 15/12/5 20:35
 * @description: static.js
 */

/**
 * 服务器端静态文件缓存实现参考了koa-static-cache
 */

'use strict';

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var mime = require('mime-types');
var debug = require('debug')('staticServ');
var config = require('../config');

var staticFileObjs = Object.create(null);
var staticDir = path.join(global.RootDir, 'public');

var options = {
    buffer: !config.debug,
    maxAge: config.debug ? 0 : 60 * 60 * 24 * 7
};

staticCache(staticDir, options, staticFileObjs);

/**
 * @param dir
 * @param options
 * @param files
 * @private
 */
function staticCache(dir, options, files) {
    options = options || {};
    options.prefix = (options.prefix || '').replace(/\/$/, '') + path.sep;
    files = files || options.files || Object.create(null);
    dir = dir || options.dir || process.cwd();

    // option.filter
    var fileFilter = function () { return true };
    if (Array.isArray(options.filter)) fileFilter = function (file) { return ~options.filter.indexOf(file) };
    if (typeof options.filter === 'function') fileFilter = options.filter;

    readDirRecursive(dir).filter(fileFilter).forEach(function (name) {
        loadFile(name, dir, options, files)
    });
}

/**
 * @param root
 * @param filter
 * @param files
 * @param prefix
 * @returns {*|Array}
 * @private
 */
function readDirRecursive(root, filter, files, prefix) {
    prefix = prefix || '';
    files = files || [];
    filter = filter || noDotFiles;

    var dir = path.join(root, prefix);
    if (!fs.existsSync(dir)) return files;
    if (fs.statSync(dir).isDirectory())
        fs.readdirSync(dir)
            .filter(filter)
            .forEach(function (name) {
                readDirRecursive(root, filter, files, path.join(prefix, name))
            });
    else {
        files.push(prefix);
    }

    return files;
}

/**
 * @param x
 * @returns {boolean}
 * @private
 */
function noDotFiles(x) {
    return x[0] !== '.'
}

/**
 * @param pathname
 * @param dir
 * @param options
 * @param files
 * @returns {{}}
 * @private
 */
function loadFile(pathname, dir, options, files) {
    // 引用, 修改了obj,即修改了files[pathname]
    var obj = files[pathname] = files[pathname] ? files[pathname] : {};
    var filename = obj.path = path.join(dir, pathname);
    var stats = fs.statSync(filename);
    var buffer = fs.readFileSync(filename);

    obj.cacheControl = options.cacheControl;
    obj.maxAge = obj.maxAge ? obj.maxAge : options.maxAge || 0;
    obj.type = obj.mime = mime.lookup(pathname) || 'application/octet-stream';
    obj.mtime = stats.mtime.toUTCString();
    obj.length = stats.size;
    obj.md5 = crypto.createHash('md5').update(buffer).digest('base64');

    if (options.buffer)
        obj.buffer = buffer;

    buffer = null;
    return obj
}

function safeDecodeURIComponent(text) {
    try {
        return decodeURIComponent(text);
    } catch (e) {
        return text;
    }
}

/**
 *
 * @param pathname
 * @param callback
 * @private
 */
function staticService(pathname, callback) {
    if (pathname.indexOf(config.static_prefix) !== 0) {
        callback({code: 404, msg: '不存在目标文件'});
        return;
    }

    // 去掉'/public/'
    pathname = pathname.slice(config.static_prefix.length);
    var filename = safeDecodeURIComponent(path.normalize(pathname));

    var filePath = path.join(staticDir, pathname);
    try {
        var fileStat = fs.statSync(filePath);
    } catch (err) {
        callback({code: 500, msg: '系统异常'});
        return;
    }

    if (config.debug) {
        if (fileStat.isFile()) {
            fs.readFile(filePath, function(err, data) {
                callback(err ? {code: 500, msg: err.message} : null, {cached: false, data: data});
            });
        } else {
            callback({code: 404, msg: '不存在目标文件'});
        }
        return;
    }

    var file = staticFileObjs[filename];
    if (!file) {
        if (path.basename(filename)[0] === '.') {
            callback({code: 403, msg: '没有权限'});
            return;
        }

        if (!fileStat.isFile()) {
            callback({code: 404, msg: '不存在目标文件'});
            return;
        }

        file = loadFile(filename, staticDir, options, staticFileObjs)
    } else {
        // 检查自缓存以来文件是否变更过
        if (fileStat.mtime > new Date(file.mtime)) {
            file = loadFile(filename, staticDir, options, staticFileObjs);
        }
    }

    callback(null, {cached: true, data: file});
}

/**
 * Module Exports
 */
module.exports = staticService;
