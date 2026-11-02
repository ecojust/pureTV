(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Immutable public authored data, embedded verbatim; no solution or control schedule.
  var DATA =
{
  "schemaVersion": 1,
  "designStatus": "static-proposal-awaiting-root-review",
  "identity": {
    "gameId": 32,
    "name": "齿轮同刻",
    "englishName": "Clockwork Alignment",
    "slug": "clockwork-align",
    "packageId": "com.ecojust.clockworkaligntv",
    "versionName": "0.1.0",
    "versionCode": 1,
    "seed": 732,
    "actionCount": 2,
    "assignmentSha256": "64fa9389dcdd00f485f383087953f69f0b60c63e32aed8187408f7097b8264c9"
  },
  "premise": "A motor drives separately clutched meshed gear trains. Brake each whole train when its two mounted pointers jointly fit their published marks. Every pointer must then share one uninterrupted hold inside the future appointment window.",
  "units": {
    "ticksPerSecond": 60,
    "angleUnitsPerTurn": 43200,
    "angleUnitsPerDegree": 120,
    "zeroDirection": "screen-up",
    "positiveDirection": "clockwise",
    "phaseRepresentation": "signed integer unwrapped angular displacement; normalized display angle in [0,43200)",
    "normalization": "mod(x,P)=x-P*floor(x/P), P=43200",
    "pointerToleranceUnits": 360,
    "toleranceBoundary": "inclusive",
    "integration": "one exact constant-velocity closed interval [t,t+1] per running tick"
  },
  "mechanics": {
    "motor": {"id": "motor", "shaftSpeedUnitsPerTick": 30, "initialUnwrappedUnits": 0},
    "trainDriverTeeth": 24,
    "initialTrainEngaged": true,
    "initialGearUnwrappedUnits": 0,
    "pointerMountOffsetUnits": 0,
    "clutchKind": "ideal phase-preserving friction clutch with brake on the whole downstream train",
    "clutchBoundary": "motor shaft to the independent train driver shaft; this is a coaxial coupling, not a toothed mesh",
    "engagedRule": "driver velocity equals +30; each external mesh reverses sign and multiplies angular velocity by parentTeeth/childTeeth",
    "releasedRule": "all gears in that train have exactly zero velocity; other trains and the motor retain their velocities",
    "switchRule": "all unwrapped gear phases and pointer mounting offsets remain exactly unchanged at command time; only subsequent velocities change",
    "inertia": "none; the ideal clutch and brake impose velocity instantly without a position jump",
    "meshDisplacementInvariant": "for each edge i--j, teeth_i*unwrapped_i + teeth_j*unwrapped_j = 0, relative to the authored neutral assembly",
    "idlerRule": "an intermediate gear is a real external mesh at both edges; it changes downstream direction parity, its teeth set its own speed, and its teeth cancel out of the final driver-to-output speed ratio",
    "pointerRule": "only gears with targetUnits are monitored; all pointer marks and tolerances are visible from the instruction/blueprint screen onward",
    "geometryRule": "render only declared mesh edges; each chain lies left-to-right on one horizontal centerline with common pitch-radius-per-tooth and tangent pitch circles; do not depict a rigid mesh from motor bus to a braked train",
    "toothArtworkConvention": "a gear's tooth crest is at screen-up when displacement plus fixed toothArtworkOffsetUnits is zero; repeat exactly teeth crests per turn. Tooth artwork offsets do not affect physical displacement or the pointer mounting offset.",
    "toothArtworkOffsetsByChain": [
      {"teeth": [24,36,48], "offsetUnitsInChainOrder": [0,600,0]},
      {"teeth": [24,48,60], "offsetUnitsInChainOrder": [0,450,0]},
      {"teeth": [24,60,30], "offsetUnitsInChainOrder": [0,360,720]},
      {"teeth": [24,30,60,36], "offsetUnitsInChainOrder": [0,0,0,600]}
    ]
  },
  "controls": {
    "directions": "up/left selects the previous train; down/right selects the next; selection wraps",
    "a": {"label": "切换离合", "meaning": "toggle the selected train between engaged and braked", "cost": "one actual clutch state change"},
    "b": {"label": "全部制动", "meaning": "atomically brake every currently engaged train", "cost": "number of actually changed clutches; reject the entire request if that exceeds remaining budget"},
    "bWhenAllBraked": "no-op with zero cost",
    "freshAAndBTogether": "reject both as conflicting_buttons, with zero cost; selection may still move",
    "pause": "separate fixed host entry, never mapped onto B; the host freezes the model by not calling step",
    "sharedRuntimeInput": "step(state,dt,input) consumes x/y floats, literal-true a/b/aPressed/bPressed, cancelled and cancelEpoch; threshold x/y at +/-0.55 inside the Model after any host normalization",
    "cancellation": "cancelled or a changed finite cancelEpoch enters input quarantine without skipping the ordinary mechanical interval; a subsequent uncancelled neutral sample clears quarantine but issues no gameplay command",
    "instructionText": [
      "同一列的齿轮一起转、一起停。啮合相邻轮转向相反，齿数越多转得越慢。",
      "方向键选列；A接合/制动该列；B全部制动。每改变一个离合器消耗1次调节。",
      "指针停在各自金色目标带内。所有指针只能在预约时间窗里共同连续保持，之前对齐不计时。",
      "最后一次调节用完时，只有全部列已制动且所有指针已在目标带内，才能继续等待成功。"
    ]
  },
  "roundRules": {
    "holdKind": "one contiguous global interval, aligned to integer tick boundaries, entirely contained in the published target window",
    "wholeIntervalAlignment": "for each pointer, one integer k must satisfy target-tolerance+k*P <= min(pointerStart,pointerEnd) and max(pointerStart,pointerEnd) <= target+tolerance+k*P; endpoint-only modulo checks are forbidden",
    "eligibleInterval": "windowStartTick <= fromTick and toTick <= windowEndTick",
    "accumulation": "increment one global hold tick only if the entire eligible interval satisfies every pointer; otherwise reset global hold to zero; never store per-pointer earned hold",
    "beforeWindow": "zero eligible hold even if all pointers already fit",
    "deadline": "windowEndTick is also the round deadline",
    "deadlinePriority": "resolve the completed interval first; reaching holdRequiredTicks exactly at windowEndTick wins; otherwise lose deadline at that boundary",
    "budgetExhaustion": "after an accepted command leaves zero budget, allow continuation only if every train is braked and every pointer instantaneously fits its inclusive circular tolerance; otherwise lose budget_exhausted immediately at that command boundary",
    "zeroBudgetSafeWait": "braked aligned trains may wait for the target window and complete the hold with zero budget",
    "budgetRejection": "an unaffordable request changes nothing and costs nothing; insufficient budget for B does not prohibit a cheaper A",
    "terminal": "first terminal result is immutable; no further interval, adjustment, selection or hold progress is applied",
    "pause": "host stops calling Model.step, so mechanical tick, phases, hold and deadline all freeze; on resume shared cancelled/cancelEpoch input requires neutralized controls; no wall-clock catch-up",
    "normalRoundDurationSeconds": [30, 90]
  },
  "scenarios": [
    {
      "id": "twin-appointment",
      "name": "双列合拍",
      "adjustmentBudget": 4,
      "windowStartTick": 1920,
      "windowEndTick": 2280,
      "holdRequiredTicks": 120,
      "windowLabel": "32.0–38.0秒 · 同时保持2.0秒",
      "trains": [
        {
          "id": "amber", "name": "琥珀列", "meshChain": ["amber-drive", "amber-mid", "amber-tip"],
          "gears": [
            {"id": "amber-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "amber-mid", "teeth": 36, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -20, "targetUnits": 12000},
            {"id": "amber-tip", "teeth": 48, "role": "monitored-output", "engagedVelocityUnitsPerTick": 15, "targetUnits": 23400}
          ]
        },
        {
          "id": "cobalt", "name": "钴蓝列", "meshChain": ["cobalt-drive", "cobalt-mid", "cobalt-tip"],
          "gears": [
            {"id": "cobalt-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "cobalt-mid", "teeth": 48, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -15, "targetUnits": 16200},
            {"id": "cobalt-tip", "teeth": 60, "role": "monitored-output", "engagedVelocityUnitsPerTick": 12, "targetUnits": 21600}
          ]
        }
      ]
    },
    {
      "id": "three-train-meeting",
      "name": "三列会时",
      "adjustmentBudget": 5,
      "windowStartTick": 2640,
      "windowEndTick": 3000,
      "holdRequiredTicks": 180,
      "windowLabel": "44.0–50.0秒 · 同时保持3.0秒",
      "trains": [
        {
          "id": "amber", "name": "琥珀列", "meshChain": ["amber-drive", "amber-mid", "amber-tip"],
          "gears": [
            {"id": "amber-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "amber-mid", "teeth": 36, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -20, "targetUnits": 6000},
            {"id": "amber-tip", "teeth": 48, "role": "monitored-output", "engagedVelocityUnitsPerTick": 15, "targetUnits": 27900}
          ]
        },
        {
          "id": "cobalt", "name": "钴蓝列", "meshChain": ["cobalt-drive", "cobalt-mid", "cobalt-tip"],
          "gears": [
            {"id": "cobalt-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "cobalt-mid", "teeth": 48, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -15, "targetUnits": 10800},
            {"id": "cobalt-tip", "teeth": 60, "role": "monitored-output", "engagedVelocityUnitsPerTick": 12, "targetUnits": 25920}
          ]
        },
        {
          "id": "jade", "name": "翡翠列", "meshChain": ["jade-drive", "jade-mid", "jade-tip"],
          "gears": [
            {"id": "jade-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "jade-mid", "teeth": 60, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -12, "targetUnits": 12960},
            {"id": "jade-tip", "teeth": 30, "role": "monitored-output", "engagedVelocityUnitsPerTick": 24, "targetUnits": 17280}
          ]
        }
      ]
    },
    {
      "id": "idler-parity",
      "name": "惰轮换向",
      "adjustmentBudget": 7,
      "windowStartTick": 3360,
      "windowEndTick": 3840,
      "holdRequiredTicks": 240,
      "windowLabel": "56.0–64.0秒 · 同时保持4.0秒",
      "trains": [
        {
          "id": "amber", "name": "琥珀列", "meshChain": ["amber-drive", "amber-mid", "amber-tip"],
          "gears": [
            {"id": "amber-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "amber-mid", "teeth": 36, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -20, "targetUnits": 38400},
            {"id": "amber-tip", "teeth": 48, "role": "monitored-output", "engagedVelocityUnitsPerTick": 15, "targetUnits": 36000}
          ]
        },
        {
          "id": "cobalt", "name": "钴蓝列", "meshChain": ["cobalt-drive", "cobalt-mid", "cobalt-tip"],
          "gears": [
            {"id": "cobalt-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "cobalt-mid", "teeth": 48, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -15, "targetUnits": 0},
            {"id": "cobalt-tip", "teeth": 60, "role": "monitored-output", "engagedVelocityUnitsPerTick": 12, "targetUnits": 34560}
          ]
        },
        {
          "id": "jade", "name": "翡翠列", "meshChain": ["jade-drive", "jade-idler", "jade-mid", "jade-tip"],
          "gears": [
            {"id": "jade-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "jade-idler", "teeth": 30, "role": "unmonitored-idler", "engagedVelocityUnitsPerTick": -24},
            {"id": "jade-mid", "teeth": 60, "role": "monitored-idler", "engagedVelocityUnitsPerTick": 12, "targetUnits": 38880},
            {"id": "jade-tip", "teeth": 36, "role": "monitored-output", "engagedVelocityUnitsPerTick": -20, "targetUnits": 21600}
          ]
        }
      ]
    }
  ],
  "presentation": {
    "logicalResolution": [960, 540],
    "renderer": "shared WebGL1 atlas, one draw submission; no additional runtime assets required",
    "trainRows": "two or three horizontal rows; exact centers belong to renderer, with tangent declared meshes and equal pitch-radius-per-tooth within each row",
    "gearCountsByScenario": [6, 9, 10],
    "monitoredPointerCountsByScenario": [4, 6, 6],
    "requiredVisibleFacts": ["each tooth count", "actual signed direction/speed", "clutch engaged or braked", "actual pointer and fixed target sector", "selected train", "remaining adjustment units", "published window and current time", "single global hold bar", "before-window versus eligible versus terminal state"],
    "targetBlueprint": "instructions and paused view show every tooth count, full actual mesh chain, target angle in degrees or clock dial form, tolerance and appointment window; no hidden target plan",
    "readability": "motor bus and clutch plates use shaft symbols, not invented mesh edges; driver and unmonitored idler have no target-pointer decoration"
  },
  "sharedRuntime": {
    "exports": ["create(seed=732,difficulty=0)", "step(state,dt,input)"],
    "difficultyMapping": "0/1/2 select scenarios in authored JSON order",
    "modelPhase": "playing, won, or lost; ready/menu/paused lifecycle belongs to the host",
    "fixedDtSeconds": "1/60, accepted within absolute tolerance 1e-12; zero dt and terminal steps are complete no-ops",
    "transactionCount": "increment once per valid active positive-dt step; one transaction advances zero or one mechanical ticks",
    "score": "1000 + 100*remainingBudget on win, otherwise zero; display only, never a mechanical input"
  },
  "authorizationBoundary": "Static design only. This proposal authorizes no production change, model execution, solver, automated search, browser run, packaging or publication."
}
;
  var DT = 1 / 60, TURN = 43200;
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  var finite = function (v) { return typeof v === 'number' && Number.isFinite(v); };
  var mod = function (v, n) { return v - n * Math.floor(v / n); };
  function freeze(v) { if (v && typeof v === 'object') { Object.keys(v).forEach(function (key) { freeze(v[key]); }); Object.freeze(v); } return v; }
  function need(ok, message) { if (!ok) throw new RangeError(message); }
  function floorDiv(n, d) { var r = n % d; return (n - r) / d - (r < 0 ? 1 : 0); }
  function ceilDiv(n, d) { var r = n % d; return (n - r) / d + (r > 0 ? 1 : 0); }
  function intervalBand(fromUnits, toUnits, targetUnits, toleranceUnits, turnUnits) {
    need([fromUnits, toUnits, targetUnits, toleranceUnits, turnUnits].every(Number.isSafeInteger), 'Band operands must be safe integers');
    need(turnUnits > 0 && targetUnits >= 0 && targetUnits < turnUnits && toleranceUnits >= 0 && 2 * toleranceUnits < turnUnits, 'Invalid circular band');
    var lowerNumerator = Math.max(fromUnits, toUnits) - targetUnits - toleranceUnits;
    var upperNumerator = Math.min(fromUnits, toUnits) + (toleranceUnits - targetUnits);
    need(Number.isSafeInteger(lowerNumerator) && Number.isSafeInteger(upperNumerator), 'Band numerators must be safe integers');
    var lower = ceilDiv(lowerNumerator, turnUnits), upper = floorDiv(upperNumerator, turnUnits);
    return lower <= upper ? (lower === 0 ? 0 : lower) : null;
  }
  function gear(s, id) { return s.gears.find(function (g) { return g.id === id; }); }
  function derive(s) {
    s.motor.normalizedUnits = mod(s.motor.unwrappedUnits, TURN);
    s.trains.forEach(function (train) {
      train.clutchState = train.engaged ? 'engaged' : 'braked';
      train.gearIds.forEach(function (id) {
        var g = gear(s, id), parent = g.meshParentId === null ? null : gear(s, g.meshParentId);
        g.velocityUnitsPerTick = train.engaged ? (parent ? -parent.velocityUnitsPerTick * parent.teeth / g.teeth : 30) : 0;
        need(Number.isSafeInteger(g.velocityUnitsPerTick), 'Authored mesh speed must be an integer');
        g.normalizedUnits = mod(g.unwrappedUnits, TURN);
      });
    });
    s.pointers.forEach(function (p) {
      p.unwrappedUnits = gear(s, p.gearId).unwrappedUnits + p.mountOffsetUnits; p.normalizedUnits = mod(p.unwrappedUnits, TURN);
      p.signedErrorUnits = mod(p.unwrappedUnits - p.targetUnits + TURN / 2, TURN) - TURN / 2;
      p.instantAligned = Math.abs(p.signedErrorUnits) <= p.toleranceUnits;
    });
    s.alignment.allInstantAligned = s.pointers.every(function (p) { return p.instantAligned; });
    s.selectedTrainId = s.trains[s.cursor].id; s.elapsed = s.tick / 60;
    s.appointment.phase = s.tick < s.appointment.windowStartTick ? 'before' : s.tick < s.appointment.windowEndTick ? 'eligible' : 'closed';
    s.stage = s.phase !== 'playing' ? 'finished' : s.appointment.phase === 'before' ? 'tuning' : 'appointment';
    s.score = s.phase === 'won' ? 1000 + 100 * s.budget.remaining : 0;
    s.message = s.phase === 'won' ? '全部指针在同一预约窗口完成连续保持' : s.lostReason === 'budget_exhausted' ? '调节已用尽，机器尚未全部制动并对准'
      : s.lostReason === 'deadline' ? '预约窗口已结束，未完成共同连续保持' : s.appointment.phase === 'before'
      ? '按列调节离合；提前对准可等待预约，但尚不累计保持' : s.alignment.holdTicks > 0 ? '全部指针同时对准，正在共同连续保持' : '预约窗口内需所有指针同时持续对准';
  }
  function create(seed, difficulty) {
    if (seed === undefined) seed = 732; if (difficulty === undefined) difficulty = 0;
    need(Number.isSafeInteger(seed) && seed >= 0, 'Run seed must be a nonnegative safe integer');
    need(Number.isInteger(difficulty) && difficulty >= 0 && difficulty <= 2, 'Difficulty must be an integer 0..2');
    var scenario = DATA.scenarios[difficulty], s = { width: 960, height: 540, schemaVersion: 1,
      identity: freeze(clone(DATA.identity)), seed: seed, difficulty: difficulty, level: difficulty + 1, levelName: scenario.name,
      scenarioId: scenario.id, scenario: freeze(clone(scenario)), physics: freeze(Object.assign(clone(DATA.units), {
        mechanics: clone(DATA.mechanics), stepSeconds: DT, dtTolerance: 1e-12, axisThreshold: .55, navigationFirstRepeatTick: 18, navigationRepeatPeriodTicks: 9 })),
      phase: 'playing', stage: 'tuning', tick: 0, elapsed: 0, score: 0, lostReason: null, message: '', cursor: 0, selectedTrainId: scenario.trains[0].id,
      terminal: null, appointment: { windowStartTick: scenario.windowStartTick, windowEndTick: scenario.windowEndTick,
        holdRequiredTicks: scenario.holdRequiredTicks, phase: 'before' }, budget: { initial: scenario.adjustmentBudget, spent: 0, remaining: scenario.adjustmentBudget },
      motor: { unwrappedUnits: 0, normalizedUnits: 0, velocityUnitsPerTick: 30 }, trains: [], gears: [], pointers: [],
      alignment: { allInstantAligned: false, holdTicks: 0, holdStartTick: null, lastEligible: null, lastAllFullInterval: null, lastResetReason: null },
      inputState: { cancelEpoch: 0, quarantined: true, aArmed: false, bArmed: false, direction: 0, repeatAgeTicks: 0 },
      lastInput: null, transactionCount: 0, lastTransaction: null, actionReceipts: [], lastActionReceipts: freeze([]), lastInterval: null };
    scenario.trains.forEach(function (train) {
      var teeth = train.gears.map(function (g) { return g.teeth; });
      var artwork = DATA.mechanics.toothArtworkOffsetsByChain.find(function (row) { return JSON.stringify(row.teeth) === JSON.stringify(teeth); });
      need(!!artwork, 'Every authored gear chain needs public tooth artwork offsets');
      s.trains.push({ id: train.id, name: train.name, engaged: true, clutchState: 'engaged', gearIds: train.meshChain.slice() });
      train.gears.forEach(function (g, index) {
        s.gears.push({ id: g.id, trainId: train.id, teeth: g.teeth, role: g.role, meshParentId: index ? train.meshChain[index - 1] : null,
          unwrappedUnits: 0, normalizedUnits: 0, toothArtworkOffsetUnits: artwork.offsetUnitsInChainOrder[index], velocityUnitsPerTick: 0 });
        if (Object.prototype.hasOwnProperty.call(g, 'targetUnits')) s.pointers.push({ gearId: g.id, mountOffsetUnits: 0, targetUnits: g.targetUnits, toleranceUnits: 360,
          unwrappedUnits: 0, normalizedUnits: 0, signedErrorUnits: 0, instantAligned: false });
      });
    });
    derive(s); return s;
  }
  function finish(s, reason) {
    s.phase = reason === 'global_hold_complete' ? 'won' : 'lost'; s.lostReason = s.phase === 'lost' ? reason : null;
    s.terminal = freeze({ reason: reason, boundaryTick: s.tick, transactionId: s.transactionCount });
  }
  function holdFacts(s) { var a = s.alignment; return { holdTicks: a.holdTicks, holdStartTick: a.holdStartTick,
    lastEligible: a.lastEligible, lastAllFullInterval: a.lastAllFullInterval, lastResetReason: a.lastResetReason }; }
  function clutchFacts(s) { return s.trains.map(function (train) { return { trainId: train.id, engaged: train.engaged }; }); }
  function gearFacts(s) { return s.gears.map(function (g) { return { id: g.id, unwrappedUnits: g.unwrappedUnits, velocityUnitsPerTick: g.velocityUnitsPerTick }; }); }
  function action(s) {
    var li = s.lastInput, request = li.freshA && li.freshB ? 'conflicting_buttons' : li.freshB ? 'brake_all' : 'toggle_selected';
    var requested = request === 'conflicting_buttons' ? [] : request === 'toggle_selected' ? [s.selectedTrainId]
      : s.trains.filter(function (train) { return train.engaged; }).map(function (train) { return train.id; });
    var cost = request === 'conflicting_buttons' ? null : requested.length;
    var row = { receiptId: s.actionReceipts.length + 1, transactionId: s.transactionCount, boundaryTick: s.tick, request: request,
      selectedTrainBefore: s.trains[li.selectionBefore].id, selectedTrainAfter: s.selectedTrainId, requestedTrainIds: requested,
      accepted: false, reason: 'applied', requiredCost: cost, chargedCost: 0, budgetBefore: clone(s.budget), budgetAfter: null,
      clutchesBefore: clutchFacts(s), clutchesAfter: null, changedTrainIds: [], gearsBefore: gearFacts(s), gearsAfter: null,
      holdBefore: holdFacts(s), holdAfterCommand: null, terminalAfterCommand: null };
    if (request === 'conflicting_buttons') row.reason = 'conflicting_buttons';
    else if (cost === 0) row.reason = 'already_braked';
    else if (cost > s.budget.remaining) row.reason = 'insufficient_budget';
    else {
      row.accepted = true; row.chargedCost = cost;
      s.trains.forEach(function (train) { if (requested.includes(train.id)) { train.engaged = request === 'brake_all' ? false : !train.engaged; row.changedTrainIds.push(train.id); } });
      s.budget.spent += cost; s.budget.remaining -= cost; derive(s);
      if (s.budget.remaining === 0 && !(s.trains.every(function (train) { return !train.engaged; }) && s.alignment.allInstantAligned)) finish(s, 'budget_exhausted');
    }
    row.budgetAfter = clone(s.budget); row.clutchesAfter = clutchFacts(s); row.gearsAfter = gearFacts(s);
    row.holdAfterCommand = holdFacts(s); row.terminalAfterCommand = clone(s.terminal); freeze(row);
    s.actionReceipts.push(row); s.lastActionReceipts = freeze([row]); li.actionReceiptIds.push(row.receiptId);
  }
  function clearNavigation(latch) { latch.direction = 0; latch.repeatAgeTicks = 0; }
  function inputStep(s, input) {
    input = input && typeof input === 'object' ? input : {};
    var l = s.inputState, rawX = finite(input.x) ? input.x : null, rawY = finite(input.y) ? input.y : null;
    var rawEpoch = finite(input.cancelEpoch) ? input.cancelEpoch : null, epoch = rawEpoch === null ? l.cancelEpoch : rawEpoch;
    var x = rawX === null ? 0 : Math.max(-1, Math.min(1, rawX)), y = rawY === null ? 0 : Math.max(-1, Math.min(1, rawY));
    var a = input.a === true, b = input.b === true, ap = input.aPressed === true, bp = input.bPressed === true;
    var axisX = x >= .55 ? 1 : x <= -.55 ? -1 : 0, axisY = y >= .55 ? 1 : y <= -.55 ? -1 : 0;
    var li = s.lastInput = { transactionId: s.transactionCount, rawX: rawX, rawY: rawY, x: x, y: y, axisX: axisX, axisY: axisY,
      rawA: a, rawB: b, rawAPressed: ap, rawBPressed: bp, effectiveA: a || ap, effectiveB: b || bp,
      cancelled: input.cancelled === true, rawCancelEpoch: rawEpoch, cancelEpoch: epoch, epochChanged: epoch !== l.cancelEpoch,
      quarantinedBefore: l.quarantined, quarantinedAfter: l.quarantined, neutralAcknowledged: false, freshA: false, freshB: false,
      direction: l.direction, repeatAgeBefore: l.repeatAgeTicks, repeatAgeAfter: l.repeatAgeTicks,
      selectionBefore: s.cursor, selectionAfter: s.cursor, navigationApplied: false, actionReceiptIds: [] };
    l.cancelEpoch = epoch;
    if (li.cancelled || li.epochChanged) { l.quarantined = true; l.aArmed = l.bArmed = false; clearNavigation(l); }
    else if (l.quarantined) {
      if (!axisX && !axisY && !li.effectiveA && !li.effectiveB) {
        l.quarantined = false; l.aArmed = l.bArmed = true; clearNavigation(l); li.neutralAcknowledged = true;
      }
    } else {
      var direction = axisY || axisX;
      if (!direction) clearNavigation(l);
      else {
        var first = direction !== l.direction;
        if (first) { l.direction = direction; l.repeatAgeTicks = 0; }
        if (first || (l.repeatAgeTicks >= 18 && (l.repeatAgeTicks - 18) % 9 === 0)) {
          s.cursor = mod(s.cursor + direction, s.trains.length); li.navigationApplied = true;
        }
      }
      s.selectedTrainId = s.trains[s.cursor].id; li.selectionAfter = s.cursor;
      li.freshA = li.effectiveA && l.aArmed; li.freshB = li.effectiveB && l.bArmed;
      l.aArmed = !li.effectiveA; l.bArmed = !li.effectiveB;
      if (li.freshA || li.freshB) action(s);
    }
  }
  function integrate(s, t) {
    var beforeHold = holdFacts(s), motorFrom = s.motor.unwrappedUnits;
    var trains = s.trains.map(function (train) { return { id: train.id, engaged: train.engaged, gears: train.gearIds.map(function (id) {
      var g = gear(s, id), from = g.unwrappedUnits; g.unwrappedUnits += g.velocityUnitsPerTick;
      return { id: id, teeth: g.teeth, fromUnwrappedUnits: from, toUnwrappedUnits: g.unwrappedUnits, velocityUnitsPerTick: g.velocityUnitsPerTick };
    }) }; });
    var pointerIntervals = s.pointers.map(function (p) {
      var from = p.unwrappedUnits, to = gear(s, p.gearId).unwrappedUnits + p.mountOffsetUnits;
      var band = intervalBand(from, to, p.targetUnits, p.toleranceUnits, TURN);
      return { gearId: p.gearId, mountOffsetUnits: p.mountOffsetUnits, targetUnits: p.targetUnits, toleranceUnits: p.toleranceUnits,
        fromUnwrappedUnits: from, toUnwrappedUnits: to, fromNormalizedUnits: mod(from, TURN), toNormalizedUnits: mod(to, TURN),
        containingBandIndex: band, fullIntervalAligned: band !== null };
    });
    s.motor.unwrappedUnits += s.motor.velocityUnitsPerTick; s.tick = t + 1;
    if (!s.inputState.quarantined && s.inputState.direction !== 0) s.inputState.repeatAgeTicks++;
    var eligible = t >= s.appointment.windowStartTick && s.tick <= s.appointment.windowEndTick;
    var all = pointerIntervals.every(function (p) { return p.fullIntervalAligned; }), a = s.alignment;
    var reset = !eligible ? 'outside_window' : !all ? 'pointer_outside_band' : null;
    if (reset) { a.holdTicks = 0; a.holdStartTick = null; }
    else { if (a.holdTicks === 0) a.holdStartTick = t; a.holdTicks++; }
    a.lastEligible = eligible; a.lastAllFullInterval = all; a.lastResetReason = reset;
    if (a.holdTicks >= s.appointment.holdRequiredTicks) finish(s, 'global_hold_complete');
    else if (s.tick >= s.appointment.windowEndTick) finish(s, 'deadline');
    s.lastInterval = freeze({ intervalId: s.tick, transactionId: s.transactionCount, fromTick: t, toTick: s.tick,
      precedingActionReceiptIds: s.lastInput.actionReceiptIds.slice(), motor: { fromUnwrappedUnits: motorFrom, toUnwrappedUnits: s.motor.unwrappedUnits, velocityUnitsPerTick: s.motor.velocityUnitsPerTick },
      trains: trains, pointerIntervals: pointerIntervals, windowEligible: eligible, allPointersFullInterval: all,
      hold: { beforeTicks: beforeHold.holdTicks, afterTicks: a.holdTicks, startBeforeTick: beforeHold.holdStartTick, startAfterTick: a.holdStartTick, resetReason: reset },
      budgetAtInterval: clone(s.budget), terminalAfter: clone(s.terminal), phaseAfter: s.phase });
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing' || dt === 0) return s;
    need(finite(dt) && dt > 0 && Math.abs(dt - DT) <= 1e-12, 'step requires one fixed 1/60 second interval');
    var t = s.tick; s.transactionCount++; s.lastActionReceipts = freeze([]); s.lastInterval = null; derive(s); inputStep(s, input);
    if (s.phase === 'playing') integrate(s, t);
    derive(s); var l = s.inputState, li = s.lastInput;
    li.quarantinedAfter = l.quarantined; li.direction = l.direction; li.repeatAgeAfter = l.repeatAgeTicks; li.selectionAfter = s.cursor; freeze(li);
    s.lastTransaction = freeze({ id: s.transactionCount, fromTick: t, toTick: s.tick, advanced: s.tick !== t,
      actionReceiptIds: li.actionReceiptIds.slice(), intervalId: s.lastInterval ? s.lastInterval.intervalId : null, terminalAfter: clone(s.terminal) });
    return s;
  }
  return { create: create, step: step, intervalBand: intervalBand };
}));
