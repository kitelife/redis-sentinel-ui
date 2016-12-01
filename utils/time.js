/**
 * @file: time
 * @author: gejiawen
 * @date: 15/12/5 18:13
 * @description: time
 */

'use strict';

const StdUtil = require('util');

// const moment = require('moment');

function _formatUpTime(seconds) {
    let day = Math.floor(seconds / 86400);
    let hour = Math.floor(seconds % 86400 / 3600);
    let minute = Math.floor(seconds % 3600 / 60);
    let second = seconds % 60;

    return StdUtil.format('%d天%d时%d分%d秒', day, hour, minute, second);
}

/**
 *
 * @param timestamp
 * @returns {*}
 * @private
 */
/*
function _formatUpTime(timestamp) {
    return moment(timestamp).format('DD天HH时mm分ss秒');
}
*/

/**
 * Module Exports
 */
exports.formatUpTime = _formatUpTime;
