// Independently authored from the accepted Game46 PUBLIC documents only.
// No production imports, solver, search, stored packing, or future action sequence.
export const DOC_HASHES = Object.freeze({
  design: '7fc64fbcccab81d56cd1e7cea4f67b2dbbda21755b9a9c2a6c09a6285eedfbc4',
  contract: '89b1364f349966aab643dbd1f8f35b8c93471f5bac59a157dd4e5baa0d27771f',
  interface: 'b7bc48ea00027e066e55c75576950eb17d86393919ef6574f7138ae7eba60d3f'
});
const GAME = 'packing-sculptor', MAX = 2147483647, TIME = 86400;
const COUNTERS = ['calls','moves','pickups','placementsMade','rotations','removals','clears','blockedActions'];
const DIRS = ['none','up','down','left','right'];
const INITIAL_MESSAGE = '选择零件后装入箱内；为标记零件留出指定直线出口。';
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const integer = (value, low, high) => Number.isInteger(value) && value >= low && value <= high;
const copy = value => Array.isArray(value) ? value.map(copy) : object(value) ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k,copy(v)])) : value;
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function same(a,b) {
  if (Object.is(a,b)) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a); return keys.length === Object.keys(b).length && keys.every(k => own(b,k) && same(a[k],b[k]));
}
const piece = (id,name,nameZh,cells,vertices,width,height) => ({id,name,nameZh,cells,vertices,width,height});
export const PUBLIC_CONFIG = freeze({defaultSeed:746,attemptLimit:4,maxElapsed:TIME,maxCounter:MAX,pieces:[
  piece('rail','RAIL','长轨',[[0,0],[1,0],[2,0]],[[0,0],[3,0],[3,1],[0,1]],3,1),
  piece('elbow','ELBOW','弯角',[[0,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1],[2,2],[0,2]],2,2),
  piece('crate','CRATE','方块',[[0,0],[1,0],[0,1],[1,1]],[[0,0],[2,0],[2,2],[0,2]],2,2),
  piece('bar','BAR','短条',[[0,0],[1,0]],[[0,0],[2,0],[2,1],[0,1]],2,1),
  piece('tee','TEE','丁板',[[0,0],[1,0],[2,0],[1,1]],[[0,0],[3,0],[3,1],[2,1],[2,2],[1,2],[1,1],[0,1]],3,2),
  piece('zig','ZIG','折板',[[0,0],[1,0],[1,1],[2,1]],[[0,0],[2,0],[2,1],[3,1],[3,2],[1,2],[1,1],[0,1]],3,2)
],tasks:[
  {id:'side-hatch',name:'SIDE HATCH',nameZh:'侧门小箱',width:5,height:4,rows:['11110','11111','11111','01111'],pieceIds:['rail','elbow','crate','bar'],doors:[{id:'east',direction:'right',start:1,end:2}],requirements:[{pieceId:'rail',doorIds:['east']}]},
  {id:'two-way-crate',name:'TWO WAY CRATE',nameZh:'双向货箱',width:5,height:5,rows:['11111','11111','01111','01111','01110'],pieceIds:['rail','elbow','crate','bar','tee'],doors:[{id:'north',direction:'up',start:1,end:3},{id:'south',direction:'down',start:1,end:4}],requirements:[{pieceId:'elbow',doorIds:['north']},{pieceId:'rail',doorIds:['south']}]},
  {id:'opposite-dispatch',name:'OPPOSITE DISPATCH',nameZh:'对向出库',width:6,height:5,rows:['011110','111111','111111','111111','011110'],pieceIds:['rail','elbow','crate','bar','tee','zig'],doors:[{id:'east',direction:'right',start:1,end:3},{id:'west',direction:'left',start:3,end:4}],requirements:[{pieceId:'zig',doorIds:['east']},{pieceId:'rail',doorIds:['west']}]}
]});
const SHAPES = Object.fromEntries(PUBLIC_CONFIG.pieces.map(p => [p.id,p]));
const taskFor = state => PUBLIC_CONFIG.tasks[state.level];
const boxFor = task => copy({width:task.width,height:task.height,rows:task.rows,doors:task.doors,requirements:task.requirements});
const rowOrder = (a,b) => a[1]-b[1] || a[0]-b[0];
const inside = (task,[x,y]) => x>=0 && y>=0 && x<task.width && y<task.height && task.rows[y][x]==='1';
const sharesCell = (a,b) => a.some(([x,y]) => b.some(([u,v]) => x===u && y===v));
function polygon(id,pose) {
  if (pose === null) return {cells:[],vertices:[]};
  const s = SHAPES[id], q = pose.turn, w = s.width, h = s.height;
  const rotate = (x,y,cell) => {
    const rw=w-(cell?1:0), rh=h-(cell?1:0);
    const [u,v] = q===0 ? [x,y] : q===1 ? [rh-y,x] : q===2 ? [rw-x,rh-y] : [y,rw-x];
    return [u+pose.x,v+pose.y];
  };
  return {cells:s.cells.map(([x,y])=>rotate(x,y,true)).sort(rowOrder),vertices:s.vertices.map(([x,y])=>rotate(x,y,false))};
}
const cellRect = ([x,y]) => ({minX:x,minY:y,maxX:x+1,maxY:y+1});
const overlaps = (a,b) => Math.max(a.minX,b.minX)<Math.min(a.maxX,b.maxX) && Math.max(a.minY,b.minY)<Math.min(a.maxY,b.maxY);
function extraction(task,parts,requirement) {
  const current=parts.find(p=>p.id===requirement.pieceId);
  if (current.pose===null) return {pieceId:current.id,placed:false,options:[],canExit:false};
  const loX=Math.min(...current.cells.map(c=>c[0])), hiX=Math.max(...current.cells.map(c=>c[0]))+1;
  const loY=Math.min(...current.cells.map(c=>c[1])), hiY=Math.max(...current.cells.map(c=>c[1]))+1;
  const options=requirement.doorIds.map(doorId=>{
    const door=task.doors.find(d=>d.id===doorId), direction=door.direction;
    const horizontal=direction==='left'||direction==='right';
    const distance=direction==='right'?task.width-loX:direction==='left'?hiX:direction==='down'?task.height-loY:hiY;
    const doorFits=door.start<=(horizontal?loY:loX) && (horizontal?hiY:hiX)<=door.end;
    const sweptRects=current.cells.map(c=>{
      const r=cellRect(c); if(direction==='right')r.maxX+=distance; if(direction==='left')r.minX-=distance;
      if(direction==='down')r.maxY+=distance; if(direction==='up')r.minY-=distance; return r;
    });
    const wallHits=[];
    for(let y=0;y<task.height;y++)for(let x=0;x<task.width;x++)if(task.rows[y][x]==='0' && sweptRects.some(r=>overlaps(r,cellRect([x,y]))))wallHits.push([x,y]);
    const blockerIds=parts.filter(p=>p.id!==current.id && p.cells.some(c=>sweptRects.some(r=>overlaps(r,cellRect(c))))).map(p=>p.id);
    const clear=doorFits && current.outsideCells.length===0 && wallHits.length===0 && blockerIds.length===0;
    return {doorId,direction,distance,doorFits,sweptRects,wallHits,blockerIds,clear};
  });
  return {pieceId:current.id,placed:true,options,canExit:options.some(o=>o.clear)};
}
function geometry(task,placements) {
  const pieces=task.pieceIds.map((id,i)=>{const p=polygon(id,placements[i]);return {id,pose:copy(placements[i]),...p,outsideCells:p.cells.filter(c=>!inside(task,c)),overlapIds:[]};});
  for(const p of pieces)p.overlapIds=pieces.filter(other=>other.id!==p.id && sharesCell(p.cells,other.cells)).map(other=>other.id);
  const missingIds=pieces.filter(p=>p.pose===null).map(p=>p.id), placedCount=pieces.length-missingIds.length;
  const allPlaced=missingIds.length===0,allInside=pieces.every(p=>p.outsideCells.length===0),noOverlap=pieces.every(p=>p.overlapIds.length===0);
  const validPacking=allPlaced&&allInside&&noOverlap,extractions=task.requirements.map(req=>extraction(task,pieces,req));
  return {pieces,placedCount,missingIds,allPlaced,allInside,noOverlap,validPacking,extractions,canShip:validPacking&&extractions.every(e=>e.canExit)};
}
const inventory = (task,placements) => Object.fromEntries(task.pieceIds.map((id,i)=>[id,placements[i]===null?1:0]));
function previewCheck(state) {
  if(state.mode==='rack')return null;
  const task=taskFor(state),id=task.pieceIds[state.rackIndex],p=polygon(id,state.preview);
  const outsideCells=p.cells.filter(c=>!inside(task,c));
  const blockerIds=task.pieceIds.filter((other,i)=>i!==state.rackIndex && sharesCell(p.cells,polygon(other,state.placements[i]).cells));
  return {id,pose:copy(state.preview),...p,outsideCells,blockerIds,valid:state.preview.x<task.width&&outsideCells.length===0&&blockerIds.length===0};
}
function refresh(state) { const task=taskFor(state);state.inventory=inventory(task,state.placements);state.geometry=geometry(task,state.placements); }
function initial(seed,level) {
  seed=integer(seed,0,4294967295)?seed:746;level=integer(level,0,2)?level:0;
  const task=PUBLIC_CONFIG.tasks[level],placements=task.pieceIds.map(()=>null);
  return {schema:1,seed,level,phase:'playing',reason:'',score:0,mode:'rack',rackIndex:0,preview:null,pieceIds:copy(task.pieceIds),container:boxFor(task),placements,
    inventory:inventory(task,placements),geometry:geometry(task,placements),previewCheck:null,elapsed:0,elapsedCapped:false,failures:0,submissions:[],terminalReceipt:null,
    calls:0,moves:0,pickups:0,placementsMade:0,rotations:0,removals:0,clears:0,blockedActions:0,counterSaturated:false,inputArmed:false,cancelEpoch:null,cancelledLast:false,
    lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:INITIAL_MESSAGE};
}
function message(state,event) {
  const task=taskFor(state), name=SHAPES[event.pieceId]?.nameZh;
  switch(event.type){
    case 'rack':return `已选择${event.to===task.pieceIds.length?'验收':SHAPES[task.pieceIds[event.to]].nameZh}。`;
    case 'pick':return `正在摆放${name}：A 落定，B 旋转；右侧 BACK 可取消。`;
    case 'move':return event.to.x===task.width?'已到 BACK 栏；A 取消预览，原摆放保持不变。':`锚点 (${event.to.x},${event.to.y})，朝向 ${event.to.turn}。`;
    case 'rotate':return `已将${name}旋转到朝向 ${event.to.turn}；锚点保持不变。`;
    case 'place':return `已放入${name}，锚点 (${event.to.x},${event.to.y})，朝向 ${event.to.turn}。`;
    case 'remove':return `已取回${name}。`;
    case 'cancel':return '已取消预览，原摆放保持不变。';
    case 'clear':return `已取回 ${event.removed} 件零件；错误记录保留。`;
    case 'blocked':return {boundary:'已到选择边界。',empty:'该零件尚未放入箱体。',outside:'零件越过箱壁，不能落定。',overlap:'零件相互重叠，不能落定。'}[event.reason];
    case 'reject':return `装箱或抽出通道未通过，剩余 ${4-state.failures} 次错误额度。`;
    case 'win':return '全部零件已装箱，指定抽出通道畅通。';
    case 'collision':return '四次错误验收，本次装箱结束。';
    default:throw new Error('Unknown public event.');
  }
}
const LIMITS=[
  'Public-rule arithmetic only; no implementation, pilot, private witness, future-board search or solved configuration.',
  'Exact integer polygon cells and full continuous swept rectangles determine truth; no geometric epsilon or approximate sample.',
  'Complete pairs derive expected after from that actual before only, never from a prior predicted state.',
  'Sparse endpoints and receipt arithmetic do not establish hidden calls, dt, inputs, physical releases, gate transitions or lifecycle continuity.',
  'Every sparse gap remains unobserved; any no-reset interval diagnostics are explicitly conditional, never reconstructed calls.',
  'A same-identity retry may be invisible inside a sparse gap; observed resets require separate segments.',
  'JSON cannot establish object identity, immutable references, Proxy/getter behavior, runtime isolation, rendered pixels or hardware performance.',
  'The entire original JSON value is retained once; metadata references identify its original paths without replacing raw rows or aliases.',
  'Source authenticity, exactly-once projection mapping, clock conversion and exact frame/state pairing require separate provenance review.',
  'Finding details are capped at 2000 records, with exact total/omitted counts; truncation never changes a failing verdict and retained input is complete.'
];
function report(mode) {return {auditorVersion:1,game:GAME,mode,ok:true,acceptedPublicDocHashes:copy(DOC_HASHES),counts:{endpoints:0,fullPairs:0,sparseIntervals:0,declaredBoundaryGaps:0},findingCount:0,omittedFindings:0,findings:[],provenanceReview:[],limits:copy(LIMITS)};}
function finding(r,path,rule,actual,expected) {
  r.ok=false;r.findingCount++;
  if(r.findings.length>=2000){r.omittedFindings++;return;}
  const brief=v=>Array.isArray(v)?{type:'array',length:v.length}:object(v)?{type:'object',keys:Object.keys(v)}:typeof v==='string'&&v.length>240?{type:'string',length:v.length,prefix:v.slice(0,240)}:v===undefined?{type:'missing'}:v;
  r.findings.push({path,rule,actual:brief(actual),expected:brief(expected)});
}
function requireThat(r,condition,path,rule) {if(!condition)finding(r,path,rule,false,true);return !!condition;}
function expect(r,actual,expected,path) {
  if(same(actual,expected))return;
  if(Array.isArray(actual)&&Array.isArray(expected)){
    if(actual.length!==expected.length)finding(r,path+'.length','Exact array length',actual.length,expected.length);
    for(let i=0;i<Math.min(actual.length,expected.length);i++)expect(r,actual[i],expected[i],`${path}/${i}`);return;
  }
  if(object(actual)&&object(expected)){
    for(const key of new Set([...Object.keys(actual),...Object.keys(expected)])){
      if(!own(actual,key)||!own(expected,key))finding(r,`${path}/${key}`,'Exact own-field set',actual[key],expected[key]);
      else expect(r,actual[key],expected[key],`${path}/${key}`);
    }return;
  }
  finding(r,path,'Exact public value',actual,expected);
}
function keys(r,value,names,path) {if(!requireThat(r,object(value),path,'Object required'))return false;expect(r,Object.keys(value).sort(),[...names].sort(),path+'/@keys');return true;}
function guard(r,path,action) {try{return action();}catch(error){finding(r,path,'Malformed or unauditable public data',String(error?.message||error),'Valid public JSON schema');return null;}}
function poseOK(r,pose,task,path,preview=false,nullable=false) {
  if(nullable&&pose===null)return true;
  if(!keys(r,pose,['x','y','turn'],path))return false;
  return requireThat(r,integer(pose.x,0,task.width-(preview?0:1))&&integer(pose.y,0,task.height-1)&&integer(pose.turn,0,3),path,'Bounded integer anchor and quarter turn');
}
function placementsOK(r,poses,task,path) {
  if(!requireThat(r,Array.isArray(poses)&&poses.length===task.pieceIds.length,path,'One pose/null for each task piece'))return false;
  return poses.map((p,i)=>poseOK(r,p,task,`${path}/${i}`,false,true)).every(Boolean);
}
const STATE_KEYS=['schema','seed','level','phase','reason','score','mode','rackIndex','preview','pieceIds','container','placements','inventory','geometry','previewCheck','elapsed','elapsedCapped','failures','submissions','terminalReceipt',...COUNTERS,'counterSaturated','inputArmed','cancelEpoch','cancelledLast','lastHeld','lastCommand','events','message'];
function receiptCheck(r,state,task,path) {
  if(!requireThat(r,Array.isArray(state.submissions)&&state.submissions.length<=4,path+'/submissions','Bounded complete submission receipts'))return;
  let failures=0,previousCall=0,previousElapsed=0;
  for(let i=0;i<state.submissions.length;i++){
    const receipt=state.submissions[i],p=`${path}/submissions/${i}`;
    if(!keys(r,receipt,['index','call','elapsed','placements','inventory','geometry','matched','failuresBefore','failuresAfter','remaining','phase','reason'],p))continue;
    requireThat(r,integer(receipt.call,1,state.calls)&&(receipt.call>previousCall||previousCall===MAX),p+'/call','Ordered actual receipt call, allowing saturation equality only');
    requireThat(r,typeof receipt.elapsed==='number'&&Number.isFinite(receipt.elapsed)&&receipt.elapsed>0&&receipt.elapsed>=previousElapsed&&receipt.elapsed<=state.elapsed&&receipt.elapsed<=Math.min(TIME,receipt.call*0.25),p+'/elapsed','Ordered positive receipt elapsed within its exact admitted-call upper bound');
    previousCall=receipt.call;previousElapsed=receipt.elapsed;
    if(!placementsOK(r,receipt.placements,task,p+'/placements'))continue;
    const g=geometry(task,receipt.placements),inv=inventory(task,receipt.placements),before=failures;
    requireThat(r,g.allInside&&g.noOverlap,p+'/placements','A reachable submission contains only legally committed poses');
    requireThat(r,g.placedCount<=state.placementsMade,p+'/placements','Historical physical inventory requires prior placement commands');
    if(!g.canShip)failures++;
    const phase=g.canShip?'won':failures===4?'lost':'playing',reason=phase==='lost'?'attempts':'';
    expect(r,receipt,{index:i,call:receipt.call,elapsed:receipt.elapsed,placements:receipt.placements,inventory:inv,geometry:g,matched:g.canShip,failuresBefore:before,failuresAfter:failures,remaining:4-failures,phase,reason},p);
    requireThat(r,!g.canShip||i===state.submissions.length-1&&state.phase==='won',p,'Matched receipt only last in a won round');
    if(i<state.submissions.length-1)requireThat(r,phase==='playing',p+'/phase','Earlier receipt must leave play active');
  }
  expect(r,state.failures,failures,path+'/failures');
  const last=state.submissions.at(-1);
  if(state.phase==='playing'){
    expect(r,state.terminalReceipt,null,path+'/terminalReceipt');requireThat(r,failures<4&&(!last||last.phase==='playing'),path+'/submissions','Playing receipt history');
  }else{
    if(!requireThat(r,!!last,path+'/terminalReceipt','Terminal requires an actual final submission'))return;
    const terminal={cause:state.phase==='won'?'success':'attempts',call:last.call,elapsed:last.elapsed,placements:copy(last.placements),inventory:copy(last.inventory),geometry:copy(last.geometry),matched:last.matched,failures,remaining:4-failures,score:state.phase==='won'?100:0,phase:state.phase,reason:state.reason};
    expect(r,state.terminalReceipt,terminal,path+'/terminalReceipt');
    for(const key of ['placements','inventory','geometry','elapsed'])expect(r,state[key],last[key],path+'/'+key);
    expect(r,state.calls,last.call,path+'/calls');expect(r,state.phase,last.phase,path+'/phase');expect(r,state.mode,'rack',path+'/mode');expect(r,state.rackIndex,task.pieceIds.length,path+'/rackIndex');
  }
  if(last && state.calls<MAX && last.call===state.calls){
    for(const key of ['placements','inventory','geometry','elapsed'])expect(r,state[key],last[key],path+'/'+key);
    requireThat(r,state.lastCommand==='a'&&state.mode==='rack'&&state.rackIndex===task.pieceIds.length,path,'Latest unsaturated call is the retained submission');
  }
}
function eventCheck(r,state,task,path) {
  if(!requireThat(r,Array.isArray(state.events)&&state.events.length<=1,path+'/events','At most one current-call event'))return;
  const event=state.events[0],p=path+'/events/0',N=task.pieceIds.length,id=task.pieceIds[state.rackIndex];
  if(state.phase!=='playing'){
    expect(r,state.events,[state.phase==='won'?{type:'win',call:state.calls}:{type:'collision',reason:'attempts',call:state.calls}],path+'/events');
    expect(r,state.lastCommand,'a',path+'/lastCommand');
  }
  requireThat(r,(state.lastCommand==='none')===(state.events.length===0),path+'/lastCommand','Every chosen command emits exactly one event');
  if(!event)return;
  if(!requireThat(r,object(event),p,'Event object'))return;
  requireThat(r,state.inputArmed&&!state.cancelledLast&&state.calls>0,p,'Command requires armed noncancelled input');
  expect(r,event.call,state.calls,p+'/call');
  if(state.lastCommand==='a'||state.lastCommand==='b')expect(r,state.lastHeld[state.lastCommand],true,path+'/lastHeld/'+state.lastCommand);
  else expect(r,state.lastHeld.direction,state.lastCommand,path+'/lastHeld/direction');
  let expected=null,counter=null;
  const rack=()=>requireThat(r,state.mode==='rack',p,'Rack command endpoint');
  const placing=()=>requireThat(r,state.mode==='place'&&state.rackIndex<N,p,'Place command endpoint');
  const action=command=>expect(r,state.lastCommand,command,path+'/lastCommand');
  switch(event.type){
    case 'rack':{
      rack();counter='moves';const delta=state.lastCommand==='up'||state.lastCommand==='left'?-1:1;
      requireThat(r,DIRS.slice(1).includes(state.lastCommand)&&integer(event.from,0,N)&&event.from+delta===state.rackIndex,p,'One bounded rack move');
      expected={type:'rack',from:event.from,to:state.rackIndex,call:state.calls};break;
    }
    case 'pick':placing();action('a');counter='pickups';expect(r,state.preview,state.placements[state.rackIndex]??{x:0,y:0,turn:0},path+'/preview');expected={type:'pick',pieceId:id,pose:copy(state.preview),wasPlaced:state.placements[state.rackIndex]!==null,call:state.calls};break;
    case 'move':case 'rotate':{
      placing();counter=event.type==='move'?'moves':'rotations';
      if(poseOK(r,event.from,task,p+'/from',true)){
        const next=copy(event.from);
        if(event.type==='rotate'){action('b');next.turn=(next.turn+1)%4;}
        else{requireThat(r,DIRS.slice(1).includes(state.lastCommand),p,'Directional preview move');next.x+=(state.lastCommand==='right'?1:state.lastCommand==='left'?-1:0);next.y+=(state.lastCommand==='down'?1:state.lastCommand==='up'?-1:0);}
        expect(r,state.preview,next,path+'/preview');
      }
      expected=event.type==='move'?{type:'move',from:event.from,to:copy(state.preview),call:state.calls}:{type:'rotate',pieceId:id,from:event.from,to:copy(state.preview),call:state.calls};break;
    }
    case 'place':{
      rack();action('a');counter='placementsMade';requireThat(r,state.rackIndex<N&&state.placements[state.rackIndex]!==null,p,'Committed selected piece');
      if(poseOK(r,event.from,task,p+'/from',false,true)){const before=copy(state.placements);before[state.rackIndex]=event.from;const g=geometry(task,before);requireThat(r,g.allInside&&g.noOverlap,p+'/from','Prior selected pose was legal against unchanged other pieces');}
      expected={type:'place',pieceId:id,from:event.from,to:copy(state.placements[state.rackIndex]),call:state.calls};break;
    }
    case 'remove':{
      rack();action('b');counter='removals';requireThat(r,state.rackIndex<N&&state.placements[state.rackIndex]===null,p,'Selected physical piece returned to rack');
      if(poseOK(r,event.pose,task,p+'/pose')){const old=copy(state.placements);old[state.rackIndex]=event.pose;const g=geometry(task,old);requireThat(r,g.allInside&&g.noOverlap,p+'/pose','Removed pose was legal against unchanged other pieces');}
      expected={type:'remove',pieceId:id,pose:event.pose,call:state.calls};break;
    }
    case 'cancel':rack();action('a');requireThat(r,state.rackIndex<N&&state.pickups>0,p,'Cancel returns from a picked preview');expected={type:'cancel',pieceId:id,call:state.calls};break;
    case 'clear':rack();action('b');counter='clears';requireThat(r,state.rackIndex===N&&state.geometry.placedCount===0&&integer(event.removed,0,N)&&event.removed<=state.placementsMade,p,'Clear removes a possible prior physical inventory');expected={type:'clear',removed:event.removed,call:state.calls};break;
    case 'blocked':{
      counter='blockedActions';const reason=event.reason;
      if(reason==='boundary'){
        const d=state.lastCommand;requireThat(r,DIRS.slice(1).includes(d),p,'Boundary blocked direction');
        const edge=state.mode==='rack'?((d==='up'||d==='left')?state.rackIndex===0:state.rackIndex===N):(d==='left'?state.preview.x===0:d==='right'?state.preview.x===task.width:d==='up'?state.preview.y===0:state.preview.y===task.height-1);
        requireThat(r,edge,p,'Actual corresponding navigation boundary');expected={type:'blocked',reason,call:state.calls};
      }else if(reason==='empty'){rack();action('b');requireThat(r,state.rackIndex<N&&state.placements[state.rackIndex]===null,p,'Empty rack slot');expected={type:'blocked',reason,pieceId:id,call:state.calls};}
      else{placing();action('a');requireThat(r,state.preview.x<task.width&&!state.previewCheck.valid,p,'Invalid non-BACK preview');expect(r,reason,state.previewCheck.outsideCells.length?'outside':'overlap',p+'/reason');expected={type:'blocked',reason,pieceId:id,call:state.calls};}
      break;
    }
    case 'reject':{
      rack();action('a');requireThat(r,state.rackIndex===N&&state.phase==='playing'&&!state.geometry.canShip&&state.failures>0,p,'Rejected current submission');
      const last=state.submissions.at(-1);requireThat(r,!!last&&last.call===state.calls&&last.elapsed===state.elapsed&&same(last.placements,state.placements)&&same(last.geometry,state.geometry),p,'Reject retains its actual current submission receipt');
      expected={type:'reject',placedCount:state.geometry.placedCount,clearRequired:state.geometry.extractions.filter(e=>e.canExit).length,call:state.calls};break;
    }
    case 'win':rack();action('a');expect(r,state.phase,'won',path+'/phase');expected={type:'win',call:state.calls};break;
    case 'collision':rack();action('a');expect(r,state.phase,'lost',path+'/phase');expected={type:'collision',reason:'attempts',call:state.calls};break;
    default:finding(r,p+'/type','Known public event',event.type,'Specified event type');
  }
  if(counter)requireThat(r,state[counter]>0,p,'Current event has its cumulative counter');
  if(expected){expect(r,event,expected,p);expect(r,state.message,message(state,expected),path+'/message');}
  if(state.phase!=='playing')expect(r,event,state.phase==='won'?{type:'win',call:state.calls}:{type:'collision',reason:'attempts',call:state.calls},p);
}
function endpoint(r,state,path) {
  r.counts.endpoints++;
  if(!keys(r,state,STATE_KEYS,path)||!requireThat(r,integer(state.level,0,2)&&integer(state.seed,0,4294967295),path,'Public seed/level domain'))return;
  const task=taskFor(state),N=task.pieceIds.length;
  expect(r,state.schema,1,path+'/schema');expect(r,state.pieceIds,task.pieceIds,path+'/pieceIds');expect(r,state.container,boxFor(task),path+'/container');
  requireThat(r,['playing','won','lost'].includes(state.phase),path+'/phase','Public phase');expect(r,state.reason,state.phase==='lost'?'attempts':'',path+'/reason');expect(r,state.score,state.phase==='won'?100:0,path+'/score');
  requireThat(r,['rack','place'].includes(state.mode)&&integer(state.rackIndex,0,N),path,'Bounded rack/mode');
  requireThat(r,state.moves>=state.rackIndex,path+'/moves','Reaching the current rack index requires at least that many direction moves');
  for(const key of COUNTERS)requireThat(r,integer(state[key],0,MAX),path+'/'+key,'Saturating nonnegative counter');
  for(const key of ['elapsedCapped','counterSaturated','inputArmed','cancelledLast'])requireThat(r,typeof state[key]==='boolean',path+'/'+key,'Boolean flag');
  requireThat(r,typeof state.elapsed==='number'&&Number.isFinite(state.elapsed)&&state.elapsed>=0&&state.elapsed<=TIME,path+'/elapsed','Bounded finite elapsed');
  requireThat(r,state.calls===0?state.elapsed===0:state.elapsed>0&&state.elapsed<=Math.min(TIME,state.calls*0.25),path+'/elapsed','Positive admitted dt and exact global quarter-second-per-call upper bound');
  requireThat(r,!state.elapsedCapped||state.elapsed===TIME,path+'/elapsedCapped','Sticky elapsed cap implies cap value');
  requireThat(r,!state.counterSaturated||COUNTERS.some(k=>state[k]===MAX),path+'/counterSaturated','Overflow requires a counter at its cap');
  requireThat(r,state.cancelEpoch===null||Number.isSafeInteger(state.cancelEpoch)&&state.cancelEpoch>=0,path+'/cancelEpoch','Optional safe epoch');
  requireThat(r,!state.cancelledLast||!state.inputArmed,path+'/inputArmed','Cancelled sample cannot leave gate armed');
  if(keys(r,state.lastHeld,['a','b','direction'],path+'/lastHeld'))requireThat(r,typeof state.lastHeld.a==='boolean'&&typeof state.lastHeld.b==='boolean'&&DIRS.includes(state.lastHeld.direction),path+'/lastHeld','Normalized held sample');
  requireThat(r,[...DIRS,'a','b'].includes(state.lastCommand),path+'/lastCommand','Public command');requireThat(r,typeof state.message==='string'&&state.message.length<=160,path+'/message','Bounded visible message');
  requireThat(r,integer(state.failures,0,4),path+'/failures','Bounded rejections');
  if(!placementsOK(r,state.placements,task,path+'/placements'))return;
  const g=geometry(task,state.placements);expect(r,state.geometry,g,path+'/geometry');expect(r,state.inventory,inventory(task,state.placements),path+'/inventory');
  requireThat(r,g.allInside&&g.noOverlap,path+'/placements','Actual placements were legally committed');
  if(state.mode==='rack'){expect(r,state.preview,null,path+'/preview');expect(r,state.previewCheck,null,path+'/previewCheck');}
  else if(requireThat(r,state.rackIndex<N,path+'/rackIndex','Place mode selects a physical piece')&&poseOK(r,state.preview,task,path+'/preview',true)){expect(r,state.previewCheck,previewCheck(state),path+'/previewCheck');requireThat(r,state.pickups>0,path+'/pickups','Preview requires a pickup');}
  for(const key of COUNTERS.slice(1))requireThat(r,state[key]<=state.calls,path+'/'+key,'At most one increment per admitted call');
  requireThat(r,state.placementsMade<=state.pickups&&state.removals<=state.placementsMade&&g.placedCount<=state.placementsMade,path,'Physical placement/pickup/removal count constraints');
  if(state.placementsMade<MAX)requireThat(r,g.placedCount+state.removals<=state.placementsMade,path,'Physical pieces remaining plus individually removed pieces require distinct placements');
  if(state.pickups<MAX)requireThat(r,state.placementsMade+(state.mode==='place'?1:0)<=state.pickups,path,'Current preview needs an unconsumed pickup');
  if(state.calls<MAX&&Array.isArray(state.submissions))requireThat(r,COUNTERS.slice(1).reduce((n,k)=>n+state[k],state.submissions.length)<=state.calls,path,'Counted command categories and submissions require distinct admitted calls');
  receiptCheck(r,state,task,path);eventCheck(r,state,task,path);
  if(state.calls===0)expect(r,state,initial(state.seed,state.level),path);
}
export function auditEndpoint(state) {const r=report('endpoint');r.retainedInput=state;guard(r,'/retainedInput',()=>endpoint(r,state,'/retainedInput'));return r;}

