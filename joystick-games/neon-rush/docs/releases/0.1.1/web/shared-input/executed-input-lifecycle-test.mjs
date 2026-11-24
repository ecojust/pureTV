// Deterministic browser protocol fixtures, NOT game footage or hardware tests.
// The real shared runtime consumes normal DOM/native key events and controlled
// phone snapshots. A manually advanced RAF exposes zero-step/cancel boundaries.
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { launch, serveAssets, parseArgs, sha256 } from './common.mjs';

const args = parseArgs();
const output = path.resolve(args.output || path.join(os.tmpdir(), 'puretv-input-lifecycle-report'));
const web = fileURLToPath(new URL('../web/', import.meta.url));
const fixture = await mkdtemp(path.join(os.tmpdir(), 'puretv-input-lifecycle-'));
await mkdir(output, { recursive: true });
for (const name of ['runtime.js', 'renderer.js', 'tv.html', 'tv.css']) await copyFile(path.join(web, name), path.join(fixture, name));
await writeFile(path.join(fixture, 'game-config.json'), JSON.stringify({ version: '0.0.0' }));
await writeFile(path.join(fixture, 'game-model.js'), `window.PureModel={
 create(){return {phase:'playing',score:0,tick:0,elapsed:0,events:[],samples:[]};},
 step(s,dt,i){s.tick++;s.elapsed+=dt;s.events=[];s.samples.push({tick:s.tick,a:!!i.a,b:!!i.b,aPressed:!!i.aPressed,bPressed:!!i.bPressed,x:i.x,y:i.y,epoch:i.cancelEpoch,cancelled:i.cancelled===true});if(s.samples.length>1000)s.samples.shift();return s;}
};`);
await writeFile(path.join(fixture, 'game.js'), `window.GameDef={id:'input-lifecycle-probe',title:'Input lifecycle probe',holdConfirmAsA:new URL(location.href).searchParams.get('hold')==='1',description:'Protocol fixture only',tip:'No game or hardware result',controls:{move:'Move',a:'A',b:'B'},hud:()=>[],result:()=>'',render(r){r.rect(0,0,960,540,'#21384c');}};`);
const server = await serveAssets(fixture);
const browser = await launch();
const report = {
  scope: 'Deterministic Chromium protocol fixtures with manually advanced RAF, instrumented model and controlled native phone snapshots. Not gameplay, performance or physical hardware evidence.',
  runtimeSha256: sha256(await readFile(path.join(web, 'runtime.js'))),
  testScriptSha256: sha256(await readFile(fileURLToPath(import.meta.url))),
  physicalTvTested: false, physicalPhoneTested: false, tests: [], passed: false,
};

