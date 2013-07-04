;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
require('./coffee/main.coffee')();


},{"./coffee/main.coffee":2}],3:[function(require,module,exports){
var map, unify;

map = {
  '<=': '⇐',
  '=>': '⇒',
  '<=>': '⇔',
  '<-': '←',
  '->': '→',
  '<->': '↔',
  '...': '…',
  '--': '–',
  '---': '—',
  '^1': '¹',
  '^2': '²',
  '^3': '³',
  '1/2': '½',
  '1/4': '¼',
  '3/4': '¾'
};

unify = function(cm) {
  var m, pos, token;
  pos = cm.getCursor();
  m = /[^\s]+$/.exec(cm.getRange({
    line: pos.line,
    ch: 0
  }, pos));
  token = m != null ? m[0] : void 0;
  if ((token != null) && (map[token] != null)) {
    return cm.replaceRange(map[token], {
      line: pos.line,
      ch: pos.ch - token.length
    }, pos);
  }
};

CodeMirror.commands['unify'] = unify;

CodeMirror.keyMap["default"]['Ctrl-Space'] = 'unify';


},{}],4:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":5}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(require,module,exports){
/**
 *
 *  base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/

var base64 = {

  // private property
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  // public method for encoding
  encode : function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = base64._utf8_encode(input);

    while (i < input.length) {

      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output = output +
        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

    }

    return output;
  },

  // public method for decoding
  decode : function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }

    }

    output = base64._utf8_decode(output);

    return output;

  },

  // private method for UTF-8 encoding
  _utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    }

    return utftext;
  },

  // private method for UTF-8 decoding
  _utf8_decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) {

      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      }
      else {
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }

    }

    return string;
  }

}

module.exports = base64;

},{}],7:[function(require,module,exports){
var EventEmitter, State, base64, deserialize, extend, kvpToDict, lzw, serialize, state,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

base64 = require('../lib/base64');

lzw = require('../lib/lzw');

extend = function(r, d) {
  var k, v;
  if (r == null) {
    r = {};
  }
  for (k in d) {
    v = d[k];
    r[k] = v;
  }
  return r;
};

kvpToDict = function(d, kvp) {
  return d[kvp[0]] = (kvp[1] != null ? kvp[1] : true);
};

State = (function(_super) {
  __extends(State, _super);

  function State() {
    State.__super__.constructor.call(this);
    this.state = {
      toc: false,
      index: false
    };
    this.start();
  }

  State.prototype.encodeData = function(type, data, fn) {
    return State.coders[type].encode(data, function(data) {
      return fn(type + ';' + data);
    });
  };

  State.prototype.decodeData = function(data, fn) {
    var type, _ref;
    _ref = data.split(';', 2), type = _ref[0], data = _ref[1];
    return State.coders[type].decode(data, fn);
  };

  State.prototype.start = function() {
    var host, pathname, protocol, _ref;
    _ref = window.location, protocol = _ref.protocol, host = _ref.host, pathname = _ref.pathname;
    return this.baseUrl = protocol + '//' + host + pathname;
  };

  State.prototype.parseState = function(str) {
    var kvp, _i, _len, _ref, _results;
    _ref = str.split(',');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      kvp = _ref[_i];
      if (kvp !== '') {
        _results.push(kvpToDict(this.state, kvp.split('=')));
      }
    }
    return _results;
  };

  State.prototype.generateState = function() {
    var k, v;
    return ((function() {
      var _ref, _results;
      _ref = this.state;
      _results = [];
      for (k in _ref) {
        v = _ref[k];
        if ((v != null) && v !== false) {
          if (v === true) {
            _results.push(k);
          } else {
            _results.push(k + '=' + v);
          }
        }
      }
      return _results;
    }).call(this)).join(',');
  };

  State.prototype._get = function(type, id, fn) {
    return this.storage[type].get(id, fn);
  };

  State.prototype._save = function(type, data, fn) {
    return this.storage[type].save(data, fn);
  };

  State.prototype.parseHash = function(hash, fn) {
    var data, pos, state;
    if (hash.charAt(0 === '#')) {
      hash = hash.substring(1);
    }
    pos = hash.indexOf(';');
    if (pos === -1) {
      state = hash;
    } else {
      state = hash.substring(0, pos);
      data = hash.substring(pos + 1);
    }
    this.parseState(state);
    if (data != null) {
      return this.decodeData(data, function(data) {
        return fn(data);
      });
    } else {
      return fn();
    }
  };

  State.prototype.generateHash = function(type, data, fn) {
    var _this = this;
    if ((type != null) && (data != null)) {
      return this.encodeData(type, data, function(str) {
        return fn('#' + _this.generateState() + ';' + str);
      });
    } else {
      return fn('#' + this.generateState());
    }
  };

  State.prototype.replace = function() {
    return this._save(type, data, function(id, version) {
      return window.history.replaceState({}, '', type + '/' + id);
    });
  };

  State.prototype.has = function(type) {
    return (this.state[type] != null) && this.state[type] !== false;
  };

  State.prototype.set = function(type, val) {
    this.state[type] = val;
    return this.emit('change', type, val);
  };

  State.prototype.toggle = function(type) {
    return this.set(type, !this.has(type));
  };

  return State;

})(EventEmitter);

deserialize = function() {
  var id, type, _ref;
  _ref = window.location.hash.substr(1).split('/', 2), type = _ref[0], id = _ref[1];
  return {
    type: type,
    id: id
  };
};

serialize = function(data) {
  return window.location.hash = '#' + data.type + '/' + data.id;
};

state = new EventEmitter;

state.storeType = 'base64';

state.storeId = '';

state.stores = {
  base64: {
    store: function(id, data, callback) {
      return callback(base64.encode(JSON.stringify(data || '{}')));
    },
    restore: function(id, callback) {
      return callback(JSON.parse(base64.decode(id) || '{}'));
    }
  }
};

state.store = function(storeType, data, callback) {
  if (storeType) {
    state.storeType = storeType;
  }
  return state.stores[state.storeType].store(state.storeId, data, function(storeId) {
    state.storeId = storeId;
    serialize({
      type: state.storeType,
      id: storeId
    });
    return typeof callback === "function" ? callback(storeId) : void 0;
  });
};

state.restore = function(storeType, storeId, callback) {
  var _ref;
  if ((storeType == null) && (storeId == null)) {
    _ref = deserialize(), storeType = _ref.type, storeId = _ref.id;
  }
  if (storeType) {
    state.storeType = storeType;
  }
  state.storeId = storeId;
  if (storeId != null) {
    return state.stores[state.storeType].restore(state.storeId, function(data) {
      return callback(data);
    });
  }
};

window.addEventListener('hashchange', function() {
  var storeId, storeType, _ref;
  _ref = deserialize(), storeType = _ref.type, storeId = _ref.id;
  if (storeType !== state.storeType || storeId !== state.storeId) {
    return state.restore(storeType, storeId, function(data) {
      return store.emit('restore', data);
    });
  }
});

module.exports = {
  State: State,
  state: state
};


},{"events":4,"../lib/base64":6,"../lib/lzw":8}],8:[function(require,module,exports){
// LZW-compress a string
function encode(s) {
  var data = (s + "").split("");
  if (data.length === 0) return "";
  var dict = {};
  var out = [];
  var currChar;
  var phrase = data[0];
  var code = 256;
  for (var i=1; i<data.length; i++) {
    currChar=data[i];
    if (dict[phrase + currChar] != null) {
      phrase += currChar;
    }
    else {
      out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
      dict[phrase + currChar] = code;
      code++;
      phrase=currChar;
    }
  }
  out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
  for (var i=0; i<out.length; i++) {
    out[i] = String.fromCharCode(out[i]);
  }
  return out.join("");
}

// Decompress an LZW-encoded string
function decode(s) {
  var data = (s + "").split("");
  if (data.length === 0) return "";
  var dict = {};
  var currChar = data[0];
  var oldPhrase = currChar;
  var out = [currChar];
  var code = 256;
  var phrase;
  for (var i=1; i<data.length; i++) {
    var currCode = data[i].charCodeAt(0);
    if (currCode < 256) {
      phrase = data[i];
    }
    else {
      phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
    }
    out.push(phrase);
    currChar = phrase.charAt(0);
    dict[code] = oldPhrase + currChar;
    code++;
    oldPhrase = phrase;
  }
  return out.join("");
}

module.exports = {
  encode: encode,
  decode: decode
};

},{}],9:[function(require,module,exports){
var auth, clientId, clientSecret, extend, parseQuery, redirect, state, toDict, xhr;

xhr = require('./xhr.coffee');

extend = function(r, d) {
  var k, v;
  if (r == null) {
    r = {};
  }
  for (k in d) {
    v = d[k];
    r[k] = v;
  }
  return r;
};

toDict = function(array, dict) {
  var kvp, _i, _len;
  if (dict == null) {
    dict = {};
  }
  for (_i = 0, _len = array.length; _i < _len; _i++) {
    kvp = array[_i];
    dict[kvp[0]] = kvp[1];
  }
  return dict;
};

parseQuery = function(s) {
  var kvp;
  return toDict((function() {
    var _i, _len, _ref, _results;
    _ref = s.replace(/^\?/, '').split('&');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      kvp = _ref[_i];
      _results.push(kvp.split('='));
    }
    return _results;
  })());
};

state = require('./State.coffee').state;

clientId = '04c4de3332664d704642';

clientSecret = 'c8d6ab58bbf8095c82c0f11e57db92bf2b9f76be';

redirect = window.location.href;

auth = function() {
  var query, rnd, x, xOrigState;
  query = parseQuery(window.location.search);
  if (query.code) {
    xOrigState = window.localStorage.getItem('x-orig-state');
    window.localStorage.removeItem('x-orig-state');
    if (xOrigState !== query.state) {
      return console.error('cross origin state has been tampered with.');
    }
    return xhr({
      method: 'POST',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: clientId,
        client_secret: clientSecret,
        code: query.code
      }
    }, function(err, data) {
      return console.log(data);
    });
  } else if (query.error) {

  } else {
    rnd = ((function() {
      var _i, _results;
      _results = [];
      for (x = _i = 0; _i <= 10; x = ++_i) {
        _results.push('0123456789abcdef'[Math.random() * 16 | 0]);
      }
      return _results;
    })()).join('');
    window.localStorage.setItem('x-orig-state', rnd);
    return window.open("https://github.com/login/oauth/authorize?client_id=" + clientId + "&scope=gist&state=" + rnd + "&redirect_uri=" + redirect);
  }
};

state.stores.gist = {
  store: function(id, data, callback) {
    return xhr.json({
      method: id ? 'PATCH' : 'POST',
      url: 'https://api.github.com/gists' + (id ? '/' + id : ''),
      data: {
        description: 'Created with Dr. Markdown',
        files: {
          'main.md': {
            content: data.text
          },
          'state.json': {
            content: JSON.stringify(data.state)
          }
        }
      }
    }, function(err, data) {
      return callback(data.id);
    });
  },
  restore: function(id, callback) {
    return xhr.json({
      url: 'https://api.github.com/gists/' + id
    }, function(err, data) {
      var stateUrl, textUrl, _ref, _ref1, _ref2;
      _ref = data.files, (_ref1 = _ref['main.md'], textUrl = _ref1.raw_url), (_ref2 = _ref['state.json'], stateUrl = _ref2.raw_url);
      return xhr.json({
        url: stateUrl
      }, function(err, state) {
        return xhr({
          url: textUrl
        }, function(err, text) {
          return callback({
            text: text,
            state: state
          });
        });
      });
    });
  }
};

setTimeout((function() {
  return auth();
}), 1000);


},{"./State.coffee":7,"./xhr.coffee":10}],10:[function(require,module,exports){
var xhr;

xhr = function(opt, callback) {
  var header, r, value, _ref;
  r = new XMLHttpRequest;
  r.open(opt.method || 'GET', opt.url, true);
  r.onreadystatechange = function() {
    if (r.readyState === 4) {
      if (r.status >= 200 && r.status < 300) {
        return callback(void 0, r.responseText, r);
      } else {
        return callback(r.statusText, r.responseText, r);
      }
    }
  };
  _ref = opt.headers;
  for (header in _ref) {
    value = _ref[header];
    r.setRequestHeader(header, value);
  }
  r.send(opt.data);
  return r;
};

xhr.json = function(opt, callback) {
  var callback_;
  callback_ = function(err, json, xhr) {
    var data, err_;
    if ((err != null) || !json) {
      return callback(err, void 0, xhr);
    }
    try {
      data = JSON.parse(json);
    } catch (_error) {
      err_ = _error;
      err = err_;
    }
    return callback(err, data, xhr);
  };
  opt.data = JSON.stringify(opt.data);
  opt.headers = {
    'Content-Type': 'application/json'
  };
  return xhr(opt, callback_);
};

module.exports = xhr;


},{}],11:[function(require,module,exports){
module.exports = {
  getCursorPosition: function(el) {
    var Sel, SelLength, pos;
    pos = 0;
    if (document.selection) {
      el.focus();
      Sel = document.selection.createRange();
      SelLength = document.selection.createRange().text.length;
      Sel.moveStart('character', -el.value.length);
      pos = Sel.text.length - SelLength;
    } else if (el.selectionStart || el.selectionStart === 0) {
      pos = el.selectionStart;
    }
    return pos;
  },
  number: function(el) {
    var count, elems, h, i, map, n, num, order, reset, sel, selector, t, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    selector = 'H1,H2,H3,H4,H5,H6';
    elems = [];
    order = selector.split(',');
    map = {};
    for (i = _i = 0, _len = order.length; _i < _len; i = ++_i) {
      sel = order[i];
      map[sel] = {
        c: 0,
        pos: i
      };
    }
    num = function(tag) {
      var c, t;
      return ((function() {
        var _j, _ref, _results;
        _results = [];
        for (i = _j = 0, _ref = map[tag].pos; 0 <= _ref ? _j <= _ref : _j >= _ref; i = 0 <= _ref ? ++_j : --_j) {
          if ((c = map[(t = order[i])].c) !== 0 && (t !== 'OL' && t !== 'UL')) {
            _results.push(c);
          }
        }
        return _results;
      })()).join(',');
    };
    count = function(sel) {
      var e, _j, _ref, _ref1, _results;
      e = map[sel];
      e.c++;
      _results = [];
      for (i = _j = _ref = e.pos + 1, _ref1 = order.length; _ref <= _ref1 ? _j < _ref1 : _j > _ref1; i = _ref <= _ref1 ? ++_j : --_j) {
        _results.push(map[order[i]].c = 0);
      }
      return _results;
    };
    reset = function(clear) {
      var obj, _results;
      if (clear) {
        elems = [];
      }
      _results = [];
      for (sel in map) {
        obj = map[sel];
        _results.push(obj.c = 0);
      }
      return _results;
    };
    _ref = el.querySelectorAll('[data-number-reset],[data-number-clear],' + selector);
    for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
      h = _ref[i];
      if (h.hasAttribute('data-number-reset')) {
        reset();
      } else if (h.hasAttribute('data-number-clear')) {
        reset(true);
      } else {
        t = h.tagName;
        count(t);
        if (t !== 'OL' && t !== 'UL') {
          elems.push([h, num(t)]);
        }
      }
    }
    for (_k = 0, _len2 = elems.length; _k < _len2; _k++) {
      _ref1 = elems[_k], h = _ref1[0], n = _ref1[1];
      h.setAttribute('data-number', n);
    }
    return el;
  },
  index: function(el) {
    var e, _i, _len, _ref;
    _ref = el.querySelectorAll('[data-number]');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i];
      e.innerHTML = ("<span class=\"index\">\n" + (e.getAttribute('data-number').split(',').join('. ')) + ".\n</span>") + e.innerHTML;
    }
    return el;
  },
  toc: function(el) {
    var e;
    return '<ul>' + ((function() {
      var _i, _len, _ref, _results;
      _ref = el.querySelectorAll('H1,H2,H3,H4,H5,H6');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        _results.push("<li><a href=\"#" + e.id + "\"><" + e.tagName + ">\n" + e.innerHTML + "\n</" + e.tagName + "></a></li>");
      }
      return _results;
    })()).join('') + '</ul>';
  }
};


},{}],12:[function(require,module,exports){
!function(obj) {
  if (typeof module !== 'undefined')
    module.exports = obj;
  else
    window.vixen = obj;
}(function() {
  function trim(str) {return String.prototype.trim.call(str);};

  function resolveProp(obj, name) {
    return name.trim().split('.').reduce(function (p, prop) {
      return p ? p[prop] : undefined;
    }, obj);
  }

  function resolveChain(obj, chain) {
    var prop = chain.shift();
    return chain.reduce(function (p, prop) {
      var f = resolveProp(obj, prop);
      return f ? f(p) : p;
    }, resolveProp(obj, prop));
  }

  function bucket(b, k, v) {
    if (!(k in b)) b[k] = [];
    if (!(v in b[k])) b[k].push(v);
  }

  function extend(orig, obj) {
    Object.keys(obj).forEach(function(prop) {
      orig[prop] = obj[prop];
    });
    return orig;
  }

  function traverseElements(el, callback) {
    var i;
    if (callback(el) !== false) {
      for(i = el.children.length; i--;) (function (node) {
        traverseElements(node, callback);
      })(el.children[i]);
    }
  }

  function createProxy(maps, proxy) {
    proxy = proxy || {};
    proxy.extend = function(obj) {
      var toRender = {};
      Object.keys(obj).forEach(function(prop) {
        maps.orig[prop] = obj[prop];
        if (maps.binds[prop]) maps.binds[prop].forEach(function(renderId) {
          if (renderId >= 0) toRender[renderId] = true;
        });
      });
      for (renderId in toRender) maps.renders[renderId](maps.orig);
      return proxy;
    };

    Object.keys(maps.binds).forEach(function(prop) {
      var ids = maps.binds[prop];
      Object.defineProperty(proxy, prop, {
        set: function(value) {
          maps.orig[prop] = value;
          ids.forEach(function(renderId) {
            if (renderId >= 0) maps.renders[renderId](maps.orig);
          });
        },
        get: function() {
          if (maps.rebinds[prop])
            return maps.rebinds[prop]();
          return maps.orig[prop];
        }
      });
    });
    return proxy;
  }

  return function(el, model) {
    var pattern = /\{\{.+?\}\}/g,
        pipe = '|';

    function resolve(orig, prop) {
      if (!orig) return '';
      var val = resolveChain(orig, prop.slice(2,-2).split(pipe));
      return val === undefined ? '' : val;
    }

    function strTmpl(str, orig) {
      return str.replace(pattern, resolve.bind(undefined, orig));
    }

    function match(str) {
      var m = str.match(pattern);
      if (m) return m.map(function(chain) {
        return chain.slice(2, -2).split(pipe).map(trim);
      });
    }

    function traverse(el, orig) {
      var binds = {},
          rebinds = {},
          renders = {},
          count = 0;
      orig = orig || {};

      function bindRenders(chains, renderId) {
        // Create property to render mapping
        chains.forEach(function(chain) {
          // TODO: Register chaining functions as binds as well.
          bucket(binds, chain[0].split('.')[0], renderId);
        });
      }

      function parseIterator(el) {
        var marker, prefix = '', nodes = [];
        if (parent_ = (el.parentElement || el.parentNode)) {
          if (el.tagName === 'FOR') {
            marker = el.ownerDocument.createTextNode('');
            parent_.replaceChild(marker, el);
          } else if (el.getAttribute('data-in')) {
            prefix = 'data-';
            parent_ = el;
            nodes = Array.prototype.slice.call(el.childNodes);
            marker = el.ownerDocument.createTextNode('');
            parent_.appendChild(marker);
          } else return;
          return {
            alias: el.getAttribute(prefix+'value'),
            key: el.getAttribute(prefix+'key'),
            prop: el.getAttribute(prefix+'in'),
            each: el.getAttribute(prefix+'each'),
            nodes: nodes,
            parent: parent_,
            marker: marker
          };
        }
      }

      function mapAttribute(owner, attr) {
        var name, eventId, renderId, str, noTmpl;
        if ((str = attr.value) && (chains = match(str))) {
          name = attr.name;
          if (name.indexOf('vx-') === 0) {
            owner.removeAttribute(name);
            name = name.substr(3);
          }
          if (name.indexOf('on') === 0) {
            renderId = -1; // No renderer
            eventName = name.substr(2);
            // Add event listeners
            chains.forEach(function(chain) {
              owner.addEventListener(eventName, function(evt) {
                return resolveProp(orig, chain[0])(evt, owner.value);
              });
            });
            owner.removeAttribute(name);
          } else {
            noTmpl = chains.length === 1 && str.substr(0,1) === '{' &&
              str.substr(-1) === '}';
            // Create rendering function for attribute.
            renderId = count++;
            (renders[renderId] = function(orig, clear) {
              var val = noTmpl ? resolve(orig, str) : strTmpl(str, orig);
              !clear && name in owner ? owner[name] = val :
                owner.setAttribute(name, val);
            })(orig, true);
            // Bi-directional coupling.
            if (noTmpl) rebinds[chains[0][0]] = function() {
                // TODO: Getting f.ex. 'value' attribute from an input
                // doesn't return user input value so accessing element
                // object properties directly, find out how to do this
                // more securely.
                return name in owner ?
                  owner[name] : owner.getAttribute(name);
              };
          }
          bindRenders(chains, renderId);
        }
      }

      function mapTextNodes(el) {
        for (var i = el.childNodes.length; i--;) (function(node) {
          var str, renderId, chains;
          if (node.nodeType === el.TEXT_NODE && (str = node.nodeValue) &&
              (chains = match(str))) {
            // Create rendering function for element text node.
            renderId = count++;
            (renders[renderId] = function(orig) {
              node.nodeValue = strTmpl(str, orig);
            })(orig);
            bindRenders(chains, renderId);
          }
        })(el.childNodes[i]);
      }

      // Remove no-traverse attribute if root node
      el.removeAttribute('data-subview');

      traverseElements(el, function(el_) {
        var i, iter, template, nodes, renderId;

        // Stop handling and recursion if subview.
        if (el_.getAttribute('data-subview') !== null) return false;

        if (iter = parseIterator(el_)) {
          nodes = iter.nodes;
          template = el_.cloneNode(true);
          maps = traverse(template.cloneNode(true));
          renderId = count++;
          (renders[renderId] = function(orig) {
            var list = resolveProp(orig, iter.prop),
                each_ = iter.each && resolveProp(orig, iter.each), i;
            for (i = nodes.length; i--;) iter.parent.removeChild(nodes[i]);
            nodes = [];
            for (i in list) if (list.hasOwnProperty(i))
              (function(value, i){
                var orig_ = extend({}, orig),
                    clone = template.cloneNode(true),
                    lastNode = iter.marker,
                    maps, renderId, i_, node, nodes_ = [];
                if (iter.key) orig_[iter.key] = i;
                orig_[iter.alias] = value;
                maps = traverse(clone, orig_);
                for (i_ = clone.childNodes.length; i_--; lastNode = node) {
                  nodes_.push(node = clone.childNodes[i_]);
                  iter.parent.insertBefore(node, lastNode);
                }
                if (each_ && each_(value, i, orig_, nodes_.filter(function(n) {
                  return n.nodeType === el_.ELEMENT_NODE;
                })) != null) {
                  for (i_ = nodes_.length; i_--;)
                    iter.parent.removeChild(nodes_[i_]);
                } else {
                  nodes = nodes.concat(nodes_);
                }
              })(list[i], i);
          })(orig);
          bucket(binds, iter.prop.split('.')[0], renderId);
          for (p in maps.binds) if (iter.alias.indexOf(p) === -1)
            bucket(binds, p, renderId);
        } else {
          // Bind node text.
          mapTextNodes(el_);
        }
        // Bind node attributes if not a <for>.
        if (el_.tagName !== 'FOR') for (i = el_.attributes.length; i--;)
          mapAttribute(el_, el_.attributes[i]);
        // Stop recursion if iterator.
        return !iter;
      });
      return {orig:orig, binds:binds, rebinds:rebinds, renders:renders};
    }
    return createProxy(traverse(el, model && extend({}, model)), model);
  };
}());

},{}],2:[function(require,module,exports){
var Showdown, State, index, markdown, number, proxy, state_, toc, vixen, _ref, _ref1;

vixen = require('vixen');

Showdown = require('showdown');

markdown = new Showdown.converter();

require('./unify.coffee');

_ref = require('./State.coffee'), State = _ref.State, state_ = _ref.state;

require('./state-gist.coffee');

_ref1 = require('./utils.coffee'), number = _ref1.number, index = _ref1.index, toc = _ref1.toc;

proxy = function() {
  var proxy_, vault_;
  vault_ = {};
  return proxy_ = {
    def: function(prop, callback) {
      return Object.defineProperty(proxy_, prop, {
        set: function(value) {
          var old;
          old = vault_[prop];
          vault_[prop] = value;
          return callback(value, old);
        },
        get: function() {
          return vault_[prop];
        }
      });
    }
  };
};

module.exports = function() {
  var cursorToken, docTitle, editor, model, saveTimer, saved, setIndex, setMode, setState, setToc, showDnd, state, tocEl, updateIndex, updateStatus, updateToc, updateView, viewEl, viewWrapEl;
  state = {};
  tocEl = document.getElementById('toc');
  viewEl = document.getElementById('view');
  viewWrapEl = document.getElementById('view-wrap');
  docTitle = function() {
    var h, tmp;
    tmp = document.createElement('div');
    tmp.innerHTML = (h = viewEl.querySelectorAll('h1,h2,h3')[0]) ? h.innerHTML : 'Untitled';
    [].forEach.call(tmp.querySelectorAll('.index'), function(el) {
      return tmp.removeChild(el);
    });
    return tmp.textContent;
  };
  saved = true;
  updateStatus = function(force) {
    if (!saved || force) {
      state_.store(null, {
        text: editor.getValue(),
        state: state
      });
      document.title = docTitle();
      return saved = true;
    }
  };
  updateToc = function() {
    return tocEl.innerHTML = toc(viewEl);
  };
  updateIndex = function() {
    return index(number(viewEl));
  };
  cursorToken = '^^^cursor^^^';
  updateView = function() {
    var cline, cursorHeight, cursorSpan, cursorTop, md, scrollTop, v, viewHeight;
    cline = editor.getCursor().line;
    md = editor.getValue().split('\n');
    md[cline] += cursorToken;
    md = md.join('\n');
    v = viewEl;
    v.innerHTML = markdown.makeHtml(md).replace(cursorToken, '<span id="cursor"></span>');
    if (state.index) {
      updateIndex();
    }
    if (state.toc) {
      updateToc();
    }
    scrollTop = viewWrapEl.scrollTop;
    viewHeight = viewWrapEl.offsetHeight;
    cursorSpan = document.getElementById('cursor');
    cursorTop = cursorSpan.offsetTop;
    cursorHeight = cursorSpan.offsetHeight;
    if (cursorTop < scrollTop || cursorTop > scrollTop + viewHeight - cursorHeight) {
      return viewWrapEl.scrollTop = cursorTop - viewHeight / 2;
    }
  };
  setMode = function(mode) {
    return model.mode = {
      write: 'full-input',
      read: 'full-view'
    }[mode] || '';
  };
  setToc = function(to) {
    if (to) {
      updateToc();
    }
    return model.showToc = to ? 'toc' : '';
  };
  setIndex = function(to) {
    if (to) {
      if (document.querySelectorAll('#view [data-number]').length === 0) {
        updateIndex();
        if (state.toc) {
          updateToc();
        }
      }
      return model.showIndex = 'indexed';
    } else {
      return model.showIndex = '';
    }
  };
  saveTimer = null;
  editor = CodeMirror.fromTextArea(document.getElementById('input-md'), {
    mode: 'gfm',
    theme: 'default',
    lineNumbers: false,
    lineWrapping: true,
    onChange: function() {
      updateView();
      saved = false;
      clearTimeout(saveTimer);
      return saveTimer = setTimeout(updateStatus, 5000);
    },
    onDragEvent: function(editor, event) {
      var showDnd;
      if (showDnd || event.type === 'drop') {
        showDnd = false;
      }
      return false;
    }
  });
  setState = function(data) {
    var state__, text;
    text = data.text, state__ = data.state;
    state = state__ || {};
    if ((text != null) && text !== editor.getValue()) {
      editor.setValue(text);
    }
    setMode(state.mode);
    setIndex(state.index);
    setToc(state.toc);
    return model.theme = state.theme || 'serif';
  };
  model = {
    show: function(v) {
      if (v) {
        return '';
      } else {
        return 'hide';
      }
    },
    hide: function(v) {
      if (v) {
        return 'hide';
      } else {
        return '';
      }
    },
    showDownload: typeof Blob !== "undefined" && Blob !== null,
    download: function() {
      return saveAs(new Blob([editor.getValue()], {
        type: 'text/plain;charset=utf-8'
      }), docTitle() + '.md');
    },
    linkB64: function() {
      updateStatus();
      return prompt('Copy this', location.href);
    },
    print: function() {
      return window.print();
    },
    mode: '',
    toggleToc: function() {
      return state.toc = !state.toc;
    },
    toggleIndex: function() {
      return state.index = !state.index;
    },
    expandInput: function() {
      return state.mode = (state.mode ? '' : 'write');
    },
    expandView: function() {
      return state.mode = (state.mode ? '' : 'read');
    },
    mouseout: function(e) {
      var from;
      from = e.relatedTarget || e.toElement;
      if (!from || from.nodeName === 'HTML') {
        return updateStatus();
      }
    },
    keypress: function(e) {
      if (e.ctrlKey && e.altKey) {
        if (e.keyCode === 24) {
          return state.mode = 'write';
        } else if (e.keyCode === 3) {
          return state.mode = '';
        } else if (e.keyCode === 22) {
          return state.mode = 'read';
        }
      }
    }
  };
  state_.restore(null, null, setState);
  state_.on('restore', setState);
  if (!editor.getValue()) {
    showDnd = false;
  }
  vixen(document.body.parentNode, model);
  return updateView();
};


},{"./unify.coffee":3,"./State.coffee":7,"./state-gist.coffee":9,"./utils.coffee":11,"vixen":12,"showdown":13}],13:[function(require,module,exports){
(function(){//
// showdown.js -- A javascript port of Markdown.
//
// Copyright (c) 2007 John Fraser.
//
// Original Markdown Copyright (c) 2004-2005 John Gruber
//   <http://daringfireball.net/projects/markdown/>
//
// Redistributable under a BSD-style open source license.
// See license.txt for more information.
//
// The full source distribution is at:
//
//				A A L
//				T C A
//				T K B
//
//   <http://www.attacklab.net/>
//

//
// Wherever possible, Showdown is a straight, line-by-line port
// of the Perl version of Markdown.
//
// This is not a normal parser design; it's basically just a
// series of string substitutions.  It's hard to read and
// maintain this way,  but keeping Showdown close to the original
// design makes it easier to port new features.
//
// More importantly, Showdown behaves like markdown.pl in most
// edge cases.  So web applications can do client-side preview
// in Javascript, and then build identical HTML on the server.
//
// This port needs the new RegExp functionality of ECMA 262,
// 3rd Edition (i.e. Javascript 1.5).  Most modern web browsers
// should do fine.  Even with the new regular expression features,
// We do a lot of work to emulate Perl's regex functionality.
// The tricky changes in this file mostly have the "attacklab:"
// label.  Major or self-explanatory changes don't.
//
// Smart diff tools like Araxis Merge will be able to match up
// this file with markdown.pl in a useful way.  A little tweaking
// helps: in a copy of markdown.pl, replace "#" with "//" and
// replace "$text" with "text".  Be sure to ignore whitespace
// and line endings.
//


//
// Showdown usage:
//
//   var text = "Markdown *rocks*.";
//
//   var converter = new Showdown.converter();
//   var html = converter.makeHtml(text);
//
//   alert(html);
//
// Note: move the sample code to the bottom of this
// file before uncommenting it.
//


//
// Showdown namespace
//
var Showdown = {};

//
// converter
//
// Wraps all "globals" so that the only thing
// exposed is makeHtml().
//
Showdown.converter = function() {

//
// Globals:
//

// Global hashes, used by various utility routines
var g_urls;
var g_titles;
var g_html_blocks;

// Used to track when we're inside an ordered or unordered list
// (see _ProcessListItems() for details):
var g_list_level = 0;


this.makeHtml = function(text) {
//
// Main function. The order in which other subs are called here is
// essential. Link and image substitutions need to happen before
// _EscapeSpecialCharsWithinTagAttributes(), so that any *'s or _'s in the <a>
// and <img> tags get encoded.
//

	// Clear the global hashes. If we don't clear these, you get conflicts
	// from other articles when generating a page which contains more than
	// one article (e.g. an index page that shows the N most recent
	// articles):
	g_urls = new Array();
	g_titles = new Array();
	g_html_blocks = new Array();

	// attacklab: Replace ~ with ~T
	// This lets us use tilde as an escape char to avoid md5 hashes
	// The choice of character is arbitray; anything that isn't
    // magic in Markdown will work.
	text = text.replace(/~/g,"~T");

	// attacklab: Replace $ with ~D
	// RegExp interprets $ as a special character
	// when it's in a replacement string
	text = text.replace(/\$/g,"~D");

	// Standardize line endings
	text = text.replace(/\r\n/g,"\n"); // DOS to Unix
	text = text.replace(/\r/g,"\n"); // Mac to Unix

	// Make sure text begins and ends with a couple of newlines:
	text = "\n\n" + text + "\n\n";

	// Convert all tabs to spaces.
	text = _Detab(text);

	// Strip any lines consisting only of spaces and tabs.
	// This makes subsequent regexen easier to write, because we can
	// match consecutive blank lines with /\n+/ instead of something
	// contorted like /[ \t]*\n+/ .
	text = text.replace(/^[ \t]+$/mg,"");

	// Handle github codeblocks prior to running HashHTML so that
	// HTML contained within the codeblock gets escaped propertly
	text = _DoGithubCodeBlocks(text);

	// Turn block-level HTML blocks into hash entries
	text = _HashHTMLBlocks(text);

	// Strip link definitions, store in hashes.
	text = _StripLinkDefinitions(text);

	text = _RunBlockGamut(text);

	text = _UnescapeSpecialChars(text);

	// attacklab: Restore dollar signs
	text = text.replace(/~D/g,"$$");

	// attacklab: Restore tildes
	text = text.replace(/~T/g,"~");

	return text;
};


var _StripLinkDefinitions = function(text) {
//
// Strips link definitions from text, stores the URLs and titles in
// hash references.
//

	// Link defs are in the form: ^[id]: url "optional title"

	/*
		var text = text.replace(/
				^[ ]{0,3}\[(.+)\]:  // id = $1  attacklab: g_tab_width - 1
				  [ \t]*
				  \n?				// maybe *one* newline
				  [ \t]*
				<?(\S+?)>?			// url = $2
				  [ \t]*
				  \n?				// maybe one newline
				  [ \t]*
				(?:
				  (\n*)				// any lines skipped = $3 attacklab: lookbehind removed
				  ["(]
				  (.+?)				// title = $4
				  [")]
				  [ \t]*
				)?					// title is optional
				(?:\n+|$)
			  /gm,
			  function(){...});
	*/
	var text = text.replace(/^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|\Z)/gm,
		function (wholeMatch,m1,m2,m3,m4) {
			m1 = m1.toLowerCase();
			g_urls[m1] = _EncodeAmpsAndAngles(m2);  // Link IDs are case-insensitive
			if (m3) {
				// Oops, found blank lines, so it's not a title.
				// Put back the parenthetical statement we stole.
				return m3+m4;
			} else if (m4) {
				g_titles[m1] = m4.replace(/"/g,"&quot;");
			}

			// Completely remove the definition from the text
			return "";
		}
	);

	return text;
}


