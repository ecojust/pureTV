// Compositions for Last Track. Each returns { mixes:[{name, mix, fx}], ... }. D minor, dystopian-cinematic.
import { Mix, voice, kick, taiko, snare, hat, impact, riser, mtof } from './synth.mjs';

const CH = {
  Dm: { root: 38, notes: [50, 53, 57] }, Bb: { root: 34, notes: [46, 50, 53] }, C: { root: 36, notes: [48, 52, 55] },
  Gm: { root: 43 - 12 + 12 - 12 + 0 || 31, notes: [43, 46, 50] }, A: { root: 33, notes: [45, 49, 52] }, F: { root: 41 - 12 + 0, notes: [45, 48, 53] },
};
CH.Gm.root = 31;

// ---- reusable instruments -------------------------------------------------
const pad = (m, t, dur, notes, { amp = 0.05, att = 0.4, rel = 0.8, c0 = 900, c1 = 2200, pan = 0, send = 0.5 } = {}) => {
  notes.forEach((n, i) => m.place(voice(m.rand, { freq: mtof(n), dur, osc: 'saw', detune: [-14, -6, 0, 7, 15], a: att, r: rel, c0, c1, q: 0.15, amp, vib: 0.002, vibHz: 4.5 + i * 0.3 }), t, { pan: (i - 1) * 0.35 + pan, send }));
};
const drone = (m, t, dur, midi, { amp = 0.22, c0 = 160, c1 = 420, att = 2, rel = 2 } = {}) => {
  m.place(voice(m.rand, { freq: mtof(midi - 12), dur, osc: 'sine', detune: [0], a: att, r: rel, c0: 400, amp: amp * 1.6 }), t, { send: 0.1 });
  m.place(voice(m.rand, { freq: mtof(midi), dur, osc: 'saw', detune: [-9, 0, 8], a: att, r: rel, c0, c1, q: 0.3, amp }), t, { send: 0.3 });
};
const brass = (m, t, dur, notes, { amp = 0.1, att = 0.5, rel = 0.8, c0 = 350, c1 = 2800, pan = 0, send = 0.45 } = {}) => {
  notes.forEach((n, i) => m.place(voice(m.rand, { freq: mtof(n), dur, osc: 'saw', detune: [-10, 0, 11], a: att, r: rel, c0, c1, q: 0.35, amp, vib: 0.003, vibHz: 5 }), t, { pan: pan + (i - (notes.length - 1) / 2) * 0.25, send }));
};
const pluck = (m, t, midi, dur, { amp = 0.2, c0 = 2400, c1 = 250, osc = 'saw', pan = 0, send = 0.1 } = {}) =>
  m.place(voice(m.rand, { freq: mtof(midi), dur, osc, detune: [-6, 5], a: 0.003, r: 0.04, c0, c1, q: 0.3, amp }), t, { pan, send });
const hit = (m, t, kind, o = {}) => {
  const g = o.gain ?? 1;
  if (kind === 'kick') m.place(kick(m.rand, o), t, { gain: g, send: 0.05 });
  else if (kind === 'taiko') m.place(taiko(m.rand, o), t, { gain: g, send: 0.45 });
  else if (kind === 'snare') m.place(snare(m.rand, o), t, { gain: g, send: 0.35, pan: o.pan || 0 });
  else if (kind === 'hat') m.place(hat(m.rand, o), t, { gain: g, send: 0.1, pan: o.pan || 0 });
  else if (kind === 'impact') m.place(impact(m.rand, o), t, { gain: g, send: 0.5 });
};
const rise = (m, t, dur, o = {}) => m.place(riser(m.rand, { dur, ...o }), t, { send: 0.6 });

