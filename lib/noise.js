var BYTE4 = 4294967296;

module.exports = function(w, h, min, span) {
  var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d'),
      i, j, imageData, rnd;

  if (!(min instanceof Array)) min = [min, min, min, 0xFF];
  else for (;min.length < 4; min.push(min.length === 3 ? 0xFF : min[min.length-1]));
  if (!(span instanceof Array)) span = [span, span, span, 0xFF];
  else for (;span.length < 4; span.push(span.length === 3 ? 0xFF : span[span.length-1]));

  canvas.width = w;
  canvas.height = h;

  imageData = ctx.createImageData(canvas.width, canvas.height);
  for (i = imageData.data.length; (i-=4) >= 0;) {
    rnd = Math.random() * BYTE4;
    for (j = 0; j < 4; j++)
      imageData.data[i + j] = span[j]
        ? ((((rnd>>j*8)&0xFF)/0xFF * span[j]) | 0) + min[j]
        : min[j];
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};
