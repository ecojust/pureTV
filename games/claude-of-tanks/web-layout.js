// The game checks localStorage while creating the match roster. A cross-site
// Manager frame may have no storage access, even for reading the property.
(() => {
  if (window.parent === window) return;
  try {
    void window.localStorage.length;
    return;
  } catch (error) {
    if (error.name !== 'SecurityError') return;
  }

  const items = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    enumerable: true,
    value: {
      get length() { return items.size; },
      key(index) { return [...items.keys()][Number(index) >>> 0] ?? null; },
      getItem(key) { return items.get(String(key)) ?? null; },
      setItem(key, value) { items.set(String(key), String(value)); },
      removeItem(key) { items.delete(String(key)); },
      clear() { items.clear(); },
    },
  });
})();

// The renderer creates its recovery card from the canvas's context-loss event.
(() => {
  const copy = new Map([
    ['CLAUDE OF TANKS', '克劳德坦克'],
    ['Restoring graphics', '正在恢复游戏画面'],
    ['Graphics device was reset', '图形设备已重置'],
    ['The browser briefly reclaimed graphics memory. The battle is paused while the renderer restores at a safer mobile quality.',
      '浏览器暂时回收了图形内存。对局已暂停，游戏正在以较低画质恢复画面。'],
    ['The browser reclaimed the game’s graphics memory (this can happen on phones and tablets under memory pressure). Reload to jump back in — your garage and progress are saved.',
      '浏览器已回收游戏使用的图形内存。重新加载即可返回车库。'],
    ['Reload now', '重新加载'],
    ['Reload', '重新加载'],
  ]);

  function bindRecoveryCard(canvas) {
    let panel;
    function translate() {
      const card = panel?.firstElementChild;
      if (!card?.querySelector(':scope > #cot-ctxlost-btn')) return;
      for (const element of card.children) {
        const translated = copy.get(element.textContent.trim().replace(/\s+/g, ' '));
        if (translated) element.textContent = translated;
      }
    }
    const updates = new MutationObserver(translate);
    function attach() {
      updates.disconnect();
      panel = document.getElementById('cot-ctxlost');
      if (!panel) return;
      translate();
      updates.observe(panel, {subtree: true, childList: true, characterData: true});
    }
    canvas.addEventListener('webglcontextlost', () => setTimeout(attach, 0));
    canvas.addEventListener('webglcontextrestored', () => {
      updates.disconnect();
      panel = null;
    });
    attach();
  }

  function findCanvas() {
    const app = document.getElementById('app');
    if (!app) return;
    const canvas = app.querySelector(':scope > canvas');
    if (canvas) {
      bindRecoveryCard(canvas);
      return;
    }
    const children = new MutationObserver(() => {
      const canvas = app.querySelector(':scope > canvas');
      if (!canvas) return;
      children.disconnect();
      bindRecoveryCard(canvas);
    });
    children.observe(app, {childList: true});
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', findCanvas, {once: true});
  } else {
    findCanvas();
  }
})();
