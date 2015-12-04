'use strict';

var config = require('../config.json');
var sqlite3 = require('sqlite3').verbose();

var storageFile = config.storage_file ? config.storage_file : './rsm.db';

var db = new sqlite3.Database(storageFile);
db.run("CREATE TABLE IF NOT EXISTS sentinels (" +
    "id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
    "sentinel TEXT NOT NULL UNIQUE," +
    "status TEXT NOT NULL DEFAULT 'OFF'" +
    ");");

var storage = {
    connection: db,
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
    getActiveSentinel: function(callback) {
        this.connection.get('SELECT sentinel FROM `sentinels` WHERE status="ON" LIMIT 1', callback);
    }
};

module.exports = storage;
