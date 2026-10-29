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
    for (const scenario of ['native-release', 'native-held', 'native-press-during-pause', 'hidden-release', 'blur-release']) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      await context.addInitScript(() => {
        window.__phone = { id: 1, connected: true, x: 0, y: 0, a: false };
        window.__hidden = false;
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__hidden });
        window.CozyIslandHost = {
          getInfo: () => JSON.stringify({ language: 'en', url: '', qr: '' }),
          snapshot: () => JSON.stringify({ players: [window.__phone] }),
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
        api.suspend(true); g.start(); g.clock = 540; g.elapsed = 0;
        p.x = species.x; p.y = species.y + 1.1; p.facing = { x: 0, y: -1 }; p.tool = 'net';
        g.updateInsects(0); g.save(); api.suspend(false);
        window.__phone.a = scenario !== 'native-press-during-pause';
      }, scenario);
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
      const frozenFrame = await page.evaluate(() => window.CozyIslandTV.game.frame);
      await page.waitForTimeout(80);
      if (scenario !== 'blur-release') assert.equal(await page.evaluate(() => window.CozyIslandTV.game.frame), frozenFrame, scenario + ': runtime really skips model steps');
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
      await page.evaluate(() => { window.__phone.a = true; });
      await page.waitForFunction(() => window.CozyIslandTV.game.players[0].netRaised);
      await page.evaluate(() => { window.__phone.a = false; });
      await page.waitForFunction(() => window.CozyIslandTV.game.insectJournal.meadowButterfly === 1);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS cozy-island runtime ${scenario}: canceled release, unchanged save, fresh gesture works`);
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await runRuntimeInputTests();
