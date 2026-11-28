import assert from 'node:assert/strict';

const apkPath = '/cache/games/tetris-0.1.0.apk';
const deploy = page => page.locator('[data-deploy-game="tetris"]');
const dialog = page => page.locator('.game-apk-dialog[open]');
const feedback = page => page.locator('.operation-feedback[open]');
async function openGames(page) { await page.locator('[data-page="games"]').click(); }

async function observeDeployment(page, {holdBuild=false, incomplete=false}={}) {
  await page.evaluate(({holdBuild,incomplete}) => {
    const tauri=window.__TAURI_INTERNALS__, invoke=tauri.invoke.bind(tauri);
    window.__deployInstalls=[];
    tauri.invoke=async(command,args) => {
      if (command==='build_web_game_apk' && holdBuild) {
        window.__gameBuildProgress = () => args.onProgress.onmessage({stage:'downloading',downloaded:10,total:20});
        await new Promise(resolve=>{window.__resumeGameBuild=resolve;});
      }
      if (command==='execute' && args.request.action==='install') {
        window.__deployInstalls.push(structuredClone(args));
        const value=await invoke(command,args);
        if (incomplete) {
          incomplete=false;
          value.installResults=[{path:'/unrelated.apk',success:true,message:'OK'}];
        }
        return value;
      }
      return invoke(command,args);
    };
  }, {holdBuild,incomplete});
}

export async function checkGameDeployment(check, snapshot, withoutAdb) {
  await check('game deployment without an authorized TV explains the connection and keeps export available', async page=>{
    await openGames(page);
    assert.equal(await page.locator('[data-deploy-game]').count(),56);
    await deploy(page).click();
    assert.match(await dialog(page).innerText(),/请先连接电视并完成 ADB 授权/);
    assert.equal((await page.evaluate(()=>window.__gameApkRequests)).length,0);
    await dialog(page).locator('[data-apk-connect]').click();
    assert.ok(await page.locator('[data-act="connect"]').isVisible());
    await openGames(page);
    await page.locator('[data-build-game="tetris"]').click();
    await dialog(page).locator('[data-apk-save]').waitFor();
    assert.equal((await page.evaluate(()=>window.__requests.filter(r=>r.action==='install'))).length,0);
  },withoutAdb());

  await check('game deployment installs the prepared path once for the authorized user and offers Launchers on confirmation', async page=>{
    await observeDeployment(page,{holdBuild:true});
    await openGames(page);
    await page.evaluate(()=>window.__holdNextOperation('install'));
    await deploy(page).evaluate(button=>{button.click();button.click();});
    await page.waitForFunction(()=>!!window.__resumeGameBuild);
    await page.evaluate(()=>window.__gameBuildProgress());
    assert.deepEqual(await dialog(page).locator('[data-deploy-step]').evaluateAll(steps=>steps.map(s=>s.dataset.state)),['active','pending','pending']);
    assert.equal(await dialog(page).locator('[data-apk-status]').innerText(),'正在打包 APK…');
    assert.doesNotMatch(await dialog(page).innerText(),/下载/);
    assert.match(await dialog(page).locator('[data-deployment-device]').innerText(),/当前用户 0/);
    await page.evaluate(()=>window.__resumeGameBuild());
    await page.waitForFunction(()=>window.__pendingOperations.some(op=>op.action==='install'));
    assert.equal(await feedback(page).locator('[data-game-install-next]').count(),0);
    assert.deepEqual(await feedback(page).locator('[data-deploy-step]').evaluateAll(steps=>steps.map(s=>s.dataset.state)),['done','active','pending']);
    assert.match(await feedback(page).innerText(),/正在安装到电视/);
    const device=snapshot().device;
    assert.equal(await feedback(page).locator('.deployment-target').innerText(),'Tetris · '+device.serial+' · 当前用户 '+device.userId);
    assert.deepEqual(await page.evaluate(()=>window.__deployInstalls),[
      {request:{action:'install',paths:[apkPath]},expectedTarget:{serial:device.serial,userId:device.userId}},
    ]);
    await page.evaluate(()=>window.__releaseOperation('install'));
    await feedback(page).getByRole('button',{name:'前往启动器'}).waitFor();
    assert.match(await feedback(page).innerText(),/将游戏添加到电视主屏幕/);
    assert.deepEqual(await feedback(page).locator('[data-deploy-step]').evaluateAll(steps=>steps.map(s=>s.dataset.state)),['done','done','done']);
    await feedback(page).getByRole('button',{name:'前往启动器'}).click();
    await page.locator('.launcher-toolbar').waitFor();
    assert.equal((await page.evaluate(()=>window.__gameApkRequests.filter(r=>r.command==='build_web_game_apk'))).length,1);
  });

  await check('game deployment retries an unconfirmed APK without suggesting a launcher first',async page=>{
    await observeDeployment(page,{incomplete:true});
    await openGames(page);
    await deploy(page).click();
    await feedback(page).getByRole('button',{name:'重试'}).waitFor();
    assert.doesNotMatch(await feedback(page).innerText(),/前往启动器/);
    assert.deepEqual(await feedback(page).locator('[data-deploy-step]').evaluateAll(steps=>steps.map(s=>s.dataset.state)),['done','incomplete','pending']);
    await feedback(page).getByRole('button',{name:'重试'}).click();
    await feedback(page).getByRole('button',{name:'前往启动器'}).waitFor();
    assert.equal(await page.evaluate(()=>window.__deployInstalls.length),2);
  });

  await check('game deployment cancellation during ADB preserves the reported result and never offers a second install',async page=>{
    await observeDeployment(page);
    await openGames(page);
    await page.evaluate(()=>window.__holdNextOperation('install'));
    await deploy(page).click();
    await page.waitForFunction(()=>window.__pendingOperations.some(op=>op.action==='install'));
    await feedback(page).locator('[data-feedback-cancel]').click();
    await page.waitForFunction(()=>window.__requests.some(r=>r.action==='cancel'));
    await page.evaluate(()=>window.__releaseOperation('install'));
    await feedback(page).locator('[data-feedback-close]').waitFor();
    assert.equal(await feedback(page).getAttribute('data-outcome'),'info');
    assert.equal(await feedback(page).locator('[data-game-install-next]').count(),0);
    assert.equal(await page.evaluate(()=>window.__deployInstalls.length),1);
  });

  for (const change of ['cancel','user']) {
    await check('game deployment stops before installation when preparing: '+change,async page=>{
      await observeDeployment(page,{holdBuild:true});
      await openGames(page);
      await deploy(page).click();
      await page.waitForFunction(()=>!!window.__resumeGameBuild);
      if (change==='cancel') {
        await dialog(page).locator('[data-apk-close]').click();
      } else {
        const moved=snapshot();moved.device.userId++;moved.revision+=10;
        await page.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'scan',snapshot:value}),moved);
      }
      await page.evaluate(()=>window.__resumeGameBuild());
      await page.waitForFunction(()=>window.__gameApkRequests.some(r=>r.command==='build_web_game_apk'));
      if (change==='user') {
        assert.match(await dialog(page).innerText(),/目标电视已变化/);
        assert.equal(await dialog(page).locator('[data-apk-retry]').isVisible(),false);
      } else assert.equal(await dialog(page).count(),0);
      assert.equal(await page.evaluate(()=>window.__deployInstalls.length),0);
      assert.equal(await page.locator('[data-game-install-next]').count(),0);
    });
  }
}
