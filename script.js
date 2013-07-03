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
var EventEmitter, State, Storage, base64, extend, kvpToDict, lzw,
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

Storage = (function() {
  var _this = this;

  function Storage() {
    if (this.id == null) {
      this.id = new Id;
    }
    if (this.version == null) {
      this.version = 0;
    }
  }

  Storage.prototype.local = {
    save: function(data, fn) {
      if (Storage.id in localStorage) {
        Storage.version += 1;
      }
      localStorage[Storage.id] = data;
      return fn(Storage.id, Storage.version);
    },
    get: function(id, fn) {
      var data, _ref;
      Storage.id = id;
      _ref = localStorage[Storage.id], data = _ref.data, Storage.version = _ref.version;
      return fn(data, Storage.version);
    }
  };

  return Storage;

}).call(this);

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
      return window.history.replaceState({}, '', this.baseUrl + type + '/' + id + '/' + version + '#' + generateState());
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

State.coders = {
  lzw: {
    encode: function(data, fn) {
      return fn(base64.encode(lzw.encode(data)));
    },
    decode: function(data, fn) {
      return fn(lzw.decode(base64.decode(data)));
    }
  },
  base64: {
    encode: function(data, fn) {
      return fn(base64.encode(data));
    },
    decode: function(data, fn) {
      return fn(base64.decode(data));
    }
  }
};

module.exports = State;


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
var Showdown, State, markdown, vixen;

vixen = require('vixen');

Showdown = require('showdown');

markdown = new Showdown.converter();

require('./unify.coffee');

State = require('./State.coffee');

