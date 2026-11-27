// MANAGER_URL selects a running Manager. LOCAL_GAMES optionally points to the staged games/ directory.
// GAME_ID limits the run to one catalog entry. QA_OUTPUT receives the per-game screenshots and evidence.
import assert from 'node:assert/strict';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../../../desktop/node_modules/playwright/index.mjs';
import { mockBridge, snapshot } from '../../../desktop/tests/fixtures.mjs';

const pc = dirname(dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(await readFile(join(pc, 'hosted-games.json'), 'utf8'));
const categories = JSON.parse(await readFile(join(pc, '../readme-app-games.json'), 'utf8'));
const selected = catalog.filter(game => !process.env.GAME_ID || game.id === process.env.GAME_ID);
assert.ok(selected.length, 'No matching hosted game');
const manager = process.env.MANAGER_URL || 'http://127.0.0.1:1420';
const output = resolve(process.env.QA_OUTPUT || join(tmpdir(), 'puretv-hosted-games'));
const local = process.env.LOCAL_GAMES && resolve(process.env.LOCAL_GAMES);
const pages = 'https://ecojust.github.io/pureTV/games/';
const pagesOrigin = new URL(pages).origin;

async function mountStagedGames(page, game) {
  // Only pureTV's wrapper and covers are served locally. Author documents and game assets stay live.
  await page.route(pages + '**', async route => {
    const relative = decodeURIComponent(new URL(route.request().url()).pathname.slice(new URL(pages).pathname.length));
    if (![game.id + '/tv.html', game.id + '/thumb.webp', 'hosted-player.js'].includes(relative)) return route.fallback();
    const file = resolve(local, relative);
    if (!file.startsWith(local + sep)) return route.abort();
    if (!(await stat(file).catch(() => null))?.isFile()) return route.fulfill({status:404,body:'Missing staged file'});
    return route.fulfill({path:file});
  });
}

async function inspectOriginal(game, frame) {
  switch (game.id) {
    case 'bandit': {
      assert.equal(await frame.title(), 'Vault Breakers');
      const menu = frame.locator('#play-btn');
      await menu.waitFor({state:'visible'});
      await menu.click();
      const room = frame.locator('#create-btn');
      await room.waitFor({state:'visible'});
      await frame.waitForFunction(() => Number(getComputedStyle(document.querySelector('.title-menu')).opacity) >= .99);
      return {menu:'Vault Breakers', lobby:await room.innerText(), join:await frame.locator('#join-open').innerText()};
    }
    case 'noir-extreme': {
      await frame.locator('#title').waitFor({state:'visible'});
      const chapter = new URL(game.url).searchParams.get('start');
      if (!chapter) return {title:await frame.title()};
      await frame.locator('#title .opt[data-k="begin"]').click();
      await frame.waitForFunction(id => window.__noir?.game?.scenes?.current?.id === id,chapter,{timeout:90000});
      return await frame.evaluate(() => ({chapter:window.__noir.game.scenes.current.id,
        name:window.__noir.game.scenes.current.name, state:window.__noir.game.state}));
    }
    case 'vespertine': {
      await frame.locator('#btn-nights').click();
      const night = await frame.locator('#intro-name').innerText();
      await frame.locator('#btn-row').click();
      await frame.locator('#hud').waitFor({state:'visible'});
      await frame.waitForFunction(() => {
        const remaining = document.querySelector('#dawn-fill').style.transform.match(/scaleX\(([.\d]+)\)/);
        return remaining && Number(remaining[1]) < .98;
      });
      return {night, hud:await frame.locator('#hud-night').innerText()};
    }
    case 'daejeon-campus': {
      await frame.locator('#gamesBtn').click();
      await frame.locator('.course.pick').first().waitFor({state:'visible'});
      return {minigames:await frame.locator('.course.pick').count()};
    }
    case 'fish-loop':
      await frame.locator('#game-container canvas').first().waitFor({state:'visible'});
      await frame.waitForFunction(() => window.__fishloop?.sim?.status === 'playing' && window.__fishloop.sim.time > 1);
      return await frame.evaluate(() => ({surface:'Phaser canvas', level:window.__fishloop.sim.level.id,
        state:window.__fishloop.sim.status, buses:window.__fishloop.sim.buses.length}));
    case 'struggle-bus':
      await frame.waitForFunction(() => window.__game?.city?.loadedRegionCount() > 0);
      return {loadedRegions:await frame.evaluate(() => window.__game.city.loadedRegionCount())};
    default:
      // Further catalog entries may have an HTML title screen or a game drawn entirely on canvas.
      await frame.locator('canvas:visible, button:visible, [role="button"]:visible').first().waitFor();
      return {title:await frame.title()};
  }
}

// Validate the same pixels that are saved as evidence. A second capture can land on
// a transition. Exclude the Manager toolbar when checking the original document.
async function captureSource(page, frameElement, destination) {
  const box = await frameElement.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100);
  const deadline = Date.now() + 45000;
  let sample;
  do {
    const image = await page.screenshot({animations:'allow', timeout:45000});
    sample = await page.evaluate(async ({encoded, box}) => {
      const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(encoded), c => c.charCodeAt(0))], {type:'image/png'}));
      const canvas = document.createElement('canvas');
      canvas.width = 96; canvas.height = 54;
      const ctx = canvas.getContext('2d');
      const scale = bitmap.width / innerWidth;
      ctx.drawImage(bitmap, box.x * scale, box.y * scale, box.width * scale, box.height * scale, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const buckets = new Set();
      let lightest = 0, darkest = 255;
      for (let i = 0; i < pixels.length; i += 4) {
        const [r,g,b] = [pixels[i],pixels[i+1],pixels[i+2]];
        buckets.add((r >> 4) * 256 + (g >> 4) * 16 + (b >> 4));
        const luminance = 0.213 * r + 0.715 * g + 0.072 * b;
        lightest = Math.max(lightest,luminance);
        darkest = Math.min(darkest,luminance);
      }
      return {colors:buckets.size, contrast:Math.round(lightest-darkest)};
    }, {encoded:image.toString('base64'), box});
    if (sample.colors >= 12 && sample.contrast >= 40) {
      await writeFile(destination,image);
      return sample;
    }
    await new Promise(done => setTimeout(done, 400));
  } while (Date.now() < deadline);
  assert.fail('Original frame still blank or monochrome (' + JSON.stringify(sample) + ')');
}

