(function (root) {
  'use strict';
  // Original warehouse art is painted once into the shared single texture atlas.
  // Every crate number and inventory indicator below comes from public model state.
  var C = { bg: '#17282c', ink: '#f6ead2', muted: '#b9c3bb', gold: '#f4bd63',
    teal: '#7fd5c2', bad: '#ef8e76', dark: '#172a2c', line: '#68827b' };
  var cargoColors = ['#ffffff', '#e6ad6c', '#77c9b9', '#83add5', '#c898c0',
    '#b9ce80', '#e68c76', '#c6bd9c', '#83cbd5'];
  function round(c, x, y, w, h, r, fill, stroke, weight) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = weight || 1; c.stroke(); }
  }
  function bolt(c, x, y) {
    c.fillStyle = '#e0d6ae'; c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#6a7160'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 1, y + 1); c.lineTo(x + 1, y - 1); c.stroke();
  }
  var atlas = { builtins: [], tiles: [
    { name: 'warehouse', x: 0, y: 0, w: 640, h: 384, paint: function (c, w, h, art) {
      c.save(); c.scale(w / 960, h / 540);
      c.fillStyle = art.linear(c, 0, 0, 960, 540, [[0, '#314546'], [.4, '#203536'], [1, '#13282b']]);
      c.fillRect(0, 0, 960, 540);
      // Tall masonry, roof braces and dim warehouse windows remain behind live information.
      c.strokeStyle = '#78877915'; c.lineWidth = 1;
      for (var y = 0; y < 540; y += 30) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke();
        for (var x = (y / 30 % 2) * 40; x < 960; x += 80) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 30); c.stroke(); }
      }
      round(c, 15, 10, 930, 43, 9, '#152a2ce8', '#5b746b');
      round(c, 24, 64, 712, 94, 10, art.linear(c, 0, 64, 0, 158,
        [[0, '#e7ddbe'], [1, '#c8c4a5']]), '#f3e4be', 1.5);
      round(c, 754, 64, 182, 94, 10, '#10282a', '#63897e', 1.5);
      for (var i = 0; i < 4; i++) {
        var left = i ? 244 + (i - 1) * 234 : 24, width = i ? 212 : 184;
        round(c, left, 206, width, 273, 10, '#11282bb3', '#466660');
        c.fillStyle = '#79978c0d'; c.fillRect(left + 9, 218, width - 18, 243);
        bolt(c, left + 9, 216); bolt(c, left + width - 9, 216);
        bolt(c, left + 9, 468); bolt(c, left + width - 9, 468);
      }
      // Overhead gantry: striped beam, bolts and wheel rail.
      c.fillStyle = '#0e2228'; c.fillRect(22, 168, 916, 32);
      c.fillStyle = art.linear(c, 0, 173, 0, 195, [[0, '#c6aa65'], [.5, '#806941'], [1, '#3a4c43']]);
      c.fillRect(24, 173, 912, 22);
      c.save(); c.beginPath(); c.rect(24, 177, 912, 14); c.clip();
      c.fillStyle = '#242d2c';
      for (var stripe = 0; stripe < 960; stripe += 32) art.path(c, [[stripe, 177], [stripe + 13, 177], [stripe + 1, 191], [stripe - 12, 191]], '#253332');
      c.restore();
      c.fillStyle = '#d7c184'; c.fillRect(24, 171, 912, 3);
      c.fillStyle = '#718c7c'; c.fillRect(24, 198, 912, 3);
      for (var b = 35; b < 936; b += 100) { bolt(c, b, 175); bolt(c, b, 194); }
      round(c, 24, 490, 912, 38, 8, '#11272a', '#5b766a');
      c.restore();
    } },
    { name: 'container', x: 640, y: 0, w: 128, h: 96, paint: function (c, w, h, art) {
      art.ellipse(c, 64, 85, 59, 8, '#00000030');
      art.path(c, [[9, 21], [23, 10], [111, 10], [120, 21]], '#f8f5e8', '#747c76', 1.5);
      round(c, 9, 21, 111, 61, 3, art.linear(c, 0, 21, 0, 82,
        [[0, '#faf6e8'], [.15, '#d2d1c6'], [.75, '#bcc4bc'], [1, '#868f85']]), '#556c64', 2);
      c.fillStyle = '#65796c'; c.fillRect(13, 25, 4, 52); c.fillRect(112, 25, 4, 52);
      c.fillStyle = '#f6f3e4'; c.fillRect(17, 25, 2, 52); c.fillRect(110, 25, 2, 52);
      [28, 38, 92, 102].forEach(function (x) { c.fillStyle = '#78908266'; c.fillRect(x, 27, 3, 47); c.fillStyle = '#ffffff55'; c.fillRect(x + 3, 27, 1, 47); });
      round(c, 43, 31, 43, 39, 3, '#f4f0db', '#78857a', 1.2);
      c.fillStyle = '#526c5d'; c.fillRect(45, 71, 40, 2);
      [15, 114].forEach(function (x) { bolt(c, x, 25); bolt(c, x, 78); });
    } },
    { name: 'trolley', x: 768, y: 0, w: 128, h: 128, paint: function (c, w, h, art) {
      [27, 101].forEach(function (x) {
        art.ellipse(c, x, 26, 15, 15, '#0c2026'); art.ellipse(c, x, 26, 11, 11, '#617b72');
        art.ellipse(c, x, 26, 6, 6, '#c7b47e'); bolt(c, x, 26);
      });
      round(c, 17, 25, 94, 43, 6, art.linear(c, 0, 25, 0, 68,
        [[0, '#f4cc7f'], [.5, '#bc8d46'], [1, '#7b663e']]), '#493f30', 2);
      c.fillStyle = '#ffe4a4'; c.fillRect(23, 29, 82, 3);
      round(c, 43, 34, 42, 26, 4, '#2c4645', '#e9d18b', 1);
      art.ellipse(c, 64, 47, 9, 9, '#879781'); art.ellipse(c, 64, 47, 4, 4, '#172e32');
      [28, 100].forEach(function (x) { bolt(c, x, 38); bolt(c, x, 57); });
      c.strokeStyle = '#e0cf94'; c.lineWidth = 4; c.beginPath(); c.moveTo(59, 68); c.lineTo(59, 93); c.moveTo(69, 68); c.lineTo(69, 93); c.stroke();
      round(c, 49, 89, 30, 13, 3, '#b99a60', '#243c38', 1.5);
      c.strokeStyle = '#e4cf96'; c.lineWidth = 6; c.beginPath(); c.moveTo(64, 101); c.lineTo(64, 110); c.bezierCurveTo(46, 107, 51, 127, 66, 122); c.stroke();
    } },
    { name: 'pallet', x: 0, y: 800, w: 208, h: 64, paint: function (c, w, h, art) {
      art.ellipse(c, 104, 53, 99, 10, '#05141766');
      art.path(c, [[9, 24], [26, 11], [184, 11], [200, 24]], '#b6a277', '#4a5343', 1.5);
      round(c, 9, 24, 191, 16, 2, art.linear(c, 0, 24, 0, 40,
        [[0, '#d3b67d'], [1, '#706344']]), '#4b5344');
      [22, 91, 173].forEach(function (x) { c.fillStyle = '#6b6347'; c.fillRect(x, 40, 15, 10); c.fillStyle = '#c7b077'; c.fillRect(x, 40, 15, 3); });
      c.strokeStyle = '#796c4a'; c.lineWidth = 2;
      [57, 104, 151].forEach(function (x) { c.beginPath(); c.moveTo(x, 13); c.lineTo(x - 5, 24); c.stroke(); });
      [22, 185].forEach(function (x) { bolt(c, x, 31); });
    } }
  ] };
  var model = root.PureModel, config = model.config;
  function text(r, value, x, y, size, color) { r.text(String(value), x, y, size, color); }
  function center(r, value, x, y, size, color) {
    text(r, value, x - r.measureText(String(value), size) / 2, y, size, color);
  }
  function frame(r, x, y, w, h, color, thickness) {
    r.rect(x, y, w, thickness, color); r.rect(x, y + h - thickness, w, thickness, color);
    r.rect(x, y, thickness, h, color); r.rect(x + w - thickness, y, thickness, h, color);
  }
  function crate(r, id, x, y, width, height, small, muted) {
    r.sprite('container', x, y, width, height, 0, muted ? '#50645e' : cargoColors[id]);
    center(r, id, x + width * .005, y - (small ? 10 : 14), small ? 24 : 32, muted ? '#a7b4a3' : '#132d30');
  }
  function selectedName(state) { return state.selected === 0 ? '入库口' : '货栈 ' + state.selected; }
  function action(state) {
    if (state.selected === 0) return state.held === null ? 'A PICK NEXT' : 'A HAND FULL';
    return state.held === null ? 'A LIFT TOP' : 'A STACK';
  }
  function render(r, state) {
    var layout = config.layouts[state.level], xPositions = [116, 350, 584, 818];
    r.sprite('warehouse', 480, 270, 960, 540, 0, '#ffffff');
    text(r, layout.name, 30, 17, 28, C.ink);
    text(r, 'MOVES ' + state.movesUsed + '/' + state.moveLimit, 448, 19, 24, state.movesUsed >= state.moveLimit - 3 ? C.gold : C.ink);
    text(r, 'ERRORS ' + state.mistakes + '/3', 732, 19, 24, state.mistakes ? C.bad : C.muted);
    text(r, 'DELIVERY ORDER', 40, 69, 24, C.dark);
    text(r, state.nextDelivery === state.delivery.length ? 'ALL SHIPPED' : 'NEXT #' + state.delivery[state.nextDelivery], 512, 69, 24, '#285c50');
    state.delivery.forEach(function (id, i) {
      var x = 72 + i * 85;
      crate(r, id, x, 123, 59, 49, true, i < state.nextDelivery);
      if (i === state.nextDelivery) frame(r, x - 34, 98, 68, 51, '#2b7766', 3);
      if (i < state.nextDelivery) { r.line(x - 11, 142, x - 3, 147, 3, '#356b54'); r.line(x - 3, 147, x + 12, 136, 3, '#356b54'); }
    });
    center(r, 'CRANE LOAD', 845, 71, 24, C.muted);
    center(r, state.held === null ? 'EMPTY' : '#' + state.held, 845, 106, 32, state.held === null ? C.muted : C.gold);
    // Four carriage positions are also the four selectable work stations.
    r.sprite('trolley', xPositions[state.selected], 213, 84, 84, 0, '#ffffff');
    if (state.held !== null) {
      r.line(xPositions[state.selected] - 6, 252, xPositions[state.selected] - 24, 258, 2, C.gold);
      r.line(xPositions[state.selected] + 6, 252, xPositions[state.selected] + 24, 258, 2, C.gold);
      crate(r, state.held, xPositions[state.selected], 274, 100, 62, false, false);
    }
    var incoming = state.inbound.slice(state.inboundIndex);
    center(r, 'NEXT IN', 116, 309, 24, C.muted);
    if (incoming.length) crate(r, incoming[0], 116, 359, 116, 72, false, false);
    else center(r, 'EMPTY', 116, 347, 28, C.muted);
    var tail = incoming.slice(1);
    center(r, tail.slice(0, 4).join('  '), 116, 405, 24, C.ink);
    center(r, tail.slice(4).join('  '), 116, 431, 24, C.ink);
    if (!tail.length) center(r, 'NO QUEUE', 116, 405, 24, C.muted);
    center(r, 'INBOUND', 116, 452, 24, state.selected === 0 ? C.gold : C.muted);
    state.bays.forEach(function (bay, i) {
      var x = xPositions[i + 1];
      // Empty slot markers communicate fixed capacity, independent of occupancy.
      for (var slot = 0; slot < state.capacity; slot++) {
        var yy = 414 - slot * 48;
        frame(r, x - 59, yy - 24, 118, 47, '#42625a', 1);
        r.line(x - 77, yy, x - 65, yy, 2, '#708779');
      }
      r.sprite('pallet', x, 442, 172, 39, 0, '#ffffff');
      bay.forEach(function (id, index) { crate(r, id, x, 414 - index * 48, 124, 72, false, false); });
      if (bay.length) text(r, 'TOP', x + 59, 405 - (bay.length - 1) * 48, 24, C.teal);
      else center(r, 'EMPTY', x, 346, 24, C.muted);
      center(r, 'BAY ' + (i + 1) + '  ' + bay.length + '/' + state.capacity, x, 452, 24, state.selected === i + 1 ? C.gold : C.muted);
    });
    var selectedWidth = state.selected === 0 ? 184 : 212;
    frame(r, xPositions[state.selected] - selectedWidth / 2, 445, selectedWidth, 34, C.gold, 2);
    r.circle(xPositions[state.selected], 485, 3, C.gold);
    text(r, '< > SELECT', 38, 497, 24, C.gold);
    text(r, action(state), 268, 497, 24, C.ink);
    text(r, 'B DISPATCH', 506, 497, 24, C.ink);
    text(r, 'OUT ' + state.nextDelivery + '/' + state.delivery.length, 760, 497, 24, C.teal);
  }
  root.GameDef = {
    id: 'stack-dispatch', title: '序栈货运', seed: config.defaultSeed, accent: C.gold,
    background: C.bg, atlas: atlas, holdConfirmAsA: true,
    tagline: '先入后出，按单启航', levelLabel: '货单',
    levelNames: config.layouts.map(function (layout) { return layout.nameZh; }),
    actionLabels: ['提起 / 堆放', '按单出货'],
    description: '左右选择入库口或三个货栈。A 提起下一件或栈顶货箱；吊机有货时，A 将它堆入货栈。B 按货单顺序出货。每次提放消耗一次搬运，三次错单或超出搬运额度即结束。每次操作后松开再按。',
    controls: { move: '左右选择入库口 / 货栈', a: '空格、Z、确认 / 手机右上：提起或堆放', b: 'X、B / 手机右下：出货' },
    tip: '货栈只能取最上层，吊机一次拿一件。货单绿框是下一件；入库大箱后的小数字依次排队。出货不耗搬运，满栈或空取不扣次数。长按不连动。',
    winTitle: '货单完成，准时启航', loseTitle: '本班调度结束',
    hud: function (state) {
      return [{ label: '当前工位', value: selectedName(state) },
        { label: '已出货', value: state.nextDelivery + ' / ' + state.delivery.length, tone: 'good' },
        { label: '剩余搬运', value: Math.max(0, state.moveLimit - state.movesUsed), tone: state.movesUsed >= state.moveLimit - 3 ? 'warn' : '' },
        { label: '错单次数', value: state.mistakes + ' / 3', tone: state.mistakes ? 'warn' : '' }];
    },
    result: function (state) {
      return (state.phase === 'won' ? '全部货箱已按公开货单依次出货。' : state.mistakes >= 3 ? '三次错单，请先核对下一件编号。' : '搬运次数超出额度，请重新安排货栈。') +
        '出货 ' + state.nextDelivery + '/' + state.delivery.length + ' 件，搬运 ' + state.movesUsed + '/' + state.moveLimit +
        ' 次，用时 ' + state.elapsed.toFixed(1) + ' 秒。';
    },
    render: render
  };
})(window);
