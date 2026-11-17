#!/usr/bin/env node
// Public evidence only. Root must read this file and the core before first use.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PUBLIC_DOCUMENT_SHA256, LIMITATIONS, auditModelRun, auditSparseRun} from './independent-audit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS = ['public-design.md', 'model-contract.md', 'public-interface.md'];
const HEX = /^[0-9a-f]{64}$/;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const requireThat = (ok, message) => { if (!ok) throw new Error(message); };
const issue = (verdict, scope, code, message) => ({verdict, scope, code, message});

function argumentsOf(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i], value = argv[i + 1];
    requireThat(['--manifest', '--output'].includes(flag) && typeof value === 'string'
      && value.length > 0 && !value.startsWith('--') && !Object.hasOwn(result, flag),
    'Usage: --manifest public-index.json --output new-report.json; flags must occur once.');
    result[flag] = path.resolve(value);
  }
  requireThat(result['--manifest'] && result['--output'], 'Both --manifest and --output are required.');
  requireThat(result['--manifest'] !== result['--output'], 'Output cannot replace the manifest.');
  return {manifest: result['--manifest'], output: result['--output']};
}

function inspectPath(filename, allowMissing = false) {
  const absolute = path.resolve(filename), root = path.parse(absolute).root;
  let current = root;
  for (const part of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); }
    catch (error) { if (allowMissing && error.code === 'ENOENT') return; throw error; }
    requireThat(!stat.isSymbolicLink(), 'Symlink components are not accepted: ' + current);
    requireThat(current === absolute || stat.isDirectory(), 'A parent path is not a directory.');
  }
}

function readFile(filename) {
  inspectPath(filename);
  requireThat(fs.statSync(filename).isFile(), 'Evidence input must be a regular file.');
  return fs.readFileSync(filename);
}

function parseJson(bytes, label) {
  try { return JSON.parse(bytes.toString('utf8')); }
  catch (error) { throw new Error(label + ': invalid JSON: ' + error.message); }
}

function artifactPath(base, name) {
  requireThat(typeof name === 'string' && name.endsWith('.json') && !path.isAbsolute(name)
    && !name.includes('\\') && !name.includes('\0') && !name.includes(':')
    && name.split('/').every(part => part && part !== '.' && part !== '..'),
  'Artifact path must be a relative JSON path without traversal.');
  const resolved = path.resolve(base, name);
  const relative = path.relative(base, resolved);
  requireThat(relative && !relative.startsWith('..' + path.sep) && relative !== '..'
    && !path.isAbsolute(relative), 'Artifact escapes manifest directory.');
  return resolved;
}

function publicIdentity(report) {
  requireThat(object(PUBLIC_DOCUMENT_SHA256)
    && Object.keys(PUBLIC_DOCUMENT_SHA256).sort().join('|') === [...DOCS].sort().join('|'),
  'Core must pin exactly the three canonical public documents.');
  report.publicDocumentSha256 = {};
  for (const name of DOCS) {
    const actual = digest(readFile(path.resolve(HERE, '../docs', name)));
    report.publicDocumentSha256[name] = actual;
    requireThat(HEX.test(PUBLIC_DOCUMENT_SHA256[name]) && actual === PUBLIC_DOCUMENT_SHA256[name],
      'Canonical public document differs from the reviewed arithmetic specification: ' + name);
  }
  // Hash own checker bytes only; no production/source paths from a receipt are opened.
  report.checkerSha256 = {
    'independent-audit-cli.mjs': digest(readFile(path.join(HERE, 'independent-audit-cli.mjs'))),
    'independent-audit.mjs': digest(readFile(path.join(HERE, 'independent-audit.mjs')))
  };
}

