/* Original short synthesized effects and an original 8-bit accompaniment. */
(function (root) {
  "use strict";
  function AdventureAudio() {
    this.context = null;
    this.master = null;
    this.nodes = new Set();
    this.paused = false;
    this.disposed = false;
    this.lastEvent = 0;
    this.musicStep = 0;
    this.nextBeat = 0;
    this.musicEnabled = true;
  }
  AdventureAudio.prototype.unlock = function () {
    if (this.disposed) return Promise.resolve();
    var Audio = root.AudioContext || root.webkitAudioContext;
    if (!Audio) return Promise.resolve();
    if (!this.context) {
      try {
        this.context = new Audio();
        this.master = this.context.createGain();
        this.master.gain.value = 0.09;
        this.master.connect(this.context.destination);
      } catch (_) {
        return Promise.resolve();
      }
    }
    if (this.paused)
      return this.context.state === "running"
        ? this.context.suspend()
        : Promise.resolve();
    return this.context.state === "suspended"
      ? this.context.resume()
      : Promise.resolve();
  };
  AdventureAudio.prototype.tone = function (
    note,
    time,
    length,
    wave,
    volume,
    music,
  ) {
    var ctx = this.context,
      self = this;
    if (
      !ctx ||
      this.disposed ||
      this.paused ||
      note === null ||
      this.nodes.size >= 24
    )
      return;
    var oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    var record = { oscillator: oscillator, gain: gain, music: !!music };
    this.nodes.add(record);
    oscillator.type = wave || "square";
    oscillator.frequency.setValueAtTime(
      440 * Math.pow(2, (note - 69) / 12),
      time,
    );
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume || 0.22, time + 0.004);
    gain.gain.setValueAtTime(
      volume || 0.22,
      time + Math.max(0.005, length * 0.7),
    );
    gain.gain.linearRampToValueAtTime(0, time + length);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.onended = function () {
      self.nodes.delete(record);
      try {
        oscillator.disconnect();
        gain.disconnect();
      } catch (_) {}
    };
    oscillator.start(time);
    oscillator.stop(time + length + 0.01);
  };
  AdventureAudio.prototype.stop = function (musicOnly) {
    this.nodes.forEach(function (record) {
      if (!musicOnly || record.music) {
        try {
          record.oscillator.stop();
        } catch (_) {}
        try {
          record.gain.disconnect();
        } catch (_) {}
      }
    });
    if (!musicOnly) this.nodes.clear();
  };
  AdventureAudio.prototype.pause = function (value) {
    value = !!value;
    if (this.paused === value || this.disposed) return;
    this.paused = value;
    this.nextBeat = 0;
    if (!this.context) return;
    if (value) {
      this.stop(false);
      if (this.context.state === "running")
        this.context.suspend().catch(function () {});
    } else if (this.context.state === "suspended")
      this.context.resume().catch(function () {});
  };
  AdventureAudio.prototype.effect = function (event) {
    if (!this.context || this.context.state !== "running" || this.paused)
      return;
    var now = this.context.currentTime,
      self = this;
    if (event.type === "jump") {
      this.tone(70, now, 0.07, "square", 0.17, false);
      this.tone(77, now + 0.05, 0.07, "square", 0.14, false);
    } else if (event.type === "throw")
      this.tone(49, now, 0.07, "triangle", 0.35, false);
    else if (event.type === "pickup" || event.type === "reveal")
      [76, 81, 88].forEach(function (note, i) {
        self.tone(note, now + i * 0.04, 0.08, "square", 0.16, false);
      });
    else if (event.type === "enemy" || event.type === "boss-hit") {
      this.tone(48, now, 0.04, "square", 0.22, false);
      this.tone(40, now + 0.04, 0.07, "triangle", 0.3, false);
    } else if (
      event.type === "clear" ||
      event.type === "boss" ||
      event.type === "life" ||
      event.type === "ending"
    )
      [72, 76, 79, 84, 91].forEach(function (note, i) {
        self.tone(note, now + i * 0.09, 0.15, "square", 0.18, false);
      });
    else if (event.type === "stage" || event.type === "start")
      [67, 72, 76].forEach(function (note, i) {
        self.tone(note, now + i * 0.08, 0.1, "triangle", 0.3, false);
      });
    else if (event.type === "death" || event.type === "gameover")
      [67, 63, 58, 51].forEach(function (note, i) {
        self.tone(note, now + i * 0.12, 0.15, "square", 0.2, false);
      });
    else if (event.type === "trip" || event.type === "board-break")
      this.tone(36, now, 0.13, "sawtooth", 0.12, false);
  };
  AdventureAudio.prototype.update = function (game) {
    if (this.disposed) return;
    var events = game.events || [];
    for (var i = 0; i < events.length; i++)
      if (events[i].id > this.lastEvent) {
        this.effect(events[i]);
        this.lastEvent = events[i].id;
      }
    var enabled = !game.muted && game.phase === "playing";
    if (!enabled) {
      if (this.musicEnabled) this.stop(true);
      this.nextBeat = 0;
      this.musicEnabled = false;
      return;
    }
    this.musicEnabled = true;
    var ctx = this.context;
    if (!ctx || ctx.state !== "running" || this.paused) return;
    var now = ctx.currentTime;
    if (!this.nextBeat || this.nextBeat < now - 0.2)
      this.nextBeat = now + 0.025;
    // Newly composed C-major arpeggio sequence; no soundtrack data or recordings.
    var melody = [
      79,
      76,
      null,
      72,
      74,
      79,
      76,
      72,
      81,
      79,
      77,
      null,
      76,
      72,
      74,
      null,
      79,
      84,
      83,
      79,
      76,
      null,
      74,
      72,
      77,
      81,
      79,
      76,
      74,
      71,
      72,
      null,
    ];
    var bass = [48, 52, 53, 55, 48, 52, 55, 48];
    while (this.nextBeat < now + 0.12) {
      var step = this.musicStep % melody.length;
      this.tone(melody[step], this.nextBeat, 0.13, "square", 0.11, true);
      if (step % 4 === 0)
        this.tone(
          bass[Math.floor(step / 4)],
          this.nextBeat,
          0.28,
          "triangle",
          0.36,
          true,
        );
      this.musicStep++;
      this.nextBeat += game.level.theme === "cave" ? 0.17 : 0.145;
    }
  };
  AdventureAudio.prototype.dispose = function () {
    if (this.disposed) return;
    this.disposed = true;
    this.stop(false);
    if (this.context && this.context.state !== "closed")
      this.context.close().catch(function () {});
    this.master = null;
  };
  root.AdventureAudio = AdventureAudio;
  if (typeof module !== "undefined" && module.exports)
    module.exports = { AdventureAudio: AdventureAudio };
})(typeof window !== "undefined" ? window : global);
