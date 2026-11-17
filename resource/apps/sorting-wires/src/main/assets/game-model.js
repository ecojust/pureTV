/* Sorting Wires: edit disjoint layer comparators; explicitly check every binary input. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":775,"initialAttempts":3,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"three-thread","name":"THREE THREAD","nameZh":"三线试织","wires":3,"layers":3,"inventory":3},{"id":"four-channel","name":"FOUR CHANNEL","nameZh":"四路交汇","wires":4,"layers":3,"inventory":5},{"id":"five-stream","name":"FIVE STREAM","nameZh":"五股排序","wires":5,"layers":5,"inventory":9}]});
function refresh(s){s.comparatorsUsed=s.network.reduce((sum,layer)=>sum+layer.length,0);s.inventoryLeft=s.inventoryLimit-s.comparatorsUsed;}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
 level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];
 return {schema:1,seed,level,phase:'playing',reason:'',score:0,wires:l.wires,layerCount:l.layers,inventoryLimit:l.inventory,network:Array.from({length:l.layers},()=>[]),selectedLayer:0,selectedWire:0,marked:null,comparatorsUsed:0,inventoryLeft:l.inventory,edits:0,networkVersion:0,attemptsLeft:config.initialAttempts,checks:0,lastCheck:null,lastCheckCurrent:false,checkReceipts:[],terminalReceipt:null,
  elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'左右选层，上下选线；A 选择两端安装比较器，B 检查全部二进制输入。'};
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function edited(s){s.lastCheckCurrent=false;s.edits=Math.min(config.maxCounter,s.edits+1);s.networkVersion=Math.min(config.maxCounter,s.networkVersion+1);refresh(s);}
function run(network,input){
 let values=input.slice();const trace=[values.slice()];
 for(const layer of network){const previous=values;values=previous.slice();for(const pair of layer){values[pair.a]=Math.min(previous[pair.a],previous[pair.b]);values[pair.b]=Math.max(previous[pair.a],previous[pair.b]);}trace.push(values.slice());}
 return {output:values,trace};
}
function check(s){
 const total=2**s.wires;let sortedCount=0,firstFailure=null;
 for(let index=0;index<total;index++){
  const input=Array.from({length:s.wires},(_,wire)=>(index>>(s.wires-1-wire))&1),result=run(s.network,input);
  const sorted=result.output.every((v,i)=>i===0||result.output[i-1]<=v);
  if(sorted)sortedCount++;else if(firstFailure===null)firstFailure={index,input,output:result.output,trace:result.trace};
 }
 s.checks++;s.attemptsLeft--;s.lastCheckCurrent=true;s.lastCheck={passed:sortedCount===total,total,sortedCount,firstFailure,networkVersion:s.networkVersion};
 s.checkReceipts.push({network:copy(s.network),result:copy(s.lastCheck)});event(s,'check',{passed:s.lastCheck.passed,sortedCount,total});
 if(s.lastCheck.passed)return finish(s,true);if(s.attemptsLeft===0)return finish(s,false);
 s.message='本次通过 '+sortedCount+'/'+total+' 组；右侧显示第一个失败样例，还有 '+s.attemptsLeft+' 次检查。';
}
function finish(s,won){
 s.phase=won?'won':'lost';s.reason=won?'':'checks';s.score=won?100:0;s.message=won?'全部二进制输入都已升序排列。':'三次检查已用完，网络仍有失败样例。';
 event(s,won?'win':'collision',{reason:s.reason});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,network:s.network,comparatorsUsed:s.comparatorsUsed,attemptsLeft:s.attemptsLeft,checks:s.checks,lastCheck:s.lastCheck});
}
function command(s,key){
 if(key==='a'){
  const layer=s.selectedLayer,wire=s.selectedWire,pairs=s.network[layer],occupied=pairs.findIndex(p=>p.a===wire||p.b===wire);
  if(s.marked){
   if(s.marked.layer!==layer)return blocked(s,'different-layer','两端必须位于同一层；回到标记层，或按 B 取消。');
   if(s.marked.wire===wire){s.marked=null;event(s,'cancel-mark',{});s.message='已取消起点，不消耗检查次数。';return;}
   if(occupied>=0)return blocked(s,'occupied-endpoint','这一层的该线路已有比较器端点，不能重复连接。');
   if(s.inventoryLeft<=0)return blocked(s,'inventory','比较器库存已用完，先移除一个。');
   const pair={a:Math.min(s.marked.wire,wire),b:Math.max(s.marked.wire,wire)};pairs.push(pair);pairs.sort((a,b)=>a.a-b.a||a.b-b.b);s.marked=null;edited(s);event(s,'install',{layer,pair:copy(pair)});s.message='比较器已安装：上端取小值，下端取大值。完成后 B 手动检查。';return;
  }
  if(occupied>=0){const pair=pairs.splice(occupied,1)[0];edited(s);event(s,'remove',{layer,pair:copy(pair)});s.message='已移除比较器并退回库存。';return;}
  if(s.inventoryLeft<=0)return blocked(s,'inventory','比较器库存已用完；A 点已有端点可以移除并退回库存。');
  s.marked={layer,wire};event(s,'mark',copy(s.marked));s.message='已标记起点；同层另一条空闲线按 A 接通，B 取消。';return;
 }
 if(key==='b'){
  if(s.marked){s.marked=null;event(s,'cancel-mark',{});s.message='已取消起点，不消耗检查次数。';return;}
  return check(s);
 }
 if(key==='none')return;
 const layer=Math.max(0,Math.min(s.layerCount-1,s.selectedLayer+(key==='right'?1:key==='left'?-1:0))),wire=Math.max(0,Math.min(s.wires-1,s.selectedWire+(key==='down'?1:key==='up'?-1:0)));
 if(layer===s.selectedLayer&&wire===s.selectedWire)return blocked(s,'boundary','光标已到网络边缘。');
 s.selectedLayer=layer;s.selectedWire=wire;event(s,'cursor',{layer,wire});s.message='第 '+(layer+1)+' 层、第 '+(wire+1)+' 线；A 编辑，B '+(s.marked?'取消起点。':'检查网络。');
}
function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
 try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
  for(const k of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,k);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[k]=d.value;}
  const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
  return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
 }catch(_){return neutral();}
}
function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);return x<=.5&&y<=.5?'none':y>=x?(i.y>0?'down':'up'):(i.x>0?'right':'left');}
function step(s,dt,raw){
 if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
 const i=normalized(raw);if(i.paused)return s;const dir=direction(i),old=s.lastHeld,armed=s.inputArmed;
 const disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
 s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;s.elapsedCapped=s.elapsedCapped||elapsed>config.maxElapsed;s.elapsed=Math.min(config.maxElapsed,elapsed);
 if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
 if(!disarm&&!i.cancelled&&armed){s.lastCommand=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';command(s,s.lastCommand);}
 if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
}
return Object.freeze({create,step,config});
});
