/* Public deterministic rules for Parallax Skyline; no solver or hidden route. */
(function (root) {
  'use strict';
  function frozen(value) {
    if (value && typeof value === 'object') Object.values(value).forEach(frozen);
    return Object.freeze(value);
  }
  const config = frozen({
    defaultSeed: 741, columns: 20, maxHeight: 6, scales: [2, 1], offsets: [[0, 0], [-4, -1]],
    bounds: [[2, 5], [4, 14]], focusNames: ['NEAR', 'FAR', 'VIEW'], attemptLimit: 4,
    historyLimit: 32, maxCounter: 2147483647, maxElapsed: 3600,
    tasks: [
      { id: 'courtyard', name: 'COURTYARD', nameZh: '庭院遮挡',
        profiles: [[2, 4, 5, 4, 2], [1, 3, 2, 3, 1]], initialPositions: [5, 4],
        targets: [[0,0,0,0,0,0,2,2,4,4,5,5,4,4,2,2,0,0,0,0],
          [0,0,2,2,4,4,5,5,4,4,2,3,1,0,0,0,0,0,0,0]],
        landmarks: [{layer:0,localColumn:2,column:10,height:5}, {layer:1,localColumn:3,column:11,height:3}] },
      { id: 'riverfront', name: 'RIVERFRONT', nameZh: '河岸交错',
        profiles: [[3, 5, 3, 6, 2], [2, 4, 5, 2, 4]], initialPositions: [2, 13],
        targets: [[0,0,0,0,0,0,2,4,5,3,5,5,3,3,6,6,2,2,0,0],
          [0,0,0,0,3,3,5,5,3,4,6,6,2,2,0,0,0,0,0,0]],
        landmarks: [{layer:0,localColumn:3,column:14,height:6}, {layer:1,localColumn:4,column:9,height:4}] },
      { id: 'twin-spires', name: 'TWIN SPIRES', nameZh: '双塔视差',
        profiles: [[2, 6, 3, 5, 4], [4, 2, 6, 3, 2]], initialPositions: [5, 4],
        targets: [[0,0,0,0,2,2,6,6,3,3,5,5,4,4,6,3,2,0,0,0],
          [2,2,6,6,3,3,5,5,4,4,0,4,2,6,3,2,0,0,0,0]],
        landmarks: [{layer:0,localColumn:1,column:6,height:6}, {layer:1,localColumn:2,column:13,height:6}] }
    ]
  });

  function projections(level, positions) {
    const task = config.tasks[level];
    return config.offsets.map(offset => {
      const heights = Array(config.columns).fill(0), owners = Array(config.columns).fill(-1);
      for (let layer = 0; layer < 2; layer++) {
        const scale = config.scales[layer];
        for (let j = 0; j < 5; j++) for (let k = 0; k < scale; k++) {
          const column = scale * (positions[layer] + j) + offset[layer] + k;
          const height = task.profiles[layer][j];
          if (height > heights[column] || (height > 0 && height === heights[column] && layer === 0)) {
            heights[column] = height; owners[column] = layer;
          }
        }
      }
      return {heights, owners};
    }).map((view, v) => {
      const target = task.landmarks[v], layer = target.layer, localColumn = target.localColumn;
      const column = config.scales[layer] * (positions[layer] + localColumn) + config.offsets[v][layer];
      const height = task.profiles[layer][localColumn];
      const visible = view.owners[column] === layer && view.heights[column] === height;
      return {heights:view.heights, owners:view.owners,
        silhouetteMatched:view.heights.every((h, j) => h === task.targets[v][j]),
        anchor:{layer, localColumn, column, height, visible,
          matched:visible && column === target.column && height === target.height}};
    });
  }

  function create(seed, level) {
    seed = Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed;
    level = Number.isInteger(level) && level >= 0 && level < 3 ? level : 0;
    const positions = config.tasks[level].initialPositions.slice();
    return {schema:1, seed, level, phase:'playing', reason:'', positions, focus:0, view:0,
      views:projections(level, positions), undoStack:[], failures:0, score:0, submissions:[],
      calls:0, moves:0, undos:0, viewChanges:0, focusChanges:0, elapsed:0,
      counterSaturated:false, clockSaturated:false, inputArmed:false, cancelEpoch:null,
      cancelledLast:false, lastHeld:{a:false,b:false,direction:'none'}, lastCommand:'none', events:[],
      message:'上下选近层、远层或视角，左右调整；A 验收，B 撤销。'};
  }

  function normalized(input) {
    let data = {};
    try {
      if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
        for (const key of ['x','y','a','b','cancelled','paused','cancelEpoch']) {
          const descriptor = Object.getOwnPropertyDescriptor(input, key);
          if (descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')) data[key] = descriptor.value;
        }
      }
    } catch (_) { data = {}; }
    const axis = key => Number.isFinite(data[key]) ? Math.max(-1, Math.min(1, data[key])) : 0;
    const x = axis('x'), y = axis('y'), ax = Math.abs(x), ay = Math.abs(y);
    let direction = 'none';
    if (ax > 0.5 || ay > 0.5) direction = ay >= ax ? (y > 0 ? 'down' : 'up') : (x > 0 ? 'right' : 'left');
    return {a:data.a === true, b:data.b === true, cancelled:data.cancelled === true,
      paused:data.paused === true, direction,
      epoch:Number.isSafeInteger(data.cancelEpoch) && data.cancelEpoch >= 0 ? data.cancelEpoch : null};
  }

  function increment(state, key) {
    const value = state[key] + 1;
    if (value > config.maxCounter) state.counterSaturated = true;
    state[key] = Math.min(config.maxCounter, value);
  }
  function emit(state, event) { state.events = [Object.assign(event, {call:state.calls})]; }
  function ready(state) { return state.views.every(v => v.silhouetteMatched && v.anchor.matched); }
  function changed(state, message) {
    state.views = projections(state.level, state.positions);
    state.message = ready(state) ? '两处轮廓与地标都已对齐，按 A 验收。' : message;
  }
  function submit(state) {
    state.views = projections(state.level, state.positions);
    const checks = state.views.map(v => ({silhouette:v.silhouetteMatched, anchor:v.anchor.matched}));
    const matched = checks.every(c => c.silhouette && c.anchor);
    if (matched) {
      state.phase = 'won'; state.score = 100;
      state.message = '两处轮廓与可见地标全部通过验收。'; emit(state, {type:'win'});
    } else {
      state.failures++;
      if (state.failures === config.attemptLimit) {
        state.phase = 'lost'; state.reason = 'attempts';
        state.message = '四次错误验收已用完，请重试。'; emit(state, {type:'collision',reason:'attempts'});
      } else {
        const bad = checks.findIndex(c => !c.silhouette || !c.anchor);
        state.message = '观察点 ' + bad + (checks[bad].silhouette ? ' 的地标被遮挡或位置不符。' : ' 的轮廓不符。') + '剩余容错 ' + (4 - state.failures) + '。';
        emit(state, {type:'reject'});
      }
    }
    state.submissions.push({index:state.submissions.length, call:state.calls, elapsed:state.elapsed,
      positions:state.positions.slice(), checks, matched, failuresAfter:state.failures,
      attemptsLeft:config.attemptLimit - state.failures});
  }

  function step(state, dt, input) {
    if (state.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) return state;
    const sample = normalized(input);
    if (sample.paused) return state;
    state.events = []; state.lastCommand = 'none'; increment(state, 'calls');
    const nextElapsed = state.elapsed + dt;
    if (nextElapsed > config.maxElapsed) state.clockSaturated = true;
    state.elapsed = Math.min(config.maxElapsed, nextElapsed);
    if ((sample.epoch !== null && state.cancelEpoch !== null && sample.epoch !== state.cancelEpoch) ||
        (sample.cancelled && !state.cancelledLast)) state.inputArmed = false;
    if (sample.epoch !== null) state.cancelEpoch = sample.epoch;
    state.cancelledLast = sample.cancelled;
    let command = 'none';
    if (state.inputArmed && !sample.cancelled) {
      if (sample.b && !state.lastHeld.b) command = 'b';
      else if (sample.a && !state.lastHeld.a) command = 'a';
      else if (sample.direction !== 'none' && sample.direction !== state.lastHeld.direction) command = sample.direction;
    }
    state.lastHeld = {a:sample.a,b:sample.b,direction:sample.direction};
    if (!sample.cancelled && !sample.a && !sample.b && sample.direction === 'none') state.inputArmed = true;
    state.lastCommand = command;
    if (command === 'up' || command === 'down') {
      state.focus = (state.focus + (command === 'up' ? 2 : 1)) % 3;
      increment(state, 'focusChanges'); state.message = '已选择' + ['近层','远层','视角'][state.focus] + '，左右调整。';
      emit(state, {type:'focus',focus:state.focus});
    } else if (command === 'left' || command === 'right') {
      if (state.focus === 2) {
        const view = command === 'left' ? 0 : 1;
        if (view !== state.view) { state.view = view; increment(state, 'viewChanges'); emit(state, {type:'view',view}); }
        state.message = '观察点 ' + view + ' 已高亮；建筑位置保持不变。';
      } else {
        const layer = state.focus, from = state.positions[layer], to = from + (command === 'left' ? -1 : 1);
        if (to < config.bounds[layer][0] || to > config.bounds[layer][1]) state.message = '已到' + (layer ? '远层' : '近层') + '轨道边界。';
        else {
          state.undoStack.push(state.positions.slice());
          if (state.undoStack.length > config.historyLimit) state.undoStack.shift();
          state.positions[layer] = to; increment(state, 'moves');
          changed(state, (layer ? '远层' : '近层') + '已移动，核对两个观察点后再验收。');
          emit(state, {type:'move',layer,from,to});
        }
      }
    } else if (command === 'b') {
      if (!state.undoStack.length) state.message = '没有可撤销的位移。';
      else {
        state.positions = state.undoStack.pop().slice(); increment(state, 'undos');
        changed(state, '已恢复上一次位移前的近远层位置；错误验收不退回。'); emit(state, {type:'undo'});
      }
    } else if (command === 'a') submit(state);
    return state;
  }
  const api = Object.freeze({create, step, config});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis === 'object' ? globalThis : this);
