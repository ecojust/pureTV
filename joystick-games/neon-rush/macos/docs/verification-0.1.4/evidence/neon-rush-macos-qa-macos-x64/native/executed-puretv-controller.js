/* Shared pureTV input adapter and cached controller identity display.
 * TCP decoding and sync suppression stay native.
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

  var clientViews = new WeakMap();
  function installClientStyle(doc) {
    if (doc.getElementById('ptv-client-style')) return;
    var style = doc.createElement('style');
    style.id = 'ptv-client-style';
    style.textContent =
      '[data-puretv-clients]{box-sizing:border-box;min-width:0}' +
      '[data-puretv-clients][hidden]{display:none!important}' +
      '.ptv-client-card{box-sizing:border-box;display:flex;align-items:flex-start;min-width:0;padding:7px 8px;border:1px solid rgba(130,222,229,.45);border-radius:9px;background:rgba(8,28,36,.96);color:#effcff;text-align:left}' +
      '.ptv-client-card+.ptv-client-card{margin-top:6px}' +
      '.ptv-client-icon{display:block;width:24px;height:24px;flex:0 0 24px;margin-right:8px;color:#8ae5dc}' +
      '.ptv-client-body{flex:1;min-width:0}' +
      '.ptv-client-heading{display:flex;align-items:baseline;flex-wrap:wrap;font:600 12px/1.35 sans-serif;letter-spacing:normal;text-transform:none}' +
      '.ptv-client-seat{font:inherit;color:inherit}' +
      '.ptv-client-state{font:inherit;margin-left:6px;color:#a9f0d4}' +
      '.ptv-client-id{display:block;min-width:0;margin-top:3px;font:12px/1.4 monospace;color:#effcff;white-space:normal;word-break:break-all;overflow-wrap:anywhere;letter-spacing:normal;text-transform:none}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function controllerIcon(doc) {
    var ns = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ptv-client-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var outline = doc.createElementNS(ns, 'path');
    outline.setAttribute('d', 'M7.5 7h9c2.2 0 3.4 1.2 4 3.3l1.2 4.8c.5 2.1-1.7 3.6-3.2 2.1l-2.1-2.1H7.6l-2.1 2.1c-1.5 1.5-3.7 0-3.2-2.1l1.2-4.8C4.1 8.2 5.3 7 7.5 7Z');
    svg.appendChild(outline);
    var cross = doc.createElementNS(ns, 'path');
    cross.setAttribute('d', 'M7 9.7v4.6M4.7 12h4.6');
    svg.appendChild(cross);
    [[16, 10.7], [18.8, 13]].forEach(function (point) {
      var dot = doc.createElementNS(ns, 'circle');
      dot.setAttribute('cx', String(point[0])); dot.setAttribute('cy', String(point[1]));
      dot.setAttribute('r', '.75'); dot.setAttribute('fill', 'currentColor');
      dot.setAttribute('stroke', 'none'); svg.appendChild(dot);
    });
    return svg;
  }
  /** Render identity from the already consumed input frame. Never poll a bridge here. */
  function renderClients(container, cachedPlayers, options) {
    if (!container || !container.ownerDocument) return;
    var language = options && options.language === 'en' ? 'en' : 'zh';
    var rows = (Array.isArray(cachedPlayers) ? cachedPlayers : []).filter(function (p) {
      return p && p.connected === true && p.transport === 'wifi' && Number(p.id) > 0;
    }).map(function (p) {
      return { seat: Number(p.id), identity: typeof p.controllerId === 'string' ? p.controllerId : '' };
    }).sort(function (a, b) { return a.seat - b.seat; });
    var signature = JSON.stringify([language, rows]);
    if (clientViews.get(container) === signature) return;
    clientViews.set(container, signature);
    var doc = container.ownerDocument;
    installClientStyle(doc);
    container.setAttribute('data-puretv-clients', '');
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.setAttribute('aria-label', language === 'en' ? 'Connected pureTV controllers' : '已连接的 pureTV 手柄');
    while (container.firstChild) container.removeChild(container.firstChild);
    rows.forEach(function (row) {
      var card = doc.createElement('div'); card.className = 'ptv-client-card';
      card.setAttribute('data-puretv-controller-id', row.identity);
      card.setAttribute('data-player-id', String(row.seat));
      card.appendChild(controllerIcon(doc));
      var body = doc.createElement('div'); body.className = 'ptv-client-body';
      var heading = doc.createElement('div'); heading.className = 'ptv-client-heading';
      var seat = doc.createElement('strong'); seat.className = 'ptv-client-seat'; seat.textContent = row.seat + 'P';
      var state = doc.createElement('span'); state.className = 'ptv-client-state';
      state.textContent = language === 'en' ? 'Connected' : '已连接';
      heading.appendChild(seat); heading.appendChild(state); body.appendChild(heading);
      var identity = doc.createElement('span'); identity.className = 'ptv-client-id';
      identity.setAttribute('data-puretv-controller-id-text', '');
      identity.textContent = 'ID: ' + (row.identity || (language === 'en' ? 'not reported' : '未提供'));
      body.appendChild(identity); card.appendChild(body); container.appendChild(card);
    });
    container.hidden = rows.length === 0;
  }
  root.PureTVControllerAdapter = { create: create, renderClients: renderClients };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PureTVControllerAdapter;
})(typeof window !== 'undefined' ? window : globalThis);
