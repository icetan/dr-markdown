require './bring-the-noise.coffee'

vixen = require 'vixen'
Showdown = require 'showdown'
markdown = new Showdown.converter()

require './unify.coffee'

state_ = require './state.coffee'
require './state-gist.coffee'

{number, index, toc} = require './utils.coffee'

extend = (r={}, d) -> r[k] = v for k, v of d when v?; r
extendA = (r={}, a) -> r[k] = v for [k, v] in a when v?; r

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

tocEl = document.getElementById 'toc'
viewEl = document.getElementById 'view'
viewWrapEl = document.getElementById 'view-wrap'

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
  theme: (v) -> model.theme = c

docTitle = ->
  tmp = document.createElement 'div'
  tmp.innerHTML = if (h = viewEl.querySelectorAll('h1,h2,h3')[0])
    h.innerHTML
  else
    'Untitled'
  [].forEach.call tmp.querySelectorAll('.index'), (el) -> tmp.removeChild el
  tmp.textContent

initiated = no
saved = yes

save = (force) ->
  if not saved or force
    state_.store null,
      text: editor.getValue()
      meta: extend state, title:docTitle(), autosave:not force
    ,(err, id) ->
      saved = not err?
      updateTitle()

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
updateTitle = ->
  document.title = (if saved then '' else '*')+docTitle()

saveTimer = null
editor = CodeMirror.fromTextArea document.getElementById('input-md'),
  mode: 'gfm'
  theme: 'default'
  lineNumbers: no
  lineWrapping: yes
  dragDrop: no
  onChange: ->
    updateView()
    if initiated
      if saved
        saved = no
        updateTitle()
      clearTimeout saveTimer
      saveTimer = setTimeout save, 5000
    else
      updateTitle()

restore = (data) ->
  currentText = editor.getValue()
  if data
    { text, meta } = data
    extend state, meta or {}
    editor.setValue text if text? and text isnt currentText
  else if currentText
    save true
  model.theme = state.theme or 'serif'
  initiated = yes

model =
  show: (v) -> if v then '' else 'hide'
  hide: (v) -> if v then 'hide' else ''
  noop: (e) -> e.preventDefault(); false
  stop: (e) -> e.stopPropagation(); false
  drop: (e) ->
    reader = new FileReader
    reader.onload = (e) ->
      initiated = yes
      editor.setValue e.target.result
    reader.readAsText e.dataTransfer.files[0]
  settings: ->
    model.showStores = yes
  stores: Object.keys(state_.stores).map (key) -> name: key
  showStores: no
  print: -> window.print()
  mode: ''
  toggleToc: -> state.toc = not state.toc
  toggleIndex: -> state.index = not state.index
  expandInput: ->
    state.mode = (if state.mode then '' else 'write')
  expandView: ->
    state.mode = (if state.mode then '' else 'read')
  closePopups: -> model.showStores = no
  mouseout: (e) ->
    from = e.relatedTarget or e.toElement
    save() if not from or from.nodeName is 'HTML'
  hotkey: (e) ->
    if e.ctrlKey
      if e.altKey
        switch e.keyCode
          when 24 then state.mode = 'write' # ctrl+alt+x
          when 3 then state.mode = '' # ctrl+alt+c
          when 22 then state.mode = 'read' # ctrl+alt+v
      else
        switch e.keyCode
          when 19 then save true

state_.restore null, null, (err, data) -> restore data
state_.on 'restore', (data) ->
  initiated = no
  restore data

vixen document.body.parentNode, model
