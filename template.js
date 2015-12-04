/**
 * Created by xiayf on 15/12/4.
 */
'use strict';

var path = require('path');
var jade = require('jade');

var templateCache = {};

function render(relativePath, data) {
    var filePath = path.join(global.RootDir, relativePath);
    if (!templateCache.hasOwnProperty(filePath)) {
        templateCache[filePath] = jade.compileFile(filePath, {pretty: true});
    }

    return templateCache[filePath](data);
}

module.exports = {
    render: render
};