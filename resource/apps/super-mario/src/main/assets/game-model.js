/* Independent platform-game rules and reconstructed courses. See docs/reference.md.
 * No ROM, original program, or extracted map/sprite data is included. */
(function (root) {
  "use strict";
  var TILE = 16,
    FPS = 60.0988,
    ROWS = 15;
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function overlap(a, b) {
    return (
      a.x + a.w > b.x && a.x < b.x + b.w && a.y + a.h > b.y && a.y < b.y + b.h
    );
  }
  function neutral() {
    return {
      x: 0,
      y: 0,
      a: false,
      b: false,
      start: false,
      select: false,
      connected: false,
    };
  }
  function levelLabel(index) {
    return Math.floor(index / 4) + 1 + "-" + ((index % 4) + 1);
  }
  function makePlayer(id) {
    return {
      id: id,
      joined: false,
      alive: false,
      active: false,
      lives: 3,
      score: 0,
      coins: 0,
      power: 0,
      stageIndex: 0,
      level: 1,
      stageLabel: "1-1",
      checkpointX: 32,
      x: 32,
      y: 192,
      w: 12,
      h: 16,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 1,
      invulnerable: 0,
      star: 0,
      dying: 0,
      swimCooldown: 0,
      fireCooldown: 0,
      crouching: false,
      won: false,
    };
  }
  var COURSE_TYPES = [
    ["ground", "underground", "treetops", "castle"],
    ["ground", "water", "treetops", "castle"],
    ["night", "night", "treetops", "castle"],
    ["ground", "underground", "treetops", "castle"],
    ["ground", "ground", "treetops", "castle"],
    ["night", "night", "treetops", "castle"],
    ["ground", "water", "bridge", "castle"],
    ["ground", "ground", "ground", "castle"],
  ];
  /* Explicit course recipes produce distinct geometry, enemy placements and landmarks.
   They intentionally do not claim to be the original ROM's tile coordinates. */
  var RECIPES = [
    {
      width: 214,
      pits: [
        [69, 2],
        [86, 3],
        [153, 2],
      ],
      pipes: [28, 38, 46, 57, 163, 179],
      stairs: [134, 148, 181],
    },
    {
      width: 184,
      pits: [
        [60, 2],
        [107, 3],
        [142, 2],
      ],
      pipes: [36, 74, 124, 158],
      stairs: [49, 96, 162],
    },
    {
      width: 166,
      pits: [
        [31, 3],
        [48, 3],
        [74, 4],
        [99, 3],
        [127, 3],
      ],
      pipes: [],
      stairs: [138],
    },
    {
      width: 148,
      pits: [
        [29, 3],
        [54, 3],
        [84, 4],
        [108, 3],
      ],
      pipes: [],
      stairs: [],
    },
    {
      width: 220,
      pits: [
        [45, 3],
        [78, 3],
        [119, 3],
        [156, 3],
      ],
      pipes: [24, 58, 96, 139, 174],
      stairs: [68, 108, 188],
    },
    { width: 188, pits: [], pipes: [29, 65, 104, 146], stairs: [48, 85, 124] },
    {
      width: 180,
      pits: [
        [28, 3],
        [51, 4],
        [79, 4],
        [111, 4],
        [142, 3],
      ],
      pipes: [],
      stairs: [157],
    },
    {
      width: 160,
      pits: [
        [26, 3],
        [52, 4],
        [82, 3],
        [110, 4],
      ],
      pipes: [],
      stairs: [],
    },
    {
      width: 220,
      pits: [
        [48, 3],
        [92, 4],
        [130, 3],
        [166, 3],
      ],
      pipes: [27, 64, 113, 147, 182],
      stairs: [80, 152, 194],
    },
    {
      width: 212,
      pits: [
        [34, 3],
        [71, 3],
        [111, 4],
        [153, 3],
      ],
      pipes: [49, 89, 133, 174],
      stairs: [61, 120, 188],
    },
    {
      width: 182,
      pits: [
        [26, 4],
        [53, 4],
        [85, 4],
        [115, 4],
        [145, 3],
      ],
      pipes: [],
      stairs: [158],
    },
    {
      width: 174,
      pits: [
        [28, 4],
        [59, 4],
        [91, 4],
        [123, 4],
      ],
      pipes: [],
      stairs: [],
    },
    {
      width: 230,
      pits: [
        [39, 3],
        [79, 4],
        [118, 3],
        [158, 4],
      ],
      pipes: [25, 59, 98, 139, 180],
      stairs: [68, 151, 204],
    },
    {
      width: 206,
      pits: [
        [41, 3],
        [84, 3],
        [126, 4],
        [161, 3],
      ],
      pipes: [26, 65, 105, 144, 180],
      stairs: [52, 115, 190],
    },
    {
      width: 192,
      pits: [
        [30, 4],
        [60, 4],
        [93, 4],
        [124, 4],
        [155, 3],
      ],
      pipes: [],
      stairs: [167],
    },
    {
      width: 180,
      pits: [
        [31, 4],
        [62, 4],
        [96, 4],
        [128, 4],
      ],
      pipes: [],
      stairs: [],
    },
    {
      width: 226,
      pits: [
        [43, 3],
        [81, 4],
        [124, 4],
        [164, 3],
      ],
      pipes: [25, 61, 104, 145, 186],
      stairs: [72, 134, 200],
    },
    {
      width: 232,
      pits: [
        [36, 4],
        [76, 3],
        [116, 4],
        [158, 4],
      ],
      pipes: [53, 94, 137, 177],
      stairs: [65, 149, 206],
    },
    {
      width: 200,
      pits: [
        [28, 4],
        [58, 4],
        [91, 4],
        [126, 4],
        [160, 4],
      ],
      pipes: [],
      stairs: [174],
    },
    {
      width: 190,
      pits: [
        [28, 4],
        [62, 4],
        [99, 4],
        [136, 4],
      ],
      pipes: [],
      stairs: [],
    },
    {
      width: 240,
      pits: [
        [46, 4],
        [87, 4],
        [128, 4],
        [171, 4],
      ],
      pipes: [26, 66, 108, 149, 193],
      stairs: [76, 139, 214],
    },
    {
      width: 232,
      pits: [
        [38, 4],
        [82, 4],
        [126, 4],
        [169, 4],
      ],
      pipes: [58, 103, 147, 190],
      stairs: [68, 158, 208],
    },
    {
      width: 210,
      pits: [
        [31, 4],
        [64, 4],
        [101, 4],
        [139, 4],
        [173, 4],
      ],
      pipes: [],
      stairs: [183],
    },
    {
      width: 198,
      pits: [
        [30, 4],
        [66, 4],
        [104, 4],
        [143, 4],
      ],
      pipes: [],
      stairs: [],
    },
    {
      width: 244,
      pits: [
        [42, 4],
        [86, 4],
        [130, 4],
        [176, 4],
      ],
      pipes: [26, 65, 108, 153, 196],
      stairs: [74, 142, 218],
    },
    { width: 216, pits: [], pipes: [31, 76, 122, 169], stairs: [53, 99, 146] },
    {
      width: 216,
      pits: [
        [33, 4],
        [69, 4],
        [108, 4],
        [148, 4],
        [181, 4],
      ],
      pipes: [],
      stairs: [193],
    },
    {
      width: 208,
      pits: [
        [31, 4],
        [71, 4],
        [113, 4],
        [155, 4],
      ],
      pipes: [],
      stairs: [],
    },
    {
      width: 268,
      pits: [
        [39, 4],
        [78, 4],
        [119, 4],
        [160, 4],
        [204, 4],
      ],
      pipes: [25, 58, 98, 139, 181, 225],
      stairs: [69, 150, 242],
    },
    {
      width: 258,
      pits: [
        [33, 4],
        [75, 4],
        [119, 4],
        [164, 4],
        [207, 4],
      ],
      pipes: [53, 96, 141, 185],
      stairs: [65, 153, 233],
    },
    {
      width: 246,
      pits: [
        [42, 4],
        [88, 4],
        [135, 4],
        [182, 4],
      ],
      pipes: [26, 65, 110, 156, 203],
      stairs: [77, 167, 220],
    },
    {
      width: 226,
      pits: [
        [30, 4],
        [71, 4],
        [112, 4],
        [154, 4],
      ],
      pipes: [],
      stairs: [],
    },
  ];
  function buildCourse(index) {
    index = clamp(index | 0, 0, 31);
    var world = Math.floor(index / 4) + 1,
      area = (index % 4) + 1,
      type = COURSE_TYPES[world - 1][area - 1],
      r = RECIPES[index];
    var map = Array.from({ length: ROWS }, function () {
        return Array(r.width).fill(0);
      }),
      items = {},
      pipes = [],
      enemies = [],
      platforms = [],
      coins = [];
    function tile(x, y, v) {
      if (x >= 0 && x < r.width && y >= 0 && y < ROWS) map[y][x] = v;
    }
    function rect(x, y, w, h, v) {
      for (var yy = y; yy < y + h; yy++)
        for (var xx = x; xx < x + w; xx++) tile(xx, yy, v);
    }
    function nearLandmark(x, pad) {
      return (
        r.pipes.some(function (px) {
          return x >= px - pad && x <= px + 2 + pad;
        }) ||
        r.stairs.some(function (st) {
          return x >= st - pad && x <= st + 12 + pad;
        }) ||
        r.pits.some(function (g) {
          return x >= g[0] - pad && x <= g[0] + g[1] + pad;
        })
      );
    }
    function block(x, y, content) {
      tile(x, y, content ? 3 : 2);
      if (content) items[x + ":" + y] = content;
    }
    function pipe(x, h, bonus) {
      var y = 13 - h;
      rect(x, y + 1, 2, h - 1, 0);
      tile(x, y, 7);
      tile(x + 1, y, 8);
      for (var yy = y + 1; yy < 13; yy++) {
        tile(x, yy, 5);
        tile(x + 1, yy, 6);
      }
      pipes.push({
        x: x * 16,
        y: y * 16,
        w: 32,
        h: h * 16,
        bonus: !!bonus,
        returnX: (x + 5) * 16,
      });
    }
    for (var x = 0; x < r.width; x++) {
      tile(x, 13, 1);
      tile(x, 14, 1);
    }
    r.pits.forEach(function (g) {
      rect(g[0], 13, g[1], 2, type === "castle" ? 12 : 0);
    });
    r.pipes.forEach(function (x, i) {
      pipe(
        x,
        2 + ((i + world) % 3),
        i === 1 &&
          (type === "ground" || type === "night" || type === "underground"),
      );
      if (world > 1 && i % 2 === 0)
        enemies.push({
          type: "piranha",
          x: x * 16 + 8,
          y: (13 - (2 + ((i + world) % 3))) * 16 + 20,
          pipeTop: (13 - (2 + ((i + world) % 3))) * 16,
        });
    });
    if (type === "ground" || type === "night" || type === "underground") {
      for (var k = 0; k < 6; k++) {
        var bx = 16 + k * (23 + (world % 3)),
          by = k % 2 === 0 ? 9 : 8;
        if (bx + 5 > r.width - 35) break;
        if (nearLandmark(bx, 6) || nearLandmark(bx + 4, 6)) continue;
        for (var b = 0; b < 5; b++)
          block(
            bx + b,
            by,
            b === 2
              ? k === 0
                ? "power"
                : k === 2
                  ? "star"
                  : k === 4
                    ? "1up"
                    : "coin"
              : null,
          );
        if (k === 1 || k === 3)
          for (var c = 0; c < 5; c++)
            coins.push({
              x: (bx + c) * 16 + 5,
              y: (by - 2) * 16 + 4,
              w: 6,
              h: 10,
            });
      }
    }
    if (index === 0) {
      // Familiar opening landmarks, independently laid out.
      for (var xx = 14; xx < 26; xx++)
        for (var yy = 7; yy < 11; yy++) {
          tile(xx, yy, 0);
          delete items[xx + ":" + yy];
        }
      block(16, 9, "coin");
      block(20, 9, null);
      block(21, 9, "power");
      block(22, 9, null);
      block(23, 9, "coin");
      block(24, 9, null);
      block(22, 5, "coin");
    }
    r.stairs.forEach(function (s, i) {
      var steps = i === r.stairs.length - 1 ? 7 : 4;
      for (var n = 0; n < steps; n++)
        rect(s + n, 13 - Math.min(n + 1, 6), 1, Math.min(n + 1, 6), 9);
      if (i < r.stairs.length - 1)
        for (var dn = 0; dn < steps - 1; dn++)
          rect(
            s + steps + dn,
            13 - Math.max(1, steps - 1 - dn),
            1,
            Math.max(1, steps - 1 - dn),
            9,
          );
    });
    if (type === "underground") {
      rect(0, 2, r.width - 17, 1, 9);
      for (var u = 25; u < r.width - 30; u += 31) {
        if (nearLandmark(u, 6) || nearLandmark(u + 3, 6)) continue;
        rect(u, 10, 4, 3, 2);
        for (var j = 0; j < 4; j++)
          coins.push({ x: (u + j) * 16 + 5, y: 9 * 16 - 5, w: 6, h: 10 });
      }
    }
    if (type === "treetops" || type === "bridge") {
      for (var t = 17; t < r.width - 26; t += 21) {
        if (
          r.stairs.some(function (st) {
            return t + 9 >= st - 3 && t <= st + 12;
          })
        )
          continue;
        var py = 9 - (((t / 21) | 0) % 3);
        rect(t, py, 7, 1, type === "bridge" ? 10 : 13);
        for (var c2 = 0; c2 < 6; c2++)
          coins.push({
            x: (t + c2) * 16 + 5,
            y: (py - 2) * 16 + 4,
            w: 6,
            h: 10,
          });
        platforms.push({
          x: (t + 8) * 16,
          y: (py + 1) * 16,
          w: 40,
          h: 6,
          baseY: (py + 1) * 16,
          range: 24,
          phase: t,
        });
      }
    }
    if (type === "water") {
      for (var wx = 8; wx < r.width - 12; wx += 13) {
        var wh = 2 + (wx % 3);
        rect(wx, 13 - wh, 2, wh, 9);
        for (var cc = 0; cc < 5; cc++)
          coins.push({
            x: (wx + 3 + cc) * 16 + 5,
            y: 80 + (wx % 4) * 16,
            w: 6,
            h: 10,
          });
        enemies.push({
          type: wx % 2 ? "fish" : "blooper",
          x: (wx + 6) * 16,
          y: 100 + (wx % 3) * 16,
        });
      }
    }
    if (type === "castle") {
      rect(0, 2, r.width, 1, 9);
      for (var cx = 13; cx < r.width - 37; cx += 23) {
        rect(cx, 10, 3, 3, 9);
        enemies.push({
          type: "firebar",
          x: (cx + 1) * 16 + 8,
          y: 10 * 16 - 8,
          length: world > 4 ? 5 : 4,
          angle: cx,
        });
      }
      var bridgeStart = r.width - 28;
      rect(bridgeStart, 13, 15, 2, 12);
      rect(bridgeStart, 12, 15, 1, 10);
      enemies.push({
        type: "bowser",
        x: (bridgeStart + 8) * 16,
        y: 12 * 16 - 28,
        hp: 5,
      });
      return {
        index: index,
        world: world,
        area: area,
        label: levelLabel(index),
        type: type,
        width: r.width * 16,
        map: map,
        items: items,
        pipes: pipes,
        enemies: enemies,
        platforms: platforms,
        coins: coins,
        time: 400,
        checkpoint: 32,
        goal: (r.width - 12) * 16,
        axe: { x: (r.width - 13) * 16, y: 11 * 16, w: 12, h: 20 },
        bridgeStart: bridgeStart,
      };
    }
    if (type !== "water") {
      for (var ex = 22; ex < r.width - 28; ex += 15 + (world % 3)) {
        if (
          r.pits.some(function (g) {
            return ex >= g[0] - 2 && ex < g[0] + g[1] + 2;
          })
        )
          continue;
        if (
          r.pipes.some(function (px) {
            return Math.abs(px - ex) < 4;
          })
        )
          continue;
        enemies.push({
          type:
            world >= 7 && ex % 3 === 0
              ? "hammerbro"
              : (ex + world) % 3 === 0
                ? "koopa"
                : type === "underground" && ex % 2 === 0
                  ? "buzzy"
                  : "goomba",
          x: ex * 16,
          y: 190,
          red: world > 2,
        });
      }
    }
    return {
      index: index,
      world: world,
      area: area,
      label: levelLabel(index),
      type: type,
      width: r.width * 16,
      map: map,
      items: items,
      pipes: pipes,
      enemies: enemies,
      platforms: platforms,
      coins: coins,
      time: type === "water" ? 300 : 400,
      checkpoint: Math.floor(r.width * 0.47) * 16,
      goal: (r.width - 12) * 16,
      flag: { x: (r.width - 12) * 16, y: 48, w: 4, h: 160 },
      castleX: (r.width - 7) * 16,
    };
  }
  function MarioGame(options) {
    options = options || {};
    this.phase = "title";
    this.selectedPlayers = 1;
    this.activePlayer = 1;
    this.players = [makePlayer(1), makePlayer(2)];
    this.inputs = [neutral(), neutral()];
    this.last = [neutral(), neutral()];
    this.frame = 0;
    this.accumulator = 0;
    this.cameraX = 0;
    this.level = buildCourse(0);
    this.enemies = [];
    this.powerups = [];
    this.projectiles = [];
    this.particles = [];
    this.events = [];
    this.eventId = 0;
    this.muted = !!options.muted;
    this.saveMuted = options.saveMuted || function () {};
    this.autoPaused = false;
    this.highScore = Number.isFinite(Number(options.highScore))
      ? Math.max(0, Math.floor(Number(options.highScore)))
      : 0;
    this.saveHighScore = options.saveHighScore || function () {};
    this.time = 400;
    this.timeTicks = 0;
    this.clearTicks = 0;
    this.bannerTicks = 0;
    this.bonusReturn = null;
    this.winner = 0;
    this.loadStage(0, false);
  }
  MarioGame.prototype.toggleMusic = function () {
    this.muted = !this.muted;
    try {
      this.saveMuted(this.muted);
    } catch (_) {}
    this.emit("mute");
  };
  MarioGame.prototype.player = function () {
    return this.players[this.activePlayer - 1];
  };
  MarioGame.prototype.emit = function (type, extra) {
    this.events.push(
      Object.assign({ id: ++this.eventId, type: type }, extra || {}),
    );
  };
  MarioGame.prototype.score = function (points) {
    var p = this.player();
    p.score += points;
    if (p.score > this.highScore) {
      this.highScore = p.score;
      try {
        this.saveHighScore(this.highScore);
      } catch (_) {}
    }
  };
  MarioGame.prototype.coin = function () {
    var p = this.player();
    p.coins++;
    this.score(200);
    this.emit("coin");
    if (p.coins >= 100) {
      p.coins -= 100;
      p.lives++;
      this.emit("life");
    }
  };
  MarioGame.prototype.tile = function (x, y) {
    var tx = Math.floor(x / TILE),
      ty = Math.floor(y / TILE);
    if (tx < 0 || tx >= this.level.map[0].length) return 9;
    if (ty < 0) return 0;
    if (ty >= ROWS) return 0;
    return this.level.map[ty][tx];
  };
  MarioGame.prototype.solid = function (value) {
    return value > 0 && value !== 11 && value !== 12;
  };
  MarioGame.prototype.isSolid = function (x, y) {
    return this.solid(this.tile(x, y));
  };
  MarioGame.prototype.loadStage = function (index, checkpoint) {
    var p = this.player();
    p.stageIndex = clamp(index | 0, 0, 31);
    p.stageLabel = levelLabel(p.stageIndex);
    p.level = p.stageIndex + 1;
    this.level = buildCourse(p.stageIndex);
    this.enemies = this.level.enemies.map(function (e) {
      return Object.assign(
        {
          w: e.type === "bowser" ? 28 : 14,
          h: e.type === "koopa" ? 24 : e.type === "bowser" ? 28 : 14,
          vx: -0.55,
          vy: 0,
          alive: true,
          shell: false,
          shellTicks: 0,
          cooldown: 80,
          age: 0,
          hp: 1,
        },
        e,
      );
    });
    this.powerups = [];
    this.projectiles = [];
    this.particles = [];
    this.cameraX = 0;
    this.clearTicks = 0;
    this.time = this.level.time;
    this.timeTicks = 0;
    this.bonusReturn = null;
    p.x = checkpoint ? Math.max(32, p.checkpointX) : 32;
    if (checkpoint) {
      var spawn = Math.floor(p.x / 16);
      for (var safe = 0; safe < 24; safe++) {
        var sx = spawn + safe;
        if (
          sx < this.level.map[0].length - 12 &&
          this.solid(this.level.map[13][sx]) &&
          !this.level.map[12][sx] &&
          !this.level.map[11][sx]
        ) {
          p.x = sx * 16 + 2;
          break;
        }
      }
    }
    p.y = 208 - (p.power ? 30 : 16);
    p.h = p.power ? 30 : 16;
    p.w = 12;
    p.vx = p.vy = 0;
    p.grounded = false;
    p.invulnerable = checkpoint ? 100 : 0;
    p.star = 0;
    p.dying = 0;
    p.crouching = false;
    p.fireCooldown = 0;
    p.swimCooldown = 0;
    this.cameraX = Math.max(0, p.x - 96);
    this.bannerTicks = 80;
    this.emit("stage", { stage: p.stageIndex });
  };
  MarioGame.prototype.begin = function () {
    this.players = [makePlayer(1), makePlayer(2)];
    for (var i = 0; i < this.selectedPlayers; i++) {
      this.players[i].joined = true;
      this.players[i].alive = true;
    }
    this.activePlayer = 1;
    this.players[0].active = true;
    this.phase = "playing";
    this.autoPaused = false;
    this.loadStage(0, false);
    this.emit("start");
  };
  MarioGame.prototype.setPower = function (value) {
    var p = this.player(),
      feet = p.y + p.h;
    p.power = value;
    p.h = value ? 30 : 16;
    p.y = feet - p.h;
  };
  MarioGame.prototype.loseLife = function (reason) {
    var p = this.player();
    if (p.dying || this.clearTicks || !p.alive) return;
    p.dying = 90;
    p.vy = -4;
    p.vx = 0;
    p.power = 0;
    p.h = 16;
    p.star = 0;
    p.lives--;
    this.emit("death", { reason: reason });
  };
  MarioGame.prototype.hurt = function () {
    var p = this.player();
    if (p.invulnerable || p.star || p.dying || this.clearTicks) return;
    if (p.power) {
      this.setPower(0);
      p.invulnerable = 120;
      this.emit("damage");
    } else this.loseLife("enemy");
  };
  MarioGame.prototype.advanceTurn = function () {
    var old = this.player();
    old.active = false;
    old.alive = old.lives > 0;
    var other = this.players[this.activePlayer === 1 ? 1 : 0];
    if (other.joined && other.lives > 0 && !other.won)
      this.activePlayer = other.id;
    else if (old.lives <= 0 || old.won) {
      this.phase = this.players.some(function (p) {
        return p.won;
      })
        ? "ending"
        : "gameover";
      return;
    }
    var p = this.player();
    p.active = true;
    p.alive = true;
    this.loadStage(p.stageIndex, true);
    this.last[this.activePlayer - 1] = neutral();
  };
  MarioGame.prototype.finishStage = function () {
    if (this.clearTicks || this.phase !== "playing") return;
    this.clearTicks = 150;
    this.player().invulnerable = 999;
    this.emit("clear");
  };
  MarioGame.prototype.nextStage = function () {
    var p = this.player();
    if (p.stageIndex === 31) {
      p.won = true;
      this.winner = p.id;
      this.phase = "ending";
      this.emit("ending");
      return;
    }
    p.stageIndex++;
    p.checkpointX = 32;
    this.loadStage(p.stageIndex, false);
  };
  MarioGame.prototype.hitBlock = function (tx, ty) {
    var v = this.level.map[ty] && this.level.map[ty][tx],
      p = this.player();
    if (v !== 2 && v !== 3) return;
    var content = this.level.items[tx + ":" + ty];
    if (v === 3) {
      this.level.map[ty][tx] = 4;
      delete this.level.items[tx + ":" + ty];
      if (!content || content === "coin") {
        this.coin();
        this.particles.push({
          x: tx * 16 + 5,
          y: ty * 16 - 12,
          w: 6,
          h: 8,
          vy: -2,
          life: 25,
          type: "coin",
        });
      } else {
        var type =
          content === "power" ? (p.power ? "flower" : "mushroom") : content;
        this.powerups.push({
          type: type,
          x: tx * 16 + 1,
          y: ty * 16 - 16,
          w: 14,
          h: 16,
          vx: type === "flower" ? 0 : 1,
          vy: 0,
          alive: true,
        });
        this.emit("power");
      }
    } else if (p.power) {
      this.level.map[ty][tx] = 0;
      this.score(50);
      for (var i = 0; i < 4; i++)
        this.particles.push({
          x: tx * 16 + (i % 2) * 8,
          y: ty * 16 + Math.floor(i / 2) * 8,
          w: 6,
          h: 6,
          vx: i % 2 ? 1.4 : -1.4,
          vy: i < 2 ? -3 : -2,
          life: 40,
          type: "brick",
        });
      this.emit("break");
    } else this.emit("bump");
    for (var e = 0; e < this.enemies.length; e++) {
      var foe = this.enemies[e];
      if (
        foe.alive &&
        foe.x + foe.w > tx * 16 &&
        foe.x < (tx + 1) * 16 &&
        Math.abs(foe.y + foe.h - ty * 16) < 5
      ) {
        foe.alive = false;
        this.score(100);
      }
    }
  };
  MarioGame.prototype.moveActor = function (actor, head) {
    actor.x += actor.vx;
    var left = actor.x + 1,
      right = actor.x + actor.w - 1,
      top = actor.y + 2,
      bottom = actor.y + actor.h - 1;
    if (
      actor.vx > 0 &&
      (this.isSolid(right, top) || this.isSolid(right, bottom))
    ) {
      actor.x = Math.floor(right / 16) * 16 - actor.w;
      actor.vx = 0;
    }
    if (
      actor.vx < 0 &&
      (this.isSolid(left, top) || this.isSolid(left, bottom))
    ) {
      actor.x = (Math.floor(left / 16) + 1) * 16;
      actor.vx = 0;
    }
    var previousBottom = actor.y + actor.h;
    actor.y += actor.vy;
    left = actor.x + 2;
    right = actor.x + actor.w - 2;
    actor.grounded = false;
    if (actor.vy >= 0) {
      var feet = actor.y + actor.h;
      if (this.isSolid(left, feet) || this.isSolid(right, feet)) {
        actor.y = Math.floor(feet / 16) * 16 - actor.h;
        actor.vy = 0;
        actor.grounded = true;
      }
      if (!actor.grounded)
        for (var i = 0; i < this.level.platforms.length; i++) {
          var platform = this.level.platforms[i];
          if (
            actor.x + actor.w > platform.x &&
            actor.x < platform.x + platform.w &&
            previousBottom <= platform.y + 2 &&
            actor.y + actor.h >= platform.y
          ) {
            actor.y = platform.y - actor.h;
            actor.vy = 0;
            actor.grounded = true;
            break;
          }
        }
    } else {
      var ceiling = actor.y;
      if (this.isSolid(left, ceiling) || this.isSolid(right, ceiling)) {
        var ty = Math.floor(ceiling / 16);
        if (head) {
          this.hitBlock(Math.floor(left / 16), ty);
          if (Math.floor(right / 16) !== Math.floor(left / 16))
            this.hitBlock(Math.floor(right / 16), ty);
        }
        actor.y = (ty + 1) * 16;
        actor.vy = 0;
      }
    }
  };
  MarioGame.prototype.enterBonus = function (pipe) {
    var p = this.player();
    this.bonusReturn = {
      level: this.level,
      enemies: this.enemies,
      powerups: this.powerups,
      projectiles: this.projectiles,
      cameraX: this.cameraX,
      x: pipe.returnX,
    };
    var map = Array.from({ length: 15 }, function () {
      return Array(32).fill(0);
    });
    for (var x = 0; x < 32; x++) {
      map[13][x] = 1;
      map[14][x] = 1;
      map[2][x] = 9;
    }
    var coins = [];
    for (var r = 0; r < 3; r++)
      for (var c = 0; c < 8; c++)
        coins.push({ x: 80 + c * 16, y: 96 + r * 24, w: 6, h: 10 });
    this.level = {
      index: p.stageIndex,
      world: Math.floor(p.stageIndex / 4) + 1,
      label: p.stageLabel,
      type: "underground",
      width: 512,
      map: map,
      items: {},
      pipes: [],
      enemies: [],
      platforms: [],
      coins: coins,
      goal: 470,
      bonus: true,
    };
    this.enemies = [];
    this.powerups = [];
    this.projectiles = [];
    p.x = 32;
    p.y = 192;
    p.vx = p.vy = 0;
    this.cameraX = 0;
    this.emit("pipe");
  };
  MarioGame.prototype.leaveBonus = function () {
    var saved = this.bonusReturn,
      p = this.player();
    if (!saved) return;
    this.level = saved.level;
    this.enemies = saved.enemies;
    this.powerups = saved.powerups;
    this.projectiles = saved.projectiles;
    p.x = saved.x;
    p.y = 208 - p.h;
    p.vx = p.vy = 0;
    this.cameraX = Math.max(saved.cameraX, p.x - 96);
    this.bonusReturn = null;
    this.emit("pipe");
  };
  MarioGame.prototype.updatePlayer = function (input, last) {
    var p = this.player(),
      water = this.level.type === "water";
    if (p.dying) {
      p.dying--;
      p.y += p.vy;
      p.vy += 0.18;
      if (!p.dying) this.advanceTurn();
      return;
    }
    if (p.invulnerable) p.invulnerable--;
    if (p.star) p.star--;
    if (p.fireCooldown) p.fireCooldown--;
    if (p.swimCooldown) p.swimCooldown--;
    var dx = input.x < -0.25 ? -1 : input.x > 0.25 ? 1 : 0,
      running = !!input.b,
      max = water ? (running ? 1.65 : 1.25) : running ? 3.1 : 1.75,
      acc = p.grounded ? 0.11 : 0.065;
    p.crouching = p.power > 0 && input.y > 0.5 && p.grounded && !water;
    if (p.crouching) dx = 0;
    if (dx) {
      p.vx = clamp(p.vx + dx * acc, -max, max);
      p.facing = dx;
    } else {
      p.vx *= p.grounded ? 0.83 : 0.98;
      if (Math.abs(p.vx) < 0.03) p.vx = 0;
    }
    if (input.a && !last.a) {
      if (water && !p.swimCooldown) {
        p.vy = -2.45;
        p.swimCooldown = 12;
        this.emit("jump");
      } else if (p.grounded) {
        p.vy = running ? -5.9 : -5.35;
        p.grounded = false;
        this.emit("jump");
      }
    }
    if (
      p.power === 2 &&
      input.b &&
      !last.b &&
      !p.fireCooldown &&
      this.projectiles.filter(function (v) {
        return v.owner === "player";
      }).length < 2
    ) {
      this.projectiles.push({
        owner: "player",
        type: "fire",
        x: p.x + (p.facing > 0 ? 12 : -6),
        y: p.y + Math.min(14, p.h / 2),
        w: 6,
        h: 6,
        vx: p.facing * 3.6,
        vy: 1,
        life: 180,
      });
      p.fireCooldown = 10;
      this.emit("fire");
    }
    var oldBottom = p.y + p.h;
    p.vy = Math.min(
      water ? 1.6 : 6,
      p.vy + (water ? 0.075 : input.a && p.vy < 0 ? 0.2 : 0.48),
    );
    this.moveActor(p, true);
    p.x = Math.max(this.cameraX, p.x);
    if (p.y < 32) {
      p.y = 32;
      p.vy = Math.max(0, p.vy);
    }
    if (p.y > 248 || this.tile(p.x + p.w / 2, p.y + p.h - 2) === 12) {
      this.loseLife("fall");
      return;
    }
    if (
      p.grounded &&
      !this.level.bonus &&
      this.level.type !== "castle" &&
      p.x > this.level.checkpoint &&
      p.checkpointX === 32
    )
      p.checkpointX = Math.floor(p.x / 16) * 16;
    var game = this;
    this.level.coins.forEach(function (coin) {
      if (!coin.taken && overlap(p, coin)) {
        coin.taken = true;
        game.coin();
      }
    });
    if (input.y > 0.65 && p.grounded && !this.level.bonus) {
      for (var i = 0; i < this.level.pipes.length; i++) {
        var pipe = this.level.pipes[i];
        if (
          pipe.bonus &&
          p.x + 6 > pipe.x + 7 &&
          p.x + 6 < pipe.x + 25 &&
          Math.abs(p.y + p.h - pipe.y) < 3
        ) {
          this.enterBonus(pipe);
          return;
        }
      }
    }
    if (this.level.bonus && p.x > this.level.goal) {
      this.leaveBonus();
      return;
    }
    if (this.level.axe && overlap(p, this.level.axe)) {
      for (
        var bx = this.level.bridgeStart;
        bx < this.level.bridgeStart + 15;
        bx++
      )
        this.level.map[12][bx] = 0;
      this.enemies.forEach(function (e) {
        if (e.type === "bowser") e.alive = false;
      });
      this.score(5000);
      this.finishStage();
    } else if (this.level.flag && p.x + p.w >= this.level.flag.x) {
      this.score(p.y < 80 ? 5000 : p.y < 128 ? 2000 : p.y < 176 ? 800 : 100);
      this.finishStage();
    }
    this.cameraX = clamp(
      Math.max(this.cameraX, p.x - 104),
      0,
      Math.max(0, this.level.width - 256),
    );
    this.previousBottom = oldBottom;
  };
  MarioGame.prototype.updateEnemies = function () {
    var game = this,
      p = this.player();
    this.enemies.forEach(function (e) {
      if (!e.alive || e.x > game.cameraX + 300 || e.x + e.w < game.cameraX - 40)
        return;
      e.age++;
      if (e.type === "firebar") {
        e.angle += 0.035 + (game.level.world - 1) * 0.002;
        for (var f = 1; f <= e.length; f++) {
          var orb = {
            x: e.x + Math.cos(e.angle) * f * 8 - 3,
            y: e.y + Math.sin(e.angle) * f * 8 - 3,
            w: 6,
            h: 6,
          };
          if (overlap(p, orb)) game.hurt();
        }
        return;
      }
      if (e.type === "piranha") {
        var near = Math.abs(p.x - e.x) < 28;
        var phase = e.age % 180;
        if (!near || e.y < e.pipeTop + 12)
          e.y =
            e.pipeTop +
            24 -
            Math.max(0, Math.sin((Math.PI * phase) / 180)) * 42;
      } else if (e.type === "fish" || e.type === "blooper") {
        e.x += e.type === "fish" ? -0.7 : Math.sin(e.age / 24) * 0.7;
        e.y += Math.sin(e.age / 18) * 0.65;
        if (e.type === "blooper" && e.age % 90 < 20) {
          e.x += p.x > e.x ? 0.8 : -0.8;
          e.y -= 0.65;
        }
        e.y = clamp(e.y, 55, 190);
      } else {
        var oldVx = e.vx;
        if (e.type === "bowser") {
          e.vx = e.x > game.level.goal - 120 ? -0.45 : 0.45;
          if (e.age % 160 === 0 && e.grounded) e.vy = -4;
          if (e.age % 90 === 0)
            game.projectiles.push({
              owner: "enemy",
              type: "flame",
              x: e.x - 8,
              y: e.y + 8,
              w: 12,
              h: 7,
              vx: -1.6,
              vy: 0,
              life: 220,
            });
        }
        if (e.type === "hammerbro") {
          e.vx = Math.sin(e.age / 30) * 0.45;
          if (e.age % 110 === 0 && e.grounded) e.vy = -4.4;
          if (e.age % 65 === 0)
            game.projectiles.push({
              owner: "enemy",
              type: "hammer",
              x: e.x,
              y: e.y,
              w: 7,
              h: 9,
              vx: p.x < e.x ? -1.5 : 1.5,
              vy: -4.2,
              life: 180,
            });
        }
        if (e.shell) {
          if (e.shellTicks > 0 && !--e.shellTicks) {
            e.shell = false;
            e.h = e.type === "koopa" ? 24 : 14;
            if (e.type === "koopa") e.y -= 10;
            e.vx = -0.55;
          }
        } else if (
          e.type === "koopa" &&
          e.red &&
          e.grounded &&
          !game.isSolid(e.x + (e.vx > 0 ? e.w + 2 : -2), e.y + e.h + 2)
        )
          e.vx = -e.vx;
        e.vy = Math.min(5, e.vy + 0.3);
        game.moveActor(e, false);
        if (!e.vx && oldVx) e.vx = -oldVx;
        if (e.y > 250) e.alive = false;
      }
      if (!e.alive || p.dying) return;
      if (e.shell && Math.abs(e.vx) > 2) {
        game.enemies.forEach(function (other) {
          if (
            other !== e &&
            other.alive &&
            other.type !== "firebar" &&
            overlap(e, other)
          ) {
            other.alive = false;
            game.score(200);
            game.emit("stomp");
          }
        });
      }
      if (!overlap(p, e)) return;
      if (p.star) {
        e.alive = false;
        game.score(e.type === "bowser" ? 5000 : 200);
        game.emit("stomp");
        return;
      }
      var stomp =
        p.vy >= 0 &&
        game.previousBottom <= e.y + 7 &&
        e.type !== "piranha" &&
        e.type !== "bowser" &&
        e.type !== "blooper" &&
        e.type !== "fish";
      if (stomp) {
        p.y = e.y - p.h;
        p.vy = -3.2;
        if (e.type === "koopa" || e.type === "buzzy") {
          if (e.shell) {
            var still = Math.abs(e.vx) < 0.1;
            e.vx = still ? (p.x < e.x ? 3.4 : -3.4) : 0;
            e.shellTicks = still ? 0 : 240;
          } else {
            e.shell = true;
            if (e.type === "koopa") e.y += 10;
            e.h = 14;
            e.vx = 0;
            e.shellTicks = 240;
          }
        } else e.alive = false;
        game.score(100);
        game.emit("stomp");
      } else if (
        (e.type === "koopa" || e.type === "buzzy") &&
        e.shell &&
        Math.abs(e.vx) < 0.1
      ) {
        e.vx = p.x < e.x ? 3.4 : -3.4;
        e.shellTicks = 0;
        p.invulnerable = Math.max(p.invulnerable, 12);
        game.score(100);
        game.emit("kick");
      } else game.hurt();
    });
  };
  MarioGame.prototype.updateItems = function () {
    var game = this,
      p = this.player();
    this.powerups.forEach(function (item) {
      if (!item.alive) return;
      if (item.type !== "flower") {
        item.vy = Math.min(5, item.vy + 0.24);
        var vx = item.vx;
        game.moveActor(item, false);
        if (!item.vx) item.vx = -vx;
        if (item.type === "star" && item.grounded) item.vy = -3.8;
      }
      if (item.y > 250) item.alive = false;
      if (overlap(p, item) && !p.dying) {
        item.alive = false;
        if (item.type === "1up") {
          p.lives++;
          game.emit("life");
        } else if (item.type === "star") {
          p.star = 600;
          game.score(1000);
          game.emit("star");
        } else {
          game.setPower(
            item.type === "flower" && p.power ? 2 : Math.max(1, p.power),
          );
          p.invulnerable = 40;
          game.score(1000);
          game.emit("power");
        }
      }
    });
    this.projectiles.forEach(function (shot) {
      shot.life--;
      shot.x += shot.vx;
      if (shot.type === "hammer") shot.vy += 0.18;
      if (shot.type === "fire") shot.vy = Math.min(4, shot.vy + 0.24);
      shot.y += shot.vy;
      if (shot.type === "fire" && game.isSolid(shot.x + 3, shot.y + 6)) {
        shot.y = Math.floor((shot.y + 6) / 16) * 16 - 6;
        shot.vy = -3.2;
      }
      if (
        game.isSolid(shot.x + (shot.vx > 0 ? shot.w : 0), shot.y + 2) ||
        shot.y > 250
      )
        shot.life = 0;
      if (shot.owner === "player") {
        game.enemies.forEach(function (e) {
          if (
            e.alive &&
            e.type !== "firebar" &&
            e.type !== "buzzy" &&
            overlap(shot, e)
          ) {
            shot.life = 0;
            e.hp--;
            if (e.hp <= 0) {
              e.alive = false;
              game.score(e.type === "bowser" ? 5000 : 200);
            }
            game.emit("stomp");
          }
        });
      } else if (overlap(shot, p)) game.hurt();
    });
    this.projectiles = this.projectiles.filter(function (s) {
      return s.life > 0 && s.x > game.cameraX - 40 && s.x < game.cameraX + 300;
    });
    this.particles.forEach(function (q) {
      q.life--;
      q.x += q.vx || 0;
      q.y += q.vy || 0;
      q.vy = (q.vy || 0) + 0.16;
    });
    this.particles = this.particles.filter(function (q) {
      return q.life > 0;
    });
  };
  MarioGame.prototype.tick = function (inputs) {
    this.frame++;
    var game = this;
    this.inputs = this.players.map(function (p) {
      var raw = inputs.find(function (v) {
        return Number(v.id) === p.id && v.connected;
      });
      return raw
        ? {
            x: Number(raw.x) || 0,
            y: Number(raw.y) || 0,
            a: !!raw.a,
            b: !!raw.b,
            start: !!raw.start,
            select: !!raw.select,
            connected: true,
          }
        : neutral();
    });
    var start = this.inputs.some(function (v, i) {
        return v.start && !game.last[i].start;
      }),
      select = this.inputs.some(function (v, i) {
        return v.select && !game.last[i].select;
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
      var input = this.inputs[this.activePlayer - 1],
        last = this.last[this.activePlayer - 1];
      start = input.start && !last.start;
      select = input.select && !last.select;
      if (!input.connected && this.phase === "playing") {
        this.phase = "paused";
        this.autoPaused = true;
      } else if (
        input.connected &&
        this.phase === "paused" &&
        this.autoPaused
      ) {
        this.phase = "playing";
        this.autoPaused = false;
        start = false;
      }
      if (start && input.connected) {
        this.phase = this.phase === "paused" ? "playing" : "paused";
        this.autoPaused = false;
      }
      if (this.phase === "paused" && select) {
        this.toggleMusic();
      }
      if (this.phase === "playing") {
        this.level.platforms.forEach(function (platform) {
          platform.y =
            platform.baseY +
            Math.sin((game.frame + platform.phase) / 55) * platform.range;
        });
        if (this.bannerTicks) this.bannerTicks--;
        if (this.clearTicks) {
          this.clearTicks--;
          var winner = this.player();
          winner.x += 0.8;
          if (this.time > 0) {
            var bonus = Math.min(10, this.time);
            this.time -= bonus;
            this.score(bonus * 50);
          }
          if (!this.clearTicks) this.nextStage();
        } else {
          if (++this.timeTicks >= 24) {
            this.timeTicks = 0;
            if (this.time > 0) this.time--;
            if (!this.time) this.loseLife("time");
          }
          this.updatePlayer(input, last);
          if (!this.player().dying) {
            this.updateEnemies();
            this.updateItems();
          }
        }
      }
    }
    this.last = this.inputs.map(function (v) {
      return Object.assign({}, v);
    });
  };
  MarioGame.prototype.step = function (dt, inputs) {
    this.events = [];
    this.accumulator += Math.min(0.1, Math.max(0, Number(dt) || 0));
    while (this.accumulator + 1e-9 >= 1 / FPS) {
      this.accumulator -= 1 / FPS;
      this.tick(Array.isArray(inputs) ? inputs : []);
    }
  };
  MarioGame.prototype.status = function () {
    return {
      phase: this.phase,
      stage: this.player().stageIndex + 1,
      stageLabel: this.player().stageLabel,
      activePlayer: this.activePlayer,
      selectedPlayers: this.selectedPlayers,
      muted: this.muted,
      players: this.players.map(function (p) {
        return {
          id: p.id,
          joined: p.joined,
          alive: p.alive,
          lives: p.lives,
          score: p.score,
          level: p.stageIndex + 1,
          stageLabel: p.stageLabel,
          active: p.active,
        };
      }),
    };
  };
  MarioGame.buildCourse = buildCourse;
  MarioGame.COURSE_TYPES = COURSE_TYPES;
  MarioGame.FPS = FPS;
  MarioGame.overlap = overlap;
  root.MarioGame = MarioGame;
  if (typeof module !== "undefined" && module.exports)
    module.exports = MarioGame;
})(typeof window !== "undefined" ? window : global);
