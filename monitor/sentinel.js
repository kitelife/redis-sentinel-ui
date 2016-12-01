/**
 * @file: sentinel
 * @author: youngsterxyf, gejiawen
 * @date: 15/12/5 17:13
 * @description:
 *
 * redis sentinel model layout
 */

'use strict';

let Redis = require('ioredis');
let StdUtil = require('util');
let sqlite3 = require('sqlite3').verbose();
let config = require('../config');
let cmdRespParser = require('../utils/cmdRespParser');
let Logger = require('../utils/logger');

// 模式默认：OPEN_READWRITE | OPEN_CREATE
let db = new sqlite3.Database(config.storage_file);

/**
 * 更新数据库中sentinel的状态
 *
 * @param sentinel_addr
 * @param status
 * @param callback
 * @private
 */
let updateSentinelStatus = function (sentinel_addr, status, callback) {
    db.run('REPLACE INTO `sentinels` (`sentinel`, `status`) VALUES (?, ?)',
        sentinel_addr,
        status,
        callback
    );
};

let saveClusterPart = function (partData, partName) {
    partData = JSON.stringify(partData);
    let masterName = config.master_name;
    let sql = StdUtil.format('UPDATE `cluster_info` SET `%s`=? WHERE `master_name`=?', partName);
    db.run(sql, partData, masterName);
};

let addNewConnectedClient = function (server, clientNum) {
    db.run('INSERT INTO `connected_client` (`server`, `client_num`) VALUES (?, ?)',
        server, clientNum);
};

let addNewUsedMemory = function (server, usedMemory) {
    db.run('INSERT INTO `used_memory` (`server`, `used_memory`) VALUES (?, ?)',
        server, usedMemory);
};

let addNewCMDPS = function (server, cmd_ps) {
    db.run('INSERT INTO `cmd_ps` (`server`, `cmd_ps`) VALUES (?, ?)', server, cmd_ps);
};



// 1M = 1024 * 1024;
const oneM = 1048576;

// 存储Sentinel状态
let AllSentinelStatus = {};
// 存储Sentinel的连接对象
let RedisSentinels = [];
// 存储Redis的连接对象
let RedisServers = [];
// Sentinel集群信息
let ClusterInfo = {
    master: null,
    slaves: null,
    sentinels: null
};

config.sentinels.forEach(val => {
    RedisSentinels.push(new Redis({
        host: val.host,
        port: val.port
    }));
});

/**
 * 解析sentinel命令的结果
 *
 * @param result
 * @returns {{}}
 */
function _parseSentinelSingle(result) {
    let mapper = {};

    for (let start = 0, end = result.length - 1; start < end; start += 2) {
        mapper[result[start]] = result[start + 1];
    }

    return mapper;
}

/**
 *
 * @param result
 * @returns {{}}
 */
function _parseSentinelMulti(result) {
    let multiMapper = {};

    for (let start = 0, end = result.length; start < end; start++) {
        let parsedResult = _parseSentinelSingle(result[start]);
        let serverAddr = parsedResult.ip + ':' + parsedResult.port;
        multiMapper[serverAddr] = parsedResult;
    }

    return multiMapper;
}

/**
 *
 * @param first
 * @param second
 * @returns {*}
 */
function _mergeObject(first, second) {
    first = first || {};
    Object.getOwnPropertyNames(second).forEach(val => {
        first[val] = second[val];
    });

    return first;
}

/**
 *
 * @param host
 * @param port
 * @param group
 */
function _connAndInfo(host, port, group) {
    let redisServer = new Redis({
        host: host,
        port: port,
        password: group === 'sentinels' ? null : config.auth
    });

    redisServer.info().then(resp => {
        let parsedResp = cmdRespParser.infoRespParser(resp.split('\r\n'));
        let addr = host + ':' + port;

        if (group === 'master') {
            ClusterInfo[group] = _mergeObject(ClusterInfo[group], parsedResp);
        } else {
            ClusterInfo[group][addr] = _mergeObject(ClusterInfo[group][addr], parsedResp);
        }

        // 同步到数据库
        saveClusterPart(ClusterInfo[group], group);
        //
        redisServer.disconnect();
    });

    if (group !== 'sentinels') {
        let serverAddr = host + ':' + port;
        if (RedisServers.indexOf(serverAddr) === -1) {
            RedisServers.push(serverAddr);
        }
    }
}

/**
 * 获取集群的信息(包含当前主Redis的信息, 所有从Redis的信息, 以及所有Sentinel的信息)
 *
 * @private
 */
