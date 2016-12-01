'use strict';

let Log = require('log');

let config = require('../config');

let _logger = new Log(config.log_level ? config.log_level : 'info');

module.exports = _logger;