// Generative scores for the four seasonal campaigns (spring / summer / autumn / winter).
// Same layer buses (pad / arp / bass / drums), similar density and levels as the night and day scores.

import type { Mood } from './audio';
import { envGain, lowpass, mtof, osc, padGainEnv, pick, rnd, type Kit, type MoodSpec } from './kit';

export type SeasonRealm = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Layers {
  pad: GainNode;
  arp: GainNode;
  bass: GainNode;
  drums: GainNode;
}

export interface StepInfo {
  spec: MoodSpec;
  t: number;
  stepDur: number;
  step: number;
  chord: number[];
  newChord: boolean;
  mood: Mood;
  intensity: number;
}

// ======================================================================== mood tables

// ---- Spring (G major, lydian colour): pastoral, lilting.
// Gadd9, Cmaj7#11, Am7, D6sus
const SPRING_CALM = [
  [43, 55, 59, 62, 69],
  [48, 55, 59, 64, 66],
  [45, 57, 60, 64, 67],
  [50, 57, 62, 64, 71],
];
// Jaunty I-IV-V-vi: G, C, D, Em
const SPRING_WAVE = [
  [43, 55, 59, 62, 67],
  [48, 55, 60, 64, 67],
  [50, 57, 62, 66, 69],
  [40, 55, 59, 64, 67],
];
// Folk minor urgency: Em, C, D, B
const SPRING_BOSS = [
  [40, 52, 59, 64, 67],
  [36, 52, 60, 64, 67],
  [38, 50, 57, 62, 66],
  [35, 51, 54, 59, 63],
];
const SPRING_VICTORY = [
  [43, 55, 59, 62, 67],
  [43, 55, 60, 64, 72],
  [43, 54, 57, 62, 69],
  [43, 55, 59, 67, 74],
];
const SPRING_MOODS: Record<Mood, MoodSpec> = {
  menu: { bpm: 78, prog: SPRING_CALM, stepsPerChord: 32, pad: 0.9, arp: 0.6, bass: 0, drums: 0, arpProb: 0.22 },
  build: { bpm: 82, prog: SPRING_CALM, stepsPerChord: 32, pad: 0.9, arp: 0.7, bass: 0, drums: 0, arpProb: 0.28 },
  wave: { bpm: 112, prog: SPRING_WAVE, stepsPerChord: 32, pad: 0.6, arp: 0.75, bass: 0.8, drums: 0.75, arpProb: 0.3 },
  boss: { bpm: 120, prog: SPRING_BOSS, stepsPerChord: 16, pad: 0.65, arp: 0.7, bass: 1, drums: 1, arpProb: 0.35 },
  defeat: { bpm: 66, prog: SPRING_CALM, stepsPerChord: 32, pad: 0, arp: 0, bass: 0, drums: 0, arpProb: 0 },
  victory: { bpm: 88, prog: SPRING_VICTORY, stepsPerChord: 16, pad: 1, arp: 0.8, bass: 0, drums: 0, arpProb: 0.4 },
};

// ---- Summer (E phrygian dominant): drones, oud and kanun, darbuka.
// E, F, Dm/E, E
const SUMMER_CALM = [
  [40, 52, 56, 59, 64],
  [41, 53, 57, 60, 65],
  [40, 50, 57, 62, 65],
  [40, 52, 56, 59, 64],
];
// E, F, G#dim, E
const SUMMER_WAVE = [
  [40, 52, 56, 59, 64],
  [41, 53, 57, 60, 65],
  [44, 50, 56, 59, 62],
  [40, 52, 56, 59, 64],
];
// Am, F, E, E (driving, darker)
const SUMMER_BOSS = [
  [45, 52, 57, 60, 64],
  [41, 53, 57, 60, 65],
  [40, 52, 56, 59, 64],
  [40, 50, 56, 59, 62],
];
// E, A, B, E (sunlit major)
const SUMMER_VICTORY = [
  [40, 52, 56, 59, 64],
  [45, 52, 57, 61, 64],
  [47, 54, 59, 63, 66],
  [40, 52, 56, 59, 68],
];
const SUMMER_MOODS: Record<Mood, MoodSpec> = {
  menu: { bpm: 74, prog: SUMMER_CALM, stepsPerChord: 32, pad: 0.9, arp: 0.6, bass: 0, drums: 0, arpProb: 0.2 },
  build: { bpm: 80, prog: SUMMER_CALM, stepsPerChord: 32, pad: 0.9, arp: 0.7, bass: 0, drums: 0, arpProb: 0.26 },
  wave: { bpm: 104, prog: SUMMER_WAVE, stepsPerChord: 32, pad: 0.65, arp: 0.75, bass: 0.8, drums: 0.8, arpProb: 0.3 },
  boss: { bpm: 116, prog: SUMMER_BOSS, stepsPerChord: 16, pad: 0.7, arp: 0.7, bass: 1, drums: 1, arpProb: 0.35 },
  defeat: { bpm: 60, prog: SUMMER_CALM, stepsPerChord: 32, pad: 0, arp: 0, bass: 0, drums: 0, arpProb: 0 },
  victory: { bpm: 86, prog: SUMMER_VICTORY, stepsPerChord: 16, pad: 1, arp: 0.8, bass: 0, drums: 0, arpProb: 0.4 },
};

