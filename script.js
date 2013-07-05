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


},{}],5:[function(require,module,exports){
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
var Showdown, State, extend, index, markdown, number, proxy, state_, toc, vixen, _ref, _ref1;

vixen = require('vixen');

Showdown = require('showdown');

markdown = new Showdown.converter();

require('./unify.coffee');

_ref = require('./State.coffee'), State = _ref.State, state_ = _ref.state;

_ref1 = require('./utils.coffee'), number = _ref1.number, index = _ref1.index, toc = _ref1.toc;

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

proxy = function(dict) {
  var fn, prop, proxy_, vault_;
  vault_ = {};
  proxy_ = {
    def: function(prop, callback) {
      return Object.defineProperty(proxy_, prop, {
        enumerable: true,
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
    },
    toJSON: function() {
      return vault_;
    }
  };
  for (prop in dict) {
    fn = dict[prop];
    proxy_.def(prop, fn);
  }
  return proxy_;
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


},{"./unify.coffee":3,"./State.coffee":6,"./utils.coffee":4,"vixen":5,"showdown":7}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
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
},{"__browserify_process":9}],9:[function(require,module,exports){
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


},{"events":8,"../lib/base64":10}],10:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2FwcC5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS91bmlmeS5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS91dGlscy5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L25vZGVfbW9kdWxlcy92aXhlbi9pbmRleC5qcyIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvY29mZmVlL21haW4uY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9ub2RlX21vZHVsZXMvc2hvd2Rvd24vc3JjL3Nob3dkb3duLmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL2V2ZW50cy5qcyIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9jb2ZmZWUvU3RhdGUuY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9saWIvYmFzZTY0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxDQUFRLE1BQVIsZUFBQTs7OztBQ0FBLElBQUEsTUFB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBLElBQUEsb0RBQUE7O0FBQUMsQ0FBRCxFQUFpQixJQUFBLENBQUEsSUFBakI7O0FBRUEsQ0FGQSxFQUVTLEdBQVQsQ0FBUyxRQUFBOztBQUdULENBTEEsRUFLQSxNQUFNO0NBQUcsS0FBQTtDQUFLLEVBQUwsQ0FBSSxLQUFKOztBQUNOLENBQUE7R0FBQSxPQUFvRCxvQkFBcEQ7Q0FBQSxDQUFtQixDQUFnQixDQUFaLEVBQUosWUFBQTtDQUFuQjs7Q0FBRCxDQUFBLEVBQUE7Q0FESTs7QUFHTixDQVJBLEVBUWMsTUFBQSxFQUFkO0NBQ0UsS0FBQSxRQUFBO0NBQUEsQ0FBQSxDQUFhLENBQW9CLENBQXBCLENBQU0sQ0FBTixDQUFlO1NBQzVCO0NBQUEsQ0FBRSxFQUFBO0NBQUYsQ0FBUSxFQUFBO0NBRkk7Q0FBQTs7QUFHZCxDQVhBLEVBV1ksQ0FBQSxLQUFaO0NBQTZCLEVBQWdCLENBQXZCLEVBQU0sRUFBUyxDQUFmO0NBQVY7O0FBRVosQ0FiQSxFQWFpQixFQUFBLENBQVgsQ0FBTixLQWJBOztBQWVBLENBZkEsRUFla0IsRUFBYixHQWZMLENBZUE7O0FBQ0EsQ0FoQkEsQ0FBQSxDQWdCZ0IsRUFBWCxFQUFMOztBQUVBLENBbEJBLEVBc0JFLEVBSkcsQ0FBTDtDQUlFLENBQUEsSUFBQTtDQUNFLENBQU8sQ0FBQSxDQUFQLENBQUEsR0FBTyxDQUFDO0NBQ0csR0FBa0IsRUFBWixFQUFmLENBQXVCLElBQXZCO0NBREYsSUFBTztDQUFQLENBRVMsQ0FBQSxDQUFULEdBQUEsQ0FBUyxDQUFDO0NBQ0MsQ0FBVyxFQUFQLENBQUosQ0FBaUIsRUFBMUIsS0FBQTtDQUhGLElBRVM7SUFIWDtDQUFBLENBS0EsVUFBQTtDQUNFLENBQU8sQ0FBQSxDQUFQLENBQUEsR0FBTyxDQUFDOztDQUNBLEVBQUEsS0FBTjtRQUFBO0NBQUEsQ0FDQSxFQUFvQyxFQUFwQyxDQUFBLEVBQWdDLEdBQWI7Q0FDVixDQUFULE1BQUEsS0FBQTtDQUhGLElBQU87Q0FBUCxDQUlTLENBQUEsQ0FBVCxHQUFBLENBQVMsQ0FBQztDQUNDLENBQVcsRUFBUCxDQUFKLENBQWlCLENBQU4sQ0FBcEIsSUFBdUMsQ0FBdkM7Q0FMRixJQUlTO0lBVlg7Q0F0QkYsQ0FBQTs7QUFtQ0EsQ0FuQ0EsQ0FtQzBCLENBQVosQ0FBQSxDQUFULEdBQVMsQ0FBQztDQUNiLENBQUEsRUFBK0IsS0FBL0I7Q0FBQSxFQUFrQixDQUFsQixDQUFLLElBQUw7SUFBQTtDQUNNLENBQTZDLENBQU0sQ0FBekQsQ0FBSyxDQUFRLENBQWIsRUFBQTtDQUNFLEVBQWdCLENBQWhCLENBQUssRUFBTDtDQUFBLEdBQ0EsS0FBQTtDQUFVLENBQUssRUFBTCxDQUFVLENBQVYsR0FBQTtDQUFBLENBQXNCLElBQUEsQ0FBdEI7Q0FEVixLQUNBO0NBRVUsRUFBVjtDQUpGLEVBQXlEO0NBRjdDOztBQVFkLENBM0NBLENBMkM0QixDQUFaLEVBQVgsRUFBTCxDQUFnQixDQUFDO0NBQ2YsR0FBQSxFQUFBO0NBQUEsQ0FBQSxFQUFPLGFBQVAsRUFBRztDQUNELENBQU8sRUFBUCxHQUFpQyxJQUFBO0lBRG5DO0NBRUEsQ0FBQSxFQUErQixLQUEvQjtDQUFBLEVBQWtCLENBQWxCLENBQUssSUFBTDtJQUZBO0NBQUEsQ0FHQSxDQUFnQixFQUFYLEVBQUw7Q0FDQSxDQUFBLEVBQUcsV0FBSDtDQUNRLENBQStDLENBQUEsQ0FBQSxDQUFoRCxDQUFRLENBQWIsRUFBYSxFQUFiO0NBQ1csR0FBVCxJQUFBLEtBQUE7Q0FERixJQUFxRDtJQU56QztDQUFBOztBQVNoQixDQXBEQSxDQW9Ec0MsQ0FBQSxHQUFoQyxHQUFnQyxHQUF0QyxJQUFBO0NBQ0UsS0FBQSxrQkFBQTtDQUFBLENBQUEsRUFBQSxHQUFpQyxJQUFBO0NBQ2pDLENBQUEsRUFBRyxDQUFlLEVBQW1CLEVBQWxDO0NBQ0ssQ0FBbUIsQ0FBUyxDQUFBLENBQTdCLEVBQUwsRUFBQSxFQUFBO0NBQ1EsQ0FBZ0IsRUFBdEIsQ0FBSyxJQUFMLElBQUE7Q0FERixJQUFrQztJQUhBO0NBQUE7Ozs7QUNwRHRDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZSgnLi9jb2ZmZWUvbWFpbi5jb2ZmZWUnKSgpXG4iLCJtYXAgPVxyXG4gICc8PSc6ICfih5AnICMgJ1xcdTIxZDAnXHJcbiAgJz0+JzogJ+KHkicgIyAnXFx1MjFkMidcclxuICAnPD0+JzogJ+KHlCcgIyAnXFx1MjFkNCdcclxuICAnPC0nOiAn4oaQJyAjICdcXHUyMTkwJ1xyXG4gICctPic6ICfihpInICMgJ1xcdTIxOTInXHJcbiAgJzwtPic6ICfihpQnICMgJ1xcdTIxOTQnXHJcbiAgJy4uLic6ICfigKYnXHJcbiAgJy0tJzogJ+KAkydcclxuICAnLS0tJzogJ+KAlCdcclxuICAnXjEnOiAnwrknXHJcbiAgJ14yJzogJ8KyJ1xyXG4gICdeMyc6ICfCsydcclxuICAnMS8yJzogJ8K9J1xyXG4gICcxLzQnOiAnwrwnXHJcbiAgJzMvNCc6ICfCvidcclxuXHJcbnVuaWZ5ID0gKGNtKSAtPlxyXG4gIHBvcyA9IGNtLmdldEN1cnNvcigpXHJcbiAgbSA9IC9bXlxcc10rJC8uZXhlYyBjbS5nZXRSYW5nZSB7bGluZTpwb3MubGluZSwgY2g6MH0sIHBvc1xyXG4gIHRva2VuID0gbT9bMF1cclxuICBpZiB0b2tlbj8gYW5kIG1hcFt0b2tlbl0/XHJcbiAgICBjbS5yZXBsYWNlUmFuZ2UgbWFwW3Rva2VuXSwge2xpbmU6cG9zLmxpbmUsIGNoOnBvcy5jaC10b2tlbi5sZW5ndGh9LCBwb3NcclxuXHJcbkNvZGVNaXJyb3IuY29tbWFuZHNbJ3VuaWZ5J10gPSB1bmlmeVxyXG5Db2RlTWlycm9yLmtleU1hcC5kZWZhdWx0WydDdHJsLVNwYWNlJ10gPSAndW5pZnknXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gXG4gIGdldEN1cnNvclBvc2l0aW9uOiAoZWwpIC0+XG4gICAgcG9zID0gMFxuICAgICMgSUUgU3VwcG9ydFxuICAgIGlmIGRvY3VtZW50LnNlbGVjdGlvblxuICAgICAgZWwuZm9jdXMoKVxuICAgICAgU2VsID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKClcbiAgICAgIFNlbExlbmd0aCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpLnRleHQubGVuZ3RoXG4gICAgICBTZWwubW92ZVN0YXJ0ICdjaGFyYWN0ZXInLCAtZWwudmFsdWUubGVuZ3RoXG4gICAgICBwb3MgPSBTZWwudGV4dC5sZW5ndGggLSBTZWxMZW5ndGhcbiAgICAjIEZpcmVmb3ggc3VwcG9ydFxuICAgIGVsc2UgaWYgZWwuc2VsZWN0aW9uU3RhcnQgb3IgZWwuc2VsZWN0aW9uU3RhcnQgaXMgMFxuICAgICAgcG9zID0gZWwuc2VsZWN0aW9uU3RhcnRcbiAgICBwb3NcblxuICBudW1iZXI6IChlbCkgLT5cbiAgICBzZWxlY3RvciA9ICdIMSxIMixIMyxINCxINSxINicgIyArICcsT0wsVUwsTEknXG4gICAgZWxlbXMgPSBbXVxuICAgIG9yZGVyID0gc2VsZWN0b3Iuc3BsaXQoJywnKVxuICAgIG1hcCA9IHt9XG4gICAgbWFwW3NlbF0gPSB7YzowLCBwb3M6aX0gZm9yIHNlbCwgaSBpbiBvcmRlclxuICAgIG51bSA9ICh0YWcpIC0+XG4gICAgICAoYyBmb3IgaSBpbiBbMC4ubWFwW3RhZ10ucG9zXVxcXG4gICAgICAgd2hlbiAoYz1tYXBbKHQ9b3JkZXJbaV0pXS5jKSBpc250IDBcXFxuICAgICAgIGFuZCB0IG5vdCBpbiBbJ09MJywgJ1VMJ10pLmpvaW4gJywnXG4gICAgY291bnQgPSAoc2VsKSAtPlxuICAgICAgZSA9IG1hcFtzZWxdXG4gICAgICBlLmMrK1xuICAgICAgKG1hcFtvcmRlcltpXV0uYyA9IDAgZm9yIGkgaW4gW2UucG9zKzEuLi5vcmRlci5sZW5ndGhdKVxuICAgIHJlc2V0ID0gKGNsZWFyKSAtPlxuICAgICAgZWxlbXMgPSBbXSBpZiBjbGVhclxuICAgICAgb2JqLmMgPSAwIGZvciBzZWwsb2JqIG9mIG1hcFxuICAgIGZvciBoLCBpIGluIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW51bWJlci1yZXNldF0sW2RhdGEtbnVtYmVyLWNsZWFyXSwnK3NlbGVjdG9yKVxuICAgICAgaWYgaC5oYXNBdHRyaWJ1dGUgJ2RhdGEtbnVtYmVyLXJlc2V0J1xuICAgICAgICByZXNldCgpXG4gICAgICBlbHNlIGlmIGguaGFzQXR0cmlidXRlICdkYXRhLW51bWJlci1jbGVhcidcbiAgICAgICAgcmVzZXQgdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICB0ID0gaC50YWdOYW1lXG4gICAgICAgIGNvdW50IHRcbiAgICAgICAgZWxlbXMucHVzaCBbaCwgbnVtIHRdIGlmIHQgbm90IGluIFsnT0wnLCAnVUwnXVxuICAgIGguc2V0QXR0cmlidXRlICdkYXRhLW51bWJlcicsIG4gZm9yIFtoLCBuXSBpbiBlbGVtc1xuICAgIGVsXG5cbiAgaW5kZXg6IChlbCkgLT5cbiAgICBmb3IgZSBpbiBlbC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1udW1iZXJdJylcbiAgICAgIGUuaW5uZXJIVE1MID0gXCJcIlwiXG4gICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICN7ZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbnVtYmVyJykuc3BsaXQoJywnKS5qb2luKCcuICcpfS5cbiAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgXCJcIlwiICsgZS5pbm5lckhUTUxcbiAgICBlbFxuXG4gIHRvYzogKGVsKSAtPlxuICAgICc8dWw+JyArIChmb3IgZSBpbiBlbC5xdWVyeVNlbGVjdG9yQWxsKCdIMSxIMixIMyxINCxINSxINicpXG4gICAgICBcIlwiXCJcbiAgICAgIDxsaT48YSBocmVmPVwiIyN7ZS5pZH1cIj48I3tlLnRhZ05hbWV9PlxuICAgICAgI3tlLmlubmVySFRNTH1cbiAgICAgIDwvI3tlLnRhZ05hbWV9PjwvYT48L2xpPlxuICAgICAgXCJcIlwiXG4gICAgKS5qb2luKCcnKSArICc8L3VsPidcbiIsIiFmdW5jdGlvbihvYmopIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKVxuICAgIG1vZHVsZS5leHBvcnRzID0gb2JqO1xuICBlbHNlXG4gICAgd2luZG93LnZpeGVuID0gb2JqO1xufShmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdHJpbShzdHIpIHtyZXR1cm4gU3RyaW5nLnByb3RvdHlwZS50cmltLmNhbGwoc3RyKTt9O1xuXG4gIGZ1bmN0aW9uIHJlc29sdmVQcm9wKG9iaiwgbmFtZSkge1xuICAgIHJldHVybiBuYW1lLnRyaW0oKS5zcGxpdCgnLicpLnJlZHVjZShmdW5jdGlvbiAocCwgcHJvcCkge1xuICAgICAgcmV0dXJuIHAgPyBwW3Byb3BdIDogdW5kZWZpbmVkO1xuICAgIH0sIG9iaik7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlQ2hhaW4ob2JqLCBjaGFpbikge1xuICAgIHZhciBwcm9wID0gY2hhaW4uc2hpZnQoKTtcbiAgICByZXR1cm4gY2hhaW4ucmVkdWNlKGZ1bmN0aW9uIChwLCBwcm9wKSB7XG4gICAgICB2YXIgZiA9IHJlc29sdmVQcm9wKG9iaiwgcHJvcCk7XG4gICAgICByZXR1cm4gZiA/IGYocCkgOiBwO1xuICAgIH0sIHJlc29sdmVQcm9wKG9iaiwgcHJvcCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gYnVja2V0KGIsIGssIHYpIHtcbiAgICBpZiAoIShrIGluIGIpKSBiW2tdID0gW107XG4gICAgaWYgKCEodiBpbiBiW2tdKSkgYltrXS5wdXNoKHYpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0ZW5kKG9yaWcsIG9iaikge1xuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBvcmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgIH0pO1xuICAgIHJldHVybiBvcmlnO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhdmVyc2VFbGVtZW50cyhlbCwgY2FsbGJhY2spIHtcbiAgICB2YXIgaTtcbiAgICBpZiAoY2FsbGJhY2soZWwpICE9PSBmYWxzZSkge1xuICAgICAgZm9yKGkgPSBlbC5jaGlsZHJlbi5sZW5ndGg7IGktLTspIChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB0cmF2ZXJzZUVsZW1lbnRzKG5vZGUsIGNhbGxiYWNrKTtcbiAgICAgIH0pKGVsLmNoaWxkcmVuW2ldKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVQcm94eShtYXBzLCBwcm94eSkge1xuICAgIHByb3h5ID0gcHJveHkgfHwge307XG4gICAgcHJveHkuZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgdG9SZW5kZXIgPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgIG1hcHMub3JpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgaWYgKG1hcHMuYmluZHNbcHJvcF0pIG1hcHMuYmluZHNbcHJvcF0uZm9yRWFjaChmdW5jdGlvbihyZW5kZXJJZCkge1xuICAgICAgICAgIGlmIChyZW5kZXJJZCA+PSAwKSB0b1JlbmRlcltyZW5kZXJJZF0gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgZm9yIChyZW5kZXJJZCBpbiB0b1JlbmRlcikgbWFwcy5yZW5kZXJzW3JlbmRlcklkXShtYXBzLm9yaWcpO1xuICAgICAgcmV0dXJuIHByb3h5O1xuICAgIH07XG5cbiAgICBPYmplY3Qua2V5cyhtYXBzLmJpbmRzKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIHZhciBpZHMgPSBtYXBzLmJpbmRzW3Byb3BdO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3h5LCBwcm9wLCB7XG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBtYXBzLm9yaWdbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICBpZHMuZm9yRWFjaChmdW5jdGlvbihyZW5kZXJJZCkge1xuICAgICAgICAgICAgaWYgKHJlbmRlcklkID49IDApIG1hcHMucmVuZGVyc1tyZW5kZXJJZF0obWFwcy5vcmlnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAobWFwcy5yZWJpbmRzW3Byb3BdKVxuICAgICAgICAgICAgcmV0dXJuIG1hcHMucmViaW5kc1twcm9wXSgpO1xuICAgICAgICAgIHJldHVybiBtYXBzLm9yaWdbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBwcm94eTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihlbCwgbW9kZWwpIHtcbiAgICB2YXIgcGF0dGVybiA9IC9cXHtcXHsuKz9cXH1cXH0vZyxcbiAgICAgICAgcGlwZSA9ICd8JztcblxuICAgIGZ1bmN0aW9uIHJlc29sdmUob3JpZywgcHJvcCkge1xuICAgICAgaWYgKCFvcmlnKSByZXR1cm4gJyc7XG4gICAgICB2YXIgdmFsID0gcmVzb2x2ZUNoYWluKG9yaWcsIHByb3Auc2xpY2UoMiwtMikuc3BsaXQocGlwZSkpO1xuICAgICAgcmV0dXJuIHZhbCA9PT0gdW5kZWZpbmVkID8gJycgOiB2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyVG1wbChzdHIsIG9yaWcpIHtcbiAgICAgIHJldHVybiBzdHIucmVwbGFjZShwYXR0ZXJuLCByZXNvbHZlLmJpbmQodW5kZWZpbmVkLCBvcmlnKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2goc3RyKSB7XG4gICAgICB2YXIgbSA9IHN0ci5tYXRjaChwYXR0ZXJuKTtcbiAgICAgIGlmIChtKSByZXR1cm4gbS5tYXAoZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgcmV0dXJuIGNoYWluLnNsaWNlKDIsIC0yKS5zcGxpdChwaXBlKS5tYXAodHJpbSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cmF2ZXJzZShlbCwgb3JpZykge1xuICAgICAgdmFyIGJpbmRzID0ge30sXG4gICAgICAgICAgcmViaW5kcyA9IHt9LFxuICAgICAgICAgIHJlbmRlcnMgPSB7fSxcbiAgICAgICAgICBjb3VudCA9IDA7XG4gICAgICBvcmlnID0gb3JpZyB8fCB7fTtcblxuICAgICAgZnVuY3Rpb24gYmluZFJlbmRlcnMoY2hhaW5zLCByZW5kZXJJZCkge1xuICAgICAgICAvLyBDcmVhdGUgcHJvcGVydHkgdG8gcmVuZGVyIG1hcHBpbmdcbiAgICAgICAgY2hhaW5zLmZvckVhY2goZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgICAvLyBUT0RPOiBSZWdpc3RlciBjaGFpbmluZyBmdW5jdGlvbnMgYXMgYmluZHMgYXMgd2VsbC5cbiAgICAgICAgICBidWNrZXQoYmluZHMsIGNoYWluWzBdLnNwbGl0KCcuJylbMF0sIHJlbmRlcklkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHBhcnNlSXRlcmF0b3IoZWwpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgcHJlZml4ID0gJycsIG5vZGVzID0gW107XG4gICAgICAgIGlmIChwYXJlbnRfID0gKGVsLnBhcmVudEVsZW1lbnQgfHwgZWwucGFyZW50Tm9kZSkpIHtcbiAgICAgICAgICBpZiAoZWwudGFnTmFtZSA9PT0gJ0ZPUicpIHtcbiAgICAgICAgICAgIG1hcmtlciA9IGVsLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgICAgICAgcGFyZW50Xy5yZXBsYWNlQ2hpbGQobWFya2VyLCBlbCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaW4nKSkge1xuICAgICAgICAgICAgcHJlZml4ID0gJ2RhdGEtJztcbiAgICAgICAgICAgIHBhcmVudF8gPSBlbDtcbiAgICAgICAgICAgIG5vZGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWwuY2hpbGROb2Rlcyk7XG4gICAgICAgICAgICBtYXJrZXIgPSBlbC5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgICAgIHBhcmVudF8uYXBwZW5kQ2hpbGQobWFya2VyKTtcbiAgICAgICAgICB9IGVsc2UgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhbGlhczogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsndmFsdWUnKSxcbiAgICAgICAgICAgIGtleTogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsna2V5JyksXG4gICAgICAgICAgICBwcm9wOiBlbC5nZXRBdHRyaWJ1dGUocHJlZml4KydpbicpLFxuICAgICAgICAgICAgZWFjaDogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsnZWFjaCcpLFxuICAgICAgICAgICAgbm9kZXM6IG5vZGVzLFxuICAgICAgICAgICAgcGFyZW50OiBwYXJlbnRfLFxuICAgICAgICAgICAgbWFya2VyOiBtYXJrZXJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1hcEF0dHJpYnV0ZShvd25lciwgYXR0cikge1xuICAgICAgICB2YXIgbmFtZSwgZXZlbnRJZCwgcmVuZGVySWQsIHN0ciwgbm9UbXBsO1xuICAgICAgICBpZiAoKHN0ciA9IGF0dHIudmFsdWUpICYmIChjaGFpbnMgPSBtYXRjaChzdHIpKSkge1xuICAgICAgICAgIG5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgICAgaWYgKG5hbWUuaW5kZXhPZigndngtJykgPT09IDApIHtcbiAgICAgICAgICAgIG93bmVyLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignb24nKSA9PT0gMCkge1xuICAgICAgICAgICAgcmVuZGVySWQgPSAtMTsgLy8gTm8gcmVuZGVyZXJcbiAgICAgICAgICAgIGV2ZW50TmFtZSA9IG5hbWUuc3Vic3RyKDIpO1xuICAgICAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyc1xuICAgICAgICAgICAgY2hhaW5zLmZvckVhY2goZnVuY3Rpb24oY2hhaW4pIHtcbiAgICAgICAgICAgICAgb3duZXIuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlUHJvcChvcmlnLCBjaGFpblswXSkoZXZ0LCBvd25lci52YWx1ZSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBvd25lci5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vVG1wbCA9IGNoYWlucy5sZW5ndGggPT09IDEgJiYgc3RyLnN1YnN0cigwLDEpID09PSAneycgJiZcbiAgICAgICAgICAgICAgc3RyLnN1YnN0cigtMSkgPT09ICd9JztcbiAgICAgICAgICAgIC8vIENyZWF0ZSByZW5kZXJpbmcgZnVuY3Rpb24gZm9yIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgIHJlbmRlcklkID0gY291bnQrKztcbiAgICAgICAgICAgIChyZW5kZXJzW3JlbmRlcklkXSA9IGZ1bmN0aW9uKG9yaWcsIGNsZWFyKSB7XG4gICAgICAgICAgICAgIHZhciB2YWwgPSBub1RtcGwgPyByZXNvbHZlKG9yaWcsIHN0cikgOiBzdHJUbXBsKHN0ciwgb3JpZyk7XG4gICAgICAgICAgICAgICFjbGVhciAmJiBuYW1lIGluIG93bmVyID8gb3duZXJbbmFtZV0gPSB2YWwgOlxuICAgICAgICAgICAgICAgIG93bmVyLnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuICAgICAgICAgICAgfSkob3JpZywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBCaS1kaXJlY3Rpb25hbCBjb3VwbGluZy5cbiAgICAgICAgICAgIGlmIChub1RtcGwpIHJlYmluZHNbY2hhaW5zWzBdWzBdXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEdldHRpbmcgZi5leC4gJ3ZhbHVlJyBhdHRyaWJ1dGUgZnJvbSBhbiBpbnB1dFxuICAgICAgICAgICAgICAgIC8vIGRvZXNuJ3QgcmV0dXJuIHVzZXIgaW5wdXQgdmFsdWUgc28gYWNjZXNzaW5nIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAvLyBvYmplY3QgcHJvcGVydGllcyBkaXJlY3RseSwgZmluZCBvdXQgaG93IHRvIGRvIHRoaXNcbiAgICAgICAgICAgICAgICAvLyBtb3JlIHNlY3VyZWx5LlxuICAgICAgICAgICAgICAgIHJldHVybiBuYW1lIGluIG93bmVyID9cbiAgICAgICAgICAgICAgICAgIG93bmVyW25hbWVdIDogb3duZXIuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBiaW5kUmVuZGVycyhjaGFpbnMsIHJlbmRlcklkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYXBUZXh0Tm9kZXMoZWwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IGVsLmNoaWxkTm9kZXMubGVuZ3RoOyBpLS07KSAoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIHZhciBzdHIsIHJlbmRlcklkLCBjaGFpbnM7XG4gICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IGVsLlRFWFRfTk9ERSAmJiAoc3RyID0gbm9kZS5ub2RlVmFsdWUpICYmXG4gICAgICAgICAgICAgIChjaGFpbnMgPSBtYXRjaChzdHIpKSkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBmb3IgZWxlbWVudCB0ZXh0IG5vZGUuXG4gICAgICAgICAgICByZW5kZXJJZCA9IGNvdW50Kys7XG4gICAgICAgICAgICAocmVuZGVyc1tyZW5kZXJJZF0gPSBmdW5jdGlvbihvcmlnKSB7XG4gICAgICAgICAgICAgIG5vZGUubm9kZVZhbHVlID0gc3RyVG1wbChzdHIsIG9yaWcpO1xuICAgICAgICAgICAgfSkob3JpZyk7XG4gICAgICAgICAgICBiaW5kUmVuZGVycyhjaGFpbnMsIHJlbmRlcklkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKGVsLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgbm8tdHJhdmVyc2UgYXR0cmlidXRlIGlmIHJvb3Qgbm9kZVxuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXN1YnZpZXcnKTtcblxuICAgICAgdHJhdmVyc2VFbGVtZW50cyhlbCwgZnVuY3Rpb24oZWxfKSB7XG4gICAgICAgIHZhciBpLCBpdGVyLCB0ZW1wbGF0ZSwgbm9kZXMsIHJlbmRlcklkO1xuXG4gICAgICAgIC8vIFN0b3AgaGFuZGxpbmcgYW5kIHJlY3Vyc2lvbiBpZiBzdWJ2aWV3LlxuICAgICAgICBpZiAoZWxfLmdldEF0dHJpYnV0ZSgnZGF0YS1zdWJ2aWV3JykgIT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoaXRlciA9IHBhcnNlSXRlcmF0b3IoZWxfKSkge1xuICAgICAgICAgIG5vZGVzID0gaXRlci5ub2RlcztcbiAgICAgICAgICB0ZW1wbGF0ZSA9IGVsXy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgbWFwcyA9IHRyYXZlcnNlKHRlbXBsYXRlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgICAgcmVuZGVySWQgPSBjb3VudCsrO1xuICAgICAgICAgIChyZW5kZXJzW3JlbmRlcklkXSA9IGZ1bmN0aW9uKG9yaWcpIHtcbiAgICAgICAgICAgIHZhciBsaXN0ID0gcmVzb2x2ZVByb3Aob3JpZywgaXRlci5wcm9wKSxcbiAgICAgICAgICAgICAgICBlYWNoXyA9IGl0ZXIuZWFjaCAmJiByZXNvbHZlUHJvcChvcmlnLCBpdGVyLmVhY2gpLCBpO1xuICAgICAgICAgICAgZm9yIChpID0gbm9kZXMubGVuZ3RoOyBpLS07KSBpdGVyLnBhcmVudC5yZW1vdmVDaGlsZChub2Rlc1tpXSk7XG4gICAgICAgICAgICBub2RlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChpIGluIGxpc3QpIGlmIChsaXN0Lmhhc093blByb3BlcnR5KGkpKVxuICAgICAgICAgICAgICAoZnVuY3Rpb24odmFsdWUsIGkpe1xuICAgICAgICAgICAgICAgIHZhciBvcmlnXyA9IGV4dGVuZCh7fSwgb3JpZyksXG4gICAgICAgICAgICAgICAgICAgIGNsb25lID0gdGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpLFxuICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGl0ZXIubWFya2VyLFxuICAgICAgICAgICAgICAgICAgICBtYXBzLCByZW5kZXJJZCwgaV8sIG5vZGUsIG5vZGVzXyA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChpdGVyLmtleSkgb3JpZ19baXRlci5rZXldID0gaTtcbiAgICAgICAgICAgICAgICBvcmlnX1tpdGVyLmFsaWFzXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIG1hcHMgPSB0cmF2ZXJzZShjbG9uZSwgb3JpZ18pO1xuICAgICAgICAgICAgICAgIGZvciAoaV8gPSBjbG9uZS5jaGlsZE5vZGVzLmxlbmd0aDsgaV8tLTsgbGFzdE5vZGUgPSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICBub2Rlc18ucHVzaChub2RlID0gY2xvbmUuY2hpbGROb2Rlc1tpX10pO1xuICAgICAgICAgICAgICAgICAgaXRlci5wYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIGxhc3ROb2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVhY2hfICYmIGVhY2hfKHZhbHVlLCBpLCBvcmlnXywgbm9kZXNfLmZpbHRlcihmdW5jdGlvbihuKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbi5ub2RlVHlwZSA9PT0gZWxfLkVMRU1FTlRfTk9ERTtcbiAgICAgICAgICAgICAgICB9KSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgZm9yIChpXyA9IG5vZGVzXy5sZW5ndGg7IGlfLS07KVxuICAgICAgICAgICAgICAgICAgICBpdGVyLnBhcmVudC5yZW1vdmVDaGlsZChub2Rlc19baV9dKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbm9kZXMgPSBub2Rlcy5jb25jYXQobm9kZXNfKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKGxpc3RbaV0sIGkpO1xuICAgICAgICAgIH0pKG9yaWcpO1xuICAgICAgICAgIGJ1Y2tldChiaW5kcywgaXRlci5wcm9wLnNwbGl0KCcuJylbMF0sIHJlbmRlcklkKTtcbiAgICAgICAgICBmb3IgKHAgaW4gbWFwcy5iaW5kcykgaWYgKGl0ZXIuYWxpYXMuaW5kZXhPZihwKSA9PT0gLTEpXG4gICAgICAgICAgICBidWNrZXQoYmluZHMsIHAsIHJlbmRlcklkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBCaW5kIG5vZGUgdGV4dC5cbiAgICAgICAgICBtYXBUZXh0Tm9kZXMoZWxfKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBCaW5kIG5vZGUgYXR0cmlidXRlcyBpZiBub3QgYSA8Zm9yPi5cbiAgICAgICAgaWYgKGVsXy50YWdOYW1lICE9PSAnRk9SJykgZm9yIChpID0gZWxfLmF0dHJpYnV0ZXMubGVuZ3RoOyBpLS07KVxuICAgICAgICAgIG1hcEF0dHJpYnV0ZShlbF8sIGVsXy5hdHRyaWJ1dGVzW2ldKTtcbiAgICAgICAgLy8gU3RvcCByZWN1cnNpb24gaWYgaXRlcmF0b3IuXG4gICAgICAgIHJldHVybiAhaXRlcjtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHtvcmlnOm9yaWcsIGJpbmRzOmJpbmRzLCByZWJpbmRzOnJlYmluZHMsIHJlbmRlcnM6cmVuZGVyc307XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVQcm94eSh0cmF2ZXJzZShlbCwgbW9kZWwgJiYgZXh0ZW5kKHt9LCBtb2RlbCkpLCBtb2RlbCk7XG4gIH07XG59KCkpO1xuIiwidml4ZW4gPSByZXF1aXJlICd2aXhlbidcblNob3dkb3duID0gcmVxdWlyZSAnc2hvd2Rvd24nXG5tYXJrZG93biA9IG5ldyBTaG93ZG93bi5jb252ZXJ0ZXIoKVxuXG5yZXF1aXJlICcuL3VuaWZ5LmNvZmZlZSdcbnsgU3RhdGUsIHN0YXRlOnN0YXRlXyB9ID0gcmVxdWlyZSAnLi9TdGF0ZS5jb2ZmZWUnXG4jIHJlcXVpcmUgJy4vc3RhdGUtZ2lzdC5jb2ZmZWUnXG5cbntudW1iZXIsIGluZGV4LCB0b2N9ID0gcmVxdWlyZSAnLi91dGlscy5jb2ZmZWUnXG5cbmV4dGVuZCA9IChyPXt9LCBkKSAtPiByW2tdID0gdiBmb3IgaywgdiBvZiBkOyByXG5cbnByb3h5ID0gKGRpY3QpIC0+XG4gIHZhdWx0XyA9IHt9XG4gIHByb3h5XyA9XG4gICAgZGVmOiAocHJvcCwgY2FsbGJhY2spIC0+XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkgcHJveHlfLCBwcm9wLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICAgIHNldDogKHZhbHVlKSAtPlxuICAgICAgICAgIG9sZCA9IHZhdWx0X1twcm9wXVxuICAgICAgICAgIHZhdWx0X1twcm9wXSA9IHZhbHVlXG4gICAgICAgICAgY2FsbGJhY2sgdmFsdWUsIG9sZFxuICAgICAgICBnZXQ6IC0+IHZhdWx0X1twcm9wXVxuICAgIHRvSlNPTjogLT4gdmF1bHRfXG4gIHByb3h5Xy5kZWYgcHJvcCwgZm4gZm9yIHByb3AsIGZuIG9mIGRpY3RcbiAgcHJveHlfXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgdXBkYXRlVG9jID0gLT4gdG9jRWwuaW5uZXJIVE1MID0gdG9jIHZpZXdFbFxuICB1cGRhdGVJbmRleCA9IC0+IGluZGV4IG51bWJlciB2aWV3RWxcbiAgc2V0TW9kZSA9IChtb2RlKSAtPlxuICAgIG1vZGVsLm1vZGUgPSB7XG4gICAgICB3cml0ZTogJ2Z1bGwtaW5wdXQnXG4gICAgICByZWFkOiAnZnVsbC12aWV3J1xuICAgIH1bbW9kZV0gb3IgJydcbiAgc2V0VG9jID0gKHRvKSAtPlxuICAgIHVwZGF0ZVRvYygpIGlmIHRvXG4gICAgbW9kZWwuc2hvd1RvYyA9IGlmIHRvIHRoZW4gJ3RvYycgZWxzZSAnJ1xuICBzZXRJbmRleCA9ICh0bykgLT5cbiAgICBpZiB0b1xuICAgICAgaWYgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3ZpZXcgW2RhdGEtbnVtYmVyXScpLmxlbmd0aCBpcyAwXG4gICAgICAgIHVwZGF0ZUluZGV4KClcbiAgICAgICAgdXBkYXRlVG9jKCkgaWYgc3RhdGUudG9jXG4gICAgICBtb2RlbC5zaG93SW5kZXggPSAnaW5kZXhlZCdcbiAgICBlbHNlXG4gICAgICBtb2RlbC5zaG93SW5kZXggPSAnJ1xuXG4gIHN0YXRlID0gcHJveHlcbiAgICB0b2M6IHNldFRvY1xuICAgIGluZGV4OiBzZXRJbmRleFxuICAgIG1vZGU6IHNldE1vZGVcbiAgI3N0YXRlLm9uICdjaGFuZ2UnLCAtPiB1cGRhdGVTdGF0dXMgeWVzXG5cbiAgdG9jRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG9jJ1xuICB2aWV3RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndmlldydcbiAgdmlld1dyYXBFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd2aWV3LXdyYXAnXG5cbiAgZG9jVGl0bGUgPSAtPlxuICAgIHRtcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgICB0bXAuaW5uZXJIVE1MID0gaWYgKGggPSB2aWV3RWwucXVlcnlTZWxlY3RvckFsbCgnaDEsaDIsaDMnKVswXSlcbiAgICAgIGguaW5uZXJIVE1MXG4gICAgZWxzZVxuICAgICAgJ1VudGl0bGVkJ1xuICAgIFtdLmZvckVhY2guY2FsbCB0bXAucXVlcnlTZWxlY3RvckFsbCgnLmluZGV4JyksIChlbCkgLT4gdG1wLnJlbW92ZUNoaWxkIGVsXG4gICAgdG1wLnRleHRDb250ZW50XG5cbiAgc2F2ZWQgPSB5ZXNcblxuICB1cGRhdGVTdGF0dXMgPSAoZm9yY2UpIC0+XG4gICAgaWYgbm90IHNhdmVkIG9yIGZvcmNlXG4gICAgICBzdGF0ZV8uc3RvcmUgbnVsbCwgdGV4dDplZGl0b3IuZ2V0VmFsdWUoKSwgc3RhdGU6c3RhdGVcbiAgICAgICNzdGF0ZS5nZW5lcmF0ZUhhc2ggJ2Jhc2U2NCcsIGVkaXRvci5nZXRWYWx1ZSgpLCAoaGFzaCkgLT5cbiAgICAgICMgIGxvY2F0aW9uLmhhc2ggPSBoYXNoXG4gICAgICBkb2N1bWVudC50aXRsZSA9IGRvY1RpdGxlKClcbiAgICAgIHNhdmVkID0geWVzXG5cbiAgY3Vyc29yVG9rZW4gPSAnXl5eY3Vyc29yXl5eJ1xuICB1cGRhdGVWaWV3ID0gLT5cbiAgICBjbGluZSA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lXG4gICAgbWQgPSBlZGl0b3IuZ2V0VmFsdWUoKS5zcGxpdCAnXFxuJ1xuICAgIG1kW2NsaW5lXSArPSBjdXJzb3JUb2tlblxuICAgIG1kID0gbWQuam9pbiAnXFxuJ1xuICAgIHYgPSB2aWV3RWxcbiAgICB2LmlubmVySFRNTCA9IG1hcmtkb3duLm1ha2VIdG1sKG1kKS5yZXBsYWNlKGN1cnNvclRva2VuLCAnPHNwYW4gaWQ9XCJjdXJzb3JcIj48L3NwYW4+JylcbiAgICB1cGRhdGVJbmRleCgpIGlmIHN0YXRlLmluZGV4XG4gICAgdXBkYXRlVG9jKCkgaWYgc3RhdGUudG9jXG4gICAgc2Nyb2xsVG9wID0gdmlld1dyYXBFbC5zY3JvbGxUb3BcbiAgICB2aWV3SGVpZ2h0ID0gdmlld1dyYXBFbC5vZmZzZXRIZWlnaHRcbiAgICBjdXJzb3JTcGFuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2N1cnNvcidcbiAgICBjdXJzb3JUb3AgPSBjdXJzb3JTcGFuLm9mZnNldFRvcFxuICAgIGN1cnNvckhlaWdodCA9IGN1cnNvclNwYW4ub2Zmc2V0SGVpZ2h0XG4gICAgaWYgY3Vyc29yVG9wIDwgc2Nyb2xsVG9wIG9yIGN1cnNvclRvcCA+IHNjcm9sbFRvcCArIHZpZXdIZWlnaHQgLSBjdXJzb3JIZWlnaHRcbiAgICAgIHZpZXdXcmFwRWwuc2Nyb2xsVG9wID0gY3Vyc29yVG9wIC0gdmlld0hlaWdodC8yXG5cbiAgc2F2ZVRpbWVyID0gbnVsbFxuICBlZGl0b3IgPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtbWQnKSxcbiAgICBtb2RlOiAnZ2ZtJ1xuICAgIHRoZW1lOiAnZGVmYXVsdCdcbiAgICBsaW5lTnVtYmVyczogbm9cbiAgICBsaW5lV3JhcHBpbmc6IHllc1xuICAgIG9uQ2hhbmdlOiAtPlxuICAgICAgdXBkYXRlVmlldygpXG4gICAgICBzYXZlZCA9IG5vXG4gICAgICBjbGVhclRpbWVvdXQgc2F2ZVRpbWVyXG4gICAgICBzYXZlVGltZXIgPSBzZXRUaW1lb3V0IHVwZGF0ZVN0YXR1cywgNTAwMFxuICAgIG9uRHJhZ0V2ZW50OiAoZWRpdG9yLCBldmVudCkgLT5cbiAgICAgIHNob3dEbmQgPSBubyBpZiBzaG93RG5kIG9yIGV2ZW50LnR5cGUgaXMgJ2Ryb3AnXG4gICAgICBmYWxzZVxuXG4gIHNldFN0YXRlID0gKGRhdGEpIC0+XG4gICAgeyB0ZXh0LCBzdGF0ZTpzdGF0ZV9fIH0gPSBkYXRhXG4gICAgZXh0ZW5kIHN0YXRlLCBzdGF0ZV9fIG9yIHt9XG4gICAgZWRpdG9yLnNldFZhbHVlIHRleHQgaWYgdGV4dD8gYW5kIHRleHQgaXNudCBlZGl0b3IuZ2V0VmFsdWUoKVxuICAgICNzZXRNb2RlIHN0YXRlLm1vZGVcbiAgICAjc2V0SW5kZXggc3RhdGUuaW5kZXhcbiAgICAjc2V0VG9jIHN0YXRlLnRvY1xuICAgIG1vZGVsLnRoZW1lID0gc3RhdGUudGhlbWUgb3IgJ3NlcmlmJ1xuXG4gICN3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAnaGFzaGNoYW5nZScsIHNldFN0YXRlXG5cbiAgbW9kZWwgPVxuICAgIHNob3c6ICh2KSAtPiBpZiB2IHRoZW4gJycgZWxzZSAnaGlkZSdcbiAgICBoaWRlOiAodikgLT4gaWYgdiB0aGVuICdoaWRlJyBlbHNlICcnXG4gICAgc2hvd0Rvd25sb2FkOiBCbG9iP1xuICAgIGRvd25sb2FkOiAtPlxuICAgICAgc2F2ZUFzIG5ldyBCbG9iKFtlZGl0b3IuZ2V0VmFsdWUoKV0sIHR5cGU6ICd0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgnKSxcbiAgICAgICAgZG9jVGl0bGUoKSsnLm1kJ1xuICAgIGxpbmtCNjQ6IC0+XG4gICAgICB1cGRhdGVTdGF0dXMoKVxuICAgICAgcHJvbXB0ICdDb3B5IHRoaXMnLCBsb2NhdGlvbi5ocmVmXG4gICAgICAjbW9kZWwubGlua0NvcHkgPSBsb2NhdGlvbi5ocmVmXG4gICAgICAjbW9kZWwuc2hvd0xpbmtDb3B5ID0gdHJ1ZVxuICAgICAgIy5mb2N1cygpXG4gICAgICAjLmJsdXIgLT4gJChAKS5hZGRDbGFzcygnaGlkZGVuJylcbiAgICBwcmludDogLT4gd2luZG93LnByaW50KClcbiAgICBtb2RlOiAnJ1xuICAgIHRvZ2dsZVRvYzogLT4gc3RhdGUudG9jID0gbm90IHN0YXRlLnRvY1xuICAgIHRvZ2dsZUluZGV4OiAtPiBzdGF0ZS5pbmRleCA9IG5vdCBzdGF0ZS5pbmRleFxuICAgIGV4cGFuZElucHV0OiAtPlxuICAgICAgc3RhdGUubW9kZSA9IChpZiBzdGF0ZS5tb2RlIHRoZW4gJycgZWxzZSAnd3JpdGUnKVxuICAgIGV4cGFuZFZpZXc6IC0+XG4gICAgICBzdGF0ZS5tb2RlID0gKGlmIHN0YXRlLm1vZGUgdGhlbiAnJyBlbHNlICdyZWFkJylcbiAgICBtb3VzZW91dDogKGUpIC0+XG4gICAgICBmcm9tID0gZS5yZWxhdGVkVGFyZ2V0IG9yIGUudG9FbGVtZW50XG4gICAgICB1cGRhdGVTdGF0dXMoKSBpZiBub3QgZnJvbSBvciBmcm9tLm5vZGVOYW1lIGlzICdIVE1MJ1xuICAgIGtleXByZXNzOiAoZSkgLT5cbiAgICAgIGlmIGUuY3RybEtleSBhbmQgZS5hbHRLZXlcbiAgICAgICAgaWYgZS5rZXlDb2RlIGlzIDI0ICMgY3RybCthbHQreFxuICAgICAgICAgIHN0YXRlLm1vZGUgPSAnd3JpdGUnXG4gICAgICAgIGVsc2UgaWYgZS5rZXlDb2RlIGlzIDMgIyBjdHJsK2FsdCtjXG4gICAgICAgICAgc3RhdGUubW9kZSA9ICcnXG4gICAgICAgIGVsc2UgaWYgZS5rZXlDb2RlIGlzIDIyICMgY3RybCthbHQrdlxuICAgICAgICAgIHN0YXRlLm1vZGUgPSAncmVhZCdcblxuICBzdGF0ZV8ucmVzdG9yZSBudWxsLCBudWxsLCBzZXRTdGF0ZVxuICBzdGF0ZV8ub24gJ3Jlc3RvcmUnLCBzZXRTdGF0ZVxuXG4gIHNob3dEbmQgPSBubyBpZiBub3QgZWRpdG9yLmdldFZhbHVlKClcbiAgIyQoJyNpbnB1dC13cmFwJykub25lICdjbGljaycsIC0+ICQoJyNkcmFnLW4tZHJvcC13cmFwJykucmVtb3ZlKClcblxuICB2aXhlbihkb2N1bWVudC5ib2R5LnBhcmVudE5vZGUsIG1vZGVsKVxuXG4gIHVwZGF0ZVZpZXcoKVxuICAjdXBkYXRlU3RhdHVzKClcbiIsIihmdW5jdGlvbigpey8vXG4vLyBzaG93ZG93bi5qcyAtLSBBIGphdmFzY3JpcHQgcG9ydCBvZiBNYXJrZG93bi5cbi8vXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDcgSm9obiBGcmFzZXIuXG4vL1xuLy8gT3JpZ2luYWwgTWFya2Rvd24gQ29weXJpZ2h0IChjKSAyMDA0LTIwMDUgSm9obiBHcnViZXJcbi8vICAgPGh0dHA6Ly9kYXJpbmdmaXJlYmFsbC5uZXQvcHJvamVjdHMvbWFya2Rvd24vPlxuLy9cbi8vIFJlZGlzdHJpYnV0YWJsZSB1bmRlciBhIEJTRC1zdHlsZSBvcGVuIHNvdXJjZSBsaWNlbnNlLlxuLy8gU2VlIGxpY2Vuc2UudHh0IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuLy9cbi8vIFRoZSBmdWxsIHNvdXJjZSBkaXN0cmlidXRpb24gaXMgYXQ6XG4vL1xuLy9cdFx0XHRcdEEgQSBMXG4vL1x0XHRcdFx0VCBDIEFcbi8vXHRcdFx0XHRUIEsgQlxuLy9cbi8vICAgPGh0dHA6Ly93d3cuYXR0YWNrbGFiLm5ldC8+XG4vL1xuXG4vL1xuLy8gV2hlcmV2ZXIgcG9zc2libGUsIFNob3dkb3duIGlzIGEgc3RyYWlnaHQsIGxpbmUtYnktbGluZSBwb3J0XG4vLyBvZiB0aGUgUGVybCB2ZXJzaW9uIG9mIE1hcmtkb3duLlxuLy9cbi8vIFRoaXMgaXMgbm90IGEgbm9ybWFsIHBhcnNlciBkZXNpZ247IGl0J3MgYmFzaWNhbGx5IGp1c3QgYVxuLy8gc2VyaWVzIG9mIHN0cmluZyBzdWJzdGl0dXRpb25zLiAgSXQncyBoYXJkIHRvIHJlYWQgYW5kXG4vLyBtYWludGFpbiB0aGlzIHdheSwgIGJ1dCBrZWVwaW5nIFNob3dkb3duIGNsb3NlIHRvIHRoZSBvcmlnaW5hbFxuLy8gZGVzaWduIG1ha2VzIGl0IGVhc2llciB0byBwb3J0IG5ldyBmZWF0dXJlcy5cbi8vXG4vLyBNb3JlIGltcG9ydGFudGx5LCBTaG93ZG93biBiZWhhdmVzIGxpa2UgbWFya2Rvd24ucGwgaW4gbW9zdFxuLy8gZWRnZSBjYXNlcy4gIFNvIHdlYiBhcHBsaWNhdGlvbnMgY2FuIGRvIGNsaWVudC1zaWRlIHByZXZpZXdcbi8vIGluIEphdmFzY3JpcHQsIGFuZCB0aGVuIGJ1aWxkIGlkZW50aWNhbCBIVE1MIG9uIHRoZSBzZXJ2ZXIuXG4vL1xuLy8gVGhpcyBwb3J0IG5lZWRzIHRoZSBuZXcgUmVnRXhwIGZ1bmN0aW9uYWxpdHkgb2YgRUNNQSAyNjIsXG4vLyAzcmQgRWRpdGlvbiAoaS5lLiBKYXZhc2NyaXB0IDEuNSkuICBNb3N0IG1vZGVybiB3ZWIgYnJvd3NlcnNcbi8vIHNob3VsZCBkbyBmaW5lLiAgRXZlbiB3aXRoIHRoZSBuZXcgcmVndWxhciBleHByZXNzaW9uIGZlYXR1cmVzLFxuLy8gV2UgZG8gYSBsb3Qgb2Ygd29yayB0byBlbXVsYXRlIFBlcmwncyByZWdleCBmdW5jdGlvbmFsaXR5LlxuLy8gVGhlIHRyaWNreSBjaGFuZ2VzIGluIHRoaXMgZmlsZSBtb3N0bHkgaGF2ZSB0aGUgXCJhdHRhY2tsYWI6XCJcbi8vIGxhYmVsLiAgTWFqb3Igb3Igc2VsZi1leHBsYW5hdG9yeSBjaGFuZ2VzIGRvbid0LlxuLy9cbi8vIFNtYXJ0IGRpZmYgdG9vbHMgbGlrZSBBcmF4aXMgTWVyZ2Ugd2lsbCBiZSBhYmxlIHRvIG1hdGNoIHVwXG4vLyB0aGlzIGZpbGUgd2l0aCBtYXJrZG93bi5wbCBpbiBhIHVzZWZ1bCB3YXkuICBBIGxpdHRsZSB0d2Vha2luZ1xuLy8gaGVscHM6IGluIGEgY29weSBvZiBtYXJrZG93bi5wbCwgcmVwbGFjZSBcIiNcIiB3aXRoIFwiLy9cIiBhbmRcbi8vIHJlcGxhY2UgXCIkdGV4dFwiIHdpdGggXCJ0ZXh0XCIuICBCZSBzdXJlIHRvIGlnbm9yZSB3aGl0ZXNwYWNlXG4vLyBhbmQgbGluZSBlbmRpbmdzLlxuLy9cblxuXG4vL1xuLy8gU2hvd2Rvd24gdXNhZ2U6XG4vL1xuLy8gICB2YXIgdGV4dCA9IFwiTWFya2Rvd24gKnJvY2tzKi5cIjtcbi8vXG4vLyAgIHZhciBjb252ZXJ0ZXIgPSBuZXcgU2hvd2Rvd24uY29udmVydGVyKCk7XG4vLyAgIHZhciBodG1sID0gY29udmVydGVyLm1ha2VIdG1sKHRleHQpO1xuLy9cbi8vICAgYWxlcnQoaHRtbCk7XG4vL1xuLy8gTm90ZTogbW92ZSB0aGUgc2FtcGxlIGNvZGUgdG8gdGhlIGJvdHRvbSBvZiB0aGlzXG4vLyBmaWxlIGJlZm9yZSB1bmNvbW1lbnRpbmcgaXQuXG4vL1xuXG5cbi8vXG4vLyBTaG93ZG93biBuYW1lc3BhY2Vcbi8vXG52YXIgU2hvd2Rvd24gPSB7fTtcblxuLy9cbi8vIGNvbnZlcnRlclxuLy9cbi8vIFdyYXBzIGFsbCBcImdsb2JhbHNcIiBzbyB0aGF0IHRoZSBvbmx5IHRoaW5nXG4vLyBleHBvc2VkIGlzIG1ha2VIdG1sKCkuXG4vL1xuU2hvd2Rvd24uY29udmVydGVyID0gZnVuY3Rpb24oKSB7XG5cbi8vXG4vLyBHbG9iYWxzOlxuLy9cblxuLy8gR2xvYmFsIGhhc2hlcywgdXNlZCBieSB2YXJpb3VzIHV0aWxpdHkgcm91dGluZXNcbnZhciBnX3VybHM7XG52YXIgZ190aXRsZXM7XG52YXIgZ19odG1sX2Jsb2NrcztcblxuLy8gVXNlZCB0byB0cmFjayB3aGVuIHdlJ3JlIGluc2lkZSBhbiBvcmRlcmVkIG9yIHVub3JkZXJlZCBsaXN0XG4vLyAoc2VlIF9Qcm9jZXNzTGlzdEl0ZW1zKCkgZm9yIGRldGFpbHMpOlxudmFyIGdfbGlzdF9sZXZlbCA9IDA7XG5cblxudGhpcy5tYWtlSHRtbCA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBNYWluIGZ1bmN0aW9uLiBUaGUgb3JkZXIgaW4gd2hpY2ggb3RoZXIgc3VicyBhcmUgY2FsbGVkIGhlcmUgaXNcbi8vIGVzc2VudGlhbC4gTGluayBhbmQgaW1hZ2Ugc3Vic3RpdHV0aW9ucyBuZWVkIHRvIGhhcHBlbiBiZWZvcmVcbi8vIF9Fc2NhcGVTcGVjaWFsQ2hhcnNXaXRoaW5UYWdBdHRyaWJ1dGVzKCksIHNvIHRoYXQgYW55IConcyBvciBfJ3MgaW4gdGhlIDxhPlxuLy8gYW5kIDxpbWc+IHRhZ3MgZ2V0IGVuY29kZWQuXG4vL1xuXG5cdC8vIENsZWFyIHRoZSBnbG9iYWwgaGFzaGVzLiBJZiB3ZSBkb24ndCBjbGVhciB0aGVzZSwgeW91IGdldCBjb25mbGljdHNcblx0Ly8gZnJvbSBvdGhlciBhcnRpY2xlcyB3aGVuIGdlbmVyYXRpbmcgYSBwYWdlIHdoaWNoIGNvbnRhaW5zIG1vcmUgdGhhblxuXHQvLyBvbmUgYXJ0aWNsZSAoZS5nLiBhbiBpbmRleCBwYWdlIHRoYXQgc2hvd3MgdGhlIE4gbW9zdCByZWNlbnRcblx0Ly8gYXJ0aWNsZXMpOlxuXHRnX3VybHMgPSBuZXcgQXJyYXkoKTtcblx0Z190aXRsZXMgPSBuZXcgQXJyYXkoKTtcblx0Z19odG1sX2Jsb2NrcyA9IG5ldyBBcnJheSgpO1xuXG5cdC8vIGF0dGFja2xhYjogUmVwbGFjZSB+IHdpdGggflRcblx0Ly8gVGhpcyBsZXRzIHVzIHVzZSB0aWxkZSBhcyBhbiBlc2NhcGUgY2hhciB0byBhdm9pZCBtZDUgaGFzaGVzXG5cdC8vIFRoZSBjaG9pY2Ugb2YgY2hhcmFjdGVyIGlzIGFyYml0cmF5OyBhbnl0aGluZyB0aGF0IGlzbid0XG4gICAgLy8gbWFnaWMgaW4gTWFya2Rvd24gd2lsbCB3b3JrLlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+L2csXCJ+VFwiKTtcblxuXHQvLyBhdHRhY2tsYWI6IFJlcGxhY2UgJCB3aXRoIH5EXG5cdC8vIFJlZ0V4cCBpbnRlcnByZXRzICQgYXMgYSBzcGVjaWFsIGNoYXJhY3RlclxuXHQvLyB3aGVuIGl0J3MgaW4gYSByZXBsYWNlbWVudCBzdHJpbmdcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFwkL2csXCJ+RFwiKTtcblxuXHQvLyBTdGFuZGFyZGl6ZSBsaW5lIGVuZGluZ3Ncblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7IC8vIERPUyB0byBVbml4XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcci9nLFwiXFxuXCIpOyAvLyBNYWMgdG8gVW5peFxuXG5cdC8vIE1ha2Ugc3VyZSB0ZXh0IGJlZ2lucyBhbmQgZW5kcyB3aXRoIGEgY291cGxlIG9mIG5ld2xpbmVzOlxuXHR0ZXh0ID0gXCJcXG5cXG5cIiArIHRleHQgKyBcIlxcblxcblwiO1xuXG5cdC8vIENvbnZlcnQgYWxsIHRhYnMgdG8gc3BhY2VzLlxuXHR0ZXh0ID0gX0RldGFiKHRleHQpO1xuXG5cdC8vIFN0cmlwIGFueSBsaW5lcyBjb25zaXN0aW5nIG9ubHkgb2Ygc3BhY2VzIGFuZCB0YWJzLlxuXHQvLyBUaGlzIG1ha2VzIHN1YnNlcXVlbnQgcmVnZXhlbiBlYXNpZXIgdG8gd3JpdGUsIGJlY2F1c2Ugd2UgY2FuXG5cdC8vIG1hdGNoIGNvbnNlY3V0aXZlIGJsYW5rIGxpbmVzIHdpdGggL1xcbisvIGluc3RlYWQgb2Ygc29tZXRoaW5nXG5cdC8vIGNvbnRvcnRlZCBsaWtlIC9bIFxcdF0qXFxuKy8gLlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBcXHRdKyQvbWcsXCJcIik7XG5cblx0Ly8gSGFuZGxlIGdpdGh1YiBjb2RlYmxvY2tzIHByaW9yIHRvIHJ1bm5pbmcgSGFzaEhUTUwgc28gdGhhdFxuXHQvLyBIVE1MIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNvZGVibG9jayBnZXRzIGVzY2FwZWQgcHJvcGVydGx5XG5cdHRleHQgPSBfRG9HaXRodWJDb2RlQmxvY2tzKHRleHQpO1xuXG5cdC8vIFR1cm4gYmxvY2stbGV2ZWwgSFRNTCBibG9ja3MgaW50byBoYXNoIGVudHJpZXNcblx0dGV4dCA9IF9IYXNoSFRNTEJsb2Nrcyh0ZXh0KTtcblxuXHQvLyBTdHJpcCBsaW5rIGRlZmluaXRpb25zLCBzdG9yZSBpbiBoYXNoZXMuXG5cdHRleHQgPSBfU3RyaXBMaW5rRGVmaW5pdGlvbnModGV4dCk7XG5cblx0dGV4dCA9IF9SdW5CbG9ja0dhbXV0KHRleHQpO1xuXG5cdHRleHQgPSBfVW5lc2NhcGVTcGVjaWFsQ2hhcnModGV4dCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXN0b3JlIGRvbGxhciBzaWduc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+RC9nLFwiJCRcIik7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXN0b3JlIHRpbGRlc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+VC9nLFwiflwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn07XG5cblxudmFyIF9TdHJpcExpbmtEZWZpbml0aW9ucyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBTdHJpcHMgbGluayBkZWZpbml0aW9ucyBmcm9tIHRleHQsIHN0b3JlcyB0aGUgVVJMcyBhbmQgdGl0bGVzIGluXG4vLyBoYXNoIHJlZmVyZW5jZXMuXG4vL1xuXG5cdC8vIExpbmsgZGVmcyBhcmUgaW4gdGhlIGZvcm06IF5baWRdOiB1cmwgXCJvcHRpb25hbCB0aXRsZVwiXG5cblx0Lypcblx0XHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHRcdF5bIF17MCwzfVxcWyguKylcXF06ICAvLyBpZCA9ICQxICBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0ICBcXG4/XHRcdFx0XHQvLyBtYXliZSAqb25lKiBuZXdsaW5lXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQ8PyhcXFMrPyk+P1x0XHRcdC8vIHVybCA9ICQyXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQgIFxcbj9cdFx0XHRcdC8vIG1heWJlIG9uZSBuZXdsaW5lXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQoPzpcblx0XHRcdFx0ICAoXFxuKilcdFx0XHRcdC8vIGFueSBsaW5lcyBza2lwcGVkID0gJDMgYXR0YWNrbGFiOiBsb29rYmVoaW5kIHJlbW92ZWRcblx0XHRcdFx0ICBbXCIoXVxuXHRcdFx0XHQgICguKz8pXHRcdFx0XHQvLyB0aXRsZSA9ICQ0XG5cdFx0XHRcdCAgW1wiKV1cblx0XHRcdFx0ICBbIFxcdF0qXG5cdFx0XHRcdCk/XHRcdFx0XHRcdC8vIHRpdGxlIGlzIG9wdGlvbmFsXG5cdFx0XHRcdCg/Olxcbit8JClcblx0XHRcdCAgL2dtLFxuXHRcdFx0ICBmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDN9XFxbKC4rKVxcXTpbIFxcdF0qXFxuP1sgXFx0XSo8PyhcXFMrPyk+P1sgXFx0XSpcXG4/WyBcXHRdKig/OihcXG4qKVtcIihdKC4rPylbXCIpXVsgXFx0XSopPyg/Olxcbit8XFxaKS9nbSxcblx0XHRmdW5jdGlvbiAod2hvbGVNYXRjaCxtMSxtMixtMyxtNCkge1xuXHRcdFx0bTEgPSBtMS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0Z191cmxzW20xXSA9IF9FbmNvZGVBbXBzQW5kQW5nbGVzKG0yKTsgIC8vIExpbmsgSURzIGFyZSBjYXNlLWluc2Vuc2l0aXZlXG5cdFx0XHRpZiAobTMpIHtcblx0XHRcdFx0Ly8gT29wcywgZm91bmQgYmxhbmsgbGluZXMsIHNvIGl0J3Mgbm90IGEgdGl0bGUuXG5cdFx0XHRcdC8vIFB1dCBiYWNrIHRoZSBwYXJlbnRoZXRpY2FsIHN0YXRlbWVudCB3ZSBzdG9sZS5cblx0XHRcdFx0cmV0dXJuIG0zK200O1xuXHRcdFx0fSBlbHNlIGlmIChtNCkge1xuXHRcdFx0XHRnX3RpdGxlc1ttMV0gPSBtNC5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb21wbGV0ZWx5IHJlbW92ZSB0aGUgZGVmaW5pdGlvbiBmcm9tIHRoZSB0ZXh0XG5cdFx0XHRyZXR1cm4gXCJcIjtcblx0XHR9XG5cdCk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9IYXNoSFRNTEJsb2NrcyA9IGZ1bmN0aW9uKHRleHQpIHtcblx0Ly8gYXR0YWNrbGFiOiBEb3VibGUgdXAgYmxhbmsgbGluZXMgdG8gcmVkdWNlIGxvb2thcm91bmRcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxuL2csXCJcXG5cXG5cIik7XG5cblx0Ly8gSGFzaGlmeSBIVE1MIGJsb2Nrczpcblx0Ly8gV2Ugb25seSB3YW50IHRvIGRvIHRoaXMgZm9yIGJsb2NrLWxldmVsIEhUTUwgdGFncywgc3VjaCBhcyBoZWFkZXJzLFxuXHQvLyBsaXN0cywgYW5kIHRhYmxlcy4gVGhhdCdzIGJlY2F1c2Ugd2Ugc3RpbGwgd2FudCB0byB3cmFwIDxwPnMgYXJvdW5kXG5cdC8vIFwicGFyYWdyYXBoc1wiIHRoYXQgYXJlIHdyYXBwZWQgaW4gbm9uLWJsb2NrLWxldmVsIHRhZ3MsIHN1Y2ggYXMgYW5jaG9ycyxcblx0Ly8gcGhyYXNlIGVtcGhhc2lzLCBhbmQgc3BhbnMuIFRoZSBsaXN0IG9mIHRhZ3Mgd2UncmUgbG9va2luZyBmb3IgaXNcblx0Ly8gaGFyZC1jb2RlZDpcblx0dmFyIGJsb2NrX3RhZ3NfYSA9IFwicHxkaXZ8aFsxLTZdfGJsb2NrcXVvdGV8cHJlfHRhYmxlfGRsfG9sfHVsfHNjcmlwdHxub3NjcmlwdHxmb3JtfGZpZWxkc2V0fGlmcmFtZXxtYXRofGluc3xkZWx8c3R5bGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyfG5hdnxhcnRpY2xlfGFzaWRlXCI7XG5cdHZhciBibG9ja190YWdzX2IgPSBcInB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxzdHlsZXxzZWN0aW9ufGhlYWRlcnxmb290ZXJ8bmF2fGFydGljbGV8YXNpZGVcIjtcblxuXHQvLyBGaXJzdCwgbG9vayBmb3IgbmVzdGVkIGJsb2NrcywgZS5nLjpcblx0Ly8gICA8ZGl2PlxuXHQvLyAgICAgPGRpdj5cblx0Ly8gICAgIHRhZ3MgZm9yIGlubmVyIGJsb2NrIG11c3QgYmUgaW5kZW50ZWQuXG5cdC8vICAgICA8L2Rpdj5cblx0Ly8gICA8L2Rpdj5cblx0Ly9cblx0Ly8gVGhlIG91dGVybW9zdCB0YWdzIG11c3Qgc3RhcnQgYXQgdGhlIGxlZnQgbWFyZ2luIGZvciB0aGlzIHRvIG1hdGNoLCBhbmRcblx0Ly8gdGhlIGlubmVyIG5lc3RlZCBkaXZzIG11c3QgYmUgaW5kZW50ZWQuXG5cdC8vIFdlIG5lZWQgdG8gZG8gdGhpcyBiZWZvcmUgdGhlIG5leHQsIG1vcmUgbGliZXJhbCBtYXRjaCwgYmVjYXVzZSB0aGUgbmV4dFxuXHQvLyBtYXRjaCB3aWxsIHN0YXJ0IGF0IHRoZSBmaXJzdCBgPGRpdj5gIGFuZCBzdG9wIGF0IHRoZSBmaXJzdCBgPC9kaXY+YC5cblxuXHQvLyBhdHRhY2tsYWI6IFRoaXMgcmVnZXggY2FuIGJlIGV4cGVuc2l2ZSB3aGVuIGl0IGZhaWxzLlxuXHQvKlxuXHRcdHZhciB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0Xlx0XHRcdFx0XHQvLyBzdGFydCBvZiBsaW5lICAod2l0aCAvbSlcblx0XHRcdDwoJGJsb2NrX3RhZ3NfYSlcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQga2h0bWwvcGNyZSBidWcuLi5cblx0XHRcdFteXFxyXSo/XFxuXHRcdFx0Ly8gYW55IG51bWJlciBvZiBsaW5lcywgbWluaW1hbGx5IG1hdGNoaW5nXG5cdFx0XHQ8L1xcMj5cdFx0XHRcdC8vIHRoZSBtYXRjaGluZyBlbmQgdGFnXG5cdFx0XHRbIFxcdF0qXHRcdFx0XHQvLyB0cmFpbGluZyBzcGFjZXMvdGFic1xuXHRcdFx0KD89XFxuKylcdFx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgbmV3bGluZVxuXHRcdClcdFx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IHRoZXJlIGFyZSBzZW50aW5lbCBuZXdsaW5lcyBhdCBlbmQgb2YgZG9jdW1lbnRcblx0XHQvZ20sZnVuY3Rpb24oKXsuLi59fTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXig8KHB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxpbnN8ZGVsKVxcYlteXFxyXSo/XFxuPFxcL1xcMj5bIFxcdF0qKD89XFxuKykpL2dtLGhhc2hFbGVtZW50KTtcblxuXHQvL1xuXHQvLyBOb3cgbWF0Y2ggbW9yZSBsaWJlcmFsbHksIHNpbXBseSBmcm9tIGBcXG48dGFnPmAgdG8gYDwvdGFnPlxcbmBcblx0Ly9cblxuXHQvKlxuXHRcdHZhciB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0Xlx0XHRcdFx0XHQvLyBzdGFydCBvZiBsaW5lICAod2l0aCAvbSlcblx0XHRcdDwoJGJsb2NrX3RhZ3NfYilcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQga2h0bWwvcGNyZSBidWcuLi5cblx0XHRcdFteXFxyXSo/XHRcdFx0XHQvLyBhbnkgbnVtYmVyIG9mIGxpbmVzLCBtaW5pbWFsbHkgbWF0Y2hpbmdcblx0XHRcdC4qPC9cXDI+XHRcdFx0XHQvLyB0aGUgbWF0Y2hpbmcgZW5kIHRhZ1xuXHRcdFx0WyBcXHRdKlx0XHRcdFx0Ly8gdHJhaWxpbmcgc3BhY2VzL3RhYnNcblx0XHRcdCg/PVxcbispXHRcdFx0XHQvLyBmb2xsb3dlZCBieSBhIG5ld2xpbmVcblx0XHQpXHRcdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB0aGVyZSBhcmUgc2VudGluZWwgbmV3bGluZXMgYXQgZW5kIG9mIGRvY3VtZW50XG5cdFx0L2dtLGZ1bmN0aW9uKCl7Li4ufX07XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oPChwfGRpdnxoWzEtNl18YmxvY2txdW90ZXxwcmV8dGFibGV8ZGx8b2x8dWx8c2NyaXB0fG5vc2NyaXB0fGZvcm18ZmllbGRzZXR8aWZyYW1lfG1hdGh8c3R5bGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyfG5hdnxhcnRpY2xlfGFzaWRlKVxcYlteXFxyXSo/Lio8XFwvXFwyPlsgXFx0XSooPz1cXG4rKVxcbikvZ20saGFzaEVsZW1lbnQpO1xuXG5cdC8vIFNwZWNpYWwgY2FzZSBqdXN0IGZvciA8aHIgLz4uIEl0IHdhcyBlYXNpZXIgdG8gbWFrZSBhIHNwZWNpYWwgY2FzZSB0aGFuXG5cdC8vIHRvIG1ha2UgdGhlIG90aGVyIHJlZ2V4IG1vcmUgY29tcGxpY2F0ZWQuXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0XFxuXFxuXHRcdFx0XHQvLyBTdGFydGluZyBhZnRlciBhIGJsYW5rIGxpbmVcblx0XHRcdFsgXXswLDN9XG5cdFx0XHQoPChocilcdFx0XHRcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0KFtePD5dKSo/XHRcdFx0Ly9cblx0XHRcdFxcLz8+KVx0XHRcdFx0Ly8gdGhlIG1hdGNoaW5nIGVuZCB0YWdcblx0XHRcdFsgXFx0XSpcblx0XHRcdCg/PVxcbnsyLH0pXHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdC9nLGhhc2hFbGVtZW50KTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcblsgXXswLDN9KDwoaHIpXFxiKFtePD5dKSo/XFwvPz4pWyBcXHRdKig/PVxcbnsyLH0pKS9nLGhhc2hFbGVtZW50KTtcblxuXHQvLyBTcGVjaWFsIGNhc2UgZm9yIHN0YW5kYWxvbmUgSFRNTCBjb21tZW50czpcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyBzYXZlIGluICQxXG5cdFx0XHRcXG5cXG5cdFx0XHRcdC8vIFN0YXJ0aW5nIGFmdGVyIGEgYmxhbmsgbGluZVxuXHRcdFx0WyBdezAsM31cdFx0XHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0PCFcblx0XHRcdCgtLVteXFxyXSo/LS1cXHMqKStcblx0XHRcdD5cblx0XHRcdFsgXFx0XSpcblx0XHRcdCg/PVxcbnsyLH0pXHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdC9nLGhhc2hFbGVtZW50KTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcblxcblsgXXswLDN9PCEoLS1bXlxccl0qPy0tXFxzKikrPlsgXFx0XSooPz1cXG57Mix9KSkvZyxoYXNoRWxlbWVudCk7XG5cblx0Ly8gUEhQIGFuZCBBU1Atc3R5bGUgcHJvY2Vzc29yIGluc3RydWN0aW9ucyAoPD8uLi4/PiBhbmQgPCUuLi4lPilcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdCg/OlxuXHRcdFx0XFxuXFxuXHRcdFx0XHQvLyBTdGFydGluZyBhZnRlciBhIGJsYW5rIGxpbmVcblx0XHQpXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdFsgXXswLDN9XHRcdFx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdCg/OlxuXHRcdFx0XHQ8KFs/JV0pXHRcdFx0Ly8gJDJcblx0XHRcdFx0W15cXHJdKj9cblx0XHRcdFx0XFwyPlxuXHRcdFx0KVxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KD89XFxuezIsfSlcdFx0XHQvLyBmb2xsb3dlZCBieSBhIGJsYW5rIGxpbmVcblx0XHQpXG5cdFx0L2csaGFzaEVsZW1lbnQpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oPzpcXG5cXG4pKFsgXXswLDN9KD86PChbPyVdKVteXFxyXSo/XFwyPilbIFxcdF0qKD89XFxuezIsfSkpL2csaGFzaEVsZW1lbnQpO1xuXG5cdC8vIGF0dGFja2xhYjogVW5kbyBkb3VibGUgbGluZXMgKHNlZSBjb21tZW50IGF0IHRvcCBvZiB0aGlzIGZ1bmN0aW9uKVxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG5cXG4vZyxcIlxcblwiKTtcblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBoYXNoRWxlbWVudCA9IGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0dmFyIGJsb2NrVGV4dCA9IG0xO1xuXG5cdC8vIFVuZG8gZG91YmxlIGxpbmVzXG5cdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9cXG5cXG4vZyxcIlxcblwiKTtcblx0YmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL15cXG4vLFwiXCIpO1xuXG5cdC8vIHN0cmlwIHRyYWlsaW5nIGJsYW5rIGxpbmVzXG5cdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9cXG4rJC9nLFwiXCIpO1xuXG5cdC8vIFJlcGxhY2UgdGhlIGVsZW1lbnQgdGV4dCB3aXRoIGEgbWFya2VyIChcIn5LeEtcIiB3aGVyZSB4IGlzIGl0cyBrZXkpXG5cdGJsb2NrVGV4dCA9IFwiXFxuXFxufktcIiArIChnX2h0bWxfYmxvY2tzLnB1c2goYmxvY2tUZXh0KS0xKSArIFwiS1xcblxcblwiO1xuXG5cdHJldHVybiBibG9ja1RleHQ7XG59O1xuXG52YXIgX1J1bkJsb2NrR2FtdXQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVGhlc2UgYXJlIGFsbCB0aGUgdHJhbnNmb3JtYXRpb25zIHRoYXQgZm9ybSBibG9jay1sZXZlbFxuLy8gdGFncyBsaWtlIHBhcmFncmFwaHMsIGhlYWRlcnMsIGFuZCBsaXN0IGl0ZW1zLlxuLy9cblx0dGV4dCA9IF9Eb0hlYWRlcnModGV4dCk7XG5cblx0Ly8gRG8gSG9yaXpvbnRhbCBSdWxlczpcblx0dmFyIGtleSA9IGhhc2hCbG9jayhcIjxociAvPlwiKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXCpbIF0/KXszLH1bIFxcdF0qJC9nbSxrZXkpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBdezAsMn0oWyBdP1xcLVsgXT8pezMsfVsgXFx0XSokL2dtLGtleSk7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwyfShbIF0/XFxfWyBdPyl7Myx9WyBcXHRdKiQvZ20sa2V5KTtcblxuXHR0ZXh0ID0gX0RvTGlzdHModGV4dCk7XG5cdHRleHQgPSBfRG9Db2RlQmxvY2tzKHRleHQpO1xuXHR0ZXh0ID0gX0RvQmxvY2tRdW90ZXModGV4dCk7XG5cblx0Ly8gV2UgYWxyZWFkeSByYW4gX0hhc2hIVE1MQmxvY2tzKCkgYmVmb3JlLCBpbiBNYXJrZG93bigpLCBidXQgdGhhdFxuXHQvLyB3YXMgdG8gZXNjYXBlIHJhdyBIVE1MIGluIHRoZSBvcmlnaW5hbCBNYXJrZG93biBzb3VyY2UuIFRoaXMgdGltZSxcblx0Ly8gd2UncmUgZXNjYXBpbmcgdGhlIG1hcmt1cCB3ZSd2ZSBqdXN0IGNyZWF0ZWQsIHNvIHRoYXQgd2UgZG9uJ3Qgd3JhcFxuXHQvLyA8cD4gdGFncyBhcm91bmQgYmxvY2stbGV2ZWwgdGFncy5cblx0dGV4dCA9IF9IYXNoSFRNTEJsb2Nrcyh0ZXh0KTtcblx0dGV4dCA9IF9Gb3JtUGFyYWdyYXBocyh0ZXh0KTtcblxuXHRyZXR1cm4gdGV4dDtcbn07XG5cblxudmFyIF9SdW5TcGFuR2FtdXQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVGhlc2UgYXJlIGFsbCB0aGUgdHJhbnNmb3JtYXRpb25zIHRoYXQgb2NjdXIgKndpdGhpbiogYmxvY2stbGV2ZWxcbi8vIHRhZ3MgbGlrZSBwYXJhZ3JhcGhzLCBoZWFkZXJzLCBhbmQgbGlzdCBpdGVtcy5cbi8vXG5cblx0dGV4dCA9IF9Eb0NvZGVTcGFucyh0ZXh0KTtcblx0dGV4dCA9IF9Fc2NhcGVTcGVjaWFsQ2hhcnNXaXRoaW5UYWdBdHRyaWJ1dGVzKHRleHQpO1xuXHR0ZXh0ID0gX0VuY29kZUJhY2tzbGFzaEVzY2FwZXModGV4dCk7XG5cblx0Ly8gUHJvY2VzcyBhbmNob3IgYW5kIGltYWdlIHRhZ3MuIEltYWdlcyBtdXN0IGNvbWUgZmlyc3QsXG5cdC8vIGJlY2F1c2UgIVtmb29dW2ZdIGxvb2tzIGxpa2UgYW4gYW5jaG9yLlxuXHR0ZXh0ID0gX0RvSW1hZ2VzKHRleHQpO1xuXHR0ZXh0ID0gX0RvQW5jaG9ycyh0ZXh0KTtcblxuXHQvLyBNYWtlIGxpbmtzIG91dCBvZiB0aGluZ3MgbGlrZSBgPGh0dHA6Ly9leGFtcGxlLmNvbS8+YFxuXHQvLyBNdXN0IGNvbWUgYWZ0ZXIgX0RvQW5jaG9ycygpLCBiZWNhdXNlIHlvdSBjYW4gdXNlIDwgYW5kID5cblx0Ly8gZGVsaW1pdGVycyBpbiBpbmxpbmUgbGlua3MgbGlrZSBbdGhpc10oPHVybD4pLlxuXHR0ZXh0ID0gX0RvQXV0b0xpbmtzKHRleHQpO1xuXHR0ZXh0ID0gX0VuY29kZUFtcHNBbmRBbmdsZXModGV4dCk7XG5cdHRleHQgPSBfRG9JdGFsaWNzQW5kQm9sZCh0ZXh0KTtcblxuXHQvLyBEbyBoYXJkIGJyZWFrczpcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvICArXFxuL2csXCIgPGJyIC8+XFxuXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gV2l0aGluIHRhZ3MgLS0gbWVhbmluZyBiZXR3ZWVuIDwgYW5kID4gLS0gZW5jb2RlIFtcXCBgICogX10gc28gdGhleVxuLy8gZG9uJ3QgY29uZmxpY3Qgd2l0aCB0aGVpciB1c2UgaW4gTWFya2Rvd24gZm9yIGNvZGUsIGl0YWxpY3MgYW5kIHN0cm9uZy5cbi8vXG5cblx0Ly8gQnVpbGQgYSByZWdleCB0byBmaW5kIEhUTUwgdGFncyBhbmQgY29tbWVudHMuICBTZWUgRnJpZWRsJ3Ncblx0Ly8gXCJNYXN0ZXJpbmcgUmVndWxhciBFeHByZXNzaW9uc1wiLCAybmQgRWQuLCBwcC4gMjAwLTIwMS5cblx0dmFyIHJlZ2V4ID0gLyg8W2EtelxcLyEkXShcIlteXCJdKlwifCdbXiddKid8W14nXCI+XSkqPnw8ISgtLS4qPy0tXFxzKikrPikvZ2k7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZShyZWdleCwgZnVuY3Rpb24od2hvbGVNYXRjaCkge1xuXHRcdHZhciB0YWcgPSB3aG9sZU1hdGNoLnJlcGxhY2UoLyguKTxcXC8/Y29kZT4oPz0uKS9nLFwiJDFgXCIpO1xuXHRcdHRhZyA9IGVzY2FwZUNoYXJhY3RlcnModGFnLFwiXFxcXGAqX1wiKTtcblx0XHRyZXR1cm4gdGFnO1xuXHR9KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIF9Eb0FuY2hvcnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVHVybiBNYXJrZG93biBsaW5rIHNob3J0Y3V0cyBpbnRvIFhIVE1MIDxhPiB0YWdzLlxuLy9cblx0Ly9cblx0Ly8gRmlyc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgbGlua3M6IFtsaW5rIHRleHRdIFtpZF1cblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdFxcW1xuXHRcdFx0KFxuXHRcdFx0XHQoPzpcblx0XHRcdFx0XHRcXFtbXlxcXV0qXFxdXHRcdC8vIGFsbG93IGJyYWNrZXRzIG5lc3RlZCBvbmUgbGV2ZWxcblx0XHRcdFx0XHR8XG5cdFx0XHRcdFx0W15cXFtdXHRcdFx0Ly8gb3IgYW55dGhpbmcgZWxzZVxuXHRcdFx0XHQpKlxuXHRcdFx0KVxuXHRcdFx0XFxdXG5cblx0XHRcdFsgXT9cdFx0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIHNwYWNlXG5cdFx0XHQoPzpcXG5bIF0qKT9cdFx0XHRcdC8vIG9uZSBvcHRpb25hbCBuZXdsaW5lIGZvbGxvd2VkIGJ5IHNwYWNlc1xuXG5cdFx0XHRcXFtcblx0XHRcdCguKj8pXHRcdFx0XHRcdC8vIGlkID0gJDNcblx0XHRcdFxcXVxuXHRcdCkoKSgpKCkoKVx0XHRcdFx0XHQvLyBwYWQgcmVtYWluaW5nIGJhY2tyZWZlcmVuY2VzXG5cdFx0L2csX0RvQW5jaG9yc19jYWxsYmFjayk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFsoKD86XFxbW15cXF1dKlxcXXxbXlxcW1xcXV0pKilcXF1bIF0/KD86XFxuWyBdKik/XFxbKC4qPylcXF0pKCkoKSgpKCkvZyx3cml0ZUFuY2hvclRhZyk7XG5cblx0Ly9cblx0Ly8gTmV4dCwgaW5saW5lLXN0eWxlIGxpbmtzOiBbbGluayB0ZXh0XSh1cmwgXCJvcHRpb25hbCB0aXRsZVwiKVxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHQoXHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0XHRcXFtcblx0XHRcdFx0KFxuXHRcdFx0XHRcdCg/OlxuXHRcdFx0XHRcdFx0XFxbW15cXF1dKlxcXVx0Ly8gYWxsb3cgYnJhY2tldHMgbmVzdGVkIG9uZSBsZXZlbFxuXHRcdFx0XHRcdHxcblx0XHRcdFx0XHRbXlxcW1xcXV1cdFx0XHQvLyBvciBhbnl0aGluZyBlbHNlXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHRcdFxcXVxuXHRcdFx0XFwoXHRcdFx0XHRcdFx0Ly8gbGl0ZXJhbCBwYXJlblxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KClcdFx0XHRcdFx0XHQvLyBubyBpZCwgc28gbGVhdmUgJDMgZW1wdHlcblx0XHRcdDw/KC4qPyk+P1x0XHRcdFx0Ly8gaHJlZiA9ICQ0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoXHRcdFx0XHRcdFx0Ly8gJDVcblx0XHRcdFx0KFsnXCJdKVx0XHRcdFx0Ly8gcXVvdGUgY2hhciA9ICQ2XG5cdFx0XHRcdCguKj8pXHRcdFx0XHQvLyBUaXRsZSA9ICQ3XG5cdFx0XHRcdFxcNlx0XHRcdFx0XHQvLyBtYXRjaGluZyBxdW90ZVxuXHRcdFx0XHRbIFxcdF0qXHRcdFx0XHQvLyBpZ25vcmUgYW55IHNwYWNlcy90YWJzIGJldHdlZW4gY2xvc2luZyBxdW90ZSBhbmQgKVxuXHRcdFx0KT9cdFx0XHRcdFx0XHQvLyB0aXRsZSBpcyBvcHRpb25hbFxuXHRcdFx0XFwpXG5cdFx0KVxuXHRcdC9nLHdyaXRlQW5jaG9yVGFnKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcWygoPzpcXFtbXlxcXV0qXFxdfFteXFxbXFxdXSkqKVxcXVxcKFsgXFx0XSooKTw/KC4qPyk+P1sgXFx0XSooKFsnXCJdKSguKj8pXFw2WyBcXHRdKik/XFwpKS9nLHdyaXRlQW5jaG9yVGFnKTtcblxuXHQvL1xuXHQvLyBMYXN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIHNob3J0Y3V0czogW2xpbmsgdGV4dF1cblx0Ly8gVGhlc2UgbXVzdCBjb21lIGxhc3QgaW4gY2FzZSB5b3UndmUgYWxzbyBnb3QgW2xpbmsgdGVzdF1bMV1cblx0Ly8gb3IgW2xpbmsgdGVzdF0oL2Zvbylcblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0IFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHRcXFtcblx0XHRcdChbXlxcW1xcXV0rKVx0XHRcdFx0Ly8gbGluayB0ZXh0ID0gJDI7IGNhbid0IGNvbnRhaW4gJ1snIG9yICddJ1xuXHRcdFx0XFxdXG5cdFx0KSgpKCkoKSgpKClcdFx0XHRcdFx0Ly8gcGFkIHJlc3Qgb2YgYmFja3JlZmVyZW5jZXNcblx0XHQvZywgd3JpdGVBbmNob3JUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbKFteXFxbXFxdXSspXFxdKSgpKCkoKSgpKCkvZywgd3JpdGVBbmNob3JUYWcpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgd3JpdGVBbmNob3JUYWcgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00LG01LG02LG03KSB7XG5cdGlmIChtNyA9PSB1bmRlZmluZWQpIG03ID0gXCJcIjtcblx0dmFyIHdob2xlX21hdGNoID0gbTE7XG5cdHZhciBsaW5rX3RleHQgICA9IG0yO1xuXHR2YXIgbGlua19pZFx0ID0gbTMudG9Mb3dlckNhc2UoKTtcblx0dmFyIHVybFx0XHQ9IG00O1xuXHR2YXIgdGl0bGVcdD0gbTc7XG5cblx0aWYgKHVybCA9PSBcIlwiKSB7XG5cdFx0aWYgKGxpbmtfaWQgPT0gXCJcIikge1xuXHRcdFx0Ly8gbG93ZXItY2FzZSBhbmQgdHVybiBlbWJlZGRlZCBuZXdsaW5lcyBpbnRvIHNwYWNlc1xuXHRcdFx0bGlua19pZCA9IGxpbmtfdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyA/XFxuL2csXCIgXCIpO1xuXHRcdH1cblx0XHR1cmwgPSBcIiNcIitsaW5rX2lkO1xuXG5cdFx0aWYgKGdfdXJsc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdHVybCA9IGdfdXJsc1tsaW5rX2lkXTtcblx0XHRcdGlmIChnX3RpdGxlc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dGl0bGUgPSBnX3RpdGxlc1tsaW5rX2lkXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAod2hvbGVfbWF0Y2guc2VhcmNoKC9cXChcXHMqXFwpJC9tKT4tMSkge1xuXHRcdFx0XHQvLyBTcGVjaWFsIGNhc2UgZm9yIGV4cGxpY2l0IGVtcHR5IHVybFxuXHRcdFx0XHR1cmwgPSBcIlwiO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHdob2xlX21hdGNoO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHVybCA9IGVzY2FwZUNoYXJhY3RlcnModXJsLFwiKl9cIik7XG5cdHZhciByZXN1bHQgPSBcIjxhIGhyZWY9XFxcIlwiICsgdXJsICsgXCJcXFwiXCI7XG5cblx0aWYgKHRpdGxlICE9IFwiXCIpIHtcblx0XHR0aXRsZSA9IHRpdGxlLnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIik7XG5cdFx0dGl0bGUgPSBlc2NhcGVDaGFyYWN0ZXJzKHRpdGxlLFwiKl9cIik7XG5cdFx0cmVzdWx0ICs9ICBcIiB0aXRsZT1cXFwiXCIgKyB0aXRsZSArIFwiXFxcIlwiO1xuXHR9XG5cblx0cmVzdWx0ICs9IFwiPlwiICsgbGlua190ZXh0ICsgXCI8L2E+XCI7XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuXG52YXIgX0RvSW1hZ2VzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFR1cm4gTWFya2Rvd24gaW1hZ2Ugc2hvcnRjdXRzIGludG8gPGltZz4gdGFncy5cbi8vXG5cblx0Ly9cblx0Ly8gRmlyc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgbGFiZWxlZCBpbWFnZXM6ICFbYWx0IHRleHRdW2lkXVxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdCFcXFtcblx0XHRcdCguKj8pXHRcdFx0XHQvLyBhbHQgdGV4dCA9ICQyXG5cdFx0XHRcXF1cblxuXHRcdFx0WyBdP1x0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIHNwYWNlXG5cdFx0XHQoPzpcXG5bIF0qKT9cdFx0XHQvLyBvbmUgb3B0aW9uYWwgbmV3bGluZSBmb2xsb3dlZCBieSBzcGFjZXNcblxuXHRcdFx0XFxbXG5cdFx0XHQoLio/KVx0XHRcdFx0Ly8gaWQgPSAkM1xuXHRcdFx0XFxdXG5cdFx0KSgpKCkoKSgpXHRcdFx0XHQvLyBwYWQgcmVzdCBvZiBiYWNrcmVmZXJlbmNlc1xuXHRcdC9nLHdyaXRlSW1hZ2VUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oIVxcWyguKj8pXFxdWyBdPyg/OlxcblsgXSopP1xcWyguKj8pXFxdKSgpKCkoKSgpL2csd3JpdGVJbWFnZVRhZyk7XG5cblx0Ly9cblx0Ly8gTmV4dCwgaGFuZGxlIGlubGluZSBpbWFnZXM6ICAhW2FsdCB0ZXh0XSh1cmwgXCJvcHRpb25hbCB0aXRsZVwiKVxuXHQvLyBEb24ndCBmb3JnZXQ6IGVuY29kZSAqIGFuZCBfXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0IVxcW1xuXHRcdFx0KC4qPylcdFx0XHRcdC8vIGFsdCB0ZXh0ID0gJDJcblx0XHRcdFxcXVxuXHRcdFx0XFxzP1x0XHRcdFx0XHQvLyBPbmUgb3B0aW9uYWwgd2hpdGVzcGFjZSBjaGFyYWN0ZXJcblx0XHRcdFxcKFx0XHRcdFx0XHQvLyBsaXRlcmFsIHBhcmVuXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoKVx0XHRcdFx0XHQvLyBubyBpZCwgc28gbGVhdmUgJDMgZW1wdHlcblx0XHRcdDw/KFxcUys/KT4/XHRcdFx0Ly8gc3JjIHVybCA9ICQ0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoXHRcdFx0XHRcdC8vICQ1XG5cdFx0XHRcdChbJ1wiXSlcdFx0XHQvLyBxdW90ZSBjaGFyID0gJDZcblx0XHRcdFx0KC4qPylcdFx0XHQvLyB0aXRsZSA9ICQ3XG5cdFx0XHRcdFxcNlx0XHRcdFx0Ly8gbWF0Y2hpbmcgcXVvdGVcblx0XHRcdFx0WyBcXHRdKlxuXHRcdFx0KT9cdFx0XHRcdFx0Ly8gdGl0bGUgaXMgb3B0aW9uYWxcblx0XHRcXClcblx0XHQpXG5cdFx0L2csd3JpdGVJbWFnZVRhZyk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyghXFxbKC4qPylcXF1cXHM/XFwoWyBcXHRdKigpPD8oXFxTKz8pPj9bIFxcdF0qKChbJ1wiXSkoLio/KVxcNlsgXFx0XSopP1xcKSkvZyx3cml0ZUltYWdlVGFnKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIHdyaXRlSW1hZ2VUYWcgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00LG01LG02LG03KSB7XG5cdHZhciB3aG9sZV9tYXRjaCA9IG0xO1xuXHR2YXIgYWx0X3RleHQgICA9IG0yO1xuXHR2YXIgbGlua19pZFx0ID0gbTMudG9Mb3dlckNhc2UoKTtcblx0dmFyIHVybFx0XHQ9IG00O1xuXHR2YXIgdGl0bGVcdD0gbTc7XG5cblx0aWYgKCF0aXRsZSkgdGl0bGUgPSBcIlwiO1xuXG5cdGlmICh1cmwgPT0gXCJcIikge1xuXHRcdGlmIChsaW5rX2lkID09IFwiXCIpIHtcblx0XHRcdC8vIGxvd2VyLWNhc2UgYW5kIHR1cm4gZW1iZWRkZWQgbmV3bGluZXMgaW50byBzcGFjZXNcblx0XHRcdGxpbmtfaWQgPSBhbHRfdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyA/XFxuL2csXCIgXCIpO1xuXHRcdH1cblx0XHR1cmwgPSBcIiNcIitsaW5rX2lkO1xuXG5cdFx0aWYgKGdfdXJsc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdHVybCA9IGdfdXJsc1tsaW5rX2lkXTtcblx0XHRcdGlmIChnX3RpdGxlc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dGl0bGUgPSBnX3RpdGxlc1tsaW5rX2lkXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gd2hvbGVfbWF0Y2g7XG5cdFx0fVxuXHR9XG5cblx0YWx0X3RleHQgPSBhbHRfdGV4dC5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHR1cmwgPSBlc2NhcGVDaGFyYWN0ZXJzKHVybCxcIipfXCIpO1xuXHR2YXIgcmVzdWx0ID0gXCI8aW1nIHNyYz1cXFwiXCIgKyB1cmwgKyBcIlxcXCIgYWx0PVxcXCJcIiArIGFsdF90ZXh0ICsgXCJcXFwiXCI7XG5cblx0Ly8gYXR0YWNrbGFiOiBNYXJrZG93bi5wbCBhZGRzIGVtcHR5IHRpdGxlIGF0dHJpYnV0ZXMgdG8gaW1hZ2VzLlxuXHQvLyBSZXBsaWNhdGUgdGhpcyBidWcuXG5cblx0Ly9pZiAodGl0bGUgIT0gXCJcIikge1xuXHRcdHRpdGxlID0gdGl0bGUucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKTtcblx0XHR0aXRsZSA9IGVzY2FwZUNoYXJhY3RlcnModGl0bGUsXCIqX1wiKTtcblx0XHRyZXN1bHQgKz0gIFwiIHRpdGxlPVxcXCJcIiArIHRpdGxlICsgXCJcXFwiXCI7XG5cdC8vfVxuXG5cdHJlc3VsdCArPSBcIiAvPlwiO1xuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cblxudmFyIF9Eb0hlYWRlcnMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cblx0Ly8gU2V0ZXh0LXN0eWxlIGhlYWRlcnM6XG5cdC8vXHRIZWFkZXIgMVxuXHQvL1x0PT09PT09PT1cblx0Ly9cblx0Ly9cdEhlYWRlciAyXG5cdC8vXHQtLS0tLS0tLVxuXHQvL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKC4rKVsgXFx0XSpcXG49K1sgXFx0XSpcXG4rL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpe3JldHVybiBoYXNoQmxvY2soJzxoMSBpZD1cIicgKyBoZWFkZXJJZChtMSkgKyAnXCI+JyArIF9SdW5TcGFuR2FtdXQobTEpICsgXCI8L2gxPlwiKTt9KTtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKC4rKVsgXFx0XSpcXG4tK1sgXFx0XSpcXG4rL2dtLFxuXHRcdGZ1bmN0aW9uKG1hdGNoRm91bmQsbTEpe3JldHVybiBoYXNoQmxvY2soJzxoMiBpZD1cIicgKyBoZWFkZXJJZChtMSkgKyAnXCI+JyArIF9SdW5TcGFuR2FtdXQobTEpICsgXCI8L2gyPlwiKTt9KTtcblxuXHQvLyBhdHgtc3R5bGUgaGVhZGVyczpcblx0Ly8gICMgSGVhZGVyIDFcblx0Ly8gICMjIEhlYWRlciAyXG5cdC8vICAjIyBIZWFkZXIgMiB3aXRoIGNsb3NpbmcgaGFzaGVzICMjXG5cdC8vICAuLi5cblx0Ly8gICMjIyMjIyBIZWFkZXIgNlxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHReKFxcI3sxLDZ9KVx0XHRcdFx0Ly8gJDEgPSBzdHJpbmcgb2YgIydzXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoLis/KVx0XHRcdFx0XHQvLyAkMiA9IEhlYWRlciB0ZXh0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHRcXCMqXHRcdFx0XHRcdFx0Ly8gb3B0aW9uYWwgY2xvc2luZyAjJ3MgKG5vdCBjb3VudGVkKVxuXHRcdFx0XFxuK1xuXHRcdC9nbSwgZnVuY3Rpb24oKSB7Li4ufSk7XG5cdCovXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXihcXCN7MSw2fSlbIFxcdF0qKC4rPylbIFxcdF0qXFwjKlxcbisvZ20sXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGhfbGV2ZWwgPSBtMS5sZW5ndGg7XG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKFwiPGhcIiArIGhfbGV2ZWwgKyAnIGlkPVwiJyArIGhlYWRlcklkKG0yKSArICdcIj4nICsgX1J1blNwYW5HYW11dChtMikgKyBcIjwvaFwiICsgaF9sZXZlbCArIFwiPlwiKTtcblx0XHR9KTtcblxuXHRmdW5jdGlvbiBoZWFkZXJJZChtKSB7XG5cdFx0cmV0dXJuIG0ucmVwbGFjZSgvW15cXHddL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuXHR9XG5cdHJldHVybiB0ZXh0O1xufVxuXG4vLyBUaGlzIGRlY2xhcmF0aW9uIGtlZXBzIERvam8gY29tcHJlc3NvciBmcm9tIG91dHB1dHRpbmcgZ2FyYmFnZTpcbnZhciBfUHJvY2Vzc0xpc3RJdGVtcztcblxudmFyIF9Eb0xpc3RzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIEZvcm0gSFRNTCBvcmRlcmVkIChudW1iZXJlZCkgYW5kIHVub3JkZXJlZCAoYnVsbGV0ZWQpIGxpc3RzLlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IGFkZCBzZW50aW5lbCB0byBoYWNrIGFyb3VuZCBraHRtbC9zYWZhcmkgYnVnOlxuXHQvLyBodHRwOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xMTIzMVxuXHR0ZXh0ICs9IFwifjBcIjtcblxuXHQvLyBSZS11c2FibGUgcGF0dGVybiB0byBtYXRjaCBhbnkgZW50aXJlbCB1bCBvciBvbCBsaXN0OlxuXG5cdC8qXG5cdFx0dmFyIHdob2xlX2xpc3QgPSAvXG5cdFx0KFx0XHRcdFx0XHRcdFx0XHRcdC8vICQxID0gd2hvbGUgbGlzdFxuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkMlxuXHRcdFx0XHRbIF17MCwzfVx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0XHQoWyorLV18XFxkK1suXSlcdFx0XHRcdC8vICQzID0gZmlyc3QgbGlzdCBpdGVtIG1hcmtlclxuXHRcdFx0XHRbIFxcdF0rXG5cdFx0XHQpXG5cdFx0XHRbXlxccl0rP1xuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkNFxuXHRcdFx0XHR+MFx0XHRcdFx0XHRcdFx0Ly8gc2VudGluZWwgZm9yIHdvcmthcm91bmQ7IHNob3VsZCBiZSAkXG5cdFx0XHR8XG5cdFx0XHRcdFxcbnsyLH1cblx0XHRcdFx0KD89XFxTKVxuXHRcdFx0XHQoPyFcdFx0XHRcdFx0XHRcdC8vIE5lZ2F0aXZlIGxvb2thaGVhZCBmb3IgYW5vdGhlciBsaXN0IGl0ZW0gbWFya2VyXG5cdFx0XHRcdFx0WyBcXHRdKlxuXHRcdFx0XHRcdCg/OlsqKy1dfFxcZCtbLl0pWyBcXHRdK1xuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0KS9nXG5cdCovXG5cdHZhciB3aG9sZV9saXN0ID0gL14oKFsgXXswLDN9KFsqKy1dfFxcZCtbLl0pWyBcXHRdKylbXlxccl0rPyh+MHxcXG57Mix9KD89XFxTKSg/IVsgXFx0XSooPzpbKistXXxcXGQrWy5dKVsgXFx0XSspKSkvZ207XG5cblx0aWYgKGdfbGlzdF9sZXZlbCkge1xuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2Uod2hvbGVfbGlzdCxmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgbGlzdCA9IG0xO1xuXHRcdFx0dmFyIGxpc3RfdHlwZSA9IChtMi5zZWFyY2goL1sqKy1dL2cpPi0xKSA/IFwidWxcIiA6IFwib2xcIjtcblxuXHRcdFx0Ly8gVHVybiBkb3VibGUgcmV0dXJucyBpbnRvIHRyaXBsZSByZXR1cm5zLCBzbyB0aGF0IHdlIGNhbiBtYWtlIGFcblx0XHRcdC8vIHBhcmFncmFwaCBmb3IgdGhlIGxhc3QgaXRlbSBpbiBhIGxpc3QsIGlmIG5lY2Vzc2FyeTpcblx0XHRcdGxpc3QgPSBsaXN0LnJlcGxhY2UoL1xcbnsyLH0vZyxcIlxcblxcblxcblwiKTs7XG5cdFx0XHR2YXIgcmVzdWx0ID0gX1Byb2Nlc3NMaXN0SXRlbXMobGlzdCk7XG5cblx0XHRcdC8vIFRyaW0gYW55IHRyYWlsaW5nIHdoaXRlc3BhY2UsIHRvIHB1dCB0aGUgY2xvc2luZyBgPC8kbGlzdF90eXBlPmBcblx0XHRcdC8vIHVwIG9uIHRoZSBwcmVjZWRpbmcgbGluZSwgdG8gZ2V0IGl0IHBhc3QgdGhlIGN1cnJlbnQgc3R1cGlkXG5cdFx0XHQvLyBIVE1MIGJsb2NrIHBhcnNlci4gVGhpcyBpcyBhIGhhY2sgdG8gd29yayBhcm91bmQgdGhlIHRlcnJpYmxlXG5cdFx0XHQvLyBoYWNrIHRoYXQgaXMgdGhlIEhUTUwgYmxvY2sgcGFyc2VyLlxuXHRcdFx0cmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoL1xccyskLyxcIlwiKTtcblx0XHRcdHJlc3VsdCA9IFwiPFwiK2xpc3RfdHlwZStcIj5cIiArIHJlc3VsdCArIFwiPC9cIitsaXN0X3R5cGUrXCI+XFxuXCI7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHdob2xlX2xpc3QgPSAvKFxcblxcbnxeXFxuPykoKFsgXXswLDN9KFsqKy1dfFxcZCtbLl0pWyBcXHRdKylbXlxccl0rPyh+MHxcXG57Mix9KD89XFxTKSg/IVsgXFx0XSooPzpbKistXXxcXGQrWy5dKVsgXFx0XSspKSkvZztcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHdob2xlX2xpc3QsZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMykge1xuXHRcdFx0dmFyIHJ1bnVwID0gbTE7XG5cdFx0XHR2YXIgbGlzdCA9IG0yO1xuXG5cdFx0XHR2YXIgbGlzdF90eXBlID0gKG0zLnNlYXJjaCgvWyorLV0vZyk+LTEpID8gXCJ1bFwiIDogXCJvbFwiO1xuXHRcdFx0Ly8gVHVybiBkb3VibGUgcmV0dXJucyBpbnRvIHRyaXBsZSByZXR1cm5zLCBzbyB0aGF0IHdlIGNhbiBtYWtlIGFcblx0XHRcdC8vIHBhcmFncmFwaCBmb3IgdGhlIGxhc3QgaXRlbSBpbiBhIGxpc3QsIGlmIG5lY2Vzc2FyeTpcblx0XHRcdHZhciBsaXN0ID0gbGlzdC5yZXBsYWNlKC9cXG57Mix9L2csXCJcXG5cXG5cXG5cIik7O1xuXHRcdFx0dmFyIHJlc3VsdCA9IF9Qcm9jZXNzTGlzdEl0ZW1zKGxpc3QpO1xuXHRcdFx0cmVzdWx0ID0gcnVudXAgKyBcIjxcIitsaXN0X3R5cGUrXCI+XFxuXCIgKyByZXN1bHQgKyBcIjwvXCIrbGlzdF90eXBlK1wiPlxcblwiO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9KTtcblx0fVxuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5fUHJvY2Vzc0xpc3RJdGVtcyA9IGZ1bmN0aW9uKGxpc3Rfc3RyKSB7XG4vL1xuLy8gIFByb2Nlc3MgdGhlIGNvbnRlbnRzIG9mIGEgc2luZ2xlIG9yZGVyZWQgb3IgdW5vcmRlcmVkIGxpc3QsIHNwbGl0dGluZyBpdFxuLy8gIGludG8gaW5kaXZpZHVhbCBsaXN0IGl0ZW1zLlxuLy9cblx0Ly8gVGhlICRnX2xpc3RfbGV2ZWwgZ2xvYmFsIGtlZXBzIHRyYWNrIG9mIHdoZW4gd2UncmUgaW5zaWRlIGEgbGlzdC5cblx0Ly8gRWFjaCB0aW1lIHdlIGVudGVyIGEgbGlzdCwgd2UgaW5jcmVtZW50IGl0OyB3aGVuIHdlIGxlYXZlIGEgbGlzdCxcblx0Ly8gd2UgZGVjcmVtZW50LiBJZiBpdCdzIHplcm8sIHdlJ3JlIG5vdCBpbiBhIGxpc3QgYW55bW9yZS5cblx0Ly9cblx0Ly8gV2UgZG8gdGhpcyBiZWNhdXNlIHdoZW4gd2UncmUgbm90IGluc2lkZSBhIGxpc3QsIHdlIHdhbnQgdG8gdHJlYXRcblx0Ly8gc29tZXRoaW5nIGxpa2UgdGhpczpcblx0Ly9cblx0Ly8gICAgSSByZWNvbW1lbmQgdXBncmFkaW5nIHRvIHZlcnNpb25cblx0Ly8gICAgOC4gT29wcywgbm93IHRoaXMgbGluZSBpcyB0cmVhdGVkXG5cdC8vICAgIGFzIGEgc3ViLWxpc3QuXG5cdC8vXG5cdC8vIEFzIGEgc2luZ2xlIHBhcmFncmFwaCwgZGVzcGl0ZSB0aGUgZmFjdCB0aGF0IHRoZSBzZWNvbmQgbGluZSBzdGFydHNcblx0Ly8gd2l0aCBhIGRpZ2l0LXBlcmlvZC1zcGFjZSBzZXF1ZW5jZS5cblx0Ly9cblx0Ly8gV2hlcmVhcyB3aGVuIHdlJ3JlIGluc2lkZSBhIGxpc3QgKG9yIHN1Yi1saXN0KSwgdGhhdCBsaW5lIHdpbGwgYmVcblx0Ly8gdHJlYXRlZCBhcyB0aGUgc3RhcnQgb2YgYSBzdWItbGlzdC4gV2hhdCBhIGtsdWRnZSwgaHVoPyBUaGlzIGlzXG5cdC8vIGFuIGFzcGVjdCBvZiBNYXJrZG93bidzIHN5bnRheCB0aGF0J3MgaGFyZCB0byBwYXJzZSBwZXJmZWN0bHlcblx0Ly8gd2l0aG91dCByZXNvcnRpbmcgdG8gbWluZC1yZWFkaW5nLiBQZXJoYXBzIHRoZSBzb2x1dGlvbiBpcyB0b1xuXHQvLyBjaGFuZ2UgdGhlIHN5bnRheCBydWxlcyBzdWNoIHRoYXQgc3ViLWxpc3RzIG11c3Qgc3RhcnQgd2l0aCBhXG5cdC8vIHN0YXJ0aW5nIGNhcmRpbmFsIG51bWJlcjsgZS5nLiBcIjEuXCIgb3IgXCJhLlwiLlxuXG5cdGdfbGlzdF9sZXZlbCsrO1xuXG5cdC8vIHRyaW0gdHJhaWxpbmcgYmxhbmsgbGluZXM6XG5cdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvXFxuezIsfSQvLFwiXFxuXCIpO1xuXG5cdC8vIGF0dGFja2xhYjogYWRkIHNlbnRpbmVsIHRvIGVtdWxhdGUgXFx6XG5cdGxpc3Rfc3RyICs9IFwifjBcIjtcblxuXHQvKlxuXHRcdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvXG5cdFx0XHQoXFxuKT9cdFx0XHRcdFx0XHRcdC8vIGxlYWRpbmcgbGluZSA9ICQxXG5cdFx0XHQoXlsgXFx0XSopXHRcdFx0XHRcdFx0Ly8gbGVhZGluZyB3aGl0ZXNwYWNlID0gJDJcblx0XHRcdChbKistXXxcXGQrWy5dKSBbIFxcdF0rXHRcdFx0Ly8gbGlzdCBtYXJrZXIgPSAkM1xuXHRcdFx0KFteXFxyXSs/XHRcdFx0XHRcdFx0Ly8gbGlzdCBpdGVtIHRleHQgICA9ICQ0XG5cdFx0XHQoXFxuezEsMn0pKVxuXHRcdFx0KD89IFxcbiogKH4wIHwgXFwyIChbKistXXxcXGQrWy5dKSBbIFxcdF0rKSlcblx0XHQvZ20sIGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvKFxcbik/KF5bIFxcdF0qKShbKistXXxcXGQrWy5dKVsgXFx0XSsoW15cXHJdKz8oXFxuezEsMn0pKSg/PVxcbioofjB8XFwyKFsqKy1dfFxcZCtbLl0pWyBcXHRdKykpL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQpe1xuXHRcdFx0dmFyIGl0ZW0gPSBtNDtcblx0XHRcdHZhciBsZWFkaW5nX2xpbmUgPSBtMTtcblx0XHRcdHZhciBsZWFkaW5nX3NwYWNlID0gbTI7XG5cblx0XHRcdGlmIChsZWFkaW5nX2xpbmUgfHwgKGl0ZW0uc2VhcmNoKC9cXG57Mix9Lyk+LTEpKSB7XG5cdFx0XHRcdGl0ZW0gPSBfUnVuQmxvY2tHYW11dChfT3V0ZGVudChpdGVtKSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gUmVjdXJzaW9uIGZvciBzdWItbGlzdHM6XG5cdFx0XHRcdGl0ZW0gPSBfRG9MaXN0cyhfT3V0ZGVudChpdGVtKSk7XG5cdFx0XHRcdGl0ZW0gPSBpdGVtLnJlcGxhY2UoL1xcbiQvLFwiXCIpOyAvLyBjaG9tcChpdGVtKVxuXHRcdFx0XHRpdGVtID0gX1J1blNwYW5HYW11dChpdGVtKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuICBcIjxsaT5cIiArIGl0ZW0gKyBcIjwvbGk+XFxuXCI7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0bGlzdF9zdHIgPSBsaXN0X3N0ci5yZXBsYWNlKC9+MC9nLFwiXCIpO1xuXG5cdGdfbGlzdF9sZXZlbC0tO1xuXHRyZXR1cm4gbGlzdF9zdHI7XG59XG5cblxudmFyIF9Eb0NvZGVCbG9ja3MgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gIFByb2Nlc3MgTWFya2Rvd24gYDxwcmU+PGNvZGU+YCBibG9ja3MuXG4vL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSh0ZXh0LFxuXHRcdFx0Lyg/OlxcblxcbnxeKVxuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkMSA9IHRoZSBjb2RlIGJsb2NrIC0tIG9uZSBvciBtb3JlIGxpbmVzLCBzdGFydGluZyB3aXRoIGEgc3BhY2UvdGFiXG5cdFx0XHRcdCg/OlxuXHRcdFx0XHRcdCg/OlsgXXs0fXxcXHQpXHRcdFx0Ly8gTGluZXMgbXVzdCBzdGFydCB3aXRoIGEgdGFiIG9yIGEgdGFiLXdpZHRoIG9mIHNwYWNlcyAtIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblx0XHRcdFx0XHQuKlxcbitcblx0XHRcdFx0KStcblx0XHRcdClcblx0XHRcdChcXG4qWyBdezAsM31bXiBcXHRcXG5dfCg/PX4wKSlcdC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblx0XHQvZyxmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXG5cdC8vIGF0dGFja2xhYjogc2VudGluZWwgd29ya2Fyb3VuZHMgZm9yIGxhY2sgb2YgXFxBIGFuZCBcXFosIHNhZmFyaVxca2h0bWwgYnVnXG5cdHRleHQgKz0gXCJ+MFwiO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg/OlxcblxcbnxeKSgoPzooPzpbIF17NH18XFx0KS4qXFxuKykrKShcXG4qWyBdezAsM31bXiBcXHRcXG5dfCg/PX4wKSkvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgY29kZWJsb2NrID0gbTE7XG5cdFx0XHR2YXIgbmV4dENoYXIgPSBtMjtcblxuXHRcdFx0Y29kZWJsb2NrID0gX0VuY29kZUNvZGUoIF9PdXRkZW50KGNvZGVibG9jaykpO1xuXHRcdFx0Y29kZWJsb2NrID0gX0RldGFiKGNvZGVibG9jayk7XG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXlxcbisvZyxcIlwiKTsgLy8gdHJpbSBsZWFkaW5nIG5ld2xpbmVzXG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTsgLy8gdHJpbSB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cblx0XHRcdGNvZGVibG9jayA9IFwiPHByZT48Y29kZT5cIiArIGNvZGVibG9jayArIFwiXFxuPC9jb2RlPjwvcHJlPlwiO1xuXG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKGNvZGVibG9jaykgKyBuZXh0Q2hhcjtcblx0XHR9XG5cdCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC8sXCJcIik7XG5cblx0cmV0dXJuIHRleHQ7XG59O1xuXG52YXIgX0RvR2l0aHViQ29kZUJsb2NrcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgUHJvY2VzcyBHaXRodWItc3R5bGUgY29kZSBibG9ja3Ncbi8vICBFeGFtcGxlOlxuLy8gIGBgYHJ1Ynlcbi8vICBkZWYgaGVsbG9fd29ybGQoeClcbi8vICAgIHB1dHMgXCJIZWxsbywgI3t4fVwiXG4vLyAgZW5kXG4vLyAgYGBgXG4vL1xuXG5cblx0Ly8gYXR0YWNrbGFiOiBzZW50aW5lbCB3b3JrYXJvdW5kcyBmb3IgbGFjayBvZiBcXEEgYW5kIFxcWiwgc2FmYXJpXFxraHRtbCBidWdcblx0dGV4dCArPSBcIn4wXCI7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKD86XnxcXG4pYGBgKC4qKVxcbihbXFxzXFxTXSo/KVxcbmBgYC9nLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIpIHtcblx0XHRcdHZhciBsYW5ndWFnZSA9IG0xO1xuXHRcdFx0dmFyIGNvZGVibG9jayA9IG0yO1xuXG5cdFx0XHRjb2RlYmxvY2sgPSBfRW5jb2RlQ29kZShjb2RlYmxvY2spO1xuXHRcdFx0Y29kZWJsb2NrID0gX0RldGFiKGNvZGVibG9jayk7XG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXlxcbisvZyxcIlwiKTsgLy8gdHJpbSBsZWFkaW5nIG5ld2xpbmVzXG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTsgLy8gdHJpbSB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cblx0XHRcdGNvZGVibG9jayA9IFwiPHByZT48Y29kZVwiICsgKGxhbmd1YWdlID8gXCIgY2xhc3M9XFxcIlwiICsgbGFuZ3VhZ2UgKyAnXCInIDogXCJcIikgKyBcIj5cIiArIGNvZGVibG9jayArIFwiXFxuPC9jb2RlPjwvcHJlPlwiO1xuXG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKGNvZGVibG9jayk7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgaGFzaEJsb2NrID0gZnVuY3Rpb24odGV4dCkge1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXlxcbit8XFxuKyQpL2csXCJcIik7XG5cdHJldHVybiBcIlxcblxcbn5LXCIgKyAoZ19odG1sX2Jsb2Nrcy5wdXNoKHRleHQpLTEpICsgXCJLXFxuXFxuXCI7XG59XG5cbnZhciBfRG9Db2RlU3BhbnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gICAqICBCYWNrdGljayBxdW90ZXMgYXJlIHVzZWQgZm9yIDxjb2RlPjwvY29kZT4gc3BhbnMuXG4vL1xuLy8gICAqICBZb3UgY2FuIHVzZSBtdWx0aXBsZSBiYWNrdGlja3MgYXMgdGhlIGRlbGltaXRlcnMgaWYgeW91IHdhbnQgdG9cbi8vXHQgaW5jbHVkZSBsaXRlcmFsIGJhY2t0aWNrcyBpbiB0aGUgY29kZSBzcGFuLiBTbywgdGhpcyBpbnB1dDpcbi8vXG4vL1x0XHQgSnVzdCB0eXBlIGBgZm9vIGBiYXJgIGJhemBgIGF0IHRoZSBwcm9tcHQuXG4vL1xuLy9cdCAgIFdpbGwgdHJhbnNsYXRlIHRvOlxuLy9cbi8vXHRcdCA8cD5KdXN0IHR5cGUgPGNvZGU+Zm9vIGBiYXJgIGJhejwvY29kZT4gYXQgdGhlIHByb21wdC48L3A+XG4vL1xuLy9cdFRoZXJlJ3Mgbm8gYXJiaXRyYXJ5IGxpbWl0IHRvIHRoZSBudW1iZXIgb2YgYmFja3RpY2tzIHlvdVxuLy9cdGNhbiB1c2UgYXMgZGVsaW10ZXJzLiBJZiB5b3UgbmVlZCB0aHJlZSBjb25zZWN1dGl2ZSBiYWNrdGlja3Ncbi8vXHRpbiB5b3VyIGNvZGUsIHVzZSBmb3VyIGZvciBkZWxpbWl0ZXJzLCBldGMuXG4vL1xuLy8gICogIFlvdSBjYW4gdXNlIHNwYWNlcyB0byBnZXQgbGl0ZXJhbCBiYWNrdGlja3MgYXQgdGhlIGVkZ2VzOlxuLy9cbi8vXHRcdCAuLi4gdHlwZSBgYCBgYmFyYCBgYCAuLi5cbi8vXG4vL1x0ICAgVHVybnMgdG86XG4vL1xuLy9cdFx0IC4uLiB0eXBlIDxjb2RlPmBiYXJgPC9jb2RlPiAuLi5cbi8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHRcdChefFteXFxcXF0pXHRcdFx0XHRcdC8vIENoYXJhY3RlciBiZWZvcmUgb3BlbmluZyBgIGNhbid0IGJlIGEgYmFja3NsYXNoXG5cdFx0XHQoYCspXHRcdFx0XHRcdFx0Ly8gJDIgPSBPcGVuaW5nIHJ1biBvZiBgXG5cdFx0XHQoXHRcdFx0XHRcdFx0XHQvLyAkMyA9IFRoZSBjb2RlIGJsb2NrXG5cdFx0XHRcdFteXFxyXSo/XG5cdFx0XHRcdFteYF1cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB3b3JrIGFyb3VuZCBsYWNrIG9mIGxvb2tiZWhpbmRcblx0XHRcdClcblx0XHRcdFxcMlx0XHRcdFx0XHRcdFx0Ly8gTWF0Y2hpbmcgY2xvc2VyXG5cdFx0XHQoPyFgKVxuXHRcdC9nbSwgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXnxbXlxcXFxdKShgKykoW15cXHJdKj9bXmBdKVxcMig/IWApL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQpIHtcblx0XHRcdHZhciBjID0gbTM7XG5cdFx0XHRjID0gYy5yZXBsYWNlKC9eKFsgXFx0XSopL2csXCJcIik7XHQvLyBsZWFkaW5nIHdoaXRlc3BhY2Vcblx0XHRcdGMgPSBjLnJlcGxhY2UoL1sgXFx0XSokL2csXCJcIik7XHQvLyB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cdFx0XHRjID0gX0VuY29kZUNvZGUoYyk7XG5cdFx0XHRyZXR1cm4gbTErXCI8Y29kZT5cIitjK1wiPC9jb2RlPlwiO1xuXHRcdH0pO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0VuY29kZUNvZGUgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gRW5jb2RlL2VzY2FwZSBjZXJ0YWluIGNoYXJhY3RlcnMgaW5zaWRlIE1hcmtkb3duIGNvZGUgcnVucy5cbi8vIFRoZSBwb2ludCBpcyB0aGF0IGluIGNvZGUsIHRoZXNlIGNoYXJhY3RlcnMgYXJlIGxpdGVyYWxzLFxuLy8gYW5kIGxvc2UgdGhlaXIgc3BlY2lhbCBNYXJrZG93biBtZWFuaW5ncy5cbi8vXG5cdC8vIEVuY29kZSBhbGwgYW1wZXJzYW5kczsgSFRNTCBlbnRpdGllcyBhcmUgbm90XG5cdC8vIGVudGl0aWVzIHdpdGhpbiBhIE1hcmtkb3duIGNvZGUgc3Bhbi5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvJi9nLFwiJmFtcDtcIik7XG5cblx0Ly8gRG8gdGhlIGFuZ2xlIGJyYWNrZXQgc29uZyBhbmQgZGFuY2U6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwvZyxcIiZsdDtcIik7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLz4vZyxcIiZndDtcIik7XG5cblx0Ly8gTm93LCBlc2NhcGUgY2hhcmFjdGVycyB0aGF0IGFyZSBtYWdpYyBpbiBNYXJrZG93bjpcblx0dGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcIlxcKl97fVtdXFxcXFwiLGZhbHNlKTtcblxuLy8gamogdGhlIGxpbmUgYWJvdmUgYnJlYWtzIHRoaXM6XG4vLy0tLVxuXG4vLyogSXRlbVxuXG4vLyAgIDEuIFN1Yml0ZW1cblxuLy8gICAgICAgICAgICBzcGVjaWFsIGNoYXI6ICpcbi8vLS0tXG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9Eb0l0YWxpY3NBbmRCb2xkID0gZnVuY3Rpb24odGV4dCkge1xuXG5cdC8vIDxzdHJvbmc+IG11c3QgZ28gZmlyc3Q6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXCpcXCp8X18pKD89XFxTKShbXlxccl0qP1xcU1sqX10qKVxcMS9nLFxuXHRcdFwiPHN0cm9uZz4kMjwvc3Ryb25nPlwiKTtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFwqfF8pKD89XFxTKShbXlxccl0qP1xcUylcXDEvZyxcblx0XHRcIjxlbT4kMjwvZW0+XCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRG9CbG9ja1F1b3RlcyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gV3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0KFxuXHRcdFx0XHReWyBcXHRdKj5bIFxcdF0/XHRcdFx0Ly8gJz4nIGF0IHRoZSBzdGFydCBvZiBhIGxpbmVcblx0XHRcdFx0LitcXG5cdFx0XHRcdFx0Ly8gcmVzdCBvZiB0aGUgZmlyc3QgbGluZVxuXHRcdFx0XHQoLitcXG4pKlx0XHRcdFx0XHQvLyBzdWJzZXF1ZW50IGNvbnNlY3V0aXZlIGxpbmVzXG5cdFx0XHRcdFxcbipcdFx0XHRcdFx0XHQvLyBibGFua3Ncblx0XHRcdCkrXG5cdFx0KVxuXHRcdC9nbSwgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oKF5bIFxcdF0qPlsgXFx0XT8uK1xcbiguK1xcbikqXFxuKikrKS9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHR2YXIgYnEgPSBtMTtcblxuXHRcdFx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHRcdFx0Ly8gXCItLS0tLS0tLS0tYnVnXCIucmVwbGFjZSgvXi0vZyxcIlwiKSA9PSBcImJ1Z1wiXG5cblx0XHRcdGJxID0gYnEucmVwbGFjZSgvXlsgXFx0XSo+WyBcXHRdPy9nbSxcIn4wXCIpO1x0Ly8gdHJpbSBvbmUgbGV2ZWwgb2YgcXVvdGluZ1xuXG5cdFx0XHQvLyBhdHRhY2tsYWI6IGNsZWFuIHVwIGhhY2tcblx0XHRcdGJxID0gYnEucmVwbGFjZSgvfjAvZyxcIlwiKTtcblxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKC9eWyBcXHRdKyQvZ20sXCJcIik7XHRcdC8vIHRyaW0gd2hpdGVzcGFjZS1vbmx5IGxpbmVzXG5cdFx0XHRicSA9IF9SdW5CbG9ja0dhbXV0KGJxKTtcdFx0XHRcdC8vIHJlY3Vyc2VcblxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKC8oXnxcXG4pL2csXCIkMSAgXCIpO1xuXHRcdFx0Ly8gVGhlc2UgbGVhZGluZyBzcGFjZXMgc2NyZXcgd2l0aCA8cHJlPiBjb250ZW50LCBzbyB3ZSBuZWVkIHRvIGZpeCB0aGF0OlxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKFxuXHRcdFx0XHRcdC8oXFxzKjxwcmU+W15cXHJdKz88XFwvcHJlPikvZ20sXG5cdFx0XHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0XHRcdFx0XHR2YXIgcHJlID0gbTE7XG5cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHRcdFx0XHRcdHByZSA9IHByZS5yZXBsYWNlKC9eICAvbWcsXCJ+MFwiKTtcblx0XHRcdFx0XHRwcmUgPSBwcmUucmVwbGFjZSgvfjAvZyxcIlwiKTtcblx0XHRcdFx0XHRyZXR1cm4gcHJlO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhcIjxibG9ja3F1b3RlPlxcblwiICsgYnEgKyBcIlxcbjwvYmxvY2txdW90ZT5cIik7XG5cdFx0fSk7XG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRm9ybVBhcmFncmFwaHMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gIFBhcmFtczpcbi8vICAgICR0ZXh0IC0gc3RyaW5nIHRvIHByb2Nlc3Mgd2l0aCBodG1sIDxwPiB0YWdzXG4vL1xuXG5cdC8vIFN0cmlwIGxlYWRpbmcgYW5kIHRyYWlsaW5nIGxpbmVzOlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eXFxuKy9nLFwiXCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLFwiXCIpO1xuXG5cdHZhciBncmFmcyA9IHRleHQuc3BsaXQoL1xcbnsyLH0vZyk7XG5cdHZhciBncmFmc091dCA9IG5ldyBBcnJheSgpO1xuXG5cdC8vXG5cdC8vIFdyYXAgPHA+IHRhZ3MuXG5cdC8vXG5cdHZhciBlbmQgPSBncmFmcy5sZW5ndGg7XG5cdGZvciAodmFyIGk9MDsgaTxlbmQ7IGkrKykge1xuXHRcdHZhciBzdHIgPSBncmFmc1tpXTtcblxuXHRcdC8vIGlmIHRoaXMgaXMgYW4gSFRNTCBtYXJrZXIsIGNvcHkgaXRcblx0XHRpZiAoc3RyLnNlYXJjaCgvfksoXFxkKylLL2cpID49IDApIHtcblx0XHRcdGdyYWZzT3V0LnB1c2goc3RyKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoc3RyLnNlYXJjaCgvXFxTLykgPj0gMCkge1xuXHRcdFx0c3RyID0gX1J1blNwYW5HYW11dChzdHIpO1xuXHRcdFx0c3RyID0gc3RyLnJlcGxhY2UoL14oWyBcXHRdKikvZyxcIjxwPlwiKTtcblx0XHRcdHN0ciArPSBcIjwvcD5cIlxuXHRcdFx0Z3JhZnNPdXQucHVzaChzdHIpO1xuXHRcdH1cblxuXHR9XG5cblx0Ly9cblx0Ly8gVW5oYXNoaWZ5IEhUTUwgYmxvY2tzXG5cdC8vXG5cdGVuZCA9IGdyYWZzT3V0Lmxlbmd0aDtcblx0Zm9yICh2YXIgaT0wOyBpPGVuZDsgaSsrKSB7XG5cdFx0Ly8gaWYgdGhpcyBpcyBhIG1hcmtlciBmb3IgYW4gaHRtbCBibG9jay4uLlxuXHRcdHdoaWxlIChncmFmc091dFtpXS5zZWFyY2goL35LKFxcZCspSy8pID49IDApIHtcblx0XHRcdHZhciBibG9ja1RleHQgPSBnX2h0bWxfYmxvY2tzW1JlZ0V4cC4kMV07XG5cdFx0XHRibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFwkL2csXCIkJCQkXCIpOyAvLyBFc2NhcGUgYW55IGRvbGxhciBzaWduc1xuXHRcdFx0Z3JhZnNPdXRbaV0gPSBncmFmc091dFtpXS5yZXBsYWNlKC9+S1xcZCtLLyxibG9ja1RleHQpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBncmFmc091dC5qb2luKFwiXFxuXFxuXCIpO1xufVxuXG5cbnZhciBfRW5jb2RlQW1wc0FuZEFuZ2xlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vIFNtYXJ0IHByb2Nlc3NpbmcgZm9yIGFtcGVyc2FuZHMgYW5kIGFuZ2xlIGJyYWNrZXRzIHRoYXQgbmVlZCB0byBiZSBlbmNvZGVkLlxuXG5cdC8vIEFtcGVyc2FuZC1lbmNvZGluZyBiYXNlZCBlbnRpcmVseSBvbiBOYXQgSXJvbnMncyBBbXB1dGF0b3IgTVQgcGx1Z2luOlxuXHQvLyAgIGh0dHA6Ly9idW1wcG8ubmV0L3Byb2plY3RzL2FtcHV0YXRvci9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvJig/ISM/W3hYXT8oPzpbMC05YS1mQS1GXSt8XFx3Kyk7KS9nLFwiJmFtcDtcIik7XG5cblx0Ly8gRW5jb2RlIG5ha2VkIDwnc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KD8hW2EtelxcLz9cXCQhXSkvZ2ksXCImbHQ7XCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRW5jb2RlQmFja3NsYXNoRXNjYXBlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgIFBhcmFtZXRlcjogIFN0cmluZy5cbi8vICAgUmV0dXJuczpcdFRoZSBzdHJpbmcsIHdpdGggYWZ0ZXIgcHJvY2Vzc2luZyB0aGUgZm9sbG93aW5nIGJhY2tzbGFzaFxuLy9cdFx0XHQgICBlc2NhcGUgc2VxdWVuY2VzLlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IFRoZSBwb2xpdGUgd2F5IHRvIGRvIHRoaXMgaXMgd2l0aCB0aGUgbmV3XG5cdC8vIGVzY2FwZUNoYXJhY3RlcnMoKSBmdW5jdGlvbjpcblx0Ly9cblx0Ly8gXHR0ZXh0ID0gZXNjYXBlQ2hhcmFjdGVycyh0ZXh0LFwiXFxcXFwiLHRydWUpO1xuXHQvLyBcdHRleHQgPSBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsXCJgKl97fVtdKCk+IystLiFcIix0cnVlKTtcblx0Ly9cblx0Ly8gLi4uYnV0IHdlJ3JlIHNpZGVzdGVwcGluZyBpdHMgdXNlIG9mIHRoZSAoc2xvdykgUmVnRXhwIGNvbnN0cnVjdG9yXG5cdC8vIGFzIGFuIG9wdGltaXphdGlvbiBmb3IgRmlyZWZveC4gIFRoaXMgZnVuY3Rpb24gZ2V0cyBjYWxsZWQgYSBMT1QuXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxcXChcXFxcKS9nLGVzY2FwZUNoYXJhY3RlcnNfY2FsbGJhY2spO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXFxcKFtgKl97fVxcW1xcXSgpPiMrLS4hXSkvZyxlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrKTtcblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9Eb0F1dG9MaW5rcyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KChodHRwcz98ZnRwfGRpY3QpOlteJ1wiPlxcc10rKT4vZ2ksXCI8YSBocmVmPVxcXCIkMVxcXCI+JDE8L2E+XCIpO1xuXG5cdC8vIEVtYWlsIGFkZHJlc3NlczogPGFkZHJlc3NAZG9tYWluLmZvbz5cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0PFxuXHRcdFx0KD86bWFpbHRvOik/XG5cdFx0XHQoXG5cdFx0XHRcdFstLlxcd10rXG5cdFx0XHRcdFxcQFxuXHRcdFx0XHRbLWEtejAtOV0rKFxcLlstYS16MC05XSspKlxcLlthLXpdK1xuXHRcdFx0KVxuXHRcdFx0PlxuXHRcdC9naSwgX0RvQXV0b0xpbmtzX2NhbGxiYWNrKCkpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KD86bWFpbHRvOik/KFstLlxcd10rXFxAWy1hLXowLTldKyhcXC5bLWEtejAtOV0rKSpcXC5bYS16XSspPi9naSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHRyZXR1cm4gX0VuY29kZUVtYWlsQWRkcmVzcyggX1VuZXNjYXBlU3BlY2lhbENoYXJzKG0xKSApO1xuXHRcdH1cblx0KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0VuY29kZUVtYWlsQWRkcmVzcyA9IGZ1bmN0aW9uKGFkZHIpIHtcbi8vXG4vLyAgSW5wdXQ6IGFuIGVtYWlsIGFkZHJlc3MsIGUuZy4gXCJmb29AZXhhbXBsZS5jb21cIlxuLy9cbi8vICBPdXRwdXQ6IHRoZSBlbWFpbCBhZGRyZXNzIGFzIGEgbWFpbHRvIGxpbmssIHdpdGggZWFjaCBjaGFyYWN0ZXJcbi8vXHRvZiB0aGUgYWRkcmVzcyBlbmNvZGVkIGFzIGVpdGhlciBhIGRlY2ltYWwgb3IgaGV4IGVudGl0eSwgaW5cbi8vXHR0aGUgaG9wZXMgb2YgZm9pbGluZyBtb3N0IGFkZHJlc3MgaGFydmVzdGluZyBzcGFtIGJvdHMuIEUuZy46XG4vL1xuLy9cdDxhIGhyZWY9XCImI3g2RDsmIzk3OyYjMTA1OyYjMTA4OyYjeDc0OyYjMTExOzomIzEwMjsmIzExMTsmIzExMTsmIzY0OyYjMTAxO1xuLy9cdCAgIHgmI3g2MTsmIzEwOTsmI3g3MDsmIzEwODsmI3g2NTsmI3gyRTsmIzk5OyYjMTExOyYjMTA5O1wiPiYjMTAyOyYjMTExOyYjMTExO1xuLy9cdCAgICYjNjQ7JiMxMDE7eCYjeDYxOyYjMTA5OyYjeDcwOyYjMTA4OyYjeDY1OyYjeDJFOyYjOTk7JiMxMTE7JiMxMDk7PC9hPlxuLy9cbi8vICBCYXNlZCBvbiBhIGZpbHRlciBieSBNYXR0aGV3IFdpY2tsaW5lLCBwb3N0ZWQgdG8gdGhlIEJCRWRpdC1UYWxrXG4vLyAgbWFpbGluZyBsaXN0OiA8aHR0cDovL3Rpbnl1cmwuY29tL3l1N3VlPlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IHdoeSBjYW4ndCBqYXZhc2NyaXB0IHNwZWFrIGhleD9cblx0ZnVuY3Rpb24gY2hhcjJoZXgoY2gpIHtcblx0XHR2YXIgaGV4RGlnaXRzID0gJzAxMjM0NTY3ODlBQkNERUYnO1xuXHRcdHZhciBkZWMgPSBjaC5jaGFyQ29kZUF0KDApO1xuXHRcdHJldHVybihoZXhEaWdpdHMuY2hhckF0KGRlYz4+NCkgKyBoZXhEaWdpdHMuY2hhckF0KGRlYyYxNSkpO1xuXHR9XG5cblx0dmFyIGVuY29kZSA9IFtcblx0XHRmdW5jdGlvbihjaCl7cmV0dXJuIFwiJiNcIitjaC5jaGFyQ29kZUF0KDApK1wiO1wiO30sXG5cdFx0ZnVuY3Rpb24oY2gpe3JldHVybiBcIiYjeFwiK2NoYXIyaGV4KGNoKStcIjtcIjt9LFxuXHRcdGZ1bmN0aW9uKGNoKXtyZXR1cm4gY2g7fVxuXHRdO1xuXG5cdGFkZHIgPSBcIm1haWx0bzpcIiArIGFkZHI7XG5cblx0YWRkciA9IGFkZHIucmVwbGFjZSgvLi9nLCBmdW5jdGlvbihjaCkge1xuXHRcdGlmIChjaCA9PSBcIkBcIikge1xuXHRcdCAgIFx0Ly8gdGhpcyAqbXVzdCogYmUgZW5jb2RlZC4gSSBpbnNpc3QuXG5cdFx0XHRjaCA9IGVuY29kZVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMildKGNoKTtcblx0XHR9IGVsc2UgaWYgKGNoICE9XCI6XCIpIHtcblx0XHRcdC8vIGxlYXZlICc6JyBhbG9uZSAodG8gc3BvdCBtYWlsdG86IGxhdGVyKVxuXHRcdFx0dmFyIHIgPSBNYXRoLnJhbmRvbSgpO1xuXHRcdFx0Ly8gcm91Z2hseSAxMCUgcmF3LCA0NSUgaGV4LCA0NSUgZGVjXG5cdFx0XHRjaCA9ICAoXG5cdFx0XHRcdFx0ciA+IC45ICA/XHRlbmNvZGVbMl0oY2gpICAgOlxuXHRcdFx0XHRcdHIgPiAuNDUgP1x0ZW5jb2RlWzFdKGNoKSAgIDpcblx0XHRcdFx0XHRcdFx0XHRlbmNvZGVbMF0oY2gpXG5cdFx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBjaDtcblx0fSk7XG5cblx0YWRkciA9IFwiPGEgaHJlZj1cXFwiXCIgKyBhZGRyICsgXCJcXFwiPlwiICsgYWRkciArIFwiPC9hPlwiO1xuXHRhZGRyID0gYWRkci5yZXBsYWNlKC9cIj4uKzovZyxcIlxcXCI+XCIpOyAvLyBzdHJpcCB0aGUgbWFpbHRvOiBmcm9tIHRoZSB2aXNpYmxlIHBhcnRcblxuXHRyZXR1cm4gYWRkcjtcbn1cblxuXG52YXIgX1VuZXNjYXBlU3BlY2lhbENoYXJzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFN3YXAgYmFjayBpbiBhbGwgdGhlIHNwZWNpYWwgY2hhcmFjdGVycyB3ZSd2ZSBoaWRkZW4uXG4vL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+RShcXGQrKUUvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHR2YXIgY2hhckNvZGVUb1JlcGxhY2UgPSBwYXJzZUludChtMSk7XG5cdFx0XHRyZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZVRvUmVwbGFjZSk7XG5cdFx0fVxuXHQpO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX091dGRlbnQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gUmVtb3ZlIG9uZSBsZXZlbCBvZiBsaW5lLWxlYWRpbmcgdGFicyBvciBzcGFjZXNcbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHQvLyBcIi0tLS0tLS0tLS1idWdcIi5yZXBsYWNlKC9eLS9nLFwiXCIpID09IFwiYnVnXCJcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKFxcdHxbIF17MSw0fSkvZ20sXCJ+MFwiKTsgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXG5cdC8vIGF0dGFja2xhYjogY2xlYW4gdXAgaGFja1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC9nLFwiXCIpXG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBfRGV0YWIgPSBmdW5jdGlvbih0ZXh0KSB7XG4vLyBhdHRhY2tsYWI6IERldGFiJ3MgY29tcGxldGVseSByZXdyaXR0ZW4gZm9yIHNwZWVkLlxuLy8gSW4gcGVybCB3ZSBjb3VsZCBmaXggaXQgYnkgYW5jaG9yaW5nIHRoZSByZWdleHAgd2l0aCBcXEcuXG4vLyBJbiBqYXZhc2NyaXB0IHdlJ3JlIGxlc3MgZm9ydHVuYXRlLlxuXG5cdC8vIGV4cGFuZCBmaXJzdCBuLTEgdGFic1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHQoPz1cXHQpL2csXCIgICAgXCIpOyAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cblx0Ly8gcmVwbGFjZSB0aGUgbnRoIHdpdGggdHdvIHNlbnRpbmVsc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHQvZyxcIn5BfkJcIik7XG5cblx0Ly8gdXNlIHRoZSBzZW50aW5lbCB0byBhbmNob3Igb3VyIHJlZ2V4IHNvIGl0IGRvZXNuJ3QgZXhwbG9kZVxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+QiguKz8pfkEvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgbGVhZGluZ1RleHQgPSBtMTtcblx0XHRcdHZhciBudW1TcGFjZXMgPSA0IC0gbGVhZGluZ1RleHQubGVuZ3RoICUgNDsgIC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblxuXHRcdFx0Ly8gdGhlcmUgKm11c3QqIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzOlxuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPG51bVNwYWNlczsgaSsrKSBsZWFkaW5nVGV4dCs9XCIgXCI7XG5cblx0XHRcdHJldHVybiBsZWFkaW5nVGV4dDtcblx0XHR9XG5cdCk7XG5cblx0Ly8gY2xlYW4gdXAgc2VudGluZWxzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL35BL2csXCIgICAgXCIpOyAgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+Qi9nLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbi8vXG4vLyAgYXR0YWNrbGFiOiBVdGlsaXR5IGZ1bmN0aW9uc1xuLy9cblxuXG52YXIgZXNjYXBlQ2hhcmFjdGVycyA9IGZ1bmN0aW9uKHRleHQsIGNoYXJzVG9Fc2NhcGUsIGFmdGVyQmFja3NsYXNoKSB7XG5cdC8vIEZpcnN0IHdlIGhhdmUgdG8gZXNjYXBlIHRoZSBlc2NhcGUgY2hhcmFjdGVycyBzbyB0aGF0XG5cdC8vIHdlIGNhbiBidWlsZCBhIGNoYXJhY3RlciBjbGFzcyBvdXQgb2YgdGhlbVxuXHR2YXIgcmVnZXhTdHJpbmcgPSBcIihbXCIgKyBjaGFyc1RvRXNjYXBlLnJlcGxhY2UoLyhbXFxbXFxdXFxcXF0pL2csXCJcXFxcJDFcIikgKyBcIl0pXCI7XG5cblx0aWYgKGFmdGVyQmFja3NsYXNoKSB7XG5cdFx0cmVnZXhTdHJpbmcgPSBcIlxcXFxcXFxcXCIgKyByZWdleFN0cmluZztcblx0fVxuXG5cdHZhciByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHJpbmcsXCJnXCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlZ2V4LGVzY2FwZUNoYXJhY3RlcnNfY2FsbGJhY2spO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrID0gZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHR2YXIgY2hhckNvZGVUb0VzY2FwZSA9IG0xLmNoYXJDb2RlQXQoMCk7XG5cdHJldHVybiBcIn5FXCIrY2hhckNvZGVUb0VzY2FwZStcIkVcIjtcbn1cblxufSAvLyBlbmQgb2YgU2hvd2Rvd24uY29udmVydGVyXG5cbi8vIGV4cG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSBtb2R1bGUuZXhwb3J0cyA9IFNob3dkb3duO1xuXG59KSgpIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe2lmICghcHJvY2Vzcy5FdmVudEVtaXR0ZXIpIHByb2Nlc3MuRXZlbnRFbWl0dGVyID0gZnVuY3Rpb24gKCkge307XG5cbnZhciBFdmVudEVtaXR0ZXIgPSBleHBvcnRzLkV2ZW50RW1pdHRlciA9IHByb2Nlc3MuRXZlbnRFbWl0dGVyO1xudmFyIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gQXJyYXkuaXNBcnJheVxuICAgIDogZnVuY3Rpb24gKHhzKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nXG4gICAgfVxuO1xuZnVuY3Rpb24gaW5kZXhPZiAoeHMsIHgpIHtcbiAgICBpZiAoeHMuaW5kZXhPZikgcmV0dXJuIHhzLmluZGV4T2YoeCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoeCA9PT0geHNbaV0pIHJldHVybiBpO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW5cbi8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuLy8gaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG4vL1xuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbnZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzID0gbjtcbn07XG5cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNBcnJheSh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSlcbiAgICB7XG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgYXJndW1lbnRzWzFdOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gZmFsc2U7XG4gIHZhciBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBpZiAoIWhhbmRsZXIpIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGhhbmRsZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoaXNBcnJheShoYW5kbGVyKSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIHZhciBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vLyBFdmVudEVtaXR0ZXIgaXMgZGVmaW5lZCBpbiBzcmMvbm9kZV9ldmVudHMuY2Ncbi8vIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCgpIGlzIGFsc28gZGVmaW5lZCB0aGVyZS5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhZGRMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT0gXCJuZXdMaXN0ZW5lcnNcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXG4gIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgICB2YXIgbTtcbiAgICAgIGlmICh0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbSA9IHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtID0gZGVmYXVsdE1heExpc3RlbmVycztcbiAgICAgIH1cblxuICAgICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYub24odHlwZSwgZnVuY3Rpb24gZygpIHtcbiAgICBzZWxmLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZUxpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzQXJyYXkobGlzdCkpIHtcbiAgICB2YXIgaSA9IGluZGV4T2YobGlzdCwgbGlzdGVuZXIpO1xuICAgIGlmIChpIDwgMCkgcmV0dXJuIHRoaXM7XG4gICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgaWYgKGxpc3QubGVuZ3RoID09IDApXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9IGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSA9PT0gbGlzdGVuZXIpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAodHlwZSAmJiB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcbiAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgfVxuICByZXR1cm4gdGhpcy5fZXZlbnRzW3R5cGVdO1xufTtcblxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYuc291cmNlID09PSB3aW5kb3cgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwie0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlICdldmVudHMnXG5cbmJhc2U2NCA9IHJlcXVpcmUgJy4uL2xpYi9iYXNlNjQnXG4jbHp3ID0gcmVxdWlyZSAnLi4vbGliL2x6dydcblxucm5kID0gLT4gRGF0ZS5ub3coKSArICctJyArXG4gICgnMDEyMzQ1Njc4OWFiY2RlZidbTWF0aC5yYW5kb20oKSAqIDE2IHwgMF0gZm9yIHggaW4gWzAuLjEwXSkuam9pbiAnJ1xuXG5kZXNlcmlhbGl6ZSA9IC0+XG4gIFt0eXBlLCBpZF0gPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSkuc3BsaXQgJy8nLCAyXG4gIHsgdHlwZSwgaWQgfVxuc2VyaWFsaXplID0gKGRhdGEpIC0+IHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyMnK2RhdGEudHlwZSsnLycrZGF0YS5pZFxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlID0gbmV3IEV2ZW50RW1pdHRlclxuXG5zdGF0ZS5zdG9yZVR5cGUgPSAnYmFzZTY0J1xuc3RhdGUuc3RvcmVJZCA9ICcnXG5cbnN0YXRlLnN0b3JlcyA9XG4gICNsenc6XG4gICMgIHN0b3JlOiAoZGF0YSwgZm4pIC0+IGZuIGJhc2U2NC5lbmNvZGUgbHp3LmVuY29kZSBkYXRhXG4gICMgIHJlc3RvcmU6IChkYXRhLCBmbikgLT4gZm4gbHp3LmRlY29kZSBiYXNlNjQuZGVjb2RlIGRhdGFcbiAgYmFzZTY0OlxuICAgIHN0b3JlOiAoaWQsIGRhdGEsIGNhbGxiYWNrKSAtPlxuICAgICAgY2FsbGJhY2sgYmFzZTY0LmVuY29kZSBKU09OLnN0cmluZ2lmeShkYXRhIG9yICd7fScpXG4gICAgcmVzdG9yZTogKGlkLCBjYWxsYmFjaykgLT5cbiAgICAgIGNhbGxiYWNrIEpTT04ucGFyc2UgYmFzZTY0LmRlY29kZShpZCkgb3IgJ3t9J1xuICBsb2NhbFN0b3JhZ2U6XG4gICAgc3RvcmU6IChpZCwgZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgICBpZCA/PSBybmQoKVxuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtIGlkLCBKU09OLnN0cmluZ2lmeShkYXRhIG9yICd7fScpXG4gICAgICBjYWxsYmFjayBpZFxuICAgIHJlc3RvcmU6IChpZCwgY2FsbGJhY2spIC0+XG4gICAgICBjYWxsYmFjayBKU09OLnBhcnNlIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSBpZFxuXG5zdGF0ZS5zdG9yZSA9IChzdG9yZVR5cGUsIGRhdGEsIGNhbGxiYWNrKSAtPlxuICBzdGF0ZS5zdG9yZVR5cGUgPSBzdG9yZVR5cGUgaWYgc3RvcmVUeXBlXG4gIHN0YXRlLnN0b3Jlc1tzdGF0ZS5zdG9yZVR5cGVdLnN0b3JlIHN0YXRlLnN0b3JlSWQsIGRhdGEsIChzdG9yZUlkKS0+XG4gICAgc3RhdGUuc3RvcmVJZCA9IHN0b3JlSWRcbiAgICBzZXJpYWxpemUgdHlwZTpzdGF0ZS5zdG9yZVR5cGUsIGlkOnN0b3JlSWRcbiAgICAjd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlIHt9LCAnJywgdHlwZSsnLycraWRcbiAgICBjYWxsYmFjaz8gc3RvcmVJZFxuXG5zdGF0ZS5yZXN0b3JlID0gKHN0b3JlVHlwZSwgc3RvcmVJZCwgY2FsbGJhY2spIC0+XG4gIGlmIG5vdCBzdG9yZVR5cGU/IGFuZCBub3Qgc3RvcmVJZD9cbiAgICB7IHR5cGU6c3RvcmVUeXBlLCBpZDpzdG9yZUlkIH0gPSBkZXNlcmlhbGl6ZSgpXG4gIHN0YXRlLnN0b3JlVHlwZSA9IHN0b3JlVHlwZSBpZiBzdG9yZVR5cGVcbiAgc3RhdGUuc3RvcmVJZCA9IHN0b3JlSWRcbiAgaWYgc3RvcmVJZD9cbiAgICBzdGF0ZS5zdG9yZXNbc3RhdGUuc3RvcmVUeXBlXS5yZXN0b3JlIHN0YXRlLnN0b3JlSWQsIChkYXRhKSAtPlxuICAgICAgY2FsbGJhY2sgZGF0YVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAnaGFzaGNoYW5nZScsIC0+XG4gIHsgdHlwZTpzdG9yZVR5cGUsIGlkOnN0b3JlSWQgfSA9IGRlc2VyaWFsaXplKClcbiAgaWYgc3RvcmVUeXBlIGlzbnQgc3RhdGUuc3RvcmVUeXBlIG9yIHN0b3JlSWQgaXNudCBzdGF0ZS5zdG9yZUlkXG4gICAgc3RhdGUucmVzdG9yZSBzdG9yZVR5cGUsIHN0b3JlSWQsIChkYXRhKSAtPlxuICAgICAgc3RvcmUuZW1pdCAncmVzdG9yZScsIGRhdGFcbiIsIi8qKlxuICpcbiAqICBiYXNlNjQgZW5jb2RlIC8gZGVjb2RlXG4gKiAgaHR0cDovL3d3dy53ZWJ0b29sa2l0LmluZm8vXG4gKlxuICoqL1xuXG52YXIgYmFzZTY0ID0ge1xuXG4gIC8vIHByaXZhdGUgcHJvcGVydHlcbiAgX2tleVN0ciA6IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIixcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBlbmNvZGluZ1xuICBlbmNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMywgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGJhc2U2NC5fdXRmOF9lbmNvZGUoaW5wdXQpO1xuXG4gICAgd2hpbGUgKGkgPCBpbnB1dC5sZW5ndGgpIHtcblxuICAgICAgY2hyMSA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgIGNocjIgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIzID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICBlbmMxID0gY2hyMSA+PiAyO1xuICAgICAgZW5jMiA9ICgoY2hyMSAmIDMpIDw8IDQpIHwgKGNocjIgPj4gNCk7XG4gICAgICBlbmMzID0gKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNik7XG4gICAgICBlbmM0ID0gY2hyMyAmIDYzO1xuXG4gICAgICBpZiAoaXNOYU4oY2hyMikpIHtcbiAgICAgICAgZW5jMyA9IGVuYzQgPSA2NDtcbiAgICAgIH0gZWxzZSBpZiAoaXNOYU4oY2hyMykpIHtcbiAgICAgICAgZW5jNCA9IDY0O1xuICAgICAgfVxuXG4gICAgICBvdXRwdXQgPSBvdXRwdXQgK1xuICAgICAgICB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzEpICsgdGhpcy5fa2V5U3RyLmNoYXJBdChlbmMyKSArXG4gICAgICAgIHRoaXMuX2tleVN0ci5jaGFyQXQoZW5jMykgKyB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzQpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSxcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBkZWNvZGluZ1xuICBkZWNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMztcbiAgICB2YXIgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXFw9XS9nLCBcIlwiKTtcblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG5cbiAgICAgIGVuYzEgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG4gICAgICBlbmMyID0gdGhpcy5fa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuICAgICAgZW5jMyA9IHRoaXMuX2tleVN0ci5pbmRleE9mKGlucHV0LmNoYXJBdChpKyspKTtcbiAgICAgIGVuYzQgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG5cbiAgICAgIGNocjEgPSAoZW5jMSA8PCAyKSB8IChlbmMyID4+IDQpO1xuICAgICAgY2hyMiA9ICgoZW5jMiAmIDE1KSA8PCA0KSB8IChlbmMzID4+IDIpO1xuICAgICAgY2hyMyA9ICgoZW5jMyAmIDMpIDw8IDYpIHwgZW5jNDtcblxuICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIxKTtcblxuICAgICAgaWYgKGVuYzMgIT0gNjQpIHtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIyKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmM0ICE9IDY0KSB7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dCArIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyMyk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBvdXRwdXQgPSBiYXNlNjQuX3V0ZjhfZGVjb2RlKG91dHB1dCk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuXG4gIH0sXG5cbiAgLy8gcHJpdmF0ZSBtZXRob2QgZm9yIFVURi04IGVuY29kaW5nXG4gIF91dGY4X2VuY29kZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7XG4gICAgdmFyIHV0ZnRleHQgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCBzdHJpbmcubGVuZ3RoOyBuKyspIHtcblxuICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChuKTtcblxuICAgICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZigoYyA+IDEyNykgJiYgKGMgPCAyMDQ4KSkge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gNikgfCAxOTIpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiAxMikgfCAyMjQpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjID4+IDYpICYgNjMpIHwgMTI4KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB1dGZ0ZXh0O1xuICB9LFxuXG4gIC8vIHByaXZhdGUgbWV0aG9kIGZvciBVVEYtOCBkZWNvZGluZ1xuICBfdXRmOF9kZWNvZGUgOiBmdW5jdGlvbiAodXRmdGV4dCkge1xuICAgIHZhciBzdHJpbmcgPSBcIlwiO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgYyA9IGMxID0gYzIgPSAwO1xuXG4gICAgd2hpbGUgKCBpIDwgdXRmdGV4dC5sZW5ndGggKSB7XG5cbiAgICAgIGMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcbiAgICAgICAgYzIgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsxKTtcbiAgICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMzEpIDw8IDYpIHwgKGMyICYgNjMpKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XG4gICAgICAgIGMzID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMik7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDE1KSA8PCAxMikgfCAoKGMyICYgNjMpIDw8IDYpIHwgKGMzICYgNjMpKTtcbiAgICAgICAgaSArPSAzO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZTY0O1xuIl19
;