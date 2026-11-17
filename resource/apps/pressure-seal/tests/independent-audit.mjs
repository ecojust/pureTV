// Independent public-specification checker. No production imports, stepping API,
// trajectory generation, hidden state, or calculated-state propagation exists here.
// Each local calculation is discarded after comparison with ONE observed pair.
export const PUBLIC_DOC_HASHES = Object.freeze({
  'docs/public-design.md': 'd0273edf80d787509c07257cac017746ffd8011f70432d6b0b5147e9ff78752e',
  'docs/model-contract.md': '18d37a8416a70311d927747e41ff8f339ecc0205d765e35edfbb70a169437bf8',
  'docs/public-interface.md': '3ca2aa65b3876fac16022f64cd5d670794288db79ee754e9a9d38571f018cf2e'
});
export const AUDIT_LIMITATIONS = Object.freeze([
  'Arithmetic checks establish consistency of recorded public facts, not their authenticity or source execution provenance.',
  'No Model, pilot, diagnostic, private witness, or implementation source is read or imported by this checker.',
  'Calculated values never become later observations; missing calls and multi-tick intervals are never reconstructed.',
  'Model runs do not establish browser-visible start/retry, trusted controls, pause duration, rendering, performance, or physical hardware behavior.',
  'JSON snapshots cannot establish fresh object identity, getters/accessors, unrecorded input properties, or the truthfulness of display prose.',
  'Sparse endpoints and cumulative totals cannot establish continuous holds or the absence of intermediate threshold crossings.'
]);

const MAX = 2147483647;
const INITIAL_MESSAGE = '按住 A 加热加压，提前松手；按住 B 泄压。';
const MATERIALS = { tin: { safe: 68, budget: 90 }, fiber: { safe: 62, budget: 105 }, foil: { safe: 58, budget: 120 } };
const STAGES = [
  [['tin', 22, 38, 120], ['fiber', 46, 62, 130], ['foil', 70, 86, 140]],
  [['fiber', 42, 56, 130], ['tin', 20, 34, 130], ['foil', 58, 72, 140]],
  [['foil', 66, 80, 140], ['tin', 36, 50, 140], ['fiber', 78, 92, 150]]
];
const STATE_KEYS = 'schema seed level phase reason tick remainder counterSaturated materialIndex pressure heat dose totalHeatDose holdTicks inBandTicks dwellResets materialInBandTicks materialPeakHeat inputArmed cancelEpoch cancelledLast lastAction seals score events message'.split(' ');
const SEAL_KEYS = 'index material low high requiredTicks holdTicks completedTick pressure heat dose peakHeat inBandTicks'.split(' ');
const own = (x, k) => Object.prototype.hasOwnProperty.call(x, k);
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const finite = x => typeof x === 'number' && Number.isFinite(x);
const integer = (x, low = 0, high = MAX) => Number.isInteger(x) && x >= low && x <= high;
const clamp = (x, low, high) => Math.min(high, Math.max(low, x));
const digest = x => typeof x === 'string' && /^[0-9a-f]{64}$/.test(x);

