/* Independent Mighty Bomb Jack-inspired rules; no ROM or original game code. */
(function (root) {
  "use strict";
  var Levels = root.BombJackLevels;
  if (!Levels && typeof require === "function") Levels = require("./levels.js");
  function actor(id) {
    return {
      id: id,
      joined: false,
      alive: true,
      finished: false,
      lives: 3,
      score: 0,
      level: 1,
      stage: 1,
      room: null,
      actionRoom: null,
      x: 24,
      y: 184,
      vx: 0,
      vy: 0,
      onGround: true,
      floating: false,
      mightyCoins: 0,
      power: 0,
      powerTicks: 0,
      time: 60,
      timer: 0,
      invulnerable: 90,
      key: false,
    };
  }
  function overlap(a, b, w, h) {
    return (
      a.x + 10 > b.x &&
      a.x < b.x + (w || 12) &&
      a.y + 16 > b.y &&
      a.y < b.y + (h || 12)
    );
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function BombJackGame(options) {
    options = options || {};
    this.phase = "title";
    this.players = [actor(1), actor(2)];
    this.selectedPlayers = 1;
    this.activePlayer = 1;
    this.previous = {};
    this.connected = {};
    this.accumulator = 0;
    this.tick = 0;
    this.events = [];
    this.eventId = 0;
    this.highScore = Number(options.highScore) || 0;
    this.muted = !!options.muted;
    this.autoPause = false;
    this.message = "";
    this.messageTicks = 0;
  }
  Object.defineProperty(BombJackGame.prototype, "player", {
    get: function () {
      return this.players[this.activePlayer - 1];
    },
  });
  Object.defineProperty(BombJackGame.prototype, "room", {
    get: function () {
      return this.player.room;
    },
  });
  BombJackGame.prototype.emit = function (type) {
    this.events.push({ id: ++this.eventId, type: type });
  };
  BombJackGame.prototype.notice = function (text) {
    this.message = text;
    this.messageTicks = 150;
  };
  BombJackGame.prototype.start = function () {
    this.players = [actor(1), actor(2)];
    for (var i = 0; i < this.selectedPlayers; i++) {
      this.players[i].joined = true;
      this.loadRoom(this.players[i], "action");
    }
    this.activePlayer = 1;
    this.phase = "playing";
    this.autoPause = false;
    this.accumulator = 0;
    this.notice("UP + A: HIGH JUMP");
    this.emit("start");
  };
  BombJackGame.prototype.loadRoom = function (p, kind) {
    p.room = Levels.room(p.stage, kind);
    p.x = p.room.spawn.x;
    p.y = p.room.spawn.y;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    p.floating = false;
    p.time = 60;
    p.timer = 0;
    p.power = 0;
    p.powerTicks = 0;
    p.invulnerable = 90;
    if (kind === "action") {
      p.key = false;
      p.actionRoom = null;
    }
    this.emit("door");
  };
  BombJackGame.prototype.addScore = function (p, amount) {
    var previous = Math.floor(p.score / 30000);
    p.score += amount;
    this.highScore = Math.max(this.highScore, p.score);
    if (Math.floor(p.score / 30000) > previous && p.lives < 9) {
      p.lives++;
      this.emit("life");
    }
  };
  BombJackGame.prototype.advanceStage = function () {
    var p = this.player;
    this.addScore(p, Math.floor(p.time) * 20 + 1000);
    if (p.stage === 16) {
      p.finished = true;
      p.alive = false;
      var other = this.players[2 - this.activePlayer];
      if (other.joined && other.alive && !other.finished) {
        this.activePlayer = other.id;
        this.notice("PLAYER " + other.id + " - YOUR TURN");
      } else this.phase = "ending";
      this.emit("win");
      return;
    }
    p.stage++;
    p.level = p.stage;
    this.loadRoom(p, "action");
    this.notice("STAGE " + p.stage + " - " + Levels.stages[p.stage - 1].name);
  };
  BombJackGame.prototype.loseLife = function (reason) {
    if (this.phase !== "playing") return;
    var p = this.player;
    p.lives--;
    p.alive = p.lives > 0;
    p.mightyCoins = 0;
    p.power = 0;
    this.emit("death");
    if (p.alive) this.loadRoom(p, "action");
    var other = this.players[2 - this.activePlayer];
    if (other.joined && other.alive && !other.finished) {
      this.activePlayer = other.id;
      this.notice("PLAYER " + other.id + " - YOUR TURN");
    } else if (!p.alive) {
      this.phase = this.players.some(function (v) {
        return v.finished;
      })
        ? "ending"
        : "gameover";
      this.notice(reason === "time" ? "TIME UP" : "GAME OVER");
    } else this.notice(reason === "time" ? "TIME UP - TRY AGAIN" : "TRY AGAIN");
  };
  BombJackGame.prototype.enterTorture = function () {
    var p = this.player;
    if (p.room.kind === "torture") return;
    p.mightyCoins = 0;
    this.loadRoom(p, "torture");
    this.notice("TOO GREEDY! JUMP 12 TIMES");
    this.emit("danger");
  };
  BombJackGame.prototype.usePower = function () {
    var p = this.player;
    if (p.mightyCoins < 1 || p.room.kind === "torture") {
      this.notice("COLLECT A MIGHTY COIN");
      return;
    }
    p.mightyCoins--;
    p.power = Math.min(3, p.power + 1);
    p.powerTicks = p.power === 3 ? 300 : 1200;
    this.emit("power");
    if (p.power === 3) {
      p.room.items.forEach(function (item) {
        if (item.enemy && !item.taken) item.ticks = 300;
      });
      p.room.enemies.forEach(function (e) {
        if (e.alive) {
          e.alive = false;
          p.room.items.push({ x: e.x, y: e.y, kind: "coin", taken: false,
            enemy: e, ticks: 300 });
        }
      });
      this.notice("GREEN: COLLECT COINS IN 5 SECONDS");
    } else
      this.notice(
        p.power === 1 ? "BLUE: OPEN ORANGE CHESTS" : "ORANGE: TOUCH TO OPEN",
      );
  };
  BombJackGame.prototype.openChest = function (c) {
    var p = this.player;
    if (c.opened || (c.color === "orange" && p.power < 1)) return false;
    c.opened = true;
    this.emit("chest");
    if (c.reward === "key") {
      p.key = true;
      this.notice("PALACE DOOR OPEN - PRESS UP");
    } else if (c.reward === "coin") {
      p.mightyCoins++;
      this.addScore(p, 100);
    } else if (c.reward === "drink") {
      p.time += 10;
      this.notice("MIGHTY DRINK +10 SECONDS");
    } else if (c.reward === "sphinx") {
      if (p.room.secret) p.room.secret.open = true;
      this.notice("SPHINX OPENS A SECRET PASSAGE");
    } else this.addScore(p, 500);
    if (p.mightyCoins > 9 || p.time > 99) this.enterTorture();
    return true;
  };
  BombJackGame.prototype.collectBomb = function (b) {
    var p = this.player,
      r = p.room;
    if (b.collected) return;
    b.collected = true;
    var lit = r.flame === b.id;
    this.addScore(p, lit ? 200 + Math.min(8, r.chain) * 50 : 100);
    r.chain = lit ? r.chain + 1 : 0;
    var left = r.bombs.filter(function (v) {
      return !v.collected;
    });
    r.flame = left.length ? left[0].id : -1;
    this.emit(lit ? "flame" : "bomb");
    if (!left.length && r.kind === "royal") {
      this.addScore(p, r.chain * 200);
      this.notice("PALACE CLEAR! EXIT ON THE RIGHT");
      this.emit("clear");
    }
  };
  BombJackGame.prototype.enterDoor = function () {
    var p = this.player,
      r = p.room;
    if (r.secret && r.secret.open && overlap(p, r.secret, 20, 32)) {
      p.actionRoom = r;
      this.loadRoom(p, "secret");
      return true;
    }
    if (!r.door || !overlap(p, r.door, 20, 32)) return false;
    if (r.kind === "action") {
      if (!p.key) {
        this.notice("LAND ON THE KEY CHEST");
        return false;
      }
      this.loadRoom(p, "royal");
      this.notice("COLLECT ALL 24 BOMBS");
      return true;
    }
    if (r.kind === "royal") {
      if (
        r.bombs.some(function (b) {
          return !b.collected;
        })
      ) {
        this.notice("COLLECT EVERY BOMB FIRST");
        return false;
      }
      this.advanceStage();
      return true;
    }
    if (r.kind === "secret") {
      var saved = p.actionRoom;
      if (saved) {
        p.room = saved;
        p.x = saved.secret.x - 20;
        p.y = saved.h - 24;
        p.vx = 0;
        p.vy = 0;
        p.onGround = true;
        p.invulnerable = 90;
        p.room.secret.open = false;
        p.actionRoom = null;
      } else this.loadRoom(p, "action");
      return true;
    }
    return false;
  };
  BombJackGame.prototype.step = function (dt, inputs) {
    inputs = inputs || [];
    this.events = [];
    var by = {},
      edges = {},
      self = this;
    inputs.forEach(function (v) {
      by[v.id] = v;
      self.connected[v.id] = !!v.connected;
      var old = self.previous[v.id] || {};
      edges[v.id] = {
        a: !!v.a && !old.a,
        b: !!v.b && !old.b,
        start: !!v.start && !old.start,
        select: !!v.select && !old.select,
        up: v.y < -0.4 && !(old.y < -0.4),
      };
    });
    for (var id = 1; id <= 2; id++) if (!by[id]) this.connected[id] = false;
    var menu = inputs.some(function (v) {
        return v.connected && edges[v.id].start;
      }),
      select = inputs.some(function (v) {
        return v.connected && edges[v.id].select;
      });
    if (this.phase === "title") {
      if (select) {
        this.selectedPlayers = this.selectedPlayers === 1 ? 2 : 1;
        this.emit("select");
      }
      if (menu) this.start();
    } else if (this.phase === "gameover" || this.phase === "ending") {
      if (menu) this.phase = "title";
    } else {
      var current = by[this.activePlayer],
        edge = edges[this.activePlayer] || {};
      if (!current || !current.connected) {
        if (this.phase === "playing") {
          this.phase = "paused";
          this.autoPause = true;
          this.notice("ACTIVE CONTROLLER DISCONNECTED");
        }
      } else if (this.autoPause) {
        this.phase = "playing";
        this.autoPause = false;
        this.notice("CONTROLLER RECONNECTED");
      } else if (edge.start) {
        this.phase = this.phase === "playing" ? "paused" : "playing";
        this.emit("pause");
      }
      if (this.phase === "paused" && select) {
        this.muted = !this.muted;
        this.emit("select");
      }
      if (this.phase === "playing" && current && current.connected) {
        if (edge.b) this.usePower();
        if (edge.up) this.enterDoor();
        if (edge.a) {
          if (this.player.onGround) this.jump(current);
          else {
            // A second press brakes the jump immediately; holding then floats.
            this.player.vy = 0;
            this.player.floating = true;
          }
        }
        this.accumulator += Math.min(0.1, Math.max(0, Number(dt) || 0)) * 60;
        while (this.accumulator >= 1 && this.phase === "playing") {
          this.accumulator--;
          var turn = this.activePlayer;
          this.update(current);
          if (this.activePlayer !== turn) {
            this.accumulator = 0;
            break;
          }
        }
      }
    }
    inputs.forEach(function (v) {
      self.previous[v.id] = {
        a: !!v.a,
        b: !!v.b,
        start: !!v.start,
        select: !!v.select,
        y: v.y || 0,
      };
    });
    for (var pid = 1; pid <= 2; pid++) if (!by[pid]) this.previous[pid] = {};
  };
  BombJackGame.prototype.jump = function (input) {
    var p = this.player;
    p.vy = input.y < -0.4 ? -6 : input.y > 0.4 ? -3.2 : -4.8;
    p.onGround = false;
    p.floating = false;
    this.emit("jump");
    if (p.room.kind === "torture") {
      p.room.jumps--;
      if (p.room.jumps <= 0) {
        this.loadRoom(p, "action");
        p.mightyCoins = 0;
        p.time = 60;
        this.notice("FREED! BE LESS GREEDY");
      }
    }
  };
  BombJackGame.prototype.update = function (input) {
    var p = this.player,
      r = p.room;
    this.tick++;
    if (this.messageTicks > 0) this.messageTicks--;
    p.timer++;
    if (p.timer >= 60) {
      p.timer = 0;
      p.time--;
      if (p.time <= 0) {
        this.loseLife("time");
        return;
      }
    }
    if (p.invulnerable > 0) p.invulnerable--;
    if (p.powerTicks > 0 && --p.powerTicks === 0) p.power = 0;
    var oldY = p.y;
    p.vx = clamp(Number(input.x) || 0, -1, 1) * 2;
    p.x = clamp(p.x + p.vx, 2, r.w - 12);
    p.floating = !!input.a && !p.onGround && p.vy >= 0;
    p.vy = Math.min(p.vy + 0.12, p.floating ? 0.55 : 3.5);
    p.y += p.vy;
    p.onGround = false;
    if (p.y < 4) {
      p.y = 4;
      p.vy = Math.max(0, p.vy);
    }
    if (p.vy >= 0) {
      var land = null;
      r.platforms.forEach(function (t) {
        if (
          p.x + 10 > t.x &&
          p.x < t.x + t.w &&
          oldY + 16 <= t.y + 0.2 &&
          p.y + 16 >= t.y &&
          (!land || t.y < land.y)
        )
          land = t;
      });
      if (land) {
        p.y = land.y - 16;
        p.vy = 0;
        p.onGround = true;
        p.floating = false;
      }
    }
    for (var ci = 0; ci < r.chests.length; ci++) {
      var c = r.chests[ci];
      if (c.opened) continue;
      var onTop =
        p.vy >= 0 &&
        p.x + 10 > c.x &&
        p.x < c.x + 14 &&
        oldY + 16 <= c.y + 4 &&
        p.y + 16 >= c.y;
      if ((p.power >= 2 && overlap(p, c, 14, 12)) || onTop) {
        this.openChest(c);
        if (p.room !== r) return;
      }
    }
    for (var bi = 0; bi < r.bombs.length; bi++) {
      var b = r.bombs[bi];
      if (!b.collected && overlap(p, { x: b.x - 5, y: b.y - 5 }, 10, 10))
        this.collectBomb(b);
    }
    for (var ii = 0; ii < r.items.length; ii++) {
      var item = r.items[ii];
      if (!item.taken && item.enemy && --item.ticks <= 0) {
        item.taken = true;
        item.enemy.alive = true;
        // Brief visible reformation avoids an unavoidable contact death.
        item.enemy.reformTicks = 30;
        this.emit("danger");
        continue;
      }
      if (!item.taken && overlap(p, item, 10, 12)) {
        item.taken = true;
        p.mightyCoins++;
        this.addScore(p, 100);
        this.emit("coin");
        if (p.mightyCoins > 9) {
          this.enterTorture();
          return;
        }
      }
    }
    for (var ei = 0; ei < r.enemies.length; ei++) {
      var e = r.enemies[ei];
      if (!e.alive) continue;
      if (e.reformTicks > 0) {
        e.reformTicks--;
        continue;
      }
      e.age = (e.age || 0) + 1;
      e.phase += 0.035;
      e.morphWarning = e.kind === "mummy" && r.kind !== "torture" && e.age > 180 + (e.id % 3) * 60;
      if (e.morphTicks > 0) e.morphTicks--;
      if (e.kind === "mummy" && r.kind !== "torture" && e.age >= 240 + (e.id % 3) * 60) {
        // Mummies leave their patrol and become airborne hunters. The warning
        // and acceleration leave room to react instead of teleporting at Jack.
        e.kind = ["bat", "bird", "fire"][(p.stage + e.id - 1) % 3];
        e.hunting = true;
        e.vy = -0.5;
        e.morphTicks = 30;
        e.targetX = p.x;
        e.targetY = p.y;
      }
      if (e.hunting) {
        if (e.kind !== "bat" || e.age % 90 === 0) {
          e.targetX = p.x;
          e.targetY = p.y;
        }
        var speed = (e.kind === "fire" ? 0.75 : 1.15) + p.stage * 0.015;
        e.vx = clamp(e.vx + Math.sign(e.targetX - e.x) * 0.025, -speed, speed);
        e.vy = clamp(e.vy + Math.sign(e.targetY - e.y) * 0.02, -speed, speed);
        e.x = clamp(e.x + e.vx, 2, r.w - 16);
        e.y = clamp(e.y + e.vy, 4, r.h - 18);
      } else {
        e.x += e.vx * (1 + p.stage * 0.025);
        if (e.x < e.min || e.x > e.max) {
          e.vx = -e.vx;
          e.x = clamp(e.x, e.min, e.max);
        }
        if (e.kind === "bat") e.y = e.baseY + Math.sin(e.phase) * 24;
        else if (e.kind === "bird") e.y = e.baseY + Math.sin(e.phase * 0.6) * 36;
        else if (e.kind === "fire") {
          e.y = e.baseY + Math.sin(e.phase) * 12;
          e.x += Math.sign(p.x - e.x) * 0.18;
        }
      }
      if (!p.invulnerable && overlap(p, { x: e.x + 2, y: e.y + 2 }, 9, 10)) {
        this.loseLife("enemy");
        return;
      }
    }
    if (p.y > r.h + 24) this.loseLife("fall");
  };
  BombJackGame.prototype.status = function () {
    var self = this;
    return {
      phase: this.phase,
      stage: this.player.stage,
      stageLabel: this.room ? this.room.name : "SELECT PLAYERS",
      activePlayer: this.activePlayer,
      players: this.players.map(function (p) {
        return {
          id: p.id,
          joined: p.joined,
          alive: p.alive,
          lives: p.lives,
          score: p.score,
          level: p.stage,
          stageLabel: "STAGE " + p.stage + (p.room ? " · " + p.room.name : ""),
          active: p.id === self.activePlayer && p.joined && !p.finished,
          connected: !!self.connected[p.id],
        };
      }),
    };
  };
  root.BombJackGame = BombJackGame;
  if (typeof module !== "undefined" && module.exports)
    module.exports = BombJackGame;
})(typeof window !== "undefined" ? window : global);
