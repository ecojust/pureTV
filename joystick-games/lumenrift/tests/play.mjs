import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { chromium } from 'playwright-core';

const output = process.env.SCREENSHOTS;
if (output) await mkdir(output, { recursive: true });
const mime = { 'tv.html': 'text/html', 'lumenrift.js': 'text/javascript', 'lumenrift.css': 'text/css' };
const server = createServer(async (req, res) => {
  const name = req.url.slice(1);
  if (!Object.hasOwn(mime, name)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', mime[name]);
  res.end(await readFile(new URL('../dist/' + name, import.meta.url)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port + '/';
const executablePath = process.env.CHROMIUM || ['/usr/bin/chromium', '/usr/bin/google-chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
try {
  for (const [source, width, height] of [['keyboard', 960, 540], ['wifi', 1280, 720], ['phone', 720, 480]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const network = [];
    page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(base)) network.push(request.url()); });
    if (source !== 'keyboard') {
      await page.addInitScript(transport => {
        window.player = { id: 1, connected: true, transport, session: 'fixture', controllerId: 'TEST01', x: 0, y: 0, buttons: {} };
        window.PureGameHost = {
          getInfo: () => JSON.stringify({ wifiController: { port: 63485 } }),
          snapshot: () => JSON.stringify({ players: [window.player] }),
        };
      }, source);
    }
    const snap = () => page.evaluate(() => JoystickGameQA.snapshot());
    async function press(action) {
      if (source === 'keyboard') {
        await page.keyboard.press(({ START: 'p', X: 'l', A: 'Enter', RIGHT: 'ArrowRight', Y: 'i', B: 'k' })[action]);
      } else {
        for (const down of [true, false]) {
          await page.evaluate(async ({ action, down }) => {
            const p = window.player;
            if (p.transport === 'wifi') p.buttons[action] = down;
            else if (action === 'RIGHT') p.x = down ? 1 : 0;
            else p[({ START: 'start', X: 'buttonX', A: 'a', Y: 'buttonY', B: 'b' })[action]] = down;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          }, { action, down });
        }
      }
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
    await page.goto(base + 'tv.html');
    await page.waitForFunction(() => window.JoystickGameQA?.snapshot().frames > 1);
    const bounds = await page.locator('canvas#game').boundingBox();
    await page.waitForSelector('.screen .realms');
    if (output) await page.screenshot({ path: output + '/' + source + '-menu.jpg', quality: 75 });
    await press('START');
    assert.equal((await snap()).stage, 'playing');
    const playingBounds = await page.locator('canvas#game').boundingBox();
    assert.deepEqual(playingBounds, bounds);
    await press('X');
    assert.equal((await snap()).gameplay.toolbar, true);
    await press('RIGHT');
    await press('A');
    assert.equal((await snap()).gameplay.placing, 'arbalest');
    await press('A');
    assert.equal((await snap()).gameplay.buildings, 1);
    await press('B');
    await press('Y');
    assert.equal((await snap()).gameplay.wave, 1);
    await page.waitForFunction(() => JoystickGameQA.snapshot().gameplay.time > 1);
    if (output) await page.screenshot({ path: output + '/' + source + '-play.jpg', quality: 75 });
    await press('START');
    assert.equal((await snap()).stage, 'paused');
    const paused = (await snap()).gameplay.time;
    await page.waitForTimeout(200);
    assert.equal((await snap()).gameplay.time, paused);
    await press('START');
    assert.equal((await snap()).stage, 'playing');
    if (source === 'keyboard') {
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    } else {
      await page.evaluate(() => { window.player.connected = false; });
      await page.waitForFunction(() => JoystickGameQA.snapshot().paused);
      await page.evaluate(() => { window.player.connected = true; });
      await page.waitForFunction(() => JoystickGameQA.snapshot().controller.connected);
    }
    assert.equal((await snap()).stage, 'paused');
    assert.deepEqual(await page.locator('canvas#game').boundingBox(), bounds);
    await page.reload();
    await page.waitForSelector('.save-go');
    await page.locator('.save-go').first().click();
    await page.waitForFunction(() => !window.lumenrift.inAttract);
    assert.equal((await snap()).gameplay.buildings, 1);
    assert.deepEqual(errors, []);
    assert.deepEqual(network, []);
    console.log(source, width, height, 'built Arbalest, called wave, paused, cancelled and restored saved run');
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
