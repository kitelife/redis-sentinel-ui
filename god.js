'use strict';

var child_process = require('child_process');

var monitor = child_process.fork('./monitor/monitor.js');

var exitCallback = function (code, signal) {
    console.log('monitor.js, code: ' + code + ', signal: ' + signal);
    if (signal === 'SIGTERM') {
        return;
    }
    monitor = child_process.fork('./monitor/monitor.js');
    monitor.on('exit', exitCallback);
}

monitor.on('exit', exitCallback);

process.on('SIGTERM', function () {
    console.log('god.js, SIGTERM...');
    monitor.kill();
});