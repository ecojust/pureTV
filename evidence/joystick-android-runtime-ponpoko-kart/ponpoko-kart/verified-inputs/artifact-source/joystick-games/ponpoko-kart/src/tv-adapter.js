import { createController } from '../../shared/web/input.js';

const RACE_MODES = new Set(['intro', 'countdown', 'racing', 'finished']);

/** PureTV owns one native poll per original animation frame; observers only peek. */
export function createTVAdapter() {
  let game = null, ui = null, audio = null, frames = 0, rendered = 0;
  let pendingPause = false, failure = null, helpOpen = false;
  const errors = [];
  addEventListener('error', e => errors.push(String(e.error?.message || e.message)));
  addEventListener('unhandledrejection', e => errors.push(String(e.reason?.message || e.reason)));

  function suspend() {
    game?.cancelControls();
    // Also remember cancellation during an asynchronous menu fade, before
    // loadRace has changed the mode. A queued transition must not auto-resume.
    pendingPause = true;
    if (game?.race && RACE_MODES.has(game.mode) && !game.paused) game.togglePause();
    audio?.ctx?.suspend().catch(() => {});
  }

  const controller = createController({ width: 186, onSuspend: suspend, onCancel: suspend });
  const panel = document.getElementById('puretv-controller-panel');
  const help = document.createElement('div');
  help.className = 'tv-control-help';
  help.innerHTML = '<strong>ぽんぽこカート</strong><span>菜单：方向选择 · A / START 确认 · Y 返回</span><span>↑ 油门 · ↓ 刹车 / 倒车<br>← → 转向 · A 跳跃 / 漂移<br>B 道具 · X 回看 · Y 操作说明<br>START 暂停 / 手动继续</span>';
  panel.appendChild(help);

  function stage() {
    if (failure) return 'error';
    if (!game || !rendered) return 'loading';
    if (game.paused) return 'paused';
    if (game.mode === 'idle') return 'menu';
    if (game.mode === 'loading') return 'loading';
    if (game.mode === 'results' || game.mode === 'finished') return 'ended';
    return 'playing';
  }

  function snapshot() {
    const kart = game?.race?.player;
    const gl = game?.renderer?.renderer?.getContext();
    return {
      game: 'ponpoko-kart', renderer: 'webgl2',
      webglVersion: gl ? gl.getParameter(gl.VERSION) : null,
      stage: stage(), paused: !!game?.paused, frames: rendered,
      gameplay: {
        screen: ui?._screen?.name || game?.mode || 'boot', mode: game?.mode || 'boot',
        course: game?.def?.id || '', character: kart?.character || '',
        tick: game?.race?.simTime || 0, time: game?.race?.time || 0,
        countdown: game?.race?.countT || 0, worldTime: game?.time || 0,
        playerX: kart?.pos.x || 0, playerY: kart?.pos.y || 0, playerZ: kart?.pos.z || 0,
        speed: kart?.speed || 0, progress: kart?.s || 0, lap: kart?.lapCount || 0,
        position: kart?.position || 0, driftActive: !!kart?.drift.active,
        driftLevel: kart?.drift.level || 0, driftCharge: kart?.drift.charge || 0,
        boost: kart?.boostT || 0, jumpHeld: !!kart?._jumpHeld,
        item: kart?.item || '', itemPending: !!game?.race?._itemLatch,
        lookBack: !!game?.rig?.lookBack, helpOpen,
        framePolls: frames, renderCalls: game?.renderer?.renderer?.info.render.calls || 0,
      },
      audioState: audio?.ctx?.state || 'not_created',
      controller: controller.peek(), errors: failure ? [...errors, failure] : [...errors],
    };
  }

  Object.defineProperty(window, 'JoystickGameQA', { value: Object.freeze({ snapshot }), writable: false, configurable: false });

  return {
    attach(g, u, a) { game = g; ui = u; audio = a; },
    fail(error) { failure = String(error?.message || error); },
    poll() {
      frames++;
      controller.setPlaying(!!game && RACE_MODES.has(game.mode) && !game.paused);
      const frame = controller.poll();
      panel.dataset.screen = ui?._screen?.name || game?.mode || 'boot';
      panel.dataset.connected = String(frame.connected);
      if (!game || frame.cancelled) return;
      if (pendingPause && game.race && RACE_MODES.has(game.mode)) {
        pendingPause = false;
        if (!game.paused) game.togglePause();
        return;
      }
      const inRace = RACE_MODES.has(game.mode);
      game.input.applyPureTV(frame, inRace && !game.paused);
      if (!game.paused && Object.values(frame.pressed).some(Boolean)) audio?.unlock();
      if (game.paused) {
        if (frame.pressed.START) game.togglePause();
        else navigate(frame);
      } else if (inRace) {
        if (frame.pressed.START && game.mode !== 'finished') game.togglePause();
        if (frame.pressed.Y) { helpOpen = !helpOpen; panel.dataset.help = String(helpOpen); }
      } else {
        navigate(frame);
      }
    },
    rendered() { rendered++; },
    onPause() { controller.cancel(); audio?.ctx?.suspend().catch(() => {}); },
    onResume() { pendingPause = false; game?.input.cancel(); audio?.unlock(); },
  };

  function navigate(frame) {
    for (const [key, action] of [['UP', 'up'], ['DOWN', 'down'], ['LEFT', 'left'], ['RIGHT', 'right']]) {
      if (frame.pressed[key]) ui?.nav(action);
    }
    if (frame.pressed.Y) ui?.nav('back');
    else if (frame.pressed.A || frame.pressed.START) {
      if (game?.mode === 'idle') pendingPause = false;
      ui?.nav('ok');
    }
  }
}
