/* Original hand-drawn pixel artwork. No extracted commercial assets. */
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
  var ART = {
    plumber: [
      ".....rrrrr......",
      "....rrrrrrrrr...",
      "....bbbssks.....",
      "...bsbsssksss...",
      "...bsbbsssksss..",
      "...bbsssskkkk...",
      ".....sssssss....",
      "....rrbrrr......",
      "...rrrbrrbrrr...",
      "..rrrrbbbbrrrr..",
      "..ssrbybbybrss..",
      "..sssbbbbbbsss..",
      "....bbbbbbbb....",
      "....bbb..bbb....",
      "...bbb....bbb...",
      "..bbbb....bbbb..",
    ],
    goomba: [
      ".....bbbbbb.....",
      "....bbbbbbbb....",
      "...bbbbbbbbbb...",
      "..bbkbbbbbbkbb..",
      ".bbbkkbbbbkkbbb.",
      ".bbbwkbbbbkwbbb.",
      "bbbbwwbbbbwwbbbb",
      "bbbbbbbbbbbbbbbb",
      ".bbbbbbbbbbbbbb.",
      "..bbbbbbbbbbbb..",
      "....ssssssss....",
      "...ssssssssss...",
      "...ssssssssss...",
      "..kkkk....kkkk..",
      ".kkkkkk..kkkkkk.",
      "kkkkkk....kkkkkk",
    ],
    koopa: [
      ".....yyyy.......",
      "....yyyyyy......",
      "...yykkyyyy.....",
      "...yykwyyyy.....",
      "...yyyyyyyyy....",
      "....yyyyyyy.....",
      ".....yy.........",
      "....gggggg......",
      "...gwwggwwg.....",
      "..gwggggggwg....",
      "..gggggggggg....",
      "..gwggggggwg....",
      "...gwwggwwg.....",
      "....gggggg......",
      "...yyy..yyy.....",
      "..yyyy..yyyy....",
    ],
    shell: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      ".....gggggg.....",
      "...ggwwwwwwgg...",
      "..ggwggggggwgg..",
      ".ggwggggggggwgg.",
      ".ggwggggggggwgg.",
      "ggwggggggggggwgg",
      "ggwggggggggggwgg",
      ".ggwwwwwwwwwwgg.",
      "..gggggggggggg..",
      "...kkkkkkkkkk...",
    ],
    mushroom: [
      ".....rrrrrr.....",
      "...rrwwwwrrrr...",
      "..rrwwwwwwrrrr..",
      ".rrrwwwwwwrrwrr.",
      ".rrrrwwwwrrwwwr.",
      "rrrrrrrrrrrwwwww",
      "rrrwwrrrrrrrwwww",
      "rrwwwwrrrrrrrrrr",
      "rrwwwwrrrrwwrrrr",
      ".rrwwrrrrwwwwrr.",
      "..rrrrrrrrrrrr..",
      "....ssssssss....",
      "....sskssks s....".replace(/ /g, ""),
      "....ssksskss....",
      ".....ssssss.....",
      "......ssss......",
    ],
    star: [
      ".......yy.......",
      "......yyyy......",
      "......yyyy......",
      ".....yyyyyy.....",
      "yyyyyyyyyyyyyyyy",
      ".yyyyyyyyyyyyyy.",
      "..yyykyykyyyyy..",
      "...yykyykyyyy...",
      "...yyyyyyyyyy...",
      "....yyyyyyyy....",
      "...yyyyyyyyyy...",
      "...yyyyyyyyyy...",
      "..yyyyy..yyyyy..",
      "..yyy......yyy..",
      ".yy..........yy.",
      "................",
    ],
    flower: [
      ".....rrrrrr.....",
      "...rryyyyyyrr...",
      "..rryywwwwyyrr..",
      "..ryywwkkwwyyr..",
      "..ryywwkkwwyyr..",
      "..rryywwwwyyrr..",
      "...rryyyyyyrr...",
      ".....rrrrrr.....",
      ".......gg.......",
      "..gg...gg...gg..",
      ".gggg..gg..gggg.",
      ".ggggg.gg.ggggg.",
      "..gggggggggggg..",
      "....gggggggg....",
      ".......gg.......",
      ".......gg.......",
    ],
    fish: [
      "......rrrr......",
      "....rrrrrrrr....",
      "...rrrrwwrrrr...",
      "..rrrrrkwrrrr...",
      "..rrrrrwwrrrr...",
      ".rrrrrrrrrrrrr..",
      "rrrrrrrrrrrwwww.",
      "rrrrrrrrrrwwwwww",
      "wwrrrrrrrrwwwwww",
      "wwwrrrrrrrwwwww.",
      ".wwwrrrrrrrrrr..",
      "..wwwrrrrrrrr...",
      "....wwwrrrrr....",
      ".....wwwwww.....",
      "......wwww......",
      "................",
    ],
    blooper: [
      "......wwww......",
      ".....wwwwww.....",
      "....wwwwwwww....",
      "...wwwwwwwwww...",
      "..wwwwwwwwwwww..",
      ".wwwwwwwwwwwwww.",
      ".wwwkkwwwwkkwww.",
      ".wwwkkwwwwkkwww.",
      "..wwwwwwwwwwww..",
      "...wwwwwwwwww...",
      "....wwwwwwww....",
      "....wwwwwwww....",
      "...ww..ww..ww...",
      "..ww..wwww..ww..",
      ".ww....ww....ww.",
      "................",
    ],
    piranha: [
      "....rr....rr....",
      "...rwr....rwr...",
      "..rwwr....rwwr..",
      ".rwwwr....rwwwr.",
      ".rwwwr....rwwwr.",
      ".rrwwrrrrrrwwrr.",
      "..rrwwwwwwwwrr..",
      "...rrrrrrrrrr...",
      ".....rrrrrr.....",
      ".......gg.......",
      "..gg...gg...gg..",
      ".gggg..gg..gggg.",
      "..gggg.gg.gggg..",
      "....gggggggg....",
      ".......gg.......",
      ".......gg.......",
    ],
  };
  var PALETTE = {
    r: "#d84518",
    b: "#8b3e0d",
    s: "#ffb17b",
    k: "#201c0d",
    y: "#ffd77a",
    w: "#fff2df",
    g: "#60ad20",
  };
  function number(n, d) {
    return String(Math.max(0, Math.floor(n) || 0)).padStart(d, "0");
  }
  function MarioRenderer(canvas) {
    this.canvas = canvas;
    canvas.width = 256;
    canvas.height = 240;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = "pixelated";
  }
  MarioRenderer.prototype.text = function (value, x, y, color, scale) {
    var c = this.ctx,
      s = scale || 1;
    c.fillStyle = color || "#fff4e5";
    String(value)
      .toUpperCase()
      .split("")
      .forEach(function (ch, i) {
        var a = FONT[ch] || FONT[" "];
        for (var r = 0; r < 7; r++)
          for (var col = 0; col < 5; col++)
            if (a[r] & (1 << (4 - col)))
              c.fillRect(x + (i * 6 + col) * s, y + r * s, s, s);
      });
  };
  MarioRenderer.prototype.center = function (t, y, color, scale) {
    var s = scale || 1;
    this.text(
      t,
      Math.floor((256 - (String(t).length * 6 - 1) * s) / 2),
      y,
      color,
      s,
    );
  };
  MarioRenderer.prototype.sprite = function (
    name,
    x,
    y,
    palette,
    flip,
    scaleY,
  ) {
    var c = this.ctx,
      a = ART[name],
      p = Object.assign({}, PALETTE, palette || {}),
      sy = scaleY || 1;
    if (!a) return;
    c.save();
    c.translate(Math.floor(x) + (flip ? 16 : 0), Math.floor(y));
    if (flip) c.scale(-1, 1);
    for (var row = 0; row < a.length; row++)
      for (var col = 0; col < a[row].length; col++) {
        var color = p[a[row][col]];
        if (color) {
          c.fillStyle = color;
          c.fillRect(col, Math.floor(row * sy), 1, Math.ceil(sy));
        }
      }
    c.restore();
  };
  MarioRenderer.prototype.coin = function (x, y, frame) {
    var c = this.ctx,
      w = [6, 4, 2, 4][Math.floor(frame / 8) % 4];
    c.fillStyle = "#9a4900";
    c.fillRect(Math.floor(x) + (6 - w) / 2, Math.floor(y), w, 10);
    c.fillStyle = "#ffd36b";
    c.fillRect(
      Math.floor(x) + (6 - w) / 2 + 1,
      Math.floor(y) + 1,
      Math.max(1, w - 2),
      8,
    );
    c.fillStyle = "#fff4c5";
    c.fillRect(Math.floor(x) + (6 - w) / 2 + 1, Math.floor(y) + 2, 1, 5);
  };
  MarioRenderer.prototype.tile = function (value, x, y, type, frame) {
    var c = this.ctx,
      underground = type === "underground",
      castle = type === "castle",
      base = underground ? "#177aca" : castle ? "#9097a6" : "#bc5726",
      light = underground ? "#63c6e3" : castle ? "#d7d9d7" : "#ffd2a2",
      dark = underground ? "#051e49" : castle ? "#23232d" : "#552a16";
    if (!value) return;
    if (value === 1 || value === 2 || value === 4 || value === 9) {
      c.fillStyle = dark;
      c.fillRect(x, y, 16, 16);
      c.fillStyle = base;
      c.fillRect(x + 1, y + 1, 14, 14);
      c.fillStyle = light;
      c.fillRect(x + 1, y + 1, 14, 1);
      c.fillRect(x + 1, y + 1, 1, 14);
      if (value === 1 || value === 2) {
        c.fillStyle = dark;
        c.fillRect(x, y + 7, 16, 2);
        c.fillRect(x + 7, y, 2, 7);
        c.fillRect(x + 3, y + 8, 2, 8);
        c.fillRect(x + 12, y + 8, 2, 8);
      }
      if (value === 9) {
        c.fillStyle = dark;
        c.fillRect(x + 3, y + 12, 11, 2);
        c.fillRect(x + 12, y + 3, 2, 10);
        c.fillStyle = light;
        c.fillRect(x + 3, y + 3, 9, 1);
      }
      if (value === 4) {
        c.fillStyle = dark;
        [
          [3, 3],
          [12, 3],
          [3, 12],
          [12, 12],
        ].forEach(function (p) {
          c.fillRect(x + p[0], y + p[1], 1, 1);
        });
      }
      return;
    }
    if (value === 3) {
      c.fillStyle = "#713511";
      c.fillRect(x, y, 16, 16);
      c.fillStyle = ["#e99829", "#f4b447", "#ffe085", "#f4b447"][
        Math.floor(frame / 10) % 4
      ];
      c.fillRect(x + 1, y + 1, 14, 14);
      c.fillStyle = "#fff0b3";
      c.fillRect(x + 1, y + 1, 14, 1);
      c.fillStyle = "#813a0b";
      c.fillRect(x + 2, y + 2, 1, 1);
      c.fillRect(x + 13, y + 2, 1, 1);
      c.fillRect(x + 2, y + 13, 1, 1);
      c.fillRect(x + 13, y + 13, 1, 1);
      c.fillRect(x + 5, y + 4, 6, 2);
      c.fillRect(x + 4, y + 5, 2, 2);
      c.fillRect(x + 9, y + 6, 2, 2);
      c.fillRect(x + 7, y + 8, 3, 2);
      c.fillRect(x + 7, y + 12, 2, 1);
      return;
    }
    if (value >= 5 && value <= 8) {
      var l = value === 5 || value === 7,
        top = value >= 7;
      c.fillStyle = "#143600";
      c.fillRect(x, y, 16, 16);
      c.fillStyle = "#66af19";
      c.fillRect(x + (l ? 2 : 0), y + (top ? 2 : 0), 14, 16 - (top ? 3 : 0));
      c.fillStyle = "#b6e153";
      c.fillRect(
        x + (l ? 4 : 0),
        y + (top ? 2 : 0),
        l ? 4 : 3,
        16 - (top ? 3 : 0),
      );
      c.fillStyle = "#2f6e05";
      c.fillRect(x + (l ? 13 : 11), y + (top ? 2 : 0), 2, 16 - (top ? 3 : 0));
      if (top) {
        c.fillStyle = "#b6e153";
        c.fillRect(x + 1, y + 1, 14, 1);
        c.fillStyle = "#143600";
        c.fillRect(x, y + 14, 16, 2);
      }
      return;
    }
    if (value === 10) {
      c.fillStyle = "#cb7958";
      c.fillRect(x, y, 16, 6);
      c.fillStyle = "#edc5a3";
      c.fillRect(x, y, 16, 1);
      c.fillStyle = "#482316";
      c.fillRect(x + 7, y, 1, 6);
      return;
    }
    if (value === 12) {
      c.fillStyle = "#a81e15";
      c.fillRect(x, y, 16, 16);
      c.fillStyle = "#ff772a";
      for (var i = 0; i < 4; i++)
        c.fillRect(x + i * 4, y + ((i + Math.floor(frame / 12)) % 2) * 2, 4, 5);
      c.fillStyle = "#ffd08b";
      c.fillRect(x + (Math.floor(frame / 6) % 4) * 4, y, 4, 2);
      return;
    }
    if (value === 13) {
      c.fillStyle = "#d74c2a";
      c.fillRect(x, y + 2, 16, 7);
      c.fillStyle = "#fff2b5";
      c.fillRect(x + 3, y + 3, 4, 4);
      c.fillRect(x + 11, y + 4, 3, 3);
      c.fillStyle = "#7a3b18";
      c.fillRect(x, y + 9, 16, 3);
    }
  };
  MarioRenderer.prototype.background = function (g) {
    var c = this.ctx,
      t = g.level.type,
      cam = g.cameraX;
    c.fillStyle =
      t === "underground" || t === "castle" || t === "night"
        ? "#080c18"
        : t === "water"
          ? "#2043aa"
          : "#638deb";
    c.fillRect(0, 0, 256, 240);
    if (t === "ground" || t === "night" || t === "treetops" || t === "bridge") {
      for (var k = -1; k < 5; k++) {
        var x = k * 96 - (Math.floor(cam * 0.26) % 96);
        c.fillStyle = t === "night" ? "#163846" : "#258532";
        c.beginPath();
        c.moveTo(x, 208);
        c.lineTo(x + 28, 172);
        c.lineTo(x + 34, 169);
        c.lineTo(x + 64, 208);
        c.fill();
        c.fillStyle = t === "night" ? "#091e31" : "#125e26";
        c.fillRect(x + 26, 184, 2, 4);
        c.fillRect(x + 41, 194, 2, 4);
      }
      for (var q = 0; q < 4; q++) {
        var cx = q * 96 + 24 - (Math.floor(cam * 0.38) % 96),
          cy = 56 + (q % 2) * 21;
        c.fillStyle = t === "night" ? "#e0e6f4" : "#fff7e7";
        c.fillRect(cx, cy + 5, 29, 12);
        c.fillRect(cx + 6, cy, 17, 20);
        c.fillRect(cx - 4, cy + 9, 37, 7);
        c.fillStyle = t === "night" ? "#63749a" : "#a8c6fc";
        c.fillRect(cx, cy + 16, 29, 2);
      }
      for (var b = 0; b < 5; b++) {
        var bx = b * 79 - (Math.floor(cam * 0.7) % 79);
        c.fillStyle = t === "night" ? "#23543a" : "#73ad21";
        c.fillRect(bx, 201, 32, 7);
        c.fillRect(bx + 5, 196, 22, 12);
        c.fillRect(bx + 12, 192, 9, 16);
        c.fillStyle = "#27491d";
        c.fillRect(bx + 7, 202, 2, 2);
        c.fillRect(bx + 23, 199, 2, 2);
      }
    } else if (t === "water") {
      c.fillStyle = "#6eafe4";
      c.fillRect(0, 33, 256, 2);
      for (var w = 0; w < 18; w++) {
        c.fillStyle = "#aeccea";
        c.fillRect(w * 16 + (Math.floor(g.frame / 8) % 4), 35, 8, 2);
      }
      for (var s = 0; s < 12; s++) {
        var ax = s * 37 - (Math.floor(cam * 0.6) % 37);
        c.fillStyle = s % 2 ? "#eb8774" : "#b1a4c1";
        c.fillRect(ax, 186, 3, 22);
        c.fillRect(ax - 4, 193, 11, 3);
        c.fillRect(ax - 4, 187, 2, 8);
        c.fillRect(ax + 5, 189, 2, 7);
      }
    } else if (t === "castle") {
      for (var z = 0; z < 9; z++) {
        c.fillStyle = "#232331";
        c.fillRect(z * 42 - (Math.floor(cam * 0.2) % 42), 55, 20, 63);
        c.fillStyle = "#080c18";
        c.fillRect(z * 42 + 3 - (Math.floor(cam * 0.2) % 42), 59, 14, 57);
      }
    }
  };
  MarioRenderer.prototype.castle = function (x) {
    var c = this.ctx;
    for (var y = 0; y < 3; y++)
      for (var b = 0; b < 5; b++)
        this.tile(2, x + b * 8, 192 - y * 8, "castle", 0);
    c.fillStyle = "#9b9ba5";
    c.fillRect(x + 8, 150, 32, 42);
    for (var i = 0; i < 4; i++) c.fillRect(x + 8 + i * 8, 144, 4, 8);
    c.fillStyle = "#20202b";
    c.fillRect(x + 18, 177, 12, 31);
    c.fillRect(x + 20, 173, 8, 9);
    c.fillRect(x + 14, 159, 4, 7);
    c.fillRect(x + 30, 159, 4, 7);
  };
  MarioRenderer.prototype.bowser = function (e, x, y, frame) {
    var c = this.ctx;
    c.fillStyle = "#285f18";
    c.fillRect(x + 8, y + 3, 19, 22);
    c.fillStyle = "#9ed447";
    c.fillRect(x + 5, y + 4, 19, 17);
    c.fillStyle = "#fff2ce";
    for (var i = 0; i < 3; i++) {
      c.fillRect(x + 12 + i * 4, y, 3, 5);
      c.fillRect(x + 14 + i * 4, y + 20, 3, 5);
    }
    c.fillStyle = "#d87c30";
    c.fillRect(x, y + 7, 10, 14);
    c.fillStyle = "#fff2ce";
    c.fillRect(x - 2, y + 10, 9, 7);
    c.fillStyle = "#c0351c";
    c.fillRect(x - 2, y + 13, 8, 3);
    c.fillStyle = "#fff2ce";
    c.fillRect(x + 2, y + 6, 3, 4);
    c.fillStyle = "#121518";
    c.fillRect(x + 2, y + 7, 1, 2);
    c.fillStyle = "#dca146";
    c.fillRect(x + 3, y + 22 + (Math.floor(frame / 8) % 2), 8, 5);
    c.fillRect(x + 18, y + 22, 9, 5);
  };
  MarioRenderer.prototype.enemy = function (e, g) {
    if (!e.alive) return;
    var x = Math.floor(e.x - g.cameraX),
      y = Math.floor(e.y),
      c = this.ctx;
    if (x < -40 || x > 280) return;
    if (e.type === "firebar") {
      for (var i = 1; i <= e.length; i++) {
        var fx = x + Math.cos(e.angle) * i * 8,
          fy = y + Math.sin(e.angle) * i * 8;
        c.fillStyle = "#e7491c";
        c.fillRect(fx - 3, fy - 3, 6, 6);
        c.fillStyle = "#ffe09c";
        c.fillRect(fx - 1, fy - 2, 3, 3);
      }
      return;
    }
    if (e.type === "bowser") {
      this.bowser(e, x, y, g.frame);
      return;
    }
    if (e.type === "hammerbro") {
      this.sprite(
        "koopa",
        x,
        y,
        { g: "#3c861e", y: "#efd5a8" },
        e.vx < 0,
        1.35,
      );
      c.fillStyle = "#386e26";
      c.fillRect(x + 2, y, 14, 3);
      return;
    }
    var name = e.shell ? "shell" : e.type === "buzzy" ? "shell" : e.type;
    var p =
      e.type === "buzzy"
        ? { g: "#15518a", w: "#92b9cf" }
        : e.type === "koopa" && e.red
          ? { g: "#cc4728" }
          : {};
    if (e.type === "koopa" && !e.shell)
      this.sprite(name, x, y, p, e.vx > 0, 1.5);
    else this.sprite(name, x, y, p, e.vx > 0);
  };
  MarioRenderer.prototype.player = function (p, g) {
    if (!p.joined && g.phase !== "title") return;
    if (p.invulnerable > 0 && !g.clearTicks && Math.floor(g.frame / 4) % 2)
      return;
    var palette = p.id === 2 ? { r: "#e9efe0", b: "#418a27" } : {};
    if (p.power === 2) palette = { r: "#fff2cf", b: "#d94e25" };
    if (p.star) {
      var colors = ["#faff98", "#78defa", "#ee9ae7", "#9de877"];
      palette = {
        r: colors[Math.floor(g.frame / 4) % 4],
        b: colors[(Math.floor(g.frame / 4) + 2) % 4],
      };
    }
    var x = Math.floor(p.x - g.cameraX) - 2,
      y = Math.floor(p.y),
      c = this.ctx;
    if (p.dying) {
      c.save();
      c.translate(x + 8, y + 8);
      c.rotate(Math.PI);
      this.sprite("plumber", -8, -8, palette, false);
      c.restore();
      return;
    }
    if (p.crouching && p.power) y += 10;
    var sy = p.power ? (p.crouching ? 1.25 : 1.875) : 1;
    this.sprite("plumber", x, y, palette, p.facing < 0, sy);
    if (
      p.grounded &&
      Math.abs(p.vx) > 0.3 &&
      Math.floor(g.frame / (Math.abs(p.vx) > 2 ? 4 : 7)) % 2
    ) {
      c.fillStyle = palette.b || PALETTE.b;
      c.fillRect(x + 1, y + p.h - 3, 6, 3);
      c.fillRect(x + 10, y + p.h - 4, 6, 3);
    }
  };
  MarioRenderer.prototype.draw = function (g) {
    var c = this.ctx,
      self = this,
      p = g.player(),
      cam = Math.floor(g.cameraX);
    this.background(g);
    var first = Math.max(0, Math.floor(cam / 16)),
      last = Math.min(g.level.map[0].length, first + 18);
    for (var y = 2; y < 15; y++)
      for (var x = first; x < last; x++)
        this.tile(
          g.level.map[y][x],
          x * 16 - cam,
          y * 16,
          g.level.type,
          g.frame,
        );
    if (g.level.type === "treetops")
      for (var tx = 17; tx < g.level.width / 16 - 26; tx += 21) {
        var top = (9 - (((tx / 21) | 0) % 3)) * 16;
        c.fillStyle = "#e7bb86";
        c.fillRect((tx + 3) * 16 - cam, top + 12, 12, 208 - top - 12);
        c.fillStyle = "#b26b3d";
        c.fillRect((tx + 3) * 16 - cam + 8, top + 12, 4, 208 - top - 12);
      }
    g.level.platforms.forEach(function (a) {
      c.fillStyle = "#e8c48d";
      c.fillRect(Math.floor(a.x - cam), Math.floor(a.y), a.w, a.h);
      c.fillStyle = "#785733";
      c.fillRect(Math.floor(a.x - cam), Math.floor(a.y) + a.h - 2, a.w, 2);
    });
    g.level.coins.forEach(function (a) {
      if (!a.taken) self.coin(a.x - cam, a.y, g.frame);
    });
    if (g.level.flag) {
      var f = g.level.flag,
        fx = f.x - cam;
      c.fillStyle = "#e3ffbe";
      c.fillRect(fx, f.y, 2, 160);
      c.fillStyle = "#9cb746";
      c.fillRect(fx - 2, f.y - 4, 6, 5);
      var fy = g.clearTicks
        ? Math.min(190, f.y + (150 - g.clearTicks) * 1.5)
        : f.y + 6;
      c.fillStyle = "#fffcdd";
      c.beginPath();
      c.moveTo(fx, fy);
      c.lineTo(fx - 14, fy + 7);
      c.lineTo(fx, fy + 14);
      c.fill();
      c.fillStyle = "#dc4c29";
      c.fillRect(fx - 5, fy + 5, 3, 4);
      this.tile(9, fx - 7, 192, g.level.type, g.frame);
      this.castle(g.level.castleX - cam);
    }
    if (g.level.axe && !g.clearTicks) {
      var ax = g.level.axe.x - cam,
        ay = g.level.axe.y;
      c.fillStyle = "#ddb787";
      c.fillRect(ax + 5, ay + 4, 3, 16);
      c.fillStyle = "#dce8e9";
      c.fillRect(ax, ay, 11, 8);
      c.fillStyle = "#797ba8";
      c.fillRect(ax, ay + 6, 11, 2);
    }
    g.enemies.forEach(function (a) {
      self.enemy(a, g);
    });
    g.powerups.forEach(function (a) {
      if (a.alive)
        self.sprite(
          a.type === "1up" ? "mushroom" : a.type,
          a.x - cam,
          a.y,
          a.type === "1up" ? { r: "#69b62d" } : {},
        );
    });
    g.projectiles.forEach(function (a) {
      if (a.life <= 0) return;
      var xx = Math.floor(a.x - cam),
        yy = Math.floor(a.y);
      c.fillStyle = a.type === "hammer" ? "#b2d6d7" : "#ffcf70";
      c.fillRect(xx, yy, a.w, a.h);
      c.fillStyle = a.type === "hammer" ? "#61442a" : "#e54b20";
      c.fillRect(xx + 2, yy + 2, 2, Math.max(2, a.h - 3));
    });
    g.particles.forEach(function (a) {
      if (a.type === "coin") self.coin(a.x - cam, a.y, g.frame);
      else {
        c.fillStyle = "#cb743e";
        c.fillRect(Math.floor(a.x - cam), Math.floor(a.y), a.w, a.h);
      }
    });
    this.player(p, g);
    // Fixed NES-style information strip, unaffected by world scrolling.
    c.fillStyle =
      g.level.type === "ground" ||
      g.level.type === "treetops" ||
      g.level.type === "bridge"
        ? "#638deb"
        : g.level.type === "water"
          ? "#2043aa"
          : "#080c18";
    c.fillRect(0, 0, 256, 32);
    this.text(p.id === 2 ? "LUIGI" : "MARIO", 12, 8);
    this.text(number(p.score, 6), 12, 18);
    this.coin(89, 16, g.frame);
    this.text("X" + number(p.coins, 2), 98, 18);
    this.text("WORLD", 144, 8);
    this.text(g.level.label, 150, 18);
    this.text("TIME", 210, 8);
    this.text(number(g.time, 3), 216, 18);
    if (g.bannerTicks > 0 && g.phase === "playing" && !g.clearTicks) {
      c.fillStyle = "rgba(8,12,24,.8)";
      c.fillRect(64, 42, 128, 19);
      this.center("WORLD " + g.level.label + "   X " + p.lives, 48);
    }
    if (g.phase === "title") {
      c.fillStyle = "#7f2a16";
      c.fillRect(25, 43, 206, 80);
      c.fillStyle = "#e6aa74";
      c.fillRect(27, 45, 202, 2);
      c.fillRect(27, 45, 2, 76);
      c.fillStyle = "#efc29b";
      this.center("SUPER", 53, "#ffd0a6", 3);
      this.center("MARIO TV", 80, "#ffd0a6", 3);
      this.center("INDEPENDENT RECREATION", 114, "#ffe0be");
      c.fillStyle = "rgba(14,25,60,.92)";
      c.fillRect(38, 133, 180, 56);
      this.text(
        (g.selectedPlayers === 1 ? ">" : " ") + " 1 PLAYER GAME",
        54,
        141,
      );
      this.text(
        (g.selectedPlayers === 2 ? ">" : " ") + " 2 PLAYER ALTERNATE",
        54,
        155,
      );
      this.center("START TO PLAY", 176, "#ffe4a6");
      this.center("TOP " + number(g.highScore, 6), 222);
    } else if (g.phase === "paused") {
      c.fillStyle = "rgba(5,9,22,.88)";
      c.fillRect(20, 78, 216, 91);
      this.center(
        g.autoPaused ? "CONTROLLER DISCONNECTED" : "PAUSED",
        91,
        "#ffe1a3",
      );
      this.center(
        g.autoPaused ? "CONNECT ACTIVE PLAYER" : "START TO CONTINUE",
        110,
      );
      this.center("SELECT : MUSIC " + (g.muted ? "OFF" : "ON"), 130, "#c4d2e8");
      this.center("PLAYER " + g.activePlayer + " TURN", 150, "#fbb884");
    } else if (g.phase === "gameover") {
      c.fillStyle = "rgba(5,9,22,.94)";
      c.fillRect(25, 78, 206, 88);
      this.center("GAME OVER", 91, "#ffd1a3", 2);
      this.center("TOP " + number(g.highScore, 6), 122);
      this.center("START : TITLE", 145);
    } else if (g.phase === "ending") {
      c.fillStyle = "#080c18";
      c.fillRect(0, 32, 256, 208);
      this.center(
        "THANK YOU " + (g.winner === 2 ? "LUIGI" : "MARIO") + "!",
        58,
        "#ffe4b5",
      );
      this.center("YOUR QUEST IS COMPLETE", 78);
      this.center("ALL 8 WORLDS CLEARED", 98, "#9ee495");
      this.sprite("plumber", 91, 133, {}, false, 1.875);
      c.fillStyle = "#f8b8a9";
      c.fillRect(144, 136, 12, 12);
      c.fillStyle = "#e5c168";
      c.fillRect(143, 131, 14, 6);
      c.fillStyle = "#f394c6";
      c.fillRect(142, 148, 16, 21);
      c.fillRect(138, 164, 24, 5);
      this.center("SCORE " + number(p.score, 6), 190);
      this.center("START : TITLE", 216);
    }
  };
  root.MarioRenderer = MarioRenderer;
  if (typeof module !== "undefined" && module.exports)
    module.exports = { MarioRenderer: MarioRenderer, ART: ART };
})(typeof window !== "undefined" ? window : global);