// ---- RACE: 150 bpm, 32 bars, loop; base + combat stems ---------------------------------
export function race() {
  const bpm = 150, beat = 60 / bpm, bar = beat * 4, bars = 32, secs = bars * bar, s16 = beat / 4;
  const mk = (seed) => new Mix(secs, { loop: true, tail: 3, seed });
  const base = mk(11), combat = mk(12);
  const prog = (b) => { const g = (b >> 2) % 4, i = b & 3;
    if (g === 3) return [CH.Bb, CH.C, CH.A, CH.A][i];
    return [CH.Dm, CH.Dm, CH.Bb, CH.C][i]; };
  const OST = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0], JUMP = { 6: 12, 11: 7, 14: 12 };
  for (let b = 0; b < bars; b++) {
    const t0 = b * bar, ch = prog(b), phrase = (b % 8) / 8;
    drone(base, t0, bar, ch.root + 12, { amp: 0.16, att: 0.05, rel: 0.1, c0: 140, c1: 300 });
    pad(base, t0, bar, ch.notes, { amp: 0.045, att: 0.25, rel: 0.5, c0: 800 + 1400 * phrase, c1: 1600 + 1600 * phrase });
    for (let s = 0; s < 16; s++) {
      const t = t0 + s * s16;
      if (OST[s]) { const acc = s % 4 === 0 ? 1.15 : 0.85; pluck(base, t, ch.root + 12 + (JUMP[s] || 0) + (b % 4 === 3 && s === 15 ? 1 : 0), s16 * 0.85, { amp: 0.17 * acc, c0: 1800 + 2600 * phrase, c1: 220, pan: 0.05 }); }
      if (s % 4 === 0) hit(base, t, 'kick', { amp: 0.95 });
      if (s % 4 === 2) hit(base, t, 'hat', { amp: 0.17, pan: 0.3 }); else if (s % 2 === 1) hit(base, t, 'hat', { amp: 0.07, pan: -0.3 });
      if (s === 7 || s === 15) hit(base, t, 'kick', { amp: 0.5 });
    }
    // combat layer: percussion + brass
    for (let q = 0; q < 4; q++) {
      const t = t0 + q * beat;
      if (q % 2 === 0) hit(combat, t, 'taiko', { amp: 0.95, f: q === 0 ? 58 : 66, dur: 1.2 });
      else { hit(combat, t, 'snare', { amp: 0.75 }); hit(combat, t + s16 * 2, 'taiko', { amp: 0.4, f: 80, dur: 0.5 }); }
    }
    brass(combat, t0, bar * 0.98, ch.notes.map((n) => n + 12).slice(0, 2).concat(ch.root + 24), { amp: 0.075, att: 0.35, rel: 0.4, c0: 500, c1: 3200 });
    const mel = [[24, 2], [27, 1], [31, 1]];
    let tt = 0; for (const [off, len] of mel) { const nm = ch.root + off + (ch === CH.A ? 1 : 0); brass(combat, t0 + tt * beat, len * beat * 0.95, [nm + 12], { amp: 0.085, att: 0.06, rel: 0.2, c0: 700, c1: 3800, send: 0.4 }); tt += len; }
    if (b % 8 === 7) { rise(combat, t0 + bar - 1.6 + 0, 1.6, { amp: 0.5, pitched: 0.25 }); for (let k = 0; k < 8; k++) hit(combat, t0 + bar * 0.5 + k * beat / 2, 'snare', { amp: 0.28 + k * 0.05 }); }
    if (b % 8 === 0) hit(combat, t0, 'impact', { amp: 0.45, dur: 2.5 });
  }
  return { bpm, bars, secs, loop: true, mixes: [{ name: 'race-base', mix: base, fx: { wet: 0.35, feedback: 0.84, damp: 0.4, size: 0.9 }, stem: 'race' }, { name: 'race-combat', mix: combat, fx: { wet: 0.5, feedback: 0.9, damp: 0.35 }, stem: 'race' }] };
}

