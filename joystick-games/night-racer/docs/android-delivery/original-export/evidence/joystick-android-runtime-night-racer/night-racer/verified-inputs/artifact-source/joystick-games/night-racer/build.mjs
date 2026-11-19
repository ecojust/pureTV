import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
const root=path.dirname(fileURLToPath(import.meta.url));
const built=await esbuild.build({absWorkingDir:root,entryPoints:['src/src/main.js'],bundle:true,minify:true,format:'iife',write:false,target:'es2020',legalComments:'inline',define:{__CG__:'false'}});
const js=built.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
let html=fs.readFileSync(path.join(root,'src/index.template.html'),'utf8');
html=html.replace(/<link[^>]+https:\/\/fonts\.googleapis\.com[^>]*>/g,'');
html=html.replace('</head>',()=>'<link rel="stylesheet" href="fonts/chakra.css"><style>'+fs.readFileSync(path.join(root,'src/tv.css'),'utf8')+'</style></head>');
html=html.replace('<!--SCRIPT-->',()=>'<script>'+js+'</script>');
const files=new Map([['tv.html',Buffer.from(html)],['THIRD-PARTY-NOTICES.txt',fs.readFileSync(path.join(root,'NOTICE.md'))],['THIRD-PARTY-LICENSES.txt',fs.readFileSync(path.join(root,'THIRD-PARTY-LICENSES.txt'))]]);
function collect(dir,prefix=''){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const name=prefix+item.name,p=path.join(dir,item.name);if(item.isSymbolicLink())throw Error('Symlink asset');if(item.isDirectory())collect(p,name+'/');else files.set(name,fs.readFileSync(p));}}
collect(path.join(root,'src/public'));
const dist=path.join(root,'dist');
if(process.argv.includes('--check')){
 const existing=[];function walk(dir,prefix=''){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(item.isDirectory())walk(path.join(dir,item.name),prefix+item.name+'/');else existing.push(prefix+item.name);}}
 walk(dist);if(JSON.stringify(existing.sort())!==JSON.stringify([...files.keys()].sort()))throw Error('Dist inventory differs');
 for(const [name,bytes]of files)if(!bytes.equals(fs.readFileSync(path.join(dist,name))))throw Error('Stale '+name);
 console.log('Verified',files.size,'exact offline files');
}else{fs.rmSync(dist,{recursive:true,force:true});for(const [name,bytes]of files){const target=path.join(dist,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}console.log('Built',files.size,'files,',[...files.values()].reduce((n,b)=>n+b.length,0),'bytes');}
