/* Perspective road, scenery and original vector karts. Canvas 2D / Chrome 61. */
(function (root) {
  "use strict";
  var THEMES = {
    coast: {
      sky: ["#5ebee3", "#d6f4f1"],
      ground: "#5ebea3",
      edge: "#e4d4a5",
      road: "#536371",
      mountain: "#4aa6ad",
      stripe: "#f6b7a2",
      accent: "#70f5e3",
    },
    forest: {
      sky: ["#7ab9ca", "#e4edbd"],
      ground: "#4f8e60",
      edge: "#aab987",
      road: "#4d5a5b",
      mountain: "#3d7468",
      stripe: "#d6ddb6",
      accent: "#d4fb8d",
    },
    canyon: {
      sky: ["#efa27f", "#ffe3b4"],
      ground: "#d88c61",
      edge: "#edc28a",
      road: "#665d5b",
      mountain: "#b86e54",
      stripe: "#fae5b5",
      accent: "#ffd38a",
    },
    harbor: {
      sky: ["#172448", "#5c5489"],
      ground: "#243e58",
      edge: "#5c7390",
      road: "#354050",
      mountain: "#2a3659",
      stripe: "#65d4d4",
      accent: "#9cf4ed",
    },
  };
  var COLORS = [
    "#ff9568",
    "#79ead2",
    "#b5a0ff",
    "#ffcd64",
    "#7abcef",
    "#f69bc8",
    "#d3e38b",
    "#efbda1",
  ];
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function mod(v, n) {
    return ((v % n) + n) % n;
  }
  function CoastKartRenderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("Canvas 2D unavailable");
    this.frames = 0;
    this.language = "zh";
  }
  CoastKartRenderer.prototype.tr = function (zh, en) {
    return this.language.indexOf("en") === 0 ? en : zh;
  };
  CoastKartRenderer.prototype.round = function (x, y, w, h, r, color) {
    var c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.fill();
  };
  CoastKartRenderer.prototype.text = function (
    s,
    x,
    y,
    size,
    color,
    weight,
    align,
  ) {
    var c = this.ctx;
    c.font = (weight || "600") + " " + size + 'px Arial,"Noto Sans",sans-serif';
    c.fillStyle = color || "#fff";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(s, x, y);
  };
  CoastKartRenderer.prototype.poly = function (points, color) {
    var c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    points.forEach(function (p, i) {
      if (i) c.lineTo(p[0], p[1]);
      else c.moveTo(p[0], p[1]);
    });
    c.closePath();
    c.fill();
  };
  CoastKartRenderer.prototype.ellipse = function (x, y, rx, ry, color) {
    var c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  };
  CoastKartRenderer.prototype.scenery = function (theme, x, y, size, index) {
    var c = this.ctx;
    c.save();
    c.translate(x, y);
    c.scale(size, size);
    if (theme === "coast") {
      this.poly(
        [
          [-3, 0],
          [3, 0],
          [8, -47],
          [2, -50],
        ],
        "#8d8266",
      );
      for (var j = 0; j < 5; j++) {
        var a = j * 1.2;
        this.poly(
          [
            [5, -47],
            [5 + Math.cos(a) * 34, -48 + Math.sin(a) * 15],
            [5 + Math.cos(a) * 20, -55 + Math.sin(a) * 10],
          ],
          j % 2 ? "#208f7b" : "#3eb991",
        );
      }
      if (index % 3 === 0) {
        this.poly(
          [
            [-23, -2],
            [23, -2],
            [0, -25],
          ],
          "#f7cc74",
        );
        this.poly(
          [
            [0, -25],
            [0, -2],
            [23, -2],
          ],
          "#f79a72",
        );
      }
    } else if (theme === "forest") {
      this.round(-4, -47, 8, 47, 2, "#706e50");
      this.poly(
        [
          [-29, -15],
          [0, -84],
          [29, -15],
        ],
        "#296d59",
      );
      this.poly(
        [
          [-22, -37],
          [0, -101],
          [22, -37],
        ],
        "#39856a",
      );
      this.poly(
        [
          [-16, -59],
          [0, -112],
          [16, -59],
        ],
        "#52a276",
      );
    } else if (theme === "canyon") {
      this.poly(
        [
          [-34, 0],
          [-25, -64],
          [-12, -72],
          [-7, -107],
          [13, -107],
          [17, -69],
          [31, -60],
          [38, 0],
        ],
        "#ae614c",
      );
      this.poly(
        [
          [-7, -107],
          [13, -107],
          [17, -69],
          [31, -60],
          [38, 0],
          [7, 0],
        ],
        "#c47a55",
      );
      c.fillStyle = "#e2a06a";
      c.fillRect(-24, -61, 52, 7);
      c.fillRect(-30, -24, 64, 5);
    } else {
      this.round(-17, -88, 34, 88, 2, "#253451");
      for (var row = 0; row < 5; row++)
        for (var col = 0; col < 3; col++) {
          c.fillStyle = (row + col + index) % 3 === 0 ? "#ffd2a3" : "#66b8c3";
          c.fillRect(-12 + col * 9, -80 + row * 15, 4, 7);
        }
      c.fillStyle = "#54d8e1";
      c.fillRect(-20, -90, 40, 3);
      c.fillRect(29, -120, 3, 120);
      this.ellipse(29, -121, 7, 4, "#ffdaac");
    }
    c.restore();
  };
  CoastKartRenderer.prototype.kart = function (
    x,
    y,
    size,
    id,
    steer,
    drift,
    shield,
    boost,
    time,
  ) {
    var c = this.ctx;
    c.save();
    c.translate(x, y);
    c.scale(size, size);
    c.rotate(steer * 0.055);
    var color = COLORS[(id - 1) % COLORS.length];
    this.ellipse(0, 3, 49, 13, "rgba(13,28,42,.35)");
    if (boost) {
      this.poly(
        [
          [-30, -1],
          [-20, 28 + Math.sin(time * 45) * 9],
          [-10, -1],
        ],
        "#ffcb69",
      );
      this.poly(
        [
          [10, -1],
          [20, 28 + Math.cos(time * 47) * 9],
          [30, -1],
        ],
        "#8af4e9",
      );
    }
    this.round(-48, -24, 17, 28, 5, "#162b3c");
    this.round(31, -24, 17, 28, 5, "#162b3c");
    this.round(-43, -28, 10, 5, 2, "#536775");
    this.round(33, -28, 10, 5, 2, "#536775");
    this.poly(
      [
        [-30, -35],
        [30, -35],
        [39, -10],
        [24, 3],
        [-24, 3],
        [-39, -10],
      ],
      color,
    );
    this.round(-26, -16, 52, 18, 5, color);
    this.round(-34, -42, 68, 8, 3, "#e8f5eb");
    this.round(-30, -40, 60, 5, 2, color);
    this.round(-22, -34, 44, 21, 7, "#264356");
    this.ellipse(0, -48, 21, 22, "#f0cba4");
    this.ellipse(0, -53, 22, 20, color);
    this.round(-21, -55, 42, 13, 6, "#214757");
    this.round(-15, -53, 15, 5, 2, "#bdf8f5");
    c.fillStyle = "#f6d5b3";
    c.fillRect(-28, -30, 11, 6);
    c.fillRect(17, -30, 11, 6);
    this.round(-17, -18, 34, 8, 3, "#243c4d");
    this.round(-26, -10, 11, 5, 2, "#fff3cb");
    this.round(15, -10, 11, 5, 2, "#fff3cb");
    if (drift) {
      for (var i = 0; i < 4; i++) {
        var spark = drift > 1.6 ? "#ffdc82" : "#7ee9ff";
        this.poly(
          [
            [-47 - i * 5, 0],
            [-54 - i * 7, -5 + i * 4],
            [-42 - i * 5, 5],
          ],
          spark,
        );
        this.poly(
          [
            [47 + i * 5, 0],
            [54 + i * 7, -5 + i * 4],
            [42 + i * 5, 5],
          ],
          spark,
        );
      }
    }
    if (shield) {
      c.strokeStyle = "#a1fff1";
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, -28, 58, 55, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  };
  CoastKartRenderer.prototype.itemIcon = function (type, x, y, size) {
    var c = this.ctx;
    c.save();
    c.translate(x, y);
    c.scale(size, size);
    if (type === "boost") {
      this.poly(
        [
          [-5, -15],
          [12, -15],
          [2, -3],
          [11, -3],
          [-10, 17],
          [-4, 2],
          [-13, 2],
        ],
        "#ffe28c",
      );
    } else if (type === "shield") {
      this.poly(
        [
          [0, -17],
          [15, -10],
          [12, 7],
          [0, 18],
          [-12, 7],
          [-15, -10],
        ],
        "#78e7d1",
      );
      this.poly(
        [
          [0, -11],
          [9, -7],
          [7, 4],
          [0, 12],
        ],
        "#d8fff6",
      );
    } else if (type === "trap") {
      this.poly(
        [
          [0, -16],
          [17, 14],
          [-17, 14],
        ],
        "#ffad7e",
      );
      this.round(-2, -7, 4, 11, 1, "#785447");
      this.ellipse(0, 10, 2, 2, "#785447");
    } else if (type === "pulse") {
      this.ellipse(0, 0, 13, 13, "#b6a3ff");
      this.ellipse(0, 0, 7, 7, "#ede9ff");
      c.strokeStyle = "#b6a3ff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 18, -1, 1);
      c.stroke();
    } else {
      this.text("?", 0, 1, 29, "#e9fff7", "700", "center");
    }
    c.restore();
  };
  CoastKartRenderer.prototype.world = function (
    game,
    p,
    vx,
    vy,
    w,
    h,
    preview,
  ) {
    var c = this.ctx,
      track = game.track,
      theme = THEMES[track.theme],
      horizon = h * 0.36,
      time = game.clock;
    var s = preview ? 390 + this.frames * 0.65 : p.s;
    c.save();
    c.beginPath();
    c.rect(vx, vy, w, h);
    c.clip();
    c.translate(vx, vy);
    var grad = c.createLinearGradient(0, 0, 0, horizon + 90);
    grad.addColorStop(0, theme.sky[0]);
    grad.addColorStop(1, theme.sky[1]);
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    this.ellipse(
      w * 0.78,
      h * 0.15,
      track.theme === "harbor" ? 24 : 34,
      track.theme === "harbor" ? 24 : 34,
      track.theme === "harbor" ? "#fff2cf" : "#fff6cd",
    );
    var shift = Math.sin((s / track.length) * Math.PI * 2) * 30;
    this.poly(
      [
        [0, horizon + 50],
        [0, horizon - 12],
        [w * 0.14 + shift, horizon - 62],
        [w * 0.3 + shift, horizon - 18],
        [w * 0.52 + shift, horizon - 80],
        [w * 0.77 + shift, horizon - 20],
        [w, horizon - 65],
        [w, horizon + 50],
      ],
      theme.mountain,
    );
    if (track.theme === "coast") {
      c.fillStyle = "#62c7d0";
      c.fillRect(0, horizon + 12, w, 80);
      for (var wave = 0; wave < 5; wave++) {
        c.fillStyle = "rgba(232,255,246,.3)";
        c.fillRect(
          (wave * 213 + s * 0.05) % w,
          horizon + 25 + wave * 12,
          90,
          2,
        );
      }
    }
    c.fillStyle = theme.ground;
    c.fillRect(0, horizon + 73, w, h);
    var points = [],
      cx = 0,
      dx = 0,
      base = CoastKartGame.elevation(track, s),
      cameraX = p.x * 250;
    for (var i = 0; i <= 42; i++) {
      var z = 80 + i * 35;
      dx += CoastKartGame.curve(track, s + z) * 0.002 * 35;
      cx += dx * 35;
      var scale = (h * 0.95) / z;
      points.push({
        z: z,
        s: s + z,
        x: w / 2 + (cx - cameraX) * scale,
        y:
          horizon +
          (144 + base - CoastKartGame.elevation(track, s + z)) * scale,
        half: 250 * track.width * scale,
        scale: scale,
        cx: cx,
      });
    }
    for (var j = points.length - 1; j > 0; j--) {
      var far = points[j],
        near = points[j - 1],
        stripe = Math.floor(far.s / 100) % 2,
        road = theme.road;
      var nearW = near.half,
        farW = far.half;
      this.poly(
        [
          [far.x - farW * 1.35, far.y],
          [far.x + farW * 1.35, far.y],
          [near.x + nearW * 1.35, near.y],
          [near.x - nearW * 1.35, near.y],
        ],
        theme.edge,
      );
      this.poly(
        [
          [far.x - farW * 1.08, far.y],
          [far.x + farW * 1.08, far.y],
          [near.x + nearW * 1.08, near.y],
          [near.x - nearW * 1.08, near.y],
        ],
        stripe ? theme.stripe : "#f3eee0",
      );
      this.poly(
        [
          [far.x - farW, far.y - 1],
          [far.x + farW, far.y - 1],
          [near.x + nearW, near.y + 1],
          [near.x - nearW, near.y + 1],
        ],
        road,
      );
      if (stripe) {
        for (var lane = -1; lane <= 1; lane += 2) {
          var fl = far.x + (farW * lane) / 3,
            nl = near.x + (nearW * lane) / 3;
          this.poly(
            [
              [fl - far.scale * 2, far.y],
              [fl + far.scale * 2, far.y],
              [nl + near.scale * 2, near.y],
              [nl - near.scale * 2, near.y],
            ],
            "#b8c9c5",
          );
        }
      }
      if (mod(far.s, track.length) < 36) {
        for (var tile = 0; tile < 10; tile++) {
          var l = tile / 5 - 1,
            r = (tile + 1) / 5 - 1;
          this.poly(
            [
              [far.x + farW * l, far.y],
              [far.x + farW * r, far.y],
              [near.x + nearW * r, near.y],
              [near.x + nearW * l, near.y],
            ],
            tile % 2 ? "#edf7ed" : "#263b4b",
          );
        }
      }
    }
    var objects = [];
    function project(distance) {
      var idx = clamp(Math.floor((distance - 80) / 35), 0, points.length - 2),
        a = points[idx],
        b = points[idx + 1],
        t = clamp((distance - a.z) / 35, 0, 1);
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        scale: a.scale + (b.scale - a.scale) * t,
        z: distance,
      };
    }
    var first = Math.floor((s + 90) / 160);
    for (var sc = first; sc < first + 10; sc++) {
      var dist = sc * 160 - s;
      if (dist > 100 && dist < 1500) {
        objects.push({
          type: "scene",
          at: project(dist),
          side: sc % 2 ? 1 : -1,
          index: sc,
        });
        if (track.theme === "forest")
          objects.push({
            type: "scene",
            at: project(dist + 40),
            side: sc % 2 ? -1 : 1,
            index: sc + 1,
          });
      }
    }
    if (!preview) {
      game.racers.forEach(function (r) {
        var d = mod(r.s - s, track.length);
        if (r !== p && d > 85 && d < 1450 && !r.finished)
          objects.push({ type: "kart", at: project(d), p: r });
      });
      (game.boxes || []).forEach(function (b) {
        var d = mod(b.s - s, track.length);
        if (
          d > 85 &&
          d < 1450 &&
          b.ready <= game.clock &&
          game.selectedMode !== "time"
        )
          objects.push({ type: "box", at: project(d), box: b });
      });
      game.items.forEach(function (it) {
        var d = mod(it.s - s, track.length);
        if (d > 85 && d < 1450)
          objects.push({ type: "item", at: project(d), item: it });
      });
    }
    objects.sort(function (a, b) {
      return b.at.z - a.at.z;
    });
    for (var o = 0; o < objects.length; o++) {
      var ob = objects[o],
        pr = ob.at;
      if (ob.type === "scene")
        this.scenery(
          track.theme,
          pr.x + ob.side * 365 * pr.scale,
          pr.y,
          pr.scale * 1.1,
          ob.index,
        );
      else if (ob.type === "kart") {
        var r = ob.p;
        this.kart(
          pr.x + r.x * 250 * pr.scale,
          pr.y,
          pr.scale * 0.62,
          r.id,
          0,
          r.drift,
          r.shield > 0,
          r.boost > 0,
          time,
        );
      } else if (ob.type === "box") {
        var bx = pr.x + ob.box.x * 250 * pr.scale,
          bs = 24 * pr.scale;
        this.ellipse(bx, pr.y, bs, bs * 0.22, "rgba(12,30,50,.2)");
        c.save();
        c.translate(bx, pr.y - bs * 1.1);
        c.rotate(Math.sin(time * 3 + ob.box.x) * 0.13);
        this.round(-bs, -bs, bs * 2, bs * 2, bs * 0.22, "#73e5d3");
        this.round(
          -bs * 0.72,
          -bs * 0.72,
          bs * 1.44,
          bs * 1.44,
          bs * 0.15,
          "#467fa5",
        );
        this.itemIcon(null, 0, 0, bs / 20);
        c.restore();
      } else
        this.itemIcon(
          ob.item.type,
          pr.x + ob.item.x * 250 * pr.scale,
          pr.y - 10 * pr.scale,
          pr.scale,
        );
    }
    var playerY = h * 0.84 + Math.sin(time * 11) * Math.min(2, p.speed / 100),
      sz = Math.min(w / 420, h / 350);
    if (preview) sz *= 1.35;
    if (p.boost > 0) {
      c.strokeStyle = "rgba(205,255,244,.5)";
      c.lineWidth = 2;
      for (var k = 0; k < 10; k++) {
        var ang = (k / 10) * Math.PI * 2;
        c.beginPath();
        c.moveTo(
          w / 2 + Math.cos(ang) * w * 0.37,
          h * 0.64 + Math.sin(ang) * h * 0.3,
        );
        c.lineTo(
          w / 2 + Math.cos(ang) * w * 0.58,
          h * 0.64 + Math.sin(ang) * h * 0.48,
        );
        c.stroke();
      }
    }
    this.kart(
      w / 2 + Math.sin(time * 4) * (p.stun > 0 ? 12 : 0),
      playerY,
      sz,
      p.id,
      p.drifting ? Math.sin(time * 4) * 2 : 0,
      p.drift,
      p.shield > 0,
      p.boost > 0,
      time,
    );
    if (p.recover > 0) {
      this.round(w * 0.2, h * 0.39, w * 0.6, 48, 12, "rgba(14,34,52,.85)");
      this.text(
        this.tr("正在返回赛道", "RETURNING TO TRACK"),
        w * 0.5,
        h * 0.39 + 24,
        18,
        "#ffe1a1",
        "700",
        "center",
      );
    }
    if (!preview) this.hud(game, p, w, h);
    c.restore();
  };
  CoastKartRenderer.prototype.hud = function (game, p, w, h) {
    var c = this.ctx,
      small = w < 600,
      fs = small ? 17 : 20;
    this.round(18, 18, small ? 104 : 125, 74, 13, "rgba(16,37,56,.85)");
    this.text(String(p.rank), 33, 52, 38, "#fff", "800");
    this.text("/ " + game.racers.length, small ? 67 : 78, 59, fs, "#b4d6da");
    this.text(this.tr("名次", "POSITION"), 33, 81, 10, "#b1d6d9", "700");
    this.round(w - 131, 18, 113, 74, 13, "rgba(16,37,56,.85)");
    this.text(this.tr("圈数", "LAP"), w - 115, 38, 11, "#b7dbdc");
    this.text(Math.min(3, p.lap) + " / 3", w - 115, 65, 26, "#fff", "700");
    this.text(this.time(game.clock), w / 2, 33, 17, "#fff", "700", "center");
    this.text(p.id + "P", w / 2, 57, 12, COLORS[p.id - 1], "800", "center");
    this.round(18, h - 75, 124, 54, 12, "rgba(16,37,56,.85)");
    this.text(
      String(Math.round(Math.max(0, p.speed) * 0.72)),
      33,
      h - 49,
      28,
      "#fff",
      "800",
    );
    this.text("km/h", 98, h - 44, 11, "#b6d6d9");
    this.round(w - 88, h - 91, 70, 70, 15, "rgba(16,37,56,.9)");
    this.itemIcon(p.item, w - 53, h - 59, 1.18);
    this.text(
      p.item ? "A" : this.tr("道具", "ITEM"),
      w - 53,
      h - 29,
      10,
      "#c4dfdc",
      "700",
      "center",
    );
    var barW = Math.max(80, w - 280);
    this.round(154, h - 38, barW, 7, 3, "rgba(21,42,55,.4)");
    this.round(
      154,
      h - 38,
      barW * clamp(mod(p.s, game.track.length) / game.track.length, 0, 1),
      7,
      3,
      COLORS[p.id - 1],
    );
    if (p.drift > 0) {
      this.round(w / 2 - 70, h - 119, 140, 10, 5, "#344c60");
      this.round(
        w / 2 - 70,
        h - 119,
        (140 * p.drift) / 2.5,
        10,
        5,
        p.drift > 1.6 ? "#ffcd72" : "#8ae9ff",
      );
      this.text(
        this.tr("松开 B 冲刺", "RELEASE B TO BOOST"),
        w / 2,
        h - 130,
        11,
        "#fff",
        "700",
        "center",
      );
    }
    var bend = CoastKartGame.curve(game.track, p.s + 250);
    if (Math.abs(bend) > 0.5)
      this.text(
        bend > 0 ? "››" : "‹‹",
        w / 2,
        h * 0.29,
        42,
        "#fff3bc",
        "800",
        "center",
      );
    if (p.finished) {
      this.round(w * 0.12, h * 0.4, w * 0.76, 70, 14, "rgba(15,38,52,.9)");
      this.text(
        this.tr("已冲线！", "FINISHED!"),
        w / 2,
        h * 0.4 + 25,
        27,
        "#d9ffdd",
        "800",
        "center",
      );
      this.text(
        this.tr("等待另一位车手…", "Waiting for the other racer…"),
        w / 2,
        h * 0.4 + 51,
        13,
        "#c5d9de",
        "500",
        "center",
      );
    }
  };
  CoastKartRenderer.prototype.time = function (n) {
    return (
      Math.floor(n / 60) +
      ":" +
      ("0" + Math.floor(n % 60)).slice(-2) +
      "." +
      Math.floor((n % 1) * 10)
    );
  };
  CoastKartRenderer.prototype.title = function (game) {
    var c = this.ctx,
      w = 960,
      h = 540,
      preview = {
        id: 1,
        x: -0.15,
        s: 320,
        speed: 130,
        drift: 0,
        stun: 0,
        shield: 0,
        boost: 0,
      };
    this.world(game, preview, 0, 0, w, h, true);
    var fade = c.createLinearGradient(0, 0, 760, 0);
    fade.addColorStop(0, "rgba(13,36,56,.96)");
    fade.addColorStop(0.72, "rgba(13,36,56,.78)");
    fade.addColorStop(1, "rgba(13,36,56,0)");
    c.fillStyle = fade;
    c.fillRect(0, 0, w, h);
    this.text("COAST KART", 42, 61, 40, "#fff5df", "900");
    this.text(
      this.tr("海 岸 卡 丁 车   ·   TV", "TV EDITION  ·  ORIGINAL CIRCUITS"),
      45,
      101,
      15,
      "#85e6d5",
      "700",
    );
    this.text(
      this.tr(
        "一起出发，把海风甩在身后。",
        "Find your line. Chase the horizon.",
      ),
      45,
      139,
      17,
      "#d4e8e6",
      "500",
    );
    var names = [
      this.tr("快速比赛", "QUICK RACE"),
      this.tr("四站锦标赛", "GRAND TOUR"),
      this.tr("计时挑战", "TIME TRIAL"),
    ];
    this.round(42, 173, 402, 58, 12, "rgba(255,255,255,.11)");
    this.text("↕", 59, 202, 21, "#83e6d5");
    this.text(names[game.modeIndex], 94, 202, 23, "#fff", "800");
    this.text(
      game.modeIndex === 2 ? "1P" : game.selectedPlayers + "P",
      420,
      203,
      20,
      "#ffda98",
      "700",
      "right",
    );
    var detail =
      game.modeIndex === 0
        ? this.tr(
            "3 圈 · 6 位 AI 对手 · 道具与漂移",
            "3 laps · 6 AI rivals · items & drift",
          )
        : game.modeIndex === 1
          ? this.tr(
              "连续四条赛道，以积分争夺冠军",
              "Four circuits. Race for championship points.",
            )
          : this.tr(
              "单人竞速 · 无道具 · 保存最佳成绩",
              "Solo racing · no items · saved personal best",
            );
    this.text(detail, 45, 253, 14, "#c5deda", "500");
    var best =
      game.records[
        game.track.id + "-" + (game.modeIndex === 2 ? "time" : "race")
      ];
    this.text(
      best
        ? this.tr("最佳：", "BEST: ") + this.time(best)
        : this.tr(
            "首次出发，创造你的纪录",
            "A fresh road. Set your first record.",
          ),
      45,
      282,
      14,
      "#ffe0a8",
      "500",
    );
    this.round(42, 309, 270, 45, 12, "#7be2d0");
    this.text(
      this.tr("START  开始比赛", "START  ·  LET’S RACE"),
      177,
      332,
      19,
      "#163f4c",
      "800",
      "center",
    );
    this.text(
      this.tr("SELECT  单人 / 双人同屏", "SELECT  ·  1P / 2P SPLIT SCREEN"),
      45,
      375,
      13,
      "#d4e7e3",
      "600",
    );
    var labels = CoastKartGame.TRACKS;
    for (var i = 0; i < 4; i++) {
      var x = 22 + i * 235;
      this.round(
        x,
        414,
        221,
        104,
        13,
        i === game.trackIndex ? "#fff4d9" : "rgba(18,42,59,.9)",
      );
      this.round(x + 10, 424, 55, 54, 9, THEMES[labels[i].theme].mountain);
      this.text(
        ["☀", "♠", "▲", "☾"][i],
        x + 37,
        452,
        29,
        THEMES[labels[i].theme].accent,
        "700",
        "center",
      );
      this.text(
        "0" + (i + 1),
        x + 77,
        439,
        12,
        i === game.trackIndex ? "#5b756f" : "#a3c3c8",
      );
      this.text(
        labels[i].name[this.language.indexOf("en") === 0 ? 1 : 0],
        x + 77,
        463,
        this.language.indexOf("en") === 0 ? 12 : 18,
        i === game.trackIndex ? "#234853" : "#fff",
        "800",
      );
      this.text(
        i === game.trackIndex
          ? this.tr("◀  已选择  ▶", "◀  SELECTED  ▶")
          : this.tr("独创赛道", "ORIGINAL CIRCUIT"),
        x + 110,
        499,
        11,
        i === game.trackIndex ? "#3a666b" : "#9abdc1",
        "700",
        "center",
      );
    }
  };
  CoastKartRenderer.prototype.results = function (game, ending) {
    var c = this.ctx;
    c.fillStyle = "rgba(12,29,46,.91)";
    c.fillRect(0, 0, 960, 540);
    var cup = game.selectedMode === "cup";
    this.text(
      ending
        ? this.tr("锦标赛 · 总成绩", "GRAND TOUR · FINAL STANDINGS")
        : this.tr("冲线时刻", "ACROSS THE LINE"),
      480,
      48,
      31,
      "#fff3d8",
      "800",
      "center",
    );
    this.text(
      ending
        ? this.tr("四条赛道，一段精彩旅程", "FOUR CIRCUITS. ONE GREAT JOURNEY.")
        : game.track.name[this.language.indexOf("en") === 0 ? 1 : 0] +
            (cup ? "  ·  " + (game.cupRound + 1) + "/4" : ""),
      480,
      86,
      15,
      "#7ee0cf",
      "600",
      "center",
    );
    var order = game.racers.slice(),
      self = this;
    if (ending)
      order.sort(function (a, b) {
        return (game.cupPoints[b.id] || 0) - (game.cupPoints[a.id] || 0);
      });
    else
      order.sort(function (a, b) {
        return a.rank - b.rank;
      });
    order.forEach(function (p, i) {
      var cols = order.length > 4 ? 2 : 1,
        col = cols === 2 ? Math.floor(i / 4) : 0,
        row = cols === 2 ? i % 4 : i,
        x = cols === 2 ? 62 + col * 434 : 205,
        y = 124 + row * 69,
        width = cols === 2 ? 400 : 550;
      self.round(
        x,
        y,
        width,
        58,
        10,
        p.human ? "rgba(111,226,207,.17)" : "rgba(255,255,255,.05)",
      );
      self.text(
        String(i + 1).padStart(2, "0"),
        x + 17,
        y + 28,
        23,
        p.human ? "#8cebd4" : "#9bb6c0",
        "800",
      );
      self.ellipse(x + 73, y + 28, 15, 15, COLORS[p.id - 1]);
      self.text(
        p.human ? p.id + "P" : self.tr("车手 ", "RIVAL ") + (p.id - 2),
        x + 100,
        y + 21,
        16,
        "#f4f6ed",
        "700",
      );
      self.text(
        p.finished ? self.time(p.finishTime) : self.tr("仍在赛道", "ON TRACK"),
        x + 100,
        y + 41,
        11,
        "#aec9cc",
      );
      self.text(
        ending
          ? (game.cupPoints[p.id] || 0) + " PT"
          : cup
            ? "+" + p.score + " PT"
            : "#" + p.rank,
        x + width - 18,
        y + 29,
        20,
        p.human ? "#ffe0a0" : "#d6e5e4",
        "700",
        "right",
      );
    });
    if (game.bestUpdated && !ending)
      this.text(
        this.tr("★  新的个人最佳纪录", "★  NEW PERSONAL BEST"),
        480,
        427,
        16,
        "#ffdc91",
        "700",
        "center",
      );
    this.round(263, 459, 434, 44, 11, "#7ae2d0");
    this.text(
      ending
        ? this.tr("START  返回标题", "START  ·  BACK TO TITLE")
        : cup
          ? this.tr(
              game.cupRound < 3 ? "START  前往下一站" : "START  查看总成绩",
              game.cupRound < 3
                ? "START  ·  NEXT CIRCUIT"
                : "START  ·  FINAL STANDINGS",
            )
          : this.tr("START  再来一场", "START  ·  RACE AGAIN"),
      480,
      482,
      18,
      "#173e4d",
      "800",
      "center",
    );
    this.text(
      this.tr("SELECT  返回标题", "SELECT  ·  RETURN TO TITLE"),
      480,
      522,
      12,
      "#c2d9d9",
      "600",
      "center",
    );
  };
  CoastKartRenderer.prototype.draw = function (game) {
    this.frames++;
    this.language = game.language;
    var c = this.ctx;
    c.clearRect(0, 0, 960, 540);
    if (game.phase === "title") {
      this.title(game);
      return;
    }
    if (game.selectedPlayers === 2) {
      this.world(game, game.players[0], 0, 0, 478, 540, false);
      this.world(game, game.players[1], 482, 0, 478, 540, false);
      c.fillStyle = "#122c42";
      c.fillRect(478, 0, 4, 540);
    } else this.world(game, game.players[0], 0, 0, 960, 540, false);
    if (game.countdown > 0 && game.phase === "playing") {
      this.round(402, 191, 156, 144, 25, "rgba(17,39,55,.85)");
      this.text(
        String(Math.ceil(game.countdown)),
        480,
        251,
        73,
        "#ffdf9b",
        "900",
        "center",
      );
      this.text(
        this.tr("准备出发", "GET READY"),
        480,
        307,
        15,
        "#d4f3e6",
        "700",
        "center",
      );
    } else if (game.clock < 0.8 && game.phase === "playing")
      this.text("GO!", 480, 239, 85, "#dcffb0", "900", "center");
    if (game.phase === "paused") {
      c.fillStyle = "rgba(14,32,48,.65)";
      c.fillRect(0, 0, 960, 540);
      this.round(195, 157, 570, 229, 20, "#163449");
      this.text(
        this.tr("稍作休息", "TAKE A BREATHER"),
        480,
        204,
        32,
        "#fff1d5",
        "800",
        "center",
      );
      this.text(
        game.pauseReason === "controller"
          ? this.tr(
              "等待已加入的手机手柄重新连接",
              "Waiting for joined controllers to reconnect",
            )
          : this.tr("START  继续比赛", "START  ·  RESUME RACE"),
        480,
        256,
        18,
        "#b7e8de",
        "600",
        "center",
      );
      this.text(
        this.tr("SELECT  切换音乐", "SELECT  ·  TOGGLE MUSIC"),
        480,
        301,
        14,
        "#c2d6d9",
        "500",
        "center",
      );
      this.text(
        this.tr("音乐：", "MUSIC: ") +
          (game.muted ? this.tr("关", "OFF") : this.tr("开", "ON")),
        480,
        346,
        14,
        "#ffe0aa",
        "700",
        "center",
      );
    }
    if (game.phase === "results" || game.phase === "ending")
      this.results(game, game.phase === "ending");
  };
  root.CoastKartRenderer = CoastKartRenderer;
})(window);
