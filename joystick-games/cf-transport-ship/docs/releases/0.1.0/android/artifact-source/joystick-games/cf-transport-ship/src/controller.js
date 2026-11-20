import { createController } from '../../shared/web/input.js';
import { mapController, neutral } from './controller-map.js';

// UI consumes the same cached frame as gameplay, never another native snapshot.
export class ControllerIntegration {
  constructor(game) {
    this.g = game;
    this.settings = { strafe: false, crouch: false };
    this.telemetry = { polls: 0, forwardFrames: 0, turnFrames: 0, aimFrames: 0, fireFrames: 0,
      reloadRequests: 0, jumpRequests: 0, weaponCycles: 0, scopeRequests: 0, pauses: 0, cancellations: 0 };
    this.input = createController({ title: '运输船 · pureTV 手柄', width: 198,
      onCancel: () => this.cancel(), onSuspend: () => this.cancel() });
    this.previousScreen = null;
    this.repeatAt = {};
    this.frame = { buttons: {}, pressed: {}, connected: false };
    for (const card of document.querySelectorAll('#loadCards .card')) {
      card.tabIndex = 0; card.setAttribute('role', 'button');
    }
    document.getElementById('btnLoadout').addEventListener('click', () => game.toggleLoadout());
    document.getElementById('btnCrouch').addEventListener('click', () => {
      this.settings.crouch = !this.settings.crouch;
      document.getElementById('btnCrouch').textContent = this.settings.crouch ? '姿态：蹲下' : '姿态：站立';
    });
    document.getElementById('btnStrafe').addEventListener('click', () => {
      this.settings.strafe = !this.settings.strafe;
      document.getElementById('btnStrafe').textContent = this.settings.strafe ? '左右键：平移（B + 左右转向）' : '左右键：转向';
    });
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyB' && game.inLoadout && !e.repeat) {
        e.preventDefault(); e.stopImmediatePropagation(); game.closeLoadout(); return;
      }
      if (e.code === 'Escape' && !e.repeat) {
        if (game.inLoadout) game.closeLoadout();
        else if (game.playing && !game.paused) game.pause();
      }
    });
    window.addEventListener('blur', () => this.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.cancel(); });
    Object.defineProperty(window, 'JoystickGameQA', { configurable: false, writable: false,
      value: Object.freeze({ snapshot: () => this.snapshot() }) });
  }
  cancel() {
    this.telemetry.cancellations++;
    const p = this.g.player;
    if (p) {
      p.pad = neutral(); p.keys.clear(); p.pressed.clear();
      p.mouse.l = p.mouse.r = p.mouse.lp = p.mouse.rp = false;
      p.mouse.dx = p.mouse.dy = p.mouse.wheel = 0;
      p.touch = { mx: 0, mz: 0, fire: false, firePressed: false, jump: false, crouch: false };
      p.touchLook = { x: 0, y: 0 };
    }
    this.repeatAt = {};
    if (this.g.playing && !this.g.paused) this.g.pause();
  }
  tick(dt, now) {
    const g = this.g, f = this.frame = this.input.poll();
    this.telemetry.polls++;
    if (f.connected || f.native) g.controllerMode = true;
    if (f.cancelled) this.cancel();
    this.input.setPlaying?.(g.playing && !g.paused && !g.inLoadout);
    document.body.classList.toggle('controller-mode', !!g.controllerMode);
    if (g.player) g.player.pad = neutral();
    if (f.cancelled) return;
    const screen = g.hud.screenName;
    if (f.pressed.START) {
      if (g.inLoadout) g.closeLoadout();
      else if (g.playing) { if (g.paused) g.resume(); else g.pause(); }
      else if (screen === 'menu' || screen === 'end') g.startMatch();
      return;
    }
    if (screen && screen !== 'loading') { this.menu(screen, f, now); return; }
    this.previousScreen = null;
    if (!g.playing || g.paused || !g.player) return;
    const pad = mapController(f, dt, this.settings);
    g.player.pad = pad;
    if (pad.forward || pad.strafe) this.telemetry.forwardFrames++;
    if (pad.yawDelta) this.telemetry.turnFrames++;
    if (pad.pitchDelta) this.telemetry.aimFrames++;
    if (pad.fire) this.telemetry.fireFrames++;
    if (pad.reload) this.telemetry.reloadRequests++;
    if (pad.jump && f.pressed.Y) this.telemetry.jumpRequests++;
    if (pad.cycle) this.telemetry.weaponCycles++;
    if (pad.altPressed) this.telemetry.scopeRequests++;
  }
  menu(screen, frame, now) {
    const root = document.getElementById(screen);
    const elements = [...root.querySelectorAll('button,input[type="range"],[role="button"]')]
      .filter(el => !el.disabled && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    if (!elements.length) return;
    if (this.previousScreen !== screen) {
      this.previousScreen = screen;
      const primary = root.querySelector('#btnStart,#btnResume,#btnAgain,#btnLoadClose');
      this.focus(primary || elements[0]);
    }
    if (!elements.includes(document.activeElement)) this.focus(elements[0]);
    for (const key of ['UP','DOWN','LEFT','RIGHT']) {
      if (!frame.buttons[key]) { this.repeatAt[key] = 0; continue; }
      if (!frame.pressed[key] && (!this.repeatAt[key] || now < this.repeatAt[key])) continue;
      this.repeatAt[key] = now + (frame.pressed[key] ? 450 : 180);
      const current = document.activeElement;
      if (current.matches('input[type="range"]') && (key === 'LEFT' || key === 'RIGHT')) {
        current.value = String(Math.max(Number(current.min), Math.min(Number(current.max), Number(current.value) + Number(current.step || 1) * (key === 'LEFT' ? -1 : 1))));
        current.dispatchEvent(new Event('input', { bubbles: true }));
        continue;
      }
      const rect = current.getBoundingClientRect(), x = rect.x + rect.width/2, y = rect.y + rect.height/2;
      const horizontal = key === 'LEFT' || key === 'RIGHT', sign = key === 'LEFT' || key === 'UP' ? -1 : 1;
      const candidates = elements.filter(el => el !== current).map(el => {
        const r = el.getBoundingClientRect(), dx = r.x + r.width/2 - x, dy = r.y + r.height/2 - y;
        const along = (horizontal ? dx : dy) * sign, cross = Math.abs(horizontal ? dy : dx);
        return { el, along, score: along + cross * 3 };
      }).filter(v => v.along > 3).sort((a,b) => a.score-b.score);
      if (candidates.length) this.focus(candidates[0].el);
    }
    if (frame.pressed.A) document.activeElement?.click();
    if (frame.pressed.B) {
      if (screen === 'loadout') this.g.closeLoadout();
      else if (screen === 'pause') this.g.resume();
    }
  }
  focus(el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  snapshot() {
    const g = this.g, p = g.player, w = p?.weapon;
    const gl = g.renderer?.renderer?.getContext();
    return { game: 'cf-transport-ship', webglVersion: gl ? gl.getParameter(gl.VERSION) : null, ready: !!g.renderer, stage: g.loadError ? 'error' : g.hud.screenName || (g.playing ? 'playing' : 'menu'), webglError: !!g.loadError && /webgl|context|renderer/i.test(g.loadError), error: g.loadError || '',
      playing: !!g.playing, paused: !!g.paused, ended: !!g.ended, controllerMode: !!g.controllerMode,
      focus: document.activeElement?.id || document.activeElement?.textContent?.trim().slice(0,100) || '',
      pointerLocked: document.pointerLockElement === document.getElementById('c'),
      controller: this.input.peek(), quality: g.opts.quality, team: g.opts.team, primary: g.opts.primary, goal: g.goal, time: g.time,
      score: { ...g.score }, controllerConnected: !!this.frame.connected, settings: { ...this.settings },
      player: p ? { position: { x:p.pos.x, y:p.pos.y, z:p.pos.z }, yaw:p.yaw, pitch:p.pitch,
        alive:p.alive, hp:p.hp, armor:p.armor, weapon:w?.id, slot:p.slot, ammo:w?.mag,
        reserve:w?.reserve, reloading:!!w?.reloading, onGround:!!p.onGround, scoped:p.scoped,
        shotsFired:p.stats.shots, kills:p.stats.k, deaths:p.stats.d, input:{ ...p.pad } } : null,
      telemetry: { ...this.telemetry } };
  }
}
