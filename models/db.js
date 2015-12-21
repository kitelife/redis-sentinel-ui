/**
 * @file: db
 * @author: youngsterxyf, gejiawen
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

var create_connected_client = `
CREATE TABLE IF NOT EXISTS connected_client (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    server TEXT NOT NULL,
    client_num INTEGER NOT NULL,
    created_time NOT NULL DEFAULT (datetime('now','localtime'))
);
`;
db.run(create_connected_client);
// 手动添加个索引吧
// CREATE INDEX connected_client_server_idx ON connected_client (server);

var create_used_memory = `
CREATE TABLE IF NOT EXISTS used_memory (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    server TEXT NOT NULL,
    used_memory REAL NOT NULL,
    created_time NOT NULL DEFAULT (datetime('now','localtime'))
);
`;
db.run(create_used_memory);
// 手动添加个索引吧
// CREATE INDEX used_memory_server_idx ON used_memory (server);
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

function _addNewConnectedClient(server, clientNum) {
    db.run('INSERT INTO `connected_client` (`server`, `client_num`) VALUES (?, ?)',
        server, clientNum);
}

function _getRangeConnectedClient(servers, beginTime, endTime, callback) {
    var serverCount = servers.length;

    var sql = 'SELECT client_num AS value, server, created_time FROM `connected_client` WHERE server IN (?';
    while (serverCount > 1) {
      sql = sql + ', ?';
      serverCount = serverCount - 1;
    }
    sql += ') AND created_time>=? AND created_time<=? ORDER BY created_time';

    var stmtParams = servers;
    stmtParams.push(beginTime);
    stmtParams.push(endTime);
    stmtParams.push(callback);
    stmtParams.unshift(sql);

    db.all.apply(db, stmtParams);
}

function _addNewUsedMemory(server, usedMemory) {
    db.run('INSERT INTO `used_memory` (`server`, `used_memory`) VALUES (?, ?)',
        server, usedMemory);
}

function _getRangeUsedMemory(servers, beginTime, endTime, callback) {
    var serverCount = servers.length;

    var sql = 'SELECT used_memory AS value, server, created_time FROM `used_memory` WHERE server IN (?';
    while (serverCount > 1) {
      sql = sql + ', ?';
      serverCount = serverCount - 1;
    }
    sql += ') AND created_time>=? AND created_time<=? ORDER BY created_time';

    var stmtParams = servers;
    stmtParams.push(beginTime);
    stmtParams.push(endTime);
    stmtParams.push(callback);
    stmtParams.unshift(sql);

    db.all.apply(db, stmtParams);
}

/**
 * Module Exports
 */
exports.updateSentinelStatus = _updateSentinelStatus;
exports.getPrev = _getSentinelPreviousStatus;
exports.getActive = _getActiveSentinel;
exports.saveClusterPart = _saveClusterPart;
exports.getClusterInfo = _getClusterInfo;
exports.addNewConnectedClient = _addNewConnectedClient;
exports.getRangeConnectedClient = _getRangeConnectedClient;
exports.addNewUsedMemory = _addNewUsedMemory;
exports.getRangeUsedMemory = _getRangeUsedMemory;
