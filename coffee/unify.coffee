map =
  '<=': '⇐' # '\u21d0'
  '=>': '⇒' # '\u21d2'
  '<=>': '⇔' # '\u21d4'
  '<-': '←' # '\u2190'
  '->': '→' # '\u2192'
  '<->': '↔' # '\u2194'
  '...': '…'
  '--': '–'
  '---': '—'
  '^1': '¹'
  '^2': '²'
  '^3': '³'
  '1/2': '½'
  '1/4': '¼'
  '3/4': '¾'

unify = (cm) ->
  pos = cm.getCursor()
  m = /[^\s]+$/.exec cm.getRange {line:pos.line, ch:0}, pos
  token = m?[0]
  if token? and map[token]?
    cm.replaceRange map[token], {line:pos.line, ch:pos.ch-token.length}, pos

CodeMirror.commands['unify'] = unify
CodeMirror.keyMap.default['Ctrl-Space'] = 'unify'
