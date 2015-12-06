/**
 * @file: db
 * @author: gejiawen
 * @date: 15/12/5 16:56
 * @description:
 *
 * 连接sqlite数据的model层
 *
 */

'use strict';

var StdUtil = require('util');

var config = require('../config');
var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database(config.storage_file);

/**
 * 初始化sqlite数据表
 */
var create_sentinels_sql = `
    CREATE TABLE IF NOT EXISTS sentinels (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        sentinel TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'OFF'
    );
`;
db.run(create_sentinels_sql);
db.run('DELETE FROM sentinels');

var create_clusterinfo_sql = `
    CREATE TABLE IF NOT EXISTS cluster_info (
        master_name TEXT NOT NULL UNIQUE,
        master TEXT NOT NULL DEFAULT '{}',
        slaves TEXT NOT NULL DEFAULT '{}',
        sentinels TEXT NOT NULL DEFAULT '{}'
    )
`;
db.run(create_clusterinfo_sql);
db.run('DELETE FROM cluster_info');
db.run('INSERT INTO `cluster_info` (`master_name`) VALUES (?)', config.master_name);

/*
var storage = {
    connection: db,
    // 更新数据库中sentinel的状态
    updateSentinelStatus: (sentinel_addr, status, callback) => {
        this.connection.run('REPLACE INTO `sentinels` (`sentinel`, `status`) VALUES (?, ?)',
            sentinel_addr,
            status,
            callback
        );
    },
    // 从数据库中获取某个sentinel的状态
    getSentinelPreviousStatus: (sentinel_addr, callback) => {
        this.connection.get('SELECT status FROM `sentinels` WHERE sentinel=?',
            sentinel_addr,
            callback
        );
    },
    // 从数据库中随便获取一个可用sentinel的地址
    getActiveSentinel: callback => {
        this.connection.get('SELECT sentinel FROM `sentinels` WHERE status="ON"',
            callback
        );
    }
};
*/

/**
 * 更新数据库中sentinel的状态
 *
 * @param sentinel_addr
 * @param status
 * @param callback
 * @private
 */
function _updateSentinelStatus(sentinel_addr, status, callback) {
    db.run('REPLACE INTO `sentinels` (`sentinel`, `status`) VALUES (?, ?)',
        sentinel_addr,
        status,
        callback
    );
}

/**
 * 从数据库中获取某个sentinel的状态
 *
 * @param sentinel_addr
 * @param callback
 * @private
 */
function _getSentinelPreviousStatus(sentinel_addr, callback) {
    db.get('SELECT status FROM `sentinels` WHERE sentinel=?',
        sentinel_addr,
        callback
    );
}

/**
 * 从数据库中随便获取一个可用sentinel的地址
 *
 * @param callback
 * @private
 */
function _getActiveSentinel(callback) {
    db.get('SELECT sentinel FROM `sentinels` WHERE status="ON"',
        callback
    );
}


function _saveClusterPart(partData, partName) {
    partData = JSON.stringify(partData);
    var masterName = config.master_name;
    var sql = StdUtil.format('UPDATE `cluster_info` SET `%s`=? WHERE `master_name`=?', partName);
    db.run(sql, partData, masterName);
}

function _getClusterInfo(callback) {
    var masterName = config.master_name;
    db.get('SELECT master, slaves, sentinels FROM `cluster_info` WHERE master_name=?',
        masterName, callback
    );
}

/**
 * Module Exports
 */
exports.update = _updateSentinelStatus;
exports.getPrev = _getSentinelPreviousStatus;
exports.getActive = _getActiveSentinel;
exports.saveClusterPart = _saveClusterPart;
exports.getClusterInfo = _getClusterInfo;
