// Web Audio: looping music with per-track loop points, short effects, mute.
const MUSIC = {
  morning: { file: 'assets/audio/music/mus-morning.mp3', loopStart: 0, loopEnd: null },
  sunset: { file: 'assets/audio/music/mus-sunset.mp3', loopStart: 0, loopEnd: null },
  moon: { file: 'assets/audio/music/mus-moon.mp3', loopStart: 0, loopEnd: null },
};
const AMB = {
  morning: 'assets/audio/amb/amb-morning.mp3',
  sunset: 'assets/audio/amb/amb-sunset.mp3',
  moon: 'assets/audio/amb/amb-night.mp3',
};
const SFX = ['hop', 'land', 'gulp', 'sink', 'nope', 'flick', 'scuttle', 'tick', 'dive', 'surface',
  'fishleap', 'powerup', 'poweruse', 'dunk', 'undo', 'stuck', 'bloom', 'croak', 'click'];
// Per-effect gain and max length (seconds) so short sounds stay punchy.
const SFX_MIX = {
  hop: [0.55, 0.45], land: [0.6, 0.4], gulp: [0.8, 0.45], sink: [0.55, 0.9], nope: [0.6, 0.5],
  flick: [0.7, 0.4], scuttle: [0.5, 0.55], tick: [0.35, 0.3], dive: [0.5, 0.9], surface: [0.4, 0.9],
  fishleap: [0.6, 0.9], powerup: [0.6, 0.8], poweruse: [0.6, 0.8], dunk: [0.75, 1.2], undo: [0.4, 0.4],
  stuck: [0.6, 0.8], bloom: [0.35, 0.8], croak: [0.8, 0.8], click: [0.35, 0.3],
};

export class Audio {
  constructor(save) {
    this.save = save;
    this.ctx = null;
    this.buffers = {};
    this.track = null;      // { name, src, gain }
    this.amb = null;
    this.wanted = null;     // area wanted while loading
    this.ducked = false;
  }

  get musicMuted() { return !!this.save.data.musicMuted; }
  get sfxMuted() { return !!this.save.data.sfxMuted; }

  // Call from the first user input.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicMuted ? 0 : 0.5;
      this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxMuted ? 0 : 1;
      this.sfxBus.connect(this.master);
      this.loadAll();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  async load(key, url) {
    if (this.buffers[key]) return this.buffers[key];
    try {
      const res = await fetch(window.BloomAudio[url]);
      const data = await res.arrayBuffer();
      this.buffers[key] = await new Promise((ok, bad) => this.ctx.decodeAudioData(data, ok, bad));
    } catch (e) {
      console.warn('audio load failed', url);
      this.buffers[key] = null;
    }
    return this.buffers[key];
  }

  loadAll() {
    for (const s of SFX) this.load('sfx:' + s, `assets/audio/sfx/${s}.mp3`);
    this.load('mus:bloom', 'assets/audio/music/mus-bloom.mp3');
    if (this.wanted) this.playArea(this.wanted);
  }

  play(name, { rate = 1, gain = 1, delay = 0 } = {}) {
    if (!this.ctx || this.sfxMuted) return;
    const buf = this.buffers['sfx:' + name];
    if (!buf) return;
    const [g, len] = SFX_MIX[name] || [0.6, 1];
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const amp = this.ctx.createGain();
    const dur = Math.min(len, buf.duration) / rate;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(g * gain, t + 0.008);
    amp.gain.setValueAtTime(g * gain, t + Math.max(0.01, dur - 0.04));
    amp.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(amp).connect(this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  fanfare() {
    if (!this.ctx || this.musicMuted) return;
    const buf = this.buffers['mus:bloom'];
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const amp = this.ctx.createGain();
    amp.gain.value = 1.6;
    src.connect(amp).connect(this.musicBus);
    src.start();
    this.fanfareSrc = { src, amp };
    this.duck(5);
  }

  // Lower the music for a moment (fanfare).
  duck(seconds) {
    if (!this.track) return;
    const g = this.track.gain.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.15, t + 0.3);
    g.setValueAtTime(0.15, t + seconds - 0.8);
    g.linearRampToValueAtTime(1, t + seconds);
  }

  stopFanfare() {
    if (!this.fanfareSrc) return;
    const t = this.ctx.currentTime, g = this.fanfareSrc.amp.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 0.3);
    this.fanfareSrc.src.stop(t + 0.35);
    this.fanfareSrc = null;
    if (this.track) { const tg = this.track.gain.gain; tg.cancelScheduledValues(t); tg.setValueAtTime(tg.value, t); tg.linearRampToValueAtTime(1, t + 0.6); }
  }

  // Duck the music while the game is paused.
  setPaused(p) {
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(this.musicMuted ? 0 : p ? 0.15 : 0.5, this.ctx.currentTime, 0.1);
  }

  async playArea(area) {
    this.wanted = area;
    if (this.ctx) this.stopFanfare();
    if (!this.ctx) return;
    if (this.track && this.track.name === area) return;
    const m = MUSIC[area];
    const buf = await this.load('mus:' + area, m.file);
    const ambBuf = await this.load('amb:' + area, AMB[area]);
    if (this.wanted !== area || !buf) return;
    if (this.track && this.track.name === area) return;
    const t = this.ctx.currentTime;
    // Fade out whatever is playing.
    for (const old of [this.track, this.amb]) {
      if (!old) continue;
      old.gain.gain.cancelScheduledValues(t);
      old.gain.gain.setValueAtTime(old.gain.gain.value, t);
      old.gain.gain.linearRampToValueAtTime(0, t + 1);
      old.src.stop(t + 1.1);
    }
    this.track = this.startLoop(buf, m.loopStart, m.loopEnd || buf.duration, this.musicBus, 1);
    this.track.name = area;
    this.amb = ambBuf ? this.startLoop(ambBuf, 0, ambBuf.duration, this.musicBus, 0.35) : null;
  }

  startLoop(buf, loopStart, loopEnd, bus, level) {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = loopStart;
    src.loopEnd = loopEnd;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + 1.2);
    src.connect(gain).connect(bus);
    src.start(t);
    return { src, gain };
  }

  setMusicMuted(m) {
    this.save.data.musicMuted = m; this.save.write();
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.05);
  }
  setSfxMuted(m) {
    this.save.data.sfxMuted = m; this.save.write();
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
  }
  toggleAll() {
    const mute = !(this.musicMuted && this.sfxMuted);
    this.setMusicMuted(mute); this.setSfxMuted(mute);
  }
  get allMuted() { return this.musicMuted && this.sfxMuted; }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  state() {
    return {
      context: this.ctx ? this.ctx.state : 'none', musicMuted: this.musicMuted, sfxMuted: this.sfxMuted,
      track: this.track ? this.track.name : null,
      loop: this.track ? [this.track.src.loopStart, this.track.src.loopEnd] : null,
    };
  }

  // For the play-test: loudness per 0.5 s window of a track (to pick loop points).
  async rms(area) {
    const buf = await this.load('mus:' + area, MUSIC[area].file);
    const d = buf.getChannelData(0), step = Math.floor(buf.sampleRate / 2), out = [];
    for (let i = 0; i + step <= d.length; i += step) {
      let s = 0;
      for (let j = i; j < i + step; j++) s += d[j] * d[j];
      out.push(Math.sqrt(s / step));
    }
    return { duration: buf.duration, rms: out };
  }
}

export function setLoopPoints(points) {
  for (const [k, v] of Object.entries(points)) Object.assign(MUSIC[k], v);
}
