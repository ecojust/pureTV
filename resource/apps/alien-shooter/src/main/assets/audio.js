/* Original procedural weapon effects and industrial ambience. No recordings. */
(function (root) {
  "use strict";
  class AlienShooterAudio {
    constructor() {
      this.context = null;
      this.master = null;
      this.noiseBuffer = null;
      this.muted = false;
      this.paused = true;
      this.disposed = false;
      this.notes = new Set();
      this.drones = [];
      this.lastEvent = 0;
      this.lastFootstep = -1;
      this.lastAtmosphere = -1;
      this.resumePromise = null;
      this.lastDamage = -1000;
    }
    unlock() {
      if (this.disposed) return Promise.resolve();
      try {
        var Audio = root.AudioContext || root.webkitAudioContext;
        if (!Audio) return Promise.resolve();
        if (!this.context) {
          this.context = new Audio();
          var c = this.context;
          this.master = c.createGain();
          this.master.gain.value = this.paused || this.muted ? 0 : .16;
          var compressor = c.createDynamicsCompressor();
          compressor.threshold.value = -18; compressor.knee.value = 14;
          compressor.ratio.value = 4; compressor.attack.value = .004; compressor.release.value = .15;
          this.master.connect(compressor); compressor.connect(c.destination);
          this.noiseBuffer = c.createBuffer(1, Math.ceil(c.sampleRate * 1.5), c.sampleRate);
          var data = this.noiseBuffer.getChannelData(0), previous = 0;
          for (var i = 0; i < data.length; i++) { previous = (previous + Math.random() * 2 - 1) * .48; data[i] = previous; }
          this.startAmbience();
        }
        if (this.context.state === "suspended" && !this.resumePromise) {
          var self = this;
          this.resumePromise = Promise.resolve(this.context.resume()).catch(function () {}).then(function () { self.resumePromise = null; });
          return this.resumePromise;
        }
      } catch (_) {}
      return Promise.resolve();
    }
    startAmbience() {
      var c = this.context, self = this;
      [48, 72.13].forEach(function (frequency, index) {
        var oscillator = c.createOscillator(), gain = c.createGain();
        oscillator.type = "sine"; oscillator.frequency.value = frequency;
        gain.gain.value = index ? .035 : .05;
        oscillator.connect(gain); gain.connect(self.master); oscillator.start();
        self.drones.push({ source: oscillator, gain: gain });
      });
    }
    allowed() { return !!(this.context && this.master && !this.muted && !this.paused && !this.disposed && this.notes.size < 52); }
    voice(source, filter, volume, duration, delay, pan) {
      if (!this.allowed()) return;
      var c = this.context, envelope = c.createGain(), now = c.currentTime + (delay || 0), output = envelope;
      envelope.gain.setValueAtTime(.0001, now);
      envelope.gain.exponentialRampToValueAtTime(Math.max(.001, volume), now + .003);
      envelope.gain.exponentialRampToValueAtTime(.0001, now + duration);
      if (filter) { source.connect(filter); filter.connect(envelope); } else source.connect(envelope);
      var panner = null;
      if (c.createStereoPanner) { panner = c.createStereoPanner(); panner.pan.value = Math.max(-.7, Math.min(.7, pan || 0)); envelope.connect(panner); output = panner; }
      output.connect(this.master);
      var self = this;
      this.notes.add(source);
      source.onended = function () { self.notes.delete(source); source.disconnect(); envelope.disconnect(); if (filter) filter.disconnect(); if (panner) panner.disconnect(); };
      source.start(now); source.stop(now + duration + .02);
    }
    tone(from, to, duration, type, volume, delay, pan) {
      if (!this.allowed()) return;
      var c = this.context, oscillator = c.createOscillator(), at = c.currentTime + (delay || 0);
      oscillator.type = type || "sine";
      oscillator.frequency.setValueAtTime(Math.max(20, from), at);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration);
      this.voice(oscillator, null, volume, duration, delay, pan);
    }
    noise(duration, frequency, type, volume, delay, pan) {
      if (!this.allowed()) return;
      var source = this.context.createBufferSource(), filter = this.context.createBiquadFilter();
      source.buffer = this.noiseBuffer;
      source.playbackRate.value = .85 + Math.random() * .3;
      filter.type = type || "lowpass"; filter.frequency.value = frequency; filter.Q.value = .65;
      this.voice(source, filter, volume, duration, delay, pan);
    }
    gun(weapon, pan) {
      if (weapon === "shotgun") {
        this.noise(.29, 2500, "lowpass", .88, 0, pan);
        this.tone(125, 34, .24, "triangle", .62, 0, pan);
        this.noise(.09, 4600, "highpass", .15, .22, pan);
      } else if (weapon === "plasma") {
        this.tone(1400, 160, .17, "sawtooth", .16, 0, pan);
        this.tone(430, 55, .25, "sine", .4, .01, pan);
        this.noise(.12, 1800, "bandpass", .16, 0, pan);
      } else if (weapon === "minigun") {
        this.noise(.085, 1900, "lowpass", .55, 0, pan);
        this.tone(95, 42, .075, "triangle", .37, 0, pan);
      } else if (weapon === "smg") {
        this.noise(.07, 3500, "lowpass", .42, 0, pan);
        this.tone(150, 58, .065, "triangle", .28, 0, pan);
      } else {
        this.noise(.13, 3000, "lowpass", .55, 0, pan);
        this.tone(190, 47, .12, "triangle", .4, 0, pan);
        this.noise(.035, 5900, "highpass", .06, .11, pan);
      }
    }
    play(event, game) {
      var players = (game.players || []).filter(function (p) { return p.active; });
      var center = players.length ? players.reduce(function (sum, p) { return sum + p.x; }, 0) / players.length : 24;
      var pan = (event.x - center) / 18;
      switch (event.kind) {
        case "shot": this.gun(event.weapon, pan); break;
        case "hit": this.noise(.07, 900, "lowpass", .19, 0, pan); break;
        case "enemy-death":
          this.noise(.17, 650, "lowpass", .28, 0, pan);
          if (event.enemyType === "brute" || event.enemyType === "boss") this.tone(118, 32, .43, "sawtooth", .12, 0, pan);
          break;
        case "player-hit":
          if (game.elapsed - this.lastDamage > .12) { this.tone(90, 32, .25, "sine", .55); this.noise(.16, 480, "lowpass", .3); this.lastDamage = game.elapsed; }
          break;
        case "explosion":
          this.noise(event.large ? .9 : .55, 1050, "lowpass", .95, 0, pan);
          this.tone(95, 24, .6, "sine", .85, 0, pan);
          this.noise(.24, 3600, "highpass", .23, .05, pan);
          break;
        case "pickup":
          this.tone(680, 940, .07, "sine", .26);
          this.tone(1020, 1020, .13, "sine", .18, .07);
          break;
        case "objective":
        case "door":
          this.tone(320, 320, .18, "sine", .2);
          this.tone(480, 480, .24, "sine", .18, .17);
          this.noise(.6, 340, "lowpass", .22, .12);
          break;
        case "revive":
        case "stage-clear":
          this.tone(330, 330, .2, "triangle", .22);
          this.tone(440, 440, .23, "triangle", .19, .13);
          this.tone(660, 660, .4, "sine", .18, .28);
          break;
        case "weapon": this.noise(.07, 4200, "highpass", .2); this.noise(.06, 1700, "bandpass", .12, .065); break;
        case "deny": this.tone(150, 120, .16, "triangle", .17); break;
      }
    }
    update(game) {
      var events = game.events || [];
      var newest = events.length ? events[events.length - 1].id : this.lastEvent;
      if (newest < this.lastEvent) this.lastEvent = 0;
      for (var i = 0; i < events.length; i++) if (events[i].id > this.lastEvent && this.allowed()) this.play(events[i], game);
      this.lastEvent = newest;
      if (!this.allowed()) return;
      var step = Math.floor(game.elapsed / .29);
      if (step !== this.lastFootstep && game.players.some(function (p) { return p.active && p.moving && !p.downed; })) {
        this.lastFootstep = step; this.noise(.065, step % 2 ? 620 : 510, "lowpass", .095); this.tone(68, 42, .06, "sine", .09);
      }
      var beat = Math.floor(game.elapsed / 3.1);
      if (beat !== this.lastAtmosphere) {
        this.lastAtmosphere = beat;
        this.tone(58, 46, .8, "sine", .11);
        if (game.stage === 2 && beat % 2 === 0) { this.tone(390, 360, .2, "sine", .045); this.tone(390, 360, .2, "sine", .04, .35); }
      }
    }
    applyVolume() {
      if (this.context && this.master) this.master.gain.setTargetAtTime(this.muted || this.paused ? 0 : .16, this.context.currentTime, .035);
    }
    setMuted(value) { if (this.muted !== !!value) { this.muted = !!value; this.applyVolume(); } }
    pause(value) { if (this.paused !== !!value) { this.paused = !!value; this.applyVolume(); } }
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.notes.forEach(function (source) { try { source.stop(); } catch (_) {} });
      this.notes.clear();
      this.drones.forEach(function (voice) { try { voice.source.stop(); } catch (_) {} voice.source.disconnect(); voice.gain.disconnect(); });
      this.drones = [];
      if (this.context && this.context.state !== "closed") this.context.close().catch(function () {});
    }
  }
  root.AlienShooterAudio = AlienShooterAudio;
})(window);
