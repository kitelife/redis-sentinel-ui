/**
 * Created by xiayf on 15/12/24.
 */

'use strict';

var RedisSentinel = require('./sentinel');
var config = require('../config');

// 先获取一下
setTimeout(RedisSentinel.update_sentinel_status, 3000);

// 先执行一下,但得先等RedisSentinel.update_sentinel_status()执行完才能执行
setTimeout(RedisSentinel.fetch_cluster_status, 5000);

setInterval(RedisSentinel.update_sentinel_status, config.sentinel_status_interval);
setInterval(RedisSentinel.fetch_cluster_status, config.cluster_info_interval);
setInterval(RedisSentinel.collect_server_info, config.server_stat);