import * as THREE from './three.js';
import {createController} from './standard-gamepad.js';
import {createGame, CAMERA_ORIGIN, FIXED_HZ} from './core.js';
import {buildArena} from './arena.js';
import {RangeTargetManager} from './targets.js';

const el = id => document.getElementById(id);
const canvas = el('world');
const native = !!window.PureGameHost && !window.PureTVPC;
document.body.classList.toggle('native', native);
function boot() {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  const gl = renderer.getContext();
  const webglVersion = gl.getParameter(gl.VERSION);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 130);
  const arena = buildArena(scene);
  const targets = new RangeTargetManager(scene);
  const core = createGame();
  const cursor = {x:.5, y:.5};
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const controller = createController({keyboard:true, width:164, side:'right', onCancel:suspend, onSuspend:suspend});
  let stage = 'menu', state = core.snapshot(), frames = 0, previous, accumulated = 0;
  let zoomed = false, context, flashUntil = 0, nextReport = 0;
  const viewPosition = new THREE.Vector3(...CAMERA_ORIGIN);
  const movement = new Set();

  function updateView() {
    const width = window.innerWidth, height = window.innerHeight;
    camera.aspect = width / Math.max(1, height);
    const minFov = THREE.MathUtils.radToDeg(2 * Math.atan(.41 / camera.aspect));
    camera.fov = Math.max(minFov, zoomed ? 20 : 30);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (stage === 'menu') {
      camera.position.set(-6.8,2.65,6.9);
      camera.lookAt(-3.1,1.65,-13);
      camera.setViewOffset(width, height, -width * .19, 0, width, height);
    } else {
      camera.clearViewOffset();
      camera.position.copy(viewPosition);
      camera.rotation.set(0,0,0);
    }
    camera.updateMatrixWorld();
  }
  function positionCursor(x, y) {
    cursor.x = clamp(x, .015, .985);
    cursor.y = clamp(y, .02, .98);
    el('cursor').style.left = (cursor.x * 100) + '%';
    el('cursor').style.top = (cursor.y * 100) + '%';
  }
  function audioTone(frequency, duration) {
    try {
      context ??= new AudioContext();
      if (context.state === 'suspended') context.resume().catch(() => {});
      const oscillator = context.createOscillator(), gain = context.createGain();
      gain.gain.setValueAtTime(.05, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + duration);
    } catch { /* Audio is optional on a muted host. */ }
  }
  function statistics() {
    el('score').textContent = state.score;
    el('count').textContent = state.hits + ' / ' + state.targetCount;
    el('combo').textContent = '×' + state.combo;
    el('time').textContent = state.elapsed.toFixed(1) + ' s';
  }
  function show(next) {
    stage = next;
    const playing = stage === 'playing', ended = stage === 'ended';
    el('menu').hidden = playing;
    el('hud').hidden = el('help').hidden = el('cursor').hidden = el('pause').hidden = !playing;
    el('results').hidden = !ended; el('values').hidden = stage !== 'menu';
    el('feedback').textContent = '';
    el('title').textContent = ended ? state.grade + ' 级完成' : stage === 'paused' ? '已暂停' : '光球挑战';
    el('description').textContent = ended ? '三层轨道的 15 颗光球已全部点亮。' : stage === 'paused' ? '本轮分数与剩余光球已保留。' : '点亮近、中、远三层轨道上的 15 颗光球。连续命中，得分逐次提高。';
    el('primary').firstChild.textContent = ended ? '再来一局 ' : stage === 'paused' ? '继续挑战 ' : '开始挑战 ';
    if (ended) {
      el('resultScore').textContent = state.score;
      el('resultCombo').textContent = '×' + state.bestCombo;
      el('resultHit').textContent = state.accuracy + '%';
      el('resultTime').textContent = state.elapsed.toFixed(1) + ' 秒';
    }
    controller.setPlaying(playing);
    if (!playing) { movement.clear(); accumulated = 0; }
    updateView();
  }
  function begin() {
    if (stage === 'paused') { show('playing'); return; }
    if (stage === 'ended') core.reset('retry');
    if (stage === 'menu' || stage === 'ended') {
      core.dispatch({type:'start'});
      viewPosition.set(...CAMERA_ORIGIN); zoomed = false;
      state = core.snapshot(); targets.reset(); targets.sync(state); positionCursor(.5,.5);
      statistics(); show('playing'); audioTone(480,.08);
    }
  }
  function suspend() {
    if (stage === 'playing') show('paused');
  }
  function pulse() {
    if (stage !== 'playing') return;
    pointer.set(cursor.x * 2 - 1, 1 - cursor.y * 2);
    ray.setFromCamera(pointer, camera);
    const direction = ray.ray.direction;
    core.dispatch({type:'set-camera', x:viewPosition.x, y:viewPosition.y, z:viewPosition.z,
      yaw:Math.atan2(-direction.x,-direction.z), pitch:Math.asin(direction.y)});
    core.dispatch({type:'fire'}); state = core.snapshot(); targets.sync(state);
    const found = core.drainEvents().find(event => event.type === 'target-hit');
    el('feedback').textContent = found ? '+' + found.points : '未点中';
    flashUntil = performance.now() + 480;
    el('cursor').classList.remove('pulse'); void el('cursor').offsetWidth; el('cursor').classList.add('pulse');
    audioTone(found ? 620 + Math.min(state.combo,8)*45 : 180, found ? .14 : .07);
    statistics();
    if (state.phase === 'result') show('ended');
  }
  el('primary').onclick = begin;
  el('pause').onclick = suspend;
  function point(e) { positionCursor(e.clientX / innerWidth, e.clientY / innerHeight); }
  canvas.addEventListener('pointermove', e => { if (stage === 'playing') point(e); });
  canvas.addEventListener('pointerdown', e => { if (stage === 'playing') { point(e); canvas.setPointerCapture(e.pointerId); } });
  canvas.addEventListener('pointerup', e => { if (stage === 'playing' && e.button === 0) { point(e); pulse(); } });
  window.addEventListener('keydown', e => {
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    if (['KeyW','KeyA','KeyS','KeyD'].includes(e.code) && stage === 'playing') { movement.add(e.code); e.preventDefault(); }
    if (!['Enter','Space','Escape'].includes(e.code)) return;
    e.preventDefault();
    if (e.code === 'Escape') { if (stage === 'paused') begin(); else suspend(); }
    else if (stage !== 'playing') begin();
    else pulse();
  });
  window.addEventListener('keyup', e => movement.delete(e.code));
  window.addEventListener('resize', updateView);
  function snapshot() {
    return {game:'zof-duty',stage,paused:stage==='paused',ready:frames>0,frames,
      renderer:gl.isContextLost()?null:'webgl2',webglVersion,canvasWidth:canvas.width,canvasHeight:canvas.height,
      controller:controller.peek(),gameplay:{round:state.round,score:state.score,hits:state.hits,remaining:state.remaining,
        activations:state.shots,combo:state.combo,accuracy:state.accuracy,grade:state.grade,elapsed:state.elapsed,
        cursorX:cursor.x,cursorY:cursor.y,viewX:viewPosition.x,viewZ:viewPosition.z,zoomed}};
  }
  window.JoystickGameQA = Object.freeze({snapshot});
  positionCursor(.5,.5); show('menu');
  function frame(time) {
    frames++;
    const dt = Math.min((time-(previous ?? time))/1000,.1); previous = time;
    const input = controller.poll();
    if (!input.cancelled) {
      if (stage !== 'playing') { if (input.pressed.START || input.pressed.A) begin(); }
      else if (input.pressed.START) suspend();
      else {
        const keys = input.buttons, direction = (positive,negative) => Number(!!keys[positive])-Number(!!keys[negative]);
        if (keys.LEFT || keys.RIGHT || keys.UP || keys.DOWN) {
          const rate = keys.B ? .065 : .36;
          positionCursor(cursor.x + direction('RIGHT','LEFT') * dt * rate, cursor.y + direction('DOWN','UP') * dt * rate * camera.aspect);
        }
        if (input.pressed.X) { zoomed = !zoomed; updateView(); }
        if (input.pressed.Y) positionCursor(.5,.5);
        if (input.pressed.A) pulse();
      }
    }
    if (stage === 'playing') {
      if (movement.size) {
        viewPosition.x = clamp(viewPosition.x + (Number(movement.has('KeyD'))-Number(movement.has('KeyA')))*dt*3,-4,4);
        viewPosition.z = clamp(viewPosition.z + (Number(movement.has('KeyS'))-Number(movement.has('KeyW')))*dt*3,2,7);
        camera.position.copy(viewPosition); camera.updateMatrixWorld();
      }
      accumulated += dt;
      while (accumulated >= 1/FIXED_HZ) { core.step(); accumulated -= 1/FIXED_HZ; }
      state = core.snapshot(); statistics();
      if (flashUntil && time >= flashUntil) { flashUntil = 0; el('feedback').textContent = ''; }
    }
    if (stage !== 'paused') { targets.update(dt); arena.update(time/1000); }
    renderer.render(scene,camera);
    if (window.PureGameHost?.publish && time >= nextReport) {
      const status = snapshot(); delete status.controller.info; window.PureGameHost.publish(JSON.stringify(status)); nextReport = time + 180;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
try { boot(); } catch (error) {
  el('error').hidden = false; el('error').textContent = '无法启动三维图形，请使用支持 WebGL 2 的设备。'; console.error(error);
}
