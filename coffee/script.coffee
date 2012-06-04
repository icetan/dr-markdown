markdown = new Showdown.converter()

$(document).ready ->
  updateView = ->
    ta = $('#markdown-input')
    v = $('#view')
    v.html markdown.makeHtml ta.val()
    v.number()

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
