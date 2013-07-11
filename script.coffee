toDict = (kvps, d={}) -> d[k] = (if v? then v else true) for [k,v] in kvps; d

parseState = (str) ->
  toDict(kvp.split '=' for kvp in str.split ',' when kvp isnt '')

parseHash = (hash) ->
  hash = hash.substring 1 if hash.charAt(0) is '#'
  return '' if not hash
  pos =  hash.indexOf ';'
  if pos is -1 # state only
    state = hash
  else # state and data
    state = hash.substring 0, pos
    typeText64 = hash.substring pos+1
  if typeText64?
    [type, text64] = typeText64.split ';', 2
    text = base64.decode text64
  { toc, index, full, fullinput, theme } = parseState state
  data =
    text:text or ''
    meta: mode: if full then 'read' else if fullinput then 'write' else ''
  data.meta.toc = toc if toc?
  data.meta.index = index if index?
  data.meta.theme = theme if theme?
  '#base64/'+base64.encode JSON.stringify data

window.location.href = 'v1/'+parseHash(window.location.hash)
