/**
 * @file: home
 * @author: gejiawen
 * @date: 15/12/5 18:00
 * @description: home
 */

'use strict';


const Sentinel = require('../models/sentinel');
const Template = require('../utils/template');
const Time = require('../utils/time');

/**
 * `/home`控制器
 * @param req
 * @param res
 * @private
 */
function _home(req, res) {
    var clusterInfo = Sentinel.getClusterInfo();
    var allSentinel = [];
    var redisSentinels = clusterInfo.Sentinels;

    if (redisSentinels) {
        Object.getOwnPropertyNames(redisSentinels).forEach(function(ele, index, arr) {
            var thisSentinel = redisSentinels[ele];
            allSentinel.push({
                address: ele,
                version: thisSentinel.redis_version,
                process_id: thisSentinel.process_id,
                uptime: utils.formatUpTime(thisSentinel.uptime_in_seconds)
            });
        });
    }

    var allRedis = [];
    var redisMaster = clusterInfo.Master;
    if (redisMaster) {
        allRedis.push({
            address: redisMaster.ip + ':' + redisMaster.port,
            role: 'master',
            version: redisMaster.redis_version,
            process_id: redisMaster.process_id,
            uptime: utils.formatUpTime(redisMaster.uptime_in_seconds)
        });
    }
    var redisSlaves = clusterInfo.Slaves;
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
}

/**
 * Module Exports
 */
module.exports = _home;
