/* Frost Brake: deterministic rules only. See docs/model-contract.md. */
(function (root) {
  'use strict';

  const RULES = Object.freeze({
    pushAcceleration: 2.4,
    baseFriction: 0.12,
    clawFriction: 4.8,
    safeClawSpeed: 5,
    loadCoefficient: 12,
    damageLimit: 100,
    dockSpeed: 0.30,
    dockDwell: 0.60,
    stickThreshold: 0.35
  });
  const INPUT_KEYS = ['x', 'y', 'a', 'b', 'aPressed', 'bPressed', 'cancelEpoch', 'cancelled'];
  const END_ORDER = ['band', 'zero', 'safe-speed', 'dock-speed', 'dock-edge', 'edge', 'damage', 'delivery', 'call-end'];
  const SURFACE_ERROR = 1e-9;

  function copy(value) {
    if (Array.isArray(value)) return value.map(copy);
    if (value !== null && typeof value === 'object') {
      const result = {};
      Object.keys(value).forEach(key => { result[key] = copy(value[key]); });
      return result;
    }
    return value;
  }

  function freeze(value) {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.keys(value).forEach(key => freeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }

  function layoutFor(scenario) {
    const starts = [10, 88, 12];
    const bands = [
      [[18, 32], [45, 61], [71, 85]],
      [[13, 27], [36, 52], [65, 80]],
      [[23, 38], [58, 74], [77, 91]]
    ];
    const centers = [[53, 25, 78], [44, 72, 20], [66, 30, 82]];
    return freeze({
      startX: starts[scenario],
      lane: [0, 100],
      halfLength: 1.20,
      frostBands: bands[scenario],
      docks: centers[scenario].map((center, i) => ({ center, width: [12, 9, 6][i] }))
    });
  }

  function allowedCenter(state) {
    const dock = state.layout.docks[state.deliveries];
    return dock ? [dock.center - dock.width / 2 + state.layout.halfLength,
      dock.center + dock.width / 2 - state.layout.halfLength] : null;
  }

  function isContained(state) {
    const bounds = allowedCenter(state);
    return !!bounds && state.x >= bounds[0] && state.x <= bounds[1];
  }

  function isEligible(state) {
    return isContained(state) && Math.abs(state.v) <= RULES.dockSpeed;
  }

  // At a boundary, use the side occupied immediately after this instant.
  // A resting engaged claw is the explicit inclusive static-contact case.
  function bandAt(state, axis, claw) {
    const direction = Math.sign(state.v) || (claw ? 0 : axis);
    for (let i = 0; i < state.layout.frostBands.length; i++) {
      const band = state.layout.frostBands[i];
      if (state.x > band[0] && state.x < band[1]) return i;
      if (state.x === band[0] && direction >= 0) return i;
      if (state.x === band[1] && direction <= 0) return i;
    }
    return -1;
  }

  function branch(state, axis, claw) {
    const band = bandAt(state, axis, claw);
    const engaged = claw && band >= 0;
    const friction = RULES.baseFriction + (engaged ? RULES.clawFriction : 0);
    const push = RULES.pushAcceleration * axis;
    const acceleration = state.v === 0
      ? Math.sign(push) * Math.max(Math.abs(push) - friction, 0)
      : push - friction * Math.sign(state.v);
    const direction = Math.sign(state.v) || Math.sign(acceleration);
    const bounds = allowedCenter(state);
    let eligible = isEligible(state);
    if (eligible && bounds) {
      if ((state.x === bounds[0] && direction < 0) ||
          (state.x === bounds[1] && direction > 0) ||
          (state.v === RULES.dockSpeed && acceleration > 0) ||
          (state.v === -RULES.dockSpeed && acceleration < 0)) eligible = false;
    }
    return { band, engaged, acceleration, direction, eligible };
  }

  function observeContact(state, axis, claw) {
    const band = bandAt(state, axis, claw);
    return { band, clawRequested: claw, clawEngaged: claw && band >= 0, eligible: isEligible(state) };
  }

  function messageFor(state) {
    if (state.phase === 'won') return '三个停靠区均已交付，货物安全抵达。';
    if (state.failure === 'edge') return '货橇越出冰面。重试时留意两端的深水。';
    if (state.failure === 'damage') return '高速冰爪负荷耗尽了货物完整度。';
    if (!state.controlsReady) return '输入已取消，货橇仍在滑行。松开方向和 A 后继续。';
    if (state.contact.eligible) return '整辆货橇已进入亮区；保持速度不超过 0.30，等待交付。';
    if (state.contact.clawEngaged && Math.abs(state.v) > RULES.safeClawSpeed) {
      return '高速冰爪正在伤货；安全刹车速度为 5。';
    }
    if (state.contact.clawRequested && !state.contact.clawEngaged) return '此处没有结霜，冰爪不产生额外制动力。';
    if (state.contact.clawEngaged) return '冰爪已接触结霜带；左右推力仍与刹车叠加。';
    return '左右推货橇，松开仍会滑行；按住 A 只在结霜带刹车。';
  }

  function projection(state) {
    return {
      time: state.time, x: state.x, v: state.v, damage: state.damage,
      deliveries: state.deliveries, dwell: state.dwell, score: state.score,
      phase: state.phase, failure: state.failure, controlsReady: state.controlsReady,
      lastCancelEpoch: state.lastCancelEpoch, contact: copy(state.contact), message: state.message
    };
  }

  function create(seed, difficulty) {
    const scenario = Number.isInteger(difficulty) && difficulty >= 0 && difficulty < 3 ? difficulty : 0;
    const layout = layoutFor(scenario);
    const state = {
      id: 'frost-brake', version: '0.1.0',
      seed: Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : 739,
      scenario, layout, rules: RULES,
      phase: 'playing', failure: null, time: 0, x: layout.startX, v: 0, damage: 0,
      deliveries: 0, dwell: 0, score: 0, controlsReady: true, lastCancelEpoch: null,
      lastInput: null,
      contact: { band: -1, clawRequested: false, clawEngaged: false, eligible: false },
      events: [], lastStep: null, nextSeq: 0, deliveryReceipts: [], terminalReceipt: null,
      message: ''
    };
    state.message = messageFor(state);
    return state;
  }

  function valueKind(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value !== 'number') return typeof value;
    if (Number.isNaN(value)) return 'nan';
    if (value === Infinity) return 'positive-infinity';
    if (value === -Infinity) return 'negative-infinity';
    return 'finite-number';
  }

  function descriptor(value, present) {
    if (!present) return { kind: 'missing', value: null };
    const kind = valueKind(value);
    return { kind, value: kind === 'boolean' || kind === 'finite-number' || kind === 'string' ? value : null };
  }

  function consumeInput(state, input) {
    const object = input !== null && typeof input === 'object' && !Array.isArray(input);
    const values = {}, raw = {};
    INPUT_KEYS.forEach(key => {
      const present = object && Object.prototype.hasOwnProperty.call(input, key);
      const value = present ? input[key] : undefined;
      values[key] = value;
      raw[key] = descriptor(value, present);
    });
    const xValid = raw.x.kind === 'finite-number';
    const x = xValid ? Math.max(-1, Math.min(1, values.x)) : 0;
    const rawAxis = Math.abs(x) < RULES.stickThreshold ? 0 : Math.sign(x);
    const requestedA = values.a === true;
    const cancelled = values.cancelled === true;
    const epoch = Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null;
    const epochChanged = epoch !== null && state.lastCancelEpoch !== null && epoch !== state.lastCancelEpoch;
    const gateBefore = state.controlsReady;
    if (epoch !== null) state.lastCancelEpoch = epoch;
    let reason = 'ready', effectiveAxis = 0, effectiveClaw = false;
    if (epochChanged || cancelled) {
      state.controlsReady = false;
      reason = 'cancel';
    } else if (!state.controlsReady) {
      if (xValid && values.x > -RULES.stickThreshold && values.x < RULES.stickThreshold && raw.a.kind === 'boolean' && values.a === false) {
        state.controlsReady = true;
        reason = 'release';
      } else reason = 'blocked';
    } else {
      effectiveAxis = rawAxis;
      effectiveClaw = requestedA;
    }
    return {
      rawInputKind: input === null ? 'null' : Array.isArray(input) ? 'array' : typeof input,
      raw, xValid, rawAxis, requestedA, effectiveAxis, effectiveClaw,
      cancelled, epoch, epochChanged, gateBefore, gateAfter: state.controlsReady, reason
    };
  }

  function durationInfo(state, dt) {
    let dtStatus;
    if (typeof dt !== 'number') dtStatus = 'nonnumeric';
    else if (!Number.isFinite(dt)) dtStatus = 'nonfinite';
    else if (dt <= 0) dtStatus = 'nonpositive';
    else if (!Number.isFinite(state.time + dt) || state.time + dt <= state.time) dtStatus = 'nonrepresentable';
    else dtStatus = 'duration';
    return {
      requestedDt: typeof dt === 'number' && Number.isFinite(dt) ? dt : null,
      dtKind: valueKind(dt), dtStatus, acceptedDt: dtStatus === 'duration' ? dt : 0
    };
  }

  // Stable quadratic roots. A zero root is never an interval: the current
  // boundary's forward side has already been chosen by branch().
  function positiveRoots(a, b, c) {
    if (a === 0) {
      const h = b === 0 ? NaN : -c / b;
      return h > 0 && Number.isFinite(h) ? [h] : [];
    }
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];
    if (discriminant === 0) {
      const h = -b / (2 * a);
      return h > 0 && Number.isFinite(h) ? [h] : [];
    }
    const sqrt = Math.sqrt(discriminant);
    const q = -0.5 * (b + (b < 0 ? -sqrt : sqrt));
    const result = [q / a, c / q].filter(h => h > 0 && Number.isFinite(h));
    result.sort((aRoot, bRoot) => aRoot - bRoot);
    return result.filter((h, i) => i === 0 || h !== result[i - 1]);
  }

  function positionAt(x, v, acceleration, h) {
    if (acceleration === 0) return v === 0 ? x : x + v * h;
    return x + (v + 0.5 * acceleration * h) * h;
  }

  function speedAt(v, acceleration, h) {
    return acceleration === 0 ? v : v + acceleration * h;
  }

  function reachedSurface(actual, target) {
    if (Math.abs(actual - target) > SURFACE_ERROR) throw new Error('Selected physical root did not reach its surface');
    return target;
  }

  function candidates(state, current, remaining) {
    const result = [{ h: remaining, reason: 'call-end', kind: 'time' }];
    function add(h, reason, kind, value) {
      if (h > 0 && Number.isFinite(h) && h <= remaining) result.push({ h, reason, kind, value });
    }
    function spatial(value, reason, outward) {
      const roots = positiveRoots(0.5 * current.acceleration, state.v, state.x - value);
      roots.forEach(h => {
        if (outward) {
          // A double root is a tangent, not an outward crossing.
          const discriminant = state.v * state.v + 2 * current.acceleration * (value - state.x);
          const velocity = discriminant === 0 ? 0 : speedAt(state.v, current.acceleration, h);
          if (outward * velocity <= 0) return;
        }
        add(h, reason, 'position', value);
      });
    }
    state.layout.frostBands.forEach(band => band.forEach(value => spatial(value, 'band', 0)));
    if (current.acceleration !== 0) {
      [[0, 'zero'], [RULES.safeClawSpeed, 'safe-speed'], [-RULES.safeClawSpeed, 'safe-speed'],
        [RULES.dockSpeed, 'dock-speed'], [-RULES.dockSpeed, 'dock-speed']].forEach(item => {
        add((item[0] - state.v) / current.acceleration, item[1], 'velocity', item[0]);
      });
    }
    const allowed = allowedCenter(state);
    if (allowed) allowed.forEach(value => spatial(value, 'dock-edge', 0));
    spatial(state.layout.lane[0] + state.layout.halfLength, 'edge', -1);
    spatial(state.layout.lane[1] - state.layout.halfLength, 'edge', 1);
    if (current.eligible) add(RULES.dockDwell - state.dwell, 'delivery', 'dwell', RULES.dockDwell);
    if (current.engaged && Math.abs(state.v) > RULES.safeClawSpeed) {
      positiveRoots(0.5 * RULES.loadCoefficient * Math.sign(state.v) * current.acceleration,
        RULES.loadCoefficient * (Math.abs(state.v) - RULES.safeClawSpeed), state.damage - RULES.damageLimit)
        .forEach(h => add(h, 'damage', 'damage', RULES.damageLimit));
    }
    let first = result[0].h;
    result.forEach(event => { if (event.h < first) first = event.h; });
    // Only identical roots are coalesced. No nearby root is pulled earlier,
    // across a band change, or across the end of the requested duration.
    return { h: first, reached: result.filter(event => event.h === first) };
  }

  function emit(state, trace, type, offset, extra) {
    const event = Object.assign({
      type, time: state.time, offset, seq: trace.seq, index: state.events.length,
      x: state.x, v: state.v, damage: state.damage
    }, extra);
    state.events.push(event);
    return event;
  }

  function scoreFor(state) {
    return 100 * state.deliveries + (state.phase === 'won' ? Math.floor(Math.max(0, 100 - state.damage)) : 0);
  }

  function finish(state, trace, offset, causes) {
    state.phase = causes.length ? 'lost' : 'won';
    state.failure = causes.length ? causes[0] : null;
    state.score = scoreFor(state);
    const extra = { deliveries: state.deliveries, score: state.score };
    if (causes.length) { extra.failure = state.failure; extra.causes = causes.slice(); }
    const event = emit(state, trace, causes.length ? 'lost' : 'won', offset, extra);
    state.terminalReceipt = freeze(Object.assign(copy(event), {
      phase: state.phase, acceptedDt: trace.acceptedDt, consumedDt: offset,
      unusedDt: trace.acceptedDt - offset
    }));
  }

  function deliver(state, trace, offset) {
    const dockIndex = state.deliveries;
    const bounds = allowedCenter(state);
    state.deliveries++;
    state.dwell = 0;
    state.score = scoreFor(state);
    const event = emit(state, trace, 'delivery', offset, {
      dockIndex, allowedCenter: bounds, speedLimit: RULES.dockSpeed, dwell: RULES.dockDwell,
      deliveriesBefore: dockIndex, deliveriesAfter: state.deliveries
    });
    state.deliveryReceipts.push(freeze(copy(event)));
    if (state.deliveries === state.layout.docks.length) finish(state, trace, offset, []);
  }

  function makeSegment(state, current, axis, claw, t0) {
    return {
      t0, t1: t0, duration: 0, x0: state.x, v0: state.v, x1: state.x, v1: state.v,
      acceleration: current.acceleration, axis, clawRequested: claw,
      band: current.band, clawEngaged: current.engaged,
      damage0: state.damage, damage1: state.damage,
      eligible: current.eligible, dwell0: state.dwell, dwell1: state.dwell,
      deliveries: state.deliveries, ends: []
    };
  }

  function integrate(state, trace, axis, claw) {
    let remaining = trace.acceptedDt, elapsed = 0;
    while (remaining > 0 && state.phase === 'playing') {
      const current = branch(state, axis, claw);
      const low = state.layout.lane[0] + state.layout.halfLength;
      const high = state.layout.lane[1] - state.layout.halfLength;
      if ((state.x === low && current.direction < 0) || (state.x === high && current.direction > 0)) {
        const immediate = makeSegment(state, current, axis, claw, state.time);
        immediate.ends = ['edge'];
        trace.segments.push(immediate);
        finish(state, trace, elapsed, ['edge']);
        break;
      }
      const split = candidates(state, current, remaining);
      const h = split.h;
      // Eligibility resets only for an interval actually about to be consumed.
      if (!current.eligible) state.dwell = 0;
      const segment = makeSegment(state, current, axis, claw, state.time);
      const x0 = state.x, v0 = state.v;
      state.x = positionAt(x0, v0, current.acceleration, h);
      state.v = speedAt(v0, current.acceleration, h);
      if (current.engaged && Math.abs(v0) > RULES.safeClawSpeed) {
        const load = RULES.loadCoefficient * h *
          (Math.abs(v0) - RULES.safeClawSpeed + 0.5 * Math.sign(v0) * current.acceleration * h);
        state.damage += Math.max(0, load);
      }
      if (current.eligible) state.dwell += h;
      split.reached.forEach(event => {
        if (event.kind === 'position') state.x = reachedSurface(state.x, event.value);
        else if (event.kind === 'velocity') state.v = reachedSurface(state.v, event.value);
        else if (event.kind === 'damage') state.damage = reachedSurface(state.damage, event.value);
        else if (event.kind === 'dwell') state.dwell = reachedSurface(state.dwell, event.value);
      });
      elapsed += h;
      const callEnd = split.reached.some(event => event.reason === 'call-end');
      remaining = callEnd ? 0 : remaining - h;
      if (callEnd) elapsed = trace.acceptedDt;
      state.time = trace.startTime + elapsed;
      segment.t1 = state.time;
      segment.duration = h;
      segment.x1 = state.x;
      segment.v1 = state.v;
      segment.damage1 = state.damage;
      segment.dwell1 = state.dwell;
      segment.ends = END_ORDER.filter(reason => split.reached.some(event => event.reason === reason));
      trace.segments.push(segment);
      const causes = ['edge', 'damage'].filter(reason => segment.ends.includes(reason));
      if (causes.length) finish(state, trace, elapsed, causes);
      else if (segment.ends.includes('delivery')) deliver(state, trace, elapsed);
    }
    trace.consumedDt = elapsed;
    trace.unusedDt = state.phase === 'playing' ? 0 : trace.acceptedDt - elapsed;
  }

  function step(state, dt, input) {
    if (state.phase !== 'playing') return state;
    const before = projection(state);
    const timing = durationInfo(state, dt);
    const seq = state.nextSeq++;
    const lastInput = consumeInput(state, input);
    const trace = Object.assign({ seq, startTime: state.time }, timing, {
      consumedDt: 0, unusedDt: 0, input: copy(lastInput), before,
      after: null, segments: [], events: []
    });
    state.lastInput = freeze(lastInput);
    state.events = [];
    if (lastInput.gateBefore !== lastInput.gateAfter) {
      emit(state, trace, lastInput.gateAfter ? 'release' : 'cancel', 0, {
        gateBefore: lastInput.gateBefore, gateAfter: lastInput.gateAfter, epoch: state.lastCancelEpoch
      });
    }
    if (trace.acceptedDt > 0) integrate(state, trace, lastInput.effectiveAxis, lastInput.effectiveClaw);
    state.contact = observeContact(state, lastInput.effectiveAxis, lastInput.effectiveClaw);
    state.message = messageFor(state);
    trace.after = projection(state);
    trace.events = copy(state.events);
    state.events = freeze(state.events);
    state.lastStep = freeze(trace);
    return state;
  }

  const api = Object.freeze({ create, step });
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PureModel = api;
})(typeof globalThis === 'object' ? globalThis : this);
