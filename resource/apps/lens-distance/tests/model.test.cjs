'use strict';
// Contract regression. Synthetic fixtures are explicitly identified and are
// never ordinary-play evidence or a substitute for the independent corpus.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modelPath = path.join(__dirname, '../src/main/assets/game-model.js');
const source = fs.readFileSync(modelPath, 'utf8');
const model = require(modelPath);
const clone = value => structuredClone(value);
const dt = 0.125;
const close = (actual, expected, tolerance = 1e-12) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function command(state, input, engine = model) {
  engine.step(state, dt, {});
  const before = clone(state);
  assert.equal(engine.step(state, dt, input), state);
  return { before, after: clone(state) };
}

function select(state, control) {
  if (state.selected !== control) command(state, { b: true });
}

// An ordinary current-reading policy, not a solved-pose table or a search.
// First estimate a lens distance from the displayed middle brightness and a
// moderate iris, then observe actual rays, screen and brightness after moves.
// No proposed state is stepped, no model helper predicts an alternate pose.
function focusCurrentCard(state) {
  const cardIndex = state.cardIndex, card = state.card;
  let decisions = 0;
  const middleBrightness = (card.brightnessMin + card.brightnessMax) / 2;
  const estimatedDistance = 4 * Math.sqrt(card.sourcePower / middleBrightness);
  const lensMark = clamp(Math.round(state.objectX + 4 * estimatedDistance / (estimatedDistance - 4)),
    card.lensMin, card.lensMax);
  select(state, 'lens');
  while (state.lensX !== lensMark && state.phase === 'playing') {
    assert.ok(decisions++ < 64, 'Observed controls did not reach their displayed marks');
    command(state, { x: Math.sign(lensMark - state.lensX) });
  }
  assert.equal(state.optics.imageKind, 'real');
  const screenMark = clamp(Math.round(state.optics.imageX), card.screenMin, card.screenMax);
  select(state, 'screen');
  while (state.screenX !== screenMark && state.phase === 'playing') {
    assert.ok(decisions++ < 64, 'Observed controls did not reach their displayed marks');
    command(state, { x: Math.sign(screenMark - state.screenX) });
  }
  const irisMark = clamp(Math.round(Math.sqrt(middleBrightness * state.optics.v ** 2 / card.sourcePower)), 1, 5);
  while (state.aperture !== irisMark && state.phase === 'playing') {
    assert.ok(decisions++ < 64, 'Observed controls did not reach their displayed marks');
    command(state, { y: state.aperture < irisMark ? -1 : 1 });
  }
  // The rounded ray intersection may lie just outside the brightness band.
  // Correct only the currently observed brightness with one screen step.
  if (!state.optics.brightnessOk && state.phase === 'playing') {
    command(state, { x: state.optics.brightness > card.brightnessMax ? 1 : -1 });
  }
  assert.equal(state.cardIndex, cardIndex);
  assert.equal(state.phase, 'playing');
  assert.equal(state.optics.canExpose, true, 'Preserve an observed policy failure instead of forcing a pose');
  return state;
}

function win(level = 0) {
  const state = model.create(747, level);
  focusCurrentCard(state); command(state, { a: true });
  focusCurrentCard(state); command(state, { a: true });
  return state;
}

function energyLoss(level = 0) {
  const state = model.create(747, level);
  for (let attempt = 0; attempt < 4; attempt += 1) command(state, { a: true });
  return state;
}

function adjustmentLoss(level = 0) {
  const state = model.create(747, level);
  for (let move = 0; move <= state.card.adjustmentLimit; move += 1) {
    command(state, { x: move % 2 === 0 ? 1 : -1 });
  }
  return state;
}

// SYNTHETIC optical boundary fixture: inject only a physical pose/current-card
// index, then use an actual A to obtain the freshly judged exposure reading.
// These are mathematical tests, not claimed reachable ordinary origins.
function syntheticExposure(level, cardIndex, lensX, screenX, aperture, engine = model) {
  const state = engine.create(747, level), card = engine.config.layouts[level].cards[cardIndex];
  Object.assign(state, { cardIndex, completed: cardIndex, card: clone(card), objectX: card.objectX,
    lensX, screenX, aperture });
  command(state, { a: true }, engine);
  return { state, receipt: state.exposureReceipts[0], optics: state.exposureReceipts[0].optics };
}

function allFinite(value) {
  if (typeof value === 'number') assert.equal(Number.isFinite(value), true);
  if (value && typeof value === 'object') Object.values(value).forEach(allFinite);
}

function verifyReceipt({ before, after }) {
  const receipt = after.exposureReceipts.at(-1);
  assert.equal(after.exposureReceipts.length, before.exposureReceipts.length + 1);
  assert.deepEqual(after.exposureReceipts.slice(0, -1), before.exposureReceipts);
  assert.equal(receipt.index, before.exposureReceipts.length);
  for (const key of ['cardIndex', 'objectX', 'lensX', 'screenX', 'aperture', 'selected', 'adjustmentsUsed']) {
    assert.equal(receipt[key], before[key]);
  }
  assert.equal(receipt.cardId, before.card.id);
  assert.equal(receipt.adjustmentLimit, before.card.adjustmentLimit);
  assert.equal(receipt.call, after.calls); assert.equal(receipt.elapsed, after.elapsed);
  assert.equal(receipt.energyBefore, before.energy); assert.equal(receipt.energyAfter, before.energy - 1);
  assert.equal(receipt.completedBefore, before.completed);
  assert.equal(receipt.completedAfter, before.completed + (receipt.matched ? 1 : 0));
  assert.equal(receipt.matched, receipt.optics.canExpose);
  assert.equal(after.completed, after.exposureReceipts.filter(item => item.matched).length);
  assert.equal(after.score, after.phase === 'won' ? 100 : 0);
}

