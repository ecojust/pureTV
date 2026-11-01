/* Deterministic, bounded local combat simulation; no rendering or network access. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./world.js'));
  else root.AlienShooterGame = factory(root.AlienShooterWorld);
})(typeof window !== 'undefined' ? window : this, function (World) {
  'use strict';
  var STEP = 1 / 60, LIMITS = { enemies: 48, bullets: 180, particles: 180, decals: 96, pickups: 64, grenades: 10, events: 64 };
  var weaponById = {};
  World.weapons.forEach(function (w) { weaponById[w.id] = w; });
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function finite(v, fallback) { return typeof v === 'number' && isFinite(v) ? v : fallback; }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function segmentCircle(ax, ay, bx, by, cx, cy, r) {
    var dx = bx - ax, dy = by - ay, fx = ax - cx, fy = ay - cy, a = dx * dx + dy * dy;
    if (fx * fx + fy * fy <= r * r) return 0;
    if (a < 1e-12) return Infinity;
    var b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - r * r, d = b * b - 4 * a * c;
    if (d < 0) return Infinity;
    var t = (-b - Math.sqrt(d)) / (2 * a);
    return t >= 0 && t <= 1 ? t : Infinity;
  }
  function segmentRect(ax, ay, bx, by, r, padding) {
    var low = 0, high = 1, dx = bx - ax, dy = by - ay;
    var origins = [ax, ay], directions = [dx, dy], mins = [r.x - padding, r.y - padding], maxs = [r.x + r.w + padding, r.y + r.h + padding];
    for (var i = 0; i < 2; i++) {
      if (Math.abs(directions[i]) < 1e-10) { if (origins[i] < mins[i] || origins[i] > maxs[i]) return Infinity; }
      else {
        var a = (mins[i] - origins[i]) / directions[i], b = (maxs[i] - origins[i]) / directions[i];
        low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b));
        if (high < low) return Infinity;
      }
    }
    return low >= 0 && low <= 1 ? low : Infinity;
  }
  function player(id) {
    return { id: id, active: id === 1, connected: false, x: 0, y: 0, radius: .38, angle: -Math.PI / 2,
      hp: 100, maxHp: 100, armor: 40, weapon: 'pistol', owned: ['pistol'], ammo: { pistol: -1, smg: 0, shotgun: 0, minigun: 0, plasma: 0 },
      grenades: 3, alive: true, downed: false, reviveProgress: 0, moving: false, fireFlash: 0, hitFlash: 0, score: 0,
      fireCooldown: 0, invulnerable: 1.5, dryCooldown: 0, damageTimer: 0 };
  }
  class AlienShooterGame {
    constructor(options) {
      options = options || {};
      this.language = String(options.language || 'zh').indexOf('en') === 0 ? 'en' : 'zh';
      this.randomState = (finite(options.seed, 19790503) >>> 0) || 1;
      this.phase = 'title'; this.pausedReason = ''; this.selectedPlayers = 1; this.participantIds = [1]; this.players = [player(1), player(2)];
      this.stage = 0; this.wave = 0; this.kills = 0; this.credits = 0; this.elapsed = 0; this.stageElapsed = 0;
      this.events = []; this.serial = 0; this.eventSerial = 0; this.notice = ['', '']; this.noticeTime = 0;
      this.shop = { selected: 0, items: World.shopItems }; this._controls = {}; this._accumulator = 0; this._navTimer = 0;
      this._inputs = []; this._shopRepeat = 0;
      this.loadStage(0);
    }
    tr(zh, en) { return this.language === 'en' ? en : zh; }
    random() { var x = this.randomState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.randomState = x >>> 0; return (x >>> 0) / 4294967296; }
    id() { return ++this.serial; }
    emit(kind, object, extra) {
      var e = Object.assign({ id: ++this.eventSerial, kind: kind, x: object ? object.x : 0, y: object ? object.y : 0, playerId: object && this.players.indexOf(object) >= 0 ? object.id : null }, extra || {});
      this.events.push(e); if (this.events.length > LIMITS.events) this.events.shift();
    }
    message(zh, en) { this.notice = [zh, en]; this.noticeTime = 3.5; }
    loadStage(index) {
      this.stage = index; this.map = copy(World.stages[index]); this.objectiveIndex = 0; this.wave = 0; this.extractionReady = false;
      this.enemies = []; this.bullets = []; this.grenades = []; this.particles = []; this.decals = []; this.pickups = [];
      this.waveRemaining = 0; this.bossPending = false; this.spawnTimer = 0; this.stageElapsed = 0; this._navTimer = 0; this._flows = {};
      this.players.forEach(function (p, i) {
        p.x = this.map.spawn.x + (this.selectedPlayers === 2 ? (i === 0 ? -.7 : .7) : 0); p.y = this.map.spawn.y;
        p.active = this.participantIds.indexOf(p.id) >= 0; p.alive = true; p.downed = false; p.reviveProgress = 0; p.hp = Math.max(p.hp, Math.round(p.maxHp * .5));
        p.angle = -Math.PI / 2; p.fireCooldown = 0; p.fireFlash = 0; p.invulnerable = 2; p.moving = false;
      }, this);
      this.rebuildNavigation();
      for (var n = 0; n < 7 + index * 2; n++) this.spawnEnemy(n % 4 === 0 ? 'runner' : 'crawler', 0);
      this.addPickup('health', this.map.spawn.x + 2, this.map.spawn.y, 35);
      this.addPickup('ammo', this.map.spawn.x - 2, this.map.spawn.y, 1);
    }
    start(count) {
      if (this.phase !== 'title') return false;
      this.selectedPlayers = count === 2 ? 2 : 1;
      this.participantIds = this.selectedPlayers === 2 ? [1, 2] : [(this._inputs.find(function (i) { return i.connected; }) || { id: 1 }).id];
      this.players = [player(1), player(2)];
      this.players.forEach(function (p) { p.connected = !!(this._inputs.find(function (i) { return i.id === p.id; }) || {}).connected; }, this);
      this.kills = 0; this.credits = 0; this.elapsed = 0; this.events = []; this._accumulator = 0; this.shop.selected = 0;
      this.loadStage(0); this.phase = 'playing'; this.pausedReason = ''; this.message('靠近亮起的控制台恢复电力', 'Approach the lit console to restore power');
      return true;
    }
    pause(reason) {
      if (this.phase !== 'playing') return false;
      this.phase = 'paused'; this.pausedReason = reason || 'manual'; this._accumulator = 0;
      this.players.forEach(function (p) { p.moving = false; p.fireFlash = 0; });
      return true;
    }
    connected() { return this.players.filter(function (p) { return p.active; }).every(function (p) { return p.connected; }); }
    resume() {
      if (this.phase !== 'paused') return false;
      if (!this.connected()) { this.message('等待所有队员的手柄重新连接', 'Waiting for every squad controller to reconnect'); return false; }
      this.phase = 'playing'; this.pausedReason = ''; this._accumulator = 0; return true;
    }
    readInputs(inputs) {
      var self = this, actions = ['a', 'b', 'start', 'select'];
      this._inputs = [1, 2].map(function (id) {
        var raw = Array.isArray(inputs) ? inputs.find(function (p) { return p && p.id === id; }) || {} : {};
        var memory = self._controls[id] || (self._controls[id] = { seen: false, everConnected: false, seq: 0, connected: false, previous: {}, blocked: {} });
        var seq = Math.max(0, Math.floor(finite(raw.cancelSeq, 0))), online = raw.connected === true;
        var cancelled = memory.seen && (seq !== memory.seq || (online && !memory.connected && memory.everConnected));
        var p = { id: id, connected: online, x: online && !cancelled ? clamp(finite(raw.x, 0), -1, 1) : 0, y: online && !cancelled ? clamp(finite(raw.y, 0), -1, 1) : 0,
          aimX: online && !cancelled ? clamp(finite(raw.aimX, 0), -1, 1) : 0, aimY: online && !cancelled ? clamp(finite(raw.aimY, 0), -1, 1) : 0, edges: {}, cancelSeq: seq };
        actions.forEach(function (key) {
          if (cancelled && raw[key]) memory.blocked[key] = true;
          if (!raw[key]) memory.blocked[key] = false;
          p[key] = online && !cancelled && !memory.blocked[key] && raw[key] === true;
          p.edges[key] = p[key] && !memory.previous[key]; memory.previous[key] = p[key];
        });
        memory.seq = seq; memory.connected = online; memory.seen = true; memory.everConnected = memory.everConnected || online;
        self.players[id - 1].connected = online;
        return p;
      });
      return this._inputs;
    }
    update(dt, inputs) {
      dt = clamp(finite(dt, 0), 0, .1);
      var controls = this.readInputs(inputs), authorized = this.phase === 'title' ? controls : controls.filter(function (i) { return this.players[i.id - 1].active; }, this);
      var start = authorized.some(function (i) { return i.edges.start; }), select = authorized.some(function (i) { return i.edges.select; });
      this.noticeTime = Math.max(0, this.noticeTime - dt);
      if (this.phase === 'title') {
        if (select) this.selectedPlayers = this.selectedPlayers === 1 ? 2 : 1;
        if (start) {
          if (controls.filter(function (i) { return i.connected; }).length >= this.selectedPlayers) this.start(this.selectedPlayers);
          else this.message('请先连接所选人数的手机手柄', 'Connect a controller for each selected player');
        }
        return;
      }
      if (this.phase === 'victory' || this.phase === 'gameover') {
        if (start) { this.phase = 'title'; this.selectedPlayers = 1; this.participantIds = [1]; this.players = [player(1), player(2)]; this.loadStage(0); }
        return;
      }
      if (this.phase === 'shop') { this.updateShop(dt, authorized); return; }
      if (this.phase === 'paused') { if (start) this.resume(); return; }
      if (!this.connected()) { this.pause('disconnected'); return; }
      if (start) { this.pause('manual'); return; }
      controls.forEach(function (input) {
        var p = this.players[input.id - 1]; if (!p.active || p.downed) return;
        if (input.edges.select) this.cycleWeapon(p);
        if (input.edges.b) this.throwGrenade(p);
      }, this);
      this._accumulator = Math.min(.15, this._accumulator + dt);
      while (this._accumulator >= STEP && this.phase === 'playing') { this.step(STEP); this._accumulator -= STEP; }
    }
    cycleWeapon(p) { p.weapon = p.owned[(p.owned.indexOf(p.weapon) + 1) % p.owned.length]; this.emit('weapon', p, { weapon: p.weapon }); }
    updateShop(dt, controls) {
      this._shopRepeat = Math.max(0, this._shopRepeat - dt);
      var selected = controls.find(function (i) { return i.connected && (Math.abs(i.y) > .5 || Math.abs(i.x) > .5 || i.edges.select); });
      if (selected && (selected.edges.select || this._shopRepeat === 0)) {
        var direction = selected.edges.select || (Math.abs(selected.y) > .5 ? selected.y : selected.x) > 0 ? 1 : -1;
        this.shop.selected = (this.shop.selected + direction + this.shop.items.length) % this.shop.items.length; this._shopRepeat = .22;
      }
      if (controls.some(function (i) { return i.edges.a; })) this.buy();
      if (controls.some(function (i) { return i.edges.start || i.edges.b; })) this.continueCampaign();
    }
    buy(index) {
      if (this.phase !== 'shop') return false;
      index = index === undefined ? this.shop.selected : index;
      var item = this.shop.items[index]; if (!item) return false;
      if (this.credits < item.price) { this.message('补给点数不足', 'Not enough supply credits'); this.emit('deny'); return false; }
      if (item.kind === 'vitality' && this.players.filter(function (p) { return p.active; }).every(function (p) { return p.maxHp >= 200; })) { this.message('生存强化已达上限', 'Survival training is already at maximum'); return false; }
      this.credits -= item.price;
      this.players.filter(function (p) { return p.active; }).forEach(function (p) {
        if (item.kind === 'weapon') { if (p.owned.indexOf(item.weapon) < 0) p.owned.push(item.weapon); p.ammo[item.weapon] = Math.min(2000, p.ammo[item.weapon] + weaponById[item.weapon].capacity); p.weapon = item.weapon; }
        if (item.kind === 'health') p.hp = p.maxHp;
        if (item.kind === 'armor') p.armor = 100;
        if (item.kind === 'ammo') p.owned.forEach(function (id) { if (id !== 'pistol') p.ammo[id] = Math.min(2000, p.ammo[id] + weaponById[id].capacity); });
        if (item.kind === 'grenades') p.grenades = Math.min(12, p.grenades + 3);
        if (item.kind === 'vitality') { p.maxHp = Math.min(200, p.maxHp + 25); p.hp = p.maxHp; }
      });
      this.message('补给已分配给全队', 'Supplies delivered to the entire squad'); this.emit('buy'); return true;
    }
    continueCampaign() {
      if (this.phase !== 'shop' || this.stage >= 2) return false;
      if (!this.connected()) { this.message('等待队员重新连接后再出发', 'Reconnect all squad controllers before continuing'); return false; }
      this.loadStage(this.stage + 1); this.phase = 'playing'; this._accumulator = 0; this.message('前往亮起的任务控制台', 'Reach the illuminated mission console'); return true;
    }
    solidRects() { return this.map.solids.concat(this.map.doors.filter(function (d) { return !d.open; })); }
    blocked(x, y, radius) {
      radius = radius === undefined ? .38 : radius;
      if (x < radius || y < radius || x > this.map.width - radius || y > this.map.height - radius) return true;
      return this.solidRects().some(function (r) {
        var nx = clamp(x, r.x, r.x + r.w), ny = clamp(y, r.y, r.y + r.h);
        return (x - nx) * (x - nx) + (y - ny) * (y - ny) < radius * radius;
      });
    }
    wallHit(ax, ay, bx, by, padding) { return this.solidRects().reduce(function (hit, r) { return Math.min(hit, segmentRect(ax, ay, bx, by, r, padding || 0)); }, Infinity); }
    circleWallHit(ax, ay, bx, by, radius) {
      // The rounded rectangle is the exact swept-circle obstacle. A square
      // expansion falsely seals diagonal gaps that a round body can traverse.
      return this.solidRects().reduce(function (hit, r) {
        if (segmentRect(ax, ay, bx, by, r, radius) === Infinity) return hit;
        hit = Math.min(hit, segmentRect(ax, ay, bx, by, { x: r.x - radius, y: r.y, w: r.w + radius * 2, h: r.h }, 0));
        hit = Math.min(hit, segmentRect(ax, ay, bx, by, { x: r.x, y: r.y - radius, w: r.w, h: r.h + radius * 2 }, 0));
        return Math.min(hit, segmentCircle(ax, ay, bx, by, r.x, r.y, radius), segmentCircle(ax, ay, bx, by, r.x + r.w, r.y, radius), segmentCircle(ax, ay, bx, by, r.x, r.y + r.h, radius), segmentCircle(ax, ay, bx, by, r.x + r.w, r.y + r.h, radius));
      }, Infinity);
    }
    lineOfSight(a, b) { return this.wallHit(a.x, a.y, b.x, b.y, .02) === Infinity; }
    move(entity, dx, dy) {
      var n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / .18));
      for (var i = 0; i < n; i++) {
        if (!this.blocked(entity.x + dx / n, entity.y, entity.radius)) entity.x += dx / n;
        if (!this.blocked(entity.x, entity.y + dy / n, entity.radius)) entity.y += dy / n;
      }
    }
    rebuildNavigation() {
      this._walkableByRadius = {}; this._flows = {}; this._navTimer = 0;
    }
    clearanceGrid(radius) {
      radius = radius === undefined ? .38 : radius;
      var key = radius.toFixed(2), grid = this._walkableByRadius[key];
      if (grid) return grid;
      var width = this.map.width, height = this.map.height; grid = new Uint8Array(width * height);
      for (var y = 0; y < height; y++) for (var x = 0; x < width; x++) grid[y * width + x] = this.blocked(x + .5, y + .5, radius) ? 0 : 1;
      this._walkableByRadius[key] = grid; return grid;
    }
    flowFor(p, radius) {
      var width = this.map.width, height = this.map.height, flow = new Int16Array(width * height); flow.fill(-1);
      var grid = this.clearanceGrid(radius), start = clamp(Math.floor(p.y), 0, height - 1) * width + clamp(Math.floor(p.x), 0, width - 1), queue = new Int16Array(width * height), head = 0, end = 1;
      // Large aliens approach the nearest location their body can occupy even
      // when a human stands in a narrow nook. Do not seed across a solid wall.
      if (!grid[start]) {
        var best = Infinity, candidate = -1;
        for (var iy = Math.max(0, Math.floor(p.y) - 3); iy <= Math.min(height - 1, Math.floor(p.y) + 3); iy++) for (var ix = Math.max(0, Math.floor(p.x) - 3); ix <= Math.min(width - 1, Math.floor(p.x) + 3); ix++) {
          var square = (ix + .5 - p.x) * (ix + .5 - p.x) + (iy + .5 - p.y) * (iy + .5 - p.y);
          if (grid[iy * width + ix] && square < best && this.wallHit(ix + .5, iy + .5, p.x, p.y, 0) === Infinity) { best = square; candidate = iy * width + ix; }
        }
        if (candidate < 0) return flow; start = candidate;
      }
      queue[0] = start; flow[start] = 0;
      while (head < end) {
        var at = queue[head++], x = at % width, y = Math.floor(at / width), candidates = [];
        if (x > 0) candidates.push(at - 1); if (x < width - 1) candidates.push(at + 1); if (y > 0) candidates.push(at - width); if (y < height - 1) candidates.push(at + width);
        for (var i = 0; i < candidates.length; i++) { var next = candidates[i]; if (grid[next] && flow[next] < 0) { flow[next] = flow[at] + 1; queue[end++] = next; } }
      }
      return flow;
    }
    spawnEnemy(type, zone) {
      if (this.enemies.length >= LIMITS.enemies) return false;
      var spec = World.enemyTypes[type], points = this.map.spawnPoints[zone], live = this.players.filter(function (p) { return p.active && !p.downed; });
      var ranked = points.map(function (p) { var pos = { x: p[0], y: p[1] }; return { x: pos.x, y: pos.y, distance: Math.min.apply(null, live.map(function (human) { return distance(pos, human); })) }; }).sort(function (a, b) { return b.distance - a.distance; });
      var pos = null;
      for (var attempt = 0; attempt < 20; attempt++) {
        var point = ranked[Math.floor(this.random() * Math.min(3, ranked.length))], x = point.x + (this.random() - .5) * 2, y = point.y + (this.random() - .5) * 2;
        if (!this.blocked(x, y, spec.radius) && live.every(function (p) { return Math.hypot(p.x - x, p.y - y) > 3.2; })) { pos = { x: x, y: y }; break; }
      }
      if (!pos) return false;
      var hp = Math.round(spec.hp * (this.selectedPlayers === 2 ? 1.4 : 1) * (1 + this.stage * .1));
      this.enemies.push({ id: this.id(), type: type, x: pos.x, y: pos.y, radius: spec.radius, angle: 0, hp: hp, maxHp: hp, speed: spec.speed, damage: spec.damage, attackCooldown: .7 + this.random(), hitFlash: 0, summoned: 0, moving: true }); return true;
    }
    waveType() {
      var r = this.random();
      if (this.stage > 0 && r < .12 + this.stage * .035) return 'brute';
      if ((this.stage > 0 || this.objectiveIndex > 0) && r < .30) return 'spitter';
      return r > .65 ? 'runner' : 'crawler';
    }
    step(dt) {
      this.elapsed += dt; this.stageElapsed += dt; this._navTimer -= dt;
      this.players.forEach(function (p) { this.stepPlayer(p, this._inputs[p.id - 1], dt); }, this);
      if (this._navTimer <= 0) {
        this._flows = {};
        this.enemies.forEach(function (e) {
          var key = e.radius.toFixed(2);
          if (!this._flows[key]) this._flows[key] = this.players.map(function (p) { return p.active && !p.downed ? this.flowFor(p, e.radius) : null; }, this);
        }, this);
        this._navTimer = .35;
      }
      this.stepEnemies(dt); this.stepBullets(dt); this.stepGrenades(dt); this.stepPickups(dt); this.stepObjectives(dt); this.stepRevive(dt);
      this.particles.forEach(function (p) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .94; p.vy *= .94; });
      this.particles = this.particles.filter(function (p) { return p.life > 0; });
      if (this.players.filter(function (p) { return p.active; }).every(function (p) { return p.downed; })) { this.phase = 'gameover'; this.emit('gameover'); }
    }
    stepPlayer(p, input, dt) {
      if (!p.active) return;
      p.fireCooldown = Math.max(0, p.fireCooldown - dt); p.fireFlash = Math.max(0, p.fireFlash - dt); p.hitFlash = Math.max(0, p.hitFlash - dt);
      p.invulnerable = Math.max(0, p.invulnerable - dt); p.dryCooldown = Math.max(0, p.dryCooldown - dt); p.damageTimer = Math.max(0, p.damageTimer - dt);
      if (p.downed) { p.moving = false; return; }
      var x = input.x, y = input.y, magnitude = Math.hypot(x, y); if (magnitude > 1) { x /= magnitude; y /= magnitude; }
      if (magnitude < .13) { x = 0; y = 0; }
      var speed = p.weapon === 'minigun' && input.a ? 3.0 : 4.6, dx = x * speed * dt, dy = y * speed * dt;
      var ally = this.players.find(function (q) { return q.active && q.id !== p.id && !q.downed; });
      // A finite tether keeps both humans legible in the shared television view.
      if (ally && Math.hypot(p.x + dx - ally.x, p.y + dy - ally.y) > 13 && (p.x - ally.x) * dx + (p.y - ally.y) * dy > 0) { dx = 0; dy = 0; }
      var beforeX = p.x, beforeY = p.y; this.move(p, dx, dy); p.moving = Math.hypot(p.x - beforeX, p.y - beforeY) > .001;
      if (Math.hypot(input.aimX, input.aimY) > .2) p.angle = Math.atan2(input.aimY, input.aimX);
      else if (input.a) {
        var target = null, best = 15;
        this.enemies.forEach(function (e) { var d = distance(p, e); if (d < best && this.lineOfSight(p, e)) { best = d; target = e; } }, this);
        if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x); else if (magnitude > .13) p.angle = Math.atan2(y, x);
      } else if (magnitude > .13) p.angle = Math.atan2(y, x);
      if (input.a && p.fireCooldown <= 0) this.shoot(p);
    }
    shoot(p) {
      var spec = weaponById[p.weapon];
      if (p.weapon !== 'pistol' && p.ammo[p.weapon] <= 0) {
        if (p.dryCooldown <= 0) { p.dryCooldown = 1; this.message('弹药耗尽，已切换手枪', 'Out of ammunition — switched to pistol'); }
        p.weapon = 'pistol'; spec = weaponById.pistol;
      }
      if (this.bullets.length + spec.pellets > LIMITS.bullets) return;
      if (p.weapon !== 'pistol') p.ammo[p.weapon]--;
      p.fireCooldown = spec.interval; p.fireFlash = .085;
      for (var i = 0; i < spec.pellets; i++) {
        var angle = p.angle + (this.random() - .5) * spec.spread * 2, x = p.x + Math.cos(p.angle) * .5, y = p.y + Math.sin(p.angle) * .5;
        // Muzzle clearance is checked by the same segment collision as the projectile.
        this.bullets.push({ id: this.id(), type: p.weapon, x: p.x, y: p.y, prevX: p.x, prevY: p.y, vx: Math.cos(angle) * spec.speed, vy: Math.sin(angle) * spec.speed, owner: p.id, enemy: false, damage: spec.damage, life: p.weapon === 'shotgun' ? .34 : .75, splash: spec.splash || 0, radius: p.weapon === 'plasma' ? .12 : .045 });
      }
      this.emit('shot', p, { weapon: p.weapon });
      this.effect('muzzle', p.x + Math.cos(p.angle) * .55, p.y + Math.sin(p.angle) * .55, 3, spec.color, .08, .12);
    }
    throwGrenade(p) {
      if (p.grenades <= 0 || this.grenades.length >= LIMITS.grenades) return;
      p.grenades--;
      this.grenades.push({ id: this.id(), x: p.x, y: p.y, vx: Math.cos(p.angle) * 7.5, vy: Math.sin(p.angle) * 7.5, age: 0, fuse: 1.05, owner: p.id, radius: .13 });
      this.emit('grenade', p);
    }
    stepEnemies(dt) {
      var live = this.players.filter(function (p) { return p.active && !p.downed; }), buckets = new Map();
      this.enemies.forEach(function (e) { var key = Math.floor(e.x / 2) + ',' + Math.floor(e.y / 2); if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(e); });
      this.enemies.forEach(function (e) {
        if (!live.length || e.hp <= 0) return;
        e.hitFlash = Math.max(0, e.hitFlash - dt); e.attackCooldown = Math.max(0, e.attackCooldown - dt);
        var target = live.reduce(function (a, b) { return distance(e, a) < distance(e, b) ? a : b; }), d = distance(e, target), clear = this.lineOfSight(e, target), tx = target.x, ty = target.y;
        if (this.circleWallHit(e.x, e.y, target.x, target.y, e.radius) !== Infinity) {
          var key = e.radius.toFixed(2);
          if (!this._flows[key]) this._flows[key] = this.players.map(function (p) { return p.active && !p.downed ? this.flowFor(p, e.radius) : null; }, this);
          var flow = this._flows[key][target.id - 1], cx = Math.floor(e.x), cy = Math.floor(e.y), best = flow ? flow[cy * this.map.width + cx] : -1;
          // Align inside the current cell before turning around a wall corner.
          // Without this waypoint a valid lower-cost neighbor can be hidden by
          // the expanded corner, leaving an alien stopped at the diagonal.
          tx = cx + .5; ty = cy + .5;
          for (var yy = cy - 1; yy <= cy + 1; yy++) for (var xx = cx - 1; xx <= cx + 1; xx++) {
            if (xx < 0 || yy < 0 || xx >= this.map.width || yy >= this.map.height || !flow) continue;
            var cost = flow[yy * this.map.width + xx];
            if (cost >= 0 && (best < 0 || cost < best) && !this.blocked(xx + .5, yy + .5, e.radius) && this.circleWallHit(e.x, e.y, xx + .5, yy + .5, e.radius) === Infinity) { best = cost; tx = xx + .5; ty = yy + .5; }
          }
          if (this.blocked(tx, ty, e.radius)) { tx = e.x; ty = e.y; }
        }
        var ranged = e.type === 'spitter' || e.type === 'boss', stop = clear && (d < e.radius + target.radius + .18 || (ranged && d < (e.type === 'boss' ? 8 : 6.5)));
        var vx = tx - e.x, vy = ty - e.y, length = Math.hypot(vx, vy), speed = e.speed;
        if (length > .03) { vx = vx / length * speed; vy = vy / length * speed; e.angle = Math.atan2(target.y - e.y, target.x - e.x); } else { vx = 0; vy = 0; }
        if (stop) { vx = 0; vy = 0; }
        var bx = Math.floor(e.x / 2), by = Math.floor(e.y / 2);
        for (var sy = by - 1; sy <= by + 1; sy++) for (var sx = bx - 1; sx <= bx + 1; sx++) {
          (buckets.get(sx + ',' + sy) || []).forEach(function (other) {
            if (other === e) return; var ox = e.x - other.x, oy = e.y - other.y, separation = Math.hypot(ox, oy), limit = e.radius + other.radius;
            if (separation > .001 && separation < limit) { var push = (limit - separation) * 2.8; vx += ox / separation * push; vy += oy / separation * push; }
          });
        }
        e.moving = Math.hypot(vx, vy) > .05; this.move(e, vx * dt, vy * dt);
        if (clear && e.attackCooldown <= 0) {
          if (ranged && d < 13) {
            var count = e.type === 'boss' ? 7 : 1;
            for (var n = 0; n < count && this.bullets.length < LIMITS.bullets; n++) {
              var angle = e.angle + (n - (count - 1) / 2) * .14;
              this.bullets.push({ id: this.id(), type: 'acid', x: e.x, y: e.y, prevX: e.x, prevY: e.y, vx: Math.cos(angle) * 7.5, vy: Math.sin(angle) * 7.5, owner: e.id, enemy: true, damage: e.damage, life: 2, radius: .16 });
            }
            e.attackCooldown = e.type === 'boss' ? 1.6 : 2.2; this.emit('acid', e);
          } else if (d < e.radius + target.radius + .25) { this.damagePlayer(target, e.damage); e.attackCooldown = e.type === 'runner' ? .85 : 1.1; }
        }
        if (e.type === 'boss') { e.summoned += dt; if (e.summoned > 9 && this.enemies.length < 30) { e.summoned = 0; for (var j = 0; j < 4; j++) this.spawnEnemy('runner', 2); this.emit('roar', e); } }
      }, this);
    }
    stepBullets(dt) {
      var survivors = [];
      this.bullets.forEach(function (b) {
        if (b.life <= 0) return;
        b.prevX = b.x; b.prevY = b.y; var nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
        var hit = this.wallHit(b.x, b.y, nx, ny, b.radius || .04), target = null, barrel = null;
        var candidates = b.enemy ? this.players.filter(function (p) { return p.active && !p.downed; }) : this.enemies;
        candidates.forEach(function (p) { var t = segmentCircle(b.x, b.y, nx, ny, p.x, p.y, p.radius + (b.radius || .04)); if (t < hit) { hit = t; target = p; barrel = null; } });
        if (!b.enemy) this.map.barrels.forEach(function (p) { if (p.exploded) return; var t = segmentCircle(b.x, b.y, nx, ny, p.x, p.y, p.radius); if (t < hit) { hit = t; barrel = p; target = null; } });
        if (hit !== Infinity) {
          b.x += (nx - b.x) * hit; b.y += (ny - b.y) * hit;
          if (target) { if (b.enemy) this.damagePlayer(target, b.damage); else this.damageEnemy(target, b.damage, b.owner); }
          if (barrel) { barrel.hp -= b.damage; if (barrel.hp <= 0) this.explodeBarrel(barrel, b.owner); }
          if (b.splash) this.explode(b.x, b.y, b.splash, b.damage * .65, b.owner, false);
          this.effect(b.enemy ? 'acid' : 'spark', b.x, b.y, 4, b.enemy ? '#aeef55' : '#ffd590', .22, .07);
        } else { b.x = nx; b.y = ny; b.life -= dt; if (b.life > 0) survivors.push(b); }
      }, this);
      this.bullets = survivors; this.enemies = this.enemies.filter(function (e) { return e.hp > 0; });
    }
    damageEnemy(enemy, damage, owner) {
      if (enemy.hp <= 0) return;
      enemy.hp -= damage; enemy.hitFlash = .12; this.effect('blood', enemy.x, enemy.y, 3, '#62894b', .4, .08);
      if (enemy.hp > 0) { this.emit('hit', enemy); return; }
      this.kills++; var p = this.players[owner - 1]; if (p) p.score++;
      var spec = World.enemyTypes[enemy.type]; this.credits += spec.reward;
      this.decals.push({ id: this.id(), type: 'blood', x: enemy.x, y: enemy.y, angle: this.random() * Math.PI * 2, size: enemy.radius * 2.4 });
      if (this.decals.length > LIMITS.decals) this.decals.shift();
      this.effect('blood', enemy.x, enemy.y, enemy.type === 'boss' ? 24 : 9, '#648045', .65, .12); this.emit('enemy-death', enemy, { enemyType: enemy.type });
      var roll = this.random();
      if (enemy.type === 'boss') this.addPickup('credits', enemy.x, enemy.y, 150);
      else if (roll < .10) this.addPickup('health', enemy.x, enemy.y, 25);
      else if (roll < .16) this.addPickup('armor', enemy.x, enemy.y, 25);
      else if (roll < .30) this.addPickup('ammo', enemy.x, enemy.y, 1);
      else if (roll < .34) this.addPickup('grenade', enemy.x, enemy.y, 1);
      else if (roll < .45) this.addPickup('credits', enemy.x, enemy.y, 12);
    }
    damagePlayer(p, amount) {
      if (p.downed || p.invulnerable > 0) return;
      var absorbed = Math.min(p.armor, amount * .7); p.armor -= absorbed; p.hp = Math.max(0, p.hp - (amount - absorbed)); p.hitFlash = .18; p.invulnerable = .24; p.damageTimer = 1;
      this.emit('player-hit', p);
      if (p.hp <= 0) { p.downed = true; p.alive = false; p.moving = false; p.reviveProgress = 0; this.message('队员倒地！靠近队员进行救援', 'Squad member down! Stand nearby to revive'); }
    }
    stepGrenades(dt) {
      this.grenades.forEach(function (g) {
        g.age += dt;
        var beforeX = g.x, beforeY = g.y; this.move(g, g.vx * dt, g.vy * dt);
        if (Math.abs(g.x - beforeX - g.vx * dt) > .001) g.vx *= -.5;
        if (Math.abs(g.y - beforeY - g.vy * dt) > .001) g.vy *= -.5;
        g.vx *= .985; g.vy *= .985;
        if (g.age >= g.fuse) this.explode(g.x, g.y, 4.0, 260, g.owner, true);
      }, this);
      this.grenades = this.grenades.filter(function (g) { return g.age < g.fuse; }); this.enemies = this.enemies.filter(function (e) { return e.hp > 0; });
    }
    explodeBarrel(barrel, owner) { if (barrel.exploded) return; barrel.exploded = true; this.explode(barrel.x, barrel.y, 3.8, 220, owner, true); }
    explode(x, y, radius, damage, owner, large) {
      var pos = { x: x, y: y };
      this.enemies.forEach(function (e) { var d = distance(pos, e); if (d < radius + e.radius && this.lineOfSight(pos, e)) this.damageEnemy(e, damage * (1 - .55 * clamp(d / radius, 0, 1)), owner); }, this);
      // Cooperative ammunition never hurts teammates. Chain reactions still respect walls.
      this.map.barrels.forEach(function (b) { if (!b.exploded && distance(pos, b) < radius && this.lineOfSight(pos, b)) { b.hp -= damage; if (b.hp <= 0) this.explodeBarrel(b, owner); } }, this);
      this.effect('explosion', x, y, large ? 22 : 8, large ? '#ffb34d' : '#72ffe5', large ? .65 : .3, large ? .35 : .15);
      this.effect('smoke', x, y, large ? 9 : 3, '#45494c', 1.15, large ? .55 : .2);
      if (large) { this.decals.push({ id: this.id(), type: 'scorch', x: x, y: y, angle: 0, size: radius }); if (this.decals.length > LIMITS.decals) this.decals.shift(); }
      this.emit('explosion', pos, { large: !!large });
    }
    effect(type, x, y, count, color, life, size) {
      for (var i = 0; i < count; i++) {
        var angle = this.random() * Math.PI * 2, speed = this.random() * (type === 'explosion' ? 4 : 2);
        this.particles.push({ id: this.id(), type: type, x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: life, maxLife: life, color: color, size: size * (.5 + this.random()) });
      }
      if (this.particles.length > LIMITS.particles) this.particles.splice(0, this.particles.length - LIMITS.particles);
    }
    addPickup(type, x, y, amount) { if (this.pickups.length >= LIMITS.pickups) this.pickups.shift(); this.pickups.push({ id: this.id(), type: type, x: x, y: y, amount: amount, age: 0 }); }
    stepPickups(dt) {
      this.pickups.forEach(function (item) {
        item.age += dt; var p = this.players.find(function (p) { return p.active && !p.downed && distance(p, item) < 1; }); if (!p) return;
        if (item.type === 'health' && p.hp >= p.maxHp) return;
        if (item.type === 'armor' && p.armor >= 100) return;
        if (item.type === 'grenade' && p.grenades >= 12) return;
        if (item.type === 'health') p.hp = Math.min(p.maxHp, p.hp + item.amount);
        if (item.type === 'armor') p.armor = Math.min(100, p.armor + item.amount);
        if (item.type === 'credits') this.credits += item.amount;
        if (item.type === 'grenade') p.grenades = Math.min(12, p.grenades + item.amount);
        if (item.type === 'ammo') {
          if (p.owned.length === 1) { p.owned.push('smg'); p.weapon = 'smg'; p.ammo.smg = 100; this.message('获得冲锋枪 · SELECT 切换武器', 'SMG acquired · SELECT changes weapons'); }
          else p.owned.forEach(function (id) { if (id !== 'pistol') p.ammo[id] = Math.min(2000, p.ammo[id] + Math.round(weaponById[id].capacity * .35)); });
        }
        item.taken = true; this.emit('pickup', p, { pickupType: item.type });
      }, this);
      this.pickups = this.pickups.filter(function (p) { return !p.taken && p.age < 100; });
    }
    stepObjectives(dt) {
      var current = this.map.objectives[this.objectiveIndex];
      if (current && (current.status === 'ready' || current.status === 'charging')) {
        var near = this.players.some(function (p) { return p.active && !p.downed && distance(p, current) < 1.65; });
        if (near) { current.status = 'charging'; current.progress = Math.min(1, current.progress + dt / 2.5); }
        else if (current.status === 'charging') { current.progress = Math.max(0, current.progress - dt / 6); if (current.progress === 0) current.status = 'ready'; }
        if (current.progress >= 1) {
          current.status = 'defending'; this.wave++; this.waveRemaining = 16 + this.stage * 9 + this.objectiveIndex * 5 + (this.selectedPlayers === 2 ? 10 : 0); this.spawnTimer = 0;
          if (this.stage === 2 && this.objectiveIndex === 2) { this.bossPending = true; this.waveRemaining = 20 + (this.selectedPlayers === 2 ? 12 : 0); }
          this.emit('objective', current); this.message('警报！守住控制台，清除异形', 'ALARM! Hold the console and eliminate the swarm');
        }
      }
      if (current && current.status === 'defending') {
        if (this.bossPending && this.spawnEnemy('boss', 2)) this.bossPending = false;
        this.spawnTimer -= dt;
        if (this.waveRemaining > 0 && this.spawnTimer <= 0 && this.enemies.length < (this.selectedPlayers === 2 ? 44 : 34)) {
          if (this.spawnEnemy(this.waveType(), this.objectiveIndex)) this.waveRemaining--;
          this.spawnTimer = .35 + this.random() * .25;
        }
        if (this.waveRemaining === 0 && this.enemies.length === 0 && !this.bossPending) {
          current.status = 'done'; current.progress = 1; this.credits += 75 + this.stage * 30; this.emit('objective', current);
          var door = this.map.doors[this.objectiveIndex]; if (door) { door.open = true; this.rebuildNavigation(); this.emit('door', door); }
          this.objectiveIndex++;
          if (this.map.objectives[this.objectiveIndex]) { this.map.objectives[this.objectiveIndex].status = 'ready'; this.message('闸门已开启，前往下一个控制台', 'Gate released — proceed to the next console'); }
          else { this.extractionReady = true; this.message('区域已清理，前往撤离标记', 'Sector clear — reach the extraction marker'); }
        }
      }
      var survivingPlayers = this.players.filter(function (p) { return p.active && !p.downed; });
      if (this.extractionReady && survivingPlayers.length > 0 && survivingPlayers.every(function (p) { return distance(p, this.map.exit) < 2.5; }, this)) {
        this.credits += 100; this.emit('stage-clear', this.map.exit);
        this.players.forEach(function (p) { if (p.active) { p.downed = false; p.alive = true; p.hp = Math.max(p.hp, p.maxHp * .5); p.grenades = Math.min(12, p.grenades + 1); } });
        this.bullets = []; this.grenades = [];
        if (this.stage === 2) { this.phase = 'victory'; this.emit('victory'); }
        else { this.phase = 'shop'; this.shop.selected = 0; this._shopRepeat = 0; }
      }
    }
    stepRevive(dt) {
      this.players.forEach(function (p) {
        if (!p.active || !p.downed) return;
        var rescuer = this.players.find(function (q) { return q.active && !q.downed && q.connected && distance(p, q) < 1.7 && q.damageTimer <= 0; });
        p.reviveProgress = rescuer ? Math.min(1, p.reviveProgress + dt / 3) : Math.max(0, p.reviveProgress - dt / 2);
        if (p.reviveProgress >= 1) { p.downed = false; p.alive = true; p.hp = p.maxHp * .5; p.invulnerable = 3; p.reviveProgress = 0; this.emit('revive', p); this.message('队员已恢复战斗能力', 'Squad member revived'); }
      }, this);
    }
  }
  AlienShooterGame.World = World; AlienShooterGame.LIMITS = LIMITS;
  return AlienShooterGame;
});
