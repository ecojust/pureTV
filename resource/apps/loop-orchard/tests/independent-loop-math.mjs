import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Fixed public mathematical geometry only. Importing performs no enumeration, tests or file reads.
const insist = (value, message) => { if (!value) throw new Error(message); };
const popcount = value => { let n=0; for(let bits=value;bits;bits&=bits-1)n++; return n; };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a,b) => JSON.stringify(a)===JSON.stringify(b);

export function geometry() {
  const nodes=Array.from({length:16},(_,id)=>({id,x:id%4,y:Math.floor(id/4)})),edges=[];
  for(let y=0;y<4;y++)for(let x=0;x<3;x++)edges.push({id:edges.length,a:4*y+x,b:4*y+x+1,axis:'h',x,y});
  for(let y=0;y<3;y++)for(let x=0;x<4;x++)edges.push({id:edges.length,a:4*y+x,b:4*(y+1)+x,axis:'v',x,y});
  const byPair=new Map(edges.map(e=>[[e.a,e.b].join(','),e.id])),faces=[];
  for(let y=0;y<3;y++)for(let x=0;x<3;x++) {
    const a=4*y+x,b=a+1,d=a+4,c=d+1,vertexIds=[a,b,c,d];
    const edgeIds=vertexIds.map((v,i)=>byPair.get([v,vertexIds[(i+1)%4]].sort((a,b)=>a-b).join(',')));
    faces.push({id:faces.length,x,y,vertexIds,edgeIds,mask:edgeIds.reduce((m,id)=>m^(1<<id),0)});
  }
  return {nodes,edges,faces,vertexCount:16,edgeCount:24,faceCount:9,cycleRank:24-16+1,allEdgesMask:(1<<24)-1};
}

function validMask(mask) {
  insist(typeof mask==='number'&&Number.isSafeInteger(mask)&&mask>=0&&mask<2**24,'Mask must be an unsigned 24-bit integer');
  return mask;
}

export function maskFromEndpoints(pairs) {
  insist(Array.isArray(pairs),'Endpoint pairs must be an array');
  const g=geometry(),index=new Map(g.edges.map(e=>[[e.a,e.b].join(','),e.id]));let mask=0;
  for(const pair of pairs) {
    insist(Array.isArray(pair)&&pair.length===2&&pair.every(v=>Number.isInteger(v)&&v>=0&&v<16),'Expected two existing row-major vertex IDs');
    const id=index.get([...pair].sort((a,b)=>a-b).join(','));
    insist(id!==undefined,'Selected endpoints are not a unit grid edge');
    insist(!(mask&(1<<id)),'Duplicate undirected edge');mask|=1<<id;
  }
  return mask;
}

/** Counts use actual endpoint coordinates and square sides, not a cached edge-to-face relation. */
export function boundaryCounts(mask) {
  validMask(mask);const g=geometry(),counts=Array(9).fill(0);
  for(const e of g.edges)if(mask&(1<<e.id)) {
    const a=g.nodes[e.a],b=g.nodes[e.b];
    for(let y=0;y<3;y++)for(let x=0;x<3;x++) {
      const horizontal=a.y===b.y&&Math.min(a.x,b.x)===x&&Math.max(a.x,b.x)===x+1&&(a.y===y||a.y===y+1);
      const vertical=a.x===b.x&&Math.min(a.y,b.y)===y&&Math.max(a.y,b.y)===y+1&&(a.x===x||a.x===x+1);
      if(horizontal||vertical)counts[3*y+x]++;
    }
  }
  return counts;
}

