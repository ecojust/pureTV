/* Independently written Jackal game systems. Original-data provenance: docs/reference.md.
 * Fixed NTSC tick; coordinates are native pixels in a 512px-wide original stage.
 * This is ordinary game logic, with no ROM loader, emulated CPU, or instruction dispatcher.
 */
(function (root) {
  "use strict";
  const common = typeof module !== "undefined" && module.exports;
  const DATA = common ? require("./levels.js") : root.JackalLevels;
  const enemyModule = common ? require("./enemies.js") : root.JackalEnemies;
  const FPS = 60.0988,
    TICK = 1 / FPS,
    TILE = 8,
    WORLD_WIDTH = 512,
    VIEW_WIDTH = 256,
    VIEW_HEIGHT = 240,
    STAGES = 6;
  const DIR8 = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ];
  const JEEP_FRAMES = [1, 3, 5, 3, 1, 3, 5, 3],
    JEEP_FLIPS = [0, 0, 0, 128, 128, 192, 64, 64];
  const HUT_TYPES = new Set([0x13, 0x14, 0x15, 0x19, 0x1c, 0x1d]);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const numeric = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);
  const overlap = (a, b, rx = 0, ry = rx) =>
    Math.abs(a.x - b.x) < (b.halfWidth || 0) + rx &&
    Math.abs(a.y - b.y) < (b.halfHeight || 0) + ry;
  const direction = (x, y) =>
    ((Math.round(Math.atan2(x, -y) / (Math.PI / 4)) % 8) + 8) % 8;
  function random(seed) {
    let n = seed >>> 0;
    return () => {
      n += 0x6d2b79f5;
      let t = n;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function player(id) {
    return {
      id,
      x: 0,
      y: 0,
      dir: 0,
      targetDir: 0,
      frameId: 1,
      frame: 1,
      palette: id - 1,
      flipX: false,
      flipY: false,
      alive: false,
      connected: false,
      joined: false,
      lives: 0,
      score: 0,
      nextLife: 20000,
      passengers: 0,
      rescued: 0,
      totalRescued: 0,
      weaponLevel: 0,
      invulnerable: 0,
      deathTimer: 0,
      unloadTimer: 16,
      moving: false,
      halfWidth: 8,
      halfHeight: 8,
      state: "inactive",
      lastA: false,
      lastB: false,
      lastStart: false,
      lastSelect: false,
    };
  }
  class JackalGame {
    constructor(seed = 1988) {
      if (!DATA || !enemyModule)
        throw new Error(
          "Jackal stage data and enemy systems must load before the model",
        );
      this.rng = random(seed);
      this.frame = 0;
      this.time = 0;
      this.accumulator = 0;
      this.stage = 1;
      this.loop = 0;
      this.phase = "title";
      this.phaseFrame = 0;
      this.previousPhase = "playing";
      this.manualPause = false;
      this.selectedPlayers = 1;
      this.continueChoice = 0;
      this.continuesUsed = 0;
      this.players = [player(1), player(2)];
      this.events = [];
      this.effects = [];
      this.nextEntity = 0;
      this.rescued = 0;
      this.transition = 0;
      this.lastInput = [];
      this.worldWidth = WORLD_WIDTH;
      this.worldHeight = 3120;
      this.loadStage(1);
      this.phase = "title";
      this.phaseFrame = 0;
    }
    get enemies() {
      return this.enemySystem.actors;
    }
    get bullets() {
      return this.playerBullets.concat(this.enemySystem.projectiles || []);
    }
    get grenades() {
      return this.weapons.filter(
        (w) => w.kind === "grenade" || w.kind === "rocket",
      );
    }
    get boss() {
      return this.enemySystem.boss;
    }
    get difficulty() {
      return Math.min(
        3,
        (this.loop ? 3 : 0) +
          this.players.reduce((n, p) => n + (p.joined ? p.weaponLevel : 0), 0),
      );
    }
    setPhase(phase) {
      this.phase = phase;
      this.phaseFrame = 0;
      if (phase === "gameover") this.cinematicFrame = 0;
      this.events.push("phase:" + phase);
    }
    makeEnemySystem() {
      const System = enemyModule.EnemySystem || enemyModule;
      return new System({
        stage: this.stage,
        specs: DATA.specs,
        random: this.rng,
      });
    }
    loadStage(stage) {
      this.stage = clamp(stage, 1, 6);
      const original = DATA.stages[this.stage - 1];
      this.tiles = original.tiles.slice();
      this.palettes = original.palettes.slice();
      this.collision = original.collision.slice();
      this.level = {
        ...original,
        tiles: this.tiles,
        palettes: this.palettes,
        collision: this.collision,
      };
      this.worldHeight = this.level.height_tiles * TILE;
      this.map = Array.from({ length: this.level.height_tiles }, (_, row) =>
        this.collision.slice(row * 64, row * 64 + 64),
      );
      this.cameraX = this.level.start_camera_x;
      this.cameraY = this.worldHeight - VIEW_HEIGHT;
      this.scrollDistance = 240;
      this.eventIndex = 0;
      this.commandIndex = 0;
      this.commandLog = [];
      this.terrainChanges = [];
      this.backgroundPatches = [];
      this.backgroundOperations = [];
      this.backtrack = 0;
      this.forcedScroll = false;
      this.paletteStage = 0;
      this.spawnEvents = this.level.events
        .map((event, index) => ({ ...event, index }))
        .sort((a, b) => a.distance - b.distance || a.index - b.index);
      this.spawnCommands = (this.level.commands || [])
        .map((event, index) => ({ ...event, index }))
        .sort((a, b) => a.distance - b.distance || a.index - b.index);
      this.enemySystem = this.makeEnemySystem();
      this.playerBullets = [];
      this.weapons = [];
      this.huts = [];
      this.prisoners = [];
      this.helipads = [];
      this.helicopters = [];
      this.pickups = [];
      this.effects = [];
      this.transition = 0;
      this.bossActive = false;
      this.stageComplete = false;
      this.tallyAwarded = 0;
      this.stageClearEnd = 569;
      for (const p of this.players) {
        p.x = this.cameraX + (p.id === 1 ? 80 : 176);
        p.y = this.cameraY + 128;
        p.dir = p.targetDir = 0;
        p.alive = p.joined && p.lives > 0;
        p.state = p.alive ? "active" : "inactive";
        p.invulnerable = 160;
        p.deathTimer = 0;
        p.unloadTimer = 16;
        p.moving = false;
        this.updatePlayerArt(p);
      }
      this.processSpawns();
    }
    start(inputs = [], options = {}) {
      this.selectedPlayers = options.players || this.selectedPlayers;
      this.players = [player(1), player(2)];
      this.continuesUsed = 0;
      this.continueChoice = 0;
      this.loop = 0;
      this.rescued = 0;
      this.manualPause = false;
      this.accumulator = 0;
      for (const p of this.players) {
        p.joined = p.id <= this.selectedPlayers;
        p.lives = p.joined ? 5 : 0;
        p.connected = !!inputs.find((i) => i.id === p.id && i.connected);
      }
      this.loadStage(options.stage || 1);
      this.setPhase(options.skipIntro ? "playing" : "intro");
      this.cinematicKey = options.skipIntro
        ? null
        : "intro_" + this.selectedPlayers + "p";
      this.cinematicFrame = 0;
      this.cinematicLength = this.selectedPlayers === 1 ? 632 : 648;
      this.lastInput = inputs;
    }
    togglePause() {
      if (this.phase === "playing") {
        this.previousPhase = this.phase;
        this.manualPause = true;
        this.setPhase("paused");
      } else if (this.phase === "paused" && this.manualPause) {
        this.manualPause = false;
        this.setPhase(this.previousPhase);
      }
    }
    resumeIfConnected() {
      if (
        this.phase === "paused" &&
        !this.manualPause &&
        this.players.some((p) => p.joined && p.connected && p.lives > 0)
      )
        this.setPhase(this.previousPhase);
    }
    normalizedInputs(inputs) {
      return [1, 2].map((id) => {
        const p =
          (Array.isArray(inputs) ? inputs : []).find(
            (i) => i && Number(i.id) === id,
          ) || {};
        return {
          id,
          connected: !!p.connected,
          x: clamp(numeric(p.x), -1, 1),
          y: clamp(numeric(p.y), -1, 1),
          a: !!p.a,
          b: !!p.b,
          start: !!p.start,
          select: !!p.select,
        };
      });
    }
    step(dt, inputs = []) {
      this.events = [];
      this.lastInput = this.normalizedInputs(inputs);
      this.accumulator += clamp(numeric(dt), 0, 0.1);
      while (this.accumulator + 1e-10 >= TICK) {
        this.accumulator -= TICK;
        this.tick(this.lastInput);
      }
    }
    tick(inputs = this.lastInput) {
      const controls = this.normalizedInputs(inputs);
      const pulses = controls.map((i) => {
        const p = this.players[i.id - 1];
        return {
          ...i,
          aPressed: i.connected && i.a && !p.lastA,
          bPressed: i.connected && i.b && !p.lastB,
          startPressed: i.connected && i.start && !p.lastStart,
          selectPressed: i.connected && i.select && !p.lastSelect,
        };
      });
      for (const i of controls) {
        const p = this.players[i.id - 1];
        p.connected = i.connected;
        p.lastA = i.connected && i.a;
        p.lastB = i.connected && i.b;
        p.lastStart = i.connected && i.start;
        p.lastSelect = i.connected && i.select;
      }
      const startPressed = pulses.some((i) => i.startPressed),
        selectPressed = pulses.some((i) => i.selectPressed);
      if (this.phase === "title" || this.phase === "attract") {
        if (selectPressed) {
          this.selectedPlayers = this.selectedPlayers === 1 ? 2 : 1;
          this.events.push("select");
        }
        if (startPressed) {
          this.start(controls);
          return;
        }
        this.frame++;
        this.phaseFrame++;
        this.time = this.frame / FPS;
        if (this.phase === "title" && this.phaseFrame >= 385)
          this.setPhase("attract");
        else if (this.phase === "attract" && this.phaseFrame >= 1143)
          this.setPhase("title");
        return;
      }
      if (this.phase === "continue") {
        if (selectPressed) this.continueChoice ^= 1;
        if (startPressed) {
          if (this.continueChoice || this.continuesUsed >= 3) {
            this.setPhase("title");
          } else {
            this.continuesUsed++;
            for (const p of this.players) {
              p.lives = p.joined ? 5 : 0;
              p.weaponLevel = 0;
              p.passengers = 0;
              p.rescued = 0;
            }
            this.loadStage(this.stage);
            this.setPhase("deployment");
            this.cinematicKey =
              "continue_load_" + String(this.stage).padStart(2, "0");
            this.cinematicFrame = 0;
            this.cinematicLength = 161;
          }
        }
        return;
      }
      if (this.phase === "playing" && startPressed) {
        this.togglePause();
        return;
      }
      if (this.phase === "paused") {
        if (startPressed && this.manualPause) this.togglePause();
        else this.resumeIfConnected();
        return;
      }
      if (
        this.phase === "playing" &&
        this.players.filter((p) => p.joined).every((p) => p.lives <= 0)
      ) {
        this.continueChoice = 0;
        this.cinematicKey = this.continuesUsed < 3 ? null : "game_over";
        this.setPhase(this.continuesUsed < 3 ? "continue" : "gameover");
        return;
      }
      if (
        this.phase === "playing" &&
        !this.players.some((p) => p.joined && p.connected && p.lives > 0)
      ) {
        this.previousPhase = "playing";
        this.manualPause = false;
        this.setPhase("paused");
        return;
      }
      this.frame++;
      this.phaseFrame++;
      this.time = this.frame / FPS;
      if (this.phase === "gameover") {
        this.cinematicFrame = this.phaseFrame;
        if (this.phaseFrame >= 450) {
          this.cinematicKey = null;
          this.setPhase("title");
        }
        return;
      }
      if (this.phase === "intro" || this.phase === "deployment") {
        this.cinematicFrame++;
        if (this.cinematicFrame >= this.cinematicLength) {
          this.cinematicKey = null;
          this.setPhase("playing");
        } else if (this.phase === "intro" && this.cinematicFrame >= 83)
          this.setPhase("deployment");
        return;
      }
      if (this.phase === "stageclear") {
        this.tickStageClear();
        return;
      }
      if (this.phase === "ending") {
        if (this.endingRestart) {
          if (this.phaseFrame >= 84) {
            this.loop++;
            this.continuesUsed = 3;
            this.players.forEach((p) => {
              p.lives = p.joined ? 5 : 0;
              p.score = 0;
              p.nextLife = 20000;
              p.weaponLevel = 0;
              p.passengers = p.rescued = 0;
            });
            this.loadStage(1);
            this.cinematicKey = null;
            this.setPhase("playing");
          }
        } else if (this.phaseFrame >= 5162 && controls[0].start) {
          this.endingRestart = true;
          this.setPhase("ending");
          this.cinematicKey = "ending_restart";
          this.cinematicFrame = 0;
        }
        if (this.endingRestart) this.cinematicFrame = this.phaseFrame;
        return;
      }
      if (this.phase !== "playing") return;
      if (!this.boss?.freezePlayers)
        for (const p of this.players) {
          if (!p.joined) continue;
          const i = pulses[p.id - 1];
          this.tickPlayer(p, i);
        }
      this.updateCamera();
      this.processSpawns();
      this.enemySystem.externalActorCount = this.externalActorCount();
      this.enemySystem.tick(this.enemyContext());
      this.tickProjectiles();
      this.tickRescue();
      this.tickEffects();
      if (this.players.filter((p) => p.joined).every((p) => p.lives <= 0)) {
        this.continueChoice = 0;
        this.cinematicKey = this.continuesUsed < 3 ? null : "game_over";
        this.setPhase(this.continuesUsed < 3 ? "continue" : "gameover");
      }
    }
    enemyContext() {
      return {
        players: this.players.filter((p) => p.joined && p.connected),
        cameraX: this.cameraX,
        cameraY: this.cameraY,
        width: WORLD_WIDTH,
        height: this.worldHeight,
        frame: this.frame,
        difficulty: this.difficulty,
        stage: this.stage,
        random: this.rng,
        terrainBlocked: (x, y, r = 4) => this.blocked(x, y, r),
        terrainClass: (x, y) => this.tileClass(x, y),
        damagePlayer: (p) => this.hitPlayer(p),
        addScore: (owner, score) => this.awardScore(owner, score),
        onEffect: (x, y, kind, extra = {}) =>
          this.enemyEffect(x, y, kind, extra),
        onBossStart: () => {
          this.bossActive = true;
          this.events.push("boss");
        },
        onBossDefeated: () => this.bossDone(),
        spawnEntity: (event) => this.spawnEvent(event),
        applyBackgroundPatch: (type, x, y) =>
          this.applyBackgroundPatch(type, x, y),
      };
    }
    externalActorCount() {
      return (
        this.huts.filter((h) => h.alive).length +
        this.prisoners.filter((p) => p.alive).length +
        this.helicopters.filter((h) => h.alive).length +
        this.pickups.filter((p) => p.alive).length +
        this.effects.filter((e) => e.kind === "pow-unload").length +
        this.helipads.filter((p) => p.alive).length
      );
    }
    actorRoom(priority = false) {
      const count =
        this.enemies.filter((e) => e.alive !== false).length +
        (this.enemySystem.projectiles || []).filter((e) => e.alive !== false)
          .length +
        this.externalActorCount();
      if (count < 16) return true;
      if (priority && this.enemySystem.evictForPriority)
        return this.enemySystem.evictForPriority();
      return false;
    }
    processSpawns() {
      this.scrollDistance = this.worldHeight - this.cameraY;
      while (
        this.eventIndex < this.spawnEvents.length &&
        this.spawnEvents[this.eventIndex].distance <= this.scrollDistance
      ) {
        const event = this.spawnEvents[this.eventIndex++];
        if (event.odd_difficulty_only && this.difficulty !== 3) continue;
        this.spawnEvent({
          ...event,
          y: this.worldHeight - event.distance + (event.from_bottom ? 239 : 0),
        });
      }
      while (
        this.commandIndex < this.spawnCommands.length &&
        this.spawnCommands[this.commandIndex].distance <= this.scrollDistance
      ) {
        const command = this.spawnCommands[this.commandIndex++];
        this.commandLog.push({ ...command, frame: this.frame });
        if (command.command === "forced_scroll") this.forcedScroll = true;
        else if (command.command === "palette_change") this.paletteStage++;
        this.events.push("map-command");
      }
    }
    spawnEvent(event) {
      const sourceType =
          Number(event.source_type ?? event.sourceType ?? 0) & 127,
        x = numeric(event.x),
        y = Number.isFinite(event.y) ? event.y : this.cameraY;
      if (sourceType === 0x49) {
        this.commandLog.push({
          command: "headquarters_gate",
          distance: event.distance ?? this.worldHeight - y,
          frame: this.frame,
        });
      }
      const common = {
        id: "world-" + ++this.nextEntity,
        sourceType,
        source_type: sourceType,
        x,
        y,
        alive: true,
        frameId: 0,
        frame: 0,
        palette: 0,
        flipX: false,
        flipY: false,
        halfWidth: 0,
        halfHeight: 0,
      };
      if (HUT_TYPES.has(sourceType)) {
        if (!this.actorRoom(!!event.priority_spawn)) return null;
        const h = {
          ...common,
          kind: sourceType === 0x19 ? "garage" : "hut",
          halfWidth: 25,
          halfHeight: 25,
          hp: 1,
          open: false,
          state: "closed",
          timer: 0,
          left: sourceType === 0x14 || sourceType === 0x1d,
          score: this.coopScore(
            sourceType === 0x15 ? 300 : sourceType === 0x19 ? 500 : 800,
          ),
          remaining:
            sourceType === 0x15
              ? 1
              : sourceType === 0x1c || sourceType === 0x1d
                ? 4
                : 2,
          special: sourceType === 0x15,
          rawSourceType: event.raw_source_type,
        };
        this.huts.push(h);
        return h;
      }
      if (sourceType === 0x16)
        return this.spawnPrisoner(x, y, {
          special: !!event.special,
          dir: event.dir || 0,
          state: event.state || "wander",
        });
      if (sourceType === 0x3d || sourceType === 0x3e) {
        if (!this.actorRoom(!!event.priority_spawn)) return null;
        const h = {
          ...common,
          kind: "rescue-helicopter",
          frameId: 47,
          frame: 47,
          state: "waiting",
          timer: 128,
          grace: 256,
          rotor: 0,
          dir: sourceType === 0x3d ? 1 : -1,
        };
        this.helicopters.push(h);
        return h;
      }
      if (sourceType === 0x3f) {
        const h = {
          ...common,
          kind: "rescue-zone",
          halfWidth: 16,
          halfHeight: 16,
          age: 0,
          spawned: 0,
        };
        this.helipads.push(h);
        return h;
      }
      if (sourceType >= 0x50 && sourceType <= 0x52) {
        if (!this.actorRoom(true)) return null;
        const p = {
          ...common,
          kind: "pickup",
          frameId: 46,
          frame: 46,
          halfWidth: 10,
          halfHeight: 10,
          timer: 512,
        };
        this.pickups.push(p);
        return p;
      }
      this.enemySystem.externalActorCount = this.externalActorCount();
      return this.enemySystem.spawn({
        ...event,
        source_type: sourceType,
        x,
        y,
        coop: this.players.every((p) => p.joined && p.lives > 0),
      });
    }
    tileClass(x, y) {
      const col = Math.floor(x / TILE),
        row = Math.floor(y / TILE);
      if (col < 0 || col >= 64 || row < 0 || row >= this.level.height_tiles)
        return 1;
      return this.collision[row * 64 + col];
    }
    blocked(x, y, r = 8) {
      if (
        x - r < 0 ||
        x + r >= WORLD_WIDTH ||
        y - r < 0 ||
        y + r >= this.worldHeight
      )
        return true;
      for (const [dx, dy] of [
        [-r, -r],
        [r, -r],
        [-r, r],
        [r, r],
        [0, -r],
        [0, r],
        [-r, 0],
        [r, 0],
      ]) {
        const tile = this.tileClass(x + dx, y + dy);
        if (tile !== 0 && !(this.stage === 4 && tile === 3)) return true;
      }
      return false;
    }
    findFree(x, y, r = 8) {
      const left = this.cameraX + 16,
        right = this.cameraX + 240,
        top = this.cameraY + 16,
        bottom = this.cameraY + 224;
      x = clamp(x, left, right);
      y = clamp(y, top, bottom);
      if (!this.blocked(x, y, r)) return { x, y };
      for (let radius = 8; radius <= 240; radius += 8)
        for (const [dx, dy] of DIR8) {
          const nx = clamp(x + dx * radius, left, right),
            ny = clamp(y + dy * radius, top, bottom);
          if (!this.blocked(nx, ny, r)) return { x: nx, y: ny };
        }
      for (let row = top; row <= bottom; row += 8)
        for (let col = left; col <= right; col += 8)
          if (!this.blocked(col, row, r)) return { x: col, y: row };
      return null;
    }
    tickPlayer(p, input) {
      p.moving = false;
      if (!p.connected) return;
      if (!p.alive) {
        if (p.lives > 0 && --p.deathTimer <= 0) {
          p.lives--;
          if (p.lives > 0) this.respawn(p);
        } else if (
          p.lives === 0 &&
          input.a &&
          input.b &&
          !input.x &&
          !input.y
        ) {
          const donor = this.players.find(
            (v) => v !== p && v.alive && v.lives > 1,
          );
          if (donor) {
            donor.lives--;
            p.lives = 1;
            p.x = donor.x;
            p.y = donor.y;
            this.respawn(p);
          }
        }
        return;
      }
      if (p.invulnerable > 0) p.invulnerable--;
      const dx = Math.abs(input.x) > 0.22 ? Math.sign(input.x) : 0,
        dy = Math.abs(input.y) > 0.22 ? Math.sign(input.y) : 0;
      if (dx || dy) {
        p.targetDir = direction(dx, dy);
        if ((this.frame & 3) === 0 && p.dir !== p.targetDir) {
          const distance = (p.targetDir - p.dir + 8) % 8;
          p.dir = (p.dir + (distance <= 4 ? 1 : 7)) % 8;
        }
        const swamp = this.stage === 4 && this.tileClass(p.x, p.y) === 3,
          speed = swamp ? 0.5 : 1,
          oldX = p.x,
          oldY = p.y;
        const escalator = this.enemies.some(
          (a) =>
            a.sourceType === 68 &&
            a.alive &&
            Math.abs(a.x - p.x) < 12 &&
            Math.abs(a.y - p.y) < (this.scrollDistance >= 2400 ? 89 : 65),
        );
        const look = [
          [-4, -8, 4, -8],
          [0, -6, 6, 0],
          [8, -4, 8, 4],
          [6, 0, 0, 6],
          [-4, 8, 4, 8],
          [-6, 0, 0, 6],
          [-8, -4, -8, 4],
          [-6, 0, 0, -6],
        ][p.targetDir];
        const pass = (x, y) => {
          const tile = this.tileClass(x, y);
          return tile === 0 || (this.stage === 4 && tile === 3);
        };
        const canMove =
          pass(p.x + look[0], p.y + look[1]) &&
          pass(p.x + look[2], p.y + look[3]);
        if (canMove)
          p.x = clamp(p.x + dx * speed, this.cameraX + 16, this.cameraX + 240);
        if (canMove || escalator)
          p.y = clamp(
            p.y +
              (escalator
                ? dy === 1
                  ? 1
                  : dy === -1
                    ? -0.5
                    : 0.5
                : dy * speed),
            this.cameraY + 48,
            this.cameraY + 224,
          );
        p.moving = oldX !== p.x || oldY !== p.y;
      } else {
        p.targetDir = p.dir;
        const escalator = this.enemies.some(
          (a) =>
            a.sourceType === 68 &&
            a.alive &&
            Math.abs(a.x - p.x) < 12 &&
            Math.abs(a.y - p.y) < (this.scrollDistance >= 2400 ? 89 : 65),
        );
        if (escalator && (this.frame & 1) === 0)
          p.y = clamp(p.y + 1, this.cameraY + 48, this.cameraY + 224);
      }

      if (input.bPressed || (input.b && (this.frame & 31) === 0)) this.fire(p);
      if (input.aPressed) this.throwGrenade(p);
      this.updatePlayerArt(p);
    }
    updatePlayerArt(p) {
      p.frameId = JEEP_FRAMES[p.dir];
      p.frame = p.frameId;
      const attr = JEEP_FLIPS[p.dir];
      p.flipX = !!(attr & 64);
      p.flipY = !!(attr & 128);
      p.palette = p.invulnerable > 0 ? this.frame % 4 : p.id - 1;
    }
    updateCamera() {
      const players = this.players.filter(
        (p) => p.joined && p.connected && p.alive,
      );
      if (!players.length) return;
      if (this.forcedScroll && !this.bossActive) {
        if (this.cameraY > 0) {
          this.cameraY--;
          for (const p of players) if (p.y - this.cameraY >= 208) p.y--;
        }
        return;
      }
      if (players.length === 1) {
        const p = players[0],
          sx = p.x - this.cameraX,
          sy = p.y - this.cameraY;
        if (sx < 64 && this.cameraX > 0) this.cameraX--;
        else if (sx > 191 && this.cameraX < 255) this.cameraX++;
        if (!this.bossActive) {
          if (sy < 96 && this.cameraY > 0) {
            this.cameraY--;
            this.backtrack = Math.min(64, this.backtrack + 1);
          } else if (sy > 191 && this.backtrack > 0) {
            this.cameraY++;
            this.backtrack--;
          }
        }
      } else {
        const minX = Math.min(...players.map((p) => p.x - this.cameraX)),
          maxX = Math.max(...players.map((p) => p.x - this.cameraX)),
          minY = Math.min(...players.map((p) => p.y - this.cameraY)),
          maxY = Math.max(...players.map((p) => p.y - this.cameraY));
        if (minX < 64 && maxX < 192 && this.cameraX > 0) this.cameraX--;
        else if (maxX >= 193 && minX >= 65 && this.cameraX < 255)
          this.cameraX++;
        if (!this.bossActive) {
          if (minY < 96 && maxY < 176 && this.cameraY > 0) {
            this.cameraY--;
            this.backtrack = Math.min(64, this.backtrack + 1);
          } else if (maxY >= 177 && minY >= 97 && this.backtrack > 0) {
            this.cameraY++;
            this.backtrack--;
          }
        }
      }
      for (const p of players) {
        p.x = clamp(p.x, this.cameraX + 16, this.cameraX + 240);
        p.y = clamp(p.y, this.cameraY + 48, this.cameraY + 224);
      }
    }

    fire(p) {
      if (
        !p.alive ||
        this.playerBullets.filter((b) => b.owner === p.id && b.kind === "gun")
          .length >= 3
      )
        return false;
      this.playerBullets.push({
        id: "shot-" + ++this.nextEntity,
        kind: "gun",
        x: p.x,
        y: p.y,
        vx: 0,
        vy: -6,
        team: "player",
        owner: p.id,
        life: 16,
        state: "flying",
        damage: 1,
        frameId: 16,
        palette: 1,
      });
      this.events.push("gun");
      return true;
    }
    throwGrenade(p) {
      if (
        !p.alive ||
        this.weapons.some((w) => w.owner === p.id && w.kind !== "blast")
      )
        return false;
      const [dx, dy] = DIR8[p.targetDir];
      const diagonal = dx && dy;
      const upgraded = p.weaponLevel > 0,
        speed = upgraded ? (diagonal ? 2.75 : 4) : diagonal ? 1.5 : 2,
        life = upgraded
          ? this.stage === 6 && this.bossActive
            ? 32
            : 22
          : this.stage === 6 && this.bossActive
            ? 50
            : 40;
      this.weapons.push({
        id: "weapon-" + ++this.nextEntity,
        kind: upgraded ? "rocket" : "grenade",
        x: p.x,
        y: p.y,
        vx: dx * speed,
        vy: dy * speed,
        team: "player",
        owner: p.id,
        life,
        maxLife: life,
        power: p.weaponLevel,
        damage: 5,
        frameId: upgraded ? [13, 14, 15, 14, 13, 14, 15, 14][p.targetDir] : 7,
        palette: upgraded ? 1 : 0,
        flipX: !!(JEEP_FLIPS[p.targetDir] & 64),
        flipY: !!(JEEP_FLIPS[p.targetDir] & 128),
        dir: p.targetDir,
      });
      this.events.push(upgraded ? "rocket" : "grenade");
      return true;
    }
    hitHut(x, y, r, owner, kind) {
      for (const hut of this.huts) {
        if (!hut.open && hut.alive && overlap({ x, y }, hut, r)) {
          if (kind === "gun") continue;
          this.openHut(hut, owner);
          return true;
        }
      }
      return false;
    }
    openHut(hut, owner = 1) {
      if (hut.open) return;
      hut.open = true;
      hut.state = "explosion";
      hut.timer = 24;
      hut.frameId = 25;
      this.awardScore(
        owner,
        hut.score ?? (hut.special ? 300 : hut.kind === "garage" ? 500 : 800),
      );
      this.events.push("barracks");
      this.applyBackgroundPatch(hut.sourceType, hut.x, hut.y);
    }
    applyBackgroundPatch(sourceType, x, y) {
      const patch = DATA.destruction.find(
        (p) => p.stage === this.stage && p.source_type === sourceType,
      );
      if (!patch) return false;
      const tx = Math.floor((x + patch.offset_x) / 8),
        ty = Math.floor((y + patch.offset_y) / 8);
      for (let row = 0; row < patch.height; row++)
        for (let col = 0; col < patch.width; col++) {
          const px = tx + col,
            py = ty + row;
          if (px < 0 || px >= 64 || py < 0 || py >= this.level.height_tiles)
            continue;
          const index = py * 64 + px;
          this.tiles[index] = patch.tiles[row * patch.width + col];
          this.collision[index] = patch.collision;
          this.map[py][px] = patch.collision;
        }
      const update = { sourceType, x, y, patch };
      this.terrainChanges.push(update);
      this.backgroundPatches.push(update);
      return true;
    }

    explode(weapon, directHit = false) {
      this.events.push("explosion");
      if (!directHit) {
        this.enemySystem.damageAt(
          weapon.x,
          weapon.y,
          4,
          5,
          weapon.kind,
          weapon.owner,
        );
        this.hitHut(weapon.x, weapon.y, 4, weapon.owner, weapon.kind);
      }
      this.weapons.push({
        ...weapon,
        kind: "weapon-explosion",
        life: 24,
        maxLife: 24,
        frameId: 25,
        palette: 3,
        vx: 0,
        vy: 0,
      });
      if (weapon.power >= 2) {
        this.weapons.push({
          id: "blast-" + ++this.nextEntity,
          kind: "blast",
          x: weapon.x,
          y: weapon.y,
          owner: weapon.owner,
          power: weapon.power,
          life: 40,
          maxLife: 40,
          age: 0,
          frameId: 9,
          palette: 3,
        });
      }
    }
    tickProjectiles() {
      for (let n = this.playerBullets.length - 1; n >= 0; n--) {
        const b = this.playerBullets[n];
        if (b.state === "ground") {
          if (--b.life <= 0) this.playerBullets.splice(n, 1);
          continue;
        }
        const tile = this.tileClass(b.x, b.y),
          terrain =
            (tile === 1 || tile === 3) &&
            !(this.stage === 4 && tile === 3) &&
            !(this.stage === 6 && this.scrollDistance >= 3120);
        if (terrain || --b.life <= 0) {
          b.state = "ground";
          b.life = 5;
          b.frameId = 17;
          b.vx = b.vy = 0;
          continue;
        }
        b.x += b.vx;
        b.y += b.vy;
        const hit = this.enemySystem.damageAt(b.x, b.y, 0, 1, "gun", b.owner);
        if (
          hit ||
          b.x < this.cameraX ||
          b.x >= this.cameraX + 250 ||
          b.y < this.cameraY ||
          b.y >= this.cameraY + 250
        )
          this.playerBullets.splice(n, 1);
      }

      for (let n = this.weapons.length - 1; n >= 0; n--) {
        const w = this.weapons[n];
        if (!w) continue;
        if (w.kind === "weapon-explosion") {
          w.life--;
          w.frameId = 25 + Math.floor((24 - w.life) / 8);
          this.enemySystem.damageAt(w.x, w.y, 4, 5, "blast", w.owner);
          this.hitHut(w.x, w.y, 4, w.owner, "blast");
          if (w.life <= 0) this.weapons.splice(n, 1);
          continue;
        }
        if (w.kind === "blast") {
          w.age++;
          w.life--;
          w.frameId = w.life >= 24 ? 9 : w.life >= 8 ? 10 : 11;
          const extent = (w.extent = 2 + w.age * 2);
          for (const [dx, dy] of w.power === 3
            ? [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ]
            : [
                [1, 0],
                [-1, 0],
              ]) {
            const x = w.x + dx * extent,
              y = w.y + dy * extent;
            this.enemySystem.damageAt(x, y, 10, 5, "blast", w.owner);
            this.hitHut(x, y, 10, w.owner, "blast");
          }
          if (w.life <= 0) this.weapons.splice(n, 1);
          continue;
        }
        w.life--;
        w.x += w.vx;
        w.y += w.vy;
        const edge =
          w.x < this.cameraX + 16 ||
          w.x > this.cameraX + 240 ||
          w.y < this.cameraY + 16 ||
          w.y > this.cameraY + 232;
        const enemyHit = this.enemySystem.damageAt(
          w.x,
          w.y,
          4,
          5,
          w.kind,
          w.owner,
        );
        const impact =
          (enemyHit && this.enemySystem.lastImpactStops) ||
          this.hitHut(w.x, w.y, 4, w.owner, w.kind);
        const tile = this.tileClass(w.x, w.y);
        const terrain =
          w.kind === "rocket" &&
          (tile === 1 || tile === 3) &&
          !(tile === 3 && (this.stage === 4 || this.stage === 6)) &&
          !(this.bossActive && (this.stage === 5 || this.stage === 6));
        if (w.kind === "grenade") {
          w.frameId = w.life < 26 && w.life >= 14 ? 8 : 7;
          const flip = [0, 128, 64, 192][(this.frame >> 2) & 3];
          w.flipX = !!(flip & 64);
          w.flipY = !!(flip & 128);
        }
        if (w.life <= 0 || edge || impact || terrain) {
          this.weapons.splice(n, 1);
          this.explode(w, impact);
        }
      }
    }
    hitPlayer(p) {
      if (!p || !p.alive || p.invulnerable > 0 || this.boss?.freezePlayers)
        return;
      p.alive = false;
      p.state = "exploding";
      p.deathTimer = 114;
      p.weaponLevel = 0;
      this.effect(p.x, p.y, "jeep-explosion", { life: 18 });
      this.events.push("jeep-explosion");
      const escaped = Math.min(4, Math.max(0, p.passengers - 1));
      p.passengers = 0;
      for (let n = 0; n < escaped; n++)
        this.spawnPrisoner(p.x, p.y, {
          state: "wander",
          dir: (this.frame + n * 8) % 32,
          special: ((this.frame + n * 8) & 31) === 0,
        });
    }
    respawn(p) {
      const spot = this.findFree(p.x, p.y);
      if (!spot) {
        p.deathTimer = 1;
        p.lives++;
        return false;
      }
      Object.assign(p, spot);
      p.alive = true;
      p.state = "active";
      p.dir = p.targetDir = 0;
      p.invulnerable = 160;
      p.unloadTimer = 16;
      this.updatePlayerArt(p);
      return true;
    }
    spawnPrisoner(x, y, options = {}) {
      if (!this.actorRoom(true)) return null;
      const p = {
        id: "pow-" + ++this.nextEntity,
        kind: "prisoner",
        sourceType: 0x16,
        x,
        y,
        alive: true,
        state: options.state || "emerging",
        predecessor: options.predecessor || null,
        special: !!options.special,
        dir: options.dir || 0,
        timer: options.special ? 28 : 72,
        frameId: 37,
        frame: 37,
        palette: 0,
        halfWidth: 16,
        halfHeight: 16,
      };
      this.prisoners.push(p);
      return p;
    }
    tickRescue() {
      for (const h of this.huts) {
        if (!h.alive) continue;
        if (h.open) {
          if (h.state === "explosion") {
            h.timer--;
            h.frameId = 25 + Math.floor((24 - h.timer) / 8);
            if (h.timer <= 0) {
              h.state = h.special || h.kind === "garage" ? "release" : "help";
              h.timer = h.state === "help" ? 64 : 0;
              h.frameId = 0;
            }
          } else if (h.state === "help") {
            h.timer--;
            h.frameId = h.timer & 8 ? 45 : 0;
            if (h.timer <= 0) {
              h.frameId = 0;
              h.state = "release";
              h.timer = 0;
            }
          } else if (h.state === "release" && --h.timer <= 0) {
            if (h.kind === "garage") {
              const spawned = this.spawnEvent({
                source_type: 0x23,
                x: h.x,
                y: h.y,
              });
              if (spawned) {
                h.remaining = 0;
                h.state = "ruins";
                h.alive = false;
              }
            } else {
              const previous = this.prisoners.find(
                (p) => p.id === h.lastPrisoner && p.alive,
              );
              if (previous && previous.state === "waiting") continue;
              const prisoner = this.spawnPrisoner(h.x, h.y, {
                special: h.special,
                dir: h.special ? 8 : h.left ? 16 : 0,
                predecessor: previous?.id,
                state: previous ? "waiting" : "emerging",
              });
              if (prisoner) {
                h.lastPrisoner = prisoner.id;
                h.remaining--;
                h.timer = 1;
                if (h.remaining <= 0) {
                  h.state = "ruins";
                  h.alive = false;
                }
              }
            }
          }
        }
      }

      for (const p of this.prisoners) {
        if (!p.alive) continue;
        if (p.state === "waiting") {
          if (!this.prisoners.some((v) => v.id === p.predecessor && v.alive)) {
            p.state = "emerging";
            p.timer = 72;
          }
        } else if (p.state === "emerging") {
          const angle = (p.dir * Math.PI) / 16;
          const speed = p.special ? 1 : 0.5;
          p.x += Math.cos(angle) * speed;
          p.y += Math.sin(angle) * speed;
          if (--p.timer <= 0) {
            p.state = p.special ? "wander" : "waving";
            p.timer = 96;
          }
        } else if (p.state === "wander") {
          const angle = (p.dir * Math.PI) / 16,
            nx = p.x + Math.cos(angle) * 0.5,
            ny = p.y + Math.sin(angle) * 0.5;
          if (!this.blocked(nx, ny, 2)) {
            p.x = nx;
            p.y = ny;
          } else p.dir = (p.dir + 4) % 32;
          if (--p.timer <= 0) {
            p.dir = (p.dir + (this.rng() < 0.5 ? 1 : 31)) % 32;
            p.timer = 32;
          }
        }
        p.frameId = ["waving", "waiting"].includes(p.state)
          ? 43 + (this.frame & 8 ? 1 : 0)
          : 37 + (this.frame & 8 ? 3 : 0);
        p.flipX = p.dir >= 12 && p.dir < 24;
        p.frame = p.frameId;
        p.palette = p.special ? (this.frame >> 1) % 4 : 0;
        const jeep =
          !["emerging", "waiting"].includes(p.state) &&
          this.players.find(
            (v) => v.joined && v.connected && v.alive && overlap(v, p, 0),
          );
        if (jeep) {
          jeep.passengers++;
          if (p.special) {
            jeep.weaponLevel = Math.min(3, jeep.weaponLevel + 1);
            this.events.push("upgrade");
          }
          p.alive = false;
          this.events.push("pow-pickup");
        }
      }
      for (const helicopter of this.helicopters) {
        if (!helicopter.alive) continue;
        helicopter.frameId =
          (helicopter.state === "leaving" ? 49 : 47) +
          (this.frame & (helicopter.state === "leaving" ? 2 : 4) ? 1 : 0);
        helicopter.frame = helicopter.frameId;
        if (helicopter.state === "waiting") {
          if (
            --helicopter.timer <= 0 &&
            !this.players.some((p) => p.passengers > 0)
          ) {
            helicopter.state = "grace";
            helicopter.timer = 256;
          }
        } else if (helicopter.state === "grace") {
          if (--helicopter.timer <= 0) {
            if (this.players.some((p) => p.passengers > 0)) {
              helicopter.state = "waiting";
              helicopter.timer = 0;
            } else {
              helicopter.state = "spinup";
              helicopter.timer = 64;
            }
          }
        } else if (helicopter.state === "spinup") {
          if (--helicopter.timer <= 0) helicopter.state = "leaving";
        } else if (helicopter.state === "leaving") {
          helicopter.y -= 2.25;
          if (helicopter.y < this.cameraY - 16) {
            helicopter.state = "overhead";
            helicopter.timer = 256;
            helicopter.visible = false;
          }
        } else if (helicopter.state === "overhead") {
          if (--helicopter.timer <= 0) {
            helicopter.x = this.cameraX + 64 + Math.floor(this.rng() * 128);
            helicopter.y = this.cameraY;
            helicopter.state = "returning";
            helicopter.flipY = true;
            helicopter.visible = true;
          }
        } else if (helicopter.state === "returning") {
          helicopter.y += 2.5;
          if (helicopter.y > this.cameraY + 304) helicopter.alive = false;
        }
      }
      for (const zone of this.helipads) {
        zone.age++;
        if (zone.age % 512 === 0 && zone.spawned < this.stage - 1) {
          const type = [0, 59, 0, 0, 59, 67][this.stage - 1];
          if (type) {
            zone.spawned++;
            this.spawnEvent({ source_type: type, x: zone.x, y: this.cameraY });
          }
        }
        if (zone.y > this.cameraY + 304) zone.alive = false;
      }
      for (const p of this.players) {
        if (!p.joined || !p.connected || !p.alive || !p.passengers) continue;
        const zone = this.helipads.find((z) => z.alive && overlap(p, z, 0));
        const helicopter =
          zone &&
          this.helicopters.find(
            (h) =>
              h.alive &&
              ["waiting", "grace"].includes(h.state) &&
              Math.abs(h.x - zone.x) < 128 &&
              Math.abs(h.y - zone.y) < 80,
          );
        if (zone && helicopter) {
          if (--p.unloadTimer <= 0 && this.actorRoom(true)) {
            p.passengers--;
            p.rescued++;
            p.totalRescued++;
            this.rescued++;
            p.unloadTimer = 32;
            this.effect(p.x, p.y, "pow-unload", {
              targetX: helicopter.x,
              targetY: p.y,
              vx: Math.sign(helicopter.x - p.x) * 0.5,
              life: 96,
              owner: p.id,
              lastPOW: p.passengers === 0,
              score: this.coopScore(500),
            });
            this.events.push("pow-unload");
            if ([4, 9, 15].includes(p.rescued) && p.weaponLevel < 3) {
              p.weaponLevel++;
              this.events.push("upgrade");
            }
          }
        }
      }
      for (const pickup of this.pickups) {
        if (!pickup.alive) continue;
        pickup.timer--;
        pickup.palette = (this.frame >> 2) % 4;
        const p = this.players.find(
          (p) => p.joined && p.connected && p.alive && overlap(p, pickup, 8),
        );
        if (p) {
          pickup.alive = false;
          this.awardScore(p.id, 5000);
          if (pickup.sourceType === 0x50) {
            for (const e of this.enemies)
              if (e.alive && e.hp > 0 && !e.bossPart && !e.explosiveResistance)
                this.enemySystem.kill(e, p.id);
          } else if (pickup.sourceType === 0x51) p.weaponLevel = 3;
          else p.lives = Math.min(9, p.lives + 1);
          this.events.push("upgrade");
        }
        if (pickup.timer <= 0) pickup.alive = false;
      }
      const low = this.cameraY + 304;
      this.huts = this.huts.filter((h) => h.alive && h.y < low);
      this.helipads = this.helipads.filter((h) => h.alive);
      this.prisoners = this.prisoners.filter((p) => p.alive && p.y < low);
      this.pickups = this.pickups.filter((p) => p.alive && p.y < low);
      this.helicopters = this.helicopters.filter((p) => p.alive && p.y < low);
    }
    coopScore(points) {
      if (!this.players.every((p) => p.joined && p.lives > 0)) return points;
      const table = [
          0, 50, 100, 200, 300, 500, 800, 1000, 1500, 2000, 3000, 5000, 8000,
          9000, 9990, 10,
        ],
        index = table.indexOf(points);
      return points && index >= 0 ? table[Math.min(15, index + 1)] : points;
    }
    awardScore(owner, points) {
      const p =
        typeof owner === "object"
          ? owner
          : this.players[(Number(owner) || 1) - 1];
      if (!p) return;
      p.score = Math.min(999999, p.score + Math.max(0, Math.floor(points)));
      while (p.score >= p.nextLife) {
        if (p.lives < 9) p.lives++;
        p.nextLife = p.nextLife === 20000 ? 70000 : p.nextLife + 50000;
        this.events.push("extra-life");
      }
    }
    enemyEffect(x, y, kind, extra = {}) {
      if (kind === "final-boss-music") {
        this.events.push(kind);
        return;
      }
      if (kind === "boss-background-row") {
        this.backgroundOperations.push({
          kind,
          x,
          y,
          frame: this.frame,
          ...extra,
        });
        return;
      }
      this.effect(x, y, kind, extra);
    }
    effect(x, y, kind = "explosion", extra = {}) {
      this.effects.push({
        frameId: kind === "pow-unload" ? 37 : kind === "spark" ? 17 : 25,
        palette: kind === "pow-unload" ? 0 : kind === "spark" ? 1 : 3,
        id: "effect-" + ++this.nextEntity,
        x,
        y,
        kind,
        life: 24,
        maxLife: extra.life || 24,
        ...extra,
      });
      if (this.effects.length > 64) this.effects.shift();
    }
    tickEffects() {
      for (const e of this.effects) {
        e.life--;
        if (e.kind === "pow-unload") {
          e.x += e.vx || 0;
          e.frameId = 37 + (e.life & 8 ? 3 : 0);
          e.flipX = (e.vx || 0) < 0;
          e.palette = e.lastPOW ? this.frame & 3 : 0;
          if (e.life === 0) {
            this.awardScore(e.owner, e.score || 0);
            this.events.push("pow-boarded");
          }
        } else if (e.kind !== "spark") {
          e.frameId =
            25 +
            Math.min(
              2,
              Math.floor(
                (e.maxLife - e.life) / (e.kind === "jeep-explosion" ? 6 : 8),
              ),
            );
        }
      }
      this.effects = this.effects.filter((e) => e.life > 0);
    }

    bossDone() {
      if (this.stageComplete) return;
      this.stageComplete = true;
      this.bossActive = false;
      this.playerBullets = [];
      this.weapons = [];
      this.endingRestart = false;
      this.cinematicKey = null;
      this.setPhase(this.stage === 6 ? "ending" : "stageclear");
      this.events.push("stage-victory");
    }
    tickStageClear() {
      this.tickEffects();
      if (this.phaseFrame >= 211 && (this.frame & 7) === 0) {
        for (const p of this.players)
          if (p.rescued > 0) {
            p.rescued--;
            this.awardScore(p.id, 2000);
            this.tallyAwarded += 2000;
            this.events.push("tally");
            if (
              this.players.every((p) => p.rescued === 0) &&
              this.phaseFrame >= 419
            )
              this.stageClearEnd = this.phaseFrame + 245;
          }
      }
      if (
        this.phaseFrame >= this.stageClearEnd &&
        this.players.every((p) => p.rescued === 0)
      ) {
        this.loadStage(this.stage + 1);
        this.setPhase("deployment");
        this.cinematicKey = "stage_load_" + String(this.stage).padStart(2, "0");
        this.cinematicFrame = 0;
        this.cinematicLength = 32;
      }
    }
    status() {
      return {
        phase: this.phase,
        phaseFrame: this.phaseFrame,
        stage: this.stage,
        selectedPlayers: this.selectedPlayers,
        continuesUsed: this.continuesUsed,
        continueChoice: this.continueChoice,
        rescued: this.rescued,
        cinematicKey: this.cinematicKey,
        cinematicFrame: this.cinematicFrame,
        progress:
          (this.worldHeight - 240 - this.cameraY) / (this.worldHeight - 240),
        bossActive: this.bossActive,
        players: this.players.map((p) => ({
          id: p.id,
          connected: p.connected,
          joined: p.joined,
          lives: p.lives,
          score: p.score,
          passengers: p.passengers,
          rescued: p.rescued,
          weaponLevel: p.weaponLevel,
          alive: p.alive,
        })),
      };
    }
  }
  const api = {
    JackalGame,
    FPS,
    TICK,
    TILE,
    WORLD_WIDTH,
    VIEW_WIDTH,
    VIEW_HEIGHT,
    STAGES,
    DIR8,
    DATA,
  };
  root.JackalGame = JackalGame;
  root.JackalModel = api;
  if (common) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
