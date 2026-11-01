// Shared browser regression. Game-specific model tests remain mandatory and separate.
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs, sourceHashes, serveAssets, launch, preparePage, snapshot, tap, applyKeys, releaseAll, verifyErrors, inspectFrame, summarize, delay, run } from './common.mjs';
import { recordGameplay } from './record.mjs';

const args = parseArgs();
assert.ok(args.assets && args.output, 'Usage: node qa.mjs --assets /game/assets --output /qa/output --automation automation.mjs [--record] [--apk game.apk] [--package com.example.game] [--entry tv.html] [--seconds 15]');
const output = path.resolve(args.output), assets = path.resolve(args.assets);
assert.ok(!output.startsWith(assets+path.sep), 'Output must be outside source assets');
await mkdir(output, { recursive:true });
const originalHashes = await sourceHashes(assets);
const automation = args.automation ? await import(pathToFileURL(path.resolve(args.automation)).href) : null;
if (automation) assert.equal(typeof automation.keys, 'function', 'automation must export keys(snapshot, meta)');
const server = await serveAssets(assets, args.entry || 'tv.html');
const browser = await launch();
const report = { sourceAssetHashes:originalHashes, startedAt:new Date().toISOString(), environment:{ browser:await browser.version(), renderer:'ANGLE SwiftShader', viewport:[1280,720], physicalTvTested:false, physicalPhoneTested:false }, tests:[], screenshots:[], uniqueRulesVerified:false, modelTestsExecuted:false, visualReviewCompleted:false };
let session;
async function test(name, action) {
  const started = performance.now();
  try { const details = await action(); report.tests.push({ name, passed:true, milliseconds:performance.now()-started, details }); console.log('PASS '+name); return details; }
  catch (error) { report.tests.push({ name, passed:false, milliseconds:performance.now()-started, error:error.stack }); throw error; }
}
try {
  session = await preparePage(browser, server.url, { metrics:true });
  const page = session.page;
  const initial = await test('loads title and read-only snapshot', async () => {
    const state = await snapshot(page);
    assert.equal(state.phase, 'menu');
    const cloneCheck = await page.evaluate(() => {
      const first=PureTVQA.snapshot();
      try { first.phase='__qa_mutation_probe'; } catch(error) { if(!(error instanceof TypeError)) throw error; }
      try { if(first.model) first.model.__qa_mutation_probe=true; } catch(error) { if(!(error instanceof TypeError)) throw error; }
      const second=PureTVQA.snapshot(); return second.phase!=='__qa_mutation_probe'&&!second.model?.__qa_mutation_probe;
    });
    assert.ok(cloneCheck, 'Snapshot must return a deep copy, without exposing live model references');
    return state;
  });
  await test('title is rendered', async () => {
    const file=path.join(output,'01-title.png'); report.screenshots.push(file); return inspectFrame(page,file);
  });
  await test('Enter starts the normal game', async () => {
    await tap(page,'Enter'); await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');
    const state=await snapshot(page); assert.equal(state.paused,false); assert.ok(Number.isFinite(state.tick)); return state;
  });
  await test('P freezes gameplay state and tick, P resumes', async () => {
    await tap(page,'p'); await page.waitForFunction(()=>PureTVQA.snapshot().paused===true);
    const paused=await snapshot(page); await delay(240); const later=await snapshot(page);
    assert.equal(later.tick,paused.tick,'Paused simulation tick must freeze'); assert.deepEqual(later.model,paused.model,'Paused model must freeze');
    await tap(page,'p'); await page.waitForFunction(tick=>!PureTVQA.snapshot().paused&&PureTVQA.snapshot().tick>tick,paused.tick); return {pausedTick:paused.tick};
  });
  const before=await snapshot(page), trace=[];
  await test('ordinary movement and action input', async () => {
    const started=performance.now(), seconds=Number(args.seconds||15), held=new Set();
    assert.ok(seconds>=1&&seconds<=120,'Regression duration must be 1..120 seconds');
    const startTime=await page.evaluate(()=>performance.now());
    try {
      while ((performance.now()-started)/1000<seconds) {
        const elapsed=(performance.now()-started)/1000, state=await snapshot(page);
        trace.push({elapsed,state}); if(state.phase!=='playing') break;
        const keys=automation ? await automation.keys(state,{elapsed,mode:'qa'}) : elapsed<.7?['ArrowRight']:elapsed<1.1?['Space']:elapsed<1.8?['ArrowLeft']:elapsed<2.1?['b']:[];
        await applyKeys(page,keys,held); await delay(80);
      }
    } finally { await releaseAll(page,[...held]); }
    const endTime=await page.evaluate(()=>performance.now());
    const after=await snapshot(page); trace.push({elapsed:(performance.now()-started)/1000,state:after});
    assert.ok(after.tick>before.tick,'Normal game simulation must advance');
    const raw=await page.evaluate(()=>PureTVRenderMetrics.snapshot());
    const samples=raw.samples.filter(s=>s.time>=startTime+500&&s.time<=endTime);
    assert.ok(samples.length>=10,'Need enough performance samples');
    report.performance={ note:raw.note, instrumentationOverheadIncluded:true, samples:samples.length, rafIntervalMs:summarize(samples.map(s=>s.rafIntervalMs)), webglDrawCalls:summarize(samples.map(s=>s.webglDrawCalls)), canvasPaintCommands:summarize(samples.map(s=>s.canvasPaintCommands)), budgets:automation?.budgets||{} };
    await writeFile(path.join(output,'performance-samples.json'),JSON.stringify({note:raw.note,samples})+'\n');
    if(automation?.budgets?.maxWebGLDrawCalls!==undefined) assert.ok(report.performance.webglDrawCalls.max<=automation.budgets.maxWebGLDrawCalls,'WebGL API submission budget exceeded');
    if(automation?.budgets?.maxCanvasPaintCommands!==undefined) assert.ok(report.performance.canvasPaintCommands.max<=automation.budgets.maxCanvasPaintCommands,'Canvas paint command budget exceeded');
    if(automation?.budgets?.maxRafIntervalP95Ms!==undefined) assert.ok(report.performance.rafIntervalMs.p95<=automation.budgets.maxRafIntervalP95Ms,'Observed software-browser frame interval budget exceeded');
    return {before,after};
  });
  const after=await snapshot(page);
  if(automation?.assertProgress) await test('game-specific normal-play assertions',async()=>{await automation.assertProgress({before,after,trace},assert);report.uniqueRulesVerified=true;});
  else report.missingCoverage=['No game-specific assertProgress was supplied'];
  await test('gameplay frame is visible',async()=>{const file=path.join(output,'02-gameplay.png');report.screenshots.push(file);return inspectFrame(page,file);});
  await test('R restarts with clean simulation state',async()=>{
    await tap(page,'r'); await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing'&&!PureTVQA.snapshot().paused);
    const restarted=await snapshot(page); assert.ok(restarted.tick<after.tick,'Restart resets simulation tick');
    if(automation?.assertRetry) await automation.assertRetry({before:after,after:restarted,initial},assert);
    return restarted;
  });
  await test('resizing keeps canvas visible',async()=>{
    for(const viewport of [{width:960,height:540},{width:1280,height:720}]) { await page.setViewportSize(viewport);await delay(100);const file=path.join(output,'resize-'+viewport.width+'.png');report.screenshots.push(file);await inspectFrame(page,file); }
  });
  await test('no page, console or resource errors',async()=>verifyErrors(session));
  await writeFile(path.join(output,'input-state-trace.json'),JSON.stringify(trace,null,2)+'\n');
  await session.context.close(); session=null;
  if(args.record) {
    const recipe=args.recipe?JSON.parse(await readFile(args.recipe,'utf8')):{durationSeconds:30};
    report.recording=await recordGameplay({browser,url:server.url,output:path.join(output,'recording'),recipe,assetHashes:originalHashes,automation});
  }
  if(args.apk) {
    const command=[new URL('./verify-artifacts.py',import.meta.url).pathname,'--apk',path.resolve(args.apk),'--assets',assets,'--output',path.join(output,'artifact-validation.json')];
    if(args.package)command.push('--package',args.package);
    if(report.recording)command.push('--video',report.recording.video);
    report.artifacts=JSON.parse((await run('python3',command)).stdout);
  }
  assert.deepEqual(await sourceHashes(assets),originalHashes,'Source assets changed during regression or recording');
  report.sharedRegressionPassed=true;
} catch(error) {
  report.failure=error.stack; report.sharedRegressionPassed=false;
  console.error(error.stack);process.exitCode=1;
} finally {
  if(session)await session.context.close();
  await browser.close();await server.close();report.finishedAt=new Date().toISOString();
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Report: '+path.join(output,'report.json'));
}