// ---- Autumn (D minor, waltz time: 12 sixteenths per bar): music box, theremin, organ, bones.
// Dm, Bb, Gm6, A7
const AUTUMN_CALM = [
  [38, 50, 57, 62, 65],
  [34, 50, 58, 62, 65],
  [43, 50, 55, 58, 64],
  [33, 49, 55, 61, 64],
];
// Dm, C#dim7, Dm, A7
const AUTUMN_WAVE = [
  [38, 50, 57, 62, 65],
  [37, 49, 55, 58, 64],
  [38, 50, 57, 62, 65],
  [33, 49, 55, 61, 67],
];
// Dm, Bb, Gm, A7b9 (one bar each)
const AUTUMN_BOSS = [
  [38, 50, 57, 62, 65],
  [34, 50, 58, 62, 65],
  [31, 50, 55, 58, 62],
  [33, 49, 55, 58, 61],
];
// D (picardy), G, A, D
const AUTUMN_VICTORY = [
  [38, 50, 57, 62, 66],
  [43, 50, 59, 62, 67],
  [45, 52, 57, 61, 64],
  [38, 50, 57, 62, 66],
];
const AUTUMN_MOODS: Record<Mood, MoodSpec> = {
  menu: { bpm: 84, prog: AUTUMN_CALM, stepsPerChord: 24, pad: 0.85, arp: 0.6, bass: 0, drums: 0, arpProb: 0.24 },
  build: { bpm: 90, prog: AUTUMN_CALM, stepsPerChord: 24, pad: 0.85, arp: 0.7, bass: 0, drums: 0, arpProb: 0.3 },
  wave: { bpm: 132, prog: AUTUMN_WAVE, stepsPerChord: 24, pad: 0.6, arp: 0.75, bass: 0.85, drums: 0.8, arpProb: 0.3 },
  boss: { bpm: 144, prog: AUTUMN_BOSS, stepsPerChord: 12, pad: 0.7, arp: 0.7, bass: 1, drums: 1, arpProb: 0.38 },
  defeat: { bpm: 60, prog: AUTUMN_CALM, stepsPerChord: 24, pad: 0, arp: 0, bass: 0, drums: 0, arpProb: 0 },
  victory: { bpm: 100, prog: AUTUMN_VICTORY, stepsPerChord: 24, pad: 1, arp: 0.8, bass: 0, drums: 0, arpProb: 0.42 },
};

// ---- Winter (A major / F# minor): glassy celesta, sleigh bells, warm low strings, timpani.
// Amaj9, F#m11, Dmaj7#11, E6sus
const WINTER_CALM = [
  [45, 52, 56, 59, 71],
  [42, 54, 57, 61, 64],
  [38, 54, 57, 61, 68],
  [40, 52, 57, 59, 66],
];
// F#m, D, A, E
const WINTER_WAVE = [
  [42, 54, 57, 61, 64],
  [38, 54, 57, 62, 66],
  [45, 52, 57, 61, 64],
  [40, 52, 56, 59, 64],
];
// F#m, D, Bm, C#
const WINTER_BOSS = [
  [42, 54, 57, 61, 66],
  [38, 50, 57, 62, 66],
  [35, 50, 54, 59, 62],
  [37, 49, 56, 61, 65],
];
// A, D/A, E/A, Aadd9
const WINTER_VICTORY = [
  [45, 52, 57, 61, 64],
  [45, 54, 57, 62, 66],
  [45, 52, 59, 64, 68],
  [45, 52, 57, 64, 71],
];
const WINTER_MOODS: Record<Mood, MoodSpec> = {
  menu: { bpm: 58, prog: WINTER_CALM, stepsPerChord: 32, pad: 1, arp: 0.6, bass: 0, drums: 0, arpProb: 0.2 },
  build: { bpm: 62, prog: WINTER_CALM, stepsPerChord: 32, pad: 1, arp: 0.7, bass: 0, drums: 0, arpProb: 0.26 },
  wave: { bpm: 80, prog: WINTER_WAVE, stepsPerChord: 32, pad: 0.75, arp: 0.75, bass: 0.85, drums: 0.8, arpProb: 0.3 },
  boss: { bpm: 88, prog: WINTER_BOSS, stepsPerChord: 16, pad: 0.85, arp: 0.7, bass: 1, drums: 1, arpProb: 0.36 },
  defeat: { bpm: 54, prog: WINTER_CALM, stepsPerChord: 32, pad: 0, arp: 0, bass: 0, drums: 0, arpProb: 0 },
  victory: { bpm: 70, prog: WINTER_VICTORY, stepsPerChord: 16, pad: 1, arp: 0.8, bass: 0, drums: 0, arpProb: 0.4 },
};

export const SEASON_MOODS: Record<SeasonRealm, Record<Mood, MoodSpec>> = {
  spring: SPRING_MOODS,
  summer: SUMMER_MOODS,
  autumn: AUTUMN_MOODS,
  winter: WINTER_MOODS,
};

export function isSeasonRealm(r: string): r is SeasonRealm {
  return r === 'spring' || r === 'summer' || r === 'autumn' || r === 'winter';
}

// ======================================================================== shared instruments

