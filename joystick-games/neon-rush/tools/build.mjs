import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const check=process.argv.includes('--check');
const outputs=[['source/model-entry.mjs','game-model.js'],['source/game.mjs','game.js']];
await mkdir(path.join(root,'src/main/assets'),{recursive:true});
for(const [entry,name] of outputs){
 const result=await build({entryPoints:[path.join(root,entry)],bundle:true,format:'iife',platform:'browser',target:['es2017'],minify:true,legalComments:'inline',write:false,logLevel:'warning'});
 const data=result.outputFiles[0].contents;const dest=path.join(root,'src/main/assets',name);
 if(check){const old=await readFile(dest);if(!old.equals(Buffer.from(data)))throw new Error(name+' is stale; run npm run build');}
 else await writeFile(dest,data);
 console.log((check?'Verified ':'Built ')+name+' '+data.length+' bytes');
}
const licenses=[['node_modules/three/LICENSE','THREE-LICENSE.txt'],['LICENSE','LICENSE.txt']];
for(const [source,target]of licenses){const data=await readFile(path.join(root,source));const dest=path.join(root,'src/main/assets',target);if(check){if(!(await readFile(dest)).equals(data))throw Error('License mismatch: '+target);}else await writeFile(dest,data);}
