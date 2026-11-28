// MANAGER_URL selects a running Manager. LOCAL_GAMES optionally points to the staged games/ directory.
// GAME_ID limits the run to one catalog entry. GUIDES_ONLY=1 exercises the guides and navigation without entering gameplay.
// QA_OUTPUT receives the per-game screenshots and evidence.
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
const guidesOnly = process.env.GUIDES_ONLY === '1';

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

// Exercise the same guide from the published game's standalone page and inside Manager.
async function inspectGuide(wrapper, game, closeMethod, screenshot, afterOpen) {
  const opener = wrapper.getByRole('button', {name:'中文指南', exact:true});
  const guide = wrapper.locator('#guide');
  const authorBefore = wrapper.childFrames()[0];
  assert.ok(authorBefore, 'Missing nested author frame');
  assert.equal(await guide.isVisible(), false);
  if (closeMethod === 'button') {
    await opener.press('Enter');
  } else {
    await opener.click();
  }
  await guide.waitFor({state:'visible'});
  if (afterOpen) await afterOpen();
  assert.equal(await guide.locator('h1').innerText(), game.zh);
  const body = await guide.innerText();
  for (const translation of [game.guide.objective, ...game.guide.steps, ...game.guide.terms]) {
    assert.ok(body.includes(translation.zh), 'Missing Chinese guide text ' + translation.zh);
  }
  for (const {label} of game.guide.terms) assert.ok(body.includes(label), 'Missing source term ' + label);
  const focus = await guide.evaluate(el => el.contains(document.activeElement) ? 'guide' : document.activeElement?.outerHTML.slice(0,150));
  assert.equal(focus,'guide','Expected keyboard focus inside the open guide');
  const viewport = wrapper.locator('#guide-body');
  const dimensions = await viewport.evaluate(el => ({
    scrollHeight:el.scrollHeight, height:el.clientHeight, overflowX:el.scrollWidth - el.clientWidth,
  }));
  assert.ok(dimensions.overflowX <= 1, 'Guide requires horizontal scrolling');
  if (dimensions.scrollHeight > dimensions.height) {
    await wrapper.page().keyboard.press('ArrowDown');
    await wrapper.waitForFunction(() => document.getElementById('guide-body').scrollTop > 0, null, {timeout:2500});
  }
  if (screenshot) await wrapper.page().screenshot({path:screenshot});
  if (closeMethod === 'button') await guide.getByRole('button',{name:'返回游戏', exact:true}).press('Enter');
  else await wrapper.page().keyboard.press('Escape');
  await guide.waitFor({state:'hidden'});
  await wrapper.waitForFunction(() => document.activeElement === document.querySelector('iframe'));
  assert.equal(wrapper.childFrames()[0], authorBefore, 'Guide recreated the running author frame');
  return {title:game.zh, terms:game.guide.terms.length, steps:game.guide.steps.length,
    closeMethod, restoredGameFocus:true, dimensions};
}

