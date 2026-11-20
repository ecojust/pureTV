// Existing local dependencies; actual Chromium DOM with GPU/WebGL disabled.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const game = path.resolve(__dirname, '../..'), repo = path.resolve(game, '../..');
const esbuild = require(path.join(game, 'node_modules/esbuild'));
const { chromium } = require('/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
(async () => {
  const bundle = await esbuild.build({ entryPoints: [path.join(__dirname, 'fixture.ts')], bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2020', metafile: true, absWorkingDir: repo });
  const bridge = path.join(repo, 'joystick-games/shared/windows/Web/bridge.js');
  const paths = [__filename, path.join(__dirname, 'fixture.ts'), bridge, ...Object.keys(bundle.metafile.inputs).map(p => path.resolve(repo, p))];
  const inputs = [...new Set(paths)].map(p => ({ path: path.relative(repo, p), sha256: sha(fs.readFileSync(p)), bytes: fs.statSync(p).size }));
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-webgl'], env: { ...process.env, TMPDIR: '/dev/shm/racing-review-driving/tmp' } });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    await page.setContent('<!doctype html><title>Backroad Windows menu tap input fixture</title>');
    await page.addScriptTag({ content: fs.readFileSync(bridge, 'utf8') });
    await page.evaluate(() => window.JoystickDesktop.receive({ wifiController: { inputEnabled: true } }, { revision: 0, inputEnabled: true, players: [] }));
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.waitForFunction(() => window.menuTapFixtureResult, null, { timeout: 15000 });
    const result = await page.evaluate(() => window.menuTapFixtureResult);
    result.recordedAt = new Date().toISOString(); result.inputs = inputs; result.bundleSha256 = sha(bundle.outputFiles[0].contents);
    for (const input of inputs) if (input.sha256 !== sha(fs.readFileSync(path.join(repo, input.path)))) throw Error('Source changed during fixture: ' + input.path);
    fs.writeFileSync(path.join(__dirname, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ passed: result.passed, checks: result.checks, errors: result.errors }));
    process.exitCode = result.passed ? 0 : 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
