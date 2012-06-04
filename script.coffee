markdown = new require('showdown').Showdown
markdown.converter()

require('domready') ->
  $ = jQuery
  number = ->
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
    for h, i in $(selector)
      t = h.tagName
      count t
      h.setAttribute 'data-number', num t if t not in ['OL', 'UL']

  updateView = ->
    ta = $('#markdown-input')
    v = $('#view')
    v.html markdown.makeHtml ta.val()
    number()

  reader = new FileReader
  reader.onload = (e) ->
    $('#markdown-input').val e.target.result
    updateView()

  $('#file').change -> reader.readAsText @files[0]
  $('body').click -> $('#markdown-input').focus()
  $('#markdown-input')
  .keyup(updateView)
  .keydown (e) ->
    key = e.keyCode
    console.log e.keyCode
    if key is 9 # Tab to 4 spaces
      pos = $(@).getCursorPosition()
      @value = @value.substr(0, pos) + '    ' + @value.substr(pos)
      false

  updateView()
