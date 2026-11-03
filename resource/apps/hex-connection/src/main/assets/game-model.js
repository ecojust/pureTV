/* Hex Connection: public endgames, six-neighbour connectivity and deterministic replies. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":769,"maxElapsed":86400,"maxCounter":2147483647,"adjacency":[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]],"aiPolicy":"immediate-win, immediate-block, own-min-cost, player-max-cost, row-major","layouts":[{"id":"amber-bend","name":"AMBER BEND","nameZh":"琥珀弯道","size":5,"board":[0,1,1,0,2,2,1,0,1,2,0,0,1,0,2,0,1,0,1,0,2,2,0,0,2],"cursor":0},{"id":"ivory-crossing","name":"IVORY CROSSING","nameZh":"象牙渡口","size":5,"board":[1,2,0,0,2,0,1,0,1,0,0,0,0,2,1,0,0,0,2,2,1,0,1,0,2],"cursor":2},{"id":"cobalt-span","name":"COBALT SPAN","nameZh":"钴蓝长桥","size":6,"board":[0,1,1,0,2,1,0,1,0,2,0,1,2,0,1,1,0,2,2,2,2,0,2,2,0,0,0,1,2,0,1,1,2,1,0,0],"cursor":0}]});
function neighbours(cell,n){const x=cell%n,y=Math.floor(cell/n),out=[];for(const [dx,dy]of config.adjacency){const a=x+dx,b=y+dy;if(a>=0&&a<n&&b>=0&&b<n)out.push(b*n+a);}return out;}
function connectedPath(board,n,actor){
 const queue=[],parent=Array(n*n).fill(-2);
 for(let k=0;k<n;k++){const cell=actor===1?k*n:k;if(board[cell]===actor){queue.push(cell);parent[cell]=-1;}}
 for(let at=0;at<queue.length;at++){
  const cell=queue[at];if(actor===1?cell%n===n-1:Math.floor(cell/n)===n-1){const result=[];for(let c=cell;c!==-1;c=parent[c])result.unshift(c);return result;}
  for(const to of neighbours(cell,n))if(board[to]===actor&&parent[to]===-2){parent[to]=cell;queue.push(to);}
 }return [];
}
// Empty cells cost 1, friendly stones 0; opposing stones cannot be crossed.
function connectionCost(board,n,actor){
 const dist=Array(n*n).fill(Infinity),used=Array(n*n).fill(false);
 for(let k=0;k<n;k++){const cell=actor===1?k*n:k;if(board[cell]!==3-actor)dist[cell]=board[cell]===actor?0:1;}
 for(let step=0;step<n*n;step++){
  let cell=-1;for(let i=0;i<n*n;i++)if(!used[i]&&(cell<0||dist[i]<dist[cell]))cell=i;
  if(cell<0||!Number.isFinite(dist[cell]))return n*n+1;
  used[cell]=true;if(actor===1?cell%n===n-1:Math.floor(cell/n)===n-1)return dist[cell];
  for(const to of neighbours(cell,n))if(board[to]!==3-actor)dist[to]=Math.min(dist[to],dist[cell]+(board[to]===actor?0:1));
 }return n*n+1;
}
function counts(board){return {player:board.filter(v=>v===1).length,opponent:board.filter(v=>v===2).length,empty:board.filter(v=>v===0).length};}
function refresh(s){s.counts=counts(s.board);s.legalMoves=[];for(let cell=0;cell<s.board.length;cell++)if(s.board[cell]===0)s.legalMoves.push(cell);}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
 level=Number.isInteger(level)&&level>=0&&level<3?level:0;const layout=config.layouts[level];
 const s={schema:1,seed,level,size:layout.size,phase:'playing',reason:'',score:0,board:layout.board.slice(),cursor:layout.cursor,
  legalMoves:[],counts:null,playerMoves:0,aiMoves:0,movesPlayed:0,lastPlayerMove:null,lastAiMove:null,lastAiDecision:null,winner:0,winningPath:[],
  receipts:[],terminalReceipt:null,elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,
  lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'你执金色横线棋，连通左右；蓝色竖线棋连通上下。方向选格，A 落子。'};
 refresh(s);return s;
}
function event(s,type,fields){s.events.push(Object.assign({type,call:s.calls},fields));}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,actor){
 const path=connectedPath(s.board,s.size,actor);if(!path.length)return false;
 refresh(s);s.winner=actor;s.winningPath=path;s.phase=actor===1?'won':'lost';s.reason=actor===1?'':'opponent';s.score=actor===1?100:0;
 s.message=actor===1?'金色横线已接通左右两岸。':'蓝色竖线先接通上下两岸，请重试。';
 event(s,actor===1?'win':'collision',{winner:actor,path:path.slice()});
 s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,winner:s.winner,winningPath:s.winningPath,board:s.board,counts:s.counts,playerMoves:s.playerMoves,aiMoves:s.aiMoves});return true;
}
function place(s,actor,cell){
 s.board[cell]=actor;s.movesPlayed++;if(actor===1){s.playerMoves++;s.lastPlayerMove=cell;}else{s.aiMoves++;s.lastAiMove=cell;}
 refresh(s);s.receipts.push({actor:actor===1?'player':'ai',cell,counts:copy(s.counts)});event(s,'place',{actor,cell});
}
function chooseReply(s){
 // Scan row-major for all ties, including multiple immediate winning threats.
 for(const actor of [2,1])for(const cell of s.legalMoves){s.board[cell]=actor;const wins=connectedPath(s.board,s.size,actor).length>0;s.board[cell]=0;if(wins)return {cell,reason:actor===2?'win':'block',ownCost:null,playerCost:null};}
 let best=null;
 for(const cell of s.legalMoves){s.board[cell]=2;const ownCost=connectionCost(s.board,s.size,2),playerCost=connectionCost(s.board,s.size,1);s.board[cell]=0;
  if(!best||ownCost<best.ownCost||ownCost===best.ownCost&&playerCost>best.playerCost)best={cell,reason:'cost',ownCost,playerCost};
 }return best;
}
function command(s,key){
 if(key==='a'){
  if(s.board[s.cursor]!==0)return blocked(s,'occupied','此格已有棋子；落在空格才会消耗回合。');
  place(s,1,s.cursor);if(finish(s,1))return;
  const reply=chooseReply(s);if(reply){s.lastAiDecision=copy(reply);place(s,2,reply.cell);if(finish(s,2))return;}
  s.message='蓝棋已应手。连接六个相邻方向，横线棋争取左右贯通。';
 }else if(key==='b'){
  return blocked(s,'unused','本局只需 A 落子；棋子放下后不能撤回。');
 }else if(key!=='none'){
  const n=s.size,x=s.cursor%n,y=Math.floor(s.cursor/n),nx=Math.max(0,Math.min(n-1,x+(key==='right'?1:key==='left'?-1:0))),ny=Math.max(0,Math.min(n-1,y+(key==='down'?1:key==='up'?-1:0)));
  const to=ny*n+nx;if(to===s.cursor)return blocked(s,'boundary','光标已到棋盘边缘。');
  const from=s.cursor;s.cursor=to;event(s,'select',{from,to});s.message='已选择 '+String.fromCharCode(65+nx)+(ny+1)+'；A 在空格落下一枚横线棋。';
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
