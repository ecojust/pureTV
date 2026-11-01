import { geometry, classifyMask, boundaryCounts } from './independent-loop-math.mjs';

// Public board constraints only. No Model, pilot, author route, filesystem, or automatic test run.
const insist=(ok,message)=>{if(!ok)throw new Error(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const vertexId=i=>'V'+(i+1),edgeId=i=>'E'+(i+1),plotId=i=>'R'+(i+1);

function context(snapshot) {
  insist(snapshot&&typeof snapshot==='object','Public board snapshot required');
  const g=geometry(),{vertices,edges,plots,grid,requiredTreeIds,forbiddenFlowerIds}=snapshot;
  insist(Array.isArray(vertices)&&vertices.length===16&&Array.isArray(edges)&&edges.length===24&&Array.isArray(plots)&&plots.length===9,'Expected fixed 16/24/9 public geometry');
  insist(grid&&grid.cols===4&&grid.rows===4&&grid.x===156&&grid.y===102&&grid.spacing===108,'Public screen grid differs from the contract');
  insist(snapshot.pipeStock===16,'Public pipe stock differs from the contract');
  const trees=[],flowers=[];
  for(const [i,v] of vertices.entries()) {
    const n=g.nodes[i];
    insist(v.id===vertexId(i)&&v.col===n.x&&v.row===n.y&&v.x===156+108*n.x&&v.y===102+108*n.y,'Public vertex order/axial-free screen geometry differs');
    insist(['junction','tree','flower'].includes(v.role),'Unknown public vertex role');
    if(v.role==='tree')trees.push(i);if(v.role==='flower')flowers.push(i);
  }
  const idsMatch=(actual,expected)=>Array.isArray(actual)&&actual.length===expected.length&&new Set(actual).size===actual.length&&expected.every(id=>actual.includes(id));
  insist(idsMatch(requiredTreeIds,trees.map(vertexId))&&idsMatch(forbiddenFlowerIds,flowers.map(vertexId)),'Role lists differ from public vertex roles');
  for(const [i,p] of plots.entries()) {
    const f=g.faces[i];
    insist(p.id===plotId(i)&&p.col===f.x&&p.row===f.y&&p.x===156+108*(f.x+.5)&&p.y===102+108*(f.y+.5),'Plot order/screen center differs');
    insist(same(p.boundaryEdgeIds,f.edgeIds.map(edgeId)),'Plot sides are not exact top/right/bottom/left unit edges');
    insist(p.clue===null||(Number.isInteger(p.clue)&&p.clue>=0&&p.clue<=4),'A clue must be integer 0..4 or explicit null');
  }
  const edgePlots=g.edges.map(e=>g.faces.filter(f=>f.edgeIds.includes(e.id)).map(f=>plotId(f.id)));
  for(const [i,e] of edges.entries()) {
    const a=g.nodes[g.edges[i].a],b=g.nodes[g.edges[i].b];
    insist(e.id===edgeId(i)&&e.aId===vertexId(a.id)&&e.bId===vertexId(b.id)&&e.orientation===(a.y===b.y?'horizontal':'vertical'),'Edge order/endpoints/orientation differ');
    insist(e.x===156+54*(a.x+b.x)&&e.y===102+54*(a.y+b.y),'Edge midpoint differs');
    insist(idsMatch(e.plotIds,edgePlots[i]),'Edge incidence does not match its one/two public plots');
  }
  return {g,snapshot,trees,flowers,edgePlots,clues:plots.map(p=>p.clue),pipeStock:snapshot.pipeStock};
}

function evaluate(c,mask,topology) {
  topology??=classifyMask(mask); // Validates mask domain and supplies the independent ordered-cycle certificate.
  const {g}=c,selected=g.edges.filter(e=>mask&(1<<e.id)),incident=Array.from({length:16},()=>[]),reach=Array(16).fill(0);
  for(const e of selected){incident[e.a].push(edgeId(e.id));incident[e.b].push(edgeId(e.id));reach[e.a]|=1<<e.b;reach[e.b]|=1<<e.a;}
  const active=[];for(let i=0;i<16;i++)if(incident[i].length){active.push(i);reach[i]|=1<<i;}
  // Bitset Warshall closure deliberately differs from production BFS/component walks.
  for(let k=0;k<16;k++)for(let i=0;i<16;i++)if(reach[i]&(1<<k))reach[i]|=reach[k];
  const components=[],representative=Array(16).fill(null);let seen=0;
  for(const i of active)if(!(seen&(1<<i))) {
    const group=reach[i],members=active.filter(j=>group&(1<<j)),id=vertexId(i);seen|=group;
    for(const j of members)representative[j]=id;
    components.push({id,vertexIds:members.map(vertexId),edgeIds:selected.filter(e=>group&(1<<e.a)).map(e=>edgeId(e.id))});
  }
  const vertices=g.nodes.map(n=>({id:vertexId(n.id),degree:incident[n.id].length,incidentEdgeIds:incident[n.id],componentId:representative[n.id],onPipe:incident[n.id].length>0}));
  const degrees=vertices.map(v=>v.degree),leakIds=vertices.filter(v=>v.degree===1).map(v=>v.id),branchIds=vertices.filter(v=>v.degree>=3).map(v=>v.id);
  const degreeTwo=active.length>0&&active.every(i=>degrees[i]===2),singleLoop=topology.isSingleCycle;
  insist(singleLoop===(degreeTwo&&components.length===1),'Ordered single-cycle certificate disagrees with independent transitive closure');
  const counts=boundaryCounts(mask),plots=c.clues.map((clue,i)=>({id:plotId(i),selectedCount:counts[i],matched:clue===null?null:counts[i]===clue}));
  const clueCount=c.clues.filter(n=>n!==null).length,matchedClueCount=plots.filter(p=>p.matched===true).length,allCluesMet=matchedClueCount===clueCount;
  const treesCovered=c.trees.filter(i=>degrees[i]>0).length,allTreesCovered=treesCovered===c.trees.length;
  const flowerTouchedIds=c.flowers.filter(i=>degrees[i]>0).map(vertexId),flowersAvoided=flowerTouchedIds.length===0,pipeCount=selected.length;
  const checks={hasPipes:pipeCount>0,degreeTwo,singleLoop,trees:allTreesCovered,flowers:flowersAvoided,clues:allCluesMet};
  const goalReady=singleLoop&&allTreesCovered&&flowersAvoided&&allCluesMet;
  const reason=!pipeCount?'empty':branchIds.length?'branch':leakIds.length?'leak':!singleLoop?'multiple-loops':!allTreesCovered?'trees':!flowersAvoided?'flower':!allCluesMet?'clues':'accepted';
  return {selectedMask:mask,vertices,edges:g.edges.map(e=>({id:edgeId(e.id),aId:vertexId(e.a),bId:vertexId(e.b),plotIds:[...c.edgePlots[e.id]],selected:!!(mask&(1<<e.id))})),
    plots,components,transitiveClosureMasks:reach,topology,
    summary:{pipeCount,activeVertexCount:active.length,componentCount:components.length,leakIds,branchIds,degreeTwo,singleLoop,treesCovered,allTreesCovered,flowerTouchedIds,flowersAvoided,
      clueCount,matchedClueCount,allCluesMet,goalReady,checks,reason,withinStock:pipeCount<=c.pipeStock}};
}

/** Physical pipe identities, edit history, clock and cached derived fields are deliberately not read. */
export function evaluatePublicBoard(snapshot,mask) {
  const c=context(snapshot);
  if(mask===undefined){mask=0;for(const [i,e] of snapshot.edges.entries()){insist(typeof e.selected==='boolean','Current selected flags must be booleans');if(e.selected)mask|=1<<i;}}
  return evaluate(c,mask);
}

// Geometry-only candidates are built lazily once; no public board values are cached across calls.
let candidates=null;
function evenCandidates() {
  if(candidates===null) {
    const basis=geometry().faces.map(f=>f.mask),result=[];
    for(let selector=0;selector<512;selector++) {
      let mask=0;for(let i=0;i<9;i++)if(selector&(1<<i))mask^=basis[i];
      result.push(Object.freeze({mask,topology:classifyMask(mask)}));
    }
    candidates=Object.freeze(result);
  }
  return candidates;
}

/** Filter the proven complete even-mask space, without executing the original proof/test suite again. */
export function solvePublicBoard(snapshot) {
  const c=context(snapshot),solutions=[],topologyOnlyCounterexamples=[],topologyByCycleCount={2:[],3:[],4:[]};
  const candidateCounts={evaluatedMasks:0,stockEligibleMasks:0,singleCyclesWithinStock:0,disjointCyclesWithinStock:0,matchingRoleClueLayouts:0,solutionCount:0,topologyOnlyCounterexampleCount:0};
  for(const candidate of evenCandidates()) {
    candidateCounts.evaluatedMasks++;const e=evaluate(c,candidate.mask,candidate.topology),s=e.summary;
    if(!s.withinStock)continue;candidateCounts.stockEligibleMasks++;
    if(s.singleLoop)candidateCounts.singleCyclesWithinStock++;
    if(candidate.topology.kind==='disjointcycles')candidateCounts.disjointCyclesWithinStock++;
    if(!s.allTreesCovered||!s.flowersAvoided||!s.allCluesMet)continue;candidateCounts.matchingRoleClueLayouts++;
    if(s.singleLoop)solutions.push(candidate.mask);
    else if(s.degreeTwo&&s.componentCount>1) {
      insist(candidate.topology.kind==='disjointcycles'&&candidate.topology.cycleCount===s.componentCount,'Multi-loop certificate disagrees with closure');
      insist(Object.hasOwn(topologyByCycleCount,s.componentCount),'Unexpected more-than-four disjoint cycles');
      topologyOnlyCounterexamples.push(candidate.mask);topologyByCycleCount[s.componentCount].push(candidate.mask);
    }
  }
  solutions.sort((a,b)=>a-b);topologyOnlyCounterexamples.sort((a,b)=>a-b);for(const values of Object.values(topologyByCycleCount))values.sort((a,b)=>a-b);
  candidateCounts.solutionCount=solutions.length;candidateCounts.topologyOnlyCounterexampleCount=topologyOnlyCounterexamples.length;
  return {solutions,topologyOnlyCounterexamples,topologyByCycleCount,candidateCounts,
    sourceRules:{requiredTreeIds:c.trees.map(vertexId),forbiddenFlowerIds:c.flowers.map(vertexId),clues:[...c.clues],pipeStock:c.pipeStock},
    scope:'Exact filtering of fixed public GF(2) candidates only; no ordinary input, physical-ID, history, time or gameplay evidence.'};
}