function same(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const ak = Object.keys(a), bk = Object.keys(b);
  return ak.length === bk.length && ak.every(k => own(b, k) && same(a[k], b[k]));
}
function context() {
  return { findings: [], findingCounts: { failed: 0, 'review-required': 0, 'not-observed': 0 },
    add(status, rule, at, detail) {
      this.findingCounts[status] += 1;
      if (this.findings.length < 200) this.findings.push({ status, rule, at, ...(detail === undefined ? {} : { detail }) });
    },
    expect(ok, rule, at, detail) { if (!ok) this.add('failed', rule, at, detail); return ok; }
  };
}
function finish(c) {
  return { verdict: c.findingCounts.failed ? 'failed' : c.findingCounts['review-required'] ? 'review-required' : c.findingCounts['not-observed'] ? 'not-observed' : 'checked',
    findings: c.findings, findingCounts: c.findingCounts,
    omittedFindings: Object.values(c.findingCounts).reduce((a, b) => a + b, 0) - c.findings.length };
}
function exactKeys(value, keys, c, at) {
  if (!c.expect(object(value), 'object-required', at)) return false;
  return c.expect(same(Object.keys(value).sort(), [...keys].sort()), 'exact-public-schema', at, { actual: Object.keys(value), expected: keys });
}
function compare(value, expected, c, at, skip = []) {
  for (const k of Object.keys(expected)) {
    if (!skip.includes(k)) c.expect(same(value[k], expected[k]), 'public-value', `${at}.${k}`, { actual: value[k], expected: expected[k] });
  }
}
function checkState(s, c, at) {
  let valid = exactKeys(s, STATE_KEYS, c, at);
  if (!object(s)) return false;
  const require = (ok, rule, path, detail) => { if (!c.expect(ok, rule, `${at}.${path}`, detail)) valid = false; };
  require(s.schema === 1, 'schema-version', 'schema');
  require(integer(s.seed, 0, 4294967295), 'seed-range', 'seed');
  require(integer(s.level, 0, 2), 'scenario-range', 'level');
  require(['playing', 'won', 'lost'].includes(s.phase), 'phase', 'phase');
  require(['', 'burst', 'overheat'].includes(s.reason), 'reason', 'reason');
  for (const key of ['tick', 'holdTicks', 'inBandTicks', 'dwellResets', 'materialInBandTicks']) require(integer(s[key]), 'bounded-counter', key);
  require(integer(s.materialIndex, 0, 3), 'material-index', 'materialIndex');
  require(finite(s.remainder) && s.remainder >= 0 && s.remainder < 0.05, 'fractional-time-range', 'remainder');
  for (const [key, high] of [['pressure', 110], ['heat', 100], ['materialPeakHeat', 100], ['dose', 122.1], ['totalHeatDose', 321.3]]) require(finite(s[key]) && s[key] >= 0 && s[key] <= high, 'finite-physical-range', key);
  for (const key of ['counterSaturated', 'inputArmed', 'cancelledLast']) require(typeof s[key] === 'boolean', 'boolean-field', key);
  require(s.cancelEpoch === null || (Number.isSafeInteger(s.cancelEpoch) && s.cancelEpoch >= 0), 'cancel-epoch', 'cancelEpoch');
  require(exactKeys(s.lastAction, ['a', 'b'], c, `${at}.lastAction`) && typeof s.lastAction.a === 'boolean' && typeof s.lastAction.b === 'boolean', 'last-action', 'lastAction');
  require(Array.isArray(s.seals) && s.seals.length <= 3, 'bounded-seals', 'seals');
  require(Array.isArray(s.events) && s.events.length <= 1, 'bounded-events', 'events');
  require(typeof s.message === 'string' && s.message.length > 0 && s.message.length <= 160 && /[\u3400-\u9fff]/u.test(s.message), 'bounded-chinese-display-message', 'message');
  if (!valid) return false;
  require(s.score === s.seals.length * 100 && s.materialIndex === s.seals.length, 'score-and-stage-conservation', 'score');
  require(s.materialPeakHeat >= s.heat, 'peak-at-least-current-heat', 'materialPeakHeat');
  require(s.materialInBandTicks >= s.holdTicks, 'material-count-covers-current-hold', 'materialInBandTicks');
  require(!s.cancelledLast || s.inputArmed === false, 'cancelled-sample-remains-unarmed', 'inputArmed');
  if (s.counterSaturated) c.add('review-required', 'saturated-counter-history', at, 'Exact count/history claims require unsaturated counters.');
  let ledger = 0, inBandLedger = 0, previousTick = 0;
  for (let i = 0; i < s.seals.length; i += 1) {
    const r = s.seals[i], where = `${at}.seals[${i}]`, [material, low, high, required] = STAGES[s.level][i];
    if (!exactKeys(r, SEAL_KEYS, c, where)) { valid = false; continue; }
    compare(r, { index: i, material, low, high, requiredTicks: required, holdTicks: required }, c, where);
    require(finite(r.pressure) && r.pressure >= low && r.pressure <= high, 'seal-pressure-band', `seals[${i}].pressure`);
    require(finite(r.heat) && r.heat >= 0 && r.heat <= 100 && finite(r.peakHeat) && r.peakHeat >= r.heat && r.peakHeat <= 100, 'seal-heat-and-peak', `seals[${i}].heat`);
    require(finite(r.dose) && r.dose >= 0 && r.dose < MATERIALS[material].budget, 'seal-below-damage-budget', `seals[${i}].dose`);
    require(integer(r.inBandTicks, required) && integer(r.completedTick) && r.completedTick <= s.tick, 'seal-counter-ranges', `seals[${i}]`);
    if (!s.counterSaturated) require(r.completedTick >= previousTick + required && r.inBandTicks <= r.completedTick - previousTick, 'ordered-seal-ticks', `seals[${i}].completedTick`);
    previousTick = r.completedTick;
    ledger += r.dose;
    inBandLedger += r.inBandTicks;
  }
  ledger += s.dose;
  if (!s.counterSaturated) {
    const residual = Math.abs(s.totalHeatDose - ledger);
    const tolerance = 64 * Number.EPSILON * (s.tick + 4) * Math.max(1, Math.abs(s.totalHeatDose), Math.abs(ledger));
    require(residual <= tolerance, 'heat-dose-ledger', 'totalHeatDose', { residual, tolerance, ledger });
    require(s.inBandTicks === inBandLedger + s.materialInBandTicks, 'in-band-ledger', 'inBandTicks');
    require(s.inBandTicks <= s.tick && s.dwellResets <= s.tick, 'counts-bounded-by-ticks', 'tick');
  }
  if (s.phase === 'won') {
    compare(s, { reason: '', materialIndex: 3, score: 300, holdTicks: 0, dose: 0, materialInBandTicks: 0, remainder: 0, materialPeakHeat: s.heat }, c, at);
    const final = s.seals[2];
    if (final) compare(s, { pressure: final.pressure, heat: final.heat, tick: final.completedTick }, c, at);
  } else if (s.materialIndex >= 3) {
    require(false, 'only-win-has-three-materials', 'materialIndex');
  } else {
    const [material, , , required] = STAGES[s.level][s.materialIndex], m = MATERIALS[material];
    require(s.holdTicks < required, 'current-hold-not-already-complete', 'holdTicks');
    require(s.dose <= m.budget + (100 - m.safe) * 0.05, 'current-dose-one-tick-overshoot-bound', 'dose');
    if (s.phase === 'playing') require(s.reason === '' && s.pressure < 110 && s.dose < m.budget, 'playing-below-failures', 'phase');
    else require(s.remainder === 0 && ((s.reason === 'burst' && s.pressure === 110) || (s.reason === 'overheat' && s.pressure < 110 && s.dose >= m.budget)), 'terminal-failure-endpoint', 'reason');
  }
  if (s.phase === 'won') require(s.events.length === 1 && s.events[0]?.type === 'win', 'retained-win-event', 'events');
  if (s.phase === 'lost') require(s.events.length === 1 && s.events[0]?.type === 'collision', 'retained-loss-event', 'events');
  for (const event of s.events) {
    const keys = event?.type === 'collision' ? ['type', 'reason', 'materialIndex', 'tick'] : event?.type === 'delivery' ? ['type', 'materialIndex', 'tick'] : ['type', 'tick'];
    if (!exactKeys(event, keys, c, `${at}.events[0]`)) { valid = false; continue; }
    require(['collision', 'delivery', 'win'].includes(event.type) && integer(event.tick) && event.tick <= s.tick, 'public-event', 'events[0]');
    if (event.type === 'collision') require(s.phase === 'lost' && event.reason === s.reason && event.materialIndex === s.materialIndex && event.tick === s.tick, 'collision-event-identity', 'events[0]');
    if (event.type === 'win') require(s.phase === 'won' && event.tick === s.tick, 'win-event-identity', 'events[0]');
    if (event.type === 'delivery') require(s.phase === 'playing' && event.materialIndex === s.materialIndex - 1 && s.seals[event.materialIndex]?.completedTick === event.tick, 'delivery-event-identity', 'events[0]');
  }
  return valid;
}