/** Full-edge ordered walk certificate, not a degree-plus-connected-components acceptance test. */
export function classifyMask(mask) {
  validMask(mask);const g=geometry(),selected=g.edges.filter(e=>mask&(1<<e.id)),incident=Array.from({length:16},()=>[]);
  for(const e of selected){incident[e.a].push(e);incident[e.b].push(e);}
  const degrees=incident.map(a=>a.length),usedVertexIds=g.nodes.filter(n=>incident[n.id].length).map(n=>n.id);
  const oddVertexIds=usedVertexIds.filter(id=>degrees[id]%2),branchVertexIds=usedVertexIds.filter(id=>degrees[id]===4);
  const base={edgeCount:selected.length,usedVertexIds,degrees,oddVertexIds,branchVertexIds};
  if(mask===0)return {...base,kind:'empty',cycles:[],cycleCount:0,isSingleCycle:false};
  if(branchVertexIds.length)return {...base,kind:'degree4branch',cycles:[],cycleCount:null,isSingleCycle:false};
  if(oddVertexIds.length)return {...base,kind:'openchain',cycles:[],cycleCount:null,isSingleCycle:false};
  // Every remaining used vertex has exactly two incident selected edges. Walk one direction,
  // consume each actual edge, and require return only to that walk's start without a repeated vertex.
  const unwalked=new Set(selected.map(e=>e.id)),cycles=[];
  while(unwalked.size) {
    const start=Math.min(...g.edges.filter(e=>unwalked.has(e.id)).flatMap(e=>[e.a,e.b]));
    const vertexIds=[],edgeIds=[],visited=new Set();let current=start,previousEdge=null,closed=false;
    for(let guard=0;guard<16;guard++) {
      insist(!visited.has(current),'Ordered cycle walk repeated an intermediate vertex');visited.add(current);vertexIds.push(current);
      const options=incident[current].filter(e=>e.id!==previousEdge).sort((a,b)=>((a.a===current?a.b:a.a)-(b.a===current?b.b:b.a)));
      insist(options.length===(previousEdge===null?2:1),'Ordered cycle continuation is not unique');
      const edge=options[0];insist(unwalked.has(edge.id),'Ordered walk reused an already consumed edge');
      unwalked.delete(edge.id);edgeIds.push(edge.id);const next=edge.a===current?edge.b:edge.a;
      if(next===start){closed=true;break;}previousEdge=edge.id;current=next;
    }
    insist(closed&&edgeIds.length===vertexIds.length&&edgeIds.length>=4&&edgeIds.length%2===0,'Invalid grid-cycle certificate');
    cycles.push({vertexIds,edgeIds,mask:edgeIds.reduce((m,id)=>m|(1<<id),0)});
  }
  insist(cycles.reduce((m,c)=>m|c.mask,0)===mask,'Ordered cycle walks did not consume every selected edge');
  const single=cycles.length===1;
  return {...base,kind:single?'singlecycle':'disjointcycles',cycles,cycleCount:cycles.length,isSingleCycle:single};
}

function binaryRank(vectors) {
  const pivots=Array(24).fill(0);
  for(const original of vectors){let v=original;for(let bit=23;bit>=0;bit--)if(v&(1<<bit)){if(pivots[bit])v^=pivots[bit];else{pivots[bit]=v;break;}}}
  return {rank:pivots.filter(Boolean).length,pivotBits:pivots.flatMap((v,i)=>v?[i]:[])};
}

