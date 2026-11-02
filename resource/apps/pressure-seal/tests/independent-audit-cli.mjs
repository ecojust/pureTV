// Public evidence reader only. Never imports or opens Model, pilot, or private sources.
// Root must fully review this file and independent-audit.mjs before first execution.
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditOrdinaryRun, auditSparseObservations, PUBLIC_DOC_HASHES, AUDIT_LIMITATIONS,
} from './independent-audit.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const verdicts = new Set(['checked', 'failed', 'review-required', 'not-observed']);
const report = {
  schema: 'pressure-seal-independent-audit-v1',
  scope: 'listed ordinary public corpus and separately reported sparse local facts',
  startedAt: new Date().toISOString(),
  verdict: 'not-observed',
  manifest: null,
  auditorSources: {},
  publicDocHashes: PUBLIC_DOC_HASHES,
  runs: [],
  sparse: [],
  sourceHashClaims: { comparison: 'not-observed', groups: [] },
  corpusCoverage: {
    normalWinsByLevel: { 0: [], 1: [], 2: [] },
    naturalLossesByLevel: { 0: [], 1: [], 2: [] },
    sixRunCoverage: false,
    listedRunCount: 0,
    checkedRunCount: 0,
  },
  findings: [],
  limitations: [
    ...AUDIT_LIMITATIONS,
    'Only manifest-listed public artifacts are read; this audit cannot establish that unlisted attempts do not exist.',
    'Origin source hashes are provenance claims. Production, pilot, and harness sources are not opened or authenticated by this CLI.',
    'A checked ordinary corpus is not evidence of browser lifecycle, trusted controls, visuals, performance, or private implementation behavior.',
    'Sparse reports retain their own gaps and limitations; they cannot supply continuous coverage missing from ordinary receipts.',
  ],
};

function finding(verdict, scope, code, message) {
  report.findings.push({ verdict, scope, code, message });
}

function parseArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const name = argv[i];
    if (name !== '--manifest' && name !== '--out') throw new Error('Unknown CLI argument.');
    const key = name.slice(2);
    if (options[key] !== undefined || i + 1 === argv.length || argv[i + 1].startsWith('--')) {
      throw new Error('Each option requires exactly one value and may appear once.');
    }
    options[key] = argv[++i];
  }
  if (!options.manifest) throw new Error('Required usage: --manifest <public-corpus.json> [--out <new-report.json>].');
  return options;
}

function inside(base, target) {
  const part = relative(base, target);
  return part !== '' && part !== '..' && !part.startsWith(`..${sep}`) && !isAbsolute(part);
}

function parseJSON(bytes) {
  try { return JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error('The named artifact is not valid JSON.'); }
}

async function readListedArtifact(base, entry, seenPaths) {
  if (!plain(entry) || entry.publicOnly !== true || !hash(entry.sha256)) {
    throw new Error('Artifact entry requires publicOnly:true and a lowercase SHA-256 digest.');
  }
  if (typeof entry.path !== 'string' || !entry.path || isAbsolute(entry.path)
    || entry.path.includes('\\') || entry.path.split('/').includes('..')
    || extname(entry.path) !== '.json') {
    throw new Error('Artifact path must be a relative JSON path without traversal or backslashes.');
  }
  const lexical = resolve(base, entry.path);
  if (!inside(base, lexical)) throw new Error('Artifact path is outside the manifest directory.');
  const actual = await realpath(lexical);
  if (!inside(base, actual)) throw new Error('Artifact symlink resolves outside the manifest directory.');
  if (seenPaths.has(actual)) throw new Error('The same public artifact is listed more than once.');
  seenPaths.add(actual);
  const bytes = await readFile(actual);
  const sha256 = digest(bytes);
  if (sha256 !== entry.sha256) throw new Error('Artifact bytes do not match the manifest SHA-256.');
  const value = parseJSON(bytes);
  if (!plain(value) || Object.hasOwn(value, 'pilotDiagnostics')) {
    throw new Error('Artifact is not a public JSON projection without pilotDiagnostics.');
  }
  return { value, sha256, path: entry.path };
}

