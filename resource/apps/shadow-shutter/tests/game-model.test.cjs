'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60, U = 480;
const clone = value => JSON.parse(JSON.stringify(value));
const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
const ordered = rows => rows.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0 || a.y1 - b.y1 || a.x1 - b.x1);
const area = rows => rows.reduce((n, r) => n + (r.x1 - r.x0) * (r.y1 - r.y0), 0);
function frozen(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(frozen); Object.freeze(value); }
  return value;
}
function advance(s, count, input = {}) { for (let i = 0; i < count; i++) Model.step(s, DT, input); }
function ready(difficulty = 0) { const s = Model.create(733, difficulty); Model.step(s, DT, {}); return s; }
function frame(s, mode, cx, cy) {
  const [w, h] = s.physics.aperture.modes.find(row => row.id === mode).sizeCells;
  return frozen({ mode, centerX2: cx, centerY2: cy, widthCells: w, heightCells: h,
    rect: rect((cx - w) * U / 2, (cy - h) * U / 2, (cx + w) * U / 2, (cy + h) * U / 2) });
}
function actorRects(actor, mirrored, x, y) {
  return ordered(actor.cells.map(([cx, cy]) => {
    const column = mirrored ? actor.widthCells - 1 - cx : cx;
    return rect(x + column * U, y + cy * U, x + (column + 1) * U, y + (cy + 1) * U);
  }));
}

// FORMAL SYNTHETIC BOUNDARY FIXTURES, NOT ORDINARY PLAY OR A SOLUTION ROUTE.
// Deep-clone create; place a single boundary at a published pose/dwell, with its
// exact actor cells, strip, phase, frame and armed input. Gaps between placements
// are NOT executed intervals and are never reported as gameplay evidence.
// Only real Model A calls create film, photo and target-credit history below.
function fixture(difficulty = 0) {
  const s = clone(Model.create(733, difficulty));
  for (const key of ['identity', 'scenario', 'physics', 'targets']) frozen(s[key]);
  return s;
}
function place(s, poseIndex, phase = [540, 1260, 1980][poseIndex]) {
  const pose = s.scenario.poses[poseIndex], [sx, sy] = pose.stageOriginCells;
  const [w, h] = s.physics.aperture.modes.find(row => row.id === pose.mode).sizeCells;
  const dwellStart = [480, 1200, 1920][poseIndex];
  assert.ok(phase >= dwellStart && phase <= dwellStart + 240);
  s.tick = phase - s.scenario.phaseOffsetTicks; s.elapsed = s.tick / 60;
  s.aperture = frame(s, pose.mode, 2 * sx + w, 2 * sy + h);
  const actors = s.scenario.actors.map((actor, depth) => {
    const part = pose.parts[actor.id], x = U * (sx + part.originCells[0]), y = U * (sy + part.originCells[1]);
    return { id: actor.id, depth, originX: x, originY: y, mirrorX: part.mirrorX,
      widthCells: actor.widthCells, heightCells: actor.heightCells, worldRects: actorRects(actor, part.mirrorX, x, y) };
  });
  const stripX = sx * U, stripY = (sy + 1) * U + h * U * Math.min(phase - dwellStart, 60) / 60;
  const phaseTick = phase % 2160;
  const segmentIndex = s.physics.motion.segments.findIndex(row => phaseTick >= row.fromPhaseTick && phaseTick < row.toPhaseTick);
  s.scene = frozen({ motionPhaseTick: phaseTick, segmentIndex, actors,
    strip: { id: 'paper-strip', depth: 3, originX: stripX, originY: stripY,
      worldRect: rect(stripX, stripY, stripX + 9 * U, stripY + U) } });
  s.inputState = { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, direction: null, repeatAgeTicks: 0 };
  s.lastInput = s.lastFrameChange = s.lastTransaction = s.lastInterval = s.lastPhoto = null;
  // Preview is not used as a geometry oracle in these fixtures. Capture must
  // evaluate current scene/frame independently; only actual returned previews
  // are asserted. Tests below deliberately change scene/frame before a shot.
  return s;
}
function shoot(s, input = { a: true }) { Model.step(s, DT, input); return s.lastPhoto; }
function editScene(s, edit) { const scene = clone(s.scene); edit(scene); s.scene = frozen(scene); }
function shiftActor(actor, dx, dy) {
  actor.originX += dx; actor.originY += dy;
  actor.worldRects = ordered(actor.worldRects.map(r => rect(r.x0 + dx, r.y0 + dy, r.x1 + dx, r.y1 + dy)));
}
function check(photo, id) { return photo.actorChecks.find(row => row.id === id); }
function wrongMode(s) {
  s.aperture = frame(s, s.aperture.mode === 'landscape' ? 'portrait' : 'landscape', s.aperture.centerX2, s.aperture.centerY2);
}
function historyFixture(credits, remaining) {
  const s = fixture();
  for (let i = 0; i < credits; i++) { place(s, i); assert.equal(shoot(s).matched, true); }
  const misses = s.film.remaining - remaining;
  assert.ok(misses >= 0 && remaining > 0);
  for (let i = 0; i < misses; i++) {
    place(s, credits, [540, 1260, 1980][credits] + 2 * i); wrongMode(s);
    assert.equal(shoot(s).reason, 'wrong_frame_mode');
  }
  place(s, credits, [540, 1260, 1980][credits] + 2 * misses);
  assert.equal(s.film.used, s.photoReceipts.length);
  assert.equal(s.activeTargetIndex, s.targetCredits.length);
  return s;
}

