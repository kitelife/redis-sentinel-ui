/**
 * @file: static.js
 * @author: gejiawen
 * @date: 15/12/5 20:35
 * @description: static.js
 */

'use strict';

const fs = require('fs');
const path = require('path');


/**
 *
 * @param pathname
 * @param callback
 * @private
 */
function _staticServ(pathname, callback) {
    if (pathname.indexOf('/public/') !== 0) {
        callback(new Error('404 Not Found'));
        return;
    }

    let filePath = path.join(global.RootDir, pathname);
    console.log(pathname, filePath);
    let fileStat = fs.statSync(filePath);

    if (fileStat.isFile()) {
        fs.readFile(filePath, function(err, data) {
            callback(err ? err : null, data);
        });
    } else if (fileStat.isDirectory()) {
        callback(new Error('not support server folder'));
    }
}

/**
 * Module Exports
 */
module.exports = _staticServ;
