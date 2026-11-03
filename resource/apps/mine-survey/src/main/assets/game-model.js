/* Mine Survey: fixed deduction boards; unrevealed mine data is closure-private. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":759,"width":6,"height":6,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"copper-ridge","name":"COPPER RIDGE","nameZh":"铜丘台地","width":6,"height":6,"mineCount":5,"initialOpen":[20]},{"id":"riverbank","name":"RIVERBANK","nameZh":"溪岸旧矿","width":6,"height":6,"mineCount":6,"initialOpen":[5]},{"id":"basalt-slope","name":"BASALT SLOPE","nameZh":"玄岩坡地","width":6,"height":6,"mineCount":7,"initialOpen":[5]}]});
// Never copied into configuration, state, snapshots or playing-state events.
const authoredMines=freeze([[2,5,22,24,31],[8,19,22,31,32,33],[7,12,14,15,16,29,30]]),secrets=new WeakMap();
function adjacent(cell){const cells=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const x=cell%6+dx,y=Math.floor(cell/6)+dy;if(x>=0&&x<6&&y>=0&&y<6)cells.push(y*6+x);}return cells;}
function flood(s,cell){const hidden=secrets.get(s),queue=[cell],opened=[];while(queue.length){const i=queue.pop();if(s.cells[i]!==null||s.flags[i]||hidden[i]<0)continue;s.cells[i]=hidden[i];opened.push(i);if(hidden[i]===0)queue.push(...adjacent(i));}s.revealedSafe+=opened.length;return opened;}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level],mines=authoredMines[level];
 const hidden=Object.freeze(Array.from({length:36},(_,i)=>mines.includes(i)?-1:adjacent(i).filter(n=>mines.includes(n)).length));
 const s={schema:1,seed,level,phase:'playing',reason:'',score:0,width:6,height:6,mineCount:l.mineCount,safeTotal:36-l.mineCount,cells:Array(36).fill(null),flags:Array(36).fill(false),cursor:l.initialOpen[0],flagsUsed:0,revealedSafe:0,reveals:0,flagChanges:0,lastOpened:[],exploded:null,terminalReceipt:null,
 elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'初始安全区已打开；数字是周围八格的雷数。A 探开，B 插旗或收旗。'};
 secrets.set(s,hidden);l.initialOpen.forEach(i=>s.lastOpened.push(...flood(s,i)));return s;
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,won){
 s.phase=won?'won':'lost';s.reason=won?'':'mine';s.score=won?100:0;
 if(!won){const hidden=secrets.get(s);for(let i=0;i<36;i++)if(hidden[i]===-1)s.cells[i]=-1;}
 s.message=won?'全部安全棋格已勘明，测绘完成。':'触碰到地雷，本次勘探结束；根据可见数字重新推理。';
 event(s,won?'win':'collision',{reason:s.reason,cell:s.exploded});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,cells:s.cells,flags:s.flags,flagsUsed:s.flagsUsed,revealedSafe:s.revealedSafe,safeTotal:s.safeTotal,exploded:s.exploded,reveals:s.reveals});
}
function command(s,key){
 if(key==='a'){
  if(s.flags[s.cursor])return blocked(s,'flag-protected','旗标保护此格；先按 B 收旗，才能探开。');
  if(s.cells[s.cursor]!==null)return blocked(s,'already-open','此格已经显示线索。');
  s.reveals++;s.lastOpened=[];
  if(secrets.get(s)[s.cursor]===-1){s.exploded=s.cursor;finish(s,false);return;}
  s.lastOpened=flood(s,s.cursor);if(s.revealedSafe===s.safeTotal){finish(s,true);return;}
  event(s,'reveal',{cells:s.lastOpened.slice(),revealedSafe:s.revealedSafe});s.message='本次探开 '+s.lastOpened.length+' 格；仍有 '+(s.safeTotal-s.revealedSafe)+' 个安全格待勘明。';
 }else if(key==='b'){
  if(s.cells[s.cursor]!==null)return blocked(s,'already-open','已打开的格子不能插旗。');
  if(!s.flags[s.cursor]&&s.flagsUsed>=s.mineCount)return blocked(s,'flag-cap','旗标已达总雷数，先收回一面再放置。');
  s.flags[s.cursor]=!s.flags[s.cursor];s.flagsUsed+=s.flags[s.cursor]?1:-1;s.flagChanges=Math.min(config.maxCounter,s.flagChanges+1);event(s,'flag',{cell:s.cursor,flagged:s.flags[s.cursor],flagsUsed:s.flagsUsed});s.message=(s.flags[s.cursor]?'已插旗':'已收旗')+'；旗标只代表你的判断，不会验明雷位。';
 }else if(key!=='none'){
  const x=s.cursor%6,y=Math.floor(s.cursor/6),nx=Math.max(0,Math.min(5,x+(key==='right'?1:key==='left'?-1:0))),ny=Math.max(0,Math.min(5,y+(key==='down'?1:key==='up'?-1:0))),to=ny*6+nx;
  if(to===s.cursor)return blocked(s,'boundary','光标已到勘探区边缘。');const from=s.cursor;s.cursor=to;event(s,'select',{from,to});s.message='光标 '+String.fromCharCode(65+nx)+(ny+1)+'；A 探开，B 插旗或收旗。';
 }
}
function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
 try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
  for(const k of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,k);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[k]=d.value;}
  const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
  return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
 }catch(_){return neutral();}
}
function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);return x<=.5&&y<=.5?'none':y>=x?(i.y>0?'down':'up'):(i.x>0?'right':'left');}
function step(s,dt,raw){
 if(!secrets.has(s)||s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
 const i=normalized(raw);if(i.paused)return s;const dir=direction(i),old=s.lastHeld,armed=s.inputArmed;
 const disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
 s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;s.elapsedCapped=s.elapsedCapped||elapsed>config.maxElapsed;s.elapsed=Math.min(config.maxElapsed,elapsed);
 if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
 if(!disarm&&!i.cancelled&&armed){s.lastCommand=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';command(s,s.lastCommand);}
 if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
}
return Object.freeze({create,step,config});
});
