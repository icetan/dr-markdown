(function() {
  var kvpToDict;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  kvpToDict = function(d, kvp) {
    return d[kvp[0]] = (kvp[1] != null ? kvp[1] : true);
  };
  this.State = (function() {
    __extends(State, EventEmitter);
    function State() {
      State.__super__.constructor.call(this);
      this.state = {
        toc: false,
        index: false
      };
      this.dataParsers = {
        lzw: {
          encode: function(data, fn) {
            return fn(base64.encode(lzw_encode(data)));
          },
          decode: function(data, fn) {
            return fn(lzw_decode(base64.decode(data)));
          }
        },
        base64: {
          encode: function(data, fn) {
            return fn(base64.encode(data));
          },
          decode: function(data, fn) {
            return fn(base64.decode(data));
          }
        }
      };
    }
    State.prototype.parseState = function(str) {
      var kvp, _i, _len, _ref, _results;
      _ref = str.split(',');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        kvp = _ref[_i];
        if (kvp !== '') {
          _results.push(kvpToDict(this.state, kvp.split('=')));
        }
      }
      return _results;
    };
    State.prototype.generateState = function() {
      var k, v;
      return ((function() {
        var _ref, _results;
        _ref = this.state;
        _results = [];
        for (k in _ref) {
          v = _ref[k];
          if ((v != null) && v !== false) {
            _results.push(v === true ? k : k + '=' + v);
          }
        }
        return _results;
      }).call(this)).join(',');
    };
    State.prototype.decodeData = function(str, fn) {
      var data, type, _ref;
      _ref = str.split(':'), type = _ref[0], data = _ref[1];
      return this.dataParsers[type].decode(data, fn);
    };
    State.prototype.encodeData = function(type, data, fn) {
      return this.dataParsers[type].encode(data, function(data) {
        return fn(type + ':' + data);
      });
    };
    State.prototype.parseHash = function(hash, fn) {
      var data, pos, state;
      if (hash.charAt(0 === '#')) {
        hash = hash.substring(1);
      }
      pos = hash.indexOf(';');
      if (pos === -1) {
        state = hash;
      } else {
        state = hash.substring(0, pos);
        data = hash.substring(pos + 1);
      }
      this.parseState(state);
      if (data != null) {
        return this.decodeData(data, function(data) {
          return fn(data);
        });
      } else {
        return fn();
      }
    };
    State.prototype.generateHash = function(type, data, fn) {
      if ((type != null) && (data != null)) {
        return this.encodeData(type, data, __bind(function(str) {
          return fn('#' + this.generateState() + ';' + str);
        }, this));
      } else {
        return fn('#' + this.generateState());
      }
    };
    State.prototype.has = function(type) {
      return (this.state[type] != null) && this.state[type] !== false;
    };
    State.prototype.set = function(type, val) {
      this.state[type] = val;
      return this.emit('change', type, val);
    };
    State.prototype.toggle = function(type) {
      return this.set(type, !this.has(type));
    };
    return State;
  })();
}).call(this);
