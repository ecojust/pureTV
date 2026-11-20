// Cumulative native counters preserve presses shorter than one animation frame.
// Every seat has its own physical identity and its own release quarantine.
(() => {
  'use strict';
  const {info, alias} = pureTVPCConfig;
  const keys = ['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
  const empty = () => Object.fromEntries(keys.map(k => [k, false]));
  const seats = new Map();
  let revision = -1, foreground = !document.hidden, observed = null;

  function cancel(seat) {
    seat.epoch++;
    seat.pending = empty();
    for (const k of keys) seat.blocked[k] = !!seat.player?.buttons[k];
  }
  function receive(state) {
    for (const next of state.players) {
      const seat = seats.get(next.id) || {pending:empty(), blocked:empty(), counts:{}, epoch:0};
      const prior = seat.player;
      const different = prior?.session !== next.session || prior?.connected !== next.connected || prior?.cancelSeq !== next.cancelSeq;
      if (different) { cancel(seat); seat.blocked = empty(); }
      for (const k of keys) {
        const down = !!next.buttons[k], count = next.buttonCounters?.[k] || 0;
        if (!down) seat.blocked[k] = false;
        if (down && (different || !foreground)) seat.blocked[k] = true;
        if (!different && foreground && !seat.blocked[k] && count > (seat.counts[k] || 0)) seat.pending[k] = true;
      }
      seat.player = next;
      seat.counts = {...next.buttonCounters};
      seats.set(next.id, seat);
    }
    revision = state.revision;
  }
  function snapshot() {
    const players = [];
    for (const seat of seats.values()) {
      const buttons = empty();
      for (const k of keys) buttons[k] = foreground && !seat.blocked[k] && (!!seat.player.buttons[k] || seat.pending[k]);
      seat.pending = empty();
      const legacy = Object.fromEntries(keys.map(k => [k.toLowerCase(),seat.counts[k] || 0]));
      players.push({...seat.player, buttons, inputActive:foreground, cancelSeq:seat.epoch,
        x:Number(buttons.RIGHT) - Number(buttons.LEFT), y:Number(buttons.DOWN) - Number(buttons.UP),
        aimX:0,aimY:0,a:buttons.A || (!!alias && buttons.X),b:buttons.B || (!!alias && buttons.Y),
        start:buttons.START, select:buttons.Y, pulseCounters:legacy});
    }
    return JSON.stringify({revision,inputEnabled:foreground,connections:players.filter(p=>p.connected).length,players});
  }
  const host = Object.freeze({
    snapshot, getInfo: () => JSON.stringify(info),
    publish(text) { if (typeof text === 'string' && text.length < 65536) { try { observed = JSON.parse(text); } catch {} } },
    exit() { window.close(); },
  });
  window.PureGameHost = host;
  if (alias) window[alias] = host;
  window.PureTVPC = Object.freeze({published:() => observed && JSON.parse(JSON.stringify(observed))});
  const stream = new EventSource('/__puretv/events');
  stream.onmessage = event => receive(JSON.parse(event.data));
  stream.onerror = () => receive({revision,players:[...seats.values()].map(({player})=>({...player,connected:false,buttons:empty()}))});
  function focus(active) {
    if (active === foreground) return;
    foreground = active;
    if (!active) seats.forEach(cancel);
    window.PureGame?.focus?.(active);
  }
  addEventListener('blur', () => focus(false));
  addEventListener('focus', () => focus(!document.hidden));
  document.addEventListener('visibilitychange', () => focus(!document.hidden && document.hasFocus()));
})();
