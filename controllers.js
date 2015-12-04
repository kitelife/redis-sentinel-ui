/**
 * Created by xiayf on 15/12/4.
 */

'use strict';

var path = require('path');
var jade = require('jade');

function index(req, res) {
    var templatePath = path.join(global.RootDir, '/views/index.jade');
    res.write(jade.renderFile(templatePath, {hello: 'world'}));
    res.end();
}

function cmd(req, res) {

}

module.exports = {
    index: index,
    cmd: cmd
};