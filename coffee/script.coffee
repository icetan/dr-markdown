markdown = new Showdown.converter()

$(document).ready ->
  updateToc = -> $('#toc').html $('#view').toc()

  updateIndex = -> $('#view').number().index()

  updateView = ->
    v = $('#view')
    v.html markdown.makeHtml editor.getValue()
    if not $('#toc').hasClass('hidden')
      updateIndex() if $('#view-wrap').hasClass('indexed')
      updateToc()

  if FileReader?
    reader = new FileReader
    reader.onload = (e) ->
      editor.setValue e.target.result
      updateView()
    $('#file').change -> reader.readAsText @files[0]

  if BlobBuilder?
    $('#download').click ->
      filename = $('#view h1').first().text() or 'untitled'
      bb = new BlobBuilder
      bb.append editor.getValue()
      saveAs bb.getBlob('text/plain;charset=utf-8'), filename+'.md'
  else
    $('#download').hide()

  $('#print').click -> window.print()

  $('#toggleToc').click ->
    updateToc()
    $('#toc').toggleClass('hidden')

  $('#toggleIndex').click ->
    updateIndex() if $('#view .index').length is 0
    $('#view-wrap').toggleClass('indexed')

  editor = CodeMirror.fromTextArea $('#input-md')[0],
    mode: 'gfm'
    theme: 'neat'
    lineNumbers: no
    lineWrapping: yes
    onChange: updateView
  updateView()
