vixen = require 'vixen'
Showdown = require 'showdown'
markdown = new Showdown.converter()

require './unify.coffee'
State = require './State.coffee'

module.exports = ->
  state = new State
  state.on 'change', -> updateStatus yes

  tocEl = document.getElementById 'toc'
  viewEl = document.getElementById 'view'
  viewWrapEl = document.getElementById 'view-wrap'

  docTitle = ->
    tmp = document.createElement 'div'
    tmp.innerHTML = if (h = viewEl.querySelectorAll('h1,h2,h3')[0])
      h.innerHTML
    else
      'Untitled'
    [].forEach.call tmp.querySelectorAll('.index'), (el) -> e.removeChild el
    tmp.textContent
  saved = yes
  updateStatus = (force) ->
    if not saved or force
      state.generateHash 'base64', editor.getValue(), (hash) ->
        location.hash = hash
      document.title = docTitle()
      saved = yes

  updateToc = -> tocEl.innerHTML = viewEl $.toc()

  updateIndex = -> viewEl $.number().index()

  cursorToken = '^^^cursor^^^'
  updateView = ->
    cline = editor.getCursor().line
    md = editor.getValue().split '\n'
    md[cline] += cursorToken
    md = md.join '\n'
    v = viewEl
    v.innerHTML = markdown.makeHtml(md).replace(cursorToken, '<span id="cursor"></span>')
    updateIndex() if state.has 'index'
    updateToc() if state.has 'toc'
    scrollTop = viewWrapEl.scrollTop
    viewHeight = viewWrapEl.offsetHeight
    cursorSpan = document.getElementById 'cursor'
    cursorTop = cursorSpan.offsetTop
    cursorHeight = cursorSpan.offsetHeight
    if cursorTop < scrollTop or cursorTop > scrollTop + viewHeight - cursorHeight
      viewWrapEl.scrollTop = cursorTop - viewHeight/2

  setFullInput = (to) -> model.showFullInput = (if to then 'full-input' else '')
  setFullView = (to) -> model.showFullView = (if to then 'full-view' else '')
  setToc = (to) ->
    updateToc() if to
    model.showToc = if to then 'toc' else ''
  setIndex = (to) ->
    if to
      if document.querySelectorAll('#view [data-number]').length is 0
        updateIndex()
        updateToc() if state.has 'toc'
      model.showIndex = ''
    else
      model.showIndex = 'indexed'

  saveTimer = null
  editor = CodeMirror.fromTextArea document.getElementById('input-md'),
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
      showDnd = no if showDnd or event.type is 'drop'
      false

  setState = ->
    state.parseHash location.hash, (data) ->
      editor.setValue data if data? and data isnt editor.getValue()
      setFullInput state.has 'fullinput'
      setFullView state.has 'full'
      setIndex state.has 'index'
      setToc state.has 'toc'
      model.theme = state.state.theme or 'serif'

  window.addEventListener 'hashchange', setState

  model =
    show: (v) -> if v then '' else 'hide'
    hide: (v) -> if v then 'hide' else ''
    showDownload: Blob?
    download: ->
      saveAs new Blob([editor.getValue()], type: 'text/plain;charset=utf-8'),
        docTitle()+'.md'
    linkB64: ->
      updateStatus()
      prompt 'Copy this', location.href
      #model.linkCopy = location.href
      #model.showLinkCopy = true
      #.focus()
      #.blur -> $(@).addClass('hidden')
    print: -> window.print()
    showFullInput: ''
    showFullView: ''
    toggleToc: -> state.toggle 'toc'
    toggleIndex: -> state.toggle 'index'
    expandInput: -> state.toggle 'fullinput'
    expandView: -> state.toggle 'full'
    mouseout: (e) ->
      from = e.relatedTarget or e.toElement
      updateStatus() if not from or from.nodeName is 'HTML'
    keypress: (e) ->
      if e.ctrlKey and e.altKey
        if e.keyCode is 24 # ctrl+alt+x
          state.set 'full', off
          state.set 'fullinput', on
        else if e.keyCode is 3 # ctrl+alt+c
          state.set 'full', off
          state.set 'fullinput', off
        else if e.keyCode is 22 # ctrl+alt+v
          state.set 'fullinput', off
          state.set 'full', on

  setState()

  showDnd = no if not editor.getValue()
  #$('#input-wrap').one 'click', -> $('#drag-n-drop-wrap').remove()

  vixen(document.body.parentNode, model)

  updateView()
  updateStatus()
