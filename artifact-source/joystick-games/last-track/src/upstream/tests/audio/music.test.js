import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, pickFormat, trackUrl, scenePlan, eventWeight, createCombatModel, createMusicPlayer } from '../../src/audio/music.js';
import { existsSync } from 'node:fs';

test('pickFormat prefers ogg/opus when supported, else mp3', () => {
  assert.equal(pickFormat(() => 'probably'), 'ogg');
  assert.equal(pickFormat(() => ''), 'mp3');
  assert.equal(pickFormat(null), 'mp3');
});

test('every track has both encodings on disk', () => {
  for (const id of Object.keys(TRACKS)) for (const f of ['ogg', 'mp3']) assert.ok(existsSync(new URL('../../' + trackUrl(id, f), import.meta.url)), `${id}.${f}`);
});

test('scenePlan: combat layer only in race and clamped', () => {
  assert.deepEqual(scenePlan('race', 2), { 'race-base': 1, 'race-combat': 1 });
  assert.deepEqual(scenePlan('race', -1), { 'race-base': 1, 'race-combat': 0 });
  assert.deepEqual(scenePlan('menu'), { menu: 1 });
  assert.deepEqual(scenePlan('off'), {});
});

test('eventWeight scales with proximity and ignores unknown events', () => {
  const p = { x: 0, y: 0 };
  assert.ok(eventWeight({ type: 'explosion', x: 5, y: 0 }, p) > eventWeight({ type: 'explosion', x: 70, y: 0 }, p));
  assert.equal(eventWeight({ type: 'lap' }, p), 0);
  assert.ok(eventWeight({ type: 'hit' }, null) > 0);
});

test('combat model rises on explosions and decays back to silence', () => {
  const m = createCombatModel();
  for (let i = 0; i < 60; i++) m.step(1 / 60);
  assert.equal(m.level, 0);
  m.push([{ type: 'explosion', x: 1, y: 1 }, { type: 'wreck', x: 2, y: 0 }], { x: 0, y: 0 });
  let peak = 0; for (let i = 0; i < 120; i++) peak = Math.max(peak, m.step(1 / 60));
  assert.ok(peak > 0.5, 'peak ' + peak);
  for (let i = 0; i < 60 * 40; i++) m.step(1 / 60);
  assert.ok(m.level < 0.02);
});

test('player is inert without AudioContext and remembers scene', async () => {
  const p = createMusicPlayer({ fetchFn: null });
  p.setScene('menu'); p.update({ cars: [], events: [] }, 1 / 60); p.duck(); p.setVolume(0.5); p.setMuted(true);
  assert.equal(p.scene, 'menu'); assert.equal(p.state.attached, false);
  p.setScene('bogus'); assert.equal(p.scene, 'menu');
});

// Minimal fake WebAudio to exercise scene switching / combat gain / ducking
function fakeCtx() {
  const mkParam = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; }, cancelScheduledValues() {} });
  const nodes = [];
  const ctx = { currentTime: 0, state: 'running', destination: {},
    createGain() { const n = { gain: mkParam(), connect() {} }; nodes.push(n); return n; },
    createBufferSource() { const n = { connect() {}, start() { this.started = true; }, stop() { this.stopped = true; }, loop: false }; nodes.push(n); return n; },
    decodeAudioData(ab, ok) { ok({ duration: 51.2065 }); } };
  return { ctx, nodes };
}
test('player with fake context: scene crossfade and combat layer', async () => {
  const { ctx } = fakeCtx();
  const p = createMusicPlayer({ fetchFn: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }), format: 'ogg' });
  p.setScene('race'); assert.equal(p.state.attached, false);
  p.attach(ctx, ctx.destination);
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(p.state.playing.sort(), ['race-base', 'race-combat']);
  p.update({ tick: 1, cars: [{ isPlayer: true, x: 0, y: 0 }], events: [{ type: 'explosion', x: 2, y: 0 }] }, 0.5);
  assert.ok(p.combatLevel > 0.1);
  p.setScene('win'); await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(p.state.playing, ['results-win']);
  p.duck(0.5, 0.2); p.dispose();
});
