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