test('exact public API, CommonJS/browser equivalence and deeply immutable configuration', () => {
  const context = {}; vm.createContext(context); vm.runInContext(source, context, { filename: modelPath });
  assert.deepEqual(Object.keys(model).sort(), ['config', 'create', 'step']);
  assert.deepEqual(Object.keys(context.PureModel).sort(), ['config', 'create', 'step']);
  assert.deepEqual(clone(context.PureModel.create(747, 2)), model.create(747, 2));
  assert.equal(Object.isFrozen(model), true);
  function frozen(value) {
    if (!value || typeof value !== 'object') return;
    assert.equal(Object.isFrozen(value), true); Object.values(value).forEach(frozen);
  }
  frozen(model.config);
  assert.throws(() => { model.config.layouts[0].cards[0].objectX = 999; }, TypeError);
  assert.deepEqual(Object.keys(model.config).sort(), ['apertureMax', 'apertureMin', 'defaultSeed', 'exposureEnergy',
    'focalLength', 'layouts', 'maxCounter', 'maxElapsed', 'objectHeight', 'railMax', 'railMin']);
});

test('all six public cards have exact bounds, starts, powers, bands and independent ranges', () => {
  assert.deepEqual(model.config.layouts.map(layout => [layout.id, layout.name, layout.nameZh]), [
    ['brass-bench', 'BRASS BENCH', '黄铜光台'], ['long-bench', 'LONG BENCH', '长距光台'],
    ['precision-bench', 'PRECISION BENCH', '精密光台']
  ]);
  const rows = model.config.layouts.flatMap(layout => layout.cards.map(card => [card.id, card.objectX,
    card.lensMin, card.lensMax, card.screenMin, card.screenMax, card.startLens, card.startScreen,
    card.startAperture, card.sourcePower, card.brightnessMin, card.brightnessMax, card.adjustmentLimit]));
  assert.deepEqual(rows, [
    ['arrow-plate', 2, 4, 12, 14, 26, 5, 24, 2, 160, 32, 52, 24],
    ['leaf-plate', 6, 8, 13, 20, 32, 10, 30, 6, 288, 40, 60, 24],
    ['star-plate', 1, 8, 13, 15, 25, 8, 25, 1, 100, 30, 45, 22],
    ['key-plate', 7, 9, 14, 21, 34, 10, 29, 2, 256, 32, 48, 22],
    ['petal-plate', 4, 6, 16, 20, 21, 8, 21, 6, 128, 24, 36, 16],
    ['spire-plate', 0, 2, 6, 19, 26, 4, 20, 1, 768, 38, 54, 16]
  ]);
  for (const layout of model.config.layouts) for (const card of layout.cards) {
    assert.ok(card.objectX < card.lensMin && card.lensMax < card.screenMin);
    assert.ok(card.startLens >= card.lensMin && card.startLens <= card.lensMax);
    assert.ok(card.startScreen >= card.screenMin && card.startScreen <= card.screenMax);
    assert.deepEqual(Object.keys(card).sort(), ['adjustmentLimit', 'brightnessMax', 'brightnessMin', 'id',
      'lensMax', 'lensMin', 'name', 'nameZh', 'objectX', 'screenMax', 'screenMin', 'sourcePower',
      'startAperture', 'startLens', 'startScreen']);
  }
});

test('fresh state normalizes seed/level without coercion and every layout begins uncaptured', () => {
  let coercions = 0; const object = { valueOf() { coercions += 1; return 1; } };
  for (const invalid of [undefined, null, '1', true, 0.5, NaN, Infinity, -1, 4294967296, object]) {
    assert.equal(model.create(invalid, invalid).seed, 747);
    assert.equal(model.create(invalid, invalid).level, 0);
  }
  assert.equal(coercions, 0);
  for (const seed of [0, 747, 4294967295]) assert.equal(model.create(seed, 2).seed, seed);
  for (let level = 0; level < 3; level += 1) {
    const state = model.create(747, level), card = model.config.layouts[level].cards[0];
    assert.deepEqual([state.schema, state.phase, state.reason, state.score, state.completed, state.cardIndex],
      [1, 'playing', '', 0, 0, 0]);
    assert.deepEqual([state.objectX, state.lensX, state.screenX, state.aperture, state.selected],
      [card.objectX, card.startLens, card.startScreen, card.startAperture, 'lens']);
    assert.deepEqual([state.energy, state.adjustmentsUsed, state.elapsed, state.elapsedCapped], [4, 0, 0, false]);
    assert.deepEqual([state.inputArmed, state.cancelEpoch, state.cancelledLast, state.counterSaturated],
      [false, null, false, false]);
    assert.deepEqual(state.lastHeld, { a: false, b: false, direction: 'none' });
    assert.deepEqual(state.exposureReceipts, []); assert.deepEqual(state.events, []);
    assert.equal(state.lastCommand, 'none'); assert.equal(state.terminalReceipt, null);
    assert.equal(state.optics.canExpose, false);
    assert.equal(state.message, '左右移动透镜，B 切换屏幕；上下调光阑，A 曝光验收。');
    for (const counter of ['calls', 'railMoves', 'apertureChanges', 'selections', 'exposures',
      'totalAdjustments', 'blockedActions']) assert.equal(state[counter], 0);
    assert.notEqual(state.card, card); allFinite(state);
  }
});

