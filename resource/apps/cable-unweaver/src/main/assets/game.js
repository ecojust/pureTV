(function (root) {
  'use strict';
  var config = root.PureModel.config;
  var C = { background: '#111d24', text: '#edf3e9', muted: '#aebfc2', quiet: '#17272e',
    frame: '#41555d', rail: '#71858a', selected: '#f4d78e', good: '#9ce3c0', bad: '#ff8d7e',
    wires: ['#68cddd', '#e8b968', '#b7a4eb'], guides: ['#91c1c8', '#c9b790', '#b9b2d0'] };

  function rounded(ctx, x, y, w, h, radius, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function portPainter(fixed) {
    return function (ctx, width, height, art) {
      var cx = width / 2, cy = height / 2;
      art.ellipse(ctx, cx, cy + 4, 42, 42, 'rgba(0,0,0,.38)');
      art.ellipse(ctx, cx, cy, 39, 39, art.linear(ctx, 16, 10, 78, 87,
        [[0, '#e0e6df'], [.28, '#9db1b4'], [.49, '#405761'], [.74, '#839b9f'], [1, '#243c47']]));
      art.ellipse(ctx, cx, cy, 32, 32, '#152a33');
      art.ellipse(ctx, cx, cy, 27, 27, art.radial(ctx, cx, cy, 29,
        [[0, '#7c9b9d'], [.62, '#37545c'], [1, '#1b333e']], cx - 9, cy - 10));
      art.ellipse(ctx, cx, cy, 17, 17, art.linear(ctx, 32, 30, 65, 64,
        [[0, '#f6f2d9'], [.38, fixed ? '#bfac83' : '#cbd7d1'], [1, '#4d666d']]));
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.55);
      rounded(ctx, -12, -3, 24, 6, 2, '#29414b', '#c6d4cc'); ctx.restore();
      [0, 1, 2, 3].forEach(function (i) {
        var angle = Math.PI / 4 + i * Math.PI / 2;
        art.ellipse(ctx, cx + Math.cos(angle) * 34, cy + Math.sin(angle) * 34, 2, 2, '#eef3e5');
      });
    };
  }
  var atlas = { builtins: [], tiles: [
    { name: 'bench', x: 0, y: 0, w: 512, h: 432, paint: function (ctx, width, height, art) {
      ctx.fillStyle = art.linear(ctx, 0, 0, width, height,
        [[0, '#34464c'], [.47, '#24363e'], [1, '#172831']]); ctx.fillRect(0, 0, width, height);
      for (var y = 0; y < height; y += 3) {
        ctx.fillStyle = y % 9 ? 'rgba(218,231,221,.026)' : 'rgba(0,12,19,.10)'; ctx.fillRect(0, y, width, 1);
      }
      for (var x = 12; x < width; x += 31) {
        ctx.fillStyle = 'rgba(8,22,29,.12)'; ctx.fillRect(x, 0, 1, height);
      }
      [[13, 13], [499, 13], [13, 419], [499, 419]].forEach(function (p) {
        art.ellipse(ctx, p[0], p[1], 4, 4, '#162d36'); art.ellipse(ctx, p[0], p[1] - 1, 2.7, 2.7, '#8b9e9f');
        ctx.fillStyle = '#324e58'; ctx.fillRect(p[0] - 2, p[1] - 1.5, 4, 1);
      });
    } },
    { name: 'port', x: 512, y: 0, w: 96, h: 96, paint: portPainter(false) },
    { name: 'anchor', x: 608, y: 0, w: 96, h: 96, paint: portPainter(true) },
    { name: 'endstop', x: 704, y: 0, w: 48, h: 48, paint: function (ctx, width, height, art) {
      rounded(ctx, 6, 14, width - 12, height - 28, 4,
        art.linear(ctx, 0, 14, 0, 34, [[0, '#d4ded7'], [.4, '#788f94'], [1, '#344d58']]), '#203b47');
      [13, 35].forEach(function (x) { art.ellipse(ctx, x, 24, 2.7, 2.7, '#243c46'); art.ellipse(ctx, x, 23, 1.4, 1.4, '#d1ddd7'); });
    } },
    { name: 'brace', x: 512, y: 112, w: 192, h: 48, paint: function (ctx, width, height, art) {
      rounded(ctx, 1, 7, width - 2, height - 14, 10,
        art.linear(ctx, 0, 7, 0, 41, [[0, '#b7c3bd'], [.3, '#788b8d'], [.56, '#516b72'], [1, '#273f48']]), '#182e38');
      rounded(ctx, 23, 19, width - 46, 10, 5, '#3a545d', '#a0b0aa');
      [14, width - 14].forEach(function (x) { art.ellipse(ctx, x, 24, 5, 5, '#cad5cd'); art.ellipse(ctx, x, 24, 2.2, 2.2, '#425b62'); });
    } },
    { name: 'focus', x: 832, y: 0, w: 96, h: 96, paint: function (ctx, width, height, art) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(width / 2, height / 2, 39, 0, Math.PI * 2); ctx.stroke();
      [0, 1, 2, 3].forEach(function (i) {
        var angle = i * Math.PI / 2, x = 48 + Math.cos(angle) * 44, y = 48 + Math.sin(angle) * 44;
        art.ellipse(ctx, x, y, 3.2, 3.2, '#fff');
      });
    } }
  ] };

  function text(r, value, x, y, size, color, width) {
    if (r.measureText(value, size) > width) throw new Error('Cable Unweaver text exceeds width: ' + value);
    r.text(value, x, y, size, color);
  }
  // The same uniform mapping is used by every task and by every geometry layer.
  function screen(p) { return { x: 150 + 28 * p.x, y: 94 + 28 * p.y }; }
  function frame(r, x, y, w, h, color, thick) {
    r.rect(x, y, w, thick, color); r.rect(x, y + h - thick, w, thick, color);
    r.rect(x, y, thick, h, color); r.rect(x + w - thick, y, thick, h, color);
  }
  function ring(r, p, radius, color, width) {
    for (var i = 0; i < 24; i++) {
      var a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12;
      r.line(p.x + Math.cos(a) * radius, p.y + Math.sin(a) * radius,
        p.x + Math.cos(b) * radius, p.y + Math.sin(b) * radius, width || 1.8, color);
    }
  }
  function dashed(r, a, b, color, width) {
    var dx = b.x - a.x, dy = b.y - a.y, length = Math.sqrt(dx * dx + dy * dy);
    if (!length) return;
    for (var d = 0; d < length; d += 11) {
      var end = Math.min(d + 5, length);
      r.line(a.x + dx * d / length, a.y + dy * d / length,
        a.x + dx * end / length, a.y + dy * end / length, width || 1.3, color);
    }
  }
  function nodeMap(geometry) {
    var nodes = Object.create(null); geometry.nodes.forEach(function (node) { nodes[node.id] = node; }); return nodes;
  }
  function center(group, nodes) {
    var p = { x: 0, y: 0 };
    group.members.forEach(function (id) { p.x += nodes[id].position.x; p.y += nodes[id].position.y; });
    p.x /= group.members.length; p.y /= group.members.length; return p;
  }
  function scalar(numerator, denominator) {
    return numerator % denominator === 0 ? String(numerator / denominator) : String(numerator) + '/' + denominator;
  }
  function signed(numerator, denominator) { return (numerator > 0 ? '+' : '') + scalar(numerator, denominator); }
  function groupName(group) { return group.members.join('+'); }

  function guides(r, geometry, nodes, selectedGroup) {
    geometry.groups.forEach(function (group, index) {
      var actual = center(group, nodes), anchor = nodes[group.guideNode].position;
      var reference = group.axis === 'y' ? { x: actual.x, y: group.guideReference } : { x: group.guideReference, y: actual.y };
      var a = screen(anchor), b = screen(reference), c = screen(actual), color = C.guides[index % C.guides.length];
      dashed(r, a, b, color, group === selectedGroup ? 1.6 : 1.1);
      dashed(r, b, c, color, 1.2); ring(r, b, 6, color, 1.4);
      r.line(c.x - 5, c.y, c.x + 5, c.y, 2, color); r.line(c.x, c.y - 5, c.x, c.y + 5, 2, color);
    });
  }
  function rails(r, state, task, selectedGroup) {
    var ordered = state.geometry.rails.slice().sort(function (a, b) {
      return Number(selectedGroup.members.indexOf(a.terminal) >= 0) - Number(selectedGroup.members.indexOf(b.terminal) >= 0);
    });
    ordered.forEach(function (rail) {
      var a = screen(rail.start), b = screen(rail.end), active = selectedGroup.members.indexOf(rail.terminal) >= 0;
      r.line(a.x, a.y, b.x, b.y, 14, '#0c1b23'); r.line(a.x, a.y, b.x, b.y, 9, '#354f5b');
      r.line(a.x, a.y, b.x, b.y, 2, active ? '#9cb7b8' : '#647b82');
    });
    // Draw each member's end stops after every groove, including co-located rails.
    ordered.forEach(function (rail) {
      var a = screen(rail.start), b = screen(rail.end), active = selectedGroup.members.indexOf(rail.terminal) >= 0;
      for (var stop = rail.min; stop <= rail.max; stop++) {
        var p = screen(rail.axis === 'x' ? { x: stop, y: rail.fixed } : { x: rail.fixed, y: stop });
        r.circle(p.x, p.y, 4, '#122934'); r.circle(p.x, p.y, 1.7, active ? '#c0cebd' : '#71878a');
      }
      var angle = rail.axis === 'x' ? Math.PI / 2 : 0;
      r.sprite('endstop', a.x, a.y, 28, 28, angle, '#ffffff'); r.sprite('endstop', b.x, b.y, 28, 28, angle, '#ffffff');
      if (active) {
        var terminal = task.terminals.filter(function (item) { return item.id === rail.terminal; })[0];
        var low = selectedGroup.min + terminal.offset, high = selectedGroup.max + terminal.offset;
        var p0 = screen(rail.axis === 'x' ? { x: low, y: rail.fixed } : { x: rail.fixed, y: low });
        var p1 = screen(rail.axis === 'x' ? { x: high, y: rail.fixed } : { x: rail.fixed, y: high });
        r.line(p0.x, p0.y, p1.x, p1.y, 2.2, C.selected);
      }
    });
  }
  function braces(r, geometry, nodes, selectedGroup) {
    geometry.groups.forEach(function (group) {
      if (group.members.length < 2) return;
      for (var i = 1; i < group.members.length; i++) {
        var a = screen(nodes[group.members[i - 1]].position), b = screen(nodes[group.members[i]].position);
        var dx = b.x - a.x, dy = b.y - a.y, length = Math.sqrt(dx * dx + dy * dy), angle = Math.atan2(dy, dx);
        if (group === selectedGroup) r.line(a.x, a.y, b.x, b.y, 20, '#a4b8ae');
        r.sprite('brace', (a.x + b.x) / 2, (a.y + b.y) / 2, length + 12, 20, angle, '#ffffff');
      }
      var p = screen(center(group, nodes));
      r.circle(p.x, p.y, 6, '#172b35'); r.line(p.x - 5, p.y, p.x + 5, p.y, 2, '#eff1dc');
      r.line(p.x, p.y - 5, p.x, p.y + 5, 2, '#eff1dc');
    });
  }
  function cables(r, geometry) {
    geometry.segments.forEach(function (segment, index) {
      var a = screen(segment.a), b = screen(segment.b), conflict = geometry.conflictEdgeIds.indexOf(segment.id) >= 0;
      var color = C.wires[index % C.wires.length];
      r.line(a.x, a.y, b.x, b.y, 11, conflict ? '#673e40' : '#122731');
      r.circle(a.x, a.y, 5.5, '#122731'); r.circle(b.x, b.y, 5.5, '#122731');
      r.line(a.x, a.y, b.x, b.y, 6.5, color); r.circle(a.x, a.y, 3.25, color); r.circle(b.x, b.y, 3.25, color);
      r.line(a.x, a.y, b.x, b.y, 1.5, 'rgba(239,248,231,.55)');
    });
  }
  function conflictMarks(r, geometry) {
    var seen = Object.create(null);
    geometry.conflicts.forEach(function (conflict) {
      if (conflict.kind === 'overlap') {
        var a = screen(conflict.overlap[0]), b = screen(conflict.overlap[1]);
        var dx = b.x - a.x, dy = b.y - a.y, length = Math.sqrt(dx * dx + dy * dy);
        r.line(a.x, a.y, b.x, b.y, 13, 'rgba(255,141,126,.24)'); r.line(a.x, a.y, b.x, b.y, 3, C.bad);
        if (length) [a, b].forEach(function (p) {
          r.line(p.x - dy * 7 / length, p.y + dx * 7 / length, p.x + dy * 7 / length, p.y - dx * 7 / length, 2.5, C.bad);
        });
        var middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        r.circle(middle.x, middle.y, 12, '#482d34'); ring(r, middle, 12, C.bad, 2);
        r.line(middle.x - 6, middle.y - 3, middle.x + 6, middle.y - 3, 2.5, C.bad);
        r.line(middle.x - 6, middle.y + 3, middle.x + 6, middle.y + 3, 2.5, C.bad);
      } else {
        var value = conflict.point, key = value.xNum + ',' + value.yNum + '/' + value.den;
        if (seen[key]) return; seen[key] = true;
        var p = screen({ x: value.xNum / value.den, y: value.yNum / value.den });
        r.circle(p.x, p.y, 10, '#482d34'); ring(r, p, 10, C.bad, 2);
        r.line(p.x - 4, p.y - 4, p.x + 4, p.y + 4, 2, C.bad);
        r.line(p.x - 4, p.y + 4, p.x + 4, p.y - 4, 2, C.bad);
      }
    });
  }
  function label(r, value, x, y, selected, member, color) {
    r.rect(x, y, 32, 28, selected ? '#4e4937' : '#172b34');
    frame(r, x, y, 32, 28, selected ? C.selected : member ? '#b2cbc5' : color, selected ? 2 : 1);
    var width = r.measureText(value, 24); text(r, value, x + (32 - width) / 2, y + 1, 24, C.text, 30);
  }
  function terminalLabels(r, state, task, nodes, selectedGroup) {
    var labels = task.terminals.map(function (terminal, index) {
      var p = screen(nodes[terminal.id].position);
      return { terminal: terminal, index: index, p: p, x: terminal.rail.axis === 'y' ? 474 : p.x - 16,
        y: terminal.rail.axis === 'y' ? p.y - 14 : p.y > 345 ? 398 : p.y - 49 };
    });
    var vertical = labels.filter(function (item) { return item.terminal.rail.axis === 'y'; }).sort(function (a, b) { return a.y - b.y || a.index - b.index; });
    vertical.forEach(function (item, index) { item.y = Math.max(88, item.y, index ? vertical[index - 1].y + 32 : 88); });
    for (var i = vertical.length - 1; i >= 0; i--) vertical[i].y = Math.min(vertical[i].y, i === vertical.length - 1 ? 386 : vertical[i + 1].y - 32);
    [false, true].forEach(function (bottom) {
      var row = labels.filter(function (item) { return item.terminal.rail.axis === 'x' && (item.p.y > 345) === bottom; })
        .sort(function (a, b) { return a.x - b.x || a.index - b.index; });
      row.forEach(function (item, index) { item.x = Math.max(56, item.x, index ? row[index - 1].x + 42 : 56); });
      for (var j = row.length - 1; j >= 0; j--) row[j].x = Math.min(row[j].x, j === row.length - 1 ? 532 : row[j + 1].x - 42);
    });
    labels.forEach(function (item) {
      var active = item.index === state.selected, member = selectedGroup.members.indexOf(item.terminal.id) >= 0;
      var target = item.terminal.rail.axis === 'y' ? { x: item.x, y: item.y + 14 } : { x: item.x + 16, y: item.y > item.p.y ? item.y : item.y + 28 };
      r.line(item.p.x, item.p.y, target.x, target.y, active ? 2 : 1, active ? C.selected : C.wires[item.index]);
      label(r, item.terminal.id, item.x, item.y, active, member, C.wires[item.index]);
    });
  }
  function ports(r, state, task, nodes, selectedGroup) {
    var colliding = Object.create(null);
    state.geometry.coincidentNodes.forEach(function (pair) { colliding[pair[0]] = true; colliding[pair[1]] = true; });
    state.geometry.nodes.forEach(function (node) {
      var p = screen(node.position), movable = node.terminalIndex !== null;
      var active = movable && node.terminalIndex === state.selected, member = selectedGroup.members.indexOf(node.id) >= 0;
      if (colliding[node.id]) ring(r, p, 25 + (movable ? node.terminalIndex * 2 : 0), C.bad, 1.8);
      if (member) r.sprite('focus', p.x, p.y, active ? 55 : 47, active ? 55 : 47, 0, active ? C.selected : '#aacac4');
      r.sprite(movable ? 'port' : 'anchor', p.x, p.y, movable ? 37 : 41, movable ? 37 : 41, 0, '#ffffff');
      if (!movable) {
        r.line(p.x - 19, p.y, p.x - 29, p.y, 1.3, '#c1ccc0'); label(r, node.id, p.x - 62, p.y - 14, false, false, '#bcae88');
      }
    });
    terminalLabels(r, state, task, nodes, selectedGroup);
  }
  function guideCards(r, geometry, task, selectedGroup) {
    text(r, 'ALIGNMENT HINTS', 608, 73, 24, C.muted, 325);
    var step = geometry.groups.length === 3 ? 105 : 151, height = geometry.groups.length === 3 ? 99 : 143;
    geometry.groups.forEach(function (group, index) {
      var x = 602, y = 105 + index * step, active = group === selectedGroup, error = group.guideErrorNumerator;
      r.rect(x, y, 336, height, active ? '#273b42' : '#1b2e36'); frame(r, x, y, 336, height, active ? '#b5c4ab' : C.frame, active ? 2 : 1);
      var bounds = group.members.length === 1 ? ' [' + group.min + '..' + group.max + ']' : ' / LINK';
      text(r, groupName(group) + ' > ' + group.guideNode + bounds, x + 13, y + 8, 25, active ? C.selected : C.text, 310);
      text(r, 'CENTER ' + scalar(group.guideCurrentNumerator, group.guideDenominator) + '  REF ' + group.guideReference,
        x + 13, y + 39, 24, C.text, 310);
      var direction = error === 0 ? 'ALIGNED' : group.axis === 'x' ? error > 0 ? 'LEFT' : 'RIGHT' : error > 0 ? 'UP' : 'DOWN';
      text(r, 'GAP ' + signed(error, group.guideDenominator) + ' / ' + direction, x + 13, y + 69, 24, error === 0 ? C.good : C.guides[index], 310);
      if (group.members.length > 1) {
        var limits = task.terminals.filter(function (terminal) { return group.members.indexOf(terminal.id) >= 0; })
          .map(function (terminal) { return terminal.id + ' ' + terminal.rail.min + '..' + terminal.rail.max; }).join('  ');
        text(r, limits, x + 13, y + 106, 24, C.muted, 310);
      }
    });
  }
  function endStop(group, task, nodes) {
    if (group.position !== group.min && group.position !== group.max) return 'BLOCKED = FREE';
    var atMin = group.position === group.min, ids = task.terminals.filter(function (terminal) {
      if (group.members.indexOf(terminal.id) < 0) return false;
      var coordinate = nodes[terminal.id].position[terminal.rail.axis];
      return coordinate === (atMin ? terminal.rail.min : terminal.rail.max);
    }).map(function (terminal) { return terminal.id; });
    return 'LIMIT ' + ids.join('+');
  }
  function render(r, state) {
    var task = config.tasks[state.level], geometry = state.geometry, nodes = nodeMap(geometry);
    var selected = task.terminals[state.selected], group = geometry.groups[selected.group], remaining = task.budget - state.movesUsed;
    r.sprite('bench', 480, 270, 960, 540, 0, '#ffffff');
    r.rect(14, 10, 932, 45, C.quiet); text(r, task.name, 28, 19, 29, C.text, 500);
    text(r, 'MOVES LEFT ' + remaining + ' / ' + task.budget, 642, 22, 26, remaining <= 3 ? C.selected : C.text, 290);
    r.rect(22, 64, 558, 365, 'rgba(17,34,42,.42)'); frame(r, 22, 64, 558, 365, C.frame, 1);
    rails(r, state, task, group); guides(r, geometry, nodes, group); braces(r, geometry, nodes, group);
    cables(r, geometry); conflictMarks(r, geometry); ports(r, state, task, nodes, group); guideCards(r, geometry, task, group);
    r.rect(14, 437, 932, 36, C.quiet);
    text(r, 'CABLE PAIRS ' + geometry.conflictCount, 28, 443, 24, geometry.conflictCount ? C.bad : C.good, 215);
    text(r, 'PORT PAIRS ' + geometry.coincidentNodes.length, 262, 443, 24, geometry.coincidentNodes.length ? C.bad : C.good, 210);
    text(r, 'RAILS ' + (geometry.railsValid ? 'OK' : 'BAD'), 502, 443, 24, geometry.railsValid ? C.good : C.bad, 190);
    text(r, 'ZERO LEN ' + geometry.zeroLengthEdges.length, 714, 443, 24, geometry.zeroLengthEdges.length ? C.bad : C.good, 217);
    r.rect(14, 479, 932, 29, C.quiet);
    text(r, 'SELECT ' + selected.id + '  GROUP ' + groupName(group) + '  Q ' + group.position + ' [' + group.min + '..' + group.max + ']',
      28, 480, 24, C.selected, 606);
    text(r, group.axis === 'x' ? 'LEFT / RIGHT SLIDE' : 'UP / DOWN SLIDE', 658, 480, 24, C.text, 274);
    r.rect(14, 513, 932, 27, C.quiet); text(r, 'A NEXT   B PREV', 28, 514, 24, C.text, 245);
    text(r, 'X POINT   = OVERLAP', 310, 514, 24, C.muted, 320);
    text(r, state.phase === 'won' ? 'ALL CLEAR' : state.phase === 'lost' ? 'BUDGET USED' : endStop(group, task, nodes),
      689, 514, 24, state.phase === 'lost' ? C.bad : C.good, 246);
  }

  root.GameDef = {
    id: 'cable-unweaver', title: '解线工', seed: config.defaultSeed, accent: C.selected, background: C.background, atlas: atlas,
    levelLabel: '接线任务', levelNames: config.tasks.map(function (task) { return task.nameZh; }), holdConfirmAsA: true,
    actionLabels: ['NEXT / 下一个端子', 'PREV / 上一个端子'], tagline: '沿轨道移动端子，把每一条线理清',
    description: 'A 下一个端子，B 上一个端子；方向沿轨道移动。带金属夹的端子整组联动。消除所有非法线交叉与端子重合；每次实际移动用一次调整，合格立即完成。',
    controls: { move: '方向沿当前轨道移动一步；松开再按，金属夹整组联动', a: '空格、Z、确认键 / 手机右上半区：下一个端子', b: 'X、B / 手机右下半区：上一个端子' },
    tip: '虚线是锚点对齐提示，金属夹中心是整组平均位置。GAP 为正时向上或左移动，为负时向下或右移动。X 表示相交，双线标记表示重叠；共享同一个锚点可接合，但共线重叠仍冲突。',
    winTitle: '接线整理完成', loseTitle: '调整次数用尽',
    hud: function (state) {
      var task = config.tasks[state.level], geometry = state.geometry, selected = task.terminals[state.selected];
      return [{ label: '接线任务', value: task.nameZh }, { label: '当前端子 / 组', value: selected.id + ' / ' + groupName(geometry.groups[selected.group]) },
        { label: '剩余调整', value: task.budget - state.movesUsed, tone: task.budget - state.movesUsed <= 3 ? 'warn' : '' },
        { label: '线冲突 / 端子重合', value: geometry.conflictCount + ' / ' + geometry.coincidentNodes.length, tone: geometry.matched ? 'good' : '' }];
    },
    result: function (state) {
      var task = config.tasks[state.level], g = state.geometry;
      return (state.phase === 'won' ? '所有线段与端子位置已通过当前几何检查。' : '调整预算已用尽，仍有未排除的接线冲突。') +
        '实际移动 ' + state.movesUsed + '/' + task.budget + ' 次；线冲突 ' + g.conflictCount + ' 对，端子重合 ' + g.coincidentNodes.length +
        ' 对，零长度线段 ' + g.zeroLengthEdges.length + ' 条，轨道' + (g.railsValid ? '合格。' : '不合格。');
    }, render: render
  };
})(window);
