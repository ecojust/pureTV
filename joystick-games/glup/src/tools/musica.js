// GLUP — escuchar sin oídos. Renderiza una canción (o un ambiente) con OfflineAudioContext en el
// Chrome instalado, sin pantalla, y deja en artifacts/musica/ un WAV y un PNG (forma de onda,
// espectrograma y franjas de secciones); imprime picos, sonoridad por sección, recortes, huecos
// de silencio, notas por instrumento, compases distintos y cuánto dura antes de volver a empezar.
//   node tools/musica.js marsh [segundos]        una canción (por defecto, su primera vuelta + 10 s)
//   node tools/musica.js amb:noche [segundos]    un ambiente
//   node tools/musica.js inst:flautaPan          un instrumento solo (escalas, notas largas, staccato, acorde)
//   node tools/musica.js marsh 60 --amb=atardecer   canción con su ambiente debajo
//   node tools/musica.js --todas                 resumen de todas las canciones (sin WAV)
//   node tools/musica.js sfx:glup:1.5            un efecto (con su argumento): WAV, PNG, pico y sonoridad
//   node tools/musica.js --sfx [filtro]          todos los efectos (Sound.efectos()) → artifacts/musica/sfx/ y una tabla
//   node tools/musica.js --sfxvivo               todos los efectos en el motor en vivo (errores, calentamiento) · --sfxcoste: ms por efecto
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), os = require('os'), { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'artifacts', 'musica');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2), flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })), pos = args.filter(a => !a.startsWith('--'));
const what = pos[0] || 'marsh', secsArg = pos[1] ? +pos[1] : null;

// ---- Chrome over the DevTools pipe (fd 3 in, fd 4 out: JSON messages ending in \0)
function chrome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'glup-musica-'));
  const p = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-pipe', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--user-data-dir=' + dir, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let id = 0, buf = ''; const wait = new Map();
  p.stdio[4].on('data', d => { buf += d.toString('utf8'); let i; while ((i = buf.indexOf('\0')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); if (m.id && wait.has(m.id)) { const w = wait.get(m.id); wait.delete(m.id); m.error ? w.rej(new Error(JSON.stringify(m.error))) : w.res(m.result); } } });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const k = ++id; wait.set(k, { res, rej }); p.stdio[3].write(JSON.stringify({ id: k, method, params, sessionId }) + '\0'); });
  return { send, close() { p.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { } } };
}
async function openPage(C) {
  const songs = fs.readdirSync(path.join(ROOT, 'musica')).filter(f => f.endsWith('.js')).sort();
  fs.mkdirSync(OUT, { recursive: true });
  const html = path.join(OUT, '_render.html');
  fs.writeFileSync(html, '<!doctype html><meta charset="utf-8"><body>' + ['audio.js', ...songs.map(s => 'musica/' + s)].map(s => `<script src="file://${path.join(ROOT, s)}"></script>`).join('') + '</body>');
  const { targetInfos } = await C.send('Target.getTargets'), page = targetInfos.find(t => t.type === 'page');
  const { sessionId } = await C.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  const ev = async (expr, awaitPromise = false) => { const r = await C.send('Runtime.evaluate', { expression: expr, awaitPromise, returnByValue: true }, sessionId); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; };
  await C.send('Page.navigate', { url: 'file://' + html }, sessionId);
  for (let i = 0; i < 100; i++) { await new Promise(r => setTimeout(r, 100)); try { if (await ev("document.readyState === 'complete' && typeof Sound === 'object'")) break; } catch (e) { } }
  return ev;
}

