/* Knight Circuit: open knight tours with three explicitly spent undo tokens. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":756,"undoLimit":3,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"moon-court","name":"MOON COURT","nameZh":"月庭起步","width":5,"height":5,"blocked":[],"start":0},{"id":"hollow-court","name":"HOLLOW COURT","nameZh":"中庭留白","width":5,"height":5,"blocked":[12],"start":24},{"id":"long-court","name":"LONG COURT","nameZh":"长庭巡游","width":6,"height":5,"blocked":[],"start":5}]});
const jumps=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
function legal(s){const x=s.knight%s.width,y=Math.floor(s.knight/s.width);return jumps.map(([dx,dy])=>[x+dx,y+dy]).filter(([nx,ny])=>nx>=0&&nx<s.width&&ny>=0&&ny<s.height).map(([nx,ny])=>ny*s.width+nx).filter(cell=>!s.visited[cell]&&!s.blocked.includes(cell)).sort((a,b)=>a-b);}
function refresh(s){s.legalMoves=legal(s);s.remaining=s.width*s.height-s.blocked.length-s.path.length;}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;
 const l=config.layouts[level],visited=Array(l.width*l.height).fill(false);visited[l.start]=true;
 const s={schema:1,seed,level,phase:'playing',reason:'',score:0,width:l.width,height:l.height,blocked:l.blocked.slice(),knight:l.start,cursor:l.start,path:[l.start],visited,legalMoves:[],remaining:0,undoTokens:config.undoLimit,jumps:0,undos:0,lastJump:null,terminalReceipt:null,
 elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'方向选格，A 走日字跳到光标；每格只访问一次，B 花一枚回退券。'};refresh(s);return s;
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function settle(s){
 refresh(s);const won=s.remaining===0,lost=!won&&!s.legalMoves.length&&!(s.path.length>1&&s.undoTokens>0);if(!won&&!lost)return false;
 s.phase=won?'won':'lost';s.reason=won?'':'dead-end';s.score=won?100:0;s.message=won?'所有可走棋格均已访问一次，巡游完成。':'仍有未访问棋格，但马无路可走，也无法回退。';
 event(s,won?'win':'collision',{reason:s.reason});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,path:s.path,knight:s.knight,remaining:s.remaining,undoTokens:s.undoTokens,jumps:s.jumps,undos:s.undos});return true;
}
function command(s,key){
 if(key==='a'){
  if(s.blocked.includes(s.cursor))return blocked(s,'blocked-square','留白棋格不可访问；马可以跨越它。');
  if(s.visited[s.cursor])return blocked(s,'visited','这个棋格已经访问过，请选择未访问的圆点。');
  if(!legal(s).includes(s.cursor))return blocked(s,'not-knight','马只能横二竖一或横一竖二，不能直走或斜走。');
  const from=s.knight;s.knight=s.cursor;s.visited[s.knight]=true;s.path.push(s.knight);s.jumps++;s.lastJump={from,to:s.knight,order:s.path.length};
  if(settle(s))return;event(s,'jump',{from,to:s.knight,order:s.path.length});s.message=s.legalMoves.length?'已访问第 '+s.path.length+' 格；继续选择圆点位置。':'马暂时无路可走，按 B 消耗一枚回退券后重新规划。';
 }else if(key==='b'){
  if(s.path.length<=1)return blocked(s,'start','起点不能撤回。');
  if(s.undoTokens<=0)return blocked(s,'no-undo','回退券已经用完，请继续选择合法落点。');
  const from=s.path.pop();s.visited[from]=false;s.knight=s.path[s.path.length-1];s.cursor=s.knight;s.undoTokens--;s.undos++;s.lastJump=null;
  if(settle(s))return;event(s,'undo',{from,to:s.knight,undoTokens:s.undoTokens});s.message='已回退一跳，剩余 '+s.undoTokens+' 枚回退券。';
 }else if(key!=='none'){
  const x=s.cursor%s.width,y=Math.floor(s.cursor/s.width),nx=Math.max(0,Math.min(s.width-1,x+(key==='right'?1:key==='left'?-1:0))),ny=Math.max(0,Math.min(s.height-1,y+(key==='down'?1:key==='up'?-1:0))),to=ny*s.width+nx;
  if(to===s.cursor)return blocked(s,'boundary','光标已到棋盘边缘。');const from=s.cursor;s.cursor=to;event(s,'select',{from,to});s.message='光标 '+String.fromCharCode(65+nx)+(ny+1)+'；A 跳到此处，B 回退上一跳。';
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
