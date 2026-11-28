(() => {
  // ../shared/web/controller-clients.js
  (function(root) {
    "use strict";
    var actions = ["a", "b", "start", "select"];
    function create(options) {
      options = options || {};
      var seats = {}, latest = [];
      function read(players) {
        var rows = (players || []).filter(function(p) {
          return p && Number(p.id) > 0;
        });
        Object.keys(seats).forEach(function(id) {
          if (seats[id].wifi && !rows.some(function(p) {
            return Number(p.id) === Number(id);
          }))
            rows.push({ id: Number(id), connected: false, transport: "wifi" });
        });
        latest = rows.map(function(raw) {
          var p = Object.assign({}, raw), id = Number(p.id), old = seats[id];
          var wifi = p.transport === "wifi", online = !!p.connected;
          var source = online ? wifi ? "wifi:" + String(p.session || p.controllerId || id) : "phone:" + String(p.session || id) : "";
          var cancel = Number.isSafeInteger(p.cancelSeq) ? p.cancelSeq : 0;
          var changed = !!old && (old.source !== source || old.rawCancel !== cancel);
          var wifiChange = !old && wifi && online || changed && (wifi || old.wifi);
          var memory = old || { epoch: cancel, blocked: {} };
          if (changed) memory.epoch++;
          var quarantine = wifiChange && options.onCancel && options.onCancel({ id, previous: old ? old.source : "", source, disconnected: !online }) === true;
          if (quarantine) actions.forEach(function(key) {
            memory.blocked[key] = !!p[key];
          });
          actions.forEach(function(key) {
            if (!p[key]) memory.blocked[key] = false;
            p[key] = online && !quarantine && !memory.blocked[key] && !!p[key];
          });
          if (!online || quarantine) {
            p.x = p.y = p.aimX = p.aimY = 0;
          }
          p.id = id;
          p.connected = online;
          p.cancelSeq = memory.epoch;
          memory.source = source;
          memory.wifi = wifi;
          memory.rawCancel = cancel;
          seats[id] = memory;
          return p;
        });
        return latest.map(function(p) {
          return Object.assign({}, p);
        });
      }
      return { read, peek: function() {
        return latest.map(function(p) {
          return Object.assign({}, p);
        });
      } };
    }
    var clientViews = /* @__PURE__ */ new WeakMap();
    function installClientStyle(doc) {
      if (doc.getElementById("ptv-client-style")) return;
      var style = doc.createElement("style");
      style.id = "ptv-client-style";
      style.textContent = "[data-puretv-clients]{box-sizing:border-box;min-width:0}[data-puretv-clients][hidden]{display:none!important}.ptv-client-card{box-sizing:border-box;display:flex;align-items:flex-start;min-width:0;padding:7px 8px;border:1px solid rgba(130,222,229,.45);border-radius:9px;background:rgba(8,28,36,.96);color:#effcff;text-align:left}.ptv-client-card+.ptv-client-card{margin-top:6px}.ptv-client-icon{display:block;width:24px;height:24px;flex:0 0 24px;margin-right:8px;color:#8ae5dc}.ptv-client-body{flex:1;min-width:0}.ptv-client-heading{display:flex;align-items:baseline;flex-wrap:wrap;font:600 12px/1.35 sans-serif;letter-spacing:normal;text-transform:none}.ptv-client-seat{font:inherit;color:inherit}.ptv-client-state{font:inherit;margin-left:6px;color:#a9f0d4}.ptv-client-id{display:block;min-width:0;margin-top:3px;font:12px/1.4 monospace;color:#effcff;white-space:normal;word-break:break-all;overflow-wrap:anywhere;letter-spacing:normal;text-transform:none}";
      (doc.head || doc.documentElement).appendChild(style);
    }
    function controllerIcon(doc) {
      var ns = "http://www.w3.org/2000/svg", svg = doc.createElementNS(ns, "svg");
      svg.setAttribute("class", "ptv-client-icon");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "1.7");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      var outline = doc.createElementNS(ns, "path");
      outline.setAttribute("d", "M7.5 7h9c2.2 0 3.4 1.2 4 3.3l1.2 4.8c.5 2.1-1.7 3.6-3.2 2.1l-2.1-2.1H7.6l-2.1 2.1c-1.5 1.5-3.7 0-3.2-2.1l1.2-4.8C4.1 8.2 5.3 7 7.5 7Z");
      svg.appendChild(outline);
      var cross = doc.createElementNS(ns, "path");
      cross.setAttribute("d", "M7 9.7v4.6M4.7 12h4.6");
      svg.appendChild(cross);
      [[16, 10.7], [18.8, 13]].forEach(function(point) {
        var dot = doc.createElementNS(ns, "circle");
        dot.setAttribute("cx", String(point[0]));
        dot.setAttribute("cy", String(point[1]));
        dot.setAttribute("r", ".75");
        dot.setAttribute("fill", "currentColor");
        dot.setAttribute("stroke", "none");
        svg.appendChild(dot);
      });
      return svg;
    }
    function renderClients(container, cachedPlayers, options) {
      if (!container || !container.ownerDocument) return;
      var language = options && options.language === "en" ? "en" : "zh";
      var rows = (Array.isArray(cachedPlayers) ? cachedPlayers : []).filter(function(p) {
        return p && p.connected === true && p.transport === "wifi" && Number(p.id) > 0;
      }).map(function(p) {
        return { seat: Number(p.id), identity: typeof p.controllerId === "string" ? p.controllerId : "" };
      }).sort(function(a, b) {
        return a.seat - b.seat;
      });
      var signature = JSON.stringify([language, rows]);
      if (clientViews.get(container) === signature) return;
      clientViews.set(container, signature);
      var doc = container.ownerDocument;
      installClientStyle(doc);
      container.setAttribute("data-puretv-clients", "");
      container.setAttribute("role", "status");
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      container.setAttribute("aria-label", language === "en" ? "Connected pureTV controllers" : "\u5DF2\u8FDE\u63A5\u7684 pureTV \u624B\u67C4");
      while (container.firstChild) container.removeChild(container.firstChild);
      rows.forEach(function(row) {
        var card = doc.createElement("div");
        card.className = "ptv-client-card";
        card.setAttribute("data-puretv-controller-id", row.identity);
        card.setAttribute("data-player-id", String(row.seat));
        card.appendChild(controllerIcon(doc));
        var body = doc.createElement("div");
        body.className = "ptv-client-body";
        var heading = doc.createElement("div");
        heading.className = "ptv-client-heading";
        var seat = doc.createElement("strong");
        seat.className = "ptv-client-seat";
        seat.textContent = row.seat + "P";
        var state = doc.createElement("span");
        state.className = "ptv-client-state";
        state.textContent = language === "en" ? "Connected" : "\u5DF2\u8FDE\u63A5";
        heading.appendChild(seat);
        heading.appendChild(state);
        body.appendChild(heading);
        var identity = doc.createElement("span");
        identity.className = "ptv-client-id";
        identity.setAttribute("data-puretv-controller-id-text", "");
        identity.textContent = "ID: " + (row.identity || (language === "en" ? "not reported" : "\u672A\u63D0\u4F9B"));
        body.appendChild(identity);
        card.appendChild(body);
        container.appendChild(card);
      });
      container.hidden = rows.length === 0;
    }
    root.PureTVControllerAdapter = { create, renderClients };
    if (typeof module !== "undefined" && module.exports) module.exports = root.PureTVControllerAdapter;
  })(typeof window !== "undefined" ? window : globalThis);

  // ../shared/web/input.js
  var BUTTONS = Object.freeze(["UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"]);
  var empty = () => Object.fromEntries(BUTTONS.map((key) => [key, false]));
  var copy = (value) => JSON.parse(JSON.stringify(value));
  var nativeKeys = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", Enter: "A", Start: "START", p: "START", b: "B", A: "A", B: "B", X: "X", Y: "Y", Select: "Y" };
  var keypad = {
    Numpad8: "UP",
    Numpad2: "DOWN",
    Numpad4: "LEFT",
    Numpad6: "RIGHT",
    Numpad5: "START",
    Numpad1: "A",
    Numpad3: "B",
    Numpad7: "X",
    Numpad9: "Y"
  };
  var keyboard = {
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    KeyP: "START",
    KeyZ: "A",
    KeyX: "B",
    KeyC: "X",
    KeyV: "Y"
  };
  function controllerPlayer(player) {
    if (player.transport === "wifi") return player;
    if (player.transport !== "phone" && (player.transport || typeof player.x !== "number" || typeof player.y !== "number")) return player;
    const buttons = {
      UP: player.y < -0.35,
      DOWN: player.y > 0.35,
      LEFT: player.x < -0.35,
      RIGHT: player.x > 0.35,
      START: player.start === true,
      A: player.a === true,
      B: player.b === true,
      X: player.buttonX === true,
      Y: player.buttonY === true || player.select === true
    };
    return { ...player, transport: "phone", buttons };
  }
  function createInputReducer() {
    let previous = empty(), source = "", epoch = null, hasSeenController = false;
    let blocked = empty(), resetPending = false;
    return {
      cancel() {
        resetPending = true;
      },
      read(snapshot = {}, local = {}) {
        if (!snapshot || typeof snapshot !== "object") snapshot = {};
        const players = Array.isArray(snapshot.players) ? snapshot.players.filter((p) => p && Number(p.id) > 0).map(controllerPlayer) : [];
        const online = players.filter((p) => p.connected === true).sort((a, b) => Number(a.id) - Number(b.id));
        const player = online.find((p) => p.transport === "wifi") || online.find((p) => p.transport === "phone");
        const nextSource = !player ? "" : player.transport === "phone" ? JSON.stringify(["phone", player.id]) : JSON.stringify([player.id, player.controllerId, player.session]);
        const nextEpoch = player?.cancelSeq ?? null;
        const changed = source !== nextSource || !!source && epoch !== nextEpoch;
        const cancelled = resetPending || changed && !!source;
        const quarantine = cancelled || changed && hasSeenController && !!nextSource;
        const raw = empty();
        const active = snapshot.inputActive !== false && player?.inputActive !== false;
        for (const key of BUTTONS) raw[key] = !!local[key] || active && player?.buttons?.[key] === true;
        if (quarantine) for (const key of BUTTONS) blocked[key] = raw[key];
        const buttons = empty(), pressed = empty(), released = empty();
        for (const key of BUTTONS) {
          if (!raw[key]) blocked[key] = false;
          buttons[key] = !quarantine && raw[key] && !blocked[key];
          pressed[key] = buttons[key] && !previous[key];
          released[key] = !cancelled && !quarantine && !buttons[key] && previous[key];
        }
        previous = buttons;
        source = nextSource;
        epoch = nextEpoch;
        resetPending = false;
        if (player) hasSeenController = true;
        return { buttons, pressed, released, connected: !!player, transport: player?.transport || null, cancelled, players: copy(players), source };
      }
    };
  }
  function panel(document, options) {
    const style = document.createElement("style");
    style.textContent = `
    #puretv-controller-panel{position:fixed;z-index:30;box-sizing:border-box;max-height:calc(100vh - 24px);overflow:auto;color:#eef6ff;background:rgba(12,22,36,.94);border:1px solid rgba(153,192,225,.35);border-radius:12px;padding:10px;font:13px/1.5 system-ui,sans-serif;text-align:left;overflow-wrap:anywhere;box-shadow:0 8px 28px #0004}
    #puretv-controller-panel[hidden]{display:none!important}
    #puretv-controller-panel strong{font-weight:650}
    #puretv-controller-panel .ptv-host-title{display:block;font-size:13px;color:#a8ddff;margin-bottom:5px}
    #puretv-controller-panel .ptv-host-info{white-space:pre-line;margin:6px 0 0;color:#c4d5e7;font-size:12px}
    #puretv-controller-panel .ptv-phone{margin:4px 0}
    #puretv-controller-panel .ptv-phone img{display:block;width:min(108px,20vh);height:auto;background:white;image-rendering:pixelated}
    #puretv-controller-panel .ptv-phone small{display:block;color:#c4d5e7}
    #puretv-controller-panel .ptv-phone [hidden],#puretv-controller-panel .ptv-phone[hidden]{display:none}
    #puretv-controller-panel[data-playing=true]{background:transparent;border:0;padding:0;box-shadow:none;pointer-events:none}
    #puretv-controller-panel[data-playing=true] .ptv-client-card{padding:3px 6px;align-items:center}
    #puretv-controller-panel[data-playing=true] .ptv-client-icon{width:17px;height:17px;flex-basis:17px;margin-right:5px}
    #puretv-controller-panel[data-playing=true] .ptv-client-heading,#puretv-controller-panel[data-playing=true] .ptv-client-id{line-height:1.2;margin-top:0}
    #puretv-controller-panel .ptv-status{display:inline-block;border-radius:4px;padding:2px 5px;background:#0c192bee;color:#eef6ff;font:11px/1.25 system-ui,sans-serif}
    #puretv-controller-panel .ptv-status[hidden]{display:none}
    #puretv-controller-panel[data-playing=true] .ptv-host-title,#puretv-controller-panel[data-playing=true] .ptv-host-info{display:none}
    #puretv-controller-panel .ptv-client-card{background:rgba(12,25,43,.94)}
    #puretv-controller-panel .ptv-client-id{font-size:11px}
    #puretv-controller-panel .ptv-client-heading{font-size:12px}
  `;
    document.head.appendChild(style);
    const element = document.createElement("aside");
    element.id = "puretv-controller-panel";
    element.setAttribute("aria-label", "pureTV \u624B\u67C4\u8FDE\u63A5");
    element.style[options.side === "left" ? "left" : "right"] = "12px";
    element.style.top = options.top || "12px";
    element.style.width = `${Math.max(150, Math.min(300, Number(options.width) || 198))}px`;
    const title = document.createElement("strong");
    title.className = "ptv-host-title";
    title.textContent = "pureTV \u624B\u67C4";
    const clients = document.createElement("div");
    clients.id = "puretv-controller-clients";
    clients.hidden = true;
    const info = document.createElement("p");
    info.className = "ptv-host-info";
    const phone = document.createElement("div");
    phone.className = "ptv-phone";
    phone.hidden = true;
    const qr = document.createElement("img");
    qr.alt = "\u624B\u673A\u624B\u67C4\u623F\u95F4\u4E8C\u7EF4\u7801";
    qr.hidden = true;
    const join = document.createElement("small");
    phone.append(qr, join);
    const status = document.createElement("span");
    status.className = "ptv-status";
    status.hidden = true;
    element.append(title, clients, phone, status, info);
    document.body.appendChild(element);
    return { element, clients, info, phone, qr, join, status, style };
  }
  function createController(options = {}) {
    const root = window, document = root.document;
    const view = panel(document, options), reducer = createInputReducer();
    const heldKeys = /* @__PURE__ */ new Map();
    let localPulse = empty(), info = {}, infoAt = -Infinity, playing = false;
    let frame = { buttons: empty(), pressed: empty(), released: empty(), connected: false, cancelled: false, players: [], source: "", pollCount: 0, info: {} };
    const previousHost = root.PureGame;
    function acceptInfo(value) {
      if (value && typeof value === "object") info = copy(value);
    }
    function suspend() {
      heldKeys.clear();
      localPulse = empty();
      reducer.cancel();
      options.onSuspend?.();
    }
    function setKey(code, action, down) {
      if (!down) {
        heldKeys.delete(code);
        return;
      }
      if (!heldKeys.has(code)) localPulse[action] = true;
      heldKeys.set(code, action);
    }
    function onKey(event) {
      const action = keypad[event.code] || options.keyboard === true && keyboard[event.code];
      if (!action || !event.isTrusted) return;
      const code = "dom:" + event.code;
      if (event.type === "keyup") {
        if (!heldKeys.has(code)) return;
      } else if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.target?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable=false])")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) setKey(code, action, event.type === "keydown");
    }
    const hooks = {
      key(key, down) {
        const action = nativeKeys[key];
        if (!action) return;
        setKey("native:" + key, action, down);
      },
      focus(focused) {
        if (!focused) suspend();
      },
      suspend(paused) {
        if (paused) suspend();
      },
      resume() {
      },
      roomInfo: acceptInfo,
      networkChanged(value) {
        acceptInfo(value);
        suspend();
      }
    };
    root.PureGame = hooks;
    const onVisibility = () => {
      if (document.hidden) suspend();
    };
    root.addEventListener("keydown", onKey, true);
    root.addEventListener("keyup", onKey, true);
    root.addEventListener("blur", suspend);
    document.addEventListener("visibilitychange", onVisibility);
    function render() {
      root.PureTVControllerAdapter.renderClients(view.clients, frame.players, { language: "zh" });
      const stage = String(playing);
      if (view.element.dataset.playing !== stage) {
        view.element.dataset.playing = stage;
        document.body.dataset.puretvPlaying = stage;
      }
      const phoneSeat = frame.players.find((p) => p.connected && p.transport === "phone");
      view.status.hidden = !playing || frame.transport === "wifi";
      const label = frame.transport === "phone" ? `${phoneSeat.id}P \u624B\u673A\u624B\u67C4\u5DF2\u8FDE\u63A5` : "\u624B\u67C4\u672A\u8FDE\u63A5";
      if (view.status.textContent !== label) view.status.textContent = label;
      const room = typeof info.url === "string" && /^https?:\/\//.test(info.url) ? info.url : "";
      view.phone.hidden = playing || frame.connected || !room;
      const joining = String(!view.phone.hidden);
      if (document.body.dataset.puretvJoining !== joining) document.body.dataset.puretvJoining = joining;
      if (!view.phone.hidden) {
        const qr = typeof info.qr === "string" && info.qr.startsWith("data:image/png;base64,") ? info.qr : "";
        view.qr.hidden = !qr;
        if (qr && view.qr.getAttribute("src") !== qr) view.qr.src = qr;
        const joinText = qr ? "\u540C\u4E00 Wi-Fi \u4E0B\u7528\u624B\u673A\u626B\u7801" : "\u624B\u673A\u6253\u5F00 " + room;
        if (view.join.textContent !== joinText) view.join.textContent = joinText;
      }
      const wifi = info.wifiController || {};
      const addresses = Array.isArray(wifi.addresses) ? wifi.addresses : Array.isArray(info.addresses) ? info.addresses : [];
      const address = addresses.filter((value) => typeof value === "string").join(" / ");
      const name = typeof wifi.serviceName === "string" ? wifi.serviceName : "";
      const port = Number.isInteger(wifi.port) && wifi.port > 0 ? wifi.port : 63485;
      const activeSeat = frame.players.filter((p) => p.connected === true && p.transport === frame.transport).map((p) => Number(p.id)).sort((a, b) => a - b)[0];
      let status = frame.connected ? `\u5355\u4EBA\u6E38\u620F \xB7 ${activeSeat}P ${frame.transport === "phone" ? "\u624B\u673A\u624B\u67C4" : "\u65E0\u7EBF\u624B\u67C4"}\u64CD\u4F5C` : "\u65E0\u7EBF\u624B\u67C4\u6309 GPIO 23 \u641C\u7D22\u8FDE\u63A5";
      if (!root.PureGameHost) status = "\u6D4F\u89C8\u5668\u9884\u89C8 \xB7 \u952E\u9F20\u53EF\u73A9\nWi-Fi \u624B\u67C4\u9700\u542F\u52A8\u5B89\u88C5\u7248";
      if (!info.url) status += "\n\u5C0F\u952E\u76D8 8/2/4/6 \u65B9\u5411 \xB7 5 START \xB7 1/3/7/9 A/B/X/Y";
      if (name) status += "\n" + name;
      if (address) status += "\n" + address;
      if (root.PureGameHost) status += "\nTCP " + port;
      if (typeof wifi.error === "string" && wifi.error) status += "\n" + wifi.error;
      if (wifi.state === "failed" || wifi.state === "unavailable") status += "\n\u624B\u67C4\u670D\u52A1\u6682\u4E0D\u53EF\u7528";
      if (view.info.textContent !== status) view.info.textContent = status;
    }
    return {
      poll() {
        let sample = { players: [] };
        const now = root.performance.now();
        try {
          if (root.PureGameHost?.getInfo && now - infoAt >= 1e3) {
            acceptInfo(JSON.parse(root.PureGameHost.getInfo()));
            infoAt = now;
          }
          if (root.PureGameHost?.snapshot) sample = JSON.parse(root.PureGameHost.snapshot());
        } catch (_) {
          sample = { players: [] };
        }
        const local = localPulse;
        for (const action of heldKeys.values()) local[action] = true;
        localPulse = empty();
        frame = { ...reducer.read(sample, local), info: copy(info), pollCount: frame.pollCount + 1, native: !!root.PureGameHost, inputAvailable: !!root.PureGameHost };
        render();
        if (frame.cancelled) options.onCancel?.();
        return copy(frame);
      },
      peek() {
        return copy(frame);
      },
      setPlaying(value) {
        if (playing !== !!value) {
          playing = !!value;
          render();
        }
      },
      cancel: suspend,
      destroy() {
        root.removeEventListener("keydown", onKey, true);
        root.removeEventListener("keyup", onKey, true);
        root.removeEventListener("blur", suspend);
        document.removeEventListener("visibilitychange", onVisibility);
        if (root.PureGame === hooks) {
          root.PureGame = previousHost;
          delete document.body.dataset.puretvPlaying;
          delete document.body.dataset.puretvJoining;
        }
        view.element.remove();
        view.style.remove();
      }
    };
  }

  // src/controls.js
  window.kindlePad = createController({ keyboard: true, onSuspend: () => window.dispatchEvent(new Event("kindle-suspend")) });
})();