test('create publishes the three authored scenarios, immutable facts and initial quarantine', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['create', 'step']);
  for (let difficulty = 0; difficulty < 3; difficulty++) {
    const s = Model.create(733, difficulty), otherSeed = Model.create(734, difficulty);
    assert.equal(s.level, difficulty + 1); assert.equal(s.tick, 0); assert.equal(s.transactionCount, 0);
    assert.equal(s.phase, 'playing'); assert.equal(s.terminal, null); assert.equal(s.lostReason, null);
    assert.equal(s.scene.motionPhaseTick, [0, 1680, 1200][difficulty]);
    assert.deepEqual(s.scene, otherSeed.scene); assert.deepEqual(s.targets, otherSeed.targets);
    assert.equal(otherSeed.seed, 734); assert.equal(otherSeed.identity.seed, 733);
    assert.deepEqual(s.film, { initial: [5, 5, 6][difficulty], used: 0, remaining: [5, 5, 6][difficulty] });
    assert.deepEqual(s.inputState, { cancelEpoch: 0, quarantined: true, aArmed: false, bArmed: false, direction: null, repeatAgeTicks: 0 });
    assert.deepEqual([s.aperture.centerX2, s.aperture.centerY2], [27, 15]);
    assert.equal(s.aperture.mode, 'landscape'); assert.equal(s.activeTargetId, s.targets[0].targetId);
    assert.deepEqual(s.photoReceipts, []); assert.deepEqual(s.targetCredits, []);
    assert.equal(s.preview.tick, 0); assert.equal(s.preview.activeTargetIndex, 0);
    assert.ok(Object.isFrozen(s.targets[0].actors[0].localRects[0]));
    assert.ok(Object.isFrozen(s.scene.actors[0].worldRects[0])); assert.ok(Object.isFrozen(s.physics));
  }
  assert.deepEqual(Model.create(), Model.create(undefined, undefined));
});

