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
    var count, elems, h, i, map, n, num, order, reset, sel, selector, t, _i, _len, _len2, _len3, _ref, _ref2;
    selector = 'H1,H2,H3,H4,H5,H6';
    elems = [];
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
    reset = function(clear) {
      var obj, sel, _results;
      if (clear) {
        elems = [];
      }
      _results = [];
      for (sel in map) {
        obj = map[sel];
        _results.push(obj.c = 0);
      }
      return _results;
    };
    _ref = $('[data-number-reset],[data-number-clear],' + selector, this);
    for (i = 0, _len2 = _ref.length; i < _len2; i++) {
      h = _ref[i];
      if (h.hasAttribute('data-number-reset')) {
        reset();
      } else if (h.hasAttribute('data-number-clear')) {
        reset(true);
      } else {
        t = h.tagName;
        count(t);
        if (t !== 'OL' && t !== 'UL') {
          elems.push([h, num(t)]);
        }
      }
    }
    for (_i = 0, _len3 = elems.length; _i < _len3; _i++) {
      _ref2 = elems[_i], h = _ref2[0], n = _ref2[1];
      h.setAttribute('data-number', n);
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
