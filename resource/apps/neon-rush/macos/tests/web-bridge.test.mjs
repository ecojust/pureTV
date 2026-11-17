import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../Web/bridge.js', import.meta.url), 'utf8');
function createBridge() {
  const messages = [], events = {}, roomInfos = [], suspension = [];
  class Storage {
    constructor() { this.values = new Map(); }
    setItem(key, value) { this.values.set(String(key), String(value)); }
    getItem(key) { return this.values.get(String(key)) ?? null; }
  }
  const window = {
    navigator: { language: 'en-US' }, Storage, localStorage: new Storage(),
    document: { addEventListener(name, callback) { events[name] = callback; } },
    webkit: { messageHandlers: { neonHost: { postMessage(message) { messages.push(JSON.parse(JSON.stringify(message))); } } } },
    PureGame: { roomInfo(value) { roomInfos.push(value); }, suspend(value) { suspension.push(value); } },
  };
  vm.runInNewContext(source, { window });
  return { ...window, window, messages, events, roomInfos, suspension, sample: () => JSON.parse(window.PureGameHost.snapshot()).players[0] };
}
const info = { language: 'zh', wifiController: { state: 'available', port: 8765 } };
function room(revision, overrides = {}, id = 'one', session = 1) {
  return { revision, players: [{ id: 1, controllerId: id, session, connected: true, cancelSeq: 0, x: 0, y: 0, a: false, b: false, start: false, pulseCounters: { a: 0, b: 0, start: 0, left: 0, right: 0, up: 0, down: 0 }, ...overrides }] };
}
function init() { const b = createBridge(); b.NeonDesktop.receive(info, { revision: 0, players: [] }); return b; }

test('native hello + held sync is neutral for actions; directions remain available', () => {
  const b = init();
  b.NeonDesktop.receive(info, room(1, { x: 1, y: -1 }));
  assert.deepEqual({ x: b.sample().x, a: b.sample().a, start: b.sample().start }, { x: 1, a: false, start: false });
});

test('a fast genuine tap delivered after release survives for one runtime frame', () => {
  const b = init();
  b.NeonDesktop.receive(info, room(1));
  b.NeonDesktop.receive(info, room(2, { pulseCounters: { a: 1 } }));
  assert.equal(b.sample().a, true);
  assert.equal(b.sample().a, false);
  b.NeonDesktop.receive(info, room(2, { pulseCounters: { a: 1 } }));
  assert.equal(b.sample().a, false, 'duplicate native push must not replay the tap');
});

test('early first-connection START is retained even if hello and tap share a native delivery', () => {
  const b = init();
  b.NeonDesktop.receive(info, room(3, { pulseCounters: { start: 1 } }));
  assert.equal(b.sample().start, true);
  assert.equal(b.sample().start, false);
});

test('genuine long hold remains held until native release without retriggering counters', () => {
  const b = init();
  b.NeonDesktop.receive(info, room(1));
  b.NeonDesktop.receive(info, room(2, { a: true, pulseCounters: { a: 1 } }));
  assert.equal(b.sample().a, true); assert.equal(b.sample().a, true);
  b.NeonDesktop.receive(info, room(3, { a: true, pulseCounters: { a: 1 } }));
  assert.equal(b.sample().a, true);
  b.NeonDesktop.receive(info, room(4, { pulseCounters: { a: 1 } }));
  assert.equal(b.sample().a, false);
});

test('direction tap survives asynchronous native delivery for menu navigation', () => {
  const b = init(); b.NeonDesktop.receive(info, room(1));
  b.NeonDesktop.receive(info, room(2, { pulseCounters: { right: 1, down: 1 } }));
  const first = b.sample(); assert.equal(first.x, 1); assert.equal(first.y, 1);
  const second = b.sample(); assert.equal(second.x, 0); assert.equal(second.y, 0);
});

test('out-of-order native pushes cannot restore a disconnected controller', () => {
  const b = init(); b.NeonDesktop.receive(info, room(1, { x: -1 }));
  b.NeonDesktop.receive(info, { revision: 3, players: [] });
  assert.equal(b.NeonDesktop.receive(info, room(2, { a: true })), false);
  assert.equal(b.sample(), undefined);
});

test('replacement and reconnect discard stale pulses and quarantine held START', () => {
  const b = init(); b.NeonDesktop.receive(info, room(1));
  b.NeonDesktop.receive(info, room(2, { start: true, pulseCounters: { start: 1 } }, 'one', 2));
  assert.equal(b.sample().start, false);
  b.NeonDesktop.receive(info, room(3, { start: true, pulseCounters: { start: 1 } }, 'one', 2));
  assert.equal(b.sample().start, false);
  b.NeonDesktop.receive(info, room(4, { pulseCounters: { start: 1 } }, 'one', 2));
  b.NeonDesktop.receive(info, room(5, { pulseCounters: { start: 2 } }, 'one', 2));
  assert.equal(b.sample().start, true);
});

