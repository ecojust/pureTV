/* Tetro Islands: public region geometry, free tetromino constraints and explicit checks. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":789,"initialAttempts":3,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"river-bends","name":"RIVER BENDS","nameZh":"河弯岛群","size":5,"regionCount":3,"regions":[2,2,2,2,2,1,1,1,2,2,1,0,1,2,0,1,0,1,1,0,0,0,0,0,0]},{"id":"delta-chain","name":"DELTA CHAIN","nameZh":"三角洲链","size":6,"regionCount":4,"regions":[1,0,0,0,2,2,1,1,1,0,2,2,1,1,1,0,2,3,1,1,1,0,2,3,1,1,1,3,3,3,3,3,3,3,3,3]},{"id":"highland-links","name":"HIGHLAND LINKS","nameZh":"高地群岛","size":7,"regionCount":6,"regions":[5,0,0,0,0,0,0,5,0,2,2,2,2,0,5,5,5,2,1,2,1,4,4,5,2,1,1,1,4,3,3,2,1,1,1,4,4,3,3,1,1,3,4,4,3,3,3,3,3]}]});
function neighbours(c,n){const x=c%n,y=Math.floor(c/n);return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&a<n&&b>=0&&b<n).map(([a,b])=>b*n+a);}
function connected(cells,n){if(!cells.length)return false;const allowed=new Set(cells),seen=new Set([cells[0]]),queue=[cells[0]];for(let i=0;i<queue.length;i++)for(const to of neighbours(queue[i],n))if(allowed.has(to)&&!seen.has(to)){seen.add(to);queue.push(to);}return seen.size===allowed.size;}
// Classify a connected four-cell figure by its bounding box and internal vertices.
// A straight internal vertex distinguishes L/J from the two bent vertices of S/Z.
function shape(cells,n){if(cells.length!==4||!connected(cells,n))return 'invalid';const xs=cells.map(c=>c%n),ys=cells.map(c=>Math.floor(c/n)),w=Math.max(...xs)-Math.min(...xs)+1,h=Math.max(...ys)-Math.min(...ys)+1;
 if(w===4||h===4)return 'I';if(w===2&&h===2)return 'O';const set=new Set(cells),edges=cells.map(c=>neighbours(c,n).filter(v=>set.has(v)));if(edges.some(e=>e.length===3))return 'T';return edges.some(e=>e.length===2&&(e[0]%n===e[1]%n||Math.floor(e[0]/n)===Math.floor(e[1]/n)))?'L':'S';
}
function refresh(s){
 const n=s.size;s.black=[];s.unknown=0;s.whiteCells=0;s.marks.forEach((v,c)=>{if(v===1)s.black.push(c);else if(v===0)s.unknown++;else s.whiteCells++;});s.blackCells=s.black.length;
 s.regionCells=Array.from({length:s.regionCount},(_,id)=>s.black.filter(c=>s.regions[c]===id));s.regionCounts=s.regionCells.map(c=>c.length);s.regionConnected=s.regionCells.map(c=>connected(c,n));s.regionTypes=s.regionCells.map(c=>shape(c,n));s.squares=[];
 for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const cells=[y*n+x,y*n+x+1,(y+1)*n+x,(y+1)*n+x+1];if(cells.every(c=>s.marks[c]===1))s.squares.push(cells);}
 s.contacts=[];for(const c of s.black)for(const to of neighbours(c,n))if(to>c&&s.marks[to]===1&&s.regions[c]!==s.regions[to])s.contacts.push({cells:[c,to],regions:[s.regions[c],s.regions[to]]});
 s.globalConnected=connected(s.black,n);
}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level];
 const s={schema:1,seed,level,size:l.size,regionCount:l.regionCount,regions:l.regions.slice(),marks:Array(l.size*l.size).fill(0),cursor:0,black:[],blackCells:0,whiteCells:0,unknown:l.size*l.size,regionCells:[],regionCounts:[],regionConnected:[],regionTypes:[],squares:[],contacts:[],globalConnected:false,phase:'playing',reason:'',score:0,edits:0,editVersion:0,attemptsLeft:config.initialAttempts,checks:0,incompleteChecks:0,lastCheck:null,lastCheckCurrent:false,checkReceipts:[],terminalReceipt:null,
 elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'每区四个黑格组成 I、L、T 或 S；所有黑格相连，填完再按 B 检查。'};
 refresh(s);return s;
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,won){
 s.phase=won?'won':'lost';s.reason=won?'':'checks';s.score=won?100:0;s.message=won?'四格岛群连成一体，所有区域和接触约束都正确。':'三次完整检查已用完，岛群仍有矛盾。';event(s,won?'win':'collision',{reason:s.reason});
 s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,marks:s.marks,regionCounts:s.regionCounts,regionTypes:s.regionTypes,checks:s.checks,attemptsLeft:s.attemptsLeft,lastCheck:s.lastCheck});
}
function check(s){
 const complete=s.unknown===0,regionExact=s.regionCounts.every(c=>c===4),shapeValid=s.regionTypes.every(t=>['I','L','T','S'].includes(t)),globalConnected=s.globalConnected,noSquares=s.squares.length===0,differentTouching=s.contacts.every(c=>{const a=s.regionTypes[c.regions[0]],b=s.regionTypes[c.regions[1]];return ['I','L','T','S'].includes(a)&&['I','L','T','S'].includes(b)&&a!==b;});
 s.lastCheck={complete,regionExact,shapeValid,globalConnected,noSquares,differentTouching,matched:complete&&regionExact&&shapeValid&&globalConnected&&noSquares&&differentTouching,unknown:s.unknown,regionCounts:s.regionCounts.slice(),regionConnected:s.regionConnected.slice(),regionTypes:s.regionTypes.slice(),squares:copy(s.squares),contacts:copy(s.contacts),editVersion:s.editVersion,charged:complete};s.lastCheckCurrent=true;
 if(!complete){s.incompleteChecks=Math.min(config.maxCounter,s.incompleteChecks+1);event(s,'incomplete',{unknown:s.unknown});s.message='还有 '+s.unknown+' 格未知，请标成黑或白；本次免费，不消耗检查机会。';return;}
 s.checks++;s.attemptsLeft--;s.checkReceipts.push({marks:s.marks.slice(),result:copy(s.lastCheck)});if(s.lastCheck.matched)return finish(s,true);if(!s.attemptsLeft)return finish(s,false);event(s,'check',copy(s.lastCheck));s.message='完整图检查未通过；还有 '+s.attemptsLeft+' 次机会，请核对每区形状和全局约束。';
}
function command(s,key){
 if(key==='a'){s.marks[s.cursor]=(s.marks[s.cursor]+1)%3;s.edits=Math.min(config.maxCounter,s.edits+1);s.editVersion=Math.min(config.maxCounter,s.editVersion+1);s.lastCheckCurrent=false;refresh(s);event(s,'edit',{cell:s.cursor,mark:s.marks[s.cursor]});s.message=s.marks[s.cursor]===1?'黑格已加入岛群。':s.marks[s.cursor]===2?'已明确标为白格。':'已恢复未知格。';return;}
 if(key==='b')return check(s);if(key==='none')return;
 const x=s.cursor%s.size,y=Math.floor(s.cursor/s.size),nx=Math.max(0,Math.min(s.size-1,x+(key==='right'?1:key==='left'?-1:0))),ny=Math.max(0,Math.min(s.size-1,y+(key==='down'?1:key==='up'?-1:0))),to=ny*s.size+nx;
 if(to===s.cursor)return blocked(s,'boundary','光标已到棋盘边缘。');const from=s.cursor;s.cursor=to;event(s,'cursor',{from,to});s.message='所选区域 '+(s.regions[to]+1)+'：'+s.regionCounts[s.regions[to]]+' / 4 个黑格。';
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
