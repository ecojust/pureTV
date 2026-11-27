import {invoke} from '@tauri-apps/api/core';
import {listen, type UnlistenFn} from '@tauri-apps/api/event';
import {getCurrentWindow} from '@tauri-apps/api/window';
import catalog from '../../tools/pc-games/catalog.json';
import sections from '../../tools/readme-app-games.json';
import {desktop} from './bridge';
import {locale, t} from './i18n';

const gamesBase = 'https://ecojust.github.io/pureTV/games/';
const gamesOrigin = new URL(gamesBase).origin;
const twoPlayerGames = new Set(['tank', 'super-mario', 'jackal', 'tetris', 'jewel', 'used-car-racing']);
const games = new Map(catalog.map(game => [game.id, game]));
const groups = sections.map(({id, zh, en, games:entries}) => ({
  id, zh, en,
  games: entries.flatMap(entry => {
    const path = entry.resource ?? entry.page;
    const game = path && games.get(path.split('/')[1]);
    return game ? [game] : [];
  })
}));
type Game = (typeof catalog)[number];
type ControllerSession = {session:string; port:number; addresses:string[]; discovery:boolean};
type ControllerState = {session:string; revision:number; connections:number; players:unknown[]};
type ActiveGame = {
  game:Game;
  frame:HTMLIFrameElement;
  ready:boolean;
  enteredFullscreen?:boolean;
  controller?:ControllerSession;
  snapshot?:ControllerState;
  unlisten?:UnlistenFn;
};
function gameLanguage() { return locale() === 'en' ? 'en' : 'zh'; }
function gameName(game:Game) { return gameLanguage() === 'en' ? game.en : game.zh; }
function gameUrl(id:string) { return gamesBase + encodeURIComponent(id) + '/tv.html?lang=' + gameLanguage(); }
const escape = (value:string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

export class Games {
  private group = '';
  private player = document.createElement('dialog');
  private active?:ActiveGame;
  private readyTimeout?:number;
  // Finish late starts and stops in order when a player exits and opens another title.
  private socketWork = Promise.resolve();

  private windowWork = Promise.resolve();

  constructor() {
    this.player.className = 'game-player';
    this.player.setAttribute('aria-labelledby', 'game-player-title');
    document.body.append(this.player);
    this.player.addEventListener('cancel', e => { e.preventDefault(); this.close(); });
    this.player.addEventListener('click', event => {
      if ((event.target as HTMLElement).closest('[data-close-game]')) this.close();
    });
    window.addEventListener('pagehide', () => this.close());
    window.addEventListener('message', event => {
      const active = this.active;
      if (!active || event.origin !== gamesOrigin || event.source !== active.frame.contentWindow) return;
      if (event.data?.type === 'puretv:game-exit') this.close();
      if (event.data?.type === 'puretv:game-ready') {
        active.ready = true;
        window.clearTimeout(this.readyTimeout);
        this.status('[data-frame-status]', '');
        this.forward(active);
        active.frame.focus();
      }
    });
  }

  render():string {
    const shown = groups.filter(group => !this.group || this.group === group.id);
    const options = groups.map(group => `<option value="${group.id}"${group.id === this.group ? ' selected' : ''}>${escape(locale() === 'en' ? group.en : t(group.zh))}</option>`).join('');
    const cards = shown.flatMap(section => section.games).map(game => {
      const id = game.id;
      return `<article class="web-game-card"><button type="button" class="web-game-cover" data-play-game="${escape(id)}"><img loading="lazy" src="${gamesBase}${encodeURIComponent(id)}/thumb.png" alt=""><strong>${escape(gameName(game))}</strong></button></article>`;
    });
    return `<div class="web-game-tools"><label>${t('游戏分类')} <select name="gameGroup"><option value="">${t('全部游戏')}</option>${options}</select></label><span>${t('游戏数量')} · ${cards.length}</span></div><div class="web-game-grid" data-scroll="games-${this.group || 'all'}">${cards.join('')}</div>`;
  }

  setGroup(group:string):void { this.group = group; }

  open(id:string):void {
    const game = games.get(id);
    if (!game || this.active) return;
    const content = document.createElement('div');
    content.className = 'game-player-content';
    content.innerHTML = `<div class="game-player-toolbar"><button type="button" data-close-game>← ${t('返回游戏列表')}</button><h2 id="game-player-title">${escape(gameName(game))}</h2></div><div class="game-status" role="status"><span data-frame-status></span><span data-socket-status></span></div>`;
    const frame = document.createElement('iframe');
    frame.title = gameName(game);
    frame.allow = 'gamepad; fullscreen; autoplay';
    frame.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-pointer-lock');
    frame.src = gameUrl(id);
    const active:ActiveGame = {game, frame, ready:false};
    this.active = active;
    content.append(frame);
    this.player.append(content);
    this.status('[data-frame-status]', t('正在加载游戏…'));
    this.player.showModal();
    if (desktop) {
      this.windowWork = this.windowWork.then(async () => {
        const appWindow = getCurrentWindow();
        if (!await appWindow.isFullscreen() && this.active === active) {
          await appWindow.setFullscreen(true);
          active.enteredFullscreen = true;
        }
      }).catch(() => {}); // The player still fills the window if fullscreen is unavailable.
    } else {
      void content.requestFullscreen?.().catch(() => {});
    }
    this.readyTimeout = window.setTimeout(() => {
      this.status('[data-frame-status]', t('游戏加载较慢，请检查网络。'));
    }, 25000);
    if (desktop) {
      this.status('[data-socket-status]', t('正在启动无线手柄服务…'));
      this.socketWork = this.socketWork.then(() => this.startControllers(active)).catch(() => {
        if (this.active === active) this.status('[data-socket-status]', t('无线手柄服务不可用，仍可使用键盘游玩。'));
      });
    }
  }

  private async startControllers(active:ActiveGame):Promise<void> {
    if (this.active !== active) return;
    const unlisten = await listen<ControllerState>('game-controller-state', ({payload}) => this.update(active, payload));
    if (this.active !== active) { unlisten(); return; }
    active.unlisten = unlisten;
    const controller = await invoke<ControllerSession>('start_game_controllers', {players:twoPlayerGames.has(active.game.id) ? 2 : 1});
    if (this.active !== active) { await invoke('stop_game_controllers', {session:controller.session}); return; }
    active.controller = controller;
    this.showControllerStatus(active);
    this.update(active, await invoke<ControllerState>('game_controller_state', {session:controller.session}));
  }

  private update(active:ActiveGame, snapshot:ControllerState):void {
    if (this.active !== active || !active.controller || active.controller.session !== snapshot.session ||
        (active.snapshot && active.snapshot.revision >= snapshot.revision)) return;
    const changed = active.snapshot?.connections !== snapshot.connections;
    active.snapshot = snapshot;
    this.forward(active);
    if (changed) this.showControllerStatus(active);
  }

  private showControllerStatus(active:ActiveGame):void {
    const info = active.controller!;
    const endpoints = info.addresses.map(address => address + ':' + info.port).join(' · ');
    const count = active.snapshot?.connections ?? 0;
    const hint = count ? `${t('已连接手柄')} · ${count}` : t('等待无线手柄连接');
    this.status('[data-socket-status]', [hint, endpoints || `TCP ${info.port}`].join(' · '));
  }

  private forward(active:ActiveGame):void {
    if (active.ready && active.snapshot) {
      const {session:_, ...state} = active.snapshot;
      active.frame.contentWindow?.postMessage({type:'puretv:controller-state', state}, gamesOrigin);
    }
  }

  private status(selector:string, text:string):void {
    const element = this.player.querySelector(selector);
    if (element) element.textContent = text;
  }

  close():void {
    const active = this.active;
    if (!active) return;
    this.active = undefined;
    window.clearTimeout(this.readyTimeout);
    active.unlisten?.();
    const session = active.controller?.session;
    if (session) this.socketWork = this.socketWork.then(() => invoke<void>('stop_game_controllers', {session})).catch(() => {});
    if (desktop) {
      this.windowWork = this.windowWork.then(async () => {
        if (active.enteredFullscreen) await getCurrentWindow().setFullscreen(false);
      }).catch(() => {});
    }
    this.player.close();
    this.player.replaceChildren();
    document.querySelector<HTMLElement>(`[data-play-game="${CSS.escape(active.game.id)}"]`)?.focus({preventScroll:true});
  }
}
