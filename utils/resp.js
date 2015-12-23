/**
 * Created by xiayf on 15/12/6.
 */

'use strict';

function _resp(content, code) {
    if (code === undefined) {
        code = 200;
    }
    this.statusCode = code;
    if (code >= 400) {
        // 解决响应体乱码问题
        this.writeHead(code, {'Content-Type': 'text/plain; charset=utf-8'});
    }
    this.write(content);
    this.end();
}

exports.toRespone = _resp;