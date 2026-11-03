/* Stack Dispatch: bounded LIFO bays and a single-cargo crane. */
(function (root, factory) {
  'use strict';
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.PureModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(key => freeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }
  const config = freeze({ defaultSeed: 748, mistakeLimit: 3, maxElapsed: 86400, maxCounter: 2147483647,
    layouts: [
      { id: 'first-shift', name: 'FIRST SHIFT', nameZh: '首班分拣', inbound: [1,2,3,4,5,6],
        delivery: [4,1,5,2,6,3], capacity: 2, moveLimit: 24 },
      { id: 'mixed-freight', name: 'MIXED FREIGHT', nameZh: '交错货单', inbound: [1,2,3,4,5,6,7],
        delivery: [5,2,7,1,4,6,3], capacity: 3, moveLimit: 28 },
      { id: 'reverse-tide', name: 'REVERSE TIDE', nameZh: '逆序回港', inbound: [1,2,3,4,5,6,7,8],
        delivery: [8,1,7,2,6,3,5,4], capacity: 3, moveLimit: 32 }
    ] });

  function create(seed, level) {
    seed = Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed;
    level = Number.isInteger(level) && level >= 0 && level < config.layouts.length ? level : 0;
    const layout = config.layouts[level];
    return { schema: 1, seed, level, phase: 'playing', reason: '', score: 0, selected: 0,
      inbound: copy(layout.inbound), delivery: copy(layout.delivery), capacity: layout.capacity, moveLimit: layout.moveLimit,
      inboundIndex: 0, bays: [[],[],[]], held: null, nextDelivery: 0, movesUsed: 0, mistakes: 0,
      elapsed: 0, elapsedCapped: false, calls: 0, blockedActions: 0, inputArmed: false,
      cancelEpoch: null, cancelledLast: false, lastHeld: { a: false, b: false, direction: 'none' },
      lastCommand: 'none', events: [], dispatchReceipts: [], terminalReceipt: null,
      message: '左右选进货口或货栈；A 取放一箱，B 按货单出货。' };
  }

  function normalized(input) {
    const neutral = () => ({ x: 0, y: 0, a: false, b: false, cancelled: false, cancelEpoch: null, paused: false });
    try {
      if (!input || typeof input !== 'object' || Array.isArray(input)) return neutral();
      const values = Object.create(null);
      for (const key of ['x','y','a','b','cancelled','cancelEpoch','paused']) {
        const desc = Object.getOwnPropertyDescriptor(input, key);
        if (desc && Object.prototype.hasOwnProperty.call(desc, 'value')) values[key] = desc.value;
      }
      const axis = n => typeof n === 'number' && Number.isFinite(n) ? Math.max(-1,Math.min(1,n)) : 0;
      return { x: axis(values.x), y: axis(values.y), a: values.a === true, b: values.b === true,
        cancelled: values.cancelled === true, paused: values.paused === true,
        cancelEpoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null };
    } catch (_) { return neutral(); }
  }
  function direction(input) {
    const x = Math.abs(input.x), y = Math.abs(input.y);
    if (x <= 0.5 && y <= 0.5) return 'none';
    if (y >= x) return input.y > 0 ? 'down' : 'up';
    return input.x > 0 ? 'right' : 'left';
  }
  function event(s, type, fields) { s.events = [Object.assign({type,call:s.calls},fields)]; }
  function blocked(s, reason, message) {
    s.blockedActions = Math.min(config.maxCounter, s.blockedActions + 1);
    event(s, 'blocked', {reason}); s.message = message;
  }
  function settle(s, cause, detail) {
    s.phase = cause === 'success' ? 'won' : 'lost';
    s.reason = cause === 'success' ? '' : cause;
    s.score = cause === 'success' ? 100 : 0;
    event(s, cause === 'success' ? 'win' : 'collision', cause === 'success' ? detail : {reason:cause});
    s.message = cause === 'success' ? '所有货箱已按货单出港，调度完成。'
      : cause === 'moves' ? '吊机搬动次数超出额度，本次调度结束。' : '累计三次错序出货，本次调度结束。';
    s.terminalReceipt = copy({ cause, level:s.level, call:s.calls, elapsed:s.elapsed, selected:s.selected,
      inboundIndex:s.inboundIndex, bays:s.bays, held:s.held, nextDelivery:s.nextDelivery,
      movesUsed:s.movesUsed, mistakes:s.mistakes, score:s.score, phase:s.phase, reason:s.reason });
  }
  function cargoMove(s) {
    const layout = config.layouts[s.level], bay = s.bays[s.selected - 1];
    let type, crate;
    if (s.selected === 0) {
      if (s.held !== null) return blocked(s,'crane-full','吊机已有货箱，先放入货栈或按序出货。');
      if (s.inboundIndex >= layout.inbound.length) return blocked(s,'inbound-empty','进货口已空，不消耗搬动次数。');
      crate = layout.inbound[s.inboundIndex++]; s.held = crate; type = 'pick';
    } else if (s.held === null) {
      if (!bay.length) return blocked(s,'bay-empty','该货栈为空，不消耗搬动次数。');
      crate = bay.pop(); s.held = crate; type = 'pick';
    } else {
      if (bay.length >= layout.capacity) return blocked(s,'bay-full','该货栈已满，先腾出栈顶空位。');
      crate = s.held; bay.push(crate); s.held = null; type = 'place';
    }
    s.movesUsed++;
    if (s.movesUsed > layout.moveLimit) return settle(s,'moves');
    event(s,type,{crate,position:s.selected,movesUsed:s.movesUsed});
    s.message = (type === 'pick' ? '已吊起 ' : '已放下 ') + crate + ' 号箱；剩余 ' + (layout.moveLimit-s.movesUsed) + ' 次搬动。';
  }
  function dispatch(s) {
    const layout = config.layouts[s.level];
    if (s.held === null) return blocked(s,'crane-empty','吊机为空，先用 A 取出所需货箱。');
    const crate = s.held, expected = layout.delivery[s.nextDelivery];
    if (crate !== expected) {
      s.mistakes++;
      if (s.mistakes >= config.mistakeLimit) return settle(s,'mistakes');
      event(s,'reject',{crate,expected,mistakes:s.mistakes});
      s.message = '下一箱应为 ' + expected + ' 号；' + crate + ' 号仍在吊机上，错序 ' + s.mistakes + '/3。';
      return;
    }
    const index = s.nextDelivery++;
    s.held = null;
    s.dispatchReceipts.push({crate,index,call:s.calls,movesUsed:s.movesUsed});
    if (s.nextDelivery === layout.delivery.length) return settle(s,'success',{crate,index});
    event(s,'dispatch',{crate,index});
    s.message = crate + ' 号箱已出港；下一箱为 ' + layout.delivery[s.nextDelivery] + ' 号。';
  }
  function step(s, dt, raw) {
    if (s.phase !== 'playing' || typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) return s;
    const input = normalized(raw);
    if (input.paused) return s;
    const dir = direction(input), old = s.lastHeld, armed = s.inputArmed;
    const disarm = (input.cancelEpoch !== null && s.cancelEpoch !== null && input.cancelEpoch !== s.cancelEpoch)
      || (input.cancelled && !s.cancelledLast);
    s.events = []; s.lastCommand = 'none';
    s.calls = Math.min(config.maxCounter,s.calls+1);
    const elapsed = s.elapsed + dt;
    if (elapsed > config.maxElapsed) s.elapsedCapped = true;
    s.elapsed = Math.min(config.maxElapsed,elapsed);
    if (input.cancelEpoch !== null) s.cancelEpoch = input.cancelEpoch;
    s.cancelledLast = input.cancelled;
    if (disarm) s.inputArmed = false;
    if (!disarm && !input.cancelled && armed) {
      const command = input.b && !old.b ? 'b' : input.a && !old.a ? 'a'
        : dir !== 'none' && dir !== old.direction ? dir : 'none';
      s.lastCommand = command;
      if (command === 'b') dispatch(s);
      else if (command === 'a') cargoMove(s);
      else if (command === 'left' || command === 'right') {
        const from = s.selected; s.selected = (from + (command === 'right' ? 1 : 3)) % 4;
        event(s,'select',{from,to:s.selected});
        s.message = s.selected === 0 ? '已选择进货口；A 吊起下一箱。' : '已选择货栈 ' + s.selected + '；A 只取放栈顶。';
      }
    }
    if (!disarm && !input.cancelled && !input.a && !input.b && dir === 'none') s.inputArmed = true;
    s.lastHeld = {a:input.a,b:input.b,direction:dir};
    return s;
  }
  return Object.freeze({create,step,config});
});
