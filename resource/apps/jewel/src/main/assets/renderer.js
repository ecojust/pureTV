/* Original pixel artwork and bitmap lettering for the independent Jewel TV game. */
(function (root) {
  "use strict";
  const FONT = {
    A: [14,17,17,31,17,17,17], B: [30,17,17,30,17,17,30], C: [14,17,16,16,16,17,14],
    D: [30,17,17,17,17,17,30], E: [31,16,16,30,16,16,31], F: [31,16,16,30,16,16,16],
    G: [14,17,16,23,17,17,15], H: [17,17,17,31,17,17,17], I: [31,4,4,4,4,4,31],
    J: [7,2,2,2,2,18,12], K: [17,18,20,24,20,18,17], L: [16,16,16,16,16,16,31],
    M: [17,27,21,21,17,17,17], N: [17,25,21,19,17,17,17], O: [14,17,17,17,17,17,14],
    P: [30,17,17,30,16,16,16], Q: [14,17,17,17,21,18,13], R: [30,17,17,30,20,18,17],
    S: [15,16,16,14,1,1,30], T: [31,4,4,4,4,4,4], U: [17,17,17,17,17,17,14],
    V: [17,17,17,17,17,10,4], W: [17,17,17,21,21,21,10], X: [17,17,10,4,10,17,17],
    Y: [17,17,10,4,4,4,4], Z: [31,1,2,4,8,16,31],
    0: [14,17,19,21,25,17,14], 1: [4,12,4,4,4,4,14], 2: [14,17,1,2,4,8,31],
    3: [30,1,1,14,1,1,30], 4: [2,6,10,18,31,2,2], 5: [31,16,16,30,1,1,30],
    6: [14,16,16,30,17,17,14], 7: [31,1,2,4,8,8,8], 8: [14,17,17,14,17,17,14],
    9: [14,17,17,15,1,1,14], "-": [0,0,0,31,0,0,0], ":": [0,4,4,0,4,4,0],
    ".": [0,0,0,0,0,12,12], "/": [1,1,2,4,8,16,16], "+": [0,4,4,31,4,4,0],
    "!": [4,4,4,4,4,0,4], ">": [16,8,4,2,4,8,16], "<": [1,2,4,8,4,2,1],
    "?": [14,17,1,2,4,0,4], "*": [0,21,14,31,14,21,0], "=": [0,0,31,0,31,0,0],
  };
  // Each character is one deliberately drawn pixel, not a sampled game asset.
  const SHAPES = [
    ["0001111000","0013332100","0133332210","1333332221","1332222221","1322222241","1222222441","0122244410","0014444100","0001111000"],
    ["0000110000","0001331000","0013333100","0133332210","1333222221","1322222441","0122224410","0012244100","0001441000","0000110000"],
    ["0111111110","1333333321","1322222221","1322222221","1322222221","1322222241","1322222241","1222222441","1244444441","0111111110"],
    ["0000110000","0001331000","0001321000","0013332100","0113322110","1332222221","1322222441","1222224441","0114444110","0001111000"],
    ["0001111000","0013333100","0133333210","1333322221","1322222221","1322222241","1222222441","0122224410","0014444100","0001111000"],
    ["0011111100","0133333320","1333333321","1322222221","1322222221","1322222241","1222222441","1222224441","0144444410","0011111100"],
    ["0001111000","0113333110","1333333221","1322222221","1322222221","1322222241","1222222441","1244444441","0114444110","0001111000"],
  ];
  const COLORS = [
    ["#5e182a","#e64663","#ffbcc6","#9e2444"],
    ["#134153","#3ed6ee","#d2ffff","#1688bc"],
    ["#145d49","#49d887","#c2ffc3","#19875b"],
    ["#62430b","#f1c64d","#fff4bd","#bd7e1b"],
    ["#203774","#638bfc","#d2e2ff","#3555b1"],
    ["#532a78","#b374ea","#f3d1ff","#7a43b7"],
    ["#203774","#638bfc","#d2e2ff","#3555b1"],
  ];

  class JewelRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      canvas.width = 256; canvas.height = 240;
      this.ctx.imageSmoothingEnabled = false;
      this.tiles = Object.create(null);
      this.disposed = false;
    }
    rect(x, y, w, h, color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    text(value, x, y, color, scale, align) {
      value = String(value).toUpperCase(); scale = scale || 1;
      const width = value.length * 6 * scale - scale;
      if (align === "center") x -= width / 2;
      if (align === "right") x -= width;
      this.ctx.fillStyle = color || "#ecedec";
      for (let i = 0; i < value.length; i++) {
        const glyph = FONT[value[i]];
        if (!glyph) continue;
        for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++)
          if (glyph[row] & (1 << (4 - col)))
            this.ctx.fillRect(Math.round(x + (i * 6 + col) * scale), Math.round(y + row * scale), scale, scale);
      }
    }
    panel(x, y, w, h, color) {
      this.rect(x, y, w, h, "#05091b");
      this.rect(x, y, w, 1, color || "#9a824f");
      this.rect(x, y + h - 1, w, 1, "#494165");
      this.rect(x, y, 1, h, color || "#9a824f");
      this.rect(x + w - 1, y, 1, h, "#494165");
      this.rect(x + 2, y + 2, w - 4, 1, "#202743");
      this.rect(x + 2, y + 2, 1, h - 4, "#202743");
    }
    gem(value, x, y, size, glow) {
      if (!value) return;
      const index = (Math.max(1, Math.floor(value)) - 1) % COLORS.length;
      const mask = SHAPES[index], palette = COLORS[index];
      const pixel = Math.max(1, Math.floor(size / 10));
      x = Math.floor(x + (size - pixel * 10) / 2);
      y = Math.floor(y + (size - pixel * 10) / 2);
      if (glow) this.rect(x - 1, y - 1, pixel * 10 + 2, pixel * 10 + 2, "#fff8da");
      const phase = Math.floor((this.frame || 0) / 7) % 6;
      const key = value + ":" + (value === 7 ? phase : 0) + ":" + !!glow;
      let tile = this.tiles[key];
      if (!tile) {
        tile = (this.canvas.ownerDocument || root.document).createElement("canvas");
        tile.width = tile.height = 10;
        const pixels = tile.getContext("2d");
      for (let row = 0; row < mask.length; row++) for (let col = 0; col < 10; col++) {
        const shade = Number(mask[row][col]);
        if (shade) {
          const rainbow = COLORS[(phase + Math.floor(row / 2) + Math.floor(col / 3)) % 6];
          const color = value === 7 ? (shade === 3 ? "#ffffff" : rainbow[shade - 1]) : palette[shade - 1];
          pixels.fillStyle = glow ? "#fff7d4" : color;
          pixels.fillRect(col, row, 1, 1);
        }
      }
        this.tiles[key] = tile;
      }
      this.ctx.drawImage(tile, x, y, pixel * 10, pixel * 10);
    }
    background(frame) {
      this.rect(0, 0, 256, 240, "#080e26");
      this.rect(0, 84, 256, 82, "#111b38");
      this.rect(0, 166, 256, 74, "#1a2341");
      for (let i = 0; i < 32; i++) {
        const x = (i * 71 + 17) % 254, y = (i * 37 + 19) % 157;
        this.rect(x, y, 1, 1, ((i * 17 + Math.floor(frame / 32)) % 6) ? "#59668b" : "#c7d4ec");
      }
      const moon = [5,9,11,13,13,13,13,13,13,13,11,9,5];
      moon.forEach((width, row) => this.rect(219 + Math.floor((13 - width) / 2), 25 + row, width, 1, "#dcc791"));
      moon.forEach((width, row) => this.rect(216 + Math.floor((13 - width) / 2), 23 + row, width, 1, "#080e26"));
      // Original city and torch-bearing statue silhouette, recalling the night skyline.
      for (let i = 0; i < 10; i++) {
        const x = i * 26 - 4, tall = 16 + (i % 4) * 8;
        this.rect(x, 194 - tall, 19, tall, "#10172c");
        this.rect(x + 6, 188 - tall, 7, 6, "#141c33");
        for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++)
          this.rect(x + 3 + col * 5, 199 - tall + row * 9, 2, 3, (i + row + col) % 3 ? "#2c3450" : "#69565a");
      }
      this.rect(201, 191, 42, 5, "#3c4158");
      this.rect(207, 182, 30, 9, "#3b4055");
      this.rect(211, 159, 23, 23, "#1c3a42");
      this.rect(214, 140, 17, 24, "#244951");
      this.rect(217, 128, 11, 15, "#2e5960");
      this.rect(218, 121, 8, 8, "#477073");
      this.rect(216, 119, 12, 3, "#477073");
      this.rect(215, 116, 2, 4, "#477073");
      this.rect(220, 113, 2, 7, "#477073");
      this.rect(226, 116, 2, 4, "#477073");
      this.rect(228, 123, 6, 17, "#315d61");
      this.rect(232, 109, 4, 18, "#3a686b");
      this.rect(231, 103, 7, 6, "#547775");
      this.rect(232, 97, 5, 6, "#c48a4d");
      this.rect(233, 94, 3, 5, "#f0c778");
      this.rect(212, 138, 5, 15, "#49676c");
      this.rect(216, 153, 3, 25, "#3a575e");
      this.rect(224, 150, 2, 30, "#142e37");
      this.rect(0, 195, 256, 2, "#6b5361");
      this.rect(0, 197, 256, 43, "#101a34");
      for (let i = 0; i < 18; i++) this.rect((i * 37 + 9) % 240, 200 + i * 2, 7 + (i % 4) * 4, 1, "#29324c");
    }
    well(player, x, y, cell, frame) {
      const w = 6 * cell, h = 13 * cell;
      this.panel(x - 4, y - 4, w + 8, h + 8, player.id === 2 ? "#b185a7" : "#9a824f");
      this.ctx.save(); this.ctx.beginPath(); this.ctx.rect(x, y, w, h); this.ctx.clip();
      for (let row = 0; row < 13; row++) for (let col = 0; col < 6; col++) {
        this.rect(x + col * cell, y + row * cell, cell, cell, (row + col) % 2 ? "#0b132a" : "#0d162e");
        const value = player.board && player.board[row] ? player.board[row][col] : 0;
        let glow = false;
        if (player.clearCells && frame % 10 < 5)
          glow = player.clearCells.some(function (point) { return point.x === col && point.y === row; });
        this.gem(value, x + col * cell, y + row * cell, cell, glow);
      }
      if (player.active) {
        const active = player.active;
        for (let i = 0; i < 3; i++) this.gem(active.colors[i], x + active.x * cell, y + (active.y + i) * cell, cell, false);
      }
      this.ctx.restore();
      if (player.alive === false && player.joined) {
        this.rect(x, y + Math.floor(h / 2) - 13, w, 27, "#0b1023");
        this.text("TOP OUT", x + w / 2, y + Math.floor(h / 2) - 4, "#f7adbc", 1, "center");
      }
      if (player.chain > 1 && player.clearCells && player.clearCells.length) {
        this.text("CHAIN " + player.chain, x + w / 2, y - 15, "#fff0b1", 1, "center");
      }
    }
    title(game) {
      const frame = game.frame || 0;
      this.panel(19, 27, 218, 76, "#be9756");
      this.text("MAGIC", 129, 38, "#4c2d65", 3, "center");
      this.text("MAGIC", 127, 36, "#f1d684", 3, "center");
      this.text("JEWELRY", 129, 68, "#3d2e63", 3, "center");
      this.text("JEWELRY", 127, 66, "#ddd8ff", 3, "center");
      for (let i = 0; i < 7; i++) this.gem(i + 1, 35 + i * 27, 111 + ((Math.floor(frame / 24) + i) % 2), 20, false);
      this.text((game.selectedPlayers === 2 ? "  " : "> ") + "1 PLAYER", 128, 150, game.selectedPlayers === 2 ? "#929bb5" : "#fff1bf", 1, "center");
      this.text((game.selectedPlayers === 2 ? "> " : "  ") + "2 PLAYERS", 128, 166, game.selectedPlayers === 2 ? "#fff1bf" : "#929bb5", 1, "center");
      this.text("LEVEL " + String((game.titleLevel || 0) + 1).padStart(2, "0"), 128, 185, "#9baac8", 1, "center");
      if (Math.floor(frame / 35) % 2 === 0) this.text("PRESS START", 128, 205, "#f1d684", 1, "center");
      this.text("SELECT MODE  START BEGIN", 128, 222, "#7d8ba9", 1, "center");
    }
    single(game) {
      const player = game.players[0];
      this.text("MAGIC JEWELRY", 128, 9, "#efe0b4", 2, "center");
      this.text("TOP " + String(Math.min(99999999, Math.max(game.highScore || 0, player.score || 0))).padStart(8, "0"), 128, 32, "#91a0bd", 1, "center");
      this.well(player, 32, 53, 12, game.frame || 0);
      this.panel(126, 49, 105, 164, "#70688d");
      this.text("NEXT", 137, 60, "#cabcd9");
      const next = player.next || [1, 2, 3];
      for (let i = 0; i < 3; i++) this.gem(next[i], 200, 56 + 12 * i, 12, false);
      this.rect(135, 97, 87, 1, "#34344b");
      this.text("SCORE", 137, 106, "#91a0bd");
      this.text(String(Math.min(99999999, player.score || 0)).padStart(8, "0"), 137, 119, "#fff3ce");
      this.text("LEVEL", 137, 141, "#91a0bd");
      this.text(String((player.level || 0) + 1).padStart(2, "0"), 218, 141, "#d2e1ff", 1, "right");
      this.text("GEMS", 137, 158, "#91a0bd");
      this.text(String(player.cleared || 0).padStart(4, "0"), 218, 158, "#92e9c0", 1, "right");
      this.text("CHAIN", 137, 175, "#91a0bd");
      this.text(String(player.chain || 0), 218, 175, "#efb4ef", 1, "right");
      this.text("1 PLAYER", 178, 197, "#727c98", 1, "center");
      this.text("A/B CYCLE   DOWN: SOFT DROP", 128, 222, "#99a6c0", 1, "center");
    }
    double(game) {
      this.text("JEWELRY DUEL", 128, 10, "#efe0b4", 2, "center");
      this.text("SAME GEMS - BEST SCORE", 128, 31, "#91a0bd", 1, "center");
      for (let index = 0; index < 2; index++) {
        const p = game.players[index], left = index ? 164 : 28;
        this.text("P" + (index + 1) + "  LV" + String((p.level || 0) + 1).padStart(2, "0"), left + 30, 48, index ? "#f0bedc" : "#e9d68f", 1, "center");
        this.well(p, left, 65, 10, game.frame || 0);
        this.rect(left - 4, 199, 68, 30, "#080d21");
        this.rect(left - 4, 199, 68, 1, "#34344b");
        this.text(String(Math.min(9999999, p.score || 0)).padStart(7, "0"), left + 30, 204, "#e5e8f2", 1, "center");
        this.text("GEMS " + String(p.cleared || 0).padStart(3, "0"), left + 30, 219, "#8fa4bb", 1, "center");
        const nx = index ? 146 : 98;
        this.text("N", nx + 5, 67, "#8a93ab", 1, "center");
        for (let n = 0; n < 3; n++) this.gem((p.next || [1, 2, 3])[n], nx, 80 + 11 * n, 10, false);
      }
      this.text("VS", 128, 135, "#665976", 1, "center");
    }
    overlay(title, detail) {
      this.rect(17, 96, 222, 50, "#080d21");
      this.rect(17, 96, 222, 1, "#aa8750");
      this.rect(17, 145, 222, 1, "#504265");
      this.text(title, 128, 106, "#f4dfaa", 2, "center");
      this.text(detail, 128, 133, "#a9b3cb", 1, "center");
    }
    draw(game) {
      if (this.disposed) return;
      this.frame = game.frame || 0;
      this.ctx.imageSmoothingEnabled = false;
      this.background(game.frame || 0);
      if (game.phase === "title") this.title(game);
      else {
        if (game.selectedPlayers === 2) this.double(game); else this.single(game);
        if (game.phase === "paused") this.overlay("PAUSED", game.autoPaused ? "WAIT FOR CONTROLLERS" : "START RESUME / SELECT MUSIC");
        else if (game.phase === "gameover") this.overlay("GAME OVER", "START TO RETURN TO TITLE");
      }
      this.text(game.muted ? "SOUND OFF" : "SOUND ON", 252, 231, "#8a98b4", 1, "right");
    }
    dispose() { this.disposed = true; this.tiles = Object.create(null); }
  }
  root.JewelRenderer = JewelRenderer;
  if (typeof module !== "undefined" && module.exports) module.exports = { JewelRenderer, FONT };
})(typeof window !== "undefined" ? window : global);
