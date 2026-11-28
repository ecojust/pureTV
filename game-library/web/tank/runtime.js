/* Native room and display adapter. Game rules remain in the game-specific model. */
(function (root) {
  "use strict";
  root.startTvGame = async function (config) {
    const $ = (id) => document.getElementById(id),
      canvas = $("battlefield");
    const bridge = root[config.bridge],
      keys = new Set(),
      mapping = new Map();
    let info = { language: "zh", url: "", qr: "" };
    try {
      if (bridge) info = JSON.parse(bridge.getInfo());
    } catch (_) {}
    const english = String(info.language).startsWith("en");
    const tr = (zh, en) => (english ? en : zh);
    document.documentElement.lang = english ? "en" : "zh-CN";
    document.title = tr(config.titleZh, config.title);
    canvas.setAttribute("aria-label", document.title);
    $("room-qr").alt = tr("房间二维码", "Room QR code");
    document.querySelector(".players").setAttribute("aria-label", tr("玩家", "Players"));
    const labels = {
      "room-brand": [config.titleZh, config.title],
      "join-label": ["手机手柄", "PHONE CONTROLLERS"],
      "lan-label": ["同一局域网", "SAME LOCAL NETWORK"],
      "scan-title": ["扫码连接手柄", "Scan to connect"],
      "scan-description": [
        "手机无需安装应用\n与电视连接同一路由器",
        "No phone app needed\nConnect to the same router as the TV",
      ],
      "menu-help": [
        "SELECT 选择单人／双人\nSTART 开始／暂停",
        "SELECT: choose 1P / 2P\nSTART: begin / pause",
      ],
      "move-label": ["移动", "MOVE"],
      "a-label": config.actions.a,
      "b-label": config.actions.b,
      "footer-left": [config.titleZh, config.title],
      "footer-right": [
        "返回：退出游戏 · 播放键：START",
        "Back: exit game · Play: START",
      ],
    };
    if (!$("game-loading").hasAttribute("data-failed"))
      $("loading-title").textContent = tr("正在载入游戏…", "Loading game…");
    for (const [id, text] of Object.entries(labels))
      if ($(id)) $(id).textContent = text[english ? 1 : 0];
    for (let id = 1; id <= 2; id++)
      $("player-name-" + id).textContent = tr("玩家 " + id, "PLAYER " + id);
    function updateRoom(value) {
      info = Object.assign({}, info, value);
      const ready = !!(info.qr && info.url);
      $("room-qr").hidden = !ready;
      $("qr-pending").hidden = ready;
      if (ready) {
        $("room-qr").src = info.qr;
        $("room-address").textContent = info.url.replace(/\?.*$/, "");
      } else {
        $("room-address").textContent = "";
        $("network-message").textContent =
          info.error ||
          tr(
            "连接局域网后重新打开游戏",
            "Connect to a local network and reopen the game",
          );
      }
    }
    updateRoom(info);
    function updateWifi() {
      const wifi = info.wifiController, panel = $("wifi-controller");
      if (!panel) return;
      panel.hidden = !wifi;
      document.body.classList.toggle("has-wifi-controller", !!wifi);
      if (!wifi) return;
      const addresses = Array.isArray(wifi.addresses) ? wifi.addresses : [];
      const address = addresses.length && Number(wifi.port) > 0
        ? addresses.map(value => value + ":" + wifi.port).join(" · ") : "";
      $("wifi-address").textContent = address;
      $("wifi-state").textContent = wifi.connected
        ? tr("pureTV 手柄已连接", "pureTV controller connected")
        : wifi.state === "available" ? tr("pureTV 手柄待连接", "pureTV controller ready")
        : wifi.state === "registering" ? tr("正在发布手柄服务", "Publishing controller service")
        : wifi.state === "stopped" ? tr("手柄服务已停止", "Controller service stopped")
        : address ? tr("手柄自动发现不可用", "Controller discovery unavailable")
        : tr("手柄服务不可用", "Controller service unavailable");
      $("wifi-help").textContent = wifi.connected
        ? tr("A/X：动作 A · B：动作 B · Y：SELECT", "A/X: action A · B: action B · Y: SELECT")
        : wifi.state === "available" ? tr("同一网络，按手柄搜索键连接；START 开始／暂停", "Same network: press Search; START begins / pauses")
        : wifi.state === "registering" ? tr("正在准备自动发现，请稍候", "Preparing discovery; please wait")
        : wifi.state === "stopped" ? tr("重新打开游戏以启动手柄服务", "Reopen the game to start controller service")
        : address ? tr("自动发现不可用，可按上方地址手动连接", "Discovery unavailable; connect to the address above")
        : tr("连接局域网后重新打开游戏", "Connect to a local network and reopen the game");
    }
    updateWifi();
    function resize() {
      const wrapper = canvas.parentElement,
        panel = wrapper.parentElement;
      const scale = Math.min(panel.clientWidth / 256, panel.clientHeight / 240);
      wrapper.style.width = canvas.style.width = Math.floor(256 * scale) + "px";
      wrapper.style.height = canvas.style.height =
        Math.floor(240 * scale) + "px";
    }
    root.addEventListener("resize", resize);
    resize();
    let renderer,
      game,
      sound = null,
      frame = 0,
      last = 0,
      lastPublish = 0;
    let suspended = false,
      visible = !document.hidden,
      keyboardActive = false,
      destroyed = false;
    let currentInputs = [], controllerPaused = false, resumeArmed = false, renderFailed = false;
    const suppressedStart = new Set(), pendingActions = new Map();
    function pauseController() {
      pendingActions.clear();
      // A manually paused model already waits for a fresh START. Keep feeding
      // neutral snapshots so its own edge detector can observe releases.
      if (game && game.phase === "paused" && !controllerPaused) {
        releaseKeys();
        return true;
      }
      if (game && !["title", "attract", "gameover", "ending", "continue"].includes(game.phase)) {
        controllerPaused = true;
        resumeArmed = false;
        releaseKeys();
        return true;
      }
      return false;
    }
    const controllerInput = root.PureTVControllerAdapter.create({ onCancel: pauseController });
    function wifiPresent() { return currentInputs.some(p => p.transport === "wifi"); }
    function gateControllers(current) {
      const start = current.some(p => p.connected && p.start);
      for (const p of current) if (!p.start) suppressedStart.delete(p.id);
      if (controllerPaused) {
        if (!start) resumeArmed = true;
        if (!suspended && resumeArmed && start) {
          controllerPaused = false;
          for (const p of current) if (p.start) suppressedStart.add(p.id);
          for (const p of current) { p.x = p.y = 0; p.a = p.b = p.start = p.select = false; }
        }
      }
      for (const p of current) if (suppressedStart.has(p.id)) p.start = false;
      const banner = $("wifi-pause");
      if (banner) {
        banner.hidden = !controllerPaused;
        banner.textContent = tr("输入已暂停 · 松开按键，再按 START 继续", "Input paused · Release buttons, then press START");
      }
      return current;
    }
    const pulse = { a: 0, b: 0, start: 0, select: 0 };
    function releaseKeys() {
      keys.clear();
      mapping.clear();
      for (const k of Object.keys(pulse)) pulse[k] = 0;
    }
    function actionFor(code) {
      if (code === "Start" || code === "p") return "start";
      if (code === "Select" || code === "Shift") return "select";
      if (code === "Enter")
        return game &&
          ["title", "attract", "continue", "gameover"].includes(game.phase)
          ? "start"
          : "a";
      if (code === " " || code === "z") return "a";
      if (code === "x" || code === "b") return "b";
      return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)
        ? code
        : null;
    }
    function key(code, pressed) {
      const normalized = code.length === 1 ? code.toLowerCase() : code;
      const action = mapping.get(normalized) || actionFor(normalized);
      if (!action) return;
      if (pressed) {
        if (!mapping.has(normalized)) {
          mapping.set(normalized, action);
          if (
            Object.hasOwn
              ? Object.hasOwn(pulse, action)
              : Object.prototype.hasOwnProperty.call(pulse, action)
          )
            pulse[action] = performance.now() + 70;
        }
        keys.add(action);
        keyboardActive = true;
        if (sound) sound.unlock().catch(() => {});
      } else {
        mapping.delete(normalized);
        if (![...mapping.values()].includes(action)) keys.delete(action);
      }
    }
    function inputs() {
      let list = [];
      try {
        if (bridge) list = JSON.parse(bridge.snapshot()).players || [];
      } catch (_) {}
      list = controllerInput.read(list)
        .filter((p) => p && [1, 2].includes(Number(p.id)))
        .map((p) => (Object.assign({}, p, {
          id: Number(p.id),
          connected: !!p.connected,
          x: Number(p.x) || 0,
          y: Number(p.y) || 0,
          a: !!p.a,
          b: !!p.b,
          start: !!p.start,
          select: !!p.select,
        })));
      if (keyboardActive) {
        let player = list.find((p) => p.id === 1);
        if (!player) {
          player = {
            id: 1,
            connected: true,
            x: 0,
            y: 0,
            a: false,
            b: false,
            start: false,
            select: false,
          };
          list.push(player);
        }
        player.connected = true;
        const x =
          Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
        const y = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));
        player.x = x || player.x;
        player.y = y || player.y;
        for (const action of ["a", "b", "start", "select"])
          player[action] =
            player[action] ||
            keys.has(action) ||
            performance.now() < pulse[action];
      }
      currentInputs = gateControllers(list);
      return currentInputs;
    }
    function state() {
      const value = game.status();
      return suspended || controllerPaused ? Object.assign({}, value, { phase: "paused" }) : value;
    }
    function updateUi(current) {
      // Display the last native identities without consuming short button pulses.
      const clients = $("wifi-clients");
      root.PureTVControllerAdapter.renderClients(clients, controllerInput.peek(), { language: english ? "en" : "zh", showPhones: true });
      for (const id of [1, 2]) {
        const player = game && game.players.find((value) => value.id === id);
        const controller = current.find((value) => value.id === id);
        const connected = !!(controller && controller.connected);
        const card = $("player-" + id);
        if (!card) continue;
        card.classList.toggle("connected", connected);
        $("player-status-" + id).textContent = !connected
          ? tr("等待连接", "Waiting to connect")
          : !player || !player.joined
            ? tr(
                "已连接 · 在标题选择人数",
                "Connected · Choose players at title",
              )
            : tr("生命 ", "LIVES ") +
              Math.max(0, player.lives) +
              " · " +
              String(Math.max(0, player.score)).padStart(6, "0");
      }
    }
    // A valid room must keep showing its players even if game loading/drawing fails.
    const roomTimer = root.setInterval(() => {
      if (visible && !destroyed) {
        // Only the simulation frame consumes native button pulses. When startup
        // fails there is no simulation, but the room remains observable.
        if (!game || renderFailed) inputs();
        updateUi(currentInputs);
        try { if (bridge) updateRoom(JSON.parse(bridge.getInfo())); } catch (_) {}
        updateWifi();
      }
    }, 200);
    updateUi(currentInputs);
    function publish() {
      try {
        if (bridge) bridge.publish(JSON.stringify(state()));
      } catch (_) {}
    }
    function animate(now) {
      if (!visible || destroyed) return;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      const current = inputs();
      // Native snapshots consume short presses once. Retain them until the
      // model's real fixed step consumes inputs, not merely until the next RAF.
      if (suspended || controllerPaused) pendingActions.clear();
      else for (const p of current) {
        if (!p.connected) { pendingActions.delete(p.id); continue; }
        const held = pendingActions.get(p.id) || {};
        for (const key of ["a", "b", "start", "select"]) {
          held[key] = !!held[key] || !!p[key];
          p[key] = held[key];
        }
        pendingActions.set(p.id, held);
      }
      let ready = true;
      try {
        ready = !renderer.readyFor || renderer.readyFor(game);
        if (!suspended && !controllerPaused && ready) {
          const consumes = config.api === "BombJackTV" || Number(game.accumulator) + dt + 1e-9 >= 1 / 60;
          game.step(dt, current);
          if (consumes) pendingActions.clear();
        }
        renderer.draw(game);
      } catch (error) {
        renderFailed = true;
        if (sound) sound.pause(true);
        root.TankStartup.fail(error);
        return;
      }
      if (sound) {
        if (
          current.some(
            (p) => p.connected && (p.a || p.b || p.start || p.select),
          )
        )
          sound.unlock().catch(() => {});
        sound.pause(suspended || controllerPaused || !ready || game.phase === "paused");
        if (!suspended && !controllerPaused && ready) sound.update(game);
      }
      if (now - lastPublish >= 200) {
        publish();
        lastPublish = now;
      }
      frame = requestAnimationFrame(animate);
    }
    function suspend(value) {
      suspended = !!value;
      if (suspended && wifiPresent()) pauseController();
      releaseKeys();
      last = 0;
      if (sound) sound.pause(suspended);
      if (game) publish();
    }
    root[config.api] = {
      key,
      updateRoom,
      suspend,
      get game() {
        return game;
      },
      get renderer() {
        return renderer;
      },
    };
    root.PureTVQA = { snapshot: function () {
      return JSON.parse(JSON.stringify({
        phase: game ? state().phase : "loading", paused: suspended || controllerPaused || !!(game && game.phase === "paused"),
        controllerPaused, controllers: currentInputs, info,
        model: game ? game.status() : null, players: game ? game.players : [],
        effects: game ? { bullets: game.bullets || [], weapons: game.weapons || [], events: game.events || [] } : {},
      }));
    } };
    document.addEventListener("keydown", (event) => {
      if (
        actionFor(event.key.length === 1 ? event.key.toLowerCase() : event.key)
      ) {
        event.preventDefault();
        key(event.key, true);
      }
    });
    document.addEventListener("keyup", (event) => key(event.key, false));
    root.addEventListener("blur", () => { if (wifiPresent()) pauseController(); releaseKeys(); });
    document.addEventListener("visibilitychange", () => {
      visible = !document.hidden;
      if (!visible && wifiPresent()) pauseController();
      releaseKeys();
      last = 0;
      cancelAnimationFrame(frame);
      if (sound) sound.pause(!visible || suspended);
      if (visible && game && !renderFailed) frame = requestAnimationFrame(animate);
      else if (game) {
        try {
          if (bridge)
            bridge.publish(
              JSON.stringify(Object.assign({}, game.status(), { phase: "paused" })),
            );
        } catch (_) {}
      }
    });
    root.addEventListener("pagehide", () => {
      destroyed = true;
      visible = false;
      cancelAnimationFrame(frame);
      root.clearInterval(roomTimer);
      releaseKeys();
      if (sound) sound.dispose();
      if (renderer && renderer.dispose) renderer.dispose();
    });
    try {
      const loaded = config.load ? await config.load() : null;
      if (destroyed) return;
      game = config.createGame(loaded);
      renderer = config.createRenderer(canvas, loaded);
      sound = config.createAudio ? config.createAudio(loaded) : null;
      renderer.draw(game);
      if (!$("game-loading").hasAttribute("data-failed")) $("game-loading").hidden = true;
      updateUi(currentInputs);
      publish();
      if (visible) frame = requestAnimationFrame(animate);
    } catch (error) {
      renderFailed = true;
      root.TankStartup.fail(error);
    }
    return root[config.api];
  };
})(window);
