(function() {
  var markdown;
  markdown = new Showdown.converter();
  $(document).ready(function() {
    var editor, updateIndex, updateToc, updateView, _ref;
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
        var bb, filename;
        filename = $('#view h1').first().text() || 'untitled';
        bb = new BlobBuilder;
        bb.append(editor.getValue());
        return saveAs(bb.getBlob('text/plain;charset=utf-8'), filename + '.md');
      });
    } else {
      $('#download').hide();
    }
    if (typeof btoa !== "undefined" && btoa !== null) {
      $('#link-b64').click(function() {
        var url;
        url = "" + location.protocol + "//" + location.host + location.pathname + "#?" + (btoa(editor.getValue()));
        return $('#link-b64-text').val(url).removeClass('hidden').focus().select().blur(function() {
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
    editor = CodeMirror.fromTextArea($('#input-md')[0], {
      mode: 'gfm',
      theme: 'neat',
      lineNumbers: false,
      lineWrapping: true,
      onChange: updateView
    });
    if ((typeof atob !== "undefined" && atob !== null) && ((_ref = location.hash) != null ? _ref.substr(0, 2) : void 0) === '#?') {
      editor.setValue(atob(location.hash.substr(2)));
    }
    return updateView();
  });
}).call(this);
