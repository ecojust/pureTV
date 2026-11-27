// The original input layer continues to own keyboard, mouse, touch and USB pads.
import { createController } from 'puretv-input-bridge';

export function attachPureTV({ game, input, settings, renderer, boot, battleLoad }) {
  let frames = 0;
  let driving = false;
  let previousStage = '';
  let pauseAfterLoad = false;
  let lastPublished = -Infinity;
  const held = new Set();
  const blocked = new Set();
  const gl = renderer.getContext();
  const version = gl.getParameter(gl.VERSION);

  function battleStarting() {
    return battleLoad.covering || (game.phase === 'battle' && game.preBattleS > 0);
  }

  function stage() {
    if (!window.__GAME_READY || battleStarting()) return 'loading';
    if (settings.isOpen()) return 'paused';
    if (game.result && game.phase !== 'garage') return 'ended';
    return game.phase === 'battle' ? 'playing' : 'menu';
  }

  function hold(action, down) {
    if (down && !held.has(action)) {
      input.pressVirtual(action);
      held.add(action);
    } else if (!down && held.delete(action)) {
      input.releaseVirtual(action);
    }
  }

  function clearControls() {
    if (driving) input.setVirtualMove(0, 0);
    driving = false;
    for (const action of held) input.releaseVirtual(action);
    held.clear();
  }

  function suspend() {
    clearControls();
    if (battleStarting()) pauseAfterLoad = true;
    else if (stage() === 'playing') settings.open();
  }

  const controller = createController({ side: 'right', onCancel: suspend, onSuspend: suspend });

  function snapshot() {
    const current = stage();
    const vehicle = game.player?.state;
    return {
      game: 'claude-of-tanks', ready: !!window.__GAME_READY,
      stage: current, paused: current === 'paused', frames,
      renderer: gl.isContextLost() ? null : 'webgl2', webglVersion: version,
      canvasWidth: gl.drawingBufferWidth, canvasHeight: gl.drawingBufferHeight,
      controller: controller.peek(),
      gameplay: { time: game.timeS, x: vehicle?.pos.x ?? 0, z: vehicle?.pos.z ?? 0,
        yaw: vehicle?.yaw ?? 0, speed: vehicle?.speed ?? 0 }
    };
  }
  window.JoystickGameQA = Object.freeze({ snapshot });

  function navigate(current, pressed) {
    if (boot.gated) {
      if (!(pressed.START || pressed.A)) return;
      boot.dismiss();
    }
    if (current === 'paused' && (pressed.START || pressed.B)) {
      settings.close({ noRelock: true });
      return;
    }
    if (current === 'menu' && pressed.START) {
      document.querySelector('.cot-battle')?.click();
      return;
    }
    if (current === 'menu' && pressed.B && window.PureGameHost?.exit) {
      window.PureGameHost.exit();
      return;
    }
    const step = Number(pressed.DOWN || pressed.RIGHT) - Number(pressed.UP || pressed.LEFT);
    if (!step && !pressed.A && !pressed.START) return;
    const scope = current === 'paused' ? settings.root : document;
    const controls = [...scope.querySelectorAll('button:not(:disabled), select:not(:disabled), [role="button"][tabindex="0"]')]
      .filter(el => el.getClientRects().length && getComputedStyle(el).visibility === 'visible');
    if (!controls.length) return;
    const index = controls.indexOf(document.activeElement);
    if (step) {
      const next = index < 0 ? (step > 0 ? 0 : controls.length - 1) : (index + step + controls.length) % controls.length;
      controls[next].focus();
    } else {
      (controls[index] || controls.find(el => el.matches('.cot-battle')) || controls[0]).click();
    }
  }

  return function updatePureTV(dt) {
    frames++;
    const { buttons, pressed, cancelled } = controller.poll();
    if (pauseAfterLoad && !battleStarting()) {
      pauseAfterLoad = false;
      if (stage() === 'playing') settings.open();
    }
    const current = stage();
    if (current !== previousStage) {
      clearControls();
      for (const key of Object.keys(buttons)) if (buttons[key] && !pressed[key]) blocked.add(key);
    }
    for (const key of blocked) if (!buttons[key]) blocked.delete(key);
    if (!cancelled && current === 'playing') {
      if (pressed.START) suspend();
      else {
        const down = key => buttons[key] && !blocked.has(key);
        const x = Number(down('RIGHT')) - Number(down('LEFT'));
        const y = Number(down('UP')) - Number(down('DOWN'));
        const aim = down('X');
        if (aim && (x || y)) input.addVirtualAim(x * dt * 660, -y * dt * 480);
        if (driving || (!aim && (x || y))) input.setVirtualMove(aim ? 0 : x, aim ? 0 : y);
        driving = !aim && !!(x || y);
        hold('fire', down('A'));
        hold('handbrake', down('B'));
        if (pressed.Y && !blocked.has('Y')) input.tapVirtual('sniperToggle');
      }
    } else if (!cancelled && current !== 'loading') {
      navigate(current, pressed);
    }
    controller.setPlaying(stage() === 'playing');
    const now = performance.now();
    if (window.PureGameHost?.publish && (now - lastPublished >= 200 || current !== previousStage)) {
      const status = snapshot();
      delete status.controller.info;
      window.PureGameHost.publish(JSON.stringify(status));
      lastPublished = now;
    }
    previousStage = current;
  };
}
