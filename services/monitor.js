'use strict';

var RedisSentinel = require('../models/sentinel');
var config = require('../config');

// 先获取一下
RedisSentinel.update_sentinel_status();
RedisSentinel.fetch_cluster_status();

setInterval(RedisSentinel.update_sentinel_status, config.sentinel_status_interval);
setInterval(RedisSentinel.fetch_cluster_status, config.cluster_info_interval);