// ---- PNG
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = b => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function png(w, h, rgb) {
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function fft(re, im) {
  const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let j = 0; j < len / 2; j++) { const k = i + j + len / 2, tr = re[k] * cr - im[k] * ci, ti = re[k] * ci + im[k] * cr; re[k] = re[i + j] - tr; im[k] = im[i + j] - ti; re[i + j] += tr; im[i + j] += ti; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
}
const heat = v => { const s = [[8, 10, 30], [40, 30, 110], [150, 40, 120], [235, 110, 50], [255, 230, 120], [255, 255, 240]], x = Math.max(0, Math.min(.999, v)) * (s.length - 1), i = Math.floor(x), f = x - i; return s[i].map((c, k) => Math.round(c + (s[i + 1][k] - c) * f)); };
function picture(L, R, sr, hist, file) {
  const n = L.length, W = Math.max(400, Math.min(2000, Math.round(n / sr * 16))), HW = 70, HS = 220, HB = 14, H = HW + HS + HB, img = Buffer.alloc(W * H * 3);
  const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2]; };
  for (let x = 0; x < W; x++) { const a = Math.floor(x * n / W), b = Math.floor((x + 1) * n / W); let mx = 0, s = 0; for (let i = a; i < b; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (v > mx) mx = v; s += (L[i] * L[i] + R[i] * R[i]) / 2; } const rms = Math.sqrt(s / Math.max(1, b - a));
    for (let y = 0; y < HW; y++) { const v = Math.abs(y - HW / 2) / (HW / 2); put(x, y, v <= rms ? [120, 200, 255] : v <= mx ? (mx >= .99 ? [255, 60, 60] : [50, 90, 140]) : [12, 14, 22]); } }
  const N = 2048, re = new Float64Array(N), im = new Float64Array(N), win = Float64Array.from({ length: N }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / N)), f0 = 40, f1 = 16000;
  for (let x = 0; x < W; x++) { const c = Math.floor(x * n / W); for (let i = 0; i < N; i++) { const j = c + i - N / 2, v = j >= 0 && j < n ? (L[j] + R[j]) / 2 : 0; re[i] = v * win[i]; im[i] = 0; } fft(re, im);
    for (let y = 0; y < HS; y++) { const fr = f0 * Math.pow(f1 / f0, 1 - y / HS), k = Math.min(N / 2 - 1, Math.round(fr / sr * N)), mag = Math.hypot(re[k], im[k]) / N * 4, db = 20 * Math.log10(mag + 1e-9); put(x, HW + y, heat((db + 105) / 85)); } }
  const col = name => { let h = 0; for (const ch of name) h = h * 31 + ch.charCodeAt(0) & 0xffff; return [80 + h % 150, 80 + (h >> 4) % 150, 80 + (h >> 8) % 150]; };
  for (const s of hist) { const a = Math.round(s.start * sr / n * W), b = Math.round(s.end * sr / n * W), c = col(s.name); for (let x = a; x < b; x++) for (let y = HW + HS; y < H; y++) put(x, y, (y - HW - HS) < 3 && s.vez ? [255, 255, 255] : c); for (let y = 0; y < H; y++) put(a, y, [255, 255, 255]); }
  fs.writeFileSync(file, png(W, H, img));
}
function wav(L, R, sr, file) {
  const n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4); b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4); }
  fs.writeFileSync(file, b);
}
const db = v => v > 0 ? (20 * Math.log10(v)).toFixed(1) : '-inf';
function rmsOf(L, R, a, b) { let s = 0; a = Math.max(0, a | 0); b = Math.min(L.length, b | 0); for (let i = a; i < b; i++) s += (L[i] * L[i] + R[i] * R[i]) / 2; return Math.sqrt(s / Math.max(1, b - a)); }

