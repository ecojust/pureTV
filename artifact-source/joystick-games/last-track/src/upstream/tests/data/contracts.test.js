import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_PATRONS, CONTRACT_MAX_QUOTA, offersFor, quotaFor, targetsFor, contractHits, contractProgress } from '../../src/data/contracts.js';
import { acceptContract, settleContract } from '../../src/data/economy.js';
import { defaultSave, createSaveStore, SAVE_KEY } from '../../src/data/saveStore.js';
import { createMemoryStorage } from '../../src/core/storage.js';

const military = CONTRACT_PATRONS.find((p) => p.id === 'military');
const mafia = CONTRACT_PATRONS.find((p) => p.id === 'mafia');
const FIELD = ['vex', 'fuse', 'kane', 'cinder', 'rust'];   // the racers on the grid of the track just chosen
const withContract = (save, targets, patron = 'military') => ({ ...save, contract: { patron, quota: targets.length, targets } });

test('the board names racers from the field: one bid per patron, quota 1..3 rotating with races run', () => {
  for (let races = 0; races < 7; races++) {
    const offers = offersFor({ ...defaultSave(), races }, FIELD);
    assert.deepEqual(offers.map((o) => o.patron), ['military', 'mafia']);
    for (const o of offers) {
      const p = CONTRACT_PATRONS.find((x) => x.id === o.patron);
      assert.ok(o.quota >= 1 && o.quota <= CONTRACT_MAX_QUOTA, `quota ${o.quota}`);
      assert.equal(o.targets.length, o.quota);
      assert.equal(new Set(o.targets).size, o.quota, 'the named racers are distinct');
      assert.ok(o.targets.every((t) => FIELD.includes(t)), 'the named racers are on this grid');
      assert.equal(o.bounty, o.quota * p.perKill);
      assert.equal(o.penalty, p.penalty);
    }
  }
  assert.deepEqual(offersFor({ ...defaultSave(), races: 0 }, FIELD).map((o) => o.quota), [1, 2]);
  assert.deepEqual(offersFor({ ...defaultSave(), races: 2 }, FIELD).map((o) => o.quota), [3, 1]);
  assert.equal(quotaFor({ races: 5 }, military), 3);
  // the penalty is the small one: well under a single racer's bounty
  assert.ok(CONTRACT_PATRONS.every((p) => p.penalty < p.perKill));
});

test('no track, no bids: the board is empty until the chosen track has a field', () => {
  assert.deepEqual(offersFor(defaultSave()), []);
  assert.deepEqual(offersFor(defaultSave(), []), []);
});

test('named racers are pure and never outnumber the field', () => {
  const save = { ...defaultSave(), races: 2 };
  assert.deepEqual(targetsFor(save, military, FIELD), targetsFor(save, military, FIELD));
  const pair = ['vex', 'fuse'];
  for (const o of offersFor(save, pair)) assert.ok(o.quota <= pair.length && o.targets.every((t) => pair.includes(t)));
});

test('accepting locks the bid in with its named racers; one contract at a time; unknown patrons and empty fields are refused', () => {
  const save = defaultSave();
  const r = acceptContract(save, 'mafia', FIELD);
  assert.equal(r.ok, true);
  const offer = offersFor(save, FIELD).find((o) => o.patron === 'mafia');
  assert.deepEqual(r.save.contract, { patron: 'mafia', quota: offer.quota, targets: offer.targets });
  assert.equal(save.contract, null, 'input untouched');
  assert.deepEqual(acceptContract(r.save, 'military', FIELD), { ok: false, save: r.save, error: 'contract-active' });
  assert.equal(acceptContract(save, 'nobody', FIELD).error, 'unknown-patron');
  assert.equal(acceptContract(save, 'mafia', []).error, 'no-field');
});

test('settling: every named racer wrecked pays the bounty and clears the contract; unnamed wrecks do not matter', () => {
  const save = { ...withContract(defaultSave(), ['vex', 'fuse']), cash: 5000 };
  const win = settleContract(save, { mode: 'race', wrecked: ['fuse', 'cinder', 'vex'] });
  assert.equal(win.save.cash, 5000 + 2 * military.perKill);
  assert.equal(win.save.contract, null);
  assert.equal(win.settled.complete, true);
  assert.equal(win.settled.hit, 2);
  assert.equal(win.settled.bounty, 2000); assert.equal(win.settled.penalty, 0); assert.equal(win.settled.net, 2000);
});

test('settling: missing any named racer takes the small penalty, however many others were wrecked', () => {
  const save = { ...withContract(defaultSave(), ['vex', 'fuse']), cash: 5000 };
  const miss = settleContract(save, { mode: 'race', wrecked: ['vex', 'kane', 'cinder', 'rust'] });
  assert.equal(miss.save.cash, 5000 - military.penalty);
  assert.equal(miss.save.contract, null);
  assert.deepEqual([miss.settled.complete, miss.settled.hit, miss.settled.bounty, miss.settled.penalty, miss.settled.net], [false, 1, 0, military.penalty, -military.penalty]);
  const broke = settleContract({ ...save, cash: 120 }, { mode: 'race', wrecked: [] });
  assert.equal(broke.save.cash, 0); assert.equal(broke.settled.penalty, 120); assert.equal(broke.settled.net, -120);
});

test('practice and no-contract races leave everything alone', () => {
  const save = withContract(defaultSave(), ['vex'], 'mafia');
  const prac = settleContract(save, { mode: 'practice', wrecked: ['vex'] });
  assert.equal(prac.settled, null); assert.deepEqual(prac.save, save);
  const none = settleContract(defaultSave(), { mode: 'race', wrecked: ['vex'] });
  assert.equal(none.settled, null);
});

test('HUD progress counts only the named racers the player has wrecked', () => {
  const c = { patron: 'mafia', quota: 2, targets: ['vex', 'fuse'] };
  assert.equal(contractProgress(c, []), 'WRECK 0/2');
  assert.equal(contractProgress(c, ['kane']), 'WRECK 0/2', 'an unnamed wreck does not count');
  assert.equal(contractProgress(c, ['vex']), 'WRECK 1/2');
  assert.equal(contractProgress(c, ['fuse', 'vex', 'fuse']), 'WRECK 2/2');
  assert.equal(contractHits(c, ['vex', 'fuse']), 2);
  assert.equal(contractProgress(null, ['vex']), '');
});

test('save: a valid contract survives a round trip; malformed ones (no named racers, legacy quota-only) are dropped', () => {
  const store = createSaveStore(createMemoryStorage());
  store.save(withContract(defaultSave(), ['vex', 'fuse', 'kane'], 'military'));
  assert.deepEqual(store.load().contract, { patron: 'military', quota: 3, targets: ['vex', 'fuse', 'kane'] });
  const bad = [
    { patron: 'nobody', targets: ['vex'] }, { patron: 'mafia', targets: [] }, { patron: 'mafia', targets: ['vex', 'fuse', 'kane', 'cinder'] },
    { patron: 'mafia', targets: ['not-a-driver'] }, { patron: 'mafia', targets: 'vex' }, { patron: 'mafia', quota: 2 }, 'mafia', null,
  ];
  for (const c of bad) {
    const st = createMemoryStorage();
    st.setItem(SAVE_KEY, JSON.stringify({ ...defaultSave(), contract: c }));
    assert.equal(createSaveStore(st).load().contract, null, JSON.stringify(c));
  }
  assert.equal(defaultSave().contract, null);
});
