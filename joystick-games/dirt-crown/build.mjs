import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const check=process.argv.includes('--check');const i=process.argv.indexOf('--output');const out=i<0?path.join(root,'dist'):path.resolve(process.argv[i+1]);
const files=new Map();
function walk(dir,prefix=''){for(const n of fs.readdirSync(dir).sort()){const p=path.join(dir,n),rel=prefix+n;if(fs.lstatSync(p).isSymbolicLink())throw Error('Symlink '+p);if(fs.statSync(p).isDirectory())walk(p,rel+'/');else if(!['manifest.webmanifest','vendor/fonts/upstream.css','lib/pwa.js','lib/a11y.js','lib/page-audio.js'].includes(rel)){files.set(rel==='index.html'?'tv.html':rel,fs.readFileSync(p));}}}
walk(path.join(root,'src'));
for(const n of ['input.js','controller-clients.js'])files.set('shared/web/'+n,fs.readFileSync(path.join(root,'../shared/web',n)));
files.set('THIRD-PARTY-NOTICES.txt',fs.readFileSync(path.join(root,'NOTICE.md')));
for(const [p,b] of files)if(/\.(html|css)$/.test(p)&&/\b(?:src|href)\s*=\s*["']https?:|url\(\s*["']?https?:/.test(b.toString()))throw Error('External runtime resource '+p);
// Resolve every static module edge from the actual distribution, not only stage.js imports.
for (const [p,b] of files) if (p.endsWith('.js')) {
  for(const match of b.toString().matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
    const name=match[1];
    const resolved=name==='three'?'vendor/three/build/three.module.js':name.startsWith('three/addons/')?'vendor/three/examples/jsm/'+name.slice(13):name.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(p),name)):null;
    if(!resolved||!files.has(resolved))throw Error('Unresolved module '+p+' -> '+name);
  }
}
// Verify all vendored fixed dependencies before emitting anything.
for(const d of JSON.parse(fs.readFileSync(path.join(root,'dependency-lock.json'))).files){const p=path.join(root,'src',d.path);if(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==d.sha256)throw Error('Dependency hash mismatch '+d.path);}
const listed=Object.fromEntries([...files].map(([p,b])=>[p,{bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}]));
files.set('asset-provenance.json',Buffer.from(JSON.stringify({schemaVersion:1,game:'dirt-crown',files:listed},null,2)+'\n'));
function actual(dir,prefix=''){return fs.existsSync(dir)?fs.readdirSync(dir).flatMap(n=>fs.statSync(path.join(dir,n)).isDirectory()?actual(path.join(dir,n),prefix+n+'/'):[prefix+n]).sort():[];}
if(check){if(JSON.stringify(actual(out))!==JSON.stringify([...files.keys()].sort()))throw Error('Unexpected or missing dist file');for(const[p,b]of files)if(!b.equals(fs.readFileSync(path.join(out,p))))throw Error('Stale dist/'+p);}else{fs.mkdirSync(out,{recursive:true});for(const[p,b]of files){const dest=path.join(out,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);}}
console.log(`${check?'Verified':'Built'} ${files.size} offline files, ${[...files.values()].reduce((n,b)=>n+b.length,0)} bytes`);
