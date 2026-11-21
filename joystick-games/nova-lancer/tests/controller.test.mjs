import test from 'node:test';
import assert from 'node:assert/strict';
import { createInputReducer } from '../../shared/web/input.js';
import { applyControllerFrame } from '../src/tv-controller.js';

for (const transport of ['phone', 'wifi']) {
  test(transport + ': a held resume press is not another pause after local input clears', () => {
    const reducer = createInputReducer();
    const held = new Set(), justDown = new Set(), justUp = new Set();
    const player = { id:1, connected:true, transport, controllerId:'test', session:'1', cancelSeq:0 };
    function sample(start) {
      const p = transport === 'wifi' ? { ...player, buttons:{ START:start } }
        : { ...player, x:0, y:0, start, a:false, b:false, select:false };
      justDown.clear(); justUp.clear();
      applyControllerFrame(reducer.read({ players:[p] }), held, justDown, justUp);
    }
    sample(false);
    sample(true);
    assert.deepEqual([...justDown], ['TVSTART']);
    held.clear(); // resume() calls Input.clearAll() on this same frame
    for (let i=0; i<12; i++) {
      sample(true);
      assert.equal(justDown.size, 0);
      assert.equal(held.has('TVSTART'), false);
    }
    sample(false);
    assert.equal(justUp.size, 0);
    sample(true);
    assert.deepEqual([...justDown], ['TVSTART']);
  });
}

test('a held roll chord also needs a new physical edge after local input clears', () => {
  const held = new Set(), down = new Set(), up = new Set();
  const buttons = { X:true, LEFT:true };
  applyControllerFrame({buttons, pressed:buttons}, held, down, up);
  assert.ok(down.has('TVRollL'));
  held.clear(); down.clear();
  applyControllerFrame({buttons, pressed:{}}, held, down, up);
  assert.equal(down.size, 0);
});
