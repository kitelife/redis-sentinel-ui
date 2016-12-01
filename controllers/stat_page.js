'use strict';

let Template = require('../utils/template');
let DB = require('../models/db');
let Logger = require('../utils/logger');

let serverIndexs = {
    cmd_ps: '每秒处理命令数',
    connected_client: '客户端连接数',
    used_memory: '内存使用量'
};

let reduceWays = {
    default: '不聚合(时间范围大时慎重使用)',
    by_max: '最大值',
    by_ave: '均值'
};

function _stat_page(req, res) {
    DB.getClusterInfo(function (err, result) {
        if (err) {
            Logger.error(err);

            res.statusCode = 500;
            res.write('系统异常,请联系管理员');
            res.end();
            return;
        }

        let redisServers = [];
        let redisMaster = JSON.parse(result.master);
        let redisSlaves = JSON.parse(result.slaves);

        redisServers.push(redisMaster.ip + ':' + redisMaster.port);
        Object.getOwnPropertyNames(redisSlaves).forEach(slave => {
            redisServers.push(slave);
        });

        res.write(Template.render('views/stat.jade', {
            servers: redisServers,
            indexs: serverIndexs,
            ways: reduceWays
        }));
        res.end();
    });
}

module.exports = _stat_page;
