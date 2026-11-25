// usage: node shot.mjs <url> [W H] -- action...   actions: wait:ms | eval:js | shot:path | fps:secs | stats | errors | log:js
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const args = process.argv.slice(2);
const url = args[0]; let W = 1280, H = 720; let ai = 1;
if (/^\d+$/.test(args[1] || '')) { W = +args[1]; H = +args[2]; ai = 3; }
const acts = args.slice(ai);
const CHROME = join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
const PORT = 9333 + Math.floor(Math.random() * 500);
const work = mkdtempSync(join(tmpdir(), 'shot-'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(work, 'profile')}`, `--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion,IntensiveWakeUpThrottling', 'about:blank'], { stdio: 'ignore' });
function killChrome() {
  try { execFileSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
  const tag = work.split(/[\/]/).pop();
  try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*${tag}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
}
process.on('exit', killChrome);
async function wsUrl() { for (let i = 0; i < 150; i++) { try { return (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; } catch { await sleep(200); } } throw new Error('no chrome'); }
const ws = new WebSocket(await wsUrl());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let nid = 1; const pend = new Map();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = nid++; pend.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId); await send('Runtime.enable', {}, sessionId);
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false }, sessionId);
const consoleErr = [];
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.method === 'Runtime.exceptionThrown') consoleErr.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErr.push('console.error ' + m.params.args.map(a => a.value || a.description).join(' ')); });
await send('Page.navigate', { url }, sessionId);
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId); if (r.exceptionDetails) return 'EXC ' + r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''); return r.result.value; };
for (const a of acts) {
  const i = a.indexOf(':'); const k = i < 0 ? a : a.slice(0, i), v = i < 0 ? '' : a.slice(i + 1);
  if (k === 'wait') await sleep(+v);
  else if (k === 'ready') { for (let n = 0; n < 200; n++) { if (await ev('!!window.__dolmusReady')) break; await sleep(300); } }
  else if (k === 'click') { const [x, y] = v.split(',').map(Number); for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }, sessionId); }
  else if (k === 'key') { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: v, code: v.length === 1 ? 'Key' + v.toUpperCase() : v, text: type === 'keyDown' && v.length === 1 ? v : undefined }, sessionId); }
  else if (k === 'eval') await ev(v);
  else if (k === 'log') console.log('log:', JSON.stringify(await ev(v)));
  else if (k === 'shot') { const s = await send('Page.captureScreenshot', { format: 'png' }, sessionId); writeFileSync(v, Buffer.from(s.data, 'base64')); console.log('shot', v); }
  else if (k === 'fps') { const secs = +v || 10; console.log('renderer:', await ev(`(() => { const c = document.createElement('canvas').getContext('webgl2'); const d = c && c.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()`));
    console.log('page rAF fps:', await ev(`new Promise(r => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < ${secs * 1000}) requestAnimationFrame(f); else r((n / ${secs}).toFixed(1)); })(); })`)); }
  else if (k === 'stats') console.log('stats:', JSON.stringify(await ev('window.dolmus && window.dolmus.stats()')));
  else if (k === 'errors') console.log('errors:', JSON.stringify(await ev('window.dolmus && window.dolmus.errors')), 'console:', JSON.stringify(consoleErr));
}
ws.close(); killChrome(); await sleep(300);
try { rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch {}
