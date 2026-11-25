// Offline Simplified Chinese for ports whose upstream UI draws its own text.
(() => {
  const ignored = 'script,style,noscript,template,textarea,[contenteditable="true"],[translate="no"]';
  const attributes = ['title', 'placeholder', 'aria-label', 'alt'];
  let translate = text => text;
  let installed = false;

  function install({ strings, patterns = [] }) {
    if (installed) return;
    installed = true;

    function lookup(text) {
      if (Object.prototype.hasOwnProperty.call(strings, text)) return strings[text];
      const normalized = text.replace(/\s+/g, ' ');
      if (Object.prototype.hasOwnProperty.call(strings, normalized)) return strings[normalized];
      for (const [pattern, replacement] of patterns) {
        if (pattern.test(text)) return text.replace(pattern, replacement);
      }
      return text;
    }
    translate = value => {
      if (typeof value !== 'string') return value;
      const text = value.trim();
      if (!text) return value;
      let result = lookup(text);
      if (result === text && text.includes('\n')) {
        result = text.split('\n').map(line => translate(line)).join('\n');
      }
      return result === text ? value : value.replace(text, () => result);
    };

    // Canvas games often use measureText to wrap the same labels they draw.
    const proto = globalThis.CanvasRenderingContext2D?.prototype;
    if (proto) {
      for (const method of ['fillText', 'strokeText', 'measureText']) {
        const original = proto[method];
        proto[method] = function (value, ...args) {
          return original.call(this, translate(value), ...args);
        };
      }
    }

    // The observer also receives our writes. A translated label can still match
    // a dynamic pattern (for example numbers and unit abbreviations).
    const lastText = new WeakMap();
    const lastAttributes = new WeakMap();

    function textNode(node) {
      if (lastText.get(node) === node.data) return;
      const parent = node.parentElement;
      if (!parent || parent.closest(ignored)) return;
      const result = translate(node.data);
      if (result === node.data) return;
      // With no value attribute an option uses its label as the submitted value.
      if (parent.tagName === 'OPTION' && !parent.hasAttribute('value')) parent.setAttribute('value', parent.value);
      lastText.set(node, result);
      node.data = result;
    }

    function attribute(el, name) {
      const old = el.getAttribute(name);
      const written = lastAttributes.get(el);
      if (!old || written?.get(name) === old) return;
      const next = translate(old);
      if (old !== next) {
        const values = written || new Map();
        values.set(name, next);
        if (!written) lastAttributes.set(el, values);
        el.setAttribute(name, next);
      }
    }

    function visit(node) {
      if (node.nodeType === Node.TEXT_NODE) return textNode(node);
      if (node.nodeType !== Node.ELEMENT_NODE || node.closest(ignored)) return;
      for (const name of attributes) attribute(node, name);
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(child) {
          return child.nodeType === Node.ELEMENT_NODE && child.matches(ignored)
            ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        },
      });
      while (walker.nextNode()) {
        const child = walker.currentNode;
        if (child.nodeType === Node.TEXT_NODE) textNode(child);
        else for (const name of attributes) attribute(child, name);
      }
    }

    document.documentElement.lang = 'zh-CN';
    visit(document.documentElement);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') textNode(record.target);
        else if (record.type === 'attributes') {
          if (!record.target.closest(ignored)) attribute(record.target, record.attributeName);
        } else for (const node of record.addedNodes) visit(node);
      }
    }).observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes,
    });
  }
  globalThis.PureTVChinese = { install, translate: text => translate(text) };
})();
