/* Independent native-pixel Jackal simulation; one tick per 60.0988 Hz frame.
 * Source anchors and explicit fidelity limits: docs/reference-enemies.md. */
(function (root) {
  "use strict";
  const CORE_TYPES = new Set([
    0, 19, 20, 21, 22, 25, 28, 29, 39, 40, 61, 62, 63, 80, 81, 82,
  ]);
  const BOSS_TRIGGERS = { 9: 1, 32: 2, 37: 3, 64: 4, 23: 5, 69: 6 };
  // Bank7 HP/points: type,name,HP,explosiveResistance,points,halfX,halfY,frame.
  const ROWS = [
    [1, "mobile-infantry", 1, 0, 100, 13, 13, 18],
    [2, "stationary-infantry", 1, 0, 100, 13, 13, 18],
    [3, "flame-infantry", 1, 0, 100, 13, 13, 18],
    [4, "swamp-infantry", 1, 0, 100, 13, 13, 18],
    [5, "white-platform-turret", 3, 0, 500, 10, 10, 28],
    [6, "yellow-platform-turret", 4, 0, 500, 10, 10, 28],
    [7, "red-tank", 4, 0, 500, 10, 18, 34],
    [8, "patrol-boat", 6, 0, 800, 13, 18, 58],
    [9, "tank-boss-controller", 0, 0, 0, 0, 0, 0],
    [10, "boss-tank", 10, 1, 800, 13, 18, 51],
    [11, "silver-tank", 6, 0, 800, 13, 18, 68],
    [12, "cliff-turret", 4, 0, 1000, 10, 10, 129],
    [13, "laser-charge", 0, 0, 0, 0, 0, 0],
    [14, "flame-tank", 6, 0, 800, 13, 18, 68],
    [15, "enemy-jeep", 2, 0, 800, 10, 18, 61],
    [16, "left-falling-pillar", 1, 0, 0, 10, 18, 0],
    [17, "infantry-truck", 4, 0, 500, 19, 17, 84],
    [18, "retracting-spread-turret", 4, 0, 1000, 10, 10, 80],
    [23, "core-boss-controller", 0, 0, 0, 0, 0, 0],
    [24, "boss-statue", 15, 1, 800, 10, 18, 0],
    [26, "gunboat", 10, 0, 800, 10, 25, 86],
    [27, "gate", 1, 0, 0, 31, 15, 0],
    [30, "falling-pillar-top", 7, 0, 500, 13, 10, 0],
    [31, "right-falling-pillar", 1, 0, 0, 10, 18, 0],
    [32, "statue-boss-controller", 0, 0, 0, 0, 0, 0],
    [33, "statue", 1, 0, 800, 10, 18, 0],
    [34, "dormant-statue", 1, 0, 800, 10, 18, 0],
    [35, "door-silver-tank", 6, 0, 0, 13, 18, 68],
    [36, "door-red-tank", 4, 0, 0, 10, 18, 34],
    [37, "cannon-boss-controller", 0, 0, 0, 0, 0, 0],
    [38, "electrified-core", 1, 1, 1500, 31, 15, 147],
    [41, "submarine", 64, 0, 1000, 10, 10, 94],
    [42, "right-spread-truck", 8, 0, 1500, 10, 18, 103],
    [43, "left-spread-truck", 8, 0, 1500, 10, 18, 103],
    [44, "cliff-missile-launcher", 6, 0, 2000, 10, 10, 105],
    [45, "sunken-missile-launcher", 1, 0, 2000, 10, 10, 108],
    [46, "door-missile-launcher", 64, 0, 2000, 10, 10, 159],
    [47, "left-falling-rock", 7, 0, 800, 10, 10, 124],
    [48, "right-falling-rock", 7, 0, 800, 10, 10, 124],
    [49, "tank-door", 3, 1, 1000, 16, 12, 0],
    [50, "train-controller", 0, 0, 0, 0, 0, 0],
    [51, "train-car", 4, 0, 1500, 10, 10, 120],
    [52, "flame", 1, 0, 0, 13, 13, 136],
    [53, "mine", 1, 0, 0, 10, 10, 0],
    [54, "round-bullet", 0, 0, 0, 10, 10, 16],
    [55, "bomb", 0, 0, 0, 10, 10, 78],
    [56, "laser", 0, 0, 0, 0, 0, 0],
    [57, "homing-missile", 1, 0, 0, 10, 10, 112],
    [58, "attack-plane", 1, 0, 1000, 10, 18, 79],
    [59, "attack-plane-anywhere", 1, 0, 1000, 10, 18, 79],
    [60, "helicopter-flyover", 0, 0, 0, 0, 0, 49],
    [64, "helicopter-boss", 32, 1, 5000, 13, 25, 126],
    [65, "helicopter-explosion", 0, 0, 0, 0, 0, 25],
    [66, "paratrooper", 0, 0, 0, 0, 0, 171],
    [67, "attack-helicopter", 1, 0, 2000, 10, 18, 155],
    [68, "escalator", 0, 0, 0, 12, 65, 0],
    [69, "hq-boss-controller", 0, 0, 0, 0, 0, 0],
    [70, "end-check", 0, 0, 0, 0, 0, 0],
    [71, "hq-laser-turret", 15, 1, 3000, 13, 18, 202],
    [72, "hq-laser-blast", 0, 0, 0, 10, 10, 207],
    [73, "hq-graphics-trigger", 0, 0, 0, 0, 0, 0],
    [74, "headquarters", 63, 1, 5000, 13, 10, 0],
    [75, "final-flame-tank", 127, 1, 9000, 31, 15, 211],
    [76, "final-tank-flame", 0, 0, 0, 13, 18, 213],
    [77, "final-tank-flame-tip", 0, 0, 0, 13, 18, 0],
    [78, "parked-vehicle", 3, 0, 50, 10, 18, 61],
    [79, "final-tank-turret", 64, 1, 3000, 10, 32, 252],
    [83, "parked-powerup-vehicle", 3, 0, 50, 10, 18, 61],
  ];
  // HP bit7 controls explosive resistance. Gun immunity is a DIFFERENT bit,
  // bit6 of the hitbox flags; notably both tank bosses can take gun damage.
  const GUN_IMMUNE = new Set([
    16, 24, 27, 31, 33, 34, 38, 45, 46, 58, 59, 64, 67, 71, 74,
  ]);
  const NO_JEEP_CONTACT = new Set([
    9, 13, 23, 27, 32, 37, 38, 49, 50, 55, 58, 59, 60, 64, 65, 66, 67, 69, 70,
    73, 74, 78, 83,
  ]);
  const SPECS = Object.freeze(
    ROWS.reduce((specs, r) => {
      specs[r[0]] = Object.freeze({
        sourceType: r[0],
        kind: r[1],
        hp: r[2],
        explosiveResistance: !!r[3],
        gunImmune: GUN_IMMUNE.has(r[0]),
        grenadeOnly: GUN_IMMUNE.has(r[0]),
        mainWeaponPassesThrough: r[0] >= 1 && r[0] <= 4,
        jeepContact: !NO_JEEP_CONTACT.has(r[0]),
        score: r[4],
        halfWidth: r[5],
        halfHeight: r[6],
        frameId: r[7],
      });
      return specs;
    }, {}),
  );
  const SHOT_SPEED = [
    0x20, 0x22, 0x31, 0x30, 0x31, 0x20, 0x31, 0x31, 0x40, 0x31, 0x40, 0x41,
    0x20, 0x21, 0x20, 0x21,
  ];
  const SHOT_LIFE = [
      48, 96, 64, 64, 96, 64, 136, 80, 64, 48, 24, 36, 96, 96, 96, 96,
    ],
    SHOT_HIDE = [8, 16, 12, 12, 6, 8, 6, 0, 8, 8, 4, 0, 0, 0, 0, 0];
  const SHOT_FRAME = [
      16, 16, 16, 74, 16, 16, 16, 74, 74, 16, 16, 16, 16, 16, 16, 16,
    ],
    SHOT_PALETTE = [2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 2, 3, 2, 3, 2, 3];
  const COS = [
    128, 125, 118, 106, 90, 71, 48, 24, 0, 24, 48, 71, 90, 106, 118, 125,
  ];
  const FINAL_EXPLOSIONS = [
    [192, 32],
    [256, 48],
    [224, 64],
    [320, 48],
    [240, 32],
    [336, 48],
    [176, 64],
    [288, 64],
    [240, 32],
    [256, 48],
    [192, 32],
    [288, 64],
    [208, 64],
  ];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
    direction = (x, y) =>
      (Math.round((Math.atan2(y, x) * 16) / Math.PI) + 32) & 31;
  function velocity(dir, factor) {
    dir &= 31;
    const scale = (factor >> 4) + (factor & 15 ? 2 ** -(factor & 15) : 0),
      x = COS[dir & 15] * (dir >= 8 && dir < 24 ? -1 : 1),
      y = COS[(dir + 8) & 15] * (dir >= 16 ? -1 : 1);
    return {
      x: Math.floor(x * scale) / 256 || 0,
      y: Math.floor(y * scale) / 256 || 0,
    };
  }
  function orient(a, base) {
    const o = ((a.dir + 2) & 31) >> 2;
    a.frameId = base + [0, 1, 2, 1, 0, 1, 2, 1][o];
    a.frame = a.frameId;
    a.flipX = o >= 3 && o <= 5;
    a.flipY = o >= 5;
  }
  class EnemySystem {
    constructor(o = {}) {
      this.stage = o.stage || 1;
      this.random = o.random || Math.random;
      this.actors = [];
      this.projectiles = [];
      this.boss = null;
      this.externalActorCount = 0;
      this.sequence = 0;
      this.ctx = null;
      this.age = 0;
      this.pendingEffects = [];
      this.pendingScores = [];
      this.lastImpactStops = false;
      this.trainMask = 255;
    }
    clear() {
      this.actors.length = 0;
      this.projectiles.length = 0;
      this.boss = null;
      this.pendingEffects.length = 0;
      this.pendingScores.length = 0;
    }
    count() {
      return (
        this.actors.filter((a) => a.alive).length +
        this.projectiles.filter((a) => a.alive).length +
        this.externalActorCount
      );
    }
    evictForPriority() {
      const p = this.projectiles.find((a) => a.alive);
      if (p) {
        p.alive = false;
        return true;
      }
      const a = this.actors.find(
        (a) => a.alive && !a.bossPart && !a.controller,
      );
      if (a) {
        a.alive = false;
        return true;
      }
      return false;
    }
    reserve(priority) {
      return this.count() < 16 || !!(priority && this.evictForPriority());
    }
    spawn(e = {}) {
      const raw =
          e.raw_source_type != null
            ? e.raw_source_type
            : e.source_type != null
              ? e.source_type
              : e.sourceType != null
                ? e.sourceType
                : 0,
        t =
          (e.source_type != null
            ? e.source_type
            : e.sourceType != null
              ? e.sourceType
              : raw) & 127;
      if (CORE_TYPES.has(t) || !SPECS[t]) return null;
      const priority = !!(e.priority_spawn || raw & 128 || e.bossPart);
      if (!this.reserve(priority)) return null;
      const s = SPECS[t];
      const a = Object.assign(
        {},
        s,
        {
          id: `enemy:${++this.sequence}`,
          source_type: t,
          raw_source_type: raw,
          x: Number(e.x) || 0,
          y: Number(e.y) || 0,
          vx: 0,
          vy: 0,
          maxHp: s.hp,
          alive: true,
          active: true,
          dir: e.dir != null ? e.dir : 8,
          frame: s.frameId,
          palette: 2,
          flipX: false,
          flipY: false,
          state: "init",
          timer: 0,
          age: 0,
          visible: true,
          vulnerable: s.hp > 0,
          priority,
          contact: s.hp > 0 && s.jeepContact,
          controller: false,
          bossPart: !!e.bossPart,
          data: Object.assign({}, e),
        },
        "score" in e ? { score: e.score } : {},
      );
      const coop =
        e.coop != null
          ? e.coop
          : ((this.ctx && this.ctx.players) || []).filter(
              (p) =>
                p.joined !== false &&
                (p.lives === undefined ? p.alive : p.lives > 0),
            ).length === 2;
      if (coop && !("score" in e)) {
        const points = [
          0, 50, 100, 200, 300, 500, 800, 1000, 1500, 2000, 3000, 5000, 8000,
          9000, 9990, 10,
        ];
        const index = points.indexOf(a.score);
        if (index >= 0) a.score = points[Math.min(15, index + 1)];
      }
      this.actors.push(a);
      if (BOSS_TRIGGERS[t]) this.startBoss(BOSS_TRIGGERS[t], a);
      this.initialize(a);
      return a;
    }
    startBoss(stage, a) {
      if (this.boss && !this.boss.done) return;
      this.boss = {
        stage,
        phase: stage === 6 ? "headquarters" : "battle",
        parts: [],
        pending:
          stage === 1
            ? 4
            : stage === 2
              ? 4
              : stage === 3
                ? 6
                : stage === 5
                  ? 5
                  : stage === 6
                    ? 3
                    : 0,
        started: false,
        done: false,
        triggerId: a.id,
        cameraY: null,
        timer: stage === 1 ? null : stage === 2 || stage === 3 ? 24 : 0,
        spawned: 0,
        transition: 0,
      };
      if (stage === 4) {
        a.bossPart = true;
        this.boss.parts.push(a.id);
      } else {
        a.controller = true;
        a.visible = false;
        a.contact = false;
        a.vulnerable = false;
      }
    }
    initialize(a) {
      const t = a.sourceType,
        d = a.data;
      if (a.controller) {
        a.state = "controller";
        return;
      }
      if (t === 1 || t === 4) {
        a.state = "meander";
        a.timer = 256;
        a.palette = 1;
        a.dir = (this.random() * 32) | 0;
      } else if (t === 2 || t === 3) {
        a.state = "wait";
        a.timer = (this.sequence * 8) & 255 || 256;
        a.palette = t === 3 ? 3 : 1;
      } else if ([5, 6, 12, 79].includes(t)) {
        a.state = "aim";
        a.timer = 32;
        d.rotateDelay = 0;
      } else if ([7, 10, 11, 14, 15, 35, 36].includes(t)) {
        a.state = "move";
        a.timer = t === 10 ? (d.fromBottom ? 24 : 48) : t === 15 ? 32 : 80;
        d.shotTimer = t === 10 ? 16 : 32;
      } else if (t === 18) {
        d.bossVariant = !!(a.bossPart || a.raw_source_type & 128);
        a.state = "rising";
        a.timer = 72;
        a.vulnerable = false;
        d.baseFrame = d.bossVariant ? 99 : this.stage === 6 ? 161 : 80;
        if (d.bossVariant) {
          a.hp = a.maxHp = 6;
          a.explosiveResistance = true;
        }
        a.frameId = d.baseFrame;
      } else if ([24, 33, 34].includes(t)) {
        a.state = "closed";
        a.timer = t === 24 ? 192 : (this.sequence * 4) & 255 || 64;
        a.backgroundFrame = 0;
        a.contact = false;
      } else if (t === 38) {
        a.state = "shielded";
        a.vulnerable = false;
        a.contact = false;
      } else if (t === 49) {
        a.state = "closed";
        a.timer = [48, 96, 144, 192][d.doorIndex != null ? d.doorIndex : 0];
        a.vulnerable = false;
        a.backgroundFrame = 20;
        d.openings = 0;
        d.capacity = 4;
        d.spawnOrder = d.doorIndex || 0;
      } else if (t === 64) {
        a.state = "waiting";
        a.timer = 128;
        a.visible = false;
        a.vulnerable = false;
        a.contact = false;
      } else if (t === 66) {
        a.state = "outward";
        a.timer = [8, 25, 42, 59][d.dropIndex != null ? d.dropIndex : 0];
        a.contact = false;
        a.vulnerable = false;
      } else if (t === 71) {
        a.state = "choose";
        a.dir = 8;
        d.rotateDelay = 7;
      } else if (t === 74) {
        a.state = "headquarters";
        a.timer = 192 + ((this.random() * 64) | 0);
        a.contact = false;
        a.backgroundFrame = 14;
      } else if (t === 75) {
        a.state = "moving";
        a.timer = 32 + ((this.random() * 96) | 0);
        a.dir = a.x < 256 ? 0 : 16;
        d.turretSpawned = false;
      } else if ([52, 76, 77].includes(t)) {
        a.state = "flame";
        a.timer = t === 76 ? 80 : 32;
        a.contact = true;
        a.vulnerable = false;
      } else if (t === 53) {
        a.state = "hidden";
        a.visible = false;
        a.contact = false;
        a.vulnerable = false;
      } else if (t === 57) {
        a.alive = false;
        this.missile(a, d.missileMode != null ? d.missileMode : 2, a.dir);
      } else if (t === 54) {
        a.alive = false;
        this.shot(a, d.bulletType != null ? d.bulletType : 0, a.dir);
      } else if (t === 72) {
        a.state = "flight";
        a.timer = d.flightTime || 68;
        d.hide = 8;
        a.contact = true;
        a.vulnerable = false;
      } else if (t === 55) {
        a.state = "fall";
        a.timer = 48;
        a.contact = false;
        a.vulnerable = false;
      } else if (t === 56) {
        a.state = "next-laser";
        a.timer = 1;
        d.position = Math.floor(this.random() * 4) % 3;
        // Bank6 Level3LaserState0 selects the long beam on source screen 7
        // and the short beam on screen 8. Map events retain that screen index;
        // do not infer it from a camera that may already have scrolled onward.
        d.short = d.shortLaser != null
          ? !!d.shortLaser
          : d.source_page != null && Number(d.source_page) !== 7;
        a.halfWidth = 12;
        a.halfHeight = d.short ? 46 : 54;
        a.visible = false;
        a.contact = false;
        a.vulnerable = false;
      } else if (t === 13) {
        a.state = "charge";
        a.timer = 16;
        a.contact = false;
        a.vulnerable = false;
      } else if (t === 65) {
        a.state = "dying";
        a.timer = 24;
        a.contact = false;
        a.vulnerable = false;
      } else if (t === 50) {
        a.state = "train";
        a.timer = 1;
        d.remaining = 8;
        a.visible = false;
        a.contact = false;
        this.trainMask = 255;
      } else if ([68, 70, 73].includes(t)) {
        a.state = "environment";
        a.contact = false;
        a.vulnerable = false;
        a.visible = false;
      } else if (t === 78 || t === 83) {
        a.state = "parked";
        a.dir = a.x < 256 ? 0 : 16;
      } else if ([41, 45, 46].includes(t)) {
        a.state = "hidden";
        a.timer = t === 41 ? 32 : 128;
        a.visible = t === 41;
        a.vulnerable = false;
        d.moves = 0;
      } else if (t === 30) {
        a.state = "falling";
        a.timer = 32;
        a.frameId = 71;
      } else if (t === 16 || t === 31) {
        a.state = "standing";
        a.contact = false;
        a.dir = t === 16 ? 10 : 6;
      } else if (t === 47 || t === 48) {
        a.state = "waiting";
        a.timer = 4;
        a.contact = false;
      } else if (t === 17) {
        a.state = "wait";
        a.timer = 32;
        d.remaining = 8;
      } else if (t === 42 || t === 43) {
        a.state = "wait";
        a.timer = 4;
        a.dir = t === 42 ? 4 : 12;
      } else if (t === 44) {
        a.state = "wait";
        a.timer = 128;
      } else {
        a.state = "active";
        a.timer = 64;
      }
      a.frame = a.frameId;
    }
    target(a) {
      return ((this.ctx && this.ctx.players) || [])
        .filter((p) => p.alive && p.joined !== false && p.connected !== false)
        .reduce(
          (b, p) =>
            !b ||
            Math.hypot(p.x - a.x, p.y - a.y) < Math.hypot(b.x - a.x, b.y - a.y)
              ? p
              : b,
          null,
        );
    }
    aim(a) {
      const p = this.target(a);
      return p ? direction(p.x - a.x, p.y - a.y) : a.dir;
    }
    turn(a, w, step = 1) {
      const d = (w - a.dir + 32) & 31;
      if (d) a.dir = (a.dir + (d > 16 ? -step : step) + 32) & 31;
    }
    move(a, factor, terrain = true) {
      const v = velocity(a.dir, factor);
      a.vx = v.x;
      a.vy = v.y;
      if (
        terrain &&
        this.ctx != null &&
        this.ctx.terrainBlocked != null &&
        this.ctx.terrainBlocked(a.x + v.x, a.y + v.y, Math.min(a.halfWidth, 8))
      ) {
        a.dir = (a.dir + 4) & 31;
        return false;
      }
      a.x = clamp(a.x + v.x, 0, 511);
      a.y += v.y;
      return true;
    }
    effect(a, kind = "explosion", extra = {}) {
      this.pendingEffects.push(
        Object.assign({}, { x: a.x, y: a.y, kind }, extra),
      );
    }
    shot(a, type = 0, dir = this.aim(a), extra = {}) {
      if (!this.reserve(false)) return null;
      type = clamp(type | 0, 0, 15);
      const v = velocity(dir, SHOT_SPEED[type]),
        skill = clamp(
          ((this.stage - 1 + ((this.ctx && this.ctx.difficulty) || 0)) / 2) | 0,
          0,
          5,
        ),
        life = SHOT_LIFE[type] + skill * 8;
      const p = Object.assign(
        {},
        {
          id: `enemy-shot:${++this.sequence}`,
          sourceType: 54,
          kind: "bullet",
          team: "enemy",
          owner: 0,
          alive: true,
          x: a.x,
          y: a.y,
          vx: v.x,
          vy: v.y,
          dir,
          damage: 1,
          life,
          maxLife: life,
          hiddenTicks: SHOT_HIDE[type] + 1,
          visible: false,
          frameId: SHOT_FRAME[type],
          frame: SHOT_FRAME[type],
          palette: SHOT_PALETTE[type],
          radius: 3,
          bulletType: type,
        },
        extra,
      );
      this.projectiles.push(p);
      return p;
    }
    missile(a, mode = 2, dir = this.aim(a)) {
      if (!this.reserve(false)) return null;
      const p = {
        id: `enemy-shot:${++this.sequence}`,
        sourceType: 57,
        kind: "missile",
        team: "enemy",
        owner: 0,
        alive: true,
        x: a.x,
        y: a.y,
        dir,
        mode,
        turnTimer: [56, 12, 16, 256][mode],
        turnInterval: [16, 12, 6, 16][mode],
        turns: 0,
        maxTurns: [1, 40, 64, 1][mode],
        speedFactor: [64, 48, 64, 112][mode],
        hp: 1,
        radius: 5,
        damage: 1,
        visible: true,
        frameId: mode < 2 ? 75 : 112,
        frame: mode < 2 ? 75 : 112,
        palette: 2,
        life: mode === 3 ? 256 : 800,
      };
      this.projectiles.push(p);
      return p;
    }
    damageAt(x, y, r, damage, kind, owner) {
      let hit = false;
      this.lastImpactStops = false;
      for (const a of this.actors) {
        if (!a.alive || a.state === "dying" || !a.vulnerable || a.hp <= 0)
          continue;
        if (
          Math.abs(x - a.x) > a.halfWidth + r ||
          Math.abs(y - a.y) > a.halfHeight + r
        )
          continue;
        if (kind === "gun" && a.gunImmune) continue;
        // Native bazooka splashes do not damage HP-bit7 armored objects.
        if (kind === "blast" && a.explosiveResistance) continue;
        hit = true;
        if (!this.lastImpactStops)
          this.lastImpactStops = kind === "gun" || !a.mainWeaponPassesThrough;
        a.hp =
          kind === "gun" || a.explosiveResistance
            ? Math.max(0, a.hp - damage)
            : 0;
        a.hitFlash = 4;
        if (a.hp === 0) this.kill(a, owner);
        if (kind === "gun") break;
      }
      if (hit && kind === "gun") return true;
      for (const p of this.projectiles) {
        if (
          !p.alive ||
          p.kind !== "missile" ||
          Math.hypot(x - p.x, y - p.y) > r + p.radius
        )
          continue;
        p.alive = false;
        this.effect(p);
        hit = true;
        this.lastImpactStops = true;
        if (kind === "gun") break;
      }
      return hit;
    }
    kill(a, owner, award = true) {
      if (a.state === "dying") return;
      a.state = "dying";
      a.timer = a.sourceType <= 4 ? 32 : 24;
      a.vulnerable = false;
      a.contact = false;
      a.frameId = 25;
      a.frame = 25;
      if (a.score && award) this.pendingScores.push({ owner, score: a.score });
      this.effect(a, "explosion", { sourceType: a.sourceType });
      if (this.ctx != null && this.ctx.applyBackgroundPatch != null)
        this.ctx.applyBackgroundPatch(a.sourceType, a.x, a.y);
      if (a.sourceType === 74 && this.boss) {
        this.boss.phase = "hq-dying";
        this.boss.transition = 24;
      }
      if (a.sourceType === 75 && this.boss) {
        this.boss.phase = "tank-exploding";
        this.boss.transitionInitialized = false;
        this.boss.freezePlayers = true;
        a.state = "final-exploding";
        a.controller = true;
        a.frameId = a.frame = 211;
        // The attached turret disappears with the tank; it is not a second kill.
        for (const o of this.actors)
          if (o !== a && !o.controller) o.alive = false;
        this.projectiles.length = 0;
      }
      if ([1, 2, 3, 4, 66].includes(a.sourceType)) a.deathKind = "infantry";
    }
    tick(ctx = {}) {
      this.ctx = ctx;
      this.stage = ctx.stage || this.stage;
      this.age++;
      this.tickBoss();
      for (const a of [...this.actors]) {
        if (!a.alive) continue;
        a.age++;
        if (a.hitFlash) a.hitFlash--;
        if (a.state === "dying") {
          a.frameId =
            a.sourceType <= 4 ? 24 : 25 + Math.min(2, ((24 - a.timer) / 8) | 0);
          if (--a.timer <= 0) {
            a.alive = false;
            if (a.sourceType === 51)
              this.trainMask = ~((128 >> (a.data.trainIndex || 0)) >> 1) & 255;
            if (a.sourceType === 16 || a.sourceType === 31)
              this.spawn({ source_type: 30, x: a.x, y: a.y, dir: a.dir });
            if (a.sourceType === 83 && ctx.spawnEntity != null)
              ctx.spawnEntity({
                source_type: 81,
                raw_source_type: 209,
                x: a.x,
                y: a.y,
                visible: true,
              });
          }
        } else if (!a.controller) this.updateActor(a);
        a.frame = a.frameId;
        if (a.alive && a.contact && a.visible && a.state !== "dying")
          for (const p of ctx.players || []) {
            if (
              p.alive &&
              p.joined !== false &&
              Math.abs(a.x - p.x) < a.halfWidth &&
              Math.abs(a.y - p.y) < a.halfHeight
            ) {
              if (a.sourceType <= 4) {
                this.kill(a, p.id);
                break;
              }
              if (ctx.damagePlayer != null) ctx.damagePlayer(p);
            }
          }
        if (
          !a.bossPart &&
          !a.controller &&
          a.age > 30 &&
          (a.y > (ctx.cameraY != null ? ctx.cameraY : 0) + 320 ||
            a.y < (ctx.cameraY != null ? ctx.cameraY : 0) - 128)
        )
          a.alive = false;
      }
      this.tickProjectiles();
      this.actors = this.actors.filter((a) => a.alive);
      this.projectiles = this.projectiles.filter((a) => a.alive);
      this.checkBossComplete();
      for (const e of this.pendingEffects)
        if (ctx.onEffect != null) ctx.onEffect(e.x, e.y, e.kind, e);
      for (const s of this.pendingScores)
        if (ctx.addScore != null) ctx.addScore(s.owner, s.score);
      this.pendingEffects.length = 0;
      this.pendingScores.length = 0;
    }
    bossPart(t, x, y, extra = {}) {
      const a = this.spawn(
        Object.assign(
          {},
          {
            source_type: t,
            raw_source_type: t | 128,
            x,
            y,
            bossPart: true,
          },
          extra,
        ),
      );
      if (a && this.boss) this.boss.parts.push(a.id);
      return a;
    }
    tickBoss() {
      const b = this.boss;
      if (!b || b.done) return;
      if (!b.started) {
        b.started = true;
        b.cameraY = this.ctx.cameraY || 0;
        if (this.ctx.onBossStart != null) this.ctx.onBossStart();
        if (b.stage === 1)
          b.timer = [240, 208, 176, 144][clamp(this.ctx.difficulty || 0, 0, 3)];
      }
      const cy = b.cameraY;
      if (b.phase === "hq-dying") {
        if (--b.transition <= 0) {
          b.phase = "hq-exploding";
          b.transitionInitialized = false;
          b.freezePlayers = true;
          for (const a of this.actors)
            if (!a.controller && a.sourceType !== 74) a.alive = false;
          this.projectiles.length = 0;
        }
        return;
      }
      if (b.phase === "hq-exploding" || b.phase === "tank-exploding") {
        this.tickFinalExplosion(b);
        return;
      }
      if (b.phase === "hq-to-tank") {
        const a = this.bossPart(75, 256, cy + 48);
        if (a) {
          b.phase = "flame-tank";
          b.pending = 0;
        }
        return;
      }
      if (b.pending > 0) {
        if (b.timer > 0) {
          b.timer--;
          return;
        }
        let a = null;
        if (b.stage === 1) {
          const bottom = !!((b.pending - 1) & 1);
          a = this.bossPart(
            10,
            clamp(Math.floor(this.random() * 256), 80, 176) * 2,
            cy + (bottom ? 239 : 0),
            { fromBottom: bottom, dir: bottom ? 24 : 8 },
          );
          b.timer =
            [240, 208, 176, 144][clamp(this.ctx.difficulty || 0, 0, 3)] - 1;
        }
        if (b.stage === 2) {
          a = this.bossPart(24, [188, 268, 228, 308][b.pending - 1], cy + 28);
          b.timer = 23;
        }
        if (b.stage === 3) {
          const p = [
            [112, 70],
            [184, 54],
            [184, 86],
            [232, 54],
            [232, 86],
            [296, 70],
          ][b.pending - 1];
          a = this.bossPart(18, p[0], cy + p[1], { slot: b.pending - 1 });
          b.timer = 23;
        }
        if (b.stage === 5) {
          if (b.pending === 5) a = this.bossPart(38, 280, cy + 64);
          else {
            const i = b.pending - 1;
            a = this.bossPart(49, [128, 176, 384, 432][i], cy + 72, {
              doorIndex: i,
            });
          }
          b.timer = 0;
        }
        if (b.stage === 6) {
          a =
            b.pending === 3
              ? this.bossPart(74, 256, cy + 46)
              : this.bossPart(71, b.pending === 2 ? 302 : 210, cy + 41);
          b.timer = 0;
        }
        if (a) {
          b.pending--;
          b.spawned++;
        } else b.timer = 0;
      }
      if (
        (b.stage === 2 || b.stage === 3) &&
        (this.ctx.difficulty || 0) >= 2 &&
        this.age % 512 === 0
      )
        this.spawn({
          source_type: 7,
          x: 128 + this.random() * 256,
          y: cy + 239,
          score: 0,
        });
    }
    tickFinalExplosion(b) {
      const finalTank = b.phase === "tank-exploding";
      if (!b.transitionInitialized) {
        b.transitionInitialized = true;
        // Bank7: HQ starts with cleared byte0 (wraps to255); tank sets C0.
        b.transitionCounter = finalTank ? 192 : 0;
        b.graphicsIndex = finalTank ? 0x55 : 0x3d;
        b.graphicsEnd = finalTank ? 0x65 : 0x55;
        b.transitionAge = 1;
        b.explosionIndex = 0;
        b.freezePlayers = true;
        return;
      }
      b.transitionAge++;
      if (!finalTank && b.transitionAge === 192 && this.ctx.onEffect != null)
        this.ctx.onEffect(256, b.cameraY + 48, "final-boss-music");
      if (((this.ctx.frame != null ? this.ctx.frame : this.age) & 15) === 0)
        for (let i = 0; i < 3; i++) {
          const p =
            FINAL_EXPLOSIONS[b.explosionIndex++ % FINAL_EXPLOSIONS.length];
          this.effect({ x: p[0], y: b.cameraY + p[1] });
        }
      const next = (b.transitionCounter - 1) & 255;
      if (next !== 0) {
        b.transitionCounter = next;
        return;
      }
      // The original deliberately leaves the byte at1 during row updates.
      b.graphicsIndex++;
      if (this.ctx.onEffect != null)
        this.ctx.onEffect(256, b.cameraY + 48, "boss-background-row", {
          index: b.graphicsIndex - 1,
        });
      if (b.graphicsIndex < b.graphicsEnd) return;
      b.freezePlayers = false;
      if (finalTank) {
        for (const a of this.actors) if (a.bossPart) a.alive = false;
        b.phase = "flame-tank"; // shared completion check emits exactly once
      } else b.phase = "hq-to-tank";
    }
    checkBossComplete() {
      const b = this.boss;
      if (!b || b.done || b.pending || b.phase === "hq-exploding") return;
      if (b.stage === 6 && b.phase !== "flame-tank") return;
      if (this.actors.some((a) => a.alive && a.bossPart)) return;
      b.done = true;
      b.phase = "defeated";
      for (const a of this.actors) if (a.controller) a.alive = false;
      if (this.ctx.onBossDefeated != null) this.ctx.onBossDefeated();
    }
    updateActor(a) {
      const t = a.sourceType;
      if (t <= 4) return this.infantry(a);
      if ([5, 6, 12, 79].includes(t)) return this.turret(a);
      if ([7, 10, 11, 14, 15, 35, 36].includes(t)) return this.tank(a);
      if (t === 18) return this.spreadTurret(a);
      if ([24, 33, 34].includes(t)) return this.statue(a);
      if (t === 49) return this.door(a);
      if (t === 38) {
        const protectedCore =
          (this.boss != null &&
            this.boss.stage === 5 &&
            this.boss.pending > 0) ||
          this.actors.some((o) => o.sourceType === 49 && o.alive);
        a.vulnerable = !protectedCore;
        a.state = protectedCore ? "shielded" : "exposed";
        a.frameId = protectedCore ? 147 + ((a.age >> 2) & 7) : 0;
        a.backgroundFrame = protectedCore ? null : 15;
        return;
      }
      if (t === 64) return this.helicopterBoss(a);
      if (t === 66) return this.paratrooper(a);
      if (t === 71) return this.hqTurret(a);
      if (t === 74) {
        if (--a.timer <= 0) {
          this.spawn({
            source_type: 7,
            x: 128 + this.random() * 256,
            y:
              (this.boss != null && this.boss.cameraY != null
                ? this.boss.cameraY
                : this.ctx.cameraY != null
                  ? this.ctx.cameraY
                  : 0) + 239,
            score: 0,
          });
          a.timer = 192 + ((this.random() * 64) | 0);
        }
        a.frameId = a.age % (a.hp + 8) < a.hp ? 0 : 209;
        return;
      }
      if (t === 75) return this.finalTank(a);
      if (t === 8 || t === 26) {
        a.dir = t === 8 ? 12 : 8;
        if (a.age <= 96) this.move(a, t === 8 ? 16 : 17, false);
        a.frameId = (t === 8 ? 58 : 86) + ((a.age >> 3) & 1);
        if (a.age % 48 === 0) this.shot(a, 1);
        return;
      }
      if (t === 17) return this.truck(a);
      if (t === 41) return this.submarine(a);
      if (t === 42 || t === 43) return this.spreadTruck(a);
      if (t === 44 || t === 45 || t === 46) return this.launcher(a);
      if (t === 47 || t === 48) return this.rock(a);
      if (t === 50) {
        if (--a.timer <= 0) {
          const index = 8 - a.data.remaining;
          const child = this.spawn({
            source_type: 51,
            x: a.x,
            y: a.y,
            trainIndex: index,
          });
          if (child) {
            a.data.remaining--;
            a.timer = 24;
          } else if (index > 0) a.alive = false;
          if (a.data.remaining <= 0) a.alive = false;
        }
        return;
      }
      if (t === 51) {
        a.dir = 24;
        this.move(a, 48, false);
        const i = a.data.trainIndex || 0;
        a.frameId = i === 0 ? 165 : 168;
        const timer = Math.ceil(a.age / 2);
        if (i % 2 && timer > 0 && (timer & 31) === 0) {
          const target = this.target(a);
          this.shot(
            a,
            6,
            (target != null && target.x != null ? target.x : 256) < a.x
              ? 16
              : 0,
          );
        }
        if (timer >= 115) a.frameId += 1;
        if (timer >= 120) a.frameId += 1;
        if (timer >= 128) a.alive = false;
        else if (!(this.trainMask & (128 >> i))) this.kill(a, 0, false);
        return;
      }
      if (t === 58 || t === 59) {
        a.dir = 8;
        this.move(a, 64, false);
        a.frameId = 78 + (a.age & 1);
        if ((a.age & 31) === 16)
          this.spawn({ source_type: 55, x: a.x, y: a.y, bombFrom: t });
        return;
      }
      if (t === 60) {
        a.dir = 24;
        this.move(a, 64, false);
        a.frameId = 49 + ((a.age >> 1) & 1);
        return;
      }
      if (t === 67) {
        if (a.age <= 112) {
          a.dir = 8;
          this.move(
            a,
            [80, 64, 48, 32, 16, 0, 0][Math.min(6, (a.age - 1) >> 4)],
            false,
          );
          a.frameId = 155 + ((a.age >> 1) & 1);
        } else {
          a.dir = a.x < 256 ? 28 : 20;
          this.move(a, 49, false);
          a.frameId = 157 + ((a.age >> 1) & 1);
        }
        if (a.age % 32 === 0) this.shot(a, 10);
        return;
      }
      if (t === 52 || t === 76 || t === 77) return this.flame(a);
      if (t === 53) {
        const p = this.target(a);
        if (
          a.state === "hidden" &&
          p &&
          Math.hypot(a.x - p.x, a.y - p.y) < 18
        ) {
          a.state = "exploding";
          a.visible = true;
          a.timer = 24;
          a.frameId = 25;
          a.contact = true;
          this.effect(a);
        }
        if (a.state === "exploding") {
          a.frameId = 25 + ((24 - a.timer) >> 3);
          if (--a.timer <= 0) a.alive = false;
        }
        return;
      }
      if (t === 55) {
        if (a.state === "fall") {
          a.frameId = a.data.bombFrom === 58 ? 65 : 64;
          if (--a.timer <= 0) {
            a.state = "exploding";
            a.timer = 24;
            a.contact = true;
            this.effect(a);
          }
        } else {
          a.frameId = 25 + ((24 - a.timer) >> 3);
          if (--a.timer <= 0) a.alive = false;
        }
        return;
      }
      if (t === 72) {
        a.visible = --a.data.hide <= 0;
        this.move(a, 81, false);
        a.frameId = a.dir & 4 ? 207 : 208;
        if (--a.timer <= 0) {
          this.effect(a);
          a.alive = false;
        }
        return;
      }
      if (t === 13) {
        a.frameId = a.timer & 1 ? 0 : a.timer > 8 ? 97 : 98;
        if (--a.timer <= 0) a.alive = false;
        return;
      }
      if (t === 56) {
        if (a.state === "next-laser") {
          a.x = [240, 304, 368][a.data.position];
          a.data.position = (a.data.position + 1) % 3;
          const offset = a.data.short ? 56 : 64;
          for (const side of [-1, 1])
            this.spawn({ source_type: 13, x: a.x, y: a.y + side * offset });
          a.state = "charging";
          a.timer = 32;
        } else if (a.state === "charging") {
          if (--a.timer <= 0) {
            a.state = "firing";
            a.timer = 24;
            a.contact = a.visible = true;
            a.frameId = a.data.short ? 96 : 95;
          }
        } else {
          a.palette = a.age & 3;
          if (--a.timer <= 0) {
            a.state = "next-laser";
            a.contact = a.visible = false;
            a.frameId = 0;
          }
        }
        return;
      }
      if (t === 30) {
        a.contact = true;
        if (a.state === "falling") {
          a.frameId = 71;
          this.move(a, 49, false);
          if (--a.timer <= 0) {
            a.state = "rolling";
            a.timer = 48;
            a.dir = 8;
          }
        } else if (a.state === "rolling") {
          a.frameId = 72 + ((a.timer >> 3) & 1);
          this.move(a, 49, true);
          if (--a.timer <= 0) a.state = "stopped";
        }
        return;
      }
      if (t === 16 || t === 31) {
        a.backgroundFrame = 0;
        a.visible = false;
        const target = this.target(a);
        const dir = this.aim(a);
        if (
          a.age % 4 === 0 &&
          target &&
          dir >= 6 &&
          dir < 11 &&
          Math.hypot(target.x - a.x, target.y - a.y) < 112
        )
          this.kill(a, 0);
        return;
      }
      if (t === 78 || t === 83) {
        a.frameId = 0;
        a.backgroundOnly = true;
        return;
      }
      if (t === 27) {
        a.visible = false;
        return;
      }
      if (t === 68) {
        a.environment = "escalator";
        return;
      }
      if (t === 70) {
        a.alive = false;
        return;
      }
      if (t === 73) {
        a.environment = "hq-graphics";
        a.alive = false;
      }
    }
    infantry(a) {
      const t = a.sourceType,
        skill = clamp(
          ((this.stage - 1 + (this.ctx.difficulty || 0)) / 2) | 0,
          0,
          5,
        ),
        p = this.target(a),
        distance = p ? Math.hypot(p.x - a.x, p.y - a.y) : 999;
      if (a.state === "meander") {
        if (a.age === 1) a.timer = [256, 192, 128, 64, 32, 16][skill];
        if (a.age % 32 === 0) this.turn(a, (this.aim(a) + 8) & 31, 4);
        this.move(a, 1, true);
        if (--a.timer <= 0) {
          a.state = "aim";
          a.timer = 64;
        }
      } else if (a.state === "wait" || a.state === "aim") {
        a.dir = this.aim(a);
        if (--a.timer <= 0) {
          const radius =
            t === 1 || t === 4 ? [80, 64, 48, 32, 16, 0][skill] : 64;
          if (distance >= radius) {
            a.state = "flash";
            a.timer = [8, 8, 16, 9, 24, 17][t === 3 ? 0 : skill] + 7;
          } else {
            a.state = t === 1 || t === 4 ? "meander" : "wait";
            a.timer = [128, 112, 96, 80, 64, 48][skill];
          }
        }
      } else if (a.state === "flash") {
        a.dir = this.aim(a);
        a.palette = a.age & 3;
        if ((a.timer - 7) % 8 === 0) {
          if (t === 3)
            this.spawn({ source_type: 52, x: a.x, y: a.y, dir: a.dir });
          else this.shot(a, t === 2 ? 5 : 0, a.dir);
        }
        if (--a.timer <= 0) {
          a.state = t === 1 || t === 4 ? "meander" : "wait";
          a.timer = [128, 112, 96, 80, 64, 48][skill];
          a.palette = t === 3 ? 3 : 1;
        }
      }
      orient(a, 18);
      const oct = ((a.dir + 2) & 31) >> 2;
      a.frameId += [0, -1, -1, 0, 0, -1, 0, 1][oct];
      a.flipX = oct === 4 || oct === 5;
      a.flipY = false;
      if (a.state === "meander") a.frameId += (a.age >> 3) & 1 ? 3 : 0;
      if (t === 4) {
        a.water = true;
        a.frameId += (a.age >> 4) & 1 ? 0 : 3;
      }
    }
    tank(a) {
      const t = a.sourceType,
        d = a.data;
      const base =
        t === 10
          ? 51
          : t === 15
            ? this.stage === 6
              ? 181
              : 61
            : t === 7 || t === 36
              ? 34
              : 68;
      if (
        a.age %
          (t === 10 || t === 7 || t === 36
            ? 32
            : t === 15
              ? 8
              : t === 14
                ? 128
                : 16) ===
        0
      )
        this.turn(a, this.aim(a), 4);
      if (a.state === "move") {
        const factor =
          t === 10
            ? 32
            : t === 15
              ? 48
              : t === 14
                ? 16
                : t === 11 || t === 35
                  ? 17
                  : 18;
        this.move(a, factor, true);
        if (--a.timer <= 0) {
          a.state = "fire";
          a.timer = t === 10 ? 40 : t === 14 ? 48 : 80;
        }
      } else {
        if (--d.shotTimer <= 0) {
          d.shotTimer = t === 10 ? 16 : t === 15 ? 64 : 32;
          if (t === 14)
            this.spawn({ source_type: 52, x: a.x, y: a.y, dir: a.dir });
          else if (t === 15)
            this.spawn({ source_type: 55, x: a.x, y: a.y, bombFrom: 15 });
          else this.shot(a, t === 10 ? 2 : t === 11 || t === 35 ? 3 : 1, a.dir);
        }
        if (--a.timer <= 0) {
          a.state = "move";
          a.timer = t === 10 ? 40 : t === 15 ? 32 : t === 14 ? 48 : 80;
        }
      }
      orient(a, base);
      if (t === 14) a.palette = 1;
      if (t === 10 && a.hp <= 3) a.palette = (a.age >> 2) & 3;
    }
    turret(a) {
      const t = a.sourceType,
        d = a.data;
      if (t === 79) {
        const parent = this.actors.find((o) => o.sourceType === 75 && o.alive);
        if (!parent) {
          a.alive = false;
          return;
        }
        a.x = parent.x + 7;
        a.y = parent.y - 16;
        a.palette = parent.hp <= 42 ? 1 : 2;
      }
      if (t === 12) {
        if (!d.phase) {
          d.phase = "hidden";
          a.timer = 16;
          a.vulnerable = false;
          a.visible = false;
        }
        if (d.phase === "hidden") {
          if (--a.timer <= 0) {
            d.phase = "rising";
            a.timer = 24;
            a.visible = true;
          }
        } else if (d.phase === "rising") {
          a.frameId = 129 + Math.min(3, ((24 - a.timer) >> 3) + 1);
          if (--a.timer <= 0) {
            d.phase = "shoot";
            a.timer = 64 + (this.ctx.difficulty || 0) * 8;
            a.vulnerable = true;
          }
        } else if (d.phase === "shoot") {
          a.dir = this.aim(a);
          if (a.timer % 16 === 0 && a.dir >= 2 && a.dir <= 15) {
            this.shot(a, 7);
            d.recoil = 4;
          }
          a.frameId = d.recoil > 0 ? 133 : 132;
          if (d.recoil > 0) d.recoil--;
          if (--a.timer <= 0) {
            d.phase = "lowering";
            a.timer = 32;
          }
        } else {
          a.frameId = 129 + clamp(Math.ceil((a.timer - 8) / 8), 0, 3);
          if (--a.timer <= 0) {
            d.phase = "hidden";
            a.timer = 32;
            a.visible = false;
            a.vulnerable = false;
          }
        }
        return;
      }
      const delay =
        t === 79
          ? 2
          : Math.max(
              1,
              Math.floor(
                (13 - (this.stage - 1) - (this.ctx.difficulty || 0)) / 2,
              ),
            );
      if (a.state === "aim") {
        if (--d.rotateDelay <= 0) {
          this.turn(a, this.aim(a));
          d.rotateDelay = delay;
        }
        if (a.dir === this.aim(a)) {
          a.state = "lock";
          a.timer =
            t === 79
              ? 64
              : [64, 56, 48, 40, 32, 24][
                  clamp(
                    ((this.stage - 1 + (this.ctx.difficulty || 0)) / 2) | 0,
                    0,
                    5,
                  )
                ];
        }
      } else if (a.state === "recoil") {
        if (--a.timer <= 0) {
          a.state = "lock";
          a.timer = d.lockTimer;
        }
      } else {
        if (a.timer % 16 === 0) {
          const dir = t === 6 ? (a.dir + 2) & 28 : a.dir,
            v = velocity(dir, 40);
          this.shot(
            { x: a.x + v.x * 10, y: a.y + v.y * 10 },
            t === 79 ? 11 : t === 6 ? 13 : 12,
            dir,
          );
          d.lockTimer = a.timer - 1;
          a.state = "recoil";
          a.timer = 6;
        } else if (--a.timer <= 0) a.state = "aim";
      }
      orient(a, t === 79 ? 252 : 28);
      if (a.state === "recoil") a.frameId += 3;
    }
    statue(a) {
      const t = a.sourceType;
      if (t === 34 && (this.ctx.difficulty || 0) < 2) return;
      if (a.state === "closed") {
        if (--a.timer <= 0) {
          a.state = "eyes";
          a.timer = t === 24 ? 24 : 8;
        }
      } else if (a.state === "eyes") {
        a.backgroundFrame = 1 + ((a.age >> 2) & 1);
        if (--a.timer <= 0) {
          a.state = "mouth";
          a.timer = t === 24 ? 24 : 8;
          a.backgroundFrame = 3;
        }
      } else if (--a.timer <= 0) {
        this.missile(
          { x: a.x, y: a.y + 16 },
          t === 24 ? 1 : 0,
          t === 24 ? 8 : a.x < 256 ? 4 : 12,
        );
        a.state = "closed";
        a.timer = t === 24 ? 192 : 64;
        a.backgroundFrame = 0;
      }
    }
    spreadTurret(a) {
      const d = a.data,
        boss = d.bossVariant,
        last =
          boss &&
          this.boss != null &&
          this.boss.pending === 0 &&
          this.actors.filter(
            (o) =>
              o.alive &&
              o.sourceType === 18 &&
              o.bossPart &&
              o.state !== "dying",
          ).length === 1;
      if (a.state === "rising") {
        const elapsed = (d.nextRise ? 144 : 72) - a.timer;
        a.frameId =
          d.baseFrame + clamp((elapsed - (d.nextRise ? 80 : 8)) >> 4, 0, 3);
        a.vulnerable = elapsed >= (d.nextRise ? 80 : 8);
        if (--a.timer <= 0) {
          a.state = "aim";
          a.timer = last ? 9 : boss ? (d.slot || 0) * 4 : 24;
          a.vulnerable = true;
        }
      } else if (a.state === "aim") {
        a.frameId = d.baseFrame + 3;
        if (a.timer < 9) a.palette = a.age & 3;
        if (--a.timer <= 0) {
          const dir = this.aim(a);
          for (const offset of [-4, -2, 0, 2, 4])
            this.shot(a, boss ? 6 : 4, (dir + offset + 32) & 31);
          a.state = "retracting";
          a.timer = 80;
        }
      } else {
        a.frameId = d.baseFrame + clamp(3 - ((80 - a.timer) >> 4), 0, 3);
        a.vulnerable = a.timer > 16;
        if (--a.timer <= 0) {
          a.state = "rising";
          a.timer = last ? 1 : 144;
          d.nextRise = true;
          a.vulnerable = false;
        }
      }
    }
    door(a) {
      const d = a.data;
      if (a.state === "closed") {
        a.vulnerable = false;
        if (--a.timer <= 0) {
          a.state = "opening";
          a.timer = 32;
          d.openings = (d.openings + 1) & 255;
          if ((d.openings & 63) === 0) d.capacity = (d.capacity + 1) & 255;
        }
      } else if (a.state === "opening") {
        a.backgroundFrame = 20 - Math.min(3, (32 - a.timer) >> 3);
        if (--a.timer <= 0) {
          a.state = "open";
          a.timer = 32;
          a.vulnerable = true;
          a.hp = 3;
          a.backgroundFrame = 17;
          d.spawned = false;
        }
      } else if (a.state === "open") {
        a.vulnerable = true;
        a.hp = Math.max(a.hp, 3);
        a.frameId = a.age & 1 ? 255 : 0;
        if (--a.timer <= 0) {
          const active = this.actors.filter(
            (o) => o.alive && (o.sourceType === 35 || o.sourceType === 36),
          ).length;
          if (active < d.capacity) {
            const t = [35, 36, 36, 35][d.spawnOrder];
            d.spawnOrder = (d.spawnOrder + 1) & 3;
            d.spawned = !!this.spawn({
              source_type: t,
              x: a.x,
              y: a.y + 16,
              dir: 8,
            });
          }
          a.state = "closing";
          a.timer = 32;
          a.vulnerable = false;
          a.frameId = 0;
        }
      } else {
        a.backgroundFrame = 17 + Math.min(3, (32 - a.timer) >> 3);
        if (--a.timer <= 0) {
          a.state = "closed";
          a.timer = 256;
          a.backgroundFrame = 20;
        }
      }
    }
    helicopterBoss(a) {
      const cy =
          this.boss != null && this.boss.cameraY != null
            ? this.boss.cameraY
            : this.ctx.cameraY != null
              ? this.ctx.cameraY
              : 0,
        d = a.data;
      if (a.state === "waiting") {
        if (--a.timer <= 0) {
          a.state = "entering";
          a.timer = 144;
          a.x = clamp(a.x || 256, 160, 352);
          a.y = cy - 32;
          a.visible = true;
          a.vulnerable = true;
        }
      } else if (a.state === "entering") {
        a.dir = 8;
        this.move(
          a,
          [80, 64, 48, 33, 32, 17, 16, 1, 2, 0][
            Math.min(9, (144 - a.timer) >> 4)
          ],
          false,
        );
        if (a.timer % 32 === 0) this.shot(a, 9);
        if (--a.timer <= 0) {
          a.state = "hover";
          a.timer = 64;
          d.drop = 0;
        }
      } else if (a.state === "hover") {
        a.x += (a.age >> 2) & 1 ? 0.25 : -0.25;
        if ([48, 32, 16].includes(a.timer)) {
          this.spawn({
            source_type: 66,
            x: a.x + (a.x < 256 ? 16 : -16),
            y: a.y + 16,
            dir: a.x < 256 ? 0 : 16,
            dropIndex: d.drop++,
          });
        }
        if (--a.timer <= 0) {
          a.state = "leaving";
          a.timer = 144;
        }
      } else {
        a.dir = 24;
        this.move(
          a,
          [2, 1, 16, 17, 32, 33, 48, 64, 80][Math.min(8, (144 - a.timer) >> 4)],
          false,
        );
        if (a.timer % 32 === 0) this.shot(a, 9);
        if (--a.timer <= 0) {
          a.state = "waiting";
          a.timer = 128;
          a.visible = false;
          a.vulnerable = false;
        }
      }
      a.frameId = 126 + ((a.age >> 1) & 1);
      if (a.hp < 16) a.palette = (a.age >> 3) & 3;
    }
    paratrooper(a) {
      if (a.state === "outward") {
        this.move(a, 32, false);
        if (--a.timer <= 0) {
          a.state = "falling";
          a.timer = 96;
          a.dir = 6 + ((this.random() * 4) | 0);
        }
      } else {
        a.frameId = 172 + Math.min(2, (96 - a.timer) >> 5);
        this.move(a, 16, false);
        if (--a.timer <= 0) {
          const child = this.spawn({
            source_type: 1,
            x: a.x,
            y: a.y,
            score: 10,
          });
          if (child) a.alive = false;
        }
      }
    }
    hqTurret(a) {
      const d = a.data;
      if (a.state === "choose") {
        const i = (this.random() * 8) | 0;
        d.target = [12, 4, 12, 8, 12, 4, 4, 8][i];
        d.flight = [56, 84, 84, 68, 84, 56, 84, 68][i];
        a.state = "aim";
        d.rotateDelay = 7;
      } else if (a.state === "aim") {
        if (--d.rotateDelay <= 0) {
          this.turn(a, d.target);
          d.rotateDelay = 7;
        }
        if (a.dir === d.target) {
          a.state = "charge";
          a.timer = 7;
        }
      } else if (--a.timer <= 0) {
        this.spawn({
          source_type: 72,
          x: a.x,
          y: a.y,
          dir: a.dir,
          flightTime: d.flight,
        });
        a.state = "choose";
      }
      orient(a, 202);
      if (a.state === "charge") a.frameId += 2;
    }
    finalTank(a) {
      const d = a.data;
      if (!d.turretSpawned) {
        const child = this.bossPart(79, a.x + 7, a.y - 16);
        if (child) d.turretSpawned = true;
      }
      if (a.state === "moving") {
        this.move(a, 33, false);
        const screenX = a.x - (this.ctx.cameraX || 128);
        if (--a.timer <= 0 || screenX < 48 || screenX > 208) {
          a.state = "firing";
          a.timer = 32;
          this.spawn({ source_type: 76, x: a.x - 4, y: a.y + 46, dir: 8 });
        }
      } else {
        if (a.timer === 32 || a.timer === 16)
          this.spawn({ source_type: 77, x: a.x - 4, y: a.y + 62, dir: 8 });
        if (--a.timer <= 0) {
          a.state = "moving";
          a.timer = 32 + ((this.random() * 96) | 0);
          a.dir = a.x < (this.ctx.cameraX || 128) + 128 ? 0 : 16;
        }
      }
      a.frameId = 211;
      a.palette = a.hp <= 21 ? 1 : a.hp <= 42 ? 0 : 2;
      a.backgroundFrame = 10 + ((a.age >> 2) & 3);
    }
    flame(a) {
      if (a.sourceType === 76) {
        const elapsed = 80 - a.timer;
        a.frameId = (a.dir === 8 ? 213 : 229) + Math.min(15, elapsed);
        if (elapsed >= 16) a.y += 4;
      } else if (a.sourceType === 77) {
        a.y += 8;
        a.visible = false;
      } else {
        orient(a, 136);
        this.move(a, 32, false);
        a.frameId += ((a.age >> 3) & 1) * 3;
      }
      if (--a.timer <= 0) a.alive = false;
    }
    truck(a) {
      if (a.state === "wait") {
        if (--a.timer <= 0) {
          a.state = "driving";
          a.timer = 144;
        }
      } else if (a.state === "driving") {
        a.x += 0.625;
        if (--a.timer <= 0) {
          a.state = "stop";
          a.timer = 16;
        }
      } else if (a.state === "stop") {
        if (--a.timer <= 0) {
          a.state = "unload";
          a.timer = 1;
          a.frameId = 85;
        }
      } else if (--a.timer <= 0) {
        if (a.data.remaining > 0) {
          const child = this.spawn({ source_type: 1, x: a.x - 20, y: a.y });
          if (child) {
            a.data.remaining--;
            a.timer = 129;
          } else a.timer = 1;
        }
      }
    }
    submarine(a) {
      const d = a.data;
      if (a.state === "hidden") {
        a.vulnerable = false;
        a.frameId = 94;
        if (--a.timer <= 0) {
          a.state = "rising";
          a.timer = 32;
        }
      } else if (a.state === "rising") {
        a.frameId = 88 + Math.min(2, (32 - a.timer) >> 3);
        if (--a.timer <= 0) {
          a.state = "pre-fire";
          a.timer = 32;
          a.vulnerable = true;
        }
      } else if (a.state === "pre-fire") {
        if (--a.timer <= 0) {
          this.missile(a, 3, 24);
          a.state = "post-fire";
          a.timer = 64;
        }
      } else if (a.state === "post-fire") {
        if (--a.timer <= 0) {
          a.state = "diving";
          a.timer = 48;
        }
      } else if (a.state === "diving") {
        a.frameId = 90 - Math.min(2, (48 - a.timer) >> 4);
        if (--a.timer <= 0) {
          a.vulnerable = false;
          a.state = d.moves < 3 ? "moving" : "hidden";
          a.timer = d.moves < 3 ? 128 : 96;
          d.moves++;
        }
      } else {
        a.dir = 24;
        this.move(a, 16, false);
        a.frameId = 94;
        if (--a.timer <= 0) {
          a.state = "hidden";
          a.timer = 96;
        }
      }
    }
    spreadTruck(a) {
      if (a.state === "wait") {
        if (--a.timer <= 0) {
          a.state = "volley";
          a.timer = 1;
          a.data.wave = 0;
        }
      } else if (--a.timer <= 0) {
        const w = a.data.wave;
        if (w === 0) this.shot(a, 8, a.dir);
        else {
          this.shot(a, 8, (a.dir - w + 32) & 31);
          this.shot(a, 8, (a.dir + w) & 31);
        }
        a.data.wave++;
        a.frameId = 104;
        if (a.data.wave === 3) {
          a.state = "wait";
          a.timer = 48;
        } else a.timer = 9;
      } else a.frameId = a.timer > 5 ? 104 : 103;
      a.flipX = a.sourceType === 43;
    }
    launcher(a) {
      const t = a.sourceType;
      if (a.state === "hidden" || a.state === "wait") {
        if (--a.timer <= 0) {
          a.state = "opening";
          a.timer = t === 44 ? 16 : t === 45 ? 12 : 16;
          a.visible = true;
        }
      } else if (a.state === "opening") {
        a.frameId =
          t === 44
            ? 105 + ((16 - a.timer) >> 3)
            : t === 45
              ? 108 + Math.min(2, (12 - a.timer) >> 2)
              : 160;
        a.vulnerable = true;
        if (--a.timer <= 0) {
          this.missile(a, 2, 24);
          a.state = "closing";
          a.timer = t === 45 ? 12 : t === 44 ? 16 : 8;
        }
      } else {
        a.frameId =
          t === 45 ? 108 + Math.min(2, a.timer >> 2) : t === 46 ? 159 : 105;
        if (--a.timer <= 0) {
          a.state = "hidden";
          a.timer = 128;
          a.vulnerable = t === 44;
          a.visible = t === 44;
        }
      }
    }
    rock(a) {
      if (a.state === "waiting") {
        const p = this.target(a);
        if (p && a.age % 4 === 0 && Math.abs(p.y - a.y) < 64) {
          a.state = "falling";
          a.timer = 96;
          a.contact = true;
          a.dir = a.sourceType === 47 ? 4 : 12;
        }
      } else {
        const phase = (96 - a.timer) >> 4;
        a.dir = (a.sourceType === 47 ? 4 : 12) + (phase & 1 ? 2 : -2);
        this.move(a, [16, 32, 80, 64, 32, 16][phase], false);
        a.frameId = a.timer > 48 ? 124 : 125;
        a.flipX = !!(phase & 1);
        if (--a.timer <= 0) a.alive = false;
      }
    }
    tickProjectiles() {
      const c = this.ctx;
      for (const p of this.projectiles) {
        if (!p.alive) continue;
        if (p.state === "impact") {
          if (--p.life <= 0) p.alive = false;
          continue;
        }
        if (p.state === "exploding") {
          p.frameId = 25 + Math.min(1, (16 - p.life) >> 3);
          if (--p.life <= 0) p.alive = false;
          else
            for (const player of c.players || [])
              if (
                player.alive &&
                Math.hypot(p.x - player.x, p.y - player.y) < 14
              )
                if (c.damagePlayer != null) c.damagePlayer(player);
          continue;
        }
        if (p.kind === "missile") {
          if (--p.turnTimer <= 0) {
            p.turns++;
            if (p.turns % 32 === 0)
              p.turnInterval = Math.max(1, p.turnInterval - 1);
            p.turnTimer = p.turnInterval;
            this.turn(p, this.aim(p));
            if (p.turns >= p.maxTurns && p.mode !== 3) {
              p.state = "exploding";
              p.life = 16;
              p.vx = p.vy = 0;
              p.frameId = 25;
              this.effect(p);
              continue;
            }
          }
          const v = velocity(p.dir, p.speedFactor);
          p.vx = v.x;
          p.vy = v.y;
          orient(p, p.mode < 2 ? 75 : 112);
        } else p.visible = --p.hiddenTicks <= 0;
        p.x += p.vx;
        p.y += p.vy;
        if (
          p.x < 0 ||
          p.x > 512 ||
          p.y < (c.cameraY != null ? c.cameraY : 0) - 80 ||
          p.y > (c.cameraY != null ? c.cameraY : 0) + 320
        ) {
          p.alive = false;
          continue;
        }
        const terrain = c.terrainClass
          ? c.terrainClass(p.x, p.y)
          : c.terrainBlocked != null && c.terrainBlocked(p.x, p.y, 2)
            ? 1
            : 0;
        p.life--;
        if (
          p.kind === "bullet" &&
          (p.life <= 0 ||
            (p.bulletType < 14 &&
              p.life % 2 === 1 &&
              (terrain === 1 ||
                (terrain === 3 && this.stage === 6 && p.bulletType < 10))))
        ) {
          p.state = "impact";
          p.life = 8;
          p.frameId = p.frame = 17;
          p.visible = true;
          p.vx = p.vy = 0;
          this.effect(p, "bullet-impact");
          continue;
        }
        if (p.life <= 0) {
          p.alive = false;
          continue;
        }
        for (const player of c.players || [])
          if (
            player.alive &&
            player.joined !== false &&
            Math.hypot(p.x - player.x, p.y - player.y) < p.radius + 7
          ) {
            if (c.damagePlayer != null) c.damagePlayer(player);
            p.alive = false;
            break;
          }
      }
    }
  }
  const api = { EnemySystem, SPECS, velocity, direction, CORE_TYPES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.JackalEnemies = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
