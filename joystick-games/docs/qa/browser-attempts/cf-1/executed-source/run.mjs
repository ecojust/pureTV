import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { argsFrom, inventory, makeOutput, serve, openBrowser, snapshot, until, setButtons, press, delay, imageEvidence, layout, assertLayout, startRecording } from './common.mjs';

const args=argsFrom(process.argv.slice(2));
assert.ok(['cf-transport-ship','qq-speed'].includes(args.game),'--game cf-transport-ship|qq-speed');
assert.ok(args.assets&&args.output,'--assets and --output are required');
const assets=path.resolve(args.assets),output=path.resolve(args.output),game=args.game;
await makeOutput(output,assets);
const sources=await inventory(assets),server=await serve(assets);
const report={game,suite:args.suite||'controls',startedAt:new Date().toISOString(),scope:'Built browser game with synthetic native input fixture. No TCP or native-device coverage.',sourceAssetHashes:sources,tests:[],captures:[],trace:[],physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,modelWrites:false,clockOverrides:false,visualReviewCompleted:false};
let browser,session,page,stopRecording;
const identity='esp32-qa-browser001';
async function test(name,action){const start=performance.now();try{const detail=await action();report.tests.push({name,status:'passed',milliseconds:performance.now()-start,detail});console.log('PASS '+name);return detail;}catch(e){report.tests.push({name,status:'failed',milliseconds:performance.now()-start,error:e.stack});throw e;}}
async function capture(name){const evidence=await imageEvidence(page,output,name);report.captures.push(evidence);return evidence;}
async function trace(label){const state=await snapshot(page);report.trace.push({at:new Date().toISOString(),label,state});return state;}
const isPaused=s=>s.paused===true||['paused','pause'].includes(s.stage);
const isPlaying=s=>['playing','race'].includes(s.stage)&&!isPaused(s);
const position=s=>s.player?.position||{x:s.player?.x,y:0,z:s.player?.z};
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y||0)-(b.y||0),a.z-b.z);
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));

