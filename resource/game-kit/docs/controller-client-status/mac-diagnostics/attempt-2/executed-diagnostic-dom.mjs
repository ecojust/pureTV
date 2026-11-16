#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../../../../../',import.meta.url)),output=path.resolve(process.argv[2]||'');
assert.ok(process.argv[2]);await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0);
const require=createRequire(process.env.PURETV_PACKAGE||path.join(root,'desktop/package.json')),{chromium}=require('playwright');
const files=['resource/apps/neon-rush/macos/Sources/main.swift','resource/apps/neon-rush/macos/tests/verify-native.py','resource/game-kit/web/puretv-controller.js'];
const source=await readFile(path.join(root,files[0]),'utf8'),start=source.indexOf('    private func writeDiagnostics()'),match=source.slice(start).match(/let script = """\n([\s\S]*?)\n        """/);
assert.ok(match);const script=match[1].split('\n').map(line=>line.startsWith('        ')?line.slice(8):line).join('\n');
await writeFile(path.join(output,'executed-diagnostic-script.js'),script);await copyFile(fileURLToPath(import.meta.url),path.join(output,'executed-diagnostic-dom.mjs'));
const report={status:'running',scope:'Extracted macOS diagnostic JavaScript against a synthetic Chromium DOM; not a macOS app run or gameplay validation',sourceHashes:{},cases:[],physicalTvTested:false,physicalEsp32Tested:false,nativeMacOSAppTested:false};
for(const file of files){const b=await readFile(path.join(root,file));report.sourceHashes[file]=createHash('sha256').update(b).digest('hex');await writeFile(path.join(output,'executed-'+path.basename(file)),b);}
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><html lang="en"><head></head><body><div id="clip" style="width:200px;margin:20px"><div id="clients"></div></div></body></html>');
 await page.addScriptTag({path:path.join(root,files[2])});
 await page.evaluate(()=>{window.nativeSnapshotCalls=0;window.Android={snapshot(){nativeSnapshotCalls++;throw Error('Diagnostic must not poll native input');}};PureTVControllerAdapter.renderClients(document.getElementById('clients'),[{id:1,transport:'wifi',connected:true,controllerId:'virtual-0123456789ab'}],{language:'en'});});
 async function sample(name,assertion){const value=await page.evaluate(script);assertion(value);report.cases.push({name,status:'passed',document:value.document});}
 await sample('normal connected card reports exact ID, seat, icon and complete text',value=>{const rows=value.document.controllerClients;assert.equal(rows.length,1);assert.equal(rows[0].controllerId,'virtual-0123456789ab');assert.equal(rows[0].playerId,'1');assert.equal(rows[0].idText,'ID: virtual-0123456789ab');assert.equal(rows[0].visible,true);assert.equal(rows[0].fullyVisible,true);assert.equal(rows[0].iconVisible,true);assert.equal(rows[0].idTextFullyVisible,true);});
 await page.evaluate(()=>document.getElementById('clients').hidden=true);
 await sample('a hidden ancestor cannot appear as a visible controller',value=>{assert.equal(value.document.controllerClients[0].visible,false);assert.equal(value.document.controllerClients[0].idTextFullyVisible,false);});
 await page.evaluate(()=>{document.getElementById('clients').hidden=false;Object.assign(document.getElementById('clip').style,{overflow:'hidden',height:'20px'});});
 await sample('partially clipped cards fail full visibility and ID range checks',value=>{const row=value.document.controllerClients[0];assert.equal(row.visible,true);assert.equal(row.fullyVisible,false);assert.equal(row.idTextFullyVisible,false);});
 await page.evaluate(()=>{Object.assign(document.getElementById('clip').style,{overflow:'visible',height:'auto',position:'absolute',left:'980px'});});
 await sample('offscreen cards are not counted as visible',value=>assert.equal(value.document.controllerClients[0].visible,false));
 await page.evaluate(()=>{Object.assign(document.getElementById('clip').style,{position:'static',left:'auto'});Object.assign(document.querySelector('.ptv-client-id').style,{width:'36px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});});
 await sample('ellipsis and a clipped text range cannot pass',value=>{const row=value.document.controllerClients[0];assert.equal(row.idTextOverflow,'ellipsis');assert.equal(row.idTextFullyVisible,false);});
 assert.equal(await page.evaluate(()=>nativeSnapshotCalls),0);assert.deepEqual(errors,[]);report.pageErrors=errors;report.nativeSnapshotCalls=0;report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;}finally{if(browser)await browser.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length}));}
