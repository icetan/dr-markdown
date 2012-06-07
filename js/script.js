(function() {
  var compress, decompress, generateState, kvpToDict, markdown, parseState;
  markdown = new Showdown.converter();
  kvpToDict = function(d, kvp) {
    return d[kvp[0]] = (kvp[1] != null ? kvp[1] : true);
  };
  compress = function(data) {
    return base64.encode(lzw_encode(data));
  };
  decompress = function(b64) {
    return lzw_decode(base64.decode(b64));
  };
  parseState = function(hash) {
    var data, kvp, map, pos, state, _i, _len, _ref;
    map = {};
    pos = hash.indexOf(';');
    if (pos === -1) {
      state = hash.substring(1);
    } else {
      state = hash.substring(1, pos);
      data = hash.substring(pos + 1);
    }
    _ref = state.split(',');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      kvp = _ref[_i];
      kvpToDict(map, kvp.split('='));
    }
    return [map, data || ''];
  };
  generateState = function(map, data) {
    var k, state, v;
    state = (function() {
      var _results;
      _results = [];
      for (k in map) {
        v = map[k];
        if (v !== false) {
          _results.push(!(v != null) || v === true ? k : k + '=' + v);
        }
      }
      return _results;
    })();
    return "#" + (state.join(',')) + ";" + data;
  };
  $(document).ready(function() {
    var compressCache, compressFromEditor, decompressToEditor, docTitle, editor, saveTimer, saved, setIndex, setState, setToc, state, stateHas, stateSet, stateToggle, updateIndex, updateStatus, updateToc, updateView;
    state = {};
    compressCache = '';
    compressFromEditor = function() {
      return compressCache || (compressCache = compress(editor.getValue()));
    };
    decompressToEditor = function(b64) {
      return editor.setValue(decompress(b64));
    };
    docTitle = function() {
      var e, v;
      v = $('#view');
      e = $('<div></div>').append($('h1,h2,h3', v).first().html());
      $('.index', e).remove();
      return e.text() || 'untitled';
    };
    stateHas = function(type) {
      return (state[type] != null) && state[type] !== false;
    };
    stateSet = function(type, val) {
      state[type] = val;
      return updateStatus(true);
    };
    stateToggle = function(type) {
      return stateSet(type, !stateHas(type));
    };
    saved = true;
    updateStatus = function(force) {
      if (!saved || force) {
        location.hash = generateState(state, compressFromEditor());
        document.title = docTitle();
        return saved = true;
      }
    };
    updateToc = function() {
      return $('#toc').html($('#view').toc());
    };
    updateIndex = function() {
      return $('#view').number().index();
    };
    updateView = function() {
      var v;
      v = $('#view');
      v.html(markdown.makeHtml(editor.getValue()));
      if (stateHas('index')) {
        updateIndex();
      }
      if (stateHas('toc')) {
        return updateToc();
      }
    };
    if (typeof BlobBuilder !== "undefined" && BlobBuilder !== null) {
      $('#download').click(function() {
        var bb;
        bb = new BlobBuilder;
        bb.append(editor.getValue());
        return saveAs(bb.getBlob('text/plain;charset=utf-8'), docTitle() + '.md');
      });
    } else {
      $('#download').hide();
    }
    $('#link-b64').click(function() {
      updateStatus();
      return $('#link-b64-text').val(location.href).removeClass('hidden').focus().select().blur(function() {
        return $(this).addClass('hidden');
      });
    });
    $('#print').click(function() {
      return window.print();
    });
    setToc = function(to) {
      if (to) {
        updateToc();
        return $('#toc').removeClass('hidden');
      } else {
        return $('#toc').addClass('hidden');
      }
    };
    setIndex = function(to) {
      if (to) {
        if ($('#view [data-number]').length === 0) {
          updateIndex();
          if (hasToc()) {
            updateToc();
          }
        }
        return $('#view-wrap').addClass('indexed');
      } else {
        return $('#view-wrap').removeClass('indexed');
      }
    };
    $('#toggleToc').click(function() {
      return stateToggle('toc');
    });
    $('#toggleIndex').click(function() {
      return stateToggle('index');
    });
    $('#input-wrap').mouseover(function() {
      return $('#modes').removeClass('hidden');
    });
    $('#input-wrap').mouseout(function() {
      return $('#modes').addClass('hidden');
    });
    $(document).mouseout(function(e) {
      var from;
      from = e.relatedTarget || e.toElement;
      if (!from || from.nodeName === 'HTML') {
        return updateStatus();
      }
    });
    $('#mode-gfm').click(function() {
      editor.setOption('mode', 'gfm');
      $('#modes .label').removeClass('active');
      return $(this).addClass('active');
    });
    $('#mode-html').click(function() {
      editor.setOption('mode', 'htmlmixed');
      $('#modes .label').removeClass('active');
      return $(this).addClass('active');
    });
    saveTimer = null;
    editor = CodeMirror.fromTextArea($('#input-md')[0], {
      mode: 'gfm',
      theme: 'default',
      lineNumbers: false,
      lineWrapping: true,
      onChange: function() {
        updateView();
        saved = false;
        compressCache = '';
        clearTimeout(saveTimer);
        return saveTimer = setTimeout(updateStatus, 5000);
      },
      onDragEvent: function(editor, event) {
        if (event.type === 'drop') {
          $('#drag-n-drop-wrap').remove();
        }
        return false;
      }
    });
    setState = function() {
      var data, _ref;
      _ref = parseState(location.hash), state = _ref[0], data = _ref[1];
      if (data !== compressCache) {
        decompressToEditor(data);
      }
      setIndex(stateHas('index'));
      return setToc(stateHas('toc'));
    };
    $(window).bind('hashchange', setState);
    setState();
    if (!editor.getValue()) {
      $('#drag-n-drop-wrap').removeClass('hidden');
    }
    $('#input-wrap').one('click', function() {
      return $('#drag-n-drop-wrap').remove();
    });
    updateView();
    return updateStatus();
  });
}).call(this);
