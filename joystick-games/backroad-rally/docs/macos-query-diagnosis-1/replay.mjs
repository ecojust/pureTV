import {createServer} from 'node:http';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {dirname,join} from 'node:path';
import assert from 'node:assert/strict';
const here=dirname(new URL(import.meta.url).pathname),root=join(here,'frozen'),file=join(root,'joystick-games/backroad-rally/dist/data/menu.json');
const bytes=readFileSync(file),hash=createHash('sha256').update(bytes).digest('hex').slice(0,10);
const swift=readFileSync(join(root,'joystick-games/shared/macos/Sources/LocalAssetServer.swift'),'utf8');
assert(swift.includes('guard target.hasPrefix("/"), !target.contains("?"), !target.contains("#")'));
let rejectQuery=true;const requests=[];
const server=createServer((req,res)=>{
 const target=req.url;const accepted=target.startsWith('/')&&!target.includes('#')&&(!rejectQuery||!target.includes('?'));
 requests.push({target,status:accepted?200:400,mode:rejectQuery?'original-query-rejection':'query-separated-fixture'});
 if(!accepted){res.writeHead(400);res.end('Bad Request');return;}
 const path=target.split('?')[0];assert.equal(path,'/data/menu.json');res.writeHead(200,{'Content-Type':'application/json'});res.end(bytes);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
try {
 const original=readFileSync(join(root,'joystick-games/backroad-rally/src/upstream/src/data.ts'),'utf8');
 const loaderPath=join(here,'original-loader-with-build-defines.mts');
 writeFileSync(loaderPath,`const __PUBLIC_HASHES__=${JSON.stringify({'data/menu.json':hash})};\nconst __GLB_GZ__=false;\nimport.meta.env={BASE_URL:${JSON.stringify(base)}};\n`+original);
 const rejected=await import(pathToFileURL(loaderPath));assert.equal(rejected.publicUrl('data/menu.json'),base+'data/menu.json?v='+hash);
 let caught='';await rejected.load('menu.json').catch(e=>{caught=String(e);});assert.equal(caught,'Error: data/menu.json: HTTP 400');
 rejectQuery=false;
 // A fresh module instance gives the original promise cache a clean load after
 // the fixture changes behavior; never re-use a failed or cached HTTP response.
 const allowed=await import(pathToFileURL(loaderPath).href+'?second-module');
 const value=await allowed.load('menu.json');assert.deepEqual(value,JSON.parse(bytes));
 const navPath=join(here,'original-navigation.mts');writeFileSync(navPath,readFileSync(join(root,'joystick-games/backroad-rally/src/upstream/src/menu/nav.ts')));
 const nav=await import(pathToFileURL(navPath));const query=nav.playQuery({mode:'quick',stage:'finland',reverse:false,car:'swift',livery:0,cond:'stage',weather:'clear'});
 const main=readFileSync(join(root,'joystick-games/shared/macos/Sources/main.swift'),'utf8');assert(main.includes('url.path == pageURL.path, url.query == nil'));
 assert.equal(query,'?mode=quick&stage=finland&car=swift&cond=stage&weather=clear');
 const result={scope:'Actual original data loader and navigation functions executed in Node TypeScript type-stripping mode against a source-equivalent HTTP query-rejection fixture. This is not Swift/WKWebView or GPU execution.',sourceSha:'ea7854ca06ed53967aed00fe160034185f2906b3',nodeVersion:process.version,menuHash:hash,originalLoaderError:caught,requests,originalSamePageNavigationQuery:query,originalWKQueryNilGuardWouldReject:true,originalGameLoaderUnmodifiedBeyondBuildDefines:true,querySeparatedFixtureReturnsOriginalJson:true,productionFilesChanged:false};
 writeFileSync(join(here,'replay-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await new Promise(r=>server.close(r));}
