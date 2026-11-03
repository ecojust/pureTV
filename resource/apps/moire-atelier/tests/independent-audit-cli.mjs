/* PUBLIC-only explicit-file CLI. No discovery, globs, production import, or dynamic code loading. */
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {auditFullRun, auditSparseSegments, auditEndpoint} from './independent-audit.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const modes = {'--full': auditFullRun, '--sparse': auditSparseSegments, '--endpoint': auditEndpoint};
const argumentsList = process.argv.slice(2), jobs = [];
let output = null;
for (let i = 0; i < argumentsList.length; i += 2) {
  const flag = argumentsList[i], path = argumentsList[i + 1];
  if (!path || flag !== '--out' && !Object.hasOwn(modes, flag)) throw new Error('Usage: --full PUBLIC.json | --sparse PUBLIC.json | --endpoint PUBLIC.json ... [--out REPORT.json]');
  if (flag === '--out') {
    if (output !== null) throw new Error('Only one explicit output path is allowed.');
    output = path;
  } else jobs.push({flag, path});
}
if (!jobs.length) throw new Error('At least one explicitly named PUBLIC projection is required.');
if (output && jobs.some(job => resolve(job.path) === resolve(output))) throw new Error('Output cannot replace an input projection.');
const results = jobs.map(job => {
  const bytes = readFileSync(job.path);
  return {input: job.path, sha256: sha256(bytes), report: modes[job.flag](JSON.parse(bytes.toString('utf8')))};
});
const sourceFiles = ['independent-audit.mjs', 'independent-audit-cli.mjs'].map(name => {
  const path = fileURLToPath(new URL(name, import.meta.url));
  return {path, sha256: sha256(readFileSync(path))};
});
const summary = {ok: results.every(result => result.report.ok), sourceFiles, inputs: results.length,
  counts: {endpoints: 0, fullPairs: 0, sparseIntervals: 0, declaredBoundaryGaps: 0},
  failedInputs: results.filter(result => !result.report.ok).map(result => result.input), results};
for (const result of results) for (const key of Object.keys(summary.counts)) summary.counts[key] += result.report.counts[key];
const serialized = JSON.stringify(summary, null, 2) + '\n';
if (output) writeFileSync(output, serialized, {flag: 'wx'});
process.stdout.write(JSON.stringify({ok: summary.ok, sourceFiles, inputs: summary.inputs,
  counts: summary.counts, failedInputs: summary.failedInputs, output}, null, 2) + '\n');
if (!summary.ok) process.exitCode = 1;
