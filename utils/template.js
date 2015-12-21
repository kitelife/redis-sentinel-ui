/**
 * @file: template
 * @author: gejiawen
 * @date: 15/12/5 18:02
 * @description: template
 */

'use strict';

const path = require('path');
const jade = require('jade');

var templateCache = {};

/**
 *
 * @param relativePath
 * @param data
 * @returns {*}
 * @private
 */
function _render(relativePath, data) {
    // templateCache = {};
    let filePath = path.join(global.RootDir, relativePath);

    if (!(filePath in templateCache)) {
        templateCache[filePath] = jade.compileFile(filePath, {
            pretty: true
        });
    }

    return templateCache[filePath](data);
}

/**
 * Module Exports
 */
exports.render = _render;