test('invalid creation and active dt fail before mutation; dt zero reads no input', () => {
  for (const value of [null, '733', -1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => Model.create(value, 0), RangeError);
  for (const value of [null, '0', -1, .5, 3, NaN, Infinity]) assert.throws(() => Model.create(733, value), RangeError);
  const s = ready(), before = clone(s), poison = new Proxy({}, { get() { throw Error('input must not be read'); } });
  for (const value of [undefined, null, '0', -DT, NaN, Infinity, DT / 2, DT * 2, DT + 2e-12]) {
    assert.throws(() => Model.step(s, value, poison), RangeError); assert.deepEqual(s, before);
  }
  Model.step(s, 0, poison); assert.deepEqual(s, before);
  Model.step(s, DT + 5e-13, {}); assert.equal(s.tick, before.tick + 1);
});

test('direction repeats at ages 12 and 18, token changes act immediately and neutral resets', () => {
  const s = ready(), x = s.aperture.centerX2, requests = [];
  for (let i = 0; i < 19; i++) { Model.step(s, DT, { x: .55 }); if (s.lastFrameChange.navigationRequested) requests.push(i); }
  assert.deepEqual(requests, [0, 12, 18]); assert.equal(s.aperture.centerX2, x + 6);
  Model.step(s, DT, { x: 1, y: -.55 });
  assert.equal(s.lastFrameChange.navigationRequested, 'up'); assert.equal(s.inputState.repeatAgeTicks, 1);
  assert.equal(s.lastInput.axisX, 1); assert.equal(s.lastInput.axisY, -1);
  Model.step(s, DT, { x: .549, y: -.549 }); assert.equal(s.inputState.direction, null); assert.equal(s.inputState.repeatAgeTicks, 0);
  Model.step(s, DT, { x: -.55 }); assert.equal(s.lastFrameChange.navigationRequested, 'left');
  Model.step(s, DT, { x: '1', y: Infinity, a: 1, b: 'true' });
  assert.equal(s.lastInput.rawX, null); assert.equal(s.lastInput.rawY, null);
  assert.equal(s.lastInput.effectiveA, false); assert.equal(s.lastInput.effectiveB, false); assert.equal(s.film.used, 0);
});

test('navigation and B clamp in order, preserve center where legal and never charge film', () => {
  const s = fixture(); place(s, 0); s.aperture = frame(s, 'landscape', 9, 7);
  Model.step(s, DT, { x: -1, b: true });
  assert.equal(s.lastFrameChange.navigationRequested, 'left'); assert.equal(s.lastFrameChange.navigationChanged, false);
  assert.deepEqual([s.lastFrameChange.apertureAfterNavigation.centerX2, s.lastFrameChange.apertureAfterNavigation.centerY2], [9, 7]);
  assert.deepEqual([s.aperture.mode, s.aperture.centerX2, s.aperture.centerY2], ['portrait', 9, 9]);
  Model.step(s, DT, { b: true }); assert.equal(s.aperture.mode, 'portrait');
  Model.step(s, DT, {}); Model.step(s, DT, { bPressed: true });
  assert.deepEqual([s.aperture.mode, s.aperture.centerX2, s.aperture.centerY2], ['landscape', 9, 9]);
  assert.equal(s.film.used, 0); assert.equal(s.photoReceipts.length, 0);
});

test('initial and epoch quarantine suppress controls but advance time; neutral acknowledgement cannot act', () => {
  const s = Model.create(), aperture = clone(s.aperture);
  Model.step(s, DT, { a: true, b: true, x: 1 }); assert.equal(s.tick, 1); assert.deepEqual(s.aperture, aperture); assert.equal(s.film.used, 0);
  Model.step(s, DT, { cancelled: true }); assert.equal(s.lastInput.neutralAcknowledged, false); assert.equal(s.inputState.quarantined, true);
  Model.step(s, DT, {}); assert.equal(s.lastInput.neutralAcknowledged, true); assert.equal(s.tick, 3);
  Model.step(s, DT, { cancelEpoch: 2.5, aPressed: true, y: 1 });
  assert.equal(s.lastInput.epochChanged, true); assert.equal(s.lastInput.freshA, false); assert.equal(s.inputState.direction, null);
  Model.step(s, DT, { aPressed: true, cancelEpoch: 2.5 }); assert.equal(s.inputState.quarantined, true);
  Model.step(s, DT, { x: .55 }); assert.equal(s.inputState.quarantined, true);
  Model.step(s, DT, { x: .549, cancelEpoch: Infinity }); assert.equal(s.lastInput.neutralAcknowledged, true);
  assert.equal(s.inputState.cancelEpoch, 2.5); assert.equal(s.film.used, 0);
  Model.step(s, DT, { aPressed: true }); assert.equal(s.film.used, 1);
  Model.step(s, DT, { a: true }); assert.equal(s.film.used, 1);
  Model.step(s, DT, {}); Model.step(s, DT, { aPressed: true }); assert.equal(s.film.used, 2);
});

test('fresh direction then B then A uses the changed frame, and a held shutter cannot credit twice', () => {
  const s = historyFixture(1, 4), expectedFrame = clone(s.aperture);
  // Synthetic position one cell left, in the other mode. A+B must BOTH apply.
  s.aperture = frame(s, 'landscape', expectedFrame.centerX2 - 2, expectedFrame.centerY2);
  const p = shoot(s, { x: 1, aPressed: true, bPressed: true });
  assert.equal(p.matched, true); assert.deepEqual(p.aperture, expectedFrame);
  assert.equal(p.targetIndexBefore, 1); assert.equal(p.targetIndexAfter, 2);
  assert.equal(s.lastFrameChange.navigationChanged, true); assert.equal(s.lastFrameChange.modeToggleApplied, true);
  assert.deepEqual(s.lastTransaction.photoReceiptIds, [2]); assert.deepEqual(s.lastTransaction.creditIds, [2]);
  const used = s.film.used; Model.step(s, DT, { a: true, b: true });
  assert.equal(s.film.used, used); assert.equal(s.lastPhoto, null); assert.equal(s.targetCredits.length, 2);
  assert.equal(s.preview.activeTargetIndex, 2); assert.equal(s.preview.tick, s.tick);
});

test('capture uses the inclusive dwell-end boundary, not the subsequently moving scene', () => {
  const s = place(fixture(), 0, 720), before = clone(s.scene), p = shoot(s);
  assert.equal(p.boundaryTick, 720); assert.equal(p.segmentIndex, 2); assert.equal(p.matched, true);
  assert.deepEqual(p.sceneAtCapture, before); assert.equal(s.tick, 721);
  assert.notDeepEqual(s.scene.actors[0].worldRects, p.sceneAtCapture.actors[0].worldRects);
  assert.equal(s.lastInterval.sourceSegmentIndex, 2); assert.deepEqual(s.lastInterval.precedingPhotoReceiptIds, [1]);
  assert.equal(s.lastInterval.targetIndexDuringInterval, 1); assert.equal(s.preview.activeTargetIndex, 1);
  assert.equal(s.lastPhoto.expected.targetIndex, 0); assert.equal(s.lastPhoto.reason, 'matched');
});

test('strip moves during the first 60 dwell intervals and the clear boundary remains photographable', () => {
  const s = place(fixture(), 0, 480), original = clone(s.scene.strip);
  Model.step(s, DT, {}); assert.equal(s.lastInterval.strip.velocityY, 56);
  advance(s, 59); assert.equal(s.tick, 540); assert.equal(s.scene.strip.originY - original.originY, 7 * U);
  assert.equal(shoot(s).matched, true); assert.equal(s.lastInterval.strip.velocityY, 0);
});

test('transit midpoint changes the holder at interval end without altering its earlier photo', () => {
  const s = ready(); advance(s, 238); assert.equal(s.tick, 239);
  const p = shoot(s); assert.equal(p.motionPhaseTick, 239); assert.equal(s.scene.motionPhaseTick, 240);
  for (const row of s.lastInterval.actors) {
    assert.equal(row.fromMirrorX, true); assert.equal(row.toMirrorX, false); assert.equal(row.mirrorChangedAtEnd, true);
    assert.equal(row.toOriginX - row.fromOriginX, row.velocityX); assert.equal(row.toOriginY - row.fromOriginY, row.velocityY);
  }
  assert.equal(p.sceneAtCapture.actors[0].mirrorX, true); assert.equal(s.scene.actors[0].mirrorX, false);
  const local = a => a.worldRects.map(r => rect(r.x0 - a.originX, r.y0 - a.originY, r.x1 - a.originX, r.y1 - a.originY));
  assert.deepEqual(local(p.sceneAtCapture.actors[0]), local(s.scene.actors[0])); // Symmetric body; mirror bit still changes.
  assert.notDeepEqual(local(p.sceneAtCapture.actors[1]), local(s.scene.actors[1]));
});

test('equivalent rectangle partitions and symmetric component mirroring compare as geometric sets', () => {
  const s = place(fixture(), 0);
  editScene(s, scene => {
    const a = scene.actors[0]; a.mirrorX = true; // This authored 3x2 body is symmetric.
    a.worldRects = ordered(a.worldRects.flatMap(r => [rect(r.x0, r.y0, r.x0 + 173, r.y1), rect(r.x0 + 173, r.y0, r.x1, r.y1)]));
  });
  const p = shoot(s); assert.equal(p.matched, true); assert.equal(check(p, 'part-a').registered, true);
  assert.equal(check(p, 'part-a').worldRects.length, 12); assert.equal(check(p, 'part-a').expectedLocalRects.length, 6);
  assert.equal(p.sceneAtCapture.actors[0].mirrorX, true); assert.equal(p.targetIndexAfter, 1);
});

test('fixed registration rejects window translation, one-unit geometry drift and equal-area mirrored shapes', () => {
  const movedWindow = place(fixture(), 0), p1 = shoot(movedWindow, { x: 1, a: true });
  assert.equal(p1.allFullyVisible, true); assert.equal(p1.reason, 'component_registration_mismatch'); assert.equal(p1.matched, false);
  const drift = place(fixture(), 0); editScene(drift, scene => scene.actors.forEach(actor => shiftActor(actor, 1, 0)));
  const p2 = shoot(drift); assert.equal(p2.allFullyVisible, true); assert.equal(p2.allRegistered, false); assert.equal(p2.exposureEqualsTarget, false);
  const mirrored = place(fixture(), 0);
  editScene(mirrored, scene => { const a = scene.actors[1]; a.mirrorX = true; a.worldRects = actorRects(mirrored.scenario.actors[1], true, a.originX, a.originY); });
  const p3 = shoot(mirrored), wing = check(p3, 'part-b');
  assert.equal(area(wing.localRawRects), area(wing.expectedLocalRects)); assert.equal(wing.fullVisible, true);
  assert.equal(wing.registered, false); assert.equal(p3.exposureEqualsTarget, false); assert.equal(p3.reason, 'component_registration_mismatch');
});

test('the complete opposite-facing authored pose is not canonicalized to the active target', () => {
  const s = place(fixture(), 2), p = shoot(s);
  assert.equal(p.targetIndexBefore, 0); assert.equal(p.modeMatches, true); assert.equal(p.allFullyVisible, true);
  assert.equal(p.allRegistered, false); assert.equal(p.matched, false); assert.equal(p.creditedTargetId, null);
  assert.equal(s.targetCredits.length, 0); assert.equal(s.film.used, 1);
});

test('aperture and world clipping reject even a one-unit positive-area sliver', () => {
  const edge = place(fixture(), 0);
  // Translate the complete wing to touch the left frame edge; its authored cells remain intact.
  editScene(edge, scene => shiftActor(scene.actors[1], -2 * U, 0));
  const touching = shoot(edge); assert.equal(check(touching, 'part-b').insideAperture, true);
  assert.equal(check(touching, 'part-b').fullVisible, true); assert.deepEqual(check(touching, 'part-b').outsideApertureRects, []);
  const clipped = place(fixture(), 0); editScene(clipped, scene => shiftActor(scene.actors[1], -2 * U - 1, 0));
  const p = shoot(clipped), wing = check(p, 'part-b');
  assert.equal(wing.insideAperture, false); assert.equal(wing.fullVisible, false); assert.equal(area(wing.outsideApertureRects), 3 * U);
  assert.equal(p.reason, 'required_piece_clipped');
  const outsideWorld = place(fixture(), 0);
  editScene(outsideWorld, scene => shiftActor(scene.actors[1], -scene.actors[1].originX - 1, 0));
  const p2 = shoot(outsideWorld); assert.equal(check(p2, 'part-b').insideWorld, false);
  assert.equal(area(check(p2, 'part-b').outsideWorldRects), 3 * U); assert.equal(p2.reason, 'required_piece_clipped');
});

test('touching required pieces have no overlap; a one-unit overlap really occludes the lower piece', () => {
  const edge = shoot(place(fixture(), 0)); assert.equal(check(edge, 'part-a').unoccluded, true);
  const s = place(fixture(), 0); editScene(s, scene => shiftActor(scene.actors[1], 0, 1));
  const p = shoot(s), body = check(p, 'part-a');
  assert.equal(body.registered, true); assert.equal(body.insideAperture, true);
  assert.equal(body.unoccluded, false); assert.equal(body.fullVisible, false);
  assert.equal(area(body.occludedWorldRects), 2 * U); assert.equal(p.reason, 'required_piece_occluded');
});

test('the opaque foreground strip erases ink rather than exposing a hidden required piece', () => {
  const s = place(fixture(), 0, 480), p = shoot(s), wing = check(p, 'part-b');
  assert.equal(p.allRegistered, true); assert.equal(wing.unoccluded, false); assert.equal(wing.fullVisible, false);
  assert.equal(area(wing.occludedWorldRects), U * U); assert.equal(p.exposureEqualsTarget, false);
  assert.equal(p.reason, 'required_piece_occluded'); assert.equal(p.matched, false);
});

test('formal synthetic geometry: an unchanged ink union cannot conceal a missing lower fragment', () => {
  // NON-AUTHORED, UNREACHABLE geometry fixture only. Append a disjoint extra
  // body rectangle exactly under one existing wing cell. It adds no exposed
  // ink, but the required complete lower actor now includes a hidden fragment.
  const s = place(fixture(), 0), hidden = clone(s.scene.actors[1].worldRects[0]);
  editScene(s, scene => { scene.actors[0].worldRects = ordered([...scene.actors[0].worldRects, hidden]); });
  const p = shoot(s), body = check(p, 'part-a');
  assert.ok(body.worldRects.some(r => JSON.stringify(r) === JSON.stringify(hidden)));
  assert.deepEqual(body.occludedWorldRects, [hidden]); assert.equal(body.unoccluded, false);
  assert.equal(body.fullVisible, false); assert.equal(body.registered, false);
  assert.equal(p.exposureEqualsTarget, true); assert.equal(p.matched, false); assert.equal(p.reason, 'required_piece_occluded');
});

test('last-sheet nonfinal success preserves its real credit and loses without an interval', () => {
  const s = historyFixture(0, 1), before = clone(s.scene), tick = s.tick, tx = s.transactionCount;
  const p = shoot(s); assert.equal(p.matched, true); assert.equal(p.chargedFilm, 1);
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'film_exhausted'); assert.equal(s.score, 100);
  assert.equal(s.film.remaining, 0); assert.equal(s.film.used, 5); assert.equal(s.photoReceipts.length, 5);
  assert.equal(s.targetCredits.length, 1); assert.equal(s.targetCredits[0].photoReceiptId, 5);
  assert.equal(s.tick, tick); assert.deepEqual(s.scene, before); assert.equal(s.lastInterval, null);
  assert.deepEqual(s.lastTransaction, { id: tx + 1, fromTick: tick, toTick: tick, advanced: false,
    photoReceiptIds: [5], creditIds: [1], intervalId: null, terminalAfter: s.terminal });
  assert.deepEqual(p.terminalAfterCapture, { reason: 'film_exhausted', boundaryTick: tick, transactionId: tx + 1 });
});

