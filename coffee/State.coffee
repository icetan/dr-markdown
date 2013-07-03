{EventEmitter} = require 'events'

base64 = require '../lib/base64'
lzw = require '../lib/lzw'

extend = (r={}, d) ->
  r[k] = v for k, v of d
  r
kvpToDict = (d, kvp) -> d[kvp[0]] = (if kvp[1]? then kvp[1] else true)

class Storage
  constructor: ->
    @id ?= new Id
    @version ?= 0

  local:
    save: (data, fn) =>
      @version += 1 if @id of localStorage
      localStorage[@id] = data
      fn @id, @version
    get: (@id, fn) =>
      {data, @version} = localStorage[@id]
      fn data, @version

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
      window.history.replaceState {}, '', @baseUrl+type+'/'+id+'/'+version+
        '#'+generateState()

  has: (type) -> @state[type]? and @state[type] isnt false
  set: (type, val) -> @state[type] = val; @emit 'change', type, val
  toggle: (type) -> @set type, not @has type

State.coders =
  lzw:
    encode: (data, fn) -> fn base64.encode lzw.encode data
    decode: (data, fn) -> fn lzw.decode base64.decode data
  base64:
    encode: (data, fn) -> fn base64.encode data
    decode: (data, fn) -> fn base64.decode data

module.exports = State