async function open(hold = true) {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await context.addInitScript(() => {
    window.__rafQueue = [];
    window.requestAnimationFrame = callback => { window.__rafQueue.push(callback); return window.__rafQueue.length; };
    window.__phonePlayers = [];
    window.PureGameHost = { getInfo: () => '{}', snapshot: () => JSON.stringify({ players: window.__phonePlayers }), publish() {} };
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.url + '?hold=' + Number(hold), { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.PureTVQA);
  let time = 100;
  const frame = async (delta = 20) => {
    time += delta;
    await page.evaluate(now => { const callbacks = window.__rafQueue.splice(0); for (const callback of callbacks) callback(now); }, time);
  };
  const pump = async (count = 1, delta = 20) => { for (let i = 0; i < count; i++) await frame(delta); };
  const snap = () => page.evaluate(() => window.PureTVQA.snapshot());
  const key = async (name, down) => { if (down) await page.keyboard.down(name); else await page.keyboard.up(name); };
  const tap = async name => { await key(name, true); await pump(); await key(name, false); await pump(); };
  const phone = async value => page.evaluate(p => { window.__phonePlayers = p ? [{ id: 1, connected: true, x: 0, y: 0, a: false, b: false, start: false, select: false, cancelSeq: 0, ...p }] : []; }, value);
  const repeat = async name => page.evaluate(key => window.dispatchEvent(new KeyboardEvent('keydown', { key, repeat: true, bubbles: true, cancelable: true })), name);
  const start = async () => { await pump(); await tap('Enter'); await pump(5); assert.equal((await snap()).phase, 'playing'); };
  return { context, page, frame, pump, snap, key, tap, phone, repeat, start, errors };
}
const samples = async (s, after = 0) => (await s.snap()).model.samples.filter(x => x.tick > after);
const tick = async s => (await s.snap()).model.tick;
function longest(rows, property) { let n = 0, max = 0; for (const row of rows) { n = row[property] ? n + 1 : 0; max = Math.max(max, n); } return max; }
async function test(name, run, hold = true) {
  const s = await open(hold);
  try { await run(s); assert.deepEqual(s.errors, []); report.tests.push({ name, passed: true }); }
  catch (error) { report.tests.push({ name, passed: false, error: error.stack }); throw error; }
  finally { await s.context.close(); }
}
async function expectNeutralCancel(s, before, oldEpoch) {
  const rows = await samples(s, before);
  const cancelled = rows.filter(x => x.cancelled);
  assert.ok(cancelled.length, 'Cancellation must reach an actual model step');
  assert.ok(cancelled.every(x => Number.isSafeInteger(x.epoch) && x.epoch > oldEpoch), 'Cancelled samples carry the new epoch');
  assert.ok(cancelled.every(x => !x.a && !x.b && !x.aPressed && !x.bPressed && x.x === 0 && x.y === 0), 'No pre-clear input may reach a cancellation-owned step');
}

try {
  await test('Default games retain one-frame Enter A behavior', async s => {
    await s.start(); const from = await tick(s);
    await s.key('Enter', true); await s.pump(25); await s.key('Enter', false); await s.pump(4);
    const rows = await samples(s, from); assert.equal(rows.filter(x => x.aPressed).length, 1);
    assert.ok(longest(rows, 'a') >= 1 && longest(rows, 'a') <= 6);
  }, false);
  await test('Opt-in DOM Enter stays held and releases as A', async s => {
    await s.start(); const from = await tick(s);
    await s.key('Enter', true); await s.pump(25); await s.key('Enter', false); await s.pump(4);
    const rows = await samples(s, from); assert.equal(rows.filter(x => x.aPressed).length, 1);
    assert.ok(longest(rows, 'a') >= 25); assert.ok(rows.slice(-3).every(x => !x.a));
  });
  await test('Opt-in native Enter down/up preserves held A', async s => {
    await s.start(); const from = await tick(s);
    await s.page.evaluate(() => PureGame.key('Enter', true)); await s.pump(25);
    await s.page.evaluate(() => PureGame.key('Enter', false)); await s.pump(4);
    const rows = await samples(s, from); assert.equal(rows.filter(x => x.aPressed).length, 1);
    assert.ok(longest(rows, 'a') >= 25); assert.ok(rows.slice(-3).every(x => !x.a));
  });
  await test('Coalesced opt-in Enter tap survives zero-physics frames exactly once', async s => {
    await s.start(); const from = await tick(s);
    await s.key('Enter', true); await s.key('Enter', false); await s.pump(3, 0); await s.pump(4);
    const rows = await samples(s, from); assert.equal(rows.filter(x => x.aPressed).length, 1);
    assert.ok(rows.every(x => !x.a), 'A tap edge must not invent a held duration');
  });
  await test('Holding the menu confirm and DOM repeat cannot create a game A', async s => {
    await s.pump(); await s.key('Enter', true); await s.pump(10);
    await s.repeat('Enter'); await s.pump(15);
    assert.ok((await samples(s)).every(x => !x.a && !x.aPressed));
    await s.key('Enter', false); await s.pump(); const from = await tick(s);
    await s.key('Enter', true); await s.pump(5); await s.key('Enter', false); await s.pump();
    assert.ok((await samples(s, from)).some(x => x.aPressed && x.a));
  });
  await test('Pause cancels held keyboard A; repeat cannot rearm before keyup', async s => {
    await s.start(); await s.key('Space', true); await s.pump(8);
    const oldEpoch = (await samples(s)).at(-1).epoch; await s.tap('p');
    const paused = (await s.snap()).model; await s.pump(20); assert.deepEqual((await s.snap()).model, paused);
    const from = await tick(s); await s.tap('p'); await s.repeat(' '); await s.pump(8);
    await expectNeutralCancel(s, from, oldEpoch); assert.ok((await samples(s, from)).every(x => !x.a && !x.aPressed));
    await s.key('Space', false); await s.pump(); await s.key('Space', true); await s.pump(4);
    assert.ok((await samples(s, from)).some(x => x.aPressed));
  });
  await test('Remote A/B held across pause stay quarantined until raw release', async s => {
    await s.start(); await s.phone({}); await s.pump(3); await s.phone({ a: true, b: true }); await s.pump(5);
    const epoch = (await samples(s)).at(-1).epoch; await s.tap('p'); const from = await tick(s);
    await s.tap('p'); await s.pump(12); await expectNeutralCancel(s, from, epoch);
    assert.ok((await samples(s, from)).every(x => !x.a && !x.b));
    await s.phone({}); await s.pump(4); await s.phone({ a: true, b: true }); await s.pump(4);
    assert.ok((await samples(s, from)).some(x => x.aPressed && x.bPressed));
  });
  await test('Connected phone cancelSeq distinguishes cancellation from ordinary release', async s => {
    await s.start(); await s.phone({}); await s.pump(3); await s.phone({ a: true }); await s.pump(8);
    const from = await tick(s), epoch = (await samples(s)).at(-1).epoch;
    await s.phone({ cancelSeq: 1 }); await s.pump(5); await expectNeutralCancel(s, from, epoch);
    assert.equal((await s.snap()).paused, false);
    await s.phone({ a: true, cancelSeq: 1 }); await s.pump(4);
    assert.ok((await samples(s, from)).some(x => x.a && x.aPressed));
  });
  await test('CancelSeq change with a still-held remote button cannot restore that hold', async s => {
    await s.start(); await s.phone({}); await s.pump(3); await s.phone({ a: true }); await s.pump(5);
    const from = await tick(s), epoch = (await samples(s)).at(-1).epoch;
    await s.phone({ a: true, cancelSeq: 1 }); await s.pump(15); await expectNeutralCancel(s, from, epoch);
    assert.ok((await samples(s, from)).every(x => !x.a && !x.aPressed));
    await s.phone({ cancelSeq: 1 }); await s.pump(3); await s.phone({ a: true, cancelSeq: 1 }); await s.pump(3);
    assert.ok((await samples(s, from)).some(x => x.aPressed));
  });
  await test('First phone connection establishes a cancelSeq baseline without cancelling local input', async s => {
    await s.start(); await s.key('Space', true); await s.pump(5);
    const epoch = (await samples(s)).at(-1).epoch, from = await tick(s);
    await s.phone({ cancelSeq: 19 }); await s.pump(8);
    assert.ok((await samples(s, from)).every(x => x.epoch === epoch && !x.cancelled && x.a));
  });
  await test('CancelSeq wrap/reset is detected rather than ignored as a lower value', async s => {
    await s.start(); await s.phone({ cancelSeq: 9 }); await s.pump(4);
    const epoch = (await samples(s)).at(-1).epoch, from = await tick(s);
    await s.phone({ cancelSeq: 0 }); await s.pump(4); await expectNeutralCancel(s, from, epoch);
  });
  await test('Phone disconnect freezes the model and permits independent keyboard takeover', async s => {
    await s.start(); await s.phone({}); await s.pump(3); await s.phone({ a: true }); await s.pump(5);
    await s.phone(null); await s.pump(); assert.equal((await s.snap()).paused, true);
    const frozen = (await s.snap()).model; await s.pump(20); assert.deepEqual((await s.snap()).model, frozen);
    await s.tap('p'); await s.pump(4); const from = await tick(s);
    await s.key('ArrowRight', true); await s.key('Space', true); await s.pump(8);
    assert.ok((await samples(s, from)).some(x => x.x === 1 && x.a && !x.cancelled), 'Absent quarantined phone must not lock local controls');
    await s.key('ArrowRight', false); await s.key('Space', false); await s.pump(3);
    const reconnectFrom = await tick(s); await s.phone({ a: true }); await s.pump(8);
    assert.ok((await samples(s, reconnectFrom)).every(x => !x.a), 'Reconnected stale remote hold remains quarantined');
  }, false);
  await test('Fresh phone hold sampled in the resume frame cannot bypass clearInput', async s => {
    await s.start(); await s.phone({}); await s.pump(3); await s.tap('p');
    const epoch = (await samples(s)).at(-1).epoch, from = await tick(s);
    await s.phone({ a: true, b: true }); await s.key('p', true); await s.pump(1, 100); await s.key('p', false); await s.pump(4);
    await expectNeutralCancel(s, from, epoch); assert.ok((await samples(s, from)).every(x => !x.a && !x.b && !x.aPressed && !x.bPressed));
  });
  await test('Cancellation survives zero-step RAF frames and reaches all substeps of its owned sample', async s => {
    await s.start(); const oldEpoch = (await samples(s)).at(-1).epoch;
    await s.page.evaluate(() => PureGame.suspend(true)); await s.pump(2, 0);
    const from = await tick(s); await s.page.evaluate(() => PureGame.suspend(false)); await s.pump(3, 0);
    assert.equal(await tick(s), from); await s.pump(1, 100);
    await expectNeutralCancel(s, from, oldEpoch);
    const rows = await samples(s, from); assert.ok(rows.length >= 5 && rows.every(x => x.cancelled), 'One cancellation-owned frame covers every physics substep');
    await s.pump(2); assert.ok((await samples(s)).at(-1).cancelled === false);
  });
  await test('Retry clears held keyboard input and ignores its later DOM repeats', async s => {
    await s.start(); await s.key('Space', true); await s.pump(6); await s.tap('r');
    await s.repeat(' '); await s.pump(8); assert.ok((await samples(s)).every(x => !x.a && !x.aPressed));
    await s.key('Space', false); await s.pump(); await s.key('Space', true); await s.pump(4);
    assert.ok((await samples(s)).some(x => x.aPressed));
  });
  assert.equal(report.runtimeSha256, sha256(await readFile(path.join(web, 'runtime.js'))), 'Runtime changed during protocol validation');
  report.passed = true;
} catch (error) { report.failure = error.stack; process.exitCode = 1; }
finally {
  await browser.close(); await server.close(); await rm(fixture, { recursive: true, force: true });
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, checks: report.tests.length, runtimeSha256: report.runtimeSha256, output }));
