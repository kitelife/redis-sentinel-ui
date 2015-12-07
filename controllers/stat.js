/**
 * Created by xiayf on 15/12/7.
 */

'use strict';

const DB = require('../models/db');

const StatMapper = {
    'connected_client': DB.getRangeConnectedClient,
    'used_memory': DB.getRangeUsedMemory
};

function _checkStatName(statName) {
    return !!(statName in StatMapper);
}

function _checkStatTime(begin, end) {
    // 时间戳格式: "xxxx-xx-xx xx:xx:xx"
    let regexPattern = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
    if (begin.match(regexPattern) === null || end.match(regexPattern) === null) {
        return false;
    }
    return true;
}

function _checkStatTimeRange(begin, end) {
    let beginTimestamp = Date.parse(begin);
    let endTimestamp = Date.parse(end);

    let timeDiff = endTimestamp - beginTimestamp;

    // 考虑性能, 限制只能获取一周范围的数据
    return !!(timeDiff <= 7 * 24 * 3600 && timeDiff >= 0);
}

function _stat(req, res) {
    /**
     * 请求参数:
     *  - name: 指标名称
     *  - server: 目标服务器
     *  - begin_time: 开始时间
     *  - end_time: 截止时间
     */
    let statName = req.query.name;
    let targetServer = req.query.server;
    let statBeginTime = req.query.begin_time;
    let statEndTime = req.query.end_time;

    if (statName === undefined || targetServer === undefined
        || statBeginTime === undefined || statEndTime === undefined) {
        res.toResponse('缺少必要的请求参数!', 400);
        return;
    }
    if (_checkStatName(statName) === false) {
        res.toResponse('参数name不合法!', 400);
        return;
    }
    if (_checkStatTime(statBeginTime, statEndTime) === false) {
        res.toResponse('参数statBeginTime或statEndTime不合法!', 400);
        return;
    }
    if (_checkStatTimeRange(statBeginTime, statEndTime) === false) {
        res.toResponse('参数statBeginTime和statEndTime的时间范围不合法!', 400);
        return;
    }
    StatMapper[statName](targetServer, statBeginTime, statEndTime, function(err, result) {
        if (err) {
            res.toResponse(err.message, 500);
            return;
        }
        if (!result) {
            res.toResponse(JSON.stringify([]));
            return;
        }
        res.toResponse(result);
    });
}

module.exports = _stat;