async function verify(browser, game) {
  const dir = join(output, game.id);
  await mkdir(dir, {recursive:true});
  const page = await browser.newPage({locale:'zh-CN', viewport:{width:960,height:540}, ignoreHTTPSErrors:true});
  page.setDefaultTimeout(90000);
  const evidence = {game:game.id, name:game.zh, category:game.category, manager, checkedAt:new Date().toISOString(),
    wrapperSource:local ? 'local staged wrapper at Pages URL' : 'public pureTV Pages', browser:browser.version()};
  const authorErrors = [];
  page.on('pageerror', error => {
    if (authorErrors.length < 5) authorErrors.push(error.message);
  });
  try {
    if (local) await mountStagedGames(page, game);
    console.log(game.id, 'opening Manager card');
    await mockBridge(page, snapshot());
    await page.addInitScript(expected => {
      if (window !== top) return;
      window.__hostedReady = [];
      addEventListener('message', e => {
        if (e.origin === expected && e.source === document.querySelector('dialog.game-player[open] iframe')?.contentWindow &&
            e.data?.type === 'puretv:game-ready') window.__hostedReady.push(e.origin);
      });
    }, pagesOrigin);
    await page.goto(manager, {waitUntil:'domcontentloaded'});
    await page.locator('[data-page="games"]').click();
    const group = page.locator('select[name="gameGroup"]');
    await group.selectOption(game.category);
    assert.equal(await group.locator('option:checked').innerText(), categories.find(c => c.id === game.category)?.zh);
    const card = page.locator('[data-play-game="' + game.id + '"]');
    assert.equal(await card.count(), 1);
    assert.equal(await card.innerText(), game.zh);
    assert.equal(await card.locator('xpath=..').getByRole('button').count(), 1);
    assert.equal(await page.evaluate(() => window.__windowFullscreen), false);
    const wrapperUrl = pages + game.id + '/tv.html?lang=zh';
    const authorOrigin = new URL(game.url).origin;
    await card.scrollIntoViewIfNeeded();
    const documentResponse = check => page.waitForResponse(r => r.request().isNavigationRequest() && check(r));
    const [outerResponse, innerResponse] = await Promise.all([
      documentResponse(r => r.url() === wrapperUrl), documentResponse(r => new URL(r.url()).origin === authorOrigin && r.status() === 200), card.click(),
    ]);
    assert.equal(outerResponse.status(),200);
    const dialog = page.locator('dialog.game-player[open]');
    assert.equal(await dialog.locator('h2').innerText(),game.zh);
    await page.waitForFunction(() => window.__windowFullscreen && window.__hostedReady.length > 0 &&
      document.querySelector('[data-frame-status]')?.textContent === '');
    const status = dialog.getByRole('status');
    assert.equal(await status.count(),1);
    evidence.hint = await status.innerText();
    assert.equal(evidence.hint.trim(),game.controls.zh);
    const wrapper = outerResponse.frame();
    const frameElement = wrapper.locator('iframe');
    assert.equal(await frameElement.getAttribute('src'),game.url);
    assert.equal(await wrapper.locator('details').isHidden(),true);
    const author = innerResponse.frame();
    assert.equal(author.parentFrame(),wrapper);
    assert.equal(wrapper.parentFrame(),page.mainFrame());
    assert.equal(new URL(author.url()).origin,authorOrigin);
    evidence.documents = [outerResponse,innerResponse].map(r => ({url:r.url(),status:r.status()}));
    evidence.readyOrigin = await page.evaluate(() => window.__hostedReady[0]);
    evidence.fullscreen = true;
    evidence.authorTitle = await author.title();
    console.log(game.id, 'received ready from wrapper with author page:', evidence.authorTitle);
    if (game.id === 'bandit') {
      await author.locator('#play-btn').waitFor({state:'visible'});
      await captureSource(page,frameElement,join(dir,'title.png'));
    }
    evidence.visibleUI = await inspectOriginal(game,author);
    evidence.pixels = await captureSource(page,frameElement,join(dir,'manager.png'));
    assert.equal(page.context().pages().length,1);
    await dialog.locator('[data-close-game]').click();
    await page.waitForFunction(() => !window.__windowFullscreen && !document.querySelector('dialog.game-player[open]'));
    assert.equal(await card.evaluate(el => el === document.activeElement),true);
    evidence.hostCommands = await page.evaluate(() => window.__gameCommands);
    assert.deepEqual(evidence.hostCommands,[], 'A hosted game started or queried the Wi-Fi controller service');
    evidence.restoredWindow = true;
    evidence.success = true;
  } catch (error) {
    const original = page.frames().find(f => f.parentFrame()?.parentFrame() === page.mainFrame());
    if (original) evidence.observedUI = await original.evaluate(() => ({
      title:document.title, text:document.body?.innerText.slice(0,600), canvases:document.querySelectorAll('canvas').length,
    })).catch(() => null);
    evidence.failure = String(error);
    evidence.browserErrors = authorErrors;
    evidence.frames = page.frames().map(f => f.url());
    await page.screenshot({path:join(dir,'failure.png'),timeout:10000}).catch(() => {});
    throw error;
  } finally {
    await writeFile(join(dir,'evidence.json'), JSON.stringify(evidence,null,2) + '\n');
    await page.close();
  }
}

if (local) assert.ok((await stat(local)).isDirectory());
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH,
  args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const failures = [];
try {
  for (const game of selected) {
    try { await verify(browser,game); console.log(game.id,'PASS'); }
    catch (err) { failures.push(game.id); console.error(game.id,String(err)); }
  }
} finally { await browser.close(); }
assert.deepEqual(failures,[]);
