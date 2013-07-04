xhr = require './xhr.coffee'

extend = (r={}, d) -> r[k] = v for k, v of d; r
toDict = (array, dict={}) -> dict[kvp[0]] = kvp[1] for kvp in array; dict
parseQuery = (s) -> toDict(kvp.split('=') for kvp in s.replace(/^\?/,'').split('&'))

{state} = require './State.coffee'

clientId = '04c4de3332664d704642'
clientSecret = 'c8d6ab58bbf8095c82c0f11e57db92bf2b9f76be'
redirect = window.location.href

auth = ->
  query = parseQuery window.location.search
  if query.code
    xOrigState = window.localStorage.getItem 'x-orig-state'
    window.localStorage.removeItem 'x-orig-state'
    if xOrigState isnt query.state
      return console.error 'cross origin state has been tampered with.'
    xhr
      method: 'POST'
      url: 'https://github.com/login/oauth/access_token'
      data:
        client_id: clientId
        client_secret: clientSecret
        code: query.code
    ,(err, data) ->
      console.log data
  else if query.error

  else
    rnd = ('0123456789abcdef'[Math.random() * 16 | 0] for x in [0..10]).join ''
    window.localStorage.setItem 'x-orig-state', rnd
    #iframeEl = document.createElement 'iframe'
    #extend iframeEl.style,
    #  position: 'absolute'
    #  width: '600px'
    #  height: '400px'
    #  top: 0
    #  left: 0
    #  zIndex: 99999
    window.open "https://github.com/login/oauth/authorize?client_id=#{clientId}&scope=gist&state=#{rnd}&redirect_uri=#{redirect}"
    #document.body.appendChild iframeEl

state.stores.gist =
  store: (id, data, callback) ->
    xhr.json
      method: if id then 'PATCH' else 'POST'
      url: 'https://api.github.com/gists' + if id then '/'+id else ''
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
          'main.md': { raw_url:textUrl },
          'state.json': { raw_url:stateUrl }
        }
      } = data
      xhr.json url:stateUrl, (err, state) ->
        xhr url:textUrl, (err, text) ->
          callback { text, state }

setTimeout (-> auth()), 1000
