// Public-feedback controller only. No Model import, rollout, search, route or prime pass.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['hold-right-to-edge', 'hold-left-to-edge', 'high-speed-claw'];
export const lossReasons = ['edge', 'edge', 'damage'];
const directionKey = direction => direction > 0 ? 'ArrowRight' : 'ArrowLeft';

export function assertPublicBoard(m, assert) {
  assert.equal(m.id, 'frost-brake');
  assert.ok(Number.isInteger(m.scenario) && m.scenario >= 0 && m.scenario < 3);
  assert.ok(['playing', 'won', 'lost'].includes(m.phase));
  for (const field of ['time', 'x', 'v', 'damage', 'dwell', 'score']) assert.ok(Number.isFinite(m[field]), field);
  assert.ok(Number.isSafeInteger(m.nextSeq) && m.nextSeq >= 0);
  assert.ok(Number.isInteger(m.deliveries) && m.deliveries >= 0 && m.deliveries <= 3);
  assert.equal(m.deliveryReceipts.length, m.deliveries);
  assert.equal(m.layout.docks.length, 3);
  assert.equal(m.layout.halfLength, 1.2);
  assert.equal(m.rules.dockDwell, 0.6);
  assert.equal(m.rules.dockSpeed, 0.3);
  assert.equal(m.rules.safeClawSpeed, 5);
}

export function createPilot({ mode = 'record', policy = 'normal' } = {}) {
  if (mode !== 'record' && mode !== 'loss') throw Error('Unknown pilot mode');
  if (mode === 'loss' && !lossPolicies.includes(policy)) throw Error('Unknown negative policy');
  let brakingSign = 0, lastDelivery = -1, unsafeClaw = false;
  const counts = { decisions: 0, cruise: 0, coast: 0, brake: 0, settle: 0, release: 0 };
  function decide(snapshot) {
    const m = snapshot.model;
    if (!m || m.id !== 'frost-brake') throw Error('Expected public Frost Brake snapshot');
    if (snapshot.paused || snapshot.phase !== 'playing' || m.phase !== 'playing') return [];
    counts.decisions++;
    if (!m.controlsReady) { counts.release++; return []; }
    if (mode === 'loss') {
      if (policy === 'hold-right-to-edge') return ['ArrowRight'];
      if (policy === 'hold-left-to-edge') return ['ArrowLeft'];
      // One actual high-speed observation latches a deliberately unsafe held claw.
      // Direction remains right; actual frost contact and the model decide the outcome.
      if (m.v >= 3 * m.rules.safeClawSpeed) unsafeClaw = true;
      return unsafeClaw ? ['ArrowRight', 'Space'] : ['ArrowRight'];
    }
    const dock = m.layout.docks[m.deliveries];
    if (!dock) return [];
    if (lastDelivery !== m.deliveries) { lastDelivery = m.deliveries; brakingSign = 0; }
    const low = dock.center - dock.width / 2 + m.layout.halfLength;
    const high = dock.center + dock.width / 2 - m.layout.halfLength;
    const contained = m.x >= low && m.x <= high;
    const onFrost = m.layout.frostBands.some(([left, right]) => m.x >= left && m.x <= right);
    if (contained && Math.abs(m.v) <= m.rules.dockSpeed) {
      counts.settle++; return ['Space'];
    }
    function brake() {
      counts.brake++;
      return onFrost ? ['Space'] : [directionKey(-Math.sign(m.v))];
    }
    if (brakingSign && m.v * brakingSign > 0.05) return brake();
    brakingSign = 0;
    const error = dock.center - m.x;
    const toward = Math.sign(error) || -Math.sign(m.v) || 1;
    const approachSpeed = toward * m.v;
    if (approachSpeed < -0.1) { brakingSign = Math.sign(m.v); return brake(); }
    // One closed-form local stopping scale from public forces, with a 0.25s
    // feedback allowance and 0.25m margin. No candidate trajectory is simulated.
    const speed = Math.max(0, approachSpeed);
    const stoppingScale = speed * speed / (2 * (m.rules.baseFriction + m.rules.clawFriction));
    if (speed > m.rules.dockSpeed && Math.abs(error) <= stoppingScale + speed * 0.25 + 0.25) {
      brakingSign = Math.sign(m.v); return brake();
    }
    if (approachSpeed >= 0.84 * m.rules.safeClawSpeed) { counts.coast++; return []; }
    counts.cruise++; return [directionKey(toward)];
  }
  decide.diagnostics = () => ({ ...counts, brakingSign, lastDelivery, unsafeClaw });
  return decide;
}

const defaultPilot = createPilot();
export function keys(snapshot) { return defaultPilot(snapshot); }
export function assertProgress({ before, after }, assert) {
  const m = after.model;
  assertPublicBoard(m, assert);
  assert.ok(m.deliveries > before.model.deliveries, 'At least one actual safe delivery');
  for (const receipt of m.deliveryReceipts) {
    assert.ok(receipt.x >= receipt.allowedCenter[0] && receipt.x <= receipt.allowedCenter[1]);
    assert.ok(Math.abs(receipt.v) <= receipt.speedLimit + 1e-9);
    assert.equal(receipt.dwell, m.rules.dockDwell);
  }
}
export function assertRetry({ before, after }, assert) {
  const m = after.model;
  assert.equal(m.phase, 'playing'); assert.ok(m.time >= 0 && m.time < before.model.time, 'Observed restarted physical clock');
  assert.equal(m.x, m.layout.startX);
  assert.equal(m.v, 0); assert.equal(m.damage, 0); assert.equal(m.deliveries, 0); assert.equal(m.dwell, 0);
  assert.equal(m.score, 0); assert.equal(m.terminalReceipt, null); assert.deepEqual(m.deliveryReceipts, []);
}
