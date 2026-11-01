(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PureModel=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  // Public authored puzzle facts only: no target arrangement or example route.
  var LAYOUTS=[
    {name:'环芯炉阵',coords:[[0,0],[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],initial:[1,0,1,1,2,2,2],counts:[3,2,1],source:0,mold:1},
    {name:'斜岸合金',coords:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[1,2]],initial:[0,1,0,0,1,2,2],counts:[1,1,2],source:0,mold:6},
    {name:'折列传热',coords:[[0,0],[1,0],[0,1],[1,1],[0,2],[1,2],[0,3]],initial:[0,0,1,1,2,2,1],counts:[2,1,1],source:6,mold:2}
  ];
  var BASE=[{id:'copper',label:'铜',glyph:'Cu',rgb:[209,128,72]},
    {id:'iron',label:'铁',glyph:'Fe',rgb:[112,139,166]},
    {id:'silver',label:'银',glyph:'Ag',rgb:[204,211,220]}];
  var HEX=[{index:0,label:'E',dq:1,dr:0},{index:1,label:'SE',dq:0,dr:1},
    {index:2,label:'SW',dq:-1,dr:1},{index:3,label:'W',dq:-1,dr:0},
    {index:4,label:'NW',dq:0,dr:-1},{index:5,label:'NE',dq:1,dr:-1}];
  var NAV={N:{dx:0,dy:-1},E:{dx:1,dy:0},S:{dx:0,dy:1},W:{dx:-1,dy:0}};
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function finite(value,fallback){return Number.isFinite(value)?value:fallback;}
  function clamp(value,lo,hi){return Math.max(lo,Math.min(hi,value));}
  function cell(s,id){return s.cells.find(function(c){return c.id===id;});}
  function traceHeat(s,byId){
    var seen={},path=[],edges=[],current=s.sourceCellId,status='blocked';
    for(var count=0;count<=s.cells.length;count++){
      if(seen[current]){status='loop';break;}
      seen[current]=true;path.push(current);
      // The mold absorbs before any attempt to follow an outlet.
      if(current===s.moldCellId){status='delivered';break;}
      var c=byId[current];if(!c.outletCellId){status='blocked';break;}
      edges.push({fromId:c.id,toId:c.outletCellId,direction:c.outletDirection});current=c.outletCellId;
    }
    return{status:status,delivered:status==='delivered',pathCellIds:path,edges:edges,stopCellId:current,hops:edges.length};
  }
  function refresh(s){
    var byCoord={},byId={},byTile={},byMaterial={};
    s.materials.forEach(function(m){byMaterial[m.id]=m;});
    s.materialCounts={copper:0,iron:0,silver:0};
    s.tiles.forEach(function(t){byTile[t.id]=t;s.materialCounts[t.material]++;});
    s.cells.forEach(function(c){
      byCoord[c.q+','+c.r]=c;byId[c.id]=c;
      c.role=c.id===s.sourceCellId?'source':c.id===s.moldCellId?'mold':null;
      var tile=byTile[c.tileId];tile.cellId=c.id;c.material=tile.material;
    });
    s.cells.forEach(function(c){
      c.neighborByDirection=HEX.map(function(d){var n=byCoord[(c.q+d.dq)+','+(c.r+d.dr)];return n?n.id:null;});
      c.neighborIds=[];c.neighborByDirection.forEach(function(id){if(id&&c.neighborIds.indexOf(id)<0)c.neighborIds.push(id);});
      c.neighborCounts={copper:0,iron:0,silver:0};
      c.neighborIds.forEach(function(id){c.neighborCounts[byId[id].material]++;});
      var material=byMaterial[c.material];c.requiredCount=material.requiredCount;
      c.actualCount=c.neighborCounts[material.neighborMaterial];c.recipeMet=c.actualCount===c.requiredCount;
      c.outletCellId=null;c.outletDirection=null;
      if(c.role!=='mold'){
        for(var index=0;index<6;index++){
          var id=c.neighborByDirection[index];
          if(id&&byId[id].material===material.heatTarget){c.outletCellId=id;c.outletDirection=index;break;}
        }
      }
    });
    s.heat=traceHeat(s,byId);s.matchedCells=s.cells.filter(function(c){return c.recipeMet;}).length;
    s.allRecipesMet=s.matchedCells===s.cells.length;s.goalReady=s.allRecipesMet&&s.heat.delivered;
    s.focusItems=s.cells.map(function(c){return{id:c.id,kind:'cell',x:c.x,y:c.y};}).concat([copy(s.forge)]);
    var selected=s.focusItems.find(function(item){return item.id===s.selectedId;})||s.focusItems[0];
    s.selectedId=selected.id;s.cursor=copy(selected);s.historyDepth=s.history.length;
    s.score=s.matchedCells*40+(s.heat.delivered?120:0)+(s.phase==='won'?1000+Math.floor(s.remaining)*5:0);
  }
  function action(s,type,details){s.lastAction=Object.assign({type:type,at:s.elapsed,tick:s.tick},details||{});s.events.push(copy(s.lastAction));}
  function finish(s,phase,reason){
    s.phase=phase;s.lostReason=reason||null;refresh(s);
    s.message=phase==='won'?'所有邻接配方成立，热流已抵达铸模':
      reason==='timeout'?'铸造时间已用尽，请重新排列金属块':'错误提交累计三次，请重新检查邻接配方与热路';
    action(s,phase,{reason:s.lostReason});
  }
  function selectionMessage(s){
    if(s.selectedId===s.forge.id)return s.stage==='holding'?'请先放置或取消手中金属块，再空手提交':
      s.goalReady?'配方与热路均已就绪：A 提交铸造':'A 检查并提交；须全部邻接配方成立且热流抵达铸模';
    if(s.stage==='holding')return s.selectedId===s.heldCellId?'A 或 B 取消选片，不改变已摆布局':'A 交换这两块，B 取消选片；交换前库存保持原位';
    return'A 拿起本格金属块，B 撤销最近一次交换';
  }
  function direction(input){
    var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);
    if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;
    return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');
  }
  function navigate(s,name){
    var from=s.cursor,d=NAV[name],best=null;
    s.focusItems.forEach(function(item,index){
      var dx=item.x-from.x,dy=item.y-from.y;if(dx*d.dx+dy*d.dy<=0)return;
      var distance=dx*dx+dy*dy,perpendicular=Math.abs(dx*d.dy-dy*d.dx);
      var candidate={id:item.id,cost:distance+2*perpendicular*perpendicular,distance:distance,perpendicular:perpendicular,index:index};
      if(!best||candidate.cost<best.cost||candidate.cost===best.cost&&
        (candidate.distance<best.distance||candidate.distance===best.distance&&
          (candidate.perpendicular<best.perpendicular||candidate.perpendicular===best.perpendicular&&candidate.index<best.index)))best=candidate;
    });
    if(!best){action(s,'select-blocked',{direction:name});return;}
    s.selectedId=best.id;refresh(s);action(s,'select',{direction:name,id:s.selectedId});s.message=selectionMessage(s);
  }
  function cancelHolding(s,reason){
    var origin=s.heldCellId,tileId=s.heldTileId;
    s.selectedId=origin;s.heldTileId=null;s.heldCellId=null;s.stage='select';s.cancels++;
    refresh(s);action(s,'cancel',{cellId:origin,tileId:tileId,reason:reason});s.message='已取消选片；布局与先前交换保持不变';
  }
  function back(s){
    if(s.stage==='holding'){cancelHolding(s,'button');return;}
    if(!s.history.length){action(s,'undo-empty');s.message='还没有可撤销的交换；A 拿起选中金属块';return;}
    var previous=s.history.pop();s.cells.forEach(function(c,index){c.tileId=previous.beforeTileIds[index];});
    s.undos++;s.selectedId=previous.aCellId;s.lastUndo={swap:copy(previous),at:s.elapsed,tick:s.tick};
    refresh(s);action(s,'undo',copy(s.lastUndo));s.message='已恢复交换前的准确实例；时间与提交错误次数不退回';
  }
  function submit(s){
    s.submissions++;
    var reason=s.goalReady?'accepted':!s.allRecipesMet&&!s.heat.delivered?'recipes-and-heat':!s.allRecipesMet?'recipes':'heat';
    s.lastSubmission={id:s.submissions,accepted:s.goalReady,reason:reason,
      assignment:s.cells.map(function(c){return{cellId:c.id,tileId:c.tileId};}),
      matchedCells:s.matchedCells,allRecipesMet:s.allRecipesMet,heatDelivered:s.heat.delivered,heatStatus:s.heat.status,at:s.elapsed,tick:s.tick};
    if(!s.goalReady)s.mistakes++;
    action(s,'submit',copy(s.lastSubmission));
    if(s.goalReady){finish(s,'won');return;}
    if(s.mistakes>=s.maxMistakes){finish(s,'lost','mistakes');return;}
    var recipeText=s.allRecipesMet?'邻接配方已成立':'邻接配方仅 '+s.matchedCells+'/'+s.cells.length+' 格成立';
    var heatText=s.heat.delivered?'热流已到铸模':s.heat.status==='loop'?'热路陷入循环':'热路在无出口处受阻';
    s.message=recipeText+'，'+heatText+'；错误提交累计 '+s.mistakes+'/3';
  }
  function confirm(s){
    if(s.selectedId===s.forge.id){
      if(s.stage==='holding'){action(s,'forge-blocked',{reason:'holding'});s.message=selectionMessage(s);return;}
      submit(s);return;
    }
    var selected=cell(s,s.selectedId);
    if(s.stage==='select'){
      s.stage='holding';s.heldCellId=selected.id;s.heldTileId=selected.tileId;
      refresh(s);action(s,'pick',{cellId:s.heldCellId,tileId:s.heldTileId});s.message=selectionMessage(s);return;
    }
    if(selected.id===s.heldCellId){cancelHolding(s,'same-cell');return;}
    var origin=cell(s,s.heldCellId),record={aCellId:origin.id,bCellId:selected.id,aTileId:origin.tileId,bTileId:selected.tileId,
      beforeTileIds:s.cells.map(function(c){return c.tileId;}),at:s.elapsed,tick:s.tick};
    origin.tileId=record.bTileId;selected.tileId=record.aTileId;
    s.totalSwaps++;s.history.push(copy(record));s.lastSwap=copy(record);
    s.stage='select';s.heldTileId=null;s.heldCellId=null;
    refresh(s);action(s,'swap',copy(record));
    s.message=s.goalReady?'配方与热路均已成立；请前往 FORGE 按 A 提交':'已交换准确金属实例；邻接计数与导热出口已同步更新';
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    refresh(s);
    if(!dir){s._heldDirection=null;s._nextMoveTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;back(s);return;}
    if(dir){
      if(dir!==s._heldDirection){s._heldDirection=dir;s._nextMoveTick=s.tick+20;navigate(s,dir);}
      else if(s.tick>=s._nextMoveTick){s._nextMoveTick=s.tick+10;navigate(s,dir);}
    }
    if(s._pendingA){s._pendingA=false;confirm(s);}
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LAYOUTS[d],radius=48;
    var raw=layout.coords.map(function(p){return{x:Math.sqrt(3)*radius*(p[0]+p[1]/2),y:1.5*radius*p[1]};});
    var xs=raw.map(function(p){return p.x;}),ys=raw.map(function(p){return p.y;});
    var board={centerX:320,centerY:250,hexRadius:radius,
      originX:320-(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2,
      originY:250-(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2};
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:layout.name,board:board,directions:copy(HEX),
      materials:BASE.map(function(m,index){return Object.assign(copy(m),{neighborMaterial:BASE[(index+1)%3].id,requiredCount:layout.counts[index],heatTarget:BASE[(index+1)%3].id});}),
      cells:layout.coords.map(function(p,index){return{id:'C'+(index+1),q:p[0],r:p[1],x:Math.round(raw[index].x+board.originX),y:Math.round(raw[index].y+board.originY),
        role:null,tileId:'T'+(index+1),material:null,neighborIds:[],neighborByDirection:[],neighborCounts:{copper:0,iron:0,silver:0},
        requiredCount:0,actualCount:0,recipeMet:false,outletCellId:null,outletDirection:null};}),
      tiles:layout.initial.map(function(material,index){return{id:'T'+(index+1),material:BASE[material].id,cellId:'C'+(index+1)};}),
      sourceCellId:'C'+(layout.source+1),moldCellId:'C'+(layout.mold+1),materialCounts:{copper:0,iron:0,silver:0},
      heat:null,matchedCells:0,allRecipesMet:false,goalReady:false,
      forge:{id:'forge',kind:'submit',x:790,y:414},focusItems:[],selectedId:'C1',cursor:null,stage:'select',heldTileId:null,heldCellId:null,
      history:[],historyDepth:0,totalSwaps:0,undos:0,cancels:0,lastSwap:null,lastUndo:null,lastAction:null,events:[],
      submissions:0,mistakes:0,maxMistakes:3,lastSubmission:null,
      phase:'playing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:null,
      message:'配方看相邻金属数量，热流按 1–6 出口优先；空手到 FORGE 提交',
      _accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextMoveTick:0,_cancelEpoch:null};
    refresh(s);return s;
  }
  function step(s,dt,input){
    if(!s||s.phase!=='playing')return s;
    input=input||{};dt=clamp(finite(dt,0),0,.25);var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)){
      if(s._cancelEpoch!==null&&s._cancelEpoch!==input.cancelEpoch)cancelled=true;s._cancelEpoch=input.cancelEpoch;
    }
    var a=!!input.a,b=!!input.b;
    if(cancelled){s._pendingA=false;s._pendingB=false;s._heldDirection=null;s._nextMoveTick=0;}
    else{if((a&&!s._lastA)||input.aPressed)s._pendingA=true;if((b&&!s._lastB)||input.bPressed)s._pendingB=true;}
    s._lastA=a;s._lastB=b;s.events=[];s._accumulator+=dt;var dir=cancelled?null:direction(input);
    while(s._accumulator+EPS>=DT&&s.phase==='playing'){
      s._accumulator=Math.max(0,s._accumulator-DT);tick(s,dir);
    }
    if(s.events.length>32)s.events=s.events.slice(-32);return s;
  }
  return{create:create,step:step,TICK_HZ:HZ};
}));
