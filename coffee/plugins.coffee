$ = jQuery
$.fn.getCursorPosition = ->
  pos = 0
  el = $(@).get 0
  # IE Support
  if document.selection
    el.focus()
    Sel = document.selection.createRange()
    SelLength = document.selection.createRange().text.length
    Sel.moveStart 'character', -el.value.length
    pos = Sel.text.length - SelLength
  # Firefox support
  else if el.selectionStart or el.selectionStart is 0
    pos = el.selectionStart
  pos

$.fn.number = ->
  selector = 'H1,H2,H3,H4,H5,H6,OL,UL,LI'
  order = selector.split(',')
  map = {}
  map[sel] = {c:0, pos:i} for sel, i in order
  num = (tag) ->
    (c for i in [0..map[tag].pos]\
     when (c=map[(t=order[i])].c) isnt 0\
     and t not in ['OL', 'UL']).join ','
  count = (sel) ->
    e = map[sel]
    e.c++
    (map[order[i]].c = 0 for i in [e.pos+1...order.length])
  for h, i in $(selector, @)
    t = h.tagName
    count t
    h.setAttribute 'data-number', num t if t not in ['OL', 'UL']
