import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const [beforePath,afterPath,reportPath,out]=process.argv.slice(2),beforeSource=fs.readFileSync(beforePath,'utf8'),afterSource=fs.readFileSync(afterPath,'utf8'),report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
function projector(source,slug='alien-shooter'){const start=source.indexOf('function modelFrozen(s){'),end=source.indexOf('\nasync function screenshot',start),context={args:{slug}};assert.ok(start>=0&&end>start);vm.createContext(context);return vm.runInContext(source.slice(start,end)+'\nmodelFrozen',context);}
const old=projector(beforeSource),fixed=projector(afterSource),pair=report.observations.find(x=>x.label==='reconnect'),before=pair.before,after=pair.after,raw=JSON.stringify(pair),results=[];
function check(name,fn){fn();results.push({name,status:'passed'});}
check('old projection rejects actual raw connected-only delta',()=>assert.throws(()=>assert.deepEqual(old(after),old(before))));
check('new projection accepts actual raw connected-only delta',()=>assert.deepEqual(fixed(after),fixed(before)));
const mutations=[['model elapsed',s=>s.model.elapsed+=1],['credits score',s=>s.model.credits+=1],['kills',s=>s.model.kills+=1],['position',s=>s.model.players[0].x+=1],['angle',s=>s.players[0].angle+=.1],['ammo inventory',s=>s.model.players[0].ammo.smg+=1],['grenades',s=>s.players[0].grenades+=1],['weapon',s=>s.model.players[0].weapon='smg'],['cooldown',s=>s.players[0].fireCooldown+=1],['active',s=>s.players[0].active=false],['event serial',s=>s.model.eventSerial+=1],['events',s=>s.model.events.push({id:99,kind:'shot'})],['phase',s=>s.model.phase='playing'],['player count',s=>s.players.push({...s.players[0],id:2})],['same-named field outside players',s=>s.model.connected=true],['cancelSeq remains strict for Alien',s=>s.players[0].cancelSeq=1]];
for(const [name,mutate] of mutations)check(name+' still rejects gameplay change',()=>{const altered=structuredClone(after);mutate(altered);assert.throws(()=>assert.deepEqual(fixed(altered),fixed(before)));});
check('other games connected field remains strict',()=>{const other=projector(afterSource,'coast-kart');assert.throws(()=>assert.deepEqual(other(after),other(before)));});
check('raw before/after remain unchanged',()=>assert.equal(JSON.stringify(pair),raw));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');fs.writeFileSync(out,JSON.stringify({scope:'Projection regression using exact preserved Android before/after snapshots; negative cases change copied snapshots only',beforeSourceSha256:sha(beforeSource),afterSourceSha256:sha(afterSource),actualReportSha256:sha(fs.readFileSync(reportPath)),executedTestSha256:sha(fs.readFileSync(process.argv[1])),tests:results},null,2)+'\n');console.log(JSON.stringify({tests:results.length,status:'passed'}));
