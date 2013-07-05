vixen = require 'vixen'
Showdown = require 'showdown'
markdown = new Showdown.converter()

require './unify.coffee'

state_ = require './state.coffee'
require './state-gist.coffee'

{number, index, toc} = require './utils.coffee'

extend = (r={}, d) -> r[k] = v for k, v of d; r
extendA = (r={}, a) -> r[k] = v for [k, v] in a; r

proxy = (dict) ->
  vault_ = {}
  def_ = (prop, fn) ->
    enumerable: true
    set: (value) ->
      old = vault_[prop]
      vault_[prop] = value
      fn value, old
    get: -> vault_[prop]
  Object.create Object.prototype,
    extendA({ toJSON: value: -> vault_ }, ([prop, def_(prop, fn)] for prop, fn of dict))

module.exports = ->
  updateToc = -> tocEl.innerHTML = toc viewEl
  updateIndex = -> index number viewEl
  setMode = (mode) ->
    model.mode = {
      write: 'full-input'
      read: 'full-view'
    }[mode] or ''
  setToc = (to) ->
    updateToc() if to
    model.showToc = if to then 'toc' else ''
  setIndex = (to) ->
    if to
      if document.querySelectorAll('#view [data-number]').length is 0
        updateIndex()
        updateToc() if state.toc
      model.showIndex = 'indexed'
    else
      model.showIndex = ''

  state = proxy
    toc: setToc
    index: setIndex
    mode: setMode
  #state.on 'change', -> updateStatus yes

  tocEl = document.getElementById 'toc'
  viewEl = document.getElementById 'view'
  viewWrapEl = document.getElementById 'view-wrap'

  docTitle = ->
    tmp = document.createElement 'div'
    tmp.innerHTML = if (h = viewEl.querySelectorAll('h1,h2,h3')[0])
      h.innerHTML
    else
      'Untitled'
    [].forEach.call tmp.querySelectorAll('.index'), (el) -> tmp.removeChild el
    tmp.textContent

  saved = yes

  updateStatus = (force) ->
    if not saved or force
      state_.store null, text:editor.getValue(), state:state
      #state.generateHash 'base64', editor.getValue(), (hash) ->
      #  location.hash = hash
      document.title = docTitle()
      saved = yes

  cursorToken = '^^^cursor^^^'
  updateView = ->
    cline = editor.getCursor().line
    md = editor.getValue().split '\n'
    md[cline] += cursorToken
    md = md.join '\n'
    v = viewEl
    v.innerHTML = markdown.makeHtml(md).replace(cursorToken, '<span id="cursor"></span>')
    updateIndex() if state.index
    updateToc() if state.toc
    scrollTop = viewWrapEl.scrollTop
    viewHeight = viewWrapEl.offsetHeight
    cursorSpan = document.getElementById 'cursor'
    cursorTop = cursorSpan.offsetTop
    cursorHeight = cursorSpan.offsetHeight
    if cursorTop < scrollTop or cursorTop > scrollTop + viewHeight - cursorHeight
      viewWrapEl.scrollTop = cursorTop - viewHeight/2

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

  setState = (data) ->
    { text, state:state__ } = data
    extend state, state__ or {}
    editor.setValue text if text? and text isnt editor.getValue()
    #setMode state.mode
    #setIndex state.index
    #setToc state.toc
    model.theme = state.theme or 'serif'

  #window.addEventListener 'hashchange', setState

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
    mode: ''
    toggleToc: -> state.toc = not state.toc
    toggleIndex: -> state.index = not state.index
    expandInput: ->
      state.mode = (if state.mode then '' else 'write')
    expandView: ->
      state.mode = (if state.mode then '' else 'read')
    mouseout: (e) ->
      from = e.relatedTarget or e.toElement
      updateStatus() if not from or from.nodeName is 'HTML'
    keypress: (e) ->
      if e.ctrlKey and e.altKey
        if e.keyCode is 24 # ctrl+alt+x
          state.mode = 'write'
        else if e.keyCode is 3 # ctrl+alt+c
          state.mode = ''
        else if e.keyCode is 22 # ctrl+alt+v
          state.mode = 'read'

  state_.restore null, null, setState
  state_.on 'restore', setState

  showDnd = no if not editor.getValue()
  #$('#input-wrap').one 'click', -> $('#drag-n-drop-wrap').remove()

  vixen(document.body.parentNode, model)

  updateView()
  #updateStatus()
