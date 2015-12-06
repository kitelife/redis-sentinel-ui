/**
 * Created by xiayf on 15/12/6.
 */

'use strict';

function _resp(content, code) {
    if (code === undefined) {
        code = 200;
    }
    this.statusCode = code;
    this.write(content);
    this.end();
}

exports.toRespone = _resp;