// One actual before/after pair only. This is not exported as a gameplay API.
function normalize(input) {
  let values=Object.create(null);
  try{
    if(input!==null&&typeof input==='object'&&!Array.isArray(input))for(const key of ['x','y','a','b','cancelEpoch','cancelled','paused']){
      const descriptor=Object.getOwnPropertyDescriptor(input,key);if(descriptor&&own(descriptor,'value'))values[key]=descriptor.value;
    }
  }catch{values=Object.create(null);}
  const axis=value=>typeof value==='number'&&Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;
  const x=axis(values.x),y=axis(values.y),ax=Math.abs(x),ay=Math.abs(y);
  const direction=ax<=0.5&&ay<=0.5?'none':ay>=ax?(y>0?'down':'up'):(x>0?'right':'left');
  return {a:values.a===true,b:values.b===true,direction,paused:values.paused===true,cancelled:values.cancelled===true,epoch:Number.isSafeInteger(values.cancelEpoch)&&values.cancelEpoch>=0?values.cancelEpoch:null};
}
function increment(state,key){if(state[key]===MAX)state.counterSaturated=true;else state[key]++;}
function expectedAfter(before,dt,input) {
  const s=copy(before);
  if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>0.25)return s;
  const sample=normalize(input);if(sample.paused)return s;
  const armed=s.inputArmed,held=copy(s.lastHeld);
  const disarm=(sample.epoch!==null&&s.cancelEpoch!==null&&sample.epoch!==s.cancelEpoch)||(sample.cancelled&&!s.cancelledLast);
  s.events=[];s.lastCommand='none';increment(s,'calls');const elapsed=s.elapsed+dt;if(elapsed>TIME)s.elapsedCapped=true;s.elapsed=Math.min(TIME,elapsed);
  if(disarm)s.inputArmed=false;if(sample.epoch!==null)s.cancelEpoch=sample.epoch;s.cancelledLast=sample.cancelled;
  let command='none';
  if(!disarm&&!sample.cancelled&&armed)command=sample.b&&!held.b?'b':sample.a&&!held.a?'a':sample.direction!=='none'&&sample.direction!==held.direction?sample.direction:'none';
  if(!disarm&&!sample.cancelled&&!sample.a&&!sample.b&&sample.direction==='none')s.inputArmed=true;
  if(command!=='none')applyCommand(s,command);
  s.lastHeld={a:sample.a,b:sample.b,direction:sample.direction};return s;
}
function applyCommand(s,command) {
  const task=taskFor(s),N=task.pieceIds.length,id=task.pieceIds[s.rackIndex],call=s.calls;
  s.lastCommand=command;
  const emit=event=>{s.events=[event];s.message=message(s,event);};
  const blocked=(reason,pieceId)=>{increment(s,'blockedActions');emit(pieceId===undefined?{type:'blocked',reason,call}:{type:'blocked',reason,pieceId,call});};
  if(DIRS.slice(1).includes(command)){
    if(s.mode==='rack'){
      const from=s.rackIndex,to=from+(command==='up'||command==='left'?-1:1);
      if(to<0||to>N)blocked('boundary');else{increment(s,'moves');s.rackIndex=to;emit({type:'rack',from,to,call});}
    }else{
      const from=copy(s.preview),to=copy(from);to.x+=command==='right'?1:command==='left'?-1:0;to.y+=command==='down'?1:command==='up'?-1:0;
      if(to.x<0||to.x>task.width||to.y<0||to.y>=task.height)blocked('boundary');else{increment(s,'moves');s.preview=to;s.previewCheck=previewCheck(s);emit({type:'move',from,to:copy(to),call});}
    }return;
  }
  if(s.mode==='place'){
    if(command==='b'){const from=copy(s.preview);s.preview.turn=(s.preview.turn+1)%4;increment(s,'rotations');s.previewCheck=previewCheck(s);emit({type:'rotate',pieceId:id,from,to:copy(s.preview),call});}
    else if(s.preview.x===task.width){s.mode='rack';s.preview=null;s.previewCheck=null;emit({type:'cancel',pieceId:id,call});}
    else{
      s.previewCheck=previewCheck(s);
      if(!s.previewCheck.valid)blocked(s.previewCheck.outsideCells.length?'outside':'overlap',id);
      else{const from=copy(s.placements[s.rackIndex]),to=copy(s.preview);s.placements[s.rackIndex]=to;increment(s,'placementsMade');s.mode='rack';s.preview=null;s.previewCheck=null;refresh(s);emit({type:'place',pieceId:id,from,to:copy(to),call});}
    }return;
  }
  if(s.rackIndex<N){
    if(command==='a'){const wasPlaced=s.placements[s.rackIndex]!==null;s.mode='place';s.preview=copy(s.placements[s.rackIndex]??{x:0,y:0,turn:0});increment(s,'pickups');s.previewCheck=previewCheck(s);emit({type:'pick',pieceId:id,pose:copy(s.preview),wasPlaced,call});}
    else if(s.placements[s.rackIndex]===null)blocked('empty',id);
    else{const pose=copy(s.placements[s.rackIndex]);s.placements[s.rackIndex]=null;increment(s,'removals');refresh(s);emit({type:'remove',pieceId:id,pose,call});}
    return;
  }
  if(command==='b'){const removed=s.placements.filter(p=>p!==null).length;s.placements=s.placements.map(()=>null);increment(s,'clears');refresh(s);emit({type:'clear',removed,call});return;}
  refresh(s);const before=s.failures,matched=s.geometry.canShip;
  if(matched){s.phase='won';s.reason='';s.score=100;}else{s.failures++;if(s.failures===4){s.phase='lost';s.reason='attempts';s.score=0;}}
  const receipt={index:s.submissions.length,call,elapsed:s.elapsed,placements:copy(s.placements),inventory:copy(s.inventory),geometry:copy(s.geometry),matched,failuresBefore:before,failuresAfter:s.failures,remaining:4-s.failures,phase:s.phase,reason:s.reason};
  s.submissions.push(receipt);
  if(s.phase!=='playing')s.terminalReceipt={cause:matched?'success':'attempts',call,elapsed:s.elapsed,placements:copy(s.placements),inventory:copy(s.inventory),geometry:copy(s.geometry),matched,failures:s.failures,remaining:4-s.failures,score:s.score,phase:s.phase,reason:s.reason};
  emit(matched?{type:'win',call}:s.phase==='lost'?{type:'collision',reason:'attempts',call}:{type:'reject',placedCount:s.geometry.placedCount,clearRequired:s.geometry.extractions.filter(e=>e.canExit).length,call});
}

