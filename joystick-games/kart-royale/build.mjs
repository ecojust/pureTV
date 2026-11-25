import { localizeHtml } from '../shared/web/localize-html.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';
const root=path.dirname(fileURLToPath(import.meta.url)),out=path.join(root,'dist'),check=process.argv.includes('--check');
// Always resolve the fixed runtime packages from this adapter's root lock.
// preserveSymlinks keeps dependency module IDs stable for local cache links and clean CI installs.
const runtimePackages=['three','n8ao','postprocessing','simplex-noise'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=p=>fs.existsSync(p)?fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]):[];
const result=await esbuild.build({absWorkingDir:root,preserveSymlinks:true,alias:Object.fromEntries(runtimePackages.map(name=>[name,path.join(root,'node_modules',name)])),entryPoints:['src/src/main.ts'],outfile:'dist/kart-royale.js',bundle:true,write:false,format:'iife',target:'es2020',legalComments:'inline',metafile:true});
const files=new Map(result.outputFiles.map(f=>[path.basename(f.path),f.contents]));
let html=fs.readFileSync(path.join(root,'src/index.html'),'utf8').replace('<script type="module" src="/src/main.ts"></script>','<script defer src="kart-royale.js"></script>').replace('</head>','<link rel="stylesheet" href="kart-royale.css"></head>').replace('href="/manifest.webmanifest"','href="manifest.webmanifest"');
// Platform analytics are not part of the offline game.
html=html.replace(/\s*<!-- Vercel Web Analytics[\s\S]*?<\/script>/,'');
files.set('tv.html',Buffer.from(await localizeHtml(html,root)));files.set('manifest.webmanifest',fs.readFileSync(path.join(root,'src/public/manifest.webmanifest')));
const licenses=[fs.readFileSync(path.join(root,'NOTICE.md'),'utf8'),fs.readFileSync(path.join(root,'LICENSE'),'utf8')];
for(const name of runtimePackages){
 const base=path.join(root,'node_modules',name);const candidate=fs.readdirSync(base).find(x=>/^license(?:\.|$)/i.test(x));if(!candidate)throw new Error('Missing license '+name);licenses.push('\n'+name+'\n'+fs.readFileSync(path.join(base,candidate),'utf8'));
}
files.set('THIRD-PARTY-NOTICES.txt',Buffer.from(licenses.join('\n\n')));
const names=[...files.keys()].sort();
if(check){if(JSON.stringify(walk(out).map(p=>path.relative(out,p)).sort())!==JSON.stringify(names))throw Error('Inventory changed');for(const[name,bytes]of files)if(!Buffer.from(bytes).equals(fs.readFileSync(path.join(out,name))))throw Error('Stale '+name);console.log('Verified '+names.length+' files');}
else{fs.mkdirSync(out,{recursive:true});for(const p of walk(out))if(!files.has(path.relative(out,p)))fs.unlinkSync(p);for(const[name,bytes]of files)fs.writeFileSync(path.join(out,name),bytes);fs.mkdirSync(path.join(root,'docs'),{recursive:true});fs.writeFileSync(path.join(root,'docs/build-inputs.json'),JSON.stringify({tool:'esbuild0.28.2',inputs:Object.keys(result.metafile.inputs).sort().map(name=>{const b=fs.readFileSync(path.resolve(root,name));return{path:name,bytes:b.length,sha256:sha(b)}}),distribution:[...files].map(([name,b])=>({path:name,bytes:b.length,sha256:sha(b)}))},null,2)+'\n');console.log('Built '+names.length+' files / '+[...files.values()].reduce((s,b)=>s+b.length,0)+' bytes');}