export function enumerateCycleSpace() {
  const g=geometry(),basisMasks=g.faces.map(f=>f.mask),rank=binaryRank(basisMasks),entries=[],seen=new Set();
  // Prove the whole fixed grid is connected independently of selected-mask classification.
  const reached=new Set([0]);for(let pass=0;pass<15;pass++)for(const e of g.edges)if(reached.has(e.a)||reached.has(e.b)){reached.add(e.a);reached.add(e.b);}
  insist(reached.size===16&&rank.rank===g.edgeCount-g.vertexCount+1&&rank.rank===9,'Plaquettes do not span the connected grid cycle space');
  const histogram={empty:0,singlecycle:0,disjointcycles:0,degree4branch:0,openchain:0};
  for(let selector=0;selector<1<<g.faceCount;selector++) {
    let mask=0;for(let f=0;f<g.faceCount;f++)if(selector&(1<<f))mask^=basisMasks[f];
    insist(!seen.has(mask),'Two plaquette subsets produced the same edge mask');seen.add(mask);
    if(selector) {
      const first=g.faces.find(f=>selector&(1<<f.id)),top=g.edges.find(e=>e.axis==='h'&&e.x===first.x&&e.y===first.y);
      insist(mask&(1<<top.id),'Topmost selected face lost its uncancellable upper edge');
    }
    const classification=classifyMask(mask),clues=boundaryCounts(mask);
    insist(classification.oddVertexIds.length===0,'A plaquette XOR has an odd boundary vertex');
    const outside=g.edges.filter(e=>mask&(1<<e.id)).filter(e=>e.axis==='h'?(e.y===0||e.y===3):(e.x===0||e.x===3)).length;
    const inside=popcount(mask)-outside;
    insist(clues.reduce((a,b)=>a+b,0)===2*inside+outside,'Independent face-boundary incidence invariant failed');
    histogram[classification.kind]++;entries.push({selector,mask,classification,clues});
  }
  const singles=entries.filter(e=>e.classification.isSingleCycle),singleByClue=new Map();
  for(const e of singles){const key=e.clues.join(',');if(!singleByClue.has(key))singleByClue.set(key,[]);singleByClue.get(key).push(e.mask);}
  const disjointClueConflicts={};
  for(const n of [2,3,4]) {
    const group=entries.filter(e=>e.classification.kind==='disjointcycles'&&e.classification.cycleCount===n),witnesses=[],matchedSingles=new Set();
    let pairCount=0;
    for(const e of group){const matches=singleByClue.get(e.clues.join(','))??[];if(matches.length){pairCount+=matches.length;matches.forEach(mask=>matchedSingles.add(mask));witnesses.push({disjointMask:e.mask,cycleMasks:e.classification.cycles.map(c=>c.mask),clues:e.clues,singleMasks:[...matches]});}}
    disjointClueConflicts[n]={cycleCount:n,layoutCount:group.length,uniqueClueVectors:new Set(group.map(e=>e.clues.join(','))).size,
      layoutsSharingAllNineCluesWithSingleCycle:witnesses.length,matchingSingleCycleCount:matchedSingles.size,matchingPairCount:pairCount,collisionWitnesses:witnesses,
      cases:group.map(e=>({mask:e.mask,cycleMasks:e.classification.cycles.map(c=>c.mask),clues:e.clues}))};
  }
  insist(entries.filter(e=>e.classification.kind==='disjointcycles').every(e=>[2,3,4].includes(e.classification.cycleCount)),'Unreported disjoint-cycle multiplicity');
  return {basisMasks,...rank,entries,summary:{vertices:g.vertexCount,edges:g.edgeCount,connectedComponents:1,cycleSpaceDimension:g.cycleRank,
    faceSubsetsEnumerated:entries.length,uniqueMasks:seen.size,histogram,singleCycles:singles.length,singleCycleClueVectors:singleByClue.size,
    singleCyclePairsSharingAllClues:[...singleByClue.values()].reduce((n,a)=>n+a.length*(a.length-1)/2,0),
    topmostFaceIndependenceWitnesses:entries.length-1,boundaryIncidenceChecks:entries.length},disjointClueConflicts};
}

