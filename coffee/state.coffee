base64 = require '../lib/base64'
#lzw = require '../lib/lzw'

pad = (n, p) -> (new Array(p + 1 - n.toString().length)).join('0') + n
rnd = -> Date.now().toString(16) + pad (Math.random()*65536|0).toString(16), 4

extend = (r={}, d) -> r[k] = v for k, v of d when v?; r
toDict = (array, dict={}) -> dict[kvp[0]] = kvp[1] for kvp in array; dict
parseQuery = (s) -> toDict(kvp.split('=') for kvp in s.replace(/^\?/,'').split('&'))
buildQuery = (q) ->
  (k+'='+encodeURIComponent(v) for k,v of q when k isnt '_hash').join('&') +
  (if q._hash then '#'+q._hash else '')

deserialize = ->
  extend extend({type:'base64'}, parseQuery(window.location.search)),
    _hash:window.location.hash.substr(1) or undefined

serialize = (info) -> history.replaceState {}, null, '?'+buildQuery(info); info

module.exports = state = {
  store: (data, callback) ->
    info = deserialize()
    state.stores[info.type].store info, data, (err, info_) ->
      return callback? err if err?
      info_ = serialize extend {type:info.type}, info_ or {}
      callback? null, info_

  restore: (callback) ->
    info = deserialize()
    state.stores[info.type].restore info, (err, data) ->
      callback err, data or {}

  stores:
    #lzw:
    #  store: (data, fn) -> fn base64.encode lzw.encode data
    #  restore: (data, fn) -> fn lzw.decode base64.decode data
    base64:
      store: (info, data, callback) ->
        callback null,
          _hash: base64.encode(JSON.stringify(data or '{}')).replace(/\=+$/, '')
      restore: (info, callback) ->
        callback null, JSON.parse base64.decode(info._hash or '') or '{}'
    local:
      store: (info, data, callback) ->
        info.id ?= rnd()
        window.localStorage.setItem 'markdown-'+info.id, JSON.stringify(data or '{}')
        callback null, info
      restore: (info, callback) ->
        callback null, JSON.parse window.localStorage.getItem('markdown-'+info.id) or '{}'
    file:
      store: (info, data, callback) ->
        return callback 'Auto save not supported.' if data.meta.autosave
        saveAs new Blob([data.text], type:'text/plain;charset=utf-8'),
          data.meta.title+'.md'
        callback()
      restore: (info, callback) -> callback()

  deserialize, serialize
}
