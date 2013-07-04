{EventEmitter} = require 'events'

base64 = require '../lib/base64'
lzw = require '../lib/lzw'

extend = (r={}, d) ->
  r[k] = v for k, v of d
  r
kvpToDict = (d, kvp) -> d[kvp[0]] = (if kvp[1]? then kvp[1] else true)

class State extends EventEmitter
  constructor: ->
    super()
    @state =
      toc: false
      index: false
    @start()

  encodeData: (type, data, fn) ->
    State.coders[type].encode data, (data) -> fn type+';'+data

  decodeData: (data, fn) ->
    [type, data] = data.split ';', 2
    State.coders[type].decode data, fn

  start: ->
    {protocol, host, pathname} = window.location
    @baseUrl = protocol+'//'+host+pathname

  parseState: (str) ->
    kvpToDict @state, kvp.split '=' for kvp in str.split ',' when kvp isnt ''

  generateState: ->
    (for k, v of @state when v? and v isnt false
      if v is true then k else k+'='+v).join ','

  _get: (type, id, fn) -> @storage[type].get id, fn

  _save: (type, data, fn) -> @storage[type].save data, fn

  parseHash: (hash, fn) ->
    hash = hash.substring 1 if hash.charAt 0 is '#'
    pos =  hash.indexOf ';'
    if pos is -1 # state only
      state = hash
    else # state and data
      state = hash.substring 0, pos
      data = hash.substring pos+1
    @parseState state
    if data?
      @decodeData data, (data) -> fn data
    else
      fn()

  generateHash: (type, data, fn) ->
    if type? and data?
      @encodeData type, data, (str) =>
        fn '#'+@generateState()+';'+str
    else
      fn '#'+@generateState()

  replace: ->
    @_save type, data, (id, version) ->
      window.history.replaceState {}, '', type+'/'+id

  has: (type) -> @state[type]? and @state[type] isnt false
  set: (type, val) -> @state[type] = val; @emit 'change', type, val
  toggle: (type) -> @set type, not @has type

deserialize = ->
  [type, id] = window.location.hash.substr(1).split '/', 2
  { type, id }
serialize = (data) -> window.location.hash = '#'+data.type+'/'+data.id

state = new EventEmitter

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

state.store = (storeType, data, callback) ->
  state.storeType = storeType if storeType
  state.stores[state.storeType].store state.storeId, data, (storeId)->
    state.storeId = storeId
    serialize type:state.storeType, id:storeId
    #window.history.replaceState {}, '', type+'/'+id
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

#window.addEventListener 'popstate', ->
#  state.fromLocation window.location.pathname

module.exports = { State, state }
