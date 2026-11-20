import test from 'node:test';
import assert from 'node:assert/strict';
import { portraitSpec, HAIR_STYLES, EXPRESSIONS } from '../../src/render/portraits.js';
import { DRIVERS } from '../../src/data/drivers.js';

const byId = (id) => DRIVERS.find((d) => d.id === id);

test('the new pilots look the way their bios say: bob and calm, braid and grin, ponytail and a wink', () => {
  const glass = portraitSpec(byId('glass')), ruin = portraitSpec(byId('ruin')), kit = portraitSpec(byId('kit'));
  assert.equal(glass.style, 'bob'); assert.equal(glass.expr, 'calm'); assert.equal(glass.earring, 'stud'); assert.equal(glass.headset, false);
  assert.equal(ruin.style, 'braid'); assert.equal(ruin.expr, 'grin'); assert.equal(ruin.freckles.length, 12); assert.ok(ruin.scar);
  assert.equal(kit.style, 'ponytail'); assert.equal(kit.expr, 'wink'); assert.equal(kit.headset, true);
  assert.equal(glass.lip, '#9a3b5a');
});

test('every look names a real hair style and expression; the masc look has no lipstick or eyeshadow', () => {
  for (const d of DRIVERS) {
    const sp = portraitSpec(d);
    assert.ok(HAIR_STYLES.includes(sp.style), d.id);
    assert.ok(EXPRESSIONS.includes(sp.expr), d.id);
    assert.match(sp.skin.base, /^#[0-9a-f]{6}$/);
    assert.match(sp.lip, /^#[0-9a-f]{6}$/);
  }
  const kane = portraitSpec(byId('kane')), cinder = portraitSpec(byId('cinder'));
  assert.equal(kane.masc, true); assert.equal(kane.lashes, false); assert.equal(cinder.beard, 'full');
});

test('the look overrides win over the seed; a driver with no look still gets a full spec', () => {
  const sp = portraitSpec({ id: 'bare', portrait: { seed: 42, skin: 15, hair: 4, accent: 8 } });
  assert.ok(HAIR_STYLES.includes(sp.style) && EXPRESSIONS.includes(sp.expr));
  assert.equal(sp.lashes, true);
  assert.equal(sp.earring === 'hoop' || sp.earring === 'stud', true);
  assert.equal(portraitSpec(byId('glass')).iris, '#8fb8d8');
});
