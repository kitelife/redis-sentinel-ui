/**
 * Created by xiayf on 15/12/20.
 */

'use strict';

function _infoRespParser(resp) {
    var mapper = {};

    resp.forEach(val => {
        if (val.indexOf(':') === -1) {
            return;
        }

        let pairs = val.split(':');
        mapper[pairs[0]] = pairs[1];
    });

    return mapper;
}

exports.infoRespParser = _infoRespParser;