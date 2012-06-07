(function() {
  var markdown;
  markdown = new Showdown.converter();
  $(document).ready(function() {
    var compress, decompress, docTitle, editor, serializeToUrl, updateIndex, updateStatus, updateToc, updateView, _ref;
    compress = function() {
      return base64.encode(lzw_encode(editor.getValue()));
    };
    decompress = function(b64) {
      return editor.setValue(lzw_decode(base64.decode(b64)));
    };
    serializeToUrl = function() {
      return "" + location.protocol + "//" + location.host + location.pathname + "#?" + (compress());
    };
    docTitle = function() {
      var e, v;
      v = $('#view');
      e = $('<div></div>').append($('h1,h2,h3', v).first().html());
      $('.index', e).remove();
      return e.text() || 'untitled';
    };
    updateStatus = function() {
      location.hash = '#?' + compress();
      return document.title = "Dr. Markdown - " + (docTitle());
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
      if ($('#view-wrap').hasClass('indexed')) {
        updateIndex();
      }
      if (!$('#toc').hasClass('hidden')) {
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
      return $('#link-b64-text').val(serializeToUrl()).removeClass('hidden').focus().select().blur(function() {
        return $(this).addClass('hidden');
      });
    });
    $('#print').click(function() {
      return window.print();
    });
    $('#toggleToc').click(function() {
      updateToc();
      return $('#toc').toggleClass('hidden');
    });
    $('#toggleIndex').click(function() {
      if ($('#view [data-number]').length === 0) {
        updateIndex();
        if (!$('#toc').hasClass('hidden')) {
          updateToc();
        }
      }
      return $('#view-wrap').toggleClass('indexed');
    });
    $('#input-wrap').mouseover(function() {
      return $('#modes').removeClass('hidden');
    });
    $('#input-wrap').mouseout(function() {
      return $('#modes').addClass('hidden');
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
    editor = CodeMirror.fromTextArea($('#input-md')[0], {
      mode: 'gfm',
      theme: 'default',
      lineNumbers: false,
      lineWrapping: true,
      onChange: updateView,
      onBlur: updateStatus,
      onDragEvent: function(editor, event) {
        if (event.type === 'drop') {
          $('#drag-n-drop-wrap').remove();
        }
        return false;
      }
    });
    if (((_ref = location.hash) != null ? _ref.substr(0, 2) : void 0) === '#?') {
      decompress(location.hash.substr(2));
    }
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
