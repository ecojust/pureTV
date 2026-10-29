/* All pixel art and scenery drawn for this independent implementation. */
(function (root) {
  "use strict";
  const FONT = {
    A: [14, 17, 17, 31, 17, 17, 17],
    B: [30, 17, 17, 30, 17, 17, 30],
    C: [14, 17, 16, 16, 16, 17, 14],
    D: [30, 17, 17, 17, 17, 17, 30],
    E: [31, 16, 16, 30, 16, 16, 31],
    F: [31, 16, 16, 30, 16, 16, 16],
    G: [14, 17, 16, 23, 17, 17, 15],
    H: [17, 17, 17, 31, 17, 17, 17],
    I: [31, 4, 4, 4, 4, 4, 31],
    J: [7, 2, 2, 2, 2, 18, 12],
    K: [17, 18, 20, 24, 20, 18, 17],
    L: [16, 16, 16, 16, 16, 16, 31],
    M: [17, 27, 21, 21, 17, 17, 17],
    N: [17, 25, 21, 19, 17, 17, 17],
    O: [14, 17, 17, 17, 17, 17, 14],
    P: [30, 17, 17, 30, 16, 16, 16],
    Q: [14, 17, 17, 17, 21, 18, 13],
    R: [30, 17, 17, 30, 20, 18, 17],
    S: [15, 16, 16, 14, 1, 1, 30],
    T: [31, 4, 4, 4, 4, 4, 4],
    U: [17, 17, 17, 17, 17, 17, 14],
    V: [17, 17, 17, 17, 17, 10, 4],
    W: [17, 17, 17, 21, 21, 21, 10],
    X: [17, 17, 10, 4, 10, 17, 17],
    Y: [17, 17, 10, 4, 4, 4, 4],
    Z: [31, 1, 2, 4, 8, 16, 31],
    0: [14, 17, 19, 21, 25, 17, 14],
    1: [4, 12, 4, 4, 4, 4, 14],
    2: [14, 17, 1, 2, 4, 8, 31],
    3: [30, 1, 1, 14, 1, 1, 30],
    4: [2, 6, 10, 18, 31, 2, 2],
    5: [31, 16, 16, 30, 1, 1, 30],
    6: [14, 16, 16, 30, 17, 17, 14],
    7: [31, 1, 2, 4, 8, 8, 8],
    8: [14, 17, 17, 14, 17, 17, 14],
    9: [14, 17, 17, 15, 1, 1, 14],
    "-": [0, 0, 0, 31, 0, 0, 0],
    ":": [0, 4, 4, 0, 4, 4, 0],
    ".": [0, 0, 0, 0, 0, 12, 12],
    "/": [1, 1, 2, 4, 8, 16, 16],
    "+": [0, 4, 4, 31, 4, 4, 0],
    "!": [4, 4, 4, 4, 4, 0, 4],
    ">": [16, 8, 4, 2, 4, 8, 16],
    "<": [1, 2, 4, 8, 4, 2, 1],
    "?": [14, 17, 1, 2, 4, 0, 4],
    "*": [0, 21, 14, 31, 14, 21, 0],
    "=": [0, 0, 31, 0, 31, 0, 0],
  };
  var PALETTES = [
    ["#080a19", "#2d2440", "#66517a", "#ad8caa", "#edc686"],
    ["#08171c", "#153d48", "#287685", "#54afba", "#b6e3ce"],
    ["#190d15", "#542d31", "#985442", "#d7915c", "#ffd9a0"],
    ["#0a1023", "#20335b", "#435d91", "#7a9ebd", "#d3d3bb"],
  ];
  var JACK = [
    "000111110000",
    "001111111000",
    "011111111100",
    "001222122000",
    "001222222000",
    "000222220000",
    "031444413000",
    "331444413300",
    "331455413300",
    "001444410000",
    "000444400000",
    "000444400000",
    "000440440000",
    "000440440000",
    "002220222000",
    "022220222200",
  ];
  function BombJackRenderer(canvas) {
    this.canvas = canvas;
    canvas.width = 256;
    canvas.height = 240;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.disposed = false;
  }
  BombJackRenderer.prototype.rect = function (x, y, w, h, c) {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(w),
      Math.round(h),
    );
  };
  BombJackRenderer.prototype.text = function (v, x, y, c, s, align) {
    v = String(v).toUpperCase();
    s = s || 1;
    if (align === "center") x -= ((v.length * 6 - 1) * s) / 2;
    else if (align === "right") x -= (v.length * 6 - 1) * s;
    for (var i = 0; i < v.length; i++) {
      var glyph = FONT[v[i]];
      if (!glyph) continue;
      for (var row = 0; row < 7; row++)
        for (var col = 0; col < 5; col++)
          if (glyph[row] & (1 << (4 - col)))
            this.rect(x + (i * 6 + col) * s, y + row * s, s, s, c || "#fff");
    }
  };
  BombJackRenderer.prototype.sprite = function (
    mask,
    x,
    y,
    palette,
    scale,
    flip,
  ) {
    scale = scale || 1;
    for (var row = 0; row < mask.length; row++)
      for (var col = 0; col < mask[row].length; col++) {
        var n = Number(mask[row][col]);
        if (n)
          this.rect(
            x + (flip ? mask[row].length - 1 - col : col) * scale,
            y + row * scale,
            scale,
            scale,
            palette[n - 1],
          );
      }
  };
  BombJackRenderer.prototype.jack = function (x, y, p, tick, scale) {
    var colors = [
      "#e44c54",
      "#ffe1b1",
      "#a5294d",
      p.power === 1
        ? "#4da2fa"
        : p.power === 2
          ? "#faac43"
          : p.power === 3
            ? "#65d573"
            : "#4c73d1",
      "#fff0c6",
    ];
    if (p.floating) {
      var wing = Math.floor(tick / 5) % 2;
      this.rect(x - 4, y + 6 + wing, 6, 4, colors[2]);
      this.rect(x + 10, y + 6 + wing, 6, 4, colors[2]);
      this.rect(x - 2, y + 12, 1, 3, "#a8bfe0");
      this.rect(x + 13, y + 12, 1, 3, "#a8bfe0");
    }
    this.sprite(JACK, x, y, colors, scale || 1, p.vx < 0);
    if (p.onGround && Math.abs(p.vx) > 0 && Math.floor(tick / 6) % 2)
      this.rect(x + 1, y + 14, 3, 2, "#11182b");
  };
  BombJackRenderer.prototype.bomb = function (x, y, lit, tick) {
    this.rect(x - 3, y - 5, 7, 10, "#71819a");
    this.rect(x - 5, y - 3, 11, 6, "#71819a");
    this.rect(x - 3, y - 4, 7, 8, "#202a42");
    this.rect(x - 4, y - 2, 9, 4, "#202a42");
    this.rect(x - 3, y - 4, 3, 2, "#c9d7de");
    this.rect(x - 4, y - 1, 2, 3, "#667e96");
    this.rect(x - 1, y - 7, 3, 3, "#b2a079");
    this.rect(x + 1, y - 8, 2, 2, "#d5644b");
    if (lit) {
      this.rect(x, y - 11, 5, 4, "#f25a37");
      this.rect(x + 1, y - 13 + (tick % 4), 2, 5, "#ffe37f");
    }
  };
  BombJackRenderer.prototype.coin = function (x, y) {
    this.rect(x + 2, y, 6, 10, "#d99b34");
    this.rect(x, y + 2, 10, 6, "#d99b34");
    this.rect(x + 3, y + 1, 4, 8, "#ffe57a");
    this.rect(x + 4, y + 2, 1, 6, "#ac6c27");
  };
  BombJackRenderer.prototype.chest = function (c) {
    var x = c.x,
      y = c.y,
      base = c.color === "orange" ? "#d88839" : "#855139";
    this.rect(x, y, 14, 12, "#2b2030");
    this.rect(x + 1, y + 1, 12, c.opened ? 3 : 10, base);
    this.rect(x + 1, y + 6, 12, 2, "#f1cc72");
    this.rect(x + 3, y + 1, 2, c.opened ? 3 : 10, "#e3b36b");
    this.rect(x + 10, y + 1, 2, c.opened ? 3 : 10, "#e3b36b");
    this.rect(x + 6, y + 5, 3, 4, "#2e3440");
    if (c.reward === "key" && !c.opened) {
      this.rect(x + 6, y - 8, 5, 4, "#e7d687");
      this.rect(x + 6, y - 4, 2, 6, "#e7d687");
    }
  };
  BombJackRenderer.prototype.enemy = function (e, t) {
    var x = e.x,
      y = e.y;
    if (e.morphTicks > 0 || (e.morphWarning && Math.floor(t / 5) % 2)) {
      this.rect(x - 2, y - 2, 18, 1, "#e6b3fa");
      this.rect(x - 2, y + 17, 18, 1, "#e6b3fa");
      this.rect(x - 2, y - 2, 1, 20, "#e6b3fa");
      this.rect(x + 15, y - 2, 1, 20, "#e6b3fa");
    }
    if (e.kind === "mummy") {
      this.rect(x + 2, y, 9, 13, "#d6d8be");
      for (var i = 0; i < 4; i++)
        this.rect(x + 2, y + 2 + i * 3, 9, 1, "#737e83");
      this.rect(x + 3, y + 3, 7, 2, "#242332");
      this.rect(x + 4, y + 3, 1, 1, "#f5d164");
      this.rect(x + 8, y + 3, 1, 1, "#f5d164");
      this.rect(x + (Math.floor(t / 8) % 2 ? 1 : 7), y + 13, 5, 3, "#c9c3a7");
    } else if (e.kind === "fire") {
      this.rect(x + 2, y + 2, 9, 9, "#e34a38");
      this.rect(x + 4, y - 1, 5, 12, "#f8a344");
      this.rect(x + 5, y + 4, 3, 6, "#ffe291");
      this.rect(x + 4, y + 3, 1, 2, "#311528");
      this.rect(x + 8, y + 3, 1, 2, "#311528");
    } else {
      var cy = Math.floor(t / 8) % 2 ? 0 : 4,
        col = e.kind === "bat" ? "#b875ce" : "#6bbd91";
      this.rect(x + 4, y + 4, 6, 8, col);
      this.rect(x - 4, y + cy, 8, 3, col);
      this.rect(x + 10, y + cy, 8, 3, col);
      this.rect(x - 1, y + 2 + cy, 5, 4, col);
      this.rect(x + 10, y + 2 + cy, 5, 4, col);
      this.rect(x + 4, y + 4, 2, 2, "#ffeaa2");
      this.rect(x + 8, y + 4, 2, 2, "#ffeaa2");
      this.rect(x + 5, y + 8, 4, 2, "#ee9d61");
    }
  };
  BombJackRenderer.prototype.door = function (d, open, pal) {
    this.rect(d.x - 3, d.y - 3, 26, 35, pal[2]);
    this.rect(d.x, d.y, 20, 32, open ? "#060914" : pal[1]);
    for (var i = 0; i < 4; i++)
      this.rect(d.x + 2 + i * 5, d.y + 2, 2, 28, open ? "#171c32" : pal[3]);
    this.rect(d.x - 4, d.y - 5, 28, 4, pal[4]);
    if (open) {
      this.text("^", d.x + 7, d.y + 10, pal[4]);
      this.rect(d.x + 8, d.y + 9, 4, 2, "#ffe499");
      this.rect(d.x + 6, d.y + 11, 8, 2, "#ffe499");
      this.rect(d.x + 9, d.y + 13, 2, 6, "#ffe499");
    }
  };
  BombJackRenderer.prototype.background = function (r, pal, stage) {
    this.rect(0, 0, r.w, r.h, pal[0]);
    for (var y = 0; y < r.h; y += 16) {
      this.rect(0, y, r.w, 1, pal[1]);
      for (var x = y % 32 ? 16 : 0; x < r.w; x += 32)
        this.rect(x, y, 1, 16, pal[1]);
    }
    for (var px = 24; px < r.w; px += 112) {
      this.rect(px, 16, 26, r.h - 24, pal[1]);
      this.rect(px + 2, 18, 2, r.h - 28, pal[2]);
      this.rect(px + 23, 18, 2, r.h - 28, pal[2]);
      for (var gy = 32; gy < r.h - 32; gy += 64) {
        this.rect(px + 9, gy, 8, 2, pal[2]);
        this.rect(px + 12, gy + 2, 2, 12, pal[2]);
        this.rect(px + 8, gy + 7, 10, 2, pal[2]);
        this.rect(px + 8, gy + 16, 10, 2, pal[2]);
      }
      this.rect(px - 3, 12, 32, 5, pal[2]);
    }
    if (stage % 4 === 0) {
      for (var wy = r.h - 4; wy < r.h; wy += 2)
        this.rect(0, wy, r.w, 1, "#3f8795");
    }
  };
  BombJackRenderer.prototype.world = function (g) {
    var p = g.player,
      r = g.room,
      pal = PALETTES[(p.stage - 1) % 4],
      cx = Math.round(Math.max(0, Math.min(r.w - 256, p.x - 120))),
      cy = Math.round(Math.max(0, Math.min(r.h - 208, p.y - 110)));
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 32, 256, 208);
    this.ctx.clip();
    this.ctx.translate(-cx, 32 - cy);
    this.background(r, pal, p.stage);
    for (var i = 0; i < r.platforms.length; i++) {
      var t = r.platforms[i];
      this.rect(t.x, t.y, t.w, t.h, pal[2]);
      this.rect(t.x, t.y, t.w, 2, pal[4]);
      this.rect(t.x, t.y + 5, t.w, 2, pal[1]);
      for (var x = t.x + 8; x < t.x + t.w; x += 16)
        this.rect(x, t.y + 2, 1, 3, pal[1]);
    }
    var open =
      r.kind === "royal"
        ? !r.bombs.some(function (b) {
            return !b.collected;
          })
        : r.kind === "action"
          ? p.key
          : true;
    if (r.door) this.door(r.door, open, pal);
    if (r.secret && r.secret.open) {
      this.door(r.secret, true, pal);
      this.text("S", r.secret.x + 7, r.secret.y - 14, "#7be5d6");
    }
    r.chests.forEach(this.chest.bind(this));
    for (var bi = 0; bi < r.bombs.length; bi++) {
      var b = r.bombs[bi];
      if (!b.collected) this.bomb(b.x, b.y, r.flame === b.id, g.tick);
    }
    for (var ei = 0; ei < r.enemies.length; ei++) {
      if (r.enemies[ei].alive) this.enemy(r.enemies[ei], g.tick);
    }
    for (var ii = 0; ii < r.items.length; ii++)
      if (!r.items[ii].taken) this.coin(r.items[ii].x, r.items[ii].y);
    if (!p.invulnerable || Math.floor(g.tick / 5) % 2 === 0)
      this.jack(p.x - 1, p.y, p, g.tick, 1);
    if (r.kind === "torture")
      this.text("JUMPS LEFT: " + r.jumps, 128, 56, "#f4c676", 1, "center");
    this.ctx.restore();
  };
  BombJackRenderer.prototype.title = function (g) {
    var pal = PALETTES[0];
    this.background({ w: 256, h: 240 }, pal, 1);
    for (var row = 0; row < 8; row++) {
      this.rect(
        104 - row * 10,
        112 + row * 10,
        48 + row * 20,
        10,
        row % 2 ? "#58433d" : "#695245",
      );
      this.rect(104 - row * 10, 112 + row * 10, 48 + row * 20, 1, "#a18461");
    }
    this.rect(115, 156, 27, 35, "#090c18");
    this.text("MIGHTY", 129, 22, "#583744", 2, "center");
    this.text("MIGHTY", 128, 20, "#f6cd8a", 2, "center");
    this.text("BOMB JACK", 129, 44, "#583744", 3, "center");
    this.text("BOMB JACK", 128, 42, "#ed685f", 3, "center");
    this.text("THE SIXTEEN TEMPLES", 128, 72, "#b8bdd7", 1, "center");
    this.jack(111, 92, { power: 0, vx: 0, onGround: true }, 0, 3);
    this.bomb(80, 110, true, 0);
    this.bomb(178, 118, false, 0);
    this.rect(32, 190, 192, 32, "#0b0e20");
    this.text(
      "SELECT: " +
        g.selectedPlayers +
        " PLAYER" +
        (g.selectedPlayers === 2 ? "S" : ""),
      128,
      195,
      "#efc983",
      1,
      "center",
    );
    this.text("PRESS START", 128, 210, "#fff1d0", 1, "center");
    this.text(
      "HI " + String(g.highScore).padStart(6, "0"),
      128,
      230,
      "#8d94b5",
      1,
      "center",
    );
  };
  BombJackRenderer.prototype.draw = function (g) {
    if (this.disposed) return;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.rect(0, 0, 256, 240, "#080b19");
    if (g.phase === "title") {
      this.title(g);
      return;
    }
    this.world(g);
    var p = g.player;
    this.rect(0, 0, 256, 31, "#0c1020");
    this.text(
      "P" + p.id + " " + String(p.score).padStart(6, "0"),
      5,
      5,
      "#efcf87",
    );
    this.text("STAGE " + p.stage, 157, 5, "#f4d9ae");
    this.text("LIFE " + p.lives, 5, 18, "#dba0a4");
    this.text("M " + p.mightyCoins, 72, 18, "#86b8eb");
    this.text(
      "TIME " + Math.ceil(p.time),
      152,
      18,
      p.time < 15 ? "#ff745f" : "#b6c8da",
    );
    this.rect(0, 30, 256, 2, "#b18a5c");
    if (g.messageTicks > 0) {
      this.rect(4, 220, 248, 16, "#0b1026");
      this.text(g.message.substring(0, 40), 128, 225, "#ead3a3", 1, "center");
    }
    if (
      g.phase === "paused" ||
      g.phase === "gameover" ||
      g.phase === "ending"
    ) {
      this.rect(18, 79, 220, 98, "#090d20");
      this.rect(18, 79, 220, 2, "#e1bd7f");
      this.rect(18, 175, 220, 2, "#795854");
      if (g.phase === "ending") {
        this.text("PAMERA IS FREE!", 128, 90, "#ffe0a0", 2, "center");
        for (var i = 0; i < 3; i++) {
          this.rect(
            105 + i * 19,
            125,
            11,
            18,
            ["#b67bd4", "#69c4cb", "#e791a9"][i],
          );
          this.rect(107 + i * 19, 119, 7, 8, "#ffdcaa");
          this.rect(105 + i * 19, 116, 11, 3, "#f2c761");
        }
        this.text("16 TEMPLES CONQUERED", 128, 153, "#dedce5", 1, "center");
      } else {
        this.text(
          g.phase === "paused" ? "PAUSED" : "GAME OVER",
          128,
          99,
          "#f3cf88",
          2,
          "center",
        );
        this.text(
          g.autoPause
            ? "RECONNECT ACTIVE PLAYER"
            : g.phase === "paused"
              ? "START: RESUME"
              : "START: RETURN TO TITLE",
          128,
          130,
          "#becce2",
          1,
          "center",
        );
        if (g.phase === "paused")
          this.text(
            "SELECT: MUSIC " + (g.muted ? "OFF" : "ON"),
            128,
            151,
            "#8d9fbf",
            1,
            "center",
          );
      }
    }
  };
  BombJackRenderer.prototype.dispose = function () {
    this.disposed = true;
  };
  root.BombJackRenderer = BombJackRenderer;
})(window);
