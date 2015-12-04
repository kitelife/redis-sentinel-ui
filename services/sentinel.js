'use strict';

var Redis = require('ioredis');
var Storage = require('./storage');
var config = require('../config.json');

if (!Array.isArray(config.sentinels)) {
  console.error('请配置sentinel服务器');
}

var sentinels = [];

config.sentinels.forEach(function(ele, index, arr) {
    var oneSentinel = new Redis({
        host: ele.host ? ele.host : '127.0.0.1',
        port: ele.port ? ele.port : 26379
    });
    sentinels.push(oneSentinel);
});

var redisConn = new Redis({
  sentinels: config.sentinels,
  name: config.master_name,
  password: config.auth
});

// 获取
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
            console.log(result);
        });
        sentinelInstance.sentinel('slaves', config.master_name, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(result);
        });
        sentinelInstance.sentinel('sentinels', config.master_name, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(result);
        });
    })
}

function updateSentinelStatus() {
    sentinels.forEach(function(ele, index, arr) {
        ele.ping().then(function (result) {
            var sentinelInfo = ele.options;
            var sentinelAddress = sentinelInfo.host + ':' + sentinelInfo.port;
            var sentinelStatus = result === 'PONG' ? 'ON' : 'OFF';

            Storage.updateSentinelStatus(sentinelAddress, sentinelStatus);
        });
    });
}

module.exports = {
    sentinels: sentinels,
    connection: redisConn,
    cluster_status: fetchClusterInfo,
    sentinel_status: updateSentinelStatus
};