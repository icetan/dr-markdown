(function() {
  var $;
  $ = jQuery;
  $.fn.getCursorPosition = function() {
    var Sel, SelLength, el, pos;
    pos = 0;
    el = $(this).get(0);
    if (document.selection) {
      el.focus();
      Sel = document.selection.createRange();
      SelLength = document.selection.createRange().text.length;
      Sel.moveStart('character', -el.value.length);
      pos = Sel.text.length - SelLength;
    } else if (el.selectionStart || el.selectionStart === 0) {
      pos = el.selectionStart;
    }
    return pos;
  };
  $.fn.number = function() {
    var count, h, i, map, num, order, sel, selector, t, _len, _len2, _ref;
    selector = 'H1,H2,H3,H4,H5,H6,OL,UL,LI';
    order = selector.split(',');
    map = {};
    for (i = 0, _len = order.length; i < _len; i++) {
      sel = order[i];
      map[sel] = {
        c: 0,
        pos: i
      };
    }
    num = function(tag) {
      var c, i, t;
      return ((function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = map[tag].pos; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
          if ((c = map[(t = order[i])].c) !== 0 && (t !== 'OL' && t !== 'UL')) {
            _results.push(c);
          }
        }
        return _results;
      })()).join(',');
    };
    count = function(sel) {
      var e, i, _ref, _ref2, _results;
      e = map[sel];
      e.c++;
      _results = [];
      for (i = _ref = e.pos + 1, _ref2 = order.length; _ref <= _ref2 ? i < _ref2 : i > _ref2; _ref <= _ref2 ? i++ : i--) {
        _results.push(map[order[i]].c = 0);
      }
      return _results;
    };
    _ref = $(selector, this);
    for (i = 0, _len2 = _ref.length; i < _len2; i++) {
      h = _ref[i];
      t = h.tagName;
      count(t);
      if (t !== 'OL' && t !== 'UL') {
        $(h).attr('data-number', num(t));
      }
    }
    return $(this);
  };
  $.fn.index = function() {
    var e, _i, _len, _ref;
    _ref = $('[data-number]', this);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i];
      $(e).prepend("<span class=\"index\">\n" + ($(e).attr('data-number').split(',').join('. ')) + ". \n</span>");
    }
    return $(this);
  };
  $.fn.toc = function() {
    var e;
    return '<ul>' + ((function() {
      var _i, _len, _ref, _results;
      _ref = $('H1,H2,H3,H4,H5,H6', this);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        _results.push("<li><a href=\"#" + e.id + "\"><" + e.tagName + ">\n" + e.innerHTML + "\n</" + e.tagName + "></a></li>");
      }
      return _results;
    }).call(this)).join('') + '</ul>';
  };
}).call(this);
