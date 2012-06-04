// Generated by CoffeeScript 1.3.1
(function() {
  var markdown;

  markdown = new Showdown.converter();

  $(document).ready(function() {
    var editor, reader, updateToc, updateView;
    updateToc = function() {
      var v;
      v = $('#view');
      v.number();
      return $('#toc').html(v.generateToc());
    };
    updateView = function() {
      var ta, v;
      ta = $('#input-md');
      v = $('#view');
      v.html(markdown.makeHtml(editor.getValue()));
      if (!$('#toc').hasClass('hidden')) {
        return updateToc();
      }
    };
    reader = new FileReader;
    reader.onload = function(e) {
      editor.setValue(e.target.result);
      return updateView();
    };
    $('#toggleToc').click(function() {
      updateToc();
      return $('#toc').toggleClass('hidden');
    });
    $('#file').change(function() {
      return reader.readAsText(this.files[0]);
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
