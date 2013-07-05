xhr = require './xhr.coffee'
state = require './state.coffee'

#extend = (r={}, d) -> r[k] = v for k, v of d; r
#toDict = (array, dict={}) -> dict[kvp[0]] = kvp[1] for kvp in array; dict
#parseQuery = (s) -> toDict(kvp.split('=') for kvp in s.replace(/^\?/,'').split('&'))
#
#clientId = '04c4de3332664d704642'
#redirect = window.location.href
#auth = ->
#  query = parseQuery window.location.search
#  if query.code
#    xOrigState = window.localStorage.getItem 'x-orig-state'
#    window.localStorage.removeItem 'x-orig-state'
#    if xOrigState isnt query.state
#      return console.error 'cross origin state has been tampered with.'
#    xhr
#      method: 'POST'
#      url: 'https://github.com/login/oauth/access_token'
#      data:
#        client_id: clientId
#        client_secret: clientSecret
#        code: query.code
#    ,(err, data) ->
#      console.log data
#  else if query.error
#
#  else
#    rnd = ('0123456789abcdef'[Math.random() * 16 | 0] for x in [0..10]).join ''
#    window.localStorage.setItem 'x-orig-state', rnd
#    window.open "https://github.com/login/oauth/authorize?client_id=#{clientId}&scope=gist&state=#{rnd}&redirect_uri=#{redirect}"

state.stores.gist =
  store: (id, data, callback) ->
    xhr.json
      method: 'POST' #if id then 'PATCH' else 'POST'
      url: 'https://api.github.com/gists' #+ if id then '/'+id else ''
      data:
        description: 'Created with Dr. Markdown'
        files:
          'main.md': content: data.text
          'state.json': content: JSON.stringify data.state
    ,(err, data) -> callback data.id
  restore: (id, callback) ->
    xhr.json url:'https://api.github.com/gists/'+id, (err, data) ->
      {
        files: {
          'main.md': { content:text },
          'state.json': { content:state }
        }
      } = data
      callback { text, state:JSON.parse state }

#setTimeout (-> auth()), 1000