module.exports = function() {
  var cursorToken, docTitle, editor, model, saveTimer, saved, setFullInput, setFullView, setIndex, setState, setToc, showDnd, state, tocEl, updateIndex, updateStatus, updateToc, updateView, viewEl, viewWrapEl;
  state = new State;
  state.on('change', function() {
    return updateStatus(true);
  });
  tocEl = document.getElementById('toc');
  viewEl = document.getElementById('view');
  viewWrapEl = document.getElementById('view-wrap');
  docTitle = function() {
    var h, tmp;
    tmp = document.createElement('div');
    tmp.innerHTML = (h = viewEl.querySelectorAll('h1,h2,h3')[0]) ? h.innerHTML : 'Untitled';
    [].forEach.call(tmp.querySelectorAll('.index'), function(el) {
      return e.removeChild(el);
    });
    return tmp.textContent;
  };
  saved = true;
  updateStatus = function(force) {
    if (!saved || force) {
      state.generateHash('base64', editor.getValue(), function(hash) {
        return location.hash = hash;
      });
      document.title = docTitle();
      return saved = true;
    }
  };
  updateToc = function() {
    return tocEl.innerHTML = viewEl($.toc());
  };
  updateIndex = function() {
    return viewEl($.number().index());
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
    if (state.has('index')) {
      updateIndex();
    }
    if (state.has('toc')) {
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
  setFullInput = function(to) {
    return model.showFullInput = (to ? 'full-input' : '');
  };
  setFullView = function(to) {
    return model.showFullView = (to ? 'full-view' : '');
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
        if (state.has('toc')) {
          updateToc();
        }
      }
      return model.showIndex = '';
    } else {
      return model.showIndex = 'indexed';
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
  setState = function() {
    return state.parseHash(location.hash, function(data) {
      if ((data != null) && data !== editor.getValue()) {
        editor.setValue(data);
      }
      setFullInput(state.has('fullinput'));
      setFullView(state.has('full'));
      setIndex(state.has('index'));
      setToc(state.has('toc'));
      return model.theme = state.state.theme || 'serif';
    });
  };
  window.addEventListener('hashchange', setState);
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
    showFullInput: '',
    showFullView: '',
    toggleToc: function() {
      return state.toggle('toc');
    },
    toggleIndex: function() {
      return state.toggle('index');
    },
    expandInput: function() {
      return state.toggle('fullinput');
    },
    expandView: function() {
      return state.toggle('full');
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
          state.set('full', false);
          return state.set('fullinput', true);
        } else if (e.keyCode === 3) {
          state.set('full', false);
          return state.set('fullinput', false);
        } else if (e.keyCode === 22) {
          state.set('fullinput', false);
          return state.set('full', true);
        }
      }
    }
  };
  setState();
  if (!editor.getValue()) {
    showDnd = false;
  }
  vixen(document.body.parentNode, model);
  updateView();
  return updateStatus();
};


},{"./unify.coffee":3,"./State.coffee":7,"vixen":9,"showdown":10}],10:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vYXBwLmNvZmZlZSIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9jb2ZmZWUvdW5pZnkuY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZXZlbnRzLmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9saWIvYmFzZTY0LmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2NvZmZlZS9TdGF0ZS5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vbGliL2x6dy5qcyIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9ub2RlX21vZHVsZXMvdml4ZW4vaW5kZXguanMiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vY29mZmVlL21haW4uY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL25vZGVfbW9kdWxlcy9zaG93ZG93bi9zcmMvc2hvd2Rvd24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLENBQVEsTUFBUixlQUFBOzs7O0FDQUEsSUFBQSxNQUFBOztBQUFBLENBQUEsRUFBQTtDQUNFLENBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQURBLENBQ0E7Q0FEQSxDQUVBLENBRkEsRUFFQTtDQUZBLENBR0EsQ0FIQSxDQUdBO0NBSEEsQ0FJQSxDQUpBLENBSUE7Q0FKQSxDQUtBLENBTEEsRUFLQTtDQUxBLENBTUEsQ0FOQSxFQU1BO0NBTkEsQ0FPQSxDQVBBLENBT0E7Q0FQQSxDQVFBLENBUkEsRUFRQTtDQVJBLENBU0EsQ0FUQSxDQVNBO0NBVEEsQ0FVQSxDQVZBLENBVUE7Q0FWQSxDQVdBLENBWEEsQ0FXQTtDQVhBLENBWUEsQ0FaQSxFQVlBO0NBWkEsQ0FhQSxDQWJBLEVBYUE7Q0FiQSxDQWNBLENBZEEsRUFjQTtDQWZGLENBQUE7O0FBaUJBLENBakJBLENBaUJRLENBQUEsRUFBUixJQUFTO0NBQ1AsS0FBQSxPQUFBO0NBQUEsQ0FBQSxDQUFBLE1BQU07Q0FBTixDQUNBLENBQUksQ0FBQSxJQUFlLENBQU47Q0FBa0IsQ0FBTSxDQUFHLENBQVI7Q0FBRCxDQUFnQixFQUFBO0NBQTNDLENBQWtELENBQW5DLENBQUE7Q0FEbkIsQ0FFQSxDQUFRLEVBQVIsQ0FGQTtDQUdBLENBQUEsRUFBRyxXQUFBLEtBQUg7Q0FDSyxDQUFELENBQWtCLEVBQUEsTUFBcEIsQ0FBQTtDQUE0QixDQUFNLENBQUcsQ0FBUixFQUFBO0NBQUQsQ0FBZ0IsQ0FBTSxFQUFTLENBQWY7Q0FEOUMsQ0FDdUUsQ0FBckUsR0FBQTtJQUxJO0NBQUE7O0FBT1IsQ0F4QkEsRUF3QitCLEVBeEIvQixFQXdCb0IsQ0FBQSxFQUFWOztBQUNWLENBekJBLEVBeUIwQyxHQUF6QixDQXpCakIsRUF5QmlCLENBQVAsRUFBZ0I7Ozs7QUN6QjFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQSxJQUFBLHdEQUFBO0dBQUE7a1NBQUE7O0FBQUMsQ0FBRCxFQUFpQixJQUFBLENBQUEsSUFBakI7O0FBRUEsQ0FGQSxFQUVT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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZSgnLi9jb2ZmZWUvbWFpbi5jb2ZmZWUnKSgpXG4iLCJtYXAgPVxyXG4gICc8PSc6ICfih5AnICMgJ1xcdTIxZDAnXHJcbiAgJz0+JzogJ+KHkicgIyAnXFx1MjFkMidcclxuICAnPD0+JzogJ+KHlCcgIyAnXFx1MjFkNCdcclxuICAnPC0nOiAn4oaQJyAjICdcXHUyMTkwJ1xyXG4gICctPic6ICfihpInICMgJ1xcdTIxOTInXHJcbiAgJzwtPic6ICfihpQnICMgJ1xcdTIxOTQnXHJcbiAgJy4uLic6ICfigKYnXHJcbiAgJy0tJzogJ+KAkydcclxuICAnLS0tJzogJ+KAlCdcclxuICAnXjEnOiAnwrknXHJcbiAgJ14yJzogJ8KyJ1xyXG4gICdeMyc6ICfCsydcclxuICAnMS8yJzogJ8K9J1xyXG4gICcxLzQnOiAnwrwnXHJcbiAgJzMvNCc6ICfCvidcclxuXHJcbnVuaWZ5ID0gKGNtKSAtPlxyXG4gIHBvcyA9IGNtLmdldEN1cnNvcigpXHJcbiAgbSA9IC9bXlxcc10rJC8uZXhlYyBjbS5nZXRSYW5nZSB7bGluZTpwb3MubGluZSwgY2g6MH0sIHBvc1xyXG4gIHRva2VuID0gbT9bMF1cclxuICBpZiB0b2tlbj8gYW5kIG1hcFt0b2tlbl0/XHJcbiAgICBjbS5yZXBsYWNlUmFuZ2UgbWFwW3Rva2VuXSwge2xpbmU6cG9zLmxpbmUsIGNoOnBvcy5jaC10b2tlbi5sZW5ndGh9LCBwb3NcclxuXHJcbkNvZGVNaXJyb3IuY29tbWFuZHNbJ3VuaWZ5J10gPSB1bmlmeVxyXG5Db2RlTWlycm9yLmtleU1hcC5kZWZhdWx0WydDdHJsLVNwYWNlJ10gPSAndW5pZnknXHJcbiIsIihmdW5jdGlvbihwcm9jZXNzKXtpZiAoIXByb2Nlc3MuRXZlbnRFbWl0dGVyKSBwcm9jZXNzLkV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHt9O1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBwcm9jZXNzLkV2ZW50RW1pdHRlcjtcbnZhciBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbidcbiAgICA/IEFycmF5LmlzQXJyYXlcbiAgICA6IGZ1bmN0aW9uICh4cykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICAgIH1cbjtcbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHggPT09IHhzW2ldKSByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4vLyAxMCBsaXN0ZW5lcnMgYXJlIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2hcbi8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuLy9cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG59O1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzQXJyYXkodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpXG4gICAge1xuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuICB2YXIgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgaWYgKCFoYW5kbGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09ICdmdW5jdGlvbicpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gRXZlbnRFbWl0dGVyIGlzIGRlZmluZWQgaW4gc3JjL25vZGVfZXZlbnRzLmNjXG4vLyBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQoKSBpcyBhbHNvIGRlZmluZWQgdGhlcmUuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cbiAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgICAgdmFyIG07XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLm9uKHR5cGUsIGZ1bmN0aW9uIGcoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcbiAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0FycmF5KGxpc3QpKSB7XG4gICAgdmFyIGkgPSBpbmRleE9mKGxpc3QsIGxpc3RlbmVyKTtcbiAgICBpZiAoaSA8IDApIHJldHVybiB0aGlzO1xuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PSAwKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfSBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0gPT09IGxpc3RlbmVyKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKHR5cGUgJiYgdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcbn07XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgaWYgKGV2LnNvdXJjZSA9PT0gd2luZG93ICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIi8qKlxuICpcbiAqICBiYXNlNjQgZW5jb2RlIC8gZGVjb2RlXG4gKiAgaHR0cDovL3d3dy53ZWJ0b29sa2l0LmluZm8vXG4gKlxuICoqL1xuXG52YXIgYmFzZTY0ID0ge1xuXG4gIC8vIHByaXZhdGUgcHJvcGVydHlcbiAgX2tleVN0ciA6IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIixcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBlbmNvZGluZ1xuICBlbmNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMywgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGJhc2U2NC5fdXRmOF9lbmNvZGUoaW5wdXQpO1xuXG4gICAgd2hpbGUgKGkgPCBpbnB1dC5sZW5ndGgpIHtcblxuICAgICAgY2hyMSA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgIGNocjIgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIzID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICBlbmMxID0gY2hyMSA+PiAyO1xuICAgICAgZW5jMiA9ICgoY2hyMSAmIDMpIDw8IDQpIHwgKGNocjIgPj4gNCk7XG4gICAgICBlbmMzID0gKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNik7XG4gICAgICBlbmM0ID0gY2hyMyAmIDYzO1xuXG4gICAgICBpZiAoaXNOYU4oY2hyMikpIHtcbiAgICAgICAgZW5jMyA9IGVuYzQgPSA2NDtcbiAgICAgIH0gZWxzZSBpZiAoaXNOYU4oY2hyMykpIHtcbiAgICAgICAgZW5jNCA9IDY0O1xuICAgICAgfVxuXG4gICAgICBvdXRwdXQgPSBvdXRwdXQgK1xuICAgICAgICB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzEpICsgdGhpcy5fa2V5U3RyLmNoYXJBdChlbmMyKSArXG4gICAgICAgIHRoaXMuX2tleVN0ci5jaGFyQXQoZW5jMykgKyB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzQpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSxcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBkZWNvZGluZ1xuICBkZWNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMztcbiAgICB2YXIgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXFw9XS9nLCBcIlwiKTtcblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG5cbiAgICAgIGVuYzEgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG4gICAgICBlbmMyID0gdGhpcy5fa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuICAgICAgZW5jMyA9IHRoaXMuX2tleVN0ci5pbmRleE9mKGlucHV0LmNoYXJBdChpKyspKTtcbiAgICAgIGVuYzQgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG5cbiAgICAgIGNocjEgPSAoZW5jMSA8PCAyKSB8IChlbmMyID4+IDQpO1xuICAgICAgY2hyMiA9ICgoZW5jMiAmIDE1KSA8PCA0KSB8IChlbmMzID4+IDIpO1xuICAgICAgY2hyMyA9ICgoZW5jMyAmIDMpIDw8IDYpIHwgZW5jNDtcblxuICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIxKTtcblxuICAgICAgaWYgKGVuYzMgIT0gNjQpIHtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIyKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmM0ICE9IDY0KSB7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dCArIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyMyk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBvdXRwdXQgPSBiYXNlNjQuX3V0ZjhfZGVjb2RlKG91dHB1dCk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuXG4gIH0sXG5cbiAgLy8gcHJpdmF0ZSBtZXRob2QgZm9yIFVURi04IGVuY29kaW5nXG4gIF91dGY4X2VuY29kZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7XG4gICAgdmFyIHV0ZnRleHQgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCBzdHJpbmcubGVuZ3RoOyBuKyspIHtcblxuICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChuKTtcblxuICAgICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZigoYyA+IDEyNykgJiYgKGMgPCAyMDQ4KSkge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gNikgfCAxOTIpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiAxMikgfCAyMjQpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjID4+IDYpICYgNjMpIHwgMTI4KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB1dGZ0ZXh0O1xuICB9LFxuXG4gIC8vIHByaXZhdGUgbWV0aG9kIGZvciBVVEYtOCBkZWNvZGluZ1xuICBfdXRmOF9kZWNvZGUgOiBmdW5jdGlvbiAodXRmdGV4dCkge1xuICAgIHZhciBzdHJpbmcgPSBcIlwiO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgYyA9IGMxID0gYzIgPSAwO1xuXG4gICAgd2hpbGUgKCBpIDwgdXRmdGV4dC5sZW5ndGggKSB7XG5cbiAgICAgIGMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcbiAgICAgICAgYzIgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsxKTtcbiAgICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMzEpIDw8IDYpIHwgKGMyICYgNjMpKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XG4gICAgICAgIGMzID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMik7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDE1KSA8PCAxMikgfCAoKGMyICYgNjMpIDw8IDYpIHwgKGMzICYgNjMpKTtcbiAgICAgICAgaSArPSAzO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZTY0O1xuIiwie0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlICdldmVudHMnXG5cbmJhc2U2NCA9IHJlcXVpcmUgJy4uL2xpYi9iYXNlNjQnXG5sencgPSByZXF1aXJlICcuLi9saWIvbHp3J1xuXG5leHRlbmQgPSAocj17fSwgZCkgLT5cbiAgcltrXSA9IHYgZm9yIGssIHYgb2YgZFxuICByXG5rdnBUb0RpY3QgPSAoZCwga3ZwKSAtPiBkW2t2cFswXV0gPSAoaWYga3ZwWzFdPyB0aGVuIGt2cFsxXSBlbHNlIHRydWUpXG5cbmNsYXNzIFN0b3JhZ2VcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGlkID89IG5ldyBJZFxuICAgIEB2ZXJzaW9uID89IDBcblxuICBsb2NhbDpcbiAgICBzYXZlOiAoZGF0YSwgZm4pID0+XG4gICAgICBAdmVyc2lvbiArPSAxIGlmIEBpZCBvZiBsb2NhbFN0b3JhZ2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAaWRdID0gZGF0YVxuICAgICAgZm4gQGlkLCBAdmVyc2lvblxuICAgIGdldDogKEBpZCwgZm4pID0+XG4gICAgICB7ZGF0YSwgQHZlcnNpb259ID0gbG9jYWxTdG9yYWdlW0BpZF1cbiAgICAgIGZuIGRhdGEsIEB2ZXJzaW9uXG5cbmNsYXNzIFN0YXRlIGV4dGVuZHMgRXZlbnRFbWl0dGVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIHN1cGVyKClcbiAgICBAc3RhdGUgPVxuICAgICAgdG9jOiBmYWxzZVxuICAgICAgaW5kZXg6IGZhbHNlXG4gICAgQHN0YXJ0KClcblxuICBlbmNvZGVEYXRhOiAodHlwZSwgZGF0YSwgZm4pIC0+XG4gICAgU3RhdGUuY29kZXJzW3R5cGVdLmVuY29kZSBkYXRhLCAoZGF0YSkgLT4gZm4gdHlwZSsnOycrZGF0YVxuXG4gIGRlY29kZURhdGE6IChkYXRhLCBmbikgLT5cbiAgICBbdHlwZSwgZGF0YV0gPSBkYXRhLnNwbGl0ICc7JywgMlxuICAgIFN0YXRlLmNvZGVyc1t0eXBlXS5kZWNvZGUgZGF0YSwgZm5cblxuICBzdGFydDogLT5cbiAgICB7cHJvdG9jb2wsIGhvc3QsIHBhdGhuYW1lfSA9IHdpbmRvdy5sb2NhdGlvblxuICAgIEBiYXNlVXJsID0gcHJvdG9jb2wrJy8vJytob3N0K3BhdGhuYW1lXG5cbiAgcGFyc2VTdGF0ZTogKHN0cikgLT5cbiAgICBrdnBUb0RpY3QgQHN0YXRlLCBrdnAuc3BsaXQgJz0nIGZvciBrdnAgaW4gc3RyLnNwbGl0ICcsJyB3aGVuIGt2cCBpc250ICcnXG5cbiAgZ2VuZXJhdGVTdGF0ZTogLT5cbiAgICAoZm9yIGssIHYgb2YgQHN0YXRlIHdoZW4gdj8gYW5kIHYgaXNudCBmYWxzZVxuICAgICAgaWYgdiBpcyB0cnVlIHRoZW4gayBlbHNlIGsrJz0nK3YpLmpvaW4gJywnXG5cbiAgX2dldDogKHR5cGUsIGlkLCBmbikgLT4gQHN0b3JhZ2VbdHlwZV0uZ2V0IGlkLCBmblxuXG4gIF9zYXZlOiAodHlwZSwgZGF0YSwgZm4pIC0+IEBzdG9yYWdlW3R5cGVdLnNhdmUgZGF0YSwgZm5cblxuICBwYXJzZUhhc2g6IChoYXNoLCBmbikgLT5cbiAgICBoYXNoID0gaGFzaC5zdWJzdHJpbmcgMSBpZiBoYXNoLmNoYXJBdCAwIGlzICcjJ1xuICAgIHBvcyA9ICBoYXNoLmluZGV4T2YgJzsnXG4gICAgaWYgcG9zIGlzIC0xICMgc3RhdGUgb25seVxuICAgICAgc3RhdGUgPSBoYXNoXG4gICAgZWxzZSAjIHN0YXRlIGFuZCBkYXRhXG4gICAgICBzdGF0ZSA9IGhhc2guc3Vic3RyaW5nIDAsIHBvc1xuICAgICAgZGF0YSA9IGhhc2guc3Vic3RyaW5nIHBvcysxXG4gICAgQHBhcnNlU3RhdGUgc3RhdGVcbiAgICBpZiBkYXRhP1xuICAgICAgQGRlY29kZURhdGEgZGF0YSwgKGRhdGEpIC0+IGZuIGRhdGFcbiAgICBlbHNlXG4gICAgICBmbigpXG5cbiAgZ2VuZXJhdGVIYXNoOiAodHlwZSwgZGF0YSwgZm4pIC0+XG4gICAgaWYgdHlwZT8gYW5kIGRhdGE/XG4gICAgICBAZW5jb2RlRGF0YSB0eXBlLCBkYXRhLCAoc3RyKSA9PlxuICAgICAgICBmbiAnIycrQGdlbmVyYXRlU3RhdGUoKSsnOycrc3RyXG4gICAgZWxzZVxuICAgICAgZm4gJyMnK0BnZW5lcmF0ZVN0YXRlKClcblxuICByZXBsYWNlOiAtPlxuICAgIEBfc2F2ZSB0eXBlLCBkYXRhLCAoaWQsIHZlcnNpb24pIC0+XG4gICAgICB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUge30sICcnLCBAYmFzZVVybCt0eXBlKycvJytpZCsnLycrdmVyc2lvbitcbiAgICAgICAgJyMnK2dlbmVyYXRlU3RhdGUoKVxuXG4gIGhhczogKHR5cGUpIC0+IEBzdGF0ZVt0eXBlXT8gYW5kIEBzdGF0ZVt0eXBlXSBpc250IGZhbHNlXG4gIHNldDogKHR5cGUsIHZhbCkgLT4gQHN0YXRlW3R5cGVdID0gdmFsOyBAZW1pdCAnY2hhbmdlJywgdHlwZSwgdmFsXG4gIHRvZ2dsZTogKHR5cGUpIC0+IEBzZXQgdHlwZSwgbm90IEBoYXMgdHlwZVxuXG5TdGF0ZS5jb2RlcnMgPVxuICBsenc6XG4gICAgZW5jb2RlOiAoZGF0YSwgZm4pIC0+IGZuIGJhc2U2NC5lbmNvZGUgbHp3LmVuY29kZSBkYXRhXG4gICAgZGVjb2RlOiAoZGF0YSwgZm4pIC0+IGZuIGx6dy5kZWNvZGUgYmFzZTY0LmRlY29kZSBkYXRhXG4gIGJhc2U2NDpcbiAgICBlbmNvZGU6IChkYXRhLCBmbikgLT4gZm4gYmFzZTY0LmVuY29kZSBkYXRhXG4gICAgZGVjb2RlOiAoZGF0YSwgZm4pIC0+IGZuIGJhc2U2NC5kZWNvZGUgZGF0YVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlXG4iLCIvLyBMWlctY29tcHJlc3MgYSBzdHJpbmdcclxuZnVuY3Rpb24gZW5jb2RlKHMpIHtcclxuICB2YXIgZGF0YSA9IChzICsgXCJcIikuc3BsaXQoXCJcIik7XHJcbiAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSByZXR1cm4gXCJcIjtcclxuICB2YXIgZGljdCA9IHt9O1xyXG4gIHZhciBvdXQgPSBbXTtcclxuICB2YXIgY3VyckNoYXI7XHJcbiAgdmFyIHBocmFzZSA9IGRhdGFbMF07XHJcbiAgdmFyIGNvZGUgPSAyNTY7XHJcbiAgZm9yICh2YXIgaT0xOyBpPGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgIGN1cnJDaGFyPWRhdGFbaV07XHJcbiAgICBpZiAoZGljdFtwaHJhc2UgKyBjdXJyQ2hhcl0gIT0gbnVsbCkge1xyXG4gICAgICBwaHJhc2UgKz0gY3VyckNoYXI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgb3V0LnB1c2gocGhyYXNlLmxlbmd0aCA+IDEgPyBkaWN0W3BocmFzZV0gOiBwaHJhc2UuY2hhckNvZGVBdCgwKSk7XHJcbiAgICAgIGRpY3RbcGhyYXNlICsgY3VyckNoYXJdID0gY29kZTtcclxuICAgICAgY29kZSsrO1xyXG4gICAgICBwaHJhc2U9Y3VyckNoYXI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIG91dC5wdXNoKHBocmFzZS5sZW5ndGggPiAxID8gZGljdFtwaHJhc2VdIDogcGhyYXNlLmNoYXJDb2RlQXQoMCkpO1xyXG4gIGZvciAodmFyIGk9MDsgaTxvdXQubGVuZ3RoOyBpKyspIHtcclxuICAgIG91dFtpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUob3V0W2ldKTtcclxuICB9XHJcbiAgcmV0dXJuIG91dC5qb2luKFwiXCIpO1xyXG59XHJcblxyXG4vLyBEZWNvbXByZXNzIGFuIExaVy1lbmNvZGVkIHN0cmluZ1xyXG5mdW5jdGlvbiBkZWNvZGUocykge1xyXG4gIHZhciBkYXRhID0gKHMgKyBcIlwiKS5zcGxpdChcIlwiKTtcclxuICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiBcIlwiO1xyXG4gIHZhciBkaWN0ID0ge307XHJcbiAgdmFyIGN1cnJDaGFyID0gZGF0YVswXTtcclxuICB2YXIgb2xkUGhyYXNlID0gY3VyckNoYXI7XHJcbiAgdmFyIG91dCA9IFtjdXJyQ2hhcl07XHJcbiAgdmFyIGNvZGUgPSAyNTY7XHJcbiAgdmFyIHBocmFzZTtcclxuICBmb3IgKHZhciBpPTE7IGk8ZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIGN1cnJDb2RlID0gZGF0YVtpXS5jaGFyQ29kZUF0KDApO1xyXG4gICAgaWYgKGN1cnJDb2RlIDwgMjU2KSB7XHJcbiAgICAgIHBocmFzZSA9IGRhdGFbaV07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcGhyYXNlID0gZGljdFtjdXJyQ29kZV0gPyBkaWN0W2N1cnJDb2RlXSA6IChvbGRQaHJhc2UgKyBjdXJyQ2hhcik7XHJcbiAgICB9XHJcbiAgICBvdXQucHVzaChwaHJhc2UpO1xyXG4gICAgY3VyckNoYXIgPSBwaHJhc2UuY2hhckF0KDApO1xyXG4gICAgZGljdFtjb2RlXSA9IG9sZFBocmFzZSArIGN1cnJDaGFyO1xyXG4gICAgY29kZSsrO1xyXG4gICAgb2xkUGhyYXNlID0gcGhyYXNlO1xyXG4gIH1cclxuICByZXR1cm4gb3V0LmpvaW4oXCJcIik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGVuY29kZTogZW5jb2RlLFxyXG4gIGRlY29kZTogZGVjb2RlXHJcbn07XHJcbiIsIiFmdW5jdGlvbihvYmopIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKVxuICAgIG1vZHVsZS5leHBvcnRzID0gb2JqO1xuICBlbHNlXG4gICAgd2luZG93LnZpeGVuID0gb2JqO1xufShmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdHJpbShzdHIpIHtyZXR1cm4gU3RyaW5nLnByb3RvdHlwZS50cmltLmNhbGwoc3RyKTt9O1xuXG4gIGZ1bmN0aW9uIHJlc29sdmVQcm9wKG9iaiwgbmFtZSkge1xuICAgIHJldHVybiBuYW1lLnRyaW0oKS5zcGxpdCgnLicpLnJlZHVjZShmdW5jdGlvbiAocCwgcHJvcCkge1xuICAgICAgcmV0dXJuIHAgPyBwW3Byb3BdIDogdW5kZWZpbmVkO1xuICAgIH0sIG9iaik7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlQ2hhaW4ob2JqLCBjaGFpbikge1xuICAgIHZhciBwcm9wID0gY2hhaW4uc2hpZnQoKTtcbiAgICByZXR1cm4gY2hhaW4ucmVkdWNlKGZ1bmN0aW9uIChwLCBwcm9wKSB7XG4gICAgICB2YXIgZiA9IHJlc29sdmVQcm9wKG9iaiwgcHJvcCk7XG4gICAgICByZXR1cm4gZiA/IGYocCkgOiBwO1xuICAgIH0sIHJlc29sdmVQcm9wKG9iaiwgcHJvcCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gYnVja2V0KGIsIGssIHYpIHtcbiAgICBpZiAoIShrIGluIGIpKSBiW2tdID0gW107XG4gICAgaWYgKCEodiBpbiBiW2tdKSkgYltrXS5wdXNoKHYpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0ZW5kKG9yaWcsIG9iaikge1xuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBvcmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgIH0pO1xuICAgIHJldHVybiBvcmlnO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhdmVyc2VFbGVtZW50cyhlbCwgY2FsbGJhY2spIHtcbiAgICB2YXIgaTtcbiAgICBpZiAoY2FsbGJhY2soZWwpICE9PSBmYWxzZSkge1xuICAgICAgZm9yKGkgPSBlbC5jaGlsZHJlbi5sZW5ndGg7IGktLTspIChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB0cmF2ZXJzZUVsZW1lbnRzKG5vZGUsIGNhbGxiYWNrKTtcbiAgICAgIH0pKGVsLmNoaWxkcmVuW2ldKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVQcm94eShtYXBzLCBwcm94eSkge1xuICAgIHByb3h5ID0gcHJveHkgfHwge307XG4gICAgcHJveHkuZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgdG9SZW5kZXIgPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgIG1hcHMub3JpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgaWYgKG1hcHMuYmluZHNbcHJvcF0pIG1hcHMuYmluZHNbcHJvcF0uZm9yRWFjaChmdW5jdGlvbihyZW5kZXJJZCkge1xuICAgICAgICAgIGlmIChyZW5kZXJJZCA+PSAwKSB0b1JlbmRlcltyZW5kZXJJZF0gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgZm9yIChyZW5kZXJJZCBpbiB0b1JlbmRlcikgbWFwcy5yZW5kZXJzW3JlbmRlcklkXShtYXBzLm9yaWcpO1xuICAgICAgcmV0dXJuIHByb3h5O1xuICAgIH07XG5cbiAgICBPYmplY3Qua2V5cyhtYXBzLmJpbmRzKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIHZhciBpZHMgPSBtYXBzLmJpbmRzW3Byb3BdO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3h5LCBwcm9wLCB7XG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBtYXBzLm9yaWdbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICBpZHMuZm9yRWFjaChmdW5jdGlvbihyZW5kZXJJZCkge1xuICAgICAgICAgICAgaWYgKHJlbmRlcklkID49IDApIG1hcHMucmVuZGVyc1tyZW5kZXJJZF0obWFwcy5vcmlnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAobWFwcy5yZWJpbmRzW3Byb3BdKVxuICAgICAgICAgICAgcmV0dXJuIG1hcHMucmViaW5kc1twcm9wXSgpO1xuICAgICAgICAgIHJldHVybiBtYXBzLm9yaWdbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBwcm94eTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihlbCwgbW9kZWwpIHtcbiAgICB2YXIgcGF0dGVybiA9IC9cXHtcXHsuKz9cXH1cXH0vZyxcbiAgICAgICAgcGlwZSA9ICd8JztcblxuICAgIGZ1bmN0aW9uIHJlc29sdmUob3JpZywgcHJvcCkge1xuICAgICAgaWYgKCFvcmlnKSByZXR1cm4gJyc7XG4gICAgICB2YXIgdmFsID0gcmVzb2x2ZUNoYWluKG9yaWcsIHByb3Auc2xpY2UoMiwtMikuc3BsaXQocGlwZSkpO1xuICAgICAgcmV0dXJuIHZhbCA9PT0gdW5kZWZpbmVkID8gJycgOiB2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyVG1wbChzdHIsIG9yaWcpIHtcbiAgICAgIHJldHVybiBzdHIucmVwbGFjZShwYXR0ZXJuLCByZXNvbHZlLmJpbmQodW5kZWZpbmVkLCBvcmlnKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2goc3RyKSB7XG4gICAgICB2YXIgbSA9IHN0ci5tYXRjaChwYXR0ZXJuKTtcbiAgICAgIGlmIChtKSByZXR1cm4gbS5tYXAoZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgcmV0dXJuIGNoYWluLnNsaWNlKDIsIC0yKS5zcGxpdChwaXBlKS5tYXAodHJpbSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cmF2ZXJzZShlbCwgb3JpZykge1xuICAgICAgdmFyIGJpbmRzID0ge30sXG4gICAgICAgICAgcmViaW5kcyA9IHt9LFxuICAgICAgICAgIHJlbmRlcnMgPSB7fSxcbiAgICAgICAgICBjb3VudCA9IDA7XG4gICAgICBvcmlnID0gb3JpZyB8fCB7fTtcblxuICAgICAgZnVuY3Rpb24gYmluZFJlbmRlcnMoY2hhaW5zLCByZW5kZXJJZCkge1xuICAgICAgICAvLyBDcmVhdGUgcHJvcGVydHkgdG8gcmVuZGVyIG1hcHBpbmdcbiAgICAgICAgY2hhaW5zLmZvckVhY2goZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgICAvLyBUT0RPOiBSZWdpc3RlciBjaGFpbmluZyBmdW5jdGlvbnMgYXMgYmluZHMgYXMgd2VsbC5cbiAgICAgICAgICBidWNrZXQoYmluZHMsIGNoYWluWzBdLnNwbGl0KCcuJylbMF0sIHJlbmRlcklkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHBhcnNlSXRlcmF0b3IoZWwpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgcHJlZml4ID0gJycsIG5vZGVzID0gW107XG4gICAgICAgIGlmIChwYXJlbnRfID0gKGVsLnBhcmVudEVsZW1lbnQgfHwgZWwucGFyZW50Tm9kZSkpIHtcbiAgICAgICAgICBpZiAoZWwudGFnTmFtZSA9PT0gJ0ZPUicpIHtcbiAgICAgICAgICAgIG1hcmtlciA9IGVsLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgICAgICAgcGFyZW50Xy5yZXBsYWNlQ2hpbGQobWFya2VyLCBlbCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaW4nKSkge1xuICAgICAgICAgICAgcHJlZml4ID0gJ2RhdGEtJztcbiAgICAgICAgICAgIHBhcmVudF8gPSBlbDtcbiAgICAgICAgICAgIG5vZGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWwuY2hpbGROb2Rlcyk7XG4gICAgICAgICAgICBtYXJrZXIgPSBlbC5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgICAgIHBhcmVudF8uYXBwZW5kQ2hpbGQobWFya2VyKTtcbiAgICAgICAgICB9IGVsc2UgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhbGlhczogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsndmFsdWUnKSxcbiAgICAgICAgICAgIGtleTogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsna2V5JyksXG4gICAgICAgICAgICBwcm9wOiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4KydpbicpLFxuICAgICAgICAgICAgZWFjaDogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsnZWFjaCcpLFxuICAgICAgICAgICAgbm9kZXM6IG5vZGVzLFxuICAgICAgICAgICAgcGFyZW50OiBwYXJlbnRfLFxuICAgICAgICAgICAgbWFya2VyOiBtYXJrZXJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1hcEF0dHJpYnV0ZShvd25lciwgYXR0cikge1xuICAgICAgICB2YXIgbmFtZSwgZXZlbnRJZCwgcmVuZGVySWQsIHN0ciwgbm9UbXBsO1xuICAgICAgICBpZiAoKHN0ciA9IGF0dHIudmFsdWUpICYmIChjaGFpbnMgPSBtYXRjaChzdHIpKSkge1xuICAgICAgICAgIG5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgICAgaWYgKG5hbWUuaW5kZXhPZigndngtJykgPT09IDApIHtcbiAgICAgICAgICAgIG93bmVyLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignb24nKSA9PT0gMCkge1xuICAgICAgICAgICAgcmVuZGVySWQgPSAtMTsgLy8gTm8gcmVuZGVyZXJcbiAgICAgICAgICAgIGV2ZW50TmFtZSA9IG5hbWUuc3Vic3RyKDIpO1xuICAgICAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyc1xuICAgICAgICAgICAgY2hhaW5zLmZvckVhY2goZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgICAgICAgb3duZXIuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlUHJvcChvcmlnLCBjaGFpblswXSkoZXZ0LCBvd25lci52YWx1ZSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBvd25lci5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vVG1wbCA9IGNoYWlucy5sZW5ndGggPT09IDEgJiYgc3RyLnN1YnN0cigwLDEpID09PSAneycgJiZcbiAgICAgICAgICAgICAgc3RyLnN1YnN0cigtMSkgPT09ICd9JztcbiAgICAgICAgICAgIC8vIENyZWF0ZSByZW5kZXJpbmcgZnVuY3Rpb24gZm9yIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgIHJlbmRlcklkID0gY291bnQrKztcbiAgICAgICAgICAgIChyZW5kZXJzW3JlbmRlcklkXSA9IGZ1bmN0aW9uKG9yaWcsIGNsZWFyKSB7XG4gICAgICAgICAgICAgIHZhciB2YWwgPSBub1RtcGwgPyByZXNvbHZlKG9yaWcsIHN0cikgOiBzdHJUbXBsKHN0ciwgb3JpZyk7XG4gICAgICAgICAgICAgICFjbGVhciAmJiBuYW1lIGluIG93bmVyID8gb3duZXJbbmFtZV0gPSB2YWwgOlxuICAgICAgICAgICAgICAgIG93bmVyLnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuICAgICAgICAgICAgfSkob3JpZywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBCaS1kaXJlY3Rpb25hbCBjb3VwbGluZy5cbiAgICAgICAgICAgIGlmIChub1RtcGwpIHJlYmluZHNbY2hhaW5zWzBdWzBdXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEdldHRpbmcgZi5leC4gJ3ZhbHVlJyBhdHRyaWJ1dGUgZnJvbSBhbiBpbnB1dFxuICAgICAgICAgICAgICAgIC8vIGRvZXNuJ3QgcmV0dXJuIHVzZXIgaW5wdXQgdmFsdWUgc28gYWNjZXNzaW5nIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAvLyBvYmplY3QgcHJvcGVydGllcyBkaXJlY3RseSwgZmluZCBvdXQgaG93IHRvIGRvIHRoaXNcbiAgICAgICAgICAgICAgICAvLyBtb3JlIHNlY3VyZWx5LlxuICAgICAgICAgICAgICAgIHJldHVybiBuYW1lIGluIG93bmVyID9cbiAgICAgICAgICAgICAgICAgIG93bmVyW25hbWVdIDogb3duZXIuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBiaW5kUmVuZGVycyhjaGFpbnMsIHJlbmRlcklkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYXBUZXh0Tm9kZXMoZWwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IGVsLmNoaWxkTm9kZXMubGVuZ3RoOyBpLS07KSAoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIHZhciBzdHIsIHJlbmRlcklkLCBjaGFpbnM7XG4gICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IGVsLlRFWFRfTk9ERSAmJiAoc3RyID0gbm9kZS5ub2RlVmFsdWUpICYmXG4gICAgICAgICAgICAgIChjaGFpbnMgPSBtYXRjaChzdHIpKSkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBmb3IgZWxlbWVudCB0ZXh0IG5vZGUuXG4gICAgICAgICAgICByZW5kZXJJZCA9IGNvdW50Kys7XG4gICAgICAgICAgICAocmVuZGVyc1tyZW5kZXJJZF0gPSBmdW5jdGlvbihvcmlnKSB7XG4gICAgICAgICAgICAgIG5vZGUubm9kZVZhbHVlID0gc3RyVG1wbChzdHIsIG9yaWcpO1xuICAgICAgICAgICAgfSkob3JpZyk7XG4gICAgICAgICAgICBiaW5kUmVuZGVycyhjaGFpbnMsIHJlbmRlcklkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKGVsLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgbm8tdHJhdmVyc2UgYXR0cmlidXRlIGlmIHJvb3Qgbm9kZVxuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXN1YnZpZXcnKTtcblxuICAgICAgdHJhdmVyc2VFbGVtZW50cyhlbCwgZnVuY3Rpb24oZWxfKSB7XG4gICAgICAgIHZhciBpLCBpdGVyLCB0ZW1wbGF0ZSwgbm9kZXMsIHJlbmRlcklkO1xuXG4gICAgICAgIC8vIFN0b3AgaGFuZGxpbmcgYW5kIHJlY3Vyc2lvbiBpZiBzdWJ2aWV3LlxuICAgICAgICBpZiAoZWxfLmdldEF0dHJpYnV0ZSgnZGF0YS1zdWJ2aWV3JykgIT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoaXRlciA9IHBhcnNlSXRlcmF0b3IoZWxfKSkge1xuICAgICAgICAgIG5vZGVzID0gaXRlci5ub2RlcztcbiAgICAgICAgICB0ZW1wbGF0ZSA9IGVsXy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgbWFwcyA9IHRyYXZlcnNlKHRlbXBsYXRlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgICAgcmVuZGVySWQgPSBjb3VudCsrO1xuICAgICAgICAgIChyZW5kZXJzW3JlbmRlcklkXSA9IGZ1bmN0aW9uKG9yaWcpIHtcbiAgICAgICAgICAgIHZhciBsaXN0ID0gcmVzb2x2ZVByb3Aob3JpZywgaXRlci5wcm9wKSxcbiAgICAgICAgICAgICAgICBlYWNoXyA9IGl0ZXIuZWFjaCAmJiByZXNvbHZlUHJvcChvcmlnLCBpdGVyLmVhY2gpLCBpO1xuICAgICAgICAgICAgZm9yIChpID0gbm9kZXMubGVuZ3RoOyBpLS07KSBpdGVyLnBhcmVudC5yZW1vdmVDaGlsZChub2Rlc1tpXSk7XG4gICAgICAgICAgICBub2RlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChpIGluIGxpc3QpIGlmIChsaXN0Lmhhc093blByb3BlcnR5KGkpKVxuICAgICAgICAgICAgICAoZnVuY3Rpb24odmFsdWUsIGkpe1xuICAgICAgICAgICAgICAgIHZhciBvcmlnXyA9IGV4dGVuZCh7fSwgb3JpZyksXG4gICAgICAgICAgICAgICAgICAgIGNsb25lID0gdGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpLFxuICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGl0ZXIubWFya2VyLFxuICAgICAgICAgICAgICAgICAgICBtYXBzLCByZW5kZXJJZCwgaV8sIG5vZGUsIG5vZGVzXyA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChpdGVyLmtleSkgb3JpZ19baXRlci5rZXldID0gaTtcbiAgICAgICAgICAgICAgICBvcmlnX1tpdGVyLmFsaWFzXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIG1hcHMgPSB0cmF2ZXJzZShjbG9uZSwgb3JpZ18pO1xuICAgICAgICAgICAgICAgIGZvciAoaV8gPSBjbG9uZS5jaGlsZE5vZGVzLmxlbmd0aDsgaV8tLTsgbGFzdE5vZGUgPSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICBub2Rlc18ucHVzaChub2RlID0gY2xvbmUuY2hpbGROb2Rlc1tpX10pO1xuICAgICAgICAgICAgICAgICAgaXRlci5wYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIGxhc3ROb2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVhY2hfICYmIGVhY2hfKHZhbHVlLCBpLCBvcmlnXywgbm9kZXNfLmZpbHRlcihmdW5jdGlvbihuKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbi5ub2RlVHlwZSA9PT0gZWxfLkVMRU1FTlRfTk9ERTtcbiAgICAgICAgICAgICAgICB9KSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgZm9yIChpXyA9IG5vZGVzXy5sZW5ndGg7IGlfLS07KVxuICAgICAgICAgICAgICAgICAgICBpdGVyLnBhcmVudC5yZW1vdmVDaGlsZChub2Rlc19baV9dKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbm9kZXMgPSBub2Rlcy5jb25jYXQobm9kZXNfKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKGxpc3RbaV0sIGkpO1xuICAgICAgICAgIH0pKG9yaWcpO1xuICAgICAgICAgIGJ1Y2tldChiaW5kcywgaXRlci5wcm9wLnNwbGl0KCcuJylbMF0sIHJlbmRlcklkKTtcbiAgICAgICAgICBmb3IgKHAgaW4gbWFwcy5iaW5kcykgaWYgKGl0ZXIuYWxpYXMuaW5kZXhPZihwKSA9PT0gLTEpXG4gICAgICAgICAgICBidWNrZXQoYmluZHMsIHAsIHJlbmRlcklkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBCaW5kIG5vZGUgdGV4dC5cbiAgICAgICAgICBtYXBUZXh0Tm9kZXMoZWxfKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBCaW5kIG5vZGUgYXR0cmlidXRlcyBpZiBub3QgYSA8Zm9yPi5cbiAgICAgICAgaWYgKGVsXy50YWdOYW1lICE9PSAnRk9SJykgZm9yIChpID0gZWxfLmF0dHJpYnV0ZXMubGVuZ3RoOyBpLS07KVxuICAgICAgICAgIG1hcEF0dHJpYnV0ZShlbF8sIGVsXy5hdHRyaWJ1dGVzW2ldKTtcbiAgICAgICAgLy8gU3RvcCByZWN1cnNpb24gaWYgaXRlcmF0b3IuXG4gICAgICAgIHJldHVybiAhaXRlcjtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHtvcmlnOm9yaWcsIGJpbmRzOmJpbmRzLCByZWJpbmRzOnJlYmluZHMsIHJlbmRlcnM6cmVuZGVyc307XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVQcm94eSh0cmF2ZXJzZShlbCwgbW9kZWwgJiYgZXh0ZW5kKHt9LCBtb2RlbCkpLCBtb2RlbCk7XG4gIH07XG59KCkpO1xuIiwidml4ZW4gPSByZXF1aXJlICd2aXhlbidcblNob3dkb3duID0gcmVxdWlyZSAnc2hvd2Rvd24nXG5tYXJrZG93biA9IG5ldyBTaG93ZG93bi5jb252ZXJ0ZXIoKVxuXG5yZXF1aXJlICcuL3VuaWZ5LmNvZmZlZSdcblN0YXRlID0gcmVxdWlyZSAnLi9TdGF0ZS5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgc3RhdGUgPSBuZXcgU3RhdGVcbiAgc3RhdGUub24gJ2NoYW5nZScsIC0+IHVwZGF0ZVN0YXR1cyB5ZXNcblxuICB0b2NFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd0b2MnXG4gIHZpZXdFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd2aWV3J1xuICB2aWV3V3JhcEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3ZpZXctd3JhcCdcblxuICBkb2NUaXRsZSA9IC0+XG4gICAgdG1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICAgIHRtcC5pbm5lckhUTUwgPSBpZiAoaCA9IHZpZXdFbC5xdWVyeVNlbGVjdG9yQWxsKCdoMSxoMixoMycpWzBdKVxuICAgICAgaC5pbm5lckhUTUxcbiAgICBlbHNlXG4gICAgICAnVW50aXRsZWQnXG4gICAgW10uZm9yRWFjaC5jYWxsIHRtcC5xdWVyeVNlbGVjdG9yQWxsKCcuaW5kZXgnKSwgKGVsKSAtPiBlLnJlbW92ZUNoaWxkIGVsXG4gICAgdG1wLnRleHRDb250ZW50XG4gIHNhdmVkID0geWVzXG4gIHVwZGF0ZVN0YXR1cyA9IChmb3JjZSkgLT5cbiAgICBpZiBub3Qgc2F2ZWQgb3IgZm9yY2VcbiAgICAgIHN0YXRlLmdlbmVyYXRlSGFzaCAnYmFzZTY0JywgZWRpdG9yLmdldFZhbHVlKCksIChoYXNoKSAtPlxuICAgICAgICBsb2NhdGlvbi5oYXNoID0gaGFzaFxuICAgICAgZG9jdW1lbnQudGl0bGUgPSBkb2NUaXRsZSgpXG4gICAgICBzYXZlZCA9IHllc1xuXG4gIHVwZGF0ZVRvYyA9IC0+IHRvY0VsLmlubmVySFRNTCA9IHZpZXdFbCAkLnRvYygpXG5cbiAgdXBkYXRlSW5kZXggPSAtPiB2aWV3RWwgJC5udW1iZXIoKS5pbmRleCgpXG5cbiAgY3Vyc29yVG9rZW4gPSAnXl5eY3Vyc29yXl5eJ1xuICB1cGRhdGVWaWV3ID0gLT5cbiAgICBjbGluZSA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lXG4gICAgbWQgPSBlZGl0b3IuZ2V0VmFsdWUoKS5zcGxpdCAnXFxuJ1xuICAgIG1kW2NsaW5lXSArPSBjdXJzb3JUb2tlblxuICAgIG1kID0gbWQuam9pbiAnXFxuJ1xuICAgIHYgPSB2aWV3RWxcbiAgICB2LmlubmVySFRNTCA9IG1hcmtkb3duLm1ha2VIdG1sKG1kKS5yZXBsYWNlKGN1cnNvclRva2VuLCAnPHNwYW4gaWQ9XCJjdXJzb3JcIj48L3NwYW4+JylcbiAgICB1cGRhdGVJbmRleCgpIGlmIHN0YXRlLmhhcyAnaW5kZXgnXG4gICAgdXBkYXRlVG9jKCkgaWYgc3RhdGUuaGFzICd0b2MnXG4gICAgc2Nyb2xsVG9wID0gdmlld1dyYXBFbC5zY3JvbGxUb3BcbiAgICB2aWV3SGVpZ2h0ID0gdmlld1dyYXBFbC5vZmZzZXRIZWlnaHRcbiAgICBjdXJzb3JTcGFuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2N1cnNvcidcbiAgICBjdXJzb3JUb3AgPSBjdXJzb3JTcGFuLm9mZnNldFRvcFxuICAgIGN1cnNvckhlaWdodCA9IGN1cnNvclNwYW4ub2Zmc2V0SGVpZ2h0XG4gICAgaWYgY3Vyc29yVG9wIDwgc2Nyb2xsVG9wIG9yIGN1cnNvclRvcCA+IHNjcm9sbFRvcCArIHZpZXdIZWlnaHQgLSBjdXJzb3JIZWlnaHRcbiAgICAgIHZpZXdXcmFwRWwuc2Nyb2xsVG9wID0gY3Vyc29yVG9wIC0gdmlld0hlaWdodC8yXG5cbiAgc2V0RnVsbElucHV0ID0gKHRvKSAtPiBtb2RlbC5zaG93RnVsbElucHV0ID0gKGlmIHRvIHRoZW4gJ2Z1bGwtaW5wdXQnIGVsc2UgJycpXG4gIHNldEZ1bGxWaWV3ID0gKHRvKSAtPiBtb2RlbC5zaG93RnVsbFZpZXcgPSAoaWYgdG8gdGhlbiAnZnVsbC12aWV3JyBlbHNlICcnKVxuICBzZXRUb2MgPSAodG8pIC0+XG4gICAgdXBkYXRlVG9jKCkgaWYgdG9cbiAgICBtb2RlbC5zaG93VG9jID0gaWYgdG8gdGhlbiAndG9jJyBlbHNlICcnXG4gIHNldEluZGV4ID0gKHRvKSAtPlxuICAgIGlmIHRvXG4gICAgICBpZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjdmlldyBbZGF0YS1udW1iZXJdJykubGVuZ3RoIGlzIDBcbiAgICAgICAgdXBkYXRlSW5kZXgoKVxuICAgICAgICB1cGRhdGVUb2MoKSBpZiBzdGF0ZS5oYXMgJ3RvYydcbiAgICAgIG1vZGVsLnNob3dJbmRleCA9ICcnXG4gICAgZWxzZVxuICAgICAgbW9kZWwuc2hvd0luZGV4ID0gJ2luZGV4ZWQnXG5cbiAgc2F2ZVRpbWVyID0gbnVsbFxuICBlZGl0b3IgPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtbWQnKSxcbiAgICBtb2RlOiAnZ2ZtJ1xuICAgIHRoZW1lOiAnZGVmYXVsdCdcbiAgICBsaW5lTnVtYmVyczogbm9cbiAgICBsaW5lV3JhcHBpbmc6IHllc1xuICAgIG9uQ2hhbmdlOiAtPlxuICAgICAgdXBkYXRlVmlldygpXG4gICAgICBzYXZlZCA9IG5vXG4gICAgICBjbGVhclRpbWVvdXQgc2F2ZVRpbWVyXG4gICAgICBzYXZlVGltZXIgPSBzZXRUaW1lb3V0IHVwZGF0ZVN0YXR1cywgNTAwMFxuICAgIG9uRHJhZ0V2ZW50OiAoZWRpdG9yLCBldmVudCkgLT5cbiAgICAgIHNob3dEbmQgPSBubyBpZiBzaG93RG5kIG9yIGV2ZW50LnR5cGUgaXMgJ2Ryb3AnXG4gICAgICBmYWxzZVxuXG4gIHNldFN0YXRlID0gLT5cbiAgICBzdGF0ZS5wYXJzZUhhc2ggbG9jYXRpb24uaGFzaCwgKGRhdGEpIC0+XG4gICAgICBlZGl0b3Iuc2V0VmFsdWUgZGF0YSBpZiBkYXRhPyBhbmQgZGF0YSBpc250IGVkaXRvci5nZXRWYWx1ZSgpXG4gICAgICBzZXRGdWxsSW5wdXQgc3RhdGUuaGFzICdmdWxsaW5wdXQnXG4gICAgICBzZXRGdWxsVmlldyBzdGF0ZS5oYXMgJ2Z1bGwnXG4gICAgICBzZXRJbmRleCBzdGF0ZS5oYXMgJ2luZGV4J1xuICAgICAgc2V0VG9jIHN0YXRlLmhhcyAndG9jJ1xuICAgICAgbW9kZWwudGhlbWUgPSBzdGF0ZS5zdGF0ZS50aGVtZSBvciAnc2VyaWYnXG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ2hhc2hjaGFuZ2UnLCBzZXRTdGF0ZVxuXG4gIG1vZGVsID1cbiAgICBzaG93OiAodikgLT4gaWYgdiB0aGVuICcnIGVsc2UgJ2hpZGUnXG4gICAgaGlkZTogKHYpIC0+IGlmIHYgdGhlbiAnaGlkZScgZWxzZSAnJ1xuICAgIHNob3dEb3dubG9hZDogQmxvYj9cbiAgICBkb3dubG9hZDogLT5cbiAgICAgIHNhdmVBcyBuZXcgQmxvYihbZWRpdG9yLmdldFZhbHVlKCldLCB0eXBlOiAndGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04JyksXG4gICAgICAgIGRvY1RpdGxlKCkrJy5tZCdcbiAgICBsaW5rQjY0OiAtPlxuICAgICAgdXBkYXRlU3RhdHVzKClcbiAgICAgIHByb21wdCAnQ29weSB0aGlzJywgbG9jYXRpb24uaHJlZlxuICAgICAgI21vZGVsLmxpbmtDb3B5ID0gbG9jYXRpb24uaHJlZlxuICAgICAgI21vZGVsLnNob3dMaW5rQ29weSA9IHRydWVcbiAgICAgICMuZm9jdXMoKVxuICAgICAgIy5ibHVyIC0+ICQoQCkuYWRkQ2xhc3MoJ2hpZGRlbicpXG4gICAgcHJpbnQ6IC0+IHdpbmRvdy5wcmludCgpXG4gICAgc2hvd0Z1bGxJbnB1dDogJydcbiAgICBzaG93RnVsbFZpZXc6ICcnXG4gICAgdG9nZ2xlVG9jOiAtPiBzdGF0ZS50b2dnbGUgJ3RvYydcbiAgICB0b2dnbGVJbmRleDogLT4gc3RhdGUudG9nZ2xlICdpbmRleCdcbiAgICBleHBhbmRJbnB1dDogLT4gc3RhdGUudG9nZ2xlICdmdWxsaW5wdXQnXG4gICAgZXhwYW5kVmlldzogLT4gc3RhdGUudG9nZ2xlICdmdWxsJ1xuICAgIG1vdXNlb3V0OiAoZSkgLT5cbiAgICAgIGZyb20gPSBlLnJlbGF0ZWRUYXJnZXQgb3IgZS50b0VsZW1lbnRcbiAgICAgIHVwZGF0ZVN0YXR1cygpIGlmIG5vdCBmcm9tIG9yIGZyb20ubm9kZU5hbWUgaXMgJ0hUTUwnXG4gICAga2V5cHJlc3M6IChlKSAtPlxuICAgICAgaWYgZS5jdHJsS2V5IGFuZCBlLmFsdEtleVxuICAgICAgICBpZiBlLmtleUNvZGUgaXMgMjQgIyBjdHJsK2FsdCt4XG4gICAgICAgICAgc3RhdGUuc2V0ICdmdWxsJywgb2ZmXG4gICAgICAgICAgc3RhdGUuc2V0ICdmdWxsaW5wdXQnLCBvblxuICAgICAgICBlbHNlIGlmIGUua2V5Q29kZSBpcyAzICMgY3RybCthbHQrY1xuICAgICAgICAgIHN0YXRlLnNldCAnZnVsbCcsIG9mZlxuICAgICAgICAgIHN0YXRlLnNldCAnZnVsbGlucHV0Jywgb2ZmXG4gICAgICAgIGVsc2UgaWYgZS5rZXlDb2RlIGlzIDIyICMgY3RybCthbHQrdlxuICAgICAgICAgIHN0YXRlLnNldCAnZnVsbGlucHV0Jywgb2ZmXG4gICAgICAgICAgc3RhdGUuc2V0ICdmdWxsJywgb25cblxuICBzZXRTdGF0ZSgpXG5cbiAgc2hvd0RuZCA9IG5vIGlmIG5vdCBlZGl0b3IuZ2V0VmFsdWUoKVxuICAjJCgnI2lucHV0LXdyYXAnKS5vbmUgJ2NsaWNrJywgLT4gJCgnI2RyYWctbi1kcm9wLXdyYXAnKS5yZW1vdmUoKVxuXG4gIHZpeGVuKGRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSwgbW9kZWwpXG5cbiAgdXBkYXRlVmlldygpXG4gIHVwZGF0ZVN0YXR1cygpXG4iLCIoZnVuY3Rpb24oKXsvL1xuLy8gc2hvd2Rvd24uanMgLS0gQSBqYXZhc2NyaXB0IHBvcnQgb2YgTWFya2Rvd24uXG4vL1xuLy8gQ29weXJpZ2h0IChjKSAyMDA3IEpvaG4gRnJhc2VyLlxuLy9cbi8vIE9yaWdpbmFsIE1hcmtkb3duIENvcHlyaWdodCAoYykgMjAwNC0yMDA1IEpvaG4gR3J1YmVyXG4vLyAgIDxodHRwOi8vZGFyaW5nZmlyZWJhbGwubmV0L3Byb2plY3RzL21hcmtkb3duLz5cbi8vXG4vLyBSZWRpc3RyaWJ1dGFibGUgdW5kZXIgYSBCU0Qtc3R5bGUgb3BlbiBzb3VyY2UgbGljZW5zZS5cbi8vIFNlZSBsaWNlbnNlLnR4dCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbi8vXG4vLyBUaGUgZnVsbCBzb3VyY2UgZGlzdHJpYnV0aW9uIGlzIGF0OlxuLy9cbi8vXHRcdFx0XHRBIEEgTFxuLy9cdFx0XHRcdFQgQyBBXG4vL1x0XHRcdFx0VCBLIEJcbi8vXG4vLyAgIDxodHRwOi8vd3d3LmF0dGFja2xhYi5uZXQvPlxuLy9cblxuLy9cbi8vIFdoZXJldmVyIHBvc3NpYmxlLCBTaG93ZG93biBpcyBhIHN0cmFpZ2h0LCBsaW5lLWJ5LWxpbmUgcG9ydFxuLy8gb2YgdGhlIFBlcmwgdmVyc2lvbiBvZiBNYXJrZG93bi5cbi8vXG4vLyBUaGlzIGlzIG5vdCBhIG5vcm1hbCBwYXJzZXIgZGVzaWduOyBpdCdzIGJhc2ljYWxseSBqdXN0IGFcbi8vIHNlcmllcyBvZiBzdHJpbmcgc3Vic3RpdHV0aW9ucy4gIEl0J3MgaGFyZCB0byByZWFkIGFuZFxuLy8gbWFpbnRhaW4gdGhpcyB3YXksICBidXQga2VlcGluZyBTaG93ZG93biBjbG9zZSB0byB0aGUgb3JpZ2luYWxcbi8vIGRlc2lnbiBtYWtlcyBpdCBlYXNpZXIgdG8gcG9ydCBuZXcgZmVhdHVyZXMuXG4vL1xuLy8gTW9yZSBpbXBvcnRhbnRseSwgU2hvd2Rvd24gYmVoYXZlcyBsaWtlIG1hcmtkb3duLnBsIGluIG1vc3Rcbi8vIGVkZ2UgY2FzZXMuICBTbyB3ZWIgYXBwbGljYXRpb25zIGNhbiBkbyBjbGllbnQtc2lkZSBwcmV2aWV3XG4vLyBpbiBKYXZhc2NyaXB0LCBhbmQgdGhlbiBidWlsZCBpZGVudGljYWwgSFRNTCBvbiB0aGUgc2VydmVyLlxuLy9cbi8vIFRoaXMgcG9ydCBuZWVkcyB0aGUgbmV3IFJlZ0V4cCBmdW5jdGlvbmFsaXR5IG9mIEVDTUEgMjYyLFxuLy8gM3JkIEVkaXRpb24gKGkuZS4gSmF2YXNjcmlwdCAxLjUpLiAgTW9zdCBtb2Rlcm4gd2ViIGJyb3dzZXJzXG4vLyBzaG91bGQgZG8gZmluZS4gIEV2ZW4gd2l0aCB0aGUgbmV3IHJlZ3VsYXIgZXhwcmVzc2lvbiBmZWF0dXJlcyxcbi8vIFdlIGRvIGEgbG90IG9mIHdvcmsgdG8gZW11bGF0ZSBQZXJsJ3MgcmVnZXggZnVuY3Rpb25hbGl0eS5cbi8vIFRoZSB0cmlja3kgY2hhbmdlcyBpbiB0aGlzIGZpbGUgbW9zdGx5IGhhdmUgdGhlIFwiYXR0YWNrbGFiOlwiXG4vLyBsYWJlbC4gIE1ham9yIG9yIHNlbGYtZXhwbGFuYXRvcnkgY2hhbmdlcyBkb24ndC5cbi8vXG4vLyBTbWFydCBkaWZmIHRvb2xzIGxpa2UgQXJheGlzIE1lcmdlIHdpbGwgYmUgYWJsZSB0byBtYXRjaCB1cFxuLy8gdGhpcyBmaWxlIHdpdGggbWFya2Rvd24ucGwgaW4gYSB1c2VmdWwgd2F5LiAgQSBsaXR0bGUgdHdlYWtpbmdcbi8vIGhlbHBzOiBpbiBhIGNvcHkgb2YgbWFya2Rvd24ucGwsIHJlcGxhY2UgXCIjXCIgd2l0aCBcIi8vXCIgYW5kXG4vLyByZXBsYWNlIFwiJHRleHRcIiB3aXRoIFwidGV4dFwiLiAgQmUgc3VyZSB0byBpZ25vcmUgd2hpdGVzcGFjZVxuLy8gYW5kIGxpbmUgZW5kaW5ncy5cbi8vXG5cblxuLy9cbi8vIFNob3dkb3duIHVzYWdlOlxuLy9cbi8vICAgdmFyIHRleHQgPSBcIk1hcmtkb3duICpyb2NrcyouXCI7XG4vL1xuLy8gICB2YXIgY29udmVydGVyID0gbmV3IFNob3dkb3duLmNvbnZlcnRlcigpO1xuLy8gICB2YXIgaHRtbCA9IGNvbnZlcnRlci5tYWtlSHRtbCh0ZXh0KTtcbi8vXG4vLyAgIGFsZXJ0KGh0bWwpO1xuLy9cbi8vIE5vdGU6IG1vdmUgdGhlIHNhbXBsZSBjb2RlIHRvIHRoZSBib3R0b20gb2YgdGhpc1xuLy8gZmlsZSBiZWZvcmUgdW5jb21tZW50aW5nIGl0LlxuLy9cblxuXG4vL1xuLy8gU2hvd2Rvd24gbmFtZXNwYWNlXG4vL1xudmFyIFNob3dkb3duID0ge307XG5cbi8vXG4vLyBjb252ZXJ0ZXJcbi8vXG4vLyBXcmFwcyBhbGwgXCJnbG9iYWxzXCIgc28gdGhhdCB0aGUgb25seSB0aGluZ1xuLy8gZXhwb3NlZCBpcyBtYWtlSHRtbCgpLlxuLy9cblNob3dkb3duLmNvbnZlcnRlciA9IGZ1bmN0aW9uKCkge1xuXG4vL1xuLy8gR2xvYmFsczpcbi8vXG5cbi8vIEdsb2JhbCBoYXNoZXMsIHVzZWQgYnkgdmFyaW91cyB1dGlsaXR5IHJvdXRpbmVzXG52YXIgZ191cmxzO1xudmFyIGdfdGl0bGVzO1xudmFyIGdfaHRtbF9ibG9ja3M7XG5cbi8vIFVzZWQgdG8gdHJhY2sgd2hlbiB3ZSdyZSBpbnNpZGUgYW4gb3JkZXJlZCBvciB1bm9yZGVyZWQgbGlzdFxuLy8gKHNlZSBfUHJvY2Vzc0xpc3RJdGVtcygpIGZvciBkZXRhaWxzKTpcbnZhciBnX2xpc3RfbGV2ZWwgPSAwO1xuXG5cbnRoaXMubWFrZUh0bWwgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gTWFpbiBmdW5jdGlvbi4gVGhlIG9yZGVyIGluIHdoaWNoIG90aGVyIHN1YnMgYXJlIGNhbGxlZCBoZXJlIGlzXG4vLyBlc3NlbnRpYWwuIExpbmsgYW5kIGltYWdlIHN1YnN0aXR1dGlvbnMgbmVlZCB0byBoYXBwZW4gYmVmb3JlXG4vLyBfRXNjYXBlU3BlY2lhbENoYXJzV2l0aGluVGFnQXR0cmlidXRlcygpLCBzbyB0aGF0IGFueSAqJ3Mgb3IgXydzIGluIHRoZSA8YT5cbi8vIGFuZCA8aW1nPiB0YWdzIGdldCBlbmNvZGVkLlxuLy9cblxuXHQvLyBDbGVhciB0aGUgZ2xvYmFsIGhhc2hlcy4gSWYgd2UgZG9uJ3QgY2xlYXIgdGhlc2UsIHlvdSBnZXQgY29uZmxpY3RzXG5cdC8vIGZyb20gb3RoZXIgYXJ0aWNsZXMgd2hlbiBnZW5lcmF0aW5nIGEgcGFnZSB3aGljaCBjb250YWlucyBtb3JlIHRoYW5cblx0Ly8gb25lIGFydGljbGUgKGUuZy4gYW4gaW5kZXggcGFnZSB0aGF0IHNob3dzIHRoZSBOIG1vc3QgcmVjZW50XG5cdC8vIGFydGljbGVzKTpcblx0Z191cmxzID0gbmV3IEFycmF5KCk7XG5cdGdfdGl0bGVzID0gbmV3IEFycmF5KCk7XG5cdGdfaHRtbF9ibG9ja3MgPSBuZXcgQXJyYXkoKTtcblxuXHQvLyBhdHRhY2tsYWI6IFJlcGxhY2UgfiB3aXRoIH5UXG5cdC8vIFRoaXMgbGV0cyB1cyB1c2UgdGlsZGUgYXMgYW4gZXNjYXBlIGNoYXIgdG8gYXZvaWQgbWQ1IGhhc2hlc1xuXHQvLyBUaGUgY2hvaWNlIG9mIGNoYXJhY3RlciBpcyBhcmJpdHJheTsgYW55dGhpbmcgdGhhdCBpc24ndFxuICAgIC8vIG1hZ2ljIGluIE1hcmtkb3duIHdpbGwgd29yay5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfi9nLFwiflRcIik7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXBsYWNlICQgd2l0aCB+RFxuXHQvLyBSZWdFeHAgaW50ZXJwcmV0cyAkIGFzIGEgc3BlY2lhbCBjaGFyYWN0ZXJcblx0Ly8gd2hlbiBpdCdzIGluIGEgcmVwbGFjZW1lbnQgc3RyaW5nXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcJC9nLFwifkRcIik7XG5cblx0Ly8gU3RhbmRhcmRpemUgbGluZSBlbmRpbmdzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcclxcbi9nLFwiXFxuXCIpOyAvLyBET1MgdG8gVW5peFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHIvZyxcIlxcblwiKTsgLy8gTWFjIHRvIFVuaXhcblxuXHQvLyBNYWtlIHN1cmUgdGV4dCBiZWdpbnMgYW5kIGVuZHMgd2l0aCBhIGNvdXBsZSBvZiBuZXdsaW5lczpcblx0dGV4dCA9IFwiXFxuXFxuXCIgKyB0ZXh0ICsgXCJcXG5cXG5cIjtcblxuXHQvLyBDb252ZXJ0IGFsbCB0YWJzIHRvIHNwYWNlcy5cblx0dGV4dCA9IF9EZXRhYih0ZXh0KTtcblxuXHQvLyBTdHJpcCBhbnkgbGluZXMgY29uc2lzdGluZyBvbmx5IG9mIHNwYWNlcyBhbmQgdGFicy5cblx0Ly8gVGhpcyBtYWtlcyBzdWJzZXF1ZW50IHJlZ2V4ZW4gZWFzaWVyIHRvIHdyaXRlLCBiZWNhdXNlIHdlIGNhblxuXHQvLyBtYXRjaCBjb25zZWN1dGl2ZSBibGFuayBsaW5lcyB3aXRoIC9cXG4rLyBpbnN0ZWFkIG9mIHNvbWV0aGluZ1xuXHQvLyBjb250b3J0ZWQgbGlrZSAvWyBcXHRdKlxcbisvIC5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXFx0XSskL21nLFwiXCIpO1xuXG5cdC8vIEhhbmRsZSBnaXRodWIgY29kZWJsb2NrcyBwcmlvciB0byBydW5uaW5nIEhhc2hIVE1MIHNvIHRoYXRcblx0Ly8gSFRNTCBjb250YWluZWQgd2l0aGluIHRoZSBjb2RlYmxvY2sgZ2V0cyBlc2NhcGVkIHByb3BlcnRseVxuXHR0ZXh0ID0gX0RvR2l0aHViQ29kZUJsb2Nrcyh0ZXh0KTtcblxuXHQvLyBUdXJuIGJsb2NrLWxldmVsIEhUTUwgYmxvY2tzIGludG8gaGFzaCBlbnRyaWVzXG5cdHRleHQgPSBfSGFzaEhUTUxCbG9ja3ModGV4dCk7XG5cblx0Ly8gU3RyaXAgbGluayBkZWZpbml0aW9ucywgc3RvcmUgaW4gaGFzaGVzLlxuXHR0ZXh0ID0gX1N0cmlwTGlua0RlZmluaXRpb25zKHRleHQpO1xuXG5cdHRleHQgPSBfUnVuQmxvY2tHYW11dCh0ZXh0KTtcblxuXHR0ZXh0ID0gX1VuZXNjYXBlU3BlY2lhbENoYXJzKHRleHQpO1xuXG5cdC8vIGF0dGFja2xhYjogUmVzdG9yZSBkb2xsYXIgc2lnbnNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkQvZyxcIiQkXCIpO1xuXG5cdC8vIGF0dGFja2xhYjogUmVzdG9yZSB0aWxkZXNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvflQvZyxcIn5cIik7XG5cblx0cmV0dXJuIHRleHQ7XG59O1xuXG5cbnZhciBfU3RyaXBMaW5rRGVmaW5pdGlvbnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gU3RyaXBzIGxpbmsgZGVmaW5pdGlvbnMgZnJvbSB0ZXh0LCBzdG9yZXMgdGhlIFVSTHMgYW5kIHRpdGxlcyBpblxuLy8gaGFzaCByZWZlcmVuY2VzLlxuLy9cblxuXHQvLyBMaW5rIGRlZnMgYXJlIGluIHRoZSBmb3JtOiBeW2lkXTogdXJsIFwib3B0aW9uYWwgdGl0bGVcIlxuXG5cdC8qXG5cdFx0dmFyIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0XHReWyBdezAsM31cXFsoLispXFxdOiAgLy8gaWQgPSAkMSAgYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdFx0ICBbIFxcdF0qXG5cdFx0XHRcdCAgXFxuP1x0XHRcdFx0Ly8gbWF5YmUgKm9uZSogbmV3bGluZVxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0PD8oXFxTKz8pPj9cdFx0XHQvLyB1cmwgPSAkMlxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0ICBcXG4/XHRcdFx0XHQvLyBtYXliZSBvbmUgbmV3bGluZVxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0KD86XG5cdFx0XHRcdCAgKFxcbiopXHRcdFx0XHQvLyBhbnkgbGluZXMgc2tpcHBlZCA9ICQzIGF0dGFja2xhYjogbG9va2JlaGluZCByZW1vdmVkXG5cdFx0XHRcdCAgW1wiKF1cblx0XHRcdFx0ICAoLis/KVx0XHRcdFx0Ly8gdGl0bGUgPSAkNFxuXHRcdFx0XHQgIFtcIildXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQpP1x0XHRcdFx0XHQvLyB0aXRsZSBpcyBvcHRpb25hbFxuXHRcdFx0XHQoPzpcXG4rfCQpXG5cdFx0XHQgIC9nbSxcblx0XHRcdCAgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblx0dmFyIHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwzfVxcWyguKylcXF06WyBcXHRdKlxcbj9bIFxcdF0qPD8oXFxTKz8pPj9bIFxcdF0qXFxuP1sgXFx0XSooPzooXFxuKilbXCIoXSguKz8pW1wiKV1bIFxcdF0qKT8oPzpcXG4rfFxcWikvZ20sXG5cdFx0ZnVuY3Rpb24gKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQpIHtcblx0XHRcdG0xID0gbTEudG9Mb3dlckNhc2UoKTtcblx0XHRcdGdfdXJsc1ttMV0gPSBfRW5jb2RlQW1wc0FuZEFuZ2xlcyhtMik7ICAvLyBMaW5rIElEcyBhcmUgY2FzZS1pbnNlbnNpdGl2ZVxuXHRcdFx0aWYgKG0zKSB7XG5cdFx0XHRcdC8vIE9vcHMsIGZvdW5kIGJsYW5rIGxpbmVzLCBzbyBpdCdzIG5vdCBhIHRpdGxlLlxuXHRcdFx0XHQvLyBQdXQgYmFjayB0aGUgcGFyZW50aGV0aWNhbCBzdGF0ZW1lbnQgd2Ugc3RvbGUuXG5cdFx0XHRcdHJldHVybiBtMyttNDtcblx0XHRcdH0gZWxzZSBpZiAobTQpIHtcblx0XHRcdFx0Z190aXRsZXNbbTFdID0gbTQucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ29tcGxldGVseSByZW1vdmUgdGhlIGRlZmluaXRpb24gZnJvbSB0aGUgdGV4dFxuXHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0fVxuXHQpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfSGFzaEhUTUxCbG9ja3MgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdC8vIGF0dGFja2xhYjogRG91YmxlIHVwIGJsYW5rIGxpbmVzIHRvIHJlZHVjZSBsb29rYXJvdW5kXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcbi9nLFwiXFxuXFxuXCIpO1xuXG5cdC8vIEhhc2hpZnkgSFRNTCBibG9ja3M6XG5cdC8vIFdlIG9ubHkgd2FudCB0byBkbyB0aGlzIGZvciBibG9jay1sZXZlbCBIVE1MIHRhZ3MsIHN1Y2ggYXMgaGVhZGVycyxcblx0Ly8gbGlzdHMsIGFuZCB0YWJsZXMuIFRoYXQncyBiZWNhdXNlIHdlIHN0aWxsIHdhbnQgdG8gd3JhcCA8cD5zIGFyb3VuZFxuXHQvLyBcInBhcmFncmFwaHNcIiB0aGF0IGFyZSB3cmFwcGVkIGluIG5vbi1ibG9jay1sZXZlbCB0YWdzLCBzdWNoIGFzIGFuY2hvcnMsXG5cdC8vIHBocmFzZSBlbXBoYXNpcywgYW5kIHNwYW5zLiBUaGUgbGlzdCBvZiB0YWdzIHdlJ3JlIGxvb2tpbmcgZm9yIGlzXG5cdC8vIGhhcmQtY29kZWQ6XG5cdHZhciBibG9ja190YWdzX2EgPSBcInB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxpbnN8ZGVsfHN0eWxlfHNlY3Rpb258aGVhZGVyfGZvb3RlcnxuYXZ8YXJ0aWNsZXxhc2lkZVwiO1xuXHR2YXIgYmxvY2tfdGFnc19iID0gXCJwfGRpdnxoWzEtNl18YmxvY2txdW90ZXxwcmV8dGFibGV8ZGx8b2x8dWx8c2NyaXB0fG5vc2NyaXB0fGZvcm18ZmllbGRzZXR8aWZyYW1lfG1hdGh8c3R5bGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyfG5hdnxhcnRpY2xlfGFzaWRlXCI7XG5cblx0Ly8gRmlyc3QsIGxvb2sgZm9yIG5lc3RlZCBibG9ja3MsIGUuZy46XG5cdC8vICAgPGRpdj5cblx0Ly8gICAgIDxkaXY+XG5cdC8vICAgICB0YWdzIGZvciBpbm5lciBibG9jayBtdXN0IGJlIGluZGVudGVkLlxuXHQvLyAgICAgPC9kaXY+XG5cdC8vICAgPC9kaXY+XG5cdC8vXG5cdC8vIFRoZSBvdXRlcm1vc3QgdGFncyBtdXN0IHN0YXJ0IGF0IHRoZSBsZWZ0IG1hcmdpbiBmb3IgdGhpcyB0byBtYXRjaCwgYW5kXG5cdC8vIHRoZSBpbm5lciBuZXN0ZWQgZGl2cyBtdXN0IGJlIGluZGVudGVkLlxuXHQvLyBXZSBuZWVkIHRvIGRvIHRoaXMgYmVmb3JlIHRoZSBuZXh0LCBtb3JlIGxpYmVyYWwgbWF0Y2gsIGJlY2F1c2UgdGhlIG5leHRcblx0Ly8gbWF0Y2ggd2lsbCBzdGFydCBhdCB0aGUgZmlyc3QgYDxkaXY+YCBhbmQgc3RvcCBhdCB0aGUgZmlyc3QgYDwvZGl2PmAuXG5cblx0Ly8gYXR0YWNrbGFiOiBUaGlzIHJlZ2V4IGNhbiBiZSBleHBlbnNpdmUgd2hlbiBpdCBmYWlscy5cblx0Lypcblx0XHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdF5cdFx0XHRcdFx0Ly8gc3RhcnQgb2YgbGluZSAgKHdpdGggL20pXG5cdFx0XHQ8KCRibG9ja190YWdzX2EpXHQvLyBzdGFydCB0YWcgPSAkMlxuXHRcdFx0XFxiXHRcdFx0XHRcdC8vIHdvcmQgYnJlYWtcblx0XHRcdFx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IGhhY2sgYXJvdW5kIGtodG1sL3BjcmUgYnVnLi4uXG5cdFx0XHRbXlxccl0qP1xcblx0XHRcdC8vIGFueSBudW1iZXIgb2YgbGluZXMsIG1pbmltYWxseSBtYXRjaGluZ1xuXHRcdFx0PC9cXDI+XHRcdFx0XHQvLyB0aGUgbWF0Y2hpbmcgZW5kIHRhZ1xuXHRcdFx0WyBcXHRdKlx0XHRcdFx0Ly8gdHJhaWxpbmcgc3BhY2VzL3RhYnNcblx0XHRcdCg/PVxcbispXHRcdFx0XHQvLyBmb2xsb3dlZCBieSBhIG5ld2xpbmVcblx0XHQpXHRcdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB0aGVyZSBhcmUgc2VudGluZWwgbmV3bGluZXMgYXQgZW5kIG9mIGRvY3VtZW50XG5cdFx0L2dtLGZ1bmN0aW9uKCl7Li4ufX07XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oPChwfGRpdnxoWzEtNl18YmxvY2txdW90ZXxwcmV8dGFibGV8ZGx8b2x8dWx8c2NyaXB0fG5vc2NyaXB0fGZvcm18ZmllbGRzZXR8aWZyYW1lfG1hdGh8aW5zfGRlbClcXGJbXlxccl0qP1xcbjxcXC9cXDI+WyBcXHRdKig/PVxcbispKS9nbSxoYXNoRWxlbWVudCk7XG5cblx0Ly9cblx0Ly8gTm93IG1hdGNoIG1vcmUgbGliZXJhbGx5LCBzaW1wbHkgZnJvbSBgXFxuPHRhZz5gIHRvIGA8L3RhZz5cXG5gXG5cdC8vXG5cblx0Lypcblx0XHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdF5cdFx0XHRcdFx0Ly8gc3RhcnQgb2YgbGluZSAgKHdpdGggL20pXG5cdFx0XHQ8KCRibG9ja190YWdzX2IpXHQvLyBzdGFydCB0YWcgPSAkMlxuXHRcdFx0XFxiXHRcdFx0XHRcdC8vIHdvcmQgYnJlYWtcblx0XHRcdFx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IGhhY2sgYXJvdW5kIGtodG1sL3BjcmUgYnVnLi4uXG5cdFx0XHRbXlxccl0qP1x0XHRcdFx0Ly8gYW55IG51bWJlciBvZiBsaW5lcywgbWluaW1hbGx5IG1hdGNoaW5nXG5cdFx0XHQuKjwvXFwyPlx0XHRcdFx0Ly8gdGhlIG1hdGNoaW5nIGVuZCB0YWdcblx0XHRcdFsgXFx0XSpcdFx0XHRcdC8vIHRyYWlsaW5nIHNwYWNlcy90YWJzXG5cdFx0XHQoPz1cXG4rKVx0XHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBuZXdsaW5lXG5cdFx0KVx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogdGhlcmUgYXJlIHNlbnRpbmVsIG5ld2xpbmVzIGF0IGVuZCBvZiBkb2N1bWVudFxuXHRcdC9nbSxmdW5jdGlvbigpey4uLn19O1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKDwocHxkaXZ8aFsxLTZdfGJsb2NrcXVvdGV8cHJlfHRhYmxlfGRsfG9sfHVsfHNjcmlwdHxub3NjcmlwdHxmb3JtfGZpZWxkc2V0fGlmcmFtZXxtYXRofHN0eWxlfHNlY3Rpb258aGVhZGVyfGZvb3RlcnxuYXZ8YXJ0aWNsZXxhc2lkZSlcXGJbXlxccl0qPy4qPFxcL1xcMj5bIFxcdF0qKD89XFxuKylcXG4pL2dtLGhhc2hFbGVtZW50KTtcblxuXHQvLyBTcGVjaWFsIGNhc2UganVzdCBmb3IgPGhyIC8+LiBJdCB3YXMgZWFzaWVyIHRvIG1ha2UgYSBzcGVjaWFsIGNhc2UgdGhhblxuXHQvLyB0byBtYWtlIHRoZSBvdGhlciByZWdleCBtb3JlIGNvbXBsaWNhdGVkLlxuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdFxcblxcblx0XHRcdFx0Ly8gU3RhcnRpbmcgYWZ0ZXIgYSBibGFuayBsaW5lXG5cdFx0XHRbIF17MCwzfVxuXHRcdFx0KDwoaHIpXHRcdFx0XHQvLyBzdGFydCB0YWcgPSAkMlxuXHRcdFx0XFxiXHRcdFx0XHRcdC8vIHdvcmQgYnJlYWtcblx0XHRcdChbXjw+XSkqP1x0XHRcdC8vXG5cdFx0XHRcXC8/PilcdFx0XHRcdC8vIHRoZSBtYXRjaGluZyBlbmQgdGFnXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoPz1cXG57Mix9KVx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgYmxhbmsgbGluZVxuXHRcdClcblx0XHQvZyxoYXNoRWxlbWVudCk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXG5bIF17MCwzfSg8KGhyKVxcYihbXjw+XSkqP1xcLz8+KVsgXFx0XSooPz1cXG57Mix9KSkvZyxoYXNoRWxlbWVudCk7XG5cblx0Ly8gU3BlY2lhbCBjYXNlIGZvciBzdGFuZGFsb25lIEhUTUwgY29tbWVudHM6XG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0XFxuXFxuXHRcdFx0XHQvLyBTdGFydGluZyBhZnRlciBhIGJsYW5rIGxpbmVcblx0XHRcdFsgXXswLDN9XHRcdFx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdDwhXG5cdFx0XHQoLS1bXlxccl0qPy0tXFxzKikrXG5cdFx0XHQ+XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoPz1cXG57Mix9KVx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgYmxhbmsgbGluZVxuXHRcdClcblx0XHQvZyxoYXNoRWxlbWVudCk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXG5cXG5bIF17MCwzfTwhKC0tW15cXHJdKj8tLVxccyopKz5bIFxcdF0qKD89XFxuezIsfSkpL2csaGFzaEVsZW1lbnQpO1xuXG5cdC8vIFBIUCBhbmQgQVNQLXN0eWxlIHByb2Nlc3NvciBpbnN0cnVjdGlvbnMgKDw/Li4uPz4gYW5kIDwlLi4uJT4pXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoPzpcblx0XHRcdFxcblxcblx0XHRcdFx0Ly8gU3RhcnRpbmcgYWZ0ZXIgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdChcdFx0XHRcdFx0XHQvLyBzYXZlIGluICQxXG5cdFx0XHRbIF17MCwzfVx0XHRcdC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGggLSAxXG5cdFx0XHQoPzpcblx0XHRcdFx0PChbPyVdKVx0XHRcdC8vICQyXG5cdFx0XHRcdFteXFxyXSo/XG5cdFx0XHRcdFxcMj5cblx0XHRcdClcblx0XHRcdFsgXFx0XSpcblx0XHRcdCg/PVxcbnsyLH0pXHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdC9nLGhhc2hFbGVtZW50KTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKD86XFxuXFxuKShbIF17MCwzfSg/OjwoWz8lXSlbXlxccl0qP1xcMj4pWyBcXHRdKig/PVxcbnsyLH0pKS9nLGhhc2hFbGVtZW50KTtcblxuXHQvLyBhdHRhY2tsYWI6IFVuZG8gZG91YmxlIGxpbmVzIChzZWUgY29tbWVudCBhdCB0b3Agb2YgdGhpcyBmdW5jdGlvbilcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxuXFxuL2csXCJcXG5cIik7XG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgaGFzaEVsZW1lbnQgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdHZhciBibG9ja1RleHQgPSBtMTtcblxuXHQvLyBVbmRvIGRvdWJsZSBsaW5lc1xuXHRibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFxuXFxuL2csXCJcXG5cIik7XG5cdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9eXFxuLyxcIlwiKTtcblxuXHQvLyBzdHJpcCB0cmFpbGluZyBibGFuayBsaW5lc1xuXHRibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTtcblxuXHQvLyBSZXBsYWNlIHRoZSBlbGVtZW50IHRleHQgd2l0aCBhIG1hcmtlciAoXCJ+S3hLXCIgd2hlcmUgeCBpcyBpdHMga2V5KVxuXHRibG9ja1RleHQgPSBcIlxcblxcbn5LXCIgKyAoZ19odG1sX2Jsb2Nrcy5wdXNoKGJsb2NrVGV4dCktMSkgKyBcIktcXG5cXG5cIjtcblxuXHRyZXR1cm4gYmxvY2tUZXh0O1xufTtcblxudmFyIF9SdW5CbG9ja0dhbXV0ID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFRoZXNlIGFyZSBhbGwgdGhlIHRyYW5zZm9ybWF0aW9ucyB0aGF0IGZvcm0gYmxvY2stbGV2ZWxcbi8vIHRhZ3MgbGlrZSBwYXJhZ3JhcGhzLCBoZWFkZXJzLCBhbmQgbGlzdCBpdGVtcy5cbi8vXG5cdHRleHQgPSBfRG9IZWFkZXJzKHRleHQpO1xuXG5cdC8vIERvIEhvcml6b250YWwgUnVsZXM6XG5cdHZhciBrZXkgPSBoYXNoQmxvY2soXCI8aHIgLz5cIik7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwyfShbIF0/XFwqWyBdPyl7Myx9WyBcXHRdKiQvZ20sa2V5KTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXC1bIF0/KXszLH1bIFxcdF0qJC9nbSxrZXkpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBdezAsMn0oWyBdP1xcX1sgXT8pezMsfVsgXFx0XSokL2dtLGtleSk7XG5cblx0dGV4dCA9IF9Eb0xpc3RzKHRleHQpO1xuXHR0ZXh0ID0gX0RvQ29kZUJsb2Nrcyh0ZXh0KTtcblx0dGV4dCA9IF9Eb0Jsb2NrUXVvdGVzKHRleHQpO1xuXG5cdC8vIFdlIGFscmVhZHkgcmFuIF9IYXNoSFRNTEJsb2NrcygpIGJlZm9yZSwgaW4gTWFya2Rvd24oKSwgYnV0IHRoYXRcblx0Ly8gd2FzIHRvIGVzY2FwZSByYXcgSFRNTCBpbiB0aGUgb3JpZ2luYWwgTWFya2Rvd24gc291cmNlLiBUaGlzIHRpbWUsXG5cdC8vIHdlJ3JlIGVzY2FwaW5nIHRoZSBtYXJrdXAgd2UndmUganVzdCBjcmVhdGVkLCBzbyB0aGF0IHdlIGRvbid0IHdyYXBcblx0Ly8gPHA+IHRhZ3MgYXJvdW5kIGJsb2NrLWxldmVsIHRhZ3MuXG5cdHRleHQgPSBfSGFzaEhUTUxCbG9ja3ModGV4dCk7XG5cdHRleHQgPSBfRm9ybVBhcmFncmFwaHModGV4dCk7XG5cblx0cmV0dXJuIHRleHQ7XG59O1xuXG5cbnZhciBfUnVuU3BhbkdhbXV0ID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFRoZXNlIGFyZSBhbGwgdGhlIHRyYW5zZm9ybWF0aW9ucyB0aGF0IG9jY3VyICp3aXRoaW4qIGJsb2NrLWxldmVsXG4vLyB0YWdzIGxpa2UgcGFyYWdyYXBocywgaGVhZGVycywgYW5kIGxpc3QgaXRlbXMuXG4vL1xuXG5cdHRleHQgPSBfRG9Db2RlU3BhbnModGV4dCk7XG5cdHRleHQgPSBfRXNjYXBlU3BlY2lhbENoYXJzV2l0aGluVGFnQXR0cmlidXRlcyh0ZXh0KTtcblx0dGV4dCA9IF9FbmNvZGVCYWNrc2xhc2hFc2NhcGVzKHRleHQpO1xuXG5cdC8vIFByb2Nlc3MgYW5jaG9yIGFuZCBpbWFnZSB0YWdzLiBJbWFnZXMgbXVzdCBjb21lIGZpcnN0LFxuXHQvLyBiZWNhdXNlICFbZm9vXVtmXSBsb29rcyBsaWtlIGFuIGFuY2hvci5cblx0dGV4dCA9IF9Eb0ltYWdlcyh0ZXh0KTtcblx0dGV4dCA9IF9Eb0FuY2hvcnModGV4dCk7XG5cblx0Ly8gTWFrZSBsaW5rcyBvdXQgb2YgdGhpbmdzIGxpa2UgYDxodHRwOi8vZXhhbXBsZS5jb20vPmBcblx0Ly8gTXVzdCBjb21lIGFmdGVyIF9Eb0FuY2hvcnMoKSwgYmVjYXVzZSB5b3UgY2FuIHVzZSA8IGFuZCA+XG5cdC8vIGRlbGltaXRlcnMgaW4gaW5saW5lIGxpbmtzIGxpa2UgW3RoaXNdKDx1cmw+KS5cblx0dGV4dCA9IF9Eb0F1dG9MaW5rcyh0ZXh0KTtcblx0dGV4dCA9IF9FbmNvZGVBbXBzQW5kQW5nbGVzKHRleHQpO1xuXHR0ZXh0ID0gX0RvSXRhbGljc0FuZEJvbGQodGV4dCk7XG5cblx0Ly8gRG8gaGFyZCBicmVha3M6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyAgK1xcbi9nLFwiIDxiciAvPlxcblwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIF9Fc2NhcGVTcGVjaWFsQ2hhcnNXaXRoaW5UYWdBdHRyaWJ1dGVzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFdpdGhpbiB0YWdzIC0tIG1lYW5pbmcgYmV0d2VlbiA8IGFuZCA+IC0tIGVuY29kZSBbXFwgYCAqIF9dIHNvIHRoZXlcbi8vIGRvbid0IGNvbmZsaWN0IHdpdGggdGhlaXIgdXNlIGluIE1hcmtkb3duIGZvciBjb2RlLCBpdGFsaWNzIGFuZCBzdHJvbmcuXG4vL1xuXG5cdC8vIEJ1aWxkIGEgcmVnZXggdG8gZmluZCBIVE1MIHRhZ3MgYW5kIGNvbW1lbnRzLiAgU2VlIEZyaWVkbCdzXG5cdC8vIFwiTWFzdGVyaW5nIFJlZ3VsYXIgRXhwcmVzc2lvbnNcIiwgMm5kIEVkLiwgcHAuIDIwMC0yMDEuXG5cdHZhciByZWdleCA9IC8oPFthLXpcXC8hJF0oXCJbXlwiXSpcInwnW14nXSonfFteJ1wiPl0pKj58PCEoLS0uKj8tLVxccyopKz4pL2dpO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsIGZ1bmN0aW9uKHdob2xlTWF0Y2gpIHtcblx0XHR2YXIgdGFnID0gd2hvbGVNYXRjaC5yZXBsYWNlKC8oLik8XFwvP2NvZGU+KD89LikvZyxcIiQxYFwiKTtcblx0XHR0YWcgPSBlc2NhcGVDaGFyYWN0ZXJzKHRhZyxcIlxcXFxgKl9cIik7XG5cdFx0cmV0dXJuIHRhZztcblx0fSk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBfRG9BbmNob3JzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFR1cm4gTWFya2Rvd24gbGluayBzaG9ydGN1dHMgaW50byBYSFRNTCA8YT4gdGFncy5cbi8vXG5cdC8vXG5cdC8vIEZpcnN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIGxpbmtzOiBbbGluayB0ZXh0XSBbaWRdXG5cdC8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHRcXFtcblx0XHRcdChcblx0XHRcdFx0KD86XG5cdFx0XHRcdFx0XFxbW15cXF1dKlxcXVx0XHQvLyBhbGxvdyBicmFja2V0cyBuZXN0ZWQgb25lIGxldmVsXG5cdFx0XHRcdFx0fFxuXHRcdFx0XHRcdFteXFxbXVx0XHRcdC8vIG9yIGFueXRoaW5nIGVsc2Vcblx0XHRcdFx0KSpcblx0XHRcdClcblx0XHRcdFxcXVxuXG5cdFx0XHRbIF0/XHRcdFx0XHRcdC8vIG9uZSBvcHRpb25hbCBzcGFjZVxuXHRcdFx0KD86XFxuWyBdKik/XHRcdFx0XHQvLyBvbmUgb3B0aW9uYWwgbmV3bGluZSBmb2xsb3dlZCBieSBzcGFjZXNcblxuXHRcdFx0XFxbXG5cdFx0XHQoLio/KVx0XHRcdFx0XHQvLyBpZCA9ICQzXG5cdFx0XHRcXF1cblx0XHQpKCkoKSgpKClcdFx0XHRcdFx0Ly8gcGFkIHJlbWFpbmluZyBiYWNrcmVmZXJlbmNlc1xuXHRcdC9nLF9Eb0FuY2hvcnNfY2FsbGJhY2spO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbKCg/OlxcW1teXFxdXSpcXF18W15cXFtcXF1dKSopXFxdWyBdPyg/OlxcblsgXSopP1xcWyguKj8pXFxdKSgpKCkoKSgpL2csd3JpdGVBbmNob3JUYWcpO1xuXG5cdC8vXG5cdC8vIE5leHQsIGlubGluZS1zdHlsZSBsaW5rczogW2xpbmsgdGV4dF0odXJsIFwib3B0aW9uYWwgdGl0bGVcIilcblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0KFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdFx0XFxbXG5cdFx0XHRcdChcblx0XHRcdFx0XHQoPzpcblx0XHRcdFx0XHRcdFxcW1teXFxdXSpcXF1cdC8vIGFsbG93IGJyYWNrZXRzIG5lc3RlZCBvbmUgbGV2ZWxcblx0XHRcdFx0XHR8XG5cdFx0XHRcdFx0W15cXFtcXF1dXHRcdFx0Ly8gb3IgYW55dGhpbmcgZWxzZVxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0XHRcXF1cblx0XHRcdFxcKFx0XHRcdFx0XHRcdC8vIGxpdGVyYWwgcGFyZW5cblx0XHRcdFsgXFx0XSpcblx0XHRcdCgpXHRcdFx0XHRcdFx0Ly8gbm8gaWQsIHNvIGxlYXZlICQzIGVtcHR5XG5cdFx0XHQ8PyguKj8pPj9cdFx0XHRcdC8vIGhyZWYgPSAkNFxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KFx0XHRcdFx0XHRcdC8vICQ1XG5cdFx0XHRcdChbJ1wiXSlcdFx0XHRcdC8vIHF1b3RlIGNoYXIgPSAkNlxuXHRcdFx0XHQoLio/KVx0XHRcdFx0Ly8gVGl0bGUgPSAkN1xuXHRcdFx0XHRcXDZcdFx0XHRcdFx0Ly8gbWF0Y2hpbmcgcXVvdGVcblx0XHRcdFx0WyBcXHRdKlx0XHRcdFx0Ly8gaWdub3JlIGFueSBzcGFjZXMvdGFicyBiZXR3ZWVuIGNsb3NpbmcgcXVvdGUgYW5kIClcblx0XHRcdCk/XHRcdFx0XHRcdFx0Ly8gdGl0bGUgaXMgb3B0aW9uYWxcblx0XHRcdFxcKVxuXHRcdClcblx0XHQvZyx3cml0ZUFuY2hvclRhZyk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFsoKD86XFxbW15cXF1dKlxcXXxbXlxcW1xcXV0pKilcXF1cXChbIFxcdF0qKCk8PyguKj8pPj9bIFxcdF0qKChbJ1wiXSkoLio/KVxcNlsgXFx0XSopP1xcKSkvZyx3cml0ZUFuY2hvclRhZyk7XG5cblx0Ly9cblx0Ly8gTGFzdCwgaGFuZGxlIHJlZmVyZW5jZS1zdHlsZSBzaG9ydGN1dHM6IFtsaW5rIHRleHRdXG5cdC8vIFRoZXNlIG11c3QgY29tZSBsYXN0IGluIGNhc2UgeW91J3ZlIGFsc28gZ290IFtsaW5rIHRlc3RdWzFdXG5cdC8vIG9yIFtsaW5rIHRlc3RdKC9mb28pXG5cdC8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdCBcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0XFxbXG5cdFx0XHQoW15cXFtcXF1dKylcdFx0XHRcdC8vIGxpbmsgdGV4dCA9ICQyOyBjYW4ndCBjb250YWluICdbJyBvciAnXSdcblx0XHRcdFxcXVxuXHRcdCkoKSgpKCkoKSgpXHRcdFx0XHRcdC8vIHBhZCByZXN0IG9mIGJhY2tyZWZlcmVuY2VzXG5cdFx0L2csIHdyaXRlQW5jaG9yVGFnKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcWyhbXlxcW1xcXV0rKVxcXSkoKSgpKCkoKSgpL2csIHdyaXRlQW5jaG9yVGFnKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIHdyaXRlQW5jaG9yVGFnID0gZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMyxtNCxtNSxtNixtNykge1xuXHRpZiAobTcgPT0gdW5kZWZpbmVkKSBtNyA9IFwiXCI7XG5cdHZhciB3aG9sZV9tYXRjaCA9IG0xO1xuXHR2YXIgbGlua190ZXh0ICAgPSBtMjtcblx0dmFyIGxpbmtfaWRcdCA9IG0zLnRvTG93ZXJDYXNlKCk7XG5cdHZhciB1cmxcdFx0PSBtNDtcblx0dmFyIHRpdGxlXHQ9IG03O1xuXG5cdGlmICh1cmwgPT0gXCJcIikge1xuXHRcdGlmIChsaW5rX2lkID09IFwiXCIpIHtcblx0XHRcdC8vIGxvd2VyLWNhc2UgYW5kIHR1cm4gZW1iZWRkZWQgbmV3bGluZXMgaW50byBzcGFjZXNcblx0XHRcdGxpbmtfaWQgPSBsaW5rX3RleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8gP1xcbi9nLFwiIFwiKTtcblx0XHR9XG5cdFx0dXJsID0gXCIjXCIrbGlua19pZDtcblxuXHRcdGlmIChnX3VybHNbbGlua19pZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR1cmwgPSBnX3VybHNbbGlua19pZF07XG5cdFx0XHRpZiAoZ190aXRsZXNbbGlua19pZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHRpdGxlID0gZ190aXRsZXNbbGlua19pZF07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKHdob2xlX21hdGNoLnNlYXJjaCgvXFwoXFxzKlxcKSQvbSk+LTEpIHtcblx0XHRcdFx0Ly8gU3BlY2lhbCBjYXNlIGZvciBleHBsaWNpdCBlbXB0eSB1cmxcblx0XHRcdFx0dXJsID0gXCJcIjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiB3aG9sZV9tYXRjaDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR1cmwgPSBlc2NhcGVDaGFyYWN0ZXJzKHVybCxcIipfXCIpO1xuXHR2YXIgcmVzdWx0ID0gXCI8YSBocmVmPVxcXCJcIiArIHVybCArIFwiXFxcIlwiO1xuXG5cdGlmICh0aXRsZSAhPSBcIlwiKSB7XG5cdFx0dGl0bGUgPSB0aXRsZS5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHRcdHRpdGxlID0gZXNjYXBlQ2hhcmFjdGVycyh0aXRsZSxcIipfXCIpO1xuXHRcdHJlc3VsdCArPSAgXCIgdGl0bGU9XFxcIlwiICsgdGl0bGUgKyBcIlxcXCJcIjtcblx0fVxuXG5cdHJlc3VsdCArPSBcIj5cIiArIGxpbmtfdGV4dCArIFwiPC9hPlwiO1xuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cblxudmFyIF9Eb0ltYWdlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBUdXJuIE1hcmtkb3duIGltYWdlIHNob3J0Y3V0cyBpbnRvIDxpbWc+IHRhZ3MuXG4vL1xuXG5cdC8vXG5cdC8vIEZpcnN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIGxhYmVsZWQgaW1hZ2VzOiAhW2FsdCB0ZXh0XVtpZF1cblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHQhXFxbXG5cdFx0XHQoLio/KVx0XHRcdFx0Ly8gYWx0IHRleHQgPSAkMlxuXHRcdFx0XFxdXG5cblx0XHRcdFsgXT9cdFx0XHRcdC8vIG9uZSBvcHRpb25hbCBzcGFjZVxuXHRcdFx0KD86XFxuWyBdKik/XHRcdFx0Ly8gb25lIG9wdGlvbmFsIG5ld2xpbmUgZm9sbG93ZWQgYnkgc3BhY2VzXG5cblx0XHRcdFxcW1xuXHRcdFx0KC4qPylcdFx0XHRcdC8vIGlkID0gJDNcblx0XHRcdFxcXVxuXHRcdCkoKSgpKCkoKVx0XHRcdFx0Ly8gcGFkIHJlc3Qgb2YgYmFja3JlZmVyZW5jZXNcblx0XHQvZyx3cml0ZUltYWdlVGFnKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKCFcXFsoLio/KVxcXVsgXT8oPzpcXG5bIF0qKT9cXFsoLio/KVxcXSkoKSgpKCkoKS9nLHdyaXRlSW1hZ2VUYWcpO1xuXG5cdC8vXG5cdC8vIE5leHQsIGhhbmRsZSBpbmxpbmUgaW1hZ2VzOiAgIVthbHQgdGV4dF0odXJsIFwib3B0aW9uYWwgdGl0bGVcIilcblx0Ly8gRG9uJ3QgZm9yZ2V0OiBlbmNvZGUgKiBhbmQgX1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdCFcXFtcblx0XHRcdCguKj8pXHRcdFx0XHQvLyBhbHQgdGV4dCA9ICQyXG5cdFx0XHRcXF1cblx0XHRcdFxccz9cdFx0XHRcdFx0Ly8gT25lIG9wdGlvbmFsIHdoaXRlc3BhY2UgY2hhcmFjdGVyXG5cdFx0XHRcXChcdFx0XHRcdFx0Ly8gbGl0ZXJhbCBwYXJlblxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KClcdFx0XHRcdFx0Ly8gbm8gaWQsIHNvIGxlYXZlICQzIGVtcHR5XG5cdFx0XHQ8PyhcXFMrPyk+P1x0XHRcdC8vIHNyYyB1cmwgPSAkNFxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KFx0XHRcdFx0XHQvLyAkNVxuXHRcdFx0XHQoWydcIl0pXHRcdFx0Ly8gcXVvdGUgY2hhciA9ICQ2XG5cdFx0XHRcdCguKj8pXHRcdFx0Ly8gdGl0bGUgPSAkN1xuXHRcdFx0XHRcXDZcdFx0XHRcdC8vIG1hdGNoaW5nIHF1b3RlXG5cdFx0XHRcdFsgXFx0XSpcblx0XHRcdCk/XHRcdFx0XHRcdC8vIHRpdGxlIGlzIG9wdGlvbmFsXG5cdFx0XFwpXG5cdFx0KVxuXHRcdC9nLHdyaXRlSW1hZ2VUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oIVxcWyguKj8pXFxdXFxzP1xcKFsgXFx0XSooKTw/KFxcUys/KT4/WyBcXHRdKigoWydcIl0pKC4qPylcXDZbIFxcdF0qKT9cXCkpL2csd3JpdGVJbWFnZVRhZyk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciB3cml0ZUltYWdlVGFnID0gZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMyxtNCxtNSxtNixtNykge1xuXHR2YXIgd2hvbGVfbWF0Y2ggPSBtMTtcblx0dmFyIGFsdF90ZXh0ICAgPSBtMjtcblx0dmFyIGxpbmtfaWRcdCA9IG0zLnRvTG93ZXJDYXNlKCk7XG5cdHZhciB1cmxcdFx0PSBtNDtcblx0dmFyIHRpdGxlXHQ9IG03O1xuXG5cdGlmICghdGl0bGUpIHRpdGxlID0gXCJcIjtcblxuXHRpZiAodXJsID09IFwiXCIpIHtcblx0XHRpZiAobGlua19pZCA9PSBcIlwiKSB7XG5cdFx0XHQvLyBsb3dlci1jYXNlIGFuZCB0dXJuIGVtYmVkZGVkIG5ld2xpbmVzIGludG8gc3BhY2VzXG5cdFx0XHRsaW5rX2lkID0gYWx0X3RleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8gP1xcbi9nLFwiIFwiKTtcblx0XHR9XG5cdFx0dXJsID0gXCIjXCIrbGlua19pZDtcblxuXHRcdGlmIChnX3VybHNbbGlua19pZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR1cmwgPSBnX3VybHNbbGlua19pZF07XG5cdFx0XHRpZiAoZ190aXRsZXNbbGlua19pZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHRpdGxlID0gZ190aXRsZXNbbGlua19pZF07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHdob2xlX21hdGNoO1xuXHRcdH1cblx0fVxuXG5cdGFsdF90ZXh0ID0gYWx0X3RleHQucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKTtcblx0dXJsID0gZXNjYXBlQ2hhcmFjdGVycyh1cmwsXCIqX1wiKTtcblx0dmFyIHJlc3VsdCA9IFwiPGltZyBzcmM9XFxcIlwiICsgdXJsICsgXCJcXFwiIGFsdD1cXFwiXCIgKyBhbHRfdGV4dCArIFwiXFxcIlwiO1xuXG5cdC8vIGF0dGFja2xhYjogTWFya2Rvd24ucGwgYWRkcyBlbXB0eSB0aXRsZSBhdHRyaWJ1dGVzIHRvIGltYWdlcy5cblx0Ly8gUmVwbGljYXRlIHRoaXMgYnVnLlxuXG5cdC8vaWYgKHRpdGxlICE9IFwiXCIpIHtcblx0XHR0aXRsZSA9IHRpdGxlLnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIik7XG5cdFx0dGl0bGUgPSBlc2NhcGVDaGFyYWN0ZXJzKHRpdGxlLFwiKl9cIik7XG5cdFx0cmVzdWx0ICs9ICBcIiB0aXRsZT1cXFwiXCIgKyB0aXRsZSArIFwiXFxcIlwiO1xuXHQvL31cblxuXHRyZXN1bHQgKz0gXCIgLz5cIjtcblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5cbnZhciBfRG9IZWFkZXJzID0gZnVuY3Rpb24odGV4dCkge1xuXG5cdC8vIFNldGV4dC1zdHlsZSBoZWFkZXJzOlxuXHQvL1x0SGVhZGVyIDFcblx0Ly9cdD09PT09PT09XG5cdC8vXG5cdC8vXHRIZWFkZXIgMlxuXHQvL1x0LS0tLS0tLS1cblx0Ly9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXiguKylbIFxcdF0qXFxuPStbIFxcdF0qXFxuKy9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKXtyZXR1cm4gaGFzaEJsb2NrKCc8aDEgaWQ9XCInICsgaGVhZGVySWQobTEpICsgJ1wiPicgKyBfUnVuU3BhbkdhbXV0KG0xKSArIFwiPC9oMT5cIik7fSk7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXiguKylbIFxcdF0qXFxuLStbIFxcdF0qXFxuKy9nbSxcblx0XHRmdW5jdGlvbihtYXRjaEZvdW5kLG0xKXtyZXR1cm4gaGFzaEJsb2NrKCc8aDIgaWQ9XCInICsgaGVhZGVySWQobTEpICsgJ1wiPicgKyBfUnVuU3BhbkdhbXV0KG0xKSArIFwiPC9oMj5cIik7fSk7XG5cblx0Ly8gYXR4LXN0eWxlIGhlYWRlcnM6XG5cdC8vICAjIEhlYWRlciAxXG5cdC8vICAjIyBIZWFkZXIgMlxuXHQvLyAgIyMgSGVhZGVyIDIgd2l0aCBjbG9zaW5nIGhhc2hlcyAjI1xuXHQvLyAgLi4uXG5cdC8vICAjIyMjIyMgSGVhZGVyIDZcblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0XihcXCN7MSw2fSlcdFx0XHRcdC8vICQxID0gc3RyaW5nIG9mICMnc1xuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KC4rPylcdFx0XHRcdFx0Ly8gJDIgPSBIZWFkZXIgdGV4dFxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0XFwjKlx0XHRcdFx0XHRcdC8vIG9wdGlvbmFsIGNsb3NpbmcgIydzIChub3QgY291bnRlZClcblx0XHRcdFxcbitcblx0XHQvZ20sIGZ1bmN0aW9uKCkgey4uLn0pO1xuXHQqL1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oXFwjezEsNn0pWyBcXHRdKiguKz8pWyBcXHRdKlxcIypcXG4rL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIpIHtcblx0XHRcdHZhciBoX2xldmVsID0gbTEubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhcIjxoXCIgKyBoX2xldmVsICsgJyBpZD1cIicgKyBoZWFkZXJJZChtMikgKyAnXCI+JyArIF9SdW5TcGFuR2FtdXQobTIpICsgXCI8L2hcIiArIGhfbGV2ZWwgKyBcIj5cIik7XG5cdFx0fSk7XG5cblx0ZnVuY3Rpb24gaGVhZGVySWQobSkge1xuXHRcdHJldHVybiBtLnJlcGxhY2UoL1teXFx3XS9nLCAnJykudG9Mb3dlckNhc2UoKTtcblx0fVxuXHRyZXR1cm4gdGV4dDtcbn1cblxuLy8gVGhpcyBkZWNsYXJhdGlvbiBrZWVwcyBEb2pvIGNvbXByZXNzb3IgZnJvbSBvdXRwdXR0aW5nIGdhcmJhZ2U6XG52YXIgX1Byb2Nlc3NMaXN0SXRlbXM7XG5cbnZhciBfRG9MaXN0cyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBGb3JtIEhUTUwgb3JkZXJlZCAobnVtYmVyZWQpIGFuZCB1bm9yZGVyZWQgKGJ1bGxldGVkKSBsaXN0cy5cbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiBhZGQgc2VudGluZWwgdG8gaGFjayBhcm91bmQga2h0bWwvc2FmYXJpIGJ1Zzpcblx0Ly8gaHR0cDovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTEyMzFcblx0dGV4dCArPSBcIn4wXCI7XG5cblx0Ly8gUmUtdXNhYmxlIHBhdHRlcm4gdG8gbWF0Y2ggYW55IGVudGlyZWwgdWwgb3Igb2wgbGlzdDpcblxuXHQvKlxuXHRcdHZhciB3aG9sZV9saXN0ID0gL1xuXHRcdChcdFx0XHRcdFx0XHRcdFx0XHQvLyAkMSA9IHdob2xlIGxpc3Rcblx0XHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gJDJcblx0XHRcdFx0WyBdezAsM31cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdFx0KFsqKy1dfFxcZCtbLl0pXHRcdFx0XHQvLyAkMyA9IGZpcnN0IGxpc3QgaXRlbSBtYXJrZXJcblx0XHRcdFx0WyBcXHRdK1xuXHRcdFx0KVxuXHRcdFx0W15cXHJdKz9cblx0XHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gJDRcblx0XHRcdFx0fjBcdFx0XHRcdFx0XHRcdC8vIHNlbnRpbmVsIGZvciB3b3JrYXJvdW5kOyBzaG91bGQgYmUgJFxuXHRcdFx0fFxuXHRcdFx0XHRcXG57Mix9XG5cdFx0XHRcdCg/PVxcUylcblx0XHRcdFx0KD8hXHRcdFx0XHRcdFx0XHQvLyBOZWdhdGl2ZSBsb29rYWhlYWQgZm9yIGFub3RoZXIgbGlzdCBpdGVtIG1hcmtlclxuXHRcdFx0XHRcdFsgXFx0XSpcblx0XHRcdFx0XHQoPzpbKistXXxcXGQrWy5dKVsgXFx0XStcblx0XHRcdFx0KVxuXHRcdFx0KVxuXHRcdCkvZ1xuXHQqL1xuXHR2YXIgd2hvbGVfbGlzdCA9IC9eKChbIF17MCwzfShbKistXXxcXGQrWy5dKVsgXFx0XSspW15cXHJdKz8ofjB8XFxuezIsfSg/PVxcUykoPyFbIFxcdF0qKD86WyorLV18XFxkK1suXSlbIFxcdF0rKSkpL2dtO1xuXG5cdGlmIChnX2xpc3RfbGV2ZWwpIHtcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHdob2xlX2xpc3QsZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGxpc3QgPSBtMTtcblx0XHRcdHZhciBsaXN0X3R5cGUgPSAobTIuc2VhcmNoKC9bKistXS9nKT4tMSkgPyBcInVsXCIgOiBcIm9sXCI7XG5cblx0XHRcdC8vIFR1cm4gZG91YmxlIHJldHVybnMgaW50byB0cmlwbGUgcmV0dXJucywgc28gdGhhdCB3ZSBjYW4gbWFrZSBhXG5cdFx0XHQvLyBwYXJhZ3JhcGggZm9yIHRoZSBsYXN0IGl0ZW0gaW4gYSBsaXN0LCBpZiBuZWNlc3Nhcnk6XG5cdFx0XHRsaXN0ID0gbGlzdC5yZXBsYWNlKC9cXG57Mix9L2csXCJcXG5cXG5cXG5cIik7O1xuXHRcdFx0dmFyIHJlc3VsdCA9IF9Qcm9jZXNzTGlzdEl0ZW1zKGxpc3QpO1xuXG5cdFx0XHQvLyBUcmltIGFueSB0cmFpbGluZyB3aGl0ZXNwYWNlLCB0byBwdXQgdGhlIGNsb3NpbmcgYDwvJGxpc3RfdHlwZT5gXG5cdFx0XHQvLyB1cCBvbiB0aGUgcHJlY2VkaW5nIGxpbmUsIHRvIGdldCBpdCBwYXN0IHRoZSBjdXJyZW50IHN0dXBpZFxuXHRcdFx0Ly8gSFRNTCBibG9jayBwYXJzZXIuIFRoaXMgaXMgYSBoYWNrIHRvIHdvcmsgYXJvdW5kIHRoZSB0ZXJyaWJsZVxuXHRcdFx0Ly8gaGFjayB0aGF0IGlzIHRoZSBIVE1MIGJsb2NrIHBhcnNlci5cblx0XHRcdHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC9cXHMrJC8sXCJcIik7XG5cdFx0XHRyZXN1bHQgPSBcIjxcIitsaXN0X3R5cGUrXCI+XCIgKyByZXN1bHQgKyBcIjwvXCIrbGlzdF90eXBlK1wiPlxcblwiO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR3aG9sZV9saXN0ID0gLyhcXG5cXG58Xlxcbj8pKChbIF17MCwzfShbKistXXxcXGQrWy5dKVsgXFx0XSspW15cXHJdKz8ofjB8XFxuezIsfSg/PVxcUykoPyFbIFxcdF0qKD86WyorLV18XFxkK1suXSlbIFxcdF0rKSkpL2c7XG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSh3aG9sZV9saXN0LGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMpIHtcblx0XHRcdHZhciBydW51cCA9IG0xO1xuXHRcdFx0dmFyIGxpc3QgPSBtMjtcblxuXHRcdFx0dmFyIGxpc3RfdHlwZSA9IChtMy5zZWFyY2goL1sqKy1dL2cpPi0xKSA/IFwidWxcIiA6IFwib2xcIjtcblx0XHRcdC8vIFR1cm4gZG91YmxlIHJldHVybnMgaW50byB0cmlwbGUgcmV0dXJucywgc28gdGhhdCB3ZSBjYW4gbWFrZSBhXG5cdFx0XHQvLyBwYXJhZ3JhcGggZm9yIHRoZSBsYXN0IGl0ZW0gaW4gYSBsaXN0LCBpZiBuZWNlc3Nhcnk6XG5cdFx0XHR2YXIgbGlzdCA9IGxpc3QucmVwbGFjZSgvXFxuezIsfS9nLFwiXFxuXFxuXFxuXCIpOztcblx0XHRcdHZhciByZXN1bHQgPSBfUHJvY2Vzc0xpc3RJdGVtcyhsaXN0KTtcblx0XHRcdHJlc3VsdCA9IHJ1bnVwICsgXCI8XCIrbGlzdF90eXBlK1wiPlxcblwiICsgcmVzdWx0ICsgXCI8L1wiK2xpc3RfdHlwZStcIj5cXG5cIjtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wLyxcIlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuX1Byb2Nlc3NMaXN0SXRlbXMgPSBmdW5jdGlvbihsaXN0X3N0cikge1xuLy9cbi8vICBQcm9jZXNzIHRoZSBjb250ZW50cyBvZiBhIHNpbmdsZSBvcmRlcmVkIG9yIHVub3JkZXJlZCBsaXN0LCBzcGxpdHRpbmcgaXRcbi8vICBpbnRvIGluZGl2aWR1YWwgbGlzdCBpdGVtcy5cbi8vXG5cdC8vIFRoZSAkZ19saXN0X2xldmVsIGdsb2JhbCBrZWVwcyB0cmFjayBvZiB3aGVuIHdlJ3JlIGluc2lkZSBhIGxpc3QuXG5cdC8vIEVhY2ggdGltZSB3ZSBlbnRlciBhIGxpc3QsIHdlIGluY3JlbWVudCBpdDsgd2hlbiB3ZSBsZWF2ZSBhIGxpc3QsXG5cdC8vIHdlIGRlY3JlbWVudC4gSWYgaXQncyB6ZXJvLCB3ZSdyZSBub3QgaW4gYSBsaXN0IGFueW1vcmUuXG5cdC8vXG5cdC8vIFdlIGRvIHRoaXMgYmVjYXVzZSB3aGVuIHdlJ3JlIG5vdCBpbnNpZGUgYSBsaXN0LCB3ZSB3YW50IHRvIHRyZWF0XG5cdC8vIHNvbWV0aGluZyBsaWtlIHRoaXM6XG5cdC8vXG5cdC8vICAgIEkgcmVjb21tZW5kIHVwZ3JhZGluZyB0byB2ZXJzaW9uXG5cdC8vICAgIDguIE9vcHMsIG5vdyB0aGlzIGxpbmUgaXMgdHJlYXRlZFxuXHQvLyAgICBhcyBhIHN1Yi1saXN0LlxuXHQvL1xuXHQvLyBBcyBhIHNpbmdsZSBwYXJhZ3JhcGgsIGRlc3BpdGUgdGhlIGZhY3QgdGhhdCB0aGUgc2Vjb25kIGxpbmUgc3RhcnRzXG5cdC8vIHdpdGggYSBkaWdpdC1wZXJpb2Qtc3BhY2Ugc2VxdWVuY2UuXG5cdC8vXG5cdC8vIFdoZXJlYXMgd2hlbiB3ZSdyZSBpbnNpZGUgYSBsaXN0IChvciBzdWItbGlzdCksIHRoYXQgbGluZSB3aWxsIGJlXG5cdC8vIHRyZWF0ZWQgYXMgdGhlIHN0YXJ0IG9mIGEgc3ViLWxpc3QuIFdoYXQgYSBrbHVkZ2UsIGh1aD8gVGhpcyBpc1xuXHQvLyBhbiBhc3BlY3Qgb2YgTWFya2Rvd24ncyBzeW50YXggdGhhdCdzIGhhcmQgdG8gcGFyc2UgcGVyZmVjdGx5XG5cdC8vIHdpdGhvdXQgcmVzb3J0aW5nIHRvIG1pbmQtcmVhZGluZy4gUGVyaGFwcyB0aGUgc29sdXRpb24gaXMgdG9cblx0Ly8gY2hhbmdlIHRoZSBzeW50YXggcnVsZXMgc3VjaCB0aGF0IHN1Yi1saXN0cyBtdXN0IHN0YXJ0IHdpdGggYVxuXHQvLyBzdGFydGluZyBjYXJkaW5hbCBudW1iZXI7IGUuZy4gXCIxLlwiIG9yIFwiYS5cIi5cblxuXHRnX2xpc3RfbGV2ZWwrKztcblxuXHQvLyB0cmltIHRyYWlsaW5nIGJsYW5rIGxpbmVzOlxuXHRsaXN0X3N0ciA9IGxpc3Rfc3RyLnJlcGxhY2UoL1xcbnsyLH0kLyxcIlxcblwiKTtcblxuXHQvLyBhdHRhY2tsYWI6IGFkZCBzZW50aW5lbCB0byBlbXVsYXRlIFxcelxuXHRsaXN0X3N0ciArPSBcIn4wXCI7XG5cblx0Lypcblx0XHRsaXN0X3N0ciA9IGxpc3Rfc3RyLnJlcGxhY2UoL1xuXHRcdFx0KFxcbik/XHRcdFx0XHRcdFx0XHQvLyBsZWFkaW5nIGxpbmUgPSAkMVxuXHRcdFx0KF5bIFxcdF0qKVx0XHRcdFx0XHRcdC8vIGxlYWRpbmcgd2hpdGVzcGFjZSA9ICQyXG5cdFx0XHQoWyorLV18XFxkK1suXSkgWyBcXHRdK1x0XHRcdC8vIGxpc3QgbWFya2VyID0gJDNcblx0XHRcdChbXlxccl0rP1x0XHRcdFx0XHRcdC8vIGxpc3QgaXRlbSB0ZXh0ICAgPSAkNFxuXHRcdFx0KFxcbnsxLDJ9KSlcblx0XHRcdCg/PSBcXG4qICh+MCB8IFxcMiAoWyorLV18XFxkK1suXSkgWyBcXHRdKykpXG5cdFx0L2dtLCBmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXHRsaXN0X3N0ciA9IGxpc3Rfc3RyLnJlcGxhY2UoLyhcXG4pPyheWyBcXHRdKikoWyorLV18XFxkK1suXSlbIFxcdF0rKFteXFxyXSs/KFxcbnsxLDJ9KSkoPz1cXG4qKH4wfFxcMihbKistXXxcXGQrWy5dKVsgXFx0XSspKS9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00KXtcblx0XHRcdHZhciBpdGVtID0gbTQ7XG5cdFx0XHR2YXIgbGVhZGluZ19saW5lID0gbTE7XG5cdFx0XHR2YXIgbGVhZGluZ19zcGFjZSA9IG0yO1xuXG5cdFx0XHRpZiAobGVhZGluZ19saW5lIHx8IChpdGVtLnNlYXJjaCgvXFxuezIsfS8pPi0xKSkge1xuXHRcdFx0XHRpdGVtID0gX1J1bkJsb2NrR2FtdXQoX091dGRlbnQoaXRlbSkpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIFJlY3Vyc2lvbiBmb3Igc3ViLWxpc3RzOlxuXHRcdFx0XHRpdGVtID0gX0RvTGlzdHMoX091dGRlbnQoaXRlbSkpO1xuXHRcdFx0XHRpdGVtID0gaXRlbS5yZXBsYWNlKC9cXG4kLyxcIlwiKTsgLy8gY2hvbXAoaXRlbSlcblx0XHRcdFx0aXRlbSA9IF9SdW5TcGFuR2FtdXQoaXRlbSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAgXCI8bGk+XCIgKyBpdGVtICsgXCI8L2xpPlxcblwiO1xuXHRcdH1cblx0KTtcblxuXHQvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG5cdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvfjAvZyxcIlwiKTtcblxuXHRnX2xpc3RfbGV2ZWwtLTtcblx0cmV0dXJuIGxpc3Rfc3RyO1xufVxuXG5cbnZhciBfRG9Db2RlQmxvY2tzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vICBQcm9jZXNzIE1hcmtkb3duIGA8cHJlPjxjb2RlPmAgYmxvY2tzLlxuLy9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UodGV4dCxcblx0XHRcdC8oPzpcXG5cXG58Xilcblx0XHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gJDEgPSB0aGUgY29kZSBibG9jayAtLSBvbmUgb3IgbW9yZSBsaW5lcywgc3RhcnRpbmcgd2l0aCBhIHNwYWNlL3RhYlxuXHRcdFx0XHQoPzpcblx0XHRcdFx0XHQoPzpbIF17NH18XFx0KVx0XHRcdC8vIExpbmVzIG11c3Qgc3RhcnQgd2l0aCBhIHRhYiBvciBhIHRhYi13aWR0aCBvZiBzcGFjZXMgLSBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cdFx0XHRcdFx0LipcXG4rXG5cdFx0XHRcdCkrXG5cdFx0XHQpXG5cdFx0XHQoXFxuKlsgXXswLDN9W14gXFx0XFxuXXwoPz1+MCkpXHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cdFx0L2csZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblxuXHQvLyBhdHRhY2tsYWI6IHNlbnRpbmVsIHdvcmthcm91bmRzIGZvciBsYWNrIG9mIFxcQSBhbmQgXFxaLCBzYWZhcmlcXGtodG1sIGJ1Z1xuXHR0ZXh0ICs9IFwifjBcIjtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oPzpcXG5cXG58XikoKD86KD86WyBdezR9fFxcdCkuKlxcbispKykoXFxuKlsgXXswLDN9W14gXFx0XFxuXXwoPz1+MCkpL2csXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGNvZGVibG9jayA9IG0xO1xuXHRcdFx0dmFyIG5leHRDaGFyID0gbTI7XG5cblx0XHRcdGNvZGVibG9jayA9IF9FbmNvZGVDb2RlKCBfT3V0ZGVudChjb2RlYmxvY2spKTtcblx0XHRcdGNvZGVibG9jayA9IF9EZXRhYihjb2RlYmxvY2spO1xuXHRcdFx0Y29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL15cXG4rL2csXCJcIik7IC8vIHRyaW0gbGVhZGluZyBuZXdsaW5lc1xuXHRcdFx0Y29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL1xcbiskL2csXCJcIik7IC8vIHRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG5cdFx0XHRjb2RlYmxvY2sgPSBcIjxwcmU+PGNvZGU+XCIgKyBjb2RlYmxvY2sgKyBcIlxcbjwvY29kZT48L3ByZT5cIjtcblxuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhjb2RlYmxvY2spICsgbmV4dENoYXI7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufTtcblxudmFyIF9Eb0dpdGh1YkNvZGVCbG9ja3MgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gIFByb2Nlc3MgR2l0aHViLXN0eWxlIGNvZGUgYmxvY2tzXG4vLyAgRXhhbXBsZTpcbi8vICBgYGBydWJ5XG4vLyAgZGVmIGhlbGxvX3dvcmxkKHgpXG4vLyAgICBwdXRzIFwiSGVsbG8sICN7eH1cIlxuLy8gIGVuZFxuLy8gIGBgYFxuLy9cblxuXG5cdC8vIGF0dGFja2xhYjogc2VudGluZWwgd29ya2Fyb3VuZHMgZm9yIGxhY2sgb2YgXFxBIGFuZCBcXFosIHNhZmFyaVxca2h0bWwgYnVnXG5cdHRleHQgKz0gXCJ+MFwiO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg/Ol58XFxuKWBgYCguKilcXG4oW1xcc1xcU10qPylcXG5gYGAvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgbGFuZ3VhZ2UgPSBtMTtcblx0XHRcdHZhciBjb2RlYmxvY2sgPSBtMjtcblxuXHRcdFx0Y29kZWJsb2NrID0gX0VuY29kZUNvZGUoY29kZWJsb2NrKTtcblx0XHRcdGNvZGVibG9jayA9IF9EZXRhYihjb2RlYmxvY2spO1xuXHRcdFx0Y29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL15cXG4rL2csXCJcIik7IC8vIHRyaW0gbGVhZGluZyBuZXdsaW5lc1xuXHRcdFx0Y29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL1xcbiskL2csXCJcIik7IC8vIHRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG5cdFx0XHRjb2RlYmxvY2sgPSBcIjxwcmU+PGNvZGVcIiArIChsYW5ndWFnZSA/IFwiIGNsYXNzPVxcXCJcIiArIGxhbmd1YWdlICsgJ1wiJyA6IFwiXCIpICsgXCI+XCIgKyBjb2RlYmxvY2sgKyBcIlxcbjwvY29kZT48L3ByZT5cIjtcblxuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhjb2RlYmxvY2spO1xuXHRcdH1cblx0KTtcblxuXHQvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wLyxcIlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIGhhc2hCbG9jayA9IGZ1bmN0aW9uKHRleHQpIHtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKF5cXG4rfFxcbiskKS9nLFwiXCIpO1xuXHRyZXR1cm4gXCJcXG5cXG5+S1wiICsgKGdfaHRtbF9ibG9ja3MucHVzaCh0ZXh0KS0xKSArIFwiS1xcblxcblwiO1xufVxuXG52YXIgX0RvQ29kZVNwYW5zID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vICAgKiAgQmFja3RpY2sgcXVvdGVzIGFyZSB1c2VkIGZvciA8Y29kZT48L2NvZGU+IHNwYW5zLlxuLy9cbi8vICAgKiAgWW91IGNhbiB1c2UgbXVsdGlwbGUgYmFja3RpY2tzIGFzIHRoZSBkZWxpbWl0ZXJzIGlmIHlvdSB3YW50IHRvXG4vL1x0IGluY2x1ZGUgbGl0ZXJhbCBiYWNrdGlja3MgaW4gdGhlIGNvZGUgc3Bhbi4gU28sIHRoaXMgaW5wdXQ6XG4vL1xuLy9cdFx0IEp1c3QgdHlwZSBgYGZvbyBgYmFyYCBiYXpgYCBhdCB0aGUgcHJvbXB0LlxuLy9cbi8vXHQgICBXaWxsIHRyYW5zbGF0ZSB0bzpcbi8vXG4vL1x0XHQgPHA+SnVzdCB0eXBlIDxjb2RlPmZvbyBgYmFyYCBiYXo8L2NvZGU+IGF0IHRoZSBwcm9tcHQuPC9wPlxuLy9cbi8vXHRUaGVyZSdzIG5vIGFyYml0cmFyeSBsaW1pdCB0byB0aGUgbnVtYmVyIG9mIGJhY2t0aWNrcyB5b3Vcbi8vXHRjYW4gdXNlIGFzIGRlbGltdGVycy4gSWYgeW91IG5lZWQgdGhyZWUgY29uc2VjdXRpdmUgYmFja3RpY2tzXG4vL1x0aW4geW91ciBjb2RlLCB1c2UgZm91ciBmb3IgZGVsaW1pdGVycywgZXRjLlxuLy9cbi8vICAqICBZb3UgY2FuIHVzZSBzcGFjZXMgdG8gZ2V0IGxpdGVyYWwgYmFja3RpY2tzIGF0IHRoZSBlZGdlczpcbi8vXG4vL1x0XHQgLi4uIHR5cGUgYGAgYGJhcmAgYGAgLi4uXG4vL1xuLy9cdCAgIFR1cm5zIHRvOlxuLy9cbi8vXHRcdCAuLi4gdHlwZSA8Y29kZT5gYmFyYDwvY29kZT4gLi4uXG4vL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHQoXnxbXlxcXFxdKVx0XHRcdFx0XHQvLyBDaGFyYWN0ZXIgYmVmb3JlIG9wZW5pbmcgYCBjYW4ndCBiZSBhIGJhY2tzbGFzaFxuXHRcdFx0KGArKVx0XHRcdFx0XHRcdC8vICQyID0gT3BlbmluZyBydW4gb2YgYFxuXHRcdFx0KFx0XHRcdFx0XHRcdFx0Ly8gJDMgPSBUaGUgY29kZSBibG9ja1xuXHRcdFx0XHRbXlxccl0qP1xuXHRcdFx0XHRbXmBdXHRcdFx0XHRcdC8vIGF0dGFja2xhYjogd29yayBhcm91bmQgbGFjayBvZiBsb29rYmVoaW5kXG5cdFx0XHQpXG5cdFx0XHRcXDJcdFx0XHRcdFx0XHRcdC8vIE1hdGNoaW5nIGNsb3NlclxuXHRcdFx0KD8hYClcblx0XHQvZ20sIGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKF58W15cXFxcXSkoYCspKFteXFxyXSo/W15gXSlcXDIoPyFgKS9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00KSB7XG5cdFx0XHR2YXIgYyA9IG0zO1xuXHRcdFx0YyA9IGMucmVwbGFjZSgvXihbIFxcdF0qKS9nLFwiXCIpO1x0Ly8gbGVhZGluZyB3aGl0ZXNwYWNlXG5cdFx0XHRjID0gYy5yZXBsYWNlKC9bIFxcdF0qJC9nLFwiXCIpO1x0Ly8gdHJhaWxpbmcgd2hpdGVzcGFjZVxuXHRcdFx0YyA9IF9FbmNvZGVDb2RlKGMpO1xuXHRcdFx0cmV0dXJuIG0xK1wiPGNvZGU+XCIrYytcIjwvY29kZT5cIjtcblx0XHR9KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIF9FbmNvZGVDb2RlID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIEVuY29kZS9lc2NhcGUgY2VydGFpbiBjaGFyYWN0ZXJzIGluc2lkZSBNYXJrZG93biBjb2RlIHJ1bnMuXG4vLyBUaGUgcG9pbnQgaXMgdGhhdCBpbiBjb2RlLCB0aGVzZSBjaGFyYWN0ZXJzIGFyZSBsaXRlcmFscyxcbi8vIGFuZCBsb3NlIHRoZWlyIHNwZWNpYWwgTWFya2Rvd24gbWVhbmluZ3MuXG4vL1xuXHQvLyBFbmNvZGUgYWxsIGFtcGVyc2FuZHM7IEhUTUwgZW50aXRpZXMgYXJlIG5vdFxuXHQvLyBlbnRpdGllcyB3aXRoaW4gYSBNYXJrZG93biBjb2RlIHNwYW4uXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyYvZyxcIiZhbXA7XCIpO1xuXG5cdC8vIERvIHRoZSBhbmdsZSBicmFja2V0IHNvbmcgYW5kIGRhbmNlOlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88L2csXCImbHQ7XCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8+L2csXCImZ3Q7XCIpO1xuXG5cdC8vIE5vdywgZXNjYXBlIGNoYXJhY3RlcnMgdGhhdCBhcmUgbWFnaWMgaW4gTWFya2Rvd246XG5cdHRleHQgPSBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsXCJcXCpfe31bXVxcXFxcIixmYWxzZSk7XG5cbi8vIGpqIHRoZSBsaW5lIGFib3ZlIGJyZWFrcyB0aGlzOlxuLy8tLS1cblxuLy8qIEl0ZW1cblxuLy8gICAxLiBTdWJpdGVtXG5cbi8vICAgICAgICAgICAgc3BlY2lhbCBjaGFyOiAqXG4vLy0tLVxuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRG9JdGFsaWNzQW5kQm9sZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHQvLyA8c3Ryb25nPiBtdXN0IGdvIGZpcnN0OlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFwqXFwqfF9fKSg/PVxcUykoW15cXHJdKj9cXFNbKl9dKilcXDEvZyxcblx0XHRcIjxzdHJvbmc+JDI8L3N0cm9uZz5cIik7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcKnxfKSg/PVxcUykoW15cXHJdKj9cXFMpXFwxL2csXG5cdFx0XCI8ZW0+JDI8L2VtPlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0RvQmxvY2tRdW90ZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0XHRcdC8vIFdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdChcblx0XHRcdFx0XlsgXFx0XSo+WyBcXHRdP1x0XHRcdC8vICc+JyBhdCB0aGUgc3RhcnQgb2YgYSBsaW5lXG5cdFx0XHRcdC4rXFxuXHRcdFx0XHRcdC8vIHJlc3Qgb2YgdGhlIGZpcnN0IGxpbmVcblx0XHRcdFx0KC4rXFxuKSpcdFx0XHRcdFx0Ly8gc3Vic2VxdWVudCBjb25zZWN1dGl2ZSBsaW5lc1xuXHRcdFx0XHRcXG4qXHRcdFx0XHRcdFx0Ly8gYmxhbmtzXG5cdFx0XHQpK1xuXHRcdClcblx0XHQvZ20sIGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKCheWyBcXHRdKj5bIFxcdF0/LitcXG4oLitcXG4pKlxcbiopKykvZ20sXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHRcdFx0dmFyIGJxID0gbTE7XG5cblx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1Zzpcblx0XHRcdC8vIFwiLS0tLS0tLS0tLWJ1Z1wiLnJlcGxhY2UoL14tL2csXCJcIikgPT0gXCJidWdcIlxuXG5cdFx0XHRicSA9IGJxLnJlcGxhY2UoL15bIFxcdF0qPlsgXFx0XT8vZ20sXCJ+MFwiKTtcdC8vIHRyaW0gb25lIGxldmVsIG9mIHF1b3RpbmdcblxuXHRcdFx0Ly8gYXR0YWNrbGFiOiBjbGVhbiB1cCBoYWNrXG5cdFx0XHRicSA9IGJxLnJlcGxhY2UoL34wL2csXCJcIik7XG5cblx0XHRcdGJxID0gYnEucmVwbGFjZSgvXlsgXFx0XSskL2dtLFwiXCIpO1x0XHQvLyB0cmltIHdoaXRlc3BhY2Utb25seSBsaW5lc1xuXHRcdFx0YnEgPSBfUnVuQmxvY2tHYW11dChicSk7XHRcdFx0XHQvLyByZWN1cnNlXG5cblx0XHRcdGJxID0gYnEucmVwbGFjZSgvKF58XFxuKS9nLFwiJDEgIFwiKTtcblx0XHRcdC8vIFRoZXNlIGxlYWRpbmcgc3BhY2VzIHNjcmV3IHdpdGggPHByZT4gY29udGVudCwgc28gd2UgbmVlZCB0byBmaXggdGhhdDpcblx0XHRcdGJxID0gYnEucmVwbGFjZShcblx0XHRcdFx0XHQvKFxccyo8cHJlPlteXFxyXSs/PFxcL3ByZT4pL2dtLFxuXHRcdFx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHRcdFx0dmFyIHByZSA9IG0xO1xuXHRcdFx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1Zzpcblx0XHRcdFx0XHRwcmUgPSBwcmUucmVwbGFjZSgvXiAgL21nLFwifjBcIik7XG5cdFx0XHRcdFx0cHJlID0gcHJlLnJlcGxhY2UoL34wL2csXCJcIik7XG5cdFx0XHRcdFx0cmV0dXJuIHByZTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBoYXNoQmxvY2soXCI8YmxvY2txdW90ZT5cXG5cIiArIGJxICsgXCJcXG48L2Jsb2NrcXVvdGU+XCIpO1xuXHRcdH0pO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0Zvcm1QYXJhZ3JhcGhzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vICBQYXJhbXM6XG4vLyAgICAkdGV4dCAtIHN0cmluZyB0byBwcm9jZXNzIHdpdGggaHRtbCA8cD4gdGFnc1xuLy9cblxuXHQvLyBTdHJpcCBsZWFkaW5nIGFuZCB0cmFpbGluZyBsaW5lczpcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlxcbisvZyxcIlwiKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTtcblxuXHR2YXIgZ3JhZnMgPSB0ZXh0LnNwbGl0KC9cXG57Mix9L2cpO1xuXHR2YXIgZ3JhZnNPdXQgPSBuZXcgQXJyYXkoKTtcblxuXHQvL1xuXHQvLyBXcmFwIDxwPiB0YWdzLlxuXHQvL1xuXHR2YXIgZW5kID0gZ3JhZnMubGVuZ3RoO1xuXHRmb3IgKHZhciBpPTA7IGk8ZW5kOyBpKyspIHtcblx0XHR2YXIgc3RyID0gZ3JhZnNbaV07XG5cblx0XHQvLyBpZiB0aGlzIGlzIGFuIEhUTUwgbWFya2VyLCBjb3B5IGl0XG5cdFx0aWYgKHN0ci5zZWFyY2goL35LKFxcZCspSy9nKSA+PSAwKSB7XG5cdFx0XHRncmFmc091dC5wdXNoKHN0cik7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHN0ci5zZWFyY2goL1xcUy8pID49IDApIHtcblx0XHRcdHN0ciA9IF9SdW5TcGFuR2FtdXQoc3RyKTtcblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC9eKFsgXFx0XSopL2csXCI8cD5cIik7XG5cdFx0XHRzdHIgKz0gXCI8L3A+XCJcblx0XHRcdGdyYWZzT3V0LnB1c2goc3RyKTtcblx0XHR9XG5cblx0fVxuXG5cdC8vXG5cdC8vIFVuaGFzaGlmeSBIVE1MIGJsb2Nrc1xuXHQvL1xuXHRlbmQgPSBncmFmc091dC5sZW5ndGg7XG5cdGZvciAodmFyIGk9MDsgaTxlbmQ7IGkrKykge1xuXHRcdC8vIGlmIHRoaXMgaXMgYSBtYXJrZXIgZm9yIGFuIGh0bWwgYmxvY2suLi5cblx0XHR3aGlsZSAoZ3JhZnNPdXRbaV0uc2VhcmNoKC9+SyhcXGQrKUsvKSA+PSAwKSB7XG5cdFx0XHR2YXIgYmxvY2tUZXh0ID0gZ19odG1sX2Jsb2Nrc1tSZWdFeHAuJDFdO1xuXHRcdFx0YmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL1xcJC9nLFwiJCQkJFwiKTsgLy8gRXNjYXBlIGFueSBkb2xsYXIgc2lnbnNcblx0XHRcdGdyYWZzT3V0W2ldID0gZ3JhZnNPdXRbaV0ucmVwbGFjZSgvfktcXGQrSy8sYmxvY2tUZXh0KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZ3JhZnNPdXQuam9pbihcIlxcblxcblwiKTtcbn1cblxuXG52YXIgX0VuY29kZUFtcHNBbmRBbmdsZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vLyBTbWFydCBwcm9jZXNzaW5nIGZvciBhbXBlcnNhbmRzIGFuZCBhbmdsZSBicmFja2V0cyB0aGF0IG5lZWQgdG8gYmUgZW5jb2RlZC5cblxuXHQvLyBBbXBlcnNhbmQtZW5jb2RpbmcgYmFzZWQgZW50aXJlbHkgb24gTmF0IElyb25zJ3MgQW1wdXRhdG9yIE1UIHBsdWdpbjpcblx0Ly8gICBodHRwOi8vYnVtcHBvLm5ldC9wcm9qZWN0cy9hbXB1dGF0b3IvXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyYoPyEjP1t4WF0/KD86WzAtOWEtZkEtRl0rfFxcdyspOykvZyxcIiZhbXA7XCIpO1xuXG5cdC8vIEVuY29kZSBuYWtlZCA8J3Ncblx0dGV4dCA9IHRleHQucmVwbGFjZSgvPCg/IVthLXpcXC8/XFwkIV0pL2dpLFwiJmx0O1wiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0VuY29kZUJhY2tzbGFzaEVzY2FwZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gICBQYXJhbWV0ZXI6ICBTdHJpbmcuXG4vLyAgIFJldHVybnM6XHRUaGUgc3RyaW5nLCB3aXRoIGFmdGVyIHByb2Nlc3NpbmcgdGhlIGZvbGxvd2luZyBiYWNrc2xhc2hcbi8vXHRcdFx0ICAgZXNjYXBlIHNlcXVlbmNlcy5cbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiBUaGUgcG9saXRlIHdheSB0byBkbyB0aGlzIGlzIHdpdGggdGhlIG5ld1xuXHQvLyBlc2NhcGVDaGFyYWN0ZXJzKCkgZnVuY3Rpb246XG5cdC8vXG5cdC8vIFx0dGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcIlxcXFxcIix0cnVlKTtcblx0Ly8gXHR0ZXh0ID0gZXNjYXBlQ2hhcmFjdGVycyh0ZXh0LFwiYCpfe31bXSgpPiMrLS4hXCIsdHJ1ZSk7XG5cdC8vXG5cdC8vIC4uLmJ1dCB3ZSdyZSBzaWRlc3RlcHBpbmcgaXRzIHVzZSBvZiB0aGUgKHNsb3cpIFJlZ0V4cCBjb25zdHJ1Y3RvclxuXHQvLyBhcyBhbiBvcHRpbWl6YXRpb24gZm9yIEZpcmVmb3guICBUaGlzIGZ1bmN0aW9uIGdldHMgY2FsbGVkIGEgTE9ULlxuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcXFwoXFxcXCkvZyxlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxcXChbYCpfe31cXFtcXF0oKT4jKy0uIV0pL2csZXNjYXBlQ2hhcmFjdGVyc19jYWxsYmFjayk7XG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRG9BdXRvTGlua3MgPSBmdW5jdGlvbih0ZXh0KSB7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvPCgoaHR0cHM/fGZ0cHxkaWN0KTpbXidcIj5cXHNdKyk+L2dpLFwiPGEgaHJlZj1cXFwiJDFcXFwiPiQxPC9hPlwiKTtcblxuXHQvLyBFbWFpbCBhZGRyZXNzZXM6IDxhZGRyZXNzQGRvbWFpbi5mb28+XG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHRcdDxcblx0XHRcdCg/Om1haWx0bzopP1xuXHRcdFx0KFxuXHRcdFx0XHRbLS5cXHddK1xuXHRcdFx0XHRcXEBcblx0XHRcdFx0Wy1hLXowLTldKyhcXC5bLWEtejAtOV0rKSpcXC5bYS16XStcblx0XHRcdClcblx0XHRcdD5cblx0XHQvZ2ksIF9Eb0F1dG9MaW5rc19jYWxsYmFjaygpKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvPCg/Om1haWx0bzopPyhbLS5cXHddK1xcQFstYS16MC05XSsoXFwuWy1hLXowLTldKykqXFwuW2Etel0rKT4vZ2ksXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHRcdFx0cmV0dXJuIF9FbmNvZGVFbWFpbEFkZHJlc3MoIF9VbmVzY2FwZVNwZWNpYWxDaGFycyhtMSkgKTtcblx0XHR9XG5cdCk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9FbmNvZGVFbWFpbEFkZHJlc3MgPSBmdW5jdGlvbihhZGRyKSB7XG4vL1xuLy8gIElucHV0OiBhbiBlbWFpbCBhZGRyZXNzLCBlLmcuIFwiZm9vQGV4YW1wbGUuY29tXCJcbi8vXG4vLyAgT3V0cHV0OiB0aGUgZW1haWwgYWRkcmVzcyBhcyBhIG1haWx0byBsaW5rLCB3aXRoIGVhY2ggY2hhcmFjdGVyXG4vL1x0b2YgdGhlIGFkZHJlc3MgZW5jb2RlZCBhcyBlaXRoZXIgYSBkZWNpbWFsIG9yIGhleCBlbnRpdHksIGluXG4vL1x0dGhlIGhvcGVzIG9mIGZvaWxpbmcgbW9zdCBhZGRyZXNzIGhhcnZlc3Rpbmcgc3BhbSBib3RzLiBFLmcuOlxuLy9cbi8vXHQ8YSBocmVmPVwiJiN4NkQ7JiM5NzsmIzEwNTsmIzEwODsmI3g3NDsmIzExMTs6JiMxMDI7JiMxMTE7JiMxMTE7JiM2NDsmIzEwMTtcbi8vXHQgICB4JiN4NjE7JiMxMDk7JiN4NzA7JiMxMDg7JiN4NjU7JiN4MkU7JiM5OTsmIzExMTsmIzEwOTtcIj4mIzEwMjsmIzExMTsmIzExMTtcbi8vXHQgICAmIzY0OyYjMTAxO3gmI3g2MTsmIzEwOTsmI3g3MDsmIzEwODsmI3g2NTsmI3gyRTsmIzk5OyYjMTExOyYjMTA5OzwvYT5cbi8vXG4vLyAgQmFzZWQgb24gYSBmaWx0ZXIgYnkgTWF0dGhldyBXaWNrbGluZSwgcG9zdGVkIHRvIHRoZSBCQkVkaXQtVGFsa1xuLy8gIG1haWxpbmcgbGlzdDogPGh0dHA6Ly90aW55dXJsLmNvbS95dTd1ZT5cbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiB3aHkgY2FuJ3QgamF2YXNjcmlwdCBzcGVhayBoZXg/XG5cdGZ1bmN0aW9uIGNoYXIyaGV4KGNoKSB7XG5cdFx0dmFyIGhleERpZ2l0cyA9ICcwMTIzNDU2Nzg5QUJDREVGJztcblx0XHR2YXIgZGVjID0gY2guY2hhckNvZGVBdCgwKTtcblx0XHRyZXR1cm4oaGV4RGlnaXRzLmNoYXJBdChkZWM+PjQpICsgaGV4RGlnaXRzLmNoYXJBdChkZWMmMTUpKTtcblx0fVxuXG5cdHZhciBlbmNvZGUgPSBbXG5cdFx0ZnVuY3Rpb24oY2gpe3JldHVybiBcIiYjXCIrY2guY2hhckNvZGVBdCgwKStcIjtcIjt9LFxuXHRcdGZ1bmN0aW9uKGNoKXtyZXR1cm4gXCImI3hcIitjaGFyMmhleChjaCkrXCI7XCI7fSxcblx0XHRmdW5jdGlvbihjaCl7cmV0dXJuIGNoO31cblx0XTtcblxuXHRhZGRyID0gXCJtYWlsdG86XCIgKyBhZGRyO1xuXG5cdGFkZHIgPSBhZGRyLnJlcGxhY2UoLy4vZywgZnVuY3Rpb24oY2gpIHtcblx0XHRpZiAoY2ggPT0gXCJAXCIpIHtcblx0XHQgICBcdC8vIHRoaXMgKm11c3QqIGJlIGVuY29kZWQuIEkgaW5zaXN0LlxuXHRcdFx0Y2ggPSBlbmNvZGVbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjIpXShjaCk7XG5cdFx0fSBlbHNlIGlmIChjaCAhPVwiOlwiKSB7XG5cdFx0XHQvLyBsZWF2ZSAnOicgYWxvbmUgKHRvIHNwb3QgbWFpbHRvOiBsYXRlcilcblx0XHRcdHZhciByID0gTWF0aC5yYW5kb20oKTtcblx0XHRcdC8vIHJvdWdobHkgMTAlIHJhdywgNDUlIGhleCwgNDUlIGRlY1xuXHRcdFx0Y2ggPSAgKFxuXHRcdFx0XHRcdHIgPiAuOSAgP1x0ZW5jb2RlWzJdKGNoKSAgIDpcblx0XHRcdFx0XHRyID4gLjQ1ID9cdGVuY29kZVsxXShjaCkgICA6XG5cdFx0XHRcdFx0XHRcdFx0ZW5jb2RlWzBdKGNoKVxuXHRcdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gY2g7XG5cdH0pO1xuXG5cdGFkZHIgPSBcIjxhIGhyZWY9XFxcIlwiICsgYWRkciArIFwiXFxcIj5cIiArIGFkZHIgKyBcIjwvYT5cIjtcblx0YWRkciA9IGFkZHIucmVwbGFjZSgvXCI+Lis6L2csXCJcXFwiPlwiKTsgLy8gc3RyaXAgdGhlIG1haWx0bzogZnJvbSB0aGUgdmlzaWJsZSBwYXJ0XG5cblx0cmV0dXJuIGFkZHI7XG59XG5cblxudmFyIF9VbmVzY2FwZVNwZWNpYWxDaGFycyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBTd2FwIGJhY2sgaW4gYWxsIHRoZSBzcGVjaWFsIGNoYXJhY3RlcnMgd2UndmUgaGlkZGVuLlxuLy9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkUoXFxkKylFL2csXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHRcdFx0dmFyIGNoYXJDb2RlVG9SZXBsYWNlID0gcGFyc2VJbnQobTEpO1xuXHRcdFx0cmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGVUb1JlcGxhY2UpO1xuXHRcdH1cblx0KTtcblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9PdXRkZW50ID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFJlbW92ZSBvbmUgbGV2ZWwgb2YgbGluZS1sZWFkaW5nIHRhYnMgb3Igc3BhY2VzXG4vL1xuXG5cdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1Zzpcblx0Ly8gXCItLS0tLS0tLS0tYnVnXCIucmVwbGFjZSgvXi0vZyxcIlwiKSA9PSBcImJ1Z1wiXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXihcXHR8WyBdezEsNH0pL2dtLFwifjBcIik7IC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblxuXHQvLyBhdHRhY2tsYWI6IGNsZWFuIHVwIGhhY2tcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvZyxcIlwiKVxuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0RldGFiID0gZnVuY3Rpb24odGV4dCkge1xuLy8gYXR0YWNrbGFiOiBEZXRhYidzIGNvbXBsZXRlbHkgcmV3cml0dGVuIGZvciBzcGVlZC5cbi8vIEluIHBlcmwgd2UgY291bGQgZml4IGl0IGJ5IGFuY2hvcmluZyB0aGUgcmVnZXhwIHdpdGggXFxHLlxuLy8gSW4gamF2YXNjcmlwdCB3ZSdyZSBsZXNzIGZvcnR1bmF0ZS5cblxuXHQvLyBleHBhbmQgZmlyc3Qgbi0xIHRhYnNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFx0KD89XFx0KS9nLFwiICAgIFwiKTsgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXG5cdC8vIHJlcGxhY2UgdGhlIG50aCB3aXRoIHR3byBzZW50aW5lbHNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFx0L2csXCJ+QX5CXCIpO1xuXG5cdC8vIHVzZSB0aGUgc2VudGluZWwgdG8gYW5jaG9yIG91ciByZWdleCBzbyBpdCBkb2Vzbid0IGV4cGxvZGVcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkIoLis/KX5BL2csXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGxlYWRpbmdUZXh0ID0gbTE7XG5cdFx0XHR2YXIgbnVtU3BhY2VzID0gNCAtIGxlYWRpbmdUZXh0Lmxlbmd0aCAlIDQ7ICAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cblx0XHRcdC8vIHRoZXJlICptdXN0KiBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpczpcblx0XHRcdGZvciAodmFyIGk9MDsgaTxudW1TcGFjZXM7IGkrKykgbGVhZGluZ1RleHQrPVwiIFwiO1xuXG5cdFx0XHRyZXR1cm4gbGVhZGluZ1RleHQ7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGNsZWFuIHVwIHNlbnRpbmVsc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+QS9nLFwiICAgIFwiKTsgIC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkIvZyxcIlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG4vL1xuLy8gIGF0dGFja2xhYjogVXRpbGl0eSBmdW5jdGlvbnNcbi8vXG5cblxudmFyIGVzY2FwZUNoYXJhY3RlcnMgPSBmdW5jdGlvbih0ZXh0LCBjaGFyc1RvRXNjYXBlLCBhZnRlckJhY2tzbGFzaCkge1xuXHQvLyBGaXJzdCB3ZSBoYXZlIHRvIGVzY2FwZSB0aGUgZXNjYXBlIGNoYXJhY3RlcnMgc28gdGhhdFxuXHQvLyB3ZSBjYW4gYnVpbGQgYSBjaGFyYWN0ZXIgY2xhc3Mgb3V0IG9mIHRoZW1cblx0dmFyIHJlZ2V4U3RyaW5nID0gXCIoW1wiICsgY2hhcnNUb0VzY2FwZS5yZXBsYWNlKC8oW1xcW1xcXVxcXFxdKS9nLFwiXFxcXCQxXCIpICsgXCJdKVwiO1xuXG5cdGlmIChhZnRlckJhY2tzbGFzaCkge1xuXHRcdHJlZ2V4U3RyaW5nID0gXCJcXFxcXFxcXFwiICsgcmVnZXhTdHJpbmc7XG5cdH1cblxuXHR2YXIgcmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4U3RyaW5nLFwiZ1wiKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZShyZWdleCxlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgZXNjYXBlQ2hhcmFjdGVyc19jYWxsYmFjayA9IGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0dmFyIGNoYXJDb2RlVG9Fc2NhcGUgPSBtMS5jaGFyQ29kZUF0KDApO1xuXHRyZXR1cm4gXCJ+RVwiK2NoYXJDb2RlVG9Fc2NhcGUrXCJFXCI7XG59XG5cbn0gLy8gZW5kIG9mIFNob3dkb3duLmNvbnZlcnRlclxuXG4vLyBleHBvcnRcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykgbW9kdWxlLmV4cG9ydHMgPSBTaG93ZG93bjtcblxufSkoKSJdfQ==
;