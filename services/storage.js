'use strict';

var config = require('../config.json');
var sqlite3 = require('sqlite3').verbose();

var storageFile = config.storage_file ? config.storage_file : './rsm.db';

var db = new sqlite3.Database(storageFile);

// 初始化,自动建表
db.run("CREATE TABLE IF NOT EXISTS sentinels (" +
    "id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
    "sentinel TEXT NOT NULL UNIQUE," +
    "status TEXT NOT NULL DEFAULT 'OFF'" +
    ");");

var storage = {
    connection: db,
    // 更新数据库中sentinel的状态
    updateSentinelStatus: function(sentinel_addr, status) {
        this.connection.run('REPLACE INTO `sentinels` (`sentinel`, `status`) VALUES (?, ?)',
            sentinel_addr, status,
            function(err) {
                if (err) {
                    console.error(err);
                }
            }
        );
    },
    // 从数据库中获取某个sentinel的状态
    getSentinelPreviousStatus: function(sentinel_addr, callback) {
        this.connection.get('SELECT status FROM `sentinels` WHERE sentinel=?', sentinel_addr, callback);
    },
    // 从数据库中随便获取一个可用sentinel的地址
    getActiveSentinel: function(callback) {
        this.connection.get('SELECT sentinel FROM `sentinels` WHERE status="ON" LIMIT 1', callback);
    }
};

module.exports = storage;
