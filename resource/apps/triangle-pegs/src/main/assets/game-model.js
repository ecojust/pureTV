/* Triangle Pegs: six-direction triangular peg solitaire with finite recovery. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const copy=value=>JSON.parse(JSON.stringify(value));
 function freeze(value){if(value&&typeof value==='object'){Object.keys(value).forEach(k=>freeze(value[k]));Object.freeze(value);}return value;}
 const positions=[];for(let row=0;row<5;row++)for(let col=0;col<=row;col++)positions.push({index:positions.length,row,col,label:positions.length+1});
 const index=(row,col)=>row>=0&&row<5&&col>=0&&col<=row?row*(row+1)/2+col:-1;
 const jumps=[];
 for(const p of positions)for(const [dr,dc]of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1]]){
  const over=index(p.row+dr,p.col+dc),to=index(p.row+dr*2,p.col+dc*2);if(over>=0&&to>=0)jumps.push({from:p.index,over,to});
 }
 const config=freeze({defaultSeed:753,undoCredits:3,maxElapsed:86400,maxCounter:2147483647,positions,jumps,
  layouts:[{id:'corner-start',name:'CORNER START',nameZh:'顶角启局',blank:0},
   {id:'centre-gap',name:'CENTRE GAP',nameZh:'中层空位',blank:4},
   {id:'lower-turn',name:'LOWER TURN',nameZh:'侧翼回旋',blank:7}]});
 function legal(occupied){return config.jumps.filter(j=>occupied[j.from]&&occupied[j.over]&&!occupied[j.to]).map(j=>({from:j.from,over:j.over,to:j.to}));}
 function create(seed,level){
  seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
  level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;
  const blank=config.layouts[level].blank,occupied=Array(15).fill(true);occupied[blank]=false;
  return{schema:1,seed,level,phase:'playing',reason:'',score:0,cursor:blank,source:null,occupied,pegsRemaining:14,
   legalJumps:legal(occupied),history:[],undoRemaining:3,jumpsMade:0,undosUsed:0,elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,
   inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
   message:'方向选孔，A 选珠后跳过邻珠到空孔；B 取消，未选珠时撤回。'};
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
  const p=config.positions[s.cursor];let row=p.row,col=p.col;
  if(command==='left')col=Math.max(0,col-1);else if(command==='right')col=Math.min(row,col+1);
  else if(command==='up'){row=Math.max(0,row-1);col=Math.min(col,row);}else if(command==='down')row=Math.min(4,row+1);
  const to=index(row,col);if(to===s.cursor)return blocked(s,'boundary','已到棋盘边缘，方向选择不消耗撤回次数。');
  const from=s.cursor;s.cursor=to;event(s,'cursor',{from,to});
  s.message='当前 '+(to+1)+' 号孔；'+(s.source===null?'A 选择有珠的孔。':'来源 '+(s.source+1)+' 号，选择标记空孔按 A 跳跃。');
 }
 function action(s){
  if(s.source===null){
   if(!s.occupied[s.cursor])return blocked(s,'empty-source','这是空孔；先选一颗棋珠按 A。');
   s.source=s.cursor;event(s,'source',{position:s.source});s.message='已选择 '+(s.source+1)+' 号珠；标记空孔可跳入，B 取消。';return;
  }
  const valid=legal(s.occupied),jump=valid.find(j=>j.from===s.source&&j.to===s.cursor);
  if(!jump)return blocked(s,'invalid-jump','必须沿直线跨过一颗邻珠，落入两格外的空孔；来源仍保留。');
  s.occupied[jump.from]=false;s.occupied[jump.over]=false;s.occupied[jump.to]=true;
  s.source=null;s.pegsRemaining--;s.jumpsMade++;s.history.push(copy(jump));s.legalJumps=legal(s.occupied);
  const won=s.pegsRemaining===1,lost=!won&&!s.legalJumps.length&&!(s.undoRemaining>0&&s.history.length>0);
  const details={from:jump.from,over:jump.over,to:jump.to,pegsRemaining:s.pegsRemaining};
  if(won||lost){
   s.phase=won?'won':'lost';s.reason=won?'':'dead-end';s.score=won?100:0;
   event(s,won?'win':'collision',won?details:Object.assign({reason:'dead-end'},details));
   s.message=won?'只剩一颗棋珠，三角棋盘解开了。':'已无合法跳跃且撤回次数耗尽，本局结束。';
   s.terminalReceipt=copy({cause:won?'success':'dead-end',call:s.calls,elapsed:s.elapsed,level:s.level,cursor:s.cursor,source:s.source,
    occupied:s.occupied,pegsRemaining:s.pegsRemaining,undoRemaining:s.undoRemaining,jumpsMade:s.jumpsMade,undosUsed:s.undosUsed,
    score:s.score,phase:s.phase,reason:s.reason});
  }else{
   event(s,'jump',details);s.message=s.legalJumps.length?'跳跃完成，剩余 '+s.pegsRemaining+' 颗；可继续选择棋珠。':'当前没有合法跳跃；按 B 撤回上一步，重新安排。';
  }
 }
 function back(s){
  if(s.source!==null){const position=s.source;s.source=null;event(s,'cancel',{position});s.message='已取消选珠，不消耗撤回次数。';return;}
  if(!s.history.length)return blocked(s,'no-history','还没有可撤回的跳跃，不消耗次数。');
  if(s.undoRemaining<=0)return blocked(s,'no-undo','撤回次数已用尽；仍可继续合法跳跃。');
  const jump=s.history.pop();s.occupied[jump.from]=true;s.occupied[jump.over]=true;s.occupied[jump.to]=false;
  s.cursor=jump.from;s.pegsRemaining++;s.undoRemaining--;s.undosUsed++;s.legalJumps=legal(s.occupied);
  event(s,'undo',{from:jump.from,over:jump.over,to:jump.to,undoRemaining:s.undoRemaining});
  s.message='已恢复上一步，剩余 '+s.undoRemaining+' 次撤回；重新选择棋珠。';
 }
 function step(s,dt,raw){
  if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
  const input=normalized(raw);if(input.paused)return s;
  const dir=direction(input),old=s.lastHeld,armed=s.inputArmed;
  const disarm=(input.cancelEpoch!==null&&s.cancelEpoch!==null&&input.cancelEpoch!==s.cancelEpoch)||(input.cancelled&&!s.cancelledLast);
  s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);
  const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
  if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;s.cancelledLast=input.cancelled;if(disarm)s.inputArmed=false;
  if(!disarm&&!input.cancelled&&armed){
   const command=input.b&&!old.b?'b':input.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=command;
   if(command==='b')back(s);else if(command==='a')action(s);else if(command!=='none')move(s,command);
  }
  if(!disarm&&!input.cancelled&&!input.a&&!input.b&&dir==='none')s.inputArmed=true;
  s.lastHeld={a:input.a,b:input.b,direction:dir};return s;
 }
 return Object.freeze({create,step,config});
});
