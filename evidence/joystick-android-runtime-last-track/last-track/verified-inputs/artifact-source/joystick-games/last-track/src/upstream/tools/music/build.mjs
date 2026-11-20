// Usage: node tools/music/build.mjs [name...]   → assets/music/*.{mp3,ogg} (+ trailer.json). Deterministic (seeded).
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wavBuffer, peakOf, SR } from './synth.mjs';
import * as C from './compose.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'assets', 'music');
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const tmp = mkdtempSync(join(tmpdir(), 'lt-music-'));
mkdirSync(out, { recursive: true });
const want = process.argv.slice(2);
// per-track peak target (linear) after joint normalisation; tuned with ebur128 (see docs/music.md)
const DRIVE = { trailer: 2.6, 'results-win': 1.8 }; // soft-clip drive for single-mix pieces
const PEAK = { menu: 0.8, race: 0.9, 'results-win': 0.84, 'results-lose': 0.9, trailer: 0.84 };

const jobs = { menu: C.menu, race: C.race, 'results-win': C.win, 'results-lose': C.lose, trailer: C.trailer };
for (const [key, fn] of Object.entries(jobs)) {
  if (want.length && !want.includes(key)) continue;
  const t0 = Date.now(), piece = fn();
  const rendered = piece.mixes.map((x) => ({ name: x.name, ...x.mix.finish(x.fx) }));
  // joint scale for stems: normalise the SUM so stems keep their balance
  const n = rendered[0].L.length, sumL = new Float32Array(n), sumR = new Float32Array(n);
  for (const r of rendered) for (let i = 0; i < n; i++) { sumL[i] += r.L[i]; sumR[i] += r.R[i]; }
  const scale = (DRIVE[key] ? 1 : PEAK[key]) / peakOf(sumL, sumR);
  for (const r of rendered) {
    const d = DRIVE[key];
    for (let i = 0; i < n; i++) { r.L[i] *= scale; r.R[i] *= scale; if (d) { r.L[i] = Math.tanh(r.L[i] * d) / Math.tanh(d) * PEAK[key]; r.R[i] = Math.tanh(r.R[i] * d) / Math.tanh(d) * PEAK[key]; } }
    const wav = join(tmp, r.name + '.wav'); writeFileSync(wav, wavBuffer(r.L, r.R, 0, piece.fade || 0));
    if (piece.loop) { // seamless loop: no tag padding issues → opus/ogg is gapless; mp3 is fallback
      execFileSync(FFMPEG, ['-nostdin', '-y', '-v', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '112k', '-vbr', 'on', join(out, r.name + '.ogg')]);
    } else execFileSync(FFMPEG, ['-nostdin', '-y', '-v', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '112k', join(out, r.name + '.ogg')]);
    execFileSync(FFMPEG, ['-nostdin', '-y', '-v', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '128k', join(out, r.name + '.mp3')]);
    console.log(`${r.name}: ${(n / SR).toFixed(2)}s scale=${scale.toFixed(3)}`);
  }
  if (key === 'trailer') writeFileSync(join(out, 'trailer.json'), JSON.stringify({ bpm: piece.bpm, duration: piece.secs, file: 'trailer.mp3', hits: piece.hits, cuts: piece.hits.filter((h) => h.tag).map((h) => ({ t: h.t, tag: h.tag })) }, null, 1));
  if (piece.loop) writeFileSync(join(out, key + '.loop.json'), JSON.stringify({ bpm: piece.bpm, bars: piece.bars, duration: +piece.secs.toFixed(4) }));
  console.log(`${key} done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
