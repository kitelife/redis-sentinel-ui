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
        var redisMaster = clusterInfo.master;
        if (redisMaster) {
            var hitRate = 0;
            var keySpaceHits = parseInt(redisMaster.keyspace_hits);
            var keySpaceMisses = parseInt(redisMaster.keyspace_misses);
            var keySpaceHitMisses = keySpaceHits + keySpaceMisses;
            if (keySpaceHitMisses > 0) {
                hitRate = (keySpaceHits / keySpaceHitMisses).toFixed(3);
            }
            allRedis.push({
                address: redisMaster.ip + ':' + redisMaster.port,
                role: 'master',
                version: redisMaster.redis_version,
                process_id: redisMaster.process_id,
                used_memory: redisMaster.used_memory_human,
                pending_cmds: redisMaster["pending-commands"],
                uptime: Time.formatUpTime(redisMaster.uptime_in_seconds),
                used_memory_peak: redisMaster.used_memory_peak_human,
                total_commands_processed: redisMaster.total_commands_processed,
                rejected_connections: redisMaster.rejected_connections,
                mem_fragmentation_ratio: redisMaster.mem_fragmentation_ratio,
                total_connections_received: redisMaster.total_connections_received,
                instantaneous_ops_per_sec: redisMaster.instantaneous_ops_per_sec,
                keyspace_hits: keySpaceHits,
                keyspace_misses: keySpaceMisses,
                hit_rate: hitRate,
                mem_allocator: redisMaster.mem_allocator
            });
            // console.log(allRedis);
        }
        var redisSlaves = clusterInfo.slaves;
        if (redisSlaves) {
            Object.getOwnPropertyNames(redisSlaves).forEach(function(ele, index, arr) {
                var thisSlave = redisSlaves[ele];
                var hitRate = 0;
                var keySpaceHits = parseInt(thisSlave.keyspace_hits);
                var keySpaceMisses = parseInt(thisSlave.keyspace_misses);
                var keySpaceHitMisses = keySpaceHits + keySpaceMisses;
                if (keySpaceHitMisses > 0) {
                    hitRate = (keySpaceHits / keySpaceHitMisses).toFixed(3);
                }
                allRedis.push({
                    address: ele,
                    role: 'slave',
                    version: thisSlave.redis_version,
                    process_id: thisSlave.process_id,
                    used_memory: thisSlave.used_memory_human,
                    pending_cmds: thisSlave["pending-commands"],
                    uptime: Time.formatUpTime(thisSlave.uptime_in_seconds),
                    used_memory_peak: thisSlave.used_memory_peak_human,
                    total_commands_processed: thisSlave.total_commands_processed,
                    rejected_connections: thisSlave.rejected_connections,
                    mem_fragmentation_ratio: thisSlave.mem_fragmentation_ratio,
                    total_connections_received: thisSlave.total_connections_received,
                    instantaneous_ops_per_sec: thisSlave.instantaneous_ops_per_sec,
                    keyspace_hits: keySpaceHits,
                    keyspace_misses: keySpaceHitMisses,
                    hit_rate: hitRate,
                    mem_allocator: thisSlave.mem_allocator
                });
            });
        }

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
