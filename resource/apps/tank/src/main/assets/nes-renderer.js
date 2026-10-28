/* Independent native-pixel Battle City renderer. See docs/reference-art-audio.md. */
(function (root) {
  "use strict";
  const SCREEN_W = 256,
    SCREEN_H = 240,
    FIELD_X = 16,
    FIELD_Y = 16,
    FIELD_SIZE = 208;
  const C = {
    frame: "#747474",
    black: "#000000",
    white: "#ffffff",
    red: "#e44437",
    gold: "#feac4e",
  };
  // Fixed 8×8 cells keep menu, status and tally geometry on the original tile grid.
  const FONT = {
    0: [0x3c, 0x66, 0x6e, 0x76, 0x66, 0x66, 0x3c, 0],
    1: [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7e, 0],
    2: [0x3c, 0x66, 0x06, 0x0c, 0x30, 0x60, 0x7e, 0],
    3: [0x3c, 0x66, 0x06, 0x1c, 0x06, 0x66, 0x3c, 0],
    4: [0x0c, 0x1c, 0x3c, 0x6c, 0x7e, 0x0c, 0x0c, 0],
    5: [0x7e, 0x60, 0x7c, 0x06, 0x06, 0x66, 0x3c, 0],
    6: [0x1c, 0x30, 0x60, 0x7c, 0x66, 0x66, 0x3c, 0],
    7: [0x7e, 0x66, 0x06, 0x0c, 0x18, 0x18, 0x18, 0],
    8: [0x3c, 0x66, 0x66, 0x3c, 0x66, 0x66, 0x3c, 0],
    9: [0x3c, 0x66, 0x66, 0x3e, 0x06, 0x0c, 0x38, 0],
    A: [0x18, 0x3c, 0x66, 0x66, 0x7e, 0x66, 0x66, 0],
    B: [0x7c, 0x66, 0x66, 0x7c, 0x66, 0x66, 0x7c, 0],
    C: [0x3c, 0x66, 0x60, 0x60, 0x60, 0x66, 0x3c, 0],
    D: [0x78, 0x6c, 0x66, 0x66, 0x66, 0x6c, 0x78, 0],
    E: [0x7e, 0x60, 0x60, 0x7c, 0x60, 0x60, 0x7e, 0],
    F: [0x7e, 0x60, 0x60, 0x7c, 0x60, 0x60, 0x60, 0],
    G: [0x3c, 0x66, 0x60, 0x6e, 0x66, 0x66, 0x3c, 0],
    H: [0x66, 0x66, 0x66, 0x7e, 0x66, 0x66, 0x66, 0],
    I: [0x7e, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7e, 0],
    J: [0x1e, 0x0c, 0x0c, 0x0c, 0x0c, 0x6c, 0x38, 0],
    K: [0x66, 0x6c, 0x78, 0x70, 0x78, 0x6c, 0x66, 0],
    L: [0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7e, 0],
    M: [0x63, 0x77, 0x7f, 0x6b, 0x63, 0x63, 0x63, 0],
    N: [0x66, 0x76, 0x7e, 0x7e, 0x6e, 0x66, 0x66, 0],
    O: [0x3c, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3c, 0],
    P: [0x7c, 0x66, 0x66, 0x7c, 0x60, 0x60, 0x60, 0],
    Q: [0x3c, 0x66, 0x66, 0x66, 0x6e, 0x3c, 0x0e, 0],
    R: [0x7c, 0x66, 0x66, 0x7c, 0x78, 0x6c, 0x66, 0],
    S: [0x3c, 0x66, 0x60, 0x3c, 0x06, 0x66, 0x3c, 0],
    T: [0x7e, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0],
    U: [0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3c, 0],
    V: [0x66, 0x66, 0x66, 0x66, 0x66, 0x3c, 0x18, 0],
    W: [0x63, 0x63, 0x63, 0x6b, 0x7f, 0x77, 0x63, 0],
    X: [0x66, 0x66, 0x3c, 0x18, 0x3c, 0x66, 0x66, 0],
    Y: [0x66, 0x66, 0x66, 0x3c, 0x18, 0x18, 0x18, 0],
    Z: [0x7e, 0x06, 0x0c, 0x18, 0x30, 0x60, 0x7e, 0],
    "-": [0, 0, 0, 0x7e, 0, 0, 0, 0],
    ":": [0, 0x18, 0x18, 0, 0x18, 0x18, 0, 0],
    ".": [0, 0, 0, 0, 0, 0x18, 0x18, 0],
    "/": [0x02, 0x06, 0x0c, 0x18, 0x30, 0x60, 0x40, 0],
    ">": [0, 0x30, 0x18, 0x0c, 0x18, 0x30, 0, 0],
    "<": [0, 0x0c, 0x18, 0x30, 0x18, 0x0c, 0, 0],
    "!": [0x18, 0x18, 0x18, 0x18, 0x18, 0, 0x18, 0],
  };
  const DIRECTIONS = ["up", "right", "down", "left"];
  class TankRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      canvas.width = SCREEN_W;
      canvas.height = SCREEN_H;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.ctx.imageSmoothingEnabled = false;
      this.art = root.TankArt || {};
      this.cache = new Map();
    }
    rect(x, y, w, h, color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(
        Math.round(x),
        Math.round(y),
        Math.round(w),
        Math.round(h),
      );
    }
    text(value, x, y, color = C.white) {
      this.ctx.fillStyle = color;
      for (const char of String(value).toUpperCase()) {
        const rows = FONT[char];
        if (rows)
          for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++)
              if (rows[r] & (1 << (7 - c)))
                this.ctx.fillRect(Math.round(x) + c, Math.round(y) + r, 1, 1);
        x += 8;
      }
    }
    image(name, recolor = "") {
      const key = name + ":" + recolor;
      if (this.cache.has(key)) return this.cache.get(key);
      const data = this.art[name];
      if (!data) return null;
      const [w, h, palette, encoded] = data;
      const output = document.createElement("canvas");
      output.width = w;
      output.height = h;
      const context = output.getContext("2d"),
        pixels = context.createImageData(w, h),
        raw = atob(encoded);
      let offset = 0;
      for (let i = 0; i < raw.length; i += 2) {
        const count = raw.charCodeAt(i),
          index = raw.charCodeAt(i + 1);
        let hex = palette[index];
        if (hex && recolor === "p2") {
          const r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16);
          hex = g > 200 ? "#b8f818" : r > 180 ? "#00a800" : "#005800";
        }
        const color = hex
          ? [
              parseInt(hex.slice(1, 3), 16),
              parseInt(hex.slice(3, 5), 16),
              parseInt(hex.slice(5, 7), 16),
              255,
            ]
          : [0, 0, 0, 0];
        for (let n = 0; n < count; n++) {
          pixels.data.set(color, offset * 4);
          offset++;
        }
      }
      context.putImageData(pixels, 0, 0);
      this.cache.set(key, output);
      return output;
    }
    sprite(name, x, y, recolor = "") {
      const source = this.image(name, recolor);
      if (source) this.ctx.drawImage(source, Math.round(x), Math.round(y));
    }
    tile(type, col, row, frame) {
      const x = FIELD_X + col * 4,
        y = FIELD_Y + row * 4;
      let name, period;
      if (type === 1) {
        name = "wall_brick";
        period = 8;
      } else if (type === 2) {
        name = "wall_steel";
        period = 8;
      } else if (type === 3) {
        name = "water_" + ((Math.floor(frame / 30) % 2) + 1);
        period = 16;
      } else if (type === 4) {
        name = "trees";
        period = 16;
      }
      if (name) {
        const source = this.image(name);
        if (source)
          this.ctx.drawImage(
            source,
            (col * 4) % period,
            (row * 4) % period,
            4,
            4,
            x,
            y,
            4,
            4,
          );
      } else if (type === 5) {
        this.rect(x, y, 4, 4, "#ffffff");
        if ((col + row) % 3 === 0) {
          this.rect(x, y, 1, 3, "#bcbcbc");
          this.rect(x + 1, y, 1, 2, "#bcbcbc");
        }
      }
    }
    tank(entity, isPlayer, frame) {
      const x = FIELD_X + Math.round(entity.x) - 8,
        y = FIELD_Y + Math.round(entity.y) - 8;
      if (entity.spawnFrames > 0) {
        const elapsed = Math.max(0, 64 - entity.spawnFrames);
        this.sprite("appear_" + ((Math.floor(elapsed / 4) % 4) + 1), x, y);
        return;
      }
      if (entity.alive === false) return;
      const direction = DIRECTIONS[(entity.dir || 0) % 4],
        track = (entity.moving === false ? 0 : Math.floor(frame / 4) % 2) + 1;
      if (isPlayer) {
        const stars = Math.max(0, Math.min(3, entity.stars || 0));
        this.sprite(
          "tank_player1_" +
            direction +
            "_c0_t" +
            track +
            (stars ? "_s" + stars : ""),
          x,
          y,
          entity.id === 2 ? "p2" : "",
        );
        if (entity.shieldFrames > 0)
          this.sprite("shield_" + ((Math.floor(frame / 2) % 2) + 1), x, y);
      } else {
        let color = 0;
        const type = ["basic", "fast", "power", "armor"].includes(entity.type)
          ? entity.type
          : "basic";
        if (type === "armor")
          color = entity.hp >= 4 ? 1 : entity.hp === 3 ? 2 : 0;
        const flash = entity.bonus && Math.floor(frame / 4) % 2 === 0;
        let name =
          "tank_" +
          type +
          "_" +
          direction +
          "_c" +
          color +
          "_t" +
          track +
          (flash ? "_f" : "");
        if (!this.art[name])
          name =
            "tank_" +
            type +
            "_" +
            direction +
            "_c0_t" +
            track +
            (flash ? "_f" : "");
        this.sprite(name, x, y);
      }
    }
    hud(game) {
      for (let n = 0; n < Math.min(20, Math.max(0, game.remaining || 0)); n++)
        this.sprite("enemy", 232 + (n % 2) * 8, 24 + Math.floor(n / 2) * 8);
      for (let id = 1; id <= 2; id++) {
        if (id === 2 && (game.selectedPlayers || 1) < 2) continue;
        const p = (game.players || []).find((v) => v.id === id),
          y = id === 1 ? 128 : 152;
        this.text(id + "P", 232, y, C.black);
        this.sprite("lives", 232, y + 8);
        this.text(p ? Math.max(0, (p.lives || 0) - 1) : 0, 240, y + 8, C.black);
      }
      this.sprite("flag", 232, 176);
      this.text(
        String(Math.max(1, game.stage || 1)).padStart(2, " "),
        232,
        192,
        C.black,
      );
    }
    field(game) {
      const frame = game.frame || Math.floor((game.time || 0) * 60);
      this.rect(0, 0, 256, 240, C.frame);
      this.rect(16, 16, 208, 208, C.black);
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.rect(16, 16, 208, 208);
      ctx.clip();
      const map = game.map || [];
      for (let row = 0; row < map.length; row++)
        for (let col = 0; col < (map[row] || []).length; col++)
          if (map[row][col] !== 4) this.tile(map[row][col], col, row, frame);
      const base = game.base || { x: 104, y: 200, alive: true };
      this.sprite(
        base.alive ? "base" : "base_destroyed",
        16 + base.x - 8,
        16 + base.y - 8,
      );
      for (const enemy of game.enemies || []) this.tank(enemy, false, frame);
      for (const player of game.players || [])
        if (player.joined !== false && player.id <= (game.selectedPlayers || 2))
          this.tank(player, true, frame);
      for (const bullet of game.bullets || []) {
        const dir = Number.isInteger(bullet.dir)
          ? bullet.dir
          : Math.abs(bullet.dx || 0) > Math.abs(bullet.dy || 0)
            ? bullet.dx > 0
              ? 1
              : 3
            : bullet.dy > 0
              ? 2
              : 0;
        this.sprite(
          "bullet_" + DIRECTIONS[dir],
          16 + bullet.x - 2,
          16 + bullet.y - 2,
        );
      }
      for (let row = 0; row < map.length; row++)
        for (let col = 0; col < (map[row] || []).length; col++)
          if (map[row][col] === 4) this.tile(4, col, row, frame);
      const bonus = game.powerUp;
      if (bonus && Math.floor(frame / 8) % 2 === 0) {
        const type = bonus.type === "watch" ? "timer" : bonus.type;
        this.sprite("powerup_" + type, 16 + bonus.x - 8, 16 + bonus.y - 8);
      }
      for (const effect of game.explosions || []) {
        const progress =
            1 - Math.max(0, Math.min(1, effect.frames / (effect.total || 1))),
          type =
            effect.type === "bullet" ? "bullet_explosion_" : "big_explosion_",
          count = effect.type === "bullet" ? 3 : 5,
          name = type + Math.min(count, 1 + Math.floor(progress * count)),
          source = this.image(name);
        if (source)
          this.sprite(
            name,
            16 + effect.x - source.width / 2,
            16 + effect.y - source.height / 2,
          );
      }
      for (const item of game.scorePopups || []) {
        if (this.art["points_" + item.score])
          this.sprite("points_" + item.score, 16 + item.x - 8, 16 + item.y - 4);
        else this.text(item.score, 16 + item.x - 12, 16 + item.y - 4);
      }
      ctx.restore();
      this.hud(game);
    }
    title(game) {
      this.rect(0, 0, 256, 240, C.black);
      const shift = Number(game.titleOffset) || 0;
      this.text("I-    00", 16, 16 + shift);
      this.text("HI- " + String(game.highScore || 20000), 88, 16 + shift);
      this.sprite("battle_city", 28, 40 + shift);
      const labels = ["1 PLAYER", "2 PLAYERS", "CONSTRUCTION"];
      for (let i = 0; i < labels.length; i++)
        this.text(labels[i], 80, 128 + i * 16 + shift);
      this.sprite(
        "tank_player1_right_c0_t" +
          ((Math.floor((game.frame || 0) / 8) % 2) + 1),
        56,
        124 + (game.menuIndex || 0) * 16 + shift,
      );
      this.sprite("namcot", 88, 176 + shift);
      this.sprite("copyright", 32, 192 + shift);
      this.text("1980 1985 NAMCO LTD.", 48, 192 + shift);
      this.text("ALL RIGHTS RESERVED", 48, 208 + shift);
    }
    stageIntro(game) {
      this.rect(0, 0, 256, 240, C.frame);
      this.text(
        "STAGE " + String(game.stage || 1).padStart(2, " "),
        88,
        112,
        C.black,
      );
    }
    results(game) {
      this.rect(0, 0, 256, 240, C.black);
      this.text("HI-SCORE", 56, 16, C.red);
      this.text(
        String(game.highScore || 20000).padStart(5, " "),
        128,
        16,
        C.gold,
      );
      this.text("STAGE " + String(game.stage || 1).padStart(2, " "), 96, 32);
      const dual = (game.selectedPlayers || 1) === 2;
      this.text("I-PLAYER", 16, 48, C.red);
      if (dual) this.text("II-PLAYER", 168, 48, C.red);
      for (let id = 1; id <= (dual ? 2 : 1); id++) {
        const p = (game.players || []).find((v) => v.id === id);
        this.text(
          String(p ? p.score : 0).padStart(7, " "),
          id === 1 ? 16 : 176,
          64,
          C.gold,
        );
      }
      const types = ["basic", "fast", "power", "armor"],
        phaseFrames = game.phaseFrames || 0;
      let elapsed = phaseFrames - 30,
        tallyDone = true;
      for (let row = 0; row < 4; row++) {
        const y = 88 + row * 24;
        this.sprite("tank_" + types[row] + "_up_c0_t1", 120, y - 4);
        const maximum = Math.max(
            Number(((game.stats || [])[0] || {})[types[row]]) || 0,
            dual ? Number(((game.stats || [])[1] || {})[types[row]]) || 0 : 0,
          ),
          visible = Math.max(0, Math.floor(elapsed / 5));
        if (elapsed < maximum * 5) tallyDone = false;
        elapsed -= maximum * 5 + 24;
        for (let id = 1; id <= (dual ? 2 : 1); id++) {
          const stat = (game.stats || [])[id - 1] || {},
            count = Math.min(Number(stat[types[row]]) || 0, visible),
            x = id === 1 ? 16 : 168;
          this.text(String(count * (row + 1) * 100).padStart(4, " "), x, y);
          this.text("PTS", id === 1 ? 56 : 208, y);
          this.text(String(count).padStart(2, " "), id === 1 ? 96 : 144, y);
          this.text(id === 1 ? ">" : "<", id === 1 ? 112 : 136, y);
        }
      }
      this.rect(88, 180, 24, 1, C.white);
      if (dual) this.rect(144, 180, 24, 1, C.white);
      this.text("TOTAL", 40, 192);
      if (tallyDone && elapsed > 0) {
        this.text(
          String(((game.stats || [])[0] || {}).total || 0).padStart(2, " "),
          96,
          192,
        );
        if (dual)
          this.text(
            String(((game.stats || [])[1] || {}).total || 0).padStart(2, " "),
            144,
            192,
          );
        for (let id = 1; id <= (dual ? 2 : 1); id++) {
          const bonus = Number(((game.stats || [])[id - 1] || {}).bonus) || 0;
          if (bonus) {
            this.text("BONUS", id === 1 ? 16 : 176, 208, C.red);
            this.text(bonus, id === 1 ? 24 : 184, 224);
          }
        }
      }
    }
    construction(game) {
      this.field({
        ...game,
        players: [],
        enemies: [],
        bullets: [],
        powerUp: null,
      });
      const cursor = game.construction || { row: 0, col: 0, tile: 0 },
        x = 16 + (cursor.col || 0) * 16,
        y = 16 + (cursor.row || 0) * 16;
      if (Math.floor((game.frame || 0) / 8) % 2 === 0) {
        this.rect(x, y, 16, 1, C.white);
        this.rect(x, y + 15, 16, 1, C.white);
        this.rect(x, y, 1, 16, C.white);
        this.rect(x + 15, y, 1, 16, C.white);
      }
    }
    draw(game) {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.globalAlpha = 1;
      const phase = game.phase || "title";
      if (phase === "title" || phase === "lobby") this.title(game);
      else if (phase === "stageintro" || phase === "stage_intro")
        this.stageIntro(game);
      else if (phase === "results" || phase === "result") this.results(game);
      else if (phase === "construction") this.construction(game);
      else if (phase === "gameover") {
        this.rect(0, 0, 256, 240, C.black);
        this.sprite("game_over", 66, 80);
      } else {
        this.field(game);
        if (phase === "paused") {
          this.rect(96, 112, 48, 8, C.black);
          this.text("PAUSE", 104, 112, C.red);
        } else if (game.resultGameOver && game.transition > 0) {
          const y = Math.max(112, 208 - (180 - game.transition));
          this.rect(96, y, 32, 16, C.black);
          this.text("GAME", 96, y, C.red);
          this.text("OVER", 96, y + 8, C.red);
        }
      }
    }
  }
  root.TankRenderer = TankRenderer;
  root.NesRenderer = TankRenderer;
  if (typeof module !== "undefined" && module.exports)
    module.exports = {
      TankRenderer,
      NesRenderer: TankRenderer,
      SCREEN_W,
      SCREEN_H,
      FIELD_X,
      FIELD_Y,
      FIELD_SIZE,
      COLORS: C,
    };
})(typeof window !== "undefined" ? window : globalThis);
