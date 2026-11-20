#!/usr/bin/env node
// Synthetic native-bridge layout checks. No TCP, Android, model or clock writes.
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {parseArgs,launch,serveAssets,sourceHashes,delay} from '../../../resource/game-kit/qa/common.mjs';
const args=parseArgs(), output=path.resolve(args.output), assetsRoot=path.resolve(args['assets-root']);
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Use a new output directory.');
await copyFile(fileURLToPath(import.meta.url),path.join(output,'executed-run-layout.mjs'));
const slugs=['tank','jackal','jewel','tetris','super-mario','bomb-jack','adventure-island'];
const bridges={tank:'TankHost',jackal:'JackalHost',jewel:'JewelHost',tetris:'TetrisHost','super-mario':'MarioHost','bomb-jack':'BombJackHost','adventure-island':'AdventureHost'};
const report={status:'running',mode:'synthetic native-bridge browser layout',modelWrites:false,clockOverrides:false,physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,androidAppTested:false,protocolTested:false,games:[]};
const browser=await launch();
try{
 for(const slug of slugs){
  const assets=path.join(assetsRoot,slug), hashes=await sourceHashes(assets),server=await serveAssets(assets);
  const game={slug,sourceHashes:hashes,cases:[]};report.games.push(game);
  try{
   for(const viewport of [{width:960,height:540},{width:1280,height:720}]){
    const language=viewport.width===960?'zh':'en', context=await browser.newContext({viewport,deviceScaleFactor:1});
    const result={viewport,language,status:'running',screenshots:[],errors:[]};game.cases.push(result);
    await context.addInitScript(({name,language})=>{
     const fixture={players:[],reads:0};window.__controllerLayoutFixture=fixture;
     window[name]={getInfo(){return JSON.stringify({language,url:'http://192.0.2.20:8080/',qr:'',wifiController:{state:'available',port:63485,addresses:['192.0.2.20'],connected:fixture.players.some(p=>p.connected&&p.transport==='wifi')}});},snapshot(){fixture.reads++;return JSON.stringify({players:fixture.players});},publish(){},exit(){}};
    },{name:bridges[slug],language});
    const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
    try{
     await page.goto(server.url);await page.waitForFunction(()=>!!window.PureTVQA?.snapshot().model,null,{timeout:30000});
     await page.waitForFunction(()=>document.getElementById('wifi-clients')?.hidden===true);
     async function pressStart(){
      const before=await page.evaluate(()=>window.PureTVQA.snapshot().phase);
      await page.keyboard.down('p');
      await page.waitForFunction(previous=>{const s=window.PureTVQA.snapshot();return s.controllers.some(p=>p.id===1&&p.start)||s.phase!==previous;},before);
      await page.keyboard.up('p');
      await page.waitForFunction(()=>window.PureTVQA.snapshot().controllers.every(p=>p.id!==1||!p.start));
     }
     const player=(id,controllerId,session='one')=>({id,controllerId,session,transport:'wifi',connected:true,x:0,y:0,a:false,b:false,start:false,select:false,cancelSeq:0});
     const first=player(1,'esp32-001122334455'),second=player(2,'esp32-aabbccddeeff');
     async function connect(players){await page.evaluate(value=>{window.__controllerLayoutFixture.players=value;},players);await page.waitForFunction(ids=>JSON.stringify([...document.querySelectorAll('[data-puretv-controller-id]')].map(n=>n.dataset.puretvControllerId))===JSON.stringify(ids),players.filter(p=>p.connected&&p.transport==='wifi').map(p=>p.controllerId));}
     async function inspect(label){
      const data=await page.evaluate(()=>{
       const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
       const rail=document.querySelector('.sidebar'),clients=document.getElementById('wifi-clients');
       return {phase:window.PureTVQA.snapshot().phase,document:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},sidebar:{...box(rail),clientHeight:rail.clientHeight,scrollHeight:rail.scrollHeight,scrollTop:rail.scrollTop},clients:{...box(clients),hidden:clients.hidden},rows:[...clients.querySelectorAll('[data-puretv-controller-id]')].map(n=>({id:n.dataset.puretvControllerId,player:n.dataset.playerId,text:n.textContent,...box(n)}))};
      });
      assert.ok(data.document.scrollWidth<=viewport.width+1&&data.document.scrollHeight<=viewport.height+1,label+' document overflow');
      assert.ok(!data.clients.hidden&&data.clients.x>=-1&&data.clients.right<=viewport.width+1&&data.clients.y>=-1&&data.clients.bottom<=viewport.height+1,label+' clients visible');
      for(const row of data.rows){assert.ok(row.text.includes(row.id),label+' full ID retained');assert.ok(row.x>=data.clients.x-1&&row.right<=data.clients.right+1&&row.y>=data.clients.y-1&&row.bottom<=data.clients.bottom+1,label+' row is inside client panel');}
      const file=slug+'-'+viewport.width+'-'+label+'.png';await page.screenshot({path:path.join(output,file)});result.screenshots.push({file,observations:data});return data;
     }
     await connect([first]);await inspect('one-controller');
     await connect([first,second]);const two=await inspect('two-controllers');assert.deepEqual(two.rows.map(p=>p.player),['1','2']);
     let phase=two.phase;
     for(let n=0;n<3&&['title','attract','loading'].includes(phase);n++){await pressStart();await delay(220);phase=await page.evaluate(()=>window.PureTVQA.snapshot().phase);}
     result.ordinaryStartPhase=phase;assert.ok(!['title','attract','loading'].includes(phase),'Ordinary START leaves menu');
     // Tank's stage selector requires a second ordinary START before its countdown.
     if(slug==='tank'&&phase==='stageintro'){await pressStart();await delay(100);}
     await page.waitForFunction(()=>window.PureTVQA.snapshot().phase==='playing',null,{timeout:30000});await inspect('playing');
     await pressStart();await delay(230);await inspect('paused');
     await connect([first]);assert.equal(await page.locator('[data-puretv-controller-id]').count(),1);
     await connect([]);assert.ok(await page.locator('#wifi-clients').isHidden(),'Disconnected clients disappear even when keyboard is active.');
     await connect([player(1,first.controllerId,'two'),second]);await inspect('reconnected');
     const long=[player(1,'esp32-'+('0123456789abcdef'.repeat(7))),player(2,'virtual-'+('fedcba9876543210'.repeat(7)))];
     await connect(long);await inspect('long-identities');
     await page.locator('.sidebar').evaluate(n=>{n.scrollTop=n.scrollHeight;});await delay(100);await inspect('scrolled-identities');
     await connect([{...first,transport:'phone'}]);assert.ok(await page.locator('#wifi-clients').isHidden(),'Phone connection must not show a Wi-Fi identity.');
     assert.deepEqual(result.errors,[]);result.status='passed';
    }catch(error){result.status='failed';result.error=error.stack;result.failureSnapshot=await page.evaluate(()=>window.PureTVQA?.snapshot()).catch(()=>null);await page.screenshot({path:path.join(output,slug+'-'+viewport.width+'-failure.png')}).catch(()=>{});throw error;}
    finally{await context.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
   }
   assert.deepEqual(await sourceHashes(assets),hashes,'Loaded assets remain unchanged.');
  }finally{await server.close();}
 }
 report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;}
finally{await browser.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,games:report.games.length,cases:report.games.reduce((n,g)=>n+g.cases.length,0)}));}
