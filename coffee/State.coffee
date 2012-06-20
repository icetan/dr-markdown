kvpToDict = (d, kvp) -> d[kvp[0]] = (if kvp[1]? then kvp[1] else true)

class @State extends EventEmitter
  constructor: ->
    super()
    @state =
      toc: false
      index: false
    @dataParsers =
      lzw:
        encode: (data, fn) -> fn base64.encode lzw_encode data
        decode: (data, fn) -> fn lzw_decode base64.decode data
      base64:
        encode: (data, fn) -> fn base64.encode data
        decode: (data, fn) -> fn base64.decode data

  parseState: (str) ->
    kvpToDict @state, kvp.split '=' for kvp in str.split ',' when kvp isnt ''

  generateState: ->
    (for k, v of @state when v? and v isnt false
      if v is true then k else k+'='+v).join ','

  decodeData: (str, fn) ->
    [type, data] = str.split ':'
    @dataParsers[type].decode data, fn

  encodeData: (type, data, fn) ->
    @dataParsers[type].encode data, (data) ->
      fn type+':'+data

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

  has: (type) -> @state[type]? and @state[type] isnt false
  set: (type, val) -> @state[type] = val; @emit 'change', type, val
  toggle: (type) -> @set type, not @has type