test('synthetic near-focus poses distinguish signed virtual, focal null and real images', () => {
  const cases = [[4, 'virtual', -4, 0, 2], [5, 'virtual', -12, -7, 4],
    [6, 'focal', null, null, null], [7, 'real', 20, 27, -4], [10, 'real', 8, 18, -1]];
  for (const [lens, kind, distance, imageX, magnification] of cases) {
    const { optics, state } = syntheticExposure(0, 0, lens, 18, 2);
    assert.deepEqual([optics.imageKind, optics.imageDistance, optics.imageX, optics.magnification],
      [kind, distance, imageX, magnification]);
    if (kind !== 'real') assert.equal(optics.clarityOk, false);
    allFinite(state); assert.doesNotThrow(() => JSON.parse(JSON.stringify(state)));
  }
});

test('synthetic full authored domain keeps geometry finite and satisfies lens/ray identities', () => {
  for (let level = 0; level < 3; level += 1) for (let cardIndex = 0; cardIndex < 2; cardIndex += 1) {
    const card = model.config.layouts[level].cards[cardIndex];
    for (let lens = card.lensMin; lens <= card.lensMax; lens += 1) {
      for (let screen = card.screenMin; screen <= card.screenMax; screen += 1) {
        for (let aperture = 1; aperture <= 6; aperture += 1) {
          const { optics } = syntheticExposure(level, cardIndex, lens, screen, aperture);
          allFinite(optics); assert.ok(optics.u > 0 && optics.v > 0);
          assert.ok(optics.blur >= 0 && optics.brightness > 0);
          if (optics.imageKind === 'focal') {
            assert.deepEqual([optics.imageDistance, optics.imageX, optics.magnification], [null, null, null]);
          } else {
            close(1 / optics.u + 1 / optics.imageDistance, 1 / 4);
            assert.ok(optics.imageDistance >= -12 && optics.imageDistance <= 20);
            for (const height of [0, aperture / 2, -aperture / 2]) {
              const rayY = height + optics.imageDistance * ((height - 3) / optics.u - height / 4);
              close(rayY, 3 * optics.magnification);
            }
          }
          if (aperture === 6) assert.equal(optics.clarityOk, false);
        }
      }
    }
  }
});

test('synthetic optical cases keep DIM, OVER, SOFT and no-real-image failures independent', () => {
  const dim = syntheticExposure(0, 0, 10, 18, 3).optics;
  assert.equal(dim.clarityOk, true); assert.equal(dim.brightnessOk, false); assert.ok(dim.brightness < 32);
  const over = syntheticExposure(0, 0, 10, 18, 5).optics;
  assert.equal(over.clarityOk, true); assert.equal(over.brightnessOk, false); assert.ok(over.brightness > 52);
  assert.equal(over.blur, 1); // Inclusive clarity boundary, exact focus at aperture5.
  const soft = syntheticExposure(0, 0, 12, 20, 4).optics;
  assert.equal(soft.brightness, 40); assert.equal(soft.brightnessOk, true); assert.equal(soft.clarityOk, false);
  const focal = syntheticExposure(0, 0, 6, 14, 4).optics;
  assert.equal(focal.brightness, 40); assert.equal(focal.brightnessOk, true); assert.equal(focal.canExpose, false);
  const virtual = syntheticExposure(0, 0, 5, 14, 5).optics;
  assert.equal(virtual.brightnessOk, true); assert.equal(virtual.clarityOk, false);
  const focused = syntheticExposure(0, 0, 10, 18, 4).optics;
  assert.equal(focused.blur, 9 / 16); assert.equal(focused.brightness, 40); assert.equal(focused.canExpose, true);
  const wide = syntheticExposure(0, 0, 10, 18, 6).optics;
  assert.equal(wide.blur, 25 / 16); assert.equal(wide.clarityOk, false);
});

test('synthetic band equality and either adjacent side use inclusive cross-products', () => {
  // An in-memory synthetic card with [40,40] isolates both equality signs;
  // this is not the public game config and creates no ordinary-play evidence.
  const band = 'brightnessMin: 32, brightnessMax: 52, adjustmentLimit: 24';
  const power = 'startLens: 5, startScreen: 24, startAperture: 2, sourcePower: 160';
  assert.equal(source.split(band).length, 2); assert.equal(source.split(power).length, 2);
  for (const sourcePower of [159, 160, 161]) {
    const syntheticSource = source.replace(band, 'brightnessMin: 40, brightnessMax: 40, adjustmentLimit: 24')
      .replace(power, power.replace('160', String(sourcePower)));
    const context = {}; vm.createContext(context); vm.runInContext(syntheticSource, context);
    const result = syntheticExposure(0, 0, 10, 18, 4, context.PureModel).optics;
    assert.equal(result.clarityOk, true);
    assert.equal(result.brightnessOk, sourcePower === 160);
    assert.equal(result.canExpose, sourcePower === 160);
    assert.deepEqual(Object.keys(context.PureModel).sort(), ['config', 'create', 'step']);
  }
  assert.equal(fs.readFileSync(modelPath, 'utf8'), source);
});