/** Breathy wind instrument (recorder / ney): sine+triangle, delayed vibrato, breath noise. */
function windNote(k: Kit, dest: AudioNode, m: number, t: number, len: number, peak: number, breath: number, vibHz: number, lpMul = 3) {
  const ctx = k.ctx;
  const f = mtof(m);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.06);
  g.gain.setValueAtTime(peak * 0.9, t + len * 0.75);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.2);
  g.connect(dest);
  const lp = lowpass(k, g, f * lpMul, 0.5);
  const o = osc(k, lp, 'triangle', f, t, t + len + 0.25);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = vibHz;
  const lg = ctx.createGain();
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.5, len * 0.6));
  lfo.connect(lg);
  lg.connect(o.frequency);
  lfo.start(t);
  lfo.stop(t + len + 0.3);
  k.noise(g, t, Math.min(0.18, len), breath, 'bandpass', f * 2, null, 2.5, 0.03);
}

/** Bright plucked string: saw/square through a fast-closing resonant lowpass. */
function pluckStr(k: Kit, dest: AudioNode, m: number, t: number, dur: number, peak: number, bright: number, type: OscillatorType = 'sawtooth') {
  const ctx = k.ctx;
  const f = mtof(m);
  const g = envGain(k, dest, t, peak, dur, 0.002);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 2;
  lp.frequency.setValueAtTime(Math.min(9000, f * bright), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.3), t + Math.min(0.25, dur * 0.6));
  lp.connect(g);
  osc(k, lp, type, f, t, t + dur);
}

function woodblock(k: Kit, dest: AudioNode, t: number, f: number, peak: number) {
  k.tone(dest, 'sine', f, f * 0.92, t, 0.07, peak, 0.001);
  k.noise(dest, t, 0.012, peak * 0.5, 'bandpass', f * 2.5, null, 3, 0.0005);
}

function shaker(k: Kit, dest: AudioNode, t: number, peak: number) {
  k.noise(dest, t, 0.06, peak, 'highpass', 6500, null, 0.7, 0.012);
}

function softKick(k: Kit, dest: AudioNode, t: number, peak: number) {
  k.tone(dest, 'sine', 105, 50, t, 0.3, peak, 0.002);
}

function timpani(k: Kit, dest: AudioNode, t: number, m: number, peak: number) {
  const f = mtof(m);
  k.tone(dest, 'sine', f * 1.15, f, t, 1.2, peak, 0.004);
  k.tone(dest, 'sine', f * 1.5, f * 1.48, t, 0.6, peak * 0.25, 0.004);
  k.noise(dest, t, 0.15, peak * 0.3, 'lowpass', 700, 200, 1, 0.002);
}

/** Two-oscillator pad chord through a moving lowpass. */
function padChord(
  k: Kit,
  dest: AudioNode,
  notes: number[],
  t: number,
  len: number,
  peak: number,
  lpA: number,
  lpB: number,
  lowType: OscillatorType,
  hiType: OscillatorType,
  det: number,
  attack = 2.5,
) {
  const dur = len + 1.5;
  const lp = k.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(lpA, t);
  lp.frequency.linearRampToValueAtTime(lpB, t + len * 0.5);
  lp.frequency.linearRampToValueAtTime(lpA * 0.85, t + dur);
  lp.Q.value = 0.5;
  const g = padGainEnv(k, dest, t, peak, len, Math.min(attack, len * 0.3), 1.5);
  lp.connect(g);
  for (const n of notes) {
    const low = n < 52;
    for (const d of [-det, det]) osc(k, lp, low ? lowType : hiType, mtof(n), t, t + dur, low ? 0.45 : 0.26, d);
  }
}

// per-realm melodic memory (so lines walk rather than jump)
const mem = { idx: 3, dir: 1, phraseLeft: 0 };

function walk(len: number): number {
  if (Math.random() < 0.25) mem.dir = -mem.dir;
  let i = mem.idx + mem.dir * (Math.random() < 0.8 ? 1 : 2);
  if (i < 0) {
    i = 1;
    mem.dir = 1;
  } else if (i >= len) {
    i = len - 2;
    mem.dir = -1;
  }
  mem.idx = i;
  return i;
}

// ======================================================================== step dispatch

export function playSeasonStep(realm: SeasonRealm, k: Kit, L: Layers, s: StepInfo): void {
  if (s.mood === 'defeat') return;
  switch (realm) {
    case 'spring':
      return springStep(k, L, s);
    case 'summer':
      return summerStep(k, L, s);
    case 'autumn':
      return autumnStep(k, L, s);
    case 'winter':
      return winterStep(k, L, s);
  }
}

// ======================================================================== spring

const G_MAJOR = [55, 57, 59, 62, 64, 66, 67, 69, 71, 74, 76, 78, 79]; // G3.. with F# for lydian lift (over C)

