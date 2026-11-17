/* Seed Mancala: public Kalah positions and a fully specified deterministic opponent. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({defaultSeed:770,maxSows:160,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'amber-harvest',name:'AMBER HARVEST',nameZh:'琥珀丰收',pits:[2,0,1,1,0,1,6,1,1,1,1,1,4,4]},
    {id:'narrow-margin',name:'NARROW MARGIN',nameZh:'一籽之差',pits:[1,1,0,2,2,0,4,0,2,1,1,0,3,7]},
    {id:'winding-return',name:'WINDING RETURN',nameZh:'回环收籽',pits:[0,2,2,2,0,0,5,2,1,1,1,2,1,5]}
  ]});
  function sum(pits,start){let n=0;for(let k=start;k<start+6;k++)n+=pits[k];return n;}
  function refresh(s){s.playerStore=s.pits[6];s.aiStore=s.pits[13];}
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;
    const pits=config.layouts[level].pits.slice(),s={schema:1,seed,level,phase:'playing',reason:'',score:0,pits,selected:0,totalSeeds:pits.reduce((a,b)=>a+b,0),playerStore:0,aiStore:0,
      sowCount:0,playerSows:0,aiSows:0,playerCaptured:0,aiCaptured:0,playerExtraTurns:0,aiExtraTurns:0,lastPlayerSow:null,lastAiSows:[],lastSow:null,aiBurstCount:0,
      elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:'选下排非空种穴，按 A 逐颗播种；末籽入己仓可再走。上排是对手，右仓归你。'};refresh(s);return s;
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
    for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  // Pure one-sow simulation is also the opponent's public greedy evaluation.
  function sow(pits,side,from){const board=pits.slice(),ownStart=side==='player'?0:7,store=side==='player'?6:13,skip=side==='player'?13:6;
    const seeds=board[from],beforeStore=board[store],path=[];let last=from,captured=0,opposite=null;board[from]=0;
    for(let k=0;k<seeds;k++){last=(last+1)%14;if(last===skip)last=(last+1)%14;board[last]++;path.push(last);}
    if(last>=ownStart&&last<ownStart+6&&board[last]===1&&board[12-last]>0){opposite=12-last;captured=board[opposite]+1;board[store]+=captured;board[last]=0;board[opposite]=0;}
    const natural=sum(board,0)===0||sum(board,7)===0,swept={player:0,opponent:0};
    if(natural){swept.player=sum(board,0);swept.opponent=sum(board,7);board[6]+=swept.player;board[13]+=swept.opponent;for(let k=0;k<6;k++){board[k]=0;board[k+7]=0;}}
    return {pits:board,natural,receipt:{side,from,seeds,path,last,captured,opposite,extraTurn:last===store&&!natural,storeGain:board[store]-beforeStore,swept,storesAfter:[board[6],board[13]],sowNumber:0}};
  }
  function chooseAi(pits){const options=[];for(let p=7;p<13;p++)if(pits[p]>0)options.push(sow(pits,'opponent',p));
    options.sort((a,b)=>Number(b.receipt.extraTurn)-Number(a.receipt.extraTurn)||b.receipt.captured-a.receipt.captured||b.receipt.storeGain-a.receipt.storeGain||a.receipt.from-b.receipt.from);return options[0];}
  function settle(s,reason){s.reason=reason;s.phase=reason==='majority'?'won':'lost';s.score=s.phase==='won'?100:0;refresh(s);event(s,s.phase==='won'?'win':'collision',{reason});
    s.message=reason==='majority'?'收盘完成，你的种仓更多！':reason==='tie'?'两仓籽数相同，平局按本关失败处理。':reason==='minority'?'收盘完成，对手的种仓更多。':'已达160次播种，未决平局按失败处理。';
    s.terminalReceipt=copy({cause:reason,level:s.level,call:s.calls,elapsed:s.elapsed,pits:s.pits,sowCount:s.sowCount,playerSows:s.playerSows,aiSows:s.aiSows,playerStore:s.playerStore,aiStore:s.aiStore,lastPlayerSow:s.lastPlayerSow,lastAiSows:s.lastAiSows,score:s.score,phase:s.phase,reason:s.reason});}
  function execute(s,result){const r=result.receipt;s.pits=result.pits.slice();s.sowCount++;r.sowNumber=s.sowCount;
    if(r.side==='player'){s.playerSows++;s.playerCaptured+=r.captured;if(r.extraTurn)s.playerExtraTurns++;s.lastPlayerSow=copy(r);}
    else{s.aiSows++;s.aiCaptured+=r.captured;if(r.extraTurn)s.aiExtraTurns++;s.lastAiSows.push(copy(r));s.aiBurstCount=s.lastAiSows.length;}
    s.lastSow=copy(r);refresh(s);
    if(result.natural)settle(s,s.playerStore>s.aiStore?'majority':s.playerStore===s.aiStore?'tie':'minority');else if(s.sowCount>=config.maxSows)settle(s,'sow-limit');return r.extraTurn;
  }
  function confirm(s){if(s.pits[s.selected]===0){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason:'empty-pit'});s.message='这个种穴为空；请选择其他非空下排种穴。';return;}
    s.lastAiSows=[];s.aiBurstCount=0;const extra=execute(s,sow(s.pits,'player',s.selected));if(s.phase!=='playing')return;
    if(!extra){let again=true;while(again&&s.phase==='playing')again=execute(s,chooseAi(s.pits));}if(s.phase!=='playing')return;
    event(s,'sow',{player:copy(s.lastPlayerSow),opponentSows:s.aiBurstCount,extraTurn:extra});s.message=extra?'末籽进入己仓，你可再播一次；仍选任意非空下排种穴。':'对手完成 '+s.aiBurstCount+' 次播种；轮到你。末籽落入空己穴且对穴非空时可吃籽。';
  }
  function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=i.x>.5?'right':i.x<-.5?'left':'none',old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);refresh(s);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;
      if(cmd==='a')confirm(s);else if(cmd!=='none'){const from=s.selected;s.selected=(s.selected+(cmd==='right'?1:5))%6;event(s,'cursor',{from,to:s.selected});}}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
