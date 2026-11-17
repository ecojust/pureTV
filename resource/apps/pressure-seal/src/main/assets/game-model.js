(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PureModel = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';

  function freeze(value) {
    Object.values(value).forEach(child => {
      if (child && typeof child === 'object') freeze(child);
    });
    return Object.freeze(value);
  }

  const config = freeze({
    tickSeconds: 0.05, burstPressure: 110, maxCounter: 2147483647, defaultSeed: 740,
    materials: {
      tin: { name: 'TIN', safeHeat: 68, doseBudget: 90 },
      fiber: { name: 'FIBER', safeHeat: 62, doseBudget: 105 },
      foil: { name: 'FOIL', safeHeat: 58, doseBudget: 120 }
    },
    scenarios: [
      { id: 'starter', name: 'STARTER', stages: [
        { material: 'tin', low: 22, high: 38, holdTicks: 120 },
        { material: 'fiber', low: 46, high: 62, holdTicks: 130 },
        { material: 'foil', low: 70, high: 86, holdTicks: 140 }
      ] },
      { id: 'swap', name: 'SWAP', stages: [
        { material: 'fiber', low: 42, high: 56, holdTicks: 130 },
        { material: 'tin', low: 20, high: 34, holdTicks: 130 },
        { material: 'foil', low: 58, high: 72, holdTicks: 140 }
      ] },
      { id: 'heavy', name: 'HEAVY', stages: [
        { material: 'foil', low: 66, high: 80, holdTicks: 140 },
        { material: 'tin', low: 36, high: 50, holdTicks: 140 },
        { material: 'fiber', low: 78, high: 92, holdTicks: 150 }
      ] }
    ]
  });

  function create(seed, level) {
    return {
      schema: 1,
      seed: Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed,
      level: Number.isInteger(level) && level >= 0 && level <= 2 ? level : 0,
      phase: 'playing', reason: '', tick: 0, remainder: 0, counterSaturated: false,
      materialIndex: 0, pressure: 0, heat: 0, dose: 0, totalHeatDose: 0,
      holdTicks: 0, inBandTicks: 0, dwellResets: 0, materialInBandTicks: 0, materialPeakHeat: 0,
      inputArmed: false, cancelEpoch: null, cancelledLast: false,
      lastAction: { a: false, b: false }, seals: [], score: 0, events: [],
      message: '按住 A 加热加压，提前松手；按住 B 泄压。'
    };
  }

  function normalize(input) {
    const sample = { a: false, b: false, cancelled: false, cancelEpoch: undefined, paused: false };
    if (!input || typeof input !== 'object' || Array.isArray(input)) return sample;
    for (const key of Object.keys(sample)) {
      const property = Object.getOwnPropertyDescriptor(input, key);
      if (property && Object.prototype.hasOwnProperty.call(property, 'value')) sample[key] = property.value;
    }
    return sample;
  }

  function increment(state, key) {
    if (state[key] === config.maxCounter) state.counterSaturated = true;
    else state[key] += 1;
  }

  function lose(state, reason) {
    state.phase = 'lost';
    state.reason = reason;
    state.remainder = 0;
    state.events = [{ type: 'collision', reason, materialIndex: state.materialIndex, tick: state.tick }];
    state.message = reason === 'burst' ? '压力触及 110，封装机爆裂。请重试。' : '材料累计过热，封装失败。请重试。';
  }

  function plantTick(state, action) {
    const stage = config.scenarios[state.level].stages[state.materialIndex];
    const material = config.materials[stage.material];
    const oldPressure = state.pressure;
    const a = action.a ? 1 : 0, b = action.b ? 1 : 0;
    increment(state, 'tick');
    state.lastAction = { a: action.a, b: action.b };
    state.heat = Math.min(100, Math.max(0, state.heat + (100 * a - state.heat) / 60));
    const rawPressure = oldPressure + 0.05 * (3 * a + 0.15 * state.heat - 5 - 12 * b);
    state.pressure = Math.min(110, Math.max(0, rawPressure));
    const doseAdd = Math.max(0, state.heat - material.safeHeat) * 0.05;
    state.dose += doseAdd;
    state.totalHeatDose += doseAdd;
    state.materialPeakHeat = Math.max(state.materialPeakHeat, state.heat);
    if (rawPressure >= 110) { lose(state, 'burst'); return; }
    if (state.dose >= material.doseBudget) { lose(state, 'overheat'); return; }

    const inBand = oldPressure >= stage.low && oldPressure <= stage.high &&
      state.pressure >= stage.low && state.pressure <= stage.high;
    if (inBand) {
      state.holdTicks += 1;
      increment(state, 'inBandTicks');
      increment(state, 'materialInBandTicks');
      state.message = material.name + ' 连续保持中，请留意热量。';
    } else {
      const interrupted = state.holdTicks > 0;
      if (interrupted) increment(state, 'dwellResets');
      state.holdTicks = 0;
      state.message = interrupted ? '离开保持区，本材料连续计时已重置。' : '调整压力，进入 ' + material.name + ' 的保持区。';
    }
    if (state.holdTicks < stage.holdTicks) return;

    const index = state.materialIndex;
    state.seals.push({
      index, material: stage.material, low: stage.low, high: stage.high,
      requiredTicks: stage.holdTicks, holdTicks: state.holdTicks, completedTick: state.tick,
      pressure: state.pressure, heat: state.heat, dose: state.dose,
      peakHeat: state.materialPeakHeat, inBandTicks: state.materialInBandTicks
    });
    state.materialIndex += 1;
    state.score = 100 * state.seals.length;
    state.dose = 0;
    state.holdTicks = 0;
    state.materialInBandTicks = 0;
    state.materialPeakHeat = state.heat;
    if (state.materialIndex === 3) {
      state.phase = 'won';
      state.reason = '';
      state.remainder = 0;
      state.events = [{ type: 'win', tick: state.tick }];
      state.message = '三种材料全部封装合格，任务完成。';
    } else {
      state.events = [{ type: 'delivery', materialIndex: index, tick: state.tick }];
      state.message = material.name + ' 封装完成；压力与热量保留，继续下一材料。';
    }
  }

  function step(state, dt, input) {
    if (state.phase !== 'playing' || typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) return state;
    const sample = normalize(input);
    if (sample.paused === true) return state;
    state.events = [];
    const rawA = sample.a === true, rawB = sample.b === true, cancelled = sample.cancelled === true;
    const validEpoch = Number.isSafeInteger(sample.cancelEpoch) && sample.cancelEpoch >= 0;
    const epochChanged = validEpoch && state.cancelEpoch !== null && sample.cancelEpoch !== state.cancelEpoch;
    if (epochChanged || (cancelled && !state.cancelledLast)) state.inputArmed = false;
    const action = {
      a: state.inputArmed && !cancelled && rawA,
      b: state.inputArmed && !cancelled && rawB
    };
    if (!cancelled && !rawA && !rawB) state.inputArmed = true;
    if (validEpoch) state.cancelEpoch = sample.cancelEpoch;
    state.cancelledLast = cancelled;
    const span = state.remainder + dt;
    const count = Math.min(5, Math.floor((span + 1e-12) / 0.05));
    state.remainder = Math.max(0, span - count * 0.05);
    for (let i = 0; i < count && state.phase === 'playing'; i += 1) plantTick(state, action);
    return state;
  }

  return Object.freeze({ create, step, config });
});
