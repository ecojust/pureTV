import { createController } from '../../shared/web/input.js';

// The connection panel also operates while the renderer is starting up.
let game;
const cancel = () => game?.cancel();
const host = createController({ width: 180, onSuspend: cancel, onCancel: cancel });
function poll() {
  requestAnimationFrame(poll);
  const frame = host.poll();
  game?.input(frame);
  host.setPlaying(game?.playing() === true);
}
requestAnimationFrame(poll);
window.attachIronhold = callbacks => {
  game = callbacks;
  window.JoystickGameQA = { snapshot() {
    const frame = host.peek();
    return { game: 'operation-ironhold', controller: frame, frames: frame.pollCount, ...game.observe() };
  } };
};