function springStep(k: Kit, L: Layers, s: StepInfo) {
  const { t, stepDur, chord, mood } = s;
  const combat = mood === 'wave' || mood === 'boss';
  const boss = mood === 'boss';
  const calm = mood === 'menu' || mood === 'build';
  const i = combat ? s.intensity : 0;
  const beat = s.step % 16;
  // lilting shuffle: off-eighths land late (triplet feel)
  const lilt = beat % 4 === 2 ? stepDur * 0.33 : 0;

  if (s.newChord) {
    const len = stepDur * s.spec.stepsPerChord;
    if (s.spec.pad > 0)
      padChord(k, L.pad, chord.slice(0, 4), t, len, 0.09, boss ? 1100 : 1500, boss ? 1900 : 2700, 'sine', 'triangle', 4);
    if ((calm || mood === 'victory') && Math.random() < 0.7) recorderPhrase(k, L.arp, chord, t + stepDur * 4, stepDur, 3 + Math.floor(Math.random() * 3));
    else if (mood === 'wave' && Math.random() < 0.4) recorderPhrase(k, L.arp, chord, t + stepDur * 8, stepDur, 4);
  }

  // lute / harp plucks rolling up the chord
  if (s.spec.arp > 0) {
    if (boss) {
      // fiddle ostinato: driving sixteenths over the chord
      const pat = [0, 2, 1, 2, 3, 2, 1, 2];
      if ((beat % 2 === 0 || i > 0.45) && Math.random() < 0.55 + 0.4 * i) {
        const tones = chord.slice(1);
        const m = tones[pat[(s.step >> (i > 0.45 ? 0 : 1)) % pat.length] % tones.length] + 12;
        fiddle(k, L.arp, m, t, stepDur * 1.6, 0.03);
      }
    } else {
      const onEighth = beat % 2 === 0;
      const prob = combat ? s.spec.arpProb + 0.4 * i : s.spec.arpProb;
      if ((onEighth || (combat && i > 0.5)) && Math.random() < prob) {
        const tones = chord.slice(1);
        const idx = (s.step >> 1) % tones.length;
        const m = tones[Math.random() < 0.7 ? idx : Math.floor(Math.random() * tones.length)] + (Math.random() < 0.3 ? 24 : 12);
        pluckStr(k, L.arp, m, t + lilt, combat ? 0.4 : 0.75, combat ? 0.042 : 0.038, 5, 'triangle');
      }
    }
  }

  // birdsong over the calm garden
  if ((calm || mood === 'victory') && Math.random() < 0.007) birds(k, L.arp, t);

  // oom-pah folk bass: root on 1 & 3, fifth on 2 & 4 (eighths in a boss)
  if (s.spec.bass > 0) {
    const root = chord[0] - 12;
    if (beat % 4 === 0) springBass(k, L.bass, beat % 8 === 0 ? root : root + 7, t, stepDur * 2.5);
    else if (boss && beat % 4 === 2) springBass(k, L.bass, root + 12, t, stepDur * 1.5);
  }

  if (s.spec.drums > 0) {
    if (boss) {
      // bodhran jig pattern
      if (beat === 0 || beat === 8) bodhran(k, L.drums, t, 0.5);
      else if (beat === 3 || beat === 6 || beat === 11 || beat === 14) bodhran(k, L.drums, t, 0.22);
      if (i > 0.6 && beat === 15) bodhran(k, L.drums, t, 0.18);
    } else if (beat === 0 || beat === 8) softKick(k, L.drums, t, 0.4);
    if (beat % 4 === 2) woodblock(k, L.drums, t + lilt, beat === 6 || beat === 14 ? 880 : 1180, 0.09);
    if (i > 0.3 && beat % 2 === 0) shaker(k, L.drums, t, 0.035);
    if (i > 0.6 && beat % 2 === 1 && Math.random() < 0.5) shaker(k, L.drums, t, 0.02);
  }
}

function recorderPhrase(k: Kit, dest: AudioNode, chord: number[], t: number, stepDur: number, n: number) {
  // start near a chord tone, then step through the scale
  const target = chord[2] + 12;
  let idx = G_MAJOR.findIndex((m) => m >= target);
  if (idx < 0) idx = 6;
  let tt = t;
  for (let j = 0; j < n; j++) {
    idx = Math.max(0, Math.min(G_MAJOR.length - 1, idx + (Math.random() < 0.55 ? 1 : -1) * (Math.random() < 0.75 ? 1 : 2)));
    const len = stepDur * pick([2, 2, 3, 4, 6]);
    windNote(k, dest, G_MAJOR[idx] + 12, tt, len, 0.03, 0.07, 5.5, 3);
    tt += len;
  }
}

function fiddle(k: Kit, dest: AudioNode, m: number, t: number, dur: number, peak: number) {
  const g = envGain(k, dest, t, peak, dur, 0.015);
  const lp = lowpass(k, g, 2400, 1.2);
  const f = mtof(m);
  osc(k, lp, 'sawtooth', f, t, t + dur, 0.6, -6);
  osc(k, lp, 'sawtooth', f, t, t + dur, 0.6, 6);
}

function springBass(k: Kit, dest: AudioNode, m: number, t: number, dur: number) {
  const g = envGain(k, dest, t, 0.15, dur, 0.006);
  const lp = lowpass(k, g, 700, 1);
  osc(k, lp, 'triangle', mtof(m), t, t + dur);
  osc(k, lp, 'sine', mtof(m), t, t + dur, 0.6);
}

function bodhran(k: Kit, dest: AudioNode, t: number, peak: number) {
  k.tone(dest, 'sine', 92, 52, t, 0.28, peak, 0.002);
  k.noise(dest, t, 0.08, peak * 0.25, 'lowpass', 900, 300, 1, 0.002);
}

function birds(k: Kit, dest: AudioNode, t: number) {
  const n = 2 + Math.floor(Math.random() * 4);
  const base = 2600 + Math.random() * 1600;
  for (let j = 0; j < n; j++) {
    const tt = t + j * rnd(0.08, 0.14);
    const f = base * rnd(0.9, 1.15);
    k.tone(dest, 'sine', f, f * rnd(1.2, 1.55), tt, 0.06, 0.015, 0.004);
  }
}

// ======================================================================== summer