test('synthetic sequential clarity-only and brightness-only exposures never accumulate a capture', () => {
  const state = model.create();
  Object.assign(state, { lensX: 10, screenX: 18, aperture: 3 });
  command(state, { a: true });
  assert.equal(state.exposureReceipts[0].optics.clarityOk, true);
  assert.equal(state.exposureReceipts[0].optics.brightnessOk, false);
  Object.assign(state, { lensX: 12, screenX: 20, aperture: 4 });
  command(state, { a: true });
  assert.equal(state.exposureReceipts[1].optics.brightnessOk, true);
  assert.equal(state.exposureReceipts[1].optics.clarityOk, false);
  assert.equal(state.completed, 0); assert.equal(state.cardIndex, 0); assert.equal(state.energy, 2);
  assert.equal(state.exposureReceipts.every(receipt => !receipt.matched), true);
});

test('moving either carriage and aperture alters its own current optical measurement', () => {
  const state = model.create(), initial = clone(state.optics);
  command(state, { x: 1 });
  assert.equal(state.lensX, 6); assert.equal(state.optics.imageKind, 'focal');
  assert.equal(state.optics.u, initial.u + 1); assert.equal(state.optics.v, initial.v - 1);
  command(state, { b: true }); const afterLens = clone(state.optics);
  command(state, { x: -1 });
  assert.equal(state.screenX, 23); assert.equal(state.optics.u, afterLens.u);
  assert.equal(state.optics.v, afterLens.v - 1); assert.equal(state.optics.imageDistance, afterLens.imageDistance);
  const geometry = [state.optics.u, state.optics.v, state.optics.imageDistance];
  const brightness = state.optics.brightness, blur = state.optics.blur;
  command(state, { y: -1 });
  assert.equal(state.aperture, 3); assert.deepEqual([state.optics.u, state.optics.v, state.optics.imageDistance], geometry);
  close(state.optics.brightness / brightness, 9 / 4); assert.notEqual(state.optics.blur, blur);
  assert.equal(state.railMoves, 2); assert.equal(state.apertureChanges, 1);
  assert.equal(state.adjustmentsUsed, 3); assert.equal(state.totalAdjustments, 3); assert.equal(state.energy, 4);
});

test('synthetic all end stops block freely, preserve cache and cannot exceed adjustment allowance', () => {
  for (const control of ['lens', 'screen', 'aperture']) for (const side of ['min', 'max']) {
    const state = model.create(), card = state.card;
    state.selected = control === 'screen' ? 'screen' : 'lens';
    const key = control === 'aperture' ? 'aperture' : `${control}X`;
    state[key] = control === 'aperture' ? (side === 'min' ? 1 : 6)
      : card[`${control}${side === 'min' ? 'Min' : 'Max'}`];
    state.adjustmentsUsed = card.adjustmentLimit;
    const old = state[key], optics = state.optics;
    const input = control === 'aperture' ? { y: side === 'min' ? 1 : -1 } : { x: side === 'min' ? -1 : 1 };
    command(state, input);
    assert.equal(state[key], old); assert.equal(state.optics, optics); assert.equal(state.phase, 'playing');
    assert.equal(state.adjustmentsUsed, card.adjustmentLimit); assert.equal(state.energy, 4);
    assert.equal(state.blockedActions, 1); assert.equal(state.totalAdjustments, 0);
    assert.deepEqual(state.events, [{ type: 'blocked', reason: 'boundary', control, call: state.calls }]);
    assert.ok(state.message.endsWith('已到调节边界；不消耗次数。'));
  }
});

test('three ordinary two-card rounds accept actual observed optics and retain bounded receipts', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = model.create(747, level);
    for (let cardIndex = 0; cardIndex < 2; cardIndex += 1) {
      focusCurrentCard(state);
      assert.equal(state.phase, 'playing'); assert.equal(state.completed, cardIndex);
      assert.ok(state.adjustmentsUsed <= state.card.adjustmentLimit);
      verifyReceipt(command(state, { a: true }));
    }
    assert.equal(state.phase, 'won'); assert.equal(state.completed, 2); assert.equal(state.cardIndex, 1);
    assert.equal(state.score, 100); assert.equal(state.reason, '');
    assert.deepEqual(state.exposureReceipts.map(receipt => receipt.outcome), ['advance', 'won']);
    assert.equal(state.terminalReceipt.cause, 'success');
    assert.deepEqual(state.events, [{ type: 'win', cardIndex: 1, call: state.calls }]);
  }
});

