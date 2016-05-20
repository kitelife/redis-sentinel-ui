'use strict';

var child_process = require('child_process');

var monitor = child_process.fork('./monitor/monitor.js');

var exitCallback = function (code, signal) {
    console.log('code: ' + code + ', signal: ' + signal);
    monitor = child_process.fork('./monitor/monitor.js');
    monitor.on('exit', exitCallback);
}

monitor.on('exit', exitCallback);