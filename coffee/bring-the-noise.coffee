noise = require '../lib/noise'

addStyle = (css) ->
  style = document.createElement 'style'
  style.type = 'text/css'
  style.innerHTML = css
  document.getElementsByTagName('head')[0].appendChild style

addStyle ".noise { background-image: url(#{noise 128,128,[0,0,0,0],[0,0,0,0x8]}); }"
