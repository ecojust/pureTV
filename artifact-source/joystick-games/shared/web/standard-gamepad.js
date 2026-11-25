// Optional browser Gamepad API input for ports that use the same nine actions on every host.
import { BUTTONS, createController as createHostController, createInputReducer } from './input.js';

const buttonIndex = { A: 0, B: 1, X: 2, Y: 3, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

export function readStandardPad(pads) {
  const pad = Array.from(pads || []).find(device => device && device.connected && device.mapping === 'standard');
  if (!pad) return null;
  const buttons = Object.fromEntries(BUTTONS.map(key => [key, pad.buttons[buttonIndex[key]]?.pressed === true]));
  const [x = 0, y = 0] = pad.axes;
  buttons.LEFT ||= x < -0.4;
  buttons.RIGHT ||= x > 0.4;
  buttons.UP ||= y < -0.4;
  buttons.DOWN ||= y > 0.4;
  return { identity: JSON.stringify([pad.index, pad.id]), buttons };
}

export function mergeGamepadFrames(onCancel) {
  const reducer = createInputReducer();
  let previousPad = '', hasUsedPad = false;
  return (frame, pad) => {
    const selected = frame.connected ? null : pad;
    const identity = selected?.identity || '';
    const lostPad = !!previousPad && previousPad !== identity;
    const reconnected = !!identity && identity !== previousPad && hasUsedPad;
    previousPad = identity;
    if (identity) hasUsedPad = true;
    if (lostPad || reconnected || frame.cancelled) reducer.cancel();
    if (lostPad && !frame.cancelled) onCancel?.();
    const buttons = { ...frame.buttons };
    if (selected) for (const key of BUTTONS) buttons[key] ||= selected.buttons[key];
    const edges = reducer.read({}, buttons);
    return { ...frame, buttons: edges.buttons, pressed: edges.pressed, released: edges.released,
      cancelled: edges.cancelled, connected: frame.connected || !!selected,
      transport: frame.transport || (selected ? 'gamepad' : null), inputAvailable: frame.inputAvailable || !!selected };
  };
}

export function createController(options = {}) {
  const host = createHostController(options);
  const merge = mergeGamepadFrames(options.onCancel);
  const panel = document.getElementById('puretv-controller-panel');
  const label = document.createElement('span');
  label.textContent = '1P 标准手柄已连接';
  label.hidden = true;
  panel.appendChild(label);
  const style = document.createElement('style');
  style.textContent = '#puretv-controller-panel[data-standard-pad] :is(.ptv-phone,.ptv-status,.ptv-host-info){display:none}';
  document.head.appendChild(style);
  let focused = true, last = host.peek();
  const blur = () => { focused = false; };
  const focus = () => { focused = true; };
  window.addEventListener('blur', blur);
  window.addEventListener('focus', focus);
  return {
    ...host,
    poll() {
      let pad = null;
      if (focused && !document.hidden) {
        try { pad = readStandardPad(navigator.getGamepads?.()); }
        catch { /* Some WebViews disable the Gamepad API. Native controllers still work. */ }
      }
      last = merge(host.poll(), pad);
      const active = last.transport === 'gamepad';
      if (label.hidden === active) {
        label.hidden = !active;
        if (active) panel.setAttribute('data-standard-pad', '');
        else panel.removeAttribute('data-standard-pad');
      }
      return last;
    },
    peek() { return JSON.parse(JSON.stringify(last)); },
    destroy() {
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      style.remove();
      host.destroy();
    }
  };
}
