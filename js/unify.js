(function() {
  var map, unify;
  map = {
    '<=': '⇐',
    '=>': '⇒',
    '<=>': '⇔',
    '<-': '←',
    '->': '→',
    '<->': '↔'
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
