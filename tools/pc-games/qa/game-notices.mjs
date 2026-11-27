// Run against a staged games directory containing the titles below.
// npm ci --prefix desktop && node tools/pc-games/qa/game-notices.mjs /path/to/staged/games
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';

const {chromium} = createRequire(new URL('../../../desktop/package.json', import.meta.url))('playwright');
assert.ok(process.argv[2], 'Pass the staged games directory');
const games = path.resolve(process.argv[2]);
const site = 'http://localhost:1428';
const manager = 'http://127.0.0.1:1429';
const cases = [
  {slug:'last-track', visible:'.lasttrack-controller-help', legacy:'.ptv-host-info, .ptv-phone, #puretv-controller-clients'},
  {slug:'tetris', visible:'#battlefield', legacy:'#wifi-controller, #wifi-clients, .qr-frame'},
  {slug:'neon-rush', visible:'#primary, #difficulty-controls, #move-help', legacy:'#qr-wrap, #kit-wifi-help, #rush-phone-button, #rush-wifi-help'},
  {slug:'alien-shooter', visible:'#start-button, .control-diagram', legacy:'#room-qr, #puretv-panel, #room-players'},
  {slug:'used-car-racing', visible:'#vehicle-cards, #start', legacy:'#controller-dock, #room .room-top'},
  {slug:'mechapede', visible:'#start-btn, #tv-help', legacy:'#puretv-controller-panel'},
  {slug:'saber-magic-tower', visible:'#floorNo, #notice', legacy:'#puretv-controller-panel'},
];

const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,
  args:['--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage({viewport:{width:960, height:540}});
  await page.route(site + '/**', route => {
    const file = new URL(route.request().url()).pathname;
    return route.fulfill({path:path.join(games, file)});
  });

  for (const lang of ['zh','en']) {
    await page.goto(site + '/tetris/tv.html?lang=' + lang, {waitUntil:'commit'});
    const notice = page.locator('#puretv-web-notice[role="status"]');
    await notice.waitFor();
    assert.equal(await notice.getAttribute('lang'), lang);
    assert.match(await notice.innerText(), lang === 'zh' ? /键盘/ : /keyboard/i);
    assert.equal(await notice.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    await notice.waitFor({state:'hidden', timeout:10_000});
    assert.ok(await page.locator('#battlefield').isVisible());
  }

  for (const {slug, visible, legacy} of cases) {
    const gameUrl = site + '/' + slug + '/tv.html';
    await page.route(manager + '/' + slug, route => route.fulfill({contentType:'text/html', body:
      '<script>addEventListener("message", e => {if(e.data?.type==="puretv:game-ready") window.gameReady=true})</script>' +
      '<iframe title="Game" width="900" height="490" src="' + gameUrl + '"></iframe>'}));
    await page.goto(manager + '/' + slug);
    await page.waitForFunction(() => window.gameReady);
    const frame = page.frames().find(f => f.url() === gameUrl);
    assert.ok(frame, slug);
    for (const selector of visible.split(', ')) await frame.locator(selector).waitFor();
    await frame.locator(legacy).first().waitFor({state:'attached'});
    assert.equal(await frame.locator('link[href="../web-host.css"]').count(), 1, slug);
    assert.equal(await frame.locator('#puretv-web-notice').count(), 0, slug);
    if (slug === 'alien-shooter') {
      assert.doesNotMatch(await frame.locator('#menu-content').innerText(), /连接一部手机/);
      assert.doesNotMatch(await frame.locator('#battle-help').textContent(), /扫码/);
    }

    // Exercise the real bridge, including updates that cause games to redraw their own pairing UI.
    for (const connected of [true, false]) {
      await page.evaluate(({site,connected}) => {
        const player = {id:1, connected:true, controllerId:'test-pad', transport:'wifi', buttons:{}};
        const state = {revision:connected ? 1 : 2, players:connected ? [player] : []};
        document.querySelector('iframe').contentWindow.postMessage({type:'puretv:controller-state', state}, site);
      }, {site,connected});
      await frame.waitForFunction(count => JSON.parse(PureGameHost.snapshot()).connections === count, Number(connected));
      assert.equal(await frame.locator(legacy).evaluateAll(nodes => nodes.some(el => el.getClientRects().length > 0)),
        false, slug + ' displays a duplicate pairing panel');
      if (slug === 'tetris' && connected) {
        assert.ok(await frame.locator('#player-1').isHidden(), 'Pairing alone should not reveal a scorecard');
        await frame.waitForFunction(() => window.PureTVQA?.snapshot().phase === 'title');
        await frame.locator('#battlefield').click();
        await page.keyboard.press('Enter');
        await frame.waitForFunction(() => PureTVQA.snapshot().phase === 'playing');
        const score = frame.locator('#player-status-1');
        await score.waitFor();
        await frame.waitForFunction(() => /\d+ 行 · \d{6}/.test(document.querySelector('#player-status-1').textContent));
        assert.ok(await frame.locator('#player-2').isHidden(), 'Empty seat should stay hidden during play');
      }
    }
    if (slug === 'last-track') {
      const help = frame.locator('.lasttrack-controller-help');
      assert.match(await help.innerText(), /驾驶/);
      assert.equal(await frame.locator('#puretv-controller-panel').getAttribute('aria-label'), '游戏操作说明');
      for (const button of ['.btn-new', '.screen-cars footer .btn-primary', '.btn-nav-track',
        '.track-list .btn-primary', '.screen-settings .btn-next', '.screen-settings .btn-start']) {
        await frame.locator(button).first().click();
      }
      await frame.waitForFunction(() => JoystickGameQA.snapshot().stage === 'playing');
      await help.waitFor({state:'hidden'});
      assert.ok(await frame.locator('#puretv-controller-panel').isHidden(), 'The race should reclaim the menu guide space');
    }
    console.log('PASS embedded ' + slug);
  }
  console.log('Standalone and embedded game notices passed.');
} finally {
  await browser.close();
}
