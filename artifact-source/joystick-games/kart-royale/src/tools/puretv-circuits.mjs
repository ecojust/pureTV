/** Exercise the built TV entry with ordinary keyboard events.
 * Run with the existing Puppeteer dev dependency from src/package-lock.json.
 * The optional --sample-draws flag is for slow software rasterizers only.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const [url, output, ...options] = process.argv.slice(2);
if (!url || !output) throw Error('Usage: node tools/puretv-circuits.mjs <tv.html URL> <capture directory> [--sample-draws]');
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  headless: !process.env.DISPLAY,
  executablePath: process.env.CHROMIUM || undefined,
  protocolTimeout: 600000,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    '--use-gl=angle', '--use-angle=' + (process.env.DISPLAY ? 'gl' : 'swiftshader')],
});

// Only the call to draw the scene is sampled. Input, the countdown, physics,
// collision detection, AI, scenery construction and HUD still update normally.
function sampleCountdownDraws() {
  function attach() {
    const ctx = window.__ctx;
    if (!ctx?.renderer || !window.__gameReady) { requestAnimationFrame(attach); return; }
    const renderer = ctx.renderer;
    const render = renderer.render;
    renderer.render = function (...args) {
      if (ctx.race.state === 1 && ctx.frame % 48 !== 0) return;
      if (ctx.race.state === 2 && ctx.race.player.forwardSpeed < 5 && ctx.frame % 12 !== 0) return;
      if (ctx.race.state === 2 && ctx.race.player.forwardSpeed >= 5) renderer.render = render;
      return render.apply(this, args);
    };
  }
  attach();
}

try {
  for (const [course, name, direction, width] of [
    ['cape-crown', 'Cape Crown Circuit', 'ArrowRight', 960],
    ['marina-esses', 'Marina Esses', 'ArrowLeft', 1280],
  ]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.setDefaultTimeout(720000);
    await page.setViewport({width, height: width * 9 / 16});
    if (options.includes('--sample-draws')) await page.evaluateOnNewDocument(sampleCountdownDraws);
    await page.goto(url);
    await page.waitForFunction(() => window.__gameReady && document.querySelector('.kr-s-title.on'));
    await page.keyboard.down(direction);
    await page.waitForFunction(label => document.querySelector('.kr-circuits .kr-sub').textContent === label, {}, name);
    await page.keyboard.up(direction);
    await page.keyboard.press('Enter');
    await page.waitForFunction(id => window.__gameReady && window.JoystickGameQA.snapshot().gameplay.menu === 'select'
      && window.JoystickGameQA.snapshot().gameplay.circuit === id, {}, course);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.JoystickGameQA.snapshot().gameplay.phase === 'racing');
    await page.keyboard.down('ArrowUp');
    await page.waitForFunction(() => window.JoystickGameQA.snapshot().gameplay.speed > 5);
    await page.keyboard.up('ArrowUp');
    console.log(course, await page.evaluate(() => window.JoystickGameQA.snapshot().gameplay));
    await page.screenshot({path: path.join(output, course + '.jpg'), quality: 85});
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
