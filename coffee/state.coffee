{EventEmitter} = require 'events'

base64 = require '../lib/base64'
#lzw = require '../lib/lzw'

rnd = -> Date.now() + '-' +
  ('0123456789abcdef'[Math.random() * 16 | 0] for x in [0..10]).join ''

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
  localStorage:
    store: (id, data, callback) ->
      id ?= rnd()
      window.localStorage.setItem id, JSON.stringify(data or '{}')
      callback id
    restore: (id, callback) ->
      callback JSON.parse window.localStorage.getItem id

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
      store.emit 'restore', data
