;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
require('./coffee/main.coffee')();


},{"./coffee/main.coffee":2}],2:[function(require,module,exports){
var Showdown, State, index, markdown, number, state_, toc, vixen, _ref, _ref1;

vixen = require('vixen');

Showdown = require('showdown');

markdown = new Showdown.converter();

require('./unify.coffee');

_ref = require('./State.coffee'), State = _ref.State, state_ = _ref.state;

require('./state-gist.coffee');

_ref1 = require('./utils.coffee'), number = _ref1.number, index = _ref1.index, toc = _ref1.toc;

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


},{"./unify.coffee":3,"./state-gist.coffee":4,"./State.coffee":5,"./utils.coffee":6,"vixen":7,"showdown":8}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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


},{}],6:[function(require,module,exports){
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


},{}],4:[function(require,module,exports){
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


},{"./State.coffee":5,"./xhr.coffee":9}],5:[function(require,module,exports){
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


},{"events":10,"../lib/lzw":11,"../lib/base64":12}],13:[function(require,module,exports){
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
},{"__browserify_process":13}],9:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2FwcC5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS9tYWluLmNvZmZlZSIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvbm9kZV9tb2R1bGVzL3ZpeGVuL2luZGV4LmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9ub2RlX21vZHVsZXMvc2hvd2Rvd24vc3JjL3Nob3dkb3duLmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9jb2ZmZWUvdW5pZnkuY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9jb2ZmZWUvdXRpbHMuY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9jb2ZmZWUvc3RhdGUtZ2lzdC5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS9TdGF0ZS5jb2ZmZWUiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9pY2V0YW4vRG9jdW1lbnRzL3NyYy9kci1tYXJrZG93bi9kZXYvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9ldmVudHMuanMiLCIvVXNlcnMvaWNldGFuL0RvY3VtZW50cy9zcmMvZHItbWFya2Rvd24vZGV2L2NvZmZlZS94aHIuY29mZmVlIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9saWIvbHp3LmpzIiwiL1VzZXJzL2ljZXRhbi9Eb2N1bWVudHMvc3JjL2RyLW1hcmtkb3duL2Rldi9saWIvYmFzZTY0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxDQUFRLE1BQVIsZUFBQTs7OztBQ0FBLElBQUEscUVBQUE7O0FBQUEsQ0FBQSxFQUFRLEVBQVIsRUFBUTs7QUFDUixDQURBLEVBQ1csSUFBQSxDQUFYLEVBQVc7O0FBQ1gsQ0FGQSxFQUVlLENBQUEsSUFBZixDQUFlOztBQUVmLENBSkEsTUFJQSxTQUFBOztBQUNBLENBTEEsQ0FLRSxHQUFGLEVBQTBCLFNBQUE7O0FBQzFCLENBTkEsTUFNQSxjQUFBOztBQUVBLENBUkEsQ0FRQyxDQVJELEVBUUEsQ0FBQSxDQUF1QixDQUFBLFFBQUE7O0FBRXZCLENBVkEsRUFVaUIsR0FBWCxDQUFOLEVBQWlCO0NBQ2YsS0FBQSxrTEFBQTtDQUFBLENBQUEsQ0FBUSxFQUFSO0NBQUEsQ0FHQSxDQUFRLEVBQVIsR0FBZ0IsTUFBUjtDQUhSLENBSUEsQ0FBUyxHQUFULEVBQWlCLE1BQVI7Q0FKVCxDQUtBLENBQWEsS0FBUSxFQUFyQixDQUFhLEdBQUE7Q0FMYixDQU9BLENBQVcsS0FBWCxDQUFXO0NBQ1QsS0FBQSxFQUFBO0NBQUEsRUFBQSxDQUFBLENBQU0sR0FBUSxLQUFSO0NBQU4sRUFDRyxDQUFILEVBQThCLEdBQTlCLENBQXdCLE1BQUE7Q0FEeEIsQ0FLRSxDQUFpQixDQUFuQixHQUFVLENBQU0sQ0FBaUMsT0FBakM7Q0FBNEMsQ0FBSixDQUFHLFFBQUgsRUFBQTtDQUF4RCxJQUFnRDtDQUM1QyxFQUFELFFBQUg7Q0FkRixFQU9XO0NBUFgsQ0FnQkEsQ0FBUSxDQWhCUixDQWdCQTtDQWhCQSxDQWtCQSxDQUFlLEVBQUEsSUFBQyxHQUFoQjtBQUNTLENBQVAsR0FBQSxDQUFHO0NBQ0QsQ0FBbUIsRUFBbkIsQ0FBQSxDQUFBO0NBQW1CLENBQUssRUFBTCxFQUFXLEVBQVg7Q0FBQSxDQUE4QixHQUFOLEdBQUE7Q0FBM0MsT0FBQTtDQUFBLEVBR2lCLEVBQWpCLENBQUEsRUFBUTtDQUpWLEVBS1UsRUFBUixRQUFBO01BTlc7Q0FsQmYsRUFrQmU7Q0FsQmYsQ0EwQkEsQ0FBWSxNQUFaO0NBQXFCLEVBQVksRUFBYixDQUFhLEdBQWxCLEVBQUE7Q0ExQmYsRUEwQlk7Q0ExQlosQ0E0QkEsQ0FBYyxNQUFBLEVBQWQ7Q0FBdUIsSUFBTixDQUFNLEtBQU47Q0E1QmpCLEVBNEJjO0NBNUJkLENBOEJBLENBQWMsUUFBZCxHQTlCQTtDQUFBLENBK0JBLENBQWEsTUFBQSxDQUFiO0NBQ0UsT0FBQSxnRUFBQTtDQUFBLEVBQVEsQ0FBUixDQUFBLENBQWMsR0FBTjtDQUFSLENBQ0EsQ0FBSyxDQUFMLENBQUssQ0FBTSxFQUFOO0NBREwsQ0FFRyxFQUFILENBQUcsTUFGSDtDQUFBLENBR0EsQ0FBSyxDQUFMO0NBSEEsRUFJSSxDQUFKLEVBSkE7Q0FBQSxDQUtjLENBQUEsQ0FBZCxHQUFjLENBQVEsQ0FBdEIsRUFBYyxnQkFBQTtDQUNkLEdBQUEsQ0FBc0I7Q0FBdEIsS0FBQSxLQUFBO01BTkE7Q0FPQSxFQUFBLENBQUEsQ0FBb0I7Q0FBcEIsS0FBQSxHQUFBO01BUEE7Q0FBQSxFQVFZLENBQVosS0FBQSxDQUFzQjtDQVJ0QixFQVNhLENBQWIsTUFBQSxFQVRBO0NBQUEsRUFVYSxDQUFiLElBQXFCLEVBQXJCLElBQWE7Q0FWYixFQVdZLENBQVosS0FBQSxDQUFzQjtDQVh0QixFQVllLENBQWYsTUFBeUIsRUFBekI7Q0FDQSxFQUFlLENBQWYsS0FBRyxDQUFxQyxFQUF4QztDQUNhLEVBQVksTUFBdkIsQ0FBVSxHQUFWO01BZlM7Q0EvQmIsRUErQmE7Q0EvQmIsQ0FnREEsQ0FBVSxDQUFBLEdBQVYsRUFBVztDQUNILEVBQU8sQ0FBYixDQUFLLE1BQUw7Q0FBYSxDQUNKLEdBQVAsQ0FBQSxNQURXO0NBQUEsQ0FFTCxFQUFOLEVBQUEsS0FGVztDQUdYLEdBQUEsRUFBQTtDQXBESixFQWdEVTtDQWhEVixDQXFEQSxDQUFTLEdBQVQsR0FBVTtDQUNSLENBQUEsRUFBQTtDQUFBLEtBQUEsR0FBQTtNQUFBO0NBQ00sQ0FBVSxDQUFHLEVBQWQsRUFBTCxJQUFBO0NBdkRGLEVBcURTO0NBckRULENBd0RBLENBQVcsS0FBWCxDQUFZO0NBQ1YsQ0FBQSxFQUFBO0NBQ0UsR0FBRyxDQUEyRCxDQUE5RCxFQUFXLFFBQVIsS0FBQTtDQUNELE9BQUEsR0FBQTtDQUNBLEVBQUEsQ0FBZSxDQUFLLEdBQXBCO0NBQUEsUUFBQSxDQUFBO1VBRkY7UUFBQTtDQUdNLEVBQVksRUFBYixJQUFMLElBQUE7TUFKRjtDQU1RLEVBQVksRUFBYixJQUFMLElBQUE7TUFQTztDQXhEWCxFQXdEVztDQXhEWCxDQWlFQSxDQUFZLENBakVaLEtBaUVBO0NBakVBLENBa0VBLENBQVMsR0FBVCxFQUF5QyxFQUF0QixFQUFWLEVBQXdCO0NBQy9CLENBQU0sRUFBTixDQUFBO0NBQUEsQ0FDTyxFQUFQLENBQUEsSUFEQTtDQUFBLENBRWEsRUFBYixDQUZBLE1BRUE7Q0FGQSxDQUdjLEVBQWQsUUFBQTtDQUhBLENBSVUsQ0FBQSxDQUFWLElBQUEsQ0FBVTtDQUNSLEtBQUEsSUFBQTtDQUFBLEVBQ1EsRUFBUixDQUFBO0NBREEsS0FFQSxHQUFBLEdBQUE7Q0FDdUIsQ0FBYyxDQUF6QixDQUFBLEtBQVosQ0FBWSxFQUFBLENBQVo7Q0FSRixJQUlVO0NBSlYsQ0FTYSxDQUFBLENBQWIsQ0FBYSxDQUFBLEdBQUMsRUFBZDtDQUNFLE1BQUEsR0FBQTtDQUFBLEdBQWdCLENBQWdCLENBQWhDLENBQWdCO0NBQWhCLEVBQVUsRUFBVixFQUFBLENBQUE7UUFBQTtDQURXLFlBRVg7Q0FYRixJQVNhO0NBNUVmLEdBa0VTO0NBbEVULENBK0VBLENBQVcsQ0FBQSxJQUFYLENBQVk7Q0FDVixPQUFBLEtBQUE7Q0FBQSxDQUFlLEVBQWIsQ0FBRjtDQUFBLENBQUEsQ0FDUSxDQUFSLENBQUEsRUFBUTtDQUNSLEdBQUEsQ0FBNEMsQ0FBTSxFQUFOLE1BQXBCO0NBQXhCLEdBQUEsRUFBQSxFQUFBO01BRkE7Q0FBQSxHQUdBLENBQWEsRUFBYjtDQUhBLEdBSUEsQ0FBYyxHQUFkO0NBSkEsRUFLQSxDQUFBLENBQVksQ0FBWjtDQUNNLEVBQVEsQ0FBZSxDQUF4QixNQUFMO0NBdEZGLEVBK0VXO0NBL0VYLENBMEZBLENBQ0UsRUFERjtDQUNFLENBQU0sQ0FBQSxDQUFOLEtBQU87Q0FBTSxHQUFHLEVBQUg7Q0FBQSxjQUFVO01BQVYsRUFBQTtDQUFBLGNBQWtCO1FBQXpCO0NBQU4sSUFBTTtDQUFOLENBQ00sQ0FBQSxDQUFOLEtBQU87Q0FBTSxHQUFHLEVBQUg7Q0FBQSxjQUFVO01BQVYsRUFBQTtDQUFBLGNBQXNCO1FBQTdCO0NBRE4sSUFDTTtDQUROLENBRWMsRUFBZCxRQUFBLGdDQUZBO0NBQUEsQ0FHVSxDQUFBLENBQVYsSUFBQSxDQUFVO0NBQ0csQ0FBMEIsRUFBMUIsRUFBWCxFQUFpQixLQUFqQjtDQUFxQyxDQUFNLEVBQU4sSUFBQSxrQkFBQTtDQUFyQyxDQUNFLENBQVcsRUFEYixHQUFXO0NBSmIsSUFHVTtDQUhWLENBTVMsQ0FBQSxDQUFULEdBQUEsRUFBUztDQUNQLEtBQUEsTUFBQTtDQUNPLENBQWEsRUFBcEIsRUFBQSxFQUE0QixHQUE1QixFQUFBO0NBUkYsSUFNUztDQU5ULENBYU8sQ0FBQSxDQUFQLENBQUEsSUFBTztDQUFVLElBQVAsQ0FBTSxPQUFOO0NBYlYsSUFhTztDQWJQLENBY00sRUFBTjtDQWRBLENBZVcsQ0FBQSxDQUFYLEtBQUE7QUFBOEIsQ0FBVixFQUFOLEVBQUssUUFBTDtDQWZkLElBZVc7Q0FmWCxDQWdCYSxDQUFBLENBQWIsS0FBYSxFQUFiO0FBQWtDLENBQVosRUFBUSxFQUFULFFBQUw7Q0FoQmhCLElBZ0JhO0NBaEJiLENBaUJhLENBQUEsQ0FBYixLQUFhLEVBQWI7Q0FDUSxDQUFRLENBQUQsQ0FBYixDQUFLLEVBQVEsTUFBYjtDQWxCRixJQWlCYTtDQWpCYixDQW1CWSxDQUFBLENBQVosS0FBWSxDQUFaO0NBQ1EsQ0FBUSxDQUFELENBQWIsQ0FBSyxDQUFRLE9BQWI7Q0FwQkYsSUFtQlk7Q0FuQlosQ0FxQlUsQ0FBQSxDQUFWLElBQUEsQ0FBVztDQUNULEdBQUEsTUFBQTtDQUFBLEVBQU8sQ0FBUCxFQUFBLEdBQUEsSUFBTztBQUNlLENBQXRCLEdBQWtCLENBQTZCLENBQS9DLEVBQThCO0NBQTlCLFdBQUEsR0FBQTtRQUZRO0NBckJWLElBcUJVO0NBckJWLENBd0JVLENBQUEsQ0FBVixJQUFBLENBQVc7Q0FDVCxHQUFHLEVBQUgsQ0FBRztDQUNELENBQUEsRUFBRyxDQUFhLEVBQWIsQ0FBSDtDQUNRLEVBQU8sQ0FBYixDQUFLLFlBQUw7Q0FDTyxHQUFELENBQWEsQ0FGckIsQ0FFUSxHQUZSO0NBR1EsRUFBTyxDQUFiLENBQUssWUFBTDtDQUNPLENBSlQsRUFJUSxDQUFhLENBSnJCLENBSVEsR0FKUjtDQUtRLEVBQU8sQ0FBYixDQUFLLFlBQUw7VUFOSjtRQURRO0NBeEJWLElBd0JVO0NBbkhaLEdBQUE7Q0FBQSxDQTRIQSxFQUFBLEVBQU0sQ0FBTixDQUFBO0NBNUhBLENBNkhBLElBQU0sRUFBTixDQUFBO0FBRW9CLENBQXBCLENBQUEsRUFBZ0IsRUFBVSxFQUFOO0NBQXBCLEVBQVUsQ0FBVixDQUFBLEVBQUE7SUEvSEE7Q0FBQSxDQWtJQSxFQUFtQixDQUFuQixHQUFjLEVBQWQ7Q0FFQSxRQUFBLENBQUE7Q0FySWU7Ozs7QUNWakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzl6Q0EsSUFBQSxNQUFBOztBQUFBLENBQUEsRUFBQTtDQUNFLENBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQURBLENBQ0E7Q0FEQSxDQUVBLENBRkEsRUFFQTtDQUZBLENBR0EsQ0FIQSxDQUdBO0NBSEEsQ0FJQSxDQUpBLENBSUE7Q0FKQSxDQUtBLENBTEEsRUFLQTtDQUxBLENBTUEsQ0FOQSxFQU1BO0NBTkEsQ0FPQSxDQVBBLENBT0E7Q0FQQSxDQVFBLENBUkEsRUFRQTtDQVJBLENBU0EsQ0FUQSxDQVNBO0NBVEEsQ0FVQSxDQVZBLENBVUE7Q0FWQSxDQVdBLENBWEEsQ0FXQTtDQVhBLENBWUEsQ0FaQSxFQVlBO0NBWkEsQ0FhQSxDQWJBLEVBYUE7Q0FiQSxDQWNBLENBZEEsRUFjQTtDQWZGLENBQUE7O0FBaUJBLENBakJBLENBaUJRLENBQUEsRUFB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBLEdBQUEsQ0FBQTs7QUFBQSxDQUFBLENBQVksQ0FBWixLQUFNLENBQUM7Q0FDTCxLQUFBLGdCQUFBO0FBQUksQ0FBSixDQUFBLENBQUksV0FBSjtDQUFBLENBQ0EsQ0FBVSxDQUFWLENBQUEsQ0FBTztDQURQLENBRUEsQ0FBdUIsTUFBQSxTQUF2QjtDQUNFLEdBQUEsQ0FBbUIsS0FBaEI7Q0FDRCxFQUFHLENBQUEsRUFBSDtDQUNXLENBQVcsSUFBcEIsRUFBQSxJQUFBLEdBQUE7TUFERixFQUFBO0NBR1csQ0FBYyxNQUF2QixFQUFBLEVBQUEsR0FBQTtRQUpKO01BRHFCO0NBRnZCLEVBRXVCO0NBTXZCO0NBQUEsTUFBQSxPQUFBOzBCQUFBO0NBQUEsQ0FBMkIsRUFBM0IsQ0FBQSxDQUFBLFVBQUE7Q0FBQSxFQVJBO0NBQUEsQ0FTQSxDQUFVLENBQVY7Q0FWSSxRQVdKO0NBWEk7O0FBYU4sQ0FiQSxDQWFpQixDQUFkLENBQUgsSUFBVyxDQUFDO0NBQ1YsS0FBQSxHQUFBO0NBQUEsQ0FBQSxDQUFZLENBQUEsS0FBWjtDQUNFLE9BQUEsRUFBQTtBQUFlLENBQWYsR0FBQSxTQUFHO0NBQXNCLENBQXFCLENBQWQsR0FBQSxFQUFBLEtBQUE7TUFBaEM7Q0FDQTtDQUNFLEVBQU8sQ0FBUCxDQUFPLENBQVA7TUFERjtDQUdFLEtBREk7Q0FDSixFQUFBLENBQUEsRUFBQTtNQUpGO0NBS1MsQ0FBSyxDQUFkLENBQUEsSUFBQSxHQUFBO0NBTkYsRUFBWTtDQUFaLENBT0EsQ0FBRyxDQUFILEtBQVc7Q0FQWCxDQVFBLENBQUcsSUFBSDtDQUFjLENBQWdCLEVBQWhCLFVBQUEsSUFBQTtDQVJkLEdBQUE7Q0FTSSxDQUFLLENBQVQsTUFBQTtDQVZTOztBQVlYLENBekJBLEVBeUJpQixHQUFYLENBQU47Ozs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoJy4vY29mZmVlL21haW4uY29mZmVlJykoKVxuIiwidml4ZW4gPSByZXF1aXJlICd2aXhlbidcblNob3dkb3duID0gcmVxdWlyZSAnc2hvd2Rvd24nXG5tYXJrZG93biA9IG5ldyBTaG93ZG93bi5jb252ZXJ0ZXIoKVxuXG5yZXF1aXJlICcuL3VuaWZ5LmNvZmZlZSdcbnsgU3RhdGUsIHN0YXRlOnN0YXRlXyB9ID0gcmVxdWlyZSAnLi9TdGF0ZS5jb2ZmZWUnXG5yZXF1aXJlICcuL3N0YXRlLWdpc3QuY29mZmVlJ1xuXG57bnVtYmVyLCBpbmRleCwgdG9jfSA9IHJlcXVpcmUgJy4vdXRpbHMuY29mZmVlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIHN0YXRlID0ge31cbiAgI3N0YXRlLm9uICdjaGFuZ2UnLCAtPiB1cGRhdGVTdGF0dXMgeWVzXG5cbiAgdG9jRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG9jJ1xuICB2aWV3RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndmlldydcbiAgdmlld1dyYXBFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd2aWV3LXdyYXAnXG5cbiAgZG9jVGl0bGUgPSAtPlxuICAgIHRtcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgICB0bXAuaW5uZXJIVE1MID0gaWYgKGggPSB2aWV3RWwucXVlcnlTZWxlY3RvckFsbCgnaDEsaDIsaDMnKVswXSlcbiAgICAgIGguaW5uZXJIVE1MXG4gICAgZWxzZVxuICAgICAgJ1VudGl0bGVkJ1xuICAgIFtdLmZvckVhY2guY2FsbCB0bXAucXVlcnlTZWxlY3RvckFsbCgnLmluZGV4JyksIChlbCkgLT4gdG1wLnJlbW92ZUNoaWxkIGVsXG4gICAgdG1wLnRleHRDb250ZW50XG5cbiAgc2F2ZWQgPSB5ZXNcblxuICB1cGRhdGVTdGF0dXMgPSAoZm9yY2UpIC0+XG4gICAgaWYgbm90IHNhdmVkIG9yIGZvcmNlXG4gICAgICBzdGF0ZV8uc3RvcmUgbnVsbCwgdGV4dDplZGl0b3IuZ2V0VmFsdWUoKSwgc3RhdGU6c3RhdGVcbiAgICAgICNzdGF0ZS5nZW5lcmF0ZUhhc2ggJ2Jhc2U2NCcsIGVkaXRvci5nZXRWYWx1ZSgpLCAoaGFzaCkgLT5cbiAgICAgICMgIGxvY2F0aW9uLmhhc2ggPSBoYXNoXG4gICAgICBkb2N1bWVudC50aXRsZSA9IGRvY1RpdGxlKClcbiAgICAgIHNhdmVkID0geWVzXG5cbiAgdXBkYXRlVG9jID0gLT4gdG9jRWwuaW5uZXJIVE1MID0gdG9jIHZpZXdFbFxuXG4gIHVwZGF0ZUluZGV4ID0gLT4gaW5kZXggbnVtYmVyIHZpZXdFbFxuXG4gIGN1cnNvclRva2VuID0gJ15eXmN1cnNvcl5eXidcbiAgdXBkYXRlVmlldyA9IC0+XG4gICAgY2xpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZVxuICAgIG1kID0gZWRpdG9yLmdldFZhbHVlKCkuc3BsaXQgJ1xcbidcbiAgICBtZFtjbGluZV0gKz0gY3Vyc29yVG9rZW5cbiAgICBtZCA9IG1kLmpvaW4gJ1xcbidcbiAgICB2ID0gdmlld0VsXG4gICAgdi5pbm5lckhUTUwgPSBtYXJrZG93bi5tYWtlSHRtbChtZCkucmVwbGFjZShjdXJzb3JUb2tlbiwgJzxzcGFuIGlkPVwiY3Vyc29yXCI+PC9zcGFuPicpXG4gICAgdXBkYXRlSW5kZXgoKSBpZiBzdGF0ZS5pbmRleFxuICAgIHVwZGF0ZVRvYygpIGlmIHN0YXRlLnRvY1xuICAgIHNjcm9sbFRvcCA9IHZpZXdXcmFwRWwuc2Nyb2xsVG9wXG4gICAgdmlld0hlaWdodCA9IHZpZXdXcmFwRWwub2Zmc2V0SGVpZ2h0XG4gICAgY3Vyc29yU3BhbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdjdXJzb3InXG4gICAgY3Vyc29yVG9wID0gY3Vyc29yU3Bhbi5vZmZzZXRUb3BcbiAgICBjdXJzb3JIZWlnaHQgPSBjdXJzb3JTcGFuLm9mZnNldEhlaWdodFxuICAgIGlmIGN1cnNvclRvcCA8IHNjcm9sbFRvcCBvciBjdXJzb3JUb3AgPiBzY3JvbGxUb3AgKyB2aWV3SGVpZ2h0IC0gY3Vyc29ySGVpZ2h0XG4gICAgICB2aWV3V3JhcEVsLnNjcm9sbFRvcCA9IGN1cnNvclRvcCAtIHZpZXdIZWlnaHQvMlxuXG4gIHNldE1vZGUgPSAobW9kZSkgLT5cbiAgICBtb2RlbC5tb2RlID0ge1xuICAgICAgd3JpdGU6ICdmdWxsLWlucHV0J1xuICAgICAgcmVhZDogJ2Z1bGwtdmlldydcbiAgICB9W21vZGVdIG9yICcnXG4gIHNldFRvYyA9ICh0bykgLT5cbiAgICB1cGRhdGVUb2MoKSBpZiB0b1xuICAgIG1vZGVsLnNob3dUb2MgPSBpZiB0byB0aGVuICd0b2MnIGVsc2UgJydcbiAgc2V0SW5kZXggPSAodG8pIC0+XG4gICAgaWYgdG9cbiAgICAgIGlmIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyN2aWV3IFtkYXRhLW51bWJlcl0nKS5sZW5ndGggaXMgMFxuICAgICAgICB1cGRhdGVJbmRleCgpXG4gICAgICAgIHVwZGF0ZVRvYygpIGlmIHN0YXRlLnRvY1xuICAgICAgbW9kZWwuc2hvd0luZGV4ID0gJ2luZGV4ZWQnXG4gICAgZWxzZVxuICAgICAgbW9kZWwuc2hvd0luZGV4ID0gJydcblxuICBzYXZlVGltZXIgPSBudWxsXG4gIGVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1tZCcpLFxuICAgIG1vZGU6ICdnZm0nXG4gICAgdGhlbWU6ICdkZWZhdWx0J1xuICAgIGxpbmVOdW1iZXJzOiBub1xuICAgIGxpbmVXcmFwcGluZzogeWVzXG4gICAgb25DaGFuZ2U6IC0+XG4gICAgICB1cGRhdGVWaWV3KClcbiAgICAgIHNhdmVkID0gbm9cbiAgICAgIGNsZWFyVGltZW91dCBzYXZlVGltZXJcbiAgICAgIHNhdmVUaW1lciA9IHNldFRpbWVvdXQgdXBkYXRlU3RhdHVzLCA1MDAwXG4gICAgb25EcmFnRXZlbnQ6IChlZGl0b3IsIGV2ZW50KSAtPlxuICAgICAgc2hvd0RuZCA9IG5vIGlmIHNob3dEbmQgb3IgZXZlbnQudHlwZSBpcyAnZHJvcCdcbiAgICAgIGZhbHNlXG4gIHNldFN0YXRlID0gKGRhdGEpIC0+XG4gICAgeyB0ZXh0LCBzdGF0ZTogc3RhdGVfXyB9ID0gZGF0YVxuICAgIHN0YXRlID0gc3RhdGVfXyBvciB7fVxuICAgIGVkaXRvci5zZXRWYWx1ZSB0ZXh0IGlmIHRleHQ/IGFuZCB0ZXh0IGlzbnQgZWRpdG9yLmdldFZhbHVlKClcbiAgICBzZXRNb2RlIHN0YXRlLm1vZGVcbiAgICBzZXRJbmRleCBzdGF0ZS5pbmRleFxuICAgIHNldFRvYyBzdGF0ZS50b2NcbiAgICBtb2RlbC50aGVtZSA9IHN0YXRlLnRoZW1lIG9yICdzZXJpZidcblxuICAjd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ2hhc2hjaGFuZ2UnLCBzZXRTdGF0ZVxuXG4gIG1vZGVsID1cbiAgICBzaG93OiAodikgLT4gaWYgdiB0aGVuICcnIGVsc2UgJ2hpZGUnXG4gICAgaGlkZTogKHYpIC0+IGlmIHYgdGhlbiAnaGlkZScgZWxzZSAnJ1xuICAgIHNob3dEb3dubG9hZDogQmxvYj9cbiAgICBkb3dubG9hZDogLT5cbiAgICAgIHNhdmVBcyBuZXcgQmxvYihbZWRpdG9yLmdldFZhbHVlKCldLCB0eXBlOiAndGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04JyksXG4gICAgICAgIGRvY1RpdGxlKCkrJy5tZCdcbiAgICBsaW5rQjY0OiAtPlxuICAgICAgdXBkYXRlU3RhdHVzKClcbiAgICAgIHByb21wdCAnQ29weSB0aGlzJywgbG9jYXRpb24uaHJlZlxuICAgICAgI21vZGVsLmxpbmtDb3B5ID0gbG9jYXRpb24uaHJlZlxuICAgICAgI21vZGVsLnNob3dMaW5rQ29weSA9IHRydWVcbiAgICAgICMuZm9jdXMoKVxuICAgICAgIy5ibHVyIC0+ICQoQCkuYWRkQ2xhc3MoJ2hpZGRlbicpXG4gICAgcHJpbnQ6IC0+IHdpbmRvdy5wcmludCgpXG4gICAgbW9kZTogJydcbiAgICB0b2dnbGVUb2M6IC0+IHN0YXRlLnRvYyA9IG5vdCBzdGF0ZS50b2NcbiAgICB0b2dnbGVJbmRleDogLT4gc3RhdGUuaW5kZXggPSBub3Qgc3RhdGUuaW5kZXhcbiAgICBleHBhbmRJbnB1dDogLT5cbiAgICAgIHN0YXRlLm1vZGUgPSAoaWYgc3RhdGUubW9kZSB0aGVuICcnIGVsc2UgJ3dyaXRlJylcbiAgICBleHBhbmRWaWV3OiAtPlxuICAgICAgc3RhdGUubW9kZSA9IChpZiBzdGF0ZS5tb2RlIHRoZW4gJycgZWxzZSAncmVhZCcpXG4gICAgbW91c2VvdXQ6IChlKSAtPlxuICAgICAgZnJvbSA9IGUucmVsYXRlZFRhcmdldCBvciBlLnRvRWxlbWVudFxuICAgICAgdXBkYXRlU3RhdHVzKCkgaWYgbm90IGZyb20gb3IgZnJvbS5ub2RlTmFtZSBpcyAnSFRNTCdcbiAgICBrZXlwcmVzczogKGUpIC0+XG4gICAgICBpZiBlLmN0cmxLZXkgYW5kIGUuYWx0S2V5XG4gICAgICAgIGlmIGUua2V5Q29kZSBpcyAyNCAjIGN0cmwrYWx0K3hcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gJ3dyaXRlJ1xuICAgICAgICBlbHNlIGlmIGUua2V5Q29kZSBpcyAzICMgY3RybCthbHQrY1xuICAgICAgICAgIHN0YXRlLm1vZGUgPSAnJ1xuICAgICAgICBlbHNlIGlmIGUua2V5Q29kZSBpcyAyMiAjIGN0cmwrYWx0K3ZcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gJ3JlYWQnXG5cbiAgc3RhdGVfLnJlc3RvcmUgbnVsbCwgbnVsbCwgc2V0U3RhdGVcbiAgc3RhdGVfLm9uICdyZXN0b3JlJywgc2V0U3RhdGVcblxuICBzaG93RG5kID0gbm8gaWYgbm90IGVkaXRvci5nZXRWYWx1ZSgpXG4gICMkKCcjaW5wdXQtd3JhcCcpLm9uZSAnY2xpY2snLCAtPiAkKCcjZHJhZy1uLWRyb3Atd3JhcCcpLnJlbW92ZSgpXG5cbiAgdml4ZW4oZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlLCBtb2RlbClcblxuICB1cGRhdGVWaWV3KClcbiAgI3VwZGF0ZVN0YXR1cygpXG4iLCIhZnVuY3Rpb24ob2JqKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJylcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG9iajtcbiAgZWxzZVxuICAgIHdpbmRvdy52aXhlbiA9IG9iajtcbn0oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIHRyaW0oc3RyKSB7cmV0dXJuIFN0cmluZy5wcm90b3R5cGUudHJpbS5jYWxsKHN0cik7fTtcblxuICBmdW5jdGlvbiByZXNvbHZlUHJvcChvYmosIG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZS50cmltKCkuc3BsaXQoJy4nKS5yZWR1Y2UoZnVuY3Rpb24gKHAsIHByb3ApIHtcbiAgICAgIHJldHVybiBwID8gcFtwcm9wXSA6IHVuZGVmaW5lZDtcbiAgICB9LCBvYmopO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZUNoYWluKG9iaiwgY2hhaW4pIHtcbiAgICB2YXIgcHJvcCA9IGNoYWluLnNoaWZ0KCk7XG4gICAgcmV0dXJuIGNoYWluLnJlZHVjZShmdW5jdGlvbiAocCwgcHJvcCkge1xuICAgICAgdmFyIGYgPSByZXNvbHZlUHJvcChvYmosIHByb3ApO1xuICAgICAgcmV0dXJuIGYgPyBmKHApIDogcDtcbiAgICB9LCByZXNvbHZlUHJvcChvYmosIHByb3ApKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1Y2tldChiLCBrLCB2KSB7XG4gICAgaWYgKCEoayBpbiBiKSkgYltrXSA9IFtdO1xuICAgIGlmICghKHYgaW4gYltrXSkpIGJba10ucHVzaCh2KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dGVuZChvcmlnLCBvYmopIHtcbiAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgb3JpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICB9KTtcbiAgICByZXR1cm4gb3JpZztcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYXZlcnNlRWxlbWVudHMoZWwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGk7XG4gICAgaWYgKGNhbGxiYWNrKGVsKSAhPT0gZmFsc2UpIHtcbiAgICAgIGZvcihpID0gZWwuY2hpbGRyZW4ubGVuZ3RoOyBpLS07KSAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdHJhdmVyc2VFbGVtZW50cyhub2RlLCBjYWxsYmFjayk7XG4gICAgICB9KShlbC5jaGlsZHJlbltpXSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUHJveHkobWFwcywgcHJveHkpIHtcbiAgICBwcm94eSA9IHByb3h5IHx8IHt9O1xuICAgIHByb3h5LmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIHRvUmVuZGVyID0ge307XG4gICAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICBtYXBzLm9yaWdbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgIGlmIChtYXBzLmJpbmRzW3Byb3BdKSBtYXBzLmJpbmRzW3Byb3BdLmZvckVhY2goZnVuY3Rpb24ocmVuZGVySWQpIHtcbiAgICAgICAgICBpZiAocmVuZGVySWQgPj0gMCkgdG9SZW5kZXJbcmVuZGVySWRdID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGZvciAocmVuZGVySWQgaW4gdG9SZW5kZXIpIG1hcHMucmVuZGVyc1tyZW5kZXJJZF0obWFwcy5vcmlnKTtcbiAgICAgIHJldHVybiBwcm94eTtcbiAgICB9O1xuXG4gICAgT2JqZWN0LmtleXMobWFwcy5iaW5kcykuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICB2YXIgaWRzID0gbWFwcy5iaW5kc1twcm9wXTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eSwgcHJvcCwge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgbWFwcy5vcmlnW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgaWRzLmZvckVhY2goZnVuY3Rpb24ocmVuZGVySWQpIHtcbiAgICAgICAgICAgIGlmIChyZW5kZXJJZCA+PSAwKSBtYXBzLnJlbmRlcnNbcmVuZGVySWRdKG1hcHMub3JpZyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKG1hcHMucmViaW5kc1twcm9wXSlcbiAgICAgICAgICAgIHJldHVybiBtYXBzLnJlYmluZHNbcHJvcF0oKTtcbiAgICAgICAgICByZXR1cm4gbWFwcy5vcmlnW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcHJveHk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24oZWwsIG1vZGVsKSB7XG4gICAgdmFyIHBhdHRlcm4gPSAvXFx7XFx7Lis/XFx9XFx9L2csXG4gICAgICAgIHBpcGUgPSAnfCc7XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlKG9yaWcsIHByb3ApIHtcbiAgICAgIGlmICghb3JpZykgcmV0dXJuICcnO1xuICAgICAgdmFyIHZhbCA9IHJlc29sdmVDaGFpbihvcmlnLCBwcm9wLnNsaWNlKDIsLTIpLnNwbGl0KHBpcGUpKTtcbiAgICAgIHJldHVybiB2YWwgPT09IHVuZGVmaW5lZCA/ICcnIDogdmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0clRtcGwoc3RyLCBvcmlnKSB7XG4gICAgICByZXR1cm4gc3RyLnJlcGxhY2UocGF0dGVybiwgcmVzb2x2ZS5iaW5kKHVuZGVmaW5lZCwgb3JpZykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoKHN0cikge1xuICAgICAgdmFyIG0gPSBzdHIubWF0Y2gocGF0dGVybik7XG4gICAgICBpZiAobSkgcmV0dXJuIG0ubWFwKGZ1bmN0aW9uKGNoYWluKSB7XG4gICAgICAgIHJldHVybiBjaGFpbi5zbGljZSgyLCAtMikuc3BsaXQocGlwZSkubWFwKHRyaW0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhdmVyc2UoZWwsIG9yaWcpIHtcbiAgICAgIHZhciBiaW5kcyA9IHt9LFxuICAgICAgICAgIHJlYmluZHMgPSB7fSxcbiAgICAgICAgICByZW5kZXJzID0ge30sXG4gICAgICAgICAgY291bnQgPSAwO1xuICAgICAgb3JpZyA9IG9yaWcgfHwge307XG5cbiAgICAgIGZ1bmN0aW9uIGJpbmRSZW5kZXJzKGNoYWlucywgcmVuZGVySWQpIHtcbiAgICAgICAgLy8gQ3JlYXRlIHByb3BlcnR5IHRvIHJlbmRlciBtYXBwaW5nXG4gICAgICAgIGNoYWlucy5mb3JFYWNoKGZ1bmN0aW9uKGNoYWluKSB7XG4gICAgICAgICAgLy8gVE9ETzogUmVnaXN0ZXIgY2hhaW5pbmcgZnVuY3Rpb25zIGFzIGJpbmRzIGFzIHdlbGwuXG4gICAgICAgICAgYnVja2V0KGJpbmRzLCBjaGFpblswXS5zcGxpdCgnLicpWzBdLCByZW5kZXJJZCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwYXJzZUl0ZXJhdG9yKGVsKSB7XG4gICAgICAgIHZhciBtYXJrZXIsIHByZWZpeCA9ICcnLCBub2RlcyA9IFtdO1xuICAgICAgICBpZiAocGFyZW50XyA9IChlbC5wYXJlbnRFbGVtZW50IHx8IGVsLnBhcmVudE5vZGUpKSB7XG4gICAgICAgICAgaWYgKGVsLnRhZ05hbWUgPT09ICdGT1InKSB7XG4gICAgICAgICAgICBtYXJrZXIgPSBlbC5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgICAgIHBhcmVudF8ucmVwbGFjZUNoaWxkKG1hcmtlciwgZWwpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWluJykpIHtcbiAgICAgICAgICAgIHByZWZpeCA9ICdkYXRhLSc7XG4gICAgICAgICAgICBwYXJlbnRfID0gZWw7XG4gICAgICAgICAgICBub2RlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVsLmNoaWxkTm9kZXMpO1xuICAgICAgICAgICAgbWFya2VyID0gZWwub3duZXJEb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICAgICAgICBwYXJlbnRfLmFwcGVuZENoaWxkKG1hcmtlcik7XG4gICAgICAgICAgfSBlbHNlIHJldHVybjtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWxpYXM6IGVsLmdldEF0dHJpYnV0ZShwcmVmaXgrJ3ZhbHVlJyksXG4gICAgICAgICAgICBrZXk6IGVsLmdldEF0dHJpYnV0ZShwcmVmaXgrJ2tleScpLFxuICAgICAgICAgICAgcHJvcDogZWwuZ2V0QXR0cmlidXRlKHByZWZpeCsnaW4nKSxcbiAgICAgICAgICAgIGVhY2g6IGVsLmdldEF0dHJpYnV0ZShwcmVmaXgrJ2VhY2gnKSxcbiAgICAgICAgICAgIG5vZGVzOiBub2RlcyxcbiAgICAgICAgICAgIHBhcmVudDogcGFyZW50XyxcbiAgICAgICAgICAgIG1hcmtlcjogbWFya2VyXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYXBBdHRyaWJ1dGUob3duZXIsIGF0dHIpIHtcbiAgICAgICAgdmFyIG5hbWUsIGV2ZW50SWQsIHJlbmRlcklkLCBzdHIsIG5vVG1wbDtcbiAgICAgICAgaWYgKChzdHIgPSBhdHRyLnZhbHVlKSAmJiAoY2hhaW5zID0gbWF0Y2goc3RyKSkpIHtcbiAgICAgICAgICBuYW1lID0gYXR0ci5uYW1lO1xuICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoJ3Z4LScpID09PSAwKSB7XG4gICAgICAgICAgICBvd25lci5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoJ29uJykgPT09IDApIHtcbiAgICAgICAgICAgIHJlbmRlcklkID0gLTE7IC8vIE5vIHJlbmRlcmVyXG4gICAgICAgICAgICBldmVudE5hbWUgPSBuYW1lLnN1YnN0cigyKTtcbiAgICAgICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lcnNcbiAgICAgICAgICAgIGNoYWlucy5mb3JFYWNoKGZ1bmN0aW9uKGNoYWluKSB7XG4gICAgICAgICAgICAgIG93bmVyLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZVByb3Aob3JpZywgY2hhaW5bMF0pKGV2dCwgb3duZXIudmFsdWUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgb3duZXIucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub1RtcGwgPSBjaGFpbnMubGVuZ3RoID09PSAxICYmIHN0ci5zdWJzdHIoMCwxKSA9PT0gJ3snICYmXG4gICAgICAgICAgICAgIHN0ci5zdWJzdHIoLTEpID09PSAnfSc7XG4gICAgICAgICAgICAvLyBDcmVhdGUgcmVuZGVyaW5nIGZ1bmN0aW9uIGZvciBhdHRyaWJ1dGUuXG4gICAgICAgICAgICByZW5kZXJJZCA9IGNvdW50Kys7XG4gICAgICAgICAgICAocmVuZGVyc1tyZW5kZXJJZF0gPSBmdW5jdGlvbihvcmlnLCBjbGVhcikge1xuICAgICAgICAgICAgICB2YXIgdmFsID0gbm9UbXBsID8gcmVzb2x2ZShvcmlnLCBzdHIpIDogc3RyVG1wbChzdHIsIG9yaWcpO1xuICAgICAgICAgICAgICAhY2xlYXIgJiYgbmFtZSBpbiBvd25lciA/IG93bmVyW25hbWVdID0gdmFsIDpcbiAgICAgICAgICAgICAgICBvd25lci5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKTtcbiAgICAgICAgICAgIH0pKG9yaWcsIHRydWUpO1xuICAgICAgICAgICAgLy8gQmktZGlyZWN0aW9uYWwgY291cGxpbmcuXG4gICAgICAgICAgICBpZiAobm9UbXBsKSByZWJpbmRzW2NoYWluc1swXVswXV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBHZXR0aW5nIGYuZXguICd2YWx1ZScgYXR0cmlidXRlIGZyb20gYW4gaW5wdXRcbiAgICAgICAgICAgICAgICAvLyBkb2Vzbid0IHJldHVybiB1c2VyIGlucHV0IHZhbHVlIHNvIGFjY2Vzc2luZyBlbGVtZW50XG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0IHByb3BlcnRpZXMgZGlyZWN0bHksIGZpbmQgb3V0IGhvdyB0byBkbyB0aGlzXG4gICAgICAgICAgICAgICAgLy8gbW9yZSBzZWN1cmVseS5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmFtZSBpbiBvd25lciA/XG4gICAgICAgICAgICAgICAgICBvd25lcltuYW1lXSA6IG93bmVyLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYmluZFJlbmRlcnMoY2hhaW5zLCByZW5kZXJJZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbWFwVGV4dE5vZGVzKGVsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBlbC5jaGlsZE5vZGVzLmxlbmd0aDsgaS0tOykgKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICB2YXIgc3RyLCByZW5kZXJJZCwgY2hhaW5zO1xuICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBlbC5URVhUX05PREUgJiYgKHN0ciA9IG5vZGUubm9kZVZhbHVlKSAmJlxuICAgICAgICAgICAgICAoY2hhaW5zID0gbWF0Y2goc3RyKSkpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSByZW5kZXJpbmcgZnVuY3Rpb24gZm9yIGVsZW1lbnQgdGV4dCBub2RlLlxuICAgICAgICAgICAgcmVuZGVySWQgPSBjb3VudCsrO1xuICAgICAgICAgICAgKHJlbmRlcnNbcmVuZGVySWRdID0gZnVuY3Rpb24ob3JpZykge1xuICAgICAgICAgICAgICBub2RlLm5vZGVWYWx1ZSA9IHN0clRtcGwoc3RyLCBvcmlnKTtcbiAgICAgICAgICAgIH0pKG9yaWcpO1xuICAgICAgICAgICAgYmluZFJlbmRlcnMoY2hhaW5zLCByZW5kZXJJZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KShlbC5jaGlsZE5vZGVzW2ldKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIG5vLXRyYXZlcnNlIGF0dHJpYnV0ZSBpZiByb290IG5vZGVcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zdWJ2aWV3Jyk7XG5cbiAgICAgIHRyYXZlcnNlRWxlbWVudHMoZWwsIGZ1bmN0aW9uKGVsXykge1xuICAgICAgICB2YXIgaSwgaXRlciwgdGVtcGxhdGUsIG5vZGVzLCByZW5kZXJJZDtcblxuICAgICAgICAvLyBTdG9wIGhhbmRsaW5nIGFuZCByZWN1cnNpb24gaWYgc3Vidmlldy5cbiAgICAgICAgaWYgKGVsXy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3VidmlldycpICE9PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKGl0ZXIgPSBwYXJzZUl0ZXJhdG9yKGVsXykpIHtcbiAgICAgICAgICBub2RlcyA9IGl0ZXIubm9kZXM7XG4gICAgICAgICAgdGVtcGxhdGUgPSBlbF8uY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIG1hcHMgPSB0cmF2ZXJzZSh0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICAgIHJlbmRlcklkID0gY291bnQrKztcbiAgICAgICAgICAocmVuZGVyc1tyZW5kZXJJZF0gPSBmdW5jdGlvbihvcmlnKSB7XG4gICAgICAgICAgICB2YXIgbGlzdCA9IHJlc29sdmVQcm9wKG9yaWcsIGl0ZXIucHJvcCksXG4gICAgICAgICAgICAgICAgZWFjaF8gPSBpdGVyLmVhY2ggJiYgcmVzb2x2ZVByb3Aob3JpZywgaXRlci5lYWNoKSwgaTtcbiAgICAgICAgICAgIGZvciAoaSA9IG5vZGVzLmxlbmd0aDsgaS0tOykgaXRlci5wYXJlbnQucmVtb3ZlQ2hpbGQobm9kZXNbaV0pO1xuICAgICAgICAgICAgbm9kZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaSBpbiBsaXN0KSBpZiAobGlzdC5oYXNPd25Qcm9wZXJ0eShpKSlcbiAgICAgICAgICAgICAgKGZ1bmN0aW9uKHZhbHVlLCBpKXtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ18gPSBleHRlbmQoe30sIG9yaWcpLFxuICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHRlbXBsYXRlLmNsb25lTm9kZSh0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgbGFzdE5vZGUgPSBpdGVyLm1hcmtlcixcbiAgICAgICAgICAgICAgICAgICAgbWFwcywgcmVuZGVySWQsIGlfLCBub2RlLCBub2Rlc18gPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlci5rZXkpIG9yaWdfW2l0ZXIua2V5XSA9IGk7XG4gICAgICAgICAgICAgICAgb3JpZ19baXRlci5hbGlhc10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBtYXBzID0gdHJhdmVyc2UoY2xvbmUsIG9yaWdfKTtcbiAgICAgICAgICAgICAgICBmb3IgKGlfID0gY2xvbmUuY2hpbGROb2Rlcy5sZW5ndGg7IGlfLS07IGxhc3ROb2RlID0gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgbm9kZXNfLnB1c2gobm9kZSA9IGNsb25lLmNoaWxkTm9kZXNbaV9dKTtcbiAgICAgICAgICAgICAgICAgIGl0ZXIucGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBsYXN0Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlYWNoXyAmJiBlYWNoXyh2YWx1ZSwgaSwgb3JpZ18sIG5vZGVzXy5maWx0ZXIoZnVuY3Rpb24obikge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG4ubm9kZVR5cGUgPT09IGVsXy5FTEVNRU5UX05PREU7XG4gICAgICAgICAgICAgICAgfSkpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIGZvciAoaV8gPSBub2Rlc18ubGVuZ3RoOyBpXy0tOylcbiAgICAgICAgICAgICAgICAgICAgaXRlci5wYXJlbnQucmVtb3ZlQ2hpbGQobm9kZXNfW2lfXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIG5vZGVzID0gbm9kZXMuY29uY2F0KG5vZGVzXyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KShsaXN0W2ldLCBpKTtcbiAgICAgICAgICB9KShvcmlnKTtcbiAgICAgICAgICBidWNrZXQoYmluZHMsIGl0ZXIucHJvcC5zcGxpdCgnLicpWzBdLCByZW5kZXJJZCk7XG4gICAgICAgICAgZm9yIChwIGluIG1hcHMuYmluZHMpIGlmIChpdGVyLmFsaWFzLmluZGV4T2YocCkgPT09IC0xKVxuICAgICAgICAgICAgYnVja2V0KGJpbmRzLCBwLCByZW5kZXJJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQmluZCBub2RlIHRleHQuXG4gICAgICAgICAgbWFwVGV4dE5vZGVzKGVsXyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQmluZCBub2RlIGF0dHJpYnV0ZXMgaWYgbm90IGEgPGZvcj4uXG4gICAgICAgIGlmIChlbF8udGFnTmFtZSAhPT0gJ0ZPUicpIGZvciAoaSA9IGVsXy5hdHRyaWJ1dGVzLmxlbmd0aDsgaS0tOylcbiAgICAgICAgICBtYXBBdHRyaWJ1dGUoZWxfLCBlbF8uYXR0cmlidXRlc1tpXSk7XG4gICAgICAgIC8vIFN0b3AgcmVjdXJzaW9uIGlmIGl0ZXJhdG9yLlxuICAgICAgICByZXR1cm4gIWl0ZXI7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7b3JpZzpvcmlnLCBiaW5kczpiaW5kcywgcmViaW5kczpyZWJpbmRzLCByZW5kZXJzOnJlbmRlcnN9O1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlUHJveHkodHJhdmVyc2UoZWwsIG1vZGVsICYmIGV4dGVuZCh7fSwgbW9kZWwpKSwgbW9kZWwpO1xuICB9O1xufSgpKTtcbiIsIihmdW5jdGlvbigpey8vXG4vLyBzaG93ZG93bi5qcyAtLSBBIGphdmFzY3JpcHQgcG9ydCBvZiBNYXJrZG93bi5cbi8vXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDcgSm9obiBGcmFzZXIuXG4vL1xuLy8gT3JpZ2luYWwgTWFya2Rvd24gQ29weXJpZ2h0IChjKSAyMDA0LTIwMDUgSm9obiBHcnViZXJcbi8vICAgPGh0dHA6Ly9kYXJpbmdmaXJlYmFsbC5uZXQvcHJvamVjdHMvbWFya2Rvd24vPlxuLy9cbi8vIFJlZGlzdHJpYnV0YWJsZSB1bmRlciBhIEJTRC1zdHlsZSBvcGVuIHNvdXJjZSBsaWNlbnNlLlxuLy8gU2VlIGxpY2Vuc2UudHh0IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuLy9cbi8vIFRoZSBmdWxsIHNvdXJjZSBkaXN0cmlidXRpb24gaXMgYXQ6XG4vL1xuLy9cdFx0XHRcdEEgQSBMXG4vL1x0XHRcdFx0VCBDIEFcbi8vXHRcdFx0XHRUIEsgQlxuLy9cbi8vICAgPGh0dHA6Ly93d3cuYXR0YWNrbGFiLm5ldC8+XG4vL1xuXG4vL1xuLy8gV2hlcmV2ZXIgcG9zc2libGUsIFNob3dkb3duIGlzIGEgc3RyYWlnaHQsIGxpbmUtYnktbGluZSBwb3J0XG4vLyBvZiB0aGUgUGVybCB2ZXJzaW9uIG9mIE1hcmtkb3duLlxuLy9cbi8vIFRoaXMgaXMgbm90IGEgbm9ybWFsIHBhcnNlciBkZXNpZ247IGl0J3MgYmFzaWNhbGx5IGp1c3QgYVxuLy8gc2VyaWVzIG9mIHN0cmluZyBzdWJzdGl0dXRpb25zLiAgSXQncyBoYXJkIHRvIHJlYWQgYW5kXG4vLyBtYWludGFpbiB0aGlzIHdheSwgIGJ1dCBrZWVwaW5nIFNob3dkb3duIGNsb3NlIHRvIHRoZSBvcmlnaW5hbFxuLy8gZGVzaWduIG1ha2VzIGl0IGVhc2llciB0byBwb3J0IG5ldyBmZWF0dXJlcy5cbi8vXG4vLyBNb3JlIGltcG9ydGFudGx5LCBTaG93ZG93biBiZWhhdmVzIGxpa2UgbWFya2Rvd24ucGwgaW4gbW9zdFxuLy8gZWRnZSBjYXNlcy4gIFNvIHdlYiBhcHBsaWNhdGlvbnMgY2FuIGRvIGNsaWVudC1zaWRlIHByZXZpZXdcbi8vIGluIEphdmFzY3JpcHQsIGFuZCB0aGVuIGJ1aWxkIGlkZW50aWNhbCBIVE1MIG9uIHRoZSBzZXJ2ZXIuXG4vL1xuLy8gVGhpcyBwb3J0IG5lZWRzIHRoZSBuZXcgUmVnRXhwIGZ1bmN0aW9uYWxpdHkgb2YgRUNNQSAyNjIsXG4vLyAzcmQgRWRpdGlvbiAoaS5lLiBKYXZhc2NyaXB0IDEuNSkuICBNb3N0IG1vZGVybiB3ZWIgYnJvd3NlcnNcbi8vIHNob3VsZCBkbyBmaW5lLiAgRXZlbiB3aXRoIHRoZSBuZXcgcmVndWxhciBleHByZXNzaW9uIGZlYXR1cmVzLFxuLy8gV2UgZG8gYSBsb3Qgb2Ygd29yayB0byBlbXVsYXRlIFBlcmwncyByZWdleCBmdW5jdGlvbmFsaXR5LlxuLy8gVGhlIHRyaWNreSBjaGFuZ2VzIGluIHRoaXMgZmlsZSBtb3N0bHkgaGF2ZSB0aGUgXCJhdHRhY2tsYWI6XCJcbi8vIGxhYmVsLiAgTWFqb3Igb3Igc2VsZi1leHBsYW5hdG9yeSBjaGFuZ2VzIGRvbid0LlxuLy9cbi8vIFNtYXJ0IGRpZmYgdG9vbHMgbGlrZSBBcmF4aXMgTWVyZ2Ugd2lsbCBiZSBhYmxlIHRvIG1hdGNoIHVwXG4vLyB0aGlzIGZpbGUgd2l0aCBtYXJrZG93bi5wbCBpbiBhIHVzZWZ1bCB3YXkuICBBIGxpdHRsZSB0d2Vha2luZ1xuLy8gaGVscHM6IGluIGEgY29weSBvZiBtYXJrZG93bi5wbCwgcmVwbGFjZSBcIiNcIiB3aXRoIFwiLy9cIiBhbmRcbi8vIHJlcGxhY2UgXCIkdGV4dFwiIHdpdGggXCJ0ZXh0XCIuICBCZSBzdXJlIHRvIGlnbm9yZSB3aGl0ZXNwYWNlXG4vLyBhbmQgbGluZSBlbmRpbmdzLlxuLy9cblxuXG4vL1xuLy8gU2hvd2Rvd24gdXNhZ2U6XG4vL1xuLy8gICB2YXIgdGV4dCA9IFwiTWFya2Rvd24gKnJvY2tzKi5cIjtcbi8vXG4vLyAgIHZhciBjb252ZXJ0ZXIgPSBuZXcgU2hvd2Rvd24uY29udmVydGVyKCk7XG4vLyAgIHZhciBodG1sID0gY29udmVydGVyLm1ha2VIdG1sKHRleHQpO1xuLy9cbi8vICAgYWxlcnQoaHRtbCk7XG4vL1xuLy8gTm90ZTogbW92ZSB0aGUgc2FtcGxlIGNvZGUgdG8gdGhlIGJvdHRvbSBvZiB0aGlzXG4vLyBmaWxlIGJlZm9yZSB1bmNvbW1lbnRpbmcgaXQuXG4vL1xuXG5cbi8vXG4vLyBTaG93ZG93biBuYW1lc3BhY2Vcbi8vXG52YXIgU2hvd2Rvd24gPSB7fTtcblxuLy9cbi8vIGNvbnZlcnRlclxuLy9cbi8vIFdyYXBzIGFsbCBcImdsb2JhbHNcIiBzbyB0aGF0IHRoZSBvbmx5IHRoaW5nXG4vLyBleHBvc2VkIGlzIG1ha2VIdG1sKCkuXG4vL1xuU2hvd2Rvd24uY29udmVydGVyID0gZnVuY3Rpb24oKSB7XG5cbi8vXG4vLyBHbG9iYWxzOlxuLy9cblxuLy8gR2xvYmFsIGhhc2hlcywgdXNlZCBieSB2YXJpb3VzIHV0aWxpdHkgcm91dGluZXNcbnZhciBnX3VybHM7XG52YXIgZ190aXRsZXM7XG52YXIgZ19odG1sX2Jsb2NrcztcblxuLy8gVXNlZCB0byB0cmFjayB3aGVuIHdlJ3JlIGluc2lkZSBhbiBvcmRlcmVkIG9yIHVub3JkZXJlZCBsaXN0XG4vLyAoc2VlIF9Qcm9jZXNzTGlzdEl0ZW1zKCkgZm9yIGRldGFpbHMpOlxudmFyIGdfbGlzdF9sZXZlbCA9IDA7XG5cblxudGhpcy5tYWtlSHRtbCA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBNYWluIGZ1bmN0aW9uLiBUaGUgb3JkZXIgaW4gd2hpY2ggb3RoZXIgc3VicyBhcmUgY2FsbGVkIGhlcmUgaXNcbi8vIGVzc2VudGlhbC4gTGluayBhbmQgaW1hZ2Ugc3Vic3RpdHV0aW9ucyBuZWVkIHRvIGhhcHBlbiBiZWZvcmVcbi8vIF9Fc2NhcGVTcGVjaWFsQ2hhcnNXaXRoaW5UYWdBdHRyaWJ1dGVzKCksIHNvIHRoYXQgYW55IConcyBvciBfJ3MgaW4gdGhlIDxhPlxuLy8gYW5kIDxpbWc+IHRhZ3MgZ2V0IGVuY29kZWQuXG4vL1xuXG5cdC8vIENsZWFyIHRoZSBnbG9iYWwgaGFzaGVzLiBJZiB3ZSBkb24ndCBjbGVhciB0aGVzZSwgeW91IGdldCBjb25mbGljdHNcblx0Ly8gZnJvbSBvdGhlciBhcnRpY2xlcyB3aGVuIGdlbmVyYXRpbmcgYSBwYWdlIHdoaWNoIGNvbnRhaW5zIG1vcmUgdGhhblxuXHQvLyBvbmUgYXJ0aWNsZSAoZS5nLiBhbiBpbmRleCBwYWdlIHRoYXQgc2hvd3MgdGhlIE4gbW9zdCByZWNlbnRcblx0Ly8gYXJ0aWNsZXMpOlxuXHRnX3VybHMgPSBuZXcgQXJyYXkoKTtcblx0Z190aXRsZXMgPSBuZXcgQXJyYXkoKTtcblx0Z19odG1sX2Jsb2NrcyA9IG5ldyBBcnJheSgpO1xuXG5cdC8vIGF0dGFja2xhYjogUmVwbGFjZSB+IHdpdGggflRcblx0Ly8gVGhpcyBsZXRzIHVzIHVzZSB0aWxkZSBhcyBhbiBlc2NhcGUgY2hhciB0byBhdm9pZCBtZDUgaGFzaGVzXG5cdC8vIFRoZSBjaG9pY2Ugb2YgY2hhcmFjdGVyIGlzIGFyYml0cmF5OyBhbnl0aGluZyB0aGF0IGlzbid0XG4gICAgLy8gbWFnaWMgaW4gTWFya2Rvd24gd2lsbCB3b3JrLlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+L2csXCJ+VFwiKTtcblxuXHQvLyBhdHRhY2tsYWI6IFJlcGxhY2UgJCB3aXRoIH5EXG5cdC8vIFJlZ0V4cCBpbnRlcnByZXRzICQgYXMgYSBzcGVjaWFsIGNoYXJhY3RlclxuXHQvLyB3aGVuIGl0J3MgaW4gYSByZXBsYWNlbWVudCBzdHJpbmdcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFwkL2csXCJ+RFwiKTtcblxuXHQvLyBTdGFuZGFyZGl6ZSBsaW5lIGVuZGluZ3Ncblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7IC8vIERPUyB0byBVbml4XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcci9nLFwiXFxuXCIpOyAvLyBNYWMgdG8gVW5peFxuXG5cdC8vIE1ha2Ugc3VyZSB0ZXh0IGJlZ2lucyBhbmQgZW5kcyB3aXRoIGEgY291cGxlIG9mIG5ld2xpbmVzOlxuXHR0ZXh0ID0gXCJcXG5cXG5cIiArIHRleHQgKyBcIlxcblxcblwiO1xuXG5cdC8vIENvbnZlcnQgYWxsIHRhYnMgdG8gc3BhY2VzLlxuXHR0ZXh0ID0gX0RldGFiKHRleHQpO1xuXG5cdC8vIFN0cmlwIGFueSBsaW5lcyBjb25zaXN0aW5nIG9ubHkgb2Ygc3BhY2VzIGFuZCB0YWJzLlxuXHQvLyBUaGlzIG1ha2VzIHN1YnNlcXVlbnQgcmVnZXhlbiBlYXNpZXIgdG8gd3JpdGUsIGJlY2F1c2Ugd2UgY2FuXG5cdC8vIG1hdGNoIGNvbnNlY3V0aXZlIGJsYW5rIGxpbmVzIHdpdGggL1xcbisvIGluc3RlYWQgb2Ygc29tZXRoaW5nXG5cdC8vIGNvbnRvcnRlZCBsaWtlIC9bIFxcdF0qXFxuKy8gLlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBcXHRdKyQvbWcsXCJcIik7XG5cblx0Ly8gSGFuZGxlIGdpdGh1YiBjb2RlYmxvY2tzIHByaW9yIHRvIHJ1bm5pbmcgSGFzaEhUTUwgc28gdGhhdFxuXHQvLyBIVE1MIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNvZGVibG9jayBnZXRzIGVzY2FwZWQgcHJvcGVydGx5XG5cdHRleHQgPSBfRG9HaXRodWJDb2RlQmxvY2tzKHRleHQpO1xuXG5cdC8vIFR1cm4gYmxvY2stbGV2ZWwgSFRNTCBibG9ja3MgaW50byBoYXNoIGVudHJpZXNcblx0dGV4dCA9IF9IYXNoSFRNTEJsb2Nrcyh0ZXh0KTtcblxuXHQvLyBTdHJpcCBsaW5rIGRlZmluaXRpb25zLCBzdG9yZSBpbiBoYXNoZXMuXG5cdHRleHQgPSBfU3RyaXBMaW5rRGVmaW5pdGlvbnModGV4dCk7XG5cblx0dGV4dCA9IF9SdW5CbG9ja0dhbXV0KHRleHQpO1xuXG5cdHRleHQgPSBfVW5lc2NhcGVTcGVjaWFsQ2hhcnModGV4dCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXN0b3JlIGRvbGxhciBzaWduc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+RC9nLFwiJCRcIik7XG5cblx0Ly8gYXR0YWNrbGFiOiBSZXN0b3JlIHRpbGRlc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+VC9nLFwiflwiKTtcblxuXHRyZXR1cm4gdGV4dDtcbn07XG5cblxudmFyIF9TdHJpcExpbmtEZWZpbml0aW9ucyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyBTdHJpcHMgbGluayBkZWZpbml0aW9ucyBmcm9tIHRleHQsIHN0b3JlcyB0aGUgVVJMcyBhbmQgdGl0bGVzIGluXG4vLyBoYXNoIHJlZmVyZW5jZXMuXG4vL1xuXG5cdC8vIExpbmsgZGVmcyBhcmUgaW4gdGhlIGZvcm06IF5baWRdOiB1cmwgXCJvcHRpb25hbCB0aXRsZVwiXG5cblx0Lypcblx0XHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHRcdF5bIF17MCwzfVxcWyguKylcXF06ICAvLyBpZCA9ICQxICBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0XHQgIFsgXFx0XSpcblx0XHRcdFx0ICBcXG4/XHRcdFx0XHQvLyBtYXliZSAqb25lKiBuZXdsaW5lXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQ8PyhcXFMrPyk+P1x0XHRcdC8vIHVybCA9ICQyXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQgIFxcbj9cdFx0XHRcdC8vIG1heWJlIG9uZSBuZXdsaW5lXG5cdFx0XHRcdCAgWyBcXHRdKlxuXHRcdFx0XHQoPzpcblx0XHRcdFx0ICAoXFxuKilcdFx0XHRcdC8vIGFueSBsaW5lcyBza2lwcGVkID0gJDMgYXR0YWNrbGFiOiBsb29rYmVoaW5kIHJlbW92ZWRcblx0XHRcdFx0ICBbXCIoXVxuXHRcdFx0XHQgICguKz8pXHRcdFx0XHQvLyB0aXRsZSA9ICQ0XG5cdFx0XHRcdCAgW1wiKV1cblx0XHRcdFx0ICBbIFxcdF0qXG5cdFx0XHRcdCk/XHRcdFx0XHRcdC8vIHRpdGxlIGlzIG9wdGlvbmFsXG5cdFx0XHRcdCg/Olxcbit8JClcblx0XHRcdCAgL2dtLFxuXHRcdFx0ICBmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXHR2YXIgdGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDN9XFxbKC4rKVxcXTpbIFxcdF0qXFxuP1sgXFx0XSo8PyhcXFMrPyk+P1sgXFx0XSpcXG4/WyBcXHRdKig/OihcXG4qKVtcIihdKC4rPylbXCIpXVsgXFx0XSopPyg/Olxcbit8XFxaKS9nbSxcblx0XHRmdW5jdGlvbiAod2hvbGVNYXRjaCxtMSxtMixtMyxtNCkge1xuXHRcdFx0bTEgPSBtMS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0Z191cmxzW20xXSA9IF9FbmNvZGVBbXBzQW5kQW5nbGVzKG0yKTsgIC8vIExpbmsgSURzIGFyZSBjYXNlLWluc2Vuc2l0aXZlXG5cdFx0XHRpZiAobTMpIHtcblx0XHRcdFx0Ly8gT29wcywgZm91bmQgYmxhbmsgbGluZXMsIHNvIGl0J3Mgbm90IGEgdGl0bGUuXG5cdFx0XHRcdC8vIFB1dCBiYWNrIHRoZSBwYXJlbnRoZXRpY2FsIHN0YXRlbWVudCB3ZSBzdG9sZS5cblx0XHRcdFx0cmV0dXJuIG0zK200O1xuXHRcdFx0fSBlbHNlIGlmIChtNCkge1xuXHRcdFx0XHRnX3RpdGxlc1ttMV0gPSBtNC5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb21wbGV0ZWx5IHJlbW92ZSB0aGUgZGVmaW5pdGlvbiBmcm9tIHRoZSB0ZXh0XG5cdFx0XHRyZXR1cm4gXCJcIjtcblx0XHR9XG5cdCk7XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9IYXNoSFRNTEJsb2NrcyA9IGZ1bmN0aW9uKHRleHQpIHtcblx0Ly8gYXR0YWNrbGFiOiBEb3VibGUgdXAgYmxhbmsgbGluZXMgdG8gcmVkdWNlIGxvb2thcm91bmRcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxuL2csXCJcXG5cXG5cIik7XG5cblx0Ly8gSGFzaGlmeSBIVE1MIGJsb2Nrczpcblx0Ly8gV2Ugb25seSB3YW50IHRvIGRvIHRoaXMgZm9yIGJsb2NrLWxldmVsIEhUTUwgdGFncywgc3VjaCBhcyBoZWFkZXJzLFxuXHQvLyBsaXN0cywgYW5kIHRhYmxlcy4gVGhhdCdzIGJlY2F1c2Ugd2Ugc3RpbGwgd2FudCB0byB3cmFwIDxwPnMgYXJvdW5kXG5cdC8vIFwicGFyYWdyYXBoc1wiIHRoYXQgYXJlIHdyYXBwZWQgaW4gbm9uLWJsb2NrLWxldmVsIHRhZ3MsIHN1Y2ggYXMgYW5jaG9ycyxcblx0Ly8gcGhyYXNlIGVtcGhhc2lzLCBhbmQgc3BhbnMuIFRoZSBsaXN0IG9mIHRhZ3Mgd2UncmUgbG9va2luZyBmb3IgaXNcblx0Ly8gaGFyZC1jb2RlZDpcblx0dmFyIGJsb2NrX3RhZ3NfYSA9IFwicHxkaXZ8aFsxLTZdfGJsb2NrcXVvdGV8cHJlfHRhYmxlfGRsfG9sfHVsfHNjcmlwdHxub3NjcmlwdHxmb3JtfGZpZWxkc2V0fGlmcmFtZXxtYXRofGluc3xkZWx8c3R5bGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyfG5hdnxhcnRpY2xlfGFzaWRlXCI7XG5cdHZhciBibG9ja190YWdzX2IgPSBcInB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxzdHlsZXxzZWN0aW9ufGhlYWRlcnxmb290ZXJ8bmF2fGFydGljbGV8YXNpZGVcIjtcblxuXHQvLyBGaXJzdCwgbG9vayBmb3IgbmVzdGVkIGJsb2NrcywgZS5nLjpcblx0Ly8gICA8ZGl2PlxuXHQvLyAgICAgPGRpdj5cblx0Ly8gICAgIHRhZ3MgZm9yIGlubmVyIGJsb2NrIG11c3QgYmUgaW5kZW50ZWQuXG5cdC8vICAgICA8L2Rpdj5cblx0Ly8gICA8L2Rpdj5cblx0Ly9cblx0Ly8gVGhlIG91dGVybW9zdCB0YWdzIG11c3Qgc3RhcnQgYXQgdGhlIGxlZnQgbWFyZ2luIGZvciB0aGlzIHRvIG1hdGNoLCBhbmRcblx0Ly8gdGhlIGlubmVyIG5lc3RlZCBkaXZzIG11c3QgYmUgaW5kZW50ZWQuXG5cdC8vIFdlIG5lZWQgdG8gZG8gdGhpcyBiZWZvcmUgdGhlIG5leHQsIG1vcmUgbGliZXJhbCBtYXRjaCwgYmVjYXVzZSB0aGUgbmV4dFxuXHQvLyBtYXRjaCB3aWxsIHN0YXJ0IGF0IHRoZSBmaXJzdCBgPGRpdj5gIGFuZCBzdG9wIGF0IHRoZSBmaXJzdCBgPC9kaXY+YC5cblxuXHQvLyBhdHRhY2tsYWI6IFRoaXMgcmVnZXggY2FuIGJlIGV4cGVuc2l2ZSB3aGVuIGl0IGZhaWxzLlxuXHQvKlxuXHRcdHZhciB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0Xlx0XHRcdFx0XHQvLyBzdGFydCBvZiBsaW5lICAod2l0aCAvbSlcblx0XHRcdDwoJGJsb2NrX3RhZ3NfYSlcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQga2h0bWwvcGNyZSBidWcuLi5cblx0XHRcdFteXFxyXSo/XFxuXHRcdFx0Ly8gYW55IG51bWJlciBvZiBsaW5lcywgbWluaW1hbGx5IG1hdGNoaW5nXG5cdFx0XHQ8L1xcMj5cdFx0XHRcdC8vIHRoZSBtYXRjaGluZyBlbmQgdGFnXG5cdFx0XHRbIFxcdF0qXHRcdFx0XHQvLyB0cmFpbGluZyBzcGFjZXMvdGFic1xuXHRcdFx0KD89XFxuKylcdFx0XHRcdC8vIGZvbGxvd2VkIGJ5IGEgbmV3bGluZVxuXHRcdClcdFx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IHRoZXJlIGFyZSBzZW50aW5lbCBuZXdsaW5lcyBhdCBlbmQgb2YgZG9jdW1lbnRcblx0XHQvZ20sZnVuY3Rpb24oKXsuLi59fTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXig8KHB8ZGl2fGhbMS02XXxibG9ja3F1b3RlfHByZXx0YWJsZXxkbHxvbHx1bHxzY3JpcHR8bm9zY3JpcHR8Zm9ybXxmaWVsZHNldHxpZnJhbWV8bWF0aHxpbnN8ZGVsKVxcYlteXFxyXSo/XFxuPFxcL1xcMj5bIFxcdF0qKD89XFxuKykpL2dtLGhhc2hFbGVtZW50KTtcblxuXHQvL1xuXHQvLyBOb3cgbWF0Y2ggbW9yZSBsaWJlcmFsbHksIHNpbXBseSBmcm9tIGBcXG48dGFnPmAgdG8gYDwvdGFnPlxcbmBcblx0Ly9cblxuXHQvKlxuXHRcdHZhciB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0Xlx0XHRcdFx0XHQvLyBzdGFydCBvZiBsaW5lICAod2l0aCAvbSlcblx0XHRcdDwoJGJsb2NrX3RhZ3NfYilcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0XHRcdFx0XHRcdC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQga2h0bWwvcGNyZSBidWcuLi5cblx0XHRcdFteXFxyXSo/XHRcdFx0XHQvLyBhbnkgbnVtYmVyIG9mIGxpbmVzLCBtaW5pbWFsbHkgbWF0Y2hpbmdcblx0XHRcdC4qPC9cXDI+XHRcdFx0XHQvLyB0aGUgbWF0Y2hpbmcgZW5kIHRhZ1xuXHRcdFx0WyBcXHRdKlx0XHRcdFx0Ly8gdHJhaWxpbmcgc3BhY2VzL3RhYnNcblx0XHRcdCg/PVxcbispXHRcdFx0XHQvLyBmb2xsb3dlZCBieSBhIG5ld2xpbmVcblx0XHQpXHRcdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB0aGVyZSBhcmUgc2VudGluZWwgbmV3bGluZXMgYXQgZW5kIG9mIGRvY3VtZW50XG5cdFx0L2dtLGZ1bmN0aW9uKCl7Li4ufX07XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oPChwfGRpdnxoWzEtNl18YmxvY2txdW90ZXxwcmV8dGFibGV8ZGx8b2x8dWx8c2NyaXB0fG5vc2NyaXB0fGZvcm18ZmllbGRzZXR8aWZyYW1lfG1hdGh8c3R5bGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyfG5hdnxhcnRpY2xlfGFzaWRlKVxcYlteXFxyXSo/Lio8XFwvXFwyPlsgXFx0XSooPz1cXG4rKVxcbikvZ20saGFzaEVsZW1lbnQpO1xuXG5cdC8vIFNwZWNpYWwgY2FzZSBqdXN0IGZvciA8aHIgLz4uIEl0IHdhcyBlYXNpZXIgdG8gbWFrZSBhIHNwZWNpYWwgY2FzZSB0aGFuXG5cdC8vIHRvIG1ha2UgdGhlIG90aGVyIHJlZ2V4IG1vcmUgY29tcGxpY2F0ZWQuXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gc2F2ZSBpbiAkMVxuXHRcdFx0XFxuXFxuXHRcdFx0XHQvLyBTdGFydGluZyBhZnRlciBhIGJsYW5rIGxpbmVcblx0XHRcdFsgXXswLDN9XG5cdFx0XHQoPChocilcdFx0XHRcdC8vIHN0YXJ0IHRhZyA9ICQyXG5cdFx0XHRcXGJcdFx0XHRcdFx0Ly8gd29yZCBicmVha1xuXHRcdFx0KFtePD5dKSo/XHRcdFx0Ly9cblx0XHRcdFxcLz8+KVx0XHRcdFx0Ly8gdGhlIG1hdGNoaW5nIGVuZCB0YWdcblx0XHRcdFsgXFx0XSpcblx0XHRcdCg/PVxcbnsyLH0pXHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdC9nLGhhc2hFbGVtZW50KTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcblsgXXswLDN9KDwoaHIpXFxiKFtePD5dKSo/XFwvPz4pWyBcXHRdKig/PVxcbnsyLH0pKS9nLGhhc2hFbGVtZW50KTtcblxuXHQvLyBTcGVjaWFsIGNhc2UgZm9yIHN0YW5kYWxvbmUgSFRNTCBjb21tZW50czpcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHQvLyBzYXZlIGluICQxXG5cdFx0XHRcXG5cXG5cdFx0XHRcdC8vIFN0YXJ0aW5nIGFmdGVyIGEgYmxhbmsgbGluZVxuXHRcdFx0WyBdezAsM31cdFx0XHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0PCFcblx0XHRcdCgtLVteXFxyXSo/LS1cXHMqKStcblx0XHRcdD5cblx0XHRcdFsgXFx0XSpcblx0XHRcdCg/PVxcbnsyLH0pXHRcdFx0Ly8gZm9sbG93ZWQgYnkgYSBibGFuayBsaW5lXG5cdFx0KVxuXHRcdC9nLGhhc2hFbGVtZW50KTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcblxcblsgXXswLDN9PCEoLS1bXlxccl0qPy0tXFxzKikrPlsgXFx0XSooPz1cXG57Mix9KSkvZyxoYXNoRWxlbWVudCk7XG5cblx0Ly8gUEhQIGFuZCBBU1Atc3R5bGUgcHJvY2Vzc29yIGluc3RydWN0aW9ucyAoPD8uLi4/PiBhbmQgPCUuLi4lPilcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdCg/OlxuXHRcdFx0XFxuXFxuXHRcdFx0XHQvLyBTdGFydGluZyBhZnRlciBhIGJsYW5rIGxpbmVcblx0XHQpXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHNhdmUgaW4gJDFcblx0XHRcdFsgXXswLDN9XHRcdFx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aCAtIDFcblx0XHRcdCg/OlxuXHRcdFx0XHQ8KFs/JV0pXHRcdFx0Ly8gJDJcblx0XHRcdFx0W15cXHJdKj9cblx0XHRcdFx0XFwyPlxuXHRcdFx0KVxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KD89XFxuezIsfSlcdFx0XHQvLyBmb2xsb3dlZCBieSBhIGJsYW5rIGxpbmVcblx0XHQpXG5cdFx0L2csaGFzaEVsZW1lbnQpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oPzpcXG5cXG4pKFsgXXswLDN9KD86PChbPyVdKVteXFxyXSo/XFwyPilbIFxcdF0qKD89XFxuezIsfSkpL2csaGFzaEVsZW1lbnQpO1xuXG5cdC8vIGF0dGFja2xhYjogVW5kbyBkb3VibGUgbGluZXMgKHNlZSBjb21tZW50IGF0IHRvcCBvZiB0aGlzIGZ1bmN0aW9uKVxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG5cXG4vZyxcIlxcblwiKTtcblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBoYXNoRWxlbWVudCA9IGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0dmFyIGJsb2NrVGV4dCA9IG0xO1xuXG5cdC8vIFVuZG8gZG91YmxlIGxpbmVzXG5cdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9cXG5cXG4vZyxcIlxcblwiKTtcblx0YmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL15cXG4vLFwiXCIpO1xuXG5cdC8vIHN0cmlwIHRyYWlsaW5nIGJsYW5rIGxpbmVzXG5cdGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9cXG4rJC9nLFwiXCIpO1xuXG5cdC8vIFJlcGxhY2UgdGhlIGVsZW1lbnQgdGV4dCB3aXRoIGEgbWFya2VyIChcIn5LeEtcIiB3aGVyZSB4IGlzIGl0cyBrZXkpXG5cdGJsb2NrVGV4dCA9IFwiXFxuXFxufktcIiArIChnX2h0bWxfYmxvY2tzLnB1c2goYmxvY2tUZXh0KS0xKSArIFwiS1xcblxcblwiO1xuXG5cdHJldHVybiBibG9ja1RleHQ7XG59O1xuXG52YXIgX1J1bkJsb2NrR2FtdXQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVGhlc2UgYXJlIGFsbCB0aGUgdHJhbnNmb3JtYXRpb25zIHRoYXQgZm9ybSBibG9jay1sZXZlbFxuLy8gdGFncyBsaWtlIHBhcmFncmFwaHMsIGhlYWRlcnMsIGFuZCBsaXN0IGl0ZW1zLlxuLy9cblx0dGV4dCA9IF9Eb0hlYWRlcnModGV4dCk7XG5cblx0Ly8gRG8gSG9yaXpvbnRhbCBSdWxlczpcblx0dmFyIGtleSA9IGhhc2hCbG9jayhcIjxociAvPlwiKTtcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXCpbIF0/KXszLH1bIFxcdF0qJC9nbSxrZXkpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBdezAsMn0oWyBdP1xcLVsgXT8pezMsfVsgXFx0XSokL2dtLGtleSk7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwyfShbIF0/XFxfWyBdPyl7Myx9WyBcXHRdKiQvZ20sa2V5KTtcblxuXHR0ZXh0ID0gX0RvTGlzdHModGV4dCk7XG5cdHRleHQgPSBfRG9Db2RlQmxvY2tzKHRleHQpO1xuXHR0ZXh0ID0gX0RvQmxvY2tRdW90ZXModGV4dCk7XG5cblx0Ly8gV2UgYWxyZWFkeSByYW4gX0hhc2hIVE1MQmxvY2tzKCkgYmVmb3JlLCBpbiBNYXJrZG93bigpLCBidXQgdGhhdFxuXHQvLyB3YXMgdG8gZXNjYXBlIHJhdyBIVE1MIGluIHRoZSBvcmlnaW5hbCBNYXJrZG93biBzb3VyY2UuIFRoaXMgdGltZSxcblx0Ly8gd2UncmUgZXNjYXBpbmcgdGhlIG1hcmt1cCB3ZSd2ZSBqdXN0IGNyZWF0ZWQsIHNvIHRoYXQgd2UgZG9uJ3Qgd3JhcFxuXHQvLyA8cD4gdGFncyBhcm91bmQgYmxvY2stbGV2ZWwgdGFncy5cblx0dGV4dCA9IF9IYXNoSFRNTEJsb2Nrcyh0ZXh0KTtcblx0dGV4dCA9IF9Gb3JtUGFyYWdyYXBocyh0ZXh0KTtcblxuXHRyZXR1cm4gdGV4dDtcbn07XG5cblxudmFyIF9SdW5TcGFuR2FtdXQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVGhlc2UgYXJlIGFsbCB0aGUgdHJhbnNmb3JtYXRpb25zIHRoYXQgb2NjdXIgKndpdGhpbiogYmxvY2stbGV2ZWxcbi8vIHRhZ3MgbGlrZSBwYXJhZ3JhcGhzLCBoZWFkZXJzLCBhbmQgbGlzdCBpdGVtcy5cbi8vXG5cblx0dGV4dCA9IF9Eb0NvZGVTcGFucyh0ZXh0KTtcblx0dGV4dCA9IF9Fc2NhcGVTcGVjaWFsQ2hhcnNXaXRoaW5UYWdBdHRyaWJ1dGVzKHRleHQpO1xuXHR0ZXh0ID0gX0VuY29kZUJhY2tzbGFzaEVzY2FwZXModGV4dCk7XG5cblx0Ly8gUHJvY2VzcyBhbmNob3IgYW5kIGltYWdlIHRhZ3MuIEltYWdlcyBtdXN0IGNvbWUgZmlyc3QsXG5cdC8vIGJlY2F1c2UgIVtmb29dW2ZdIGxvb2tzIGxpa2UgYW4gYW5jaG9yLlxuXHR0ZXh0ID0gX0RvSW1hZ2VzKHRleHQpO1xuXHR0ZXh0ID0gX0RvQW5jaG9ycyh0ZXh0KTtcblxuXHQvLyBNYWtlIGxpbmtzIG91dCBvZiB0aGluZ3MgbGlrZSBgPGh0dHA6Ly9leGFtcGxlLmNvbS8+YFxuXHQvLyBNdXN0IGNvbWUgYWZ0ZXIgX0RvQW5jaG9ycygpLCBiZWNhdXNlIHlvdSBjYW4gdXNlIDwgYW5kID5cblx0Ly8gZGVsaW1pdGVycyBpbiBpbmxpbmUgbGlua3MgbGlrZSBbdGhpc10oPHVybD4pLlxuXHR0ZXh0ID0gX0RvQXV0b0xpbmtzKHRleHQpO1xuXHR0ZXh0ID0gX0VuY29kZUFtcHNBbmRBbmdsZXModGV4dCk7XG5cdHRleHQgPSBfRG9JdGFsaWNzQW5kQm9sZCh0ZXh0KTtcblxuXHQvLyBEbyBoYXJkIGJyZWFrczpcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvICArXFxuL2csXCIgPGJyIC8+XFxuXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gV2l0aGluIHRhZ3MgLS0gbWVhbmluZyBiZXR3ZWVuIDwgYW5kID4gLS0gZW5jb2RlIFtcXCBgICogX10gc28gdGhleVxuLy8gZG9uJ3QgY29uZmxpY3Qgd2l0aCB0aGVpciB1c2UgaW4gTWFya2Rvd24gZm9yIGNvZGUsIGl0YWxpY3MgYW5kIHN0cm9uZy5cbi8vXG5cblx0Ly8gQnVpbGQgYSByZWdleCB0byBmaW5kIEhUTUwgdGFncyBhbmQgY29tbWVudHMuICBTZWUgRnJpZWRsJ3Ncblx0Ly8gXCJNYXN0ZXJpbmcgUmVndWxhciBFeHByZXNzaW9uc1wiLCAybmQgRWQuLCBwcC4gMjAwLTIwMS5cblx0dmFyIHJlZ2V4ID0gLyg8W2EtelxcLyEkXShcIlteXCJdKlwifCdbXiddKid8W14nXCI+XSkqPnw8ISgtLS4qPy0tXFxzKikrPikvZ2k7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZShyZWdleCwgZnVuY3Rpb24od2hvbGVNYXRjaCkge1xuXHRcdHZhciB0YWcgPSB3aG9sZU1hdGNoLnJlcGxhY2UoLyguKTxcXC8/Y29kZT4oPz0uKS9nLFwiJDFgXCIpO1xuXHRcdHRhZyA9IGVzY2FwZUNoYXJhY3RlcnModGFnLFwiXFxcXGAqX1wiKTtcblx0XHRyZXR1cm4gdGFnO1xuXHR9KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIF9Eb0FuY2hvcnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gVHVybiBNYXJrZG93biBsaW5rIHNob3J0Y3V0cyBpbnRvIFhIVE1MIDxhPiB0YWdzLlxuLy9cblx0Ly9cblx0Ly8gRmlyc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgbGlua3M6IFtsaW5rIHRleHRdIFtpZF1cblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdFxcW1xuXHRcdFx0KFxuXHRcdFx0XHQoPzpcblx0XHRcdFx0XHRcXFtbXlxcXV0qXFxdXHRcdC8vIGFsbG93IGJyYWNrZXRzIG5lc3RlZCBvbmUgbGV2ZWxcblx0XHRcdFx0XHR8XG5cdFx0XHRcdFx0W15cXFtdXHRcdFx0Ly8gb3IgYW55dGhpbmcgZWxzZVxuXHRcdFx0XHQpKlxuXHRcdFx0KVxuXHRcdFx0XFxdXG5cblx0XHRcdFsgXT9cdFx0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIHNwYWNlXG5cdFx0XHQoPzpcXG5bIF0qKT9cdFx0XHRcdC8vIG9uZSBvcHRpb25hbCBuZXdsaW5lIGZvbGxvd2VkIGJ5IHNwYWNlc1xuXG5cdFx0XHRcXFtcblx0XHRcdCguKj8pXHRcdFx0XHRcdC8vIGlkID0gJDNcblx0XHRcdFxcXVxuXHRcdCkoKSgpKCkoKVx0XHRcdFx0XHQvLyBwYWQgcmVtYWluaW5nIGJhY2tyZWZlcmVuY2VzXG5cdFx0L2csX0RvQW5jaG9yc19jYWxsYmFjayk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFsoKD86XFxbW15cXF1dKlxcXXxbXlxcW1xcXV0pKilcXF1bIF0/KD86XFxuWyBdKik/XFxbKC4qPylcXF0pKCkoKSgpKCkvZyx3cml0ZUFuY2hvclRhZyk7XG5cblx0Ly9cblx0Ly8gTmV4dCwgaW5saW5lLXN0eWxlIGxpbmtzOiBbbGluayB0ZXh0XSh1cmwgXCJvcHRpb25hbCB0aXRsZVwiKVxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHQoXHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0XHRcXFtcblx0XHRcdFx0KFxuXHRcdFx0XHRcdCg/OlxuXHRcdFx0XHRcdFx0XFxbW15cXF1dKlxcXVx0Ly8gYWxsb3cgYnJhY2tldHMgbmVzdGVkIG9uZSBsZXZlbFxuXHRcdFx0XHRcdHxcblx0XHRcdFx0XHRbXlxcW1xcXV1cdFx0XHQvLyBvciBhbnl0aGluZyBlbHNlXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHRcdFxcXVxuXHRcdFx0XFwoXHRcdFx0XHRcdFx0Ly8gbGl0ZXJhbCBwYXJlblxuXHRcdFx0WyBcXHRdKlxuXHRcdFx0KClcdFx0XHRcdFx0XHQvLyBubyBpZCwgc28gbGVhdmUgJDMgZW1wdHlcblx0XHRcdDw/KC4qPyk+P1x0XHRcdFx0Ly8gaHJlZiA9ICQ0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoXHRcdFx0XHRcdFx0Ly8gJDVcblx0XHRcdFx0KFsnXCJdKVx0XHRcdFx0Ly8gcXVvdGUgY2hhciA9ICQ2XG5cdFx0XHRcdCguKj8pXHRcdFx0XHQvLyBUaXRsZSA9ICQ3XG5cdFx0XHRcdFxcNlx0XHRcdFx0XHQvLyBtYXRjaGluZyBxdW90ZVxuXHRcdFx0XHRbIFxcdF0qXHRcdFx0XHQvLyBpZ25vcmUgYW55IHNwYWNlcy90YWJzIGJldHdlZW4gY2xvc2luZyBxdW90ZSBhbmQgKVxuXHRcdFx0KT9cdFx0XHRcdFx0XHQvLyB0aXRsZSBpcyBvcHRpb25hbFxuXHRcdFx0XFwpXG5cdFx0KVxuXHRcdC9nLHdyaXRlQW5jaG9yVGFnKTtcblx0Ki9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcWygoPzpcXFtbXlxcXV0qXFxdfFteXFxbXFxdXSkqKVxcXVxcKFsgXFx0XSooKTw/KC4qPyk+P1sgXFx0XSooKFsnXCJdKSguKj8pXFw2WyBcXHRdKik/XFwpKS9nLHdyaXRlQW5jaG9yVGFnKTtcblxuXHQvL1xuXHQvLyBMYXN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIHNob3J0Y3V0czogW2xpbmsgdGV4dF1cblx0Ly8gVGhlc2UgbXVzdCBjb21lIGxhc3QgaW4gY2FzZSB5b3UndmUgYWxzbyBnb3QgW2xpbmsgdGVzdF1bMV1cblx0Ly8gb3IgW2xpbmsgdGVzdF0oL2Zvbylcblx0Ly9cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0IFx0XHRcdFx0XHQvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXG5cdFx0XHRcXFtcblx0XHRcdChbXlxcW1xcXV0rKVx0XHRcdFx0Ly8gbGluayB0ZXh0ID0gJDI7IGNhbid0IGNvbnRhaW4gJ1snIG9yICddJ1xuXHRcdFx0XFxdXG5cdFx0KSgpKCkoKSgpKClcdFx0XHRcdFx0Ly8gcGFkIHJlc3Qgb2YgYmFja3JlZmVyZW5jZXNcblx0XHQvZywgd3JpdGVBbmNob3JUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbKFteXFxbXFxdXSspXFxdKSgpKCkoKSgpKCkvZywgd3JpdGVBbmNob3JUYWcpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgd3JpdGVBbmNob3JUYWcgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00LG01LG02LG03KSB7XG5cdGlmIChtNyA9PSB1bmRlZmluZWQpIG03ID0gXCJcIjtcblx0dmFyIHdob2xlX21hdGNoID0gbTE7XG5cdHZhciBsaW5rX3RleHQgICA9IG0yO1xuXHR2YXIgbGlua19pZFx0ID0gbTMudG9Mb3dlckNhc2UoKTtcblx0dmFyIHVybFx0XHQ9IG00O1xuXHR2YXIgdGl0bGVcdD0gbTc7XG5cblx0aWYgKHVybCA9PSBcIlwiKSB7XG5cdFx0aWYgKGxpbmtfaWQgPT0gXCJcIikge1xuXHRcdFx0Ly8gbG93ZXItY2FzZSBhbmQgdHVybiBlbWJlZGRlZCBuZXdsaW5lcyBpbnRvIHNwYWNlc1xuXHRcdFx0bGlua19pZCA9IGxpbmtfdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyA/XFxuL2csXCIgXCIpO1xuXHRcdH1cblx0XHR1cmwgPSBcIiNcIitsaW5rX2lkO1xuXG5cdFx0aWYgKGdfdXJsc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdHVybCA9IGdfdXJsc1tsaW5rX2lkXTtcblx0XHRcdGlmIChnX3RpdGxlc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dGl0bGUgPSBnX3RpdGxlc1tsaW5rX2lkXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAod2hvbGVfbWF0Y2guc2VhcmNoKC9cXChcXHMqXFwpJC9tKT4tMSkge1xuXHRcdFx0XHQvLyBTcGVjaWFsIGNhc2UgZm9yIGV4cGxpY2l0IGVtcHR5IHVybFxuXHRcdFx0XHR1cmwgPSBcIlwiO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHdob2xlX21hdGNoO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHVybCA9IGVzY2FwZUNoYXJhY3RlcnModXJsLFwiKl9cIik7XG5cdHZhciByZXN1bHQgPSBcIjxhIGhyZWY9XFxcIlwiICsgdXJsICsgXCJcXFwiXCI7XG5cblx0aWYgKHRpdGxlICE9IFwiXCIpIHtcblx0XHR0aXRsZSA9IHRpdGxlLnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIik7XG5cdFx0dGl0bGUgPSBlc2NhcGVDaGFyYWN0ZXJzKHRpdGxlLFwiKl9cIik7XG5cdFx0cmVzdWx0ICs9ICBcIiB0aXRsZT1cXFwiXCIgKyB0aXRsZSArIFwiXFxcIlwiO1xuXHR9XG5cblx0cmVzdWx0ICs9IFwiPlwiICsgbGlua190ZXh0ICsgXCI8L2E+XCI7XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuXG52YXIgX0RvSW1hZ2VzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFR1cm4gTWFya2Rvd24gaW1hZ2Ugc2hvcnRjdXRzIGludG8gPGltZz4gdGFncy5cbi8vXG5cblx0Ly9cblx0Ly8gRmlyc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgbGFiZWxlZCBpbWFnZXM6ICFbYWx0IHRleHRdW2lkXVxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0KFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcblx0XHRcdCFcXFtcblx0XHRcdCguKj8pXHRcdFx0XHQvLyBhbHQgdGV4dCA9ICQyXG5cdFx0XHRcXF1cblxuXHRcdFx0WyBdP1x0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIHNwYWNlXG5cdFx0XHQoPzpcXG5bIF0qKT9cdFx0XHQvLyBvbmUgb3B0aW9uYWwgbmV3bGluZSBmb2xsb3dlZCBieSBzcGFjZXNcblxuXHRcdFx0XFxbXG5cdFx0XHQoLio/KVx0XHRcdFx0Ly8gaWQgPSAkM1xuXHRcdFx0XFxdXG5cdFx0KSgpKCkoKSgpXHRcdFx0XHQvLyBwYWQgcmVzdCBvZiBiYWNrcmVmZXJlbmNlc1xuXHRcdC9nLHdyaXRlSW1hZ2VUYWcpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oIVxcWyguKj8pXFxdWyBdPyg/OlxcblsgXSopP1xcWyguKj8pXFxdKSgpKCkoKSgpL2csd3JpdGVJbWFnZVRhZyk7XG5cblx0Ly9cblx0Ly8gTmV4dCwgaGFuZGxlIGlubGluZSBpbWFnZXM6ICAhW2FsdCB0ZXh0XSh1cmwgXCJvcHRpb25hbCB0aXRsZVwiKVxuXHQvLyBEb24ndCBmb3JnZXQ6IGVuY29kZSAqIGFuZCBfXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHQoXHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0IVxcW1xuXHRcdFx0KC4qPylcdFx0XHRcdC8vIGFsdCB0ZXh0ID0gJDJcblx0XHRcdFxcXVxuXHRcdFx0XFxzP1x0XHRcdFx0XHQvLyBPbmUgb3B0aW9uYWwgd2hpdGVzcGFjZSBjaGFyYWN0ZXJcblx0XHRcdFxcKFx0XHRcdFx0XHQvLyBsaXRlcmFsIHBhcmVuXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoKVx0XHRcdFx0XHQvLyBubyBpZCwgc28gbGVhdmUgJDMgZW1wdHlcblx0XHRcdDw/KFxcUys/KT4/XHRcdFx0Ly8gc3JjIHVybCA9ICQ0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoXHRcdFx0XHRcdC8vICQ1XG5cdFx0XHRcdChbJ1wiXSlcdFx0XHQvLyBxdW90ZSBjaGFyID0gJDZcblx0XHRcdFx0KC4qPylcdFx0XHQvLyB0aXRsZSA9ICQ3XG5cdFx0XHRcdFxcNlx0XHRcdFx0Ly8gbWF0Y2hpbmcgcXVvdGVcblx0XHRcdFx0WyBcXHRdKlxuXHRcdFx0KT9cdFx0XHRcdFx0Ly8gdGl0bGUgaXMgb3B0aW9uYWxcblx0XHRcXClcblx0XHQpXG5cdFx0L2csd3JpdGVJbWFnZVRhZyk7XG5cdCovXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyghXFxbKC4qPylcXF1cXHM/XFwoWyBcXHRdKigpPD8oXFxTKz8pPj9bIFxcdF0qKChbJ1wiXSkoLio/KVxcNlsgXFx0XSopP1xcKSkvZyx3cml0ZUltYWdlVGFnKTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxudmFyIHdyaXRlSW1hZ2VUYWcgPSBmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yLG0zLG00LG01LG02LG03KSB7XG5cdHZhciB3aG9sZV9tYXRjaCA9IG0xO1xuXHR2YXIgYWx0X3RleHQgICA9IG0yO1xuXHR2YXIgbGlua19pZFx0ID0gbTMudG9Mb3dlckNhc2UoKTtcblx0dmFyIHVybFx0XHQ9IG00O1xuXHR2YXIgdGl0bGVcdD0gbTc7XG5cblx0aWYgKCF0aXRsZSkgdGl0bGUgPSBcIlwiO1xuXG5cdGlmICh1cmwgPT0gXCJcIikge1xuXHRcdGlmIChsaW5rX2lkID09IFwiXCIpIHtcblx0XHRcdC8vIGxvd2VyLWNhc2UgYW5kIHR1cm4gZW1iZWRkZWQgbmV3bGluZXMgaW50byBzcGFjZXNcblx0XHRcdGxpbmtfaWQgPSBhbHRfdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyA/XFxuL2csXCIgXCIpO1xuXHRcdH1cblx0XHR1cmwgPSBcIiNcIitsaW5rX2lkO1xuXG5cdFx0aWYgKGdfdXJsc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdHVybCA9IGdfdXJsc1tsaW5rX2lkXTtcblx0XHRcdGlmIChnX3RpdGxlc1tsaW5rX2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dGl0bGUgPSBnX3RpdGxlc1tsaW5rX2lkXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gd2hvbGVfbWF0Y2g7XG5cdFx0fVxuXHR9XG5cblx0YWx0X3RleHQgPSBhbHRfdGV4dC5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpO1xuXHR1cmwgPSBlc2NhcGVDaGFyYWN0ZXJzKHVybCxcIipfXCIpO1xuXHR2YXIgcmVzdWx0ID0gXCI8aW1nIHNyYz1cXFwiXCIgKyB1cmwgKyBcIlxcXCIgYWx0PVxcXCJcIiArIGFsdF90ZXh0ICsgXCJcXFwiXCI7XG5cblx0Ly8gYXR0YWNrbGFiOiBNYXJrZG93bi5wbCBhZGRzIGVtcHR5IHRpdGxlIGF0dHJpYnV0ZXMgdG8gaW1hZ2VzLlxuXHQvLyBSZXBsaWNhdGUgdGhpcyBidWcuXG5cblx0Ly9pZiAodGl0bGUgIT0gXCJcIikge1xuXHRcdHRpdGxlID0gdGl0bGUucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKTtcblx0XHR0aXRsZSA9IGVzY2FwZUNoYXJhY3RlcnModGl0bGUsXCIqX1wiKTtcblx0XHRyZXN1bHQgKz0gIFwiIHRpdGxlPVxcXCJcIiArIHRpdGxlICsgXCJcXFwiXCI7XG5cdC8vfVxuXG5cdHJlc3VsdCArPSBcIiAvPlwiO1xuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cblxudmFyIF9Eb0hlYWRlcnMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cblx0Ly8gU2V0ZXh0LXN0eWxlIGhlYWRlcnM6XG5cdC8vXHRIZWFkZXIgMVxuXHQvL1x0PT09PT09PT1cblx0Ly9cblx0Ly9cdEhlYWRlciAyXG5cdC8vXHQtLS0tLS0tLVxuXHQvL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKC4rKVsgXFx0XSpcXG49K1sgXFx0XSpcXG4rL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpe3JldHVybiBoYXNoQmxvY2soJzxoMSBpZD1cIicgKyBoZWFkZXJJZChtMSkgKyAnXCI+JyArIF9SdW5TcGFuR2FtdXQobTEpICsgXCI8L2gxPlwiKTt9KTtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKC4rKVsgXFx0XSpcXG4tK1sgXFx0XSpcXG4rL2dtLFxuXHRcdGZ1bmN0aW9uKG1hdGNoRm91bmQsbTEpe3JldHVybiBoYXNoQmxvY2soJzxoMiBpZD1cIicgKyBoZWFkZXJJZChtMSkgKyAnXCI+JyArIF9SdW5TcGFuR2FtdXQobTEpICsgXCI8L2gyPlwiKTt9KTtcblxuXHQvLyBhdHgtc3R5bGUgaGVhZGVyczpcblx0Ly8gICMgSGVhZGVyIDFcblx0Ly8gICMjIEhlYWRlciAyXG5cdC8vICAjIyBIZWFkZXIgMiB3aXRoIGNsb3NpbmcgaGFzaGVzICMjXG5cdC8vICAuLi5cblx0Ly8gICMjIyMjIyBIZWFkZXIgNlxuXHQvL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvXG5cdFx0XHReKFxcI3sxLDZ9KVx0XHRcdFx0Ly8gJDEgPSBzdHJpbmcgb2YgIydzXG5cdFx0XHRbIFxcdF0qXG5cdFx0XHQoLis/KVx0XHRcdFx0XHQvLyAkMiA9IEhlYWRlciB0ZXh0XG5cdFx0XHRbIFxcdF0qXG5cdFx0XHRcXCMqXHRcdFx0XHRcdFx0Ly8gb3B0aW9uYWwgY2xvc2luZyAjJ3MgKG5vdCBjb3VudGVkKVxuXHRcdFx0XFxuK1xuXHRcdC9nbSwgZnVuY3Rpb24oKSB7Li4ufSk7XG5cdCovXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXihcXCN7MSw2fSlbIFxcdF0qKC4rPylbIFxcdF0qXFwjKlxcbisvZ20sXG5cdFx0ZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMikge1xuXHRcdFx0dmFyIGhfbGV2ZWwgPSBtMS5sZW5ndGg7XG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKFwiPGhcIiArIGhfbGV2ZWwgKyAnIGlkPVwiJyArIGhlYWRlcklkKG0yKSArICdcIj4nICsgX1J1blNwYW5HYW11dChtMikgKyBcIjwvaFwiICsgaF9sZXZlbCArIFwiPlwiKTtcblx0XHR9KTtcblxuXHRmdW5jdGlvbiBoZWFkZXJJZChtKSB7XG5cdFx0cmV0dXJuIG0ucmVwbGFjZSgvW15cXHddL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuXHR9XG5cdHJldHVybiB0ZXh0O1xufVxuXG4vLyBUaGlzIGRlY2xhcmF0aW9uIGtlZXBzIERvam8gY29tcHJlc3NvciBmcm9tIG91dHB1dHRpbmcgZ2FyYmFnZTpcbnZhciBfUHJvY2Vzc0xpc3RJdGVtcztcblxudmFyIF9Eb0xpc3RzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIEZvcm0gSFRNTCBvcmRlcmVkIChudW1iZXJlZCkgYW5kIHVub3JkZXJlZCAoYnVsbGV0ZWQpIGxpc3RzLlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IGFkZCBzZW50aW5lbCB0byBoYWNrIGFyb3VuZCBraHRtbC9zYWZhcmkgYnVnOlxuXHQvLyBodHRwOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xMTIzMVxuXHR0ZXh0ICs9IFwifjBcIjtcblxuXHQvLyBSZS11c2FibGUgcGF0dGVybiB0byBtYXRjaCBhbnkgZW50aXJlbCB1bCBvciBvbCBsaXN0OlxuXG5cdC8qXG5cdFx0dmFyIHdob2xlX2xpc3QgPSAvXG5cdFx0KFx0XHRcdFx0XHRcdFx0XHRcdC8vICQxID0gd2hvbGUgbGlzdFxuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkMlxuXHRcdFx0XHRbIF17MCwzfVx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuXHRcdFx0XHQoWyorLV18XFxkK1suXSlcdFx0XHRcdC8vICQzID0gZmlyc3QgbGlzdCBpdGVtIG1hcmtlclxuXHRcdFx0XHRbIFxcdF0rXG5cdFx0XHQpXG5cdFx0XHRbXlxccl0rP1xuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkNFxuXHRcdFx0XHR+MFx0XHRcdFx0XHRcdFx0Ly8gc2VudGluZWwgZm9yIHdvcmthcm91bmQ7IHNob3VsZCBiZSAkXG5cdFx0XHR8XG5cdFx0XHRcdFxcbnsyLH1cblx0XHRcdFx0KD89XFxTKVxuXHRcdFx0XHQoPyFcdFx0XHRcdFx0XHRcdC8vIE5lZ2F0aXZlIGxvb2thaGVhZCBmb3IgYW5vdGhlciBsaXN0IGl0ZW0gbWFya2VyXG5cdFx0XHRcdFx0WyBcXHRdKlxuXHRcdFx0XHRcdCg/OlsqKy1dfFxcZCtbLl0pWyBcXHRdK1xuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0KS9nXG5cdCovXG5cdHZhciB3aG9sZV9saXN0ID0gL14oKFsgXXswLDN9KFsqKy1dfFxcZCtbLl0pWyBcXHRdKylbXlxccl0rPyh+MHxcXG57Mix9KD89XFxTKSg/IVsgXFx0XSooPzpbKistXXxcXGQrWy5dKVsgXFx0XSspKSkvZ207XG5cblx0aWYgKGdfbGlzdF9sZXZlbCkge1xuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2Uod2hvbGVfbGlzdCxmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgbGlzdCA9IG0xO1xuXHRcdFx0dmFyIGxpc3RfdHlwZSA9IChtMi5zZWFyY2goL1sqKy1dL2cpPi0xKSA/IFwidWxcIiA6IFwib2xcIjtcblxuXHRcdFx0Ly8gVHVybiBkb3VibGUgcmV0dXJucyBpbnRvIHRyaXBsZSByZXR1cm5zLCBzbyB0aGF0IHdlIGNhbiBtYWtlIGFcblx0XHRcdC8vIHBhcmFncmFwaCBmb3IgdGhlIGxhc3QgaXRlbSBpbiBhIGxpc3QsIGlmIG5lY2Vzc2FyeTpcblx0XHRcdGxpc3QgPSBsaXN0LnJlcGxhY2UoL1xcbnsyLH0vZyxcIlxcblxcblxcblwiKTs7XG5cdFx0XHR2YXIgcmVzdWx0ID0gX1Byb2Nlc3NMaXN0SXRlbXMobGlzdCk7XG5cblx0XHRcdC8vIFRyaW0gYW55IHRyYWlsaW5nIHdoaXRlc3BhY2UsIHRvIHB1dCB0aGUgY2xvc2luZyBgPC8kbGlzdF90eXBlPmBcblx0XHRcdC8vIHVwIG9uIHRoZSBwcmVjZWRpbmcgbGluZSwgdG8gZ2V0IGl0IHBhc3QgdGhlIGN1cnJlbnQgc3R1cGlkXG5cdFx0XHQvLyBIVE1MIGJsb2NrIHBhcnNlci4gVGhpcyBpcyBhIGhhY2sgdG8gd29yayBhcm91bmQgdGhlIHRlcnJpYmxlXG5cdFx0XHQvLyBoYWNrIHRoYXQgaXMgdGhlIEhUTUwgYmxvY2sgcGFyc2VyLlxuXHRcdFx0cmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoL1xccyskLyxcIlwiKTtcblx0XHRcdHJlc3VsdCA9IFwiPFwiK2xpc3RfdHlwZStcIj5cIiArIHJlc3VsdCArIFwiPC9cIitsaXN0X3R5cGUrXCI+XFxuXCI7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHdob2xlX2xpc3QgPSAvKFxcblxcbnxeXFxuPykoKFsgXXswLDN9KFsqKy1dfFxcZCtbLl0pWyBcXHRdKylbXlxccl0rPyh+MHxcXG57Mix9KD89XFxTKSg/IVsgXFx0XSooPzpbKistXXxcXGQrWy5dKVsgXFx0XSspKSkvZztcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHdob2xlX2xpc3QsZnVuY3Rpb24od2hvbGVNYXRjaCxtMSxtMixtMykge1xuXHRcdFx0dmFyIHJ1bnVwID0gbTE7XG5cdFx0XHR2YXIgbGlzdCA9IG0yO1xuXG5cdFx0XHR2YXIgbGlzdF90eXBlID0gKG0zLnNlYXJjaCgvWyorLV0vZyk+LTEpID8gXCJ1bFwiIDogXCJvbFwiO1xuXHRcdFx0Ly8gVHVybiBkb3VibGUgcmV0dXJucyBpbnRvIHRyaXBsZSByZXR1cm5zLCBzbyB0aGF0IHdlIGNhbiBtYWtlIGFcblx0XHRcdC8vIHBhcmFncmFwaCBmb3IgdGhlIGxhc3QgaXRlbSBpbiBhIGxpc3QsIGlmIG5lY2Vzc2FyeTpcblx0XHRcdHZhciBsaXN0ID0gbGlzdC5yZXBsYWNlKC9cXG57Mix9L2csXCJcXG5cXG5cXG5cIik7O1xuXHRcdFx0dmFyIHJlc3VsdCA9IF9Qcm9jZXNzTGlzdEl0ZW1zKGxpc3QpO1xuXHRcdFx0cmVzdWx0ID0gcnVudXAgKyBcIjxcIitsaXN0X3R5cGUrXCI+XFxuXCIgKyByZXN1bHQgKyBcIjwvXCIrbGlzdF90eXBlK1wiPlxcblwiO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9KTtcblx0fVxuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5fUHJvY2Vzc0xpc3RJdGVtcyA9IGZ1bmN0aW9uKGxpc3Rfc3RyKSB7XG4vL1xuLy8gIFByb2Nlc3MgdGhlIGNvbnRlbnRzIG9mIGEgc2luZ2xlIG9yZGVyZWQgb3IgdW5vcmRlcmVkIGxpc3QsIHNwbGl0dGluZyBpdFxuLy8gIGludG8gaW5kaXZpZHVhbCBsaXN0IGl0ZW1zLlxuLy9cblx0Ly8gVGhlICRnX2xpc3RfbGV2ZWwgZ2xvYmFsIGtlZXBzIHRyYWNrIG9mIHdoZW4gd2UncmUgaW5zaWRlIGEgbGlzdC5cblx0Ly8gRWFjaCB0aW1lIHdlIGVudGVyIGEgbGlzdCwgd2UgaW5jcmVtZW50IGl0OyB3aGVuIHdlIGxlYXZlIGEgbGlzdCxcblx0Ly8gd2UgZGVjcmVtZW50LiBJZiBpdCdzIHplcm8sIHdlJ3JlIG5vdCBpbiBhIGxpc3QgYW55bW9yZS5cblx0Ly9cblx0Ly8gV2UgZG8gdGhpcyBiZWNhdXNlIHdoZW4gd2UncmUgbm90IGluc2lkZSBhIGxpc3QsIHdlIHdhbnQgdG8gdHJlYXRcblx0Ly8gc29tZXRoaW5nIGxpa2UgdGhpczpcblx0Ly9cblx0Ly8gICAgSSByZWNvbW1lbmQgdXBncmFkaW5nIHRvIHZlcnNpb25cblx0Ly8gICAgOC4gT29wcywgbm93IHRoaXMgbGluZSBpcyB0cmVhdGVkXG5cdC8vICAgIGFzIGEgc3ViLWxpc3QuXG5cdC8vXG5cdC8vIEFzIGEgc2luZ2xlIHBhcmFncmFwaCwgZGVzcGl0ZSB0aGUgZmFjdCB0aGF0IHRoZSBzZWNvbmQgbGluZSBzdGFydHNcblx0Ly8gd2l0aCBhIGRpZ2l0LXBlcmlvZC1zcGFjZSBzZXF1ZW5jZS5cblx0Ly9cblx0Ly8gV2hlcmVhcyB3aGVuIHdlJ3JlIGluc2lkZSBhIGxpc3QgKG9yIHN1Yi1saXN0KSwgdGhhdCBsaW5lIHdpbGwgYmVcblx0Ly8gdHJlYXRlZCBhcyB0aGUgc3RhcnQgb2YgYSBzdWItbGlzdC4gV2hhdCBhIGtsdWRnZSwgaHVoPyBUaGlzIGlzXG5cdC8vIGFuIGFzcGVjdCBvZiBNYXJrZG93bidzIHN5bnRheCB0aGF0J3MgaGFyZCB0byBwYXJzZSBwZXJmZWN0bHlcblx0Ly8gd2l0aG91dCByZXNvcnRpbmcgdG8gbWluZC1yZWFkaW5nLiBQZXJoYXBzIHRoZSBzb2x1dGlvbiBpcyB0b1xuXHQvLyBjaGFuZ2UgdGhlIHN5bnRheCBydWxlcyBzdWNoIHRoYXQgc3ViLWxpc3RzIG11c3Qgc3RhcnQgd2l0aCBhXG5cdC8vIHN0YXJ0aW5nIGNhcmRpbmFsIG51bWJlcjsgZS5nLiBcIjEuXCIgb3IgXCJhLlwiLlxuXG5cdGdfbGlzdF9sZXZlbCsrO1xuXG5cdC8vIHRyaW0gdHJhaWxpbmcgYmxhbmsgbGluZXM6XG5cdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvXFxuezIsfSQvLFwiXFxuXCIpO1xuXG5cdC8vIGF0dGFja2xhYjogYWRkIHNlbnRpbmVsIHRvIGVtdWxhdGUgXFx6XG5cdGxpc3Rfc3RyICs9IFwifjBcIjtcblxuXHQvKlxuXHRcdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvXG5cdFx0XHQoXFxuKT9cdFx0XHRcdFx0XHRcdC8vIGxlYWRpbmcgbGluZSA9ICQxXG5cdFx0XHQoXlsgXFx0XSopXHRcdFx0XHRcdFx0Ly8gbGVhZGluZyB3aGl0ZXNwYWNlID0gJDJcblx0XHRcdChbKistXXxcXGQrWy5dKSBbIFxcdF0rXHRcdFx0Ly8gbGlzdCBtYXJrZXIgPSAkM1xuXHRcdFx0KFteXFxyXSs/XHRcdFx0XHRcdFx0Ly8gbGlzdCBpdGVtIHRleHQgICA9ICQ0XG5cdFx0XHQoXFxuezEsMn0pKVxuXHRcdFx0KD89IFxcbiogKH4wIHwgXFwyIChbKistXXxcXGQrWy5dKSBbIFxcdF0rKSlcblx0XHQvZ20sIGZ1bmN0aW9uKCl7Li4ufSk7XG5cdCovXG5cdGxpc3Rfc3RyID0gbGlzdF9zdHIucmVwbGFjZSgvKFxcbik/KF5bIFxcdF0qKShbKistXXxcXGQrWy5dKVsgXFx0XSsoW15cXHJdKz8oXFxuezEsMn0pKSg/PVxcbioofjB8XFwyKFsqKy1dfFxcZCtbLl0pWyBcXHRdKykpL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQpe1xuXHRcdFx0dmFyIGl0ZW0gPSBtNDtcblx0XHRcdHZhciBsZWFkaW5nX2xpbmUgPSBtMTtcblx0XHRcdHZhciBsZWFkaW5nX3NwYWNlID0gbTI7XG5cblx0XHRcdGlmIChsZWFkaW5nX2xpbmUgfHwgKGl0ZW0uc2VhcmNoKC9cXG57Mix9Lyk+LTEpKSB7XG5cdFx0XHRcdGl0ZW0gPSBfUnVuQmxvY2tHYW11dChfT3V0ZGVudChpdGVtKSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gUmVjdXJzaW9uIGZvciBzdWItbGlzdHM6XG5cdFx0XHRcdGl0ZW0gPSBfRG9MaXN0cyhfT3V0ZGVudChpdGVtKSk7XG5cdFx0XHRcdGl0ZW0gPSBpdGVtLnJlcGxhY2UoL1xcbiQvLFwiXCIpOyAvLyBjaG9tcChpdGVtKVxuXHRcdFx0XHRpdGVtID0gX1J1blNwYW5HYW11dChpdGVtKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuICBcIjxsaT5cIiArIGl0ZW0gKyBcIjwvbGk+XFxuXCI7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0bGlzdF9zdHIgPSBsaXN0X3N0ci5yZXBsYWNlKC9+MC9nLFwiXCIpO1xuXG5cdGdfbGlzdF9sZXZlbC0tO1xuXHRyZXR1cm4gbGlzdF9zdHI7XG59XG5cblxudmFyIF9Eb0NvZGVCbG9ja3MgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gIFByb2Nlc3MgTWFya2Rvd24gYDxwcmU+PGNvZGU+YCBibG9ja3MuXG4vL1xuXG5cdC8qXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSh0ZXh0LFxuXHRcdFx0Lyg/OlxcblxcbnxeKVxuXHRcdFx0KFx0XHRcdFx0XHRcdFx0XHQvLyAkMSA9IHRoZSBjb2RlIGJsb2NrIC0tIG9uZSBvciBtb3JlIGxpbmVzLCBzdGFydGluZyB3aXRoIGEgc3BhY2UvdGFiXG5cdFx0XHRcdCg/OlxuXHRcdFx0XHRcdCg/OlsgXXs0fXxcXHQpXHRcdFx0Ly8gTGluZXMgbXVzdCBzdGFydCB3aXRoIGEgdGFiIG9yIGEgdGFiLXdpZHRoIG9mIHNwYWNlcyAtIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblx0XHRcdFx0XHQuKlxcbitcblx0XHRcdFx0KStcblx0XHRcdClcblx0XHRcdChcXG4qWyBdezAsM31bXiBcXHRcXG5dfCg/PX4wKSlcdC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblx0XHQvZyxmdW5jdGlvbigpey4uLn0pO1xuXHQqL1xuXG5cdC8vIGF0dGFja2xhYjogc2VudGluZWwgd29ya2Fyb3VuZHMgZm9yIGxhY2sgb2YgXFxBIGFuZCBcXFosIHNhZmFyaVxca2h0bWwgYnVnXG5cdHRleHQgKz0gXCJ+MFwiO1xuXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg/OlxcblxcbnxeKSgoPzooPzpbIF17NH18XFx0KS4qXFxuKykrKShcXG4qWyBdezAsM31bXiBcXHRcXG5dfCg/PX4wKSkvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgY29kZWJsb2NrID0gbTE7XG5cdFx0XHR2YXIgbmV4dENoYXIgPSBtMjtcblxuXHRcdFx0Y29kZWJsb2NrID0gX0VuY29kZUNvZGUoIF9PdXRkZW50KGNvZGVibG9jaykpO1xuXHRcdFx0Y29kZWJsb2NrID0gX0RldGFiKGNvZGVibG9jayk7XG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXlxcbisvZyxcIlwiKTsgLy8gdHJpbSBsZWFkaW5nIG5ld2xpbmVzXG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTsgLy8gdHJpbSB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cblx0XHRcdGNvZGVibG9jayA9IFwiPHByZT48Y29kZT5cIiArIGNvZGVibG9jayArIFwiXFxuPC9jb2RlPjwvcHJlPlwiO1xuXG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKGNvZGVibG9jaykgKyBuZXh0Q2hhcjtcblx0XHR9XG5cdCk7XG5cblx0Ly8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC8sXCJcIik7XG5cblx0cmV0dXJuIHRleHQ7XG59O1xuXG52YXIgX0RvR2l0aHViQ29kZUJsb2NrcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgUHJvY2VzcyBHaXRodWItc3R5bGUgY29kZSBibG9ja3Ncbi8vICBFeGFtcGxlOlxuLy8gIGBgYHJ1Ynlcbi8vICBkZWYgaGVsbG9fd29ybGQoeClcbi8vICAgIHB1dHMgXCJIZWxsbywgI3t4fVwiXG4vLyAgZW5kXG4vLyAgYGBgXG4vL1xuXG5cblx0Ly8gYXR0YWNrbGFiOiBzZW50aW5lbCB3b3JrYXJvdW5kcyBmb3IgbGFjayBvZiBcXEEgYW5kIFxcWiwgc2FmYXJpXFxraHRtbCBidWdcblx0dGV4dCArPSBcIn4wXCI7XG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvKD86XnxcXG4pYGBgKC4qKVxcbihbXFxzXFxTXSo/KVxcbmBgYC9nLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIpIHtcblx0XHRcdHZhciBsYW5ndWFnZSA9IG0xO1xuXHRcdFx0dmFyIGNvZGVibG9jayA9IG0yO1xuXG5cdFx0XHRjb2RlYmxvY2sgPSBfRW5jb2RlQ29kZShjb2RlYmxvY2spO1xuXHRcdFx0Y29kZWJsb2NrID0gX0RldGFiKGNvZGVibG9jayk7XG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXlxcbisvZyxcIlwiKTsgLy8gdHJpbSBsZWFkaW5nIG5ld2xpbmVzXG5cdFx0XHRjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXFxuKyQvZyxcIlwiKTsgLy8gdHJpbSB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cblx0XHRcdGNvZGVibG9jayA9IFwiPHByZT48Y29kZVwiICsgKGxhbmd1YWdlID8gXCIgY2xhc3M9XFxcIlwiICsgbGFuZ3VhZ2UgKyAnXCInIDogXCJcIikgKyBcIj5cIiArIGNvZGVibG9jayArIFwiXFxuPC9jb2RlPjwvcHJlPlwiO1xuXG5cdFx0XHRyZXR1cm4gaGFzaEJsb2NrKGNvZGVibG9jayk7XG5cdFx0fVxuXHQpO1xuXG5cdC8vIGF0dGFja2xhYjogc3RyaXAgc2VudGluZWxcblx0dGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgaGFzaEJsb2NrID0gZnVuY3Rpb24odGV4dCkge1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXlxcbit8XFxuKyQpL2csXCJcIik7XG5cdHJldHVybiBcIlxcblxcbn5LXCIgKyAoZ19odG1sX2Jsb2Nrcy5wdXNoKHRleHQpLTEpICsgXCJLXFxuXFxuXCI7XG59XG5cbnZhciBfRG9Db2RlU3BhbnMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gICAqICBCYWNrdGljayBxdW90ZXMgYXJlIHVzZWQgZm9yIDxjb2RlPjwvY29kZT4gc3BhbnMuXG4vL1xuLy8gICAqICBZb3UgY2FuIHVzZSBtdWx0aXBsZSBiYWNrdGlja3MgYXMgdGhlIGRlbGltaXRlcnMgaWYgeW91IHdhbnQgdG9cbi8vXHQgaW5jbHVkZSBsaXRlcmFsIGJhY2t0aWNrcyBpbiB0aGUgY29kZSBzcGFuLiBTbywgdGhpcyBpbnB1dDpcbi8vXG4vL1x0XHQgSnVzdCB0eXBlIGBgZm9vIGBiYXJgIGJhemBgIGF0IHRoZSBwcm9tcHQuXG4vL1xuLy9cdCAgIFdpbGwgdHJhbnNsYXRlIHRvOlxuLy9cbi8vXHRcdCA8cD5KdXN0IHR5cGUgPGNvZGU+Zm9vIGBiYXJgIGJhejwvY29kZT4gYXQgdGhlIHByb21wdC48L3A+XG4vL1xuLy9cdFRoZXJlJ3Mgbm8gYXJiaXRyYXJ5IGxpbWl0IHRvIHRoZSBudW1iZXIgb2YgYmFja3RpY2tzIHlvdVxuLy9cdGNhbiB1c2UgYXMgZGVsaW10ZXJzLiBJZiB5b3UgbmVlZCB0aHJlZSBjb25zZWN1dGl2ZSBiYWNrdGlja3Ncbi8vXHRpbiB5b3VyIGNvZGUsIHVzZSBmb3VyIGZvciBkZWxpbWl0ZXJzLCBldGMuXG4vL1xuLy8gICogIFlvdSBjYW4gdXNlIHNwYWNlcyB0byBnZXQgbGl0ZXJhbCBiYWNrdGlja3MgYXQgdGhlIGVkZ2VzOlxuLy9cbi8vXHRcdCAuLi4gdHlwZSBgYCBgYmFyYCBgYCAuLi5cbi8vXG4vL1x0ICAgVHVybnMgdG86XG4vL1xuLy9cdFx0IC4uLiB0eXBlIDxjb2RlPmBiYXJgPC9jb2RlPiAuLi5cbi8vXG5cblx0Lypcblx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cblx0XHRcdChefFteXFxcXF0pXHRcdFx0XHRcdC8vIENoYXJhY3RlciBiZWZvcmUgb3BlbmluZyBgIGNhbid0IGJlIGEgYmFja3NsYXNoXG5cdFx0XHQoYCspXHRcdFx0XHRcdFx0Ly8gJDIgPSBPcGVuaW5nIHJ1biBvZiBgXG5cdFx0XHQoXHRcdFx0XHRcdFx0XHQvLyAkMyA9IFRoZSBjb2RlIGJsb2NrXG5cdFx0XHRcdFteXFxyXSo/XG5cdFx0XHRcdFteYF1cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB3b3JrIGFyb3VuZCBsYWNrIG9mIGxvb2tiZWhpbmRcblx0XHRcdClcblx0XHRcdFxcMlx0XHRcdFx0XHRcdFx0Ly8gTWF0Y2hpbmcgY2xvc2VyXG5cdFx0XHQoPyFgKVxuXHRcdC9nbSwgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXnxbXlxcXFxdKShgKykoW15cXHJdKj9bXmBdKVxcMig/IWApL2dtLFxuXHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEsbTIsbTMsbTQpIHtcblx0XHRcdHZhciBjID0gbTM7XG5cdFx0XHRjID0gYy5yZXBsYWNlKC9eKFsgXFx0XSopL2csXCJcIik7XHQvLyBsZWFkaW5nIHdoaXRlc3BhY2Vcblx0XHRcdGMgPSBjLnJlcGxhY2UoL1sgXFx0XSokL2csXCJcIik7XHQvLyB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cdFx0XHRjID0gX0VuY29kZUNvZGUoYyk7XG5cdFx0XHRyZXR1cm4gbTErXCI8Y29kZT5cIitjK1wiPC9jb2RlPlwiO1xuXHRcdH0pO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG52YXIgX0VuY29kZUNvZGUgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gRW5jb2RlL2VzY2FwZSBjZXJ0YWluIGNoYXJhY3RlcnMgaW5zaWRlIE1hcmtkb3duIGNvZGUgcnVucy5cbi8vIFRoZSBwb2ludCBpcyB0aGF0IGluIGNvZGUsIHRoZXNlIGNoYXJhY3RlcnMgYXJlIGxpdGVyYWxzLFxuLy8gYW5kIGxvc2UgdGhlaXIgc3BlY2lhbCBNYXJrZG93biBtZWFuaW5ncy5cbi8vXG5cdC8vIEVuY29kZSBhbGwgYW1wZXJzYW5kczsgSFRNTCBlbnRpdGllcyBhcmUgbm90XG5cdC8vIGVudGl0aWVzIHdpdGhpbiBhIE1hcmtkb3duIGNvZGUgc3Bhbi5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvJi9nLFwiJmFtcDtcIik7XG5cblx0Ly8gRG8gdGhlIGFuZ2xlIGJyYWNrZXQgc29uZyBhbmQgZGFuY2U6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwvZyxcIiZsdDtcIik7XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLz4vZyxcIiZndDtcIik7XG5cblx0Ly8gTm93LCBlc2NhcGUgY2hhcmFjdGVycyB0aGF0IGFyZSBtYWdpYyBpbiBNYXJrZG93bjpcblx0dGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcIlxcKl97fVtdXFxcXFwiLGZhbHNlKTtcblxuLy8gamogdGhlIGxpbmUgYWJvdmUgYnJlYWtzIHRoaXM6XG4vLy0tLVxuXG4vLyogSXRlbVxuXG4vLyAgIDEuIFN1Yml0ZW1cblxuLy8gICAgICAgICAgICBzcGVjaWFsIGNoYXI6ICpcbi8vLS0tXG5cblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9Eb0l0YWxpY3NBbmRCb2xkID0gZnVuY3Rpb24odGV4dCkge1xuXG5cdC8vIDxzdHJvbmc+IG11c3QgZ28gZmlyc3Q6XG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXCpcXCp8X18pKD89XFxTKShbXlxccl0qP1xcU1sqX10qKVxcMS9nLFxuXHRcdFwiPHN0cm9uZz4kMjwvc3Ryb25nPlwiKTtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFwqfF8pKD89XFxTKShbXlxccl0qP1xcUylcXDEvZyxcblx0XHRcIjxlbT4kMjwvZW0+XCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRG9CbG9ja1F1b3RlcyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdChcdFx0XHRcdFx0XHRcdFx0Ly8gV3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuXHRcdFx0KFxuXHRcdFx0XHReWyBcXHRdKj5bIFxcdF0/XHRcdFx0Ly8gJz4nIGF0IHRoZSBzdGFydCBvZiBhIGxpbmVcblx0XHRcdFx0LitcXG5cdFx0XHRcdFx0Ly8gcmVzdCBvZiB0aGUgZmlyc3QgbGluZVxuXHRcdFx0XHQoLitcXG4pKlx0XHRcdFx0XHQvLyBzdWJzZXF1ZW50IGNvbnNlY3V0aXZlIGxpbmVzXG5cdFx0XHRcdFxcbipcdFx0XHRcdFx0XHQvLyBibGFua3Ncblx0XHRcdCkrXG5cdFx0KVxuXHRcdC9nbSwgZnVuY3Rpb24oKXsuLi59KTtcblx0Ki9cblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oKF5bIFxcdF0qPlsgXFx0XT8uK1xcbiguK1xcbikqXFxuKikrKS9nbSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHR2YXIgYnEgPSBtMTtcblxuXHRcdFx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHRcdFx0Ly8gXCItLS0tLS0tLS0tYnVnXCIucmVwbGFjZSgvXi0vZyxcIlwiKSA9PSBcImJ1Z1wiXG5cblx0XHRcdGJxID0gYnEucmVwbGFjZSgvXlsgXFx0XSo+WyBcXHRdPy9nbSxcIn4wXCIpO1x0Ly8gdHJpbSBvbmUgbGV2ZWwgb2YgcXVvdGluZ1xuXG5cdFx0XHQvLyBhdHRhY2tsYWI6IGNsZWFuIHVwIGhhY2tcblx0XHRcdGJxID0gYnEucmVwbGFjZSgvfjAvZyxcIlwiKTtcblxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKC9eWyBcXHRdKyQvZ20sXCJcIik7XHRcdC8vIHRyaW0gd2hpdGVzcGFjZS1vbmx5IGxpbmVzXG5cdFx0XHRicSA9IF9SdW5CbG9ja0dhbXV0KGJxKTtcdFx0XHRcdC8vIHJlY3Vyc2VcblxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKC8oXnxcXG4pL2csXCIkMSAgXCIpO1xuXHRcdFx0Ly8gVGhlc2UgbGVhZGluZyBzcGFjZXMgc2NyZXcgd2l0aCA8cHJlPiBjb250ZW50LCBzbyB3ZSBuZWVkIHRvIGZpeCB0aGF0OlxuXHRcdFx0YnEgPSBicS5yZXBsYWNlKFxuXHRcdFx0XHRcdC8oXFxzKjxwcmU+W15cXHJdKz88XFwvcHJlPikvZ20sXG5cdFx0XHRcdGZ1bmN0aW9uKHdob2xlTWF0Y2gsbTEpIHtcblx0XHRcdFx0XHR2YXIgcHJlID0gbTE7XG5cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHRcdFx0XHRcdHByZSA9IHByZS5yZXBsYWNlKC9eICAvbWcsXCJ+MFwiKTtcblx0XHRcdFx0XHRwcmUgPSBwcmUucmVwbGFjZSgvfjAvZyxcIlwiKTtcblx0XHRcdFx0XHRyZXR1cm4gcHJlO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGhhc2hCbG9jayhcIjxibG9ja3F1b3RlPlxcblwiICsgYnEgKyBcIlxcbjwvYmxvY2txdW90ZT5cIik7XG5cdFx0fSk7XG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRm9ybVBhcmFncmFwaHMgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gIFBhcmFtczpcbi8vICAgICR0ZXh0IC0gc3RyaW5nIHRvIHByb2Nlc3Mgd2l0aCBodG1sIDxwPiB0YWdzXG4vL1xuXG5cdC8vIFN0cmlwIGxlYWRpbmcgYW5kIHRyYWlsaW5nIGxpbmVzOlxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eXFxuKy9nLFwiXCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLFwiXCIpO1xuXG5cdHZhciBncmFmcyA9IHRleHQuc3BsaXQoL1xcbnsyLH0vZyk7XG5cdHZhciBncmFmc091dCA9IG5ldyBBcnJheSgpO1xuXG5cdC8vXG5cdC8vIFdyYXAgPHA+IHRhZ3MuXG5cdC8vXG5cdHZhciBlbmQgPSBncmFmcy5sZW5ndGg7XG5cdGZvciAodmFyIGk9MDsgaTxlbmQ7IGkrKykge1xuXHRcdHZhciBzdHIgPSBncmFmc1tpXTtcblxuXHRcdC8vIGlmIHRoaXMgaXMgYW4gSFRNTCBtYXJrZXIsIGNvcHkgaXRcblx0XHRpZiAoc3RyLnNlYXJjaCgvfksoXFxkKylLL2cpID49IDApIHtcblx0XHRcdGdyYWZzT3V0LnB1c2goc3RyKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoc3RyLnNlYXJjaCgvXFxTLykgPj0gMCkge1xuXHRcdFx0c3RyID0gX1J1blNwYW5HYW11dChzdHIpO1xuXHRcdFx0c3RyID0gc3RyLnJlcGxhY2UoL14oWyBcXHRdKikvZyxcIjxwPlwiKTtcblx0XHRcdHN0ciArPSBcIjwvcD5cIlxuXHRcdFx0Z3JhZnNPdXQucHVzaChzdHIpO1xuXHRcdH1cblxuXHR9XG5cblx0Ly9cblx0Ly8gVW5oYXNoaWZ5IEhUTUwgYmxvY2tzXG5cdC8vXG5cdGVuZCA9IGdyYWZzT3V0Lmxlbmd0aDtcblx0Zm9yICh2YXIgaT0wOyBpPGVuZDsgaSsrKSB7XG5cdFx0Ly8gaWYgdGhpcyBpcyBhIG1hcmtlciBmb3IgYW4gaHRtbCBibG9jay4uLlxuXHRcdHdoaWxlIChncmFmc091dFtpXS5zZWFyY2goL35LKFxcZCspSy8pID49IDApIHtcblx0XHRcdHZhciBibG9ja1RleHQgPSBnX2h0bWxfYmxvY2tzW1JlZ0V4cC4kMV07XG5cdFx0XHRibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFwkL2csXCIkJCQkXCIpOyAvLyBFc2NhcGUgYW55IGRvbGxhciBzaWduc1xuXHRcdFx0Z3JhZnNPdXRbaV0gPSBncmFmc091dFtpXS5yZXBsYWNlKC9+S1xcZCtLLyxibG9ja1RleHQpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBncmFmc091dC5qb2luKFwiXFxuXFxuXCIpO1xufVxuXG5cbnZhciBfRW5jb2RlQW1wc0FuZEFuZ2xlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vIFNtYXJ0IHByb2Nlc3NpbmcgZm9yIGFtcGVyc2FuZHMgYW5kIGFuZ2xlIGJyYWNrZXRzIHRoYXQgbmVlZCB0byBiZSBlbmNvZGVkLlxuXG5cdC8vIEFtcGVyc2FuZC1lbmNvZGluZyBiYXNlZCBlbnRpcmVseSBvbiBOYXQgSXJvbnMncyBBbXB1dGF0b3IgTVQgcGx1Z2luOlxuXHQvLyAgIGh0dHA6Ly9idW1wcG8ubmV0L3Byb2plY3RzL2FtcHV0YXRvci9cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvJig/ISM/W3hYXT8oPzpbMC05YS1mQS1GXSt8XFx3Kyk7KS9nLFwiJmFtcDtcIik7XG5cblx0Ly8gRW5jb2RlIG5ha2VkIDwnc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KD8hW2EtelxcLz9cXCQhXSkvZ2ksXCImbHQ7XCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBfRW5jb2RlQmFja3NsYXNoRXNjYXBlcyA9IGZ1bmN0aW9uKHRleHQpIHtcbi8vXG4vLyAgIFBhcmFtZXRlcjogIFN0cmluZy5cbi8vICAgUmV0dXJuczpcdFRoZSBzdHJpbmcsIHdpdGggYWZ0ZXIgcHJvY2Vzc2luZyB0aGUgZm9sbG93aW5nIGJhY2tzbGFzaFxuLy9cdFx0XHQgICBlc2NhcGUgc2VxdWVuY2VzLlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IFRoZSBwb2xpdGUgd2F5IHRvIGRvIHRoaXMgaXMgd2l0aCB0aGUgbmV3XG5cdC8vIGVzY2FwZUNoYXJhY3RlcnMoKSBmdW5jdGlvbjpcblx0Ly9cblx0Ly8gXHR0ZXh0ID0gZXNjYXBlQ2hhcmFjdGVycyh0ZXh0LFwiXFxcXFwiLHRydWUpO1xuXHQvLyBcdHRleHQgPSBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsXCJgKl97fVtdKCk+IystLiFcIix0cnVlKTtcblx0Ly9cblx0Ly8gLi4uYnV0IHdlJ3JlIHNpZGVzdGVwcGluZyBpdHMgdXNlIG9mIHRoZSAoc2xvdykgUmVnRXhwIGNvbnN0cnVjdG9yXG5cdC8vIGFzIGFuIG9wdGltaXphdGlvbiBmb3IgRmlyZWZveC4gIFRoaXMgZnVuY3Rpb24gZ2V0cyBjYWxsZWQgYSBMT1QuXG5cblx0dGV4dCA9IHRleHQucmVwbGFjZSgvXFxcXChcXFxcKS9nLGVzY2FwZUNoYXJhY3RlcnNfY2FsbGJhY2spO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXFxcKFtgKl97fVxcW1xcXSgpPiMrLS4hXSkvZyxlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrKTtcblx0cmV0dXJuIHRleHQ7XG59XG5cblxudmFyIF9Eb0F1dG9MaW5rcyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KChodHRwcz98ZnRwfGRpY3QpOlteJ1wiPlxcc10rKT4vZ2ksXCI8YSBocmVmPVxcXCIkMVxcXCI+JDE8L2E+XCIpO1xuXG5cdC8vIEVtYWlsIGFkZHJlc3NlczogPGFkZHJlc3NAZG9tYWluLmZvbz5cblxuXHQvKlxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuXHRcdFx0PFxuXHRcdFx0KD86bWFpbHRvOik/XG5cdFx0XHQoXG5cdFx0XHRcdFstLlxcd10rXG5cdFx0XHRcdFxcQFxuXHRcdFx0XHRbLWEtejAtOV0rKFxcLlstYS16MC05XSspKlxcLlthLXpdK1xuXHRcdFx0KVxuXHRcdFx0PlxuXHRcdC9naSwgX0RvQXV0b0xpbmtzX2NhbGxiYWNrKCkpO1xuXHQqL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KD86bWFpbHRvOik/KFstLlxcd10rXFxAWy1hLXowLTldKyhcXC5bLWEtejAtOV0rKSpcXC5bYS16XSspPi9naSxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHRyZXR1cm4gX0VuY29kZUVtYWlsQWRkcmVzcyggX1VuZXNjYXBlU3BlY2lhbENoYXJzKG0xKSApO1xuXHRcdH1cblx0KTtcblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX0VuY29kZUVtYWlsQWRkcmVzcyA9IGZ1bmN0aW9uKGFkZHIpIHtcbi8vXG4vLyAgSW5wdXQ6IGFuIGVtYWlsIGFkZHJlc3MsIGUuZy4gXCJmb29AZXhhbXBsZS5jb21cIlxuLy9cbi8vICBPdXRwdXQ6IHRoZSBlbWFpbCBhZGRyZXNzIGFzIGEgbWFpbHRvIGxpbmssIHdpdGggZWFjaCBjaGFyYWN0ZXJcbi8vXHRvZiB0aGUgYWRkcmVzcyBlbmNvZGVkIGFzIGVpdGhlciBhIGRlY2ltYWwgb3IgaGV4IGVudGl0eSwgaW5cbi8vXHR0aGUgaG9wZXMgb2YgZm9pbGluZyBtb3N0IGFkZHJlc3MgaGFydmVzdGluZyBzcGFtIGJvdHMuIEUuZy46XG4vL1xuLy9cdDxhIGhyZWY9XCImI3g2RDsmIzk3OyYjMTA1OyYjMTA4OyYjeDc0OyYjMTExOzomIzEwMjsmIzExMTsmIzExMTsmIzY0OyYjMTAxO1xuLy9cdCAgIHgmI3g2MTsmIzEwOTsmI3g3MDsmIzEwODsmI3g2NTsmI3gyRTsmIzk5OyYjMTExOyYjMTA5O1wiPiYjMTAyOyYjMTExOyYjMTExO1xuLy9cdCAgICYjNjQ7JiMxMDE7eCYjeDYxOyYjMTA5OyYjeDcwOyYjMTA4OyYjeDY1OyYjeDJFOyYjOTk7JiMxMTE7JiMxMDk7PC9hPlxuLy9cbi8vICBCYXNlZCBvbiBhIGZpbHRlciBieSBNYXR0aGV3IFdpY2tsaW5lLCBwb3N0ZWQgdG8gdGhlIEJCRWRpdC1UYWxrXG4vLyAgbWFpbGluZyBsaXN0OiA8aHR0cDovL3Rpbnl1cmwuY29tL3l1N3VlPlxuLy9cblxuXHQvLyBhdHRhY2tsYWI6IHdoeSBjYW4ndCBqYXZhc2NyaXB0IHNwZWFrIGhleD9cblx0ZnVuY3Rpb24gY2hhcjJoZXgoY2gpIHtcblx0XHR2YXIgaGV4RGlnaXRzID0gJzAxMjM0NTY3ODlBQkNERUYnO1xuXHRcdHZhciBkZWMgPSBjaC5jaGFyQ29kZUF0KDApO1xuXHRcdHJldHVybihoZXhEaWdpdHMuY2hhckF0KGRlYz4+NCkgKyBoZXhEaWdpdHMuY2hhckF0KGRlYyYxNSkpO1xuXHR9XG5cblx0dmFyIGVuY29kZSA9IFtcblx0XHRmdW5jdGlvbihjaCl7cmV0dXJuIFwiJiNcIitjaC5jaGFyQ29kZUF0KDApK1wiO1wiO30sXG5cdFx0ZnVuY3Rpb24oY2gpe3JldHVybiBcIiYjeFwiK2NoYXIyaGV4KGNoKStcIjtcIjt9LFxuXHRcdGZ1bmN0aW9uKGNoKXtyZXR1cm4gY2g7fVxuXHRdO1xuXG5cdGFkZHIgPSBcIm1haWx0bzpcIiArIGFkZHI7XG5cblx0YWRkciA9IGFkZHIucmVwbGFjZSgvLi9nLCBmdW5jdGlvbihjaCkge1xuXHRcdGlmIChjaCA9PSBcIkBcIikge1xuXHRcdCAgIFx0Ly8gdGhpcyAqbXVzdCogYmUgZW5jb2RlZC4gSSBpbnNpc3QuXG5cdFx0XHRjaCA9IGVuY29kZVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMildKGNoKTtcblx0XHR9IGVsc2UgaWYgKGNoICE9XCI6XCIpIHtcblx0XHRcdC8vIGxlYXZlICc6JyBhbG9uZSAodG8gc3BvdCBtYWlsdG86IGxhdGVyKVxuXHRcdFx0dmFyIHIgPSBNYXRoLnJhbmRvbSgpO1xuXHRcdFx0Ly8gcm91Z2hseSAxMCUgcmF3LCA0NSUgaGV4LCA0NSUgZGVjXG5cdFx0XHRjaCA9ICAoXG5cdFx0XHRcdFx0ciA+IC45ICA/XHRlbmNvZGVbMl0oY2gpICAgOlxuXHRcdFx0XHRcdHIgPiAuNDUgP1x0ZW5jb2RlWzFdKGNoKSAgIDpcblx0XHRcdFx0XHRcdFx0XHRlbmNvZGVbMF0oY2gpXG5cdFx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBjaDtcblx0fSk7XG5cblx0YWRkciA9IFwiPGEgaHJlZj1cXFwiXCIgKyBhZGRyICsgXCJcXFwiPlwiICsgYWRkciArIFwiPC9hPlwiO1xuXHRhZGRyID0gYWRkci5yZXBsYWNlKC9cIj4uKzovZyxcIlxcXCI+XCIpOyAvLyBzdHJpcCB0aGUgbWFpbHRvOiBmcm9tIHRoZSB2aXNpYmxlIHBhcnRcblxuXHRyZXR1cm4gYWRkcjtcbn1cblxuXG52YXIgX1VuZXNjYXBlU3BlY2lhbENoYXJzID0gZnVuY3Rpb24odGV4dCkge1xuLy9cbi8vIFN3YXAgYmFjayBpbiBhbGwgdGhlIHNwZWNpYWwgY2hhcmFjdGVycyB3ZSd2ZSBoaWRkZW4uXG4vL1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+RShcXGQrKUUvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xKSB7XG5cdFx0XHR2YXIgY2hhckNvZGVUb1JlcGxhY2UgPSBwYXJzZUludChtMSk7XG5cdFx0XHRyZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZVRvUmVwbGFjZSk7XG5cdFx0fVxuXHQpO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuXG52YXIgX091dGRlbnQgPSBmdW5jdGlvbih0ZXh0KSB7XG4vL1xuLy8gUmVtb3ZlIG9uZSBsZXZlbCBvZiBsaW5lLWxlYWRpbmcgdGFicyBvciBzcGFjZXNcbi8vXG5cblx0Ly8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuXHQvLyBcIi0tLS0tLS0tLS1idWdcIi5yZXBsYWNlKC9eLS9nLFwiXCIpID09IFwiYnVnXCJcblxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKFxcdHxbIF17MSw0fSkvZ20sXCJ+MFwiKTsgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXG5cdC8vIGF0dGFja2xhYjogY2xlYW4gdXAgaGFja1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC9nLFwiXCIpXG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbnZhciBfRGV0YWIgPSBmdW5jdGlvbih0ZXh0KSB7XG4vLyBhdHRhY2tsYWI6IERldGFiJ3MgY29tcGxldGVseSByZXdyaXR0ZW4gZm9yIHNwZWVkLlxuLy8gSW4gcGVybCB3ZSBjb3VsZCBmaXggaXQgYnkgYW5jaG9yaW5nIHRoZSByZWdleHAgd2l0aCBcXEcuXG4vLyBJbiBqYXZhc2NyaXB0IHdlJ3JlIGxlc3MgZm9ydHVuYXRlLlxuXG5cdC8vIGV4cGFuZCBmaXJzdCBuLTEgdGFic1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHQoPz1cXHQpL2csXCIgICAgXCIpOyAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cblx0Ly8gcmVwbGFjZSB0aGUgbnRoIHdpdGggdHdvIHNlbnRpbmVsc1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHQvZyxcIn5BfkJcIik7XG5cblx0Ly8gdXNlIHRoZSBzZW50aW5lbCB0byBhbmNob3Igb3VyIHJlZ2V4IHNvIGl0IGRvZXNuJ3QgZXhwbG9kZVxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+QiguKz8pfkEvZyxcblx0XHRmdW5jdGlvbih3aG9sZU1hdGNoLG0xLG0yKSB7XG5cdFx0XHR2YXIgbGVhZGluZ1RleHQgPSBtMTtcblx0XHRcdHZhciBudW1TcGFjZXMgPSA0IC0gbGVhZGluZ1RleHQubGVuZ3RoICUgNDsgIC8vIGF0dGFja2xhYjogZ190YWJfd2lkdGhcblxuXHRcdFx0Ly8gdGhlcmUgKm11c3QqIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzOlxuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPG51bVNwYWNlczsgaSsrKSBsZWFkaW5nVGV4dCs9XCIgXCI7XG5cblx0XHRcdHJldHVybiBsZWFkaW5nVGV4dDtcblx0XHR9XG5cdCk7XG5cblx0Ly8gY2xlYW4gdXAgc2VudGluZWxzXG5cdHRleHQgPSB0ZXh0LnJlcGxhY2UoL35BL2csXCIgICAgXCIpOyAgLy8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+Qi9nLFwiXCIpO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbi8vXG4vLyAgYXR0YWNrbGFiOiBVdGlsaXR5IGZ1bmN0aW9uc1xuLy9cblxuXG52YXIgZXNjYXBlQ2hhcmFjdGVycyA9IGZ1bmN0aW9uKHRleHQsIGNoYXJzVG9Fc2NhcGUsIGFmdGVyQmFja3NsYXNoKSB7XG5cdC8vIEZpcnN0IHdlIGhhdmUgdG8gZXNjYXBlIHRoZSBlc2NhcGUgY2hhcmFjdGVycyBzbyB0aGF0XG5cdC8vIHdlIGNhbiBidWlsZCBhIGNoYXJhY3RlciBjbGFzcyBvdXQgb2YgdGhlbVxuXHR2YXIgcmVnZXhTdHJpbmcgPSBcIihbXCIgKyBjaGFyc1RvRXNjYXBlLnJlcGxhY2UoLyhbXFxbXFxdXFxcXF0pL2csXCJcXFxcJDFcIikgKyBcIl0pXCI7XG5cblx0aWYgKGFmdGVyQmFja3NsYXNoKSB7XG5cdFx0cmVnZXhTdHJpbmcgPSBcIlxcXFxcXFxcXCIgKyByZWdleFN0cmluZztcblx0fVxuXG5cdHZhciByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHJpbmcsXCJnXCIpO1xuXHR0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlZ2V4LGVzY2FwZUNoYXJhY3RlcnNfY2FsbGJhY2spO1xuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5cbnZhciBlc2NhcGVDaGFyYWN0ZXJzX2NhbGxiYWNrID0gZnVuY3Rpb24od2hvbGVNYXRjaCxtMSkge1xuXHR2YXIgY2hhckNvZGVUb0VzY2FwZSA9IG0xLmNoYXJDb2RlQXQoMCk7XG5cdHJldHVybiBcIn5FXCIrY2hhckNvZGVUb0VzY2FwZStcIkVcIjtcbn1cblxufSAvLyBlbmQgb2YgU2hvd2Rvd24uY29udmVydGVyXG5cbi8vIGV4cG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSBtb2R1bGUuZXhwb3J0cyA9IFNob3dkb3duO1xuXG59KSgpIiwibWFwID1cclxuICAnPD0nOiAn4oeQJyAjICdcXHUyMWQwJ1xyXG4gICc9Pic6ICfih5InICMgJ1xcdTIxZDInXHJcbiAgJzw9Pic6ICfih5QnICMgJ1xcdTIxZDQnXHJcbiAgJzwtJzogJ+KGkCcgIyAnXFx1MjE5MCdcclxuICAnLT4nOiAn4oaSJyAjICdcXHUyMTkyJ1xyXG4gICc8LT4nOiAn4oaUJyAjICdcXHUyMTk0J1xyXG4gICcuLi4nOiAn4oCmJ1xyXG4gICctLSc6ICfigJMnXHJcbiAgJy0tLSc6ICfigJQnXHJcbiAgJ14xJzogJ8K5J1xyXG4gICdeMic6ICfCsidcclxuICAnXjMnOiAnwrMnXHJcbiAgJzEvMic6ICfCvSdcclxuICAnMS80JzogJ8K8J1xyXG4gICczLzQnOiAnwr4nXHJcblxyXG51bmlmeSA9IChjbSkgLT5cclxuICBwb3MgPSBjbS5nZXRDdXJzb3IoKVxyXG4gIG0gPSAvW15cXHNdKyQvLmV4ZWMgY20uZ2V0UmFuZ2Uge2xpbmU6cG9zLmxpbmUsIGNoOjB9LCBwb3NcclxuICB0b2tlbiA9IG0/WzBdXHJcbiAgaWYgdG9rZW4/IGFuZCBtYXBbdG9rZW5dP1xyXG4gICAgY20ucmVwbGFjZVJhbmdlIG1hcFt0b2tlbl0sIHtsaW5lOnBvcy5saW5lLCBjaDpwb3MuY2gtdG9rZW4ubGVuZ3RofSwgcG9zXHJcblxyXG5Db2RlTWlycm9yLmNvbW1hbmRzWyd1bmlmeSddID0gdW5pZnlcclxuQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdFsnQ3RybC1TcGFjZSddID0gJ3VuaWZ5J1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFxuICBnZXRDdXJzb3JQb3NpdGlvbjogKGVsKSAtPlxuICAgIHBvcyA9IDBcbiAgICAjIElFIFN1cHBvcnRcbiAgICBpZiBkb2N1bWVudC5zZWxlY3Rpb25cbiAgICAgIGVsLmZvY3VzKClcbiAgICAgIFNlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpXG4gICAgICBTZWxMZW5ndGggPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKS50ZXh0Lmxlbmd0aFxuICAgICAgU2VsLm1vdmVTdGFydCAnY2hhcmFjdGVyJywgLWVsLnZhbHVlLmxlbmd0aFxuICAgICAgcG9zID0gU2VsLnRleHQubGVuZ3RoIC0gU2VsTGVuZ3RoXG4gICAgIyBGaXJlZm94IHN1cHBvcnRcbiAgICBlbHNlIGlmIGVsLnNlbGVjdGlvblN0YXJ0IG9yIGVsLnNlbGVjdGlvblN0YXJ0IGlzIDBcbiAgICAgIHBvcyA9IGVsLnNlbGVjdGlvblN0YXJ0XG4gICAgcG9zXG5cbiAgbnVtYmVyOiAoZWwpIC0+XG4gICAgc2VsZWN0b3IgPSAnSDEsSDIsSDMsSDQsSDUsSDYnICMgKyAnLE9MLFVMLExJJ1xuICAgIGVsZW1zID0gW11cbiAgICBvcmRlciA9IHNlbGVjdG9yLnNwbGl0KCcsJylcbiAgICBtYXAgPSB7fVxuICAgIG1hcFtzZWxdID0ge2M6MCwgcG9zOml9IGZvciBzZWwsIGkgaW4gb3JkZXJcbiAgICBudW0gPSAodGFnKSAtPlxuICAgICAgKGMgZm9yIGkgaW4gWzAuLm1hcFt0YWddLnBvc11cXFxuICAgICAgIHdoZW4gKGM9bWFwWyh0PW9yZGVyW2ldKV0uYykgaXNudCAwXFxcbiAgICAgICBhbmQgdCBub3QgaW4gWydPTCcsICdVTCddKS5qb2luICcsJ1xuICAgIGNvdW50ID0gKHNlbCkgLT5cbiAgICAgIGUgPSBtYXBbc2VsXVxuICAgICAgZS5jKytcbiAgICAgIChtYXBbb3JkZXJbaV1dLmMgPSAwIGZvciBpIGluIFtlLnBvcysxLi4ub3JkZXIubGVuZ3RoXSlcbiAgICByZXNldCA9IChjbGVhcikgLT5cbiAgICAgIGVsZW1zID0gW10gaWYgY2xlYXJcbiAgICAgIG9iai5jID0gMCBmb3Igc2VsLG9iaiBvZiBtYXBcbiAgICBmb3IgaCwgaSBpbiBlbC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1udW1iZXItcmVzZXRdLFtkYXRhLW51bWJlci1jbGVhcl0sJytzZWxlY3RvcilcbiAgICAgIGlmIGguaGFzQXR0cmlidXRlICdkYXRhLW51bWJlci1yZXNldCdcbiAgICAgICAgcmVzZXQoKVxuICAgICAgZWxzZSBpZiBoLmhhc0F0dHJpYnV0ZSAnZGF0YS1udW1iZXItY2xlYXInXG4gICAgICAgIHJlc2V0IHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgdCA9IGgudGFnTmFtZVxuICAgICAgICBjb3VudCB0XG4gICAgICAgIGVsZW1zLnB1c2ggW2gsIG51bSB0XSBpZiB0IG5vdCBpbiBbJ09MJywgJ1VMJ11cbiAgICBoLnNldEF0dHJpYnV0ZSAnZGF0YS1udW1iZXInLCBuIGZvciBbaCwgbl0gaW4gZWxlbXNcbiAgICBlbFxuXG4gIGluZGV4OiAoZWwpIC0+XG4gICAgZm9yIGUgaW4gZWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbnVtYmVyXScpXG4gICAgICBlLmlubmVySFRNTCA9IFwiXCJcIlxuICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAje2UuZ2V0QXR0cmlidXRlKCdkYXRhLW51bWJlcicpLnNwbGl0KCcsJykuam9pbignLiAnKX0uXG4gICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgIFwiXCJcIiArIGUuaW5uZXJIVE1MXG4gICAgZWxcblxuICB0b2M6IChlbCkgLT5cbiAgICAnPHVsPicgKyAoZm9yIGUgaW4gZWwucXVlcnlTZWxlY3RvckFsbCgnSDEsSDIsSDMsSDQsSDUsSDYnKVxuICAgICAgXCJcIlwiXG4gICAgICA8bGk+PGEgaHJlZj1cIiMje2UuaWR9XCI+PCN7ZS50YWdOYW1lfT5cbiAgICAgICN7ZS5pbm5lckhUTUx9XG4gICAgICA8LyN7ZS50YWdOYW1lfT48L2E+PC9saT5cbiAgICAgIFwiXCJcIlxuICAgICkuam9pbignJykgKyAnPC91bD4nXG4iLCJ4aHIgPSByZXF1aXJlICcuL3hoci5jb2ZmZWUnXG5cbmV4dGVuZCA9IChyPXt9LCBkKSAtPiByW2tdID0gdiBmb3IgaywgdiBvZiBkOyByXG50b0RpY3QgPSAoYXJyYXksIGRpY3Q9e30pIC0+IGRpY3Rba3ZwWzBdXSA9IGt2cFsxXSBmb3Iga3ZwIGluIGFycmF5OyBkaWN0XG5wYXJzZVF1ZXJ5ID0gKHMpIC0+IHRvRGljdChrdnAuc3BsaXQoJz0nKSBmb3Iga3ZwIGluIHMucmVwbGFjZSgvXlxcPy8sJycpLnNwbGl0KCcmJykpXG5cbntzdGF0ZX0gPSByZXF1aXJlICcuL1N0YXRlLmNvZmZlZSdcblxuY2xpZW50SWQgPSAnMDRjNGRlMzMzMjY2NGQ3MDQ2NDInXG5jbGllbnRTZWNyZXQgPSAnYzhkNmFiNThiYmY4MDk1YzgyYzBmMTFlNTdkYjkyYmYyYjlmNzZiZSdcbnJlZGlyZWN0ID0gd2luZG93LmxvY2F0aW9uLmhyZWZcblxuYXV0aCA9IC0+XG4gIHF1ZXJ5ID0gcGFyc2VRdWVyeSB3aW5kb3cubG9jYXRpb24uc2VhcmNoXG4gIGlmIHF1ZXJ5LmNvZGVcbiAgICB4T3JpZ1N0YXRlID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtICd4LW9yaWctc3RhdGUnXG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtICd4LW9yaWctc3RhdGUnXG4gICAgaWYgeE9yaWdTdGF0ZSBpc250IHF1ZXJ5LnN0YXRlXG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvciAnY3Jvc3Mgb3JpZ2luIHN0YXRlIGhhcyBiZWVuIHRhbXBlcmVkIHdpdGguJ1xuICAgIHhoclxuICAgICAgbWV0aG9kOiAnUE9TVCdcbiAgICAgIHVybDogJ2h0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hY2Nlc3NfdG9rZW4nXG4gICAgICBkYXRhOlxuICAgICAgICBjbGllbnRfaWQ6IGNsaWVudElkXG4gICAgICAgIGNsaWVudF9zZWNyZXQ6IGNsaWVudFNlY3JldFxuICAgICAgICBjb2RlOiBxdWVyeS5jb2RlXG4gICAgLChlcnIsIGRhdGEpIC0+XG4gICAgICBjb25zb2xlLmxvZyBkYXRhXG4gIGVsc2UgaWYgcXVlcnkuZXJyb3JcblxuICBlbHNlXG4gICAgcm5kID0gKCcwMTIzNDU2Nzg5YWJjZGVmJ1tNYXRoLnJhbmRvbSgpICogMTYgfCAwXSBmb3IgeCBpbiBbMC4uMTBdKS5qb2luICcnXG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtICd4LW9yaWctc3RhdGUnLCBybmRcbiAgICAjaWZyYW1lRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdpZnJhbWUnXG4gICAgI2V4dGVuZCBpZnJhbWVFbC5zdHlsZSxcbiAgICAjICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICMgIHdpZHRoOiAnNjAwcHgnXG4gICAgIyAgaGVpZ2h0OiAnNDAwcHgnXG4gICAgIyAgdG9wOiAwXG4gICAgIyAgbGVmdDogMFxuICAgICMgIHpJbmRleDogOTk5OTlcbiAgICB3aW5kb3cub3BlbiBcImh0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hdXRob3JpemU/Y2xpZW50X2lkPSN7Y2xpZW50SWR9JnNjb3BlPWdpc3Qmc3RhdGU9I3tybmR9JnJlZGlyZWN0X3VyaT0je3JlZGlyZWN0fVwiXG4gICAgI2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgaWZyYW1lRWxcblxuc3RhdGUuc3RvcmVzLmdpc3QgPVxuICBzdG9yZTogKGlkLCBkYXRhLCBjYWxsYmFjaykgLT5cbiAgICB4aHIuanNvblxuICAgICAgbWV0aG9kOiBpZiBpZCB0aGVuICdQQVRDSCcgZWxzZSAnUE9TVCdcbiAgICAgIHVybDogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMnICsgaWYgaWQgdGhlbiAnLycraWQgZWxzZSAnJ1xuICAgICAgZGF0YTpcbiAgICAgICAgZGVzY3JpcHRpb246ICdDcmVhdGVkIHdpdGggRHIuIE1hcmtkb3duJ1xuICAgICAgICBmaWxlczpcbiAgICAgICAgICAnbWFpbi5tZCc6IGNvbnRlbnQ6IGRhdGEudGV4dFxuICAgICAgICAgICdzdGF0ZS5qc29uJzogY29udGVudDogSlNPTi5zdHJpbmdpZnkgZGF0YS5zdGF0ZVxuICAgICwoZXJyLCBkYXRhKSAtPiBjYWxsYmFjayBkYXRhLmlkXG4gIHJlc3RvcmU6IChpZCwgY2FsbGJhY2spIC0+XG4gICAgeGhyLmpzb24gdXJsOidodHRwczovL2FwaS5naXRodWIuY29tL2dpc3RzLycraWQsIChlcnIsIGRhdGEpIC0+XG4gICAgICB7XG4gICAgICAgIGZpbGVzOiB7XG4gICAgICAgICAgJ21haW4ubWQnOiB7IHJhd191cmw6dGV4dFVybCB9LFxuICAgICAgICAgICdzdGF0ZS5qc29uJzogeyByYXdfdXJsOnN0YXRlVXJsIH1cbiAgICAgICAgfVxuICAgICAgfSA9IGRhdGFcbiAgICAgIHhoci5qc29uIHVybDpzdGF0ZVVybCwgKGVyciwgc3RhdGUpIC0+XG4gICAgICAgIHhociB1cmw6dGV4dFVybCwgKGVyciwgdGV4dCkgLT5cbiAgICAgICAgICBjYWxsYmFjayB7IHRleHQsIHN0YXRlIH1cblxuc2V0VGltZW91dCAoLT4gYXV0aCgpKSwgMTAwMFxuIiwie0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlICdldmVudHMnXG5cbmJhc2U2NCA9IHJlcXVpcmUgJy4uL2xpYi9iYXNlNjQnXG5sencgPSByZXF1aXJlICcuLi9saWIvbHp3J1xuXG5leHRlbmQgPSAocj17fSwgZCkgLT5cbiAgcltrXSA9IHYgZm9yIGssIHYgb2YgZFxuICByXG5rdnBUb0RpY3QgPSAoZCwga3ZwKSAtPiBkW2t2cFswXV0gPSAoaWYga3ZwWzFdPyB0aGVuIGt2cFsxXSBlbHNlIHRydWUpXG5cbmNsYXNzIFN0YXRlIGV4dGVuZHMgRXZlbnRFbWl0dGVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIHN1cGVyKClcbiAgICBAc3RhdGUgPVxuICAgICAgdG9jOiBmYWxzZVxuICAgICAgaW5kZXg6IGZhbHNlXG4gICAgQHN0YXJ0KClcblxuICBlbmNvZGVEYXRhOiAodHlwZSwgZGF0YSwgZm4pIC0+XG4gICAgU3RhdGUuY29kZXJzW3R5cGVdLmVuY29kZSBkYXRhLCAoZGF0YSkgLT4gZm4gdHlwZSsnOycrZGF0YVxuXG4gIGRlY29kZURhdGE6IChkYXRhLCBmbikgLT5cbiAgICBbdHlwZSwgZGF0YV0gPSBkYXRhLnNwbGl0ICc7JywgMlxuICAgIFN0YXRlLmNvZGVyc1t0eXBlXS5kZWNvZGUgZGF0YSwgZm5cblxuICBzdGFydDogLT5cbiAgICB7cHJvdG9jb2wsIGhvc3QsIHBhdGhuYW1lfSA9IHdpbmRvdy5sb2NhdGlvblxuICAgIEBiYXNlVXJsID0gcHJvdG9jb2wrJy8vJytob3N0K3BhdGhuYW1lXG5cbiAgcGFyc2VTdGF0ZTogKHN0cikgLT5cbiAgICBrdnBUb0RpY3QgQHN0YXRlLCBrdnAuc3BsaXQgJz0nIGZvciBrdnAgaW4gc3RyLnNwbGl0ICcsJyB3aGVuIGt2cCBpc250ICcnXG5cbiAgZ2VuZXJhdGVTdGF0ZTogLT5cbiAgICAoZm9yIGssIHYgb2YgQHN0YXRlIHdoZW4gdj8gYW5kIHYgaXNudCBmYWxzZVxuICAgICAgaWYgdiBpcyB0cnVlIHRoZW4gayBlbHNlIGsrJz0nK3YpLmpvaW4gJywnXG5cbiAgX2dldDogKHR5cGUsIGlkLCBmbikgLT4gQHN0b3JhZ2VbdHlwZV0uZ2V0IGlkLCBmblxuXG4gIF9zYXZlOiAodHlwZSwgZGF0YSwgZm4pIC0+IEBzdG9yYWdlW3R5cGVdLnNhdmUgZGF0YSwgZm5cblxuICBwYXJzZUhhc2g6IChoYXNoLCBmbikgLT5cbiAgICBoYXNoID0gaGFzaC5zdWJzdHJpbmcgMSBpZiBoYXNoLmNoYXJBdCAwIGlzICcjJ1xuICAgIHBvcyA9ICBoYXNoLmluZGV4T2YgJzsnXG4gICAgaWYgcG9zIGlzIC0xICMgc3RhdGUgb25seVxuICAgICAgc3RhdGUgPSBoYXNoXG4gICAgZWxzZSAjIHN0YXRlIGFuZCBkYXRhXG4gICAgICBzdGF0ZSA9IGhhc2guc3Vic3RyaW5nIDAsIHBvc1xuICAgICAgZGF0YSA9IGhhc2guc3Vic3RyaW5nIHBvcysxXG4gICAgQHBhcnNlU3RhdGUgc3RhdGVcbiAgICBpZiBkYXRhP1xuICAgICAgQGRlY29kZURhdGEgZGF0YSwgKGRhdGEpIC0+IGZuIGRhdGFcbiAgICBlbHNlXG4gICAgICBmbigpXG5cbiAgZ2VuZXJhdGVIYXNoOiAodHlwZSwgZGF0YSwgZm4pIC0+XG4gICAgaWYgdHlwZT8gYW5kIGRhdGE/XG4gICAgICBAZW5jb2RlRGF0YSB0eXBlLCBkYXRhLCAoc3RyKSA9PlxuICAgICAgICBmbiAnIycrQGdlbmVyYXRlU3RhdGUoKSsnOycrc3RyXG4gICAgZWxzZVxuICAgICAgZm4gJyMnK0BnZW5lcmF0ZVN0YXRlKClcblxuICByZXBsYWNlOiAtPlxuICAgIEBfc2F2ZSB0eXBlLCBkYXRhLCAoaWQsIHZlcnNpb24pIC0+XG4gICAgICB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUge30sICcnLCB0eXBlKycvJytpZFxuXG4gIGhhczogKHR5cGUpIC0+IEBzdGF0ZVt0eXBlXT8gYW5kIEBzdGF0ZVt0eXBlXSBpc250IGZhbHNlXG4gIHNldDogKHR5cGUsIHZhbCkgLT4gQHN0YXRlW3R5cGVdID0gdmFsOyBAZW1pdCAnY2hhbmdlJywgdHlwZSwgdmFsXG4gIHRvZ2dsZTogKHR5cGUpIC0+IEBzZXQgdHlwZSwgbm90IEBoYXMgdHlwZVxuXG5kZXNlcmlhbGl6ZSA9IC0+XG4gIFt0eXBlLCBpZF0gPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSkuc3BsaXQgJy8nLCAyXG4gIHsgdHlwZSwgaWQgfVxuc2VyaWFsaXplID0gKGRhdGEpIC0+IHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyMnK2RhdGEudHlwZSsnLycrZGF0YS5pZFxuXG5zdGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXJcblxuc3RhdGUuc3RvcmVUeXBlID0gJ2Jhc2U2NCdcbnN0YXRlLnN0b3JlSWQgPSAnJ1xuXG5zdGF0ZS5zdG9yZXMgPVxuICAjbHp3OlxuICAjICBzdG9yZTogKGRhdGEsIGZuKSAtPiBmbiBiYXNlNjQuZW5jb2RlIGx6dy5lbmNvZGUgZGF0YVxuICAjICByZXN0b3JlOiAoZGF0YSwgZm4pIC0+IGZuIGx6dy5kZWNvZGUgYmFzZTY0LmRlY29kZSBkYXRhXG4gIGJhc2U2NDpcbiAgICBzdG9yZTogKGlkLCBkYXRhLCBjYWxsYmFjaykgLT5cbiAgICAgIGNhbGxiYWNrIGJhc2U2NC5lbmNvZGUgSlNPTi5zdHJpbmdpZnkoZGF0YSBvciAne30nKVxuICAgIHJlc3RvcmU6IChpZCwgY2FsbGJhY2spIC0+XG4gICAgICBjYWxsYmFjayBKU09OLnBhcnNlIGJhc2U2NC5kZWNvZGUoaWQpIG9yICd7fSdcblxuc3RhdGUuc3RvcmUgPSAoc3RvcmVUeXBlLCBkYXRhLCBjYWxsYmFjaykgLT5cbiAgc3RhdGUuc3RvcmVUeXBlID0gc3RvcmVUeXBlIGlmIHN0b3JlVHlwZVxuICBzdGF0ZS5zdG9yZXNbc3RhdGUuc3RvcmVUeXBlXS5zdG9yZSBzdGF0ZS5zdG9yZUlkLCBkYXRhLCAoc3RvcmVJZCktPlxuICAgIHN0YXRlLnN0b3JlSWQgPSBzdG9yZUlkXG4gICAgc2VyaWFsaXplIHR5cGU6c3RhdGUuc3RvcmVUeXBlLCBpZDpzdG9yZUlkXG4gICAgI3dpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSB7fSwgJycsIHR5cGUrJy8nK2lkXG4gICAgY2FsbGJhY2s/IHN0b3JlSWRcblxuc3RhdGUucmVzdG9yZSA9IChzdG9yZVR5cGUsIHN0b3JlSWQsIGNhbGxiYWNrKSAtPlxuICBpZiBub3Qgc3RvcmVUeXBlPyBhbmQgbm90IHN0b3JlSWQ/XG4gICAgeyB0eXBlOnN0b3JlVHlwZSwgaWQ6c3RvcmVJZCB9ID0gZGVzZXJpYWxpemUoKVxuICBzdGF0ZS5zdG9yZVR5cGUgPSBzdG9yZVR5cGUgaWYgc3RvcmVUeXBlXG4gIHN0YXRlLnN0b3JlSWQgPSBzdG9yZUlkXG4gIGlmIHN0b3JlSWQ/XG4gICAgc3RhdGUuc3RvcmVzW3N0YXRlLnN0b3JlVHlwZV0ucmVzdG9yZSBzdGF0ZS5zdG9yZUlkLCAoZGF0YSkgLT5cbiAgICAgIGNhbGxiYWNrIGRhdGFcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ2hhc2hjaGFuZ2UnLCAtPlxuICB7IHR5cGU6c3RvcmVUeXBlLCBpZDpzdG9yZUlkIH0gPSBkZXNlcmlhbGl6ZSgpXG4gIGlmIHN0b3JlVHlwZSBpc250IHN0YXRlLnN0b3JlVHlwZSBvciBzdG9yZUlkIGlzbnQgc3RhdGUuc3RvcmVJZFxuICAgIHN0YXRlLnJlc3RvcmUgc3RvcmVUeXBlLCBzdG9yZUlkLCAoZGF0YSkgLT5cbiAgICAgIHN0b3JlLmVtaXQgJ3Jlc3RvcmUnLCBkYXRhXG5cbiN3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAncG9wc3RhdGUnLCAtPlxuIyAgc3RhdGUuZnJvbUxvY2F0aW9uIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgU3RhdGUsIHN0YXRlIH1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYuc291cmNlID09PSB3aW5kb3cgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe2lmICghcHJvY2Vzcy5FdmVudEVtaXR0ZXIpIHByb2Nlc3MuRXZlbnRFbWl0dGVyID0gZnVuY3Rpb24gKCkge307XG5cbnZhciBFdmVudEVtaXR0ZXIgPSBleHBvcnRzLkV2ZW50RW1pdHRlciA9IHByb2Nlc3MuRXZlbnRFbWl0dGVyO1xudmFyIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gQXJyYXkuaXNBcnJheVxuICAgIDogZnVuY3Rpb24gKHhzKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nXG4gICAgfVxuO1xuZnVuY3Rpb24gaW5kZXhPZiAoeHMsIHgpIHtcbiAgICBpZiAoeHMuaW5kZXhPZikgcmV0dXJuIHhzLmluZGV4T2YoeCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoeCA9PT0geHNbaV0pIHJldHVybiBpO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW5cbi8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuLy8gaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG4vL1xuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbnZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzID0gbjtcbn07XG5cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNBcnJheSh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSlcbiAgICB7XG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgYXJndW1lbnRzWzFdOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gZmFsc2U7XG4gIHZhciBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBpZiAoIWhhbmRsZXIpIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGhhbmRsZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoaXNBcnJheShoYW5kbGVyKSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIHZhciBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vLyBFdmVudEVtaXR0ZXIgaXMgZGVmaW5lZCBpbiBzcmMvbm9kZV9ldmVudHMuY2Ncbi8vIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCgpIGlzIGFsc28gZGVmaW5lZCB0aGVyZS5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhZGRMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT0gXCJuZXdMaXN0ZW5lcnNcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXG4gIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgICB2YXIgbTtcbiAgICAgIGlmICh0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbSA9IHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtID0gZGVmYXVsdE1heExpc3RlbmVycztcbiAgICAgIH1cblxuICAgICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYub24odHlwZSwgZnVuY3Rpb24gZygpIHtcbiAgICBzZWxmLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZUxpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzQXJyYXkobGlzdCkpIHtcbiAgICB2YXIgaSA9IGluZGV4T2YobGlzdCwgbGlzdGVuZXIpO1xuICAgIGlmIChpIDwgMCkgcmV0dXJuIHRoaXM7XG4gICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgaWYgKGxpc3QubGVuZ3RoID09IDApXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9IGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSA9PT0gbGlzdGVuZXIpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAodHlwZSAmJiB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcbiAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgfVxuICByZXR1cm4gdGhpcy5fZXZlbnRzW3R5cGVdO1xufTtcblxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsInhociA9IChvcHQsIGNhbGxiYWNrKSAtPlxuICByID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gIHIub3BlbiBvcHQubWV0aG9kIG9yICdHRVQnLCBvcHQudXJsLCB0cnVlXG4gIHIub25yZWFkeXN0YXRlY2hhbmdlID0gLT5cbiAgICBpZiByLnJlYWR5U3RhdGUgaXMgNFxuICAgICAgaWYgci5zdGF0dXMgPj0gMjAwIGFuZCByLnN0YXR1cyA8IDMwMFxuICAgICAgICBjYWxsYmFjayB1bmRlZmluZWQsIHIucmVzcG9uc2VUZXh0LCByXG4gICAgICBlbHNlXG4gICAgICAgIGNhbGxiYWNrIHIuc3RhdHVzVGV4dCwgci5yZXNwb25zZVRleHQsIHJcbiAgci5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpIGZvciBoZWFkZXIsIHZhbHVlIG9mIG9wdC5oZWFkZXJzXG4gIHIuc2VuZCBvcHQuZGF0YVxuICByXG5cbnhoci5qc29uID0gKG9wdCwgY2FsbGJhY2spIC0+XG4gIGNhbGxiYWNrXyA9IChlcnIsIGpzb24sIHhocikgLT5cbiAgICBpZiBlcnI/IG9yIG5vdCBqc29uIHRoZW4gcmV0dXJuIGNhbGxiYWNrIGVyciwgdW5kZWZpbmVkLCB4aHJcbiAgICB0cnlcbiAgICAgIGRhdGEgPSBKU09OLnBhcnNlIGpzb25cbiAgICBjYXRjaCBlcnJfXG4gICAgICBlcnIgPSBlcnJfXG4gICAgY2FsbGJhY2sgZXJyLCBkYXRhLCB4aHJcbiAgb3B0LmRhdGEgPSBKU09OLnN0cmluZ2lmeSBvcHQuZGF0YVxuICBvcHQuaGVhZGVycyA9ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgeGhyIG9wdCwgY2FsbGJhY2tfXG5cbm1vZHVsZS5leHBvcnRzID0geGhyXG4iLCIvLyBMWlctY29tcHJlc3MgYSBzdHJpbmdcclxuZnVuY3Rpb24gZW5jb2RlKHMpIHtcclxuICB2YXIgZGF0YSA9IChzICsgXCJcIikuc3BsaXQoXCJcIik7XHJcbiAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSByZXR1cm4gXCJcIjtcclxuICB2YXIgZGljdCA9IHt9O1xyXG4gIHZhciBvdXQgPSBbXTtcclxuICB2YXIgY3VyckNoYXI7XHJcbiAgdmFyIHBocmFzZSA9IGRhdGFbMF07XHJcbiAgdmFyIGNvZGUgPSAyNTY7XHJcbiAgZm9yICh2YXIgaT0xOyBpPGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgIGN1cnJDaGFyPWRhdGFbaV07XHJcbiAgICBpZiAoZGljdFtwaHJhc2UgKyBjdXJyQ2hhcl0gIT0gbnVsbCkge1xyXG4gICAgICBwaHJhc2UgKz0gY3VyckNoYXI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgb3V0LnB1c2gocGhyYXNlLmxlbmd0aCA+IDEgPyBkaWN0W3BocmFzZV0gOiBwaHJhc2UuY2hhckNvZGVBdCgwKSk7XHJcbiAgICAgIGRpY3RbcGhyYXNlICsgY3VyckNoYXJdID0gY29kZTtcclxuICAgICAgY29kZSsrO1xyXG4gICAgICBwaHJhc2U9Y3VyckNoYXI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIG91dC5wdXNoKHBocmFzZS5sZW5ndGggPiAxID8gZGljdFtwaHJhc2VdIDogcGhyYXNlLmNoYXJDb2RlQXQoMCkpO1xyXG4gIGZvciAodmFyIGk9MDsgaTxvdXQubGVuZ3RoOyBpKyspIHtcclxuICAgIG91dFtpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUob3V0W2ldKTtcclxuICB9XHJcbiAgcmV0dXJuIG91dC5qb2luKFwiXCIpO1xyXG59XHJcblxyXG4vLyBEZWNvbXByZXNzIGFuIExaVy1lbmNvZGVkIHN0cmluZ1xyXG5mdW5jdGlvbiBkZWNvZGUocykge1xyXG4gIHZhciBkYXRhID0gKHMgKyBcIlwiKS5zcGxpdChcIlwiKTtcclxuICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiBcIlwiO1xyXG4gIHZhciBkaWN0ID0ge307XHJcbiAgdmFyIGN1cnJDaGFyID0gZGF0YVswXTtcclxuICB2YXIgb2xkUGhyYXNlID0gY3VyckNoYXI7XHJcbiAgdmFyIG91dCA9IFtjdXJyQ2hhcl07XHJcbiAgdmFyIGNvZGUgPSAyNTY7XHJcbiAgdmFyIHBocmFzZTtcclxuICBmb3IgKHZhciBpPTE7IGk8ZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIGN1cnJDb2RlID0gZGF0YVtpXS5jaGFyQ29kZUF0KDApO1xyXG4gICAgaWYgKGN1cnJDb2RlIDwgMjU2KSB7XHJcbiAgICAgIHBocmFzZSA9IGRhdGFbaV07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcGhyYXNlID0gZGljdFtjdXJyQ29kZV0gPyBkaWN0W2N1cnJDb2RlXSA6IChvbGRQaHJhc2UgKyBjdXJyQ2hhcik7XHJcbiAgICB9XHJcbiAgICBvdXQucHVzaChwaHJhc2UpO1xyXG4gICAgY3VyckNoYXIgPSBwaHJhc2UuY2hhckF0KDApO1xyXG4gICAgZGljdFtjb2RlXSA9IG9sZFBocmFzZSArIGN1cnJDaGFyO1xyXG4gICAgY29kZSsrO1xyXG4gICAgb2xkUGhyYXNlID0gcGhyYXNlO1xyXG4gIH1cclxuICByZXR1cm4gb3V0LmpvaW4oXCJcIik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGVuY29kZTogZW5jb2RlLFxyXG4gIGRlY29kZTogZGVjb2RlXHJcbn07XHJcbiIsIi8qKlxuICpcbiAqICBiYXNlNjQgZW5jb2RlIC8gZGVjb2RlXG4gKiAgaHR0cDovL3d3dy53ZWJ0b29sa2l0LmluZm8vXG4gKlxuICoqL1xuXG52YXIgYmFzZTY0ID0ge1xuXG4gIC8vIHByaXZhdGUgcHJvcGVydHlcbiAgX2tleVN0ciA6IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIixcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBlbmNvZGluZ1xuICBlbmNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMywgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGJhc2U2NC5fdXRmOF9lbmNvZGUoaW5wdXQpO1xuXG4gICAgd2hpbGUgKGkgPCBpbnB1dC5sZW5ndGgpIHtcblxuICAgICAgY2hyMSA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgIGNocjIgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIzID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICBlbmMxID0gY2hyMSA+PiAyO1xuICAgICAgZW5jMiA9ICgoY2hyMSAmIDMpIDw8IDQpIHwgKGNocjIgPj4gNCk7XG4gICAgICBlbmMzID0gKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNik7XG4gICAgICBlbmM0ID0gY2hyMyAmIDYzO1xuXG4gICAgICBpZiAoaXNOYU4oY2hyMikpIHtcbiAgICAgICAgZW5jMyA9IGVuYzQgPSA2NDtcbiAgICAgIH0gZWxzZSBpZiAoaXNOYU4oY2hyMykpIHtcbiAgICAgICAgZW5jNCA9IDY0O1xuICAgICAgfVxuXG4gICAgICBvdXRwdXQgPSBvdXRwdXQgK1xuICAgICAgICB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzEpICsgdGhpcy5fa2V5U3RyLmNoYXJBdChlbmMyKSArXG4gICAgICAgIHRoaXMuX2tleVN0ci5jaGFyQXQoZW5jMykgKyB0aGlzLl9rZXlTdHIuY2hhckF0KGVuYzQpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSxcblxuICAvLyBwdWJsaWMgbWV0aG9kIGZvciBkZWNvZGluZ1xuICBkZWNvZGUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICB2YXIgY2hyMSwgY2hyMiwgY2hyMztcbiAgICB2YXIgZW5jMSwgZW5jMiwgZW5jMywgZW5jNDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXFw9XS9nLCBcIlwiKTtcblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG5cbiAgICAgIGVuYzEgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG4gICAgICBlbmMyID0gdGhpcy5fa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuICAgICAgZW5jMyA9IHRoaXMuX2tleVN0ci5pbmRleE9mKGlucHV0LmNoYXJBdChpKyspKTtcbiAgICAgIGVuYzQgPSB0aGlzLl9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG5cbiAgICAgIGNocjEgPSAoZW5jMSA8PCAyKSB8IChlbmMyID4+IDQpO1xuICAgICAgY2hyMiA9ICgoZW5jMiAmIDE1KSA8PCA0KSB8IChlbmMzID4+IDIpO1xuICAgICAgY2hyMyA9ICgoZW5jMyAmIDMpIDw8IDYpIHwgZW5jNDtcblxuICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIxKTtcblxuICAgICAgaWYgKGVuYzMgIT0gNjQpIHtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaHIyKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmM0ICE9IDY0KSB7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dCArIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyMyk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBvdXRwdXQgPSBiYXNlNjQuX3V0ZjhfZGVjb2RlKG91dHB1dCk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuXG4gIH0sXG5cbiAgLy8gcHJpdmF0ZSBtZXRob2QgZm9yIFVURi04IGVuY29kaW5nXG4gIF91dGY4X2VuY29kZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFxyXFxuL2csXCJcXG5cIik7XG4gICAgdmFyIHV0ZnRleHQgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCBzdHJpbmcubGVuZ3RoOyBuKyspIHtcblxuICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChuKTtcblxuICAgICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZigoYyA+IDEyNykgJiYgKGMgPCAyMDQ4KSkge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gNikgfCAxOTIpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiAxMikgfCAyMjQpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjID4+IDYpICYgNjMpIHwgMTI4KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB1dGZ0ZXh0O1xuICB9LFxuXG4gIC8vIHByaXZhdGUgbWV0aG9kIGZvciBVVEYtOCBkZWNvZGluZ1xuICBfdXRmOF9kZWNvZGUgOiBmdW5jdGlvbiAodXRmdGV4dCkge1xuICAgIHZhciBzdHJpbmcgPSBcIlwiO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgYyA9IGMxID0gYzIgPSAwO1xuXG4gICAgd2hpbGUgKCBpIDwgdXRmdGV4dC5sZW5ndGggKSB7XG5cbiAgICAgIGMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcbiAgICAgICAgYzIgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsxKTtcbiAgICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMzEpIDw8IDYpIHwgKGMyICYgNjMpKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XG4gICAgICAgIGMzID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMik7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDE1KSA8PCAxMikgfCAoKGMyICYgNjMpIDw8IDYpIHwgKGMzICYgNjMpKTtcbiAgICAgICAgaSArPSAzO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZTY0O1xuIl19
;