// A normal keyboard driver. Reads only the public snapshot and sends real
// Playwright keyboard events; never accesses the game instance or game clocks.
import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { argsFrom, inventory, makeOutput, serve, openBrowser, snapshot, until, delay, keyboardTap, imageEvidence, startRecording } from './common.mjs';

const args=argsFrom(process.argv.slice(2));
assert.ok(args.assets&&args.output,'--assets and --output required');
const assets=path.resolve(args.assets),output=path.resolve(args.output),map=args.map||'city',mode=args.mode||'speed';
assert.ok(['city','aegean','egypt','snow'].includes(map));assert.ok(['speed','item'].includes(mode));
await makeOutput(output,assets);const sources=await inventory(assets),server=await serve(assets);
const report={game:'qq-speed',scope:'Actual browser gameplay using ordinary keyboard and menu clicks; no native bridge fixture, TCP, native package or physical-device claims.',startedAt:new Date().toISOString(),sourceAssetHashes:sources,map,mode,tests:[],trace:[],inputs:[],captures:[],modelWrites:false,clockOverrides:false,physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,visualReviewCompleted:false};
let session,stopRecording,held=new Set();
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
async function keys(next){const requested=new Set(next);for(const key of held)if(!requested.has(key)){await session.page.keyboard.up(key);report.inputs.push({at:Date.now(),type:'up',key});}for(const key of requested)if(!held.has(key)){await session.page.keyboard.down(key);report.inputs.push({at:Date.now(),type:'down',key});}held=requested;}
try{
  session=await openBrowser(server.url,{width:960,height:540},false);const page=session.page;
  await until(page,s=>s.stage==='menu'&&!s.loading,120000);
  await page.locator('#maps .map[data-id="'+map+'"]').click();await until(page,s=>s.map===map&&!s.loading,120000);
  await page.locator('#modes .opt[data-i="'+(mode==='speed'?0:1)+'"]').click();
  await page.locator('#laps .opt[data-i="0"]').click();const selected=await snapshot(page);assert.equal(selected.laps,1);assert.equal(selected.mode,mode);assert.equal(selected.map,map);
  report.captures.push(await imageEvidence(page,output,'01-selected-menu'));
  if(args.record)stopRecording=await startRecording(page,output);
  // Selection clicks leave focus on that option; Enter would activate the
  // selected option again. Use the visible Start control for an actual start.
  await page.locator('#start').click();await until(page,s=>s.stage==='race',180000);
  report.tests.push({name:'Selected map/mode and one lap started normally',status:'passed',selected});
  const began=performance.now(),seconds=Number(args.seconds||600);let lastProgressAt=began,lastDistance=null,lastReset=-Infinity,lastSample=-Infinity,lastPrint=-Infinity,finish=null;
  while((performance.now()-began)/1000<seconds){
    const state=await snapshot(page),now=performance.now(),p=state.player;
    assert.ok(p&&Number.isFinite(p.h),'Player telemetry must exist');
    if(now-lastSample>350){report.trace.push({elapsed:(now-began)/1000,state});lastSample=now;}
    if(now-lastPrint>30000){console.log(JSON.stringify({elapsed:(now-began)/1000,stage:state.stage,lap:p.lap,distance:p.distance,trackLength:p.trackLength,speed:p.speed,resets:state.stats.resets}));lastPrint=now;}
    if(p.finished||state.stage==='finish'){finish=state;break;}
    assert.equal(state.stage,'race','Race must not silently pause or leave gameplay');
    if(lastDistance===null||Math.abs(p.distance-lastDistance)>3){lastDistance=p.distance;lastProgressAt=now;}
    const target=p.ahead[p.speed>36?2:1],desired=Math.atan2(target.x-p.x,target.z-p.z),error=angle(desired-p.h);
    let buttons=['ArrowUp'];
    if(error>.035)buttons.push('ArrowLeft');else if(error<-.035)buttons.push('ArrowRight');
    // Reduce speed in sharp turns without changing any physics or track state.
    if(Math.abs(error)>.8&&p.speed>23)buttons=buttons.filter(k=>k!=='ArrowUp').concat('ArrowDown');
    if(p.smallWindow>0.08)buttons.push('w');
    if(p.nitro>0&&Math.abs(error)<.12)buttons.push('Control');
    // Recover only through the game's ordinary R key after actual lack of progress.
    if(now-lastProgressAt>8000&&now-lastReset>10000){await keys([]);await keyboardTap(page,'r');lastReset=now;lastProgressAt=now;}
    else await keys(buttons);
    await delay(90);
  }
  await keys([]);
  assert.ok(finish,'A complete race must be observed within the real wall-clock budget');
  assert.ok(finish.player.finished,'Actual player marked finished');assert.ok(finish.player.lap>=1,'Actual ordered lap completed');
  await until(page,s=>s.resultShown,300000);report.finish=await snapshot(page);report.tests.push({name:'Normal keyboard completed the actual ordered lap',status:'passed',wallClockSeconds:(performance.now()-began)/1000,finish:report.finish});
  if(stopRecording){report.recording=await stopRecording();stopRecording=null;}
  report.captures.push(await imageEvidence(page,output,'02-finish'));
  assert.deepEqual(await inventory(assets),sources,'Sources unchanged during the recorded run');
  assert.deepEqual(session.errors,{page:[],console:[],network:[]});report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error.stack);if(session){try{await keys([]);report.failure=await snapshot(session.page);report.captures.push(await imageEvidence(session.page,output,'failure'));}catch{}}}
finally{
  if(stopRecording){try{report.recording=await stopRecording();}catch(error){report.recordingError=error.stack;report.status='failed';process.exitCode=1;}}
  if(session){report.errors=session.errors;await session.browser.close();}await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,tests:report.tests,output}));
}