// E phrygian dominant: E F G# A B C D
const PHRYG_DOM = [52, 53, 56, 57, 59, 60, 62, 64, 65, 68, 69, 71, 72, 74, 76];

function summerStep(k: Kit, L: Layers, s: StepInfo) {
  const { t, stepDur, chord, mood } = s;
  const combat = mood === 'wave' || mood === 'boss';
  const boss = mood === 'boss';
  const calm = mood === 'menu' || mood === 'build';
  const i = combat ? s.intensity : 0;
  const beat = s.step % 16;

  if (s.newChord) {
    const len = stepDur * s.spec.stepsPerChord;
    if (s.spec.pad > 0) summerDrone(k, L.pad, chord, t, len, boss);
    if ((calm || mood === 'victory') && Math.random() < 0.45) neyPhrase(k, L.arp, chord, t + stepDur * 6, stepDur);
    if (Math.random() < 0.5) kanunRipple(k, L.arp, chord, t + stepDur * (calm ? 2 : 0), stepDur * 0.5);
    mem.phraseLeft = combat ? 0 : 6 + Math.floor(Math.random() * 6);
  }

  // oud melody: walking the maqam with grace-note ornaments
  if (s.spec.arp > 0) {
    const onEighth = beat % 2 === 0;
    const prob = combat ? s.spec.arpProb + 0.4 * i : s.spec.arpProb * 1.4;
    const allowed = combat ? onEighth || i > 0.5 : onEighth && mem.phraseLeft > 0;
    if (allowed && Math.random() < prob) {
      const idx = walk(PHRYG_DOM.length);
      const oct = combat && Math.random() < 0.25 ? 12 : 0;
      const m = PHRYG_DOM[idx] + oct;
      const dur = combat ? 0.32 : 0.6;
      const grace = Math.random() < 0.2;
      if (grace) pluckStr(k, L.arp, PHRYG_DOM[Math.min(PHRYG_DOM.length - 1, idx + 1)] + oct, t, 0.08, 0.024, 7); // upper-neighbour ornament
      pluckStr(k, L.arp, m, t + (grace ? stepDur * 0.4 : 0), dur, combat ? 0.044 : 0.04, 7);
      mem.phraseLeft--;
    }
  }

  // bass: oud low register following the rhythm
  if (s.spec.bass > 0) {
    const root = chord[0] - 12;
    if (beat === 0 || beat === 8 || (boss && (beat === 2 || beat === 10)) || (i > 0.5 && beat === 6))
      summerBass(k, L.bass, beat === 6 ? root + 12 : root, t, stepDur * 1.8);
  }

  if (s.spec.drums > 0) {
    if (boss) {
      // baladi: D D . T D . T . (+ ka fills)
      if (beat === 0 || beat === 2 || beat === 8) dum(k, L.drums, t, beat === 0 ? 0.55 : 0.42);
      if (beat === 6 || beat === 12) tek(k, L.drums, t, 0.1);
      if (beat === 14 || beat === 10) tek(k, L.drums, t, 0.06);
      if (i > 0.4 && beat % 2 === 1 && Math.random() < 0.7) tek(k, L.drums, t, 0.035);
    } else {
      // maqsum: D T . T D . T .
      if (beat === 0 || beat === 8) dum(k, L.drums, t, 0.5);
      if (beat === 2 || beat === 6 || beat === 12) tek(k, L.drums, t, 0.08);
      if (i > 0.35 && (beat === 4 || beat === 10 || beat === 14)) tek(k, L.drums, t, 0.045);
      if (i > 0.65 && beat % 2 === 1 && Math.random() < 0.45) tek(k, L.drums, t, 0.028);
    }
    if (i > 0.5 && beat % 4 === 0) riq(k, L.drums, t + stepDur * 0.5, 0.035);
  }
}

function summerDrone(k: Kit, dest: AudioNode, chord: number[], t: number, len: number, boss: boolean) {
  const root = chord[0];
  // root + fifth drone in saws, upper chord tones as soft triangles
  padChord(k, dest, [root, root + 7], t, len, 0.09, boss ? 450 : 380, boss ? 900 : 700, 'sawtooth', 'sawtooth', 6, 1.5);
  padChord(k, dest, chord.slice(2, 4), t, len, 0.06, 1300, 2000, 'triangle', 'triangle', 5);
}

function kanunRipple(k: Kit, dest: AudioNode, chord: number[], t: number, gap: number) {
  // a quick glittering run up the scale from a chord tone
  let idx = PHRYG_DOM.findIndex((m) => m >= chord[1] + 12);
  if (idx < 0) idx = 5;
  const n = 4 + Math.floor(Math.random() * 3);
  for (let j = 0; j < n && idx + j < PHRYG_DOM.length; j++)
    pluckStr(k, dest, PHRYG_DOM[idx + j] + 12, t + j * gap, 0.35, 0.022 - j * 0.002, 10, 'square');
}

function neyPhrase(k: Kit, dest: AudioNode, chord: number[], t: number, stepDur: number) {
  let idx = PHRYG_DOM.findIndex((m) => m >= chord[1] + 12);
  if (idx < 0) idx = 7;
  let tt = t;
  const n = 2 + Math.floor(Math.random() * 3);
  for (let j = 0; j < n; j++) {
    idx = Math.max(0, Math.min(PHRYG_DOM.length - 1, idx + (Math.random() < 0.6 ? -1 : 1)));
    const len = stepDur * pick([4, 6, 8]);
    windNote(k, dest, PHRYG_DOM[idx], tt, len, 0.032, 0.14, 4.5, 2);
    tt += len;
  }
}

