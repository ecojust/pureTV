// Run a Manager frontend locally, then set MANAGER_URL to its URL. The games load from public GitHub Pages.
// Example: MANAGER_URL=http://127.0.0.1:1420 QA_OUTPUT=/tmp/manager-qa node tools/pc-games/qa/manager-two-ports.mjs
// Set CHROMIUM_PATH to use installed Chromium, GAME_ID to run one title or EXPECT_DENIED=1 to require the blocked storage case.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from '../../../desktop/node_modules/playwright/index.mjs';
import { mockBridge, snapshot } from '../../../desktop/tests/fixtures.mjs';

const manager = process.env.MANAGER_URL || 'http://127.0.0.1:1420';
const output = resolve(process.env.QA_OUTPUT || join(tmpdir(), 'puretv-manager-two-ports'));
const pages = 'https://ecojust.github.io/pureTV/games/';
const games = [
  {id:'openaero-dfw', name:'达拉斯飞行模拟', category:'flight', start:'#btnStartFlight'},
  {id:'claude-of-tanks', name:'克劳德坦克', category:'action', start:'.cot-battle'},
];
const wait = (frame, check, arg) => frame.waitForFunction(check, arg, {polling:200, timeout:180000});
const state = frame => frame.evaluate(() => window.JoystickGameQA.snapshot());

function controller(page, session) {
  let revision = 0, epoch = 0, connectedLast = false, previous = {};
  const counters = {};
  return (connected, buttons = {}) => {
    if (connected !== connectedLast) epoch++;
    for (const key of Object.keys(buttons)) {
      if (buttons[key] && !previous[key]) counters[key] = (counters[key] || 0) + 1;
    }
    previous = buttons;
    connectedLast = connected;
    // Match the event emitted by desktop/src-tauri/src/game_controllers.rs.
    const player = {id:1, connected, controllerId:'QA-Pad', transport:'wifi', inputActive:true,
      session:String(epoch), cancelSeq:epoch, buttons, buttonCounters:{...counters}};
    return page.evaluate(payload => window.__emitMcp('game-controller-state', payload),
      {session, revision:++revision, connections:Number(connected), players:[player]});
  };
}

async function statusOutsideFrame(dialog, frame) {
  const status = dialog.getByRole('status');
  assert.equal(await status.count(), 1);
  const statusBox = await status.boundingBox();
  const gameBox = await dialog.locator('iframe').boundingBox();
  assert.ok(statusBox && gameBox && statusBox.y + statusBox.height <= gameBox.y + 1);
  assert.equal(await frame.locator('#puretv-controller-panel:visible, #puretv-web-notice:visible').count(), 0);
  return status.innerText();
}

async function play(page, frame, send, tanks) {
  if (!tanks) {
    await frame.locator('[data-assist="pilot"]').click();
    await frame.locator('[data-time="2"]').click();
  }
  await send(true, {START:true});
  await wait(frame, () => window.JoystickGameQA.snapshot().stage !== 'menu' || window.JoystickGameQA.snapshot().controller.buttons.START);
  await send(true);
  await wait(frame, () => window.JoystickGameQA.snapshot().stage === 'playing' ||
    (window.JoystickGameQA.snapshot().stage === 'menu' && /未能载入战场/.test(document.body.innerText)));
  assert.equal((await state(frame)).stage, 'playing', 'Game returned to the menu after pressing START');
  if (tanks) await wait(frame, () => !document.querySelector('.cot-bl.on, .cot-bl.leaving, .cot-prebattle.on'));
  await page.locator('dialog.game-player iframe').focus();
  const readMotion = () => frame.evaluate(tanks => {
    const g = window.JoystickGameQA.snapshot().gameplay;
    return tanks ? {x:g.x, z:g.z, yaw:g.yaw} : {rollInput:g.rollInput, bank:window.openaeroDebug().bankRightDeg};
  }, tanks);
  const initial = await readMotion();
  const key = tanks ? 'KeyW' : 'KeyD';
  let keyboard, pad;
  await page.keyboard.down(key);
  try {
    if (tanks) await wait(frame, p => {
      const g = window.JoystickGameQA.snapshot().gameplay;
      return Math.hypot(g.x - p.x, g.z - p.z) > 1;
    }, initial);
    else await wait(frame, () => window.JoystickGameQA.snapshot().gameplay.rollInput > 0.5 && window.openaeroDebug().bankRightDeg > 5);
    keyboard = await readMotion();
  } finally { await page.keyboard.up(key); }
  await send(true, tanks ? {UP:true, LEFT:true} : {LEFT:true});
  try {
    if (tanks) await wait(frame, p => {
      const s = window.JoystickGameQA.snapshot();
      return s.controller.buttons.LEFT && s.controller.buttons.UP && Math.abs(s.gameplay.yaw - p.yaw) > 0.05;
    }, keyboard);
    else await wait(frame, p => window.JoystickGameQA.snapshot().gameplay.rollInput < -0.5 && window.openaeroDebug().bankRightDeg < p.bank - 4, keyboard);
    pad = await readMotion();
  } finally { await send(true); }
  return {initial, keyboard, pad};
}

