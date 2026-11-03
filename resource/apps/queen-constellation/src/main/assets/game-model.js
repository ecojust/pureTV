/* Queen Constellation: visible blocked/fixed clues and explicit N-queens checks. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const copy=value=>JSON.parse(JSON.stringify(value));
 function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
 const config=freeze({defaultSeed:757,checkLimit:3,maxElapsed:86400,maxCounter:2147483647,
  layouts:[{id:'aurora-six',name:'AURORA SIX',nameZh:'六芒初航',size:6,blocked:[0,5,14],fixed:[]},
   {id:'orbit-seven',name:'ORBIT SEVEN',nameZh:'七曜轨道',size:7,blocked:[0,6,42,48,24],fixed:[22]},
   {id:'eclipse-eight',name:'ECLIPSE EIGHT',nameZh:'八方星域',size:8,blocked:[0,7,56,63,27],fixed:[20,40]}]});
 function derive(s){
  const l=config.layouts[s.level],positions=[];for(let i=0;i<s.queens.length;i++)if(s.queens[i])positions.push(i);
  const conflicts=[];for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
   const a=positions[i],b=positions[j],ar=Math.floor(a/l.size),ac=a%l.size,br=Math.floor(b/l.size),bc=b%l.size;
   const kind=ar===br?'row':ac===bc?'column':Math.abs(ar-br)===Math.abs(ac-bc)?'diagonal':null;if(kind)conflicts.push({a,b,kind});
  }
  s.queenCount=positions.length;s.movableCount=positions.filter(i=>!l.fixed.includes(i)).length;s.conflicts=conflicts;
  s.canSubmit=s.queenCount===l.size&&!conflicts.length&&l.fixed.every(i=>s.queens[i])&&l.blocked.every(i=>!s.queens[i]);
 }
 function create(seed,level){
  seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;
  const l=config.layouts[level],queens=Array(l.size*l.size).fill(false);l.fixed.forEach(i=>{queens[i]=true;});
  const s={schema:1,seed,level,phase:'playing',reason:'',score:0,cursor:0,queens,queenCount:0,movableCount:0,conflicts:[],canSubmit:false,
   checksRemaining:3,submissions:0,placements:0,removals:0,elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,
   cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],checkReceipts:[],terminalReceipt:null,
   message:'方向选择格子，A 放置或移除皇后；摆好后按 B 提交。'};derive(s);return s;
 }
 function normalized(raw){
  const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
  try{
   if(!raw||typeof raw!=='object'||Array.isArray(raw))return neutral();const values=Object.create(null);
   for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(raw,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))values[key]=d.value;}
   const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
   return{x:axis(values.x),y:axis(values.y),a:values.a===true,b:values.b===true,cancelled:values.cancelled===true,paused:values.paused===true,
    cancelEpoch:Number.isSafeInteger(values.cancelEpoch)&&values.cancelEpoch>=0?values.cancelEpoch:null};
  }catch(_){return neutral();}
 }
 function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
 function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
 function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
 function move(s,command){
  const n=config.layouts[s.level].size,row=Math.floor(s.cursor/n),col=s.cursor%n;
  const nextRow=Math.max(0,Math.min(n-1,row+(command==='down'?1:command==='up'?-1:0))),nextCol=Math.max(0,Math.min(n-1,col+(command==='right'?1:command==='left'?-1:0)));
  const to=nextRow*n+nextCol;if(to===s.cursor)return blocked(s,'boundary','已到星盘边缘，移动不消耗检查次数。');
  const from=s.cursor;s.cursor=to;event(s,'cursor',{from,to});s.message='当前第 '+(nextRow+1)+' 行、第 '+(nextCol+1)+' 列；A 放置或移除，B 提交。';
 }
 function toggle(s){
  const l=config.layouts[s.level],position=s.cursor;
  if(l.fixed.includes(position))return blocked(s,'fixed','这是固定皇后，不能移除；不消耗检查次数。');
  if(l.blocked.includes(position))return blocked(s,'forbidden','这是禁放格，不能放置皇后；不消耗检查次数。');
  if(s.queens[position]){s.queens[position]=false;s.removals=Math.min(config.maxCounter,s.removals+1);derive(s);event(s,'remove',{position,queenCount:s.queenCount});s.message='已移除皇后；剩余 '+s.queenCount+'/'+l.size+' 枚。';return;}
  const movable=s.queens.reduce((n,value,i)=>n+(value&&!l.fixed.includes(i)?1:0),0);
  if(movable>=l.size-l.fixed.length)return blocked(s,'queen-limit','皇后数量已达上限；先移除一枚再调整。');
  s.queens[position]=true;s.placements=Math.min(config.maxCounter,s.placements+1);derive(s);event(s,'place',{position,queenCount:s.queenCount});
  s.message=s.canSubmit?'数量与攻击条件均符合；按 B 提交星盘。':'已放置皇后；共 '+s.queenCount+'/'+l.size+' 枚，冲突 '+s.conflicts.length+' 对。';
 }
 function submit(s){
  derive(s);const checksBefore=s.checksRemaining;s.checksRemaining--;s.submissions++;
  const matched=s.canSubmit,outcome=matched?'won':s.checksRemaining===0?'lost':'playing';
  s.checkReceipts.push(copy({index:s.checkReceipts.length,call:s.calls,queens:s.queens,queenCount:s.queenCount,movableCount:s.movableCount,
   conflicts:s.conflicts,matched,checksBefore,checksAfter:s.checksRemaining,outcome}));
  if(outcome!=='playing'){
   s.phase=outcome;s.reason=matched?'':'checks';s.score=matched?100:0;
   event(s,matched?'win':'collision',matched?{queenCount:s.queenCount,checksRemaining:s.checksRemaining}:{reason:'checks',queenCount:s.queenCount,conflictCount:s.conflicts.length});
   s.message=matched?'所有皇后互不攻击，星盘校准完成。':'三次检查均未通过；重新安排皇后后再试。';
   s.terminalReceipt=copy({cause:matched?'success':'checks',call:s.calls,elapsed:s.elapsed,level:s.level,cursor:s.cursor,queens:s.queens,
    queenCount:s.queenCount,movableCount:s.movableCount,conflicts:s.conflicts,checksRemaining:s.checksRemaining,submissions:s.submissions,
    score:s.score,phase:s.phase,reason:s.reason});
  }else{event(s,'reject',{queenCount:s.queenCount,conflictCount:s.conflicts.length,checksRemaining:s.checksRemaining});
   s.message='检查未通过：数量 '+s.queenCount+'/'+config.layouts[s.level].size+'，冲突 '+s.conflicts.length+' 对；剩余 '+s.checksRemaining+' 次检查。';}
 }
 function step(s,dt,raw){
  if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
  const input=normalized(raw);if(input.paused)return s;
  const dir=direction(input),old=s.lastHeld,armed=s.inputArmed,disarm=(input.cancelEpoch!==null&&s.cancelEpoch!==null&&input.cancelEpoch!==s.cancelEpoch)||(input.cancelled&&!s.cancelledLast);
  s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
  if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;s.cancelledLast=input.cancelled;if(disarm)s.inputArmed=false;
  if(!disarm&&!input.cancelled&&armed){const command=input.b&&!old.b?'b':input.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=command;
   if(command==='b')submit(s);else if(command==='a')toggle(s);else if(command!=='none')move(s,command);}
  if(!disarm&&!input.cancelled&&!input.a&&!input.b&&dir==='none')s.inputArmed=true;
  s.lastHeld={a:input.a,b:input.b,direction:dir};return s;
 }
 return Object.freeze({create,step,config});
});
