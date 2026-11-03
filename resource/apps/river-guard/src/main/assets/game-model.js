/* River Guard: atomic cargo crossing and explicit unattended-bank conflict graphs. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const item=(id,name,nameZh)=>({id,name,nameZh});
  const config=freeze({defaultSeed:773,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'familiar-crossing',name:'FAMILIAR CROSSING',nameZh:'经典渡口',items:[item('fox','FOX','狐狸'),item('hen','HEN','母鸡'),item('grain','GRAIN','谷物')],conflicts:[[0,1],[1,2]],capacity:1,crossingLimit:12},
    {id:'garden-boat',name:'GARDEN BOAT',nameZh:'菜园小舟',items:[item('goat','GOAT','山羊'),item('cabbage','CABBAGE','卷心菜'),item('turnip','TURNIP','萝卜'),item('beans','BEANS','豆苗')],conflicts:[[0,1],[0,2],[0,3]],capacity:2,crossingLimit:14},
    {id:'chain-of-care',name:'CHAIN OF CARE',nameZh:'连环照看',items:[item('cat','CAT','猫'),item('bird','BIRD','鸟'),item('grub','GRUB','虫'),item('leaf','LEAF','叶子'),item('goat','GOAT','山羊')],conflicts:[[0,1],[1,2],[2,3],[3,4]],capacity:2,crossingLimit:18}
  ]});
  function refresh(s){s.bankCounts=[s.sides.filter(v=>v===0).length,s.sides.filter(v=>v===1).length];s.deliveredCount=s.bankCounts[1];}
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level];
    const s={schema:1,seed,level,phase:'playing',reason:'',score:0,items:copy(l.items),conflicts:copy(l.conflicts),sides:l.items.map(()=>0),farmer:0,selected:0,cargo:[],capacity:l.capacity,crossingsUsed:0,crossingLimit:l.crossingLimit,bankCounts:[l.items.length,0],deliveredCount:0,dangerPairs:[],lastCrossing:null,
      elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:'A 勾选同岸货物，B 开船（可空船）。船工离开后，岸上不能同时留下任何一组冲突物品。'};return s;
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
    for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=reason==='other-bank'?'该物品在对岸，船工只能勾选同岸货物。':'货位已满；先取消一件已勾选货物。船工座位不占货位。';}
  function toggle(s){const p=s.selected,index=s.cargo.indexOf(p);if(index>=0){s.cargo.splice(index,1);event(s,'unboard',{item:p,cargo:s.cargo.slice()});s.message='已取消 '+s.items[p].nameZh+' 的装船选择。';return;}
    if(s.sides[p]!==s.farmer)return blocked(s,'other-bank');if(s.cargo.length>=s.capacity)return blocked(s,'capacity');s.cargo.push(p);event(s,'board',{item:p,cargo:s.cargo.slice()});s.message='已勾选 '+s.items[p].nameZh+'；物品将在 B 开船时一起过河。';}
  function settle(s,reason){s.reason=reason;s.phase=reason==='delivered'?'won':'lost';s.score=s.phase==='won'?100:0;refresh(s);event(s,s.phase==='won'?'win':'collision',{reason});
    s.message=reason==='delivered'?'船工与全部物品安全到达右岸。':reason==='danger'?'无人照看的岸上出现冲突，本次渡河失败。':'已用完渡河次数，尚未全部送达右岸。';
    s.terminalReceipt=copy({cause:reason,level:s.level,call:s.calls,elapsed:s.elapsed,sides:s.sides,farmer:s.farmer,crossingsUsed:s.crossingsUsed,crossingLimit:s.crossingLimit,dangerPairs:s.dangerPairs,lastCrossing:s.lastCrossing,score:s.score,phase:s.phase,reason:s.reason});}
  function cross(s){const from=s.farmer,to=1-from,cargo=s.cargo.slice();for(const p of cargo)s.sides[p]=to;s.farmer=to;s.crossingsUsed++;s.cargo=[];
    s.dangerPairs=s.conflicts.filter(([a,b])=>s.sides[a]===from&&s.sides[b]===from).map(pair=>pair.slice());refresh(s);s.lastCrossing={from,to,cargo:cargo.slice(),unattended:from,unsafePairs:copy(s.dangerPairs),crossing:s.crossingsUsed};
    if(s.dangerPairs.length)return settle(s,'danger');if(s.farmer===1&&s.deliveredCount===s.items.length)return settle(s,'delivered');if(s.crossingsUsed>=s.crossingLimit)return settle(s,'crossings');
    event(s,'cross',{from,to,cargo:cargo.slice()});s.message='安全抵达'+(to?'右':'左')+'岸；本次携带 '+cargo.length+' 件。请检查下一次离岸后留下的冲突组合。';}
  function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);refresh(s);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;
      if(cmd==='b')cross(s);else if(cmd==='a')toggle(s);else if(cmd!=='none'){const from=s.selected;s.selected=(s.selected+(cmd==='right'||cmd==='down'?1:s.items.length-1))%s.items.length;event(s,'cursor',{from,to:s.selected});}}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
