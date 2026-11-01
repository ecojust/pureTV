/* Local TV runtime. Phone inputs and room updates remain independent of drawing. */
(function (root) {
  "use strict";
  root.startAlienShooter = function () {
    var $ = function (id) { return document.getElementById(id); };
    var canvas = $("battlefield"), bridge = root.AlienShooterHost;
    var info = { language: "zh", url: "", qr: "" };
    try { if (bridge) info = Object.assign(info, JSON.parse(bridge.getInfo())); } catch (_) {}
    if (!bridge) {
      try { if (new URLSearchParams(root.location.search).get("lang") === "en") info.language = "en"; } catch (_) {}
    }
    var english = String(info.language).indexOf("en") === 0;
    var tr = function (zh, en) { return english ? en : zh; };
    var text = function (value) {
      if (Array.isArray(value)) return String(value[english ? 1 : 0] || value[0] || "");
      return value == null ? "" : String(value);
    };
    var esc = function (value) { return text(value).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); };
    var num = function (value, fallback) { return typeof value === "number" && isFinite(value) ? value : (fallback || 0); };
    var clamp = function (value, lo, hi) { return Math.max(lo, Math.min(hi, value)); };
    var game, renderer, sound, frame = 0, last = 0, accumulator = 0, lastUi = -1000, lastPublish = -1000;
    var suspended = false, visible = !document.hidden, destroyed = false, failed = false;
    var keys = new Set(), held = new Map(), pending = { a: false, b: false, start: false, select: false };
    var keyboardActive = false, phoneControllerSeen = false, localCancel = 0;
    var pointer = { held: false, id: null, x: 0, y: 0, time: -10000 };
    var currentInputs = [], menuHtml = "", hudHtml = "", roomHtml = "", lastPhase = "";
    var mapContext = $("tactical-map").getContext("2d");
    var graphicsLost = false;
    var muted = false;
    try { muted = root.localStorage.getItem("alien-shooter-muted") === "1"; } catch (_) {}
    document.documentElement.lang = english ? "en" : "zh-CN";
    document.title = tr("孤胆枪手 TV", "Alien Shooter TV");
    canvas.setAttribute("aria-label", tr("孤胆枪手游戏场景", "Alien Shooter game scene"));
    $("hud").setAttribute("aria-label", tr("战斗状态", "Combat status"));
    $("room-qr").alt = tr("手机手柄连接二维码", "Phone controller QR code");
    $("loading-title").textContent = tr("正在进入封锁区…", "Entering the quarantine zone…");
    $("room-heading").textContent = tr("手机即手柄", "YOUR PHONE IS THE CONTROLLER");
    $("scan-title").textContent = tr("扫码，加入战斗", "Scan. Join the fight.");
    $("scan-description").textContent = tr("手机与电视连接同一 Wi-Fi", "Connect your phone to the TV’s Wi-Fi");
    $("move-guide").textContent = tr("移动", "MOVE");
    $("fire-guide").textContent = tr("射击", "FIRE");
    $("grenade-guide").textContent = tr("手雷", "GRENADE");
    $("room-note").textContent = tr("左侧任意位置移动 · 右上按住开火、拖动瞄准 · 右下投掷手雷", "Move anywhere on the left. Hold the upper right to fire; drag to aim. Lower right: grenade.");
    $("menu-footer-help").textContent = tr("方向键 / WASD 移动 · Z 射击 · X 手雷 · SELECT 切换", "Arrows / WASD move · Z fire · X grenade · SELECT switch");
    $("enemy-label").textContent = tr("当前威胁", "HOSTILES");
    $("tactical-label").textContent = tr("战术地图", "TACTICAL MAP");
    $("tactical-map").setAttribute("aria-label", tr("墙体、闸门、玩家与当前目标的战术地图", "Tactical map showing walls, gates, your position and the current objective"));
    $("pause-button").setAttribute("aria-label", tr("暂停", "Pause"));
    $("battle-help").textContent = tr("SELECT 切换武器  ·  START 暂停 / 扫码", "SELECT switch weapon  ·  START pause / QR code");

    function updateRoom(value) {
      if (destroyed) return;
      info = Object.assign({}, info, value || {});
      var ready = !!(info.qr && info.url);
      $("room-qr").hidden = !ready;
      $("qr-pending").hidden = ready;
      if (ready) {
        $("room-qr").src = info.qr;
        $("room-address").textContent = String(info.url).replace(/\?.*$/, "");
      } else {
        $("room-address").textContent = "";
        $("network-message").textContent = info.error || (bridge ? tr("正在创建局域网房间…", "Creating a local room…") : tr("电视端启动后显示二维码", "QR code appears on the TV app"));
      }
    }
    updateRoom(info);

    function weaponName(id) {
      var weapons = root.AlienShooterWorld && root.AlienShooterWorld.weapons || [];
      var weapon = weapons.find(function (value) { return value.id === id; });
      return weapon ? text(weapon.name) : String(id || "");
    }
    function timeLabel(seconds) {
      seconds = Math.max(0, Math.floor(num(seconds)));
      return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
    }
    function actionFor(code, nativeInput) {
      if (code === "Confirm") return game && (game.phase === "playing" || game.phase === "shop") ? "a" : "start";
      if (code === "Grenade") return "b";
      if (code === "Enter" && nativeInput && game && (game.phase === "playing" || game.phase === "shop")) return "a";
      if (code === "Start" || code === "Enter" || code === "p" || code === "Escape") return "start";
      if (code === "Select" || code === "Shift" || code === "q") return "select";
      if (code === " " || code === "z") return "a";
      if (code === "x" || code === "g" || code === "b") return "b";
      if (code === "w" || code === "ArrowUp") return "up";
      if (code === "s" || code === "ArrowDown") return "down";
      if (code === "a" || code === "ArrowLeft") return "left";
      if (code === "d" || code === "ArrowRight") return "right";
      return null;
    }
    function unlock() { if (sound) sound.unlock().catch(function () {}); }
    function key(code, pressed, nativeInput) {
      if (destroyed || failed) return;
      var normalized = code.length === 1 ? code.toLowerCase() : code;
      var action = held.get(normalized) || actionFor(normalized, nativeInput);
      if (!action) return;
      if (pressed) {
        if (!held.has(normalized) && Object.prototype.hasOwnProperty.call(pending, action)) pending[action] = true;
        held.set(normalized, action);
        keys.add(action);
        keyboardActive = true;
        unlock();
      } else {
        held.delete(normalized);
        if (Array.from(held.values()).indexOf(action) < 0) keys.delete(action);
      }
    }
    function releaseKeys() {
      keys.clear(); held.clear();
      Object.keys(pending).forEach(function (k) { pending[k] = false; });
      pointer.held = false; pointer.id = null; pointer.time = -10000;
      localCancel++;
    }
    function requestAction(action) {
      if (destroyed || failed) return;
      keyboardActive = true;
      pending[action] = true;
      unlock();
    }
    function inputs() {
      var list = [];
      try { if (bridge) list = JSON.parse(bridge.snapshot()).players || []; } catch (_) {}
      list = list.filter(function (p) { return p && Number(p.id) === 1; }).map(function (p) {
        return { id: Number(p.id), connected: !!p.connected, x: clamp(num(p.x), -1, 1), y: clamp(num(p.y), -1, 1), aimX: clamp(num(p.aimX), -1, 1), aimY: clamp(num(p.aimY), -1, 1), a: !!p.a, b: !!p.b, start: !!p.start, select: !!p.select, cancelSeq: Number.isSafeInteger(p.cancelSeq) && p.cancelSeq >= 0 ? p.cancelSeq : 0 };
      });
      var local = list[0];
      var phoneConnected = !!(local && local.connected);
      if (phoneConnected) phoneControllerSeen = true;
      // Old keyboard activity must never fabricate a reconnect after the phone drops out.
      if (keyboardActive && (!phoneControllerSeen || phoneConnected)) {
        if (!local) { local = { id: 1, connected: true, x: 0, y: 0, aimX: 0, aimY: 0, a: false, b: false, start: false, select: false, cancelSeq: 0 }; list.push(local); }
        local.connected = true;
        var x = Number(keys.has("right")) - Number(keys.has("left"));
        var y = Number(keys.has("down")) - Number(keys.has("up"));
        local.x = x || local.x; local.y = y || local.y;
        ["a", "b", "start", "select"].forEach(function (action) { local[action] = local[action] || keys.has(action) || pending[action]; });
        local.a = local.a || pointer.held;
        if (renderer && renderer.screenToWorld && game && (pointer.held || performance.now() - pointer.time < 1800)) {
          var player = game.players && game.players[0];
          var point = renderer.screenToWorld(pointer.x, pointer.y);
          if (player && point) {
            var dx = point.x - player.x, dy = point.y - player.y, length = Math.hypot(dx, dy);
            if (length > .15) { local.aimX = dx / length; local.aimY = dy / length; }
          }
        }
      }
      // A short local press survives slow rendering until one simulation read.
      // Clear even without a recipient so it cannot replay after reconnecting.
      Object.keys(pending).forEach(function (action) { pending[action] = false; });
      list.forEach(function (p) { p.cancelSeq += localCancel; });
      return list;
    }
    function state() {
      if (!game) return { phase: "loading", selectedPlayers: 1, players: [] };
      return { phase: suspended || !visible ? "paused" : game.phase, selectedPlayers: 1, stage: game.stage + 1, stageLabel: text(game.map && game.map.name), wave: game.wave, kills: game.kills, credits: game.credits, players: (game.players || []).map(function (p) {
        var ammo = p.ammo && p.ammo[p.weapon];
        return { id: p.id, active: !!p.active, alive: !!p.alive, hp: Math.ceil(num(p.hp)), armor: Math.ceil(num(p.armor)), weapon: p.weapon, weaponName: weaponName(p.weapon), ammo: ammo == null ? -1 : ammo, grenades: p.grenades, score: p.score };
      }) };
    }
    function publish() { try { if (bridge) bridge.publish(JSON.stringify(state())); } catch (_) {} }
    function updateRoomPlayers(current) {
      var controller = current.find(function (p) { return p.id === 1; });
      var connected = !!(controller && controller.connected);
      var value = '<div class="room-player' + (connected ? ' connected' : '') + '"><span class="player-tag">LINK</span><strong>' + esc(tr("手机手柄", "CONTROLLER")) + '</strong><span>' + esc(connected ? tr("已就绪", "READY") : tr("等待连接", "WAITING")) + '</span></div>';
      if (value !== roomHtml) { $("room-players").innerHTML = value; roomHtml = value; }
    }
    function titleMenu() {
      return '<div class="title-kicker">' + esc(tr("封锁区 · 03", "QUARANTINE SECTOR · 03")) + '</div><h1 class="game-title"><span class="title-line">' + tr("孤胆", "ALIEN") + '</span><span class="title-line">' + tr("枪手", "SHOOTER") + '</span></h1><div class="title-english">' + tr("ALIEN SHOOTER / TV", "SURVIVE. REARM. BREAK THROUGH.") + '</div><p class="title-description">' + esc(tr("基地失去联络，异形正从黑暗中涌出。带上武器，重启控制系统，独自杀出一条撤离路线。", "The base has gone silent. Hostiles are pouring out of the dark. Arm up, restore the control systems and fight your way to extraction, alone.")) + '</p><div class="mission-tags"><span>' + esc(tr("三段战役", "3-STAGE CAMPAIGN")) + '</span><span>' + esc(tr("五种武器", "5 WEAPONS")) + '</span><span>' + esc(tr("单人行动", "SINGLE PLAYER")) + '</span></div><div class="title-actions"><button type="button" class="primary wide" id="start-button" data-action="start"><span>' + esc(tr("进入封锁区", "ENTER THE ZONE")) + '</span><em>START / ENTER</em></button><p class="start-hint">' + esc(game.noticeTime > 0 && text(game.notice) ? text(game.notice) : tr("连接一部手机即可开始，也可用遥控器或键盘游玩。", "Connect one phone to begin, or use a TV remote or keyboard.")) + '</p></div>';
    }
    function pauseMenu() {
      var disconnected = game.pausedReason === "disconnected";
      return '<span class="eyebrow">' + esc(tr("行动暂停", "MISSION PAUSED")) + '</span><h1 class="dialog-title">' + esc(disconnected ? tr("等待手柄连接", "CONTROLLER DISCONNECTED") : tr("喘口气，再继续", "TAKE A BREATHER")) + '</h1><p class="dialog-description">' + esc(disconnected ? tr("手柄已断开，战斗已暂停。重新连接后按 START 继续，当前进度保留。", "A controller disconnected. The fight is paused. Reconnect, then press START to continue where you left off.") : tr("战斗已暂停。你可以在右侧扫码连接手柄，准备好后继续行动。", "The fight is paused. Scan the code to connect a controller, then resume when you are ready.")) + '</p><div class="end-stats"><div class="end-stat"><span>' + esc(tr("已消灭", "ELIMINATED")) + '</span><strong>' + game.kills + '</strong></div><div class="end-stat"><span>' + esc(tr("行动用时", "TIME")) + '</span><strong>' + timeLabel(game.elapsed) + '</strong></div><div class="end-stat"><span>' + esc(tr("补给资金", "CREDITS")) + '</span><strong>' + game.credits + '</strong></div></div><div class="dialog-actions"><button type="button" id="resume-button" class="primary" data-action="start">' + esc(tr("继续行动", "RESUME MISSION")) + '</button></div><p class="dialog-hint">' + esc(tr("START / ENTER 继续 · SELECT 切枪 · 右下区域投掷手雷", "START / ENTER resumes · SELECT switches weapons · Lower-right zone throws grenades")) + '</p>';
    }
    function shopMenu() {
      var shop = game.shop || { items: [], selected: 0 };
      var items = shop.items || [];
      return '<span class="eyebrow">' + esc(tr("区域肃清 · 补给站", "SECTOR CLEAR · REARM")) + '</span><div class="shop-top"><h1 class="dialog-title">' + esc(tr("整备，深入基地", "REARM & ADVANCE")) + '</h1><span class="shop-balance">¤ ' + game.credits + '</span></div><p class="shop-intro">' + esc(tr("补充弹药、修复护甲或更换火力，为下一段行动做好准备。", "Restock ammunition, repair armor or upgrade your firepower before the next sector.")) + '</p><div class="shop-grid">' + items.map(function (item, index) {
        return '<button type="button" class="shop-item' + (shop.selected === index ? ' selected' : '') + (game.credits < item.price ? ' unaffordable' : '') + '" data-action="buy" data-index="' + index + '" aria-label="' + esc(text(item.name) + ', ' + item.price) + '" aria-pressed="' + (shop.selected === index) + '"><strong>' + esc(item.name) + '</strong><p>' + esc(item.description) + '</p><span>¤ ' + item.price + '</span></button>';
      }).join("") + '</div><p class="shop-notice" role="status">' + (game.noticeTime > 0 ? esc(game.notice) : '&nbsp;') + '</p><div class="shop-bottom"><span>' + esc(tr("方向 / SELECT 选购 · 射击键购买\nSTART / 手雷键前往下一关", "Directions / SELECT browse · Fire buys\nSTART / grenade advances")) + '</span><button type="button" class="primary" id="continue-button" data-action="continue">' + esc(tr("前往下一区域", "NEXT SECTOR")) + '</button></div>';
    }
    function endMenu() {
      var win = game.phase === "victory";
      return '<span class="eyebrow">' + esc(win ? tr("任务完成", "MISSION COMPLETE") : tr("行动终止", "MISSION FAILED")) + '</span><h1 class="dialog-title">' + esc(win ? tr("封锁解除，活着归来", "YOU MADE IT OUT") : tr("防线失守", "OVERRUN")) + '</h1><p class="dialog-description">' + esc(win ? tr("反应堆已恢复控制，撤离通道安全。那些没能走出黑暗的人，会记得这次行动。", "The reactor is under control and the extraction route is clear. The quarantine is over. You survived.") : tr("异形突破了最后的防线。重新整备，保持移动，利用掩体和手雷打破包围。", "The hostiles broke through. Regroup, keep moving and use cover and grenades to break the encirclement.")) + '</p><div class="end-stats"><div class="end-stat"><span>' + esc(tr("消灭敌人", "ELIMINATED")) + '</span><strong>' + game.kills + '</strong></div><div class="end-stat"><span>' + esc(tr("行动用时", "TIME")) + '</span><strong>' + timeLabel(game.elapsed) + '</strong></div><div class="end-stat"><span>' + esc(tr("到达区域", "SECTOR")) + '</span><strong>0' + (game.stage + 1) + '</strong></div></div><div class="dialog-actions"><button type="button" class="primary" id="restart-button" data-action="start">' + esc(tr("返回行动准备", "BACK TO BRIEFING")) + '</button></div><p class="dialog-hint">START / ENTER</p>';
    }
    function updateMenus() {
      var phase = game.phase;
      var menu = phase === "title" ? titleMenu() : phase === "paused" ? pauseMenu() : phase === "shop" ? shopMenu() : phase === "victory" || phase === "gameover" ? endMenu() : "";
      var shown = phase !== "playing";
      $("menu-layer").hidden = !shown;
      $("menu-layer").setAttribute("data-dialog", phase !== "title" ? "true" : "false");
      $("game-shell").setAttribute("data-phase", phase);
      $("hud").hidden = phase === "title" || phase === "shop" || phase === "victory" || phase === "gameover";
      if (menu !== menuHtml) {
        var focused = document.activeElement;
        var action = focused && focused.dataset ? focused.dataset.action : null;
        var index = focused && focused.dataset ? focused.dataset.index : null;
        var id = focused && focused.id;
        $("menu-content").innerHTML = menu; menuHtml = menu;
        if (action) {
          var next = id ? $(id) : $("menu-content").querySelector('[data-action="' + action + '"]' + (index == null ? '' : '[data-index="' + index + '"]'));
          if (next && next.focus) next.focus({ preventScroll: true });
        }
      }
      if (phase !== lastPhase) { lastPhase = phase; pointer.held = false; }
    }
    function updateHud() {
      var map = game.map || {}, objectives = map.objectives || [];
      var objective = objectives[game.objectiveIndex] || objectives.find(function (value) { return value.status !== "done"; });
      var labels = { locked: ["寻找控制台", "FIND THE CONSOLE"], ready: ["靠近控制台", "APPROACH THE CONSOLE"], charging: ["保持在控制台附近", "STAY NEAR THE CONSOLE"], defending: ["守住阵地", "HOLD YOUR GROUND"], done: ["目标完成", "OBJECTIVE COMPLETE"] };
      $("stage-number").textContent = tr("封锁区 ", "SECTOR ") + "0" + (game.stage + 1) + " / 03";
      $("stage-name").textContent = text(map.name);
      $("objective-label").textContent = game.extractionReady ? tr("撤离通道已开放", "EXTRACTION ROUTE OPEN") : text(labels[objective && objective.status] || labels.ready);
      $("objective-name").textContent = game.extractionReady ? tr("前往绿色撤离标记", "REACH THE GREEN EXTRACTION MARKER") : text(objective && objective.name) || tr("清理基地", "CLEAR THE BASE");
      $("objective-progress").style.width = Math.round(game.extractionReady ? 100 : clamp(num(objective && objective.progress), 0, 1) * 100) + "%";
      $("enemy-count").textContent = String((game.enemies || []).filter(function (enemy) { return enemy.hp > 0; }).length);
      $("credits-hud").textContent = "¤ " + game.credits + "  ·  " + timeLabel(game.elapsed);
      $("combat-notice").hidden = !(game.phase === "playing" && game.noticeTime > 0 && text(game.notice));
      $("combat-notice").textContent = text(game.notice);
      var value = (game.players || []).filter(function (p) { return p.active; }).map(function (p) {
        var health = clamp(num(p.hp) / Math.max(1, num(p.maxHp, 100)), 0, 1), ammo = p.ammo && p.ammo[p.weapon];
        return '<section class="player-hud" data-player="1"><div class="player-hud-header"><strong>' + esc(tr("突击队员", "OPERATOR")) + '</strong><span>' + esc(p.connected ? tr("已连接", "CONNECTED") : tr("连接中断", "DISCONNECTED")) + '</span></div><div class="health-line"><span>HP</span><div class="health-meter' + (health < .3 ? ' low' : '') + '"><i style="width:' + Math.round(health * 100) + '%"></i></div><b>' + Math.ceil(num(p.hp)) + '/' + p.maxHp + '</b></div><div class="armor-line">' + esc(tr("护甲 ", "ARMOR ")) + Math.ceil(num(p.armor)) + ' · ' + esc(tr("得分 ", "SCORE ")) + num(p.score) + '</div><div class="weapon-line"><span class="weapon-name">' + esc(weaponName(p.weapon)) + '</span><span class="weapon-ammo">' + (ammo == null || ammo < 0 ? '∞' : ammo) + '<small>' + esc(tr("发", "RDS")) + '</small></span></div><div class="grenade-count">' + esc(tr("手雷 × ", "GRENADES × ")) + num(p.grenades) + '</div></section>';
      }).join("");
      if (value !== hudHtml) { $("players-hud").innerHTML = value; hudHtml = value; }
      drawTacticalMap(objective);
    }
    // Small, screen-aligned navigation aid. Called with the HUD at most ten times a second.
    function drawTacticalMap(objective) {
      if (!mapContext || !game.map) return;
      var map = game.map, c = mapContext, width = c.canvas.width, height = c.canvas.height;
      var target = game.extractionReady ? map.exit : objective;
      var active = (game.players || []).filter(function (p) { return p.active; });
      var distances = active.map(function (p) { return target ? Math.hypot(target.x - p.x, target.y - p.y) : 0; });
      var distance = distances.length ? Math.round(Math.min.apply(Math, distances)) : 0;
      $("tactical-distance").textContent = target ? distance + " m" : "";
      $("tactical-target").textContent = game.extractionReady ? tr("绿色标记 · 撤离", "GREEN MARKER · EXTRACT") : text(objective && objective.name) || tr("探索基地", "EXPLORE THE BASE");
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, width, height);
      c.fillStyle = "#071115"; c.fillRect(0, 0, width, height);
      c.save(); c.scale(width / map.width, height / map.height);
      c.strokeStyle = "#8ba99b12"; c.lineWidth = .12;
      for (var x = 4; x < map.width; x += 4) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, map.height); c.stroke(); }
      for (var y = 4; y < map.height; y += 4) { c.beginPath(); c.moveTo(0, y); c.lineTo(map.width, y); c.stroke(); }
      (map.solids || []).forEach(function (solid) { c.fillStyle = solid.type === "wall" ? "#728b82" : "#3d534e"; c.fillRect(solid.x, solid.y, solid.w, solid.h); });
      (map.doors || []).forEach(function (door) { c.fillStyle = door.open ? "#489c7966" : "#d8aa57"; c.fillRect(door.x - .1, door.y - .1, door.w + .2, door.h + .2); });
      (map.objectives || []).forEach(function (point) { c.fillStyle = point.status === "done" ? "#6ba889" : "#6b795e"; c.fillRect(point.x - .4, point.y - .4, .8, .8); });
      (game.enemies || []).forEach(function (enemy) { if (enemy.hp > 0) { c.fillStyle = "#cf7569"; c.beginPath(); c.arc(enemy.x, enemy.y, enemy.type === "boss" ? .85 : .33, 0, Math.PI * 2); c.fill(); } });
      if (target) {
        c.strokeStyle = game.extractionReady ? "#8aefaa" : "#f5cf77"; c.lineWidth = .3;
        c.strokeRect(target.x - 1.15, target.y - 1.15, 2.3, 2.3);
        c.fillStyle = game.extractionReady ? "#8aefaa" : "#f5cf77"; c.fillRect(target.x - .45, target.y - .45, .9, .9);
      }
      active.forEach(function (p) {
        c.fillStyle = p.alive ? "#9bffe0" : "#f08370";
        c.strokeStyle = "#06120d"; c.lineWidth = .2;
        c.beginPath(); c.arc(p.x, p.y, .7, 0, Math.PI * 2); c.fill(); c.stroke();
        c.strokeStyle = c.fillStyle; c.lineWidth = .25; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + Math.cos(p.angle) * 1.7, p.y + Math.sin(p.angle) * 1.7); c.stroke();
      });
      c.restore();
    }
    function updateUi(current) {
      if (!game || destroyed) return;
      updateRoomPlayers(current); updateMenus(); updateHud();
      $("sound-button").textContent = tr("声音：", "SOUND: ") + (muted ? tr("关", "OFF") : tr("开", "ON"));
      $("sound-button").setAttribute("aria-pressed", String(!muted));
    }
    function resize() {
      if (renderer && renderer.resize) renderer.resize(root.innerWidth, root.innerHeight);
    }
    function fail(error) {
      failed = true;
      if (sound) sound.pause(true);
      if (root.AlienShooterStartup) root.AlienShooterStartup.fail(error);
      else { $("game-loading").hidden = false; $("loading-title").textContent = tr("游戏启动失败", "Game could not start"); $("loading-detail").textContent = String(error && error.message || error); }
    }
    function animate(now) {
      if (!visible || destroyed || failed) return;
      var dt = last ? clamp((now - last) / 1000, 0, .0834) : 0;
      last = now;
      try {
        if (renderer.failed) throw new Error(renderer.error || tr("图形显示无法启动，请检查电视的 WebView 或重新打开游戏。", "Graphics could not start. Check the TV WebView or reopen the game."));
        if (renderer.contextLost) {
          if (!graphicsLost) { graphicsLost = true; releaseKeys(); game.pause("graphics"); }
          accumulator = 0;
          $("graphics-status").hidden = false;
          $("graphics-status").textContent = tr("图形显示中断，战斗已暂停，正在等待恢复…", "Graphics interrupted. Combat is paused while the display recovers…");
        } else {
          if (graphicsLost) {
            graphicsLost = false;
            $("graphics-status").textContent = tr("图形显示已恢复，按 START 继续行动。", "Graphics restored. Press START to resume the mission.");
          }
          $("graphics-status").hidden = game.phase !== "paused" || game.pausedReason !== "graphics";
        }
        if (!suspended && !renderer.contextLost) {
          accumulator += dt;
          var steps = 0;
          while (accumulator >= 1 / 60 && steps < 5) {
            currentInputs = inputs();
            if (currentInputs.some(function (p) { return p.connected && (p.a || p.b || p.start || p.select); })) unlock();
            game.update(1 / 60, currentInputs); accumulator -= 1 / 60; steps++;
          }
          if (steps === 5) accumulator = 0;
        }
        renderer.render(game, dt);
        if (sound) {
          if (currentInputs.some(function (p) { return p.connected && (p.a || p.b || p.start || p.select); })) unlock();
          sound.setMuted(muted);
          sound.pause(suspended || !visible || game.phase !== "playing");
          sound.update(game);
        }
        if (now - lastUi >= 100) { updateUi(currentInputs); lastUi = now; }
        if (now - lastPublish >= 200) { publish(); lastPublish = now; }
      } catch (error) { fail(error); return; }
      frame = root.requestAnimationFrame(animate);
    }
    function suspend(value) {
      suspended = !!value; $("game-shell").classList.toggle("native-suspended", suspended); releaseKeys(); last = 0; accumulator = 0;
      if (game && suspended && game.pause) game.pause("hidden");
      if (sound) sound.pause(suspended || !visible);
      if (game) updateUi(currentInputs);
      publish();
    }
    function onKeyDown(event) {
      var code = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (actionFor(code)) { event.preventDefault(); key(event.key, true); }
    }
    function onKeyUp(event) { key(event.key, false); }
    function onBlur() {
      var localWasActive = keys.size > 0 || pointer.held;
      releaseKeys();
      if (game && localWasActive && !bridge && game.pause) game.pause("hidden");
    }
    function onVisibility() {
      visible = !document.hidden; releaseKeys(); last = 0; accumulator = 0;
      root.cancelAnimationFrame(frame);
      if (!visible && game && game.pause) game.pause("hidden");
      if (sound) sound.pause(!visible || suspended);
      publish();
      if (visible && game && !failed && !destroyed) frame = root.requestAnimationFrame(animate);
    }
    function locatePointer(event) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      pointer.y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
      pointer.time = performance.now();
    }
    function onPointerDown(event) {
      if (!game || game.phase !== "playing" || (event.button !== 0 && event.pointerType === "mouse")) return;
      event.preventDefault(); locatePointer(event); pointer.held = true; pending.a = true; pointer.id = event.pointerId; keyboardActive = true;
      try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
      unlock();
    }
    function onPointerMove(event) { if (event.pointerType === "mouse" || pointer.id === event.pointerId) locatePointer(event); }
    function onPointerUp(event) { if (pointer.id === event.pointerId) { pointer.held = false; pointer.id = null; } }
    function onPointerCancel(event) { if (pointer.id === event.pointerId) { pointer.held = false; pointer.id = null; pointer.time = -10000; localCancel++; } }
    function onContextMenu(event) { event.preventDefault(); }
    function onMenuClick(event) {
      var button = event.target.closest("button[data-action]");
      if (!button || !game || destroyed) return;
      unlock();
      if (button.dataset.action === "start") requestAction("start");
      else if (button.dataset.action === "continue" && game.phase === "shop") game.continueCampaign();
      else if (button.dataset.action === "buy" && game.phase === "shop") { var index = Number(button.dataset.index); if (Number.isInteger(index)) { game.shop.selected = index; game.buy(index); } }
      updateUi(currentInputs);
    }
    function toggleSound() {
      muted = !muted; unlock();
      if (sound) sound.setMuted(muted);
      try { root.localStorage.setItem("alien-shooter-muted", muted ? "1" : "0"); } catch (_) {}
      updateUi(currentInputs);
    }
    function dispose() {
      if (destroyed) return;
      destroyed = true; visible = false; releaseKeys(); root.cancelAnimationFrame(frame); root.clearInterval(roomTimer);
      if (sound) sound.dispose();
      if (renderer && renderer.dispose) renderer.dispose();
      root.removeEventListener("resize", resize); root.removeEventListener("blur", onBlur); root.removeEventListener("pagehide", dispose);
      document.removeEventListener("keydown", onKeyDown); document.removeEventListener("keyup", onKeyUp); document.removeEventListener("visibilitychange", onVisibility); document.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("pointerdown", onPointerDown); canvas.removeEventListener("pointermove", onPointerMove); canvas.removeEventListener("pointerup", onPointerUp); canvas.removeEventListener("pointercancel", onPointerCancel); canvas.removeEventListener("lostpointercapture", onPointerCancel);
      $("menu-content").removeEventListener("click", onMenuClick); $("sound-button").removeEventListener("click", toggleSound);
    }
    root.AlienShooterTV = { key: function (code, pressed) { key(code, pressed, true); }, updateRoom: updateRoom, suspend: suspend, dispose: dispose, get game() { return game; }, get renderer() { return renderer; } };
    root.addEventListener("resize", resize); root.addEventListener("blur", onBlur); root.addEventListener("pagehide", dispose);
    document.addEventListener("keydown", onKeyDown); document.addEventListener("keyup", onKeyUp); document.addEventListener("visibilitychange", onVisibility); document.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("pointerdown", onPointerDown); canvas.addEventListener("pointermove", onPointerMove); canvas.addEventListener("pointerup", onPointerUp); canvas.addEventListener("pointercancel", onPointerCancel); canvas.addEventListener("lostpointercapture", onPointerCancel);
    $("menu-content").addEventListener("click", onMenuClick); $("sound-button").addEventListener("click", toggleSound);
    $("pause-button").onclick = function () { requestAction("start"); };
    var roomTimer = root.setInterval(function () { if (visible && !suspended && !destroyed && game) updateRoomPlayers(currentInputs); }, 250);
    try {
      game = new root.AlienShooterGame({ language: info.language, seed: Date.now() >>> 0 });
      renderer = new root.AlienShooterRenderer(canvas, { language: info.language });
      sound = new root.AlienShooterAudio(); sound.setMuted(muted); resize();
      renderer.render(game, 0);
      if (renderer.failed || !renderer.active) throw new Error(renderer.error || tr("此设备暂时无法运行 WebGL 图形，请更新电视的 WebView 后重试。", "This device could not start WebGL graphics. Update the TV WebView and try again."));
      updateUi(currentInputs); publish();
      if (!$("game-loading").hasAttribute("data-failed")) $("game-loading").hidden = true;
      if (visible) frame = root.requestAnimationFrame(animate);
    } catch (error) { fail(error); }
    return root.AlienShooterTV;
  };
})(window);
