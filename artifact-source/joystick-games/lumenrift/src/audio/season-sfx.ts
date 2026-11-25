// SFX for the four seasonal campaigns. Same conventions as the engine's render(): one voice per call
// (panned + reverb send), returns the approximate duration in seconds; -1 = not a seasonal sound.

import type { SfxName } from './audio';
import { envGain, mtof, osc, pick, rnd as r, type Kit } from './kit';

/** Per-sound limits: minimum interval between triggers (s) and max simultaneous voices. */
export const SEASON_LIMITS: Partial<Record<SfxName, [number, number]>> = {
  seed: [0.04, 6],
  sling: [0.05, 5],
  candle_shot: [0.06, 4],
  snowball: [0.05, 5],
  pellet_hit: [0.03, 6],
  snap: [0.1, 3],
  gulp: [0.2, 2],
  puff: [0.1, 3],
  lash: [0.08, 3],
  roots: [0.4, 2],
  vines: [0.8, 1],
  buzz: [0.3, 2],
  mirror_flash: [0.35, 2],
  sandblast: [0.08, 3],
  noon: [0.6, 2],
  whirl: [0.3, 2],
  stinger: [0.08, 3],
  sweep: [0.4, 2],
  sunstrike: [1.0, 1],
  bomb: [0.06, 4],
  swallow_sand: [0.3, 2],
  potion: [0.08, 3],
  raven: [0.2, 2],
  reanimate: [0.3, 2],
  reap: [0.08, 3],
  chime: [0.8, 1],
  wisp: [1.0, 1],
  hex: [0.15, 3],
  revive: [0.2, 2],
  cackle: [0.8, 1],
  harpoon: [0.1, 3],
  avalanche: [0.6, 1],
  snow_cannon: [0.1, 3],
  aurora: [1.4, 1],
  shatter: [0.06, 4],
  mammoth: [0.6, 1],
  freeze: [0.12, 3],
  thaw: [0.15, 3],
  comet: [1.0, 1],
  pest_die: [0.025, 8],
  dune_die: [0.025, 8],
  spook_die: [0.025, 8],
  frost_die: [0.025, 8],
  burrow: [0.2, 2],
  illusion: [0.15, 3],
};

/** Seasonal sounds that should get through even when the voice pool is full. */
export const SEASON_IMPORTANT = new Set<SfxName>(['vines', 'sunstrike', 'wisp', 'comet', 'chime', 'avalanche', 'noon']);

