markdown = new Showdown.converter()

$(document).ready ->
  addToc = ->
    v = $('#view')
    v.number()
    $('#toc').html v.generateToc()

  updateView = ->
    hasToc = $('#toc').text().trim() isnt ''
    ta = $('#markdown-input')
    v = $('#view')
    v.html markdown.makeHtml ta.val()
    addToc() if hasToc

  reader = new FileReader
  reader.onload = (e) ->
    $('#markdown-input').val e.target.result
    updateView()

  $('#addToc').click addToc
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
