import { createController } from '../../shared/web/input.js';

const pauseDialog = document.createElement('dialog');
const resume = document.createElement('button');
resume.textContent = '继续 · Resume (START)';
resume.addEventListener('click', () => pauseDialog.close());
pauseDialog.append(resume);
document.body.append(pauseDialog);

function pause() {
  if (document.body.dataset.screen === 'game' && !pauseDialog.open) {
    pauseDialog.showModal();
    pad.setPlaying(false);
  }
}
const pad = createController({ keyboard: true, onSuspend: pause });
let frames = 0;
function snapshot() {
  const game = document.body.dataset.screen === 'game';
  const paused = pauseDialog.open;
  return { game:'silent-meridian', renderer:'dom', frames, ready:!!document.querySelector('#app button'),
    stage:paused ? 'paused' : game ? 'playing' : 'menu', paused, controller:pad.peek(),
    canvasWidth:innerWidth, canvasHeight:innerHeight,
    gameplay:{phase:document.documentElement.dataset.phase, chapter:Number(document.body.dataset.chapter)} };
}
window.JoystickGameQA = { snapshot };
function update() {
  frames++;
  const { pressed, cancelled } = pad.poll();
  if (cancelled) pause();
  if (pauseDialog.open) {
    if (!cancelled && (pressed.START || pressed.A || pressed.B)) pauseDialog.close();
    requestAnimationFrame(update);
    return;
  }
  const dialog = document.querySelector('#app dialog[open]');
  const root = dialog || document.querySelector('#app');
  const targets = [...root.querySelectorAll('button:enabled, summary, textarea, input:enabled')]
    .filter(element => element.getClientRects().length && !element.closest('[aria-hidden="true"]'));
  const step = pressed.RIGHT || pressed.DOWN ? 1 : pressed.LEFT || pressed.UP ? -1 : 0;
  if (step && targets.length) {
    const index = targets.indexOf(document.activeElement);
    targets[(index + step + targets.length) % targets.length].focus();
  }
  const action = name => root.querySelector('[data-action="' + name + '"]')?.click();
  if (pressed.A) (targets.includes(document.activeElement) ? document.activeElement : targets[0])?.click();
  else if (pressed.B && dialog) action('close');
  else if (pressed.START) {
    if (document.body.dataset.screen === 'title') action('start');
    else pause();
  }
  else if (pressed.Y && !dialog) action('journal');
  else if (pressed.X && !dialog) root.querySelector('.phase-control button:not(.active)')?.click();
  pad.setPlaying(document.body.dataset.screen === 'game' && !dialog);
  requestAnimationFrame(update);
}
requestAnimationFrame(update);
