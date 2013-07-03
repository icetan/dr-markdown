xhr = require './xhr.coffee'

{coders} = require './State.coffee'

coders.gist =
  encode: (data, callback) ->
    xhr.json
      method: 'POST'
      url: 'https://api.github.com/gists'
      data:
        description: 'Created with Dr. Markdown'
        public: yes
        files: 'main.md': content: data
    ,(err, data) -> callback data.id
  decode: (data, callback) ->
    xhr.json url:'https://api.github.com/gists/'+data, (err, data) ->
      {files:{'main.md':{raw_url}}} = data
      xhr url:raw_url, (err, data) -> callback data
