/* WKWebView cache bridge. Native TCP input remains outside the Web page. */
(function (root) {
  'use strict';
  const actions = ['a', 'b', 'start', 'left', 'right', 'up', 'down'];
  let info = { platform: 'macos', language: /^en\b/i.test(root.navigator?.language || '') ? 'en' : 'zh', wifiController: { state: 'starting' } };
  let player = null, identity = null, lastRevision = -1, initialized = false, everConnected = false;
  let counters = {}, pending = {}, blocked = {}, suspendedRevision = -1, preferencesSeeded = false;
  const preferenceKeys = new Set(['puretv.neon-rush.best', 'neon-rush.language']);
  const originalSetItem = root.Storage?.prototype?.setItem;
  function validPreference(key, value) {
    return key === 'neon-rush.language' ? ['zh', 'en'].includes(value) : key === 'puretv.neon-rush.best' && /^\d{1,9}$/.test(value);
  }
  if (originalSetItem) root.Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === root.localStorage && preferenceKeys.has(String(key)) && validPreference(String(key), String(value))) send({ type: 'preference', key: String(key), value: String(value) });
  };
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const axis = value => Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  function send(message) {
    try { root.webkit?.messageHandlers?.neonHost?.postMessage(message); } catch (_) {}
  }
  function receive(nextInfo, snapshot) {
    if (!snapshot || !integer(snapshot.revision) || snapshot.revision < lastRevision) return false;
    if (nextInfo && typeof nextInfo === 'object') {
      info = JSON.parse(JSON.stringify(nextInfo));
      info.platform = 'macos';
      if (!preferencesSeeded) {
        preferencesSeeded = true;
        for (const key of preferenceKeys) {
          const value = info.preferences?.[key];
          if (typeof value === 'string' && validPreference(key, value)) {
            try { originalSetItem?.call(root.localStorage, key, value); } catch (_) {}
          }
        }
      }
      try { root.PureGame?.roomInfo(info); } catch (_) {}
    }
    // Discovery can become available without input changes after foregrounding.
    // Accept its info while keeping queued input suspended.
    if (snapshot.revision <= suspendedRevision) return false;
    // Repeated native delivery must not create or consume a button pulse.
    if (snapshot.revision === lastRevision) return true;
    const next = Array.isArray(snapshot.players) ? snapshot.players.find(p => p && p.connected === true) : null;
    if (!next) {
      player = null; identity = null; counters = {}; pending = {}; blocked = {};
    } else {
      const nextIdentity = JSON.stringify([next.controllerId, next.session]);
      const replacement = identity !== nextIdentity;
      const cancelled = !replacement && player && next.cancelSeq !== player.cancelSeq;
      const baseline = !initialized || cancelled || (replacement && everConnected);
      const nextCounters = {};
      for (const key of ['a', 'b', 'start']) {
        if (baseline) blocked[key] = next[key] === true;
        else if (next[key] !== true) blocked[key] = false;
      }
      for (const key of actions) {
        const value = next.pulseCounters?.[key];
        nextCounters[key] = integer(value) ? value : 0;
        pending[key] = baseline || blocked[key] ? false : !!pending[key] || nextCounters[key] > (replacement ? 0 : counters[key] || 0);
      }
      counters = nextCounters;
      identity = nextIdentity;
      everConnected = true;
      player = {
        id: 1, connected: true, transport: 'wifi', controllerId: String(next.controllerId || ''),
        session: next.session, cancelSeq: integer(next.cancelSeq) ? next.cancelSeq : 0,
        x: axis(next.x), y: axis(next.y), a: next.a === true && !blocked.a, b: next.b === true && !blocked.b,
        start: next.start === true && !blocked.start, select: false
      };
    }
    lastRevision = snapshot.revision;
    initialized = true;
    return true;
  }
  function snapshot() {
    if (!player) return JSON.stringify({ players: [], connections: 0 });
    const sample = { ...player };
    for (const key of ['a', 'b', 'start']) sample[key] = sample[key] || !!pending[key];
    if (!sample.x) sample.x = Number(!!pending.right) - Number(!!pending.left);
    if (!sample.y) sample.y = Number(!!pending.down) - Number(!!pending.up);
    pending = {};
    return JSON.stringify({ players: [sample], connections: 1 });
  }
  function suspend() {
    player = null; identity = null; counters = {}; pending = {}; blocked = {};
    suspendedRevision = lastRevision;
    try { root.PureGame?.suspend(true); } catch (_) {}
  }
  root.PureGameHost = Object.freeze({
    getInfo() { return JSON.stringify(info); }, snapshot,
    publish(value) {
      if (typeof value !== 'string' || value.length > 8192) return;
      try { const state = JSON.parse(value); if (state && typeof state === 'object') send({ type: 'publish', value: state }); } catch (_) {}
    }
  });
  root.NeonDesktop = Object.freeze({ receive, suspend });
  root.document?.addEventListener('DOMContentLoaded', () => send({ type: 'ready' }), { once: true });
})(window);
