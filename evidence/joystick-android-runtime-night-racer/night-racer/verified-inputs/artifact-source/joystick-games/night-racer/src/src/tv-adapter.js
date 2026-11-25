import { createController } from '../../../shared/web/input.js';
import { createDrivingGate } from './tv-controls.js';

const visible = element => !!element && !element.closest('[hidden]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
export function createTVAdapter(game) {
  let frames = 0, lastFrame = { buttons: {}, pressed: {} }, activeRoot = null, focus = null;
  const gate = createDrivingGate(); let driveFrame = gate(lastFrame, true);
  const controller = createController({ side: 'left', width: 190, top: '220px', onSuspend: () => game.pause(true), onCancel: () => game.pause(true) });
  const help = document.createElement('div'); help.id = 'tv-help';
  help.textContent = '↑ 油门 · ↓ 刹车 · ← → 转向 · A 漂移 / 确认 · B 氮气 / 返回 · X 复位 · Y 视角 · START 暂停';
  document.getElementById('puretv-controller-panel').append(help);
  addEventListener('tv-save-warning', event => { const notice=document.createElement('div');notice.className='tv-save-warning';notice.textContent=event.detail;document.body.append(notice);setTimeout(()=>notice.remove(),10000); });
  const root = () => ['tv-keyboard', 'volume', 'garage', 'board', 'lobby', 'pause', 'results', 'title'].map(id => document.getElementById(id)).find(visible);
  function options(parent) { return parent ? [...parent.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(visible) : []; }
  function select(element) {
    focus?.classList.remove('tv-focus'); focus = element;
    if (element) { element.classList.add('tv-focus'); element.focus({ preventScroll: true }); element.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  function close() {
    const parent = root();
    if (parent?.id === 'tv-keyboard') return parent.remove();
    if (['volume', 'garage', 'board', 'lobby'].includes(parent?.id)) { parent.hidden = true; return; }
    if (parent?.id === 'pause') game.pause(false);
    else if (parent?.id === 'results') game.title();
  }
  function keyboard(input) {
    const box = document.createElement('section'); box.id = 'tv-keyboard'; box.setAttribute('aria-label', '手柄文字输入');
    const text = document.createElement('output'); text.textContent = input.value; box.append(text);
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -') {
      const button = document.createElement('button'); button.textContent = char === ' ' ? '空格' : char;
      button.onclick = () => { if (text.textContent.length < (input.maxLength > 0 ? input.maxLength : 40)) text.textContent += char; }; box.append(button);
    }
    const remove = document.createElement('button'); remove.textContent = '删除'; remove.onclick = () => { text.textContent = text.textContent.slice(0, -1); }; box.append(remove);
    const done = document.createElement('button'); done.textContent = '完成'; done.dataset.done = 'true'; done.onclick = () => { input.value = text.textContent; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); box.remove(); select(input); }; box.append(done);
    const cancel = document.createElement('button'); cancel.textContent = '取消'; cancel.onclick = () => box.remove(); box.append(cancel);
    document.body.append(box);
  }
  function action(key) {
    const parent = root();
    if (!parent) {
      if (key === 'START') game.pause(true);
      else if (key === 'X') game.reset();
      else if (key === 'Y') game.camera();
      return;
    }
    const list = options(parent); if (!list.length) return;
    if (activeRoot !== parent || !list.includes(focus)) { activeRoot = parent; select(list.find(el => el.id === 'start' || el.id === 'resume') || list[0]); }
    if (key === 'B' || key === 'Y') return close();
    if (key === 'START' && parent.id === 'title') return game.start();
    if (key === 'START' && parent.id === 'pause') return game.pause(false);
    if (key === 'X' && parent.id === 'tv-keyboard') return parent.querySelector('[data-done]').click();
    if (key === 'A' || key === 'START') {
      if (focus.tagName === 'INPUT' && focus.type !== 'range') keyboard(focus);
      else if (focus.type !== 'range') focus.click();
      return;
    }
    if (!['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(key)) return;
    if (focus.tagName === 'INPUT' && focus.type === 'range' && ['LEFT', 'RIGHT'].includes(key)) {
      const delta = (key === 'LEFT' ? -1 : 1) * Math.max(1, Number(focus.step) || 1) * 5;
      focus.value = String(Math.min(Number(focus.max), Math.max(Number(focus.min), Number(focus.value) + delta)));
      focus.dispatchEvent(new Event('input', { bubbles: true })); return;
    }
    const box = focus.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2;
    const horizontal = key === 'LEFT' || key === 'RIGHT', direction = key === 'LEFT' || key === 'UP' ? -1 : 1;
    const candidates = list.filter(el => el !== focus).map(el => { const r = el.getBoundingClientRect(), dx = r.x + r.width / 2 - x, dy = r.y + r.height / 2 - y; return { el, forward: direction * (horizontal ? dx : dy), across: Math.abs(horizontal ? dy : dx) }; }).filter(item => item.forward > 2).sort((a, b) => a.forward + a.across * 3 - b.forward - b.across * 3);
    if (candidates.length) select(candidates[0].el);
  }
  addEventListener('keydown', event => {
    const key = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', Enter: 'A', Escape: 'B', KeyP: 'START' }[event.code];
    if (!key || (event.target.tagName === 'INPUT' && event.target.type !== 'range' && event.code !== 'Enter')) return;
    if (root() || key === 'START' || key === 'B') {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat || ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(key)) action(!root() && key === 'B' ? 'START' : key);
    }
  }, true);
  const errors = []; addEventListener('error', event => errors.push(String(event.error?.message || event.message))); addEventListener('unhandledrejection', event => errors.push(String(event.reason?.message || event.reason)));
  const snapshot = () => {
    const parent = root(), focused = parent?.contains(focus) ? focus : null, observed = game.snapshot();
    return { game: 'night-racer', renderer: 'webgl2', webglVersion: 2, frames, ...observed,
      gameplay: { ...observed.gameplay, menu: { root: parent?.id || null, focusId: focused?.id || null, focusText: focused?.textContent?.trim() || null, focusIndex: focused ? options(parent).indexOf(focused) : -1 } },
      controller: controller.peek(), errors: [...errors] };
  };
  Object.defineProperty(window, 'JoystickGameQA', { value: Object.freeze({ snapshot }), writable: false, configurable: false });
  return {
    poll() {
      const menuBefore = !!root();
      frames++; if(root() && ['race','countdown'].includes(game.state())) game.pause(true);
      controller.setPlaying(['race', 'countdown'].includes(game.state())); lastFrame = controller.poll();
      help.hidden = !root();
      if (!lastFrame.cancelled) for (const [key, down] of Object.entries(lastFrame.pressed)) if (down) action(key);
      driveFrame = gate(lastFrame, menuBefore || !!root());
      const parent = root(); if (parent && (activeRoot !== parent || !visible(focus))) { activeRoot = parent; const list = options(parent); select(list.find(el => el.id === 'start' || el.id === 'resume') || list[0]); }
    }, frame: () => driveFrame
  };
}
