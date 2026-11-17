/* Moiré Atelier: two periodic masks, one shared world-coordinate optical law. */
(function (root, factory) {
  'use strict';
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.PureModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const wrap = value => value - Math.floor(value);
  const centerWrap = value => wrap(value + 0.5) - 0.5;
  const pointCopy = point => ({ x: point.x, y: point.y });
  const layerCopy = layers => layers.map(layer => ({ phaseTick: layer.phaseTick, angleTick: layer.angleTick }));

  function copy(value) {
    if (Array.isArray(value)) return value.map(copy);
    if (value !== null && typeof value === 'object') {
      const result = {};
      Object.keys(value).forEach(key => {
        Object.defineProperty(result, key, { value: copy(value[key]), enumerable: true, writable: true, configurable: true });
      });
      return result;
    }
    return value;
  }

  function deepFreeze(value) {
    if (value !== null && typeof value === 'object') {
      Object.keys(value).forEach(key => deepFreeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }

  function transmission(cycles) {
    if (typeof cycles !== 'number' || !Number.isFinite(cycles)) return null;
    return (1 + Math.cos(2 * Math.PI * wrap(cycles))) / 2;
  }

  function referenceNormal(guide) {
    const dx = guide.end.x - guide.pin.x, dy = guide.end.y - guide.pin.y;
    const length = Math.hypot(dx, dy);
    return { x: dy / length, y: -dx / length };
  }

  function makeGuide(px, py, dx, dy) {
    return { pin: { x: px, y: py }, end: { x: px + dx, y: py + dy } };
  }

  function makeTasks() {
    const c3 = Math.cos(Math.PI / 60), s3 = Math.sin(Math.PI / 60);
    const c6 = Math.cos(Math.PI / 30), s6 = Math.sin(Math.PI / 30);
    const descriptors = [
      { id: 'parallel-light', name: 'PARALLEL LIGHT', nameZh: '平行光纹',
        initialLayers: [{ phaseTick: 6, angleTick: -2 }, { phaseTick: 18, angleTick: 2 }],
        guides: [makeGuide(0, 0, 0, 0.36), makeGuide(0, 0, 0, 0.36)],
        points: [[0, 0], [-3 / 8, -1 / 4], [-1 / 96, 1 / 4], [13 / 48, -0.22], [5 / 24, 0.26]] },
      { id: 'crossed-silk', name: 'CROSSED SILK', nameZh: '交织细幕',
        initialLayers: [{ phaseTick: 2, angleTick: -1 }, { phaseTick: 22, angleTick: 1 }],
        guides: [makeGuide(c3 / 192, s3 / 192, -0.36 * s3, 0.36 * c3),
          makeGuide(-c3 / 150, s3 / 150, 0.36 * s3, 0.36 * c3)],
        points: [[0, 0], [-0.34, -0.25], [-0.20, 0.28], [0.16, -0.30], [0.34, 0.24]] },
      { id: 'oblique-study', name: 'OBLIQUE STUDY', nameZh: '斜光习作',
        initialLayers: [{ phaseTick: 12, angleTick: -2 }, { phaseTick: 10, angleTick: 2 }],
        guides: [makeGuide(-c6 / 96, -s6 / 96, -0.36 * s6, 0.36 * c6),
          makeGuide(c6 / 75, -s6 / 75, 0.36 * s6, 0.36 * c6)],
        points: [[0, 0], [-0.32, -0.28], [-0.27, 0.25], [0.25, -0.25], [0.32, 0.29]] }
    ];
    return descriptors.map(task => {
      const normals = task.guides.map(referenceNormal);
      const probes = task.points.map((point, index) => {
        const cycles = normals.map((normal, layer) => (layer === 0 ? 24 : 25)
          * (normal.x * (point[0] - task.guides[layer].pin.x)
            + normal.y * (point[1] - task.guides[layer].pin.y)));
        return { id: index === 0 ? 'C' : String(index), position: { x: point[0], y: point[1] },
          targetPhases: cycles.map(wrap), targetBrightness: transmission(cycles[0]) * transmission(cycles[1]),
          tolerance: 0.035 };
      });
      return { id: task.id, name: task.name, nameZh: task.nameZh,
        initialLayers: task.initialLayers, guides: task.guides, probes };
    });
  }

  const config = deepFreeze({
    defaultSeed: 744, board: { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 },
    sampleBounds: { min: -1, max: 1 }, frequencies: [24, 25], phaseSteps: 24,
    angleStepDegrees: 3, angleBounds: [-4, 4], timeLimit: 90, attemptLimit: 4,
    probeTolerance: 0.035, guideTolerance: 1e-9, maxCounter: 2147483647, tasks: makeTasks()
  });

  function sampleAt(state, x, y) {
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)
      || x < config.sampleBounds.min || x > config.sampleBounds.max
      || y < config.sampleBounds.min || y > config.sampleBounds.max) return null;
    const cycles = state.layers.map((layer, index) => {
      const angle = layer.angleTick * Math.PI / 60;
      return config.frequencies[index] * (Math.cos(angle) * x + Math.sin(angle) * y)
        + layer.phaseTick / config.phaseSteps;
    });
    const phases = cycles.map(wrap), transmissions = cycles.map(transmission);
    return { x, y, cycles, phases, transmissions, brightness: transmissions[0] * transmissions[1] };
  }

  function probeReading(probe, sample) {
    const error = sample.brightness - probe.targetBrightness;
    return { id: probe.id, position: pointCopy(probe.position), targetPhases: probe.targetPhases.slice(),
      targetBrightness: probe.targetBrightness, tolerance: probe.tolerance, sample, error,
      matched: Math.abs(error) <= probe.tolerance };
  }

  function deriveOptics(state) {
    const task = config.tasks[state.level];
    const layers = state.layers.map((layer, index) => {
      const angleRadians = layer.angleTick * Math.PI / 60;
      const normal = { x: Math.cos(angleRadians), y: Math.sin(angleRadians) };
      const reference = referenceNormal(task.guides[index]);
      const pin = pointCopy(task.guides[index].pin), end = pointCopy(task.guides[index].end);
      const phase = layer.phaseTick / config.phaseSteps, frequency = config.frequencies[index];
      const turnErrorDegrees = Math.atan2(reference.x * normal.y - reference.y * normal.x,
        reference.x * normal.x + reference.y * normal.y) * 180 / Math.PI;
      const phaseError = centerWrap(frequency * (normal.x * pin.x + normal.y * pin.y) + phase);
      return { index, frequency, phase, angleDegrees: layer.angleTick * config.angleStepDegrees,
        angleRadians, normal, tangent: { x: -normal.y, y: normal.x },
        guide: { pin, end, referenceNormal: reference, turnErrorDegrees, phaseError,
          phaseErrorTicks: config.phaseSteps * phaseError,
          turnAligned: Math.abs(turnErrorDegrees) <= config.guideTolerance,
          phaseAligned: Math.abs(phaseError) <= config.guideTolerance } };
    });
    const probes = task.probes.map(probe => probeReading(probe,
      sampleAt(state, probe.position.x, probe.position.y)));
    return { layers, probes, matched: probes.every(probe => probe.matched) };
  }

  function create(seed, level) {
    seed = Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed;
    level = Number.isInteger(level) && level >= 0 && level < config.tasks.length ? level : 0;
    const state = {
      schema: 1, seed, level, phase: 'playing', reason: '', score: 0,
      layers: layerCopy(config.tasks[level].initialLayers), selected: 0, optics: null,
      elapsed: 0, failures: 0, submissions: [], terminalReceipt: null,
      calls: 0, adjustments: 0, switches: 0, blockedTurns: 0, counterSaturated: false,
      inputArmed: false, cancelEpoch: null, cancelledLast: false,
      lastHeld: { a: false, b: false, direction: 'none' }, lastCommand: 'none', events: [],
      message: '左右滑纹，上下旋转；B 切换膜，A 同时验收五个测点。'
    };
    state.optics = deriveOptics(state);
    return state;
  }

  function normalizeInput(input) {
    const neutral = () => ({ x: 0, y: 0, a: false, b: false, cancelEpoch: null, cancelled: false, paused: false });
    try {
      if (input === null || typeof input !== 'object' || Array.isArray(input)) return neutral();
      const values = Object.create(null);
      for (const key of ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused']) {
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        if (descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')) values[key] = descriptor.value;
      }
      const axis = value => typeof value === 'number' && Number.isFinite(value)
        ? Math.max(-1, Math.min(1, value)) : 0;
      return { x: axis(values.x), y: axis(values.y), a: values.a === true, b: values.b === true,
        cancelEpoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null,
        cancelled: values.cancelled === true, paused: values.paused === true };
    } catch (_) { return neutral(); }
  }

  function directionOf(input) {
    const x = Math.abs(input.x), y = Math.abs(input.y);
    if (x <= 0.5 && y <= 0.5) return 'none';
    if (y >= x) return input.y > 0 ? 'down' : 'up';
    return input.x > 0 ? 'right' : 'left';
  }

  function increment(state, key) {
    const next = state[key] + 1;
    if (next > config.maxCounter) state.counterSaturated = true;
    state[key] = Math.min(config.maxCounter, next);
  }

  function finish(state, cause) {
    state.phase = cause === 'success' ? 'won' : 'lost';
    state.reason = cause === 'success' ? '' : cause;
    state.score = cause === 'success' ? 100 : 0;
    state.events = cause === 'success' ? [{ type: 'win', call: state.calls }]
      : [{ type: 'collision', reason: cause, call: state.calls }];
    state.terminalReceipt = { cause, call: state.calls, elapsed: state.elapsed,
      layers: layerCopy(state.layers), probes: copy(state.optics.probes), matched: state.optics.matched,
      failures: state.failures, remaining: config.attemptLimit - state.failures,
      score: state.score, phase: state.phase, reason: state.reason };
    state.message = cause === 'success' ? '五个测点同时合格，双层纹幕校准完成。'
      : cause === 'time' ? '校准时间已到；重试后先旋转对线，再滑纹对针。'
        : '四次验收均未合格；重试时同时观察全部五个测点。';
  }

  function step(state, dt, input) {
    if (state.phase === 'won' || state.phase === 'lost') return state;
    if (typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) return state;
    const normalized = normalizeInput(input);
    if (normalized.paused) return state;
    state.events = [];
    state.lastCommand = 'none';
    increment(state, 'calls');
    const nextElapsed = state.elapsed + dt;
    state.elapsed = Math.min(config.timeLimit, nextElapsed);
    if (nextElapsed >= config.timeLimit) {
      state.optics = deriveOptics(state);
      finish(state, 'time');
      return state;
    }

    const direction = directionOf(normalized), previous = state.lastHeld;
    const changedEpoch = normalized.cancelEpoch !== null && state.cancelEpoch !== null
      && normalized.cancelEpoch !== state.cancelEpoch;
    if (changedEpoch || (normalized.cancelled && !state.cancelledLast)) state.inputArmed = false;
    if (normalized.cancelEpoch !== null) state.cancelEpoch = normalized.cancelEpoch;
    state.cancelledLast = normalized.cancelled;
    let command = 'none';
    if (state.inputArmed && !normalized.cancelled) {
      if (normalized.b && !previous.b) command = 'b';
      else if (normalized.a && !previous.a) command = 'a';
      else if (direction !== 'none' && direction !== previous.direction) command = direction;
    }
    state.lastHeld = { a: normalized.a, b: normalized.b, direction };
    if (!normalized.cancelled && !normalized.a && !normalized.b && direction === 'none') state.inputArmed = true;
    state.lastCommand = command;
    if (command === 'none') return state;

    if (command === 'b') {
      state.selected = 1 - state.selected;
      increment(state, 'switches');
      state.events = [{ type: 'switch', selected: state.selected, call: state.calls }];
      state.message = '已选择膜 ' + (state.selected + 1) + '；上下旋转，左右滑纹。';
      return state;
    }
    if (command === 'a') {
      state.optics = deriveOptics(state);
      const failuresBefore = state.failures;
      if (state.optics.matched) finish(state, 'success');
      else {
        state.failures += 1;
        if (state.failures === config.attemptLimit) finish(state, 'attempts');
        else {
          const matchedCount = state.optics.probes.filter(probe => probe.matched).length;
          state.events = [{ type: 'reject', matchedCount, call: state.calls }];
          state.message = '本次 ' + matchedCount + '/5 测点合格；还可错误验收 '
            + (config.attemptLimit - state.failures) + ' 次。';
        }
      }
      state.submissions.push({ index: state.submissions.length, call: state.calls, elapsed: state.elapsed,
        selected: state.selected, layers: layerCopy(state.layers), probes: copy(state.optics.probes),
        matched: state.optics.matched, failuresBefore, failuresAfter: state.failures,
        remaining: config.attemptLimit - state.failures, phase: state.phase, reason: state.reason });
      return state;
    }

    const axis = command === 'left' || command === 'right' ? 'phase' : 'angle';
    const key = axis === 'phase' ? 'phaseTick' : 'angleTick';
    const old = state.layers[state.selected][key];
    const requested = command === 'left' || command === 'down' ? 1 : -1;
    const next = axis === 'phase' ? (old + requested + config.phaseSteps) % config.phaseSteps : old + requested;
    if (axis === 'angle' && (next < config.angleBounds[0] || next > config.angleBounds[1])) {
      increment(state, 'blockedTurns');
      state.events = [{ type: 'blocked', layer: state.selected, axis, requested, call: state.calls }];
      state.message = '当前膜已到旋转止挡；可反向旋转或滑动条纹。';
      return state;
    }
    state.layers = layerCopy(state.layers);
    state.layers[state.selected][key] = next;
    increment(state, 'adjustments');
    state.optics = deriveOptics(state);
    state.events = [{ type: 'adjust', layer: state.selected, axis, from: old, to: next, call: state.calls }];
    state.message = state.optics.matched ? '五个实测亮度均在范围内；按 A 同时验收。'
      : '先把纹线转到参考方向，再左右滑纹对准标针；A 同时验收。';
    return state;
  }

  // SYNTHETIC_MATH_TEST_SEAM: production exports only the five documented API members.
  return Object.freeze({ create, step, transmission, sampleAt, config });
});