// ---- MENU: 60 bpm, 20 bars, loop -------------------------------------------------------
export function menu() {
  const bar = 4, bars = 20, secs = bars * bar, m = new Mix(secs, { loop: true, tail: 6, seed: 21 });
  const seq = [CH.Dm, CH.Bb, CH.Gm, CH.Dm, CH.A];
  seq.forEach((ch, i) => {
    const t = i * 16;
    drone(m, t - 1, 18, ch.root + 12, { amp: 0.2, att: 3, rel: 3, c0: 110, c1: 260 });
    pad(m, t - 2, 20, ch.notes, { amp: 0.05, att: 4, rel: 4, c0: 500, c1: 1500 });
    pad(m, t - 2, 20, ch.notes.map((n) => n + 12), { amp: 0.022, att: 5, rel: 4, c0: 700, c1: 2200, send: 0.7 });
    hit(m, t, 'taiko', { amp: 0.9, f: 48, dur: 2.5, big: true });
    hit(m, t + 8, 'taiko', { amp: 0.4, f: 55, dur: 1.5 });
    hit(m, t + 14, 'taiko', { amp: 0.25, f: 62, dur: 1 }); hit(m, t + 15, 'taiko', { amp: 0.3, f: 62, dur: 1 });
  });
  for (const t of [16, 48]) brass(m, t, 9, [50, 57, 62], { amp: 0.07, att: 3.5, rel: 3.5, c0: 250, c1: 1500 });
  rise(m, 30, 2, { amp: 0.3, f0: 200, f1: 3000 }); rise(m, 62, 2, { amp: 0.3, f0: 200, f1: 3000 });
  // pulsing ostinato fades in from bar 8
  for (let i = 0; i < 48; i++) { const t = 32 + i * 0.5 * 1; const ch = seq[Math.min(4, Math.floor(t / 16))]; const v = Math.min(1, i / 32);
    pluck(m, t, ch.root + 12 + (i % 8 === 6 ? 7 : 0), 0.4, { amp: 0.05 + 0.08 * v, c0: 700 + 1200 * v, c1: 180, osc: 'saw', send: 0.35 }); }
  // distant bell pings
  const scale = [62, 65, 67, 69, 72, 74, 77]; const r = m.rand;
  for (let k = 0; k < 18; k++) { const t = 3 + k * 4.3 + r(); m.place(voice(r, { freq: mtof(scale[Math.floor(r() * 7)] + 12), dur: 0.05, osc: 'sine', detune: [0, 1200 * 0 + 701], a: 0.002, r: 3, c0: 6000, amp: 0.05 }), t, { pan: r() * 1.6 - 0.8, send: 0.9 }); }
  // heartbeat
  for (let b = 2; b < bars; b += 2) { hit(m, b * bar + 1, 'kick', { amp: 0.4, f1: 38, dur: 0.5 }); hit(m, b * bar + 1.45, 'kick', { amp: 0.28, f1: 38, dur: 0.5 }); }
  return { bpm: 60, bars, secs, loop: true, mixes: [{ name: 'menu', mix: m, fx: { wet: 0.6, feedback: 0.94, damp: 0.3, size: 1.3 } }] };
}

// ---- STINGERS ---------------------------------------------------------------------------
export function win() {
  const m = new Mix(8, { seed: 31 });
  hit(m, 0, 'impact', { amp: 0.8, dur: 3 }); hit(m, 0, 'taiko', { amp: 0.9, f: 52, dur: 2 });
  brass(m, 0, 1.2, [50, 57, 62, 66], { amp: 0.11, att: 0.05, rel: 0.5, c0: 600, c1: 3500 });
  brass(m, 0.6, 0.6, [69], { amp: 0.12, att: 0.03, rel: 0.2, c0: 900, c1: 4000 });
  brass(m, 1.2, 4.5, [50, 57, 62, 66, 74], { amp: 0.11, att: 0.1, rel: 2.2, c0: 800, c1: 4500 });
  pad(m, 0.2, 5.5, [62, 66, 69, 74], { amp: 0.04, att: 0.8, rel: 2, c0: 1200, c1: 3000 });
  for (let k = 0; k < 6; k++) hit(m, 1.2 + k * 0.1, 'snare', { amp: 0.2 + 0.08 * k });
  hit(m, 1.2, 'taiko', { amp: 1, f: 50, dur: 3, big: true });
  return { secs: 8, loop: false, fade: 1.8, mixes: [{ name: 'results-win', mix: m, fx: { wet: 0.55, feedback: 0.9 } }] };
}
export function lose() {
  const m = new Mix(8, { seed: 41 });
  hit(m, 0, 'impact', { amp: 1, dur: 5 });
  drone(m, 0, 8, 38, { amp: 0.2, att: 0.2, rel: 3, c0: 120, c1: 80 });
  brass(m, 0.3, 1.6, [62, 65], { amp: 0.09, att: 0.4, rel: 0.5, c0: 1500, c1: 500 });
  brass(m, 2.0, 1.6, [60, 63], { amp: 0.09, att: 0.4, rel: 0.5, c0: 1300, c1: 400 });
  brass(m, 3.7, 4, [57, 60, 45], { amp: 0.09, att: 0.5, rel: 2.5, c0: 1000, c1: 250 });
  pad(m, 0, 7, [50, 53, 57], { amp: 0.04, att: 1, rel: 2.5, c0: 500, c1: 250 });
  [4.6, 5.6, 6.8].forEach((t, i) => hit(m, t, 'kick', { amp: 0.5 - i * 0.12, f1: 36, dur: 0.6 }));
  return { secs: 8, loop: false, fade: 2.5, mixes: [{ name: 'results-lose', mix: m, fx: { wet: 0.6, feedback: 0.92, damp: 0.4 } }] };
}

