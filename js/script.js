(function() {
  var markdown;
  markdown = new Showdown.converter();
  $(document).ready(function() {
    var docTitle, editor, serializeToUrl, updateIndex, updateStatus, updateToc, updateView, _ref;
    serializeToUrl = function() {
      return "" + location.protocol + "//" + location.host + location.pathname + "#?" + (btoa(editor.getValue()));
    };
    docTitle = function() {
      var e;
      e = $('<div></div>').append($('#view h1').first().html());
      $('.index', e).remove();
      return e.text() || 'untitled';
    };
    updateStatus = function() {
      if (typeof btoa !== "undefined" && btoa !== null) {
        location.hash = '#?' + btoa(editor.getValue());
      }
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
      if (!$('#toc').hasClass('hidden')) {
        if ($('#view-wrap').hasClass('indexed')) {
          updateIndex();
        }
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
    if (typeof btoa !== "undefined" && btoa !== null) {
      $('#link-b64').click(function() {
        return $('#link-b64-text').val(serializeToUrl()).removeClass('hidden').focus().select().blur(function() {
          return $(this).addClass('hidden');
        });
      });
    } else {
      $('#link-b64').hide();
    }
    $('#print').click(function() {
      return window.print();
    });
    $('#toggleToc').click(function() {
      updateToc();
      return $('#toc').toggleClass('hidden');
    });
    $('#toggleIndex').click(function() {
      if ($('#view .index').length === 0) {
        updateIndex();
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
    if ((typeof atob !== "undefined" && atob !== null) && ((_ref = location.hash) != null ? _ref.substr(0, 2) : void 0) === '#?') {
      editor.setValue(atob(location.hash.substr(2)));
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
