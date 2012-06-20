(function() {
  var compress, decompress, markdown;
  markdown = new Showdown.converter();
  compress = function(data) {
    return base64.encode(lzw_encode(data));
  };
  decompress = function(b64) {
    return lzw_decode(base64.decode(b64));
  };
  $(document).ready(function() {
    var compressCache, docTitle, editor, saveTimer, saved, setIndex, setState, setToc, state, updateIndex, updateStatus, updateToc, updateView;
    state = new State;
    state.on('change', function() {
      return updateStatus(true);
    });
    compressCache = '';
    docTitle = function() {
      var e, v;
      v = $('#view');
      e = $('<div></div>').append($('h1,h2,h3', v).first().html());
      $('.index', e).remove();
      return e.text() || 'untitled';
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
      return $('#toc').html($('#view').toc());
    };
    updateIndex = function() {
      return $('#view').number().index();
    };
    updateView = function() {
      var v;
      v = $('#view');
      v.html(markdown.makeHtml(editor.getValue()));
      if (state.has('index')) {
        updateIndex();
      }
      if (state.has('toc')) {
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
          if (state.has('toc')) {
            updateToc();
          }
        }
        return $('#view-wrap').addClass('indexed');
      } else {
        return $('#view-wrap').removeClass('indexed');
      }
    };
    $('#toggleToc').click(function() {
      return state.toggle('toc');
    });
    $('#toggleIndex').click(function() {
      return state.toggle('index');
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
    window.editor = editor = CodeMirror.fromTextArea($('#input-md')[0], {
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
      return state.parseHash(location.hash, function(data) {
        if ((data != null) && data !== compressCache) {
          editor.setValue(data);
        }
        setIndex(state.has('index'));
        return setToc(state.has('toc'));
      });
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
