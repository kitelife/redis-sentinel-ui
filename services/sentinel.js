'use strict';

var Redis = require('ioredis');
var Storage = require('./storage');
var config = require('../config');

if (!Array.isArray(config.sentinels)) {
    console.error('请配置sentinel服务器');
}

// 存储Sentinel的连接对象
var RedisSentinels = [];

config.sentinels.forEach(function (ele, index, arr) {
    var oneSentinel = new Redis({
        host: ele.host ? ele.host : '127.0.0.1',
        port: ele.port ? ele.port : 26379
    });
    RedisSentinels.push(oneSentinel);
});

// 存储Redis的连接对象
var RedisServers = {};
// Sentinel集群信息
var ClusterInfo = {};

// 解析sentinel命令的结果

function parseSentinelSingle(result) {
    var endIndex = result.length - 1;
    var index = 0;
    var mapper = {};
    var key, value;

    while (index < endIndex) {
        key = result[index];
        value = result[index + 1];
        mapper[key] = value;

        index += 2;
    }

    return mapper;
}

function parseSentinelMulti(result) {
    var length = result.length;

    var multiMapper = [];
    for (var index = 0; index < length; index++) {
        multiMapper.push(parseSentinelSingle(result[index]));
    }
    return multiMapper;
}

function connAndInfo(host, port, role) {
    var redisServer = new Redis({
        host: host,
        port: port,
        password: config.auth
    });
    RedisServers[host + ':' + port] = redisServer;
    redisServer.info().then(function(result) {
        console.log(role + ': ');
        console.log(result);
    });
}

// 获取集群的信息(包含当前主Redis的信息, 所有从Redis的信息, 以及所有Sentinel的信息)
function fetchClusterInfo() {
    Storage.getActiveSentinel(function (err, result) {
        if (err) {
            console.error(err);
            return;
        }

        if (!result) {
            console.log('Null Redis');
            return;
        }

        var sentinelInfo = result.sentinel.split(':');
        var sentinelInstance = new Redis({
            host: sentinelInfo[0],
            port: sentinelInfo[1]
        });
        sentinelInstance.sentinel('master', config.master_name, function (err, result) {
            if (err) {
                console.error(err);
                return;
            }
            ClusterInfo.Master = parseSentinelSingle(result);

            // 创建到主Redis的连接,并查询其基本信息
            connAndInfo(ClusterInfo.Master.ip, ClusterInfo.Master.port, 'master');
        });
        sentinelInstance.sentinel('slaves', config.master_name, function (err, result) {
            if (err) {
                console.error(err);
                return;
            }
            ClusterInfo.Slaves = parseSentinelMulti(result);

            // 创建到从Redis的连接并查询其信息
            ClusterInfo.Slaves.forEach(function(ele, index, arr) {
                connAndInfo(ele.ip, ele.port, 'slave');
            });
        });
        sentinelInstance.sentinel('sentinels', config.master_name, function (err, result) {
            if (err) {
                console.error(err);
                return;
            }

            ClusterInfo.Sentinels = parseSentinelMulti(result);
        });
    })
}

// 检查所有sentinel是否可连, 并更新数据库中的状态
function updateSentinelStatus() {
    RedisSentinels.forEach(function (ele, index, arr) {
        ele.ping().then(function (result) {
            var sentinelInfo = ele.options;
            var sentinelAddress = sentinelInfo.host + ':' + sentinelInfo.port;
            var sentinelStatus = result === 'PONG' ? 'ON' : 'OFF';

            Storage.getSentinelPreviousStatus(sentinelAddress, function (err, result) {
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
    servers.forEach(function (ele, index, arr) {

    });
}

module.exports = {
    fetch_cluster_status: fetchClusterInfo,
    update_sentinel_status: updateSentinelStatus,
    collect_server_info: collectServerInfo,
    cluster_info: ClusterInfo
};
