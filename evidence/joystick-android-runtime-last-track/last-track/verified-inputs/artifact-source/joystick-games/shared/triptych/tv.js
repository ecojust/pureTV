import { createController } from '../web/input.js';

/** The game loop is the sole owner of native input polling. Observations only copy it. */
export function createTV({ game, title, controls, suspend, observe }) {
  let frames = 0;
  const errors = [];
  window.addEventListener('error', event => errors.push(String(event.error?.message || event.message)));
  window.addEventListener('unhandledrejection', event => errors.push(String(event.reason?.message || event.reason)));
  const controller = createController({ width: 192, onSuspend: suspend, onCancel: suspend });
  const help = document.createElement('aside');
  help.id = 'tv-controls';
  const heading = document.createElement('strong'); heading.textContent = title;
  help.append(heading, document.createTextNode(controls + '\nSTART 开始 / 暂停 / 继续\n菜单 ↑↓ 选择 · A 确认\n设置 ←→ 调整 · Y 返回'));
  document.body.append(help);
  const snapshot = () => ({ game, renderer: 'canvas2d', webglVersion: null, frames,
    ...observe(), controller: controller.peek(), errors: [...errors] });
  Object.defineProperty(window, 'JoystickGameQA', { value: Object.freeze({ snapshot }), configurable: false, writable: false });
  return {
    poll(playing) { frames++; controller.setPlaying(playing); return controller.poll(); },
    peek: () => controller.peek(),
  };
}

/** DOM menus keep their original controls, including settings and score initials. */
export function menuInput(ui, pressed) {
  if (pressed.UP) ui.moveFocus(-1);
  if (pressed.DOWN) ui.moveFocus(1);
  const el = document.activeElement;
  const dir = Number(!!pressed.RIGHT) - Number(!!pressed.LEFT);
  if (el?.tagName === 'SELECT' && (dir || pressed.A)) {
    el.selectedIndex = (el.selectedIndex + (dir || 1) + el.options.length) % el.options.length;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (el?.tagName === 'INPUT' && el.type === 'range' && dir) {
    const step = Number(el.step) || 0.1;
    el.value = String(Math.max(Number(el.min), Math.min(Number(el.max), Number(el.value) + step * dir)));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (el?.tagName === 'INPUT' && el.type === 'text') {
    // Three-letter arcade initials are editable without a software keyboard.
    const index = Math.min(2, Number(el.dataset.tvIndex) || 0);
    const chars = (el.value || 'AAA').toUpperCase().padEnd(3, 'A').split('');
    if (dir) chars[index] = String.fromCharCode(65 + (chars[index].charCodeAt(0) - 65 + dir + 26) % 26);
    el.value = chars.join('');
    if (pressed.A) el.dataset.tvIndex = String((index + 1) % 3);
    el.setSelectionRange(Number(el.dataset.tvIndex) || 0, (Number(el.dataset.tvIndex) || 0) + 1);
  } else if (pressed.A && el?.tagName === 'BUTTON' && !el.disabled) el.click();
  if ((pressed.Y || pressed.B) && !['title', 'over', 'dock', 'story'].includes(ui.top())) ui.closeTop();
}
