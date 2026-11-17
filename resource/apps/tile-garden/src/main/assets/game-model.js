/* Tile Garden: public face-up layers, lateral freedom, and order-dependent pair removal. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":778,"maxMistakes":3,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"clover-court","name":"CLOVER COURT","nameZh":"三叶小庭","width":4,"height":3,"layers":1,"tiles":[{"id":0,"layer":0,"x":0,"y":0,"family":3},{"id":1,"layer":0,"x":1,"y":0,"family":2},{"id":2,"layer":0,"x":2,"y":0,"family":3},{"id":3,"layer":0,"x":3,"y":0,"family":2},{"id":4,"layer":0,"x":0,"y":1,"family":1},{"id":5,"layer":0,"x":1,"y":1,"family":2},{"id":6,"layer":0,"x":2,"y":1,"family":1},{"id":7,"layer":0,"x":3,"y":1,"family":1},{"id":8,"layer":0,"x":0,"y":2,"family":3},{"id":9,"layer":0,"x":1,"y":2,"family":1},{"id":10,"layer":0,"x":2,"y":2,"family":2},{"id":11,"layer":0,"x":3,"y":2,"family":3}]},{"id":"terraced-bloom","name":"TERRACED BLOOM","nameZh":"台地花影","width":5,"height":3,"layers":2,"tiles":[{"id":0,"layer":0,"x":0,"y":0,"family":4},{"id":1,"layer":0,"x":1,"y":0,"family":1},{"id":2,"layer":0,"x":2,"y":0,"family":4},{"id":3,"layer":0,"x":3,"y":0,"family":3},{"id":4,"layer":0,"x":4,"y":0,"family":1},{"id":5,"layer":0,"x":0,"y":1,"family":4},{"id":6,"layer":0,"x":1,"y":1,"family":2},{"id":7,"layer":0,"x":2,"y":1,"family":4},{"id":8,"layer":0,"x":3,"y":1,"family":2},{"id":9,"layer":0,"x":4,"y":1,"family":5},{"id":10,"layer":0,"x":0,"y":2,"family":5},{"id":11,"layer":0,"x":1,"y":2,"family":2},{"id":12,"layer":0,"x":2,"y":2,"family":3},{"id":13,"layer":0,"x":3,"y":2,"family":3},{"id":14,"layer":0,"x":4,"y":2,"family":2},{"id":15,"layer":1,"x":0,"y":0,"family":1},{"id":16,"layer":1,"x":1,"y":0,"family":5},{"id":17,"layer":1,"x":3,"y":1,"family":5},{"id":18,"layer":1,"x":4,"y":1,"family":3},{"id":19,"layer":1,"x":2,"y":2,"family":1}]},{"id":"canopy-garden","name":"CANOPY GARDEN","nameZh":"冠层花园","width":6,"height":4,"layers":2,"tiles":[{"id":0,"layer":0,"x":0,"y":0,"family":1},{"id":1,"layer":0,"x":1,"y":0,"family":6},{"id":2,"layer":0,"x":2,"y":0,"family":6},{"id":3,"layer":0,"x":3,"y":0,"family":6},{"id":4,"layer":0,"x":4,"y":0,"family":3},{"id":5,"layer":0,"x":5,"y":0,"family":4},{"id":6,"layer":0,"x":0,"y":1,"family":4},{"id":7,"layer":0,"x":1,"y":1,"family":5},{"id":8,"layer":0,"x":2,"y":1,"family":2},{"id":9,"layer":0,"x":3,"y":1,"family":3},{"id":10,"layer":0,"x":4,"y":1,"family":7},{"id":11,"layer":0,"x":5,"y":1,"family":7},{"id":12,"layer":0,"x":0,"y":2,"family":5},{"id":13,"layer":0,"x":1,"y":2,"family":1},{"id":14,"layer":0,"x":2,"y":2,"family":7},{"id":15,"layer":0,"x":3,"y":2,"family":2},{"id":16,"layer":0,"x":4,"y":2,"family":1},{"id":17,"layer":0,"x":5,"y":2,"family":2},{"id":18,"layer":0,"x":0,"y":3,"family":3},{"id":19,"layer":0,"x":1,"y":3,"family":4},{"id":20,"layer":0,"x":2,"y":3,"family":5},{"id":21,"layer":0,"x":3,"y":3,"family":1},{"id":22,"layer":0,"x":4,"y":3,"family":6},{"id":23,"layer":0,"x":5,"y":3,"family":2},{"id":24,"layer":1,"x":0,"y":0,"family":3},{"id":25,"layer":1,"x":1,"y":0,"family":7},{"id":26,"layer":1,"x":4,"y":2,"family":4},{"id":27,"layer":1,"x":5,"y":2,"family":5}]}]});
function blockedReason(s,t){
 if(t.removed)return 'removed';
 if(s.tiles.some(u=>!u.removed&&u.layer>t.layer&&u.x===t.x&&u.y===t.y))return 'covered';
 const left=s.tiles.some(u=>!u.removed&&u.layer===t.layer&&u.y===t.y&&u.x===t.x-1),right=s.tiles.some(u=>!u.removed&&u.layer===t.layer&&u.y===t.y&&u.x===t.x+1);
 return left&&right?'sides':'';
}
function refresh(s){
 s.remaining=s.tiles.reduce((sum,t)=>sum+(!t.removed?1:0),0);s.freeTiles=s.tiles.filter(t=>!blockedReason(s,t)).map(t=>t.id);s.availablePairs=[];
 for(let i=0;i<s.freeTiles.length;i++)for(let j=i+1;j<s.freeTiles.length;j++){const a=s.freeTiles[i],b=s.freeTiles[j];if(s.tiles[a].family===s.tiles[b].family)s.availablePairs.push([a,b]);}
}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
 level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];
 const s={schema:1,seed,level,phase:'playing',reason:'',score:0,width:l.width,height:l.height,layerCount:l.layers,tiles:l.tiles.map(t=>Object.assign({},t,{removed:false})),cursor:0,layerCursor:0,selected:null,freeTiles:[],availablePairs:[],remaining:l.tiles.length,pairsRemoved:0,mistakes:0,maxMistakes:config.maxMistakes,lastPair:null,lastMismatch:null,receipts:[],terminalReceipt:null,
  elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'A 选择可用的同族牌配对，B 切换层。牌上方须无覆盖，左右至少一侧空着。'};
 refresh(s);return s;
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,won,reason){
 s.phase=won?'won':'lost';s.reason=won?'':reason;s.score=won?100:0;
 s.message=won?'所有花牌已成对收齐。':reason==='deadlock'?'仍有花牌，但已经没有可配对的自由牌。':'已错配三次，请重新安排配对。';
 event(s,won?'win':'collision',{reason:s.reason});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,tiles:s.tiles,remaining:s.remaining,pairsRemoved:s.pairsRemoved,mistakes:s.mistakes,selected:s.selected,layerCursor:s.layerCursor,cursor:s.cursor,freeTiles:s.freeTiles,availablePairs:s.availablePairs});
}
function command(s,key){
 if(key==='a'){
  const x=s.cursor%s.width,y=Math.floor(s.cursor/s.width),tile=s.tiles.find(t=>!t.removed&&t.layer===s.layerCursor&&t.x===x&&t.y===y);
  if(!tile)return blocked(s,'empty','此格没有花牌，不消耗错配机会。');
  const reason=blockedReason(s,tile);if(reason)return blocked(s,reason,reason==='covered'?'同坐标上层仍有花牌，先移除覆盖牌。':'左右两侧都有相邻牌，暂时不能选取。');
  if(s.selected===tile.id){s.selected=null;event(s,'cancel-selection',{tile:tile.id});s.message='已取消第一张牌，不消耗机会。';return;}
  if(s.selected===null){s.selected=tile.id;event(s,'select',{tile:tile.id});s.message='已选择 '+tile.family+' 族花牌；找另一张可用的同族牌，可以 B 切换层。';return;}
  const first=s.tiles[s.selected];s.selected=null;
  if(first.family!==tile.family){s.mistakes++;s.lastMismatch={tiles:[first.id,tile.id],families:[first.family,tile.family]};s.receipts.push({type:'mismatch',tiles:[first.id,tile.id],mistakes:s.mistakes});if(s.mistakes>=s.maxMistakes)return finish(s,false,'mistakes');event(s,'mismatch',copy(s.lastMismatch));s.message='两张牌不同族，已错配 '+s.mistakes+'/3；选择已清除。';return;}
  first.removed=true;tile.removed=true;s.pairsRemoved++;s.lastPair={tiles:[first.id,tile.id],family:tile.family};refresh(s);s.receipts.push({type:'pair',tiles:[first.id,tile.id],family:tile.family,remaining:s.remaining});
  if(s.remaining===0)return finish(s,true,'');if(!s.availablePairs.length)return finish(s,false,'deadlock');event(s,'pair',copy(s.lastPair));s.message='同族花牌已移除；剩余 '+s.remaining+' 张，继续观察可用边缘。';return;
 }
 if(key==='b'){
  if(s.layerCount===1)return blocked(s,'single-layer','本关只有底层；已选花牌保留。');
  const from=s.layerCursor;s.layerCursor=(s.layerCursor+1)%s.layerCount;event(s,'layer',{from,to:s.layerCursor});s.message='已切换到第 '+(s.layerCursor+1)+' 层，光标坐标和第一张选择保持不变。';return;
 }
 if(key==='none')return;
 const x=s.cursor%s.width,y=Math.floor(s.cursor/s.width),nx=Math.max(0,Math.min(s.width-1,x+(key==='right'?1:key==='left'?-1:0))),ny=Math.max(0,Math.min(s.height-1,y+(key==='down'?1:key==='up'?-1:0))),to=ny*s.width+nx;
 if(to===s.cursor)return blocked(s,'boundary','光标已到当前层边缘。');const from=s.cursor;s.cursor=to;event(s,'cursor',{from,to});s.message='A 选择或配对；B 切换层，同族数字与图形一致。';
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
