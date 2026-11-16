// Fixed, read-only DOM observation. The Android Observer embeds this exact function.
export function controllerClientDom() {
  function rect(node) {
    var r = node.getBoundingClientRect();
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
  }
  function visible(node) {
    if (!node || !node.isConnected) return false;
    var bounds = rect(node);
    if (bounds.width <= 0 || bounds.height <= 0) return false;
    for (var parent = node; parent; parent = parent.parentElement) {
      var style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
    }
    return true;
  }
  function clip(node) {
    var box = {left:0,top:0,right:innerWidth,bottom:innerHeight};
    for (var parent = node.parentElement; parent; parent = parent.parentElement) {
      var style = getComputedStyle(parent), bounds = rect(parent);
      if (/^(hidden|clip|auto|scroll)$/.test(style.overflowX)) {
        box.left = Math.max(box.left,bounds.left + parent.clientLeft);
        box.right = Math.min(box.right,bounds.left + parent.clientLeft + parent.clientWidth);
      }
      if (/^(hidden|clip|auto|scroll)$/.test(style.overflowY)) {
        box.top = Math.max(box.top,bounds.top + parent.clientTop);
        box.bottom = Math.min(box.bottom,bounds.top + parent.clientTop + parent.clientHeight);
      }
    }
    return box;
  }
  return {containers:Array.prototype.map.call(document.querySelectorAll('[data-puretv-clients]'),function(container) {
    return {visible:visible(container),hiddenAttribute:container.hidden,rect:rect(container),clip:clip(container),rows:Array.prototype.map.call(container.querySelectorAll('[data-puretv-controller-id]'),function(row) {
      var id = row.querySelector('[data-puretv-controller-id-text]') || row.querySelector('.ptv-client-id'),icon = row.querySelector('svg');
      var ranges = [];
      if (id) {
        var range = document.createRange();range.selectNodeContents(id);
        ranges = Array.prototype.map.call(range.getClientRects(),function(r) { return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; });
      }
      return {controllerId:row.getAttribute('data-puretv-controller-id'),playerId:Number(row.getAttribute('data-player-id')),text:row.textContent,idText:id ? id.textContent : null,visible:visible(row),rect:rect(row),clip:clip(row),idRect:id ? rect(id) : null,idClip:id ? clip(id) : null,idTextRects:ranges,idClientWidth:id ? id.clientWidth : 0,idScrollWidth:id ? id.scrollWidth : 0,idClientHeight:id ? id.clientHeight : 0,idScrollHeight:id ? id.scrollHeight : 0,iconVisible:visible(icon),iconRect:icon ? rect(icon) : null};
    })};
  })};
}
