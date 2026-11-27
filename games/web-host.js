// Shared configuration for the static pages, both standalone and inside pureTV Manager.
(() => {
  'use strict';
  document.documentElement.dataset.puretvGame = location.pathname.split('/').slice(-2)[0];
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '../web-host.css';
  document.head.appendChild(style);

  const embedded = window.parent !== window;
  const language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh';
  // The Manager already displays host status outside its game frame.
  if (!embedded) {
    document.addEventListener('DOMContentLoaded', () => {
      const notice = document.createElement('div');
      notice.id = 'puretv-web-notice';
      notice.setAttribute('role', 'status');
      notice.lang = language;
      notice.textContent = language === 'en' ? 'Play with your keyboard.' : '可使用键盘游玩。';
      document.body.appendChild(notice);
      setTimeout(() => notice.remove(), 3500);
    }, {once: true});
  }
  pureTVPCConfig.info = {
    platform: 'pc', language, qr: '', url: '', addresses: [],
    wifiController: { state: 'unavailable', inputEnabled: true }
  };

  // These games reuse the pairing cards for the score and lives once a player joins.
  const game = document.documentElement.dataset.puretvGame;
  if (['tank', 'super-mario', 'jackal', 'tetris', 'jewel'].includes(game)) {
    document.documentElement.setAttribute('data-player-scorecards', '');
    pureTVPCConfig.onPublish = state => {
      const players = Array.isArray(state?.players) ? state.players : [];
      for (const id of [1, 2]) {
        const joined = players.some(player => player?.id === id && player.joined);
        document.getElementById('player-' + id)?.toggleAttribute('data-game-player', joined);
      }
    };
  }

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
