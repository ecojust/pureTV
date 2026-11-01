(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PureModel=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  var LAYOUTS=[{"name":"三盘初衡","moveBudget":3,"weights":[{"id":1,"mass":1,"trayId":"bank"},{"id":2,"mass":2,"trayId":"A"},{"id":3,"mass":2,"trayId":"B"},{"id":4,"mass":3,"trayId":"B"},{"id":5,"mass":3,"trayId":"B"},{"id":6,"mass":4,"trayId":"C"}],"scales":[{"id":"scale-1","label":"衡式 1","left":{"terms":[{"trayId":"A","coefficient":1},{"trayId":"B","coefficient":1}],"constant":0},"right":{"terms":[],"constant":10}},{"id":"scale-2","label":"衡式 2","left":{"terms":[{"trayId":"B","coefficient":1},{"trayId":"C","coefficient":1}],"constant":0},"right":{"terms":[],"constant":12}},{"id":"scale-3","label":"衡式 3","left":{"terms":[{"trayId":"A","coefficient":1},{"trayId":"C","coefficient":1}],"constant":0},"right":{"terms":[],"constant":8}}]},{"name":"对侧配重","moveBudget":4,"weights":[{"id":1,"mass":1,"trayId":"A"},{"id":2,"mass":1,"trayId":"bank"},{"id":3,"mass":2,"trayId":"A"},{"id":4,"mass":3,"trayId":"B"},{"id":5,"mass":4,"trayId":"C"},{"id":6,"mass":5,"trayId":"bank"}],"scales":[{"id":"scale-1","label":"衡式 1","left":{"terms":[{"trayId":"A","coefficient":1},{"trayId":"B","coefficient":1}],"constant":0},"right":{"terms":[{"trayId":"C","coefficient":1}],"constant":2}},{"id":"scale-2","label":"衡式 2","left":{"terms":[{"trayId":"B","coefficient":1},{"trayId":"C","coefficient":1}],"constant":0},"right":{"terms":[{"trayId":"A","coefficient":1}],"constant":6}},{"id":"scale-3","label":"衡式 3","left":{"terms":[{"trayId":"A","coefficient":1},{"trayId":"C","coefficient":1}],"constant":0},"right":{"terms":[],"constant":12}}]},{"name":"杠杆合账","moveBudget":5,"weights":[{"id":1,"mass":1,"trayId":"C"},{"id":2,"mass":2,"trayId":"bank"},{"id":3,"mass":2,"trayId":"bank"},{"id":4,"mass":3,"trayId":"A"},{"id":5,"mass":4,"trayId":"B"},{"id":6,"mass":4,"trayId":"bank"}],"scales":[{"id":"scale-1","label":"衡式 1","left":{"terms":[{"trayId":"A","coefficient":2},{"trayId":"B","coefficient":1}],"constant":0},"right":{"terms":[{"trayId":"C","coefficient":1}],"constant":6}},{"id":"scale-2","label":"衡式 2","left":{"terms":[{"trayId":"A","coefficient":1},{"trayId":"C","coefficient":2}],"constant":0},"right":{"terms":[{"trayId":"B","coefficient":1}],"constant":13}},{"id":"scale-3","label":"衡式 3","left":{"terms":[{"trayId":"A","coefficient":1},{"trayId":"B","coefficient":1},{"trayId":"C","coefficient":1}],"constant":0},"right":{"terms":[],"constant":16}}]}];
  var TRAYS=[{id:'A',label:'A盘',x:160,y:170},{id:'B',label:'B盘',x:410,y:170},
    {id:'C',label:'C盘',x:160,y:365},{id:'bank',label:'库存',x:410,y:365}];
  var DIRECTIONS={N:{x:0,y:-1},E:{x:1,y:0},S:{x:0,y:1},W:{x:-1,y:0}};
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function finite(value,fallback){return Number.isFinite(value)?value:fallback;}
  function clamp(value,lo,hi){return Math.max(lo,Math.min(hi,value));}
  function weight(s,id){return s.weights.find(function(w){return w.id===id;});}
  function tray(s,id){return s.trays.find(function(t){return t.id===id;});}
  function sideValue(s,side){return side.constant+side.terms.reduce(function(total,term){return total+term.coefficient*tray(s,term.trayId).totalMass;},0);}
  function refresh(s){
    s.trays.forEach(function(t){
      var assigned=s.weights.filter(function(w){return w.trayId===t.id;}).sort(function(a,b){return a.id-b.id;});
      t.weightIds=assigned.map(function(w){return w.id;});
      t.totalMass=assigned.reduce(function(total,w){return total+w.mass;},0);
      assigned.forEach(function(w,k){w.slot=k;w.x=t.x+(k%3-1)*54;w.y=t.y+(Math.floor(k/3)-.5)*48+10;});
    });
    s.totalMass=s.weights.reduce(function(total,w){return total+w.mass;},0);
    s.inventoryIds=tray(s,'bank').weightIds.slice();s.inventoryCount=s.inventoryIds.length;
    s.deployedCount=s.weights.length-s.inventoryCount;s.allDeployed=s.inventoryCount===0;
    s.scales.forEach(function(scale){scale.leftTotal=sideValue(s,scale.left);scale.rightTotal=sideValue(s,scale.right);
      scale.delta=scale.leftTotal-scale.rightTotal;scale.balanced=scale.delta===0;});
    s.balancedCount=s.scales.filter(function(scale){return scale.balanced;}).length;
    s.allBalanced=s.balancedCount===s.scales.length;s.movesRemaining=s.moveBudget-s.movesUsed;
    s.historyDepth=s._history.length;
    s.mode=s.heldWeightId===null?'selecting':'placing';
    s.canUndo=s.phase==='playing'&&s.heldWeightId===null&&s.historyDepth>0;
    if(s.mode==='selecting'){
      s.selectedTrayId=null;s.selectedId=s.selectedWeightId;
      s.selectionItems=s.weights.slice().sort(function(a,b){return a.id-b.id;}).map(function(w){return{kind:'weight',id:w.id,x:w.x,y:w.y};});
    }else{
      s.selectedId=s.selectedTrayId;
      s.selectionItems=s.trays.map(function(t){return{kind:'tray',id:t.id,x:t.x,y:t.y};});
    }
    s.score=s.balancedCount*200+s.deployedCount*25+(s.phase==='won'?1000+s.movesRemaining*50+Math.floor(s.remaining)*5:0);
  }
  function action(s,type,details){
    s.lastAction=Object.assign({type:type,tick:s.tick,at:s.elapsed},details||{});s.events.push(copy(s.lastAction));
  }
  function finish(s,phase,reason){
    s.phase=phase;s.lostReason=reason||null;refresh(s);
    s.message=phase==='won'?'全部砝码已入盘，三条衡式同时平衡':reason==='timeout'?'时间已用尽，请重新核对共享盘的衡式':'搬动预算已用尽且未全部平衡，请重试';
    action(s,phase,{reason:s.lostReason});
  }
  function direction(input){
    var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);
    if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;
    return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');
  }
  function navigate(s,name){
    var current=s.selectionItems.find(function(item){return item.id===s.selectedId;});
    var d=DIRECTIONS[name],best=null,bestCost=Infinity;
    s.selectionItems.forEach(function(item){
      var dx=item.x-current.x,dy=item.y-current.y,forward=dx*d.x+dy*d.y;
      if(forward<=0)return;
      var cost=3*Math.abs(dx*d.y-dy*d.x)+forward;
      if(cost<bestCost){best=item;bestCost=cost;}
    });
    if(!best){action(s,'select-blocked',{direction:name});return;}
    if(s.mode==='selecting')s.selectedWeightId=best.id;else s.selectedTrayId=best.id;
    refresh(s);action(s,'select',{kind:best.kind,id:best.id,direction:name});
    s.message=s.mode==='selecting'?'已选砝码 #'+best.id+'（'+weight(s,best.id).mass+'g），按 A 拿取':'目的地 '+tray(s,best.id).label+'：按 A 放置，按 B 取消';
  }
  function cancel(s,returned){
    var id=s.heldWeightId;s.selectedWeightId=id;s.heldWeightId=null;s.selectedTrayId=null;s.cancels++;
    refresh(s);action(s,returned?'return':'cancel',{weightId:id});
    s.message=returned?'已放回原盘，没有消耗搬动步数':'已取消待搬选择；未撤销已完成的搬动';
  }
  function changedScales(s,before){return s.scales.filter(function(scale,i){return scale.delta!==before[i];}).map(function(scale){return scale.id;});}
  function transfer(s,kind,id,from,to,before){
    s.lastTransfer={kind:kind,weightId:id,fromTrayId:from,toTrayId:to,changedScaleIds:changedScales(s,before),at:s.elapsed,expiresAt:s.elapsed+.6};
    action(s,kind,copy(s.lastTransfer));
  }
  function confirm(s){
    if(s.heldWeightId===null){
      s.heldWeightId=s.selectedWeightId;s.selectedTrayId=weight(s,s.heldWeightId).trayId;s.pickups++;
      refresh(s);action(s,'pick',{weightId:s.heldWeightId,trayId:s.selectedTrayId});
      s.message='待搬砝码 #'+s.heldWeightId+' 仍在原盘；请选择目的地';return;
    }
    var held=weight(s,s.heldWeightId),destination=tray(s,s.selectedTrayId);
    if(destination&&destination.id===held.trayId){cancel(s,true);return;}
    if(!destination||destination.weightIds.length>=destination.capacity){
      s.invalidPlacements++;action(s,'place-blocked',{reason:destination?'capacity':'destination',weightId:held.id});
      s.message='目的地无法容纳此砝码，原盘与步数保持不变';return;
    }
    var from=held.trayId,to=destination.id,id=held.id,before=s.scales.map(function(scale){return scale.delta;});
    s._history.push({weights:s.weights.map(function(w){return{id:w.id,mass:w.mass,trayId:w.trayId};}),
      movesUsed:s.movesUsed,selectedWeightId:id,weightId:id,fromTrayId:from,toTrayId:to});
    held.trayId=to;s.movesUsed++;s.totalMoves++;s.selectedWeightId=id;s.heldWeightId=null;s.selectedTrayId=null;
    refresh(s);transfer(s,'place',id,from,to,before);
    if(s.allDeployed&&s.allBalanced)finish(s,'won');
    else if(s.movesRemaining<=0)finish(s,'lost','moves');
    else s.message='已搬动 #'+id+'，'+s.lastTransfer.changedScaleIds.length+' 条衡式已更新；还可搬动 '+s.movesRemaining+' 次';
  }
  function back(s){
    if(s.heldWeightId!==null){cancel(s,false);return;}
    if(!s._history.length){action(s,'undo-blocked',{reason:'empty-history'});s.message='暂无可撤销的搬动';return;}
    var snapshot=s._history.pop(),before=s.scales.map(function(scale){return scale.delta;});
    s.weights=copy(snapshot.weights);s.movesUsed=snapshot.movesUsed;s.selectedWeightId=snapshot.selectedWeightId;
    s.heldWeightId=null;s.selectedTrayId=null;s.undos++;
    refresh(s);transfer(s,'undo',snapshot.weightId,snapshot.toTrayId,snapshot.fromTrayId,before);
    s.message='已撤销上一搬动，步数已返还；时间继续';
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    if(s.lastTransfer&&s.elapsed>=s.lastTransfer.expiresAt)s.lastTransfer=null;
    if(!dir){s._heldDirection=null;s._nextSelectTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;back(s);return;}
    if(dir){
      if(dir!==s._heldDirection){s._heldDirection=dir;s._nextSelectTick=s.tick+20;navigate(s,dir);}
      else if(s.tick>=s._nextSelectTick){s._nextSelectTick=s.tick+10;navigate(s,dir);}
    }
    if(s._pendingA){s._pendingA=false;confirm(s);}
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LAYOUTS[d];
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:layout.name,
      phase:'playing',mode:'selecting',weights:copy(layout.weights),
      trays:TRAYS.map(function(t){return Object.assign({},t,{width:220,height:145,capacity:6,isBank:t.id==='bank',weightIds:[],totalMass:0});}),
      scales:copy(layout.scales),inventoryIds:[],inventoryCount:0,deployedCount:0,totalMass:0,allDeployed:false,
      balancedCount:0,allBalanced:false,selectedWeightId:layout.weights[0].id,heldWeightId:null,selectedTrayId:null,
      selectionItems:[],selectedId:layout.weights[0].id,moveBudget:layout.moveBudget,movesUsed:0,movesRemaining:layout.moveBudget,
      historyDepth:0,canUndo:false,totalMoves:0,pickups:0,cancels:0,undos:0,invalidPlacements:0,
      lastTransfer:null,lastAction:null,events:[],tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:null,
      message:'先选砝码，按 A 拿取；共享盘会同时影响多条衡式',
      _history:[],_accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextSelectTick:0,_cancelEpoch:null};
    refresh(s);return s;
  }
  function step(s,dt,input){
    if(!s||s.phase!=='playing')return s;
    input=input||{};dt=clamp(finite(dt,0),0,.25);
    var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)){
      if(s._cancelEpoch!==null&&s._cancelEpoch!==input.cancelEpoch)cancelled=true;
      s._cancelEpoch=input.cancelEpoch;
    }
    var a=!!input.a,b=!!input.b;
    if(cancelled){s._pendingA=false;s._pendingB=false;s._heldDirection=null;s._nextSelectTick=0;}
    else{if((a&&!s._lastA)||input.aPressed)s._pendingA=true;if((b&&!s._lastB)||input.bPressed)s._pendingB=true;}
    s._lastA=a;s._lastB=b;s.events=[];s._accumulator+=dt;
    var dir=cancelled?null:direction(input);
    while(s._accumulator+EPS>=DT&&s.phase==='playing'){
      s._accumulator=Math.max(0,s._accumulator-DT);tick(s,dir);
    }
    if(s.events.length>32)s.events=s.events.slice(-32);
    return s;
  }
  return{create:create,step:step,TICK_HZ:HZ};
}));
