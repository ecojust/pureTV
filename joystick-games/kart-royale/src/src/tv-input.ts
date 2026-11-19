import { createController } from '../../../shared/web/input.js';
import { RaceState, type Ctx } from './types';
import type { Input } from './core/Input';

export function installTV(ctx: Ctx, input: Input) {
  let previousRoot: Element | null = null, lastPlaying = false;
  const repeat = new Map<string, number>();
  function cancel() {
    input.cancelTV();
    (ctx.race.player as any)?.cancelControllerDrift?.();
    ctx.race.setPaused(true);
    repeat.clear();
  }
  const controller = createController({ side: 'left', width: 176, top: '130px', onSuspend: cancel, onCancel: cancel });
  const hint = document.createElement('div'); hint.id = 'puretv-key-hint'; document.body.append(hint);
  const activeRoot = () => document.querySelector('.kc-root.on') || document.querySelector('.kr-screen.on');
  function controls(root: Element | null): HTMLElement[] {
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>('.kr-btn,.kr-card,.kc-done,.kc-card,.kc-mini,.kc-opt,button,input,select')).filter(el => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || (el as HTMLButtonElement).disabled) return false;
      el.tabIndex = 0; if (el.tagName === 'DIV') el.setAttribute('role', 'button'); return true;
    });
  }
  function focus(el?: HTMLElement) { el?.focus(); el?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  function move(root: Element | null, delta: number) {
    const items = controls(root); if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLElement); focus(items[(index + delta + items.length) % items.length]);
  }
  function back(root: Element | null) {
    if (root?.matches('.kc-root')) return (root.querySelector('.kc-done') as HTMLElement)?.click();
    if (ctx.race.state === RaceState.Paused) {
      const resume = controls(root).find(e => /^Resume/i.test(e.textContent || '')); resume?.click(); return;
    }
    const done = controls(root).find(e => /title|quit|back/i.test(e.textContent || '')); done?.click();
  }
  function poll(now: number) {
    const frame = controller.poll();
    const root = activeRoot();
    const playing = [RaceState.Racing, RaceState.Countdown].includes(ctx.race.state) && !document.querySelector('.kc-root.on');
    input.setTV(frame, playing);
    if (playing !== lastPlaying) { controller.setPlaying(playing); lastPlaying = playing; }
    document.documentElement.dataset.tvDriving = String(playing);
    document.documentElement.dataset.tvConnected = String(frame.connected);
    const help = playing ? '↑ / A Gas   ↓ Brake   ← → Steer   B Drift   X Item   Y Look back   START Pause' : 'D-pad Focus   A Select   B Back   X / Y Previous / Next   START Back';
    if (hint.textContent !== help) hint.textContent = help;
    if (frame.cancelled) return;
    if (frame.pressed.START) {
      if (root?.matches('.kc-root')) back(root);
      else if (ctx.race.state === RaceState.Paused) back(root);
      else if (playing) cancel();
      else if (root?.matches('.kr-s-title')) (root.querySelector('.puretv-start') as HTMLElement)?.click();
      else back(root);
      return;
    }
    if (playing) return;
    // An entering screen may not accept focus on its first visible frame.
    // Retry only while focus is outside it; keep the player's in-menu choice.
    if (root !== previousRoot || (root && !root.contains(document.activeElement))) {
      const items = controls(root); focus(items.find(e => e.matches('.puretv-start,.kr-s-select .kr-menu-list .kr-btn')) || items[0]);
      if (root !== previousRoot) repeat.clear();
      previousRoot = root;
    }
    for (const key of ['UP','DOWN','LEFT','RIGHT']) {
      if (!frame.buttons[key]) { repeat.delete(key); continue; }
      if (frame.pressed[key] || now >= (repeat.get(key) ?? 0)) { move(root, key === 'UP' || key === 'LEFT' ? -1 : 1); repeat.set(key, now + (frame.pressed[key] ? 380 : 130)); }
    }
    if (frame.pressed.X) move(root, -1); if (frame.pressed.Y) move(root, 1);
    if (frame.pressed.B) back(root);
    else if (frame.pressed.A) {
      const focused = document.activeElement as HTMLElement;
      if (root?.contains(focused)) focused.click(); else focus(controls(root)[0]);
    }
  }
  (window as any).JoystickGameQA = { snapshot() {
    const p = ctx.race.player, panel = document.getElementById('puretv-controller-panel'), rect = panel?.getBoundingClientRect();
    const frame = controller.peek(), gl = ctx.renderer?.getContext();
    const webglVersion = gl?.getParameter(gl.VERSION) ?? null;
    const renderer = typeof webglVersion !== 'string' ? null : /^WebGL 2(?:\.|\s)/.test(webglVersion) ? 'webgl2' : /^WebGL 1(?:\.|\s)/.test(webglVersion) ? 'webgl1' : null;
    let savedControls = false; try { savedControls = !!localStorage.getItem('kr.controls.v1'); } catch {}
    return { game: 'kart-royale', stage: ctx.race.state === RaceState.Paused ? 'paused' : ctx.race.state === RaceState.Menu ? 'menu' : ctx.race.state === RaceState.Results ? 'ended' : 'playing', renderer, webglVersion, frames: frame.pollCount, controller: frame, paused: ctx.race.state === RaceState.Paused,
      gameplay: { menu: activeRoot()?.matches('.kc-root') ? 'controls' : activeRoot()?.matches('.kr-s-title') ? 'title' : activeRoot()?.matches('.kr-s-select') ? 'select' : '', focus: document.activeElement?.textContent?.trim().slice(0, 100) || '', savedControls, controlHand: input.pad.prefs.hand, state: ctx.race.state, phase: ['menu','countdown','racing','finished','results','paused'][ctx.race.state], time: ctx.race.raceTime, speed: p?.forwardSpeed, position: p?.position.toArray(), lap: p?.lap, place: p?.place, driftDir: p?.driftDir, driftTier: p?.driftTier, driftCharge: p?.driftCharge, boostTime: p?.boostTime, controls: { ...input.state } },
      panel: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scrollHeight: panel!.scrollHeight, clientHeight: panel!.clientHeight, hidden: panel!.hidden } : null,
      focused: document.activeElement?.textContent?.slice(0,100), boot: document.querySelector('.boot-step')?.textContent,
    };
  } };
  return { poll, cancel };
}