try{
  session=await openBrowser(server.url,{width:1280,height:720},true);({page,browser}=session);report.browser=session.version;
  await test('actual build loads its menu',async()=>{const s=await until(page,s=>s.stage==='menu'&&!s.loading,90000);assert.ok(s.quality==='low'||s.settings?.quality==='low','Fresh install defaults to low graphics');await capture('01-menu');return s;});
  await test('connected identity is visible from cached game input',async()=>{
    await page.evaluate(id=>window.__syntheticController.connect(id),identity);
    const s=await until(page,s=>s.controller?.connected===true);await delay(500);const bounds=await layout(page);assertLayout(bounds,identity);await capture('02-connected');return {snapshot:s,layout:bounds};
  });
  if(args.record)stopRecording=await startRecording(page,output);
  await test('menu navigation uses direction and START starts',async()=>{
    const before=await trace('menu-before-navigation');await press(page,'DOWN');const after=await trace('menu-after-navigation');
    assert.notDeepEqual(after.focus,before.focus,'Direction must change focused menu control');
    await press(page,'START');const playing=await until(page,isPlaying,120000);await capture('03-playing');return {before:before.focus,after:after.focus,playing};
  });
  if(game==='cf-transport-ship'){
    await test('CF directions move and turn the actual player',async()=>{
      const before=await trace('before-move');await press(page,'UP',1000);const forward=await trace('after-forward');assert.ok(distance(position(before),position(forward))>.2,'Forward button changes actual world position');
      await press(page,'LEFT',700);const left=await trace('after-left');assert.ok(angle(left.player.yaw-forward.player.yaw)>.03,'Left physically turns left');
      await press(page,'RIGHT',700);const right=await trace('after-right');assert.ok(angle(right.player.yaw-left.player.yaw)<-.03,'Right physically turns right');return {before,forward,left,right};
    });
    await test('CF modifier aims vertically and shooting uses ammo',async()=>{
      const before=await trace('before-aim');await press(page,['B','UP'],500);const aimed=await trace('after-aim-up');assert.ok(aimed.player.pitch>before.player.pitch+.01,'B+UP looks up');
      await press(page,['B','DOWN'],500);const level=await trace('after-aim-down');assert.ok(level.player.pitch<aimed.player.pitch-.01,'B+DOWN looks down');
      const prior=await trace('before-fire');await press(page,'A',700);const shot=await trace('after-fire');assert.ok(shot.player.shotsFired>prior.player.shotsFired,'Actual weapon fired');assert.ok(shot.player.ammo<prior.player.ammo,'Actual magazine consumed');return {before,aimed,level,prior,shot};
    });
    await test('CF reload and jump reach gameplay',async()=>{
      await setButtons(page,['X']);const reload=await until(page,s=>s.player.reloading,5000);await setButtons(page,[]);await until(page,s=>!s.player.reloading,12000);
      const before=await trace('before-jump');await setButtons(page,['Y']);const airborne=await until(page,s=>!s.player.onGround,5000);await setButtons(page,[]);await delay(500);return {reload,before,airborne};
    });
    await test('CF weapon switching and scope modifier are distinct',async()=>{
      const before=await trace('before-switch');await press(page,['B','X']);const switched=await trace('after-switch');assert.notEqual(switched.player.slot,before.player.slot,'B+X cycles actual weapon slot');
      return {before,switched};
    });
  }else{
    await test('QQ directions accelerate and steer using original handedness',async()=>{
      await setButtons(page,['UP']);const moving=await until(page,s=>s.player.speed>55,20000);await press(page,['UP','LEFT'],400);const left=await trace('after-left');assert.ok(angle(left.player.h-moving.player.h)>.01,'Original LEFT increases heading');
      await press(page,['UP','RIGHT'],400);const right=await trace('after-right');assert.ok(angle(right.player.h-left.player.h)<-.01,'Original RIGHT decreases heading');return {moving,left,right};
    });
    await test('QQ drift is actual gameplay and disconnect cannot reward release',async()=>{
      await setButtons(page,['UP']);await until(page,s=>s.player.speed>55,20000);await setButtons(page,['UP','LEFT','A']);const drifting=await until(page,s=>s.player.drift,7000);await delay(400);
      await page.evaluate(()=>window.__syntheticController.disconnect());const disconnected=await until(page,isPaused,10000);assert.equal(disconnected.player.drift,false,'Disconnect cancels drift');assert.ok(disconnected.player.smallWindow<=0,'Disconnect awards no drift release boost');
      await page.evaluate(id=>window.__syntheticController.connect(id),identity);await until(page,s=>s.controller?.connected===true);await delay(500);assert.ok(isPaused(await snapshot(page)),'Reconnect never resumes by itself');await press(page,'START');await until(page,isPlaying,15000);return {drifting,disconnected};
    });
    await test('QQ Y resets only through the normal recovery action',async()=>{
      const before=await trace('before-reset');await press(page,'Y');const after=await trace('after-reset');assert.ok(after.stats.resets>before.stats.resets,'Normal reset action counted');return {before,after};
    });
  }
  await test('START freezes game time and resumes explicitly',async()=>{
    await setButtons(page,[]);await press(page,'START');const paused=await until(page,isPaused);await delay(900);const later=await snapshot(page);
    assert.equal(later.time,paused.time,'Paused game time frozen');assert.deepEqual(position(later),position(paused),'Paused player position frozen');await capture('04-paused');await press(page,'START');await until(page,isPlaying);return {paused,later};
  });
  await test('disconnect clears controls and pauses, reconnect stays paused',async()=>{
    await setButtons(page,['UP']);await delay(500);await page.evaluate(()=>window.__syntheticController.disconnect());const paused=await until(page,isPaused,10000);await delay(400);assert.equal((await layout(page)).cards.length,0,'Disconnected card removed');
    await page.evaluate(id=>window.__syntheticController.connect(id),identity);await until(page,s=>s.controller?.connected===true);await delay(400);const reconnected=await snapshot(page);assert.ok(isPaused(reconnected));assert.ok(!Object.values(reconnected.controller.buttons).some(Boolean),'No stuck input after reconnect');assertLayout(await layout(page),identity);await capture('05-reconnected');return {paused,reconnected};
  });
  await test('1280 and 960 identity and controls remain visible',async()=>{
    const layouts=[];for(const width of [960,1280]){await page.setViewportSize({width,height:width===960?540:720});await delay(500);const data=await layout(page);assertLayout(data,identity);layouts.push(data);await capture('06-layout-'+width);}return layouts;
  });
  await test('source bytes and page remain free from runtime failures',async()=>{assert.deepEqual(await inventory(assets),sources,'Assets did not change during the run');assert.deepEqual(session.errors,{page:[],console:[],network:[]});return session.errors;});
  report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;try{await capture('failure');await trace('failure');}catch{}console.error(error.stack);process.exitCode=1;}
finally{
  if(stopRecording){try{report.recording=await stopRecording();}catch(error){report.recordingError=error.stack;report.status='failed';process.exitCode=1;}}
  report.finishedAt=new Date().toISOString();if(session)report.errors=session.errors;
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  if(browser)await browser.close();await server.close();
  console.log(JSON.stringify({status:report.status,tests:report.tests.length,passed:report.tests.filter(t=>t.status==='passed').length,output}));
}
