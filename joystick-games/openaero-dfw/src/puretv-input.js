import { createController } from '../../shared/web/input.js';

export function connectFlightController({sim, menuOpen, setPaused, renderer}) {
  const canvas = renderer.domElement;
  const gl = renderer.getContext();
  const webglVersion = gl.getParameter(gl.VERSION);
  const panel = document.getElementById('onboardingModal');
  const results = document.getElementById('resultsCard');
  const start = document.getElementById('btnStartFlight');
  const controller = createController({side:'right', width:180, onCancel:suspend, onSuspend:suspend});
  let frames = 0;
  let nextReport = 0;
  let buttons = {};
  function suspend() {
    buttons = {};
    if (!menuOpen()) setPaused(true);
  }
  function stage() {
    if (menuOpen()) return 'menu';
    if (!results.classList.contains('hidden')) return 'ended';
    return sim.paused ? 'paused' : 'playing';
  }
  function navigate(root, pressed, primary) {
    if (pressed.START) { primary.click(); return; }
    const choices = [...root.querySelectorAll('button, select, input, summary')].filter(el => !el.disabled && el.getClientRects().length);
    const current = choices.indexOf(document.activeElement);
    if (pressed.A) { (choices[current] || primary).click(); return; }
    if (pressed.B && root === panel && window.PureGameHost?.exit) { window.PureGameHost.exit(); return; }
    const delta = pressed.DOWN || pressed.RIGHT ? 1 : pressed.UP || pressed.LEFT ? -1 : 0;
    if (!delta || !choices.length) return;
    const field = choices[current];
    if (field instanceof HTMLSelectElement && (pressed.RIGHT || pressed.LEFT)) {
      field.selectedIndex = (field.selectedIndex + delta + field.options.length) % field.options.length;
      field.dispatchEvent(new Event('change', {bubbles:true}));
    } else {
      choices[(current + delta + choices.length) % choices.length].focus();
    }
  }
  const snapshot = () => ({
    game:'openaero-dfw', ready:frames > 0, stage:stage(), paused:sim.paused, frames,
    renderer:gl.isContextLost() ? null : 'webgl2', webglVersion, canvasWidth:canvas.width, canvasHeight:canvas.height, controller:controller.peek(),
    gameplay:{altitudeFt:sim.mslFt, airspeedKt:sim.iasKts, throttle:sim.throttle, pitchInput:sim.pitchIn,
      rollInput:sim.rollIn, brakesOn:sim.brakesOn, gearDown:sim.gearDown, flapsIndex:sim.flapsIndex, mission:sim.missionKey},
  });
  window.JoystickGameQA = Object.freeze({snapshot});
  return {
    get buttons() { return buttons; },
    update(time) {
      frames++;
      const frame = controller.poll();
      const state = stage();
      buttons = state === 'playing' && !frame.cancelled ? frame.buttons : {};
      if (!frame.cancelled) {
        if (state === 'menu') navigate(panel, frame.pressed, start);
        else if (state === 'ended') navigate(results, frame.pressed, document.getElementById('btnFlyAgain'));
        else if (frame.pressed.START) setPaused(!sim.paused);
        else if (state === 'playing') {
          if (frame.buttons.A && frame.buttons.B && (frame.pressed.A || frame.pressed.B)) {
            document.getElementById('btnBrakes').click();
          }
          if (frame.pressed.X) document.getElementById('btnFlaps').click();
          if (frame.pressed.Y) document.getElementById('btnGear').click();
        }
      }
      controller.setPlaying(stage() === 'playing');
      if (window.PureGameHost?.publish && time >= nextReport) {
        const status = snapshot();
        delete status.controller.info;
        window.PureGameHost.publish(JSON.stringify(status));
        nextReport = time + 180;
      }
    },
  };
}
