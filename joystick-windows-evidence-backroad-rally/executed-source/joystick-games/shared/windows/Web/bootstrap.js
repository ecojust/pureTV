// Registered after bridge.js at document start. This synchronous, read-only
// host call completes before any game script reads localStorage. Never embed
// a launch-time preferences snapshot in a script reused across navigations.
(() => {
  if (window !== window.top || location.origin !== 'https://puretv.local' || location.pathname !== '/tv.html' || location.hash) return;
  const initial = JSON.parse(window.chrome.webview.hostObjects.sync.puretvBootstrap.snapshot);
  if (!Number.isSafeInteger(initial.documentEpoch) || initial.documentEpoch <= 0) throw new Error('Invalid native document epoch');
  Object.defineProperty(window, '__puretvDocumentEpoch', { value: initial.documentEpoch, writable: false, configurable: false });
  window.JoystickDesktop.receive(initial.info, initial.input);
})();