export function runSyntheticFixtures(enumeration) {
  const checks=[],g=geometry();let assertions=0,rejections=0;
  const assert=(v,m)=>{assertions++;insist(v,m);},group=(name,body)=>{const details=body();checks.push({name,passed:true,...details});};
  group('fixed-grid-rank-and-complete-even-subgraph-space',()=>{
    assert(g.nodes.length===16&&g.edges.length===24&&g.faces.length===9,'Wrong fixed grid dimensions');
    assert(enumeration.rank===9&&enumeration.entries.length===512&&enumeration.summary.uniqueMasks===512,'Cycle space incomplete');
    assert(enumeration.entries.every(e=>e.classification.oddVertexIds.length===0),'Enumeration contains odd valence');
    return {method:'Nine unit-face boundaries XORed over GF(2); numeric rank plus topmost selected-face witness; dimension E-V+1=9.',actualHistogram:enumeration.summary.histogram};
  });
  group('shared-edge-belongs-to-both-faces',()=>{
    const mask=maskFromEndpoints([[5,6]]),clues=boundaryCounts(mask);
    assert(same(clues,[0,1,0,0,1,0,0,0,0]),'Shared internal edge did not count once in each adjoining face');
    assert(boundaryCounts(maskFromEndpoints([[0,1]])).reduce((a,b)=>a+b,0)===1,'Outer edge counted in a missing exterior face');
    return {internalEdge:[5,6],clues};
  });
  group('corner-and-opposite-boundary-sides-each-count-two',()=>{
    const corner=boundaryCounts(maskFromEndpoints([[5,6],[5,9]])),opposite=boundaryCounts(maskFromEndpoints([[5,6],[9,10]]));
    assert(corner[4]===2&&opposite[4]===2,'Region count confused corner/parallel sides with vertices or path connectivity');
    assert(corner.reduce((a,b)=>a+b,0)===4&&opposite.reduce((a,b)=>a+b,0)===4,'Internal boundary incidence differs');
    return {cornerClues:corner,oppositeSidesClues:opposite,scope:'These are selected boundary-segment counting fixtures, not claimed connected pipes through a cell interior.'};
  });
  group('no-row-wrap-invalid-mask-or-duplicate-undirected-edge',()=>{
    const reject=(label,fn)=>{let failed=false;try{fn();}catch{failed=true;}assert(failed,'Invalid geometry accepted: '+label);rejections++;};
    for(const mask of [-1,2**24,1.5,NaN,Infinity,'1',1n])reject(String(mask),()=>classifyMask(mask));
    for(const pairs of [[[3,4]],[[0,5]],[[0,0]],[[0,16]],[[0,1],[1,0]]])reject(JSON.stringify(pairs),()=>maskFromEndpoints(pairs));
    assert(maskFromEndpoints([[0,1]])===maskFromEndpoints([[1,0]]),'Undirected endpoint orientation changed edge identity');
    return {rejectedInputs:12};
  });
  group('empty-open-chain-and-odd-junction-are-not-cycles',()=>{
    const empty=classifyMask(0),path=classifyMask(maskFromEndpoints([[0,1],[1,2]])),junction=classifyMask(maskFromEndpoints([[1,5],[4,5],[5,6]]));
    assert(empty.kind==='empty'&&empty.cycleCount===0&&!empty.isSingleCycle,'Empty board became a loop');
    assert(path.kind==='openchain'&&same(path.oddVertexIds,[0,2])&&!path.isSingleCycle,'Open path accepted');
    assert(junction.kind==='openchain'&&junction.oddVertexIds.includes(5)&&junction.degrees[5]===3,'Odd three-way junction accepted');
    return {emptyKind:empty.kind,pathOddVertices:path.oddVertexIds,junctionOddVertices:junction.oddVertexIds};
  });
  group('simple-square-versus-shared-node-figure-eight',()=>{
    const square=classifyMask(g.faces[0].mask),figure=classifyMask(g.faces[0].mask^g.faces[4].mask);
    assert(square.kind==='singlecycle'&&square.edgeCount===4&&same(square.cycles[0].vertexIds,[0,1,5,4]),'Ordered unit-square certificate differs');
    assert(same(boundaryCounts(g.faces[0].mask),[4,1,0,1,0,0,0,0,0]),'Unit-square face count differs');
    assert(figure.kind==='degree4branch'&&same(figure.branchVertexIds,[5])&&!figure.isSingleCycle,'Shared-node two-loop branch mislabeled as disjoint or single');
    return {square: square.cycles[0],figureEightBranchVertices:figure.branchVertexIds};
  });
  group('adjacent-plaquettes-cancel-shared-edge-to-one-rectangle',()=>{
    const mask=g.faces[0].mask^g.faces[1].mask,result=classifyMask(mask),shared=maskFromEndpoints([[1,5]]);
    assert(!(mask&shared)&&result.kind==='singlecycle'&&result.edgeCount===6,'Shared plaquette side failed to cancel');
    assert(same(boundaryCounts(mask),[3,3,1,1,1,0,0,0,0]),'Six-edge rectangle counts differ');
    return {mask,orderedCycle:result.cycles[0]};
  });
  group('two-three-four-disjoint-loops-and-complete-clue-comparison',()=>{
    const corners=[0,2,6,8];
    for(const n of [2,3,4]){
      const mask=corners.slice(0,n).reduce((m,id)=>m^g.faces[id].mask,0),result=classifyMask(mask);
      assert(result.kind==='disjointcycles'&&result.cycleCount===n&&!result.isSingleCycle,'Separate corner loops were accepted as one');
      assert(new Set(result.cycles.flatMap(c=>c.vertexIds)).size===4*n,'Disjoint fixture reused a vertex');
      const complete=enumeration.disjointClueConflicts[n];assert(complete.layoutCount>0&&complete.cases.length===complete.layoutCount,'Disjoint-cycle class omitted from complete comparison');
    }
    const nwse=classifyMask(g.faces[0].mask^g.faces[8].mask);assert(nwse.kind==='disjointcycles'&&nwse.cycleCount===2,'NW+SE independent squares differ');
    return {scope:'All 2/3/4-loop even masks are compared against every enumerated single cycle using the entire nine-count vector. No author board, inventory, trees, forbidden nodes or ordinary-input reachability is assumed.',
      comparisons:Object.fromEntries([2,3,4].map(n=>{const r=enumeration.disjointClueConflicts[n];return[n,{layouts:r.layoutCount,layoutsSharingAllClues:r.layoutsSharingAllNineCluesWithSingleCycle,matchingPairs:r.matchingPairCount}];}))};
  });
  return {passed:true,checks,assertions,rejectedInputs:rejections};
}

