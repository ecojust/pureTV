// Tiny deterministic offline synth: voices -> stereo mix -> reverb -> WAV. Pure Node, no deps.
export const SR = 44100;
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class Mix {
  /** seconds = musical length; tail = extra seconds rendered then (loop) folded back to the start. */
  constructor(seconds, { tail = 0, loop = false, seed = 1 } = {}) {
    this.len = Math.round(seconds * SR);
    this.n = this.len + Math.round(tail * SR);
    this.loop = loop; this.rand = rng(seed);
    this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); this.send = new Float32Array(this.n);
  }
  /** Mix a mono buffer at time t (s). pan -1..1, send = reverb send level. */
  place(mono, t, { gain = 1, pan = 0, send = 0.2 } = {}) {
    const s0 = Math.round(t * SR);
    const a = Math.cos((pan + 1) * Math.PI / 4) * gain, b = Math.sin((pan + 1) * Math.PI / 4) * gain;
    for (let i = 0; i < mono.length; i++) {
      let k = s0 + i; if (k < 0) continue;
      if (k >= this.n) { if (!this.loop) break; k %= this.len; }
      const v = mono[i];
      this.L[k] += v * a; this.R[k] += v * b; this.send[k] += v * send * gain;
    }
  }
  /** Run reverb on the send bus, add it, fold tail (loops), return {L,R} of length len (loop) or n. */
  finish({ wet = 0.5, feedback = 0.9, damp = 0.35, size = 1 } = {}) {
    const rv = reverb(this.send, { feedback, damp, size });
    for (let i = 0; i < this.n; i++) { this.L[i] += rv.L[i] * wet; this.R[i] += rv.R[i] * wet; }
    if (!this.loop) return { L: this.L, R: this.R };
    const L = this.L.slice(0, this.len), R = this.R.slice(0, this.len);
    for (let i = this.len; i < this.n; i++) { const k = (i - this.len) % this.len; L[k] += this.L[i]; R[k] += this.R[i]; }
    return { L, R };
  }
}

export function reverb(inp, { feedback = 0.9, damp = 0.35, size = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
  const out = [new Float32Array(inp.length), new Float32Array(inp.length)];
  for (let ch = 0; ch < 2; ch++) {
    const o = out[ch], spread = ch * 23;
    for (const base of combs) {
      const d = Math.round(base * size) + spread, buf = new Float32Array(d); let idx = 0, lpz = 0;
      for (let i = 0; i < inp.length; i++) {
        const y = buf[idx]; lpz = y * (1 - damp) + lpz * damp;
        buf[idx] = inp[i] * 0.015 + lpz * feedback; o[i] += y; if (++idx >= d) idx = 0;
      }
    }
    for (const base of aps) {
      const d = base + spread, buf = new Float32Array(d); let idx = 0;
      for (let i = 0; i < o.length; i++) { const bo = buf[idx]; const x = o[i]; buf[idx] = x + bo * 0.5; o[i] = bo - x; if (++idx >= d) idx = 0; }
    }
  }
  return { L: out[0], R: out[1] };
}

const OSC = {
  saw: (p) => 2 * p - 1,
  square: (p) => (p < 0.5 ? 1 : -1),
  tri: (p) => 4 * Math.abs(p - 0.5) - 1,
  sine: (p) => Math.sin(p * 2 * Math.PI),
};

/** General subtractive voice. Returns a mono Float32Array. */
export function voice(rand, { freq, dur, osc = 'saw', detune = [0], a = 0.01, r = 0.1, sus = 1, c0 = 4000, c1 = c0, q = 0.2, amp = 0.3, vib = 0, vibHz = 5.5, glide = 0, noise = 0 }) {
  const n = Math.round((dur + r) * SR), out = new Float32Array(n), f = OSC[osc];
  const ph = detune.map(() => rand()), inc = detune.map((c) => freq * Math.pow(2, c / 1200) / SR);
  let low = 0, band = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let env = t < a ? t / a : t < dur ? 1 + (sus - 1) * Math.min(1, (t - a) / Math.max(0.01, dur - a)) * 0 + 0 : Math.max(0, 1 - (t - dur) / r);
    if (t >= a && t < dur) env = sus >= 1 ? 1 : 1 - (1 - sus) * Math.min(1, (t - a) / Math.max(0.05, dur - a));
    const m = vib ? 1 + vib * Math.sin(2 * Math.PI * vibHz * t) : 1, g = glide ? Math.pow(2, glide * (1 - Math.min(1, t / 0.15)) / 12) : 1;
    let s = 0;
    for (let k = 0; k < ph.length; k++) { s += f(ph[k]); ph[k] += inc[k] * m * g; if (ph[k] >= 1) ph[k] -= 1; }
    s /= Math.sqrt(ph.length);
    if (noise) s += (rand() * 2 - 1) * noise;
    const cut = Math.min(9000, c0 * Math.pow(c1 / c0, Math.min(1, t / Math.max(0.01, dur))));
    const ff = 2 * Math.sin(Math.PI * cut / SR);
    low += ff * band; const high = s - low - q * 2 * band; band += ff * high;
    out[i] = low * env * amp;
  }
  return out;
}

