/* Nim Orbit: normal/misere takeaway with a fully public optimal opponent. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({defaultSeed:776,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'first-orbit',name:'FIRST ORBIT',nameZh:'初始轨道',piles:[2,3,4],misere:false},
    {id:'four-moons',name:'FOUR MOONS',nameZh:'四月列阵',piles:[3,5,6,2],misere:false},
    {id:'leave-one',name:'LEAVE ONE',nameZh:'留下一颗',piles:[1,3,4,5],misere:true}
  ]});
  function refresh(s){s.remaining=s.piles.reduce((a,b)=>a+b,0);const n=s.piles[s.selected];s.amount=n?Math.max(1,Math.min(s.amount,n)):0;}
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level],total=l.piles.reduce((a,b)=>a+b,0);
    return {schema:1,seed,level,phase:'playing',reason:'',score:0,piles:l.piles.slice(),selected:0,amount:1,misere:l.misere,lastStoneRule:l.misere?'loses':'wins',remaining:total,initialTotal:total,
      playerMoves:0,aiMoves:0,totalMoves:0,playerRemoved:0,aiRemoved:0,lastPlayerMove:null,lastAiMove:null,lastRound:null,
      elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:l.misere?'本关反规则：取走最后一颗者负。左右选堆，上下选数量，A 确认。':'本关正常规则：取走最后一颗者胜。左右选堆，上下选数量，A 确认。'};
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
    for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=reason==='empty-pile'?'这一堆已空，请左右选择另一堆。':reason==='min-amount'?'每次至少取走一颗。':'不能超过这一堆的现有颗数。';}
  function losing(piles,misere){if(misere&&piles.every(n=>n<=1))return piles.filter(Boolean).length%2===1;return piles.reduce((a,b)=>a^b,0)===0;}
  function chooseAi(piles,misere){for(let pile=0;pile<piles.length;pile++)for(let removed=1;removed<=piles[pile];removed++){const next=piles.slice();next[pile]-=removed;if(losing(next,misere))return {pile,removed};}
    let pile=0;for(let k=1;k<piles.length;k++)if(piles[k]>piles[pile])pile=k;return {pile,removed:1};}
  function remove(s,side,pile,removed){const before=s.piles[pile];s.piles[pile]-=removed;s.totalMoves++;
    if(side==='player'){s.playerMoves++;s.playerRemoved+=removed;}else{s.aiMoves++;s.aiRemoved+=removed;}refresh(s);
    return {side,pile,removed,before,after:s.piles[pile],remaining:s.remaining,moveNumber:s.totalMoves};}
  function settle(s,side){s.reason=side==='player'?'player-last':'opponent-last';const playerLast=side==='player';s.phase=(s.misere?!playerLast:playerLast)?'won':'lost';s.score=s.phase==='won'?100:0;
    event(s,s.phase==='won'?'win':'collision',{reason:s.reason});s.message=(playerLast?'你':'对手')+'取走了最后一颗；本关取最后者'+(s.misere?'负。':'胜。');
    s.terminalReceipt=copy({cause:s.reason,level:s.level,call:s.calls,elapsed:s.elapsed,piles:s.piles,misere:s.misere,remaining:s.remaining,playerMoves:s.playerMoves,aiMoves:s.aiMoves,totalMoves:s.totalMoves,playerRemoved:s.playerRemoved,aiRemoved:s.aiRemoved,lastRound:s.lastRound,score:s.score,phase:s.phase,reason:s.reason});}
  function confirm(s){if(s.piles[s.selected]===0)return blocked(s,'empty-pile');s.lastAiMove=null;s.lastPlayerMove=remove(s,'player',s.selected,s.amount);s.lastRound={player:copy(s.lastPlayerMove),opponent:null};
    if(s.remaining===0)return settle(s,'player');const ai=chooseAi(s.piles,s.misere);s.lastAiMove=remove(s,'opponent',ai.pile,ai.removed);s.lastRound.opponent=copy(s.lastAiMove);
    if(s.remaining===0)return settle(s,'opponent');event(s,'move',{player:copy(s.lastPlayerMove),opponent:copy(s.lastAiMove)});s.message='对手从第 '+(ai.pile+1)+' 堆取走 '+ai.removed+' 颗，轮到你；本关取最后者'+(s.misere?'负。':'胜。');}
  function navigate(s,dir){if(dir==='left'||dir==='right'){const from=s.selected;s.selected=(s.selected+(dir==='right'?1:s.piles.length-1))%s.piles.length;refresh(s);event(s,'cursor',{from,to:s.selected,amount:s.amount});return;}
    if(s.piles[s.selected]===0)return blocked(s,'empty-pile');const from=s.amount,to=Math.max(1,Math.min(s.piles[s.selected],from+(dir==='up'?1:-1)));if(to===from)return blocked(s,dir==='up'?'max-amount':'min-amount');s.amount=to;event(s,'amount',{from,to});}
  function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);refresh(s);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;if(cmd==='a')confirm(s);else if(cmd!=='none')navigate(s,cmd);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
