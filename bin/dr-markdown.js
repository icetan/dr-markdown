#!/usr/bin/env node

var fs = require('fs'),
    file = process.argv[2];

function parse (stream) {
  var text = '';
  stream.resume();
  stream.on('data', function (chunk) { text += chunk; });
  stream.on('end', function () {
    var data = JSON.stringify({
          text: text,
          meta: { mode: 'read' }
        }),
        b64 = new Buffer(data).toString('base64');
    console.log('http://icetan.github.io/dr-markdown/v1/#base64/'+b64);
  });
}

if (file !== undefined) {
  parse(fs.createReadStream(file));
} else {
  parse(process.stdin);
}
