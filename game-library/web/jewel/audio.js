/* Original synthesized music and effects. No samples or extracted game soundtrack. */
(function (root) {
  "use strict";
  const MELODY = [72,76,79,83,81,79,76,74,72,0,67,71,74,79,76,0,
    69,72,76,81,79,76,74,72,71,0,67,74,76,71,72,0];
  const BASS = [48,48,55,55,53,53,55,55];
  class JewelAudio {
    constructor() {
      this.context = null; this.master = null; this.voices = [];
      this.disposed = false; this.paused = false; this.muted = false;
      this.nextBeat = 0; this.beat = 0; this.lastEvent = -1; this.unlocked = false;
    }
    unlock() {
      if (this.disposed) return Promise.resolve();
      try {
        if (!this.context) {
          const AudioContext = root.AudioContext || root.webkitAudioContext;
          if (!AudioContext) return Promise.resolve();
          this.context = new AudioContext(); this.master = this.context.createGain();
          this.master.gain.value = 0.12; this.master.connect(this.context.destination);
        }
        this.unlocked = true;
        if (!this.paused && !this.muted && this.context.state === "suspended") {
          const resumed = this.context.resume(); return resumed || Promise.resolve();
        }
      } catch (_) { return Promise.resolve(); }
      return Promise.resolve();
    }
    tone(note, start, duration, type, volume) {
      if (!this.context || !this.master || !note || this.disposed) return;
      const oscillator = this.context.createOscillator(), gain = this.context.createGain();
      oscillator.type = type || "square";
      oscillator.frequency.setValueAtTime(440 * Math.pow(2, (note - 69) / 12), start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume || 0.2, start + 0.005);
      gain.gain.setValueAtTime(volume || 0.2, Math.max(start + 0.006, start + duration - 0.025));
      gain.gain.linearRampToValueAtTime(0, start + duration);
      oscillator.connect(gain); gain.connect(this.master);
      const voice = { oscillator, gain };
      this.voices.push(voice);
      oscillator.onended = () => {
        try { oscillator.disconnect(); gain.disconnect(); } catch (_) {}
        const index = this.voices.indexOf(voice); if (index >= 0) this.voices.splice(index, 1);
      };
      oscillator.start(start); oscillator.stop(start + duration + 0.01);
    }
    stopVoices() {
      for (const voice of this.voices.slice()) {
        try { voice.oscillator.stop(); voice.oscillator.disconnect(); voice.gain.disconnect(); } catch (_) {}
      }
      this.voices.length = 0;
    }
    pause(value) {
      value = !!value;
      if (this.paused === value || this.disposed) return;
      this.paused = value; this.nextBeat = 0; this.stopVoices();
      if (this.context) {
        if (value && this.context.state === "running") this.context.suspend().catch(function () {});
        else if (!value && !this.muted && this.unlocked && this.context.state === "suspended") this.context.resume().catch(function () {});
      }
    }
    effect(event) {
      const now = this.context.currentTime + 0.005;
      const type = event.type;
      if (type === "rotate") this.tone(76, now, 0.045, "square", 0.12);
      else if (type === "move") this.tone(57, now, 0.025, "triangle", 0.1);
      else if (type === "land") { this.tone(43, now, 0.08, "triangle", 0.35); this.tone(55, now, 0.05, "square", 0.07); }
      else if (type === "clear" || type === "chain") {
        const base = 72 + Math.min(12, (event.chain || 1) * 2);
        for (let i = 0; i < 4; i++) this.tone(base + [0,4,7,12][i], now + i * 0.055, 0.12, "square", 0.18);
      } else if (type === "level") {
        [72,76,79,84,88].forEach((note, i) => this.tone(note, now + i * 0.09, 0.15, "triangle", 0.3));
      } else if (type === "gameover") {
        [64,60,57,52,48].forEach((note, i) => this.tone(note, now + i * 0.13, 0.18, "square", 0.2));
      }
    }
    update(game) {
      if (this.disposed) return;
      const muted = !!game.muted;
      if (muted !== this.muted) {
        this.muted = muted; this.nextBeat = 0; this.stopVoices();
        if (this.master && this.context) this.master.gain.setValueAtTime(muted ? 0 : 0.12, this.context.currentTime);
        if (!muted && !this.paused && this.unlocked && this.context && this.context.state === "suspended") this.context.resume().catch(function () {});
      }
      const events = game.events || [];
      for (const event of events) {
        if (typeof event.id === "number" && event.id <= this.lastEvent) continue;
        if (typeof event.id === "number") this.lastEvent = event.id;
        if (this.context && this.unlocked && !this.paused && !this.muted && this.context.state === "running") this.effect(event);
      }
      if (!this.context || !this.unlocked || this.paused || this.muted || this.context.state !== "running") return;
      if (game.phase !== "playing" && game.phase !== "title") { this.nextBeat = 0; return; }
      const now = this.context.currentTime;
      if (!this.nextBeat || this.nextBeat < now - 0.3) this.nextBeat = now + 0.03;
      while (this.nextBeat < now + 0.12) {
        const position = this.beat % MELODY.length;
        this.tone(MELODY[position], this.nextBeat, 0.16, "triangle", 0.24);
        if (this.beat % 4 === 0) this.tone(BASS[Math.floor(this.beat / 4) % BASS.length], this.nextBeat, 0.31, "triangle", 0.2);
        this.beat++; this.nextBeat += 0.205;
      }
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true; this.stopVoices();
      if (this.context) {
        try { const closing = this.context.close(); if (closing && closing.catch) closing.catch(function () {}); } catch (_) {}
      }
      this.master = null;
    }
  }
  root.JewelAudio = JewelAudio;
})(typeof window !== "undefined" ? window : global);