// ---- TRAILER: 100 bpm, 25 bars = 60 s --------------------------------------------------
export function trailer() {
  const bpm = 100, beat = 0.6, bar = 2.4, secs = 60, m = new Mix(secs, { seed: 51 });
  const hits = [];
  const H = (t, kind, strength, tag) => hits.push({ t: +t.toFixed(3), kind, strength, ...(tag ? { tag } : {}) });
  const bars = (a, b) => { const r = []; for (let i = a; i < b; i++) r.push(i); return r; };
  const prog = (b) => (b < 4 ? CH.Dm : b < 10 ? [CH.Dm, CH.Dm, CH.Bb, CH.C, CH.Dm, CH.Dm][b - 4]
    : b < 16 ? [CH.Dm, CH.Bb, CH.Gm, CH.A, CH.Dm, CH.Bb][b - 10] : b < 21 ? [CH.Dm, CH.Bb, CH.C, CH.A, CH.A][b - 16] : CH.Dm);
  // A: 0-9.6 slow dread
  drone(m, 0, 11, 38, { amp: 0.24, att: 4, rel: 2, c0: 90, c1: 300 });
  pad(m, 0.5, 10, CH.Dm.notes, { amp: 0.04, att: 4, rel: 1, c0: 400, c1: 1500 });
  for (const b of bars(0, 4)) { hit(m, b * bar, 'taiko', { amp: 0.3 + b * 0.08, f: 45, dur: 1.5 }); H(b * bar, 'taiko', 0.3 + b * 0.08); hit(m, b * bar + 0.4, 'kick', { amp: 0.25 + b * 0.05, f1: 36, dur: .5 }); }
  rise(m, 4.8, 4.8, { amp: 0.35, f0: 150, f1: 2500 });
  // major hit 1 @ 9.6 (title: ROOKIE / the setup lands)
  hit(m, 9.6, 'impact', { amp: 1, dur: 3.5 }); H(9.6, 'impact', 1, 'cut'); brass(m, 9.6, 2.2, [50, 57, 62], { amp: 0.1, att: 0.04, rel: 0.8, c0: 800, c1: 2500 });
  // B: 9.6-24 pulse
  for (const b of bars(4, 10)) {
    const t0 = b * bar, ch = prog(b);
    hit(m, t0, 'taiko', { amp: 0.8, f: 55, dur: 1.4 }); if (b > 4) H(t0, 'taiko', 0.8);
    hit(m, t0 + 2 * beat, 'taiko', { amp: 0.5, f: 62, dur: 1 });
    if (b >= 6) for (let q = 0; q < 4; q++) hit(m, t0 + q * beat, 'kick', { amp: 0.6 });
    for (let i = 0; i < 8; i++) pluck(m, t0 + i * beat / 2, ch.root + 12 + (i === 5 ? 7 : 0), 0.28, { amp: 0.15, c0: 900 + (b - 4) * 350, c1: 200 });
    pad(m, t0, bar, ch.notes, { amp: 0.05, att: 0.4, rel: 0.6, c0: 900, c1: 1800 });
    if (b % 2 === 0) brass(m, t0, bar * 2 - 0.2, [ch.root + 24, ch.root + 31], { amp: 0.07, att: 1.2, rel: 0.8, c0: 400, c1: 2800 });
  }
  rise(m, 21.6, 2.4, { amp: 0.45, pitched: 0.3 }); H(24, 'impact', 1, 'cut');
  // hit 2 @ 24.0 -> C driving
  hit(m, 24, 'impact', { amp: 1, dur: 3.5 });
  const s16 = beat / 4;
  const OST = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0];
  for (const b of bars(10, 16)) {
    const t0 = b * bar, ch = prog(b);
    hit(m, t0, 'taiko', { amp: 0.9, f: 56, dur: 1.4 }); if (b > 10) H(t0, 'taiko', 0.9);
    pad(m, t0, bar, ch.notes, { amp: 0.05, att: 0.2, rel: 0.5, c0: 1200, c1: 2400 });
    drone(m, t0, bar, ch.root + 12, { amp: 0.16, att: 0.05, rel: 0.1 });
    for (let s = 0; s < 16; s++) {
      const t = t0 + s * s16;
      if (OST[s]) pluck(m, t, ch.root + 12 + (s === 6 || s === 14 ? 12 : 0), s16 * 0.85, { amp: 0.17 * (s % 4 ? 0.85 : 1.15), c0: 2800, c1: 220 });
      if (s % 4 === 0) hit(m, t, 'kick', { amp: 0.95 });
      if (s % 4 === 2) hit(m, t, 'hat', { amp: 0.17, pan: 0.3 });
      if (s === 4 || s === 12) hit(m, t, 'snare', { amp: 0.7 });
    }
    brass(m, t0, bar * 0.98, [ch.root + 24, ch.root + 31], { amp: 0.08, att: 0.3, rel: 0.4, c0: 600, c1: 3500 });
    brass(m, t0 + 1.2, 0.5, [ch.root + 36], { amp: 0.08, att: 0.05, rel: 0.2, c0: 900, c1: 4000 });
  }
  H(38.4, 'impact', 1, 'cut'); rise(m, 36, 2.4, { amp: 0.5, pitched: 0.35 });
  hit(m, 38.4, 'impact', { amp: 1, dur: 3.5 });
  // D: 38.4-50.4 montage, hit on every beat
  for (const b of bars(16, 21)) {
    const t0 = b * bar, ch = prog(b);
    pad(m, t0, bar, ch.notes.map((n) => n + 12), { amp: 0.04, att: 0.1, rel: 0.4, c0: 1800, c1: 3500 });
    drone(m, t0, bar, ch.root + 12, { amp: 0.18, att: 0.05, rel: 0.1 });
    for (let q = 0; q < 4; q++) { const t = t0 + q * beat; hit(m, t, 'taiko', { amp: q ? 0.55 : 0.95, f: 60 + q * 3, dur: 0.8 }); hit(m, t, 'kick', { amp: 0.9 }); H(t, q ? 'tick' : 'taiko', q ? 0.55 : 0.95); hit(m, t + beat / 2, 'snare', { amp: q % 2 ? 0.7 : 0.3 }); }
    for (let s = 0; s < 16; s++) { pluck(m, t0 + s * s16, ch.root + 24 + (s % 8 === 6 ? 3 : 0) - (s % 5 === 0 ? 12 : 0), s16 * 0.8, { amp: 0.12, c0: 3500, c1: 400 }); if (s % 2) hit(m, t0 + s * s16, 'hat', { amp: 0.1 }); }
    brass(m, t0, bar * 0.98, [ch.root + 24, ch.root + 28 + (ch === CH.A ? 1 : 0), ch.root + 31], { amp: 0.09, att: 0.1, rel: 0.3, c0: 800, c1: 4000 });
  }
  // E: 50.4 riser, silence 52.2-52.8, final hit
  rise(m, 49.2, 3.0, { amp: 0.55, pitched: 0.4, f1: 8000 });
  hit(m, 52.8, 'impact', { amp: 1.3, dur: 6 }); hit(m, 52.8, 'taiko', { amp: 1, f: 44, dur: 3, big: true }); H(52.8, 'impact', 1.3, 'title');
  brass(m, 52.8, 5, [38, 45, 50, 57], { amp: 0.12, att: 0.04, rel: 2.5, c0: 700, c1: 1600 });
  drone(m, 52.8, 7, 38, { amp: 0.2, att: 0.3, rel: 2 });
  pad(m, 52.8, 7, [62, 65, 69], { amp: 0.035, att: 1, rel: 3, c0: 800, c1: 2000 });
  // the riser must die before the final hit: 49.2+3.0 = 52.2 → silence gap
  hits.sort((a, b) => a.t - b.t);
  for (let i = hits.length - 1; i > 0; i--) if (hits[i].t === hits[i - 1].t) { const keep = hits[i].tag ? hits[i] : hits[i - 1]; hits.splice(i - 1, 2, keep); }
  for (const h of hits) h.strength = +h.strength.toFixed(2);
  return { bpm, secs, loop: false, fade: 3, hits, mixes: [{ name: 'trailer', mix: m, fx: { wet: 0.5, feedback: 0.9, damp: 0.35 } }] };
}