function summerBass(k: Kit, dest: AudioNode, m: number, t: number, dur: number) {
  const g = envGain(k, dest, t, 0.13, dur, 0.004);
  const lp = k.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 3;
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.exponentialRampToValueAtTime(160, t + dur);
  lp.connect(g);
  osc(k, lp, 'sawtooth', mtof(m), t, t + dur);
  osc(k, lp, 'sine', mtof(m), t, t + dur, 0.8);
}

function dum(k: Kit, dest: AudioNode, t: number, peak: number) {
  k.tone(dest, 'sine', 125, 62, t, 0.26, peak, 0.002);
  k.noise(dest, t, 0.05, peak * 0.2, 'lowpass', 600, null, 1, 0.002);
}

function tek(k: Kit, dest: AudioNode, t: number, peak: number) {
  k.noise(dest, t, 0.045, peak, 'bandpass', rnd(3200, 3800), null, 1.6, 0.0008);
  k.tone(dest, 'sine', 680, 560, t, 0.035, peak * 0.6, 0.001);
}

function riq(k: Kit, dest: AudioNode, t: number, peak: number) {
  k.noise(dest, t, 0.08, peak, 'bandpass', 8500, null, 1.5, 0.002);
  k.noise(dest, t + 0.02, 0.06, peak * 0.6, 'bandpass', 11000, null, 2, 0.002);
}

// ======================================================================== autumn

// D harmonic minor
const D_HARM = [62, 64, 65, 67, 69, 70, 73, 74, 76, 77, 79, 81];

function autumnStep(k: Kit, L: Layers, s: StepInfo) {
  const { t, stepDur, chord, mood } = s;
  const combat = mood === 'wave' || mood === 'boss';
  const boss = mood === 'boss';
  const calm = mood === 'menu' || mood === 'build';
  const i = combat ? s.intensity : 0;
  const bar = s.step % 12; // waltz: beats at 0, 4, 8

  if (s.newChord) {
    const len = stepDur * s.spec.stepsPerChord;
    if (s.spec.pad > 0) organ(k, L.pad, chord.slice(0, 4), t, len, boss);
    if ((calm || mood === 'victory') && Math.random() < 0.5) theremin(k, L.arp, chord, t + stepDur * 2, stepDur * 4, 3 + Math.floor(Math.random() * 2));
    else if (mood === 'wave' && Math.random() < 0.22) theremin(k, L.arp, chord, t, stepDur * 4, 3);
    if (boss) brassStab(k, L.pad, chord, t);
  }

  // music box (calm) / xylophone danse (combat)
  if (s.spec.arp > 0) {
    const onEighth = s.step % 2 === 0;
    const prob = combat ? s.spec.arpProb + 0.45 * i : s.spec.arpProb;
    if ((onEighth || (boss && i > 0.5)) && Math.random() < prob) {
      if (combat) {
        const m = D_HARM[walk(D_HARM.length)];
        xylo(k, L.arp, m, t, 0.045);
      } else {
        const tones = chord.slice(1);
        const m = tones[(s.step >> 1) % tones.length] + (Math.random() < 0.4 ? 24 : 12);
        musicBox(k, L.arp, m, t, 0.042);
      }
    }
  }

  // pizzicato bass: oom on the downbeat (every beat in a boss)
  if (s.spec.bass > 0) {
    const root = chord[0] - 12;
    if (bar === 0) pizz(k, L.bass, root, t, 0.16);
    else if (boss && (bar === 4 || bar === 8)) pizz(k, L.bass, bar === 4 ? root + 7 : root + 12, t, 0.11);
    else if (i > 0.55 && bar === 10) pizz(k, L.bass, root + 6, t, 0.08); // sly tritone pickup
  }

  // bones: "pah-pah" xylophone chords on beats 2 & 3, woodblock rattles
  if (s.spec.drums > 0) {
    if (bar === 0) {
      if (boss) timpani(k, L.drums, t, chord[0] - 12, 0.5);
      else softKick(k, L.drums, t, 0.38);
    }
    if (bar === 4 || bar === 8) {
      xylo(k, L.drums, chord[1] + 12, t, 0.07);
      xylo(k, L.drums, chord[2] + 12, t, 0.055);
    }
    if (i > 0.35 && (bar === 2 || bar === 6 || bar === 10)) woodblock(k, L.drums, t, bar === 6 ? 1500 : 1900, 0.05);
    if (i > 0.65 && s.step % 2 === 1 && Math.random() < 0.4) woodblock(k, L.drums, t, 2300, 0.025);
    if (boss && s.step % 24 === 20) timpani(k, L.drums, t, chord[0] - 5, 0.3);
  }
}

function organ(k: Kit, dest: AudioNode, notes: number[], t: number, len: number, boss: boolean) {
  const dur = len + 1.5;
  const ctx = k.ctx;
  const trem = ctx.createGain();
  trem.gain.value = 0.85;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.5;
  const lg = ctx.createGain();
  lg.gain.value = 0.12;
  lfo.connect(lg);
  lg.connect(trem.gain);
  lfo.start(t);
  lfo.stop(t + dur + 0.05);
  const g = padGainEnv(k, dest, t, 0.1, len, Math.min(1.2, len * 0.25), 1.5);
  trem.connect(g);
  const lp = lowpass(k, trem, boss ? 900 : 1150, 0.6);
  for (const n of notes) {
    osc(k, lp, 'square', mtof(n), t, t + dur, n < 52 ? 0.32 : 0.16, 3);
    osc(k, lp, 'sine', mtof(n) * 2, t, t + dur, 0.2);
  }
}

