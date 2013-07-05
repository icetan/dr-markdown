xhr = (opt, callback) ->
  method = opt.method or 'GET'
  r = new XMLHttpRequest
  if 'withCredentials' of r
    r.open method, opt.url, true
  else if XDomainRequest?
    r = new XDomainRequest
    r.open method, opt.url
  else
    return null
  r.onreadystatechange = ->
    if r.readyState is 4
      if r.status >= 200 and r.status < 300
        callback undefined, r.responseText, r
      else
        callback r.statusText, r.responseText, r
  r.setRequestHeader(header, value) for header, value of opt.headers
  r.send opt.data
  r

xhr.json = (opt, callback) ->
  callback_ = (err, json, xhr) ->
    if err? or not json then return callback err, undefined, xhr
    try
      data = JSON.parse json
    catch err_
      err = err_
    callback err, data, xhr
  opt.data = JSON.stringify opt.data
  opt.headers = 'Content-Type': 'application/json'
  xhr opt, callback_

module.exports = xhr
