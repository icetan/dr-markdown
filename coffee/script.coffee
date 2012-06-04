markdown = new Showdown.converter()

$(document).ready ->
  updateToc = ->
    v = $('#view')
    v.number()
    $('#toc').html v.generateToc()

  updateView = ->
    ta = $('#input-md')
    v = $('#view')
    v.html markdown.makeHtml editor.getValue()
    updateToc() if not $('#toc').hasClass('hidden')

  reader = new FileReader
  reader.onload = (e) ->
    editor.setValue e.target.result
    updateView()

  $('#toggleToc').click ->
    updateToc()
    $('#toc').toggleClass('hidden')
  $('#file').change -> reader.readAsText @files[0]
  editor = CodeMirror.fromTextArea $('#input-md')[0],
    mode: 'gfm'
    theme: 'neat'
    lineNumbers: no
    lineWrapping: yes
    onChange: updateView
  updateView()
