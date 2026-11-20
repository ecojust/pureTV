const { chromium } = require(process.env.PLAYWRIGHT_CORE_MODULE || 'playwright-core');
const path = require('node:path');

async function capture() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) console.log(msg.type(), msg.text().slice(0, 700));
    });
    page.on('pageerror', error => console.log('pageerror', String(error)));
    await page.addInitScript(() => {
      const prototype = WebGL2RenderingContext.prototype;
      const originalGet = prototype.getExtension;
      const originalList = prototype.getSupportedExtensions;
      const limited = name => /^ext_color_buffer_(?:half_)?float$/i.test(name);
      prototype.getExtension = function (name) {
        return limited(name) ? null : originalGet.call(this, name);
      };
      prototype.getSupportedExtensions = function () {
        return originalList.call(this).filter(name => !limited(name));
      };
    });
    const url = new URL('/tv.html', process.env.BACKROAD_ORIGIN || 'http://localhost:17427');
    url.search = 'mode=quick&stage=finland&car=swift&cond=stage&weather=stage&quality=low&scale=0.5&cascades=0&draw=near&crowd=0';
    await page.goto(url.href, { timeout: 120000, waitUntil: 'domcontentloaded' });
    for (let attempt = 0; attempt < 160; attempt++) {
      await page.waitForTimeout(5000);
      const state = await page.evaluate(() => {
        const snapshot = window.JoystickGameQA?.snapshot();
        return {
          phase: snapshot?.gameplay.phase, ready: snapshot?.gameplay.ready, frames: snapshot?.frames, paused: snapshot?.paused,
          hud: document.querySelector('#frame-hud')?.textContent?.match(/post (on|off) · quality [a-z]+/)?.[0],
        };
      });
      console.log(state);
      if (state.ready && state.frames > 15) break;
    }
    const state = await page.evaluate(() => ({
      hud: document.querySelector('#frame-hud')?.textContent,
      state: window.JoystickGameQA.snapshot().gameplay,
      gl: document.querySelector('canvas').getContext('webgl2').getSupportedExtensions().filter(name => /color_buffer/.test(name)),
    }));
    console.log(state);
    if (!state.state.ready || !state.hud.includes('post off') || state.gl.length) throw Error('Expected the original ready stage with RGBA8 direct rendering');
    await page.screenshot({ path: path.resolve(process.env.BACKROAD_SCREENSHOT || 'finland.png'), timeout: 45000, animations: 'allow' });
  } finally {
    await browser.close();
  }
}
capture().catch(error => { console.error(error); process.exitCode = 1; });