test('ordinary first-card success resets every per-card value but retains counters, time and held history', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = focusCurrentCard(model.create(747, level));
    model.step(state, dt, { cancelEpoch: 3 });
    const old = clone(state), oldOptics = state.optics;
    const view = command(state, { a: true, cancelEpoch: 3 }); verifyReceipt(view);
    const card = model.config.layouts[level].cards[1];
    assert.deepEqual(state.card, card); assert.notEqual(state.card, card);
    assert.deepEqual([state.cardIndex, state.completed, state.objectX, state.lensX, state.screenX, state.aperture],
      [1, 1, card.objectX, card.startLens, card.startScreen, card.startAperture]);
    assert.deepEqual([state.selected, state.energy, state.adjustmentsUsed, state.phase], ['lens', 4, 0, 'playing']);
    assert.equal(state.optics.u, card.startLens - card.objectX); assert.equal(state.optics.canExpose, false);
    assert.notEqual(state.optics, oldOptics); assert.equal(state.terminalReceipt, null);
    assert.equal(state.elapsed, old.elapsed + 2 * dt); assert.equal(state.calls, old.calls + 2);
    for (const key of ['railMoves', 'apertureChanges', 'totalAdjustments', 'selections', 'blockedActions']) {
      assert.equal(state[key], old[key]);
    }
    assert.equal(state.exposures, old.exposures + 1); assert.equal(state.cancelEpoch, 3);
    assert.equal(state.inputArmed, true); assert.equal(state.lastHeld.a, true); assert.equal(state.lastCommand, 'a');
    assert.deepEqual(state.events, [{ type: 'advance', fromCard: 0, toCard: 1, call: state.calls }]);
    const message = state.message;
    model.step(state, dt, { a: true }); model.step(state, dt, { a: true });
    assert.equal(state.energy, 4); assert.equal(state.exposures, 1); assert.equal(state.message, message);
    model.step(state, dt, {}); model.step(state, dt, { a: true });
    assert.equal(state.energy, 3); assert.equal(state.exposures, 2); assert.equal(state.completed, 1);
  }
});

test('ordinary four rejected exposures lose energy on every initial layout without mechanical cost', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = model.create(747, level), initial = clone(state);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      verifyReceipt(command(state, { a: true }));
      assert.equal(state.energy, 3 - attempt); assert.equal(state.phase, attempt === 3 ? 'lost' : 'playing');
    }
    for (const key of ['objectX', 'lensX', 'screenX', 'aperture']) assert.equal(state[key], initial[key]);
    assert.equal(state.reason, 'energy'); assert.equal(state.completed, 0); assert.equal(state.adjustmentsUsed, 0);
    assert.equal(state.terminalReceipt.cause, 'energy'); assert.equal(state.terminalReceipt.energy, 0);
    assert.equal(state.exposureReceipts.at(-1).outcome, 'lost'); assert.equal(state.score, 0);
  }
});

test('ordinary successful final-energy captures advance then win and retain all eight exposures', () => {
  const state = model.create(747, 2);
  for (let card = 0; card < 2; card += 1) {
    for (let rejection = 0; rejection < 3; rejection += 1) verifyReceipt(command(state, { a: true }));
    assert.equal(state.energy, 1);
    focusCurrentCard(state); verifyReceipt(command(state, { a: true }));
    assert.equal(state.exposureReceipts.at(-1).energyAfter, 0);
    assert.equal(state.phase, card === 0 ? 'playing' : 'won');
    assert.equal(state.energy, card === 0 ? 4 : 0);
  }
  assert.equal(state.exposureReceipts.length, 8); assert.equal(state.exposures, 8);
  assert.equal(state.exposureReceipts.filter(receipt => receipt.matched).length, 2);
  assert.equal(state.terminalReceipt.cause, 'success');
});

test('ordinary exactly-allowed changes still permit exposure; actual extra change applies then loses', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = model.create(747, level), allowance = state.card.adjustmentLimit;
    for (let move = 0; move < allowance; move += 1) command(state, { x: move % 2 === 0 ? 1 : -1 });
    assert.equal(state.phase, 'playing'); assert.equal(state.adjustmentsUsed, allowance);
    assert.equal(state.events[0].remaining, 0); assert.equal(state.energy, 4);
    command(state, { b: true }); command(state, { b: true });
    verifyReceipt(command(state, { a: true }));
    assert.equal(state.phase, 'playing'); assert.equal(state.energy, 3);
    const previous = state.lensX;
    command(state, { x: 1 });
    assert.equal(state.phase, 'lost'); assert.equal(state.reason, 'adjustments'); assert.equal(state.lensX, previous + 1);
    assert.equal(state.adjustmentsUsed, allowance + 1); assert.equal(state.totalAdjustments, allowance + 1);
    assert.equal(state.energy, 3); assert.equal(state.exposureReceipts.length, 1);
    assert.equal(state.terminalReceipt.lensX, state.lensX);
    assert.deepEqual(state.events, [{ type: 'collision', reason: 'adjustments', control: 'lens',
      from: previous, to: previous + 1, call: state.calls }]);
  }
});

test('synthetic exact adjustment budget can successfully expose, while aperture overrun consumes no energy', () => {
  const state = focusCurrentCard(model.create());
  state.adjustmentsUsed = state.card.adjustmentLimit; // Synthetic counter boundary, pose reached normally.
  command(state, { a: true });
  assert.equal(state.completed, 1); assert.equal(state.phase, 'playing');
  assert.equal(state.exposureReceipts[0].adjustmentsUsed, 24);
  const overrun = model.create();
  overrun.adjustmentsUsed = overrun.card.adjustmentLimit;
  command(overrun, { y: -1 });
  assert.equal(overrun.aperture, 3); assert.equal(overrun.phase, 'lost'); assert.equal(overrun.reason, 'adjustments');
  assert.equal(overrun.energy, 4); assert.equal(overrun.apertureChanges, 1); assert.equal(overrun.totalAdjustments, 1);
  assert.equal(overrun.exposureReceipts.length, 0); assert.equal(overrun.events[0].control, 'aperture');
});

