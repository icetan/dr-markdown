{EventEmitter} = require 'events'

base64 = require '../lib/base64'
#lzw = require '../lib/lzw'

pad = (n, p) -> (new Array(p + 1 - n.toString().length)).join('0') + n
rnd = -> Date.now().toString(16) + pad (Math.random()*65536|0).toString(16), 4

toDict = (array, dict={}) -> dict[kvp[0]] = kvp[1] for kvp in array; dict
parseQuery = (s) -> toDict(kvp.split('=') for kvp in s.replace(/^\?/,'').split('&'))

deserialize = ->
  query = parseQuery window.location.search
  type: query.store
  id: query.id
serialize = (data) ->
  history.replaceState {}, null,
    '?store='+data.type+(if data.id then '&id='+data.id else '')

module.exports = state = new EventEmitter

state.storeType = 'base64'
state.storeId = undefined

state.stores =
  #lzw:
  #  store: (data, fn) -> fn base64.encode lzw.encode data
  #  restore: (data, fn) -> fn lzw.decode base64.decode data
  base64:
    store: (id, data, callback) ->
      callback null, base64.encode(JSON.stringify(data or '{}')).replace(/\=+$/, '')
    restore: (id, callback) ->
      callback null, JSON.parse base64.decode(id) or '{}'
  local:
    store: (id, data, callback) ->
      id ?= rnd()
      window.localStorage.setItem 'markdown-'+id, JSON.stringify(data or '{}')
      callback null, id
    restore: (id, callback) ->
      callback null, JSON.parse window.localStorage.getItem('markdown-'+id) or '{}'
  file:
    store: (id, data, callback) ->
      return callback 'Auto save not supported.' if data.meta.autosave
      saveAs new Blob([data.text], type:'text/plain;charset=utf-8'),
        data.meta.title+'.md'
      callback()
    restore: (id, callback) -> callback null, text:'', meta:{}

state.store = (storeType, data, callback) ->
  state.storeType = storeType if storeType
  state.stores[state.storeType].store state.storeId, data, (err, storeId) ->
    return callback? err if err?
    state.storeId = storeId
    serialize type:state.storeType, id:storeId
    callback? null, storeId

state.restore = (storeType, storeId, callback) ->
  if not storeType? and not storeId?
    { type:storeType, id:storeId } = deserialize()
  state.storeType = storeType if storeType
  state.storeId = storeId
  if storeId?
    state.stores[state.storeType].restore state.storeId, (err, data) ->
      callback err, data
  else
    callback()