export function kick(rand, { amp = 0.9, f0 = 130, f1 = 42, dur = 0.35 } = {}) {
  const n = Math.round(dur * SR), o = new Float32Array(n); let p = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t * 28); p += f / SR; o[i] = Math.sin(2 * Math.PI * p) * Math.exp(-t * 9) * amp + (t < 0.004 ? (rand() - 0.5) * 0.4 : 0); }
  return o;
}
export function taiko(rand, { amp = 1, f = 62, dur = 1.6, big = false } = {}) {
  const n = Math.round(dur * SR), o = new Float32Array(n); let p = 0, p2 = 0, lz = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, fr = f * (1 + 1.2 * Math.exp(-t * 35)); p += fr / SR; p2 += fr * 1.58 / SR;
    lz += 0.18 * ((rand() * 2 - 1) - lz);
    o[i] = (Math.sin(2 * Math.PI * p) * Math.exp(-t * (big ? 2.2 : 4.2)) + 0.35 * Math.sin(2 * Math.PI * p2) * Math.exp(-t * 7) + lz * 0.9 * Math.exp(-t * 30)) * amp;
  }
  return o;
}
export function snare(rand, { amp = 0.6, dur = 0.3 } = {}) {
  const n = Math.round(dur * SR), o = new Float32Array(n); let hp = 0, pv = 0, p = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, x = rand() * 2 - 1; hp = 0.82 * (hp + x - pv); pv = x; p += (190 + 90 * Math.exp(-t * 40)) / SR; o[i] = (hp * Math.exp(-t * 16) * 0.8 + Math.sin(2 * Math.PI * p) * Math.exp(-t * 22) * 0.5) * amp; }
  return o;
}
export function hat(rand, { amp = 0.2, dur = 0.07 } = {}) {
  const n = Math.round(dur * SR), o = new Float32Array(n); let hp = 0, pv = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, x = rand() * 2 - 1; hp = 0.9 * (hp + x - pv); pv = x; o[i] = hp * Math.exp(-t * 55) * amp; }
  return o;
}
/** Huge cinematic hit: sub drop + noise burst + long boom. */
export function impact(rand, { amp = 1, dur = 4.5 } = {}) {
  const n = Math.round(dur * SR), o = new Float32Array(n); let p = 0, lz = 0, lz2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 34 + 70 * Math.exp(-t * 6); p += f / SR;
    const x = rand() * 2 - 1; lz += 0.05 * (x - lz); lz2 += 0.4 * (x - lz2);
    o[i] = (Math.sin(2 * Math.PI * p) * Math.exp(-t * 1.1) * 0.9 + lz * 2.2 * Math.exp(-t * 3.2) + lz2 * 0.6 * Math.exp(-t * 14)) * amp * Math.min(1, t * 400);
  }
  return o;
}
/** Noise riser (bandpass sweep) with optional pitched saw. */
export function riser(rand, { dur = 4, amp = 0.4, f0 = 300, f1 = 7000, pitched = 0 } = {}) {
  const n = Math.round(dur * SR), o = new Float32Array(n); let low = 0, band = 0, p = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n, t = i / SR, cut = f0 * Math.pow(f1 / f0, u), ff = 2 * Math.sin(Math.PI * Math.min(cut, 9000) / SR);
    let x = rand() * 2 - 1; p += (110 * Math.pow(8, u)) / SR; if (p >= 1) p -= 1; x += pitched * (2 * p - 1);
    low += ff * band; const high = x - low - 0.25 * band; band += ff * high;
    o[i] = band * 0.7 * Math.pow(u, 1.6) * amp * Math.min(1, (dur - t) * 40);
  }
  return o;
}

/** Master: soft-clip, apply shared gain, peak-normalise to `peak`. Returns scale used. */
export function peakOf(...bufs) { let m = 0; for (const b of bufs) for (let i = 0; i < b.length; i++) { const v = Math.abs(b[i]); if (v > m) m = v; } return m; }
export function softClip(L, R, drive = 1.0) {
  for (const b of [L, R]) for (let i = 0; i < b.length; i++) b[i] = Math.tanh(b[i] * drive);
}

export function wavBuffer(L, R, fadeIn = 0, fadeOut = 0) {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  const fi = Math.round(fadeIn * SR), fo = Math.round(fadeOut * SR);
  for (let i = 0; i < n; i++) {
    let g = 1; if (i < fi) g = i / fi; if (i > n - fo) g = Math.min(g, (n - i) / fo);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * g * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * g * 32767))), 46 + i * 4);
  }
  return buf;
}
