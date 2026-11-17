(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PureModel=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  // These fixed maps are source data, never properties of a public state.
  var LAYOUTS=[
    {name:'折廊初测',rowOpenCounts:[2,2,2,2],entryId:0,exitId:15,requiredDistance:6,probeBudget:3,wallMask:15004},
    {name:'绕行证据',rowOpenCounts:[3,2,2,3],entryId:0,exitId:12,requiredDistance:5,probeBudget:4,wallMask:35988},
    {name:'交错暗廊',rowOpenCounts:[2,3,3,2],entryId:1,exitId:14,requiredDistance:4,probeBudget:5,wallMask:43036}
  ];
  var truthForState=new WeakMap();
  var DIRECTIONS={N:{dx:0,dy:-1},E:{dx:1,dy:0},S:{dx:0,dy:1},W:{dx:-1,dy:0}};
  function finite(value,fallback){return Number.isFinite(value)?value:fallback;}
  function clamp(value,lo,hi){return Math.max(lo,Math.min(hi,value));}
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function validId(id){return Number.isInteger(id)&&id>=0&&id<16;}
  function location(cell){return{id:cell.id,col:cell.col,row:cell.row,x:cell.x,y:cell.y};}
  function pathCell(cell){return{cellId:cell.id,col:cell.col,row:cell.row,x:cell.x,y:cell.y};}
  function refresh(s){
    var path=Array.isArray(s.path)?s.path:[];
    s.visited=Array(16).fill(false);
    path.forEach(function(p){if(p&&validId(p.cellId))s.visited[p.cellId]=true;});
    s.pathEdges=Math.max(0,path.length-1);
    var end=path.length&&path[path.length-1],endId=end&&end.cellId;
    s.atExit=endId===s.exit.id;s.lengthMatches=s.pathEdges===s.requiredDistance;
    s.selectedId=s.mode==='probe'?s.probeCursorId:(validId(endId)?endId:s.entry.id);
    s.cursor=location(s.cells[s.selectedId]);
    s.probesRemaining=Math.max(0,s.probeBudget-s.probesUsed);
    s.revealedCount=s.cells.filter(function(c){return c.knowledge!=='unknown';}).length;
    s.score=s.probesUsed*40+Math.min(s.pathEdges,s.requiredDistance)*10+
      (s.phase==='won'?1000+s.probesRemaining*100+Math.floor(s.remaining)*5:0);
  }
  function action(s,type,details){
    s.lastAction=Object.assign({type:type,tick:s.tick,at:s.elapsed},details||{});
    s.events.push(copy(s.lastAction));
  }
  function finish(s,phase,reason){
    s.phase=phase;s.lostReason=reason||null;refresh(s);
    s.message=phase==='won'?'通路安全且边数正确；未探明格仍保持未知':
      reason==='timeout'?'测绘时间已用尽，请重新推理':'探针耗尽后已三次提交错误，请重新测绘';
    action(s,phase,{reason:s.lostReason});
  }
  function direction(input){
    var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);
    if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;
    return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');
  }
  function move(s,name){
    var cell=s.cells[s.selectedId],d=DIRECTIONS[name],col=cell.col+d.dx,row=cell.row+d.dy;
    var reason=null,id=row*4+col;
    if(s.mode==='route'&&s.atExit)reason='exit';
    else if(col<0||col>=4||row<0||row>=4)reason='edge';
    else if(s.mode==='route'&&s.cells[id].knowledge==='wall')reason='known-wall';
    else if(s.mode==='route'&&s.visited[id])reason='visited';
    if(reason){
      action(s,'move-blocked',{direction:name,reason:reason});
      s.message=reason==='exit'?'已到出口：A 提交，B 退回一步':
        reason==='known-wall'?'这是已探明墙格，不能画入路线':
        reason==='visited'?'简单路线不能重入；B 可退回一步':'已到地图边缘';
      return;
    }
    if(s.mode==='probe')s.probeCursorId=id;
    else{s.path.push(pathCell(s.cells[id]));s.routeMoves++;}
    refresh(s);action(s,s.mode==='probe'?'select':'append',{cellId:id,direction:name});
    s.message=s.mode==='probe'?'A 探测本格，B 从入口画路线':
      s.atExit?'已到出口：A 提交检查，B 退回一步':'按方向延伸；未知格可画入，但尚未证明安全';
  }
  function back(s){
    if(s.mode==='probe'){
      s.mode='route';s.path=[pathCell(s.cells[s.entry.id])];s.modeSwitches++;
      refresh(s);action(s,'mode',{mode:s.mode});
      s.message='从入口逐格画简单路线；A 提交，B 退回';
    }else if(s.path.length>1){
      var removed=s.path.pop();s.backtracks++;refresh(s);
      action(s,'backtrack',{cellId:removed.cellId});s.message='已退回一步；探测结果、时间和错误次数保留';
    }else{
      s.mode='probe';s.modeSwitches++;refresh(s);action(s,'mode',{mode:s.mode});
      s.message='返回探测：A 探本格，B 再从入口画路线';
    }
  }
  function probe(s){
    var cell=s.cells[s.selectedId],result=null,charged=false,reason;
    s.probeAttempts++;
    if(cell.knowledge!=='unknown'){
      result=cell.knowledge;reason='known';s.repeatedProbes++;
      s.message='本格已知，重复查看不消耗探针';
    }else if(s.probesRemaining>0){
      result=(truthForState.get(s)&(1<<cell.id))?'wall':'open';
      charged=true;reason='revealed';cell.knowledge=result;cell.probed=true;s.probesUsed++;
      s.probeLog.push({cellId:cell.id,result:result,at:s.elapsed,tick:s.tick});
      s.message=result==='wall'?'探到墙格；结合行数与距离继续推理':'探到通路格；结合行数与距离继续推理';
    }else{
      reason='exhausted';s.blockedProbes++;
      s.message='探针已耗尽；可继续画线，耗尽后错误累计三次结束';
    }
    s.lastProbe={cellId:cell.id,result:result,charged:charged,reason:reason,at:s.elapsed,expiresAt:s.elapsed+.6};
    refresh(s);action(s,'probe',copy(s.lastProbe));
  }
  function submit(s){
    var path=Array.isArray(s.path)?s.path:[],mask=0,reason=null,previous=null;
    s.submissions++;
    if(!path.length)reason='shape';
    for(var i=0;i<path.length&&!reason;i++){
      var id=path[i]&&path[i].cellId;
      if(!validId(id)||(mask&(1<<id))||(i===0&&id!==s.entry.id))reason='shape';
      else if(previous!==null&&Math.abs(id%4-previous%4)+Math.abs(Math.floor(id/4)-Math.floor(previous/4))!==1)reason='shape';
      else{mask|=1<<id;previous=id;}
    }
    if(!reason&&previous!==s.exit.id)reason='endpoint';
    if(!reason&&path.length-1!==s.requiredDistance)reason='length';
    // Only a complete public-valid submission is allowed to consult true walls.
    if(!reason&&(mask&truthForState.get(s)))reason='unsafe';
    var accepted=!reason,chargedStrike=false;
    if(!accepted){s.totalWrong++;chargedStrike=s.probesRemaining===0;if(chargedStrike)s.exhaustedStrikes++;}
    s.lastSubmission={id:s.submissions,accepted:accepted,reason:reason||'accepted',
      routeIds:path.map(function(p){return p&&Number.isInteger(p.cellId)?p.cellId:null;}),
      pathEdges:Math.max(0,path.length-1),requiredDistance:s.requiredDistance,
      probesRemaining:s.probesRemaining,chargedStrike:chargedStrike,exhaustedStrikes:s.exhaustedStrikes,at:s.elapsed};
    action(s,'submit',copy(s.lastSubmission));
    if(accepted){finish(s,'won');return;}
    if(s.exhaustedStrikes>=s.maxExhaustedStrikes){finish(s,'lost','strikes');return;}
    var detail=reason==='shape'?'路线必须从入口开始、相邻且不重入':
      reason==='endpoint'?'路线尚未到出口':reason==='length'?'路线边数与公开距离不符':'完整路线不安全；请结合公开线索修正';
    s.message=detail+(chargedStrike?'；耗尽后错误 '+s.exhaustedStrikes+'/3':'；尚有探针，本次不计耗尽后错误');
    refresh(s);
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    if(s.lastProbe&&s.elapsed>=s.lastProbe.expiresAt-EPS)s.lastProbe=null;
    refresh(s);
    if(!dir){s._heldDirection=null;s._nextMoveTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;back(s);return;}
    if(dir){
      if(dir!==s._heldDirection){s._heldDirection=dir;s._nextMoveTick=s.tick+20;move(s,dir);}
      else if(s.tick>=s._nextMoveTick){s._nextMoveTick=s.tick+10;move(s,dir);}
    }
    if(s._pendingA){s._pendingA=false;if(s.mode==='probe')probe(s);else submit(s);}
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LAYOUTS[d];
    var grid={cols:4,rows:4,x:110,y:106,cellSize:84};
    var cells=Array.from({length:16},function(_,id){var col=id%4,row=Math.floor(id/4);
      var role=id===layout.entryId?'entry':id===layout.exitId?'exit':null;
      return{id:id,col:col,row:row,x:grid.x+(col+.5)*grid.cellSize,y:grid.y+(row+.5)*grid.cellSize,
        role:role,knowledge:role?'open':'unknown',probed:false};});
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:layout.name,grid:grid,rowClueX:480,
      cells:cells,entry:location(cells[layout.entryId]),exit:location(cells[layout.exitId]),rowOpenCounts:layout.rowOpenCounts.slice(),
      requiredDistance:layout.requiredDistance,mode:'probe',probeCursorId:layout.entryId,selectedId:layout.entryId,cursor:null,
      path:[pathCell(cells[layout.entryId])],visited:[],pathEdges:0,lengthMatches:false,atExit:false,
      probeBudget:layout.probeBudget,probesUsed:0,probesRemaining:layout.probeBudget,revealedCount:2,
      probeLog:[],probeAttempts:0,repeatedProbes:0,blockedProbes:0,lastProbe:null,
      submissions:0,totalWrong:0,exhaustedStrikes:0,maxExhaustedStrikes:3,lastSubmission:null,
      routeMoves:0,backtracks:0,modeSwitches:0,lastAction:null,events:[],
      phase:'playing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:null,
      message:'行数表示通路格总数，距离按边计；A 探本格，B 画路线',
      _accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextMoveTick:0,_cancelEpoch:null};
    truthForState.set(s,layout.wallMask);refresh(s);return s;
  }
  function step(s,dt,input){
    if(!s||!truthForState.has(s))throw new TypeError('Model state must be an original create() result');
    if(s.phase!=='playing')return s;
    input=input||{};dt=clamp(finite(dt,0),0,.25);
    var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)){
      if(s._cancelEpoch!==null&&s._cancelEpoch!==input.cancelEpoch)cancelled=true;
      s._cancelEpoch=input.cancelEpoch;
    }
    var a=!!input.a,b=!!input.b;
    if(cancelled){s._pendingA=false;s._pendingB=false;s._heldDirection=null;s._nextMoveTick=0;}
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