function _fetchClusterInfo() {
    let activeSentinel = null;

    let sentinelAddrs = Object.getOwnPropertyNames(AllSentinelStatus),
        sentinelNum = sentinelAddrs.length,
        sentinelIndex = 0;
    while (sentinelIndex < sentinelNum) {
        if (AllSentinelStatus[sentinelAddrs[sentinelIndex]] === 'ON') {
            activeSentinel = sentinelAddrs[sentinelIndex];
            break;
        }
        sentinelIndex++;
    }
    if (activeSentinel === null) {
        Logger.error('Now has no active sentinel');
        return;
    }

    let sentinelInfo = activeSentinel.split(':'),
        sentinelInstance = new Redis({
            host: sentinelInfo[0],
            port: sentinelInfo[1]
        }),
        countSign = 3;

    sentinelInstance.sentinel('master', config.master_name, (err, result) => {
        if (err) {
            Logger.error(err);
            return;
        }
        ClusterInfo.master = _parseSentinelSingle(result);

        /**
         * 创建到主Redis的连接,并查询其基本信息
         */
        _connAndInfo(ClusterInfo.master.ip, ClusterInfo.master.port, 'master');
        //
        if (countSign === 1) {
            sentinelInstance.disconnect();
        } else {
            countSign -= 1;
        }
    });

    sentinelInstance.sentinel('slaves', config.master_name, (err, result) => {
        if (err) {
            Logger.error(err);
            return;
        }
        ClusterInfo.slaves = _parseSentinelMulti(result);
        // 创建到从Redis的连接并查询其信息
        Object.getOwnPropertyNames(ClusterInfo.slaves).forEach(val => {
            let slave = ClusterInfo.slaves[val];
            _connAndInfo(slave.ip, slave.port, 'slaves');
        });
        //
        if (countSign === 1) {
            sentinelInstance.disconnect();
        } else {
            countSign -= 1;
        }
    });

    sentinelInstance.sentinel('sentinels', config.master_name, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }

        let parsedResultNoMe = _parseSentinelMulti(result);

        //
        let otherSentinelAddrs = Object.getOwnPropertyNames(parsedResultNoMe);
        if (otherSentinelAddrs.length) {
            let selectedAnotherSentinel = otherSentinelAddrs[0].split(':'),
                anotherSentinelInstance = new Redis({
                    host: selectedAnotherSentinel[0],
                    port: selectedAnotherSentinel[1]
                });

            anotherSentinelInstance.sentinel('sentinels', config.master_name, (err, result) => {
                if (err) {
                    console.error(err);
                    return;
                }

                ClusterInfo.sentinels = _mergeObject(parsedResultNoMe, _parseSentinelMulti(result));
                Object.getOwnPropertyNames(ClusterInfo.sentinels).forEach(val => {
                    let sentinel = ClusterInfo.sentinels[val];
                    _connAndInfo(sentinel.ip, sentinel.port, 'sentinels');
                });
                //
                anotherSentinelInstance.disconnect();
            });
        } else {
            ClusterInfo.sentinels = parsedResultNoMe;
            Object.getOwnPropertyNames(ClusterInfo.sentinels).forEach(val => {
                let sentinel = ClusterInfo.sentinels[val];
                _connAndInfo(sentinel.ip, sentinel.port, 'sentinels');
            });
        }
        //
        if (countSign === 1) {
            sentinelInstance.disconnect();
        } else {
            countSign -= 1;
        }
    });
}

// 检查所有sentinel是否可连, 并更新数据库中的状态
function _updateSentinelStatus() {
    RedisSentinels.forEach(val => {
        val.ping().then(function (result) {
            let sentinelInfo = val.options;
            let sentinelAddress = sentinelInfo.host + ':' + sentinelInfo.port;
            let sentinelStatus = result === 'PONG' ? 'ON' : 'OFF';

            if ((sentinelAddress in AllSentinelStatus)
                && (sentinelStatus !== AllSentinelStatus[sentinelAddress])
                && sentinelStatus === 'OFF') {
                // TODO: 发送告警
            }

            AllSentinelStatus[sentinelAddress] = sentinelStatus;
            updateSentinelStatus(sentinelAddress, sentinelStatus);
        });
    });
}

/**
 *
 * @private
 */
function _collectServerInfo() {
    RedisServers.forEach(addr => {
        let ipPort = addr.split(':'),
            newRedisConn = new Redis({
                host: ipPort[0],
                port: ipPort[1],
                password: config.auth
            });

        newRedisConn.info().then(resp => {
            let parsedResp = cmdRespParser.infoRespParser(resp.split('\r\n'));
            addNewConnectedClient(addr, parsedResp['connected_clients']);
            addNewUsedMemory(addr, (parsedResp['used_memory'] / oneM).toFixed(3));
            addNewCMDPS(addr, parsedResp['instantaneous_ops_per_sec']);
            //
            newRedisConn.disconnect();
        });
    });
}

/**
 * Module Exports
 */
module.exports = {
    fetch_cluster_status: _fetchClusterInfo,
    update_sentinel_status: _updateSentinelStatus,
    collect_server_info: _collectServerInfo
};
