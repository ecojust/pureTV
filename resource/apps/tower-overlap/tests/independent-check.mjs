import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {layouts,motion,intersection} from './puzzle-tools.mjs';
const M=createRequire(import.meta.url)('../src/main/assets/game-model.js'),output=path.resolve(process.argv[2]||'/tmp/tower-overlap-independent');mkdirSync(output,{recursive:true});
const report={scope:'Independent analytic profile/interval reference, ordinary create/step input and admitted model dt. No state mutation, browser clock control or hardware claims.',modelSha256:createHash('sha256').update(readFileSync(new URL('../src/main/assets/game-model.js',import.meta.url))).digest('hex'),tests:[],runs:[],landingsChecked:0,motionStepsChecked:0};
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,`${label}: ${a} versus ${b}`);
function compareMotion(actual,expected){for(const k of ['x','width','velocity'])near(actual[k],expected[k],k);near(actual.cycle,expected.cycle,'cycle');assert.equal(actual.direction,expected.direction);}
function tick(s,dt,input={}){M.step(s,dt,input);assert.equal(s.floorsBuilt,s.floors.length-1);assert.ok(s.floors.length<=s.goal+1);assert.ok(s.offcuts.length<=2);return s;}
function checkLanding(s,source,previous){const expected=intersection(source,previous),actual=s.lastLanding;near(actual.sourceX,source.x,'committed x');near(actual.sourceWidth,source.width,'committed width');near(actual.previousX,previous.x,'previous x');near(actual.width,expected.width,'retained width');near(actual.x,expected.x,'retained x');if(expected.width>0){near(actual.leftTrim,expected.leftTrim,'left trim');near(actual.rightTrim,expected.rightTrim,'right trim');}assert.equal(actual.accepted,expected.width>=16-1e-10);report.landingsChecked++;}
function freeze(s){const before=structuredClone(s);for(const input of [{a:true},{b:true},{x:1},{cancelled:true,cancelEpoch:5}])M.step(s,.2,input);assert.deepEqual(s,before);}
function freshEdge(){const s=M.create(764,0);tick(s,1e-12);const source=structuredClone(s.slab),previous=structuredClone(s.floors.at(-1));tick(s,.25,{a:true});tick(s,.05);assert.equal(s.floorsBuilt,1);checkLanding(s,source,previous);return s;}
function dropAndLand(s){const source=structuredClone(s.slab),previous=structuredClone(s.floors.at(-1));tick(s,.25,{a:true});near(s.slab.x,source.x,'dropping x fixed');assert.equal(s.slab.velocity,0);tick(s,.05);checkLanding(s,source,previous);return s;}
function test(name,fn){fn();report.tests.push({name,passed:true});}
try{
 test('three public widths, speeds, goals and profiles match contract',()=>{assert.equal(M.config.fieldWidth,600);assert.equal(M.config.minWidth,16);assert.equal(M.config.dropDuration,.3);layouts.forEach((l,i)=>{for(const k of Object.keys(l))assert.deepEqual(M.config.layouts[i][k],l[k]);});});
 for(let level=0;level<3;level++){
  test(`level ${level+1}: independent motion integration across phases and reflections`,()=>{const s=M.create(764,level);for(let i=0;i<240;i++){const dt=[.25,.13,.07,.2][i%4],expected=motion(s.slab,layouts[level],dt);tick(s,dt);compareMotion(s.slab,expected);report.motionStepsChecked++;}report.runs.push({level,kind:'motion',elapsed:s.elapsed,slab:s.slab});});
  test(`level ${level+1}: equal elapsed partitions preserve moving geometry`,()=>{const a=M.create(764,level),b=M.create(764,level);for(let i=0;i<80;i++)tick(a,.25);for(let i=0;i<400;i++)tick(b,.05);compareMotion(a.slab,b.slab);near(a.elapsed,b.elapsed,'elapsed');});
  test(`level ${level+1}: ordinary timed A builds every required floor`,()=>{
   const s=M.create(764,level),landings=[];let pending=null;
   for(let i=0;i<20000&&s.phase==='playing';i++){
    const a=s.inputArmed&&s.mode==='moving'&&Math.abs(s.slab.x-s.floors.at(-1).x)<=6;
    if(a)pending={source:structuredClone(s.slab),previous:structuredClone(s.floors.at(-1)),drops:s.drops};
    const prior=s.lastLanding?.drop;tick(s,.05,a?{a:true}:{});
    if(s.lastLanding&&s.lastLanding.drop!==prior){assert.ok(pending);checkLanding(s,pending.source,pending.previous);landings.push(structuredClone(s.lastLanding));pending=null;}
   }
   assert.equal(s.phase,'won');assert.equal(s.floorsBuilt,layouts[level].goal);assert.equal(s.score,100);assert.equal(s.slab,null);assert.equal(s.mode,'settled');assert.equal(s.lastLanding.cause,'success');freeze(s);report.runs.push({level,kind:'ordinary-timed-win',landings,final:s});
  });
 }
 test('landing remainder starts the next slab profile at the correct phase',()=>{const s=M.create(764,0);tick(s,.25);const source=structuredClone(s.slab),previous=structuredClone(s.floors[0]);tick(s,.25,{a:true});tick(s,.25);assert.equal(s.floorsBuilt,1);checkLanding(s,source,previous);const width=s.floors.at(-1).width,initial={x:600-width,width,direction:-1,cycle:0,velocity:-145};compareMotion(s.slab,motion(initial,layouts[0],.2));for(const offcut of s.offcuts)near(offcut.age,.2,'new offcut age');});
 for(const desired of [16,15.5])test(`ordinary timed retained width ${desired} obeys minimum`,()=>{const s=freshEdge(),top=s.floors.at(-1),target=top.x+top.width-desired;while(s.slab.x-target>145*.25+1e-9)tick(s,.25);const rest=(s.slab.x-target)/145;if(rest>0)tick(s,rest);near(s.slab.x,target,'target crossing');dropAndLand(s);near(s.lastLanding.width,desired,'boundary retention');assert.equal(s.phase,desired===16?'playing':'lost');assert.equal(s.floorsBuilt,desired===16?2:1);if(desired<16){assert.equal(s.reason,'too-narrow');freeze(s);}report.runs.push({level:0,kind:'natural-width-boundary',desired,final:s});});
 test('a natural opposite-edge drop misses without adding a floor',()=>{const s=freshEdge();dropAndLand(s);assert.equal(s.phase,'lost');assert.equal(s.reason,'miss');assert.equal(s.lastLanding.width,0);assert.equal(s.floorsBuilt,1);assert.equal(s.offcuts.length,1);freeze(s);report.runs.push({kind:'natural-miss',final:s});});
 test('held A cannot commit the next floor; control cancellation keeps physics moving',()=>{const s=M.create(764,0);tick(s,.25);tick(s,.25,{a:true});tick(s,.25,{a:true});assert.equal(s.floorsBuilt,1);assert.equal(s.drops,1);tick(s,.25,{a:true});assert.equal(s.drops,1);assert.equal(s.mode,'moving');tick(s,.1,{cancelEpoch:1});const before=structuredClone(s);tick(s,.1,{a:true,cancelEpoch:2});assert.equal(s.drops,1);assert.equal(s.inputArmed,false);compareMotion(s.slab,motion(before.slab,layouts[0],.1));const frozen=structuredClone(s);M.step(s,.25,{paused:true});assert.deepEqual(s,frozen);tick(s,.1,{cancelEpoch:2});tick(s,.1,{a:true,b:true,x:1,cancelEpoch:2});assert.equal(s.drops,2);assert.equal(s.mode,'dropping');});
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;}
writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,tests:report.tests.length,motionStepsChecked:report.motionStepsChecked,landingsChecked:report.landingsChecked,failure:report.failure}));