test('last-sheet final success wins before a synthetic next-tick deadline and consumes no interval', () => {
  const s = historyFixture(2, 1), tick = s.tick;
  // Explicit synthetic deadline: both public configuration and live alias are
  // changed together. This is a priority unit test, not an authored round.
  s.scenario = frozen({ ...clone(s.scenario), deadlineTick: tick + 1 }); s.deadlineTick = tick + 1;
  const p = shoot(s); assert.equal(p.matched, true); assert.equal(s.phase, 'won'); assert.equal(s.score, 1000);
  assert.equal(s.film.remaining, 0); assert.equal(s.activeTargetIndex, 3); assert.equal(s.activeTargetId, null); assert.equal(s.preview, null);
  assert.equal(s.targetCredits.length, 3); assert.equal(s.photoReceipts.length, 5); assert.equal(s.tick, tick);
  assert.equal(s.lastInterval, null); assert.equal(s.lastTransaction.advanced, false);
  assert.equal(s.terminal.reason, 'all_targets_captured'); assert.equal(p.terminalAfterCapture.reason, 'all_targets_captured');
  const saved = clone(s), poison = new Proxy({}, { get() { throw Error('terminal input read'); } });
  Model.step(s, NaN, poison); Model.step(s, DT, { aPressed: true, b: true, cancelEpoch: 10 }); assert.deepEqual(s, saved);
});

