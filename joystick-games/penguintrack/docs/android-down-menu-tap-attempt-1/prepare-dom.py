from pathlib import Path
p=Path('/dev/shm/puretv-submit/joystick-games/penguintrack/tests/menu-entry-dom.mjs')
s=p.read_text()
s=s.replace("import {build} from 'esbuild';", "import {execFileSync} from 'node:child_process';")
s=s.replace("const require=createRequire(import.meta.url),{chromium}", "const require=createRequire(import.meta.url),{build}=require('/dev/shm/racing-review-arcade/kart-royale-deps/node_modules/esbuild'),{chromium}")
s=s.replace("const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),out=path.join(root,'docs','menu-entry-dom-'+(process.argv[2]||'1'));", "const repo='/dev/shm/puretv-submit',parent='15c9c1044b8cd2173e07b8eedfb836738cc79e1c',root=repo+'/joystick-games/penguintrack',out='/dev/shm/racing-review-karts/penguin-down-tap-candidate/dom-attempt-1';")
s=s.replace("window.__calls=[];", "window.__focus=[];document.addEventListener('focusin',e=>window.__focus.push({time:performance.now(),text:e.target.textContent.trim()}));window.__calls=[];")
s=s.replace("const report={scope:", "for(const input of inputs){const name=path.relative(repo,path.resolve(root,input.path));const frozen=execFileSync('git',['show',parent+':'+name],{cwd:repo});assert.equal(sha(frozen),input.sha256,'fixed parent source '+name);input.gitPath=name;input.parentCommit=parent;}const served=new Map();const report={parentCommit:parent,scope:")
s=s.replace("No WebGL, game model, countdown or native transport.", "No WebGL, game model, countdown or native transport. Long holds use real wall time and unchanged rAF/repeater; short input is one poll consumed synthetic host pulse, with actual SDK timing and ACK verified separately by Python tests.")
s=s.replace("inputs,bundleSha256", "inputs,servedOriginalAssets:[],bundleSha256")
s=s.replace("const save=()=>fs.writeFileSync", "const save=()=>{report.servedOriginalAssets=[...served.values()];fs.writeFileSync")
s=s.replace("JSON.stringify(report,null,2)+'\\n');let browser;", "JSON.stringify(report,null,2)+'\\n');};let browser;")
s=s.replace("data=fs.readFileSync(p);mime=", "data=fs.readFileSync(p);if(!served.has(p)){const gitPath=path.relative(repo,p),frozen=execFileSync('git',['show',parent+':'+gitPath],{cwd:repo});assert.equal(sha(data),sha(frozen));served.set(p,{gitPath,bytes:data.length,sha256:sha(data)});}mime=")
s=s.replace("[{width:960,height:540},{width:1024,height:645},{width:1280,height:720}]", "[{width:960,height:540},{width:1280,height:720}]")
old=" assert.equal((await tap('UP')).gameplay.focus,'Controller');assert.equal((await tap('DOWN')).gameplay.focus,'Play');"
new=""" async function hold(key,milliseconds){const before=await page.evaluate(()=>window.JoystickGameQA.snapshot());const start=await page.evaluate(k=>{window.__focus=[];window.__device.buttons={[k]:true};return performance.now()},key);await page.waitForTimeout(milliseconds);const end=await page.evaluate(()=>{window.__device.buttons={};return performance.now()});await page.waitForFunction(k=>!window.JoystickGameQA.snapshot().controller.buttons[k],key);const after=await page.evaluate(()=>window.JoystickGameQA.snapshot()),focusTrace=await page.evaluate(()=>window.__focus);row.actions.push({kind:'wall-clock-held',key,requestedMs:milliseconds,actualHeldMs:end-start,beforeFocus:before.gameplay.focus,afterFocus:after.gameplay.focus,focusTrace});save();return after;}
 assert.equal((await hold('UP',2223)).gameplay.focus,'Controller');
 assert.equal((await hold('DOWN',2223)).gameplay.focus,'SettingsSound, graphics, keys');
 assert.equal((await hold('UP',2223)).gameplay.focus,'Controller');
 assert.equal((await tap('DOWN')).gameplay.focus,'Play');"""
assert old in s;s=s.replace(old,new)
s=s.replace("row.actions.push({key,beforeFocus", "row.actions.push({kind:'single-poll-synthetic-pulse',key,beforeFocus")
Path('/dev/shm/racing-review-karts/penguin-down-tap-candidate/dom-test.mjs').write_text(s)
