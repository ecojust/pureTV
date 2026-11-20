const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const code = readFileSync(join(__dirname, 'pc-bridge.js'), 'utf8');

function desktop(family) {
  const listeners = {};
  let stream;
  const sandbox = {
    pureTVPCConfig: {
      alias: family === 'legacy' ? 'TetrisHost' : null,
      gameKit: family === 'kit',
      info: { language: 'en', wifiController: {} }
    },
    document: { hidden: false, addEventListener() {} },
    addEventListener(name, fn) { listeners[name] = fn; },
    EventSource: class {
      constructor() { stream = this; }
      close() { this.closed = true; }
    }
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox);
  return {
    event: (revision, players) => stream.onmessage({data: JSON.stringify({revision, players})}),
    snapshot: () => JSON.parse(sandbox.PureGameHost.snapshot()),
    info: () => JSON.parse(sandbox.PureGameHost.getInfo()),
    listeners,
    stream: () => stream,
  };
}

const player = (id, buttons = {}, counters = {}, session = 'first') => ({
  id, connected: true, controllerId: 'test-' + id, session, cancelSeq: 1,
  buttons, buttonCounters: counters,
});

test('legacy, Game Kit, and nine-button games preserve the signed host mappings', () => {
  for (const [family, expected] of [
    ['legacy', [true, false, true]], ['kit', [true, true, false]], ['standalone', [false, false, true]]
  ]) {
    const pc = desktop(family);
    pc.event(0, []);
    pc.event(1, [player(1, {X: true, Y: true}, {X: 1, Y: 1})]);
    const input = pc.snapshot().players[0];
    assert.deepEqual([input.a, input.b, input.select], expected);
    assert.equal(input.buttons.X, true);
    assert.equal(input.buttons.Y, true);
    assert.equal(pc.info().wifiController.connected, true);
  }
});

test('separate seats retain a short pulse and quarantine held input after focus loss', () => {
  const pc = desktop('legacy');
  pc.event(0, []);
  pc.event(1, [player(1), player(2)]);
  pc.event(2, [player(1, {}, {A: 1}), player(2, {RIGHT: true}, {RIGHT: 1})]);
  let [first, second] = pc.snapshot().players;
  assert.equal(first.a, true);
  assert.equal(second.a, false);
  assert.equal(second.x, 1);
  assert.equal(pc.snapshot().players[0].a, false);
  pc.listeners.blur();
  pc.listeners.focus();
  assert.equal(pc.snapshot().players[1].x, 0);
  pc.event(3, [player(1, {}, {A: 1}), player(2, {}, {RIGHT: 1})]);
  pc.event(4, [player(1, {}, {A: 1}), player(2, {RIGHT: true}, {RIGHT: 2})]);
  assert.equal(pc.snapshot().players[1].x, 1);
});

test('reloading an existing room baselines previous counts and closes the old event stream', () => {
  const pc = desktop('legacy');
  pc.event(92, [player(1, {START: true}, {A: 8, START: 5})]);
  const first = pc.snapshot().players[0];
  assert.equal(first.start, false);
  assert.equal(first.a, false);
  const previous = pc.stream();
  pc.listeners.pagehide();
  assert.equal(previous.closed, true);
  pc.listeners.pageshow();
  assert.notEqual(pc.stream(), previous);
});
