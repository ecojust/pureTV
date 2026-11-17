/* Original quiet pentatonic score and synthesized effects; no recordings. */
(function (root) {
  "use strict";
  class CozyIslandAudio {
    constructor() {
      this.context = null;
      this.master = null;
      this.muted = false;
      this.paused = false;
      this.lastBeat = -1;
      this.notes = [];
      this.disposed = false;
    }
    unlock() {
      if (this.disposed) return Promise.resolve();
      try {
        var Audio = root.AudioContext || root.webkitAudioContext;
        if (!Audio) return Promise.resolve();
        if (!this.context) {
          this.context = new Audio();
          this.master = this.context.createGain();
          this.master.gain.value = 0.065;
          this.master.connect(this.context.destination);
        }
        if (this.context.state === "suspended")
          return this.context.resume() || Promise.resolve();
      } catch (_) {}
      return Promise.resolve();
    }
    tone(frequency, duration, type, volume, delay) {
      if (
        !this.context ||
        !this.master ||
        this.muted ||
        this.paused ||
        this.disposed
      )
        return;
      var c = this.context,
        osc = c.createOscillator(),
        gain = c.createGain(),
        start = c.currentTime + (delay || 0);
      osc.type = type || "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume || 0.4, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + duration + 0.03);
      var self = this;
      this.notes.push(osc);
      osc.onended = function () {
        osc.disconnect();
        gain.disconnect();
        var i = self.notes.indexOf(osc);
        if (i >= 0) self.notes.splice(i, 1);
      };
    }
    update(game) {
      this.muted = game.muted;
      if (this.master)
        this.master.gain.setTargetAtTime(
          this.muted || this.paused ? 0 : 0.065,
          this.context.currentTime,
          0.05,
        );
      if (this.muted || this.paused) {
        game.soundEvents.length = 0;
        return;
      }
      var beat = Math.floor(game.elapsed / 1.2);
      if (beat !== this.lastBeat && game.phase === "playing") {
        this.lastBeat = beat;
        var melody = [0, 4, 7, 9, 7, 4, 2, 4, 0, 7, 9, 12, 9, 7, 4, 2];
        this.tone(220 * Math.pow(2, melody[beat % 16] / 12), 1.1, "sine", 0.32);
        if (beat % 4 === 0)
          this.tone(
            110 * Math.pow(2, [0, 5, 7, 0][Math.floor(beat / 4) % 4] / 12),
            2.3,
            "sine",
            0.22,
          );
      }
      while (game.soundEvents.length) {
        var event = game.soundEvents.shift();
        if (event === "collect" || event === "coin") {
          this.tone(660, 0.15, "sine", 0.5);
          this.tone(880, 0.2, "sine", 0.4, 0.1);
        } else if (
          event === "celebrate" ||
          event === "craft" ||
          event === "start"
        ) {
          [392, 494, 587, 784].forEach((f, i) =>
            this.tone(f, 0.3, "sine", 0.4, i * 0.09),
          );
        } else if (event === "bite") {
          this.tone(880, 0.12, "triangle", 0.4);
          this.tone(1175, 0.18, "triangle", 0.4, 0.12);
        } else if (event === "deny") this.tone(185, 0.2, "sine", 0.3);
        else this.tone(330, 0.12, "sine", 0.2);
      }
    }
    pause(value) {
      this.paused = !!value;
      if (this.context && this.master)
        this.master.gain.setTargetAtTime(
          this.paused || this.muted ? 0 : 0.065,
          this.context.currentTime,
          0.02,
        );
    }
    dispose() {
      this.disposed = true;
      this.notes.slice().forEach(function (n) {
        try {
          n.stop();
        } catch (_) {}
      });
      this.notes = [];
      if (this.context && this.context.state !== "closed")
        this.context.close().catch(function () {});
    }
  }
  root.CozyIslandAudio = CozyIslandAudio;
})(window);
