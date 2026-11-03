/* Stone Bay: single-cell walking and pushing, with nonrefundable push effort. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  function layout(id,name,nameZh,rows,pushLimit){
    const cells=rows.join('').split('');
    return {id,name,nameZh,rows,width:rows[0].length,height:rows.length,walls:cells.map(c=>c==='#'),
      targets:cells.map((c,i)=>c==='.'?i:-1).filter(i=>i>=0),crates:cells.map((c,i)=>c==='$'?i:-1).filter(i=>i>=0),player:cells.indexOf('@'),pushLimit};
  }
  const config=freeze({defaultSeed:752,historyLimit:128,maxElapsed:86400,maxCounter:2147483647,layouts:[
    layout('twin-gate','TWIN GATE','双石门庭',['#######','#..   #','# $$  #','#  #  #','# @   #','#######'],8),
    layout('pillar-court','PILLAR COURT','柱影庭院',['########','#  .   #','#  #.  #','# $$ $ #','# .#   #','#   @  #','########'],11),
    layout('winding-yard','WINDING YARD','曲径石场',['########','#  . . #','# #    #','# $$$  #','#   #. #','# @    #','########'],13)
  ]});
  function matched(s){return config.layouts[s.level].targets.filter(p=>s.crates.includes(p)).length;}
  function create(seed,level){
    seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
    level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;
    const l=config.layouts[level];
    return {schema:1,seed,level,phase:'playing',reason:'',score:0,width:l.width,height:l.height,walls:l.walls.slice(),targets:l.targets.slice(),
      crates:l.crates.slice(),player:l.player,pushLimit:l.pushLimit,facing:'down',matched:0,pushCount:0,steps:0,undos:0,historyDropped:0,history:[],
      elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,
      lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:'站到石箱后面推向圆形石座；只能推，不能拉。A 撤回但不退推力。'};
  }
  function normalized(input){
    const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
    try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();
      const v=Object.create(null);for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){
        const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
      const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
      return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
        cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
    }catch(_){return neutral();}
  }
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function inc(s,key){s[key]=Math.min(config.maxCounter,s[key]+1);}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){inc(s,'blockedActions');event(s,'blocked',{reason});
    s.message=reason==='no-history'?'没有可撤回的脚步。':reason==='crate-chain'?'石箱不能连推，先绕路腾出空位。':reason==='crate-wall'?'石箱前方是石墙，不能推入。':'前方是石墙，请绕行。';}
  function neighbor(p,dir,l){const x=p%l.width,y=Math.floor(p/l.width),dx=dir==='right'?1:dir==='left'?-1:0,dy=dir==='down'?1:dir==='up'?-1:0;
    if(x+dx<0||x+dx>=l.width||y+dy<0||y+dy>=l.height)return -1;return p+dx+dy*l.width;}
  function remember(s){s.history.push({player:s.player,crates:s.crates.slice(),facing:s.facing});
    if(s.history.length>config.historyLimit){s.history.shift();inc(s,'historyDropped');}}
  function settle(s,cause){s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':'pushes';s.score=cause==='success'?100:0;
    event(s,cause==='success'?'win':'collision',cause==='success'?{pushCount:s.pushCount,matched:s.matched}:{reason:'pushes'});
    s.message=cause==='success'?'全部石箱已落座，庭院归整完成。':'本次推力额度已耗尽，仍有石箱未落座。';
    s.terminalReceipt=copy({cause,level:s.level,call:s.calls,elapsed:s.elapsed,player:s.player,crates:s.crates,facing:s.facing,matched:s.matched,
      pushCount:s.pushCount,steps:s.steps,undos:s.undos,score:s.score,phase:s.phase,reason:s.reason});}
  function walk(s,dir){
    const l=config.layouts[s.level],from=s.player,to=neighbor(from,dir,l);
    if(to<0||l.walls[to])return blocked(s,'wall');
    const crateIndex=s.crates.indexOf(to);let beyond=-1;
    if(crateIndex>=0){beyond=neighbor(to,dir,l);if(beyond<0||l.walls[beyond])return blocked(s,'crate-wall');
      if(s.crates.includes(beyond))return blocked(s,'crate-chain');}
    remember(s);s.player=to;s.facing=dir;inc(s,'steps');
    if(crateIndex<0){event(s,'walk',{from,to});s.message='步行不耗推力；站到箱子后方才能推动。';return;}
    s.crates[crateIndex]=beyond;s.pushCount++;s.matched=matched(s);
    if(s.matched===l.targets.length)return settle(s,'success');
    if(s.pushCount>=l.pushLimit)return settle(s,'pushes');
    event(s,'push',{from,to,crateFrom:to,crateTo:beyond,pushCount:s.pushCount,matched:s.matched});
    s.message='已推动石箱，落座 '+s.matched+'/'+l.targets.length+'；剩余 '+(l.pushLimit-s.pushCount)+' 次推力。';
  }
  function undo(s){if(!s.history.length)return blocked(s,'no-history');const old=s.history.pop();
    s.player=old.player;s.crates=old.crates.slice();s.facing=old.facing;s.matched=matched(s);inc(s,'undos');
    event(s,'undo',{player:s.player,pushCount:s.pushCount});s.message='已撤回一步；累计 '+s.pushCount+' 次推力不返还。';}
  function step(s,dt,raw){
    if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
    const i=normalized(raw);if(i.paused)return s;const dir=direction(i),old=s.lastHeld,armed=s.inputArmed;
    const disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';inc(s,'calls');const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const command=i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=command;
      if(command==='a')undo(s);else if(command!=='none')walk(s,command);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;
    s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
