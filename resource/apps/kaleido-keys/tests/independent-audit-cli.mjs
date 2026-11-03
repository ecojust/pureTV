/* Explicit PUBLIC JSON inputs only. No discovery, game imports, private helper or dynamic code loading. */
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditEndpoint, auditFullRun, auditSparseSegments} from './independent-audit.mjs';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const modes = {'--endpoint': auditEndpoint, '--full': auditFullRun, '--sparse': auditSparseSegments};
const args = process.argv.slice(2), jobs = []; let output = null;
for (let i = 0; i < args.length; i += 2) {
  const flag = args[i], path = args[i + 1];
  if (!path || flag !== '--out' && !Object.hasOwn(modes, flag)) throw new Error('Usage: --full PUBLIC.json | --sparse PUBLIC.json | --endpoint PUBLIC.json ... [--out NEW-REPORT.json]');
  if (flag === '--out') { if (output !== null) throw new Error('Only one explicit output path allowed.'); output = path; }
  else jobs.push({flag, path});
}
if (!jobs.length) throw new Error('At least one explicitly named public projection required.');
if (output && jobs.some(job => resolve(job.path) === resolve(output))) throw new Error('Output cannot replace an input.');
const results = jobs.map(job => {
  const bytes = readFileSync(job.path);
  return {input: job.path, sha256: digest(bytes), report: modes[job.flag](JSON.parse(bytes.toString('utf8')))};
});
const sourceFiles = ['independent-audit.mjs', 'independent-audit-cli.mjs'].map(name => {
  const path = fileURLToPath(new URL(name, import.meta.url)); return {path, sha256: digest(readFileSync(path))};
});
const summary = {ok: results.every(result => result.report.ok), sourceFiles, inputs: results.length,
  counts: {endpoints: 0, fullPairs: 0, sparseIntervals: 0, declaredBoundaryGaps: 0},
  failedInputs: results.filter(result => !result.report.ok).map(result => result.input), results};
for (const result of results) for (const key of Object.keys(summary.counts)) summary.counts[key] += result.report.counts[key];
if (output) writeFileSync(output, JSON.stringify(summary, null, 2) + '\n', {flag: 'wx'});
process.stdout.write(JSON.stringify({ok: summary.ok, sourceFiles, inputs: summary.inputs, counts: summary.counts,
  failedInputs: summary.failedInputs, output}, null, 2) + '\n');
if (!summary.ok) process.exitCode = 1;
