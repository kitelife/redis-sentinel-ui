'use strict';

var RedisSentinel = require('./services/sentinel');
var config = require('./config');

// 先获取一下
RedisSentinel.update_sentinel_status();
RedisSentinel.fetch_cluster_status();

setInterval(RedisSentinel.update_sentinel_status,
    config.sentinel_status_interval ? config.sentinel_status_interval : 5000);

setInterval(RedisSentinel.fetch_cluster_status,
    config.cluster_info_interval ? config.cluster_info_interval : 10000);
