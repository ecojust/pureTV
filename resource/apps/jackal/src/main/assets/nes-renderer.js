/* Full 256×240 Jackal display. This renderer consumes data, not NES machine code. */
(function (root) {
  "use strict";
  const WIDTH = 256,
    HEIGHT = 240;
  function image(url) {
    return new Promise((resolve, reject) => {
      const value = new Image();
      value.onload = () => resolve(value);
      value.onerror = () => reject(new Error("Missing artwork: " + url));
      value.src = url;
    });
  }
  async function json(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Missing game data: " + url);
    return response.json();
  }
  // Promise.finally is unavailable on the older TV WebViews we support.
  function clearPending(task, pending, key) {
    return task.then(
      (value) => {
        pending.delete(key);
        return value;
      },
      (error) => {
        pending.delete(key);
        throw error;
      },
    );
  }
  class JackalArtwork {
    constructor(base) {
      this.base = base.endsWith("/") ? base : base + "/";
      this.stages = new Map();
      this.textures = new Map();
      this.scenes = new Map();
      this.pending = new Map();
      this.errors = new Map();
      this.disposed = false;
    }
    async initialize() {
      const [sprites, font, patches] = await Promise.all([
        json(this.base + "levels/sprites.json"),
        image(this.base + "fonts/hud.png"),
        json(this.base + "boss_patches.json"),
      ]);
      this.frames = sprites.frames;
      this.font = font;
      this.bossPatches = patches.patches;
      await Promise.all([
        this.stage(1),
        this.scene("title_1p"),
        this.scene("title_2p"),
      ]);
      return this;
    }
    stage(number) {
      const key = "stage:" + number;
      if (this.stages.has(number))
        return Promise.resolve(this.stages.get(number));
      if (this.pending.has(key)) return this.pending.get(key);
      const stem = "textures/stage_" + String(number).padStart(2, "0");
      const loading = Promise.all([
        this.texture(stem + "_tiles.png"),
        this.texture(stem + "_sprites.png"),
      ])
        .then(([tiles, sprites]) => {
          const stage = { tiles, sprites };
          if (!this.disposed) this.stages.set(number, stage);
          return stage;
        })
        .catch((error) => {
          this.errors.set(key, error);
          throw error;
        });
      const task = clearPending(loading, this.pending, key);
      this.pending.set(key, task);
      return task;
    }
    texture(path) {
      const key = "texture:" + path;
      if (this.textures.has(path)) {
        const result = this.textures.get(path);
        this.textures.delete(path);
        this.textures.set(path, result);
        return Promise.resolve(result);
      }
      if (this.pending.has(key)) return this.pending.get(key);
      const loading = image(this.base + path)
        .then((result) => {
          if (!this.disposed) {
            this.textures.set(path, result);
            while (this.textures.size > 24)
              this.textures.delete(this.textures.keys().next().value);
          }
          return result;
        })
        .catch((error) => {
          this.errors.set(key, error);
          throw error;
        });
      const task = clearPending(loading, this.pending, key);
      this.pending.set(key, task);
      return task;
    }
    scene(name) {
      const key = "scene:" + name;
      if (this.scenes.has(name)) return Promise.resolve(this.scenes.get(name));
      if (this.pending.has(key)) return this.pending.get(key);
      const loading = Promise.all([
        json(this.base + "cinematics/" + name + "/timeline.json"),
        image(this.base + "cinematics/" + name + "/tiles.png"),
      ])
        .then(([data, atlas]) => {
          const scene = Object.assign({}, data, { atlas, offsets: [] });
          let total = 0;
          for (const frame of scene.frames) {
            scene.offsets.push(total);
            total += frame.duration_ticks;
          }
          if (!this.disposed) {
            this.scenes.set(name, scene);
            for (const old of [...this.scenes.keys()])
              if (!old.startsWith("title_") && old !== name)
                this.scenes.delete(old);
          }
          return scene;
        })
        .catch((error) => {
          this.errors.set(key, error);
          throw error;
        });
      const task = clearPending(loading, this.pending, key);
      this.pending.set(key, task);
      return task;
    }
    dispose() {
      this.disposed = true;
      this.stages.clear();
      this.textures.clear();
      this.scenes.clear();
      this.pending.clear();
      this.frames = [];
      this.font = null;
    }
  }
  class JackalRenderer {
    static async load(base) {
      return new JackalArtwork(base).initialize();
    }
    constructor(canvas, art) {
      this.canvas = canvas;
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.ctx.imageSmoothingEnabled = false;
      this.art = art;
      this.sceneCache = document.createElement("canvas");
      this.sceneCache.width = WIDTH;
      this.sceneCache.height = HEIGHT;
      this.sceneContext = this.sceneCache.getContext("2d", { alpha: false });
      this.sceneContext.imageSmoothingEnabled = false;
      this.lastScene = "";
      this.lastSceneFrame = -1;
      this.background = null;
      this.level = null;
      this.patchCount = -1;
    }
    sceneFor(game) {
      const phase =
        game.phase === "paused" ? game.previousPhase || "playing" : game.phase;
      if (game.cinematicKey) return game.cinematicKey;
      if (phase === "title")
        return "title_" + (game.selectedPlayers === 2 ? "2p" : "1p");
      if (phase === "attract") return "attract";
      if (phase === "intro")
        return "intro_" + (game.selectedPlayers === 2 ? "2p" : "1p");
      if (phase === "deployment")
        return "stage_load_" + String(game.stage).padStart(2, "0");
      if (phase === "stageclear" && game.stage < 6)
        return "stage_clear_" + String(game.stage).padStart(2, "0");
      if (phase === "continue")
        return game.continueChoice === 1 ? "continue_no" : "continue_yes";
      if (phase === "gameover") return "game_over";
      if (phase === "ending") return "ending";
      return null;
    }
    readyFor(game) {
      const scene = this.sceneFor(game);
      const key = scene ? "scene:" + scene : "stage:" + game.stage;
      if (this.art.errors.has(key)) throw this.art.errors.get(key);
      if (scene) {
        if (this.art.scenes.has(scene)) return true;
        this.art.scene(scene).catch(() => {});
        return false;
      }
      const update = root.JackalSceneUpdates.sceneUpdates(game);
      let ready = true;
      for (const path of [update.tilesPath, update.spritesPath]) {
        if (this.art.errors.has("texture:" + path))
          throw this.art.errors.get("texture:" + path);
        if (!this.art.textures.has(path)) ready = false;
        this.art.texture(path).catch(() => {});
      }
      if (!ready) return false;
      this.presentation = update;
      this.activeArtwork = {
        tiles: this.art.textures.get(update.tilesPath),
        sprites: this.art.textures.get(update.spritesPath),
      };
      return true;
    }
    drawScene(name, tick) {
      const scene = this.art.scenes.get(name);
      if (!scene) return;
      const frameTime = Math.min(
        Math.max(0, tick | 0),
        scene.duration_ticks - 1,
      );
      let left = 0,
        right = scene.offsets.length - 1;
      while (left < right) {
        const middle = Math.ceil((left + right) / 2);
        if (scene.offsets[middle] <= frameTime) left = middle;
        else right = middle - 1;
      }
      if (name !== this.lastScene || left !== this.lastSceneFrame) {
        let position = 0;
        const context = this.sceneContext;
        context.fillStyle = "#000";
        context.fillRect(0, 0, WIDTH, HEIGHT);
        for (const [count, index] of scene.frames[left].tiles) {
          for (let n = 0; n < count; n++) {
            const x = (position % 32) * 8,
              y = Math.floor(position / 32) * 8;
            context.drawImage(
              scene.atlas,
              (index % scene.atlas_columns) * 8,
              Math.floor(index / scene.atlas_columns) * 8,
              8,
              8,
              x,
              y,
              8,
              8,
            );
            position++;
          }
        }
        this.lastScene = name;
        this.lastSceneFrame = left;
      }
      this.ctx.drawImage(this.sceneCache, 0, 0);
    }
    backgroundFor(game, viewX = game.cameraX, slot = "normal") {
      const level = game.level,
        art = this.activeArtwork;
      if (!level || !art) return null;
      const viewY = game.cameraY;
      const col = Math.floor(viewX / 8),
        row = Math.floor(viewY / 8);
      const rowKey = this.presentation.rows
        .map((update) => update.index)
        .join(",");
      const key = [
        col,
        row,
        this.presentation.tilesPath,
        (game.backgroundPatches || []).length,
        rowKey,
      ].join("|");
      if (!this.backgroundCaches) this.backgroundCaches = new Map();
      let cache = this.backgroundCaches.get(slot);
      if (!cache) {
        cache = {};
        this.backgroundCaches.set(slot, cache);
      }
      if (cache.level !== level || cache.key !== key) {
        cache.level = level;
        cache.key = key;
        if (!cache.canvas) {
          cache.canvas = document.createElement("canvas");
          cache.canvas.width = 272;
          cache.canvas.height = 256;
        }
        const context = cache.canvas.getContext("2d", { alpha: false });
        context.imageSmoothingEnabled = false;
        context.fillStyle = "#000";
        context.fillRect(0, 0, 272, 256);
        cache.x = col * 8;
        cache.y = row * 8;
        // Cache only the visible tile window. Changing a palette or boss atlas must
        // not repaint all 25,000 tiles of the world, or retain dozens of full maps.
        for (let dy = 0; dy < 32; dy++)
          for (let dx = 0; dx < 34; dx++) {
            const c = col + dx,
              r = row + dy;
            if (
              c < 0 ||
              r < 0 ||
              c >= level.width_tiles ||
              r >= level.height_tiles
            )
              continue;
            const at = r * level.width_tiles + c;
            this.tile(
              context,
              art.tiles,
              level.tiles[at],
              level.palettes[at],
              dx * 8,
              dy * 8,
            );
          }
        for (const update of this.presentation.rows)
          for (let n = 0; n < update.tiles.length; n++) {
            const x = update.x + n * 8 - cache.x,
              y = update.y - cache.y;
            if (x <= -8 || x >= 272 || y <= -8 || y >= 256) continue;
            this.tile(
              context,
              art.tiles,
              update.tiles[n],
              update.palettes[n],
              x,
              y,
            );
          }
      }
      return cache;
    }
    tile(context, atlas, index, palette, x, y) {
      context.drawImage(
        atlas,
        (index % 16) * 8,
        Math.floor(index / 16) * 8 + (palette & 3) * 128,
        8,
        8,
        x,
        y,
        8,
        8,
      );
    }
    sprite(frameId, x, y, palette, flipX, flipY, stage) {
      const frame = this.art.frames[frameId];
      if (!frame) return;
      const context = this.ctx,
        atlas = this.activeArtwork.sprites;
      for (const part of frame.parts) {
        const px = Math.round(x + (flipX ? -part.x - 8 : part.x)),
          py = Math.round(y + (flipY ? -part.y - 16 : part.y));
        if (px >= WIDTH || px + 8 <= 0 || py >= HEIGHT || py + 16 <= 0)
          continue;
        // Actor attributes are ORed with the original metasprite attributes.
        const colors = ((Number(palette) || 0) | part.palette) & 3;
        context.save();
        context.translate(
          px + (flipX !== !!part.flip_x ? 8 : 0),
          py + (flipY !== !!part.flip_y ? 16 : 0),
        );
        context.scale(
          flipX !== !!part.flip_x ? -1 : 1,
          flipY !== !!part.flip_y ? -1 : 1,
        );
        context.drawImage(
          atlas,
          (part.tile % 16) * 8,
          Math.floor(part.tile / 16) * 16 + colors * 256,
          8,
          16,
          0,
          0,
          8,
          16,
        );
        context.restore();
      }
    }
    actor(actor, game) {
      if (actor.alive === false || actor.hidden || actor.visible === false)
        return;
      const x = actor.screenSpace ? actor.x : actor.x - game.cameraX,
        y = actor.screenSpace ? actor.y : actor.y - game.cameraY;
      if (x < -64 || x > WIDTH + 64 || y < -64 || y > HEIGHT + 64) return;
      let frameId = actor.frameId === undefined ? actor.frame : actor.frameId;
      if (typeof frameId !== "number") return;
      this.sprite(
        frameId,
        x,
        y,
        actor.palette,
        !!actor.flipX,
        !!actor.flipY,
        game.stage,
      );
    }
    text(value, x, y) {
      // HUD sheet holds 0..9 and two player-colored P glyphs.
      for (const char of String(value)) {
        const index = /\d/.test(char)
          ? Number(char)
          : char === "P"
            ? 10
            : char === "J"
              ? 11
              : -1;
        if (index >= 0)
          this.ctx.drawImage(this.art.font, index * 8, 0, 8, 8, x, y, 8, 8);
        x += 8;
      }
    }
    backgroundActor(actor, game) {
      // The final tank uses CHR-bank update indices, not small nametable patches.
      if (actor.sourceType === 0x4b) return;
      if (actor.alive === false || typeof actor.backgroundFrame !== "number")
        return;
      const patch = this.art.bossPatches.find(
        (p) => p.id === actor.backgroundFrame,
      );
      if (!patch) return;
      const col = Math.floor((actor.x + patch.offset_x) / 8),
        row = Math.floor((actor.y + patch.offset_y) / 8);
      const atlas = this.activeArtwork.tiles;
      for (let dy = 0; dy < patch.height; dy++)
        for (let dx = 0; dx < patch.width; dx++) {
          const c = col + dx,
            r = row + dy,
            at = r * game.level.width_tiles + c;
          this.tile(
            this.ctx,
            atlas,
            patch.tiles[dy * patch.width + dx],
            game.level.palettes[at] || 0,
            c * 8 - Math.round(game.cameraX),
            r * 8 - Math.round(game.cameraY),
          );
        }
    }
    hud(game) {
      // Bank1: only one player's HUD is emitted per frame; co-op alternates every 128 ticks.
      const players = game.players.filter((p) => p.joined);
      const player =
        players.length > 1 ? players[((game.frame || 0) >> 7) & 1] : players[0];
      if (!player) return;
      const x = player.id === 1 ? 16 : 160,
        y = 200;
      this.text(
        player.id + "P " + String(Math.max(0, player.score)).padStart(6, "0"),
        x,
        y,
      );
      if (player.lives > 0) {
        this.ctx.drawImage(
          this.art.font,
          (player.id === 1 ? 10 : 11) * 8,
          0,
          8,
          8,
          x + 28,
          y + 16,
          8,
          8,
        );
        this.text(Math.max(0, player.lives - 1), x + 38, y + 16);
      }
    }
    tally(game) {
      // Bank7 PPU text positions: $20ED/$220D labels, then six score digits;
      // $2153/$2273 hold delivered POW counts. Reference capture digits are replaced.
      if (game.phaseFrame < 211) return;
      for (const player of game.players) {
        const y = player.id === 1 ? 64 : 136; // Segue capture has an 8-pixel nametable scroll offset.
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(176, y, 48, 8);
        this.ctx.fillRect(152, y + 24, 16, 8);
        this.text(
          String(player.joined ? player.score : 0)
            .padStart(6, "0")
            .slice(-6),
          176,
          y,
        );
        this.text(
          String(player.joined ? player.rescued : 0)
            .padStart(2, "0")
            .slice(-2),
          152,
          y + 24,
        );
      }
    }
    draw(game) {
      const context = this.ctx;
      context.imageSmoothingEnabled = false;
      context.globalAlpha = 1;
      if (!this.readyFor(game)) return;
      const scene = this.sceneFor(game);
      if (scene) {
        this.drawScene(
          scene,
          game.cinematicKey ? game.cinematicFrame : game.phaseFrame,
        );
        if (game.phase === "stageclear") this.tally(game);
        return;
      }
      const background = this.backgroundFor(game);
      context.fillStyle = "#000";
      context.fillRect(0, 0, WIDTH, HEIGHT);
      if (background)
        context.drawImage(
          background.canvas,
          background.x - Math.round(game.cameraX),
          background.y - Math.round(game.cameraY),
        );
      // The final tank is background artwork moved by a horizontal split scroll.
      // Keep the last position during destruction. The crop follows the known
      // body extent; precise hardware split-scanline timing remains a comparison item.
      if (this.tankScrollLevel !== game.level) {
        this.tankScrollLevel = game.level;
        this.tankScrollX = 0;
        this.tankScrollNext = 0;
        this.tankScrollFrame = -1;
      }
      const tank = (game.enemies || []).find(
        (actor) => actor.sourceType === 0x4b && actor.alive !== false,
      );
      if (
        game.boss &&
        game.boss.phase === "flame-tank" &&
        tank &&
        this.tankScrollFrame !== game.frame
      ) {
        this.tankScrollX = this.tankScrollNext;
        this.tankScrollNext = tank.x - 256;
        this.tankScrollFrame = game.frame;
      }
      if (
        game.boss &&
        ["flame-tank", "tank-exploding"].includes(game.boss.phase)
      ) {
        const viewX = game.cameraX - this.tankScrollX,
          shifted = this.backgroundFor(game, viewX, "tank");
        const split = Math.max(0, Math.min(HEIGHT, 328 - game.cameraY));
        context.save();
        context.beginPath();
        context.rect(0, 0, WIDTH, split);
        context.clip();
        context.drawImage(
          shifted.canvas,
          shifted.x - Math.round(viewX),
          shifted.y - Math.round(game.cameraY),
        );
        context.restore();
      }
      for (const actor of game.enemies || []) this.backgroundActor(actor, game);
      const list = [];
      for (const name of [
        "huts",
        "prisoners",
        "helipads",
        "helicopters",
        "pickups",
        "enemies",
        "effects",
      ])
        for (const actor of game[name] || []) list.push(actor);
      for (const player of game.players || [])
        if (player.joined && player.connected && player.alive !== false) {
          const protection =
            player.invulnerableFrames || player.invulnerable || 0;
          if (!protection || (game.frame || 0) & 2) list.push(player);
        }
      for (const projectile of game.bullets || []) list.push(projectile);
      for (const projectile of game.weapons || []) {
        if (projectile.kind === "blast") {
          const extent =
            projectile.extent === undefined
              ? 2 + projectile.age * 2
              : projectile.extent;
          for (const [dx, dy] of projectile.power === 3
            ? [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ]
            : [
                [1, 0],
                [-1, 0],
              ])
            list.push(
              Object.assign({}, projectile, {
                x: projectile.x + dx * extent,
                y: projectile.y + dy * extent,
              }),
            );
        } else list.push(projectile);
      }
      for (const actor of list) this.actor(actor, game);
      this.hud(game);
    }
    dispose() {
      this.art.dispose();
      if (this.backgroundCaches) this.backgroundCaches.clear();
      this.background = null;
      this.level = null;
    }
  }
  root.JackalRenderer = JackalRenderer;
  if (typeof module !== "undefined" && module.exports)
    module.exports = { JackalRenderer, JackalArtwork };
})(typeof window !== "undefined" ? window : globalThis);
