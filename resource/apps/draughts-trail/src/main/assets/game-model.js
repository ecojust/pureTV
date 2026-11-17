/* Draughts Trail: mandatory short jumps and visible deterministic opponent turns. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  function board(pm,pk,em,ek){const b=Array(36).fill(0);pm.forEach(p=>b[p]=1);pk.forEach(p=>b[p]=2);em.forEach(p=>b[p]=-1);ek.forEach(p=>b[p]=-2);return b;}
  const config=freeze({size:6,defaultSeed:768,maxHalfTurns:80,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'first-crossing',name:'FIRST CROSSING',nameZh:'初渡棋径',board:board([30,32,34],[],[1,3,5],[])},
    {id:'broken-ranks',name:'BROKEN RANKS',nameZh:'断阵棋径',board:board([25,29,32,34],[],[1,3,6,10],[])},
    {id:'crown-passage',name:'CROWN PASSAGE',nameZh:'王冠通路',board:board([25,27,30,34],[20],[1,3,10,17],[8])}
  ]});
  function dirs(piece){return Math.abs(piece)===2?[[-1,-1],[1,-1],[-1,1],[1,1]]:piece>0?[[-1,-1],[1,-1]]:[[-1,1],[1,1]];}
  function inside(x,y){return x>=0&&x<6&&y>=0&&y<6;}
  function jumps(b,p){const piece=b[p],x=p%6,y=Math.floor(p/6),out=[];if(!piece)return out;
    for(const [dx,dy]of dirs(piece)){const xx=x+2*dx,yy=y+2*dy;if(!inside(xx,yy))continue;const mid=(y+dy)*6+x+dx,to=yy*6+xx;if(b[mid]*piece<0&&b[to]===0)out.push({to,captured:mid});}return out;}
  function ordinary(b,p){const piece=b[p],x=p%6,y=Math.floor(p/6),out=[];if(!piece)return out;
    for(const [dx,dy]of dirs(piece)){const xx=x+dx,yy=y+dy;if(inside(xx,yy)&&b[yy*6+xx]===0)out.push({to:yy*6+xx,captured:null});}return out;}
  function promotion(piece,to){return Math.abs(piece)===1&&(piece>0?Math.floor(to/6)===0:Math.floor(to/6)===5);}
  function captureSources(b,side){const out=[];b.forEach((v,p)=>{if(v*side>0&&jumps(b,p).length)out.push(p);});return out;}
  function allTurns(b,side){const starts=captureSources(b,side),out=[];
    function follow(position,p,path,captured,promoted){const choices=promoted?[]:jumps(position,p);if(!choices.length){out.push({board:position,path,captured,promoted});return;}
      for(const move of choices){const next=position.slice(),piece=next[p],crown=promotion(piece,move.to);next[p]=0;next[move.captured]=0;next[move.to]=crown?piece*2:piece;follow(next,move.to,path.concat(move.to),captured.concat(move.captured),crown);}}
    if(starts.length){starts.forEach(p=>follow(b.slice(),p,[p],[],false));return out;}
    b.forEach((piece,p)=>{if(piece*side<=0)return;for(const move of ordinary(b,p)){const next=b.slice(),crown=promotion(piece,move.to);next[p]=0;next[move.to]=crown?piece*2:piece;out.push({board:next,path:[p,move.to],captured:[],promoted:crown});}});return out;
  }
  function comparePath(a,b){for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])return a[i]-b[i];return a.length-b.length;}
  function pickAi(turns){const capturing=turns[0].captured.length>0;return turns.slice().sort((a,b)=>{
    if(capturing&&a.captured.length!==b.captured.length)return b.captured.length-a.captured.length;
    if(a.promoted!==b.promoted)return Number(b.promoted)-Number(a.promoted);
    if(!capturing){const row=Math.floor(b.path[b.path.length-1]/6)-Math.floor(a.path[a.path.length-1]/6);if(row)return row;}
    return comparePath(a.path,b.path);})[0];}
  function refresh(s){s.playerPieces=s.board.filter(v=>v>0).length;s.aiPieces=s.board.filter(v=>v<0).length;s.forcedPieces=captureSources(s.board,1);
    s.legalDestinations=s.selected===null?[]:(s.chainActive||s.forcedPieces.length?jumps(s.board,s.selected):ordinary(s.board,s.selected)).map(m=>m.to);}
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const b=config.layouts[level].board.slice();
    const s={schema:1,seed,level,phase:'playing',reason:'',score:0,board:b,cursor:b.findIndex(v=>v>0),selected:null,chainActive:false,legalDestinations:[],forcedPieces:[],halfTurns:0,playerTurns:0,aiTurns:0,
      playerCaptures:0,aiCaptures:0,playerPieces:0,aiPieces:0,pendingPath:[],pendingCaptured:[],lastPlayerTurn:null,lastAiTurn:null,elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,
      inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:'你执浅色向上走；能跳吃就必须跳吃，升王立即结束该回合。A 选子与落点，B 取消未跳吃的选择。'};refresh(s);return s;}
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
    for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});const messages={edge:'已到棋盘边缘。','select-piece':'请先选可行动的浅色棋子。','capture-required':'全盘有可跳吃的棋子，必须先跳吃。','no-move':'这枚棋子没有合法行动。','same-piece':'已选中此子，请选高亮落点或 B 取消。','illegal-destination':'该格不是当前棋子的合法落点。','capture-chain':'连跳必须由同一枚棋子完成，不能取消或换子。','no-selection':'当前没有待取消的选择。'};s.message=messages[reason];}
  function settle(s,cause){s.phase=cause.startsWith('opponent-')?'won':'lost';s.reason=cause;s.score=s.phase==='won'?100:0;refresh(s);
    event(s,s.phase==='won'?'win':'collision',{reason:cause});s.message=s.phase==='won'?'对方已无棋子或无合法行动，你赢得本局。':cause==='turn-limit'?'已达80个半回合，和局按本关失败处理。':'己方已无棋子或无合法行动，本局结束。';
    s.terminalReceipt=copy({cause,level:s.level,call:s.calls,elapsed:s.elapsed,board:s.board,halfTurns:s.halfTurns,playerTurns:s.playerTurns,aiTurns:s.aiTurns,playerCaptures:s.playerCaptures,aiCaptures:s.aiCaptures,lastPlayerTurn:s.lastPlayerTurn,lastAiTurn:s.lastAiTurn,score:s.score,phase:s.phase,reason:s.reason});}
  function receipt(path,captured,promoted,halfTurn){return {from:path[0],path:path.slice(),captured:captured.slice(),promoted,halfTurn};}
  function finishTurn(s,promoted){s.halfTurns++;s.playerTurns++;s.lastPlayerTurn=receipt(s.pendingPath,s.pendingCaptured,promoted,s.halfTurns);s.selected=null;s.chainActive=false;s.pendingPath=[];s.pendingCaptured=[];refresh(s);
    const choices=allTurns(s.board,-1);if(!choices.length)return settle(s,s.aiPieces===0?'opponent-empty':'opponent-blocked');if(s.halfTurns>=config.maxHalfTurns)return settle(s,'turn-limit');
    const ai=pickAi(choices);s.board=ai.board.slice();s.halfTurns++;s.aiTurns++;s.aiCaptures+=ai.captured.length;s.lastAiTurn=receipt(ai.path,ai.captured,ai.promoted,s.halfTurns);refresh(s);
    if(!allTurns(s.board,1).length)return settle(s,s.playerPieces===0?'player-empty':'player-blocked');if(s.halfTurns>=config.maxHalfTurns)return settle(s,'turn-limit');
    event(s,'turn',{player:copy(s.lastPlayerTurn),ai:copy(s.lastAiTurn)});s.message=s.forcedPieces.length?'对方已完成行动；当前有跳吃，必须选可跳吃的浅色棋子。':'对方已完成行动，轮到你选择浅色棋子。';}
  function selectPiece(s,p){if(s.forcedPieces.length&&!s.forcedPieces.includes(p))return blocked(s,'capture-required');const options=s.forcedPieces.length?jumps(s.board,p):ordinary(s.board,p);if(!options.length)return blocked(s,'no-move');
    s.selected=p;s.pendingPath=[p];s.pendingCaptured=[];refresh(s);event(s,'select',{piece:p});s.message='已选棋子；选择带圆点的合法落格，再按 A。';}
  function confirm(s){const p=s.cursor;if(s.selected===null){if(s.board[p]<=0)return blocked(s,'select-piece');return selectPiece(s,p);}
    if(!s.chainActive&&s.board[p]>0){if(p===s.selected)return blocked(s,'same-piece');return selectPiece(s,p);}
    if(s.chainActive&&s.board[p]>0&&p!==s.selected)return blocked(s,'capture-chain');
    const from=s.selected,options=s.chainActive||s.forcedPieces.length?jumps(s.board,from):ordinary(s.board,from),move=options.find(m=>m.to===p);if(!move)return blocked(s,'illegal-destination');
    const piece=s.board[from],promoted=promotion(piece,p);s.board[from]=0;s.board[p]=promoted?piece*2:piece;s.pendingPath.push(p);
    if(move.captured!==null){s.board[move.captured]=0;s.pendingCaptured.push(move.captured);s.playerCaptures++;}
    if(move.captured!==null&&!promoted&&jumps(s.board,p).length){s.selected=p;s.chainActive=true;refresh(s);event(s,'capture',{from,to:p,captured:move.captured,continuations:s.legalDestinations.slice()});s.message='必须继续由这枚棋子连跳；不能取消或换子。';return;}
    finishTurn(s,promoted);
  }
  function cancel(s){if(s.chainActive)return blocked(s,'capture-chain');if(s.selected===null)return blocked(s,'no-selection');s.selected=null;s.pendingPath=[];s.pendingCaptured=[];refresh(s);event(s,'cancel',{});s.message='已取消选择，尚未移动棋子。';}
  function cursorMove(s,dir){const x=s.cursor%6,y=Math.floor(s.cursor/6),dx=dir==='right'?1:dir==='left'?-1:0,dy=dir==='down'?1:dir==='up'?-1:0;if(!inside(x+dx,y+dy))return blocked(s,'edge');const from=s.cursor;s.cursor+=dx+dy*6;event(s,'cursor',{from,to:s.cursor});}
  function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);refresh(s);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;if(cmd==='b')cancel(s);else if(cmd==='a')confirm(s);else if(cmd!=='none')cursorMove(s,cmd);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
