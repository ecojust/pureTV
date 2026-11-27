// Run with the games directory produced by stage_web_games.py --game nerd-of-duty.
// npm ci --prefix desktop && node tools/pc-games/qa/ledger-layout.mjs /path/to/staged/games
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';

const {chromium} = createRequire(new URL('../../../desktop/package.json', import.meta.url))('playwright');
assert.ok(process.argv[2], 'Pass the staged games directory');
const directory = path.resolve(process.argv[2]);
const browser = await chromium.launch({
  executablePath:process.env.CHROMIUM_PATH || undefined,
  args:['--enable-unsafe-swiftshader'],
});

try {
  const page = await browser.newPage({viewport:{width:640, height:266}});
  page.setDefaultTimeout(120_000);
  // Hold the engine bundle so the real loading screen can be measured before it fades.
  let startEngine;
  const loading = new Promise(resolve => { startEngine = resolve; });
  await page.route('http://127.0.0.1/**', async route => {
    const file = new URL(route.request().url()).pathname;
    if (file === '/nerd-of-duty/nerd-of-duty.js') await loading;
    await route.fulfill({path:path.join(directory, file)});
  });
  async function assertVisible(selector) {
    const element = page.locator(selector);
    await element.waitFor({state:'visible'});
    const rect = await element.boundingBox();
    const {width, height} = page.viewportSize();
    assert.ok(rect.x >= -1 && rect.y >= -1 && rect.x + rect.width <= width + 1 &&
      rect.y + rect.height <= height + 1, `${selector} clipped in ${width}×${height}: ${JSON.stringify(rect)}`);
  }

  await page.goto('http://127.0.0.1/nerd-of-duty/tv.html?lang=zh', {waitUntil:'commit'});
  try {
    await assertVisible('.boot-mode');
    await assertVisible('.boot-foot');
  } finally { startEngine(); }
  await page.waitForFunction(() => window.JoystickGameQA?.snapshot().ready);
  await page.locator('#boot').waitFor({state:'hidden'});
  console.log('Loading screen fits 640×266.');
  // The Manager toolbar and loading status consume part of the window height.
  for (const [width, height] of [[1280,666], [960,486], [640,290]]) {
    await page.setViewportSize({width, height});
    await assertVisible('.ow-att-inner');
    await assertVisible('.ow-att-footer');
    const renderer = await page.evaluate(() => {
      const engine = window.__ENGINE__;
      const render = engine.ctx.peek('render');
      const gl = render.renderer.getContext();
      return {
        software:engine.config.softwareGpu, quality:engine.config.quality,
        buffer:[gl.drawingBufferWidth, gl.drawingBufferHeight],
        scene:[render.hdrRt.width, render.hdrRt.height],
      };
    });
    const scale = renderer.software ? Math.min(1, 960 / width) : 1;
    assert.equal(renderer.quality, renderer.software ? 'low' : 'ultra');
    assert.deepEqual(renderer.buffer, [Math.floor(width * scale), Math.floor(height * scale)]);
    // The software path draws directly to the canvas. Ultra draws the world into its HDR target first.
    if (!renderer.software) assert.deepEqual(renderer.scene, [width, height]);
    console.log(`Role selection fits ${width}×${height}.`);
  }
  await page.locator('.ow-att-card').first().click();
  await page.waitForFunction(() => JoystickGameQA.snapshot().stage === 'playing');
  await assertVisible('.ow-ammo');
  await page.keyboard.down('p');
  await page.waitForFunction(() => JoystickGameQA.snapshot().stage === 'paused');
  await page.keyboard.up('p');
  await assertVisible('.ow-menu-inner');
  await page.locator('.ow-menu-inner .hint').scrollIntoViewIfNeeded();
  await assertVisible('.ow-menu-inner .hint');
  console.log('Ledger loading screen, role selection, gameplay and pause layout passed.');
} finally {
  await browser.close();
}
