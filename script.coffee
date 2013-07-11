deserializeV1 = ->
  hash = window.location.hash.substr 1
  pos = hash.indexOf '/'
  type: if pos is -1 then hash else hash.substr 0, pos
  id: if pos is -1 then undefined else hash.substr pos+1

serializeV2 = (data) ->
  window.location.href = '../v2/' +
    (if data.type
      '?type=' + data.type +
      (if data.id
        (if data.type is 'base64' then '#' else '&id=') + data.id
      else '')
    else '')

serializeV2 deserializeV1()
