import { createController } from '../../../shared/web/input.js';
import { CORE_X, CORE_Y, MAP_H, MAP_W } from '../game/config';
import type { Camera } from '../render/camera';
import type { AppApi, UI } from './ui';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Action = Direction | 'START' | 'A' | 'B' | 'X' | 'Y';
const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const keyboard: Record<string, string> = {
  ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
  Enter: 'A', KeyJ: 'A', KeyK: 'B', KeyL: 'X', KeyI: 'Y', KeyP: 'Start',
};

type TvGame = AppApi & { aiming: boolean; renderer: { cam: Camera } };

export class TvInput {
  private readonly controller = createController({ width: 172, onSuspend: () => this.suspend(), onCancel: () => this.suspend() });
  private readonly cursor = document.createElement('div');
  private x = CORE_X + 2;
  private y = CORE_Y;
  private fieldActive = false;
  private toolbar = false;
  private fieldGame: AppApi['game'] = null;
  private focused: HTMLElement | null = null;
  private nextMove = 0;

  constructor(private app: TvGame, private ui: UI, private clickTile: (x: number, y: number) => void,
    private hoverTile: (x: number, y: number) => void) {
    this.cursor.id = 'tv-cursor';
    this.cursor.hidden = true;
    document.getElementById('app')!.append(this.cursor);
    for (const kind of ['keydown', 'keyup'] as const) {
      window.addEventListener(kind, e => {
        const key = keyboard[e.code];
        if (!key || !e.isTrusted || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
        e.preventDefault();
        if (!e.repeat) window.PureGame.key(key, kind === 'keydown');
      }, true);
    }
    window.addEventListener('pointerdown', () => this.leaveToolbar());
    window.JoystickGameQA = { snapshot: () => this.snapshot() };
  }

  private suspend() {
    this.leaveToolbar();
    if (!this.ui.screenOpen) this.ui.showMenu();
  }

  private setFocus(node: HTMLElement | null) {
    const previous = this.focused;
    previous?.classList.remove('tv-focus');
    this.focused = node;
    if (node) {
      node.focus({ preventScroll: true });
      node.classList.add('tv-focus');
      node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else if (previous === document.activeElement) {
      previous?.blur();
    }
  }

  private leaveToolbar() {
    this.setFocus(null);
    this.toolbar = false;
    this.fieldActive = false;
  }

  private options(root: ParentNode, selector: string) {
    return Array.from(root.querySelectorAll<HTMLElement>(selector))
      .filter(node => !node.matches(':disabled,.locked,.disabled') && node.getClientRects().length);
  }

  private menu(choices: HTMLElement[], direction: Direction | undefined, confirm: boolean) {
    if (!choices.length || (!direction && !confirm)) return;
    const selected = choices.includes(this.focused!) ? this.focused : null;
    if (selected && (direction === 'LEFT' || direction === 'RIGHT')) {
      const step = direction === 'LEFT' ? -1 : 1;
      if (selected instanceof HTMLSelectElement) {
        selected.selectedIndex = (selected.selectedIndex + step + selected.length) % selected.length;
        selected.dispatchEvent(new Event('change', { bubbles: true }));
        this.setFocus(document.querySelector('.screen select'));
        return;
      }
      if (selected instanceof HTMLInputElement && selected.type === 'range') {
        selected.valueAsNumber += step * 5;
        selected.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
    const index = selected ? choices.indexOf(selected) : -1;
    const delta = direction === 'LEFT' || direction === 'UP' ? -1 : 1;
    const choice = selected && !direction ? selected : choices[index === -1 ? 0 : (index + delta + choices.length) % choices.length];
    this.setFocus(choice);
    if (confirm && !(choice instanceof HTMLSelectElement)) choice.click();
  }

  private updateCursor() {
    const cam = this.app.renderer.cam;
    this.cursor.hidden = !this.fieldActive || this.toolbar || this.ui.screenOpen || this.app.inAttract;
    if (!this.cursor.hidden) {
      this.cursor.style.left = cam.toScreenX(this.x) + 'px';
      this.cursor.style.top = cam.toScreenY(this.y) + 'px';
      this.cursor.style.width = this.cursor.style.height = cam.scale + 'px';
    }
  }

  update(time: number) {
    const { buttons, pressed, cancelled } = this.controller.poll() as {
      buttons: Record<Action, boolean>; pressed: Record<Action, boolean>; cancelled: boolean;
    };
    const game = this.app.game;
    this.controller.setPlaying(Boolean(game && !this.app.inAttract && !this.app.paused && !game.over));
    if (cancelled || !game) { this.updateCursor(); return; }
    let direction = directions.find(key => pressed[key]);
    if (direction) this.nextMove = time + 330;
    else if (time >= this.nextMove) {
      direction = directions.find(key => buttons[key]);
      if (direction) this.nextMove = time + 125;
    }
    if (this.fieldGame !== game) {
      this.leaveToolbar();
      this.fieldGame = game;
      this.x = CORE_X + 2;
      this.y = CORE_Y;
    }

    const screen = document.querySelector('.screen');
    if (screen) {
      const primary = screen.querySelector<HTMLElement>('.big-btn');
      if (pressed.START && primary) primary.click();
      else if (pressed.B) screen.querySelector<HTMLElement>('.tv-back')?.click();
      else if (direction || pressed.A) this.menu(this.options(screen, 'button,input,select'), direction, pressed.A);
    } else if (!game.over) {
      if (pressed.START) {
        this.leaveToolbar();
        if (this.app.paused) this.app.togglePause(false);
        else this.ui.showMenu();
      } else if (pressed.B) {
        this.leaveToolbar();
        this.app.setPlacing(null);
        this.app.deselect();
        this.app.aiming = false;
      } else if (pressed.Y) {
        this.app.callWave();
      } else if (pressed.X) {
        this.toolbar = !this.toolbar;
        this.setFocus(this.toolbar ? this.toolbarChoices()[0] ?? null : null);
        this.fieldActive = true;
      } else if (this.toolbar && (direction || pressed.A)) {
        this.menu(this.toolbarChoices(), direction, pressed.A);
        if (pressed.A) {
          this.setFocus(null);
          this.toolbar = false;
          this.hoverTile(this.x, this.y);
        }
      } else if (direction || pressed.A) {
        this.fieldActive = true;
        if (direction === 'LEFT') this.x = Math.max(0, this.x - 1);
        if (direction === 'RIGHT') this.x = Math.min(MAP_W - 1, this.x + 1);
        if (direction === 'UP') this.y = Math.max(0, this.y - 1);
        if (direction === 'DOWN') this.y = Math.min(MAP_H - 1, this.y + 1);
        this.hoverTile(this.x, this.y);
        if (pressed.A) this.clickTile(this.x, this.y);
      }
    }
    this.updateCursor();
  }

  private toolbarChoices() {
    return ['#panel .actions', '#build-bar', '#abilities', '#hud-top', '#preview'].flatMap(selector => {
      const root = document.querySelector(selector);
      return root ? this.options(root, 'button') : [];
    });
  }

  private snapshot() {
    const game = this.app.game;
    const frame = this.controller.peek();
    const panel = document.getElementById('puretv-controller-panel')!;
    const rect = panel.getBoundingClientRect();
    return {
      game: 'lumenrift', renderer: 'canvas2d', frames: frame.pollCount, controller: frame, paused: this.app.paused,
      stage: this.app.inAttract ? 'menu' : game?.over ? 'ended' : this.app.paused ? 'paused' : 'playing',
      panel: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight, hidden: panel.hidden },
      gameplay: { phase: game?.phase, time: game?.time, wave: game?.wave, money: game?.money, buildings: game?.buildings.length,
        placing: this.app.placing ?? '', toolbar: this.toolbar, x: this.x, y: this.y, realm: this.app.realm },
    };
  }
}

declare global {
  interface Window {
    PureGame: { key(key: string, down: boolean): void };
    JoystickGameQA: { snapshot(): unknown };
  }
}
