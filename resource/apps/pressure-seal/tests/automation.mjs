// Public-current-state feedback only. No Model import, forecast, simulation or search.
// Bands below are the accepted docs/model-contract.md table, not extracted implementation data.
const bands = [ [[22,38],[46,62],[70,86]], [[42,56],[20,34],[58,72]], [[66,80],[36,50],[78,92]] ];
export const budgets = Object.freeze({ maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 });
export const lossPolicies = Object.freeze(['hold-a', 'heat-without-vent', 'hold-a']);

export function createPilot({ policy = 'feedback', exerciseReset = true } = {}) {
  if (!['feedback', 'hold-a', 'heat-without-vent'].includes(policy)) throw Error('Unknown public feedback policy');
  let heating = false, venting = false, breaking = false, resetExercised = false, decisions = 0;
  const pilot = snapshot => {
    decisions++;
    const s = snapshot?.model;
    if (!s || snapshot.paused || snapshot.phase !== 'playing' || s.phase !== 'playing') return [];
    if (!s.inputArmed) return []; // Real neutral input acknowledges release; never patch the gate.
    if (policy === 'hold-a') return ['Space'];
    if (s.heat < 48) heating = true;
    if (s.heat >= 52) heating = false;
    if (policy === 'heat-without-vent') return heating ? ['Space'] : [];
    const band = bands[s.level]?.[s.materialIndex];
    if (!band) throw Error('Unknown public scenario or material');
    const middle = (band[0] + band[1]) / 2;
    // One visibly executed interruption in STARTER demonstrates that a later seal
    // builds a fresh hold. This reacts only to the currently observed public dwell.
    if (exerciseReset && s.level === 0 && s.materialIndex === 0 && !resetExercised && s.holdTicks >= 20) breaking = true;
    if (breaking && s.pressure > band[1] && s.holdTicks === 0) { breaking = false; resetExercised = true; }
    if (s.pressure > middle + 1) venting = true;
    if (s.pressure < middle - 1) venting = false;
    return [...(heating ? ['Space'] : []), ...(venting && !breaking ? ['b'] : [])];
  };
  pilot.diagnostics = () => ({ policy, exerciseReset, decisions, resetExercised, breaking, heating, venting });
  return pilot;
}

let activePilot = null, lastIdentity = '', lastTick = -1;
export function keys(snapshot, { mode = 'qa' } = {}) {
  const s = snapshot?.model;
  if (!s || snapshot.paused || snapshot.phase !== 'playing') return [];
  const identity = `${mode}:${s.seed}:${s.level}`;
  if (!activePilot || identity !== lastIdentity || s.tick < lastTick) {
    activePilot = createPilot(); lastIdentity = identity;
  }
  lastTick = s.tick;
  return activePilot(snapshot);
}

export function assertProgress({ before, after, trace = [] }, assert) {
  const start = before.model, end = after.model;
  assert.ok(end.tick > start.tick, 'Actual logical ticks advanced');
  assert.ok(end.seals.length > start.seals.length, 'An actual continuous hold sealed a material');
  assert.equal(end.score, 100 * end.seals.length);
  assert.ok(end.inBandTicks >= end.seals.reduce((sum, seal) => sum + seal.requiredTicks, 0));
  assert.notEqual(end.phase, 'lost', 'Normal public feedback did not lose');
  // These are sampled visual-state facts, not a claim of every-tick continuity.
  const samples = [before, ...trace.map(row => row.state ?? row), after].map(row => row.model).filter(Boolean);
  assert.ok(samples.some(s => s.heat > 0 && s.pressure > 0), 'Observed warm pressurized plant');
}

export function assertRetry({ after }, assert) {
  const s = after.model;
  assert.equal(s.phase, 'playing'); assert.equal(s.materialIndex, 0); assert.equal(s.score, 0);
  for (const key of ['pressure','heat','dose','totalHeatDose','holdTicks','inBandTicks','dwellResets','materialInBandTicks','materialPeakHeat']) assert.equal(s[key], 0, 'Retry cleared ' + key);
  assert.deepEqual(s.seals, []); assert.equal(s.counterSaturated, false);
  assert.equal(s.lastAction.a, false); assert.equal(s.lastAction.b, false);
  // Host observation can follow fresh neutral calls; exact tick/remainder/gate zero
  // identity is covered by the actual creation receipt and formal model tests.
}
