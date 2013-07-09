;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var addStyle, noise;

noise = require('../lib/noise');

addStyle = function(css) {
  var style;
  style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = css;
  return document.getElementsByTagName('head')[0].appendChild(style);
};

addStyle(".noise { background-image: url(" + (noise(128, 128, [0, 0, 0, 0], [0, 0, 0, 0x8])) + "); }");


},{"../lib/noise":2}],2:[function(require,module,exports){
var BYTE4 = 4294967296;

module.exports = function(w, h, min, span) {
  var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d'),
      i, j, imageData, rnd;

  if (!(min instanceof Array)) min = [min, min, min, 0xFF];
  else for (;min.length < 4; min.push(min.length === 3 ? 0xFF : min[min.length-1]));
  if (!(span instanceof Array)) span = [span, span, span, 0xFF];
  else for (;span.length < 4; span.push(span.length === 3 ? 0xFF : span[span.length-1]));

  canvas.width = w;
  canvas.height = h;

  imageData = ctx.createImageData(canvas.width, canvas.height);
  for (i = imageData.data.length; (i-=4) >= 0;) {
    rnd = Math.random() * BYTE4;
    for (j = 0; j < 4; j++)
      imageData.data[i + j] = span[j]
        ? ((((rnd>>j*8)&0xFF)/0xFF * span[j]) | 0) + min[j]
        : min[j];
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};

},{}],3:[function(require,module,exports){
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
var EventEmitter, base64, deserialize, pad, rnd, serialize, state;

EventEmitter = require('events').EventEmitter;

base64 = require('../lib/base64');

pad = function(n, p) {
  return (new Array(p + 1 - n.toString().length)).join('0') + n;
};

rnd = function() {
  return Date.now().toString(16) + pad((Math.random() * 65536 | 0).toString(16), 4);
};

deserialize = function() {
  var hash, pos;
  hash = window.location.hash.substr(1);
  pos = hash.indexOf('/');
  return {
    type: pos === -1 ? hash : hash.substr(0, pos),
    id: pos === -1 ? void 0 : hash.substr(pos + 1)
  };
};

serialize = function(data) {
  return window.location.hash = '#' + data.type + (data.id ? '/' + data.id : '');
};

module.exports = state = new EventEmitter;

state.storeType = 'base64';

state.storeId = void 0;

state.stores = {
  base64: {
    store: function(id, data, callback) {
      return callback(null, base64.encode(JSON.stringify(data || '{}')));
    },
    restore: function(id, callback) {
      return callback(null, JSON.parse(base64.decode(id) || '{}'));
    }
  },
  local: {
    store: function(id, data, callback) {
      if (id == null) {
        id = rnd();
      }
      window.localStorage.setItem('markdown-' + id, JSON.stringify(data || '{}'));
      return callback(null, id);
    },
    restore: function(id, callback) {
      return callback(null, JSON.parse(window.localStorage.getItem('markdown-' + id) || '{}'));
    }
  },
  file: {
    store: function(id, data, callback) {
      if (data.meta.autosave) {
        return callback('Auto save not supported.');
      }
      saveAs(new Blob([data.text], {
        type: 'text/plain;charset=utf-8'
      }), data.meta.title + '.md');
      return callback();
    },
    restore: function(id, callback) {
      return callback(null, {
        text: '',
        meta: {}
      });
    }
  }
};

state.store = function(storeType, data, callback) {
  if (storeType) {
    state.storeType = storeType;
  }
  return state.stores[state.storeType].store(state.storeId, data, function(err, storeId) {
    if (err != null) {
      return typeof callback === "function" ? callback(err) : void 0;
    }
    state.storeId = storeId;
    serialize({
      type: state.storeType,
      id: storeId
    });
    return typeof callback === "function" ? callback(null, storeId) : void 0;
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
    return state.stores[state.storeType].restore(state.storeId, function(err, data) {
      return callback(err, data);
    });
  } else {
    return callback();
  }
};

window.addEventListener('hashchange', function() {
  var storeId, storeType, _ref;
  _ref = deserialize(), storeType = _ref.type, storeId = _ref.id;
  if (storeType !== state.storeType || storeId !== state.storeId) {
    return state.restore(storeType, storeId, function(err, data) {
      if (err == null) {
        return state.emit('restore', data);
      }
    });
  }
});


},{"events":4,"../lib/base64":7}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
var xhr;

xhr = function(opt, callback) {
  var header, method, r, value, _ref;
  method = opt.method || 'GET';
  r = new XMLHttpRequest;
  if ('withCredentials' in r) {
    r.open(method, opt.url, true);
  } else if (typeof XDomainRequest !== "undefined" && XDomainRequest !== null) {
    r = new XDomainRequest;
    r.open(method, opt.url);
  } else {
    return null;
  }
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


},{}],9:[function(require,module,exports){
var state, xhr;

xhr = require('./xhr.coffee');

state = require('./state.coffee');

state.stores.gist = {
  store: function(id, data, callback) {
    if (data.meta.autosave) {
      return callback('Auto save not supported.');
    }
    return xhr.json({
      method: 'POST',
      url: 'https://api.github.com/gists',
      data: {
        description: 'Created with Dr. Markdown',
        files: {
          'document.md': {
            content: data.text
          },
          'meta.json': {
            content: JSON.stringify(data.meta)
          }
        }
      }
    }, function(err, data) {
      return callback(err, data.id);
    });
  },
  restore: function(id, callback) {
    return xhr.json({
      url: 'https://api.github.com/gists/' + id
    }, function(err, data) {
      var meta, text, _ref, _ref1, _ref2;
      _ref = data.files, (_ref1 = _ref['document.md'], text = _ref1.content), (_ref2 = _ref['meta.json'], meta = _ref2.content);
      return callback(err, {
        text: text,
        meta: JSON.parse(meta)
      });
    });
  }
};


},{"./xhr.coffee":8,"./state.coffee":6}],10:[function(require,module,exports){
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


},{}],11:[function(require,module,exports){
(function(global){/**
 * marked - a markdown parser
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){3,} *\n*/,
  blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!' + block.gfm.fences.source.replace('\\1', '\\2') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i+1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item[item.length-1] === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre' || cap[1] === 'script',
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1][cap[1].length-1] === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([^\s]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1][6] === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // url (gfm)
    if (cap = this.rules.url.exec(src)) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0][0];
        src = cap[0].substring(1) + src;
        continue;
      }
      out += this.outputLink(cap, link);
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<strong>'
        + this.output(cap[2] || cap[1])
        + '</strong>';
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<em>'
        + this.output(cap[2] || cap[1])
        + '</em>';
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<code>'
        + escape(cap[2], true)
        + '</code>';
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<br>';
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<del>'
        + this.output(cap[1])
        + '</del>';
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(this.smartypants(cap[0]));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  if (cap[0][0] !== '!') {
    return '<a href="'
      + escape(link.href)
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>'
      + this.output(cap[1])
      + '</a>';
  } else {
    return '<img src="'
      + escape(link.href)
      + '" alt="'
      + escape(cap[1])
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>';
  }
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    .replace(/--/g, '\u2014')
    .replace(/'([^']*)'/g, '\u2018$1\u2019')
    .replace(/"([^"]*)"/g, '\u201C$1\u201D')
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options) {
  var parser = new Parser(options);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length-1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return '<hr>\n';
    }
    case 'heading': {
      return '<h'
        + this.token.depth
        + '>'
        + this.inline.output(this.token.text)
        + '</h'
        + this.token.depth
        + '>\n';
    }
    case 'code': {
      if (this.options.highlight) {
        var code = this.options.highlight(this.token.text, this.token.lang);
        if (code != null && code !== this.token.text) {
          this.token.escaped = true;
          this.token.text = code;
        }
      }

      if (!this.token.escaped) {
        this.token.text = escape(this.token.text, true);
      }

      return '<pre><code'
        + (this.token.lang
        ? ' class="'
        + this.options.langPrefix
        + this.token.lang
        + '"'
        : '')
        + '>'
        + this.token.text
        + '</code></pre>\n';
    }
    case 'table': {
      var body = ''
        , heading
        , i
        , row
        , cell
        , j;

      // header
      body += '<thead>\n<tr>\n';
      for (i = 0; i < this.token.header.length; i++) {
        heading = this.inline.output(this.token.header[i]);
        body += this.token.align[i]
          ? '<th align="' + this.token.align[i] + '">' + heading + '</th>\n'
          : '<th>' + heading + '</th>\n';
      }
      body += '</tr>\n</thead>\n';

      // body
      body += '<tbody>\n'
      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];
        body += '<tr>\n';
        for (j = 0; j < row.length; j++) {
          cell = this.inline.output(row[j]);
          body += this.token.align[j]
            ? '<td align="' + this.token.align[j] + '">' + cell + '</td>\n'
            : '<td>' + cell + '</td>\n';
        }
        body += '</tr>\n';
      }
      body += '</tbody>\n';

      return '<table>\n'
        + body
        + '</table>\n';
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return '<blockquote>\n'
        + body
        + '</blockquote>\n';
    }
    case 'list_start': {
      var type = this.token.ordered ? 'ol' : 'ul'
        , body = '';

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return '<'
        + type
        + '>\n'
        + body
        + '</'
        + type
        + '>\n';
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'html': {
      return !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
    }
    case 'paragraph': {
      return '<p>'
        + this.inline.output(this.token.text)
        + '</p>\n';
    }
    case 'text': {
      return '<p>'
        + this.parseText()
        + '</p>\n';
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    if (opt) opt = merge({}, marked.defaults, opt);

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(hi) {
      var out, err;

      if (hi !== true) {
        delete opt.highlight;
      }

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done(true);
    }

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

})(self)
},{}],12:[function(require,module,exports){
var docTitle, editor, extend, extendA, index, initiated, marked, model, number, proxy, restore, save, saveTimer, saved, state, state_, toc, tocEl, updateIndex, updateTitle, updateToc, updateView, viewEl, viewWrapEl, vixen, _ref;

require('./bring-the-noise.coffee');

vixen = require('vixen');

marked = require('marked');

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  smartLists: true
});

require('./unify.coffee');

state_ = require('./state.coffee');

require('./state-gist.coffee');

_ref = require('./utils.coffee'), number = _ref.number, index = _ref.index, toc = _ref.toc;

extend = function(r, d) {
  var k, v;
  if (r == null) {
    r = {};
  }
  for (k in d) {
    v = d[k];
    if (v != null) {
      r[k] = v;
    }
  }
  return r;
};

extendA = function(r, a) {
  var k, v, _i, _len, _ref1;
  if (r == null) {
    r = {};
  }
  for (_i = 0, _len = a.length; _i < _len; _i++) {
    _ref1 = a[_i], k = _ref1[0], v = _ref1[1];
    if (v != null) {
      r[k] = v;
    }
  }
  return r;
};

proxy = function(dict) {
  var def_, fn, prop, vault_;
  vault_ = {};
  def_ = function(prop, fn) {
    return {
      enumerable: true,
      set: function(value) {
        var old;
        old = vault_[prop];
        vault_[prop] = value;
        return fn(value, old);
      },
      get: function() {
        return vault_[prop];
      }
    };
  };
  return Object.create(Object.prototype, extendA({
    toJSON: {
      value: function() {
        return vault_;
      }
    }
  }, (function() {
    var _results;
    _results = [];
    for (prop in dict) {
      fn = dict[prop];
      _results.push([prop, def_(prop, fn)]);
    }
    return _results;
  })()));
};

tocEl = document.getElementById('toc');

viewEl = document.getElementById('view');

viewWrapEl = document.getElementById('view-wrap');

updateToc = function() {
  return tocEl.innerHTML = toc(viewEl);
};

updateIndex = function() {
  return index(number(viewEl));
};

state = proxy({
  toc: function(to) {
    if (to) {
      updateToc();
    }
    return model.showToc = to ? 'toc' : '';
  },
  index: function(to) {
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
  },
  mode: function(mode) {
    return model.mode = {
      write: 'full-input',
      read: 'full-view'
    }[mode] || '';
  },
  theme: function(v) {
    return model.theme = v;
  }
});

docTitle = function() {
  var h, tmp;
  tmp = document.createElement('div');
  tmp.innerHTML = (h = viewEl.querySelectorAll('h1,h2,h3')[0]) ? h.innerHTML : 'Untitled';
  [].forEach.call(tmp.querySelectorAll('.index'), function(el) {
    return tmp.removeChild(el);
  });
  return tmp.textContent;
};

initiated = false;

saved = true;

save = function(force) {
  if (!saved || force) {
    return state_.store(null, {
      text: editor.getValue(),
      meta: extend(state, {
        title: docTitle(),
        autosave: !force
      })
    }, function(err, id) {
      saved = err == null;
      return updateTitle();
    });
  }
};

