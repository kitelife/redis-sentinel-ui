'use strict';

var RedisSentinel = require('./services/sentinel');
var Storage = require('./services/storage');

var monitorLoop = function () {
  RedisSentinel.sentinels.forEach(function(ele, index, arr) {
    ele.ping().then(function (result) {
      var sentinelInfo = ele.options;
      var sentinelAddress = sentinelInfo.host + ':' + sentinelInfo.port;
      var sentinelStatus = result === 'PONG' ? 'ON' : 'OFF';

      Storage.updateSentinelStatus(sentinelAddress, sentinelStatus);
    });
  });
};

setInterval(monitorLoop, 3000);
