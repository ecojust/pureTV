// Shared-runtime extension contract fixtures, not gameplay or GPU evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { mkdtemp, copyFile, writeFile, rm } from 'node:fs/promises';
import { launch, serveAssets, preparePage, snapshot, tap, delay, verifyErrors } from '../../../game-kit/qa/common.mjs';

const fixtureSource = `
window.probe={factoryCalls:0,defaultCalls:0,begins:0,ends:0,draws:0,disposes:0,ui:[]};
const Base=window.PureRenderer;
window.PureRenderer=class extends Base{constructor(...args){super(...args);probe.defaultCalls++;}};
window.GameDef={id:'renderer-extension-fixture',title:'Renderer fixture',description:'Protocol fixture only',tip:'No gameplay claim',controls:{move:'Move',a:'A',b:'B'},hud:s=>[{label:'Tick',value:s.tick}],result:()=>'',render(r){probe.draws++;if(r.rect)r.rect(0,0,960,540,'#345678');}};
const custom=new URL(location.href).searchParams.get('custom')==='1';
if(custom)GameDef.createRenderer=canvas=>{probe.factoryCalls++;probe.canvasId=canvas.id;return {metrics:{renderer:'custom-contract-fixture',drawCalls:7},begin(){probe.begins++;},end(){probe.ends++;},dispose(){probe.disposes++;}};};
if(new URL(location.href).searchParams.get('ui')==='1')GameDef.afterUI=(state,ui)=>{probe.ui.push({modelTick:state.tick,phase:ui.phase,paused:ui.paused,level:ui.level,best:ui.best,phoneConnected:ui.phoneConnected,disconnected:ui.disconnected});if(probe.ui.length>100)probe.ui.shift();document.getElementById('message').textContent='Scoped UI hook '+ui.phase;};
`;

test('optional renderer/UI hooks retain the shared default and real lifecycle', {timeout:60000}, async t => {
  const temporary=await mkdtemp(path.join(os.tmpdir(),'neon-rush-hook-fixture-'));
  const web=fileURLToPath(new URL('../../../game-kit/web/',import.meta.url));
  let browser,server;
  try{
    for(const name of ['runtime.js','renderer.js','tv.html','tv.css'])await copyFile(path.join(web,name),path.join(temporary,name));
    await writeFile(path.join(temporary,'game-config.json'),JSON.stringify({version:'0.0.0'}));
    await writeFile(path.join(temporary,'game-model.js'),`window.PureModel={create(){return {phase:'playing',score:0,tick:0,events:[]};},step(s){s.tick++;}};`);
    await writeFile(path.join(temporary,'game.js'),fixtureSource);
    server=await serveAssets(temporary);browser=await launch();
    await t.test('absent hooks construct the existing renderer and run normally',async()=>{
      const session=await preparePage(browser,server.url);
      try{
        const p=await session.page.evaluate(()=>JSON.parse(JSON.stringify(probe)));
        assert.equal(p.defaultCalls,1);assert.equal(p.factoryCalls,0);assert.ok(p.draws>0);
        await tap(session.page,'Enter');await session.page.waitForFunction(()=>PureTVQA.snapshot().tick>2);
        assert.equal((await snapshot(session.page)).phase,'playing');verifyErrors(session);
      }finally{await session.context.close();}
    });
    await t.test('custom factory owns the canvas and begin/render/end are balanced',async()=>{
      const session=await preparePage(browser,server.url+'?custom=1');
      try{
        const p=await session.page.evaluate(()=>JSON.parse(JSON.stringify(probe)));
        assert.equal(p.factoryCalls,1);assert.equal(p.defaultCalls,0);assert.equal(p.canvasId,'game');
        assert.ok(p.draws>0);assert.equal(p.begins,p.draws);assert.equal(p.ends,p.draws);
        const s=await snapshot(session.page);assert.equal(s.renderer.renderer,'custom-contract-fixture');assert.equal(s.renderer.drawCalls,7);
        verifyErrors(session);
      }finally{await session.context.close();}
    });
    await t.test('afterUI receives actual menu, selected track, running and paused states',async()=>{
      const session=await preparePage(browser,server.url+'?custom=1&ui=1');
      try{
        const page=session.page;assert.equal(await page.locator('#message').textContent(),'Scoped UI hook menu');
        await page.locator('[data-level="2"]').click();
        await page.waitForFunction(()=>probe.ui.some(x=>x.phase==='menu'&&x.level===2));
        await tap(page,'Enter');await page.waitForFunction(()=>probe.ui.some(x=>x.phase==='playing'&&x.modelTick>0&&!x.paused));
        await tap(page,'p');await page.waitForFunction(()=>probe.ui.at(-1).paused===true);
        const paused=await snapshot(page);await delay(220);assert.deepEqual((await snapshot(page)).model,paused.model);
        const p=await page.evaluate(()=>JSON.parse(JSON.stringify(probe.ui.at(-1))));assert.equal(p.phase,'playing');assert.equal(p.level,2);assert.equal(p.phoneConnected,false);assert.equal(p.disconnected,false);
        await tap(page,'p');await page.waitForFunction(()=>!probe.ui.at(-1).paused);verifyErrors(session);
      }finally{await session.context.close();}
    });
  }finally{if(browser)await browser.close();if(server)await server.close();await rm(temporary,{recursive:true,force:true});}
});
