// Real wall-clock browser capture. No clock overrides, state writes or forced outcomes.
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createFrameStream } from './frame-stream.mjs';
import { parseArgs, sourceHashes, serveAssets, launch, preparePage, snapshot, applyStep, applyKeys, releaseAll, verifyErrors, delay, run, sha256 } from './common.mjs';

export async function recordGameplay({ browser, url, output, recipe = {}, assetHashes, automation, afterCapture }) {
  await mkdir(path.join(output, 'frames'), { recursive:true });
  const seconds = Number(recipe.durationSeconds || 30);
  assert.ok(seconds >= 3 && seconds <= 120, 'Recording duration must be 3..120 seconds');
  const steps = recipe.steps || (automation ? [{ at:1, type:'tap', key:'Enter' }] : [
    { at:1, type:'tap', key:'Enter' }, { at:2, type:'down', key:'ArrowRight' },
    { at:4, type:'up', key:'ArrowRight' }, { at:4.2, type:'tap', key:'Space' },
    { at:5, type:'down', key:'ArrowLeft' }, { at:7, type:'up', key:'ArrowLeft' },
  ]);
  assert.ok(steps.every((s,i) => s.at >= 0 && s.at < seconds && (!i || s.at >= steps[i-1].at)), 'Recording steps must be chronological and within duration');
  const session = await preparePage(browser, url);
  const { context, page } = session;
  const cdp = await context.newCDPSession(page), frames = [], writes = [], inputs = [], states = [];
  const recorderSourceSha256 = sha256(await readFile(new URL('./record.mjs', import.meta.url)));
  const recorderHelperSourceSha256 = { 'frame-stream.mjs':sha256(await readFile(new URL('./frame-stream.mjs', import.meta.url))) };
  const frameStream = createFrameStream({ acknowledge:sessionId => { void cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); } });
  let streamStarted = false;
  try {
    cdp.on('Page.screencastFrame', event => {
      const receivedAt = performance.now(), buffer = Buffer.from(event.data, 'base64');
      const frame = frameStream.observe({ timestamp:event.metadata?.timestamp, receivedAt, sha256:sha256(buffer), sessionId:event.sessionId });
      if (!frame) return;
      frames.push(frame);
      writes.push(writeFile(path.join(output, 'frames', frame.file), buffer));
    });
    await cdp.send('Page.startScreencast', { format:'jpeg', quality:88, maxWidth:1280, maxHeight:720, everyNthFrame:1 });
    streamStarted = true;
    // Wait for the actual first compositor frame before timing inputs. Initial
    // shader/compositor warm-up must not consume the visible title interval.
    const waitingForFrame=performance.now();
    while (!frames.length && performance.now()-waitingForFrame<15000) await delay(20);
    assert.ok(frames.length,'Screencast produced no first frame');
    const started = performance.now(); let nextStep = 0, nextState = 0, nextDecision = 1.2;
    const held = new Set();
    while ((performance.now()-started)/1000 < seconds) {
      const elapsed = (performance.now()-started)/1000;
      while (nextStep < steps.length && steps[nextStep].at <= elapsed) {
        const step = steps[nextStep++]; await applyStep(page, step);
        inputs.push({ ...step, dispatchedAt:(performance.now()-started)/1000 });
      }
      if (automation && elapsed >= nextDecision) {
        const state = await snapshot(page);
        const requested = ['playing','won','lost'].includes(state.phase) && !state.paused ? await automation.keys(state, { elapsed:elapsed-1.2, mode:'record' }) : [];
        for (const change of await applyKeys(page, requested, held)) inputs.push({ ...change, dispatchedAt:(performance.now()-started)/1000 });
        nextDecision=elapsed+.08;
      }
      if (elapsed >= nextState) { states.push({ seconds:elapsed, state:await snapshot(page) }); nextState+=2; }
      await delay(15);
    }
    states.push({seconds:(performance.now()-started)/1000,state:await snapshot(page),final:true});
    await releaseAll(page, [...steps.map(s=>s.key), ...held]);
    frameStream.stop();
    await cdp.send('Page.stopScreencast'); streamStarted = false;
    await delay(100); await Promise.all(writes);
    verifyErrors(session);
    // CDP may omit unchanged compositor frames. Capture the actual final screen
    // at the real stopping time, so a legitimate static result screen is held
    // for the duration actually observed rather than shortening the video.
    assert.ok(frames.length >= 2, 'Insufficient screencast frames');
    const last=frames.at(-1), finalCapture=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88});
    const receivedAt=performance.now(), buffer=Buffer.from(finalCapture.data,'base64');
    const file=frameStream.finalFilename();
    frames.push({file,timestamp:last.timestamp+(receivedAt-last.receivedAt)/1000,receivedAt,sha256:sha256(buffer),finalActualScreenshot:true});
    await writeFile(path.join(output,'frames',file),buffer);
    let postCaptureChecks;
    if(afterCapture){postCaptureChecks=await afterCapture({page,context,url});await writeFile(path.join(output,'post-capture-checks.json'),JSON.stringify({performedAfterCapture:true,...postCaptureChecks},null,2)+'\n');verifyErrors(session);}
    assert.ok(frames.every(f=>Number.isFinite(f.timestamp)), 'Missing actual frame timestamps');
    const capturedSeconds = frames.at(-1).timestamp - frames[0].timestamp;
    assert.ok(capturedSeconds > seconds*.75, 'Screencast did not cover requested real-time interval');
    const concat = ['ffconcat version 1.0'];
    for (let i=0; i<frames.length; i++) {
      const duration = i+1<frames.length ? frames[i+1].timestamp-frames[i].timestamp : 1/30;
      assert.ok(duration > 0, 'Non-increasing retained frame timestamps');
      concat.push("file 'frames/"+frames[i].file+"'", 'duration '+duration.toFixed(9));
    }
    concat.push("file 'frames/"+frames.at(-1).file+"'");
    await writeFile(path.join(output, 'frames.ffconcat'), concat.join('\n')+'\n');
    const video = path.join(output, 'gameplay.mp4');
    let bitrate = Math.min(1800000, Math.floor(8*8000000/(capturedSeconds+1)));
    for (let attempt=0; attempt<3; attempt++) {
      await run('ffmpeg', ['-y','-hide_banner','-loglevel','warning','-safe','0','-i',path.join(output,'frames.ffconcat'),'-vf','fps=30,scale=in_range=full:out_range=tv,format=yuv420p','-an','-c:v','libx264','-preset','medium','-pix_fmt','yuv420p','-color_range','tv','-b:v',bitrate,'-maxrate',bitrate,'-bufsize',bitrate*2,'-movflags','+faststart',video]);
      if ((await stat(video)).size < 10000000) break;
      bitrate = Math.floor(bitrate*.75);
    }
    await run('python3', [new URL('./verify-artifacts.py', import.meta.url).pathname, '--video',video,'--output',path.join(output,'video-validation.json')]);
    const manifest = { recorderSourceSha256, recorderHelperSourceSha256, frameAdmission:frameStream.stats(), kind:'normal-runtime-browser-play', capture:'Chromium CDP screencast with real frame timestamps; no virtual time or state writes', input:'Ordinary browser keyboard/mouse events, automatically operated', sourceAssetHashes:assetHashes,
      requestedSeconds:seconds, capturedSeconds, frames:frames.length, videoSha256:sha256(await readFile(video)), videoBytes:(await stat(video)).size,
      audio:false, physicalTvTested:false, physicalPhoneTested:false, exportFps:30, exportFpsIsNotMeasuredDeviceFps:true,
      rendering:'Chromium / ANGLE SwiftShader', inputs, states, frameManifest:frames, postCaptureChecks:postCaptureChecks?{performedAfterCapture:true,...postCaptureChecks}:undefined, errors:session.errors, consoleErrors:session.consoleErrors, network:session.network };
    await writeFile(path.join(output,'recording.json'), JSON.stringify(manifest,null,2)+'\n');
    return { video, bytes:manifest.videoBytes, capturedSeconds, frames:frames.length, manifest:path.join(output,'recording.json') };
  } finally {
    frameStream.stop();
    if (streamStarted) await cdp.send('Page.stopScreencast').catch(()=>{});
    await context.close();
    await writeFile(path.join(output, 'frame-admission.json'), JSON.stringify({ recorderSourceSha256, recorderHelperSourceSha256, ...frameStream.stats() },null,2)+'\n');
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = parseArgs();
  assert.ok(args.assets && args.output, 'Usage: node record.mjs --assets /game/assets --output /capture [--entry tv.html] [--recipe recipe.json]');
  const hashes = await sourceHashes(path.resolve(args.assets));
  const server = await serveAssets(args.assets, args.entry || 'tv.html'), browser = await launch();
  try {
    const automation = args.automation ? await import(pathToFileURL(path.resolve(args.automation)).href) : null;
    const afterCapture=args['post-check']?(await import(pathToFileURL(path.resolve(args['post-check'])).href)).default:undefined;
    const result = await recordGameplay({ browser, url:server.url, output:path.resolve(args.output), recipe:args.recipe ? JSON.parse(await readFile(args.recipe,'utf8')) : {}, assetHashes:hashes, automation, afterCapture });
    assert.deepEqual(await sourceHashes(path.resolve(args.assets)), hashes, 'Source assets changed while recording');
    console.log(JSON.stringify(result,null,2));
  } finally { await browser.close(); await server.close(); }
}
