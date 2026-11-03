/* Traffic Escape: selected cars slide on fixed axes, undo never refunds the slide budget. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":772,"size":6,"exitRow":2,"targetId":0,"initialUndoTokens":3,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"morning-lane","name":"MORNING LANE","nameZh":"晨间车道","moveLimit":30,"cars":[{"id":0,"axis":"H","length":2,"x":0,"y":2,"target":true},{"id":1,"axis":"V","length":2,"x":4,"y":2,"target":false},{"id":2,"axis":"H","length":3,"x":0,"y":5,"target":false},{"id":3,"axis":"H","length":2,"x":0,"y":1,"target":false},{"id":4,"axis":"H","length":3,"x":3,"y":4,"target":false},{"id":5,"axis":"H","length":2,"x":4,"y":0,"target":false}]},{"id":"crossing-yard","name":"CROSSING YARD","nameZh":"交织停车场","moveLimit":45,"cars":[{"id":0,"axis":"H","length":2,"x":0,"y":2,"target":true},{"id":1,"axis":"H","length":2,"x":2,"y":4,"target":false},{"id":2,"axis":"H","length":2,"x":0,"y":4,"target":false},{"id":3,"axis":"V","length":2,"x":4,"y":1,"target":false},{"id":4,"axis":"V","length":3,"x":2,"y":0,"target":false},{"id":5,"axis":"H","length":2,"x":0,"y":1,"target":false},{"id":6,"axis":"V","length":2,"x":5,"y":4,"target":false},{"id":7,"axis":"H","length":2,"x":1,"y":3,"target":false}]},{"id":"evening-depot","name":"EVENING DEPOT","nameZh":"暮色车库","moveLimit":60,"cars":[{"id":0,"axis":"H","length":2,"x":0,"y":2,"target":true},{"id":1,"axis":"H","length":2,"x":4,"y":0,"target":false},{"id":2,"axis":"V","length":2,"x":2,"y":2,"target":false},{"id":3,"axis":"H","length":2,"x":0,"y":1,"target":false},{"id":4,"axis":"H","length":3,"x":2,"y":5,"target":false},{"id":5,"axis":"H","length":2,"x":2,"y":4,"target":false},{"id":6,"axis":"V","length":2,"x":4,"y":2,"target":false},{"id":7,"axis":"V","length":2,"x":1,"y":4,"target":false},{"id":8,"axis":"H","length":2,"x":4,"y":4,"target":false},{"id":9,"axis":"H","length":2,"x":0,"y":3,"target":false}]}]});
function refresh(s){
 s.occupancy=Array(36).fill(-1);
 for(const c of s.cars)for(let k=0;k<c.length;k++){const x=c.x+(c.axis==='H'?k:0),y=c.y+(c.axis==='V'?k:0);if(x>=0&&x<6&&y>=0&&y<6)s.occupancy[y*6+x]=c.id;}
}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
 level=Number.isInteger(level)&&level>=0&&level<3?level:0;const layout=config.layouts[level],cars=copy(layout.cars);
 const s={schema:1,seed,level,phase:'playing',reason:'',score:0,cars,occupancy:[],cursor:cars[0].y*6+cars[0].x,selected:null,movesUsed:0,moveLimit:layout.moveLimit,undoTokens:config.initialUndoTokens,undos:0,escaped:false,history:[],lastSlide:null,terminalReceipt:null,
  elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'方向选格，A 选车；选中后沿车身方向滑动一格。让 1 号车从右侧出口驶离。'};
 refresh(s);return s;
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,won){
 s.phase=won?'won':'lost';s.reason=won?'':'moves';s.score=won?100:0;s.message=won?'1 号车已通过右侧出口。':'逐格移动额度已用完，请重新规划车阵。';
 event(s,won?'win':'collision',{reason:s.reason});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,cars:s.cars,occupancy:s.occupancy,cursor:s.cursor,selected:s.selected,movesUsed:s.movesUsed,moveLimit:s.moveLimit,undoTokens:s.undoTokens,undos:s.undos,escaped:s.escaped});
}
function slide(s,dx,dy){
 const c=s.cars[s.selected];
 if(c.axis==='H'?dy!==0:dx!==0)return blocked(s,'axis','车辆只能沿车身方向移动，不能横移或转弯。');
 const nx=c.x+dx,ny=c.y+dy,exit=c.id===config.targetId&&c.target&&c.axis==='H'&&c.length===2&&c.y===config.exitRow&&c.x===4&&dx===1;
 if(!exit){
  if(nx<0||ny<0||nx+(c.axis==='H'?c.length:1)>6||ny+(c.axis==='V'?c.length:1)>6)return blocked(s,'boundary','车辆不能越过边框；只有 1 号车可从右侧出口驶离。');
  for(let k=0;k<c.length;k++){const cell=(ny+(c.axis==='V'?k:0))*6+nx+(c.axis==='H'?k:0),other=s.occupancy[cell];if(other!==-1&&other!==c.id)return blocked(s,'occupied','前方有车阻挡，先腾出空间。');}
 }
 s.history.push({positions:s.cars.map(v=>({x:v.x,y:v.y})),cursor:s.cursor});
 const from={x:c.x,y:c.y};c.x=nx;c.y=ny;s.movesUsed++;s.escaped=exit;
 const cursorX=Math.max(0,Math.min(5,s.cursor%6+dx)),cursorY=Math.max(0,Math.min(5,Math.floor(s.cursor/6)+dy));s.cursor=cursorY*6+cursorX;
 s.lastSlide={car:c.id,from,to:{x:nx,y:ny},exit};refresh(s);
 if(exit)return finish(s,true);if(s.movesUsed>=s.moveLimit)return finish(s,false);
 event(s,'slide',copy(s.lastSlide));s.message=(c.id+1)+' 号车已移动一格；A 放下车辆，B 撤回但不退步数。';
}
function command(s,key){
 if(key==='a'){
  if(s.selected!==null){const car=s.selected;s.selected=null;event(s,'release',{car});s.message='已放下车辆；方向键移动光标，A 选择另一辆车。';return;}
  const car=s.occupancy[s.cursor];if(car<0)return blocked(s,'empty','这里没有车辆，请把光标移到车身上。');
  s.selected=car;event(s,'select',{car});s.message='已选 '+(car+1)+' 号车；'+(s.cars[car].axis==='H'?'左右':'上下')+'移车，A 放下。';return;
 }
 if(key==='b'){
  if(!s.undoTokens)return blocked(s,'undo-limit','三张撤回票已用完。');
  if(!s.history.length)return blocked(s,'empty-history','还没有可以撤回的移动。');
  const old=s.history.pop();old.positions.forEach((p,i)=>{s.cars[i].x=p.x;s.cars[i].y=p.y;});s.cursor=old.cursor;s.selected=null;s.undoTokens--;s.undos++;s.escaped=false;s.lastSlide=null;refresh(s);
  event(s,'undo',{movesUsed:s.movesUsed,undoTokens:s.undoTokens});s.message='已撤回并放下车辆；已用步数不退，剩余撤回票 '+s.undoTokens+'。';return;
 }
 if(key==='none')return;
 const dx=key==='right'?1:key==='left'?-1:0,dy=key==='down'?1:key==='up'?-1:0;
 if(s.selected!==null)return slide(s,dx,dy);
 const x=s.cursor%6,y=Math.floor(s.cursor/6),nx=Math.max(0,Math.min(5,x+dx)),ny=Math.max(0,Math.min(5,y+dy)),to=ny*6+nx;
 if(to===s.cursor)return blocked(s,'cursor-boundary','光标已到边缘。');const from=s.cursor;s.cursor=to;event(s,'cursor',{from,to});s.message='A 选中光标下的车辆；B 撤回上一次移车。';
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
