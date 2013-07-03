module.exports = 
  getCursorPosition: (el) ->
    pos = 0
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

  number: (el) ->
    selector = 'H1,H2,H3,H4,H5,H6' # + ',OL,UL,LI'
    elems = []
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
    reset = (clear) ->
      elems = [] if clear
      obj.c = 0 for sel,obj of map
    for h, i in el.querySelectorAll('[data-number-reset],[data-number-clear],'+selector)
      if h.hasAttribute 'data-number-reset'
        reset()
      else if h.hasAttribute 'data-number-clear'
        reset true
      else
        t = h.tagName
        count t
        elems.push [h, num t] if t not in ['OL', 'UL']
    h.setAttribute 'data-number', n for [h, n] in elems
    el

  index: (el) ->
    for e in el.querySelectorAll('[data-number]')
      e.innerHTML = """
                   <span class="index">
                   #{e.getAttribute('data-number').split(',').join('. ')}.
                   </span>
                   """ + e.innerHTML
    el

  toc: (el) ->
    '<ul>' + (for e in el.querySelectorAll('H1,H2,H3,H4,H5,H6')
      """
      <li><a href="##{e.id}"><#{e.tagName}>
      #{e.innerHTML}
      </#{e.tagName}></a></li>
      """
    ).join('') + '</ul>'
