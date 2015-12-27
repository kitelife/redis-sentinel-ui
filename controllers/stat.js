/**
 * Created by xiayf on 15/12/7.
 */

'use strict';

const DB = require('../models/db');

const StatMapper = {
    'connected_client': DB.getRangeConnectedClient,
    'used_memory': DB.getRangeUsedMemory,
    'cmd_ps': DB.getRangeCMDPS
};

const graphTypeMapper = {
    'connected_client': {
        type: 'spline',
        yAxis: {
            allowDecimals: false
        },
        value_type: 'int'
    },
    'used_memory': {
        type: 'area',
        value_type: 'float'
    },
    'cmd_ps': {
        type: 'spline',
        yAxis: {
            allowDecimals: false
        },
        value_type: 'int'
    }
};

const reduceAlgoMapper = {
    default: null,
    by_ave: _byAverage,
    by_max: _byMax
};

const DATA_POINT_THRESHOLD = 1000;

function _checkStatName(statName) {
    return !!(statName in StatMapper);
}

function _checkReduceWay(reduceWay) {
    return !!(reduceWay in reduceAlgoMapper);
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

function _findReduceFactor(length) {
    if (length < DATA_POINT_THRESHOLD * 2) {
        return 0;
    }
    return Math.floor(length / DATA_POINT_THRESHOLD);
}

function _byMax(rangeDataSet, beginIndex, reduceFactor, valueType) {
    var rangeMax = null;
    var upLimit = beginIndex + reduceFactor;
    for(var index = beginIndex; index < upLimit; index++) {
        var thisDataPoint = rangeDataSet[index];
        if (rangeMax === null) {
            rangeMax = thisDataPoint;
            continue;
        }
        if (thisDataPoint.value > rangeMax.value) {
            rangeMax = thisDataPoint;
        }
    }
    return [rangeMax.created_time, rangeMax.value];
}

function _byAverage(rangeDataSet, beginIndex, reduceFactor, valueType) {
    var valueSum = 0;
    var upLimit = beginIndex + reduceFactor;
    for(var index = beginIndex; index < upLimit; index++) {
        valueSum += rangeDataSet[index].value;
    }
    var aveValue = null;
    if (valueType === 'int') {
        aveValue = parseInt((valueSum/reduceFactor).toFixed(0));
    } else {
        aveValue = parseFloat((valueSum / reduceFactor).toFixed(3));
    }
    return [rangeDataSet[beginIndex].created_time, aveValue];
}

function _reduceDataSet(dataSet, algorithm, valueType) {
    var dataSetLength = dataSet.length;
    var reduceFactor = _findReduceFactor(dataSetLength);
    if (reduceFactor === 0) {
        return _justFormatDataSet(dataSet);
    }
    var reducedDataSet = [];
    var lastIndex = dataSetLength - (dataSetLength % reduceFactor);
    for(var index = 0; index < lastIndex; index = index+reduceFactor) {
        reducedDataSet.push(algorithm(dataSet, index, reduceFactor, valueType));
    }
    //
    var hasIteratedLength = reducedDataSet.length * reduceFactor;
    if (hasIteratedLength < dataSetLength) {
        for(var otherIndex = hasIteratedLength; otherIndex < dataSetLength; otherIndex++) {
            reducedDataSet.push([dataSet[otherIndex].created_time, dataSet[otherIndex].value]);
        }
    }
    return reducedDataSet;
}

function _justFormatDataSet(dataSet) {
    var formatedDataSet = [];
    dataSet.forEach(data => {
       formatedDataSet.push([data.created_time, data.value]);
    });
    return formatedDataSet;
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
    let reduceWay = req.body.reduce_way;

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
        res.toResponse('时间范围不合法! 应为: 0 < 结束时间点-开始时间点 < 7天', 400);
        return;
    }
    if (_checkReduceWay(reduceWay) === false) {
        res.toResponse('数据聚合方式不合法!', 400);
        return;
    }
    targetServers = targetServers.split(',');
    StatMapper[statName](targetServers, statBeginTime, statEndTime, function (err, result) {
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
            targetSeriesData[record.server].push({created_time: Date.parse(record.created_time), value: record.value});
        });
        var respData = {
            xAxis: graphTypeMapper[statName].xAxis ? graphTypeMapper[statName].xAxis : null,
            yAxis: graphTypeMapper[statName].yAxis ? graphTypeMapper[statName].yAxis : null,
            series: []
        };
        Object.getOwnPropertyNames(targetSeriesData).forEach(server => {
            var mySeriesData = null;
            if (reduceWay === 'default') {
                mySeriesData = _justFormatDataSet(targetSeriesData[server]);
            } else {
                mySeriesData = _reduceDataSet(targetSeriesData[server], reduceAlgoMapper[reduceWay],
                    graphTypeMapper[statName].value_type);
            }

            respData.series.push({
                name: server,
                type: graphTypeMapper[statName].type,
                marker: {
                    enabled: false
                },
                lineWidth: 1.5,
                data: mySeriesData
            });
        });

        res.toResponse(JSON.stringify(respData));
    });
}

module.exports = _stat;
