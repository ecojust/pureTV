/* Torch Bridge: public traveler times, logical crossing budget and active-time transit. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const EPS=1e-10,copy=v=>JSON.parse(JSON.stringify(v));
 function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
 const config=freeze({defaultSeed:774,crossingDuration:.4,capacity:2,maxElapsed:86400,maxCounter:2147483647,layouts:[
  {id:'first-lantern',name:'FIRST LANTERN',nameZh:'初灯渡口',times:[1,2,5,10],deadline:19},
  {id:'misty-span',name:'MISTY SPAN',nameZh:'雾桥同行',times:[1,3,6,8,12],deadline:31},
  {id:'midnight-relay',name:'MIDNIGHT RELAY',nameZh:'午夜接力',times:[1,2,4,7,11,16],deadline:37}]});
 function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];
  return{schema:1,seed,level,phase:'playing',reason:'',score:0,positions:l.times.map(()=>0),torch:0,cursor:0,selected:[],spent:0,deadline:l.deadline,trips:0,mode:'selecting',crossing:null,lastCrossing:null,receipts:[],
   elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,x:0,y:0,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
   message:'方向选择旅人，A 选择同岸的一或两人，B 携灯过桥；思考不扣分钟。'};
 }
 function normalized(raw){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!raw||typeof raw!=='object'||Array.isArray(raw))return neutral();const v=Object.create(null);for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(raw,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
   const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return{x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
  }catch(_){return neutral();}}
 function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
 function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
 function toggle(s){const id=s.cursor,index=s.selected.indexOf(id);if(index>=0)s.selected.splice(index,1);else{
   if(s.positions[id]!==s.torch)return blocked(s,'wrong-bank','旅人不在火把这一岸，暂时不能加入队伍。');
   if(s.selected.length>=config.capacity)return blocked(s,'capacity','桥上最多两人；先取消一位再选择。');s.selected.push(id);s.selected.sort((a,b)=>a-b);}
  event(s,'select',{traveler:id,selected:s.selected.slice()});s.message=s.selected.length?'已选择 '+s.selected.map(i=>i+1).join('、')+' 号旅人；B 携灯过桥。':'队伍已清空；选择火把这一岸的旅人。';
 }
 function depart(s){if(!s.selected.length)return blocked(s,'empty','请先用 A 选择火把这一岸的一或两位旅人。');const l=config.layouts[s.level],travelers=s.selected.slice();
  s.crossing={travelers,from:s.torch,to:1-s.torch,cost:Math.max(...travelers.map(id=>l.times[id])),elapsed:0,duration:config.crossingDuration};s.mode='crossing';
  event(s,'depart',{travelers:travelers.slice(),from:s.crossing.from,to:s.crossing.to,cost:s.crossing.cost});s.message='正在过桥；按较慢者计 '+s.crossing.cost+' 分钟，落岸后结算。';
 }
 function arrive(s){const c=s.crossing;c.travelers.forEach(id=>{s.positions[id]=c.to;});s.torch=c.to;s.spent+=c.cost;s.trips++;s.lastCrossing={trip:s.trips,travelers:c.travelers.slice(),from:c.from,to:c.to,cost:c.cost,spent:s.spent};s.receipts.push(copy(s.lastCrossing));
  s.selected=[];s.crossing=null;s.inputArmed=false;const success=s.positions.every(v=>v===1)&&s.spent<=s.deadline,cause=success?'success':s.spent>=s.deadline?'deadline':null;
  if(cause){s.phase=success?'won':'lost';s.reason=success?'':'deadline';s.score=success?100:0;s.mode='settled';event(s,success?'win':'collision',Object.assign(copy(s.lastCrossing),success?{}:{reason:'deadline'}));
   s.message=success?'所有旅人已到右岸，逻辑耗时 '+s.spent+' 分钟，未超预算。':'逻辑时间预算已用尽；尚未在预算内完成全员过桥。';s.terminalReceipt=copy({cause,call:s.calls,elapsed:s.elapsed,level:s.level,positions:s.positions,torch:s.torch,spent:s.spent,deadline:s.deadline,trips:s.trips,score:s.score,phase:s.phase,reason:s.reason});
  }else{s.mode='selecting';event(s,'arrive',copy(s.lastCrossing));s.message='火把已到'+(s.torch?'右':'左')+'岸，本次 '+c.cost+' 分钟；松开按键后选择下一队。';}
 }
 function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const input=normalized(raw);if(input.paused)return s;
  const direction=Math.max(Math.abs(input.x),Math.abs(input.y))<=.5?'none':Math.abs(input.y)>=Math.abs(input.x)?input.y>0?'down':'up':input.x>0?'right':'left',old=s.lastHeld,armed=s.inputArmed;
  const disarm=(input.cancelEpoch!==null&&s.cancelEpoch!==null&&input.cancelEpoch!==s.cancelEpoch)||(input.cancelled&&!s.cancelledLast);let landed=false;
  s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);
  if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;s.cancelledLast=input.cancelled;if(disarm)s.inputArmed=false;
  if(!disarm&&!input.cancelled&&armed&&s.mode==='selecting'){const command=input.b&&!old.b?'b':input.a&&!old.a?'a':direction!=='none'&&direction!==old.direction?direction:'none';s.lastCommand=command;
   if(command==='b')depart(s);else if(command==='a')toggle(s);else if(command!=='none'){const from=s.cursor,to=Math.max(0,Math.min(s.positions.length-1,from+(command==='left'||command==='up'?-1:1)));
    if(from===to)blocked(s,'boundary','已到旅人名单边界；操作不扣分钟。');else{s.cursor=to;event(s,'cursor',{from,to});s.message='已指向 '+(to+1)+' 号旅人，速度 '+config.layouts[s.level].times[to]+' 分钟。';}}}
  if(s.mode==='crossing'){s.crossing.elapsed=Math.min(config.crossingDuration,s.crossing.elapsed+dt);if(s.crossing.elapsed>=config.crossingDuration-EPS){s.crossing.elapsed=config.crossingDuration;arrive(s);landed=true;}}
  if(!landed&&!disarm&&!input.cancelled&&s.mode==='selecting'&&!input.a&&!input.b&&Math.abs(input.x)<=.5&&Math.abs(input.y)<=.5)s.inputArmed=true;
  s.lastHeld={a:input.a,b:input.b,x:input.x,y:input.y,direction};return s;
 }
 return Object.freeze({create,step,config});
});
