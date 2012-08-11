require('coffee-script', true);

var $ = require('./lib/zepto', 'Zepto')
  , main = require('./coffee/script')
  ;
require('./coffee/plugins');

$(document).ready(function () {
  main();
});
