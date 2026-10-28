/* Coast Kart TV — original deterministic racing rules, no external assets. */
(function (root) {
  "use strict";
  var TAU = Math.PI * 2;
  var TRACKS = [
    {
      id: "coast",
      name: ["晴海环线", "SUNSHORE CIRCUIT"],
      length: 5100,
      width: 1,
      turns: [
        [0.13, 0.1, 0.7],
        [0.36, 0.12, -0.85],
        [0.61, 0.09, 0.95],
        [0.82, 0.11, -0.7],
      ],
      hill: 32,
      theme: "coast",
    },
    {
      id: "forest",
      name: ["松林远征", "PINEWOOD RUN"],
      length: 5650,
      width: 0.88,
      turns: [
        [0.1, 0.07, -0.9],
        [0.26, 0.08, 1],
        [0.42, 0.06, -1.1],
        [0.59, 0.1, 0.95],
        [0.8, 0.09, -0.95],
      ],
      hill: 76,
      theme: "forest",
    },
    {
      id: "canyon",
      name: ["赤岩峡谷", "REDROCK RALLY"],
      length: 6100,
      width: 0.83,
      turns: [
        [0.15, 0.1, 1.2],
        [0.39, 0.11, -1.25],
        [0.63, 0.07, 1.1],
        [0.83, 0.09, -1.15],
      ],
      hill: 105,
      theme: "canyon",
    },
    {
      id: "harbor",
      name: ["星港夜航", "NEON HARBOR"],
      length: 5450,
      width: 0.94,
      turns: [
        [0.12, 0.06, -1.1],
        [0.3, 0.07, 1.1],
        [0.5, 0.07, 1.15],
        [0.7, 0.07, -1.15],
        [0.88, 0.05, 0.8],
      ],
      hill: 15,
      theme: "harbor",
    },
  ];
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function mod(v, n) {
    return ((v % n) + n) % n;
  }
  function curve(track, s) {
    var t = mod(s, track.length) / track.length,
      total = 0;
    track.turns.forEach(function (b) {
      var d = (t - b[0]) / b[1];
      if (Math.abs(d) < 1) total += b[2] * (0.5 + 0.5 * Math.cos(d * Math.PI));
    });
    return total;
  }
  function elevation(track, s) {
    return (
      Math.sin((s / track.length) * TAU * 2) * track.hill +
      Math.sin((s / track.length) * TAU * 3) * track.hill * 0.25
    );
  }
  function blank(id) {
    return {
      id: id,
      connected: false,
      x: 0,
      y: 0,
      a: false,
      b: false,
      start: false,
      select: false,
    };
  }
  function racer(id, human) {
    return {
      id: id,
      human: human,
      joined: human,
      alive: true,
      lives: 1,
      score: 0,
      level: 1,
      x: human ? (id === 1 ? -0.26 : 0.26) : ((id % 3) - 1) * 0.43,
      s: -Math.floor((id - 1) / 2) * 42,
      speed: 0,
      total: 0,
      nextCheckpoint: 1,
      lap: 1,
      rank: id,
      item: null,
      itemSerial: 0,
      boost: 0,
      shield: 0,
      stun: 0,
      drift: 0,
      drifting: false,
      recover: 0,
      finished: false,
      finishTime: 0,
      lapStart: 0,
      bestLap: 0,
      aiTimer: 0,
      collisionCooldown: 0,
      active: human,
      trail: 0,
    };
  }
  function CoastKartGame(options) {
    options = options || {};
    this.phase = "title";
    this.selectedPlayers = 1;
    this.trackIndex = 0;
    this.modeIndex = 0;
    this.modes = ["race", "cup", "time"];
    this.muted = !!options.muted;
    this.saveMuted = options.saveMuted || function () {};
    this.saveRecords = options.saveRecords || function () {};
    this.records = options.records || {};
    this.language = options.language || "zh";
    this.players = [racer(1, true), racer(2, true)];
    this.players[1].joined = false;
    this.racers = [];
    this.items = [];
    this.events = [];
    this.previous = {};
    this.menuHeld = 0;
    this.clock = 0;
    this.countdown = 3.2;
    this.cupRound = 0;
    this.cupPoints = {};
    this.resultOrder = [];
    this.pauseReason = "";
    this.resumePhase = "playing";
    this.rng = 1234567;
    this.tick = 0;
    this.bestUpdated = false;
    this.manualPause = false;
    this.track = TRACKS[0];
    this.selectedMode = "race";
    this.lastInputs = [];
  }
  CoastKartGame.TRACKS = TRACKS;
  CoastKartGame.curve = curve;
  CoastKartGame.elevation = elevation;
  CoastKartGame.prototype.random = function () {
    this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0;
    return this.rng / 4294967296;
  };
  CoastKartGame.prototype.emit = function (type, id) {
    this.events.push({ type: type, id: id || 0, tick: this.tick });
    if (this.events.length > 24) this.events.shift();
  };
  CoastKartGame.prototype.toggleMusic = function () {
    this.muted = !this.muted;
    this.saveMuted(this.muted);
  };
  CoastKartGame.prototype.start = function () {
    this.selectedMode = this.modes[this.modeIndex];
    if (this.selectedMode === "time") this.selectedPlayers = 1;
    this.cupRound = 0;
    this.cupPoints = {};
    this.beginRace(this.selectedMode === "cup" ? 0 : this.trackIndex);
  };
  CoastKartGame.prototype.beginRace = function (index) {
    this.trackIndex = index;
    this.track = TRACKS[index];
    this.clock = 0;
    this.countdown = 3.2;
    this.phase = "playing";
    this.pauseReason = "";
    this.manualPause = false;
    this.bestUpdated = false;
    this.items = [];
    this.resultOrder = [];
    this.rng = 20261028 + index * 703;
    this.players = [racer(1, true), racer(2, true)];
    this.players[1].joined = this.selectedPlayers === 2;
    this.players[1].active = this.players[1].joined;
    this.racers = this.players.filter(function (p) {
      return p.joined;
    });
    if (this.selectedMode !== "time")
      for (var n = 0; n < 6; n++) this.racers.push(racer(n + 3, false));
    this.racers.forEach(function (p, i) {
      p.s = -Math.floor(i / 2) * 42;
      p.total = p.s;
      p.rank = i + 1;
    });
    this.boxes = [];
    for (var g = 0; g < 4; g++)
      for (var lane = -1; lane <= 1; lane++)
        this.boxes.push({
          s: this.track.length * (0.14 + g * 0.23),
          x: lane * 0.57,
          ready: 0,
        });
    this.emit("start");
  };
  CoastKartGame.prototype.pause = function (reason) {
    if (this.phase === "playing") {
      this.phase = "paused";
      this.pauseReason = reason || "manual";
      this.manualPause = this.pauseReason === "manual";
      this.emit("pause");
    }
  };
  CoastKartGame.prototype.resume = function () {
    if (this.phase === "paused") {
      this.phase = "playing";
      this.pauseReason = "";
      this.manualPause = false;
      this.emit("resume");
    }
  };
  CoastKartGame.prototype.backToTitle = function () {
    this.phase = "title";
    this.pauseReason = "";
    this.manualPause = false;
    this.players.forEach(function (p) {
      p.finished = false;
    });
  };
  CoastKartGame.prototype.aiInput = function (p) {
    var bend = curve(this.track, p.s + 80),
      target = Math.sin(p.s / 510 + p.id * 2.4) * 0.3;
    var steering = clamp(
      (target - p.x) * 2.4 + bend * (p.speed / 180) * (p.speed / 180) * 0.48,
      -1,
      1,
    );
    return {
      id: p.id,
      connected: true,
      x: steering,
      y: Math.abs(bend) > 0.9 && p.speed > 151 ? 0.28 : 0,
      a: p.item && p.aiTimer < 0,
      b: Math.abs(bend) > 0.32 && Math.abs(bend) < 1.18,
    };
  };
  CoastKartGame.prototype.useItem = function (p) {
    if (!p.item || p.finished) return;
    var item = p.item;
    p.item = null;
    p.aiTimer = 1.3 + this.random() * 2;
    if (item === "boost") p.boost = Math.max(p.boost, 2.2);
    if (item === "shield") p.shield = 5;
    if (item === "trap")
      this.items.push({
        type: "trap",
        owner: p.id,
        s: mod(p.s - 65, this.track.length),
        x: p.x,
        life: 18,
        speed: 0,
      });
    if (item === "pulse")
      this.items.push({
        type: "pulse",
        owner: p.id,
        s: mod(p.s + 55, this.track.length),
        x: p.x,
        life: 5,
        speed: 300,
      });
    this.emit(item, p.id);
  };
  CoastKartGame.prototype.hit = function (p) {
    if (p.shield > 0) {
      p.shield = 0;
      this.emit("shield", p.id);
      return;
    }
    if (p.stun > 0 || p.finished) return;
    p.stun = 0.85;
    p.speed *= 0.43;
    p.drift = 0;
    this.emit("hit", p.id);
  };
  CoastKartGame.prototype.advance = function (p, delta) {
    var old = p.s;
    p.s += delta;
    p.total = p.s;
    // Signed unwrapped travel and strictly ordered quarter-lap gates prevent reverse-line and skipped-gate wins.
    if (delta > 0) {
      var gate = (p.nextCheckpoint * this.track.length) / 4;
      if (old < gate && p.s >= gate) {
        p.nextCheckpoint++;
        if ((p.nextCheckpoint - 1) % 4 === 0) {
          var lapTime = this.clock - p.lapStart;
          p.bestLap = p.bestLap ? Math.min(p.bestLap, lapTime) : lapTime;
          p.lapStart = this.clock;
          p.lap++;
          this.emit("lap", p.id);
          if (p.lap > 3) {
            p.finished = true;
            p.finishTime = this.clock;
            p.speed = 0;
            this.resultOrder.push(p.id);
            this.emit("finish", p.id);
          }
        }
      }
    }
  };
  CoastKartGame.prototype.drive = function (p, input, dt) {
    if (p.finished) return;
    p.aiTimer -= dt;
    p.boost = Math.max(0, p.boost - dt);
    p.shield = Math.max(0, p.shield - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.collisionCooldown = Math.max(0, p.collisionCooldown - dt);
    p.recover = Math.max(0, p.recover - dt);
    var bend = curve(this.track, p.s),
      steer = clamp(Number(input.x) || 0, -1, 1),
      brake = clamp(Number(input.y) || 0, 0, 1);
    var road = this.track.width;
    var max = p.human ? 184 : 167 + (p.id % 3) * 3,
      off = Math.abs(p.x) > road;
    if (p.boost > 0) max = 252;
    if (off) max *= 0.47;
    if (p.stun > 0) max = 52;
    if (brake > 0.45) max = -48;
    if (p.recover > 0) {
      p.speed = 0;
      p.x *= Math.max(0, 1 - dt * 5);
      return;
    }
    var accel = brake > 0.45 ? 190 : off ? 145 : 92;
    p.speed += (max - p.speed) * Math.min(1, (dt * accel) / 80);
    var drift =
      !!input.b &&
      p.speed > 85 &&
      Math.abs(steer) > 0.14 &&
      !off &&
      p.stun <= 0;
    if (drift) {
      p.drift = Math.min(2.5, p.drift + dt);
      p.drifting = true;
    } else {
      if (p.drifting && !input.b && p.drift > 0.65) {
        p.boost = Math.max(p.boost, p.drift > 1.6 ? 1.65 : 0.85);
        this.emit("drift", p.id);
      }
      p.drifting = false;
      p.drift = 0;
    }
    var motion = clamp(Math.abs(p.speed) / 130, 0, 1.6),
      direction = p.speed >= 0 ? 1 : -1;
    p.x +=
      (steer * (drift ? 1.65 : 1.3) * motion * direction -
        bend * Math.pow(p.speed / 180, 2) * 0.63) *
      dt;
    if (Math.abs(p.x) > 1.65) {
      p.x = clamp(p.x, -1.65, 1.65);
      p.recover = 0.7;
      p.speed = 0;
      p.drift = 0;
      this.emit("recover", p.id);
    }
    var oldS = p.s;
    this.advance(p, p.speed * dt);
    p.trail += dt;
    if (this.selectedMode !== "time" && !p.item && p.speed > 0) {
      for (var i = 0; i < this.boxes.length; i++) {
        var box = this.boxes[i],
          next =
            box.s + Math.floor(oldS / this.track.length) * this.track.length;
        if (next < oldS) next += this.track.length;
        if (
          oldS < next &&
          p.s >= next &&
          Math.abs(p.x - box.x) < 0.3 &&
          box.ready <= this.clock
        ) {
          p.item = ["boost", "shield", "trap", "pulse"][
            (p.itemSerial++ + p.id + this.trackIndex) % 4
          ];
          box.ready = this.clock + 2.5;
          this.emit("item", p.id);
          break;
        }
      }
    }
  };
  CoastKartGame.prototype.ranks = function () {
    var self = this,
      ordered = this.racers.slice().sort(function (a, b) {
        if (a.finished && b.finished)
          return (
            self.resultOrder.indexOf(a.id) - self.resultOrder.indexOf(b.id)
          );
        if (a.finished) return -1;
        if (b.finished) return 1;
        return b.total - a.total;
      });
    ordered.forEach(function (p, i) {
      p.rank = i + 1;
    });
    return ordered;
  };
  CoastKartGame.prototype.finishRace = function () {
    this.ranks();
    this.phase = "results";
    var self = this;
    var points = [15, 12, 10, 8, 6, 4, 2, 1];
    this.racers.forEach(function (p) {
      p.score = points[p.rank - 1] || 0;
      self.cupPoints[p.id] = (self.cupPoints[p.id] || 0) + p.score;
    });
    this.players
      .filter(function (p) {
        return p.joined && p.finished;
      })
      .forEach(function (p) {
        var key =
            self.track.id + (self.selectedMode === "time" ? "-time" : "-race"),
          old = Number(self.records[key]) || 0;
        if (!old || p.finishTime < old) {
          self.records[key] = p.finishTime;
          self.bestUpdated = true;
        }
        var lapKey = self.track.id + "-lap";
        if (!self.records[lapKey] || p.bestLap < self.records[lapKey])
          self.records[lapKey] = p.bestLap;
      });
    if (this.selectedMode === "cup" && this.cupRound === 3) {
      var best = Math.max(this.cupPoints[1] || 0, this.cupPoints[2] || 0);
      this.records.cup = Math.max(Number(this.records.cup) || 0, best);
    }
    this.saveRecords(this.records);
    this.emit("results");
  };
  CoastKartGame.prototype.step = function (dt, inputs) {
    dt = clamp(Number(dt) || 0, 0, 0.1);
    inputs = inputs || [];
    this.tick++;
    this.lastInputs = inputs;
    var self = this,
      map = {},
      start = false,
      select = false;
    inputs.forEach(function (i) {
      if (i.id !== 1 && i.id !== 2) return;
      map[i.id] = i;
      var old = self.previous[i.id] || {};
      if (i.connected && i.start && !old.start) start = true;
      if (i.connected && i.select && !old.select) select = true;
    });
    var p1 = map[1] || blank(1);
    if (this.phase === "title") {
      if (select) {
        this.selectedPlayers = this.selectedPlayers === 1 ? 2 : 1;
        if (this.selectedPlayers === 2 && this.modeIndex === 2)
          this.modeIndex = 0;
      }
      this.menuHeld = Math.max(0, this.menuHeld - dt);
      if (this.menuHeld <= 0 && p1.connected) {
        if (Math.abs(p1.x) > 0.55) {
          this.trackIndex = mod(this.trackIndex + (p1.x > 0 ? 1 : -1), 4);
          this.track = TRACKS[this.trackIndex];
          this.menuHeld = 0.24;
        } else if (Math.abs(p1.y) > 0.55) {
          this.modeIndex = mod(this.modeIndex + (p1.y > 0 ? 1 : -1), 3);
          if (this.modeIndex === 2) this.selectedPlayers = 1;
          this.menuHeld = 0.24;
        }
      }
      this.players[0].joined = true;
      this.players[1].joined = this.selectedPlayers === 2;
      this.players[1].active = this.players[1].joined;
      if (
        start &&
        p1.connected &&
        (this.selectedPlayers === 1 || (map[2] && map[2].connected))
      )
        this.start();
    } else if (this.phase === "results") {
      if (select) this.backToTitle();
      else if (start) {
        if (this.selectedMode === "cup" && this.cupRound < 3) {
          this.cupRound++;
          this.beginRace(this.cupRound);
        } else if (this.selectedMode === "cup") {
          this.phase = "ending";
        } else this.start();
      }
    } else if (this.phase === "ending") {
      if (start || select) this.backToTitle();
    } else {
      var missing = this.players.some(function (p) {
        return p.joined && (!map[p.id] || !map[p.id].connected);
      });
      if (this.phase === "playing" && missing) this.pause("controller");
      else if (
        this.phase === "paused" &&
        this.pauseReason === "controller" &&
        !missing
      )
        this.resume();
      else if (start) {
        if (this.phase === "playing") this.pause("manual");
        else if (!missing) this.resume();
      }
      if (this.phase === "paused" && select) this.toggleMusic();
      if (this.phase === "playing") {
        if (this.countdown > 0) {
          this.countdown -= dt;
          if (this.countdown <= 0) this.emit("go");
        } else {
          this.clock += dt;
          this.racers.forEach(function (p) {
            var input = p.human ? map[p.id] || blank(p.id) : self.aiInput(p);
            var old = self.previous[p.id] || {};
            if (input.a && (!p.human || !old.a)) self.useItem(p);
            self.drive(p, input, dt);
          });
          this.items.forEach(function (item) {
            item.life -= dt;
            item.s = mod(item.s + item.speed * dt, self.track.length);
            self.racers.forEach(function (p) {
              var d =
                mod(p.s - item.s + self.track.length / 2, self.track.length) -
                self.track.length / 2;
              if (
                item.life > 0 &&
                p.id !== item.owner &&
                Math.abs(d) < 37 &&
                Math.abs(p.x - item.x) < 0.27
              ) {
                self.hit(p);
                item.life = 0;
              }
            });
          });
          this.items = this.items.filter(function (i) {
            return i.life > 0;
          });
          for (var i = 0; i < this.racers.length; i++)
            for (var j = i + 1; j < this.racers.length; j++) {
              var a = this.racers[i],
                b = this.racers[j];
              if (
                !a.finished &&
                !b.finished &&
                Math.abs(a.s - b.s) < 22 &&
                Math.abs(a.x - b.x) < 0.22 &&
                a.collisionCooldown <= 0 &&
                b.collisionCooldown <= 0
              ) {
                var side = a.x >= b.x ? 1 : -1;
                a.x += side * 0.1;
                b.x -= side * 0.1;
                a.speed *= 0.91;
                b.speed *= 0.91;
                a.collisionCooldown = b.collisionCooldown = 0.5;
              }
            }
          this.ranks();
          if (
            this.players.every(function (p) {
              return !p.joined || p.finished;
            })
          )
            this.finishRace();
        }
      }
    }
    this.previous = {};
    inputs.forEach(function (p) {
      self.previous[p.id] = {
        a: !!p.a,
        b: !!p.b,
        start: !!p.start,
        select: !!p.select,
      };
    });
  };
  CoastKartGame.prototype.status = function () {
    var self = this;
    return {
      game: "coast-kart",
      phase: this.phase,
      selectedPlayers: this.selectedPlayers,
      mode:
        this.phase === "title" ? this.modes[this.modeIndex] : this.selectedMode,
      track: this.track.id,
      trackIndex: this.trackIndex,
      cupRound: this.cupRound + 1,
      muted: this.muted,
      pauseReason: this.pauseReason,
      countdown: Math.max(0, Math.ceil(this.countdown)),
      time: Math.round(this.clock),
      best: Number(this.records[this.track.id + "-time"]) || 0,
      players: this.players.map(function (p) {
        return {
          id: p.id,
          joined: p.joined,
          alive: true,
          lives: 1,
          score: self.cupPoints[p.id] || p.score,
          level: Math.min(3, p.lap),
          stageLabel:
            self.track.name[self.language.indexOf("en") === 0 ? 1 : 0],
          active: p.joined,
          lap: Math.min(3, p.lap),
          rank: p.rank,
          item: p.item || "",
          finished: p.finished,
        };
      }),
    };
  };
  root.CoastKartGame = CoastKartGame;
  if (typeof module !== "undefined" && module.exports)
    module.exports = CoastKartGame;
})(typeof window !== "undefined" ? window : globalThis);
