'use strict';

var ValidRedisCMDs = require('ioredis/commands');

const Template = require('../utils/template');

function _cmd_page(req, res) {
    res.write(Template.render('views/cmd.jade', {
        cmdList: Object.getOwnPropertyNames(ValidRedisCMDs)
    }));
    res.end();
}

module.exports = _cmd_page;
