process.env.TMPDIR='/dev/shm/racing-review-rally/tmp';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright');
const slug=process.argv[2],attempt=process.argv[3]||'attempt-1',base='/dev/shm/racing-review-rally';
const meta=JSON.parse(fs.readFileSync(path.join(base,slug,'source.json')));
const out=path.join('/dev/shm/puretv-submit/docs/racing-nine/reviews/rally',slug,attempt);fs.mkdirSync(out,{recursive:true});
const rep={slug,title:meta.title,startedAt:new Date().toISOString(),source:meta,viewport:{width:1280,height:720},actualBrowser:'Chromium / software rendering; not device performance',actions:[],captures:[],errors:[],requests:[],finished:false,normalInputOnly:true};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rep,null,2)+'\n');save();fs.copyFileSync(__filename,path.join(out,'executed-review.cjs'));
let browser;
(async()=>{const noGpu=['mini-4wd','long-road'].includes(slug);browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox',...(noGpu?['--disable-gpu']:['--use-angle=swiftshader','--enable-unsafe-swiftshader'])]});const page=await browser.newPage({viewport:rep.viewport});page.setDefaultTimeout(4500);
page.on('pageerror',e=>{rep.errors.push(String(e));save()});page.on('requestfailed',r=>{rep.errors.push(r.url()+': '+JSON.stringify(r.failure()));save()});
page.on('response',async r=>{if(r.request().resourceType()==='document'||r.request().resourceType()==='script'){try{const b=await r.body();rep.requests.push({url:r.url(),status:r.status(),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});save()}catch{}}});
const state=async()=>({url:page.url(),text:(await page.locator('body').innerText({timeout:5000})).slice(0,14000),buttons:await page.locator('button').evaluateAll(bs=>bs.filter(x=>x.offsetWidth&&x.offsetHeight).map(x=>({id:x.id,text:x.innerText,aria:x.getAttribute('aria-label')})))});
const capture=async label=>{let rec={label,time:new Date().toISOString(),state:await state()};const filename=label+'.png';await page.screenshot({path:path.join(out,filename),timeout:18000});let b=fs.readFileSync(path.join(out,filename));rec.file=filename;rec.bytes=b.length;rec.sha256=crypto.createHash('sha256').update(b).digest('hex');rep.captures.push(rec);save();console.log(slug,label,rec.state.text.slice(0,150).replace(/\n/g,' / '));};
const click=async selector=>{const el=page.locator(selector).first();if(await el.isVisible()){await el.click();rep.actions.push({type:'click',selector,time:new Date().toISOString()});save();return true;}return false;};
const press=async key=>{await page.keyboard.press(key);rep.actions.push({type:'keyPress',key,time:new Date().toISOString()});save()};
const hold=async(keys,ms)=>{for(const k of keys)await page.keyboard.down(k);rep.actions.push({type:'keysHeld',keys,milliseconds:ms,time:new Date().toISOString()});save();await page.waitForTimeout(ms);for(const k of keys)await page.keyboard.up(k);};
await page.goto(meta.localDemo||meta.demo,{waitUntil:'domcontentloaded',timeout:25000});await page.waitForTimeout(1800);await capture('menu');
if(slug==='mini-4wd')await click('#start');
if(slug==='long-road')await click('#go');
if(slug==='rally-navigator'){await click('#btnStart');await page.waitForTimeout(500);await click('[data-a=demo]');}
if(slug==='frostline-kart')await press('Enter');
if(slug==='kart-rush'){if(await page.locator('#hello-name').isVisible()){await page.locator('#hello-name').click();await page.keyboard.type('PURETV');rep.actions.push({type:'physicalKeyboardText',text:'PURETV'});save();}await click('#btn-hello');await click('#btn-start');await click('#btn-pick-go');}
if(slug==='dirt-crown'){await click('#t-free');await page.waitForTimeout(600);await capture('free-race-menu');await click('#m-go');let names=['Race','RACE','Start','GO','Quick Race'];for(const name of names){let b=page.getByRole('button',{name,exact:true});if(await b.count()&&await b.first().isVisible()){await b.first().click();rep.actions.push({type:'buttonText',text:name});break;}}}
await page.waitForTimeout(noGpu?4000:9000);await capture('started');
await hold(['ArrowUp'],noGpu?9000:20000);await capture('driving-straight');
await hold(['ArrowUp','ArrowLeft'],2000);await hold(['ArrowUp','ArrowRight'],2000);if(!noGpu)await press('Space');await capture('steering');
await press(slug==='mini-4wd'?'KeyP':'Escape');await capture('after-pause-key');
rep.finished=true;rep.endedAt=new Date().toISOString();save();await browser.close();})().catch(async e=>{rep.errors.push(String(e));rep.endedAt=new Date().toISOString();save();console.error(slug,String(e));if(browser)await browser.close().catch(()=>{});process.exitCode=1;});