test('authored deadline integrates its final interval and refuses a photograph afterward', () => {
  const s = ready(); advance(s, 238); // Actual phase 239, matching L1 deadline-1 modulo 2160.
  // Synthetic same-phase placement only; do not claim the intervening 4320 ticks were executed.
  s.tick = s.deadlineTick - 1; s.elapsed = s.tick / 60; s.preview = frozen({ ...s.preview, tick: s.tick });
  const before = s.tick; Model.step(s, DT, {});
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'deadline'); assert.equal(s.tick, before + 1);
  assert.equal(s.lastInterval.fromTick, before); assert.equal(s.lastInterval.toTick, s.deadlineTick);
  assert.equal(s.lastInterval.terminalAfter.reason, 'deadline'); assert.equal(s.lastTransaction.advanced, true);
  const saved = clone(s); Model.step(s, DT, { a: true }); assert.deepEqual(s, saved); assert.equal(s.photoReceipts.length, 0);
});

test('a nonterminal input photo precedes a same-transaction deadline without acquiring its later terminal', () => {
  const s = place(fixture(), 0); wrongMode(s);
  s.scenario = frozen({ ...clone(s.scenario), deadlineTick: s.tick + 1 }); s.deadlineTick = s.tick + 1;
  const p = shoot(s); assert.equal(p.matched, false); assert.equal(p.terminalAfterCapture, null);
  assert.equal(p.filmAfter.remaining, 4); assert.equal(s.lastInterval.terminalAfter.reason, 'deadline');
  assert.deepEqual(s.lastInterval.precedingPhotoReceiptIds, [1]); assert.equal(s.terminal.boundaryTick, p.boundaryTick + 1);
});

