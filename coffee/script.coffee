markdown = new Showdown.converter()

$(document).ready ->
  serializeToUrl = ->
    "#{location.protocol}//#{location.host}#{location.pathname}#?#{btoa editor.getValue()}"

  docTitle = ->
    e = $('<div></div>').append $('#view h1').first().html()
    $('.index', e).remove()
    e.text() or 'untitled'

  updateStatus = ->
    location.hash = '#?'+btoa editor.getValue() if btoa?
    document.title = "Dr. Markdown - #{docTitle()}"

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
      bb = new BlobBuilder
      bb.append editor.getValue()
      saveAs bb.getBlob('text/plain;charset=utf-8'), docTitle()+'.md'
  else
    $('#download').hide()

  if btoa?
    $('#link-b64').click ->
      $('#link-b64-text').val(serializeToUrl())
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
  $('#mode-html').click ->
    editor.setOption 'mode', 'htmlmixed'
    $('#modes .label').removeClass('active')
    $(@).addClass('active')

  editor = CodeMirror.fromTextArea $('#input-md')[0],
    mode: 'gfm'
    theme: 'default'
    lineNumbers: no
    lineWrapping: yes
    onChange: updateView
    onBlur: updateStatus
    onDragEvent: (editor, event) ->
      $('#drag-n-drop-wrap').remove() if event.type is 'drop'
      false

  if atob? and location.hash?.substr(0,2) is '#?'
    editor.setValue atob location.hash.substr 2

  $('#drag-n-drop-wrap').removeClass 'hidden' if not editor.getValue()
  $('#input-wrap').one 'click', -> $('#drag-n-drop-wrap').remove()

  updateView()
  updateStatus()