async function verify(browser, game) {
  const dir = join(output, game.id);
  await mkdir(dir, {recursive:true});
  const page = await browser.newPage({locale:'zh-CN', viewport:{width:960,height:540}, ignoreHTTPSErrors:true});
  page.setDefaultTimeout(120000);
  const evidence = {game:game.id, checkedAt:new Date().toISOString(), manager, browser:browser.version(),
    bridge:'Simulated Tauri fullscreen and wireless controller events', source:'Public GitHub Pages', files:{}};
  const hashes = [];
  page.on('response', response => {
    const url = new URL(response.url());
    if (!response.url().startsWith(pages + game.id + '/') || response.status() !== 200) return;
    const file = url.pathname.split('/').at(-1);
    if (!['tv.html','web-layout.js','claude-of-tanks.js'].includes(file) && !/^tv-[\w-]+\.js$/.test(file)) return;
    hashes.push(response.body().then(data => {
      evidence.files[file] = {bytes:data.length, sha256:createHash('sha256').update(data).digest('hex')};
    }).catch(err => { evidence.hashReadError = String(err); }));
  });
  try {
    // Observe the native property before the game's storage fallback runs.
    await page.addInitScript(() => {
      if (window === window.top || location.origin !== 'https://ecojust.github.io') return;
      try { void window.localStorage.length; window.__qaOriginalStorage = 'available'; }
      catch (error) { window.__qaOriginalStorage = error.name; }
    });
    await mockBridge(page, snapshot());
    await page.goto(manager, {waitUntil:'domcontentloaded'});
    await page.locator('[data-page="games"]').click();
    await page.locator('[name="gameGroup"]').selectOption(game.category);
    const card = page.locator('[data-play-game="' + game.id + '"]');
    assert.equal(await card.innerText(), game.name);
    assert.equal(await card.locator('xpath=..').getByRole('button').count(), 1);
    await card.scrollIntoViewIfNeeded();
    const url = pages + game.id + '/tv.html?lang=zh';
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url() === url && r.request().resourceType() === 'document'), card.click(),
    ]);
    evidence.document = {url, status:response.status()};
    assert.equal(response.status(), 200);
    const dialog = page.locator('dialog.game-player[open]');
    const element = dialog.locator('iframe');
    const frame = await (await element.elementHandle()).contentFrame();
    assert.notEqual(new URL(url).origin, new URL(manager).origin);
    await wait(frame, id => document.documentElement.dataset.puretvGame === id && window.JoystickGameQA?.snapshot().stage === 'menu', game.id);
    assert.match(await frame.locator(game.start).innerText(), /开始|继续/);
    await page.waitForFunction(() => window.__windowFullscreen && document.querySelector('[data-socket-status]')?.textContent.includes('搜索键'));
    evidence.fullscreen = true;
    evidence.frame = await element.boundingBox();
    evidence.originalThirdPartyStorage = await frame.evaluate(() => window.__qaOriginalStorage);
    const tanks = game.id === 'claude-of-tanks';
    if (tanks && process.env.EXPECT_DENIED === '1') assert.equal(evidence.originalThirdPartyStorage, 'SecurityError');
    const menu = await state(frame);
    assert.ok(menu.renderer === 'webgl2' && menu.canvasWidth > 0 && menu.canvasHeight > 0);
    evidence.status = {waiting:await statusOutsideFrame(dialog, frame)};
    await page.screenshot({path:join(dir, 'menu.png')});
    const session = await page.evaluate(() => window.__gameCommands.filter(c => c.command === 'game_controller_state').at(-1).session);
    const send = controller(page, session);
    await send(true);
    await wait(frame, () => window.JoystickGameQA.snapshot().controller.connected);
    evidence.status.connected = await statusOutsideFrame(dialog, frame);
    assert.match(evidence.status.connected, /已连接无线手柄.*P1 QA-Pad/);
    evidence.motion = await play(page, frame, send, tanks);
    await statusOutsideFrame(dialog, frame);
    await page.screenshot({path:join(dir, 'playing.png')});
    await send(false);
    await wait(frame, () => !window.JoystickGameQA.snapshot().controller.connected);
    evidence.status.disconnected = await statusOutsideFrame(dialog, frame);
    assert.match(evidence.status.disconnected, /搜索键/);
    await dialog.locator('[data-close-game]').click();
    await page.waitForFunction(() => !window.__windowFullscreen && !document.querySelector('dialog.game-player[open]'));
    evidence.restoredWindow = true;
    evidence.gamePairingPanelHidden = true;
    await Promise.all(hashes);
    assert.ok(evidence.files['tv.html']);
    if (tanks) assert.ok(evidence.files['web-layout.js'] && evidence.files['claude-of-tanks.js']);
    evidence.success = true;
  } finally {
    await writeFile(join(dir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    await page.close();
  }
}

const selected = games.filter(g => !process.env.GAME_ID || process.env.GAME_ID === g.id);
assert.ok(selected.length, 'Unknown GAME_ID');
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH,
  args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try {
  for (const game of selected) { await verify(browser, game); console.log(game.id, 'PASS'); }
} finally { await browser.close(); }
