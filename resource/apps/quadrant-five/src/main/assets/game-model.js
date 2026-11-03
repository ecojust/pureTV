/* Quadrant Five: each placement must be followed by a quarter-turn before resolving lines. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":781,"size":6,"quadrantSize":3,"winLength":5,"aiWeights":[0,1,4,12,40,1000],"aiOutcomePriority":{"opponent":4,"playing":3,"simultaneous":2,"draw":1,"player":0},"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"amber-turn","name":"AMBER TURN","nameZh":"琥珀转角","board":[2,1,1,2,2,2,2,1,2,1,2,1,2,2,1,1,2,1,1,1,2,0,0,2,0,1,0,1,0,2,1,2,0,0,1,0],"cursor":21},{"id":"cobalt-cross","name":"COBALT CROSS","nameZh":"钴蓝交汇","board":[0,0,1,2,1,0,2,1,2,1,2,1,2,1,0,1,1,2,0,0,2,2,2,2,2,1,0,1,2,1,1,2,0,1,2,1],"cursor":0},{"id":"ivory-orbit","name":"IVORY ORBIT","nameZh":"象牙回旋","board":[0,0,2,2,1,1,0,2,1,1,2,2,1,0,2,0,1,2,1,2,2,1,1,2,0,0,2,1,0,1,2,2,1,2,1,1],"cursor":0}]});
const segments=[];
for(let y=0;y<6;y++)for(let x=0;x<6;x++)for(const [dx,dy]of [[1,0],[0,1],[1,1],[-1,1]]){const ex=x+4*dx,ey=y+4*dy;if(ex>=0&&ex<6&&ey>=0&&ey<6)segments.push(Array.from({length:5},(_,k)=>(y+k*dy)*6+x+k*dx));}
function rotatedCell(cell,quadrant,direction){
 if(cell===null)return null;const ox=quadrant%2*3,oy=Math.floor(quadrant/2)*3,x=cell%6-ox,y=Math.floor(cell/6)-oy;
 if(x<0||x>2||y<0||y>2)return cell;
 return direction===1?(oy+x)*6+ox+2-y:(oy+2-x)*6+ox+y;
}
function rotate(board,quadrant,direction){const next=board.slice(),ox=quadrant%2*3,oy=Math.floor(quadrant/2)*3;for(let y=0;y<3;y++)for(let x=0;x<3;x++){const cell=(oy+y)*6+ox+x;next[rotatedCell(cell,quadrant,direction)]=board[cell];}return next;}
function evaluate(board){
 const winningLines=[];let score=0;
 for(const cells of segments){let player=0,opponent=0;for(const cell of cells){if(board[cell]===1)player++;else if(board[cell]===2)opponent++;}if(player===5)winningLines.push({actor:1,cells:cells.slice()});if(opponent===5)winningLines.push({actor:2,cells:cells.slice()});if(player===0)score+=config.aiWeights[opponent];if(opponent===0)score-=config.aiWeights[player];}
 const player=winningLines.some(l=>l.actor===1),opponent=winningLines.some(l=>l.actor===2),outcome=player?(opponent?'simultaneous':'player'):opponent?'opponent':board.every(v=>v!==0)?'draw':'playing';
 return {outcome,score,winningLines};
}
function counts(board){return {player:board.filter(v=>v===1).length,opponent:board.filter(v=>v===2).length,empty:board.filter(v=>v===0).length};}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];
 return {schema:1,seed,level,phase:'playing',reason:'',score:0,board:l.board.slice(),counts:counts(l.board),turnPhase:'place',cursor:l.cursor,quadrantCursor:0,rotationDirection:1,pendingPlacement:null,playerTurns:0,aiTurns:0,lastPlayerTurn:null,lastAiTurn:null,lastPlayerCell:null,lastAiCell:null,winningLines:[],receipts:[],terminalReceipt:null,
  elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'先 A 落下一枚白子，再选择一个棋区强制旋转四分之一圈；旋转后才判定连五。'};
}
function event(s,type,fields){s.events.push(Object.assign({type,call:s.calls},fields));}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,result){
 if(result.outcome==='playing')return false;s.winningLines=copy(result.winningLines);s.phase=result.outcome==='player'?'won':'lost';s.reason=s.phase==='won'?'':result.outcome;s.score=s.phase==='won'?100:0;
 s.message=s.phase==='won'?'白棋在旋转后完成连五。':s.reason==='simultaneous'?'旋转后双方同时连五，本局和棋，需重试。':s.reason==='draw'?'棋盘已满且无人连五，本局和棋，需重试。':'蓝棋在旋转后完成连五。';
 event(s,s.phase==='won'?'win':'collision',{reason:s.reason});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,board:s.board,counts:s.counts,playerTurns:s.playerTurns,aiTurns:s.aiTurns,winningLines:s.winningLines,lastPlayerTurn:s.lastPlayerTurn,lastAiTurn:s.lastAiTurn});return true;
}
function chooseReply(board){
 let best=null;
 for(let cell=0;cell<36;cell++)if(board[cell]===0)for(let quadrant=0;quadrant<4;quadrant++)for(const direction of [1,-1]){
  const placed=board.slice();placed[cell]=2;const candidate=rotate(placed,quadrant,direction),result=evaluate(candidate),priority=config.aiOutcomePriority[result.outcome];
  if(!best||priority>best.priority||priority===best.priority&&result.score>best.score)best={cell,quadrant,direction,rotatedCell:rotatedCell(cell,quadrant,direction),priority,score:result.score,outcome:result.outcome,board:candidate,result};
 }return best;
}
function completeTurn(s){
 const cell=s.pendingPlacement,quadrant=s.quadrantCursor,direction=s.rotationDirection;
 s.board=rotate(s.board,quadrant,direction);s.lastPlayerCell=rotatedCell(s.lastPlayerCell,quadrant,direction);s.lastAiCell=rotatedCell(s.lastAiCell,quadrant,direction);s.cursor=rotatedCell(cell,quadrant,direction);
 s.lastPlayerTurn={cell,quadrant,direction,rotatedCell:s.cursor};s.playerTurns++;s.pendingPlacement=null;s.turnPhase='place';s.counts=counts(s.board);s.receipts.push(Object.assign({actor:1,counts:copy(s.counts)},copy(s.lastPlayerTurn)));event(s,'rotate',{actor:1,quadrant,direction});
 if(finish(s,evaluate(s.board)))return;
 const reply=chooseReply(s.board);if(!reply)return;
 s.lastPlayerCell=rotatedCell(s.lastPlayerCell,reply.quadrant,reply.direction);s.lastAiCell=reply.rotatedCell;s.board=reply.board;s.aiTurns++;s.counts=counts(s.board);
 s.lastAiTurn={cell:reply.cell,quadrant:reply.quadrant,direction:reply.direction,rotatedCell:reply.rotatedCell,priority:reply.priority,score:reply.score,outcome:reply.outcome};s.receipts.push(Object.assign({actor:2,counts:copy(s.counts)},copy(s.lastAiTurn)));event(s,'rotate',{actor:2,quadrant:reply.quadrant,direction:reply.direction});
 if(finish(s,reply.result))return;s.message='蓝棋已完成落子和旋转；白棋先选择空格落子。';
}
function command(s,key){
 if(key==='a'){
  if(s.turnPhase==='rotate')return completeTurn(s);
  if(s.board[s.cursor]!==0)return blocked(s,'occupied','此处已有棋子；请选空格落子。');
  s.board[s.cursor]=1;s.pendingPlacement=s.cursor;s.lastPlayerCell=s.cursor;s.turnPhase='rotate';s.quadrantCursor=Math.floor(s.cursor/18)*2+Math.floor(s.cursor%6/3);s.rotationDirection=1;s.counts=counts(s.board);event(s,'place',{cell:s.cursor});s.message='必须旋转：方向键选择四个棋区，B 切换顺逆时针，A 确认。';return;
 }
 if(key==='b'){
  if(s.turnPhase!=='rotate')return blocked(s,'place-first','先在空格落子，之后 B 才切换旋转方向。');
  s.rotationDirection=-s.rotationDirection;event(s,'direction',{direction:s.rotationDirection});s.message=s.rotationDirection===1?'当前顺时针；A 确认旋转。':'当前逆时针；A 确认旋转。';return;
 }
 if(key==='none')return;
 const dx=key==='right'?1:key==='left'?-1:0,dy=key==='down'?1:key==='up'?-1:0;
 if(s.turnPhase==='rotate'){
  const x=s.quadrantCursor%2,y=Math.floor(s.quadrantCursor/2),nx=Math.max(0,Math.min(1,x+dx)),ny=Math.max(0,Math.min(1,y+dy)),to=ny*2+nx;
  if(to===s.quadrantCursor)return blocked(s,'quadrant-boundary','已到棋区边缘。');s.quadrantCursor=to;event(s,'quadrant',{quadrant:to});s.message='已选棋区 '+(to+1)+'；B 切换转向，A 完成旋转。';return;
 }
 const x=s.cursor%6,y=Math.floor(s.cursor/6),nx=Math.max(0,Math.min(5,x+dx)),ny=Math.max(0,Math.min(5,y+dy)),to=ny*6+nx;
 if(to===s.cursor)return blocked(s,'boundary','光标已到棋盘边缘。');s.cursor=to;event(s,'cursor',{cell:to});s.message='A 在空格落白子，随后必须旋转一个棋区。';
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
