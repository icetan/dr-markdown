coffeete = require 'coffeete'

view =
  header: ''
  body: ''

  markdown: (txt) -> markdown.toHTML txt
  trim: (str) -> str.replace new RegExp('^\\s*([^\u0000]*?)\\s*$'), '$1'
  fstLetter: (txt, f) ->
    txt = @trim txt
    f txt.slice(0,1), txt.slice(1)


require('domready') ->
  reader = new FileReader
  reader.onload = (e) ->
    view.body = e.target.result
    $('body')[0].innerHTML = coffeete($('#template')[0].text) view
  $('#file')[0].onchange = -> reader.readAsText @files[0]
