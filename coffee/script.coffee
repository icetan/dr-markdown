markdown = new Showdown.converter()

compress = (data) -> base64.encode lzw_encode data
decompress = (b64) -> lzw_decode base64.decode b64

$(document).ready ->
  state = new State
  state.on 'change', -> updateStatus yes

  compressCache = ''
  #compressFromEditor = ->
  #  compressCache or (compressCache = compress editor.getValue())
  #decompressToEditor = (b64) -> editor.setValue decompress b64

  docTitle = ->
    v = $('#view')
    e = $('<div></div>').append $('h1,h2,h3', v).first().html()
    $('.index', e).remove()
    e.text() or 'untitled'

  saved = yes
  updateStatus = (force) ->
    if not saved or force
      state.generateHash 'base64', editor.getValue(), (hash) ->
        location.hash = hash
      document.title = docTitle()
      saved = yes

  updateToc = -> $('#toc').html $('#view').toc()

  updateIndex = -> $('#view').number().index()

  updateView = ->
    v = $('#view')
    v.html markdown.makeHtml editor.getValue()
    updateIndex() if state.has 'index'
    updateToc() if state.has 'toc'

  if BlobBuilder?
    $('#download').click ->
      bb = new BlobBuilder
      bb.append editor.getValue()
      saveAs bb.getBlob('text/plain;charset=utf-8'), docTitle()+'.md'
  else
    $('#download').hide()

  $('#link-b64').click ->
    updateStatus()
    $('#link-b64-text').val(location.href)
    .removeClass('hidden')
    .focus().select()
    .blur -> $(@).addClass('hidden')

  $('#print').click -> window.print()

  setToc = (to) ->
    if to
      updateToc()
      $('#toc').removeClass('hidden')
    else
      $('#toc').addClass('hidden')

  setIndex = (to) ->
    if to
      if $('#view [data-number]').length is 0
        updateIndex()
        updateToc() if state.has 'toc'
      $('#view-wrap').addClass('indexed')
    else
      $('#view-wrap').removeClass('indexed')

  $('#toggleToc').click -> state.toggle 'toc'
  $('#toggleIndex').click -> state.toggle 'index'

  $('#input-wrap').mouseover -> $('#modes').removeClass 'hidden'
  $('#input-wrap').mouseout -> $('#modes').addClass 'hidden'
  $(document).mouseout (e) ->
    from = e.relatedTarget or e.toElement
    updateStatus() if not from or from.nodeName is 'HTML'
  $('#mode-gfm').click ->
    editor.setOption 'mode', 'gfm'
    $('#modes .label').removeClass('active')
    $(@).addClass('active')
  $('#mode-html').click ->
    editor.setOption 'mode', 'htmlmixed'
    $('#modes .label').removeClass('active')
    $(@).addClass('active')

  saveTimer = null
  window.editor = editor = CodeMirror.fromTextArea $('#input-md')[0],
    mode: 'gfm'
    theme: 'default'
    lineNumbers: no
    lineWrapping: yes
    onChange: ->
      updateView()
      saved = no
      compressCache = ''
      clearTimeout saveTimer
      saveTimer = setTimeout updateStatus, 5000
    onDragEvent: (editor, event) ->
      $('#drag-n-drop-wrap').remove() if event.type is 'drop'
      false

  setState = ->
    state.parseHash location.hash, (data) ->
      editor.setValue data if data? and data isnt compressCache
      setIndex state.has 'index'
      setToc state.has 'toc'

  $(window).bind 'hashchange', setState

  setState()

  $('#drag-n-drop-wrap').removeClass 'hidden' if not editor.getValue()
  $('#input-wrap').one 'click', -> $('#drag-n-drop-wrap').remove()

  updateView()
  updateStatus()
