/**
 * @file: routes.js
 * @author: gejiawen
 * @date: 15/12/4 17:19
 * @description: routes.js
 */

'use strict';

var urlParser = require('url');


function router(req, res) {
    var urlParts = urlParser.parse(req.url);

    if (urlParts.pathname === '/hello') {
        res.write('world');
        res.end();
        return;
    }
    res.write(urlParts.pathname);
    res.end();
}


/**
 * Module Exports.
 */
module.exports = router;
