kvpToDict = (d, kvp) -> d[kvp[0]] = (if kvp[1]? then kvp[1] else true)

class State
  constructor: ->
    @state
    @dataParsers = {
      lzw:
        encode: (data, fn) -> fn base64.encode lzw_encode data
        decode: (data, fn) -> fn lzw_decode base64.decode data
    }

  parseState: (str) ->
    map = {}
    kvpToDict map, kvp.split '=' for kvp in str.split ','
    map

  parseData: (str, fn) ->
    [type, data] = str.split ':'
    @dataParsers[type].decode data, fn

  parseHash: (hash, fn) ->
    hash = hash.substring 1 if hash.charAt 0 is '#'
    pos =  hash.indexOf ';'
    if pos is -1 # state only
      state = hash
    else # state and data
      state = hash.substring 0, pos
      data = hash.substring pos+1
    map = @parseState state
    if data
      @parseData data, (data) -> fn map, data
    else
      fn map

  generateHash: (map, type, data, fn) ->
    state = for k, v of map when v isnt false
      if not v? or v is true then k else k+'='+v
    if type and data
      @dataParsers[type].encode data, (data) ->
        fn "##{state.join ','};#{type}:#{data}"
    else
      fn "##{state.join ','}"

  has: (type) -> @state[type]? and state[type] isnt false
  set: (type, val) -> @state[type] = val; @emit 'change', type, val
  toggle: (type) -> @set type, not @has type
