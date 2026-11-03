#!/usr/bin/env node
// Explicit PUBLIC JSON files only. This file is not executed before source review.
import {readFileSync,openSync,writeSync,closeSync,realpathSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const cliFile=fileURLToPath(import.meta.url),checkerFile=fileURLToPath(new URL('./independent-audit.mjs',import.meta.url));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const actualPath=path=>existsSync(path)?realpathSync(path):resolve(realpathSync(dirname(path)),basename(path));
let output=null,failureSidecar=null,fd=null,currentInput=null,startedAt=new Date().toISOString();
let buffer='',bytesWritten=0;
function flush(){
  if(!buffer)return;const bytes=Buffer.from(buffer,'utf8');let offset=0;
  while(offset<bytes.length){const count=writeSync(fd,bytes,offset,bytes.length-offset);if(count<=0)throw new Error('Zero-byte report write.');offset+=count;bytesWritten+=count;}
  buffer='';
}
function append(text){buffer+=text;if(buffer.length>=16384)flush();}
function string(value){
  append('"');
  // Each slice is JSON-escaped independently. Split surrogate pairs remain exact
  // UTF-16 code units through escaped halves; no giant pretty-printed string.
  for(let i=0;i<value.length;i+=8192)append(JSON.stringify(value.slice(i,i+8192)).slice(1,-1));
  append('"');
}
function json(value,ancestors=new Set()){
  if(value===null){append('null');return;}
  if(typeof value==='string'){string(value);return;}
  if(typeof value==='boolean'){append(value?'true':'false');return;}
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new Error('Nonfinite number cannot be retained as faithful JSON.');
    append(Object.is(value,-0)?'-0':String(value));return;
  }
  if(typeof value!=='object'||ancestors.has(value))throw new Error('Non-JSON value or cycle in complete report.');
  ancestors.add(value);
  if(Array.isArray(value)){
    append('[');for(let i=0;i<value.length;i++){if(i)append(',');json(value[i],ancestors);}append(']');
  }else{
    append('{');let first=true;for(const key of Object.keys(value)){if(!first)append(',');first=false;string(key);append(':');json(value[key],ancestors);}append('}');
  }
  ancestors.delete(value);
}
try{
  const args=process.argv.slice(2),inputs=[];let sparse=false;
  for(let i=0;i<args.length;i++){
    if(args[i]==='--sparse')sparse=true;
    else if(args[i]==='--out'){if(output!==null||!args[i+1])throw new Error('Exactly one --out path required.');output=resolve(args[++i]);}
    else if(args[i].startsWith('--'))throw new Error('Unknown option: '+args[i]);
    else inputs.push(resolve(args[i]));
  }
  if(!output||inputs.length===0)throw new Error('Usage: node independent-audit-cli.mjs [--sparse] --out NEW_REPORT.json PUBLIC_INPUT.json [...].');
  const protectedPaths=[cliFile,checkerFile,...inputs].map(path=>actualPath(path));
  if(protectedPaths.includes(actualPath(output)))throw new Error('Output must not replace any source/input file.');
  if(protectedPaths.includes(actualPath(output+'.failure.json')))throw new Error('Failure sidecar must not replace any source/input file.');
  failureSidecar=output+'.failure.json';
  const sourceFiles=[checkerFile,cliFile].map(path=>({path,sha256:digest(readFileSync(path))}));
  const {auditFullRun,auditSparseSegments}=await import(new URL('./independent-audit.mjs',import.meta.url));
  fd=openSync(output,'wx');append('{"sourceFiles":');json(sourceFiles);append(',"results":[');
  const counts={endpoints:0,fullPairs:0,sparseIntervals:0,declaredBoundaryGaps:0},failedInputs=[];let ok=true;
  for(let i=0;i<inputs.length;i++){
    currentInput=inputs[i];const raw=readFileSync(currentInput),value=JSON.parse(raw.toString('utf8'));
    const report=sparse?auditSparseSegments(value):auditFullRun(value);
    if(i)append(',');json({input:currentInput,sha256:digest(raw),report});
    for(const key of Object.keys(counts))counts[key]+=report.counts[key];
    if(!report.ok){ok=false;failedInputs.push({input:currentInput,findingCount:report.findingCount,omittedFindings:report.omittedFindings});}
  }
  append('],"ok":');json(ok);append(',"inputs":');json(inputs.length);append(',"counts":');json(counts);append(',"failedInputs":');json(failedInputs);
  append(',"export":');json({format:'Complete JSON, bounded buffered stream; original input retained once per result',retainedInputEncoding:'Parsed JSON values and original input-file SHA-256; original whitespace is not re-created',startedAt,completedAt:new Date().toISOString(),nodeVersion:process.version});append('}\n');flush();closeSync(fd);fd=null;
  process.stdout.write(JSON.stringify({ok,sourceFiles,inputs:inputs.length,counts,failedInputs,output,bytesWritten})+'\n');process.exitCode=ok?0:1;
}catch(error){
  const failure={ok:false,kind:'independent-auditor-execution-error',startedAt,failedAt:new Date().toISOString(),input:currentInput,output,bytesWritten,error:{name:String(error?.name||'Error'),message:String(error?.message||error),stack:String(error?.stack||'')},partialReportRetained:fd!==null};
  // Do not retry a buffer after a partial write error: that can duplicate bytes.
  failure.bufferedCharactersAtFailure=buffer.length;
  if(fd!==null){try{closeSync(fd);}catch(closeError){failure.closeError=String(closeError?.message||closeError);}fd=null;}
  failure.bytesWritten=bytesWritten;
  if(failureSidecar){try{writeFileSync(failureSidecar,JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}catch(sidecarError){failure.failureSidecarError=String(sidecarError?.message||sidecarError);}}
  process.stderr.write(JSON.stringify(failure)+'\n');process.exitCode=2;
}