test('synthetic corrupted optics and copied card cannot authorize an invalid capture or change bounds', () => {
  const state = model.create();
  state.optics.canExpose = true; state.optics.clarityOk = true; state.optics.brightnessOk = true;
  state.card.sourcePower = 999; state.card.objectX = -999; state.card.lensMin = 99;
  const view = command(state, { a: true });
  assert.equal(state.completed, 0); assert.equal(state.energy, 3); assert.equal(state.phase, 'playing');
  assert.equal(state.optics.u, 3); assert.equal(state.optics.brightnessNumerator, 640);
  assert.equal(view.after.exposureReceipts[0].matched, false);
  command(state, { x: -1 });
  assert.equal(state.lensX, 4); assert.equal(state.events[0].type, 'adjust');
  const genuine = focusCurrentCard(model.create());
  genuine.optics.canExpose = false; genuine.optics.imageKind = 'virtual';
  command(genuine, { a: true });
  assert.equal(genuine.completed, 1); assert.equal(genuine.exposureReceipts[0].matched, true);
});

test('B>A>direction consumes simultaneous edges and held A permits fresh directions without new exposure', () => {
  const state = model.create(), optics = state.optics;
  command(state, { b: true, a: true, x: 1 });
  assert.equal(state.selected, 'screen'); assert.equal(state.lastCommand, 'b'); assert.equal(state.optics, optics);
  assert.equal(state.energy, 4); assert.equal(state.adjustmentsUsed, 0); assert.equal(state.exposures, 0);
  model.step(state, dt, { a: true, x: 1 }); model.step(state, dt, { x: 1 });
  assert.equal(state.exposures, 0); assert.equal(state.adjustmentsUsed, 0);
  command(state, { a: true, y: -1 });
  assert.equal(state.energy, 3); assert.equal(state.adjustmentsUsed, 0); assert.equal(state.lastCommand, 'a');
  model.step(state, dt, { a: true, y: -1 });
  assert.equal(state.adjustmentsUsed, 0);
  model.step(state, dt, { a: true, x: -1 });
  assert.equal(state.screenX, 23); assert.equal(state.adjustmentsUsed, 1); assert.equal(state.exposures, 1);
  assert.deepEqual(state.lastHeld, { a: true, b: false, direction: 'left' });
});

test('axis threshold/clamp, vertical ties, changed nonneutral directions and no held repeat', () => {
  const state = model.create(); command(state, { x: 0.5, y: -0.5 });
  assert.equal(state.lastHeld.direction, 'none'); assert.equal(state.adjustmentsUsed, 0);
  model.step(state, dt, { x: 1, y: -1 });
  assert.equal(state.aperture, 3); assert.equal(state.lastCommand, 'up');
  model.step(state, dt, { x: 0.6, y: -0.8 });
  assert.equal(state.adjustmentsUsed, 1);
  model.step(state, dt, { x: 0.9, y: -0.6 });
  assert.equal(state.lensX, 6); assert.equal(state.lastCommand, 'right');
  model.step(state, dt, { x: -100, y: 1 });
  assert.equal(state.aperture, 2); assert.equal(state.lastCommand, 'down');
  model.step(state, dt, { y: 0.7 });
  assert.equal(state.adjustmentsUsed, 3);
});

test('fresh held inputs stay quarantined and initial valid epoch is only a baseline', () => {
  const state = model.create();
  model.step(state, dt, { b: true, a: true, x: 1, cancelEpoch: 5 });
  model.step(state, dt, { b: true });
  assert.equal(state.inputArmed, false); assert.equal(state.selected, 'lens'); assert.equal(state.energy, 4);
  model.step(state, dt, {}); assert.equal(state.inputArmed, true);
  model.step(state, dt, { b: true }); assert.equal(state.selected, 'screen');
  const baseline = model.create(); model.step(baseline, dt, {});
  model.step(baseline, dt, { cancelEpoch: 0, b: true });
  assert.equal(baseline.selected, 'screen'); assert.equal(baseline.inputArmed, true);
});

test('changed epoch neutral cannot rearm that same call; a later genuine neutral is mandatory', () => {
  const state = model.create();
  model.step(state, dt, { cancelEpoch: 0 }); assert.equal(state.inputArmed, true);
  model.step(state, dt, { cancelEpoch: 1 });
  assert.equal(state.inputArmed, false); assert.equal(state.lastCommand, 'none');
  model.step(state, dt, { cancelEpoch: 1, b: true });
  assert.equal(state.selected, 'lens'); assert.equal(state.inputArmed, false);
  model.step(state, dt, { cancelEpoch: 1 }); assert.equal(state.inputArmed, true);
  model.step(state, dt, { cancelEpoch: 1, b: true }); assert.equal(state.selected, 'screen');
  model.step(state, dt, { cancelEpoch: 2, a: true, y: -1 });
  assert.equal(state.inputArmed, false); assert.equal(state.exposures, 0); assert.equal(state.adjustmentsUsed, 0);
  assert.deepEqual(state.lastHeld, { a: true, b: false, direction: 'up' });
  assert.equal(state.elapsed, state.calls * dt);
});

