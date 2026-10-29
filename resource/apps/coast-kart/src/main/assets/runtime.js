/* TV bridge polling stays alive independently of game loading and rendering. */
(function (root) {
  "use strict";
  root.startCoastKart = function () {
    var $ = function (id) {
        return document.getElementById(id);
      },
      bridge = root.CoastKartHost,
      canvas = $("battlefield"),
      keys = {},
      mapping = {},
      pulse = { a: 0, b: 0, start: 0, select: 0 },
      keyboardActive = false,
      phoneControllerSeen = false,
      phoneHoldingA = false,
      info = { language: "zh", url: "", qr: "" },
      game = null,
      renderer = null,
      sound = null,
      frame = 0,
      last = 0,
      suspended = false,
      visible = !document.hidden,
      destroyed = false,
      renderFailed = false;
    try {
      if (bridge) info = JSON.parse(bridge.getInfo());
    } catch (_) {}
    var english = String(info.language).indexOf("en") === 0;
    function tr(zh, en) {
      return english ? en : zh;
    }
    document.documentElement.lang = english ? "en" : "zh-CN";
    var labels = {
      "join-label": ["手机手柄", "PHONE CONTROLLERS"],
      "lan-label": ["同一局域网", "SAME NETWORK"],
      "scan-title": ["扫码，一起出发", "Scan. Join. Race."],
      "scan-description": [
        "无需安装手机应用\n手机和电视连接同一路由器",
        "No phone app needed\nConnect to the same router as the TV",
      ],
      "menu-help": [
        "标题：↔ 赛道 · ↕ 模式\nSELECT 单人 / 双人 · START 开始 / 暂停",
        "Title: ↔ circuit · ↕ mode\nSELECT 1P / 2P · START begin / pause",
      ],
      "move-label": ["转向 / 刹车", "STEER / BRAKE"],
      "a-label": ["道具", "ITEM"],
      "b-label": ["漂移", "DRIFT"],
      "footer-left": [
        "海岸卡丁车 TV · 独创赛道与车手",
        "COAST KART TV · ORIGINAL CIRCUITS & RACERS",
      ],
      "footer-right": [
        "返回：退出 · 播放键：START",
        "Back: exit · Play: START",
      ],
    };
    Object.keys(labels).forEach(function (id) {
      $(id).textContent = labels[id][english ? 1 : 0];
    });
    for (var id = 1; id <= 2; id++)
      $("player-name-" + id).textContent = tr("车手 " + id, "RACER " + id);
    function updateRoom(value) {
      info = Object.assign({}, info, value || {});
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
          tr(
            "连接局域网后重新打开游戏",
            "Connect to a local network and reopen the game",
          );
      }
    }
    function resize() {
      var panel = canvas.parentElement.parentElement,
        scale = Math.min(panel.clientWidth / 960, panel.clientHeight / 540),
        w = Math.floor(960 * scale),
        h = Math.floor(540 * scale);
      canvas.parentElement.style.width = canvas.style.width = w + "px";
      canvas.parentElement.style.height = canvas.style.height = h + "px";
    }
    updateRoom(info);
    root.addEventListener("resize", resize);
    resize();
    function actionFor(code) {
      if (code === "Start" || code === "p") return "start";
      if (code === "Select" || code === "Shift") return "select";
      if (code === "Enter")
        return game && ["title", "results", "ending"].indexOf(game.phase) >= 0
          ? "start"
          : "a";
      if (code === " " || code === "z" || code === "a") return "a";
      if (code === "x" || code === "b") return "b";
      return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(
        code,
      ) >= 0
        ? code
        : null;
    }
    function key(code, pressed) {
      if (destroyed) return;
      code = code.length === 1 ? code.toLowerCase() : code;
      var action = mapping[code] || actionFor(code);
      if (!action) return;
      if (pressed) {
        if (!mapping[code]) {
          mapping[code] = action;
          if (Object.prototype.hasOwnProperty.call(pulse, action))
            pulse[action] = performance.now() + 70;
        }
        keys[action] = true;
        keyboardActive = true;
        if (sound) sound.unlock().catch(function () {});
      } else {
        delete mapping[code];
        if (
          !Object.keys(mapping).some(function (k) {
            return mapping[k] === action;
          })
        )
          delete keys[action];
      }
    }
    function release() {
      var activeA = !!keys.a || pulse.a > performance.now();
      // Refresh the native source in this event, not the preceding animation
      // frame: a phone press/release can race a local window blur.
      if (activeA) inputs();
      // Cancel only a local A release; direction/B cleanup and a continuing
      // phone A must not retract another input source's held item.
      if (activeA && !phoneHoldingA && game && game.players[0]) game.cancelItem(game.players[0]);
      keys = {};
      mapping = {};
      Object.keys(pulse).forEach(function (k) {
        pulse[k] = 0;
      });
    }
    function inputs() {
      var list = [];
      try {
        if (bridge) list = JSON.parse(bridge.snapshot()).players || [];
      } catch (_) {}
      list = list
        .filter(function (p) {
          return p && (Number(p.id) === 1 || Number(p.id) === 2);
        })
        .map(function (p) {
          return {
            id: Number(p.id),
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
      var player = list.filter(function (p) {
        return p.id === 1;
      })[0];
      if (player && player.connected) phoneControllerSeen = true;
      phoneHoldingA = !!(player && player.connected && player.a);
      // Remote-only play is available until a real P1 phone joins. After that,
      // local menu keys must never hide that participating phone disconnecting.
      if (
        keyboardActive &&
        (!phoneControllerSeen || (player && player.connected))
      ) {
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
        player.x =
          Number(!!keys.ArrowRight) - Number(!!keys.ArrowLeft) || player.x;
        player.y =
          Number(!!keys.ArrowDown) - Number(!!keys.ArrowUp) || player.y;
        ["a", "b", "start", "select"].forEach(function (k) {
          player[k] = player[k] || !!keys[k] || performance.now() < pulse[k];
        });
      }
      return list;
    }
    function updateUi(current) {
      if (game)
        $("music-button").textContent =
          tr("音乐：", "MUSIC: ") +
          (game.muted ? tr("关", "OFF") : tr("开", "ON"));
      [1, 2].forEach(function (id) {
        var controller = current.filter(function (p) {
            return p.id === id;
          })[0],
          connected = !!(controller && controller.connected),
          p = game && game.players[id - 1],
          text;
        $("player-" + id).classList.toggle("connected", connected);
        if (!connected) text = tr("等待连接", "Waiting to connect");
        else if (!game) text = tr("已连接", "Connected");
        else if (game.phase === "title")
          text =
            game.modeIndex === 2 && id === 2
              ? tr("计时挑战仅限单人", "Time trial is solo")
              : tr("已连接 · ", "Connected · ") +
                (id <= game.selectedPlayers
                  ? tr("准备就绪", "READY")
                  : tr("SELECT 开启双人", "SELECT for 2P"));
        else if (!p.joined)
          text = tr("已连接 · 观看比赛", "Connected · Watching");
        else if (p.finished) text = tr("冲线 · 第 ", "Finished · #") + p.rank;
        else
          text =
            tr("第 ", "#") +
            p.rank +
            tr(" 名 · 第 ", " · LAP ") +
            Math.min(3, p.lap) +
            "/3";
        $("player-status-" + id).textContent = text;
      });
    }
    function publish() {
      if (!bridge) return;
      try {
        bridge.publish(
          JSON.stringify(
            game
              ? game.status()
              : {
                  game: "coast-kart",
                  phase: "title",
                  selectedPlayers: 1,
                  players: [],
                },
          ),
        );
      } catch (_) {}
    }
    // Keep QR/controller state and publication functioning even after draw/setup failure.
    var roomTimer = root.setInterval(function () {
      if (destroyed) return;
      var current = inputs();
      updateUi(current);
      publish();
    }, 200);
    updateUi(inputs());
    function suspend(value) {
      suspended = !!value;
      release();
      last = 0;
      if (game) {
        if (suspended) game.pause("background");
        else if (visible && game.pauseReason === "background") game.resume();
        publish();
      }
      if (sound)
        sound.pause(
          suspended || !visible || !!(game && game.phase === "paused"),
        );
    }
    function animate(now) {
      if (destroyed || !visible || renderFailed) return;
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      var current = inputs();
      try {
        if (!suspended) game.step(dt, current);
        renderer.draw(game);
        if (sound) {
          if (
            current.some(function (p) {
              return p.connected && (p.start || p.a || p.b || p.select);
            })
          )
            sound.unlock().catch(function () {});
          sound.pause(suspended || game.phase === "paused");
          sound.update(game);
        }
      } catch (error) {
        renderFailed = true;
        if (sound) sound.pause(true);
        root.CoastKartStartup.fail(error);
        return;
      }
      frame = root.requestAnimationFrame(animate);
    }
    root.CoastKartTV = {
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
      var code = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (actionFor(code)) {
        event.preventDefault();
        key(event.key, true);
      }
    });
    document.addEventListener("keyup", function (event) {
      key(event.key, false);
    });
    root.addEventListener("blur", release);
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      release();
      last = 0;
      root.cancelAnimationFrame(frame);
      if (!visible) {
        if (game) game.pause("background");
        if (sound) sound.pause(true);
        publish();
      } else {
        if (game && !suspended && game.pauseReason === "background")
          game.resume();
        if (game && !renderFailed && !destroyed)
          frame = root.requestAnimationFrame(animate);
      }
    });
    root.addEventListener("pagehide", function () {
      destroyed = true;
      visible = false;
      root.cancelAnimationFrame(frame);
      root.clearInterval(roomTimer);
      release();
      if (sound) sound.dispose();
      root.removeEventListener("resize", resize);
    });
    try {
      var records = {},
        muted = false;
      try {
        records =
          JSON.parse(localStorage.getItem("coast-kart-tv-records") || "{}") ||
          {};
        muted = localStorage.getItem("coast-kart-tv-muted") === "true";
      } catch (_) {}
      if (typeof records !== "object" || Array.isArray(records)) records = {};
      game = new root.CoastKartGame({
        language: String(info.language),
        records: records,
        muted: muted,
        saveRecords: function (value) {
          try {
            localStorage.setItem(
              "coast-kart-tv-records",
              JSON.stringify(value),
            );
          } catch (_) {}
        },
        saveMuted: function (value) {
          try {
            localStorage.setItem("coast-kart-tv-muted", String(value));
          } catch (_) {}
        },
      });
      $("music-button").onclick = function () {
        game.toggleMusic();
        if (sound) sound.unlock().catch(function () {});
        updateUi(inputs());
      };
      renderer = new root.CoastKartRenderer(canvas);
      sound = new root.CoastKartAudio();
      renderer.draw(game);
      if (!$("game-loading").hasAttribute("data-failed"))
        $("game-loading").hidden = true;
      updateUi(inputs());
      publish();
      if (visible) frame = root.requestAnimationFrame(animate);
    } catch (error) {
      renderFailed = true;
      if (sound) sound.pause(true);
      root.CoastKartStartup.fail(error);
    }
    return root.CoastKartTV;
  };
})(window);
