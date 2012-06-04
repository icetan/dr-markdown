coffeete = require 'coffeete'
markdown = new require('showdown').Showdown
markdown.converter()

view =
  header: ''
  body: ''

  markdown: (txt) -> markdown.makeHtml txt
  trim: (str) -> str.replace new RegExp('^\\s*([^\u0000]*?)\\s*$'), '$1'
  fstLetter: (txt, f) ->
    txt = @trim txt
    f txt.slice(0,1), txt.slice(1)

number = ->
  order = 'H1,H2,H3,H4,H5,H6,OL,OL>LI'.split(',')
  map = {}
  map[sel] = {c:0, pos:i} for sel, i in order
  num = (tag) ->
    (c for i in [0..map[tag].pos] when (c=map[(t=order[i])].c) isnt 0 and t isnt 'OL').join ','
  count = (sel) ->
    e = map[sel]
    e.c++
    (map[order[i]].c = 0 for i in [e.pos+1...order.length])
  for sel in order
    for h, i in $(sel)
      count sel
      h.setAttribute 'data-number', num h.tagName


require('domready') ->
  $ = jQuery
  updateView = ->
    ta = $('#markdown-input')
    iw = $('#input-wrap')
    v = $('#view')
    v.html markdown.makeHtml ta.val()
    ta.height v.height() or 60 #- iw.position().top - (iw.outerHeight(true) - iw.height())
  reader = new FileReader
  reader.onload = (e) ->
    view.body = e.target.result
    $('body')[0].innerHTML = coffeete($('#template')[0].text) view
    #number()
  $('#file').change -> reader.readAsText @files[0]

  $('body').click -> $('#markdown-input').focus()
  $('#markdown-input')
  .keyup(updateView)
  .keydown (e) ->
    key = e.keyCode
    console.log e.keyCode
    if key is 9 # Tab
      pos = $(@).getCursorPosition()
      @value = @value.substr(0, pos) + '    ' + @value.substr(pos)
      false
  updateView()
