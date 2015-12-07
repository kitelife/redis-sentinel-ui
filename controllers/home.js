/**
 * @file: home
 * @author: gejiawen
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
            Object.getOwnPropertyNames(redisSentinels).forEach(function(ele, index, arr) {
                var thisSentinel = redisSentinels[ele];
                allSentinel.push({
                    address: ele,
                    version: thisSentinel.redis_version,
                    process_id: thisSentinel.process_id,
                    uptime: Time.formatUpTime(thisSentinel.uptime_in_seconds)
                });
            });
        }

        var allRedis = [];
        var redisMaster = clusterInfo.master;
        if (redisMaster) {
            allRedis.push({
                address: redisMaster.ip + ':' + redisMaster.port,
                role: 'master',
                version: redisMaster.redis_version,
                process_id: redisMaster.process_id,
                uptime: Time.formatUpTime(redisMaster.uptime_in_seconds)
            });
            // console.log(allRedis);
        }
        var redisSlaves = clusterInfo.slaves;
        if (redisSlaves) {
            Object.getOwnPropertyNames(redisSlaves).forEach(function(ele, index, arr) {
                var thisSlave = redisSlaves[ele];
                allRedis.push({
                    address: ele,
                    role: 'slave',
                    version: thisSlave.redis_version,
                    process_id: thisSlave.process_id,
                    uptime: Time.formatUpTime(thisSlave.uptime_in_seconds)
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
