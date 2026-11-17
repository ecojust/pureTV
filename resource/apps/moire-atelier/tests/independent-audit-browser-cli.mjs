/*
 * PUBLIC-only, separately reviewed Chromium execution adapter for frozen auditor v1.
 * This file never imports a game model, renderer, pilot, helper, or private corpus.
 * The browser loads only an isolated blank page and the exact hash-pinned checker.
 * All verdicts, equality and brightness thresholds remain in the unchanged checker.
 * This adapter is a runtime diagnostic, not browser-play or lifecycle evidence.
 */
import {readFileSync, openSync, writeFileSync, closeSync, realpathSync, readlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';

const PINNED_CHECKER = 'fff7832bf3c1526ff4822af34a53354016bdac6572c97161e07841debfc98623';
const PINNED_NODE_CLI = '2567656906fc3d13395f8d3d452ddeb258609034df72a7a8765dc8e1142d300d';
const PINNED_FAILED_NODE_REPORT = '967a0ad7ce95d410d6db687c17d78067da7a8c784c00ab4080229f3bd7fc57f1';
const METHODS = {'--full': 'auditFullRun', '--sparse': 'auditSparseSegments', '--endpoint': 'auditEndpoint'};
const COUNTS = () => ({endpoints: 0, fullPairs: 0, sparseIntervals: 0, declaredBoundaryGaps: 0});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const utc = () => new Date().toISOString();
const sourcePath = name => fileURLToPath(new URL(name, import.meta.url));
const argumentsList = process.argv.slice(2), jobs = [];
const options = {out: null, manifest: null, failedNode: null};
const OPTION_NAMES = {'--out': 'out', '--manifest': 'manifest', '--failed-node': 'failedNode'};
const errors = [], results = [], sourceFiles = [];
const manifest = {schema: 1, kind: 'independent-public-browser-audit-execution', startedAt: utc(), completedAt: null,
  status: 'starting', scope: 'Exact frozen public checker in an isolated Chromium page; no game execution or lifecycle inference.',
  errors, inputs: [], sourceFiles, browser: null, outputs: {}, node: {version: process.version, platform: process.platform, arch: process.arch}};
let browser = null, context = null, page = null, server = null, checkerText = null;
function retainError(stage, error, detail = null) {
  errors.push({stage, observedAt: utc(), name: String(error?.name || 'Error'), message: String(error?.message || error),
    stack: typeof error?.stack === 'string' ? error.stack : null, detail});
}
function fileRecord(path) {
  const bytes = readFileSync(path);
  return {path: resolve(path), realpath: realpathSync(path), sha256: sha256(bytes), bytes: bytes.length};
}
function failureResult(job, message) {
  const report = {auditorVersion: 1, game: 'moire-atelier', mode: 'browser-adapter-failure', ok: false,
    counts: COUNTS(), findings: [{path: 'browser-adapter', detail: message}],
    limits: ['No checker acceptance is inferred from an adapter failure or an unattempted input.']};
  return {input: job.path, sha256: job.sha256 || null, ok: false, counts: report.counts, reportText: JSON.stringify(report)};
}
function writeReport(path, summary) {
  const fd = openSync(path, 'wx');
  try {
    const header = {...summary}; delete header.results;
    writeFileSync(fd, JSON.stringify(header).slice(0, -1) + ',"results":[');
    results.forEach((result, index) => {
      if (index) writeFileSync(fd, ',');
      writeFileSync(fd, JSON.stringify({input: result.input, sha256: result.sha256}).slice(0, -1) + ',"report":');
      writeFileSync(fd, result.reportText); writeFileSync(fd, '}');
    });
    writeFileSync(fd, ']}\n');
  } finally { closeSync(fd); }
}

try {
  for (let i = 0; i < argumentsList.length; i += 2) {
    const flag = argumentsList[i], path = argumentsList[i + 1];
    if (!path) throw new Error('Every flag requires one explicit path.');
    if (Object.hasOwn(METHODS, flag)) jobs.push({flag, path});
    else if (flag === '--sha256') {
      if (!jobs.length || jobs.at(-1).expectedSha256 || !/^[a-f0-9]{64}$/.test(path)) throw new Error('--sha256 must follow one public input and contain its reviewed digest.');
      jobs.at(-1).expectedSha256 = path;
    }
    else if (Object.hasOwn(OPTION_NAMES, flag)) {
      const key = OPTION_NAMES[flag];
      if (options[key] !== null) throw new Error(`Duplicate ${flag}.`);
      options[key] = path;
    } else throw new Error(`Unknown option: ${flag}`);
  }
  if (!jobs.length || jobs.some(job => !job.expectedSha256) || !options.out || !options.manifest || !options.failedNode)
    throw new Error('Usage: --sparse PUBLIC.json | --full PUBLIC.json | --endpoint PUBLIC.json --sha256 REVIEWED-DIGEST ... --out NEW.json --manifest NEW.json --failed-node RETAINED-FAILED-NODE.json');
  if (new Set(jobs.map(job => resolve(job.path))).size !== jobs.length) throw new Error('Each explicit public input may appear only once.');
  if (resolve(options.out) === resolve(options.manifest)) throw new Error('Report and manifest must have distinct exclusive output paths.');
  const protectedPaths = [...jobs.map(job => job.path), options.failedNode,
    sourcePath('independent-audit.mjs'), sourcePath('independent-audit-cli.mjs'), fileURLToPath(import.meta.url)].map(path => resolve(path));
  if ([options.out, options.manifest].some(path => protectedPaths.includes(resolve(path))))
    throw new Error('Output cannot replace any public input, failed report, or auditor source.');
  manifest.wrapper = fileRecord(fileURLToPath(import.meta.url));
  const checkerBytes = readFileSync(sourcePath('independent-audit.mjs'));
  if (sha256(checkerBytes) !== PINNED_CHECKER) throw new Error('Frozen checker hash changed; execution refused.');
  checkerText = new TextDecoder('utf-8', {fatal: true}).decode(checkerBytes);
  for (const [name, expected] of [['independent-audit.mjs', PINNED_CHECKER], ['independent-audit-cli.mjs', PINNED_NODE_CLI]]) {
    const record = fileRecord(sourcePath(name));
    if (record.sha256 !== expected) throw new Error(`Frozen source hash changed: ${name}`);
    sourceFiles.push({path: record.path, sha256: record.sha256});
  }
  manifest.failedNodeAudit = fileRecord(options.failedNode);
  if (manifest.failedNodeAudit.sha256 !== PINNED_FAILED_NODE_REPORT) throw new Error('Retained first Node failure digest differs from the reviewed diagnostic input.');
  for (const job of jobs) {
    const record = fileRecord(job.path); job.sha256 = record.sha256;
    if (record.sha256 !== job.expectedSha256) throw new Error(`Public input differs from explicitly reviewed digest: ${job.path}`);
    manifest.inputs.push({...record, flag: job.flag, status: 'pending'});
  }
  const requireInfrastructure = createRequire('/workspace/pureTV/desktop/package.json');
  const {chromium} = requireInfrastructure('playwright');
  manifest.playwrightVersion = requireInfrastructure('playwright/package.json').version;
  const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
  const args = ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling'];
  manifest.browser = {launchExecutable: fileRecord(executablePath), headless: true, args};
  const html = '<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><title>Independent public audit isolation page</title>';
  server = createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/') {
      response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}); response.end(html);
    } else {
      retainError('isolated-server-unexpected-request', new Error('Only the isolated blank document is served.'), {method: request.method, url: request.url});
      response.writeHead(404); response.end();
    }
  });
  server.on('error', error => retainError('isolated-server-error', error));
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept); });
  browser = await chromium.launch({executablePath, headless: true, args});
  manifest.browser.version = browser.version();
  const browserSession = await browser.newBrowserCDPSession();
  try {
    const processInfo = await browserSession.send('SystemInfo.getProcessInfo');
    const browserProcess = processInfo.processInfo.find(process => process.type === 'browser');
    if (!browserProcess || !Number.isInteger(browserProcess.id)) throw new Error('Actual browser process identity unavailable.');
    const binary = readlinkSync(`/proc/${browserProcess.id}/exe`);
    manifest.browser.actualBrowserProcess = {pid: browserProcess.id, executable: fileRecord(binary)};
  } finally { try { await browserSession.detach(); } catch (error) { retainError('browser-cdp-detach', error); } }
  context = await browser.newContext(); page = await context.newPage();
  page.on('pageerror', error => retainError('pageerror', error));
  page.on('console', message => { if (message.type() === 'error') retainError('console-error', new Error(message.text())); });
  page.on('requestfailed', request => retainError('requestfailed', new Error(request.failure()?.errorText || 'Request failed'), {url: request.url()}));
  page.on('response', response => { if (response.status() >= 400) retainError('response-error', new Error(`HTTP ${response.status()}`), {url: response.url()}); });
  const address = server.address();
  await page.goto(`http://127.0.0.1:${address.port}/`, {waitUntil: 'load'});
  manifest.browser.isolationPage = page.url();
  manifest.browser.environment = await page.evaluate(async ({source, expectedHash}) => {
    const bytes = new TextEncoder().encode(source);
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('');
    if (digest !== expectedHash) throw new Error('Browser-received checker bytes differ from the frozen source.');
    const url = URL.createObjectURL(new Blob([bytes], {type: 'text/javascript'}));
    try { window.__independentPublicAuditor = await import(url); } finally { URL.revokeObjectURL(url); }
    for (const name of ['auditFullRun', 'auditSparseSegments', 'auditEndpoint'])
      if (typeof window.__independentPublicAuditor[name] !== 'function') throw new Error(`Missing public checker export: ${name}`);
    return {checkerSha256: digest, userAgent: navigator.userAgent, platform: navigator.platform,
      language: navigator.language, hardwareConcurrency: navigator.hardwareConcurrency,
      crossOriginIsolated, secureContext: isSecureContext, timeOrigin: performance.timeOrigin};
  }, {source: checkerText, expectedHash: PINNED_CHECKER});
  for (let index = 0; index < jobs.length; index++) {
    const job = jobs[index], inputRecord = manifest.inputs[index]; inputRecord.startedAt = utc();
    try {
      const bytes = readFileSync(job.path);
      if (sha256(bytes) !== job.sha256) throw new Error('Public input changed before browser transfer.');
      const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
      await page.evaluate(() => { window.__independentPublicInput = ''; window.__independentPublicOutput = ''; });
      for (let start = 0; start < text.length; start += 1048576)
        await page.evaluate(chunk => { window.__independentPublicInput += chunk; }, text.slice(start, start + 1048576));
      const metadata = await page.evaluate(async ({method, expectedInputHash}) => {
        const text = window.__independentPublicInput;
        const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), value => value.toString(16).padStart(2, '0')).join('');
        if (digest !== expectedInputHash) throw new Error('Browser-received public input bytes differ from recorded SHA256.');
        const report = window.__independentPublicAuditor[method](JSON.parse(text));
        window.__independentPublicOutput = JSON.stringify(report); window.__independentPublicInput = '';
        return {ok: report.ok, counts: report.counts, length: window.__independentPublicOutput.length, inputSha256: digest};
      }, {method: METHODS[job.flag], expectedInputHash: job.sha256});
      const chunks = [];
      for (let start = 0; start < metadata.length; start += 1048576)
        chunks.push(await page.evaluate(({start, end}) => window.__independentPublicOutput.slice(start, end), {start, end: start + 1048576}));
      const reportText = chunks.join('');
      if (reportText.length !== metadata.length) throw new Error('Incomplete browser report transfer.');
      results.push({input: job.path, sha256: job.sha256, reportText, ok: metadata.ok, counts: metadata.counts});
      inputRecord.browserSha256 = metadata.inputSha256; inputRecord.status = metadata.ok ? 'checked-pass' : 'checked-fail';
      inputRecord.reportCharacters = metadata.length;
      try { await page.evaluate(() => { window.__independentPublicOutput = ''; }); }
      catch (error) { retainError('public-output-cleanup', error, {input: job.path}); }
    } catch (error) {
      retainError('input-audit', error, {input: job.path, index}); inputRecord.status = 'adapter-error';
      results.push(failureResult(job, String(error.message || error)));
    } finally { inputRecord.completedAt = utc(); }
  }
} catch (error) { retainError('setup-or-execution', error); }
finally {
  for (const [stage, target] of [['context-close', context], ['browser-close', browser]]) {
    if (target) try { await target.close(); } catch (error) { retainError(stage, error); }
  }
  if (server) try { await new Promise((accept, reject) => server.close(error => error ? reject(error) : accept())); }
  catch (error) { retainError('server-close', error); }
}
for (const job of jobs) {
  if (!results.some(result => result.input === job.path)) results.push(failureResult(job, 'Input was not executed because adapter setup failed.'));
}
for (const record of [...manifest.inputs, ...sourceFiles, ...(manifest.wrapper ? [manifest.wrapper] : []), ...(manifest.failedNodeAudit ? [manifest.failedNodeAudit] : [])]) {
  try {
    const after = fileRecord(record.path); record.finalSha256 = after.sha256; record.unchanged = after.sha256 === record.sha256;
    if (!record.unchanged) retainError('post-run-source-integrity', new Error('Read source changed during diagnostic.'), {path: record.path});
  } catch (error) { retainError('post-run-source-integrity', error, {path: record.path}); }
}
const summary = {ok: errors.length === 0 && results.length === jobs.length && results.every(result => result.ok),
  sourceFiles: sourceFiles.map(({path, sha256}) => ({path, sha256})), inputs: jobs.length, counts: COUNTS(),
  failedInputs: results.filter(result => !result.ok).map(result => result.input), results: []};
for (const result of results) for (const key of Object.keys(summary.counts)) summary.counts[key] += result.counts[key];
try {
  if (options.out) { writeReport(options.out, summary); manifest.outputs.report = fileRecord(options.out); }
  else throw new Error('No explicit report output was supplied.');
} catch (error) { retainError('report-write', error); summary.ok = false; }
manifest.completedAt = utc(); manifest.status = summary.ok && errors.length === 0 ? 'passed' : 'failed';
try {
  if (!options.manifest) throw new Error('No explicit execution manifest output was supplied.');
  const fd = openSync(options.manifest, 'wx');
  try { writeFileSync(fd, JSON.stringify(manifest, null, 2) + '\n'); } finally { closeSync(fd); }
} catch (error) { retainError('manifest-write', error); summary.ok = false; }
process.stdout.write(JSON.stringify({ok: summary.ok, sourceFiles: summary.sourceFiles, inputs: summary.inputs,
  counts: summary.counts, failedInputs: summary.failedInputs, output: options.out, manifest: options.manifest,
  errors}, null, 2) + '\n');
if (!summary.ok) process.exitCode = 1;
