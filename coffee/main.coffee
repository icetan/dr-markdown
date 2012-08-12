$ = require '../lib/zepto'

Showdown = require 'showdown'
markdown = new Showdown.converter()

base64 = require '../lib/base64'
lzw = require '../lib/lzw'

require './unify'
State = require './State'

module.exports = ->
  state = new State
  state.on 'change', -> updateStatus yes

  docTitle = ->
    v = $('#view')
    e = $('<div></div>').append $('h1,h2,h3', v).first().html() or 'untitled'
    $('.index', e).remove()
    e.text()
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
    cline = editor.getCursor().line
    md = editor.getValue().split '\n'
    md[cline] += '<span id="cursor"></span>'
    md = md.join '\n'
    v = $('#view')
    v.html markdown.makeHtml md
    updateIndex() if state.has 'index'
    updateToc() if state.has 'toc'
    viewWrap = $('#view-wrap')[0]
    scrollTop = viewWrap.scrollTop
    viewHeight = viewWrap.offsetHeight
    cursorSpan = $('#cursor')[0]
    cursorTop = cursorSpan.offsetTop
    cursorHeight = cursorSpan.offsetHeight
    if cursorTop < scrollTop or cursorTop > scrollTop + viewHeight - cursorHeight
      viewWrap.scrollTop = cursorTop - viewHeight/2


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
    .focus()##.select()
    .blur -> $(@).addClass('hidden')

  $('#print').click -> window.print()

  setFull = (to) -> $('#view-wrap').toggleClass('full', to)

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

  $('#toggleFull').click -> state.toggle 'full'
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
  editor = CodeMirror.fromTextArea $('#input-md')[0],
    mode: 'gfm'
    theme: 'default'
    lineNumbers: no
    lineWrapping: yes
    onChange: ->
      updateView()
      saved = no
      clearTimeout saveTimer
      saveTimer = setTimeout updateStatus, 5000
    onDragEvent: (editor, event) ->
      $('#drag-n-drop-wrap').remove() if event.type is 'drop'
      false

  setState = ->
    state.parseHash location.hash, (data) ->
      editor.setValue data if data? and data isnt editor.getValue()
      setFull state.has 'full'
      setIndex state.has 'index'
      setToc state.has 'toc'

  $(window).bind 'hashchange', setState

  setState()

  $('#drag-n-drop-wrap').removeClass 'hidden' if not editor.getValue()
  $('#input-wrap').one 'click', -> $('#drag-n-drop-wrap').remove()

  updateView()
  updateStatus()
