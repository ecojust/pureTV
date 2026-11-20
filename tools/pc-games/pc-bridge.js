// Keep the native synchronous API while receiving independent controller sessions from the PC.
(() => {
  'use strict';
  const { info, alias, gameKit } = pureTVPCConfig;
  const keys = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y'];
  const neutral = () => Object.fromEntries(keys.map(key => [key, false]));
  const seats = new Map();
  let revision = -1;
  let foreground = !document.hidden;
  let published = null;
  let stream;

  function cancel(seat) {
    seat.epoch++;
    seat.pending = neutral();
    for (const key of keys) seat.blocked[key] = !!seat.player?.buttons[key];
  }

  function receive(state) {
    for (const next of state.players) {
      const seat = seats.get(next.id) || {
        pending: neutral(), blocked: neutral(), counts: {}, epoch: 0
      };
      const prior = seat.player;
      const changed = prior?.session !== next.session || prior?.connected !== next.connected ||
        prior?.cancelSeq !== next.cancelSeq;
      const baseline = revision < 0 || (changed && !!prior);
      if (changed) {
        cancel(seat);
        seat.blocked = neutral();
      }
      for (const key of keys) {
        const down = !!next.buttons[key];
        const count = next.buttonCounters?.[key] || 0;
        if (!down) seat.blocked[key] = false;
        if (down && (baseline || !foreground)) seat.blocked[key] = true;
        if (!baseline && foreground && !seat.blocked[key] && count > (seat.counts[key] || 0)) {
          seat.pending[key] = true;
        }
      }
      seat.player = next;
      seat.counts = { ...next.buttonCounters };
      seats.set(next.id, seat);
    }
    const present = new Set(state.players.map(player => player.id));
    for (const [id, seat] of seats) {
      if (!present.has(id) && seat.player.connected) {
        cancel(seat);
        seat.player = { ...seat.player, connected: false, buttons: neutral() };
      }
    }
    revision = state.revision;
    info.wifiController.connected = state.players.some(player => player.connected);
  }

  function snapshot() {
    const players = [];
    for (const seat of seats.values()) {
      const buttons = neutral();
      for (const key of keys) {
        buttons[key] = foreground && !seat.blocked[key] &&
          (!!seat.player.buttons[key] || seat.pending[key]);
      }
      seat.pending = neutral();
      players.push({
        ...seat.player, buttons, inputActive: foreground, cancelSeq: seat.epoch,
        x: Number(buttons.RIGHT) - Number(buttons.LEFT),
        y: Number(buttons.DOWN) - Number(buttons.UP),
        aimX: 0, aimY: 0,
        a: buttons.A || ((!!alias || gameKit) && buttons.X),
        b: buttons.B || (gameKit && buttons.Y),
        start: buttons.START, select: !gameKit && buttons.Y,
      });
    }
    return JSON.stringify({
      revision, inputEnabled: foreground, connections: players.filter(player => player.connected).length,
      players,
    });
  }

  const host = Object.freeze({
    snapshot,
    getInfo: () => JSON.stringify(info),
    publish(text) {
      if (typeof text !== 'string' || text.length > 65536) return;
      try { published = JSON.parse(text); } catch {}
    },
    exit() { window.close(); },
  });
  window.PureGameHost = host;
  if (alias) window[alias] = host;
  window.PureTVPC = Object.freeze({
    published: () => published && JSON.parse(JSON.stringify(published))
  });

  function openStream() {
    if (stream) return;
    stream = new EventSource('/__puretv/events');
    stream.onmessage = event => receive(JSON.parse(event.data));
    stream.onerror = () => receive({
      revision,
      players: [...seats.values()].map(({ player }) => ({ ...player, connected: false, buttons: neutral() })),
    });
  }

  function focus(active) {
    if (active === foreground) return;
    foreground = active;
    info.wifiController.inputActive = foreground;
    if (!active) seats.forEach(cancel);
    window.PureGame?.focus?.(active);
  }

  info.wifiController.connected = false;
  info.wifiController.inputActive = foreground;
  openStream();
  addEventListener('pagehide', () => {
    stream?.close();
    stream = null;
    focus(false);
  });
  addEventListener('pageshow', () => {
    openStream();
    focus(!document.hidden && document.hasFocus());
  });
  addEventListener('blur', () => focus(false));
  addEventListener('focus', () => focus(!document.hidden));
  document.addEventListener('visibilitychange', () => focus(!document.hidden && document.hasFocus()));
})();
