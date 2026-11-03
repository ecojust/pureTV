// Short ordinary-input visual candidate check. This is not a complete gameplay test.
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import R from './reference.cjs';
const args=parseArgs(),assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const server=await serveAssets(assets),browser=await launch(),report={kind:'ordinary-input-preview',sourceAssetHashes:await sourceHashes(assets),screenshots:[],physicalTvTested:false,physicalPhoneTested:false};let session;
async function neutral(){await session.page.waitForFunction(()=>{const q=PureTVQA.snapshot(),s=q.model;return q.phase==='playing'&&!q.paused&&s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';});}
async function press(key){await neutral();await session.page.keyboard.down(key);try{await session.page.waitForFunction(key=>{const s=PureTVQA.snapshot().model;return key==='Space'?s.lastHeld.a:s.lastHeld.direction===key.slice(5).toLowerCase();},key);}finally{await session.page.keyboard.up(key);}await neutral();}
async function frames(label){for(const viewport of [{width:1280,height:720},{width:960,height:540}]){await session.page.setViewportSize(viewport);await delay(120);const file=path.join(output,`${label}-${viewport.width}.png`);await inspectFrame(session.page,file);report.screenshots.push(file);}}
try{session=await preparePage(browser,server.url);await session.page.keyboard.down('Enter');try{await session.page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');}finally{await session.page.keyboard.up('Enter');}await neutral();await frames('initial');
 for(let turn=0;turn<2;turn++){let s=(await snapshot(session.page)).model;const target=R.search(s.board).cell;while(s.cursor!==target){const row=Math.floor(s.cursor/6),col=s.cursor%6,tr=Math.floor(target/6),tc=target%6;await press(row!==tr?(row<tr?'ArrowDown':'ArrowUp'):(col<tc?'ArrowRight':'ArrowLeft'));s=(await snapshot(session.page)).model;}await press('Space');}
 await frames('played');verifyErrors(session);report.state=await snapshot(session.page);report.passed=true;
}catch(e){report.passed=false;report.failure=e.stack;throw e;}finally{if(session)await session.context.close();await browser.close();await server.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
