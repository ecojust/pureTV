import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/upstream/src/ui/input.js';

function setup() {
  const win = new EventTarget(), doc = new EventTarget(); doc.hidden = false;
  globalThis.window = win; globalThis.document = doc;
  const input = createInput({ target: win, isRaceActive: () => true });
  const send = (type, code) => { const event = new Event(type); Object.assign(event, { code, repeat: false }); win.dispatchEvent(event); };
  const pulse = code => { send('keydown', code); send('keyup', code); };
  return { win, doc, input, send, pulse, close() { input.dispose(); delete globalThis.window; delete globalThis.document; } };
}

test('short independent fire, cycle and nitro presses survive until the next physics read, then consume once', () => {
  const h = setup();
  try {
    h.pulse('Space'); h.pulse('KeyE'); h.pulse('KeyF');
    assert.equal(h.input.pressed.size, 0, 'buttons have already been released between physics steps');
    const first = h.input.read();
    assert.equal(first.fire, true); assert.equal(first.cycleWeapon, true); assert.equal(first.nitro, true);
    const second = h.input.read();
    assert.equal(second.fire, false); assert.equal(second.cycleWeapon, false); assert.equal(second.nitro, false);
  } finally { h.close(); }
});

test('clear, blur and background discard pending action edges and held drift without firing on resume', () => {
  for (const cancel of [h => h.input.clear(), h => h.win.dispatchEvent(new Event('blur')), h => { h.doc.hidden = true; h.doc.dispatchEvent(new Event('visibilitychange')); }]) {
    const h = setup();
    try {
      h.pulse('Space'); h.pulse('KeyE'); h.pulse('KeyF'); h.send('keydown', 'ShiftLeft');
      cancel(h);
      const next = h.input.read();
      assert.equal(next.fire, false); assert.equal(next.cycleWeapon, false); assert.equal(next.nitro, false); assert.equal(next.handbrake, false);
    } finally { h.close(); }
  }
});

test('holding fire remains held across physics steps and does not replace simultaneous steering/drift', () => {
  const h = setup();
  try {
    for (const code of ['Space', 'ArrowRight', 'ShiftLeft']) h.send('keydown', code);
    for (let i = 0; i < 3; i++) { const value = h.input.read(); assert.equal(value.fire, true); assert.equal(value.steer, 1); assert.equal(value.handbrake, true); }
    for (const code of ['Space', 'ArrowRight', 'ShiftLeft']) h.send('keyup', code);
    const value = h.input.read(); assert.equal(value.fire, false); assert.equal(value.steer, 0); assert.equal(value.handbrake, false);
  } finally { h.close(); }
});
