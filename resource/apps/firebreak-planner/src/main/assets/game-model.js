(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var HZ = 60, DT = 1 / HZ, WAVE_TICKS = 120, HEAT_LIMIT = 5;
  var DIRECTIONS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  var LEVELS = [
    { name: '山口初防', nameEn: 'Ridge Watch', ap: 2, cursor: [3, 3],
      rows: ['..FFFFVFF', '...F.....', '...F.....', 'FFFX~....', '...F.....', '...F.....', 'FFFFFFFFF'],
      ignitions: [{ x: 3, y: 3, fuel: 16 }],
      weather: [{ from: 1, direction: 'N' }, { from: 3, direction: 'W' }, { from: 7, direction: 'S' }, { from: 11, direction: 'E' }] },
    { name: '双村岔口', nameEn: 'Two Villages', ap: 3, cursor: [4, 4],
      rows: ['..FFFFVFF', '....F....', '....F....', '....F....', 'FFFFXFFFV', '....F....', '....F....', '....F....', 'FFFFFFFFF'],
      ignitions: [{ x: 4, y: 4, fuel: 20 }],
      weather: [{ from: 1, direction: 'E' }, { from: 4, direction: 'N' }, { from: 7, direction: 'W' }, { from: 13, direction: 'S' }] },
    { name: '湿地守望', nameEn: 'Wetland Watch', ap: 3, cursor: [4, 4],
      rows: ['.~..F..FF', '~X~.F.~..', '.~..F....', '....F....', 'VFFFXFFFF', '....F..FF', '....F..FF', '....F..FF', '..FFVFFFF'],
      ignitions: [{ x: 4, y: 4, fuel: 24 }, { x: 1, y: 1, fuel: 12 }],
      weather: [{ from: 1, direction: 'S' }, { from: 4, direction: 'E' }, { from: 7, direction: 'N' }, { from: 13, direction: 'W' }] }
  ];
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function windFor(s, step) {
    var wind = s.weather[0].direction;
    s.weather.forEach(function (entry) { if (entry.from <= step) wind = entry.direction; });
    return wind;
  }
  function emit(s, type, details) {
    var event = Object.assign({}, details || {}, { id: ++s.eventCount, type: type, tick: s.tick, at: s.elapsed });
    s.events.push(event); s.lastEvent = clone(event); return event;
  }
  function totals(s) {
    var counts = { standing: 0, burning: 0, burnt: 0, cleared: 0 }, intact = 0, destroyed = 0, fuel = 0;
    s.cells.forEach(function (cell) {
      if (cell.terrain === 'forest') { counts[cell.status]++; fuel += cell.fuelRemaining; }
      if (cell.terrain === 'village') { if (cell.status === 'intact') intact++; else destroyed++; }
    });
    s.forest = Object.assign(s.forest, counts); s.villages.intact = intact; s.villages.destroyed = destroyed;
    s.fuel.remaining = fuel; s.fuel.error = s.fuel.initial - fuel - s.fuel.burned - s.fuel.cleared;
    s.nextFireTick = (s.fireStep + 1) * WAVE_TICKS;
    s.nextWind = windFor(s, s.fireStep + 1); s.secondsToFireStep = Math.max(0, s.nextFireTick - s.tick) / HZ;
    s.remaining = Math.max(0, s.timeLimit - s.elapsed);
    s.score = s.phase === 'won' ? 1000 + 10 * s.forest.standing + 25 * s.ap.remaining : 0;
  }
  function finish(s, reason) {
    s.phase = reason ? 'lost' : 'won'; s.lostReason = reason || null;
    s.failure = reason ? { reason: reason, tick: s.tick, destroyedVillageIds: s.cells.filter(function (c) {
      return c.terrain === 'village' && c.status === 'destroyed';
    }).map(function (c) { return c.id; }), standing: s.forest.standing, minimum: s.forest.minimum } : null;
    s.message = reason === 'village' ? '火进入村落：需要更早截断传播路径'
      : reason === 'forest' ? '存活林木不足：燃烧和主动清理都会减少森林'
      : reason === 'timeout' ? '时间结束时仍有火点，防火任务未完成'
      : '余火全部熄灭，村落安全且森林保留达标';
    totals(s); emit(s, s.phase, { reason: s.lostReason });
  }
  function checkEnd(s) {
    if (s.villages.destroyed) finish(s, 'village');
    else if (s.forest.standing < s.forest.minimum) finish(s, 'forest');
    else if (!s.forest.burning) finish(s, null);
    else if (s.tick >= s.timeLimit * HZ) finish(s, 'timeout');
  }
  function cellState(cell) { return { status: cell.status, heat: cell.heat, fuelRemaining: cell.fuelRemaining }; }
  function combustible(cell) {
    return (cell.terrain === 'forest' && cell.status === 'standing') || (cell.terrain === 'village' && cell.status === 'intact');
  }
  function propagate(s) {
    var step = s.fireStep + 1, wind = windFor(s, step), vector = DIRECTIONS[wind];
    var oldFire = s.cells.filter(function (c) { return c.terrain === 'forest' && c.status === 'burning'; });
    var heat = s.cells.map(function () { return 0; }), contributions = [], changes = [], ignited = [], out = [], destroyed = [];
    // All sources and eligible targets still have their pre-wave statuses here.
    oldFire.forEach(function (source) {
      Object.keys(DIRECTIONS).forEach(function (direction) {
        var d = DIRECTIONS[direction], x = source.column + d[0], y = source.row + d[1];
        if (x < 0 || y < 0 || x >= s.columns || y >= s.rows) return;
        var target = s.cells[y * s.columns + x]; if (!combustible(target)) return;
        var dot = d[0] * vector[0] + d[1] * vector[1], amount = dot === 1 ? 3 : dot === -1 ? 1 : 2;
        heat[y * s.columns + x] += amount;
        contributions.push({ from: source.id, to: target.id, direction: direction, amount: amount });
      });
    });
    // Commit the precomputed targets. New flames never join oldFire this wave.
    s.cells.forEach(function (cell, index) {
      if (!heat[index]) return;
      var before = cellState(cell); cell.heat = Math.min(HEAT_LIMIT, cell.heat + heat[index]);
      if (cell.heat === HEAT_LIMIT) {
        if (cell.terrain === 'forest') { cell.status = 'burning'; ignited.push(cell.id); }
        else { cell.status = 'destroyed'; destroyed.push(cell.id); }
      }
      changes.push({ id: cell.id, before: before, after: cellState(cell), addedHeat: heat[index] });
    });
    oldFire.forEach(function (cell) {
      var before = cellState(cell); cell.fuelRemaining--; s.fuel.burned++;
      if (cell.fuelRemaining === 0) { cell.status = 'burnt'; cell.heat = 0; out.push(cell.id); }
      changes.push({ id: cell.id, before: before, after: cellState(cell), addedHeat: 0 });
    });
    s.fireStep = step; s.lastWind = wind;
    s.lastWave = { step: step, fromTick: s.tick - 1, toTick: s.tick, previousWaveTick: s.tick - WAVE_TICKS,
      wind: wind, oldBurningIds: oldFire.map(function (c) { return c.id; }), contributions: contributions, changes: changes,
      ignitedIds: ignited, burntOutIds: out, destroyedVillageIds: destroyed, fuelConsumed: oldFire.length };
    emit(s, 'fire-step', { step: step, wind: wind, oldBurningIds: s.lastWave.oldBurningIds.slice(),
      ignitedIds: ignited.slice(), burntOutIds: out.slice(), destroyedVillageIds: destroyed.slice() });
    if (ignited.length || destroyed.length) s.message = '火线推进：先看风向与残热，再决定清理位置';
    else s.message = '本轮火势更新；留意下一步风向，等待余火自然熄灭';
  }
  function operation(s, type, details) {
    s.lastOperation = Object.assign({}, details || {}, { id: ++s.commandCount, type: type, tick: s.tick, at: s.elapsed });
    emit(s, 'command', { commandId: s.commandCount, operation: clone(s.lastOperation) });
  }
  function clear(s) {
    var cell = s.cells[s.cursor.row * s.columns + s.cursor.column];
    var reason = cell.terrain !== 'forest' || cell.status !== 'standing' ? 'not-standing-forest' : s.ap.remaining < 1 ? 'no-ap' : null;
    if (reason) {
      s.blockedCommands++; s.lastRejected = { tick: s.tick, cellId: cell.id, reason: reason };
      s.message = reason === 'no-ap' ? '行动点已用完；仍可查看风向与热力图' : '只能清理尚未燃烧的林格；村落与火点不能清理';
      emit(s, 'blocked', clone(s.lastRejected)); return;
    }
    var before = cellState(cell), apBefore = s.ap.remaining;
    s.fuel.cleared += cell.fuelRemaining; cell.status = 'cleared'; cell.heat = 0; cell.fuelRemaining = 0;
    s.ap.remaining--; s.ap.spent++; s.clearCount++;
    operation(s, 'clear', { cellId: cell.id, before: before, after: cellState(cell), apBefore: apBefore, apAfter: s.ap.remaining });
    s.clearReceipts.push(clone(s.lastOperation));
    s.message = '已清理一格：形成防火带，但该格不再计入存活森林';
  }
  function direction(input) {
    var x = Number.isFinite(input.x) ? clamp(input.x, -1, 1) : 0, y = Number.isFinite(input.y) ? clamp(input.y, -1, 1) : 0;
    if (Math.max(Math.abs(x), Math.abs(y)) < .25) return null;
    return Math.abs(x) >= Math.abs(y) ? (x < 0 ? 'W' : 'E') : (y < 0 ? 'N' : 'S');
  }
  function move(s, dir) {
    if (!dir) { s._heldDirection = null; s._nextMoveTick = 0; return; }
    var fresh = s._heldDirection !== dir;
    if (!fresh && s.tick < s._nextMoveTick) return;
    var d = DIRECTIONS[dir], oldColumn = s.cursor.column, oldRow = s.cursor.row;
    s.cursor.column = clamp(oldColumn + d[0], 0, s.columns - 1); s.cursor.row = clamp(oldRow + d[1], 0, s.rows - 1);
    s._heldDirection = dir; s._nextMoveTick = s.tick + (fresh ? 20 : 10);
    if (s.cursor.column !== oldColumn || s.cursor.row !== oldRow) emit(s, 'cursor', { column: s.cursor.column, row: s.cursor.row });
  }
  function tick(s, dir) {
    // Label the newly completed tick; its input effects precede its fire wave.
    s.tick++; s.elapsed = s.tick / HZ;
    var a = s._pendingA, b = s._pendingB; s._pendingA = s._pendingB = false;
    if (b) {
      if (!dir) { s._heldDirection = null; s._nextMoveTick = 0; }
      s.viewHeat = !s.viewHeat; operation(s, 'view', { viewHeat: s.viewHeat }); s.message = s.viewHeat ? '热力图：显示当前累积热量，达到5即起火' : '林地视图：方向选格，A清理，B查看残热';
    }
    else { move(s, dir); if (a) clear(s); }
    if (s.tick % WAVE_TICKS === 0) propagate(s);
    totals(s); checkEnd(s);
  }
  function create(seed, difficulty) {
    var index = Number.isFinite(difficulty) ? clamp(Math.floor(difficulty), 0, 2) : 0, level = LEVELS[index], cells = [];
    level.rows.forEach(function (row, y) { Array.from(row).forEach(function (token, x) {
      var terrain = token === 'F' || token === 'X' ? 'forest' : token === 'V' ? 'village' : token === '~' ? 'wetland' : 'ground';
      var initial = token === 'X' ? level.ignitions.find(function (i) { return i.x === x && i.y === y; }).fuel : terrain === 'forest' ? 3 : 0;
      cells.push({ id: 'C' + cells.length, row: y, column: x, terrain: terrain, initialFuel: initial,
        status: token === 'X' ? 'burning' : terrain === 'forest' ? 'standing' : terrain === 'village' ? 'intact' : 'inert',
        heat: token === 'X' ? HEAT_LIMIT : 0, fuelRemaining: initial });
    }); });
    var forestCount = cells.filter(function (c) { return c.terrain === 'forest'; }).length;
    var s = { width: 960, height: 540, seed: Number.isFinite(seed) ? seed : 1, difficulty: index, level: index + 1,
      levelName: level.name, levelNameEn: level.nameEn, columns: level.rows[0].length, rows: level.rows.length,
      authoredMap: level.rows.slice(), authoredIgnitions: clone(level.ignitions), cells: cells,
      cursor: { column: level.cursor[0], row: level.cursor[1] }, viewHeat: false,
      ap: { initial: level.ap, remaining: level.ap, spent: 0 },
      forest: { initial: forestCount, minimum: Math.floor((7 * forestCount + 9) / 10), numerator: 7, denominator: 10 },
      villages: { initial: cells.filter(function (c) { return c.terrain === 'village'; }).length, intact: 0, destroyed: 0 },
      fuel: { initial: cells.reduce(function (n, c) { return n + c.initialFuel; }, 0), remaining: 0, burned: 0, cleared: 0, error: 0 },
      physics: { tickHz: HZ, fireStepTicks: WAVE_TICKS, ignitionHeat: HEAT_LIMIT, downwindHeat: 3, crosswindHeat: 2, upwindHeat: 1, ordinaryFuel: 3 },
      weather: clone(level.weather), fireStep: 0, lastWind: null, nextWind: null, nextFireTick: WAVE_TICKS, secondsToFireStep: 2, lastWave: null,
      phase: 'playing', tick: 0, elapsed: 0, remaining: 90, timeLimit: 90, score: 0, lostReason: null, failure: null,
      message: '方向选择林格；A清理，B热力图。燃烧和清理都会减少存活森林',
      commandCount: 0, blockedCommands: 0, clearCount: 0, clearReceipts: [], lastOperation: null, lastRejected: null,
      eventCount: 0, events: [], lastEvent: null,
      _accumulator: 0, _lastA: false, _lastB: false, _pendingA: false, _pendingB: false,
      _heldDirection: null, _nextMoveTick: 0, _cancelEpoch: null };
    totals(s); return s;
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing') return s;
    input = input || {}; dt = Number.isFinite(dt) ? clamp(dt, 0, .25) : 0;
    var cancelled = !!input.cancelled;
    if (Number.isFinite(input.cancelEpoch)) {
      if (s._cancelEpoch !== null && s._cancelEpoch !== input.cancelEpoch) cancelled = true;
      s._cancelEpoch = input.cancelEpoch;
    }
    var a = !!input.a, b = !!input.b;
    if (cancelled) { s._pendingA = s._pendingB = false; s._heldDirection = null; s._nextMoveTick = 0; }
    else {
      if ((a && !s._lastA) || input.aPressed) s._pendingA = true;
      if ((b && !s._lastB) || input.bPressed) s._pendingB = true;
    }
    s._lastA = a; s._lastB = b; s.events = []; s._accumulator += dt;
    var dir = cancelled ? null : direction(input);
    while (s._accumulator + 1e-10 >= DT && s.phase === 'playing') {
      s._accumulator = Math.max(0, s._accumulator - DT); tick(s, dir);
    }
    if (s.events.length > 256) s.events = s.events.slice(-256);
    return s;
  }
  return { create: create, step: step, TICK_HZ: HZ };
}));
