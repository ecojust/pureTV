import { createController } from '../../shared/web/input.js';
import { lab } from './specimens.js';

window.PureLab = lab;
let frames = 0;
let lastFrame = performance.now();
let padWasDriving = false;
const controller = createController({
  title: '爆裂实验室', keyboard: true, width: 165, onCancel: cancel, onSuspend: cancel
});

function cancel() {
  const game = window.game;
  if (!game) return;
  game.input.release();
  game.touch.release();
  padWasDriving = false;
  if (game.screen === 'none' && !game.ending.blocksPlay) game.setScreen('pause');
}

function menu(game, pressed) {
  const screen = document.getElementById('screen-' + game.screen);
  if (!screen) return;
  const items = [...screen.querySelectorAll('button:not([disabled]),input:not([disabled])')]
    .filter(item => item.getClientRects().length && !item.closest('[hidden],[inert]'));
  if (!items.length) return;
  const current = items.includes(document.activeElement) ? document.activeElement :
    items.find(el => el.hasAttribute('data-autofocus')) || items[0];
  if (pressed.START) {
    if (game.screen === 'settings') document.getElementById('btn-settings-back').click();
    else if (game.screen === 'pause') game.resumeButton.click();
    else if (game.screen === 'over') game.retryButton.click();
    else if (game.screen === 'title') game.startButton.click();
  } else if (pressed.A) {
    current.click();
  } else if (pressed.B && game.screen === 'settings') {
    document.getElementById('btn-settings-back').click();
  } else if (pressed.B && game.screen === 'pause') {
    game.resumeButton.click();
  } else if (pressed.LEFT || pressed.RIGHT || pressed.UP || pressed.DOWN) {
    const delta = pressed.RIGHT || pressed.DOWN ? 1 : -1;
    if (current.matches('input[type="range"]') && (pressed.LEFT || pressed.RIGHT)) {
      if (delta > 0) current.stepUp(); else current.stepDown();
      current.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const next = items[(items.indexOf(current) + items.length + delta) % items.length];
    next.focus();
    next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function gameplay(game, frame, dt) {
  const { buttons, pressed } = frame;
  if (game.ending.blocksPlay) {
    if (pressed.START || pressed.A) game.skipToResults();
    return;
  }
  if (pressed.START) {
    game.setScreen('pause');
    padWasDriving = false;
    return;
  }
  // Restore the keyboard/touch contribution before mixing the new bridge frame.
  if (padWasDriving) {
    game.input.syncMovement();
    game.input.syncFire();
  }
  padWasDriving = Object.values(buttons).some(Boolean);
  if (!padWasDriving) return;
  const actions = game.actions;
  const horizontal = Number(buttons.RIGHT) - Number(buttons.LEFT);
  const vertical = Number(buttons.UP) - Number(buttons.DOWN);
  if (buttons.X) {
    actions.moveX = horizontal;
    actions.pitch = Math.max(-1.15, Math.min(1.15, actions.pitch + vertical * dt * 1.35));
  } else {
    if (vertical) actions.moveZ = vertical;
    actions.yaw -= horizontal * dt * 2;
  }
  if (buttons.Y) actions.sprint = true;
  if (buttons.A) actions.firePrimary = true;
  if (pressed.A) actions.firePressed = true;
  if (pressed.B) actions.dashPressed = true;
}

function tick(now) {
  const dt = Math.min(.065, (now - lastFrame) / 1000);
  lastFrame = now;
  frames++;
  const frame = controller.poll();
  const game = window.game;
  if (game) {
    const playing = game.screen === 'none';
    controller.setPlaying(playing);
    if (!frame.cancelled) {
      if (frame.connected || Object.values(frame.buttons).some(Boolean)) {
        window.PureLabPadActive = true;
        if (playing) game.hud.setCaptureHint(false);
      }
      if (playing) gameplay(game, frame, dt);
      else if (Object.values(frame.pressed).some(Boolean)) menu(game, frame.pressed);
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

window.JoystickGameQA = Object.freeze({
  snapshot() {
    const game = window.game;
    const frame = controller.peek();
    const state = game?.state;
    const player = state?.player;
    const stage = ({ title: 'menu', none: 'playing', pause: 'paused', over: 'ended', settings: game?.settingsReturn === 'pause' ? 'paused' : 'menu' })[game?.screen] || (game ? game.screen : 'loading');
    const gl = game?.backend.kind === 'webgl' && game.backend.renderer.getContext();
    const webglVersion = gl && !gl.isContextLost() ? gl.getParameter(gl.VERSION) : null;
    const renderer = webglVersion?.startsWith('WebGL 2') ? 'webgl2' : game?.backend.kind === 'webgpu' ? 'webgpu' : null;
    return { game: 'clawd-pop', ready: game?.readyState === 'ready', stage, paused: stage === 'paused',
      renderer, webglVersion, loading: !game || game.readyState === 'preparing', frames, controller: frame, gameplay: {
        time: state?.stats.timeAlive || 0, shots: state?.stats.shots || 0, kills: state?.stats.kills || 0,
        position: player ? [player.x, player.z] : null, yaw: game?.actions.yaw || 0,
        hp: player?.hp || 0, screen: game?.screen || 'loading', focus: document.activeElement?.id || '',
        encounters: state?.rooms.map(room => ({ sector: room.encounter?.sector, lead: room.encounter?.lead })) || []
      } };
  }
});