function rejectRun(entry, code, message) {
  const result = {
    runId: typeof entry?.runId === 'string' ? entry.runId : null,
    level: Number.isInteger(entry?.level) ? entry.level : null,
    channel: entry?.channel ?? null,
    verdict: 'failed',
    completeChain: false,
    counts: {},
    coverage: {},
    outcome: { phase: null, reason: null },
    findings: [{ verdict: 'failed', code, message }],
    limitations: ['The listed artifact did not qualify for an ordinary formula audit.'],
    tracePath: typeof entry?.path === 'string' ? entry.path : null,
    expectedTraceSha256: hash(entry?.sha256) ? entry.sha256 : null,
  };
  report.runs.push(result);
  return result;
}

function checkRunIdentity(entry, result) {
  const errors = [];
  if (result.runId !== entry.runId) errors.push('runId');
  if (result.level !== entry.level) errors.push('level');
  if (result.channel !== entry.channel) errors.push('channel');
  if (result.outcome?.phase !== entry.expectedOutcome) errors.push('expectedOutcome');
  if (!verdicts.has(result.verdict)) errors.push('auditor verdict');
  if (errors.length) {
    result.verdict = 'failed';
    result.completeChain = false;
    result.findings = [...(result.findings ?? []), {
      verdict: 'failed', code: 'manifest-identity',
      message: `Manifest and observed report disagree on: ${errors.join(', ')}.`,
    }];
  }
}

async function inspectManifest(manifestPath) {
  const actualManifest = await realpath(resolve(manifestPath));
  const bytes = await readFile(actualManifest);
  report.manifest = { path: actualManifest, sha256: digest(bytes) };
  const manifest = parseJSON(bytes);
  if (!plain(manifest) || manifest.schema !== 1 || manifest.kind !== 'pressure-seal-public-corpus'
    || manifest.publicOnly !== true || !Array.isArray(manifest.runs)
    || (manifest.observations !== undefined && !Array.isArray(manifest.observations))) {
    throw new Error('Manifest must be schema 1 pressure-seal-public-corpus, publicOnly:true, with runs and optional observations arrays.');
  }
  const base = dirname(actualManifest);
  const seenPaths = new Set([actualManifest]);
  const seenIds = new Set();
  report.corpusCoverage.listedRunCount = manifest.runs.length;
  for (const entry of manifest.runs) {
    if (!plain(entry) || typeof entry.runId !== 'string' || !entry.runId || seenIds.has(entry.runId)
      || ![0, 1, 2].includes(entry.level) || entry.channel !== 'model'
      || !['won', 'lost'].includes(entry.expectedOutcome)) {
      rejectRun(entry, 'manifest-run', 'Run entry has an invalid or duplicate identity, level, channel, or expected outcome.');
      continue;
    }
    seenIds.add(entry.runId);
    let artifact;
    try { artifact = await readListedArtifact(base, entry, seenPaths); }
    catch (error) {
      rejectRun(entry, 'artifact-read', error.message);
      continue;
    }
    if (artifact.value.schema !== 1 || artifact.value.kind !== 'pressure-seal-ordinary-run') {
      rejectRun(entry, 'artifact-kind', 'Run artifact is not schema 1 pressure-seal-ordinary-run.').traceSha256 = artifact.sha256;
      continue;
    }
    let result;
    try { result = auditOrdinaryRun(artifact.value); }
    catch {
      rejectRun(entry, 'auditor-exception', 'The independent checker could not inspect this public artifact.').traceSha256 = artifact.sha256;
      continue;
    }
    if (!plain(result)) {
      rejectRun(entry, 'auditor-result', 'The independent checker did not return a report object.').traceSha256 = artifact.sha256;
      continue;
    }
    checkRunIdentity(entry, result);
    result.tracePath = artifact.path;
    result.traceSha256 = artifact.sha256;
    result.expectedOutcome = entry.expectedOutcome;
    report.runs.push(result);
  }
  for (const entry of manifest.observations ?? []) {
    try {
      const artifact = await readListedArtifact(base, entry, seenPaths);
      if (artifact.value.schema !== 1 || artifact.value.kind !== 'pressure-seal-public-observations') {
        throw new Error('Sparse artifact is not schema 1 pressure-seal-public-observations.');
      }
      const result = auditSparseObservations(artifact.value);
      if (!plain(result) || !verdicts.has(result.verdict)) throw new Error('Invalid sparse auditor report.');
      report.sparse.push({ ...result, tracePath: artifact.path, traceSha256: artifact.sha256 });
    } catch {
      report.sparse.push({
        verdict: 'failed', tracePath: typeof entry?.path === 'string' ? entry.path : null,
        findings: [{ verdict: 'failed', code: 'sparse-artifact', message: 'The listed sparse artifact could not be verified and audited.' }],
        limitations: ['No endpoint, local formula, or continuity claim is established for this artifact.'],
      });
    }
  }
}

