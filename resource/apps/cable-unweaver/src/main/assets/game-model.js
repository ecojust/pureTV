/* Cable Unweaver: exact segment geometry and discrete rigid rail movement. */
(function (root, factory) {
  'use strict';
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.PureModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function deepFreeze(value) {
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(key => deepFreeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }

  const config = deepFreeze({
    defaultSeed: 743,
    board: { minX: -2, maxX: 10, minY: 0, maxY: 10 },
    maxCounter: 2147483647,
    maxElapsed: 3600,
    tasks: [
      {
        id: 'straight-rack', name: 'STRAIGHT RACK', nameZh: '直排接线', budget: 18,
        fixed: [
          { id: 'P', position: { x: 0, y: 2 } },
          { id: 'Q', position: { x: 0, y: 5 } },
          { id: 'R', position: { x: 0, y: 8 } }
        ],
        terminals: [
          { id: 'a', group: 0, offset: 0, rail: { axis: 'y', fixed: 10, min: 1, max: 9 } },
          { id: 'b', group: 1, offset: 0, rail: { axis: 'y', fixed: 10, min: 1, max: 9 } },
          { id: 'c', group: 2, offset: 0, rail: { axis: 'y', fixed: 10, min: 1, max: 9 } }
        ],
        groups: [
          { id: 'ga', initial: 8, guideNode: 'P' },
          { id: 'gb', initial: 5, guideNode: 'Q' },
          { id: 'gc', initial: 2, guideNode: 'R' }
        ],
        edges: [
          { id: 'e0', from: 'P', to: 'a' },
          { id: 'e1', from: 'Q', to: 'b' },
          { id: 'e2', from: 'R', to: 'c' }
        ]
      },
      {
        id: 'coupled-fan', name: 'COUPLED FAN', nameZh: '联动分线', budget: 16,
        fixed: [
          { id: 'H', position: { x: 0, y: 3 } },
          { id: 'K', position: { x: 0, y: 8 } }
        ],
        terminals: [
          { id: 'a', group: 0, offset: 0, rail: { axis: 'y', fixed: 10, min: 1, max: 8 } },
          { id: 'b', group: 0, offset: 2, rail: { axis: 'y', fixed: 10, min: 3, max: 9 } },
          { id: 'c', group: 1, offset: 0, rail: { axis: 'y', fixed: 10, min: 1, max: 9 } }
        ],
        groups: [
          { id: 'gAB', initial: 6, guideNode: 'H' },
          { id: 'gC', initial: 2, guideNode: 'K' }
        ],
        edges: [
          { id: 'e0', from: 'H', to: 'a' },
          { id: 'e1', from: 'H', to: 'b' },
          { id: 'e2', from: 'K', to: 'c' }
        ]
      },
      {
        id: 'staggered-clamp', name: 'STAGGERED CLAMP', nameZh: '错层线夹', budget: 16,
        fixed: [
          { id: 'H', position: { x: 0, y: 0 } },
          { id: 'K', position: { x: 8, y: 0 } }
        ],
        terminals: [
          { id: 'a', group: 0, offset: 0, rail: { axis: 'x', fixed: 6, min: -2, max: 4 } },
          { id: 'b', group: 0, offset: 2, rail: { axis: 'x', fixed: 10, min: 0, max: 7 } },
          { id: 'c', group: 1, offset: 0, rail: { axis: 'x', fixed: 10, min: -1, max: 9 } }
        ],
        groups: [
          { id: 'gAB', initial: 3, guideNode: 'H' },
          { id: 'gC', initial: -1, guideNode: 'K' }
        ],
        edges: [
          { id: 'e0', from: 'H', to: 'a' },
          { id: 'e1', from: 'H', to: 'b' },
          { id: 'e2', from: 'K', to: 'c' }
        ]
      }
    ]
  });

  const copyPoint = point => ({ x: point.x, y: point.y });
  const samePoint = (a, b) => a.x === b.x && a.y === b.y;
  const worldPoint = (axis, varying, fixed) => axis === 'x'
    ? { x: varying, y: fixed } : { x: fixed, y: varying };
  const orient = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const opposite = (a, b) => (a < 0 && b > 0) || (a > 0 && b < 0);
  const onSegment = (a, b, p) => orient(a, b, p) === 0
    && p.x >= Math.min(a.x, b.x) && p.x <= Math.max(a.x, b.x)
    && p.y >= Math.min(a.y, b.y) && p.y <= Math.max(a.y, b.y);

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) { const remainder = a % b; a = b; b = remainder; }
    return a;
  }

  function rationalIntersection(a, b, c, d) {
    const rx = b.x - a.x, ry = b.y - a.y;
    const sx = d.x - c.x, sy = d.y - c.y;
    let den = rx * sy - ry * sx;
    const tNum = (c.x - a.x) * sy - (c.y - a.y) * sx;
    let xNum = a.x * den + rx * tNum, yNum = a.y * den + ry * tNum;
    if (den < 0) { den = -den; xNum = -xNum; yNum = -yNum; }
    const divisor = gcd(gcd(xNum, yNum), den);
    return { xNum: xNum === 0 ? 0 : xNum / divisor,
      yNum: yNum === 0 ? 0 : yNum / divisor, den: den / divisor };
  }

  function classifyPair(first, second) {
    const a = first.a, b = first.b, c = second.a, d = second.b;
    if (samePoint(a, b) || samePoint(c, d)) return null;
    const o1 = orient(a, b, c), o2 = orient(a, b, d);
    const o3 = orient(c, d, a), o4 = orient(c, d, b);
    const shared = first.from === second.from || first.from === second.to
      || first.to === second.from || first.to === second.to;
    if (o1 === 0 && o2 === 0 && o3 === 0 && o4 === 0) {
      const axis = a.x !== b.x ? 'x' : 'y';
      const low = Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis]));
      const high = Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis]));
      if (low > high) return null;
      const endpoints = [a, b, c, d];
      const start = endpoints.find(point => point[axis] === low);
      if (low < high) {
        const end = endpoints.find(point => point[axis] === high);
        const overlap = [copyPoint(start), copyPoint(end)]
          .sort((left, right) => left.x - right.x || left.y - right.y);
        return { kind: 'overlap', point: null, overlap };
      }
      if (shared) return null;
      return { kind: 'touch', point: { xNum: start.x, yNum: start.y, den: 1 }, overlap: null };
    }
    const intersects = (opposite(o1, o2) && opposite(o3, o4))
      || (o1 === 0 && onSegment(a, b, c)) || (o2 === 0 && onSegment(a, b, d))
      || (o3 === 0 && onSegment(c, d, a)) || (o4 === 0 && onSegment(c, d, b));
    if (!intersects || shared) return null;
    return { kind: o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0 ? 'cross' : 'touch',
      point: rationalIntersection(a, b, c, d), overlap: null };
  }

  function deriveGeometry(task, positions) {
    const nodes = task.fixed.map(node => ({ id: node.id, position: copyPoint(node.position),
      terminalIndex: null, groupIndex: null }));
    task.terminals.forEach((terminal, index) => {
      nodes.push({ id: terminal.id,
        position: worldPoint(terminal.rail.axis, positions[terminal.group] + terminal.offset, terminal.rail.fixed),
        terminalIndex: index, groupIndex: terminal.group });
    });
    const byId = new Map(nodes.map(node => [node.id, node]));
    const rails = task.terminals.map(terminal => ({ terminal: terminal.id, axis: terminal.rail.axis,
      start: worldPoint(terminal.rail.axis, terminal.rail.min, terminal.rail.fixed),
      end: worldPoint(terminal.rail.axis, terminal.rail.max, terminal.rail.fixed),
      min: terminal.rail.min, max: terminal.rail.max, fixed: terminal.rail.fixed }));
    const groups = task.groups.map((group, index) => {
      const members = task.terminals.filter(terminal => terminal.group === index);
      const axis = members[0].rail.axis;
      const current = members.reduce((sum, member) => sum + byId.get(member.id).position[axis], 0);
      const reference = byId.get(group.guideNode).position[axis];
      const error = current - members.length * reference;
      return { id: group.id, axis, members: members.map(member => member.id), position: positions[index],
        min: Math.max(...members.map(member => member.rail.min - member.offset)),
        max: Math.min(...members.map(member => member.rail.max - member.offset)), guideNode: group.guideNode,
        guideCurrentNumerator: current, guideDenominator: members.length, guideReference: reference,
        guideErrorNumerator: error, guideAligned: error === 0 };
    });
    const segments = task.edges.map(edge => ({ id: edge.id, from: edge.from, to: edge.to,
      a: copyPoint(byId.get(edge.from).position), b: copyPoint(byId.get(edge.to).position) }));
    const conflicts = [];
    for (let i = 0; i < segments.length; i += 1) {
      for (let j = i + 1; j < segments.length; j += 1) {
        const conflict = classifyPair(segments[i], segments[j]);
        if (conflict) conflicts.push({ edges: [segments[i].id, segments[j].id], ...conflict });
      }
    }
    const affected = new Set(conflicts.flatMap(conflict => conflict.edges));
    const coincidentNodes = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (samePoint(nodes[i].position, nodes[j].position)) coincidentNodes.push([nodes[i].id, nodes[j].id]);
      }
    }
    const zeroLengthEdges = segments.filter(segment => samePoint(segment.a, segment.b)).map(segment => segment.id);
    const railViolations = task.terminals.filter(terminal => {
      const coordinate = byId.get(terminal.id).position[terminal.rail.axis];
      return !Number.isInteger(coordinate) || coordinate < terminal.rail.min || coordinate > terminal.rail.max;
    }).map(terminal => terminal.id);
    const railsValid = railViolations.length === 0;
    return { nodes, rails, groups, segments, conflicts,
      conflictEdgeIds: segments.filter(segment => affected.has(segment.id)).map(segment => segment.id),
      conflictCount: conflicts.length, coincidentNodes, zeroLengthEdges, railViolations, railsValid,
      matched: railsValid && conflicts.length === 0 && coincidentNodes.length === 0 && zeroLengthEdges.length === 0 };
  }

  function create(seed, level) {
    seed = Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed;
    level = Number.isInteger(level) && level >= 0 && level < config.tasks.length ? level : 0;
    const positions = config.tasks[level].groups.map(group => group.initial);
    return {
      schema: 1, seed, level, phase: 'playing', reason: '', score: 0, positions, selected: 0,
      geometry: deriveGeometry(config.tasks[level], positions), movesUsed: 0, moves: [],
      calls: 0, selectionChanges: 0, blockedMoves: 0, elapsed: 0,
      counterSaturated: false, clockSaturated: false, inputArmed: false, cancelEpoch: null,
      cancelledLast: false, lastHeld: { a: false, b: false, direction: 'none' },
      lastCommand: 'none', events: [], message: 'A、B选择端子，方向沿轨道移动；消除线冲突和端子重合。'
    };
  }

  function normalizeInput(input) {
    const neutral = () => ({ a: false, b: false, cancelled: false, paused: false, x: 0, y: 0, cancelEpoch: null });
    try {
      if (input === null || typeof input !== 'object' || Array.isArray(input)) return neutral();
      const values = Object.create(null);
      for (const key of ['a', 'b', 'cancelled', 'paused', 'x', 'y', 'cancelEpoch']) {
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        if (descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')) values[key] = descriptor.value;
      }
      const axis = value => typeof value === 'number' && Number.isFinite(value)
        ? Math.max(-1, Math.min(1, value)) : 0;
      return { a: values.a === true, b: values.b === true, cancelled: values.cancelled === true,
        paused: values.paused === true, x: axis(values.x), y: axis(values.y),
        cancelEpoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null };
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

  function step(state, dt, input) {
    if (state.phase === 'won' || state.phase === 'lost') return state;
    if (typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) return state;
    const normalized = normalizeInput(input);
    if (normalized.paused) return state;
    const direction = directionOf(normalized), previous = state.lastHeld;
    state.events = [];
    state.lastCommand = 'none';
    increment(state, 'calls');
    const elapsed = state.elapsed + dt;
    if (elapsed > config.maxElapsed) state.clockSaturated = true;
    state.elapsed = Math.min(config.maxElapsed, elapsed);
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

    const task = config.tasks[state.level];
    if (command === 'a' || command === 'b') {
      state.selected = (state.selected + (command === 'a' ? 1 : task.terminals.length - 1)) % task.terminals.length;
      increment(state, 'selectionChanges');
      const selected = task.terminals[state.selected];
      state.events = [{ type: 'select', terminal: selected.id, group: task.groups[selected.group].id, call: state.calls }];
      state.message = '已选择端子 ' + selected.id.toUpperCase() + '；方向沿轨道移动整组。';
      return state;
    }

    const terminal = task.terminals[state.selected], group = task.groups[terminal.group];
    const horizontal = command === 'left' || command === 'right';
    if (horizontal !== (terminal.rail.axis === 'x')) {
      state.message = terminal.rail.axis === 'x' ? '这条轨道只能左右移动。' : '这条轨道只能上下移动。';
      return state;
    }
    const requested = command === 'left' || command === 'up' ? -1 : 1;
    const members = task.terminals.filter(member => member.group === terminal.group);
    let low = -Infinity, high = Infinity;
    members.forEach(member => {
      const current = state.positions[terminal.group] + member.offset;
      low = Math.max(low, member.rail.min - current);
      high = Math.min(high, member.rail.max - current);
    });
    const delta = Math.max(low, Math.min(high, requested));
    if (delta === 0) {
      increment(state, 'blockedMoves');
      const limiting = members.filter(member => state.positions[terminal.group] + member.offset
        === (requested < 0 ? member.rail.min : member.rail.max)).map(member => member.id);
      state.events = [{ type: 'blocked', terminal: terminal.id, group: group.id, requested, limiting, call: state.calls }];
      state.message = '整组已到轨道止挡；端子 ' + limiting.join('、').toUpperCase() + ' 限制移动，本次不耗调整。';
      return state;
    }

    const fromPositions = state.positions.slice();
    state.positions = state.positions.slice();
    state.positions[terminal.group] += delta;
    state.movesUsed += 1;
    state.geometry = deriveGeometry(task, state.positions);
    if (state.geometry.matched) {
      state.phase = 'won'; state.reason = ''; state.score = 100;
      state.events = [{ type: 'win', call: state.calls }];
      state.message = '接线合格！所有线冲突与端子重合已消除。';
    } else if (state.movesUsed === task.budget) {
      state.phase = 'lost'; state.reason = 'budget'; state.score = 0;
      state.events = [{ type: 'collision', reason: 'budget', call: state.calls }];
      state.message = '调整次数用尽；重新开始，观察锚点与线夹中心。';
    } else {
      state.events = [{ type: 'move', terminal: terminal.id, group: group.id, delta, call: state.calls }];
      state.message = '整组移动完成；还可调整 ' + (task.budget - state.movesUsed) + ' 次。';
    }
    state.moves.push({ index: state.moves.length, call: state.calls, elapsed: state.elapsed,
      terminal: terminal.id, group: group.id, axis: terminal.rail.axis, delta, fromPositions,
      toPositions: state.positions.slice(), conflictCount: state.geometry.conflictCount,
      nodeCollisionCount: state.geometry.coincidentNodes.length, zeroLengthCount: state.geometry.zeroLengthEdges.length,
      railsValid: state.geometry.railsValid, matched: state.geometry.matched,
      remaining: task.budget - state.movesUsed, phase: state.phase });
    return state;
  }

  // SYNTHETIC_MATH_TEST_SEAM: production exports remain create/step/config.
  return Object.freeze({ create, step, config });
});
