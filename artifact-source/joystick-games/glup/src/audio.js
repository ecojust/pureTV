// GLUP — audio. Todo se sintetiza con WebAudio, sin muestras: un mezclador con reverb de sala y
// eco, instrumentos acústicos simulados (cuerdas pulsadas Karplus–Strong, láminas, vientos, cuerdas
// frotadas, coros, bajos, acordeón, metales, percusión), un secuenciador de canciones por secciones
// (cada canción vive en musica/<nombre>.js; la guía para componer está en musica/LEEME.md),
// paisajes sonoros vivos para cada lugar (Sound.ambiente) y los efectos del juego (Sound.play).
'use strict';
const Sound = (() => {
  const WIN = typeof window !== 'undefined' ? window : {};
  const AC = WIN.AudioContext || WIN.webkitAudioContext, OAC = WIN.OfflineAudioContext || WIN.webkitOfflineAudioContext;
  const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, clock = () => (WIN.performance ? WIN.performance.now() : Date.now());
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(name) { const m = /^([A-G])(#|b)?(-?\d)$/.exec(name); return m ? NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12 : null; }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function freq(name) { const m = midi(name); return m === null ? 0 : mtof(m); }
  const amp = v => Math.pow(clamp(v, 0, 1.25), 1.6);   // velocity (0..1) to gain: soft notes fall away like real ones

  // ================================================================ DSP en JS
  // A small toolkit to render sounds into Float32Arrays once (notes, drums, animal calls) and play
  // them afterwards as cached buffers: rich synthesis at the cost of two nodes per note.
  const noiseArr = n => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1; return a; };
  function biq(x, type, f, q, sr, db = 0) {   // RBJ biquad, in place: 'lp' 'hp' 'bp' 'pk'
    const w = TAU * Math.min(f, sr * .45) / sr, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * q), A = Math.pow(10, db / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; }
    return x;
  }
  // State-variable filter (TPT) whose cutoff may move: fc is Hz or a function of the sample index.
  function svf(x, fc, q, sr, mode = 'lp') {
    let s1 = 0, s2 = 0, g = 0, a1 = 0, a2 = 0, a3 = 0; const k = 1 / q, fixed = typeof fc === 'number';
    const setF = f => { g = Math.tan(Math.PI * clamp(f, 10, sr * .45) / sr); a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; };
    if (fixed) setF(fc);
    for (let i = 0; i < x.length; i++) {
      if (!fixed && (i & 15) === 0) setF(fc(i));
      const v0 = x[i], v3 = v0 - s2, v1 = a1 * s1 + a2 * v3, v2 = s2 + a2 * s1 + a3 * v3; s1 = 2 * v1 - s1; s2 = 2 * v2 - s2;
      x[i] = mode === 'lp' ? v2 : mode === 'bp' ? v1 : v0 - k * v1 - v2;
    }
    return x;
  }
  // A decaying sine partial, added in (a recursive oscillator: no Math.sin per sample).
  function partial(out, sr, f, a, t60, atk = .001, at = 0, ph = Math.random() * TAU) {
    if (f >= sr * .45 || f <= 0 || a <= 0) return;
    const w = TAU * f / sr, c = Math.cos(w), s = Math.sin(w), d = Math.pow(.001, 1 / (Math.max(.005, t60) * sr)), na = Math.max(1, atk * sr), n0 = Math.floor(at * sr);
    let x = Math.cos(ph), y = Math.sin(ph), g = a;
    for (let i = n0, k = 0; i < out.length; i++, k++) { out[i] += y * g * (k < na ? k / na : 1); const nx = x * c - y * s; y = x * s + y * c; x = nx; g *= d; if (g < 2e-5) break; }
  }
  // A sine that glides exponentially from f0 to f1 over len seconds, decaying (drops, bubbles, whistles).
  function sweep(out, sr, f0, f1, len, a, t60, at = 0, h2 = 0) {
    const s = Math.floor(at * sr), n = Math.min(out.length - s, Math.floor(sr * (len + t60))), d = Math.pow(.001, 1 / (t60 * sr)), L = Math.max(1, len * sr);
    let ph = 0, g = a;
    for (let i = 0; i < n; i++) { const k = Math.min(1, i / L), f = f0 * Math.pow(f1 / f0, k); ph += TAU * f / sr; const e = i < 60 ? i / 60 : 1; out[s + i] += (Math.sin(ph) + h2 * Math.sin(2 * ph)) * g * e; if (i > L) g *= d; }
  }
  function burst(out, sr, len, f, q, a, mode = 'bp', at = 0, shape = 2) {   // a filtered noise hit
    const n = Math.floor(len * sr), z = svf(noiseArr(n), f, q, sr, mode), s = Math.floor(at * sr);
    for (let i = 0; i < n && s + i < out.length; i++) out[s + i] += z[i] * a * Math.pow(1 - i / n, shape);
  }
  function norm(x, peak = .9) { let m = 0; for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (v > m) m = v; } if (m > 0) { const k = peak / m; for (let i = 0; i < x.length; i++) x[i] *= k; } return x; }
  function fade(x, sr, secs = .03) { const n = Math.min(x.length, Math.floor(secs * sr)); for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n; return x; }
  const arr = (sr, secs) => new Float32Array(Math.max(1, Math.floor(sr * secs)));

  // The buffer cache: every rendered note or sound (and the effects), least recently used out first past ~48 MB.
  const BUF = new Map(); let bufBytes = 0; const BUF_MAX = 48e6;
  function bufOf(c, key, gen, sr0) {   // sr0: render at another rate (dark sounds at half rate cost half)
    const sr = sr0 || c.sampleRate, k = sr + '|' + key; let b = BUF.get(k);
    if (b) { BUF.delete(k); BUF.set(k, b); return b; }
    let d = gen(sr); d = Array.isArray(d) ? d : [d];
    b = c.createBuffer(d.length, d[0].length, sr); d.forEach((a, i) => b.getChannelData(i).set(a));
    BUF.set(k, b); bufBytes += d.length * d[0].length * 4;
    while (bufBytes > BUF_MAX && BUF.size > 8) { const [fk, fb] = BUF.entries().next().value; BUF.delete(fk); bufBytes -= fb.length * fb.numberOfChannels * 4; }
    return b;
  }
  // Warm-up queue: buffers a song will need are rendered a few at a time, a few ms per tick.
  const WARM = [];
  function warmUp(budget) { const t0 = clock(); while (WARM.length && clock() - t0 < budget) { const [c, key, gen, sr] = WARM.shift(); if (!BUF.has((sr || c.sampleRate) + '|' + key)) bufOf(c, key, gen, sr); } }

  // ================================================================ Mezclador
  // master → glue compressor → limiter → out. Buses for music, ambience and effects; a shared hall
  // reverb (and a short room for the effects) fed by per-track sends. Each song and each ambience
  // plays into its own gains, so they can crossfade.
  const LEVEL = { music: .6, amb: .55, sfx: .8 }, PERF = {};
  let M = null, ctx = null, sfxBus = null, noiseBuffer = null, muted = false;
  function impulse(c, secs, pre, dark, early) {
    const sr = c.sampleRate, p0 = Math.floor(pre * sr), n = p0 + Math.floor(secs * sr), b = c.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = new Float32Array(n); let lp = 0, e2 = 0;
      for (let i = p0; i < n; i++) {
        const t = (i - p0) / sr, a = Math.min(.95, .08 + dark * t / secs), env = Math.pow(.001, t / secs) * (1 - Math.exp(-t / .015));
        lp = lp * a + (Math.random() * 2 - 1) * (1 - a); d[i] = lp * env * Math.sqrt((1 + a) / (1 - a));
      }
      for (let k = 0; k < early; k++) { const i = p0 + Math.floor(rnd(.003, .06) * sr); d[i] += rnd(-1, 1) * .5 * (1 - k / early); }
      for (let i = 0; i < n; i++) e2 += d[i] * d[i];
      const k = 1 / Math.sqrt(e2 || 1); for (let i = 0; i < n; i++) d[i] *= k;
      b.getChannelData(ch).set(d);
    }
    return b;
  }
  function gainNode(c, v, to) { const n = c.createGain(); n.gain.value = v; if (to) n.connect(to); return n; }
  // Filters whose cutoff moves compute their coefficients once per block instead of per sample.
  function krate(param) { try { param.automationRate = 'k-rate'; } catch (e) { } return param; }
  function panner(c, p) { if (c.createStereoPanner) { const n = c.createStereoPanner(); n.pan.value = clamp(p, -1, 1); return n; } return c.createGain(); }
  function buildMixer(c) {
    const X = { c, sr: c.sampleRate, waves: {} };
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 2.4; comp.attack.value = .02; comp.release.value = .3;
    const lim = c.createDynamicsCompressor(); lim.threshold.value = -4; lim.knee.value = 2; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .12;
    X.master = gainNode(c, muted ? 0 : 1); X.master.connect(comp); comp.connect(lim); lim.connect(c.destination);
    const conv = (ir, lvl) => { const cv = c.createConvolver(); cv.normalize = false; cv.buffer = ir; const i = gainNode(c, 1); i.channelCount = 1; i.channelCountMode = 'explicit'; i.connect(cv); cv.connect(gainNode(c, lvl, X.master)); return i; };
    X.hall = conv(impulse(c, PERF.noRev ? .05 : 2.7, .024, .85, 10), 1); X.room = conv(impulse(c, .7, .006, .5, 16), 1);
    X.music = gainNode(c, LEVEL.music, X.master); X.musicWet = gainNode(c, LEVEL.music, X.hall);
    X.amb = gainNode(c, LEVEL.amb, X.master); X.ambWet = gainNode(c, LEVEL.amb, X.hall);
    X.sfx = gainNode(c, LEVEL.sfx, X.master); X.sfx.connect(gainNode(c, .22, X.room)); X.sfx.connect(gainNode(c, .06, X.hall));
    X.sfxWet = gainNode(c, LEVEL.sfx, X.hall);
    X.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); X.noise.getChannelData(0).set(noiseArr(c.sampleRate * 2));
    return X;
  }
  function wave(X, name) {
    if (X.waves[name]) return X.waves[name];
    const h = WAVES[name], re = new Float32Array(h.length + 1), im = new Float32Array(h.length + 1); h.forEach((a, i) => { im[i + 1] = a; });
    return X.waves[name] = X.c.createPeriodicWave(re, im);
  }
  const WAVES = {   // harmonic amplitudes (1st, 2nd, 3rd...)
    sine: [1], flauta: [1, .32, .12, .06, .025, .01], pan: [1, .04, .3, .02, .12, .01, .05], ocarina: [1, .07, .04, .01],
    clarinete: [1, .04, .55, .03, .32, .02, .18, .01, .1, 0, .05], fretless: [1, .5, .28, .14, .08, .04, .02], bajo: [1, .32, .1, .03],
    reed: [1, .8, .62, .5, .42, .35, .28, .22, .17, .13, .1, .08, .06, .05], armonica: [1, .5, .75, .3, .45, .2, .25, .1, .12],
    horn: [1, .75, .52, .36, .24, .15, .1, .06, .04, .02] };

  // ================================================================ Voces
  // A track: its voices go to tr.dest (the instrument's insert, if any) → tr.in (volume) → pan → the
  // song; tr.in also feeds the reverb and echo sends. Voices are registered so the polyphony stays
  // capped: past it, the oldest voice fades out in 20 ms.
  function mkTrack(host, key, d) {
    const c = host.c, inst = ALIAS[d.inst] || d.inst, I = INST[inst], drum = inst === 'bateria';
    const tr = { key, d, c, M: host.M, inst, I, drum, voices: [], sub: {}, host };
    tr.in = gainNode(c, d.vol ?? .7); tr.pan = panner(c, d.pan || 0); tr.in.connect(tr.pan); tr.pan.connect(host.out);
    const rv = d.rev ?? (I && I.rev) ?? (drum ? .12 : .2); if (rv > 0) tr.in.connect(gainNode(c, rv, host.wet));
    if (d.eco && host.echo) tr.in.connect(gainNode(c, d.eco, host.echo));
    tr.dest = tr.in; if (I && I.track) I.track(tr);
    return tr;
  }
  function reg(tr, t, end, g) {
    const v = tr.voices; for (let i = v.length - 1; i >= 0; i--) if (v[i].end < t) v.splice(i, 1);
    const poly = tr.d.poly || (tr.I && tr.I.poly) || 8;
    while (v.length >= poly) { const o = v.shift(); try { const p = o.g.gain; if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else p.cancelScheduledValues(t); p.setTargetAtTime(0, t, .012); } catch (e) { } }
    v.push({ end, g });
  }
  // Glides a parameter through [[seconds after t, midi], ...] (legato slurs, slides).
  function glide(param, t, m0, list, map, secs = .07) { let prev = m0; for (const [dt, m] of list) { param.setValueAtTime(map(prev), t + dt); param.linearRampToValueAtTime(map(m), t + dt + secs); prev = m; } }

  // A pre-rendered note: the cached buffer, a gain, and a low-pass that closes on soft notes.
  function playBuf(tr, name, I, t, m, dur, vel, o) {
    const c = tr.c, buf = bufOf(c, name + m, sr => I.gen(m, sr)), src = c.createBufferSource(); src.buffer = buf;
    const r0 = o.rate || 1; src.playbackRate.setValueAtTime(o.scoop ? r0 * .92 : r0, t); if (o.scoop) src.playbackRate.linearRampToValueAtTime(r0, t + .08);
    if (o.glide) glide(src.playbackRate, t, m, o.glide, m1 => r0 * Math.pow(2, (m1 - m) / 12), I.glideT || .06);
    const g = c.createGain(), a = amp(vel) * (I.gain || 1) * (o.amp || 1), len = buf.duration / r0; let node = src;
    if (I.velLP && vel < .97) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.min(16000, mtof(m) * (1.5 + 26 * vel * vel)); f.Q.value = .5; src.connect(f); node = f; }
    node.connect(g); g.connect(o.dest || tr.dest); g.gain.setValueAtTime(a, t);
    let end = t + len;
    if (!I.ring || o.stac) { const off = t + Math.max(.03, dur), rel = I.rel || .12; if (off < end) { g.gain.setValueAtTime(a, off); g.gain.setTargetAtTime(0, off, rel / 4); end = Math.min(end, off + rel); } }
    src.start(t); src.stop(end + .03); reg(tr, t, end, g); return end;
  }
  // Breath instruments: one oscillator with the pipe's harmonics, a band of breath noise around the
  // note with a 'chiff' at the attack, a slight scoop into pitch and a vibrato that comes in late.
  function wind(tr, t, m, dur, vel, o, p) {
    const c = tr.c, f = mtof(m), a = amp(vel) * p.gain * (o.amp || 1), off = t + dur, end = off + p.rel * 2, at = Math.min(p.atk, dur * .6);
    const vg = c.createGain(); vg.connect(o.dest || tr.dest);
    const osc = c.createOscillator(), g = c.createGain(); osc.setPeriodicWave(wave(tr.M, p.wave)); osc.frequency.setValueAtTime(f, t);
    if (o.glide) glide(osc.frequency, t, m, o.glide, mtof, p.glideT || .06);
    const sc = o.scoop ? 140 : p.scoop || 0; if (sc) { osc.detune.setValueAtTime(-sc, t); osc.detune.linearRampToValueAtTime(0, t + .07 + sc / 2000); }
    let src = osc; if (p.lp) { const lf = c.createBiquadFilter(); lf.type = 'lowpass'; lf.frequency.value = Math.min(12000, f * p.lp[0] + p.lp[1] * vel); lf.Q.value = .5; osc.connect(lf); src = lf; }
    src.connect(g); g.connect(vg);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * (p.over || 1.15), t + at); g.gain.setTargetAtTime(a, t + at, .07); g.gain.setTargetAtTime(0, off, p.rel / 3);
    if (p.vib && dur > .3) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = p.vib[0] * rnd(.92, 1.08); lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + p.vibD); lg.gain.linearRampToValueAtTime(p.vib[1] * (o.vib ?? 1), t + p.vibD + .45); l.connect(lg); lg.connect(osc.detune); l.start(t); l.stop(end); }
    if (p.breath) {
      const n = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain(); n.buffer = tr.M.noise; n.loop = true;
      bp.type = 'bandpass'; krate(bp.frequency); bp.frequency.setValueAtTime(Math.min(12000, f * p.bf), t); bp.Q.value = p.bq; if (o.glide) glide(bp.frequency, t, m, o.glide, m1 => Math.min(12000, mtof(m1) * p.bf));
      ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(a * p.chiff, t + .012); ng.gain.setTargetAtTime(a * p.breath, t + .02, .05); ng.gain.setTargetAtTime(0, off, p.rel / 3);
      n.connect(bp); bp.connect(ng); ng.connect(vg); n.start(t, rnd(0, 1.5)); n.stop(end);
    }
    osc.start(t); osc.stop(end); reg(tr, t, end, vg); return end;
  }
  // Bowed, blown and sung sections: several detuned oscillators spread in stereo, a low-pass that
  // opens with the attack (brighter when louder), formant peaks, delayed vibrato, optional tremolo.
  function ensemble(tr, t, m, dur, vel, o, p) {
    const c = tr.c, f = mtof(m), a = amp(vel) * p.gain * (o.amp || 1), off = t + Math.max(dur, .05), end = off + p.rel * 2.2, n = p.n || 1, at = Math.min(p.atk, dur * .7 + .02);
    const lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.Q.value = p.q || .6; krate(lp.frequency);
    const top = Math.min(p.cutMax || 9000, f * p.cut[0] + p.cut[1] * vel); lp.frequency.setValueAtTime(top * (p.cut0 ?? .5), t); lp.frequency.linearRampToValueAtTime(top, t + at * 1.3); lp.frequency.setTargetAtTime(top * .7, off, p.rel / 2);
    let last = lp; for (const [pf, pq, pg] of p.peaks || []) { const k = c.createBiquadFilter(); k.type = 'peaking'; k.frequency.value = pf; k.Q.value = pq; k.gain.value = pg; last.connect(k); last = k; }
    if (p.trem || o.trem) { const tg = c.createGain(), l = c.createOscillator(), lg = c.createGain(), [rate, dep] = p.trem || [12.5, .7]; tg.gain.value = 1 - dep / 2; lg.gain.value = dep / 2; l.frequency.value = rate * rnd(.95, 1.05); l.connect(lg); lg.connect(tg.gain); last.connect(tg); last = tg; l.start(t); l.stop(end); }
    last.connect(g); g.connect(o.dest || tr.dest);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + at); if (p.dec) g.gain.setTargetAtTime(a * p.dec[0], t + at, p.dec[1]); g.gain.setTargetAtTime(0, off, p.rel / 3);
    let lg = null; if (p.vib && dur > .3) { const l = c.createOscillator(); lg = c.createGain(); l.frequency.value = p.vib[0] * rnd(.9, 1.1); lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + p.vibD); lg.gain.linearRampToValueAtTime(p.vib[1] * (o.vib ?? 1), t + p.vibD + .6); l.connect(lg); l.start(t); l.stop(end); }
    for (let i = 0; i < n; i++) {
      const osc = c.createOscillator(); if (p.wave) osc.setPeriodicWave(wave(tr.M, p.wave)); else osc.type = p.type || 'sawtooth';
      osc.frequency.setValueAtTime(f, t); if (o.glide) glide(osc.frequency, t, m, o.glide, mtof, p.glideT || .08);
      const dt = (n > 1 ? (i / (n - 1) * 2 - 1) * (p.det || 0) : 0) + rnd(-2, 2); osc.detune.setValueAtTime(dt - (o.scoop ? 120 : 0), t); if (o.scoop) osc.detune.linearRampToValueAtTime(dt, t + .1);
      osc.connect(lp);
      if (lg) lg.connect(osc.detune); osc.start(t); osc.stop(end);
    }
    reg(tr, t, end, g); return end;
  }
  // Fretless and synth bass: a round tone whose filter opens and settles ('mwah'), mono, slides.
  function bassV(tr, t, m, dur, vel, o, p) {
    const c = tr.c, f = mtof(m), a = amp(vel) * p.gain * (o.amp || 1), off = t + Math.max(dur, .04), end = off + p.rel * 2;
    const osc = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(); osc.setPeriodicWave(wave(tr.M, p.wave)); osc.frequency.setValueAtTime(f, t);
    if (o.glide) glide(osc.frequency, t, m, o.glide, mtof, p.glideT || .1);
    if (o.scoop) { osc.detune.setValueAtTime(-200, t); osc.detune.linearRampToValueAtTime(0, t + .12); }
    lp.type = 'lowpass'; lp.Q.value = p.q; krate(lp.frequency); lp.frequency.setValueAtTime(f * 2 + 120, t); lp.frequency.linearRampToValueAtTime(f * p.open + 700 * vel, t + p.mwah); lp.frequency.setTargetAtTime(f * 2.2 + 150, t + p.mwah, .25);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .006); g.gain.setTargetAtTime(a * p.sus, t + .02, p.decay); g.gain.setTargetAtTime(0, off, p.rel / 3);
    osc.connect(lp); lp.connect(g); g.connect(o.dest || tr.dest); osc.start(t); osc.stop(end); reg(tr, t, end, g); return end;
  }

  // ---------------------------------------------------------------- Generadores de notas
  // Karplus–Strong plucked string: a delay line one period long, fed with a burst of shaped noise,
  // with a loss filter and a fractional all-pass for exact tuning; then the body's resonances.
  function ks(m, sr, o) {
    const f = mtof(m), N = sr / f, b = o.b || .5, dly = 1 - b, L = Math.max(2, Math.floor(N - dly - .2)), d = N - L - dly, C = (1 - d) / (1 + d);
    const t60 = Math.min(o.max, o.t60 * Math.pow(261.6 / f, o.tk ?? .5)), out = arr(sr, Math.min(o.max, t60 + .05)), rho = Math.pow(.001, 1 / (f * t60));
    const buf = new Float32Array(L), kb = .08 + .92 * o.bright * o.bright; let lp = 0, mean = 0;
    for (let i = 0; i < L; i++) { lp += (Math.random() * 2 - 1 - lp) * kb; buf[i] = lp; mean += lp; }
    mean /= L; for (let i = 0; i < L; i++) buf[i] -= mean;
    const pp = Math.max(1, Math.round(L * (o.pos || .2))); for (let i = L - 1; i >= pp; i--) buf[i] -= buf[i - pp] * .9;
    norm(buf, 1);
    let p = 0, last = 0, ax = 0, ay = 0;
    for (let n = 0; n < out.length; n++) { const x = buf[p]; out[n] = x; const lf = rho * (b * x + (1 - b) * last); last = x; const y = C * lf + ax - C * ay; ax = lf; ay = y; buf[p] = y; if (++p === L) p = 0; }
    for (const [bf, bq, bg] of o.body || []) biq(out, 'pk', bf, bq, sr, bg);
    if (o.click) burst(out, sr, .004, 3500, .7, o.click, 'hp');
    return norm(fade(out, sr, .04), .9);
  }
  // Struck bars and tines: inharmonic partials with their own decays, a mallet click, a tremolo.
  function mallet(m, sr, o) {
    const f = mtof(m), sc = Math.pow(261.6 / f, o.tk ?? .5), out = arr(sr, Math.min(o.max, o.parts[0][2] * sc + .12));
    for (const [r, a, t60] of o.parts) partial(out, sr, f * r, a * (f * r > 7000 ? .4 : 1), t60 * sc, o.atk || .0012);
    if (o.click) burst(out, sr, o.click[0], Math.min(o.click[1] * (o.clickF ? f / 261.6 : 1), 12000), 1.2, o.click[2], 'bp');
    if (o.trem) for (let i = 0; i < out.length; i++) out[i] *= 1 - o.trem[1] * (.5 + .5 * Math.sin(TAU * o.trem[0] * i / sr - 1.57));
    if (o.post) o.post(out, sr, f);
    return norm(fade(out, sr, .04), .9);
  }
  // Rhodes-like electric piano: 1:1 FM whose brightness decays, plus the tine's bell.
  function epiano(m, sr) {
    const f = mtof(m), T = Math.min(4.5, 3.4 * Math.pow(261.6 / f, .5)), out = arr(sr, T), w = TAU * f / sr;
    for (let i = 0, ph = 0; i < out.length; i++, ph += w) { const t = i / sr, I = .25 + 1.5 * Math.exp(-t / .3), e = (t < .002 ? t / .002 : 1) * (.5 * Math.exp(-t / .3) + .5) * Math.pow(.001, t / T); out[i] = Math.sin(ph + I * Math.sin(ph)) * e; }
    partial(out, sr, f * 7.02, .06, .35); burst(out, sr, .006, 1200, .8, .05, 'bp');
    return norm(fade(out, sr), .9);
  }
  // A soft piano: stretched harmonics with a two-stage decay, a hammer thump and a slow beat.
  function piano(m, sr) {
    const f = mtof(m), B = .00018 * Math.pow(2, (m - 60) / 18), T = Math.min(6, 4.8 * Math.pow(261.6 / f, .55)), out = arr(sr, Math.min(4.5, T));
    const K = Math.min(18, Math.floor(7500 / f));
    for (let n = 1; n <= K; n++) {
      const fn = f * n * Math.sqrt(1 + B * n * n), a = Math.pow(n, -1.15) * Math.exp(-n / 9), tn = T / (1 + .45 * (n - 1));
      partial(out, sr, fn, a * .65, tn * .25, .002); partial(out, sr, fn * 1.0007, a * .35, tn, .002);
    }
    burst(out, sr, .012, 900, .7, .08, 'lp');
    return norm(fade(out, sr, .08), .9);
  }
  function timpani(m, sr) {
    const f = mtof(m), out = arr(sr, 3);
    [[1, 1, 1.8], [1.504, .55, 1.3], [1.742, .35, 1], [2, .28, .8], [2.245, .18, .6], [2.494, .12, .45]].forEach(([r, a, t]) => partial(out, sr, f * r, a, t, .003));
    sweep(out, sr, f * .75, f * .6, .08, .5, .15); burst(out, sr, .04, 350, .7, .5, 'lp');
    return norm(fade(out, sr, .1), .9);
  }

  // ================================================================ Instrumentos
  // kind 'buf': pre-rendered per note (gen); 'live': built from nodes when played (play).
  // ring: lets the note sound out whatever its written length (a staccato mark ' still damps it).
  const WIND = {
    flauta: { wave: 'flauta', atk: .06, rel: .13, gain: .42, vib: [5.2, 16], vibD: .28, breath: .045, chiff: .3, bf: 1, bq: 2.5, scoop: 18, over: 1.2 },
    flautaPan: { wave: 'pan', atk: .03, rel: .22, gain: .36, vib: [4.6, 9], vibD: .45, breath: .08, chiff: .7, bf: 1, bq: 1.5, scoop: 35, over: 1.4 },
    ocarina: { wave: 'ocarina', atk: .045, rel: .1, gain: .38, vib: [5.6, 13], vibD: .22, breath: .025, chiff: .12, bf: 1, bq: 4, scoop: 10 },
    silbido: { wave: 'sine', atk: .03, rel: .08, gain: .34, vib: [6.2, 26], vibD: .12, breath: .015, chiff: .06, bf: 1, bq: 6, scoop: 60, glideT: .09 },
    clarinete: { wave: 'clarinete', atk: .04, rel: .1, gain: .38, vib: [5, 5], vibD: .5, breath: .03, chiff: .1, bf: 2, bq: 1.5, lp: [5, 2200] } };
  const ENS = {
    cuerdas: { n: 3, det: 10, spread: .7, cut: [4, 1600], cutMax: 6000, cut0: .35, atk: .38, rel: .75, vib: [5.2, 9], vibD: .3, gain: .2 },
    tremolo: { n: 3, det: 10, spread: .7, cut: [5, 2400], cutMax: 7000, cut0: .6, atk: .06, rel: .35, trem: [13, .75], gain: .28 },
    violin: { n: 1, cut: [6, 2400], cutMax: 8000, cut0: .5, q: .7, atk: .09, rel: .22, vib: [5.6, 22], vibD: .2, gain: .3, peaks: [[290, 1.4, 5], [1100, 1.2, 3], [3000, 1.5, 4]] },
    chelo: { n: 1, cut: [5, 1400], cutMax: 4200, cut0: .5, q: .7, atk: .12, rel: .3, vib: [5, 18], vibD: .25, gain: .32, peaks: [[200, 1.3, 6], [650, 1.6, 3]] },
    pad: { n: 3, det: 14, spread: .85, cut: [2, 550], cutMax: 2400, cut0: .25, q: .9, atk: .9, rel: 1.6, vib: [.25, 7], vibD: 0, gain: .2 },
    coro: { n: 3, det: 13, spread: .8, cut: [0, 6500], cutMax: 6500, cut0: 1, atk: .45, rel: .9, vib: [5, 16], vibD: .1, gain: .2 },
    coroU: { n: 3, det: 11, spread: .8, cut: [0, 3000], cutMax: 3000, cut0: 1, atk: .5, rel: 1, vib: [4.8, 14], vibD: .1, gain: .24 },
    trompa: { n: 2, wave: 'horn', det: 4, spread: .2, cut: [2.2, 900], cutMax: 2600, cut0: .35, atk: .17, rel: .28, vib: [5, 6], vibD: .45, gain: .36 },
    metales: { n: 3, det: 8, spread: .5, cut: [3, 2600], cutMax: 5200, cut0: .3, atk: .035, rel: .18, vib: [5.5, 5], vibD: .4, gain: .3 },
    acordeon: { n: 2, wave: 'reed', det: 8, spread: .25, cut: [0, 2400], cutMax: 4400, cut0: .8, atk: .05, rel: .09, trem: [5.2, .12], gain: .5 },
    armonica: { n: 1, wave: 'armonica', cut: [0, 2600], cutMax: 5000, cut0: .7, atk: .035, rel: .08, vib: [5.2, 24], vibD: .2, gain: .45, peaks: [[1500, 2, 5]] } };
  const BASS = {
    fretless: { wave: 'fretless', gain: .62, q: 2.2, open: 5, mwah: .07, sus: .55, decay: .45, rel: .09, glideT: .12 },
    bajo: { wave: 'bajo', gain: .5, q: .8, open: 3, mwah: .02, sus: .75, decay: .6, rel: .07, glideT: .06 } };
  // Track inserts: formants for the choir, a slow chorus for the sections and pads.
  // A stereo chorus per track (not per voice): two short delays swaying in opposite directions, left and right.
  function chorus(tr) {
    const c = tr.c, i = gainNode(c, 1), l = c.createOscillator(), mg = c.createChannelMerger(2), wet = gainNode(c, .7); l.frequency.value = .27; l.start(); i.connect(gainNode(c, .75, tr.in));
    [.012, .017].forEach((dt, k) => { const d = c.createDelay(.05); d.delayTime.value = dt; l.connect(gainNode(c, k ? -.003 : .003, d.delayTime)); i.connect(d); d.connect(mg, 0, k); });
    mg.connect(wet); wet.connect(tr.in); tr.dest = i; tr.lfo = l;
  }
  function formants(tr, F) { chorus(tr); const c = tr.c, i = gainNode(c, 1), sum = gainNode(c, 1); for (const [f, q, g] of F) { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; i.connect(b); b.connect(gainNode(c, g, sum)); } sum.connect(tr.dest); tr.dest = i; }
  const INST = {};
  const def = (name, o) => { INST[name] = o; if (o.kind === 'buf') o.play = (tr, t, m, dur, vel, x) => playBuf(tr, name, o, t, m, dur, vel, x); };
  const KS = {
    arpa: { t60: 2.6, tk: .6, max: 3.6, bright: .5, b: .55, pos: .28, body: [[220, 1.2, 3], [1200, 1, -3]], click: .03 },
    guitarra: { t60: 2.1, tk: .5, max: 2.8, bright: .4, b: .52, pos: .16, body: [[105, 1.6, 5], [210, 1.4, 3], [420, 2, 2], [3000, 1, -4]], click: .02 },
    koto: { t60: 1.7, tk: .45, max: 2.2, bright: .8, b: .68, pos: .1, body: [[340, 2, 4], [2200, 2, 2]], click: .08 },
    banjo: { t60: .9, tk: .35, max: 1.3, bright: .92, b: .72, pos: .08, body: [[480, 3, 7], [1500, 2, 3]], click: .12 },
    pizzicato: { t60: .45, tk: .4, max: .9, bright: .35, b: .5, pos: .24, body: [[300, 1, 4], [900, 1.5, 2]] },
    contrabajo: { t60: 1.5, tk: .25, max: 2.2, bright: .3, b: .5, pos: .22, body: [[95, 1, 4], [700, 1, -4]], click: .015 } };
  const KSI = { arpa: { rango: 'C2-G6', ring: 1, poly: 12, rev: .35, velLP: 1, gain: .9, d: 'arpa de concierto: arpegios, glissandos, brillos' },
    guitarra: { rango: 'E2-B5', ring: 0, rel: .25, poly: 8, rev: .22, velLP: 1, d: 'guitarra de nailon: rasgueos (rasgueo:), bossa, punteos' },
    koto: { rango: 'D3-D6', ring: 1, poly: 6, rev: .3, velLP: 1, gain: 1.2, d: 'koto/cítara: punteos brillantes, pentatónicas' },
    banjo: { rango: 'C3-D6', ring: 1, poly: 6, rev: .15, velLP: 1, gain: 1.4, d: 'banjo: rasgueo seco y alegre, el pescador' },
    pizzicato: { rango: 'C2-C6', ring: 1, poly: 10, rev: .28, velLP: 1, gain: 1.3, d: 'cuerdas en pizzicato: pasos juguetones, sigilo' },
    contrabajo: { rango: 'E1-G3', ring: 0, rel: .12, poly: 2, rev: .06, velLP: 1, gain: 1, glideT: .09, d: 'contrabajo pulsado: walking jazz, bajo redondo (con _ desliza)' } };
  for (const k in KS) def(k, Object.assign({ kind: 'buf', gen: (m, sr) => ks(m, sr, KS[k]) }, KSI[k]));
  const MAL = {
    marimba: [{ parts: [[1, 1, 1.1], [3.93, .28, .26], [9.21, .09, .07]], tk: .7, max: 2.2, click: [.004, 2800, .25], atk: .0025 }, { rango: 'A2-C7', rev: .22, d: 'marimba de palo: ostinatos, acordes rotos, cálida' }],
    xilofono: [{ parts: [[1, 1, .6], [3, .5, .28], [6.1, .18, .1], [10.1, .07, .05]], tk: .5, max: 1.3, click: [.003, 5000, .45] }, { rango: 'F4-C8', rev: .2, d: 'xilófono: brillante, seco, travieso' }],
    vibrafono: [{ parts: [[1, 1, 3.4], [4, .22, .9], [10, .05, .25]], tk: .45, max: 4.5, click: [.003, 2500, .1], trem: [5.4, .38], atk: .003 }, { rango: 'F3-F6', rev: .3, d: 'vibráfono con motor: jazz nocturno, acordes suspendidos' }],
    glock: [{ parts: [[1, 1, 2.2], [2.76, .42, .9], [5.4, .2, .4], [8.93, .1, .2]], tk: .3, max: 3, click: [.002, 6500, .22] }, { rango: 'G5-C8', rev: .32, d: 'glockenspiel: destellos, doblar la melodía arriba' }],
    cajita: [{ parts: [[1, 1, 1.4], [1.0028, .35, 1.4], [6.27, .32, .3], [17.55, .07, .06]], tk: .35, max: 2.4, click: [.002, 7000, .3] }, { rango: 'C5-C8', rev: .3, d: 'caja de música: nanas, recuerdos, créditos' }],
    kalimba: [{ parts: [[1, 1, 1.7], [5.93, .2, .12], [12.9, .05, .04]], tk: .5, max: 2.4, click: [.006, 1100, .3], post: (x, sr) => biq(x, 'pk', 190, 1.2, sr, 4) }, { rango: 'C4-E6', rev: .28, d: 'kalimba (sanza): motivos cíclicos, íntima y mágica' }],
    campana: [{ parts: [[.5, .5, 4], [1, 1, 3], [1.19, .55, 2.3], [1.5, .38, 2], [2, .65, 1.8], [2.52, .3, 1.2], [3.01, .22, .9], [4.1, .14, .5]], tk: .4, max: 5, click: [.002, 4000, .18] }, { rango: 'C4-C7', rev: .4, d: 'campana: finales, amanecer, momentos solemnes' }] };
  for (const k in MAL) def(k, Object.assign({ kind: 'buf', ring: 1, poly: 10, velLP: 1, gen: (m, sr) => mallet(m, sr, MAL[k][0]) }, MAL[k][1]));
  def('epiano', { kind: 'buf', ring: 0, rel: .35, poly: 10, rev: .22, velLP: 1, gen: epiano, rango: 'E2-C7', d: 'piano eléctrico (Rhodes): acordes jazz, colchón cálido' });
  def('piano', { kind: 'buf', ring: 0, rel: .4, poly: 14, rev: .25, velLP: 1, gen: piano, rango: 'A1-C8', d: 'piano suave: acordes, melodías tristes o tiernas' });
  def('timbal', { kind: 'buf', ring: 1, poly: 4, rev: .3, gen: timpani, rango: 'D2-C4', d: 'timbales: redobles (%), la Garza, dramatismo' });
  for (const k in WIND) def(k, { kind: 'live', mono: 1, poly: 2, rev: .3, play: (tr, t, m, d, v, o) => wind(tr, t, m, d, v, o, WIND[k]) });
  for (const k in ENS) def(k, { kind: 'live', poly: 8, rev: .3, play: (tr, t, m, d, v, o) => ensemble(tr, t, m, d, v, o, ENS[k]) });
  for (const k in BASS) def(k, { kind: 'live', mono: 1, poly: 1, rev: .05, play: (tr, t, m, d, v, o) => bassV(tr, t, m, d, v, o, BASS[k]) });
  Object.assign(INST.flauta, { rango: 'C4-C7', d: 'flauta travesera: melodías líricas, vibrato tardío' });
  Object.assign(INST.flautaPan, { rango: 'G3-G6', d: 'flauta de pan / zampoña: soplo y chiff, la voz del pantano' });
  Object.assign(INST.ocarina, { rango: 'A3-F6', d: 'ocarina: redonda y pura, nostalgia' });
  Object.assign(INST.silbido, { rango: 'C5-C7', d: 'silbido humano: portamento, el pescador silbando' });
  Object.assign(INST.clarinete, { rango: 'D3-G6', d: 'clarinete: grave cálido, contracantos jazz' });
  Object.assign(INST.cuerdas, { rango: 'C2-C7', poly: 10, rev: .38, trem: 1, track: chorus, d: 'sección de cuerdas: colchones, acordes (x) largos, crecendos' });
  Object.assign(INST.tremolo, { rango: 'C2-C7', poly: 10, rev: .35, track: chorus, d: 'cuerdas en trémolo: tensión, peligro' });
  Object.assign(INST.violin, { rango: 'G3-E7', mono: 1, poly: 2, rev: .32, trem: 1, d: 'violín solista: melodías expresivas (usa _ para ligar)' });
  Object.assign(INST.chelo, { rango: 'C2-A5', mono: 1, poly: 2, rev: .3, trem: 1, d: 'violonchelo: contracantos graves, tristeza' });
  Object.assign(INST.pad, { rango: 'C2-C6', poly: 10, rev: .4, track: chorus, d: 'colchón de sintetizador cálido: fondo, intro, niebla' });
  Object.assign(INST.coro, { rango: 'C3-C6', poly: 10, rev: .45, track: tr => formants(tr, [[750, 5, 3.2], [1150, 7, 2.2], [2800, 9, 1.4], [3600, 10, .6]]), d: 'coro "aah": majestuoso, misterio, la Garza' });
  Object.assign(INST.coroU, { rango: 'C3-C6', poly: 10, rev: .45, track: tr => formants(tr, [[380, 5, 3.4], [800, 6, 1.6], [2500, 9, .5]]), d: 'coro "ooh": suave, nocturno, nana' });
  Object.assign(INST.trompa, { rango: 'F2-F5', poly: 6, rev: .38, d: 'trompa / metal grave: llamadas heroicas, crecidas' });
  Object.assign(INST.metales, { rango: 'E2-C6', poly: 8, rev: .3, d: 'sección de metales: golpes (stabs), fanfarrias' });
  Object.assign(INST.acordeon, { rango: 'F2-A6', poly: 8, rev: .2, d: 'acordeón musette: el muelle del pescador, vals' });
  Object.assign(INST.armonica, { rango: 'C4-C7', mono: 1, rev: .2, d: 'armónica: blues de muelle, ^ para bends' });
  Object.assign(INST.fretless, { rango: 'B0-G3', d: 'bajo sin trastes: redondo, "mwah", deslizamientos con _' });
  Object.assign(INST.bajo, { rango: 'B0-G3', d: 'bajo de sintetizador suave: pulso sencillo' });
  // An orchestral hit: brass and strings stab, with the timpani and a crash on the first note.
  def('golpe', { kind: 'live', poly: 16, rev: .4, rango: 'C3-C6', d: 'golpe orquestal: metales + cuerdas + timbal + platillo', play(tr, t, m, dur, vel, o) {
    const d = Math.min(dur, .4); ensemble(tr, t, m, d, vel, o, ENS.metales); ensemble(tr, t, m + 12, d, vel * .8, o, ENS.tremolo);
    if (!o.i) { let tm = m - 12; while (tm > 60) tm -= 12; while (tm < 38) tm += 12; playBuf(tr, 'timbal', INST.timbal, t, tm, 1, vel, {}); playDrum(tr, 'plato', t, vel * .8, {}); }
    return t + d + .5; } });
  def('bateria', { kind: 'kit', d: 'percusión: una rejilla por instrumento (ver BATERÍA)' });
  const ALIAS = { harp: 'arpa', guitar: 'guitarra', pizz: 'pizzicato', upright: 'contrabajo', bass: 'bajo', xylophone: 'xilofono', glockenspiel: 'glock', musicbox: 'cajita',
    vibraphone: 'vibrafono', bell: 'campana', timpani: 'timbal', flute: 'flauta', panflute: 'flautaPan', whistle: 'silbido', clarinet: 'clarinete', strings: 'cuerdas',
    cello: 'chelo', choir: 'coro', choirOoh: 'coroU', accordion: 'acordeon', harmonica: 'armonica', horn: 'trompa', brass: 'metales', hit: 'golpe', drums: 'bateria', kit: 'bateria', perc: 'bateria', percusion: 'bateria' };

  // ================================================================ Percusión
  // Each drum renders a few variants (so a groove never machine-guns) and plays through its own
  // little pan inside the track. pre: seconds it starts before the beat (a swell that peaks on it).
  const DR = {
    bombo: { g: .7, pan: 0, gen(sr) { const o = arr(sr, .5); let ph = 0; for (let i = 0; i < o.length; i++) { const t = i / sr, f = 52 + 75 * Math.exp(-t / .028); ph += TAU * f / sr; o[i] = Math.sin(ph) * Math.exp(-t / .17); } burst(o, sr, .008, 1800, .7, .18, 'lp'); return norm(o); } },
    caja: { g: .6, gen(sr) { const o = arr(sr, .3); partial(o, sr, 190, .6, .1); partial(o, sr, 330, .3, .06); burst(o, sr, .22, 3200, .6, .8, 'bp', 0, 3); return norm(o); } },
    escobilla: { g: .5, gen(sr) { const o = arr(sr, .25); burst(o, sr, .2, 3800, .45, .7, 'bp', 0, 2.5); partial(o, sr, 200, .18, .05); for (let i = 0; i < 90; i++) o[i] *= i / 90; return norm(o); } },
    barrido: { g: .4, gen(sr) { const o = arr(sr, .5), z = svf(noiseArr(o.length), i => 1800 + 2600 * i / o.length, .6, sr, 'bp'); for (let i = 0; i < o.length; i++) { const k = i / o.length; o[i] = z[i] * Math.sin(Math.PI * Math.pow(k, .7)); } return norm(o); } },
    aro: { g: .5, gen(sr) { const o = arr(sr, .12); partial(o, sr, 1750, .6, .035); partial(o, sr, 480, .5, .05); burst(o, sr, .004, 2200, 4, .6); return norm(o); } },
    hat: { g: .3, pan: .3, gen(sr) { return metal(sr, .06, 7500); } },
    hatAbierto: { g: .3, pan: .3, gen(sr) { return metal(sr, .45, 7000); } },
    ride: { g: .28, pan: -.35, gen(sr) { const o = metal(sr, 1.8, 5000, .25); partial(o, sr, 3150 * rnd(.99, 1.01), .25, .9); partial(o, sr, 4720, .12, .6); return norm(o); } },
    plato: { g: .35, pan: -.25, gen(sr) { const o = metal(sr, 2.2, 3200, .5); burst(o, sr, .05, 5000, .7, .5, 'hp'); return norm(o); } },
    platillo: { g: .32, pan: .2, pre: 1.6, vars: 2, gen(sr) { const o = metal(sr, 1.75, 4000, .7, true); return norm(o); } },
    shaker: { g: .3, pan: .45, vars: 4, gen(sr) { const o = arr(sr, .09); burst(o, sr, .08, 6200, 1.3, 1, 'bp', 0, 3); for (let i = 0, n = sr * .012; i < n; i++) o[i] *= i / n; return norm(o); } },
    pandereta: { g: .3, pan: .4, gen(sr) { const o = arr(sr, .3); for (let k = 0; k < 4; k++) { const at = k * rnd(.004, .009); [5200, 7400, 9100, 11600].forEach(f => partial(o, sr, f * rnd(.97, 1.03), .25, .13, .0005, at)); } burst(o, sr, .1, 8000, .8, .4, 'hp'); partial(o, sr, 260, .2, .05); return norm(o); } },
    conga: { g: .6, pan: -.3, gen(sr) { return membrane(sr, 330, .32, .12); } },
    congaBaja: { g: .6, pan: -.15, gen(sr) { return membrane(sr, 205, .4, .1); } },
    congaSlap: { g: .5, pan: -.3, gen(sr) { const o = membrane(sr, 340, .06, .05); burst(o, sr, .05, 1800, 1, 1.2, 'bp', 0, 3); return norm(o); } },
    congaMute: { g: .5, pan: -.3, gen(sr) { return membrane(sr, 300, .045, .15); } },
    bongo: { g: .5, pan: .25, gen(sr) { return membrane(sr, 520, .14, .1); } },
    bongoBajo: { g: .5, pan: .2, gen(sr) { return membrane(sr, 370, .18, .1); } },
    taco: { g: .45, pan: .35, gen(sr) { return wood(sr, 1050); } },
    tacoBajo: { g: .45, pan: .25, gen(sr) { return wood(sr, 720); } },
    claves: { g: .4, pan: -.4, gen(sr) { const o = arr(sr, .2); partial(o, sr, 2480 * rnd(.99, 1.01), 1, .1); partial(o, sr, 6900, .15, .03); burst(o, sr, .003, 3000, 2, .3); return norm(o); } },
    triangulo: { g: .22, pan: .5, gen(sr) { const o = arr(sr, 2.4), f = 1180 * rnd(.99, 1.01); [[1, .6, 2], [2.76, .5, 1.6], [4.1, .6, 1.3], [5.6, .35, 1], [7.3, .2, .7]].forEach(([r, a, t]) => partial(o, sr, f * r, a, t)); return norm(o); } },
    trianguloMute: { g: .22, pan: .5, gen(sr) { const o = arr(sr, .12), f = 1180; [[1, .6, .08], [2.76, .5, .07], [4.1, .6, .06], [5.6, .35, .05]].forEach(([r, a, t]) => partial(o, sr, f * r, a, t)); return norm(o); } },
    lluvia: { g: .35, pan: -.2, vars: 2, gen(sr) { const o = arr(sr, 2.6); for (let k = 0; k < 700; k++) { const u = Math.pow(Math.random(), .8), at = u * 2.4, d = Math.sin(Math.PI * Math.min(1, u * 1.1)); partial(o, sr, rnd(2200, 7000), rnd(.2, 1) * d, rnd(.01, .03), .0003, at); } return norm(biq(o, 'hp', 1500, .7, sr)); } },
    guiro: { g: .4, pan: .3, gen(sr) { return scrape(sr, .32, 55, 80, 2900); } },
    rana: { g: .4, pan: -.3, gen(sr) { return scrape(sr, .26, 30, 45, 1300); } },
    chasquido: { g: .45, pan: .15, gen(sr) { const o = arr(sr, .1); burst(o, sr, .035, 2300, 1.4, 1, 'bp', 0, 4); partial(o, sr, 1400, .15, .02); return norm(o); } },
    palmas: { g: .45, gen(sr) { const o = arr(sr, .25); [0, .009, .019].forEach(at => burst(o, sr, .012, 1150, 1.2, .8, 'bp', at)); burst(o, sr, .15, 1150, 1, .4, 'bp', .028, 3); return norm(o); } },
    gota: { g: .35, pan: .3, vars: 5, gen(sr) { const o = arr(sr, .25), f = rnd(700, 1500); sweep(o, sr, f, f * 1.7, .02, 1, .08); return norm(o); } },
    tom: { g: .6, gen(sr) { return membrane(sr, 150, .4, .08); } },
    tomBajo: { g: .6, gen(sr) { return membrane(sr, 96, .5, .08); } },
    tambor: { g: .75, gen(sr) { const o = membrane(sr, 62, .75, .12); burst(o, sr, .06, 500, .7, .4, 'lp'); return norm(o); } } };
  function metal(sr, len, hp, noiseAmt = .35, swell = false) {   // cymbals: a cluster of inharmonic partials and noise
    const o = arr(sr, len + (swell ? .1 : 0)), f0 = rnd(330, 360);
    [1, 1.47, 1.82, 2.61, 3.11, 3.79, 4.52, 5.3, 6.17, 7.4, 8.9].forEach(r => partial(o, sr, f0 * r * 4 * rnd(.99, 1.01), rnd(.3, 1), len * rnd(.4, 1), .0005));
    const z = noiseArr(o.length); for (let i = 0; i < o.length; i++) o[i] += z[i] * noiseAmt * Math.pow(.001, i / sr / len);
    biq(o, 'hp', hp, .7, sr);
    if (swell) { const n = Math.floor(len * sr); for (let i = 0; i < o.length; i++) { const k = i / n; o[i] = o[n - 1 - Math.min(i, n - 1)] * Math.pow(Math.min(1, k), 2.2) * (k > 1 ? Math.exp(-(k - 1) * 40) : 1); } }
    return norm(fade(o, sr, .05));
  }
  function membrane(sr, f, t60, slap) {   // hand drums: a pitch that settles, two overtones, the skin's slap
    const o = arr(sr, t60 + .1), ff = f * rnd(.985, 1.015); let ph = 0;
    for (let i = 0; i < o.length; i++) { const t = i / sr, fr = ff * (1 + .06 * Math.exp(-t / .015)); ph += TAU * fr / sr; o[i] = Math.sin(ph) * Math.pow(.001, t / t60); }
    partial(o, sr, ff * 1.59, .35, t60 * .5); partial(o, sr, ff * 2.14, .18, t60 * .3); burst(o, sr, .012, ff * 5, .8, slap * 3, 'bp');
    return norm(fade(o, sr, .02));
  }
  function wood(sr, f) { const o = arr(sr, .16), ff = f * rnd(.99, 1.01); partial(o, sr, ff, 1, .07); partial(o, sr, ff * 2.72, .3, .03); burst(o, sr, .003, ff * 3, 1.5, .4); return norm(o); }
  function scrape(sr, len, r0, r1, f) {   // guiro / wooden frog: a train of little clicks through a resonance
    const o = arr(sr, len + .05); let t = 0, k = 0; while (t < len) { const u = t / len; partial(o, sr, f * rnd(.9, 1.1), rnd(.5, 1) * Math.sin(Math.PI * Math.min(1, u * 1.2 + .1)), .012, .0003, t); t += 1 / (r0 + (r1 - r0) * u); k++; }
    burst(o, sr, len, f, 2, .3, 'bp'); return norm(o);
  }
  const DR_ALIAS = { kick: 'bombo', snare: 'caja', brush: 'escobilla', swish: 'barrido', rim: 'aro', openhat: 'hatAbierto', crash: 'plato', swell: 'platillo', tambourine: 'pandereta',
    congaLow: 'congaBaja', slap: 'congaSlap', mute: 'congaMute', bongoLow: 'bongoBajo', woodblock: 'taco', woodblockLow: 'tacoBajo', triangle: 'triangulo', triangleMute: 'trianguloMute',
    rainstick: 'lluvia', frog: 'rana', snap: 'chasquido', clap: 'palmas', drip: 'gota', tomLow: 'tomBajo', taiko: 'tambor', maraca: 'shaker' };
  function drumSub(tr, name, D) { let s = tr.sub[name]; if (!s) { s = tr.sub[name] = panner(tr.c, D.pan || 0); s.connect(tr.dest); } return s; }
  function playDrum(tr, name, t, vel, o) {
    const D = DR[name]; if (!D) return 0; const c = tr.c, k = (Math.random() * (D.vars || 3)) | 0, buf = bufOf(c, 'dr:' + name + k, sr => D.gen(sr, k));
    const src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; src.playbackRate.value = (o.rate || 1) * (1 + rnd(-.012, .012));
    g.gain.value = amp(vel) * (D.g || 1) * (o.amp || 1); src.connect(g); g.connect(o.dest || drumSub(tr, name, D));
    let st = t - (D.pre || 0), off = 0; const cn = c.currentTime; if (st < cn) { off = cn - st; st = cn; } if (off >= buf.duration) return 0;
    src.start(st, off); return st + buf.duration;
  }

  // ================================================================ Canciones: lectura
  // See musica/LEEME.md. A song: tempo, meter, tracks (instrument + mix), themes (reusable bars),
  // sections (patterns per track) and the form (the order, and where it loops back).
  const SONGS = {}, DYN = { ppp: .2, pp: .3, p: .42, mp: .55, mf: .68, f: .82, ff: .94, fff: 1.05 };
  const DUR = { w: 4, h: 2, q: 1, e: .5, s: .25, x: .125 };
  const MODES = { mayor: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10], dorico: [0, 2, 3, 5, 7, 9, 10], frigio: [0, 1, 3, 5, 7, 8, 10], lidio: [0, 2, 4, 6, 7, 9, 11],
    mixolidio: [0, 2, 4, 5, 7, 9, 10], locrio: [0, 1, 3, 5, 6, 8, 10], armonica: [0, 2, 3, 5, 7, 8, 11], melodica: [0, 2, 3, 5, 7, 9, 11], pentatonica: [0, 2, 4, 7, 9], pentaMenor: [0, 3, 5, 7, 10],
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], phrygian: [0, 1, 3, 5, 7, 8, 10] };
  const CHORDS = { '': [0, 4, 7], M: [0, 4, 7], m: [0, 3, 7], min: [0, 3, 7], '5': [0, 7], '6': [0, 4, 7, 9], m6: [0, 3, 7, 9], '69': [0, 4, 7, 9, 14], m69: [0, 3, 7, 9, 14],
    '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], M7: [0, 4, 7, 11], 'Δ': [0, 4, 7, 11], m7: [0, 3, 7, 10], mmaj7: [0, 3, 7, 11], '9': [0, 4, 7, 10, 14], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14],
    add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], '11': [0, 7, 10, 14, 17], m11: [0, 3, 7, 10, 14, 17], '13': [0, 4, 7, 10, 14, 21], maj13: [0, 4, 7, 11, 14, 21], m13: [0, 3, 7, 10, 14, 21],
    sus2: [0, 2, 7], sus4: [0, 5, 7], sus: [0, 5, 7], '7sus4': [0, 5, 7, 10], '9sus4': [0, 5, 7, 10, 14], dim: [0, 3, 6], '°': [0, 3, 6], dim7: [0, 3, 6, 9], '°7': [0, 3, 6, 9],
    m7b5: [0, 3, 6, 10], 'ø': [0, 3, 6, 10], aug: [0, 4, 8], '+': [0, 4, 8], '7b9': [0, 4, 7, 10, 13], '7#9': [0, 4, 7, 10, 15], '7#11': [0, 4, 7, 10, 18], 'maj7#11': [0, 4, 7, 11, 18], '7b13': [0, 4, 7, 10, 20], '7#5': [0, 4, 8, 10] };
  const pcOf = n => (NOTE[n[0]] + (n[1] === '#' ? 1 : n[1] === 'b' ? -1 : 0) + 12) % 12;
  function parseChord(s) { const m = /^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/.exec(s); if (!m || !CHORDS[m[2]]) return null; return { root: pcOf(m[1]), iv: CHORDS[m[2]], bass: m[3] ? pcOf(m[3]) : pcOf(m[1]) }; }
  function durOf(s) { let tot = 0; for (const part of s.split('+')) { const m = /^([whqesx])(\.\.?|t)?$/.exec(part); if (!m) return null; let d = DUR[m[1]]; if (m[2] === '.') d *= 1.5; else if (m[2] === '..') d *= 1.75; else if (m[2] === 't') d *= 2 / 3; tot += d; } return tot; }
  function rangeOf(s, lo, hi) { const m = /^([A-G][#b]?-?\d)\s*-\s*([A-G][#b]?-?\d)$/.exec(s || ''); return m ? [midi(m[1]), midi(m[2])] : [lo, hi]; }
  // Chord voicing: the most characteristic tones (3rd, 7th, colours, then root, 5th), closest to the
  // previous voicing of the track (smooth voice leading), inside the track's range.
  function voicing(ch, lo, hi, n, prev, open) {
    const rank = i => { const s = i % 12; return s === 3 || s === 4 ? 0 : s === 10 || s === 11 ? 1 : i >= 12 ? 2 : s === 9 || s === 2 || s === 5 || s === 6 || s === 8 ? 1.5 : s === 0 ? 3 : 4; };
    const pcs = [...new Set(ch.iv.slice().sort((a, b) => rank(a) - rank(b)).slice(0, n).map(i => (ch.root + i) % 12))];
    let best = null, bs = 1e9;
    for (let b = lo; b <= hi; b++) {
      if (!pcs.includes(b % 12)) continue;
      const v = [b]; for (const p of pcs.filter(p => p !== b % 12).sort((x, y) => ((x - b) % 12 + 12) % 12 - ((y - b) % 12 + 12) % 12)) { let x = v[v.length - 1] + 1; while (x % 12 !== p) x++; v.push(x); }
      if (open && v.length >= 4) { const s = v.splice(v.length - 2, 1)[0] - 12; if (s < lo) continue; v.unshift(s); }
      if (v[v.length - 1] > hi) continue;
      const sc = prev ? v.reduce((a, x) => a + Math.min(...prev.map(y => Math.abs(x - y))), 0) + prev.reduce((a, y) => a + Math.min(...v.map(x => Math.abs(x - y))), 0) : Math.abs((v[0] + v[v.length - 1]) / 2 - (lo + hi) / 2);
      if (sc < bs) { bs = sc; best = v; }
    }
    return best || [lo + ((ch.root - lo) % 12 + 12) % 12];
  }
  const TOK = /\{[^}]*\}(?:\[[^\]]*\]|\([^)]*\))?\S*|\[[^\]]*\]\S*|\([^)]*\)\S*|\S+/g;
  const TAIL = /^((?:[whqesx](?:\.\.?|t)?)(?:\+[whqesx](?:\.\.?|t)?)*)?([!?'_~^*%]*)$/;
  function parseTok(tok, W) {
    if (DYN[tok] !== undefined) return { k: 'dyn', v: DYN[tok] };
    if (tok === '<' || tok === '>') return { k: 'hair' };
    if (tok === 'R') return { k: 'fill' };
    let grace = null, m = /^\{([^}]*)\}(.*)$/.exec(tok);
    if (m) { grace = m[1].trim().split(/\s+/).map(midi); if (grace.some(x => x === null)) { W('adorno raro: ' + tok); grace = null; } tok = m[2]; }
    let ms = null, chord = null, rest;
    if ((m = /^\[([^\]]*)\](.*)$/.exec(tok))) { ms = m[1].trim().split(/\s+/).map(midi); rest = m[2]; if (ms.some(x => x === null)) { W('acorde de notas raro: ' + tok); return null; } }
    else if ((m = /^\(([^)]*)\)(.*)$/.exec(tok))) { chord = parseChord(m[1]); rest = m[2]; if (!chord) { W('cifrado desconocido: ' + m[1]); return null; } chord.sym = m[1]; }
    else if ((m = /^r(.*)$/.exec(tok))) { rest = m[1]; }
    else if ((m = /^([A-G](?:#|b)?-?\d)(.*)$/.exec(tok))) { ms = [midi(m[1])]; rest = m[2]; }
    else { W('no entiendo "' + tok + '"'); return null; }
    const t = TAIL.exec(rest); if (!t) { W('duración o marca rara: ' + tok); return null; }
    const dur = t[1] ? durOf(t[1]) : null, mods = t[2] || '';
    let acc = 1; for (const ch of mods) acc *= ch === '!' ? 1.25 : ch === '?' ? .6 : 1;
    return { k: ms || chord ? 'note' : 'rest', ms, chord, dur, mods, acc, grace };
  }
  function expand(str, temas, W, depth = 0) {
    return depth > 8 ? str : str.replace(/\$(\w+)(?:\*(\d+))?/g, (all, n, k) => {
      const v = temas && temas[n]; if (typeof v !== 'string') { W('tema desconocido: $' + n); return ''; }
      const e = expand(v, temas, W, depth + 1).trim().replace(/^\||\|$/g, ''); return Array(+(k || 1)).fill(e).join(' | ');
    });
  }
  const splitBars = s => s.split('|').map(b => b.trim()).filter(b => b.length);
  function prep(song) {
    if (song._p) return song._p;
    const warn = new Set(), W = s => warn.add(s), [num, den] = String(song.compas || '4/4').split('/').map(Number), bpb = num * 4 / den;
    const tracks = Object.keys(song.pistas || {}).map(key => { const d = song.pistas[key], inst = ALIAS[d.inst] || d.inst; if (!INST[inst]) W('instrumento desconocido: ' + d.inst + ' (pista ' + key + ')'); return { key, d, inst, I: INST[inst], drum: inst === 'bateria' }; });
    const forma = song.forma || Object.keys(song.secciones || {}); forma.forEach(n => { if (!song.secciones[n]) W('la forma nombra una sección que no existe: ' + n); });
    const vuelta = typeof song.vuelta === 'string' ? Math.max(0, forma.indexOf(song.vuelta)) : song.vuelta || 0;
    let scale = null; const sm = /^([A-G][#b]?)\s*(\w*)$/.exec(song.tono || ''); if (sm) scale = { root: pcOf(sm[1]), steps: MODES[sm[2] || 'mayor'] || MODES.mayor };
    return song._p = { song, bpb, tracks, forma, vuelta, bucle: song.bucle !== false, swingU: song.swingEn === 'e' ? .5 : .25, scale, warn, W };
  }
  function upper(S, m) { if (!S.scale) return m + 2; for (let k = 1; k <= 3; k++) if (S.scale.steps.includes(((m + k - S.scale.root) % 12 + 12) % 12)) return m + k; return m + 2; }

  // ================================================================ Canciones: compilación
  // One pass of a section → events { at, t, tr, m | d, dur, vel, o } in seconds from its start
  // (at: when to schedule it, earlier than t for swells that must peak on the beat).
  function compileSection(P, name, vez, exact) {
    const S = P.S, song = S.song, sec = song.secciones[name]; if (!sec) return null;
    const bpb = S.bpb, tempo = sec.tempo || song.tempo || 100, spb = 60 / tempo, evs = [], parts = [];
    for (let ti = 0; ti < S.tracks.length; ti++) {
      const tk = S.tracks[ti]; let v = sec[tk.key]; if (v === undefined || v === null) continue;
      if (Array.isArray(v)) v = v[vez % v.length];
      if (v && v.azar) v = exact ? v.azar[0] : pick(v.azar);
      let ov = {}; if (v && typeof v === 'object' && !Array.isArray(v)) { ov = v; v = v.p; if (Array.isArray(v)) v = v[vez % v.length]; } if (!v) continue;
      const d = Object.assign({}, tk.d, ov, { amp: ov.vol ?? 1 }), src = expand(v, song.temas, S.W);
      parts.push({ tk, ti, d, src, n: tk.drum ? 0 : splitBars(src).length });
    }
    const bars = sec.compases || Math.max(1, ...parts.map(p => p.n));
    for (const p of parts) (p.tk.drum ? drumEvents : noteEvents)(P, p.tk, p.ti, p.src, bars, bpb, p.d, evs, (sec.trans || 0) + (song.trans || 0), name, exact);
    const sw = song.swing || 0, su = S.swingU;
    for (const e of evs) {
      let b = e.b; const q = b / su; if (sw && Math.abs(q - Math.round(q)) < 1e-6 && Math.round(q) % 2 === 1) b += sw * su;
      e.t = b * spb + (e.dt || 0) + (exact ? 0 : rnd(-1, 1) * (e.h || 0) / 1000); e.dur *= spb;
      if (e.o.glide) e.o.glide = e.o.glide.map(([gb, m]) => [gb * spb, m]);
      if (!exact && e.hv) e.vel *= 1 + rnd(-e.hv, e.hv);
      e.at = e.t - (e.pre || 0);
    }
    evs.sort((a, b) => a.at - b.at);
    return { name, vez, bars, bpb, spb, dur: bars * bpb * spb, ev: evs };
  }
  function noteEvents(P, tk, ti, src, bars, bpb, d, out, trans, secName, exact) {
    const S = P.S, I = tk.I || {}, mono = I.mono, list = splitBars(src), W = S.W; if (!list.length) return;
    const st = { dur: 1, dyn: DYN[d.din] || DYN.mf, hair: null }, notes = [];
    let prevBar = '';
    for (let bi = 0; bi < bars; bi++) {
      let bar = list[bi % list.length]; if (bar === '%') bar = prevBar; prevBar = bar;
      let pos = 0; const b0 = bi * bpb;
      for (const tok of bar.match(TOK) || []) {
        const x = parseTok(tok, W); if (!x) continue;
        if (x.k === 'dyn') { if (st.hair) { const h = st.hair, n = notes.length - h.i; for (let j = 0; j < n; j++) notes[h.i + j].vel *= (h.v + (x.v - h.v) * (j + 1) / (n + 1)) / h.v; } st.dyn = x.v; st.hair = null; continue; }
        if (x.k === 'hair') { st.hair = { i: notes.length, v: st.dyn }; continue; }
        if (x.k === 'fill') { pos = Math.max(pos, bpb); continue; }
        const dur = x.dur ?? st.dur; st.dur = dur;
        if (x.k === 'note') notes.push({ b: b0 + pos, ms: x.ms, chord: x.chord, dur, vel: st.dyn * x.acc, mods: x.mods, grace: x.grace });
        pos += dur;
      }
      if (Math.abs(pos - bpb) > 1e-6 && bi < list.length) W(`${secName}/${tk.key}: el compás ${bi + 1} dura ${+pos.toFixed(3)} negras (el compás tiene ${bpb})`);
    }
    // Ties (~) join equal notes; slurs (_) on monophonic voices turn the next note into a glide.
    const res = [];
    for (const n of notes) {
      const last = res[res.length - 1], one = n.ms && n.ms.length === 1, adj = last && Math.abs(last.b + last.dur - n.b) < 1e-6;
      if (adj && one && last.tie && last.cur === n.ms[0]) { last.dur += n.dur; last.tie = n.mods.includes('~'); last.leg = n.mods.includes('_'); continue; }
      if (adj && one && last.leg && mono && last.ms && last.ms.length === 1) { (last.glide = last.glide || []).push([n.b - last.b, n.ms[0]]); last.cur = n.ms[0]; last.dur += n.dur; last.tie = n.mods.includes('~'); last.leg = n.mods.includes('_'); continue; }
      n.tie = n.mods.includes('~'); n.leg = n.mods.includes('_'); n.cur = one ? n.ms[0] : null; if (last && last.leg && !mono) last.dur *= 1.08; res.push(n);
    }
    const shift = (d.oct || 0) * 12 + (d.trans || 0) + trans, [lo, hi] = rangeOf(d.rango, 55, 74), hum = d.humano ?? 8, hv = d.humanoVel ?? .07, ring = I.ring;
    const push = (m, b, dur, vel, o, dt) => { m += shift; if (d.amp !== 1) o.amp = d.amp; if (P.range && tk.I && tk.I.rango) { const [a, z] = rangeOf(tk.I.rango); if (m < a - 2 || m > z + 2) W(`${secName}/${tk.key}: nota ${m} fuera del rango de ${tk.inst} (${tk.I.rango})`); } out.push({ tr: ti, m, b, dur, vel, o, h: hum, hv, dt: dt || 0 }); };
    for (const n of res) {
      let ms = n.ms;
      if (n.chord) { ms = voicing(n.chord, lo, hi, d.voces || 4, P.vl[ti], d.abierto); P.vl[ti] = ms; if (d.bajo) { let bm = lo - 12 + ((n.chord.bass - lo) % 12 + 12) % 12; ms = [bm, ...ms]; } }
      const md = n.mods, o = {}; let dur = n.dur;
      if (md.includes("'")) { dur *= .45; o.stac = 1; }
      if (md.includes('^')) o.scoop = 1;
      if (n.glide) o.glide = n.glide.map(([gb, m]) => [gb, m + shift]);
      if (n.grace) n.grace.forEach((g, k) => push(g, n.b, .12, n.vel * .6, {}, -(n.grace.length - k) * .055));
      if (md.includes('%') || md.includes('*')) {
        if (md.includes('%') && I.trem) { o.trem = 1; ms.forEach((m, i) => push(m, n.b, dur, n.vel, Object.assign({ i }, o))); continue; }
        const step = .125, k = Math.max(2, Math.round(dur / step)), tr = md.includes('*');
        for (let j = 0; j < k; j++) ms.forEach((m, i) => push(tr && j % 2 ? upper(S, m) : m, n.b + j * step, step * 1.1, n.vel * (j === 0 ? 1 : rnd(.72, .9)), { i }));
        continue;
      }
      if (ms.length > 1 && d.arp) {
        const base = ms.slice().sort((a, b) => a - b), pool = []; for (let k = 0; k < (d.arpOct || 1); k++) for (const m of base) pool.push(m + 12 * k);
        const seq = d.arp === 'down' ? pool.slice().reverse() : d.arp === 'updown' ? pool.concat(pool.slice(1, -1).reverse()) : /\d/.test(d.arp) ? String(d.arp).trim().split(/\s+/).map(x => { const i = +x - 1; return pool[i % pool.length] + 12 * Math.floor(i / pool.length); }) : pool;
        const step = durOf(d.arpPaso || 'e') || .5;
        for (let j = 0, p = 0; p < dur - 1e-6; j++, p += step) push(d.arp === 'random' ? pick(pool) : seq[j % seq.length], n.b + p, ring ? step * 2 : Math.min(step * 1.05, dur - p), n.vel * (j === 0 ? 1 : .85), { i: j });
        continue;
      }
      const strum = d.rasgueo || 0;
      ms.forEach((m, i) => push(m, n.b, dur, n.vel * (i && strum ? .9 : 1), Object.assign({ i }, o), strum * i));
    }
  }
  function drumEvents(P, tk, ti, src, bars, bpb, d, out, trans, secName, exact) {
    const W = P.S.W, hum = d.humano ?? 5, hv = d.humanoVel ?? .08;
    for (const line of src.split('\n')) {
      const s = line.trim(); if (!s) continue;
      const m = /^([A-Za-z]\w*)\s+(.+)$/.exec(s); if (!m) { W(`${secName}/${tk.key}: línea de percusión rara: "${s}"`); continue; }
      const name = DR_ALIAS[m[1]] || m[1], D = DR[name]; if (!D) { W(`${secName}/${tk.key}: percusión desconocida: ${m[1]}`); continue; }
      const list = splitBars(m[2]).map(x => x.replace(/\s+/g, ''));
      for (let bi = 0; bi < bars; bi++) {
        const g = list[bi % list.length], n = g.length, step = bpb / n;
        for (let i = 0; i < n; i++) {
          const ch = g[i]; if (ch === '.' || ch === '-' || ch === '_') continue;
          const b = bi * bpb + i * step, e = (vel, dt = 0) => out.push({ tr: ti, d: name, b, dur: step, vel, o: d.amp !== 1 ? { amp: d.amp } : {}, pre: D.pre, h: hum, hv, dt });
          if (ch === 'x') e(.72); else if (ch === 'X') e(1); else if (ch === 'o') e(.38);
          else if (ch === 'f') { e(.42, -.028); e(.8); }
          else if (ch === 'R') { for (let k = 0; k < 4; k++) out.push({ tr: ti, d: name, b: b + k * step / 4, dur: step / 4, vel: .45 + k * .08, o: {}, pre: D.pre, h: 2, hv }); }
          else if (ch >= '1' && ch <= '9') { if (exact || Math.random() < (ch - '0') / 10) e(.55); }
          else W(`${secName}/${tk.key}: carácter de rejilla raro "${ch}" en ${name}`);
        }
        if (bi < list.length && bpb * 4 % n !== 0 && n !== 3 && n % 3 !== 0) W(`${secName}/${tk.key}: ${name} tiene ${n} pasos en el compás ${bi + 1}`);
      }
    }
  }

  // ================================================================ Reproductor
  // A player owns one song's gains (for the crossfade), its tracks and echo, and a queue of compiled
  // sections laid out in absolute time; pump() schedules whatever falls before the horizon.
  function Player(X, song, name, t0, log, fadeIn = .05) {
    const c = X.c, S = prep(song), P = { X, c, S, song, name, log, q: [], k: 0, vez: {}, hist: [], vl: {}, next: t0, t0, M: X };
    P.out = gainNode(c, 0, X.music); P.wet = gainNode(c, 0, X.musicWet);
    if (song.eco) {   // a ping-pong echo, in time with the song
      const e = song.eco, spb = 60 / (song.tempo || 100), dt = Math.min(1.9, (durOf(e.tiempo || 'e.') || .75) * spb), a = c.createDelay(2), b = c.createDelay(2), fb = gainNode(c, e.fb ?? .35), lp = c.createBiquadFilter();
      a.delayTime.value = dt; b.delayTime.value = dt; lp.type = 'lowpass'; lp.frequency.value = e.tono || 2600;
      P.echo = gainNode(c, 1); P.echo.connect(a); a.connect(lp); lp.connect(b); b.connect(fb); fb.connect(a);
      const pl = panner(c, -.6), pr = panner(c, .6); lp.connect(pl); b.connect(pr); pl.connect(P.out); pr.connect(P.out); lp.connect(gainNode(c, .3, P.wet));
    }
    P.host = { c, M: X, out: P.out, wet: P.wet, echo: P.echo };
    P.tracks = S.tracks.map(tk => mkTrack(P.host, tk.key, tk.d));
    const v = song.vol ?? 1; [P.out, P.wet].forEach(g => { g.gain.setValueAtTime(0, Math.max(0, t0 - .05)); g.gain.linearRampToValueAtTime(v, t0 + fadeIn); });
    return P;
  }
  function enqueue(P) {
    const S = P.S, f = S.forma; if (!f.length) { P.done = true; return; }
    for (let guard = 0; guard < f.length + 1; guard++) {
      if (P.k >= f.length) { if (!S.bucle) { P.done = true; return; } P.k = S.vuelta; P.loops = (P.loops || 0) + 1; }
      const name = f[P.k++], vez = P.vez[name] = (P.vez[name] ?? -1) + 1, sec = compileSection(P, name, vez, false);
      if (!sec || sec.dur <= 0) continue;
      sec.start = P.next; sec.end = P.next + sec.dur; sec.i = 0; P.next = sec.end; P.q.push(sec); P.hist.push({ name, vez, k: P.k - 1, start: sec.start, end: sec.end, bars: sec.bars, spb: sec.spb, bpb: sec.bpb }); if (P.hist.length > 64) P.hist.shift();
      for (const e of sec.ev) { const tr = P.tracks[e.tr]; if (e.d) { const D = DR[e.d]; for (let k = 0; k < (D.vars || 3); k++) WARM.push([P.c, 'dr:' + e.d + k, sr => D.gen(sr, k)]); } else if (tr.I && tr.I.kind === 'buf') WARM.push([P.c, tr.inst + e.m, sr => tr.I.gen(e.m, sr)]); }
      return;
    }
    P.done = true;
  }
  function pump(P, horizon, cur) {
    while (!P.done && P.next < horizon + 3) enqueue(P);
    for (const s of P.q) {
      while (s.i < s.ev.length && s.start + s.ev[s.i].at < horizon) {
        const e = s.ev[s.i++], t = s.start + e.t; if (!P.offline && t < cur - .04) continue;
        const tr = P.tracks[e.tr];
        try { if (e.d) playDrum(tr, e.d, t, e.vel, e.o); else if (tr.I && tr.I.play) tr.I.play(tr, Math.max(t, cur), e.m, e.dur, e.vel, e.o); } catch (err) { if (!P.err) { P.err = 1; console.warn('♪', err); } }
        if (P.log) P.log.push([+t.toFixed(3), tr.key, e.d || tr.inst, e.m ?? null, s.name]);
      }
    }
    P.q = P.q.filter(s => s.i < s.ev.length || s.end > cur - 1);
  }
  function release(P, t, secs) {
    P.stopped = true; for (const g of [P.out, P.wet]) { const p = g.gain; if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); } p.linearRampToValueAtTime(0, t + secs); }
    setTimeout(() => { try { P.out.disconnect(); P.wet.disconnect(); P.tracks.forEach(tr => tr.lfo && tr.lfo.stop()); } catch (e) { } }, (secs + 5) * 1000);
  }

  // ================================================================ Ambientes
  // A living bed per place: continuous layers (water, wind, rain, hum) whose levels wander, and
  // generators of events (crickets, frogs answering each other, birds, splashes, creaks, thunder)
  // placed at random times, pans and distances, so nothing ever loops audibly.
  const AMBS = {
    atardecer: { capas: [['agua', .8], ['brisa', .35], ['insectos', .25]], eventos: [['grillos', { n: 5 }], ['ranas', { tipos: ['ribbit', 'croac', 'toro'], cada: [1.5, 6] }], ['evento', { son: 'pez', cada: [12, 35] }], ['evento', { son: 'pajaro', cada: [9, 24] }], ['evento', { son: 'ola', cada: [2.5, 6] }]] },
    noche: { capas: [['viento', .45], ['agua', .45], ['insectos', .6]], eventos: [['grillos', { n: 7 }], ['ranas', { tipos: ['pip', 'ribbit'], cada: [2, 7] }], ['evento', { son: 'buho', cada: [14, 35] }], ['evento', { son: 'hojas', cada: [3, 9] }], ['evento', { son: 'pez', cada: [25, 60] }]] },
    raices: { capas: [['brisa', .45], ['insectos', .35]], eventos: [['grillos', { n: 3 }], ['evento', { son: 'crujido', cada: [5, 14] }], ['evento', { son: 'hojas', cada: [3, 8] }], ['evento', { son: 'carpintero', cada: [18, 45] }], ['evento', { son: 'pajaro', cada: [8, 20] }], ['evento', { son: 'cigarra', cada: [10, 26] }], ['ranas', { tipos: ['toro'], cada: [10, 30], resp: .3 }]] },
    tormenta: { capas: [['lluvia', 1], ['viento', .7]], eventos: [['evento', { son: 'racha', cada: [5, 12] }], ['evento', { son: 'trueno', cada: [9, 24] }], ['evento', { son: 'goteras', cada: [.4, 1.1] }], ['ranas', { tipos: ['toro', 'croac'], cada: [8, 22], resp: .5 }]] },
    cueva: { capas: [['zumbido', 1], ['hilo', .5]], eco: [.31, .42], eventos: [['evento', { son: 'gota', cada: [.5, 2.4] }], ['evento', { son: 'burbujas', cada: [7, 18] }], ['evento', { son: 'piedra', cada: [18, 45] }]] },
    rio: { capas: [['rio', 1], ['zumbido', .6]], eco: [.27, .35], eventos: [['evento', { son: 'gota', cada: [1.2, 4] }], ['evento', { son: 'burbujas', cada: [1, 4] }]] },
    nido: { capas: [['viento', 1], ['silbo', .6], ['brisa', .4]], eventos: [['evento', { son: 'crujido', cada: [4, 10] }], ['evento', { son: 'hojas', cada: [3, 8] }], ['evento', { son: 'garza', cada: [16, 40] }], ['evento', { son: 'racha', cada: [6, 14] }]] },
    alba: { capas: [['agua', .55], ['brisa', .3]], eventos: [['evento', { son: 'canto', cada: [1.5, 5] }], ['evento', { son: 'canto', cada: [3, 9] }], ['evento', { son: 'paloma', cada: [12, 28] }], ['evento', { son: 'pez', cada: [20, 50] }], ['grillos', { n: 2 }], ['ranas', { tipos: ['ribbit'], cada: [8, 20], resp: .4 }]] },
    lluvia: { capas: [['lluvia', .8]], eventos: [['evento', { son: 'goteras', cada: [.6, 1.4] }]] } };
  const AMB_ALIAS = { dusk: 'atardecer', night: 'noche', roots: 'raices', storm: 'tormenta', cave: 'cueva', river: 'rio', nest: 'nido', dawn: 'alba', rain: 'lluvia' };
  function noiseSrc(A, t) { const s = A.c.createBufferSource(); s.buffer = A.X.noise; s.loop = true; s.playbackRate.value = rnd(.9, 1.1); s.start(t, rnd(0, 1.9)); return s; }
  function filt(c, type, f, q) { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  // A continuous layer: noise → filters → level; wander() re-aims the level and colour now and then.
  function layer(A, t0, v, chain, send, wander) {
    const c = A.c, s = noiseSrc(A, t0), g = gainNode(c, 0); let n = s; for (const f of chain) { n.connect(f); n = f; } n.connect(g); g.connect(A.out); if (send) g.connect(gainNode(c, send, A.wet));
    let next = t0; return { g, tick(h) { while (next < h) next += wander(next, g, chain) || 1; }, stop(t) { try { s.stop(t); } catch (e) { } } };
  }
  const BEDS = {
    agua(A, t0, v) { const c = A.c; return layer(A, t0, v, [filt(c, 'lowpass', 420, .8), filt(c, 'highpass', 70, .7)], .3, (t, g, [lp]) => { const pk = rnd(.25, 1) * v * .2, up = rnd(.25, .8); g.gain.setTargetAtTime(pk, t, up * .5); g.gain.setTargetAtTime(pk * .3, t + up, rnd(.3, .6)); lp.frequency.setTargetAtTime(rnd(280, 700), t, .3); return up + rnd(.6, 1.8); }); },
    brisa(A, t0, v) { const c = A.c; return layer(A, t0, v, [filt(c, 'bandpass', 900, .5), filt(c, 'lowpass', 3000, .5)], .4, (t, g, [bp]) => { g.gain.setTargetAtTime(rnd(.15, 1) * v * .07, t, rnd(1, 2.5)); bp.frequency.setTargetAtTime(rnd(500, 1600), t, 1.5); return rnd(2, 5); }); },
    viento(A, t0, v) { const c = A.c; return layer(A, t0, v, [filt(c, 'bandpass', 600, 1.1)], .45, (t, g, [bp]) => { g.gain.setTargetAtTime(rnd(.2, 1) * v * .18, t, rnd(.8, 2)); bp.frequency.setTargetAtTime(rnd(280, 1200), t, rnd(.8, 2)); return rnd(1.5, 4); }); },
    silbo(A, t0, v) { const c = A.c; return layer(A, t0, v, [filt(c, 'bandpass', 1200, 14)], .6, (t, g, [bp]) => { g.gain.setTargetAtTime(Math.random() < .35 ? 0 : rnd(.3, 1) * v * .9, t, rnd(.6, 1.5)); bp.frequency.setTargetAtTime(rnd(700, 1900), t, rnd(.5, 1.5)); return rnd(1.5, 4); }); },
    lluvia(A, t0, v) { const c = A.c, a = layer(A, t0, v, [filt(c, 'highpass', 600, .6), filt(c, 'lowpass', 7500, .5)], .35, (t, g) => { g.gain.setTargetAtTime(rnd(.8, 1) * v * .13, t, 1.5); return rnd(2, 4); }), b = layer(A, t0, v, [filt(c, 'lowpass', 700, .7)], .2, (t, g) => { g.gain.setTargetAtTime(rnd(.6, 1) * v * .15, t, 2); return rnd(2, 5); }); return { tick(h) { a.tick(h); b.tick(h); }, stop(t) { a.stop(t); b.stop(t); } }; },
    rio(A, t0, v) { const c = A.c, a = layer(A, t0, v, [filt(c, 'bandpass', 700, .6)], .4, (t, g, [bp]) => { g.gain.setTargetAtTime(rnd(.5, 1) * v * .25, t, rnd(.1, .4)); bp.frequency.setTargetAtTime(rnd(450, 1100), t, .2); return rnd(.2, .7); }), b = layer(A, t0, v, [filt(c, 'highpass', 2500, .6)], .3, (t, g) => { g.gain.setTargetAtTime(rnd(.2, 1) * v * .05, t, .15); return rnd(.2, .6); }); return { tick(h) { a.tick(h); b.tick(h); }, stop(t) { a.stop(t); b.stop(t); } }; },
    hilo(A, t0, v) { const c = A.c; return layer(A, t0, v, [filt(c, 'bandpass', 2400, 2)], .5, (t, g, [bp]) => { g.gain.setTargetAtTime(rnd(.1, 1) * v * .05, t, .1); bp.frequency.setTargetAtTime(rnd(1800, 3200), t, .1); return rnd(.1, .35); }); },
    zumbido(A, t0, v) { const c = A.c, g = gainNode(c, 0, A.out), os = [44, 66.5, 88.3].map((f, i) => { const o = c.createOscillator(); o.frequency.value = f; o.connect(gainNode(c, [1, .4, .25][i], g)); o.start(t0); return o; }), nz = layer(A, t0, v, [filt(c, 'lowpass', 160, .7)], .5, (t, gg) => { gg.gain.setTargetAtTime(rnd(.4, 1) * v * .2, t, 2); return rnd(3, 6); });
      let next = t0; return { tick(h) { nz.tick(h); while (next < h) { g.gain.setTargetAtTime(rnd(.3, 1) * v * .05, next, 3); next += rnd(3, 7); } }, stop(t) { os.forEach(o => o.stop(t)); nz.stop(t); } }; },
    insectos(A, t0, v) { const c = A.c, out = []; for (const p of [-.6, .6]) { const s = c.createBufferSource(); s.buffer = bufOf(c, 'amb:trino' + (p > 0 ? 1 : 0), sr => trill(sr)); s.loop = true; s.playbackRate.value = rnd(.94, 1.06); const g = gainNode(c, 0), pn = panner(c, p); s.connect(g); g.connect(pn); pn.connect(A.out); g.connect(gainNode(c, .5, A.wet)); s.start(t0, rnd(0, 3)); out.push({ s, g }); }
      let next = t0; return { tick(h) { while (next < h) { out.forEach(o => o.g.gain.setTargetAtTime(rnd(.2, 1) * v * .05, next, 2)); next += rnd(3, 8); } }, stop(t) { out.forEach(o => o.s.stop(t)); } }; } };
  // Plays a pre-rendered sound in the ambience: near is dry and bright; far is quieter, darker, wetter.
  function ambHit(A, buf, t, o) {
    const c = A.c, src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = o.rate || 1; let n = src; const dist = o.dist ?? .5;
    if (dist > .45) { const lp = filt(c, 'lowpass', 9000 - dist * 6500, .5); src.connect(lp); n = lp; }
    const dry = gainNode(c, o.vol * (1 - dist * .7)), pn = panner(c, o.pan || 0); n.connect(dry); dry.connect(pn); pn.connect(A.out);
    n.connect(gainNode(c, o.vol * (.2 + dist * .8), A.wet)); if (o.echo && A.echo) n.connect(gainNode(c, o.vol * o.echo, A.echo));
    src.start(Math.max(t, c.currentTime)); return buf.duration / (o.rate || 1);
  }
  const hit = (A, key, gen, t, o) => ambHit(A, bufOf(A.c, 'amb:' + key, gen), t, o);
  const pos = (d0 = .2, d1 = .9) => ({ pan: rnd(-.85, .85), dist: rnd(d0, d1) });
  const SONES = {   // one-shot sounds of the ambiences: (A, t) → duration
    pez: (A, t) => hit(A, 'pez' + (Math.random() * 4 | 0), splash, t, Object.assign(pos(.3, .9), { vol: .35, rate: rnd(.85, 1.15) })),
    ola: (A, t) => hit(A, 'ola' + (Math.random() * 4 | 0), lap, t, Object.assign(pos(.1, .6), { vol: .2, rate: rnd(.8, 1.2) })),
    pajaro: (A, t) => hit(A, 'pajaro' + (Math.random() * 6 | 0), birdCall, t, Object.assign(pos(.55, .95), { vol: .3, rate: rnd(.9, 1.1) })),
    canto(A, t) { const k = Math.random() * 8 | 0; A.bird = A.bird || {}; const p = A.bird[k] = A.bird[k] || pos(.2, .85); return hit(A, 'canto' + k, song => birdSong(song, k), t, Object.assign({}, p, { vol: .22 })); },
    paloma: (A, t) => hit(A, 'paloma' + (Math.random() * 3 | 0), dove, t, Object.assign(pos(.4, .9), { vol: .35 })),
    buho: (A, t) => hit(A, 'buho' + (Math.random() * 3 | 0), owl, t, Object.assign(pos(.45, .95), { vol: .45 })),
    hojas: (A, t) => hit(A, 'hojas' + (Math.random() * 5 | 0), leaves, t, Object.assign(pos(.1, .7), { vol: .25, rate: rnd(.8, 1.2) })),
    crujido: (A, t) => hit(A, 'crujido' + (Math.random() * 5 | 0), creak, t, Object.assign(pos(.2, .8), { vol: .3, rate: rnd(.8, 1.25) })),
    carpintero: (A, t) => hit(A, 'carp' + (Math.random() * 3 | 0), woodpecker, t, Object.assign(pos(.5, .95), { vol: .3 })),
    cigarra: (A, t) => hit(A, 'cigarra' + (Math.random() * 3 | 0), cicada, t, Object.assign(pos(.3, .8), { vol: .12, rate: rnd(.92, 1.08) })),
    garza: (A, t) => hit(A, 'garza' + (Math.random() * 3 | 0), heronCall, t, Object.assign(pos(.6, .95), { vol: .45, rate: rnd(.9, 1.05) })),
    trueno: (A, t) => hit(A, 'trueno' + (Math.random() * 4 | 0), thunderRoll, t, Object.assign(pos(.5, .9), { vol: .6, rate: rnd(.8, 1.1) })),
    goteras: (A, t) => hit(A, 'goteras' + (Math.random() * 4 | 0), patter, t, Object.assign(pos(.1, .6), { vol: .18, rate: rnd(.8, 1.2) })),
    gota: (A, t) => hit(A, 'gota' + (Math.random() * 10 | 0), caveDrip, t, Object.assign(pos(.2, .9), { vol: .3, echo: .6 })),
    burbujas: (A, t) => hit(A, 'burb' + (Math.random() * 5 | 0), bubbles, t, Object.assign(pos(.2, .7), { vol: .25, echo: .2 })),
    piedra: (A, t) => hit(A, 'piedra' + (Math.random() * 3 | 0), pebbles, t, Object.assign(pos(.5, .9), { vol: .25, echo: .5 })),
    racha(A, t) {   // a gust: a band of noise that swells and sweeps across
      const c = A.c, len = rnd(2, 4), s = noiseSrc(A, t), bp = filt(c, 'bandpass', 300, .9), g = gainNode(c, 0), pn = panner(c, 0), p0 = rnd(-.8, .8);
      bp.frequency.setValueAtTime(rnd(250, 400), t); bp.frequency.linearRampToValueAtTime(rnd(800, 1600), t + len * .5); bp.frequency.linearRampToValueAtTime(rnd(300, 500), t + len);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(.07, .15), t + len * .45); g.gain.linearRampToValueAtTime(0, t + len);
      if (pn.pan) { pn.pan.setValueAtTime(p0, t); pn.pan.linearRampToValueAtTime(-p0 * .6, t + len); }
      s.connect(bp); bp.connect(g); g.connect(pn); pn.connect(A.out); g.connect(gainNode(c, .5, A.wet)); s.stop(t + len + .1); return len;
    } };
  const GENS = {
    evento(A, t0, o) { let next = t0 + rnd(o.cada[0] * .2, o.cada[1] * .6); return { tick(h) { while (next < h) { const d = SONES[o.son](A, next, o) || 0; next += Math.max(d * .5, rnd(o.cada[0], o.cada[1])); } } }; },
    grillos(A, t0, o) {   // a chorus of crickets, each with its own pitch, pulse count and rhythm, singing and resting
      const cr = []; for (let i = 0; i < (o.n || 4); i++) cr.push(Object.assign(pos(.2, .9), { pitch: Math.round(rnd(3700, 5300) / 100) * 100, pulses: 2 + (Math.random() * 3 | 0), period: rnd(.42, 1.05), next: t0 + rnd(0, 2), on: Math.random() < .75, flip: t0 + rnd(5, 18), vol: rnd(.5, 1) }));
      return { tick(h) { for (const k of cr) while (k.next < h) {
        if (k.next > k.flip) { k.on = !k.on; k.flip = k.next + (k.on ? rnd(8, 30) : rnd(2, 10)); }
        if (k.on) hit(A, 'grillo' + k.pitch + '_' + k.pulses, sr => chirp(sr, k.pitch, k.pulses), k.next, { vol: .11 * k.vol, pan: k.pan, dist: k.dist });
        k.next += k.period * rnd(.96, 1.04); } } };
    },
    ranas(A, t0, o) {   // frogs calling in phrases, often answered by another from elsewhere
      const pool = []; for (let i = 0; i < 5; i++) pool.push(Object.assign(pos(.2, .95), { tipo: pick(o.tipos), rate: rnd(.88, 1.12), v: Math.random() * 3 | 0 }));
      const call = (f, t) => { const R = FROG[f.tipo], n = R.reps[0] + (Math.random() * (R.reps[1] - R.reps[0] + 1) | 0); let tt = t; for (let i = 0; i < n; i++) { hit(A, 'rana' + f.tipo + f.v, sr => frog(sr, f.tipo), tt, { vol: R.vol, pan: f.pan, dist: f.dist, rate: f.rate * rnd(.98, 1.02) }); tt += R.gap * rnd(.85, 1.2); } return tt - t; };
      let next = t0 + rnd(.5, 3);
      return { tick(h) { while (next < h) { const f = pick(pool), d = call(f, next); let e = d; if (Math.random() < (o.resp ?? .6)) { const g = pick(pool.filter(x => x !== f)), at = d + rnd(.25, .9); e = at + call(g, next + at); } next += e + rnd(o.cada[0], o.cada[1]); } } };
    } };
  function Amb(X, name, t0, vol, fadeIn) {
    const def = AMBS[name], c = X.c, A = { X, c, name, beds: [], gens: [] };
    A.out = gainNode(c, 0, X.amb); A.wet = gainNode(c, 0, X.ambWet);
    [A.out, A.wet].forEach(g => { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + fadeIn); });
    if (def.eco) { const d = c.createDelay(1), fb = gainNode(c, def.eco[1]), lp = filt(c, 'lowpass', 2400, .5); d.delayTime.value = def.eco[0]; A.echo = gainNode(c, 1, d); d.connect(lp); lp.connect(fb); fb.connect(d); const pn = panner(c, .4); lp.connect(pn); pn.connect(A.out); lp.connect(gainNode(c, .6, A.wet)); }
    for (const [k, v] of def.capas) A.beds.push(BEDS[k](A, t0, v));
    for (const [k, o] of def.eventos) A.gens.push(GENS[k](A, t0, o));
    return A;
  }
  function ambPump(A, h) { for (const b of A.beds) b.tick(h); for (const g of A.gens) g.tick(h); }
  function ambRelease(A, t, secs) { A.stopped = true; for (const g of [A.out, A.wet]) { const p = g.gain; if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); } p.linearRampToValueAtTime(0, t + secs); } A.beds.forEach(b => b.stop(t + secs + .1)); setTimeout(() => { try { A.out.disconnect(); A.wet.disconnect(); } catch (e) { } }, (secs + 4) * 1000); }

  // ---------------------------------------------------------------- Sonidos de la naturaleza
  function chirp(sr, p, pulses) {   // a cricket: a few pulses of a pure high tone
    const pp = 1 / rnd(27, 34), o = arr(sr, pulses * pp + .03);
    for (let k = 0; k < pulses; k++) { const s = Math.floor(k * pp * sr), n = Math.floor(.016 * sr); for (let i = 0; i < n; i++) { const e = Math.sin(Math.PI * i / n), t = i / sr; o[s + i] += e * (Math.sin(TAU * p * t) + .12 * Math.sin(TAU * 2 * p * t)); } }
    return norm(o, .8);
  }
  function trill(sr) {   // a far-off insect chorus: pulsed high tones drifting in level
    const o = arr(sr, 4); let lv = .5;
    for (const f of [6400, 5800, 7100]) { let ph = 0; const r = rnd(38, 52); for (let i = 0; i < o.length; i++) { if (i % 2048 === 0) lv = clamp(lv + rnd(-.15, .15), .1, 1); ph += TAU * f / sr; const am = Math.pow(Math.max(0, Math.sin(TAU * r * i / sr)), 3); o[i] += Math.sin(ph) * am * lv * .3; } }
    const n = Math.floor(.3 * sr); for (let i = 0; i < n; i++) { const k = i / n; o[i] = o[i] * k + o[o.length - n + i] * (1 - k); }   // crossfade the loop point
    return norm(o.subarray(0, o.length - n).slice(), .6);
  }
  const FROG = { ribbit: { reps: [1, 3], gap: .32, vol: .3 }, croac: { reps: [2, 4], gap: .45, vol: .32 }, toro: { reps: [1, 3], gap: .95, vol: .35 }, pip: { reps: [2, 6], gap: .5, vol: .16 } };
  function frog(sr, kind) {   // a pulse train (the vocal sacs) through two formants
    if (kind === 'pip') { const o = arr(sr, .2), f = rnd(2600, 3000); sweep(o, sr, f, f * 1.15, .1, 1, .05); return norm(o, .8); }
    const P = { ribbit: { len: .19, rate: [120, 90], f: [1300, 2500], syl: [[0, .07], [.1, .08]] }, croac: { len: .3, rate: [42, 36], f: [520, 1350], syl: [[0, .28]] }, toro: { len: .7, rate: [118, 105], f: [260, 620], syl: [[0, .65]] } }[kind];
    const o = arr(sr, P.len + .1), x = new Float32Array(o.length), f1 = P.f[0] * rnd(.9, 1.1), f2 = P.f[1] * rnd(.9, 1.1);
    for (const [s0, len] of P.syl) { let t = s0; while (t < s0 + len) { const u = (t - s0) / len, i = Math.floor(t * sr); if (i < x.length) x[i] += Math.sin(Math.PI * u) * (kind === 'toro' ? Math.min(1, u * 4) : 1); t += 1 / (P.rate[0] + (P.rate[1] - P.rate[0]) * u) * rnd(.93, 1.07); } }
    const a = biq(x.slice(), 'bp', f1, 6, sr), b = biq(x.slice(), 'bp', f2, 8, sr); for (let i = 0; i < o.length; i++) o[i] = a[i] + b[i] * .6;
    if (kind === 'toro') biq(o, 'lp', 900, .7, sr);
    return norm(fade(o, sr), .8);
  }
  function splash(sr) { const o = arr(sr, 1.1), z = svf(noiseArr(o.length), i => 3500 * Math.exp(-i / sr / .12) + 350, .8, sr, 'lp'); for (let i = 0; i < o.length; i++) o[i] += z[i] * Math.pow(.001, i / sr / .45) * .8; for (let k = 0; k < 7; k++) { const f = rnd(450, 1100); sweep(o, sr, f, f * 1.8, .03, rnd(.1, .3), .04, rnd(.02, .35)); } for (let k = 0; k < 5; k++) { const f = rnd(1400, 2600); sweep(o, sr, f, f * 1.5, .015, rnd(.05, .12), .03, rnd(.3, .9)); } return norm(fade(o, sr), .8); }
  function lap(sr) { const len = rnd(.9, 1.6), o = arr(sr, len), z = svf(noiseArr(o.length), rnd(350, 650), .8, sr, 'lp'); for (let i = 0; i < o.length; i++) { const u = i / o.length; o[i] = z[i] * Math.sin(Math.PI * Math.pow(u, .6)) * .8; } for (let k = 0; k < 3; k++) { const f = rnd(250, 500); sweep(o, sr, f, f * 1.9, .05, rnd(.05, .12), .05, rnd(.1, len * .6)); } return norm(o, .7); }
  function birdCall(sr) {   // a distant bird: a two or three note whistle, or a short trill
    const o = arr(sr, 1.2), f = rnd(1800, 3000), k = Math.random();
    if (k < .4) { sweep(o, sr, f, f * 1.15, .12, .8, .04, 0, .1); sweep(o, sr, f * 1.1, f * .8, .35, .8, .08, .22, .1); }
    else if (k < .75) { for (let i = 0; i < 3; i++) sweep(o, sr, f * (1.2 - i * .12), f * (1.1 - i * .12), .14, .7, .05, i * .22, .1); }
    else { for (let i = 0; i < 9; i++) sweep(o, sr, f * 1.3, f * 1.1, .03, .5, .02, i * .055, .1); }
    return norm(fade(o, sr), .7);
  }
  function birdSong(sr, seed) {   // a songbird phrase built from syllables: sweeps up and down, whistles, trills
    const o = arr(sr, 2.2), base = rnd(2400, 4600); let t = 0; const n = 4 + (Math.random() * 7 | 0);
    for (let i = 0; i < n && t < 1.9; i++) {
      const k = Math.random(), f = base * rnd(.8, 1.25);
      if (k < .3) { sweep(o, sr, f * .8, f * 1.3, .06, .7, .02, t, .15); t += .08; }
      else if (k < .55) { sweep(o, sr, f * 1.3, f * .75, .07, .7, .02, t, .15); t += .09; }
      else if (k < .75) { sweep(o, sr, f, f * 1.02, .14, .6, .04, t, .2); t += .17; }
      else { for (let j = 0; j < 6; j++) sweep(o, sr, f * 1.1, f * .95, .018, .45, .01, t + j * .028); t += .18; }
      t += rnd(.02, .09);
    }
    return norm(fade(o, sr), .7);
  }
  function dove(sr) { const o = arr(sr, 1.9), f = rnd(480, 560); [[0, .3, 1], [.42, .5, 1.12], [1.05, .25, 1], [1.4, .3, .96]].forEach(([at, len, k]) => { const s = Math.floor(at * sr), n = Math.floor(len * sr); let ph = 0; for (let i = 0; i < n && s + i < o.length; i++) { ph += TAU * f * k * (1 + .04 * Math.sin(Math.PI * i / n)) / sr; o[s + i] += (Math.sin(ph) + .25 * Math.sin(2 * ph)) * Math.pow(Math.sin(Math.PI * i / n), 1.5); } }); return norm(biq(o, 'lp', 1400, .7, sr), .7); }
  function owl(sr) { const o = arr(sr, 2.2), f = rnd(360, 420); [[0, .35], [.75, .16], [.95, .16], [1.25, .6]].forEach(([at, len]) => { const s = Math.floor(at * sr), n = Math.floor(len * sr); let ph = 0; for (let i = 0; i < n; i++) { const u = i / n; ph += TAU * f * (1 - .06 * u) / sr; o[s + i] += (Math.sin(ph) + .15 * Math.sin(2 * ph)) * Math.pow(Math.sin(Math.PI * u), .8); } }); burst(o, sr, 2, 700, .8, .02, 'bp'); return norm(o, .7); }
  function leaves(sr) { const len = rnd(.4, 1), o = arr(sr, len); for (let k = 0; k < 260; k++) { const u = Math.random(); partial(o, sr, rnd(2500, 8000), rnd(.1, 1) * Math.sin(Math.PI * u), rnd(.003, .01), .0002, u * len * .95); } return norm(biq(o, 'hp', 1800, .7, sr), .6); }
  function creak(sr) {   // wood under strain: stick-slip clicks at a wandering rate through the wood's modes
    const len = rnd(.5, 1.3), x = arr(sr, len + .1); let t = 0; const r0 = rnd(18, 40), r1 = rnd(25, 70);
    while (t < len) { const u = t / len; x[Math.floor(t * sr)] += Math.sin(Math.PI * u); t += 1 / (r0 + (r1 - r0) * Math.sin(Math.PI * u)) * rnd(.9, 1.1); }
    const f = rnd(.8, 1.25), a = biq(x.slice(), 'bp', 280 * f, 10, sr), b = biq(x.slice(), 'bp', 760 * f, 8, sr), c = biq(x.slice(), 'bp', 1750 * f, 6, sr);
    for (let i = 0; i < x.length; i++) x[i] = a[i] + b[i] * .7 + c[i] * .4; return norm(fade(x, sr), .7);
  }
  function woodpecker(sr) { const n = 12 + (Math.random() * 10 | 0), r = rnd(15, 20), o = arr(sr, n / r + .1); for (let k = 0; k < n; k++) { const g = 1 - k / n * .6; partial(o, sr, 1150, g, .025, .0003, k / r); partial(o, sr, 2700, g * .4, .015, .0003, k / r); } return norm(o, .7); }
  function cicada(sr) { const o = arr(sr, rnd(2, 3.5)), z = svf(noiseArr(o.length), rnd(4500, 6000), 3, sr, 'bp'), r = rnd(180, 230); for (let i = 0; i < o.length; i++) { const u = i / o.length; o[i] = z[i] * Math.pow(Math.max(0, Math.sin(TAU * r * i / sr)), 2) * Math.min(1, u * 3) * Math.min(1, (1 - u) * 4); } return norm(o, .6); }
  function heronCall(sr) {   // a distant heron: a harsh, nasal 'fraank'
    const o = arr(sr, .7), x = new Float32Array(o.length); let t = 0; const len = rnd(.35, .55);
    while (t < len) { const u = t / len; x[Math.floor(t * sr)] += Math.sin(Math.PI * Math.min(1, u * 1.4)) * rnd(.7, 1); t += 1 / (rnd(210, 240) - 60 * u) * rnd(.92, 1.08); }
    const a = biq(x.slice(), 'bp', 950, 5, sr), b = biq(x.slice(), 'bp', 2100, 6, sr); for (let i = 0; i < o.length; i++) o[i] = a[i] + b[i] * .8;
    burst(o, sr, len, 1800, 1.5, .04, 'bp'); return norm(fade(o, sr), .8);
  }
  function thunderRoll(sr) {   // far thunder: rumbling bursts of low noise that come and go
    const len = rnd(4.5, 7), o = arr(sr, len), bumps = []; for (let k = 0; k < 3 + (Math.random() * 4 | 0); k++) bumps.push([rnd(0, len * .5), rnd(.08, .5), rnd(.8, 2.5), rnd(.4, 1)]);
    const fc = []; for (let k = 0; k < 20; k++) fc.push(rnd(70, 380));
    const z = svf(noiseArr(o.length), i => fc[Math.floor(i / o.length * 19.99)], .7, sr, 'lp');
    for (let i = 0; i < o.length; i++) { const t = i / sr; let e = 0; for (const [s, a, d, g] of bumps) if (t > s) e += g * (t < s + a ? (t - s) / a : Math.exp(-(t - s - a) / d)); o[i] = z[i] * e; }
    return norm(fade(o, sr, .5), .9);
  }
  function patter(sr) { const o = arr(sr, 1.5); for (let k = 0; k < 45; k++) { const at = rnd(0, 1.4); if (Math.random() < .5) partial(o, sr, rnd(1800, 6000), rnd(.2, 1), rnd(.008, .02), .0002, at); else { const f = rnd(900, 2400); sweep(o, sr, f, f * 1.6, .008, rnd(.1, .4), .02, at); } } return norm(o, .6); }
  function caveDrip(sr) { const o = arr(sr, .4), f = rnd(650, 2100); sweep(o, sr, f, f * rnd(1.4, 2), .018, 1, .09); partial(o, sr, f * .5, .15, .05); return norm(o, .8); }
  function bubbles(sr) { const o = arr(sr, .8); let t = 0; for (let k = 0; k < 3 + (Math.random() * 7 | 0); k++) { const f = rnd(280, 900); sweep(o, sr, f, f * 1.7, .03, rnd(.3, 1), .05, t); t += rnd(.02, .12); } return norm(o, .7); }
  function pebbles(sr) { const o = arr(sr, 1); let t = 0; for (let k = 0; k < 5 + (Math.random() * 5 | 0); k++) { partial(o, sr, rnd(1500, 4000), rnd(.3, 1) * (1 - k / 12), .02, .0002, t); partial(o, sr, rnd(500, 900), .3, .03, .0002, t); t += rnd(.04, .15) * (1 + k * .15); } return norm(o, .6); }

  // ================================================================ Efectos del juego
  // Foley and stingers, all synthesized, in the spirit of Rayman 1: wet, woody, breathy, cartoony but
  // organic. Most effects are rendered once in JS (a few variants each, cached like the instrument
  // notes) and played back with a small random nudge of pitch and level, so repeated sounds never
  // machine-gun; they go through the effects bus (a small room, a touch of hall) with an optional pan.
  // The musical ones (stingers, chimes, UI) play the engine's instruments in D major, the key the
  // music leans on. Sound.play(name, arg, { pan, x }) — x: a world x, turned into a pan around the camera.

  // ---- JS DSP for the effects
  const expEnv = (atk, dec) => t => (t < atk ? t / atk : Math.exp(-(t - atk) / dec));
  const hump = (p = 1, skew = 1) => (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, skew)), p);
  // A sine gliding exponentially from f0 to f1 (time constant glT), decaying exponentially (dec).
  // (A sine table and multiplicative envelopes keep these cheap: a buffer renders in a few ms.)
  const SINE = new Float32Array(4097); for (let i = 0; i <= 4096; i++) SINE[i] = Math.sin(TAU * i / 4096);
  const sinT = ph => { const x = (ph - Math.floor(ph)) * 4096, i = x | 0; return SINE[i] + (SINE[i + 1] - SINE[i]) * (x - i); };   // ph in cycles
  function tone(o, sr, at, f0, f1, glT, a, dec, atk = .0015, h2 = 0) {
    const s = Math.floor(at * sr), n = Math.min(o.length - s, Math.ceil(dec * 7 * sr)), dg = Math.exp(-1 / (glT * sr)), dd = Math.exp(-1 / (dec * sr)), na = atk * sr;
    let ph = 0, e = 1, g = a;
    for (let i = 0; i < n; i++) { const f = f1 + (f0 - f1) * e; ph += f / sr; o[s + i] += (sinT(ph) + (h2 ? h2 * sinT(2 * ph) : 0)) * g * (i < na ? i / na : 1); e *= dg; g *= dd; }
  }
  // Filtered noise: fc is Hz or fn(t, u) (u = 0..1 through the burst); en(t, u) its envelope. Band-pass is level-compensated.
  function nb(o, sr, at, len, fc, q, mode, a, en) {
    const n = Math.floor(len * sr), s = Math.floor(at * sr); if (n <= 0) return o;
    const z = svf(noiseArr(n), typeof fc === 'function' ? i => fc(i / sr, i / n) : fc, q, sr, mode), k = a * (mode === 'bp' ? 1 / q : 1);
    let e = 1; for (let i = 0; i < n && s + i < o.length; i++) { if (en && (i & 7) === 0) e = en(i / sr, i / n); o[s + i] += z[i] * k * e; }
    return o;
  }
  function bubble(o, sr, at, f, dec, a, rise = .6) {   // an air bubble in water (Minnaert): a sine whose pitch rises as it dies
    const s = Math.floor(at * sr), n = Math.min(o.length - s, Math.ceil(dec * 6 * sr)), dd = Math.exp(-1 / (dec * sr)), na = .0012 * sr, df = f * rise / (dec * sr) / sr;
    let ph = 0, g = a, fr = f / sr;
    for (let i = 0; i < n; i++) { ph += fr; fr += df; o[s + i] += sinT(ph) * g * (i < na ? i / na : 1); g *= dd; }
  }
  function knock(o, sr, at, f, a, dec, parts = [[1, 1], [2.32, .45], [4.1, .2]]) {   // a struck piece of wood: a few modes and a click
    for (const [r, g] of parts) tone(o, sr, at, f * r * 1.02, f * r, .004, a * g, dec / Math.sqrt(r), .0006);
    nb(o, sr, at, .006, Math.min(9000, f * 3), 1, 'bp', a * .9, expEnv(.0003, .0012));
  }
  function grains(o, sr, at, len, n, fLo, fHi, a, dec, shape = 2) {   // debris, crackle: n tiny pings over len seconds, thinning out
    for (let k = 0; k < n; k++) { const u = Math.pow(Math.random(), shape); partial(o, sr, rnd(fLo, fHi), a * rnd(.3, 1) * (1 - u * .7), dec * rnd(.5, 1.5), .0003, at + u * len); }
  }
  function drops(o, sr, at, len, n, fLo, fHi, a, shape = 1.5) { for (let k = 0; k < n; k++) bubble(o, sr, at + Math.pow(Math.random(), shape) * len, rnd(fLo, fHi), rnd(.006, .018), a * rnd(.3, 1), rnd(.3, 1)); }
  // A voice source: glottal pulses with jitter, shimmer and period doubling, a spectral tilt, breath and an envelope.
  function glot(sr, len, f0, o = {}) {
    const x = arr(sr, len), jit = o.jit || 0, sh = o.shim || 0; let t = 0, k = 0;
    while (t < len) { x[Math.floor(t * sr)] += (1 + rnd(-sh, sh)) * (o.sub && k & 1 ? 1 - o.sub : 1); t += (1 + rnd(-jit, jit)) / f0(t, t / len); k++; }
    const c = Math.exp(-TAU * (o.tilt || 800) / sr); let a = 0, b = 0;
    for (let i = 0; i < x.length; i++) { a = x[i] * (1 - c) + a * c; b = a * (1 - c) + b * c; x[i] = b; }
    biq(x, 'hp', o.hp || 80, .7, sr); let e = 0; for (let i = 0; i < x.length; i++) e += x[i] * x[i]; const kk = 1 / Math.sqrt(e / x.length || 1);
    for (let i = 0; i < x.length; i++) { const t = i / sr; x[i] = (x[i] * kk + (Math.random() * 2 - 1) * (o.breath || 0)) * (o.env ? o.env(t, t / len) : 1); }
    return x;
  }
  function fmt(x, sr, F) {   // formants: parallel resonances [f (Hz or fn(t, u)), q, gain]
    const n = x.length, out = new Float32Array(n);
    for (const [f, q, g] of F) { const y = svf(x.slice(), typeof f === 'function' ? i => f(i / sr, i / n) : f, q, sr, 'bp'); for (let i = 0; i < n; i++) out[i] += y[i] * g / q; }
    return out;
  }
  const sat = (x, d) => { const k = Math.tanh(d); for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * d) / k; return x; };
  function stereo(x, sr, p0, p1, wid = 0) {   // pans a mono sound from p0 to p1 across its length; wid: a short delay on the right for width
    const n = x.length, L = new Float32Array(n), R = new Float32Array(n), d = Math.floor(wid * sr);
    for (let i = 0; i < n; i++) { const p = (p0 + (p1 - p0) * i / n + 1) * Math.PI / 4; L[i] = x[i] * Math.cos(p); R[i] = (i >= d ? x[i - d] : 0) * Math.sin(p); }
    return [L, R];
  }
  function normS(ch, peak = .9) { let m = 0; for (const x of ch) for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (v > m) m = v; } if (m) for (const x of ch) for (let i = 0; i < x.length; i++) x[i] *= peak / m; return ch; }
  const fin = (o, sr, pk = .9, f = .02) => norm(fade(o, sr, f), pk);
  function loopify(x, sr, xf) { const n = Math.floor(xf * sr), m = x.length - n, y = x.slice(0, m); for (let i = 0; i < n; i++) { const k = i / n; y[i] = x[i] * Math.sqrt(k) + x[m + i] * Math.sqrt(1 - k); } return y; }
  const noteHz = n => mtof(midi(n));

  // ---- Voices: a heron, a babbling teacher
  // The grey heron's call: a harsh, croaking 'fraank' — rough glottal pulses (jitter, period doubling),
  // a rattling 'fr' onset, an open nasal 'aa' and a closing 'nk', driven into a little saturation.
  function heronCry(sr, o) {
    const len = o.len, [fa, fb] = o.f0;
    const x = glot(sr, len, (t, u) => fa * Math.pow(fb / fa, u) * (1 + .03 * Math.sin(TAU * 6 * t)), { jit: o.jit ?? .12, shim: .45, sub: o.sub ?? .5, tilt: 1600, breath: o.breath ?? .42, hp: 140,
      env: (t, u) => Math.min(1, t / .02) * (u > .78 ? Math.pow((1 - u) / .22, 1.3) : 1) * (t < .08 ? .5 + .5 * Math.abs(Math.sin(TAU * 16 * t)) : 1) });
    const y = fmt(x, sr, [[(t, u) => 520 + 420 * Math.min(1, t / .07) - (u > .8 ? 380 * (u - .8) / .2 : 0), 2.4, 1.1], [t => 1200 + 300 * Math.min(1, t / .09), 3.2, 1], [2450, 4, .75], [3500, 5, .4], [5200, 3, .12]]);
    sat(norm(y, 1), o.sat ?? 2.4);
    return fin(biq(y, 'hp', 220, .7, sr), sr, .9, .025);
  }
  // A syllable of 'babble' for the teachers' dialogue: a glottal voice through the formants of one of
  // five vowels (scaled by the creature's size: a high voice has a small mouth), sometimes with a
  // plosive or a nasal onset, and an intonation that rises or falls.
  const VOWELS = [[800, 1250, 2600], [480, 1850, 2600], [320, 2300, 3100], [520, 880, 2450], [360, 760, 2350]];
  function syllable(sr, k, voz) {
    const V = VOWELS[k % 5], cons = Math.floor(k / 5) % 3, size = clamp(Math.pow(voz / 210, .42), .78, 1.6), old = voz < 140, len = old ? .1 : .085, v0 = cons === 1 ? .012 : 0;
    const dir = rnd(-1, 1), o = arr(sr, len + .02);
    const x = glot(sr, len - v0, (t, u) => voz * (1 + dir * .14 * u) * (1 + .1 * Math.exp(-t / .015)), { jit: old ? .05 : .012, shim: old ? .25 : .08, tilt: 700 * size, breath: old ? .35 : .15, hp: Math.min(voz * .8, 200),
      env: (t, u) => Math.min(1, t / .008) * Math.min(1, (1 - u) / .35) });
    const F = V.map((f, i) => [cons === 2 && i === 0 ? (t => (t < .022 ? 280 : f) * size) : f * size, [5, 8, 10][i], [1, .7, .35][i]]);
    const y = fmt(x, sr, F), s = Math.floor(v0 * sr);
    if (cons === 2) for (let i = 0; i < y.length && i < .022 * sr; i++) y[i] *= .45;
    for (let i = 0; i < y.length && s + i < o.length; i++) o[s + i] += y[i];
    if (cons === 1) nb(o, sr, 0, .014, rnd(2200, 4200) * Math.min(size, 1.3), 1.2, 'bp', .9, expEnv(.001, .004));
    return fin(o, sr, .85, .012);
  }

  // ---- The effects, rendered: v variants each (gen(sr, k, p): k the variant, p a parameter when the key carries one)
  const FX = {
    // Nila
    step: { v: 6, vol: .13, jit: .07, gen(sr) { const o = arr(sr, .16); tone(o, sr, 0, rnd(150, 200), rnd(75, 95), .012, .7, .02); nb(o, sr, .002, .07, rnd(900, 1700), .9, 'bp', 1.1, expEnv(.002, .013));
      if (Math.random() < .6) nb(o, sr, .004, .03, 4200, .8, 'hp', .25, expEnv(.001, .006)); if (Math.random() < .45) bubble(o, sr, rnd(.01, .03), rnd(450, 800), .012, .25); return fin(biq(o, 'lp', 5500, .7, sr), sr); } },
    jump: { v: 4, vol: .3, jit: .05, gen(sr) { const o = arr(sr, .3), f = rnd(.85, 1.15);
      nb(o, sr, 0, .2, (t, u) => (500 + 2400 * Math.pow(u, .7)) * f, 1.3, 'bp', 1, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .45)), 2));
      tone(o, sr, 0, 140, 85, .02, .45, .03); nb(o, sr, 0, .03, 1300, 1, 'bp', .45, expEnv(.001, .008)); tone(o, sr, .01, 300 * f, 620 * f, .035, .12, .05, .01); return fin(o, sr); } },
    land: { v: 4, vol: .5, jit: .05, gen(sr) { const o = arr(sr, .4); tone(o, sr, 0, 125, 46, .025, 1, .07); nb(o, sr, 0, .22, t => 2400 * Math.exp(-t / .045) + 280, .7, 'lp', .75, expEnv(.001, .05));
      grains(o, sr, .01, .18, 7, 1800, 5000, .12, .02); nb(o, sr, .008, .09, 850, 1, 'bp', .35, expEnv(.004, .02)); if (Math.random() < .5) bubble(o, sr, .03, rnd(350, 600), .02, .2); return fin(o, sr); } },
    flap: { v: 4, vol: .4, jit: .06, gen(sr) { const o = arr(sr, .32);
      nb(o, sr, 0, .17, (t, u) => 600 + 1500 * Math.sin(Math.PI * u), 1.2, 'bp', 1, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .6)), 2) * (.75 + .25 * Math.sin(TAU * 34 * t)));
      tone(o, sr, .04, 120, 70, .03, .5, .05, .008); nb(o, sr, .05, .12, 3200, .8, 'bp', .3, (t, u) => (1 - u) * Math.abs(Math.sin(TAU * 28 * t))); return fin(o, sr); } },
    whoosh: { v: 3, vol: .26, jit: .06, gen(sr) { const len = rnd(.32, .45), o = arr(sr, len + .05), f = rnd(.8, 1.2), p = Math.random() < .5 ? -1 : 1;
      nb(o, sr, 0, len, (t, u) => (320 + 2000 * Math.pow(Math.sin(Math.PI * u), 1.6)) * f, 1.5, 'bp', 1, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .7)), 2));
      nb(o, sr, 0, len, 4000, .7, 'hp', .12, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .75)), 3)); return normS(stereo(o, sr, -.5 * p, .5 * p)); } },
    hurt: { v: 3, vol: .45, jit: .04, gen(sr) { const o = arr(sr, .45), f = rnd(.95, 1.08);
      knock(o, sr, 0, 330, .6, .05, [[1, 1], [2.2, .5], [3.9, .25]]); tone(o, sr, 0, 420, 170, .05, .5, .08);
      const v = glot(sr, .22, (t, u) => 560 * f * (1 - .32 * u), { jit: .02, shim: .1, tilt: 1200, breath: .2, hp: 200, env: (t, u) => Math.min(1, t / .01) * Math.pow(1 - u, 1.2) });
      const y = fmt(v, sr, [[t => 1050 - 300 * Math.min(1, t / .2), 5, 1], [1650, 8, .7], [3100, 10, .35]]), s = Math.floor(.02 * sr); for (let i = 0; i < y.length; i++) o[s + i] += y[i] * .9;
      return fin(o, sr); } },
    death: { v: 1, vol: .3, gen(sr) { const o = arr(sr, 1.6); let ph = 0;   // a slide whistle falling, and a plop
      for (let i = 0, n = Math.floor(1.0 * sr); i < n; i++) { const t = i / sr, u = t / 1, f = 1250 * Math.pow(.27, Math.pow(u, 1.25)) * (1 + .022 * Math.sin(TAU * 6.5 * t)); ph += TAU * f / sr; o[i] += (Math.sin(ph) + .08 * Math.sin(2 * ph)) * .5 * Math.min(1, t / .03) * (u > .85 ? (1 - u) / .15 : 1); }
      nb(o, sr, 0, 1, (t, u) => 1250 * Math.pow(.27, Math.pow(u, 1.25)), 3, 'bp', .6, hump(1, .3));
      tone(o, sr, 1.02, 380, 140, .04, .5, .09); bubble(o, sr, 1.05, 260, .05, .5, .8); bubble(o, sr, 1.16, 330, .04, .3, .8); drops(o, sr, 1.02, .25, 6, 900, 2400, .08); return fin(o, sr); } },
    // Bigotes: gulps, spits, blows
    glup: { v: 4, vol: .45, jit: .04, gen(sr) { const o = arr(sr, .4);
      nb(o, sr, 0, .014, 1900, 1.2, 'bp', .7, expEnv(.0005, .004)); tone(o, sr, .004, rnd(480, 560), rnd(170, 200), .022, 1, .045, .002, .15);
      bubble(o, sr, .075, rnd(210, 250), .055, .85, .65); nb(o, sr, .07, .12, 700, 1.5, 'bp', .35, expEnv(.005, .03)); bubble(o, sr, rnd(.12, .16), rnd(500, 700), .02, .2, .8); return fin(biq(o, 'lp', 3800, .7, sr), sr); } },
    belly: { v: 2, vol: .5, gen(sr) { const o = arr(sr, .35); tone(o, sr, 0, 90, 48, .04, 1, .09, .006); nb(o, sr, 0, .2, 220, 1, 'lp', .4, expEnv(.01, .06)); bubble(o, sr, .09, rnd(110, 150), .07, .35, .5); return fin(o, sr); } },
    spit: { v: 4, vol: 1.6, jit: .05, gen(sr) { const o = arr(sr, .32);
      nb(o, sr, 0, .005, 3000, .8, 'hp', .9, expEnv(.0003, .0012)); tone(o, sr, 0, 160, 90, .02, .45, .025);
      nb(o, sr, .004, .15, (t, u) => 3200 - 1800 * u, .9, 'bp', 1.1, expEnv(.003, .035)); tone(o, sr, .006, rnd(950, 1100), rnd(320, 380), .03, .28, .045, .003); drops(o, sr, .02, .14, 7, 1400, 3600, .18); return fin(o, sr); } },
    bigspit: { v: 3, vol: .95, jit: .04, gen(sr) { const o = arr(sr, .75);
      nb(o, sr, 0, .006, 2500, .8, 'hp', 1, expEnv(.0003, .0015)); tone(o, sr, 0, 160, 42, .06, 1, .12, .002);
      nb(o, sr, .003, .45, t => 700 + 3200 * Math.exp(-t / .07), .8, 'bp', 1.3, expEnv(.003, .1)); nb(o, sr, .003, .15, 260, 3, 'bp', .6, expEnv(.002, .05));
      tone(o, sr, .01, 700, 230, .05, .3, .07, .004); drops(o, sr, .05, .45, 16, 1100, 3800, .2); return fin(o, sr); } },
    blub: { v: 4, vol: .32, jit: .05, gen(sr) { const o = arr(sr, .35); let t = 0; for (let k = 0; k < 2 + (Math.random() * 2 | 0); k++) { bubble(o, sr, t, rnd(230, 420) * (1 + k * .15), rnd(.025, .04), 1 - k * .2, .7); t += rnd(.05, .09); } return fin(o, sr); } },
    sputter: { v: 6, vol: .26, jit: .06, gen(sr) { const o = arr(sr, .22); let t = 0; for (let k = 0; k < 3 + (Math.random() * 3 | 0); k++) { nb(o, sr, t, .018, rnd(1800, 3200), 1, 'bp', .6, expEnv(.001, .005)); bubble(o, sr, t + .003, rnd(500, 1100), .012, .5, .8); t += rnd(.02, .045); }
      nb(o, sr, 0, .15, 500, 2, 'bp', .25, hump(1, .5)); return fin(o, sr); } },
    puff: { v: 3, vol: .8, jit: .06, gen(sr) { const o = arr(sr, .25); nb(o, sr, 0, .004, 2400, 1, 'bp', .8, expEnv(.0003, .001)); nb(o, sr, .002, .2, t => 2200 - 900 * t / .2, .8, 'bp', 1, expEnv(.006, .045)); nb(o, sr, .002, .15, 700, 1, 'bp', .35, expEnv(.008, .03)); return fin(o, sr); } },
    inhale: { v: 2, vol: .3, gen(sr) { const len = .32, o = arr(sr, len + .02);
      nb(o, sr, 0, len, (t, u) => 600 + 1800 * u * u, 1.1, 'bp', 1, (t, u) => Math.pow(u, 1.6) * (u > .94 ? (1 - u) / .06 : 1)); nb(o, sr, 0, len, (t, u) => 380 + 400 * u, 3, 'bp', .45, (t, u) => Math.pow(u, 2) * (u > .94 ? (1 - u) / .06 : 1)); return fin(o, sr, .9, .005); } },
    gust: { v: 2, vol: .55, hz: 22050, jit: .05, gen(sr) { const len = .75, n = Math.floor(len * sr), m = rnd(0, 6), turb = (t) => .7 + .18 * Math.sin(TAU * 9 * t + m) + .12 * Math.sin(TAU * 23 * t + 2 * m);
      const mk = () => { const o = arr(sr, len); nb(o, sr, 0, len, (t, u) => 900 + 700 * Math.sin(Math.PI * Math.min(1, u * 1.6)), .9, 'bp', 1, (t, u) => expEnv(.015, .22)(t) * turb(t)); nb(o, sr, 0, len, 320, 2, 'bp', .7, (t) => expEnv(.02, .18)(t) * turb(t + .05)); nb(o, sr, 0, len, 4500, .7, 'hp', .12, expEnv(.005, .1)); return o; };
      const L = mk(), R = mk(); tone(L, sr, 0, 110, 60, .05, .35, .12, .01); tone(R, sr, 0, 110, 60, .05, .35, .12, .01); return normS([fade(L, sr), fade(R, sr)]); } },
    pop: { v: 6, vol: .9, jit: .08, gen(sr) { const o = arr(sr, .22), f = rnd(650, 1300);
      nb(o, sr, 0, .003, 5000, .8, 'hp', .8, expEnv(.0002, .0008)); bubble(o, sr, .001, f, .028, 1, .9); tone(o, sr, 0, 260, 150, .02, .35, .025); drops(o, sr, .01, .08, 4, 2200, 4800, .15); return fin(o, sr); } },
    thud: { v: 5, vol: .5, jit: .08, gen(sr) { const o = arr(sr, .3);
      tone(o, sr, 0, rnd(100, 130), rnd(50, 60), .02, 1, .065); knock(o, sr, 0, rnd(260, 380), .35, .045, [[1, 1], [2.3, .4]]); nb(o, sr, 0, .12, t => 1300 * Math.exp(-t / .03) + 250, .7, 'lp', .6, expEnv(.001, .03));
      if (Math.random() < .5) grains(o, sr, .01, .12, 5, 1500, 4000, .08, .015); return fin(o, sr); } },
    hit: { v: 4, vol: 1.3, jit: .06, gen(sr) { const o = arr(sr, .3);
      nb(o, sr, 0, .006, 4000, .8, 'hp', 1, expEnv(.0002, .0015)); for (let k = 0; k < 4; k++) partial(o, sr, rnd(1700, 4600), rnd(.15, .35), rnd(.015, .045), .0003);
      tone(o, sr, 0, 240, 105, .015, .8, .04); grains(o, sr, .015, .2, 6, 1800, 5000, .15, .02); nb(o, sr, 0, .1, 1800, .8, 'bp', .35, expEnv(.001, .02)); return fin(o, sr); } },
    crack: { v: 2, vol: .7, hz: 22050, jit: .05, gen(sr) { const mk = () => { const o = arr(sr, 1.2); nb(o, sr, 0, .015, 1500, .7, 'hp', 1, expEnv(.0003, .003)); nb(o, sr, .002, .12, 1100, 1.2, 'bp', .7, expEnv(.001, .03));
        tone(o, sr, 0, 95, 38, .05, .9, .14, .002); grains(o, sr, .02, .9, 26, 1000, 5500, .22, .03, 2.2); grains(o, sr, .02, .6, 8, 350, 900, .25, .04, 2); nb(o, sr, .01, .8, 1600, .9, 'bp', .12, (t, u) => Math.pow(1 - u, 3)); return o; };
      return normS([fade(mk(), sr, .1), fade(mk(), sr, .1)]); } },
    clang: { v: 2, vol: .8, jit: .04, gen(sr) { const o = arr(sr, .9), f = rnd(470, 560);
      [[1, 1, .55], [2.32, .7, .4], [4.25, .5, .28], [6.63, .3, .16], [9.38, .2, .1]].forEach(([r, a, t]) => { partial(o, sr, f * r, a, t, .0004); partial(o, sr, f * r * 1.004, a * .5, t * .8, .0004); });
      nb(o, sr, 0, .005, 5000, .8, 'hp', .8, expEnv(.0002, .001)); tone(o, sr, 0, 220, 120, .02, .4, .03); return fin(o, sr, .9, .1); } },
    bounce: { v: 3, vol: .45, jit: .05, gen(sr) { const o = arr(sr, .55), f = rnd(.92, 1.08); let ph = 0, ph2 = 0;   // a rubbery 'boing'
      for (let i = 0; i < o.length; i++) { const t = i / sr, fr = (140 + 230 * (1 - Math.exp(-t / .05))) * f * (1 + .07 * Math.exp(-t / .2) * Math.sin(TAU * 15 * t)), e = Math.exp(-t / .16) * Math.min(1, t / .003); ph += TAU * fr / sr; ph2 += TAU * fr * 2.31 / sr; o[i] = (Math.sin(ph) + .2 * Math.sin(ph2) * Math.exp(-t / .05)) * e; }
      tone(o, sr, 0, 110, 60, .02, .5, .04); return fin(o, sr); } },
    switch: { v: 3, vol: .42, jit: .05, gen(sr) { const o = arr(sr, .28), f = rnd(.93, 1.07); knock(o, sr, 0, 1500 * f, .5, .012); knock(o, sr, .045, 700 * f, .8, .03); tone(o, sr, .045, 640 * f, 600 * f, .01, .35, .05); partial(o, sr, 2700 * f, .08, .08, .001, .05); return fin(o, sr); } },
    gate: { v: 1, vol: .4, hz: 22050, gen(sr) { const o = arr(sr, 1.7), x = arr(sr, 1.4); let t = 0;   // a stone slab grinding up, a creak, a thunk
      nb(o, sr, 0, 1.35, t => 300 + 140 * Math.sin(TAU * 1.3 * t), .8, 'lp', 2.4, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .5)), 1.5) * (.55 + .45 * Math.abs(Math.sin(TAU * (9 + 4 * Math.sin(TAU * .7 * t)) * t))));
      while (t < 1.2) { x[Math.floor(t * sr)] += Math.sin(Math.PI * t / 1.2); t += 1 / rnd(14, 34); }
      const c1 = biq(x.slice(), 'bp', 240, 9, sr), c2 = biq(x.slice(), 'bp', 620, 7, sr); for (let i = 0; i < x.length; i++) o[i + Math.floor(.1 * sr)] += (c1[i] + c2[i] * .6) * 2;
      tone(o, sr, 1.32, 110, 48, .03, 1, .1); knock(o, sr, 1.32, 260, .5, .06); grains(o, sr, 1.33, .3, 8, 1500, 4000, .15, .02); return fin(o, sr, .9, .1); } },
    // Critters
    frog: { v: 3, vol: .55, jit: .05, gen(sr) { const o = arr(sr, .4), r = frog(sr, 'ribbit'); o.set(r.subarray(0, Math.min(r.length, o.length))); nb(o, sr, 0, .08, 900, 1, 'bp', .3, expEnv(.005, .02)); return fin(o, sr); } },
    croak: { v: 3, vol: .55, jit: .05, gen(sr) { return fin(frog(sr, 'croac'), sr); } },
    buzz: { v: 2, vol: .16, jit: .05, gen(sr) { const len = .9, x = glot(sr, len, (t, u) => 560 * (1 + .05 * Math.cos(Math.PI * u)) * (1 + .03 * Math.sin(TAU * 7 * t)), { tilt: 5000, hp: 300, env: (t, u) => Math.pow(Math.sin(Math.PI * u), 1.5) });
      return fin(fmt(x, sr, [[1100, 2, 1], [2600, 3, .8], [4400, 3, .4]]), sr); } },
    stun: { v: 1, vol: .3, gen(sr) { const L = arr(sr, 1), R = arr(sr, 1); knock(L, sr, 0, 380, .6, .04); knock(R, sr, 0, 380, .6, .04);   // a bonk and birdies circling
      for (let k = 0; k < 6; k++) { const at = .08 + k * .13, f = rnd(2500, 3300), s = (1 + Math.cos(k * 1.9)) / 2; const b = arr(sr, .14); sweep(b, sr, f, f * 1.35, .05, .5, .03, 0, .1); for (let i = 0; i < b.length; i++) { const j = i + Math.floor(at * sr); if (j < L.length) { L[j] += b[i] * (1 - s); R[j] += b[i] * s; } } }
      return normS([fade(L, sr), fade(R, sr)]); } },
    // Impacts of the world
    splash: { v: 3, vol: 1.3, jit: .06, gen(sr) { const o = arr(sr, .9);
      bubble(o, sr, 0, rnd(250, 380), .03, .9, 1.2); nb(o, sr, 0, .6, t => 3800 * Math.exp(-t / .1) + 450, .7, 'lp', 1, (t) => Math.min(1, t / .004) * Math.exp(-t / .12));
      nb(o, sr, .01, .5, 3000, .8, 'bp', .35, (t) => Math.exp(-t / .1)); drops(o, sr, .05, .6, 14, 700, 2400, .25, 1.2); drops(o, sr, .15, .55, 8, 1500, 3500, .12); return fin(o, sr, .9, .1); } },
    hiss: { v: 2, vol: .45, gen(sr) { const o = arr(sr, 1);
      nb(o, sr, 0, .9, (t, u) => 7000 - 4200 * u, .7, 'bp', 1, (t, u) => Math.min(1, t / .02) * Math.pow(1 - u, 1.4)); grains(o, sr, .02, .75, 70, 2500, 7500, .2, .005, 1.3); bubble(o, sr, 0, 320, .03, .5); drops(o, sr, 0, .12, 5, 700, 1800, .2); return fin(o, sr, .9, .05); } },
    thunder: { v: 1, vol: .8, hz: 22050, gen(sr) { const len = rnd(4, 5), o = arr(sr, len), bumps = [[0, .02, .5, 1]]; for (let k = 0; k < 3 + (Math.random() * 3 | 0); k++) bumps.push([rnd(.1, len * .45), rnd(.08, .4), rnd(.6, 1.8), rnd(.35, .9)]);
      nb(o, sr, 0, len, (t, u) => 90 + 220 * Math.abs(Math.sin(TAU * .8 * t)) * (1 - u), .7, 'lp', .9, t => { let e = 0; for (const [s0, a, d, g] of bumps) if (t > s0) e += g * (t < s0 + a ? (t - s0) / a : Math.exp(-(t - s0 - a) / d)); return e; });
      nb(o, sr, 0, .02, 1200, .7, 'hp', 1, expEnv(.0005, .005)); nb(o, sr, .002, .5, t => 2500 * Math.exp(-t / .06) + 200, .7, 'lp', 1, expEnv(.002, .12)); grains(o, sr, .005, .25, 30, 800, 4000, .2, .01, 1.5); tone(o, sr, 0, 70, 35, .1, .7, .4, .01);
      return fin(o, sr, .9, .5); } },
    rumble: { v: 1, vol: .45, hz: 22050, gen(sr) { const o = arr(sr, 1.6);
      nb(o, sr, 0, 1.5, t => 90 + 110 * Math.exp(-t / .3), .8, 'lp', 1.4, (t, u) => Math.min(1, t / .01) * Math.pow(1 - u, 1.4) * (.6 + .4 * Math.sin(TAU * 11 * t))); tone(o, sr, 0, 60, 38, .1, .8, .35, .01);
      grains(o, sr, .05, 1.1, 20, 900, 4000, .08, .02, 1.6); grains(o, sr, .05, .9, 8, 250, 600, .15, .04, 1.6); return normS(stereo(fade(o, sr, .2), sr, 0, 0, .011)); } },
    whistle: { v: 2, vol: .17, gen(sr) { const len = .7, o = arr(sr, len + .02); let ph = 0;   // a rock whistling down
      for (let i = 0, n = Math.floor(len * sr); i < n; i++) { const t = i / sr, u = t / len, f = 1800 - 1150 * Math.pow(u, 1.3); ph += TAU * f * (1 + .006 * Math.sin(TAU * 11 * t)) / sr; o[i] += Math.sin(ph) * (.2 + .8 * Math.pow(u, 1.5)) * (u > .96 ? (1 - u) / .04 : 1); }
      nb(o, sr, 0, len, (t, u) => 1800 - 1150 * Math.pow(u, 1.3), 4, 'bp', 1.5, (t, u) => (.2 + .8 * Math.pow(u, 1.5)) * (u > .96 ? (1 - u) / .04 : 1)); return fin(o, sr, .9, .005); } },
    chirp: { v: 3, vol: .13, gen(sr) { const o = arr(sr, .5), base = rnd(2600, 4200); let t = 0;
      for (let i = 0, n = 2 + (Math.random() * 3 | 0); i < n; i++) { const f = base * rnd(.85, 1.2), k = Math.random(); if (k < .4) sweep(o, sr, f * .8, f * 1.3, .05, .7, .02, t, .15); else if (k < .7) sweep(o, sr, f * 1.3, f * .75, .06, .7, .02, t, .15); else for (let j = 0; j < 4; j++) sweep(o, sr, f * 1.1, f * .95, .016, .45, .01, t + j * .026); t += rnd(.08, .15); }
      return fin(o, sr, .8); } },
    // The heron
    heron: { v: 3, vol: .55, jit: .04, gen(sr) { return heronCry(sr, { len: rnd(.42, .55), f0: [rnd(290, 320), rnd(225, 250)] }); } },
    shriekBig: { v: 2, vol: .6, jit: .03, gen(sr) { const a = heronCry(sr, { len: .72, f0: [440, 300], sat: 3.2, breath: .7, jit: .15 }), b = heronCry(sr, { len: .26, f0: [400, 340], sat: 3, breath: .7 }), o = arr(sr, 1.2);
      o.set(a); const s = Math.floor(.8 * sr); for (let i = 0; i < b.length && s + i < o.length; i++) o[s + i] += b[i] * .7; nb(o, sr, 0, .9, 2600, 1.5, 'bp', .15, hump(1, .4)); return fin(o, sr); } },
    shriek: { v: 2, vol: .5, jit: .04, gen(sr) { return heronCry(sr, { len: .5, f0: [400, 310], sat: 2.8, breath: .6 }); } },
    heronHit: { v: 3, vol: .6, jit: .04, gen(sr) { const o = arr(sr, .6), q = heronCry(sr, { len: .2, f0: [560, 430], sat: 3, jit: .08 }); for (let i = 0; i < q.length; i++) o[i + Math.floor(.015 * sr)] += q[i] * .8;
      tone(o, sr, 0, 150, 60, .03, .9, .07); nb(o, sr, 0, .1, 1500, .8, 'lp', .5, expEnv(.001, .02)); for (let k = 0; k < 7; k++) nb(o, sr, .04 + k * rnd(.025, .04), .03, rnd(2500, 4200), .8, 'bp', .25 * (1 - k / 8), hump(1)); return fin(o, sr); } },
    swoop: { v: 2, vol: .5, hz: 22050, gen(sr) { const len = .95, o = arr(sr, len + .05), p = Math.random() < .5 ? -1 : 1;
      nb(o, sr, 0, len, (t, u) => 240 + 1500 * Math.pow(Math.sin(Math.PI * Math.pow(u, .8)), 2), 1.3, 'bp', 1, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .8)), 2) * (.7 + .3 * Math.sin(TAU * 4.5 * t)));
      nb(o, sr, 0, len, 180, 1, 'lp', .6, (t, u) => Math.pow(Math.sin(Math.PI * u), 2) * Math.pow(Math.abs(Math.sin(TAU * 2.2 * t)), 3)); return normS(stereo(o, sr, -.7 * p, .7 * p, .008)); } },
    gustWind: { v: 1, vol: .55, hz: 22050, gen(sr) { const len = 2, mk = ph => { const o = arr(sr, len);
        nb(o, sr, 0, len, (t, u) => 380 + 1100 * Math.sin(Math.PI * Math.pow(u, .6)) + 150 * Math.sin(TAU * 1.7 * t + ph), 1.1, 'bp', 1, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .5)), 1.4) * (.65 + .35 * Math.sin(TAU * 2.3 * t + ph) * Math.sin(TAU * 5.1 * t)));
        nb(o, sr, 0, len, t => 600 - 380 * t / len, .8, 'lp', .7, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .5)), 2)); return fade(o, sr, .2); };
      return normS([mk(0), mk(2)]); } },
    ruffle: { v: 2, vol: .6, gen(sr) { const o = arr(sr, .5); let t = 0; for (let k = 0; k < 11; k++) { nb(o, sr, t, .035, rnd(2600, 4800), .9, 'bp', rnd(.5, 1) * (1 - k / 14), hump(1.5)); nb(o, sr, t, .03, 900, 1, 'bp', .25, hump(2)); t += rnd(.028, .042); } return fin(o, sr); } },
    feathers: { v: 2, vol: .45, gen(sr) { const o = arr(sr, .7);
      for (const at of [0, .13]) { nb(o, sr, at, .12, (t, u) => 500 + 1400 * Math.sin(Math.PI * u), 1.2, 'bp', 1, hump(2, .6)); tone(o, sr, at + .03, 110, 65, .03, .5, .05, .008); }
      let t = .2; for (let k = 0; k < 9; k++) { nb(o, sr, t, .03, rnd(2800, 5000), .9, 'bp', rnd(.3, .6) * (1 - k / 10), hump(1.5)); t += rnd(.03, .05); } return fin(o, sr); } },
    stab: { v: 2, vol: .5, gen(sr) { const o = arr(sr, .45);
      nb(o, sr, 0, .07, (t, u) => 800 + 2400 * u, 1.4, 'bp', .7, (t, u) => Math.pow(u, 2)); tone(o, sr, .07, 190, 65, .02, 1, .05); nb(o, sr, .07, .15, t => 1400 * Math.exp(-t / .03) + 250, .8, 'lp', .7, expEnv(.001, .04));
      bubble(o, sr, .09, rnd(170, 230), .04, .5, .5); nb(o, sr, .07, .005, 3000, .8, 'hp', .6, expEnv(.0002, .001)); return fin(o, sr); } },
    squelch: { v: 3, vol: .36, jit: .05, gen(sr) { const o = arr(sr, .65), len = rnd(.35, .5);
      nb(o, sr, 0, len, (t, u) => 280 + 700 * Math.sin(Math.PI * Math.pow(u, .7)), 3.5, 'bp', 1.2, (t, u) => Math.pow(Math.sin(Math.PI * Math.pow(u, .6)), 1.2) * (.6 + .4 * Math.sin(TAU * 13 * t)));
      for (let k = 0; k < 4; k++) bubble(o, sr, rnd(0, len * .8), rnd(140, 340), rnd(.03, .05), rnd(.3, .6), .5); tone(o, sr, len, 520, 260, .01, .5, .02); nb(o, sr, len, .005, 3000, .8, 'hp', .5, expEnv(.0002, .0012)); return fin(o, sr, .9, .05); } },
    bossDown: { v: 1, vol: .4, hz: 22050, gen(sr) { const o = arr(sr, 2.6), c = heronCry(sr, { len: 1.15, f0: [400, 150], sat: 2.6, sub: .6, breath: .6, jit: .16 }); for (let i = 0; i < c.length; i++) o[i] += c[i] * .75;
      const at = 1.05; tone(o, sr, at, 120, 40, .05, 1, .18, .002); nb(o, sr, at, .6, t => 2200 * Math.exp(-t / .06) + 250, .7, 'lp', .9, expEnv(.002, .12)); grains(o, sr, at + .02, .9, 22, 900, 4500, .2, .025, 2);
      for (let k = 0; k < 8; k++) nb(o, sr, at + .05 + k * rnd(.03, .05), .04, rnd(2500, 4500), .8, 'bp', .25 * (1 - k / 9), hump(1.5)); return normS(stereo(fade(o, sr, .3), sr, 0, 0, .012)); } },
    // The learning cinematic
    chomp: { v: 3, vol: 1.1, jit: .05, gen(sr) { const o = arr(sr, .3); knock(o, sr, 0, rnd(1900, 2300), .7, .01, [[1, 1], [1.7, .5]]); knock(o, sr, .028, rnd(1500, 1800), .9, .012, [[1, 1], [1.8, .4]]);
      grains(o, sr, .03, .12, 16, 900, 3500, .3, .006, 1.3); nb(o, sr, .028, .12, 1200, .8, 'lp', .5, expEnv(.002, .03)); tone(o, sr, .028, 170, 90, .02, .6, .035); return fin(o, sr); } },
    gulpBig: { v: 1, vol: .4, gen(sr) { const o = arr(sr, .95);
      nb(o, sr, 0, .02, 1400, 1.2, 'bp', .6, expEnv(.001, .006)); tone(o, sr, .01, 420, 125, .07, 1, .13, .004, .2); nb(o, sr, .02, .3, t => 900 - 500 * Math.min(1, t / .3), 3, 'bp', .6, hump(1, .5));
      tone(o, sr, .26, 85, 42, .05, .9, .14, .008); for (let k = 0; k < 5; k++) bubble(o, sr, .3 + k * rnd(.06, .1), rnd(110, 240), rnd(.04, .07), .35 * (1 - k / 6), .5); return fin(o, sr, .9, .1); } },
    heartbeat: { v: 1, vol: .38, gen(sr) { const o = arr(sr, .55); tone(o, sr, 0, 72, 42, .03, 1, .07, .006); nb(o, sr, 0, .05, 180, 1, 'lp', .4, expEnv(.003, .015)); tone(o, sr, .19, 64, 38, .03, .75, .07, .006); nb(o, sr, .19, .05, 160, 1, 'lp', .3, expEnv(.003, .015)); return fin(biq(o, 'lp', 320, .7, sr), sr); } },
    shing: { v: 1, vol: .5, gen(sr) { const mk = d => { const o = arr(sr, 1), f = 2350 * d; [[1, 1, .9], [1.5, .5, .6], [2.13, .45, .45], [2.76, .3, .35], [3.9, .2, .2]].forEach(([r, a, t]) => partial(o, sr, f * r, a, t, .004)); nb(o, sr, 0, .12, t => 4000 + 30000 * t, .8, 'hp', .35, (t, u) => (1 - u) * Math.min(1, t / .01)); return o; };
      const a = mk(1), b = mk(1.004); for (let i = 0; i < a.length; i++) a[i] += b[i]; return fin(a, sr, .9, .1); } },
    powerSwell: { v: 1, vol: .45, hz: 22050, gen(sr) { const len = 1.05, mk = det => { const o = arr(sr, len + .05); let p1 = 0, p2 = 0, p3 = 0;
        for (let i = 0, n = Math.floor(len * sr); i < n; i++) { const t = i / sr, u = t / len, f = 110 * Math.pow(4, Math.pow(u, 1.3)) * det, e = u * u * (u > .95 ? (1 - u) / .05 : 1); p1 += f / sr; p2 += f * 1.5 / sr; p3 += f * 2.01 / sr; o[i] = (sinT(p1) + .5 * sinT(p2) + .35 * sinT(p3)) * e * .35; }
        nb(o, sr, 0, len, (t, u) => 300 + 5000 * u * u, 1.2, 'bp', 1, (t, u) => Math.pow(u, 2) * (u > .95 ? (1 - u) / .05 : 1)); return o; };
      return normS([mk(1), mk(1.006)]); } },
    powerBoom: { v: 1, vol: .5, hz: 22050, gen(sr) { const mk = () => { const o = arr(sr, 1.4); tone(o, sr, 0, 90, 32, .08, 1, .3, .002); nb(o, sr, 0, .9, t => 6000 * Math.exp(-t / .12) + 250, .7, 'lp', 1, expEnv(.002, .22));
        for (let k = 0; k < 24; k++) partial(o, sr, rnd(2500, 8000), rnd(.02, .07), rnd(.3, .9), .01, rnd(.02, .3)); return fade(o, sr, .2); }; return normS([mk(), mk()]); } },
    // UI and tallies
    select: { v: 2, vol: .75, jit: .01, gen(sr) { const o = arr(sr, .2); partial(o, sr, 880, 1, .09, .001); partial(o, sr, 880 * 3.93, .2, .03, .001); nb(o, sr, 0, .004, 3000, 1, 'bp', .35, expEnv(.0003, .001)); return fin(o, sr); } },
    text: { v: 4, vol: 1.1, jit: .06, gen(sr) { const o = arr(sr, .05); knock(o, sr, 0, rnd(2200, 3200), .7, .006, [[1, 1], [1.6, .4]]); return fin(o, sr, .9, .005); } },
    tick: { v: 2, vol: .16, jit: .004, gen(sr) { const o = arr(sr, .1); partial(o, sr, 1175, 1, .045, .0008); partial(o, sr, 1175 * 2.76, .25, .015, .0005); nb(o, sr, 0, .003, 4000, 1, 'bp', .3, expEnv(.0002, .0008)); return fin(o, sr); } },
    slam: { v: 3, vol: .45, jit: .05, gen(sr) { const o = arr(sr, .35); tone(o, sr, 0, 150, 70, .015, 1, .05); knock(o, sr, 0, rnd(420, 520), .6, .04); nb(o, sr, 0, .08, 900, .8, 'lp', .5, expEnv(.001, .02)); return fin(o, sr); } },
    stamp: { v: 2, vol: .7, jit: .04, gen(sr) { const o = arr(sr, .45); tone(o, sr, 0, 110, 45, .02, 1, .08); knock(o, sr, 0, 240, .6, .05, [[1, 1], [2.1, .4]]); nb(o, sr, 0, .15, t => 1200 * Math.exp(-t / .03) + 200, .7, 'lp', .7, expEnv(.001, .04)); nb(o, sr, .03, .12, 700, 2, 'bp', .2, hump(1)); return fin(o, sr); } },
    coins: { v: 2, vol: .2, gen(sr) { const o = arr(sr, .6); for (let k = 0; k < 7; k++) { const at = k * rnd(.02, .045), f = rnd(3000, 5200); partial(o, sr, f, rnd(.4, 1), rnd(.08, .2), .0005, at); partial(o, sr, f * 1.52, .3, .06, .0005, at); } nb(o, sr, 0, .005, 3500, 1, 'bp', .5, expEnv(.0002, .001)); return fin(o, sr); } },
    bloop: { v: 3, vol: .25, jit: .03, gen(sr) { const o = arr(sr, .4); bubble(o, sr, 0, 340, .04, 1, 1.1); nb(o, sr, 0, .2, t => 3000 * Math.exp(-t / .04) + 400, .8, 'lp', .35, expEnv(.002, .04)); drops(o, sr, .03, .2, 5, 1200, 3000, .15); return fin(o, sr); } },
    bubbles: { v: 3, vol: .3, gen(sr) { const o = arr(sr, .4); for (let k = 0; k < 6; k++) bubble(o, sr, k * rnd(.018, .03), 600 * Math.pow(1.2, k) * rnd(.9, 1.1), .02, .6, .8); return fin(o, sr); } },
    fire: { v: 2, vol: .45, gen(sr) { const o = arr(sr, .9);   // a wick catching: a soft 'fwomp' and crackle
      nb(o, sr, 0, .5, (t, u) => 300 + 2200 * Math.sin(Math.PI * Math.min(1, u * 1.5)), .8, 'lp', 1, (t, u) => Math.min(1, Math.pow(t / .07, 2)) * Math.exp(-Math.max(0, t - .07) / .12)); tone(o, sr, .03, 90, 60, .05, .4, .08, .02);
      grains(o, sr, .05, .75, 26, 1500, 6000, .25, .004, 1.4); return fin(o, sr, .9, .1); } },
    suckStep: { v: 2, vol: .3, gen(sr) { const o = arr(sr, .3); nb(o, sr, 0, .22, (t, u) => 500 + 3000 * u * u, 2.2, 'bp', 1, (t, u) => Math.pow(u, 1.2) * (u > .9 ? (1 - u) / .1 : 1)); bubble(o, sr, .2, 700, .02, .4, 1); return fin(o, sr, .9, .01); } },
    // The loops
    jetLoop: { v: 1, hz: 22050, gen(sr) { const len = 2.6, mk = () => { const o = arr(sr, len), m = [rnd(0, 6), rnd(0, 6)];
        nb(o, sr, 0, len, t => 2800 + 800 * Math.sin(TAU * 1.3 * t + m[0]), .6, 'bp', 1, t => .7 + .15 * Math.sin(TAU * 7.3 * t + m[1]) + .15 * Math.sin(TAU * 13.1 * t));
        nb(o, sr, 0, len, 420, 2, 'bp', .9, t => .5 + .5 * Math.abs(Math.sin(TAU * 4.7 * t + m[0]))); nb(o, sr, 0, len, 7000, .7, 'hp', .15);
        for (let k = 0; k < 260; k++) bubble(o, sr, rnd(0, len - .05), rnd(900, 4200), rnd(.004, .01), rnd(.04, .14), .6); return loopify(o, sr, .3); };
      const L = mk(), h = L.length >> 1, R = new Float32Array(L.length); R.set(L.subarray(h)); R.set(L.subarray(0, h), L.length - h); return normS([L, R], .8); } } };

  // ---- Playing them
  let FXO = {};   // options of the effect being played ({ pan })
  const FXLAST = {}, LIM = { step: .05, text: .03, talk: .07, tick: .033, pop: .025, thud: .03, hit: .03, splash: .05, sputter: .06, whoosh: .05, land: .06, blub: .05, clang: .05, select: .02, bloop: .03, slam: .03, flap: .04, spit: .03, glup: .04 };
  function fxRoute(n, pan, rev) { let d = n; if (pan) { const p = panner(ctx, pan); n.connect(p); d = p; } d.connect(sfxBus); if (rev) d.connect(gainNode(ctx, rev, M.sfxWet)); }
  function shot(name, o = {}) {
    const D = FX[name], k = (Math.random() * (D.v || 1)) | 0, buf = bufOf(ctx, 'fx:' + name + (o.key ?? '') + ':' + k, sr => D.gen(sr, k, o.p), fxRate(D));
    const src = ctx.createBufferSource(), j = o.jit ?? D.jit ?? .03; src.buffer = buf; src.playbackRate.value = (o.rate || 1) * (1 + rnd(-j, j));
    const g = gainNode(ctx, (o.vol ?? D.vol ?? .5) * (o.k ?? 1) * rnd(.88, 1)); src.connect(g); fxRoute(g, o.pan ?? FXO.pan ?? 0, o.rev ?? D.rev ?? 0);
    src.start(ctx.currentTime + (o.at || 0)); return src;
  }
  // A note on an engine instrument, as part of an effect (the stingers are not placed in the scene).
  let NV = 1;   // a level for the notes of the effect being played (the big stingers turn it down a little)
  const nota = (inst, n, at, dur, vel, rev = .3) => tocar(inst, n, dur, vel * .85 * NV, { en: at, rev });
  const seq = (inst, notes, step, dur, vel, at = 0, rev) => notes.forEach((n, i) => n && nota(inst, n, at + i * step, dur, typeof vel === 'function' ? vel(i) : vel, rev));
  const DPENT = ['D', 'E', 'F#', 'A', 'B'], dpent = (k, oct) => DPENT[k % 5] + (oct + Math.floor(k / 5));   // D major pentatonic, climbing
  const sfx = {
    // ---- Nila
    step() { shot('step'); },
    jump() { shot('jump'); },
    land(k = 1) { k = clamp(k, 0, 1.5); shot('land', { k: .25 + .75 * k, rate: 1.12 - .2 * Math.min(1, k) }); },
    flap() { shot('flap'); },
    whoosh() { shot('whoosh'); },
    hurt() { shot('hurt'); },
    death() { shot('death', { rev: .15 }); nota('pizzicato', 'D3', 1.0, .3, .5); nota('pizzicato', 'A2', 1.22, .4, .58); },
    // ---- Bigotes. `w` is how heavy the load is (a mosquito .35, a rock 1, a crate 1.5): heavier is lower, longer, with a belly thump.
    glup(w = 1) { w = clamp(w, .2, 2.5); shot('glup', { rate: clamp(1.3 - .28 * w, .62, 1.25), k: .6 + .3 * Math.min(w, 1.5) }); if (w >= 1.1) shot('belly', { at: .06, k: .5 * Math.min(1, w - .8), rate: 1.1 - .1 * w }); },
    swallow(w) { sfx.glup(w); },
    spit(w = 1) { w = clamp(w, .2, 2.5); shot('spit', { rate: clamp(1.28 - .26 * w, .7, 1.25), k: .8 + .15 * Math.min(w, 1.5) }); if (w >= 1) shot('belly', { k: .3 * Math.min(1, w - .5), rate: 1.3 }); },
    bigspit(w = 1) { w = clamp(w, .2, 2.5); shot('bigspit', { rate: clamp(1.2 - .18 * w, .75, 1.15) }); },
    blub() { shot('blub'); },
    sputter() { shot('sputter'); },
    puff() { shot('puff'); },
    inhale() { shot('inhale'); },
    gust() { shot('gust'); },
    charge() {   // winding up: breath drawn in against a rising, straining tone
      shot('suckStep', { rate: .7, vol: .12 }); shot('charge', { vol: .11 });
    },
    charged() { shot('shing', { rate: 1.5, vol: .22 }); nota('kalimba', ['D6', 'A6'], 0, .4, .55, .35); nota('glock', 'D7', .05, .3, .3, .4); },
    suckup(lv = 2) { lv = clamp(lv | 0, 1, 3); shot('suckStep', { rate: [.8, 1, 1.25][lv - 1], vol: .16 + lv * .03 }); nota('kalimba', ['A5', 'D6', 'F#6'][lv - 1], .15, .3, .38 + lv * .04, .3); if (lv === 3) nota('glock', 'A6', .2, .3, .25, .4); },
    // ---- Impacts
    thud() { shot('thud'); },
    hit() { shot('hit'); },
    crack() { shot('crack'); },
    clang() { shot('clang', { rev: .08 }); },
    splash() { shot('splash'); },
    pop() { shot('pop'); },
    bounce() { shot('bounce'); },
    switch() { shot('switch'); },
    gate() { shot('gate', { rev: .1 }); },
    hiss() { shot('hiss'); },
    thunder() { shot('thunder', { rev: .25 }); },
    rumble() { shot('rumble'); },
    whistle() { shot('whistle'); },
    // ---- Critters
    frog() { shot('frog'); },
    croak() { shot('croak'); },
    buzz() { shot('buzz'); },
    stun() { shot('stun'); },
    chirp() { shot('chirp', { rev: .35 }); },
    // ---- The heron: a grey heron's harsh 'fraank', her wings, her beak in the mud
    heron() { shot('heron', { rev: .25 }); },
    shriek(k = 1) { if (k >= .8) shot('shriekBig', { rev: .3, k: Math.min(1.1, k) }); else shot('shriek', { rev: .25, k: .75 + .3 * k }); },
    heronHit() { shot('heronHit', { rev: .15 }); },
    swoop() { shot('swoop'); },
    gustWind() { shot('gustWind'); },
    ruffle() { shot('ruffle'); },
    feathers() { shot('feathers'); },
    stab() { shot('stab'); },
    squelch() { shot('squelch'); },
    bossDown() { shot('bossDown', { rev: .3 }); nota('timbal', 'E2', 1.05, 1.5, .7, .35); nota('cuerdas', ['E3', 'B3', 'G4'], 1.2, 1.6, .38, .45); nota('chelo', 'E3', 1.2, 1.8, .42, .4); },
    // ---- Pickups
    pearl() { shot('bubbles', { vol: .2 }); nota('kalimba', 'A5', .02, .3, .48, .3); nota('kalimba', 'D6', .09, .4, .52, .3); nota('glock', 'A6', .09, .3, .24, .4); },
    heart() { shot('blub', { vol: .2 }); seq('marimba', ['D5', 'F#5', 'A5', 'D6'], .055, .3, i => .45 + i * .05, 0, .25); nota('kalimba', 'D6', .165, .4, .32, .3); },
    lantern() { shot('fire'); seq('vibrafono', ['D5', 'A5', 'C#6', 'F#6'], .07, 1, .42, .12, .45); nota('glock', 'E7', .42, .4, .2, .5); },
    // ---- The learning cinematic
    chomp() { shot('chomp'); },
    gulpBig() { shot('gulpBig'); },
    heartbeat() { shot('heartbeat'); },
    shing() { shot('shing', { rev: .4 }); nota('glock', 'A6', 0, .5, .35, .5); },
    powerRise() { shot('powerSwell', { rev: .35, vol: .32 }); nota('tremolo', ['D3', 'A3', 'D4'], .25, .85, .4, .4); for (let i = 0; i < 9; i++) nota('timbal', 'D2', .2 + i * .09, .2, .2 + i * .05, .3); },
    powerBurst() { shot('powerBoom', { rev: .3 }); tocar('plato', null, 1, .6, { rev: .3 }); },
    learn() {   // a harp glissando up D lydian into a warm chord, flute and bells on top
      NV = .9;
      seq('arpa', ['D4', 'E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G#5', 'A5'], .03, .6, i => .45 + i * .03, 0, .45);
      nota('cuerdas', ['D4', 'F#4', 'A4', 'C#5', 'E5'], .3, 1.3, .55, .45); nota('fretless', 'D2', .3, 1.2, .6, .1);
      nota('flauta', 'F#5', .32, .2, .6, .4); nota('flauta', 'A5', .56, .9, .68, .4); nota('glock', 'A6', .45, .4, .35, .5); nota('glock', 'D7', .62, .6, .35, .5); },
    win() {   // the power is his: kalimba climbs, the flute answers
      seq('kalimba', ['D5', 'F#5', 'A5', 'D6'], .09, .4, .6, 0, .3); seq('marimba', ['D4', 'A4'], .18, .3, .5, 0, .2);
      nota('flauta', 'E6', .38, .14, .6, .4); nota('flauta', 'F#6', .54, .7, .7, .4); nota('arpa', ['D4', 'A4', 'F#5'], .54, 1, .55, .4); nota('glock', 'D7', .54, .5, .3, .5); },
    // ---- Stingers
    clear() {   // level or boss cleared: marimba and flute, pizzicato bass, a string chord and a triangle
      NV = .9;
      seq('marimba', ['A5', 'B5', 'D6', null, 'A5', 'D6'], .08, .25, .7, 0, .25); seq('xilofono', ['A6', 'B6', 'D7'], .08, .2, .35, 0, .25);
      seq('pizzicato', ['D3', null, 'A3', null, null, 'D3'], .08, .3, .8, 0, .2); tocar('bongo', null, .1, .5, { en: .24 }); tocar('bongo', null, .1, .7, { en: .32 });
      nota('flauta', 'D6', .4, .85, .72, .4); nota('cuerdas', ['F#4', 'A4', 'D5'], .4, 1.1, .5, .45); tocar('triangulo', null, 1, .6, { en: .4, rev: .4 }); },
    fanfare() {   // the level-end fanfare: a snare roll, a marimba run, a hit, a quick turn and the big chord
      NV = .88;
      for (let i = 0; i < 9; i++) tocar('caja', null, .1, .2 + i * .05, { en: i * .036 }); tocar('bombo', null, .2, .65, { en: .33 });
      seq('marimba', ['D5', 'E5', 'F#5', 'A5', 'B5'], .06, .2, i => .6 + i * .05, .33, .22); seq('xilofono', ['D6', 'E6', 'F#6', 'A6', 'B6'], .06, .15, .35, .33, .22);
      const h = .66; nota('trompa', ['D4', 'F#4', 'A4'], h, .36, .75); nota('cuerdas', ['D4', 'A4', 'D5', 'F#5'], h, .38, .6); nota('marimba', 'D6', h, .3, .8, .25); nota('contrabajo', 'D2', h, .35, .9, .1);
      tocar('bombo', null, .2, .65, { en: h }); tocar('plato', null, 1, .38, { en: h, rev: .3 });
      seq('flauta', ['B5', 'A5', 'B5'], .1, .09, .7, 1.1, .35); seq('marimba', ['B5', 'A5', 'B5'], .1, .1, .55, 1.1, .22); nota('pizzicato', 'G3', 1.12, .2, .8); nota('pizzicato', 'A3', 1.32, .2, .8);
      tocar('caja', null, .1, .42, { en: 1.12 }); tocar('caja', null, .1, .5, { en: 1.32 });
      const c = 1.44; nota('cuerdas', ['D4', 'F#4', 'A4', 'E5'], c, 1.25, .62, .45); nota('trompa', ['D4', 'A4'], c, 1.1, .7, .4); nota('flauta', 'D6', c, 1.05, .78, .4);
      nota('contrabajo', 'D2', c, 1.2, .85, .1); nota('timbal', 'D2', c, 1, .65, .3); tocar('bombo', null, .2, .7, { en: c }); tocar('plato', null, 1, .48, { en: c, rev: .35 });
      seq('glock', ['D6', 'F#6', 'A6', 'D7'], .06, .5, .4, c + .15, .45); },
    bell() { nota('campana', 'D5', 0, 3, .55, .5); nota('glock', 'D6', .01, 1, .22, .5); nota('coroU', ['D4', 'A4', 'F#5'], 0, 2.4, .35, .55); },
    // ---- UI and the tally
    select() { shot('select'); },
    confirm() { nota('marimba', 'D5', 0, .2, .45, .2); nota('marimba', 'A5', .07, .3, .55, .2); nota('kalimba', 'A5', .07, .3, .28, .25); },
    text() { shot('text'); },
    talk(p) { const v = Math.round(clamp(p || 200, 60, 900)); shot('talk', { key: v, p: v, vol: .17, jit: .04 }); },
    tick(k = 0) { const s = [0, 2, 4, 7, 9][k % 5] + 12 * Math.floor((k % 15) / 5); shot('tick', { rate: Math.pow(2, (s - 12) / 12) }); },
    slam(k = 0) { shot('slam'); nota('marimba', dpent(k, 4), 0, .2, .45, .2); },
    stamp(k = 0) { shot('stamp'); if (k) { seq('glock', ['D6', 'F#6', 'A6'], .06, .4, .4, .08, .45); tocar('triangulo', null, 1, .5, { en: .08, rev: .4 }); } },
    kaching() { shot('coins'); nota('glock', 'A6', 0, .2, .42, .4); nota('glock', 'D7', .07, .5, .5, .45); },
    bloop(k = 0) { shot('bloop', { rate: Math.pow(2, ([0, 2, 4, 7, 9][k % 5] + 12 * Math.floor((k % 10) / 5)) / 12) }); nota('kalimba', dpent(k % 10, 5), .02, .3, .45, .3); } };
  FX.talk = { v: 15, gen: (sr, k, voz) => syllable(sr, k, voz || 200) };
  FX.charge = { v: 2, vol: .3, gen(sr) { const len = .55, o = arr(sr, len + .03); let ph = 0, t = 0;   // a rubbery tension: a rising tone with a growing wobble, and a creak
    for (let i = 0, n = Math.floor(len * sr); i < n; i++) { const tt = i / sr, u = tt / len, f = 150 * Math.pow(3, u) * (1 + .04 * u * Math.sin(TAU * 9 * tt)); ph += TAU * f / sr; o[i] += (Math.sin(ph) + .3 * Math.sin(2 * ph)) * Math.pow(u, 1.2) * .5 * (u > .95 ? (1 - u) / .05 : 1); }
    const x = arr(sr, len); while (t < len) { x[Math.floor(t * sr)] += Math.pow(t / len, .5); t += 1 / (20 + 50 * t / len) * rnd(.9, 1.1); } const c = biq(x, 'bp', 900, 8, sr); for (let i = 0; i < c.length; i++) o[i] += c[i] * .5;
    return fin(o, sr, .9, .01); } };
  const SFX_ALIAS = {};
  function play(name, arg, o) {
    if (!ctx || muted) return; name = SFX_ALIAS[name] || name; const f = sfx[name]; if (!f) return;
    const t = ctx.currentTime, lim = LIM[name]; if (lim && t - (FXLAST[name] ?? -9) < lim) return; FXLAST[name] = t;
    FXO = {}; if (o) { if (typeof o.pan === 'number') FXO.pan = clamp(o.pan, -1, 1); else if (typeof o.x === 'number' && typeof Cam !== 'undefined' && typeof W !== 'undefined') FXO.pan = clamp((o.x - Cam.x - W / 2) / (W / 2), -1, 1) * .7; }
    try { f(arg ?? undefined); } catch (e) { PERF.fxErr = name + ': ' + (e && e.message || e); /* audio is never fatal */ } FXO = {}; NV = 1;
  }
  // The frequent effects are rendered in the idle time after init, so the first jump doesn't hitch.
  // The effects of play are rendered in the idle time after init, so no jump or gulp hitches; the rare ones
  // (the heron, the cinematics, the stingers) render when first played, in a few ms.
  const fxRate = D => D.hz && ctx.sampleRate > D.hz ? D.hz : 0;
  function warmFx() {
    const list = ['step', 'jump', 'land', 'thud', 'splash', 'pop', 'glup', 'spit', 'text', 'select', 'flap', 'whoosh', 'hit', 'blub', 'puff', 'sputter', 'belly', 'bigspit', 'charge', 'suckStep', 'inhale', 'gust', 'jetLoop', 'clang', 'crack', 'switch', 'bounce', 'hurt', 'bubbles', 'frog', 'croak', 'buzz'];
    for (const k of list) for (let v = 0; v < (FX[k].v || 1); v++) WARM.push([ctx, 'fx:' + k + ':' + v, sr => FX[k].gen(sr, v), fxRate(FX[k])]);
  }

  // The inhale (Bigotes sucking things in) is a looping breath of air: a wide band of noise, a
  // whistling resonance that flutters and a low roar. Each stage (suckLevel 1..3) pulls harder:
  // the air climbs, whistles louder, wobbles faster and, at the top, pulses like a vacuum.
  let suckNode = null, jetNode = null;
  const SUCK = [{ br: 1000, wh: 1050, whg: .6, ro: .1, lfo: 5.5, dep: 80, am: 0, g: .2 }, { br: 1500, wh: 1550, whg: 1, ro: .3, lfo: 8, dep: 160, am: .15, g: .25 }, { br: 2200, wh: 2250, whg: 1.5, ro: .6, lfo: 12, dep: 300, am: .35, g: .3 }];
  function suckLevel(lv) {
    if (!ctx || !suckNode) return; const n = suckNode, t = ctx.currentTime, S = SUCK[clamp(lv | 0, 1, 3) - 1];
    for (const [p, v] of [[n.br.frequency, S.br], [n.wh.frequency, S.wh], [n.whg.gain, S.whg], [n.rog.gain, S.ro], [n.lfo.frequency, S.lfo], [n.lg.gain, S.dep], [n.amg.gain, S.am], [n.g.gain, S.g]]) { p.cancelScheduledValues(t); p.setTargetAtTime(v, t, .07); }
  }
  function suck(on) {
    if (!ctx) return; const t = ctx.currentTime;
    if (on && !suckNode) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer; src.loop = true; src.playbackRate.value = rnd(.92, 1.08);
      const br = filt(ctx, 'bandpass', 500, 1.5), wh = filt(ctx, 'bandpass', 600, 11), ro = filt(ctx, 'lowpass', 280, .9), mix = gainNode(ctx, 1), am = gainNode(ctx, 1), g = gainNode(ctx, 0);
      krate(br.frequency); krate(wh.frequency);
      const brg = gainNode(ctx, 1), whg = gainNode(ctx, .6), rog = gainNode(ctx, .1);
      src.connect(br); br.connect(brg); brg.connect(mix); src.connect(wh); wh.connect(whg); whg.connect(mix); src.connect(ro); ro.connect(rog); rog.connect(mix); mix.connect(am); am.connect(g); fxRoute(g, 0, .08);
      const lfo = ctx.createOscillator(), lg = gainNode(ctx, 80), amg = gainNode(ctx, 0); lfo.frequency.value = 5.5; lfo.connect(lg); lg.connect(wh.frequency); lfo.connect(amg); amg.connect(am.gain);
      br.frequency.setValueAtTime(450, t); br.frequency.setTargetAtTime(SUCK[0].br, t, .35); wh.frequency.setValueAtTime(500, t); wh.frequency.setTargetAtTime(SUCK[0].wh, t, .35);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(SUCK[0].g, t + .14);
      src.start(t, rnd(0, 1.5)); lfo.start(t); suckNode = { src, g, lfo, lg, br, wh, whg, rog, amg };
    } else if (!on && suckNode) {
      const n = suckNode; suckNode = null; n.g.gain.cancelScheduledValues(t); n.g.gain.setTargetAtTime(0, t, .04); n.br.frequency.setTargetAtTime(700, t, .05); n.src.stop(t + .3); n.lfo.stop(t + .3);
    }
  }
  // The water jet (the hover): a looping spray — hiss, droplets, a churning gurgle — that spurts in.
  function jet(on) {
    if (!ctx) return; const t = ctx.currentTime;
    if (on && !jetNode) {
      const src = ctx.createBufferSource(); src.buffer = bufOf(ctx, 'fx:jetLoop:0', sr => FX.jetLoop.gen(sr), fxRate(FX.jetLoop)); src.loop = true; src.playbackRate.value = rnd(.95, 1.05);
      const g = gainNode(ctx, 0); src.connect(g); fxRoute(g, 0, .05);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.34, t + .03); g.gain.setTargetAtTime(.2, t + .05, .12);
      src.start(t, rnd(0, 2)); jetNode = { src, g };
    } else if (!on && jetNode) { const n = jetNode; jetNode = null; n.g.gain.cancelScheduledValues(t); n.g.gain.setTargetAtTime(0, t, .05); n.src.stop(t + .4); }
  }

  // ================================================================ Motor en vivo
  const music = { name: null, P: null }, ambS = { name: null, A: null, vol: 1 }, rainS = { on: false, A: null };
  let timer = null, tvSuspended = false;
  function init() {
    if (tvSuspended) return;
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    M = buildMixer(ctx); sfxBus = M.sfx; noiseBuffer = M.noise; warmFx();
    if (music.name) startSong(.05); if (ambS.name) startAmb(.5); if (rainS.on) rain(true);
    timer = setInterval(tick, 40);
  }
  const stats = { ticks: 0, ms: 0, max: 0 };
  function tick() {
    if (!M || tvSuspended) return; const t = ctx.currentTime, la = WIN.document && WIN.document.hidden ? 1.6 : .3, c0 = clock();
    if (music.P && !music.P.stopped) pump(music.P, t + la, t);
    if (ambS.A) ambPump(ambS.A, t + la); if (rainS.A) ambPump(rainS.A, t + la);
    warmUp(4);
    const d = clock() - c0; stats.ticks++; stats.ms += d; if (d > stats.max) stats.max = d;
  }
  function startSong(fadeIn) {
    const t = ctx.currentTime; if (music.P) release(music.P, t, 1.3); music.P = null;
    const song = SONGS[music.name]; if (!song) return;
    music.P = Player(M, song, music.name, t + .06, null, fadeIn);
    pump(music.P, t + .3, t);
  }
  function playMusic(name) { if (music.name === name) return; const had = !!music.P; music.name = name; if (ctx) startSong(had ? .9 : .05); }
  function stopMusic() { music.name = null; if (music.P && ctx) release(music.P, ctx.currentTime, 1); music.P = null; }
  function startAmb(fadeIn) { const t = ctx.currentTime; if (ambS.A) ambRelease(ambS.A, t, 2); ambS.A = null; if (AMBS[ambS.name]) { ambS.A = Amb(M, ambS.name, t + .05, ambS.vol, fadeIn); ambPump(ambS.A, t + .3); } }
  // Sound.ambiente('atardecer' | 'dusk' ..., { vol }) crossfades to that place's bed; null silences it.
  function ambiente(name, o = {}) {
    name = name ? AMB_ALIAS[name] || name : null; const vol = o.vol ?? 1;
    if (name === ambS.name) { if (ambS.A && vol !== ambS.vol && ctx) { ambS.vol = vol; [ambS.A.out, ambS.A.wet].forEach(g => g.gain.setTargetAtTime(vol, ctx.currentTime, .8)); } return; }
    ambS.name = name; ambS.vol = vol; if (ctx) { if (name) startAmb(o.fundido ?? 2.5); else if (ambS.A) { ambRelease(ambS.A, ctx.currentTime, 2); ambS.A = null; } }
  }
  // Rain on top of whatever ambience plays (the storm ambience has its own).
  function rain(on) {
    rainS.on = on; if (!ctx) return;
    if (on && !rainS.A) { rainS.A = Amb(M, 'lluvia', ctx.currentTime + .05, 1, 1.5); ambPump(rainS.A, ctx.currentTime + .3); }
    else if (!on && rainS.A) { ambRelease(rainS.A, ctx.currentTime, 1.5); rainS.A = null; }
  }
  function duck(on) {
    if (!M) return; const t = ctx.currentTime, k = on ? .32 : 1, ka = on ? .55 : 1;
    M.music.gain.setTargetAtTime(LEVEL.music * k, t, .12); M.musicWet.gain.setTargetAtTime(LEVEL.music * k, t, .12);
    M.amb.gain.setTargetAtTime(LEVEL.amb * ka, t, .2); M.ambWet.gain.setTargetAtTime(LEVEL.amb * ka, t, .2);
  }
  function setMuted(m) { muted = m; if (M) M.master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, .02); }
  function isMuted() { return muted; }
  function resume() { if (!tvSuspended && ctx && ctx.state !== 'running') ctx.resume(); }
  function suspend(value) { tvSuspended = !!value; if (ctx) { if (tvSuspended) ctx.suspend(); else resume(); } }
  // Where the music is now (for the jukebox): song, section, bar, time.
  function estado() {
    const P = music.P, o = { cancion: music.name, ambiente: ambS.name };
    if (!P || !ctx) return o; const t = ctx.currentTime, h = P.hist.find(s => t >= s.start && t < s.end) || P.hist[0]; if (!h) return o;
    return Object.assign(o, { titulo: P.song.titulo || music.name, seccion: h.name, idx: h.k, vez: h.vez, compas: Math.floor((t - h.start) / (h.spb * h.bpb)) + 1, compases: h.bars, t: Math.max(0, t - P.t0), forma: P.S.forma, vueltas: P.loops || 0 });
  }
  // Plays one note (or a drum) outside any song, for effects and auditions: Sound.tocar('marimba', 'E5', .5, .8, { pan, rev }).
  function tocar(inst, nota, dur = .5, vel = .8, o = {}) {
    if (!ctx || muted) return; inst = ALIAS[inst] || DR_ALIAS[inst] || inst; const drum = !!DR[inst], k = inst + '|' + (o.pan || 0) + '|' + (o.rev ?? ''), solo = M.solo || (M.solo = {});   // the tracks belong to the mixer (the live one, or an offline render's)
    let tr = solo[k]; if (!tr) tr = solo[k] = mkTrack({ c: ctx, M, out: M.sfx, wet: M.sfxWet }, k, { inst: drum ? 'bateria' : inst, vol: 1, pan: o.pan || 0, rev: o.rev ?? (drum ? .1 : .25) });
    const t = ctx.currentTime + (o.en || 0) + .01;
    try { if (drum) playDrum(tr, inst, t, vel, {}); else for (const n of [].concat(nota)) { const m = typeof n === 'number' ? n : midi(n); if (m !== null && tr.I) tr.I.play(tr, t, m, dur, vel, { i: 0 }); } } catch (e) { }
  }
  function demo(inst) {   // a little phrase across the instrument's range
    const I = INST[ALIAS[inst] || inst]; if (DR[DR_ALIAS[inst] || inst]) { for (let i = 0; i < 8; i++) tocar(inst, null, .2, [.9, .4, .6, .4, 1, .4, .6, .7][i], { en: i * .22 }); return; }
    if (!I || !I.rango) return; const [lo, hi] = rangeOf(I.rango), c = Math.round((lo + hi) / 2 / 12) * 12 - 3;
    [0, 4, 7, 12, 11, 7, 9, 5].forEach((iv, i) => tocar(inst, clamp(c + iv - 6, lo, hi), i === 7 ? 1.4 : .3, .75, { en: i * .3 }));
    tocar(inst, [c - 6, c - 2, c + 1].map(m => clamp(m, lo, hi)), 1.6, .6, { en: 2.6 });
  }

  // ================================================================ Herramientas
  // info(name): the form's first pass without randomness — sections, lengths, repetition.
  function info(name) {
    const song = SONGS[name]; if (!song) return null; const S = prep(song), P = { S, vl: {}, range: true }, secs = [], sigs = [], vez = {};
    let t = 0;
    const walk = (from, to, rec) => { for (let k = from; k < to; k++) { const n = S.forma[k], v = vez[n] = (vez[n] ?? -1) + 1, sec = compileSection(P, n, v, true); if (!sec) continue;
      const bl = sec.bpb * sec.spb, bars = Array.from({ length: sec.bars }, () => []);
      for (const e of sec.ev) { const bi = clamp(Math.floor((e.t + 1e-6) / bl), 0, sec.bars - 1); bars[bi].push(e.tr + ':' + (e.d || e.m) + '@' + Math.round((e.t - bi * bl) / sec.spb * 48)); }
      if (!rec) continue; bars.forEach(b => sigs.push(b.sort().join(' ')));
      secs.push({ nombre: n, vez: v, compases: sec.bars, segundos: +sec.dur.toFixed(2), inicio: +t.toFixed(2), notas: sec.ev.length }); t += sec.dur; } };
    walk(0, S.forma.length, true); const primera = t; if (S.bucle) walk(S.vuelta, S.forma.length, false);   // the second pass only to catch warnings in its variations
    const n1 = secs.reduce((a, s) => a + s.compases, 0), first = sigs;
    return { nombre: name, titulo: song.titulo, tempo: song.tempo, compas: song.compas || '4/4', secciones: secs, primeraVuelta: +primera.toFixed(2), vuelveA: S.bucle ? S.forma[S.vuelta] : null,
      compases: n1, compasesDistintos: new Set(first).size, compasesVacios: first.filter(s => !s).length, avisos: [...S.warn] };
  }
  function validar(name) { const i = info(name); return i ? i.avisos : ['no existe la canción ' + name]; }
  // A test piece for one instrument: runs, a held note, staccatos, a chord and a slur (or a groove for a drum).
  function demoSong(name) {
    name = ALIAS[name] || DR_ALIAS[name] || name;
    if (DR[name]) return { titulo: name, tempo: 100, pistas: { d: { inst: 'bateria', vol: .9 } }, secciones: { A: { compases: 4, d: name + ' x.x. X..o x..x X.x. | x... .... X... .... | xoxo xoxo XoXo xxxx | f... R... x... ....' } }, forma: ['A'], bucle: false };
    const I = INST[name]; if (!I || !I.rango) return { tempo: 100, pistas: {}, secciones: { A: {} }, forma: ['A'] };
    const [lo, hi] = rangeOf(I.rango), c = Math.max(lo + 7, Math.min(hi - 16, Math.round((lo + hi) / 2 / 12) * 12)), n = k => { const x = c + k; return ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][x % 12] + (Math.floor(x / 12) - 1); };
    const run = [0, 2, 4, 5, 7, 9, 11, 12].map(k => n(k) + 'e').join(' ');
    return { titulo: name, tempo: 96, pistas: { a: { inst: name, vol: .9 } }, secciones: { A: { compases: 5, a: `mf ${run} | ${[12, 11, 9, 7, 5, 4, 2, 0].map(k => n(k) + 'e').join(' ')} | p < ${n(0)}h ${n(7)}h ff | mp ${n(4)}q' ${n(5)}q' ${n(7)}q'! ${n(9)}e_ ${n(11)}e_ | [${n(0)} ${n(4)} ${n(7)} ${n(11)}]w` } }, forma: ['A'], bucle: false };
  }
  // render(what, secs): renders a song ('marsh') and/or an ambience ('amb:noche') offline → { buffer, log, hist }.
  // The effects, to audition them: every name with the arguments worth hearing, and a description.
  const EFECTOS = [
    ['step', null, 'paso de Nila (frecuente: 6 variantes)'], ['jump', null, 'salto: tela y empuje'], ['land', .3, 'aterrizaje suave'], ['land', 1, 'aterrizaje fuerte'], ['flap', null, 'doble salto: aleteo'],
    ['whoosh', null, 'soplo de aire que cruza'], ['hurt', null, 'Nila se hace daño: golpe y "¡ay!"'], ['death', null, 'Nila cae: silbato que baja y plof'],
    ['glup', .35, 'Bigotes traga un mosquito'], ['glup', 1, 'traga una piedra'], ['glup', 1.5, 'traga una caja (con tripa)'], ['spit', .35, 'escupe algo ligero'], ['spit', 1, 'escupe una piedra'], ['spit', 1.5, 'escupe una caja'],
    ['bigspit', 1, 'escupitajo cargado'], ['charge', null, 'cargando (tensión que sube)'], ['charged', null, 'carga lista: ¡ting!'], ['blub', null, 'burbujas de eructo'], ['sputter', null, 'el chorro se agota'],
    ['puff', null, 'pff: se acaba el agua'], ['inhale', null, 'toma aire antes de soplar'], ['gust', null, 'el soplido'], ['suck', null, 'bucle: aspirar, 3 etapas'], ['suckup', 2, 'sube a la etapa 2'], ['suckup', 3, 'sube a la etapa 3'], ['jet', null, 'bucle: chorro de agua (flotar)'],
    ['thud', null, 'golpe sordo de madera/tierra (frecuente)'], ['hit', null, 'piedra que golpea'], ['crack', null, 'algo se rompe: grieta y cascotes'], ['clang', null, '¡CLONC! metal'], ['splash', null, 'chapuzón'], ['pop', null, 'burbuja que revienta'],
    ['bounce', null, 'seta: ¡boing!'], ['switch', null, 'palanca / interruptor de madera'], ['gate', null, 'la compuerta de piedra se abre'], ['hiss', null, 'agua sobre fuego: SSSH'], ['thunder', null, 'trueno'], ['rumble', null, 'temblor de tierra'], ['whistle', null, 'piedra que cae silbando'],
    ['frog', null, 'rana que salta'], ['croak', null, 'rana que avisa'], ['buzz', null, 'mosquito'], ['stun', null, 'aturdido: pajaritos'], ['chirp', null, 'pájaro del amanecer'],
    ['heron', null, 'la garza: «fraank»'], ['shriek', .6, 'grito de la garza'], ['shriek', 1, 'grito grande de la garza'], ['heronHit', null, 'la garza recibe un golpe'], ['swoop', null, 'la garza se lanza'], ['gustWind', null, 'aletazo de viento'],
    ['ruffle', null, 'eriza las plumas'], ['feathers', null, 'plumas que saltan'], ['stab', null, 'picotazo en el barro'], ['squelch', null, 'pico atascado en el barro'], ['bossDown', null, 'la garza cae vencida'],
    ['pearl', null, 'rescatas una cría'], ['heart', null, 'corazón'], ['lantern', null, 'enciendes un farol'],
    ['chomp', null, 'mordisco'], ['gulpBig', null, 'el gran trago'], ['heartbeat', null, 'latido'], ['shing', null, 'destello mágico'], ['powerRise', null, 'el poder sube'], ['powerBurst', null, 'el poder estalla'], ['learn', null, 'aprendes un truco'], ['win', null, 'el truco es tuyo'],
    ['clear', null, 'fanfarria corta: superado'], ['fanfare', null, 'fanfarria de fin de nivel'], ['bell', null, 'campana del final'],
    ['select', null, 'menú: mover'], ['confirm', null, 'menú: aceptar'], ['text', null, 'clic del carrete / apuntar'], ['talk', 150, 'voz de Ruca'], ['talk', 520, 'voz de Lumi'], ['talk', 120, 'voz de Don Anselmo'], ['talk', 280, 'voz de Don Pinzas'],
    ['tick', 0, 'contador'], ['slam', 0, 'letrero que cae'], ['stamp', 0, 'sello'], ['stamp', 1, 'sello con premio'], ['kaching', null, '¡premio!'], ['bloop', 0, 'una cría salta del agua']];
  // What each effect plays over time (loops and babble need a script): [[seconds, fn], ...].
  function fxScript(name, arg) {
    if (name === 'suck') return [[0, () => suck(true)], [1.2, () => { play('suckup', 2); suckLevel(2); }], [2.4, () => { play('suckup', 3); suckLevel(3); }], [3.6, () => suck(false)], [3.62, () => play('glup', 1)]];
    if (name === 'jet') return [[0, () => jet(true)], [1.6, () => play('sputter')], [1.8, () => play('sputter')], [2, () => jet(false)]];
    if (name === 'talk') return Array.from({ length: 22 }, (_, i) => [i * .075 + (i > 10 ? .25 : 0), () => play('talk', arg)]);
    if (name === 'step') return Array.from({ length: 6 }, (_, i) => [i * .2, () => play('step')]);
    if (name === 'tick') return Array.from({ length: 12 }, (_, i) => [i * .05, () => play('tick', i)]);
    if (name === 'bloop') return Array.from({ length: 8 }, (_, i) => [i * .1, () => play('bloop', i)]);
    return [[0, () => play(name, arg)]];
  }
  const fxLen = name => ({ suck: 4.4, jet: 2.8, fanfare: 3.6, bossDown: 3.6, thunder: 5.5, bell: 4, death: 2.4, learn: 2.6, gustWind: 2.6, powerRise: 2 }[name] || 2);
  function efecto(name, arg) { if (!ctx) return; for (const [t, fn] of fxScript(name, arg)) setTimeout(fn, t * 1000); }
  // renderFx('glup', 1.5) → an offline render of one effect through a fresh mixer (for tools/musica.js).
  async function renderFx(name, arg, secs, sr = 44100) {
    secs = secs || fxLen(name); PERF.fxErr = null; const oc = new OAC(2, Math.ceil(sr * secs), sr), X = buildMixer(oc);
    const inside = fn => { const was = [ctx, M, sfxBus, noiseBuffer, muted, suckNode, jetNode]; [ctx, M, sfxBus, noiseBuffer, muted, suckNode, jetNode] = [oc, X, X.sfx, X.noise, false, X.suckNode || null, X.jetNode || null]; for (const k in FXLAST) delete FXLAST[k];
      try { fn(); } finally { X.suckNode = suckNode; X.jetNode = jetNode; [ctx, M, sfxBus, noiseBuffer, muted, suckNode, jetNode] = was; } };
    for (const [t, fn] of fxScript(name, arg)) { if (t === 0) inside(fn); else oc.suspend(Math.round(t * sr / 128) * 128 / sr).then(() => { inside(fn); oc.resume(); }); }
    const buffer = await oc.startRendering(); return { buffer, log: PERF.fxErr ? [[0, 'ERROR', PERF.fxErr, null, '']] : [], hist: [] };
  }
  async function render(what, secs = 60, o = {}) {
    if (!OAC) throw new Error('sin OfflineAudioContext');
    if (what.startsWith('sfx:')) { const [, n, a] = what.split(':'); return renderFx(n, a === undefined || a === '' ? undefined : +a, o.secs0 ? null : secs, o.sr); }
    if (what.startsWith('inst:')) { SONGS.__inst = demoSong(what.slice(5)); delete SONGS.__inst._p; what = '__inst'; }
    const sr = o.sr || 44100, oc = new OAC(2, Math.ceil(sr * secs), sr), X = buildMixer(oc), log = [];
    const ambName = o.amb || (what.startsWith('amb:') ? what.slice(4) : null), song = SONGS[what];
    let P = null, A = null; if (song) { P = Player(X, song, what, .05, log); P.offline = true; } if (ambName) A = Amb(X, AMB_ALIAS[ambName] || ambName, 0, o.ambVol ?? 1, .5);
    const step = o.paso || .25, go = t => { if (P) pump(P, t + .6, t); if (A) ambPump(A, t + .6); };
    go(0); const at = k => oc.suspend(k * step).then(() => { go(k * step); if ((k + 1) * step < secs) at(k + 1); oc.resume(); }); if (step < secs) at(1);
    const buffer = await oc.startRendering();
    return { buffer, log, hist: P ? P.hist : [], info: song ? info(what) : null };
  }

  return { init, suspend, play, suck, suckLevel, jet, rain, playMusic, stopMusic, duck, setMuted, isMuted, resume, get ready() { return !!ctx; },
    cancion(name, d) { SONGS[name] = d; delete d._p; }, definicion: name => SONGS[name], ambiente, estado, tocar, demo, info, validar, render,
    canciones: () => Object.keys(SONGS).map(k => ({ nombre: k, titulo: SONGS[k].titulo || k })), ambientes: () => Object.keys(AMBS).filter(k => k !== 'lluvia'),
    instrumentos: () => Object.keys(INST).filter(k => k !== 'bateria').map(k => ({ nombre: k, rango: INST[k].rango, desc: INST[k].d })), percusion: () => Object.keys(DR),
    fxCoste: () => Object.keys(FX).map(k => { const t0 = clock(); let d = FX[k].gen(FX[k].hz || 44100, 0, 200); const ms = clock() - t0; d = Array.isArray(d) ? d : [d]; return [k, +ms.toFixed(1), Math.round(d.length * d[0].length * 4 * (FX[k].v || 1) / 1024)]; }),   // ms to render each effect's buffer, KB of all its variants
    efectos: () => EFECTOS.map(([nombre, arg, desc]) => ({ nombre, arg, desc })), efecto, fxLen,
    midi, freq, PERF, stats: () => Object.assign({ buffers: BUF.size, mb: +(bufBytes / 1e6).toFixed(1), fxmb: +([...BUF].reduce((a, [k, b]) => a + (k.includes('|fx:') ? b.length * b.numberOfChannels * 4 : 0), 0) / 1e6).toFixed(1), estado: ctx && ctx.state }, stats) };
})();
