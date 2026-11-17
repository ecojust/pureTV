/* Pocket Solitaire: one-card FreeCell moves, fixed foundations and paid undo tickets. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({defaultSeed:779,maxElapsed:86400,maxCounter:2147483647,historyLimit:2,suits:[{id:'C',name:'CLUBS',nameZh:'梅花',color:0},{id:'D',name:'DIAMONDS',nameZh:'方块',color:1},{id:'S',name:'SPADES',nameZh:'黑桃',color:0},{id:'H',name:'HEARTS',nameZh:'红心',color:1}],layouts:[
    {id:'first-reserve',name:'FIRST RESERVE',nameZh:'初识暂存',maxRank:3,moveLimit:50,tableau:[[0,1,2],[3,4,5],[6,7,8],[9,10,11]]},
    {id:'woven-suits',name:'WOVEN SUITS',nameZh:'花色交织',maxRank:4,moveLimit:70,tableau:[[0,5,10,15],[4,9,14,3],[8,13,2,7],[12,1,6,11]]},
    {id:'pocket-weave',name:'POCKET WEAVE',nameZh:'口袋织局',maxRank:5,moveLimit:90,tableau:[[0,6,12,18,4],[5,11,17,3,9],[10,16,2,8,14],[15,1,7,13,19]]}
  ]});
  function refresh(s){s.foundationCount=s.foundations.reduce((a,b)=>a+b,0);s.remaining=s.cards.length-s.foundationCount;}
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level];
    return {schema:1,seed,level,phase:'playing',reason:'',score:0,cards:Array.from({length:l.maxRank*4},(_,id)=>({id,suit:Math.floor(id/l.maxRank),rank:id%l.maxRank+1,color:Math.floor(id/l.maxRank)%2})),maxRank:l.maxRank,tableau:copy(l.tableau),freecells:[null,null],foundations:[0,0,0,0],cursor:0,selectedSource:null,movesUsed:0,moveLimit:l.moveLimit,undoTickets:2,undosUsed:0,history:[],foundationCount:0,remaining:l.maxRank*4,lastMove:null,lastUndo:null,
      elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:'A 选一张顶牌，再选目的地；牌列按红黑交替降1，归位区同花升1。B 撤销消耗票且不退步数。'};
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
    for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});const messages={'navigation-bound':'这一方向没有另一排位置。','foundation-source':'归位区不能作为起点；已归位牌只能通过有限撤销回退。','empty-source':'这里没有可选顶牌。','occupied-freecell':'暂存格已占用，每格只能放一张。','tableau-rule':'目标牌列必须为空，或顶牌颜色相反且比移动牌大1。','foundation-rule':'归位区只接收本花色下一点数，从1开始。','no-tickets':'两张撤销票已用完。','no-history':'当前没有可撤销的移动。'};s.message=messages[reason];}
  function top(s,p){return p<4?(s.tableau[p].length?s.tableau[p][s.tableau[p].length-1]:null):p<6?s.freecells[p-4]:null;}
  function positions(s){return copy({tableau:s.tableau,freecells:s.freecells,foundations:s.foundations});}
  function settle(s,reason){s.phase=reason==='complete'?'won':'lost';s.reason=reason;s.score=s.phase==='won'?100:0;refresh(s);event(s,s.phase==='won'?'win':'collision',{reason});s.message=reason==='complete'?'四个花色全部按序归位，接龙完成。':'有效移动次数已用完，尚有牌未归位。';
    s.terminalReceipt=copy({cause:reason,level:s.level,call:s.calls,elapsed:s.elapsed,tableau:s.tableau,freecells:s.freecells,foundations:s.foundations,movesUsed:s.movesUsed,moveLimit:s.moveLimit,undoTickets:s.undoTickets,undosUsed:s.undosUsed,lastMove:s.lastMove,score:s.score,phase:s.phase,reason:s.reason});}
  function confirm(s){const to=s.cursor,from=s.selectedSource;
    if(from===null){if(to>=6)return blocked(s,'foundation-source');const card=top(s,to);if(card===null)return blocked(s,'empty-source');s.selectedSource=to;event(s,'select',{source:to,card});s.message='已选顶牌；选择目标后按 A，或在同一位置按 A 取消。';return;}
    if(to===from){s.selectedSource=null;event(s,'cancel',{source:from});s.message='已取消选牌，未消耗步数。';return;}
    const id=top(s,from),card=s.cards[id];if(to<4){const target=top(s,to);if(target!==null&&(s.cards[target].color===card.color||s.cards[target].rank!==card.rank+1))return blocked(s,'tableau-rule');}
    else if(to<6){if(s.freecells[to-4]!==null)return blocked(s,'occupied-freecell');}
    else if(to-6!==card.suit||s.foundations[card.suit]+1!==card.rank)return blocked(s,'foundation-rule');
    s.history.push(positions(s));if(s.history.length>config.historyLimit)s.history.shift();if(from<4)s.tableau[from].pop();else s.freecells[from-4]=null;
    if(to<4)s.tableau[to].push(id);else if(to<6)s.freecells[to-4]=id;else s.foundations[card.suit]++;
    s.movesUsed++;s.selectedSource=null;s.lastMove={card:id,from,to,move:s.movesUsed};s.lastUndo=null;refresh(s);
    if(s.foundationCount===s.cards.length)return settle(s,'complete');if(s.movesUsed>=s.moveLimit)return settle(s,'moves');event(s,'move',copy(s.lastMove));s.message='移动完成；牌列红黑交替降1，空列可放任意牌。';
  }
  function undo(s){if(s.undoTickets===0)return blocked(s,'no-tickets');if(s.history.length===0)return blocked(s,'no-history');const before=s.foundations.slice(),previous=s.history.pop();s.tableau=copy(previous.tableau);s.freecells=previous.freecells.slice();s.foundations=previous.foundations.slice();s.undoTickets--;s.undosUsed++;s.selectedSource=null;s.lastMove=null;s.lastUndo={ticket:s.undosUsed,movesUsed:s.movesUsed,foundationsBefore:before,foundationsAfter:s.foundations.slice()};refresh(s);event(s,'undo',{ticket:s.undosUsed,movesUsed:s.movesUsed});s.message='已撤销上次移动；消耗1张撤销票，已用步数不返还。';}
  function navigate(s,dir){const from=s.cursor;let to=from;if(dir==='left'||dir==='right')to=(from+(dir==='right'?1:9))%10;else if(dir==='up'&&from<4)to=from+4;else if(dir==='down'&&from>=4)to=Math.min(from-4,3);if(to===from)return blocked(s,'navigation-bound');s.cursor=to;event(s,'cursor',{from,to});}
  function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);refresh(s);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;if(cmd==='b')undo(s);else if(cmd==='a')confirm(s);else if(cmd!=='none')navigate(s,cmd);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
