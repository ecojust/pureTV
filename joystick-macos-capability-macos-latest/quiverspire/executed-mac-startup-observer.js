// Diagnostic rebuilt host only: observe startup without changing game input/state.
(() => {
  const records = [];
  const text = value => {
    try {
      if (value instanceof Error) return value.stack || String(value);
      if (typeof value === 'string') return value;
      return JSON.stringify(value) ?? String(value);
    } catch (_) { return String(value); }
  };
  const add = (kind, values) => {
    if (records.length < 100) records.push({kind, time: Date.now(), values: values.map(value => text(value).slice(0, 4096))});
  };
  Object.defineProperty(window, '__pureTVStartupObservation', {value: records, writable: false, configurable: false});
  add('document-start', [document.readyState, location.href, navigator.userAgent]);
  window.addEventListener('error', event => add('error', [event.message, event.filename, event.lineno, event.colno, event.error, event.target?.tagName, event.target?.src, event.target?.href]), true);
  window.addEventListener('unhandledrejection', event => add('unhandledrejection', [event.reason]));
  document.addEventListener('readystatechange', () => add('readystatechange', [document.readyState]));
  for (const name of ['log', 'warn', 'error']) {
    const original = console[name];
    console[name] = function (...args) {
      add('console.' + name, args);
      return Reflect.apply(original, this, args);
    };
  }
})();