test('cancelled samples always suppress commands and synthetic neutral never releases quarantine', () => {
  const state = model.create(); model.step(state, dt, {});
  for (let call = 0; call < 3; call += 1) model.step(state, dt, { cancelled: true });
  assert.equal(state.inputArmed, false); assert.equal(state.cancelledLast, true);
  model.step(state, dt, { a: true });
  assert.equal(state.inputArmed, false); assert.equal(state.exposures, 0);
  model.step(state, dt, {}); model.step(state, dt, { a: true });
  assert.equal(state.exposures, 1); assert.equal(state.energy, 3);
  assert.equal(state.elapsed, state.calls * dt);
});

test('only nonnegative safe integer epochs persist and invalid epochs are ignored', () => {
  const state = model.create(); model.step(state, dt, { cancelEpoch: 0 });
  for (const cancelEpoch of [-1, 0.1, Infinity, NaN, '2', true, Number.MAX_SAFE_INTEGER + 1]) {
    model.step(state, dt, { cancelEpoch }); assert.equal(state.cancelEpoch, 0);
  }
  model.step(state, dt, { cancelEpoch: Number.MAX_SAFE_INTEGER });
  assert.equal(state.cancelEpoch, Number.MAX_SAFE_INTEGER); assert.equal(state.inputArmed, false);
  model.step(state, dt, {}); assert.equal(state.inputArmed, true);
});