function musicBox(k: Kit, dest: AudioNode, m: number, t: number, peak: number) {
  const f = mtof(m);
  k.tone(dest, 'sine', f, null, t, 1.1, peak, 0.002);
  k.tone(dest, 'sine', f * 3, null, t, 0.25, peak * 0.3, 0.001);
}

function xylo(k: Kit, dest: AudioNode, m: number, t: number, peak: number) {
  const f = mtof(m);
  k.tone(dest, 'sine', f, null, t, 0.2, peak, 0.001);
  k.tone(dest, 'sine', f * 3.93, null, t, 0.05, peak * 0.45, 0.001);
}

function pizz(k: Kit, dest: AudioNode, m: number, t: number, peak: number) {
  const g = envGain(k, dest, t, peak, 0.32, 0.003);
  const lp = k.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1200, t);
  lp.frequency.exponentialRampToValueAtTime(220, t + 0.25);
  lp.connect(g);
  osc(k, lp, 'triangle', mtof(m), t, t + 0.32);
  osc(k, lp, 'sawtooth', mtof(m), t, t + 0.32, 0.35);
}

/** Gliding sine lead with vibrato: one oscillator sliding between chord tones. */
function theremin(k: Kit, dest: AudioNode, chord: number[], t: number, noteLen: number, n: number) {
  const ctx = k.ctx;
  const total = noteLen * n;
  const o = ctx.createOscillator();
  o.type = 'sine';
  const tones = chord.slice(1).map((m) => m + 12);
  let m = pick(tones);
  o.frequency.setValueAtTime(mtof(m) * 0.94, t);
  o.frequency.setTargetAtTime(mtof(m), t, 0.08);
  for (let j = 1; j < n; j++) {
    m = Math.random() < 0.3 ? m + pick([-1, 1]) : pick(tones);
    o.frequency.setTargetAtTime(mtof(m), t + j * noteLen, 0.09);
  }
  o.frequency.setTargetAtTime(mtof(m) * 0.92, t + total, 0.15); // droop off at the end
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 6.2;
  const lg = ctx.createGain();
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(mtof(m) * 0.012, t + total * 0.4);
  lfo.connect(lg);
  lg.connect(o.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.03, t + 0.25);
  g.gain.setValueAtTime(0.03, t + total - 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + total + 0.45);
  o.connect(g);
  g.connect(dest);
  o.start(t);
  lfo.start(t);
  o.stop(t + total + 0.5);
  lfo.stop(t + total + 0.5);
}

function brassStab(k: Kit, dest: AudioNode, chord: number[], t: number) {
  const notes = [chord[0], chord[0] + 6, chord[0] + 12]; // tritone stab
  const g = envGain(k, dest, t, 0.06, 0.7, 0.02);
  const lp = k.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(300, t + 0.6);
  lp.connect(g);
  for (const n of notes) osc(k, lp, 'sawtooth', mtof(n), t, t + 0.7, 0.3, rnd(-6, 6));
}

// ======================================================================== winter

function winterStep(k: Kit, L: Layers, s: StepInfo) {
  const { t, stepDur, chord, mood } = s;
  const combat = mood === 'wave' || mood === 'boss';
  const boss = mood === 'boss';
  const calm = mood === 'menu' || mood === 'build';
  const i = combat ? s.intensity : 0;
  const beat = s.step % 16;

  if (s.newChord) {
    const len = stepDur * s.spec.stepsPerChord;
    if (s.spec.pad > 0) winterStrings(k, L.pad, chord, t, len, boss);
    if (combat) coldBrass(k, L.pad, chord, t, Math.min(len, 4), boss);
    if (combat && s.spec.bass > 0) bowedBass(k, L.bass, chord[0] - 12, t, Math.min(len, stepDur * 16));
  }

  // celesta / glockenspiel: sparse ringing notes (calm) or an ostinato (combat)
  if (s.spec.arp > 0) {
    const tones = chord.slice(1);
    if (combat) {
      const onEighth = beat % 2 === 0;
      if ((onEighth || (boss && i > 0.6)) && Math.random() < s.spec.arpProb + 0.45 * i) {
        const pat = [0, 2, 3, 1];
        const m = tones[pat[(s.step >> 1) % pat.length] % tones.length] + 24;
        glock(k, L.arp, m, t, 0.75, 0.036);
      }
    } else if (beat % 4 === 0 || (beat % 2 === 0 && Math.random() < 0.3)) {
      if (Math.random() < s.spec.arpProb * 1.6) {
        const m = pick(tones) + (Math.random() < 0.5 ? 24 : 12);
        k.bell(L.arp, mtof(m), t, rnd(1.6, 2.6), 0.04);
      }
    }
  }

  // sleigh-bell shimmer
  if (calm || mood === 'victory') {
    if (Math.random() < 0.006) sleigh(k, L.arp, t, 0.03, 4 + Math.floor(Math.random() * 4));
  } else if (combat && s.spec.drums > 0 && i > 0.4 && beat % 2 === 0) sleigh(k, L.drums, t, 0.022, 1);

  // timpani pulses (+ rolls for the boss)
  if (s.spec.drums > 0) {
    const root = chord[0] - 12;
    if (beat === 0 || beat === 8) timpani(k, L.drums, t, root < 30 ? root + 12 : root, boss ? 0.5 : 0.38);
    if (i > 0.3 && (beat === 4 || beat === 12)) timpani(k, L.drums, t, root + 7, 0.25);
    if (boss && i > 0.6 && beat >= 13) timpani(k, L.drums, t, root + 7, 0.14 + (beat - 13) * 0.04);
    if (i > 0.5 && beat % 4 === 2) shaker(k, L.drums, t, 0.02);
  }
}