var _HashHTMLBlocks = function(text) {
	// attacklab: Double up blank lines to reduce lookaround
	text = text.replace(/\n/g,"\n\n");

	// Hashify HTML blocks:
	// We only want to do this for block-level HTML tags, such as headers,
	// lists, and tables. That's because we still want to wrap <p>s around
	// "paragraphs" that are wrapped in non-block-level tags, such as anchors,
	// phrase emphasis, and spans. The list of tags we're looking for is
	// hard-coded:
	var block_tags_a = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del|style|section|header|footer|nav|article|aside";
	var block_tags_b = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|style|section|header|footer|nav|article|aside";

	// First, look for nested blocks, e.g.:
	//   <div>
	//     <div>
	//     tags for inner block must be indented.
	//     </div>
	//   </div>
	//
	// The outermost tags must start at the left margin for this to match, and
	// the inner nested divs must be indented.
	// We need to do this before the next, more liberal match, because the next
	// match will start at the first `<div>` and stop at the first `</div>`.

	// attacklab: This regex can be expensive when it fails.
	/*
		var text = text.replace(/
		(						// save in $1
			^					// start of line  (with /m)
			<($block_tags_a)	// start tag = $2
			\b					// word break
								// attacklab: hack around khtml/pcre bug...
			[^\r]*?\n			// any number of lines, minimally matching
			</\2>				// the matching end tag
			[ \t]*				// trailing spaces/tabs
			(?=\n+)				// followed by a newline
		)						// attacklab: there are sentinel newlines at end of document
		/gm,function(){...}};
	*/
	text = text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\b[^\r]*?\n<\/\2>[ \t]*(?=\n+))/gm,hashElement);

	//
	// Now match more liberally, simply from `\n<tag>` to `</tag>\n`
	//

	/*
		var text = text.replace(/
		(						// save in $1
			^					// start of line  (with /m)
			<($block_tags_b)	// start tag = $2
			\b					// word break
								// attacklab: hack around khtml/pcre bug...
			[^\r]*?				// any number of lines, minimally matching
			.*</\2>				// the matching end tag
			[ \t]*				// trailing spaces/tabs
			(?=\n+)				// followed by a newline
		)						// attacklab: there are sentinel newlines at end of document
		/gm,function(){...}};
	*/
	text = text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|style|section|header|footer|nav|article|aside)\b[^\r]*?.*<\/\2>[ \t]*(?=\n+)\n)/gm,hashElement);

	// Special case just for <hr />. It was easier to make a special case than
	// to make the other regex more complicated.

	/*
		text = text.replace(/
		(						// save in $1
			\n\n				// Starting after a blank line
			[ ]{0,3}
			(<(hr)				// start tag = $2
			\b					// word break
			([^<>])*?			//
			\/?>)				// the matching end tag
			[ \t]*
			(?=\n{2,})			// followed by a blank line
		)
		/g,hashElement);
	*/
	text = text.replace(/(\n[ ]{0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,hashElement);

	// Special case for standalone HTML comments:

	/*
		text = text.replace(/
		(						// save in $1
			\n\n				// Starting after a blank line
			[ ]{0,3}			// attacklab: g_tab_width - 1
			<!
			(--[^\r]*?--\s*)+
			>
			[ \t]*
			(?=\n{2,})			// followed by a blank line
		)
		/g,hashElement);
	*/
	text = text.replace(/(\n\n[ ]{0,3}<!(--[^\r]*?--\s*)+>[ \t]*(?=\n{2,}))/g,hashElement);

	// PHP and ASP-style processor instructions (<?...?> and <%...%>)

	/*
		text = text.replace(/
		(?:
			\n\n				// Starting after a blank line
		)
		(						// save in $1
			[ ]{0,3}			// attacklab: g_tab_width - 1
			(?:
				<([?%])			// $2
				[^\r]*?
				\2>
			)
			[ \t]*
			(?=\n{2,})			// followed by a blank line
		)
		/g,hashElement);
	*/
	text = text.replace(/(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,hashElement);

	// attacklab: Undo double lines (see comment at top of this function)
	text = text.replace(/\n\n/g,"\n");
	return text;
}

var hashElement = function(wholeMatch,m1) {
	var blockText = m1;

	// Undo double lines
	blockText = blockText.replace(/\n\n/g,"\n");
	blockText = blockText.replace(/^\n/,"");

	// strip trailing blank lines
	blockText = blockText.replace(/\n+$/g,"");

	// Replace the element text with a marker ("~KxK" where x is its key)
	blockText = "\n\n~K" + (g_html_blocks.push(blockText)-1) + "K\n\n";

	return blockText;
};

var _RunBlockGamut = function(text) {
//
// These are all the transformations that form block-level
// tags like paragraphs, headers, and list items.
//
	text = _DoHeaders(text);

	// Do Horizontal Rules:
	var key = hashBlock("<hr />");
	text = text.replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm,key);
	text = text.replace(/^[ ]{0,2}([ ]?\-[ ]?){3,}[ \t]*$/gm,key);
	text = text.replace(/^[ ]{0,2}([ ]?\_[ ]?){3,}[ \t]*$/gm,key);

	text = _DoLists(text);
	text = _DoCodeBlocks(text);
	text = _DoBlockQuotes(text);

	// We already ran _HashHTMLBlocks() before, in Markdown(), but that
	// was to escape raw HTML in the original Markdown source. This time,
	// we're escaping the markup we've just created, so that we don't wrap
	// <p> tags around block-level tags.
	text = _HashHTMLBlocks(text);
	text = _FormParagraphs(text);

	return text;
};


var _RunSpanGamut = function(text) {
//
// These are all the transformations that occur *within* block-level
// tags like paragraphs, headers, and list items.
//

	text = _DoCodeSpans(text);
	text = _EscapeSpecialCharsWithinTagAttributes(text);
	text = _EncodeBackslashEscapes(text);

	// Process anchor and image tags. Images must come first,
	// because ![foo][f] looks like an anchor.
	text = _DoImages(text);
	text = _DoAnchors(text);

	// Make links out of things like `<http://example.com/>`
	// Must come after _DoAnchors(), because you can use < and >
	// delimiters in inline links like [this](<url>).
	text = _DoAutoLinks(text);
	text = _EncodeAmpsAndAngles(text);
	text = _DoItalicsAndBold(text);

	// Do hard breaks:
	text = text.replace(/  +\n/g," <br />\n");

	return text;
}

var _EscapeSpecialCharsWithinTagAttributes = function(text) {
//
// Within tags -- meaning between < and > -- encode [\ ` * _] so they
// don't conflict with their use in Markdown for code, italics and strong.
//

	// Build a regex to find HTML tags and comments.  See Friedl's
	// "Mastering Regular Expressions", 2nd Ed., pp. 200-201.
	var regex = /(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--.*?--\s*)+>)/gi;

	text = text.replace(regex, function(wholeMatch) {
		var tag = wholeMatch.replace(/(.)<\/?code>(?=.)/g,"$1`");
		tag = escapeCharacters(tag,"\\`*_");
		return tag;
	});

	return text;
}

var _DoAnchors = function(text) {
//
// Turn Markdown link shortcuts into XHTML <a> tags.
//
	//
	// First, handle reference-style links: [link text] [id]
	//

	/*
		text = text.replace(/
		(							// wrap whole match in $1
			\[
			(
				(?:
					\[[^\]]*\]		// allow brackets nested one level
					|
					[^\[]			// or anything else
				)*
			)
			\]

			[ ]?					// one optional space
			(?:\n[ ]*)?				// one optional newline followed by spaces

			\[
			(.*?)					// id = $3
			\]
		)()()()()					// pad remaining backreferences
		/g,_DoAnchors_callback);
	*/
	text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,writeAnchorTag);

	//
	// Next, inline-style links: [link text](url "optional title")
	//

	/*
		text = text.replace(/
			(						// wrap whole match in $1
				\[
				(
					(?:
						\[[^\]]*\]	// allow brackets nested one level
					|
					[^\[\]]			// or anything else
				)
			)
			\]
			\(						// literal paren
			[ \t]*
			()						// no id, so leave $3 empty
			<?(.*?)>?				// href = $4
			[ \t]*
			(						// $5
				(['"])				// quote char = $6
				(.*?)				// Title = $7
				\6					// matching quote
				[ \t]*				// ignore any spaces/tabs between closing quote and )
			)?						// title is optional
			\)
		)
		/g,writeAnchorTag);
	*/
	text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?(.*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,writeAnchorTag);

	//
	// Last, handle reference-style shortcuts: [link text]
	// These must come last in case you've also got [link test][1]
	// or [link test](/foo)
	//

	/*
		text = text.replace(/
		(		 					// wrap whole match in $1
			\[
			([^\[\]]+)				// link text = $2; can't contain '[' or ']'
			\]
		)()()()()()					// pad rest of backreferences
		/g, writeAnchorTag);
	*/
	text = text.replace(/(\[([^\[\]]+)\])()()()()()/g, writeAnchorTag);

	return text;
}

