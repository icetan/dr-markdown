xhr = require './xhr.coffee'
state = require './state.coffee'

state.stores.gist =
  store: (info, data, callback) ->
    return callback 'Auto save not supported.' if data.meta.autosave
    xhr.json
      method: 'POST' #if id then 'PATCH' else 'POST'
      url: 'https://api.github.com/gists' #+ if id then '/'+id else ''
      data:
        description: 'Created with Dr. Markdown'
        files:
          'document.md': content: data.text
          'meta.json': content: JSON.stringify data.meta
    ,(err, data) -> callback err, id:data.id
  restore: (info, callback) ->
    return callback() if not info.id?
    xhr.json url:'https://api.github.com/gists/'+info.id, (err, data) ->
      {
        files: {
          'document.md': { content:text },
          'meta.json': { content:meta }
        }
      } = data
      callback err, { text, meta:JSON.parse meta }

#setTimeout (-> auth()), 1000
