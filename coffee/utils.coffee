slug = (str) -> str.trim().replace(/[^a-z0-9]+/ig,'-').toLowerCase()

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
    selector = 'H1,H2,H3,H4,H5,H6' + ',OL,OL>LI'
    elems = []
    order = (s.replace(/^.*>/, '') for s in selector.split(','))
    map = {}
    map[sel] = {c:0, pos:i} for sel, i in order
    num = (tag) ->
      pos = map[tag].pos
      if tag is 'LI'
        String.fromCharCode map[order[pos]].c + 96
      else
        (c for i in [0..pos] when (c=map[(t=order[i])].c) isnt 0 and t isnt 'OL').join ','
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
        elems.push [h, num t] if t isnt 'OL'
    h.setAttribute 'data-number', n for [h, n] in elems
    el

  index: (el, fn) ->
    for e in el.querySelectorAll('[data-number]')
      numbers = e.getAttribute('data-number').split(',')
      (fn or (e, n) ->
        span = document.createElement 'span'
        span.className = 'index'
        span.innerHTML = n.join('. ')+'.'
        e.insertBefore span, e.firstChild
      ) e, numbers
    el

  slug: slug

  link: (els) ->
    for el in els
      el.id = slug (n.textContent for n in el.childNodes when n.nodeType is el.TEXT_NODE).join('')

  toc: (el) ->
    '<ul>' + (for e in el.querySelectorAll('H1,H2,H3,H4,H5,H6')
      """
      <li><a href="##{e.id}"><#{e.tagName}>
      #{e.innerHTML}
      </#{e.tagName}></a></li>
      """
    ).join('') + '</ul>'
