// Targeted ordinary-input renderer regression after corner-coordinate overlap fix.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'corrected-coordinate-gutter-browser-preview',scope:'Actual5x5/7x7 initial corner focus at both sizes, then a normal7x7 capture. No model/clock writes.',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function neutral(p){await p.waitForFunction(()=>{const s=PureTVQA.snapshot().model;return s.inputArmed&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';});}
async function press(p,key){await neutral(p);const before=await snapshot(p);await p.keyboard.down(key);try{await p.waitForFunction(({key,call})=>{const s=PureTVQA.snapshot().model;return s.calls>call&&(key==='Space'?s.lastHeld.a:s.lastHeld.direction===({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[key]));},{key,call:before.model.calls});}finally{await p.keyboard.up(key);}await neutral(p);}
async function cursor(p,to){for(let i=0;i<30;i++){const s=(await snapshot(p)).model;if(s.cursor===to)return;const r=Math.floor(s.cursor/s.size),c=s.cursor%s.size,tr=Math.floor(to/s.size),tc=to%s.size;await press(p,r!==tr?(r<tr?'ArrowDown':'ArrowUp'):(c<tc?'ArrowRight':'ArrowLeft'));}throw Error('Cursor did not settle');}
try{
 for(const level of [0,2]){const session=await preparePage(browser,server.url),p=session.page;try{await p.locator(`[data-level="${level}"]`).click();await p.waitForFunction(v=>PureTVQA.snapshot().level===v,level);await p.keyboard.down('Enter');try{await p.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');}finally{await p.keyboard.up('Enter');}await neutral(p);await cursor(p,0);const q=await snapshot(p);assert.equal(q.model.cursor,0);assert.equal(q.model.board[0],2);assert.equal(q.model.playerTurns,0);const screenshots=[];
  for(const viewport of [{width:1280,height:720},{width:960,height:540}]){await p.setViewportSize(viewport);await delay(60);const file=path.join(output,`gutter-${q.model.size}x${q.model.size}-${viewport.width}.png`);await inspectFrame(p,file);screenshots.push({file,state:await snapshot(p)});}
  if(level===2){await cursor(p,1);await press(p,'Space');await cursor(p,18);const s=(await snapshot(p)).model;assert.equal(s.captures.player,1);assert.equal(s.board[18],2);const file=path.join(output,'corrected-white-group-960.png');await inspectFrame(p,file);screenshots.push({file,state:await snapshot(p)});}
  verifyErrors(session);report.tests.push({level,size:q.model.size,passed:true,screenshots});console.log('PASS corrected '+q.model.size+'x'+q.model.size+' coordinate gutters');
 }finally{await session.context.close();}}
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
