/**
 * Created by xiayf on 15/12/4.
 */

'use strict';

var Template = require('./template');

function index(req, res) {
    res.write(Template.render('views/index.jade', {hello: 'world'}));
    res.end();
}

function cmd(req, res) {

}

module.exports = {
    index: index,
    cmd: cmd
};