/* Four in Row: prepared gravity endgames against a fully documented deterministic opponent. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const copy=v=>JSON.parse(JSON.stringify(v));
 function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
 const config=freeze({defaultSeed:767,columns:7,rows:6,maxElapsed:86400,maxCounter:2147483647,
  ai:{depth:3,tieOrder:[3,2,4,1,5,0,6],terminalScore:1000000,centerWeight:6,ownWeights:[0,1,6,40],opponentWeights:[0,1,7,45]},
  layouts:[{id:'harbor-line',name:'HARBOR LINE',nameZh:'港湾残局',rows:['2200200','1200100','2101201','1121222','2112111','1222121']},
   {id:'cross-current',name:'CROSS CURRENT',nameZh:'交错残局',rows:['1000020','2100112','2200211','2200121','1102121','1121222']},
   {id:'deep-fork',name:'DEEP FORK',nameZh:'深叉残局',rows:['2100001','2100002','1200002','1201121','1102212','2121212']}]});
 const windows=[];for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const [dr,dc]of [[0,1],[1,0],[1,1],[1,-1]]){
  if(r+dr*3>=0&&r+dr*3<6&&c+dc*3>=0&&c+dc*3<7)windows.push([0,1,2,3].map(k=>[r+dr*k,c+dc*k]));
 }
 function lineCells(board,player){const cells=new Set();for(const w of windows)if(w.every(([r,c])=>board[r][c]===player))w.forEach(([r,c])=>cells.add(r*7+c));return Array.from(cells).sort((a,b)=>a-b);}
 function legal(board){return config.ai.tieOrder.filter(c=>board[0][c]===0);}
 function drop(board,col,player){for(let row=5;row>=0;row--)if(board[row][col]===0){board[row][col]=player;return{row,col};}return null;}
 function child(board,col,player){const result=board.map(row=>row.slice());drop(result,col,player);return result;}
 function evaluate(board){
  let score=0;for(let row=0;row<6;row++)score+=board[row][3]===2?6:board[row][3]===1?-6:0;
  for(const w of windows){let own=0,opponent=0;for(const [r,c]of w){if(board[r][c]===2)own++;else if(board[r][c]===1)opponent++;}
   if(own&&!opponent)score+=config.ai.ownWeights[own]||0;if(opponent&&!own)score-=config.ai.opponentWeights[opponent]||0;}
  return score;
 }
 function minimax(board,player,depth){
  if(lineCells(board,2).length)return config.ai.terminalScore+depth;
  if(lineCells(board,1).length)return-config.ai.terminalScore-depth;
  const columns=legal(board);if(!columns.length)return 0;if(depth===0)return evaluate(board);
  let best=player===2?-Infinity:Infinity;
  for(const c of columns){const value=minimax(child(board,c,player),3-player,depth-1);best=player===2?Math.max(best,value):Math.min(best,value);}return best;
 }
 function chooseAI(board){
  const columns=legal(board);for(const c of columns)if(lineCells(child(board,c,2),2).length)return c;
  for(const c of columns)if(lineCells(child(board,c,1),1).length)return c;
  let chosen=columns[0],best=-Infinity;
  for(const c of columns){const value=minimax(child(board,c,2),1,config.ai.depth-1);if(value>best){best=value;chosen=c;}}return chosen;
 }
 function create(seed,level){
  seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;
  return{schema:1,seed,level,phase:'playing',reason:'',score:0,board:config.layouts[level].rows.map(row=>Array.from(row,Number)),column:3,
   playerDrops:0,aiDrops:0,lastPlayer:null,lastAI:null,winningCells:[],turnReceipts:[],elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,
   inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,x:0,y:0,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
   message:'左右选列，A 落下一枚圆环棋子；连成横、竖或斜向四子即可获胜。'};
 }
 function normalized(raw){
  const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
  try{if(!raw||typeof raw!=='object'||Array.isArray(raw))return neutral();const v=Object.create(null);
   for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(raw,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
   const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
   return{x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
  }catch(_){return neutral();}
 }
 function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
 function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
 function action(s){
  if(s.board[0][s.column]!==0)return blocked(s,'full-column','这一列已满；换一列落子，对手不会因此行动。');
  s.lastPlayer=drop(s.board,s.column,1);s.playerDrops++;s.lastAI=null;s.winningCells=lineCells(s.board,1);
  let cause=s.winningCells.length?'success':!legal(s.board).length?'draw':null;
  if(!cause){const aiColumn=chooseAI(s.board);s.lastAI=drop(s.board,aiColumn,2);s.aiDrops++;s.winningCells=lineCells(s.board,2);
   if(s.winningCells.length)cause='opponent';else if(!legal(s.board).length)cause='draw';}
  if(cause){s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':cause;s.score=cause==='success'?100:0;}
  s.turnReceipts.push(copy({turn:s.playerDrops,player:s.lastPlayer,ai:s.lastAI,outcome:s.phase,reason:s.reason}));
  if(cause){
   event(s,cause==='success'?'win':'collision',cause==='success'?{player:copy(s.lastPlayer),ai:null}:{reason:cause,player:copy(s.lastPlayer),ai:copy(s.lastAI)});
   s.message=cause==='success'?'你的圆环棋子连成四子，残局破解。':cause==='opponent'?'对手的叉形棋子连成四子，本局结束。':'棋盘已满，本局和棋；目标是取得胜利，请重试。';
   s.terminalReceipt=copy({cause,call:s.calls,elapsed:s.elapsed,level:s.level,board:s.board,playerDrops:s.playerDrops,aiDrops:s.aiDrops,
    lastPlayer:s.lastPlayer,lastAI:s.lastAI,winningCells:s.winningCells,score:s.score,phase:s.phase,reason:s.reason});
  }else{event(s,'turn',{player:copy(s.lastPlayer),ai:copy(s.lastAI)});s.message='你落在第 '+(s.lastPlayer.col+1)+' 列，对手落在第 '+(s.lastAI.col+1)+' 列；现在轮到你。';}
 }
 function step(s,dt,raw){
  if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
  const input=normalized(raw);if(input.paused)return s;
  const direction=input.x>.5?'right':input.x<-.5?'left':'none',old=s.lastHeld,armed=s.inputArmed;
  const disarm=(input.cancelEpoch!==null&&s.cancelEpoch!==null&&input.cancelEpoch!==s.cancelEpoch)||(input.cancelled&&!s.cancelledLast);
  s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
  if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;s.cancelledLast=input.cancelled;if(disarm)s.inputArmed=false;
  if(!disarm&&!input.cancelled&&armed){const command=input.a&&!old.a?'a':direction!=='none'&&direction!==old.direction?direction:'none';s.lastCommand=command;
   if(command==='a')action(s);else if(command!=='none'){const from=s.column,to=Math.max(0,Math.min(6,from+(command==='right'?1:-1)));
    if(from===to)blocked(s,'boundary','已到棋盘边缘，选择不改变回合。');else{s.column=to;event(s,'cursor',{from,to});s.message='已选择第 '+(to+1)+' 列；A 落子。';}}}
  if(!disarm&&!input.cancelled&&!input.a&&!input.b&&Math.abs(input.x)<=.5&&Math.abs(input.y)<=.5)s.inputArmed=true;
  s.lastHeld={a:input.a,b:input.b,x:input.x,y:input.y,direction};return s;
 }
 return Object.freeze({create,step,config});
});