// The public wrapper requires actual UTC but does not prescribe ISO versus RFC
// spelling. Parseability is checked here; authenticity/UTC attribution is review.
const timestamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
function required(r,value,names,path){if(!requireThat(r,object(value),path,'Public wrapper object'))return false;let complete=true;for(const name of names)if(!requireThat(r,own(value,name),path+'/'+name,'Required original field'))complete=false;return complete;}
function provenance(r,hashes,path){requireThat(r,object(hashes)&&Object.keys(hashes).length>0,path,'Retained source hash map');}
function timeMetadata(r,row,path,previous) {
  requireThat(r,timestamp(row.observedAt),path+'/observedAt','Actual UTC observation timestamp');
  if(previous&&timestamp(row.observedAt)&&timestamp(previous.observedAt)&&Date.parse(row.observedAt)<Date.parse(previous.observedAt))r.provenanceReview.push({path:path+'/observedAt',status:'review-required',reason:'Actual UTC wall clock moved backward; preserve values and review clock adjustment, never substitute model time.'});
  if(own(row,'observedMonotonicSeconds')){
    requireThat(r,typeof row.observedMonotonicSeconds==='number'&&Number.isFinite(row.observedMonotonicSeconds),path+'/observedMonotonicSeconds','Finite actual monotonic observation time');
    if(previous&&own(previous,'observedMonotonicSeconds'))requireThat(r,row.observedMonotonicSeconds>=previous.observedMonotonicSeconds,path+'/observedMonotonicSeconds','Monotonic observation chronology');
  }
}
export function auditFullRun(run) {
  const r=report('complete-actual-pairs');r.retainedInput=run;r.pairs=[];
  guard(r,'/retainedInput',()=>{
    if(!required(r,run,['schema','kind','runId','channel','sourceHashes','origin','calls','end'],'/retainedInput'))return;
    expect(r,run.schema,1,'/retainedInput/schema');expect(r,run.kind,GAME+'-ordinary-run','/retainedInput/kind');expect(r,run.channel,'model','/retainedInput/channel');requireThat(r,typeof run.runId==='string'&&run.runId.length>0,'/retainedInput/runId','Recorded run identity');provenance(r,run.sourceHashes,'/retainedInput/sourceHashes');
    const origin=run.origin;
    if(!required(r,origin,['kind','seed','level','state','publicConfig','completeCallCapture','inputRepresentation','sourceHashes','publicDocHashes','observedAt','clock'],'/retainedInput/origin'))return;
    expect(r,origin.kind,'create','/retainedInput/origin/kind');expect(r,origin.completeCallCapture,true,'/retainedInput/origin/completeCallCapture');expect(r,origin.publicConfig,PUBLIC_CONFIG,'/retainedInput/origin/publicConfig');expect(r,origin.state,initial(origin.seed,origin.level),'/retainedInput/origin/state');expect(r,origin.sourceHashes,run.sourceHashes,'/retainedInput/origin/sourceHashes');
    requireThat(r,typeof origin.inputRepresentation==='string'&&origin.inputRepresentation.length>0,'/retainedInput/origin/inputRepresentation','Original JSON input representation declared');requireThat(r,typeof origin.clock==='string'&&origin.clock.length>0||object(origin.clock),'/retainedInput/origin/clock','Explicit actual monotonic clock description');
    for(const [key,digest] of Object.entries(DOC_HASHES))expect(r,origin.publicDocHashes?.['docs/'+({design:'public-design',contract:'model-contract',interface:'public-interface'}[key])+'.md'],digest,'/retainedInput/origin/publicDocHashes/'+key);
    timeMetadata(r,origin,'/retainedInput/origin',null);guard(r,'/retainedInput/origin/state',()=>endpoint(r,origin.state,'/retainedInput/origin/state'));
    if(!requireThat(r,Array.isArray(run.calls),'/retainedInput/calls','Complete actual invocation array'))return;
    let previous=origin.state,previousTime=origin;
    run.calls.forEach((call,i)=>guard(r,`/retainedInput/calls/${i}`,()=>{
      const p=`/retainedInput/calls/${i}`;
      if(!required(r,call,['kind','seq','dt','input','before','after','observedAt','error'],p))return;
      expect(r,call.kind,'call',p+'/kind');expect(r,call.seq,i+1,p+'/seq');expect(r,call.error,null,p+'/error');timeMetadata(r,call,p,previousTime);
      expect(r,call.before,previous,p+'/before');guard(r,p+'/before',()=>endpoint(r,call.before,p+'/before'));guard(r,p+'/after',()=>endpoint(r,call.after,p+'/after'));
      guard(r,p+'/after',()=>expect(r,call.after,expectedAfter(call.before,call.dt,call.input),p+'/after'));
      r.counts.fullPairs++;r.pairs.push({seq:call.seq,sourceCallIndex:i,beforeRef:p+'/before',afterRef:p+'/after',dtRef:p+'/dt',inputRef:p+'/input',basis:'actual-before-only'});
      previous=call.after;previousTime=call;
    }));
    const end=run.end;
    if(required(r,end,['kind','observedAt','outcome','reason','calls','complete','final','failure'],'/retainedInput/end')){
      expect(r,end.kind,'end','/retainedInput/end/kind');expect(r,end.complete,true,'/retainedInput/end/complete');expect(r,end.failure,null,'/retainedInput/end/failure');expect(r,end.calls,run.calls.length,'/retainedInput/end/calls');expect(r,end.final,previous,'/retainedInput/end/final');expect(r,end.outcome,end.final?.phase,'/retainedInput/end/outcome');expect(r,end.reason,end.final?.reason,'/retainedInput/end/reason');timeMetadata(r,end,'/retainedInput/end',previousTime);guard(r,'/retainedInput/end/final',()=>endpoint(r,end.final,'/retainedInput/end/final'));
    }
  });return r;
}

