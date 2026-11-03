// Ordinary fresh-input steering from the ACTUAL CURRENT public card only.
// No imports, hypothetical model calls, private helpers, future cards or saved routes.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 });
export const lossPolicies = Object.freeze(['reject', 'adjustments']);
const MAX_CANDIDATES = 37 * 37 * 6;
const need = (ok, message) => { if (!ok) throw Error(message); };
const copy = value => structuredClone(value);
function observed(s) {
  need(s && s.card && s.optics, 'Current public optical card is required');
  const c = s.card;
  for (const field of ['objectX', 'lensMin', 'lensMax', 'screenMin', 'screenMax', 'sourcePower',
    'brightnessMin', 'brightnessMax', 'adjustmentLimit']) need(Number.isSafeInteger(c[field]), 'Missing integer public card field ' + field);
  need(c.objectX >= 0 && c.objectX < c.lensMin && c.lensMin <= c.lensMax && c.lensMax < c.screenMin
    && c.screenMin <= c.screenMax && c.screenMax <= 36, 'Published independent rail ranges are required');
  need(s.objectX === c.objectX && Number.isInteger(s.lensX) && s.lensX >= c.lensMin && s.lensX <= c.lensMax
    && Number.isInteger(s.screenX) && s.screenX >= c.screenMin && s.screenX <= c.screenMax
    && Number.isInteger(s.aperture) && s.aperture >= 1 && s.aperture <= 6, 'Actual controls must remain in the displayed ranges');
  need(s.selected === 'lens' || s.selected === 'screen', 'Actual selected carriage must be visible');
  need(s.lastHeld && typeof s.inputArmed === 'boolean', 'Public fresh-input gate is required');
}
function arithmetic(card, lens, screen, aperture) {
  // Independently expressed published ideal geometry and teaching metrics.
  const u = lens - card.objectX, v = screen - lens;
  const defocus = Math.abs(v * (u - 4) - 4 * u);
  const blurNumerator = 16 * aperture * defocus + (aperture - 1) ** 2 * (4 * u);
  const blurDenominator = 16 * 4 * u;
  const brightnessNumerator = card.sourcePower * aperture * aperture, brightnessDenominator = v * v;
  const real = u > 4;
  const clarity = real && blurNumerator <= blurDenominator;
  const brightness = card.brightnessMin * brightnessDenominator <= brightnessNumerator
    && brightnessNumerator <= card.brightnessMax * brightnessDenominator;
  return { real, clarity, brightness, matches: real && clarity && brightness,
    blur: blurNumerator / blurDenominator, light: brightnessNumerator / brightnessDenominator };
}
function currentCandidate(s) {
  const c = s.card;
  let checked = 0, eligible = 0, best = null;
  // This is a bounded geometric feasibility calculation for one displayed card,
  // never a sequence search. The result is discarded after the next input edge.
  for (let lens = c.lensMin; lens <= c.lensMax; lens++) {
    for (let screen = c.screenMin; screen <= c.screenMax; screen++) {
      for (let aperture = 1; aperture <= 6; aperture++) {
        checked++; need(checked <= MAX_CANDIDATES, 'Current-card arithmetic bound exceeded');
        const optics = arithmetic(c, lens, screen, aperture);
        if (!optics.matches) continue;
        eligible++;
        const distance = Math.abs(lens - s.lensX) + Math.abs(screen - s.screenX) + Math.abs(aperture - s.aperture);
        const selectionCost = (s.selected === 'lens' ? lens === s.lensX && screen !== s.screenX : screen === s.screenX && lens !== s.lensX) ? 1 : 0;
        const row = { lens, screen, aperture, distance, selectionCost, blur: optics.blur, light: optics.light };
        if (!best || distance < best.distance || (distance === best.distance && selectionCost < best.selectionCost)) best = row;
      }
    }
  }
  need(best, 'Current public ranges contain no acceptable setting; no fallback or hidden route');
  need(best.distance <= c.adjustmentLimit - s.adjustmentsUsed, 'Observed remaining adjustments cannot reach a current acceptable setting');
  return { ...best, checked, eligible };
}
function neutral(s) {
  return s.inputArmed && !s.cancelledLast && !s.lastHeld.a && !s.lastHeld.b && s.lastHeld.direction === 'none';
}
export function createPilot({ policy = 'align' } = {}) {
  need(['align', 'reject', 'adjustments', 'idle'].includes(policy), 'Unknown ordinary public-input policy');
  let identity = null, lastCalls = -1, pending = null, origin = null, decisions = 0, lastDecision = null;
  let issued = [], acknowledged = [], arithmeticChecks = 0;
  function reset(s) {
    identity = `${s.seed}:${s.level}`; lastCalls = s.calls; pending = null; origin = null;
    decisions = 0; lastDecision = null; issued = []; acknowledged = []; arithmeticChecks = 0;
  }
  function issue(s, key, intent) {
    need(!pending && neutral(s), 'One genuinely fresh input edge at a time');
    pending = { key, intent, call: s.calls, cardIndex: s.cardIndex, lensX: s.lensX, screenX: s.screenX,
      aperture: s.aperture, selected: s.selected, railMoves: s.railMoves, apertureChanges: s.apertureChanges,
      selections: s.selections, exposures: s.exposures, blockedActions: s.blockedActions };
    issued.push(copy(pending)); return [key];
  }
  function acknowledge(s) {
    const p = pending;
    if (s.calls <= p.call) return [p.key];
    need(s.blockedActions === p.blockedActions, 'Actual intended input hit an unexpected end stop');
    let accepted = false;
    if (p.key === 'b') {
      accepted = s.selections === p.selections + 1;
      if (accepted) need(s.selected !== p.selected, 'B acknowledgment must change the selected carriage');
    } else if (p.key === 'Space') accepted = s.exposures === p.exposures + 1;
    else if (p.key === 'ArrowUp' || p.key === 'ArrowDown') {
      accepted = s.apertureChanges === p.apertureChanges + 1;
      if (accepted) need(s.aperture === p.aperture + (p.key === 'ArrowUp' ? 1 : -1), 'Actual iris changed by the requested one step');
    } else {
      accepted = s.railMoves === p.railMoves + 1;
      if (accepted) need(s[p.selected + 'X'] === p[p.selected + 'X'] + (p.key === 'ArrowRight' ? 1 : -1),
        'Actual selected carriage changed by the requested one step');
    }
    if (!accepted) {
      need(s.calls - p.call <= 40 && s.phase === 'playing', 'Ordinary input was not acknowledged within forty actual calls');
      return [p.key];
    }
    acknowledged.push({ key: p.key, issuedCall: p.call, observedCall: s.calls, cardIndex: s.cardIndex,
      phase: s.phase, lensX: s.lensX, screenX: s.screenX, aperture: s.aperture, exposures: s.exposures });
    pending = null;
    return []; // Real key release precedes the next observation and decision.
  }
  const pilot = snapshot => {
    const s = snapshot?.model;
    if (!s) return [];
    if (identity !== `${s.seed}:${s.level}` || s.calls < lastCalls) reset(s);
    lastCalls = s.calls;
    if (snapshot.paused) return [];
    observed(s);
    if (pending) return acknowledge(s);
    if (snapshot.phase !== 'playing' || s.phase !== 'playing') return [];
    if (!origin) origin = { cardIndex: s.cardIndex, lensX: s.lensX, screenX: s.screenX, aperture: s.aperture,
      energy: s.energy, adjustmentsUsed: s.adjustmentsUsed, exposures: s.exposures, completed: s.completed };
    if (!neutral(s)) return [];
    decisions++;
    if (policy === 'idle') { lastDecision = { kind: 'actual-neutral-idle', call: s.calls }; return []; }
    if (policy === 'reject') {
      need(origin.cardIndex === 0 && origin.energy === 4 && origin.adjustmentsUsed === 0 && origin.exposures === 0
        && origin.completed === 0, 'Natural energy loss must begin with a fresh observed round');
      need(s.cardIndex === origin.cardIndex && s.lensX === origin.lensX && s.screenX === origin.screenX
        && s.aperture === origin.aperture && !s.optics.canExpose, 'Natural rejection retains the actual incorrect initial geometry');
      lastDecision = { kind: 'fresh-current-rejection', call: s.calls, energy: s.energy };
      return issue(s, 'Space', lastDecision.kind);
    }
    if (policy === 'adjustments') {
      const key = s.aperture < 6 ? 'ArrowUp' : 'ArrowDown';
      lastDecision = { kind: 'ordinary-adjustment-overrun', call: s.calls, used: s.adjustmentsUsed, aperture: s.aperture };
      return issue(s, key, lastDecision.kind);
    }
    const live = arithmetic(s.card, s.lensX, s.screenX, s.aperture);
    arithmeticChecks++;
    need(live.matches === s.optics.canExpose && live.clarity === s.optics.clarityOk && live.brightness === s.optics.brightnessOk,
      'Actual current readings disagree with published arithmetic; retain the failed attempt');
    if (s.optics.canExpose) {
      lastDecision = { kind: 'current-real-and-both-bands', call: s.calls, cardIndex: s.cardIndex,
        blur: s.optics.blur, brightness: s.optics.brightness };
      return issue(s, 'Space', lastDecision.kind);
    }
    const candidate = currentCandidate(s);
    arithmeticChecks += candidate.checked;
    lastDecision = { kind: 'current-card-public-math', call: s.calls, cardIndex: s.cardIndex, cardId: s.card.id,
      observed: { objectX: s.objectX, lensX: s.lensX, screenX: s.screenX, aperture: s.aperture,
        selected: s.selected, imageKind: s.optics.imageKind, brightness: s.optics.brightness, blur: s.optics.blur },
      candidate, scope: 'One current-card calculation; discarded after this ordinary input and recomputed from actual feedback.' };
    const selectedTarget = s.selected === 'lens' ? candidate.lens : candidate.screen;
    const selectedPosition = s.selected === 'lens' ? s.lensX : s.screenX;
    if (selectedTarget !== selectedPosition) return issue(s, selectedTarget > selectedPosition ? 'ArrowRight' : 'ArrowLeft', 'current-carriage-step');
    if (candidate.lens !== s.lensX || candidate.screen !== s.screenX) return issue(s, 'b', 'select-other-current-carriage');
    need(candidate.aperture !== s.aperture, 'Public acceptable candidate differs in no control while live flags fail');
    return issue(s, candidate.aperture > s.aperture ? 'ArrowUp' : 'ArrowDown', 'current-iris-step');
  };
  pilot.keys = pilot;
  pilot.diagnostics = () => copy({ policy, boundPerDecision: MAX_CANDIDATES, decisions, arithmeticChecks,
    actualOrigin: origin, lastDecision, issued, acknowledged, pending });
  return pilot;
}
let defaultPilot = createPilot();
export const keys = snapshot => defaultPilot(snapshot);
export function assertProgress({ before, after }, assert) {
  const s = after.model;
  assert.equal(after.phase, 'won'); assert.equal(s.phase, 'won'); assert.equal(s.reason, ''); assert.equal(s.score, 100);
  assert.equal(s.completed, 2); assert.equal(s.cardIndex, 1); assert.ok(s.calls > before.model.calls);
  assert.ok(s.railMoves > 0 && s.apertureChanges > 0); assert.equal(s.blockedActions, 0);
  assert.equal(s.exposures, 2); assert.equal(s.exposureReceipts.length, 2);
  for (const [index, receipt] of s.exposureReceipts.entries()) {
    assert.equal(receipt.cardIndex, index); assert.equal(receipt.matched, true);
    assert.equal(receipt.optics.imageKind, 'real'); assert.equal(receipt.optics.clarityOk, true); assert.equal(receipt.optics.brightnessOk, true);
    assert.ok(receipt.adjustmentsUsed <= receipt.adjustmentLimit);
  }
  assert.equal(s.terminalReceipt.cause, 'success');
}
export function assertRetry({ after, initial }, assert) {
  const actual = after.model, fresh = initial.model;
  assert.equal(actual.phase, 'playing'); assert.equal(actual.cardIndex, 0); assert.equal(actual.completed, 0);
  for (const field of ['card', 'objectX', 'lensX', 'screenX', 'aperture', 'selected', 'energy', 'adjustmentsUsed',
    'optics', 'exposureReceipts', 'terminalReceipt', 'railMoves', 'apertureChanges', 'selections', 'exposures',
    'totalAdjustments', 'blockedActions', 'counterSaturated']) assert.deepEqual(actual[field], fresh[field], 'Retry restores ' + field);
}
