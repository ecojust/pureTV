import {invoke} from '@tauri-apps/api/core';
import {listen, type UnlistenFn} from '@tauri-apps/api/event';
import {getCurrentWindow} from '@tauri-apps/api/window';
import {desktop} from './bridge';
import {locale, message, t} from './i18n';
import {WebGamePackaging, type GameKind, type GameDeployment, type QueueGameApk} from './web-game-packaging';

const gamesBase = 'https://ecojust.github.io/pureTV/games/';
const localOrigins = new Set([48731, 48732, 48733, 48734].map(port => 'http://127.0.0.1:' + port));
const twoPlayerGames = new Set(['tank', 'super-mario', 'jackal', 'tetris', 'jewel', 'used-car-racing']);
const libraryBase = 'https://apps.b14f.com/game-library/';
const repositoryBase = 'https://raw.githubusercontent.com/ecojust/pureTV/master/game-library/';

type Group = {id:string; zh:string; en:string};
type Game = Group & {category:string; kind:GameKind; downloaded?:boolean; controls?:{zh:string; en:string}};
type Catalog = {version:number; groups:Group[]; games:Game[]};

function validCatalog(catalog:Catalog):boolean {
  const named = (entry:Group) => entry && typeof entry.id === 'string' && /^[a-z0-9-]+$/.test(entry.id) &&
    typeof entry.zh === 'string' && typeof entry.en === 'string';
  return catalog?.version === 1 && Array.isArray(catalog.groups) && catalog.groups.every(named) &&
    Array.isArray(catalog.games) && catalog.games.every(game => named(game) &&
      catalog.groups.some(group => group.id === game.category) &&
      ['project', 'online', 'hosted'].includes(game.kind) && (!game.controls ||
        typeof game.controls.zh === 'string' && typeof game.controls.en === 'string'));
}

