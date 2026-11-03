/* Merge Tiles: edge-ordered, once-per-move merges with a public deterministic spawn. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({width:4,height:4,defaultSeed:766,spawnValues:[2,2,4,2,2,2,4,2],spawnStride:7,undoTickets:2,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'amber32',name:'AMBER 32',nameZh:'琥珀初聚',cells:[2,0,0,2,0,0,0,0,0,0,0,0,2,0,0,2],target:32,moveLimit:30},
    {id:'jade64',name:'JADE 64',nameZh:'青玉汇合',cells:[8,0,4,0,0,2,0,8,4,0,2,0,0,8,0,4],target:64,moveLimit:40},
    {id:'cobalt128',name:'COBALT 128',nameZh:'钴蓝高阶',cells:[32,0,4,0,0,8,0,32,4,0,8,0,0,16,0,0],target:128,moveLimit:55}
  ]});
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level];
    return {schema:1,seed,level,phase:'playing',reason:'',score:0,cells:l.cells.slice(),target:l.target,moveLimit:l.moveLimit,movesUsed:0,points:0,spawnIndex:0,nextSpawnValue:2,
      undoTickets:2,undos:0,history:[],lastSpawn:null,lastMerges:[],elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,
      lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,message:'四向滑动整盘数字，相同数字合并一次；A 撤回但不退步数，每局两张撤回券。'};}
  function slide(cells,dir){const next=Array(16).fill(0),merges=[];let mergePoints=0;
    for(let lane=0;lane<4;lane++){const ids=Array.from({length:4},(_,k)=>dir==='left'?lane*4+k:dir==='right'?lane*4+3-k:dir==='up'?k*4+lane:(3-k)*4+lane);
      const values=ids.map(i=>cells[i]).filter(v=>v!==0),out=[];
      for(let k=0;k<values.length;k++){if(values[k]===values[k+1]){const value=values[k]*2;merges.push({index:ids[out.length],value});out.push(value);mergePoints+=value;k++;}else out.push(values[k]);}
      ids.forEach((index,k)=>next[index]=out[k]||0);
    }
    return {cells:next,merges,mergePoints,changed:next.some((v,i)=>v!==cells[i])};
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{
    if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){
      const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=reason==='no-change'?'这一方向没有改变棋盘，不扣步数也不生新块。':reason==='no-history'?'没有可撤回的有效滑动。':'两张撤回券已用完。';}
  function settle(s,cause,detail){s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':cause;s.score=cause==='success'?100:0;
    event(s,cause==='success'?'win':'collision',cause==='success'?detail:{reason:cause});s.message=cause==='success'?'目标数字已汇聚完成。':cause==='stuck'?'棋盘已无合法滑动，本局结束。':'有效滑动额度已用尽，尚未形成目标数字。';
    s.terminalReceipt=copy({cause,level:s.level,call:s.calls,elapsed:s.elapsed,cells:s.cells,movesUsed:s.movesUsed,points:s.points,spawnIndex:s.spawnIndex,lastSpawn:s.lastSpawn,undoTickets:s.undoTickets,score:s.score,phase:s.phase,reason:s.reason});}
  function move(s,dir){const next=slide(s.cells,dir);if(!next.changed)return blocked(s,'no-change');
    s.history.push(copy({cells:s.cells,spawnIndex:s.spawnIndex,points:s.points,lastSpawn:s.lastSpawn,lastMerges:s.lastMerges}));
    s.cells=next.cells;s.movesUsed++;s.points+=next.mergePoints;s.lastMerges=next.merges;s.lastSpawn=null;const detail={direction:dir,mergePoints:next.mergePoints,movesUsed:s.movesUsed},l=config.layouts[s.level];
    if(s.cells.some(v=>v>=l.target))return settle(s,'success',detail);
    const empty=s.cells.flatMap((v,i)=>v===0?[i]:[]),index=empty[(s.seed+s.spawnIndex*config.spawnStride)%empty.length],value=config.spawnValues[s.spawnIndex%config.spawnValues.length];
    s.cells[index]=value;s.lastSpawn={index,value};s.spawnIndex++;s.nextSpawnValue=config.spawnValues[s.spawnIndex%config.spawnValues.length];
    if(!['left','right','up','down'].some(d=>slide(s.cells,d).changed))return settle(s,'stuck');
    if(s.movesUsed>=l.moveLimit)return settle(s,'moves');
    event(s,'slide',Object.assign(detail,{spawn:copy(s.lastSpawn)}));s.message='已滑动并加入 '+value+'；本步合并得分 '+next.mergePoints+'，剩余 '+(l.moveLimit-s.movesUsed)+' 步。';
  }
  function undo(s){if(!s.history.length)return blocked(s,'no-history');if(!s.undoTickets)return blocked(s,'no-tickets');const old=s.history.pop();
    s.cells=old.cells.slice();s.spawnIndex=old.spawnIndex;s.points=old.points;s.lastSpawn=copy(old.lastSpawn);s.lastMerges=copy(old.lastMerges);s.nextSpawnValue=config.spawnValues[s.spawnIndex%config.spawnValues.length];s.undoTickets--;s.undos++;
    event(s,'undo',{movesUsed:s.movesUsed,tickets:s.undoTickets});s.message='已撤回棋盘与出块位置；已用 '+s.movesUsed+' 步不返还。';}
  function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;if(cmd==='a')undo(s);else if(cmd!=='none')move(s,cmd);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