function checkManifest(manifest, base, output, report) {
  requireThat(object(manifest) && manifest.schema === 'parallax-skyline-public-corpus-v1'
    && Array.isArray(manifest.runs) && Array.isArray(manifest.observations), 'Invalid public manifest schema.');
  const paths = new Set(), ids = new Set();
  for (const [section, auditor, destination] of [
    ['runs', auditModelRun, report.runs], ['observations', auditSparseRun, report.observations]
  ]) {
    for (const [index, entry] of manifest[section].entries()) {
      const scope = section + '[' + index + ']';
      try {
        requireThat(object(entry) && HEX.test(entry.sha256), 'Missing exact SHA-256.');
        const filename = artifactPath(base, entry.path);
        requireThat(filename !== output && !paths.has(filename), 'Duplicate artifact or output/input collision.');
        paths.add(filename);
        const bytes = readFile(filename), actual = digest(bytes);
        report.artifacts.push({section, index, path: entry.path, bytes: bytes.length, sha256: actual});
        requireThat(actual === entry.sha256, 'Artifact SHA-256 does not match manifest.');
        const raw = parseJson(bytes, scope);
        requireThat(object(raw) && !Object.hasOwn(raw, 'pilotDiagnostics'), 'Expected public object without pilotDiagnostics.');
        const result = auditor(raw);
        requireThat(object(result) && typeof result.runId === 'string' && result.runId.length > 0
          && ['checked', 'not-observed', 'mismatch'].includes(result.verdict)
          && Array.isArray(result.findings) && object(result.counts), 'Invalid arithmetic-auditor result.');
        requireThat(!ids.has(result.runId), 'Duplicate runId across listed artifacts.');
        ids.add(result.runId);
        destination.push({...result, artifactPath: entry.path, artifactSha256: actual});
        for (const finding of result.findings) report.findings.push({...finding, runId: result.runId, artifactPath: entry.path});
        if (result.verdict === 'mismatch' && !result.findings.some(row => row.verdict === 'mismatch'))
          report.findings.push(issue('mismatch', scope, 'auditor-verdict', 'Arithmetic auditor rejected this artifact.'));
      } catch (error) {
        report.findings.push(issue('mismatch', scope, 'artifact-error', error.message));
      }
    }
  }
}

function summarize(report) {
  report.coverage = [0, 1, 2].map(level => {
    const complete = report.runs.filter(run => run.verdict === 'checked'
      && run.completeCoverage === true && run.level === level);
    return {level, winRunIds: complete.filter(run => run.outcome === 'won').map(run => run.runId),
      lossRunIds: complete.filter(run => run.outcome === 'lost' && run.naturalLoss === true).map(run => run.runId)};
  });
  const missing = report.coverage.flatMap(row => [
    ...(row.winRunIds.length ? [] : [{level: row.level, outcome: 'won'}]),
    ...(row.lossRunIds.length ? [] : [{level: row.level, outcome: 'lost'}])
  ]);
  if (missing.length) report.findings.push({...issue('not-observed', 'corpus', 'six-run-coverage',
    'Each task requires a checked complete ordinary win and natural four-rejection loss.'), missing});
  report.verdict = report.findings.some(row => row.verdict === 'mismatch') ? 'mismatch'
    : report.findings.some(row => row.verdict === 'not-observed') ? 'not-observed' : 'checked';
  report.passed = report.verdict === 'checked';
  report.counts = {readArtifactFiles: report.artifacts.length, auditedModelRuns: report.runs.length,
    auditedSparseRuns: report.observations.length, completeOrdinaryRuns: report.runs.filter(row => row.completeCoverage === true && row.verdict === 'checked').length};
}

const report = {schema: 'parallax-skyline-independent-audit-v1', generatedAt: new Date().toISOString(),
  scope: 'Consistency of explicitly listed public observations with frozen public rules.',
  runs: [], observations: [], artifacts: [], findings: [], limitations: [...LIMITATIONS,
    'Only manifest-listed public artifacts are read; this audit cannot establish that unlisted attempts do not exist.',
    'Origin source hashes are provenance claims. Production, pilot, renderer and harness sources are not opened or authenticated.',
    'Sparse endpoints and their gaps cannot replace a complete ordinary model-call chain or prove browser lifecycle, trusted controls, visuals or hardware behavior.',
    'JSON cannot establish fresh reference identity, descriptor/getter/Proxy behavior, or unrecorded input properties.']};
let options;
try {
  options = argumentsOf(process.argv.slice(2));
  inspectPath(options.output, true);
  requireThat(!fs.existsSync(options.output), 'Refusing to overwrite an existing audit report.');
  publicIdentity(report);
  const bytes = readFile(options.manifest);
  report.manifest = {file: path.basename(options.manifest), sha256: digest(bytes), bytes: bytes.length};
  checkManifest(parseJson(bytes, 'manifest'), path.dirname(options.manifest), options.output, report);
} catch (error) {
  report.findings.push(issue('mismatch', 'corpus', 'input-error', error.message));
}
summarize(report);
const encoded = JSON.stringify(report, null, 2) + '\n';
try {
  if (options) {
    inspectPath(options.output, true);
    fs.mkdirSync(path.dirname(options.output), {recursive: true});
    inspectPath(options.output, true);
    fs.writeFileSync(options.output, encoded, {flag: 'wx'});
  } else process.stdout.write(encoded);
} catch (error) {
  process.stderr.write(JSON.stringify({verdict: 'mismatch', code: 'output-error', message: error.message}) + '\n');
  process.exitCode = 1;
}
if (process.exitCode !== 1) process.exitCode = report.verdict === 'checked' ? 0 : report.verdict === 'not-observed' ? 2 : 1;
