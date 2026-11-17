/* Reversi Relay: visible 6x6 endgames against a deterministic greedy opponent. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":751,"size":6,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"corner-leaf","name":"CORNER LEAF","nameZh":"角隅新叶","board":[2,1,1,1,1,0,2,1,1,1,1,0,2,1,2,2,2,2,2,1,2,1,2,1,2,2,0,2,2,1,2,0,0,0,0,0],"cursor":0},{"id":"edge-weave","name":"EDGE WEAVE","nameZh":"边线交织","board":[2,2,2,0,0,1,0,1,2,2,1,0,2,2,2,2,1,0,2,2,2,1,2,1,2,2,1,1,0,2,2,1,0,2,0,0],"cursor":0},{"id":"fern-crown","name":"FERN CROWN","nameZh":"蕨冠回合","board":[2,2,2,2,1,1,0,1,2,2,1,0,0,1,1,2,2,0,0,1,1,1,2,2,0,0,1,1,1,1,0,2,1,2,0,0],"cursor":0}]});
const rays=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
function captures(board,cell,actor){
 if(board[cell]!==0)return [];
 const flipped=[];
 for(const [dx,dy] of rays){let x=cell%6+dx,y=Math.floor(cell/6)+dy,line=[];
  while(x>=0&&x<6&&y>=0&&y<6&&board[y*6+x]===3-actor){line.push(y*6+x);x+=dx;y+=dy;}
  if(line.length&&x>=0&&x<6&&y>=0&&y<6&&board[y*6+x]===actor)flipped.push(...line);
 }
 return flipped;
}
function legal(board,actor){const result=[];for(let cell=0;cell<36;cell++){const flipped=captures(board,cell,actor);if(flipped.length)result.push({cell,flipped});}return result;}
function counts(board){return {player:board.filter(v=>v===1).length,opponent:board.filter(v=>v===2).length,empty:board.filter(v=>v===0).length};}
function refresh(s){s.counts=counts(s.board);s.legalMoves=legal(s.board,1).map(m=>m.cell);}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
 level=Number.isInteger(level)&&level>=0&&level<3?level:0;const layout=config.layouts[level];
 const s={schema:1,seed,level,phase:'playing',reason:'',score:0,board:layout.board.slice(),cursor:layout.cursor,
  legalMoves:[],counts:null,playerMoves:0,aiMoves:0,movesPlayed:0,playerPasses:0,aiPasses:0,lastPlayerMove:null,lastAiMove:null,
  receipts:[],terminalReceipt:null,elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,
  lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'白棋是你；方向选格，A 夹住绿棋翻面，无棋可下时 B 让行。'};
 refresh(s);return s;
}
function event(s,type,fields){s.events.push(Object.assign({type,call:s.calls},fields));}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s){
 refresh(s);if(s.counts.empty&& (s.legalMoves.length||legal(s.board,2).length))return false;
 const won=s.counts.player>s.counts.opponent,draw=s.counts.player===s.counts.opponent;
 s.phase=won?'won':'lost';s.reason=won?'':draw?'draw':'opponent';s.score=won?100:0;
 s.message=won?'残局完成，白棋数量领先。':draw?'双方棋子同数，本局和棋；白棋领先才能通过。':'绿棋数量领先，本局未通过。';
 event(s,won?'win':'collision',{reason:s.reason});
 s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,board:s.board,counts:s.counts,movesPlayed:s.movesPlayed,playerPasses:s.playerPasses,aiPasses:s.aiPasses});return true;
}
function place(s,actor,move){
 s.board[move.cell]=actor;move.flipped.forEach(cell=>{s.board[cell]=actor;});s.movesPlayed++;
 const who=actor===1?'player':'ai';if(actor===1){s.playerMoves++;s.lastPlayerMove=copy(move);}else{s.aiMoves++;s.lastAiMove=copy(move);}
 s.receipts.push({actor:who,cell:move.cell,flipped:move.flipped.slice(),counts:counts(s.board)});event(s,'place',{actor:who,cell:move.cell,flipped:move.flipped.slice()});
}
function pass(s,actor){const who=actor===1?'player':'ai';if(actor===1)s.playerPasses++;else s.aiPasses++;s.receipts.push({actor:who,cell:null,flipped:[],counts:counts(s.board)});event(s,'pass',{actor:who});}
function reply(s){
 if(finish(s))return;
 const choices=legal(s.board,2);let best=null;
 // Legal choices are scanned row-major; strictly better flip counts preserve the first tied cell.
 for(const m of choices)if(!best||m.flipped.length>best.flipped.length)best=m;
 if(best)place(s,2,best);else pass(s,2);
 if(finish(s))return;
 s.message=s.legalMoves.length?(best?'绿棋已应手；白棋继续。数字标记为当前可落位置。':'绿棋无合法落点，自动让行；白棋继续。'):'白棋无合法落点，请按 B 让行给绿棋。';
}
function command(s,key){
 if(key==='a'){
  const flipped=captures(s.board,s.cursor,1);
  if(!flipped.length)return blocked(s,'illegal-place',s.board[s.cursor]?'这里已有棋子，请选择带标记的空格。':'此处没有夹住绿棋，不消耗回合。');
  place(s,1,{cell:s.cursor,flipped});reply(s);
 }else if(key==='b'){
  if(legal(s.board,1).length)return blocked(s,'pass-not-allowed','白棋仍有合法落点，不能让行。');
  if(!legal(s.board,2).length){finish(s);return;}
  pass(s,1);reply(s);
 }else if(key!=='none'){
  const x=s.cursor%6,y=Math.floor(s.cursor/6),nx=Math.max(0,Math.min(5,x+(key==='right'?1:key==='left'?-1:0))),ny=Math.max(0,Math.min(5,y+(key==='down'?1:key==='up'?-1:0)));
  const to=ny*6+nx;if(to===s.cursor)return blocked(s,'boundary','光标已到棋盘边缘。');
  const from=s.cursor;s.cursor=to;event(s,'select',{from,to});s.message='已选择 '+String.fromCharCode(65+nx)+(ny+1)+'；A 落子，B 仅用于无棋可下时让行。';
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
