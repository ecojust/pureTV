/* Original short synthesized effects and an original 8-bit accompaniment. */
(function (root) {
  "use strict";
  function MarioAudio() {
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
  MarioAudio.prototype.unlock = function () {
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
  MarioAudio.prototype.tone = function (
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
  MarioAudio.prototype.stop = function (musicOnly) {
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
  MarioAudio.prototype.pause = function (value) {
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
  MarioAudio.prototype.effect = function (event) {
    if (!this.context || this.context.state !== "running" || this.paused)
      return;
    var now = this.context.currentTime,
      self = this;
    var notes = {
      jump: [64, 72],
      swim: [55, 62],
      coin: [84, 91],
      power: [60, 64, 67, 72],
      upgrade: [60, 64, 67, 72],
      life: [72, 76, 79, 84],
      fire: [67, 55],
      stomp: [48, 36],
      kick: [50, 40],
      break: [48, 37, 28],
      bump: [35],
      damage: [60, 48],
      death: [72, 67, 63, 55],
      clear: [67, 72, 76, 79, 84],
      stage: [60, 67, 72],
      start: [60, 67, 72],
      ending: [60, 64, 67, 72, 76, 79, 84],
    }[event.type];
    if (notes)
      notes.forEach(function (note, index) {
        self.tone(
          note,
          now + index * 0.055,
          0.09,
          event.type === "coin" ? "triangle" : "square",
          0.24,
          false,
        );
      });
  };
  MarioAudio.prototype.update = function (game) {
    if (this.disposed) return;
    var events = game.events || [];
    for (var i = 0; i < events.length; i++)
      if (events[i].id > this.lastEvent) {
        this.effect(events[i]);
        this.lastEvent = events[i].id;
      }
    var enabled =
      !game.muted &&
      game.phase === "playing" &&
      !game.player().dying &&
      !game.clearTicks;
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
    // Newly composed melodies. No original Super Mario score or recordings.
    var theme = game.level.type;
    var melodies = {
      ground: [
        76,
        79,
        null,
        81,
        79,
        76,
        74,
        null,
        72,
        76,
        79,
        null,
        74,
        72,
        69,
        67,
        72,
        null,
        74,
        76,
        79,
        81,
        79,
        null,
        76,
        74,
        72,
        69,
        67,
        71,
        72,
        null,
      ],
      underground: [
        48,
        null,
        55,
        null,
        58,
        55,
        51,
        null,
        50,
        null,
        57,
        null,
        60,
        57,
        53,
        null,
      ],
      water: [
        72,
        null,
        76,
        null,
        79,
        81,
        79,
        null,
        74,
        null,
        77,
        null,
        81,
        79,
        77,
        null,
        76,
        null,
        79,
        null,
        84,
        83,
        81,
        null,
        77,
        74,
        72,
        null,
        71,
        74,
        72,
        null,
      ],
      castle: [
        45,
        52,
        57,
        58,
        57,
        52,
        45,
        null,
        44,
        51,
        56,
        57,
        56,
        51,
        44,
        null,
      ],
    };
    var melody = melodies[theme] || melodies.ground;
    if (game.player().star)
      melody = [79, 84, 88, 84, 81, 86, 89, 86, 83, 88, 91, 88, 84, 88, 91, 96];
    var bass =
      theme === "castle"
        ? [33, 33, 32, 32]
        : theme === "underground"
          ? [36, 36, 38, 38]
          : [48, 53, 55, 48];
    while (this.nextBeat < now + 0.12) {
      var step = this.musicStep % melody.length;
      this.tone(melody[step], this.nextBeat, 0.13, "square", 0.11, true);
      if (step % 4 === 0)
        this.tone(
          bass[Math.floor(step / 8) % bass.length],
          this.nextBeat,
          0.28,
          "triangle",
          0.36,
          true,
        );
      this.musicStep++;
      this.nextBeat += game.player().star
        ? 0.1
        : game.time < 100
          ? 0.12
          : theme === "water"
            ? 0.2
            : 0.155;
    }
  };
  MarioAudio.prototype.dispose = function () {
    if (this.disposed) return;
    this.disposed = true;
    this.stop(false);
    if (this.context && this.context.state !== "closed")
      this.context.close().catch(function () {});
    this.master = null;
  };
  root.MarioAudio = MarioAudio;
  if (typeof module !== "undefined" && module.exports)
    module.exports = { MarioAudio: MarioAudio };
})(typeof window !== "undefined" ? window : global);