function normalizedInput(input) {
  const result = {};
  if (!object(input)) return result;
  for (const key of ['a', 'b', 'cancelled', 'cancelEpoch', 'paused']) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (descriptor && own(descriptor, 'value')) result[key] = descriptor.value;
  }
  return result;
}
function checkPair(call, c, at) {
  const result = { checked: false, ticks: 0, noTick: false, noOp: false, holdQualified: false, dwellReset: false, seal: false, neutralRise: false, ventFall: false, cancelled: false };
  const failedAtStart = c.findingCounts.failed;
  if (!c.expect(object(call) && call.kind === 'call' && own(call, 'dt') && own(call, 'input'), 'actual-call-record', at)) return result;
  c.expect(call.error === null, 'recorded-call-has-no-runtime-error', `${at}.error`);
  const beforeOK = checkState(call.before, c, `${at}.before`), afterOK = checkState(call.after, c, `${at}.after`);
  if (!beforeOK || !afterOK) return result;
  const b = call.before, a = call.after, input = normalizedInput(call.input);
  if (b.phase !== 'playing' || !finite(call.dt) || call.dt <= 0 || call.dt > 0.25 || input.paused === true) {
    c.expect(same(a, b), 'exact-no-op', at);
    result.noOp = true;
    result.checked = c.findingCounts.failed === failedAtStart;
    return result;
  }
  const rawA = input.a === true, rawB = input.b === true, cancelled = input.cancelled === true;
  const epochValid = Number.isSafeInteger(input.cancelEpoch) && input.cancelEpoch >= 0;
  const edge = (epochValid && b.cancelEpoch !== null && input.cancelEpoch !== b.cancelEpoch) || (cancelled && !b.cancelledLast);
  const armedBeforeCommand = edge ? false : b.inputArmed;
  const activeA = armedBeforeCommand && !cancelled && rawA, activeB = armedBeforeCommand && !cancelled && rawB;
  result.effectiveA = activeA;
  result.effectiveB = activeB;
  const armedAfter = !cancelled && !rawA && !rawB ? true : armedBeforeCommand;
  const span = b.remainder + call.dt, count = Math.min(5, Math.floor((span + 1e-12) / 0.05));
  const expected = { ...b, events: [], inputArmed: armedAfter, cancelledLast: cancelled,
    cancelEpoch: epochValid ? input.cancelEpoch : b.cancelEpoch, remainder: Math.max(0, span - count * 0.05) };
  result.cancelled = cancelled || edge;
  if (count > 1) {
    compare(a, { schema: b.schema, seed: b.seed, level: b.level, inputArmed: expected.inputArmed, cancelledLast: cancelled, cancelEpoch: expected.cancelEpoch }, c, `${at}.after`);
    c.add('not-observed', 'multi-tick-interval', at, { tickCountDue: count, explanation: 'Intermediate actual pairs are absent. No recurrence replay was performed.' });
    return result;
  }
  if (count === 0) {
    compare(a, expected, c, `${at}.after`, ['message']);
    result.noTick = true;
    result.checked = c.findingCounts.failed === failedAtStart;
    return result;
  }
  result.ticks = 1;
  const [material, low, high, required] = STAGES[b.level][b.materialIndex], m = MATERIALS[material];
  const heat = clamp(b.heat + (100 * Number(activeA) - b.heat) / 60, 0, 100);
  const rawPressure = b.pressure + 0.05 * (3 * Number(activeA) + 0.15 * heat - 5 - 12 * Number(activeB));
  const pressure = clamp(rawPressure, 0, 110), doseAdd = Math.max(0, heat - m.safe) * 0.05;
  let saturated = b.counterSaturated;
  const increment = value => { if (value === MAX) saturated = true; return Math.min(MAX, value + 1); };
  Object.assign(expected, { tick: increment(b.tick), lastAction: { a: activeA, b: activeB }, heat, pressure,
    dose: b.dose + doseAdd, totalHeatDose: b.totalHeatDose + doseAdd, materialPeakHeat: Math.max(b.materialPeakHeat, heat) });
  const failure = rawPressure >= 110 ? 'burst' : expected.dose >= m.budget ? 'overheat' : '';
  if (failure) {
    Object.assign(expected, { phase: 'lost', reason: failure, remainder: 0,
      events: [{ type: 'collision', reason: failure, materialIndex: b.materialIndex, tick: expected.tick }] });
  } else {
    const qualified = b.pressure >= low && b.pressure <= high && pressure >= low && pressure <= high;
    expected.holdTicks = qualified ? b.holdTicks + 1 : 0;
    expected.inBandTicks = qualified ? increment(b.inBandTicks) : b.inBandTicks;
    expected.materialInBandTicks = qualified ? increment(b.materialInBandTicks) : b.materialInBandTicks;
    expected.dwellResets = !qualified && b.holdTicks > 0 ? increment(b.dwellResets) : b.dwellResets;
    result.holdQualified = qualified;
    result.dwellReset = !qualified && b.holdTicks > 0;
    if (expected.holdTicks === required) {
      const receipt = { index: b.materialIndex, material, low, high, requiredTicks: required, holdTicks: required,
        completedTick: expected.tick, pressure, heat, dose: expected.dose, peakHeat: expected.materialPeakHeat, inBandTicks: expected.materialInBandTicks };
      Object.assign(expected, { seals: [...b.seals, receipt], materialIndex: b.materialIndex + 1,
        score: 100 * (b.seals.length + 1), dose: 0, holdTicks: 0, materialInBandTicks: 0, materialPeakHeat: heat });
      if (expected.materialIndex === 3) Object.assign(expected, { phase: 'won', reason: '', remainder: 0, events: [{ type: 'win', tick: expected.tick }] });
      else expected.events = [{ type: 'delivery', materialIndex: b.materialIndex, tick: expected.tick }];
      result.seal = true;
    }
  }
  expected.counterSaturated = saturated;
  compare(a, expected, c, `${at}.after`, ['message']);
  result.neutralRise = !activeA && !activeB && b.heat > 0 && a.pressure > b.pressure;
  result.ventFall = !activeA && activeB && b.heat > 0 && a.pressure < b.pressure;
  result.checked = c.findingCounts.failed === failedAtStart;
  return result;
}

