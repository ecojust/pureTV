/* Skyline Numbers: all puzzle data is public givens and directional edge clues. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":762,"maxChecks":3,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"courtyard-city","name":"COURTYARD CITY","nameZh":"庭院小城","size":4,"fixed":[0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"clues":{"top":[2,0,0,0],"right":[0,2,0,1],"bottom":[0,4,3,1],"left":[0,3,0,2]}},{"id":"canal-city","name":"CANAL CITY","nameZh":"运河新城","size":5,"fixed":[1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"clues":{"top":[0,0,1,0,0],"right":[0,0,3,1,0],"bottom":[2,2,4,1,2],"left":[0,0,0,3,2]}},{"id":"terrace-city","name":"TERRACE CITY","nameZh":"台地都会","size":6,"fixed":[0,6,0,2,0,4,0,0,0,0,0,0,0,1,0,0,0,6,6,5,0,1,0,0,0,3,0,0,2,0,0,0,0,0,0,0],"clues":{"top":[0,1,2,4,0,2],"right":[0,0,1,5,2,3],"bottom":[0,0,0,0,2,3],"left":[0,0,4,0,0,2]}}]});
function visible(line){let highest=0,count=0;for(const value of line)if(value>highest){highest=value;count++;}return count;}
function lines(s){const n=s.size;return {rows:Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>r*n+c)),cols:Array.from({length:n},(_,c)=>Array.from({length:n},(_,r)=>r*n+c))};}
function refresh(s){
 const groups=lines(s),vis={top:[],right:[],bottom:[],left:[]};s.conflicts=Array(s.board.length).fill(false);s.filled=s.board.filter(v=>v!==0).length;
 for(const ids of [...groups.rows,...groups.cols]){for(const i of ids)if(s.board[i]&&ids.some(j=>j!==i&&s.board[j]===s.board[i]))s.conflicts[i]=true;}
 const count=a=>a.includes(0)?null:visible(a);
 for(let i=0;i<s.size;i++){const row=groups.rows[i].map(j=>s.board[j]),col=groups.cols[i].map(j=>s.board[j]);vis.left.push(count(row));vis.right.push(count(row.slice().reverse()));vis.top.push(count(col));vis.bottom.push(count(col.slice().reverse()));}s.visibility=vis;
}
function report(s){
 const n=s.size,l=config.layouts[s.level],groups=lines(s),complete=s.board.every(v=>Number.isInteger(v)&&v>=1&&v<=n);
 const latin=complete&&[...groups.rows,...groups.cols].every(ids=>new Set(ids.map(i=>s.board[i])).size===n);
 let edges=complete;
 if(complete)for(let i=0;i<n;i++){const row=groups.rows[i].map(j=>s.board[j]),col=groups.cols[i].map(j=>s.board[j]);for(const [side,a]of [['left',row],['right',row.slice().reverse()],['top',col],['bottom',col.slice().reverse()]])if(l.clues[side][i]&&visible(a)!==l.clues[side][i])edges=false;}
 return {complete,latin,edges,matched:complete&&latin&&edges};
}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];
 const s={schema:1,seed,level,phase:'playing',reason:'',score:0,size:l.size,board:l.fixed.slice(),givens:l.fixed.slice(),clues:copy(l.clues),cursor:0,attemptsLeft:config.maxChecks,checks:0,edits:0,filled:0,conflicts:[],visibility:null,lastCheck:null,checkReceipts:[],terminalReceipt:null,
 elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'每行每列填入不同楼高；A 调楼高，B 用一次机会按四边线索验收。'};refresh(s);return s;
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function check(s){
 refresh(s);const result=report(s),before=s.attemptsLeft;s.attemptsLeft--;s.checks++;s.lastCheck=copy(result);const outcome=result.matched?'won':s.attemptsLeft===0?'lost':'reject';
 s.checkReceipts.push({index:s.checkReceipts.length,board:s.board.slice(),report:copy(result),attemptsBefore:before,attemptsAfter:s.attemptsLeft,outcome});
 if(outcome==='reject'){event(s,'reject',{report:copy(result),attemptsLeft:s.attemptsLeft});s.message='验收未通过：'+(!result.complete?'尚有空格。':!result.latin?'行列存在重复楼高。':'边缘可见楼数不匹配。')+'剩余 '+s.attemptsLeft+' 次机会。';return;}
 s.phase=outcome;s.reason=outcome==='won'?'':'checks';s.score=outcome==='won'?100:0;s.message=outcome==='won'?'行列高度与四边视野全部合格，城市验收通过。':'三次验收机会已用完，请重新规划城市。';event(s,outcome==='won'?'win':'collision',{reason:s.reason});
 s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,board:s.board,attemptsLeft:s.attemptsLeft,checks:s.checks,report:result});
}
function command(s,key){
 if(key==='a'){
  if(config.layouts[s.level].fixed[s.cursor])return blocked(s,'fixed','铜色底座标记的固定楼高不可修改。');
  const from=s.board[s.cursor];s.board[s.cursor]=(from+1)%(s.size+1);s.edits=Math.min(config.maxCounter,s.edits+1);s.lastCheck=null;refresh(s);event(s,'edit',{cell:s.cursor,from,to:s.board[s.cursor]});s.message='本格楼高 '+(s.board[s.cursor]||'空')+'；A 继续循环，B 验收会消耗一次机会。';
 }else if(key==='b')check(s);
 else if(key!=='none'){
  const x=s.cursor%s.size,y=Math.floor(s.cursor/s.size),nx=Math.max(0,Math.min(s.size-1,x+(key==='right'?1:key==='left'?-1:0))),ny=Math.max(0,Math.min(s.size-1,y+(key==='down'?1:key==='up'?-1:0))),to=ny*s.size+nx;
  if(to===s.cursor)return blocked(s,'boundary','光标已在城市边缘。');const from=s.cursor;s.cursor=to;event(s,'select',{from,to});s.message='已选择 '+(ny+1)+' 行 '+(nx+1)+' 列；A 调整高度，B 验收城市。';
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
 if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
 const i=normalized(raw);if(i.paused)return s;const dir=direction(i),old=s.lastHeld,armed=s.inputArmed;
 const disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
 s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;s.elapsedCapped=s.elapsedCapped||elapsed>config.maxElapsed;s.elapsed=Math.min(config.maxElapsed,elapsed);
 if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
 if(!disarm&&!i.cancelled&&armed){s.lastCommand=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';command(s,s.lastCommand);}
 if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
}
return Object.freeze({create,step,config});
});
