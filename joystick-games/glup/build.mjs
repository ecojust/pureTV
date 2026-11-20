import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
const root=path.dirname(fileURLToPath(import.meta.url));
const original=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
const loader=[...original.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('document.write'));
const scripts=[];
vm.runInNewContext(loader,{location:{protocol:'https:',search:''},navigator:{},document:{write(s){scripts.push(/src="([^"?]+)/.exec(s)[1]);}},addEventListener(){}});
const controller=(await esbuild.build({absWorkingDir:root,entryPoints:['src/tv-input.mjs'],bundle:true,format:'iife',globalName:'TVInput',write:false,target:'es2020',legalComments:'inline'})).outputFiles[0].text;
const inline=s=>s.replace(/<\/script/gi,'<\\/script');
let html=original.replace(/<link[^>]+(?:manifest|icon|stylesheet)[^>]*>/g,'').replace(/<script>[\s\S]*?<\/script>/g,'');
html=html.replace('</head>',()=>'<style>'+fs.readFileSync(path.join(root,'src/style.css'))+'\n'+fs.readFileSync(path.join(root,'src/tv.css'))+'</style></head>');
html=html.replace('</body>',()=>'<script>'+inline(controller)+'</script>'+scripts.map(file=>'<script>'+inline(fs.readFileSync(path.join(root,'src',file),'utf8'))+'</script>').join('\n')+'<script>'+inline(fs.readFileSync(path.join(root,'src/tv-adapter.js'),'utf8'))+'</script></body>');
// Compile the exact packed scripts: replacement-string $ tokens in upstream code must stay literal.
for (const [index, script] of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].entries()) new vm.Script(script[1], { filename: 'tv-inline-' + index + '.js' });
const files={'tv.html':Buffer.from(html),'THIRD-PARTY-NOTICES.txt':fs.readFileSync(path.join(root,'NOTICE.md'))};
const out=path.join(root,'dist');
if(process.argv.includes('--check')) {if(JSON.stringify(fs.readdirSync(out).sort())!==JSON.stringify(Object.keys(files).sort()))throw Error('Unexpected dist inventory');for(const [name,body] of Object.entries(files))if(!body.equals(fs.readFileSync(path.join(out,name))))throw Error('Stale '+name);console.log('Verified frozen GLUP distribution');}
else {fs.mkdirSync(out,{recursive:true});for(const [name,body] of Object.entries(files))fs.writeFileSync(path.join(out,name),body);console.log('Built offline GLUP',files['tv.html'].length,'bytes');}
