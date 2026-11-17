/* Light Chambers: public Akari constraints, visible light, and explicit manual validation. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":785,"initialAttempts":3,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"amber-room","name":"AMBER ROOM","nameZh":"琥珀小室","size":5,"walls":[null,null,null,null,null,3,null,-1,2,null,null,-1,null,null,null,2,null,null,-1,null,null,null,null,0,null]},{"id":"cross-vault","name":"CROSS VAULT","nameZh":"十字穹厅","size":6,"walls":[null,null,null,null,1,null,null,null,null,null,-1,null,null,2,null,4,null,null,null,-1,null,null,null,1,-1,null,-1,null,-1,null,null,null,0,null,null,null]},{"id":"lantern-court","name":"LANTERN COURT","nameZh":"灯影中庭","size":7,"walls":[null,null,null,-1,0,0,-1,null,3,null,-1,null,null,null,null,-1,-1,-1,null,null,null,null,-1,null,-1,null,null,-1,1,null,null,null,0,-1,null,null,null,null,null,null,null,null,null,null,-1,2,null,null,null]}]});
const directions=[[1,0],[-1,0],[0,1],[0,-1]];
function adjacent(cell,n){const out=[];for(const [dx,dy]of directions){const x=cell%n+dx,y=Math.floor(cell/n)+dy;if(x>=0&&x<n&&y>=0&&y<n)out.push(y*n+x);}return out;}
function refresh(s){
 const n=s.size,bulbs=[];s.lit=Array(n*n).fill(false);s.wallCounts=Array(n*n).fill(null);const conflict=new Set();let totalWhite=0,numberedWalls=0,matchedWalls=0;
 for(let c=0;c<n*n;c++)if(s.walls[c]===null){totalWhite++;if(s.marks[c]===1)bulbs.push(c);}
 for(const cell of bulbs){s.lit[cell]=true;for(const [dx,dy]of directions){let x=cell%n+dx,y=Math.floor(cell/n)+dy;while(x>=0&&x<n&&y>=0&&y<n&&s.walls[y*n+x]===null){const to=y*n+x;s.lit[to]=true;if(s.marks[to]===1){conflict.add(cell);conflict.add(to);}x+=dx;y+=dy;}}}
 for(let c=0;c<n*n;c++)if(s.walls[c]!==null&&s.walls[c]>=0){numberedWalls++;s.wallCounts[c]=adjacent(c,n).filter(k=>s.walls[k]===null&&s.marks[k]===1).length;if(s.wallCounts[c]===s.walls[c])matchedWalls++;}
 s.conflicts=Array.from(conflict).sort((a,b)=>a-b);s.counts={totalWhite,litWhite:s.lit.filter(Boolean).length,bulbs:bulbs.length,conflictingBulbs:s.conflicts.length,numberedWalls,matchedWalls};
}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];
 const s={schema:1,seed,level,size:l.size,walls:l.walls.slice(),marks:Array(l.size*l.size).fill(0),cursor:l.walls.indexOf(null),lit:[],conflicts:[],wallCounts:[],counts:null,phase:'playing',reason:'',score:0,edits:0,editVersion:0,attemptsLeft:config.initialAttempts,checks:0,lastCheck:null,lastCheckCurrent:false,checkReceipts:[],terminalReceipt:null,
  elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'A 在白格循环空、灯、排除；灯光直行到墙，B 手动检查，空图也会消耗一次机会。'};
 refresh(s);return s;
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,won){
 s.phase=won?'won':'lost';s.reason=won?'':'checks';s.score=won?100:0;s.message=won?'所有白格受照，灯不互见，编号墙邻灯数完全匹配。':'三次检查已用完，仍有布灯约束未满足。';event(s,won?'win':'collision',{reason:s.reason});
 s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,marks:s.marks,lit:s.lit,conflicts:s.conflicts,wallCounts:s.wallCounts,counts:s.counts,checks:s.checks,attemptsLeft:s.attemptsLeft,lastCheck:s.lastCheck});
}
function check(s){
 const allLit=s.counts.litWhite===s.counts.totalWhite,noConflicts=s.conflicts.length===0,wallsExact=s.counts.matchedWalls===s.counts.numberedWalls;
 const wrongWalls=[];for(let c=0;c<s.walls.length;c++)if(s.walls[c]!==null&&s.walls[c]>=0&&s.wallCounts[c]!==s.walls[c])wrongWalls.push(c);
 s.lastCheck={allLit,noConflicts,wallsExact,matched:allLit&&noConflicts&&wallsExact,litWhite:s.counts.litWhite,totalWhite:s.counts.totalWhite,bulbs:s.counts.bulbs,conflicts:s.conflicts.slice(),wrongWalls,editVersion:s.editVersion};s.lastCheckCurrent=true;s.checks++;s.attemptsLeft--;s.checkReceipts.push({marks:s.marks.slice(),result:copy(s.lastCheck)});
 if(s.lastCheck.matched)return finish(s,true);if(!s.attemptsLeft)return finish(s,false);event(s,'check',copy(s.lastCheck));s.message='检查未通过：受照 '+s.counts.litWhite+'/'+s.counts.totalWhite+'，互见灯 '+s.conflicts.length+'，未满足编号墙 '+wrongWalls.length+'。';
}
function command(s,key){
 if(key==='a'){
  if(s.walls[s.cursor]!==null)return blocked(s,'wall','墙格不能放灯或作排除标记。');
  s.marks[s.cursor]=(s.marks[s.cursor]+1)%3;s.edits=Math.min(config.maxCounter,s.edits+1);s.editVersion=Math.min(config.maxCounter,s.editVersion+1);s.lastCheckCurrent=false;refresh(s);event(s,'edit',{cell:s.cursor,mark:s.marks[s.cursor]});s.message=s.marks[s.cursor]===1?'已放灯；全部完成后 B 检查。':s.marks[s.cursor]===2?'已标记排除；排除符号不会挡光。':'已清空此格。';return;
 }
 if(key==='b')return check(s);if(key==='none')return;
 const dx=key==='right'?1:key==='left'?-1:0,dy=key==='down'?1:key==='up'?-1:0,n=s.size;let x=s.cursor%n+dx,y=Math.floor(s.cursor/n)+dy;
 while(x>=0&&x<n&&y>=0&&y<n){const cell=y*n+x;if(s.walls[cell]===null){const from=s.cursor;s.cursor=cell;event(s,'cursor',{from,to:cell});s.message='A 循环空格、灯、排除；B 消耗一次机会检查。';return;}x+=dx;y+=dy;}
 blocked(s,'boundary','这个方向没有其他白格，光标保持不动。');
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
