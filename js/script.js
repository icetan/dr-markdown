(function() {
  var markdown;
  markdown = new Showdown.converter();
  $(document).ready(function() {
    var editor, reader, updateIndex, updateToc, updateView;
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
    if (typeof FileReader !== "undefined" && FileReader !== null) {
      reader = new FileReader;
      reader.onload = function(e) {
        editor.setValue(e.target.result);
        return updateView();
      };
      $('#file').change(function() {
        return reader.readAsText(this.files[0]);
      });
    }
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
    return updateView();
  });
}).call(this);
