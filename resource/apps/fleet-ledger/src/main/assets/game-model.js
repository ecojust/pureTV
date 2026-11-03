/* Fleet Ledger: public row/column totals, straight separated ship components and manual checks. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":786,"initialAttempts":3,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"inlet-register","name":"INLET REGISTER","nameZh":"港湾清单","size":5,"fleet":[3,2,1],"rows":[0,3,0,2,1],"cols":[0,2,1,3,0],"givens":[0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0]},{"id":"channel-ledger","name":"CHANNEL LEDGER","nameZh":"航道账页","size":6,"fleet":[3,2,2,1],"rows":[0,1,3,1,2,1],"cols":[1,2,0,2,0,3],"givens":[0,0,0,0,0,0,0,0,0,0,0,2,0,2,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0]},{"id":"outer-anchorage","name":"OUTER ANCHORAGE","nameZh":"外海锚地","size":7,"fleet":[4,3,2,1,1],"rows":[4,0,2,2,1,1,1],"cols":[1,4,1,1,3,1,0],"givens":[0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0]}]});
function neighbours(cell,n,diagonal){const out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(diagonal?Math.abs(dx)!==1||Math.abs(dy)!==1:Math.abs(dx)+Math.abs(dy)!==1)continue;const x=cell%n+dx,y=Math.floor(cell/n)+dy;if(x>=0&&x<n&&y>=0&&y<n)out.push(y*n+x);}return out;}
function refresh(s){
 const n=s.size;s.rowCounts=Array(n).fill(0);s.colCounts=Array(n).fill(0);s.unknown=0;s.shipCells=0;s.seaCells=0;
 s.marks.forEach((v,c)=>{if(v===0)s.unknown++;else if(v===1){s.shipCells++;s.rowCounts[Math.floor(c/n)]++;s.colCounts[c%n]++;}else s.seaCells++;});
 const componentOf=Array(n*n).fill(-1);s.components=[];
 for(let start=0;start<n*n;start++)if(s.marks[start]===1&&componentOf[start]<0){const id=s.components.length,cells=[start];componentOf[start]=id;for(let at=0;at<cells.length;at++)for(const to of neighbours(cells[at],n,false))if(s.marks[to]===1&&componentOf[to]<0){componentOf[to]=id;cells.push(to);}cells.sort((a,b)=>a-b);const sameRow=cells.every(c=>Math.floor(c/n)===Math.floor(cells[0]/n)),sameCol=cells.every(c=>c%n===cells[0]%n);s.components.push({id,cells,length:cells.length,straight:sameRow||sameCol,orientation:cells.length===1?'single':sameRow?'H':sameCol?'V':'bent'});}
 s.actualFleet=s.components.map(c=>c.length).sort((a,b)=>b-a);s.diagonalContacts=[];
 for(let cell=0;cell<n*n;cell++)if(s.marks[cell]===1)for(const to of neighbours(cell,n,true))if(to>cell&&s.marks[to]===1&&componentOf[to]!==componentOf[cell])s.diagonalContacts.push([cell,to]);
}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];
 const s={schema:1,seed,level,size:l.size,fleet:l.fleet.slice().sort((a,b)=>b-a),rows:l.rows.slice(),cols:l.cols.slice(),givens:l.givens.slice(),marks:l.givens.slice(),cursor:0,rowCounts:[],colCounts:[],unknown:0,shipCells:0,seaCells:0,components:[],actualFleet:[],diagonalContacts:[],phase:'playing',reason:'',score:0,edits:0,editVersion:0,attemptsLeft:config.initialAttempts,checks:0,incompleteChecks:0,lastCheck:null,lastCheckCurrent:false,checkReceipts:[],terminalReceipt:null,
  elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'A 循环未知、船、海；先填完所有格，B 检查行列总数、直线船和舰队长度。'};
 refresh(s);return s;
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,won){
 s.phase=won?'won':'lost';s.reason=won?'':'checks';s.score=won?100:0;s.message=won?'行列账目、舰队长度和船间距离全部吻合。':'三次完整检查已用完，舰队账册仍有矛盾。';event(s,won?'win':'collision',{reason:s.reason});
 s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,marks:s.marks,rowCounts:s.rowCounts,colCounts:s.colCounts,actualFleet:s.actualFleet,components:s.components,diagonalContacts:s.diagonalContacts,checks:s.checks,attemptsLeft:s.attemptsLeft,lastCheck:s.lastCheck});
}
function check(s){
 const complete=s.unknown===0,rowsExact=s.rows.every((v,i)=>v===s.rowCounts[i]),colsExact=s.cols.every((v,i)=>v===s.colCounts[i]),straight=s.components.every(c=>c.straight),noTouch=s.diagonalContacts.length===0,fleetExact=s.actualFleet.length===s.fleet.length&&s.actualFleet.every((v,i)=>v===s.fleet[i]);
 s.lastCheck={complete,rowsExact,colsExact,straight,noTouch,fleetExact,matched:complete&&rowsExact&&colsExact&&straight&&noTouch&&fleetExact,unknown:s.unknown,actualFleet:s.actualFleet.slice(),rowCounts:s.rowCounts.slice(),colCounts:s.colCounts.slice(),components:copy(s.components),diagonalContacts:copy(s.diagonalContacts),editVersion:s.editVersion,charged:complete};s.lastCheckCurrent=true;
 if(!complete){s.incompleteChecks=Math.min(config.maxCounter,s.incompleteChecks+1);event(s,'incomplete',{unknown:s.unknown});s.message='还有 '+s.unknown+' 格未知，请标成船或海；本次免费提示，不消耗检查机会。';return;}
 s.checks++;s.attemptsLeft--;s.checkReceipts.push({marks:s.marks.slice(),result:copy(s.lastCheck)});if(s.lastCheck.matched)return finish(s,true);if(!s.attemptsLeft)return finish(s,false);event(s,'check',copy(s.lastCheck));s.message='完整图检查未通过；还有 '+s.attemptsLeft+' 次机会，请核对右侧各项。';
}
function command(s,key){
 if(key==='a'){
  if(s.givens[s.cursor]!==0)return blocked(s,'fixed','金色固定点是公开线索，不能修改。');
  s.marks[s.cursor]=(s.marks[s.cursor]+1)%3;s.edits=Math.min(config.maxCounter,s.edits+1);s.editVersion=Math.min(config.maxCounter,s.editVersion+1);s.lastCheckCurrent=false;refresh(s);event(s,'edit',{cell:s.cursor,mark:s.marks[s.cursor]});s.message=s.marks[s.cursor]===1?'已记为船格。':s.marks[s.cursor]===2?'已记为海格。':'已恢复未知格。';return;
 }
 if(key==='b')return check(s);if(key==='none')return;
 const x=s.cursor%s.size,y=Math.floor(s.cursor/s.size),nx=Math.max(0,Math.min(s.size-1,x+(key==='right'?1:key==='left'?-1:0))),ny=Math.max(0,Math.min(s.size-1,y+(key==='down'?1:key==='up'?-1:0))),to=ny*s.size+nx;
 if(to===s.cursor)return blocked(s,'boundary','光标已到海图边缘。');const from=s.cursor;s.cursor=to;event(s,'cursor',{from,to});s.message='A 循环未知、船、海；B 在填完后消耗一次检查。';
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
