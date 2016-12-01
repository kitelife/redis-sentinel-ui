#!/usr/bin/env node
/**
 * Created by xiayf on 15/12/24.
 */

'use strict';

let config = require('./config');
let sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database(config.storage_file);

/**
 * 初始化sqlite数据表
 */
let create_sentinels_sql = `
    CREATE TABLE IF NOT EXISTS sentinels (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        sentinel TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'OFF'
    );
`;
db.serialize(function() {
    db.run(create_sentinels_sql);
    db.run('DELETE FROM sentinels');
});

let create_clusterinfo_sql = `
    CREATE TABLE IF NOT EXISTS cluster_info (
        master_name TEXT NOT NULL UNIQUE,
        master TEXT NOT NULL DEFAULT '{}',
        slaves TEXT NOT NULL DEFAULT '{}',
        sentinels TEXT NOT NULL DEFAULT '{}'
    )
`;
db.serialize(function() {
    db.run(create_clusterinfo_sql);
    db.run('DELETE FROM cluster_info');
    db.run('INSERT INTO `cluster_info` (`master_name`) VALUES (?)', config.master_name);
});

let create_connected_client = `
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

let create_used_memory = `
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

let create_cmd_per_second = `
CREATE TABLE IF NOT EXISTS cmd_ps (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    server TEXT NOT NULL,
    cmd_ps INTEGER NOT NULL,
    created_time NOT NULL DEFAULT (datetime('now','localtime'))
)
`;
db.run(create_cmd_per_second);
// 手动添加索引
// CREATE INDEX cmd_ps_server_idx ON cmd_ps (server);

db.close();