var writeAnchorTag = function(wholeMatch,m1,m2,m3,m4,m5,m6,m7) {
	if (m7 == undefined) m7 = "";
	var whole_match = m1;
	var link_text   = m2;
	var link_id	 = m3.toLowerCase();
	var url		= m4;
	var title	= m7;

	if (url == "") {
		if (link_id == "") {
			// lower-case and turn embedded newlines into spaces
			link_id = link_text.toLowerCase().replace(/ ?\n/g," ");
		}
		url = "#"+link_id;

		if (g_urls[link_id] != undefined) {
			url = g_urls[link_id];
			if (g_titles[link_id] != undefined) {
				title = g_titles[link_id];
			}
		}
		else {
			if (whole_match.search(/\(\s*\)$/m)>-1) {
				// Special case for explicit empty url
				url = "";
			} else {
				return whole_match;
			}
		}
	}

	url = escapeCharacters(url,"*_");
	var result = "<a href=\"" + url + "\"";

	if (title != "") {
		title = title.replace(/"/g,"&quot;");
		title = escapeCharacters(title,"*_");
		result +=  " title=\"" + title + "\"";
	}

	result += ">" + link_text + "</a>";

	return result;
}


var _DoImages = function(text) {
//
// Turn Markdown image shortcuts into <img> tags.
//

	//
	// First, handle reference-style labeled images: ![alt text][id]
	//

	/*
		text = text.replace(/
		(						// wrap whole match in $1
			!\[
			(.*?)				// alt text = $2
			\]

			[ ]?				// one optional space
			(?:\n[ ]*)?			// one optional newline followed by spaces

			\[
			(.*?)				// id = $3
			\]
		)()()()()				// pad rest of backreferences
		/g,writeImageTag);
	*/
	text = text.replace(/(!\[(.*?)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,writeImageTag);

	//
	// Next, handle inline images:  ![alt text](url "optional title")
	// Don't forget: encode * and _

	/*
		text = text.replace(/
		(						// wrap whole match in $1
			!\[
			(.*?)				// alt text = $2
			\]
			\s?					// One optional whitespace character
			\(					// literal paren
			[ \t]*
			()					// no id, so leave $3 empty
			<?(\S+?)>?			// src url = $4
			[ \t]*
			(					// $5
				(['"])			// quote char = $6
				(.*?)			// title = $7
				\6				// matching quote
				[ \t]*
			)?					// title is optional
		\)
		)
		/g,writeImageTag);
	*/
	text = text.replace(/(!\[(.*?)\]\s?\([ \t]*()<?(\S+?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,writeImageTag);

	return text;
}

var writeImageTag = function(wholeMatch,m1,m2,m3,m4,m5,m6,m7) {
	var whole_match = m1;
	var alt_text   = m2;
	var link_id	 = m3.toLowerCase();
	var url		= m4;
	var title	= m7;

	if (!title) title = "";

	if (url == "") {
		if (link_id == "") {
			// lower-case and turn embedded newlines into spaces
			link_id = alt_text.toLowerCase().replace(/ ?\n/g," ");
		}
		url = "#"+link_id;

		if (g_urls[link_id] != undefined) {
			url = g_urls[link_id];
			if (g_titles[link_id] != undefined) {
				title = g_titles[link_id];
			}
		}
		else {
			return whole_match;
		}
	}

	alt_text = alt_text.replace(/"/g,"&quot;");
	url = escapeCharacters(url,"*_");
	var result = "<img src=\"" + url + "\" alt=\"" + alt_text + "\"";

	// attacklab: Markdown.pl adds empty title attributes to images.
	// Replicate this bug.

	//if (title != "") {
		title = title.replace(/"/g,"&quot;");
		title = escapeCharacters(title,"*_");
		result +=  " title=\"" + title + "\"";
	//}

	result += " />";

	return result;
}


var _DoHeaders = function(text) {

	// Setext-style headers:
	//	Header 1
	//	========
	//
	//	Header 2
	//	--------
	//
	text = text.replace(/^(.+)[ \t]*\n=+[ \t]*\n+/gm,
		function(wholeMatch,m1){return hashBlock('<h1 id="' + headerId(m1) + '">' + _RunSpanGamut(m1) + "</h1>");});

	text = text.replace(/^(.+)[ \t]*\n-+[ \t]*\n+/gm,
		function(matchFound,m1){return hashBlock('<h2 id="' + headerId(m1) + '">' + _RunSpanGamut(m1) + "</h2>");});

	// atx-style headers:
	//  # Header 1
	//  ## Header 2
	//  ## Header 2 with closing hashes ##
	//  ...
	//  ###### Header 6
	//

	/*
		text = text.replace(/
			^(\#{1,6})				// $1 = string of #'s
			[ \t]*
			(.+?)					// $2 = Header text
			[ \t]*
			\#*						// optional closing #'s (not counted)
			\n+
		/gm, function() {...});
	*/

	text = text.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm,
		function(wholeMatch,m1,m2) {
			var h_level = m1.length;
			return hashBlock("<h" + h_level + ' id="' + headerId(m2) + '">' + _RunSpanGamut(m2) + "</h" + h_level + ">");
		});

	function headerId(m) {
		return m.replace(/[^\w]/g, '').toLowerCase();
	}
	return text;
}

// This declaration keeps Dojo compressor from outputting garbage:
var _ProcessListItems;

var _DoLists = function(text) {
//
// Form HTML ordered (numbered) and unordered (bulleted) lists.
//

	// attacklab: add sentinel to hack around khtml/safari bug:
	// http://bugs.webkit.org/show_bug.cgi?id=11231
	text += "~0";

	// Re-usable pattern to match any entirel ul or ol list:

	/*
		var whole_list = /
		(									// $1 = whole list
			(								// $2
				[ ]{0,3}					// attacklab: g_tab_width - 1
				([*+-]|\d+[.])				// $3 = first list item marker
				[ \t]+
			)
			[^\r]+?
			(								// $4
				~0							// sentinel for workaround; should be $
			|
				\n{2,}
				(?=\S)
				(?!							// Negative lookahead for another list item marker
					[ \t]*
					(?:[*+-]|\d+[.])[ \t]+
				)
			)
		)/g
	*/
	var whole_list = /^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;

	if (g_list_level) {
		text = text.replace(whole_list,function(wholeMatch,m1,m2) {
			var list = m1;
			var list_type = (m2.search(/[*+-]/g)>-1) ? "ul" : "ol";

			// Turn double returns into triple returns, so that we can make a
			// paragraph for the last item in a list, if necessary:
			list = list.replace(/\n{2,}/g,"\n\n\n");;
			var result = _ProcessListItems(list);

			// Trim any trailing whitespace, to put the closing `</$list_type>`
			// up on the preceding line, to get it past the current stupid
			// HTML block parser. This is a hack to work around the terrible
			// hack that is the HTML block parser.
			result = result.replace(/\s+$/,"");
			result = "<"+list_type+">" + result + "</"+list_type+">\n";
			return result;
		});
	} else {
		whole_list = /(\n\n|^\n?)(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/g;
		text = text.replace(whole_list,function(wholeMatch,m1,m2,m3) {
			var runup = m1;
			var list = m2;

			var list_type = (m3.search(/[*+-]/g)>-1) ? "ul" : "ol";
			// Turn double returns into triple returns, so that we can make a
			// paragraph for the last item in a list, if necessary:
			var list = list.replace(/\n{2,}/g,"\n\n\n");;
			var result = _ProcessListItems(list);
			result = runup + "<"+list_type+">\n" + result + "</"+list_type+">\n";
			return result;
		});
	}

	// attacklab: strip sentinel
	text = text.replace(/~0/,"");

	return text;
}

_ProcessListItems = function(list_str) {
//
//  Process the contents of a single ordered or unordered list, splitting it
//  into individual list items.
//
	// The $g_list_level global keeps track of when we're inside a list.
	// Each time we enter a list, we increment it; when we leave a list,
	// we decrement. If it's zero, we're not in a list anymore.
	//
	// We do this because when we're not inside a list, we want to treat
	// something like this:
	//
	//    I recommend upgrading to version
	//    8. Oops, now this line is treated
	//    as a sub-list.
	//
	// As a single paragraph, despite the fact that the second line starts
	// with a digit-period-space sequence.
	//
	// Whereas when we're inside a list (or sub-list), that line will be
	// treated as the start of a sub-list. What a kludge, huh? This is
	// an aspect of Markdown's syntax that's hard to parse perfectly
	// without resorting to mind-reading. Perhaps the solution is to
	// change the syntax rules such that sub-lists must start with a
	// starting cardinal number; e.g. "1." or "a.".

	g_list_level++;

	// trim trailing blank lines:
	list_str = list_str.replace(/\n{2,}$/,"\n");

	// attacklab: add sentinel to emulate \z
	list_str += "~0";

	/*
		list_str = list_str.replace(/
			(\n)?							// leading line = $1
			(^[ \t]*)						// leading whitespace = $2
			([*+-]|\d+[.]) [ \t]+			// list marker = $3
			([^\r]+?						// list item text   = $4
			(\n{1,2}))
			(?= \n* (~0 | \2 ([*+-]|\d+[.]) [ \t]+))
		/gm, function(){...});
	*/
	list_str = list_str.replace(/(\n)?(^[ \t]*)([*+-]|\d+[.])[ \t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gm,
		function(wholeMatch,m1,m2,m3,m4){
			var item = m4;
			var leading_line = m1;
			var leading_space = m2;

			if (leading_line || (item.search(/\n{2,}/)>-1)) {
				item = _RunBlockGamut(_Outdent(item));
			}
			else {
				// Recursion for sub-lists:
				item = _DoLists(_Outdent(item));
				item = item.replace(/\n$/,""); // chomp(item)
				item = _RunSpanGamut(item);
			}

			return  "<li>" + item + "</li>\n";
		}
	);

	// attacklab: strip sentinel
	list_str = list_str.replace(/~0/g,"");

	g_list_level--;
	return list_str;
}


var _DoCodeBlocks = function(text) {
//
//  Process Markdown `<pre><code>` blocks.
//

	/*
		text = text.replace(text,
			/(?:\n\n|^)
			(								// $1 = the code block -- one or more lines, starting with a space/tab
				(?:
					(?:[ ]{4}|\t)			// Lines must start with a tab or a tab-width of spaces - attacklab: g_tab_width
					.*\n+
				)+
			)
			(\n*[ ]{0,3}[^ \t\n]|(?=~0))	// attacklab: g_tab_width
		/g,function(){...});
	*/

	// attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
	text += "~0";

	text = text.replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g,
		function(wholeMatch,m1,m2) {
			var codeblock = m1;
			var nextChar = m2;

			codeblock = _EncodeCode( _Outdent(codeblock));
			codeblock = _Detab(codeblock);
			codeblock = codeblock.replace(/^\n+/g,""); // trim leading newlines
			codeblock = codeblock.replace(/\n+$/g,""); // trim trailing whitespace

			codeblock = "<pre><code>" + codeblock + "\n</code></pre>";

			return hashBlock(codeblock) + nextChar;
		}
	);

	// attacklab: strip sentinel
	text = text.replace(/~0/,"");

	return text;
};

var _DoGithubCodeBlocks = function(text) {
//
//  Process Github-style code blocks
//  Example:
//  ```ruby
//  def hello_world(x)
//    puts "Hello, #{x}"
//  end
//  ```
//


	// attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
	text += "~0";

	text = text.replace(/(?:^|\n)```(.*)\n([\s\S]*?)\n```/g,
		function(wholeMatch,m1,m2) {
			var language = m1;
			var codeblock = m2;

			codeblock = _EncodeCode(codeblock);
			codeblock = _Detab(codeblock);
			codeblock = codeblock.replace(/^\n+/g,""); // trim leading newlines
			codeblock = codeblock.replace(/\n+$/g,""); // trim trailing whitespace

			codeblock = "<pre><code" + (language ? " class=\"" + language + '"' : "") + ">" + codeblock + "\n</code></pre>";

			return hashBlock(codeblock);
		}
	);

	// attacklab: strip sentinel
	text = text.replace(/~0/,"");

	return text;
}

var hashBlock = function(text) {
	text = text.replace(/(^\n+|\n+$)/g,"");
	return "\n\n~K" + (g_html_blocks.push(text)-1) + "K\n\n";
}

var _DoCodeSpans = function(text) {
//
//   *  Backtick quotes are used for <code></code> spans.
//
//   *  You can use multiple backticks as the delimiters if you want to
//	 include literal backticks in the code span. So, this input:
//
//		 Just type ``foo `bar` baz`` at the prompt.
//
//	   Will translate to:
//
//		 <p>Just type <code>foo `bar` baz</code> at the prompt.</p>
//
//	There's no arbitrary limit to the number of backticks you
//	can use as delimters. If you need three consecutive backticks
//	in your code, use four for delimiters, etc.
//
//  *  You can use spaces to get literal backticks at the edges:
//
//		 ... type `` `bar` `` ...
//
//	   Turns to:
//
//		 ... type <code>`bar`</code> ...
//

	/*
		text = text.replace(/
			(^|[^\\])					// Character before opening ` can't be a backslash
			(`+)						// $2 = Opening run of `
			(							// $3 = The code block
				[^\r]*?
				[^`]					// attacklab: work around lack of lookbehind
			)
			\2							// Matching closer
			(?!`)
		/gm, function(){...});
	*/

	text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
		function(wholeMatch,m1,m2,m3,m4) {
			var c = m3;
			c = c.replace(/^([ \t]*)/g,"");	// leading whitespace
			c = c.replace(/[ \t]*$/g,"");	// trailing whitespace
			c = _EncodeCode(c);
			return m1+"<code>"+c+"</code>";
		});

	return text;
}

var _EncodeCode = function(text) {
//
// Encode/escape certain characters inside Markdown code runs.
// The point is that in code, these characters are literals,
// and lose their special Markdown meanings.
//
	// Encode all ampersands; HTML entities are not
	// entities within a Markdown code span.
	text = text.replace(/&/g,"&amp;");

	// Do the angle bracket song and dance:
	text = text.replace(/</g,"&lt;");
	text = text.replace(/>/g,"&gt;");

	// Now, escape characters that are magic in Markdown:
	text = escapeCharacters(text,"\*_{}[]\\",false);

// jj the line above breaks this:
//---

//* Item

//   1. Subitem

//            special char: *
//---

	return text;
}


var _DoItalicsAndBold = function(text) {

	// <strong> must go first:
	text = text.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g,
		"<strong>$2</strong>");

	text = text.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g,
		"<em>$2</em>");

	return text;
}


var _DoBlockQuotes = function(text) {

	/*
		text = text.replace(/
		(								// Wrap whole match in $1
			(
				^[ \t]*>[ \t]?			// '>' at the start of a line
				.+\n					// rest of the first line
				(.+\n)*					// subsequent consecutive lines
				\n*						// blanks
			)+
		)
		/gm, function(){...});
	*/

	text = text.replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm,
		function(wholeMatch,m1) {
			var bq = m1;

			// attacklab: hack around Konqueror 3.5.4 bug:
			// "----------bug".replace(/^-/g,"") == "bug"

			bq = bq.replace(/^[ \t]*>[ \t]?/gm,"~0");	// trim one level of quoting

			// attacklab: clean up hack
			bq = bq.replace(/~0/g,"");

			bq = bq.replace(/^[ \t]+$/gm,"");		// trim whitespace-only lines
			bq = _RunBlockGamut(bq);				// recurse

			bq = bq.replace(/(^|\n)/g,"$1  ");
			// These leading spaces screw with <pre> content, so we need to fix that:
			bq = bq.replace(
					/(\s*<pre>[^\r]+?<\/pre>)/gm,
				function(wholeMatch,m1) {
					var pre = m1;
					// attacklab: hack around Konqueror 3.5.4 bug:
					pre = pre.replace(/^  /mg,"~0");
					pre = pre.replace(/~0/g,"");
					return pre;
				});

			return hashBlock("<blockquote>\n" + bq + "\n</blockquote>");
		});
	return text;
}


var _FormParagraphs = function(text) {
//
//  Params:
//    $text - string to process with html <p> tags
//

	// Strip leading and trailing lines:
	text = text.replace(/^\n+/g,"");
	text = text.replace(/\n+$/g,"");

	var grafs = text.split(/\n{2,}/g);
	var grafsOut = new Array();

	//
	// Wrap <p> tags.
	//
	var end = grafs.length;
	for (var i=0; i<end; i++) {
		var str = grafs[i];

		// if this is an HTML marker, copy it
		if (str.search(/~K(\d+)K/g) >= 0) {
			grafsOut.push(str);
		}
		else if (str.search(/\S/) >= 0) {
			str = _RunSpanGamut(str);
			str = str.replace(/^([ \t]*)/g,"<p>");
			str += "</p>"
			grafsOut.push(str);
		}

	}

	//
	// Unhashify HTML blocks
	//
	end = grafsOut.length;
	for (var i=0; i<end; i++) {
		// if this is a marker for an html block...
		while (grafsOut[i].search(/~K(\d+)K/) >= 0) {
			var blockText = g_html_blocks[RegExp.$1];
			blockText = blockText.replace(/\$/g,"$$$$"); // Escape any dollar signs
			grafsOut[i] = grafsOut[i].replace(/~K\d+K/,blockText);
		}
	}

	return grafsOut.join("\n\n");
}


var _EncodeAmpsAndAngles = function(text) {
// Smart processing for ampersands and angle brackets that need to be encoded.

	// Ampersand-encoding based entirely on Nat Irons's Amputator MT plugin:
	//   http://bumppo.net/projects/amputator/
	text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g,"&amp;");

	// Encode naked <'s
	text = text.replace(/<(?![a-z\/?\$!])/gi,"&lt;");

	return text;
}


var _EncodeBackslashEscapes = function(text) {
//
//   Parameter:  String.
//   Returns:	The string, with after processing the following backslash
//			   escape sequences.
//

	// attacklab: The polite way to do this is with the new
	// escapeCharacters() function:
	//
	// 	text = escapeCharacters(text,"\\",true);
	// 	text = escapeCharacters(text,"`*_{}[]()>#+-.!",true);
	//
	// ...but we're sidestepping its use of the (slow) RegExp constructor
	// as an optimization for Firefox.  This function gets called a LOT.

	text = text.replace(/\\(\\)/g,escapeCharacters_callback);
	text = text.replace(/\\([`*_{}\[\]()>#+-.!])/g,escapeCharacters_callback);
	return text;
}


var _DoAutoLinks = function(text) {

	text = text.replace(/<((https?|ftp|dict):[^'">\s]+)>/gi,"<a href=\"$1\">$1</a>");

	// Email addresses: <address@domain.foo>

	/*
		text = text.replace(/
			<
			(?:mailto:)?
			(
				[-.\w]+
				\@
				[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+
			)
			>
		/gi, _DoAutoLinks_callback());
	*/
	text = text.replace(/<(?:mailto:)?([-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi,
		function(wholeMatch,m1) {
			return _EncodeEmailAddress( _UnescapeSpecialChars(m1) );
		}
	);

	return text;
}


var _EncodeEmailAddress = function(addr) {
//
//  Input: an email address, e.g. "foo@example.com"
//
//  Output: the email address as a mailto link, with each character
//	of the address encoded as either a decimal or hex entity, in
//	the hopes of foiling most address harvesting spam bots. E.g.:
//
//	<a href="&#x6D;&#97;&#105;&#108;&#x74;&#111;:&#102;&#111;&#111;&#64;&#101;
//	   x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;">&#102;&#111;&#111;
//	   &#64;&#101;x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;</a>
//
//  Based on a filter by Matthew Wickline, posted to the BBEdit-Talk
//  mailing list: <http://tinyurl.com/yu7ue>
//

	// attacklab: why can't javascript speak hex?
	function char2hex(ch) {
		var hexDigits = '0123456789ABCDEF';
		var dec = ch.charCodeAt(0);
		return(hexDigits.charAt(dec>>4) + hexDigits.charAt(dec&15));
	}

	var encode = [
		function(ch){return "&#"+ch.charCodeAt(0)+";";},
		function(ch){return "&#x"+char2hex(ch)+";";},
		function(ch){return ch;}
	];

	addr = "mailto:" + addr;

	addr = addr.replace(/./g, function(ch) {
		if (ch == "@") {
		   	// this *must* be encoded. I insist.
			ch = encode[Math.floor(Math.random()*2)](ch);
		} else if (ch !=":") {
			// leave ':' alone (to spot mailto: later)
			var r = Math.random();
			// roughly 10% raw, 45% hex, 45% dec
			ch =  (
					r > .9  ?	encode[2](ch)   :
					r > .45 ?	encode[1](ch)   :
								encode[0](ch)
				);
		}
		return ch;
	});

	addr = "<a href=\"" + addr + "\">" + addr + "</a>";
	addr = addr.replace(/">.+:/g,"\">"); // strip the mailto: from the visible part

	return addr;
}


var _UnescapeSpecialChars = function(text) {
//
// Swap back in all the special characters we've hidden.
//
	text = text.replace(/~E(\d+)E/g,
		function(wholeMatch,m1) {
			var charCodeToReplace = parseInt(m1);
			return String.fromCharCode(charCodeToReplace);
		}
	);
	return text;
}


var _Outdent = function(text) {
//
// Remove one level of line-leading tabs or spaces
//

	// attacklab: hack around Konqueror 3.5.4 bug:
	// "----------bug".replace(/^-/g,"") == "bug"

	text = text.replace(/^(\t|[ ]{1,4})/gm,"~0"); // attacklab: g_tab_width

	// attacklab: clean up hack
	text = text.replace(/~0/g,"")

	return text;
}

var _Detab = function(text) {
// attacklab: Detab's completely rewritten for speed.
// In perl we could fix it by anchoring the regexp with \G.
// In javascript we're less fortunate.

	// expand first n-1 tabs
	text = text.replace(/\t(?=\t)/g,"    "); // attacklab: g_tab_width

	// replace the nth with two sentinels
	text = text.replace(/\t/g,"~A~B");

	// use the sentinel to anchor our regex so it doesn't explode
	text = text.replace(/~B(.+?)~A/g,
		function(wholeMatch,m1,m2) {
			var leadingText = m1;
			var numSpaces = 4 - leadingText.length % 4;  // attacklab: g_tab_width

			// there *must* be a better way to do this:
			for (var i=0; i<numSpaces; i++) leadingText+=" ";

			return leadingText;
		}
	);

	// clean up sentinels
	text = text.replace(/~A/g,"    ");  // attacklab: g_tab_width
	text = text.replace(/~B/g,"");

	return text;
}


//
//  attacklab: Utility functions
//


var escapeCharacters = function(text, charsToEscape, afterBackslash) {
	// First we have to escape the escape characters so that
	// we can build a character class out of them
	var regexString = "([" + charsToEscape.replace(/([\[\]\\])/g,"\\$1") + "])";

	if (afterBackslash) {
		regexString = "\\\\" + regexString;
	}

	var regex = new RegExp(regexString,"g");
	text = text.replace(regex,escapeCharacters_callback);

	return text;
}


var escapeCharacters_callback = function(wholeMatch,m1) {
	var charCodeToEscape = m1.charCodeAt(0);
	return "~E"+charCodeToEscape+"E";
}

} // end of Showdown.converter

// export
if (typeof module !== 'undefined') module.exports = Showdown;

})()
},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2FwcC5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS91bmlmeS5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZXZlbnRzLmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2xpYi9iYXNlNjQuanMiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS9TdGF0ZS5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2xpYi9sencuanMiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS9zdGF0ZS1naXN0LmNvZmZlZSIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvY29mZmVlL3hoci5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS91dGlscy5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L25vZGVfbW9kdWxlcy92aXhlbi9pbmRleC5qcyIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvY29mZmVlL21haW4uY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9ub2RlX21vZHVsZXMvc2hvd2Rvd24vc3JjL3Nob3dkb3duLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxDQUFRLE1BQVIsZUFBQTs7OztBQ0FBLElBQUEsTUFBQTs7QUFBQSxDQUFBLEVBQUE7Q0FDRSxDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FEQSxDQUNBO0NBREEsQ0FFQSxDQUZBLEVBRUE7Q0FGQSxDQUdBLENBSEEsQ0FHQTtDQUhBLENBSUEsQ0FKQSxDQUlBO0NBSkEsQ0FLQSxDQUxBLEVBS0E7Q0FMQSxDQU1BLENBTkEsRUFNQTtDQU5BLENBT0EsQ0FQQSxDQU9BO0NBUEEsQ0FRQSxDQVJBLEVBUUE7Q0FSQSxDQVNBLENBVEEsQ0FTQTtDQVRBLENBVUEsQ0FWQSxDQVVBO0NBVkEsQ0FXQSxDQVhBLENBV0E7Q0FYQSxDQVlBLENBWkEsRUFZQTtDQVpBLENBYUEsQ0FiQSxFQWFBO0NBYkEsQ0FjQSxDQWRBLEVBY0E7Q0FmRixDQUFBOztBQWlCQSxDQWpCQSxDQWlCUSxDQUFBLEVBQVIsSUFBUztDQUNQLEtBQUEsT0FBQTtDQUFBLENBQUEsQ0FBQSxNQUFNO0NBQU4sQ0FDQSxDQUFJLENBQUEsSUFBZSxDQUFOO0NBQWtCLENBQU0sQ0FBRyxDQUFSO0NBQUQsQ0FBZ0IsRUFBQTtDQUEzQyxDQUFrRCxDQUFuQyxDQUFBO0NBRG5CLENBRUEsQ0FBUSxFQUFSLENBRkE7Q0FHQSxDQUFBLEVBQUcsV0FBQSxLQUFIO0NBQ0ssQ0FBRCxDQUFrQixFQUFBLE1BQXBCLENBQUE7Q0FBNEIsQ0FBTSxDQUFHLENBQVIsRUFBQTtDQUFELENBQWdCLENBQU0sRUFBUyxDQUFmO0NBRDlDLENBQ3VFLENBQXJFLEdBQUE7SUFMSTtDQUFBOztBQU9SLENBeEJBLEVBd0IrQixFQXhCL0IsRUF3Qm9CLENBQUEsRUFBVjs7QUFDVixDQXpCQSxFQXlCMEMsR0FBekIsQ0F6QmpCLEVBeUJpQixDQUFQLEVBQWdCOzs7O0FDekIxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEEsSUFBQSw0RUFBQTs7QUFB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoJy4vY29mZmVlL21haW4uY29mZmVlJykoKVxuIiwibWFwID1cclxuICAnPD0nOiAn4oeQJyAjICdcXHUyMWQwJ1xyXG4gICc9Pic6ICfih5InICMgJ1xcdTIxZDInXHJcbiAgJzw9Pic6ICfih5QnICMgJ1xcdTIxZDQnXHJcbiAgJzwtJzogJ+KGkCcgIyAnXFx1MjE5MCdcclxuICAnLT4nOiAn4oaSJyAjICdcXHUyMTkyJ1xyXG4gICc8LT4nOiAn4oaUJyAjICdcXHUyMTk0J1xyXG4gICcuLi4nOiAn4oCmJ1xyXG4gICctLSc6ICfigJMnXHJcbiAgJy0tLSc6ICfigJQnXHJcbiAgJ14xJzogJ8K5J1xyXG4gICdeMic6ICfCsidcclxuICAnXjMnOiAnwrMnXHJcbiAgJzEvMic6ICfCvSdcclxuICAnMS80JzogJ8K8J1xyXG4gICczLzQnOiAnwr4nXHJcblxyXG51bmlmeSA9IChjbSkgLT5cclxuICBwb3MgPSBjbS5nZXRDdXJzb3IoKVxyXG4gIG0gPSAvW15cXHNdKyQvLmV4ZWMgY20uZ2V0UmFuZ2Uge2xpbmU6cG9zLmxpbmUsIGNoOjB9LCBwb3NcclxuICB0b2tlbiA9IG0/WzBdXHJcbiAgaWYgdG9rZW4/IGFuZCBtYXBbdG9rZW5dP1xyXG4gICAgY20ucmVwbGFjZVJhbmdlIG1hcFt0b2tlbl0sIHtsaW5lOnBvcy5saW5lLCBjaDpwb3MuY2gtdG9rZW4ubGVuZ3RofSwgcG9zXHJcblxyXG5Db2RlTWlycm9yLmNvbW1hbmRzWyd1bmlmeSddID0gdW5pZnlcclxuQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdFsnQ3RybC1TcGFjZSddID0gJ3VuaWZ5J1xyXG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7aWYgKCFwcm9jZXNzLkV2ZW50RW1pdHRlcikgcHJvY2Vzcy5FdmVudEVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcHJvY2Vzcy5FdmVudEVtaXR0ZXI7XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nXG4gICAgPyBBcnJheS5pc0FycmF5XG4gICAgOiBmdW5jdGlvbiAoeHMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9XG47XG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4ID09PSB4c1tpXSkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4vLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbi8vXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBuO1xufTtcblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc0FycmF5KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKVxuICAgIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiBmYWxzZTtcbiAgdmFyIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGlmICghaGFuZGxlcikgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZExpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cbiAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICAgIHZhciBtO1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5vbih0eXBlLCBmdW5jdGlvbiBnKCkge1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNBcnJheShsaXN0KSkge1xuICAgIHZhciBpID0gaW5kZXhPZihsaXN0LCBsaXN0ZW5lcik7XG4gICAgaWYgKGkgPCAwKSByZXR1cm4gdGhpcztcbiAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT0gMClcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdID09PSBsaXN0ZW5lcikge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICh0eXBlICYmIHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICB9XG4gIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGlmIChldi5zb3VyY2UgPT09IHdpbmRvdyAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIvKipcbiAqXG4gKiAgYmFzZTY0IGVuY29kZSAvIGRlY29kZVxuICogIGh0dHA6Ly93d3cud2VidG9vbGtpdC5pbmZvL1xuICpcbiAqKi9cblxudmFyIGJhc2U2NCA9IHtcblxuICAvLyBwcml2YXRlIHByb3BlcnR5XG4gIF9rZXlTdHIgOiBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89XCIsXG5cbiAgLy8gcHVibGljIG1ldGhvZCBmb3IgZW5jb2RpbmdcbiAgZW5jb2RlIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgdmFyIG91dHB1dCA9IFwiXCI7XG4gICAgdmFyIGNocjEsIGNocjIsIGNocjMsIGVuYzEsIGVuYzIsIGVuYzMsIGVuYzQ7XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgaW5wdXQgPSBiYXNlNjQuX3V0ZjhfZW5jb2RlKGlucHV0KTtcblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG5cbiAgICAgIGNocjEgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIyID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuICAgICAgY2hyMyA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcblxuICAgICAgZW5jMSA9IGNocjEgPj4gMjtcbiAgICAgIGVuYzIgPSAoKGNocjEgJiAzKSA8PCA0KSB8IChjaHIyID4+IDQpO1xuICAgICAgZW5jMyA9ICgoY2hyMiAmIDE1KSA8PCAyKSB8IChjaHIzID4+IDYpO1xuICAgICAgZW5jNCA9IGNocjMgJiA2MztcblxuICAgICAgaWYgKGlzTmFOKGNocjIpKSB7XG4gICAgICAgIGVuYzMgPSBlbmM0ID0gNjQ7XG4gICAgICB9IGVsc2UgaWYgKGlzTmFOKGNocjMpKSB7XG4gICAgICAgIGVuYzQgPSA2NDtcbiAgICAgIH1cblxuICAgICAgb3V0cHV0ID0gb3V0cHV0ICtcbiAgICAgICAgdGhpcy5fa2V5U3RyLmNoYXJBdChlbmMxKSArIHRoaXMuX2tleVN0ci5jaGFyQXQoZW5jMikgK1xuICAgICAgICB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzMpICsgdGhpcy5fa2V5U3RyLmNoYXJBdChlbmM0KTtcblxuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH0sXG5cbiAgLy8gcHVibGljIG1ldGhvZCBmb3IgZGVjb2RpbmdcbiAgZGVjb2RlIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgdmFyIG91dHB1dCA9IFwiXCI7XG4gICAgdmFyIGNocjEsIGNocjIsIGNocjM7XG4gICAgdmFyIGVuYzEsIGVuYzIsIGVuYzMsIGVuYzQ7XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC9bXkEtWmEtejAtOVxcK1xcL1xcPV0vZywgXCJcIik7XG5cbiAgICB3aGlsZSAoaSA8IGlucHV0Lmxlbmd0aCkge1xuXG4gICAgICBlbmMxID0gdGhpcy5fa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuICAgICAgZW5jMiA9IHRoaXMuX2tleVN0ci5pbmRleE9mKGlucHV0LmNoYXJBdChpKyspKTtcbiAgICAgIGVuYzMgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG4gICAgICBlbmM0ID0gdGhpcy5fa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuXG4gICAgICBjaHIxID0gKGVuYzEgPDwgMikgfCAoZW5jMiA+PiA0KTtcbiAgICAgIGNocjIgPSAoKGVuYzIgJiAxNSkgPDwgNCkgfCAoZW5jMyA+PiAyKTtcbiAgICAgIGNocjMgPSAoKGVuYzMgJiAzKSA8PCA2KSB8IGVuYzQ7XG5cbiAgICAgIG91dHB1dCA9IG91dHB1dCArIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyMSk7XG5cbiAgICAgIGlmIChlbmMzICE9IDY0KSB7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dCArIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyMik7XG4gICAgICB9XG4gICAgICBpZiAoZW5jNCAhPSA2NCkge1xuICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGNocjMpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgb3V0cHV0ID0gYmFzZTY0Ll91dGY4X2RlY29kZShvdXRwdXQpO1xuXG4gICAgcmV0dXJuIG91dHB1dDtcblxuICB9LFxuXG4gIC8vIHByaXZhdGUgbWV0aG9kIGZvciBVVEYtOCBlbmNvZGluZ1xuICBfdXRmOF9lbmNvZGUgOiBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoL1xcclxcbi9nLFwiXFxuXCIpO1xuICAgIHZhciB1dGZ0ZXh0ID0gXCJcIjtcblxuICAgIGZvciAodmFyIG4gPSAwOyBuIDwgc3RyaW5nLmxlbmd0aDsgbisrKSB7XG5cbiAgICAgIHZhciBjID0gc3RyaW5nLmNoYXJDb2RlQXQobik7XG5cbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoKGMgPiAxMjcpICYmIChjIDwgMjA0OCkpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjID4+IDYpIHwgMTkyKTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gMTIpIHwgMjI0KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyA+PiA2KSAmIDYzKSB8IDEyOCk7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyAmIDYzKSB8IDEyOCk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gdXRmdGV4dDtcbiAgfSxcblxuICAvLyBwcml2YXRlIG1ldGhvZCBmb3IgVVRGLTggZGVjb2RpbmdcbiAgX3V0ZjhfZGVjb2RlIDogZnVuY3Rpb24gKHV0ZnRleHQpIHtcbiAgICB2YXIgc3RyaW5nID0gXCJcIjtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGMgPSBjMSA9IGMyID0gMDtcblxuICAgIHdoaWxlICggaSA8IHV0ZnRleHQubGVuZ3RoICkge1xuXG4gICAgICBjID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkpO1xuXG4gICAgICBpZiAoYyA8IDEyOCkge1xuICAgICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjKTtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgICAgZWxzZSBpZigoYyA+IDE5MSkgJiYgKGMgPCAyMjQpKSB7XG4gICAgICAgIGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDMxKSA8PCA2KSB8IChjMiAmIDYzKSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjMiA9IHV0ZnRleHQuY2hhckNvZGVBdChpKzEpO1xuICAgICAgICBjMyA9IHV0ZnRleHQuY2hhckNvZGVBdChpKzIpO1xuICAgICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoKGMgJiAxNSkgPDwgMTIpIHwgKChjMiAmIDYzKSA8PCA2KSB8IChjMyAmIDYzKSk7XG4gICAgICAgIGkgKz0gMztcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2U2NDtcbiIsIntFdmVudEVtaXR0ZXJ9ID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5iYXNlNjQgPSByZXF1aXJlICcuLi9saWIvYmFzZTY0J1xubHp3ID0gcmVxdWlyZSAnLi4vbGliL2x6dydcblxuZXh0ZW5kID0gKHI9e30sIGQpIC0+XG4gIHJba10gPSB2IGZvciBrLCB2IG9mIGRcbiAgclxua3ZwVG9EaWN0ID0gKGQsIGt2cCkgLT4gZFtrdnBbMF1dID0gKGlmIGt2cFsxXT8gdGhlbiBrdnBbMV0gZWxzZSB0cnVlKVxuXG5jbGFzcyBTdGF0ZSBleHRlbmRzIEV2ZW50RW1pdHRlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBzdXBlcigpXG4gICAgQHN0YXRlID1cbiAgICAgIHRvYzogZmFsc2VcbiAgICAgIGluZGV4OiBmYWxzZVxuICAgIEBzdGFydCgpXG5cbiAgZW5jb2RlRGF0YTogKHR5cGUsIGRhdGEsIGZuKSAtPlxuICAgIFN0YXRlLmNvZGVyc1t0eXBlXS5lbmNvZGUgZGF0YSwgKGRhdGEpIC0+IGZuIHR5cGUrJzsnK2RhdGFcblxuICBkZWNvZGVEYXRhOiAoZGF0YSwgZm4pIC0+XG4gICAgW3R5cGUsIGRhdGFdID0gZGF0YS5zcGxpdCAnOycsIDJcbiAgICBTdGF0ZS5jb2RlcnNbdHlwZV0uZGVjb2RlIGRhdGEsIGZuXG5cbiAgc3RhcnQ6IC0+XG4gICAge3Byb3RvY29sLCBob3N0LCBwYXRobmFtZX0gPSB3aW5kb3cubG9jYXRpb25cbiAgICBAYmFzZVVybCA9IHByb3RvY29sKycvLycraG9zdCtwYXRobmFtZVxuXG4gIHBhcnNlU3RhdGU6IChzdHIpIC0+XG4gICAga3ZwVG9EaWN0IEBzdGF0ZSwga3ZwLnNwbGl0ICc9JyBmb3Iga3ZwIGluIHN0ci5zcGxpdCAnLCcgd2hlbiBrdnAgaXNudCAnJ1xuXG4gIGdlbmVyYXRlU3RhdGU6IC0+XG4gICAgKGZvciBrLCB2IG9mIEBzdGF0ZSB3aGVuIHY/IGFuZCB2IGlzbnQgZmFsc2VcbiAgICAgIGlmIHYgaXMgdHJ1ZSB0aGVuIGsgZWxzZSBrKyc9Jyt2KS5qb2luICcsJ1xuXG4gIF9nZXQ6ICh0eXBlLCBpZCwgZm4pIC0+IEBzdG9yYWdlW3R5cGVdLmdldCBpZCwgZm5cblxuICBfc2F2ZTogKHR5cGUsIGRhdGEsIGZuKSAtPiBAc3RvcmFnZVt0eXBlXS5zYXZlIGRhdGEsIGZuXG5cbiAgcGFyc2VIYXNoOiAoaGFzaCwgZm4pIC0+XG4gICAgaGFzaCA9IGhhc2guc3Vic3RyaW5nIDEgaWYgaGFzaC5jaGFyQXQgMCBpcyAnIydcbiAgICBwb3MgPSAgaGFzaC5pbmRleE9mICc7J1xuICAgIGlmIHBvcyBpcyAtMSAjIHN0YXRlIG9ubHlcbiAgICAgIHN0YXRlID0gaGFzaFxuICAgIGVsc2UgIyBzdGF0ZSBhbmQgZGF0YVxuICAgICAgc3RhdGUgPSBoYXNoLnN1YnN0cmluZyAwLCBwb3NcbiAgICAgIGRhdGEgPSBoYXNoLnN1YnN0cmluZyBwb3MrMVxuICAgIEBwYXJzZVN0YXRlIHN0YXRlXG4gICAgaWYgZGF0YT9cbiAgICAgIEBkZWNvZGVEYXRhIGRhdGEsIChkYXRhKSAtPiBmbiBkYXRhXG4gICAgZWxzZVxuICAgICAgZm4oKVxuXG4gIGdlbmVyYXRlSGFzaDogKHR5cGUsIGRhdGEsIGZuKSAtPlxuICAgIGlmIHR5cGU/IGFuZCBkYXRhP1xuICAgICAgQGVuY29kZURhdGEgdHlwZSwgZGF0YSwgKHN0cikgPT5cbiAgICAgICAgZm4gJyMnK0BnZW5lcmF0ZVN0YXRlKCkrJzsnK3N0clxuICAgIGVsc2VcbiAgICAgIGZuICcjJytAZ2VuZXJhdGVTdGF0ZSgpXG5cbiAgcmVwbGFjZTogLT5cbiAgICBAX3NhdmUgdHlwZSwgZGF0YSwgKGlkLCB2ZXJzaW9uKSAtPlxuICAgICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlIHt9LCAnJywgdHlwZSsnLycraWRcblxuICBoYXM6ICh0eXBlKSAtPiBAc3RhdGVbdHlwZV0/IGFuZCBAc3RhdGVbdHlwZV0gaXNudCBmYWxzZVxuICBzZXQ6ICh0eXBlLCB2YWwpIC0+IEBzdGF0ZVt0eXBlXSA9IHZhbDsgQGVtaXQgJ2NoYW5nZScsIHR5cGUsIHZhbFxuICB0b2dnbGU6ICh0eXBlKSAtPiBAc2V0IHR5cGUsIG5vdCBAaGFzIHR5cGVcblxuZGVzZXJpYWxpemUgPSAtPlxuICBbdHlwZSwgaWRdID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyKDEpLnNwbGl0ICcvJywgMlxuICB7IHR5cGUsIGlkIH1cbnNlcmlhbGl6ZSA9IChkYXRhKSAtPiB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcjJytkYXRhLnR5cGUrJy8nK2RhdGEuaWRcblxuc3RhdGUgPSBuZXcgRXZlbnRFbWl0dGVyXG5cbnN0YXRlLnN0b3JlVHlwZSA9ICdiYXNlNjQnXG5zdGF0ZS5zdG9yZUlkID0gJydcblxuc3RhdGUuc3RvcmVzID1cbiAgI2x6dzpcbiAgIyAgc3RvcmU6IChkYXRhLCBmbikgLT4gZm4gYmFzZTY0LmVuY29kZSBsencuZW5jb2RlIGRhdGFcbiAgIyAgcmVzdG9yZTogKGRhdGEsIGZuKSAtPiBmbiBsencuZGVjb2RlIGJhc2U2NC5kZWNvZGUgZGF0YVxuICBiYXNlNjQ6XG4gICAgc3RvcmU6IChpZCwgZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgICBjYWxsYmFjayBiYXNlNjQuZW5jb2RlIEpTT04uc3RyaW5naWZ5KGRhdGEgb3IgJ3t9JylcbiAgICByZXN0b3JlOiAoaWQsIGNhbGxiYWNrKSAtPlxuICAgICAgY2FsbGJhY2sgSlNPTi5wYXJzZSBiYXNlNjQuZGVjb2RlKGlkKSBvciAne30nXG5cbnN0YXRlLnN0b3JlID0gKHN0b3JlVHlwZSwgZGF0YSwgY2FsbGJhY2spIC0+XG4gIHN0YXRlLnN0b3JlVHlwZSA9IHN0b3JlVHlwZSBpZiBzdG9yZVR5cGVcbiAgc3RhdGUuc3RvcmVzW3N0YXRlLnN0b3JlVHlwZV0uc3RvcmUgc3RhdGUuc3RvcmVJZCwgZGF0YSwgKHN0b3JlSWQpLT5cbiAgICBzdGF0ZS5zdG9yZUlkID0gc3RvcmVJZFxuICAgIHNlcmlhbGl6ZSB0eXBlOnN0YXRlLnN0b3JlVHlwZSwgaWQ6c3RvcmVJZFxuICAgICN3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUge30sICcnLCB0eXBlKycvJytpZFxuICAgIGNhbGxiYWNrPyBzdG9yZUlkXG5cbnN0YXRlLnJlc3RvcmUgPSAoc3RvcmVUeXBlLCBzdG9yZUlkLCBjYWxsYmFjaykgLT5cbiAgaWYgbm90IHN0b3JlVHlwZT8gYW5kIG5vdCBzdG9yZUlkP1xuICAgIHsgdHlwZTpzdG9yZVR5cGUsIGlkOnN0b3JlSWQgfSA9IGRlc2VyaWFsaXplKClcbiAgc3RhdGUuc3RvcmVUeXBlID0gc3RvcmVUeXBlIGlmIHN0b3JlVHlwZVxuICBzdGF0ZS5zdG9yZUlkID0gc3RvcmVJZFxuICBpZiBzdG9yZUlkP1xuICAgIHN0YXRlLnN0b3Jlc1tzdGF0ZS5zdG9yZVR5cGVdLnJlc3RvcmUgc3RhdGUuc3RvcmVJZCwgKGRhdGEpIC0+XG4gICAgICBjYWxsYmFjayBkYXRhXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyICdoYXNoY2hhbmdlJywgLT5cbiAgeyB0eXBlOnN0b3JlVHlwZSwgaWQ6c3RvcmVJZCB9ID0gZGVzZXJpYWxpemUoKVxuICBpZiBzdG9yZVR5cGUgaXNudCBzdGF0ZS5zdG9yZVR5cGUgb3Igc3RvcmVJZCBpc250IHN0YXRlLnN0b3JlSWRcbiAgICBzdGF0ZS5yZXN0b3JlIHN0b3JlVHlwZSwgc3RvcmVJZCwgKGRhdGEpIC0+XG4gICAgICBzdG9yZS5lbWl0ICdyZXN0b3JlJywgZGF0YVxuXG4jd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ3BvcHN0YXRlJywgLT5cbiMgIHN0YXRlLmZyb21Mb2NhdGlvbiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVcblxubW9kdWxlLmV4cG9ydHMgPSB7IFN0YXRlLCBzdGF0ZSB9XG4iLCIvLyBMWlctY29tcHJlc3MgYSBzdHJpbmdcclxuZnVuY3Rpb24gZW5jb2RlKHMpIHtcclxuICB2YXIgZGF0YSA9IChzICsgXCJcIikuc3BsaXQoXCJcIik7XHJcbiAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSByZXR1cm4gXCJcIjtcclxuICB2YXIgZGljdCA9IHt9O1xyXG4gIHZhciBvdXQgPSBbXTtcclxuICB2YXIgY3VyckNoYXI7XHJcbiAgdmFyIHBocmFzZSA9IGRhdGFbMF07XHJcbiAgdmFyIGNvZGUgPSAyNTY7XHJcbiAgZm9yICh2YXIgaT0xOyBpPGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgIGN1cnJDaGFyPWRhdGFbaV07XHJcbiAgICBpZiAoZGljdFtwaHJhc2UgKyBjdXJyQ2hhcl0gIT0gbnVsbCkge1xyXG4gICAgICBwaHJhc2UgKz0gY3VyckNoYXI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgb3V0LnB1c2gocGhyYXNlLmxlbmd0aCA+IDEgPyBkaWN0W3BocmFzZV0gOiBwaHJhc2UuY2hhckNvZGVBdCgwKSk7XHJcbiAgICAgIGRpY3RbcGhyYXNlICsgY3VyckNoYXJdID0gY29kZTtcclxuICAgICAgY29kZSsrO1xyXG4gICAgICBwaHJhc2U9Y3VyckNoYXI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIG91dC5wdXNoKHBocmFzZS5sZW5ndGggPiAxID8gZGljdFtwaHJhc2VdIDogcGhyYXNlLmNoYXJDb2RlQXQoMCkpO1xyXG4gIGZvciAodmFyIGk9MDsgaTxvdXQubGVuZ3RoOyBpKyspIHtcclxuICAgIG91dFtpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUob3V0W2ldKTtcclxuICB9XHJcbiAgcmV0dXJuIG91dC5qb2luKFwiXCIpO1xyXG59XHJcblxyXG4vLyBEZWNvbXByZXNzIGFuIExaVy1lbmNvZGVkIHN0cmluZ1xyXG5mdW5jdGlvbiBkZWNvZGUocykge1xyXG4gIHZhciBkYXRhID0gKHMgKyBcIlwiKS5zcGxpdChcIlwiKTtcclxuICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiBcIlwiO1xyXG4gIHZhciBkaWN0ID0ge307XHJcbiAgdmFyIGN1cnJDaGFyID0gZGF0YVswXTtcclxuICB2YXIgb2xkUGhyYXNlID0gY3VyckNoYXI7XHJcbiAgdmFyIG91dCA9IFtjdXJyQ2hhcl07XHJcbiAgdmFyIGNvZGUgPSAyNTY7XHJcbiAgdmFyIHBocmFzZTtcclxuICBmb3IgKHZhciBpPTE7IGk8ZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIGN1cnJDb2RlID0gZGF0YVtpXS5jaGFyQ29kZUF0KDApO1xyXG4gICAgaWYgKGN1cnJDb2RlIDwgMjU2KSB7XHJcbiAgICAgIHBocmFzZSA9IGRhdGFbaV07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcGhyYXNlID0gZGljdFtjdXJyQ29kZV0gPyBkaWN0W2N1cnJDb2RlXSA6IChvbGRQaHJhc2UgKyBjdXJyQ2hhcik7XHJcbiAgICB9XHJcbiAgICBvdXQucHVzaChwaHJhc2UpO1xyXG4gICAgY3VyckNoYXIgPSBwaHJhc2UuY2hhckF0KDApO1xyXG4gICAgZGljdFtjb2RlXSA9IG9sZFBocmFzZSArIGN1cnJDaGFyO1xyXG4gICAgY29kZSsrO1xyXG4gICAgb2xkUGhyYXNlID0gcGhyYXNlO1xyXG4gIH1cclxuICByZXR1cm4gb3V0LmpvaW4oXCJcIik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGVuY29kZTogZW5jb2RlLFxyXG4gIGRlY29kZTogZGVjb2RlXHJcbn07XHJcbiIsInhociA9IHJlcXVpcmUgJy4veGhyLmNvZmZlZSdcblxuZXh0ZW5kID0gKHI9e30sIGQpIC0+IHJba10gPSB2IGZvciBrLCB2IG9mIGQ7IHJcbnRvRGljdCA9IChhcnJheSwgZGljdD17fSkgLT4gZGljdFtrdnBbMF1dID0ga3ZwWzFdIGZvciBrdnAgaW4gYXJyYXk7IGRpY3RcbnBhcnNlUXVlcnkgPSAocykgLT4gdG9EaWN0KGt2cC5zcGxpdCgnPScpIGZvciBrdnAgaW4gcy5yZXBsYWNlKC9eXFw/LywnJykuc3BsaXQoJyYnKSlcblxue3N0YXRlfSA9IHJlcXVpcmUgJy4vU3RhdGUuY29mZmVlJ1xuXG5jbGllbnRJZCA9ICcwNGM0ZGUzMzMyNjY0ZDcwNDY0MidcbmNsaWVudFNlY3JldCA9ICdjOGQ2YWI1OGJiZjgwOTVjODJjMGYxMWU1N2RiOTJiZjJiOWY3NmJlJ1xucmVkaXJlY3QgPSB3aW5kb3cubG9jYXRpb24uaHJlZlxuXG5hdXRoID0gLT5cbiAgcXVlcnkgPSBwYXJzZVF1ZXJ5IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2hcbiAgaWYgcXVlcnkuY29kZVxuICAgIHhPcmlnU3RhdGUgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0gJ3gtb3JpZy1zdGF0ZSdcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0gJ3gtb3JpZy1zdGF0ZSdcbiAgICBpZiB4T3JpZ1N0YXRlIGlzbnQgcXVlcnkuc3RhdGVcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yICdjcm9zcyBvcmlnaW4gc3RhdGUgaGFzIGJlZW4gdGFtcGVyZWQgd2l0aC4nXG4gICAgeGhyXG4gICAgICBtZXRob2Q6ICdQT1NUJ1xuICAgICAgdXJsOiAnaHR0cHM6Ly9naXRodWIuY29tL2xvZ2luL29hdXRoL2FjY2Vzc190b2tlbidcbiAgICAgIGRhdGE6XG4gICAgICAgIGNsaWVudF9pZDogY2xpZW50SWRcbiAgICAgICAgY2xpZW50X3NlY3JldDogY2xpZW50U2VjcmV0XG4gICAgICAgIGNvZGU6IHF1ZXJ5LmNvZGVcbiAgICAsKGVyciwgZGF0YSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGRhdGFcbiAgZWxzZSBpZiBxdWVyeS5lcnJvclxuXG4gIGVsc2VcbiAgICBybmQgPSAoJzAxMjM0NTY3ODlhYmNkZWYnW01hdGgucmFuZG9tKCkgKiAxNiB8IDBdIGZvciB4IGluIFswLi4xMF0pLmpvaW4gJydcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0gJ3gtb3JpZy1zdGF0ZScsIHJuZFxuICAgICNpZnJhbWVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2lmcmFtZSdcbiAgICAjZXh0ZW5kIGlmcmFtZUVsLnN0eWxlLFxuICAgICMgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgIyAgd2lkdGg6ICc2MDBweCdcbiAgICAjICBoZWlnaHQ6ICc0MDBweCdcbiAgICAjICB0b3A6IDBcbiAgICAjICBsZWZ0OiAwXG4gICAgIyAgekluZGV4OiA5OTk5OVxuICAgIHdpbmRvdy5vcGVuIFwiaHR0cHM6Ly9naXRodWIuY29tL2xvZ2luL29hdXRoL2F1dGhvcml6ZT9jbGllbnRfaWQ9I3tjbGllbnRJZH0mc2NvcGU9Z2lzdCZzdGF0ZT0je3JuZH0mcmVkaXJlY3RfdXJpPSN7cmVkaXJlY3R9XCJcbiAgICAjZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBpZnJhbWVFbFxuXG5zdGF0ZS5zdG9yZXMuZ2lzdCA9XG4gIHN0b3JlOiAoaWQsIGRhdGEsIGNhbGxiYWNrKSAtPlxuICAgIHhoci5qc29uXG4gICAgICBtZXRob2Q6IGlmIGlkIHRoZW4gJ1BBVENIJyBlbHNlICdQT1NUJ1xuICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9naXN0cycgKyBpZiBpZCB0aGVuICcvJytpZCBlbHNlICcnXG4gICAgICBkYXRhOlxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZWQgd2l0aCBEci4gTWFya2Rvd24nXG4gICAgICAgIGZpbGVzOlxuICAgICAgICAgICdtYWluLm1kJzogY29udGVudDogZGF0YS50ZXh0XG4gICAgICAgICAgJ3N0YXRlLmpzb24nOiBjb250ZW50OiBKU09OLnN0cmluZ2lmeSBkYXRhLnN0YXRlXG4gICAgLChlcnIsIGRhdGEpIC0+IGNhbGxiYWNrIGRhdGEuaWRcbiAgcmVzdG9yZTogKGlkLCBjYWxsYmFjaykgLT5cbiAgICB4aHIuanNvbiB1cmw6J2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMvJytpZCwgKGVyciwgZGF0YSkgLT5cbiAgICAgIHtcbiAgICAgICAgZmlsZXM6IHtcbiAgICAgICAgICAnbWFpbi5tZCc6IHsgcmF3X3VybDp0ZXh0VXJsIH0sXG4gICAgICAgICAgJ3N0YXRlLmpzb24nOiB7IHJhd191cmw6c3RhdGVVcmwgfVxuICAgICAgICB9XG4gICAgICB9ID0gZGF0YVxuICAgICAgeGhyLmpzb24gdXJsOnN0YXRlVXJsLCAoZXJyLCBzdGF0ZSkgLT5cbiAgICAgICAgeGhyIHVybDp0ZXh0VXJsLCAoZXJyLCB0ZXh0KSAtPlxuICAgICAgICAgIGNhbGxiYWNrIHsgdGV4dCwgc3RhdGUgfVxuXG5zZXRUaW1lb3V0ICgtPiBhdXRoKCkpLCAxMDAwXG4iLCJ4aHIgPSAob3B0LCBjYWxsYmFjaykgLT5cbiAgciA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuICByLm9wZW4gb3B0Lm1ldGhvZCBvciAnR0VUJywgb3B0LnVybCwgdHJ1ZVxuICByLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IC0+XG4gICAgaWYgci5yZWFkeVN0YXRlIGlzIDRcbiAgICAgIGlmIHIuc3RhdHVzID49IDIwMCBhbmQgci5zdGF0dXMgPCAzMDBcbiAgICAgICAgY2FsbGJhY2sgdW5kZWZpbmVkLCByLnJlc3BvbnNlVGV4dCwgclxuICAgICAgZWxzZVxuICAgICAgICBjYWxsYmFjayByLnN0YXR1c1RleHQsIHIucmVzcG9uc2VUZXh0LCByXG4gIHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSBmb3IgaGVhZGVyLCB2YWx1ZSBvZiBvcHQuaGVhZGVyc1xuICByLnNlbmQgb3B0LmRhdGFcbiAgclxuXG54aHIuanNvbiA9IChvcHQsIGNhbGxiYWNrKSAtPlxuICBjYWxsYmFja18gPSAoZXJyLCBqc29uLCB4aHIpIC0+XG4gICAgaWYgZXJyPyBvciBub3QganNvbiB0aGVuIHJldHVybiBjYWxsYmFjayBlcnIsIHVuZGVmaW5lZCwgeGhyXG4gICAgdHJ5XG4gICAgICBkYXRhID0gSlNPTi5wYXJzZSBqc29uXG4gICAgY2F0Y2ggZXJyX1xuICAgICAgZXJyID0gZXJyX1xuICAgIGNhbGxiYWNrIGVyciwgZGF0YSwgeGhyXG4gIG9wdC5kYXRhID0gSlNPTi5zdHJpbmdpZnkgb3B0LmRhdGFcbiAgb3B0LmhlYWRlcnMgPSAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gIHhociBvcHQsIGNhbGxiYWNrX1xuXG5tb2R1bGUuZXhwb3J0cyA9IHhoclxuIiwibW9kdWxlLmV4cG9ydHMgPSBcbiAgZ2V0Q3Vyc29yUG9zaXRpb246IChlbCkgLT5cbiAgICBwb3MgPSAwXG4gICAgIyBJRSBTdXBwb3J0XG4gICAgaWYgZG9jdW1lbnQuc2VsZWN0aW9uXG4gICAgICBlbC5mb2N1cygpXG4gICAgICBTZWwgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKVxuICAgICAgU2VsTGVuZ3RoID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCkudGV4dC5sZW5ndGhcbiAgICAgIFNlbC5tb3ZlU3RhcnQgJ2NoYXJhY3RlcicsIC1lbC52YWx1ZS5sZW5ndGhcbiAgICAgIHBvcyA9IFNlbC50ZXh0Lmxlbmd0aCAtIFNlbExlbmd0aFxuICAgICMgRmlyZWZveCBzdXBwb3J0XG4gICAgZWxzZSBpZiBlbC5zZWxlY3Rpb25TdGFydCBvciBlbC5zZWxlY3Rpb25TdGFydCBpcyAwXG4gICAgICBwb3MgPSBlbC5zZWxlY3Rpb25TdGFydFxuICAgIHBvc1xuXG4gIG51bWJlcjogKGVsKSAtPlxuICAgIHNlbGVjdG9yID0gJ0gxLEgyLEgzLEg0LEg1LEg2JyAjICsgJyxPTCxVTCxMSSdcbiAgICBlbGVtcyA9IFtdXG4gICAgb3JkZXIgPSBzZWxlY3Rvci5zcGxpdCgnLCcpXG4gICAgbWFwID0ge31cbiAgICBtYXBbc2VsXSA9IHtjOjAsIHBvczppfSBmb3Igc2VsLCBpIGluIG9yZGVyXG4gICAgbnVtID0gKHRhZykgLT5cbiAgICAgIChjIGZvciBpIGluIFswLi5tYXBbdGFnXS5wb3NdXFxcbiAgICAgICB3aGVuIChjPW1hcFsodD1vcmRlcltpXSldLmMpIGlzbnQgMFxcXG4gICAgICAgYW5kIHQgbm90IGluIFsnT0wnLCAnVUwnXSkuam9pbiAnLCdcbiAgICBjb3VudCA9IChzZWwpIC0+XG4gICAgICBlID0gbWFwW3NlbF1cbiAgICAgIGUuYysrXG4gICAgICAobWFwW29yZGVyW2ldXS5jID0gMCBmb3IgaSBpbiBbZS5wb3MrMS4uLm9yZGVyLmxlbmd0aF0pXG4gICAgcmVzZXQgPSAoY2xlYXIpIC0+XG4gICAgICBlbGVtcyA9IFtdIGlmIGNsZWFyXG4gICAgICBvYmouYyA9IDAgZm9yIHNlbCxvYmogb2YgbWFwXG4gICAgZm9yIGgsIGkgaW4gZWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbnVtYmVyLXJlc2V0XSxbZGF0YS1udW1iZXItY2xlYXJdLCcrc2VsZWN0b3IpXG4gICAgICBpZiBoLmhhc0F0dHJpYnV0ZSAnZGF0YS1udW1iZXItcmVzZXQnXG4gICAgICAgIHJlc2V0KClcbiAgICAgIGVsc2UgaWYgaC5oYXNBdHRyaWJ1dGUgJ2RhdGEtbnVtYmVyLWNsZWFyJ1xuICAgICAgICByZXNldCB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIHQgPSBoLnRhZ05hbWVcbiAgICAgICAgY291bnQgdFxuICAgICAgICBlbGVtcy5wdXNoIFtoLCBudW0gdF0gaWYgdCBub3QgaW4gWydPTCcsICdVTCddXG4gICAgaC5zZXRBdHRyaWJ1dGUgJ2RhdGEtbnVtYmVyJywgbiBmb3IgW2gsIG5dIGluIGVsZW1zXG4gICAgZWxcblxuICBpbmRleDogKGVsKSAtPlxuICAgIGZvciBlIGluIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW51bWJlcl0nKVxuICAgICAgZS5pbm5lckhUTUwgPSBcIlwiXCJcbiAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImluZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgI3tlLmdldEF0dHJpYnV0ZSgnZGF0YS1udW1iZXInKS5zcGxpdCgnLCcpLmpvaW4oJy4gJyl9LlxuICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICBcIlwiXCIgKyBlLmlubmVySFRNTFxuICAgIGVsXG5cbiAgdG9jOiAoZWwpIC0+XG4gICAgJzx1bD4nICsgKGZvciBlIGluIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ0gxLEgyLEgzLEg0LEg1LEg2JylcbiAgICAgIFwiXCJcIlxuICAgICAgPGxpPjxhIGhyZWY9XCIjI3tlLmlkfVwiPjwje2UudGFnTmFtZX0+XG4gICAgICAje2UuaW5uZXJIVE1MfVxuICAgICAgPC8je2UudGFnTmFtZX0+PC9hPjwvbGk+XG4gICAgICBcIlwiXCJcbiAgICApLmpvaW4oJycpICsgJzwvdWw+J1xuIiwiIWZ1bmN0aW9uKG9iaikge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBvYmo7XG4gIGVsc2VcbiAgICB3aW5kb3cudml4ZW4gPSBvYmo7XG59KGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiB0cmltKHN0cikge3JldHVybiBTdHJpbmcucHJvdG90eXBlLnRyaW0uY2FsbChzdHIpO307XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZVByb3Aob2JqLCBuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWUudHJpbSgpLnNwbGl0KCcuJykucmVkdWNlKGZ1bmN0aW9uIChwLCBwcm9wKSB7XG4gICAgICByZXR1cm4gcCA/IHBbcHJvcF0gOiB1bmRlZmluZWQ7XG4gICAgfSwgb2JqKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmVDaGFpbihvYmosIGNoYWluKSB7XG4gICAgdmFyIHByb3AgPSBjaGFpbi5zaGlmdCgpO1xuICAgIHJldHVybiBjaGFpbi5yZWR1Y2UoZnVuY3Rpb24gKHAsIHByb3ApIHtcbiAgICAgIHZhciBmID0gcmVzb2x2ZVByb3Aob2JqLCBwcm9wKTtcbiAgICAgIHJldHVybiBmID8gZihwKSA6IHA7XG4gICAgfSwgcmVzb2x2ZVByb3Aob2JqLCBwcm9wKSk7XG4gIH1cblxuICBmdW5jdGlvbiBidWNrZXQoYiwgaywgdikge1xuICAgIGlmICghKGsgaW4gYikpIGJba10gPSBbXTtcbiAgICBpZiAoISh2IGluIGJba10pKSBiW2tdLnB1c2godik7XG4gIH1cblxuICBmdW5jdGlvbiBleHRlbmQob3JpZywgb2JqKSB7XG4gICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIG9yaWdbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgfSk7XG4gICAgcmV0dXJuIG9yaWc7XG4gIH1cblxuICBmdW5jdGlvbiB0cmF2ZXJzZUVsZW1lbnRzKGVsLCBjYWxsYmFjaykge1xuICAgIHZhciBpO1xuICAgIGlmIChjYWxsYmFjayhlbCkgIT09IGZhbHNlKSB7XG4gICAgICBmb3IoaSA9IGVsLmNoaWxkcmVuLmxlbmd0aDsgaS0tOykgKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHRyYXZlcnNlRWxlbWVudHMobm9kZSwgY2FsbGJhY2spO1xuICAgICAgfSkoZWwuY2hpbGRyZW5baV0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVByb3h5KG1hcHMsIHByb3h5KSB7XG4gICAgcHJveHkgPSBwcm94eSB8fCB7fTtcbiAgICBwcm94eS5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHZhciB0b1JlbmRlciA9IHt9O1xuICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgbWFwcy5vcmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICBpZiAobWFwcy5iaW5kc1twcm9wXSkgbWFwcy5iaW5kc1twcm9wXS5mb3JFYWNoKGZ1bmN0aW9uKHJlbmRlcklkKSB7XG4gICAgICAgICAgaWYgKHJlbmRlcklkID49IDApIHRvUmVuZGVyW3JlbmRlcklkXSA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBmb3IgKHJlbmRlcklkIGluIHRvUmVuZGVyKSBtYXBzLnJlbmRlcnNbcmVuZGVySWRdKG1hcHMub3JpZyk7XG4gICAgICByZXR1cm4gcHJveHk7XG4gICAgfTtcblxuICAgIE9iamVjdC5rZXlzKG1hcHMuYmluZHMpLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgdmFyIGlkcyA9IG1hcHMuYmluZHNbcHJvcF07XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksIHByb3AsIHtcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIG1hcHMub3JpZ1twcm9wXSA9IHZhbHVlO1xuICAgICAgICAgIGlkcy5mb3JFYWNoKGZ1bmN0aW9uKHJlbmRlcklkKSB7XG4gICAgICAgICAgICBpZiAocmVuZGVySWQgPj0gMCkgbWFwcy5yZW5kZXJzW3JlbmRlcklkXShtYXBzLm9yaWcpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChtYXBzLnJlYmluZHNbcHJvcF0pXG4gICAgICAgICAgICByZXR1cm4gbWFwcy5yZWJpbmRzW3Byb3BdKCk7XG4gICAgICAgICAgcmV0dXJuIG1hcHMub3JpZ1twcm9wXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb3h5O1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGVsLCBtb2RlbCkge1xuICAgIHZhciBwYXR0ZXJuID0gL1xce1xcey4rP1xcfVxcfS9nLFxuICAgICAgICBwaXBlID0gJ3wnO1xuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZShvcmlnLCBwcm9wKSB7XG4gICAgICBpZiAoIW9yaWcpIHJldHVybiAnJztcbiAgICAgIHZhciB2YWwgPSByZXNvbHZlQ2hhaW4ob3JpZywgcHJvcC5zbGljZSgyLC0yKS5zcGxpdChwaXBlKSk7XG4gICAgICByZXR1cm4gdmFsID09PSB1bmRlZmluZWQgPyAnJyA6IHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdHJUbXBsKHN0ciwgb3JpZykge1xuICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKHBhdHRlcm4sIHJlc29sdmUuYmluZCh1bmRlZmluZWQsIG9yaWcpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaChzdHIpIHtcbiAgICAgIHZhciBtID0gc3RyLm1hdGNoKHBhdHRlcm4pO1xuICAgICAgaWYgKG0pIHJldHVybiBtLm1hcChmdW5jdGlvbihjaGFpbikge1xuICAgICAgICByZXR1cm4gY2hhaW4uc2xpY2UoMiwgLTIpLnNwbGl0KHBpcGUpLm1hcCh0cmltKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyYXZlcnNlKGVsLCBvcmlnKSB7XG4gICAgICB2YXIgYmluZHMgPSB7fSxcbiAgICAgICAgICByZWJpbmRzID0ge30sXG4gICAgICAgICAgcmVuZGVycyA9IHt9LFxuICAgICAgICAgIGNvdW50ID0gMDtcbiAgICAgIG9yaWcgPSBvcmlnIHx8IHt9O1xuXG4gICAgICBmdW5jdGlvbiBiaW5kUmVuZGVycyhjaGFpbnMsIHJlbmRlcklkKSB7XG4gICAgICAgIC8vIENyZWF0ZSBwcm9wZXJ0eSB0byByZW5kZXIgbWFwcGluZ1xuICAgICAgICBjaGFpbnMuZm9yRWFjaChmdW5jdGlvbihjaGFpbikge1xuICAgICAgICAgIC8vIFRPRE86IFJlZ2lzdGVyIGNoYWluaW5nIGZ1bmN0aW9ucyBhcyBiaW5kcyBhcyB3ZWxsLlxuICAgICAgICAgIGJ1Y2tldChiaW5kcywgY2hhaW5bMF0uc3BsaXQoJy4nKVswXSwgcmVuZGVySWQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGFyc2VJdGVyYXRvcihlbCkge1xuICAgICAgICB2YXIgbWFya2VyLCBwcmVmaXggPSAnJywgbm9kZXMgPSBbXTtcbiAgICAgICAgaWYgKHBhcmVudF8gPSAoZWwucGFyZW50RWxlbWVudCB8fCBlbC5wYXJlbnROb2RlKSkge1xuICAgICAgICAgIGlmIChlbC50YWdOYW1lID09PSAnRk9SJykge1xuICAgICAgICAgICAgbWFya2VyID0gZWwub3duZXJEb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICAgICAgICBwYXJlbnRfLnJlcGxhY2VDaGlsZChtYXJrZXIsIGVsKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1pbicpKSB7XG4gICAgICAgICAgICBwcmVmaXggPSAnZGF0YS0nO1xuICAgICAgICAgICAgcGFyZW50XyA9IGVsO1xuICAgICAgICAgICAgbm9kZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlbC5jaGlsZE5vZGVzKTtcbiAgICAgICAgICAgIG1hcmtlciA9IGVsLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgICAgICAgcGFyZW50Xy5hcHBlbmRDaGlsZChtYXJrZXIpO1xuICAgICAgICAgIH0gZWxzZSByZXR1cm47XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFsaWFzOiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4Kyd2YWx1ZScpLFxuICAgICAgICAgICAga2V5OiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4KydrZXknKSxcbiAgICAgICAgICAgIHByb3A6IGVsLmdldEF0dHJpYnV0ZShwcmVmaXgrJ2luJyksXG4gICAgICAgICAgICBlYWNoOiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4KydlYWNoJyksXG4gICAgICAgICAgICBub2Rlczogbm9kZXMsXG4gICAgICAgICAgICBwYXJlbnQ6IHBhcmVudF8sXG4gICAgICAgICAgICBtYXJrZXI6IG1hcmtlclxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbWFwQXR0cmlidXRlKG93bmVyLCBhdHRyKSB7XG4gICAgICAgIHZhciBuYW1lLCBldmVudElkLCByZW5kZXJJZCwgc3RyLCBub1RtcGw7XG4gICAgICAgIGlmICgoc3RyID0gYXR0ci52YWx1ZSkgJiYgKGNoYWlucyA9IG1hdGNoKHN0cikpKSB7XG4gICAgICAgICAgbmFtZSA9IGF0dHIubmFtZTtcbiAgICAgICAgICBpZiAobmFtZS5pbmRleE9mKCd2eC0nKSA9PT0gMCkge1xuICAgICAgICAgICAgb3duZXIucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobmFtZS5pbmRleE9mKCdvbicpID09PSAwKSB7XG4gICAgICAgICAgICByZW5kZXJJZCA9IC0xOyAvLyBObyByZW5kZXJlclxuICAgICAgICAgICAgZXZlbnROYW1lID0gbmFtZS5zdWJzdHIoMik7XG4gICAgICAgICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgICAgICBjaGFpbnMuZm9yRWFjaChmdW5jdGlvbihjaGFpbikge1xuICAgICAgICAgICAgICBvd25lci5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVQcm9wKG9yaWcsIGNoYWluWzBdKShldnQsIG93bmVyLnZhbHVlKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG93bmVyLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9UbXBsID0gY2hhaW5zLmxlbmd0aCA9PT0gMSAmJiBzdHIuc3Vic3RyKDAsMSkgPT09ICd7JyAmJlxuICAgICAgICAgICAgICBzdHIuc3Vic3RyKC0xKSA9PT0gJ30nO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBmb3IgYXR0cmlidXRlLlxuICAgICAgICAgICAgcmVuZGVySWQgPSBjb3VudCsrO1xuICAgICAgICAgICAgKHJlbmRlcnNbcmVuZGVySWRdID0gZnVuY3Rpb24ob3JpZywgY2xlYXIpIHtcbiAgICAgICAgICAgICAgdmFyIHZhbCA9IG5vVG1wbCA/IHJlc29sdmUob3JpZywgc3RyKSA6IHN0clRtcGwoc3RyLCBvcmlnKTtcbiAgICAgICAgICAgICAgIWNsZWFyICYmIG5hbWUgaW4gb3duZXIgPyBvd25lcltuYW1lXSA9IHZhbCA6XG4gICAgICAgICAgICAgICAgb3duZXIuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCk7XG4gICAgICAgICAgICB9KShvcmlnLCB0cnVlKTtcbiAgICAgICAgICAgIC8vIEJpLWRpcmVjdGlvbmFsIGNvdXBsaW5nLlxuICAgICAgICAgICAgaWYgKG5vVG1wbCkgcmViaW5kc1tjaGFpbnNbMF1bMF1dID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogR2V0dGluZyBmLmV4LiAndmFsdWUnIGF0dHJpYnV0ZSBmcm9tIGFuIGlucHV0XG4gICAgICAgICAgICAgICAgLy8gZG9lc24ndCByZXR1cm4gdXNlciBpbnB1dCB2YWx1ZSBzbyBhY2Nlc3NpbmcgZWxlbWVudFxuICAgICAgICAgICAgICAgIC8vIG9iamVjdCBwcm9wZXJ0aWVzIGRpcmVjdGx5LCBmaW5kIG91dCBob3cgdG8gZG8gdGhpc1xuICAgICAgICAgICAgICAgIC8vIG1vcmUgc2VjdXJlbHkuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5hbWUgaW4gb3duZXIgP1xuICAgICAgICAgICAgICAgICAgb3duZXJbbmFtZV0gOiBvd25lci5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGJpbmRSZW5kZXJzKGNoYWlucywgcmVuZGVySWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1hcFRleHROb2RlcyhlbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gZWwuY2hpbGROb2Rlcy5sZW5ndGg7IGktLTspIChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgdmFyIHN0ciwgcmVuZGVySWQsIGNoYWlucztcbiAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gZWwuVEVYVF9OT0RFICYmIChzdHIgPSBub2RlLm5vZGVWYWx1ZSkgJiZcbiAgICAgICAgICAgICAgKGNoYWlucyA9IG1hdGNoKHN0cikpKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgcmVuZGVyaW5nIGZ1bmN0aW9uIGZvciBlbGVtZW50IHRleHQgbm9kZS5cbiAgICAgICAgICAgIHJlbmRlcklkID0gY291bnQrKztcbiAgICAgICAgICAgIChyZW5kZXJzW3JlbmRlcklkXSA9IGZ1bmN0aW9uKG9yaWcpIHtcbiAgICAgICAgICAgICAgbm9kZS5ub2RlVmFsdWUgPSBzdHJUbXBsKHN0ciwgb3JpZyk7XG4gICAgICAgICAgICB9KShvcmlnKTtcbiAgICAgICAgICAgIGJpbmRSZW5kZXJzKGNoYWlucywgcmVuZGVySWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkoZWwuY2hpbGROb2Rlc1tpXSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSBuby10cmF2ZXJzZSBhdHRyaWJ1dGUgaWYgcm9vdCBub2RlXG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3VidmlldycpO1xuXG4gICAgICB0cmF2ZXJzZUVsZW1lbnRzKGVsLCBmdW5jdGlvbihlbF8pIHtcbiAgICAgICAgdmFyIGksIGl0ZXIsIHRlbXBsYXRlLCBub2RlcywgcmVuZGVySWQ7XG5cbiAgICAgICAgLy8gU3RvcCBoYW5kbGluZyBhbmQgcmVjdXJzaW9uIGlmIHN1YnZpZXcuXG4gICAgICAgIGlmIChlbF8uZ2V0QXR0cmlidXRlKCdkYXRhLXN1YnZpZXcnKSAhPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmIChpdGVyID0gcGFyc2VJdGVyYXRvcihlbF8pKSB7XG4gICAgICAgICAgbm9kZXMgPSBpdGVyLm5vZGVzO1xuICAgICAgICAgIHRlbXBsYXRlID0gZWxfLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICBtYXBzID0gdHJhdmVyc2UodGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgICAgICByZW5kZXJJZCA9IGNvdW50Kys7XG4gICAgICAgICAgKHJlbmRlcnNbcmVuZGVySWRdID0gZnVuY3Rpb24ob3JpZykge1xuICAgICAgICAgICAgdmFyIGxpc3QgPSByZXNvbHZlUHJvcChvcmlnLCBpdGVyLnByb3ApLFxuICAgICAgICAgICAgICAgIGVhY2hfID0gaXRlci5lYWNoICYmIHJlc29sdmVQcm9wKG9yaWcsIGl0ZXIuZWFjaCksIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSBub2Rlcy5sZW5ndGg7IGktLTspIGl0ZXIucGFyZW50LnJlbW92ZUNoaWxkKG5vZGVzW2ldKTtcbiAgICAgICAgICAgIG5vZGVzID0gW107XG4gICAgICAgICAgICBmb3IgKGkgaW4gbGlzdCkgaWYgKGxpc3QuaGFzT3duUHJvcGVydHkoaSkpXG4gICAgICAgICAgICAgIChmdW5jdGlvbih2YWx1ZSwgaSl7XG4gICAgICAgICAgICAgICAgdmFyIG9yaWdfID0gZXh0ZW5kKHt9LCBvcmlnKSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSB0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSksXG4gICAgICAgICAgICAgICAgICAgIGxhc3ROb2RlID0gaXRlci5tYXJrZXIsXG4gICAgICAgICAgICAgICAgICAgIG1hcHMsIHJlbmRlcklkLCBpXywgbm9kZSwgbm9kZXNfID0gW107XG4gICAgICAgICAgICAgICAgaWYgKGl0ZXIua2V5KSBvcmlnX1tpdGVyLmtleV0gPSBpO1xuICAgICAgICAgICAgICAgIG9yaWdfW2l0ZXIuYWxpYXNdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgbWFwcyA9IHRyYXZlcnNlKGNsb25lLCBvcmlnXyk7XG4gICAgICAgICAgICAgICAgZm9yIChpXyA9IGNsb25lLmNoaWxkTm9kZXMubGVuZ3RoOyBpXy0tOyBsYXN0Tm9kZSA9IG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgIG5vZGVzXy5wdXNoKG5vZGUgPSBjbG9uZS5jaGlsZE5vZGVzW2lfXSk7XG4gICAgICAgICAgICAgICAgICBpdGVyLnBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgbGFzdE5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZWFjaF8gJiYgZWFjaF8odmFsdWUsIGksIG9yaWdfLCBub2Rlc18uZmlsdGVyKGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuLm5vZGVUeXBlID09PSBlbF8uRUxFTUVOVF9OT0RFO1xuICAgICAgICAgICAgICAgIH0pKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGlfID0gbm9kZXNfLmxlbmd0aDsgaV8tLTspXG4gICAgICAgICAgICAgICAgICAgIGl0ZXIucGFyZW50LnJlbW92ZUNoaWxkKG5vZGVzX1tpX10pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBub2RlcyA9IG5vZGVzLmNvbmNhdChub2Rlc18pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkobGlzdFtpXSwgaSk7XG4gICAgICAgICAgfSkob3JpZyk7XG4gICAgICAgICAgYnVja2V0KGJpbmRzLCBpdGVyLnByb3Auc3BsaXQoJy4nKVswXSwgcmVuZGVySWQpO1xuICAgICAgICAgIGZvciAocCBpbiBtYXBzLmJpbmRzKSBpZiAoaXRlci5hbGlhcy5pbmRleE9mKHApID09PSAtMSlcbiAgICAgICAgICAgIGJ1Y2tldChiaW5kcywgcCwgcmVuZGVySWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEJpbmQgbm9kZSB0ZXh0LlxuICAgICAgICAgIG1hcFRleHROb2RlcyhlbF8pO1xuICAgICAgICB9XG4gICAgICAgIC8vIEJpbmQgbm9kZSBhdHRyaWJ1dGVzIGlmIG5vdCBhIDxmb3I+LlxuICAgICAgICBpZiAoZWxfLnRhZ05hbWUgIT09ICdGT1InKSBmb3IgKGkgPSBlbF8uYXR0cmlidXRlcy5sZW5ndGg7IGktLTspXG4gICAgICAgICAgbWFwQXR0cmlidXRlKGVsXywgZWxfLmF0dHJpYnV0ZXNbaV0pO1xuICAgICAgICAvLyBTdG9wIHJlY3Vyc2lvbiBpZiBpdGVyYXRvci5cbiAgICAgICAgcmV0dXJuICFpdGVyO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4ge29yaWc6b3JpZywgYmluZHM6YmluZHMsIHJlYmluZHM6cmViaW5kcywgcmVuZGVyczpyZW5kZXJzfTtcbiAgICB9XG4gICAgcmV0dXJuIGNyZWF0ZVByb3h5KHRyYXZlcnNlKGVsLCBtb2RlbCAmJiBleHRlbmQoe30sIG1vZGVsKSksIG1vZGVsKTtcbiAgfTtcbn0oKSk7XG4iLCJ2aXhlbiA9IHJlcXVpcmUgJ3ZpeGVuJ1xuU2hvd2Rvd24gPSByZXF1aXJlICdzaG93ZG93bidcbm1hcmtkb3duID0gbmV3IFNob3dkb3duLmNvbnZlcnRlcigpXG5cbnJlcXVpcmUgJy4vdW5pZnkuY29mZmVlJ1xueyBTdGF0ZSwgc3RhdGU6c3RhdGVfIH0gPSByZXF1aXJlICcuL1N0YXRlLmNvZmZlZSdcbnJlcXVpcmUgJy4vc3RhdGUtZ2lzdC5jb2ZmZWUnXG5cbntudW1iZXIsIGluZGV4LCB0b2N9ID0gcmVxdWlyZSAnLi91dGlscy5jb2ZmZWUnXG5cbnByb3h5ID0gLT5cbiAgdmF1bHRfID0ge31cbiAgcHJveHlfID1cbiAgICBkZWY6IChwcm9wLCBjYWxsYmFjaykgLT5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBwcm94eV8sIHByb3AsXG4gICAgICAgIHNldDogKHZhbHVlKSAtPlxuICAgICAgICAgIG9sZCA9IHZhdWx0X1twcm9wXVxuICAgICAgICAgIHZhdWx0X1twcm9wXSA9IHZhbHVlXG4gICAgICAgICAgY2FsbGJhY2sgdmFsdWUsIG9sZFxuICAgICAgICBnZXQ6IC0+IHZhdWx0X1twcm9wXVxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIHN0YXRlID0ge31cbiAgI3N0YXRlLm9uICdjaGFuZ2UnLCAtPiB1cGRhdGVTdGF0dXMgeWVzXG5cbiAgdG9jRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG9jJ1xuICB2aWV3RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndmlldydcbiAgdmlld1dyYXBFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd2aWV3LXdyYXAnXG5cbiAgZG9jVGl0bGUgPSAtPlxuICAgIHRtcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgICB0bXAuaW5uZXJIVE1MID0gaWYgKGggPSB2aWV3RWwucXVlcnlTZWxlY3RvckFsbCgnaDEsaDIsaDMnKVswXSlcbiAgICAgIGguaW5uZXJIVE1MXG4gICAgZWxzZVxuICAgICAgJ1VudGl0bGVkJ1xuICAgIFtdLmZvckVhY2guY2FsbCB0bXAucXVlcnlTZWxlY3RvckFsbCgnLmluZGV4JyksIChlbCkgLT4gdG1wLnJlbW92ZUNoaWxkIGVsXG4gICAgdG1wLnRleHRDb250ZW50XG5cbiAgc2F2ZWQgPSB5ZXNcblxuICB1cGRhdGVTdGF0dXMgPSAoZm9yY2UpIC0+XG4gICAgaWYgbm90IHNhdmVkIG9yIGZvcmNlXG4gICAgICBzdGF0ZV8uc3RvcmUgbnVsbCwgdGV4dDplZGl0b3IuZ2V0VmFsdWUoKSwgc3RhdGU6c3RhdGVcbiAgICAgICNzdGF0ZS5nZW5lcmF0ZUhhc2ggJ2Jhc2U2NCcsIGVkaXRvci5nZXRWYWx1ZSgpLCAoaGFzaCkgLT5cbiAgICAgICMgIGxvY2F0aW9uLmhhc2ggPSBoYXNoXG4gICAgICBkb2N1bWVudC50aXRsZSA9IGRvY1RpdGxlKClcbiAgICAgIHNhdmVkID0geWVzXG5cbiAgdXBkYXRlVG9jID0gLT4gdG9jRWwuaW5uZXJIVE1MID0gdG9jIHZpZXdFbFxuXG4gIHVwZGF0ZUluZGV4ID0gLT4gaW5kZXggbnVtYmVyIHZpZXdFbFxuXG4gIGN1cnNvclRva2VuID0gJ15eXmN1cnNvcl5eXidcbiAgdXBkYXRlVmlldyA9IC0+XG4gICAgY2xpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZVxuICAgIG1kID0gZWRpdG9yLmdldFZhbHVlKCkuc3BsaXQgJ1xcbidcbiAgICBtZFtjbGluZV0gKz0gY3Vyc29yVG9rZW5cbiAgICBtZCA9IG1kLmpvaW4gJ1xcbidcbiAgICB2ID0gdmlld0VsXG4gICAgdi5pbm5lckhUTUwgPSBtYXJrZG93bi5tYWtlSHRtbChtZCkucmVwbGFjZShjdXJzb3JUb2tlbiwgJzxzcGFuIGlkPVwiY3Vyc29yXCI+PC9zcGFuPicpXG4gICAgdXBkYXRlSW5kZXgoKSBpZiBzdGF0ZS5pbmRleFxuICAgIHVwZGF0ZVRvYygpIGlmIHN0YXRlLnRvY1xuICAgIHNjcm9sbFRvcCA9IHZpZXdXcmFwRWwuc2Nyb2xsVG9wXG4gICAgdmlld0hlaWdodCA9IHZpZXdXcmFwRWwub2Zmc2V0SGVpZ2h0XG4gICAgY3Vyc29yU3BhbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdjdXJzb3InXG4gICAgY3Vyc29yVG9wID0gY3Vyc29yU3Bhbi5vZmZzZXRUb3BcbiAgICBjdXJzb3JIZWlnaHQgPSBjdXJzb3JTcGFuLm9mZnNldEhlaWdodFxuICAgIGlmIGN1cnNvclRvcCA8IHNjcm9sbFRvcCBvciBjdXJzb3JUb3AgPiBzY3JvbGxUb3AgKyB2aWV3SGVpZ2h0IC0gY3Vyc29ySGVpZ2h0XG4gICAgICB2aWV3V3JhcEVsLnNjcm9sbFRvcCA9IGN1cnNvclRvcCAtIHZpZXdIZWlnaHQvMlxuXG4gIHNldE1vZGUgPSAobW9kZSkgLT5cbiAgICBtb2RlbC5tb2RlID0ge1xuICAgICAgd3JpdGU6ICdmdWxsLWlucHV0J1xuICAgICAgcmVhZDogJ2Z1bGwtdmlldydcbiAgICB9W21vZGVdIG9yICcnXG4gIHNldFRvYyA9ICh0bykgLT5cbiAgICB1cGRhdGVUb2MoKSBpZiB0b1xuICAgIG1vZGVsLnNob3dUb2MgPSBpZiB0byB0aGVuICd0b2MnIGVsc2UgJydcbiAgc2V0SW5kZXggPSAodG8pIC0+XG4gICAgaWYgdG9cbiAgICAgIGlmIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyN2aWV3IFtkYXRhLW51bWJlcl0nKS5sZW5ndGggaXMgMFxuICAgICAgICB1cGRhdGVJbmRleCgpXG4gICAgICAgIHVwZGF0ZVRvYygpIGlmIHN0YXRlLnRvY1xuICAgICAgbW9kZWwuc2hvd0luZGV4ID0gJ2luZGV4ZWQnXG4gICAgZWxzZVxuICAgICAgbW9kZWwuc2hvd0luZGV4ID0gJydcblxuICBzYXZlVGltZXIgPSBudWxsXG4gIGVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1tZCcpLFxuICAgIG1vZGU6ICdnZm0nXG4gICAgdGhlbWU6ICdkZWZhdWx0J1xuICAgIGxpbmVOdW1iZXJzOiBub1xuICAgIGxpbmVXcmFwcGluZzogeWVzXG4gICAgb25DaGFuZ2U6IC0+XG4gICAgICB1cGRhdGVWaWV3KClcbiAgICAgIHNhdmVkID0gbm9cbiAgICAgIGNsZWFyVGltZW91dCBzYXZlVGltZXJcbiAgICAgIHNhdmVUaW1lciA9IHNldFRpbWVvdXQgdXBkYXRlU3RhdHVzLCA1MDAwXG4gICAgb25EcmFnRXZlbnQ6IChlZGl0b3IsIGV2ZW50KSAtPlxuICAgICAgc2hvd0RuZCA9IG5vIGlmIHNob3dEbmQgb3IgZXZlbnQudHlwZSBpcyAnZHJvcCdcbiAgICAgIGZhbHNlXG4gIHNldFN0YXRlID0gKGRhdGEpIC0+XG4gICAgeyB0ZXh0LCBzdGF0ZTogc3RhdGVfXyB9ID0gZGF0YVxuICAgIHN0YXRlID0gc3RhdGVfXyBvciB7fVxuICAgIGVkaXRvci5zZXRWYWx1ZSB0ZXh0IGlmIHRleHQ/IGFuZCB0ZXh0IGlzbnQgZWRpdG9yLmdldFZhbHVlKClcbiAgICBzZXRNb2RlIHN0YXRlLm1vZGVcbiAgICBzZXRJbmRleCBzdGF0ZS5pbmRleFxuICAgIHNldFRvYyBzdGF0ZS50b2NcbiAgICBtb2RlbC50aGVtZSA9IHN0YXRlLnRoZW1lIG9yICdzZXJpZidcblxuICAjd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ2hhc2hjaGFuZ2UnLCBzZXRTdGF0ZVxuXG4gIG1vZGVsID1cbiAgICBzaG93OiAodikgLT4gaWYgdiB0aGVuICcnIGVsc2UgJ2hpZGUnXG4gICAgaGlkZTogKHYpIC0+IGlmIHYgdGhlbiAnaGlkZScgZWxzZSAnJ1xuICAgIHNob3dEb3dubG9hZDogQmxvYj9cbiAgICBkb3dubG9hZDogLT5cbiAgICAgIHNhdmVBcyBuZXcgQmxvYihbZWRpdG9yLmdldFZhbHVlKCldLCB0eXBlOiAndGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04JyksXG4gICAgICAgIGRvY1RpdGxlKCkrJy5tZCdcbiAgICBsaW5rQjY0OiAtPlxuICAgICAgdXBkYXRlU3RhdHVzKClcbiAgICAgIHByb21wdCAnQ29weSB0aGlzJywgbG9jYXRpb24uaHJlZlxuICAgICAgI21vZGVsLmxpbmtDb3B5ID0gbG9jYXRpb24uaHJlZlxuICAgICAgI21vZGVsLnNob3dMaW5rQ29weSA9IHRydWVcbiAgICAgICMuZm9jdXMoKVxuICAgICAgIy5ibHVyIC0+ICQoQCkuYWRkQ2xhc3MoJ2hpZGRlbicpXG4gICAgcHJpbnQ6IC0+IHdpbmRvdy5wcmludCgpXG4gICAgbW9kZTogJydcbiAgICB0b2dnbGVUb2M6IC0+IHN0YXRlLnRvYyA9IG5vdCBzdGF0ZS50b2NcbiAgICB0b2dnbGVJbmRleDogLT4gc3RhdGUuaW5kZXggPSBub3Qgc3RhdGUuaW5kZXhcbiAgICBleHBhbmRJbnB1dDogLT5cbiAgICAgIHN0YXRlLm1vZGUgPSAoaWYgc3RhdGUubW9kZSB0aGVuICcnIGVsc2UgJ3dyaXRlJylcbiAgICBleHBhbmRWaWV3OiAtPlxuICAgICAgc3RhdGUubW9kZSA9IChpZiBzdGF0ZS5tb2RlIHRoZW4gJycgZWxzZSAncmVhZCcpXG4gICAgbW91c2VvdXQ6IChlKSAtPlxuICAgICAgZnJvbSA9IGUucmVsYXRlZFRhcmdldCBvciBlLnRvRWxlbWVudFxuICAgICAgdXBkYXRlU3RhdHVzKCkgaWYgbm90IGZyb20gb3IgZnJvbS5ub2RlTmFtZSBpcyAnSFRNTCdcbiAgICBrZXlwcmVzczogKGUpIC0+XG4gICAgICBpZiBlLmN0cmxLZXkgYW5kIGUuYWx0S2V5XG4gICAgICAgIGlmIGUua2V5Q29kZSBpcyAyNCAjIGN0cmwrYWx0K3hcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gJ3dyaXRlJ1xuICAgICAgICBlbHNlIGlmIGUua2V5Q29kZSBpcyAzICMgY3RybCthbHQrY1xuICAgICAgICAgIHN0YXRlLm1vZGUgPSAnJ1xuICAgICAgICBlbHNlIGlmIGUua2V5Q29kZSBpcyAyMiAjIGN0cmwrYWx0K3ZcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gJ3JlYWQnXG5cbiAgc3RhdGVfLnJlc3RvcmUgbnVsbCwgbnVsbCwgc2V0U3RhdGVcbiAgc3RhdGVfLm9uICdyZXN0b3JlJywgc2V0U3RhdGVcblxuICBzaG93RG5kID0gbm8gaWYgbm90IGVkaXRvci5nZXRWYWx1ZSgpXG4gICMkKCcjaW5wdXQtd3JhcCcpLm9uZSAnY2xpY2snLCAtPiAkKCcjZHJhZy1uLWRyb3Atd3JhcCcpLnJlbW92ZSgpXG5cbiAgdml4ZW4oZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlLCBtb2RlbClcblxuICB1cGRhdGVWaWV3KClcbiAgI3VwZGF0ZVN0YXR1cygpXG4iLCIoZnVuY3Rpb24oKXsvL1xuLy8gc2hvd2Rvd24uanMgLS0gQSBqYXZhc2NyaXB0IHBvcnQgb2YgTWFya2Rvd24uXG4vL1xuLy8gQ29weXJpZ2h0IChjKSAyMDA3IEpvaG4gRnJhc2VyLlxuLy9cbi8vIE9yaWdpbmFsIE1hcmtkb3duIENvcHlyaWdodCAoYykgMjAwNC0yMDA1IEpvaG4gR3J1YmVyXG4vLyAgIDxodHRwOi8vZGFyaW5nZmlyZWJhbGwubmV0L3Byb2plY3RzL21hcmtkb3duLz5cbi8vXG4vLyBSZWRpc3RyaWJ1dGFibGUgdW5kZXIgYSBCU0Qtc3R5bGUgb3BlbiBzb3VyY2UgbGljZW5zZS5cbi8vIFNlZSBsaWNlbnNlLnR4dCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbi8vXG4vLyBUaGUgZnVsbCBzb3VyY2UgZGlzdHJpYnV0aW9uIGlzIGF0OlxuLy9cbi8vXHRcdFx0XHRBIEEgTFxuLy9cdFx0XHRcdFQgQyBBXG4vL1x0XHRcdFx0VCBLIEJcbi8vXG4vLyAgIDxodHRwOi8vd3d3LmF0dGFja2xhYi5uZXQvPlxuLy9cblxuLy9cbi8vIFdoZXJldmVyIHBvc3NpYmxlLCBTaG93ZG93biBpcyBhIHN0cmFpZ2h0LCBsaW5lLWJ5LWxpbmUgcG9ydFxuLy8gb2YgdGhlIFBlcmwgdmVyc2lvbiBvZiBNYXJrZG93bi5cbi8vXG4vLyBUaGlzIGlzIG5vdCBhIG5vcm1hbCBwYXJzZXIgZGVzaWduOyBpdCdzIGJhc2ljYWxseSBqdXN0IGFcbi8vIHNlcmllcyBvZiBzdHJpbmcgc3Vic3RpdHV0aW9ucy4gIEl0J3MgaGFyZCB0byByZWFkIGFuZFxuLy8gbWFpbnRhaW4gdGhpcyB3YXksICBidXQga2VlcGluZyBTaG93ZG93biBjbG9zZSB0byB0aGUgb3JpZ2luYWxcbi8vIGRlc2lnbiBtYWtlcyBpdCBlYXNpZXIgdG8gcG9ydCBuZXcgZmVhdHVyZXMuXG4vL1xuLy8gTW9yZSBpbXBvcnRhbnRseSwgU2hvd2Rvd24gYmVoYXZlcyBsaWtlIG1hcmtkb3duLnBsIGluIG1vc3Rcbi8vIGVkZ2UgY2FzZXMuICBTbyB3ZWIgYXBwbGljYXRpb25zIGNhbiBkbyBjbGllbnQtc2lkZSBwcmV2aWV3XG4vLyBpbiBKYXZhc2NyaXB0LCBhbmQgdGhlbiBidWlsZCBpZGVudGljYWwgSFRNTCBvbiB0aGUgc2VydmVyLlxuLy9cbi8vIFRoaXMgcG9ydCBuZWVkcyB0aGUgbmV3IFJlZ0V4cCBmdW5jdGlvbmFsaXR5IG9mIEVDTUEgMjYyLFxuLy8gM3JkIEVkaXRpb24gKGkuZS4gSmF2YXNjcmlwdCAxLjUpLiAgTW9zdCBtb2Rlcm4gd2ViIGJyb3dzZXJzXG4vLyBzaG91bGQgZG8gZmluZS4gIEV2ZW4gd2l0aCB0aGUgbmV3IHJlZ3VsYXIgZXhwcmVzc2lvbiBmZWF0dXJlcyxcbi8vIFdlIGRvIGEgbG90IG9mIHdvcmsgdG8gZW11bGF0ZSBQZXJsJ3MgcmVnZXggZnVuY3Rpb25hbGl0eS5cbi8vIFRoZSB0cmlja3kgY2hhbmdlcyBpbiB0aGlzIGZpbGUgbW9zdGx5IGhhdmUgdGhlIFwiYXR0YWNrbGFiOlwiXG4vLyBsYWJlbC4gIE1ham9yIG9yIHNlbGYtZXhwbGFuYXRvcnkgY2hhbmdlcyBkb24ndC5cbi8vXG4vLyBTbWFydCBkaWZmIHRvb2xzIGxpa2UgQXJheGlzIE1lcmdlIHdpbGwgYmUgYWJsZSB0byBtYXRjaCB1cFxuLy8gdGhpcyBmaWxlIHdpdGggbWFya2Rvd24ucGwgaW4gYSB1c2VmdWwgd2F5LiAgQSBsaXR0bGUgdHdlYWtpbmdcbi8vIGhlbHBzOiBpbiBhIGNvcHkgb2YgbWFya2Rvd24ucGwsIHJlcGxhY2UgXCIjXCIgd2l0aCBcIi8vXCIgYW5kXG4vLyByZXBsYWNlIFwiJHRleHRcIiB3aXRoIFwidGV4dFwiLiAgQmUgc3VyZSB0byBpZ25vcmUgd2hpdGVzcGFjZVxuLy8gYW5kIGxpbmUgZW5kaW5ncy5cbi8vXG5cblxuLy9cbi8vIFNob3dkb3duIHVzYWdlOlxuLy9cbi8vICAgdmFyIHRleHQgPSBcIk1hcmtkb3duICpyb2NrcyouXCI7XG4vL1xuLy8gICB2YXIgY29udmVydGVyID0gbmV3IFNob3dkb3duLmNvbnZlcnRlcigpO1xuLy8gICB2YXIgaHRtbCA9IGNvbnZlcnRlci5tYWtlSHRtbCh0ZXh0KTtcbi8vXG4vLyAgIGFsZXJ0KGh0bWwpO1xuLy9cbi8vIE5vdGU6IG1vdmUgdGhlIHNhbXBsZSBjb2RlIHRvIHRoZSBib3R0b20gb2YgdGhpc1xuLy8gZmlsZSBiZWZvcmUgdW5jb21tZW50aW5nIGl0LlxuLy9cblxuXG4vL1xuLy8gU2hvd2Rvd24gbmFtZXNwYWNlXG4vL1xudmFyIFNob3dkb3duID0ge307XG5cbi8vXG4vLyBjb252ZXJ0ZXJcbi8vXG4vLyBXcmFwcyBhbGwgXCJnbG9iYWxzXCIgc28gdGhhdCB0aGUgb25seSB0aGluZ1xuLy8gZXhwb3NlZCBpcyBtYWtlSHRtbCgpLlxuLy9cblNob3dkb3duLmNvbnZlcnRlciA9IGZ1bmN0aW9uKCkge1xuXG4vL1xuLy8gR2xvYmFsczpcbi8vXG5cbi8vIEdsb2JhbCBoYXNoZXMsIHVzZWQgYnkgdmFyaW91cyB1dGlsaXR5IHJvdXRpbmVzXG52YXIgZ191cmxzO1xudmFyIGdfdGl0bGVzO1xudmFyIGdfaHRtbF9ibG9ja3M7XG5cbi8vIFVzZWQgdG8gdHJhY2sgd2hlbiB3ZSdyZSBpbnNpZGUgYW4gb3JkZXJlZCBvciB1bm9yZGVyZWQgbGlzdFxuLy8gKHNlZSBfUHJvY2Vzc0xpc3RJdGVtcygpIGZvciBkZXRhaWxzKTpcbnZhciBnX2xpc3RfbGV2ZWwgPSAwO1xuXG5cbnRoaXMubWFrZUh0bWwgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gTWFpbiBmdW5jdGlvbi4gVGhlIG9yZGVyIGluIHdoaWNoIG90aGVyIHN1YnMgYXJlIGNhbGxlZCBoZXJlIGlzXG4vLyBlc3NlbnRpYWwuIExpbmsgYW5kIGltYWdlIHN1YnN0aXR1dGlvbnMgbmVlZCB0byBoYXBwZW4gYmVmb3JlXG4vLyBfRXNjYXBlU3BlY2lhbENoYXJzV2l0aGluVGFnQXR0cmlidXRlcygpLCBzbyB0aGF0IGFueSAqJ3Mgb3IgXydzIGluIHRoZSA8YT5cbi8vIGFuZCA8aW1nPiB0YWdzIGdldCBlbmNvZGVkLlxuLy9cblxuXHQvLyBDbGVhciB0aGUgZ2xvYmFsIGhhc2hlcy4gSWYgd2UgZG9uJ3QgY2xlYXIgdGhlc2UsIHlvdSBnZXQgY29uZmxpY3RzXG5cdC8vIGZyb20gb3RoZXIgYXJ0aWNsZXMgd2hlbiBnZW5lcmF0aW5nIGEgcGFnZSB3aGljaCBjb250YWlucyBtb3JlIHRoYW5cblx0Ly8gb25lIGFydGljbGUgKGUuZy4gYW4gaW5kZXggcGFnZSB0aGF0IHNob3dzIHRoZSBOIG1vc3QgcmVjZW50XG5cdC8vIGFydGljbGVzKTpcblx0Z191cmxzID0gbmV3IEFycmF5KCk7XG5cdGdfdGl0bGVzID0gbmV3IEFycmF5KCk7XG5cdGdfaHRtbF9ibG9ja3MgPSBuZXcgQXJyYXkoKTtcblxuXHQvLyBhdHRhY2tsYWI6IFJlcGxhY2UgfiB3aXRoIH5UXG5cdC8vIFRoaXMgbGV0cyB1cyB1c2UgdGlsZGUgYXMgYW4gZXNjYXBlIGNoYXIgdG8gYXZvaWQgbWQ1IGhhc2hlc1xuXHQvLyBUaGUgY2hvaWNlIG9mIGNoYXJhY3RlciBpcyBhcmJpdHJheTsgYW55dGhpbmcgdGhhdCBpc24ndFxuICAgIC8vIG1hZ2ljIGluIE1hcmtkb3duIHdpbGwgd29yay5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfi9nLFwiflRcIik7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXBsYWNlICQgd2l0aCB+RFxuXHQvLyBSZWdFeHAgaW50ZXJwcmV0cyAkIGFzIGEgc3BlY2lhbCBjaGFyYWN0ZXJcblx0Ly8gd2hlbiBpdCdzIGluIGEgcmVwbGFjZW1lbnQgc3RyaW5nXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcJC9nLFwifkRcIik7XG5cblx0Ly8gU3RhbmRhcmRpemUgbGluZSBlbmRpbmdzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcclxcbi9nLFwiXFxuXCIpOyAvLyBET1MgdG8gVW5peFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHIvZyxcIlxcblwiKTsgLy8gTWFjIHRvIFVuaXhcblxuXHQvLyBNYWtlIHN1cmUgdGV4dCBiZWdpbnMgYW5kIGVuZHMgd2l0aCBhIGNvdXBsZSBvZiBuZXdsaW5lczpcblx0dGV4dCA9IFwiXFxuXFxuXCIgKyB0ZXh0ICsgXCJcXG5cXG5cIjtcblxuXHQvLyBDb252ZXJ0IGFsbCB0YWJzIHRvIHNwYWNlcy5cblx0dGV4dCA9IF9EZXRhYih0ZXh0KTtcblxuXHQvLyBTdHJpcCBhbnkgbGluZXMgY29uc2lzdGluZyBvbmx5IG9mIHNwYWNlcyBhbmQgdGFicy5cblx0Ly8gVGhpcyBtYWtlcyBzdWJzZXF1ZW50IHJlZ2V4ZW4gZWFzaWVyIHRvIHdyaXRlLCBiZWNhdXNlIHdlIGNhblxuXHQvLyBtYXRjaCBjb25zZWN1dGl2ZSBibGFuayBsaW5lcyB3aXRoIC9cXG4rLyBpbnN0ZWFkIG9mIHNvbWV0aGluZ1xuXHQvLyBjb250b3J0ZWQgbGlrZSAvWyBcXHRdKlxcbisvIC5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXFx0XSskL21nLFwiXCIpO1xuXG5cdC8vIEhhbmRsZSBnaXRodWIgY29kZWJsb2NrcyBwcmlvciB0byBydW5uaW5nIEhhc2hIVE1MIHNvIHRoYXRcblx0Ly8gSFRNTCBjb250YWluZWQgd2l0aGluIHRoZSBjb2RlYmxvY2sgZ2V0cyBlc2NhcGVkIHByb3BlcnRseVxuXHR0ZXh0ID0gX0RvR2l0aHViQ29kZUJsb2Nrcyh0ZXh0KTtcblxuXHQvLyBUdXJuIGJsb2NrLWxldmVsIEhUTUwgYmxvY2tzIGludG8gaGFzaCBlbnRyaWVzXG5cdHRleHQgPSBfSGFzaEhUTUxCbG9ja3ModGV4dCk7XG5cblx0Ly8gU3RyaXAgbGluayBkZWZpbml0aW9ucywgc3RvcmUgaW4gaGFzaGVzLlxuXHR0ZXh0ID0gX1N0cmlwTGlua0RlZmluaXRpb25zKHRleHQpO1xuXG5cdHRleHQgPSBfUnVuQmxvY2tHYW11dCh0ZXh0KTtcblxuXHR0ZXh0ID0gX1VuZXNjYXBlU3BlY2lhbENoYXJzKHRleHQpO1xuXG5cdC8vIGF0dGFja2xhYjogUmVzdG9yZSBkb2xsYXIgc2lnbnNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkQvZyxcIiQkXCIpO1xuXG5cdC8vIGF0dGFja2xhYjogUmVzdG9yZSB0aWxkZXNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvflQvZyxcIn5cIik7XG5cblx0cmV0dXJuIHRleHQ7XG59O1xuXG5cbnZhciBfU3RyaXBMaW5rRGVmaW5pdGlvbnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gU3RyaXBzIGxpbmsgZGVmaW5pdGlvbnMgZnJvbSB0ZXh0LCBzdG9yZXMgdGhlIFVSTHMgYW5kIHRpdGxlcyBpblxuLy8gaGFzaCByZWZlcmVuY2VzLlxuLy9cblxuXHQvLyBMaW5rIGRlZnMgYXJlIGluIHRoZSBmb3JtOiBeW2lkXTogdXJsIFwib3B0aW9uYWwgdGl0bGVcIlxuXG5cdC8qXG5cdFx0dmFyIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0XHReWyBdezAsM31cXFsoLispXFxdOiAgLy8gaWQgPSAkMSAgYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdFx0ICBbIFxcdF0qXG5cdFx0XHRcdCAgXFxuP1x0XHRcdFx0Ly8gbWF5YmUgKm9uZSogbmV3bGluZVxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0PD8oXFxTKz8pPj9cdFx0XHQvLyB1cmwgPSAkMlxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0ICBcXG4/XHRcdFx0XHQvLyBtYXliZSBvbmUgbmV3bGluZVxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0KD86XG5cdFx0XHRcdCAgKFxcbiopXHRcdFx0XHQvLyBhbnkgbGluZXMgc2tpcHBlZCA9ICQzIGF0dGFja2xhYjogbG9va2JlaGluZCByZW1vdmVkXG5cdFx0XHRcdCAgW1wiKF1cblx0XHRcdFx0ICAoLis/KVx0XHRcdFx0Ly8gdGl0bGUgPSAkNFxuXHRcdFx0XHQgIFtcIildXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQpP1x0XHRcdFx0XHQvLyB0aXRsZSBpcyBvcHRpb25hbFxuXHRcdFx0XHQoPzpcXG4rfCQpXG5cdFx0XHQgIC9nbSxcblx0XHRcdCAgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblx0dmFyIHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwzfVxcWyguKylcXF06WyBcXHRdKlxcbj9bIFxcdF0qPD8oXFxTKz8pPj9bIFxcdF0qXFxuP1sgXFx0XSooPzooXFxuKilbXCIoXSguKz8pW1wiKV1bIFxcdF0qKT8oPzpcXG4rfFxcWikvZ20sXG5cdFx0ZnVuY3Rpb24gKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQpIHtcblx0XHRcdG0xID0gbTEudG9Mb3dlckNhc2UoKTtcblx0XHRcdGdfdXJsc1ttMV0gPSBfRW5jb2RlQW1wc0FuZEFuZ2xlcyhtMik7ICAvLyBMaW5rIElEcyBhcmUgY2FzZS1pbnNlbnNpdGl2ZVxuXHRcdFx0aWYgKG0zKSB7XG5cdFx0XHRcdC8vIE9vcHMsIGZvdW5kIGJsYW5rIGxpbmVzLCBzbyBpdCdzIG5vdCBhIHRpdGxlLlxuXHRcdFx0XHQvLyBQdXQgYmFjayB0aGUgcGFyZW50aGV0aWNhbCBzdGF0ZW1lbnQgd2Ugc3RvbGUuXG5cdFx0XHRcdHJldHVybiBtMyttNDtcblx0XHRcdH0gZWxzZSBpZiAobTQpIHtcblx0XHRcdFx0Z190aXRsZXNbbTFdID0gbTQucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ29tcGxldGVseSByZW1vdmUgdGhlIGRlZmluaXRpb24gZnJvbSB0aGUgdGV4dFxuXHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0fVxuXHQpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfSGFzaEhUTUxCbG9ja3MgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdC8vIGF0dGFja2xhYjogRG91YmxlIHVwIGJsYW5rIGxpbmVzIHRvIHJlZHVjZSBsb29rYXJvdW5kXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcbi9nLFwiXFxuXFxuXCIpO1xuXG5cdC8vIEhhc2hpZnkgSFRNTCBibG9ja3M6XG5cdC8vIFdlIG9ubHkgd2FudCB0byBkbyB0aGlzIGZvciBibG9jay1sZXZlbCBIVE1MIHRhZ3MsIHN1Y2ggYXMgaGVhZGVycyxcblx0Ly8gbGlzdHMsIGFuZCB0YWJsZXMuIFRoYXQncyBiZWNhdXNlIHdlIHN0aWxsIHdhbnQgdG8gd3JhcCA8cD5zIGFyb3VuZFxuXHQvLyBcInBhcmFncmFwaHNcIiB0aGF0IGFyZSB3cmFwcGVkIGluIG5vbi1ibG9jay1sZXZlbCB0YWdzLCBzdWNoIGFzIGFuY2hvcnMsXG5cdC8vIHBocmFzZSBlbXBoYXNpcywgYW5kIHNwYW5zLiBUaGUgbGlzdCBvZiB0YWdzIHdlJ3JlIGxvb2tpbmcgZm9yIGlzXG5cdC8vIGhhcmQtY29kZWQ6XG5cdHZhciBibG9ja190YWdzX2EgPSBcInB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxpbnN8ZGVsfHN0eWxlfHNlY3Rpb258aGVhZGVyfGZvb3RlcnxuYXZ8YXJ0aWNsZXxhc2lkZVwiO1xuXHR2YXIgYmxvY2tfdGFnc19iID0gXCJwfGRpdnxoWzEtNl18YmxvY2txdW90ZXxwcmV8dGFibGV8ZGx8b2x8dWx8c2NyaXB0fG5vc2NyaXB0fGZvcm18ZmllbGRzZXR8aWZyYW1lfG1hdGh8c3R5bGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyfG5hdnxhcnRpY2xlfGFzaWRlXCI7XG5cblx0Ly8gRmlyc3QsIGxvb2sgZm9yIG5lc3RlZCBibG9ja3MsIGUuZy46XG5cdC8vICAgPGRpdj5cblx0Ly8gICAgIDxkaXY+XG5cdC8vICAgICB0YWdzIGZvciBpbm5lciBibG9jayBtdXN0IGJlIGluZGVudGVkLlxuXHQvLyAgICAgPC9kaXY+XG5cdC8vICAgPC9kaXY+XG5cdC8vXG5cdC8vIFRoZSBvdXRlcm1vc3QgdGFncyBtdXN0IHN0YXJ0IGF0IHRoZSBsZWZ0IG1hcmdpbiBmb3IgdGhpcyB0byBtYXRjaCwgYW5kXG5cdC8vIHRoZSBpbm5lciBuZXN0ZWQgZGl2cyBtdXN0IGJlIGluZGVudGVkLlxuXHQvLyBXZSBuZWVkIHRvIGRvIHRoaXMgYmVmb3JlIHRoZSBuZXh0LCBtb3JlIGxpYmVyYWwgbWF0Y2gsIGJlY2F1c2UgdGhlIG5leHRcblx0Ly8gbWF0Y2ggd2lsbCBzdGFydCBhdCB0aGUgZmlyc3QgYDxkaXY+YCBhbmQgc3RvcCBhdCB0aGUgZmlyc3QgYDwvZGl2PmAuXG5cblx0Ly8gYXR0YWNrbGFiOiBUaGlzIHJlZ2V4IGNhbiBiZSBleHBlbnNpdmUgd2hlbiBpdCBmYWlscy5cblx0Lypcblx0XHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdF5cdFx0XHRcdFx0Ly8gc3RhcnQgb2YgbGluZSAgKHdpdGggL20pXG5cdFx0XHQ8KCRibG9ja190YWdzX2EpXHQvLyBzdGFydCB0YWcgPSAkMlxuXHRcdFx0XFxiXHRcdFx0XHRcdC8vIHdvcmQgYnJlYWtcblx0XHRcdFx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IGhhY2sgYXJvdW5kIGtodG1sL3BjcmUgYnVnLi4uXG5cdFx0XHRbXlxccl0qP1xcblx0XHRcdC8vIGFueSBudW1iZXIgb2YgbGluZXMsIG1pbmltYWxseSBtYXRjaGluZ1xuXHRcdFx0PC9cXDI+XHRcdFx0XHQvLyB0aGUgbWF0Y2hpbmcgZW5kIHRhZ1xuXHRcdFx0WyBcXHRdKlx0XHRcdFx0Ly8gdHJhaWxpbmcgc3BhY2VzL3RhYnNcblx0XHRcdCg/PVxcbispXHRcdFx0XHQvLyBmb2xsb3dlZCBieSBhIG5ld2xpbmVcblx0XHQpXHRcdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB0aGVyZSBhcmUgc2VudGluZWwgbmV3bGluZXMgYXQgZW5kIG9mIGRvY3VtZW50XG5cdFx0L2dtLGZ1bmN0aW9uKCl7Li4ufX07XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oPChwfGRpdnxoWzEtNl18YmxvY2txdW90ZXxwcmV8dGFibGV8ZGx8b2x8dWx8c2NyaXB0fG5vc2NyaXB0fGZvcm18ZmllbGRzZXR8aWZyYW1lfG1hdGh8aW5zfGRlbClcXGJbXlxccl0qP1xcbjxcXC9cXDI+WyBcXHRdKig/PVxcbispKS9nbSxoYXNoRWxlbWVudCk7XG5cblx0Ly9cblx0Ly8gTm93IG1hdGNoIG1vcmUgbGliZXJhbGx5LCBzaW1wbHkgZnJvbSBgXFxuPHRhZz5gIHRvIGA8L3RhZz5cXG5gXG5cdC8vXG5cblx0Lypcblx0XHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdF5cdFx0XHRcdFx0Ly8gc3RhcnQgb2YgbGluZSAgKHdpdGggL20pXG5cdFx0XHQ8KCRibG9ja190YWdzX2IpXHQvLyBzdGFydCB0YWcgPSAkMlxuXHRcdFx0XFxiXHRcdFx0XHRcdC8vIHdvcmQgYnJlYWtcblx0XHRcdFx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IGhhY2sgYXJvdW5kIGtodG1sL3BjcmUgYnVnLi4uXG5cdFx0XHRbXlxccl0qP1x0XHRcdFx0Ly8gYW55IG51bWJlciBvZiBsaW5lcywgbWluaW1hbGx5IG1hdGNoaW5nXG5cdFx0XHQuKjwvXFwyPlx0XHRcdFx0Ly8gdGhlIG1hdGNoaW5nIGVuZCB0YWdcblx0XHRcdFsgXFx0XSpcdFx0XHRcdC8vIHRyYWlsaW5nIHNwYWNlcy90YWJzXG5cdFx0XHQoPz1cXG4rKVx0XHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBuZXdsaW5lXG5cdFx0KVx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogdGhlcmUgYXJlIHNlbnRpbmVsIG5ld2xpbmVzIGF0IGVuZCBvZiBkb2N1bWVudFxuXHRcdC9nbSxmdW5jdGlvbigpey4uLn19O1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKDwocHxkaXZ8aFsxLTZdfGJsb2NrcXVvdGV8cHJlfHRhYmxlfGRsfG9sfHVsfHNjcmlwdHxub3NjcmlwdHxmb3JtfGZpZWxkc2V0fGlmcmFtZXxtYXRofHN0eWxlfHNlY3Rpb258aGVhZGVyfGZvb3RlcnxuYXZ8YXJ0aWNsZXxhc2lkZSlcXGJbXlxccl0qPy4qPFxcL1xcMj5bIFxcdF0qKD89XFxuKylcXG4pL2dtLGhhc2hFbGVtZW50KTtcblxuXHQvLyBTcGVjaWFsIGNhc2UganVzdCBmb3IgPGhyIC8+LiBJdCB3YXMgZWFzaWVyIHRvIG1ha2UgYSBzcGVjaWFsIGNhc2UgdGhhblxuXHQvLyB0byBtYWtlIHRoZSBvdGhlciByZWdleCBtb3JlIGNvbXBsaWNhdGVkLlxuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdFxcblxcblx0XHRcdFx0Ly8gU3RhcnRpbmcgYWZ0ZXIgYSBibGFuayBsaW5lXG5cdFx0XHRbIF17MCwzfVxuXHRcdFx0KDwoaHIpXHRcdFx0XHQvLyBzdGFydCB0YWcgPSAkMlxuXHRcdFx0XFxiXHRcdFx0XHRcdC8vIHdvcmQgYnJlYWtcblx0XHRcdChbXjw+XSkqP1x0XHRcdC8vXG5cdFx0XHRcXC8/PilcdFx0XHRcdC8vIHRoZSBtYXRjaGluZyBlbmQgdGFnXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoPz1cXG57Mix9KVx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgYmxhbmsgbGluZVxuXHRcdClcblx0XHQvZyxoYXNoRWxlbWVudCk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXG5bIF17MCwzfSg8KGhyKVxcYihbXjw+XSkqP1xcLz8+KVsgXFx0XSooPz1cXG57Mix9KSkvZyxoYXNoRWxlbWVudCk7XG5cblx0Ly8gU3BlY2lhbCBjYXNlIGZvciBzdGFuZGFsb25lIEhUTUwgY29tbWVudHM6XG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0XFxuXFxuXHRcdFx0XHQvLyBTdGFydGluZyBhZnRlciBhIGJsYW5rIGxpbmVcblx0XHRcdFsgXXswLDN9XHRcdFx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdDwhXG5cdFx0XHQoLS1bXlxccl0qPy0tXFxzKikrXG5cdFx0XHQ+XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoPz1cXG57Mix9KVx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgYmxhbmsgbGluZVxuXHRcdClcblx0XHQvZyxoYXNoRWxlbWVudCk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXG5cXG5bIF17MCwzfTwhKC0tW15cXHJdKj8tLVxccyopKz5bIFxcdF0qKD89XFxuezIsfSkpL2csaGFzaEVsZW1lbnQpO1xuXG5cdC8vIFBIUCBhbmQgQVNQLXN0eWxlIHByb2Nlc3NvciBpbnN0cnVjdGlvbnMgKDw/Li4uPz4gYW5kIDwlLi4uJT4pXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoPzpcblx0XHRcdFxcblxcblx0XHRcdFx0Ly8gU3RhcnRpbmcgYWZ0ZXIgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdChcdFx0XHRcdFx0XHQvLyBzYXZlIGluICQxXG5cdFx0XHRbIF17MCwzfVx0XHRcdC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGggLSAxXG5cdFx0XHQoPzpcblx0XHRcdFx0PChbPyVdKVx0XHRcdC8vICQyXG5cdFx0XHRcdFteXFxyXSo/XG5cdFx0XHRcdFxcMj5cblx0XHRcdClcblx0XHRcdFsgXFx0XSpcblx0XHRcdCg/PVxcbnsyLH0pXHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdC9nLGhhc2hFbGVtZW50KTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKD86XFxuXFxuKShbIF17MCwzfSg/OjwoWz8lXSlbXlxccl0qP1xcMj4pWyBcXHRdKig/PVxcbnsyLH0pKS9nLGhhc2hFbGVtZW50KTtcblxuXHQvLyBhdHRhY2tsYWI6IFVuZG8gZG91YmxlIGxpbmVzIChzZWUgY29tbWVudCBhdCB0b3Agb2YgdGhpcyBmdW5jdGlvbilcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxuXFxuL2csXCJcXG5cIik7XG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgaGFzaEVsZW1lbnQgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdHZhciBibG9ja1RleHQgPSBtMTtcblxuXHQvLyBVbmRvIGRvdWJsZSBsaW5lc1xuXHRibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFxuXFxuL2csXCJcXG5cIik7XG5cdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9eXFxuLyxcIlwiKTtcblxuXHQvLyBzdHJpcCB0cmFpbGluZyBibGFuayBsaW5lc1xuXHRibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTtcblxuXHQvLyBSZXBsYWNlIHRoZSBlbGVtZW50IHRleHQgd2l0aCBhIG1hcmtlciAoXCJ+S3hLXCIgd2hlcmUgeCBpcyBpdHMga2V5KVxuXHRibG9ja1RleHQgPSBcIlxcblxcbn5LXCIgKyAoZ19odG1sX2Jsb2Nrcy5wdXNoKGJsb2NrVGV4dCktMSkgKyBcIktcXG5cXG5cIjtcblxuXHRyZXR1cm4gYmxvY2tUZXh0O1xufTtcblxudmFyIF9SdW5CbG9ja0dhbXV0ID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFRoZXNlIGFyZSBhbGwgdGhlIHRyYW5zZm9ybWF0aW9ucyB0aGF0IGZvcm0gYmxvY2stbGV2ZWxcbi8vIHRhZ3MgbGlrZSBwYXJhZ3JhcGhzLCBoZWFkZXJzLCBhbmQgbGlzdCBpdGVtcy5cbi8vXG5cdHRleHQgPSBfRG9IZWFkZXJzKHRleHQpO1xuXG5cdC8vIERvIEhvcml6b250YWwgUnVsZXM6XG5cdHZhciBrZXkgPSBoYXNoQmxvY2soXCI8aHIgLz5cIik7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwyfShbIF0/XFwqWyBdPyl7Myx9WyBcXHRdKiQvZ20sa2V5KTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXC1bIF0/KXszLH1bIFxcdF0qJC9nbSxrZXkpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBdezAsMn0oWyBdP1xcX1sgXT8pezMsfVsgXFx0XSokL2dtLGtleSk7XG5cblx0dGV4dCA9IF9Eb0xpc3RzKHRleHQpO1xuXHR0ZXh0ID0gX0RvQ29kZUJsb2Nrcyh0ZXh0KTtcblx0dGV4dCA9IF9Eb0Jsb2NrUXVvdGVzKHRleHQpO1xuXG5cdC8vIFdlIGFscmVhZHkgcmFuIF9IYXNoSFRNTEJsb2NrcygpIGJlZm9yZSwgaW4gTWFya2Rvd24oKSwgYnV0IHRoYXRcblx0Ly8gd2FzIHRvIGVzY2FwZSByYXcgSFRNTCBpbiB0aGUgb3JpZ2luYWwgTWFya2Rvd24gc291cmNlLiBUaGlzIHRpbWUsXG5cdC8vIHdlJ3JlIGVzY2FwaW5nIHRoZSBtYXJrdXAgd2UndmUganVzdCBjcmVhdGVkLCBzbyB0aGF0IHdlIGRvbid0IHdyYXBcblx0Ly8gPHA+IHRhZ3MgYXJvdW5kIGJsb2NrLWxldmVsIHRhZ3MuXG5cdHRleHQgPSBfSGFzaEhUTUxCbG9ja3ModGV4dCk7XG5cdHRleHQgPSBfRm9ybVBhcmFncmFwaHModGV4dCk7XG5cblx0cmV0dXJuIHRleHQ7XG59O1xuXG5cbnZhciBfUnVuU3BhbkdhbXV0ID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFRoZXNlIGFyZSBhbGwgdGhlIHRyYW5zZm9ybWF0aW9ucyB0aGF0IG9jY3VyICp3aXRoaW4qIGJsb2NrLWxldmVsXG4vLyB0YWdzIGxpa2UgcGFyYWdyYXBocywgaGVhZGVycywgYW5kIGxpc3QgaXRlbXMuXG4vL1xuXG5cdHRleHQgPSBfRG9Db2RlU3BhbnModGV4dCk7XG5cdHRleHQgPSBfRXNjYXBlU3BlY2lhbENoYXJzV2l0aGluVGFnQXR0cmlidXRlcyh0ZXh0KTtcblx0dGV4dCA9IF9FbmNvZGVCYWNrc2xhc2hFc2NhcGVzKHRleHQpO1xuXG5cdC8vIFByb2Nlc3MgYW5jaG9yIGFuZCBpbWFnZSB0YWdzLiBJbWFnZXMgbXVzdCBjb21lIGZpcnN0LFxuXHQvLyBiZWNhdXNlICFbZm9vXVtmXSBsb29rcyBsaWtlIGFuIGFuY2hvci5cblx0dGV4dCA9IF9Eb0ltYWdlcyh0ZXh0KTtcblx0dGV4dCA9IF9Eb0FuY2hvcnModGV4dCk7XG5cblx0Ly8gTWFrZSBsaW5rcyBvdXQgb2YgdGhpbmdzIGxpa2UgYDxodHRwOi8vZXhhbXBsZS5jb20vPmBcblx0Ly8gTXVzdCBjb21lIGFmdGVyIF9Eb0FuY2hvcnMoKSwgYmVjYXVzZSB5b3UgY2FuIHVzZSA8IGFuZCA+XG5cdC8vIGRlbGltaXRlcnMgaW4gaW5saW5lIGxpbmtzIGxpa2UgW3RoaXNdKDx1cmw+KS5cblx0dGV4dCA9IF9Eb0F1dG9MaW5rcyh0ZXh0KTtcblx0dGV4dCA9IF9FbmNvZGVBbXBzQW5kQW5nbGVzKHRleHQpO1xuXHR0ZXh0ID0gX0RvSXRhbGljc0FuZEJvbGQodGV4dCk7XG5cblx0Ly8gRG8gaGFyZCBicmVha3M6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyAgK1xcbi9nLFwiIDxiciAvPlxcblwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIF9Fc2NhcGVTcGVjaWFsQ2hhcnNXaXRoaW5UYWdBdHRyaWJ1dGVzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFdpdGhpbiB0YWdzIC0tIG1lYW5pbmcgYmV0d2VlbiA8IGFuZCA+IC0tIGVuY29kZSBbXFwgYCAqIF9dIHNvIHRoZXlcbi8vIGRvbid0IGNvbmZsaWN0IHdpdGggdGhlaXIgdXNlIGluIE1hcmtkb3duIGZvciBjb2RlLCBpdGFsaWNzIGFuZCBzdHJvbmcuXG4vL1xuXG5cdC8vIEJ1aWxkIGEgcmVnZXggdG8gZmluZCBIVE1MIHRhZ3MgYW5kIGNvbW1lbnRzLiAgU2VlIEZyaWVkbCdzXG5cdC8vIFwiTWFzdGVyaW5nIFJlZ3VsYXIgRXhwcmVzc2lvbnNcIiwgMm5kIEVkLiwgcHAuIDIwMC0yMDEuXG5cdHZhciByZWdleCA9IC8oPFthLXpcXC8hJF0oXCJbXlwiXSpcInwnW14nXSonfFteJ1wiPl0pKj58PCEoLS0uKj8tLVxccyopKz4pL2dpO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsIGZ1bmN0aW9uKHdob2xlTWF0Y2gpIHtcblx0XHR2YXIgdGFnID0gd2hvbGVNYXRjaC5yZXBsYWNlKC8oLik8XFwvP2NvZGU+KD89LikvZyxcIiQxYFwiKTtcblx0XHR0YWcgPSBlc2NhcGVDaGFyYWN0ZXJzKHRhZyxcIlxcXFxgKl9cIik7XG5cdFx0cmV0dXJuIHRhZztcblx0fSk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBfRG9BbmNob3JzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFR1cm4gTWFya2Rvd24gbGluayBzaG9ydGN1dHMgaW50byBYSFRNTCA8YT4gdGFncy5cbi8vXG5cdC8vXG5cdC8vIEZpcnN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIGxpbmtzOiBbbGluayB0ZXh0XSBbaWRdXG5cdC8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHRcXFtcblx0XHRcdChcblx0XHRcdFx0KD86XG5cdFx0XHRcdFx0XFxbW15cXF1dKlxcXVx0XHQvLyBhbGxvdyBicmFja2V0cyBuZXN0ZWQgb25lIGxldmVsXG5cdFx0XHRcdFx0fFxuXHRcdFx0XHRcdFteXFxbXVx0XHRcdC8vIG9yIGFueXRoaW5nIGVsc2Vcblx0XHRcdFx0KSpcblx0XHRcdClcblx0XHRcdFxcXVxuXG5cdFx0XHRbIF0/XHRcdFx0XHRcdC8vIG9uZSBvcHRpb25hbCBzcGFjZVxuXHRcdFx0KD86XFxuWyBdKik/XHRcdFx0XHQvLyBvbmUgb3B0aW9uYWwgbmV3bGluZSBmb2xsb3dlZCBieSBzcGFjZXNcblxuXHRcdFx0XFxbXG5cdFx0XHQoLio/KVx0XHRcdFx0XHQvLyBpZCA9ICQzXG5cdFx0XHRcXF1cblx0XHQpKCkoKSgpKClcdFx0XHRcdFx0Ly8gcGFkIHJlbWFpbmluZyBiYWNrcmVmZXJlbmNlc1xuXHRcdC9nLF9Eb0FuY2hvcnNfY2FsbGJhY2spO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbKCg/OlxcW1teXFxdXSpcXF18W15cXFtcXF1dKSopXFxdWyBdPyg/OlxcblsgXSopP1xcWyguKj8pXFxdKSgpKCkoKSgpL2csd3JpdGVBbmNob3JUYWcpO1xuXG5cdC8vXG5cdC8vIE5leHQsIGlubGluZS1zdHlsZSBsaW5rczogW2xpbmsgdGV4dF0odXJsIFwib3B0aW9uYWwgdGl0bGVcIilcblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0KFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdFx0XFxbXG5cdFx0XHRcdChcblx0XHRcdFx0XHQoPzpcblx0XHRcdFx0XHRcdFxcW1teXFxdXSpcXF1cdC8vIGFsbG93IGJyYWNrZXRzIG5lc3RlZCBvbmUgbGV2ZWxcblx0XHRcdFx0XHR8XG5cdFx0XHRcdFx0W15cXFtcXF1dXHRcdFx0Ly8gb3IgYW55dGhpbmcgZWxzZVxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0XHRcXF1cblx0XHRcdFxcKFx0XHRcdFx0XHRcdC8vIGxpdGVyYWwgcGFyZW5cblx0XHRcdFsgXFx0XSpcblx0XHRcdCgpXHRcdFx0XHRcdFx0Ly8gbm8gaWQsIHNvIGxlYXZlICQzIGVtcHR5XG5cdFx0XHQ8PyguKj8pPj9cdFx0XHRcdC8vIGhyZWYgPSAkNFxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KFx0XHRcdFx0XHRcdC8vICQ1XG5cdFx0XHRcdChbJ1wiXSlcdFx0XHRcdC8vIHF1b3RlIGNoYXIgPSAkNlxuXHRcdFx0XHQoLio/KVx0XHRcdFx0Ly8gVGl0bGUgPSAkN1xuXHRcdFx0XHRcXDZcdFx0XHRcdFx0Ly8gbWF0Y2hpbmcgcXVvdGVcblx0XHRcdFx0WyBcXHRdKlx0XHRcdFx0Ly8gaWdub3JlIGFueSBzcGFjZXMvdGFicyBiZXR3ZWVuIGNsb3NpbmcgcXVvdGUgYW5kIClcblx0XHRcdCk/XHRcdFx0XHRcdFx0Ly8gdGl0bGUgaXMgb3B0aW9uYWxcblx0XHRcdFxcKVxuXHRcdClcblx0XHQvZyx3cml0ZUFuY2hvclRhZyk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFsoKD86XFxbW15cXF1dKlxcXXxbXlxcW1xcXV0pKilcXF1cXChbIFxcdF0qKCk8PyguKj8pPj9bIFxcdF0qKChbJ1wiXSkoLio/KVxcNlsgXFx0XSopP1xcKSkvZyx3cml0ZUFuY2hvclRhZyk7XG5cblx0Ly9cblx0Ly8gTGFzdCwgaGFuZGxlIHJlZmVyZW5jZS1zdHlsZSBzaG9ydGN1dHM6IFtsaW5rIHRleHRdXG5cdC8vIFRoZXNlIG11c3QgY29tZSBsYXN0IGluIGNhc2UgeW91J3ZlIGFsc28gZ290IFtsaW5rIHRlc3RdWzFdXG5cdC8vIG9yIFtsaW5rIHRlc3RdKC9mb28pXG5cdC8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdCBcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0XFxbXG5cdFx0XHQoW15cXFtcXF1dKylcdFx0XHRcdC8vIGxpbmsgdGV4dCA9ICQyOyBjYW4ndCBjb250YWluICdbJyBvciAnXSdcblx0XHRcdFxcXVxuXHRcdCkoKSgpKCkoKSgpXHRcdFx0XHRcdC8vIHBhZCByZXN0IG9mIGJhY2tyZWZlcmVuY2VzXG5cdFx0L2csIHdyaXRlQW5jaG9yVGFnKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcWyhbXlxcW1xcXV0rKVxcXSkoKSgpKCkoKSgpL2csIHdyaXRlQW5jaG9yVGFnKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIHdyaXRlQW5jaG9yVGFnID0gZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMyxtNCxtNSxtNixtNykge1xuXHRpZiAobTcgPT0gdW5kZWZpbmVkKSBtNyA9IFwiXCI7XG5cdHZhciB3aG9sZV9tYXRjaCA9IG0xO1xuXHR2YXIgbGlua190ZXh0ICAgPSBtMjtcblx0dmFyIGxpbmtfaWRcdCA9IG0zLnRvTG93ZXJDYXNlKCk7XG5cdHZhciB1cmxcdFx0PSBtNDtcblx0dmFyIHRpdGxlXHQ9IG03O1xuXG5cdGlmICh1cmwgPT0gXCJcIikge1xuXHRcdGlmIChsaW5rX2lkID09IFwiXCIpIHtcblx0XHRcdC8vIGxvd2VyLWNhc2UgYW5kIHR1cm4gZW1iZWRkZWQgbmV3bGluZXMgaW50byBzcGFjZXNcblx0XHRcdGxpbmtfaWQgPSBsaW5rX3RleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8gP1xcbi9nLFwiIFwiKTtcblx0XHR9XG5cdFx0dXJsID0gXCIjXCIrbGlua19pZDtcblxuXHRcdGlmIChnX3VybHNbbGlua19pZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR1cmwgPSBnX3VybHNbbGlua19pZF07XG5cdFx0XHRpZiAoZ190aXRsZXNbbGlua19pZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHRpdGxlID0gZ190aXRsZXNbbGlua19pZF07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKHdob2xlX21hdGNoLnNlYXJjaCgvXFwoXFxzKlxcKSQvbSk+LTEpIHtcblx0XHRcdFx0Ly8gU3BlY2lhbCBjYXNlIGZvciBleHBsaWNpdCBlbXB0eSB1cmxcblx0XHRcdFx0dXJsID0gXCJcIjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiB3aG9sZV9tYXRjaDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR1cmwgPSBlc2NhcGVDaGFyYWN0ZXJzKHVybCxcIipfXCIpO1xuXHR2YXIgcmVzdWx0ID0gXCI8YSBocmVmPVxcXCJcIiArIHVybCArIFwiXFxcIlwiO1xuXG5cdGlmICh0aXRsZSAhPSBcIlwiKSB7XG5cdFx0dGl0bGUgPSB0aXRsZS5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHRcdHRpdGxlID0gZXNjYXBlQ2hhcmFjdGVycyh0aXRsZSxcIipfXCIpO1xuXHRcdHJlc3VsdCArPSAgXCIgdGl0bGU9XFxcIlwiICsgdGl0bGUgKyBcIlxcXCJcIjtcblx0fVxuXG5cdHJlc3VsdCArPSBcIj5cIiArIGxpbmtfdGV4dCArIFwiPC9hPlwiO1xuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cblxudmFyIF9Eb0ltYWdlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBUdXJuIE1hcmtkb3duIGltYWdlIHNob3J0Y3V0cyBpbnRvIDxpbWc+IHRhZ3MuXG4vL1xuXG5cdC8vXG5cdC8vIEZpcnN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIGxhYmVsZWQgaW1hZ2VzOiAhW2FsdCB0ZXh0XVtpZF1cblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHQhXFxbXG5cdFx0XHQoLio/KVx0XHRcdFx0Ly8gYWx0IHRleHQgPSAkMlxuXHRcdFx0XFxdXG5cblx0XHRcdFsgXT9cdFx0XHRcdC8vIG9uZSBvcHRpb25hbCBzcGFjZVxuXHRcdFx0KD86XFxuWyBdKik/XHRcdFx0Ly8gb25lIG9wdGlvbmFsIG5ld2xpbmUgZm9sbG93ZWQgYnkgc3BhY2VzXG5cblx0XHRcdFxcW1xuXHRcdFx0KC4qPylcdFx0XHRcdC8vIGlkID0gJDNcblx0XHRcdFxcXVxuXHRcdCkoKSgpKCkoKVx0XHRcdFx0Ly8gcGFkIHJlc3Qgb2YgYmFja3JlZmVyZW5jZXNcblx0XHQvZyx3cml0ZUltYWdlVGFnKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKCFcXFsoLio/KVxcXVsgXT8oPzpcXG5bIF0qKT9cXFsoLio/KVxcXSkoKSgpKCkoKS9nLHdyaXRlSW1hZ2VUYWcpO1xuXG5cdC8vXG5cdC8vIE5leHQsIGhhbmRsZSBpbmxpbmUgaW1hZ2VzOiAgIVthbHQgdGV4dF0odXJsIFwib3B0aW9uYWwgdGl0bGVcIilcblx0Ly8gRG9uJ3QgZm9yZ2V0OiBlbmNvZGUgKiBhbmQgX1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdCFcXFtcblx0XHRcdCguKj8pXHRcdFx0XHQvLyBhbHQgdGV4dCA9ICQyXG5cdFx0XHRcXF1cblx0XHRcdFxccz9cdFx0XHRcdFx0Ly8gT25lIG9wdGlvbmFsIHdoaXRlc3BhY2UgY2hhcmFjdGVyXG5cdFx0XHRcXChcdFx0XHRcdFx0Ly8gbGl0ZXJhbCBwYXJlblxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KClcdFx0XHRcdFx0Ly8gbm8gaWQsIHNvIGxlYXZlICQzIGVtcHR5XG5cdFx0XHQ8PyhcXFMrPyk+P1x0XHRcdC8vIHNyYyB1cmwgPSAkNFxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KFx0XHRcdFx0XHQvLyAkNVxuXHRcdFx0XHQoWydcIl0pXHRcdFx0Ly8gcXVvdGUgY2hhciA9ICQ2XG5cdFx0XHRcdCguKj8pXHRcdFx0Ly8gdGl0bGUgPSAkN1xuXHRcdFx0XHRcXDZcdFx0XHRcdC8vIG1hdGNoaW5nIHF1b3RlXG5cdFx0XHRcdFsgXFx0XSpcblx0XHRcdCk/XHRcdFx0XHRcdC8vIHRpdGxlIGlzIG9wdGlvbmFsXG5cdFx0XFwpXG5cdFx0KVxuXHRcdC9nLHdyaXRlSW1hZ2VUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oIVxcWyguKj8pXFxdXFxzP1xcKFsgXFx0XSooKTw/KFxcUys/KT4/WyBcXHRdKigoWydcIl0pKC4qPylcXDZbIFxcdF0qKT9cXCkpL2csd3JpdGVJbWFnZVRhZyk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciB3cml0ZUltYWdlVGFnID0gZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMyxtNCxtNSxtNixtNykge1xuXHR2YXIgd2hvbGVfbWF0Y2ggPSBtMTtcblx0dmFyIGFsdF90ZXh0ICAgPSBtMjtcblx0dmFyIGxpbmtfaWRcdCA9IG0zLnRvTG93ZXJDYXNlKCk7XG5cdHZhciB1cmxcdFx0PSBtNDtcblx0dmFyIHRpdGxlXHQ9IG03O1xuXG5cdGlmICghdGl0bGUpIHRpdGxlID0gXCJcIjtcblxuXHRpZiAodXJsID09IFwiXCIpIHtcblx0XHRpZiAobGlua19pZCA9PSBcIlwiKSB7XG5cdFx0XHQvLyBsb3dlci1jYXNlIGFuZCB0dXJuIGVtYmVkZGVkIG5ld2xpbmVzIGludG8gc3BhY2VzXG5cdFx0XHRsaW5rX2lkID0gYWx0X3RleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8gP1xcbi9nLFwiIFwiKTtcblx0XHR9XG5cdFx0dXJsID0gXCIjXCIrbGlua19pZDtcblxuXHRcdGlmIChnX3VybHNbbGlua19pZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR1cmwgPSBnX3VybHNbbGlua19pZF07XG5cdFx0XHRpZiAoZ190aXRsZXNbbGlua19pZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHRpdGxlID0gZ190aXRsZXNbbGlua19pZF07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHdob2xlX21hdGNoO1xuXHRcdH1cblx0fVxuXG5cdGFsdF90ZXh0ID0gYWx0X3RleHQucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKTtcblx0dXJsID0gZXNjYXBlQ2hhcmFjdGVycyh1cmwsXCIqX1wiKTtcblx0dmFyIHJlc3VsdCA9IFwiPGltZyBzcmM9XFxcIlwiICsgdXJsICsgXCJcXFwiIGFsdD1cXFwiXCIgKyBhbHRfdGV4dCArIFwiXFxcIlwiO1xuXG5cdC8vIGF0dGFja2xhYjogTWFya2Rvd24ucGwgYWRkcyBlbXB0eSB0aXRsZSBhdHRyaWJ1dGVzIHRvIGltYWdlcy5cblx0Ly8gUmVwbGljYXRlIHRoaXMgYnVnLlxuXG5cdC8vaWYgKHRpdGxlICE9IFwiXCIpIHtcblx0XHR0aXRsZSA9IHRpdGxlLnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIik7XG5cdFx0dGl0bGUgPSBlc2NhcGVDaGFyYWN0ZXJzKHRpdGxlLFwiKl9cIik7XG5cdFx0cmVzdWx0ICs9ICBcIiB0aXRsZT1cXFwiXCIgKyB0aXRsZSArIFwiXFxcIlwiO1xuXHQvL31cblxuXHRyZXN1bHQgKz0gXCIgLz5cIjtcblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5cbnZhciBfRG9IZWFkZXJzID0gZnVuY3Rpb24odGV4dCkge1xuXG5cdC8vIFNldGV4dC1zdHlsZSBoZWFkZXJzOlxuXHQvL1x0SGVhZGVyIDFcblx0Ly9cdD09PT09PT09XG5cdC8vXG5cdC8vXHRIZWFkZXIgMlxuXHQvL1x0LS0tLS0tLS1cblx0Ly9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXiguKylbIFxcdF0qXFxuPStbIFxcdF0qXFxuKy9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKXtyZXR1cm4gaGFzaEJsb2NrKCc8aDEgaWQ9XCInICsgaGVhZGVySWQobTEpICsgJ1wiPicgKyBfUnVuU3BhbkdhbXV0KG0xKSArIFwiPC9oMT5cIik7fSk7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXiguKylbIFxcdF0qXFxuLStbIFxcdF0qXFxuKy9nbSxcblx0XHRmdW5jdGlvbihtYXRjaEZvdW5kLG0xKXtyZXR1cm4gaGFzaEJsb2NrKCc8aDIgaWQ9XCInICsgaGVhZGVySWQobTEpICsgJ1wiPicgKyBfUnVuU3BhbkdhbXV0KG0xKSArIFwiPC9oMj5cIik7fSk7XG5cblx0Ly8gYXR4LXN0eWxlIGhlYWRlcnM6XG5cdC8vICAjIEhlYWRlciAxXG5cdC8vICAjIyBIZWFkZXIgMlxuXHQvLyAgIyMgSGVhZGVyIDIgd2l0aCBjbG9zaW5nIGhhc2hlcyAjI1xuXHQvLyAgLi4uXG5cdC8vICAjIyMjIyMgSGVhZGVyIDZcblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0XihcXCN7MSw2fSlcdFx0XHRcdC8vICQxID0gc3RyaW5nIG9mICMnc1xuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KC4rPylcdFx0XHRcdFx0Ly8gJDIgPSBIZWFkZXIgdGV4dFxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0XFwjKlx0XHRcdFx0XHRcdC8vIG9wdGlvbmFsIGNsb3NpbmcgIydzIChub3QgY291bnRlZClcblx0XHRcdFxcbitcblx0XHQvZ20sIGZ1bmN0aW9uKCkgey4uLn0pO1xuXHQqL1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oXFwjezEsNn0pWyBcXHRdKiguKz8pWyBcXHRdKlxcIypcXG4rL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIpIHtcblx0XHRcdHZhciBoX2xldmVsID0gbTEubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhcIjxoXCIgKyBoX2xldmVsICsgJyBpZD1cIicgKyBoZWFkZXJJZChtMikgKyAnXCI+JyArIF9SdW5TcGFuR2FtdXQobTIpICsgXCI8L2hcIiArIGhfbGV2ZWwgKyBcIj5cIik7XG5cdFx0fSk7XG5cblx0ZnVuY3Rpb24gaGVhZGVySWQobSkge1xuXHRcdHJldHVybiBtLnJlcGxhY2UoL1teXFx3XS9nLCAnJykudG9Mb3dlckNhc2UoKTtcblx0fVxuXHRyZXR1cm4gdGV4dDtcbn1cblxuLy8gVGhpcyBkZWNsYXJhdGlvbiBrZWVwcyBEb2pvIGNvbXByZXNzb3IgZnJvbSBvdXRwdXR0aW5nIGdhcmJhZ2U6XG52YXIgX1Byb2Nlc3NMaXN0SXRlbXM7XG5cbnZhciBfRG9MaXN0cyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBGb3JtIEhUTUwgb3JkZXJlZCAobnVtYmVyZWQpIGFuZCB1bm9yZGVyZWQgKGJ1bGxldGVkKSBsaXN0cy5cbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiBhZGQgc2VudGluZWwgdG8gaGFjayBhcm91bmQga2h0bWwvc2FmYXJpIGJ1Zzpcblx0Ly8gaHR0cDovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTEyMzFcblx0dGV4dCArPSBcIn4wXCI7XG5cblx0Ly8gUmUtdXNhYmxlIHBhdHRlcm4gdG8gbWF0Y2ggYW55IGVudGlyZWwgdWwgb3Igb2wgbGlzdDpcblxuXHQvKlxuXHRcdHZhciB3aG9sZV9saXN0ID0gL1xuXHRcdChcdFx0XHRcdFx0XHRcdFx0XHQvLyAkMSA9IHdob2xlIGxpc3Rcblx0XHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gJDJcblx0XHRcdFx0WyBdezAsM31cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdFx0KFsqKy1dfFxcZCtbLl0pXHRcdFx0XHQvLyAkMyA9IGZpcnN0IGxpc3QgaXRlbSBtYXJrZXJcblx0XHRcdFx0WyBcXHRdK1xuXHRcdFx0KVxuXHRcdFx0W15cXHJdKz9cblx0XHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gJDRcblx0XHRcdFx0fjBcdFx0XHRcdFx0XHRcdC8vIHNlbnRpbmVsIGZvciB3b3JrYXJvdW5kOyBzaG91bGQgYmUgJFxuXHRcdFx0fFxuXHRcdFx0XHRcXG57Mix9XG5cdFx0XHRcdCg/PVxcUylcblx0XHRcdFx0KD8hXHRcdFx0XHRcdFx0XHQvLyBOZWdhdGl2ZSBsb29rYWhlYWQgZm9yIGFub3RoZXIgbGlzdCBpdGVtIG1hcmtlclxuXHRcdFx0XHRcdFsgXFx0XSpcblx0XHRcdFx0XHQoPzpbKistXXxcXGQrWy5dKVsgXFx0XStcblx0XHRcdFx0KVxuXHRcdFx0KVxuXHRcdCkvZ1xuXHQqL1xuXHR2YXIgd2hvbGVfbGlzdCA9IC9eKChbIF17MCwzfShbKistXXxcXGQrWy5dKVsgXFx0XSspW15cXHJdKz8ofjB8XFxuezIsfSg/PVxcUykoPyFbIFxcdF0qKD86WyorLV18XFxkK1suXSlbIFxcdF0rKSkpL2dtO1xuXG5cdGlmIChnX2xpc3RfbGV2ZWwpIHtcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHdob2xlX2xpc3QsZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGxpc3QgPSBtMTtcblx0XHRcdHZhciBsaXN0X3R5cGUgPSAobTIuc2VhcmNoKC9bKistXS9nKT4tMSkgPyBcInVsXCIgOiBcIm9sXCI7XG5cblx0XHRcdC8vIFR1cm4gZG91YmxlIHJldHVybnMgaW50byB0cmlwbGUgcmV0dXJucywgc28gdGhhdCB3ZSBjYW4gbWFrZSBhXG5cdFx0XHQvLyBwYXJhZ3JhcGggZm9yIHRoZSBsYXN0IGl0ZW0gaW4gYSBsaXN0LCBpZiBuZWNlc3Nhcnk6XG5cdFx0XHRsaXN0ID0gbGlzdC5yZXBsYWNlKC9cXG57Mix9L2csXCJcXG5cXG5cXG5cIik7O1xuXHRcdFx0dmFyIHJlc3VsdCA9IF9Qcm9jZXNzTGlzdEl0ZW1zKGxpc3QpO1xuXG5cdFx0XHQvLyBUcmltIGFueSB0cmFpbGluZyB3aGl0ZXNwYWNlLCB0byBwdXQgdGhlIGNsb3NpbmcgYDwvJGxpc3RfdHlwZT5gXG5cdFx0XHQvLyB1cCBvbiB0aGUgcHJlY2VkaW5nIGxpbmUsIHRvIGdldCBpdCBwYXN0IHRoZSBjdXJyZW50IHN0dXBpZFxuXHRcdFx0Ly8gSFRNTCBibG9jayBwYXJzZXIuIFRoaXMgaXMgYSBoYWNrIHRvIHdvcmsgYXJvdW5kIHRoZSB0ZXJyaWJsZVxuXHRcdFx0Ly8gaGFjayB0aGF0IGlzIHRoZSBIVE1MIGJsb2NrIHBhcnNlci5cblx0XHRcdHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC9cXHMrJC8sXCJcIik7XG5cdFx0XHRyZXN1bHQgPSBcIjxcIitsaXN0X3R5cGUrXCI+XCIgKyByZXN1bHQgKyBcIjwvXCIrbGlzdF90eXBlK1wiPlxcblwiO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR3aG9sZV9saXN0ID0gLyhcXG5cXG58Xlxcbj8pKChbIF17MCwzfShbKistXXxcXGQrWy5dKVsgXFx0XSspW15cXHJdKz8ofjB8XFxuezIsfSg/PVxcUykoPyFbIFxcdF0qKD86WyorLV18XFxkK1suXSlbIFxcdF0rKSkpL2c7XG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSh3aG9sZV9saXN0LGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMpIHtcblx0XHRcdHZhciBydW51cCA9IG0xO1xuXHRcdFx0dmFyIGxpc3QgPSBtMjtcblxuXHRcdFx0dmFyIGxpc3RfdHlwZSA9IChtMy5zZWFyY2goL1sqKy1dL2cpPi0xKSA/IFwidWxcIiA6IFwib2xcIjtcblx0XHRcdC8vIFR1cm4gZG91YmxlIHJldHVybnMgaW50byB0cmlwbGUgcmV0dXJucywgc28gdGhhdCB3ZSBjYW4gbWFrZSBhXG5cdFx0XHQvLyBwYXJhZ3JhcGggZm9yIHRoZSBsYXN0IGl0ZW0gaW4gYSBsaXN0LCBpZiBuZWNlc3Nhcnk6XG5cdFx0XHR2YXIgbGlzdCA9IGxpc3QucmVwbGFjZSgvXFxuezIsfS9nLFwiXFxuXFxuXFxuXCIpOztcblx0XHRcdHZhciByZXN1bHQgPSBfUHJvY2Vzc0xpc3RJdGVtcyhsaXN0KTtcblx0XHRcdHJlc3VsdCA9IHJ1bnVwICsgXCI8XCIrbGlzdF90eXBlK1wiPlxcblwiICsgcmVzdWx0ICsgXCI8L1wiK2xpc3RfdHlwZStcIj5cXG5cIjtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wLyxcIlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuX1Byb2Nlc3NMaXN0SXRlbXMgPSBmdW5jdGlvbihsaXN0X3N0cikge1xuLy9cbi8vICBQcm9jZXNzIHRoZSBjb250ZW50cyBvZiBhIHNpbmdsZSBvcmRlcmVkIG9yIHVub3JkZXJlZCBsaXN0LCBzcGxpdHRpbmcgaXRcbi8vICBpbnRvIGluZGl2aWR1YWwgbGlzdCBpdGVtcy5cbi8vXG5cdC8vIFRoZSAkZ19saXN0X2xldmVsIGdsb2JhbCBrZWVwcyB0cmFjayBvZiB3aGVuIHdlJ3JlIGluc2lkZSBhIGxpc3QuXG5cdC8vIEVhY2ggdGltZSB3ZSBlbnRlciBhIGxpc3QsIHdlIGluY3JlbWVudCBpdDsgd2hlbiB3ZSBsZWF2ZSBhIGxpc3QsXG5cdC8vIHdlIGRlY3JlbWVudC4gSWYgaXQncyB6ZXJvLCB3ZSdyZSBub3QgaW4gYSBsaXN0IGFueW1vcmUuXG5cdC8vXG5cdC8vIFdlIGRvIHRoaXMgYmVjYXVzZSB3aGVuIHdlJ3JlIG5vdCBpbnNpZGUgYSBsaXN0LCB3ZSB3YW50IHRvIHRyZWF0XG5cdC8vIHNvbWV0aGluZyBsaWtlIHRoaXM6XG5cdC8vXG5cdC8vICAgIEkgcmVjb21tZW5kIHVwZ3JhZGluZyB0byB2ZXJzaW9uXG5cdC8vICAgIDguIE9vcHMsIG5vdyB0aGlzIGxpbmUgaXMgdHJlYXRlZFxuXHQvLyAgICBhcyBhIHN1Yi1saXN0LlxuXHQvL1xuXHQvLyBBcyBhIHNpbmdsZSBwYXJhZ3JhcGgsIGRlc3BpdGUgdGhlIGZhY3QgdGhhdCB0aGUgc2Vjb25kIGxpbmUgc3RhcnRzXG5cdC8vIHdpdGggYSBkaWdpdC1wZXJpb2Qtc3BhY2Ugc2VxdWVuY2UuXG5cdC8vXG5cdC8vIFdoZXJlYXMgd2hlbiB3ZSdyZSBpbnNpZGUgYSBsaXN0IChvciBzdWItbGlzdCksIHRoYXQgbGluZSB3aWxsIGJlXG5cdC8vIHRyZWF0ZWQgYXMgdGhlIHN0YXJ0IG9mIGEgc3ViLWxpc3QuIFdoYXQgYSBrbHVkZ2UsIGh1aD8gVGhpcyBpc1xuXHQvLyBhbiBhc3BlY3Qgb2YgTWFya2Rvd24ncyBzeW50YXggdGhhdCdzIGhhcmQgdG8gcGFyc2UgcGVyZmVjdGx5XG5cdC8vIHdpdGhvdXQgcmVzb3J0aW5nIHRvIG1pbmQtcmVhZGluZy4gUGVyaGFwcyB0aGUgc29sdXRpb24gaXMgdG9cblx0Ly8gY2hhbmdlIHRoZSBzeW50YXggcnVsZXMgc3VjaCB0aGF0IHN1Yi1saXN0cyBtdXN0IHN0YXJ0IHdpdGggYVxuXHQvLyBzdGFydGluZyBjYXJkaW5hbCBudW1iZXI7IGUuZy4gXCIxLlwiIG9yIFwiYS5cIi5cblxuXHRnX2xpc3RfbGV2ZWwrKztcblxuXHQvLyB0cmltIHRyYWlsaW5nIGJsYW5rIGxpbmVzOlxuXHRsaXN0X3N0ciA9IGxpc3Rfc3RyLnJlcGxhY2UoL1xcbnsyLH0kLyxcIlxcblwiKTtcblxuXHQvLyBhdHRhY2tsYWI6IGFkZCBzZW50aW5lbCB0byBlbXVsYXRlIFxcelxuXHRsaXN0X3N0ciArPSBcIn4wXCI7XG5cblx0Lypcblx0XHRsaXN0X3N0ciA9IGxpc3Rfc3RyLnJlcGxhY2UoL1xuXHRcdFx0KFxcbik/XHRcdFx0XHRcdFx0XHQvLyBsZWFkaW5nIGxpbmUgPSAkMVxuXHRcdFx0KF5bIFxcdF0qKVx0XHRcdFx0XHRcdC8vIGxlYWRpbmcgd2hpdGVzcGFjZSA9ICQyXG5cdFx0XHQoWyorLV18XFxkK1suXSkgWyBcXHRdK1x0XHRcdC8vIGxpc3QgbWFya2VyID0gJDNcblx0XHRcdChbXlxccl0rP1x0XHRcdFx0XHRcdC8vIGxpc3QgaXRlbSB0ZXh0ICAgPSAkNFxuXHRcdFx0KFxcbnsxLDJ9KSlcblx0XHRcdCg/PSBcXG4qICh+MCB8IFxcMiAoWyorLV18XFxkK1suXSkgWyBcXHRdKykpXG5cdFx0L2dtLCBmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXHRsaXN0X3N0ciA9IGxpc3Rfc3RyLnJlcGxhY2UoLyhcXG4pPyheWyBcXHRdKikoWyorLV18XFxkK1suXSlbIFxcdF0rKFteXFxyXSs/KFxcbnsxLDJ9KSkoPz1cXG4qKH4wfFxcMihbKistXXxcXGQrWy5dKVsgXFx0XSspKS9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00KXtcblx0XHRcdHZhciBpdGVtID0gbTQ7XG5cdFx0XHR2YXIgbGVhZGluZ19saW5lID0gbTE7XG5cdFx0XHR2YXIgbGVhZGluZ19zcGFjZSA9IG0yO1xuXG5cdFx0XHRpZiAobGVhZGluZ19saW5lIHx8IChpdGVtLnNlYXJjaCgvXFxuezIsfS8pPi0xKSkge1xuXHRcdFx0XHRpdGVtID0gX1J1bkJsb2NrR2FtdXQoX091dGRlbnQoaXRlbSkpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIFJlY3Vyc2lvbiBmb3Igc3ViLWxpc3RzOlxuXHRcdFx0XHRpdGVtID0gX0RvTGlzdHMoX091dGRlbnQoaXRlbSkpO1xuXHRcdFx0XHRpdGVtID0gaXRlbS5yZXBsYWNlKC9cXG4kLyxcIlwiKTsgLy8gY2hvbXAoaXRlbSlcblx0XHRcdFx0aXRlbSA9IF9SdW5TcGFuR2FtdXQoaXRlbSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAgXCI8bGk+XCIgKyBpdGVtICsgXCI8L2xpPlxcblwiO1xuXHRcdH1cblx0KTtcblxuXHQvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG5cdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvfjAvZyxcIlwiKTtcblxuXHRnX2xpc3RfbGV2ZWwtLTtcblx0cmV0dXJuIGxpc3Rfc3RyO1xufVxuXG5cbnZhciBfRG9Db2RlQmxvY2tzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vICBQcm9jZXNzIE1hcmtkb3duIGA8cHJlPjxjb2RlPmAgYmxvY2tzLlxuLy9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UodGV4dCxcblx0XHRcdC8oPzpcXG5cXG58Xilcblx0XHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gJDEgPSB0aGUgY29kZSBibG9jayAtLSBvbmUgb3IgbW9yZSBsaW5lcywgc3RhcnRpbmcgd2l0aCBhIHNwYWNlL3RhYlxuXHRcdFx0XHQoPzpcblx0XHRcdFx0XHQoPzpbIF17NH18XFx0KVx0XHRcdC8vIExpbmVzIG11c3Qgc3RhcnQgd2l0aCBhIHRhYiBvciBhIHRhYi13aWR0aCBvZiBzcGFjZXMgLSBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cdFx0XHRcdFx0LipcXG4rXG5cdFx0XHRcdCkrXG5cdFx0XHQpXG5cdFx0XHQoXFxuKlsgXXswLDN9W14gXFx0XFxuXXwoPz1+MCkpXHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cdFx0L2csZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblxuXHQvLyBhdHRhY2tsYWI6IHNlbnRpbmVsIHdvcmthcm91bmRzIGZvciBsYWNrIG9mIFxcQSBhbmQgXFxaLCBzYWZhcmlcXGtodG1sIGJ1Z1xuXHR0ZXh0ICs9IFwifjBcIjtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oPzpcXG5cXG58XikoKD86KD86WyBdezR9fFxcdCkuKlxcbispKykoXFxuKlsgXXswLDN9W14gXFx0XFxuXXwoPz1+MCkpL2csXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGNvZGVibG9jayA9IG0xO1xuXHRcdFx0dmFyIG5leHRDaGFyID0gbTI7XG5cblx0XHRcdGNvZGVibG9jayA9IF9FbmNvZGVDb2RlKCBfT3V0ZGVudChjb2RlYmxvY2spKTtcblx0XHRcdGNvZGVibG9jayA9IF9EZXRhYihjb2RlYmxvY2spO1xuXHRcdFx0Y29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL15cXG4rL2csXCJcIik7IC8vIHRyaW0gbGVhZGluZyBuZXdsaW5lc1xuXHRcdFx0Y29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL1xcbiskL2csXCJcIik7IC8vIHRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG5cdFx0XHRjb2RlYmxvY2sgPSBcIjxwcmU+PGNvZGU+XCIgKyBjb2RlYmxvY2sgKyBcIlxcbjwvY29kZT48L3ByZT5cIjtcblxuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhjb2RlYmxvY2spICsgbmV4dENoYXI7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufTtcblxudmFyIF9Eb0dpdGh1YkNvZGVCbG9ja3MgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gIFByb2Nlc3MgR2l0aHViLXN0eWxlIGNvZGUgYmxvY2tzXG4vLyAgRXhhbXBsZTpcbi8vICBgYGBydWJ5XG4vLyAgZGVmIGhlbGxvX3dvcmxkKHgpXG4vLyAgICBwdXRzIFwiSGVsbG8sICN7eH1cIlxuLy8gIGVuZFxuLy8gIGBgYFxuLy9cblxuXG5cdC8vIGF0dGFja2xhYjogc2VudGluZWwgd29ya2Fyb3VuZHMgZm9yIGxhY2sgb2YgXFxBIGFuZCBcXFosIHNhZmFyaVxca2h0bWwgYnVnXG5cdHRleHQgKz0gXCJ+MFwiO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg/Ol58XFxuKWBgYCguKilcXG4oW1xcc1xcU10qPylcXG5gYGAvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgbGFuZ3VhZ2UgPSBtMTtcblx0XHRcdHZhciBjb2RlYmxvY2sgPSBtMjtcblxuXHRcdFx0Y29kZWJsb2NrID0gX0VuY29kZUNvZGUoY29kZWJsb2NrKTtcblx0XHRcdGNvZGVibG9jayA9IF9EZXRhYihjb2RlYmxvY2spO1xuXHRcdFx0Y29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL15cXG4rL2csXCJcIik7IC8vIHRyaW0gbGVhZGluZyBuZXdsaW5lc1xuXHRcdFx0Y29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL1xcbiskL2csXCJcIik7IC8vIHRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG5cdFx0XHRjb2RlYmxvY2sgPSBcIjxwcmU+PGNvZGVcIiArIChsYW5ndWFnZSA/IFwiIGNsYXNzPVxcXCJcIiArIGxhbmd1YWdlICsgJ1wiJyA6IFwiXCIpICsgXCI+XCIgKyBjb2RlYmxvY2sgKyBcIlxcbjwvY29kZT48L3ByZT5cIjtcblxuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhjb2RlYmxvY2spO1xuXHRcdH1cblx0KTtcblxuXHQvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wLyxcIlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIGhhc2hCbG9jayA9IGZ1bmN0aW9uKHRleHQpIHtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKF5cXG4rfFxcbiskKS9nLFwiXCIpO1xuXHRyZXR1cm4gXCJcXG5cXG5+S1wiICsgKGdfaHRtbF9ibG9ja3MucHVzaCh0ZXh0KS0xKSArIFwiS1xcblxcblwiO1xufVxuXG52YXIgX0RvQ29kZVNwYW5zID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vICAgKiAgQmFja3RpY2sgcXVvdGVzIGFyZSB1c2VkIGZvciA8Y29kZT48L2NvZGU+IHNwYW5zLlxuLy9cbi8vICAgKiAgWW91IGNhbiB1c2UgbXVsdGlwbGUgYmFja3RpY2tzIGFzIHRoZSBkZWxpbWl0ZXJzIGlmIHlvdSB3YW50IHRvXG4vL1x0IGluY2x1ZGUgbGl0ZXJhbCBiYWNrdGlja3MgaW4gdGhlIGNvZGUgc3Bhbi4gU28sIHRoaXMgaW5wdXQ6XG4vL1xuLy9cdFx0IEp1c3QgdHlwZSBgYGZvbyBgYmFyYCBiYXpgYCBhdCB0aGUgcHJvbXB0LlxuLy9cbi8vXHQgICBXaWxsIHRyYW5zbGF0ZSB0bzpcbi8vXG4vL1x0XHQgPHA+SnVzdCB0eXBlIDxjb2RlPmZvbyBgYmFyYCBiYXo8L2NvZGU+IGF0IHRoZSBwcm9tcHQuPC9wPlxuLy9cbi8vXHRUaGVyZSdzIG5vIGFyYml0cmFyeSBsaW1pdCB0byB0aGUgbnVtYmVyIG9mIGJhY2t0aWNrcyB5b3Vcbi8vXHRjYW4gdXNlIGFzIGRlbGltdGVycy4gSWYgeW91IG5lZWQgdGhyZWUgY29uc2VjdXRpdmUgYmFja3RpY2tzXG4vL1x0aW4geW91ciBjb2RlLCB1c2UgZm91ciBmb3IgZGVsaW1pdGVycywgZXRjLlxuLy9cbi8vICAqICBZb3UgY2FuIHVzZSBzcGFjZXMgdG8gZ2V0IGxpdGVyYWwgYmFja3RpY2tzIGF0IHRoZSBlZGdlczpcbi8vXG4vL1x0XHQgLi4uIHR5cGUgYGAgYGJhcmAgYGAgLi4uXG4vL1xuLy9cdCAgIFR1cm5zIHRvOlxuLy9cbi8vXHRcdCAuLi4gdHlwZSA8Y29kZT5gYmFyYDwvY29kZT4gLi4uXG4vL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHQoXnxbXlxcXFxdKVx0XHRcdFx0XHQvLyBDaGFyYWN0ZXIgYmVmb3JlIG9wZW5pbmcgYCBjYW4ndCBiZSBhIGJhY2tzbGFzaFxuXHRcdFx0KGArKVx0XHRcdFx0XHRcdC8vICQyID0gT3BlbmluZyBydW4gb2YgYFxuXHRcdFx0KFx0XHRcdFx0XHRcdFx0Ly8gJDMgPSBUaGUgY29kZSBibG9ja1xuXHRcdFx0XHRbXlxccl0qP1xuXHRcdFx0XHRbXmBdXHRcdFx0XHRcdC8vIGF0dGFja2xhYjogd29yayBhcm91bmQgbGFjayBvZiBsb29rYmVoaW5kXG5cdFx0XHQpXG5cdFx0XHRcXDJcdFx0XHRcdFx0XHRcdC8vIE1hdGNoaW5nIGNsb3NlclxuXHRcdFx0KD8hYClcblx0XHQvZ20sIGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKF58W15cXFxcXSkoYCspKFteXFxyXSo/W15gXSlcXDIoPyFgKS9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00KSB7XG5cdFx0XHR2YXIgYyA9IG0zO1xuXHRcdFx0YyA9IGMucmVwbGFjZSgvXihbIFxcdF0qKS9nLFwiXCIpO1x0Ly8gbGVhZGluZyB3aGl0ZXNwYWNlXG5cdFx0XHRjID0gYy5yZXBsYWNlKC9bIFxcdF0qJC9nLFwiXCIpO1x0Ly8gdHJhaWxpbmcgd2hpdGVzcGFjZVxuXHRcdFx0YyA9IF9FbmNvZGVDb2RlKGMpO1xuXHRcdFx0cmV0dXJuIG0xK1wiPGNvZGU+XCIrYytcIjwvY29kZT5cIjtcblx0XHR9KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIF9FbmNvZGVDb2RlID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIEVuY29kZS9lc2NhcGUgY2VydGFpbiBjaGFyYWN0ZXJzIGluc2lkZSBNYXJrZG93biBjb2RlIHJ1bnMuXG4vLyBUaGUgcG9pbnQgaXMgdGhhdCBpbiBjb2RlLCB0aGVzZSBjaGFyYWN0ZXJzIGFyZSBsaXRlcmFscyxcbi8vIGFuZCBsb3NlIHRoZWlyIHNwZWNpYWwgTWFya2Rvd24gbWVhbmluZ3MuXG4vL1xuXHQvLyBFbmNvZGUgYWxsIGFtcGVyc2FuZHM7IEhUTUwgZW50aXRpZXMgYXJlIG5vdFxuXHQvLyBlbnRpdGllcyB3aXRoaW4gYSBNYXJrZG93biBjb2RlIHNwYW4uXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyYvZyxcIiZhbXA7XCIpO1xuXG5cdC8vIERvIHRoZSBhbmdsZSBicmFja2V0IHNvbmcgYW5kIGRhbmNlOlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88L2csXCImbHQ7XCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8+L2csXCImZ3Q7XCIpO1xuXG5cdC8vIE5vdywgZXNjYXBlIGNoYXJhY3RlcnMgdGhhdCBhcmUgbWFnaWMgaW4gTWFya2Rvd246XG5cdHRleHQgPSBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsXCJcXCpfe31bXVxcXFxcIixmYWxzZSk7XG5cbi8vIGpqIHRoZSBsaW5lIGFib3ZlIGJyZWFrcyB0aGlzOlxuLy8tLS1cblxuLy8qIEl0ZW1cblxuLy8gICAxLiBTdWJpdGVtXG5cbi8vICAgICAgICAgICAgc3BlY2lhbCBjaGFyOiAqXG4vLy0tLVxuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRG9JdGFsaWNzQW5kQm9sZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHQvLyA8c3Ryb25nPiBtdXN0IGdvIGZpcnN0OlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFwqXFwqfF9fKSg/PVxcUykoW15cXHJdKj9cXFNbKl9dKilcXDEvZyxcblx0XHRcIjxzdHJvbmc+JDI8L3N0cm9uZz5cIik7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcKnxfKSg/PVxcUykoW15cXHJdKj9cXFMpXFwxL2csXG5cdFx0XCI8ZW0+JDI8L2VtPlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0RvQmxvY2tRdW90ZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0XHRcdC8vIFdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdChcblx0XHRcdFx0XlsgXFx0XSo+WyBcXHRdP1x0XHRcdC8vICc+JyBhdCB0aGUgc3RhcnQgb2YgYSBsaW5lXG5cdFx0XHRcdC4rXFxuXHRcdFx0XHRcdC8vIHJlc3Qgb2YgdGhlIGZpcnN0IGxpbmVcblx0XHRcdFx0KC4rXFxuKSpcdFx0XHRcdFx0Ly8gc3Vic2VxdWVudCBjb25zZWN1dGl2ZSBsaW5lc1xuXHRcdFx0XHRcXG4qXHRcdFx0XHRcdFx0Ly8gYmxhbmtzXG5cdFx0XHQpK1xuXHRcdClcblx0XHQvZ20sIGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKCheWyBcXHRdKj5bIFxcdF0/LitcXG4oLitcXG4pKlxcbiopKykvZ20sXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHRcdFx0dmFyIGJxID0gbTE7XG5cblx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1Zzpcblx0XHRcdC8vIFwiLS0tLS0tLS0tLWJ1Z1wiLnJlcGxhY2UoL14tL2csXCJcIikgPT0gXCJidWdcIlxuXG5cdFx0XHRicSA9IGJxLnJlcGxhY2UoL15bIFxcdF0qPlsgXFx0XT8vZ20sXCJ+MFwiKTtcdC8vIHRyaW0gb25lIGxldmVsIG9mIHF1b3RpbmdcblxuXHRcdFx0Ly8gYXR0YWNrbGFiOiBjbGVhbiB1cCBoYWNrXG5cdFx0XHRicSA9IGJxLnJlcGxhY2UoL34wL2csXCJcIik7XG5cblx0XHRcdGJxID0gYnEucmVwbGFjZSgvXlsgXFx0XSskL2dtLFwiXCIpO1x0XHQvLyB0cmltIHdoaXRlc3BhY2Utb25seSBsaW5lc1xuXHRcdFx0YnEgPSBfUnVuQmxvY2tHYW11dChicSk7XHRcdFx0XHQvLyByZWN1cnNlXG5cblx0XHRcdGJxID0gYnEucmVwbGFjZSgvKF58XFxuKS9nLFwiJDEgIFwiKTtcblx0XHRcdC8vIFRoZXNlIGxlYWRpbmcgc3BhY2VzIHNjcmV3IHdpdGggPHByZT4gY29udGVudCwgc28gd2UgbmVlZCB0byBmaXggdGhhdDpcblx0XHRcdGJxID0gYnEucmVwbGFjZShcblx0XHRcdFx0XHQvKFxccyo8cHJlPlteXFxyXSs/PFxcL3ByZT4pL2dtLFxuXHRcdFx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHRcdFx0dmFyIHByZSA9IG0xO1xuXHRcdFx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1Zzpcblx0XHRcdFx0XHRwcmUgPSBwcmUucmVwbGFjZSgvXiAgL21nLFwifjBcIik7XG5cdFx0XHRcdFx0cHJlID0gcHJlLnJlcGxhY2UoL34wL2csXCJcIik7XG5cdFx0XHRcdFx0cmV0dXJuIHByZTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBoYXNoQmxvY2soXCI8YmxvY2txdW90ZT5cXG5cIiArIGJxICsgXCJcXG48L2Jsb2NrcXVvdGU+XCIpO1xuXHRcdH0pO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0Zvcm1QYXJhZ3JhcGhzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vICBQYXJhbXM6XG4vLyAgICAkdGV4dCAtIHN0cmluZyB0byBwcm9jZXNzIHdpdGggaHRtbCA8cD4gdGFnc1xuLy9cblxuXHQvLyBTdHJpcCBsZWFkaW5nIGFuZCB0cmFpbGluZyBsaW5lczpcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlxcbisvZyxcIlwiKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTtcblxuXHR2YXIgZ3JhZnMgPSB0ZXh0LnNwbGl0KC9cXG57Mix9L2cpO1xuXHR2YXIgZ3JhZnNPdXQgPSBuZXcgQXJyYXkoKTtcblxuXHQvL1xuXHQvLyBXcmFwIDxwPiB0YWdzLlxuXHQvL1xuXHR2YXIgZW5kID0gZ3JhZnMubGVuZ3RoO1xuXHRmb3IgKHZhciBpPTA7IGk8ZW5kOyBpKyspIHtcblx0XHR2YXIgc3RyID0gZ3JhZnNbaV07XG5cblx0XHQvLyBpZiB0aGlzIGlzIGFuIEhUTUwgbWFya2VyLCBjb3B5IGl0XG5cdFx0aWYgKHN0ci5zZWFyY2goL35LKFxcZCspSy9nKSA+PSAwKSB7XG5cdFx0XHRncmFmc091dC5wdXNoKHN0cik7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHN0ci5zZWFyY2goL1xcUy8pID49IDApIHtcblx0XHRcdHN0ciA9IF9SdW5TcGFuR2FtdXQoc3RyKTtcblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC9eKFsgXFx0XSopL2csXCI8cD5cIik7XG5cdFx0XHRzdHIgKz0gXCI8L3A+XCJcblx0XHRcdGdyYWZzT3V0LnB1c2goc3RyKTtcblx0XHR9XG5cblx0fVxuXG5cdC8vXG5cdC8vIFVuaGFzaGlmeSBIVE1MIGJsb2Nrc1xuXHQvL1xuXHRlbmQgPSBncmFmc091dC5sZW5ndGg7XG5cdGZvciAodmFyIGk9MDsgaTxlbmQ7IGkrKykge1xuXHRcdC8vIGlmIHRoaXMgaXMgYSBtYXJrZXIgZm9yIGFuIGh0bWwgYmxvY2suLi5cblx0XHR3aGlsZSAoZ3JhZnNPdXRbaV0uc2VhcmNoKC9+SyhcXGQrKUsvKSA+PSAwKSB7XG5cdFx0XHR2YXIgYmxvY2tUZXh0ID0gZ19odG1sX2Jsb2Nrc1tSZWdFeHAuJDFdO1xuXHRcdFx0YmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL1xcJC9nLFwiJCQkJFwiKTsgLy8gRXNjYXBlIGFueSBkb2xsYXIgc2lnbnNcblx0XHRcdGdyYWZzT3V0W2ldID0gZ3JhZnNPdXRbaV0ucmVwbGFjZSgvfktcXGQrSy8sYmxvY2tUZXh0KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZ3JhZnNPdXQuam9pbihcIlxcblxcblwiKTtcbn1cblxuXG52YXIgX0VuY29kZUFtcHNBbmRBbmdsZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vLyBTbWFydCBwcm9jZXNzaW5nIGZvciBhbXBlcnNhbmRzIGFuZCBhbmdsZSBicmFja2V0cyB0aGF0IG5lZWQgdG8gYmUgZW5jb2RlZC5cblxuXHQvLyBBbXBlcnNhbmQtZW5jb2RpbmcgYmFzZWQgZW50aXJlbHkgb24gTmF0IElyb25zJ3MgQW1wdXRhdG9yIE1UIHBsdWdpbjpcblx0Ly8gICBodHRwOi8vYnVtcHBvLm5ldC9wcm9qZWN0cy9hbXB1dGF0b3IvXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyYoPyEjP1t4WF0/KD86WzAtOWEtZkEtRl0rfFxcdyspOykvZyxcIiZhbXA7XCIpO1xuXG5cdC8vIEVuY29kZSBuYWtlZCA8J3Ncblx0dGV4dCA9IHRleHQucmVwbGFjZSgvPCg/IVthLXpcXC8/XFwkIV0pL2dpLFwiJmx0O1wiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0VuY29kZUJhY2tzbGFzaEVzY2FwZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gICBQYXJhbWV0ZXI6ICBTdHJpbmcuXG4vLyAgIFJldHVybnM6XHRUaGUgc3RyaW5nLCB3aXRoIGFmdGVyIHByb2Nlc3NpbmcgdGhlIGZvbGxvd2luZyBiYWNrc2xhc2hcbi8vXHRcdFx0ICAgZXNjYXBlIHNlcXVlbmNlcy5cbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiBUaGUgcG9saXRlIHdheSB0byBkbyB0aGlzIGlzIHdpdGggdGhlIG5ld1xuXHQvLyBlc2NhcGVDaGFyYWN0ZXJzKCkgZnVuY3Rpb246XG5cdC8vXG5cdC8vIFx0dGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcIlxcXFxcIix0cnVlKTtcblx0Ly8gXHR0ZXh0ID0gZXNjYXBlQ2hhcmFjdGVycyh0ZXh0LFwiYCpfe31bXSgpPiMrLS4hXCIsdHJ1ZSk7XG5cdC8vXG5cdC8vIC4uLmJ1dCB3ZSdyZSBzaWRlc3RlcHBpbmcgaXRzIHVzZSBvZiB0aGUgKHNsb3cpIFJlZ0V4cCBjb25zdHJ1Y3RvclxuXHQvLyBhcyBhbiBvcHRpbWl6YXRpb24gZm9yIEZpcmVmb3guICBUaGlzIGZ1bmN0aW9uIGdldHMgY2FsbGVkIGEgTE9ULlxuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcXFwoXFxcXCkvZyxlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxcXChbYCpfe31cXFtcXF0oKT4jKy0uIV0pL2csZXNjYXBlQ2hhcmFjdGVyc19jYWxsYmFjayk7XG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRG9BdXRvTGlua3MgPSBmdW5jdGlvbih0ZXh0KSB7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvPCgoaHR0cHM/fGZ0cHxkaWN0KTpbXidcIj5cXHNdKyk+L2dpLFwiPGEgaHJlZj1cXFwiJDFcXFwiPiQxPC9hPlwiKTtcblxuXHQvLyBFbWFpbCBhZGRyZXNzZXM6IDxhZGRyZXNzQGRvbWFpbi5mb28+XG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHRcdDxcblx0XHRcdCg/Om1haWx0bzopP1xuXHRcdFx0KFxuXHRcdFx0XHRbLS5cXHddK1xuXHRcdFx0XHRcXEBcblx0XHRcdFx0Wy1hLXowLTldKyhcXC5bLWEtejAtOV0rKSpcXC5bYS16XStcblx0XHRcdClcblx0XHRcdD5cblx0XHQvZ2ksIF9Eb0F1dG9MaW5rc19jYWxsYmFjaygpKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvPCg/Om1haWx0bzopPyhbLS5cXHddK1xcQFstYS16MC05XSsoXFwuWy1hLXowLTldKykqXFwuW2Etel0rKT4vZ2ksXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHRcdFx0cmV0dXJuIF9FbmNvZGVFbWFpbEFkZHJlc3MoIF9VbmVzY2FwZVNwZWNpYWxDaGFycyhtMSkgKTtcblx0XHR9XG5cdCk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9FbmNvZGVFbWFpbEFkZHJlc3MgPSBmdW5jdGlvbihhZGRyKSB7XG4vL1xuLy8gIElucHV0OiBhbiBlbWFpbCBhZGRyZXNzLCBlLmcuIFwiZm9vQGV4YW1wbGUuY29tXCJcbi8vXG4vLyAgT3V0cHV0OiB0aGUgZW1haWwgYWRkcmVzcyBhcyBhIG1haWx0byBsaW5rLCB3aXRoIGVhY2ggY2hhcmFjdGVyXG4vL1x0b2YgdGhlIGFkZHJlc3MgZW5jb2RlZCBhcyBlaXRoZXIgYSBkZWNpbWFsIG9yIGhleCBlbnRpdHksIGluXG4vL1x0dGhlIGhvcGVzIG9mIGZvaWxpbmcgbW9zdCBhZGRyZXNzIGhhcnZlc3Rpbmcgc3BhbSBib3RzLiBFLmcuOlxuLy9cbi8vXHQ8YSBocmVmPVwiJiN4NkQ7JiM5NzsmIzEwNTsmIzEwODsmI3g3NDsmIzExMTs6JiMxMDI7JiMxMTE7JiMxMTE7JiM2NDsmIzEwMTtcbi8vXHQgICB4JiN4NjE7JiMxMDk7JiN4NzA7JiMxMDg7JiN4NjU7JiN4MkU7JiM5OTsmIzExMTsmIzEwOTtcIj4mIzEwMjsmIzExMTsmIzExMTtcbi8vXHQgICAmIzY0OyYjMTAxO3gmI3g2MTsmIzEwOTsmI3g3MDsmIzEwODsmI3g2NTsmI3gyRTsmIzk5OyYjMTExOyYjMTA5OzwvYT5cbi8vXG4vLyAgQmFzZWQgb24gYSBmaWx0ZXIgYnkgTWF0dGhldyBXaWNrbGluZSwgcG9zdGVkIHRvIHRoZSBCQkVkaXQtVGFsa1xuLy8gIG1haWxpbmcgbGlzdDogPGh0dHA6Ly90aW55dXJsLmNvbS95dTd1ZT5cbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiB3aHkgY2FuJ3QgamF2YXNjcmlwdCBzcGVhayBoZXg/XG5cdGZ1bmN0aW9uIGNoYXIyaGV4KGNoKSB7XG5cdFx0dmFyIGhleERpZ2l0cyA9ICcwMTIzNDU2Nzg5QUJDREVGJztcblx0XHR2YXIgZGVjID0gY2guY2hhckNvZGVBdCgwKTtcblx0XHRyZXR1cm4oaGV4RGlnaXRzLmNoYXJBdChkZWM+PjQpICsgaGV4RGlnaXRzLmNoYXJBdChkZWMmMTUpKTtcblx0fVxuXG5cdHZhciBlbmNvZGUgPSBbXG5cdFx0ZnVuY3Rpb24oY2gpe3JldHVybiBcIiYjXCIrY2guY2hhckNvZGVBdCgwKStcIjtcIjt9LFxuXHRcdGZ1bmN0aW9uKGNoKXtyZXR1cm4gXCImI3hcIitjaGFyMmhleChjaCkrXCI7XCI7fSxcblx0XHRmdW5jdGlvbihjaCl7cmV0dXJuIGNoO31cblx0XTtcblxuXHRhZGRyID0gXCJtYWlsdG86XCIgKyBhZGRyO1xuXG5cdGFkZHIgPSBhZGRyLnJlcGxhY2UoLy4vZywgZnVuY3Rpb24oY2gpIHtcblx0XHRpZiAoY2ggPT0gXCJAXCIpIHtcblx0XHQgICBcdC8vIHRoaXMgKm11c3QqIGJlIGVuY29kZWQuIEkgaW5zaXN0LlxuXHRcdFx0Y2ggPSBlbmNvZGVbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjIpXShjaCk7XG5cdFx0fSBlbHNlIGlmIChjaCAhPVwiOlwiKSB7XG5cdFx0XHQvLyBsZWF2ZSAnOicgYWxvbmUgKHRvIHNwb3QgbWFpbHRvOiBsYXRlcilcblx0XHRcdHZhciByID0gTWF0aC5yYW5kb20oKTtcblx0XHRcdC8vIHJvdWdobHkgMTAlIHJhdywgNDUlIGhleCwgNDUlIGRlY1xuXHRcdFx0Y2ggPSAgKFxuXHRcdFx0XHRcdHIgPiAuOSAgP1x0ZW5jb2RlWzJdKGNoKSAgIDpcblx0XHRcdFx0XHRyID4gLjQ1ID9cdGVuY29kZVsxXShjaCkgICA6XG5cdFx0XHRcdFx0XHRcdFx0ZW5jb2RlWzBdKGNoKVxuXHRcdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gY2g7XG5cdH0pO1xuXG5cdGFkZHIgPSBcIjxhIGhyZWY9XFxcIlwiICsgYWRkciArIFwiXFxcIj5cIiArIGFkZHIgKyBcIjwvYT5cIjtcblx0YWRkciA9IGFkZHIucmVwbGFjZSgvXCI+Lis6L2csXCJcXFwiPlwiKTsgLy8gc3RyaXAgdGhlIG1haWx0bzogZnJvbSB0aGUgdmlzaWJsZSBwYXJ0XG5cblx0cmV0dXJuIGFkZHI7XG59XG5cblxudmFyIF9VbmVzY2FwZVNwZWNpYWxDaGFycyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBTd2FwIGJhY2sgaW4gYWxsIHRoZSBzcGVjaWFsIGNoYXJhY3RlcnMgd2UndmUgaGlkZGVuLlxuLy9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkUoXFxkKylFL2csXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHRcdFx0dmFyIGNoYXJDb2RlVG9SZXBsYWNlID0gcGFyc2VJbnQobTEpO1xuXHRcdFx0cmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGVUb1JlcGxhY2UpO1xuXHRcdH1cblx0KTtcblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9PdXRkZW50ID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFJlbW92ZSBvbmUgbGV2ZWwgb2YgbGluZS1sZWFkaW5nIHRhYnMgb3Igc3BhY2VzXG4vL1xuXG5cdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1Zzpcblx0Ly8gXCItLS0tLS0tLS0tYnVnXCIucmVwbGFjZSgvXi0vZyxcIlwiKSA9PSBcImJ1Z1wiXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXihcXHR8WyBdezEsNH0pL2dtLFwifjBcIik7IC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblxuXHQvLyBhdHRhY2tsYWI6IGNsZWFuIHVwIGhhY2tcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvZyxcIlwiKVxuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0RldGFiID0gZnVuY3Rpb24odGV4dCkge1xuLy8gYXR0YWNrbGFiOiBEZXRhYidzIGNvbXBsZXRlbHkgcmV3cml0dGVuIGZvciBzcGVlZC5cbi8vIEluIHBlcmwgd2UgY291bGQgZml4IGl0IGJ5IGFuY2hvcmluZyB0aGUgcmVnZXhwIHdpdGggXFxHLlxuLy8gSW4gamF2YXNjcmlwdCB3ZSdyZSBsZXNzIGZvcnR1bmF0ZS5cblxuXHQvLyBleHBhbmQgZmlyc3Qgbi0xIHRhYnNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFx0KD89XFx0KS9nLFwiICAgIFwiKTsgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXG5cdC8vIHJlcGxhY2UgdGhlIG50aCB3aXRoIHR3byBzZW50aW5lbHNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFx0L2csXCJ+QX5CXCIpO1xuXG5cdC8vIHVzZSB0aGUgc2VudGluZWwgdG8gYW5jaG9yIG91ciByZWdleCBzbyBpdCBkb2Vzbid0IGV4cGxvZGVcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkIoLis/KX5BL2csXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGxlYWRpbmdUZXh0ID0gbTE7XG5cdFx0XHR2YXIgbnVtU3BhY2VzID0gNCAtIGxlYWRpbmdUZXh0Lmxlbmd0aCAlIDQ7ICAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cblx0XHRcdC8vIHRoZXJlICptdXN0KiBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpczpcblx0XHRcdGZvciAodmFyIGk9MDsgaTxudW1TcGFjZXM7IGkrKykgbGVhZGluZ1RleHQrPVwiIFwiO1xuXG5cdFx0XHRyZXR1cm4gbGVhZGluZ1RleHQ7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGNsZWFuIHVwIHNlbnRpbmVsc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+QS9nLFwiICAgIFwiKTsgIC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkIvZyxcIlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG4vL1xuLy8gIGF0dGFja2xhYjogVXRpbGl0eSBmdW5jdGlvbnNcbi8vXG5cblxudmFyIGVzY2FwZUNoYXJhY3RlcnMgPSBmdW5jdGlvbih0ZXh0LCBjaGFyc1RvRXNjYXBlLCBhZnRlckJhY2tzbGFzaCkge1xuXHQvLyBGaXJzdCB3ZSBoYXZlIHRvIGVzY2FwZSB0aGUgZXNjYXBlIGNoYXJhY3RlcnMgc28gdGhhdFxuXHQvLyB3ZSBjYW4gYnVpbGQgYSBjaGFyYWN0ZXIgY2xhc3Mgb3V0IG9mIHRoZW1cblx0dmFyIHJlZ2V4U3RyaW5nID0gXCIoW1wiICsgY2hhcnNUb0VzY2FwZS5yZXBsYWNlKC8oW1xcW1xcXVxcXFxdKS9nLFwiXFxcXCQxXCIpICsgXCJdKVwiO1xuXG5cdGlmIChhZnRlckJhY2tzbGFzaCkge1xuXHRcdHJlZ2V4U3RyaW5nID0gXCJcXFxcXFxcXFwiICsgcmVnZXhTdHJpbmc7XG5cdH1cblxuXHR2YXIgcmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4U3RyaW5nLFwiZ1wiKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZShyZWdleCxlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgZXNjYXBlQ2hhcmFjdGVyc19jYWxsYmFjayA9IGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0dmFyIGNoYXJDb2RlVG9Fc2NhcGUgPSBtMS5jaGFyQ29kZUF0KDApO1xuXHRyZXR1cm4gXCJ+RVwiK2NoYXJDb2RlVG9Fc2NhcGUrXCJFXCI7XG59XG5cbn0gLy8gZW5kIG9mIFNob3dkb3duLmNvbnZlcnRlclxuXG4vLyBleHBvcnRcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykgbW9kdWxlLmV4cG9ydHMgPSBTaG93ZG93bjtcblxufSkoKSJdfQ==
;