function checkDigestMap(map, c, at) {
  c.expect(object(map) && Object.keys(map).length > 0 && Object.values(map).every(digest), 'declared-source-digest-map', at);
}
function checkDocuments(map, c, at) {
  c.expect(object(map), 'public-document-digests-required', at);
  if (object(map)) compare(map, PUBLIC_DOC_HASHES, c, at);
}
function checkTimestamp(value, c, at) {
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
  c.expect(Number.isFinite(parsed), 'observed-iso-timestamp', at);
  return parsed;
}
function checkOrigin(origin, c) {
  if (!c.expect(object(origin) && origin.kind === 'origin', 'origin-schema', 'origin')) return false;
  c.expect(origin.channel === 'model' && ['create', 'retry'].includes(origin.origin), 'model-origin-kind', 'origin');
  c.expect(typeof origin.runId === 'string' && origin.runId.length > 0, 'run-identity', 'origin.runId');
  c.expect(integer(origin.seed, 0, 4294967295) && integer(origin.level, 0, 2), 'origin-configuration', 'origin');
  c.expect(origin.dt === 1 / 60 && origin.completeCallCapture === true, 'ordinary-capture-declaration', 'origin');
  c.expect(['feedback', 'hold-a', 'heat-without-vent'].includes(origin.policy), 'ordinary-policy-label', 'origin.policy');
  c.expect(['won', 'lost'].includes(origin.expectedOutcome), 'declared-ordinary-outcome', 'origin.expectedOutcome');
  checkDigestMap(origin.sourceHashes, c, 'origin.sourceHashes');
  checkDocuments(origin.publicDocHashes, c, 'origin.publicDocHashes');
  if (!checkState(origin.created, c, 'origin.created')) return false;
  const expected = { schema: 1, seed: origin.seed, level: origin.level, phase: 'playing', reason: '', tick: 0, remainder: 0,
    counterSaturated: false, materialIndex: 0, pressure: 0, heat: 0, dose: 0, totalHeatDose: 0, holdTicks: 0,
    inBandTicks: 0, dwellResets: 0, materialInBandTicks: 0, materialPeakHeat: 0, inputArmed: false,
    cancelEpoch: null, cancelledLast: false, lastAction: { a: false, b: false }, seals: [], score: 0, events: [], message: INITIAL_MESSAGE };
  compare(origin.created, expected, c, 'origin.created');
  return true;
}

