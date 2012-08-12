require('coffee-script', true);

var $ = require('./lib/zepto', 'Zepto')
  , main = require('./coffee/main')
  ;
require('./coffee/plugins');

$(document).ready(function () {
  main();
});