test('invalid dt and literal paused true preserve all values/references without inappropriate reads', () => {
  const state = model.create(); command(state, { b: true });
  let reads = 0, coercions = 0;
  const proxy = new Proxy({}, { getOwnPropertyDescriptor() { reads += 1; throw Error('read'); } });
  const before = clone(state), refs = [state.card, state.optics, state.events, state.lastHeld, state.exposureReceipts];
  const odd = { valueOf() { coercions += 1; return 0.1; } };
  for (const duration of [undefined, null, true, '0.1', 0, -1, 0.250001, Infinity, NaN, odd]) {
    assert.equal(model.step(state, duration, proxy), state); assert.deepEqual(state, before);
  }
  assert.equal(reads, 0); assert.equal(coercions, 0);
  const seen = [], paused = new Proxy({ paused: true, a: true, cancelled: true, cancelEpoch: 20 }, {
    getOwnPropertyDescriptor(target, key) { seen.push(key); return Reflect.getOwnPropertyDescriptor(target, key); }
  });
  model.step(state, dt, paused); assert.deepEqual(state, before);
  assert.deepEqual(seen, ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused']);
  [state.card, state.optics, state.events, state.lastHeld, state.exposureReceipts]
    .forEach((value, index) => assert.equal(value, refs[index]));
});

test('normalization ignores getters, inherited values, pulses and coercible fields; input stays untouched', () => {
  const state = model.create(); let getters = 0;
  const input = Object.create({ a: true, b: true, x: 1, cancelled: true });
  Object.defineProperty(input, 'a', { get() { getters += 1; throw Error('getter'); } });
  Object.assign(input, { b: 1, x: '1', y: Infinity, cancelEpoch: '3', cancelled: 1, paused: 'true',
    aPressed: true, bPressed: true, start: true, direction: 'right' });
  model.step(state, dt, input);
  assert.equal(getters, 0); assert.equal(state.inputArmed, true); assert.equal(state.cancelEpoch, null);
  assert.equal(state.exposures, 0); assert.equal(state.selections, 0); assert.equal(state.adjustmentsUsed, 0);
  const frozen = Object.freeze({ b: true }); model.step(state, dt, frozen);
  assert.equal(state.selected, 'screen'); assert.deepEqual(frozen, { b: true });
});

test('arrays/functions/primitives and atomic descriptor failure normalize to wholly neutral', () => {
  const callable = Object.assign(function () {}, { a: true, x: 1 });
  for (const input of [Object.assign([], { a: true }), callable, null, true, 3, 'left']) {
    const state = model.create(); model.step(state, dt, input);
    assert.equal(state.inputArmed, true); assert.equal(state.calls, 1); assert.equal(state.exposures, 0);
  }
  const state = model.create(), seen = [];
  const proxy = new Proxy({ x: 1, a: true, b: true, cancelEpoch: 8, cancelled: true, paused: true }, {
    getOwnPropertyDescriptor(target, key) {
      seen.push(key); if (key === 'paused') throw Error('late failure');
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  model.step(state, dt, proxy);
  assert.deepEqual(seen, ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused']);
  assert.equal(state.calls, 1); assert.equal(state.inputArmed, true); assert.equal(state.cancelEpoch, null);
  assert.equal(state.cancelledLast, false); assert.deepEqual(state.lastHeld, { a: false, b: false, direction: 'none' });
  const revoked = Proxy.revocable({}, {}); revoked.revoke(); model.step(state, dt, revoked.proxy);
  assert.equal(state.calls, 2); assert.equal(state.exposures, 0);
});

test('prototype pollution cannot supply normalized controls or intercept detached optical receipt writes', () => {
  const keys = ['a', 'brightness'], saved = keys.map(key => Object.getOwnPropertyDescriptor(Object.prototype, key));
  let inheritedReads = 0;
  const state = model.create(); model.step(state, dt, {});
  try {
    Object.defineProperty(Object.prototype, 'a', { configurable: true, get() { inheritedReads += 1; return true; } });
    Object.defineProperty(Object.prototype, 'brightness', { configurable: true, get() { inheritedReads += 1; return 999; } });
    model.step(state, dt, Object.create(null)); model.step(state, dt, { a: true });
  } finally {
    keys.forEach((key, index) => {
      if (saved[index]) Object.defineProperty(Object.prototype, key, saved[index]); else delete Object.prototype[key];
    });
  }
  assert.equal(inheritedReads, 0); assert.equal(state.exposures, 1);
  assert.equal(state.exposureReceipts[0].optics.brightness, state.optics.brightness);
  assert.notEqual(state.exposureReceipts[0].optics, state.optics);
});

test('synthetic informational elapsed cap and counter saturation never settle the round', () => {
  const state = model.create(); state.elapsed = 86399.75;
  model.step(state, 0.25, {});
  assert.equal(state.elapsed, 86400); assert.equal(state.elapsedCapped, false); assert.equal(state.phase, 'playing');
  model.step(state, Number.MIN_VALUE, {});
  assert.equal(state.elapsed, 86400); assert.equal(state.elapsedCapped, false); assert.equal(state.calls, 2);
  model.step(state, 0.125, {});
  assert.equal(state.elapsed, 86400); assert.equal(state.elapsedCapped, true); assert.equal(state.phase, 'playing');
  const cases = [['calls', {}], ['railMoves', { x: 1 }], ['apertureChanges', { y: -1 }],
    ['selections', { b: true }], ['exposures', { a: true }], ['totalAdjustments', { x: 1 }],
    ['blockedActions', { y: 1 }]];
  for (const [key, input] of cases) {
    const fixture = model.create(); if (key === 'blockedActions') fixture.aperture = 1;
    model.step(fixture, dt, {}); fixture[key] = model.config.maxCounter - 1;
    model.step(fixture, dt, input);
    assert.equal(fixture[key], model.config.maxCounter); assert.equal(fixture.counterSaturated, false);
    model.step(fixture, dt, {}); model.step(fixture, dt, input);
    assert.equal(fixture[key], model.config.maxCounter); assert.equal(fixture.counterSaturated, true);
    model.step(fixture, dt, {}); assert.equal(fixture.counterSaturated, true); assert.equal(fixture.phase, 'playing');
  }
});

test('receipts, terminal optics, config and independent rounds share no mutable objects', () => {
  const state = model.create(); command(state, { a: true });
  const first = state.exposureReceipts[0], preserved = clone(first), other = model.create();
  assert.notEqual(state.card, other.card); assert.notEqual(state.optics, other.optics);
  assert.notEqual(state.card, model.config.layouts[0].cards[0]); assert.notEqual(first.optics, state.optics);
  focusCurrentCard(state); command(state, { a: true });
  focusCurrentCard(state); command(state, { a: true });
  assert.equal(state.exposureReceipts[0], first); assert.deepEqual(first, preserved);
  const last = state.exposureReceipts.at(-1), terminal = state.terminalReceipt;
  assert.notEqual(last.optics, state.optics); assert.notEqual(terminal.optics, state.optics);
  assert.notEqual(terminal.optics, last.optics); assert.deepEqual(terminal.optics, last.optics);
  assert.equal(state.message.length <= 160, true); assert.equal(state.events.length, 1);
});

test('terminal win, energy loss and adjustment loss freeze before reading duration or input', () => {
  let reads = 0;
  const input = new Proxy({}, { getOwnPropertyDescriptor() { reads += 1; throw Error('terminal read'); } });
  for (const state of [win(), energyLoss(), adjustmentLoss()]) {
    const before = clone(state), refs = [state.card, state.optics, state.events, state.lastHeld,
      state.exposureReceipts, state.terminalReceipt];
    assert.equal(model.step(state, { valueOf() { throw Error('coercion'); } }, input), state);
    model.step(state, dt, input); assert.deepEqual(state, before);
    [state.card, state.optics, state.events, state.lastHeld, state.exposureReceipts, state.terminalReceipt]
      .forEach((value, index) => assert.equal(value, refs[index]));
  }
  assert.equal(reads, 0);
});

test('retry and level change allocate a complete original release-gated round after any outcome', () => {
  for (let level = 0; level < 3; level += 1) {
    const initial = model.create(747, level);
    for (const ended of [win(level), energyLoss(level), adjustmentLoss(level)]) {
      const retry = model.create(ended.seed, ended.level);
      assert.deepEqual(retry, initial); assert.notEqual(retry.card, initial.card); assert.notEqual(retry.optics, initial.optics);
      assert.equal(retry.energy, 4); assert.equal(retry.completed, 0); assert.equal(retry.cardIndex, 0);
      assert.equal(retry.exposureReceipts.length, 0); assert.equal(retry.inputArmed, false);
      assert.deepEqual(model.create(ended.seed, (level + 1) % 3), model.create(747, (level + 1) % 3));
    }
  }
});
