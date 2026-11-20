// Input-only pureTV adapter. Original simulation, stage clocks, rendering and rules stay upstream.
// @ts-ignore Shared JavaScript bridge is bundled by Vite; no native I/O elsewhere in the game.
import { createController } from '../../../../shared/web/input.js';
import { readPureTvRenderer } from './puretv-observation';

type Phase = 'menu' | 'play';
type Hooks = { phase(): Phase; ready(): boolean; pause(): void; clear(): void; observe(): Record<string, unknown>; paused(): boolean; audio(): string };
type Frame = { buttons: Record<string, boolean>; cancelled: boolean; pollCount: number };
const buttons = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y'];
const keys: Record<string, string> = { ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Enter: 'Enter', Escape: 'Escape', Space: ' ', KeyR: 'r', KeyC: 'c', KeyT: 't', Period: '.', Comma: ',' };
const drive: Record<string, string> = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', START: 'Escape', A: 'Space', B: 'KeyR', X: 'KeyC', Y: 'KeyT' };
const menu: Record<string, string> = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', START: 'Escape', A: 'Enter', B: 'Escape', X: 'Period', Y: 'Comma' };
let hooks: Hooks | null = null;
let previousPhase: Phase = 'menu';
let pendingPause = false;
const errors: string[] = [];
window.addEventListener('error', e => errors.push(String(e.message)));
window.addEventListener('unhandledrejection', e => errors.push(String(e.reason)));
const sent = new Map<string, string>();
const blocked = new Set<string>();
const repeatAt = new Map<string, number>();

function emit(code: string, down: boolean, repeat = false) {
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: keys[code], repeat, bubbles: true, cancelable: true }));
}
function release() {
  for (const code of sent.values()) emit(code, false);
  sent.clear(); repeatAt.clear();
  hooks?.clear();
}
function cancel() {
  release();
  pendingPause = true;
  if (hooks?.ready()) { hooks.pause(); pendingPause = false; }
}
const controller = createController({ side: 'right', top: '42%', width: 184, onSuspend: cancel, onCancel: cancel });
const panel = document.getElementById('puretv-controller-panel')!;
const help = document.createElement('p');
help.textContent = '方向键：驾驶 / 选择\nA：手刹 / 确认\nB：扶正车辆 / 返回\nX：视角 / 下一首\nY：牵引力辅助 / 上一首\nSTART：暂停 / 继续';
help.style.cssText = 'white-space:pre-line;font-size:12px;line-height:1.65;margin:8px 0 0';
panel.append(help);

export function configurePureTv(next: Hooks) { hooks = next; }

function frame(now: number) {
  // This adapter owns the sole native poll loop; the game renderer and diagnostics never poll.
  const input = controller.poll() as Frame;
  if (pendingPause && hooks?.ready()) { hooks.pause(); pendingPause = false; }
  const phase = hooks?.phase() ?? 'menu';
  if (phase !== previousPhase || input.cancelled) {
    release();
    for (const button of buttons) if (input.buttons[button]) blocked.add(button);
    previousPhase = phase;
  }
  const mapping = phase === 'play' ? drive : menu;
  for (const button of buttons) {
    if (!input.buttons[button]) blocked.delete(button);
    const held = input.buttons[button] && !blocked.has(button);
    const code = button === 'START' && phase === 'menu' && !hooks?.paused() ? 'Enter' : mapping[button];
    if (held && !sent.has(button)) {
      sent.set(button, code); repeatAt.set(button, now + 420); emit(code, true);
    } else if (!held && sent.has(button)) {
      emit(sent.get(button)!, false); sent.delete(button); repeatAt.delete(button);
    } else if (held && phase === 'menu' && button !== 'START' && ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(button) && now >= (repeatAt.get(button) ?? Infinity)) {
      emit(code, true, true); repeatAt.set(button, now + 110);
    }
  }
  controller.setPlaying(phase === 'play');
  help.hidden = phase === 'play';
  panel.style.top = phase === 'play' ? '42%' : '12px';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Cached read-only observations for protocol/native QA. No state/clock/physics setters.
Object.defineProperty(window, 'PureTvBackroad', { value: Object.freeze({
  snapshot: () => ({ ...controller.peek(), phase: hooks?.phase() ?? 'menu', pendingPause, sent: [...sent.keys()] }),
}) });

function snapshot() {
  const gameplay = hooks?.observe() ?? {};
  const paused = hooks?.paused() ?? false;
  const { frames, backend } = readPureTvRenderer();
  return JSON.parse(JSON.stringify({
    game: 'backroad-rally', renderer: backend, webglVersion: backend === 'webgl2' ? 2 : 0,
    stage: paused ? 'paused' : gameplay.phase === 'results' ? 'ended' : hooks?.phase() === 'play' ? 'playing' : 'menu',
    paused, frames,
    gameplay: { ...gameplay, menuFocus: document.querySelector('.menu-root .row.focus .text')?.textContent ?? '', menuValue: document.querySelector('.menu-root .row.focus .value')?.textContent ?? '' },
    audioState: hooks?.audio() ?? 'unknown', controller: controller.peek(), errors: [...errors],
  }));
}
Object.defineProperty(window, 'JoystickGameQA', { value: Object.freeze({ snapshot }), writable: false, configurable: false });