function interval(r,segmentId,before,after,fromRef,toRef) {
  const a=before?.snapshot?.model,b=after?.snapshot?.model;
  const result={segmentId,fromSourceIndex:before?.sourceObservationIndex??null,toSourceIndex:after?.sourceObservationIndex??null,fromRef,toRef,observedReadWindows:[copy(before?.readWindow??null),copy(after?.readWindow??null)],continuity:'not-observed',inputAndGateTransitions:'review-required',conditionalNoResetDiagnostics:[]};
  if(!a||!b)return result;
  for(const key of ['seed','level'])requireThat(r,a[key]===b[key],toRef+'/snapshot/model/'+key,'Observed identity change requires explicit segment boundary');
  for(const key of [...COUNTERS,'elapsed','failures'])requireThat(r,b[key]>=a[key],toRef+'/snapshot/model/'+key,'Observed counter/time decrease requires explicit segment boundary');
  const diagnostics=result.conditionalNoResetDiagnostics;
  const condition=(name,holds)=>diagnostics.push({condition:name,holds,basis:'Only if no unobserved retry/replacement occurred; not a transition verdict'});
  if(a.calls<MAX&&b.calls<MAX){
    const delta=b.calls-a.calls;condition('Nonnegative admitted-call delta',delta>=0);
    if(delta===0)condition('Unchanged calls imply unchanged state for one continuous unsaturated instance',same(a,b));
    condition('Each action counter grows at most once per admitted call',COUNTERS.slice(1).every(k=>b[k]-a[k]<=delta));
  }
  condition('Existing receipt prefix persists within a continuous instance',Array.isArray(a.submissions)&&Array.isArray(b.submissions)&&a.submissions.every((receipt,i)=>same(receipt,b.submissions[i])));
  condition('A terminal continuous instance is immutable',a.phase==='playing'||same(a,b));
  return result;
}
export function auditSparseSegments(corpus) {
  const r=report('sparse-endpoints');r.retainedInput=corpus;r.segments=[];r.gaps=[];r.boundaryReview=[];
  guard(r,'/retainedInput',()=>{
    if(!requireThat(r,object(corpus),'/retainedInput','Public corpus object'))return;
    expect(r,corpus.schema,1,'/retainedInput/schema');provenance(r,corpus.sourceHashes,'/retainedInput/sourceHashes');
    const projected=Array.isArray(corpus.segments),segments=projected?corpus.segments:[corpus];
    if(!requireThat(r,segments.length>0,'/retainedInput/segments','At least one retained observation segment'))return;
    expect(r,corpus.kind,GAME+(projected?'-public-browser-segments':'-public-observations'),'/retainedInput/kind');
    const ids=new Set();
    segments.forEach((segment,index)=>guard(r,`/retainedInput/segments/${index}`,()=>{
      const ref=projected?`/retainedInput/segments/${index}`:'/retainedInput',id=segment.segmentId??segment.runId??null;
      requireThat(r,typeof id==='string'&&id.length>0&&!ids.has(id),ref+'/segmentId','Distinct retained segment identity');ids.add(id);
      if(!requireThat(r,Array.isArray(segment.observations)&&segment.observations.length>0,ref+'/observations','Nonempty original observation slice'))return;
      requireThat(r,Array.isArray(segment.inputs),ref+'/inputs','Original input metadata retained');
      if(projected)required(r,segment.parentContext,['clock','source','originalParent'],ref+'/parentContext');
      else{expect(r,segment.channel,'browser',ref+'/channel');expect(r,segment.calls,[],ref+'/calls');}
      const summary={segmentId:id,retainedRef:ref,originKind:segment.originKind??null,observations:segment.observations.length,endpoints:0,modelIdentity:null,continuity:'not-observed',lifecycle:'review-required'};r.segments.push(summary);
      let previous=null,previousRef=null,lastModel=null;
      segment.observations.forEach((observation,i)=>{
        const p=`${ref}/observations/${i}`;
        guard(r,p,()=>{
        if(!required(r,observation,['seq','sourceObservationIndex','label','observedAt','readWindow','snapshot'],p))return;
        requireThat(r,Number.isSafeInteger(observation.seq)&&observation.seq>=0&&Number.isSafeInteger(observation.sourceObservationIndex)&&observation.sourceObservationIndex>=0,p,'Original safe observation indices');requireThat(r,typeof observation.label==='string',p+'/label','Retained observation label');timeMetadata(r,observation,p,previous);
        if(required(r,observation.readWindow,['start','end'],p+'/readWindow'))requireThat(r,typeof observation.readWindow.start==='number'&&typeof observation.readWindow.end==='number'&&Number.isFinite(observation.readWindow.start)&&Number.isFinite(observation.readWindow.end)&&observation.readWindow.start<=observation.readWindow.end,p+'/readWindow','Finite ordered window in the original declared clock');
        if(required(r,observation.snapshot,['id','phase','paused','tick','elapsed','level','best','model','renderer','frameTimesMs','connection'],p+'/snapshot')){
          expect(r,observation.snapshot.id,GAME,p+'/snapshot/id');
          if(observation.snapshot.model!==null){
            const s=observation.snapshot.model;guard(r,p+'/snapshot/model',()=>endpoint(r,s,p+'/snapshot/model'));summary.endpoints++;
            const identity={seed:s?.seed??null,level:s?.level??null};if(summary.modelIdentity===null)summary.modelIdentity=identity;else expect(r,identity,summary.modelIdentity,p+'/snapshot/model/identity');
            if(own(segment,'seed'))expect(r,s?.seed,segment.seed,p+'/snapshot/model/seed');if(own(segment,'level'))expect(r,s?.level,segment.level,p+'/snapshot/model/level');
            if(object(s)){
              if(lastModel)for(const key of [...COUNTERS,'elapsed','failures'])requireThat(r,s[key]>=lastModel[key],p+'/snapshot/model/'+key,'Observed model counter/time decrease across any intervening null rows requires a segment boundary');
              lastModel=s;
            }
          }
        }
        if(previousRef!==null)requireThat(r,observation.seq>previous?.seq&&observation.sourceObservationIndex>previous?.sourceObservationIndex,p,'Strictly increasing original indices within segment');
        });
        if(previousRef!==null){const gap=guard(r,p,()=>interval(r,id,previous,observation,previousRef,p));r.gaps.push(gap??{segmentId:id,fromRef:previousRef,toRef:p,continuity:'not-observed',inputAndGateTransitions:'review-required',malformedMetadata:true});r.counts.sparseIntervals++;}
        previous=observation;previousRef=p;
      });
    }));
    const boundaries=corpus.boundaryGaps??[];requireThat(r,Array.isArray(boundaries),'/retainedInput/boundaryGaps','Original boundary array');
    if(projected)requireThat(r,boundaries.length===Math.max(0,segments.length-1),'/retainedInput/boundaryGaps','One declared gap between adjacent segments');
    boundaries.forEach((boundary,i)=>{
      const p=`/retainedInput/boundaryGaps/${i}`;
      requireThat(r,object(boundary)&&boundary.intervalContinuity==='not-observed'&&boundary.lifecycle==='review-required',p,'No inferred continuity across segment boundary');
      if(segments[i]&&segments[i+1]){expect(r,boundary.fromSegmentId,segments[i].segmentId??segments[i].runId,p+'/fromSegmentId');expect(r,boundary.toSegmentId,segments[i+1].segmentId??segments[i+1].runId,p+'/toSegmentId');}
      r.boundaryReview.push({retainedRef:p,continuity:'not-observed',lifecycle:'review-required'});r.counts.declaredBoundaryGaps++;
    });
    requireThat(r,r.counts.endpoints>0,'/retainedInput','Sparse audit requires at least one actual model endpoint; null-menu rows alone are retained but insufficient');
  });return r;
}
