(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PureModel=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  // Public starting colors, target component counts and charged limits only.
  var LEVELS=[
    {name:'初片连彩',colors:['BGR','BBR','BGR','RRB','RBB','BGG'],target:{R:2,G:2,B:4},limit:6},
    {name:'镜边回域',colors:['BRG','GBR','GGR','RGR','BBR','BGB'],target:{R:2,G:3,B:3},limit:7},
    {name:'六角交织',colors:['GBR','GBG','GBB','BGR','RGG','RBR'],target:{R:3,G:2,B:3},limit:8}
  ];
  var COLORS=[{id:'R',name:'珊瑚红',rgb:[203,102,93]},{id:'G',name:'湖绿',rgb:[92,158,135]},{id:'B',name:'靛蓝',rgb:[94,126,182]}];
  var LATTICE=[[0,0],[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
  var NAV={N:{dx:0,dy:-1},E:{dx:1,dy:0},S:{dx:0,dy:1},W:{dx:-1,dy:0}};
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function finite(v,fallback){return Number.isFinite(v)?v:fallback;}
  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
  function point(v){return{x:v.x,y:v.y};}
  function placements(s){var map={};s.tiles.forEach(function(t){map[t.id]=t.slotSectorIds;});return map;}
  // Real component graph, including positive-length within-tile radial joins.
  // This does not use the authored six-fan forest identity as a shortcut.
  function evaluate(s,placed){
    var bySector={},parent={},index={};s.sectors.forEach(function(p,i){bySector[p.id]=p;parent[p.id]=p.id;index[p.id]=i;});
    function find(id){while(parent[id]!==id){parent[id]=parent[parent[id]];id=parent[id];}return id;}
    function join(a,b){a=find(a);b=find(b);if(a!==b){if(index[a]<index[b])parent[b]=a;else parent[a]=b;}}
    s.tiles.forEach(function(t){var ids=placed[t.id];for(var i=0;i<3;i++)for(var j=i+1;j<3;j++)if(bySector[ids[i]].colorId===bySector[ids[j]].colorId)join(ids[i],ids[j]);});
    var matchingEdgeIds=[],conflictEdgeIds=[],edgeResults=[];
    s.edges.forEach(function(e){
      var ids=e.incidences.map(function(p){return placed[p.tileId][p.slotIndex];}),colors=ids.map(function(id){return bySector[id].colorId;}),matched=null;
      if(e.shared){matched=colors[0]===colors[1];if(matched){matchingEdgeIds.push(e.id);join(ids[0],ids[1]);}else conflictEdgeIds.push(e.id);}
      edgeResults.push({colorIds:colors,matched:matched});
    });
    var groups={};s.sectors.forEach(function(p){var root=find(p.id);if(!groups[root])groups[root]=[];groups[root].push(p.id);});
    var regions=[],regionCounts={},sectorRegions={};
    s.colors.forEach(function(color){regionCounts[color.id]=0;s.sectors.forEach(function(p){var ids=groups[p.id];if(!ids||p.colorId!==color.id)return;
      var id='region-'+ids[0],owners={};ids.forEach(function(sid){owners[bySector[sid].tileId]=true;sectorRegions[sid]=id;});
      regions.push({id:id,colorId:color.id,sectorIds:ids.slice(),tileIds:s.tiles.filter(function(t){return!!owners[t.id];}).map(function(t){return t.id;})});regionCounts[color.id]++;
    });});
    var colorRegions=s.colors.map(function(c){return{colorId:c.id,actual:regionCounts[c.id],target:s.targetRegions[c.id],matched:regionCounts[c.id]===s.targetRegions[c.id]};});
    var matchedRegionColorCount=colorRegions.filter(function(c){return c.matched;}).length,sharedEdgeCount=s.edges.filter(function(e){return e.shared;}).length;
    return{edgeResults:edgeResults,sectorRegions:sectorRegions,regions:regions,regionCounts:regionCounts,colorRegions:colorRegions,
      sharedEdgeCount:sharedEdgeCount,matchedEdgeCount:matchingEdgeIds.length,matchingEdgeIds:matchingEdgeIds,conflictEdgeIds:conflictEdgeIds,
      matchedRegionColorCount:matchedRegionColorCount,allEdgesMatched:matchingEdgeIds.length===sharedEdgeCount,allRegionsMatched:matchedRegionColorCount===s.colors.length,
      goalReady:matchingEdgeIds.length===sharedEdgeCount&&matchedRegionColorCount===s.colors.length};
  }
  function permutation(ids,kind){return kind==='rotate'?[ids[2],ids[0],ids[1]]:[ids[0],ids[2],ids[1]];}
  function preview(s,kind){
    var tile=s.tiles.find(function(t){return t.id===s.selectedId;}),before=tile.slotSectorIds.slice(),after=permutation(before,kind),bySector={};s.sectors.forEach(function(p){bySector[p.id]=p;});
    var beforeColors=before.map(function(id){return bySector[id].colorId;}),afterColors=after.map(function(id){return bySector[id].colorId;}),placed=placements(s);placed[tile.id]=after;
    var result=evaluate(s,placed);
    return{kind:kind,tileId:tile.id,beforeSectorIds:before,afterSectorIds:after,beforeColors:beforeColors,afterColors:afterColors,
      colorChanged:beforeColors.join('')!==afterColors.join(''),cost:1,matchedEdgeCount:result.matchedEdgeCount,regionCounts:copy(result.regionCounts),
      allEdgesMatched:result.allEdgesMatched,allRegionsMatched:result.allRegionsMatched,willWin:result.goalReady,willExhaustMoves:s.movesUsed+1>=s.moveLimit&&!result.goalReady};
  }
  function refresh(s){
    var actual=evaluate(s,placements(s)),bySector={};s.sectors.forEach(function(p){bySector[p.id]=p;});
    s.edges.forEach(function(e,i){e.colorIds=actual.edgeResults[i].colorIds;e.matched=actual.edgeResults[i].matched;});
    s.tiles.forEach(function(t){t.slotColors=t.slotSectorIds.map(function(id){return bySector[id].colorId;});t.slots.forEach(function(slot,i){var p=bySector[t.slotSectorIds[i]];p.slotIndex=i;slot.sectorId=p.id;slot.mark=p.mark;slot.colorId=p.colorId;slot.regionId=actual.sectorRegions[p.id];});});
    ['regions','regionCounts','colorRegions','sharedEdgeCount','matchedEdgeCount','matchingEdgeIds','conflictEdgeIds','matchedRegionColorCount','allEdgesMatched','allRegionsMatched','goalReady'].forEach(function(key){s[key]=actual[key];});
    s.movesRemaining=Math.max(0,s.moveLimit-s.movesUsed);s.historyDepth=s.history.length;
    s.focusItems=s.tiles.map(function(t){return{id:t.id,kind:'tile',x:t.x,y:t.y};});
    var selected=s.focusItems.find(function(f){return f.id===s.selectedId;})||s.focusItems[0];s.selectedId=selected.id;s.cursor=copy(selected);
    s.previewRotate=preview(s,'rotate');s.previewMirror=preview(s,'mirror');
    s.score=s.matchedEdgeCount*40+s.matchedRegionColorCount*100+(s.phase==='won'?1000+Math.floor(s.remaining)*5+s.movesRemaining*40:0);
  }
  function action(s,type,details){s.lastAction=Object.assign({type:type,at:s.elapsed,tick:s.tick},details||{});s.events.push(copy(s.lastAction));}
  function finish(s,phase,reason){s.phase=phase;s.lostReason=reason||null;refresh(s);s.message=phase==='won'?'全部共享边匹配，各色色域数量准确':reason==='timeout'?'拼域时间已用尽，请重新尝试':'操作数已用尽；镜像和旋转都消耗一步';action(s,phase,{reason:s.lostReason});}
  function direction(input){var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');}
  function navigate(s,name){
    var from=s.cursor,d=NAV[name],best=null;
    s.focusItems.forEach(function(item,index){var dx=item.x-from.x,dy=item.y-from.y;if(dx*d.dx+dy*d.dy<=0)return;var distance=dx*dx+dy*dy,perpendicular=Math.abs(dx*d.dy-dy*d.dx),c={id:item.id,cost:distance+2*perpendicular*perpendicular,distance:distance,perpendicular:perpendicular,index:index};
      if(!best||c.cost<best.cost||c.cost===best.cost&&(c.distance<best.distance||c.distance===best.distance&&(c.perpendicular<best.perpendicular||c.perpendicular===best.perpendicular&&c.index<best.index)))best=c;
    });
    if(!best){action(s,'select-blocked',{direction:name});return;}s.selectedId=best.id;refresh(s);action(s,'select',{direction:name,id:s.selectedId});s.message='A 顺时针旋转120°，B 沿标记轴镜像；每次均消耗一步';
  }
  function operate(s,kind){
    var p=kind==='rotate'?s.previewRotate:s.previewMirror,t=s.tiles.find(function(tile){return tile.id===s.selectedId;});s.movesUsed++;
    if(kind==='rotate')s.rotationCount++;else s.mirrorCount++;
    var record={id:s.movesUsed,kind:kind,tileId:t.id,beforeSectorIds:p.beforeSectorIds.slice(),afterSectorIds:p.afterSectorIds.slice(),beforeColors:p.beforeColors.slice(),afterColors:p.afterColors.slice(),colorChanged:p.colorChanged,at:s.elapsed,tick:s.tick};
    t.slotSectorIds=record.afterSectorIds.slice();s.history.push(copy(record));s.lastOperation=copy(record);refresh(s);action(s,kind,copy(record));
    if(s.goalReady){finish(s,'won');return;}if(s.movesUsed>=s.moveLimit){finish(s,'lost','moves');return;}
    s.message=!record.colorChanged?'同色图案未变，扇区编号已变化；消耗一步':kind==='rotate'?'已顺时针旋转120°；编号与颜色随扇区移动':'已沿标记轴镜像；扇区编号与连接已同步更新';
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    if(!dir){s._heldDirection=null;s._nextMoveTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;operate(s,'mirror');return;}
    if(dir){if(dir!==s._heldDirection){s._heldDirection=dir;s._nextMoveTick=s.tick+20;navigate(s,dir);}else if(s.tick>=s._nextMoveTick){s._nextMoveTick=s.tick+10;navigate(s,dir);}}
    if(s._pendingA){s._pendingA=false;operate(s,'rotate');}
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),level=LEVELS[d],projection={x:324,y:270,unit:190};
    var vertices=LATTICE.map(function(p,i){return{id:'V'+(i+1),u:p[0],v:p[1],x:projection.x+projection.unit*(p[0]+p[1]/2),y:projection.y+projection.unit*Math.sqrt(3)*p[1]/2};});
    var tiles=[],sectors=[],edges=[],byEdge={};
    for(var i=0;i<6;i++){
      var vs=[vertices[0],vertices[i+1],vertices[(i+1)%6+1]],center={x:(vs[0].x+vs[1].x+vs[2].x)/3,y:(vs[0].y+vs[1].y+vs[2].y)/3},id='T'+(i+1),ids=[];
      for(var j=0;j<3;j++){var sid=id+'S'+(j+1);ids.push(sid);sectors.push({id:sid,tileId:id,mark:j+1,colorId:level.colors[i][j],slotIndex:j});}
      var tile={id:id,vertexIds:vs.map(function(v){return v.id;}),vertices:copy(vs),center:copy(center),x:center.x,y:center.y,slotSectorIds:ids,slotColors:[],slots:[],mirrorAxis:{a:point(vs[2]),b:{x:(vs[0].x+vs[1].x)/2,y:(vs[0].y+vs[1].y)/2}}};
      for(var slot=0;slot<3;slot++){
        var av=vs[slot],bv=vs[(slot+1)%3],ordered=[av,bv].sort(function(a,b){return Number(a.id.slice(1))-Number(b.id.slice(1));}),key=ordered[0].id+'|'+ordered[1].id,e=byEdge[key];
        if(!e){e={id:'E'+(edges.length+1),vertexIds:ordered.map(function(v){return v.id;}),a:point(ordered[0]),b:point(ordered[1]),incidences:[],shared:false,colorIds:[],matched:null};edges.push(e);byEdge[key]=e;}
        e.incidences.push({tileId:id,slotIndex:slot});e.shared=e.incidences.length===2;
        tile.slots.push({index:slot,edgeId:e.id,sectorId:ids[slot],mark:slot+1,colorId:level.colors[i][slot],polygon:[point(center),point(av),point(bv)],regionId:null});
      }tiles.push(tile);
    }
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:level.name,projection:projection,colors:copy(COLORS),vertices:vertices,tiles:tiles,sectors:sectors,edges:edges,
      regions:[],regionCounts:{R:0,G:0,B:0},targetRegions:copy(level.target),colorRegions:[],sharedEdgeCount:6,matchedEdgeCount:0,matchingEdgeIds:[],conflictEdgeIds:[],matchedRegionColorCount:0,allEdgesMatched:false,allRegionsMatched:false,goalReady:false,
      focusItems:[],selectedId:'T1',cursor:null,previewRotate:null,previewMirror:null,moveLimit:level.limit,movesUsed:0,movesRemaining:level.limit,rotationCount:0,mirrorCount:0,history:[],historyDepth:0,lastOperation:null,lastAction:null,events:[],
      phase:'playing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:null,message:'方向选择彩砖，A 旋转、B 镜像；检查共享边与各色色域数量',
      _accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextMoveTick:0,_cancelEpoch:null};refresh(s);return s;
  }
  function step(s,dt,input){
    if(!s||s.phase!=='playing')return s;input=input||{};dt=clamp(finite(dt,0),0,.25);var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)){if(s._cancelEpoch!==null&&s._cancelEpoch!==input.cancelEpoch)cancelled=true;s._cancelEpoch=input.cancelEpoch;}
    var a=!!input.a,b=!!input.b;if(cancelled){s._pendingA=false;s._pendingB=false;s._heldDirection=null;s._nextMoveTick=0;}else{if((a&&!s._lastA)||input.aPressed)s._pendingA=true;if((b&&!s._lastB)||input.bPressed)s._pendingB=true;}
    s._lastA=a;s._lastB=b;s.events=[];s._accumulator+=dt;var dir=cancelled?null:direction(input);
    while(s._accumulator+EPS>=DT&&s.phase==='playing'){s._accumulator=Math.max(0,s._accumulator-DT);tick(s,dir);}if(s.events.length>32)s.events=s.events.slice(-32);return s;
  }
  return{create:create,step:step,TICK_HZ:HZ};
}));
