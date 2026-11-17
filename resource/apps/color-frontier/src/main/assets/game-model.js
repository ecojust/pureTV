/* Color Frontier: orthogonal flood growth with a nonrefundable dye budget. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  function layout(id,name,nameZh,rows,moveLimit){return {id,name,nameZh,width:rows[0].length,height:rows.length,cells:rows.join('').split('').map(Number),moveLimit};}
  const config=freeze({defaultSeed:749,maxElapsed:86400,maxCounter:2147483647,
    colors:[{name:'CORAL',nameZh:'珊瑚',hex:'#e48f79'},{name:'GOLD',nameZh:'金黄',hex:'#e8c66e'},{name:'JADE',nameZh:'青玉',hex:'#77bca6'},{name:'INDIGO',nameZh:'靛蓝',hex:'#9396ca'}],
    layouts:[layout('spring-cove','SPRING COVE','春湾渗染',['00122','03122','03312','33011','22211'],6),
      layout('delta-weave','DELTA WEAVE','三角洲纹',['001122','301232','330230','223130','211103','221003'],8),
      layout('island-chain','ISLAND CHAIN','岛链回染',['012301','112301','002233','032110','033100','222003'],9)]});
  function component(cells,w,h){
    const owned=Array(cells.length).fill(false),queue=[0];owned[0]=true;
    for(let q=0;q<queue.length;q++){const n=queue[q],x=n%w,y=Math.floor(n/w);
      for(const k of [x?n-1:-1,x<w-1?n+1:-1,y?n-w:-1,y<h-1?n+w:-1])
        if(k>=0&&!owned[k]&&cells[k]===cells[0]){owned[k]=true;queue.push(k);}}
    return {owned,ownedCount:queue.length};
  }
  function create(seed,level){
    seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
    level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;
    const l=config.layouts[level],cells=l.cells.slice(),area=component(cells,l.width,l.height);
    return {schema:1,seed,level,phase:'playing',reason:'',score:0,width:l.width,height:l.height,cells,
      owned:area.owned,ownedCount:area.ownedCount,color:cells[0],selected:1,movesUsed:0,moveLimit:l.moveLimit,
      history:[],undos:0,lastGain:0,elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,
      inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},
      lastCommand:'none',events:[],terminalReceipt:null,message:'从左上角连疆；左右选染料，A 扩染，B 撤回但不退次数。'};
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
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
  function settle(s,cause,gained){
    s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':'moves';s.score=cause==='success'?100:0;
    event(s,cause==='success'?'win':'collision',cause==='success'?{color:s.color,gained,ownedCount:s.ownedCount,movesUsed:s.movesUsed}:{reason:'moves'});
    s.message=cause==='success'?'整幅地图已连成一色，染疆完成。':'染料次数已耗尽，仍有区域未连接。';
    s.terminalReceipt=copy({cause,level:s.level,call:s.calls,elapsed:s.elapsed,cells:s.cells,owned:s.owned,ownedCount:s.ownedCount,
      color:s.color,selected:s.selected,movesUsed:s.movesUsed,undos:s.undos,score:s.score,phase:s.phase,reason:s.reason});
  }
  function flood(s){
    if(s.selected===s.color)return blocked(s,'same-color','当前区域已经是该颜色，不消耗次数。');
    const l=config.layouts[s.level],before=s.ownedCount;
    s.history.push({cells:s.cells.slice(),owned:s.owned.slice(),ownedCount:s.ownedCount,color:s.color});
    for(let n=0;n<s.cells.length;n++)if(s.owned[n])s.cells[n]=s.selected;
    s.color=s.selected;const area=component(s.cells,l.width,l.height);s.owned=area.owned;s.ownedCount=area.ownedCount;
    s.movesUsed++;s.lastGain=s.ownedCount-before;
    if(s.ownedCount===l.cells.length)return settle(s,'success',s.lastGain);
    if(s.movesUsed>=l.moveLimit)return settle(s,'moves');
    event(s,'flood',{color:s.color,gained:s.lastGain,ownedCount:s.ownedCount,movesUsed:s.movesUsed});
    s.message='扩染为'+config.colors[s.color].nameZh+'，新连入 '+s.lastGain+' 格；剩余 '+(l.moveLimit-s.movesUsed)+' 次。';
  }
  function undo(s){
    if(!s.history.length)return blocked(s,'no-history','没有可撤回的扩染；次数不变。');
    const old=s.history.pop();s.cells=old.cells.slice();s.owned=old.owned.slice();s.ownedCount=old.ownedCount;s.color=old.color;
    s.undos=Math.min(config.maxCounter,s.undos+1);s.lastGain=0;event(s,'undo',{ownedCount:s.ownedCount,movesUsed:s.movesUsed});
    s.message='已撤回地图；已用 '+s.movesUsed+' 次染料不返还。';
  }
  function step(s,dt,raw){
    if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
    const i=normalized(raw);if(i.paused)return s;
    const d=direction(i),old=s.lastHeld,armed=s.inputArmed;
    const disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);
    const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const command=i.b&&!old.b?'b':i.a&&!old.a?'a':d!=='none'&&d!==old.direction?d:'none';s.lastCommand=command;
      if(command==='b')undo(s);else if(command==='a')flood(s);else if(command==='left'||command==='right'){
        const from=s.selected;s.selected=(from+(command==='right'?1:3))%4;event(s,'select',{from,to:s.selected});
        s.message='已选择'+config.colors[s.selected].nameZh+'染料；A 扩染相连区域。';}}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&d==='none')s.inputArmed=true;
    s.lastHeld={a:i.a,b:i.b,direction:d};return s;
  }
  return Object.freeze({create,step,config});
});
