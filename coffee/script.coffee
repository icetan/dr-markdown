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

  if BlobBuilder?
    $('#download').click ->
      filename = $('#view h1').first().text() or 'untitled'
      bb = new BlobBuilder
      bb.append editor.getValue()
      saveAs bb.getBlob('text/plain;charset=utf-8'), filename+'.md'
  else
    $('#download').hide()

  if btoa?
    $('#link-b64').click ->
      url = "#{location.protocol}//#{location.host}#{location.pathname}#?#{btoa editor.getValue()}"
      $('#link-b64-text').val(url)
      .removeClass('hidden')
      .focus().select()
      .blur -> $(@).addClass('hidden')
  else
    $('#link-b64').hide()

  $('#print').click -> window.print()

  $('#toggleToc').click ->
    updateToc()
    $('#toc').toggleClass('hidden')

  $('#toggleIndex').click ->
    updateIndex() if $('#view .index').length is 0
    $('#view-wrap').toggleClass('indexed')

  $('#input-wrap').mouseover ->
    $('#modes').removeClass 'hidden'
  $('#input-wrap').mouseout ->
    $('#modes').addClass 'hidden'
  $('#mode-gfm').click ->
    editor.setOption 'mode', 'gfm'
    $('#modes .label').removeClass('active')
    $(@).addClass('active')
  $('#mode-css').click ->
    editor.setOption 'mode', 'css'
    $('#modes .label').removeClass('active')
    $(@).addClass('active')

  editor = CodeMirror.fromTextArea $('#input-md')[0],
    mode: 'gfm'
    theme: 'neat'
    lineNumbers: no
    lineWrapping: yes
    onChange: updateView

  if atob? and location.hash?.substr(0,2) is '#?'
    editor.setValue atob location.hash.substr 2

  updateView()
