(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PureModel=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  // Public puzzle facts only; no reference loop or solution search.
  var LAYOUTS=[
    {name:'初枝回环',trees:[7,9],flowers:[0],clues:[1,3,2,1,2,3,null,1,1]},
    {name:'绕花水路',trees:[0,7,10],flowers:[15],clues:[3,2,2,2,2,3,null,1,1]},
    {name:'四树环灌',trees:[4,6,13,15],flowers:[1],clues:[1,1,null,3,2,2,2,2,3]}
  ];
  var NAV={N:{dx:0,dy:-1},E:{dx:1,dy:0},S:{dx:0,dy:1},W:{dx:-1,dy:0}};
  var REASONS={empty:'还没有铺设管线',branch:'管线出现分叉',leak:'管线仍有漏口',
    'multiple-loops':'存在多个互不相连的闭环',trees:'仍有必经果树未接入',flower:'管线触及禁水花坛',clues:'数字区域的管段数不符'};
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function finite(value,fallback){return Number.isFinite(value)?value:fallback;}
  function clamp(value,lo,hi){return Math.max(lo,Math.min(hi,value));}
  function refresh(s){
    var byVertex={},byEdge={},byPipe={},adj={};
    s.vertices.forEach(function(v){byVertex[v.id]=v;adj[v.id]=[];v.degree=0;v.incidentEdgeIds=[];v.componentId=null;v.onPipe=false;});
    s.pipes.forEach(function(p){byPipe[p.id]=p;p.edgeId=null;});
    s.edges.forEach(function(e){
      byEdge[e.id]=e;e.selected=e.pipeId!==null;
      if(!e.selected)return;
      byPipe[e.pipeId].edgeId=e.id;
      byVertex[e.aId].incidentEdgeIds.push(e.id);byVertex[e.bId].incidentEdgeIds.push(e.id);
      adj[e.aId].push(e.bId);adj[e.bId].push(e.aId);
    });
    s.vertices.forEach(function(v){v.degree=v.incidentEdgeIds.length;v.onPipe=v.degree>0;});
    var seen={};s.components=[];
    s.vertices.forEach(function(v){
      if(!v.onPipe||seen[v.id])return;
      var members={},queue=[v.id];seen[v.id]=true;members[v.id]=true;
      for(var head=0;head<queue.length;head++)adj[queue[head]].forEach(function(next){
        if(!seen[next]){seen[next]=true;members[next]=true;queue.push(next);}
      });
      var vertexIds=s.vertices.filter(function(n){return!!members[n.id];}).map(function(n){n.componentId=v.id;return n.id;});
      var edgeIds=s.edges.filter(function(e){return e.selected&&members[e.aId];}).map(function(e){return e.id;});
      s.components.push({id:v.id,vertexIds:vertexIds,edgeIds:edgeIds});
    });
    s.pipeStock=s.pipes.length;s.pipeCount=s.edges.filter(function(e){return e.selected;}).length;
    s.availablePipeIds=s.pipes.filter(function(p){return p.edgeId===null;}).map(function(p){return p.id;});
    s.pipesRemaining=s.availablePipeIds.length;
    var active=s.vertices.filter(function(v){return v.onPipe;});s.activeVertexCount=active.length;s.componentCount=s.components.length;
    s.leakIds=s.vertices.filter(function(v){return v.degree===1;}).map(function(v){return v.id;});
    s.branchIds=s.vertices.filter(function(v){return v.degree>=3;}).map(function(v){return v.id;});
    s.degreeTwo=active.length>0&&active.every(function(v){return v.degree===2;});s.singleLoop=s.degreeTwo&&s.componentCount===1;
    s.requiredTreeIds=s.vertices.filter(function(v){return v.role==='tree';}).map(function(v){return v.id;});
    s.forbiddenFlowerIds=s.vertices.filter(function(v){return v.role==='flower';}).map(function(v){return v.id;});
    s.treesCovered=s.requiredTreeIds.filter(function(id){return byVertex[id].onPipe;}).length;
    s.allTreesCovered=s.treesCovered===s.requiredTreeIds.length;
    s.flowerTouchedIds=s.forbiddenFlowerIds.filter(function(id){return byVertex[id].onPipe;});s.flowersAvoided=s.flowerTouchedIds.length===0;
    s.plots.forEach(function(p){
      var counted={};p.selectedCount=0;
      p.boundaryEdgeIds.forEach(function(id){if(!counted[id]){counted[id]=true;if(byEdge[id].selected)p.selectedCount++;}});
      p.matched=p.clue===null?null:p.selectedCount===p.clue;
    });
    s.clueCount=s.plots.filter(function(p){return p.clue!==null;}).length;
    s.matchedClueCount=s.plots.filter(function(p){return p.matched===true;}).length;s.allCluesMet=s.matchedClueCount===s.clueCount;
    s.goalReady=s.singleLoop&&s.allTreesCovered&&s.flowersAvoided&&s.allCluesMet;
    s.checks={hasPipes:s.pipeCount>0,degreeTwo:s.degreeTwo,singleLoop:s.singleLoop,trees:s.allTreesCovered,flowers:s.flowersAvoided,clues:s.allCluesMet};
    s.focusItems=s.edges.map(function(e){return{id:e.id,kind:'edge',x:e.x,y:e.y};}).concat([copy(s.pump)]);
    var selected=s.focusItems.find(function(item){return item.id===s.selectedId;})||s.focusItems[0];
    s.selectedId=selected.id;s.cursor=copy(selected);s.historyDepth=s.history.length;
    s.score=s.pipeCount*10+s.matchedClueCount*25+s.treesCovered*20+(s.phase==='won'?1000+Math.floor(s.remaining)*5:0);
  }
  function action(s,type,details){s.lastAction=Object.assign({type:type,at:s.elapsed,tick:s.tick},details||{});s.events.push(copy(s.lastAction));}
  function finish(s,phase,reason){
    s.phase=phase;s.lostReason=reason||null;refresh(s);
    s.message=phase==='won'?'单一闭环、树木、禁水与区域提示均通过；水泵已启动':
      reason==='timeout'?'铺管时间已用尽，请重新规划':'错误启动累计三次，请检查管线与区域提示';
    action(s,phase,{reason:s.lostReason});
  }
  function selectionMessage(s){
    if(s.selectedId===s.pump.id)return s.goalReady?'全部条件已满足：A 启动水泵':'A 检查并启动；须单一闭环、覆盖果树、避花且数字正确';
    var e=s.edges.find(function(edge){return edge.id===s.selectedId;});
    return e.selected?'A 拆除本段并归还 '+e.pipeId+'，B 撤销最近编辑':'A 铺设一段管线，B 撤销最近编辑';
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
  function toggle(s){
    var e=s.edges.find(function(edge){return edge.id===s.selectedId;});s.editAttempts++;
    if(!e.selected&&!s.availablePipeIds.length){
      s.blockedPlacements++;action(s,'stock-blocked',{edgeId:e.id});
      s.message='管件已用尽；可拆除已有管段，或按 B 撤销最近编辑';return;
    }
    var record={kind:e.selected?'remove':'place',edgeId:e.id,beforePipeId:e.pipeId,
      afterPipeId:e.selected?null:s.availablePipeIds[0],at:s.elapsed,tick:s.tick};
    e.pipeId=record.afterPipeId;s.totalEdits++;
    if(record.kind==='place')s.placements++;else s.removals++;
    s.history.push(copy(record));s.lastEdit=copy(record);refresh(s);action(s,record.kind,copy(record));
    s.message=s.goalReady?'绘图条件全部成立；请前往 PUMP 按 A 启动':record.kind==='place'?
      '已铺设 '+record.afterPipeId+'；只有实际管段参与连接和区域计数':'已拆除并归还 '+record.beforePipeId+'；连接与区域计数已同步更新';
  }
  function undo(s){
    if(!s.history.length){action(s,'undo-empty');s.message='还没有可撤销的编辑；选择一条边按 A 铺管';return;}
    var previous=s.history.pop(),e=s.edges.find(function(edge){return edge.id===previous.edgeId;});
    e.pipeId=previous.beforePipeId;s.undos++;s.selectedId=e.id;s.lastUndo={edit:copy(previous),at:s.elapsed,tick:s.tick};
    refresh(s);action(s,'undo',copy(s.lastUndo));s.message='已恢复准确管件与连接；时间和错误启动次数不会退回';
  }
  function submit(s){
    var reason=s.pipeCount===0?'empty':s.branchIds.length?'branch':s.leakIds.length?'leak':
      !s.singleLoop?'multiple-loops':!s.allTreesCovered?'trees':!s.flowersAvoided?'flower':!s.allCluesMet?'clues':'accepted';
    s.submissions++;if(reason!=='accepted')s.mistakes++;
    var selected=s.edges.filter(function(e){return e.selected;});
    s.lastSubmission={id:s.submissions,accepted:reason==='accepted',reason:reason,
      selectedEdgeIds:selected.map(function(e){return e.id;}),
      pipeAssignments:selected.map(function(e){return{edgeId:e.id,pipeId:e.pipeId};}),
      checks:copy(s.checks),componentCount:s.componentCount,at:s.elapsed,tick:s.tick};
    action(s,'submit',copy(s.lastSubmission));
    if(reason==='accepted'){finish(s,'won');return;}
    if(s.mistakes>=s.maxMistakes){finish(s,'lost','mistakes');return;}
    s.message=REASONS[reason]+'；错误启动累计 '+s.mistakes+'/3';
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    refresh(s);
    if(!dir){s._heldDirection=null;s._nextMoveTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;undo(s);return;}
    if(dir){
      if(dir!==s._heldDirection){s._heldDirection=dir;s._nextMoveTick=s.tick+20;navigate(s,dir);}
      else if(s.tick>=s._nextMoveTick){s._nextMoveTick=s.tick+10;navigate(s,dir);}
    }
    if(s._pendingA){s._pendingA=false;if(s.selectedId===s.pump.id)submit(s);else toggle(s);}
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LAYOUTS[d],grid={cols:4,rows:4,x:156,y:102,spacing:108};
    var vertices=Array.from({length:16},function(_,index){var col=index%4,row=Math.floor(index/4);
      return{id:'V'+(index+1),col:col,row:row,x:grid.x+col*grid.spacing,y:grid.y+row*grid.spacing,
        role:layout.trees.indexOf(index)>=0?'tree':layout.flowers.indexOf(index)>=0?'flower':'junction',degree:0,incidentEdgeIds:[],componentId:null,onPipe:false};});
    var edges=[];
    function addEdge(a,b,orientation){edges.push({id:'E'+(edges.length+1),aId:a.id,bId:b.id,orientation:orientation,x:(a.x+b.x)/2,y:(a.y+b.y)/2,plotIds:[],selected:false,pipeId:null});}
    for(var row=0;row<4;row++)for(var col=0;col<3;col++)addEdge(vertices[row*4+col],vertices[row*4+col+1],'horizontal');
    for(var r=0;r<3;r++)for(var c=0;c<4;c++)addEdge(vertices[r*4+c],vertices[(r+1)*4+c],'vertical');
    var plots=[];
    for(var pr=0;pr<3;pr++)for(var pc=0;pc<3;pc++){
      var plot={id:'R'+(plots.length+1),col:pc,row:pr,x:grid.x+(pc+.5)*grid.spacing,y:grid.y+(pr+.5)*grid.spacing,
        boundaryEdgeIds:['E'+(pr*3+pc+1),'E'+(13+pr*4+pc+1),'E'+((pr+1)*3+pc+1),'E'+(13+pr*4+pc)],
        clue:layout.clues[pr*3+pc],selectedCount:0,matched:null};
      plots.push(plot);plot.boundaryEdgeIds.forEach(function(id){edges.find(function(e){return e.id===id;}).plotIds.push(plot.id);});
    }
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:layout.name,grid:grid,vertices:vertices,edges:edges,plots:plots,
      pipes:Array.from({length:16},function(_,index){return{id:'P'+(index+1),edgeId:null};}),pipeStock:16,pipeCount:0,pipesRemaining:16,availablePipeIds:[],
      components:[],activeVertexCount:0,componentCount:0,leakIds:[],branchIds:[],degreeTwo:false,singleLoop:false,
      requiredTreeIds:[],forbiddenFlowerIds:[],treesCovered:0,allTreesCovered:false,flowerTouchedIds:[],flowersAvoided:true,
      clueCount:0,matchedClueCount:0,allCluesMet:false,goalReady:false,checks:null,
      pump:{id:'pump',kind:'submit',x:790,y:414},focusItems:[],selectedId:'E1',cursor:null,
      history:[],historyDepth:0,totalEdits:0,placements:0,removals:0,undos:0,editAttempts:0,blockedPlacements:0,lastEdit:null,lastUndo:null,lastAction:null,events:[],
      submissions:0,mistakes:0,maxMistakes:3,lastSubmission:null,
      phase:'playing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:null,
      message:'A 铺设或拆除，B 撤销；数字数边，横杠无提示；到 PUMP 显式启动',
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
