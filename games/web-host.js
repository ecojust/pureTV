// Shared configuration for the static pages, both standalone and inside pureTV Manager.
(() => {
  'use strict';
  const embedded = window.parent !== window;
  const language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh';
  pureTVPCConfig.info = {
    platform: 'pc', language, qr: '', url: '', addresses: [],
    wifiController: { state: 'unavailable', inputEnabled: true }
  };

  function managerOrigin(origin) {
    return ['tauri://localhost', 'http://tauri.localhost', 'https://tauri.localhost'].includes(origin) ||
      /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(origin);
  }

  let parentOrigin;
  pureTVPCConfig.subscribe = receive => {
    if (!embedded) return () => {};
    function onMessage(event) {
      if (event.source !== parent || !managerOrigin(event.origin)) return;
      const message = event.data;
      if (message?.type !== 'puretv:controller-state' || !Array.isArray(message.state?.players)) return;
      const { players, revision } = message.state;
      if (!Number.isSafeInteger(revision) || players.length > 2 ||
          players.some(player => ![1, 2].includes(player?.id) || !player.buttons)) return;
      parentOrigin = event.origin;
      pureTVPCConfig.info.wifiController.state = 'available';
      receive(message.state);
    }
    addEventListener('message', onMessage);
    // Only a readiness signal is sent before the Manager's origin is known.
    parent.postMessage({ type: 'puretv:game-ready' }, '*');
    return () => removeEventListener('message', onMessage);
  };
  pureTVPCConfig.exit = () => {
    if (embedded) parent.postMessage({ type: 'puretv:game-exit' }, parentOrigin || '*');
    else location.assign(new URL('../../', location.href).href);
  };
})();
