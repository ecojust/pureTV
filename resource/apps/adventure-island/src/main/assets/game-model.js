/* Independently authored Adventure Island-inspired rules and reconstructed routes.
 * No ROM instructions or extracted stage/sprite data. See docs/reference.md. */
(function (root) {
  "use strict";
  var FPS = 60,
    BODY_W = 14,
    BODY_H = 22,
    MAX_ENERGY = 16;
  // Each route is a deliberately composed series of distinct terrain sections.
  // Coordinates are new reconstructions, not a claim to be the original stage data.
  var ROUTES = [
    ["forest", "meadow,canopy,bridge,meadow,steps"],
    ["coast", "coast,bridge,waterfall,coast,marsh"],
    ["cave", "cave,ruins,steps,cave,bridge"],
    ["forest", "canopy,meadow,ruins,bridge,steps"],
    ["forest", "steps,canopy,bridge,marsh,meadow,canopy"],
    ["coast", "waterfall,coast,bridge,marsh,coast,steps"],
    ["ice", "ice,steps,bridge,ice,waterfall,ruins"],
    ["cave", "cave,ruins,lava,steps,bridge,cave"],
    ["forest", "marsh,canopy,steps,bridge,canopy,meadow"],
    ["night", "night,bridge,marsh,night,ruins,waterfall"],
    ["coast", "coast,waterfall,steps,marsh,bridge,coast"],
    ["cave", "ruins,lava,cave,bridge,steps,lava"],
    ["ice", "ice,waterfall,bridge,steps,ice,ruins"],
    ["forest", "canopy,marsh,bridge,canopy,steps,meadow"],
    ["night", "night,ruins,bridge,night,waterfall,steps"],
    ["cave", "lava,cave,steps,ruins,lava,bridge"],
    ["forest", "canopy,bridge,marsh,steps,canopy,waterfall,meadow"],
    ["coast", "waterfall,coast,marsh,bridge,waterfall,coast,steps"],
    ["ice", "ice,steps,waterfall,ice,bridge,ruins,ice"],
    ["cave", "ruins,cave,lava,steps,bridge,lava,cave"],
    ["night", "night,marsh,bridge,ruins,night,waterfall,canopy"],
    ["forest", "steps,canopy,waterfall,marsh,bridge,canopy,meadow"],
    ["coast", "coast,bridge,waterfall,steps,marsh,coast,waterfall"],
    ["cave", "lava,ruins,steps,cave,bridge,lava,ruins"],
    ["ice", "ice,waterfall,steps,bridge,ice,ruins,waterfall"],
    ["night", "night,ruins,marsh,bridge,canopy,night,waterfall"],
    ["forest", "canopy,bridge,steps,marsh,waterfall,canopy,ruins"],
    ["cave", "cave,lava,ruins,steps,lava,bridge,cave"],
    ["forest", "canopy,steps,bridge,marsh,waterfall,ruins,canopy"],
    ["coast", "waterfall,marsh,coast,bridge,steps,waterfall,coast"],
    ["ice", "ice,ruins,waterfall,steps,bridge,ice,waterfall"],
    ["cave", "lava,ruins,cave,bridge,lava,steps,ruins,lava"],
  ];
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function copy(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function overlap(a, b) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }
  function label(stage) {
    return Math.floor(stage / 4) + 1 + "-" + ((stage % 4) + 1);
  }
  function neutral() {
    return {
      connected: false,
      x: 0,
      y: 0,
      a: false,
      b: false,
      start: false,
      select: false,
    };
  }
  function makeLevel(index) {
    index = clamp(index | 0, 0, 31);
    var route = ROUTES[index],
      parts = route[1].split(","),
      world = Math.floor(index / 4) + 1;
    var level = {
      index: index,
      world: world,
      area: (index % 4) + 1,
      label: label(index),
      theme: route[0],
      width: 300 + parts.length * 288 + 320,
      ground: [],
      platforms: [],
      ceilings: [],
      gaps: [],
      items: [],
      eggs: [],
      enemies: [],
      hazards: [],
      checkpoints: [32],
      boss: null,
      cloud: null,
    };
    function item(type, x, y) {
      level.items.push({ type: type, x: x, y: y, w: 12, h: 12, taken: false });
    }
    function enemy(type, x, y) {
      level.enemies.push({
        type: type,
        x: x,
        y: y,
        homeX: x,
        homeY: y,
        w: type === "boulder" ? 18 : 16,
        h: type === "spider" ? 20 : 14,
        vx: type === "snail" ? -0.35 : 0,
        vy: 0,
        age: 0,
        alive: true,
      });
    }
    function gap(x, w) {
      level.gaps.push({ x: x, w: w });
    }
    function platform(x, y, w) {
      level.platforms.push({ x: x, y: y, w: w, h: 8 });
    }
    function rock(x) {
      level.hazards.push({
        type: "rock",
        x: x,
        y: 190,
        w: 13,
        h: 10,
        dead: false,
        cooldown: 0,
      });
    }
    function fire(x) {
      level.hazards.push({
        type: "fire",
        x: x,
        y: 181,
        w: 12,
        h: 19,
        dead: false,
        period: 100 + (index % 3) * 16,
      });
    }
    function egg(type, x, hidden) {
      level.eggs.push({
        type: type,
        x: x,
        y: 184,
        w: 16,
        h: 16,
        hidden: !!hidden,
        hits: 0,
        open: false,
      });
    }
    egg("axe", 100, false);
    item("banana", 156, 166);
    item("apple", 216, 166);
    for (var n = 0; n < parts.length; n++) {
      var x = 300 + n * 288,
        kind = parts[n];
      if (kind === "meadow") {
        rock(x + 114);
        enemy("snail", x + 215, 186);
        gap(x + 248, 32);
        item("banana", x + 65, 164);
        item("grape", x + 144, 140);
      } else if (kind === "bridge") {
        gap(x + 104, 64);
        platform(x + 122, 184, 28);
        enemy("bird", x + 235, 146);
        item("apple", x + 134, 130);
        item("melon", x + 215, 164);
      } else if (kind === "canopy") {
        platform(x + 42, 168, 72);
        platform(x + 156, 144, 64);
        gap(x + 250, 30);
        enemy("bird", x + 175, 116);
        item("grape", x + 70, 146);
        item("melon", x + 185, 122);
      } else if (kind === "coast") {
        gap(x + 48, 40);
        gap(x + 184, 48);
        platform(x + 112, 176, 36);
        enemy("fish", x + 207, 208);
        item("apple", x + 66, 145);
        item("banana", x + 207, 138);
      } else if (kind === "steps") {
        platform(x + 58, 184, 40);
        platform(x + 114, 168, 44);
        platform(x + 174, 152, 42);
        gap(x + 244, 32);
        enemy("snake", x + 223, 186);
        item("melon", x + 190, 128);
      } else if (kind === "cave") {
        level.ceilings.push({ x: x + 40, y: 70, w: 88, h: 22 });
        rock(x + 121);
        fire(x + 178);
        gap(x + 232, 32);
        enemy("bat", x + 202, 108);
        item("grape", x + 88, 160);
      } else if (kind === "ice") {
        rock(x + 60);
        gap(x + 128, 56);
        platform(x + 138, 184, 34);
        enemy("frog", x + 228, 186);
        item("apple", x + 157, 136);
        item("banana", x + 240, 154);
      } else if (kind === "night") {
        gap(x + 52, 40);
        gap(x + 188, 40);
        enemy("bat", x + 124, 132);
        enemy("spider", x + 248, 122);
        item("grape", x + 72, 140);
        item("melon", x + 206, 138);
      } else if (kind === "marsh") {
        platform(x + 42, 180, 36);
        gap(x + 104, 40);
        enemy("frog", x + 184, 186);
        rock(x + 233);
        item("apple", x + 123, 137);
        item("banana", x + 212, 151);
      } else if (kind === "ruins") {
        platform(x + 32, 184, 32);
        platform(x + 76, 168, 32);
        platform(x + 120, 152, 48);
        gap(x + 208, 48);
        enemy("boulder", x + 188, 182);
        item("melon", x + 143, 127);
      } else if (kind === "waterfall") {
        gap(x + 56, 64);
        platform(x + 72, 184, 32);
        gap(x + 200, 64);
        platform(x + 216, 184, 32);
        enemy("fish", x + 90, 210);
        item("banana", x + 85, 130);
        item("grape", x + 231, 130);
      } else if (kind === "lava") {
        gap(x + 80, 48);
        fire(x + 168);
        gap(x + 224, 40);
        enemy("bat", x + 193, 118);
        item("apple", x + 103, 133);
        item("melon", x + 242, 141);
      }
      item(n % 2 ? "banana" : "apple", x + 18, 164);
      if (n === 1) egg(index % 3 === 0 ? "board" : "milk", x + 22, false);
      if (n === 2) egg(world >= 2 ? "fire" : "honey", x + 22, false);
      if (n === 3) egg(index % 4 === 1 ? "eggplant" : "pot", x + 22, true);
      if (n === parts.length - 1) item("milk", x + 18, 162);
    }
    var ends = level.gaps.slice().sort(function (a, b) {
        return a.x - b.x;
      }),
      cursor = 0;
    ends.forEach(function (hole) {
      if (hole.x > cursor)
        level.ground.push({ x: cursor, y: 200, w: hole.x - cursor, h: 40 });
      cursor = hole.x + hole.w;
    });
    level.ground.push({ x: cursor, y: 200, w: level.width - cursor, h: 40 });
    for (var c = 1; c < 4; c++)
      level.checkpoints.push(300 + Math.floor((parts.length * c) / 4) * 288);
    // Reconstructed secret positions: the first 28 pixels of each chunk are safe.
    level.cloud = { x: 304 + (index % 3) * 288, y: 136, w: 24, h: 64,
      wait: 0, hint: 0, used: false, rising: false };
    level.goalX = level.width - 64;
    if (level.area === 4) {
      egg("axe", level.width - 288, false);
      item("milk", level.width - 236, 166);
      level.boss = {
        x: level.width - 104,
        y: 164,
        w: 32,
        h: 36,
        hp: 6 + world * 2,
        maxHp: 6 + world * 2,
        age: 0,
        flash: 0,
        alive: true,
      };
    }
    return level;
  }
  function bonusLevel(index) {
    var level = { index: index, world: Math.floor(index / 4) + 1,
      area: index % 4 + 1, label: "BONUS", theme: "forest", bonus: true,
      width: 1120, ground: [{ x: 0, y: 200, w: 128, h: 40 }],
      platforms: [], ceilings: [], gaps: [], items: [], eggs: [], enemies: [],
      hazards: [], checkpoints: [], boss: null, cloud: null, goalX: Infinity };
    for (var i = 0; i < 8; i++) {
      var x = 176 + i * 112, y = i % 2 ? 152 : 176;
      level.platforms.push({ x: x, y: y, w: 64, h: 8 });
      for (var j = 0; j < 3; j++)
        level.items.push({ type: ["banana", "apple", "grape", "melon"][i % 4],
          x: x + 8 + j * 20, y: y - 24 - (j === 1 ? 12 : 0),
          w: 12, h: 12, taken: false });
    }
    return level;
  }
  function player(id) {
    return {
      id: id,
      joined: false,
      alive: false,
      active: false,
      connected: false,
      lives: 3,
      score: 0,
      stage: 0,
      level: 1,
      stageLabel: "1-1",
      x: 32,
      y: 178,
      w: BODY_W,
      h: BODY_H,
      vx: 0,
      vy: 0,
      grounded: true,
      dir: 1,
      energy: 11,
      energyTimer: 0,
      weapon: "none",
      skateboard: false,
      invulnerable: 0,
      fairy: 0,
      eggplant: false,
      pot: false,
      stun: 0,
      checkpoint: 32,
      checkpointIndex: 0,
      bonusLives: 0,
      last: neutral(),
      input: neutral(),
    };
  }
  function AdventureGame(options) {
    options = options || {};
    this.players = [player(1), player(2)];
    this.selectedPlayers = 1;
    this.activePlayer = 1;
    this.phase = "title";
    this.frame = 0;
    this.accumulator = 0;
    this.events = [];
    this.eventId = 0;
    this.autoPaused = false;
    this.muted = !!options.muted;
    this.highScore = Number.isFinite(Number(options.highScore))
      ? clamp(Number(options.highScore), 0, 99999999)
      : 0;
    this.level = makeLevel(0);
    this.cameraX = 0;
    this.projectiles = [];
    this.enemyShots = [];
    this.effects = [];
    this.transition = null;
    this.bonusReturn = null;
  }
  AdventureGame.prototype.emit = function (type, extra) {
    this.events.push(
      Object.assign({ id: ++this.eventId, type: type }, extra || {}),
    );
  };
  AdventureGame.prototype.current = function () {
    return this.players[this.activePlayer - 1];
  };
  AdventureGame.prototype.loadStage = function (index, checkpoint) {
    var p = this.current();
    p.stage = clamp(index | 0, 0, 31);
    p.level = p.stage + 1;
    p.stageLabel = label(p.stage);
    this.level = makeLevel(p.stage);
    p.x = checkpoint == null ? 32 : checkpoint;
    p.y = 178;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    p.checkpoint = p.x;
    p.checkpointIndex = Math.max(0, this.level.checkpoints.indexOf(p.x));
    p.energy = 11;
    p.energyTimer = 0;
    p.stun = 0;
    p.eggplant = false;
    p.pot = false;
    this.cameraX = clamp(p.x - 64, 0, this.level.width - 256);
    this.projectiles = [];
    this.enemyShots = [];
    this.effects = [];
    this.transition = null;
    this.bonusReturn = null;
    this.players.forEach(function (value) {
      value.active = value.id === p.id && value.joined;
    });
    this.emit("stage", { stage: p.stage + 1 });
  };
  AdventureGame.prototype.enterBonus = function () {
    var p = this.current(), next = p.checkpoint;
    this.level.cloud.rising = false;
    for (var i = 0; i < this.level.checkpoints.length; i++) {
      if (this.level.checkpoints[i] > this.level.cloud.x) {
        next = this.level.checkpoints[i];
        break;
      }
    }
    this.bonusReturn = { level: this.level, checkpoint: next };
    this.level = bonusLevel(p.stage);
    this.transition = null;
    p.x = 32;
    p.y = 178;
    p.vx = p.vy = 0;
    p.grounded = true;
    this.cameraX = 0;
    this.projectiles = [];
    this.enemyShots = [];
    this.effects = [];
    this.emit("reveal");
  };
  AdventureGame.prototype.leaveBonus = function () {
    var p = this.current(), back = this.bonusReturn;
    if (!back) return;
    this.level = back.level;
    p.x = p.checkpoint = back.checkpoint;
    p.checkpointIndex = this.level.checkpoints.indexOf(p.checkpoint);
    p.y = 178;
    p.vx = p.vy = 0;
    p.grounded = true;
    p.invulnerable = Math.max(60, p.invulnerable);
    this.cameraX = clamp(p.x - 64, 0, this.level.width - 256);
    this.bonusReturn = null;
    this.projectiles = [];
    this.enemyShots = [];
    this.effects = [];
    this.emit("stage", { stage: p.stage + 1 });
  };
  AdventureGame.prototype.begin = function () {
    var old = this.players;
    this.players = [player(1), player(2)];
    for (var i = 0; i < 2; i++) {
      this.players[i].joined = i < this.selectedPlayers;
      this.players[i].alive = i < this.selectedPlayers;
      this.players[i].last = old[i].last;
      this.players[i].input = old[i].input;
      this.players[i].connected = old[i].connected;
    }
    this.activePlayer = 1;
    this.phase = "playing";
    this.autoPaused = false;
    this.loadStage(0, 32);
    this.emit("start");
  };
  AdventureGame.prototype.addScore = function (amount) {
    var p = this.current();
    p.score = Math.max(0, p.score + amount);
    this.highScore = Math.max(this.highScore, p.score);
    var thresholds = [50000, 100000, 200000];
    while (
      p.bonusLives < thresholds.length &&
      p.score >= thresholds[p.bonusLives]
    ) {
      p.lives++;
      p.bonusLives++;
      this.emit("life");
    }
  };
  // Eggs release a real world object: shooting an egg is not a remote pickup.
  AdventureGame.prototype.openEgg = function (egg) {
    if (egg.open || egg.hidden) return;
    egg.open = true;
    this.level.items.push({
      type: egg.type,
      x: egg.x + 2,
      y: egg.y,
      w: 12,
      h: 12,
      vx: egg.type === "board" ? 0.9 : 0,
      vy: -3.4,
      age: 0,
      released: true,
      taken: false,
    });
    for (var i = 0; i < 4; i++)
      this.effects.push({
        type: "shell", x: egg.x + 4 + i * 3, y: egg.y + 6,
        vx: (i - 1.5) * 0.8, vy: -2 - (i % 2), life: 28,
      });
    this.emit("egg-open");
  };
  AdventureGame.prototype.pickup = function (type) {
    var p = this.current(),
      points = {
        banana: 100,
        apple: 200,
        grape: 300,
        melon: 500,
        milk: 1000,
        pot: 1000,
        honey: 1000,
      };
    if (type === "axe") {
      if (p.weapon === "none") p.weapon = "axe";
    } else if (type === "fire") p.weapon = p.weapon === "none" ? "axe" : "fire";
    else if (type === "board") {
      p.skateboard = true;
      p.vx = 2.6;
    } else if (type === "milk") {
      p.energy = MAX_ENERGY;
      p.eggplant = false;
    } else if (type === "honey") {
      p.fairy = 600;
    } else if (type === "eggplant") p.eggplant = true;
    else if (type === "pot") p.pot = true;
    else p.energy = Math.min(MAX_ENERGY, p.energy + 2);
    var score = this.level.bonus ? 500 : points[type] || 100;
    this.addScore(score);
    this.effects.push({ type: "score", x: p.x, y: p.y - 8, life: 40, score: score });
    this.emit("pickup", { item: type });
  };
  AdventureGame.prototype.loseLife = function (reason) {
    if (this.phase !== "playing" || this.transition) return;
    var p = this.current();
    p.lives = Math.max(0, p.lives - 1);
    p.alive = p.lives > 0;
    p.weapon = "none";
    p.skateboard = false;
    p.fairy = 0;
    p.eggplant = false;
    p.vx = 0;
    this.transition = { type: "death", ticks: 70, reason: reason || "hit" };
    this.emit("death");
  };
  AdventureGame.prototype.advanceTurn = function () {
    var p = this.current(),
      other = this.players[(this.activePlayer === 1 ? 2 : 1) - 1];
    if (this.selectedPlayers === 2 && other.joined && other.alive)
      this.activePlayer = other.id;
    else if (!p.alive) {
      this.phase = "gameover";
      this.transition = null;
      this.emit("gameover");
      return;
    }
    p = this.current();
    this.loadStage(p.stage, p.checkpoint);
    p.invulnerable = 90;
  };
  AdventureGame.prototype.finishStage = function () {
    if (this.phase !== "playing" || this.transition) return;
    var p = this.current();
    this.addScore(Math.max(0, p.energy) * 100 * (p.pot ? 2 : 1));
    this.transition = { type: "clear", ticks: 90 };
    p.vx = 0;
    this.emit("clear");
  };
  AdventureGame.prototype.hit = function (reason) {
    var p = this.current(),
      fatal = reason === "pit" || reason === "water" || reason === "energy";
    if (this.transition || (!fatal && (p.invulnerable || p.fairy))) return;
    if (
      p.skateboard &&
      reason !== "pit" &&
      reason !== "water" &&
      reason !== "energy"
    ) {
      p.skateboard = false;
      p.invulnerable = 100;
      this.emit("board-break");
      return;
    }
    this.loseLife(reason);
  };
  AdventureGame.prototype.throwWeapon = function () {
    var p = this.current();
    if (p.weapon === "none" || this.projectiles.length >= 2) return false;
    this.projectiles.push({
      x: p.x + (p.dir > 0 ? BODY_W : 0),
      y: p.y + 6,
      w: 8,
      h: 8,
      vx: p.dir * (p.weapon === "fire" ? 3.8 : 3),
      vy: p.weapon === "fire" ? -1.1 : -2.4,
      type: p.weapon,
      life: 100,
      dead: false,
    });
    this.emit("throw");
    return true;
  };
  AdventureGame.prototype.surface = function (x, width) {
    var floors = this.level.ground.concat(this.level.platforms),
      best = null;
    for (var i = 0; i < floors.length; i++)
      if (
        x + width > floors[i].x &&
        x < floors[i].x + floors[i].w &&
        (best == null || floors[i].y < best)
      )
        best = floors[i].y;
    return best;
  };
  AdventureGame.prototype.movePlayer = function (p) {
    var input = p.input,
      ice = this.level.theme === "ice",
      dx = input.x < -0.3 ? -1 : input.x > 0.3 ? 1 : 0;
    if (dx) p.dir = dx;
    if (p.stun) {
      p.stun--;
      p.vx *= 0.8;
    } else if (p.skateboard) {
      p.dir = 1;
      p.vx = dx < 0 ? 1.55 : input.b ? 3.4 : 2.8;
    } else if (dx) {
      var limit = input.b ? 2.7 : 1.65;
      p.vx = clamp(p.vx + dx * (ice ? 0.16 : 0.35), -limit, limit);
    } else {
      p.vx *= ice ? 0.985 : 0.72;
      if (Math.abs(p.vx) < 0.04) p.vx = 0;
    }
    if (input.a && !p.last.a && p.grounded && !p.stun) {
      p.vy = -6.2;
      p.grounded = false;
      this.emit("jump");
    }
    if (input.b && !p.last.b) this.throwWeapon();
    var oldY = p.y,
      oldBottom = p.y + p.h;
    p.x = clamp(p.x + p.vx, this.cameraX + 2, this.level.width - p.w);
    p.vy += input.a && p.vy < 0 ? 0.24 : 0.42;
    p.vy = Math.min(6.4, p.vy);
    p.y += p.vy;
    p.grounded = false;
    var floors = this.level.ground.concat(this.level.platforms);
    for (var i = 0; i < floors.length; i++) {
      var floor = floors[i];
      if (
        p.x + p.w > floor.x &&
        p.x < floor.x + floor.w &&
        oldBottom <= floor.y + 0.01 &&
        p.y + p.h >= floor.y &&
        p.vy >= 0
      ) {
        p.y = floor.y - p.h;
        p.vy = 0;
        p.grounded = true;
      }
    }
    for (i = 0; i < this.level.ceilings.length; i++) {
      var ceiling = this.level.ceilings[i];
      if (
        p.vy < 0 &&
        p.x + p.w > ceiling.x &&
        p.x < ceiling.x + ceiling.w &&
        oldY >= ceiling.y + ceiling.h &&
        p.y < ceiling.y + ceiling.h
      ) {
        p.y = ceiling.y + ceiling.h;
        p.vy = 0;
      }
    }
    if (p.y > 242) {
      if (this.level.bonus) {
        this.leaveBonus();
        return;
      }
      this.hit(this.level.theme === "coast" ? "water" : "pit");
      return;
    }
    this.cameraX = Math.max(
      this.cameraX,
      clamp(p.x - 92, 0, this.level.width - 256),
    );
    for (i = 0; i < this.level.checkpoints.length; i++)
      if (p.x >= this.level.checkpoints[i]) {
        p.checkpoint = this.level.checkpoints[i];
        p.checkpointIndex = i;
      }
  };
  AdventureGame.prototype.updateWorld = function () {
    var p = this.current(),
      game = this,
      level = this.level;
    if (p.invulnerable) p.invulnerable--;
    if (p.fairy) p.fairy--;
    if (!level.bonus && ++p.energyTimer >= (p.eggplant ? 25 : 110)) {
      p.energyTimer = 0;
      p.energy--;
      if (p.energy <= 0) {
        this.hit("energy");
        return;
      }
    }
    this.effects = this.effects.filter(function (effect) {
      effect.life--;
      if (effect.type === "shell") {
        effect.x += effect.vx;
        effect.vy += 0.18;
        effect.y += effect.vy;
      } else effect.y -= 0.35;
      return effect.life > 0;
    });
    level.items.forEach(function (item) {
      if (item.taken) return;
      if (item.released) {
        item.age++;
        var bottom = item.y + item.h;
        item.x += item.vx;
        item.vy = Math.min(5, item.vy + 0.25);
        item.y += item.vy;
        level.ground.concat(level.platforms).forEach(function (floor) {
          if (item.x + item.w > floor.x && item.x < floor.x + floor.w &&
              item.vy >= 0 && bottom <= floor.y && item.y + item.h >= floor.y) {
            item.y = floor.y - item.h;
            item.vy = 0;
          }
        });
        if (item.y > 250 || item.x + item.w < game.cameraX - 32) {
          item.taken = true;
          return;
        }
      }
      if ((!item.released || item.age >= 4) && overlap(p, item)) {
        item.taken = true;
        game.pickup(item.type);
      }
    });
    level.eggs.forEach(function (egg) {
      if (egg.open) return;
      if (
        egg.hidden &&
        Math.abs(p.x + 7 - egg.x - 8) < 18 &&
        !p.grounded &&
        p.y + BODY_H < egg.y + 4
      ) {
        egg.hidden = false;
        game.emit("reveal");
      }
      if (!egg.hidden && overlap(p, egg)) {
        game.openEgg(egg);
      }
    });
    var cloud = level.cloud;
    if (cloud && !cloud.used) {
      if (cloud.hint) cloud.hint--;
      if (p.grounded && Math.abs(p.x + p.w / 2 - cloud.x - cloud.w / 2) < 12 &&
          Math.abs(p.vx) < 0.1 && Math.abs(p.input.x) < 0.3 && !p.input.a) {
        cloud.wait++;
        if (cloud.wait >= 90) {
          cloud.used = cloud.rising = true;
          p.vx = p.vy = 0;
          this.transition = { type: "cloud", ticks: 60 };
          this.emit("reveal");
          return;
        }
      } else cloud.wait = 0;
    }
    level.hazards.forEach(function (hazard) {
      if (hazard.dead) return;
      if (hazard.cooldown) hazard.cooldown--;
      var active =
        hazard.type !== "fire" ||
        game.frame % hazard.period < Math.floor(hazard.period * 0.65);
      if (active && overlap(p, hazard) && !p.fairy && !p.invulnerable) {
        if (hazard.type === "rock") {
          if (!hazard.cooldown) {
            hazard.cooldown = 50;
            if (p.skateboard) {
              game.hit("rock");
            } else {
              p.energy -= 2;
              p.stun = 15;
              p.vx = 0;
              game.emit("trip");
              if (p.energy <= 0) game.hit("energy");
            }
          }
        } else game.hit("fire");
      }
    });
    level.enemies.forEach(function (e) {
      if (!e.alive || e.x < game.cameraX - 48 || e.x > game.cameraX + 304)
        return;
      e.age++;
      if (e.type === "snail") {
        e.x += e.vx;
        if (Math.abs(e.x - e.homeX) > 36 || game.surface(e.x, e.w) == null)
          e.vx = -e.vx;
      } else if (e.type === "bird") {
        if (!e.diving && e.x - p.x < 116 && e.x > p.x) {
          e.diving = true;
          e.targetY = Math.min(180, p.y + 4);
          e.diveAge = 0;
        }
        if (e.diving) {
          e.diveAge++;
          e.x -= 1.35 + level.world * 0.04;
          if (e.diveAge <= 36) e.y += (e.targetY - e.y) * 0.065;
          else e.y -= 0.9;
        } else e.y = e.homeY + Math.sin(e.age / 12) * 4;
      } else if (e.type === "bat") {
        e.x = e.homeX + Math.sin(e.age / 60) * 32;
        e.y = e.homeY + Math.sin(e.age / 18) * 12;
      } else if (e.type === "spider") {
        e.y = e.homeY + Math.sin(e.age / 40) * 45;
      } else if (e.type === "frog") {
        if (e.age % 80 === 1) e.vy = -3.8;
        e.vy += 0.3;
        e.y += e.vy;
        if (e.y > e.homeY) {
          e.y = e.homeY;
          e.vy = 0;
        }
      } else if (e.type === "fish") {
        var t = e.age % 110;
        e.y = t < 60 ? e.homeY - 58 * Math.sin((t / 60) * Math.PI) : e.homeY;
      } else if (e.type === "boulder") {
        e.x -= 0.65 + level.world * 0.03;
        if (e.x < e.homeX - 110) e.x = e.homeX;
      }
      if (overlap(p, e)) {
        if (p.fairy) {
          e.alive = false;
          game.addScore(300);
          game.emit("enemy");
        } else game.hit("enemy");
      }
    });
    this.projectiles.forEach(function (shot) {
      if (shot.dead) return;
      shot.life--;
      shot.x += shot.vx;
      shot.vy += shot.type === "fire" ? 0.16 : 0.22;
      shot.y += shot.vy;
      if (shot.type === "fire") {
        var y = game.surface(shot.x, shot.w);
        if (y != null && shot.y + shot.h >= y && shot.y < y + 8) {
          shot.y = y - shot.h;
          shot.vy = -1.7;
        }
      }
      if (
        shot.life <= 0 ||
        shot.y > 238 ||
        shot.x < game.cameraX - 24 ||
        shot.x > game.cameraX + 296
      ) {
        shot.dead = true;
        return;
      }
      level.eggs.forEach(function (egg) {
        if (!shot.dead && !egg.open && overlap(shot, egg)) {
          shot.dead = true;
          if (egg.hidden) {
            egg.hidden = false;
            game.emit("reveal");
          } else if (++egg.hits >= 2) {
            game.openEgg(egg);
          }
        }
      });
      if (!shot.dead && cloud && !cloud.used && overlap(shot, cloud)) {
        shot.dead = true;
        cloud.hint = 60;
        game.emit("reveal");
      }
      level.hazards.forEach(function (hazard) {
        if (
          !shot.dead &&
          !hazard.dead &&
          hazard.type === "rock" &&
          overlap(shot, hazard)
        ) {
          shot.dead = true;
          if (shot.type === "fire") {
            hazard.dead = true;
            game.addScore(100);
            game.emit("enemy");
          }
        }
      });
      level.enemies.forEach(function (e) {
        if (!shot.dead && e.alive && overlap(shot, e)) {
          shot.dead = true;
          if (e.type !== "boulder" || shot.type === "fire") {
            e.alive = false;
            game.addScore(e.type === "spider" ? 500 : 200);
            game.emit("enemy");
          }
        }
      });
      var boss = level.boss;
      if (
        !shot.dead &&
        boss &&
        boss.alive &&
        !boss.flash &&
        overlap(shot, { x: boss.x + 5, y: boss.y, w: 22, h: 17 })
      ) {
        shot.dead = true;
        boss.hp--;
        boss.flash = 12;
        game.addScore(100);
        game.emit("boss-hit");
        if (boss.hp <= 0) {
          boss.alive = false;
          game.addScore(3000 * level.world);
          game.emit("boss");
        }
      }
    });
    this.projectiles = this.projectiles.filter(function (shot) {
      return !shot.dead;
    });
    var boss = level.boss;
    if (boss && boss.alive && p.x > level.width - 330) {
      boss.age++;
      if (boss.flash) boss.flash--;
      boss.x =
        level.width - 112 + Math.sin(boss.age / (55 - level.world * 3)) * 20;
      if (boss.age % (125 - level.world * 6) === 1)
        this.enemyShots.push({
          x: boss.x,
          y: boss.y + 8,
          w: 8,
          h: 8,
          vx: -(1.6 + level.world * 0.12),
          vy: -0.5,
          life: 160,
        });
      if (overlap(p, boss)) this.hit("boss");
    }
    this.enemyShots.forEach(function (shot) {
      shot.x += shot.vx;
      shot.y += shot.vy;
      shot.vy += 0.012;
      shot.life--;
      if (overlap(p, shot)) {
        game.hit("fireball");
        shot.life = 0;
      }
    });
    this.enemyShots = this.enemyShots.filter(function (shot) {
      return shot.life > 0 && shot.x > game.cameraX - 24;
    });
    if (p.x >= level.goalX && (!boss || !boss.alive)) this.finishStage();
  };
  AdventureGame.prototype.tick = function (inputs) {
    this.frame++;
    var game = this,
      start = false,
      select = false;
    this.players.forEach(function (p) {
      var raw = inputs.find(function (v) {
        return Number(v.id) === p.id;
      });
      p.input =
        raw && raw.connected
          ? {
              connected: true,
              x: Number(raw.x) || 0,
              y: Number(raw.y) || 0,
              a: !!raw.a,
              b: !!raw.b,
              start: !!raw.start,
              select: !!raw.select,
            }
          : neutral();
      p.connected = p.input.connected;
      if (
        game.phase === "title" ||
        game.phase === "gameover" ||
        game.phase === "ending" ||
        p.id === game.activePlayer
      ) {
        start = start || (p.input.start && !p.last.start);
        select = select || (p.input.select && !p.last.select);
      }
    });
    if (this.phase === "title") {
      if (select) this.selectedPlayers = this.selectedPlayers === 1 ? 2 : 1;
      if (start) this.begin();
    } else if (this.phase === "gameover" || this.phase === "ending") {
      if (start) {
        this.phase = "title";
        this.players.forEach(function (p) {
          p.joined = false;
          p.active = false;
        });
      }
    } else {
      var p = this.current();
      if (!p.connected && this.phase === "playing") {
        this.phase = "paused";
        this.autoPaused = true;
      } else if (p.connected && this.phase === "paused" && this.autoPaused) {
        this.phase = "playing";
        this.autoPaused = false;
        start = false;
      }
      if (start && p.connected) {
        this.phase = this.phase === "paused" ? "playing" : "paused";
        this.autoPaused = false;
      }
      if (this.phase === "paused" && select) {
        this.muted = !this.muted;
        this.emit("mute");
      }
      if (this.phase === "playing") {
        if (this.transition) {
          if (this.transition.type === "cloud") p.y -= 2.5;
          if (--this.transition.ticks <= 0) {
            if (this.transition.type === "cloud") this.enterBonus();
            else if (this.transition.type === "death") this.advanceTurn();
            else if (p.stage === 31) {
              this.phase = "ending";
              this.transition = null;
              this.emit("ending");
            } else {
              p.stage++;
              p.checkpoint = 32;
              this.loadStage(p.stage, 32);
            }
          }
        } else {
          this.movePlayer(p);
          if (!this.transition) this.updateWorld();
        }
      }
    }
    this.players.forEach(function (p) {
      p.last = Object.assign({}, p.input);
    });
  };
  AdventureGame.prototype.step = function (dt, inputs) {
    this.events = [];
    this.accumulator += Math.min(0.1, Math.max(0, Number(dt) || 0));
    while (this.accumulator + 1e-9 >= 1 / FPS) {
      this.accumulator -= 1 / FPS;
      this.tick(Array.isArray(inputs) ? inputs : []);
    }
  };
  AdventureGame.prototype.status = function () {
    var p = this.current();
    return {
      phase: this.phase,
      stage: p.stage + 1,
      stageLabel: label(p.stage),
      activePlayer: this.activePlayer,
      selectedPlayers: this.selectedPlayers,
      muted: this.muted,
      players: this.players.map(function (value) {
        return {
          id: value.id,
          joined: value.joined,
          alive: value.alive,
          lives: value.lives,
          score: value.score,
          level: value.stage + 1,
          stageLabel: label(value.stage),
          active: value.active,
          energy: value.energy,
          weapon: value.weapon,
        };
      }),
    };
  };
  AdventureGame.makeLevel = makeLevel;
  AdventureGame.ROUTES = copy(ROUTES);
  AdventureGame.FPS = FPS;
  AdventureGame.MAX_ENERGY = MAX_ENERGY;
  root.AdventureGame = AdventureGame;
  if (typeof module !== "undefined" && module.exports)
    module.exports = AdventureGame;
})(typeof window !== "undefined" ? window : global);
