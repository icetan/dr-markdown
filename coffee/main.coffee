require './bring-the-noise.coffee'

vixen = require 'vixen'
marked = require 'marked'
marked.setOptions
  gfm: true
  tables: true
  breaks: true
  smartLists: true

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

state = proxy
  toc: (to) ->
    updateToc() if to
    model.showToc = if to then 'toc' else ''
  index: (to) ->
    if to
      if document.querySelectorAll('#view [data-number]').length is 0
        updateIndex()
        updateToc() if state.toc
      model.showIndex = 'indexed'
    else
      model.showIndex = ''
  mode: (mode, old) ->
    model.mode = {
      write: 'full-input'
      read: 'full-view'
      present: 'present'
    }[mode] or ''
    if mode in ['read', 'present']
      editor.setOption 'readOnly', 'nocursor'
      updateView()
    else if mode in ['write', '']
      editor.setOption 'readOnly', no
      editor.focus()
      updateView true if mode is ''
  slide: (nr) -> updateView()
  theme: (v) ->
    model.theme = v
    updateThemes()

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

updateView = (force) ->
  switch
    when force or state.mode in ['read', 'write']
      viewEl.innerHTML = marked editor.getValue()
    when state.mode is 'present'
      md = editor.getValue().split /\n\s*\n\s*(?:[-*]\s*){3,}\n/
      if state.slide < md.length
        viewEl.innerHTML = marked md[state.slide || 0]
      else
        state.slide = md.length - 1
    else
      cline = editor.getCursor().line
      md = editor.getValue().split '\n'
      md[cline] += '<span id="cursor"></span>'
      md = md.join '\n'
      viewEl.innerHTML = marked md
      updateIndex() if state.index
      updateToc() if state.toc
      scrollTop = viewWrapEl.scrollTop
      viewHeight = viewWrapEl.offsetHeight
      cursorSpan = document.getElementById 'cursor'
      cursorTop = cursorSpan.offsetTop
      cursorHeight = cursorSpan.offsetHeight
      if cursorTop < scrollTop or cursorTop > scrollTop + viewHeight - cursorHeight
        viewWrapEl.scrollTop = cursorTop - viewHeight/2

updateTitle = -> document.title = (if saved then '' else '*')+docTitle()

updateThemes = ->
  model.themes = [ 'serif', 'cv' ].map (name) ->
    name: name
    active: state.theme is name
    click: -> state.theme = name

nextSlide = -> state.slide = (state.slide || 0)+1
prevSlide = -> state.slide = Math.max (state.slide || 0)-1, 0

correctionTimer = null
saveTimer = null
editor = CodeMirror.fromTextArea document.getElementById('input-md'),
  mode: 'gfm'
  theme: 'default'
  lineNumbers: no
  lineWrapping: yes
  dragDrop: no
  autofocus: yes
editor.on 'change', ->
  updateView()
  if initiated
    if saved
      saved = no
      updateTitle()
    clearTimeout correctionTimer
    correctionTimer = setTimeout (-> updateView true), 1000
    clearTimeout saveTimer
    saveTimer = setTimeout save, 5000
  else
    updateTitle()

restore = (data) ->
  currentText = editor.getValue()
  if data
    { text, meta } = data
    extend state, extend({theme:'serif'}, meta or {})
    editor.setValue text if text? and text isnt currentText
  else
    state.theme = 'serif'
    save true if currentText
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
    model.showSettings = yes
  stores: Object.keys(state_.stores).map (key) -> name: key
  showSettings: no
  print: -> window.print()
  mode: ''
  toggleToc: -> state.toc = not state.toc
  toggleIndex: -> state.index = not state.index
  gotoPresent: -> state.mode = 'present'
  expandInput: -> state.mode = (if state.mode then '' else 'write')
  expandView: -> state.mode = (if state.mode then '' else 'read')
  closePopups: ->
    model.showSettings = no
    nextSlide() if state.mode is 'present'
  mouseout: (e) ->
    from = e.relatedTarget or e.toElement
    save() if not from or from.nodeName is 'HTML'
  hotkeyCombo: (e) ->
    hit = undefined
    if e.ctrlKey
      if e.altKey
        hit = switch e.keyCode
          when 26 then state.mode = 'present'; true # ctrl+alt+z
          when 24 then state.mode = 'write'; true # ctrl+alt+x
          when 3 then state.mode = ''; true # ctrl+alt+c
          when 22 then state.mode = 'read'; true # ctrl+alt+v
          when 19 then save true; true
    e.preventDefault() if hit
  hotkey: (e) ->
    hit = undefined
    if state.mode is 'present'
      console.log e.keyCode
      hit = switch e.keyCode
        when 32, 39 then nextSlide(); true # space, ->
        when 37 then prevSlide(); true # <-
        when 27 then state.mode = ''; true # esc
    e.preventDefault() if hit

state_.restore null, null, (err, data) -> restore data
state_.on 'restore', (data) ->
  initiated = no
  restore data

vixen document.body.parentNode, model

window.onbeforeunload = ->
  'You have unsaved changes.' if not saved
