// The original TV runtime polls a simulated native input. Check its actual DOM and canvas.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';

const require = createRequire(process.env.PURETV_PACKAGE || new URL('../../../desktop/package.json', import.meta.url));
const {chromium} = require('playwright');
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
try {
  for (const viewport of [{width: 960, height: 540}, {width: 1280, height: 720}]) {
    const page = await browser.newPage({viewport});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.testInputs = [];
      window.TetrisHost = {
        getInfo: () => JSON.stringify({language: 'en', wifiController: {state: 'available', port: 63485}}),
        snapshot: () => JSON.stringify({players: window.testInputs}),
        publish: () => {}
      };
    });
    await page.route('http://127.0.0.1/**', async route => {
      const name = new URL(route.request().url()).pathname.slice(1);
      if (!/^[a-z-]+\.(html|css|js)$/.test(name)) return route.fulfill({status: 404});
      const asset = new URL('../../apps/tetris/src/main/assets/' + name, import.meta.url);
      const contentType = name.endsWith('.js') ? 'application/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html';
      await route.fulfill({body: await readFile(asset), contentType});
    });
    await page.goto('http://127.0.0.1/tv.html');
    await page.waitForFunction(() => window.PureTVQA?.snapshot().phase === 'title');
    const field = page.locator('#battlefield');
    const before = await field.boundingBox();
    assert.ok(before.width > 0 && before.height > 0);
    for (const phone of [true, false]) {
      const seat = {id: 1, connected: true, session: 'private-token'};
      if (!phone) Object.assign(seat, {transport: 'wifi', controllerId: 'ESP32-0123456789'});
      await page.evaluate(seat => { window.testInputs = [seat]; }, seat);
      const card = page.locator(phone ? '[data-puretv-phone]' : '[data-puretv-controller-id]');
      await card.waitFor({state: 'visible'});
      const label = await card.innerText();
      assert.match(label, /1P/);
      assert.match(label, phone ? /Phone connected/ : /ESP32-0123456789/);
      assert.ok(!label.includes('private-token'));
      assert.deepEqual(await field.boundingBox(), before);
      const box = await card.boundingBox();
      assert.ok(box.x >= before.x + before.width || box.y >= before.y + before.height);
      await page.evaluate(() => { window.testInputs = []; });
      await card.waitFor({state: 'hidden'});
      assert.deepEqual(await field.boundingBox(), before);
    }
    assert.deepEqual(errors, []);
    console.log('Phone and Wi-Fi identities stay outside the unchanged canvas at', viewport);
    await page.close();
  }
} finally {
  await browser.close();
}
