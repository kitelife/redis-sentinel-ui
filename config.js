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
const STORAGE_FILE_PATH = './rsm.db';

var configuration = {
    port: PORT,
    sentinels: [
        {
            host: '127.0.0.1',
            port: '26379'
        }, {
            host: '127.0.0.1',
            port: '26389'
        }, {
            host: '127.0.0.1',
            port: '26399'
        }
    ],
    master_name: 'mymaster',
    auth: null,
    storage_file: STORAGE_FILE_PATH,
    sentinel_status_interval: 30000,
    cluster_info_interval: 120000,
    server_stat: 5000
};


/**
 * Module Exports
 */

module.exports = configuration;

