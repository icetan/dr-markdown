{EventEmitter} = require 'events'

base64 = require '../lib/base64'
#lzw = require '../lib/lzw'

pad = (n, p) -> (new Array(p + 1 - n.toString().length)).join('0') + n
rnd = -> Date.now().toString(16) + pad (Math.random()*65536|0).toString(16), 4

deserialize = ->
  [type, id] = window.location.hash.substr(1).split '/', 2
  { type, id }
serialize = (data) -> window.location.hash = '#'+data.type+'/'+data.id

module.exports = state = new EventEmitter

state.storeType = 'base64'
state.storeId = ''

state.stores =
  #lzw:
  #  store: (data, fn) -> fn base64.encode lzw.encode data
  #  restore: (data, fn) -> fn lzw.decode base64.decode data
  base64:
    store: (id, data, callback) ->
      callback base64.encode JSON.stringify(data or '{}')
    restore: (id, callback) ->
      callback JSON.parse base64.decode(id) or '{}'
  local:
    store: (id, data, callback) ->
      id ?= rnd()
      window.localStorage.setItem 'markdown-'+id, JSON.stringify(data or '{}')
      callback id
    restore: (id, callback) ->
      callback JSON.parse window.localStorage.getItem('markdown-'+id) or '{}'

state.store = (storeType, data, callback) ->
  state.storeType = storeType if storeType
  state.stores[state.storeType].store state.storeId, data, (storeId) ->
    state.storeId = storeId
    serialize type:state.storeType, id:storeId
    callback? storeId

state.restore = (storeType, storeId, callback) ->
  if not storeType? and not storeId?
    { type:storeType, id:storeId } = deserialize()
  state.storeType = storeType if storeType
  state.storeId = storeId
  if storeId?
    state.stores[state.storeType].restore state.storeId, (data) ->
      callback data

window.addEventListener 'hashchange', ->
  { type:storeType, id:storeId } = deserialize()
  if storeType isnt state.storeType or storeId isnt state.storeId
    state.restore storeType, storeId, (data) ->
      state.emit 'restore', data
