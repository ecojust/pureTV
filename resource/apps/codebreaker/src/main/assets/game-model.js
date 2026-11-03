/* Codebreaker: aggregate multiset feedback; codes remain private until settlement. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const copy=value=>JSON.parse(JSON.stringify(value)),privateCodes=new WeakMap();
 function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
 const config=freeze({defaultSeed:761,slots:4,maxElapsed:86400,maxCounter:2147483647,
  layouts:[{id:'quartet-code',name:'FOUR SYMBOLS',nameZh:'四纹密匣',symbols:4,attemptLimit:7},
   {id:'quintet-code',name:'FIVE SYMBOLS',nameZh:'五纹密匣',symbols:5,attemptLimit:8},
   {id:'sextet-code',name:'SIX SYMBOLS',nameZh:'六纹密匣',symbols:6,attemptLimit:9}]});
 function create(seed,level){
  seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
  level=Number.isInteger(level)&&level>=0&&level<3?level:0;
  const layout=config.layouts[level],secret=[];let bits=(seed^Math.imul(0x9e3779b9,level+1))>>>0;
  if(bits===0)bits=0x6d2b79f5;
  for(let i=0;i<config.slots;i++){bits^=bits<<13;bits^=bits>>>17;bits^=bits<<5;secret.push((bits>>>0)%layout.symbols);}
  const s={schema:1,seed,level,phase:'playing',reason:'',score:0,cursor:0,guess:[null,null,null,null],history:[],
   attemptsUsed:0,attemptsRemaining:layout.attemptLimit,reveal:null,edits:0,clears:0,elapsed:0,elapsedCapped:false,calls:0,
   blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},
   lastCommand:'none',events:[],terminalReceipt:null,message:'左右选格，上下换符号；填满四格后 A 提交，B 清空当前格。'};
  privateCodes.set(s,secret);return s;
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
  if(command==='left'||command==='right'){
   const from=s.cursor,to=Math.max(0,Math.min(3,from+(command==='right'?1:-1)));
   if(from===to)return blocked(s,'boundary','已到四格边缘，选择不消耗猜测次数。');
   s.cursor=to;event(s,'cursor',{from,to});s.message='当前第 '+(to+1)+' 格；上下换符号，A 提交全部四格。';return;
  }
  const symbols=config.layouts[s.level].symbols,from=s.guess[s.cursor];
  const to=from===null?(command==='up'?0:symbols-1):(from+(command==='up'?1:symbols-1))%symbols;
  s.guess[s.cursor]=to;s.edits=Math.min(config.maxCounter,s.edits+1);event(s,'edit',{position:s.cursor,from,to});
  s.message='第 '+(s.cursor+1)+' 格设为 '+(to+1)+' 号符号；重复符号允许。';
 }
 function clear(s){
  const from=s.guess[s.cursor];if(from===null)return blocked(s,'empty-slot','当前格已经为空，不消耗猜测次数。');
  s.guess[s.cursor]=null;s.clears=Math.min(config.maxCounter,s.clears+1);event(s,'clear',{position:s.cursor,from});s.message='已清空第 '+(s.cursor+1)+' 格；猜测记录保持不变。';
 }
 function submit(s){
  if(s.guess.some(v=>v===null))return blocked(s,'incomplete','请先填满全部四格；未消耗猜测次数，也没有反馈。');
  const secret=privateCodes.get(s),symbols=config.layouts[s.level].symbols,left=Array(symbols).fill(0),right=Array(symbols).fill(0);
  let exact=0;for(let i=0;i<4;i++){if(s.guess[i]===secret[i])exact++;else{left[secret[i]]++;right[s.guess[i]]++;}}
  let misplaced=0;for(let i=0;i<symbols;i++)misplaced+=Math.min(left[i],right[i]);
  s.attemptsUsed++;s.attemptsRemaining--;s.history.push({guess:s.guess.slice(),exact,misplaced,attempt:s.attemptsUsed});
  const won=exact===4,lost=!won&&s.attemptsRemaining===0;
  if(won||lost){
   s.phase=won?'won':'lost';s.reason=won?'':'attempts';s.score=won?100:0;s.reveal=secret.slice();
   event(s,won?'win':'collision',won?{attempt:s.attemptsUsed,exact,misplaced}:{reason:'attempts',attempt:s.attemptsUsed,exact,misplaced});
   s.message=won?'四个符号与位置全部吻合，密纹已破译。':'猜测次数用尽；密纹已揭示，可重新挑战。';
   s.terminalReceipt=copy({cause:won?'success':'attempts',call:s.calls,elapsed:s.elapsed,level:s.level,cursor:s.cursor,guess:s.guess,
    attemptsUsed:s.attemptsUsed,attemptsRemaining:s.attemptsRemaining,reveal:s.reveal,score:s.score,phase:s.phase,reason:s.reason});
  }else{event(s,'feedback',{attempt:s.attemptsUsed,exact,misplaced,attemptsRemaining:s.attemptsRemaining});
   s.message='位置与符号全对 '+exact+' 个，符号正确但位置不同 '+misplaced+' 个；剩余 '+s.attemptsRemaining+' 次。';}
 }
 function step(s,dt,raw){
  if(!privateCodes.has(s))return s;
  if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
  const input=normalized(raw);if(input.paused)return s;
  const dir=direction(input),old=s.lastHeld,armed=s.inputArmed,disarm=(input.cancelEpoch!==null&&s.cancelEpoch!==null&&input.cancelEpoch!==s.cancelEpoch)||(input.cancelled&&!s.cancelledLast);
  s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
  if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;s.cancelledLast=input.cancelled;if(disarm)s.inputArmed=false;
  if(!disarm&&!input.cancelled&&armed){const command=input.b&&!old.b?'b':input.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=command;
   if(command==='b')clear(s);else if(command==='a')submit(s);else if(command!=='none')move(s,command);}
  if(!disarm&&!input.cancelled&&!input.a&&!input.b&&dir==='none')s.inputArmed=true;
  s.lastHeld={a:input.a,b:input.b,direction:dir};return s;
 }
 return Object.freeze({create,step,config});
});