async function inspectStandalone(context, game) {
  const page = await context.newPage();
  await page.setViewportSize({width:1280,height:720});
  // Hold one real author navigation until its guide is open, then test focus after the author is ready.
  let release;
  const slowLoad = game.id === 'fish-loop';
  const gate = new Promise(resolve => { release = resolve; });
  try {
    if (slowLoad) await page.route(game.url, async route => { await gate; await route.continue(); }, {times:1});
    if (local) await mountStagedGames(page, game);
    await page.goto(pages + game.id + '/tv.html', {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.querySelector('iframe')?.src);
    const result = await inspectGuide(page.mainFrame(), game, 'escape', undefined, slowLoad && (async () => {
      const ready = page.waitForLoadState('load');
      release();
      await ready;
    }));
    return {...result, openedBeforeAuthorLoad:slowLoad};
  } finally {
    release();
    await page.close();
  }
}

async function inspectOriginal(game, frame) {
  switch (game.id) {
    case 'bandit': {
      assert.equal(await frame.title(), 'Vault Breakers');
      const create = frame.getByRole('button', {name:'CREATE ROOM', exact:true});
      const modal = frame.locator('#create-modal');
      assert.equal(await modal.isVisible(),false);
      await create.click();
      await modal.waitFor({state:'visible'});
      assert.equal(await modal.getByRole('heading').innerText(), 'Create a room');
      assert.ok(await modal.locator('[data-priv="1"]').isVisible());
      assert.ok(await modal.getByRole('button',{name:'CREATE', exact:true}).isVisible());
      const size = modal.locator('#create-size');
      const initialPlayers = Number(await size.innerText());
      await modal.getByRole('button', {name:'More players'}).click();
      const selectedPlayers = Number(await size.innerText());
      assert.equal(selectedPlayers,initialPlayers + 1);
      await frame.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
      return {titleAction:'CREATE ROOM', opened:'Create a room', privateOption:true,
        initialPlayers, selectedPlayers, roomSubmitted:false};
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
      const entrance = frame.locator('#btn-nights');
      const firstOption = await entrance.innerText();
      assert.equal(firstOption, 'BEGIN THE NIGHTS');
      await entrance.click();
      const night = await frame.locator('#intro-name').innerText();
      await frame.locator('#btn-row').click();
      await frame.locator('#hud').waitFor({state:'visible'});
      await frame.waitForFunction(() => {
        const remaining = document.querySelector('#dawn-fill').style.transform.match(/scaleX\(([.\d]+)\)/);
        return remaining && Number(remaining[1]) < .98;
      });
      return {firstOption, night, hud:await frame.locator('#hud-night').innerText()};
    }
    case 'daejeon-campus': {
      await frame.locator('#gamesBtn').click();
      await frame.locator('.course.pick').first().waitFor({state:'visible'});
      return {minigames:await frame.locator('.course.pick').count()};
    }
    case 'fish-loop': {
      const board = frame.locator('#game-container canvas').first();
      await board.waitFor({state:'visible'});
      await frame.waitForFunction(() => window.__fishloop?.sim?.status === 'playing' && window.__fishloop.sim.time > .4,
        undefined, {polling:200});
      const target = await board.evaluate(canvas => {
        const sim = window.__fishloop.sim;
        const bus = sim.buses.find(item => sim.isTappable(item));
        return {moves:sim.moves, position:{x:canvas.clientWidth * bus.x / 1080, y:canvas.clientHeight * bus.y / 1920}};
      });
      await board.click({position:target.position});
      await frame.waitForFunction(previous => window.__fishloop.sim.moves === previous + 1, target.moves);
      return await frame.evaluate(() => ({surface:'Phaser canvas', level:window.__fishloop.sim.level.id,
        state:window.__fishloop.sim.status, buses:window.__fishloop.sim.buses.length, movesAfterBusClick:window.__fishloop.sim.moves}));
    }
    case 'struggle-bus':
      await frame.waitForFunction(() => window.__game?.city?.loadedRegionCount() > 0);
      return {loadedRegions:await frame.evaluate(() => window.__game.city.loadedRegionCount())};
    default:
      // Further catalog entries may have an HTML title screen or a game drawn entirely on canvas.
      await frame.locator('canvas:visible, button:visible, [role="button"]:visible').first().waitFor();
      return {title:await frame.title()};
  }
}

async function inspectSavedNights(page, author, url) {
  const storageAllowed = await author.evaluate(() => {
    try { return localStorage.length >= 0; } catch { return false; }
  });
  // When the browser blocks third-party storage, inspect the same public author page
  // in its own origin. Seed only this isolated test context with two saved-game examples.
  const firstParty = storageAllowed ? null : await page.context().newPage();
  const frame = firstParty?.mainFrame() || author;
  const cases = [];
  try {
    if (firstParty) await frame.goto(url);
    for (const [bestNight, label] of [[1,'CONTINUE — NIGHT II'], [5,'THE NIGHTS (COMPLETE — REPLAY)']]) {
      await frame.evaluate(completed => {
        localStorage.setItem('vespertine.keeper.v1', JSON.stringify({bestNight:completed}));
      }, bestNight);
      await frame.goto(url);
      const button = frame.locator('#btn-nights');
      await frame.waitForFunction(text => document.querySelector('#btn-nights')?.textContent === text, label);
      await button.click();
      await frame.locator('#btn-row').waitFor({state:'visible'});
      cases.push({completedNights:bestNight, firstOption:label, intro:await frame.locator('#intro-name').innerText()});
    }
    return {fixture:'isolated saved-game examples', origin:new URL(url).origin,
      embeddedStorage:storageAllowed ? 'available' : 'blocked by the test browser in the third-party frame',
      surface:firstParty ? 'first-party author page' : 'embedded author page', cases};
  } finally {
    await firstParty?.close();
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
  const context = await browser.newContext({locale:'zh-CN', viewport:{width:960,height:540}, ignoreHTTPSErrors:true});
  const page = await context.newPage();
  page.setDefaultTimeout(90000);
  const evidence = {scope:guidesOnly ? 'guides and navigation' : 'guides, navigation and original game', game:game.id, name:game.zh, category:game.category, manager, checkedAt:new Date().toISOString(),
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
    assert.equal(await card.locator('strong').innerText(), game.zh);
    assert.equal(await card.getAttribute('aria-label'), game.zh);
    const apkButton = card.locator('xpath=..').locator('[data-build-game]');
    assert.equal(await apkButton.getAttribute('data-build-game'), game.id);
    assert.equal(await apkButton.innerText(), '生成电视 APK');
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
    await page.waitForFunction(() => window.__windowFullscreen);
    if (!guidesOnly) await page.waitForFunction(() => window.__hostedReady.length > 0 &&
      document.querySelector('[data-frame-status]')?.textContent === '');
    const status = dialog.getByRole('status');
    assert.equal(await status.count(),1);
    evidence.hint = await status.locator('[data-socket-status]').innerText();
    assert.equal(evidence.hint.trim(),game.controls.zh);
    const wrapper = outerResponse.frame();
    const frameElement = wrapper.locator('iframe');
    assert.equal(await frameElement.getAttribute('src'),game.url);
    evidence.managerGuide = await inspectGuide(wrapper, game, 'button', join(dir, 'guide.png'));
    const author = innerResponse.frame();
    assert.equal(author.parentFrame(),wrapper);
    assert.equal(wrapper.parentFrame(),page.mainFrame());
    assert.equal(new URL(author.url()).origin,authorOrigin);
    evidence.documents = [outerResponse,innerResponse].map(r => ({url:r.url(),status:r.status()}));
    evidence.readyOrigin = await page.evaluate(() => window.__hostedReady[0]);
    evidence.fullscreen = true;
    if (!guidesOnly) {
      evidence.authorTitle = await author.title();
      console.log(game.id, 'received ready from wrapper with author page:', evidence.authorTitle);
      if (game.id === 'bandit') {
        await author.locator('#play-btn').waitFor({state:'visible'});
        await captureSource(page,frameElement,join(dir,'title.png'));
      }
      evidence.visibleUI = await inspectOriginal(game,author);
      evidence.pixels = await captureSource(page,frameElement,join(dir,'manager.png'));
      if (game.id === 'vespertine') evidence.visibleUI.savedProgress = await inspectSavedNights(page,author,game.url);
    }
    assert.equal(page.context().pages().length,1);
    await dialog.locator('[data-close-game]').click();
    await page.waitForFunction(() => !window.__windowFullscreen && !document.querySelector('dialog.game-player[open]'));
    assert.equal(await card.evaluate(el => el === document.activeElement),true);
    evidence.hostCommands = await page.evaluate(() => window.__gameCommands);
    assert.deepEqual(evidence.hostCommands,[], 'A hosted game started or queried the Wi-Fi controller service');
    evidence.restoredWindow = true;
    evidence.standaloneGuide = await inspectStandalone(context, game);
    evidence.success = true;
  } catch (error) {
    const original = page.frames().find(f => f.parentFrame()?.parentFrame() === page.mainFrame());
    if (!guidesOnly && original) evidence.observedUI = await original.evaluate(() => ({
      title:document.title, text:document.body?.innerText.slice(0,600), canvases:document.querySelectorAll('canvas').length,
    })).catch(() => null);
    evidence.failure = String(error);
    evidence.browserErrors = authorErrors;
    evidence.frames = page.frames().map(f => f.url());
    await page.screenshot({path:join(dir,'failure.png'),timeout:10000}).catch(() => {});
    throw error;
  } finally {
    await writeFile(join(dir,'evidence.json'), JSON.stringify(evidence,null,2) + '\n');
    await context.close();
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
