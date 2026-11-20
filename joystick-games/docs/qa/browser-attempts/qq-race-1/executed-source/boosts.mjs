// Acquire every tested resource through normal controller input. No model writes.
import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { argsFrom, inventory, makeOutput, serve, openBrowser, snapshot, until, setButtons, press, delay, imageEvidence } from './common.mjs';
const args=argsFrom(process.argv.slice(2));assert.ok(args.assets&&args.output);
const assets=path.resolve(args.assets),output=path.resolve(args.output);await makeOutput(output,assets);
const sources=await inventory(assets),server=await serve(assets),report={game:'qq-speed',scope:'Actual game mechanics through a synthetic nine-button native input bridge; resources acquired only by ordinary driving.',startedAt:new Date().toISOString(),sourceAssetHashes:sources,tests:[],trace:[],inputs:[],captures:[],modelWrites:false,resourceWrites:false,clockOverrides:false,physicalTvTested:false,physicalEsp32Tested:false};
let session,held=[];
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
async function keys(next){if(JSON.stringify(next)!==JSON.stringify(held)){await setButtons(session.page,next);report.inputs.push({at:Date.now(),buttons:next});held=[...next];}}
try{
  session=await openBrowser(server.url,{width:960,height:540},true);const page=session.page;
  await until(page,s=>s.stage==='menu'&&!s.loading,120000);await page.evaluate(()=>window.__syntheticController.connect('esp32-qa-resource01'));await until(page,s=>s.controller?.connected);
  await press(page,'START');await until(page,s=>s.stage==='race',180000);
  let phase='accelerate',driftDirection='LEFT',phaseTime=0,cycles=0,small=null,nitro=null,prior=null,lastLog=-Infinity;
  const start=performance.now(),seconds=Number(args.seconds||900);
  while((performance.now()-start)/1000<seconds){
    const state=await snapshot(page),p=state.player,now=performance.now();assert.equal(state.stage,'race');
    report.trace.push({elapsed:(now-start)/1000,phase,state});
    if(now-lastLog>15000){console.log(JSON.stringify({elapsed:(now-start)/1000,phase,time:state.time,speed:p.speed,drift:p.drift,driftTime:p.driftTime,gauge:p.gauge,nitro:p.nitro,small:p.stats.small,cycles}));lastLog=now;}
    if(prior&&p.stats.small>prior.player.stats.small&&!small){small={before:prior,after:state};report.tests.push({name:'X consumes a naturally earned small-boost window',status:'passed',detail:small});console.log('PASS real X small boost');}
    if(p.nitro>0&&!nitro){
      const before=state;await keys(['UP','B']);const after=await until(page,s=>s.player.nitroTime>0&&s.player.nitro<before.player.nitro&&s.player.stats.nitro>before.player.stats.nitro,30000);await keys(['UP']);nitro={before,after};report.tests.push({name:'B spends drift-earned nitro and starts an actual boost',status:'passed',detail:nitro});console.log('PASS real B nitro');
    }
    if(small&&nitro)break;
    const target=p.ahead[1],error=angle(Math.atan2(target.x-p.x,target.z-p.z)-p.h);
    const steer=Math.abs(error)>.05?(error>0?'LEFT':'RIGHT'):null;
    if(phase==='accelerate'){
      await keys(['UP',...(steer?[steer]:[])]);
      if(p.speed>24){driftDirection=steer||((cycles%2)?'RIGHT':'LEFT');phase='drift';phaseTime=state.time;}
    }else if(phase==='drift'){
      await keys(['UP',driftDirection,'A']);
      if((p.drift&&p.driftTime>.85)||state.time-phaseTime>1.4){phase='release';phaseTime=state.time;cycles++;}
    }else if(phase==='release'){
      await keys(['UP',driftDirection==='LEFT'?'RIGHT':'LEFT']);
      if(p.smallWindow>0){prior=state;phase='small';phaseTime=state.time;await keys(['UP','X']);}
      else if(!p.drift||state.time-phaseTime>1.3){phase='accelerate';phaseTime=state.time;}
    }else if(phase==='small'){
      await keys(['UP','X']);
      if(p.smallWindow<=0||state.time-phaseTime>.4){phase='accelerate';phaseTime=state.time;await keys(['UP']);}
    }
    await delay(100);
  }
  await keys([]);assert.ok(small,'Must observe an actual X small boost after a naturally earned window');assert.ok(nitro,'Must observe an actual B nitro after naturally earning stock');
  await press(page,'START');await until(page,s=>s.stage==='paused');report.captures.push(await imageEvidence(page,output,'earned-resources-paused'));
  assert.deepEqual(await inventory(assets),sources);assert.deepEqual(session.errors,{page:[],console:[],network:[]});report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error.stack);if(session)try{await keys([]);report.failure=await snapshot(session.page);report.captures.push(await imageEvidence(session.page,output,'failure'));}catch{}}
finally{if(session){report.errors=session.errors;await session.browser.close();}await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,tests:report.tests.length,output}));}
