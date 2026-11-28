import {invoke} from '@tauri-apps/api/core';
import {listen, type UnlistenFn} from '@tauri-apps/api/event';
import {getCurrentWindow} from '@tauri-apps/api/window';
import catalog from '../../tools/pc-games/catalog.json';
import hosted from '../../tools/pc-games/hosted-games.json';
import sections from '../../tools/readme-app-games.json';
import {desktop} from './bridge';
import {locale, t} from './i18n';
import {WebGamePackaging, type GameDeployment, type QueueGameApk} from './web-game-packaging';

const gamesBase = 'https://ecojust.github.io/pureTV/games/';
const localOrigins = new Set([48731, 48732, 48733, 48734].map(port => 'http://127.0.0.1:' + port));
const twoPlayerGames = new Set(['tank', 'super-mario', 'jackal', 'tetris', 'jewel', 'used-car-racing']);
type Game = (typeof catalog)[number] | (typeof hosted)[number];
const games = new Map<string, Game>([...catalog, ...hosted].map(game => [game.id, game]));
const groups = sections.map(({id, zh, en, games:entries}) => ({
  id, zh, en,
  games: entries.flatMap(entry => {
    const path = entry.resource ?? entry.page;
    const game = path && games.get(path.split('/')[1]);
    return game ? [game] : [];
  }).concat(hosted.filter(game => game.category === id))
}));
type ControllerSession = {session:string; port:number; addresses:string[]; discovery:boolean};
type ControllerPlayer = {id:number; connected:boolean; controllerId:string};
type ControllerState = {session:string; revision:number; connections:number; players:ControllerPlayer[]};
type ActiveGame = {
  game:Game;
  frame:HTMLIFrameElement;
  origin:string;
  ready:boolean;
  enteredFullscreen?:boolean;
  controller?:ControllerSession;
  snapshot?:ControllerState;
  unlisten?:UnlistenFn;
};
function gameLanguage() { return locale() === 'en' ? 'en' : 'zh'; }
function gameName(game:Game) { return gameLanguage() === 'en' ? game.en : game.zh; }
function gameUrl(base:string, id:string) { return base + encodeURIComponent(id) + '/tv.html?lang=' + gameLanguage(); }
const escape = (value:string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

export class Games {
  private group = '';
  private player = document.createElement('dialog');
  private active?:ActiveGame;
  private readyTimeout?:number;
  private localBase?:string;
  private localStart?:Promise<string>;
  // Finish late starts and stops in order when a player exits and opens another title.
  private socketWork = Promise.resolve();

  private windowWork = Promise.resolve();

  private readonly packaging:WebGamePackaging;

  constructor(enqueue:QueueGameApk, deployment:GameDeployment) {
    this.packaging = new WebGamePackaging(enqueue, deployment);
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
      if (!active || event.origin !== active.origin || event.source !== active.frame.contentWindow) return;
      if (event.data?.type === 'puretv:game-exit') this.close();
      if (event.data?.type === 'puretv:game-ready') {
        active.ready = true;
        window.clearTimeout(this.readyTimeout);
        this.status('[data-frame-status]', '');
        this.forward(active);
        if (event.data.keepFocus !== true) active.frame.focus();
      }
    });
  }

  private localLibrary():Promise<string> {
    if (!this.localStart) {
      this.localStart = invoke<string>('local_game_base').then(base => {
        const url = new URL(base);
        if (!localOrigins.has(url.origin) || !url.pathname.startsWith('/games/') || !url.pathname.endsWith('/')) {
          throw new Error(t('本地游戏资源暂不可用。'));
        }
        this.localBase = url.href;
        for (const img of document.querySelectorAll<HTMLImageElement>('img[data-local-cover]')) {
          img.src = url.href + img.dataset.localCover;
        }
        return url.href;
      }).catch(error => {
        this.localStart = undefined;
        throw error;
      });
    }
    return this.localStart;
  }

  render():string {
    if (desktop && !this.localBase) void this.localLibrary().catch(() => {});
    const shown = groups.filter(group => !this.group || this.group === group.id);
    const options = groups.map(group => `<option value="${group.id}"${group.id === this.group ? ' selected' : ''}>${escape(locale() === 'en' ? group.en : t(group.zh))}</option>`).join('');
    const listed = shown.flatMap(section => section.games);
    const card = (game:Game) => {
      const id = game.id;
      const cover = 'controls' in game ? 'thumb.webp' : 'thumb.png';
      const name = escape(gameName(game));
      const play = desktop ? `<span class="web-game-play-label">${t('电脑游玩')}</span>` : '';
      const action = 'controls' in game ? t('生成电视 APK') : t('获取电视 APK');
      const pack = desktop ? `<div class="web-game-actions"><button type="button" class="primary" data-deploy-game="${escape(id)}"
        aria-label="${name} · ${t('部署到电视')}">${t('部署到电视')}</button><button type="button" class="web-game-apk" data-build-game="${escape(id)}"
        aria-label="${name} · ${action}">${action}</button></div>` : '';
      const imagePath = encodeURIComponent(id) + '/' + cover;
      const coverBase = desktop ? this.localBase : gamesBase;
      const image = coverBase ? `src="${escape(coverBase + imagePath)}"` : `data-local-cover="${imagePath}"`;
      return `<article class="web-game-card"><button type="button" class="web-game-cover" data-play-game="${escape(id)}" aria-label="${name}">
        <img loading="lazy" ${image} alt=""><strong>${name}</strong>${play}</button>${pack}</article>`;
    };
    let cards:string;
    if (desktop) {
      const local = listed.filter(game => !('controls' in game));
      const online = listed.filter(game => 'controls' in game);
      cards = [
        local.length ? `<h3 class="web-game-section">${t('本地游戏')} · ${local.length}</h3>${local.map(card).join('')}` : '',
        online.length ? `<h3 class="web-game-section">${t('联网游戏')} · ${online.length}<small>${t('打开联网游戏需要网络连接。')}</small></h3>${online.map(card).join('')}` : ''
      ].join('');
    } else {
      cards = listed.map(card).join('');
    }
    return `<div class="web-game-tools"><label>${t('游戏分类')} <select name="gameGroup"><option value="">${t('全部游戏')}</option>${options}</select></label><span>${t('游戏数量')} · ${listed.length}</span></div><div class="web-game-grid" data-scroll="games-${this.group || 'all'}">${cards}</div>`;
  }

  setGroup(group:string):void { this.group = group; }

  packageGame(id:string, opener:HTMLButtonElement, deploy=false):void {
    const game = games.get(id);
    if (desktop && game && !this.active) this.packaging.open(id, gameName(game), 'controls' in game, opener, deploy);
  }

  open(id:string):void {
    const game = games.get(id);
    if (!game || this.active) return;
    const content = document.createElement('div');
    content.className = 'game-player-content';
    content.innerHTML = `<div class="game-player-toolbar">
      <button type="button" data-close-game>← ${t('返回游戏列表')}</button>
      <h2 id="game-player-title">${escape(gameName(game))}</h2>
      <div class="game-status" role="status" aria-label="${t('游戏状态')}" tabindex="0">
        <p><span data-frame-status></span> <span data-socket-status></span></p>
      </div>
    </div>`;
    const frame = document.createElement('iframe');
    frame.title = gameName(game);
    frame.allow = 'gamepad; fullscreen; autoplay';
    frame.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-pointer-lock');
    const local = desktop && !('controls' in game);
    const active:ActiveGame = {game, frame, ready:false, origin:local ? '' : new URL(gamesBase).origin};
    this.active = active;
    content.append(frame);
    this.player.append(content);
    this.status('[data-frame-status]', t('正在加载游戏…'));
    const hint = 'controls' in game ? game.controls[gameLanguage()] :
      desktop ? t('正在启动无线手柄服务…') : t('可使用键盘游玩。');
    this.status('[data-socket-status]', hint);
    this.player.showModal();
    if (local) {
      void this.localLibrary().then(base => {
        if (this.active === active) {
          active.origin = new URL(base).origin;
          frame.src = gameUrl(base, id);
        }
      }).catch(() => {
        if (this.active === active) {
          window.clearTimeout(this.readyTimeout);
          this.status('[data-frame-status]', t('本地游戏资源暂不可用。'));
        }
      });
    } else {
      frame.src = gameUrl(gamesBase, id);
    }
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
      this.status('[data-frame-status]', local ? t('正在加载游戏…') : t('游戏加载较慢，请检查网络。'));
    }, 25000);
    if (desktop && !('controls' in game)) {
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
    active.snapshot = snapshot;
    this.forward(active);
    this.showControllerStatus(active);
  }

  private showControllerStatus(active:ActiveGame):void {
    const info = active.controller!;
    const endpoints = info.addresses.map(address => address + ':' + info.port).join(' · ');
    const snapshot = active.snapshot;
    let hint = info.discovery ? t('请在同一局域网内按手柄搜索键连接。') : t('手柄自动发现不可用，请按地址连接。');
    if (snapshot?.connections) {
      const seats = snapshot.players.filter(player => player.connected)
        .map(player => [`P${player.id}`, player.controllerId].filter(Boolean).join(' '));
      hint = [t('已连接无线手柄'), snapshot.connections, ...seats].join(' · ');
    }
    this.status('[data-socket-status]', `${hint} · ${endpoints || `TCP ${info.port}`}`);
  }

  private forward(active:ActiveGame):void {
    if (active.ready && active.snapshot) {
      const {session:_, ...state} = active.snapshot;
      active.frame.contentWindow?.postMessage({type:'puretv:controller-state', state}, active.origin);
    }
  }

  private status(selector:string, text:string):void {
    const element = this.player.querySelector(selector);
    if (element && element.textContent !== text) element.textContent = text;
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
