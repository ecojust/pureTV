import { createController } from './puretv-shared/input.js';
import { nextFocus } from './ui/menuLogic.js';

const buttons = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y'];
const driving = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', A: 'Space', B: 'ShiftLeft', X: 'KeyE', Y: 'KeyF' };
const keyNames = { ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Space: ' ', ShiftLeft: 'Shift', KeyE: 'e', KeyF: 'f', Escape: 'Escape' };

/** The game frame is the only native poll owner. All observations use controller.peek(). */
export function createPureTv(game, root) {
  let frames = 0, previousMode = '', pendingPause = false;
  const sent = new Map(), blocked = new Set(), repeatAt = new Map(), errors = [];
  const emit = (code, down, repeat = false) => (document.activeElement || window).dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: keyNames[code], bubbles: true, cancelable: true, repeat }));
  const release = () => { for (const code of sent.values()) emit(code, false); sent.clear(); repeatAt.clear(); game.input.clear(); };
  const cancel = () => {
    release();
    // Only loading can enter a race without another deliberate menu action. Losing focus
    // while already paused must not leave a latch that re-pauses the user's next resume.
    pendingPause = game.flow.state === 'loading';
    if (game.flow.state === 'race') game.pause();
  };
  const controller = createController({ side: 'right', top: '42%', width: 184, onSuspend: cancel, onCancel: cancel });
  const panel = document.getElementById('puretv-controller-panel');
  const help = document.createElement('p'); help.className = 'lasttrack-controller-help';
  help.textContent = '方向键：驾驶 / 选择\nA：射击 / 确认\nB：漂移 / 返回\nX：切换武器\nY：氮气\nSTART：暂停 / 继续';
  help.style.cssText = 'white-space:pre-line;font-size:12px;line-height:1.65;margin:8px 0 0'; panel.append(help);
  window.addEventListener('error', e => errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', e => errors.push(String(e.reason)));
  game.bus.on('error', e => errors.push(String(e)));
  const modal = () => root.querySelector('.modal:not(.hidden)');
  function menuMove(button, repeat = false) {
    const m = modal(), focus = document.activeElement;
    if (!m) { emit(driving[button], true, repeat); emit(driving[button], false); return; }
    if (focus?.tagName === 'INPUT' && focus.type === 'range' && ['LEFT', 'RIGHT'].includes(button)) {
      focus.value = String(Math.max(Number(focus.min || 0), Math.min(Number(focus.max || 100), Number(focus.value) + (button === 'RIGHT' ? 1 : -1) * Number(focus.step || 1))));
      focus.dispatchEvent(new Event('input', { bubbles: true })); return;
    }
    const els = [...m.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(e => e.offsetParent !== null);
    const rects = els.map(e => { const r = e.getBoundingClientRect(); return { x:r.x, y:r.y, w:r.width, h:r.height }; });
    const i = nextFocus(rects, els.indexOf(focus), button.toLowerCase());
    els[i]?.focus();
  }
  function select() {
    const area = modal() || root.querySelector('.screen:not(.hidden)') || root;
    const focus = document.activeElement;
    if (focus && area.contains(focus) && !focus.disabled && typeof focus.click === 'function') focus.click();
    else area.querySelector('.btn-primary:not(:disabled),button:not(:disabled)')?.click();
  }
  function snapshot() {
    // getSnapshot is the game's existing cached snapB. Never call sim.snapshot(): that consumes events.
    const s = game.getSnapshot(), me = s?.cars?.find(c => c.isPlayer) || s?.cars?.[0], state = game.flow.state;
    const held = game.input.pressed;
    return JSON.parse(JSON.stringify({ game:'last-track', renderer: game.host?.renderer ? 'webgl2' : 'unavailable', webglVersion: game.host?.renderer ? 2 : 0,
      stage: state === 'paused' ? 'paused' : state === 'race' ? 'playing' : ['results','win','finalStats'].includes(state) ? 'ended' : 'menu',
      paused: state === 'paused', frames,
      gameplay: { screen:state, phase:s?.phase ?? 'menu', time:s?.t ?? 0, tick:s?.tick ?? 0, countdown:s?.countdown ?? 0,
        x:me?.x ?? 0, y:me?.y ?? 0, heading:me?.heading ?? 0, speed:me?.speed ?? 0, armor:me?.armor ?? 0, lap:me?.lap ?? 0,
        ammo:me?.weapons?.[me.activeWeapon]?.ammo ?? 0, activeWeapon:me?.activeWeapon ?? 0, projectiles:s?.projectiles?.length ?? 0,
        nitro:me?.nitro ?? 0, nitroOn:me?.nitroOn ?? false, drift:me?.drift ?? 0, cash:game.save.cash,
        controls:{throttle:held.has('ArrowUp'),brake:held.has('ArrowDown'),left:held.has('ArrowLeft'),right:held.has('ArrowRight'),fire:held.has('Space'),drift:held.has('ShiftLeft'),cycle:held.has('KeyE'),nitro:held.has('KeyF')},
        quality:game.pbr?.qualityName ?? 'unknown', menuFocus:document.activeElement?.textContent ?? '', modal:!!modal() },
      audioState: game.audio?.running ? 'running' : 'suspended', controller:controller.peek(), errors:[...errors] }));
  }
  Object.defineProperty(window, 'JoystickGameQA', { value:Object.freeze({snapshot}), writable:false, configurable:false });
  return {
    frame(now) {
      frames++;
      const f = controller.poll();
      if (pendingPause && game.flow.state === 'race') { game.pause(); pendingPause = false; }
      const state = game.flow.state, mode = state + (modal() ? ':modal' : '');
      if (previousMode !== mode || f.cancelled) {
        release(); for (const b of buttons) if (f.buttons[b]) blocked.add(b); previousMode = mode;
      }
      const playing = state === 'race' && !modal();
      for (const b of buttons) {
        if (!f.buttons[b]) blocked.delete(b);
        const held = f.buttons[b] && !blocked.has(b);
        if (b === 'START') {
          if (held && f.pressed[b]) { if (modal()) { emit('Escape',true); emit('Escape',false); } else if (state === 'race') game.pause(); else if (state === 'paused') game.resume(); else select(); }
          continue;
        }
        if (playing) {
          if (held && !sent.has(b)) { sent.set(b,driving[b]); emit(driving[b],true); }
          else if (!held && sent.has(b)) { emit(sent.get(b),false); sent.delete(b); }
        } else if (held) {
          if (['UP','DOWN','LEFT','RIGHT'].includes(b) && (f.pressed[b] || now >= (repeatAt.get(b) ?? Infinity))) { menuMove(b,!f.pressed[b]); repeatAt.set(b,now+(f.pressed[b]?420:130)); }
          else if (f.pressed[b] && b==='A') select();
          else if (f.pressed[b] && b==='B') { emit('Escape',true); emit('Escape',false); }
        } else repeatAt.delete(b);
      }
      controller.setPlaying(playing);
      help.hidden = playing; panel.style.top = playing ? '42%' : '12px';
    },
    destroy() { release(); controller.destroy(); },
  };
}
