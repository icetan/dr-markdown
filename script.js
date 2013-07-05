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
var EventEmitter, base64, deserialize, rnd, serialize, state;

EventEmitter = require('events').EventEmitter;

base64 = require('../lib/base64');

rnd = function() {
  var x;
  return Date.now() + '-' + ((function() {
    var _i, _results;
    _results = [];
    for (x = _i = 0; _i <= 10; x = ++_i) {
      _results.push('0123456789abcdef'[Math.random() * 16 | 0]);
    }
    return _results;
  })()).join('');
};

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

module.exports = state = new EventEmitter;

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
  },
  localStorage: {
    store: function(id, data, callback) {
      if (id == null) {
        id = rnd();
      }
      window.localStorage.setItem(id, JSON.stringify(data || '{}'));
      return callback(id);
    },
    restore: function(id, callback) {
      return callback(JSON.parse(window.localStorage.getItem(id)));
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
var state, xhr;

xhr = require('./xhr.coffee');

state = require('./state.coffee');

state.stores.gist = {
  store: function(id, data, callback) {
    return xhr.json({
      method: 'POST',
      url: 'https://api.github.com/gists',
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
      var text, _ref, _ref1, _ref2;
      _ref = data.files, (_ref1 = _ref['main.md'], text = _ref1.content), (_ref2 = _ref['state.json'], state = _ref2.content);
      return callback({
        text: text,
        state: JSON.parse(state)
      });
    });
  }
};


},{"./xhr.coffee":9,"./state.coffee":6}],10:[function(require,module,exports){
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
var Showdown, extend, extendA, index, markdown, number, proxy, state_, toc, vixen, _ref;

vixen = require('vixen');

Showdown = require('showdown');

markdown = new Showdown.converter();

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
    r[k] = v;
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
    r[k] = v;
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

module.exports = function() {
  var cursorToken, docTitle, editor, model, saveTimer, saved, setIndex, setMode, setState, setToc, showDnd, state, tocEl, updateIndex, updateStatus, updateToc, updateView, viewEl, viewWrapEl;
  updateToc = function() {
    return tocEl.innerHTML = toc(viewEl);
  };
  updateIndex = function() {
    return index(number(viewEl));
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
  state = proxy({
    toc: setToc,
    index: setIndex,
    mode: setMode
  });
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
    extend(state, state__ || {});
    if ((text != null) && text !== editor.getValue()) {
      editor.setValue(text);
    }
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


},{"./unify.coffee":3,"./state.coffee":6,"./state-gist.coffee":8,"./utils.coffee":10,"vixen":11,"showdown":12}],12:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
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


},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2FwcC5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS91bmlmeS5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZXZlbnRzLmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS9zdGF0ZS5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2xpYi9iYXNlNjQuanMiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS9zdGF0ZS1naXN0LmNvZmZlZSIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvY29mZmVlL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvbm9kZV9tb2R1bGVzL3ZpeGVuL2luZGV4LmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9jb2ZmZWUvbWFpbi5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L25vZGVfbW9kdWxlcy9zaG93ZG93bi9zcmMvc2hvd2Rvd24uanMiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS94aHIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxDQUFRLE1BQVIsZUFBQTs7OztBQ0FBLElBQUEsTUFBQTs7QUFBQSxDQUFBLEVBQUE7Q0FDRSxDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FEQSxDQUNBO0NBREEsQ0FFQSxDQUZBLEVBRUE7Q0FGQSxDQUdBLENBSEEsQ0FHQTtDQUhBLENBSUEsQ0FKQSxDQUlBO0NBSkEsQ0FLQSxDQUxBLEVBS0E7Q0FMQSxDQU1BLENBTkEsRUFNQTtDQU5BLENBT0EsQ0FQQSxDQU9BO0NBUEEsQ0FRQSxDQVJBLEVBUUE7Q0FSQSxDQVNBLENBVEEsQ0FTQTtDQVRBLENBVUEsQ0FWQSxDQVVBO0NBVkEsQ0FXQSxDQVhBLENBV0E7Q0FYQSxDQVlBLENBWkEsRUFZQTtDQVpBLENBYUEsQ0FiQSxFQWFBO0NBYkEsQ0FjQSxDQWRBLEVBY0E7Q0FmRixDQUFBOztBQWlCQSxDQWpCQSxDQWlCUSxDQUFBLEVBQVIsSUFBUztDQUNQLEtBQUEsT0FBQTtDQUFBLENBQUEsQ0FBQSxNQUFNO0NBQU4sQ0FDQSxDQUFJLENBQUEsSUFBZSxDQUFOO0NBQWtCLENBQU0sQ0FBRyxDQUFSO0NBQUQsQ0FBZ0IsRUFBQTtDQUEzQyxDQUFrRCxDQUFuQyxDQUFBO0NBRG5CLENBRUEsQ0FBUSxFQUFSLENBRkE7Q0FHQSxDQUFBLEVBQUcsV0FBQSxLQUFIO0NBQ0ssQ0FBRCxDQUFrQixFQUFBLE1BQXBCLENBQUE7Q0FBNEIsQ0FBTSxDQUFHLENBQVIsRUFBQTtDQUFELENBQWdCLENBQU0sRUFBUyxDQUFmO0NBRDlDLENBQ3VFLENBQXJFLEdBQUE7SUFMSTtDQUFBOztBQU9SLENBeEJBLEVBd0IrQixFQXhCL0IsRUF3Qm9CLENBQUEsRUFBVjs7QUFDVixDQXpCQSxFQXlCMEMsR0FBekIsQ0F6QmpCLEVBeUJpQixDQUFQLEVBQWdCOzs7O0FDekIxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVBBLElBQUEsK0VBQUE7O0FBQUEsQ0FBQSxFQUFRLEVBQVIsRUFBUTs7QUFDUixDQURBLEVBQ1csSUFBQSxDQUFYLEVBQVc7O0FBQ1gsQ0FGQSxFQUVlLENBQUEsSUFBZixDQUFlOztBQUVmLENBSkEsTUFJQSxTQUFBOztBQUVBLENBTkEsRUFNUyxHQUFULENBQVMsU0FBQTs7QUFDVCxDQVBBLE1BT0EsY0FBQTs7QUFFQSxDQVRBLENBU0MsQ0FURCxFQVNBLENBQUEsQ0FBdUIsU0FBQTs7QUFFdkIsQ0FYQSxDQVdnQixDQUFQLEdBQVQsR0FBVTtDQUFZLEdBQUEsRUFBQTs7R0FBVixDQUFGO0lBQVk7QUFBQSxDQUFBLEtBQUEsQ0FBQTtjQUFBO0NBQUEsRUFBTyxDQUFQO0NBQUEsRUFBQTtDQUFiLFFBQXFDO0NBQXJDOztBQUNULENBWkEsQ0FZaUIsQ0FBUCxJQUFWLEVBQVc7Q0FBWSxLQUFBLGVBQUE7O0dBQVYsQ0FBRjtJQUFZO0FBQUEsQ0FBQSxFQUFBLElBQUEsaUNBQUE7Q0FBQSxDQUFjO0NBQWQsRUFBTyxDQUFQO0NBQUEsRUFBQTtDQUFiLFFBQXVDO0NBQXZDOztBQUVWLENBZEEsRUFjUSxDQUFBLENBQVIsSUFBUztDQUNQLEtBQUEsZ0JBQUE7Q0FBQSxDQUFBLENBQVMsR0FBVDtDQUFBLENBQ0EsQ0FBTyxDQUFQLEtBQVE7V0FDTjtDQUFBLENBQVksRUFBWixFQUFBLElBQUE7Q0FBQSxDQUNLLENBQUwsRUFBSyxDQUFMLEdBQU07Q0FDSixFQUFBLFNBQUE7Q0FBQSxFQUFBLENBQWEsRUFBQSxFQUFiO0NBQUEsRUFDZSxDQUFSLENBRFAsQ0FDTyxFQUFQO0NBQ0csQ0FBSCxDQUFBLEVBQUEsVUFBQTtDQUpGLE1BQ0s7Q0FETCxDQUtLLENBQUwsR0FBQSxHQUFLO0NBQVUsR0FBQSxFQUFBLFNBQVA7Q0FMUixNQUtLO0NBTkE7Q0FEUCxFQUNPO0NBT0EsQ0FDTCxJQURJLENBQ0osRUFERjtDQUNVLENBQVUsRUFBUixFQUFBO0NBQVEsQ0FBTyxDQUFBLEVBQVAsQ0FBQSxHQUFPO0NBQUEsY0FBRztDQUFWLE1BQU87TUFBakI7SUFBUjs7QUFBdUMsQ0FBQTtVQUFBLEVBQUE7dUJBQUE7Q0FBQSxDQUFPLEVBQVA7Q0FBQTs7Q0FBdkM7Q0FWSTs7QUFZUixDQTFCQSxFQTBCaUIsR0FBWCxDQUFOLEVBQWlCO0NBQ2YsS0FBQSxrTEFBQTtDQUFBLENBQUEsQ0FBWSxNQUFaO0NBQXFCLEVBQVksRUFBYixDQUFhLEdBQWxCLEVBQUE7Q0FBZixFQUFZO0NBQVosQ0FDQSxDQUFjLE1BQUEsRUFBZDtDQUF1QixJQUFOLENBQU0sS0FBTjtDQURqQixFQUNjO0NBRGQsQ0FFQSxDQUFVLENBQUEsR0FBVixFQUFXO0NBQ0gsRUFBTyxDQUFiLENBQUssTUFBTDtDQUFhLENBQ0osR0FBUCxDQUFBLE1BRFc7Q0FBQSxDQUVMLEVBQU4sRUFBQSxLQUZXO0NBR1gsR0FBQSxFQUFBO0NBTkosRUFFVTtDQUZWLENBT0EsQ0FBUyxHQUFULEdBQVU7Q0FDUixDQUFBLEVBQUE7Q0FBQSxLQUFBLEdBQUE7TUFBQTtDQUNNLENBQVUsQ0FBRyxFQUFkLEVBQUwsSUFBQTtDQVRGLEVBT1M7Q0FQVCxDQVVBLENBQVcsS0FBWCxDQUFZO0NBQ1YsQ0FBQSxFQUFBO0NBQ0UsR0FBRyxDQUEyRCxDQUE5RCxFQUFXLFFBQVIsS0FBQTtDQUNELE9BQUEsR0FBQTtDQUNBLEVBQUEsQ0FBZSxDQUFLLEdBQXBCO0NBQUEsUUFBQSxDQUFBO1VBRkY7UUFBQTtDQUdNLEVBQVksRUFBYixJQUFMLElBQUE7TUFKRjtDQU1RLEVBQVksRUFBYixJQUFMLElBQUE7TUFQTztDQVZYLEVBVVc7Q0FWWCxDQW1CQSxDQUFRLEVBQVI7Q0FDRSxDQUFLLENBQUwsQ0FBQSxFQUFBO0NBQUEsQ0FDTyxFQUFQLENBQUEsR0FEQTtDQUFBLENBRU0sRUFBTixHQUZBO0NBcEJGLEdBbUJRO0NBbkJSLENBeUJBLENBQVEsRUFBUixHQUFnQixNQUFSO0NBekJSLENBMEJBLENBQVMsR0FBVCxFQUFpQixNQUFSO0NBMUJULENBMkJBLENBQWEsS0FBUSxFQUFyQixDQUFhLEdBQUE7Q0EzQmIsQ0E2QkEsQ0FBVyxLQUFYLENBQVc7Q0FDVCxLQUFBLEVBQUE7Q0FBQSxFQUFBLENBQUEsQ0FBTSxHQUFRLEtBQVI7Q0FBTixFQUNHLENBQUgsRUFBOEIsR0FBOUIsQ0FBd0IsTUFBQTtDQUR4QixDQUtFLENBQWlCLENBQW5CLEdBQVUsQ0FBTSxDQUFpQyxPQUFqQztDQUE0QyxDQUFKLENBQUcsUUFBSCxFQUFBO0NBQXhELElBQWdEO0NBQzVDLEVBQUQsUUFBSDtDQXBDRixFQTZCVztDQTdCWCxDQXNDQSxDQUFRLENBdENSLENBc0NBO0NBdENBLENBd0NBLENBQWUsRUFBQSxJQUFDLEdBQWhCO0FBQ1MsQ0FBUCxHQUFBLENBQUc7Q0FDRCxDQUFtQixFQUFuQixDQUFBLENBQUE7Q0FBbUIsQ0FBSyxFQUFMLEVBQVcsRUFBWDtDQUFBLENBQThCLEdBQU4sR0FBQTtDQUEzQyxPQUFBO0NBQUEsRUFHaUIsRUFBakIsQ0FBQSxFQUFRO0NBSlYsRUFLVSxFQUFSLFFBQUE7TUFOVztDQXhDZixFQXdDZTtDQXhDZixDQWdEQSxDQUFjLFFBQWQsR0FoREE7Q0FBQSxDQWlEQSxDQUFhLE1BQUEsQ0FBYjtDQUNFLE9BQUEsZ0VBQUE7Q0FBQSxFQUFRLENBQVIsQ0FBQSxDQUFjLEdBQU47Q0FBUixDQUNBLENBQUssQ0FBTCxDQUFLLENBQU0sRUFBTjtDQURMLENBRUcsRUFBSCxDQUFHLE1BRkg7Q0FBQSxDQUdBLENBQUssQ0FBTDtDQUhBLEVBSUksQ0FBSixFQUpBO0NBQUEsQ0FLYyxDQUFBLENBQWQsR0FBYyxDQUFRLENBQXRCLEVBQWMsZ0JBQUE7Q0FDZCxHQUFBLENBQXNCO0NBQXRCLEtBQUEsS0FBQTtNQU5BO0NBT0EsRUFBQSxDQUFBLENBQW9CO0NBQXBCLEtBQUEsR0FBQTtNQVBBO0NBQUEsRUFRWSxDQUFaLEtBQUEsQ0FBc0I7Q0FSdEIsRUFTYSxDQUFiLE1BQUEsRUFUQTtDQUFBLEVBVWEsQ0FBYixJQUFxQixFQUFyQixJQUFhO0NBVmIsRUFXWSxDQUFaLEtBQUEsQ0FBc0I7Q0FYdEIsRUFZZSxDQUFmLE1BQXlCLEVBQXpCO0NBQ0EsRUFBZSxDQUFmLEtBQUcsQ0FBcUMsRUFBeEM7Q0FDYSxFQUFZLE1BQXZCLENBQVUsR0FBVjtNQWZTO0NBakRiLEVBaURhO0NBakRiLENBa0VBLENBQVksQ0FsRVosS0FrRUE7Q0FsRUEsQ0FtRUEsQ0FBUyxHQUFULEVBQXlDLEVBQXRCLEVBQVYsRUFBd0I7Q0FDL0IsQ0FBTSxFQUFOLENBQUE7Q0FBQSxDQUNPLEVBQVAsQ0FBQSxJQURBO0NBQUEsQ0FFYSxFQUFiLENBRkEsTUFFQTtDQUZBLENBR2MsRUFBZCxRQUFBO0NBSEEsQ0FJVSxDQUFBLENBQVYsSUFBQSxDQUFVO0NBQ1IsS0FBQSxJQUFBO0NBQUEsRUFDUSxFQUFSLENBQUE7Q0FEQSxLQUVBLEdBQUEsR0FBQTtDQUN1QixDQUFjLENBQXpCLENBQUEsS0FBWixDQUFZLEVBQUEsQ0FBWjtDQVJGLElBSVU7Q0FKVixDQVNhLENBQUEsQ0FBYixDQUFhLENBQUEsR0FBQyxFQUFkO0NBQ0UsTUFBQSxHQUFBO0NBQUEsR0FBZ0IsQ0FBZ0IsQ0FBaEMsQ0FBZ0I7Q0FBaEIsRUFBVSxFQUFWLEVBQUEsQ0FBQTtRQUFBO0NBRFcsWUFFWDtDQVhGLElBU2E7Q0E3RWYsR0FtRVM7Q0FuRVQsQ0FpRkEsQ0FBVyxDQUFBLElBQVgsQ0FBWTtDQUNWLE9BQUEsS0FBQTtDQUFBLENBQWMsRUFBWixDQUFGO0NBQUEsQ0FDYyxFQUFkLENBQUEsQ0FBQSxDQUFjO0NBQ2QsR0FBQSxDQUE0QyxDQUFNLEVBQU4sTUFBcEI7Q0FBeEIsR0FBQSxFQUFBLEVBQUE7TUFGQTtDQU1NLEVBQVEsQ0FBZSxDQUF4QixNQUFMO0NBeEZGLEVBaUZXO0NBakZYLENBNEZBLENBQ0UsRUFERjtDQUNFLENBQU0sQ0FBQSxDQUFOLEtBQU87Q0FBTSxHQUFHLEVBQUg7Q0FBQSxjQUFVO01BQVYsRUFBQTtDQUFBLGNBQWtCO1FBQXpCO0NBQU4sSUFBTTtDQUFOLENBQ00sQ0FBQSxDQUFOLEtBQU87Q0FBTSxHQUFHLEVBQUg7Q0FBQSxjQUFVO01BQVYsRUFBQTtDQUFBLGNBQXNCO1FBQTdCO0NBRE4sSUFDTTtDQUROLENBRWMsRUFBZCxRQUFBLGdDQUZBO0NBQUEsQ0FHVSxDQUFBLENBQVYsSUFBQSxDQUFVO0NBQ0csQ0FBMEIsRUFBMUIsRUFBWCxFQUFpQixLQUFqQjtDQUFxQyxDQUFNLEVBQU4sSUFBQSxrQkFBQTtDQUFyQyxDQUNFLENBQVcsRUFEYixHQUFXO0NBSmIsSUFHVTtDQUhWLENBTVMsQ0FBQSxDQUFULEdBQUEsRUFBUztDQUNQLEtBQUEsTUFBQTtDQUNPLENBQWEsRUFBcEIsRUFBQSxFQUE0QixHQUE1QixFQUFBO0NBUkYsSUFNUztDQU5ULENBYU8sQ0FBQSxDQUFQLENBQUEsSUFBTztDQUFVLElBQVAsQ0FBTSxPQUFOO0NBYlYsSUFhTztDQWJQLENBY00sRUFBTjtDQWRBLENBZVcsQ0FBQSxDQUFYLEtBQUE7QUFBOEIsQ0FBVixFQUFOLEVBQUssUUFBTDtDQWZkLElBZVc7Q0FmWCxDQWdCYSxDQUFBLENBQWIsS0FBYSxFQUFiO0FBQWtDLENBQVosRUFBUSxFQUFULFFBQUw7Q0FoQmhCLElBZ0JhO0NBaEJiLENBaUJhLENBQUEsQ0FBYixLQUFhLEVBQWI7Q0FDUSxDQUFRLENBQUQsQ0FBYixDQUFLLEVBQVEsTUFBYjtDQWxCRixJQWlCYTtDQWpCYixDQW1CWSxDQUFBLENBQVosS0FBWSxDQUFaO0NBQ1EsQ0FBUSxDQUFELENBQWIsQ0FBSyxDQUFRLE9BQWI7Q0FwQkYsSUFtQlk7Q0FuQlosQ0FxQlUsQ0FBQSxDQUFWLElBQUEsQ0FBVztDQUNULEdBQUEsTUFBQTtDQUFBLEVBQU8sQ0FBUCxFQUFBLEdBQUEsSUFBTztBQUNlLENBQXRCLEdBQWtCLENBQTZCLENBQS9DLEVBQThCO0NBQTlCLFdBQUEsR0FBQTtRQUZRO0NBckJWLElBcUJVO0NBckJWLENBd0JVLENBQUEsQ0FBVixJQUFBLENBQVc7Q0FDVCxHQUFHLEVBQUgsQ0FBRztDQUNELENBQUEsRUFBRyxDQUFhLEVBQWIsQ0FBSDtDQUNRLEVBQU8sQ0FBYixDQUFLLFlBQUw7Q0FDTyxHQUFELENBQWEsQ0FGckIsQ0FFUSxHQUZSO0NBR1EsRUFBTyxDQUFiLENBQUssWUFBTDtDQUNPLENBSlQsRUFJUSxDQUFhLENBSnJCLENBSVEsR0FKUjtDQUtRLEVBQU8sQ0FBYixDQUFLLFlBQUw7VUFOSjtRQURRO0NBeEJWLElBd0JVO0NBckhaLEdBQUE7Q0FBQSxDQThIQSxFQUFBLEVBQU0sQ0FBTixDQUFBO0NBOUhBLENBK0hBLElBQU0sRUFBTixDQUFBO0FBRW9CLENBQXBCLENBQUEsRUFBZ0IsRUFBVSxFQUFOO0NBQXBCLEVBQVUsQ0FBVixDQUFBLEVBQUE7SUFqSUE7Q0FBQSxDQW9JQSxFQUFtQixDQUFuQixHQUFjLEVBQWQ7Q0FFQSxRQUFBLENBQUE7Q0F2SWU7Ozs7QUMxQmpCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOXpDQSxHQUFBLENBQUE7O0FBQUEsQ0FBQSxDQUFZLENBQVosS0FBTSxDQUFDO0NBQ0wsS0FBQSx3QkFBQTtDQUFBLENBQUEsQ0FBUyxDQUFjLENBQXZCLENBQUE7QUFDSSxDQURKLENBQ0EsQ0FBSSxXQURKO0NBRUEsQ0FBQSxFQUFHLGFBQUE7Q0FDRCxDQUFlLENBQUcsQ0FBbEIsRUFBQTtJQURGLEVBQUEsMERBQUE7QUFHTSxDQUFKLEVBQUksQ0FBSixVQUFBO0NBQUEsQ0FDZSxDQUFHLENBQWxCLEVBQUE7SUFKRixFQUFBO0NBTUUsR0FBQSxPQUFPO0lBUlQ7Q0FBQSxDQVNBLENBQXVCLE1BQUEsU0FBdkI7Q0FDRSxHQUFBLENBQW1CLEtBQWhCO0NBQ0QsRUFBRyxDQUFBLEVBQUg7Q0FDVyxDQUFXLElBQXBCLEVBQUEsSUFBQSxHQUFBO01BREYsRUFBQTtDQUdXLENBQWMsTUFBdkIsRUFBQSxFQUFBLEdBQUE7UUFKSjtNQURxQjtDQVR2QixFQVN1QjtDQU12QjtDQUFBLE1BQUEsT0FBQTswQkFBQTtDQUFBLENBQTJCLEVBQTNCLENBQUEsQ0FBQSxVQUFBO0NBQUEsRUFmQTtDQUFBLENBZ0JBLENBQVUsQ0FBVjtDQWpCSSxRQWtCSjtDQWxCSTs7QUFvQk4sQ0FwQkEsQ0FvQmlCLENBQWQsQ0FBSCxJQUFXLENBQUM7Q0FDVixLQUFBLEdBQUE7Q0FBQSxDQUFBLENBQVksQ0FBQSxLQUFaO0NBQ0UsT0FBQSxFQUFBO0FBQWUsQ0FBZixHQUFBLFNBQUc7Q0FBc0IsQ0FBcUIsQ0FBZCxHQUFBLEVBQUEsS0FBQTtNQUFoQztDQUNBO0NBQ0UsRUFBTyxDQUFQLENBQU8sQ0FBUDtNQURGO0NBR0UsS0FESTtDQUNKLEVBQUEsQ0FBQSxFQUFBO01BSkY7Q0FLUyxDQUFLLENBQWQsQ0FBQSxJQUFBLEdBQUE7Q0FORixFQUFZO0NBQVosQ0FPQSxDQUFHLENBQUgsS0FBVztDQVBYLENBUUEsQ0FBRyxJQUFIO0NBQWMsQ0FBZ0IsRUFBaEIsVUFBQSxJQUFBO0NBUmQsR0FBQTtDQVNJLENBQUssQ0FBVCxNQUFBO0NBVlM7O0FBWVgsQ0FoQ0EsRUFnQ2lCLEdBQVgsQ0FBTiIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoJy4vY29mZmVlL21haW4uY29mZmVlJykoKVxuIiwibWFwID1cclxuICAnPD0nOiAn4oeQJyAjICdcXHUyMWQwJ1xyXG4gICc9Pic6ICfih5InICMgJ1xcdTIxZDInXHJcbiAgJzw9Pic6ICfih5QnICMgJ1xcdTIxZDQnXHJcbiAgJzwtJzogJ+KGkCcgIyAnXFx1MjE5MCdcclxuICAnLT4nOiAn4oaSJyAjICdcXHUyMTkyJ1xyXG4gICc8LT4nOiAn4oaUJyAjICdcXHUyMTk0J1xyXG4gICcuLi4nOiAn4oCmJ1xyXG4gICctLSc6ICfigJMnXHJcbiAgJy0tLSc6ICfigJQnXHJcbiAgJ14xJzogJ8K5J1xyXG4gICdeMic6ICfCsidcclxuICAnXjMnOiAnwrMnXHJcbiAgJzEvMic6ICfCvSdcclxuICAnMS80JzogJ8K8J1xyXG4gICczLzQnOiAnwr4nXHJcblxyXG51bmlmeSA9IChjbSkgLT5cclxuICBwb3MgPSBjbS5nZXRDdXJzb3IoKVxyXG4gIG0gPSAvW15cXHNdKyQvLmV4ZWMgY20uZ2V0UmFuZ2Uge2xpbmU6cG9zLmxpbmUsIGNoOjB9LCBwb3NcclxuICB0b2tlbiA9IG0/WzBdXHJcbiAgaWYgdG9rZW4/IGFuZCBtYXBbdG9rZW5dP1xyXG4gICAgY20ucmVwbGFjZVJhbmdlIG1hcFt0b2tlbl0sIHtsaW5lOnBvcy5saW5lLCBjaDpwb3MuY2gtdG9rZW4ubGVuZ3RofSwgcG9zXHJcblxyXG5Db2RlTWlycm9yLmNvbW1hbmRzWyd1bmlmeSddID0gdW5pZnlcclxuQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdFsnQ3RybC1TcGFjZSddID0gJ3VuaWZ5J1xyXG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7aWYgKCFwcm9jZXNzLkV2ZW50RW1pdHRlcikgcHJvY2Vzcy5FdmVudEVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcHJvY2Vzcy5FdmVudEVtaXR0ZXI7XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nXG4gICAgPyBBcnJheS5pc0FycmF5XG4gICAgOiBmdW5jdGlvbiAoeHMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9XG47XG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4ID09PSB4c1tpXSkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4vLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbi8vXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBuO1xufTtcblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc0FycmF5KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKVxuICAgIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiBmYWxzZTtcbiAgdmFyIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGlmICghaGFuZGxlcikgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZExpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cbiAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICAgIHZhciBtO1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5vbih0eXBlLCBmdW5jdGlvbiBnKCkge1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNBcnJheShsaXN0KSkge1xuICAgIHZhciBpID0gaW5kZXhPZihsaXN0LCBsaXN0ZW5lcik7XG4gICAgaWYgKGkgPCAwKSByZXR1cm4gdGhpcztcbiAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT0gMClcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdID09PSBsaXN0ZW5lcikge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICh0eXBlICYmIHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICB9XG4gIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGlmIChldi5zb3VyY2UgPT09IHdpbmRvdyAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJ7RXZlbnRFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50cydcblxuYmFzZTY0ID0gcmVxdWlyZSAnLi4vbGliL2Jhc2U2NCdcbiNsencgPSByZXF1aXJlICcuLi9saWIvbHp3J1xuXG5ybmQgPSAtPiBEYXRlLm5vdygpICsgJy0nICtcbiAgKCcwMTIzNDU2Nzg5YWJjZGVmJ1tNYXRoLnJhbmRvbSgpICogMTYgfCAwXSBmb3IgeCBpbiBbMC4uMTBdKS5qb2luICcnXG5cbmRlc2VyaWFsaXplID0gLT5cbiAgW3R5cGUsIGlkXSA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKS5zcGxpdCAnLycsIDJcbiAgeyB0eXBlLCBpZCB9XG5zZXJpYWxpemUgPSAoZGF0YSkgLT4gd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnIycrZGF0YS50eXBlKycvJytkYXRhLmlkXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGUgPSBuZXcgRXZlbnRFbWl0dGVyXG5cbnN0YXRlLnN0b3JlVHlwZSA9ICdiYXNlNjQnXG5zdGF0ZS5zdG9yZUlkID0gJydcblxuc3RhdGUuc3RvcmVzID1cbiAgI2x6dzpcbiAgIyAgc3RvcmU6IChkYXRhLCBmbikgLT4gZm4gYmFzZTY0LmVuY29kZSBsencuZW5jb2RlIGRhdGFcbiAgIyAgcmVzdG9yZTogKGRhdGEsIGZuKSAtPiBmbiBsencuZGVjb2RlIGJhc2U2NC5kZWNvZGUgZGF0YVxuICBiYXNlNjQ6XG4gICAgc3RvcmU6IChpZCwgZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgICBjYWxsYmFjayBiYXNlNjQuZW5jb2RlIEpTT04uc3RyaW5naWZ5KGRhdGEgb3IgJ3t9JylcbiAgICByZXN0b3JlOiAoaWQsIGNhbGxiYWNrKSAtPlxuICAgICAgY2FsbGJhY2sgSlNPTi5wYXJzZSBiYXNlNjQuZGVjb2RlKGlkKSBvciAne30nXG4gIGxvY2FsU3RvcmFnZTpcbiAgICBzdG9yZTogKGlkLCBkYXRhLCBjYWxsYmFjaykgLT5cbiAgICAgIGlkID89IHJuZCgpXG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0gaWQsIEpTT04uc3RyaW5naWZ5KGRhdGEgb3IgJ3t9JylcbiAgICAgIGNhbGxiYWNrIGlkXG4gICAgcmVzdG9yZTogKGlkLCBjYWxsYmFjaykgLT5cbiAgICAgIGNhbGxiYWNrIEpTT04ucGFyc2Ugd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtIGlkXG5cbnN0YXRlLnN0b3JlID0gKHN0b3JlVHlwZSwgZGF0YSwgY2FsbGJhY2spIC0+XG4gIHN0YXRlLnN0b3JlVHlwZSA9IHN0b3JlVHlwZSBpZiBzdG9yZVR5cGVcbiAgc3RhdGUuc3RvcmVzW3N0YXRlLnN0b3JlVHlwZV0uc3RvcmUgc3RhdGUuc3RvcmVJZCwgZGF0YSwgKHN0b3JlSWQpIC0+XG4gICAgc3RhdGUuc3RvcmVJZCA9IHN0b3JlSWRcbiAgICBzZXJpYWxpemUgdHlwZTpzdGF0ZS5zdG9yZVR5cGUsIGlkOnN0b3JlSWRcbiAgICBjYWxsYmFjaz8gc3RvcmVJZFxuXG5zdGF0ZS5yZXN0b3JlID0gKHN0b3JlVHlwZSwgc3RvcmVJZCwgY2FsbGJhY2spIC0+XG4gIGlmIG5vdCBzdG9yZVR5cGU/IGFuZCBub3Qgc3RvcmVJZD9cbiAgICB7IHR5cGU6c3RvcmVUeXBlLCBpZDpzdG9yZUlkIH0gPSBkZXNlcmlhbGl6ZSgpXG4gIHN0YXRlLnN0b3JlVHlwZSA9IHN0b3JlVHlwZSBpZiBzdG9yZVR5cGVcbiAgc3RhdGUuc3RvcmVJZCA9IHN0b3JlSWRcbiAgaWYgc3RvcmVJZD9cbiAgICBzdGF0ZS5zdG9yZXNbc3RhdGUuc3RvcmVUeXBlXS5yZXN0b3JlIHN0YXRlLnN0b3JlSWQsIChkYXRhKSAtPlxuICAgICAgY2FsbGJhY2sgZGF0YVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAnaGFzaGNoYW5nZScsIC0+XG4gIHsgdHlwZTpzdG9yZVR5cGUsIGlkOnN0b3JlSWQgfSA9IGRlc2VyaWFsaXplKClcbiAgaWYgc3RvcmVUeXBlIGlzbnQgc3RhdGUuc3RvcmVUeXBlIG9yIHN0b3JlSWQgaXNudCBzdGF0ZS5zdG9yZUlkXG4gICAgc3RhdGUucmVzdG9yZSBzdG9yZVR5cGUsIHN0b3JlSWQsIChkYXRhKSAtPlxuICAgICAgc3RvcmUuZW1pdCAncmVzdG9yZScsIGRhdGFcbiIsIi8qKlxuICpcbiAqICBiYXNlNjQgZW5jb2RlIC8gZGVjb2RlXG4gKiAgaHR0cDovL3d3dy53ZWJ0b29sa2l0LmluZm8vXG4gKlxuICoqL1xuXG52YXIgYmFzZTY0ID0ge1xuXG4gIC8vIHByaXZhdGUgcHJvcGVydHlcbiAgX2tleVN0ciA6IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIixcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBlbmNvZGluZ1xuICBlbmNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMywgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGJhc2U2NC5fdXRmOF9lbmNvZGUoaW5wdXQpO1xuXG4gICAgd2hpbGUgKGkgPCBpbnB1dC5sZW5ndGgpIHtcblxuICAgICAgY2hyMSA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgIGNocjIgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIzID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICBlbmMxID0gY2hyMSA+PiAyO1xuICAgICAgZW5jMiA9ICgoY2hyMSAmIDMpIDw8IDQpIHwgKGNocjIgPj4gNCk7XG4gICAgICBlbmMzID0gKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNik7XG4gICAgICBlbmM0ID0gY2hyMyAmIDYzO1xuXG4gICAgICBpZiAoaXNOYU4oY2hyMikpIHtcbiAgICAgICAgZW5jMyA9IGVuYzQgPSA2NDtcbiAgICAgIH0gZWxzZSBpZiAoaXNOYU4oY2hyMykpIHtcbiAgICAgICAgZW5jNCA9IDY0O1xuICAgICAgfVxuXG4gICAgICBvdXRwdXQgPSBvdXRwdXQgK1xuICAgICAgICB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzEpICsgdGhpcy5fa2V5U3RyLmNoYXJBdChlbmMyKSArXG4gICAgICAgIHRoaXMuX2tleVN0ci5jaGFyQXQoZW5jMykgKyB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzQpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSxcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBkZWNvZGluZ1xuICBkZWNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMztcbiAgICB2YXIgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXFw9XS9nLCBcIlwiKTtcblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG5cbiAgICAgIGVuYzEgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG4gICAgICBlbmMyID0gdGhpcy5fa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuICAgICAgZW5jMyA9IHRoaXMuX2tleVN0ci5pbmRleE9mKGlucHV0LmNoYXJBdChpKyspKTtcbiAgICAgIGVuYzQgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG5cbiAgICAgIGNocjEgPSAoZW5jMSA8PCAyKSB8IChlbmMyID4+IDQpO1xuICAgICAgY2hyMiA9ICgoZW5jMiAmIDE1KSA8PCA0KSB8IChlbmMzID4+IDIpO1xuICAgICAgY2hyMyA9ICgoZW5jMyAmIDMpIDw8IDYpIHwgZW5jNDtcblxuICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIxKTtcblxuICAgICAgaWYgKGVuYzMgIT0gNjQpIHtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIyKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmM0ICE9IDY0KSB7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dCArIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyMyk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBvdXRwdXQgPSBiYXNlNjQuX3V0ZjhfZGVjb2RlKG91dHB1dCk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuXG4gIH0sXG5cbiAgLy8gcHJpdmF0ZSBtZXRob2QgZm9yIFVURi04IGVuY29kaW5nXG4gIF91dGY4X2VuY29kZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7XG4gICAgdmFyIHV0ZnRleHQgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCBzdHJpbmcubGVuZ3RoOyBuKyspIHtcblxuICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChuKTtcblxuICAgICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZigoYyA+IDEyNykgJiYgKGMgPCAyMDQ4KSkge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gNikgfCAxOTIpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiAxMikgfCAyMjQpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjID4+IDYpICYgNjMpIHwgMTI4KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB1dGZ0ZXh0O1xuICB9LFxuXG4gIC8vIHByaXZhdGUgbWV0aG9kIGZvciBVVEYtOCBkZWNvZGluZ1xuICBfdXRmOF9kZWNvZGUgOiBmdW5jdGlvbiAodXRmdGV4dCkge1xuICAgIHZhciBzdHJpbmcgPSBcIlwiO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgYyA9IGMxID0gYzIgPSAwO1xuXG4gICAgd2hpbGUgKCBpIDwgdXRmdGV4dC5sZW5ndGggKSB7XG5cbiAgICAgIGMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcbiAgICAgICAgYzIgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsxKTtcbiAgICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMzEpIDw8IDYpIHwgKGMyICYgNjMpKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XG4gICAgICAgIGMzID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMik7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDE1KSA8PCAxMikgfCAoKGMyICYgNjMpIDw8IDYpIHwgKGMzICYgNjMpKTtcbiAgICAgICAgaSArPSAzO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZTY0O1xuIiwieGhyID0gcmVxdWlyZSAnLi94aHIuY29mZmVlJ1xuc3RhdGUgPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcblxuI2V4dGVuZCA9IChyPXt9LCBkKSAtPiByW2tdID0gdiBmb3IgaywgdiBvZiBkOyByXG4jdG9EaWN0ID0gKGFycmF5LCBkaWN0PXt9KSAtPiBkaWN0W2t2cFswXV0gPSBrdnBbMV0gZm9yIGt2cCBpbiBhcnJheTsgZGljdFxuI3BhcnNlUXVlcnkgPSAocykgLT4gdG9EaWN0KGt2cC5zcGxpdCgnPScpIGZvciBrdnAgaW4gcy5yZXBsYWNlKC9eXFw/LywnJykuc3BsaXQoJyYnKSlcbiNcbiNjbGllbnRJZCA9ICcwNGM0ZGUzMzMyNjY0ZDcwNDY0MidcbiNyZWRpcmVjdCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmXG4jYXV0aCA9IC0+XG4jICBxdWVyeSA9IHBhcnNlUXVlcnkgd2luZG93LmxvY2F0aW9uLnNlYXJjaFxuIyAgaWYgcXVlcnkuY29kZVxuIyAgICB4T3JpZ1N0YXRlID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtICd4LW9yaWctc3RhdGUnXG4jICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSAneC1vcmlnLXN0YXRlJ1xuIyAgICBpZiB4T3JpZ1N0YXRlIGlzbnQgcXVlcnkuc3RhdGVcbiMgICAgICByZXR1cm4gY29uc29sZS5lcnJvciAnY3Jvc3Mgb3JpZ2luIHN0YXRlIGhhcyBiZWVuIHRhbXBlcmVkIHdpdGguJ1xuIyAgICB4aHJcbiMgICAgICBtZXRob2Q6ICdQT1NUJ1xuIyAgICAgIHVybDogJ2h0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hY2Nlc3NfdG9rZW4nXG4jICAgICAgZGF0YTpcbiMgICAgICAgIGNsaWVudF9pZDogY2xpZW50SWRcbiMgICAgICAgIGNsaWVudF9zZWNyZXQ6IGNsaWVudFNlY3JldFxuIyAgICAgICAgY29kZTogcXVlcnkuY29kZVxuIyAgICAsKGVyciwgZGF0YSkgLT5cbiMgICAgICBjb25zb2xlLmxvZyBkYXRhXG4jICBlbHNlIGlmIHF1ZXJ5LmVycm9yXG4jXG4jICBlbHNlXG4jICAgIHJuZCA9ICgnMDEyMzQ1Njc4OWFiY2RlZidbTWF0aC5yYW5kb20oKSAqIDE2IHwgMF0gZm9yIHggaW4gWzAuLjEwXSkuam9pbiAnJ1xuIyAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0gJ3gtb3JpZy1zdGF0ZScsIHJuZFxuIyAgICB3aW5kb3cub3BlbiBcImh0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hdXRob3JpemU/Y2xpZW50X2lkPSN7Y2xpZW50SWR9JnNjb3BlPWdpc3Qmc3RhdGU9I3tybmR9JnJlZGlyZWN0X3VyaT0je3JlZGlyZWN0fVwiXG5cbnN0YXRlLnN0b3Jlcy5naXN0ID1cbiAgc3RvcmU6IChpZCwgZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgeGhyLmpzb25cbiAgICAgIG1ldGhvZDogJ1BPU1QnICNpZiBpZCB0aGVuICdQQVRDSCcgZWxzZSAnUE9TVCdcbiAgICAgIHVybDogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMnICMrIGlmIGlkIHRoZW4gJy8nK2lkIGVsc2UgJydcbiAgICAgIGRhdGE6XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlZCB3aXRoIERyLiBNYXJrZG93bidcbiAgICAgICAgZmlsZXM6XG4gICAgICAgICAgJ21haW4ubWQnOiBjb250ZW50OiBkYXRhLnRleHRcbiAgICAgICAgICAnc3RhdGUuanNvbic6IGNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5IGRhdGEuc3RhdGVcbiAgICAsKGVyciwgZGF0YSkgLT4gY2FsbGJhY2sgZGF0YS5pZFxuICByZXN0b3JlOiAoaWQsIGNhbGxiYWNrKSAtPlxuICAgIHhoci5qc29uIHVybDonaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9naXN0cy8nK2lkLCAoZXJyLCBkYXRhKSAtPlxuICAgICAge1xuICAgICAgICBmaWxlczoge1xuICAgICAgICAgICdtYWluLm1kJzogeyBjb250ZW50OnRleHQgfSxcbiAgICAgICAgICAnc3RhdGUuanNvbic6IHsgY29udGVudDpzdGF0ZSB9XG4gICAgICAgIH1cbiAgICAgIH0gPSBkYXRhXG4gICAgICBjYWxsYmFjayB7IHRleHQsIHN0YXRlOkpTT04ucGFyc2Ugc3RhdGUgfVxuXG4jc2V0VGltZW91dCAoLT4gYXV0aCgpKSwgMTAwMFxuIiwibW9kdWxlLmV4cG9ydHMgPSBcbiAgZ2V0Q3Vyc29yUG9zaXRpb246IChlbCkgLT5cbiAgICBwb3MgPSAwXG4gICAgIyBJRSBTdXBwb3J0XG4gICAgaWYgZG9jdW1lbnQuc2VsZWN0aW9uXG4gICAgICBlbC5mb2N1cygpXG4gICAgICBTZWwgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKVxuICAgICAgU2VsTGVuZ3RoID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCkudGV4dC5sZW5ndGhcbiAgICAgIFNlbC5tb3ZlU3RhcnQgJ2NoYXJhY3RlcicsIC1lbC52YWx1ZS5sZW5ndGhcbiAgICAgIHBvcyA9IFNlbC50ZXh0Lmxlbmd0aCAtIFNlbExlbmd0aFxuICAgICMgRmlyZWZveCBzdXBwb3J0XG4gICAgZWxzZSBpZiBlbC5zZWxlY3Rpb25TdGFydCBvciBlbC5zZWxlY3Rpb25TdGFydCBpcyAwXG4gICAgICBwb3MgPSBlbC5zZWxlY3Rpb25TdGFydFxuICAgIHBvc1xuXG4gIG51bWJlcjogKGVsKSAtPlxuICAgIHNlbGVjdG9yID0gJ0gxLEgyLEgzLEg0LEg1LEg2JyAjICsgJyxPTCxVTCxMSSdcbiAgICBlbGVtcyA9IFtdXG4gICAgb3JkZXIgPSBzZWxlY3Rvci5zcGxpdCgnLCcpXG4gICAgbWFwID0ge31cbiAgICBtYXBbc2VsXSA9IHtjOjAsIHBvczppfSBmb3Igc2VsLCBpIGluIG9yZGVyXG4gICAgbnVtID0gKHRhZykgLT5cbiAgICAgIChjIGZvciBpIGluIFswLi5tYXBbdGFnXS5wb3NdXFxcbiAgICAgICB3aGVuIChjPW1hcFsodD1vcmRlcltpXSldLmMpIGlzbnQgMFxcXG4gICAgICAgYW5kIHQgbm90IGluIFsnT0wnLCAnVUwnXSkuam9pbiAnLCdcbiAgICBjb3VudCA9IChzZWwpIC0+XG4gICAgICBlID0gbWFwW3NlbF1cbiAgICAgIGUuYysrXG4gICAgICAobWFwW29yZGVyW2ldXS5jID0gMCBmb3IgaSBpbiBbZS5wb3MrMS4uLm9yZGVyLmxlbmd0aF0pXG4gICAgcmVzZXQgPSAoY2xlYXIpIC0+XG4gICAgICBlbGVtcyA9IFtdIGlmIGNsZWFyXG4gICAgICBvYmouYyA9IDAgZm9yIHNlbCxvYmogb2YgbWFwXG4gICAgZm9yIGgsIGkgaW4gZWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbnVtYmVyLXJlc2V0XSxbZGF0YS1udW1iZXItY2xlYXJdLCcrc2VsZWN0b3IpXG4gICAgICBpZiBoLmhhc0F0dHJpYnV0ZSAnZGF0YS1udW1iZXItcmVzZXQnXG4gICAgICAgIHJlc2V0KClcbiAgICAgIGVsc2UgaWYgaC5oYXNBdHRyaWJ1dGUgJ2RhdGEtbnVtYmVyLWNsZWFyJ1xuICAgICAgICByZXNldCB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIHQgPSBoLnRhZ05hbWVcbiAgICAgICAgY291bnQgdFxuICAgICAgICBlbGVtcy5wdXNoIFtoLCBudW0gdF0gaWYgdCBub3QgaW4gWydPTCcsICdVTCddXG4gICAgaC5zZXRBdHRyaWJ1dGUgJ2RhdGEtbnVtYmVyJywgbiBmb3IgW2gsIG5dIGluIGVsZW1zXG4gICAgZWxcblxuICBpbmRleDogKGVsKSAtPlxuICAgIGZvciBlIGluIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW51bWJlcl0nKVxuICAgICAgZS5pbm5lckhUTUwgPSBcIlwiXCJcbiAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImluZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgI3tlLmdldEF0dHJpYnV0ZSgnZGF0YS1udW1iZXInKS5zcGxpdCgnLCcpLmpvaW4oJy4gJyl9LlxuICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICBcIlwiXCIgKyBlLmlubmVySFRNTFxuICAgIGVsXG5cbiAgdG9jOiAoZWwpIC0+XG4gICAgJzx1bD4nICsgKGZvciBlIGluIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ0gxLEgyLEgzLEg0LEg1LEg2JylcbiAgICAgIFwiXCJcIlxuICAgICAgPGxpPjxhIGhyZWY9XCIjI3tlLmlkfVwiPjwje2UudGFnTmFtZX0+XG4gICAgICAje2UuaW5uZXJIVE1MfVxuICAgICAgPC8je2UudGFnTmFtZX0+PC9hPjwvbGk+XG4gICAgICBcIlwiXCJcbiAgICApLmpvaW4oJycpICsgJzwvdWw+J1xuIiwiIWZ1bmN0aW9uKG9iaikge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBvYmo7XG4gIGVsc2VcbiAgICB3aW5kb3cudml4ZW4gPSBvYmo7XG59KGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiB0cmltKHN0cikge3JldHVybiBTdHJpbmcucHJvdG90eXBlLnRyaW0uY2FsbChzdHIpO307XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZVByb3Aob2JqLCBuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWUudHJpbSgpLnNwbGl0KCcuJykucmVkdWNlKGZ1bmN0aW9uIChwLCBwcm9wKSB7XG4gICAgICByZXR1cm4gcCA/IHBbcHJvcF0gOiB1bmRlZmluZWQ7XG4gICAgfSwgb2JqKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmVDaGFpbihvYmosIGNoYWluKSB7XG4gICAgdmFyIHByb3AgPSBjaGFpbi5zaGlmdCgpO1xuICAgIHJldHVybiBjaGFpbi5yZWR1Y2UoZnVuY3Rpb24gKHAsIHByb3ApIHtcbiAgICAgIHZhciBmID0gcmVzb2x2ZVByb3Aob2JqLCBwcm9wKTtcbiAgICAgIHJldHVybiBmID8gZihwKSA6IHA7XG4gICAgfSwgcmVzb2x2ZVByb3Aob2JqLCBwcm9wKSk7XG4gIH1cblxuICBmdW5jdGlvbiBidWNrZXQoYiwgaywgdikge1xuICAgIGlmICghKGsgaW4gYikpIGJba10gPSBbXTtcbiAgICBpZiAoISh2IGluIGJba10pKSBiW2tdLnB1c2godik7XG4gIH1cblxuICBmdW5jdGlvbiBleHRlbmQob3JpZywgb2JqKSB7XG4gICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIG9yaWdbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgfSk7XG4gICAgcmV0dXJuIG9yaWc7XG4gIH1cblxuICBmdW5jdGlvbiB0cmF2ZXJzZUVsZW1lbnRzKGVsLCBjYWxsYmFjaykge1xuICAgIHZhciBpO1xuICAgIGlmIChjYWxsYmFjayhlbCkgIT09IGZhbHNlKSB7XG4gICAgICBmb3IoaSA9IGVsLmNoaWxkcmVuLmxlbmd0aDsgaS0tOykgKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHRyYXZlcnNlRWxlbWVudHMobm9kZSwgY2FsbGJhY2spO1xuICAgICAgfSkoZWwuY2hpbGRyZW5baV0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVByb3h5KG1hcHMsIHByb3h5KSB7XG4gICAgcHJveHkgPSBwcm94eSB8fCB7fTtcbiAgICBwcm94eS5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHZhciB0b1JlbmRlciA9IHt9O1xuICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgbWFwcy5vcmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICBpZiAobWFwcy5iaW5kc1twcm9wXSkgbWFwcy5iaW5kc1twcm9wXS5mb3JFYWNoKGZ1bmN0aW9uKHJlbmRlcklkKSB7XG4gICAgICAgICAgaWYgKHJlbmRlcklkID49IDApIHRvUmVuZGVyW3JlbmRlcklkXSA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBmb3IgKHJlbmRlcklkIGluIHRvUmVuZGVyKSBtYXBzLnJlbmRlcnNbcmVuZGVySWRdKG1hcHMub3JpZyk7XG4gICAgICByZXR1cm4gcHJveHk7XG4gICAgfTtcblxuICAgIE9iamVjdC5rZXlzKG1hcHMuYmluZHMpLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgdmFyIGlkcyA9IG1hcHMuYmluZHNbcHJvcF07XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksIHByb3AsIHtcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIG1hcHMub3JpZ1twcm9wXSA9IHZhbHVlO1xuICAgICAgICAgIGlkcy5mb3JFYWNoKGZ1bmN0aW9uKHJlbmRlcklkKSB7XG4gICAgICAgICAgICBpZiAocmVuZGVySWQgPj0gMCkgbWFwcy5yZW5kZXJzW3JlbmRlcklkXShtYXBzLm9yaWcpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChtYXBzLnJlYmluZHNbcHJvcF0pXG4gICAgICAgICAgICByZXR1cm4gbWFwcy5yZWJpbmRzW3Byb3BdKCk7XG4gICAgICAgICAgcmV0dXJuIG1hcHMub3JpZ1twcm9wXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb3h5O1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGVsLCBtb2RlbCkge1xuICAgIHZhciBwYXR0ZXJuID0gL1xce1xcey4rP1xcfVxcfS9nLFxuICAgICAgICBwaXBlID0gJ3wnO1xuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZShvcmlnLCBwcm9wKSB7XG4gICAgICBpZiAoIW9yaWcpIHJldHVybiAnJztcbiAgICAgIHZhciB2YWwgPSByZXNvbHZlQ2hhaW4ob3JpZywgcHJvcC5zbGljZSgyLC0yKS5zcGxpdChwaXBlKSk7XG4gICAgICByZXR1cm4gdmFsID09PSB1bmRlZmluZWQgPyAnJyA6IHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdHJUbXBsKHN0ciwgb3JpZykge1xuICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKHBhdHRlcm4sIHJlc29sdmUuYmluZCh1bmRlZmluZWQsIG9yaWcpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaChzdHIpIHtcbiAgICAgIHZhciBtID0gc3RyLm1hdGNoKHBhdHRlcm4pO1xuICAgICAgaWYgKG0pIHJldHVybiBtLm1hcChmdW5jdGlvbihjaGFpbikge1xuICAgICAgICByZXR1cm4gY2hhaW4uc2xpY2UoMiwgLTIpLnNwbGl0KHBpcGUpLm1hcCh0cmltKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyYXZlcnNlKGVsLCBvcmlnKSB7XG4gICAgICB2YXIgYmluZHMgPSB7fSxcbiAgICAgICAgICByZWJpbmRzID0ge30sXG4gICAgICAgICAgcmVuZGVycyA9IHt9LFxuICAgICAgICAgIGNvdW50ID0gMDtcbiAgICAgIG9yaWcgPSBvcmlnIHx8IHt9O1xuXG4gICAgICBmdW5jdGlvbiBiaW5kUmVuZGVycyhjaGFpbnMsIHJlbmRlcklkKSB7XG4gICAgICAgIC8vIENyZWF0ZSBwcm9wZXJ0eSB0byByZW5kZXIgbWFwcGluZ1xuICAgICAgICBjaGFpbnMuZm9yRWFjaChmdW5jdGlvbihjaGFpbikge1xuICAgICAgICAgIC8vIFRPRE86IFJlZ2lzdGVyIGNoYWluaW5nIGZ1bmN0aW9ucyBhcyBiaW5kcyBhcyB3ZWxsLlxuICAgICAgICAgIGJ1Y2tldChiaW5kcywgY2hhaW5bMF0uc3BsaXQoJy4nKVswXSwgcmVuZGVySWQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGFyc2VJdGVyYXRvcihlbCkge1xuICAgICAgICB2YXIgbWFya2VyLCBwcmVmaXggPSAnJywgbm9kZXMgPSBbXTtcbiAgICAgICAgaWYgKHBhcmVudF8gPSAoZWwucGFyZW50RWxlbWVudCB8fCBlbC5wYXJlbnROb2RlKSkge1xuICAgICAgICAgIGlmIChlbC50YWdOYW1lID09PSAnRk9SJykge1xuICAgICAgICAgICAgbWFya2VyID0gZWwub3duZXJEb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICAgICAgICBwYXJlbnRfLnJlcGxhY2VDaGlsZChtYXJrZXIsIGVsKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1pbicpKSB7XG4gICAgICAgICAgICBwcmVmaXggPSAnZGF0YS0nO1xuICAgICAgICAgICAgcGFyZW50XyA9IGVsO1xuICAgICAgICAgICAgbm9kZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlbC5jaGlsZE5vZGVzKTtcbiAgICAgICAgICAgIG1hcmtlciA9IGVsLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgICAgICAgcGFyZW50Xy5hcHBlbmRDaGlsZChtYXJrZXIpO1xuICAgICAgICAgIH0gZWxzZSByZXR1cm47XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFsaWFzOiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4Kyd2YWx1ZScpLFxuICAgICAgICAgICAga2V5OiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4KydrZXknKSxcbiAgICAgICAgICAgIHByb3A6IGVsLmdldEF0dHJpYnV0ZShwcmVmaXgrJ2luJyksXG4gICAgICAgICAgICBlYWNoOiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4KydlYWNoJyksXG4gICAgICAgICAgICBub2Rlczogbm9kZXMsXG4gICAgICAgICAgICBwYXJlbnQ6IHBhcmVudF8sXG4gICAgICAgICAgICBtYXJrZXI6IG1hcmtlclxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbWFwQXR0cmlidXRlKG93bmVyLCBhdHRyKSB7XG4gICAgICAgIHZhciBuYW1lLCBldmVudElkLCByZW5kZXJJZCwgc3RyLCBub1RtcGw7XG4gICAgICAgIGlmICgoc3RyID0gYXR0ci52YWx1ZSkgJiYgKGNoYWlucyA9IG1hdGNoKHN0cikpKSB7XG4gICAgICAgICAgbmFtZSA9IGF0dHIubmFtZTtcbiAgICAgICAgICBpZiAobmFtZS5pbmRleE9mKCd2eC0nKSA9PT0gMCkge1xuICAgICAgICAgICAgb3duZXIucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobmFtZS5pbmRleE9mKCdvbicpID09PSAwKSB7XG4gICAgICAgICAgICByZW5kZXJJZCA9IC0xOyAvLyBObyByZW5kZXJlclxuICAgICAgICAgICAgZXZlbnROYW1lID0gbmFtZS5zdWJzdHIoMik7XG4gICAgICAgICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgICAgICBjaGFpbnMuZm9yRWFjaChmdW5jdGlvbihjaGFpbikge1xuICAgICAgICAgICAgICBvd25lci5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVQcm9wKG9yaWcsIGNoYWluWzBdKShldnQsIG93bmVyLnZhbHVlKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG93bmVyLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9UbXBsID0gY2hhaW5zLmxlbmd0aCA9PT0gMSAmJiBzdHIuc3Vic3RyKDAsMSkgPT09ICd7JyAmJlxuICAgICAgICAgICAgICBzdHIuc3Vic3RyKC0xKSA9PT0gJ30nO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBmb3IgYXR0cmlidXRlLlxuICAgICAgICAgICAgcmVuZGVySWQgPSBjb3VudCsrO1xuICAgICAgICAgICAgKHJlbmRlcnNbcmVuZGVySWRdID0gZnVuY3Rpb24ob3JpZywgY2xlYXIpIHtcbiAgICAgICAgICAgICAgdmFyIHZhbCA9IG5vVG1wbCA/IHJlc29sdmUob3JpZywgc3RyKSA6IHN0clRtcGwoc3RyLCBvcmlnKTtcbiAgICAgICAgICAgICAgIWNsZWFyICYmIG5hbWUgaW4gb3duZXIgPyBvd25lcltuYW1lXSA9IHZhbCA6XG4gICAgICAgICAgICAgICAgb3duZXIuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCk7XG4gICAgICAgICAgICB9KShvcmlnLCB0cnVlKTtcbiAgICAgICAgICAgIC8vIEJpLWRpcmVjdGlvbmFsIGNvdXBsaW5nLlxuICAgICAgICAgICAgaWYgKG5vVG1wbCkgcmViaW5kc1tjaGFpbnNbMF1bMF1dID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogR2V0dGluZyBmLmV4LiAndmFsdWUnIGF0dHJpYnV0ZSBmcm9tIGFuIGlucHV0XG4gICAgICAgICAgICAgICAgLy8gZG9lc24ndCByZXR1cm4gdXNlciBpbnB1dCB2YWx1ZSBzbyBhY2Nlc3NpbmcgZWxlbWVudFxuICAgICAgICAgICAgICAgIC8vIG9iamVjdCBwcm9wZXJ0aWVzIGRpcmVjdGx5LCBmaW5kIG91dCBob3cgdG8gZG8gdGhpc1xuICAgICAgICAgICAgICAgIC8vIG1vcmUgc2VjdXJlbHkuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5hbWUgaW4gb3duZXIgP1xuICAgICAgICAgICAgICAgICAgb3duZXJbbmFtZV0gOiBvd25lci5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGJpbmRSZW5kZXJzKGNoYWlucywgcmVuZGVySWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1hcFRleHROb2RlcyhlbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gZWwuY2hpbGROb2Rlcy5sZW5ndGg7IGktLTspIChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgdmFyIHN0ciwgcmVuZGVySWQsIGNoYWlucztcbiAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gZWwuVEVYVF9OT0RFICYmIChzdHIgPSBub2RlLm5vZGVWYWx1ZSkgJiZcbiAgICAgICAgICAgICAgKGNoYWlucyA9IG1hdGNoKHN0cikpKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgcmVuZGVyaW5nIGZ1bmN0aW9uIGZvciBlbGVtZW50IHRleHQgbm9kZS5cbiAgICAgICAgICAgIHJlbmRlcklkID0gY291bnQrKztcbiAgICAgICAgICAgIChyZW5kZXJzW3JlbmRlcklkXSA9IGZ1bmN0aW9uKG9yaWcpIHtcbiAgICAgICAgICAgICAgbm9kZS5ub2RlVmFsdWUgPSBzdHJUbXBsKHN0ciwgb3JpZyk7XG4gICAgICAgICAgICB9KShvcmlnKTtcbiAgICAgICAgICAgIGJpbmRSZW5kZXJzKGNoYWlucywgcmVuZGVySWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkoZWwuY2hpbGROb2Rlc1tpXSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSBuby10cmF2ZXJzZSBhdHRyaWJ1dGUgaWYgcm9vdCBub2RlXG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3VidmlldycpO1xuXG4gICAgICB0cmF2ZXJzZUVsZW1lbnRzKGVsLCBmdW5jdGlvbihlbF8pIHtcbiAgICAgICAgdmFyIGksIGl0ZXIsIHRlbXBsYXRlLCBub2RlcywgcmVuZGVySWQ7XG5cbiAgICAgICAgLy8gU3RvcCBoYW5kbGluZyBhbmQgcmVjdXJzaW9uIGlmIHN1YnZpZXcuXG4gICAgICAgIGlmIChlbF8uZ2V0QXR0cmlidXRlKCdkYXRhLXN1YnZpZXcnKSAhPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmIChpdGVyID0gcGFyc2VJdGVyYXRvcihlbF8pKSB7XG4gICAgICAgICAgbm9kZXMgPSBpdGVyLm5vZGVzO1xuICAgICAgICAgIHRlbXBsYXRlID0gZWxfLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICBtYXBzID0gdHJhdmVyc2UodGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgICAgICByZW5kZXJJZCA9IGNvdW50Kys7XG4gICAgICAgICAgKHJlbmRlcnNbcmVuZGVySWRdID0gZnVuY3Rpb24ob3JpZykge1xuICAgICAgICAgICAgdmFyIGxpc3QgPSByZXNvbHZlUHJvcChvcmlnLCBpdGVyLnByb3ApLFxuICAgICAgICAgICAgICAgIGVhY2hfID0gaXRlci5lYWNoICYmIHJlc29sdmVQcm9wKG9yaWcsIGl0ZXIuZWFjaCksIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSBub2Rlcy5sZW5ndGg7IGktLTspIGl0ZXIucGFyZW50LnJlbW92ZUNoaWxkKG5vZGVzW2ldKTtcbiAgICAgICAgICAgIG5vZGVzID0gW107XG4gICAgICAgICAgICBmb3IgKGkgaW4gbGlzdCkgaWYgKGxpc3QuaGFzT3duUHJvcGVydHkoaSkpXG4gICAgICAgICAgICAgIChmdW5jdGlvbih2YWx1ZSwgaSl7XG4gICAgICAgICAgICAgICAgdmFyIG9yaWdfID0gZXh0ZW5kKHt9LCBvcmlnKSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSB0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSksXG4gICAgICAgICAgICAgICAgICAgIGxhc3ROb2RlID0gaXRlci5tYXJrZXIsXG4gICAgICAgICAgICAgICAgICAgIG1hcHMsIHJlbmRlcklkLCBpXywgbm9kZSwgbm9kZXNfID0gW107XG4gICAgICAgICAgICAgICAgaWYgKGl0ZXIua2V5KSBvcmlnX1tpdGVyLmtleV0gPSBpO1xuICAgICAgICAgICAgICAgIG9yaWdfW2l0ZXIuYWxpYXNdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgbWFwcyA9IHRyYXZlcnNlKGNsb25lLCBvcmlnXyk7XG4gICAgICAgICAgICAgICAgZm9yIChpXyA9IGNsb25lLmNoaWxkTm9kZXMubGVuZ3RoOyBpXy0tOyBsYXN0Tm9kZSA9IG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgIG5vZGVzXy5wdXNoKG5vZGUgPSBjbG9uZS5jaGlsZE5vZGVzW2lfXSk7XG4gICAgICAgICAgICAgICAgICBpdGVyLnBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgbGFzdE5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZWFjaF8gJiYgZWFjaF8odmFsdWUsIGksIG9yaWdfLCBub2Rlc18uZmlsdGVyKGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuLm5vZGVUeXBlID09PSBlbF8uRUxFTUVOVF9OT0RFO1xuICAgICAgICAgICAgICAgIH0pKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGlfID0gbm9kZXNfLmxlbmd0aDsgaV8tLTspXG4gICAgICAgICAgICAgICAgICAgIGl0ZXIucGFyZW50LnJlbW92ZUNoaWxkKG5vZGVzX1tpX10pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBub2RlcyA9IG5vZGVzLmNvbmNhdChub2Rlc18pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkobGlzdFtpXSwgaSk7XG4gICAgICAgICAgfSkob3JpZyk7XG4gICAgICAgICAgYnVja2V0KGJpbmRzLCBpdGVyLnByb3Auc3BsaXQoJy4nKVswXSwgcmVuZGVySWQpO1xuICAgICAgICAgIGZvciAocCBpbiBtYXBzLmJpbmRzKSBpZiAoaXRlci5hbGlhcy5pbmRleE9mKHApID09PSAtMSlcbiAgICAgICAgICAgIGJ1Y2tldChiaW5kcywgcCwgcmVuZGVySWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEJpbmQgbm9kZSB0ZXh0LlxuICAgICAgICAgIG1hcFRleHROb2RlcyhlbF8pO1xuICAgICAgICB9XG4gICAgICAgIC8vIEJpbmQgbm9kZSBhdHRyaWJ1dGVzIGlmIG5vdCBhIDxmb3I+LlxuICAgICAgICBpZiAoZWxfLnRhZ05hbWUgIT09ICdGT1InKSBmb3IgKGkgPSBlbF8uYXR0cmlidXRlcy5sZW5ndGg7IGktLTspXG4gICAgICAgICAgbWFwQXR0cmlidXRlKGVsXywgZWxfLmF0dHJpYnV0ZXNbaV0pO1xuICAgICAgICAvLyBTdG9wIHJlY3Vyc2lvbiBpZiBpdGVyYXRvci5cbiAgICAgICAgcmV0dXJuICFpdGVyO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4ge29yaWc6b3JpZywgYmluZHM6YmluZHMsIHJlYmluZHM6cmViaW5kcywgcmVuZGVyczpyZW5kZXJzfTtcbiAgICB9XG4gICAgcmV0dXJuIGNyZWF0ZVByb3h5KHRyYXZlcnNlKGVsLCBtb2RlbCAmJiBleHRlbmQoe30sIG1vZGVsKSksIG1vZGVsKTtcbiAgfTtcbn0oKSk7XG4iLCJ2aXhlbiA9IHJlcXVpcmUgJ3ZpeGVuJ1xuU2hvd2Rvd24gPSByZXF1aXJlICdzaG93ZG93bidcbm1hcmtkb3duID0gbmV3IFNob3dkb3duLmNvbnZlcnRlcigpXG5cbnJlcXVpcmUgJy4vdW5pZnkuY29mZmVlJ1xuXG5zdGF0ZV8gPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcbnJlcXVpcmUgJy4vc3RhdGUtZ2lzdC5jb2ZmZWUnXG5cbntudW1iZXIsIGluZGV4LCB0b2N9ID0gcmVxdWlyZSAnLi91dGlscy5jb2ZmZWUnXG5cbmV4dGVuZCA9IChyPXt9LCBkKSAtPiByW2tdID0gdiBmb3IgaywgdiBvZiBkOyByXG5leHRlbmRBID0gKHI9e30sIGEpIC0+IHJba10gPSB2IGZvciBbaywgdl0gaW4gYTsgclxuXG5wcm94eSA9IChkaWN0KSAtPlxuICB2YXVsdF8gPSB7fVxuICBkZWZfID0gKHByb3AsIGZuKSAtPlxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgICBzZXQ6ICh2YWx1ZSkgLT5cbiAgICAgIG9sZCA9IHZhdWx0X1twcm9wXVxuICAgICAgdmF1bHRfW3Byb3BdID0gdmFsdWVcbiAgICAgIGZuIHZhbHVlLCBvbGRcbiAgICBnZXQ6IC0+IHZhdWx0X1twcm9wXVxuICBPYmplY3QuY3JlYXRlIE9iamVjdC5wcm90b3R5cGUsXG4gICAgZXh0ZW5kQSh7IHRvSlNPTjogdmFsdWU6IC0+IHZhdWx0XyB9LCAoW3Byb3AsIGRlZl8ocHJvcCwgZm4pXSBmb3IgcHJvcCwgZm4gb2YgZGljdCkpXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgdXBkYXRlVG9jID0gLT4gdG9jRWwuaW5uZXJIVE1MID0gdG9jIHZpZXdFbFxuICB1cGRhdGVJbmRleCA9IC0+IGluZGV4IG51bWJlciB2aWV3RWxcbiAgc2V0TW9kZSA9IChtb2RlKSAtPlxuICAgIG1vZGVsLm1vZGUgPSB7XG4gICAgICB3cml0ZTogJ2Z1bGwtaW5wdXQnXG4gICAgICByZWFkOiAnZnVsbC12aWV3J1xuICAgIH1bbW9kZV0gb3IgJydcbiAgc2V0VG9jID0gKHRvKSAtPlxuICAgIHVwZGF0ZVRvYygpIGlmIHRvXG4gICAgbW9kZWwuc2hvd1RvYyA9IGlmIHRvIHRoZW4gJ3RvYycgZWxzZSAnJ1xuICBzZXRJbmRleCA9ICh0bykgLT5cbiAgICBpZiB0b1xuICAgICAgaWYgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3ZpZXcgW2RhdGEtbnVtYmVyXScpLmxlbmd0aCBpcyAwXG4gICAgICAgIHVwZGF0ZUluZGV4KClcbiAgICAgICAgdXBkYXRlVG9jKCkgaWYgc3RhdGUudG9jXG4gICAgICBtb2RlbC5zaG93SW5kZXggPSAnaW5kZXhlZCdcbiAgICBlbHNlXG4gICAgICBtb2RlbC5zaG93SW5kZXggPSAnJ1xuXG4gIHN0YXRlID0gcHJveHlcbiAgICB0b2M6IHNldFRvY1xuICAgIGluZGV4OiBzZXRJbmRleFxuICAgIG1vZGU6IHNldE1vZGVcbiAgI3N0YXRlLm9uICdjaGFuZ2UnLCAtPiB1cGRhdGVTdGF0dXMgeWVzXG5cbiAgdG9jRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG9jJ1xuICB2aWV3RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndmlldydcbiAgdmlld1dyYXBFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd2aWV3LXdyYXAnXG5cbiAgZG9jVGl0bGUgPSAtPlxuICAgIHRtcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgICB0bXAuaW5uZXJIVE1MID0gaWYgKGggPSB2aWV3RWwucXVlcnlTZWxlY3RvckFsbCgnaDEsaDIsaDMnKVswXSlcbiAgICAgIGguaW5uZXJIVE1MXG4gICAgZWxzZVxuICAgICAgJ1VudGl0bGVkJ1xuICAgIFtdLmZvckVhY2guY2FsbCB0bXAucXVlcnlTZWxlY3RvckFsbCgnLmluZGV4JyksIChlbCkgLT4gdG1wLnJlbW92ZUNoaWxkIGVsXG4gICAgdG1wLnRleHRDb250ZW50XG5cbiAgc2F2ZWQgPSB5ZXNcblxuICB1cGRhdGVTdGF0dXMgPSAoZm9yY2UpIC0+XG4gICAgaWYgbm90IHNhdmVkIG9yIGZvcmNlXG4gICAgICBzdGF0ZV8uc3RvcmUgbnVsbCwgdGV4dDplZGl0b3IuZ2V0VmFsdWUoKSwgc3RhdGU6c3RhdGVcbiAgICAgICNzdGF0ZS5nZW5lcmF0ZUhhc2ggJ2Jhc2U2NCcsIGVkaXRvci5nZXRWYWx1ZSgpLCAoaGFzaCkgLT5cbiAgICAgICMgIGxvY2F0aW9uLmhhc2ggPSBoYXNoXG4gICAgICBkb2N1bWVudC50aXRsZSA9IGRvY1RpdGxlKClcbiAgICAgIHNhdmVkID0geWVzXG5cbiAgY3Vyc29yVG9rZW4gPSAnXl5eY3Vyc29yXl5eJ1xuICB1cGRhdGVWaWV3ID0gLT5cbiAgICBjbGluZSA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lXG4gICAgbWQgPSBlZGl0b3IuZ2V0VmFsdWUoKS5zcGxpdCAnXFxuJ1xuICAgIG1kW2NsaW5lXSArPSBjdXJzb3JUb2tlblxuICAgIG1kID0gbWQuam9pbiAnXFxuJ1xuICAgIHYgPSB2aWV3RWxcbiAgICB2LmlubmVySFRNTCA9IG1hcmtkb3duLm1ha2VIdG1sKG1kKS5yZXBsYWNlKGN1cnNvclRva2VuLCAnPHNwYW4gaWQ9XCJjdXJzb3JcIj48L3NwYW4+JylcbiAgICB1cGRhdGVJbmRleCgpIGlmIHN0YXRlLmluZGV4XG4gICAgdXBkYXRlVG9jKCkgaWYgc3RhdGUudG9jXG4gICAgc2Nyb2xsVG9wID0gdmlld1dyYXBFbC5zY3JvbGxUb3BcbiAgICB2aWV3SGVpZ2h0ID0gdmlld1dyYXBFbC5vZmZzZXRIZWlnaHRcbiAgICBjdXJzb3JTcGFuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2N1cnNvcidcbiAgICBjdXJzb3JUb3AgPSBjdXJzb3JTcGFuLm9mZnNldFRvcFxuICAgIGN1cnNvckhlaWdodCA9IGN1cnNvclNwYW4ub2Zmc2V0SGVpZ2h0XG4gICAgaWYgY3Vyc29yVG9wIDwgc2Nyb2xsVG9wIG9yIGN1cnNvclRvcCA+IHNjcm9sbFRvcCArIHZpZXdIZWlnaHQgLSBjdXJzb3JIZWlnaHRcbiAgICAgIHZpZXdXcmFwRWwuc2Nyb2xsVG9wID0gY3Vyc29yVG9wIC0gdmlld0hlaWdodC8yXG5cbiAgc2F2ZVRpbWVyID0gbnVsbFxuICBlZGl0b3IgPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtbWQnKSxcbiAgICBtb2RlOiAnZ2ZtJ1xuICAgIHRoZW1lOiAnZGVmYXVsdCdcbiAgICBsaW5lTnVtYmVyczogbm9cbiAgICBsaW5lV3JhcHBpbmc6IHllc1xuICAgIG9uQ2hhbmdlOiAtPlxuICAgICAgdXBkYXRlVmlldygpXG4gICAgICBzYXZlZCA9IG5vXG4gICAgICBjbGVhclRpbWVvdXQgc2F2ZVRpbWVyXG4gICAgICBzYXZlVGltZXIgPSBzZXRUaW1lb3V0IHVwZGF0ZVN0YXR1cywgNTAwMFxuICAgIG9uRHJhZ0V2ZW50OiAoZWRpdG9yLCBldmVudCkgLT5cbiAgICAgIHNob3dEbmQgPSBubyBpZiBzaG93RG5kIG9yIGV2ZW50LnR5cGUgaXMgJ2Ryb3AnXG4gICAgICBmYWxzZVxuXG4gIHNldFN0YXRlID0gKGRhdGEpIC0+XG4gICAgeyB0ZXh0LCBzdGF0ZTpzdGF0ZV9fIH0gPSBkYXRhXG4gICAgZXh0ZW5kIHN0YXRlLCBzdGF0ZV9fIG9yIHt9XG4gICAgZWRpdG9yLnNldFZhbHVlIHRleHQgaWYgdGV4dD8gYW5kIHRleHQgaXNudCBlZGl0b3IuZ2V0VmFsdWUoKVxuICAgICNzZXRNb2RlIHN0YXRlLm1vZGVcbiAgICAjc2V0SW5kZXggc3RhdGUuaW5kZXhcbiAgICAjc2V0VG9jIHN0YXRlLnRvY1xuICAgIG1vZGVsLnRoZW1lID0gc3RhdGUudGhlbWUgb3IgJ3NlcmlmJ1xuXG4gICN3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAnaGFzaGNoYW5nZScsIHNldFN0YXRlXG5cbiAgbW9kZWwgPVxuICAgIHNob3c6ICh2KSAtPiBpZiB2IHRoZW4gJycgZWxzZSAnaGlkZSdcbiAgICBoaWRlOiAodikgLT4gaWYgdiB0aGVuICdoaWRlJyBlbHNlICcnXG4gICAgc2hvd0Rvd25sb2FkOiBCbG9iP1xuICAgIGRvd25sb2FkOiAtPlxuICAgICAgc2F2ZUFzIG5ldyBCbG9iKFtlZGl0b3IuZ2V0VmFsdWUoKV0sIHR5cGU6ICd0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgnKSxcbiAgICAgICAgZG9jVGl0bGUoKSsnLm1kJ1xuICAgIGxpbmtCNjQ6IC0+XG4gICAgICB1cGRhdGVTdGF0dXMoKVxuICAgICAgcHJvbXB0ICdDb3B5IHRoaXMnLCBsb2NhdGlvbi5ocmVmXG4gICAgICAjbW9kZWwubGlua0NvcHkgPSBsb2NhdGlvbi5ocmVmXG4gICAgICAjbW9kZWwuc2hvd0xpbmtDb3B5ID0gdHJ1ZVxuICAgICAgIy5mb2N1cygpXG4gICAgICAjLmJsdXIgLT4gJChAKS5hZGRDbGFzcygnaGlkZGVuJylcbiAgICBwcmludDogLT4gd2luZG93LnByaW50KClcbiAgICBtb2RlOiAnJ1xuICAgIHRvZ2dsZVRvYzogLT4gc3RhdGUudG9jID0gbm90IHN0YXRlLnRvY1xuICAgIHRvZ2dsZUluZGV4OiAtPiBzdGF0ZS5pbmRleCA9IG5vdCBzdGF0ZS5pbmRleFxuICAgIGV4cGFuZElucHV0OiAtPlxuICAgICAgc3RhdGUubW9kZSA9IChpZiBzdGF0ZS5tb2RlIHRoZW4gJycgZWxzZSAnd3JpdGUnKVxuICAgIGV4cGFuZFZpZXc6IC0+XG4gICAgICBzdGF0ZS5tb2RlID0gKGlmIHN0YXRlLm1vZGUgdGhlbiAnJyBlbHNlICdyZWFkJylcbiAgICBtb3VzZW91dDogKGUpIC0+XG4gICAgICBmcm9tID0gZS5yZWxhdGVkVGFyZ2V0IG9yIGUudG9FbGVtZW50XG4gICAgICB1cGRhdGVTdGF0dXMoKSBpZiBub3QgZnJvbSBvciBmcm9tLm5vZGVOYW1lIGlzICdIVE1MJ1xuICAgIGtleXByZXNzOiAoZSkgLT5cbiAgICAgIGlmIGUuY3RybEtleSBhbmQgZS5hbHRLZXlcbiAgICAgICAgaWYgZS5rZXlDb2RlIGlzIDI0ICMgY3RybCthbHQreFxuICAgICAgICAgIHN0YXRlLm1vZGUgPSAnd3JpdGUnXG4gICAgICAgIGVsc2UgaWYgZS5rZXlDb2RlIGlzIDMgIyBjdHJsK2FsdCtjXG4gICAgICAgICAgc3RhdGUubW9kZSA9ICcnXG4gICAgICAgIGVsc2UgaWYgZS5rZXlDb2RlIGlzIDIyICMgY3RybCthbHQrdlxuICAgICAgICAgIHN0YXRlLm1vZGUgPSAncmVhZCdcblxuICBzdGF0ZV8ucmVzdG9yZSBudWxsLCBudWxsLCBzZXRTdGF0ZVxuICBzdGF0ZV8ub24gJ3Jlc3RvcmUnLCBzZXRTdGF0ZVxuXG4gIHNob3dEbmQgPSBubyBpZiBub3QgZWRpdG9yLmdldFZhbHVlKClcbiAgIyQoJyNpbnB1dC13cmFwJykub25lICdjbGljaycsIC0+ICQoJyNkcmFnLW4tZHJvcC13cmFwJykucmVtb3ZlKClcblxuICB2aXhlbihkb2N1bWVudC5ib2R5LnBhcmVudE5vZGUsIG1vZGVsKVxuXG4gIHVwZGF0ZVZpZXcoKVxuICAjdXBkYXRlU3RhdHVzKClcbiIsIihmdW5jdGlvbigpey8vXG4vLyBzaG93ZG93bi5qcyAtLSBBIGphdmFzY3JpcHQgcG9ydCBvZiBNYXJrZG93bi5cbi8vXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDcgSm9obiBGcmFzZXIuXG4vL1xuLy8gT3JpZ2luYWwgTWFya2Rvd24gQ29weXJpZ2h0IChjKSAyMDA0LTIwMDUgSm9obiBHcnViZXJcbi8vICAgPGh0dHA6Ly9kYXJpbmdmaXJlYmFsbC5uZXQvcHJvamVjdHMvbWFya2Rvd24vPlxuLy9cbi8vIFJlZGlzdHJpYnV0YWJsZSB1bmRlciBhIEJTRC1zdHlsZSBvcGVuIHNvdXJjZSBsaWNlbnNlLlxuLy8gU2VlIGxpY2Vuc2UudHh0IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuLy9cbi8vIFRoZSBmdWxsIHNvdXJjZSBkaXN0cmlidXRpb24gaXMgYXQ6XG4vL1xuLy9cdFx0XHRcdEEgQSBMXG4vL1x0XHRcdFx0VCBDIEFcbi8vXHRcdFx0XHRUIEsgQlxuLy9cbi8vICAgPGh0dHA6Ly93d3cuYXR0YWNrbGFiLm5ldC8+XG4vL1xuXG4vL1xuLy8gV2hlcmV2ZXIgcG9zc2libGUsIFNob3dkb3duIGlzIGEgc3RyYWlnaHQsIGxpbmUtYnktbGluZSBwb3J0XG4vLyBvZiB0aGUgUGVybCB2ZXJzaW9uIG9mIE1hcmtkb3duLlxuLy9cbi8vIFRoaXMgaXMgbm90IGEgbm9ybWFsIHBhcnNlciBkZXNpZ247IGl0J3MgYmFzaWNhbGx5IGp1c3QgYVxuLy8gc2VyaWVzIG9mIHN0cmluZyBzdWJzdGl0dXRpb25zLiAgSXQncyBoYXJkIHRvIHJlYWQgYW5kXG4vLyBtYWludGFpbiB0aGlzIHdheSwgIGJ1dCBrZWVwaW5nIFNob3dkb3duIGNsb3NlIHRvIHRoZSBvcmlnaW5hbFxuLy8gZGVzaWduIG1ha2VzIGl0IGVhc2llciB0byBwb3J0IG5ldyBmZWF0dXJlcy5cbi8vXG4vLyBNb3JlIGltcG9ydGFudGx5LCBTaG93ZG93biBiZWhhdmVzIGxpa2UgbWFya2Rvd24ucGwgaW4gbW9zdFxuLy8gZWRnZSBjYXNlcy4gIFNvIHdlYiBhcHBsaWNhdGlvbnMgY2FuIGRvIGNsaWVudC1zaWRlIHByZXZpZXdcbi8vIGluIEphdmFzY3JpcHQsIGFuZCB0aGVuIGJ1aWxkIGlkZW50aWNhbCBIVE1MIG9uIHRoZSBzZXJ2ZXIuXG4vL1xuLy8gVGhpcyBwb3J0IG5lZWRzIHRoZSBuZXcgUmVnRXhwIGZ1bmN0aW9uYWxpdHkgb2YgRUNNQSAyNjIsXG4vLyAzcmQgRWRpdGlvbiAoaS5lLiBKYXZhc2NyaXB0IDEuNSkuICBNb3N0IG1vZGVybiB3ZWIgYnJvd3NlcnNcbi8vIHNob3VsZCBkbyBmaW5lLiAgRXZlbiB3aXRoIHRoZSBuZXcgcmVndWxhciBleHByZXNzaW9uIGZlYXR1cmVzLFxuLy8gV2UgZG8gYSBsb3Qgb2Ygd29yayB0byBlbXVsYXRlIFBlcmwncyByZWdleCBmdW5jdGlvbmFsaXR5LlxuLy8gVGhlIHRyaWNreSBjaGFuZ2VzIGluIHRoaXMgZmlsZSBtb3N0bHkgaGF2ZSB0aGUgXCJhdHRhY2tsYWI6XCJcbi8vIGxhYmVsLiAgTWFqb3Igb3Igc2VsZi1leHBsYW5hdG9yeSBjaGFuZ2VzIGRvbid0LlxuLy9cbi8vIFNtYXJ0IGRpZmYgdG9vbHMgbGlrZSBBcmF4aXMgTWVyZ2Ugd2lsbCBiZSBhYmxlIHRvIG1hdGNoIHVwXG4vLyB0aGlzIGZpbGUgd2l0aCBtYXJrZG93bi5wbCBpbiBhIHVzZWZ1bCB3YXkuICBBIGxpdHRsZSB0d2Vha2luZ1xuLy8gaGVscHM6IGluIGEgY29weSBvZiBtYXJrZG93bi5wbCwgcmVwbGFjZSBcIiNcIiB3aXRoIFwiLy9cIiBhbmRcbi8vIHJlcGxhY2UgXCIkdGV4dFwiIHdpdGggXCJ0ZXh0XCIuICBCZSBzdXJlIHRvIGlnbm9yZSB3aGl0ZXNwYWNlXG4vLyBhbmQgbGluZSBlbmRpbmdzLlxuLy9cblxuXG4vL1xuLy8gU2hvd2Rvd24gdXNhZ2U6XG4vL1xuLy8gICB2YXIgdGV4dCA9IFwiTWFya2Rvd24gKnJvY2tzKi5cIjtcbi8vXG4vLyAgIHZhciBjb252ZXJ0ZXIgPSBuZXcgU2hvd2Rvd24uY29udmVydGVyKCk7XG4vLyAgIHZhciBodG1sID0gY29udmVydGVyLm1ha2VIdG1sKHRleHQpO1xuLy9cbi8vICAgYWxlcnQoaHRtbCk7XG4vL1xuLy8gTm90ZTogbW92ZSB0aGUgc2FtcGxlIGNvZGUgdG8gdGhlIGJvdHRvbSBvZiB0aGlzXG4vLyBmaWxlIGJlZm9yZSB1bmNvbW1lbnRpbmcgaXQuXG4vL1xuXG5cbi8vXG4vLyBTaG93ZG93biBuYW1lc3BhY2Vcbi8vXG52YXIgU2hvd2Rvd24gPSB7fTtcblxuLy9cbi8vIGNvbnZlcnRlclxuLy9cbi8vIFdyYXBzIGFsbCBcImdsb2JhbHNcIiBzbyB0aGF0IHRoZSBvbmx5IHRoaW5nXG4vLyBleHBvc2VkIGlzIG1ha2VIdG1sKCkuXG4vL1xuU2hvd2Rvd24uY29udmVydGVyID0gZnVuY3Rpb24oKSB7XG5cbi8vXG4vLyBHbG9iYWxzOlxuLy9cblxuLy8gR2xvYmFsIGhhc2hlcywgdXNlZCBieSB2YXJpb3VzIHV0aWxpdHkgcm91dGluZXNcbnZhciBnX3VybHM7XG52YXIgZ190aXRsZXM7XG52YXIgZ19odG1sX2Jsb2NrcztcblxuLy8gVXNlZCB0byB0cmFjayB3aGVuIHdlJ3JlIGluc2lkZSBhbiBvcmRlcmVkIG9yIHVub3JkZXJlZCBsaXN0XG4vLyAoc2VlIF9Qcm9jZXNzTGlzdEl0ZW1zKCkgZm9yIGRldGFpbHMpOlxudmFyIGdfbGlzdF9sZXZlbCA9IDA7XG5cblxudGhpcy5tYWtlSHRtbCA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBNYWluIGZ1bmN0aW9uLiBUaGUgb3JkZXIgaW4gd2hpY2ggb3RoZXIgc3VicyBhcmUgY2FsbGVkIGhlcmUgaXNcbi8vIGVzc2VudGlhbC4gTGluayBhbmQgaW1hZ2Ugc3Vic3RpdHV0aW9ucyBuZWVkIHRvIGhhcHBlbiBiZWZvcmVcbi8vIF9Fc2NhcGVTcGVjaWFsQ2hhcnNXaXRoaW5UYWdBdHRyaWJ1dGVzKCksIHNvIHRoYXQgYW55IConcyBvciBfJ3MgaW4gdGhlIDxhPlxuLy8gYW5kIDxpbWc+IHRhZ3MgZ2V0IGVuY29kZWQuXG4vL1xuXG5cdC8vIENsZWFyIHRoZSBnbG9iYWwgaGFzaGVzLiBJZiB3ZSBkb24ndCBjbGVhciB0aGVzZSwgeW91IGdldCBjb25mbGljdHNcblx0Ly8gZnJvbSBvdGhlciBhcnRpY2xlcyB3aGVuIGdlbmVyYXRpbmcgYSBwYWdlIHdoaWNoIGNvbnRhaW5zIG1vcmUgdGhhblxuXHQvLyBvbmUgYXJ0aWNsZSAoZS5nLiBhbiBpbmRleCBwYWdlIHRoYXQgc2hvd3MgdGhlIE4gbW9zdCByZWNlbnRcblx0Ly8gYXJ0aWNsZXMpOlxuXHRnX3VybHMgPSBuZXcgQXJyYXkoKTtcblx0Z190aXRsZXMgPSBuZXcgQXJyYXkoKTtcblx0Z19odG1sX2Jsb2NrcyA9IG5ldyBBcnJheSgpO1xuXG5cdC8vIGF0dGFja2xhYjogUmVwbGFjZSB+IHdpdGggflRcblx0Ly8gVGhpcyBsZXRzIHVzIHVzZSB0aWxkZSBhcyBhbiBlc2NhcGUgY2hhciB0byBhdm9pZCBtZDUgaGFzaGVzXG5cdC8vIFRoZSBjaG9pY2Ugb2YgY2hhcmFjdGVyIGlzIGFyYml0cmF5OyBhbnl0aGluZyB0aGF0IGlzbid0XG4gICAgLy8gbWFnaWMgaW4gTWFya2Rvd24gd2lsbCB3b3JrLlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+L2csXCJ+VFwiKTtcblxuXHQvLyBhdHRhY2tsYWI6IFJlcGxhY2UgJCB3aXRoIH5EXG5cdC8vIFJlZ0V4cCBpbnRlcnByZXRzICQgYXMgYSBzcGVjaWFsIGNoYXJhY3RlclxuXHQvLyB3aGVuIGl0J3MgaW4gYSByZXBsYWNlbWVudCBzdHJpbmdcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFwkL2csXCJ+RFwiKTtcblxuXHQvLyBTdGFuZGFyZGl6ZSBsaW5lIGVuZGluZ3Ncblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7IC8vIERPUyB0byBVbml4XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcci9nLFwiXFxuXCIpOyAvLyBNYWMgdG8gVW5peFxuXG5cdC8vIE1ha2Ugc3VyZSB0ZXh0IGJlZ2lucyBhbmQgZW5kcyB3aXRoIGEgY291cGxlIG9mIG5ld2xpbmVzOlxuXHR0ZXh0ID0gXCJcXG5cXG5cIiArIHRleHQgKyBcIlxcblxcblwiO1xuXG5cdC8vIENvbnZlcnQgYWxsIHRhYnMgdG8gc3BhY2VzLlxuXHR0ZXh0ID0gX0RldGFiKHRleHQpO1xuXG5cdC8vIFN0cmlwIGFueSBsaW5lcyBjb25zaXN0aW5nIG9ubHkgb2Ygc3BhY2VzIGFuZCB0YWJzLlxuXHQvLyBUaGlzIG1ha2VzIHN1YnNlcXVlbnQgcmVnZXhlbiBlYXNpZXIgdG8gd3JpdGUsIGJlY2F1c2Ugd2UgY2FuXG5cdC8vIG1hdGNoIGNvbnNlY3V0aXZlIGJsYW5rIGxpbmVzIHdpdGggL1xcbisvIGluc3RlYWQgb2Ygc29tZXRoaW5nXG5cdC8vIGNvbnRvcnRlZCBsaWtlIC9bIFxcdF0qXFxuKy8gLlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBcXHRdKyQvbWcsXCJcIik7XG5cblx0Ly8gSGFuZGxlIGdpdGh1YiBjb2RlYmxvY2tzIHByaW9yIHRvIHJ1bm5pbmcgSGFzaEhUTUwgc28gdGhhdFxuXHQvLyBIVE1MIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNvZGVibG9jayBnZXRzIGVzY2FwZWQgcHJvcGVydGx5XG5cdHRleHQgPSBfRG9HaXRodWJDb2RlQmxvY2tzKHRleHQpO1xuXG5cdC8vIFR1cm4gYmxvY2stbGV2ZWwgSFRNTCBibG9ja3MgaW50byBoYXNoIGVudHJpZXNcblx0dGV4dCA9IF9IYXNoSFRNTEJsb2Nrcyh0ZXh0KTtcblxuXHQvLyBTdHJpcCBsaW5rIGRlZmluaXRpb25zLCBzdG9yZSBpbiBoYXNoZXMuXG5cdHRleHQgPSBfU3RyaXBMaW5rRGVmaW5pdGlvbnModGV4dCk7XG5cblx0dGV4dCA9IF9SdW5CbG9ja0dhbXV0KHRleHQpO1xuXG5cdHRleHQgPSBfVW5lc2NhcGVTcGVjaWFsQ2hhcnModGV4dCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXN0b3JlIGRvbGxhciBzaWduc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+RC9nLFwiJCRcIik7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXN0b3JlIHRpbGRlc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+VC9nLFwiflwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn07XG5cblxudmFyIF9TdHJpcExpbmtEZWZpbml0aW9ucyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBTdHJpcHMgbGluayBkZWZpbml0aW9ucyBmcm9tIHRleHQsIHN0b3JlcyB0aGUgVVJMcyBhbmQgdGl0bGVzIGluXG4vLyBoYXNoIHJlZmVyZW5jZXMuXG4vL1xuXG5cdC8vIExpbmsgZGVmcyBhcmUgaW4gdGhlIGZvcm06IF5baWRdOiB1cmwgXCJvcHRpb25hbCB0aXRsZVwiXG5cblx0Lypcblx0XHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHRcdF5bIF17MCwzfVxcWyguKylcXF06ICAvLyBpZCA9ICQxICBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0ICBcXG4/XHRcdFx0XHQvLyBtYXliZSAqb25lKiBuZXdsaW5lXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQ8PyhcXFMrPyk+P1x0XHRcdC8vIHVybCA9ICQyXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQgIFxcbj9cdFx0XHRcdC8vIG1heWJlIG9uZSBuZXdsaW5lXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQoPzpcblx0XHRcdFx0ICAoXFxuKilcdFx0XHRcdC8vIGFueSBsaW5lcyBza2lwcGVkID0gJDMgYXR0YWNrbGFiOiBsb29rYmVoaW5kIHJlbW92ZWRcblx0XHRcdFx0ICBbXCIoXVxuXHRcdFx0XHQgICguKz8pXHRcdFx0XHQvLyB0aXRsZSA9ICQ0XG5cdFx0XHRcdCAgW1wiKV1cblx0XHRcdFx0ICBbIFxcdF0qXG5cdFx0XHRcdCk/XHRcdFx0XHRcdC8vIHRpdGxlIGlzIG9wdGlvbmFsXG5cdFx0XHRcdCg/Olxcbit8JClcblx0XHRcdCAgL2dtLFxuXHRcdFx0ICBmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDN9XFxbKC4rKVxcXTpbIFxcdF0qXFxuP1sgXFx0XSo8PyhcXFMrPyk+P1sgXFx0XSpcXG4/WyBcXHRdKig/OihcXG4qKVtcIihdKC4rPylbXCIpXVsgXFx0XSopPyg/Olxcbit8XFxaKS9nbSxcblx0XHRmdW5jdGlvbiAod2hvbGVNYXRjaCxtMSxtMixtMyxtNCkge1xuXHRcdFx0bTEgPSBtMS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0Z191cmxzW20xXSA9IF9FbmNvZGVBbXBzQW5kQW5nbGVzKG0yKTsgIC8vIExpbmsgSURzIGFyZSBjYXNlLWluc2Vuc2l0aXZlXG5cdFx0XHRpZiAobTMpIHtcblx0XHRcdFx0Ly8gT29wcywgZm91bmQgYmxhbmsgbGluZXMsIHNvIGl0J3Mgbm90IGEgdGl0bGUuXG5cdFx0XHRcdC8vIFB1dCBiYWNrIHRoZSBwYXJlbnRoZXRpY2FsIHN0YXRlbWVudCB3ZSBzdG9sZS5cblx0XHRcdFx0cmV0dXJuIG0zK200O1xuXHRcdFx0fSBlbHNlIGlmIChtNCkge1xuXHRcdFx0XHRnX3RpdGxlc1ttMV0gPSBtNC5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb21wbGV0ZWx5IHJlbW92ZSB0aGUgZGVmaW5pdGlvbiBmcm9tIHRoZSB0ZXh0XG5cdFx0XHRyZXR1cm4gXCJcIjtcblx0XHR9XG5cdCk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9IYXNoSFRNTEJsb2NrcyA9IGZ1bmN0aW9uKHRleHQpIHtcblx0Ly8gYXR0YWNrbGFiOiBEb3VibGUgdXAgYmxhbmsgbGluZXMgdG8gcmVkdWNlIGxvb2thcm91bmRcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxuL2csXCJcXG5cXG5cIik7XG5cblx0Ly8gSGFzaGlmeSBIVE1MIGJsb2Nrczpcblx0Ly8gV2Ugb25seSB3YW50IHRvIGRvIHRoaXMgZm9yIGJsb2NrLWxldmVsIEhUTUwgdGFncywgc3VjaCBhcyBoZWFkZXJzLFxuXHQvLyBsaXN0cywgYW5kIHRhYmxlcy4gVGhhdCdzIGJlY2F1c2Ugd2Ugc3RpbGwgd2FudCB0byB3cmFwIDxwPnMgYXJvdW5kXG5cdC8vIFwicGFyYWdyYXBoc1wiIHRoYXQgYXJlIHdyYXBwZWQgaW4gbm9uLWJsb2NrLWxldmVsIHRhZ3MsIHN1Y2ggYXMgYW5jaG9ycyxcblx0Ly8gcGhyYXNlIGVtcGhhc2lzLCBhbmQgc3BhbnMuIFRoZSBsaXN0IG9mIHRhZ3Mgd2UncmUgbG9va2luZyBmb3IgaXNcblx0Ly8gaGFyZC1jb2RlZDpcblx0dmFyIGJsb2NrX3RhZ3NfYSA9IFwicHxkaXZ8aFsxLTZdfGJsb2NrcXVvdGV8cHJlfHRhYmxlfGRsfG9sfHVsfHNjcmlwdHxub3NjcmlwdHxmb3JtfGZpZWxkc2V0fGlmcmFtZXxtYXRofGluc3xkZWx8c3R5bGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyfG5hdnxhcnRpY2xlfGFzaWRlXCI7XG5cdHZhciBibG9ja190YWdzX2IgPSBcInB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxzdHlsZXxzZWN0aW9ufGhlYWRlcnxmb290ZXJ8bmF2fGFydGljbGV8YXNpZGVcIjtcblxuXHQvLyBGaXJzdCwgbG9vayBmb3IgbmVzdGVkIGJsb2NrcywgZS5nLjpcblx0Ly8gICA8ZGl2PlxuXHQvLyAgICAgPGRpdj5cblx0Ly8gICAgIHRhZ3MgZm9yIGlubmVyIGJsb2NrIG11c3QgYmUgaW5kZW50ZWQuXG5cdC8vICAgICA8L2Rpdj5cblx0Ly8gICA8L2Rpdj5cblx0Ly9cblx0Ly8gVGhlIG91dGVybW9zdCB0YWdzIG11c3Qgc3RhcnQgYXQgdGhlIGxlZnQgbWFyZ2luIGZvciB0aGlzIHRvIG1hdGNoLCBhbmRcblx0Ly8gdGhlIGlubmVyIG5lc3RlZCBkaXZzIG11c3QgYmUgaW5kZW50ZWQuXG5cdC8vIFdlIG5lZWQgdG8gZG8gdGhpcyBiZWZvcmUgdGhlIG5leHQsIG1vcmUgbGliZXJhbCBtYXRjaCwgYmVjYXVzZSB0aGUgbmV4dFxuXHQvLyBtYXRjaCB3aWxsIHN0YXJ0IGF0IHRoZSBmaXJzdCBgPGRpdj5gIGFuZCBzdG9wIGF0IHRoZSBmaXJzdCBgPC9kaXY+YC5cblxuXHQvLyBhdHRhY2tsYWI6IFRoaXMgcmVnZXggY2FuIGJlIGV4cGVuc2l2ZSB3aGVuIGl0IGZhaWxzLlxuXHQvKlxuXHRcdHZhciB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0Xlx0XHRcdFx0XHQvLyBzdGFydCBvZiBsaW5lICAod2l0aCAvbSlcblx0XHRcdDwoJGJsb2NrX3RhZ3NfYSlcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQga2h0bWwvcGNyZSBidWcuLi5cblx0XHRcdFteXFxyXSo/XFxuXHRcdFx0Ly8gYW55IG51bWJlciBvZiBsaW5lcywgbWluaW1hbGx5IG1hdGNoaW5nXG5cdFx0XHQ8L1xcMj5cdFx0XHRcdC8vIHRoZSBtYXRjaGluZyBlbmQgdGFnXG5cdFx0XHRbIFxcdF0qXHRcdFx0XHQvLyB0cmFpbGluZyBzcGFjZXMvdGFic1xuXHRcdFx0KD89XFxuKylcdFx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgbmV3bGluZVxuXHRcdClcdFx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IHRoZXJlIGFyZSBzZW50aW5lbCBuZXdsaW5lcyBhdCBlbmQgb2YgZG9jdW1lbnRcblx0XHQvZ20sZnVuY3Rpb24oKXsuLi59fTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXig8KHB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxpbnN8ZGVsKVxcYlteXFxyXSo/XFxuPFxcL1xcMj5bIFxcdF0qKD89XFxuKykpL2dtLGhhc2hFbGVtZW50KTtcblxuXHQvL1xuXHQvLyBOb3cgbWF0Y2ggbW9yZSBsaWJlcmFsbHksIHNpbXBseSBmcm9tIGBcXG48dGFnPmAgdG8gYDwvdGFnPlxcbmBcblx0Ly9cblxuXHQvKlxuXHRcdHZhciB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0Xlx0XHRcdFx0XHQvLyBzdGFydCBvZiBsaW5lICAod2l0aCAvbSlcblx0XHRcdDwoJGJsb2NrX3RhZ3NfYilcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQga2h0bWwvcGNyZSBidWcuLi5cblx0XHRcdFteXFxyXSo/XHRcdFx0XHQvLyBhbnkgbnVtYmVyIG9mIGxpbmVzLCBtaW5pbWFsbHkgbWF0Y2hpbmdcblx0XHRcdC4qPC9cXDI+XHRcdFx0XHQvLyB0aGUgbWF0Y2hpbmcgZW5kIHRhZ1xuXHRcdFx0WyBcXHRdKlx0XHRcdFx0Ly8gdHJhaWxpbmcgc3BhY2VzL3RhYnNcblx0XHRcdCg/PVxcbispXHRcdFx0XHQvLyBmb2xsb3dlZCBieSBhIG5ld2xpbmVcblx0XHQpXHRcdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB0aGVyZSBhcmUgc2VudGluZWwgbmV3bGluZXMgYXQgZW5kIG9mIGRvY3VtZW50XG5cdFx0L2dtLGZ1bmN0aW9uKCl7Li4ufX07XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oPChwfGRpdnxoWzEtNl18YmxvY2txdW90ZXxwcmV8dGFibGV8ZGx8b2x8dWx8c2NyaXB0fG5vc2NyaXB0fGZvcm18ZmllbGRzZXR8aWZyYW1lfG1hdGh8c3R5bGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyfG5hdnxhcnRpY2xlfGFzaWRlKVxcYlteXFxyXSo/Lio8XFwvXFwyPlsgXFx0XSooPz1cXG4rKVxcbikvZ20saGFzaEVsZW1lbnQpO1xuXG5cdC8vIFNwZWNpYWwgY2FzZSBqdXN0IGZvciA8aHIgLz4uIEl0IHdhcyBlYXNpZXIgdG8gbWFrZSBhIHNwZWNpYWwgY2FzZSB0aGFuXG5cdC8vIHRvIG1ha2UgdGhlIG90aGVyIHJlZ2V4IG1vcmUgY29tcGxpY2F0ZWQuXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0XFxuXFxuXHRcdFx0XHQvLyBTdGFydGluZyBhZnRlciBhIGJsYW5rIGxpbmVcblx0XHRcdFsgXXswLDN9XG5cdFx0XHQoPChocilcdFx0XHRcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0KFtePD5dKSo/XHRcdFx0Ly9cblx0XHRcdFxcLz8+KVx0XHRcdFx0Ly8gdGhlIG1hdGNoaW5nIGVuZCB0YWdcblx0XHRcdFsgXFx0XSpcblx0XHRcdCg/PVxcbnsyLH0pXHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdC9nLGhhc2hFbGVtZW50KTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcblsgXXswLDN9KDwoaHIpXFxiKFtePD5dKSo/XFwvPz4pWyBcXHRdKig/PVxcbnsyLH0pKS9nLGhhc2hFbGVtZW50KTtcblxuXHQvLyBTcGVjaWFsIGNhc2UgZm9yIHN0YW5kYWxvbmUgSFRNTCBjb21tZW50czpcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyBzYXZlIGluICQxXG5cdFx0XHRcXG5cXG5cdFx0XHRcdC8vIFN0YXJ0aW5nIGFmdGVyIGEgYmxhbmsgbGluZVxuXHRcdFx0WyBdezAsM31cdFx0XHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0PCFcblx0XHRcdCgtLVteXFxyXSo/LS1cXHMqKStcblx0XHRcdD5cblx0XHRcdFsgXFx0XSpcblx0XHRcdCg/PVxcbnsyLH0pXHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdC9nLGhhc2hFbGVtZW50KTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcblxcblsgXXswLDN9PCEoLS1bXlxccl0qPy0tXFxzKikrPlsgXFx0XSooPz1cXG57Mix9KSkvZyxoYXNoRWxlbWVudCk7XG5cblx0Ly8gUEhQIGFuZCBBU1Atc3R5bGUgcHJvY2Vzc29yIGluc3RydWN0aW9ucyAoPD8uLi4/PiBhbmQgPCUuLi4lPilcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdCg/OlxuXHRcdFx0XFxuXFxuXHRcdFx0XHQvLyBTdGFydGluZyBhZnRlciBhIGJsYW5rIGxpbmVcblx0XHQpXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdFsgXXswLDN9XHRcdFx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdCg/OlxuXHRcdFx0XHQ8KFs/JV0pXHRcdFx0Ly8gJDJcblx0XHRcdFx0W15cXHJdKj9cblx0XHRcdFx0XFwyPlxuXHRcdFx0KVxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KD89XFxuezIsfSlcdFx0XHQvLyBmb2xsb3dlZCBieSBhIGJsYW5rIGxpbmVcblx0XHQpXG5cdFx0L2csaGFzaEVsZW1lbnQpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oPzpcXG5cXG4pKFsgXXswLDN9KD86PChbPyVdKVteXFxyXSo/XFwyPilbIFxcdF0qKD89XFxuezIsfSkpL2csaGFzaEVsZW1lbnQpO1xuXG5cdC8vIGF0dGFja2xhYjogVW5kbyBkb3VibGUgbGluZXMgKHNlZSBjb21tZW50IGF0IHRvcCBvZiB0aGlzIGZ1bmN0aW9uKVxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG5cXG4vZyxcIlxcblwiKTtcblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBoYXNoRWxlbWVudCA9IGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0dmFyIGJsb2NrVGV4dCA9IG0xO1xuXG5cdC8vIFVuZG8gZG91YmxlIGxpbmVzXG5cdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9cXG5cXG4vZyxcIlxcblwiKTtcblx0YmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL15cXG4vLFwiXCIpO1xuXG5cdC8vIHN0cmlwIHRyYWlsaW5nIGJsYW5rIGxpbmVzXG5cdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9cXG4rJC9nLFwiXCIpO1xuXG5cdC8vIFJlcGxhY2UgdGhlIGVsZW1lbnQgdGV4dCB3aXRoIGEgbWFya2VyIChcIn5LeEtcIiB3aGVyZSB4IGlzIGl0cyBrZXkpXG5cdGJsb2NrVGV4dCA9IFwiXFxuXFxufktcIiArIChnX2h0bWxfYmxvY2tzLnB1c2goYmxvY2tUZXh0KS0xKSArIFwiS1xcblxcblwiO1xuXG5cdHJldHVybiBibG9ja1RleHQ7XG59O1xuXG52YXIgX1J1bkJsb2NrR2FtdXQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVGhlc2UgYXJlIGFsbCB0aGUgdHJhbnNmb3JtYXRpb25zIHRoYXQgZm9ybSBibG9jay1sZXZlbFxuLy8gdGFncyBsaWtlIHBhcmFncmFwaHMsIGhlYWRlcnMsIGFuZCBsaXN0IGl0ZW1zLlxuLy9cblx0dGV4dCA9IF9Eb0hlYWRlcnModGV4dCk7XG5cblx0Ly8gRG8gSG9yaXpvbnRhbCBSdWxlczpcblx0dmFyIGtleSA9IGhhc2hCbG9jayhcIjxociAvPlwiKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXCpbIF0/KXszLH1bIFxcdF0qJC9nbSxrZXkpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBdezAsMn0oWyBdP1xcLVsgXT8pezMsfVsgXFx0XSokL2dtLGtleSk7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwyfShbIF0/XFxfWyBdPyl7Myx9WyBcXHRdKiQvZ20sa2V5KTtcblxuXHR0ZXh0ID0gX0RvTGlzdHModGV4dCk7XG5cdHRleHQgPSBfRG9Db2RlQmxvY2tzKHRleHQpO1xuXHR0ZXh0ID0gX0RvQmxvY2tRdW90ZXModGV4dCk7XG5cblx0Ly8gV2UgYWxyZWFkeSByYW4gX0hhc2hIVE1MQmxvY2tzKCkgYmVmb3JlLCBpbiBNYXJrZG93bigpLCBidXQgdGhhdFxuXHQvLyB3YXMgdG8gZXNjYXBlIHJhdyBIVE1MIGluIHRoZSBvcmlnaW5hbCBNYXJrZG93biBzb3VyY2UuIFRoaXMgdGltZSxcblx0Ly8gd2UncmUgZXNjYXBpbmcgdGhlIG1hcmt1cCB3ZSd2ZSBqdXN0IGNyZWF0ZWQsIHNvIHRoYXQgd2UgZG9uJ3Qgd3JhcFxuXHQvLyA8cD4gdGFncyBhcm91bmQgYmxvY2stbGV2ZWwgdGFncy5cblx0dGV4dCA9IF9IYXNoSFRNTEJsb2Nrcyh0ZXh0KTtcblx0dGV4dCA9IF9Gb3JtUGFyYWdyYXBocyh0ZXh0KTtcblxuXHRyZXR1cm4gdGV4dDtcbn07XG5cblxudmFyIF9SdW5TcGFuR2FtdXQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVGhlc2UgYXJlIGFsbCB0aGUgdHJhbnNmb3JtYXRpb25zIHRoYXQgb2NjdXIgKndpdGhpbiogYmxvY2stbGV2ZWxcbi8vIHRhZ3MgbGlrZSBwYXJhZ3JhcGhzLCBoZWFkZXJzLCBhbmQgbGlzdCBpdGVtcy5cbi8vXG5cblx0dGV4dCA9IF9Eb0NvZGVTcGFucyh0ZXh0KTtcblx0dGV4dCA9IF9Fc2NhcGVTcGVjaWFsQ2hhcnNXaXRoaW5UYWdBdHRyaWJ1dGVzKHRleHQpO1xuXHR0ZXh0ID0gX0VuY29kZUJhY2tzbGFzaEVzY2FwZXModGV4dCk7XG5cblx0Ly8gUHJvY2VzcyBhbmNob3IgYW5kIGltYWdlIHRhZ3MuIEltYWdlcyBtdXN0IGNvbWUgZmlyc3QsXG5cdC8vIGJlY2F1c2UgIVtmb29dW2ZdIGxvb2tzIGxpa2UgYW4gYW5jaG9yLlxuXHR0ZXh0ID0gX0RvSW1hZ2VzKHRleHQpO1xuXHR0ZXh0ID0gX0RvQW5jaG9ycyh0ZXh0KTtcblxuXHQvLyBNYWtlIGxpbmtzIG91dCBvZiB0aGluZ3MgbGlrZSBgPGh0dHA6Ly9leGFtcGxlLmNvbS8+YFxuXHQvLyBNdXN0IGNvbWUgYWZ0ZXIgX0RvQW5jaG9ycygpLCBiZWNhdXNlIHlvdSBjYW4gdXNlIDwgYW5kID5cblx0Ly8gZGVsaW1pdGVycyBpbiBpbmxpbmUgbGlua3MgbGlrZSBbdGhpc10oPHVybD4pLlxuXHR0ZXh0ID0gX0RvQXV0b0xpbmtzKHRleHQpO1xuXHR0ZXh0ID0gX0VuY29kZUFtcHNBbmRBbmdsZXModGV4dCk7XG5cdHRleHQgPSBfRG9JdGFsaWNzQW5kQm9sZCh0ZXh0KTtcblxuXHQvLyBEbyBoYXJkIGJyZWFrczpcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvICArXFxuL2csXCIgPGJyIC8+XFxuXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gV2l0aGluIHRhZ3MgLS0gbWVhbmluZyBiZXR3ZWVuIDwgYW5kID4gLS0gZW5jb2RlIFtcXCBgICogX10gc28gdGhleVxuLy8gZG9uJ3QgY29uZmxpY3Qgd2l0aCB0aGVpciB1c2UgaW4gTWFya2Rvd24gZm9yIGNvZGUsIGl0YWxpY3MgYW5kIHN0cm9uZy5cbi8vXG5cblx0Ly8gQnVpbGQgYSByZWdleCB0byBmaW5kIEhUTUwgdGFncyBhbmQgY29tbWVudHMuICBTZWUgRnJpZWRsJ3Ncblx0Ly8gXCJNYXN0ZXJpbmcgUmVndWxhciBFeHByZXNzaW9uc1wiLCAybmQgRWQuLCBwcC4gMjAwLTIwMS5cblx0dmFyIHJlZ2V4ID0gLyg8W2EtelxcLyEkXShcIlteXCJdKlwifCdbXiddKid8W14nXCI+XSkqPnw8ISgtLS4qPy0tXFxzKikrPikvZ2k7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZShyZWdleCwgZnVuY3Rpb24od2hvbGVNYXRjaCkge1xuXHRcdHZhciB0YWcgPSB3aG9sZU1hdGNoLnJlcGxhY2UoLyguKTxcXC8/Y29kZT4oPz0uKS9nLFwiJDFgXCIpO1xuXHRcdHRhZyA9IGVzY2FwZUNoYXJhY3RlcnModGFnLFwiXFxcXGAqX1wiKTtcblx0XHRyZXR1cm4gdGFnO1xuXHR9KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIF9Eb0FuY2hvcnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVHVybiBNYXJrZG93biBsaW5rIHNob3J0Y3V0cyBpbnRvIFhIVE1MIDxhPiB0YWdzLlxuLy9cblx0Ly9cblx0Ly8gRmlyc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgbGlua3M6IFtsaW5rIHRleHRdIFtpZF1cblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdFxcW1xuXHRcdFx0KFxuXHRcdFx0XHQoPzpcblx0XHRcdFx0XHRcXFtbXlxcXV0qXFxdXHRcdC8vIGFsbG93IGJyYWNrZXRzIG5lc3RlZCBvbmUgbGV2ZWxcblx0XHRcdFx0XHR8XG5cdFx0XHRcdFx0W15cXFtdXHRcdFx0Ly8gb3IgYW55dGhpbmcgZWxzZVxuXHRcdFx0XHQpKlxuXHRcdFx0KVxuXHRcdFx0XFxdXG5cblx0XHRcdFsgXT9cdFx0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIHNwYWNlXG5cdFx0XHQoPzpcXG5bIF0qKT9cdFx0XHRcdC8vIG9uZSBvcHRpb25hbCBuZXdsaW5lIGZvbGxvd2VkIGJ5IHNwYWNlc1xuXG5cdFx0XHRcXFtcblx0XHRcdCguKj8pXHRcdFx0XHRcdC8vIGlkID0gJDNcblx0XHRcdFxcXVxuXHRcdCkoKSgpKCkoKVx0XHRcdFx0XHQvLyBwYWQgcmVtYWluaW5nIGJhY2tyZWZlcmVuY2VzXG5cdFx0L2csX0RvQW5jaG9yc19jYWxsYmFjayk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFsoKD86XFxbW15cXF1dKlxcXXxbXlxcW1xcXV0pKilcXF1bIF0/KD86XFxuWyBdKik/XFxbKC4qPylcXF0pKCkoKSgpKCkvZyx3cml0ZUFuY2hvclRhZyk7XG5cblx0Ly9cblx0Ly8gTmV4dCwgaW5saW5lLXN0eWxlIGxpbmtzOiBbbGluayB0ZXh0XSh1cmwgXCJvcHRpb25hbCB0aXRsZVwiKVxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHQoXHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0XHRcXFtcblx0XHRcdFx0KFxuXHRcdFx0XHRcdCg/OlxuXHRcdFx0XHRcdFx0XFxbW15cXF1dKlxcXVx0Ly8gYWxsb3cgYnJhY2tldHMgbmVzdGVkIG9uZSBsZXZlbFxuXHRcdFx0XHRcdHxcblx0XHRcdFx0XHRbXlxcW1xcXV1cdFx0XHQvLyBvciBhbnl0aGluZyBlbHNlXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHRcdFxcXVxuXHRcdFx0XFwoXHRcdFx0XHRcdFx0Ly8gbGl0ZXJhbCBwYXJlblxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KClcdFx0XHRcdFx0XHQvLyBubyBpZCwgc28gbGVhdmUgJDMgZW1wdHlcblx0XHRcdDw/KC4qPyk+P1x0XHRcdFx0Ly8gaHJlZiA9ICQ0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoXHRcdFx0XHRcdFx0Ly8gJDVcblx0XHRcdFx0KFsnXCJdKVx0XHRcdFx0Ly8gcXVvdGUgY2hhciA9ICQ2XG5cdFx0XHRcdCguKj8pXHRcdFx0XHQvLyBUaXRsZSA9ICQ3XG5cdFx0XHRcdFxcNlx0XHRcdFx0XHQvLyBtYXRjaGluZyBxdW90ZVxuXHRcdFx0XHRbIFxcdF0qXHRcdFx0XHQvLyBpZ25vcmUgYW55IHNwYWNlcy90YWJzIGJldHdlZW4gY2xvc2luZyBxdW90ZSBhbmQgKVxuXHRcdFx0KT9cdFx0XHRcdFx0XHQvLyB0aXRsZSBpcyBvcHRpb25hbFxuXHRcdFx0XFwpXG5cdFx0KVxuXHRcdC9nLHdyaXRlQW5jaG9yVGFnKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcWygoPzpcXFtbXlxcXV0qXFxdfFteXFxbXFxdXSkqKVxcXVxcKFsgXFx0XSooKTw/KC4qPyk+P1sgXFx0XSooKFsnXCJdKSguKj8pXFw2WyBcXHRdKik/XFwpKS9nLHdyaXRlQW5jaG9yVGFnKTtcblxuXHQvL1xuXHQvLyBMYXN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIHNob3J0Y3V0czogW2xpbmsgdGV4dF1cblx0Ly8gVGhlc2UgbXVzdCBjb21lIGxhc3QgaW4gY2FzZSB5b3UndmUgYWxzbyBnb3QgW2xpbmsgdGVzdF1bMV1cblx0Ly8gb3IgW2xpbmsgdGVzdF0oL2Zvbylcblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0IFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHRcXFtcblx0XHRcdChbXlxcW1xcXV0rKVx0XHRcdFx0Ly8gbGluayB0ZXh0ID0gJDI7IGNhbid0IGNvbnRhaW4gJ1snIG9yICddJ1xuXHRcdFx0XFxdXG5cdFx0KSgpKCkoKSgpKClcdFx0XHRcdFx0Ly8gcGFkIHJlc3Qgb2YgYmFja3JlZmVyZW5jZXNcblx0XHQvZywgd3JpdGVBbmNob3JUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbKFteXFxbXFxdXSspXFxdKSgpKCkoKSgpKCkvZywgd3JpdGVBbmNob3JUYWcpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgd3JpdGVBbmNob3JUYWcgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00LG01LG02LG03KSB7XG5cdGlmIChtNyA9PSB1bmRlZmluZWQpIG03ID0gXCJcIjtcblx0dmFyIHdob2xlX21hdGNoID0gbTE7XG5cdHZhciBsaW5rX3RleHQgICA9IG0yO1xuXHR2YXIgbGlua19pZFx0ID0gbTMudG9Mb3dlckNhc2UoKTtcblx0dmFyIHVybFx0XHQ9IG00O1xuXHR2YXIgdGl0bGVcdD0gbTc7XG5cblx0aWYgKHVybCA9PSBcIlwiKSB7XG5cdFx0aWYgKGxpbmtfaWQgPT0gXCJcIikge1xuXHRcdFx0Ly8gbG93ZXItY2FzZSBhbmQgdHVybiBlbWJlZGRlZCBuZXdsaW5lcyBpbnRvIHNwYWNlc1xuXHRcdFx0bGlua19pZCA9IGxpbmtfdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyA/XFxuL2csXCIgXCIpO1xuXHRcdH1cblx0XHR1cmwgPSBcIiNcIitsaW5rX2lkO1xuXG5cdFx0aWYgKGdfdXJsc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdHVybCA9IGdfdXJsc1tsaW5rX2lkXTtcblx0XHRcdGlmIChnX3RpdGxlc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dGl0bGUgPSBnX3RpdGxlc1tsaW5rX2lkXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAod2hvbGVfbWF0Y2guc2VhcmNoKC9cXChcXHMqXFwpJC9tKT4tMSkge1xuXHRcdFx0XHQvLyBTcGVjaWFsIGNhc2UgZm9yIGV4cGxpY2l0IGVtcHR5IHVybFxuXHRcdFx0XHR1cmwgPSBcIlwiO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHdob2xlX21hdGNoO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHVybCA9IGVzY2FwZUNoYXJhY3RlcnModXJsLFwiKl9cIik7XG5cdHZhciByZXN1bHQgPSBcIjxhIGhyZWY9XFxcIlwiICsgdXJsICsgXCJcXFwiXCI7XG5cblx0aWYgKHRpdGxlICE9IFwiXCIpIHtcblx0XHR0aXRsZSA9IHRpdGxlLnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIik7XG5cdFx0dGl0bGUgPSBlc2NhcGVDaGFyYWN0ZXJzKHRpdGxlLFwiKl9cIik7XG5cdFx0cmVzdWx0ICs9ICBcIiB0aXRsZT1cXFwiXCIgKyB0aXRsZSArIFwiXFxcIlwiO1xuXHR9XG5cblx0cmVzdWx0ICs9IFwiPlwiICsgbGlua190ZXh0ICsgXCI8L2E+XCI7XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuXG52YXIgX0RvSW1hZ2VzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFR1cm4gTWFya2Rvd24gaW1hZ2Ugc2hvcnRjdXRzIGludG8gPGltZz4gdGFncy5cbi8vXG5cblx0Ly9cblx0Ly8gRmlyc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgbGFiZWxlZCBpbWFnZXM6ICFbYWx0IHRleHRdW2lkXVxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdCFcXFtcblx0XHRcdCguKj8pXHRcdFx0XHQvLyBhbHQgdGV4dCA9ICQyXG5cdFx0XHRcXF1cblxuXHRcdFx0WyBdP1x0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIHNwYWNlXG5cdFx0XHQoPzpcXG5bIF0qKT9cdFx0XHQvLyBvbmUgb3B0aW9uYWwgbmV3bGluZSBmb2xsb3dlZCBieSBzcGFjZXNcblxuXHRcdFx0XFxbXG5cdFx0XHQoLio/KVx0XHRcdFx0Ly8gaWQgPSAkM1xuXHRcdFx0XFxdXG5cdFx0KSgpKCkoKSgpXHRcdFx0XHQvLyBwYWQgcmVzdCBvZiBiYWNrcmVmZXJlbmNlc1xuXHRcdC9nLHdyaXRlSW1hZ2VUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oIVxcWyguKj8pXFxdWyBdPyg/OlxcblsgXSopP1xcWyguKj8pXFxdKSgpKCkoKSgpL2csd3JpdGVJbWFnZVRhZyk7XG5cblx0Ly9cblx0Ly8gTmV4dCwgaGFuZGxlIGlubGluZSBpbWFnZXM6ICAhW2FsdCB0ZXh0XSh1cmwgXCJvcHRpb25hbCB0aXRsZVwiKVxuXHQvLyBEb24ndCBmb3JnZXQ6IGVuY29kZSAqIGFuZCBfXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0IVxcW1xuXHRcdFx0KC4qPylcdFx0XHRcdC8vIGFsdCB0ZXh0ID0gJDJcblx0XHRcdFxcXVxuXHRcdFx0XFxzP1x0XHRcdFx0XHQvLyBPbmUgb3B0aW9uYWwgd2hpdGVzcGFjZSBjaGFyYWN0ZXJcblx0XHRcdFxcKFx0XHRcdFx0XHQvLyBsaXRlcmFsIHBhcmVuXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoKVx0XHRcdFx0XHQvLyBubyBpZCwgc28gbGVhdmUgJDMgZW1wdHlcblx0XHRcdDw/KFxcUys/KT4/XHRcdFx0Ly8gc3JjIHVybCA9ICQ0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoXHRcdFx0XHRcdC8vICQ1XG5cdFx0XHRcdChbJ1wiXSlcdFx0XHQvLyBxdW90ZSBjaGFyID0gJDZcblx0XHRcdFx0KC4qPylcdFx0XHQvLyB0aXRsZSA9ICQ3XG5cdFx0XHRcdFxcNlx0XHRcdFx0Ly8gbWF0Y2hpbmcgcXVvdGVcblx0XHRcdFx0WyBcXHRdKlxuXHRcdFx0KT9cdFx0XHRcdFx0Ly8gdGl0bGUgaXMgb3B0aW9uYWxcblx0XHRcXClcblx0XHQpXG5cdFx0L2csd3JpdGVJbWFnZVRhZyk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyghXFxbKC4qPylcXF1cXHM/XFwoWyBcXHRdKigpPD8oXFxTKz8pPj9bIFxcdF0qKChbJ1wiXSkoLio/KVxcNlsgXFx0XSopP1xcKSkvZyx3cml0ZUltYWdlVGFnKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIHdyaXRlSW1hZ2VUYWcgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00LG01LG02LG03KSB7XG5cdHZhciB3aG9sZV9tYXRjaCA9IG0xO1xuXHR2YXIgYWx0X3RleHQgICA9IG0yO1xuXHR2YXIgbGlua19pZFx0ID0gbTMudG9Mb3dlckNhc2UoKTtcblx0dmFyIHVybFx0XHQ9IG00O1xuXHR2YXIgdGl0bGVcdD0gbTc7XG5cblx0aWYgKCF0aXRsZSkgdGl0bGUgPSBcIlwiO1xuXG5cdGlmICh1cmwgPT0gXCJcIikge1xuXHRcdGlmIChsaW5rX2lkID09IFwiXCIpIHtcblx0XHRcdC8vIGxvd2VyLWNhc2UgYW5kIHR1cm4gZW1iZWRkZWQgbmV3bGluZXMgaW50byBzcGFjZXNcblx0XHRcdGxpbmtfaWQgPSBhbHRfdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyA/XFxuL2csXCIgXCIpO1xuXHRcdH1cblx0XHR1cmwgPSBcIiNcIitsaW5rX2lkO1xuXG5cdFx0aWYgKGdfdXJsc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdHVybCA9IGdfdXJsc1tsaW5rX2lkXTtcblx0XHRcdGlmIChnX3RpdGxlc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dGl0bGUgPSBnX3RpdGxlc1tsaW5rX2lkXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gd2hvbGVfbWF0Y2g7XG5cdFx0fVxuXHR9XG5cblx0YWx0X3RleHQgPSBhbHRfdGV4dC5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHR1cmwgPSBlc2NhcGVDaGFyYWN0ZXJzKHVybCxcIipfXCIpO1xuXHR2YXIgcmVzdWx0ID0gXCI8aW1nIHNyYz1cXFwiXCIgKyB1cmwgKyBcIlxcXCIgYWx0PVxcXCJcIiArIGFsdF90ZXh0ICsgXCJcXFwiXCI7XG5cblx0Ly8gYXR0YWNrbGFiOiBNYXJrZG93bi5wbCBhZGRzIGVtcHR5IHRpdGxlIGF0dHJpYnV0ZXMgdG8gaW1hZ2VzLlxuXHQvLyBSZXBsaWNhdGUgdGhpcyBidWcuXG5cblx0Ly9pZiAodGl0bGUgIT0gXCJcIikge1xuXHRcdHRpdGxlID0gdGl0bGUucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKTtcblx0XHR0aXRsZSA9IGVzY2FwZUNoYXJhY3RlcnModGl0bGUsXCIqX1wiKTtcblx0XHRyZXN1bHQgKz0gIFwiIHRpdGxlPVxcXCJcIiArIHRpdGxlICsgXCJcXFwiXCI7XG5cdC8vfVxuXG5cdHJlc3VsdCArPSBcIiAvPlwiO1xuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cblxudmFyIF9Eb0hlYWRlcnMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cblx0Ly8gU2V0ZXh0LXN0eWxlIGhlYWRlcnM6XG5cdC8vXHRIZWFkZXIgMVxuXHQvL1x0PT09PT09PT1cblx0Ly9cblx0Ly9cdEhlYWRlciAyXG5cdC8vXHQtLS0tLS0tLVxuXHQvL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKC4rKVsgXFx0XSpcXG49K1sgXFx0XSpcXG4rL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpe3JldHVybiBoYXNoQmxvY2soJzxoMSBpZD1cIicgKyBoZWFkZXJJZChtMSkgKyAnXCI+JyArIF9SdW5TcGFuR2FtdXQobTEpICsgXCI8L2gxPlwiKTt9KTtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKC4rKVsgXFx0XSpcXG4tK1sgXFx0XSpcXG4rL2dtLFxuXHRcdGZ1bmN0aW9uKG1hdGNoRm91bmQsbTEpe3JldHVybiBoYXNoQmxvY2soJzxoMiBpZD1cIicgKyBoZWFkZXJJZChtMSkgKyAnXCI+JyArIF9SdW5TcGFuR2FtdXQobTEpICsgXCI8L2gyPlwiKTt9KTtcblxuXHQvLyBhdHgtc3R5bGUgaGVhZGVyczpcblx0Ly8gICMgSGVhZGVyIDFcblx0Ly8gICMjIEhlYWRlciAyXG5cdC8vICAjIyBIZWFkZXIgMiB3aXRoIGNsb3NpbmcgaGFzaGVzICMjXG5cdC8vICAuLi5cblx0Ly8gICMjIyMjIyBIZWFkZXIgNlxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHReKFxcI3sxLDZ9KVx0XHRcdFx0Ly8gJDEgPSBzdHJpbmcgb2YgIydzXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoLis/KVx0XHRcdFx0XHQvLyAkMiA9IEhlYWRlciB0ZXh0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHRcXCMqXHRcdFx0XHRcdFx0Ly8gb3B0aW9uYWwgY2xvc2luZyAjJ3MgKG5vdCBjb3VudGVkKVxuXHRcdFx0XFxuK1xuXHRcdC9nbSwgZnVuY3Rpb24oKSB7Li4ufSk7XG5cdCovXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXihcXCN7MSw2fSlbIFxcdF0qKC4rPylbIFxcdF0qXFwjKlxcbisvZ20sXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGhfbGV2ZWwgPSBtMS5sZW5ndGg7XG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKFwiPGhcIiArIGhfbGV2ZWwgKyAnIGlkPVwiJyArIGhlYWRlcklkKG0yKSArICdcIj4nICsgX1J1blNwYW5HYW11dChtMikgKyBcIjwvaFwiICsgaF9sZXZlbCArIFwiPlwiKTtcblx0XHR9KTtcblxuXHRmdW5jdGlvbiBoZWFkZXJJZChtKSB7XG5cdFx0cmV0dXJuIG0ucmVwbGFjZSgvW15cXHddL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuXHR9XG5cdHJldHVybiB0ZXh0O1xufVxuXG4vLyBUaGlzIGRlY2xhcmF0aW9uIGtlZXBzIERvam8gY29tcHJlc3NvciBmcm9tIG91dHB1dHRpbmcgZ2FyYmFnZTpcbnZhciBfUHJvY2Vzc0xpc3RJdGVtcztcblxudmFyIF9Eb0xpc3RzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIEZvcm0gSFRNTCBvcmRlcmVkIChudW1iZXJlZCkgYW5kIHVub3JkZXJlZCAoYnVsbGV0ZWQpIGxpc3RzLlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IGFkZCBzZW50aW5lbCB0byBoYWNrIGFyb3VuZCBraHRtbC9zYWZhcmkgYnVnOlxuXHQvLyBodHRwOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xMTIzMVxuXHR0ZXh0ICs9IFwifjBcIjtcblxuXHQvLyBSZS11c2FibGUgcGF0dGVybiB0byBtYXRjaCBhbnkgZW50aXJlbCB1bCBvciBvbCBsaXN0OlxuXG5cdC8qXG5cdFx0dmFyIHdob2xlX2xpc3QgPSAvXG5cdFx0KFx0XHRcdFx0XHRcdFx0XHRcdC8vICQxID0gd2hvbGUgbGlzdFxuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkMlxuXHRcdFx0XHRbIF17MCwzfVx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0XHQoWyorLV18XFxkK1suXSlcdFx0XHRcdC8vICQzID0gZmlyc3QgbGlzdCBpdGVtIG1hcmtlclxuXHRcdFx0XHRbIFxcdF0rXG5cdFx0XHQpXG5cdFx0XHRbXlxccl0rP1xuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkNFxuXHRcdFx0XHR+MFx0XHRcdFx0XHRcdFx0Ly8gc2VudGluZWwgZm9yIHdvcmthcm91bmQ7IHNob3VsZCBiZSAkXG5cdFx0XHR8XG5cdFx0XHRcdFxcbnsyLH1cblx0XHRcdFx0KD89XFxTKVxuXHRcdFx0XHQoPyFcdFx0XHRcdFx0XHRcdC8vIE5lZ2F0aXZlIGxvb2thaGVhZCBmb3IgYW5vdGhlciBsaXN0IGl0ZW0gbWFya2VyXG5cdFx0XHRcdFx0WyBcXHRdKlxuXHRcdFx0XHRcdCg/OlsqKy1dfFxcZCtbLl0pWyBcXHRdK1xuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0KS9nXG5cdCovXG5cdHZhciB3aG9sZV9saXN0ID0gL14oKFsgXXswLDN9KFsqKy1dfFxcZCtbLl0pWyBcXHRdKylbXlxccl0rPyh+MHxcXG57Mix9KD89XFxTKSg/IVsgXFx0XSooPzpbKistXXxcXGQrWy5dKVsgXFx0XSspKSkvZ207XG5cblx0aWYgKGdfbGlzdF9sZXZlbCkge1xuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2Uod2hvbGVfbGlzdCxmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgbGlzdCA9IG0xO1xuXHRcdFx0dmFyIGxpc3RfdHlwZSA9IChtMi5zZWFyY2goL1sqKy1dL2cpPi0xKSA/IFwidWxcIiA6IFwib2xcIjtcblxuXHRcdFx0Ly8gVHVybiBkb3VibGUgcmV0dXJucyBpbnRvIHRyaXBsZSByZXR1cm5zLCBzbyB0aGF0IHdlIGNhbiBtYWtlIGFcblx0XHRcdC8vIHBhcmFncmFwaCBmb3IgdGhlIGxhc3QgaXRlbSBpbiBhIGxpc3QsIGlmIG5lY2Vzc2FyeTpcblx0XHRcdGxpc3QgPSBsaXN0LnJlcGxhY2UoL1xcbnsyLH0vZyxcIlxcblxcblxcblwiKTs7XG5cdFx0XHR2YXIgcmVzdWx0ID0gX1Byb2Nlc3NMaXN0SXRlbXMobGlzdCk7XG5cblx0XHRcdC8vIFRyaW0gYW55IHRyYWlsaW5nIHdoaXRlc3BhY2UsIHRvIHB1dCB0aGUgY2xvc2luZyBgPC8kbGlzdF90eXBlPmBcblx0XHRcdC8vIHVwIG9uIHRoZSBwcmVjZWRpbmcgbGluZSwgdG8gZ2V0IGl0IHBhc3QgdGhlIGN1cnJlbnQgc3R1cGlkXG5cdFx0XHQvLyBIVE1MIGJsb2NrIHBhcnNlci4gVGhpcyBpcyBhIGhhY2sgdG8gd29yayBhcm91bmQgdGhlIHRlcnJpYmxlXG5cdFx0XHQvLyBoYWNrIHRoYXQgaXMgdGhlIEhUTUwgYmxvY2sgcGFyc2VyLlxuXHRcdFx0cmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoL1xccyskLyxcIlwiKTtcblx0XHRcdHJlc3VsdCA9IFwiPFwiK2xpc3RfdHlwZStcIj5cIiArIHJlc3VsdCArIFwiPC9cIitsaXN0X3R5cGUrXCI+XFxuXCI7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHdob2xlX2xpc3QgPSAvKFxcblxcbnxeXFxuPykoKFsgXXswLDN9KFsqKy1dfFxcZCtbLl0pWyBcXHRdKylbXlxccl0rPyh+MHxcXG57Mix9KD89XFxTKSg/IVsgXFx0XSooPzpbKistXXxcXGQrWy5dKVsgXFx0XSspKSkvZztcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHdob2xlX2xpc3QsZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMykge1xuXHRcdFx0dmFyIHJ1bnVwID0gbTE7XG5cdFx0XHR2YXIgbGlzdCA9IG0yO1xuXG5cdFx0XHR2YXIgbGlzdF90eXBlID0gKG0zLnNlYXJjaCgvWyorLV0vZyk+LTEpID8gXCJ1bFwiIDogXCJvbFwiO1xuXHRcdFx0Ly8gVHVybiBkb3VibGUgcmV0dXJucyBpbnRvIHRyaXBsZSByZXR1cm5zLCBzbyB0aGF0IHdlIGNhbiBtYWtlIGFcblx0XHRcdC8vIHBhcmFncmFwaCBmb3IgdGhlIGxhc3QgaXRlbSBpbiBhIGxpc3QsIGlmIG5lY2Vzc2FyeTpcblx0XHRcdHZhciBsaXN0ID0gbGlzdC5yZXBsYWNlKC9cXG57Mix9L2csXCJcXG5cXG5cXG5cIik7O1xuXHRcdFx0dmFyIHJlc3VsdCA9IF9Qcm9jZXNzTGlzdEl0ZW1zKGxpc3QpO1xuXHRcdFx0cmVzdWx0ID0gcnVudXAgKyBcIjxcIitsaXN0X3R5cGUrXCI+XFxuXCIgKyByZXN1bHQgKyBcIjwvXCIrbGlzdF90eXBlK1wiPlxcblwiO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9KTtcblx0fVxuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5fUHJvY2Vzc0xpc3RJdGVtcyA9IGZ1bmN0aW9uKGxpc3Rfc3RyKSB7XG4vL1xuLy8gIFByb2Nlc3MgdGhlIGNvbnRlbnRzIG9mIGEgc2luZ2xlIG9yZGVyZWQgb3IgdW5vcmRlcmVkIGxpc3QsIHNwbGl0dGluZyBpdFxuLy8gIGludG8gaW5kaXZpZHVhbCBsaXN0IGl0ZW1zLlxuLy9cblx0Ly8gVGhlICRnX2xpc3RfbGV2ZWwgZ2xvYmFsIGtlZXBzIHRyYWNrIG9mIHdoZW4gd2UncmUgaW5zaWRlIGEgbGlzdC5cblx0Ly8gRWFjaCB0aW1lIHdlIGVudGVyIGEgbGlzdCwgd2UgaW5jcmVtZW50IGl0OyB3aGVuIHdlIGxlYXZlIGEgbGlzdCxcblx0Ly8gd2UgZGVjcmVtZW50LiBJZiBpdCdzIHplcm8sIHdlJ3JlIG5vdCBpbiBhIGxpc3QgYW55bW9yZS5cblx0Ly9cblx0Ly8gV2UgZG8gdGhpcyBiZWNhdXNlIHdoZW4gd2UncmUgbm90IGluc2lkZSBhIGxpc3QsIHdlIHdhbnQgdG8gdHJlYXRcblx0Ly8gc29tZXRoaW5nIGxpa2UgdGhpczpcblx0Ly9cblx0Ly8gICAgSSByZWNvbW1lbmQgdXBncmFkaW5nIHRvIHZlcnNpb25cblx0Ly8gICAgOC4gT29wcywgbm93IHRoaXMgbGluZSBpcyB0cmVhdGVkXG5cdC8vICAgIGFzIGEgc3ViLWxpc3QuXG5cdC8vXG5cdC8vIEFzIGEgc2luZ2xlIHBhcmFncmFwaCwgZGVzcGl0ZSB0aGUgZmFjdCB0aGF0IHRoZSBzZWNvbmQgbGluZSBzdGFydHNcblx0Ly8gd2l0aCBhIGRpZ2l0LXBlcmlvZC1zcGFjZSBzZXF1ZW5jZS5cblx0Ly9cblx0Ly8gV2hlcmVhcyB3aGVuIHdlJ3JlIGluc2lkZSBhIGxpc3QgKG9yIHN1Yi1saXN0KSwgdGhhdCBsaW5lIHdpbGwgYmVcblx0Ly8gdHJlYXRlZCBhcyB0aGUgc3RhcnQgb2YgYSBzdWItbGlzdC4gV2hhdCBhIGtsdWRnZSwgaHVoPyBUaGlzIGlzXG5cdC8vIGFuIGFzcGVjdCBvZiBNYXJrZG93bidzIHN5bnRheCB0aGF0J3MgaGFyZCB0byBwYXJzZSBwZXJmZWN0bHlcblx0Ly8gd2l0aG91dCByZXNvcnRpbmcgdG8gbWluZC1yZWFkaW5nLiBQZXJoYXBzIHRoZSBzb2x1dGlvbiBpcyB0b1xuXHQvLyBjaGFuZ2UgdGhlIHN5bnRheCBydWxlcyBzdWNoIHRoYXQgc3ViLWxpc3RzIG11c3Qgc3RhcnQgd2l0aCBhXG5cdC8vIHN0YXJ0aW5nIGNhcmRpbmFsIG51bWJlcjsgZS5nLiBcIjEuXCIgb3IgXCJhLlwiLlxuXG5cdGdfbGlzdF9sZXZlbCsrO1xuXG5cdC8vIHRyaW0gdHJhaWxpbmcgYmxhbmsgbGluZXM6XG5cdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvXFxuezIsfSQvLFwiXFxuXCIpO1xuXG5cdC8vIGF0dGFja2xhYjogYWRkIHNlbnRpbmVsIHRvIGVtdWxhdGUgXFx6XG5cdGxpc3Rfc3RyICs9IFwifjBcIjtcblxuXHQvKlxuXHRcdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvXG5cdFx0XHQoXFxuKT9cdFx0XHRcdFx0XHRcdC8vIGxlYWRpbmcgbGluZSA9ICQxXG5cdFx0XHQoXlsgXFx0XSopXHRcdFx0XHRcdFx0Ly8gbGVhZGluZyB3aGl0ZXNwYWNlID0gJDJcblx0XHRcdChbKistXXxcXGQrWy5dKSBbIFxcdF0rXHRcdFx0Ly8gbGlzdCBtYXJrZXIgPSAkM1xuXHRcdFx0KFteXFxyXSs/XHRcdFx0XHRcdFx0Ly8gbGlzdCBpdGVtIHRleHQgICA9ICQ0XG5cdFx0XHQoXFxuezEsMn0pKVxuXHRcdFx0KD89IFxcbiogKH4wIHwgXFwyIChbKistXXxcXGQrWy5dKSBbIFxcdF0rKSlcblx0XHQvZ20sIGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvKFxcbik/KF5bIFxcdF0qKShbKistXXxcXGQrWy5dKVsgXFx0XSsoW15cXHJdKz8oXFxuezEsMn0pKSg/PVxcbioofjB8XFwyKFsqKy1dfFxcZCtbLl0pWyBcXHRdKykpL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQpe1xuXHRcdFx0dmFyIGl0ZW0gPSBtNDtcblx0XHRcdHZhciBsZWFkaW5nX2xpbmUgPSBtMTtcblx0XHRcdHZhciBsZWFkaW5nX3NwYWNlID0gbTI7XG5cblx0XHRcdGlmIChsZWFkaW5nX2xpbmUgfHwgKGl0ZW0uc2VhcmNoKC9cXG57Mix9Lyk+LTEpKSB7XG5cdFx0XHRcdGl0ZW0gPSBfUnVuQmxvY2tHYW11dChfT3V0ZGVudChpdGVtKSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gUmVjdXJzaW9uIGZvciBzdWItbGlzdHM6XG5cdFx0XHRcdGl0ZW0gPSBfRG9MaXN0cyhfT3V0ZGVudChpdGVtKSk7XG5cdFx0XHRcdGl0ZW0gPSBpdGVtLnJlcGxhY2UoL1xcbiQvLFwiXCIpOyAvLyBjaG9tcChpdGVtKVxuXHRcdFx0XHRpdGVtID0gX1J1blNwYW5HYW11dChpdGVtKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuICBcIjxsaT5cIiArIGl0ZW0gKyBcIjwvbGk+XFxuXCI7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0bGlzdF9zdHIgPSBsaXN0X3N0ci5yZXBsYWNlKC9+MC9nLFwiXCIpO1xuXG5cdGdfbGlzdF9sZXZlbC0tO1xuXHRyZXR1cm4gbGlzdF9zdHI7XG59XG5cblxudmFyIF9Eb0NvZGVCbG9ja3MgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gIFByb2Nlc3MgTWFya2Rvd24gYDxwcmU+PGNvZGU+YCBibG9ja3MuXG4vL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSh0ZXh0LFxuXHRcdFx0Lyg/OlxcblxcbnxeKVxuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkMSA9IHRoZSBjb2RlIGJsb2NrIC0tIG9uZSBvciBtb3JlIGxpbmVzLCBzdGFydGluZyB3aXRoIGEgc3BhY2UvdGFiXG5cdFx0XHRcdCg/OlxuXHRcdFx0XHRcdCg/OlsgXXs0fXxcXHQpXHRcdFx0Ly8gTGluZXMgbXVzdCBzdGFydCB3aXRoIGEgdGFiIG9yIGEgdGFiLXdpZHRoIG9mIHNwYWNlcyAtIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblx0XHRcdFx0XHQuKlxcbitcblx0XHRcdFx0KStcblx0XHRcdClcblx0XHRcdChcXG4qWyBdezAsM31bXiBcXHRcXG5dfCg/PX4wKSlcdC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblx0XHQvZyxmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXG5cdC8vIGF0dGFja2xhYjogc2VudGluZWwgd29ya2Fyb3VuZHMgZm9yIGxhY2sgb2YgXFxBIGFuZCBcXFosIHNhZmFyaVxca2h0bWwgYnVnXG5cdHRleHQgKz0gXCJ+MFwiO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg/OlxcblxcbnxeKSgoPzooPzpbIF17NH18XFx0KS4qXFxuKykrKShcXG4qWyBdezAsM31bXiBcXHRcXG5dfCg/PX4wKSkvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgY29kZWJsb2NrID0gbTE7XG5cdFx0XHR2YXIgbmV4dENoYXIgPSBtMjtcblxuXHRcdFx0Y29kZWJsb2NrID0gX0VuY29kZUNvZGUoIF9PdXRkZW50KGNvZGVibG9jaykpO1xuXHRcdFx0Y29kZWJsb2NrID0gX0RldGFiKGNvZGVibG9jayk7XG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXlxcbisvZyxcIlwiKTsgLy8gdHJpbSBsZWFkaW5nIG5ld2xpbmVzXG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTsgLy8gdHJpbSB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cblx0XHRcdGNvZGVibG9jayA9IFwiPHByZT48Y29kZT5cIiArIGNvZGVibG9jayArIFwiXFxuPC9jb2RlPjwvcHJlPlwiO1xuXG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKGNvZGVibG9jaykgKyBuZXh0Q2hhcjtcblx0XHR9XG5cdCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC8sXCJcIik7XG5cblx0cmV0dXJuIHRleHQ7XG59O1xuXG52YXIgX0RvR2l0aHViQ29kZUJsb2NrcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgUHJvY2VzcyBHaXRodWItc3R5bGUgY29kZSBibG9ja3Ncbi8vICBFeGFtcGxlOlxuLy8gIGBgYHJ1Ynlcbi8vICBkZWYgaGVsbG9fd29ybGQoeClcbi8vICAgIHB1dHMgXCJIZWxsbywgI3t4fVwiXG4vLyAgZW5kXG4vLyAgYGBgXG4vL1xuXG5cblx0Ly8gYXR0YWNrbGFiOiBzZW50aW5lbCB3b3JrYXJvdW5kcyBmb3IgbGFjayBvZiBcXEEgYW5kIFxcWiwgc2FmYXJpXFxraHRtbCBidWdcblx0dGV4dCArPSBcIn4wXCI7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKD86XnxcXG4pYGBgKC4qKVxcbihbXFxzXFxTXSo/KVxcbmBgYC9nLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIpIHtcblx0XHRcdHZhciBsYW5ndWFnZSA9IG0xO1xuXHRcdFx0dmFyIGNvZGVibG9jayA9IG0yO1xuXG5cdFx0XHRjb2RlYmxvY2sgPSBfRW5jb2RlQ29kZShjb2RlYmxvY2spO1xuXHRcdFx0Y29kZWJsb2NrID0gX0RldGFiKGNvZGVibG9jayk7XG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXlxcbisvZyxcIlwiKTsgLy8gdHJpbSBsZWFkaW5nIG5ld2xpbmVzXG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTsgLy8gdHJpbSB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cblx0XHRcdGNvZGVibG9jayA9IFwiPHByZT48Y29kZVwiICsgKGxhbmd1YWdlID8gXCIgY2xhc3M9XFxcIlwiICsgbGFuZ3VhZ2UgKyAnXCInIDogXCJcIikgKyBcIj5cIiArIGNvZGVibG9jayArIFwiXFxuPC9jb2RlPjwvcHJlPlwiO1xuXG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKGNvZGVibG9jayk7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgaGFzaEJsb2NrID0gZnVuY3Rpb24odGV4dCkge1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXlxcbit8XFxuKyQpL2csXCJcIik7XG5cdHJldHVybiBcIlxcblxcbn5LXCIgKyAoZ19odG1sX2Jsb2Nrcy5wdXNoKHRleHQpLTEpICsgXCJLXFxuXFxuXCI7XG59XG5cbnZhciBfRG9Db2RlU3BhbnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gICAqICBCYWNrdGljayBxdW90ZXMgYXJlIHVzZWQgZm9yIDxjb2RlPjwvY29kZT4gc3BhbnMuXG4vL1xuLy8gICAqICBZb3UgY2FuIHVzZSBtdWx0aXBsZSBiYWNrdGlja3MgYXMgdGhlIGRlbGltaXRlcnMgaWYgeW91IHdhbnQgdG9cbi8vXHQgaW5jbHVkZSBsaXRlcmFsIGJhY2t0aWNrcyBpbiB0aGUgY29kZSBzcGFuLiBTbywgdGhpcyBpbnB1dDpcbi8vXG4vL1x0XHQgSnVzdCB0eXBlIGBgZm9vIGBiYXJgIGJhemBgIGF0IHRoZSBwcm9tcHQuXG4vL1xuLy9cdCAgIFdpbGwgdHJhbnNsYXRlIHRvOlxuLy9cbi8vXHRcdCA8cD5KdXN0IHR5cGUgPGNvZGU+Zm9vIGBiYXJgIGJhejwvY29kZT4gYXQgdGhlIHByb21wdC48L3A+XG4vL1xuLy9cdFRoZXJlJ3Mgbm8gYXJiaXRyYXJ5IGxpbWl0IHRvIHRoZSBudW1iZXIgb2YgYmFja3RpY2tzIHlvdVxuLy9cdGNhbiB1c2UgYXMgZGVsaW10ZXJzLiBJZiB5b3UgbmVlZCB0aHJlZSBjb25zZWN1dGl2ZSBiYWNrdGlja3Ncbi8vXHRpbiB5b3VyIGNvZGUsIHVzZSBmb3VyIGZvciBkZWxpbWl0ZXJzLCBldGMuXG4vL1xuLy8gICogIFlvdSBjYW4gdXNlIHNwYWNlcyB0byBnZXQgbGl0ZXJhbCBiYWNrdGlja3MgYXQgdGhlIGVkZ2VzOlxuLy9cbi8vXHRcdCAuLi4gdHlwZSBgYCBgYmFyYCBgYCAuLi5cbi8vXG4vL1x0ICAgVHVybnMgdG86XG4vL1xuLy9cdFx0IC4uLiB0eXBlIDxjb2RlPmBiYXJgPC9jb2RlPiAuLi5cbi8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHRcdChefFteXFxcXF0pXHRcdFx0XHRcdC8vIENoYXJhY3RlciBiZWZvcmUgb3BlbmluZyBgIGNhbid0IGJlIGEgYmFja3NsYXNoXG5cdFx0XHQoYCspXHRcdFx0XHRcdFx0Ly8gJDIgPSBPcGVuaW5nIHJ1biBvZiBgXG5cdFx0XHQoXHRcdFx0XHRcdFx0XHQvLyAkMyA9IFRoZSBjb2RlIGJsb2NrXG5cdFx0XHRcdFteXFxyXSo/XG5cdFx0XHRcdFteYF1cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB3b3JrIGFyb3VuZCBsYWNrIG9mIGxvb2tiZWhpbmRcblx0XHRcdClcblx0XHRcdFxcMlx0XHRcdFx0XHRcdFx0Ly8gTWF0Y2hpbmcgY2xvc2VyXG5cdFx0XHQoPyFgKVxuXHRcdC9nbSwgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXnxbXlxcXFxdKShgKykoW15cXHJdKj9bXmBdKVxcMig/IWApL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQpIHtcblx0XHRcdHZhciBjID0gbTM7XG5cdFx0XHRjID0gYy5yZXBsYWNlKC9eKFsgXFx0XSopL2csXCJcIik7XHQvLyBsZWFkaW5nIHdoaXRlc3BhY2Vcblx0XHRcdGMgPSBjLnJlcGxhY2UoL1sgXFx0XSokL2csXCJcIik7XHQvLyB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cdFx0XHRjID0gX0VuY29kZUNvZGUoYyk7XG5cdFx0XHRyZXR1cm4gbTErXCI8Y29kZT5cIitjK1wiPC9jb2RlPlwiO1xuXHRcdH0pO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0VuY29kZUNvZGUgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gRW5jb2RlL2VzY2FwZSBjZXJ0YWluIGNoYXJhY3RlcnMgaW5zaWRlIE1hcmtkb3duIGNvZGUgcnVucy5cbi8vIFRoZSBwb2ludCBpcyB0aGF0IGluIGNvZGUsIHRoZXNlIGNoYXJhY3RlcnMgYXJlIGxpdGVyYWxzLFxuLy8gYW5kIGxvc2UgdGhlaXIgc3BlY2lhbCBNYXJrZG93biBtZWFuaW5ncy5cbi8vXG5cdC8vIEVuY29kZSBhbGwgYW1wZXJzYW5kczsgSFRNTCBlbnRpdGllcyBhcmUgbm90XG5cdC8vIGVudGl0aWVzIHdpdGhpbiBhIE1hcmtkb3duIGNvZGUgc3Bhbi5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvJi9nLFwiJmFtcDtcIik7XG5cblx0Ly8gRG8gdGhlIGFuZ2xlIGJyYWNrZXQgc29uZyBhbmQgZGFuY2U6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwvZyxcIiZsdDtcIik7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLz4vZyxcIiZndDtcIik7XG5cblx0Ly8gTm93LCBlc2NhcGUgY2hhcmFjdGVycyB0aGF0IGFyZSBtYWdpYyBpbiBNYXJrZG93bjpcblx0dGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcIlxcKl97fVtdXFxcXFwiLGZhbHNlKTtcblxuLy8gamogdGhlIGxpbmUgYWJvdmUgYnJlYWtzIHRoaXM6XG4vLy0tLVxuXG4vLyogSXRlbVxuXG4vLyAgIDEuIFN1Yml0ZW1cblxuLy8gICAgICAgICAgICBzcGVjaWFsIGNoYXI6ICpcbi8vLS0tXG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9Eb0l0YWxpY3NBbmRCb2xkID0gZnVuY3Rpb24odGV4dCkge1xuXG5cdC8vIDxzdHJvbmc+IG11c3QgZ28gZmlyc3Q6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXCpcXCp8X18pKD89XFxTKShbXlxccl0qP1xcU1sqX10qKVxcMS9nLFxuXHRcdFwiPHN0cm9uZz4kMjwvc3Ryb25nPlwiKTtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFwqfF8pKD89XFxTKShbXlxccl0qP1xcUylcXDEvZyxcblx0XHRcIjxlbT4kMjwvZW0+XCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRG9CbG9ja1F1b3RlcyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gV3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0KFxuXHRcdFx0XHReWyBcXHRdKj5bIFxcdF0/XHRcdFx0Ly8gJz4nIGF0IHRoZSBzdGFydCBvZiBhIGxpbmVcblx0XHRcdFx0LitcXG5cdFx0XHRcdFx0Ly8gcmVzdCBvZiB0aGUgZmlyc3QgbGluZVxuXHRcdFx0XHQoLitcXG4pKlx0XHRcdFx0XHQvLyBzdWJzZXF1ZW50IGNvbnNlY3V0aXZlIGxpbmVzXG5cdFx0XHRcdFxcbipcdFx0XHRcdFx0XHQvLyBibGFua3Ncblx0XHRcdCkrXG5cdFx0KVxuXHRcdC9nbSwgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oKF5bIFxcdF0qPlsgXFx0XT8uK1xcbiguK1xcbikqXFxuKikrKS9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHR2YXIgYnEgPSBtMTtcblxuXHRcdFx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHRcdFx0Ly8gXCItLS0tLS0tLS0tYnVnXCIucmVwbGFjZSgvXi0vZyxcIlwiKSA9PSBcImJ1Z1wiXG5cblx0XHRcdGJxID0gYnEucmVwbGFjZSgvXlsgXFx0XSo+WyBcXHRdPy9nbSxcIn4wXCIpO1x0Ly8gdHJpbSBvbmUgbGV2ZWwgb2YgcXVvdGluZ1xuXG5cdFx0XHQvLyBhdHRhY2tsYWI6IGNsZWFuIHVwIGhhY2tcblx0XHRcdGJxID0gYnEucmVwbGFjZSgvfjAvZyxcIlwiKTtcblxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKC9eWyBcXHRdKyQvZ20sXCJcIik7XHRcdC8vIHRyaW0gd2hpdGVzcGFjZS1vbmx5IGxpbmVzXG5cdFx0XHRicSA9IF9SdW5CbG9ja0dhbXV0KGJxKTtcdFx0XHRcdC8vIHJlY3Vyc2VcblxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKC8oXnxcXG4pL2csXCIkMSAgXCIpO1xuXHRcdFx0Ly8gVGhlc2UgbGVhZGluZyBzcGFjZXMgc2NyZXcgd2l0aCA8cHJlPiBjb250ZW50LCBzbyB3ZSBuZWVkIHRvIGZpeCB0aGF0OlxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKFxuXHRcdFx0XHRcdC8oXFxzKjxwcmU+W15cXHJdKz88XFwvcHJlPikvZ20sXG5cdFx0XHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0XHRcdFx0XHR2YXIgcHJlID0gbTE7XG5cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHRcdFx0XHRcdHByZSA9IHByZS5yZXBsYWNlKC9eICAvbWcsXCJ+MFwiKTtcblx0XHRcdFx0XHRwcmUgPSBwcmUucmVwbGFjZSgvfjAvZyxcIlwiKTtcblx0XHRcdFx0XHRyZXR1cm4gcHJlO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhcIjxibG9ja3F1b3RlPlxcblwiICsgYnEgKyBcIlxcbjwvYmxvY2txdW90ZT5cIik7XG5cdFx0fSk7XG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRm9ybVBhcmFncmFwaHMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gIFBhcmFtczpcbi8vICAgICR0ZXh0IC0gc3RyaW5nIHRvIHByb2Nlc3Mgd2l0aCBodG1sIDxwPiB0YWdzXG4vL1xuXG5cdC8vIFN0cmlwIGxlYWRpbmcgYW5kIHRyYWlsaW5nIGxpbmVzOlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eXFxuKy9nLFwiXCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLFwiXCIpO1xuXG5cdHZhciBncmFmcyA9IHRleHQuc3BsaXQoL1xcbnsyLH0vZyk7XG5cdHZhciBncmFmc091dCA9IG5ldyBBcnJheSgpO1xuXG5cdC8vXG5cdC8vIFdyYXAgPHA+IHRhZ3MuXG5cdC8vXG5cdHZhciBlbmQgPSBncmFmcy5sZW5ndGg7XG5cdGZvciAodmFyIGk9MDsgaTxlbmQ7IGkrKykge1xuXHRcdHZhciBzdHIgPSBncmFmc1tpXTtcblxuXHRcdC8vIGlmIHRoaXMgaXMgYW4gSFRNTCBtYXJrZXIsIGNvcHkgaXRcblx0XHRpZiAoc3RyLnNlYXJjaCgvfksoXFxkKylLL2cpID49IDApIHtcblx0XHRcdGdyYWZzT3V0LnB1c2goc3RyKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoc3RyLnNlYXJjaCgvXFxTLykgPj0gMCkge1xuXHRcdFx0c3RyID0gX1J1blNwYW5HYW11dChzdHIpO1xuXHRcdFx0c3RyID0gc3RyLnJlcGxhY2UoL14oWyBcXHRdKikvZyxcIjxwPlwiKTtcblx0XHRcdHN0ciArPSBcIjwvcD5cIlxuXHRcdFx0Z3JhZnNPdXQucHVzaChzdHIpO1xuXHRcdH1cblxuXHR9XG5cblx0Ly9cblx0Ly8gVW5oYXNoaWZ5IEhUTUwgYmxvY2tzXG5cdC8vXG5cdGVuZCA9IGdyYWZzT3V0Lmxlbmd0aDtcblx0Zm9yICh2YXIgaT0wOyBpPGVuZDsgaSsrKSB7XG5cdFx0Ly8gaWYgdGhpcyBpcyBhIG1hcmtlciBmb3IgYW4gaHRtbCBibG9jay4uLlxuXHRcdHdoaWxlIChncmFmc091dFtpXS5zZWFyY2goL35LKFxcZCspSy8pID49IDApIHtcblx0XHRcdHZhciBibG9ja1RleHQgPSBnX2h0bWxfYmxvY2tzW1JlZ0V4cC4kMV07XG5cdFx0XHRibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFwkL2csXCIkJCQkXCIpOyAvLyBFc2NhcGUgYW55IGRvbGxhciBzaWduc1xuXHRcdFx0Z3JhZnNPdXRbaV0gPSBncmFmc091dFtpXS5yZXBsYWNlKC9+S1xcZCtLLyxibG9ja1RleHQpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBncmFmc091dC5qb2luKFwiXFxuXFxuXCIpO1xufVxuXG5cbnZhciBfRW5jb2RlQW1wc0FuZEFuZ2xlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vIFNtYXJ0IHByb2Nlc3NpbmcgZm9yIGFtcGVyc2FuZHMgYW5kIGFuZ2xlIGJyYWNrZXRzIHRoYXQgbmVlZCB0byBiZSBlbmNvZGVkLlxuXG5cdC8vIEFtcGVyc2FuZC1lbmNvZGluZyBiYXNlZCBlbnRpcmVseSBvbiBOYXQgSXJvbnMncyBBbXB1dGF0b3IgTVQgcGx1Z2luOlxuXHQvLyAgIGh0dHA6Ly9idW1wcG8ubmV0L3Byb2plY3RzL2FtcHV0YXRvci9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvJig/ISM/W3hYXT8oPzpbMC05YS1mQS1GXSt8XFx3Kyk7KS9nLFwiJmFtcDtcIik7XG5cblx0Ly8gRW5jb2RlIG5ha2VkIDwnc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KD8hW2EtelxcLz9cXCQhXSkvZ2ksXCImbHQ7XCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRW5jb2RlQmFja3NsYXNoRXNjYXBlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgIFBhcmFtZXRlcjogIFN0cmluZy5cbi8vICAgUmV0dXJuczpcdFRoZSBzdHJpbmcsIHdpdGggYWZ0ZXIgcHJvY2Vzc2luZyB0aGUgZm9sbG93aW5nIGJhY2tzbGFzaFxuLy9cdFx0XHQgICBlc2NhcGUgc2VxdWVuY2VzLlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IFRoZSBwb2xpdGUgd2F5IHRvIGRvIHRoaXMgaXMgd2l0aCB0aGUgbmV3XG5cdC8vIGVzY2FwZUNoYXJhY3RlcnMoKSBmdW5jdGlvbjpcblx0Ly9cblx0Ly8gXHR0ZXh0ID0gZXNjYXBlQ2hhcmFjdGVycyh0ZXh0LFwiXFxcXFwiLHRydWUpO1xuXHQvLyBcdHRleHQgPSBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsXCJgKl97fVtdKCk+IystLiFcIix0cnVlKTtcblx0Ly9cblx0Ly8gLi4uYnV0IHdlJ3JlIHNpZGVzdGVwcGluZyBpdHMgdXNlIG9mIHRoZSAoc2xvdykgUmVnRXhwIGNvbnN0cnVjdG9yXG5cdC8vIGFzIGFuIG9wdGltaXphdGlvbiBmb3IgRmlyZWZveC4gIFRoaXMgZnVuY3Rpb24gZ2V0cyBjYWxsZWQgYSBMT1QuXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxcXChcXFxcKS9nLGVzY2FwZUNoYXJhY3RlcnNfY2FsbGJhY2spO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXFxcKFtgKl97fVxcW1xcXSgpPiMrLS4hXSkvZyxlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrKTtcblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9Eb0F1dG9MaW5rcyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KChodHRwcz98ZnRwfGRpY3QpOlteJ1wiPlxcc10rKT4vZ2ksXCI8YSBocmVmPVxcXCIkMVxcXCI+JDE8L2E+XCIpO1xuXG5cdC8vIEVtYWlsIGFkZHJlc3NlczogPGFkZHJlc3NAZG9tYWluLmZvbz5cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0PFxuXHRcdFx0KD86bWFpbHRvOik/XG5cdFx0XHQoXG5cdFx0XHRcdFstLlxcd10rXG5cdFx0XHRcdFxcQFxuXHRcdFx0XHRbLWEtejAtOV0rKFxcLlstYS16MC05XSspKlxcLlthLXpdK1xuXHRcdFx0KVxuXHRcdFx0PlxuXHRcdC9naSwgX0RvQXV0b0xpbmtzX2NhbGxiYWNrKCkpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KD86bWFpbHRvOik/KFstLlxcd10rXFxAWy1hLXowLTldKyhcXC5bLWEtejAtOV0rKSpcXC5bYS16XSspPi9naSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHRyZXR1cm4gX0VuY29kZUVtYWlsQWRkcmVzcyggX1VuZXNjYXBlU3BlY2lhbENoYXJzKG0xKSApO1xuXHRcdH1cblx0KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0VuY29kZUVtYWlsQWRkcmVzcyA9IGZ1bmN0aW9uKGFkZHIpIHtcbi8vXG4vLyAgSW5wdXQ6IGFuIGVtYWlsIGFkZHJlc3MsIGUuZy4gXCJmb29AZXhhbXBsZS5jb21cIlxuLy9cbi8vICBPdXRwdXQ6IHRoZSBlbWFpbCBhZGRyZXNzIGFzIGEgbWFpbHRvIGxpbmssIHdpdGggZWFjaCBjaGFyYWN0ZXJcbi8vXHRvZiB0aGUgYWRkcmVzcyBlbmNvZGVkIGFzIGVpdGhlciBhIGRlY2ltYWwgb3IgaGV4IGVudGl0eSwgaW5cbi8vXHR0aGUgaG9wZXMgb2YgZm9pbGluZyBtb3N0IGFkZHJlc3MgaGFydmVzdGluZyBzcGFtIGJvdHMuIEUuZy46XG4vL1xuLy9cdDxhIGhyZWY9XCImI3g2RDsmIzk3OyYjMTA1OyYjMTA4OyYjeDc0OyYjMTExOzomIzEwMjsmIzExMTsmIzExMTsmIzY0OyYjMTAxO1xuLy9cdCAgIHgmI3g2MTsmIzEwOTsmI3g3MDsmIzEwODsmI3g2NTsmI3gyRTsmIzk5OyYjMTExOyYjMTA5O1wiPiYjMTAyOyYjMTExOyYjMTExO1xuLy9cdCAgICYjNjQ7JiMxMDE7eCYjeDYxOyYjMTA5OyYjeDcwOyYjMTA4OyYjeDY1OyYjeDJFOyYjOTk7JiMxMTE7JiMxMDk7PC9hPlxuLy9cbi8vICBCYXNlZCBvbiBhIGZpbHRlciBieSBNYXR0aGV3IFdpY2tsaW5lLCBwb3N0ZWQgdG8gdGhlIEJCRWRpdC1UYWxrXG4vLyAgbWFpbGluZyBsaXN0OiA8aHR0cDovL3Rpbnl1cmwuY29tL3l1N3VlPlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IHdoeSBjYW4ndCBqYXZhc2NyaXB0IHNwZWFrIGhleD9cblx0ZnVuY3Rpb24gY2hhcjJoZXgoY2gpIHtcblx0XHR2YXIgaGV4RGlnaXRzID0gJzAxMjM0NTY3ODlBQkNERUYnO1xuXHRcdHZhciBkZWMgPSBjaC5jaGFyQ29kZUF0KDApO1xuXHRcdHJldHVybihoZXhEaWdpdHMuY2hhckF0KGRlYz4+NCkgKyBoZXhEaWdpdHMuY2hhckF0KGRlYyYxNSkpO1xuXHR9XG5cblx0dmFyIGVuY29kZSA9IFtcblx0XHRmdW5jdGlvbihjaCl7cmV0dXJuIFwiJiNcIitjaC5jaGFyQ29kZUF0KDApK1wiO1wiO30sXG5cdFx0ZnVuY3Rpb24oY2gpe3JldHVybiBcIiYjeFwiK2NoYXIyaGV4KGNoKStcIjtcIjt9LFxuXHRcdGZ1bmN0aW9uKGNoKXtyZXR1cm4gY2g7fVxuXHRdO1xuXG5cdGFkZHIgPSBcIm1haWx0bzpcIiArIGFkZHI7XG5cblx0YWRkciA9IGFkZHIucmVwbGFjZSgvLi9nLCBmdW5jdGlvbihjaCkge1xuXHRcdGlmIChjaCA9PSBcIkBcIikge1xuXHRcdCAgIFx0Ly8gdGhpcyAqbXVzdCogYmUgZW5jb2RlZC4gSSBpbnNpc3QuXG5cdFx0XHRjaCA9IGVuY29kZVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMildKGNoKTtcblx0XHR9IGVsc2UgaWYgKGNoICE9XCI6XCIpIHtcblx0XHRcdC8vIGxlYXZlICc6JyBhbG9uZSAodG8gc3BvdCBtYWlsdG86IGxhdGVyKVxuXHRcdFx0dmFyIHIgPSBNYXRoLnJhbmRvbSgpO1xuXHRcdFx0Ly8gcm91Z2hseSAxMCUgcmF3LCA0NSUgaGV4LCA0NSUgZGVjXG5cdFx0XHRjaCA9ICAoXG5cdFx0XHRcdFx0ciA+IC45ICA/XHRlbmNvZGVbMl0oY2gpICAgOlxuXHRcdFx0XHRcdHIgPiAuNDUgP1x0ZW5jb2RlWzFdKGNoKSAgIDpcblx0XHRcdFx0XHRcdFx0XHRlbmNvZGVbMF0oY2gpXG5cdFx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBjaDtcblx0fSk7XG5cblx0YWRkciA9IFwiPGEgaHJlZj1cXFwiXCIgKyBhZGRyICsgXCJcXFwiPlwiICsgYWRkciArIFwiPC9hPlwiO1xuXHRhZGRyID0gYWRkci5yZXBsYWNlKC9cIj4uKzovZyxcIlxcXCI+XCIpOyAvLyBzdHJpcCB0aGUgbWFpbHRvOiBmcm9tIHRoZSB2aXNpYmxlIHBhcnRcblxuXHRyZXR1cm4gYWRkcjtcbn1cblxuXG52YXIgX1VuZXNjYXBlU3BlY2lhbENoYXJzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFN3YXAgYmFjayBpbiBhbGwgdGhlIHNwZWNpYWwgY2hhcmFjdGVycyB3ZSd2ZSBoaWRkZW4uXG4vL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+RShcXGQrKUUvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHR2YXIgY2hhckNvZGVUb1JlcGxhY2UgPSBwYXJzZUludChtMSk7XG5cdFx0XHRyZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZVRvUmVwbGFjZSk7XG5cdFx0fVxuXHQpO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX091dGRlbnQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gUmVtb3ZlIG9uZSBsZXZlbCBvZiBsaW5lLWxlYWRpbmcgdGFicyBvciBzcGFjZXNcbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHQvLyBcIi0tLS0tLS0tLS1idWdcIi5yZXBsYWNlKC9eLS9nLFwiXCIpID09IFwiYnVnXCJcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKFxcdHxbIF17MSw0fSkvZ20sXCJ+MFwiKTsgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXG5cdC8vIGF0dGFja2xhYjogY2xlYW4gdXAgaGFja1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC9nLFwiXCIpXG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBfRGV0YWIgPSBmdW5jdGlvbih0ZXh0KSB7XG4vLyBhdHRhY2tsYWI6IERldGFiJ3MgY29tcGxldGVseSByZXdyaXR0ZW4gZm9yIHNwZWVkLlxuLy8gSW4gcGVybCB3ZSBjb3VsZCBmaXggaXQgYnkgYW5jaG9yaW5nIHRoZSByZWdleHAgd2l0aCBcXEcuXG4vLyBJbiBqYXZhc2NyaXB0IHdlJ3JlIGxlc3MgZm9ydHVuYXRlLlxuXG5cdC8vIGV4cGFuZCBmaXJzdCBuLTEgdGFic1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHQoPz1cXHQpL2csXCIgICAgXCIpOyAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cblx0Ly8gcmVwbGFjZSB0aGUgbnRoIHdpdGggdHdvIHNlbnRpbmVsc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHQvZyxcIn5BfkJcIik7XG5cblx0Ly8gdXNlIHRoZSBzZW50aW5lbCB0byBhbmNob3Igb3VyIHJlZ2V4IHNvIGl0IGRvZXNuJ3QgZXhwbG9kZVxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+QiguKz8pfkEvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgbGVhZGluZ1RleHQgPSBtMTtcblx0XHRcdHZhciBudW1TcGFjZXMgPSA0IC0gbGVhZGluZ1RleHQubGVuZ3RoICUgNDsgIC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblxuXHRcdFx0Ly8gdGhlcmUgKm11c3QqIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzOlxuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPG51bVNwYWNlczsgaSsrKSBsZWFkaW5nVGV4dCs9XCIgXCI7XG5cblx0XHRcdHJldHVybiBsZWFkaW5nVGV4dDtcblx0XHR9XG5cdCk7XG5cblx0Ly8gY2xlYW4gdXAgc2VudGluZWxzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL35BL2csXCIgICAgXCIpOyAgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+Qi9nLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbi8vXG4vLyAgYXR0YWNrbGFiOiBVdGlsaXR5IGZ1bmN0aW9uc1xuLy9cblxuXG52YXIgZXNjYXBlQ2hhcmFjdGVycyA9IGZ1bmN0aW9uKHRleHQsIGNoYXJzVG9Fc2NhcGUsIGFmdGVyQmFja3NsYXNoKSB7XG5cdC8vIEZpcnN0IHdlIGhhdmUgdG8gZXNjYXBlIHRoZSBlc2NhcGUgY2hhcmFjdGVycyBzbyB0aGF0XG5cdC8vIHdlIGNhbiBidWlsZCBhIGNoYXJhY3RlciBjbGFzcyBvdXQgb2YgdGhlbVxuXHR2YXIgcmVnZXhTdHJpbmcgPSBcIihbXCIgKyBjaGFyc1RvRXNjYXBlLnJlcGxhY2UoLyhbXFxbXFxdXFxcXF0pL2csXCJcXFxcJDFcIikgKyBcIl0pXCI7XG5cblx0aWYgKGFmdGVyQmFja3NsYXNoKSB7XG5cdFx0cmVnZXhTdHJpbmcgPSBcIlxcXFxcXFxcXCIgKyByZWdleFN0cmluZztcblx0fVxuXG5cdHZhciByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHJpbmcsXCJnXCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlZ2V4LGVzY2FwZUNoYXJhY3RlcnNfY2FsbGJhY2spO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrID0gZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHR2YXIgY2hhckNvZGVUb0VzY2FwZSA9IG0xLmNoYXJDb2RlQXQoMCk7XG5cdHJldHVybiBcIn5FXCIrY2hhckNvZGVUb0VzY2FwZStcIkVcIjtcbn1cblxufSAvLyBlbmQgb2YgU2hvd2Rvd24uY29udmVydGVyXG5cbi8vIGV4cG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSBtb2R1bGUuZXhwb3J0cyA9IFNob3dkb3duO1xuXG59KSgpIiwieGhyID0gKG9wdCwgY2FsbGJhY2spIC0+XG4gIG1ldGhvZCA9IG9wdC5tZXRob2Qgb3IgJ0dFVCdcbiAgciA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuICBpZiAnd2l0aENyZWRlbnRpYWxzJyBvZiByXG4gICAgci5vcGVuIG1ldGhvZCwgb3B0LnVybCwgdHJ1ZVxuICBlbHNlIGlmIFhEb21haW5SZXF1ZXN0P1xuICAgIHIgPSBuZXcgWERvbWFpblJlcXVlc3RcbiAgICByLm9wZW4gbWV0aG9kLCBvcHQudXJsXG4gIGVsc2VcbiAgICByZXR1cm4gbnVsbFxuICByLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IC0+XG4gICAgaWYgci5yZWFkeVN0YXRlIGlzIDRcbiAgICAgIGlmIHIuc3RhdHVzID49IDIwMCBhbmQgci5zdGF0dXMgPCAzMDBcbiAgICAgICAgY2FsbGJhY2sgdW5kZWZpbmVkLCByLnJlc3BvbnNlVGV4dCwgclxuICAgICAgZWxzZVxuICAgICAgICBjYWxsYmFjayByLnN0YXR1c1RleHQsIHIucmVzcG9uc2VUZXh0LCByXG4gIHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSBmb3IgaGVhZGVyLCB2YWx1ZSBvZiBvcHQuaGVhZGVyc1xuICByLnNlbmQgb3B0LmRhdGFcbiAgclxuXG54aHIuanNvbiA9IChvcHQsIGNhbGxiYWNrKSAtPlxuICBjYWxsYmFja18gPSAoZXJyLCBqc29uLCB4aHIpIC0+XG4gICAgaWYgZXJyPyBvciBub3QganNvbiB0aGVuIHJldHVybiBjYWxsYmFjayBlcnIsIHVuZGVmaW5lZCwgeGhyXG4gICAgdHJ5XG4gICAgICBkYXRhID0gSlNPTi5wYXJzZSBqc29uXG4gICAgY2F0Y2ggZXJyX1xuICAgICAgZXJyID0gZXJyX1xuICAgIGNhbGxiYWNrIGVyciwgZGF0YSwgeGhyXG4gIG9wdC5kYXRhID0gSlNPTi5zdHJpbmdpZnkgb3B0LmRhdGFcbiAgb3B0LmhlYWRlcnMgPSAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gIHhociBvcHQsIGNhbGxiYWNrX1xuXG5tb2R1bGUuZXhwb3J0cyA9IHhoclxuIl19
;