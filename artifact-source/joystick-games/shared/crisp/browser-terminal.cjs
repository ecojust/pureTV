// Shared terminal menu regression, reached through Jet Stream's real boundary loss.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=process.env.JOYSTICK_GAMES_ROOT||path.resolve(__dirname,'../..');
const out=path.join(root,'jet-stream/docs/browser-qa/terminal');fs.mkdirSync(out,{recursive:true});
const report={game:'jet-stream',physicalTvTested:false,physicalPhoneTested:false,method:'Normal keyboard START, wait for original out-of-bounds game over, normal A restart',passed:false};
fs.copyFileSync(__filename,path.join(out,'executed-browser-terminal.cjs'));
report.htmlSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'jet-stream/dist/tv.html'))).digest('hex');
(async()=>{let browser;try {
  browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,TMPDIR:'/dev/shm'}});
  const page=await browser.newPage({viewport:{width:960,height:540}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.BASE_URL||'http://127.0.0.1:8768')+'/joystick-games/jet-stream/dist/tv.html');
  await page.waitForFunction(()=>window.JoystickGameQA?.snapshot().frames>2);
  await page.keyboard.press('p');
  await page.waitForFunction(()=>window.JoystickGameQA.snapshot().stage==='ended',null,{timeout:15000});
  report.ended=await page.evaluate(()=>window.JoystickGameQA.snapshot());
  assert.ok(report.ended.gameplay.surfer.pos.x<-3||report.ended.gameplay.surfer.pos.x>103);
  await page.waitForTimeout(400);report.frozen=await page.evaluate(()=>window.JoystickGameQA.snapshot());
  for(const field of ['ticks','score','surfer','windBarriers','wakeParticles','streamOffset'])assert.deepEqual(report.ended.gameplay[field],report.frozen.gameplay[field]);
  assert.equal(report.frozen.stage,'ended');
  await page.screenshot({path:path.join(out,'960x540-ended.png')});
  await page.keyboard.down('Enter');await page.waitForFunction(()=>window.JoystickGameQA.snapshot().stage==='playing');await page.keyboard.up('Enter');
  await page.waitForFunction(()=>window.JoystickGameQA.snapshot().gameplay.ticks>=3);
  report.restarted=await page.evaluate(()=>window.JoystickGameQA.snapshot());
  assert.equal(report.restarted.gameplay.surfer.lane,0,'start A is consumed by the menu');assert.equal(report.restarted.gameplay.score,0);assert.deepEqual(errors,[]);
  report.passed=true;console.log('Jet Stream natural terminal / frozen end / A restart passed');
}catch(error){report.error={message:error.message,stack:error.stack};process.exitCode=1;console.error(error.message);}
finally {if(browser)await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}})();
