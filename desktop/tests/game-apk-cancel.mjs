import assert from 'node:assert/strict';

// The game-APK backend only cancels the operation currently registered to a channel.
// Hold its first progress event so a real dialog can be closed before registration.
export async function verifyGameApkCancellation(page) {
  await page.evaluate(() => {
    const api = window.__TAURI_INTERNALS__;
    const original = api.invoke.bind(api);
    const builds = [];
    const cancellations = [];
    let owner = null;
    window.__gameApkCancellationFixture = {
      builds, cancellations,
      register(index) { owner = builds[index].channel.id; },
      owner() { return owner; },
      progress(index) {
        builds[index].channel.onmessage({stage:'verifying', downloaded:0, total:0});
      },
      finish(index) {
        const build = builds[index];
        if (owner === build.channel.id) owner = null;
        build.resolve({path:'/cache/' + build.gameId + '.apk', packageName:null, sha256:'a'.repeat(64)});
      },
    };
    api.invoke = (command, args) => {
      if (command === 'build_web_game_apk') {
        return new Promise(resolve => builds.push({gameId:args.gameId, channel:args.onProgress, resolve}));
      }
      if (command === 'cancel_web_game_apk') {
        cancellations.push(args.channelId);
        if (owner === args.channelId) owner = null;
        return Promise.resolve();
      }
      return original(command, args);
    };
  });
  await page.locator('[data-page="games"]').click();
  const dialog = page.locator('dialog.game-apk-dialog[open]');
  const cancelList = () => page.evaluate(() => window.__gameApkCancellationFixture.cancellations);
  await page.locator('[data-deploy-game="neon-rush"]').click();
  await dialog.getByRole('button', {name:'取消', exact:true}).click();
  const first = await page.evaluate(() => window.__gameApkCancellationFixture.builds[0].channel.id);
  assert.deepEqual(await cancelList(), [first]);

  await page.locator('[data-deploy-game="bandit"]').click();
  const second = await page.evaluate(() => {
    const fixture = window.__gameApkCancellationFixture;
    fixture.register(1);
    fixture.progress(0);
    fixture.progress(0);
    fixture.finish(0);
    return fixture.builds[1].channel.id;
  });
  assert.notEqual(first, second);
  assert.deepEqual(await cancelList(), [first, first]);
  assert.equal(await page.evaluate(() => window.__gameApkCancellationFixture.owner()), second);
  assert.equal(await dialog.locator('h2').innerText(), '金库大盗');
  await page.evaluate(() => window.__gameApkCancellationFixture.finish(1));
  const result = page.locator('dialog.operation-feedback[open][data-outcome="success"]');
  await result.locator('[data-feedback-close]').click();
  const installed = () => page.evaluate(() => window.__requests.filter(r => r.action === 'install').map(r => r.paths));
  assert.deepEqual(await installed(), [['/cache/bandit.apk']]);
  assert.deepEqual(await cancelList(), [first, first]);

  await page.locator('[data-deploy-game="bandit"]').click();
  const third = await page.evaluate(() => {
    const fixture = window.__gameApkCancellationFixture;
    fixture.register(2);
    fixture.progress(2);
    return fixture.builds[2].channel.id;
  });
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await page.evaluate(() => {
    const fixture = window.__gameApkCancellationFixture;
    fixture.progress(2);
    fixture.finish(2);
  });
  assert.deepEqual(await cancelList(), [first, first, third]);
  assert.equal(await page.evaluate(() => window.__gameApkCancellationFixture.owner()), null);
  await page.locator('[data-deploy-game="fish-loop"]').click();
  await page.evaluate(() => window.__gameApkCancellationFixture.finish(3));
  await result.waitFor();
  assert.deepEqual(await installed(), [['/cache/bandit.apk'], ['/cache/fish-loop.apk']]);
  assert.deepEqual(await cancelList(), [first, first, third]);

}
