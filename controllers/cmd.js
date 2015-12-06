/**
 * @file: cmd
 * @author: gejiawen
 * @date: 15/12/5 18:00
 * @description: cmd
 */

'use strict';

var Sentinel = require('../models/sentinel');

/**
 *
 * @param req
 * @param res
 * @private
 */
function _cmd(req, res) {
    /**
     * 请求参数:
     * 1. cmd: 大写的Redis命令
     * 2. params: 命令参数, 多个参数以空格分隔
     */
    var cmd = req.body.cmd;
    if (!Sentinel.isValidCommand(cmd)) {
        res.toResponse('参数cmd不合法!', 400);
        return;
    }
    res.write(JSON.stringify(req.body));
    res.end();
}



/**
 * Module Exports
 */
module.exports = _cmd;
