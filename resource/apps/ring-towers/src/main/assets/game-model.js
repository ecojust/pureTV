/* Ring Towers: top-ring transfer under strict size ordering. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({defaultSeed:755,target:2,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'copper-three',name:'COPPER THREE',nameZh:'铜环初阶',diskCount:3,moveLimit:11},
    {id:'cobalt-four',name:'COBALT FOUR',nameZh:'钴蓝四环',diskCount:4,moveLimit:21},
    {id:'coral-five',name:'CORAL FIVE',nameZh:'珊瑚五环',diskCount:5,moveLimit:39}
  ]});
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
    level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level];
    return {schema:1,seed,level,phase:'playing',reason:'',score:0,diskCount:l.diskCount,target:config.target,
      pegs:[Array.from({length:l.diskCount},(_,i)=>l.diskCount-i),[],[]],selected:0,source:null,movesUsed:0,moveLimit:l.moveLimit,
      transfers:[],lastMove:null,elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,
      lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:'左右选柱；A 标记来源，再选落点按 A 搬环。大环不能压小环，B 取消来源。'};}
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
    try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
      for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
      const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
      return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
        cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
    }catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});
    s.message=reason==='empty-source'?'该柱为空，请选有环的来源柱。':reason==='same-peg'?'来源和落点是同一柱，请选择另一柱。':reason==='larger-on-smaller'?'大环不能压在小环上；来源仍保留，可换落点或 B 取消。':'还未选来源，不需要取消。';}
  function settle(s,cause,detail){s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':'moves';s.score=cause==='success'?100:0;
    event(s,cause==='success'?'win':'collision',cause==='success'?detail:{reason:'moves'});
    s.message=cause==='success'?'整座环塔已迁到右侧目标柱。':'搬环额度已耗尽，环塔尚未全部抵达目标柱。';
    s.terminalReceipt=copy({cause,level:s.level,call:s.calls,elapsed:s.elapsed,pegs:s.pegs,selected:s.selected,source:s.source,movesUsed:s.movesUsed,score:s.score,phase:s.phase,reason:s.reason});}
  function confirm(s){
    if(s.source===null){const peg=s.pegs[s.selected];if(!peg.length)return blocked(s,'empty-source');s.source=s.selected;
      event(s,'source',{peg:s.source,disk:peg[peg.length-1]});s.message='已标记第 '+(s.source+1)+' 柱顶环；环仍在原柱，请选择落点。';return;}
    const from=s.source,to=s.selected,origin=s.pegs[from],dest=s.pegs[to],disk=origin[origin.length-1];
    if(from===to)return blocked(s,'same-peg');
    if(dest.length&&dest[dest.length-1]<disk)return blocked(s,'larger-on-smaller');
    origin.pop();dest.push(disk);s.source=null;s.movesUsed++;
    const receipt={index:s.transfers.length,from,to,disk,call:s.calls};s.transfers.push(receipt);s.lastMove=copy(receipt);
    const detail={from,to,disk,movesUsed:s.movesUsed},l=config.layouts[s.level];
    if(s.pegs[config.target].length===l.diskCount)return settle(s,'success',detail);
    if(s.movesUsed>=l.moveLimit)return settle(s,'moves');
    event(s,'transfer',detail);s.message=disk+' 号环已从第 '+(from+1)+' 柱迁到第 '+(to+1)+' 柱；剩余 '+(l.moveLimit-s.movesUsed)+' 次。';
  }
  function cancel(s){if(s.source===null)return blocked(s,'no-source');const peg=s.source;s.source=null;event(s,'cancel',{peg});s.message='已取消来源；环的位置和搬动次数不变。';}
  function step(s,dt,raw){
    if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;
      if(cmd==='b')cancel(s);else if(cmd==='a')confirm(s);else if(cmd==='left'||cmd==='right'){const from=s.selected;s.selected=(from+(cmd==='right'?1:2))%3;event(s,'select',{from,to:s.selected});s.message='已选择第 '+(s.selected+1)+' 柱；'+(s.source===null?'A 标记来源。':'A 尝试落环。');}}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