test('cancellation clears queued drift without synthesizing a rewarded release', () => {
  const b = init(); b.NeonDesktop.receive(info, room(1));
  b.NeonDesktop.receive(info, room(2, { pulseCounters: { a: 1 } }));
  b.NeonDesktop.receive(info, room(3, { cancelSeq: 1, pulseCounters: { a: 1 } }));
  const sample = b.sample(); assert.equal(sample.a, false); assert.equal(sample.cancelSeq, 1);
});

test('page reload snapshots baseline historical pulses and quarantine a held action', () => {
  const b = createBridge();
  b.NeonDesktop.receive(info, room(30, { a: true, start: true, pulseCounters: { a: 4, start: 2 } }));
  const sample = b.sample(); assert.equal(sample.a, false); assert.equal(sample.start, false);
  b.NeonDesktop.receive(info, room(31, { a: true, pulseCounters: { a: 4, start: 2 } }));
  assert.equal(b.sample().a, false);
  b.NeonDesktop.receive(info, room(32, { pulseCounters: { a: 4, start: 2 } }));
  b.NeonDesktop.receive(info, room(33, { pulseCounters: { a: 5, start: 2 } }));
  assert.equal(b.sample().a, true);
});

test('suspension clears inputs and rejects already-queued snapshots; foreground does not auto-resume', () => {
  const b = init(); b.NeonDesktop.receive(info, room(1, { a: true }));
  b.NeonDesktop.suspend(); assert.equal(b.sample(), undefined);
  assert.deepEqual(b.suspension, [true]);
  assert.equal(b.NeonDesktop.receive(info, room(1, { a: true })), false);
  b.NeonDesktop.receive(info, { revision: 2, players: [] });
  assert.equal(b.sample(), undefined);
  assert.deepEqual(b.suspension, [true]);
});

test('saved native preferences seed once without echo and only supported changes persist', () => {
  const b = createBridge();
  b.NeonDesktop.receive({ ...info, preferences: { 'neon-rush.language': 'en', 'puretv.neon-rush.best': '1200' } }, { revision: 0, players: [] });
  assert.equal(b.localStorage.getItem('neon-rush.language'), 'en');
  assert.deepEqual(b.messages, []);
  b.localStorage.setItem('neon-rush.language', 'zh');
  b.localStorage.setItem('unknown', 'do not send');
  b.localStorage.setItem('puretv.neon-rush.best', '-8');
  b.NeonDesktop.receive({ ...info, preferences: { 'neon-rush.language': 'en' } }, { revision: 1, players: [] });
  assert.equal(b.localStorage.getItem('neon-rush.language'), 'zh');
  assert.deepEqual(b.messages, [{ type: 'preference', key: 'neon-rush.language', value: 'zh' }]);
});

test('ready and publish messages use the documented envelope with bounded JSON', () => {
  const b = init(); b.events.DOMContentLoaded();
  b.PureGameHost.publish('{"phase":"playing"}');
  b.PureGameHost.publish('invalid'); b.PureGameHost.publish('x'.repeat(9000));
  assert.deepEqual(b.messages, [{ type: 'ready' }, { type: 'publish', value: { phase: 'playing' } }]);
});

test('foreground discovery updates at the suspended revision without reviving input', () => {
  const b = init(); b.NeonDesktop.receive(info, room(1, { a: true }));
  b.NeonDesktop.suspend();
  const available = { language: 'zh', wifiController: { state: 'available', port: 9102, serviceName: 'Neon Rush' } };
  assert.equal(b.NeonDesktop.receive(available, room(1, { a: true })), false);
  assert.equal(JSON.parse(b.PureGameHost.getInfo()).wifiController.port, 9102);
  assert.equal(b.sample(), undefined);
  assert.deepEqual(b.suspension, [true]);
});


test('background TCP messages update discovery but cannot queue gameplay, even with newer revisions', () => {
  const b = init(); b.NeonDesktop.receive(info, room(1));
  b.NeonDesktop.receive(info, room(2, { a: true, pulseCounters: { a: 1 } }));
  const disabled = { ...info, wifiController: { state: 'available', port: 8765, inputEnabled: false } };
  b.NeonDesktop.receive(disabled, room(3, { cancelSeq: 1, pulseCounters: { a: 1 } }));
  b.NeonDesktop.receive(disabled, room(4, { x: 1, start: true, pulseCounters: { a: 1, start: 1 } }));
  assert.equal(b.sample(), undefined);
  assert.equal(JSON.parse(b.PureGameHost.getInfo()).wifiController.port, 8765);
  assert.deepEqual(b.suspension, [true], 'Repeated background delivery does not repeatedly suspend the game');
  assert.equal(b.NeonDesktop.receive(info, room(2, { start: true })), false);
  b.NeonDesktop.receive(info, room(5, { cancelSeq: 2, pulseCounters: { a: 1, start: 1 } }));
  assert.equal(b.sample().start, false, 'Returning to foreground never replays a background START');
  b.NeonDesktop.receive(info, room(6, { cancelSeq: 2, pulseCounters: { a: 1, start: 2 } }));
  assert.equal(b.sample().start, true, 'A fresh foreground action works on the same connection');
  assert.deepEqual(b.suspension, [true], 'Foreground delivery does not auto-resume');
});
