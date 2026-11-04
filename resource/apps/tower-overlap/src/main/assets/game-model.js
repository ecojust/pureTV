/* Tower Overlap: timed horizontal placement, exact intersection and finite floor goals. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const EPS=1e-10,copy=v=>JSON.parse(JSON.stringify(v));
 function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
 const config=freeze({defaultSeed:764,fieldWidth:600,minWidth:16,dropDuration:.3,offcutLifetime:1.2,maxElapsed:86400,maxCounter:2147483647,
  layouts:[{id:'steady-yard',name:'STEADY YARD',nameZh:'匀速工地',width:220,speed:145,goal:6,profile:'steady',period:1},
   {id:'pulse-yard',name:'PULSE YARD',nameZh:'节拍工地',width:200,speed:170,goal:8,profile:'pulse',period:1.6},
   {id:'swell-yard',name:'SWELL YARD',nameZh:'渐速工地',width:180,speed:195,goal:10,profile:'swell',period:2.4},
   {id:'signal-yard',name:'SIGNAL YARD',nameZh:'信号停走',width:205,speed:175,goal:8,profile:'signal',period:1.8},
   {id:'gust-yard',name:'GUST YARD',nameZh:'阵风高塔',width:190,speed:180,goal:12,profile:'gust',period:1.5},
   {id:'skyline-yard',name:'SKYLINE YARD',nameZh:'天际冲刺',width:170,speed:185,goal:14,profile:'ramp',period:2}]});
 function segment(l,cycle){
  if(l.profile==='steady')return{end:l.period,value:1,slope:0};
  if(l.profile==='pulse')return{end:cycle<.8?.8:l.period,value:cycle<.8?1.2:.8,slope:0};
  if(l.profile==='swell')return{end:cycle<1.2?1.2:l.period,value:cycle<1.2?.7+.5*cycle:1.3-.5*(cycle-1.2),slope:cycle<1.2?.5:-.5};
  if(l.profile==='signal')return{end:cycle<.35?.35:l.period,value:cycle<.35?0:1.2,slope:0};
  if(l.profile==='gust')return{end:cycle<.45?.45:cycle<.9?.9:l.period,value:cycle<.45?.55:cycle<.9?1.6:.9,slope:0};
  return{end:l.period,value:.55+.45*cycle,slope:.45};
 }
 function factor(l,cycle){return segment(l,cycle).value;}
 function freshSlab(l,width,index){const direction=index%2?-1:1;return{x:direction===1?0:config.fieldWidth-width,width,direction,velocity:direction*l.speed*factor(l,0),cycle:0};}
 function create(seed,level){
  seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level];
  return{schema:1,seed,level,phase:'playing',reason:'',score:0,mode:'moving',floors:[{index:0,x:(600-l.width)/2,width:l.width}],floorsBuilt:0,goal:l.goal,
   slab:freshSlab(l,l.width,0),dropElapsed:0,drops:0,offcuts:[],lastLanding:null,elapsed:0,elapsedCapped:false,calls:0,inputArmed:false,
   cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,x:0,y:0},lastCommand:'none',events:[],terminalReceipt:null,
   message:'石板自动往返；看准与下层重合时按 A 落下。'};
 }
 function normalized(raw){
  const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
  try{if(!raw||typeof raw!=='object'||Array.isArray(raw))return neutral();const v=Object.create(null);
   for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(raw,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
   const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
   return{x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
  }catch(_){return neutral();}
 }
 function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
 function ageCuts(s,dt){s.offcuts=s.offcuts.map(c=>({x:c.x,width:c.width,side:c.side,age:Math.min(config.offcutLifetime,c.age+dt)})).filter(c=>c.age<config.offcutLifetime-EPS);}
 function travel(l,cycle,dt){
  let left=dt,distance=0,clock=cycle;
  while(left>0){
   const part=segment(l,clock),boundary=part.end;
   let span=Math.min(left,boundary-clock);
   if(span<=0){clock=boundary>=l.period-EPS?0:boundary;continue;}
   distance+=l.speed*(part.value*span+part.slope*span*span/2);clock+=span;left-=span;
   if(clock>=l.period-EPS)clock=0;else if(Math.abs(clock-boundary)<EPS)clock=boundary;
  }
  return{distance,cycle:clock};
 }
 function move(s,dt){
  const l=config.layouts[s.level],slab=s.slab,result=travel(l,slab.cycle,dt),limit=config.fieldWidth-slab.width;
  let unfolded=(slab.direction===1?slab.x:2*limit-slab.x)+result.distance;
  unfolded=((unfolded%(2*limit))+2*limit)%(2*limit);
  if(Math.abs(unfolded)<EPS||Math.abs(unfolded-2*limit)<EPS){slab.x=0;slab.direction=1;}
  else if(Math.abs(unfolded-limit)<EPS){slab.x=limit;slab.direction=-1;}
  else if(unfolded<limit){slab.x=unfolded;slab.direction=1;}else{slab.x=2*limit-unfolded;slab.direction=-1;}
  slab.cycle=result.cycle;slab.velocity=slab.direction*l.speed*factor(l,slab.cycle);
 }
 function land(s){
  const slab=s.slab,previous=s.floors[s.floors.length-1],x=Math.max(slab.x,previous.x),rawRight=Math.min(slab.x+slab.width,previous.x+previous.width);
  let width=Math.max(0,rawRight-x);
  // Analytically exact contacts can accumulate a few floating-point ulps.
  // Canonicalize only the two rule boundaries within the declared tolerance.
  if(width<EPS)width=0;else if(Math.abs(width-config.minWidth)<=EPS)width=config.minWidth;
  const right=x+width;
  const leftTrim=width>0?Math.max(0,x-slab.x):slab.x<previous.x?slab.width:0,rightTrim=width>0?Math.max(0,slab.x+slab.width-right):slab.x>=previous.x?slab.width:0;
  const accepted=width>=config.minWidth,index=s.floorsBuilt+1,cause=width===0?'miss':!accepted?'too-narrow':index===s.goal?'success':'safe';
  s.lastLanding={drop:s.drops,index,sourceX:slab.x,sourceWidth:slab.width,previousX:previous.x,previousWidth:previous.width,x,width,leftTrim,rightTrim,accepted,cause};
  s.offcuts=[];if(leftTrim>0)s.offcuts.push({x:slab.x,width:leftTrim,side:-1,age:0});if(rightTrim>0)s.offcuts.push({x:width>0?right:slab.x,width:rightTrim,side:1,age:0});
  if(accepted){s.floors.push({index,x,width});s.floorsBuilt++;}
  const terminal=cause!=='safe',fields={index,x,width,leftTrim,rightTrim};
  if(terminal){
   s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':cause;s.score=cause==='success'?100:0;s.mode='settled';s.slab=null;s.dropElapsed=config.dropDuration;
   event(s,cause==='success'?'win':'collision',cause==='success'?fields:{reason:cause,width});
   s.message=cause==='success'?'目标楼层已完成，叠塔成功。':cause==='miss'?'石板与下层完全错开，本次叠塔结束。':'剩余台面不足 16 单位，本次叠塔结束。';
   s.terminalReceipt=copy({cause,call:s.calls,elapsed:s.elapsed,level:s.level,floors:s.floors,floorsBuilt:s.floorsBuilt,goal:s.goal,drops:s.drops,lastLanding:s.lastLanding,score:s.score,phase:s.phase,reason:s.reason});
  }else{
   event(s,'land',fields);s.mode='moving';s.dropElapsed=0;s.slab=freshSlab(config.layouts[s.level],width,s.floorsBuilt);
   s.message='完成第 '+s.floorsBuilt+' 层，台面宽 '+width.toFixed(1)+'；下一层从'+(s.slab.direction===1?'左':'右')+'侧驶入。';
  }
 }
 function integrate(s,dt){
  let left=dt;
  while(left>0&&s.phase==='playing'){
   if(s.mode==='moving'){ageCuts(s,left);move(s,left);left=0;}
   else{
    const span=Math.min(left,Math.max(0,config.dropDuration-s.dropElapsed));ageCuts(s,span);s.dropElapsed+=span;left-=span;
    if(s.dropElapsed>=config.dropDuration-EPS){s.dropElapsed=config.dropDuration;land(s);}else break;
   }
  }
 }
 function step(s,dt,raw){
  if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
  const input=normalized(raw);if(input.paused)return s;const old=s.lastHeld,armed=s.inputArmed;
  const disarm=(input.cancelEpoch!==null&&s.cancelEpoch!==null&&input.cancelEpoch!==s.cancelEpoch)||(input.cancelled&&!s.cancelledLast);
  s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
  if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;s.cancelledLast=input.cancelled;if(disarm)s.inputArmed=false;
  if(!disarm&&!input.cancelled&&armed&&input.a&&!old.a){
   s.lastCommand='a';if(s.mode==='moving'){s.mode='dropping';s.dropElapsed=0;s.drops++;s.slab.velocity=0;event(s,'drop',{x:s.slab.x,width:s.slab.width,drop:s.drops});s.message='石板正在落下；落地后按实际重合保留台面。';}
  }
  if(!disarm&&!input.cancelled&&!input.a&&!input.b&&input.x===0&&input.y===0)s.inputArmed=true;
  s.lastHeld={a:input.a,b:input.b,x:input.x,y:input.y};integrate(s,dt);return s;
 }
 return Object.freeze({create,step,config});
});
