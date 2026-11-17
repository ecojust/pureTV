/* Dots and Boxes: public prepared endgames, capture extra turns and deterministic edge policy. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const copy=v=>JSON.parse(JSON.stringify(v));
 function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
 const config=freeze({defaultSeed:771,maxElapsed:86400,maxCounter:2147483647,
  aiPolicy:'Maximize immediate captures; otherwise avoid creating any third side when possible; smallest edge ID breaks every tie.',layouts:[{"id": "corner-notes", "name": "CORNER NOTES", "nameZh": "角隅手记", "cols": 3, "rows": 3, "edges": [0, 0, 2, 0, 0, 0, 1, 2, 0, 2, 1, 2, 2, 1, 0, 1, 0, 0, 1, 2, 1, 1, 1, 0], "owners": [0, 0, 0, 0, 0, 0, 1, 1, 0]}, {"id": "tall-ledger", "name": "TALL LEDGER", "nameZh": "长页对局", "cols": 3, "rows": 4, "edges": [0, 0, 1, 0, 2, 1, 0, 2, 2, 1, 0, 1, 2, 0, 0, 1, 0, 2, 2, 0, 1, 2, 1, 0, 0, 2, 1, 2, 2, 1, 0], "owners": [0, 0, 2, 0, 1, 1, 0, 0, 2, 2, 0, 0]}, {"id": "woven-grid", "name": "WOVEN GRID", "nameZh": "交织方阵", "cols": 4, "rows": 4, "edges": [1, 2, 1, 1, 2, 1, 2, 2, 1, 2, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 2, 1, 2, 2, 0, 0, 2, 2, 1, 0, 1, 0, 2, 0, 2, 1, 0, 2, 0], "owners": [2, 2, 1, 2, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0]}]});
 function geometry(cols,rows){const h=(rows+1)*cols,boxes=[],adj=Array.from({length:h+rows*(cols+1)},()=>[]);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const box=[row*cols+col,(row+1)*cols+col,h+row*(cols+1)+col,h+row*(cols+1)+col+1],id=boxes.length;boxes.push(box);box.forEach(e=>adj[e].push(id));}
  return{boxes,adj};
 }
 const grids=config.layouts.map(l=>geometry(l.cols,l.rows));
 function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];
  return{schema:1,seed,level,phase:'playing',reason:'',score:0,cols:l.cols,rows:l.rows,cursor:{row:0,col:0},orientation:'h',edges:l.edges.slice(),owners:l.owners.slice(),
   playerBoxes:l.owners.filter(v=>v===1).length,aiBoxes:l.owners.filter(v=>v===2).length,remaining:l.edges.filter(v=>v===0).length,playerMoves:0,aiMoves:0,
   lastPlayer:null,lastAI:null,aiTrail:[],receipts:[],elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,
   lastHeld:{a:false,b:false,x:0,y:0,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,message:'方向移动圆点，A 切换横竖，B 画线；围成方格后继续行动。'};
 }
 function normalized(raw){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
  try{if(!raw||typeof raw!=='object'||Array.isArray(raw))return neutral();const v=Object.create(null);for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(raw,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
   const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return{x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
  }catch(_){return neutral();}
 }
 function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
 function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
 function captureCount(s,e){return grids[s.level].adj[e].filter(b=>grids[s.level].boxes[b].every(z=>z===e||s.edges[z]!==0)).length;}
 function safe(s,e){return grids[s.level].adj[e].every(b=>grids[s.level].boxes[b].filter(z=>s.edges[z]!==0).length!==2);}
 function chooseAI(s){let first=-1,best=-1,count=-1,firstSafe=-1;
  for(let e=0;e<s.edges.length;e++)if(!s.edges[e]){if(first<0)first=e;const n=captureCount(s,e);if(n>count){best=e;count=n;}if(firstSafe<0&&safe(s,e))firstSafe=e;}
  return count>0?best:firstSafe>=0?firstSafe:first;
 }
 function place(s,e,player){s.edges[e]=player;s.remaining--;const boxes=[];for(const b of grids[s.level].adj[e])if(!s.owners[b]&&grids[s.level].boxes[b].every(z=>s.edges[z]!==0)){s.owners[b]=player;boxes.push(b);}
  if(player===1){s.playerMoves++;s.playerBoxes+=boxes.length;}else{s.aiMoves++;s.aiBoxes+=boxes.length;}return{edge:e,boxes};
 }
 function settle(s){if(s.remaining)return null;const cause=s.playerBoxes>s.aiBoxes?'success':s.playerBoxes===s.aiBoxes?'draw':'opponent';s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':cause;s.score=cause==='success'?100:0;return cause;}
 function draw(s){const row=s.cursor.row,col=s.cursor.col,h=(s.rows+1)*s.cols;
  if((s.orientation==='h'&&col===s.cols)||(s.orientation==='v'&&row===s.rows))return blocked(s,'outside','预览指向棋盘外；移动圆点或按 A 换方向。');
  const e=s.orientation==='h'?row*s.cols+col:h+row*(s.cols+1)+col;
  if(s.edges[e])return blocked(s,'claimed','这条边已画好；选择未画的虚线，不消耗回合。');
  s.lastPlayer=place(s,e,1);s.lastAI=null;s.aiTrail=[];
  if(!s.lastPlayer.boxes.length){const bound=s.remaining;for(let i=0;i<bound&&s.remaining;i++){const move=place(s,chooseAI(s),2);s.lastAI=copy(move);s.aiTrail.push(copy(move));if(!move.boxes.length)break;}}
  const cause=settle(s);s.receipts.push(copy({move:s.playerMoves,player:s.lastPlayer,ai:s.aiTrail,remaining:s.remaining,playerBoxes:s.playerBoxes,aiBoxes:s.aiBoxes,outcome:s.phase,reason:s.reason}));
  event(s,cause==='success'?'win':cause?'collision':'turn',Object.assign({player:copy(s.lastPlayer),ai:copy(s.aiTrail)},cause&&cause!=='success'?{reason:cause}:{}));
  if(cause){s.message=cause==='success'?'全部边线已完成，你的方格更多，获得胜利。':cause==='draw'?'全部边线已完成，双方平分；和局未完成胜利目标。':'全部边线已完成，对手的方格更多，请重新挑战。';s.terminalReceipt=copy({cause,call:s.calls,elapsed:s.elapsed,level:s.level,edges:s.edges,owners:s.owners,playerBoxes:s.playerBoxes,aiBoxes:s.aiBoxes,remaining:s.remaining,playerMoves:s.playerMoves,aiMoves:s.aiMoves,score:s.score,phase:s.phase,reason:s.reason});}
  else{s.message=s.lastPlayer.boxes.length?'你围成 '+s.lastPlayer.boxes.length+' 格，可继续画线。':'对手画了 '+s.aiTrail.length+' 条边，围成 '+s.aiTrail.reduce((n,m)=>n+m.boxes.length,0)+' 格；现在轮到你。';}
 }
 function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const input=normalized(raw);if(input.paused)return s;
  const direction=Math.max(Math.abs(input.x),Math.abs(input.y))<=.5?'none':Math.abs(input.y)>=Math.abs(input.x)?input.y>0?'down':'up':input.x>0?'right':'left',old=s.lastHeld,armed=s.inputArmed;
  const disarm=(input.cancelEpoch!==null&&s.cancelEpoch!==null&&input.cancelEpoch!==s.cancelEpoch)||(input.cancelled&&!s.cancelledLast);
  s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
  if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;s.cancelledLast=input.cancelled;if(disarm)s.inputArmed=false;
  if(!disarm&&!input.cancelled&&armed){const command=input.b&&!old.b?'b':input.a&&!old.a?'a':direction!=='none'&&direction!==old.direction?direction:'none';s.lastCommand=command;
   if(command==='b')draw(s);else if(command==='a'){const from=s.orientation;s.orientation=from==='h'?'v':'h';event(s,'orient',{from,to:s.orientation});s.message=s.orientation==='h'?'横线：从圆点向右画。':'竖线：从圆点向下画。';}
   else if(command!=='none'){const from=copy(s.cursor),to={row:Math.max(0,Math.min(s.rows,from.row+(command==='down'?1:command==='up'?-1:0))),col:Math.max(0,Math.min(s.cols,from.col+(command==='right'?1:command==='left'?-1:0)))};
    if(from.row===to.row&&from.col===to.col)blocked(s,'boundary','已到圆点边界；移动不消耗回合。');else{s.cursor=to;event(s,'cursor',{from,to:copy(to)});s.message='已选择第 '+(to.row+1)+' 行、第 '+(to.col+1)+' 列圆点。';}}}
  if(!disarm&&!input.cancelled&&!input.a&&!input.b&&Math.abs(input.x)<=.5&&Math.abs(input.y)<=.5)s.inputArmed=true;s.lastHeld={a:input.a,b:input.b,x:input.x,y:input.y,direction};return s;
 }
 return Object.freeze({create,step,config});
});