function winterStrings(k: Kit, dest: AudioNode, chord: number[], t: number, len: number, boss: boolean) {
  // warm low strings (filtered saws) + a glassy sine halo an octave above the top
  padChord(k, dest, chord.slice(0, 4), t, len, 0.085, boss ? 600 : 750, boss ? 1100 : 1350, 'sawtooth', 'sawtooth', 8, 3);
  const top = chord[chord.length - 1] + 12;
  const g = padGainEnv(k, dest, t, 0.02, len, Math.min(3, len * 0.4), 2);
  osc(k, g, 'sine', mtof(top), t, t + len + 2);
  osc(k, g, 'sine', mtof(top + 7), t, t + len + 2, 0.5, 4);
}

function glock(k: Kit, dest: AudioNode, m: number, t: number, dur: number, peak: number) {
  const f = mtof(m);
  k.tone(dest, 'sine', f, null, t, dur, peak, 0.001);
  k.tone(dest, 'sine', f * 2.76, null, t, dur * 0.3, peak * 0.3, 0.001);
}

function sleigh(k: Kit, dest: AudioNode, t: number, peak: number, n: number) {
  for (let j = 0; j < n; j++) {
    const tt = t + j * rnd(0.03, 0.07);
    k.noise(dest, tt, 0.05, peak * (1 - j * 0.08), 'bandpass', rnd(7500, 10500), null, 5, 0.001);
    if (j % 2 === 0) k.tone(dest, 'sine', rnd(5200, 6800), null, tt, 0.08, peak * 0.25, 0.001);
  }
}

function bowedBass(k: Kit, dest: AudioNode, m: number, t: number, len: number) {
  const g = padGainEnv(k, dest, t, 0.1, len, 0.25, 0.6);
  const lp = lowpass(k, g, 420, 1);
  osc(k, lp, 'sawtooth', mtof(m), t, t + len + 0.6);
  osc(k, lp, 'sine', mtof(m), t, t + len + 0.6, 0.8);
}

function coldBrass(k: Kit, dest: AudioNode, chord: number[], t: number, dur: number, low: boolean) {
  const notes = low ? [chord[0] - 12, chord[0] - 5, chord[0]] : [chord[0] + 12, chord[1] + 12];
  const lp = k.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1;
  lp.frequency.setValueAtTime(220, t);
  lp.frequency.exponentialRampToValueAtTime(low ? 1000 : 1500, t + dur * 0.5);
  lp.frequency.exponentialRampToValueAtTime(350, t + dur);
  const g = k.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(low ? 0.065 : 0.045, t + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest);
  lp.connect(g);
  for (const n of notes) for (const d of [-7, 7]) osc(k, lp, 'sawtooth', mtof(n), t, t + dur, 0.22, d);
}

// ======================================================================== defeat motifs

export function seasonDefeatMotif(realm: SeasonRealm, k: Kit): void {
  const ctx = k.ctx;
  const t = ctx.currentTime + 0.3;
  const g = ctx.createGain();
  g.gain.value = 0.85;
  g.connect(k.musicBus);
  g.connect(k.reverbIn);
  switch (realm) {
    case 'spring':
      [79, 76, 74, 71, 69, 67, 64, 62].forEach((m, j) => windNote(k, g, m, t + j * 0.45, 0.6, 0.07, 0.12, 5, 3));
      [43, 55, 59].forEach((m) => k.tone(g, 'triangle', mtof(m), null, t + 3.6, 4.5, 0.05, 1.0, 1500));
      break;
    case 'summer':
      [76, 74, 72, 71, 68, 67, 65, 64].forEach((m, j) => pluckStr(k, g, m, t + j * 0.42, 0.9, 0.085, 7));
      [40, 47].forEach((m) => k.tone(g, 'sawtooth', mtof(m), null, t + 3.2, 5, 0.07, 1.2, 500));
      break;
    case 'autumn':
      [74, 73, 70, 69, 65, 62, 61, 62].forEach((m, j) => musicBox(k, g, m, t + j * 0.5 + (j % 2) * 0.06, 0.09));
      theremin(k, g, [50, 62, 65, 69], t + 2.2, 0.8, 3);
      k.tone(g, 'sine', mtof(38), null, t + 3.8, 5, 0.12, 1.0);
      break;
    case 'winter':
      [81, 76, 73, 69, 64, 61, 57].forEach((m, j) => k.bell(g, mtof(m), t + j * 0.6, 2.2, 0.08));
      [42, 49, 54, 57].forEach((m) => k.tone(g, 'sawtooth', mtof(m), null, t + 3.5, 5.5, 0.05, 1.5, 700));
      break;
  }
}