export function auditObservedPair(call) {
  const c = context(), facts = checkPair(call, c, 'call');
  return { ...finish(c), facts, limitations: [...AUDIT_LIMITATIONS] };
}
export function auditOrdinaryRun(run) {
  const c = context();
  const counts = { calls: 0, checkedPairs: 0, physicsTicks: 0, noTickCalls: 0, noOpCalls: 0, qualifyingTicks: 0, dwellResets: 0, seals: 0, neutralRiseTicks: 0, ventFallTicks: 0, cancellationCalls: 0 };
  const coverage = { directlyCheckedPairIndices: [], completeHolds: false, heldAReleaseThenNeutralRise: false,
    dwellInterruptionThenSeal: false, ventFallWithStoredHeat: false, browserLifecycle: 'not-observed', referenceIdentity: 'not-observed' };
  if (!c.expect(object(run) && run.schema === 1 && run.kind === 'pressure-seal-ordinary-run', 'run-envelope', 'run')) return { ...finish(c), counts, coverage, completeChain: false, limitations: [...AUDIT_LIMITATIONS] };
  c.expect(!own(run, 'pilotDiagnostics'), 'public-only-projection', 'run');
  const originOK = checkOrigin(run.origin, c), origin = run.origin || {};
  let chain = originOK, previous = origin.created, previousTime = checkTimestamp(origin.observedAt, c, 'origin.observedAt');
  let previousEffectiveA = false, awaitingNeutralRise = false, sawReset = false;
  if (!c.expect(Array.isArray(run.calls), 'actual-calls-array', 'calls')) chain = false;
  for (const [index, call] of (Array.isArray(run.calls) ? run.calls : []).entries()) {
    const at = `calls[${index}]`, failuresBefore = c.findingCounts.failed, reviewsBefore = c.findingCounts['review-required'], gapsBefore = c.findingCounts['not-observed'];
    counts.calls += 1;
    if (!object(call)) { c.add('failed', 'actual-call-record', at); chain = false; continue; }
    if (!c.expect(call.seq === index + 1, 'complete-call-sequence', `${at}.seq`)) chain = false;
    if (!c.expect(call.dt === 1 / 60, 'ordinary-one-sixtieth-duration', `${at}.dt`)) chain = false;
    const observedTime = checkTimestamp(call.observedAt, c, `${at}.observedAt`);
    c.expect(observedTime >= previousTime, 'nondecreasing-observation-time', at);
    previousTime = observedTime;
    if (!c.expect(same(previous, call.before), 'actual-observation-chain', `${at}.before`)) chain = false;
    const facts = checkPair(call, c, at);
    if (facts.checked) {
      counts.checkedPairs += 1;
      coverage.directlyCheckedPairIndices.push(call.seq);
      counts.physicsTicks += facts.ticks;
      counts.noTickCalls += Number(facts.noTick);
      counts.noOpCalls += Number(facts.noOp);
      counts.qualifyingTicks += Number(facts.holdQualified);
      counts.dwellResets += Number(facts.dwellReset);
      counts.seals += Number(facts.seal);
      counts.neutralRiseTicks += Number(facts.neutralRise);
      counts.ventFallTicks += Number(facts.ventFall);
      counts.cancellationCalls += Number(facts.cancelled);
    }
    const raw = normalizedInput(call.input);
    if (facts.checked && previousEffectiveA && raw.a !== true && raw.b !== true && raw.cancelled !== true && !facts.cancelled) awaitingNeutralRise = true;
    if (raw.a === true || raw.b === true || raw.cancelled === true || facts.cancelled) awaitingNeutralRise = false;
    if (facts.checked && facts.neutralRise && awaitingNeutralRise) coverage.heldAReleaseThenNeutralRise = true;
    previousEffectiveA = facts.checked && facts.effectiveA === true;
    if (facts.checked && facts.dwellReset) sawReset = true;
    if (facts.checked && facts.seal && sawReset) coverage.dwellInterruptionThenSeal = true;
    coverage.ventFallWithStoredHeat ||= facts.checked && facts.ventFall;
    if (!facts.checked || c.findingCounts.failed !== failuresBefore || c.findingCounts['review-required'] !== reviewsBefore || c.findingCounts['not-observed'] !== gapsBefore) chain = false;
    // ONLY the actual recorded after-state is retained for continuity comparison.
    previous = call.after;
  }
  const end = run.end;
  if (c.expect(object(end) && end.kind === 'end', 'end-record', 'end')) {
    checkState(end.final, c, 'end.final');
    c.expect(same(previous, end.final), 'actual-final-state-chain', 'end.final');
    c.expect(end.calls === counts.calls && end.ticks === end.final?.tick && end.complete === true, 'complete-end-counts', 'end');
    c.expect(end.outcome === end.final?.phase && end.reason === end.final?.reason, 'observed-outcome-identity', 'end');
    c.expect(end.failure === null, 'retained-attempt-has-no-failure', 'end.failure');
    c.expect(end.outcome === origin.expectedOutcome, 'origin-outcome-expectation', 'end.outcome');
    c.expect(['won', 'lost'].includes(end.outcome), 'ordinary-terminal-outcome-required', 'end.outcome');
    c.expect(checkTimestamp(end.observedAt, c, 'end.observedAt') >= previousTime, 'nondecreasing-end-time', 'end.observedAt');
  } else chain = false;
  chain = chain && c.findingCounts.failed === 0 && c.findingCounts['review-required'] === 0 && c.findingCounts['not-observed'] === 0 && counts.calls > 0;
  coverage.completeHolds = chain && counts.seals > 0;
  if (!chain) {
    coverage.heldAReleaseThenNeutralRise = false;
    coverage.dwellInterruptionThenSeal = false;
    c.add('review-required', 'incomplete-or-inconsistent-chain', 'run', 'No continuous-hold or full-history claim is made. Individual checked pair indices remain listed.');
  }
  return { schema: 'pressure-seal-independent-run-audit-v1', runId: origin.runId, level: origin.level, channel: origin.channel,
    ...finish(c), completeChain: chain, counts, coverage, outcome: { phase: end?.final?.phase, reason: end?.final?.reason },
    sourceHashes: origin.sourceHashes, publicDocHashes: origin.publicDocHashes, limitations: [...AUDIT_LIMITATIONS] };
}