async function renderOne(ev, name, secs) {
  const info = name.includes(':') ? null : await ev(`Sound.info(${JSON.stringify(name)})`);
  if (!name.includes(':') && !info) throw new Error('no existe la canción ' + name + '. Hay: ' + (await ev('Sound.canciones().map(c => c.nombre).join(", ")')));
  const fx = name.startsWith('sfx:');
  secs = secs || (info ? Math.min(240, Math.ceil(info.primeraVuelta + 10)) : name.startsWith('inst:') ? 16 : fx ? await ev(`Sound.fxLen(${JSON.stringify(name.split(':')[1])})`) : 30);
  const t0 = Date.now();
  const meta = await ev(`(async () => { const r = await Sound.render(${JSON.stringify(name)}, ${secs}, ${JSON.stringify(flags.amb ? { amb: flags.amb } : {})}); const b = r.buffer, L = b.getChannelData(0), R = b.getChannelData(1);
    let clip = 0, peak = 0; for (let i = 0; i < L.length; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (v > peak) peak = v; if (v >= .999) clip++; }
    const q = new Int16Array(L.length * 2); for (let i = 0; i < L.length; i++) { q[2 * i] = Math.max(-32767, Math.min(32767, L[i] * 32767)); q[2 * i + 1] = Math.max(-32767, Math.min(32767, R[i] * 32767)); }
    const u8 = new Uint8Array(q.buffer); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); window.__pcm = btoa(s);
    return { sr: b.sampleRate, n: L.length, clip, peak, log: r.log, hist: r.hist.map(h => ({ name: h.name, vez: h.vez, start: h.start, end: h.end })) }; })()`, true);
  const parts = []; for (let i = 0, len = await ev('window.__pcm.length'); i < len; i += 4e6) parts.push(await ev(`window.__pcm.slice(${i}, ${i + 4e6})`));
  const q = new Int16Array(new Uint8Array(Buffer.from(parts.join(''), 'base64')).buffer), n = meta.n, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = q[2 * i] / 32767; R[i] = q[2 * i + 1] / 32767; }
  // Short-term loudness (the loudest 50 ms and 400 ms windows): what an effect sounds like against the music.
  const stw = w => { const k = Math.floor(meta.sr * w); let m = 0; for (let i = 0; i + k <= n; i += k >> 2) m = Math.max(m, rmsOf(L, R, i, i + k)); return m; };
  const st50 = stw(.05), st400 = stw(.4); let last = 0; for (let i = 0; i < n; i++) if (Math.abs(L[i]) > .001 || Math.abs(R[i]) > .001) last = i;
  const dir = fx && flags.sfx ? path.join(OUT, 'sfx') : OUT; fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, name.replace(/[^\w-]/g, '_')); wav(L, R, meta.sr, base + '.wav'); picture(L, R, meta.sr, meta.hist, base + '.png');
  // ---- report
  const sr = meta.sr, lines = [];
  lines.push(`${name}${info && info.titulo ? ' — ' + info.titulo : ''}: ${secs} s renderizados en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  lines.push(`  pico ${db(meta.peak)} dBFS · RMS ${db(rmsOf(L, R, 0, n))} dBFS · recortes ${meta.clip}`);
  if (fx && meta.log.length) lines.push('  ERROR: ' + meta.log[0][2]);
  if (fx) { lines.push(`  sonoridad máx. 50 ms ${db(st50)} dBFS · 400 ms ${db(st400)} dBFS · suena ${(last / meta.sr).toFixed(2)} s`); return { text: lines.join('\n') + '\n  → ' + path.relative(ROOT, base) + '.wav / .png', row: { err: meta.log.length ? meta.log[0][2] : null, peak: meta.peak, st50, st400, len: last / meta.sr, clip: meta.clip, file: path.relative(ROOT, base) + '.png' } }; }
  if (info) {
    lines.push(`  ${info.tempo} bpm ${info.compas} · primera vuelta ${info.primeraVuelta} s (${info.compases} compases, ${info.compasesDistintos} distintos, ${info.compasesVacios} vacíos) · luego vuelve a «${info.vuelveA}»`);
    lines.push('  secciones:'); for (const h of meta.hist) if (h.start < secs) lines.push(`    ${h.start.toFixed(1).padStart(6)} s  ${(h.name + (h.vez ? ' (' + (h.vez + 1) + 'ª)' : '')).padEnd(16)} RMS ${db(rmsOf(L, R, h.start * sr, Math.min(h.end, secs) * sr)).padStart(6)} dBFS`);
    if (info.avisos.length) { lines.push('  AVISOS:'); info.avisos.forEach(a => lines.push('    ' + a)); }
  }
  const per = {}; for (const [t, tr, inst] of meta.log) { const k = tr + ' (' + inst + ')'; per[k] = (per[k] || 0) + 1; }
  if (meta.log.length) lines.push('  notas: ' + Object.entries(per).map(([k, v]) => k + ' ' + v).join(' · '));
  const win = Math.floor(sr * .1), gaps = []; let run = 0;
  for (let i = 0; i + win <= n; i += win) { if (rmsOf(L, R, i, i + win) < .0018) run++; else { if (run >= 10) gaps.push([(i / sr - run * .1).toFixed(1), (run * .1).toFixed(1)]); run = 0; } }
  lines.push('  huecos de silencio (< -55 dBFS, ≥ 1 s): ' + (gaps.length ? gaps.map(([a, d]) => a + ' s (' + d + ' s)').join(', ') : 'ninguno'));
  lines.push('  → ' + path.relative(ROOT, base) + '.wav / .png');
  return lines.join('\n');
}

(async () => {
  const C = chrome();
  try {
    const ev = await openPage(C);
    if (flags.perfinst) {   // cost of each instrument's test piece
      const list = await ev('Sound.instrumentos().map(i => i.nombre)');
      await ev(`Sound.render('inst:bajo', 1)`, true);
      for (const k of list) { const r = await ev(`(async () => { const t0 = performance.now(); await Sound.render('inst:${k}', 10); return performance.now() - t0; })()`, true); console.log(k.padEnd(12), (r / 100).toFixed(1), '% tiempo real'); }
    } else if (flags.perfpistas) {   // cost of the song without each track in turn
      const keys = await ev(`Object.keys(Sound.definicion(${JSON.stringify(what)}).pistas)`), secs = secsArg || 60;
      const run = async drop => ev(`(async () => { const d = Sound.definicion(${JSON.stringify(what)}), p = Object.assign({}, d.pistas); ${drop ? `delete p[${JSON.stringify(drop)}];` : ''} Sound.cancion('__perf', Object.assign({}, d, { pistas: p })); const t0 = performance.now(); await Sound.render('__perf', ${secs}); return performance.now() - t0; })()`, true);
      await run(null); const base = await run(null); console.log('todo'.padEnd(10), (base / 10 / secs).toFixed(1), '%');
      for (const k of keys) { const r = await run(k); console.log(('-' + k).padEnd(10), (r / 10 / secs).toFixed(1), '%  (ahorra', ((base - r) / 10 / secs).toFixed(1), ')'); }
    } else if (flags.perf) {   // how fast the offline render runs (≈ how much of one core the song needs live)
      for (const [label, set] of [['normal', ''], ['sin reverb', 'Sound.PERF.noRev = true;'], ['paso 1 s', '']]) {
        const r = await ev(`(async () => { Sound.PERF.noRev = false; ${set} const t0 = performance.now(); await Sound.render(${JSON.stringify(what)}, ${secsArg || 30}, { paso: ${label === 'paso 1 s' ? 1 : .25} }); return performance.now() - t0; })()`, true);
        console.log(label.padEnd(12), (r / 1000).toFixed(2), 's para', secsArg || 30, 's →', (r / 10 / (secsArg || 30)).toFixed(1), '% de tiempo real'); }
    } else if (flags.vivo) {   // the live engine for a while (real AudioContext): errors, where it is, CPU of the scheduler
      const secs = secsArg || 12;
      const r = await ev(`(async () => { const errs = []; const ow = console.warn, oe = console.error; console.warn = (...a) => { errs.push(a.join(' ')); ow(...a); }; console.error = (...a) => { errs.push(a.join(' ')); oe(...a); }; addEventListener('error', e => errs.push(e.message));
        Sound.init(); ${what.includes(':') ? '' : `Sound.playMusic(${JSON.stringify(what)});`} Sound.ambiente(${JSON.stringify(flags.amb || (what.startsWith('amb:') ? what.slice(4) : 'atardecer'))});
        const snaps = []; for (let i = 0; i < ${secs}; i++) { await new Promise(r => setTimeout(r, 1000)); const e = Sound.estado(); snaps.push((e.seccion || '-') + ':' + (e.compas || '-')); if (i === ${Math.floor(secs / 2)} && ${!!flags.cambio}) Sound.playMusic('dock'); }
        return { errs, snaps, stats: Sound.stats() }; })()`, true);
      console.log('secciones por segundo:', r.snaps.join(' '));
      console.log('motor:', JSON.stringify(r.stats), '→ media', (r.stats.ms / r.stats.ticks).toFixed(2), 'ms por tick');
      console.log(r.errs.length ? 'ERRORES:\n  ' + r.errs.join('\n  ') : 'sin errores');
    } else if (flags.calibrar) {   // every instrument's test piece: loudness side by side (they should sit within a few dB)
      const list = (await ev('Sound.instrumentos().map(i => i.nombre).concat(Sound.percusion())'));
      for (const k of list) { const r = await ev(`(async () => { const r = await Sound.render('inst:${k}', 10); const L = r.buffer.getChannelData(0), R = r.buffer.getChannelData(1); let s = 0, p = 0, n = 0; for (let i = 0; i < L.length; i++) { const v = (L[i] * L[i] + R[i] * R[i]) / 2; s += v; if (v > 1e-7) n++; p = Math.max(p, Math.abs(L[i]), Math.abs(R[i])); } return { rms: Math.sqrt(s / Math.max(1, n)), p }; })()`, true);
        console.log(k.padEnd(14), 'RMS (sonando)', db(r.rms).padStart(6), 'dBFS · pico', db(r.p).padStart(6)); }
    } else if (flags.sfxvivo) {   // every effect through the live engine (real AudioContext): errors and the warm-up
      const r = await ev(`(async () => { const errs = []; addEventListener('error', e => errs.push(e.message)); const oe = console.error; console.error = (...a) => { errs.push(a.join(' ')); oe(...a); };
        Sound.init(); Sound.playMusic('marsh'); await new Promise(r => setTimeout(r, 3000)); const w = Sound.stats();
        for (const e of Sound.efectos()) { Sound.PERF.fxErr = null; Sound.efecto(e.nombre, e.arg ?? undefined); await new Promise(r => setTimeout(r, 120)); if (Sound.PERF.fxErr) errs.push(Sound.PERF.fxErr); }
        await new Promise(r => setTimeout(r, 4500)); return { errs, warm: w, stats: Sound.stats() }; })()`, true);
      console.log('tras 3 s (calentando):', JSON.stringify(r.warm)); console.log('al final:', JSON.stringify(r.stats), '→ media', (r.stats.ms / r.stats.ticks).toFixed(2), 'ms por tick');
      console.log(r.errs.length ? 'ERRORES:\n  ' + r.errs.join('\n  ') : 'sin errores');
    } else if (flags.sfxcoste) {   // how long each effect's buffer takes to render (the first trigger pays it, unless warmed up)
      await ev('Sound.fxCoste()'); const r = await ev('Sound.fxCoste()'); r.sort((a, b) => b[1] - a[1]); console.log(r.map(([k, ms, kb]) => k + ' ' + ms + ' ms ' + kb + ' KB').join(' · ')); console.log('total', Math.round(r.reduce((a, x) => a + x[2], 0)), 'KB');
    } else if (flags.sfx) {   // every effect: a table of peak and short-term loudness (targets: frequent -30..-22, big -16..-10 dBFS in 50 ms)
      const list = await ev('Sound.efectos()'), filt = pos[0] || '';
      console.log('efecto'.padEnd(18), 'pico', '  50ms', ' 400ms', ' dura', ' descripción');
      for (const e of list) { if (filt && !e.nombre.includes(filt)) continue; const nm = 'sfx:' + e.nombre + (e.arg === null ? '' : ':' + e.arg), r = (await renderOne(ev, nm, null)).row;
        console.log(nm.slice(4).padEnd(18), db(r.peak).padStart(5), db(r.st50).padStart(6), db(r.st400).padStart(6), r.len.toFixed(2).padStart(5), ' ' + e.desc + (r.clip ? ' · RECORTES ' + r.clip : '') + (r.err ? ' · ERROR ' + r.err : '')); }
      console.log('→ artifacts/musica/sfx/*.wav / .png');
    } else if (flags.todas) {
      const list = await ev('Sound.canciones().map(c => c.nombre)');
      for (const s of list) { const i = await ev(`Sound.info(${JSON.stringify(s)})`); console.log(`${s.padEnd(10)} ${String(i.titulo || '').padEnd(28)} ${String(i.tempo).padStart(3)} bpm ${i.compas} · ${String(i.primeraVuelta).padStart(6)} s · ${i.compases} compases (${i.compasesDistintos} distintos) · ${i.secciones.length} secciones${i.avisos.length ? ' · ' + i.avisos.length + ' AVISOS: ' + i.avisos.slice(0, 3).join(' | ') : ''}`); }
    } else { const r = await renderOne(ev, what, secsArg); console.log(r.text || r); }
  } catch (e) { console.error('ERROR', e.message); process.exitCode = 1; }
  finally { C.close(); }
})();
