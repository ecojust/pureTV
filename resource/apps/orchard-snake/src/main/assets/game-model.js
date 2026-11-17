/* Orchard Snake: timed body occupancy, queued perpendicular turns and finite brakes. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  function walls(coords){const result=Array(96).fill(false);coords.forEach(([x,y])=>result[y*12+x]=true);return result;}
  const config=freeze({width:12,height:8,defaultSeed:763,initialBody:[38,37,36],initialDirection:'right',brakeTokens:3,brakeSeconds:.6,timeEpsilon:1e-10,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'meadow-path',name:'MEADOW PATH',nameZh:'草甸果径',walls:walls([[5,2],[6,2],[5,5],[6,5]]),goalFruit:5,interval:.35},
    {id:'hedge-lanes',name:'HEDGE LANES',nameZh:'树篱曲径',walls:walls([[5,1],[5,2],[5,5],[5,6],[9,2],[9,3],[9,4],[9,5]]),goalFruit:7,interval:.30},
    {id:'stone-grove',name:'STONE GROVE',nameZh:'石间果林',walls:walls([[4,0],[4,1],[4,2],[7,4],[7,5],[7,6],[9,1],[9,2],[9,5],[9,6]]),goalFruit:9,interval:.26}
  ]});
  const opposite={up:'down',down:'up',left:'right',right:'left'},directions=['up','right','down','left'];
  function next(p,dir){const x=p%12,y=Math.floor(p/12),dx=dir==='right'?1:dir==='left'?-1:0,dy=dir==='down'?1:dir==='up'?-1:0;
    return x+dx<0||x+dx>=12||y+dy<0||y+dy>=8?-1:p+dx+dy*12;}
  function mixed(value){let x=value>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return (x^(x>>>16))>>>0;}
  function spawnFood(s){const l=config.layouts[s.level],occupied=new Set(s.body),blocked=new Set(s.body.slice(1,-1)),queue=[s.body[0]],seen=new Set(queue),eligible=[];
    for(let i=0;i<queue.length;i++){const p=queue[i];if(!occupied.has(p))eligible.push(p);
      for(const d of directions){const q=next(p,d);if(q>=0&&!l.walls[q]&&!blocked.has(q)&&!seen.has(q)){seen.add(q);queue.push(q);}}}
    eligible.sort((a,b)=>a-b);if(!eligible.length){s.food=null;return;}
    const pick=mixed(s.seed^Math.imul(s.foodSerial+1,0x9e3779b9)^Math.imul(s.level+1,0x85ebca6b));s.food=eligible[pick%eligible.length];s.foodSerial++;
  }
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level];
    const s={schema:1,seed,level,phase:'playing',reason:'',score:0,width:12,height:8,walls:l.walls.slice(),goalFruit:l.goalFruit,interval:l.interval,body:config.initialBody.slice(),
      direction:'right',queuedDirection:null,moveClock:0,brakeRemaining:0,brakes:3,brakesUsed:0,eaten:0,moves:0,food:null,foodSerial:0,
      elapsed:0,elapsedCapped:false,calls:0,turnsQueued:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},
      lastCommand:'none',events:[],terminalReceipt:null,message:'游蛇持续前进；方向排入下一拍转弯，A 消耗一次短刹车。吃果增长，避开石墙和身体。'};spawnFood(s);return s;
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{
    if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
    for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function inc(s,key){s[key]=Math.min(config.maxCounter,s[key]+1);}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){inc(s,'blockedActions');event(s,'blocked',{reason});s.message=reason==='reverse'?'不能直接掉头撞向蛇颈。':reason==='same-direction'?'已经朝该方向前进。':reason==='turn-queued'?'下一拍已有转弯，等移动后再排新方向。':reason==='braking'?'正在刹车，不重复消耗。':'三次刹车已经用完。';}
  function turn(s,dir){if(s.queuedDirection!==null)return blocked(s,'turn-queued');if(dir===opposite[s.direction])return blocked(s,'reverse');if(dir===s.direction)return blocked(s,'same-direction');
    s.queuedDirection=dir;inc(s,'turnsQueued');event(s,'turn',{direction:dir});s.message='已排入下一拍转弯，未移动前不能改向。';}
  function brake(s){if(s.brakeRemaining>config.timeEpsilon)return blocked(s,'braking');if(!s.brakes)return blocked(s,'no-brakes');s.brakes--;s.brakesUsed++;s.brakeRemaining=config.brakeSeconds;event(s,'brake',{remainingTokens:s.brakes});s.message='短刹车中：移动暂停 0.6 秒，可以预排方向。';}
  function settle(s,cause,attempted){s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':cause;s.score=cause==='success'?100:0;
    event(s,cause==='success'?'win':'collision',cause==='success'?{eaten:s.eaten}:{reason:cause,attempted});s.message=cause==='success'?'果实全部收齐，游蛇安全归园。':cause==='wall'?'撞到边界或石墙，本次游园结束。':'撞到未离开的身体，本次游园结束。';
    s.terminalReceipt=copy({cause,level:s.level,call:s.calls,elapsed:s.elapsed,body:s.body,direction:s.direction,queuedDirection:s.queuedDirection,food:s.food,eaten:s.eaten,moves:s.moves,brakes:s.brakes,brakeRemaining:s.brakeRemaining,moveClock:s.moveClock,score:s.score,phase:s.phase,reason:s.reason});}
  function tick(s){const l=config.layouts[s.level];if(s.queuedDirection!==null){s.direction=s.queuedDirection;s.queuedDirection=null;}
    const from=s.body[0],to=next(from,s.direction),growing=to===s.food;if(to<0||l.walls[to])return settle(s,'wall',to);
    const occupied=growing?s.body:s.body.slice(0,-1);if(occupied.includes(to))return settle(s,'body',to);
    s.body.unshift(to);if(!growing)s.body.pop();inc(s,'moves');
    if(growing){s.eaten++;s.food=null;if(s.eaten>=l.goalFruit)return settle(s,'success');spawnFood(s);event(s,'eat',{from,to,eaten:s.eaten});s.message='吃到果实，身体增长；已收集 '+s.eaten+'/'+l.goalFruit+'。';}
    else{if(s.food===null)spawnFood(s);event(s,'move',{from,to});}
  }
  function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';inc(s,'calls');const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm){s.inputArmed=false;s.queuedDirection=null;}
    if(!disarm&&!i.cancelled&&armed){const cmd=i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;if(cmd==='a')brake(s);else if(cmd!=='none')turn(s,cmd);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};
    const frozen=Math.min(dt,s.brakeRemaining);s.brakeRemaining=Math.max(0,s.brakeRemaining-frozen);if(s.brakeRemaining<config.timeEpsilon)s.brakeRemaining=0;
    s.moveClock+=dt-frozen;const interval=config.layouts[s.level].interval;if(s.moveClock+config.timeEpsilon>=interval){s.moveClock=Math.max(0,s.moveClock-interval);tick(s);}return s;
  }
  return Object.freeze({create,step,config});
});
