(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PureModel=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  var LAYOUTS=[
    {name:'三角浅湾',islands:[[0,0,'coral'],[4,0,'gold'],[4,3,'teal'],[0,3,'teal'],[6,3,'gold'],[8,3,'coral']],pieces:[[4,'gold'],[3,'teal'],[5,'coral'],[2,'gold'],[2,'gold']]},
    {name:'双湾接岸',islands:[[0,0,'gold'],[0,3,'coral'],[4,3,'gold'],[4,0,'coral'],[8,0,'teal'],[8,3,'coral']],pieces:[[3,'coral'],[3,'coral'],[3,'coral'],[4,'gold'],[5,'gold']]},
    {name:'七岛长链',islands:[[0,1,'gold'],[4,1,'coral'],[4,4,'gold'],[0,4,'coral'],[8,1,'coral'],[8,4,'teal'],[6,4,'teal']],pieces:[[3,'coral'],[3,'coral'],[4,'gold'],[5,'gold'],[2,'teal'],[2,'teal']]}
  ];
  var COLORS=[{id:'coral',label:'珊瑚',glyph:'C',rgb:[225,104,83]},
    {id:'teal',label:'青蓝',glyph:'T',rgb:[41,159,164]},
    {id:'gold',label:'金黄',glyph:'G',rgb:[225,176,57]}];
  var DIRECTIONS={N:{dx:0,dy:-1},E:{dx:1,dy:0},S:{dx:0,dy:1},W:{dx:-1,dy:0}};
  var REASONS={'same-island':'起点和终点必须是不同岛',length:'直线桥长不符',color:'目标岛颜色与桥片色端不符',
    'through-island':'桥线穿过了第三座岛',occupied:'这对岛之间已有桥',intersection:'桥线与已有桥交叉、触碰或重叠'};
  function finite(v,fallback){return Number.isFinite(v)?v:fallback;}
  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function island(s,id){return s.islands.find(function(i){return i.id===id;});}
  function piece(s,id){return s.pieces.find(function(p){return p.id===id;});}
  function cross(a,b,c){return(b.gx-a.gx)*(c.gy-a.gy)-(b.gy-a.gy)*(c.gx-a.gx);}
  function onSegment(a,b,p){return cross(a,b,p)===0&&p.gx>=Math.min(a.gx,b.gx)&&p.gx<=Math.max(a.gx,b.gx)&&p.gy>=Math.min(a.gy,b.gy)&&p.gy<=Math.max(a.gy,b.gy);}
  function forbiddenIntersection(a,b,c,d){
    var abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
    var shared=a.id===c.id||a.id===d.id||b.id===c.id||b.id===d.id;
    if(abC===0&&abD===0&&cdA===0&&cdB===0){
      var key=a.gx!==b.gx?'gx':'gy';
      var lo=Math.max(Math.min(a[key],b[key]),Math.min(c[key],d[key]));
      var hi=Math.min(Math.max(a[key],b[key]),Math.max(c[key],d[key]));
      if(lo>hi)return false;
      return lo<hi||!shared;
    }
    var intersects=(abC===0&&onSegment(a,b,c))||(abD===0&&onSegment(a,b,d))||
      (cdA===0&&onSegment(c,d,a))||(cdB===0&&onSegment(c,d,b))||
      (((abC>0&&abD<0)||(abC<0&&abD>0))&&((cdA>0&&cdB<0)||(cdA<0&&cdB>0)));
    return intersects&&!shared;
  }
  function graph(s,extra){
    var adj={},incident={},component={},count=0,largest=0;
    s.islands.forEach(function(i){adj[i.id]=[];incident[i.id]=[];});
    var edges=extra?s.bridges.concat([extra]):s.bridges;
    edges.forEach(function(b){adj[b.sourceId].push(b.targetId);adj[b.targetId].push(b.sourceId);
      incident[b.sourceId].push(b.pieceId);incident[b.targetId].push(b.pieceId);});
    s.islands.forEach(function(i){
      if(component[i.id])return;
      count++;var queue=[i.id],size=0;component[i.id]=i.id;
      for(var head=0;head<queue.length;head++){
        var id=queue[head];size++;
        adj[id].forEach(function(next){if(!component[next]){component[next]=i.id;queue.push(next);}});
      }
      largest=Math.max(largest,size);
    });
    return{count:count,largest:largest,component:component,incident:incident};
  }
  function preview(s){
    if(s.stage!=='target')return null;
    var p=piece(s,s.heldPieceId),from=island(s,s.sourceId),to=island(s,s.selectedIslandId);
    var distance=(to.gx-from.gx)*(to.gx-from.gx)+(to.gy-from.gy)*(to.gy-from.gy);
    var reason=null,blockingIsland=null,blockingPiece=null;
    if(from.id===to.id)reason='same-island';
    else if(distance!==p.length*p.length)reason='length';
    else if(to.color!==p.targetColor)reason='color';
    if(!reason){
      for(var i=0;i<s.islands.length;i++){
        var third=s.islands[i];
        if(third.id!==from.id&&third.id!==to.id&&onSegment(from,to,third)){
          reason='through-island';blockingIsland=third.id;break;
        }
      }
    }
    if(!reason){
      for(var j=0;j<s.bridges.length;j++){
        var bridge=s.bridges[j];
        if((bridge.sourceId===from.id&&bridge.targetId===to.id)||(bridge.sourceId===to.id&&bridge.targetId===from.id)){
          reason='occupied';blockingPiece=bridge.pieceId;break;
        }
      }
    }
    if(!reason){
      for(var k=0;k<s.bridges.length;k++){
        var existing=s.bridges[k];
        if(forbiddenIntersection(from,to,island(s,existing.sourceId),island(s,existing.targetId))){
          reason='intersection';blockingPiece=existing.pieceId;break;
        }
      }
    }
    var components=reason?null:graph(s,{sourceId:from.id,targetId:to.id,pieceId:p.id}).count;
    return{pieceId:p.id,sourceId:from.id,targetId:to.id,length:p.length,targetColor:p.targetColor,
      distanceSquared:distance,requiredSquared:p.length*p.length,targetColorMatches:to.color===p.targetColor,
      valid:!reason,reason:reason,blockingPieceId:blockingPiece,blockingIslandId:blockingIsland,
      resultingComponentCount:components,wouldFinish:s.remainingPieces===1,wouldConnectAll:components===1,
      wouldLoseDisconnected:!reason&&s.remainingPieces===1&&components!==1};
  }
  function refresh(s){
    var g=graph(s),placed={};s.bridges.forEach(function(b){placed[b.pieceId]=b.id;});
    s.pieces.forEach(function(p){p.placed=!!placed[p.id];p.bridgeId=placed[p.id]||null;});
    s.islands.forEach(function(i){i.incidentPieceIds=g.incident[i.id];i.degree=i.incidentPieceIds.length;i.componentId=g.component[i.id];});
    s.availablePieceIds=s.pieces.filter(function(p){return!p.placed;}).map(function(p){return p.id;});
    s.placedCount=s.bridges.length;s.remainingPieces=s.availablePieceIds.length;
    s.componentCount=g.count;s.connected=g.count===1;s.largestComponentSize=g.largest;
    if(s.stage==='bank'){
      if(s.availablePieceIds.indexOf(s.selectedPieceId)<0)s.selectedPieceId=s.availablePieceIds[0]||null;
      var selected=piece(s,s.selectedPieceId);s.cursor=selected?{kind:'piece',id:selected.id,x:selected.x,y:selected.y}:null;
    }else{var chosen=island(s,s.selectedIslandId);s.cursor={kind:'island',id:chosen.id,x:chosen.x,y:chosen.y};}
    s.preview=preview(s);
    s.score=s.placedCount*100+(s.islands.length-s.componentCount)*40+(s.phase==='won'?1000+Math.floor(s.remaining)*5:0);
  }
  function action(s,type,details){s.lastAction=Object.assign({type:type,at:s.elapsed,tick:s.tick},details||{});s.events.push(copy(s.lastAction));}
  function finish(s,phase,reason){
    s.phase=phase;s.lostReason=reason||null;refresh(s);
    s.message=phase==='won'?'全部桥片已用完，所有岛屿连成一个不交叉网络':
      reason==='timeout'?'时间已用尽，请重新规划连接':reason==='invalid'?'非法放置累计三次，请重新选择桥片和端点':'桥片全部用完，但仍有岛屿没有连入同一网络';
    action(s,phase,{reason:s.lostReason});
  }
  function selectionMessage(s){
    if(s.stage==='bank')return'选择可用桥片：A 拿取，B 撤回最近放置的桥';
    if(s.stage==='source')return'选择数字端起点：A 确认，B 返回桥片库';
    if(!s.preview.valid)return REASONS[s.preview.reason]+'；可改目标，A 提交错误会计次';
    if(s.preview.wouldLoseDisconnected)return'本桥局部合法，但最后放下仍会断连；请更换方案或返回撤桥';
    return'桥长、色端和交叉检查通过；A 放置，B 返回起点选择';
  }
  function direction(input){
    var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);
    if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;
    return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');
  }
  function navigate(s,name){
    if(s.stage==='bank'){
      var fromPiece=piece(s,s.selectedPieceId),bankDir=DIRECTIONS[name],bankBest=null;
      s.pieces.forEach(function(p,index){
        if(p.placed)return;
        var dx=p.x-fromPiece.x,dy=p.y-fromPiece.y;if(dx*bankDir.dx+dy*bankDir.dy<=0)return;
        var candidate={id:p.id,distance:dx*dx+dy*dy,perpendicular:Math.abs(dx*bankDir.dy-dy*bankDir.dx),index:index};
        if(!bankBest||candidate.distance<bankBest.distance||candidate.distance===bankBest.distance&&
          (candidate.perpendicular<bankBest.perpendicular||candidate.perpendicular===bankBest.perpendicular&&candidate.index<bankBest.index))bankBest=candidate;
      });
      if(!bankBest){action(s,'select-blocked',{direction:name});return;}s.selectedPieceId=bankBest.id;
    }else{
      var from=island(s,s.selectedIslandId),d=DIRECTIONS[name],best=null;
      s.islands.forEach(function(i,index){
        var dx=i.gx-from.gx,dy=i.gy-from.gy;if(dx*d.dx+dy*d.dy<=0)return;
        var candidate={id:i.id,distance:dx*dx+dy*dy,perpendicular:Math.abs(dx*d.dy-dy*d.dx),index:index};
        if(!best||candidate.distance<best.distance||candidate.distance===best.distance&&
          (candidate.perpendicular<best.perpendicular||candidate.perpendicular===best.perpendicular&&candidate.index<best.index))best=candidate;
      });
      if(!best){action(s,'select-blocked',{direction:name});return;}s.selectedIslandId=best.id;
    }
    refresh(s);action(s,'select',{direction:name,kind:s.cursor.kind,id:s.cursor.id});s.message=selectionMessage(s);
  }
  function back(s){
    if(s.stage==='target'){
      s.selectedIslandId=s.sourceId;s.sourceId=null;s.stage='source';s.cancels++;
      refresh(s);action(s,'cancel',{stage:s.stage});s.message=selectionMessage(s);return;
    }
    if(s.stage==='source'){
      s.selectedPieceId=s.heldPieceId;s.heldPieceId=null;s.sourceId=null;s.stage='bank';s.cancels++;
      refresh(s);action(s,'cancel',{stage:s.stage});s.message=selectionMessage(s);return;
    }
    if(!s.bridges.length){action(s,'undo-empty');s.message='尚未放置任何桥；A 拿取当前桥片';return;}
    var removed=s.bridges.pop();s.undos++;s.selectedPieceId=removed.pieceId;s.selectedIslandId=removed.sourceId;
    s.lastUndo=Object.assign(copy(removed),{at:s.elapsed,tick:s.tick});
    refresh(s);action(s,'undo',copy(s.lastUndo));s.message='已归还桥片 '+removed.pieceId+'；时间和错误次数不会退回';
  }
  function confirm(s){
    if(s.stage==='bank'){
      if(!s.selectedPieceId)return;
      s.heldPieceId=s.selectedPieceId;s.sourceId=null;s.selectedIslandId=s.islands[0].id;s.stage='source';
      refresh(s);action(s,'pick',{pieceId:s.heldPieceId});s.message=selectionMessage(s);return;
    }
    if(s.stage==='source'){
      s.sourceId=s.selectedIslandId;s.stage='target';refresh(s);
      action(s,'source',{pieceId:s.heldPieceId,sourceId:s.sourceId});s.message=selectionMessage(s);return;
    }
    var candidate=s.preview;s.placementAttempts++;
    s.lastPlacement={pieceId:candidate.pieceId,sourceId:candidate.sourceId,targetId:candidate.targetId,
      accepted:candidate.valid,reason:candidate.reason,at:s.elapsed,tick:s.tick};
    if(!candidate.valid){
      s.failedCommits++;action(s,'placement',copy(s.lastPlacement));
      if(s.failedCommits>=s.maxFailedCommits)finish(s,'lost','invalid');
      else s.message=REASONS[candidate.reason]+'；非法放置累计 '+s.failedCommits+'/3';
      return;
    }
    var p=piece(s,candidate.pieceId),oldIndex=s.pieces.indexOf(p);
    s.bridges.push({id:'bridge-'+p.id,pieceId:p.id,sourceId:candidate.sourceId,targetId:candidate.targetId,length:p.length,targetColor:p.targetColor});
    s.totalPlacements++;s.stage='bank';s.heldPieceId=null;s.sourceId=null;
    s.selectedPieceId=null;
    for(var i=oldIndex+1;i<s.pieces.length;i++)if(!s.pieces[i].placed){s.selectedPieceId=s.pieces[i].id;break;}
    refresh(s);action(s,'placement',copy(s.lastPlacement));
    if(s.remainingPieces===0){finish(s,s.connected?'won':'lost',s.connected?null:'disconnected');return;}
    s.message='桥片 '+p.id+' 已放置；继续选片，B 可撤回最近一座桥';
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
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LAYOUTS[d],board={x:90,y:110,unit:58};
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:layout.name,board:board,islandRadius:18,colors:copy(COLORS),
      islands:layout.islands.map(function(i,index){return{id:'I'+(index+1),gx:i[0],gy:i[1],x:board.x+i[0]*board.unit,y:board.y+i[1]*board.unit,color:i[2],degree:0,incidentPieceIds:[],componentId:null};}),
      pieces:layout.pieces.map(function(p,index){return{id:'P'+(index+1),length:p[0],targetColor:p[1],x:748+(index%2)*112,y:150+Math.floor(index/2)*108,placed:false,bridgeId:null};}),
      bridges:[],availablePieceIds:[],placedCount:0,remainingPieces:layout.pieces.length,componentCount:layout.islands.length,connected:false,largestComponentSize:1,
      stage:'bank',selectedPieceId:'P1',heldPieceId:null,selectedIslandId:'I1',sourceId:null,cursor:null,preview:null,
      totalPlacements:0,undos:0,cancels:0,failedCommits:0,placementAttempts:0,maxFailedCommits:3,
      lastPlacement:null,lastUndo:null,lastAction:null,events:[],phase:'playing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:null,
      message:'直线长度对数字，目标岛对色端；A 拿取，B 撤回最近桥',
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
