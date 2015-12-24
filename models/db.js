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
    stmtParams.unshift(sql);
    stmtParams.push(beginTime);
    stmtParams.push(endTime);
    stmtParams.push(callback);

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
    stmtParams.unshift(sql);
    stmtParams.push(beginTime);
    stmtParams.push(endTime);
    stmtParams.push(callback);

    db.all.apply(db, stmtParams);
}

function _addNewCMDPS(server, cmd_ps) {
    db.run('INSERT INTO `cmd_ps` (`server`, `cmd_ps`) VALUES (?, ?)', server, cmd_ps);
}

function _getRangeCMDPS(servers, beginTime, endTime, callback) {
    var serverCount = servers.length;

    var sql = 'SELECT cmd_ps AS value, server, created_time FROM `cmd_ps` WHERE server IN (?';
    while (serverCount > 1) {
        sql = sql + ', ?';
        serverCount = serverCount - 1;
    }
    sql += ') AND created_time>=? AND created_time<=? ORDER BY created_time';

    var stmtParams = servers;
    stmtParams.unshift(sql);
    stmtParams.push(beginTime);
    stmtParams.push(endTime);
    stmtParams.push(callback);

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
exports.addNewCMDPS = _addNewCMDPS;
exports.getRangeCMDPS = _getRangeCMDPS;
