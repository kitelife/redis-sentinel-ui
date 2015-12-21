'use strict';

const Template = require('../utils/template');

function _cmd_page(req, res) {
  res.write(Template.render('views/cmd.jade'));
  res.end();
}

module.exports = _cmd_page;
