/* Conveyor Window: public fixed-tick rules; no renderer or wall-clock state. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  const detached = value => freeze(clone(value));
  const PUBLIC = freeze({
  "schemaVersion": 1,
  "designStatus": "reviewed-public-rules",
  "identity": {"gameId":34,"name":"窗口装配","englishName":"Conveyor Window","slug":"conveyor-window","packageId":"com.ecojust.conveyorwindowtv","versionName":"0.2.0","versionCode":2,"seed":734,"actionCount":2,"assignmentSha256":"a5bb4b25c666c96c558e8ad9d08e901deb42b8b12ce4eff22be8bfe43cd0ecd7"},
  "premise": "Use a magnetic gripper to take shaped components from an upper conveyor and seat them in matching sockets on a different-speed lower conveyor. The divider's timed shutter must be open when a held component is sent through it. Rotate the component to the visible socket orientation. Build the required unbroken streak before three mistakes or the deadline.",
  "geometry": {
    "unitsPerCell":60,"ticksPerSecond":60,"trackLengthUnits":720,"sourceY":90,"heldY":150,"targetY":270,"barrierYRange":[198,222],
    "partSizeUnits":36,"partHalfSizeUnits":18,"gripperXRange":[36,684],"initialGripperX":360,
    "gripperSpeedUnitsPerTick":4,"pickupRadiusUnits":60,"placementRadiusUnits":60,
    "origin":"x increases right; y increases down; both conveyor centers occupy x in [0,720)",
    "distanceRule":"ordinary absolute x distance, never wrap-around distance; equality at a pickup/placement limit is accepted",
    "windowFit":"the held component's full square footprint [gripperX-18,gripperX+18] must be contained in the scenario windowXRange; equality is accepted",
    "transfer":"An admitted held A is an instantaneous vertical dispatch at the current gripper x through the shutter. Below the divider, a magnetic seat snaps the part to a socket within placementRadiusUnits. This is an explicit atomic interaction, not a simulated flight. The socket itself need not be directly inside the divider opening; the displayed magnetic reach bracket explains the snap.",
    "nearest":"choose the minimum absolute-x-distance object, then lexicographically smallest carrier/slot ID for an exact tie; never ignore an occupied or wrong-type nearer slot to select a farther one",
    "rotation":"quarter turns 0,1,2,3, clockwise in screen coordinates; 0 is the published profile orientation. Types use asymmetric silhouettes plus a keyed corner mark, so all four orientations are visibly distinct."
  },
  "partTypes": [
    {"id":"elbow","name":"直角件","tone":"copper","profile":[[-14,-14],[14,-14],[14,-4],[-4,-4],[-4,14],[-14,14]]},
    {"id":"arrow","name":"箭头件","tone":"teal","profile":[[-14,-6],[2,-6],[2,-14],[14,0],[2,14],[2,6],[-14,6]]},
    {"id":"fork","name":"叉形件","tone":"violet","profile":[[-14,-14],[14,-14],[14,-4],[0,-4],[0,4],[8,4],[8,14],[-14,14]]},
    {"id":"hook","name":"钩形件","tone":"gold","profile":[[-14,-14],[0,-14],[0,4],[6,4],[6,-4],[14,-4],[14,14],[-14,14]]}
  ],
  "motion": {
    "phase":"conveyor x is mod(initialX+velocityUnitsPerTick*tick,720), with nonnegative modulo",
    "wrapping":"on each actual one-tick interval, compute rawX=currentX+velocity; wrap when rawX>=720 or rawX<0, not merely when rawX==0. Set x=mod(rawX,720) and increment that carrier/slot generation exactly once. All authored speed magnitudes are below720.",
    "sourceWrap":"If a source carrier still contains its current part, retire that unpicked part at the exit. Then increment generation and create exactly one new part with the carrier's authored type and initial orientation. If its old part was held, seated, completed or damaged, do not change that old part; the replacement has a new ID.",
    "targetWrap":"If a target slot is occupied, move that part to completed storage and clear the slot, without changing score or streak. Increment slot generation; the same visible slot returns empty with the same type/orientation. An empty slot also increments generation.",
    "ownershipOrder":"Input B/A changes ownership first. Then compute every carrier/slot's new position and wrap facts. Apply source retire/refill and target completed/clear on their own wrap facts. Finally update the gripper x and the positions of source/held/seated parts from their current unique owner. A part held before its source wraps is never retired by that wrap. A newly seated part may legitimately complete at a target exit in this same interval.",
    "partCoordinates":"source parts follow their source carrier at sourceY; the one held part follows only gripperX at heldY; seated parts follow only their target slot at targetY. Completed/retired parts keep their exit coordinate x=720 for positive direction or x=0 for negative direction; damaged parts keep the actual dispatch origin at heldY. Nonactive history is not rendered on the belts."
  },
  "gate": {
    "phase":"phaseTick=mod(tick+scenario.gate.phaseOffsetTicks,scenario.gate.periodTicks)",
    "open":"openFromPhaseTick <= phaseTick < openUntilPhaseTick",
    "singleBoundary":"create, input eligibility, held-A collision, HUD and rendering all consume the same gate value for the same model.tick. One A receipt records that exact boundary value. After a real interval, recompute gate at the new tick for the new state. No check uses next tick's gate to judge a current action.",
    "physicalScope":"Only an explicit held-A dispatch crosses the divider. Ordinary horizontal carrying above it never collides with the closed shutter; opening or closing alone cannot crush a waiting part."
  },
  "controls": {
    "horizontal":"raw x is clamped to[-1,1]; x>=0.55 requests right velocity4, x<=-0.55 requests left velocity-4, otherwise zero. Movement is continuous per fixed tick and clamped to gripperXRange. y is retained for input observability and neutral acknowledgement but does not move the one-axis gripper.",
    "a":{"label":"抓取 / 投送","empty":"take the nearest occupied source carrier only if distance<=60; otherwise record an empty-grab miss without a fault","held":"dispatch the currently held part once; successful seating increments streak, a rejected dispatch damages the part and resets streak"},
    "b":{"label":"旋转90°","meaning":"rotate the held part clockwise once, modulo4; empty-handed B does nothing"},
    "sameBoundaryOrder":"normalize input and apply cancellation/neutral quarantine; fresh B; fresh A; then advance both belts and the gripper exactly one actual tick; then apply terminal priority",
    "sameFresh":"Held B+A rotates first and dispatches the changed orientation. Empty-handed B+A cannot rotate the part that A is about to pick up. Horizontal input affects only the following interval: pickup, gate, fit, slot and orientation are all judged at the original gripper x and original tick.",
    "edges":"effectiveA=rawA OR rawAPressed and effectiveB=rawB OR rawBPressed, with independent armed latches. One held press acts once; false effective input rearms the corresponding latch only outside quarantine.",
    "cancellation":"Initially quarantined with both latches disarmed. cancelled=true or a changed finite cancelEpoch suppresses B/A and horizontal velocity for the entire call; it does not pause belt motion. A later noncancelled complete neutral sample clears quarantine, rearms both latches, and still issues no action or movement. Complete neutral means both normalized axes below threshold and all raw held/pressed A/B fields false. A cancelled synthetic neutral never rearms.",
    "pause":"host pause stops Model.step and freezes every model field; resume uses existing cancel/neutral handling, with no wall-clock catch-up"
  },
  "dispatch": {
    "qualificationOrder":["shutter_closed","outside_window","no_slot_in_reach","occupied_slot","wrong_type","wrong_orientation","seated"],
    "shutter_closed":"gate.open is false",
    "outside_window":"the held footprint does not fit windowXRange",
    "no_slot_in_reach":"the nearest lower slot is farther than60 units",
    "occupied_slot":"that nearest in-reach slot has an occupant; never overwrite it",
    "wrong_type":"the held type differs from that slot's requiredType",
    "wrong_orientation":"types match but quarter turns differ from requiredQuarterTurns",
    "seated":"place exactly that held part into exactly that empty slot generation; clear heldPartId; increment totalCorrect and streak once",
    "fault":"Any of the six rejected dispatch reasons damages exactly the held part, clears heldPartId, increments faults once and resets streak to0. Wrong orientation, a missed socket and an occupied socket are assembly mistakes. Empty grabs and empty B are harmless. No silent part return or destruction is permitted."
  },
  "roundRules": {
    "goal":"streak>=scenario.requiredStreak; only consecutive correct dispatches count. Any damaged dispatch resets the streak, while totalCorrect and previously completed parts remain factual history.",
    "faultLimit":3,
    "deadline":"tick reaches scenario.deadlineTick after the real interval; no later action is admitted",
    "terminalPriority":"After B/A and one complete actual interval: required streak wins; otherwise faults>=3 loses with fault_limit; otherwise deadline loses with deadline. A final correct dispatch at deadlineTick-1 wins at deadlineTick. An action at or after deadlineTick is impossible in an active ordinary state.",
    "lastStep":"Every valid positive active call advances tick by exactly1, even if its starting action earns the win or reaches the fault limit. No input-only transaction counter or zero-interval terminal is needed. Action receipts use boundaryTick=t, state ends at tick=t+1, and lastStep records that actual interval.",
    "score":"100*totalCorrect while active/lost; on win 1000+100*requiredStreak+100*(3-faults). Score never changes collision or matching.",
    "retry":"create the same scenario and seed at tick0: restore all initial belt coordinates, source parts, empty target slots, gripperx360, no held part, streak/faults/totalCorrect0, empty receipts, initial gate and quarantine"
  },
  "scenarios": [
    {"id":"copper-starter","name":"铜件初装","sourceVelocity":2,"targetVelocity":1,"windowXRange":[240,480],"requiredStreak":6,"deadlineTick":5040,"gate":{"periodTicks":360,"phaseOffsetTicks":0,"openFromPhaseTick":120,"openUntilPhaseTick":240},"sourceCarriers":[{"id":"source-a","initialX":180,"type":"elbow","initialQuarterTurns":0},{"id":"source-b","initialX":540,"type":"arrow","initialQuarterTurns":0}],"targetSlots":[{"id":"slot-a","initialX":180,"requiredType":"elbow","requiredQuarterTurns":1},{"id":"slot-b","initialX":540,"requiredType":"arrow","requiredQuarterTurns":3}]},
    {"id":"reverse-feed","name":"逆送三件","sourceVelocity":-2,"targetVelocity":1,"windowXRange":[420,600],"requiredStreak":6,"deadlineTick":5400,"gate":{"periodTicks":480,"phaseOffsetTicks":0,"openFromPhaseTick":180,"openUntilPhaseTick":300},"sourceCarriers":[{"id":"source-a","initialX":630,"type":"elbow","initialQuarterTurns":0},{"id":"source-b","initialX":150,"type":"arrow","initialQuarterTurns":1},{"id":"source-c","initialX":390,"type":"fork","initialQuarterTurns":3}],"targetSlots":[{"id":"slot-a","initialX":270,"requiredType":"elbow","requiredQuarterTurns":2},{"id":"slot-b","initialX":510,"requiredType":"arrow","requiredQuarterTurns":3},{"id":"slot-c","initialX":30,"requiredType":"fork","requiredQuarterTurns":0}]},
    {"id":"counterflow-keys","name":"对流精装","sourceVelocity":2,"targetVelocity":-1,"windowXRange":[120,264],"requiredStreak":5,"deadlineTick":5400,"gate":{"periodTicks":540,"phaseOffsetTicks":0,"openFromPhaseTick":120,"openUntilPhaseTick":240},"sourceCarriers":[{"id":"source-a","initialX":192,"type":"elbow","initialQuarterTurns":0},{"id":"source-b","initialX":372,"type":"arrow","initialQuarterTurns":0},{"id":"source-c","initialX":552,"type":"fork","initialQuarterTurns":1},{"id":"source-d","initialX":12,"type":"hook","initialQuarterTurns":2}],"targetSlots":[{"id":"slot-a","initialX":372,"requiredType":"elbow","requiredQuarterTurns":3},{"id":"slot-b","initialX":552,"requiredType":"arrow","requiredQuarterTurns":1},{"id":"slot-c","initialX":12,"requiredType":"fork","requiredQuarterTurns":2},{"id":"slot-d","initialX":192,"requiredType":"hook","requiredQuarterTurns":0}]},
    {"id":"backshift-workshop","name":"双向换线","sourceVelocity":-1,"targetVelocity":-2,"windowXRange":[300,540],"requiredStreak":7,"deadlineTick":6600,"gate":{"periodTicks":420,"phaseOffsetTicks":90,"openFromPhaseTick":120,"openUntilPhaseTick":300},"sourceCarriers":[{"id":"source-a","initialX":48,"type":"elbow","initialQuarterTurns":1},{"id":"source-b","initialX":228,"type":"arrow","initialQuarterTurns":2},{"id":"source-c","initialX":408,"type":"fork","initialQuarterTurns":0},{"id":"source-d","initialX":588,"type":"hook","initialQuarterTurns":3}],"targetSlots":[{"id":"slot-a","initialX":408,"requiredType":"elbow","requiredQuarterTurns":3},{"id":"slot-b","initialX":588,"requiredType":"arrow","requiredQuarterTurns":0},{"id":"slot-c","initialX":48,"requiredType":"fork","requiredQuarterTurns":1},{"id":"slot-d","initialX":228,"requiredType":"hook","requiredQuarterTurns":2}]},
    {"id":"precision-slot","name":"窄窗快装","sourceVelocity":3,"targetVelocity":1,"windowXRange":[300,420],"requiredStreak":6,"deadlineTick":6600,"gate":{"periodTicks":300,"phaseOffsetTicks":60,"openFromPhaseTick":90,"openUntilPhaseTick":210},"sourceCarriers":[{"id":"source-a","initialX":120,"type":"elbow","initialQuarterTurns":2},{"id":"source-b","initialX":360,"type":"arrow","initialQuarterTurns":1},{"id":"source-c","initialX":600,"type":"fork","initialQuarterTurns":3}],"targetSlots":[{"id":"slot-a","initialX":480,"requiredType":"elbow","requiredQuarterTurns":1},{"id":"slot-b","initialX":0,"requiredType":"arrow","requiredQuarterTurns":3},{"id":"slot-c","initialX":240,"requiredType":"fork","requiredQuarterTurns":0}]},
    {"id":"night-shift","name":"夜班协同","sourceVelocity":-2,"targetVelocity":2,"windowXRange":[168,432],"requiredStreak":8,"deadlineTick":7200,"gate":{"periodTicks":420,"phaseOffsetTicks":120,"openFromPhaseTick":90,"openUntilPhaseTick":270},"sourceCarriers":[{"id":"source-a","initialX":60,"type":"elbow","initialQuarterTurns":3},{"id":"source-b","initialX":240,"type":"arrow","initialQuarterTurns":2},{"id":"source-c","initialX":420,"type":"fork","initialQuarterTurns":1},{"id":"source-d","initialX":600,"type":"hook","initialQuarterTurns":0}],"targetSlots":[{"id":"slot-a","initialX":360,"requiredType":"elbow","requiredQuarterTurns":0},{"id":"slot-b","initialX":540,"requiredType":"arrow","requiredQuarterTurns":1},{"id":"slot-c","initialX":0,"requiredType":"fork","requiredQuarterTurns":3},{"id":"slot-d","initialX":180,"requiredType":"hook","requiredQuarterTurns":2}]}
  ],
  "sharedRuntime": {
    "exports":["create(seed=734,difficulty=0)","step(state,dt,input)"],
    "createInputDomain":"nonnegative safe-integer seed; difficulty integer0 through scenarios.length-1; omitted/undefined uses defaults; invalid values throw RangeError. Valid seeds are recorded but do not randomize authored scenarios.",
    "dt":"dt=0 and terminal calls are complete no-ops; active positive dt must be finite and within1e-12 of1/60, otherwise throw before mutation",
    "inputDomain":"missing/nonfinite x/y become0; finite axes clamp to[-1,1]; only literal true button/cancel flags count. Finite cancelEpoch is tracked, other epoch values are ignored. The first observed finite epoch is stored and counts as changed relative to null.",
    "selectionPreview":"only current-boundary nearest source/slot IDs, distances, current gate, window fit and held/required type/orientation. Do not publish future opening actions, a route or a recommended input. A always recomputes after this call's B rather than trusting the old preview.",
    "ownedState":"the model publishes current positions and exclusive owners plus detached action and wrap/output receipts. The renderer observes these facts; it does not independently choose gate state, advance belts or move a held part with its old carrier."
  },
  "presentation": {
    "logicalResolution":[960,540],"renderer":"one shared WebGL1 atlas and one draw submission, static baked material/shape sprites, no per-frame texture uploads",
    "visualDirection":"bright enamel-blue assembly bench, brushed metal rails, copper/teal/violet/gold keyed components; smooth continuous vector profiles and bevels, no pixel grid",
    "requiredViews":["two visibly moving conveyors with direction/speed labels","upper source components and lower empty/occupied keyed sockets","one visible held component at the gripper, never duplicated on its source carrier","physical shutter and its actual open/closed state","magnetic pickup/seating reach bracket","actual current streak, required streak, total correct, faults and deadline","last action result and recent completed output strip"],
    "blueprint":"menu and pause show upper/lower belt directions, actual keyed type/orientation pairs, window width, authored open duration and cycle duration, required consecutive count and three-error limit",
    "instructions":["左右移动磁力夹具；A抓取，再按A穿窗投送。","B将手中零件顺时针旋转90°，让形状与缺口朝向匹配下带槽位。","只在闸窗打开、夹具完整位于窗口且下方槽位进入吸附范围时投送。投错会损坏零件并清零连装。","槽位到出口后会清空返回；抓起的零件只跟随夹具。连续完成目标数量即可过关。"]
  },
  "authorizationBoundary":"Reviewed public rules. Implementation and validation results are tracked separately; this contract is not evidence of executed tests or gameplay."
});
const mod = (n, period) => n - period * Math.floor(n / period);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const counters = s => ({ streak: s.streak, totalCorrect: s.totalCorrect, faults: s.faults });
  const partById = (s, id) => id === null ? null : s.parts.find(part => part.id === id);
  function gateAt(s, tick) {
    const rule = s.scenario.gate, phaseTick = mod(tick + rule.phaseOffsetTicks, rule.periodTicks);
    return { tick, phaseTick, open: phaseTick >= rule.openFromPhaseTick && phaseTick < rule.openUntilPhaseTick,
      windowXRange: s.scenario.windowXRange.slice() };
  }
  function fitsWindow(s) {
    const half = s.physics.geometry.partHalfSizeUnits, range = s.scenario.windowXRange;
    return s.gripper.x - half >= range[0] && s.gripper.x + half <= range[1];
  }
  function nearest(rows, x) {
    let best = null;
    for (const row of rows) {
      if (!best || Math.abs(row.x - x) < Math.abs(best.x - x) ||
          (Math.abs(row.x - x) === Math.abs(best.x - x) && row.id < best.id)) best = row;
    }
    return best;
  }
  function previewAt(s) {
    const g = s.physics.geometry, x = s.gripper.x;
    const source = nearest(s.sourceCarriers.filter(row => row.partId !== null), x), slot = nearest(s.targetSlots, x);
    const distance = row => Math.abs(row.x - x);
    return { tick: s.tick, gripperX: x, heldPartId: s.gripper.heldPartId, gateOpen: s.gate.open, windowFits: fitsWindow(s),
      nearestSource: source ? { id: source.id, generation: source.generation, x: source.x, distance: distance(source),
        inReach: distance(source) <= g.pickupRadiusUnits, partId: source.partId } : null,
      nearestSlot: slot ? { id: slot.id, generation: slot.generation, x: slot.x, distance: distance(slot),
        inReach: distance(slot) <= g.placementRadiusUnits, occupantPartId: slot.occupantPartId,
        requiredType: slot.requiredType, requiredQuarterTurns: slot.requiredQuarterTurns } : null };
  }
  function spawn(s, carrier, tick) {
    const part = { id: carrier.id + '@' + carrier.generation, sourceCarrierId: carrier.id,
      birthGeneration: carrier.generation, type: carrier.type, quarterTurns: carrier.initialQuarterTurns,
      owner: 'source', ownerId: carrier.id, ownerGeneration: carrier.generation, x: carrier.x, y: carrier.y,
      createdTick: tick, endedTick: null, endReason: null };
    carrier.partId = part.id; s.parts.push(part); return part.id;
  }
  function create(seed = 734, difficulty = 0) {
    if (!Number.isSafeInteger(seed) || seed < 0 || !Number.isInteger(difficulty) || difficulty < 0 || difficulty >= PUBLIC.scenarios.length) {
      throw new RangeError('Expected a nonnegative safe-integer seed and difficulty within the authored scenario range');
    }
    const scenario = detached(PUBLIC.scenarios[difficulty]), geometry = PUBLIC.geometry;
    const s = { width: 960, height: 540, seed, difficulty, level: difficulty + 1, levelName: scenario.name,
      scenarioId: scenario.id, phase: 'playing', tick: 0, elapsed: 0, score: 0, lostReason: null, message: '',
      schemaVersion: PUBLIC.schemaVersion, identity: detached(PUBLIC.identity), scenario,
      physics: detached({ geometry, motion: PUBLIC.motion, gate: PUBLIC.gate, dispatch: PUBLIC.dispatch, roundRules: PUBLIC.roundRules }),
      partTypes: detached(PUBLIC.partTypes), deadlineTick: scenario.deadlineTick, requiredStreak: scenario.requiredStreak,
      faultLimit: PUBLIC.roundRules.faultLimit, streak: 0, totalCorrect: 0, faults: 0,
      gripper: { x: geometry.initialGripperX, y: geometry.heldY, heldPartId: null },
      sourceCarriers: scenario.sourceCarriers.map(row => ({ id: row.id, x: row.initialX, y: geometry.sourceY,
        generation: 0, type: row.type, initialQuarterTurns: row.initialQuarterTurns, partId: null })),
      targetSlots: scenario.targetSlots.map(row => ({ id: row.id, x: row.initialX, y: geometry.targetY,
        generation: 0, requiredType: row.requiredType, requiredQuarterTurns: row.requiredQuarterTurns, occupantPartId: null })),
      parts: [], gate: null, preview: null, actionReceipts: [], wrapReceipts: [], lastAction: null, lastStep: null,
      inputState: { cancelEpoch: null, quarantined: true, aArmed: false, bArmed: false }, lastInput: null, terminal: null };
    s.sourceCarriers.forEach(row => spawn(s, row, 0));
    s.gate = gateAt(s, 0); s.preview = previewAt(s); feedback(s); return s;
  }
  function normalize(s, input) {
    const finite = value => Number.isFinite(value) ? value : null;
    const rawX = finite(input.x), rawY = finite(input.y), x = rawX === null ? 0 : clamp(rawX, -1, 1);
    const y = rawY === null ? 0 : clamp(rawY, -1, 1), axis = value => value >= .55 ? 1 : value <= -.55 ? -1 : 0;
    const rawA = input.a === true, rawB = input.b === true, rawAPressed = input.aPressed === true, rawBPressed = input.bPressed === true;
    const effectiveA = rawA || rawAPressed, effectiveB = rawB || rawBPressed, cancelled = input.cancelled === true;
    const rawCancelEpoch = finite(input.cancelEpoch), l = s.inputState, quarantinedBefore = l.quarantined;
    const epochChanged = rawCancelEpoch !== null && rawCancelEpoch !== l.cancelEpoch;
    if (rawCancelEpoch !== null) l.cancelEpoch = rawCancelEpoch;
    let neutralAcknowledged = false, freshA = false, freshB = false, velocityX = 0;
    if (cancelled || epochChanged) {
      l.quarantined = true; l.aArmed = false; l.bArmed = false;
    } else if (l.quarantined) {
      if (axis(x) === 0 && axis(y) === 0 && !effectiveA && !effectiveB) {
        l.quarantined = false; l.aArmed = true; l.bArmed = true; neutralAcknowledged = true;
      }
    } else {
      freshA = effectiveA && l.aArmed; freshB = effectiveB && l.bArmed;
      l.aArmed = !effectiveA; l.bArmed = !effectiveB;
      velocityX = axis(x) * s.physics.geometry.gripperSpeedUnitsPerTick;
    }
    return detached({ boundaryTick: s.tick, rawX, rawY, x, y, axisX: axis(x), axisY: axis(y),
      rawA, rawB, rawAPressed, rawBPressed, effectiveA, effectiveB, cancelled, rawCancelEpoch, cancelEpoch: l.cancelEpoch,
      epochChanged, quarantinedBefore, quarantinedAfter: l.quarantined, neutralAcknowledged, freshA, freshB, velocityX });
  }
  function endPart(part, owner, tick, reason, x, y) {
    part.owner = owner; part.ownerId = null; part.ownerGeneration = null; part.endedTick = tick;
    part.endReason = reason; part.x = x; part.y = y;
  }
  function act(s, action) {
    const g = s.physics.geometry, beforeCounters = counters(s);
    let part = partById(s, s.gripper.heldPartId), source = null, slot = null, sourceBefore = null, slotBefore = null;
    if (action === 'grab_or_dispatch') {
      if (part) { slot = nearest(s.targetSlots, s.gripper.x); slotBefore = slot ? clone(slot) : null; }
      else {
        source = nearest(s.sourceCarriers.filter(row => row.partId !== null), s.gripper.x);
        sourceBefore = source ? clone(source) : null;
        if (source && Math.abs(source.x - s.gripper.x) <= g.pickupRadiusUnits) part = partById(s, source.partId);
      }
    }
    const partBefore = part ? clone(part) : null;
    let result;
    if (action === 'rotate') {
      result = part ? 'rotated' : 'empty_rotate';
      if (part) part.quarterTurns = (part.quarterTurns + 1) % 4;
    } else if (s.gripper.heldPartId === null) {
      result = part ? 'grabbed' : 'empty_grab';
      if (part) {
        source.partId = null; s.gripper.heldPartId = part.id;
        part.owner = 'held'; part.ownerId = 'gripper'; part.ownerGeneration = null;
        part.x = s.gripper.x; part.y = g.heldY;
      }
    } else {
      result = !s.gate.open ? 'shutter_closed' : !fitsWindow(s) ? 'outside_window' :
        !slot || Math.abs(slot.x - s.gripper.x) > g.placementRadiusUnits ? 'no_slot_in_reach' :
        slot.occupantPartId !== null ? 'occupied_slot' : part.type !== slot.requiredType ? 'wrong_type' :
        part.quarterTurns !== slot.requiredQuarterTurns ? 'wrong_orientation' : 'seated';
      s.gripper.heldPartId = null;
      if (result === 'seated') {
        slot.occupantPartId = part.id; part.owner = 'slot'; part.ownerId = slot.id; part.ownerGeneration = slot.generation;
        part.x = slot.x; part.y = g.targetY; s.streak++; s.totalCorrect++;
      } else {
        endPart(part, 'damaged', s.tick, result, s.gripper.x, g.heldY); s.faults++; s.streak = 0;
      }
    }
    const receipt = detached({ id: s.actionReceipts.length + 1, boundaryTick: s.tick, action, partId: part ? part.id : null,
      result, gripperX: s.gripper.x, gateAtAction: s.gate, sourceAtAction: sourceBefore, slotAtAction: slotBefore,
      partBefore, partAfter: part ? clone(part) : null, streakBefore: beforeCounters.streak, streakAfter: s.streak,
      totalCorrectBefore: beforeCounters.totalCorrect, totalCorrectAfter: s.totalCorrect,
      faultsBefore: beforeCounters.faults, faultsAfter: s.faults });
    s.actionReceipts.push(receipt); s.lastAction = receipt;
  }
  function motionRows(rows, velocity, length) {
    return rows.map(row => {
      const rawToX = row.x + velocity, wrapped = rawToX >= length || rawToX < 0;
      return { id: row.id, generationBefore: row.generation, generationAfter: row.generation + (wrapped ? 1 : 0),
        fromX: row.x, rawToX, toX: mod(rawToX, length), velocity, wrapped };
    });
  }
  function moveBelt(s, rows, motion, belt) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i], m = motion[i]; row.x = m.toX; row.generation = m.generationAfter;
      if (!m.wrapped) continue;
      const source = belt === 'source', exitedPartId = source ? row.partId : row.occupantPartId;
      if (exitedPartId !== null) {
        endPart(partById(s, exitedPartId), source ? 'retired' : 'completed', s.tick + 1,
          source ? 'source_exit' : 'target_exit', m.velocity > 0 ? s.physics.geometry.trackLengthUnits : 0, row.y);
      }
      let newPartId = null;
      if (source) newPartId = spawn(s, row, s.tick + 1);
      else row.occupantPartId = null;
      s.wrapReceipts.push(detached({ id: s.wrapReceipts.length + 1, endedTick: s.tick + 1, belt, carrierId: row.id,
        fromGeneration: m.generationBefore, toGeneration: m.generationAfter, fromX: m.fromX,
        rawToX: m.rawToX, toX: m.toX, exitedPartId, newPartId }));
    }
  }
  function syncParts(s) {
    for (const row of s.sourceCarriers) if (row.partId !== null) {
      const part = partById(s, row.partId); part.x = row.x; part.y = row.y;
    }
    for (const row of s.targetSlots) if (row.occupantPartId !== null) {
      const part = partById(s, row.occupantPartId); part.x = row.x; part.y = row.y;
    }
    if (s.gripper.heldPartId !== null) {
      const part = partById(s, s.gripper.heldPartId); part.x = s.gripper.x; part.y = s.gripper.y;
    }
  }
  function feedback(s) {
    const result = s.lastAction || s.actionReceipts[s.actionReceipts.length - 1];
    const messages = { rotated: '已顺时针旋转90°', empty_rotate: '先用 A 抓取零件', grabbed: '已抓起零件；B 旋转，开窗后 A 投送',
      empty_grab: '靠近上带零件再抓取', shutter_closed: '闸窗关闭：零件损坏', outside_window: '零件未完整进入窗口：零件损坏',
      no_slot_in_reach: '下带槽位超出吸附范围：零件损坏', occupied_slot: '槽位已占用：零件损坏',
      wrong_type: '零件形状不匹配：零件损坏', wrong_orientation: '缺口朝向不匹配：零件损坏', seated: '装配成功，继续保持连装' };
    s.message = s.phase === 'won' ? '连续装配完成！' : s.lostReason === 'fault_limit' ? '三次装配失误，本轮结束' :
      s.lostReason === 'deadline' ? '时间到，连装目标尚未完成' : result ? messages[result.result] : '左右移动夹具；A 抓取或投送，B 旋转手中零件';
    s.score = s.phase === 'won' ? 1000 + 100 * s.requiredStreak + 100 * (s.faultLimit - s.faults) : 100 * s.totalCorrect;
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing' || dt === 0) return s;
    if (!Number.isFinite(dt) || dt <= 0 || Math.abs(dt - 1 / 60) > 1e-12) throw new RangeError('Expected one 1/60-second interval');
    const fromTick = s.tick, gateBefore = clone(s.gate), gripperBefore = clone(s.gripper), countersBefore = counters(s);
    const actionStart = s.actionReceipts.length, wrapStart = s.wrapReceipts.length;
    s.lastAction = null; s.lastInput = normalize(s, input || {});
    if (s.lastInput.freshB) act(s, 'rotate');
    if (s.lastInput.freshA) act(s, 'grab_or_dispatch');
    const sourceMotion = motionRows(s.sourceCarriers, s.scenario.sourceVelocity, s.physics.geometry.trackLengthUnits);
    const targetMotion = motionRows(s.targetSlots, s.scenario.targetVelocity, s.physics.geometry.trackLengthUnits);
    moveBelt(s, s.sourceCarriers, sourceMotion, 'source'); moveBelt(s, s.targetSlots, targetMotion, 'target');
    const range = s.physics.geometry.gripperXRange;
    s.gripper.x = clamp(s.gripper.x + s.lastInput.velocityX, range[0], range[1]); syncParts(s);
    s.tick++; s.elapsed = s.tick / s.physics.geometry.ticksPerSecond;
    s.gate = gateAt(s, s.tick); s.preview = previewAt(s);
    const reason = s.streak >= s.requiredStreak ? 'required_streak' : s.faults >= s.faultLimit ? 'fault_limit' :
      s.tick >= s.deadlineTick ? 'deadline' : null;
    if (reason) {
      s.phase = reason === 'required_streak' ? 'won' : 'lost'; s.lostReason = s.phase === 'won' ? null : reason;
      s.terminal = detached({ reason, actionBoundaryTick: reason === 'deadline' ? null : fromTick, endedTick: s.tick });
    }
    feedback(s);
    s.lastStep = detached({ fromTick, toTick: s.tick, gateBefore, gateAfter: s.gate, gripperBefore, gripperAfter: s.gripper,
      allowedVelocityX: s.lastInput.velocityX, sourceMotion, targetMotion,
      actionReceiptIds: s.actionReceipts.slice(actionStart).map(row => row.id),
      wrapReceiptIds: s.wrapReceipts.slice(wrapStart).map(row => row.id),
      countersBefore, countersAfter: counters(s), terminalAfter: s.terminal });
    return s;
  }
  return Object.freeze({ create, step });
});
