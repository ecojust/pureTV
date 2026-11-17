/* Original hand-drawn island sprites; no extracted commercial graphics. */
(function (root) {
  "use strict";
  var FONT = {
    " ": [0, 0, 0, 0, 0, 0, 0],
    A: [14, 17, 17, 31, 17, 17, 17],
    B: [30, 17, 17, 30, 17, 17, 30],
    C: [14, 17, 16, 16, 16, 17, 14],
    D: [30, 17, 17, 17, 17, 17, 30],
    E: [31, 16, 16, 30, 16, 16, 31],
    F: [31, 16, 16, 30, 16, 16, 16],
    G: [14, 17, 16, 23, 17, 17, 15],
    H: [17, 17, 17, 31, 17, 17, 17],
    I: [31, 4, 4, 4, 4, 4, 31],
    J: [7, 2, 2, 2, 18, 18, 12],
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
    ":": [0, 4, 4, 0, 4, 4, 0],
    ".": [0, 0, 0, 0, 0, 12, 12],
    "-": [0, 0, 0, 31, 0, 0, 0],
    "/": [1, 1, 2, 4, 8, 16, 16],
    "+": [0, 4, 4, 31, 4, 4, 0],
    ">": [16, 8, 4, 2, 4, 8, 16],
    "<": [1, 2, 4, 8, 4, 2, 1],
    "!": [4, 4, 4, 4, 4, 0, 4],
  };
  // Independently drawn Adventure Island HUD digits on native 8px cells.
  var HUD_DIGITS = {
    "0": [60, 102, 195, 195, 195, 102, 60, 0],
    "1": [24, 56, 24, 24, 24, 24, 126, 0],
    "2": [126, 195, 3, 30, 96, 192, 255, 0],
    "3": [126, 195, 3, 62, 3, 195, 126, 0],
    "4": [14, 30, 54, 102, 198, 255, 6, 0],
    "5": [255, 192, 192, 254, 3, 195, 126, 0],
    "6": [62, 96, 192, 254, 195, 195, 126, 0],
    "7": [255, 195, 6, 12, 24, 24, 24, 0],
    "8": [126, 195, 195, 126, 195, 195, 126, 0],
    "9": [126, 195, 195, 127, 3, 6, 124, 0],
    "X": [0, 0, 102, 60, 24, 60, 102, 0]
  };
  var COLORS = {
    forest: ["#5b9be5", "#bddff0", "#378448", "#79b835", "#a45d2d", "#633825"],
    coast: ["#73c4f0", "#e2f1e0", "#267db5", "#efcc75", "#c48d48", "#856037"],
    cave: ["#10182b", "#283347", "#4c5c72", "#937649", "#6a503b", "#3d2d2c"],
    ice: ["#7aaed2", "#d9edec", "#547ba7", "#e5f6f0", "#7faabe", "#50738b"],
    night: ["#162b50", "#5b7991", "#244748", "#478c5b", "#765b36", "#3f402b"],
  };
  function n(value, digits) {
    var s = String(Math.max(0, Math.floor(value || 0)));
    while (s.length < digits) s = "0" + s;
    return s;
  }
  function AdventureRenderer(canvas) {
    this.canvas = canvas;
    canvas.width = 256;
    canvas.height = 240;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = "pixelated";
  }
  AdventureRenderer.prototype.rect = function (x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  };
  AdventureRenderer.prototype.text = function (text, x, y, color, scale) {
    var ctx = this.ctx,
      size = scale || 1;
    ctx.fillStyle = color || "#fff2c3";
    String(text)
      .toUpperCase()
      .split("")
      .forEach(function (ch, i) {
        var rows = FONT[ch] || FONT[" "];
        for (var r = 0; r < 7; r++)
          for (var c = 0; c < 5; c++)
            if (rows[r] & (1 << (4 - c)))
              ctx.fillRect(x + (i * 6 + c) * size, y + r * size, size, size);
      });
  };
  AdventureRenderer.prototype.center = function (text, y, color, scale) {
    var s = scale || 1;
    this.text(
      text,
      Math.floor((256 - (text.length * 6 - 1) * s) / 2),
      y,
      color,
      s,
    );
  };
  AdventureRenderer.prototype.sprite = function (
    rows,
    x,
    y,
    palette,
    flip,
    scale,
  ) {
    var ctx = this.ctx,
      s = scale || 1;
    for (var r = 0; r < rows.length; r++)
      for (var c = 0; c < rows[r].length; c++) {
        var color = palette[rows[r][c]];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(
            Math.floor(x + (flip ? rows[r].length - 1 - c : c) * s),
            Math.floor(y + r * s),
            s,
            s,
          );
        }
      }
  };
  AdventureRenderer.prototype.cloud = function (x, y) {
    var r = this.rect.bind(this);
    r(x + 8, y, 24, 5, "#e3f3e5");
    r(x + 3, y + 5, 40, 7, "#e3f3e5");
    r(x, y + 12, 48, 5, "#d0e8db");
    r(x + 5, y + 17, 36, 2, "#a8cbd7");
  };
  AdventureRenderer.prototype.palm = function (x, y, small) {
    var r = this.rect.bind(this),
      s = small ? 0.65 : 1;
    for (var i = 0; i < 9; i++) {
      r(
        x + i * 1.6 * s,
        y - i * 7 * s,
        5 * s,
        8 * s,
        i % 2 ? "#806038" : "#b0823d",
      );
    }
    var tx = x + 14 * s,
      ty = y - 58 * s;
    for (i = 0; i < 6; i++) {
      r(tx - (i * 5 + 3) * s, ty + i * 2 * s, 9 * s, 3 * s, "#1e7145");
      r(tx + (i * 5 - 1) * s, ty + (i * 2 - 2) * s, 8 * s, 3 * s, "#287c43");
    }
    r(tx - 4 * s, ty - 4 * s, 12 * s, 5 * s, "#82b943");
    r(tx - 3 * s, ty + 3 * s, 4 * s, 4 * s, "#6f4c27");
  };
  AdventureRenderer.prototype.background = function (game) {
    var r = this.rect.bind(this),
      theme = game.level.theme,
      p = COLORS[theme] || COLORS.forest,
      cam = game.cameraX;
    r(0, 0, 256, 240, p[0]);
    if (theme === "cave") {
      for (var i = -1; i < 10; i++) {
        var x = i * 38 - (Math.floor(cam * 0.18) % 38);
        r(x, 25, 31, 12, p[1]);
        r(x + 4, 37, 23, 12, p[1]);
        r(x + 9, 49, 12, 15, "#1d293d");
        r(x + 13, 64, 4, 10, "#1d293d");
      }
      for (i = -1; i < 5; i++) {
        x = i * 80 - (Math.floor(cam * 0.3) % 80);
        r(x, 113, 35, 87, "#202b40");
        r(x + 7, 103, 22, 97, "#202b40");
        r(x + 12, 100, 9, 100, "#29374c");
        r(x + 24, 120, 4, 80, "#344255");
      }
      for (i = 0; i < 10; i++) {
        x = (i * 47 + 12 - Math.floor(cam * 0.12)) % 270;
        if (x < 0) x += 270;
        r(x, 73 + (i % 3) * 21, 2, 2, "#57707e");
      }
    } else {
      if (theme === "night") {
        r(204, 45, 20, 20, "#e4ddb1");
        r(199, 41, 20, 19, p[0]);
        for (i = 0; i < 22; i++)
          r((i * 37 + 13) % 256, 32 + ((i * 19) % 86), 1, 1, "#b9d5d6");
      } else {
        r(205, 45, 19, 19, "#fff0a0");
        this.cloud(30 - (Math.floor(cam * 0.12) % 300), 49);
        this.cloud(180 - (Math.floor(cam * 0.09) % 300), 86);
      }
      for (i = -1; i < 6; i++) {
        x = i * 78 - (Math.floor(cam * 0.18) % 78);
        var y = theme === "ice" ? 128 : 144;
        r(x, y + 20, 82, 42, p[2]);
        r(x + 9, y + 10, 60, 15, p[2]);
        r(x + 20, y, 38, 16, p[2]);
        r(x + 29, y - 8, 18, 16, p[2]);
        if (theme === "ice") {
          r(x + 29, y - 8, 18, 8, "#f1f5de");
          r(x + 24, y, 30, 5, "#e3efe0");
        }
      }
      if (theme === "coast") {
        r(0, 145, 256, 55, "#338dc2");
        for (i = 0; i < 7; i++) {
          var yy = 150 + i * 7;
          for (var q = 0; q < 5; q++)
            r(
              ((q * 61 + i * 13 + Math.floor(game.frame / 8)) % 270) - 10,
              yy,
              18 + (i % 2) * 8,
              1,
              i % 2 ? "#84c5d2" : "#4aa7d1",
            );
        }
      } else if (theme === "ice") {
        r(0, 183, 256, 17, "#afcdd6");
        for (i = 0; i < 8; i++)
          r(
            (i * 37 + game.frame * 0.3) % 256,
            40 + ((i * 43 + game.frame * 0.2) % 140),
            2,
            2,
            "#e5f5e9",
          );
      } else {
        for (i = -1; i < 4; i++) {
          x = i * 112 - (Math.floor(cam * 0.45) % 112);
          this.palm(x + 18, 196, true);
        }
      }
    }
    if (theme === "forest" || theme === "coast")
      for (i = -1; i < 3; i++) {
        x = i * 204 - (Math.floor(cam * 0.75) % 204);
        this.palm(x + 62, 199, false);
      }
  };
  AdventureRenderer.prototype.terrain = function (game) {
    var self = this,
      cam = game.cameraX,
      p = COLORS[game.level.theme] || COLORS.forest;
    game.level.ground.forEach(function (t) {
      var x = t.x - cam;
      if (x > 256 || x + t.w < 0) return;
      self.rect(x, t.y, t.w, 40, p[4]);
      self.rect(x, t.y, t.w, 4, p[3]);
      self.rect(x, t.y + 4, t.w, 3, p[5]);
      for (
        var k = Math.max(t.x, Math.floor(cam / 16) * 16);
        k < t.x + t.w && k < cam + 256;
        k += 16
      ) {
        self.rect(k - cam + 2, t.y + 10, 9, 2, p[5]);
        self.rect(k - cam + 8, t.y + 24, 6, 3, p[5]);
        self.rect(k - cam + 1, t.y + 14, 3, 2, p[3]);
      }
    });
    game.level.platforms.concat(game.level.ceilings).forEach(function (t) {
      var x = t.x - cam;
      if (x > 256 || x + t.w < 0) return;
      self.rect(x, t.y, t.w, t.h, p[5]);
      self.rect(x, t.y, t.w, 3, p[3]);
      for (var k = 2; k < t.w; k += 8) self.rect(x + k, t.y + 4, 5, 2, p[4]);
    });
    game.level.gaps.forEach(function (t) {
      var x = t.x - cam;
      if (x > 256 || x + t.w < 0) return;
      if (game.level.theme === "coast") {
        self.rect(x, 222, t.w, 18, "#1766a6");
        for (var k = 0; k < t.w; k += 12)
          self.rect(
            x + k,
            222 + ((Math.floor(game.frame / 12) + k) % 3),
            7,
            2,
            "#7fdaeb",
          );
      } else if (game.level.theme === "cave") {
        self.rect(x, 233, t.w, 7, "#e24a2e");
        self.rect(x, 231, t.w, 2, "#ffb84b");
      }
    });
  };
  AdventureRenderer.prototype.fruit = function (type, x, y, frame) {
    var r = this.rect.bind(this);
    x = Math.floor(x);
    y = Math.floor(y);
    if (type === "axe") {
      r(x + 5, y + 1, 2, 12, "#ae7844");
      r(x + 1, y + 1, 9, 5, "#e1eaca");
      r(x + 1, y + 5, 4, 3, "#adc5b1");
    } else if (type === "fire") {
      r(x + 3, y + 2, 7, 10, "#ed793b");
      r(x + 5, y, 3, 10, "#ffbd44");
      r(x + 4, y + 5, 4, 6, "#fff0a3");
    } else if (type === "board") {
      r(x - 3, y + 5, 19, 3, "#eb7653");
      r(x - 1, y + 8, 4, 4, "#29394a");
      r(x + 10, y + 8, 4, 4, "#29394a");
      r(x, y + 4, 12, 1, "#ffd98c");
    } else if (type === "honey") {
      var flap = Math.floor(frame / 5) % 2;
      r(x, y + 1 + flap * 3, 4, 5, "#c1eced");
      r(x + 8, y + 1 + flap * 3, 4, 5, "#c1eced");
      r(x + 4, y + 2, 4, 9, "#ffd769");
      r(x + 4, y + 6, 4, 2, "#91652d");
    } else if (type === "pot") {
      r(x + 3, y, 7, 3, "#db9855");
      r(x + 2, y + 3, 9, 8, "#bb7546");
      r(x + 4, y + 4, 2, 5, "#f0bd77");
      r(x + 3, y + 11, 7, 2, "#8d5438");
    } else if (type === "eggplant") {
      r(x + 4, y + 3, 6, 9, "#975bc2");
      r(x + 2, y + 7, 7, 5, "#975bc2");
      r(x + 5, y, 5, 4, "#77b94e");
      r(x + 5, y + 5, 2, 4, "#d29ce7");
    } else if (type === "banana") {
      r(x + 1, y + 2, 3, 7, "#f8d44e");
      r(x + 4, y + 7, 6, 4, "#f8d44e");
      r(x + 9, y + 3, 2, 5, "#f8d44e");
      r(x + 3, y + 5, 2, 3, "#fff6b0");
      r(x + 1, y, 2, 3, "#6d642e");
    } else if (type === "grape") {
      for (var i = 0; i < 3; i++) {
        r(x + i * 4, y + 3, 4, 4, "#c36ee6");
        r(x + 2 + i * 3, y + 6, 4, 4, "#a942c9");
      }
      r(x + 4, y + 9, 4, 3, "#c36ee6");
      r(x + 5, y, 2, 4, "#7ae251");
    } else if (type === "melon") {
      r(x + 1, y + 2, 10, 9, "#77bb44");
      r(x + 3, y, 6, 12, "#9ad552");
      r(x + 4, y + 2, 1, 9, "#417741");
      r(x + 7, y + 2, 1, 9, "#417741");
    } else if (type === "milk") {
      r(x + 4, y, 5, 3, "#e75e5e");
      r(x + 2, y + 3, 9, 10, "#fbf4da");
      r(x + 3, y + 6, 7, 4, "#5e9ddb");
      r(x + 4, y + 6, 2, 4, "#fff8de");
    } else {
      r(x + 2, y + 3, 9, 8, "#ee7049");
      r(x, y + 4, 12, 5, "#ee7049");
      r(x + 3, y + 3, 2, 3, "#fff1a3");
      r(x + 5, y, 2, 4, "#84532c");
      r(x + 7, y + 1, 4, 2, "#7dc849");
    }
  };
  AdventureRenderer.prototype.hero = function (p, x, y, frame) {
    if (p.invulnerable && Math.floor(frame / 4) % 2) return;
    var walk = Math.floor(frame / 6) % 2 && Math.abs(p.vx) > 0.3,
      skin = p.fairy && Math.floor(frame / 4) % 2 ? "#fff2a8" : "#f5bf7a";
    var rows = [
      ".....gggg.....",
      "....ggggggg...",
      "...ggggggggg..",
      "...bbbbsss....",
      "...bsssssks...",
      "...ssssssss...",
      "....ssssss....",
      ".....ssss.....",
      "...sssssss....",
      "..sssssssss...",
      "..ss.ssss.ss..",
      "..ss.ssss.ss..",
      "....ssssss....",
      "....llllll....",
      "...llllllll...",
      "...ll.lllll...",
      "...ss...ss....",
      "...ss...ss....",
      walk ? "..ss.....ss..." : "...ss...ss....",
      walk ? "..sss....ssss." : "...sss..sss...",
      "..............",
      "..............",
    ];
    if (!p.grounded) {
      rows[16] = "..ss....ss....";
      rows[17] = ".sss.....sss..";
      rows[18] = "..............";
      rows[19] = "..............";
    }
    this.sprite(
      rows,
      x,
      y,
      {
        g: "#db6250",
        b: "#67422f",
        s: skin,
        k: "#223526",
        l: p.id === 1 ? "#7abe36" : "#4cb6dd",
      },
      p.dir < 0,
      1,
    );
    if (p.weapon !== "none") {
      this.rect(
        x + (p.dir > 0 ? 12 : -3),
        y + 12,
        4,
        3,
        p.weapon === "fire" ? "#ffad3d" : "#d0dfb8",
      );
    }
    if (p.skateboard) {
      this.rect(x - 4, y + 21, 23, 3, "#e46146");
      this.rect(x - 2, y + 24, 4, 3, "#29394a");
      this.rect(x + 12, y + 24, 4, 3, "#29394a");
    }
    if (p.fairy) {
      var fy = y - 14 + Math.sin(frame / 6) * 3;
      this.rect(x - 5, fy, 4, 5, "#fff9cc");
      this.rect(x - 8, fy + 1, 3, 3, "#8fe2f4");
      this.rect(x - 1, fy + 1, 3, 3, "#8fe2f4");
    }
    if (p.eggplant) this.fruit("eggplant", x - 12, y + 3, frame);
  };
  AdventureRenderer.prototype.enemy = function (e, x, y, frame) {
    var r = this.rect.bind(this),
      flap = Math.floor(frame / 8) % 2;
    if (e.type === "snail") {
      r(x + 4, y + 1, 9, 10, "#ad4b3b");
      r(x + 6, y + 3, 5, 6, "#ffd382");
      r(x + 8, y + 4, 2, 4, "#ad4b3b");
      r(x, y + 10, 16, 4, "#dcad53");
      r(x, y + 5, 3, 7, "#dcad53");
      r(x, y + 5, 1, 2, "#203c3d");
    } else if (e.type === "bird" || e.type === "bat") {
      var color = e.type === "bat" ? "#a87aba" : "#ed7259";
      r(x + 5, y + 5, 7, 6, color);
      r(x, y + (flap ? 1 : 7), 7, 4, color);
      r(x + 10, y + (flap ? 1 : 7), 7, 4, color);
      r(x + 3, y + 5, 4, 3, "#f9d567");
      r(x + 5, y + 4, 2, 2, "#fff5dc");
    } else if (e.type === "snake") {
      r(x + 3, y + 2, 7, 5, "#7bce5c");
      r(x + 7, y + 5, 4, 7, "#7bce5c");
      r(x + 3, y + 10, 13, 4, "#7bce5c");
      r(x + 3, y + 3, 2, 2, "#1d3434");
      r(x, y + 6, 4, 1, "#e6a351");
    } else if (e.type === "frog") {
      r(x + 3, y + 5, 11, 7, "#8bd449");
      r(x + 2, y + 1, 4, 5, "#bfe773");
      r(x + 10, y + 1, 4, 5, "#bfe773");
      r(x + 3, y + 2, 2, 2, "#293d37");
      r(x + 11, y + 2, 2, 2, "#293d37");
      r(x, y + 11, 6, 3, "#50953c");
      r(x + 10, y + 11, 6, 3, "#50953c");
    } else if (e.type === "fish") {
      r(x + 3, y + 2, 10, 9, "#e48e54");
      r(x, y + 4, 3, 4, "#f6bf77");
      r(x + 12, y, 4, 13, "#d06e42");
      r(x + 4, y + 3, 2, 2, "#182b3b");
    } else if (e.type === "spider") {
      r(x + 4, y + 3, 9, 10, "#9d4e73");
      r(x + 2, y, 2, 18, "#c77c94");
      r(x + 13, y, 2, 18, "#c77c94");
      r(x + 5, y + 4, 2, 3, "#ffe09a");
      r(x + 10, y + 4, 2, 3, "#ffe09a");
    } else {
      r(x + 3, y, 12, 18, "#9c9882");
      r(x, y + 4, 18, 10, "#9c9882");
      r(x + 4, y + 3, 9, 3, "#cdc4a8");
      r(x + 12, y + 8, 4, 6, "#5b625c");
    }
  };
  AdventureRenderer.prototype.boss = function (boss, cam, world, frame) {
    if (!boss.alive || (boss.flash && frame % 4 < 2)) return;
    var r = this.rect.bind(this),
      x = boss.x - cam,
      y = boss.y,
      colors = [
        "#6eaa42",
        "#bd7356",
        "#7a86b2",
        "#b5a74b",
        "#a36db2",
        "#5bafb0",
        "#c65949",
        "#a99160",
      ],
      color = colors[(world - 1) % 8];
    r(x + 5, y, 23, 17, color);
    r(x + 2, y + 4, 29, 11, color);
    r(x + 9, y - 4, 4, 5, "#f5dd98");
    r(x + 23, y - 4, 4, 5, "#f5dd98");
    r(x + 4, y + 4, 6, 4, "#fce0a0");
    r(x + 6, y + 5, 2, 2, "#301e32");
    r(x + 2, y + 12, 12, 2, "#eee3b0");
    r(x + 8, y + 17, 18, 13, color);
    r(x + 6, y + 20, 22, 8, color);
    r(x + 11, y + 18, 12, 10, "#f1cf8c");
    r(x + 3, y + 20, 6, 6, color);
    r(x + 23, y + 19, 8, 7, color);
    r(x + 7, y + 28, 7, 8, color);
    r(x + 22, y + 28, 7, 8, color);
    r(x + 2, y + 34, 13, 3, "#48413b");
    r(x + 19, y + 34, 13, 3, "#48413b");
    this.rect(x + 2, y - 10, 30, 3, "#273543");
    this.rect(
      x + 2,
      y - 10,
      Math.max(0, (30 * boss.hp) / boss.maxHp),
      3,
      "#f3b450",
    );
  };
  AdventureRenderer.prototype.world = function (game) {
    if (game.level.bonus) {
      this.rect(0, 30, 256, 210, "#5298c7");
      this.cloud(30 - (game.cameraX * 0.1 % 300), 56);
      this.cloud(186 - (game.cameraX * 0.15 % 300), 94);
    } else {
      this.background(game);
      this.terrain(game);
    }
    var self = this,
      r = this.rect.bind(this),
      cam = game.cameraX;
    if (game.level.bonus) {
      game.level.ground.concat(game.level.platforms).forEach(function (floor) {
        self.ctx.save();
        self.ctx.beginPath();
        self.ctx.rect(floor.x - cam, floor.y - 12, floor.w, 32);
        self.ctx.clip();
        for (var x = floor.x; x < floor.x + floor.w; x += 32)
          self.cloud(x - cam, floor.y - 12);
        self.ctx.restore();
      });
      this.text("BONUS  FRUIT 500", 75, 34, "#fff3b8");
      this.text("FALL TO RETURN", 80, 228, "#fff3b8");
    }
    var cloud = game.level.cloud;
    if (cloud && cloud.rising) {
      this.cloud(game.current().x - cam - 17, game.current().y + game.current().h - 12);
    } else if (cloud && !cloud.used && (cloud.hint || cloud.wait > 30)) {
      // A brief glint identifies where a thrown weapon disappeared.
      var sparkleY = 177 + Math.floor(Math.sin(game.frame * 0.2) * 3);
      r(cloud.x + 10 - cam, sparkleY, 4, 1, "#fff3b8");
      r(cloud.x + 11 - cam, sparkleY - 1, 1, 4, "#fff3b8");
    }
    game.level.items.forEach(function (item) {
      if (!item.taken && item.x > cam - 16 && item.x < cam + 260)
        self.fruit(item.type, item.x - cam, item.y, game.frame);
    });
    game.level.eggs.forEach(function (e) {
      if (e.open || e.hidden || e.x < cam - 16 || e.x > cam + 256) return;
      var x = e.x - cam;
      r(x + 4, e.y, 8, 3, "#faf1d1");
      r(x + 2, e.y + 3, 12, 10, "#faf1d1");
      r(x + 4, e.y + 13, 8, 3, "#c6c8a9");
      r(x + 4, e.y + 4, 3, 3, "#c7d5c1");
      if (e.hits) {
        r(x + 7, e.y + 2, 2, 4, "#7d847b");
        r(x + 5, e.y + 6, 4, 2, "#7d847b");
        r(x + 5, e.y + 8, 2, 5, "#7d847b");
      }
    });
    game.level.hazards.forEach(function (h) {
      if (h.dead) return;
      var x = h.x - cam;
      if (x > 256 || x < -20) return;
      if (h.type === "rock") {
        r(x + 2, h.y, 9, 10, "#9f9580");
        r(x, h.y + 5, 13, 5, "#9f9580");
        r(x + 3, h.y + 2, 7, 2, "#d8c9a0");
      } else if (game.frame % h.period < Math.floor(h.period * 0.65)) {
        r(x + 2, h.y + 5, 9, 14, "#e77535");
        r(x + 4, h.y + (game.frame % 4), 5, 17, "#ffd562");
        r(x + 6, h.y + 12, 2, 7, "#fff0a2");
      }
    });
    game.level.enemies.forEach(function (e) {
      if (e.alive && e.x > cam - 24 && e.x < cam + 272)
        self.enemy(e, e.x - cam, e.y, game.frame);
    });
    game.projectiles.forEach(function (s) {
      var x = s.x - cam;
      if (s.type === "fire") {
        r(x, s.y, 7, 7, "#f4ad38");
        r(x + 2, s.y + 2, 3, 3, "#fff1aa");
      } else {
        r(x + 3, s.y, 2, 8, "#c29150");
        r(x, s.y + 1, 7, 4, "#d7e4c0");
        r(x, s.y + 4, 3, 2, "#a6b8a3");
      }
    });
    game.effects.forEach(function (effect) {
      if (effect.type === "shell") {
        r(effect.x - cam, effect.y, 3, 3, "#faf1d1");
        r(effect.x - cam, effect.y + 2, 3, 1, "#c6c8a9");
      } else self.text(String(effect.score), effect.x - cam, effect.y, "#fff3b8");
    });
    game.enemyShots.forEach(function (s) {
      r(s.x - cam, s.y, 8, 8, "#ec743c");
      r(s.x - cam + 2, s.y + 2, 4, 4, "#ffe2a1");
    });
    if (game.level.boss)
      this.boss(game.level.boss, cam, game.level.world, game.frame);
    if (!game.level.bonus) {
      var goal = game.level.goalX - cam;
      r(goal + 13, 154, 3, 46, "#e4d6a2");
      r(goal + 16, 154, 20, 13,
        game.level.boss && game.level.boss.alive ? "#c46b5c" : "#82ce66");
      this.text("GO", goal + 19, 157, "#213a37");
    }
    var p = game.current();
    if (
      !game.transition ||
      game.transition.type !== "death" ||
      game.frame % 8 < 4
    )
      this.hero(p, p.x - cam, p.y, game.frame);
  };
  AdventureRenderer.prototype.hudNumber = function (value, x, y) {
    var text = String(value), c = this.ctx;
    c.fillStyle = "#fff6de";
    for (var i = 0; i < text.length; i++) {
      var glyph = HUD_DIGITS[text[i]];
      if (!glyph) continue;
      for (var row = 0; row < 8; row++)
        for (var col = 0; col < 8; col++)
          if (glyph[row] & (128 >> col)) c.fillRect(x + i * 8 + col, y + row, 1, 1);
    }
  };
  AdventureRenderer.prototype.hud = function (game) {
    var p = game.current(), r = this.rect.bind(this);
    // The first NES game overlays score, vitality and a life portrait on the
    // scene. The former opaque dashboard and weapon labels were project UI.
    this.hudNumber(n(p.score, 6), 104, 8);
    var head = ["..rrrr..", ".rrrrrr.", "..bbssb.", ".bssssb.", ".bsssbs.", "..sssss.", "...sss..", "........"];
    var palette = { r: "#c95a36", b: "#70451d", s: "#f5bf7a" };
    for (var row = 0; row < 8; row++)
      for (var col = 0; col < 8; col++)
        if (palette[head[row][col]]) r(16 + col, 16 + row, 1, 1, palette[head[row][col]]);
    this.hudNumber("X" + p.lives, 32, 16);
    for (var i = 0; i < 16; i++) {
      var live = i < p.energy;
      r(96 + i * 4, 24, 2, 5, live ? (p.energy < 4 ? "#e74c35" : "#f6d4a5") : "#7c7c63");
      if (live) r(96 + i * 4, 24, 1, 4, "#fff4cf");
    }
  };
  AdventureRenderer.prototype.panel = function (y, h) {
    this.rect(16, y, 224, h, "#173e36");
    this.rect(18, y + 2, 220, h - 4, "#173e36");
    this.rect(16, y, 224, 2, "#e9d78b");
    this.rect(16, y + h - 2, 224, 2, "#a7b76c");
  };
  AdventureRenderer.prototype.draw = function (game) {
    var r = this.rect.bind(this);
    this.world(game);
    if (game.phase === "title") {
      r(0, 0, 256, 32, "#163e38");
      this.text("HI " + n(game.highScore, 6), 80, 13, "#e1d6a1");
      this.center("ADVENTURE", 46, "#20372a", 3);
      this.center("ADVENTURE", 43, "#ffe498", 3);
      this.center("ISLAND", 72, "#19372d", 3);
      this.center("ISLAND", 69, "#a5db6b", 3);
      this.panel(105, 65);
      this.center(
        game.selectedPlayers === 1 ? "> 1 PLAYER" : "  1 PLAYER",
        116,
        game.selectedPlayers === 1 ? "#fff1b0" : "#9dbcaa",
      );
      this.center(
        game.selectedPlayers === 2 ? "> 2 PLAYERS" : "  2 PLAYERS",
        131,
        game.selectedPlayers === 2 ? "#fff1b0" : "#9dbcaa",
      );
      this.center("ALTERNATING TURNS", 147, "#a8c7b2");
      if (Math.floor(game.frame / 40) % 2 === 0)
        this.center("PRESS START", 180, "#fff4ce");
      this.center("32 STAGES / 8 ISLAND AREAS", 214, "#ffe6b7");
      this.center("INDEPENDENT RECREATION", 227, "#dbc69a");
    } else {
      this.hud(game);
      if (game.phase === "paused") {
        this.panel(79, 83);
        this.center("PAUSED", 92, "#ffe1a0", 2);
        this.center(
          game.autoPaused ? "RECONNECT ACTIVE PLAYER" : "START TO CONTINUE",
          119,
          "#d7e8cf",
        );
        this.center(
          "SELECT MUSIC " + (game.muted ? "OFF" : "ON"),
          143,
          "#a5d8be",
        );
      } else if (game.phase === "gameover") {
        this.panel(82, 80);
        this.center("GAME OVER", 97, "#ffe1a0", 2);
        this.center("HI " + n(game.highScore, 6), 126, "#cee6bd");
        this.center("START TO TITLE", 146, "#c5d0b2");
      } else if (game.phase === "ending") {
        r(0, 30, 256, 170, "#74b4d7");
        this.cloud(20, 55);
        this.cloud(183, 70);
        this.palm(41, 186, false);
        this.palm(202, 187, false);
        r(68, 178, 123, 22, "#e8c67a");
        this.hero(
          { vx: 0, grounded: true, dir: 1, id: 1, weapon: "none" },
          104,
          158,
          game.frame,
        );
        this.hero(
          { vx: 0, grounded: true, dir: -1, id: 2, weapon: "none" },
          139,
          158,
          game.frame,
        );
        this.center("ALL 8 AREAS CLEARED!", 103, "#173d40");
        this.center("THE ISLAND IS FREE", 121, "#173d40");
        this.center("THANK YOU FOR PLAYING", 214, "#ffe4a9");
        this.center("START TO TITLE", 228, "#d6c79d");
      } else if (game.transition && game.transition.type === "clear") {
        this.panel(82, 45);
        this.center(
          game.current().stage === 31
            ? "ISLAND RESCUED!"
            : "STAGE " + game.current().stageLabel + " CLEAR",
          94,
          "#fff1ae",
        );
        this.center("VITALITY BONUS", 110, "#bce0bb");
      } else if (game.transition && game.transition.type === "death") {
        this.center(
          "PLAYER " + game.activePlayer + " - LIFE LOST",
          90,
          "#fff0c2",
        );
      }
    }
  };
  root.AdventureRenderer = AdventureRenderer;
})(typeof window !== "undefined" ? window : global);
