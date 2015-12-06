'use strict';

var RedisSentinel = require('../models/sentinel');
var config = require('../config');

// 先获取一下
RedisSentinel.update_sentinel_status();

// 先执行一下,但得先等RedisSentinel.update_sentinel_status()执行完才能执行
setTimeout(RedisSentinel.fetch_cluster_status, 3000);

setInterval(RedisSentinel.update_sentinel_status, config.sentinel_status_interval);
setInterval(RedisSentinel.fetch_cluster_status, config.cluster_info_interval);
