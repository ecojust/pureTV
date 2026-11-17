(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var HZ = 60, DT = 1 / HZ, EPS = 1e-10;
  var DIMENSIONS = ['temperature', 'humidity', 'soilMoisture'];
  // Public initial conditions only. No control schedule or winning reference.
  var LEVELS = [
    { name: '晨光苗圃', nameEn: 'DAWN NURSERY', heat: [.90, 1.45, .60], initial: [30, 60, 48, 24], delay: 90, maturity: [30, 38, 34] },
    { name: '正午玻璃房', nameEn: 'NOON GLASSHOUSE', heat: [1.05, 1.65, .65], initial: [31, 58, 44, 23], delay: 120, maturity: [33, 41, 37] },
    { name: '傍晚育苗台', nameEn: 'EVENING SEEDLINGS', heat: [.80, 1.55, .55], initial: [29, 62, 52, 22], delay: 150, maturity: [36, 44, 40] }
  ];
  var PHYSICS = {
    outsideTemperature: 24, outsideHumidity: 45,
    temperatureRelax: .08, ventCooling: .35, shadeHeatFraction: .30,
    humidityRelax: .035, naturalHumidity: .55, ventDrying: .40,
    irrigationHumidity: .80, dripRatePerLevel: .50, soilGain: 2,
    baseEvaporation: .35, hotEvaporation: .025,
    ventEvaporation: .08, shadeConservation: .06
  };
  var CROP_RULES = [
    { id: 'C1', name: '叶菜', nameEn: 'LEAF', comfort: [[22, 28.5], [55, 75], [45, 68]], safe: [[12, 37], [25, 95], [15, 90]], damage: 8 },
    { id: 'C2', name: '豆苗', nameEn: 'BEAN', comfort: [[25, 32], [45, 68], [35, 60]], safe: [[12, 41], [20, 95], [10, 88]], damage: 10 },
    { id: 'C3', name: '香草', nameEn: 'HERB', comfort: [[24, 30], [50, 72], [40, 64]], safe: [[12, 39], [25, 95], [12, 90]], damage: 9 }
  ];

  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function bands(values) {
    return { temperature: values[0].slice(), humidity: values[1].slice(), soilMoisture: values[2].slice() };
  }
  function inspectCrop(crop, environment) {
    crop.comfortChecks = {};
    crop.failedComfortDimensions = [];
    crop.unsafeDimensions = [];
    DIMENSIONS.forEach(function (key) {
      var value = environment[key], comfort = crop.comfort[key], safe = crop.safe[key];
      var comfortable = value >= comfort[0] && value <= comfort[1];
      crop.comfortChecks[key] = comfortable;
      if (!comfortable) crop.failedComfortDimensions.push(key);
      if (value < safe[0] || value > safe[1]) crop.unsafeDimensions.push(key);
    });
    crop.inRange = crop.failedComfortDimensions.length === 0;
    crop.dangerous = crop.unsafeDimensions.length > 0;
    crop.mature = crop.growthTicks >= crop.maturityTicks;
    crop.dead = crop.damageTicks >= crop.damageLimitTicks;
  }
  function summarize(s) {
    s.matureCount = s.crops.filter(function (crop) { return crop.mature; }).length;
    s.deadCropIds = s.crops.filter(function (crop) { return crop.dead; }).map(function (crop) { return crop.id; });
    s.unfinishedCropIds = s.crops.filter(function (crop) { return !crop.mature; }).map(function (crop) { return crop.id; });
    s.score = s.crops.reduce(function (total, crop) {
      return total + (crop.mature ? 200 : Math.floor(200 * crop.growthTicks / crop.maturityTicks));
    }, 0);
    if (s.phase === 'won') s.score += 1000 + Math.floor(s.reservoir.remainingLitres + 1e-8);
  }
  function describe(s) {
    if (s.phase === 'won') s.message = '三种作物全部成熟，温室培育完成';
    else if (s.phase === 'lost') {
      var reasons = { crop: '作物累计损伤达到上限', water: '水已耗尽，未成熟作物连续三秒没有生长', timeout: '九十秒培育时间已用尽' };
      s.message = reasons[s.lostReason];
    } else if (s.dryStallTicks > 0) s.message = '水已耗尽：仍可利用土壤余水，留意未成熟作物停长计时';
    else if (s.pendingCommands.length > 0) s.message = '设定已排队：观察实际档位，执行器会延迟生效';
    else s.message = '方向选择旋钮；A 加一档，B 减一档；三种作物须全部成熟';
  }
  function emit(s, type, details) {
    var event = Object.assign({ type: type, tick: s.tick, at: s.elapsed }, copy(details || {}));
    s.lastAction = copy(event);
    s.events.push(event);
    if (s.events.length > 32) s.events.shift();
  }
  function create(seed, difficulty) {
    var d = clamp(Math.floor(finite(difficulty, 0)), 0, 2), level = LEVELS[d];
    var s = {
      width: 960, height: 540, seed: finite(seed, 1), difficulty: d, level: d + 1,
      name: level.name, nameEn: level.nameEn, levelName: level.name,
      phase: 'playing', tick: 0, elapsed: 0, timeLimit: 90, remaining: 90,
      score: 0, message: '', lostReason: null, selectedId: 'vent',
      dials: [
        { id: 'vent', name: '通风', nameEn: 'VENT', requestedLevel: 0, appliedLevel: 0 },
        { id: 'shade', name: '遮阳', nameEn: 'SHADE', requestedLevel: 0, appliedLevel: 0 },
        { id: 'drip', name: '滴灌', nameEn: 'DRIP', requestedLevel: 0, appliedLevel: 0 }
      ],
      delayTicks: level.delay, pendingCommands: [], commandCount: 0,
      appliedCommandCount: 0, blockedCommands: 0, lastCommand: null, lastAppliedCommands: null,
      weatherPeriods: [
        { id: 'dawn', from: 0, to: 18, heatInput: level.heat[0] },
        { id: 'noon', from: 18, to: 42, heatInput: level.heat[1] },
        { id: 'late', from: 42, to: 90, heatInput: level.heat[2] }
      ],
      currentWeather: null, physics: copy(PHYSICS),
      environment: { temperature: level.initial[0], humidity: level.initial[1], soilMoisture: level.initial[2] },
      reservoir: { initialLitres: level.initial[3], remainingLitres: level.initial[3], usedLitres: 0 },
      dryStallLimitTicks: 180, dryStallTicks: 0,
      crops: CROP_RULES.map(function (rule, index) {
        return {
          id: rule.id, name: rule.name, nameEn: rule.nameEn,
          comfort: bands(rule.comfort), safe: bands(rule.safe),
          maturityTicks: level.maturity[index] * HZ, damageLimitTicks: rule.damage * HZ,
          growthTicks: 0, damageTicks: 0, mature: false, dead: false,
          inRange: false, growing: false, dangerous: false,
          comfortChecks: {}, failedComfortDimensions: [], unsafeDimensions: []
        };
      }),
      matureCount: 0, deadCropIds: [], unfinishedCropIds: [], lastInterval: null,
      events: [], lastAction: null,
      _accumulator: 0, _lastA: false, _lastB: false,
      _pendingA: false, _pendingB: false, _direction: null, _repeatTick: 0, _cancelEpoch: null
    };
    s.currentWeather = copy(s.weatherPeriods[0]);
    s.crops.forEach(function (crop) { inspectCrop(crop, s.environment); });
    summarize(s);
    describe(s);
    return s;
  }

  function direction(input) {
    var x = clamp(finite(input.x, 0), -1, 1), y = clamp(finite(input.y, 0), -1, 1);
    if (Math.max(Math.abs(x), Math.abs(y)) < .25) return null;
    return Math.abs(x) >= Math.abs(y) ? (x > 0 ? 'E' : 'W') : (y > 0 ? 'S' : 'N');
  }
  function navigate(s, name) {
    var index = s.dials.findIndex(function (dial) { return dial.id === s.selectedId; });
    var next = clamp(index + (name === 'E' || name === 'S' ? 1 : -1), 0, s.dials.length - 1);
    s.selectedId = s.dials[next].id;
    emit(s, next === index ? 'select-blocked' : 'select', { direction: name, dialId: s.selectedId });
  }
  function changeRequested(s, delta) {
    var dial = s.dials.find(function (item) { return item.id === s.selectedId; });
    var before = dial.requestedLevel, after = clamp(before + delta, 0, 2);
    if (after === before) {
      s.blockedCommands++;
      emit(s, 'limit', { dialId: dial.id, requestedLevel: before, delta: delta });
      return;
    }
    dial.requestedLevel = after;
    var command = {
      id: ++s.commandCount, dialId: dial.id,
      beforeRequested: before, afterRequested: after,
      issuedTick: s.tick, dueTick: s.tick + s.delayTicks
    };
    s.pendingCommands.push(copy(command));
    s.lastCommand = copy(command);
    emit(s, 'command', { command: command });
  }
  function consumeInput(s, heldDirection) {
    if (!heldDirection) {
      s._direction = null;
      s._repeatTick = 0;
    }
    if (s._pendingB) {
      s._pendingB = false;
      s._pendingA = false;
      changeRequested(s, -1);
      return;
    }
    if (heldDirection && heldDirection !== s._direction) {
      s._direction = heldDirection;
      s._repeatTick = s.tick + 20;
      navigate(s, heldDirection);
    } else if (heldDirection && s.tick >= s._repeatTick) {
      s._repeatTick = s.tick + 10;
      navigate(s, heldDirection);
    }
    if (s._pendingA) {
      s._pendingA = false;
      changeRequested(s, 1);
    }
  }
  function applyCommands(s) {
    s.lastAppliedCommands = [];
    // The per-level delay is fixed; append order is already (dueTick,id).
    while (s.pendingCommands.length && s.pendingCommands[0].dueTick <= s.tick) {
      var command = s.pendingCommands.shift();
      var dial = s.dials.find(function (item) { return item.id === command.dialId; });
      var beforeApplied = dial.appliedLevel;
      dial.appliedLevel = command.afterRequested;
      s.appliedCommandCount++;
      var receipt = Object.assign({}, command, {
        beforeApplied: beforeApplied, afterApplied: dial.appliedLevel,
        appliedTick: s.tick, at: s.elapsed
      });
      s.lastAppliedCommands.push(copy(receipt));
      emit(s, 'applied', { command: receipt });
    }
  }
  function climate(s, oldTick) {
    var before = copy(s.environment), p = s.physics, oldWater = s.reservoir.remainingLitres;
    var levels = {};
    s.dials.forEach(function (dial) { levels[dial.id] = dial.appliedLevel; });
    var weather = s.weatherPeriods.find(function (period) {
      return oldTick / HZ >= period.from && oldTick / HZ < period.to;
    }) || s.weatherPeriods[s.weatherPeriods.length - 1];
    s.currentWeather = copy(weather);
    var used = Math.min(oldWater, levels.drip * p.dripRatePerLevel * DT);
    var evaporation = Math.max(0, p.baseEvaporation + p.hotEvaporation * Math.max(before.temperature - p.outsideTemperature, 0)
      + p.ventEvaporation * levels.vent - p.shadeConservation * levels.shade);
    var heatRate = weather.heatInput * (1 - p.shadeHeatFraction * levels.shade)
      - p.ventCooling * levels.vent - p.temperatureRelax * (before.temperature - p.outsideTemperature);
    var humidityRate = p.naturalHumidity - p.ventDrying * levels.vent
      - p.humidityRelax * (before.humidity - p.outsideHumidity);
    s.environment = {
      temperature: clamp(before.temperature + heatRate * DT, 0, 60),
      humidity: clamp(before.humidity + humidityRate * DT + p.irrigationHumidity * used, 0, 100),
      soilMoisture: clamp(before.soilMoisture - evaporation * DT + p.soilGain * used, 0, 100)
    };
    s.reservoir.remainingLitres = Math.max(0, oldWater - used);
    s.reservoir.usedLitres += used;
    s.lastInterval = {
      fromTick: oldTick, toTick: s.tick, fromTime: oldTick / HZ, toTime: s.elapsed,
      beforeEnvironment: before, afterEnvironment: copy(s.environment),
      beforeWater: oldWater, usedLitres: used, actualDripLps: used / DT,
      evaporationPctPerSec: evaporation, appliedLevels: copy(levels), heatInput: weather.heatInput,
      growthCropIds: [], damagedCropIds: []
    };
  }
  function updateCrops(s) {
    s.crops.forEach(function (crop) {
      inspectCrop(crop, s.environment);
      crop.growing = !crop.mature && crop.inRange;
      if (crop.growing) {
        crop.growthTicks = Math.min(crop.maturityTicks, crop.growthTicks + 1);
        s.lastInterval.growthCropIds.push(crop.id);
      }
      if (crop.dangerous) {
        crop.damageTicks++;
        s.lastInterval.damagedCropIds.push(crop.id);
      }
      crop.mature = crop.growthTicks >= crop.maturityTicks;
      crop.dead = crop.damageTicks >= crop.damageLimitTicks;
    });
    summarize(s);
    var unfinishedGrowing = s.crops.some(function (crop) { return !crop.mature && crop.growing; });
    if (s.reservoir.remainingLitres <= 1e-9 && s.unfinishedCropIds.length > 0 && !unfinishedGrowing) s.dryStallTicks++;
    else s.dryStallTicks = 0;
  }
  function finish(s, phase, reason) {
    s.phase = phase;
    s.lostReason = reason || null;
    summarize(s);
    emit(s, phase, { reason: s.lostReason, deadCropIds: s.deadCropIds, unfinishedCropIds: s.unfinishedCropIds });
  }
  function tick(s, heldDirection) {
    var oldTick = s.tick;
    s.tick++;
    s.elapsed = s.tick / HZ;
    s.remaining = Math.max(0, s.timeLimit - s.elapsed);
    consumeInput(s, heldDirection);
    applyCommands(s);
    climate(s, oldTick);
    updateCrops(s);
    if (s.deadCropIds.length > 0) finish(s, 'lost', 'crop');
    else if (s.matureCount === s.crops.length) finish(s, 'won');
    else if (s.dryStallTicks >= s.dryStallLimitTicks) finish(s, 'lost', 'water');
    else if (s.tick >= s.timeLimit * HZ) finish(s, 'lost', 'timeout');
    describe(s);
  }
  function step(s, dt, input) {
    if (!s || s.phase !== 'playing') return s;
    input = input || {};
    dt = clamp(finite(dt, 0), 0, .25);
    var cancelled = !!input.cancelled;
    if (Number.isFinite(input.cancelEpoch)) {
      if (s._cancelEpoch !== null && s._cancelEpoch !== input.cancelEpoch) cancelled = true;
      s._cancelEpoch = input.cancelEpoch;
    }
    var a = !!input.a, b = !!input.b;
    if (cancelled) {
      s._pendingA = false;
      s._pendingB = false;
      s._direction = null;
      s._repeatTick = 0;
    } else {
      if ((a && !s._lastA) || input.aPressed) s._pendingA = true;
      if ((b && !s._lastB) || input.bPressed) s._pendingB = true;
    }
    s._lastA = a;
    s._lastB = b;
    var heldDirection = cancelled ? null : direction(input);
    s.events = [];
    s._accumulator += dt;
    while (s._accumulator + EPS >= DT && s.phase === 'playing') {
      s._accumulator = Math.max(0, s._accumulator - DT);
      tick(s, heldDirection);
    }
    return s;
  }
  return { create: create, step: step, TICK_HZ: HZ };
}));
