// Run a Manager frontend locally, and set LOCAL_GAME_BASE to the installed game's loopback session URL.
// Example: MANAGER_URL=http://127.0.0.1:1420 QA_OUTPUT=/tmp/manager-qa node tools/pc-games/qa/manager-two-ports.mjs
// Use GAME_IDS=starfall,zof-duty for the next two local ports. The default remains the original pair.
// Set CHROMIUM_PATH to use installed Chromium, GAME_ID to run one title or EXPECT_DENIED=1 to require the blocked storage case.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from '../../../desktop/node_modules/playwright/index.mjs';
import { mockBridge, snapshot } from '../../../desktop/tests/fixtures.mjs';

const manager = process.env.MANAGER_URL || 'http://127.0.0.1:1420';
const output = resolve(process.env.QA_OUTPUT || join(tmpdir(), 'puretv-manager-two-ports'));
const pages = process.env.LOCAL_GAME_BASE;
assert.ok(pages && /^http:\/\/127\.0\.0\.1:4873[1-4]$/.test(new URL(pages).origin), 'Set LOCAL_GAME_BASE to the active desktop game session');
const games = [
  {id:'openaero-dfw', name:'达拉斯飞行模拟', category:'flight', start:'#btnStartFlight'},
  {id:'claude-of-tanks', name:'克劳德坦克', category:'action', start:'.cot-battle'},
  {id:'starfall', name:'星落舰队', category:'strategy', start:'#launch', assets:['starfall.js']},
  {id:'zof-duty', name:'光球挑战', category:'arcade', start:'#primary', assets:['game.js','core.js','arena.js','targets.js']},
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

async function pressAndWait(frame, send, key, check, arg) {
  await send(true, {[key]:true});
  try { await wait(frame, check, arg); }
  finally { await send(true); }
  await wait(frame, button => !window.JoystickGameQA.snapshot().controller.buttons[button], key);
}

async function playFleet(page, frame, send) {
  const initial = (await state(frame)).gameplay;
  await page.keyboard.press('Control+a');
  await wait(frame, () => window.JoystickGameQA.snapshot().gameplay.selected > 1);
  const keyboardFleetSize = (await state(frame)).gameplay.selected;
  await pressAndWait(frame, send, 'X', () => window.JoystickGameQA.snapshot().gameplay.selected === 1);
  const selected = (await state(frame)).gameplay;
  await pressAndWait(frame, send, 'RIGHT', x => window.JoystickGameQA.snapshot().gameplay.cursorX > x + 130, selected.cursorX);
  await pressAndWait(frame, send, 'DOWN', y => window.JoystickGameQA.snapshot().gameplay.cursorY > y + 110, selected.cursorY);
  // Inspect the selected ship on the two sides of the game's pointer handler. An automatic
  // harvesting order can resume before the next browser poll, even after a valid manual move.
  await frame.evaluate(() => {
    const canvas = document.querySelector('#viewport');
    const world = window.__starfall.world;
    const order = () => structuredClone(world.ships.get(world.selection[0]).order);
    const event = window.__managerOrderCheck = {};
    canvas.addEventListener('pointerdown', e => { if (e.button === 2) event.before = order(); }, {capture:true, once:true});
    canvas.addEventListener('pointerup', e => { if (e.button === 2) event.after = order(); }, {once:true});
  });
  await pressAndWait(frame, send, 'B', () => window.__managerOrderCheck.after?.manual === true);
  const command = await frame.evaluate(() => window.__managerOrderCheck);
  assert.notDeepEqual(command.before, command.after);
  await wait(frame, p => {
    const g = window.JoystickGameQA.snapshot().gameplay;
    return Math.hypot(g.x-p.x, g.y-p.y, g.z-p.z) > 3;
  }, selected);
  return {initial, keyboardFleetSize, selected, command, afterOrder:(await state(frame)).gameplay};
}

async function playOrbs(page, frame, send) {
  const initial = (await state(frame)).gameplay;
  await pressAndWait(frame, send, 'A', () => {
    const g = window.JoystickGameQA.snapshot().gameplay;
    return g.hits === 1 && g.score === 100;
  });
  await page.keyboard.down('ArrowLeft');
  try { await wait(frame, x => window.JoystickGameQA.snapshot().gameplay.cursorX < x - .04, initial.cursorX); }
  finally { await page.keyboard.up('ArrowLeft'); }
  const keyboard = (await state(frame)).gameplay;
  await pressAndWait(frame, send, 'RIGHT', x => window.JoystickGameQA.snapshot().gameplay.cursorX > x + .07, keyboard.cursorX);
  return {initial, keyboard, pad:(await state(frame)).gameplay};
}

async function play(page, frame, send, game) {
  const tanks = game.id === 'claude-of-tanks';
  if (game.id === 'openaero-dfw') {
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
  if (game.id === 'starfall') return playFleet(page, frame, send);
  if (game.id === 'zof-duty') return playOrbs(page, frame, send);
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
    bridge:'Simulated Tauri fullscreen and wireless controller events', source:'Bundled game project and desktop adapters', files:{}};
  const hashes = [];
  page.on('response', response => {
    const url = new URL(response.url());
    if (!response.url().startsWith(pages + game.id + '/') || response.status() !== 200) return;
    const file = url.pathname.split('/').at(-1);
    if (!['tv.html','web-layout.js','claude-of-tanks.js',...(game.assets || [])].includes(file) && !/^tv-[\w-]+\.js$/.test(file)) return;
    hashes.push(response.body().then(data => {
      evidence.files[file] = {bytes:data.length, sha256:createHash('sha256').update(data).digest('hex')};
    }).catch(err => { evidence.hashReadError = String(err); }));
  });
  try {
    // Observe the native property before the game's storage fallback runs.
    await page.addInitScript(origin => {
      if (window === window.top || location.origin !== origin) return;
      try { void window.localStorage.length; window.__qaOriginalStorage = 'available'; }
      catch (error) { window.__qaOriginalStorage = error.name; }
    }, new URL(pages).origin);
    await mockBridge(page, snapshot(), {localGameBase:pages});
    await page.goto(manager, {waitUntil:'domcontentloaded'});
    await page.locator('[data-page="games"]').click();
    if (game.assets) {
      await page.locator('[data-play-game]').first().waitFor({state:'attached'});
      evidence.catalogSize = await page.locator('[data-play-game]').count();
      const expectedCount = Number(process.env.EXPECT_GAME_COUNT || 0);
      if (expectedCount) assert.equal(evidence.catalogSize, expectedCount);
    }
    await page.locator('[name="gameGroup"]').selectOption(game.category);
    const card = page.locator('[data-play-game="' + game.id + '"]');
    assert.equal(await card.getAttribute('aria-label'), game.name);
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
    if (game.assets) {
      assert.doesNotMatch(await frame.locator('body').innerText(), /外部浏览器打开|在浏览器中打开|使用浏览器打开/);
      evidence.noBrowserOpenPrompt = true;
    }
    await page.screenshot({path:join(dir, 'menu.png')});
    const session = await page.evaluate(() => window.__gameCommands.filter(c => c.command === 'game_controller_state').at(-1).session);
    const send = controller(page, session);
    await send(true);
    await wait(frame, () => window.JoystickGameQA.snapshot().controller.connected);
    evidence.status.connected = await statusOutsideFrame(dialog, frame);
    assert.match(evidence.status.connected, /已连接无线手柄.*P1 QA-Pad/);
    evidence.motion = await play(page, frame, send, game);
    await statusOutsideFrame(dialog, frame);
    await page.screenshot({path:join(dir, 'playing.png')});
    await send(false);
    await wait(frame, () => !window.JoystickGameQA.snapshot().controller.connected);
    if (game.assets) {
      await wait(frame, () => window.JoystickGameQA.snapshot().stage === 'paused');
      evidence.disconnectPausedGame = true;
    }
    evidence.status.disconnected = await statusOutsideFrame(dialog, frame);
    assert.match(evidence.status.disconnected, /搜索键/);
    await dialog.locator('[data-close-game]').click();
    await page.waitForFunction(() => !window.__windowFullscreen && !document.querySelector('dialog.game-player[open]'));
    evidence.restoredWindow = true;
    if (game.assets) {
      assert.equal(await card.evaluate(node => document.activeElement === node), true);
      evidence.restoredCardFocus = true;
    }
    evidence.gamePairingPanelHidden = true;
    await Promise.all(hashes);
    assert.ok(evidence.files['tv.html']);
    if (tanks) assert.ok(evidence.files['web-layout.js'] && evidence.files['claude-of-tanks.js']);
    if (game.assets) {
      const manifest = new URL('../../../joystick-games/' + game.id + '/packages.json', import.meta.url);
      const {android} = JSON.parse(await readFile(manifest, 'utf8'));
      evidence.signedRelease = {version:android.version, sourceCommit:android.sourceCommit,
        sha256:android.sha256, buildRunId:android.buildRunId};
      const localApk = await readFile(new URL(android.file, manifest));
      assert.equal(createHash('sha256').update(localApk).digest('hex'), android.sha256);
    }
    for (const file of game.assets || []) {
      const local = new URL('../../../joystick-games/' + game.id + '/dist/' + file, import.meta.url);
      const expected = createHash('sha256').update(await readFile(local)).digest('hex');
      assert.equal(evidence.files[file]?.sha256, expected, 'Pages differs from the local release for ' + file);
    }
    evidence.success = true;
  } finally {
    await writeFile(join(dir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    await page.close();
  }
}

const ids = (process.env.GAME_ID || process.env.GAME_IDS || 'openaero-dfw,claude-of-tanks').split(',');
const selected = ids.map(id => {
  const game = games.find(item => item.id === id);
  assert.ok(game, 'Unknown game ' + id);
  return game;
});
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH,
  args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try {
  for (const game of selected) { await verify(browser, game); console.log(game.id, 'PASS'); }
} finally { await browser.close(); }
