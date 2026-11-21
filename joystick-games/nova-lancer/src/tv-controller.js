import { createController } from '../../shared/web/input.js';

let controller;
export function initializeController(onCancel) {
  controller = createController({ width: 162, onCancel, onSuspend: onCancel });
}
export function readController(playing) {
  controller.setPlaying(playing);
  return controller.poll();
}
export function controllerState() { return controller.peek(); }

// Only the controller reducer observes physical press edges. The game clears
// its local keys on resume while the player's thumb may still be on START.
export function applyControllerFrame(frame, held, justDown, justUp) {
  const { buttons, pressed } = frame;
  let anyPressed = false;
  function apply(key, down, rising) {
    const code = 'TV' + key;
    if (rising) {
      held.add(code);
      justDown.add(code);
      anyPressed = true;
    } else if (!down && held.delete(code)) {
      justUp.add(code);
    }
  }
  for (const key of Object.keys(buttons)) apply(key, buttons[key], pressed[key]);
  for (const [direction, action] of [['LEFT', 'RollL'], ['RIGHT', 'RollR']]) {
    const chordDown = buttons.X && buttons[direction];
    apply(action, chordDown, chordDown && (pressed.X || pressed[direction]));
  }
  return anyPressed;
}
