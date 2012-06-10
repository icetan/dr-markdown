markdown = new Showdown.converter()

kvpToDict = (d, kvp) -> d[kvp[0]] = (if kvp[1]? then kvp[1] else true)

compress = (data) -> base64.encode lzw_encode data
decompress = (b64) -> lzw_decode base64.decode b64

parseState = (hash) ->
  map = {}
  pos =  hash.indexOf ';'
  if pos is -1
    state = hash.substring 1
  else
    state = hash.substring 1, pos
    data = hash.substring pos+1
  kvpToDict map, kvp.split '=' for kvp in state.split ','
  [map, data or '']

generateState = (map, data) ->
  state = for k, v of map when v isnt false
    if not v? or v is true then k else k+'='+v
  "##{state.join ','};#{data}"

$(document).ready ->
  state = {}
  compressCache = ''
  compressFromEditor = ->
    compressCache or (compressCache = compress editor.getValue())
  decompressToEditor = (b64) -> editor.setValue decompress b64

  docTitle = ->
    v = $('#view')
    e = $('<div></div>').append $('h1,h2,h3', v).first().html()
    $('.index', e).remove()
    e.text() or 'untitled'

  stateHas = (type) -> state[type]? and state[type] isnt false
  stateSet = (type, val) ->
    state[type] = val
    updateStatus yes
  stateToggle = (type) -> stateSet type, not stateHas type

  saved = yes
  updateStatus = (force) ->
    if not saved or force
      location.hash = generateState state, compressFromEditor()
      document.title = docTitle()
      saved = yes

  updateToc = -> $('#toc').html $('#view').toc()

  updateIndex = -> $('#view').number().index()

  updateView = ->
    v = $('#view')
    v.html markdown.makeHtml editor.getValue()
    updateIndex() if stateHas 'index'
    updateToc() if stateHas 'toc'

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
        updateToc() if stateHas 'toc'
      $('#view-wrap').addClass('indexed')
    else
      $('#view-wrap').removeClass('indexed')

  $('#toggleToc').click -> stateToggle 'toc'
  $('#toggleIndex').click -> stateToggle 'index'

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
  editor = CodeMirror.fromTextArea $('#input-md')[0],
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
    [state, data] = parseState location.hash
    decompressToEditor data if data isnt compressCache
    setIndex stateHas 'index'
    setToc stateHas 'toc'

  $(window).bind 'hashchange', setState

  setState()

  $('#drag-n-drop-wrap').removeClass 'hidden' if not editor.getValue()
  $('#input-wrap').one 'click', -> $('#drag-n-drop-wrap').remove()

  updateView()
  updateStatus()