updateView = function() {
  var cline, cursorHeight, cursorSpan, cursorTop, md, scrollTop, v, viewHeight;
  cline = editor.getCursor().line;
  md = editor.getValue().split('\n');
  md[cline] += '<span id="cursor"></span>';
  md = md.join('\n');
  v = viewEl;
  v.innerHTML = marked(md);
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

updateTitle = function() {
  return document.title = (saved ? '' : '*') + docTitle();
};

saveTimer = null;

editor = CodeMirror.fromTextArea(document.getElementById('input-md'), {
  mode: 'gfm',
  theme: 'default',
  lineNumbers: false,
  lineWrapping: true,
  dragDrop: false
});

editor.on('change', function() {
  updateView();
  if (initiated) {
    if (saved) {
      saved = false;
      updateTitle();
    }
    clearTimeout(saveTimer);
    return saveTimer = setTimeout(save, 5000);
  } else {
    return updateTitle();
  }
});

restore = function(data) {
  var currentText, meta, text;
  currentText = editor.getValue();
  if (data) {
    text = data.text, meta = data.meta;
    extend(state, meta || {});
    if ((text != null) && text !== currentText) {
      editor.setValue(text);
    }
  } else if (currentText) {
    save(true);
  }
  model.theme = state.theme || 'serif';
  return initiated = true;
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
  noop: function(e) {
    e.preventDefault();
    return false;
  },
  stop: function(e) {
    e.stopPropagation();
    return false;
  },
  drop: function(e) {
    var reader;
    reader = new FileReader;
    reader.onload = function(e) {
      initiated = true;
      return editor.setValue(e.target.result);
    };
    return reader.readAsText(e.dataTransfer.files[0]);
  },
  settings: function() {
    return model.showSettings = true;
  },
  stores: Object.keys(state_.stores).map(function(key) {
    return {
      name: key
    };
  }),
  themes: ['serif', 'cv'].map(function(name) {
    return {
      name: name,
      click: function() {
        return state.theme = name;
      }
    };
  }),
  showSettings: false,
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
  closePopups: function() {
    return model.showSettings = false;
  },
  mouseout: function(e) {
    var from;
    from = e.relatedTarget || e.toElement;
    if (!from || from.nodeName === 'HTML') {
      return save();
    }
  },
  hotkey: function(e) {
    if (e.ctrlKey) {
      if (e.altKey) {
        switch (e.keyCode) {
          case 24:
            return state.mode = 'write';
          case 3:
            return state.mode = '';
          case 22:
            return state.mode = 'read';
        }
      } else {
        switch (e.keyCode) {
          case 19:
            return save(true);
        }
      }
    }
  }
};

state_.restore(null, null, function(err, data) {
  return restore(data);
});

state_.on('restore', function(data) {
  initiated = false;
  return restore(data);
});

vixen(document.body.parentNode, model);

window.onbeforeunload = function() {
  if (!saved) {
    return 'You have unsaved changes.';
  }
};


},{"./bring-the-noise.coffee":1,"./unify.coffee":3,"./state.coffee":6,"./state-gist.coffee":9,"./utils.coffee":10,"marked":11,"vixen":13}],13:[function(require,module,exports){
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

},{}]},{},[12])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXN0b3BoZXJmL0RvY3VtZW50cy9zcmMvZ2l0aHViL2RyLW1hcmtkb3duL2NvZmZlZS9icmluZy10aGUtbm9pc2UuY29mZmVlIiwiL1VzZXJzL2NocmlzdG9waGVyZi9Eb2N1bWVudHMvc3JjL2dpdGh1Yi9kci1tYXJrZG93bi9saWIvbm9pc2UuanMiLCIvVXNlcnMvY2hyaXN0b3BoZXJmL0RvY3VtZW50cy9zcmMvZ2l0aHViL2RyLW1hcmtkb3duL2NvZmZlZS91bmlmeS5jb2ZmZWUiLCIvVXNlcnMvY2hyaXN0b3BoZXJmL0RvY3VtZW50cy9zcmMvZ2l0aHViL2RyLW1hcmtkb3duL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZXZlbnRzLmpzIiwiL1VzZXJzL2NocmlzdG9waGVyZi9Eb2N1bWVudHMvc3JjL2dpdGh1Yi9kci1tYXJrZG93bi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvY2hyaXN0b3BoZXJmL0RvY3VtZW50cy9zcmMvZ2l0aHViL2RyLW1hcmtkb3duL2NvZmZlZS9zdGF0ZS5jb2ZmZWUiLCIvVXNlcnMvY2hyaXN0b3BoZXJmL0RvY3VtZW50cy9zcmMvZ2l0aHViL2RyLW1hcmtkb3duL2xpYi9iYXNlNjQuanMiLCIvVXNlcnMvY2hyaXN0b3BoZXJmL0RvY3VtZW50cy9zcmMvZ2l0aHViL2RyLW1hcmtkb3duL2NvZmZlZS94aHIuY29mZmVlIiwiL1VzZXJzL2NocmlzdG9waGVyZi9Eb2N1bWVudHMvc3JjL2dpdGh1Yi9kci1tYXJrZG93bi9jb2ZmZWUvc3RhdGUtZ2lzdC5jb2ZmZWUiLCIvVXNlcnMvY2hyaXN0b3BoZXJmL0RvY3VtZW50cy9zcmMvZ2l0aHViL2RyLW1hcmtkb3duL2NvZmZlZS91dGlscy5jb2ZmZWUiLCIvVXNlcnMvY2hyaXN0b3BoZXJmL0RvY3VtZW50cy9zcmMvZ2l0aHViL2RyLW1hcmtkb3duL25vZGVfbW9kdWxlcy9tYXJrZWQvbGliL21hcmtlZC5qcyIsIi9Vc2Vycy9jaHJpc3RvcGhlcmYvRG9jdW1lbnRzL3NyYy9naXRodWIvZHItbWFya2Rvd24vY29mZmVlL21haW4uY29mZmVlIiwiL1VzZXJzL2NocmlzdG9waGVyZi9Eb2N1bWVudHMvc3JjL2dpdGh1Yi9kci1tYXJrZG93bi9ub2RlX21vZHVsZXMvdml4ZW4vaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUEsV0FBQTs7QUFBQSxDQUFBLEVBQVEsRUFBUixFQUFRLE9BQUE7O0FBRVIsQ0FGQSxFQUVXLEtBQVgsQ0FBWTtDQUNWLElBQUEsQ0FBQTtDQUFBLENBQUEsQ0FBUSxFQUFSLEVBQVEsQ0FBUSxLQUFSO0NBQVIsQ0FDQSxDQUFhLENBQWIsQ0FBSyxLQURMO0NBQUEsQ0FFQSxDQUFrQixFQUFiLElBQUw7Q0FDUyxJQUFULENBQUEsRUFBUSxDQUFSLEVBQUEsU0FBQTtDQUpTOztBQU1YLENBUkEsQ0FRb0QsQ0FBVixFQUFBLENBQTFDLEVBQUEseUJBQVU7Ozs7QUNSVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkEsSUFBQSxNQUFBOztBQUFBLENBQUEsRUFBQTtDQUNFLENBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQURBLENBQ0E7Q0FEQSxDQUVBLENBRkEsRUFFQTtDQUZBLENBR0EsQ0FIQSxDQUdBO0NBSEEsQ0FJQSxDQUpBLENBSUE7Q0FKQSxDQUtBLENBTEEsRUFLQTtDQUxBLENBTUEsQ0FOQSxFQU1BO0NBTkEsQ0FPQSxDQVBBLENBT0E7Q0FQQSxDQVFBLENBUkEsRUFRQTtDQVJBLENBU0EsQ0FUQSxDQVNBO0NBVEEsQ0FVQSxDQVZBLENBVUE7Q0FWQSxDQVdBLENBWEEsQ0FXQTtDQVhBLENBWUEsQ0FaQSxFQVlBO0NBWkEsQ0FhQSxDQWJBLEVBYUE7Q0FiQSxDQWNBLENBZEEsRUFjQTtDQWZGLENBQUE7O0FBaUJBLENBakJBLENBaUJRLENBQUEsRUFBUixJQUFTO0NBQ1AsS0FBQSxPQUFBO0NBQUEsQ0FBQSxDQUFBLE1BQU07Q0FBTixDQUNBLENBQUksQ0FBQSxJQUFlLENBQU47Q0FBa0IsQ0FBTSxDQUFHLENBQVI7Q0FBRCxDQUFnQixFQUFBO0NBQTNDLENBQWtELENBQW5DLENBQUE7Q0FEbkIsQ0FFQSxDQUFRLEVBQVIsQ0FGQTtDQUdBLENBQUEsRUFBRyxXQUFBLEtBQUg7Q0FDSyxDQUFELENBQWtCLEVBQUEsTUFBcEIsQ0FBQTtDQUE0QixDQUFNLENBQUcsQ0FBUixFQUFBO0NBQUQsQ0FBZ0IsQ0FBTSxFQUFTLENBQWY7Q0FEOUMsQ0FDdUUsQ0FBckUsR0FBQTtJQUxJO0NBQUE7O0FBT1IsQ0F4QkEsRUF3QitCLEVBeEIvQixFQXdCb0IsQ0FBQSxFQUFWOztBQUNWLENBekJBLEVBeUIwQyxHQUF6QixDQXpCakIsRUF5QmlCLENBQVAsRUFBZ0I7Ozs7QUN6QjFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBLElBQUEseURBQUE7O0FBQUMsQ0FBRCxFQUFpQixJQUFBLENBQUEsSUFBakI7O0FBRUEsQ0FGQSxFQUVTLEdBQVQsQ0FBUyxRQUFBOztBQUdULENBTEEsQ0FLVSxDQUFWLE1BQU87Q0FBYyxFQUFVLENBQVYsQ0FBQSxDQUFBLEVBQWMsQ0FBbkI7Q0FBVjs7QUFDTixDQU5BLEVBTUEsTUFBTTtDQUFRLENBQUwsQ0FBQSxDQUFJLENBQTJCLENBQUEsRUFBL0IsQ0FBQTtDQUFIOztBQUVOLENBUkEsRUFRYyxNQUFBLEVBQWQ7Q0FDRSxLQUFBLEdBQUE7Q0FBQSxDQUFBLENBQU8sQ0FBUCxFQUFhLEVBQVM7Q0FBdEIsQ0FDQSxDQUFBLENBQVUsR0FBSjtTQUNOO0FBQWlCLENBQWpCLENBQVMsQ0FBQSxDQUFULENBQWdCLENBQWtCO0FBQ25CLENBRGYsQ0FDQSxDQUFPLENBQVAsQ0FBYyxDQUFWO0NBSlE7Q0FBQTs7QUFLZCxDQWJBLEVBYVksQ0FBQSxLQUFaO0NBQ1MsQ0FBK0IsQ0FBZixDQUF2QixFQUFNLEVBQVMsQ0FBZjtDQURVOztBQUdaLENBaEJBLEVBZ0JpQixFQUFBLENBQVgsQ0FBTixLQWhCQTs7QUFrQkEsQ0FsQkEsRUFrQmtCLEVBQWIsR0FsQkwsQ0FrQkE7O0FBQ0EsQ0FuQkEsRUFtQmdCLEVBQVgsQ0FuQkwsQ0FtQkE7O0FBRUEsQ0FyQkEsRUF5QkUsRUFKRyxDQUFMO0NBSUUsQ0FBQSxJQUFBO0NBQ0UsQ0FBTyxDQUFBLENBQVAsQ0FBQSxHQUFPLENBQUM7Q0FDRyxDQUFNLEVBQWYsRUFBcUIsRUFBckIsQ0FBNkIsSUFBN0I7Q0FERixJQUFPO0NBQVAsQ0FFUyxDQUFBLENBQVQsR0FBQSxDQUFTLENBQUM7Q0FDQyxDQUFNLEVBQWYsQ0FBZSxDQUFpQixFQUFoQyxLQUFBO0NBSEYsSUFFUztJQUhYO0NBQUEsQ0FLQSxHQUFBO0NBQ0UsQ0FBTyxDQUFBLENBQVAsQ0FBQSxHQUFPLENBQUM7O0NBQ0EsRUFBQSxLQUFOO1FBQUE7Q0FBQSxDQUNBLENBQXdDLENBQVEsRUFBaEQsQ0FBQSxFQUE0QyxFQUFoQixDQUFUO0NBQ1YsQ0FBTSxFQUFmLElBQUEsS0FBQTtDQUhGLElBQU87Q0FBUCxDQUlTLENBQUEsQ0FBVCxHQUFBLENBQVMsQ0FBQztDQUNDLENBQU0sQ0FBbUQsQ0FBbEUsQ0FBZSxDQUFpQixDQUFOLENBQTFCLEdBQXNELENBQVQsQ0FBN0M7Q0FMRixJQUlTO0lBVlg7Q0FBQSxDQVlBLEVBQUE7Q0FDRSxDQUFPLENBQUEsQ0FBUCxDQUFBLEdBQU8sQ0FBQztDQUNOLEdBQThDLEVBQTlDLEVBQUE7Q0FBQSxPQUFPLE9BQUEsV0FBQTtRQUFQO0NBQUEsQ0FDNkIsRUFBbEIsRUFBWDtDQUE2QixDQUFLLEVBQUwsSUFBQSxrQkFBQTtDQUE3QixDQUNFLENBQWdCLENBQVosQ0FBSixHQURTO0NBRVgsT0FBQSxLQUFBO0NBSkYsSUFBTztDQUFQLENBS1MsQ0FBQSxDQUFULEdBQUEsQ0FBUyxDQUFDO0NBQTBCLENBQU0sRUFBZixJQUFBLEtBQUE7Q0FBZSxDQUFLLEVBQUwsSUFBQTtDQUFBLENBQWMsRUFBTCxJQUFBO0NBQTFDLE9BQWtCO0NBTDNCLElBS1M7SUFsQlg7Q0F6QkYsQ0FBQTs7QUE2Q0EsQ0E3Q0EsQ0E2QzBCLENBQVosQ0FBQSxDQUFULEdBQVMsQ0FBQztDQUNiLENBQUEsRUFBK0IsS0FBL0I7Q0FBQSxFQUFrQixDQUFsQixDQUFLLElBQUw7SUFBQTtDQUNNLENBQTZDLENBQU0sQ0FBekQsQ0FBSyxDQUFRLENBQWIsRUFBQTtDQUNFLEdBQUEsT0FBQTtDQUFBLEVBQU8sR0FBUDtNQUFBO0NBQUEsRUFDZ0IsQ0FBaEIsQ0FBSyxFQUFMO0NBREEsR0FFQSxLQUFBO0NBQVUsQ0FBSyxFQUFMLENBQVUsQ0FBVixHQUFBO0NBQUEsQ0FBc0IsSUFBQSxDQUF0QjtDQUZWLEtBRUE7Q0FDVSxDQUFNLENBQWhCO0NBSkYsRUFBeUQ7Q0FGN0M7O0FBUWQsQ0FyREEsQ0FxRDRCLENBQVosRUFBWCxFQUFMLENBQWdCLENBQUM7Q0FDZixHQUFBLEVBQUE7Q0FBQSxDQUFBLEVBQU8sYUFBUCxFQUFHO0NBQ0QsQ0FBTyxFQUFQLEdBQWlDLElBQUE7SUFEbkM7Q0FFQSxDQUFBLEVBQStCLEtBQS9CO0NBQUEsRUFBa0IsQ0FBbEIsQ0FBSyxJQUFMO0lBRkE7Q0FBQSxDQUdBLENBQWdCLEVBQVgsRUFBTDtDQUNBLENBQUEsRUFBRyxXQUFIO0NBQ1EsQ0FBK0MsQ0FBQSxDQUFBLENBQWhELENBQVEsQ0FBYixFQUFhLEVBQWI7Q0FDVyxDQUFLLENBQWQsQ0FBQSxJQUFBLEtBQUE7Q0FERixJQUFxRDtJQUR2RCxFQUFBO0NBSUUsT0FBQSxHQUFBO0lBVFk7Q0FBQTs7QUFXaEIsQ0FoRUEsQ0FnRXNDLENBQUEsR0FBaEMsR0FBZ0MsR0FBdEMsSUFBQTtDQUNFLEtBQUEsa0JBQUE7Q0FBQSxDQUFBLEVBQUEsR0FBaUMsSUFBQTtDQUNqQyxDQUFBLEVBQUcsQ0FBZSxFQUFtQixFQUFsQztDQUNLLENBQW1CLENBQVMsQ0FBQSxDQUE3QixFQUFMLEVBQUEsRUFBQTtDQUNFLEdBQWtDLEVBQWxDLEtBQUE7Q0FBTSxDQUFnQixFQUF0QixDQUFLLElBQUwsTUFBQTtRQURnQztDQUFsQyxJQUFrQztJQUhBO0NBQUE7Ozs7QUNoRXRDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQSxHQUFBLENBQUE7O0FBQUEsQ0FBQSxDQUFZLENBQVosS0FBTSxDQUFDO0NBQ0wsS0FBQSx3QkFBQTtDQUFBLENBQUEsQ0FBUyxDQUFjLENBQXZCLENBQUE7QUFDSSxDQURKLENBQ0EsQ0FBSSxXQURKO0NBRUEsQ0FBQSxFQUFHLGFBQUE7Q0FDRCxDQUFlLENBQUcsQ0FBbEIsRUFBQTtJQURGLEVBQUEsMERBQUE7QUFHTSxDQUFKLEVBQUksQ0FBSixVQUFBO0NBQUEsQ0FDZSxDQUFHLENBQWxCLEVBQUE7SUFKRixFQUFBO0NBTUUsR0FBQSxPQUFPO0lBUlQ7Q0FBQSxDQVNBLENBQXVCLE1BQUEsU0FBdkI7Q0FDRSxHQUFBLENBQW1CLEtBQWhCO0NBQ0QsRUFBRyxDQUFBLEVBQUg7Q0FDVyxDQUFXLElBQXBCLEVBQUEsSUFBQSxHQUFBO01BREYsRUFBQTtDQUdXLENBQWMsTUFBdkIsRUFBQSxFQUFBLEdBQUE7UUFKSjtNQURxQjtDQVR2QixFQVN1QjtDQU12QjtDQUFBLE1BQUEsT0FBQTswQkFBQTtDQUFBLENBQTJCLEVBQTNCLENBQUEsQ0FBQSxVQUFBO0NBQUEsRUFmQTtDQUFBLENBZ0JBLENBQVUsQ0FBVjtDQWpCSSxRQWtCSjtDQWxCSTs7QUFvQk4sQ0FwQkEsQ0FvQmlCLENBQWQsQ0FBSCxJQUFXLENBQUM7Q0FDVixLQUFBLEdBQUE7Q0FBQSxDQUFBLENBQVksQ0FBQSxLQUFaO0NBQ0UsT0FBQSxFQUFBO0FBQWUsQ0FBZixHQUFBLFNBQUc7Q0FBc0IsQ0FBcUIsQ0FBZCxHQUFBLEVBQUEsS0FBQTtNQUFoQztDQUNBO0NBQ0UsRUFBTyxDQUFQLENBQU8sQ0FBUDtNQURGO0NBR0UsS0FESTtDQUNKLEVBQUEsQ0FBQSxFQUFBO01BSkY7Q0FLUyxDQUFLLENBQWQsQ0FBQSxJQUFBLEdBQUE7Q0FORixFQUFZO0NBQVosQ0FPQSxDQUFHLENBQUgsS0FBVztDQVBYLENBUUEsQ0FBRyxJQUFIO0NBQWMsQ0FBZ0IsRUFBaEIsVUFBQSxJQUFBO0NBUmQsR0FBQTtDQVNJLENBQUssQ0FBVCxNQUFBO0NBVlM7O0FBWVgsQ0FoQ0EsRUFnQ2lCLEdBQVgsQ0FBTjs7OztBQ2hDQSxJQUFBLE1BQUE7O0FBQUEsQ0FBQSxFQUFBLElBQU0sT0FBQTs7QUFDTixDQURBLEVBQ1EsRUFBUixFQUFRLFNBQUE7O0FBK0JSLENBaENBLEVBaUNFLENBREYsQ0FBSyxDQUFPO0NBQ1YsQ0FBQSxDQUFPLENBQUEsQ0FBUCxHQUFPLENBQUM7Q0FDTixHQUFBLElBQUE7Q0FBQSxPQUFPLEtBQUEsYUFBQTtNQUFQO0NBQ0ksRUFBRCxDQUFILE9BQUE7Q0FDRSxDQUFRLElBQVI7Q0FBQSxDQUNLLENBQUwsR0FBQSx3QkFEQTtDQUFBLENBR0UsRUFERixFQUFBO0NBQ0UsQ0FBYSxNQUFiLEdBQUEsZ0JBQUE7Q0FBQSxDQUVFLEdBREYsR0FBQTtDQUNFLENBQWUsUUFBZixHQUFBO0NBQWUsQ0FBUyxFQUFJLEdBQWIsS0FBQTtZQUFmO0NBQUEsQ0FDYSxRQUFiLENBQUE7Q0FBYSxDQUFTLEVBQUksR0FBYixFQUFTLEdBQVQ7WUFEYjtVQUZGO1FBSEY7RUFPRCxDQUFBLENBQUEsRUFSRCxHQVFFO0NBQXVCLENBQUssQ0FBZCxDQUFrQixJQUFsQixLQUFBO0NBUmhCLElBUUM7Q0FWSCxFQUFPO0NBQVAsQ0FXQSxDQUFTLElBQVQsQ0FBUyxDQUFDO0NBQ0osRUFBRCxDQUFILE9BQUE7Q0FBUyxDQUFJLENBQUosR0FBQSx5QkFBSTtFQUFvQyxDQUFBLENBQUEsRUFBakQsR0FBa0Q7Q0FDaEQsU0FBQSxvQkFBQTtDQUFBLENBRTZCLEtBR3pCO0NBQ0ssQ0FBSyxDQUFkLEtBQUEsS0FBQTtDQUFjLENBQUUsRUFBRixJQUFFO0NBQUYsQ0FBYSxFQUFMLENBQUssR0FBTDtDQVB5QixPQU8vQztDQVBGLElBQWlEO0NBWm5ELEVBV1M7Q0E1Q1gsQ0FBQTs7OztBQ0FBLENBQU8sRUFDTCxHQURJLENBQU47Q0FDRSxDQUFBLENBQW1CLE1BQUMsUUFBcEI7Q0FDRSxPQUFBLFdBQUE7Q0FBQSxFQUFBLENBQUE7Q0FFQSxHQUFBLElBQVcsQ0FBWDtDQUNFLENBQUUsR0FBRixDQUFBO0NBQUEsRUFDQSxHQUFBLEVBQWMsQ0FBVSxFQUFsQjtDQUROLEVBRVksQ0FBcUMsRUFBakQsRUFBb0IsQ0FBcEIsRUFBWTtBQUNnQixDQUg1QixDQUcyQixDQUF4QixFQUFpQyxDQUFwQyxHQUFBLEVBQUE7Q0FIQSxFQUlBLENBQWMsRUFBZCxHQUpBO0NBTVMsQ0FBRCxFQUFGLENBQTBDLENBUGxELFFBT1E7Q0FDTixDQUFRLENBQVIsR0FBQSxRQUFBO01BVkY7Q0FEaUIsVUFZakI7Q0FaRixFQUFtQjtDQUFuQixDQWNBLENBQVEsR0FBUixHQUFTO0NBQ1AsT0FBQSxvR0FBQTtDQUFBLEVBQVcsQ0FBWCxJQUFBLFdBQUE7Q0FBQSxDQUFBLENBQ1EsQ0FBUixDQUFBO0NBREEsRUFFUSxDQUFSLENBQUEsR0FBZ0I7Q0FGaEIsQ0FBQSxDQUdBLENBQUE7QUFDQSxDQUFBLFFBQUEsMkNBQUE7c0JBQUE7Q0FBQSxFQUFJLEdBQUo7Q0FBVyxDQUFHLE1BQUY7Q0FBRCxDQUFVLENBQUosS0FBQTtDQUFqQixPQUFBO0NBQUEsSUFKQTtDQUFBLEVBS0EsQ0FBQSxLQUFPO0NBQ0wsR0FBQSxNQUFBO2FBQUE7O0FBQUMsQ0FBQTtHQUFBLFdBQVcsbUZBQVg7Q0FDTSxFQUFFLENBQUgsQ0FBZ0I7Q0FEckI7WUFBQTtDQUFBOztDQUFELEVBQUEsQ0FBQTtDQU5GLElBS007Q0FMTixFQVNRLENBQVIsQ0FBQSxJQUFTO0NBQ1AsU0FBQSxrQkFBQTtDQUFBLEVBQUksR0FBSjtBQUNBLENBREEsQ0FBQSxJQUNBO0FBQ0MsQ0FBQTtHQUFBLFNBQTZCLDZHQUE3QjtDQUFBLEVBQUksRUFBTTtDQUFWO3VCQUhLO0NBVFIsSUFTUTtDQVRSLEVBYVEsQ0FBUixDQUFBLElBQVM7Q0FDUCxTQUFBLEdBQUE7Q0FBQSxHQUFjLENBQWQsQ0FBQTtDQUFBLENBQUEsQ0FBUSxFQUFSLEdBQUE7UUFBQTtBQUNBLENBQUE7VUFBQSxFQUFBO3dCQUFBO0NBQUEsRUFBRztDQUFIO3VCQUZNO0NBYlIsSUFhUTtDQUdSO0NBQUEsUUFBQSw0Q0FBQTttQkFBQTtDQUNFLEdBQUcsRUFBSCxNQUFHLE9BQUE7Q0FDRCxJQUFBLEdBQUE7Q0FDTyxHQUFELEVBRlIsRUFBQSxJQUVRLE9BQUE7Q0FDTixHQUFBLENBQUEsR0FBQTtNQUhGLEVBQUE7Q0FLRSxFQUFJLElBQUosQ0FBQTtDQUFBLElBQ0EsR0FBQTtDQUNBLEdBQXlCLENBQVUsR0FBbkM7Q0FBQSxDQUFlLENBQUEsQ0FBZixDQUFLLEtBQUw7VUFQRjtRQURGO0NBQUEsSUFoQkE7QUF5QkEsQ0FBQSxFQUFBLE1BQUEscUNBQUE7Q0FBQSxDQUFxQztDQUFyQyxDQUE4QixJQUE5QixNQUFBLENBQUE7Q0FBQSxJQXpCQTtDQURNLFVBMkJOO0NBekNGLEVBY1E7Q0FkUixDQTJDQSxDQUFPLEVBQVAsSUFBUTtDQUNOLE9BQUEsU0FBQTtDQUFBO0NBQUEsUUFBQSxrQ0FBQTtvQkFBQTtDQUNFLEVBQWMsQ0FDQyxDQUFBLENBRGYsR0FBQSxHQUNlLENBQUEsYUFERTtDQURuQixJQUFBO0NBREssVUFPTDtDQWxERixFQTJDTztDQTNDUCxDQW9EQSxDQUFBLE1BQU07Q0FDSixPQUFBO0dBQVMsR0FBVCxLQUFBOztDQUFVO0NBQUE7WUFBQSwrQkFBQTtzQkFBQTtDQUNSLENBQUcsQ0FDSyxFQURMLENBQUEsQ0FBQSxFQUFBLFFBQUE7Q0FESzs7Q0FBRCxDQUFBLENBTUksQ0FOSjtDQXJEWCxFQW9ESztDQXJEUCxDQUFBOzs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaG9DQSxJQUFBLDJOQUFBOztBQUFBLENBQUEsTUFBQSxtQkFBQTs7QUFFQSxDQUZBLEVBRVEsRUFBUixFQUFROztBQUNSLENBSEEsRUFHUyxHQUFULENBQVMsQ0FBQTs7QUFDVCxDQUpBLEtBSU0sSUFBTjtDQUNFLENBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxFQURBLEVBQ0E7Q0FEQSxDQUVBLEVBRkEsRUFFQTtDQUZBLENBR0EsRUFIQSxNQUdBO0NBUkYsQ0FJQTs7QUFNQSxDQVZBLE1BVUEsU0FBQTs7QUFFQSxDQVpBLEVBWVMsR0FBVCxDQUFTLFNBQUE7O0FBQ1QsQ0FiQSxNQWFBLGNBQUE7O0FBRUEsQ0FmQSxDQWVDLENBZkQsRUFlQSxDQUFBLENBQXVCLFNBQUE7O0FBRXZCLENBakJBLENBaUJnQixDQUFQLEdBQVQsR0FBVTtDQUFZLEdBQUEsRUFBQTs7R0FBVixDQUFGO0lBQVk7QUFBQSxDQUFBLEtBQUEsQ0FBQTtjQUFBO0lBQTRCO0NBQTVCLEVBQU8sR0FBUDtNQUFBO0NBQUEsRUFBQTtDQUFiLFFBQTZDO0NBQTdDOztBQUNULENBbEJBLENBa0JpQixDQUFQLElBQVYsRUFBVztDQUFZLEtBQUEsZUFBQTs7R0FBVixDQUFGO0lBQVk7QUFBQSxDQUFBLEVBQUEsSUFBQSxpQ0FBQTtFQUFjO0lBQWdCO0NBQTlCLEVBQU8sR0FBUDtNQUFBO0NBQUEsRUFBQTtDQUFiLFFBQStDO0NBQS9DOztBQUVWLENBcEJBLEVBb0JRLENBQUEsQ0FBUixJQUFTO0NBQ1AsS0FBQSxnQkFBQTtDQUFBLENBQUEsQ0FBUyxHQUFUO0NBQUEsQ0FDQSxDQUFPLENBQVAsS0FBUTtXQUNOO0NBQUEsQ0FBWSxFQUFaLEVBQUEsSUFBQTtDQUFBLENBQ0ssQ0FBTCxFQUFLLENBQUwsR0FBTTtDQUNKLEVBQUEsU0FBQTtDQUFBLEVBQUEsQ0FBYSxFQUFBLEVBQWI7Q0FBQSxFQUNlLENBQVIsQ0FEUCxDQUNPLEVBQVA7Q0FDRyxDQUFILENBQUEsRUFBQSxVQUFBO0NBSkYsTUFDSztDQURMLENBS0ssQ0FBTCxHQUFBLEdBQUs7Q0FBVSxHQUFBLEVBQUEsU0FBUDtDQUxSLE1BS0s7Q0FOQTtDQURQLEVBQ087Q0FPQSxDQUNMLElBREksQ0FDSixFQURGO0NBQ1UsQ0FBVSxFQUFSLEVBQUE7Q0FBUSxDQUFPLENBQUEsRUFBUCxDQUFBLEdBQU87Q0FBQSxjQUFHO0NBQVYsTUFBTztNQUFqQjtJQUFSOztBQUF1QyxDQUFBO1VBQUEsRUFBQTt1QkFBQTtDQUFBLENBQU8sRUFBUDtDQUFBOztDQUF2QztDQVZJOztBQVlSLENBaENBLEVBZ0NRLEVBQVIsR0FBZ0IsTUFBUjs7QUFDUixDQWpDQSxFQWlDUyxHQUFULEVBQWlCLE1BQVI7O0FBQ1QsQ0FsQ0EsRUFrQ2EsS0FBUSxFQUFyQixDQUFhLEdBQUE7O0FBRWIsQ0FwQ0EsRUFvQ1ksTUFBWjtDQUFxQixFQUFZLEVBQWIsQ0FBYSxHQUFsQjtDQUFIOztBQUNaLENBckNBLEVBcUNjLE1BQUEsRUFBZDtDQUF1QixJQUFOLENBQU0sR0FBTjtDQUFIOztBQUVkLENBdkNBLEVBdUNRLEVBQVI7Q0FDRSxDQUFBLENBQUEsTUFBTTtDQUNKLENBQUEsRUFBQTtDQUFBLEtBQUEsR0FBQTtNQUFBO0NBQ00sQ0FBVSxDQUFHLEVBQWQsRUFBTCxJQUFBO0NBRkYsRUFBSztDQUFMLENBR0EsQ0FBTyxFQUFQLElBQVE7Q0FDTixDQUFBLEVBQUE7Q0FDRSxHQUFHLENBQTJELENBQTlELEVBQVcsUUFBUixLQUFBO0NBQ0QsT0FBQSxHQUFBO0NBQ0EsRUFBQSxDQUFlLENBQUssR0FBcEI7Q0FBQSxRQUFBLENBQUE7VUFGRjtRQUFBO0NBR00sRUFBWSxFQUFiLElBQUwsSUFBQTtNQUpGO0NBTVEsRUFBWSxFQUFiLElBQUwsSUFBQTtNQVBHO0NBSFAsRUFHTztDQUhQLENBV0EsQ0FBTSxDQUFOLEtBQU87Q0FDQyxFQUFPLENBQWIsQ0FBSyxNQUFMO0NBQWEsQ0FDSixHQUFQLENBQUEsTUFEVztDQUFBLENBRUwsRUFBTixFQUFBLEtBRlc7Q0FHWCxHQUFBLEVBQUE7Q0FmSixFQVdNO0NBWE4sQ0FnQkEsQ0FBTyxFQUFQLElBQVE7Q0FDQSxFQUFRLEVBQVQsTUFBTDtDQWpCRixFQWdCTztDQXhEVCxDQXVDUTs7QUFvQlIsQ0EzREEsRUEyRFcsS0FBWCxDQUFXO0NBQ1QsS0FBQTtDQUFBLENBQUEsQ0FBQSxFQUFNLEdBQVEsS0FBUjtDQUFOLENBQ0EsQ0FBRyxHQUEyQixHQUE5QixDQUF3QixNQUFBO0NBRHhCLENBS0EsQ0FBbUIsQ0FBbkIsR0FBVSxDQUFNLENBQWlDLE9BQWpDO0NBQTRDLENBQUosQ0FBRyxRQUFIO0NBQXhELEVBQWdEO0NBQzVDLEVBQUQsTUFBSDtDQVBTOztBQVNYLENBcEVBLEVBb0VZLEVBcEVaLElBb0VBOztBQUNBLENBckVBLEVBcUVRLENBckVSLENBcUVBOztBQUVBLENBdkVBLEVBdUVPLENBQVAsQ0FBTyxJQUFDO0FBQ0MsQ0FBUCxDQUFBLEVBQUcsQ0FBQTtDQUNNLENBQ0wsRUFERixDQUFBLENBQU0sS0FBTjtDQUNFLENBQU0sRUFBTixFQUFBLEVBQU07Q0FBTixDQUNNLEVBQU4sQ0FBTSxDQUFOO0NBQW9CLENBQU0sR0FBTixHQUFBO0FBQStCLENBQS9CLENBQTJCLEdBQTNCLEdBQWtCO0NBRHRDLE9BQ007RUFDUCxDQUFBLEdBSEQsR0FHRTtDQUNBLEVBQVksRUFBWixDQUFBLEtBQUE7Q0FDQSxVQUFBLEVBQUE7Q0FMRixJQUdDO0lBTEU7Q0FBQTs7QUFTUCxDQWhGQSxFQWdGYSxNQUFBLENBQWI7Q0FDRSxLQUFBLGtFQUFBO0NBQUEsQ0FBQSxDQUFRLENBQVIsQ0FBQSxDQUFjLEdBQU47Q0FBUixDQUNBLENBQUssQ0FBQSxDQUFBLENBQU0sRUFBTjtDQURMLENBRUEsRUFBYSxDQUFWLHNCQUZIO0NBQUEsQ0FHQSxDQUFLLENBQUE7Q0FITCxDQUlBLENBQUksR0FKSjtDQUFBLENBS0EsQ0FBYyxHQUFBLEdBQWQ7Q0FDQSxDQUFBLEVBQWlCLENBQUs7Q0FBdEIsR0FBQSxPQUFBO0lBTkE7Q0FPQSxDQUFBLENBQUEsQ0FBZSxDQUFLO0NBQXBCLEdBQUEsS0FBQTtJQVBBO0NBQUEsQ0FRQSxDQUFZLE1BQVosQ0FBc0I7Q0FSdEIsQ0FTQSxDQUFhLE9BQWIsRUFUQTtDQUFBLENBVUEsQ0FBYSxLQUFRLEVBQXJCLElBQWE7Q0FWYixDQVdBLENBQVksTUFBWixDQUFzQjtDQVh0QixDQVlBLENBQWUsT0FBVSxFQUF6QjtDQUNBLENBQUEsQ0FBZSxDQUFaLEtBQUEsQ0FBcUMsRUFBeEM7Q0FDYSxFQUFZLE1BQXZCLENBQVUsQ0FBVjtJQWZTO0NBQUE7O0FBaUJiLENBakdBLEVBaUdjLE1BQUEsRUFBZDtDQUNXLENBQVMsQ0FBRCxFQUFqQixHQUFRLENBQVI7Q0FEWTs7QUFHZCxDQXBHQSxFQW9HWSxDQXBHWixLQW9HQTs7QUFDQSxDQXJHQSxDQXNHRSxDQURPLEdBQVQsRUFBeUMsRUFBdEIsRUFBVixFQUF3QjtDQUMvQixDQUFBLEVBQUEsQ0FBQTtDQUFBLENBQ0EsR0FBQSxJQURBO0NBQUEsQ0FFQSxHQUZBLE1BRUE7Q0FGQSxDQUdBLEVBSEEsUUFHQTtDQUhBLENBSUEsR0FKQSxHQUlBO0NBMUdGLENBcUdTOztBQU1ULENBM0dBLENBMkdBLENBQW9CLEdBQWQsRUFBTixDQUFvQjtDQUNsQixDQUFBLFFBQUE7Q0FDQSxDQUFBLEVBQUcsS0FBSDtDQUNFLEdBQUEsQ0FBQTtDQUNFLEVBQVEsRUFBUixDQUFBO0NBQUEsS0FDQSxLQUFBO01BRkY7Q0FBQSxHQUdBLEtBQUEsR0FBQTtDQUN1QixDQUFNLENBQWpCLENBQUEsS0FBWixDQUFZLENBQVo7SUFMRixFQUFBO0NBT0UsVUFBQTtJQVRnQjtDQUFBOztBQVdwQixDQXRIQSxFQXNIVSxDQUFBLEdBQVYsRUFBVztDQUNULEtBQUEsaUJBQUE7Q0FBQSxDQUFBLENBQWMsR0FBTSxFQUFOLEdBQWQ7Q0FDQSxDQUFBLEVBQUc7Q0FDRCxDQUFRLEVBQU47Q0FBRixDQUNjLEVBQWQsQ0FBQSxDQUFBO0NBQ0EsR0FBQSxDQUE0QyxNQUE1QyxHQUF3QjtDQUF4QixHQUFBLEVBQUEsRUFBQTtNQUhGO0lBQUEsRUFBQSxLQUFBO0NBS0UsR0FBQTtJQU5GO0NBQUEsQ0FPQSxDQUFjLENBQWUsQ0FBeEIsRUFQTDtDQURRLEVBU0ksTUFBWjtDQVRROztBQVdWLENBaklBLEVBa0lFLEVBREY7Q0FDRSxDQUFBLENBQU0sQ0FBTixLQUFPO0NBQU0sR0FBQTtDQUFBLFlBQVU7TUFBVjtDQUFBLFlBQWtCO01BQXpCO0NBQU4sRUFBTTtDQUFOLENBQ0EsQ0FBTSxDQUFOLEtBQU87Q0FBTSxHQUFBO0NBQUEsWUFBVTtNQUFWO0NBQUEsWUFBc0I7TUFBN0I7Q0FETixFQUNNO0NBRE4sQ0FFQSxDQUFNLENBQU4sS0FBTztDQUFNLEdBQUEsVUFBQTtDQUFQLFVBQTJCO0NBRmpDLEVBRU07Q0FGTixDQUdBLENBQU0sQ0FBTixLQUFPO0NBQU0sR0FBQSxXQUFBO0NBQVAsVUFBNEI7Q0FIbEMsRUFHTTtDQUhOLENBSUEsQ0FBTSxDQUFOLEtBQU87Q0FDTCxLQUFBLEVBQUE7QUFBUyxDQUFULEVBQVMsQ0FBVCxFQUFBLElBQUE7Q0FBQSxFQUNnQixDQUFoQixFQUFNLEdBQVc7Q0FDZixFQUFZLENBQVosRUFBQSxHQUFBO0NBQ08sS0FBRCxFQUFOLEtBQUE7Q0FIRixJQUNnQjtDQUdULElBQWdDLENBQWpDLElBQU4sQ0FBQSxDQUFnQztDQVRsQyxFQUlNO0NBSk4sQ0FVQSxDQUFVLEtBQVYsQ0FBVTtDQUNGLEVBQWUsRUFBaEIsTUFBTCxDQUFBO0NBWEYsRUFVVTtDQVZWLENBWUEsQ0FBUSxDQUFBLEVBQVIsR0FBd0M7V0FBUTtDQUFBLENBQU0sQ0FBTixDQUFBLEVBQUE7Q0FBVDtDQUEvQixFQUErQjtDQVp2QyxDQWFBLENBQVEsQ0FBQSxFQUFSLENBQVEsRUFBdUI7V0FDN0I7Q0FBQSxDQUFNLEVBQU4sRUFBQTtDQUFBLENBQ08sQ0FBQSxFQUFQLENBQUEsR0FBTztDQUFTLEVBQVEsRUFBVCxVQUFMO0NBRFYsTUFDTztDQUZxQjtDQUF0QixFQUFzQjtDQWI5QixDQWdCQSxHQWhCQSxPQWdCQTtDQWhCQSxDQWlCQSxDQUFPLEVBQVAsSUFBTztDQUFVLElBQVAsQ0FBTSxLQUFOO0NBakJWLEVBaUJPO0NBakJQLENBa0JBLEVBQUE7Q0FsQkEsQ0FtQkEsQ0FBVyxNQUFYO0FBQThCLENBQVYsRUFBTixFQUFLLE1BQUw7Q0FuQmQsRUFtQlc7Q0FuQlgsQ0FvQkEsQ0FBYSxNQUFBLEVBQWI7QUFBa0MsQ0FBWixFQUFRLEVBQVQsTUFBTDtDQXBCaEIsRUFvQmE7Q0FwQmIsQ0FxQkEsQ0FBYSxNQUFBLEVBQWI7Q0FDUSxDQUFRLENBQUQsQ0FBYixDQUFLLEVBQVEsSUFBYjtDQXRCRixFQXFCYTtDQXJCYixDQXVCQSxDQUFZLE1BQUEsQ0FBWjtDQUNRLENBQVEsQ0FBRCxDQUFiLENBQUssQ0FBUSxLQUFiO0NBeEJGLEVBdUJZO0NBdkJaLENBeUJBLENBQWEsTUFBQSxFQUFiO0NBQXNCLEVBQWUsRUFBaEIsTUFBTCxDQUFBO0NBekJoQixFQXlCYTtDQXpCYixDQTBCQSxDQUFVLEtBQVYsQ0FBVztDQUNULEdBQUEsSUFBQTtDQUFBLEVBQU8sQ0FBUCxLQUFBLElBQU87QUFDTyxDQUFkLEdBQUEsQ0FBdUMsQ0FBdkMsRUFBc0I7Q0FBdEIsR0FBQSxTQUFBO01BRlE7Q0ExQlYsRUEwQlU7Q0ExQlYsQ0E2QkEsQ0FBUSxHQUFSLEdBQVM7Q0FDUCxHQUFBLEdBQUE7Q0FDRSxHQUFHLEVBQUg7Q0FDRSxNQUFBLFNBQU87Q0FBUCxDQUFBLGFBQ087Q0FBYyxFQUFPLENBQWIsQ0FBSyxjQUFMO0NBRGYsY0FFTztDQUFhLEVBQU8sQ0FBYixDQUFLLGNBQUw7Q0FGZCxDQUFBLGFBR087Q0FBYyxFQUFPLENBQWIsQ0FBSyxjQUFMO0NBSGYsUUFERjtNQUFBLEVBQUE7Q0FNRSxNQUFBLFNBQU87Q0FBUCxDQUFBLGFBQ087Q0FBYSxHQUFMLGVBQUE7Q0FEZixRQU5GO1FBREY7TUFETTtDQTdCUixFQTZCUTtDQS9KVixDQUFBOztBQTBLQSxDQTFLQSxDQTBLcUIsQ0FBTSxDQUEzQixFQUFNLENBQU4sRUFBNEI7Q0FBc0IsR0FBUixHQUFBLEVBQUE7Q0FBZjs7QUFDM0IsQ0EzS0EsQ0EyS0EsQ0FBcUIsQ0FBQSxFQUFmLEdBQU47Q0FDRSxDQUFBLENBQVksRUFBWixJQUFBO0NBQ1EsR0FBUixHQUFBLEVBQUE7Q0FGbUI7O0FBSXJCLENBL0tBLENBK0tnQyxFQUFiLENBQW5CLEdBQWMsRUFBZDs7QUFFQSxDQWpMQSxFQWlMd0IsR0FBbEIsR0FBa0IsS0FBeEI7QUFDcUMsQ0FBbkMsQ0FBQSxFQUErQixDQUEvQjtDQUFBLFVBQUE7SUFEc0I7Q0FBQTs7OztBQ2pMeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsibm9pc2UgPSByZXF1aXJlICcuLi9saWIvbm9pc2UnXG5cbmFkZFN0eWxlID0gKGNzcykgLT5cbiAgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdzdHlsZSdcbiAgc3R5bGUudHlwZSA9ICd0ZXh0L2NzcydcbiAgc3R5bGUuaW5uZXJIVE1MID0gY3NzXG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQgc3R5bGVcblxuYWRkU3R5bGUgXCIubm9pc2UgeyBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoI3tub2lzZSAxMjgsMTI4LFswLDAsMCwwXSxbMCwwLDAsMHg4XX0pOyB9XCJcbiIsInZhciBCWVRFNCA9IDQyOTQ5NjcyOTY7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odywgaCwgbWluLCBzcGFuKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSxcbiAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuICAgICAgaSwgaiwgaW1hZ2VEYXRhLCBybmQ7XG5cbiAgaWYgKCEobWluIGluc3RhbmNlb2YgQXJyYXkpKSBtaW4gPSBbbWluLCBtaW4sIG1pbiwgMHhGRl07XG4gIGVsc2UgZm9yICg7bWluLmxlbmd0aCA8IDQ7IG1pbi5wdXNoKG1pbi5sZW5ndGggPT09IDMgPyAweEZGIDogbWluW21pbi5sZW5ndGgtMV0pKTtcbiAgaWYgKCEoc3BhbiBpbnN0YW5jZW9mIEFycmF5KSkgc3BhbiA9IFtzcGFuLCBzcGFuLCBzcGFuLCAweEZGXTtcbiAgZWxzZSBmb3IgKDtzcGFuLmxlbmd0aCA8IDQ7IHNwYW4ucHVzaChzcGFuLmxlbmd0aCA9PT0gMyA/IDB4RkYgOiBzcGFuW3NwYW4ubGVuZ3RoLTFdKSk7XG5cbiAgY2FudmFzLndpZHRoID0gdztcbiAgY2FudmFzLmhlaWdodCA9IGg7XG5cbiAgaW1hZ2VEYXRhID0gY3R4LmNyZWF0ZUltYWdlRGF0YShjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICBmb3IgKGkgPSBpbWFnZURhdGEuZGF0YS5sZW5ndGg7IChpLT00KSA+PSAwOykge1xuICAgIHJuZCA9IE1hdGgucmFuZG9tKCkgKiBCWVRFNDtcbiAgICBmb3IgKGogPSAwOyBqIDwgNDsgaisrKVxuICAgICAgaW1hZ2VEYXRhLmRhdGFbaSArIGpdID0gc3BhbltqXVxuICAgICAgICA/ICgoKChybmQ+PmoqOCkmMHhGRikvMHhGRiAqIHNwYW5bal0pIHwgMCkgKyBtaW5bal1cbiAgICAgICAgOiBtaW5bal07XG4gIH1cblxuICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCk7XG59O1xuIiwibWFwID1cclxuICAnPD0nOiAn4oeQJyAjICdcXHUyMWQwJ1xyXG4gICc9Pic6ICfih5InICMgJ1xcdTIxZDInXHJcbiAgJzw9Pic6ICfih5QnICMgJ1xcdTIxZDQnXHJcbiAgJzwtJzogJ+KGkCcgIyAnXFx1MjE5MCdcclxuICAnLT4nOiAn4oaSJyAjICdcXHUyMTkyJ1xyXG4gICc8LT4nOiAn4oaUJyAjICdcXHUyMTk0J1xyXG4gICcuLi4nOiAn4oCmJ1xyXG4gICctLSc6ICfigJMnXHJcbiAgJy0tLSc6ICfigJQnXHJcbiAgJ14xJzogJ8K5J1xyXG4gICdeMic6ICfCsidcclxuICAnXjMnOiAnwrMnXHJcbiAgJzEvMic6ICfCvSdcclxuICAnMS80JzogJ8K8J1xyXG4gICczLzQnOiAnwr4nXHJcblxyXG51bmlmeSA9IChjbSkgLT5cclxuICBwb3MgPSBjbS5nZXRDdXJzb3IoKVxyXG4gIG0gPSAvW15cXHNdKyQvLmV4ZWMgY20uZ2V0UmFuZ2Uge2xpbmU6cG9zLmxpbmUsIGNoOjB9LCBwb3NcclxuICB0b2tlbiA9IG0/WzBdXHJcbiAgaWYgdG9rZW4/IGFuZCBtYXBbdG9rZW5dP1xyXG4gICAgY20ucmVwbGFjZVJhbmdlIG1hcFt0b2tlbl0sIHtsaW5lOnBvcy5saW5lLCBjaDpwb3MuY2gtdG9rZW4ubGVuZ3RofSwgcG9zXHJcblxyXG5Db2RlTWlycm9yLmNvbW1hbmRzWyd1bmlmeSddID0gdW5pZnlcclxuQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdFsnQ3RybC1TcGFjZSddID0gJ3VuaWZ5J1xyXG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7aWYgKCFwcm9jZXNzLkV2ZW50RW1pdHRlcikgcHJvY2Vzcy5FdmVudEVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcHJvY2Vzcy5FdmVudEVtaXR0ZXI7XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nXG4gICAgPyBBcnJheS5pc0FycmF5XG4gICAgOiBmdW5jdGlvbiAoeHMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9XG47XG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4ID09PSB4c1tpXSkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4vLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbi8vXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBuO1xufTtcblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc0FycmF5KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKVxuICAgIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiBmYWxzZTtcbiAgdmFyIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGlmICghaGFuZGxlcikgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZExpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cbiAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICAgIHZhciBtO1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5vbih0eXBlLCBmdW5jdGlvbiBnKCkge1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNBcnJheShsaXN0KSkge1xuICAgIHZhciBpID0gaW5kZXhPZihsaXN0LCBsaXN0ZW5lcik7XG4gICAgaWYgKGkgPCAwKSByZXR1cm4gdGhpcztcbiAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT0gMClcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdID09PSBsaXN0ZW5lcikge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICh0eXBlICYmIHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICB9XG4gIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGlmIChldi5zb3VyY2UgPT09IHdpbmRvdyAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJ7RXZlbnRFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50cydcblxuYmFzZTY0ID0gcmVxdWlyZSAnLi4vbGliL2Jhc2U2NCdcbiNsencgPSByZXF1aXJlICcuLi9saWIvbHp3J1xuXG5wYWQgPSAobiwgcCkgLT4gKG5ldyBBcnJheShwICsgMSAtIG4udG9TdHJpbmcoKS5sZW5ndGgpKS5qb2luKCcwJykgKyBuXG5ybmQgPSAtPiBEYXRlLm5vdygpLnRvU3RyaW5nKDE2KSArIHBhZCAoTWF0aC5yYW5kb20oKSo2NTUzNnwwKS50b1N0cmluZygxNiksIDRcblxuZGVzZXJpYWxpemUgPSAtPlxuICBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyIDFcbiAgcG9zID0gaGFzaC5pbmRleE9mICcvJ1xuICB0eXBlOiBpZiBwb3MgaXMgLTEgdGhlbiBoYXNoIGVsc2UgaGFzaC5zdWJzdHIgMCwgcG9zXG4gIGlkOiBpZiBwb3MgaXMgLTEgdGhlbiB1bmRlZmluZWQgZWxzZSBoYXNoLnN1YnN0ciBwb3MrMVxuc2VyaWFsaXplID0gKGRhdGEpIC0+XG4gIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyMnK2RhdGEudHlwZSsoaWYgZGF0YS5pZCB0aGVuICcvJytkYXRhLmlkIGVsc2UgJycpXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGUgPSBuZXcgRXZlbnRFbWl0dGVyXG5cbnN0YXRlLnN0b3JlVHlwZSA9ICdiYXNlNjQnXG5zdGF0ZS5zdG9yZUlkID0gdW5kZWZpbmVkXG5cbnN0YXRlLnN0b3JlcyA9XG4gICNsenc6XG4gICMgIHN0b3JlOiAoZGF0YSwgZm4pIC0+IGZuIGJhc2U2NC5lbmNvZGUgbHp3LmVuY29kZSBkYXRhXG4gICMgIHJlc3RvcmU6IChkYXRhLCBmbikgLT4gZm4gbHp3LmRlY29kZSBiYXNlNjQuZGVjb2RlIGRhdGFcbiAgYmFzZTY0OlxuICAgIHN0b3JlOiAoaWQsIGRhdGEsIGNhbGxiYWNrKSAtPlxuICAgICAgY2FsbGJhY2sgbnVsbCwgYmFzZTY0LmVuY29kZSBKU09OLnN0cmluZ2lmeShkYXRhIG9yICd7fScpXG4gICAgcmVzdG9yZTogKGlkLCBjYWxsYmFjaykgLT5cbiAgICAgIGNhbGxiYWNrIG51bGwsIEpTT04ucGFyc2UgYmFzZTY0LmRlY29kZShpZCkgb3IgJ3t9J1xuICBsb2NhbDpcbiAgICBzdG9yZTogKGlkLCBkYXRhLCBjYWxsYmFjaykgLT5cbiAgICAgIGlkID89IHJuZCgpXG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0gJ21hcmtkb3duLScraWQsIEpTT04uc3RyaW5naWZ5KGRhdGEgb3IgJ3t9JylcbiAgICAgIGNhbGxiYWNrIG51bGwsIGlkXG4gICAgcmVzdG9yZTogKGlkLCBjYWxsYmFjaykgLT5cbiAgICAgIGNhbGxiYWNrIG51bGwsIEpTT04ucGFyc2Ugd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdtYXJrZG93bi0nK2lkKSBvciAne30nXG4gIGZpbGU6XG4gICAgc3RvcmU6IChpZCwgZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgICByZXR1cm4gY2FsbGJhY2sgJ0F1dG8gc2F2ZSBub3Qgc3VwcG9ydGVkLicgaWYgZGF0YS5tZXRhLmF1dG9zYXZlXG4gICAgICBzYXZlQXMgbmV3IEJsb2IoW2RhdGEudGV4dF0sIHR5cGU6J3RleHQvcGxhaW47Y2hhcnNldD11dGYtOCcpLFxuICAgICAgICBkYXRhLm1ldGEudGl0bGUrJy5tZCdcbiAgICAgIGNhbGxiYWNrKClcbiAgICByZXN0b3JlOiAoaWQsIGNhbGxiYWNrKSAtPiBjYWxsYmFjayBudWxsLCB0ZXh0OicnLCBtZXRhOnt9XG5cbnN0YXRlLnN0b3JlID0gKHN0b3JlVHlwZSwgZGF0YSwgY2FsbGJhY2spIC0+XG4gIHN0YXRlLnN0b3JlVHlwZSA9IHN0b3JlVHlwZSBpZiBzdG9yZVR5cGVcbiAgc3RhdGUuc3RvcmVzW3N0YXRlLnN0b3JlVHlwZV0uc3RvcmUgc3RhdGUuc3RvcmVJZCwgZGF0YSwgKGVyciwgc3RvcmVJZCkgLT5cbiAgICByZXR1cm4gY2FsbGJhY2s/IGVyciBpZiBlcnI/XG4gICAgc3RhdGUuc3RvcmVJZCA9IHN0b3JlSWRcbiAgICBzZXJpYWxpemUgdHlwZTpzdGF0ZS5zdG9yZVR5cGUsIGlkOnN0b3JlSWRcbiAgICBjYWxsYmFjaz8gbnVsbCwgc3RvcmVJZFxuXG5zdGF0ZS5yZXN0b3JlID0gKHN0b3JlVHlwZSwgc3RvcmVJZCwgY2FsbGJhY2spIC0+XG4gIGlmIG5vdCBzdG9yZVR5cGU/IGFuZCBub3Qgc3RvcmVJZD9cbiAgICB7IHR5cGU6c3RvcmVUeXBlLCBpZDpzdG9yZUlkIH0gPSBkZXNlcmlhbGl6ZSgpXG4gIHN0YXRlLnN0b3JlVHlwZSA9IHN0b3JlVHlwZSBpZiBzdG9yZVR5cGVcbiAgc3RhdGUuc3RvcmVJZCA9IHN0b3JlSWRcbiAgaWYgc3RvcmVJZD9cbiAgICBzdGF0ZS5zdG9yZXNbc3RhdGUuc3RvcmVUeXBlXS5yZXN0b3JlIHN0YXRlLnN0b3JlSWQsIChlcnIsIGRhdGEpIC0+XG4gICAgICBjYWxsYmFjayBlcnIsIGRhdGFcbiAgZWxzZVxuICAgIGNhbGxiYWNrKClcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ2hhc2hjaGFuZ2UnLCAtPlxuICB7IHR5cGU6c3RvcmVUeXBlLCBpZDpzdG9yZUlkIH0gPSBkZXNlcmlhbGl6ZSgpXG4gIGlmIHN0b3JlVHlwZSBpc250IHN0YXRlLnN0b3JlVHlwZSBvciBzdG9yZUlkIGlzbnQgc3RhdGUuc3RvcmVJZFxuICAgIHN0YXRlLnJlc3RvcmUgc3RvcmVUeXBlLCBzdG9yZUlkLCAoZXJyLCBkYXRhKSAtPlxuICAgICAgc3RhdGUuZW1pdCAncmVzdG9yZScsIGRhdGEgaWYgbm90IGVycj9cbiIsIi8qKlxuICpcbiAqICBiYXNlNjQgZW5jb2RlIC8gZGVjb2RlXG4gKiAgaHR0cDovL3d3dy53ZWJ0b29sa2l0LmluZm8vXG4gKlxuICoqL1xuXG52YXIgYmFzZTY0ID0ge1xuXG4gIC8vIHByaXZhdGUgcHJvcGVydHlcbiAgX2tleVN0ciA6IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIixcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBlbmNvZGluZ1xuICBlbmNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMywgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGJhc2U2NC5fdXRmOF9lbmNvZGUoaW5wdXQpO1xuXG4gICAgd2hpbGUgKGkgPCBpbnB1dC5sZW5ndGgpIHtcblxuICAgICAgY2hyMSA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgIGNocjIgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIzID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICBlbmMxID0gY2hyMSA+PiAyO1xuICAgICAgZW5jMiA9ICgoY2hyMSAmIDMpIDw8IDQpIHwgKGNocjIgPj4gNCk7XG4gICAgICBlbmMzID0gKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNik7XG4gICAgICBlbmM0ID0gY2hyMyAmIDYzO1xuXG4gICAgICBpZiAoaXNOYU4oY2hyMikpIHtcbiAgICAgICAgZW5jMyA9IGVuYzQgPSA2NDtcbiAgICAgIH0gZWxzZSBpZiAoaXNOYU4oY2hyMykpIHtcbiAgICAgICAgZW5jNCA9IDY0O1xuICAgICAgfVxuXG4gICAgICBvdXRwdXQgPSBvdXRwdXQgK1xuICAgICAgICB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzEpICsgdGhpcy5fa2V5U3RyLmNoYXJBdChlbmMyKSArXG4gICAgICAgIHRoaXMuX2tleVN0ci5jaGFyQXQoZW5jMykgKyB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzQpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSxcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBkZWNvZGluZ1xuICBkZWNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMztcbiAgICB2YXIgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXFw9XS9nLCBcIlwiKTtcblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG5cbiAgICAgIGVuYzEgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG4gICAgICBlbmMyID0gdGhpcy5fa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuICAgICAgZW5jMyA9IHRoaXMuX2tleVN0ci5pbmRleE9mKGlucHV0LmNoYXJBdChpKyspKTtcbiAgICAgIGVuYzQgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG5cbiAgICAgIGNocjEgPSAoZW5jMSA8PCAyKSB8IChlbmMyID4+IDQpO1xuICAgICAgY2hyMiA9ICgoZW5jMiAmIDE1KSA8PCA0KSB8IChlbmMzID4+IDIpO1xuICAgICAgY2hyMyA9ICgoZW5jMyAmIDMpIDw8IDYpIHwgZW5jNDtcblxuICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIxKTtcblxuICAgICAgaWYgKGVuYzMgIT0gNjQpIHtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIyKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmM0ICE9IDY0KSB7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dCArIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyMyk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBvdXRwdXQgPSBiYXNlNjQuX3V0ZjhfZGVjb2RlKG91dHB1dCk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuXG4gIH0sXG5cbiAgLy8gcHJpdmF0ZSBtZXRob2QgZm9yIFVURi04IGVuY29kaW5nXG4gIF91dGY4X2VuY29kZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7XG4gICAgdmFyIHV0ZnRleHQgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCBzdHJpbmcubGVuZ3RoOyBuKyspIHtcblxuICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChuKTtcblxuICAgICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZigoYyA+IDEyNykgJiYgKGMgPCAyMDQ4KSkge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gNikgfCAxOTIpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiAxMikgfCAyMjQpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjID4+IDYpICYgNjMpIHwgMTI4KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB1dGZ0ZXh0O1xuICB9LFxuXG4gIC8vIHByaXZhdGUgbWV0aG9kIGZvciBVVEYtOCBkZWNvZGluZ1xuICBfdXRmOF9kZWNvZGUgOiBmdW5jdGlvbiAodXRmdGV4dCkge1xuICAgIHZhciBzdHJpbmcgPSBcIlwiO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgYyA9IGMxID0gYzIgPSAwO1xuXG4gICAgd2hpbGUgKCBpIDwgdXRmdGV4dC5sZW5ndGggKSB7XG5cbiAgICAgIGMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcbiAgICAgICAgYzIgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsxKTtcbiAgICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMzEpIDw8IDYpIHwgKGMyICYgNjMpKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XG4gICAgICAgIGMzID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMik7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDE1KSA8PCAxMikgfCAoKGMyICYgNjMpIDw8IDYpIHwgKGMzICYgNjMpKTtcbiAgICAgICAgaSArPSAzO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZTY0O1xuIiwieGhyID0gKG9wdCwgY2FsbGJhY2spIC0+XG4gIG1ldGhvZCA9IG9wdC5tZXRob2Qgb3IgJ0dFVCdcbiAgciA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuICBpZiAnd2l0aENyZWRlbnRpYWxzJyBvZiByXG4gICAgci5vcGVuIG1ldGhvZCwgb3B0LnVybCwgdHJ1ZVxuICBlbHNlIGlmIFhEb21haW5SZXF1ZXN0P1xuICAgIHIgPSBuZXcgWERvbWFpblJlcXVlc3RcbiAgICByLm9wZW4gbWV0aG9kLCBvcHQudXJsXG4gIGVsc2VcbiAgICByZXR1cm4gbnVsbFxuICByLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IC0+XG4gICAgaWYgci5yZWFkeVN0YXRlIGlzIDRcbiAgICAgIGlmIHIuc3RhdHVzID49IDIwMCBhbmQgci5zdGF0dXMgPCAzMDBcbiAgICAgICAgY2FsbGJhY2sgdW5kZWZpbmVkLCByLnJlc3BvbnNlVGV4dCwgclxuICAgICAgZWxzZVxuICAgICAgICBjYWxsYmFjayByLnN0YXR1c1RleHQsIHIucmVzcG9uc2VUZXh0LCByXG4gIHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSBmb3IgaGVhZGVyLCB2YWx1ZSBvZiBvcHQuaGVhZGVyc1xuICByLnNlbmQgb3B0LmRhdGFcbiAgclxuXG54aHIuanNvbiA9IChvcHQsIGNhbGxiYWNrKSAtPlxuICBjYWxsYmFja18gPSAoZXJyLCBqc29uLCB4aHIpIC0+XG4gICAgaWYgZXJyPyBvciBub3QganNvbiB0aGVuIHJldHVybiBjYWxsYmFjayBlcnIsIHVuZGVmaW5lZCwgeGhyXG4gICAgdHJ5XG4gICAgICBkYXRhID0gSlNPTi5wYXJzZSBqc29uXG4gICAgY2F0Y2ggZXJyX1xuICAgICAgZXJyID0gZXJyX1xuICAgIGNhbGxiYWNrIGVyciwgZGF0YSwgeGhyXG4gIG9wdC5kYXRhID0gSlNPTi5zdHJpbmdpZnkgb3B0LmRhdGFcbiAgb3B0LmhlYWRlcnMgPSAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gIHhociBvcHQsIGNhbGxiYWNrX1xuXG5tb2R1bGUuZXhwb3J0cyA9IHhoclxuIiwieGhyID0gcmVxdWlyZSAnLi94aHIuY29mZmVlJ1xuc3RhdGUgPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcblxuI2V4dGVuZCA9IChyPXt9LCBkKSAtPiByW2tdID0gdiBmb3IgaywgdiBvZiBkOyByXG4jdG9EaWN0ID0gKGFycmF5LCBkaWN0PXt9KSAtPiBkaWN0W2t2cFswXV0gPSBrdnBbMV0gZm9yIGt2cCBpbiBhcnJheTsgZGljdFxuI3BhcnNlUXVlcnkgPSAocykgLT4gdG9EaWN0KGt2cC5zcGxpdCgnPScpIGZvciBrdnAgaW4gcy5yZXBsYWNlKC9eXFw/LywnJykuc3BsaXQoJyYnKSlcbiNcbiNjbGllbnRJZCA9ICcwNGM0ZGUzMzMyNjY0ZDcwNDY0MidcbiNyZWRpcmVjdCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmXG4jYXV0aCA9IC0+XG4jICBxdWVyeSA9IHBhcnNlUXVlcnkgd2luZG93LmxvY2F0aW9uLnNlYXJjaFxuIyAgaWYgcXVlcnkuY29kZVxuIyAgICB4T3JpZ1N0YXRlID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtICd4LW9yaWctc3RhdGUnXG4jICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSAneC1vcmlnLXN0YXRlJ1xuIyAgICBpZiB4T3JpZ1N0YXRlIGlzbnQgcXVlcnkuc3RhdGVcbiMgICAgICByZXR1cm4gY29uc29sZS5lcnJvciAnY3Jvc3Mgb3JpZ2luIHN0YXRlIGhhcyBiZWVuIHRhbXBlcmVkIHdpdGguJ1xuIyAgICB4aHJcbiMgICAgICBtZXRob2Q6ICdQT1NUJ1xuIyAgICAgIHVybDogJ2h0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hY2Nlc3NfdG9rZW4nXG4jICAgICAgZGF0YTpcbiMgICAgICAgIGNsaWVudF9pZDogY2xpZW50SWRcbiMgICAgICAgIGNsaWVudF9zZWNyZXQ6IGNsaWVudFNlY3JldFxuIyAgICAgICAgY29kZTogcXVlcnkuY29kZVxuIyAgICAsKGVyciwgZGF0YSkgLT5cbiMgICAgICBjb25zb2xlLmxvZyBkYXRhXG4jICBlbHNlIGlmIHF1ZXJ5LmVycm9yXG4jXG4jICBlbHNlXG4jICAgIHJuZCA9ICgnMDEyMzQ1Njc4OWFiY2RlZidbTWF0aC5yYW5kb20oKSAqIDE2IHwgMF0gZm9yIHggaW4gWzAuLjEwXSkuam9pbiAnJ1xuIyAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0gJ3gtb3JpZy1zdGF0ZScsIHJuZFxuIyAgICB3aW5kb3cub3BlbiBcImh0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hdXRob3JpemU/Y2xpZW50X2lkPSN7Y2xpZW50SWR9JnNjb3BlPWdpc3Qmc3RhdGU9I3tybmR9JnJlZGlyZWN0X3VyaT0je3JlZGlyZWN0fVwiXG5cbnN0YXRlLnN0b3Jlcy5naXN0ID1cbiAgc3RvcmU6IChpZCwgZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrICdBdXRvIHNhdmUgbm90IHN1cHBvcnRlZC4nIGlmIGRhdGEubWV0YS5hdXRvc2F2ZVxuICAgIHhoci5qc29uXG4gICAgICBtZXRob2Q6ICdQT1NUJyAjaWYgaWQgdGhlbiAnUEFUQ0gnIGVsc2UgJ1BPU1QnXG4gICAgICB1cmw6ICdodHRwczovL2FwaS5naXRodWIuY29tL2dpc3RzJyAjKyBpZiBpZCB0aGVuICcvJytpZCBlbHNlICcnXG4gICAgICBkYXRhOlxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZWQgd2l0aCBEci4gTWFya2Rvd24nXG4gICAgICAgIGZpbGVzOlxuICAgICAgICAgICdkb2N1bWVudC5tZCc6IGNvbnRlbnQ6IGRhdGEudGV4dFxuICAgICAgICAgICdtZXRhLmpzb24nOiBjb250ZW50OiBKU09OLnN0cmluZ2lmeSBkYXRhLm1ldGFcbiAgICAsKGVyciwgZGF0YSkgLT4gY2FsbGJhY2sgZXJyLCBkYXRhLmlkXG4gIHJlc3RvcmU6IChpZCwgY2FsbGJhY2spIC0+XG4gICAgeGhyLmpzb24gdXJsOidodHRwczovL2FwaS5naXRodWIuY29tL2dpc3RzLycraWQsIChlcnIsIGRhdGEpIC0+XG4gICAgICB7XG4gICAgICAgIGZpbGVzOiB7XG4gICAgICAgICAgJ2RvY3VtZW50Lm1kJzogeyBjb250ZW50OnRleHQgfSxcbiAgICAgICAgICAnbWV0YS5qc29uJzogeyBjb250ZW50Om1ldGEgfVxuICAgICAgICB9XG4gICAgICB9ID0gZGF0YVxuICAgICAgY2FsbGJhY2sgZXJyLCB7IHRleHQsIG1ldGE6SlNPTi5wYXJzZSBtZXRhIH1cblxuI3NldFRpbWVvdXQgKC0+IGF1dGgoKSksIDEwMDBcbiIsIm1vZHVsZS5leHBvcnRzID0gXG4gIGdldEN1cnNvclBvc2l0aW9uOiAoZWwpIC0+XG4gICAgcG9zID0gMFxuICAgICMgSUUgU3VwcG9ydFxuICAgIGlmIGRvY3VtZW50LnNlbGVjdGlvblxuICAgICAgZWwuZm9jdXMoKVxuICAgICAgU2VsID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKClcbiAgICAgIFNlbExlbmd0aCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpLnRleHQubGVuZ3RoXG4gICAgICBTZWwubW92ZVN0YXJ0ICdjaGFyYWN0ZXInLCAtZWwudmFsdWUubGVuZ3RoXG4gICAgICBwb3MgPSBTZWwudGV4dC5sZW5ndGggLSBTZWxMZW5ndGhcbiAgICAjIEZpcmVmb3ggc3VwcG9ydFxuICAgIGVsc2UgaWYgZWwuc2VsZWN0aW9uU3RhcnQgb3IgZWwuc2VsZWN0aW9uU3RhcnQgaXMgMFxuICAgICAgcG9zID0gZWwuc2VsZWN0aW9uU3RhcnRcbiAgICBwb3NcblxuICBudW1iZXI6IChlbCkgLT5cbiAgICBzZWxlY3RvciA9ICdIMSxIMixIMyxINCxINSxINicgIyArICcsT0wsVUwsTEknXG4gICAgZWxlbXMgPSBbXVxuICAgIG9yZGVyID0gc2VsZWN0b3Iuc3BsaXQoJywnKVxuICAgIG1hcCA9IHt9XG4gICAgbWFwW3NlbF0gPSB7YzowLCBwb3M6aX0gZm9yIHNlbCwgaSBpbiBvcmRlclxuICAgIG51bSA9ICh0YWcpIC0+XG4gICAgICAoYyBmb3IgaSBpbiBbMC4ubWFwW3RhZ10ucG9zXVxcXG4gICAgICAgd2hlbiAoYz1tYXBbKHQ9b3JkZXJbaV0pXS5jKSBpc250IDBcXFxuICAgICAgIGFuZCB0IG5vdCBpbiBbJ09MJywgJ1VMJ10pLmpvaW4gJywnXG4gICAgY291bnQgPSAoc2VsKSAtPlxuICAgICAgZSA9IG1hcFtzZWxdXG4gICAgICBlLmMrK1xuICAgICAgKG1hcFtvcmRlcltpXV0uYyA9IDAgZm9yIGkgaW4gW2UucG9zKzEuLi5vcmRlci5sZW5ndGhdKVxuICAgIHJlc2V0ID0gKGNsZWFyKSAtPlxuICAgICAgZWxlbXMgPSBbXSBpZiBjbGVhclxuICAgICAgb2JqLmMgPSAwIGZvciBzZWwsb2JqIG9mIG1hcFxuICAgIGZvciBoLCBpIGluIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW51bWJlci1yZXNldF0sW2RhdGEtbnVtYmVyLWNsZWFyXSwnK3NlbGVjdG9yKVxuICAgICAgaWYgaC5oYXNBdHRyaWJ1dGUgJ2RhdGEtbnVtYmVyLXJlc2V0J1xuICAgICAgICByZXNldCgpXG4gICAgICBlbHNlIGlmIGguaGFzQXR0cmlidXRlICdkYXRhLW51bWJlci1jbGVhcidcbiAgICAgICAgcmVzZXQgdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICB0ID0gaC50YWdOYW1lXG4gICAgICAgIGNvdW50IHRcbiAgICAgICAgZWxlbXMucHVzaCBbaCwgbnVtIHRdIGlmIHQgbm90IGluIFsnT0wnLCAnVUwnXVxuICAgIGguc2V0QXR0cmlidXRlICdkYXRhLW51bWJlcicsIG4gZm9yIFtoLCBuXSBpbiBlbGVtc1xuICAgIGVsXG5cbiAgaW5kZXg6IChlbCkgLT5cbiAgICBmb3IgZSBpbiBlbC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1udW1iZXJdJylcbiAgICAgIGUuaW5uZXJIVE1MID0gXCJcIlwiXG4gICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICN7ZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbnVtYmVyJykuc3BsaXQoJywnKS5qb2luKCcuICcpfS5cbiAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgXCJcIlwiICsgZS5pbm5lckhUTUxcbiAgICBlbFxuXG4gIHRvYzogKGVsKSAtPlxuICAgICc8dWw+JyArIChmb3IgZSBpbiBlbC5xdWVyeVNlbGVjdG9yQWxsKCdIMSxIMixIMyxINCxINSxINicpXG4gICAgICBcIlwiXCJcbiAgICAgIDxsaT48YSBocmVmPVwiIyN7ZS5pZH1cIj48I3tlLnRhZ05hbWV9PlxuICAgICAgI3tlLmlubmVySFRNTH1cbiAgICAgIDwvI3tlLnRhZ05hbWV9PjwvYT48L2xpPlxuICAgICAgXCJcIlwiXG4gICAgKS5qb2luKCcnKSArICc8L3VsPidcbiIsIihmdW5jdGlvbihnbG9iYWwpey8qKlxuICogbWFya2VkIC0gYSBtYXJrZG93biBwYXJzZXJcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEzLCBDaHJpc3RvcGhlciBKZWZmcmV5LiAoTUlUIExpY2Vuc2VkKVxuICogaHR0cHM6Ly9naXRodWIuY29tL2NoamovbWFya2VkXG4gKi9cblxuOyhmdW5jdGlvbigpIHtcblxuLyoqXG4gKiBCbG9jay1MZXZlbCBHcmFtbWFyXG4gKi9cblxudmFyIGJsb2NrID0ge1xuICBuZXdsaW5lOiAvXlxcbisvLFxuICBjb2RlOiAvXiggezR9W15cXG5dK1xcbiopKy8sXG4gIGZlbmNlczogbm9vcCxcbiAgaHI6IC9eKCAqWy0qX10pezMsfSAqKD86XFxuK3wkKS8sXG4gIGhlYWRpbmc6IC9eICooI3sxLDZ9KSAqKFteXFxuXSs/KSAqIyogKig/Olxcbit8JCkvLFxuICBucHRhYmxlOiBub29wLFxuICBsaGVhZGluZzogL14oW15cXG5dKylcXG4gKig9fC0pezMsfSAqXFxuKi8sXG4gIGJsb2NrcXVvdGU6IC9eKCAqPlteXFxuXSsoXFxuW15cXG5dKykqXFxuKikrLyxcbiAgbGlzdDogL14oICopKGJ1bGwpIFtcXHNcXFNdKz8oPzpocnxcXG57Mix9KD8hICkoPyFcXDFidWxsIClcXG4qfFxccyokKS8sXG4gIGh0bWw6IC9eICooPzpjb21tZW50fGNsb3NlZHxjbG9zaW5nKSAqKD86XFxuezIsfXxcXHMqJCkvLFxuICBkZWY6IC9eICpcXFsoW15cXF1dKylcXF06ICo8PyhbXlxccz5dKyk+Pyg/OiArW1wiKF0oW15cXG5dKylbXCIpXSk/ICooPzpcXG4rfCQpLyxcbiAgdGFibGU6IG5vb3AsXG4gIHBhcmFncmFwaDogL14oKD86W15cXG5dK1xcbj8oPyFocnxoZWFkaW5nfGxoZWFkaW5nfGJsb2NrcXVvdGV8dGFnfGRlZikpKylcXG4qLyxcbiAgdGV4dDogL15bXlxcbl0rL1xufTtcblxuYmxvY2suYnVsbGV0ID0gLyg/OlsqKy1dfFxcZCtcXC4pLztcbmJsb2NrLml0ZW0gPSAvXiggKikoYnVsbCkgW15cXG5dKig/Olxcbig/IVxcMWJ1bGwgKVteXFxuXSopKi87XG5ibG9jay5pdGVtID0gcmVwbGFjZShibG9jay5pdGVtLCAnZ20nKVxuICAoL2J1bGwvZywgYmxvY2suYnVsbGV0KVxuICAoKTtcblxuYmxvY2subGlzdCA9IHJlcGxhY2UoYmxvY2subGlzdClcbiAgKC9idWxsL2csIGJsb2NrLmJ1bGxldClcbiAgKCdocicsIC9cXG4rKD89KD86ICpbLSpfXSl7Myx9ICooPzpcXG4rfCQpKS8pXG4gICgpO1xuXG5ibG9jay5fdGFnID0gJyg/ISg/OidcbiAgKyAnYXxlbXxzdHJvbmd8c21hbGx8c3xjaXRlfHF8ZGZufGFiYnJ8ZGF0YXx0aW1lfGNvZGUnXG4gICsgJ3x2YXJ8c2FtcHxrYmR8c3VifHN1cHxpfGJ8dXxtYXJrfHJ1Ynl8cnR8cnB8YmRpfGJkbydcbiAgKyAnfHNwYW58YnJ8d2JyfGluc3xkZWx8aW1nKVxcXFxiKVxcXFx3Kyg/ITovfEApXFxcXGInO1xuXG5ibG9jay5odG1sID0gcmVwbGFjZShibG9jay5odG1sKVxuICAoJ2NvbW1lbnQnLCAvPCEtLVtcXHNcXFNdKj8tLT4vKVxuICAoJ2Nsb3NlZCcsIC88KHRhZylbXFxzXFxTXSs/PFxcL1xcMT4vKVxuICAoJ2Nsb3NpbmcnLCAvPHRhZyg/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXidcIj5dKSo/Pi8pXG4gICgvdGFnL2csIGJsb2NrLl90YWcpXG4gICgpO1xuXG5ibG9jay5wYXJhZ3JhcGggPSByZXBsYWNlKGJsb2NrLnBhcmFncmFwaClcbiAgKCdocicsIGJsb2NrLmhyKVxuICAoJ2hlYWRpbmcnLCBibG9jay5oZWFkaW5nKVxuICAoJ2xoZWFkaW5nJywgYmxvY2subGhlYWRpbmcpXG4gICgnYmxvY2txdW90ZScsIGJsb2NrLmJsb2NrcXVvdGUpXG4gICgndGFnJywgJzwnICsgYmxvY2suX3RhZylcbiAgKCdkZWYnLCBibG9jay5kZWYpXG4gICgpO1xuXG4vKipcbiAqIE5vcm1hbCBCbG9jayBHcmFtbWFyXG4gKi9cblxuYmxvY2subm9ybWFsID0gbWVyZ2Uoe30sIGJsb2NrKTtcblxuLyoqXG4gKiBHRk0gQmxvY2sgR3JhbW1hclxuICovXG5cbmJsb2NrLmdmbSA9IG1lcmdlKHt9LCBibG9jay5ub3JtYWwsIHtcbiAgZmVuY2VzOiAvXiAqKGB7Myx9fH57Myx9KSAqKFxcUyspPyAqXFxuKFtcXHNcXFNdKz8pXFxzKlxcMSAqKD86XFxuK3wkKS8sXG4gIHBhcmFncmFwaDogL14vXG59KTtcblxuYmxvY2suZ2ZtLnBhcmFncmFwaCA9IHJlcGxhY2UoYmxvY2sucGFyYWdyYXBoKVxuICAoJyg/IScsICcoPyEnICsgYmxvY2suZ2ZtLmZlbmNlcy5zb3VyY2UucmVwbGFjZSgnXFxcXDEnLCAnXFxcXDInKSArICd8JylcbiAgKCk7XG5cbi8qKlxuICogR0ZNICsgVGFibGVzIEJsb2NrIEdyYW1tYXJcbiAqL1xuXG5ibG9jay50YWJsZXMgPSBtZXJnZSh7fSwgYmxvY2suZ2ZtLCB7XG4gIG5wdGFibGU6IC9eICooXFxTLipcXHwuKilcXG4gKihbLTpdKyAqXFx8Wy18IDpdKilcXG4oKD86LipcXHwuKig/OlxcbnwkKSkqKVxcbiovLFxuICB0YWJsZTogL14gKlxcfCguKylcXG4gKlxcfCggKlstOl0rWy18IDpdKilcXG4oKD86ICpcXHwuKig/OlxcbnwkKSkqKVxcbiovXG59KTtcblxuLyoqXG4gKiBCbG9jayBMZXhlclxuICovXG5cbmZ1bmN0aW9uIExleGVyKG9wdGlvbnMpIHtcbiAgdGhpcy50b2tlbnMgPSBbXTtcbiAgdGhpcy50b2tlbnMubGlua3MgPSB7fTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCBtYXJrZWQuZGVmYXVsdHM7XG4gIHRoaXMucnVsZXMgPSBibG9jay5ub3JtYWw7XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5nZm0pIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRhYmxlcykge1xuICAgICAgdGhpcy5ydWxlcyA9IGJsb2NrLnRhYmxlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ydWxlcyA9IGJsb2NrLmdmbTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeHBvc2UgQmxvY2sgUnVsZXNcbiAqL1xuXG5MZXhlci5ydWxlcyA9IGJsb2NrO1xuXG4vKipcbiAqIFN0YXRpYyBMZXggTWV0aG9kXG4gKi9cblxuTGV4ZXIubGV4ID0gZnVuY3Rpb24oc3JjLCBvcHRpb25zKSB7XG4gIHZhciBsZXhlciA9IG5ldyBMZXhlcihvcHRpb25zKTtcbiAgcmV0dXJuIGxleGVyLmxleChzcmMpO1xufTtcblxuLyoqXG4gKiBQcmVwcm9jZXNzaW5nXG4gKi9cblxuTGV4ZXIucHJvdG90eXBlLmxleCA9IGZ1bmN0aW9uKHNyYykge1xuICBzcmMgPSBzcmNcbiAgICAucmVwbGFjZSgvXFxyXFxufFxcci9nLCAnXFxuJylcbiAgICAucmVwbGFjZSgvXFx0L2csICcgICAgJylcbiAgICAucmVwbGFjZSgvXFx1MDBhMC9nLCAnICcpXG4gICAgLnJlcGxhY2UoL1xcdTI0MjQvZywgJ1xcbicpO1xuXG4gIHJldHVybiB0aGlzLnRva2VuKHNyYywgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIExleGluZ1xuICovXG5cbkxleGVyLnByb3RvdHlwZS50b2tlbiA9IGZ1bmN0aW9uKHNyYywgdG9wKSB7XG4gIHZhciBzcmMgPSBzcmMucmVwbGFjZSgvXiArJC9nbSwgJycpXG4gICAgLCBuZXh0XG4gICAgLCBsb29zZVxuICAgICwgY2FwXG4gICAgLCBidWxsXG4gICAgLCBiXG4gICAgLCBpdGVtXG4gICAgLCBzcGFjZVxuICAgICwgaVxuICAgICwgbDtcblxuICB3aGlsZSAoc3JjKSB7XG4gICAgLy8gbmV3bGluZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLm5ld2xpbmUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgaWYgKGNhcFswXS5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdzcGFjZSdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29kZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmNvZGUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgY2FwID0gY2FwWzBdLnJlcGxhY2UoL14gezR9L2dtLCAnJyk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvZGUnLFxuICAgICAgICB0ZXh0OiAhdGhpcy5vcHRpb25zLnBlZGFudGljXG4gICAgICAgICAgPyBjYXAucmVwbGFjZSgvXFxuKyQvLCAnJylcbiAgICAgICAgICA6IGNhcFxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBmZW5jZXMgKGdmbSlcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5mZW5jZXMuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdjb2RlJyxcbiAgICAgICAgbGFuZzogY2FwWzJdLFxuICAgICAgICB0ZXh0OiBjYXBbM11cbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gaGVhZGluZ1xuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmhlYWRpbmcuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdoZWFkaW5nJyxcbiAgICAgICAgZGVwdGg6IGNhcFsxXS5sZW5ndGgsXG4gICAgICAgIHRleHQ6IGNhcFsyXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB0YWJsZSBubyBsZWFkaW5nIHBpcGUgKGdmbSlcbiAgICBpZiAodG9wICYmIChjYXAgPSB0aGlzLnJ1bGVzLm5wdGFibGUuZXhlYyhzcmMpKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcblxuICAgICAgaXRlbSA9IHtcbiAgICAgICAgdHlwZTogJ3RhYmxlJyxcbiAgICAgICAgaGVhZGVyOiBjYXBbMV0ucmVwbGFjZSgvXiAqfCAqXFx8ICokL2csICcnKS5zcGxpdCgvICpcXHwgKi8pLFxuICAgICAgICBhbGlnbjogY2FwWzJdLnJlcGxhY2UoL14gKnxcXHwgKiQvZywgJycpLnNwbGl0KC8gKlxcfCAqLyksXG4gICAgICAgIGNlbGxzOiBjYXBbM10ucmVwbGFjZSgvXFxuJC8sICcnKS5zcGxpdCgnXFxuJylcbiAgICAgIH07XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBpdGVtLmFsaWduLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICgvXiAqLSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdyaWdodCc7XG4gICAgICAgIH0gZWxzZSBpZiAoL14gKjotKzogKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ2NlbnRlcic7XG4gICAgICAgIH0gZWxzZSBpZiAoL14gKjotKyAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAnbGVmdCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yIChpID0gMDsgaSA8IGl0ZW0uY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlbS5jZWxsc1tpXSA9IGl0ZW0uY2VsbHNbaV0uc3BsaXQoLyAqXFx8ICovKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50b2tlbnMucHVzaChpdGVtKTtcblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gbGhlYWRpbmdcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5saGVhZGluZy5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2hlYWRpbmcnLFxuICAgICAgICBkZXB0aDogY2FwWzJdID09PSAnPScgPyAxIDogMixcbiAgICAgICAgdGV4dDogY2FwWzFdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGhyXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuaHIuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdocidcbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gYmxvY2txdW90ZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrcXVvdGUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuXG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2Jsb2NrcXVvdGVfc3RhcnQnXG4gICAgICB9KTtcblxuICAgICAgY2FwID0gY2FwWzBdLnJlcGxhY2UoL14gKj4gPy9nbSwgJycpO1xuXG4gICAgICAvLyBQYXNzIGB0b3BgIHRvIGtlZXAgdGhlIGN1cnJlbnRcbiAgICAgIC8vIFwidG9wbGV2ZWxcIiBzdGF0ZS4gVGhpcyBpcyBleGFjdGx5XG4gICAgICAvLyBob3cgbWFya2Rvd24ucGwgd29ya3MuXG4gICAgICB0aGlzLnRva2VuKGNhcCwgdG9wKTtcblxuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdibG9ja3F1b3RlX2VuZCdcbiAgICAgIH0pO1xuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBsaXN0XG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMubGlzdC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBidWxsID0gY2FwWzJdO1xuXG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2xpc3Rfc3RhcnQnLFxuICAgICAgICBvcmRlcmVkOiBidWxsLmxlbmd0aCA+IDFcbiAgICAgIH0pO1xuXG4gICAgICAvLyBHZXQgZWFjaCB0b3AtbGV2ZWwgaXRlbS5cbiAgICAgIGNhcCA9IGNhcFswXS5tYXRjaCh0aGlzLnJ1bGVzLml0ZW0pO1xuXG4gICAgICBuZXh0ID0gZmFsc2U7XG4gICAgICBsID0gY2FwLmxlbmd0aDtcbiAgICAgIGkgPSAwO1xuXG4gICAgICBmb3IgKDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpdGVtID0gY2FwW2ldO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgbGlzdCBpdGVtJ3MgYnVsbGV0XG4gICAgICAgIC8vIHNvIGl0IGlzIHNlZW4gYXMgdGhlIG5leHQgdG9rZW4uXG4gICAgICAgIHNwYWNlID0gaXRlbS5sZW5ndGg7XG4gICAgICAgIGl0ZW0gPSBpdGVtLnJlcGxhY2UoL14gKihbKistXXxcXGQrXFwuKSArLywgJycpO1xuXG4gICAgICAgIC8vIE91dGRlbnQgd2hhdGV2ZXIgdGhlXG4gICAgICAgIC8vIGxpc3QgaXRlbSBjb250YWlucy4gSGFja3kuXG4gICAgICAgIGlmICh+aXRlbS5pbmRleE9mKCdcXG4gJykpIHtcbiAgICAgICAgICBzcGFjZSAtPSBpdGVtLmxlbmd0aDtcbiAgICAgICAgICBpdGVtID0gIXRoaXMub3B0aW9ucy5wZWRhbnRpY1xuICAgICAgICAgICAgPyBpdGVtLnJlcGxhY2UobmV3IFJlZ0V4cCgnXiB7MSwnICsgc3BhY2UgKyAnfScsICdnbScpLCAnJylcbiAgICAgICAgICAgIDogaXRlbS5yZXBsYWNlKC9eIHsxLDR9L2dtLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZXRlcm1pbmUgd2hldGhlciB0aGUgbmV4dCBsaXN0IGl0ZW0gYmVsb25ncyBoZXJlLlxuICAgICAgICAvLyBCYWNrcGVkYWwgaWYgaXQgZG9lcyBub3QgYmVsb25nIGluIHRoaXMgbGlzdC5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zbWFydExpc3RzICYmIGkgIT09IGwgLSAxKSB7XG4gICAgICAgICAgYiA9IGJsb2NrLmJ1bGxldC5leGVjKGNhcFtpKzFdKVswXTtcbiAgICAgICAgICBpZiAoYnVsbCAhPT0gYiAmJiAhKGJ1bGwubGVuZ3RoID4gMSAmJiBiLmxlbmd0aCA+IDEpKSB7XG4gICAgICAgICAgICBzcmMgPSBjYXAuc2xpY2UoaSArIDEpLmpvaW4oJ1xcbicpICsgc3JjO1xuICAgICAgICAgICAgaSA9IGwgLSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIGl0ZW0gaXMgbG9vc2Ugb3Igbm90LlxuICAgICAgICAvLyBVc2U6IC8oXnxcXG4pKD8hIClbXlxcbl0rXFxuXFxuKD8hXFxzKiQpL1xuICAgICAgICAvLyBmb3IgZGlzY291bnQgYmVoYXZpb3IuXG4gICAgICAgIGxvb3NlID0gbmV4dCB8fCAvXFxuXFxuKD8hXFxzKiQpLy50ZXN0KGl0ZW0pO1xuICAgICAgICBpZiAoaSAhPT0gbCAtIDEpIHtcbiAgICAgICAgICBuZXh0ID0gaXRlbVtpdGVtLmxlbmd0aC0xXSA9PT0gJ1xcbic7XG4gICAgICAgICAgaWYgKCFsb29zZSkgbG9vc2UgPSBuZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgICAgdHlwZTogbG9vc2VcbiAgICAgICAgICAgID8gJ2xvb3NlX2l0ZW1fc3RhcnQnXG4gICAgICAgICAgICA6ICdsaXN0X2l0ZW1fc3RhcnQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJlY3Vyc2UuXG4gICAgICAgIHRoaXMudG9rZW4oaXRlbSwgZmFsc2UpO1xuXG4gICAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdsaXN0X2l0ZW1fZW5kJ1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdsaXN0X2VuZCdcbiAgICAgIH0pO1xuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBodG1sXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuaHRtbC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogdGhpcy5vcHRpb25zLnNhbml0aXplXG4gICAgICAgICAgPyAncGFyYWdyYXBoJ1xuICAgICAgICAgIDogJ2h0bWwnLFxuICAgICAgICBwcmU6IGNhcFsxXSA9PT0gJ3ByZScgfHwgY2FwWzFdID09PSAnc2NyaXB0JyxcbiAgICAgICAgdGV4dDogY2FwWzBdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGRlZlxuICAgIGlmICh0b3AgJiYgKGNhcCA9IHRoaXMucnVsZXMuZGVmLmV4ZWMoc3JjKSkpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5saW5rc1tjYXBbMV0udG9Mb3dlckNhc2UoKV0gPSB7XG4gICAgICAgIGhyZWY6IGNhcFsyXSxcbiAgICAgICAgdGl0bGU6IGNhcFszXVxuICAgICAgfTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHRhYmxlIChnZm0pXG4gICAgaWYgKHRvcCAmJiAoY2FwID0gdGhpcy5ydWxlcy50YWJsZS5leGVjKHNyYykpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuXG4gICAgICBpdGVtID0ge1xuICAgICAgICB0eXBlOiAndGFibGUnLFxuICAgICAgICBoZWFkZXI6IGNhcFsxXS5yZXBsYWNlKC9eICp8ICpcXHwgKiQvZywgJycpLnNwbGl0KC8gKlxcfCAqLyksXG4gICAgICAgIGFsaWduOiBjYXBbMl0ucmVwbGFjZSgvXiAqfFxcfCAqJC9nLCAnJykuc3BsaXQoLyAqXFx8ICovKSxcbiAgICAgICAgY2VsbHM6IGNhcFszXS5yZXBsYWNlKC8oPzogKlxcfCAqKT9cXG4kLywgJycpLnNwbGl0KCdcXG4nKVxuICAgICAgfTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGl0ZW0uYWxpZ24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKC9eICotKzogKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ3JpZ2h0JztcbiAgICAgICAgfSBlbHNlIGlmICgvXiAqOi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAnY2VudGVyJztcbiAgICAgICAgfSBlbHNlIGlmICgvXiAqOi0rICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdsZWZ0JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbS5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVtLmNlbGxzW2ldID0gaXRlbS5jZWxsc1tpXVxuICAgICAgICAgIC5yZXBsYWNlKC9eICpcXHwgKnwgKlxcfCAqJC9nLCAnJylcbiAgICAgICAgICAuc3BsaXQoLyAqXFx8ICovKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50b2tlbnMucHVzaChpdGVtKTtcblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdG9wLWxldmVsIHBhcmFncmFwaFxuICAgIGlmICh0b3AgJiYgKGNhcCA9IHRoaXMucnVsZXMucGFyYWdyYXBoLmV4ZWMoc3JjKSkpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXG4gICAgICAgIHRleHQ6IGNhcFsxXVtjYXBbMV0ubGVuZ3RoLTFdID09PSAnXFxuJ1xuICAgICAgICAgID8gY2FwWzFdLnNsaWNlKDAsIC0xKVxuICAgICAgICAgIDogY2FwWzFdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHRleHRcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy50ZXh0LmV4ZWMoc3JjKSkge1xuICAgICAgLy8gVG9wLWxldmVsIHNob3VsZCBuZXZlciByZWFjaCBoZXJlLlxuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgIHRleHQ6IGNhcFswXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc3JjKSB7XG4gICAgICB0aHJvdyBuZXdcbiAgICAgICAgRXJyb3IoJ0luZmluaXRlIGxvb3Agb24gYnl0ZTogJyArIHNyYy5jaGFyQ29kZUF0KDApKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy50b2tlbnM7XG59O1xuXG4vKipcbiAqIElubGluZS1MZXZlbCBHcmFtbWFyXG4gKi9cblxudmFyIGlubGluZSA9IHtcbiAgZXNjYXBlOiAvXlxcXFwoW1xcXFxgKnt9XFxbXFxdKCkjK1xcLS4hXz5dKS8sXG4gIGF1dG9saW5rOiAvXjwoW14gPl0rKEB8OlxcLylbXiA+XSspPi8sXG4gIHVybDogbm9vcCxcbiAgdGFnOiAvXjwhLS1bXFxzXFxTXSo/LS0+fF48XFwvP1xcdysoPzpcIlteXCJdKlwifCdbXiddKid8W14nXCI+XSkqPz4vLFxuICBsaW5rOiAvXiE/XFxbKGluc2lkZSlcXF1cXChocmVmXFwpLyxcbiAgcmVmbGluazogL14hP1xcWyhpbnNpZGUpXFxdXFxzKlxcWyhbXlxcXV0qKVxcXS8sXG4gIG5vbGluazogL14hP1xcWygoPzpcXFtbXlxcXV0qXFxdfFteXFxbXFxdXSkqKVxcXS8sXG4gIHN0cm9uZzogL15fXyhbXFxzXFxTXSs/KV9fKD8hXyl8XlxcKlxcKihbXFxzXFxTXSs/KVxcKlxcKig/IVxcKikvLFxuICBlbTogL15cXGJfKCg/Ol9ffFtcXHNcXFNdKSs/KV9cXGJ8XlxcKigoPzpcXCpcXCp8W1xcc1xcU10pKz8pXFwqKD8hXFwqKS8sXG4gIGNvZGU6IC9eKGArKVxccyooW1xcc1xcU10qP1teYF0pXFxzKlxcMSg/IWApLyxcbiAgYnI6IC9eIHsyLH1cXG4oPyFcXHMqJCkvLFxuICBkZWw6IG5vb3AsXG4gIHRleHQ6IC9eW1xcc1xcU10rPyg/PVtcXFxcPCFcXFtfKmBdfCB7Mix9XFxufCQpL1xufTtcblxuaW5saW5lLl9pbnNpZGUgPSAvKD86XFxbW15cXF1dKlxcXXxbXlxcXV18XFxdKD89W15cXFtdKlxcXSkpKi87XG5pbmxpbmUuX2hyZWYgPSAvXFxzKjw/KFteXFxzXSo/KT4/KD86XFxzK1snXCJdKFtcXHNcXFNdKj8pWydcIl0pP1xccyovO1xuXG5pbmxpbmUubGluayA9IHJlcGxhY2UoaW5saW5lLmxpbmspXG4gICgnaW5zaWRlJywgaW5saW5lLl9pbnNpZGUpXG4gICgnaHJlZicsIGlubGluZS5faHJlZilcbiAgKCk7XG5cbmlubGluZS5yZWZsaW5rID0gcmVwbGFjZShpbmxpbmUucmVmbGluaylcbiAgKCdpbnNpZGUnLCBpbmxpbmUuX2luc2lkZSlcbiAgKCk7XG5cbi8qKlxuICogTm9ybWFsIElubGluZSBHcmFtbWFyXG4gKi9cblxuaW5saW5lLm5vcm1hbCA9IG1lcmdlKHt9LCBpbmxpbmUpO1xuXG4vKipcbiAqIFBlZGFudGljIElubGluZSBHcmFtbWFyXG4gKi9cblxuaW5saW5lLnBlZGFudGljID0gbWVyZ2Uoe30sIGlubGluZS5ub3JtYWwsIHtcbiAgc3Ryb25nOiAvXl9fKD89XFxTKShbXFxzXFxTXSo/XFxTKV9fKD8hXyl8XlxcKlxcKig/PVxcUykoW1xcc1xcU10qP1xcUylcXCpcXCooPyFcXCopLyxcbiAgZW06IC9eXyg/PVxcUykoW1xcc1xcU10qP1xcUylfKD8hXyl8XlxcKig/PVxcUykoW1xcc1xcU10qP1xcUylcXCooPyFcXCopL1xufSk7XG5cbi8qKlxuICogR0ZNIElubGluZSBHcmFtbWFyXG4gKi9cblxuaW5saW5lLmdmbSA9IG1lcmdlKHt9LCBpbmxpbmUubm9ybWFsLCB7XG4gIGVzY2FwZTogcmVwbGFjZShpbmxpbmUuZXNjYXBlKSgnXSknLCAnfnxdKScpKCksXG4gIHVybDogL14oaHR0cHM/OlxcL1xcL1teXFxzPF0rW148Liw6O1wiJylcXF1cXHNdKS8sXG4gIGRlbDogL15+fig/PVxcUykoW1xcc1xcU10qP1xcUyl+fi8sXG4gIHRleHQ6IHJlcGxhY2UoaW5saW5lLnRleHQpXG4gICAgKCddfCcsICd+XXwnKVxuICAgICgnfCcsICd8aHR0cHM/Oi8vfCcpXG4gICAgKClcbn0pO1xuXG4vKipcbiAqIEdGTSArIExpbmUgQnJlYWtzIElubGluZSBHcmFtbWFyXG4gKi9cblxuaW5saW5lLmJyZWFrcyA9IG1lcmdlKHt9LCBpbmxpbmUuZ2ZtLCB7XG4gIGJyOiByZXBsYWNlKGlubGluZS5icikoJ3syLH0nLCAnKicpKCksXG4gIHRleHQ6IHJlcGxhY2UoaW5saW5lLmdmbS50ZXh0KSgnezIsfScsICcqJykoKVxufSk7XG5cbi8qKlxuICogSW5saW5lIExleGVyICYgQ29tcGlsZXJcbiAqL1xuXG5mdW5jdGlvbiBJbmxpbmVMZXhlcihsaW5rcywgb3B0aW9ucykge1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IG1hcmtlZC5kZWZhdWx0cztcbiAgdGhpcy5saW5rcyA9IGxpbmtzO1xuICB0aGlzLnJ1bGVzID0gaW5saW5lLm5vcm1hbDtcblxuICBpZiAoIXRoaXMubGlua3MpIHtcbiAgICB0aHJvdyBuZXdcbiAgICAgIEVycm9yKCdUb2tlbnMgYXJyYXkgcmVxdWlyZXMgYSBgbGlua3NgIHByb3BlcnR5LicpO1xuICB9XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5nZm0pIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmJyZWFrcykge1xuICAgICAgdGhpcy5ydWxlcyA9IGlubGluZS5icmVha3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucnVsZXMgPSBpbmxpbmUuZ2ZtO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMpIHtcbiAgICB0aGlzLnJ1bGVzID0gaW5saW5lLnBlZGFudGljO1xuICB9XG59XG5cbi8qKlxuICogRXhwb3NlIElubGluZSBSdWxlc1xuICovXG5cbklubGluZUxleGVyLnJ1bGVzID0gaW5saW5lO1xuXG4vKipcbiAqIFN0YXRpYyBMZXhpbmcvQ29tcGlsaW5nIE1ldGhvZFxuICovXG5cbklubGluZUxleGVyLm91dHB1dCA9IGZ1bmN0aW9uKHNyYywgbGlua3MsIG9wdGlvbnMpIHtcbiAgdmFyIGlubGluZSA9IG5ldyBJbmxpbmVMZXhlcihsaW5rcywgb3B0aW9ucyk7XG4gIHJldHVybiBpbmxpbmUub3V0cHV0KHNyYyk7XG59O1xuXG4vKipcbiAqIExleGluZy9Db21waWxpbmdcbiAqL1xuXG5JbmxpbmVMZXhlci5wcm90b3R5cGUub3V0cHV0ID0gZnVuY3Rpb24oc3JjKSB7XG4gIHZhciBvdXQgPSAnJ1xuICAgICwgbGlua1xuICAgICwgdGV4dFxuICAgICwgaHJlZlxuICAgICwgY2FwO1xuXG4gIHdoaWxlIChzcmMpIHtcbiAgICAvLyBlc2NhcGVcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5lc2NhcGUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9IGNhcFsxXTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGF1dG9saW5rXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuYXV0b2xpbmsuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgaWYgKGNhcFsyXSA9PT0gJ0AnKSB7XG4gICAgICAgIHRleHQgPSBjYXBbMV1bNl0gPT09ICc6J1xuICAgICAgICAgID8gdGhpcy5tYW5nbGUoY2FwWzFdLnN1YnN0cmluZyg3KSlcbiAgICAgICAgICA6IHRoaXMubWFuZ2xlKGNhcFsxXSk7XG4gICAgICAgIGhyZWYgPSB0aGlzLm1hbmdsZSgnbWFpbHRvOicpICsgdGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRleHQgPSBlc2NhcGUoY2FwWzFdKTtcbiAgICAgICAgaHJlZiA9IHRleHQ7XG4gICAgICB9XG4gICAgICBvdXQgKz0gJzxhIGhyZWY9XCInXG4gICAgICAgICsgaHJlZlxuICAgICAgICArICdcIj4nXG4gICAgICAgICsgdGV4dFxuICAgICAgICArICc8L2E+JztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHVybCAoZ2ZtKVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLnVybC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0ZXh0ID0gZXNjYXBlKGNhcFsxXSk7XG4gICAgICBocmVmID0gdGV4dDtcbiAgICAgIG91dCArPSAnPGEgaHJlZj1cIidcbiAgICAgICAgKyBocmVmXG4gICAgICAgICsgJ1wiPidcbiAgICAgICAgKyB0ZXh0XG4gICAgICAgICsgJzwvYT4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdGFnXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMudGFnLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSB0aGlzLm9wdGlvbnMuc2FuaXRpemVcbiAgICAgICAgPyBlc2NhcGUoY2FwWzBdKVxuICAgICAgICA6IGNhcFswXTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGxpbmtcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5saW5rLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSB0aGlzLm91dHB1dExpbmsoY2FwLCB7XG4gICAgICAgIGhyZWY6IGNhcFsyXSxcbiAgICAgICAgdGl0bGU6IGNhcFszXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyByZWZsaW5rLCBub2xpbmtcbiAgICBpZiAoKGNhcCA9IHRoaXMucnVsZXMucmVmbGluay5leGVjKHNyYykpXG4gICAgICAgIHx8IChjYXAgPSB0aGlzLnJ1bGVzLm5vbGluay5leGVjKHNyYykpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgbGluayA9IChjYXBbMl0gfHwgY2FwWzFdKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICBsaW5rID0gdGhpcy5saW5rc1tsaW5rLnRvTG93ZXJDYXNlKCldO1xuICAgICAgaWYgKCFsaW5rIHx8ICFsaW5rLmhyZWYpIHtcbiAgICAgICAgb3V0ICs9IGNhcFswXVswXTtcbiAgICAgICAgc3JjID0gY2FwWzBdLnN1YnN0cmluZygxKSArIHNyYztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBvdXQgKz0gdGhpcy5vdXRwdXRMaW5rKGNhcCwgbGluayk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBzdHJvbmdcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5zdHJvbmcuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9ICc8c3Ryb25nPidcbiAgICAgICAgKyB0aGlzLm91dHB1dChjYXBbMl0gfHwgY2FwWzFdKVxuICAgICAgICArICc8L3N0cm9uZz4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gZW1cbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5lbS5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gJzxlbT4nXG4gICAgICAgICsgdGhpcy5vdXRwdXQoY2FwWzJdIHx8IGNhcFsxXSlcbiAgICAgICAgKyAnPC9lbT4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gY29kZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmNvZGUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9ICc8Y29kZT4nXG4gICAgICAgICsgZXNjYXBlKGNhcFsyXSwgdHJ1ZSlcbiAgICAgICAgKyAnPC9jb2RlPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBiclxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmJyLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSAnPGJyPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBkZWwgKGdmbSlcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5kZWwuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9ICc8ZGVsPidcbiAgICAgICAgKyB0aGlzLm91dHB1dChjYXBbMV0pXG4gICAgICAgICsgJzwvZGVsPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB0ZXh0XG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMudGV4dC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gZXNjYXBlKHRoaXMuc21hcnR5cGFudHMoY2FwWzBdKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc3JjKSB7XG4gICAgICB0aHJvdyBuZXdcbiAgICAgICAgRXJyb3IoJ0luZmluaXRlIGxvb3Agb24gYnl0ZTogJyArIHNyYy5jaGFyQ29kZUF0KDApKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb21waWxlIExpbmtcbiAqL1xuXG5JbmxpbmVMZXhlci5wcm90b3R5cGUub3V0cHV0TGluayA9IGZ1bmN0aW9uKGNhcCwgbGluaykge1xuICBpZiAoY2FwWzBdWzBdICE9PSAnIScpIHtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInXG4gICAgICArIGVzY2FwZShsaW5rLmhyZWYpXG4gICAgICArICdcIidcbiAgICAgICsgKGxpbmsudGl0bGVcbiAgICAgID8gJyB0aXRsZT1cIidcbiAgICAgICsgZXNjYXBlKGxpbmsudGl0bGUpXG4gICAgICArICdcIidcbiAgICAgIDogJycpXG4gICAgICArICc+J1xuICAgICAgKyB0aGlzLm91dHB1dChjYXBbMV0pXG4gICAgICArICc8L2E+JztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJzxpbWcgc3JjPVwiJ1xuICAgICAgKyBlc2NhcGUobGluay5ocmVmKVxuICAgICAgKyAnXCIgYWx0PVwiJ1xuICAgICAgKyBlc2NhcGUoY2FwWzFdKVxuICAgICAgKyAnXCInXG4gICAgICArIChsaW5rLnRpdGxlXG4gICAgICA/ICcgdGl0bGU9XCInXG4gICAgICArIGVzY2FwZShsaW5rLnRpdGxlKVxuICAgICAgKyAnXCInXG4gICAgICA6ICcnKVxuICAgICAgKyAnPic7XG4gIH1cbn07XG5cbi8qKlxuICogU21hcnR5cGFudHMgVHJhbnNmb3JtYXRpb25zXG4gKi9cblxuSW5saW5lTGV4ZXIucHJvdG90eXBlLnNtYXJ0eXBhbnRzID0gZnVuY3Rpb24odGV4dCkge1xuICBpZiAoIXRoaXMub3B0aW9ucy5zbWFydHlwYW50cykgcmV0dXJuIHRleHQ7XG4gIHJldHVybiB0ZXh0XG4gICAgLnJlcGxhY2UoLy0tL2csICdcXHUyMDE0JylcbiAgICAucmVwbGFjZSgvJyhbXiddKiknL2csICdcXHUyMDE4JDFcXHUyMDE5JylcbiAgICAucmVwbGFjZSgvXCIoW15cIl0qKVwiL2csICdcXHUyMDFDJDFcXHUyMDFEJylcbiAgICAucmVwbGFjZSgvXFwuezN9L2csICdcXHUyMDI2Jyk7XG59O1xuXG4vKipcbiAqIE1hbmdsZSBMaW5rc1xuICovXG5cbklubGluZUxleGVyLnByb3RvdHlwZS5tYW5nbGUgPSBmdW5jdGlvbih0ZXh0KSB7XG4gIHZhciBvdXQgPSAnJ1xuICAgICwgbCA9IHRleHQubGVuZ3RoXG4gICAgLCBpID0gMFxuICAgICwgY2g7XG5cbiAgZm9yICg7IGkgPCBsOyBpKyspIHtcbiAgICBjaCA9IHRleHQuY2hhckNvZGVBdChpKTtcbiAgICBpZiAoTWF0aC5yYW5kb20oKSA+IDAuNSkge1xuICAgICAgY2ggPSAneCcgKyBjaC50b1N0cmluZygxNik7XG4gICAgfVxuICAgIG91dCArPSAnJiMnICsgY2ggKyAnOyc7XG4gIH1cblxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQYXJzaW5nICYgQ29tcGlsaW5nXG4gKi9cblxuZnVuY3Rpb24gUGFyc2VyKG9wdGlvbnMpIHtcbiAgdGhpcy50b2tlbnMgPSBbXTtcbiAgdGhpcy50b2tlbiA9IG51bGw7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgbWFya2VkLmRlZmF1bHRzO1xufVxuXG4vKipcbiAqIFN0YXRpYyBQYXJzZSBNZXRob2RcbiAqL1xuXG5QYXJzZXIucGFyc2UgPSBmdW5jdGlvbihzcmMsIG9wdGlvbnMpIHtcbiAgdmFyIHBhcnNlciA9IG5ldyBQYXJzZXIob3B0aW9ucyk7XG4gIHJldHVybiBwYXJzZXIucGFyc2Uoc3JjKTtcbn07XG5cbi8qKlxuICogUGFyc2UgTG9vcFxuICovXG5cblBhcnNlci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbihzcmMpIHtcbiAgdGhpcy5pbmxpbmUgPSBuZXcgSW5saW5lTGV4ZXIoc3JjLmxpbmtzLCB0aGlzLm9wdGlvbnMpO1xuICB0aGlzLnRva2VucyA9IHNyYy5yZXZlcnNlKCk7XG5cbiAgdmFyIG91dCA9ICcnO1xuICB3aGlsZSAodGhpcy5uZXh0KCkpIHtcbiAgICBvdXQgKz0gdGhpcy50b2soKTtcbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE5leHQgVG9rZW5cbiAqL1xuXG5QYXJzZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudG9rZW4gPSB0aGlzLnRva2Vucy5wb3AoKTtcbn07XG5cbi8qKlxuICogUHJldmlldyBOZXh0IFRva2VuXG4gKi9cblxuUGFyc2VyLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnRva2Vuc1t0aGlzLnRva2Vucy5sZW5ndGgtMV0gfHwgMDtcbn07XG5cbi8qKlxuICogUGFyc2UgVGV4dCBUb2tlbnNcbiAqL1xuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlVGV4dCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYm9keSA9IHRoaXMudG9rZW4udGV4dDtcblxuICB3aGlsZSAodGhpcy5wZWVrKCkudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgYm9keSArPSAnXFxuJyArIHRoaXMubmV4dCgpLnRleHQ7XG4gIH1cblxuICByZXR1cm4gdGhpcy5pbmxpbmUub3V0cHV0KGJvZHkpO1xufTtcblxuLyoqXG4gKiBQYXJzZSBDdXJyZW50IFRva2VuXG4gKi9cblxuUGFyc2VyLnByb3RvdHlwZS50b2sgPSBmdW5jdGlvbigpIHtcbiAgc3dpdGNoICh0aGlzLnRva2VuLnR5cGUpIHtcbiAgICBjYXNlICdzcGFjZSc6IHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgY2FzZSAnaHInOiB7XG4gICAgICByZXR1cm4gJzxocj5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdoZWFkaW5nJzoge1xuICAgICAgcmV0dXJuICc8aCdcbiAgICAgICAgKyB0aGlzLnRva2VuLmRlcHRoXG4gICAgICAgICsgJz4nXG4gICAgICAgICsgdGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4udGV4dClcbiAgICAgICAgKyAnPC9oJ1xuICAgICAgICArIHRoaXMudG9rZW4uZGVwdGhcbiAgICAgICAgKyAnPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2NvZGUnOiB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmhpZ2hsaWdodCkge1xuICAgICAgICB2YXIgY29kZSA9IHRoaXMub3B0aW9ucy5oaWdobGlnaHQodGhpcy50b2tlbi50ZXh0LCB0aGlzLnRva2VuLmxhbmcpO1xuICAgICAgICBpZiAoY29kZSAhPSBudWxsICYmIGNvZGUgIT09IHRoaXMudG9rZW4udGV4dCkge1xuICAgICAgICAgIHRoaXMudG9rZW4uZXNjYXBlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy50b2tlbi50ZXh0ID0gY29kZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMudG9rZW4uZXNjYXBlZCkge1xuICAgICAgICB0aGlzLnRva2VuLnRleHQgPSBlc2NhcGUodGhpcy50b2tlbi50ZXh0LCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICc8cHJlPjxjb2RlJ1xuICAgICAgICArICh0aGlzLnRva2VuLmxhbmdcbiAgICAgICAgPyAnIGNsYXNzPVwiJ1xuICAgICAgICArIHRoaXMub3B0aW9ucy5sYW5nUHJlZml4XG4gICAgICAgICsgdGhpcy50b2tlbi5sYW5nXG4gICAgICAgICsgJ1wiJ1xuICAgICAgICA6ICcnKVxuICAgICAgICArICc+J1xuICAgICAgICArIHRoaXMudG9rZW4udGV4dFxuICAgICAgICArICc8L2NvZGU+PC9wcmU+XFxuJztcbiAgICB9XG4gICAgY2FzZSAndGFibGUnOiB7XG4gICAgICB2YXIgYm9keSA9ICcnXG4gICAgICAgICwgaGVhZGluZ1xuICAgICAgICAsIGlcbiAgICAgICAgLCByb3dcbiAgICAgICAgLCBjZWxsXG4gICAgICAgICwgajtcblxuICAgICAgLy8gaGVhZGVyXG4gICAgICBib2R5ICs9ICc8dGhlYWQ+XFxuPHRyPlxcbic7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy50b2tlbi5oZWFkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGVhZGluZyA9IHRoaXMuaW5saW5lLm91dHB1dCh0aGlzLnRva2VuLmhlYWRlcltpXSk7XG4gICAgICAgIGJvZHkgKz0gdGhpcy50b2tlbi5hbGlnbltpXVxuICAgICAgICAgID8gJzx0aCBhbGlnbj1cIicgKyB0aGlzLnRva2VuLmFsaWduW2ldICsgJ1wiPicgKyBoZWFkaW5nICsgJzwvdGg+XFxuJ1xuICAgICAgICAgIDogJzx0aD4nICsgaGVhZGluZyArICc8L3RoPlxcbic7XG4gICAgICB9XG4gICAgICBib2R5ICs9ICc8L3RyPlxcbjwvdGhlYWQ+XFxuJztcblxuICAgICAgLy8gYm9keVxuICAgICAgYm9keSArPSAnPHRib2R5PlxcbidcbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnRva2VuLmNlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJvdyA9IHRoaXMudG9rZW4uY2VsbHNbaV07XG4gICAgICAgIGJvZHkgKz0gJzx0cj5cXG4nO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgcm93Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY2VsbCA9IHRoaXMuaW5saW5lLm91dHB1dChyb3dbal0pO1xuICAgICAgICAgIGJvZHkgKz0gdGhpcy50b2tlbi5hbGlnbltqXVxuICAgICAgICAgICAgPyAnPHRkIGFsaWduPVwiJyArIHRoaXMudG9rZW4uYWxpZ25bal0gKyAnXCI+JyArIGNlbGwgKyAnPC90ZD5cXG4nXG4gICAgICAgICAgICA6ICc8dGQ+JyArIGNlbGwgKyAnPC90ZD5cXG4nO1xuICAgICAgICB9XG4gICAgICAgIGJvZHkgKz0gJzwvdHI+XFxuJztcbiAgICAgIH1cbiAgICAgIGJvZHkgKz0gJzwvdGJvZHk+XFxuJztcblxuICAgICAgcmV0dXJuICc8dGFibGU+XFxuJ1xuICAgICAgICArIGJvZHlcbiAgICAgICAgKyAnPC90YWJsZT5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdibG9ja3F1b3RlX3N0YXJ0Jzoge1xuICAgICAgdmFyIGJvZHkgPSAnJztcblxuICAgICAgd2hpbGUgKHRoaXMubmV4dCgpLnR5cGUgIT09ICdibG9ja3F1b3RlX2VuZCcpIHtcbiAgICAgICAgYm9keSArPSB0aGlzLnRvaygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzxibG9ja3F1b3RlPlxcbidcbiAgICAgICAgKyBib2R5XG4gICAgICAgICsgJzwvYmxvY2txdW90ZT5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdsaXN0X3N0YXJ0Jzoge1xuICAgICAgdmFyIHR5cGUgPSB0aGlzLnRva2VuLm9yZGVyZWQgPyAnb2wnIDogJ3VsJ1xuICAgICAgICAsIGJvZHkgPSAnJztcblxuICAgICAgd2hpbGUgKHRoaXMubmV4dCgpLnR5cGUgIT09ICdsaXN0X2VuZCcpIHtcbiAgICAgICAgYm9keSArPSB0aGlzLnRvaygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzwnXG4gICAgICAgICsgdHlwZVxuICAgICAgICArICc+XFxuJ1xuICAgICAgICArIGJvZHlcbiAgICAgICAgKyAnPC8nXG4gICAgICAgICsgdHlwZVxuICAgICAgICArICc+XFxuJztcbiAgICB9XG4gICAgY2FzZSAnbGlzdF9pdGVtX3N0YXJ0Jzoge1xuICAgICAgdmFyIGJvZHkgPSAnJztcblxuICAgICAgd2hpbGUgKHRoaXMubmV4dCgpLnR5cGUgIT09ICdsaXN0X2l0ZW1fZW5kJykge1xuICAgICAgICBib2R5ICs9IHRoaXMudG9rZW4udHlwZSA9PT0gJ3RleHQnXG4gICAgICAgICAgPyB0aGlzLnBhcnNlVGV4dCgpXG4gICAgICAgICAgOiB0aGlzLnRvaygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzxsaT4nXG4gICAgICAgICsgYm9keVxuICAgICAgICArICc8L2xpPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2xvb3NlX2l0ZW1fc3RhcnQnOiB7XG4gICAgICB2YXIgYm9keSA9ICcnO1xuXG4gICAgICB3aGlsZSAodGhpcy5uZXh0KCkudHlwZSAhPT0gJ2xpc3RfaXRlbV9lbmQnKSB7XG4gICAgICAgIGJvZHkgKz0gdGhpcy50b2soKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICc8bGk+J1xuICAgICAgICArIGJvZHlcbiAgICAgICAgKyAnPC9saT5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdodG1sJzoge1xuICAgICAgcmV0dXJuICF0aGlzLnRva2VuLnByZSAmJiAhdGhpcy5vcHRpb25zLnBlZGFudGljXG4gICAgICAgID8gdGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4udGV4dClcbiAgICAgICAgOiB0aGlzLnRva2VuLnRleHQ7XG4gICAgfVxuICAgIGNhc2UgJ3BhcmFncmFwaCc6IHtcbiAgICAgIHJldHVybiAnPHA+J1xuICAgICAgICArIHRoaXMuaW5saW5lLm91dHB1dCh0aGlzLnRva2VuLnRleHQpXG4gICAgICAgICsgJzwvcD5cXG4nO1xuICAgIH1cbiAgICBjYXNlICd0ZXh0Jzoge1xuICAgICAgcmV0dXJuICc8cD4nXG4gICAgICAgICsgdGhpcy5wYXJzZVRleHQoKVxuICAgICAgICArICc8L3A+XFxuJztcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogSGVscGVyc1xuICovXG5cbmZ1bmN0aW9uIGVzY2FwZShodG1sLCBlbmNvZGUpIHtcbiAgcmV0dXJuIGh0bWxcbiAgICAucmVwbGFjZSghZW5jb2RlID8gLyYoPyEjP1xcdys7KS9nIDogLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZShyZWdleCwgb3B0KSB7XG4gIHJlZ2V4ID0gcmVnZXguc291cmNlO1xuICBvcHQgPSBvcHQgfHwgJyc7XG4gIHJldHVybiBmdW5jdGlvbiBzZWxmKG5hbWUsIHZhbCkge1xuICAgIGlmICghbmFtZSkgcmV0dXJuIG5ldyBSZWdFeHAocmVnZXgsIG9wdCk7XG4gICAgdmFsID0gdmFsLnNvdXJjZSB8fCB2YWw7XG4gICAgdmFsID0gdmFsLnJlcGxhY2UoLyhefFteXFxbXSlcXF4vZywgJyQxJyk7XG4gICAgcmVnZXggPSByZWdleC5yZXBsYWNlKG5hbWUsIHZhbCk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxubm9vcC5leGVjID0gbm9vcDtcblxuZnVuY3Rpb24gbWVyZ2Uob2JqKSB7XG4gIHZhciBpID0gMVxuICAgICwgdGFyZ2V0XG4gICAgLCBrZXk7XG5cbiAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICB0YXJnZXQgPSBhcmd1bWVudHNbaV07XG4gICAgZm9yIChrZXkgaW4gdGFyZ2V0KSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhcmdldCwga2V5KSkge1xuICAgICAgICBvYmpba2V5XSA9IHRhcmdldFtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogTWFya2VkXG4gKi9cblxuZnVuY3Rpb24gbWFya2VkKHNyYywgb3B0LCBjYWxsYmFjaykge1xuICBpZiAoY2FsbGJhY2sgfHwgdHlwZW9mIG9wdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0O1xuICAgICAgb3B0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAob3B0KSBvcHQgPSBtZXJnZSh7fSwgbWFya2VkLmRlZmF1bHRzLCBvcHQpO1xuXG4gICAgdmFyIGhpZ2hsaWdodCA9IG9wdC5oaWdobGlnaHRcbiAgICAgICwgdG9rZW5zXG4gICAgICAsIHBlbmRpbmdcbiAgICAgICwgaSA9IDA7XG5cbiAgICB0cnkge1xuICAgICAgdG9rZW5zID0gTGV4ZXIubGV4KHNyYywgb3B0KVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICB9XG5cbiAgICBwZW5kaW5nID0gdG9rZW5zLmxlbmd0aDtcblxuICAgIHZhciBkb25lID0gZnVuY3Rpb24oaGkpIHtcbiAgICAgIHZhciBvdXQsIGVycjtcblxuICAgICAgaWYgKGhpICE9PSB0cnVlKSB7XG4gICAgICAgIGRlbGV0ZSBvcHQuaGlnaGxpZ2h0O1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBvdXQgPSBQYXJzZXIucGFyc2UodG9rZW5zLCBvcHQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBlcnIgPSBlO1xuICAgICAgfVxuXG4gICAgICBvcHQuaGlnaGxpZ2h0ID0gaGlnaGxpZ2h0O1xuXG4gICAgICByZXR1cm4gZXJyXG4gICAgICAgID8gY2FsbGJhY2soZXJyKVxuICAgICAgICA6IGNhbGxiYWNrKG51bGwsIG91dCk7XG4gICAgfTtcblxuICAgIGlmICghaGlnaGxpZ2h0IHx8IGhpZ2hsaWdodC5sZW5ndGggPCAzKSB7XG4gICAgICByZXR1cm4gZG9uZSh0cnVlKTtcbiAgICB9XG5cbiAgICBpZiAoIXBlbmRpbmcpIHJldHVybiBkb25lKCk7XG5cbiAgICBmb3IgKDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgKGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSAnY29kZScpIHtcbiAgICAgICAgICByZXR1cm4gLS1wZW5kaW5nIHx8IGRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGlnaGxpZ2h0KHRva2VuLnRleHQsIHRva2VuLmxhbmcsIGZ1bmN0aW9uKGVyciwgY29kZSkge1xuICAgICAgICAgIGlmIChjb2RlID09IG51bGwgfHwgY29kZSA9PT0gdG9rZW4udGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIC0tcGVuZGluZyB8fCBkb25lKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRva2VuLnRleHQgPSBjb2RlO1xuICAgICAgICAgIHRva2VuLmVzY2FwZWQgPSB0cnVlO1xuICAgICAgICAgIC0tcGVuZGluZyB8fCBkb25lKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSkodG9rZW5zW2ldKTtcbiAgICB9XG5cbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBpZiAob3B0KSBvcHQgPSBtZXJnZSh7fSwgbWFya2VkLmRlZmF1bHRzLCBvcHQpO1xuICAgIHJldHVybiBQYXJzZXIucGFyc2UoTGV4ZXIubGV4KHNyYywgb3B0KSwgb3B0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGUubWVzc2FnZSArPSAnXFxuUGxlYXNlIHJlcG9ydCB0aGlzIHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGpqL21hcmtlZC4nO1xuICAgIGlmICgob3B0IHx8IG1hcmtlZC5kZWZhdWx0cykuc2lsZW50KSB7XG4gICAgICByZXR1cm4gJzxwPkFuIGVycm9yIG9jY3VyZWQ6PC9wPjxwcmU+J1xuICAgICAgICArIGVzY2FwZShlLm1lc3NhZ2UgKyAnJywgdHJ1ZSlcbiAgICAgICAgKyAnPC9wcmU+JztcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG4vKipcbiAqIE9wdGlvbnNcbiAqL1xuXG5tYXJrZWQub3B0aW9ucyA9XG5tYXJrZWQuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uKG9wdCkge1xuICBtZXJnZShtYXJrZWQuZGVmYXVsdHMsIG9wdCk7XG4gIHJldHVybiBtYXJrZWQ7XG59O1xuXG5tYXJrZWQuZGVmYXVsdHMgPSB7XG4gIGdmbTogdHJ1ZSxcbiAgdGFibGVzOiB0cnVlLFxuICBicmVha3M6IGZhbHNlLFxuICBwZWRhbnRpYzogZmFsc2UsXG4gIHNhbml0aXplOiBmYWxzZSxcbiAgc21hcnRMaXN0czogZmFsc2UsXG4gIHNpbGVudDogZmFsc2UsXG4gIGhpZ2hsaWdodDogbnVsbCxcbiAgbGFuZ1ByZWZpeDogJ2xhbmctJyxcbiAgc21hcnR5cGFudHM6IGZhbHNlXG59O1xuXG4vKipcbiAqIEV4cG9zZVxuICovXG5cbm1hcmtlZC5QYXJzZXIgPSBQYXJzZXI7XG5tYXJrZWQucGFyc2VyID0gUGFyc2VyLnBhcnNlO1xuXG5tYXJrZWQuTGV4ZXIgPSBMZXhlcjtcbm1hcmtlZC5sZXhlciA9IExleGVyLmxleDtcblxubWFya2VkLklubGluZUxleGVyID0gSW5saW5lTGV4ZXI7XG5tYXJrZWQuaW5saW5lTGV4ZXIgPSBJbmxpbmVMZXhlci5vdXRwdXQ7XG5cbm1hcmtlZC5wYXJzZSA9IG1hcmtlZDtcblxuaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICBtb2R1bGUuZXhwb3J0cyA9IG1hcmtlZDtcbn0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIG1hcmtlZDsgfSk7XG59IGVsc2Uge1xuICB0aGlzLm1hcmtlZCA9IG1hcmtlZDtcbn1cblxufSkuY2FsbChmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMgfHwgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsKTtcbn0oKSk7XG5cbn0pKHNlbGYpIiwicmVxdWlyZSAnLi9icmluZy10aGUtbm9pc2UuY29mZmVlJ1xuXG52aXhlbiA9IHJlcXVpcmUgJ3ZpeGVuJ1xubWFya2VkID0gcmVxdWlyZSAnbWFya2VkJ1xubWFya2VkLnNldE9wdGlvbnNcbiAgZ2ZtOiB0cnVlXG4gIHRhYmxlczogdHJ1ZVxuICBicmVha3M6IHRydWVcbiAgc21hcnRMaXN0czogdHJ1ZVxuXG5yZXF1aXJlICcuL3VuaWZ5LmNvZmZlZSdcblxuc3RhdGVfID0gcmVxdWlyZSAnLi9zdGF0ZS5jb2ZmZWUnXG5yZXF1aXJlICcuL3N0YXRlLWdpc3QuY29mZmVlJ1xuXG57bnVtYmVyLCBpbmRleCwgdG9jfSA9IHJlcXVpcmUgJy4vdXRpbHMuY29mZmVlJ1xuXG5leHRlbmQgPSAocj17fSwgZCkgLT4gcltrXSA9IHYgZm9yIGssIHYgb2YgZCB3aGVuIHY/OyByXG5leHRlbmRBID0gKHI9e30sIGEpIC0+IHJba10gPSB2IGZvciBbaywgdl0gaW4gYSB3aGVuIHY/OyByXG5cbnByb3h5ID0gKGRpY3QpIC0+XG4gIHZhdWx0XyA9IHt9XG4gIGRlZl8gPSAocHJvcCwgZm4pIC0+XG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIHNldDogKHZhbHVlKSAtPlxuICAgICAgb2xkID0gdmF1bHRfW3Byb3BdXG4gICAgICB2YXVsdF9bcHJvcF0gPSB2YWx1ZVxuICAgICAgZm4gdmFsdWUsIG9sZFxuICAgIGdldDogLT4gdmF1bHRfW3Byb3BdXG4gIE9iamVjdC5jcmVhdGUgT2JqZWN0LnByb3RvdHlwZSxcbiAgICBleHRlbmRBKHsgdG9KU09OOiB2YWx1ZTogLT4gdmF1bHRfIH0sIChbcHJvcCwgZGVmXyhwcm9wLCBmbildIGZvciBwcm9wLCBmbiBvZiBkaWN0KSlcblxudG9jRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG9jJ1xudmlld0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3ZpZXcnXG52aWV3V3JhcEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3ZpZXctd3JhcCdcblxudXBkYXRlVG9jID0gLT4gdG9jRWwuaW5uZXJIVE1MID0gdG9jIHZpZXdFbFxudXBkYXRlSW5kZXggPSAtPiBpbmRleCBudW1iZXIgdmlld0VsXG5cbnN0YXRlID0gcHJveHlcbiAgdG9jOiAodG8pIC0+XG4gICAgdXBkYXRlVG9jKCkgaWYgdG9cbiAgICBtb2RlbC5zaG93VG9jID0gaWYgdG8gdGhlbiAndG9jJyBlbHNlICcnXG4gIGluZGV4OiAodG8pIC0+XG4gICAgaWYgdG9cbiAgICAgIGlmIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyN2aWV3IFtkYXRhLW51bWJlcl0nKS5sZW5ndGggaXMgMFxuICAgICAgICB1cGRhdGVJbmRleCgpXG4gICAgICAgIHVwZGF0ZVRvYygpIGlmIHN0YXRlLnRvY1xuICAgICAgbW9kZWwuc2hvd0luZGV4ID0gJ2luZGV4ZWQnXG4gICAgZWxzZVxuICAgICAgbW9kZWwuc2hvd0luZGV4ID0gJydcbiAgbW9kZTogKG1vZGUpIC0+XG4gICAgbW9kZWwubW9kZSA9IHtcbiAgICAgIHdyaXRlOiAnZnVsbC1pbnB1dCdcbiAgICAgIHJlYWQ6ICdmdWxsLXZpZXcnXG4gICAgfVttb2RlXSBvciAnJ1xuICB0aGVtZTogKHYpIC0+XG4gICAgbW9kZWwudGhlbWUgPSB2XG5cbmRvY1RpdGxlID0gLT5cbiAgdG1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICB0bXAuaW5uZXJIVE1MID0gaWYgKGggPSB2aWV3RWwucXVlcnlTZWxlY3RvckFsbCgnaDEsaDIsaDMnKVswXSlcbiAgICBoLmlubmVySFRNTFxuICBlbHNlXG4gICAgJ1VudGl0bGVkJ1xuICBbXS5mb3JFYWNoLmNhbGwgdG1wLnF1ZXJ5U2VsZWN0b3JBbGwoJy5pbmRleCcpLCAoZWwpIC0+IHRtcC5yZW1vdmVDaGlsZCBlbFxuICB0bXAudGV4dENvbnRlbnRcblxuaW5pdGlhdGVkID0gbm9cbnNhdmVkID0geWVzXG5cbnNhdmUgPSAoZm9yY2UpIC0+XG4gIGlmIG5vdCBzYXZlZCBvciBmb3JjZVxuICAgIHN0YXRlXy5zdG9yZSBudWxsLFxuICAgICAgdGV4dDogZWRpdG9yLmdldFZhbHVlKClcbiAgICAgIG1ldGE6IGV4dGVuZCBzdGF0ZSwgdGl0bGU6ZG9jVGl0bGUoKSwgYXV0b3NhdmU6bm90IGZvcmNlXG4gICAgLChlcnIsIGlkKSAtPlxuICAgICAgc2F2ZWQgPSBub3QgZXJyP1xuICAgICAgdXBkYXRlVGl0bGUoKVxuXG51cGRhdGVWaWV3ID0gLT5cbiAgY2xpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZVxuICBtZCA9IGVkaXRvci5nZXRWYWx1ZSgpLnNwbGl0ICdcXG4nXG4gIG1kW2NsaW5lXSArPSAnPHNwYW4gaWQ9XCJjdXJzb3JcIj48L3NwYW4+J1xuICBtZCA9IG1kLmpvaW4gJ1xcbidcbiAgdiA9IHZpZXdFbFxuICB2LmlubmVySFRNTCA9IG1hcmtlZCBtZFxuICB1cGRhdGVJbmRleCgpIGlmIHN0YXRlLmluZGV4XG4gIHVwZGF0ZVRvYygpIGlmIHN0YXRlLnRvY1xuICBzY3JvbGxUb3AgPSB2aWV3V3JhcEVsLnNjcm9sbFRvcFxuICB2aWV3SGVpZ2h0ID0gdmlld1dyYXBFbC5vZmZzZXRIZWlnaHRcbiAgY3Vyc29yU3BhbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdjdXJzb3InXG4gIGN1cnNvclRvcCA9IGN1cnNvclNwYW4ub2Zmc2V0VG9wXG4gIGN1cnNvckhlaWdodCA9IGN1cnNvclNwYW4ub2Zmc2V0SGVpZ2h0XG4gIGlmIGN1cnNvclRvcCA8IHNjcm9sbFRvcCBvciBjdXJzb3JUb3AgPiBzY3JvbGxUb3AgKyB2aWV3SGVpZ2h0IC0gY3Vyc29ySGVpZ2h0XG4gICAgdmlld1dyYXBFbC5zY3JvbGxUb3AgPSBjdXJzb3JUb3AgLSB2aWV3SGVpZ2h0LzJcblxudXBkYXRlVGl0bGUgPSAtPlxuICBkb2N1bWVudC50aXRsZSA9IChpZiBzYXZlZCB0aGVuICcnIGVsc2UgJyonKStkb2NUaXRsZSgpXG5cbnNhdmVUaW1lciA9IG51bGxcbmVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1tZCcpLFxuICBtb2RlOiAnZ2ZtJ1xuICB0aGVtZTogJ2RlZmF1bHQnXG4gIGxpbmVOdW1iZXJzOiBub1xuICBsaW5lV3JhcHBpbmc6IHllc1xuICBkcmFnRHJvcDogbm9cbmVkaXRvci5vbiAnY2hhbmdlJywgLT5cbiAgdXBkYXRlVmlldygpXG4gIGlmIGluaXRpYXRlZFxuICAgIGlmIHNhdmVkXG4gICAgICBzYXZlZCA9IG5vXG4gICAgICB1cGRhdGVUaXRsZSgpXG4gICAgY2xlYXJUaW1lb3V0IHNhdmVUaW1lclxuICAgIHNhdmVUaW1lciA9IHNldFRpbWVvdXQgc2F2ZSwgNTAwMFxuICBlbHNlXG4gICAgdXBkYXRlVGl0bGUoKVxuXG5yZXN0b3JlID0gKGRhdGEpIC0+XG4gIGN1cnJlbnRUZXh0ID0gZWRpdG9yLmdldFZhbHVlKClcbiAgaWYgZGF0YVxuICAgIHsgdGV4dCwgbWV0YSB9ID0gZGF0YVxuICAgIGV4dGVuZCBzdGF0ZSwgbWV0YSBvciB7fVxuICAgIGVkaXRvci5zZXRWYWx1ZSB0ZXh0IGlmIHRleHQ/IGFuZCB0ZXh0IGlzbnQgY3VycmVudFRleHRcbiAgZWxzZSBpZiBjdXJyZW50VGV4dFxuICAgIHNhdmUgdHJ1ZVxuICBtb2RlbC50aGVtZSA9IHN0YXRlLnRoZW1lIG9yICdzZXJpZidcbiAgaW5pdGlhdGVkID0geWVzXG5cbm1vZGVsID1cbiAgc2hvdzogKHYpIC0+IGlmIHYgdGhlbiAnJyBlbHNlICdoaWRlJ1xuICBoaWRlOiAodikgLT4gaWYgdiB0aGVuICdoaWRlJyBlbHNlICcnXG4gIG5vb3A6IChlKSAtPiBlLnByZXZlbnREZWZhdWx0KCk7IGZhbHNlXG4gIHN0b3A6IChlKSAtPiBlLnN0b3BQcm9wYWdhdGlvbigpOyBmYWxzZVxuICBkcm9wOiAoZSkgLT5cbiAgICByZWFkZXIgPSBuZXcgRmlsZVJlYWRlclxuICAgIHJlYWRlci5vbmxvYWQgPSAoZSkgLT5cbiAgICAgIGluaXRpYXRlZCA9IHllc1xuICAgICAgZWRpdG9yLnNldFZhbHVlIGUudGFyZ2V0LnJlc3VsdFxuICAgIHJlYWRlci5yZWFkQXNUZXh0IGUuZGF0YVRyYW5zZmVyLmZpbGVzWzBdXG4gIHNldHRpbmdzOiAtPlxuICAgIG1vZGVsLnNob3dTZXR0aW5ncyA9IHllc1xuICBzdG9yZXM6IE9iamVjdC5rZXlzKHN0YXRlXy5zdG9yZXMpLm1hcCAoa2V5KSAtPiBuYW1lOiBrZXlcbiAgdGhlbWVzOiBbICdzZXJpZicsICdjdicgXS5tYXAgKG5hbWUpIC0+XG4gICAgbmFtZTogbmFtZVxuICAgIGNsaWNrOiAtPiBzdGF0ZS50aGVtZSA9IG5hbWVcbiAgc2hvd1NldHRpbmdzOiBub1xuICBwcmludDogLT4gd2luZG93LnByaW50KClcbiAgbW9kZTogJydcbiAgdG9nZ2xlVG9jOiAtPiBzdGF0ZS50b2MgPSBub3Qgc3RhdGUudG9jXG4gIHRvZ2dsZUluZGV4OiAtPiBzdGF0ZS5pbmRleCA9IG5vdCBzdGF0ZS5pbmRleFxuICBleHBhbmRJbnB1dDogLT5cbiAgICBzdGF0ZS5tb2RlID0gKGlmIHN0YXRlLm1vZGUgdGhlbiAnJyBlbHNlICd3cml0ZScpXG4gIGV4cGFuZFZpZXc6IC0+XG4gICAgc3RhdGUubW9kZSA9IChpZiBzdGF0ZS5tb2RlIHRoZW4gJycgZWxzZSAncmVhZCcpXG4gIGNsb3NlUG9wdXBzOiAtPiBtb2RlbC5zaG93U2V0dGluZ3MgPSBub1xuICBtb3VzZW91dDogKGUpIC0+XG4gICAgZnJvbSA9IGUucmVsYXRlZFRhcmdldCBvciBlLnRvRWxlbWVudFxuICAgIHNhdmUoKSBpZiBub3QgZnJvbSBvciBmcm9tLm5vZGVOYW1lIGlzICdIVE1MJ1xuICBob3RrZXk6IChlKSAtPlxuICAgIGlmIGUuY3RybEtleVxuICAgICAgaWYgZS5hbHRLZXlcbiAgICAgICAgc3dpdGNoIGUua2V5Q29kZVxuICAgICAgICAgIHdoZW4gMjQgdGhlbiBzdGF0ZS5tb2RlID0gJ3dyaXRlJyAjIGN0cmwrYWx0K3hcbiAgICAgICAgICB3aGVuIDMgdGhlbiBzdGF0ZS5tb2RlID0gJycgIyBjdHJsK2FsdCtjXG4gICAgICAgICAgd2hlbiAyMiB0aGVuIHN0YXRlLm1vZGUgPSAncmVhZCcgIyBjdHJsK2FsdCt2XG4gICAgICBlbHNlXG4gICAgICAgIHN3aXRjaCBlLmtleUNvZGVcbiAgICAgICAgICB3aGVuIDE5IHRoZW4gc2F2ZSB0cnVlXG5cbnN0YXRlXy5yZXN0b3JlIG51bGwsIG51bGwsIChlcnIsIGRhdGEpIC0+IHJlc3RvcmUgZGF0YVxuc3RhdGVfLm9uICdyZXN0b3JlJywgKGRhdGEpIC0+XG4gIGluaXRpYXRlZCA9IG5vXG4gIHJlc3RvcmUgZGF0YVxuXG52aXhlbiBkb2N1bWVudC5ib2R5LnBhcmVudE5vZGUsIG1vZGVsXG5cbndpbmRvdy5vbmJlZm9yZXVubG9hZCA9IC0+XG4gICdZb3UgaGF2ZSB1bnNhdmVkIGNoYW5nZXMuJyBpZiBub3Qgc2F2ZWRcbiIsIiFmdW5jdGlvbihvYmopIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKVxuICAgIG1vZHVsZS5leHBvcnRzID0gb2JqO1xuICBlbHNlXG4gICAgd2luZG93LnZpeGVuID0gb2JqO1xufShmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdHJpbShzdHIpIHtyZXR1cm4gU3RyaW5nLnByb3RvdHlwZS50cmltLmNhbGwoc3RyKTt9O1xuXG4gIGZ1bmN0aW9uIHJlc29sdmVQcm9wKG9iaiwgbmFtZSkge1xuICAgIHJldHVybiBuYW1lLnRyaW0oKS5zcGxpdCgnLicpLnJlZHVjZShmdW5jdGlvbiAocCwgcHJvcCkge1xuICAgICAgcmV0dXJuIHAgPyBwW3Byb3BdIDogdW5kZWZpbmVkO1xuICAgIH0sIG9iaik7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlQ2hhaW4ob2JqLCBjaGFpbikge1xuICAgIHZhciBwcm9wID0gY2hhaW4uc2hpZnQoKTtcbiAgICByZXR1cm4gY2hhaW4ucmVkdWNlKGZ1bmN0aW9uIChwLCBwcm9wKSB7XG4gICAgICB2YXIgZiA9IHJlc29sdmVQcm9wKG9iaiwgcHJvcCk7XG4gICAgICByZXR1cm4gZiA/IGYocCkgOiBwO1xuICAgIH0sIHJlc29sdmVQcm9wKG9iaiwgcHJvcCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gYnVja2V0KGIsIGssIHYpIHtcbiAgICBpZiAoIShrIGluIGIpKSBiW2tdID0gW107XG4gICAgaWYgKCEodiBpbiBiW2tdKSkgYltrXS5wdXNoKHYpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0ZW5kKG9yaWcsIG9iaikge1xuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBvcmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgIH0pO1xuICAgIHJldHVybiBvcmlnO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhdmVyc2VFbGVtZW50cyhlbCwgY2FsbGJhY2spIHtcbiAgICB2YXIgaTtcbiAgICBpZiAoY2FsbGJhY2soZWwpICE9PSBmYWxzZSkge1xuICAgICAgZm9yKGkgPSBlbC5jaGlsZHJlbi5sZW5ndGg7IGktLTspIChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB0cmF2ZXJzZUVsZW1lbnRzKG5vZGUsIGNhbGxiYWNrKTtcbiAgICAgIH0pKGVsLmNoaWxkcmVuW2ldKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVQcm94eShtYXBzLCBwcm94eSkge1xuICAgIHByb3h5ID0gcHJveHkgfHwge307XG4gICAgcHJveHkuZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgdG9SZW5kZXIgPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgIG1hcHMub3JpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgaWYgKG1hcHMuYmluZHNbcHJvcF0pIG1hcHMuYmluZHNbcHJvcF0uZm9yRWFjaChmdW5jdGlvbihyZW5kZXJJZCkge1xuICAgICAgICAgIGlmIChyZW5kZXJJZCA+PSAwKSB0b1JlbmRlcltyZW5kZXJJZF0gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgZm9yIChyZW5kZXJJZCBpbiB0b1JlbmRlcikgbWFwcy5yZW5kZXJzW3JlbmRlcklkXShtYXBzLm9yaWcpO1xuICAgICAgcmV0dXJuIHByb3h5O1xuICAgIH07XG5cbiAgICBPYmplY3Qua2V5cyhtYXBzLmJpbmRzKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIHZhciBpZHMgPSBtYXBzLmJpbmRzW3Byb3BdO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3h5LCBwcm9wLCB7XG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBtYXBzLm9yaWdbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICBpZHMuZm9yRWFjaChmdW5jdGlvbihyZW5kZXJJZCkge1xuICAgICAgICAgICAgaWYgKHJlbmRlcklkID49IDApIG1hcHMucmVuZGVyc1tyZW5kZXJJZF0obWFwcy5vcmlnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAobWFwcy5yZWJpbmRzW3Byb3BdKVxuICAgICAgICAgICAgcmV0dXJuIG1hcHMucmViaW5kc1twcm9wXSgpO1xuICAgICAgICAgIHJldHVybiBtYXBzLm9yaWdbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBwcm94eTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihlbCwgbW9kZWwpIHtcbiAgICB2YXIgcGF0dGVybiA9IC9cXHtcXHsuKz9cXH1cXH0vZyxcbiAgICAgICAgcGlwZSA9ICd8JztcblxuICAgIGZ1bmN0aW9uIHJlc29sdmUob3JpZywgcHJvcCkge1xuICAgICAgaWYgKCFvcmlnKSByZXR1cm4gJyc7XG4gICAgICB2YXIgdmFsID0gcmVzb2x2ZUNoYWluKG9yaWcsIHByb3Auc2xpY2UoMiwtMikuc3BsaXQocGlwZSkpO1xuICAgICAgcmV0dXJuIHZhbCA9PT0gdW5kZWZpbmVkID8gJycgOiB2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyVG1wbChzdHIsIG9yaWcpIHtcbiAgICAgIHJldHVybiBzdHIucmVwbGFjZShwYXR0ZXJuLCByZXNvbHZlLmJpbmQodW5kZWZpbmVkLCBvcmlnKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2goc3RyKSB7XG4gICAgICB2YXIgbSA9IHN0ci5tYXRjaChwYXR0ZXJuKTtcbiAgICAgIGlmIChtKSByZXR1cm4gbS5tYXAoZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgcmV0dXJuIGNoYWluLnNsaWNlKDIsIC0yKS5zcGxpdChwaXBlKS5tYXAodHJpbSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cmF2ZXJzZShlbCwgb3JpZykge1xuICAgICAgdmFyIGJpbmRzID0ge30sXG4gICAgICAgICAgcmViaW5kcyA9IHt9LFxuICAgICAgICAgIHJlbmRlcnMgPSB7fSxcbiAgICAgICAgICBjb3VudCA9IDA7XG4gICAgICBvcmlnID0gb3JpZyB8fCB7fTtcblxuICAgICAgZnVuY3Rpb24gYmluZFJlbmRlcnMoY2hhaW5zLCByZW5kZXJJZCkge1xuICAgICAgICAvLyBDcmVhdGUgcHJvcGVydHkgdG8gcmVuZGVyIG1hcHBpbmdcbiAgICAgICAgY2hhaW5zLmZvckVhY2goZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgICAvLyBUT0RPOiBSZWdpc3RlciBjaGFpbmluZyBmdW5jdGlvbnMgYXMgYmluZHMgYXMgd2VsbC5cbiAgICAgICAgICBidWNrZXQoYmluZHMsIGNoYWluWzBdLnNwbGl0KCcuJylbMF0sIHJlbmRlcklkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHBhcnNlSXRlcmF0b3IoZWwpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgcHJlZml4ID0gJycsIG5vZGVzID0gW107XG4gICAgICAgIGlmIChwYXJlbnRfID0gKGVsLnBhcmVudEVsZW1lbnQgfHwgZWwucGFyZW50Tm9kZSkpIHtcbiAgICAgICAgICBpZiAoZWwudGFnTmFtZSA9PT0gJ0ZPUicpIHtcbiAgICAgICAgICAgIG1hcmtlciA9IGVsLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgICAgICAgcGFyZW50Xy5yZXBsYWNlQ2hpbGQobWFya2VyLCBlbCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaW4nKSkge1xuICAgICAgICAgICAgcHJlZml4ID0gJ2RhdGEtJztcbiAgICAgICAgICAgIHBhcmVudF8gPSBlbDtcbiAgICAgICAgICAgIG5vZGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWwuY2hpbGROb2Rlcyk7XG4gICAgICAgICAgICBtYXJrZXIgPSBlbC5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgICAgIHBhcmVudF8uYXBwZW5kQ2hpbGQobWFya2VyKTtcbiAgICAgICAgICB9IGVsc2UgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhbGlhczogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsndmFsdWUnKSxcbiAgICAgICAgICAgIGtleTogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsna2V5JyksXG4gICAgICAgICAgICBwcm9wOiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4KydpbicpLFxuICAgICAgICAgICAgZWFjaDogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsnZWFjaCcpLFxuICAgICAgICAgICAgbm9kZXM6IG5vZGVzLFxuICAgICAgICAgICAgcGFyZW50OiBwYXJlbnRfLFxuICAgICAgICAgICAgbWFya2VyOiBtYXJrZXJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1hcEF0dHJpYnV0ZShvd25lciwgYXR0cikge1xuICAgICAgICB2YXIgbmFtZSwgZXZlbnRJZCwgcmVuZGVySWQsIHN0ciwgbm9UbXBsO1xuICAgICAgICBpZiAoKHN0ciA9IGF0dHIudmFsdWUpICYmIChjaGFpbnMgPSBtYXRjaChzdHIpKSkge1xuICAgICAgICAgIG5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgICAgaWYgKG5hbWUuaW5kZXhPZigndngtJykgPT09IDApIHtcbiAgICAgICAgICAgIG93bmVyLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignb24nKSA9PT0gMCkge1xuICAgICAgICAgICAgcmVuZGVySWQgPSAtMTsgLy8gTm8gcmVuZGVyZXJcbiAgICAgICAgICAgIGV2ZW50TmFtZSA9IG5hbWUuc3Vic3RyKDIpO1xuICAgICAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyc1xuICAgICAgICAgICAgY2hhaW5zLmZvckVhY2goZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgICAgICAgb3duZXIuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlUHJvcChvcmlnLCBjaGFpblswXSkoZXZ0LCBvd25lci52YWx1ZSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBvd25lci5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vVG1wbCA9IGNoYWlucy5sZW5ndGggPT09IDEgJiYgc3RyLnN1YnN0cigwLDEpID09PSAneycgJiZcbiAgICAgICAgICAgICAgc3RyLnN1YnN0cigtMSkgPT09ICd9JztcbiAgICAgICAgICAgIC8vIENyZWF0ZSByZW5kZXJpbmcgZnVuY3Rpb24gZm9yIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgIHJlbmRlcklkID0gY291bnQrKztcbiAgICAgICAgICAgIChyZW5kZXJzW3JlbmRlcklkXSA9IGZ1bmN0aW9uKG9yaWcsIGNsZWFyKSB7XG4gICAgICAgICAgICAgIHZhciB2YWwgPSBub1RtcGwgPyByZXNvbHZlKG9yaWcsIHN0cikgOiBzdHJUbXBsKHN0ciwgb3JpZyk7XG4gICAgICAgICAgICAgICFjbGVhciAmJiBuYW1lIGluIG93bmVyID8gb3duZXJbbmFtZV0gPSB2YWwgOlxuICAgICAgICAgICAgICAgIG93bmVyLnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuICAgICAgICAgICAgfSkob3JpZywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBCaS1kaXJlY3Rpb25hbCBjb3VwbGluZy5cbiAgICAgICAgICAgIGlmIChub1RtcGwpIHJlYmluZHNbY2hhaW5zWzBdWzBdXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEdldHRpbmcgZi5leC4gJ3ZhbHVlJyBhdHRyaWJ1dGUgZnJvbSBhbiBpbnB1dFxuICAgICAgICAgICAgICAgIC8vIGRvZXNuJ3QgcmV0dXJuIHVzZXIgaW5wdXQgdmFsdWUgc28gYWNjZXNzaW5nIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAvLyBvYmplY3QgcHJvcGVydGllcyBkaXJlY3RseSwgZmluZCBvdXQgaG93IHRvIGRvIHRoaXNcbiAgICAgICAgICAgICAgICAvLyBtb3JlIHNlY3VyZWx5LlxuICAgICAgICAgICAgICAgIHJldHVybiBuYW1lIGluIG93bmVyID9cbiAgICAgICAgICAgICAgICAgIG93bmVyW25hbWVdIDogb3duZXIuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBiaW5kUmVuZGVycyhjaGFpbnMsIHJlbmRlcklkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYXBUZXh0Tm9kZXMoZWwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IGVsLmNoaWxkTm9kZXMubGVuZ3RoOyBpLS07KSAoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIHZhciBzdHIsIHJlbmRlcklkLCBjaGFpbnM7XG4gICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IGVsLlRFWFRfTk9ERSAmJiAoc3RyID0gbm9kZS5ub2RlVmFsdWUpICYmXG4gICAgICAgICAgICAgIChjaGFpbnMgPSBtYXRjaChzdHIpKSkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBmb3IgZWxlbWVudCB0ZXh0IG5vZGUuXG4gICAgICAgICAgICByZW5kZXJJZCA9IGNvdW50Kys7XG4gICAgICAgICAgICAocmVuZGVyc1tyZW5kZXJJZF0gPSBmdW5jdGlvbihvcmlnKSB7XG4gICAgICAgICAgICAgIG5vZGUubm9kZVZhbHVlID0gc3RyVG1wbChzdHIsIG9yaWcpO1xuICAgICAgICAgICAgfSkob3JpZyk7XG4gICAgICAgICAgICBiaW5kUmVuZGVycyhjaGFpbnMsIHJlbmRlcklkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKGVsLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgbm8tdHJhdmVyc2UgYXR0cmlidXRlIGlmIHJvb3Qgbm9kZVxuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXN1YnZpZXcnKTtcblxuICAgICAgdHJhdmVyc2VFbGVtZW50cyhlbCwgZnVuY3Rpb24oZWxfKSB7XG4gICAgICAgIHZhciBpLCBpdGVyLCB0ZW1wbGF0ZSwgbm9kZXMsIHJlbmRlcklkO1xuXG4gICAgICAgIC8vIFN0b3AgaGFuZGxpbmcgYW5kIHJlY3Vyc2lvbiBpZiBzdWJ2aWV3LlxuICAgICAgICBpZiAoZWxfLmdldEF0dHJpYnV0ZSgnZGF0YS1zdWJ2aWV3JykgIT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoaXRlciA9IHBhcnNlSXRlcmF0b3IoZWxfKSkge1xuICAgICAgICAgIG5vZGVzID0gaXRlci5ub2RlcztcbiAgICAgICAgICB0ZW1wbGF0ZSA9IGVsXy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgbWFwcyA9IHRyYXZlcnNlKHRlbXBsYXRlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgICAgcmVuZGVySWQgPSBjb3VudCsrO1xuICAgICAgICAgIChyZW5kZXJzW3JlbmRlcklkXSA9IGZ1bmN0aW9uKG9yaWcpIHtcbiAgICAgICAgICAgIHZhciBsaXN0ID0gcmVzb2x2ZVByb3Aob3JpZywgaXRlci5wcm9wKSxcbiAgICAgICAgICAgICAgICBlYWNoXyA9IGl0ZXIuZWFjaCAmJiByZXNvbHZlUHJvcChvcmlnLCBpdGVyLmVhY2gpLCBpO1xuICAgICAgICAgICAgZm9yIChpID0gbm9kZXMubGVuZ3RoOyBpLS07KSBpdGVyLnBhcmVudC5yZW1vdmVDaGlsZChub2Rlc1tpXSk7XG4gICAgICAgICAgICBub2RlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChpIGluIGxpc3QpIGlmIChsaXN0Lmhhc093blByb3BlcnR5KGkpKVxuICAgICAgICAgICAgICAoZnVuY3Rpb24odmFsdWUsIGkpe1xuICAgICAgICAgICAgICAgIHZhciBvcmlnXyA9IGV4dGVuZCh7fSwgb3JpZyksXG4gICAgICAgICAgICAgICAgICAgIGNsb25lID0gdGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpLFxuICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGl0ZXIubWFya2VyLFxuICAgICAgICAgICAgICAgICAgICBtYXBzLCByZW5kZXJJZCwgaV8sIG5vZGUsIG5vZGVzXyA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChpdGVyLmtleSkgb3JpZ19baXRlci5rZXldID0gaTtcbiAgICAgICAgICAgICAgICBvcmlnX1tpdGVyLmFsaWFzXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIG1hcHMgPSB0cmF2ZXJzZShjbG9uZSwgb3JpZ18pO1xuICAgICAgICAgICAgICAgIGZvciAoaV8gPSBjbG9uZS5jaGlsZE5vZGVzLmxlbmd0aDsgaV8tLTsgbGFzdE5vZGUgPSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICBub2Rlc18ucHVzaChub2RlID0gY2xvbmUuY2hpbGROb2Rlc1tpX10pO1xuICAgICAgICAgICAgICAgICAgaXRlci5wYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIGxhc3ROb2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVhY2hfICYmIGVhY2hfKHZhbHVlLCBpLCBvcmlnXywgbm9kZXNfLmZpbHRlcihmdW5jdGlvbihuKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbi5ub2RlVHlwZSA9PT0gZWxfLkVMRU1FTlRfTk9ERTtcbiAgICAgICAgICAgICAgICB9KSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgZm9yIChpXyA9IG5vZGVzXy5sZW5ndGg7IGlfLS07KVxuICAgICAgICAgICAgICAgICAgICBpdGVyLnBhcmVudC5yZW1vdmVDaGlsZChub2Rlc19baV9dKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbm9kZXMgPSBub2Rlcy5jb25jYXQobm9kZXNfKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKGxpc3RbaV0sIGkpO1xuICAgICAgICAgIH0pKG9yaWcpO1xuICAgICAgICAgIGJ1Y2tldChiaW5kcywgaXRlci5wcm9wLnNwbGl0KCcuJylbMF0sIHJlbmRlcklkKTtcbiAgICAgICAgICBmb3IgKHAgaW4gbWFwcy5iaW5kcykgaWYgKGl0ZXIuYWxpYXMuaW5kZXhPZihwKSA9PT0gLTEpXG4gICAgICAgICAgICBidWNrZXQoYmluZHMsIHAsIHJlbmRlcklkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBCaW5kIG5vZGUgdGV4dC5cbiAgICAgICAgICBtYXBUZXh0Tm9kZXMoZWxfKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBCaW5kIG5vZGUgYXR0cmlidXRlcyBpZiBub3QgYSA8Zm9yPi5cbiAgICAgICAgaWYgKGVsXy50YWdOYW1lICE9PSAnRk9SJykgZm9yIChpID0gZWxfLmF0dHJpYnV0ZXMubGVuZ3RoOyBpLS07KVxuICAgICAgICAgIG1hcEF0dHJpYnV0ZShlbF8sIGVsXy5hdHRyaWJ1dGVzW2ldKTtcbiAgICAgICAgLy8gU3RvcCByZWN1cnNpb24gaWYgaXRlcmF0b3IuXG4gICAgICAgIHJldHVybiAhaXRlcjtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHtvcmlnOm9yaWcsIGJpbmRzOmJpbmRzLCByZWJpbmRzOnJlYmluZHMsIHJlbmRlcnM6cmVuZGVyc307XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVQcm94eSh0cmF2ZXJzZShlbCwgbW9kZWwgJiYgZXh0ZW5kKHt9LCBtb2RlbCkpLCBtb2RlbCk7XG4gIH07XG59KCkpO1xuIl19
;