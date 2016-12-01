#!/usr/bin/env node

'use strict';

let child_process = require('child_process');

let monitor = child_process.fork('./monitor/monitor.js');

let exitCallback = function (code, signal) {
    console.log('monitor.js, code: ' + code + ', signal: ' + signal);
    if (signal === 'SIGTERM') {
        return;
    }
    monitor = child_process.fork('./monitor/monitor.js');
    monitor.on('exit', exitCallback);
};

monitor.on('exit', exitCallback);

process.on('SIGTERM', function () {
    console.log('god.js, SIGTERM...');
    monitor.kill();
});