export function renderSeasonSfx(k: Kit, name: SfxName, pan: number, vol: number): number {
  const ctx = k.ctx;
  switch (name) {
    // ======================================================== shots
    case 'seed': {
      const v = k.newVoice(pan, vol, 0.05);
      const t = v.t;
      const p = r(0.85, 1.15);
      k.tone(v.out, 'sine', 520 * p, 180 * p, t, 0.07, 0.2, 0.002); // pop
      k.noise(v.out, t, 0.03, 0.1, 'bandpass', 1800 * p, null, 2, 0.001);
      k.tone(v.out, 'sine', 900 * p, 1400 * p, t + 0.02, 0.06, 0.04, 0.003); // spit
      return 0.1;
    }
    case 'sling': {
      const v = k.newVoice(pan, vol, 0.06);
      const t = v.t;
      // whirr: amplitude-wobbled bandpass noise
      const src = ctx.createBufferSource();
      src.buffer = k.noiseBuf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 2;
      bp.frequency.setValueAtTime(500, t);
      bp.frequency.exponentialRampToValueAtTime(1500, t + 0.16);
      const g = envGain(k, v.out, t, 0.14, 0.2, 0.06);
      const am = ctx.createGain();
      am.gain.value = 0.6;
      const lfo = osc(k, am.gain, 'sine', 28, t, t + 0.2, 0.4);
      void lfo;
      src.connect(bp);
      bp.connect(am);
      am.connect(g);
      src.start(t, Math.random() * 1.5);
      src.stop(t + 0.25);
      // thwack
      k.tone(v.out, 'triangle', 260, 110, t + 0.17, 0.08, 0.18, 0.001);
      k.noise(v.out, t + 0.17, 0.03, 0.12, 'lowpass', 1500, null, 1, 0.001);
      return 0.27;
    }
    case 'candle_shot': {
      const v = k.newVoice(pan, vol, 0.08);
      const t = v.t;
      const p = r(0.9, 1.15);
      k.noise(v.out, t, 0.2, 0.09, 'bandpass', 500 * p, 1800 * p, 1, 0.02);
      k.noise(v.out, t, 0.12, 0.035, 'highpass', 3000, null, 0.7, 0.01);
      k.tone(v.out, 'sine', 180 * p, 90, t, 0.12, 0.06, 0.01);
      return 0.22;
    }
    case 'snowball': {
      const v = k.newVoice(pan, vol, 0.06);
      const t = v.t;
      const p = r(0.85, 1.15);
      k.tone(v.out, 'sine', 160 * p, 60, t, 0.14, 0.28, 0.003);
      k.noise(v.out, t, 0.12, 0.14, 'lowpass', 1200 * p, 300, 0.8, 0.003);
      k.noise(v.out, t + 0.01, 0.06, 0.05, 'highpass', 4000, null, 0.7, 0.002); // powder
      return 0.16;
    }
    case 'pellet_hit': {
      const v = k.newVoice(pan, vol, 0.02);
      const t = v.t;
      k.tone(v.out, 'sine', r(900, 1300), 500, t, 0.03, 0.08, 0.001);
      k.noise(v.out, t, 0.02, 0.06, 'bandpass', r(2500, 3500), null, 2, 0.0005);
      return 0.04;
    }
    // ======================================================== spring
    case 'snap': {
      const v = k.newVoice(pan, vol, 0.1);
      const t = v.t;
      k.noise(v.out, t, 0.025, 0.25, 'bandpass', 2200, null, 1.2, 0.0005); // jaws
      k.tone(v.out, 'triangle', 340, 120, t, 0.09, 0.24, 0.001);
      k.noise(v.out, t + 0.03, 0.1, 0.1, 'lowpass', 900, 300, 2, 0.005); // wet squish
      return 0.15;
    }
    case 'gulp': {
      const v = k.newVoice(pan, vol, 0.12);
      const t = v.t;
      k.tone(v.out, 'sine', 260, 90, t, 0.18, 0.28, 0.01);
      k.tone(v.out, 'sine', 180, 70, t + 0.16, 0.2, 0.22, 0.01);
      k.noise(v.out, t, 0.32, 0.08, 'bandpass', 600, 250, 4, 0.02);
      return 0.4;
    }
    case 'puff': {
      const v = k.newVoice(pan, vol, 0.25);
      const t = v.t;
      k.noise(v.out, t, 0.35, 0.16, 'bandpass', 1400, 3500, 0.8, 0.03);
      k.noise(v.out, t, 0.2, 0.08, 'lowpass', 500, 200, 1, 0.01);
      for (let j = 0; j < 3; j++) k.bell(v.out, mtof(pick([88, 91, 93, 96])), t + 0.05 + j * 0.05, 0.3, 0.018);
      return 0.4;
    }
    case 'lash': {
      const v = k.newVoice(pan, vol, 0.12);
      const t = v.t;
      k.noise(v.out, t, 0.12, 0.1, 'bandpass', 600, 3500, 1.5, 0.08); // swish
      k.noise(v.out, t + 0.1, 0.03, 0.15, 'highpass', 2500, null, 0.8, 0.0005); // crack
      k.tone(v.out, 'triangle', 1400, 500, t + 0.1, 0.04, 0.08, 0.0005);
      for (let j = 0; j < 3; j++) k.noise(v.out, t + 0.13 + j * 0.03, 0.05, 0.05, 'bandpass', r(2000, 4000), null, 2, 0.002); // leaves
      return 0.25;
    }
    case 'roots': {
      const v = k.newVoice(pan, vol, 0.35);
      const t = v.t;
      k.tone(v.out, 'sine', 55, 38, t, 1.0, 0.5, 0.08);
      k.noise(v.out, t, 1.0, 0.3, 'lowpass', 300, 120, 1, 0.1);
      // creaks: slow-swept resonant saws
      for (let j = 0; j < 3; j++) {
        const tt = t + 0.1 + j * r(0.18, 0.28);
        const f = r(140, 220);
        k.tone(v.out, 'sawtooth', f, f * r(0.6, 1.4), tt, 0.22, 0.05, 0.03, 900);
      }
      return 1.05;
    }
    case 'vines': {
      const v = k.newVoice(pan, vol, 0.4);
      const t = v.t;
      // rustling grasp: many leafy flutters building up, a woody squeeze and a green shimmer
      for (let j = 0; j < 12; j++)
        k.noise(v.out, t + j * r(0.05, 0.09), r(0.08, 0.16), 0.06 + j * 0.008, 'bandpass', r(1800, 4500), null, 1.5, 0.01);
      k.noise(v.out, t, 1.2, 0.15, 'bandpass', 400, 1200, 0.8, 0.5);
      k.tone(v.out, 'sine', 70, 45, t + 0.5, 0.8, 0.45, 0.05);
      for (let j = 0; j < 4; j++) {
        const f = r(160, 260);
        k.tone(v.out, 'sawtooth', f, f * 0.7, t + 0.45 + j * 0.12, 0.25, 0.05, 0.04, 1000);
      }
      [67, 71, 74, 79, 83].forEach((m, j) => k.bell(v.out, mtof(m), t + 0.6 + j * 0.05, 1.0, 0.05));
      return 1.6;
    }
    case 'buzz': {
      const v = k.newVoice(pan, vol, 0.05);
      const t = v.t;
      for (const f of [r(190, 230), r(240, 290)]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f, t);
        o.frequency.linearRampToValueAtTime(f * r(0.9, 1.15), t + 0.25);
        o.frequency.linearRampToValueAtTime(f * r(0.9, 1.1), t + 0.5);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1200;
        bp.Q.value = 1;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.022, t + 0.12);
        g.gain.linearRampToValueAtTime(0.0001, t + 0.55);
        o.connect(bp);
        bp.connect(g);
        g.connect(v.out);
        o.start(t);
        o.stop(t + 0.6);
      }
      return 0.6;
    }
    // ======================================================== summer
    case 'mirror_flash': {
      // a soft warm glint rather than a zing
      const v = k.newVoice(pan, vol, 0.35);
      const t = v.t;
      k.tone(v.out, 'sine', 1180, 1320, t, 0.22, 0.025, 0.02);
      k.bell(v.out, mtof(pick([81, 84, 86])), t + 0.02, 0.35, 0.014);
      return 0.4;
    }
    case 'sandblast': {
      const v = k.newVoice(pan, vol, 0.06);
      const t = v.t;
      k.noise(v.out, t, 0.16, 0.14, 'bandpass', r(2500, 3500), r(1500, 2200), 0.9, 0.02);
      for (let j = 0; j < 4; j++) k.noise(v.out, t + Math.random() * 0.14, 0.012, 0.1, 'highpass', r(4000, 7000), null, 1, 0.0005); // grit
      return 0.18;
    }
    case 'noon': {
      // big bronze ring: inharmonic partials with slow beating
      const v = k.newVoice(pan, vol, 0.55);
      const t = v.t;
      const f = mtof(pick([45, 47, 48]));
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2800;
      lp.connect(v.out);
      const parts: [number, number, number][] = [
        [1, 0.16, 3.2],
        [1.004, 0.1, 3.0],
        [1.48, 0.07, 2.4],
        [2.03, 0.08, 2.0],
        [2.74, 0.05, 1.5],
        [3.6, 0.03, 1.0],
        [5.1, 0.015, 0.6],
      ];
      for (const [mul, amp, dur] of parts) k.tone(lp, 'sine', f * mul, f * mul * 0.997, t, dur, amp, 0.003);
      k.tone(v.out, 'sine', f * 0.5, f * 0.49, t, 2.5, 0.2, 0.01);
      k.noise(v.out, t, 0.05, 0.12, 'lowpass', 1800, null, 1, 0.001); // mallet
      return 3.2;
    }
    case 'whirl': {
      const v = k.newVoice(pan, vol, 0.25);
      const t = v.t;
      k.windSwell(v.out, t, 0.9, 0.26, 300, 1500, 500, 3);
      k.windSwell(v.out, t + 0.05, 0.85, 0.12, 900, 3000, 1200, 6);
      for (let j = 0; j < 5; j++) k.noise(v.out, t + 0.1 + j * 0.13, 0.03, 0.05, 'highpass', 5000, null, 1, 0.002);
      return 0.95;
    }
    case 'stinger': {
      const v = k.newVoice(pan, vol, 0.12);
      const t = v.t;
      const p = r(0.92, 1.08);
      k.noise(v.out, t, 0.03, 0.18, 'bandpass', 1100, null, 1.2, 0.001);
      k.tone(v.out, 'sine', 120 * p, 55, t, 0.24, 0.42, 0.002); // thunk
      k.tone(v.out, 'triangle', 300 * p, 160, t, 0.12, 0.12, 0.002);
      return 0.26;
    }
    case 'sweep': {
      const v = k.newVoice(pan, vol, 0.35);
      const t = v.t;
      for (const [f, d] of [
        [82, -9],
        [82, 9],
        [123, 0],
      ] as [number, number][])
        k.tone(v.out, 'sawtooth', f, f * 1.06, t, 1.1, 0.07, 0.4, 900, d);
      k.tone(v.out, 'sine', 55, 58, t, 1.1, 0.22, 0.35);
      k.noise(v.out, t, 1.0, 0.07, 'bandpass', 2000, 5000, 2, 0.4); // sizzle
      return 1.15;
    }
    case 'sunstrike': {
      const v = k.newVoice(pan, vol, 0.55);
      const t = v.t;
      // rising charge
      for (const d of [-8, 8]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.detune.value = d;
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(880, t + 0.8);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(300, t);
        f.frequency.exponentialRampToValueAtTime(5000, t + 0.8);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.78);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.86);
        o.connect(f);
        f.connect(g);
        g.connect(v.out);
        o.start(t);
        o.stop(t + 0.9);
      }
      k.noise(v.out, t, 0.85, 0.12, 'bandpass', 800, 6000, 1.5, 0.75);
      // blazing impact
      const ti = t + 0.82;
      k.tone(v.out, 'sine', 120, 30, ti, 1.2, 0.85, 0.004);
      k.noise(v.out, ti, 1.4, 0.5, 'lowpass', 5000, 150, 0.7, 0.003);
      k.noise(v.out, ti, 1.0, 0.12, 'highpass', 3000, null, 0.7, 0.2); // flare hiss
      [76, 80, 83, 88].forEach((m, j) => k.bell(v.out, mtof(m), ti + 0.04 + j * 0.04, 1.5, 0.06));
      return 2.3;
    }
    case 'bomb': {
      const v = k.newVoice(pan, vol, 0.2);
      const t = v.t;
      const p = r(0.85, 1.15);
      k.tone(v.out, 'sine', 300 * p, 140 * p, t, 0.05, 0.15, 0.001); // pop
      k.tone(v.out, 'sine', 110 * p, 40, t + 0.02, 0.35, 0.55, 0.003);
      k.noise(v.out, t + 0.02, 0.4, 0.35, 'lowpass', 2200 * p, 200, 0.8, 0.003);
      for (let j = 0; j < 3; j++) k.noise(v.out, t + 0.08 + Math.random() * 0.25, 0.015, 0.08, 'highpass', r(2500, 5000), null, 1, 0.001); // embers
      return 0.45;
    }
    case 'swallow_sand': {
      const v = k.newVoice(pan, vol, 0.2);
      const t = v.t;
      k.noise(v.out, t, 0.6, 0.18, 'bandpass', 3500, 400, 1.2, 0.05);
      k.noise(v.out, t + 0.1, 0.5, 0.12, 'lowpass', 900, 150, 1.5, 0.1);
      k.tone(v.out, 'sine', 300, 60, t + 0.15, 0.45, 0.2, 0.05);
      return 0.65;
    }
    // ======================================================== autumn
    case 'potion': {
      const v = k.newVoice(pan, vol, 0.2);
      const t = v.t;
      k.tone(v.out, 'sine', r(2600, 3200), null, t, 0.15, 0.06, 0.001); // glass clink
      k.tone(v.out, 'sine', r(4200, 4800), null, t, 0.1, 0.03, 0.001);
      k.noise(v.out, t + 0.01, 0.2, 0.15, 'lowpass', 1600, 400, 1.5, 0.005); // splash
      for (let j = 0; j < 4; j++) {
        const tt = t + 0.08 + j * r(0.04, 0.08);
        const f = r(500, 900);
        k.tone(v.out, 'sine', f, f * 1.8, tt, 0.05, 0.05, 0.003); // bubbles
      }
      return 0.42;
    }
    case 'raven': {
      const v = k.newVoice(pan, vol, 0.2);
      const t = v.t;
      const n = Math.random() < 0.5 ? 1 : 2;
      for (let j = 0; j < n; j++) {
        const tt = t + j * 0.22;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        const f = r(520, 640);
        o.frequency.setValueAtTime(f, tt);
        o.frequency.linearRampToValueAtTime(f * 1.12, tt + 0.04);
        o.frequency.exponentialRampToValueAtTime(f * 0.7, tt + 0.18);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1300;
        bp.Q.value = 2.5;
        const g = envGain(k, v.out, tt, 0.18, 0.19, 0.01);
        o.connect(bp);
        bp.connect(g);
        o.start(tt);
        o.stop(tt + 0.22);
        k.noise(g, tt, 0.15, 0.5, 'bandpass', 1800, null, 2, 0.01); // rasp
      }
      return 0.45;
    }
    case 'reanimate': {
      const v = k.newVoice(pan, vol, 0.3);
      const t = v.t;
      // electric crackle
      const o = ctx.createOscillator();
      o.type = 'square';
      for (let j = 0; j < 14; j++) o.frequency.setValueAtTime(r(400, 2400), t + j * 0.022);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
      bp.Q.value = 0.8;
      const g = envGain(k, v.out, t, 0.08, 0.32, 0.003);
      o.connect(bp);
      bp.connect(g);
      o.start(t);
      o.stop(t + 0.35);
      k.noise(v.out, t, 0.25, 0.12, 'highpass', 4500, null, 0.7, 0.002);
      // groan
      k.tone(v.out, 'sawtooth', 95, 70, t + 0.2, 0.7, 0.09, 0.2, 500);
      k.tone(v.out, 'sawtooth', 101, 72, t + 0.2, 0.7, 0.07, 0.2, 450);
      return 0.95;
    }
    case 'reap': {
      const v = k.newVoice(pan, vol, 0.15);
      const t = v.t;
      k.noise(v.out, t, 0.2, 0.18, 'bandpass', 1500, 5000, 3, 0.12);
      k.tone(v.out, 'sine', 3800, 3500, t + 0.14, 0.15, 0.03, 0.002); // blade ring
      k.noise(v.out, t + 0.15, 0.04, 0.1, 'lowpass', 1200, null, 1, 0.001);
      return 0.3;
    }
    case 'chime': {
      // deep clock bell: a low bronze toll, a slow hum and a tick-tock
      const v = k.newVoice(pan, vol, 0.6);
      const t = v.t;
      k.noise(v.out, t, 0.02, 0.1, 'bandpass', 3000, null, 3, 0.0005);
      k.noise(v.out, t + 0.18, 0.02, 0.08, 'bandpass', 2400, null, 3, 0.0005);
      const ts = t + 0.36;
      const f = mtof(43);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2400;
      lp.connect(v.out);
      const parts: [number, number, number][] = [
        [0.5, 0.18, 3.4],
        [1, 0.15, 3.0],
        [1.19, 0.08, 2.2],
        [1.5, 0.05, 1.8],
        [2, 0.07, 1.5],
        [2.51, 0.03, 1.0],
        [3.01, 0.02, 0.7],
      ];
      for (const [mul, amp, dur] of parts) k.tone(lp, 'sine', f * mul, f * mul * 0.998, ts, dur, amp, 0.002);
      k.noise(lp, ts, 0.03, 0.1, 'bandpass', 1800, null, 2, 0.001);
      return 3.8;
    }
    case 'wisp': {
      const v = k.newVoice(pan, vol, 0.6);
      const t = v.t;
      // eerie warble: two gliding sines with deep wobbling vibrato, a ghostly whoosh, then a soft burst
      for (const [f, rate] of [
        [660, 7],
        [990, 5.3],
      ] as [number, number][]) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f * 0.7, t);
        o.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.6);
        o.frequency.exponentialRampToValueAtTime(f * 0.8, t + 1.3);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = rate;
        const lg = ctx.createGain();
        lg.gain.value = f * 0.06;
        lfo.connect(lg);
        lg.connect(o.frequency);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.07, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        o.connect(g);
        g.connect(v.out);
        o.start(t);
        lfo.start(t);
        o.stop(t + 1.45);
        lfo.stop(t + 1.45);
      }
      k.windSwell(v.out, t, 1.2, 0.18, 400, 1600, 600, 4);
      k.tone(v.out, 'sine', 180, 40, t + 0.55, 0.8, 0.5, 0.01);
      k.noise(v.out, t + 0.55, 0.8, 0.25, 'lowpass', 2500, 200, 0.8, 0.01);
      [62, 65, 68, 74].forEach((m, j) => k.bell(v.out, mtof(m + 12), t + 0.6 + j * 0.06, 1.2, 0.045));
      return 1.6;
    }
    case 'hex': {
      const v = k.newVoice(pan, vol, 0.35);
      const t = v.t;
      // witchy sting: tritone glide + sparkle
      k.tone(v.out, 'triangle', mtof(74), mtof(68), t, 0.35, 0.07, 0.005, 3000);
      k.tone(v.out, 'triangle', mtof(80), mtof(74), t, 0.35, 0.05, 0.005, 3000);
      k.noise(v.out, t, 0.3, 0.06, 'bandpass', 4000, 7000, 5, 0.01);
      k.tone(v.out, 'sine', 300, 150, t, 0.15, 0.08, 0.003);
      return 0.38;
    }
    case 'revive': {
      const v = k.newVoice(pan, vol, 0.2);
      const t = v.t;
      // bones rattling together: a burst of tiny woody clicks gathering
      for (let j = 0; j < 9; j++) {
        const tt = t + j * r(0.025, 0.05);
        const f = r(1200, 2400);
        k.tone(v.out, 'sine', f, f * 0.9, tt, 0.035, 0.07, 0.0008);
        k.noise(v.out, tt, 0.01, 0.05, 'bandpass', f * 2, null, 3, 0.0005);
      }
      k.tone(v.out, 'sine', 400, 900, t + 0.3, 0.12, 0.05, 0.01);
      return 0.45;
    }
    case 'cackle': {
      const v = k.newVoice(pan, vol, 0.3);
      const t = v.t;
      // "heh-heh-heh": falling, nasal formant bursts
      for (let j = 0; j < 5; j++) {
        const tt = t + j * 0.11;
        const f = 520 - j * 30;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f * 1.1, tt);
        o.frequency.exponentialRampToValueAtTime(f * 0.85, tt + 0.08);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1500;
        bp.Q.value = 3;
        const g = envGain(k, v.out, tt, 0.17 - j * 0.015, 0.09, 0.005);
        o.connect(bp);
        bp.connect(g);
        o.start(tt);
        o.stop(tt + 0.1);
      }
      return 0.65;
    }
    // ======================================================== winter
    case 'harpoon': {
      const v = k.newVoice(pan, vol, 0.12);
      const t = v.t;
      k.tone(v.out, 'sine', 140, 50, t, 0.25, 0.45, 0.002); // thump
      k.noise(v.out, t, 0.08, 0.2, 'lowpass', 1200, 300, 1, 0.001);
      k.noise(v.out, t + 0.02, 0.35, 0.09, 'bandpass', 1800, 700, 6, 0.02); // rope whizz
      k.tone(v.out, 'sawtooth', 700, 300, t + 0.02, 0.3, 0.02, 0.01, 1500);
      return 0.38;
    }
    case 'avalanche': {
      const v = k.newVoice(pan, vol, 0.5);
      const t = v.t;
      k.noise(v.out, t, 2.4, 0.4, 'lowpass', 900, 120, 0.8, 0.5);
      k.noise(v.out, t + 0.1, 2.0, 0.14, 'bandpass', 2500, 600, 0.8, 0.4); // hiss of powder
      k.tone(v.out, 'sine', 48, 30, t, 2.4, 0.5, 0.5);
      for (let j = 0; j < 6; j++) {
        const tt = t + 0.2 + j * r(0.2, 0.35);
        k.noise(v.out, tt, r(0.3, 0.5), r(0.1, 0.18), 'lowpass', r(300, 600), 100, 1, 0.03); // tumbling chunks
      }
      return 2.5;
    }
    case 'snow_cannon': {
      const v = k.newVoice(pan, vol, 0.3);
      const t = v.t;
      const p = r(0.9, 1.1);
      k.tone(v.out, 'sine', 90 * p, 32, t, 0.6, 0.75, 0.003);
      k.noise(v.out, t, 0.15, 0.25, 'lowpass', 1800, 300, 0.8, 0.002);
      k.noise(v.out, t + 0.08, 0.7, 0.18, 'lowpass', 500, 120, 1, 0.1); // rolling
      k.noise(v.out, t, 0.25, 0.05, 'highpass', 5000, null, 0.7, 0.01); // snow spray
      return 0.8;
    }
    case 'aurora': {
      // a faint, slow shimmer: two soft sines swelling in and out
      const v = k.newVoice(pan, vol, 0.5);
      const t = v.t;
      for (const [m, d] of [
        [76, -4],
        [83, 4],
      ] as [number, number][]) {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.012, t + 0.45);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        g.connect(v.out);
        const o = osc(k, g, 'sine', mtof(m), t, t + 1.3, 1, d);
        void osc(k, o.frequency, 'sine', r(3, 5), t, t + 1.3, mtof(m) * 0.004);
      }
      return 1.3;
    }
    case 'shatter': {
      const v = k.newVoice(pan, vol, 0.25);
      const t = v.t;
      k.noise(v.out, t, 0.05, 0.25, 'highpass', 3000, null, 0.7, 0.0005);
      for (let j = 0; j < 6; j++) {
        const tt = t + j * r(0.012, 0.035);
        const f = r(2500, 6000);
        k.tone(v.out, 'sine', f, f * 0.98, tt, r(0.08, 0.25), r(0.03, 0.06), 0.0008);
      }
      k.noise(v.out, t + 0.03, 0.25, 0.06, 'bandpass', 7000, 4000, 2, 0.01); // tinkle tail
      return 0.32;
    }
    case 'mammoth': {
      // a mellow, muffled call from inside the pen and a few heavy footfalls
      const v = k.newVoice(pan, vol, 0.45);
      const t = v.t;
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(230, t + 0.3);
      o.frequency.exponentialRampToValueAtTime(170, t + 0.8);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      lp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      o.connect(lp);
      lp.connect(g);
      g.connect(v.out);
      o.start(t);
      o.stop(t + 0.9);
      for (let j = 0; j < 3; j++) k.tone(v.out, 'sine', 70, 45, t + 0.3 + j * 0.22, 0.18, 0.09, 0.005); // footfalls
      return 1.0;
    }
    case 'freeze': {
      const v = k.newVoice(pan, vol, 0.3);
      const t = v.t;
      for (let j = 0; j < 8; j++)
        k.noise(v.out, t + j * r(0.02, 0.05), 0.02, r(0.06, 0.12), 'bandpass', r(3000, 7000), null, 2, 0.0005); // crackles
      k.tone(v.out, 'sine', 2000, 3200, t, 0.35, 0.035, 0.02);
      k.noise(v.out, t, 0.35, 0.05, 'highpass', 7000, null, 0.5, 0.05);
      return 0.42;
    }
    case 'thaw': {
      const v = k.newVoice(pan, vol, 0.2);
      const t = v.t;
      k.noise(v.out, t, 0.4, 0.09, 'highpass', 4000, null, 0.7, 0.03); // sizzle
      for (let j = 0; j < 3; j++) {
        const tt = t + 0.1 + j * r(0.08, 0.14);
        const f = r(1200, 2000);
        k.tone(v.out, 'sine', f, f * 0.5, tt, 0.05, 0.08, 0.001); // drips
      }
      return 0.45;
    }
    case 'comet': {
      const v = k.newVoice(pan, vol, 0.55);
      const t = v.t;
      // whooshing fireball descending...
      k.windSwell(v.out, t, 1.0, 0.25, 3000, 1200, 300, 1.5);
      k.noise(v.out, t, 0.95, 0.1, 'highpass', 5000, null, 0.7, 0.6);
      for (let j = 0; j < 6; j++) k.noise(v.out, t + 0.2 + j * 0.12, 0.02, 0.06, 'bandpass', r(2000, 5000), null, 1.2, 0.001); // crackle trail
      k.tone(v.out, 'sawtooth', 900, 200, t, 0.95, 0.03, 0.5, 1800);
      // ...and impact
      const ti = t + 0.9;
      k.tone(v.out, 'sine', 100, 28, ti, 1.2, 0.9, 0.004);
      k.noise(v.out, ti, 1.3, 0.5, 'lowpass', 4000, 140, 0.7, 0.003);
      k.noise(v.out, ti + 0.05, 0.6, 0.08, 'highpass', 4000, null, 0.7, 0.05); // snow/steam
      [81, 85, 88].forEach((m, j) => k.bell(v.out, mtof(m), ti + 0.06 + j * 0.05, 1.2, 0.045));
      return 2.2;
    }
    // ======================================================== enemy deaths
    case 'pest_die': {
      const v = k.newVoice(pan, vol, 0.12);
      const t = v.t;
      const p = r(0.8, 1.25);
      k.noise(v.out, t, 0.12, 0.18, 'lowpass', 1200 * p, 300, 2, 0.003); // squelch
      k.tone(v.out, 'sine', 900 * p, 1500 * p, t, 0.07, 0.07, 0.003); // squeak
      k.tone(v.out, 'sine', 300 * p, 120, t + 0.03, 0.12, 0.1, 0.003);
      return 0.17;
    }
    case 'dune_die': {
      const v = k.newVoice(pan, vol, 0.12);
      const t = v.t;
      const p = r(0.8, 1.25);
      k.noise(v.out, t, 0.08, 0.2, 'bandpass', 2400 * p, 900, 1.5, 0.001); // dry crunch
      for (let j = 0; j < 3; j++) k.noise(v.out, t + j * 0.025, 0.03, 0.08, 'highpass', r(2500, 4500), null, 1, 0.0005);
      k.tone(v.out, 'sine', 260 * p, 90, t, 0.12, 0.12, 0.002);
      k.noise(v.out, t + 0.05, 0.15, 0.05, 'highpass', 5000, null, 0.7, 0.02); // sand trickle
      return 0.21;
    }
    case 'spook_die': {
      const v = k.newVoice(pan, vol, 0.25);
      const t = v.t;
      const p = r(0.85, 1.2);
      k.noise(v.out, t, 0.22, 0.16, 'bandpass', 800 * p, 2800 * p, 2, 0.01); // poof
      k.tone(v.out, 'sine', 700 * p, 350 * p, t, 0.2, 0.06, 0.02); // ghostly sigh
      for (let j = 0; j < 3; j++) k.tone(v.out, 'sine', r(1400, 2000), null, t + 0.03 + j * 0.03, 0.03, 0.05, 0.0008); // rattle
      return 0.24;
    }
    case 'frost_die': {
      const v = k.newVoice(pan, vol, 0.15);
      const t = v.t;
      const p = r(0.85, 1.2);
      k.noise(v.out, t, 0.14, 0.2, 'lowpass', 2500 * p, 500, 0.9, 0.002); // crunchy burst
      k.noise(v.out, t, 0.04, 0.1, 'highpass', 4000, null, 0.7, 0.0005);
      k.tone(v.out, 'sine', 220 * p, 80, t, 0.1, 0.12, 0.002);
      k.tone(v.out, 'sine', r(3000, 4500), null, t + 0.02, 0.1, 0.025, 0.001); // ice glint
      return 0.18;
    }
    // ======================================================== generic
    case 'burrow': {
      const v = k.newVoice(pan, vol, 0.1);
      const t = v.t;
      for (let j = 0; j < 4; j++) {
        const tt = t + j * r(0.07, 0.11);
        k.noise(v.out, tt, 0.08, 0.14, 'lowpass', r(600, 1100), 200, 1.2, 0.005); // scoops
        k.noise(v.out, tt + 0.02, 0.05, 0.04, 'bandpass', 2500, null, 1, 0.003); // dirt spray
      }
      k.tone(v.out, 'sine', 90, 50, t, 0.35, 0.15, 0.02);
      return 0.45;
    }
    case 'illusion': {
      const v = k.newVoice(pan, vol, 0.4);
      const t = v.t;
      k.tone(v.out, 'sine', 1100, 2200, t, 0.18, 0.05, 0.02);
      k.tone(v.out, 'sine', 1650, 3300, t, 0.15, 0.03, 0.02);
      k.noise(v.out, t, 0.2, 0.06, 'bandpass', 5000, 8000, 5, 0.01);
      k.tone(v.out, 'sine', 400, 900, t + 0.12, 0.05, 0.06, 0.002); // pop
      return 0.25;
    }
    default:
      return -1;
  }
}
