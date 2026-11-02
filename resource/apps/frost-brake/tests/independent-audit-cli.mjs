// No production imports, model execution, input generation, or browser replay.
// Root must fully read both this file and public-analytic-auditor.mjs before use.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {auditOrdinary,auditBrowserSparse} from './public-analytic-auditor.mjs';

const paths=process.argv.slice(2);
if(paths.length===0)throw new Error('Supply actual public ordinary or sparse browser JSON corpus paths.');
const reports=[];
for(const path of paths) {
  const bytes=readFileSync(path);
  const corpus=JSON.parse(bytes.toString('utf8'));
  if(Object.prototype.hasOwnProperty.call(corpus,'pilotDiagnostics')) {
    throw new Error(`Public projection required: ${path} still contains the prohibited top-level diagnostic field.`);
  }
  const audit=corpus.kind==='ordinary'?auditOrdinary:
    corpus.kind==='browser-sparse'?auditBrowserSparse:null;
  if(!audit)throw new Error(`Unsupported actual-evidence kind in ${path}`);
  reports.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),...audit(corpus)});
}
const result={schema:'frost-brake-independent-audit-batch-v1',
  status:reports.some(r=>r.status==='failed')?'failed':
    reports.some(r=>r.status==='review-required')?'review-required':'passed',reports};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(result.status!=='passed')process.exitCode=1;
