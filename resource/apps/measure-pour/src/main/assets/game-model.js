/* Measure Pour: maximal transfers among three finite-volume jugs. */
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
      Object.keys(value).forEach(key => freeze(value[key])); Object.freeze(value);
    }
    return value;
  }
  const config = freeze({ defaultSeed:750, maxElapsed:86400, maxCounter:2147483647,
    layouts:[
      { id:'half-measure', name:'HALF MEASURE', nameZh:'对半分装', capacities:[8,5,3], initial:[8,0,0], target:[4,4,0], pourLimit:9 },
      { id:'long-transfer', name:'LONG TRANSFER', nameZh:'长程倒量', capacities:[10,7,3], initial:[10,0,0], target:[5,5,0], pourLimit:11 },
      { id:'three-way-lot', name:'THREE-WAY LOT', nameZh:'三杯配额', capacities:[12,7,5], initial:[12,0,0], target:[6,1,5], pourLimit:13 }
    ] });
  function create(seed, level) {
    seed = Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed;
    level = Number.isInteger(level) && level >= 0 && level < config.layouts.length ? level : 0;
    const layout = config.layouts[level];
    return { schema:1, seed, level, phase:'playing', reason:'', score:0, selected:0, source:null,
      volumes:copy(layout.initial), capacities:copy(layout.capacities), target:copy(layout.target), pourLimit:layout.pourLimit,
      poursUsed:0, elapsed:0, elapsedCapped:false, calls:0, blockedActions:0, inputArmed:false,
      cancelEpoch:null, cancelledLast:false, lastHeld:{a:false,b:false,direction:'none'}, lastCommand:'none',
      events:[], pourReceipts:[], terminalReceipt:null,
      message:'左右选杯，A 标记来源；再选目标杯按 A 倒入，B 取消。' };
  }
  function normalized(input) {
    const neutral = () => ({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
    try {
      if (!input || typeof input !== 'object' || Array.isArray(input)) return neutral();
      const values = Object.create(null);
      for (const key of ['x','y','a','b','cancelled','cancelEpoch','paused']) {
        const desc = Object.getOwnPropertyDescriptor(input,key);
        if (desc && Object.prototype.hasOwnProperty.call(desc,'value')) values[key] = desc.value;
      }
      const axis = n => typeof n === 'number' && Number.isFinite(n) ? Math.max(-1,Math.min(1,n)) : 0;
      return { x:axis(values.x), y:axis(values.y), a:values.a === true, b:values.b === true,
        cancelled:values.cancelled === true, paused:values.paused === true,
        cancelEpoch:Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null };
    } catch (_) { return neutral(); }
  }
  function direction(input) {
    const x = Math.abs(input.x), y = Math.abs(input.y);
    if (x <= .5 && y <= .5) return 'none';
    if (y >= x) return input.y > 0 ? 'down' : 'up';
    return input.x > 0 ? 'right' : 'left';
  }
  function event(s,type,fields) { s.events = [Object.assign({type,call:s.calls},fields)]; }
  function blocked(s,reason,message) {
    s.blockedActions = Math.min(config.maxCounter,s.blockedActions+1);
    event(s,'blocked',{reason}); s.message = message;
  }
  function cancel(s) {
    if (s.source === null) return blocked(s,'no-source','尚未选择来源；先选有水的量杯按 A。');
    const jug = s.source; s.source = null; event(s,'cancel',{jug});
    s.message = '已取消来源，不消耗倒水次数。';
  }
  function action(s) {
    const layout = config.layouts[s.level];
    if (s.source === null) {
      if (s.volumes[s.selected] === 0) return blocked(s,'empty-source','这只量杯为空，不能作为来源；不消耗次数。');
      s.source = s.selected; event(s,'source',{jug:s.source});
      s.message = '来源为 ' + (s.source+1) + ' 号杯；左右选接收杯，A 倒入，B 取消。';
      return;
    }
    const from = s.source, to = s.selected;
    if (from === to) return blocked(s,'same-jug','来源与接收杯相同；请选择另一只杯，不消耗次数。');
    if (s.volumes[from] === 0) return blocked(s,'empty-source','来源杯已空；B 取消后重新选择，不消耗次数。');
    const amount = Math.min(s.volumes[from],layout.capacities[to]-s.volumes[to]);
    if (amount === 0) return blocked(s,'full-destination','接收杯已满；请选择另一只杯，不消耗次数。');
    const before = s.volumes.slice();
    s.volumes[from] -= amount; s.volumes[to] += amount; s.poursUsed++; s.source = null;
    const matched = s.volumes.every((value,i) => value === layout.target[i]);
    const outcome = matched ? 'won' : s.poursUsed >= layout.pourLimit ? 'lost' : 'playing';
    s.pourReceipts.push({index:s.pourReceipts.length,call:s.calls,from,to,amount,before,after:s.volumes.slice(),poursUsed:s.poursUsed,matched,outcome});
    const details = {from,to,amount,poursUsed:s.poursUsed};
    if (outcome !== 'playing') {
      s.phase = outcome; s.reason = matched ? '' : 'pours'; s.score = matched ? 100 : 0;
      event(s,matched ? 'win' : 'collision',matched ? details : Object.assign({reason:'pours'},details));
      s.message = matched ? '三杯水量均与目标一致，转运完成。' : '倒水次数已用尽，三杯水量尚未全部达标。';
      s.terminalReceipt = copy({cause:matched?'success':'pours',call:s.calls,elapsed:s.elapsed,level:s.level,
        selected:s.selected,source:s.source,volumes:s.volumes,poursUsed:s.poursUsed,pourLimit:layout.pourLimit,
        score:s.score,phase:s.phase,reason:s.reason});
    } else {
      event(s,'pour',details);
      s.message = (from+1)+' 号杯向 '+(to+1)+' 号杯倒入 '+amount+' 单位；剩余 '+(layout.pourLimit-s.poursUsed)+' 次。';
    }
  }
  function step(s,dt,raw) {
    if (s.phase !== 'playing' || typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0 || dt > .25) return s;
    const input = normalized(raw);
    if (input.paused) return s;
    const dir = direction(input), old = s.lastHeld, armed = s.inputArmed;
    const disarm = (input.cancelEpoch !== null && s.cancelEpoch !== null && input.cancelEpoch !== s.cancelEpoch)
      || (input.cancelled && !s.cancelledLast);
    s.events=[]; s.lastCommand='none'; s.calls=Math.min(config.maxCounter,s.calls+1);
    const elapsed=s.elapsed+dt;
    if(elapsed>config.maxElapsed)s.elapsedCapped=true;
    s.elapsed=Math.min(config.maxElapsed,elapsed);
    if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;
    s.cancelledLast=input.cancelled;
    if(disarm)s.inputArmed=false;
    if(!disarm&&!input.cancelled&&armed){
      const command=input.b&&!old.b?'b':input.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';
      s.lastCommand=command;
      if(command==='b')cancel(s);
      else if(command==='a')action(s);
      else if(command==='left'||command==='right'){
        const from=s.selected;s.selected=(from+(command==='right'?1:2))%3;
        event(s,'select',{from,to:s.selected});
        s.message='已选择 '+(s.selected+1)+' 号杯；'+(s.source===null?'A 标记为来源。':'A 从 '+(s.source+1)+' 号杯倒入，B 取消。');
      }
    }
    if(!disarm&&!input.cancelled&&!input.a&&!input.b&&dir==='none')s.inputArmed=true;
    s.lastHeld={a:input.a,b:input.b,direction:dir};
    return s;
  }
  return Object.freeze({create,step,config});
});