async function browserCatalog():Promise<{catalog:Catalog; base:string}> {
  for (const base of [libraryBase, repositoryBase]) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(base + 'catalog.json', {cache:'no-cache', signal:controller.signal});
      if (response.ok) {
        const catalog:Catalog = await response.json();
        if (validCatalog(catalog)) return {catalog, base};
      }
    } catch { /* The repository also serves the published catalog. */ }
    finally { window.clearTimeout(timer); }
  }
  throw new Error(t('无法读取游戏列表，请检查网络后重试。'));
}

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
  private catalog?:Catalog;
  private coverBase = libraryBase;
  private loading = false;
  private catalogError = '';
  private downloading = new Set<string>();
  private downloadErrors = new Map<string,string>();
  // Finish late starts and stops in order when a player exits and opens another title.
  private socketWork = Promise.resolve();

  private windowWork = Promise.resolve();

  private readonly packaging:WebGamePackaging;

  constructor(enqueue:QueueGameApk, deployment:GameDeployment, private readonly changed:() => void) {
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

  async refresh():Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.catalogError = '';
    try {
      const result = desktop ? {catalog:await invoke<Catalog>('game_library_catalog'), base:libraryBase} : await browserCatalog();
      if (!validCatalog(result.catalog)) throw new Error(t('游戏列表格式无效。'));
      this.catalog = result.catalog;
      this.coverBase = result.base;
      if (!this.catalog.groups.some(group => group.id === this.group)) this.group = '';
    } catch (error) {
      this.catalogError = error instanceof Error ? error.message : String(error);
    } finally {
      this.loading = false;
      this.changed();
    }
  }

  private downloadControl(game:Game):string {
    const busy = this.downloading.has(game.id);
    const error = this.downloadErrors.get(game.id);
    const label = busy ? t('下载中…') : game.downloaded ? t('已下载') : error ? t('重新下载') : t('下载到本地');
    const id = escape(game.id);
    return `<button type="button" data-download-game="${id}" aria-label="${escape(gameName(game) + ' · ' + label)}"
      aria-disabled="${busy || !!game.downloaded}">${label}</button>${error && !game.downloaded ? `<small role="alert">${escape(message(error))}</small>` : ''}`;
  }

  private updateDownloadControl(id:string):void {
    const slot = document.querySelector<HTMLElement>(`[data-download-slot="${CSS.escape(id)}"]`);
    const game = this.catalog?.games.find(entry => entry.id === id);
    if (!slot || !game) return;
    const focused = slot.contains(document.activeElement);
    slot.innerHTML = this.downloadControl(game);
    if (focused) slot.querySelector('button')?.focus({preventScroll:true});
  }

  async download(id:string):Promise<void> {
    const game = this.catalog?.games.find(entry => entry.id === id);
    if (!desktop || game?.kind !== 'project' || game.downloaded || this.downloading.has(id)) return;
    this.downloading.add(id);
    this.downloadErrors.delete(id);
    this.updateDownloadControl(id);
    try {
      await invoke('download_library_game', {gameId:id});
      game.downloaded = true;
    } catch (error) {
      this.downloadErrors.set(id, error instanceof Error ? error.message : String(error));
    } finally {
      this.downloading.delete(id);
      this.updateDownloadControl(id);
    }
  }

  render():string {
    if (!this.catalog && !this.loading && !this.catalogError) void this.refresh();
    const reload = `<button type="button" data-refresh-games${this.loading ? ' disabled' : ''}>${this.loading ? t('正在读取游戏列表…') : this.catalogError ? t('重试') : t('刷新列表')}</button>`;
    const error = this.catalogError ? `<p role="alert">${escape(message(this.catalogError))}</p>` : '';
    if (!this.catalog) return `<div class="web-game-tools">${reload}</div>${error}`;
    const {games, groups} = this.catalog;
    const options = groups.map(group => `<option value="${escape(group.id)}"${group.id === this.group ? ' selected' : ''}>${escape(locale() === 'en' ? group.en : t(group.zh))}</option>`).join('');
    const listed = games.filter(game => !this.group || game.category === this.group);
    const card = (game:Game) => {
      const id = game.id;
      const cover = game.kind === 'hosted' ? 'thumb.webp' : 'thumb.png';
      const name = escape(gameName(game));
      const play = desktop ? `<span class="web-game-play-label">${t('电脑游玩')}</span>` : '';
      const onlineApk = game.kind === 'online';
      const action = onlineApk ? t('获取正式 APK') : game.kind === 'hosted' ? t('生成电视 APK') : t('获取电视 APK');
      const onlineNote = onlineApk ? `<small id="apk-note-${escape(id)}" class="web-game-network-note">${t('首次获取正式 APK 需要联网。')}</small>` : '';
      const download = desktop && game.kind === 'project' ? `<div class="web-game-download" data-download-slot="${escape(id)}" aria-live="polite">${this.downloadControl(game)}</div>` : '';
      const pack = desktop ? `${onlineNote}<div class="web-game-actions"><button type="button" class="primary" data-deploy-game="${escape(id)}"
        aria-label="${name} · ${t('部署到电视')}"${onlineApk ? ` aria-describedby="apk-note-${escape(id)}"` : ''}>${t('部署到电视')}</button><button type="button" class="web-game-apk" data-build-game="${escape(id)}"
        aria-label="${name} · ${action}">${action}</button></div>` : '';
      const imagePath = encodeURIComponent(id) + '/' + cover;
      return `<article class="web-game-card"><button type="button" class="web-game-cover" data-play-game="${escape(id)}" aria-label="${name}">
        <img loading="lazy" src="${escape(this.coverBase + 'web/' + imagePath)}" alt=""><strong>${name}</strong>${play}</button>${download}${pack}</article>`;
    };
    let cards:string;
    if (desktop) {
      const local = listed.filter(game => game.kind === 'project');
      const online = listed.filter(game => game.kind !== 'project');
      cards = [
        local.length ? `<h3 class="web-game-section">${t('本地游戏')} · ${local.length}<small>${t('首次游玩或部署时下载，之后可离线使用。')}</small></h3>${local.map(card).join('')}` : '',
        online.length ? `<h3 class="web-game-section">${t('联网游戏')} · ${online.length}<small>${t('打开联网游戏需要网络连接。')}</small></h3>${online.map(card).join('')}` : ''
      ].join('');
    } else {
      cards = listed.map(card).join('');
    }
    return `<div class="web-game-tools"><label>${t('游戏分类')} <select name="gameGroup"><option value="">${t('全部游戏')}</option>${options}</select></label><span>${t('游戏数量')} · ${listed.length}</span>${reload}</div>${error}<div class="web-game-grid" data-scroll="games-${this.group || 'all'}">${cards}</div>`;
  }

  setGroup(group:string):void { this.group = group; }

  packageGame(id:string, opener:HTMLButtonElement, deploy=false):void {
    const game = this.catalog?.games.find(entry => entry.id === id);
    if (desktop && game && !this.active) this.packaging.open(id, gameName(game), game.kind, opener, deploy);
  }

  open(id:string):void {
    const game = this.catalog?.games.find(entry => entry.id === id);
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
    const local = desktop && game.kind === 'project';
    const active:ActiveGame = {game, frame, ready:false, origin:local ? '' : new URL(gamesBase).origin};
    this.active = active;
    content.append(frame);
    this.player.append(content);
    this.status('[data-frame-status]', local ? t('正在准备本地游戏，首次使用需要下载…') : t('正在加载游戏…'));
    const hint = game.controls ? game.controls[gameLanguage()] :
      desktop ? t('正在启动无线手柄服务…') : t('可使用键盘游玩。');
    this.status('[data-socket-status]', hint);
    this.player.showModal();
    if (local) {
      void invoke<string>('local_game_base', {gameId:id}).then(base => {
        const url = new URL(base);
        if (!localOrigins.has(url.origin) || !url.pathname.startsWith('/games/') || !url.pathname.endsWith('/')) {
          throw new Error(t('本地游戏资源暂不可用。'));
        }
        game.downloaded = true;
        this.downloadErrors.delete(id);
        this.updateDownloadControl(id);
        if (this.active === active) {
          active.origin = url.origin;
          this.status('[data-frame-status]', t('正在加载游戏…'));
          frame.src = gameUrl(base, id);
        }
      }).catch(error => {
        if (this.active === active) {
          this.status('[data-frame-status]', message(error instanceof Error ? error.message : String(error)));
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
    if (!local) this.readyTimeout = window.setTimeout(() => {
      this.status('[data-frame-status]', t('游戏加载较慢，请检查网络。'));
    }, 25000);
    if (desktop && game.kind !== 'hosted') {
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
