markdown = new Showdown.converter()

$(document).ready ->
  compress = -> base64.encode lzw_encode editor.getValue()
  decompress = (b64) -> editor.setValue lzw_decode base64.decode b64

  serializeToUrl = ->
    "#{location.protocol}//#{location.host}#{location.pathname}#?#{compress()}"

  docTitle = ->
    v = $('#view')
    e = $('<div></div>').append $('h1,h2,h3', v).first().html()
    $('.index', e).remove()
    e.text() or 'untitled'

  updateStatus = ->
    location.hash = '#?'+compress()
    document.title = "Dr. Markdown - #{docTitle()}"

  updateToc = -> $('#toc').html $('#view').toc()

  updateIndex = -> $('#view').number().index()

  updateView = ->
    v = $('#view')
    v.html markdown.makeHtml editor.getValue()
    updateIndex() if $('#view-wrap').hasClass('indexed')
    updateToc() if not $('#toc').hasClass('hidden')

  if BlobBuilder?
    $('#download').click ->
      bb = new BlobBuilder
      bb.append editor.getValue()
      saveAs bb.getBlob('text/plain;charset=utf-8'), docTitle()+'.md'
  else
    $('#download').hide()

  $('#link-b64').click ->
    $('#link-b64-text').val(serializeToUrl())
    .removeClass('hidden')
    .focus().select()
    .blur -> $(@).addClass('hidden')

  $('#print').click -> window.print()

  $('#toggleToc').click ->
    updateToc()
    $('#toc').toggleClass('hidden')

  $('#toggleIndex').click ->
    if $('#view [data-number]').length is 0
      updateIndex()
      updateToc() if not $('#toc').hasClass('hidden')
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

  if location.hash?.substr(0,2) is '#?'
    decompress location.hash.substr 2

  $('#drag-n-drop-wrap').removeClass 'hidden' if not editor.getValue()
  $('#input-wrap').one 'click', -> $('#drag-n-drop-wrap').remove()

  updateView()
  updateStatus()
