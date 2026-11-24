import { createController } from '../../shared/web/standard-gamepad.js';

export function attachTV(engine) {
  const { ctx, input } = engine;
  const ui = ctx.peek('ui');
  const game = ctx.peek('game');
  const player = ctx.peek('player');
  const weapons = ctx.peek('weapons');
  const gl = ctx.peek('render').renderer.getContext();
  const version = gl.getParameter(gl.VERSION);
  let lastStage, lastButtons = {}, lastPublished = -Infinity;
  const blocked = new Set();

  function stage() {
    if (ui.menu.open) return 'paused';
    if (game.state === 'attract') return 'menu';
    return game.state === 'play' ? 'playing' : game.state;
  }

  function suspend() {
    if (stage() === 'playing') ui.menu.show();
    for (const code of ['TVFire', 'TVJump', 'TVReload', 'TVSwap']) input.down.delete(code);
  }

  const controller = createController({ width: 182, side: 'right', onCancel: suspend, onSuspend: suspend });
  const snapshot = () => ({
    game: 'nerd-of-duty', ready: !!window.__READY__, stage: stage(), paused: ui.menu.open,
    frames: ctx.time.frame, renderer: gl.isContextLost() ? null : 'webgl2', webglVersion: version,
    canvasWidth: gl.drawingBufferWidth, canvasHeight: gl.drawingBufferHeight,
    controller: controller.peek(),
    gameplay: { x: player.position.x, y: player.position.y, z: player.position.z,
      yaw: player.yaw, pitch: player.pitch, shots: weapons.stats.fired,
      ammo: weapons.getHudState().ammo, wave: game.wave, job: game.job, kills: game.scoring.kills,
      controllable: stage() === 'playing' && player.controlEnabled },
  });
  window.JoystickGameQA = Object.freeze({ snapshot });

  function navigate(stageName, pressed) {
    const screen = { menu: ui.attract, paused: ui.menu, down: ui.death, over: ui.over }[stageName];
    if (!screen) return;
    if (stageName === 'menu' && pressed.B && window.PureGameHost?.exit) {
      window.PureGameHost.exit();
      return;
    }
    const items = [...screen.root.querySelectorAll('[role="button"],button,input[type="range"]')]
      .filter(el => !el.disabled && !el.hidden && el.getClientRects().length);
    let selected = items.indexOf(document.activeElement);
    if (selected < 0) selected = Math.max(0, items.indexOf(screen.resumeBtn));
    let item = items[selected];
    if (item?.type === 'range' && (pressed.LEFT || pressed.RIGHT)) {
      if (pressed.RIGHT) item.stepUp(); else item.stepDown();
      item.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (items.length && (pressed.LEFT || pressed.RIGHT || pressed.UP || pressed.DOWN)) {
      const delta = pressed.LEFT || pressed.UP ? -1 : 1;
      selected = (selected + delta + items.length) % items.length;
      item = items[selected];
    }
    if (item && item !== document.activeElement) item.focus({ preventScroll: true });
    input.tvNavigation = true;
    try {
      if (stageName === 'paused' && (pressed.START || pressed.B)) ui.menu.close();
      else if (pressed.A || pressed.START) {
        if (stageName === 'menu' && !ctx.peek('audio')?.actx) ctx.peek('audio')?.start();
        item?.click();
      } else if (stageName === 'down' && pressed.B) screen.acceptBtn.click();
    } finally {
      input.tvNavigation = false;
    }
  }

  function setAction(code, down) {
    if (down && !input.down.has(code)) {
      input.down.add(code);
      input._pressed.add(code);
    } else if (!down && input.down.delete(code)) {
      input._released.add(code);
    }
  }

  input.tvUpdate = () => {
    const frame = controller.poll();
    const pressed = { ...frame.pressed }, buttons = { ...frame.buttons };
    const pad = frame.transport === 'gamepad' ? input.pad : null;
    if (pad) buttons.A ||= !!pad.buttons[7]?.pressed;
    else Object.assign(input.stick, { moveX: 0, moveY: 0, lookX: 0, lookY: 0 });
    const current = stage();
    pressed.START ||= input.pressed('KeyP');
    if (current !== 'playing') {
      pressed.A ||= input.pressed('Enter') || input.pressed('Space');
      for (const direction of ['Up', 'Down', 'Left', 'Right'])
        pressed[direction.toUpperCase()] ||= input.pressed('Arrow' + direction);
    }
    for (const key of ['A', 'B', 'X', 'Y']) {
      if (buttons[key] && (frame.cancelled || (current !== lastStage && lastButtons[key]))) blocked.add(key);
    }
    lastButtons = { ...buttons };
    for (const key of [...blocked]) {
      if (!buttons[key]) blocked.delete(key);
      buttons[key] = false;
    }
    if (current === 'playing') {
      if (pressed.START) suspend();
      else {
        const dx = pad ? Number(pad.buttons[15]?.pressed || false) - Number(pad.buttons[14]?.pressed || false) : Number(buttons.RIGHT) - Number(buttons.LEFT);
        const dy = pad ? Number(pad.buttons[13]?.pressed || false) - Number(pad.buttons[12]?.pressed || false) : Number(buttons.DOWN) - Number(buttons.UP);
        if (buttons.X) {
          if (dx) input.stick.lookX = dx * .8;
          if (dy) input.stick.lookY = dy * .65;
        } else {
          if (dx) input.stick.moveX = dx;
          if (dy) input.stick.moveY = dy;
        }
      }
    } else {
      navigate(current, pressed);
    }
    const active = current === 'playing' && stage() === 'playing';
    setAction('TVFire', active && buttons.A);
    setAction('TVJump', active && buttons.B);
    setAction('TVReload', active && buttons.Y && !buttons.X);
    setAction('TVSwap', active && buttons.X && buttons.Y);
    controller.setPlaying(stage() === 'playing');
    lastStage = current;
    const now = performance.now();
    if (window.PureGameHost?.publish && (now - lastPublished >= 180 || stage() !== current)) {
      const status = snapshot();
      // The native publish bridge accepts 8 KiB. Room info can contain a QR PNG.
      delete status.controller.info;
      window.PureGameHost.publish(JSON.stringify(status));
      lastPublished = now;
    }
  };
}
