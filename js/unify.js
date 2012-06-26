(function() {
  var map, unify;
  map = {
    '<=': '⇐',
    '=>': '⇒',
    '<=>': '⇔',
    '<-': '←',
    '->': '→',
    '<->': '↔',
    '...': '…',
    '--': '–',
    '---': '—',
    '^1': '¹',
    '^2': '²',
    '^3': '³',
    '1/2': '½',
    '1/4': '¼',
    '3/4': '¾'
  };
  unify = function(cm) {
    var m, pos, token;
    pos = cm.getCursor();
    m = /[^\s]+$/.exec(cm.getRange({
      line: pos.line,
      ch: 0
    }, pos));
    token = m != null ? m[0] : void 0;
    if ((token != null) && (map[token] != null)) {
      return cm.replaceRange(map[token], {
        line: pos.line,
        ch: pos.ch - token.length
      }, pos);
    }
  };
  CodeMirror.commands['unify'] = unify;
  CodeMirror.keyMap["default"]['Ctrl-Space'] = 'unify';
}).call(this);