function finishCoverage() {
  const sourceGroups = new Map();
  for (const run of report.runs) {
    if (plain(run.sourceHashes) && Object.keys(run.sourceHashes).length > 0) {
      const claims = Object.fromEntries(Object.keys(run.sourceHashes).sort().map(key => [key, run.sourceHashes[key]]));
      const fingerprint = digest(JSON.stringify(claims));
      if (!sourceGroups.has(fingerprint)) {
        sourceGroups.set(fingerprint, { claimFingerprint: fingerprint, runIds: [], sourceHashes: claims });
      }
      sourceGroups.get(fingerprint).runIds.push(run.runId);
    } else if (run.verdict === 'checked') {
      finding('review-required', 'provenance', 'source-claims-missing', 'A checked run is missing its declared source hash map.');
    }
    if (run.verdict !== 'checked' || run.completeChain !== true) continue;
    report.corpusCoverage.checkedRunCount += 1;
    if (run.outcome?.phase === 'won' && run.expectedOutcome === 'won') {
      report.corpusCoverage.normalWinsByLevel[run.level].push(run.runId);
    }
    if (run.outcome?.phase === 'lost' && run.expectedOutcome === 'lost'
      && ['burst', 'overheat'].includes(run.outcome.reason)) {
      report.corpusCoverage.naturalLossesByLevel[run.level].push(run.runId);
    }
  }
  report.sourceHashClaims.groups = [...sourceGroups.values()];
  report.sourceHashClaims.comparison = sourceGroups.size === 1 ? 'checked'
    : sourceGroups.size > 1 ? 'review-required' : 'not-observed';
  if (sourceGroups.size > 1) {
    finding('review-required', 'provenance', 'source-claims-differ', 'Listed ordinary runs declare different source hash maps; each distinct claim is retained without opening source files.');
  }
  report.corpusCoverage.sixRunCoverage = [0, 1, 2].every(level =>
    report.corpusCoverage.normalWinsByLevel[level].length > 0
    && report.corpusCoverage.naturalLossesByLevel[level].length > 0);
  if (!report.corpusCoverage.sixRunCoverage) {
    finding('not-observed', 'corpus', 'six-run-coverage', 'A checked complete ordinary win and natural loss are required for each of the three levels.');
  }
  const assessed = [...report.findings, ...report.runs, ...report.sparse];
  report.verdict = assessed.some(item => item.verdict === 'failed') ? 'failed'
    : assessed.some(item => item.verdict === 'review-required') ? 'review-required'
      : report.runs.some(item => item.verdict === 'not-observed') ? 'not-observed'
        : report.corpusCoverage.sixRunCoverage ? 'checked' : 'not-observed';
  report.finishedAt = new Date().toISOString();
}

let options;
try {
  options = parseArguments(process.argv.slice(2));
  for (const name of ['independent-audit-cli.mjs', 'independent-audit.mjs']) {
    const ownSource = fileURLToPath(new URL(name, import.meta.url));
    report.auditorSources[`tests/${name}`] = digest(await readFile(ownSource));
  }
  await inspectManifest(options.manifest);
} catch (error) {
  finding('failed', 'cli', 'input-or-source-binding', error.message);
}
finishCoverage();
let output = `${JSON.stringify(report, null, 2)}\n`;
if (options?.out) {
  try {
    // Reports are immutable attempts. An existing file is never overwritten.
    await writeFile(resolve(options.out), output, { encoding: 'utf8', flag: 'wx' });
  } catch {
    finding('failed', 'cli', 'report-write', 'The new output report could not be written; existing files are never overwritten.');
    report.verdict = 'failed';
    output = `${JSON.stringify(report, null, 2)}\n`;
    process.stdout.write(output);
  }
} else {
  process.stdout.write(output);
}
process.exitCode = report.verdict === 'checked' ? 0 : report.verdict === 'failed' ? 1 : 2;
