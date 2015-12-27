/**
 * @file: home
 * @author: youngsterxyf, gejiawen
 * @date: 15/12/5 18:00
 * @description: home
 */

'use strict';

const DB = require('../models/db');
const Template = require('../utils/template');
const Time = require('../utils/time');

/**
 * `/home`控制器
 * @param req
 * @param res
 * @private
 */
function _home(req, res) {
    DB.getClusterInfo(function(err, result) {
        if (err) {
            res.statusCode = 500;
            res.write('系统异常,请联系管理员');
            res.end();
            return;
        }

        if (!result) {
            result = {master: '{}', slaves: '{}', sentinels: '{}'};
        }

        var clusterInfo = {
            master: JSON.parse(result.master),
            slaves: JSON.parse(result.slaves),
            sentinels: JSON.parse(result.sentinels)
        };

        var allSentinel = [];
        var redisSentinels = clusterInfo.sentinels;

        if (redisSentinels) {
            Object.getOwnPropertyNames(redisSentinels).forEach(ele => {
                var thisSentinel = redisSentinels[ele];
                allSentinel.push({
                    address: ele,
                    version: thisSentinel.redis_version,
                    process_id: thisSentinel.process_id,
                    pending_cmds: thisSentinel["pending-commands"],
                    uptime: Time.formatUpTime(thisSentinel.uptime_in_seconds)
                });
            });
        }

        var allRedis = [];

        var rawRedisServers = {};
        var redisMaster = clusterInfo.master;
        if (redisMaster && Object.getOwnPropertyNames(redisMaster).length) {
            rawRedisServers[redisMaster.ip + ':' + redisMaster.port] = redisMaster;
        }
        var redisSlaves = clusterInfo.slaves;
        if (redisSlaves) {
            rawRedisServers = Object.assign(rawRedisServers, redisSlaves);
        }

        Object.getOwnPropertyNames(rawRedisServers).forEach(function(ele) {
            var thisRedisServer = rawRedisServers[ele];

            var hitRate = 0;
            var keySpaceHits = parseInt(thisRedisServer.keyspace_hits);
            var keySpaceMisses = parseInt(thisRedisServer.keyspace_misses);
            var keySpaceHitMisses = keySpaceHits + keySpaceMisses;
            if (keySpaceHitMisses > 0) {
                hitRate = (keySpaceHits / keySpaceHitMisses).toFixed(3);
            }

            allRedis.push({
                address: ele,
                role: thisRedisServer.role,
                version: thisRedisServer.redis_version,
                process_id: thisRedisServer.process_id,
                used_memory: thisRedisServer.used_memory_human,
                pending_cmds: thisRedisServer["pending-commands"],
                uptime: Time.formatUpTime(thisRedisServer.uptime_in_seconds),
                used_memory_peak: thisRedisServer.used_memory_peak_human,
                total_commands_processed: thisRedisServer.total_commands_processed,
                rejected_connections: thisRedisServer.rejected_connections,
                mem_fragmentation_ratio: thisRedisServer.mem_fragmentation_ratio,
                total_connections_received: thisRedisServer.total_connections_received,
                instantaneous_ops_per_sec: thisRedisServer.instantaneous_ops_per_sec,
                keyspace_hits: keySpaceHits,
                keyspace_misses: keySpaceMisses,
                hit_rate: hitRate,
                mem_allocator: thisRedisServer.mem_allocator,
                used_cpu_sys: thisRedisServer.used_cpu_sys,
                used_cpu_user: thisRedisServer.used_cpu_user,
                used_cpu_sys_children: thisRedisServer.used_cpu_sys_children,
                used_cpu_user_children: thisRedisServer.used_cpu_user_children
            });
        });

        var data = {
            sentinels: allSentinel,
            redises: allRedis
        };

        res.write(Template.render('views/home.jade', data));
        res.end();
    });
}

/**
 * Module Exports
 */
module.exports = _home;
