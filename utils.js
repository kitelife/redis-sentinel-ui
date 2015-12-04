/**
 * Created by xiayf on 15/12/5.
 */

'use strict';

var util = require('util');

function formatUpTime(seconds) {
    var day = Math.floor(seconds / 86400);
    var hour = Math.floor(seconds % 86400 / 3600);
    var minute = Math.floor(seconds % 3600 / 60);
    var second = seconds % 60;

    return util.format('%d天%d时%d分%d秒', day, hour, minute, second);
}

module.exports = {
    formatUpTime: formatUpTime
};