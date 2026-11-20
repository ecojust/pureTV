import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeParams, sanitizeName, analyticsEnabled, createAnalytics } from '../../src/analytics.js';
import { raceStartEvent, raceFinishEvent, raceQuitEvent, purchaseEvent, settingChangeEvents, weaponsString, errorEvent, fpsReportEvent } from '../../src/analyticsEvents.js';
import { attachAnalytics } from '../../src/analyticsWiring.js';
import { createEventBus } from '../../src/core/eventBus.js';
import { normalizeSettings, DEFAULT_SETTINGS } from '../../src/ui/settings.js';

const fakeWin = (over = {}) => { const calls = []; return { calls, gtag: (...a) => calls.push(a), location: { hostname: 'example.com', search: '' }, navigator: {}, ...over }; };

test('sanitizeParams: snake_case keys, trimmed strings, rounded numbers, booleans as 0/1, junk dropped, capped', () => {
  const p = sanitizeParams({ 'Item Type': '  weapon ', long: 'x'.repeat(300), n: 3.14159, big: 1234.5, ok: true, no: false, nan: NaN, inf: Infinity, u: undefined, nul: null, obj: { a: 1 }, arr: [1], '9bad': 1, '': 1 });
  assert.equal(p.item_type, 'weapon'); assert.equal(p.long.length, 100); assert.equal(p.n, 3.14); assert.equal(p.big, 1234.5);
  assert.equal(p.ok, 1); assert.equal(p.no, 0);
  for (const k of ['nan', 'inf', 'u', 'nul', 'obj', 'arr', '9bad', '']) assert.ok(!(k in p), k);
  const many = Object.fromEntries(Array.from({ length: 40 }, (_, i) => ['k' + i, i]));
  assert.equal(Object.keys(sanitizeParams(many)).length, 25);
  assert.deepEqual(sanitizeParams(null), {}); assert.equal(sanitizeName('Race Finish!'), 'race_finish');
});

test('analyticsEnabled: needs gtag, opt-in, no DNT, and not localhost unless ?ga=debug', () => {
  const base = { hostname: 'game.example', hasGtag: true, optIn: true, dnt: false, debug: false };
  assert.equal(analyticsEnabled(base), true);
  assert.equal(analyticsEnabled({ ...base, hasGtag: false }), false);
  assert.equal(analyticsEnabled({ ...base, optIn: false }), false);
  assert.equal(analyticsEnabled({ ...base, dnt: true }), false);
  for (const h of ['localhost', '127.0.0.1', '[::1]']) { assert.equal(analyticsEnabled({ ...base, hostname: h }), false); assert.equal(analyticsEnabled({ ...base, hostname: h, debug: true }), true); }
  assert.equal(analyticsEnabled({ ...base, hostname: 'localhost', debug: true, optIn: false }), false);
  assert.equal(analyticsEnabled(), false);
});

test('track: sends through gtag, dedupes within the window, honours opt-out/DNT/localhost, never throws', () => {
  const win = fakeWin(); let t = 0, opt = true;
  const a = createAnalytics({ win, getOptIn: () => opt, now: () => t });
  assert.equal(a.track('race_start', { track: 'neonloop', laps: 3 }), true);
  assert.deepEqual(win.calls[0], ['event', 'race_start', { track: 'neonloop', laps: 3 }]);
  assert.equal(a.track('race_start', { track: 'neonloop', laps: 3 }), false, 'duplicate within window');
  t = 2000; assert.equal(a.track('race_start', { track: 'neonloop', laps: 3 }), true);
  assert.equal(a.track('race_start', { track: 'foundry', laps: 3 }), true, 'different params are not duplicates');
  opt = false; assert.equal(a.track('x', {}), false);
  opt = true;
  assert.equal(createAnalytics({ win: fakeWin({ navigator: { doNotTrack: '1' } }) }).track('x'), false);
  assert.equal(createAnalytics({ win: fakeWin({ location: { hostname: 'localhost', search: '' } }) }).track('x'), false);
  const dbg = fakeWin({ location: { hostname: 'localhost', search: '?ga=debug' } }); assert.equal(createAnalytics({ win: dbg }).track('x', { a: 1 }), true); assert.equal(dbg.calls.length, 1);
  assert.equal(createAnalytics({ win: null }).track('x'), false);
  assert.equal(createAnalytics({ win: { location: {}, gtag() { throw new Error('boom'); } } }).track('x'), false);
  assert.doesNotThrow(() => createAnalytics({ win: {} }).setOptIn(false));
  const w2 = fakeWin(); createAnalytics({ win: w2 }).setOptIn(false);
  assert.deepEqual(w2.calls[0], ['consent', 'update', { analytics_storage: 'denied' }]);
});

