/* Smooth original geometric island illustrations, rendered at device resolution. */
(function (root) {
  "use strict";
  var W = root.CozyIslandWorld;
  class CozyIslandRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      if (!this.ctx) throw new Error("Canvas 2D unavailable");
      this.width = 960;
      this.height = 540;
      this.time = 0;
      this.view = { x: 472, y: 245, s: 18 };
    }
    point(x, y, z) {
      var v = this.view;
      return {
        x: v.x + (x - y) * v.s,
        y: v.y + (x + y - 22) * v.s * 0.49 - (z || 0) * v.s,
      };
    }
    ellipse(x, y, rx, ry, color) {
      var c = this.ctx;
      c.fillStyle = color;
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
    }
    round(x, y, w, h, r, color) {
      var c = this.ctx;
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
      c.fillStyle = color;
      c.fill();
    }
    poly(points, color) {
      var c = this.ctx;
      c.beginPath();
      points.forEach(function (p, i) {
        if (i) c.lineTo(p.x, p.y);
        else c.moveTo(p.x, p.y);
      });
      c.closePath();
      c.fillStyle = color;
      c.fill();
    }
    line(points, color, width) {
      var c = this.ctx;
      c.beginPath();
      points.forEach(function (p, i) {
        if (i) c.lineTo(p.x, p.y);
        else c.moveTo(p.x, p.y);
      });
      c.strokeStyle = color;
      c.lineWidth = width;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.stroke();
    }
    text(text, x, y, size, color, align) {
      var c = this.ctx;
      c.font =
        (size >= 20 ? "600 " : "500 ") +
        size +
        'px "Noto Sans", "Microsoft Yahei", sans-serif';
      c.fillStyle = color || "#344e55";
      c.textAlign = align || "left";
      c.textBaseline = "middle";
      c.fillText(text, x, y);
    }
    wrap(text, x, y, width, size, color, max) {
      var c = this.ctx;
      c.font = "500 " + size + 'px "Noto Sans", "Microsoft Yahei", sans-serif';
      var lines = [],
        line = "";
      Array.from(String(text)).forEach(function (ch) {
        if (c.measureText(line + ch).width > width && line) {
          lines.push(line);
          line = ch;
        } else line += ch;
      });
      if (line) lines.push(line);
      lines
        .slice(0, max || 4)
        .forEach((t, i) => this.text(t, x, y + i * (size + 5), size, color));
      return lines.length;
    }
    tile(x, y, w, h, color, z) {
      this.poly(
        [
          this.point(x, y, z),
          this.point(x + w, y, z),
          this.point(x + w, y + h, z),
          this.point(x, y + h, z),
        ],
        color,
      );
    }
    shadow(x, y, rx) {
      var p = this.point(x, y);
      this.ellipse(
        p.x,
        p.y + 3,
        (rx || 0.8) * this.view.s,
        0.25 * this.view.s,
        "rgba(35,70,69,.16)",
      );
    }
    tree(n, ready) {
      var p = this.point(n.x, n.y),
        s = this.view.s;
      this.shadow(n.x, n.y, 1);
      this.round(
        p.x - s * 0.18,
        p.y - s * 1.6,
        s * 0.36,
        s * 1.65,
        s * 0.1,
        "#a78360",
      );
      this.ellipse(
        p.x - s * 0.48,
        p.y - s * 1.8,
        s * 0.85,
        s * 0.87,
        "#569c79",
      );
      this.ellipse(p.x + s * 0.48, p.y - s * 1.9, s * 0.9, s * 0.9, "#6aad7b");
      this.ellipse(p.x, p.y - s * 2.45, s * 0.92, s * 0.93, "#82bf85");
      this.ellipse(
        p.x - s * 0.28,
        p.y - s * 2.7,
        s * 0.45,
        s * 0.42,
        "rgba(211,234,154,.35)",
      );
      if (ready) {
        [
          [-0.5, -2.05],
          [0.53, -2.2],
          [0.04, -2.8],
        ].forEach((a) => {
          this.ellipse(
            p.x + s * a[0],
            p.y + s * a[1],
            s * 0.23,
            s * 0.25,
            "#f7b09c",
          );
          this.ellipse(
            p.x + s * a[0] - 0.05 * s,
            p.y + s * a[1] - 0.05 * s,
            s * 0.08,
            s * 0.1,
            "#ffd0b5",
          );
        });
      }
    }
    rock(n, ready) {
      var p = this.point(n.x, n.y),
        s = this.view.s;
      this.shadow(n.x, n.y, 0.65);
      this.poly(
        [
          { x: p.x - s * 0.6, y: p.y },
          { x: p.x - s * 0.52, y: p.y - s * 0.55 },
          { x: p.x - s * 0.1, y: p.y - s * 0.85 },
          { x: p.x + s * 0.48, y: p.y - s * 0.6 },
          { x: p.x + s * 0.7, y: p.y },
          { x: p.x + s * 0.15, y: p.y + s * 0.2 },
        ],
        ready ? "#a9b9b7" : "#94a9a4",
      );
      this.poly(
        [
          { x: p.x - s * 0.52, y: p.y - s * 0.55 },
          { x: p.x - s * 0.1, y: p.y - s * 0.85 },
          { x: p.x + s * 0.48, y: p.y - s * 0.6 },
          { x: p.x, y: p.y - s * 0.32 },
        ],
        ready ? "#cbd5ce" : "#a8bbb0",
      );
    }
    stump(n, ready) {
      var p = this.point(n.x, n.y),
        s = this.view.s;
      this.shadow(n.x, n.y, 0.65);
      this.round(
        p.x - 0.55 * s,
        p.y - 0.5 * s,
        1.1 * s,
        0.6 * s,
        0.1 * s,
        "#a67e5d",
      );
      this.ellipse(p.x, p.y - 0.5 * s, 0.55 * s, 0.25 * s, "#dec195");
      this.ellipse(p.x, p.y - 0.5 * s, 0.3 * s, 0.13 * s, "#b99d73");
      this.ellipse(p.x, p.y - 0.5 * s, 0.21 * s, 0.08 * s, "#dec195");
      if (ready)
        this.line(
          [
            { x: p.x - 0.7 * s, y: p.y - 0.1 * s },
            { x: p.x + 0.35 * s, y: p.y - 0.5 * s },
          ],
          "#c49a71",
          s * 0.25,
        );
    }
    shell(n, ready) {
      if (!ready) return;
      var p = this.point(n.x, n.y),
        s = this.view.s;
      this.shadow(n.x, n.y, 0.4);
      this.ellipse(p.x, p.y - 2, s * 0.34, s * 0.23, "#fff0dc");
      for (var i = -1; i <= 1; i++)
        this.line(
          [
            { x: p.x, y: p.y + 2 },
            { x: p.x + i * s * 0.2, y: p.y - s * 0.18 },
          ],
          "#e5b9a8",
          1.3,
        );
    }
    house(l, level, shop) {
      var p = this.point(l.x, l.y),
        s = this.view.s;
      this.shadow(l.x, l.y, 1.8);
      this.tile(l.x - 1.3, l.y - 0.9, 2.6, 1.8, "#c9d0b3", 0);
      this.poly(
        [
          this.point(l.x - 1.2, l.y + 0.8),
          this.point(l.x + 1.2, l.y + 0.8),
          this.point(l.x + 1.2, l.y + 0.8, 2),
          this.point(l.x - 1.2, l.y + 0.8, 2),
        ],
        shop ? "#faf0cf" : "#f8ebd1",
      );
      this.poly(
        [
          this.point(l.x + 1.2, l.y + 0.8),
          this.point(l.x + 1.2, l.y - 0.8),
          this.point(l.x + 1.2, l.y - 0.8, 2),
          this.point(l.x + 1.2, l.y + 0.8, 2),
        ],
        shop ? "#e3d9b8" : "#d5ded1",
      );
      this.poly(
        [
          this.point(l.x - 1.45, l.y + 1, 1.8),
          this.point(l.x + 1.45, l.y + 1, 1.8),
          this.point(l.x + 1.45, l.y - 1, 3.2),
          this.point(l.x - 1.45, l.y - 1, 3.2),
        ],
        shop ? "#e7a18e" : level === 2 ? "#a394cc" : "#83b2ad",
      );
      this.poly(
        [
          this.point(l.x + 1.45, l.y + 1, 1.8),
          this.point(l.x + 1.45, l.y - 1, 3.2),
          this.point(l.x + 1.45, l.y - 1, 1.8),
        ],
        shop ? "#cc8276" : "#68969a",
      );
      var door = this.point(l.x, l.y + 0.85);
      this.round(
        door.x - s * 0.25,
        door.y - s,
        s * 0.5,
        s,
        s * 0.08,
        "#997b62",
      );
      var win = this.point(l.x - 0.72, l.y + 0.85, 0.8);
      this.round(
        win.x - s * 0.23,
        win.y - s * 0.25,
        s * 0.46,
        s * 0.5,
        2,
        "#b7dddb",
      );
      this.line(
        [
          { x: win.x, y: win.y - s * 0.22 },
          { x: win.x, y: win.y + s * 0.22 },
        ],
        "#fbf0dc",
        2,
      );
      if (shop) {
        var sign = this.point(l.x, l.y + 0.9, 1.8);
        this.round(sign.x - 28, sign.y - 8, 56, 16, 5, "#fff6df");
        this.text(
          this.marketLabel || "MARKET",
          sign.x,
          sign.y,
          8,
          "#986856",
          "center",
        );
      } else if (level) {
        var flag = this.point(l.x - 1, l.y - 1, 3.3);
        this.line(
          [
            { x: flag.x, y: flag.y },
            { x: flag.x, y: flag.y - 20 },
          ],
          "#b68e6d",
          2,
        );
        this.poly(
          [
            { x: flag.x, y: flag.y - 20 },
            { x: flag.x + 14, y: flag.y - 15 },
            { x: flag.x, y: flag.y - 10 },
          ],
          "#f4cb73",
        );
      }
    }
    resident(l) {
      var p = this.point(l.x, l.y),
        s = this.view.s;
      this.shadow(l.x, l.y, 0.45);
      var mira = l.id === "mira";
      this.ellipse(
        p.x,
        p.y - 0.35 * s,
        0.34 * s,
        0.45 * s,
        mira ? "#f0a7a5" : "#d5b36e",
      );
      this.ellipse(
        p.x,
        p.y - 0.9 * s,
        0.42 * s,
        0.4 * s,
        mira ? "#e5c0a4" : "#c6b2a4",
      );
      if (mira) {
        this.ellipse(
          p.x - 0.29 * s,
          p.y - 1.2 * s,
          0.12 * s,
          0.3 * s,
          "#e5c0a4",
        );
        this.ellipse(
          p.x + 0.29 * s,
          p.y - 1.2 * s,
          0.12 * s,
          0.3 * s,
          "#e5c0a4",
        );
      } else {
        this.ellipse(
          p.x - 0.36 * s,
          p.y - 1.1 * s,
          0.2 * s,
          0.2 * s,
          "#b59c8c",
        );
        this.ellipse(
          p.x + 0.36 * s,
          p.y - 1.1 * s,
          0.2 * s,
          0.2 * s,
          "#b59c8c",
        );
      }
      this.ellipse(p.x - 0.13 * s, p.y - 0.92 * s, 1.7, 2.1, "#514f4a");
      this.ellipse(p.x + 0.13 * s, p.y - 0.92 * s, 1.7, 2.1, "#514f4a");
      this.ellipse(p.x, p.y - 0.76 * s, 2, 1.3, "#9f6e6b");
    }
    furniture(d, ghost) {
      var p = this.point(d.x, d.y),
        s = this.view.s,
        c = this.ctx;
      c.save();
      if (ghost) c.globalAlpha = 0.65;
      this.shadow(d.x, d.y, 0.6);
      if (d.item === "bench") {
        var flip = d.rotation % 2,
          w = flip ? 0.6 : 1.3,
          h = flip ? 1.3 : 0.6;
        this.tile(d.x - w / 2, d.y - h / 2, w, h, "#b98c67", 0.45);
        this.line(
          [
            this.point(d.x - w / 2, d.y - h / 2, 0.45),
            this.point(d.x - w / 2, d.y - h / 2, 1),
          ],
          "#b98c67",
          4,
        );
        this.line(
          [
            this.point(d.x + w / 2, d.y - h / 2, 0.45),
            this.point(d.x + w / 2, d.y - h / 2, 1),
          ],
          "#b98c67",
          4,
        );
        this.line(
          [
            this.point(d.x - w / 2, d.y - h / 2, 0.9),
            this.point(d.x + w / 2, d.y - h / 2, 0.9),
          ],
          "#dfb680",
          5,
        );
      } else if (d.item === "lamp") {
        this.line(
          [
            { x: p.x, y: p.y },
            { x: p.x, y: p.y - s * 1.5 },
          ],
          "#918c7b",
          3,
        );
        this.ellipse(p.x, p.y - s * 1.5, s * 0.28, s * 0.35, "#fff0ac");
        this.ellipse(
          p.x,
          p.y - s * 1.5,
          s * 0.65,
          s * 0.7,
          "rgba(255,223,128,.14)",
        );
      } else if (d.item === "planter") {
        this.round(
          p.x - s * 0.3,
          p.y - s * 0.4,
          s * 0.6,
          s * 0.5,
          3,
          "#dba18c",
        );
        this.ellipse(p.x, p.y - s * 0.7, s * 0.45, s * 0.4, "#80b28a");
        this.ellipse(
          p.x - s * 0.2,
          p.y - s * 0.85,
          s * 0.17,
          s * 0.17,
          "#efb2c3",
        );
        this.ellipse(
          p.x + s * 0.25,
          p.y - s * 0.65,
          s * 0.17,
          s * 0.17,
          "#ffdb86",
        );
      } else if (d.item === "rug") {
        this.tile(d.x - 0.65, d.y - 0.5, 1.3, 1, "#91c9bc", 0.01);
        this.tile(d.x - 0.5, d.y - 0.35, 1, 0.7, "#e8e0ba", 0.02);
      } else {
        this.round(
          p.x - s * 0.35,
          p.y - s * 0.2,
          s * 0.7,
          s * 0.3,
          3,
          "#b8a18a",
        );
        this.ellipse(p.x, p.y - s * 0.6, s * 0.3, s * 0.5, "#f2d083");
        this.ellipse(p.x, p.y - s * 1.15, s * 0.32, s * 0.32, "#f5d88d");
      }
      c.restore();
    }
    avatar(p, time) {
      var q = this.point(p.x, p.y),
        s = this.view.s,
        bob = Math.sin(time * 4 + p.id) * 0.8;
      this.shadow(p.x, p.y, 0.45);
      this.line(
        [
          { x: q.x - 3, y: q.y - 4 },
          { x: q.x - 4, y: q.y + 1 },
        ],
        "#617878",
        4,
      );
      this.line(
        [
          { x: q.x + 3, y: q.y - 4 },
          { x: q.x + 4, y: q.y + 1 },
        ],
        "#617878",
        4,
      );
      this.round(
        q.x - s * 0.28,
        q.y - s * 0.68 + bob,
        s * 0.56,
        s * 0.65,
        s * 0.16,
        p.id === 1 ? "#e9a695" : "#84b6cf",
      );
      this.ellipse(q.x, q.y - s * 0.93 + bob, s * 0.31, s * 0.34, "#f0ceaf");
      this.ellipse(
        q.x,
        q.y - s * 1.15 + bob,
        s * 0.36,
        s * 0.2,
        p.id === 1 ? "#8f7160" : "#6f7e82",
      );
      this.ellipse(q.x - 2.8, q.y - s * 0.94 + bob, 1.3, 1.7, "#5b554d");
      this.ellipse(q.x + 2.8, q.y - s * 0.94 + bob, 1.3, 1.7, "#5b554d");
      if (p.tool === "rod")
        this.line(
          [
            { x: q.x + 6, y: q.y - 10 },
            { x: q.x + 20, y: q.y - 35 },
          ],
          "#a58564",
          2,
        );
      this.round(
        q.x - 11,
        q.y - s * 1.85,
        22,
        14,
        7,
        p.id === 1 ? "#dc8d7e" : "#669bb9",
      );
      this.text(p.id + "P", q.x, q.y - s * 1.85 + 7, 9, "#fff", "center");
    }
    flower(x, y, index) {
      var p = this.point(x, y),
        colors = ["#f4c4c5", "#fff1b1", "#d1c9e7"];
      this.line(
        [
          { x: p.x, y: p.y },
          { x: p.x, y: p.y - 6 },
        ],
        "#73a783",
        1,
      );
      this.ellipse(p.x, p.y - 6, 2.6, 2.6, colors[index % 3]);
      this.ellipse(p.x, p.y - 6, 1, 1, "#f3da8d");
    }
    island(game) {
      var c = this.ctx,
        time = game.clock,
        hour = (game.clock / 60) % 24,
        night = hour < 6 || hour > 20,
        twilight = hour >= 17 && hour <= 20;
      this.time = game.elapsed;
      var gradient = c.createLinearGradient(0, 0, 0, 540);
      gradient.addColorStop(
        0,
        night ? "#243b58" : twilight ? "#b3c7d4" : "#c4e8e4",
      );
      gradient.addColorStop(
        1,
        night ? "#31566d" : twilight ? "#82b9be" : "#82c8cd",
      );
      c.fillStyle = gradient;
      c.fillRect(0, 0, 960, 540);
      for (var j = 0; j < 20; j++) {
        var wy = 90 + j * 27,
          wx = (j * 113 + Math.sin(time * 0.2 + j) * 12) % 920;
        this.line(
          [
            { x: wx, y: wy },
            { x: wx + 16, y: wy - 2 },
            { x: wx + 32, y: wy },
          ],
          "rgba(255,255,255,.22)",
          2,
        );
      }
      this.view = { x: 470, y: 240, s: 19 };
      var shore = [],
        sand = [],
        grass = [];
      for (var k = 0; k < 80; k++) {
        var a = (k * Math.PI) / 40;
        shore.push(
          this.point(12 + Math.cos(a) * 10.55, 10.2 + Math.sin(a) * 8.75),
        );
        sand.push(
          this.point(12 + Math.cos(a) * 10.1, 10.2 + Math.sin(a) * 8.3),
        );
        grass.push(
          this.point(12 + Math.cos(a) * 9.25, 10.2 + Math.sin(a) * 7.5),
        );
      }
      this.poly(shore, night ? "#547a83" : "#c3e5d9");
      this.poly(sand, night ? "#a0a18b" : "#f4e4b7");
      this.poly(grass, night ? "#6c9e85" : "#a9cda0");
      var path = [
        this.point(8.5, 8.5),
        this.point(10.5, 11),
        this.point(14, 11),
        this.point(16, 8.4),
      ];
      this.line(path, night ? "#abb194" : "#e6d6af", 18);
      this.line(
        [this.point(13, 11), this.point(18, 11), this.point(20.5, 11.2)],
        night ? "#abb194" : "#e6d6af",
        13,
      );
      this.tile(19.5, 10.5, 2.5, 1.25, "#c49e79", 0.1);
      for (var b = 0; b < 7; b++)
        this.line(
          [
            this.point(19.5 + b * 0.4, 10.5, 0.1),
            this.point(19.5 + b * 0.4, 11.75, 0.1),
          ],
          "#a88264",
          1,
        );
      for (var f = 0; f < 40; f++) {
        var fx = 4 + ((f * 3.17) % 15.5),
          fy = 4 + ((f * 2.81) % 12);
        if (W.onLand(fx, fy) && Math.abs(fy - 11) > 1.2) this.flower(fx, fy, f);
      }
      var objects = [];
      W.nodes.forEach((n) =>
        objects.push({
          depth: n.x + n.y,
          draw: () => {
            var ready = !(game.harvested[n.id] > game.clock);
            if (n.item === "fruit") this.tree(n, ready);
            else if (n.item === "stone") this.rock(n, ready);
            else if (n.item === "wood") this.stump(n, ready);
            else this.shell(n, ready);
          },
        }),
      );
      W.landmarks.forEach((l) => {
        if (l.id === "dock") return;
        objects.push({
          depth: l.x + l.y,
          draw: () => {
            if (l.id === "house" || l.id === "shop")
              this.house(l, game.houseLevel, l.id === "shop");
            else if (l.id === "craft") {
              this.furniture({ x: l.x, y: l.y, item: "bench", rotation: 0 });
              var q = this.point(l.x, l.y, 0.7);
              this.round(q.x - 5, q.y - 7, 11, 7, 2, "#d9d6bb");
            } else this.resident(l);
          },
        });
      });
      game.decorations
        .filter(function (d) {
          return d.location === "island";
        })
        .forEach((d) =>
          objects.push({ depth: d.x + d.y, draw: () => this.furniture(d) }),
        );
      game.players
        .filter(function (p) {
          return p.joined && p.location === "island";
        })
        .forEach((p) =>
          objects.push({
            depth: p.x + p.y,
            draw: () => this.avatar(p, game.elapsed),
          }),
        );
      objects
        .sort(function (a, b) {
          return a.depth - b.depth;
        })
        .forEach(function (o) {
          o.draw();
        });
      game.players.forEach((p) => {
        if (
          p.joined &&
          p.location === "island" &&
          p.menu &&
          p.menu.kind === "place"
        ) {
          this.furniture(
            {
              x: p.menu.x,
              y: p.menu.y,
              item: p.menu.item,
              rotation: p.menu.rotation,
            },
            true,
          );
          var q = this.point(p.menu.x, p.menu.y);
          this.ellipse(
            q.x,
            q.y,
            16,
            6,
            game.canPlace(p, p.menu.item, p.menu.x, p.menu.y)
              ? "rgba(62,149,109,.4)"
              : "rgba(212,92,93,.5)",
          );
        }
      });
      game.particles.forEach((p) => {
        var q = this.point(p.x, p.y);
        for (var i = 0; i < 6; i++)
          this.ellipse(
            q.x + Math.cos(i) * 20 * (1 - p.life),
            q.y - 20 * (1 - p.life) + Math.sin(i) * 12,
            2.5 * p.life,
            2.5 * p.life,
            p.color,
          );
      });
      if (night || twilight) {
        c.fillStyle = night ? "rgba(39,53,90,.2)" : "rgba(238,176,157,.12)";
        c.fillRect(0, 0, 960, 540);
      }
      if (game.phase !== "title")
        game.players.forEach((p) => {
          if (p.joined && p.location === "home") this.interior(game, p);
        });
    }
    interior(game, p) {
      var x = p.id === 1 ? 20 : 660,
        y = 110,
        w = 280,
        h = 230;
      this.round(x, y, w, h, 18, "rgba(255,251,237,.96)");
      this.text(
        p.id + "P · " + game.tr("海风小屋", "Seabreeze home"),
        x + 18,
        y + 22,
        15,
        "#51706b",
      );
      var previous = this.view;
      this.view = { x: x + w / 2, y: y + 265, s: 18 };
      this.tile(0, 0, 8, 7, game.houseLevel === 2 ? "#bdb4cf" : "#dcc6a4");
      this.poly(
        [
          this.point(0, 0),
          this.point(8, 0),
          this.point(8, 0, 2.5),
          this.point(0, 0, 2.5),
        ],
        "#f3e6d3",
      );
      this.poly(
        [
          this.point(0, 0),
          this.point(0, 7),
          this.point(0, 7, 2.5),
          this.point(0, 0, 2.5),
        ],
        "#e1d7c9",
      );
      for (var i = 1; i < 8; i++)
        this.line(
          [this.point(i, 0), this.point(i, 7)],
          "rgba(149,115,86,.15)",
          1,
        );
      this.tile(3.2, 5.8, 1.6, 0.9, "#a5bfaf");
      var objects = game.decorations
        .filter(function (d) {
          return d.location === "home";
        })
        .map((d) => ({ depth: d.x + d.y, draw: () => this.furniture(d) }));
      game.players
        .filter(function (v) {
          return v.joined && v.location === "home";
        })
        .forEach((v) =>
          objects.push({
            depth: v.x + v.y,
            draw: () => this.avatar(v, game.elapsed),
          }),
        );
      objects
        .sort(function (a, b) {
          return a.depth - b.depth;
        })
        .forEach(function (o) {
          o.draw();
        });
      if (p.menu && p.menu.kind === "place") {
        this.furniture(
          {
            x: p.menu.x,
            y: p.menu.y,
            item: p.menu.item,
            rotation: p.menu.rotation,
          },
          true,
        );
        var q = this.point(p.menu.x, p.menu.y);
        this.ellipse(
          q.x,
          q.y,
          14,
          6,
          game.canPlace(p, p.menu.item, p.menu.x, p.menu.y)
            ? "rgba(62,149,109,.4)"
            : "rgba(212,92,93,.5)",
        );
      }
      this.view = previous;
      this.text(
        game.tr("门口按 A 出门", "A at the doormat to leave"),
        x + 18,
        y + h - 18,
        12,
        "#6b817b",
      );
    }
    panel(game, p) {
      if (!p.menu) return;
      var x = p.id === 1 ? 18 : 492,
        w = 450,
        y = 302,
        h = 216,
        c = this.ctx;
      this.round(x, y, w, h, 16, "rgba(255,251,239,.97)");
      this.round(
        x + 12,
        y + 10,
        32,
        22,
        10,
        p.id === 1 ? "#df9b89" : "#7cacc2",
      );
      this.text(p.id + "P", x + 28, y + 21, 12, "#fff", "center");
      if (p.menu.kind === "place") {
        this.text(
          game.tr("摆放：", "Place: ") + game.itemName(p.menu.item),
          x + 54,
          y + 21,
          16,
        );
        this.wrap(
          game.tr(
            "摇杆移动位置 · SELECT 旋转 · A 摆放 · B 返回",
            "Move the cursor · SELECT rotate · A place · B back",
          ),
          x + 18,
          y + 58,
          w - 36,
          15,
          "#56746b",
          3,
        );
        this.text(
          game.canPlace(p, p.menu.item, p.menu.x, p.menu.y)
            ? game.tr("位置可用", "Ready to place")
            : game.tr("此处无法摆放", "Choose an open spot"),
          x + 18,
          y + 122,
          17,
          game.canPlace(p, p.menu.item, p.menu.x, p.menu.y)
            ? "#609777"
            : "#b8716b",
        );
        return;
      }
      var titles = {
        bag: ["我的背包", "My bag"],
        inventory: ["背包物品", "Inventory"],
        shop: ["小岛商店", "Island market"],
        buy: ["购买家具", "Buy furniture"],
        sell: ["出售物品", "Sell goods"],
        craft: ["制作家具", "Craft furniture"],
        decorate: ["布置小岛", "Decorate"],
        tasks: ["居民任务与指南", "Requests + guide"],
        mira: ["米拉 · 花园朋友", "Mira · garden friend"],
        pip: ["皮普 · 海边朋友", "Pip · seaside friend"],
        upgrade: ["升级小屋", "Upgrade home"],
        reset: ["重置存档？", "Reset the island?"],
      };
      var title = titles[p.menu.kind] || titles.bag;
      this.text(game.tr(title[0], title[1]), x + 54, y + 21, 16);
      var rows = game.menuRows(p),
        start = Math.max(0, Math.min(p.menu.index - 1, rows.length - 4));
      rows.slice(start, start + 4).forEach((r, i) => {
        var yy = y + 52 + i * 32,
          selected = p.menu.index === start + i;
        if (selected) this.round(x + 10, yy - 12, w - 20, 29, 8, "#e4edd9");
        this.text(
          selected ? "›" : "·",
          x + 20,
          yy + 2,
          18,
          selected ? "#6e9977" : "#b9bda9",
        );
        this.wrap(
          r.label,
          x + 37,
          yy + 2,
          w - 57,
          r.label.length > 40 ? 11 : 13,
          "#526a60",
          2,
        );
      });
      this.text(
        game.tr("↑↓ 选择 · A 确认 · B 返回", "↑↓ choose · A confirm · B back") +
          "  " +
          (p.menu.index + 1) +
          "/" +
          rows.length,
        x + 18,
        y + h - 14,
        11,
        "#879486",
      );
    }
    draw(game) {
      this.marketLabel = game.tr("商店", "MARKET");
      var c = this.ctx;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      c.setTransform(this.width / 960, 0, 0, this.height / 540, 0, 0);
      this.island(game);
      this.round(18, 16, 280, 64, 20, "rgba(255,251,237,.9)");
      this.text(game.tr("悠岛生活", "Cozy Island"), 36, 39, 23, "#4f7469");
      var hour = Math.floor(game.clock / 60) % 24,
        minute = Math.floor(game.clock % 60);
      this.text(
        game.tr("第 ", "Day ") +
          (Math.floor(game.clock / 1440) + 1) +
          game.tr(" 天  ·  ", "  ·  ") +
          String(hour).padStart(2, "0") +
          ":" +
          String(minute).padStart(2, "0"),
        37,
        64,
        12,
        "#7b9181",
      );
      this.round(674, 16, 268, 64, 20, "rgba(255,251,237,.9)");
      this.text(
        "● " + game.coins + " " + game.tr("金币", "coins"),
        694,
        38,
        21,
        "#b28c50",
      );
      this.text(
        game.tr("小屋 ", "Home ") +
          (game.houseLevel + 1) +
          "/3  ·  " +
          game.completed.length +
          "/5 " +
          game.tr("心愿", "requests"),
        695,
        63,
        12,
        "#7b9181",
      );
      if (game.phase === "title") {
        this.round(194, 105, 572, 350, 28, "rgba(255,252,241,.94)");
        this.text(
          game.tr("把日子过成喜欢的样子", "Make a little room for joy"),
          480,
          150,
          29,
          "#587d70",
          "center",
        );
        this.text(
          game.tr(
            "采集 · 垂钓 · 布置 · 和朋友一起生活",
            "Gather · fish · decorate · share your island",
          ),
          480,
          190,
          17,
          "#8b9b81",
          "center",
        );
        this.round(302, 222, 356, 50, 18, "#e6edd8");
        this.text(
          game.selectedPlayers === 2
            ? game.tr(
                "双人同时游玩 · 共享小岛",
                "2 players together · one island",
              )
            : game.tr("单人悠闲生活", "A peaceful solo island"),
          480,
          248,
          21,
          "#628573",
          "center",
        );
        this.text(
          game.tr(
            "SELECT 切换人数 · START / A 开始",
            "SELECT players · START / A begin",
          ),
          480,
          296,
          18,
          "#66897c",
          "center",
        );
        this.text(
          game.tr(
            "摇杆移动 · A 互动 · B 背包",
            "Stick to walk · A interact · B bag",
          ),
          480,
          328,
          16,
          "#8a9b8b",
          "center",
        );
        this.text(
          game.tr(
            "先找米拉聊聊，开始你的第一个心愿。",
            "Say hello to Mira to begin your first request.",
          ),
          480,
          366,
          15,
          "#a18972",
          "center",
        );
        this.text(
          game.saveRecovered
            ? game.tr(
                "存档损坏，已恢复为新岛。",
                "Damaged save recovered. A fresh island awaits.",
              )
            : game.tr(
                "本机自动保存 · 独立原创小岛冒险",
                "Saved on this TV · an original island adventure",
              ),
          480,
          414,
          12,
          "#9b9d88",
          "center",
        );
        return;
      }
      game.players
        .filter(function (p) {
          return p.joined;
        })
        .forEach((p) => {
          if (!p.menu) {
            var x = p.id === 1 ? 18 : 492;
            this.round(x, 449, 450, 69, 16, "rgba(255,251,237,.91)");
            this.text(
              p.id +
                "P · " +
                (p.tool === "rod"
                  ? game.tr("钓竿", "Fishing rod")
                  : game.tr("空手", "Hands")) +
                "  ·  " +
                CozyIslandGame.inventoryCount(p.inventory) +
                "/24",
              x + 16,
              468,
              14,
              p.id === 1 ? "#b27e6d" : "#6f9cb4",
            );
            var message = p.messageTime > 0 ? p.message : "";
            if (!message) {
              var target = game.nearby(p);
              message = target
                ? "A · " +
                  (target.item
                    ? game.itemName(target.item)
                    : target[game.language])
                : game.tr(
                    "B 背包与指南 · SELECT 切换钓竿",
                    "B bag + guide · SELECT fishing rod",
                  );
            }
            this.wrap(message, x + 16, 491, 418, 13, "#657e70", 2);
            if (p.fishing) {
              var yy = 398;
              this.round(
                x + 60,
                yy,
                330,
                39,
                14,
                p.fishing.phase === "bite" ? "#efbd74" : "rgba(255,251,237,.9)",
              );
              this.text(
                p.fishing.phase === "bite"
                  ? game.tr("咬钩！现在按 A！", "BITE! Press A now!")
                  : game.tr("等待浮标下沉…", "Wait for the bobber…"),
                x + 225,
                yy + 20,
                17,
                "#756c50",
                "center",
              );
            }
          }
          this.panel(game, p);
          if (p.menu && p.messageTime > 0) {
            this.round(
              p.id === 1 ? 28 : 502,
              260,
              430,
              34,
              12,
              "rgba(255,242,211,.97)",
            );
            this.wrap(
              p.message,
              p.id === 1 ? 40 : 514,
              277,
              406,
              12,
              "#8e775d",
              1,
            );
          }
        });
      if (game.phase === "paused") {
        this.round(230, 164, 500, 188, 24, "rgba(255,251,237,.96)");
        this.text(
          game.pausedReason === "disconnect"
            ? game.tr("等待朋友重新连接", "Waiting for a friend")
            : game.tr("休息一下", "Take a little break"),
          480,
          210,
          28,
          "#638374",
          "center",
        );
        this.text(
          game.pausedReason === "disconnect"
            ? game.tr(
                "手柄重连后自动继续",
                "Reconnect the controller to continue",
              )
            : game.tr(
                "START 继续 · SELECT 音乐开关",
                "START resume · SELECT music",
              ),
          480,
          257,
          17,
          "#8b9984",
          "center",
        );
        this.text(
          game.tr("进度已保存", "Your progress is saved"),
          480,
          306,
          14,
          "#a39e88",
          "center",
        );
      }
      if (game.saveUnavailable)
        this.text(
          game.tr(
            "存储不可用：本次进度暂未保存",
            "Storage unavailable: progress is not saved",
          ),
          480,
          94,
          14,
          "#ac655c",
          "center",
        );
    }
    dispose() {}
  }
  root.CozyIslandRenderer = CozyIslandRenderer;
})(window);
