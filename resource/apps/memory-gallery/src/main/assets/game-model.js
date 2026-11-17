/* Memory Gallery: visible previews and pairs; the concealed deck stays private. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x)),privateStates=new WeakMap();
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({defaultSeed:760,comparisonSeconds:1,maxElapsed:86400,maxCounter:2147483647,
    symbols:['RING','TRIANGLE','DIAMOND','STAR','FLOWER','SUN','LEAF','MOON','HEXAGON','CROSS'],layouts:[
      {id:'small-salon',name:'SMALL SALON',nameZh:'小厅初展',width:4,height:3,pairCount:6,previewSeconds:2.5,mistakeLimit:4},
      {id:'square-hall',name:'SQUARE HALL',nameZh:'方厅巡展',width:4,height:4,pairCount:8,previewSeconds:2,mistakeLimit:5},
      {id:'grand-gallery',name:'GRAND GALLERY',nameZh:'长廊终展',width:5,height:4,pairCount:10,previewSeconds:1.5,mistakeLimit:6}
    ]});
  function shuffled(seed,level,count){let word=(seed^Math.imul(level+1,0x9e3779b9))>>>0;
    function random(){word=(word+0x6d2b79f5)>>>0;let t=word;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
    const deck=Array.from({length:count*2},(_,i)=>Math.floor(i/2)+1);
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1)),v=deck[i];deck[i]=deck[j];deck[j]=v;}return deck;
  }
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
    level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level],deck=shuffled(seed,level,l.pairCount);
    const s={schema:1,seed,level,phase:'playing',reason:'',score:0,stage:'preview',width:l.width,height:l.height,pairCount:l.pairCount,mistakeLimit:l.mistakeLimit,
      cursor:0,visibleFaces:deck.slice(),locked:Array(deck.length).fill(false),first:null,second:null,matchedPairs:0,mistakes:0,previewRemaining:l.previewSeconds,compareRemaining:0,
      elapsed:0,elapsedCapped:false,calls:0,flips:0,cursorMoves:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,
      lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,message:'先记住展品位置；预览结束后翻开两张相同卡片。'};
    privateStates.set(s,{deck});return s;
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
    try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
      for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
      const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
      return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
        cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
    }catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function inc(s,key){s[key]=Math.min(config.maxCounter,s[key]+1);}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){inc(s,'blockedActions');event(s,'blocked',{reason});
    s.message=reason==='preview'?'预览期间先记忆，等卡片盖上再按 A。':reason==='compare'?'先观察这两张；比较结束后松开再翻。':reason==='locked'?'这组已配对，不需要再翻。':reason==='same-card'?'请选择另一张卡片，不能和自己配对。':'已到陈列边缘，光标不会跨行。';}
  function settle(s,cause){s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':'mistakes';s.score=cause==='success'?100:0;
    event(s,cause==='success'?'win':'collision',cause==='success'?{matchedPairs:s.matchedPairs}:{reason:'mistakes'});
    s.message=cause==='success'?'全部展品已成对陈列，记忆挑战完成。':'错配次数已到上限，本次巡展结束。';
    s.terminalReceipt=copy({cause,level:s.level,call:s.calls,elapsed:s.elapsed,stage:s.stage,cursor:s.cursor,visibleFaces:s.visibleFaces,locked:s.locked,
      matchedPairs:s.matchedPairs,mistakes:s.mistakes,flips:s.flips,score:s.score,phase:s.phase,reason:s.reason});}
  function flip(s){
    if(s.stage!=='choosing')return blocked(s,s.stage);const index=s.cursor;
    if(s.locked[index])return blocked(s,'locked');if(s.first===index)return blocked(s,'same-card');
    s.visibleFaces[index]=privateStates.get(s).deck[index];inc(s,'flips');
    if(s.first===null){s.first=index;event(s,'flip',{index});s.message='已翻开第一张；寻找同样图形和编号的另一张。';return;}
    s.second=index;const indices=[s.first,s.second];
    if(s.visibleFaces[s.first]===s.visibleFaces[s.second]){s.locked[s.first]=true;s.locked[s.second]=true;s.first=null;s.second=null;s.matchedPairs++;
      if(s.matchedPairs===config.layouts[s.level].pairCount)return settle(s,'success');
      event(s,'match',{indices,matchedPairs:s.matchedPairs});s.message='配对成功，展品保持正面。';
    }else{s.stage='compare';s.compareRemaining=config.comparisonSeconds;event(s,'compare',{indices});s.message='两张不同，记住位置；一秒后盖回并计一次错配。';}
  }
  function move(s,dir){const l=config.layouts[s.level],x=s.cursor%l.width,y=Math.floor(s.cursor/l.width),dx=dir==='right'?1:dir==='left'?-1:0,dy=dir==='down'?1:dir==='up'?-1:0;
    if(x+dx<0||x+dx>=l.width||y+dy<0||y+dy>=l.height)return blocked(s,'edge');const from=s.cursor;s.cursor+=dx+dy*l.width;inc(s,'cursorMoves');event(s,'move',{from,to:s.cursor});s.message='第 '+(Math.floor(s.cursor/l.width)+1)+' 行，第 '+(s.cursor%l.width+1)+' 列。';}
  function advanceTimer(s,oldStage,dt){
    if(oldStage==='preview'){s.previewRemaining=Math.max(0,s.previewRemaining-dt);
      if(s.previewRemaining===0){s.visibleFaces=Array(s.visibleFaces.length).fill(null);s.stage='choosing';event(s,'ready',{});s.message='卡片已盖上。回想位置，每次翻开两张。';}}
    else if(oldStage==='compare'){s.compareRemaining=Math.max(0,s.compareRemaining-dt);
      if(s.compareRemaining===0){const indices=[s.first,s.second];s.visibleFaces[s.first]=null;s.visibleFaces[s.second]=null;s.first=null;s.second=null;s.mistakes++;s.stage='choosing';
        if(s.mistakes>=config.layouts[s.level].mistakeLimit)return settle(s,'mistakes');event(s,'hide',{indices,mistakes:s.mistakes});s.message='已盖回错配卡片；错配 '+s.mistakes+'/'+s.mistakeLimit+'。';}}
  }
  function step(s,dt,raw){
    if(!privateStates.has(s)||s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const oldStage=s.stage,dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';inc(s,'calls');const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;if(cmd==='a')flip(s);else if(cmd!=='none')move(s,cmd);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};
    if(s.phase==='playing')advanceTimer(s,oldStage,dt);return s;
  }
  return Object.freeze({create,step,config});
});
