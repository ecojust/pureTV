/* Lens Distance: ideal thin-lens geometry and two explicit teaching metrics. */
(function (root, factory) {
  'use strict';
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.PureModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

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

  const config = deepFreeze({
    defaultSeed: 747, focalLength: 4, objectHeight: 3, railMin: 0, railMax: 36,
    apertureMin: 1, apertureMax: 6, exposureEnergy: 4, maxElapsed: 86400, maxCounter: 2147483647,
    layouts: [
      { id: 'brass-bench', name: 'BRASS BENCH', nameZh: '黄铜光台', cards: [
        { id: 'arrow-plate', name: 'ARROW PLATE', nameZh: '箭羽底片', objectX: 2,
          lensMin: 4, lensMax: 12, screenMin: 14, screenMax: 26,
          startLens: 5, startScreen: 24, startAperture: 2, sourcePower: 160,
          brightnessMin: 32, brightnessMax: 52, adjustmentLimit: 24 },
        { id: 'leaf-plate', name: 'LEAF PLATE', nameZh: '叶片底片', objectX: 6,
          lensMin: 8, lensMax: 13, screenMin: 20, screenMax: 32,
          startLens: 10, startScreen: 30, startAperture: 6, sourcePower: 288,
          brightnessMin: 40, brightnessMax: 60, adjustmentLimit: 24 }
      ] },
      { id: 'long-bench', name: 'LONG BENCH', nameZh: '长距光台', cards: [
        { id: 'star-plate', name: 'STAR PLATE', nameZh: '星芒底片', objectX: 1,
          lensMin: 8, lensMax: 13, screenMin: 15, screenMax: 25,
          startLens: 8, startScreen: 25, startAperture: 1, sourcePower: 100,
          brightnessMin: 30, brightnessMax: 45, adjustmentLimit: 22 },
        { id: 'key-plate', name: 'KEY PLATE', nameZh: '钥匙底片', objectX: 7,
          lensMin: 9, lensMax: 14, screenMin: 21, screenMax: 34,
          startLens: 10, startScreen: 29, startAperture: 2, sourcePower: 256,
          brightnessMin: 32, brightnessMax: 48, adjustmentLimit: 22 }
      ] },
      { id: 'precision-bench', name: 'PRECISION BENCH', nameZh: '精密光台', cards: [
        { id: 'petal-plate', name: 'PETAL PLATE', nameZh: '花瓣底片', objectX: 4,
          lensMin: 6, lensMax: 16, screenMin: 20, screenMax: 21,
          startLens: 8, startScreen: 21, startAperture: 6, sourcePower: 128,
          brightnessMin: 24, brightnessMax: 36, adjustmentLimit: 16 },
        { id: 'spire-plate', name: 'SPIRE PLATE', nameZh: '塔尖底片', objectX: 0,
          lensMin: 2, lensMax: 6, screenMin: 19, screenMax: 26,
          startLens: 4, startScreen: 20, startAperture: 1, sourcePower: 768,
          brightnessMin: 38, brightnessMax: 54, adjustmentLimit: 16 }
      ] }
    ]
  });

  function currentCard(state) {
    return config.layouts[state.level].cards[state.cardIndex];
  }

  function deriveOptics(state) {
    const card = currentCard(state), u = state.lensX - card.objectX, v = state.screenX - state.lensX;
    const a = state.aperture, n = u - config.focalLength;
    const imageKind = n > 0 ? 'real' : n < 0 ? 'virtual' : 'focal';
    const imageDistance = n === 0 ? null : config.focalLength * u / n;
    const defocusNumerator = Math.abs(v * n - config.focalLength * u);
    const blurNumerator = 16 * a * defocusNumerator + (a - 1) * (a - 1) * (4 * u);
    const blurDenominator = 16 * (4 * u);
    const brightnessNumerator = card.sourcePower * a * a, brightnessDenominator = v * v;
    const brightnessOk = card.brightnessMin * brightnessDenominator <= brightnessNumerator
      && brightnessNumerator <= card.brightnessMax * brightnessDenominator;
    const clarityOk = imageKind === 'real' && blurNumerator <= blurDenominator;
    return { u, v, imageKind, imageDistance,
      imageX: n === 0 ? null : state.lensX + imageDistance,
      magnification: n === 0 ? null : -imageDistance / u,
      defocusNumerator, blurNumerator, blurDenominator, blur: blurNumerator / blurDenominator,
      brightnessNumerator, brightnessDenominator, brightness: brightnessNumerator / brightnessDenominator,
      brightnessOk, clarityOk, canExpose: imageKind === 'real' && clarityOk && brightnessOk };
  }

  function loadCard(state) {
    const card = currentCard(state);
    state.card = copy(card);
    state.objectX = card.objectX;
    state.lensX = card.startLens;
    state.screenX = card.startScreen;
    state.aperture = card.startAperture;
    state.selected = 'lens';
    state.energy = config.exposureEnergy;
    state.adjustmentsUsed = 0;
    state.optics = deriveOptics(state);
  }

  function create(seed, level) {
    seed = Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed;
    level = Number.isInteger(level) && level >= 0 && level < config.layouts.length ? level : 0;
    const state = {
      schema: 1, seed, level, phase: 'playing', reason: '', score: 0, cardIndex: 0, completed: 0,
      card: null, objectX: 0, lensX: 0, screenX: 0, aperture: 1, selected: 'lens',
      energy: 4, adjustmentsUsed: 0, optics: null, elapsed: 0, elapsedCapped: false,
      exposureReceipts: [], terminalReceipt: null,
      calls: 0, railMoves: 0, apertureChanges: 0, selections: 0, exposures: 0,
      totalAdjustments: 0, blockedActions: 0, counterSaturated: false,
      inputArmed: false, cancelEpoch: null, cancelledLast: false,
      lastHeld: { a: false, b: false, direction: 'none' }, lastCommand: 'none', events: [],
      message: '左右移动透镜，B 切换屏幕；上下调光阑，A 曝光验收。'
    };
    loadCard(state);
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

  function controlName(control) {
    return control === 'lens' ? '透镜' : control === 'screen' ? '屏幕' : '光阑';
  }

  function settle(state, cause, detail) {
    state.phase = cause === 'success' ? 'won' : 'lost';
    state.reason = cause === 'success' ? '' : cause;
    state.score = cause === 'success' ? 100 : 0;
    if (cause === 'success') {
      state.events = [{ type: 'win', cardIndex: 1, call: state.calls }];
      state.message = '两张底片均已清晰曝光，实验完成。';
    } else if (cause === 'energy') {
      state.events = [{ type: 'collision', reason: 'energy', call: state.calls }];
      state.message = '曝光电量耗尽，本次实验结束。';
    } else {
      state.events = [{ type: 'collision', reason: 'adjustments', control: detail.control,
        from: detail.from, to: detail.to, call: state.calls }];
      state.message = '超过本张底片的调整次数，本次实验结束。';
    }
    const card = currentCard(state);
    state.terminalReceipt = { cause, call: state.calls, elapsed: state.elapsed, level: state.level,
      cardIndex: state.cardIndex, cardId: card.id, completed: state.completed,
      objectX: state.objectX, lensX: state.lensX, screenX: state.screenX, aperture: state.aperture,
      selected: state.selected, optics: copy(state.optics), energy: state.energy,
      adjustmentsUsed: state.adjustmentsUsed, adjustmentLimit: card.adjustmentLimit,
      score: state.score, phase: state.phase, reason: state.reason };
  }

  function expose(state) {
    state.optics = deriveOptics(state);
    const card = currentCard(state);
    const receipt = { index: state.exposureReceipts.length, call: state.calls, elapsed: state.elapsed,
      cardIndex: state.cardIndex, cardId: card.id, objectX: state.objectX,
      lensX: state.lensX, screenX: state.screenX, aperture: state.aperture, selected: state.selected,
      optics: copy(state.optics), energyBefore: state.energy, energyAfter: state.energy - 1,
      adjustmentsUsed: state.adjustmentsUsed, adjustmentLimit: card.adjustmentLimit,
      matched: state.optics.canExpose, completedBefore: state.completed,
      completedAfter: state.completed + (state.optics.canExpose ? 1 : 0), outcome: 'reject' };
    increment(state, 'exposures');
    state.energy -= 1;
    if (state.optics.canExpose) {
      state.completed += 1;
      if (state.completed === 2) {
        receipt.outcome = 'won';
        settle(state, 'success');
      } else {
        state.cardIndex = 1;
        loadCard(state);
        receipt.outcome = 'advance';
        state.events = [{ type: 'advance', fromCard: 0, toCard: 1, call: state.calls }];
        state.message = '第一张底片已完成；第二张已重置，请重新调焦。';
      }
    } else if (state.energy === 0) {
      receipt.outcome = 'lost';
      settle(state, 'energy');
    } else {
      state.events = [{ type: 'reject', cardIndex: state.cardIndex, energy: state.energy, call: state.calls }];
      state.message = '成像未通过；实像、清晰度和亮度须同时合格。剩余 ' + state.energy + ' 次曝光电量。';
    }
    state.exposureReceipts.push(receipt);
  }

  function adjust(state, command) {
    const card = currentCard(state), aperture = command === 'up' || command === 'down';
    const control = aperture ? 'aperture' : state.selected;
    const key = aperture ? 'aperture' : control === 'lens' ? 'lensX' : 'screenX';
    const from = state[key], to = from + (command === 'right' || command === 'up' ? 1 : -1);
    const min = aperture ? config.apertureMin : control === 'lens' ? card.lensMin : card.screenMin;
    const max = aperture ? config.apertureMax : control === 'lens' ? card.lensMax : card.screenMax;
    if (to < min || to > max) {
      increment(state, 'blockedActions');
      state.events = [{ type: 'blocked', reason: 'boundary', control, call: state.calls }];
      state.message = controlName(control) + '已到调节边界；不消耗次数。';
      return;
    }
    state[key] = to;
    state.adjustmentsUsed += 1;
    increment(state, aperture ? 'apertureChanges' : 'railMoves');
    increment(state, 'totalAdjustments');
    state.optics = deriveOptics(state);
    if (state.adjustmentsUsed > card.adjustmentLimit) {
      settle(state, 'adjustments', { control, from, to });
      return;
    }
    const remaining = card.adjustmentLimit - state.adjustmentsUsed;
    state.events = [{ type: 'adjust', control, from, to, used: state.adjustmentsUsed, remaining, call: state.calls }];
    state.message = controlName(control) + '调至 ' + to + '；剩余 ' + remaining + ' 次调整。';
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
    if (nextElapsed > config.maxElapsed) state.elapsedCapped = true;
    state.elapsed = Math.min(config.maxElapsed, nextElapsed);

    const direction = directionOf(normalized), previous = state.lastHeld, wasArmed = state.inputArmed;
    const changedEpoch = normalized.cancelEpoch !== null && state.cancelEpoch !== null
      && normalized.cancelEpoch !== state.cancelEpoch;
    const disarm = changedEpoch || (normalized.cancelled && !state.cancelledLast);
    if (disarm) state.inputArmed = false;
    if (normalized.cancelEpoch !== null) state.cancelEpoch = normalized.cancelEpoch;
    state.cancelledLast = normalized.cancelled;
    let command = 'none';
    if (wasArmed && !disarm && !normalized.cancelled) {
      if (normalized.b && !previous.b) command = 'b';
      else if (normalized.a && !previous.a) command = 'a';
      else if (direction !== 'none' && direction !== previous.direction) command = direction;
    }
    state.lastCommand = command;
    if (command === 'b') {
      const from = state.selected;
      state.selected = from === 'lens' ? 'screen' : 'lens';
      increment(state, 'selections');
      state.events = [{ type: 'select', from, to: state.selected, call: state.calls }];
      state.message = '已选择' + controlName(state.selected) + '；左右移动，上下调光阑。';
    } else if (command === 'a') expose(state);
    else if (command !== 'none') adjust(state, command);

    state.lastHeld = { a: normalized.a, b: normalized.b, direction };
    if (!disarm && !normalized.cancelled && !normalized.a && !normalized.b && direction === 'none') {
      state.inputArmed = true;
    }
    return state;
  }

  return Object.freeze({ create, step, config });
});
