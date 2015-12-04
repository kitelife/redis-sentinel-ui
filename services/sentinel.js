'use strict';

var Redis = require('ioredis');
var Storage = require('./storage');
var config = require('../config.json');

if (!Array.isArray(config.sentinels)) {
  console.error('请配置sentinel服务器');
}

// 存储Sentinel的连接对象
var RedisSentinels = [];

config.sentinels.forEach(function(ele, index, arr) {
    var oneSentinel = new Redis({
        host: ele.host ? ele.host : '127.0.0.1',
        port: ele.port ? ele.port : 26379
    });
    RedisSentinels.push(oneSentinel);
});

// 存储Redis的连接对象
var RedisServers = {};

// 解析sentinel命令的结果

function parseSentinelSingle(result) {
    var endIndex = result.length - 1;
    var index = 0;
    var mapper = {};
    var key, value;

    while (index < endIndex) {
        key = result[index];
        value = result[index+1];
        mapper[key] = value;

        index += 2;
    }

    return mapper;
}

function parseSentinelMulti(result) {
    var length = result.length;

    var multiMapper = [];
    for(var index=0; index < length; index++) {
        multiMapper.push(parseSentinelSingle(result[index]));
    }
    return multiMapper;
}

// 获取集群的信息(包含当前主Redis的信息, 所有从Redis的信息, 以及所有Sentinel的信息)
function fetchClusterInfo() {
    Storage.getActiveSentinel(function(err, result) {
        if (err) {
            console.error(err);
            return;
        }

        var sentinelInfo = result.sentinel.split(':');
        var sentinelInstance = new Redis({
            host: sentinelInfo[0],
            port: sentinelInfo[1]
        });
        sentinelInstance.sentinel('master', config.master_name, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            global.Master = parseSentinelSingle(result);
        });
        sentinelInstance.sentinel('slaves', config.master_name, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }

            global.Slaves = parseSentinelMulti(result);
        });
        sentinelInstance.sentinel('sentinels', config.master_name, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }

            global.Sentinels = parseSentinelMulti(result);
        });
    })
}

// 检查所有sentinel是否可连, 并更新数据库中的状态
function updateSentinelStatus() {
    RedisSentinels.forEach(function(ele, index, arr) {
        ele.ping().then(function (result) {
            var sentinelInfo = ele.options;
            var sentinelAddress = sentinelInfo.host + ':' + sentinelInfo.port;
            var sentinelStatus = result === 'PONG' ? 'ON' : 'OFF';

            Storage.getSentinelPreviousStatus(sentinelAddress, function(err, result) {
                if (err || !result) {
                    return;
                }
                if (result.status === 'OFF' && result.status !== sentinelStatus) {
                    // 告警
                }
            });

            Storage.updateSentinelStatus(sentinelAddress, sentinelStatus);
        });
    });
}

function collectServerInfo() {
    var servers = RedisServers.keys();
    if (servers.length === 0) {
        return;
    }
    servers.forEach(function(ele, index, arr) {

    });
}

module.exports = {
    cluster_status: fetchClusterInfo,
    sentinel_status: updateSentinelStatus,
    server_info: collectServerInfo
};