const cfg = { trackId: 'neonloop', laps: 3, mode: 'race', player: { carId: 'hammer', loadout: [{ id: 'machinegun', ammo: 9 }, { id: 'guided', ammo: 4 }] }, rivals: [1, 2, 3, 4, 5] };
test('event builders from a fake race result', () => {
  assert.equal(weaponsString(cfg.player.loadout), 'machinegun+guided');
  assert.deepEqual(raceStartEvent({ config: cfg, quality: 'med' }), { name: 'race_start', params: { track: 'neonloop', car: 'hammer', laps: 3, field_size: 6, mode: 'race', quality: 'med', weapons: 'machinegun+guided' } });
  const fin = raceFinishEvent({ config: cfg, result: { finishOrder: new Array(6).fill(0) }, summary: { position: 2, time: 101.234, kills: 2, wrecked: false, total: 2900, damageFraction: 0.376 }, quality: 'med', stats: { shots: { machinegun: 120, guided: 3, rocket: 0 }, wrecks: 2 } });
  assert.equal(fin.name, 'race_finish');
  assert.deepEqual(fin.params, { track: 'neonloop', car: 'hammer', position: 2, field_size: 6, mode: 'race', time_s: 101.2, kills: 2, wrecked: 0, prize: 2900, damage_pct: 38, wrecks_total: 2, quality: 'med', shots_machinegun: 120, shots_guided: 3 });
  assert.equal(raceFinishEvent({ config: cfg, result: { finishOrder: [0] }, summary: { position: 1, time: null, wrecked: true }, quality: 'low' }).params.time_s, 0);
  assert.deepEqual(raceQuitEvent({ config: cfg, lap: 2, time: 55.55 }).params, { track: 'neonloop', car: 'hammer', lap: 2, time_s: 55.6 });
  assert.deepEqual(purchaseEvent({ kind: 'spikes', id: 'front', cost: 1600, balance: 3400, level: 1 }).params, { item_type: 'spikes', item_id: 'front', level: 1, price: 1600, balance_after: 3400 });
  assert.equal(errorEvent('Boom\nstack line').params.message, 'Boom'); assert.equal(fpsReportEvent({ config: cfg, avgFps: 59.6, quality: 'med', frames: 900 }).params.fps_avg, 60);
  const evs = settingChangeEvents({ quality: 'med', master: 0.7, nameplates: true, analytics: true }, { quality: 'high', master: 0.72, nameplates: false, analytics: false });
  assert.deepEqual(evs.map((e) => e.params), [{ key: 'quality', value: 'high' }, { key: 'nameplates', value: false }]);
});

test('settings: analytics defaults on and normalises', () => {
  assert.equal(DEFAULT_SETTINGS.analytics, true);
  assert.equal(normalizeSettings({ analytics: false }).analytics, false); assert.equal(normalizeSettings({ analytics: 'x' }).analytics, true);
});

test('wiring: bus events become analytics calls; shots/wrecks are aggregated; no per-shot events', () => {
  const bus = createEventBus(), simBus = createEventBus(), sent = [];
  const game = { bus, settings: { quality: 'med' }, perf: { sum: 0, n: 0 }, sim: { events: simBus }, getSnapshot: () => ({ t: 40, cars: [{ lap: 2 }] }) };
  const analytics = { track: (n, p) => sent.push([n, p]) };
  attachAnalytics(game, { analytics, version: '0.5.0', touch: false, setTimer: (f) => { f(); return 1; }, clearTimer: () => {} });
  bus.emit('game:new'); bus.emit('car:chosen', { carId: 'wasp' }); bus.emit('race:setup', { trackId: 'foundry' }); bus.emit('race:setup', { trackId: 'foundry' });
  bus.emit('livery:changed', { paint: 'gold', accent: 'cyan' });
  bus.emit('purchase', { kind: 'weapon', id: 'guided', cost: 3400, balance: 100, level: 0 });
  bus.emit('race:created', { config: cfg });
  for (let i = 0; i < 50; i++) simBus.emit('shot', { carId: 0, weaponId: 'machinegun' }); simBus.emit('shot', { carId: 2, weaponId: 'rocket' }); simBus.emit('wreck', { carId: 3 });
  game.perf.sum = 60 * 100; game.perf.n = 100;
  bus.emit('race:finished', { result: { finishOrder: new Array(6).fill(0) }, summary: { position: 1, time: 90, kills: 1, wrecked: false, total: 4000, damageFraction: 0 } });
  const names = sent.map((s) => s[0]);
  assert.deepEqual(names, ['app_start', 'new_game', 'car_select', 'track_select', 'paint_change', 'purchase', 'race_start', 'race_finish', 'fps_report']);
  const fin = sent.find((s) => s[0] === 'race_finish')[1];
  assert.equal(fin.shots_machinegun, 50); assert.equal(fin.wrecks_total, 1); assert.ok(!('shots_rocket' in fin));
  assert.equal(sent.find((s) => s[0] === 'fps_report')[1].fps_avg, 60);
  sent.length = 0;
  bus.emit('race:created', { config: cfg }); bus.emit('flow:state', { from: 'race', to: 'garage' });
  assert.deepEqual(sent.map((s) => s[0]), ['race_start', 'race_quit']); assert.equal(sent[1][1].lap, 2);
  sent.length = 0; bus.emit('flow:state', { from: 'title', to: 'garage' }); assert.deepEqual(sent.map((s) => s[0]), ['continue_game']);
});
