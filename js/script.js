// Generated by CoffeeScript 1.3.1
(function() {
  var markdown;

  markdown = new Showdown.converter();

  $(document).ready(function() {
    var reader, updateView;
    updateView = function() {
      var ta, v;
      ta = $('#markdown-input');
      v = $('#view');
      v.html(markdown.makeHtml(ta.val()));
      return v.number();
    };
    reader = new FileReader;
    reader.onload = function(e) {
      $('#markdown-input').val(e.target.result);
      return updateView();
    };
    $('#file').change(function() {
      return reader.readAsText(this.files[0]);
    });
    $('body').click(function() {
      return $('#markdown-input').focus();
    });
    $('#markdown-input').keyup(updateView).keydown(function(e) {
      var key, pos;
      key = e.keyCode;
      console.log(e.keyCode);
      if (key === 9) {
        pos = $(this).getCursorPosition();
        this.value = this.value.substr(0, pos) + '    ' + this.value.substr(pos);
        return false;
      }
    });
    return updateView();
  });

}).call(this);
