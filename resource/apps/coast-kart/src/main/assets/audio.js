/* Original synthesized score and effects; generated locally with Web Audio. */
(function (root) {
  "use strict";
  function CoastKartAudio() {
    this.context = null;
    this.master = null;
    this.engine = null;
    this.engineGain = null;
    this.paused = false;
    this.lastNote = 0;
    this.note = 0;
    this.eventTick = 0;
    this.disposed = false;
  }
  CoastKartAudio.prototype.unlock = function () {
    if (this.disposed) return Promise.resolve();
    var Context = root.AudioContext || root.webkitAudioContext;
    if (!Context) return Promise.resolve();
    if (!this.context) {
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.context.destination);
      this.engine = this.context.createOscillator();
      this.engine.type = "triangle";
      this.engineGain = this.context.createGain();
      this.engineGain.gain.value = 0;
      this.engine.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engine.start();
    }
    return this.context.state === "suspended"
      ? this.context.resume()
      : Promise.resolve();
  };
  CoastKartAudio.prototype.tone = function (freq, length, volume, type) {
    if (!this.context || this.context.state !== "running" || this.disposed)
      return;
    var c = this.context,
      o = c.createOscillator(),
      g = c.createGain(),
      t = c.currentTime;
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + length);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + length + 0.02);
    o.onended = function () {
      o.disconnect();
      g.disconnect();
    };
  };
  CoastKartAudio.prototype.pause = function (value) {
    this.paused = !!value;
    if (value && this.master) this.master.gain.value = 0;
  };
  CoastKartAudio.prototype.update = function (game) {
    if (!this.context || this.disposed) return;
    this.master.gain.value = this.paused || game.muted ? 0 : 0.18;
    if (this.paused || game.muted) return;
    var p = game.players[0],
      playing = game.phase === "playing" && game.countdown <= 0;
    this.engineGain.gain.value = playing ? 0.08 : 0;
    this.engine.frequency.setTargetAtTime(
      45 + Math.max(0, p.speed) * 0.55,
      this.context.currentTime,
      0.08,
    );
    var scale = [
        60, 64, 67, 72, 69, 67, 64, 62, 60, 67, 69, 76, 74, 72, 67, 64,
      ],
      now = this.context.currentTime;
    if (now >= this.lastNote) {
      this.lastNote = now + 0.22;
      var midi =
        scale[this.note % scale.length] + (game.trackIndex === 3 ? -5 : 0);
      this.tone(440 * Math.pow(2, (midi - 69) / 12), 0.15, 0.21, "triangle");
      if (this.note % 4 === 0)
        this.tone(110 * Math.pow(2, game.trackIndex / 12), 0.3, 0.13, "sine");
      this.note++;
    }
    var self = this;
    game.events.forEach(function (e) {
      if (e.tick <= self.eventTick) return;
      if (e.type === "item") self.tone(880, 0.18, 0.45, "sine");
      else if (e.type === "drift" || e.type === "boost")
        self.tone(650, 0.28, 0.5, "triangle");
      else if (e.type === "hit") self.tone(90, 0.2, 0.5, "sawtooth");
      else if (e.type === "lap" || e.type === "finish")
        self.tone(1046, 0.5, 0.4, "triangle");
      else if (e.type === "go") self.tone(740, 0.3, 0.5, "square");
    });
    this.eventTick = game.tick;
  };
  CoastKartAudio.prototype.dispose = function () {
    this.disposed = true;
    if (this.engine) {
      try {
        this.engine.stop();
        this.engine.disconnect();
      } catch (_) {}
    }
    if (this.context && this.context.state !== "closed")
      this.context.close().catch(function () {});
  };
  root.CoastKartAudio = CoastKartAudio;
})(window);
