/**
 * @file: config
 * @author: gejiawen
 * @date: 15/12/4 17:09
 * @description:
 *
 *  configuration
 *
 */

'use strict';

const PORT = 8080;

var configuration = {
    port: PORT,
    sentinels: [
        {
            host: "127.0.0.1",
            port: "26379"
        }, {
            host: "127.0.0.1",
            port: "26389"
        }, {
            host: "127.0.0.1",
            port: "26399"
        }
    ],
    master_name: "mymaster",
    auth: "1qazxsw2",
    storage_file: "./rsm.db",
    sentinel_status_interval: 5000,
    cluster_info_interval: 10000,
    server_info: 5000
};


/**
 * Module Exports
 */

module.exports = configuration;

