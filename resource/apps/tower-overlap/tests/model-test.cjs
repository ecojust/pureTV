'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const clone=v=>JSON.parse(JSON.stringify(v)),checks=[];const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<=e,a+' != '+b);
function test(name,fn){fn();checks.push(name);}
function step(s,dt=1/120,input={}){assert.equal(M.step(s,dt,input),s);return s;}
function fresh(level=0){const s=M.create(764,level);step(s);return s;}
function settle(s){for(let n=0;s.phase==='playing'&&s.mode==='dropping';n++){assert.ok(n<50);step(s);}}
function waitAt(s,target){for(let n=0;Math.abs(s.slab.x-target)>1.9;n++){assert.ok(n<3000);step(s);}return s.slab.x;}
function drop(s){step(s,1/120,{a:true});settle(s);}
function invariant(s){assert.equal(s.floorsBuilt,s.floors.length-1);assert.ok(s.floors.length<=s.goal+1);
 for(let i=1;i<s.floors.length;i++){const p=s.floors[i-1],f=s.floors[i];assert.ok(f.width>=16);assert.ok(f.x>=p.x-1e-8);assert.ok(f.x+f.width<=p.x+p.width+1e-8);}
 assert.ok(s.offcuts.length<=2);if(s.slab){assert.ok(s.slab.x>=-1e-8);assert.ok(s.slab.x+s.slab.width<=600+1e-8);assert.equal(s.slab.width,s.floors.at(-1).width);}
}
test('fixedthreeprofilesidentitynormalizationanddetachedfrozenconfiguration',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.width,l.speed,l.goal,l.profile]),[[220,145,6,'steady'],[200,170,8,'pulse'],[180,195,10,'swell']]);
 assert.equal(M.config.fieldWidth,600);assert.equal(M.config.minWidth,16);assert.equal(M.config.dropDuration,.3);
 for(const seed of [undefined,null,-1,NaN,Infinity,4294967296,'1',.5])assert.equal(M.create(seed,0).seed,764);
 for(const level of [undefined,null,-1,NaN,Infinity,3,'1',.5])assert.equal(M.create(0,level).level,0);
 const a=M.create(0,0),b=M.create(0,0);a.floors[0].x=99;assert.equal(b.floors[0].x,190);assert.equal(b.inputArmed,false);
 assert.throws(()=>M.config.layouts[0].speed=999,TypeError);
});
test('threeordinarywinsusetimedAfrompublicpositionswithalternatingspawnsandboundedfloors',()=>{
 for(let level=0;level<3;level++){
  const s=fresh(level);while(s.phase==='playing'){waitAt(s,s.floors.at(-1).x);const expected=s.floorsBuilt+1;drop(s);invariant(s);assert.equal(s.floorsBuilt,expected);
   if(s.phase==='playing')assert.equal(s.slab.direction,s.floorsBuilt%2?-1:1);}
  assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.floorsBuilt,M.config.layouts[level].goal);assert.equal(s.drops,s.goal);
  assert.equal(s.slab,null);assert.equal(s.mode,'settled');assert.equal(s.events[0].type,'win');assert.equal(s.terminalReceipt.cause,'success');
 }
});
test('ordinarypartialoverlaptrimsleftandrightcorrectlyandretainedwidthdrivesnextslab',()=>{
 for(const side of [-1,1]){const s=fresh(),p=clone(s.floors[0]);waitAt(s,p.x+side*45);const x=s.slab.x,w=s.slab.width;drop(s);
  const expectedX=Math.max(x,p.x),expectedRight=Math.min(x+w,p.x+p.width);near(s.floors[1].x,expectedX);near(s.floors[1].width,expectedRight-expectedX);
  assert.equal(s.lastLanding.accepted,true);assert.ok((side<0?s.lastLanding.leftTrim:s.lastLanding.rightTrim)>40);
  assert.equal(s.offcuts.length,1);assert.equal(s.offcuts[0].side,side);assert.equal(s.slab.width,s.floors[1].width);invariant(s);}
});
test('syntheticexactwidth16succeedswhilebelow16orzerooverlapfailsbeforefloorcount',()=>{
 for(const [offset,phase,reason]of [[84,'playing',''],[84+5e-11,'playing',''],[84.001,'lost','too-narrow'],[100,'lost','miss']]){
  const s=fresh();s.floors[0]={index:0,x:250,width:100};s.slab={x:250+offset,width:100,direction:1,velocity:145,cycle:0};
  drop(s);assert.equal(s.phase,phase);assert.equal(s.reason,reason);
  if(phase==='playing'){assert.equal(s.floorsBuilt,1);assert.equal(s.floors[1].width,16);assert.equal(s.slab.width,16);}
  else{assert.equal(s.floorsBuilt,0);assert.equal(s.slab,null);assert.equal(s.lastLanding.accepted,false);assert.equal(s.score,0);}
 }
});
test('ordinaryedgeplacementthenmissloseswithafrozenindependentterminalreceipt',()=>{
 const s=M.create(764,0);step(s,1/120);drop(s);assert.equal(s.phase,'playing');assert.ok(s.floors[1].width<40);
 // The next slab enters from the distant right edge and misses the narrow left top.
 step(s);drop(s);assert.equal(s.phase,'lost');assert.equal(s.reason,'miss');assert.equal(s.floorsBuilt,1);
 const before=clone(s);let reads=0;const raw=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('no');}});
 step(s,.1,raw);step(s,.1,{a:true});assert.equal(reads,0);assert.deepEqual(s,before);
 const width=s.floors[0].width;s.terminalReceipt.floors[0].width=0;assert.equal(s.floors[0].width,width);
});
test('Acommitsbeforemotionanddropcompletesatpoint3withleftoverdtmovingthenextslab',()=>{
 const s=fresh();waitAt(s,190);const x=s.slab.x;step(s,.1,{a:true});assert.equal(s.mode,'dropping');near(s.slab.x,x);near(s.dropElapsed,.1);assert.equal(s.slab.velocity,0);
 step(s,.1);assert.equal(s.floorsBuilt,0);near(s.dropElapsed,.2);step(s,.15);assert.equal(s.floorsBuilt,1);assert.equal(s.mode,'moving');
 const newWidth=s.floors.at(-1).width;near(s.slab.x,600-newWidth-145*.05);near(s.slab.cycle,.05);near(s.dropElapsed,0);
});
test('holdingAthroughlandingneverstartssecondslabandpressesduringdropareconsumed',()=>{
 const s=fresh();waitAt(s,190);step(s,.1,{a:true});step(s,.1,{a:true});step(s,.15,{a:true});assert.equal(s.drops,1);assert.equal(s.mode,'moving');
 for(let n=0;n<8;n++)step(s,.05,{a:true});assert.equal(s.drops,1);
 step(s,.01);waitAt(s,s.floors.at(-1).x);step(s,.05,{a:true});assert.equal(s.drops,2);step(s,.05);step(s,.05,{a:true});
 while(s.mode==='dropping'&&s.phase==='playing')step(s,.05,{a:true});assert.equal(s.drops,2);
});
test('profilemotionandreflectionsarepartitionindependentacrossmanycycles',()=>{
 for(let level=0;level<3;level++){
  const a=M.create(764,level),b=M.create(764,level);for(let i=0;i<80;i++)step(a,.25);for(let i=0;i<2000;i++)step(b,.01);
  near(a.slab.x,b.slab.x,2e-7);near(a.slab.cycle,b.slab.cycle,2e-8);near(a.slab.velocity,b.slab.velocity,1e-7);assert.equal(a.slab.direction,b.slab.direction);
  const l=M.config.layouts[level];assert.ok(Math.abs(a.slab.velocity)>=l.speed*.7-1e-8);assert.ok(Math.abs(a.slab.velocity)<=l.speed*1.3+1e-8);invariant(a);
 }
});
test('syntheticexactreflectionboundarieshavedeterministicdirectionsandtimestepremainspositive',()=>{
 const s=fresh();const limit=600-s.slab.width;s.slab.x=limit-14.5;s.slab.direction=1;step(s,.1);near(s.slab.x,limit);assert.equal(s.slab.direction,-1);
 s.slab.x=14.5;s.slab.direction=-1;step(s,.1);near(s.slab.x,0);assert.equal(s.slab.direction,1);
 const x=s.slab.x;step(s,1e-8);assert.ok(s.slab.x>x);
});
test('pauseisexactnoopwhileinputcancellationstilladvancesactivephysicsandrequiresrelease',()=>{
 const s=M.create(764,0);step(s,.1,{a:true});assert.equal(s.mode,'moving');assert.equal(s.inputArmed,false);
 step(s,.01);const x=s.slab.x;step(s,.1,{cancelEpoch:1,cancelled:true,a:true});assert.equal(s.mode,'moving');assert.ok(s.slab.x>x);assert.equal(s.inputArmed,false);
 step(s,.01,{cancelled:true});step(s,.01,{a:true});assert.equal(s.mode,'moving');step(s,.01);waitAt(s,190);
 const before=clone(s);step(s,.2,{paused:true,a:true});assert.deepEqual(s,before);step(s,.1,{a:true});const paused=clone(s);
 step(s,.2,{paused:true});assert.deepEqual(s,paused);step(s,.1,{cancelEpoch:2,cancelled:true});near(s.dropElapsed,.2);step(s,.1,{cancelled:true});assert.equal(s.floorsBuilt,1);
});
test('unuseddirectionsandBdonotsteeroroverrideAandmalformedinputsdoNotInvokeGetters',()=>{
 const a=fresh(),b=fresh();step(a,.1,{x:1,y:-1,b:true});step(b,.1);near(a.slab.x,b.slab.x);assert.equal(a.drops,0);
 step(a,.1,{a:true,b:true,x:1});assert.equal(a.mode,'dropping');assert.equal(a.drops,1);
 const s=fresh();let reads=0;const before=clone(s),bad=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('no');}});
 for(const dt of [0,-1,.251,NaN,Infinity,'0.1',null,{},undefined])M.step(s,dt,bad);assert.equal(reads,0);assert.deepEqual(s,before);
 let getters=0;const raw={};Object.defineProperty(raw,'a',{get(){getters++;return true;}});step(s,.01,raw);step(s,.01,Object.create({a:true}));
 const partial=new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='cancelled')throw Error('no');return Object.getOwnPropertyDescriptor(t,k);}});step(s,.01,partial);
 assert.equal(getters,0);assert.equal(s.drops,0);assert.equal(s.mode,'moving');
});
test('offcutsageoutexactlyandboundedtimecountersneverendtheround',()=>{
 const s=fresh();waitAt(s,145);drop(s);assert.ok(s.offcuts.length);for(let i=0;i<6;i++)step(s,.25);assert.equal(s.offcuts.length,0);
 s.calls=M.config.maxCounter;s.elapsed=M.config.maxElapsed;step(s,.1);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:checks.length,checks,physicalTvTested:false,physicalPhoneTested:false},null,2));