test('published photographs and past facts stay frozen and detached through later controls and motion', () => {
  const s = place(fixture(), 0), p = shoot(s), photo = clone(p), interval = s.lastInterval, intervalValue = clone(interval);
  const tx = s.lastTransaction, txValue = clone(tx), target = s.targets[0], targetValue = clone(target);
  assert.notEqual(p.sceneAtCapture, s.scene); assert.notEqual(p.expected, target); assert.notEqual(p.filmAfter, s.film);
  for (const action of [() => { p.sceneAtCapture.actors[0].worldRects[0].x0++; },
    () => p.actorChecks.push({}), () => { p.aperture.rect.y0++; }, () => { s.targetCredits[0].targetIndex++; },
    () => { interval.actors[0].velocityX++; }, () => { s.lastInput.freshA = false; }]) assert.throws(action, TypeError);
  Model.step(s, DT, {}); Model.step(s, DT, { x: 1, b: true });
  assert.deepEqual(p, photo); assert.deepEqual(interval, intervalValue); assert.deepEqual(tx, txValue); assert.deepEqual(target, targetValue);
  assert.equal(s.lastPhoto, null); assert.equal(s.photoReceipts[0], p);
});

test('host retry by create restores exact authored phase, film, input quarantine and empty history', () => {
  const initial = Model.create(733, 2), before = clone(initial), changed = Model.create(733, 2);
  advance(changed, 3); Model.step(changed, DT, { x: 1, a: true, b: true });
  assert.notDeepEqual(changed, before); assert.deepEqual(Model.create(733, 2), before);
  assert.deepEqual(initial, before); // A separate instance and its frozen blueprint were not mutated.
});