export function auditSparseObservations(envelope) {
  const c = context(), gaps = [], checkedEndpoints = [], checkedPairs = [];
  if (!c.expect(object(envelope) && envelope.schema === 1 && envelope.kind === 'pressure-seal-public-observations', 'sparse-envelope', 'observations')) return { ...finish(c), limitations: [...AUDIT_LIMITATIONS] };
  c.expect(!own(envelope, 'pilotDiagnostics'), 'public-only-projection', 'observations');
  c.expect(envelope.channel === 'browser', 'sparse-browser-channel', 'observations.channel');
  checkDocuments(envelope.publicDocHashes, c, 'observations.publicDocHashes');
  let previous;
  if (c.expect(Array.isArray(envelope.observations), 'observations-array', 'observations')) {
    for (const [index, observation] of envelope.observations.entries()) {
      const at = `observations[${index}]`, failures = c.findingCounts.failed;
      if (!c.expect(object(observation), 'observation-object', at)) continue;
      c.expect(integer(observation.seq, 1), 'observation-sequence', at);
      checkTimestamp(observation.observedAt, c, `${at}.observedAt`);
      checkState(observation.model, c, `${at}.model`);
      if (c.findingCounts.failed === failures) checkedEndpoints.push(observation.seq);
      if (previous) {
        c.expect(observation.seq > previous.seq, 'increasing-observation-sequence', at);
        gaps.push({ from: previous.seq, to: observation.seq, beforeTick: previous.model?.tick, afterTick: observation.model?.tick, status: 'not-observed', reason: 'Endpoint spacing does not certify intervening calls or controls.' });
      }
      previous = observation;
    }
  }
  if (envelope.calls !== undefined && c.expect(Array.isArray(envelope.calls), 'optional-actual-call-pairs', 'calls')) {
    for (const [index, call] of envelope.calls.entries()) if (checkPair(call, c, `calls[${index}]`).checked) checkedPairs.push(call.seq ?? index + 1);
  }
  if (checkedEndpoints.length === 0 && checkedPairs.length === 0 && c.findingCounts.failed === 0) c.add('not-observed', 'no-checkable-observations', 'observations');
  return { schema: 'pressure-seal-independent-sparse-audit-v1', ...finish(c), channel: 'browser',
    checkedEndpointIndices: checkedEndpoints, directlyCheckedPairIndices: checkedPairs, gaps,
    continuousCoverage: 'not-observed', holdHistory: 'not-observed', trustedControlProvenance: 'not-observed',
    limitations: [...AUDIT_LIMITATIONS] };
}
