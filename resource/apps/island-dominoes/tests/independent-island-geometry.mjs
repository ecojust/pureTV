#!/usr/bin/env node
// Exact abstract geometry. No game/model/authoring data is imported or read.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const requireThat=(ok,message)=>{if(!ok)throw Error(message);};
const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const r=a%b;a=b;b=r;}return a;}
function point(p){
  requireThat(p&&((typeof p.id==='string'&&p.id.length>0)||Number.isSafeInteger(p.id)),'Point ID must be a nonempty string or safe integer');
  requireThat(Number.isSafeInteger(p.x)&&Number.isSafeInteger(p.y),'Point coordinates must be safe integers');
  return{x:BigInt(p.x),y:BigInt(p.y)};
}
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const zero=v=>v.x===0n&&v.y===0n;
function ratio(n,d){requireThat(d!==0n,'Zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{numerator:(n/g).toString(),denominator:(d/g).toString()};}
function at(a,r,n,d){return{x:ratio(a.x*d+r.x*n,d),y:ratio(a.y*d+r.y*n,d)};}
function consistentIds(points){
  const seen=new Map();
  for(const p of points){const q=point(p);if(seen.has(p.id)){const old=seen.get(p.id);requireThat(old.x===q.x&&old.y===q.y,'Same island ID has conflicting coordinates');}else seen.set(p.id,q);}
}

export function squaredDistance(a,b){const r=sub(point(b),point(a));return r.x*r.x+r.y*r.y;}

// Solve p=a+t(b-a) exactly. The open interval excludes both endpoint IDs/positions.
export function pointOnOpenSegment(a,b,p){
  const av=point(a),r=sub(point(b),av),q=sub(point(p),av);
  if(zero(r)||cross(q,r)!==0n)return false;
  let numerator=r.x!==0n?q.x:q.y,denominator=r.x!==0n?r.x:r.y;
  if(denominator<0n){numerator=-numerator;denominator=-denominator;}
  return 0n<numerator&&numerator<denominator;
}

// A+t*r = C+u*s. Nonparallel intersections use determinant ratios t/u;
// collinear intersections use overlap of rational parameter intervals.
// Distinct IDs at the same coordinate are intentionally NOT a shared island.
export function segmentRelation(a,b,c,d){
  consistentIds([a,b,c,d]);
  const av=point(a),bv=point(b),cv=point(c),dv=point(d),r=sub(bv,av),s=sub(dv,cv),q=sub(cv,av);
  if(zero(r)||zero(s))return{allowed:false,kind:'zero-length'};
  let denominator=cross(r,s);
  if(denominator!==0n){
    let tn=cross(q,s),un=cross(q,r);
    if(denominator<0n){denominator=-denominator;tn=-tn;un=-un;}
    if(tn<0n||tn>denominator||un<0n||un>denominator)return{allowed:true,kind:'disjoint'};
    const t=ratio(tn,denominator),u=ratio(un,denominator),intersection=at(av,r,tn,denominator);
    const endpointA=tn===0n?a:tn===denominator?b:null,endpointB=un===0n?c:un===denominator?d:null;
    if(endpointA&&endpointB&&endpointA.id===endpointB.id)return{allowed:true,kind:'shared-endpoint',islandId:endpointA.id,intersection,t,u};
    return{allowed:false,kind:endpointA||endpointB?'nonshared-touch':'proper-crossing',intersection,t,u};
  }
  if(cross(q,r)!==0n)return{allowed:true,kind:'parallel-disjoint'};
  let first=r.x!==0n?cv.x-av.x:cv.y-av.y,second=r.x!==0n?dv.x-av.x:dv.y-av.y;
  denominator=r.x!==0n?r.x:r.y;
  if(denominator<0n){denominator=-denominator;first=-first;second=-second;}
  const start=first<second?first:second,end=first>second?first:second;
  const lo=start>0n?start:0n,hi=end<denominator?end:denominator;
  if(lo>hi)return{allowed:true,kind:'collinear-disjoint'};
  if(lo<hi)return{allowed:false,kind:'collinear-overlap',parameterInterval:{from:ratio(lo,denominator),to:ratio(hi,denominator)}};
  const intersection=at(av,r,lo,denominator),endpointA=lo===0n?a:lo===denominator?b:null;
  const endpointB=lo===first?c:lo===second?d:null;
  if(endpointA&&endpointB&&endpointA.id===endpointB.id)return{allowed:true,kind:'shared-endpoint',islandId:endpointA.id,intersection,t:ratio(lo,denominator)};
  return{allowed:false,kind:'nonshared-touch',intersection,t:ratio(lo,denominator)};
}

// Explicit normalized GRID-UNIT interface, independent of canvas coordinates:
// islands:[{id,x,y,color}], fromId, toId, length:positive safe integer,
// targetColor:string. Source color is deliberately unrestricted.
// Contract adapter: {id,x:island.gx,y:island.gy,color:island.color}.
// A caller composes occupied-pair/network checks after this local verdict.
export function validateBridgeGeometry({islands,fromId,toId,length,targetColor}){
  requireThat(Array.isArray(islands)&&islands.length>=2,'At least two islands required');
  requireThat(Number.isSafeInteger(length)&&length>0,'Bridge length must be a positive safe integer');
  requireThat(typeof targetColor==='string'&&targetColor.length>0,'Required target color must be a nonempty string');
  const byId=new Map(),positions=new Set();
  for(const p of islands){point(p);requireThat(!byId.has(p.id),'Duplicate island ID');const key=p.x+','+p.y;requireThat(!positions.has(key),'Duplicate island coordinates');byId.set(p.id,p);positions.add(key);}
  const a=byId.get(fromId),b=byId.get(toId);requireThat(a&&b,'Bridge endpoint is not an island');
  const actual=squaredDistance(a,b),expected=BigInt(length)**2n,reasons=[];
  if(actual===0n)reasons.push('zero-length');
  if(actual!==expected)reasons.push('length-mismatch');
  if(b.color!==targetColor)reasons.push('target-color');
  const throughIslandIds=islands.filter(p=>p.id!==fromId&&p.id!==toId&&pointOnOpenSegment(a,b,p)).map(p=>p.id);
  if(throughIslandIds.length)reasons.push('through-island');
  return{valid:reasons.length===0,reasons,fromId,toId,length,targetColor,actualLengthSquared:actual.toString(),requiredLengthSquared:expected.toString(),throughIslandIds};
}

export function runSyntheticFixtures(){
  const checks=[];let relationCalls=0,bridgeCalls=0,openSegmentCalls=0;
  const p=(id,x,y,color='blue')=>({id,x,y,color});
  const relation=(...points)=>{relationCalls++;return segmentRelation(...points);};
  const bridge=options=>{bridgeCalls++;return validateBridgeGeometry(options);};
  const on=(...points)=>{openSegmentCalls++;return pointOnOpenSegment(...points);};
  function check(name,fn){const details=fn();checks.push({name,passed:true,...details});}
  const cases=[
    ['proper diagonal crossing',[p('a',0,0),p('b',4,4),p('c',0,4),p('d',4,0)],false,'proper-crossing'],
    ['rational non-lattice crossing',[p('a',0,0),p('b',3,3),p('c',0,2),p('d',3,0)],false,'proper-crossing'],
    ['vertical horizontal crossing',[p('a',2,-3),p('b',2,4),p('c',-1,1),p('d',5,1)],false,'proper-crossing'],
    ['nonparallel disjoint beyond parameter interval',[p('a',0,0),p('b',1,0),p('c',2,-1),p('d',2,1)],true,'disjoint'],
    ['parallel disjoint',[p('a',0,0),p('b',4,0),p('c',0,1),p('d',4,1)],true,'parallel-disjoint'],
    ['collinear disjoint',[p('a',0,0),p('b',2,0),p('c',3,0),p('d',5,0)],true,'collinear-disjoint'],
    ['shared island endpoint with different directions',[p('a',0,0),p('hub',2,0),p('hub',2,0),p('d',2,3)],true,'shared-endpoint'],
    ['shared endpoint collinear opposite rays',[p('hub',0,0),p('b',3,0),p('hub',0,0),p('d',-2,0)],true,'shared-endpoint'],
    ['shared endpoint collinear same ray overlaps',[p('hub',0,0),p('b',3,0),p('hub',0,0),p('d',2,0)],false,'collinear-overlap'],
    ['same coordinates different endpoint IDs',[p('a',0,0),p('b',2,0),p('c',2,0),p('d',2,3)],false,'nonshared-touch'],
    ['nonshared collinear point contact',[p('a',0,0),p('b',2,0),p('c',2,0),p('d',5,0)],false,'nonshared-touch'],
    ['endpoint touches other segment interior',[p('a',0,0),p('b',4,0),p('c',2,0),p('d',2,3)],false,'nonshared-touch'],
    ['partial positive collinear overlap',[p('a',0,0),p('b',4,0),p('c',2,0),p('d',6,0)],false,'collinear-overlap'],
    ['complete collinear containment',[p('a',0,0),p('b',5,0),p('c',1,0),p('d',3,0)],false,'collinear-overlap'],
    ['same directed edge repeated',[p('a',0,0),p('b',3,4),p('a',0,0),p('b',3,4)],false,'collinear-overlap'],
    ['same endpoints reversed edge',[p('a',0,0),p('b',3,4),p('b',3,4),p('a',0,0)],false,'collinear-overlap'],
    ['vertical opposite rays at shared endpoint',[p('a',2,0),p('hub',2,3),p('hub',2,3),p('d',2,7)],true,'shared-endpoint'],
    ['zero-length segment',[p('a',0,0),p('a',0,0),p('c',1,0),p('d',2,0)],false,'zero-length']
  ];
  check('named segment cases retain legality and intersection kind under both endpoint reversals and pair exchange',()=>{
    for(const [name,[a,b,c,d],allowed,kind] of cases){
      for(const first of [[a,b],[b,a]])for(const second of [[c,d],[d,c]])for(const [left,right] of [[first,second],[second,first]]){
        const actual=relation(...left,...right);assert.equal(actual.allowed,allowed,name);assert.equal(actual.kind,kind,name);
      }
    }
    return{namedCases:cases.map(([name,,allowed,kind])=>({name,allowed,kind})),ordersPerCase:8,actualRelationCalls:cases.length*8};
  });
  check('non-lattice intersection retains reduced exact rational coordinates',()=>{
    const r=relation(p('a',0,0),p('b',3,3),p('c',0,2),p('d',3,0));
    assert.deepEqual(r.intersection,{x:{numerator:'6',denominator:'5'},y:{numerator:'6',denominator:'5'}});
    assert.deepEqual(r.t,{numerator:'2',denominator:'5'});assert.deepEqual(r.u,{numerator:'2',denominator:'5'});return{intersection:r.intersection};
  });
  check('large exact determinants do not depend on floating-point products',()=>{
    const n=9007199254740000,r=relation(p('a',-n,-n),p('b',n,n),p('c',-n,n),p('d',n,-n));
    assert.equal(r.kind,'proper-crossing');assert.deepEqual(r.intersection,{x:{numerator:'0',denominator:'1'},y:{numerator:'0',denominator:'1'}});
    assert.equal(squaredDistance(p('x',-n,0),p('y',n,0)),(2n*BigInt(n))**2n);return{coordinateMagnitude:n,bigIntArithmetic:true};
  });
  check('open-segment membership uses strict rational bounds and excludes endpoints or collinear extensions',()=>{
    const a=p('a',-3,-4),b=p('b',3,4);
    for(const [test,expected] of [[p('middle',0,0),true],[a,false],[b,false],[p('outside',6,8),false],[p('off',0,1),false]]){
      assert.equal(on(a,b,test),expected);assert.equal(on(b,a,test),expected);
    }
    return{actualPointQueries:10};
  });
  check('directed 3-4-5 bridge checks squared length and only target color',()=>{
    const islands=[p('a',0,0,'red'),p('b',3,4,'blue')];
    assert.equal(bridge({islands,fromId:'a',toId:'b',length:5,targetColor:'blue'}).valid,true);
    assert.deepEqual(bridge({islands,fromId:'b',toId:'a',length:5,targetColor:'blue'}).reasons,['target-color']);
    assert.equal(bridge({islands,fromId:'b',toId:'a',length:5,targetColor:'red'}).valid,true);
    assert.deepEqual(bridge({islands,fromId:'a',toId:'b',length:4,targetColor:'blue'}).reasons,['length-mismatch']);
    assert.ok(bridge({islands,fromId:'a',toId:'a',length:5,targetColor:'red'}).reasons.includes('zero-length'));
    return{sourceColorUnrestricted:true,directionChangesRequiredTarget:true};
  });
  check('a third island blocks a bridge only in its open segment',()=>{
    const a=p('a',0,0),b=p('b',6,8),middle=p('middle',3,4),outside=p('outside',9,12),off=p('off',3,5);
    const blocked=bridge({islands:[a,b,middle],fromId:'a',toId:'b',length:10,targetColor:'blue'});
    assert.deepEqual(blocked.reasons,['through-island']);assert.deepEqual(blocked.throughIslandIds,['middle']);
    assert.equal(bridge({islands:[a,b,outside,off],fromId:'a',toId:'b',length:10,targetColor:'blue'}).valid,true);
    return{strictInteriorBlocked:true,endpointsExcluded:true};
  });
  check('same coordinates with different IDs are rejected for island sets even though pair-contact classification remains explicit',()=>{
    assert.throws(()=>bridge({islands:[p('a',0,0),p('b',0,0)],fromId:'a',toId:'b',length:1,targetColor:'blue'}),/Duplicate island coordinates/);
    assert.throws(()=>bridge({islands:[p('a',0,0),p('a',1,0)],fromId:'a',toId:'a',length:1,targetColor:'blue'}),/Duplicate island ID/);
    assert.throws(()=>relation(p('same',0,0),p('b',2,0),p('same',1,0),p('d',1,3)),/conflicting coordinates/);
    return{invalidIdentityFixtures:3};
  });
  check('fractional coordinates or nonpositive/noninteger bridge lengths fail the exact integer domain',()=>{
    assert.throws(()=>on(p('a',0,0),p('b',2,0),p('fractional',.5,0)),/safe integers/);
    for(const length of [0,-1,1.5])assert.throws(()=>bridge({islands:[p('a',0,0),p('b',1,0)],fromId:'a',toId:'b',length,targetColor:'blue'}),/positive safe integer/);
    return{invalidNumericFixtures:4};
  });
  return{passed:true,checks,counts:{namedSegmentCases:cases.length,relationCalls,bridgeCalls,openSegmentCalls},
    scope:{syntheticGeometryOnly:true,productionModelImported:false,productionModelExecuted:false,authoredLayoutsRead:false,authoredRoutesRead:false,
      normalGameplayClaims:0,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false}};
}

async function main(){
  const args={};for(let i=2;i<process.argv.length;i+=2){assert.ok(['--output','--contract'].includes(process.argv[i]));assert.ok(process.argv[i+1]);args[process.argv[i].slice(2)]=process.argv[i+1];}
  const file=fileURLToPath(import.meta.url),digest=b=>createHash('sha256').update(b).digest('hex'),start=digest(await readFile(file));
  const contractStart=args.contract?digest(await readFile(args.contract)):null;
  const result=runSyntheticFixtures(),end=digest(await readFile(file));assert.equal(start,end);
  const contractEnd=args.contract?digest(await readFile(args.contract)):null;assert.equal(contractStart,contractEnd);
  const report={schema:1,kind:'independent-determinant-rational-geometry-review',...result,oracleSha256:start,oracleEndSha256:end,sourceUnchanged:true,
    contractSha256:contractStart,contractEndSha256:contractEnd,
    adapter:'Normalize public island gx/gy to oracle x/y in grid units; pass piece.length and piece.targetColor. Canvas x/y never determine bridge geometry. Occupied unordered pairs and network connectivity are separate caller checks.',
    method:'Exact BigInt determinant ratios for nonparallel segments and rational one-dimensional parameter intervals for collinear segments. Shared contact additionally requires the same endpoint ID. Bridge squared length, target-only color and third-island open-segment checks use explicit normalized input, not production helpers.'};
  const output=path.resolve(args.output||path.join(path.dirname(file),'report.json'));await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,counts:report.counts,output}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
