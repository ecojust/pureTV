/* Original short chiptune composition and synthesized effects, not game soundtrack. */
(function (root) {
  "use strict";
  function BombJackAudio() {
    this.ctx = null;
    this.master = null;
    this.nodes = [];
    this.silent = false;
    this.disposed = false;
    this.lastEvent = 0;
    this.nextNote = 0;
    this.noteIndex = 0;
  }
  BombJackAudio.prototype.unlock = function () {
    var self = this;
    if (this.disposed) return Promise.resolve();
    if (!this.ctx) {
      var C = root.AudioContext || root.webkitAudioContext;
      if (!C) return Promise.resolve();
      try {
        this.ctx = new C();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.12;
        this.master.connect(this.ctx.destination);
      } catch (_) {
        return Promise.resolve();
      }
    }
    return this.ctx.state === "suspended"
      ? this.ctx.resume().catch(function () {})
      : Promise.resolve();
  };
  BombJackAudio.prototype.tone = function (
    freq,
    duration,
    type,
    volume,
    slide,
  ) {
    if (
      !this.ctx ||
      this.ctx.state !== "running" ||
      this.disposed ||
      this.silent
    )
      return;
    var self = this,
      o = this.ctx.createOscillator(),
      v = this.ctx.createGain(),
      now = this.ctx.currentTime;
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, now);
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(30, slide),
        now + duration,
      );
    v.gain.setValueAtTime(volume || 0.18, now);
    v.gain.exponentialRampToValueAtTime(0.001, now + duration);
    o.connect(v);
    v.connect(this.master);
    o.start();
    o.stop(now + duration + 0.015);
    this.nodes.push(o);
    o.onended = function () {
      var i = self.nodes.indexOf(o);
      if (i >= 0) self.nodes.splice(i, 1);
      o.disconnect();
      v.disconnect();
    };
  };
  BombJackAudio.prototype.pause = function (value) {
    this.silent = !!value;
    if (this.master) this.master.gain.value = value ? 0 : 0.12;
  };
  BombJackAudio.prototype.update = function (game) {
    if (!this.ctx || this.disposed) return;
    if (this.master)
      this.master.gain.value = this.silent || game.muted ? 0 : 0.12;
    if (game.muted || this.silent) return;
    for (var i = 0; i < game.events.length; i++) {
      var e = game.events[i];
      if (e.id <= this.lastEvent) continue;
      this.lastEvent = e.id;
      if (e.type === "jump") this.tone(240, 0.12, "square", 0.16, 500);
      else if (e.type === "bomb" || e.type === "coin")
        this.tone(920, 0.08, "square", 0.12, 1300);
      else if (e.type === "flame") this.tone(1200, 0.1, "triangle", 0.26, 1800);
      else if (e.type === "death") this.tone(320, 0.5, "sawtooth", 0.16, 45);
      else if (e.type === "power") this.tone(180, 0.4, "square", 0.16, 1100);
      else if (e.type === "danger") this.tone(140, 0.4, "sawtooth", 0.2, 60);
      else this.tone(640, 0.13, "triangle", 0.23, 850);
    }
    if (game.phase !== "playing") return;
    var now = this.ctx.currentTime;
    if (now >= this.nextNote) {
      var notes = [
          64, 67, 71, 76, 74, 71, 69, 67, 62, 66, 69, 74, 72, 69, 67, 66, 60,
          64, 67, 72, 71, 67, 66, 64, 59, 62, 66, 71, 69, 66, 64, 62,
        ],
        note = notes[this.noteIndex % notes.length];
      this.tone(440 * Math.pow(2, (note - 69) / 12), 0.14, "square", 0.065);
      if (this.noteIndex % 4 === 0)
        this.tone(
          440 * Math.pow(2, (note - 24 - 69) / 12),
          0.25,
          "triangle",
          0.18,
        );
      this.noteIndex++;
      this.nextNote = now + 0.18;
    }
  };
  BombJackAudio.prototype.dispose = function () {
    this.disposed = true;
    this.nodes.slice().forEach(function (n) {
      try {
        n.stop();
      } catch (_) {}
    });
    this.nodes = [];
    if (this.master) this.master.disconnect();
    if (this.ctx) this.ctx.close().catch(function () {});
    this.ctx = null;
  };
  root.BombJackAudio = BombJackAudio;
})(window);
