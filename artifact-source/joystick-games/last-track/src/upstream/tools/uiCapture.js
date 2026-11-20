// Dev helper (browser console / automation): snapshot the 3D canvas + the DOM UI on top of it into one PNG.
//   const { capture } = await import('/tools/uiCapture.js'); await capture('shop.png');   // POSTs to the dev server's /save/<name> and returns the data URL length
// Serialises the #ui-root subtree into an SVG <foreignObject> with computed styles inlined, then draws it over the canvas frame.
const inline = (src, dst) => {
  if (src.nodeType !== 1) return;
  const cs = getComputedStyle(src);
  for (const p of cs) dst.style.setProperty(p, cs.getPropertyValue(p));
  const sk = [...src.children], dk = [...dst.children];
  sk.forEach((c, i) => {
    if (c.tagName === 'CANVAS') { const img = document.createElement('img'); try { img.src = c.toDataURL(); } catch { /* tainted */ } const cc = getComputedStyle(c); img.style.cssText = `width:${cc.width};height:${cc.height};display:${cc.display};`; dk[i].replaceWith(img); } else inline(c, dk[i]);
  });
};
export async function capture(name, { render = true } = {}) {
  const W = innerWidth, H = innerHeight, game = window.__game && window.__game.game;
  if (render && game && game.host) game.host.render();
  const cv = document.getElementById('game-canvas'), bgUrl = cv.toDataURL('image/png');
  const root = document.getElementById('ui-root'), clone = root.cloneNode(true);
  inline(root, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml'); clone.style.width = W + 'px'; clone.style.height = H + 'px'; clone.style.position = 'relative';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
  const ui = new Image(); ui.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const bg = new Image(); bg.src = bgUrl;
  await Promise.all([ui.decode(), bg.decode()]);
  const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height;
  const g = out.getContext('2d'); g.drawImage(bg, 0, 0, out.width, out.height); g.drawImage(ui, 0, 0, out.width, out.height);
  const url = out.toDataURL('image/png');
  if (name) await fetch('/save/' + name, { method: 'POST', body: url });
  return url.length;
}
