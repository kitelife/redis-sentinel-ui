'use strict';

var RedisSentinel = require('./services/sentinel');
var config = require('./config.json');

setInterval(RedisSentinel.sentinel_status,
    config.sentinel_status_interval ? config.sentinel_status_interval : 5000);

setInterval(RedisSentinel.cluster_status,
    config.cluster_info_interval ? config.cluster_info_interval : 10000);
