#!/usr/bin/env node
// Explicit public JSON paths only. Original inputs remain at their hashed paths;
// reports contain references/findings, not redundant complete snapshot copies.
import {readFileSync,openSync,writeSync,closeSync,writeFileSync,realpathSync,existsSync} from 'node:fs';
import {resolve,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const cli=fileURLToPath(import.meta.url),checker=fileURLToPath(new URL('./independent-audit.mjs',import.meta.url));
const digest=v=>createHash('sha256').update(v).digest('hex');
const actual=p=>existsSync(p)?realpathSync(p):resolve(realpathSync(dirname(p)),basename(p));
let output=null,sidecar=null,fd=null,currentInput=null,bytesWritten=0;
const startedAt=new Date().toISOString();
function write(value){const b=Buffer.from(value);let at=0;while(at<b.length){const n=writeSync(fd,b,at,b.length-at);if(n<=0)throw new Error('Zero-byte report write');at+=n;bytesWritten+=n;}}
try{
  const args=process.argv.slice(2),inputs=[];let sparse=false;
  for(let i=0;i<args.length;i++){
    if(args[i]==='--sparse')sparse=true;
    else if(args[i]==='--out'){if(output!==null||!args[i+1])throw new Error('Exactly one --out path required');output=resolve(args[++i]);}
    else if(args[i].startsWith('--'))throw new Error('Unknown option: '+args[i]);
    else inputs.push(resolve(args[i]));
  }
  if(!output||inputs.length===0)throw new Error('Usage: node independent-audit-cli.mjs [--sparse] --out NEW_REPORT.json PUBLIC_INPUT.json [...]');
  const protectedPaths=[cli,checker,...inputs].map(actual);
  if(protectedPaths.includes(actual(output))||protectedPaths.includes(actual(output+'.failure.json')))throw new Error('Report/sidecar must not replace a source or input');
  sidecar=output+'.failure.json';const sourceFiles=[checker,cli].map(path=>({path,sha256:digest(readFileSync(path))}));
  const audit=await import(new URL('./independent-audit.mjs',import.meta.url));
  fd=openSync(output,'wx');write('{"sourceFiles":'+JSON.stringify(sourceFiles)+',"results":[');
  const counts={endpoints:0,fullPairs:0,sparseIntervals:0,declaredBoundaryGaps:0},failedInputs=[];let ok=true;
  for(let i=0;i<inputs.length;i++){
    currentInput=inputs[i];const raw=readFileSync(currentInput),value=JSON.parse(raw.toString('utf8'));
    const report=sparse?audit.auditSparseSegments(value):audit.auditFullRun(value);
    if(i)write(',');write(JSON.stringify({input:currentInput,sha256:digest(raw),bytes:raw.length,report}));
    for(const k of Object.keys(counts))counts[k]+=report.counts[k];
    if(!report.ok){ok=false;failedInputs.push({input:currentInput,findingCount:report.findingCount,omittedFindings:report.omittedFindings});}
  }
  const summary={ok,inputs:inputs.length,counts,failedInputs,export:{startedAt,completedAt:new Date().toISOString(),nodeVersion:process.version,inputRetention:'Original JSON remains at each referenced input path/SHA-256 and must be preserved; findings use JSON paths without duplicate snapshots',scope:sparse?'Actual endpoints only; intervals/lifecycle remain unobserved':'All supplied actual before/after pairs; provenance is not authenticated by hashes',identityLimit:'Serialized JSON does not prove in-memory detachment or accessor/Proxy effects'}};
  write('],'+JSON.stringify(summary).slice(1)+'\n');closeSync(fd);fd=null;
  process.stdout.write(JSON.stringify({ok,output,bytesWritten,sourceFiles,inputs:inputs.length,counts,failedInputs})+'\n');process.exitCode=ok?0:1;
}catch(error){
  const failure={ok:false,kind:'independent-auditor-execution-error',startedAt,failedAt:new Date().toISOString(),input:currentInput,output,bytesWritten,error:{name:String(error?.name||'Error'),message:String(error?.message||error),stack:String(error?.stack||'')},partialReportRetained:fd!==null};
  if(fd!==null){try{closeSync(fd);}catch(e){failure.closeError=String(e?.message||e);}fd=null;}
  if(sidecar){try{writeFileSync(sidecar,JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}catch(e){failure.sidecarError=String(e?.message||e);}}
  process.stderr.write(JSON.stringify(failure)+'\n');process.exitCode=2;
}
