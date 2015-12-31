'use strict';

var Log = require('log');

var config = require('../config');

var _logger = new Log(config.log_level ? config.log_level : 'info');

module.exports = _logger;