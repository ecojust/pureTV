// Real WebGL 1 rendering and camera/lifecycle checks. Layout fixtures exercise
// views, not acquisition of the seeded furniture or a complete playthrough.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { basename } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const assets = new URL('../src/main/assets/', import.meta.url);
const output = process.env.GAME_RENDER_OUTPUT || process.env.VISUAL_OUTPUT || '/tmp/puretv-cozy-island-rendering';
await mkdir(output, { recursive: true });
const server = http.createServer(async (request, response) => {
  try {
    const name = new URL(request.url, 'http://localhost').pathname.slice(1) || 'tv.html';
    if (name !== basename(name)) throw new Error('Invalid path');
    if (name === 'favicon.ico') { response.writeHead(204).end(); return; }
    response.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
    response.end(await readFile(new URL(name, assets)));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(() => {
    window.__phones = [{ id: 1, connected: true, x: 0, y: 0 }, { id: 2, connected: true, x: 0, y: 0 }];
    window.CozyIslandHost = {
      getInfo: () => JSON.stringify({ language: 'en', url: '', qr: '' }),
      snapshot: () => JSON.stringify({ players: window.__phones }), publish: () => {},
    };
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /THREE|shader|WebGL/.test(message.text())) errors.push(message.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/tv.html`);
  await page.waitForFunction(() => window.CozyIslandTV && window.CozyIslandTV.renderer && document.querySelector('canvas').dataset.renderer === 'webgl-3d', null, { timeout: 30000 });
  const health = await page.evaluate(() => {
    const world = window.CozyIslandTV.renderer.world3d, gl = world.renderer.getContext();
    return { webgl1: gl instanceof WebGLRenderingContext, webgl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext,
      calls: world.renderer.info.render.calls, lost: gl.isContextLost(), error: gl.getError() };
  });
  assert.equal(health.webgl1, true); assert.equal(health.webgl2, false); assert.ok(health.calls > 10); assert.equal(health.lost, false); assert.equal(health.error, 0);
  await page.evaluate(() => {
    const game = window.CozyIslandTV.game; game.selectedPlayers = 1; game.start(); game.clock = 9 * 60;
    game.players[0].x = 9.9; game.players[0].y = 11.8;
    game.decorations = [
      { id: 'visual-bench', item: 'bench', location: 'island', x: 12, y: 12, rotation: 0 },
      { id: 'visual-lamp', item: 'lamp', location: 'island', x: 12.8, y: 12.8, rotation: 0 },
      { id: 'visual-planter', item: 'planter', location: 'island', x: 11.3, y: 12.6, rotation: 0 },
      { id: 'home-bench', item: 'bench', location: 'home', x: 2.5, y: 2.8, rotation: 0 },
      { id: 'home-lamp', item: 'lamp', location: 'home', x: 1.7, y: 1.4, rotation: 0 },
      { id: 'home-planter', item: 'planter', location: 'home', x: 6.3, y: 2.2, rotation: 0 },
      { id: 'home-rug', item: 'rug', location: 'home', x: 4.2, y: 3.9, rotation: 0 },
    ];
    window.CozyIslandTV.renderer.world3d.follow = [];
  });
  await page.waitForTimeout(350);
  const near = await page.evaluate(() => {
    const world = window.CozyIslandTV.renderer.world3d, p = window.CozyIslandTV.game.players[0], view = world.views[0];
    return { size: world.project(p.x, .15, p.y, view).y - world.project(p.x, 1.95, p.y, view).y, x: p.x, y: p.y, cameraX: view.target.x, cameraZ: view.target.z };
  });
  assert.ok(near.size > 75, 'The resident is life-sized in the nearby view, not a whole-island icon');
  await page.screenshot({ path: `${output}/cozy-island-life.png` });
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(before => { const p = window.CozyIslandTV.game.players[0]; return Math.hypot(p.x - before.x, p.y - before.y) > .7; }, near);
  await page.keyboard.up('ArrowRight');
  await page.waitForFunction(before => { const v = window.CozyIslandTV.renderer.world3d.views[0]; return Math.hypot(v.target.x - before.cameraX, v.target.z - before.cameraZ) > .4; }, near);
  const moved = await page.evaluate(() => {
    const g = window.CozyIslandTV.game, v = window.CozyIslandTV.renderer.world3d.views[0];
    return { x: g.players[0].x, y: g.players[0].y, cameraX: v.target.x, cameraZ: v.target.z };
  });
  assert.ok(Math.hypot(moved.x - near.x, moved.y - near.y) > .5, 'Real keyboard movement traverses the 3D world');
  assert.ok(Math.hypot(moved.cameraX - near.cameraX, moved.cameraZ - near.cameraZ) > .3, 'The camera follows actual movement');
  await page.evaluate(() => {
    const g = window.CozyIslandTV.game, p = g.players[0]; p.x = 19.7; p.y = 11.25; p.tool = 'rod'; p.facing = { x: 1, y: 0 };
    p.fishing = { phase: 'wait', remaining: 100, species: 'sardine' }; window.CozyIslandTV.renderer.world3d.follow = [];
  });
  await page.waitForTimeout(250); await page.screenshot({ path: `${output}/cozy-island-coast.png` });
  assert.ok(await page.evaluate(() => {
    const data = window.CozyIslandTV.renderer.world3d.playerMeshes[1].userData;
    const tip = data.rod.localToWorld(new THREE.Vector3(0, 1.4, 0)), line = data.line.geometry.attributes.position;
    return Math.hypot(line.getX(0) - tip.x, line.getY(0) - tip.y, line.getZ(0) - tip.z) < .02;
  }), 'The fishing line attaches to the actual animated 3D rod tip');
  await page.evaluate(() => {
    const g = window.CozyIslandTV.game; g.players[0].fishing = null; g.players[0].tool = 'hand'; g.players[0].x = 10.8; g.players[0].y = 11.5;
    g.players[1].joined = g.players[1].active = true; g.players[1].x = 11.9; g.players[1].y = 12.2;
    window.CozyIslandTV.renderer.world3d.follow = [];
  });
  await page.waitForFunction(() => window.CozyIslandTV.renderer.world3d.views.length === 1);
  await page.screenshot({ path: `${output}/cozy-island-together.png` });
  await page.evaluate(() => { const p = window.CozyIslandTV.game.players[1]; p.x = 6; p.y = 9; window.CozyIslandTV.game.players[0].x = 19.8; });
  await page.waitForFunction(() => window.CozyIslandTV.renderer.world3d.views.length === 2);
  await page.screenshot({ path: `${output}/cozy-island-split.png` });
  await page.evaluate(() => { const p = window.CozyIslandTV.game.players[1]; p.location = 'home'; p.x = 4; p.y = 5.6; });
  await page.waitForFunction(() => window.CozyIslandTV.renderer.world3d.views[1].location === 'home');
  await page.screenshot({ path: `${output}/cozy-island-indoor-outdoor.png` });
  await page.evaluate(() => {
    const g = window.CozyIslandTV.game; g.players[1].joined = false; g.players[0].location = 'home'; g.players[0].x = 4; g.players[0].y = 5.4;
    window.CozyIslandTV.renderer.world3d.follow = [];
  });
  await page.waitForFunction(() => window.CozyIslandTV.renderer.world3d.views.length === 1 && window.CozyIslandTV.renderer.world3d.views[0].location === 'home');
  await page.screenshot({ path: `${output}/cozy-island-home.png` });
  await page.evaluate(() => { window.CozyIslandTV.game.players[0].menu = { kind: 'place', item: 'lamp', x: 5, y: 4.7, rotation: 1 }; });
  await page.waitForFunction(() => window.CozyIslandTV.renderer.world3d.ghosts[1].visible);
  assert.equal(await page.evaluate(() => window.CozyIslandTV.renderer.world3d.ghosts[1].position.x), 5);
  await page.evaluate(() => {
    const g = window.CozyIslandTV.game, p = g.players[0]; p.menu = null; p.location = 'island'; p.x = 11; p.y = 13.6; p.tool = 'net'; g.clock = 21 * 60;
    window.CozyIslandTV.renderer.world3d.follow = [];
  });
  await page.waitForTimeout(200); await page.screenshot({ path: `${output}/cozy-island-night.png` });
  await page.evaluate(() => {
    const g = window.CozyIslandTV.game, p = g.players[0]; p.x = 7.4; p.y = 6.1; p.tool = 'hand'; g.clock = 540;
    window.CozyIslandTV.renderer.world3d.follow = [];
  });
  await page.waitForFunction(() => window.CozyIslandTV.renderer.world3d.houseMesh.userData.materials.wall.opacity < .5);
  await page.screenshot({ path: `${output}/cozy-island-occlusion.png` });
  const budget = await page.evaluate(() => {
    const g = window.CozyIslandTV.game, renderer = window.CozyIslandTV.renderer, world = renderer.world3d;
    g.players[0].x = 12; g.players[0].y = 11; g.players[1].joined = true; g.players[1].location = 'island'; g.players[1].x = 20; g.players[1].y = 13;
    g.decorations = Array.from({ length: 60 }, (_, i) => ({ id: 'stress-' + i, item: 'planter', location: 'island', x: 8 + i % 10 * .8, y: 8 + Math.floor(i / 10) * .8, rotation: i % 4 }));
    renderer.draw(g);
    for (const item of ['bench', 'lamp', 'planter', 'rug']) { g.players[0].menu = { kind: 'place', item, x: 12, y: 12, rotation: 0 }; renderer.draw(g); }
    const before = { geometry: world.renderer.info.memory.geometries, textures: world.renderer.info.memory.textures, retained: Object.keys(world.geometries).length };
    for (let i = 0; i < 12; i++) { g.players[0].menu.item = ['bench', 'lamp', 'planter', 'rug'][i % 4]; renderer.draw(g); }
    const after = { geometry: world.renderer.info.memory.geometries, textures: world.renderer.info.memory.textures, retained: Object.keys(world.geometries).length };
    const split = { calls: world.renderer.info.render.calls, triangles: world.renderer.info.render.triangles };
    g.players[0].menu = null; g.players[1].joined = false; renderer.draw(g);
    return { before, after, split, solo: { calls: world.renderer.info.render.calls, triangles: world.renderer.info.render.triangles } };
  });
  assert.deepEqual(budget.after, budget.before, 'Repeated furniture previews reuse all geometry and textures');
  assert.ok(budget.solo.calls < 400 && budget.split.calls < 400, 'Sixty flower pots are batched by material: ' + JSON.stringify(budget));
  assert.ok(budget.solo.triangles < 350000 && budget.split.triangles < 350000, 'Small petals use bounded geometry: ' + JSON.stringify(budget));
  console.log('PASS Cozy 60-furniture resource budget: ' + JSON.stringify(budget));
  // Lost contexts use a visibly labeled compatible renderer; restoration must
  // return to actual WebGL drawing without resetting the island or controls.
  await page.evaluate(() => {
    window.__world = window.CozyIslandTV.renderer.world3d;
    window.__lose = window.__world.renderer.getContext().getExtension('WEBGL_lose_context');
    const render = window.__world.renderer.render.bind(window.__world.renderer);
    window.__world.renderer.render = function (scene, camera) {
      render(scene, camera); window.__world.renderer.render = render; window.__lose.loseContext();
    };
    window.CozyIslandTV.renderer.draw(window.CozyIslandTV.game);
  });
  await page.waitForFunction(() => document.querySelector('canvas').dataset.renderer === 'canvas-2d');
  await page.screenshot({ path: `${output}/cozy-island-compatibility.png` });
  const fallbackFrame = await page.evaluate(() => window.CozyIslandTV.game.frame);
  await page.keyboard.down('b');
  await page.waitForFunction(() => window.CozyIslandTV.game.players[0].menu && window.CozyIslandTV.game.players[0].menu.kind === 'bag');
  await page.keyboard.up('b');
  assert.ok(await page.evaluate(() => window.CozyIslandTV.game.frame) > fallbackFrame);
  await page.evaluate(() => window.__lose.restoreContext());
  await page.waitForFunction(() => document.querySelector('canvas').dataset.renderer === 'webgl-3d');
  assert.equal(await page.evaluate(() => window.CozyIslandTV.renderer.world3d === window.__world), true);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  assert.equal(await page.evaluate(() => window.__world.disposed), true);
  assert.deepEqual(errors, []);
  await context.close();
  // Hardware without WebGL must enter the same working fallback at startup.
  const fallback = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options) { return /webgl/.test(type) ? null : getContext.call(this, type, options); };
  });
  const fallbackPage = await fallback.newPage(); await fallbackPage.goto(`http://127.0.0.1:${server.address().port}/tv.html`);
  await fallbackPage.waitForFunction(() => window.CozyIslandTV && document.querySelector('canvas').dataset.renderer === 'canvas-2d');
  await fallbackPage.keyboard.down('Enter'); await fallbackPage.waitForFunction(() => window.CozyIslandTV.game.phase === 'playing'); await fallbackPage.keyboard.up('Enter');
  await fallback.close();
  const construction = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await construction.addInitScript(() => {
    window.__contexts = [];
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options) {
      const result = getContext.call(this, type, options);
      if (type === 'webgl' && result) window.__contexts.push(result); return result;
    };
  });
  const constructionPage = await construction.newPage();
  await constructionPage.route('**/renderer-3d.js', async route => {
    const source = await readFile(new URL('renderer-3d.js', assets), 'utf8');
    await route.fulfill({ contentType: 'text/javascript', body: source + '\nCozyIsland3DRenderer.prototype.makeHome = function () { throw new Error("Construction cleanup fixture"); };' });
  });
  await constructionPage.goto(`http://127.0.0.1:${server.address().port}/tv.html`);
  await constructionPage.waitForFunction(() => window.CozyIslandTV && document.querySelector('canvas').dataset.renderer === 'canvas-2d');
  assert.equal(await constructionPage.evaluate(() => window.__contexts.length > 0 && window.__contexts.every(gl => gl.isContextLost())), true, 'Partial 3D construction releases its already allocated context');
  await construction.close();
  console.log('PASS Cozy 3D: WebGL1, nearby moving camera, shared/split views, indoor furniture, night, context loss/restoration, no-WebGL fallback and disposal');
  console.log(`Real browser captures: ${output}/cozy-island-*.png (software WebGL; layout fixtures)`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
