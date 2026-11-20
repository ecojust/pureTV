const {chromium}=require('/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const [slug,url,attempt='1',mode='auto']=process.argv.slice(2);
const base=path.join('/dev/shm/puretv-submit/docs/racing-nine/reviews/driving',slug,'attempt-'+attempt);fs.mkdirSync(base,{recursive:true});
const report={slug,url,attempt,mode,startedAt:new Date().toISOString(),viewport:{width:1280,height:720},scriptSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Upstream browser comparison with normal menu and keyboard input; not a packaged pureTV acceptance test',actions:[],stages:[],errors:[],requests:[],screenshots:[],physicalDevice:false};
const save=()=>fs.writeFileSync(path.join(base,'report.json'),JSON.stringify(report,null,2)+'\n');
let browser,page; const timer=setTimeout(async()=>{report.errors.push('230-second actual browser budget exceeded');save();if(browser)await browser.close().catch(()=>{});process.exit(2)},230000);
(async()=>{try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:slug==='neuro'?['--no-sandbox','--disable-gpu']:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,TMPDIR:'/dev/shm/racing-review-driving/tmp'}});
 page=await browser.newPage({viewport:report.viewport,ignoreHTTPSErrors:true});page.setDefaultTimeout(4000);
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('requestfailed',r=>report.requests.push({url:r.url(),error:r.failure()?.errorText}));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});await page.waitForTimeout(4500);
 async function snap(name){const file=name+'.png';await page.screenshot({path:path.join(base,file),timeout:25000});const b=fs.readFileSync(path.join(base,file));const text=await page.locator('body').innerText({timeout:2000}).catch(()=>'<unavailable>');report.stages.push({name,time:new Date().toISOString(),url:page.url(),text:text.slice(0,18000),buttons:await page.locator('button').evaluateAll(bs=>bs.filter(b=>b.getBoundingClientRect().width&&b.getBoundingClientRect().height).map(b=>({text:b.innerText,id:b.id,disabled:b.disabled}))).catch(()=>[])});report.screenshots.push({file,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});save();}
 await snap('initial');
 if(slug==='night' && mode==='low'){
   const settings=await page.locator('#volbtn').boundingBox({timeout:25000});if(!settings)throw new Error('Settings not visible');await page.mouse.click(settings.x+settings.width/2,settings.y+settings.height/2);report.actions.push('Normal click visible Settings');await page.waitForTimeout(1000);await snap('graphics-settings');
   const low=page.locator('#volume .srow .seg').first().locator('button').first();const label=await low.innerText();const box=await low.boundingBox({timeout:25000});if(!box)throw new Error('Lowest graphics preset not visible');
   await Promise.all([page.waitForEvent('domcontentloaded',{timeout:30000}),page.mouse.click(box.x+box.width/2,box.y+box.height/2)]);report.actions.push('Normal click original first graphics preset: '+label+'; page reloaded by game');await page.waitForTimeout(6000);report.readonlyGraphics=await page.evaluate(()=>window.__game?.gfx?.()).catch(()=>null);await snap('low-preset-title');
 }
 if(mode!=='initial'){
 if(slug==='night'){const box=await page.locator('#start').boundingBox({timeout:25000});if(!box)throw new Error('Night START is not visible');await page.mouse.click(box.x+box.width/2,box.y+box.height/2);report.actions.push('Clicked visible #start');}
 else if(slug==='neuro'){await page.getByRole('button',{name:/^Race\s/}).click();await page.getByRole('button',{name:/Start race/i}).click();report.actions.push('Clicked Race then visible Start race');}
 else if(slug==='f1'){await page.locator('#go').click();report.actions.push('Clicked visible START RACE');}
 else if(mode.startsWith('selector:')){await page.locator(mode.slice(9)).click();report.actions.push('Clicked '+mode.slice(9));}
 else {
  for(let i=0;i<3;i++){
   const b=page.getByRole('button',{name:/^(?:START RACE|RACE|START|PLAY|DRIVE|QUICK RACE|开始比赛|开始游戏|开始|竞速|进入游戏|RACE NOW)(?:\s|[!▸►→]|$)/i}).filter({visible:true}).first();
   if(!await b.count()||!await b.isEnabled())break;
   const t=await b.innerText();await b.click();report.actions.push('Clicked visible button: '+t);await page.waitForTimeout(1200);
  }
 }
 await page.waitForTimeout(25000);await snap('started');
 for(const [key,ms] of [['ArrowUp',60000],['ArrowLeft',1500],['ArrowRight',1500],['Space',800]]){await page.keyboard.down(key);report.actions.push({key,downMs:ms});await page.waitForTimeout(ms);await page.keyboard.up(key);}
 await snap('after-input');
 }
 report.completedAt=new Date().toISOString();report.finalUrl=page.url();report.status='captured';save();
}catch(e){report.status='error';report.errors.push(String(e));save();}finally{clearTimeout(timer);if(browser)await Promise.race([browser.close(),new Promise(r=>setTimeout(r,2000))]);console.log(JSON.stringify({slug,status:report.status,stages:report.stages.map(x=>x.name),errors:report.errors,buttons:report.stages[0]?.buttons}));process.exit(report.status==='captured'?0:1);}})();
