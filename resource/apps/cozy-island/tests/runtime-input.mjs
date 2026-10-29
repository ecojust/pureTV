// Exercise the actual runtime lifecycle entry points with a simulated native
// room bridge. A suspended animation loop does not run game.step(), so model
// pause tests alone cannot catch a delayed release awarding a phantom insect.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { basename } from 'node:path';

const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const assets = new URL('../src/main/assets/', import.meta.url);

export async function runRuntimeInputTests() {
  const server = http.createServer(async (request, response) => {
    try {
      const name = new URL(request.url, 'http://localhost').pathname.slice(1) || 'tv.html';
      if (name !== basename(name)) throw new Error('Invalid asset path');
      if (name === 'favicon.ico') { response.writeHead(204).end(); return; }
      response.setHeader('Content-Type', name.endsWith('.js') ? 'application/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
      response.end(await readFile(new URL(name, assets)));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  try {
    for (const scenario of ['native-release', 'native-held', 'native-press-during-pause', 'hidden-release', 'keyboard-blur']) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      await context.addInitScript(() => {
        window.__phone = { id: 1, connected: true, x: 0, y: 0, a: false };
        window.__hidden = false;
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__hidden });
        window.CozyIslandHost = {
          getInfo: () => JSON.stringify({ language: 'en', url: '', qr: '' }),
          snapshot: () => JSON.stringify({ players: [window.__phone, window.__secondPhone].filter(Boolean) }),
          publish: () => {},
        };
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/tv.html`);
      await page.waitForFunction(() => window.CozyIslandTV && window.CozyIslandTV.game);
      // Position only the wildlife encounter; input, pause/resume, animation
      // scheduling, inventory changes and persistent storage remain real.
      await page.evaluate(scenario => {
        const api = window.CozyIslandTV, g = api.game, p = g.players[0], species = g.constructor.World.insects[0];
        api.suspend(true);
        if (scenario === 'keyboard-blur') g.selectedPlayers = 2;
        g.start(); g.clock = 540; g.elapsed = 0;
        if (scenario === 'keyboard-blur') {
          window.__secondPhone = { id: 2, connected: true, a: true };
          g.players[1].tool = 'net';
        }
        p.x = species.x; p.y = species.y + 1.1; p.facing = { x: 0, y: -1 }; p.tool = 'net';
        g.updateInsects(0); g.save(); api.suspend(false);
        window.__phone.a = scenario !== 'native-press-during-pause' && scenario !== 'keyboard-blur';
      }, scenario);
      if (scenario === 'keyboard-blur') await page.keyboard.down('z');
      if (scenario === 'native-press-during-pause') {
        await page.waitForFunction(() => window.CozyIslandTV.game.frame >= 3);
        assert.equal(await page.evaluate(() => window.CozyIslandTV.game.players[0].previous.a), false);
      } else await page.waitForFunction(() => window.CozyIslandTV.game.players[0].netRaised);
      const before = await page.evaluate(() => {
        const g = window.CozyIslandTV.game;
        return { coins: g.coins, inventory: g.players[0].inventory, journal: g.insectJournal };
      });
      await page.evaluate(scenario => {
        if (scenario.startsWith('native')) window.CozyIslandTV.suspend(true);
        else if (scenario === 'hidden-release') {
          window.__hidden = true; document.dispatchEvent(new Event('visibilitychange'));
        } else window.dispatchEvent(new Event('blur'));
        if (scenario === 'native-press-during-pause') window.__phone.a = true;
        else if (scenario !== 'native-held') window.__phone.a = false;
      }, scenario);
      assert.equal(await page.evaluate(() => window.CozyIslandTV.game.players[0].netRaised), false, scenario + ': lifecycle entry cancels the armed net immediately');
      if (scenario === 'keyboard-blur') assert.equal(await page.evaluate(() => window.CozyIslandTV.game.players[1].netRaised), true, 'TV keyboard blur must preserve the other resident\'s phone gesture');
      const frozenFrame = await page.evaluate(() => window.CozyIslandTV.game.frame);
      await page.waitForTimeout(80);
      if (scenario !== 'blur-release' && scenario !== 'keyboard-blur') assert.equal(await page.evaluate(() => window.CozyIslandTV.game.frame), frozenFrame, scenario + ': runtime really skips model steps');
      if (scenario === 'keyboard-blur') await page.keyboard.up('z');
      await page.evaluate(scenario => {
        if (scenario.startsWith('native')) window.CozyIslandTV.suspend(false);
        else if (scenario === 'hidden-release') {
          window.__hidden = false; document.dispatchEvent(new Event('visibilitychange'));
        }
      }, scenario);
      await page.waitForFunction(frame => window.CozyIslandTV.game.frame >= frame + 3, frozenFrame);
      if (scenario === 'native-held' || scenario === 'native-press-during-pause') {
        assert.equal(await page.evaluate(() => window.CozyIslandTV.game.players[0].netRaised), false, scenario + ': a gesture held across or started during native pause cannot arm the net');
        await page.evaluate(() => { window.__phone.a = false; });
        await page.waitForFunction(() => !window.CozyIslandTV.game.players[0].previous.a);
      }
      const after = await page.evaluate(() => {
        const g = window.CozyIslandTV.game; g.save();
        const saved = JSON.parse(localStorage.getItem(g.constructor.SAVE_KEY));
        return {
          live: { coins: g.coins, inventory: g.players[0].inventory, journal: g.insectJournal },
          saved: { coins: saved.coins, inventory: saved.players[0].inventory, journal: saved.insectJournal },
          swing: g.players[0].netSwing,
        };
      });
      assert.deepEqual(after.live, before, scenario + ': resume must not award a catch or discovery reward');
      assert.deepEqual(after.saved, before, scenario + ': autosave must not contain a phantom reward');
      assert.equal(after.swing, 0, scenario + ': no release animation is queued');
      // A new deliberate gesture still works after the cancellation.
      if (scenario === 'keyboard-blur') await page.keyboard.down('z');
      else await page.evaluate(() => { window.__phone.a = true; });
      await page.waitForFunction(() => window.CozyIslandTV.game.players[0].netRaised);
      if (scenario === 'keyboard-blur') await page.keyboard.up('z');
      else await page.evaluate(() => { window.__phone.a = false; });
      await page.waitForFunction(() => window.CozyIslandTV.game.insectJournal.meadowButterfly === 1);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS cozy-island runtime ${scenario}: canceled release, unchanged save, fresh gesture works`);
    }
    await runPhoneCancellationTests(browser, `http://127.0.0.1:${server.address().port}`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

async function runPhoneCancellationTests(browser, baseUrl) {
  for (const scenario of ['pointercancel', 'lostpointercapture', 'blur', 'resize']) {
    const tvContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await tvContext.addInitScript(() => {
      window.__phone = { id: 1, connected: true, a: false, cancelSeq: 0 };
      window.CozyIslandHost = {
        getInfo: () => JSON.stringify({ language: 'en', url: '', qr: '' }),
        snapshot: () => JSON.stringify({ players: [window.__phone] }), publish: () => {},
      };
    });
    const tv = await tvContext.newPage(), errors = [];
    tv.on('pageerror', error => errors.push(error.message));
    await tv.goto(baseUrl + '/tv.html');
    await tv.waitForFunction(() => window.CozyIslandTV && window.CozyIslandTV.game);
    await tv.evaluate(() => {
      const api = window.CozyIslandTV, g = api.game, p = g.players[0], species = g.constructor.World.insects[0];
      api.suspend(true); g.start(); g.clock = 540; g.elapsed = 0;
      p.x = species.x; p.y = species.y + 1.1; p.facing = { x: 0, y: -1 }; p.tool = 'net';
      g.updateInsects(0); g.save(); api.suspend(false);
    });
    const phoneContext = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
    const phone = await phoneContext.newPage(), frames = [];
    phone.on('pageerror', error => errors.push(error.message));
    await phone.addInitScript(() => {
      document.addEventListener('pointerdown', event => { window.__pointerId = event.pointerId; }, true);
    });
    let relayed = Promise.resolve();
    // Route only the room transport: the phone page, WebSocket API, pointer
    // capture, serialized frames, TV runtime and game simulation remain real.
    await phone.routeWebSocket('**/ws?*', socket => {
      socket.onMessage(raw => {
        const frame = JSON.parse(raw);
        if (frame.type === 'hello') {
          socket.send(JSON.stringify({ type: 'welcome', player: 1, session: 'phone-cancellation-test' }));
          socket.send(JSON.stringify({ type: 'state', phase: 'playing' }));
        } else if (frame.type === 'input') {
          frames.push(frame);
          relayed = relayed.then(() => tv.evaluate(frame => {
            window.__phone = Object.assign({ id: 1, connected: true }, frame);
          }, frame));
        }
      });
    });
    await phone.goto(baseUrl + '/controller.html?room=0123456789abcdef0123456789abcdef');
    await phone.waitForFunction(() => document.querySelector('#controller').dataset.connected === 'true');
    const cdp = await phoneContext.newCDPSession(phone);
    const bounds = await phone.locator('#button-a').boundingBox();
    const contact = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, id: 1 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [contact] });
    await tv.waitForFunction(() => window.CozyIslandTV.game.players[0].netRaised);
    if (scenario === 'pointercancel') {
      // Canceling another finger must not cancel the finger still holding A.
      for (const target of ['joystick-zone', 'button-a']) {
        await phone.locator('#' + target).dispatchEvent('pointerdown', { pointerId: 41, pointerType: 'touch', button: 0 });
        await phone.locator('#' + target).dispatchEvent('pointercancel', { pointerId: 41, pointerType: 'touch', button: 0 });
        await relayed;
        assert.equal(frames.at(-1).a, true, target + ': the original A finger remains held');
        assert.equal(frames.at(-1).cancelSeq, 0, target + ': an unrelated canceled finger does not cancel effective A');
        assert.equal(await tv.evaluate(() => window.CozyIslandTV.game.players[0].netRaised), true);
      }
      for (const key of ['ArrowLeft', 'z']) {
        await tv.keyboard.down(key);
        await tv.evaluate(() => window.dispatchEvent(new Event('blur')));
        await tv.keyboard.up(key);
        assert.equal(await tv.evaluate(() => window.CozyIslandTV.game.players[0].netRaised), true, key + ': TV keyboard blur preserves the phone finger holding A');
      }
      await tv.evaluate(() => { window.CozyIslandTV.game.players[0].facing = { x: 0, y: -1 }; });
    }
    const before = await tv.evaluate(() => {
      const g = window.CozyIslandTV.game;
      return { coins: g.coins, inventory: g.players[0].inventory, journal: g.insectJournal };
    });
    if (scenario === 'pointercancel') await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    else if (scenario === 'lostpointercapture') {
      const pointerId = await phone.evaluate(() => window.__pointerId);
      await phone.locator('#button-a').dispatchEvent('lostpointercapture', { pointerId, pointerType: 'touch' });
    } else if (scenario === 'blur') await phone.evaluate(() => window.dispatchEvent(new Event('blur')));
    else await phone.setViewportSize({ width: 846, height: 390 });
    await tv.waitForFunction(() => window.__phone.cancelSeq === 1 && !window.CozyIslandTV.game.players[0].netRaised);
    if (scenario !== 'pointercancel') await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await phone.waitForTimeout(350);
    await relayed;
    assert.ok(frames.filter(frame => frame.cancelSeq === 1).length >= 2, scenario + ': cancellation marker survives the immediate event and heartbeat');
    assert.equal(frames.at(-1).cancelSeq, 1, scenario + ': late release/lostcapture does not cancel twice');
    const after = await tv.evaluate(() => {
      const g = window.CozyIslandTV.game; g.save();
      const saved = JSON.parse(localStorage.getItem(g.constructor.SAVE_KEY));
      return { live: { coins: g.coins, inventory: g.players[0].inventory, journal: g.insectJournal },
        saved: { coins: saved.coins, inventory: saved.players[0].inventory, journal: saved.insectJournal }, swing: g.players[0].netSwing };
    });
    assert.deepEqual(after.live, before, scenario + ': real phone cancellation cannot catch wildlife');
    assert.deepEqual(after.saved, before, scenario + ': no canceled gesture reward is saved');
    assert.equal(after.swing, 0);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [contact] });
    await tv.waitForFunction(() => window.CozyIslandTV.game.players[0].netRaised);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await tv.waitForFunction(() => window.CozyIslandTV.game.insectJournal.meadowButterfly === 1);
    await relayed;
    assert.equal(frames.at(-1).cancelSeq, 1, scenario + ': ordinary pointerup and automatic lostcapture do not cancel a catch');
    if (scenario === 'pointercancel') {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [contact] });
      await phone.locator('#button-b').dispatchEvent('pointerdown', { pointerId: 42, pointerType: 'touch', button: 0 });
      await phone.locator('#button-b').dispatchEvent('pointercancel', { pointerId: 42, pointerType: 'touch' });
      await relayed;
      assert.equal(frames.at(-1).a, true, 'canceling B leaves the A finger held');
      assert.equal(frames.at(-1).cancelSeq, 1, 'canceling B does not cancel effective A');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await relayed;
    }
    assert.deepEqual(errors, []);
    await phoneContext.close(); await relayed; await tvContext.close();
    console.log(`PASS cozy-island real phone ${scenario}: persistent marker, no phantom save, normal release catches`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await runRuntimeInputTests();
