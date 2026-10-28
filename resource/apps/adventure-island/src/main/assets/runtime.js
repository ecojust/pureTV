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
    document.title = config.title;
    const labels = {
      "room-brand": [config.title, config.title],
      "join-label": ["手机手柄", "PHONE CONTROLLERS"],
      "lan-label": ["同一局域网", "SAME LOCAL NETWORK"],
      "scan-title": ["扫码连接手柄", "Scan to connect"],
      "scan-description": [
        "手机无需安装应用\n与电视连接同一路由器",
        "No phone app needed\nConnect to the same router as the TV",
      ],
      "menu-help": [
        "SELECT 选择人数 · 暂停时切换音乐\nSTART 开始／暂停",
        "SELECT: players / music when paused\nSTART: begin / pause",
      ],
      "move-label": ["移动", "MOVE"],
      "a-label": config.actions.a,
      "b-label": config.actions.b,
      "footer-left": [config.title, config.title],
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
          ["title", "attract", "continue", "gameover", "ending"].includes(
            game.phase,
          )
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
      list = list
        .filter((p) => p && [1, 2].includes(Number(p.id)))
        .map((p) => ({
          id: Number(p.id),
          connected: !!p.connected,
          x: Number(p.x) || 0,
          y: Number(p.y) || 0,
          a: !!p.a,
          b: !!p.b,
          start: !!p.start,
          select: !!p.select,
        }));
      if (keyboardActive) {
        const keyboardPlayer = (game && game.activePlayer) || 1;
        let player = list.find((p) => p.id === keyboardPlayer);
        if (!player) {
          player = {
            id: keyboardPlayer,
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
      return list;
    }
    function state() {
      const value = game.status();
      try {
        localStorage.setItem(
          "adventure-settings",
          JSON.stringify({ highScore: game.highScore, muted: game.muted }),
        );
      } catch (_) {}
      return suspended ? Object.assign({}, value, { phase: "paused" }) : value;
    }
    function updateUi(current) {
      for (const id of [1, 2]) {
        const player = game && game.players.find((value) => value.id === id);
        const controller = current.find((value) => value.id === id);
        const connected = !!(controller && controller.connected);
        const card = $("player-" + id);
        if (!card) continue;
        card.classList.toggle("connected", connected);
        card.classList.toggle("active", !!(player && player.active));
        $("player-status-" + id).textContent = !connected
          ? tr("等待连接", "Waiting to connect")
          : !player || !player.joined
            ? tr(
                "已连接 · 在标题选择人数",
                "Connected · Choose players at title",
              )
            : (player.active
                ? tr("当前回合 · ", "YOUR TURN · ")
                : tr("等待回合 · ", "WAITING · ")) +
              player.stageLabel +
              "\n" +
              tr("生命 ", "LIVES ") +
              Math.max(0, player.lives) +
              " · " +
              String(Math.max(0, player.score)).padStart(6, "0");
      }
    }
    // A valid room must keep showing its players even if game loading/drawing fails.
    const roomTimer = root.setInterval(() => {
      if (visible && !destroyed && !suspended) updateUi(inputs());
    }, 200);
    updateUi(inputs());
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
      let ready = true;
      try {
        ready = !renderer.readyFor || renderer.readyFor(game);
        if (!suspended && ready) game.step(dt, current);
        renderer.draw(game);
      } catch (error) {
        if (sound) sound.pause(true);
        root.AdventureStartup.fail(error);
        return;
      }
      if (sound) {
        if (
          current.some(
            (p) => p.connected && (p.a || p.b || p.start || p.select),
          )
        )
          sound.unlock().catch(() => {});
        sound.pause(suspended || !ready || game.phase === "paused");
        if (!suspended && ready) sound.update(game);
      }
      if (now - lastPublish >= 200) {
        publish();
        lastPublish = now;
      }
      frame = requestAnimationFrame(animate);
    }
    function suspend(value) {
      suspended = !!value;
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
    document.addEventListener("keydown", (event) => {
      if (
        actionFor(event.key.length === 1 ? event.key.toLowerCase() : event.key)
      ) {
        event.preventDefault();
        key(event.key, true);
      }
    });
    document.addEventListener("keyup", (event) => key(event.key, false));
    root.addEventListener("blur", releaseKeys);
    document.addEventListener("visibilitychange", () => {
      visible = !document.hidden;
      releaseKeys();
      last = 0;
      cancelAnimationFrame(frame);
      if (sound) sound.pause(!visible || suspended);
      if (visible && game) frame = requestAnimationFrame(animate);
      else if (game) {
        try {
          if (bridge)
            bridge.publish(
              JSON.stringify(
                Object.assign({}, game.status(), { phase: "paused" }),
              ),
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
      if (!$("game-loading").hasAttribute("data-failed"))
        $("game-loading").hidden = true;
      updateUi(inputs());
      publish();
      if (visible) frame = requestAnimationFrame(animate);
    } catch (error) {
      root.AdventureStartup.fail(error);
    }
    return root[config.api];
  };
})(window);
