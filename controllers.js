/**
 * Created by xiayf on 15/12/4.
 */

'use strict';

var Template = require('./template');
var Sentinel = require('./services/sentinel');
var utils = require('./utils');

function index(req, res) {

    var clusterInfo = Sentinel.ClusterInfo();
    console.log(clusterInfo);

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
                uptime: utils.formatUpTime(thisSlave.uptime_in_seconds)
            });
        });
    }


    var data = {
        sentinels: allSentinel,
        redises: allRedis
    };
    res.write(Template.render('views/index.jade', data));
    res.end();
}

function cmd(req, res) {

}

module.exports = {
    index: index,
    cmd: cmd
};