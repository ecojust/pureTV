/* Shared legacy-game adapter. TCP decoding and sync suppression stay native.
 * Call read once per simulation frame: native snapshots consume short presses.
 * UI/diagnostics must use peek(), never poll the bridge a second time. */
(function (root) {
  'use strict';
  var actions = ['a', 'b', 'start', 'select'];
  function create(options) {
    options = options || {};
    var seats = {}, latest = [];
    function read(players) {
      var rows = (players || []).filter(function (p) { return p && Number(p.id) > 0; });
      Object.keys(seats).forEach(function (id) {
        if (seats[id].wifi && !rows.some(function (p) { return Number(p.id) === Number(id); }))
          rows.push({ id: Number(id), connected: false, transport: 'wifi' });
      });
      latest = rows.map(function (raw) {
        var p = Object.assign({}, raw), id = Number(p.id), old = seats[id];
        var wifi = p.transport === 'wifi', online = !!p.connected;
        var source = online ? (wifi ? 'wifi:' + String(p.session || p.controllerId || id) : 'phone:' + String(p.session || id)) : '';
        var cancel = Number.isSafeInteger(p.cancelSeq) ? p.cancelSeq : 0;
        var changed = !!old && (old.source !== source || old.rawCancel !== cancel);
        var wifiChange = (!old && wifi && online) || (changed && (wifi || old.wifi));
        var memory = old || { epoch: cancel, blocked: {} };
        if (changed) memory.epoch++;
        var quarantine = wifiChange && options.onCancel && options.onCancel({ id: id, previous: old ? old.source : '', source: source, disconnected: !online }) === true;
        if (quarantine) actions.forEach(function (key) { memory.blocked[key] = !!p[key]; });
        actions.forEach(function (key) {
          if (!p[key]) memory.blocked[key] = false;
          p[key] = online && !quarantine && !memory.blocked[key] && !!p[key];
        });
        if (!online || quarantine) { p.x = p.y = p.aimX = p.aimY = 0; }
        p.id = id; p.connected = online; p.cancelSeq = memory.epoch;
        memory.source = source; memory.wifi = wifi; memory.rawCancel = cancel;
        seats[id] = memory;
        return p;
      });
      return latest.map(function (p) { return Object.assign({}, p); });
    }
    return { read: read, peek: function () { return latest.map(function (p) { return Object.assign({}, p); }); } };
  }
  root.PureTVControllerAdapter = { create: create };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PureTVControllerAdapter;
})(typeof window !== 'undefined' ? window : globalThis);
