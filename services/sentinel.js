'use strict';

var Redis = require('ioredis');
var config = require('../config.json');

if (!Array.isArray(config.sentinels)) {
  console.error('请配置sentinel服务器');
}

var sentinels = [];

config.sentinels.forEach(function(ele, index, arr) {
    var oneSentinel = new Redis({
        host: ele.host ? ele.host : '127.0.0.1',
        port: ele.port ? ele.port : 26379,
        family: 4,
        password: ele.auth ? ele.auth : '',
        db: 0
    });
    sentinels.push(oneSentinel);
});

var redisConn = new Redis({
  sentinels: config.sentinels,
  name: 'mymaster'
});

module.exports = {
  'sentinels': sentinels,
  'connection': redisConn
};
