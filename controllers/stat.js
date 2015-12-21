/**
 * Created by xiayf on 15/12/7.
 */

'use strict';

const DB = require('../models/db');

const StatMapper = {
    'connected_client': DB.getRangeConnectedClient,
    'used_memory': DB.getRangeUsedMemory
};

const graphTypeMapper = {
  'connected_client': 'line',
  'used_memory': 'area'
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

    let timeDiff = (endTimestamp - beginTimestamp) / 1000;

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
    let statName = req.body.name;
    let targetServers = req.body.servers;
    let statBeginTime = req.body.begin_time;
    let statEndTime = req.body.end_time;

    if (statName === undefined || targetServers === undefined
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
    targetServers = targetServers.split(',');
    StatMapper[statName](targetServers, statBeginTime, statEndTime, function(err, result) {
        if (err) {
            res.toResponse(err.message, 500);
            return;
        }
        if (!result) {
            res.toResponse(JSON.stringify([]));
            return;
        }

        var targetSeriesData = {};

        result.forEach(record => {
            if (!(record.server in targetSeriesData)) {
                targetSeriesData[record.server] = [];
            }
          targetSeriesData[record.server].push([Date.parse(record.created_time), record.value]);
        });
        var respData = [];
        Object.getOwnPropertyNames(targetSeriesData).forEach(server => {
          respData.push({
            name: server,
            data: targetSeriesData[server]
          })
        });
        res.toResponse(JSON.stringify(respData));
    });
}

module.exports = _stat;
