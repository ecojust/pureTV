import test from 'node:test';
import assert from 'node:assert/strict';
import { bidSummary, racerNames } from '../../src/ui/screens/raceSettings.js';
import { createFlowMachine } from '../../src/ui/flowMachine.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { offersFor } from '../../src/data/contracts.js';
import { gridIds } from '../../src/data/sliceConfig.js';

const FIELD = ['vex', 'fuse', 'kane', 'cinder', 'rust'];   // the racers on the grid of the track just chosen
const race = { mode: 'race', bid: 'military', field: FIELD };

test('bid line: none, race with a bid naming racers on the grid, practice with a bid, and a contract already running', () => {
  const save = { ...defaultSave(), races: 1 };   // after one race the military board names 2 racers
  const named = offersFor(save, FIELD).find((o) => o.patron === 'military').targets;
  assert.equal(named.length, 2);
  assert.equal(bidSummary({ mode: 'race', bid: null, field: FIELD }, save), 'No bid: prize and kill bonus only.');
  assert.equal(bidSummary(race, save), `Federal Motor Corps: wreck ${racerNames(named)} for +$2,000, or −$300 if you miss.`);
  assert.match(bidSummary({ mode: 'practice', bid: 'mafia', practiceRivals: true, field: FIELD }, save), /Practice ignores bids, so this one is not taken\.$/);
  assert.match(bidSummary(race, { ...save, contract: { patron: 'mafia', quota: 1, targets: ['vex'] } }), /already running/);
});

test('a bid names only racers on this race\'s grid: practice without rivals has none, so it names no one', () => {
  const save = { ...defaultSave(), races: 1 };
  assert.equal(bidSummary({ mode: 'practice', bid: 'mafia', field: FIELD }, save), 'Practice without rivals: nobody on the grid to wreck, so no bid is named.');
  for (const setup of [race, { mode: 'practice', bid: 'mafia', practiceRivals: true, field: FIELD }]) {
    const named = offersFor(save, gridIds(setup)).find((o) => o.patron === setup.bid)?.targets || [];
    assert.ok(named.length && named.every((id) => gridIds(setup).includes(id)));
  }
});

test('a contract running in practice: its racers race here, and only a race settles it', () => {
  const save = { ...defaultSave(), contract: { patron: 'mafia', quota: 1, targets: ['vex'] } };
  assert.match(bidSummary({ mode: 'practice', bid: null, practiceRivals: false, field: FIELD }, save), /only a race settles it\.$/);
});

test('no track, no bid: a bid is never taken before the chosen track has racers', () => {
  assert.equal(bidSummary({ mode: 'race', bid: 'military' }, defaultSave()), 'No bid: prize and kill bonus only.');
  assert.equal(bidSummary({ mode: 'race', bid: 'military', field: [] }, defaultSave()), 'No bid: prize and kill bonus only.');
});

test('the named racers read as a list, by their driver names', () => {
  assert.equal(racerNames(['vex', 'fuse']), 'Vex Calloway & Doc Fuse');
  assert.equal(racerNames(['nobody']), 'nobody');
});

test('the wizard sits between track select and the race: track, then settings, then loading', () => {
  const f = createFlowMachine({ initial: 'garage' });
  for (const s of ['trackSelect', 'raceSettings', 'loading', 'race']) assert.equal(f.transition(s), true, s);
  assert.equal(createFlowMachine({ initial: 'raceSettings' }).canTransition('shop'), false);
});
