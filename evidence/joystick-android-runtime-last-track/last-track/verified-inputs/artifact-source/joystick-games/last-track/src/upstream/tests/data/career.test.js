import test from 'node:test';
import assert from 'node:assert/strict';
import { WIN_TRACK_IDS, allTracksPassed, winDue, careerScore, finalStats } from '../../src/data/career.js';
import { applyRaceResult, settleContract, earnedOf, KILL_BONUS } from '../../src/data/economy.js';
import { defaultSave, normalizeSave } from '../../src/data/saveStore.js';
import { getPatron } from '../../src/data/contracts.js';
import { GAME_TRACKS } from '../../src/data/tracks/index.js';

const ALL = ['neonloop', 'foundry', 'daylite'];
const res = (trackId, position, { kills = 0, wrecked = false } = {}) => ({
  trackId, laps: 3, finishOrder: [],
  player: { position, time: wrecked ? null : 100, kills, wrecked, damageFraction: 0, ammoLeft: [], pickupCash: 0 },
});

test('win tracks are the game tracks (the ones the track select lists)', () => {
  assert.deepEqual(WIN_TRACK_IDS, GAME_TRACKS.map((t) => t.id));
  assert.deepEqual(WIN_TRACK_IDS, ALL);
});

test('allTracksPassed: needs every track; an empty list never counts as passed', () => {
  assert.equal(allTracksPassed([], ALL), false);
  assert.equal(allTracksPassed(['neonloop', 'foundry'], ALL), false);
  assert.equal(allTracksPassed(['daylite', 'foundry', 'neonloop'], ALL), true);
  assert.equal(allTracksPassed(['neonloop'], []), false);
  assert.equal(allTracksPassed(ALL, ['mojave']), false, 'a track outside the set does not count');
});

test('winDue: the race that adds the last missing pass wins, once per save', () => {
  const fresh = defaultSave();
  assert.equal(winDue(fresh, ALL, ALL), true, 'the last pass wins the career');
  assert.equal(winDue(fresh, ['neonloop', 'foundry'], ALL), false, 'still one track missing');
  assert.equal(winDue(fresh, [], ALL), false, 'no passes, no win');
  assert.equal(winDue({ ...fresh, winShown: true }, ALL, ALL), false, 'the win was already shown on this save');
});

test('winDue: an older save that already passed every track wins on its next race, once', () => {
  const legacy = normalizeSave({ passedTracks: ALL });   // no winShown field: it predates the win screen
  assert.equal(legacy.winShown, false);
  assert.equal(winDue(legacy, legacy.passedTracks, ALL), true, 'the next race shows the win');
  assert.equal(winDue({ ...legacy, winShown: true }, legacy.passedTracks, ALL), false, 'and only that once');
});

test('applyRaceResult: a top-three clean finish on the last track wins the career, through the economy', () => {
  const save = { ...defaultSave(), passedTracks: ['neonloop', 'foundry'] };
  const out = applyRaceResult(save, res('daylite', 2));
  assert.equal(out.passedTrack, 'daylite');
  assert.equal(winDue(save, out.save.passedTracks, ALL), true);
  const wrecked = applyRaceResult(save, res('daylite', 2, { wrecked: true }));
  assert.equal(winDue(save, wrecked.save.passedTracks, ALL), false, 'a wreck does not pass the track');
  const fourth = applyRaceResult(save, res('daylite', 4));
  assert.equal(winDue(save, fourth.save.passedTracks, ALL), false, 'fourth place does not pass');
  const practice = applyRaceResult(save, res('daylite', 1), { mode: 'practice' });
  assert.equal(winDue(save, practice.save.passedTracks, ALL), false, 'practice never passes');
});

test('winShown defaults to false, and only a true value counts', () => {
  assert.equal(defaultSave().winShown, false);
  assert.equal(normalizeSave({ winShown: true }).winShown, true);
  assert.equal(normalizeSave({ winShown: 'yes' }).winShown, false);
});

test('score: prize money + kill bonuses + contract net, and nothing else', () => {
  assert.equal(careerScore(defaultSave()), 0);
  const save = { ...defaultSave(), earned: { prize: 10000, killBonus: 1500, contractNet: 2000 } };
  assert.equal(careerScore(save), 13500);
  assert.equal(careerScore({ ...save, earned: { ...save.earned, contractNet: -800 } }), 10700, 'a failed contract lowers the score');
  assert.equal(careerScore({ ...save, cash: 999999 }), 13500, 'cash in the bank is not part of the score');
  assert.equal(careerScore({ ...defaultSave(), cash: 5000, kills: 9 }), 0, 'kills count only through their bonuses');
});

test('score follows the economy: race prizes, kill bonuses and settled contracts add up to the earned totals', () => {
  const race = applyRaceResult(defaultSave(), res('neonloop', 1, { kills: 2 }), { mode: 'race', nCars: 6 });
  assert.equal(race.save.earned.prize, race.prize);
  assert.equal(race.save.earned.killBonus, 2 * KILL_BONUS);
  const patron = getPatron('military');
  const save = { ...race.save, contract: { patron: 'military', quota: 2, targets: ['vex', 'fuse'] } };
  const won = settleContract(save, { mode: 'race', wrecked: ['vex', 'fuse'] });
  assert.equal(won.save.earned.contractNet, 2 * patron.perKill);
  const lost = settleContract(save, { mode: 'race', wrecked: ['vex'] });
  assert.equal(lost.save.earned.contractNet, -patron.penalty);
  assert.equal(careerScore(won.save), race.prize + 2 * KILL_BONUS + 2 * patron.perKill);
  assert.equal(settleContract(save, { mode: 'practice', wrecked: ['vex'] }).save.earned.contractNet, 0, 'practice does not settle');
  assert.deepEqual(earnedOf(defaultSave()), { prize: 0, killBonus: 0, contractNet: 0 });
});

test('a save without earnings (an older save) starts the score at zero and keeps a negative contract net', () => {
  const old = normalizeSave({ cash: 9000, passedTracks: ALL });
  assert.deepEqual(old.earned, { prize: 0, killBonus: 0, contractNet: 0 });
  assert.equal(careerScore(old), 0);
  const kept = normalizeSave({ earned: { prize: 4000, killBonus: -20, contractNet: -300 } });
  assert.deepEqual(kept.earned, { prize: 4000, killBonus: 0, contractNet: -300 }, 'prize and kill bonus are not negative');
  assert.equal(careerScore(kept), 3700);
});

test('finalStats: money, score with its parts, and the passed count', () => {
  const save = { ...defaultSave(), cash: 42000, races: 9, wins: 3, kills: 7, passedTracks: ['neonloop', 'daylite', 'foundry'],
    earned: { prize: 30000, killBonus: 3500, contractNet: 1000 } };
  const s = finalStats(save);
  assert.equal(s.cash, 42000);
  assert.equal(s.score, 34500);
  assert.deepEqual(s.earned, { prize: 30000, killBonus: 3500, contractNet: 1000 });
  assert.equal(s.races, 9); assert.equal(s.wins, 3); assert.equal(s.kills, 7);
  assert.equal(s.tracksPassed, 3); assert.equal(s.tracksTotal, 3); assert.equal(s.champion, true);
  const partial = finalStats({ ...save, passedTracks: ['neonloop'] });
  assert.equal(partial.tracksPassed, 1); assert.equal(partial.champion, false);
});
