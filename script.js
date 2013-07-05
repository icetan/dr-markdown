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


},{}],5:[function(require,module,exports){
var extend, parseQuery, state, toDict, xhr;

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


},{"./xhr.coffee":4,"./state.coffee":6}],7:[function(require,module,exports){
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


},{}],8:[function(require,module,exports){
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


},{"./unify.coffee":3,"./state.coffee":6,"./state-gist.coffee":5,"./utils.coffee":7,"vixen":8,"showdown":9}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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
},{"__browserify_process":11}],11:[function(require,module,exports){
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


},{"events":10,"../lib/base64":12}],12:[function(require,module,exports){
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

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2FwcC5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS91bmlmeS5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS94aHIuY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9jb2ZmZWUvc3RhdGUtZ2lzdC5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS91dGlscy5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L25vZGVfbW9kdWxlcy92aXhlbi9pbmRleC5qcyIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvY29mZmVlL21haW4uY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9ub2RlX21vZHVsZXMvc2hvd2Rvd24vc3JjL3Nob3dkb3duLmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL2V2ZW50cy5qcyIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9jb2ZmZWUvc3RhdGUuY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9saWIvYmFzZTY0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxDQUFRLE1BQVIsZUFBQTs7OztBQ0FBLElBQUEsTUFBQTs7QUFBQSxDQUFBLEVBQUE7Q0FDRSxDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FEQSxDQUNBO0NBREEsQ0FFQSxDQUZBLEVBRUE7Q0FGQSxDQUdBLENBSEEsQ0FHQTtDQUhBLENBSUEsQ0FKQSxDQUlBO0NBSkEsQ0FLQSxDQUxBLEVBS0E7Q0FMQSxDQU1BLENBTkEsRUFNQTtDQU5BLENBT0EsQ0FQQSxDQU9BO0NBUEEsQ0FRQSxDQVJBLEVBUUE7Q0FSQSxDQVNBLENBVEEsQ0FTQTtDQVRBLENBVUEsQ0FWQSxDQVVBO0NBVkEsQ0FXQSxDQVhBLENBV0E7Q0FYQSxDQVlBLENBWkEsRUFZQTtDQVpBLENBYUEsQ0FiQSxFQWFBO0NBYkEsQ0FjQSxDQWRBLEVBY0E7Q0FmRixDQUFBOztBQWlCQSxDQWpCQSxDQWlCUSxDQUFBLEVBQVIsSUFBUztDQUNQLEtBQUEsT0FBQTtDQUFBLENBQUEsQ0FBQSxNQUFNO0NBQU4sQ0FDQSxDQUFJLENBQUEsSUFBZSxDQUFOO0NBQWtCLENBQU0sQ0FBRyxDQUFSO0NBQUQsQ0FBZ0IsRUFBQTtDQUEzQyxDQUFrRCxDQUFuQyxDQUFBO0NBRG5CLENBRUEsQ0FBUSxFQUFSLENBRkE7Q0FHQSxDQUFBLEVBQUcsV0FBQSxLQUFIO0NBQ0ssQ0FBRCxDQUFrQixFQUFBLE1BQXBCLENBQUE7Q0FBNEIsQ0FBTSxDQUFHLENBQVIsRUFBQTtDQUFELENBQWdCLENBQU0sRUFBUyxDQUFmO0NBRDlDLENBQ3VFLENBQXJFLEdBQUE7SUFMSTtDQUFBOztBQU9SLENBeEJBLEVBd0IrQixFQXhCL0IsRUF3Qm9CLENBQUEsRUFBVjs7QUFDVixDQXpCQSxFQXlCMEMsR0FBekIsQ0F6QmpCLEVBeUJpQixDQUFQLEVBQWdCOzs7O0FDekIxQixHQUFBLENBQUE7O0FBQUEsQ0FBQSxDQUFZLENBQVosS0FBTSxDQUFDO0NBQ0wsS0FBQSxnQkFBQTtBQUFJLENBQUosQ0FBQSxDQUFJLFdBQUo7Q0FBQSxDQUNBLENBQVUsQ0FBVixDQUFBLENBQU87Q0FEUCxDQUVBLENBQXVCLE1BQUEsU0FBdkI7Q0FDRSxHQUFBLENBQW1CLEtBQWhCO0NBQ0QsRUFBRyxDQUFBLEVBQUg7Q0FDVyxDQUFXLElBQXBCLEVBQUEsSUFBQSxHQUFBO01BREYsRUFBQTtDQUdXLENBQWMsTUFBdkIsRUFBQSxFQUFBLEdBQUE7UUFKSjtNQURxQjtDQUZ2QixFQUV1QjtDQU12QjtDQUFBLE1BQUEsT0FBQTswQkFBQTtDQUFBLENBQTJCLEVBQTNCLENBQUEsQ0FBQSxVQUFBO0NBQUEsRUFSQTtDQUFBLENBU0EsQ0FBVSxDQUFWO0NBVkksUUFXSjtDQVhJOztBQWFOLENBYkEsQ0FhaUIsQ0FBZCxDQUFILElBQVcsQ0FBQztDQUNWLEtBQUEsR0FBQTtDQUFBLENBQUEsQ0FBWSxDQUFBLEtBQVo7Q0FDRSxPQUFBLEVBQUE7QUFBZSxDQUFmLEdBQUEsU0FBRztDQUFzQixDQUFxQixDQUFkLEdBQUEsRUFBQSxLQUFBO01BQWhDO0NBQ0E7Q0FDRSxFQUFPLENBQVAsQ0FBTyxDQUFQO01BREY7Q0FHRSxLQURJO0NBQ0osRUFBQSxDQUFBLEVBQUE7TUFKRjtDQUtTLENBQUssQ0FBZCxDQUFBLElBQUEsR0FBQTtDQU5GLEVBQVk7Q0FBWixDQU9BLENBQUcsQ0FBSCxLQUFXO0NBUFgsQ0FRQSxDQUFHLElBQUg7Q0FBYyxDQUFnQixFQUFoQixVQUFBLElBQUE7Q0FSZCxHQUFBO0NBU0ksQ0FBSyxDQUFULE1BQUE7Q0FWUzs7QUFZWCxDQXpCQSxFQXlCaUIsR0FBWCxDQUFOOzs7O0FDekJBLElBQUEsa0NBQUE7O0FBQUEsQ0FBQSxFQUFBLElBQU0sT0FBQTs7QUFFTixDQUZBLENBRWdCLENBQVAsR0FBVCxHQUFVO0NBQVksR0FBQSxFQUFBOztHQUFWLENBQUY7SUFBWTtBQUFBLENBQUEsS0FBQSxDQUFBO2NBQUE7Q0FBQSxFQUFPLENBQVA7Q0FBQSxFQUFBO0NBQWIsUUFBcUM7Q0FBckM7O0FBQ1QsQ0FIQSxDQUdpQixDQUFSLENBQUEsQ0FBQSxDQUFULEdBQVU7Q0FBbUIsS0FBQSxPQUFBOztHQUFQLENBQUw7SUFBWTtBQUFBLENBQUEsTUFBQSxxQ0FBQTtxQkFBQTtDQUFBLEVBQVMsQ0FBVDtDQUFBLEVBQUE7Q0FBcEIsUUFBNEQ7Q0FBNUQ7O0FBQ1QsQ0FKQSxFQUlhLE1BQUMsQ0FBZDtDQUFvQixFQUFBLEdBQUE7TUFBQSxHQUFBOztDQUFPO0NBQUE7VUFBQSxpQ0FBQTtzQkFBQTtDQUFBLEVBQUcsRUFBSDtDQUFBOztDQUFQO0NBQVA7O0FBRWIsQ0FOQSxFQU1RLEVBQVIsRUFBUSxTQUFBOztBQTJCUixDQWpDQSxFQWtDRSxDQURGLENBQUssQ0FBTztDQUNWLENBQUEsQ0FBTyxDQUFBLENBQVAsR0FBTyxDQUFDO0NBQ0YsRUFBRCxDQUFILE9BQUE7Q0FDRSxDQUFRLElBQVI7Q0FBQSxDQUNLLENBQUwsR0FBQSx3QkFEQTtDQUFBLENBR0UsRUFERixFQUFBO0NBQ0UsQ0FBYSxNQUFiLEdBQUEsZ0JBQUE7Q0FBQSxDQUVFLEdBREYsR0FBQTtDQUNFLENBQVcsT0FBWCxDQUFBO0NBQVcsQ0FBUyxFQUFJLEdBQWIsS0FBQTtZQUFYO0NBQUEsQ0FDYyxRQUFkLEVBQUE7Q0FBYyxDQUFTLEVBQUksQ0FBSixFQUFULEVBQVMsR0FBVDtZQURkO1VBRkY7UUFIRjtFQU9ELENBQUEsQ0FBQSxFQVJELEdBUUU7Q0FBdUIsQ0FBVCxFQUFhLElBQWIsS0FBQTtDQVJoQixJQVFDO0NBVEgsRUFBTztDQUFQLENBVUEsQ0FBUyxJQUFULENBQVMsQ0FBQztDQUNKLEVBQUQsQ0FBSCxPQUFBO0NBQVMsQ0FBSSxDQUFKLEdBQUEseUJBQUk7RUFBb0MsQ0FBQSxDQUFBLEVBQWpELEdBQWtEO0NBQ2hELFNBQUEsMkJBQUE7Q0FBQSxDQUV5QixLQUdyQjtDQUNBLEVBQUQsQ0FBSCxTQUFBO0NBQVMsQ0FBSSxDQUFKLEtBQUE7RUFBYyxDQUFBLEVBQUEsR0FBdkIsQ0FBd0I7Q0FDbEIsRUFBSixZQUFBO0NBQUksQ0FBSSxDQUFKLElBQUEsR0FBQTtFQUFhLENBQUEsQ0FBQSxLQUFDLENBQWxCO0NBQ1csT0FBVCxTQUFBO0NBQVMsQ0FBRSxFQUFGLFFBQUU7Q0FBRixDQUFRLEdBQVIsT0FBUTtDQURGLFdBQ2Y7Q0FERixRQUFpQjtDQURuQixNQUF1QjtDQVB6QixJQUFpRDtDQVhuRCxFQVVTO0NBNUNYLENBQUE7Ozs7QUNBQSxDQUFPLEVBQ0wsR0FESSxDQUFOO0NBQ0UsQ0FBQSxDQUFtQixNQUFDLFFBQXBCO0NBQ0UsT0FBQSxXQUFBO0NBQUEsRUFBQSxDQUFBO0NBRUEsR0FBQSxJQUFXLENBQVg7Q0FDRSxDQUFFLEdBQUYsQ0FBQTtDQUFBLEVBQ0EsR0FBQSxFQUFjLENBQVUsRUFBbEI7Q0FETixFQUVZLENBQXFDLEVBQWpELEVBQW9CLENBQXBCLEVBQVk7QUFDZ0IsQ0FINUIsQ0FHMkIsQ0FBeEIsRUFBaUMsQ0FBcEMsR0FBQSxFQUFBO0NBSEEsRUFJQSxDQUFjLEVBQWQsR0FKQTtDQU1TLENBQUQsRUFBRixDQUEwQyxDQVBsRCxRQU9RO0NBQ04sQ0FBUSxDQUFSLEdBQUEsUUFBQTtNQVZGO0NBRGlCLFVBWWpCO0NBWkYsRUFBbUI7Q0FBbkIsQ0FjQSxDQUFRLEdBQVIsR0FBUztDQUNQLE9BQUEsb0dBQUE7Q0FBQSxFQUFXLENBQVgsSUFBQSxXQUFBO0NBQUEsQ0FBQSxDQUNRLENBQVIsQ0FBQTtDQURBLEVBRVEsQ0FBUixDQUFBLEdBQWdCO0NBRmhCLENBQUEsQ0FHQSxDQUFBO0FBQ0EsQ0FBQSxRQUFBLDJDQUFBO3NCQUFBO0NBQUEsRUFBSSxHQUFKO0NBQVcsQ0FBRyxNQUFGO0NBQUQsQ0FBVSxDQUFKLEtBQUE7Q0FBakIsT0FBQTtDQUFBLElBSkE7Q0FBQSxFQUtBLENBQUEsS0FBTztDQUNMLEdBQUEsTUFBQTthQUFBOztBQUFDLENBQUE7R0FBQSxXQUFXLG1GQUFYO0NBQ00sRUFBRSxDQUFILENBQWdCO0NBRHJCO1lBQUE7Q0FBQTs7Q0FBRCxFQUFBLENBQUE7Q0FORixJQUtNO0NBTE4sRUFTUSxDQUFSLENBQUEsSUFBUztDQUNQLFNBQUEsa0JBQUE7Q0FBQSxFQUFJLEdBQUo7QUFDQSxDQURBLENBQUEsSUFDQTtBQUNDLENBQUE7R0FBQSxTQUE2Qiw2R0FBN0I7Q0FBQSxFQUFJLEVBQU07Q0FBVjt1QkFISztDQVRSLElBU1E7Q0FUUixFQWFRLENBQVIsQ0FBQSxJQUFTO0NBQ1AsU0FBQSxHQUFBO0NBQUEsR0FBYyxDQUFkLENBQUE7Q0FBQSxDQUFBLENBQVEsRUFBUixHQUFBO1FBQUE7QUFDQSxDQUFBO1VBQUEsRUFBQTt3QkFBQTtDQUFBLEVBQUc7Q0FBSDt1QkFGTTtDQWJSLElBYVE7Q0FHUjtDQUFBLFFBQUEsNENBQUE7bUJBQUE7Q0FDRSxHQUFHLEVBQUgsTUFBRyxPQUFBO0NBQ0QsSUFBQSxHQUFBO0NBQ08sR0FBRCxFQUZSLEVBQUEsSUFFUSxPQUFBO0NBQ04sR0FBQSxDQUFBLEdBQUE7TUFIRixFQUFBO0NBS0UsRUFBSSxJQUFKLENBQUE7Q0FBQSxJQUNBLEdBQUE7Q0FDQSxHQUF5QixDQUFVLEdBQW5DO0NBQUEsQ0FBZSxDQUFBLENBQWYsQ0FBSyxLQUFMO1VBUEY7UUFERjtDQUFBLElBaEJBO0FBeUJBLENBQUEsRUFBQSxNQUFBLHFDQUFBO0NBQUEsQ0FBcUM7Q0FBckMsQ0FBOEIsSUFBOUIsTUFBQSxDQUFBO0NBQUEsSUF6QkE7Q0FETSxVQTJCTjtDQXpDRixFQWNRO0NBZFIsQ0EyQ0EsQ0FBTyxFQUFQLElBQVE7Q0FDTixPQUFBLFNBQUE7Q0FBQTtDQUFBLFFBQUEsa0NBQUE7b0JBQUE7Q0FDRSxFQUFjLENBQ0MsQ0FBQSxDQURmLEdBQUEsR0FDZSxDQUFBLGFBREU7Q0FEbkIsSUFBQTtDQURLLFVBT0w7Q0FsREYsRUEyQ087Q0EzQ1AsQ0FvREEsQ0FBQSxNQUFNO0NBQ0osT0FBQTtHQUFTLEdBQVQsS0FBQTs7Q0FBVTtDQUFBO1lBQUEsK0JBQUE7c0JBQUE7Q0FDUixDQUFHLENBQ0ssRUFETCxDQUFBLENBQUEsRUFBQSxRQUFBO0NBREs7O0NBQUQsQ0FBQSxDQU1JLENBTko7Q0FyRFgsRUFvREs7Q0FyRFAsQ0FBQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBLElBQUEsb0RBQUE7O0FBQUMsQ0FBRCxFQUFpQixJQUFBLENBQUEsSUFBakI7O0FBRUEsQ0FGQSxFQUVTLEdBQVQsQ0FBUyxRQUFBOztBQUdULENBTEEsRUFLQSxNQUFNO0NBQUcsS0FBQTtDQUFLLEVBQUwsQ0FBSSxLQUFKOztBQUNOLENBQUE7R0FBQSxPQUFvRCxvQkFBcEQ7Q0FBQSxDQUFtQixDQUFnQixDQUFaLEVBQUosWUFBQTtDQUFuQjs7Q0FBRCxDQUFBLEVBQUE7Q0FESTs7QUFHTixDQVJBLEVBUWMsTUFBQSxFQUFkO0NBQ0UsS0FBQSxRQUFBO0NBQUEsQ0FBQSxDQUFhLENBQW9CLENBQXBCLENBQU0sQ0FBTixDQUFlO1NBQzVCO0NBQUEsQ0FBRSxFQUFBO0NBQUYsQ0FBUSxFQUFBO0NBRkk7Q0FBQTs7QUFHZCxDQVhBLEVBV1ksQ0FBQSxLQUFaO0NBQTZCLEVBQWdCLENBQXZCLEVBQU0sRUFBUyxDQUFmO0NBQVY7O0FBRVosQ0FiQSxFQWFpQixFQUFBLENBQVgsQ0FBTixLQWJBOztBQWVBLENBZkEsRUFla0IsRUFBYixHQWZMLENBZUE7O0FBQ0EsQ0FoQkEsQ0FBQSxDQWdCZ0IsRUFBWCxFQUFMOztBQUVBLENBbEJBLEVBc0JFLEVBSkcsQ0FBTDtDQUlFLENBQUEsSUFBQTtDQUNFLENBQU8sQ0FBQSxDQUFQLENBQUEsR0FBTyxDQUFDO0NBQ0csR0FBa0IsRUFBWixFQUFmLENBQXVCLElBQXZCO0NBREYsSUFBTztDQUFQLENBRVMsQ0FBQSxDQUFULEdBQUEsQ0FBUyxDQUFDO0NBQ0MsQ0FBVyxFQUFQLENBQUosQ0FBaUIsRUFBMUIsS0FBQTtDQUhGLElBRVM7SUFIWDtDQUFBLENBS0EsVUFBQTtDQUNFLENBQU8sQ0FBQSxDQUFQLENBQUEsR0FBTyxDQUFDOztDQUNBLEVBQUEsS0FBTjtRQUFBO0NBQUEsQ0FDQSxFQUFvQyxFQUFwQyxDQUFBLEVBQWdDLEdBQWI7Q0FDVixDQUFULE1BQUEsS0FBQTtDQUhGLElBQU87Q0FBUCxDQUlTLENBQUEsQ0FBVCxHQUFBLENBQVMsQ0FBQztDQUNDLENBQVcsRUFBUCxDQUFKLENBQWlCLENBQU4sQ0FBcEIsSUFBdUMsQ0FBdkM7Q0FMRixJQUlTO0lBVlg7Q0F0QkYsQ0FBQTs7QUFtQ0EsQ0FuQ0EsQ0FtQzBCLENBQVosQ0FBQSxDQUFULEdBQVMsQ0FBQztDQUNiLENBQUEsRUFBK0IsS0FBL0I7Q0FBQSxFQUFrQixDQUFsQixDQUFLLElBQUw7SUFBQTtDQUNNLENBQTZDLENBQU0sQ0FBekQsQ0FBSyxDQUFRLENBQWIsRUFBQTtDQUNFLEVBQWdCLENBQWhCLENBQUssRUFBTDtDQUFBLEdBQ0EsS0FBQTtDQUFVLENBQUssRUFBTCxDQUFVLENBQVYsR0FBQTtDQUFBLENBQXNCLElBQUEsQ0FBdEI7Q0FEVixLQUNBO0NBQ1UsRUFBVjtDQUhGLEVBQXlEO0NBRjdDOztBQU9kLENBMUNBLENBMEM0QixDQUFaLEVBQVgsRUFBTCxDQUFnQixDQUFDO0NBQ2YsR0FBQSxFQUFBO0NBQUEsQ0FBQSxFQUFPLGFBQVAsRUFBRztDQUNELENBQU8sRUFBUCxHQUFpQyxJQUFBO0lBRG5DO0NBRUEsQ0FBQSxFQUErQixLQUEvQjtDQUFBLEVBQWtCLENBQWxCLENBQUssSUFBTDtJQUZBO0NBQUEsQ0FHQSxDQUFnQixFQUFYLEVBQUw7Q0FDQSxDQUFBLEVBQUcsV0FBSDtDQUNRLENBQStDLENBQUEsQ0FBQSxDQUFoRCxDQUFRLENBQWIsRUFBYSxFQUFiO0NBQ1csR0FBVCxJQUFBLEtBQUE7Q0FERixJQUFxRDtJQU56QztDQUFBOztBQVNoQixDQW5EQSxDQW1Ec0MsQ0FBQSxHQUFoQyxHQUFnQyxHQUF0QyxJQUFBO0NBQ0UsS0FBQSxrQkFBQTtDQUFBLENBQUEsRUFBQSxHQUFpQyxJQUFBO0NBQ2pDLENBQUEsRUFBRyxDQUFlLEVBQW1CLEVBQWxDO0NBQ0ssQ0FBbUIsQ0FBUyxDQUFBLENBQTdCLEVBQUwsRUFBQSxFQUFBO0NBQ1EsQ0FBZ0IsRUFBdEIsQ0FBSyxJQUFMLElBQUE7Q0FERixJQUFrQztJQUhBO0NBQUE7Ozs7QUNuRHRDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZSgnLi9jb2ZmZWUvbWFpbi5jb2ZmZWUnKSgpXG4iLCJtYXAgPVxyXG4gICc8PSc6ICfih5AnICMgJ1xcdTIxZDAnXHJcbiAgJz0+JzogJ+KHkicgIyAnXFx1MjFkMidcclxuICAnPD0+JzogJ+KHlCcgIyAnXFx1MjFkNCdcclxuICAnPC0nOiAn4oaQJyAjICdcXHUyMTkwJ1xyXG4gICctPic6ICfihpInICMgJ1xcdTIxOTInXHJcbiAgJzwtPic6ICfihpQnICMgJ1xcdTIxOTQnXHJcbiAgJy4uLic6ICfigKYnXHJcbiAgJy0tJzogJ+KAkydcclxuICAnLS0tJzogJ+KAlCdcclxuICAnXjEnOiAnwrknXHJcbiAgJ14yJzogJ8KyJ1xyXG4gICdeMyc6ICfCsydcclxuICAnMS8yJzogJ8K9J1xyXG4gICcxLzQnOiAnwrwnXHJcbiAgJzMvNCc6ICfCvidcclxuXHJcbnVuaWZ5ID0gKGNtKSAtPlxyXG4gIHBvcyA9IGNtLmdldEN1cnNvcigpXHJcbiAgbSA9IC9bXlxcc10rJC8uZXhlYyBjbS5nZXRSYW5nZSB7bGluZTpwb3MubGluZSwgY2g6MH0sIHBvc1xyXG4gIHRva2VuID0gbT9bMF1cclxuICBpZiB0b2tlbj8gYW5kIG1hcFt0b2tlbl0/XHJcbiAgICBjbS5yZXBsYWNlUmFuZ2UgbWFwW3Rva2VuXSwge2xpbmU6cG9zLmxpbmUsIGNoOnBvcy5jaC10b2tlbi5sZW5ndGh9LCBwb3NcclxuXHJcbkNvZGVNaXJyb3IuY29tbWFuZHNbJ3VuaWZ5J10gPSB1bmlmeVxyXG5Db2RlTWlycm9yLmtleU1hcC5kZWZhdWx0WydDdHJsLVNwYWNlJ10gPSAndW5pZnknXHJcbiIsInhociA9IChvcHQsIGNhbGxiYWNrKSAtPlxuICByID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gIHIub3BlbiBvcHQubWV0aG9kIG9yICdHRVQnLCBvcHQudXJsLCB0cnVlXG4gIHIub25yZWFkeXN0YXRlY2hhbmdlID0gLT5cbiAgICBpZiByLnJlYWR5U3RhdGUgaXMgNFxuICAgICAgaWYgci5zdGF0dXMgPj0gMjAwIGFuZCByLnN0YXR1cyA8IDMwMFxuICAgICAgICBjYWxsYmFjayB1bmRlZmluZWQsIHIucmVzcG9uc2VUZXh0LCByXG4gICAgICBlbHNlXG4gICAgICAgIGNhbGxiYWNrIHIuc3RhdHVzVGV4dCwgci5yZXNwb25zZVRleHQsIHJcbiAgci5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpIGZvciBoZWFkZXIsIHZhbHVlIG9mIG9wdC5oZWFkZXJzXG4gIHIuc2VuZCBvcHQuZGF0YVxuICByXG5cbnhoci5qc29uID0gKG9wdCwgY2FsbGJhY2spIC0+XG4gIGNhbGxiYWNrXyA9IChlcnIsIGpzb24sIHhocikgLT5cbiAgICBpZiBlcnI/IG9yIG5vdCBqc29uIHRoZW4gcmV0dXJuIGNhbGxiYWNrIGVyciwgdW5kZWZpbmVkLCB4aHJcbiAgICB0cnlcbiAgICAgIGRhdGEgPSBKU09OLnBhcnNlIGpzb25cbiAgICBjYXRjaCBlcnJfXG4gICAgICBlcnIgPSBlcnJfXG4gICAgY2FsbGJhY2sgZXJyLCBkYXRhLCB4aHJcbiAgb3B0LmRhdGEgPSBKU09OLnN0cmluZ2lmeSBvcHQuZGF0YVxuICBvcHQuaGVhZGVycyA9ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgeGhyIG9wdCwgY2FsbGJhY2tfXG5cbm1vZHVsZS5leHBvcnRzID0geGhyXG4iLCJ4aHIgPSByZXF1aXJlICcuL3hoci5jb2ZmZWUnXG5cbmV4dGVuZCA9IChyPXt9LCBkKSAtPiByW2tdID0gdiBmb3IgaywgdiBvZiBkOyByXG50b0RpY3QgPSAoYXJyYXksIGRpY3Q9e30pIC0+IGRpY3Rba3ZwWzBdXSA9IGt2cFsxXSBmb3Iga3ZwIGluIGFycmF5OyBkaWN0XG5wYXJzZVF1ZXJ5ID0gKHMpIC0+IHRvRGljdChrdnAuc3BsaXQoJz0nKSBmb3Iga3ZwIGluIHMucmVwbGFjZSgvXlxcPy8sJycpLnNwbGl0KCcmJykpXG5cbnN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZS5jb2ZmZWUnXG5cbiNjbGllbnRJZCA9ICcwNGM0ZGUzMzMyNjY0ZDcwNDY0MidcbiNyZWRpcmVjdCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmXG4jYXV0aCA9IC0+XG4jICBxdWVyeSA9IHBhcnNlUXVlcnkgd2luZG93LmxvY2F0aW9uLnNlYXJjaFxuIyAgaWYgcXVlcnkuY29kZVxuIyAgICB4T3JpZ1N0YXRlID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtICd4LW9yaWctc3RhdGUnXG4jICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSAneC1vcmlnLXN0YXRlJ1xuIyAgICBpZiB4T3JpZ1N0YXRlIGlzbnQgcXVlcnkuc3RhdGVcbiMgICAgICByZXR1cm4gY29uc29sZS5lcnJvciAnY3Jvc3Mgb3JpZ2luIHN0YXRlIGhhcyBiZWVuIHRhbXBlcmVkIHdpdGguJ1xuIyAgICB4aHJcbiMgICAgICBtZXRob2Q6ICdQT1NUJ1xuIyAgICAgIHVybDogJ2h0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hY2Nlc3NfdG9rZW4nXG4jICAgICAgZGF0YTpcbiMgICAgICAgIGNsaWVudF9pZDogY2xpZW50SWRcbiMgICAgICAgIGNsaWVudF9zZWNyZXQ6IGNsaWVudFNlY3JldFxuIyAgICAgICAgY29kZTogcXVlcnkuY29kZVxuIyAgICAsKGVyciwgZGF0YSkgLT5cbiMgICAgICBjb25zb2xlLmxvZyBkYXRhXG4jICBlbHNlIGlmIHF1ZXJ5LmVycm9yXG4jXG4jICBlbHNlXG4jICAgIHJuZCA9ICgnMDEyMzQ1Njc4OWFiY2RlZidbTWF0aC5yYW5kb20oKSAqIDE2IHwgMF0gZm9yIHggaW4gWzAuLjEwXSkuam9pbiAnJ1xuIyAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0gJ3gtb3JpZy1zdGF0ZScsIHJuZFxuIyAgICB3aW5kb3cub3BlbiBcImh0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hdXRob3JpemU/Y2xpZW50X2lkPSN7Y2xpZW50SWR9JnNjb3BlPWdpc3Qmc3RhdGU9I3tybmR9JnJlZGlyZWN0X3VyaT0je3JlZGlyZWN0fVwiXG5cbnN0YXRlLnN0b3Jlcy5naXN0ID1cbiAgc3RvcmU6IChpZCwgZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgeGhyLmpzb25cbiAgICAgIG1ldGhvZDogJ1BPU1QnICNpZiBpZCB0aGVuICdQQVRDSCcgZWxzZSAnUE9TVCdcbiAgICAgIHVybDogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMnICMrIGlmIGlkIHRoZW4gJy8nK2lkIGVsc2UgJydcbiAgICAgIGRhdGE6XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlZCB3aXRoIERyLiBNYXJrZG93bidcbiAgICAgICAgZmlsZXM6XG4gICAgICAgICAgJ21haW4ubWQnOiBjb250ZW50OiBkYXRhLnRleHRcbiAgICAgICAgICAnc3RhdGUuanNvbic6IGNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5IGRhdGEuc3RhdGVcbiAgICAsKGVyciwgZGF0YSkgLT4gY2FsbGJhY2sgZGF0YS5pZFxuICByZXN0b3JlOiAoaWQsIGNhbGxiYWNrKSAtPlxuICAgIHhoci5qc29uIHVybDonaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9naXN0cy8nK2lkLCAoZXJyLCBkYXRhKSAtPlxuICAgICAge1xuICAgICAgICBmaWxlczoge1xuICAgICAgICAgICdtYWluLm1kJzogeyByYXdfdXJsOnRleHRVcmwgfSxcbiAgICAgICAgICAnc3RhdGUuanNvbic6IHsgcmF3X3VybDpzdGF0ZVVybCB9XG4gICAgICAgIH1cbiAgICAgIH0gPSBkYXRhXG4gICAgICB4aHIuanNvbiB1cmw6c3RhdGVVcmwsIChlcnIsIHN0YXRlKSAtPlxuICAgICAgICB4aHIgdXJsOnRleHRVcmwsIChlcnIsIHRleHQpIC0+XG4gICAgICAgICAgY2FsbGJhY2sgeyB0ZXh0LCBzdGF0ZSB9XG5cbiNzZXRUaW1lb3V0ICgtPiBhdXRoKCkpLCAxMDAwXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFxuICBnZXRDdXJzb3JQb3NpdGlvbjogKGVsKSAtPlxuICAgIHBvcyA9IDBcbiAgICAjIElFIFN1cHBvcnRcbiAgICBpZiBkb2N1bWVudC5zZWxlY3Rpb25cbiAgICAgIGVsLmZvY3VzKClcbiAgICAgIFNlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpXG4gICAgICBTZWxMZW5ndGggPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKS50ZXh0Lmxlbmd0aFxuICAgICAgU2VsLm1vdmVTdGFydCAnY2hhcmFjdGVyJywgLWVsLnZhbHVlLmxlbmd0aFxuICAgICAgcG9zID0gU2VsLnRleHQubGVuZ3RoIC0gU2VsTGVuZ3RoXG4gICAgIyBGaXJlZm94IHN1cHBvcnRcbiAgICBlbHNlIGlmIGVsLnNlbGVjdGlvblN0YXJ0IG9yIGVsLnNlbGVjdGlvblN0YXJ0IGlzIDBcbiAgICAgIHBvcyA9IGVsLnNlbGVjdGlvblN0YXJ0XG4gICAgcG9zXG5cbiAgbnVtYmVyOiAoZWwpIC0+XG4gICAgc2VsZWN0b3IgPSAnSDEsSDIsSDMsSDQsSDUsSDYnICMgKyAnLE9MLFVMLExJJ1xuICAgIGVsZW1zID0gW11cbiAgICBvcmRlciA9IHNlbGVjdG9yLnNwbGl0KCcsJylcbiAgICBtYXAgPSB7fVxuICAgIG1hcFtzZWxdID0ge2M6MCwgcG9zOml9IGZvciBzZWwsIGkgaW4gb3JkZXJcbiAgICBudW0gPSAodGFnKSAtPlxuICAgICAgKGMgZm9yIGkgaW4gWzAuLm1hcFt0YWddLnBvc11cXFxuICAgICAgIHdoZW4gKGM9bWFwWyh0PW9yZGVyW2ldKV0uYykgaXNudCAwXFxcbiAgICAgICBhbmQgdCBub3QgaW4gWydPTCcsICdVTCddKS5qb2luICcsJ1xuICAgIGNvdW50ID0gKHNlbCkgLT5cbiAgICAgIGUgPSBtYXBbc2VsXVxuICAgICAgZS5jKytcbiAgICAgIChtYXBbb3JkZXJbaV1dLmMgPSAwIGZvciBpIGluIFtlLnBvcysxLi4ub3JkZXIubGVuZ3RoXSlcbiAgICByZXNldCA9IChjbGVhcikgLT5cbiAgICAgIGVsZW1zID0gW10gaWYgY2xlYXJcbiAgICAgIG9iai5jID0gMCBmb3Igc2VsLG9iaiBvZiBtYXBcbiAgICBmb3IgaCwgaSBpbiBlbC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1udW1iZXItcmVzZXRdLFtkYXRhLW51bWJlci1jbGVhcl0sJytzZWxlY3RvcilcbiAgICAgIGlmIGguaGFzQXR0cmlidXRlICdkYXRhLW51bWJlci1yZXNldCdcbiAgICAgICAgcmVzZXQoKVxuICAgICAgZWxzZSBpZiBoLmhhc0F0dHJpYnV0ZSAnZGF0YS1udW1iZXItY2xlYXInXG4gICAgICAgIHJlc2V0IHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgdCA9IGgudGFnTmFtZVxuICAgICAgICBjb3VudCB0XG4gICAgICAgIGVsZW1zLnB1c2ggW2gsIG51bSB0XSBpZiB0IG5vdCBpbiBbJ09MJywgJ1VMJ11cbiAgICBoLnNldEF0dHJpYnV0ZSAnZGF0YS1udW1iZXInLCBuIGZvciBbaCwgbl0gaW4gZWxlbXNcbiAgICBlbFxuXG4gIGluZGV4OiAoZWwpIC0+XG4gICAgZm9yIGUgaW4gZWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbnVtYmVyXScpXG4gICAgICBlLmlubmVySFRNTCA9IFwiXCJcIlxuICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAje2UuZ2V0QXR0cmlidXRlKCdkYXRhLW51bWJlcicpLnNwbGl0KCcsJykuam9pbignLiAnKX0uXG4gICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgIFwiXCJcIiArIGUuaW5uZXJIVE1MXG4gICAgZWxcblxuICB0b2M6IChlbCkgLT5cbiAgICAnPHVsPicgKyAoZm9yIGUgaW4gZWwucXVlcnlTZWxlY3RvckFsbCgnSDEsSDIsSDMsSDQsSDUsSDYnKVxuICAgICAgXCJcIlwiXG4gICAgICA8bGk+PGEgaHJlZj1cIiMje2UuaWR9XCI+PCN7ZS50YWdOYW1lfT5cbiAgICAgICN7ZS5pbm5lckhUTUx9XG4gICAgICA8LyN7ZS50YWdOYW1lfT48L2E+PC9saT5cbiAgICAgIFwiXCJcIlxuICAgICkuam9pbignJykgKyAnPC91bD4nXG4iLCIhZnVuY3Rpb24ob2JqKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJylcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG9iajtcbiAgZWxzZVxuICAgIHdpbmRvdy52aXhlbiA9IG9iajtcbn0oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIHRyaW0oc3RyKSB7cmV0dXJuIFN0cmluZy5wcm90b3R5cGUudHJpbS5jYWxsKHN0cik7fTtcblxuICBmdW5jdGlvbiByZXNvbHZlUHJvcChvYmosIG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZS50cmltKCkuc3BsaXQoJy4nKS5yZWR1Y2UoZnVuY3Rpb24gKHAsIHByb3ApIHtcbiAgICAgIHJldHVybiBwID8gcFtwcm9wXSA6IHVuZGVmaW5lZDtcbiAgICB9LCBvYmopO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZUNoYWluKG9iaiwgY2hhaW4pIHtcbiAgICB2YXIgcHJvcCA9IGNoYWluLnNoaWZ0KCk7XG4gICAgcmV0dXJuIGNoYWluLnJlZHVjZShmdW5jdGlvbiAocCwgcHJvcCkge1xuICAgICAgdmFyIGYgPSByZXNvbHZlUHJvcChvYmosIHByb3ApO1xuICAgICAgcmV0dXJuIGYgPyBmKHApIDogcDtcbiAgICB9LCByZXNvbHZlUHJvcChvYmosIHByb3ApKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1Y2tldChiLCBrLCB2KSB7XG4gICAgaWYgKCEoayBpbiBiKSkgYltrXSA9IFtdO1xuICAgIGlmICghKHYgaW4gYltrXSkpIGJba10ucHVzaCh2KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dGVuZChvcmlnLCBvYmopIHtcbiAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgb3JpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICB9KTtcbiAgICByZXR1cm4gb3JpZztcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYXZlcnNlRWxlbWVudHMoZWwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGk7XG4gICAgaWYgKGNhbGxiYWNrKGVsKSAhPT0gZmFsc2UpIHtcbiAgICAgIGZvcihpID0gZWwuY2hpbGRyZW4ubGVuZ3RoOyBpLS07KSAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdHJhdmVyc2VFbGVtZW50cyhub2RlLCBjYWxsYmFjayk7XG4gICAgICB9KShlbC5jaGlsZHJlbltpXSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUHJveHkobWFwcywgcHJveHkpIHtcbiAgICBwcm94eSA9IHByb3h5IHx8IHt9O1xuICAgIHByb3h5LmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIHRvUmVuZGVyID0ge307XG4gICAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICBtYXBzLm9yaWdbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgIGlmIChtYXBzLmJpbmRzW3Byb3BdKSBtYXBzLmJpbmRzW3Byb3BdLmZvckVhY2goZnVuY3Rpb24ocmVuZGVySWQpIHtcbiAgICAgICAgICBpZiAocmVuZGVySWQgPj0gMCkgdG9SZW5kZXJbcmVuZGVySWRdID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGZvciAocmVuZGVySWQgaW4gdG9SZW5kZXIpIG1hcHMucmVuZGVyc1tyZW5kZXJJZF0obWFwcy5vcmlnKTtcbiAgICAgIHJldHVybiBwcm94eTtcbiAgICB9O1xuXG4gICAgT2JqZWN0LmtleXMobWFwcy5iaW5kcykuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICB2YXIgaWRzID0gbWFwcy5iaW5kc1twcm9wXTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eSwgcHJvcCwge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgbWFwcy5vcmlnW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgaWRzLmZvckVhY2goZnVuY3Rpb24ocmVuZGVySWQpIHtcbiAgICAgICAgICAgIGlmIChyZW5kZXJJZCA+PSAwKSBtYXBzLnJlbmRlcnNbcmVuZGVySWRdKG1hcHMub3JpZyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKG1hcHMucmViaW5kc1twcm9wXSlcbiAgICAgICAgICAgIHJldHVybiBtYXBzLnJlYmluZHNbcHJvcF0oKTtcbiAgICAgICAgICByZXR1cm4gbWFwcy5vcmlnW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcHJveHk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24oZWwsIG1vZGVsKSB7XG4gICAgdmFyIHBhdHRlcm4gPSAvXFx7XFx7Lis/XFx9XFx9L2csXG4gICAgICAgIHBpcGUgPSAnfCc7XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlKG9yaWcsIHByb3ApIHtcbiAgICAgIGlmICghb3JpZykgcmV0dXJuICcnO1xuICAgICAgdmFyIHZhbCA9IHJlc29sdmVDaGFpbihvcmlnLCBwcm9wLnNsaWNlKDIsLTIpLnNwbGl0KHBpcGUpKTtcbiAgICAgIHJldHVybiB2YWwgPT09IHVuZGVmaW5lZCA/ICcnIDogdmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0clRtcGwoc3RyLCBvcmlnKSB7XG4gICAgICByZXR1cm4gc3RyLnJlcGxhY2UocGF0dGVybiwgcmVzb2x2ZS5iaW5kKHVuZGVmaW5lZCwgb3JpZykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoKHN0cikge1xuICAgICAgdmFyIG0gPSBzdHIubWF0Y2gocGF0dGVybik7XG4gICAgICBpZiAobSkgcmV0dXJuIG0ubWFwKGZ1bmN0aW9uKGNoYWluKSB7XG4gICAgICAgIHJldHVybiBjaGFpbi5zbGljZSgyLCAtMikuc3BsaXQocGlwZSkubWFwKHRyaW0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhdmVyc2UoZWwsIG9yaWcpIHtcbiAgICAgIHZhciBiaW5kcyA9IHt9LFxuICAgICAgICAgIHJlYmluZHMgPSB7fSxcbiAgICAgICAgICByZW5kZXJzID0ge30sXG4gICAgICAgICAgY291bnQgPSAwO1xuICAgICAgb3JpZyA9IG9yaWcgfHwge307XG5cbiAgICAgIGZ1bmN0aW9uIGJpbmRSZW5kZXJzKGNoYWlucywgcmVuZGVySWQpIHtcbiAgICAgICAgLy8gQ3JlYXRlIHByb3BlcnR5IHRvIHJlbmRlciBtYXBwaW5nXG4gICAgICAgIGNoYWlucy5mb3JFYWNoKGZ1bmN0aW9uKGNoYWluKSB7XG4gICAgICAgICAgLy8gVE9ETzogUmVnaXN0ZXIgY2hhaW5pbmcgZnVuY3Rpb25zIGFzIGJpbmRzIGFzIHdlbGwuXG4gICAgICAgICAgYnVja2V0KGJpbmRzLCBjaGFpblswXS5zcGxpdCgnLicpWzBdLCByZW5kZXJJZCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwYXJzZUl0ZXJhdG9yKGVsKSB7XG4gICAgICAgIHZhciBtYXJrZXIsIHByZWZpeCA9ICcnLCBub2RlcyA9IFtdO1xuICAgICAgICBpZiAocGFyZW50XyA9IChlbC5wYXJlbnRFbGVtZW50IHx8IGVsLnBhcmVudE5vZGUpKSB7XG4gICAgICAgICAgaWYgKGVsLnRhZ05hbWUgPT09ICdGT1InKSB7XG4gICAgICAgICAgICBtYXJrZXIgPSBlbC5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgICAgIHBhcmVudF8ucmVwbGFjZUNoaWxkKG1hcmtlciwgZWwpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWluJykpIHtcbiAgICAgICAgICAgIHByZWZpeCA9ICdkYXRhLSc7XG4gICAgICAgICAgICBwYXJlbnRfID0gZWw7XG4gICAgICAgICAgICBub2RlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVsLmNoaWxkTm9kZXMpO1xuICAgICAgICAgICAgbWFya2VyID0gZWwub3duZXJEb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICAgICAgICBwYXJlbnRfLmFwcGVuZENoaWxkKG1hcmtlcik7XG4gICAgICAgICAgfSBlbHNlIHJldHVybjtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWxpYXM6IGVsLmdldEF0dHJpYnV0ZShwcmVmaXgrJ3ZhbHVlJyksXG4gICAgICAgICAgICBrZXk6IGVsLmdldEF0dHJpYnV0ZShwcmVmaXgrJ2tleScpLFxuICAgICAgICAgICAgcHJvcDogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsnaW4nKSxcbiAgICAgICAgICAgIGVhY2g6IGVsLmdldEF0dHJpYnV0ZShwcmVmaXgrJ2VhY2gnKSxcbiAgICAgICAgICAgIG5vZGVzOiBub2RlcyxcbiAgICAgICAgICAgIHBhcmVudDogcGFyZW50XyxcbiAgICAgICAgICAgIG1hcmtlcjogbWFya2VyXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYXBBdHRyaWJ1dGUob3duZXIsIGF0dHIpIHtcbiAgICAgICAgdmFyIG5hbWUsIGV2ZW50SWQsIHJlbmRlcklkLCBzdHIsIG5vVG1wbDtcbiAgICAgICAgaWYgKChzdHIgPSBhdHRyLnZhbHVlKSAmJiAoY2hhaW5zID0gbWF0Y2goc3RyKSkpIHtcbiAgICAgICAgICBuYW1lID0gYXR0ci5uYW1lO1xuICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoJ3Z4LScpID09PSAwKSB7XG4gICAgICAgICAgICBvd25lci5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoJ29uJykgPT09IDApIHtcbiAgICAgICAgICAgIHJlbmRlcklkID0gLTE7IC8vIE5vIHJlbmRlcmVyXG4gICAgICAgICAgICBldmVudE5hbWUgPSBuYW1lLnN1YnN0cigyKTtcbiAgICAgICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lcnNcbiAgICAgICAgICAgIGNoYWlucy5mb3JFYWNoKGZ1bmN0aW9uKGNoYWluKSB7XG4gICAgICAgICAgICAgIG93bmVyLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZVByb3Aob3JpZywgY2hhaW5bMF0pKGV2dCwgb3duZXIudmFsdWUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgb3duZXIucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub1RtcGwgPSBjaGFpbnMubGVuZ3RoID09PSAxICYmIHN0ci5zdWJzdHIoMCwxKSA9PT0gJ3snICYmXG4gICAgICAgICAgICAgIHN0ci5zdWJzdHIoLTEpID09PSAnfSc7XG4gICAgICAgICAgICAvLyBDcmVhdGUgcmVuZGVyaW5nIGZ1bmN0aW9uIGZvciBhdHRyaWJ1dGUuXG4gICAgICAgICAgICByZW5kZXJJZCA9IGNvdW50Kys7XG4gICAgICAgICAgICAocmVuZGVyc1tyZW5kZXJJZF0gPSBmdW5jdGlvbihvcmlnLCBjbGVhcikge1xuICAgICAgICAgICAgICB2YXIgdmFsID0gbm9UbXBsID8gcmVzb2x2ZShvcmlnLCBzdHIpIDogc3RyVG1wbChzdHIsIG9yaWcpO1xuICAgICAgICAgICAgICAhY2xlYXIgJiYgbmFtZSBpbiBvd25lciA/IG93bmVyW25hbWVdID0gdmFsIDpcbiAgICAgICAgICAgICAgICBvd25lci5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKTtcbiAgICAgICAgICAgIH0pKG9yaWcsIHRydWUpO1xuICAgICAgICAgICAgLy8gQmktZGlyZWN0aW9uYWwgY291cGxpbmcuXG4gICAgICAgICAgICBpZiAobm9UbXBsKSByZWJpbmRzW2NoYWluc1swXVswXV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBHZXR0aW5nIGYuZXguICd2YWx1ZScgYXR0cmlidXRlIGZyb20gYW4gaW5wdXRcbiAgICAgICAgICAgICAgICAvLyBkb2Vzbid0IHJldHVybiB1c2VyIGlucHV0IHZhbHVlIHNvIGFjY2Vzc2luZyBlbGVtZW50XG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0IHByb3BlcnRpZXMgZGlyZWN0bHksIGZpbmQgb3V0IGhvdyB0byBkbyB0aGlzXG4gICAgICAgICAgICAgICAgLy8gbW9yZSBzZWN1cmVseS5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmFtZSBpbiBvd25lciA/XG4gICAgICAgICAgICAgICAgICBvd25lcltuYW1lXSA6IG93bmVyLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYmluZFJlbmRlcnMoY2hhaW5zLCByZW5kZXJJZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbWFwVGV4dE5vZGVzKGVsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBlbC5jaGlsZE5vZGVzLmxlbmd0aDsgaS0tOykgKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICB2YXIgc3RyLCByZW5kZXJJZCwgY2hhaW5zO1xuICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBlbC5URVhUX05PREUgJiYgKHN0ciA9IG5vZGUubm9kZVZhbHVlKSAmJlxuICAgICAgICAgICAgICAoY2hhaW5zID0gbWF0Y2goc3RyKSkpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSByZW5kZXJpbmcgZnVuY3Rpb24gZm9yIGVsZW1lbnQgdGV4dCBub2RlLlxuICAgICAgICAgICAgcmVuZGVySWQgPSBjb3VudCsrO1xuICAgICAgICAgICAgKHJlbmRlcnNbcmVuZGVySWRdID0gZnVuY3Rpb24ob3JpZykge1xuICAgICAgICAgICAgICBub2RlLm5vZGVWYWx1ZSA9IHN0clRtcGwoc3RyLCBvcmlnKTtcbiAgICAgICAgICAgIH0pKG9yaWcpO1xuICAgICAgICAgICAgYmluZFJlbmRlcnMoY2hhaW5zLCByZW5kZXJJZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KShlbC5jaGlsZE5vZGVzW2ldKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIG5vLXRyYXZlcnNlIGF0dHJpYnV0ZSBpZiByb290IG5vZGVcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zdWJ2aWV3Jyk7XG5cbiAgICAgIHRyYXZlcnNlRWxlbWVudHMoZWwsIGZ1bmN0aW9uKGVsXykge1xuICAgICAgICB2YXIgaSwgaXRlciwgdGVtcGxhdGUsIG5vZGVzLCByZW5kZXJJZDtcblxuICAgICAgICAvLyBTdG9wIGhhbmRsaW5nIGFuZCByZWN1cnNpb24gaWYgc3Vidmlldy5cbiAgICAgICAgaWYgKGVsXy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3VidmlldycpICE9PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKGl0ZXIgPSBwYXJzZUl0ZXJhdG9yKGVsXykpIHtcbiAgICAgICAgICBub2RlcyA9IGl0ZXIubm9kZXM7XG4gICAgICAgICAgdGVtcGxhdGUgPSBlbF8uY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIG1hcHMgPSB0cmF2ZXJzZSh0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICAgIHJlbmRlcklkID0gY291bnQrKztcbiAgICAgICAgICAocmVuZGVyc1tyZW5kZXJJZF0gPSBmdW5jdGlvbihvcmlnKSB7XG4gICAgICAgICAgICB2YXIgbGlzdCA9IHJlc29sdmVQcm9wKG9yaWcsIGl0ZXIucHJvcCksXG4gICAgICAgICAgICAgICAgZWFjaF8gPSBpdGVyLmVhY2ggJiYgcmVzb2x2ZVByb3Aob3JpZywgaXRlci5lYWNoKSwgaTtcbiAgICAgICAgICAgIGZvciAoaSA9IG5vZGVzLmxlbmd0aDsgaS0tOykgaXRlci5wYXJlbnQucmVtb3ZlQ2hpbGQobm9kZXNbaV0pO1xuICAgICAgICAgICAgbm9kZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaSBpbiBsaXN0KSBpZiAobGlzdC5oYXNPd25Qcm9wZXJ0eShpKSlcbiAgICAgICAgICAgICAgKGZ1bmN0aW9uKHZhbHVlLCBpKXtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ18gPSBleHRlbmQoe30sIG9yaWcpLFxuICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHRlbXBsYXRlLmNsb25lTm9kZSh0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgbGFzdE5vZGUgPSBpdGVyLm1hcmtlcixcbiAgICAgICAgICAgICAgICAgICAgbWFwcywgcmVuZGVySWQsIGlfLCBub2RlLCBub2Rlc18gPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlci5rZXkpIG9yaWdfW2l0ZXIua2V5XSA9IGk7XG4gICAgICAgICAgICAgICAgb3JpZ19baXRlci5hbGlhc10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBtYXBzID0gdHJhdmVyc2UoY2xvbmUsIG9yaWdfKTtcbiAgICAgICAgICAgICAgICBmb3IgKGlfID0gY2xvbmUuY2hpbGROb2Rlcy5sZW5ndGg7IGlfLS07IGxhc3ROb2RlID0gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgbm9kZXNfLnB1c2gobm9kZSA9IGNsb25lLmNoaWxkTm9kZXNbaV9dKTtcbiAgICAgICAgICAgICAgICAgIGl0ZXIucGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBsYXN0Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlYWNoXyAmJiBlYWNoXyh2YWx1ZSwgaSwgb3JpZ18sIG5vZGVzXy5maWx0ZXIoZnVuY3Rpb24obikge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG4ubm9kZVR5cGUgPT09IGVsXy5FTEVNRU5UX05PREU7XG4gICAgICAgICAgICAgICAgfSkpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIGZvciAoaV8gPSBub2Rlc18ubGVuZ3RoOyBpXy0tOylcbiAgICAgICAgICAgICAgICAgICAgaXRlci5wYXJlbnQucmVtb3ZlQ2hpbGQobm9kZXNfW2lfXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIG5vZGVzID0gbm9kZXMuY29uY2F0KG5vZGVzXyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KShsaXN0W2ldLCBpKTtcbiAgICAgICAgICB9KShvcmlnKTtcbiAgICAgICAgICBidWNrZXQoYmluZHMsIGl0ZXIucHJvcC5zcGxpdCgnLicpWzBdLCByZW5kZXJJZCk7XG4gICAgICAgICAgZm9yIChwIGluIG1hcHMuYmluZHMpIGlmIChpdGVyLmFsaWFzLmluZGV4T2YocCkgPT09IC0xKVxuICAgICAgICAgICAgYnVja2V0KGJpbmRzLCBwLCByZW5kZXJJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQmluZCBub2RlIHRleHQuXG4gICAgICAgICAgbWFwVGV4dE5vZGVzKGVsXyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQmluZCBub2RlIGF0dHJpYnV0ZXMgaWYgbm90IGEgPGZvcj4uXG4gICAgICAgIGlmIChlbF8udGFnTmFtZSAhPT0gJ0ZPUicpIGZvciAoaSA9IGVsXy5hdHRyaWJ1dGVzLmxlbmd0aDsgaS0tOylcbiAgICAgICAgICBtYXBBdHRyaWJ1dGUoZWxfLCBlbF8uYXR0cmlidXRlc1tpXSk7XG4gICAgICAgIC8vIFN0b3AgcmVjdXJzaW9uIGlmIGl0ZXJhdG9yLlxuICAgICAgICByZXR1cm4gIWl0ZXI7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7b3JpZzpvcmlnLCBiaW5kczpiaW5kcywgcmViaW5kczpyZWJpbmRzLCByZW5kZXJzOnJlbmRlcnN9O1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlUHJveHkodHJhdmVyc2UoZWwsIG1vZGVsICYmIGV4dGVuZCh7fSwgbW9kZWwpKSwgbW9kZWwpO1xuICB9O1xufSgpKTtcbiIsInZpeGVuID0gcmVxdWlyZSAndml4ZW4nXG5TaG93ZG93biA9IHJlcXVpcmUgJ3Nob3dkb3duJ1xubWFya2Rvd24gPSBuZXcgU2hvd2Rvd24uY29udmVydGVyKClcblxucmVxdWlyZSAnLi91bmlmeS5jb2ZmZWUnXG5cbnN0YXRlXyA9IHJlcXVpcmUgJy4vc3RhdGUuY29mZmVlJ1xucmVxdWlyZSAnLi9zdGF0ZS1naXN0LmNvZmZlZSdcblxue251bWJlciwgaW5kZXgsIHRvY30gPSByZXF1aXJlICcuL3V0aWxzLmNvZmZlZSdcblxuZXh0ZW5kID0gKHI9e30sIGQpIC0+IHJba10gPSB2IGZvciBrLCB2IG9mIGQ7IHJcbmV4dGVuZEEgPSAocj17fSwgYSkgLT4gcltrXSA9IHYgZm9yIFtrLCB2XSBpbiBhOyByXG5cbnByb3h5ID0gKGRpY3QpIC0+XG4gIHZhdWx0XyA9IHt9XG4gIGRlZl8gPSAocHJvcCwgZm4pIC0+XG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIHNldDogKHZhbHVlKSAtPlxuICAgICAgb2xkID0gdmF1bHRfW3Byb3BdXG4gICAgICB2YXVsdF9bcHJvcF0gPSB2YWx1ZVxuICAgICAgZm4gdmFsdWUsIG9sZFxuICAgIGdldDogLT4gdmF1bHRfW3Byb3BdXG4gIE9iamVjdC5jcmVhdGUgT2JqZWN0LnByb3RvdHlwZSxcbiAgICBleHRlbmRBKHsgdG9KU09OOiB2YWx1ZTogLT4gdmF1bHRfIH0sIChbcHJvcCwgZGVmXyhwcm9wLCBmbildIGZvciBwcm9wLCBmbiBvZiBkaWN0KSlcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICB1cGRhdGVUb2MgPSAtPiB0b2NFbC5pbm5lckhUTUwgPSB0b2Mgdmlld0VsXG4gIHVwZGF0ZUluZGV4ID0gLT4gaW5kZXggbnVtYmVyIHZpZXdFbFxuICBzZXRNb2RlID0gKG1vZGUpIC0+XG4gICAgbW9kZWwubW9kZSA9IHtcbiAgICAgIHdyaXRlOiAnZnVsbC1pbnB1dCdcbiAgICAgIHJlYWQ6ICdmdWxsLXZpZXcnXG4gICAgfVttb2RlXSBvciAnJ1xuICBzZXRUb2MgPSAodG8pIC0+XG4gICAgdXBkYXRlVG9jKCkgaWYgdG9cbiAgICBtb2RlbC5zaG93VG9jID0gaWYgdG8gdGhlbiAndG9jJyBlbHNlICcnXG4gIHNldEluZGV4ID0gKHRvKSAtPlxuICAgIGlmIHRvXG4gICAgICBpZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjdmlldyBbZGF0YS1udW1iZXJdJykubGVuZ3RoIGlzIDBcbiAgICAgICAgdXBkYXRlSW5kZXgoKVxuICAgICAgICB1cGRhdGVUb2MoKSBpZiBzdGF0ZS50b2NcbiAgICAgIG1vZGVsLnNob3dJbmRleCA9ICdpbmRleGVkJ1xuICAgIGVsc2VcbiAgICAgIG1vZGVsLnNob3dJbmRleCA9ICcnXG5cbiAgc3RhdGUgPSBwcm94eVxuICAgIHRvYzogc2V0VG9jXG4gICAgaW5kZXg6IHNldEluZGV4XG4gICAgbW9kZTogc2V0TW9kZVxuICAjc3RhdGUub24gJ2NoYW5nZScsIC0+IHVwZGF0ZVN0YXR1cyB5ZXNcblxuICB0b2NFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd0b2MnXG4gIHZpZXdFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd2aWV3J1xuICB2aWV3V3JhcEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3ZpZXctd3JhcCdcblxuICBkb2NUaXRsZSA9IC0+XG4gICAgdG1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICAgIHRtcC5pbm5lckhUTUwgPSBpZiAoaCA9IHZpZXdFbC5xdWVyeVNlbGVjdG9yQWxsKCdoMSxoMixoMycpWzBdKVxuICAgICAgaC5pbm5lckhUTUxcbiAgICBlbHNlXG4gICAgICAnVW50aXRsZWQnXG4gICAgW10uZm9yRWFjaC5jYWxsIHRtcC5xdWVyeVNlbGVjdG9yQWxsKCcuaW5kZXgnKSwgKGVsKSAtPiB0bXAucmVtb3ZlQ2hpbGQgZWxcbiAgICB0bXAudGV4dENvbnRlbnRcblxuICBzYXZlZCA9IHllc1xuXG4gIHVwZGF0ZVN0YXR1cyA9IChmb3JjZSkgLT5cbiAgICBpZiBub3Qgc2F2ZWQgb3IgZm9yY2VcbiAgICAgIHN0YXRlXy5zdG9yZSBudWxsLCB0ZXh0OmVkaXRvci5nZXRWYWx1ZSgpLCBzdGF0ZTpzdGF0ZVxuICAgICAgI3N0YXRlLmdlbmVyYXRlSGFzaCAnYmFzZTY0JywgZWRpdG9yLmdldFZhbHVlKCksIChoYXNoKSAtPlxuICAgICAgIyAgbG9jYXRpb24uaGFzaCA9IGhhc2hcbiAgICAgIGRvY3VtZW50LnRpdGxlID0gZG9jVGl0bGUoKVxuICAgICAgc2F2ZWQgPSB5ZXNcblxuICBjdXJzb3JUb2tlbiA9ICdeXl5jdXJzb3JeXl4nXG4gIHVwZGF0ZVZpZXcgPSAtPlxuICAgIGNsaW5lID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmVcbiAgICBtZCA9IGVkaXRvci5nZXRWYWx1ZSgpLnNwbGl0ICdcXG4nXG4gICAgbWRbY2xpbmVdICs9IGN1cnNvclRva2VuXG4gICAgbWQgPSBtZC5qb2luICdcXG4nXG4gICAgdiA9IHZpZXdFbFxuICAgIHYuaW5uZXJIVE1MID0gbWFya2Rvd24ubWFrZUh0bWwobWQpLnJlcGxhY2UoY3Vyc29yVG9rZW4sICc8c3BhbiBpZD1cImN1cnNvclwiPjwvc3Bhbj4nKVxuICAgIHVwZGF0ZUluZGV4KCkgaWYgc3RhdGUuaW5kZXhcbiAgICB1cGRhdGVUb2MoKSBpZiBzdGF0ZS50b2NcbiAgICBzY3JvbGxUb3AgPSB2aWV3V3JhcEVsLnNjcm9sbFRvcFxuICAgIHZpZXdIZWlnaHQgPSB2aWV3V3JhcEVsLm9mZnNldEhlaWdodFxuICAgIGN1cnNvclNwYW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnY3Vyc29yJ1xuICAgIGN1cnNvclRvcCA9IGN1cnNvclNwYW4ub2Zmc2V0VG9wXG4gICAgY3Vyc29ySGVpZ2h0ID0gY3Vyc29yU3Bhbi5vZmZzZXRIZWlnaHRcbiAgICBpZiBjdXJzb3JUb3AgPCBzY3JvbGxUb3Agb3IgY3Vyc29yVG9wID4gc2Nyb2xsVG9wICsgdmlld0hlaWdodCAtIGN1cnNvckhlaWdodFxuICAgICAgdmlld1dyYXBFbC5zY3JvbGxUb3AgPSBjdXJzb3JUb3AgLSB2aWV3SGVpZ2h0LzJcblxuICBzYXZlVGltZXIgPSBudWxsXG4gIGVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1tZCcpLFxuICAgIG1vZGU6ICdnZm0nXG4gICAgdGhlbWU6ICdkZWZhdWx0J1xuICAgIGxpbmVOdW1iZXJzOiBub1xuICAgIGxpbmVXcmFwcGluZzogeWVzXG4gICAgb25DaGFuZ2U6IC0+XG4gICAgICB1cGRhdGVWaWV3KClcbiAgICAgIHNhdmVkID0gbm9cbiAgICAgIGNsZWFyVGltZW91dCBzYXZlVGltZXJcbiAgICAgIHNhdmVUaW1lciA9IHNldFRpbWVvdXQgdXBkYXRlU3RhdHVzLCA1MDAwXG4gICAgb25EcmFnRXZlbnQ6IChlZGl0b3IsIGV2ZW50KSAtPlxuICAgICAgc2hvd0RuZCA9IG5vIGlmIHNob3dEbmQgb3IgZXZlbnQudHlwZSBpcyAnZHJvcCdcbiAgICAgIGZhbHNlXG5cbiAgc2V0U3RhdGUgPSAoZGF0YSkgLT5cbiAgICB7IHRleHQsIHN0YXRlOnN0YXRlX18gfSA9IGRhdGFcbiAgICBleHRlbmQgc3RhdGUsIHN0YXRlX18gb3Ige31cbiAgICBlZGl0b3Iuc2V0VmFsdWUgdGV4dCBpZiB0ZXh0PyBhbmQgdGV4dCBpc250IGVkaXRvci5nZXRWYWx1ZSgpXG4gICAgI3NldE1vZGUgc3RhdGUubW9kZVxuICAgICNzZXRJbmRleCBzdGF0ZS5pbmRleFxuICAgICNzZXRUb2Mgc3RhdGUudG9jXG4gICAgbW9kZWwudGhlbWUgPSBzdGF0ZS50aGVtZSBvciAnc2VyaWYnXG5cbiAgI3dpbmRvdy5hZGRFdmVudExpc3RlbmVyICdoYXNoY2hhbmdlJywgc2V0U3RhdGVcblxuICBtb2RlbCA9XG4gICAgc2hvdzogKHYpIC0+IGlmIHYgdGhlbiAnJyBlbHNlICdoaWRlJ1xuICAgIGhpZGU6ICh2KSAtPiBpZiB2IHRoZW4gJ2hpZGUnIGVsc2UgJydcbiAgICBzaG93RG93bmxvYWQ6IEJsb2I/XG4gICAgZG93bmxvYWQ6IC0+XG4gICAgICBzYXZlQXMgbmV3IEJsb2IoW2VkaXRvci5nZXRWYWx1ZSgpXSwgdHlwZTogJ3RleHQvcGxhaW47Y2hhcnNldD11dGYtOCcpLFxuICAgICAgICBkb2NUaXRsZSgpKycubWQnXG4gICAgbGlua0I2NDogLT5cbiAgICAgIHVwZGF0ZVN0YXR1cygpXG4gICAgICBwcm9tcHQgJ0NvcHkgdGhpcycsIGxvY2F0aW9uLmhyZWZcbiAgICAgICNtb2RlbC5saW5rQ29weSA9IGxvY2F0aW9uLmhyZWZcbiAgICAgICNtb2RlbC5zaG93TGlua0NvcHkgPSB0cnVlXG4gICAgICAjLmZvY3VzKClcbiAgICAgICMuYmx1ciAtPiAkKEApLmFkZENsYXNzKCdoaWRkZW4nKVxuICAgIHByaW50OiAtPiB3aW5kb3cucHJpbnQoKVxuICAgIG1vZGU6ICcnXG4gICAgdG9nZ2xlVG9jOiAtPiBzdGF0ZS50b2MgPSBub3Qgc3RhdGUudG9jXG4gICAgdG9nZ2xlSW5kZXg6IC0+IHN0YXRlLmluZGV4ID0gbm90IHN0YXRlLmluZGV4XG4gICAgZXhwYW5kSW5wdXQ6IC0+XG4gICAgICBzdGF0ZS5tb2RlID0gKGlmIHN0YXRlLm1vZGUgdGhlbiAnJyBlbHNlICd3cml0ZScpXG4gICAgZXhwYW5kVmlldzogLT5cbiAgICAgIHN0YXRlLm1vZGUgPSAoaWYgc3RhdGUubW9kZSB0aGVuICcnIGVsc2UgJ3JlYWQnKVxuICAgIG1vdXNlb3V0OiAoZSkgLT5cbiAgICAgIGZyb20gPSBlLnJlbGF0ZWRUYXJnZXQgb3IgZS50b0VsZW1lbnRcbiAgICAgIHVwZGF0ZVN0YXR1cygpIGlmIG5vdCBmcm9tIG9yIGZyb20ubm9kZU5hbWUgaXMgJ0hUTUwnXG4gICAga2V5cHJlc3M6IChlKSAtPlxuICAgICAgaWYgZS5jdHJsS2V5IGFuZCBlLmFsdEtleVxuICAgICAgICBpZiBlLmtleUNvZGUgaXMgMjQgIyBjdHJsK2FsdCt4XG4gICAgICAgICAgc3RhdGUubW9kZSA9ICd3cml0ZSdcbiAgICAgICAgZWxzZSBpZiBlLmtleUNvZGUgaXMgMyAjIGN0cmwrYWx0K2NcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gJydcbiAgICAgICAgZWxzZSBpZiBlLmtleUNvZGUgaXMgMjIgIyBjdHJsK2FsdCt2XG4gICAgICAgICAgc3RhdGUubW9kZSA9ICdyZWFkJ1xuXG4gIHN0YXRlXy5yZXN0b3JlIG51bGwsIG51bGwsIHNldFN0YXRlXG4gIHN0YXRlXy5vbiAncmVzdG9yZScsIHNldFN0YXRlXG5cbiAgc2hvd0RuZCA9IG5vIGlmIG5vdCBlZGl0b3IuZ2V0VmFsdWUoKVxuICAjJCgnI2lucHV0LXdyYXAnKS5vbmUgJ2NsaWNrJywgLT4gJCgnI2RyYWctbi1kcm9wLXdyYXAnKS5yZW1vdmUoKVxuXG4gIHZpeGVuKGRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSwgbW9kZWwpXG5cbiAgdXBkYXRlVmlldygpXG4gICN1cGRhdGVTdGF0dXMoKVxuIiwiKGZ1bmN0aW9uKCl7Ly9cbi8vIHNob3dkb3duLmpzIC0tIEEgamF2YXNjcmlwdCBwb3J0IG9mIE1hcmtkb3duLlxuLy9cbi8vIENvcHlyaWdodCAoYykgMjAwNyBKb2huIEZyYXNlci5cbi8vXG4vLyBPcmlnaW5hbCBNYXJrZG93biBDb3B5cmlnaHQgKGMpIDIwMDQtMjAwNSBKb2huIEdydWJlclxuLy8gICA8aHR0cDovL2RhcmluZ2ZpcmViYWxsLm5ldC9wcm9qZWN0cy9tYXJrZG93bi8+XG4vL1xuLy8gUmVkaXN0cmlidXRhYmxlIHVuZGVyIGEgQlNELXN0eWxlIG9wZW4gc291cmNlIGxpY2Vuc2UuXG4vLyBTZWUgbGljZW5zZS50eHQgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4vL1xuLy8gVGhlIGZ1bGwgc291cmNlIGRpc3RyaWJ1dGlvbiBpcyBhdDpcbi8vXG4vL1x0XHRcdFx0QSBBIExcbi8vXHRcdFx0XHRUIEMgQVxuLy9cdFx0XHRcdFQgSyBCXG4vL1xuLy8gICA8aHR0cDovL3d3dy5hdHRhY2tsYWIubmV0Lz5cbi8vXG5cbi8vXG4vLyBXaGVyZXZlciBwb3NzaWJsZSwgU2hvd2Rvd24gaXMgYSBzdHJhaWdodCwgbGluZS1ieS1saW5lIHBvcnRcbi8vIG9mIHRoZSBQZXJsIHZlcnNpb24gb2YgTWFya2Rvd24uXG4vL1xuLy8gVGhpcyBpcyBub3QgYSBub3JtYWwgcGFyc2VyIGRlc2lnbjsgaXQncyBiYXNpY2FsbHkganVzdCBhXG4vLyBzZXJpZXMgb2Ygc3RyaW5nIHN1YnN0aXR1dGlvbnMuICBJdCdzIGhhcmQgdG8gcmVhZCBhbmRcbi8vIG1haW50YWluIHRoaXMgd2F5LCAgYnV0IGtlZXBpbmcgU2hvd2Rvd24gY2xvc2UgdG8gdGhlIG9yaWdpbmFsXG4vLyBkZXNpZ24gbWFrZXMgaXQgZWFzaWVyIHRvIHBvcnQgbmV3IGZlYXR1cmVzLlxuLy9cbi8vIE1vcmUgaW1wb3J0YW50bHksIFNob3dkb3duIGJlaGF2ZXMgbGlrZSBtYXJrZG93bi5wbCBpbiBtb3N0XG4vLyBlZGdlIGNhc2VzLiAgU28gd2ViIGFwcGxpY2F0aW9ucyBjYW4gZG8gY2xpZW50LXNpZGUgcHJldmlld1xuLy8gaW4gSmF2YXNjcmlwdCwgYW5kIHRoZW4gYnVpbGQgaWRlbnRpY2FsIEhUTUwgb24gdGhlIHNlcnZlci5cbi8vXG4vLyBUaGlzIHBvcnQgbmVlZHMgdGhlIG5ldyBSZWdFeHAgZnVuY3Rpb25hbGl0eSBvZiBFQ01BIDI2Mixcbi8vIDNyZCBFZGl0aW9uIChpLmUuIEphdmFzY3JpcHQgMS41KS4gIE1vc3QgbW9kZXJuIHdlYiBicm93c2Vyc1xuLy8gc2hvdWxkIGRvIGZpbmUuICBFdmVuIHdpdGggdGhlIG5ldyByZWd1bGFyIGV4cHJlc3Npb24gZmVhdHVyZXMsXG4vLyBXZSBkbyBhIGxvdCBvZiB3b3JrIHRvIGVtdWxhdGUgUGVybCdzIHJlZ2V4IGZ1bmN0aW9uYWxpdHkuXG4vLyBUaGUgdHJpY2t5IGNoYW5nZXMgaW4gdGhpcyBmaWxlIG1vc3RseSBoYXZlIHRoZSBcImF0dGFja2xhYjpcIlxuLy8gbGFiZWwuICBNYWpvciBvciBzZWxmLWV4cGxhbmF0b3J5IGNoYW5nZXMgZG9uJ3QuXG4vL1xuLy8gU21hcnQgZGlmZiB0b29scyBsaWtlIEFyYXhpcyBNZXJnZSB3aWxsIGJlIGFibGUgdG8gbWF0Y2ggdXBcbi8vIHRoaXMgZmlsZSB3aXRoIG1hcmtkb3duLnBsIGluIGEgdXNlZnVsIHdheS4gIEEgbGl0dGxlIHR3ZWFraW5nXG4vLyBoZWxwczogaW4gYSBjb3B5IG9mIG1hcmtkb3duLnBsLCByZXBsYWNlIFwiI1wiIHdpdGggXCIvL1wiIGFuZFxuLy8gcmVwbGFjZSBcIiR0ZXh0XCIgd2l0aCBcInRleHRcIi4gIEJlIHN1cmUgdG8gaWdub3JlIHdoaXRlc3BhY2Vcbi8vIGFuZCBsaW5lIGVuZGluZ3MuXG4vL1xuXG5cbi8vXG4vLyBTaG93ZG93biB1c2FnZTpcbi8vXG4vLyAgIHZhciB0ZXh0ID0gXCJNYXJrZG93biAqcm9ja3MqLlwiO1xuLy9cbi8vICAgdmFyIGNvbnZlcnRlciA9IG5ldyBTaG93ZG93bi5jb252ZXJ0ZXIoKTtcbi8vICAgdmFyIGh0bWwgPSBjb252ZXJ0ZXIubWFrZUh0bWwodGV4dCk7XG4vL1xuLy8gICBhbGVydChodG1sKTtcbi8vXG4vLyBOb3RlOiBtb3ZlIHRoZSBzYW1wbGUgY29kZSB0byB0aGUgYm90dG9tIG9mIHRoaXNcbi8vIGZpbGUgYmVmb3JlIHVuY29tbWVudGluZyBpdC5cbi8vXG5cblxuLy9cbi8vIFNob3dkb3duIG5hbWVzcGFjZVxuLy9cbnZhciBTaG93ZG93biA9IHt9O1xuXG4vL1xuLy8gY29udmVydGVyXG4vL1xuLy8gV3JhcHMgYWxsIFwiZ2xvYmFsc1wiIHNvIHRoYXQgdGhlIG9ubHkgdGhpbmdcbi8vIGV4cG9zZWQgaXMgbWFrZUh0bWwoKS5cbi8vXG5TaG93ZG93bi5jb252ZXJ0ZXIgPSBmdW5jdGlvbigpIHtcblxuLy9cbi8vIEdsb2JhbHM6XG4vL1xuXG4vLyBHbG9iYWwgaGFzaGVzLCB1c2VkIGJ5IHZhcmlvdXMgdXRpbGl0eSByb3V0aW5lc1xudmFyIGdfdXJscztcbnZhciBnX3RpdGxlcztcbnZhciBnX2h0bWxfYmxvY2tzO1xuXG4vLyBVc2VkIHRvIHRyYWNrIHdoZW4gd2UncmUgaW5zaWRlIGFuIG9yZGVyZWQgb3IgdW5vcmRlcmVkIGxpc3Rcbi8vIChzZWUgX1Byb2Nlc3NMaXN0SXRlbXMoKSBmb3IgZGV0YWlscyk6XG52YXIgZ19saXN0X2xldmVsID0gMDtcblxuXG50aGlzLm1ha2VIdG1sID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIE1haW4gZnVuY3Rpb24uIFRoZSBvcmRlciBpbiB3aGljaCBvdGhlciBzdWJzIGFyZSBjYWxsZWQgaGVyZSBpc1xuLy8gZXNzZW50aWFsLiBMaW5rIGFuZCBpbWFnZSBzdWJzdGl0dXRpb25zIG5lZWQgdG8gaGFwcGVuIGJlZm9yZVxuLy8gX0VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXMoKSwgc28gdGhhdCBhbnkgKidzIG9yIF8ncyBpbiB0aGUgPGE+XG4vLyBhbmQgPGltZz4gdGFncyBnZXQgZW5jb2RlZC5cbi8vXG5cblx0Ly8gQ2xlYXIgdGhlIGdsb2JhbCBoYXNoZXMuIElmIHdlIGRvbid0IGNsZWFyIHRoZXNlLCB5b3UgZ2V0IGNvbmZsaWN0c1xuXHQvLyBmcm9tIG90aGVyIGFydGljbGVzIHdoZW4gZ2VuZXJhdGluZyBhIHBhZ2Ugd2hpY2ggY29udGFpbnMgbW9yZSB0aGFuXG5cdC8vIG9uZSBhcnRpY2xlIChlLmcuIGFuIGluZGV4IHBhZ2UgdGhhdCBzaG93cyB0aGUgTiBtb3N0IHJlY2VudFxuXHQvLyBhcnRpY2xlcyk6XG5cdGdfdXJscyA9IG5ldyBBcnJheSgpO1xuXHRnX3RpdGxlcyA9IG5ldyBBcnJheSgpO1xuXHRnX2h0bWxfYmxvY2tzID0gbmV3IEFycmF5KCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXBsYWNlIH4gd2l0aCB+VFxuXHQvLyBUaGlzIGxldHMgdXMgdXNlIHRpbGRlIGFzIGFuIGVzY2FwZSBjaGFyIHRvIGF2b2lkIG1kNSBoYXNoZXNcblx0Ly8gVGhlIGNob2ljZSBvZiBjaGFyYWN0ZXIgaXMgYXJiaXRyYXk7IGFueXRoaW5nIHRoYXQgaXNuJ3RcbiAgICAvLyBtYWdpYyBpbiBNYXJrZG93biB3aWxsIHdvcmsuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL34vZyxcIn5UXCIpO1xuXG5cdC8vIGF0dGFja2xhYjogUmVwbGFjZSAkIHdpdGggfkRcblx0Ly8gUmVnRXhwIGludGVycHJldHMgJCBhcyBhIHNwZWNpYWwgY2hhcmFjdGVyXG5cdC8vIHdoZW4gaXQncyBpbiBhIHJlcGxhY2VtZW50IHN0cmluZ1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXCQvZyxcIn5EXCIpO1xuXG5cdC8vIFN0YW5kYXJkaXplIGxpbmUgZW5kaW5nc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHJcXG4vZyxcIlxcblwiKTsgLy8gRE9TIHRvIFVuaXhcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxyL2csXCJcXG5cIik7IC8vIE1hYyB0byBVbml4XG5cblx0Ly8gTWFrZSBzdXJlIHRleHQgYmVnaW5zIGFuZCBlbmRzIHdpdGggYSBjb3VwbGUgb2YgbmV3bGluZXM6XG5cdHRleHQgPSBcIlxcblxcblwiICsgdGV4dCArIFwiXFxuXFxuXCI7XG5cblx0Ly8gQ29udmVydCBhbGwgdGFicyB0byBzcGFjZXMuXG5cdHRleHQgPSBfRGV0YWIodGV4dCk7XG5cblx0Ly8gU3RyaXAgYW55IGxpbmVzIGNvbnNpc3Rpbmcgb25seSBvZiBzcGFjZXMgYW5kIHRhYnMuXG5cdC8vIFRoaXMgbWFrZXMgc3Vic2VxdWVudCByZWdleGVuIGVhc2llciB0byB3cml0ZSwgYmVjYXVzZSB3ZSBjYW5cblx0Ly8gbWF0Y2ggY29uc2VjdXRpdmUgYmxhbmsgbGluZXMgd2l0aCAvXFxuKy8gaW5zdGVhZCBvZiBzb21ldGhpbmdcblx0Ly8gY29udG9ydGVkIGxpa2UgL1sgXFx0XSpcXG4rLyAuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIFxcdF0rJC9tZyxcIlwiKTtcblxuXHQvLyBIYW5kbGUgZ2l0aHViIGNvZGVibG9ja3MgcHJpb3IgdG8gcnVubmluZyBIYXNoSFRNTCBzbyB0aGF0XG5cdC8vIEhUTUwgY29udGFpbmVkIHdpdGhpbiB0aGUgY29kZWJsb2NrIGdldHMgZXNjYXBlZCBwcm9wZXJ0bHlcblx0dGV4dCA9IF9Eb0dpdGh1YkNvZGVCbG9ja3ModGV4dCk7XG5cblx0Ly8gVHVybiBibG9jay1sZXZlbCBIVE1MIGJsb2NrcyBpbnRvIGhhc2ggZW50cmllc1xuXHR0ZXh0ID0gX0hhc2hIVE1MQmxvY2tzKHRleHQpO1xuXG5cdC8vIFN0cmlwIGxpbmsgZGVmaW5pdGlvbnMsIHN0b3JlIGluIGhhc2hlcy5cblx0dGV4dCA9IF9TdHJpcExpbmtEZWZpbml0aW9ucyh0ZXh0KTtcblxuXHR0ZXh0ID0gX1J1bkJsb2NrR2FtdXQodGV4dCk7XG5cblx0dGV4dCA9IF9VbmVzY2FwZVNwZWNpYWxDaGFycyh0ZXh0KTtcblxuXHQvLyBhdHRhY2tsYWI6IFJlc3RvcmUgZG9sbGFyIHNpZ25zXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL35EL2csXCIkJFwiKTtcblxuXHQvLyBhdHRhY2tsYWI6IFJlc3RvcmUgdGlsZGVzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL35UL2csXCJ+XCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufTtcblxuXG52YXIgX1N0cmlwTGlua0RlZmluaXRpb25zID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFN0cmlwcyBsaW5rIGRlZmluaXRpb25zIGZyb20gdGV4dCwgc3RvcmVzIHRoZSBVUkxzIGFuZCB0aXRsZXMgaW5cbi8vIGhhc2ggcmVmZXJlbmNlcy5cbi8vXG5cblx0Ly8gTGluayBkZWZzIGFyZSBpbiB0aGUgZm9ybTogXltpZF06IHVybCBcIm9wdGlvbmFsIHRpdGxlXCJcblxuXHQvKlxuXHRcdHZhciB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHRcdFx0XlsgXXswLDN9XFxbKC4rKVxcXTogIC8vIGlkID0gJDEgIGF0dGFja2xhYjogZ190YWJfd2lkdGggLSAxXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQgIFxcbj9cdFx0XHRcdC8vIG1heWJlICpvbmUqIG5ld2xpbmVcblx0XHRcdFx0ICBbIFxcdF0qXG5cdFx0XHRcdDw/KFxcUys/KT4/XHRcdFx0Ly8gdXJsID0gJDJcblx0XHRcdFx0ICBbIFxcdF0qXG5cdFx0XHRcdCAgXFxuP1x0XHRcdFx0Ly8gbWF5YmUgb25lIG5ld2xpbmVcblx0XHRcdFx0ICBbIFxcdF0qXG5cdFx0XHRcdCg/OlxuXHRcdFx0XHQgIChcXG4qKVx0XHRcdFx0Ly8gYW55IGxpbmVzIHNraXBwZWQgPSAkMyBhdHRhY2tsYWI6IGxvb2tiZWhpbmQgcmVtb3ZlZFxuXHRcdFx0XHQgIFtcIihdXG5cdFx0XHRcdCAgKC4rPylcdFx0XHRcdC8vIHRpdGxlID0gJDRcblx0XHRcdFx0ICBbXCIpXVxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0KT9cdFx0XHRcdFx0Ly8gdGl0bGUgaXMgb3B0aW9uYWxcblx0XHRcdFx0KD86XFxuK3wkKVxuXHRcdFx0ICAvZ20sXG5cdFx0XHQgIGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cdHZhciB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBdezAsM31cXFsoLispXFxdOlsgXFx0XSpcXG4/WyBcXHRdKjw/KFxcUys/KT4/WyBcXHRdKlxcbj9bIFxcdF0qKD86KFxcbiopW1wiKF0oLis/KVtcIildWyBcXHRdKik/KD86XFxuK3xcXFopL2dtLFxuXHRcdGZ1bmN0aW9uICh3aG9sZU1hdGNoLG0xLG0yLG0zLG00KSB7XG5cdFx0XHRtMSA9IG0xLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRnX3VybHNbbTFdID0gX0VuY29kZUFtcHNBbmRBbmdsZXMobTIpOyAgLy8gTGluayBJRHMgYXJlIGNhc2UtaW5zZW5zaXRpdmVcblx0XHRcdGlmIChtMykge1xuXHRcdFx0XHQvLyBPb3BzLCBmb3VuZCBibGFuayBsaW5lcywgc28gaXQncyBub3QgYSB0aXRsZS5cblx0XHRcdFx0Ly8gUHV0IGJhY2sgdGhlIHBhcmVudGhldGljYWwgc3RhdGVtZW50IHdlIHN0b2xlLlxuXHRcdFx0XHRyZXR1cm4gbTMrbTQ7XG5cdFx0XHR9IGVsc2UgaWYgKG00KSB7XG5cdFx0XHRcdGdfdGl0bGVzW20xXSA9IG00LnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIik7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENvbXBsZXRlbHkgcmVtb3ZlIHRoZSBkZWZpbml0aW9uIGZyb20gdGhlIHRleHRcblx0XHRcdHJldHVybiBcIlwiO1xuXHRcdH1cblx0KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0hhc2hIVE1MQmxvY2tzID0gZnVuY3Rpb24odGV4dCkge1xuXHQvLyBhdHRhY2tsYWI6IERvdWJsZSB1cCBibGFuayBsaW5lcyB0byByZWR1Y2UgbG9va2Fyb3VuZFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG4vZyxcIlxcblxcblwiKTtcblxuXHQvLyBIYXNoaWZ5IEhUTUwgYmxvY2tzOlxuXHQvLyBXZSBvbmx5IHdhbnQgdG8gZG8gdGhpcyBmb3IgYmxvY2stbGV2ZWwgSFRNTCB0YWdzLCBzdWNoIGFzIGhlYWRlcnMsXG5cdC8vIGxpc3RzLCBhbmQgdGFibGVzLiBUaGF0J3MgYmVjYXVzZSB3ZSBzdGlsbCB3YW50IHRvIHdyYXAgPHA+cyBhcm91bmRcblx0Ly8gXCJwYXJhZ3JhcGhzXCIgdGhhdCBhcmUgd3JhcHBlZCBpbiBub24tYmxvY2stbGV2ZWwgdGFncywgc3VjaCBhcyBhbmNob3JzLFxuXHQvLyBwaHJhc2UgZW1waGFzaXMsIGFuZCBzcGFucy4gVGhlIGxpc3Qgb2YgdGFncyB3ZSdyZSBsb29raW5nIGZvciBpc1xuXHQvLyBoYXJkLWNvZGVkOlxuXHR2YXIgYmxvY2tfdGFnc19hID0gXCJwfGRpdnxoWzEtNl18YmxvY2txdW90ZXxwcmV8dGFibGV8ZGx8b2x8dWx8c2NyaXB0fG5vc2NyaXB0fGZvcm18ZmllbGRzZXR8aWZyYW1lfG1hdGh8aW5zfGRlbHxzdHlsZXxzZWN0aW9ufGhlYWRlcnxmb290ZXJ8bmF2fGFydGljbGV8YXNpZGVcIjtcblx0dmFyIGJsb2NrX3RhZ3NfYiA9IFwicHxkaXZ8aFsxLTZdfGJsb2NrcXVvdGV8cHJlfHRhYmxlfGRsfG9sfHVsfHNjcmlwdHxub3NjcmlwdHxmb3JtfGZpZWxkc2V0fGlmcmFtZXxtYXRofHN0eWxlfHNlY3Rpb258aGVhZGVyfGZvb3RlcnxuYXZ8YXJ0aWNsZXxhc2lkZVwiO1xuXG5cdC8vIEZpcnN0LCBsb29rIGZvciBuZXN0ZWQgYmxvY2tzLCBlLmcuOlxuXHQvLyAgIDxkaXY+XG5cdC8vICAgICA8ZGl2PlxuXHQvLyAgICAgdGFncyBmb3IgaW5uZXIgYmxvY2sgbXVzdCBiZSBpbmRlbnRlZC5cblx0Ly8gICAgIDwvZGl2PlxuXHQvLyAgIDwvZGl2PlxuXHQvL1xuXHQvLyBUaGUgb3V0ZXJtb3N0IHRhZ3MgbXVzdCBzdGFydCBhdCB0aGUgbGVmdCBtYXJnaW4gZm9yIHRoaXMgdG8gbWF0Y2gsIGFuZFxuXHQvLyB0aGUgaW5uZXIgbmVzdGVkIGRpdnMgbXVzdCBiZSBpbmRlbnRlZC5cblx0Ly8gV2UgbmVlZCB0byBkbyB0aGlzIGJlZm9yZSB0aGUgbmV4dCwgbW9yZSBsaWJlcmFsIG1hdGNoLCBiZWNhdXNlIHRoZSBuZXh0XG5cdC8vIG1hdGNoIHdpbGwgc3RhcnQgYXQgdGhlIGZpcnN0IGA8ZGl2PmAgYW5kIHN0b3AgYXQgdGhlIGZpcnN0IGA8L2Rpdj5gLlxuXG5cdC8vIGF0dGFja2xhYjogVGhpcyByZWdleCBjYW4gYmUgZXhwZW5zaXZlIHdoZW4gaXQgZmFpbHMuXG5cdC8qXG5cdFx0dmFyIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyBzYXZlIGluICQxXG5cdFx0XHReXHRcdFx0XHRcdC8vIHN0YXJ0IG9mIGxpbmUgICh3aXRoIC9tKVxuXHRcdFx0PCgkYmxvY2tfdGFnc19hKVx0Ly8gc3RhcnQgdGFnID0gJDJcblx0XHRcdFxcYlx0XHRcdFx0XHQvLyB3b3JkIGJyZWFrXG5cdFx0XHRcdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBraHRtbC9wY3JlIGJ1Zy4uLlxuXHRcdFx0W15cXHJdKj9cXG5cdFx0XHQvLyBhbnkgbnVtYmVyIG9mIGxpbmVzLCBtaW5pbWFsbHkgbWF0Y2hpbmdcblx0XHRcdDwvXFwyPlx0XHRcdFx0Ly8gdGhlIG1hdGNoaW5nIGVuZCB0YWdcblx0XHRcdFsgXFx0XSpcdFx0XHRcdC8vIHRyYWlsaW5nIHNwYWNlcy90YWJzXG5cdFx0XHQoPz1cXG4rKVx0XHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBuZXdsaW5lXG5cdFx0KVx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogdGhlcmUgYXJlIHNlbnRpbmVsIG5ld2xpbmVzIGF0IGVuZCBvZiBkb2N1bWVudFxuXHRcdC9nbSxmdW5jdGlvbigpey4uLn19O1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKDwocHxkaXZ8aFsxLTZdfGJsb2NrcXVvdGV8cHJlfHRhYmxlfGRsfG9sfHVsfHNjcmlwdHxub3NjcmlwdHxmb3JtfGZpZWxkc2V0fGlmcmFtZXxtYXRofGluc3xkZWwpXFxiW15cXHJdKj9cXG48XFwvXFwyPlsgXFx0XSooPz1cXG4rKSkvZ20saGFzaEVsZW1lbnQpO1xuXG5cdC8vXG5cdC8vIE5vdyBtYXRjaCBtb3JlIGxpYmVyYWxseSwgc2ltcGx5IGZyb20gYFxcbjx0YWc+YCB0byBgPC90YWc+XFxuYFxuXHQvL1xuXG5cdC8qXG5cdFx0dmFyIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyBzYXZlIGluICQxXG5cdFx0XHReXHRcdFx0XHRcdC8vIHN0YXJ0IG9mIGxpbmUgICh3aXRoIC9tKVxuXHRcdFx0PCgkYmxvY2tfdGFnc19iKVx0Ly8gc3RhcnQgdGFnID0gJDJcblx0XHRcdFxcYlx0XHRcdFx0XHQvLyB3b3JkIGJyZWFrXG5cdFx0XHRcdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBraHRtbC9wY3JlIGJ1Zy4uLlxuXHRcdFx0W15cXHJdKj9cdFx0XHRcdC8vIGFueSBudW1iZXIgb2YgbGluZXMsIG1pbmltYWxseSBtYXRjaGluZ1xuXHRcdFx0Lio8L1xcMj5cdFx0XHRcdC8vIHRoZSBtYXRjaGluZyBlbmQgdGFnXG5cdFx0XHRbIFxcdF0qXHRcdFx0XHQvLyB0cmFpbGluZyBzcGFjZXMvdGFic1xuXHRcdFx0KD89XFxuKylcdFx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgbmV3bGluZVxuXHRcdClcdFx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IHRoZXJlIGFyZSBzZW50aW5lbCBuZXdsaW5lcyBhdCBlbmQgb2YgZG9jdW1lbnRcblx0XHQvZ20sZnVuY3Rpb24oKXsuLi59fTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXig8KHB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxzdHlsZXxzZWN0aW9ufGhlYWRlcnxmb290ZXJ8bmF2fGFydGljbGV8YXNpZGUpXFxiW15cXHJdKj8uKjxcXC9cXDI+WyBcXHRdKig/PVxcbispXFxuKS9nbSxoYXNoRWxlbWVudCk7XG5cblx0Ly8gU3BlY2lhbCBjYXNlIGp1c3QgZm9yIDxociAvPi4gSXQgd2FzIGVhc2llciB0byBtYWtlIGEgc3BlY2lhbCBjYXNlIHRoYW5cblx0Ly8gdG8gbWFrZSB0aGUgb3RoZXIgcmVnZXggbW9yZSBjb21wbGljYXRlZC5cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyBzYXZlIGluICQxXG5cdFx0XHRcXG5cXG5cdFx0XHRcdC8vIFN0YXJ0aW5nIGFmdGVyIGEgYmxhbmsgbGluZVxuXHRcdFx0WyBdezAsM31cblx0XHRcdCg8KGhyKVx0XHRcdFx0Ly8gc3RhcnQgdGFnID0gJDJcblx0XHRcdFxcYlx0XHRcdFx0XHQvLyB3b3JkIGJyZWFrXG5cdFx0XHQoW148Pl0pKj9cdFx0XHQvL1xuXHRcdFx0XFwvPz4pXHRcdFx0XHQvLyB0aGUgbWF0Y2hpbmcgZW5kIHRhZ1xuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KD89XFxuezIsfSlcdFx0XHQvLyBmb2xsb3dlZCBieSBhIGJsYW5rIGxpbmVcblx0XHQpXG5cdFx0L2csaGFzaEVsZW1lbnQpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxuWyBdezAsM30oPChocilcXGIoW148Pl0pKj9cXC8/PilbIFxcdF0qKD89XFxuezIsfSkpL2csaGFzaEVsZW1lbnQpO1xuXG5cdC8vIFNwZWNpYWwgY2FzZSBmb3Igc3RhbmRhbG9uZSBIVE1MIGNvbW1lbnRzOlxuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdFxcblxcblx0XHRcdFx0Ly8gU3RhcnRpbmcgYWZ0ZXIgYSBibGFuayBsaW5lXG5cdFx0XHRbIF17MCwzfVx0XHRcdC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGggLSAxXG5cdFx0XHQ8IVxuXHRcdFx0KC0tW15cXHJdKj8tLVxccyopK1xuXHRcdFx0PlxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KD89XFxuezIsfSlcdFx0XHQvLyBmb2xsb3dlZCBieSBhIGJsYW5rIGxpbmVcblx0XHQpXG5cdFx0L2csaGFzaEVsZW1lbnQpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxuXFxuWyBdezAsM308ISgtLVteXFxyXSo/LS1cXHMqKSs+WyBcXHRdKig/PVxcbnsyLH0pKS9nLGhhc2hFbGVtZW50KTtcblxuXHQvLyBQSFAgYW5kIEFTUC1zdHlsZSBwcm9jZXNzb3IgaW5zdHJ1Y3Rpb25zICg8Py4uLj8+IGFuZCA8JS4uLiU+KVxuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KD86XG5cdFx0XHRcXG5cXG5cdFx0XHRcdC8vIFN0YXJ0aW5nIGFmdGVyIGEgYmxhbmsgbGluZVxuXHRcdClcblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0WyBdezAsM31cdFx0XHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0KD86XG5cdFx0XHRcdDwoWz8lXSlcdFx0XHQvLyAkMlxuXHRcdFx0XHRbXlxccl0qP1xuXHRcdFx0XHRcXDI+XG5cdFx0XHQpXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoPz1cXG57Mix9KVx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgYmxhbmsgbGluZVxuXHRcdClcblx0XHQvZyxoYXNoRWxlbWVudCk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg/OlxcblxcbikoWyBdezAsM30oPzo8KFs/JV0pW15cXHJdKj9cXDI+KVsgXFx0XSooPz1cXG57Mix9KSkvZyxoYXNoRWxlbWVudCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBVbmRvIGRvdWJsZSBsaW5lcyAoc2VlIGNvbW1lbnQgYXQgdG9wIG9mIHRoaXMgZnVuY3Rpb24pXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcblxcbi9nLFwiXFxuXCIpO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIGhhc2hFbGVtZW50ID0gZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHR2YXIgYmxvY2tUZXh0ID0gbTE7XG5cblx0Ly8gVW5kbyBkb3VibGUgbGluZXNcblx0YmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL1xcblxcbi9nLFwiXFxuXCIpO1xuXHRibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXlxcbi8sXCJcIik7XG5cblx0Ly8gc3RyaXAgdHJhaWxpbmcgYmxhbmsgbGluZXNcblx0YmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL1xcbiskL2csXCJcIik7XG5cblx0Ly8gUmVwbGFjZSB0aGUgZWxlbWVudCB0ZXh0IHdpdGggYSBtYXJrZXIgKFwifkt4S1wiIHdoZXJlIHggaXMgaXRzIGtleSlcblx0YmxvY2tUZXh0ID0gXCJcXG5cXG5+S1wiICsgKGdfaHRtbF9ibG9ja3MucHVzaChibG9ja1RleHQpLTEpICsgXCJLXFxuXFxuXCI7XG5cblx0cmV0dXJuIGJsb2NrVGV4dDtcbn07XG5cbnZhciBfUnVuQmxvY2tHYW11dCA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBUaGVzZSBhcmUgYWxsIHRoZSB0cmFuc2Zvcm1hdGlvbnMgdGhhdCBmb3JtIGJsb2NrLWxldmVsXG4vLyB0YWdzIGxpa2UgcGFyYWdyYXBocywgaGVhZGVycywgYW5kIGxpc3QgaXRlbXMuXG4vL1xuXHR0ZXh0ID0gX0RvSGVhZGVycyh0ZXh0KTtcblxuXHQvLyBEbyBIb3Jpem9udGFsIFJ1bGVzOlxuXHR2YXIga2V5ID0gaGFzaEJsb2NrKFwiPGhyIC8+XCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBdezAsMn0oWyBdP1xcKlsgXT8pezMsfVsgXFx0XSokL2dtLGtleSk7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwyfShbIF0/XFwtWyBdPyl7Myx9WyBcXHRdKiQvZ20sa2V5KTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXF9bIF0/KXszLH1bIFxcdF0qJC9nbSxrZXkpO1xuXG5cdHRleHQgPSBfRG9MaXN0cyh0ZXh0KTtcblx0dGV4dCA9IF9Eb0NvZGVCbG9ja3ModGV4dCk7XG5cdHRleHQgPSBfRG9CbG9ja1F1b3Rlcyh0ZXh0KTtcblxuXHQvLyBXZSBhbHJlYWR5IHJhbiBfSGFzaEhUTUxCbG9ja3MoKSBiZWZvcmUsIGluIE1hcmtkb3duKCksIGJ1dCB0aGF0XG5cdC8vIHdhcyB0byBlc2NhcGUgcmF3IEhUTUwgaW4gdGhlIG9yaWdpbmFsIE1hcmtkb3duIHNvdXJjZS4gVGhpcyB0aW1lLFxuXHQvLyB3ZSdyZSBlc2NhcGluZyB0aGUgbWFya3VwIHdlJ3ZlIGp1c3QgY3JlYXRlZCwgc28gdGhhdCB3ZSBkb24ndCB3cmFwXG5cdC8vIDxwPiB0YWdzIGFyb3VuZCBibG9jay1sZXZlbCB0YWdzLlxuXHR0ZXh0ID0gX0hhc2hIVE1MQmxvY2tzKHRleHQpO1xuXHR0ZXh0ID0gX0Zvcm1QYXJhZ3JhcGhzKHRleHQpO1xuXG5cdHJldHVybiB0ZXh0O1xufTtcblxuXG52YXIgX1J1blNwYW5HYW11dCA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBUaGVzZSBhcmUgYWxsIHRoZSB0cmFuc2Zvcm1hdGlvbnMgdGhhdCBvY2N1ciAqd2l0aGluKiBibG9jay1sZXZlbFxuLy8gdGFncyBsaWtlIHBhcmFncmFwaHMsIGhlYWRlcnMsIGFuZCBsaXN0IGl0ZW1zLlxuLy9cblxuXHR0ZXh0ID0gX0RvQ29kZVNwYW5zKHRleHQpO1xuXHR0ZXh0ID0gX0VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXModGV4dCk7XG5cdHRleHQgPSBfRW5jb2RlQmFja3NsYXNoRXNjYXBlcyh0ZXh0KTtcblxuXHQvLyBQcm9jZXNzIGFuY2hvciBhbmQgaW1hZ2UgdGFncy4gSW1hZ2VzIG11c3QgY29tZSBmaXJzdCxcblx0Ly8gYmVjYXVzZSAhW2Zvb11bZl0gbG9va3MgbGlrZSBhbiBhbmNob3IuXG5cdHRleHQgPSBfRG9JbWFnZXModGV4dCk7XG5cdHRleHQgPSBfRG9BbmNob3JzKHRleHQpO1xuXG5cdC8vIE1ha2UgbGlua3Mgb3V0IG9mIHRoaW5ncyBsaWtlIGA8aHR0cDovL2V4YW1wbGUuY29tLz5gXG5cdC8vIE11c3QgY29tZSBhZnRlciBfRG9BbmNob3JzKCksIGJlY2F1c2UgeW91IGNhbiB1c2UgPCBhbmQgPlxuXHQvLyBkZWxpbWl0ZXJzIGluIGlubGluZSBsaW5rcyBsaWtlIFt0aGlzXSg8dXJsPikuXG5cdHRleHQgPSBfRG9BdXRvTGlua3ModGV4dCk7XG5cdHRleHQgPSBfRW5jb2RlQW1wc0FuZEFuZ2xlcyh0ZXh0KTtcblx0dGV4dCA9IF9Eb0l0YWxpY3NBbmRCb2xkKHRleHQpO1xuXG5cdC8vIERvIGhhcmQgYnJlYWtzOlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8gICtcXG4vZyxcIiA8YnIgLz5cXG5cIik7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBfRXNjYXBlU3BlY2lhbENoYXJzV2l0aGluVGFnQXR0cmlidXRlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBXaXRoaW4gdGFncyAtLSBtZWFuaW5nIGJldHdlZW4gPCBhbmQgPiAtLSBlbmNvZGUgW1xcIGAgKiBfXSBzbyB0aGV5XG4vLyBkb24ndCBjb25mbGljdCB3aXRoIHRoZWlyIHVzZSBpbiBNYXJrZG93biBmb3IgY29kZSwgaXRhbGljcyBhbmQgc3Ryb25nLlxuLy9cblxuXHQvLyBCdWlsZCBhIHJlZ2V4IHRvIGZpbmQgSFRNTCB0YWdzIGFuZCBjb21tZW50cy4gIFNlZSBGcmllZGwnc1xuXHQvLyBcIk1hc3RlcmluZyBSZWd1bGFyIEV4cHJlc3Npb25zXCIsIDJuZCBFZC4sIHBwLiAyMDAtMjAxLlxuXHR2YXIgcmVnZXggPSAvKDxbYS16XFwvISRdKFwiW15cIl0qXCJ8J1teJ10qJ3xbXidcIj5dKSo+fDwhKC0tLio/LS1cXHMqKSs+KS9naTtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlZ2V4LCBmdW5jdGlvbih3aG9sZU1hdGNoKSB7XG5cdFx0dmFyIHRhZyA9IHdob2xlTWF0Y2gucmVwbGFjZSgvKC4pPFxcLz9jb2RlPig/PS4pL2csXCIkMWBcIik7XG5cdFx0dGFnID0gZXNjYXBlQ2hhcmFjdGVycyh0YWcsXCJcXFxcYCpfXCIpO1xuXHRcdHJldHVybiB0YWc7XG5cdH0pO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0RvQW5jaG9ycyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBUdXJuIE1hcmtkb3duIGxpbmsgc2hvcnRjdXRzIGludG8gWEhUTUwgPGE+IHRhZ3MuXG4vL1xuXHQvL1xuXHQvLyBGaXJzdCwgaGFuZGxlIHJlZmVyZW5jZS1zdHlsZSBsaW5rczogW2xpbmsgdGV4dF0gW2lkXVxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0XFxbXG5cdFx0XHQoXG5cdFx0XHRcdCg/OlxuXHRcdFx0XHRcdFxcW1teXFxdXSpcXF1cdFx0Ly8gYWxsb3cgYnJhY2tldHMgbmVzdGVkIG9uZSBsZXZlbFxuXHRcdFx0XHRcdHxcblx0XHRcdFx0XHRbXlxcW11cdFx0XHQvLyBvciBhbnl0aGluZyBlbHNlXG5cdFx0XHRcdCkqXG5cdFx0XHQpXG5cdFx0XHRcXF1cblxuXHRcdFx0WyBdP1x0XHRcdFx0XHQvLyBvbmUgb3B0aW9uYWwgc3BhY2Vcblx0XHRcdCg/OlxcblsgXSopP1x0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIG5ld2xpbmUgZm9sbG93ZWQgYnkgc3BhY2VzXG5cblx0XHRcdFxcW1xuXHRcdFx0KC4qPylcdFx0XHRcdFx0Ly8gaWQgPSAkM1xuXHRcdFx0XFxdXG5cdFx0KSgpKCkoKSgpXHRcdFx0XHRcdC8vIHBhZCByZW1haW5pbmcgYmFja3JlZmVyZW5jZXNcblx0XHQvZyxfRG9BbmNob3JzX2NhbGxiYWNrKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcWygoPzpcXFtbXlxcXV0qXFxdfFteXFxbXFxdXSkqKVxcXVsgXT8oPzpcXG5bIF0qKT9cXFsoLio/KVxcXSkoKSgpKCkoKS9nLHdyaXRlQW5jaG9yVGFnKTtcblxuXHQvL1xuXHQvLyBOZXh0LCBpbmxpbmUtc3R5bGUgbGlua3M6IFtsaW5rIHRleHRdKHVybCBcIm9wdGlvbmFsIHRpdGxlXCIpXG5cdC8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHRcdChcdFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHRcdFxcW1xuXHRcdFx0XHQoXG5cdFx0XHRcdFx0KD86XG5cdFx0XHRcdFx0XHRcXFtbXlxcXV0qXFxdXHQvLyBhbGxvdyBicmFja2V0cyBuZXN0ZWQgb25lIGxldmVsXG5cdFx0XHRcdFx0fFxuXHRcdFx0XHRcdFteXFxbXFxdXVx0XHRcdC8vIG9yIGFueXRoaW5nIGVsc2Vcblx0XHRcdFx0KVxuXHRcdFx0KVxuXHRcdFx0XFxdXG5cdFx0XHRcXChcdFx0XHRcdFx0XHQvLyBsaXRlcmFsIHBhcmVuXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoKVx0XHRcdFx0XHRcdC8vIG5vIGlkLCBzbyBsZWF2ZSAkMyBlbXB0eVxuXHRcdFx0PD8oLio/KT4/XHRcdFx0XHQvLyBocmVmID0gJDRcblx0XHRcdFsgXFx0XSpcblx0XHRcdChcdFx0XHRcdFx0XHQvLyAkNVxuXHRcdFx0XHQoWydcIl0pXHRcdFx0XHQvLyBxdW90ZSBjaGFyID0gJDZcblx0XHRcdFx0KC4qPylcdFx0XHRcdC8vIFRpdGxlID0gJDdcblx0XHRcdFx0XFw2XHRcdFx0XHRcdC8vIG1hdGNoaW5nIHF1b3RlXG5cdFx0XHRcdFsgXFx0XSpcdFx0XHRcdC8vIGlnbm9yZSBhbnkgc3BhY2VzL3RhYnMgYmV0d2VlbiBjbG9zaW5nIHF1b3RlIGFuZCApXG5cdFx0XHQpP1x0XHRcdFx0XHRcdC8vIHRpdGxlIGlzIG9wdGlvbmFsXG5cdFx0XHRcXClcblx0XHQpXG5cdFx0L2csd3JpdGVBbmNob3JUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbKCg/OlxcW1teXFxdXSpcXF18W15cXFtcXF1dKSopXFxdXFwoWyBcXHRdKigpPD8oLio/KT4/WyBcXHRdKigoWydcIl0pKC4qPylcXDZbIFxcdF0qKT9cXCkpL2csd3JpdGVBbmNob3JUYWcpO1xuXG5cdC8vXG5cdC8vIExhc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgc2hvcnRjdXRzOiBbbGluayB0ZXh0XVxuXHQvLyBUaGVzZSBtdXN0IGNvbWUgbGFzdCBpbiBjYXNlIHlvdSd2ZSBhbHNvIGdvdCBbbGluayB0ZXN0XVsxXVxuXHQvLyBvciBbbGluayB0ZXN0XSgvZm9vKVxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHQgXHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdFxcW1xuXHRcdFx0KFteXFxbXFxdXSspXHRcdFx0XHQvLyBsaW5rIHRleHQgPSAkMjsgY2FuJ3QgY29udGFpbiAnWycgb3IgJ10nXG5cdFx0XHRcXF1cblx0XHQpKCkoKSgpKCkoKVx0XHRcdFx0XHQvLyBwYWQgcmVzdCBvZiBiYWNrcmVmZXJlbmNlc1xuXHRcdC9nLCB3cml0ZUFuY2hvclRhZyk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFsoW15cXFtcXF1dKylcXF0pKCkoKSgpKCkoKS9nLCB3cml0ZUFuY2hvclRhZyk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciB3cml0ZUFuY2hvclRhZyA9IGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQsbTUsbTYsbTcpIHtcblx0aWYgKG03ID09IHVuZGVmaW5lZCkgbTcgPSBcIlwiO1xuXHR2YXIgd2hvbGVfbWF0Y2ggPSBtMTtcblx0dmFyIGxpbmtfdGV4dCAgID0gbTI7XG5cdHZhciBsaW5rX2lkXHQgPSBtMy50b0xvd2VyQ2FzZSgpO1xuXHR2YXIgdXJsXHRcdD0gbTQ7XG5cdHZhciB0aXRsZVx0PSBtNztcblxuXHRpZiAodXJsID09IFwiXCIpIHtcblx0XHRpZiAobGlua19pZCA9PSBcIlwiKSB7XG5cdFx0XHQvLyBsb3dlci1jYXNlIGFuZCB0dXJuIGVtYmVkZGVkIG5ld2xpbmVzIGludG8gc3BhY2VzXG5cdFx0XHRsaW5rX2lkID0gbGlua190ZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvID9cXG4vZyxcIiBcIik7XG5cdFx0fVxuXHRcdHVybCA9IFwiI1wiK2xpbmtfaWQ7XG5cblx0XHRpZiAoZ191cmxzW2xpbmtfaWRdICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0dXJsID0gZ191cmxzW2xpbmtfaWRdO1xuXHRcdFx0aWYgKGdfdGl0bGVzW2xpbmtfaWRdICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHR0aXRsZSA9IGdfdGl0bGVzW2xpbmtfaWRdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICh3aG9sZV9tYXRjaC5zZWFyY2goL1xcKFxccypcXCkkL20pPi0xKSB7XG5cdFx0XHRcdC8vIFNwZWNpYWwgY2FzZSBmb3IgZXhwbGljaXQgZW1wdHkgdXJsXG5cdFx0XHRcdHVybCA9IFwiXCI7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gd2hvbGVfbWF0Y2g7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dXJsID0gZXNjYXBlQ2hhcmFjdGVycyh1cmwsXCIqX1wiKTtcblx0dmFyIHJlc3VsdCA9IFwiPGEgaHJlZj1cXFwiXCIgKyB1cmwgKyBcIlxcXCJcIjtcblxuXHRpZiAodGl0bGUgIT0gXCJcIikge1xuXHRcdHRpdGxlID0gdGl0bGUucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKTtcblx0XHR0aXRsZSA9IGVzY2FwZUNoYXJhY3RlcnModGl0bGUsXCIqX1wiKTtcblx0XHRyZXN1bHQgKz0gIFwiIHRpdGxlPVxcXCJcIiArIHRpdGxlICsgXCJcXFwiXCI7XG5cdH1cblxuXHRyZXN1bHQgKz0gXCI+XCIgKyBsaW5rX3RleHQgKyBcIjwvYT5cIjtcblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5cbnZhciBfRG9JbWFnZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVHVybiBNYXJrZG93biBpbWFnZSBzaG9ydGN1dHMgaW50byA8aW1nPiB0YWdzLlxuLy9cblxuXHQvL1xuXHQvLyBGaXJzdCwgaGFuZGxlIHJlZmVyZW5jZS1zdHlsZSBsYWJlbGVkIGltYWdlczogIVthbHQgdGV4dF1baWRdXG5cdC8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0IVxcW1xuXHRcdFx0KC4qPylcdFx0XHRcdC8vIGFsdCB0ZXh0ID0gJDJcblx0XHRcdFxcXVxuXG5cdFx0XHRbIF0/XHRcdFx0XHQvLyBvbmUgb3B0aW9uYWwgc3BhY2Vcblx0XHRcdCg/OlxcblsgXSopP1x0XHRcdC8vIG9uZSBvcHRpb25hbCBuZXdsaW5lIGZvbGxvd2VkIGJ5IHNwYWNlc1xuXG5cdFx0XHRcXFtcblx0XHRcdCguKj8pXHRcdFx0XHQvLyBpZCA9ICQzXG5cdFx0XHRcXF1cblx0XHQpKCkoKSgpKClcdFx0XHRcdC8vIHBhZCByZXN0IG9mIGJhY2tyZWZlcmVuY2VzXG5cdFx0L2csd3JpdGVJbWFnZVRhZyk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyghXFxbKC4qPylcXF1bIF0/KD86XFxuWyBdKik/XFxbKC4qPylcXF0pKCkoKSgpKCkvZyx3cml0ZUltYWdlVGFnKTtcblxuXHQvL1xuXHQvLyBOZXh0LCBoYW5kbGUgaW5saW5lIGltYWdlczogICFbYWx0IHRleHRdKHVybCBcIm9wdGlvbmFsIHRpdGxlXCIpXG5cdC8vIERvbid0IGZvcmdldDogZW5jb2RlICogYW5kIF9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHQhXFxbXG5cdFx0XHQoLio/KVx0XHRcdFx0Ly8gYWx0IHRleHQgPSAkMlxuXHRcdFx0XFxdXG5cdFx0XHRcXHM/XHRcdFx0XHRcdC8vIE9uZSBvcHRpb25hbCB3aGl0ZXNwYWNlIGNoYXJhY3RlclxuXHRcdFx0XFwoXHRcdFx0XHRcdC8vIGxpdGVyYWwgcGFyZW5cblx0XHRcdFsgXFx0XSpcblx0XHRcdCgpXHRcdFx0XHRcdC8vIG5vIGlkLCBzbyBsZWF2ZSAkMyBlbXB0eVxuXHRcdFx0PD8oXFxTKz8pPj9cdFx0XHQvLyBzcmMgdXJsID0gJDRcblx0XHRcdFsgXFx0XSpcblx0XHRcdChcdFx0XHRcdFx0Ly8gJDVcblx0XHRcdFx0KFsnXCJdKVx0XHRcdC8vIHF1b3RlIGNoYXIgPSAkNlxuXHRcdFx0XHQoLio/KVx0XHRcdC8vIHRpdGxlID0gJDdcblx0XHRcdFx0XFw2XHRcdFx0XHQvLyBtYXRjaGluZyBxdW90ZVxuXHRcdFx0XHRbIFxcdF0qXG5cdFx0XHQpP1x0XHRcdFx0XHQvLyB0aXRsZSBpcyBvcHRpb25hbFxuXHRcdFxcKVxuXHRcdClcblx0XHQvZyx3cml0ZUltYWdlVGFnKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKCFcXFsoLio/KVxcXVxccz9cXChbIFxcdF0qKCk8PyhcXFMrPyk+P1sgXFx0XSooKFsnXCJdKSguKj8pXFw2WyBcXHRdKik/XFwpKS9nLHdyaXRlSW1hZ2VUYWcpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgd3JpdGVJbWFnZVRhZyA9IGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQsbTUsbTYsbTcpIHtcblx0dmFyIHdob2xlX21hdGNoID0gbTE7XG5cdHZhciBhbHRfdGV4dCAgID0gbTI7XG5cdHZhciBsaW5rX2lkXHQgPSBtMy50b0xvd2VyQ2FzZSgpO1xuXHR2YXIgdXJsXHRcdD0gbTQ7XG5cdHZhciB0aXRsZVx0PSBtNztcblxuXHRpZiAoIXRpdGxlKSB0aXRsZSA9IFwiXCI7XG5cblx0aWYgKHVybCA9PSBcIlwiKSB7XG5cdFx0aWYgKGxpbmtfaWQgPT0gXCJcIikge1xuXHRcdFx0Ly8gbG93ZXItY2FzZSBhbmQgdHVybiBlbWJlZGRlZCBuZXdsaW5lcyBpbnRvIHNwYWNlc1xuXHRcdFx0bGlua19pZCA9IGFsdF90ZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvID9cXG4vZyxcIiBcIik7XG5cdFx0fVxuXHRcdHVybCA9IFwiI1wiK2xpbmtfaWQ7XG5cblx0XHRpZiAoZ191cmxzW2xpbmtfaWRdICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0dXJsID0gZ191cmxzW2xpbmtfaWRdO1xuXHRcdFx0aWYgKGdfdGl0bGVzW2xpbmtfaWRdICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHR0aXRsZSA9IGdfdGl0bGVzW2xpbmtfaWRdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiB3aG9sZV9tYXRjaDtcblx0XHR9XG5cdH1cblxuXHRhbHRfdGV4dCA9IGFsdF90ZXh0LnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIik7XG5cdHVybCA9IGVzY2FwZUNoYXJhY3RlcnModXJsLFwiKl9cIik7XG5cdHZhciByZXN1bHQgPSBcIjxpbWcgc3JjPVxcXCJcIiArIHVybCArIFwiXFxcIiBhbHQ9XFxcIlwiICsgYWx0X3RleHQgKyBcIlxcXCJcIjtcblxuXHQvLyBhdHRhY2tsYWI6IE1hcmtkb3duLnBsIGFkZHMgZW1wdHkgdGl0bGUgYXR0cmlidXRlcyB0byBpbWFnZXMuXG5cdC8vIFJlcGxpY2F0ZSB0aGlzIGJ1Zy5cblxuXHQvL2lmICh0aXRsZSAhPSBcIlwiKSB7XG5cdFx0dGl0bGUgPSB0aXRsZS5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHRcdHRpdGxlID0gZXNjYXBlQ2hhcmFjdGVycyh0aXRsZSxcIipfXCIpO1xuXHRcdHJlc3VsdCArPSAgXCIgdGl0bGU9XFxcIlwiICsgdGl0bGUgKyBcIlxcXCJcIjtcblx0Ly99XG5cblx0cmVzdWx0ICs9IFwiIC8+XCI7XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuXG52YXIgX0RvSGVhZGVycyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHQvLyBTZXRleHQtc3R5bGUgaGVhZGVyczpcblx0Ly9cdEhlYWRlciAxXG5cdC8vXHQ9PT09PT09PVxuXHQvL1xuXHQvL1x0SGVhZGVyIDJcblx0Ly9cdC0tLS0tLS0tXG5cdC8vXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oLispWyBcXHRdKlxcbj0rWyBcXHRdKlxcbisvZ20sXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSl7cmV0dXJuIGhhc2hCbG9jaygnPGgxIGlkPVwiJyArIGhlYWRlcklkKG0xKSArICdcIj4nICsgX1J1blNwYW5HYW11dChtMSkgKyBcIjwvaDE+XCIpO30pO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oLispWyBcXHRdKlxcbi0rWyBcXHRdKlxcbisvZ20sXG5cdFx0ZnVuY3Rpb24obWF0Y2hGb3VuZCxtMSl7cmV0dXJuIGhhc2hCbG9jaygnPGgyIGlkPVwiJyArIGhlYWRlcklkKG0xKSArICdcIj4nICsgX1J1blNwYW5HYW11dChtMSkgKyBcIjwvaDI+XCIpO30pO1xuXG5cdC8vIGF0eC1zdHlsZSBoZWFkZXJzOlxuXHQvLyAgIyBIZWFkZXIgMVxuXHQvLyAgIyMgSGVhZGVyIDJcblx0Ly8gICMjIEhlYWRlciAyIHdpdGggY2xvc2luZyBoYXNoZXMgIyNcblx0Ly8gIC4uLlxuXHQvLyAgIyMjIyMjIEhlYWRlciA2XG5cdC8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHRcdF4oXFwjezEsNn0pXHRcdFx0XHQvLyAkMSA9IHN0cmluZyBvZiAjJ3Ncblx0XHRcdFsgXFx0XSpcblx0XHRcdCguKz8pXHRcdFx0XHRcdC8vICQyID0gSGVhZGVyIHRleHRcblx0XHRcdFsgXFx0XSpcblx0XHRcdFxcIypcdFx0XHRcdFx0XHQvLyBvcHRpb25hbCBjbG9zaW5nICMncyAobm90IGNvdW50ZWQpXG5cdFx0XHRcXG4rXG5cdFx0L2dtLCBmdW5jdGlvbigpIHsuLi59KTtcblx0Ki9cblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKFxcI3sxLDZ9KVsgXFx0XSooLis/KVsgXFx0XSpcXCMqXFxuKy9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgaF9sZXZlbCA9IG0xLmxlbmd0aDtcblx0XHRcdHJldHVybiBoYXNoQmxvY2soXCI8aFwiICsgaF9sZXZlbCArICcgaWQ9XCInICsgaGVhZGVySWQobTIpICsgJ1wiPicgKyBfUnVuU3BhbkdhbXV0KG0yKSArIFwiPC9oXCIgKyBoX2xldmVsICsgXCI+XCIpO1xuXHRcdH0pO1xuXG5cdGZ1bmN0aW9uIGhlYWRlcklkKG0pIHtcblx0XHRyZXR1cm4gbS5yZXBsYWNlKC9bXlxcd10vZywgJycpLnRvTG93ZXJDYXNlKCk7XG5cdH1cblx0cmV0dXJuIHRleHQ7XG59XG5cbi8vIFRoaXMgZGVjbGFyYXRpb24ga2VlcHMgRG9qbyBjb21wcmVzc29yIGZyb20gb3V0cHV0dGluZyBnYXJiYWdlOlxudmFyIF9Qcm9jZXNzTGlzdEl0ZW1zO1xuXG52YXIgX0RvTGlzdHMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gRm9ybSBIVE1MIG9yZGVyZWQgKG51bWJlcmVkKSBhbmQgdW5vcmRlcmVkIChidWxsZXRlZCkgbGlzdHMuXG4vL1xuXG5cdC8vIGF0dGFja2xhYjogYWRkIHNlbnRpbmVsIHRvIGhhY2sgYXJvdW5kIGtodG1sL3NhZmFyaSBidWc6XG5cdC8vIGh0dHA6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTExMjMxXG5cdHRleHQgKz0gXCJ+MFwiO1xuXG5cdC8vIFJlLXVzYWJsZSBwYXR0ZXJuIHRvIG1hdGNoIGFueSBlbnRpcmVsIHVsIG9yIG9sIGxpc3Q6XG5cblx0Lypcblx0XHR2YXIgd2hvbGVfbGlzdCA9IC9cblx0XHQoXHRcdFx0XHRcdFx0XHRcdFx0Ly8gJDEgPSB3aG9sZSBsaXN0XG5cdFx0XHQoXHRcdFx0XHRcdFx0XHRcdC8vICQyXG5cdFx0XHRcdFsgXXswLDN9XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGggLSAxXG5cdFx0XHRcdChbKistXXxcXGQrWy5dKVx0XHRcdFx0Ly8gJDMgPSBmaXJzdCBsaXN0IGl0ZW0gbWFya2VyXG5cdFx0XHRcdFsgXFx0XStcblx0XHRcdClcblx0XHRcdFteXFxyXSs/XG5cdFx0XHQoXHRcdFx0XHRcdFx0XHRcdC8vICQ0XG5cdFx0XHRcdH4wXHRcdFx0XHRcdFx0XHQvLyBzZW50aW5lbCBmb3Igd29ya2Fyb3VuZDsgc2hvdWxkIGJlICRcblx0XHRcdHxcblx0XHRcdFx0XFxuezIsfVxuXHRcdFx0XHQoPz1cXFMpXG5cdFx0XHRcdCg/IVx0XHRcdFx0XHRcdFx0Ly8gTmVnYXRpdmUgbG9va2FoZWFkIGZvciBhbm90aGVyIGxpc3QgaXRlbSBtYXJrZXJcblx0XHRcdFx0XHRbIFxcdF0qXG5cdFx0XHRcdFx0KD86WyorLV18XFxkK1suXSlbIFxcdF0rXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHQpL2dcblx0Ki9cblx0dmFyIHdob2xlX2xpc3QgPSAvXigoWyBdezAsM30oWyorLV18XFxkK1suXSlbIFxcdF0rKVteXFxyXSs/KH4wfFxcbnsyLH0oPz1cXFMpKD8hWyBcXHRdKig/OlsqKy1dfFxcZCtbLl0pWyBcXHRdKykpKS9nbTtcblxuXHRpZiAoZ19saXN0X2xldmVsKSB7XG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSh3aG9sZV9saXN0LGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIpIHtcblx0XHRcdHZhciBsaXN0ID0gbTE7XG5cdFx0XHR2YXIgbGlzdF90eXBlID0gKG0yLnNlYXJjaCgvWyorLV0vZyk+LTEpID8gXCJ1bFwiIDogXCJvbFwiO1xuXG5cdFx0XHQvLyBUdXJuIGRvdWJsZSByZXR1cm5zIGludG8gdHJpcGxlIHJldHVybnMsIHNvIHRoYXQgd2UgY2FuIG1ha2UgYVxuXHRcdFx0Ly8gcGFyYWdyYXBoIGZvciB0aGUgbGFzdCBpdGVtIGluIGEgbGlzdCwgaWYgbmVjZXNzYXJ5OlxuXHRcdFx0bGlzdCA9IGxpc3QucmVwbGFjZSgvXFxuezIsfS9nLFwiXFxuXFxuXFxuXCIpOztcblx0XHRcdHZhciByZXN1bHQgPSBfUHJvY2Vzc0xpc3RJdGVtcyhsaXN0KTtcblxuXHRcdFx0Ly8gVHJpbSBhbnkgdHJhaWxpbmcgd2hpdGVzcGFjZSwgdG8gcHV0IHRoZSBjbG9zaW5nIGA8LyRsaXN0X3R5cGU+YFxuXHRcdFx0Ly8gdXAgb24gdGhlIHByZWNlZGluZyBsaW5lLCB0byBnZXQgaXQgcGFzdCB0aGUgY3VycmVudCBzdHVwaWRcblx0XHRcdC8vIEhUTUwgYmxvY2sgcGFyc2VyLiBUaGlzIGlzIGEgaGFjayB0byB3b3JrIGFyb3VuZCB0aGUgdGVycmlibGVcblx0XHRcdC8vIGhhY2sgdGhhdCBpcyB0aGUgSFRNTCBibG9jayBwYXJzZXIuXG5cdFx0XHRyZXN1bHQgPSByZXN1bHQucmVwbGFjZSgvXFxzKyQvLFwiXCIpO1xuXHRcdFx0cmVzdWx0ID0gXCI8XCIrbGlzdF90eXBlK1wiPlwiICsgcmVzdWx0ICsgXCI8L1wiK2xpc3RfdHlwZStcIj5cXG5cIjtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0d2hvbGVfbGlzdCA9IC8oXFxuXFxufF5cXG4/KSgoWyBdezAsM30oWyorLV18XFxkK1suXSlbIFxcdF0rKVteXFxyXSs/KH4wfFxcbnsyLH0oPz1cXFMpKD8hWyBcXHRdKig/OlsqKy1dfFxcZCtbLl0pWyBcXHRdKykpKS9nO1xuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2Uod2hvbGVfbGlzdCxmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zKSB7XG5cdFx0XHR2YXIgcnVudXAgPSBtMTtcblx0XHRcdHZhciBsaXN0ID0gbTI7XG5cblx0XHRcdHZhciBsaXN0X3R5cGUgPSAobTMuc2VhcmNoKC9bKistXS9nKT4tMSkgPyBcInVsXCIgOiBcIm9sXCI7XG5cdFx0XHQvLyBUdXJuIGRvdWJsZSByZXR1cm5zIGludG8gdHJpcGxlIHJldHVybnMsIHNvIHRoYXQgd2UgY2FuIG1ha2UgYVxuXHRcdFx0Ly8gcGFyYWdyYXBoIGZvciB0aGUgbGFzdCBpdGVtIGluIGEgbGlzdCwgaWYgbmVjZXNzYXJ5OlxuXHRcdFx0dmFyIGxpc3QgPSBsaXN0LnJlcGxhY2UoL1xcbnsyLH0vZyxcIlxcblxcblxcblwiKTs7XG5cdFx0XHR2YXIgcmVzdWx0ID0gX1Byb2Nlc3NMaXN0SXRlbXMobGlzdCk7XG5cdFx0XHRyZXN1bHQgPSBydW51cCArIFwiPFwiK2xpc3RfdHlwZStcIj5cXG5cIiArIHJlc3VsdCArIFwiPC9cIitsaXN0X3R5cGUrXCI+XFxuXCI7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC8sXCJcIik7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbl9Qcm9jZXNzTGlzdEl0ZW1zID0gZnVuY3Rpb24obGlzdF9zdHIpIHtcbi8vXG4vLyAgUHJvY2VzcyB0aGUgY29udGVudHMgb2YgYSBzaW5nbGUgb3JkZXJlZCBvciB1bm9yZGVyZWQgbGlzdCwgc3BsaXR0aW5nIGl0XG4vLyAgaW50byBpbmRpdmlkdWFsIGxpc3QgaXRlbXMuXG4vL1xuXHQvLyBUaGUgJGdfbGlzdF9sZXZlbCBnbG9iYWwga2VlcHMgdHJhY2sgb2Ygd2hlbiB3ZSdyZSBpbnNpZGUgYSBsaXN0LlxuXHQvLyBFYWNoIHRpbWUgd2UgZW50ZXIgYSBsaXN0LCB3ZSBpbmNyZW1lbnQgaXQ7IHdoZW4gd2UgbGVhdmUgYSBsaXN0LFxuXHQvLyB3ZSBkZWNyZW1lbnQuIElmIGl0J3MgemVybywgd2UncmUgbm90IGluIGEgbGlzdCBhbnltb3JlLlxuXHQvL1xuXHQvLyBXZSBkbyB0aGlzIGJlY2F1c2Ugd2hlbiB3ZSdyZSBub3QgaW5zaWRlIGEgbGlzdCwgd2Ugd2FudCB0byB0cmVhdFxuXHQvLyBzb21ldGhpbmcgbGlrZSB0aGlzOlxuXHQvL1xuXHQvLyAgICBJIHJlY29tbWVuZCB1cGdyYWRpbmcgdG8gdmVyc2lvblxuXHQvLyAgICA4LiBPb3BzLCBub3cgdGhpcyBsaW5lIGlzIHRyZWF0ZWRcblx0Ly8gICAgYXMgYSBzdWItbGlzdC5cblx0Ly9cblx0Ly8gQXMgYSBzaW5nbGUgcGFyYWdyYXBoLCBkZXNwaXRlIHRoZSBmYWN0IHRoYXQgdGhlIHNlY29uZCBsaW5lIHN0YXJ0c1xuXHQvLyB3aXRoIGEgZGlnaXQtcGVyaW9kLXNwYWNlIHNlcXVlbmNlLlxuXHQvL1xuXHQvLyBXaGVyZWFzIHdoZW4gd2UncmUgaW5zaWRlIGEgbGlzdCAob3Igc3ViLWxpc3QpLCB0aGF0IGxpbmUgd2lsbCBiZVxuXHQvLyB0cmVhdGVkIGFzIHRoZSBzdGFydCBvZiBhIHN1Yi1saXN0LiBXaGF0IGEga2x1ZGdlLCBodWg/IFRoaXMgaXNcblx0Ly8gYW4gYXNwZWN0IG9mIE1hcmtkb3duJ3Mgc3ludGF4IHRoYXQncyBoYXJkIHRvIHBhcnNlIHBlcmZlY3RseVxuXHQvLyB3aXRob3V0IHJlc29ydGluZyB0byBtaW5kLXJlYWRpbmcuIFBlcmhhcHMgdGhlIHNvbHV0aW9uIGlzIHRvXG5cdC8vIGNoYW5nZSB0aGUgc3ludGF4IHJ1bGVzIHN1Y2ggdGhhdCBzdWItbGlzdHMgbXVzdCBzdGFydCB3aXRoIGFcblx0Ly8gc3RhcnRpbmcgY2FyZGluYWwgbnVtYmVyOyBlLmcuIFwiMS5cIiBvciBcImEuXCIuXG5cblx0Z19saXN0X2xldmVsKys7XG5cblx0Ly8gdHJpbSB0cmFpbGluZyBibGFuayBsaW5lczpcblx0bGlzdF9zdHIgPSBsaXN0X3N0ci5yZXBsYWNlKC9cXG57Mix9JC8sXCJcXG5cIik7XG5cblx0Ly8gYXR0YWNrbGFiOiBhZGQgc2VudGluZWwgdG8gZW11bGF0ZSBcXHpcblx0bGlzdF9zdHIgKz0gXCJ+MFwiO1xuXG5cdC8qXG5cdFx0bGlzdF9zdHIgPSBsaXN0X3N0ci5yZXBsYWNlKC9cblx0XHRcdChcXG4pP1x0XHRcdFx0XHRcdFx0Ly8gbGVhZGluZyBsaW5lID0gJDFcblx0XHRcdCheWyBcXHRdKilcdFx0XHRcdFx0XHQvLyBsZWFkaW5nIHdoaXRlc3BhY2UgPSAkMlxuXHRcdFx0KFsqKy1dfFxcZCtbLl0pIFsgXFx0XStcdFx0XHQvLyBsaXN0IG1hcmtlciA9ICQzXG5cdFx0XHQoW15cXHJdKz9cdFx0XHRcdFx0XHQvLyBsaXN0IGl0ZW0gdGV4dCAgID0gJDRcblx0XHRcdChcXG57MSwyfSkpXG5cdFx0XHQoPz0gXFxuKiAofjAgfCBcXDIgKFsqKy1dfFxcZCtbLl0pIFsgXFx0XSspKVxuXHRcdC9nbSwgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblx0bGlzdF9zdHIgPSBsaXN0X3N0ci5yZXBsYWNlKC8oXFxuKT8oXlsgXFx0XSopKFsqKy1dfFxcZCtbLl0pWyBcXHRdKyhbXlxccl0rPyhcXG57MSwyfSkpKD89XFxuKih+MHxcXDIoWyorLV18XFxkK1suXSlbIFxcdF0rKSkvZ20sXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMyxtNCl7XG5cdFx0XHR2YXIgaXRlbSA9IG00O1xuXHRcdFx0dmFyIGxlYWRpbmdfbGluZSA9IG0xO1xuXHRcdFx0dmFyIGxlYWRpbmdfc3BhY2UgPSBtMjtcblxuXHRcdFx0aWYgKGxlYWRpbmdfbGluZSB8fCAoaXRlbS5zZWFyY2goL1xcbnsyLH0vKT4tMSkpIHtcblx0XHRcdFx0aXRlbSA9IF9SdW5CbG9ja0dhbXV0KF9PdXRkZW50KGl0ZW0pKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHQvLyBSZWN1cnNpb24gZm9yIHN1Yi1saXN0czpcblx0XHRcdFx0aXRlbSA9IF9Eb0xpc3RzKF9PdXRkZW50KGl0ZW0pKTtcblx0XHRcdFx0aXRlbSA9IGl0ZW0ucmVwbGFjZSgvXFxuJC8sXCJcIik7IC8vIGNob21wKGl0ZW0pXG5cdFx0XHRcdGl0ZW0gPSBfUnVuU3BhbkdhbXV0KGl0ZW0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gIFwiPGxpPlwiICsgaXRlbSArIFwiPC9saT5cXG5cIjtcblx0XHR9XG5cdCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxuXHRsaXN0X3N0ciA9IGxpc3Rfc3RyLnJlcGxhY2UoL34wL2csXCJcIik7XG5cblx0Z19saXN0X2xldmVsLS07XG5cdHJldHVybiBsaXN0X3N0cjtcbn1cblxuXG52YXIgX0RvQ29kZUJsb2NrcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgUHJvY2VzcyBNYXJrZG93biBgPHByZT48Y29kZT5gIGJsb2Nrcy5cbi8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHRleHQsXG5cdFx0XHQvKD86XFxuXFxufF4pXG5cdFx0XHQoXHRcdFx0XHRcdFx0XHRcdC8vICQxID0gdGhlIGNvZGUgYmxvY2sgLS0gb25lIG9yIG1vcmUgbGluZXMsIHN0YXJ0aW5nIHdpdGggYSBzcGFjZS90YWJcblx0XHRcdFx0KD86XG5cdFx0XHRcdFx0KD86WyBdezR9fFxcdClcdFx0XHQvLyBMaW5lcyBtdXN0IHN0YXJ0IHdpdGggYSB0YWIgb3IgYSB0YWItd2lkdGggb2Ygc3BhY2VzIC0gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXHRcdFx0XHRcdC4qXFxuK1xuXHRcdFx0XHQpK1xuXHRcdFx0KVxuXHRcdFx0KFxcbipbIF17MCwzfVteIFxcdFxcbl18KD89fjApKVx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXHRcdC9nLGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cblx0Ly8gYXR0YWNrbGFiOiBzZW50aW5lbCB3b3JrYXJvdW5kcyBmb3IgbGFjayBvZiBcXEEgYW5kIFxcWiwgc2FmYXJpXFxraHRtbCBidWdcblx0dGV4dCArPSBcIn4wXCI7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKD86XFxuXFxufF4pKCg/Oig/OlsgXXs0fXxcXHQpLipcXG4rKSspKFxcbipbIF17MCwzfVteIFxcdFxcbl18KD89fjApKS9nLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIpIHtcblx0XHRcdHZhciBjb2RlYmxvY2sgPSBtMTtcblx0XHRcdHZhciBuZXh0Q2hhciA9IG0yO1xuXG5cdFx0XHRjb2RlYmxvY2sgPSBfRW5jb2RlQ29kZSggX091dGRlbnQoY29kZWJsb2NrKSk7XG5cdFx0XHRjb2RlYmxvY2sgPSBfRGV0YWIoY29kZWJsb2NrKTtcblx0XHRcdGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9eXFxuKy9nLFwiXCIpOyAvLyB0cmltIGxlYWRpbmcgbmV3bGluZXNcblx0XHRcdGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9cXG4rJC9nLFwiXCIpOyAvLyB0cmltIHRyYWlsaW5nIHdoaXRlc3BhY2VcblxuXHRcdFx0Y29kZWJsb2NrID0gXCI8cHJlPjxjb2RlPlwiICsgY29kZWJsb2NrICsgXCJcXG48L2NvZGU+PC9wcmU+XCI7XG5cblx0XHRcdHJldHVybiBoYXNoQmxvY2soY29kZWJsb2NrKSArIG5leHRDaGFyO1xuXHRcdH1cblx0KTtcblxuXHQvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wLyxcIlwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn07XG5cbnZhciBfRG9HaXRodWJDb2RlQmxvY2tzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vICBQcm9jZXNzIEdpdGh1Yi1zdHlsZSBjb2RlIGJsb2Nrc1xuLy8gIEV4YW1wbGU6XG4vLyAgYGBgcnVieVxuLy8gIGRlZiBoZWxsb193b3JsZCh4KVxuLy8gICAgcHV0cyBcIkhlbGxvLCAje3h9XCJcbi8vICBlbmRcbi8vICBgYGBcbi8vXG5cblxuXHQvLyBhdHRhY2tsYWI6IHNlbnRpbmVsIHdvcmthcm91bmRzIGZvciBsYWNrIG9mIFxcQSBhbmQgXFxaLCBzYWZhcmlcXGtodG1sIGJ1Z1xuXHR0ZXh0ICs9IFwifjBcIjtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oPzpefFxcbilgYGAoLiopXFxuKFtcXHNcXFNdKj8pXFxuYGBgL2csXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGxhbmd1YWdlID0gbTE7XG5cdFx0XHR2YXIgY29kZWJsb2NrID0gbTI7XG5cblx0XHRcdGNvZGVibG9jayA9IF9FbmNvZGVDb2RlKGNvZGVibG9jayk7XG5cdFx0XHRjb2RlYmxvY2sgPSBfRGV0YWIoY29kZWJsb2NrKTtcblx0XHRcdGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9eXFxuKy9nLFwiXCIpOyAvLyB0cmltIGxlYWRpbmcgbmV3bGluZXNcblx0XHRcdGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9cXG4rJC9nLFwiXCIpOyAvLyB0cmltIHRyYWlsaW5nIHdoaXRlc3BhY2VcblxuXHRcdFx0Y29kZWJsb2NrID0gXCI8cHJlPjxjb2RlXCIgKyAobGFuZ3VhZ2UgPyBcIiBjbGFzcz1cXFwiXCIgKyBsYW5ndWFnZSArICdcIicgOiBcIlwiKSArIFwiPlwiICsgY29kZWJsb2NrICsgXCJcXG48L2NvZGU+PC9wcmU+XCI7XG5cblx0XHRcdHJldHVybiBoYXNoQmxvY2soY29kZWJsb2NrKTtcblx0XHR9XG5cdCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC8sXCJcIik7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBoYXNoQmxvY2sgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyheXFxuK3xcXG4rJCkvZyxcIlwiKTtcblx0cmV0dXJuIFwiXFxuXFxufktcIiArIChnX2h0bWxfYmxvY2tzLnB1c2godGV4dCktMSkgKyBcIktcXG5cXG5cIjtcbn1cblxudmFyIF9Eb0NvZGVTcGFucyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgICogIEJhY2t0aWNrIHF1b3RlcyBhcmUgdXNlZCBmb3IgPGNvZGU+PC9jb2RlPiBzcGFucy5cbi8vXG4vLyAgICogIFlvdSBjYW4gdXNlIG11bHRpcGxlIGJhY2t0aWNrcyBhcyB0aGUgZGVsaW1pdGVycyBpZiB5b3Ugd2FudCB0b1xuLy9cdCBpbmNsdWRlIGxpdGVyYWwgYmFja3RpY2tzIGluIHRoZSBjb2RlIHNwYW4uIFNvLCB0aGlzIGlucHV0OlxuLy9cbi8vXHRcdCBKdXN0IHR5cGUgYGBmb28gYGJhcmAgYmF6YGAgYXQgdGhlIHByb21wdC5cbi8vXG4vL1x0ICAgV2lsbCB0cmFuc2xhdGUgdG86XG4vL1xuLy9cdFx0IDxwPkp1c3QgdHlwZSA8Y29kZT5mb28gYGJhcmAgYmF6PC9jb2RlPiBhdCB0aGUgcHJvbXB0LjwvcD5cbi8vXG4vL1x0VGhlcmUncyBubyBhcmJpdHJhcnkgbGltaXQgdG8gdGhlIG51bWJlciBvZiBiYWNrdGlja3MgeW91XG4vL1x0Y2FuIHVzZSBhcyBkZWxpbXRlcnMuIElmIHlvdSBuZWVkIHRocmVlIGNvbnNlY3V0aXZlIGJhY2t0aWNrc1xuLy9cdGluIHlvdXIgY29kZSwgdXNlIGZvdXIgZm9yIGRlbGltaXRlcnMsIGV0Yy5cbi8vXG4vLyAgKiAgWW91IGNhbiB1c2Ugc3BhY2VzIHRvIGdldCBsaXRlcmFsIGJhY2t0aWNrcyBhdCB0aGUgZWRnZXM6XG4vL1xuLy9cdFx0IC4uLiB0eXBlIGBgIGBiYXJgIGBgIC4uLlxuLy9cbi8vXHQgICBUdXJucyB0bzpcbi8vXG4vL1x0XHQgLi4uIHR5cGUgPGNvZGU+YGJhcmA8L2NvZGU+IC4uLlxuLy9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0KF58W15cXFxcXSlcdFx0XHRcdFx0Ly8gQ2hhcmFjdGVyIGJlZm9yZSBvcGVuaW5nIGAgY2FuJ3QgYmUgYSBiYWNrc2xhc2hcblx0XHRcdChgKylcdFx0XHRcdFx0XHQvLyAkMiA9IE9wZW5pbmcgcnVuIG9mIGBcblx0XHRcdChcdFx0XHRcdFx0XHRcdC8vICQzID0gVGhlIGNvZGUgYmxvY2tcblx0XHRcdFx0W15cXHJdKj9cblx0XHRcdFx0W15gXVx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IHdvcmsgYXJvdW5kIGxhY2sgb2YgbG9va2JlaGluZFxuXHRcdFx0KVxuXHRcdFx0XFwyXHRcdFx0XHRcdFx0XHQvLyBNYXRjaGluZyBjbG9zZXJcblx0XHRcdCg/IWApXG5cdFx0L2dtLCBmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhefFteXFxcXF0pKGArKShbXlxccl0qP1teYF0pXFwyKD8hYCkvZ20sXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMyxtNCkge1xuXHRcdFx0dmFyIGMgPSBtMztcblx0XHRcdGMgPSBjLnJlcGxhY2UoL14oWyBcXHRdKikvZyxcIlwiKTtcdC8vIGxlYWRpbmcgd2hpdGVzcGFjZVxuXHRcdFx0YyA9IGMucmVwbGFjZSgvWyBcXHRdKiQvZyxcIlwiKTtcdC8vIHRyYWlsaW5nIHdoaXRlc3BhY2Vcblx0XHRcdGMgPSBfRW5jb2RlQ29kZShjKTtcblx0XHRcdHJldHVybiBtMStcIjxjb2RlPlwiK2MrXCI8L2NvZGU+XCI7XG5cdFx0fSk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBfRW5jb2RlQ29kZSA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBFbmNvZGUvZXNjYXBlIGNlcnRhaW4gY2hhcmFjdGVycyBpbnNpZGUgTWFya2Rvd24gY29kZSBydW5zLlxuLy8gVGhlIHBvaW50IGlzIHRoYXQgaW4gY29kZSwgdGhlc2UgY2hhcmFjdGVycyBhcmUgbGl0ZXJhbHMsXG4vLyBhbmQgbG9zZSB0aGVpciBzcGVjaWFsIE1hcmtkb3duIG1lYW5pbmdzLlxuLy9cblx0Ly8gRW5jb2RlIGFsbCBhbXBlcnNhbmRzOyBIVE1MIGVudGl0aWVzIGFyZSBub3Rcblx0Ly8gZW50aXRpZXMgd2l0aGluIGEgTWFya2Rvd24gY29kZSBzcGFuLlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8mL2csXCImYW1wO1wiKTtcblxuXHQvLyBEbyB0aGUgYW5nbGUgYnJhY2tldCBzb25nIGFuZCBkYW5jZTpcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvPC9nLFwiJmx0O1wiKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvPi9nLFwiJmd0O1wiKTtcblxuXHQvLyBOb3csIGVzY2FwZSBjaGFyYWN0ZXJzIHRoYXQgYXJlIG1hZ2ljIGluIE1hcmtkb3duOlxuXHR0ZXh0ID0gZXNjYXBlQ2hhcmFjdGVycyh0ZXh0LFwiXFwqX3t9W11cXFxcXCIsZmFsc2UpO1xuXG4vLyBqaiB0aGUgbGluZSBhYm92ZSBicmVha3MgdGhpczpcbi8vLS0tXG5cbi8vKiBJdGVtXG5cbi8vICAgMS4gU3ViaXRlbVxuXG4vLyAgICAgICAgICAgIHNwZWNpYWwgY2hhcjogKlxuLy8tLS1cblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0RvSXRhbGljc0FuZEJvbGQgPSBmdW5jdGlvbih0ZXh0KSB7XG5cblx0Ly8gPHN0cm9uZz4gbXVzdCBnbyBmaXJzdDpcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcKlxcKnxfXykoPz1cXFMpKFteXFxyXSo/XFxTWypfXSopXFwxL2csXG5cdFx0XCI8c3Ryb25nPiQyPC9zdHJvbmc+XCIpO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXCp8XykoPz1cXFMpKFteXFxyXSo/XFxTKVxcMS9nLFxuXHRcdFwiPGVtPiQyPC9lbT5cIik7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9Eb0Jsb2NrUXVvdGVzID0gZnVuY3Rpb24odGV4dCkge1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyBXcmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHQoXG5cdFx0XHRcdF5bIFxcdF0qPlsgXFx0XT9cdFx0XHQvLyAnPicgYXQgdGhlIHN0YXJ0IG9mIGEgbGluZVxuXHRcdFx0XHQuK1xcblx0XHRcdFx0XHQvLyByZXN0IG9mIHRoZSBmaXJzdCBsaW5lXG5cdFx0XHRcdCguK1xcbikqXHRcdFx0XHRcdC8vIHN1YnNlcXVlbnQgY29uc2VjdXRpdmUgbGluZXNcblx0XHRcdFx0XFxuKlx0XHRcdFx0XHRcdC8vIGJsYW5rc1xuXHRcdFx0KStcblx0XHQpXG5cdFx0L2dtLCBmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLygoXlsgXFx0XSo+WyBcXHRdPy4rXFxuKC4rXFxuKSpcXG4qKSspL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0XHRcdHZhciBicSA9IG0xO1xuXG5cdFx0XHQvLyBhdHRhY2tsYWI6IGhhY2sgYXJvdW5kIEtvbnF1ZXJvciAzLjUuNCBidWc6XG5cdFx0XHQvLyBcIi0tLS0tLS0tLS1idWdcIi5yZXBsYWNlKC9eLS9nLFwiXCIpID09IFwiYnVnXCJcblxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKC9eWyBcXHRdKj5bIFxcdF0/L2dtLFwifjBcIik7XHQvLyB0cmltIG9uZSBsZXZlbCBvZiBxdW90aW5nXG5cblx0XHRcdC8vIGF0dGFja2xhYjogY2xlYW4gdXAgaGFja1xuXHRcdFx0YnEgPSBicS5yZXBsYWNlKC9+MC9nLFwiXCIpO1xuXG5cdFx0XHRicSA9IGJxLnJlcGxhY2UoL15bIFxcdF0rJC9nbSxcIlwiKTtcdFx0Ly8gdHJpbSB3aGl0ZXNwYWNlLW9ubHkgbGluZXNcblx0XHRcdGJxID0gX1J1bkJsb2NrR2FtdXQoYnEpO1x0XHRcdFx0Ly8gcmVjdXJzZVxuXG5cdFx0XHRicSA9IGJxLnJlcGxhY2UoLyhefFxcbikvZyxcIiQxICBcIik7XG5cdFx0XHQvLyBUaGVzZSBsZWFkaW5nIHNwYWNlcyBzY3JldyB3aXRoIDxwcmU+IGNvbnRlbnQsIHNvIHdlIG5lZWQgdG8gZml4IHRoYXQ6XG5cdFx0XHRicSA9IGJxLnJlcGxhY2UoXG5cdFx0XHRcdFx0LyhcXHMqPHByZT5bXlxccl0rPzxcXC9wcmU+KS9nbSxcblx0XHRcdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHRcdFx0XHRcdHZhciBwcmUgPSBtMTtcblx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IGhhY2sgYXJvdW5kIEtvbnF1ZXJvciAzLjUuNCBidWc6XG5cdFx0XHRcdFx0cHJlID0gcHJlLnJlcGxhY2UoL14gIC9tZyxcIn4wXCIpO1xuXHRcdFx0XHRcdHByZSA9IHByZS5yZXBsYWNlKC9+MC9nLFwiXCIpO1xuXHRcdFx0XHRcdHJldHVybiBwcmU7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKFwiPGJsb2NrcXVvdGU+XFxuXCIgKyBicSArIFwiXFxuPC9ibG9ja3F1b3RlPlwiKTtcblx0XHR9KTtcblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9Gb3JtUGFyYWdyYXBocyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgUGFyYW1zOlxuLy8gICAgJHRleHQgLSBzdHJpbmcgdG8gcHJvY2VzcyB3aXRoIGh0bWwgPHA+IHRhZ3Ncbi8vXG5cblx0Ly8gU3RyaXAgbGVhZGluZyBhbmQgdHJhaWxpbmcgbGluZXM6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL15cXG4rL2csXCJcIik7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcbiskL2csXCJcIik7XG5cblx0dmFyIGdyYWZzID0gdGV4dC5zcGxpdCgvXFxuezIsfS9nKTtcblx0dmFyIGdyYWZzT3V0ID0gbmV3IEFycmF5KCk7XG5cblx0Ly9cblx0Ly8gV3JhcCA8cD4gdGFncy5cblx0Ly9cblx0dmFyIGVuZCA9IGdyYWZzLmxlbmd0aDtcblx0Zm9yICh2YXIgaT0wOyBpPGVuZDsgaSsrKSB7XG5cdFx0dmFyIHN0ciA9IGdyYWZzW2ldO1xuXG5cdFx0Ly8gaWYgdGhpcyBpcyBhbiBIVE1MIG1hcmtlciwgY29weSBpdFxuXHRcdGlmIChzdHIuc2VhcmNoKC9+SyhcXGQrKUsvZykgPj0gMCkge1xuXHRcdFx0Z3JhZnNPdXQucHVzaChzdHIpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChzdHIuc2VhcmNoKC9cXFMvKSA+PSAwKSB7XG5cdFx0XHRzdHIgPSBfUnVuU3BhbkdhbXV0KHN0cik7XG5cdFx0XHRzdHIgPSBzdHIucmVwbGFjZSgvXihbIFxcdF0qKS9nLFwiPHA+XCIpO1xuXHRcdFx0c3RyICs9IFwiPC9wPlwiXG5cdFx0XHRncmFmc091dC5wdXNoKHN0cik7XG5cdFx0fVxuXG5cdH1cblxuXHQvL1xuXHQvLyBVbmhhc2hpZnkgSFRNTCBibG9ja3Ncblx0Ly9cblx0ZW5kID0gZ3JhZnNPdXQubGVuZ3RoO1xuXHRmb3IgKHZhciBpPTA7IGk8ZW5kOyBpKyspIHtcblx0XHQvLyBpZiB0aGlzIGlzIGEgbWFya2VyIGZvciBhbiBodG1sIGJsb2NrLi4uXG5cdFx0d2hpbGUgKGdyYWZzT3V0W2ldLnNlYXJjaCgvfksoXFxkKylLLykgPj0gMCkge1xuXHRcdFx0dmFyIGJsb2NrVGV4dCA9IGdfaHRtbF9ibG9ja3NbUmVnRXhwLiQxXTtcblx0XHRcdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9cXCQvZyxcIiQkJCRcIik7IC8vIEVzY2FwZSBhbnkgZG9sbGFyIHNpZ25zXG5cdFx0XHRncmFmc091dFtpXSA9IGdyYWZzT3V0W2ldLnJlcGxhY2UoL35LXFxkK0svLGJsb2NrVGV4dCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGdyYWZzT3V0LmpvaW4oXCJcXG5cXG5cIik7XG59XG5cblxudmFyIF9FbmNvZGVBbXBzQW5kQW5nbGVzID0gZnVuY3Rpb24odGV4dCkge1xuLy8gU21hcnQgcHJvY2Vzc2luZyBmb3IgYW1wZXJzYW5kcyBhbmQgYW5nbGUgYnJhY2tldHMgdGhhdCBuZWVkIHRvIGJlIGVuY29kZWQuXG5cblx0Ly8gQW1wZXJzYW5kLWVuY29kaW5nIGJhc2VkIGVudGlyZWx5IG9uIE5hdCBJcm9ucydzIEFtcHV0YXRvciBNVCBwbHVnaW46XG5cdC8vICAgaHR0cDovL2J1bXBwby5uZXQvcHJvamVjdHMvYW1wdXRhdG9yL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8mKD8hIz9beFhdPyg/OlswLTlhLWZBLUZdK3xcXHcrKTspL2csXCImYW1wO1wiKTtcblxuXHQvLyBFbmNvZGUgbmFrZWQgPCdzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwoPyFbYS16XFwvP1xcJCFdKS9naSxcIiZsdDtcIik7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9FbmNvZGVCYWNrc2xhc2hFc2NhcGVzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vICAgUGFyYW1ldGVyOiAgU3RyaW5nLlxuLy8gICBSZXR1cm5zOlx0VGhlIHN0cmluZywgd2l0aCBhZnRlciBwcm9jZXNzaW5nIHRoZSBmb2xsb3dpbmcgYmFja3NsYXNoXG4vL1x0XHRcdCAgIGVzY2FwZSBzZXF1ZW5jZXMuXG4vL1xuXG5cdC8vIGF0dGFja2xhYjogVGhlIHBvbGl0ZSB3YXkgdG8gZG8gdGhpcyBpcyB3aXRoIHRoZSBuZXdcblx0Ly8gZXNjYXBlQ2hhcmFjdGVycygpIGZ1bmN0aW9uOlxuXHQvL1xuXHQvLyBcdHRleHQgPSBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsXCJcXFxcXCIsdHJ1ZSk7XG5cdC8vIFx0dGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcImAqX3t9W10oKT4jKy0uIVwiLHRydWUpO1xuXHQvL1xuXHQvLyAuLi5idXQgd2UncmUgc2lkZXN0ZXBwaW5nIGl0cyB1c2Ugb2YgdGhlIChzbG93KSBSZWdFeHAgY29uc3RydWN0b3Jcblx0Ly8gYXMgYW4gb3B0aW1pemF0aW9uIGZvciBGaXJlZm94LiAgVGhpcyBmdW5jdGlvbiBnZXRzIGNhbGxlZCBhIExPVC5cblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXFxcKFxcXFwpL2csZXNjYXBlQ2hhcmFjdGVyc19jYWxsYmFjayk7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcXFwoW2AqX3t9XFxbXFxdKCk+IystLiFdKS9nLGVzY2FwZUNoYXJhY3RlcnNfY2FsbGJhY2spO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0RvQXV0b0xpbmtzID0gZnVuY3Rpb24odGV4dCkge1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwoKGh0dHBzP3xmdHB8ZGljdCk6W14nXCI+XFxzXSspPi9naSxcIjxhIGhyZWY9XFxcIiQxXFxcIj4kMTwvYT5cIik7XG5cblx0Ly8gRW1haWwgYWRkcmVzc2VzOiA8YWRkcmVzc0Bkb21haW4uZm9vPlxuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHQ8XG5cdFx0XHQoPzptYWlsdG86KT9cblx0XHRcdChcblx0XHRcdFx0Wy0uXFx3XStcblx0XHRcdFx0XFxAXG5cdFx0XHRcdFstYS16MC05XSsoXFwuWy1hLXowLTldKykqXFwuW2Etel0rXG5cdFx0XHQpXG5cdFx0XHQ+XG5cdFx0L2dpLCBfRG9BdXRvTGlua3NfY2FsbGJhY2soKSk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwoPzptYWlsdG86KT8oWy0uXFx3XStcXEBbLWEtejAtOV0rKFxcLlstYS16MC05XSspKlxcLlthLXpdKyk+L2dpLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0XHRcdHJldHVybiBfRW5jb2RlRW1haWxBZGRyZXNzKCBfVW5lc2NhcGVTcGVjaWFsQ2hhcnMobTEpICk7XG5cdFx0fVxuXHQpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRW5jb2RlRW1haWxBZGRyZXNzID0gZnVuY3Rpb24oYWRkcikge1xuLy9cbi8vICBJbnB1dDogYW4gZW1haWwgYWRkcmVzcywgZS5nLiBcImZvb0BleGFtcGxlLmNvbVwiXG4vL1xuLy8gIE91dHB1dDogdGhlIGVtYWlsIGFkZHJlc3MgYXMgYSBtYWlsdG8gbGluaywgd2l0aCBlYWNoIGNoYXJhY3RlclxuLy9cdG9mIHRoZSBhZGRyZXNzIGVuY29kZWQgYXMgZWl0aGVyIGEgZGVjaW1hbCBvciBoZXggZW50aXR5LCBpblxuLy9cdHRoZSBob3BlcyBvZiBmb2lsaW5nIG1vc3QgYWRkcmVzcyBoYXJ2ZXN0aW5nIHNwYW0gYm90cy4gRS5nLjpcbi8vXG4vL1x0PGEgaHJlZj1cIiYjeDZEOyYjOTc7JiMxMDU7JiMxMDg7JiN4NzQ7JiMxMTE7OiYjMTAyOyYjMTExOyYjMTExOyYjNjQ7JiMxMDE7XG4vL1x0ICAgeCYjeDYxOyYjMTA5OyYjeDcwOyYjMTA4OyYjeDY1OyYjeDJFOyYjOTk7JiMxMTE7JiMxMDk7XCI+JiMxMDI7JiMxMTE7JiMxMTE7XG4vL1x0ICAgJiM2NDsmIzEwMTt4JiN4NjE7JiMxMDk7JiN4NzA7JiMxMDg7JiN4NjU7JiN4MkU7JiM5OTsmIzExMTsmIzEwOTs8L2E+XG4vL1xuLy8gIEJhc2VkIG9uIGEgZmlsdGVyIGJ5IE1hdHRoZXcgV2lja2xpbmUsIHBvc3RlZCB0byB0aGUgQkJFZGl0LVRhbGtcbi8vICBtYWlsaW5nIGxpc3Q6IDxodHRwOi8vdGlueXVybC5jb20veXU3dWU+XG4vL1xuXG5cdC8vIGF0dGFja2xhYjogd2h5IGNhbid0IGphdmFzY3JpcHQgc3BlYWsgaGV4P1xuXHRmdW5jdGlvbiBjaGFyMmhleChjaCkge1xuXHRcdHZhciBoZXhEaWdpdHMgPSAnMDEyMzQ1Njc4OUFCQ0RFRic7XG5cdFx0dmFyIGRlYyA9IGNoLmNoYXJDb2RlQXQoMCk7XG5cdFx0cmV0dXJuKGhleERpZ2l0cy5jaGFyQXQoZGVjPj40KSArIGhleERpZ2l0cy5jaGFyQXQoZGVjJjE1KSk7XG5cdH1cblxuXHR2YXIgZW5jb2RlID0gW1xuXHRcdGZ1bmN0aW9uKGNoKXtyZXR1cm4gXCImI1wiK2NoLmNoYXJDb2RlQXQoMCkrXCI7XCI7fSxcblx0XHRmdW5jdGlvbihjaCl7cmV0dXJuIFwiJiN4XCIrY2hhcjJoZXgoY2gpK1wiO1wiO30sXG5cdFx0ZnVuY3Rpb24oY2gpe3JldHVybiBjaDt9XG5cdF07XG5cblx0YWRkciA9IFwibWFpbHRvOlwiICsgYWRkcjtcblxuXHRhZGRyID0gYWRkci5yZXBsYWNlKC8uL2csIGZ1bmN0aW9uKGNoKSB7XG5cdFx0aWYgKGNoID09IFwiQFwiKSB7XG5cdFx0ICAgXHQvLyB0aGlzICptdXN0KiBiZSBlbmNvZGVkLiBJIGluc2lzdC5cblx0XHRcdGNoID0gZW5jb2RlW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoyKV0oY2gpO1xuXHRcdH0gZWxzZSBpZiAoY2ggIT1cIjpcIikge1xuXHRcdFx0Ly8gbGVhdmUgJzonIGFsb25lICh0byBzcG90IG1haWx0bzogbGF0ZXIpXG5cdFx0XHR2YXIgciA9IE1hdGgucmFuZG9tKCk7XG5cdFx0XHQvLyByb3VnaGx5IDEwJSByYXcsIDQ1JSBoZXgsIDQ1JSBkZWNcblx0XHRcdGNoID0gIChcblx0XHRcdFx0XHRyID4gLjkgID9cdGVuY29kZVsyXShjaCkgICA6XG5cdFx0XHRcdFx0ciA+IC40NSA/XHRlbmNvZGVbMV0oY2gpICAgOlxuXHRcdFx0XHRcdFx0XHRcdGVuY29kZVswXShjaClcblx0XHRcdFx0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGNoO1xuXHR9KTtcblxuXHRhZGRyID0gXCI8YSBocmVmPVxcXCJcIiArIGFkZHIgKyBcIlxcXCI+XCIgKyBhZGRyICsgXCI8L2E+XCI7XG5cdGFkZHIgPSBhZGRyLnJlcGxhY2UoL1wiPi4rOi9nLFwiXFxcIj5cIik7IC8vIHN0cmlwIHRoZSBtYWlsdG86IGZyb20gdGhlIHZpc2libGUgcGFydFxuXG5cdHJldHVybiBhZGRyO1xufVxuXG5cbnZhciBfVW5lc2NhcGVTcGVjaWFsQ2hhcnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gU3dhcCBiYWNrIGluIGFsbCB0aGUgc3BlY2lhbCBjaGFyYWN0ZXJzIHdlJ3ZlIGhpZGRlbi5cbi8vXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL35FKFxcZCspRS9nLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0XHRcdHZhciBjaGFyQ29kZVRvUmVwbGFjZSA9IHBhcnNlSW50KG0xKTtcblx0XHRcdHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoYXJDb2RlVG9SZXBsYWNlKTtcblx0XHR9XG5cdCk7XG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfT3V0ZGVudCA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBSZW1vdmUgb25lIGxldmVsIG9mIGxpbmUtbGVhZGluZyB0YWJzIG9yIHNwYWNlc1xuLy9cblxuXHQvLyBhdHRhY2tsYWI6IGhhY2sgYXJvdW5kIEtvbnF1ZXJvciAzLjUuNCBidWc6XG5cdC8vIFwiLS0tLS0tLS0tLWJ1Z1wiLnJlcGxhY2UoL14tL2csXCJcIikgPT0gXCJidWdcIlxuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oXFx0fFsgXXsxLDR9KS9nbSxcIn4wXCIpOyAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cblx0Ly8gYXR0YWNrbGFiOiBjbGVhbiB1cCBoYWNrXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wL2csXCJcIilcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIF9EZXRhYiA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vIGF0dGFja2xhYjogRGV0YWIncyBjb21wbGV0ZWx5IHJld3JpdHRlbiBmb3Igc3BlZWQuXG4vLyBJbiBwZXJsIHdlIGNvdWxkIGZpeCBpdCBieSBhbmNob3JpbmcgdGhlIHJlZ2V4cCB3aXRoIFxcRy5cbi8vIEluIGphdmFzY3JpcHQgd2UncmUgbGVzcyBmb3J0dW5hdGUuXG5cblx0Ly8gZXhwYW5kIGZpcnN0IG4tMSB0YWJzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcdCg/PVxcdCkvZyxcIiAgICBcIik7IC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblxuXHQvLyByZXBsYWNlIHRoZSBudGggd2l0aCB0d28gc2VudGluZWxzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcdC9nLFwifkF+QlwiKTtcblxuXHQvLyB1c2UgdGhlIHNlbnRpbmVsIHRvIGFuY2hvciBvdXIgcmVnZXggc28gaXQgZG9lc24ndCBleHBsb2RlXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL35CKC4rPyl+QS9nLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIpIHtcblx0XHRcdHZhciBsZWFkaW5nVGV4dCA9IG0xO1xuXHRcdFx0dmFyIG51bVNwYWNlcyA9IDQgLSBsZWFkaW5nVGV4dC5sZW5ndGggJSA0OyAgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXG5cdFx0XHQvLyB0aGVyZSAqbXVzdCogYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM6XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8bnVtU3BhY2VzOyBpKyspIGxlYWRpbmdUZXh0Kz1cIiBcIjtcblxuXHRcdFx0cmV0dXJuIGxlYWRpbmdUZXh0O1xuXHRcdH1cblx0KTtcblxuXHQvLyBjbGVhbiB1cCBzZW50aW5lbHNcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfkEvZyxcIiAgICBcIik7ICAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL35CL2csXCJcIik7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxuLy9cbi8vICBhdHRhY2tsYWI6IFV0aWxpdHkgZnVuY3Rpb25zXG4vL1xuXG5cbnZhciBlc2NhcGVDaGFyYWN0ZXJzID0gZnVuY3Rpb24odGV4dCwgY2hhcnNUb0VzY2FwZSwgYWZ0ZXJCYWNrc2xhc2gpIHtcblx0Ly8gRmlyc3Qgd2UgaGF2ZSB0byBlc2NhcGUgdGhlIGVzY2FwZSBjaGFyYWN0ZXJzIHNvIHRoYXRcblx0Ly8gd2UgY2FuIGJ1aWxkIGEgY2hhcmFjdGVyIGNsYXNzIG91dCBvZiB0aGVtXG5cdHZhciByZWdleFN0cmluZyA9IFwiKFtcIiArIGNoYXJzVG9Fc2NhcGUucmVwbGFjZSgvKFtcXFtcXF1cXFxcXSkvZyxcIlxcXFwkMVwiKSArIFwiXSlcIjtcblxuXHRpZiAoYWZ0ZXJCYWNrc2xhc2gpIHtcblx0XHRyZWdleFN0cmluZyA9IFwiXFxcXFxcXFxcIiArIHJlZ2V4U3RyaW5nO1xuXHR9XG5cblx0dmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZyxcImdcIik7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsZXNjYXBlQ2hhcmFjdGVyc19jYWxsYmFjayk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIGVzY2FwZUNoYXJhY3RlcnNfY2FsbGJhY2sgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdHZhciBjaGFyQ29kZVRvRXNjYXBlID0gbTEuY2hhckNvZGVBdCgwKTtcblx0cmV0dXJuIFwifkVcIitjaGFyQ29kZVRvRXNjYXBlK1wiRVwiO1xufVxuXG59IC8vIGVuZCBvZiBTaG93ZG93bi5jb252ZXJ0ZXJcblxuLy8gZXhwb3J0XG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIG1vZHVsZS5leHBvcnRzID0gU2hvd2Rvd247XG5cbn0pKCkiLCIoZnVuY3Rpb24ocHJvY2Vzcyl7aWYgKCFwcm9jZXNzLkV2ZW50RW1pdHRlcikgcHJvY2Vzcy5FdmVudEVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcHJvY2Vzcy5FdmVudEVtaXR0ZXI7XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nXG4gICAgPyBBcnJheS5pc0FycmF5XG4gICAgOiBmdW5jdGlvbiAoeHMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9XG47XG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4ID09PSB4c1tpXSkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4vLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbi8vXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBuO1xufTtcblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc0FycmF5KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKVxuICAgIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiBmYWxzZTtcbiAgdmFyIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGlmICghaGFuZGxlcikgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZExpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cbiAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICAgIHZhciBtO1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5vbih0eXBlLCBmdW5jdGlvbiBnKCkge1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNBcnJheShsaXN0KSkge1xuICAgIHZhciBpID0gaW5kZXhPZihsaXN0LCBsaXN0ZW5lcik7XG4gICAgaWYgKGkgPCAwKSByZXR1cm4gdGhpcztcbiAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT0gMClcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdID09PSBsaXN0ZW5lcikge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICh0eXBlICYmIHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICB9XG4gIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGlmIChldi5zb3VyY2UgPT09IHdpbmRvdyAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJ7RXZlbnRFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50cydcblxuYmFzZTY0ID0gcmVxdWlyZSAnLi4vbGliL2Jhc2U2NCdcbiNsencgPSByZXF1aXJlICcuLi9saWIvbHp3J1xuXG5ybmQgPSAtPiBEYXRlLm5vdygpICsgJy0nICtcbiAgKCcwMTIzNDU2Nzg5YWJjZGVmJ1tNYXRoLnJhbmRvbSgpICogMTYgfCAwXSBmb3IgeCBpbiBbMC4uMTBdKS5qb2luICcnXG5cbmRlc2VyaWFsaXplID0gLT5cbiAgW3R5cGUsIGlkXSA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKS5zcGxpdCAnLycsIDJcbiAgeyB0eXBlLCBpZCB9XG5zZXJpYWxpemUgPSAoZGF0YSkgLT4gd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnIycrZGF0YS50eXBlKycvJytkYXRhLmlkXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGUgPSBuZXcgRXZlbnRFbWl0dGVyXG5cbnN0YXRlLnN0b3JlVHlwZSA9ICdiYXNlNjQnXG5zdGF0ZS5zdG9yZUlkID0gJydcblxuc3RhdGUuc3RvcmVzID1cbiAgI2x6dzpcbiAgIyAgc3RvcmU6IChkYXRhLCBmbikgLT4gZm4gYmFzZTY0LmVuY29kZSBsencuZW5jb2RlIGRhdGFcbiAgIyAgcmVzdG9yZTogKGRhdGEsIGZuKSAtPiBmbiBsencuZGVjb2RlIGJhc2U2NC5kZWNvZGUgZGF0YVxuICBiYXNlNjQ6XG4gICAgc3RvcmU6IChpZCwgZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgICBjYWxsYmFjayBiYXNlNjQuZW5jb2RlIEpTT04uc3RyaW5naWZ5KGRhdGEgb3IgJ3t9JylcbiAgICByZXN0b3JlOiAoaWQsIGNhbGxiYWNrKSAtPlxuICAgICAgY2FsbGJhY2sgSlNPTi5wYXJzZSBiYXNlNjQuZGVjb2RlKGlkKSBvciAne30nXG4gIGxvY2FsU3RvcmFnZTpcbiAgICBzdG9yZTogKGlkLCBkYXRhLCBjYWxsYmFjaykgLT5cbiAgICAgIGlkID89IHJuZCgpXG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0gaWQsIEpTT04uc3RyaW5naWZ5KGRhdGEgb3IgJ3t9JylcbiAgICAgIGNhbGxiYWNrIGlkXG4gICAgcmVzdG9yZTogKGlkLCBjYWxsYmFjaykgLT5cbiAgICAgIGNhbGxiYWNrIEpTT04ucGFyc2Ugd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtIGlkXG5cbnN0YXRlLnN0b3JlID0gKHN0b3JlVHlwZSwgZGF0YSwgY2FsbGJhY2spIC0+XG4gIHN0YXRlLnN0b3JlVHlwZSA9IHN0b3JlVHlwZSBpZiBzdG9yZVR5cGVcbiAgc3RhdGUuc3RvcmVzW3N0YXRlLnN0b3JlVHlwZV0uc3RvcmUgc3RhdGUuc3RvcmVJZCwgZGF0YSwgKHN0b3JlSWQpIC0+XG4gICAgc3RhdGUuc3RvcmVJZCA9IHN0b3JlSWRcbiAgICBzZXJpYWxpemUgdHlwZTpzdGF0ZS5zdG9yZVR5cGUsIGlkOnN0b3JlSWRcbiAgICBjYWxsYmFjaz8gc3RvcmVJZFxuXG5zdGF0ZS5yZXN0b3JlID0gKHN0b3JlVHlwZSwgc3RvcmVJZCwgY2FsbGJhY2spIC0+XG4gIGlmIG5vdCBzdG9yZVR5cGU/IGFuZCBub3Qgc3RvcmVJZD9cbiAgICB7IHR5cGU6c3RvcmVUeXBlLCBpZDpzdG9yZUlkIH0gPSBkZXNlcmlhbGl6ZSgpXG4gIHN0YXRlLnN0b3JlVHlwZSA9IHN0b3JlVHlwZSBpZiBzdG9yZVR5cGVcbiAgc3RhdGUuc3RvcmVJZCA9IHN0b3JlSWRcbiAgaWYgc3RvcmVJZD9cbiAgICBzdGF0ZS5zdG9yZXNbc3RhdGUuc3RvcmVUeXBlXS5yZXN0b3JlIHN0YXRlLnN0b3JlSWQsIChkYXRhKSAtPlxuICAgICAgY2FsbGJhY2sgZGF0YVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAnaGFzaGNoYW5nZScsIC0+XG4gIHsgdHlwZTpzdG9yZVR5cGUsIGlkOnN0b3JlSWQgfSA9IGRlc2VyaWFsaXplKClcbiAgaWYgc3RvcmVUeXBlIGlzbnQgc3RhdGUuc3RvcmVUeXBlIG9yIHN0b3JlSWQgaXNudCBzdGF0ZS5zdG9yZUlkXG4gICAgc3RhdGUucmVzdG9yZSBzdG9yZVR5cGUsIHN0b3JlSWQsIChkYXRhKSAtPlxuICAgICAgc3RvcmUuZW1pdCAncmVzdG9yZScsIGRhdGFcbiIsIi8qKlxuICpcbiAqICBiYXNlNjQgZW5jb2RlIC8gZGVjb2RlXG4gKiAgaHR0cDovL3d3dy53ZWJ0b29sa2l0LmluZm8vXG4gKlxuICoqL1xuXG52YXIgYmFzZTY0ID0ge1xuXG4gIC8vIHByaXZhdGUgcHJvcGVydHlcbiAgX2tleVN0ciA6IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIixcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBlbmNvZGluZ1xuICBlbmNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMywgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGJhc2U2NC5fdXRmOF9lbmNvZGUoaW5wdXQpO1xuXG4gICAgd2hpbGUgKGkgPCBpbnB1dC5sZW5ndGgpIHtcblxuICAgICAgY2hyMSA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgIGNocjIgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIzID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICBlbmMxID0gY2hyMSA+PiAyO1xuICAgICAgZW5jMiA9ICgoY2hyMSAmIDMpIDw8IDQpIHwgKGNocjIgPj4gNCk7XG4gICAgICBlbmMzID0gKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNik7XG4gICAgICBlbmM0ID0gY2hyMyAmIDYzO1xuXG4gICAgICBpZiAoaXNOYU4oY2hyMikpIHtcbiAgICAgICAgZW5jMyA9IGVuYzQgPSA2NDtcbiAgICAgIH0gZWxzZSBpZiAoaXNOYU4oY2hyMykpIHtcbiAgICAgICAgZW5jNCA9IDY0O1xuICAgICAgfVxuXG4gICAgICBvdXRwdXQgPSBvdXRwdXQgK1xuICAgICAgICB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzEpICsgdGhpcy5fa2V5U3RyLmNoYXJBdChlbmMyKSArXG4gICAgICAgIHRoaXMuX2tleVN0ci5jaGFyQXQoZW5jMykgKyB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzQpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSxcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBkZWNvZGluZ1xuICBkZWNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMztcbiAgICB2YXIgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXFw9XS9nLCBcIlwiKTtcblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG5cbiAgICAgIGVuYzEgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG4gICAgICBlbmMyID0gdGhpcy5fa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuICAgICAgZW5jMyA9IHRoaXMuX2tleVN0ci5pbmRleE9mKGlucHV0LmNoYXJBdChpKyspKTtcbiAgICAgIGVuYzQgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG5cbiAgICAgIGNocjEgPSAoZW5jMSA8PCAyKSB8IChlbmMyID4+IDQpO1xuICAgICAgY2hyMiA9ICgoZW5jMiAmIDE1KSA8PCA0KSB8IChlbmMzID4+IDIpO1xuICAgICAgY2hyMyA9ICgoZW5jMyAmIDMpIDw8IDYpIHwgZW5jNDtcblxuICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIxKTtcblxuICAgICAgaWYgKGVuYzMgIT0gNjQpIHtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIyKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmM0ICE9IDY0KSB7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dCArIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyMyk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBvdXRwdXQgPSBiYXNlNjQuX3V0ZjhfZGVjb2RlKG91dHB1dCk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuXG4gIH0sXG5cbiAgLy8gcHJpdmF0ZSBtZXRob2QgZm9yIFVURi04IGVuY29kaW5nXG4gIF91dGY4X2VuY29kZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7XG4gICAgdmFyIHV0ZnRleHQgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCBzdHJpbmcubGVuZ3RoOyBuKyspIHtcblxuICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChuKTtcblxuICAgICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZigoYyA+IDEyNykgJiYgKGMgPCAyMDQ4KSkge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gNikgfCAxOTIpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiAxMikgfCAyMjQpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjID4+IDYpICYgNjMpIHwgMTI4KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB1dGZ0ZXh0O1xuICB9LFxuXG4gIC8vIHByaXZhdGUgbWV0aG9kIGZvciBVVEYtOCBkZWNvZGluZ1xuICBfdXRmOF9kZWNvZGUgOiBmdW5jdGlvbiAodXRmdGV4dCkge1xuICAgIHZhciBzdHJpbmcgPSBcIlwiO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgYyA9IGMxID0gYzIgPSAwO1xuXG4gICAgd2hpbGUgKCBpIDwgdXRmdGV4dC5sZW5ndGggKSB7XG5cbiAgICAgIGMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcbiAgICAgICAgYzIgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsxKTtcbiAgICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMzEpIDw8IDYpIHwgKGMyICYgNjMpKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XG4gICAgICAgIGMzID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMik7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDE1KSA8PCAxMikgfCAoKGMyICYgNjMpIDw8IDYpIHwgKGMzICYgNjMpKTtcbiAgICAgICAgaSArPSAzO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZTY0O1xuIl19
;