function cli(argv) {
  insist(argv.length===2&&argv[0]==='--output'&&argv[1],'Usage: oracle.mjs --output report.json');
  const script=fileURLToPath(import.meta.url),output=resolve(argv[1]),before=sha(readFileSync(script)),startedAt=new Date().toISOString();
  const enumeration=enumerateCycleSpace(),fixtures=runSyntheticFixtures(enumeration),after=sha(readFileSync(script));
  insist(before===after,'Mathematical reviewer changed during execution');
  const certificate=enumeration.entries.map(e=>({selector:e.selector,mask:e.mask,kind:e.classification.kind,cycleCount:e.classification.cycleCount,clues:e.clues}));
  const report={schema:1,game:'loop-orchard',passed:fixtures.passed,startedAt,finishedAt:new Date().toISOString(),
    scope:'Fixed synthetic 4x4 grid geometry and its full GF(2) cycle space only. No production Model, QA pilot, authored layout, selected game clues, inventory, tree/forbidden assignments or reference route is read or executed. This is not normal gameplay, browser, recording, APK or hardware evidence.',
    completeness:'The grid is connected with V=16 and E=24, so its binary cycle space has dimension E-V+1=9. Nine unit-face boundaries are independent: in any nonempty chosen-face subset, an upper edge of a face in the topmost chosen row cannot cancel against a chosen face above it. Numeric GF(2) rank and all 512 distinct XOR masks confirm that these faces span every even selected-edge subgraph.',
    geometry:geometry(),summary:enumeration.summary,basisMasks:enumeration.basisMasks,pivotBits:enumeration.pivotBits,
    disjointClueConflicts:enumeration.disjointClueConflicts,checks:fixtures.checks,assertions:fixtures.assertions,rejectedInputs:fixtures.rejectedInputs,
    enumerationCertificate:certificate,enumerationCertificateSha256:sha(JSON.stringify(certificate)),
    sourceHashesAtStart:{script:before},sourceHashesAtEnd:{script:after},sourceUnchanged:true,
    productionModelImported:false,qaPilotImported:false,authoredLayoutsRead:false,browserUsed:false,normalWinsClaimed:0,physicalTvTested:false,physicalPhoneTested:false};
  mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,summary:report.summary,
    disjointClueConflicts:Object.fromEntries([2,3,4].map(n=>{const r=report.disjointClueConflicts[n];return[n,{layouts:r.layoutCount,layoutsSharingAllClues:r.layoutsSharingAllNineCluesWithSingleCycle,matchingPairs:r.matchingPairCount}];})),
    scriptSha256:before,reportSha256:sha(readFileSync(output))}));
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))cli(process.argv.slice(2));
