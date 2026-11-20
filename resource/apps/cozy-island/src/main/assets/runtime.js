/* Local Android room bridge. Room diagnostics run independently of rendering. */
(function (root) {
  "use strict";
  root.startCozyIsland = function () {
    var $ = function (id) {
        return document.getElementById(id);
      },
      canvas = $("battlefield"),
      bridge = root.CozyIslandHost,
      info = { language: "zh", url: "", qr: "" };
    try {
      if (bridge) info = JSON.parse(bridge.getInfo());
    } catch (_) {}
    var english = String(info.language).indexOf("en") === 0,
      tr = function (zh, en) {
        return english ? en : zh;
      };
    document.documentElement.lang = english ? "en" : "zh-CN";
    document.title = tr("悠岛生活 TV", "Cozy Island TV");
    var labels = {
      "room-brand": ["悠岛生活 TV", "Cozy Island TV"],
      "join-label": ["手机手柄", "PHONE CONTROLLERS"],
      "lan-label": ["同一局域网", "SAME WI-FI"],
      "scan-title": ["扫码连接手柄", "Scan to connect"],
      "scan-description": [
        "无需安装手机应用\n与电视连接同一路由器",
        "No phone app needed\nUse the same router as your TV",
      ],
      "menu-help": [
        "SELECT：人数 / 空手、钓竿、捕虫网\nSTART：开始 / 暂停 · 暂停 SELECT：音乐",
        "SELECT: players / hands, rod, net\nSTART: begin / pause · Paused SELECT: music",
      ],
      "move-label": ["走动", "WALK"],
      "a-label": ["互动", "USE"],
      "b-label": ["背包", "BAG"],
      "footer-left": [
        "原创小岛生活 · 自动保存",
        "Original island life · autosave",
      ],
      "footer-right": [
        "返回：退出 · 播放键：START",
        "Back: exit · Play: START",
      ],
    };
    Object.keys(labels).forEach(function (id) {
      $(id).textContent = labels[id][english ? 1 : 0];
    });
    for (var i = 1; i <= 2; i++)
      $("player-name-" + i).textContent = tr("玩家 ", "PLAYER ") + i;
        var lastWifiRefresh = -1000;
    function updateWifi(refresh) {
      if (refresh && performance.now() - lastWifiRefresh >= 500) {
        lastWifiRefresh = performance.now();
        try { if (bridge) info = Object.assign({}, info, JSON.parse(bridge.getInfo())); } catch (_) {}
      }
      var wifi = info.wifiController || {}, address = (wifi.addresses || []).filter(function(v){return typeof v === 'string';}).join(' / ');
      var node = document.getElementById('puretv-address');
      if (!node) return;
      node.textContent = wifi.port > 0 && address ? address + ':' + wifi.port : tr('等待局域网地址', 'Waiting for LAN address');
      document.getElementById('puretv-status').textContent = (wifi.state === 'unavailable' ? (wifi.port > 0 ? tr('自动发现暂不可用，可按地址直连', 'Discovery unavailable; connect by address') : tr('手柄服务暂不可用，请重新打开游戏', 'Controller service unavailable; reopen game')) : wifi.connected ? tr('已连接 · START 开始 / 暂停', 'Connected · START begin / pause') : wifi.state === 'available' ? tr('同一网络，按手柄搜索键连接', 'Same network: press controller Search') : tr('正在准备手柄服务', 'Preparing controller service'));
      document.getElementById('puretv-help').textContent = tr('方向走动 · A/X 互动 · B 背包 · Y 工具/人数', 'Walk · A/X use · B bag · Y tool/players');
    }
    function updateRoom(value) {
      info = Object.assign({}, info, value); updateWifi();
      var ready = !!(info.qr && info.url);
      $("room-qr").hidden = !ready;
      $("qr-pending").hidden = ready;
      if (ready) {
        $("room-qr").src = info.qr;
        $("room-address").textContent = info.url.replace(/\?.*$/, "");
      } else {
        $("room-address").textContent = "";
        $("network-message").textContent =
          info.error ||
          tr("连接局域网后重新打开", "Connect to Wi-Fi and reopen");
      }
    }
    updateRoom(info);
    var game,
      renderer,
      sound,
      keys = new Set(),
      held = new Map(),
      pulse = { a: 0, b: 0, start: 0, select: 0 },
      keyboardActive = false,
      phoneControllerSeen = false,
      frame = 0,
      last = 0,
      lastPublish = 0,
      suspended = false,
      visible = !document.hidden,
      destroyed = false,
      drawFailed = false;
    function resize() {
      var panel = canvas.parentElement.parentElement,
        scale = Math.min(panel.clientWidth / 960, panel.clientHeight / 540),
        w = Math.max(1, Math.floor(960 * scale)),
        h = Math.max(1, Math.floor(540 * scale));
      canvas.parentElement.style.width = canvas.style.width = w + "px";
      canvas.parentElement.style.height = canvas.style.height = h + "px";
      var ratio = Math.min(root.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
    }
    root.addEventListener("resize", resize);
    resize();
    function actionFor(code) {
      if (code === "Start" || code === "p") return "start";
      if (code === "Select" || code === "Shift") return "select";
      if (code === "Enter")
        return game && game.phase !== "title" ? "a" : "start";
      if (code === " " || code === "z") return "a";
      if (code === "x" || code === "b") return "b";
      return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(
        code,
      ) >= 0
        ? code
        : null;
    }
    function releaseKeys() {
      keys.clear();
      held.clear();
      Object.keys(pulse).forEach(function (k) {
        pulse[k] = 0;
      });
    }
    function key(code, pressed) {
      var normalized = code.length === 1 ? code.toLowerCase() : code,
        action = held.get(normalized) || actionFor(normalized);
      if (!action) return;
      if (pressed) {
        if (!held.has(normalized)) {
          held.set(normalized, action);
          if (Object.prototype.hasOwnProperty.call(pulse, action))
            pulse[action] = performance.now() + 70;
        }
        keys.add(action);
        keyboardActive = true;
        if (sound) sound.unlock().catch(function () {});
      } else {
        held.delete(normalized);
        if (Array.from(held.values()).indexOf(action) < 0) keys.delete(action);
      }
    }
    root.PureTVQA = {snapshot: function () {
      var players = game && game.players ? game.players.map(function(player) {
        var copy = {};
        ['id','x','y','z','yaw','angle','facing','speed','movingSpeed','lateral','s','u','v','steerAngle','driftTime','drifting','driftCharge','boost','item','heldItem','inventory','tool','netRaised','weapon','ammo','grenades','fireCooldown','previous','lap','rank','connected','joined','active','cancelSeq','telemetry'].forEach(function(key){if (player[key] !== undefined) copy[key] = player[key];});
        return copy;
      }) : [];
      var model = {phase: game ? game.phase : 'loading', players: players};
      ['elapsed','raceTime','clock','countdown','stage','trackIndex','trackId','selectedPlayers','playerCount','kills','credits','eventSerial','events','projectiles','bullets'].forEach(function(key){if(game && game[key] !== undefined) model[key] = game[key];});
      var camera = renderer && renderer.camera;
      return JSON.parse(JSON.stringify({phase:model.phase,paused:!!(suspended || !visible || model.phase === 'paused'),controllerPaused:!!(game && model.phase === 'paused'),controllers:controllerAdapter.peek(),info:info,model:model,players:players,camera:camera && camera.matrixWorldInverse ? {projection:camera.projectionMatrix.elements,view:camera.matrixWorldInverse.elements} : null}));
    }};
    var controllerInputs = [], controllerAdapter = root.PureTVControllerAdapter.create({onCancel: function (event) { if (game && event.id > game.selectedPlayers) return false; if (!game || game.phase === "title") return false;
        game.cancelHeldActions(); game.manualPause = true; game.phase = "paused"; game.pausedReason = "manual"; releaseKeys(); return true; }});
    function inputs() {
      var list = [];
      try {
        if (bridge) list = JSON.parse(bridge.snapshot()).players || [];
      } catch (_) {}
      list = controllerAdapter.read(list); controllerInputs = list;
      list = list
        .filter(function (p) {
          return p && [1, 2].indexOf(Number(p.id)) >= 0;
        })
        .map(function (p) {
          return {
            id: Number(p.id), transport: p.transport, session: p.session,
            connected: !!p.connected,
            x: Number(p.x) || 0,
            y: Number(p.y) || 0,
            a: !!p.a,
            b: !!p.b,
            start: !!p.start,
            select: !!p.select,
            cancelSeq: Number.isSafeInteger(p.cancelSeq) && p.cancelSeq >= 0 ? p.cancelSeq : 0,
          };
        });
      var phoneConnected = list.some(function (p) {
        return p.id === 1 && p.connected;
      });
      if (phoneConnected) phoneControllerSeen = true;
      // A TV remote can start a solo game. Once a real phone has joined,
      // stale keyboard activity must not hide that phone disconnecting.
      if (keyboardActive && (!phoneControllerSeen || phoneConnected)) {
        var p = list.find(function (p) {
          return p.id === 1;
        });
        if (!p) {
          p = { id: 1, connected: true, x: 0, y: 0 };
          list.push(p);
        }
        p.connected = true;
        var x = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft")),
          y = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));
        p.x = x || p.x;
        p.y = y || p.y;
        ["a", "b", "start", "select"].forEach(function (action) {
          p[action] =
            p[action] || keys.has(action) || performance.now() < pulse[action];
        });
      }
      return list;
    }
    function state() {
      var s = game
        ? game.status()
        : { phase: "loading", selectedPlayers: 1, players: [] };
      if (suspended || !visible) s.phase = "paused";
      return s;
    }
    function publish() {
      try {
        if (bridge) bridge.publish(JSON.stringify(state()));
      } catch (_) {}
    }
    function updateUi(current) {
      updateWifi(true);
      root.PureTVControllerAdapter.renderClients($("controller-clients"), controllerAdapter.peek(), { language: english ? "en" : "zh" });
      if (game)
        $("music-button").textContent =
          tr("音乐：", "Music: ") +
          (game.muted ? tr("关", "off") : tr("开", "on"));
      for (var id = 1; id <= 2; id++) {
        var p = game && game.players[id - 1],
          controller = current.find(function (v) {
            return v.id === id;
          }),
          connected = !!(controller && controller.connected);
        $("player-" + id).classList.toggle("connected", connected);
        $("player-status-" + id).textContent = !connected
          ? tr("等待连接", "Waiting to connect")
          : !p || !p.joined
            ? tr("已连接 · 标题选择双人", "Connected · choose 2P at title")
            : tr("同时游玩 · 背包 ", "Playing together · Bag ") +
              root.CozyIslandGame.inventoryCount(p.inventory) +
              "/24";
      }
    }
    var roomTimer = root.setInterval(function () {
      if (!visible || destroyed || suspended) return;
      // A failed startup or draw leaves no animation frame to sample the room.
      if (!game || drawFailed) inputs();
      updateUi(controllerInputs);
    }, 200);
    updateUi(controllerInputs);
    function animate(now) {
      if (!visible || destroyed || drawFailed) return;
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      var current = inputs();
      try {
        if (!suspended) game.step(dt, current);
        renderer.draw(game);
      } catch (error) {
        drawFailed = true;
        if (sound) sound.pause(true);
        root.CozyIslandStartup.fail(error);
        return;
      }
      if (sound) {
        if (
          current.some(function (p) {
            return p.connected && (p.a || p.b || p.start || p.select);
          })
        )
          sound.unlock().catch(function () {});
        sound.pause(suspended || game.phase === "paused");
        sound.update(game);
      }
      if (now - lastPublish >= 200) {
        publish();
        lastPublish = now;
      }
      frame = root.requestAnimationFrame(animate);
    }
    function suspend(value) {
      suspended = !!value;
      releaseKeys();
      last = 0;
      if (game && suspended) game.cancelHeldActions();
      if (game) game.save();
      if (sound) sound.pause(suspended || !visible);
      publish();
    }
    root.CozyIslandTV = { controllerSnapshot: function () { return controllerAdapter.peek(); },
      key: key,
      updateRoom: updateRoom,
      suspend: suspend,
      get game() {
        return game;
      },
      get renderer() {
        return renderer;
      },
    };
    document.addEventListener("keydown", function (event) {
      if (
        actionFor(event.key.length === 1 ? event.key.toLowerCase() : event.key)
      ) {
        event.preventDefault();
        key(event.key, true);
      }
    });
    document.addEventListener("keyup", function (event) {
      key(event.key, false);
    });
    root.addEventListener("blur", function () {
      var hadA = keys.has("a") || performance.now() < pulse.a;
      releaseKeys();
      if (game && hadA && !controllerAdapter.peek().some(function (p) { return p.id === 1 && p.a; })) game.cancelHeldActions(1);
    });
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      releaseKeys();
      last = 0;
      root.cancelAnimationFrame(frame);
      if (game && !visible) game.cancelHeldActions();
      if (game) game.save();
      if (sound) sound.pause(!visible || suspended);
      publish();
      if (visible && game && !drawFailed && !destroyed)
        frame = root.requestAnimationFrame(animate);
    });
    root.addEventListener("pagehide", function () {
      destroyed = true;
      visible = false;
      root.cancelAnimationFrame(frame);
      root.clearInterval(roomTimer);
      releaseKeys();
      if (game) game.cancelHeldActions();
      if (game) game.save();
      if (sound) sound.dispose();
      if (renderer && renderer.dispose) renderer.dispose();
      root.removeEventListener("resize", resize);
    });
    try {
      var storage = null;
      try {
        storage = root.localStorage;
      } catch (_) {}
      game = new root.CozyIslandGame({
        language: info.language,
        storage: storage,
      });
      renderer = new root.CozyIslandRenderer(canvas);
      sound = new root.CozyIslandAudio();
      $("music-button").onclick = function () {
        game.toggleMusic();
        sound.unlock().catch(function () {});
        updateUi(controllerInputs);
      };
      renderer.draw(game);
      if (!$("game-loading").hasAttribute("data-failed"))
        $("game-loading").hidden = true;
      updateUi(controllerInputs);
      publish();
      if (visible) frame = root.requestAnimationFrame(animate);
    } catch (error) {
      drawFailed = true;
      root.CozyIslandStartup.fail(error);
    }
    return root.CozyIslandTV;
  };
})(window);
