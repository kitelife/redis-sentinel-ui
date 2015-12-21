'use strict';

const Template = require('../utils/template');
const DB = require('../models/db');

function _stat_page(req, res) {
  DB.getClusterInfo(function(err, result) {

    if (err) {
        res.statusCode = 500;
        res.write('系统异常,请联系管理员');
        res.end();
        return;
    }

    var redisServers = [],
        serverIndexs = {
          'connected_client': '客户端连接数',
          'used_memory': '内存使用量'
        };
    var redisMaster = JSON.parse(result.master),
        redisSlaves = JSON.parse(result.slaves);

    redisServers.push(redisMaster.ip + ':' + redisMaster.port);
    Object.getOwnPropertyNames(redisSlaves).forEach(slave => {
      redisServers.push(slave);
    });

    res.write(Template.render('views/stat.jade', {
      servers: redisServers,
      indexs: serverIndexs
    }));
    res.end();
  });
}

module.exports = _stat_page;
