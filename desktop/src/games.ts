import {invoke} from '@tauri-apps/api/core';
import {listen, type UnlistenFn} from '@tauri-apps/api/event';
import {getCurrentWindow} from '@tauri-apps/api/window';
import {desktop, type McpInfo} from './bridge';
import {locale, message, t} from './i18n';
import {WebGamePackaging, type GameKind, type GameDeployment} from './web-game-packaging';

const gamesBase = 'https://ecojust.github.io/pureTV/games/';
const localOrigins = new Set([48731, 48732, 48733, 48734].map(port => 'http://127.0.0.1:' + port));
const twoPlayerGames = new Set(['tank', 'super-mario', 'jackal', 'tetris', 'jewel', 'used-car-racing']);
const libraryBase = 'https://apps.b14f.com/game-library/';
const repositoryBase = 'https://raw.githubusercontent.com/ecojust/pureTV/master/game-library/';

type Group = {id:string; zh:string; en:string};
type Asset = {path:string; bytes:number; sha256:string};
type Game = Group & {category:string; kind:GameKind; files:Asset[]; downloaded?:boolean; controls?:{zh:string; en:string}};
type Catalog = {version:number; groups:Group[]; shared:Asset[]; games:Game[]};

function projectRevision(catalog:Catalog, game:Game):string {
  return JSON.stringify([catalog.shared, game.files]);
}

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
      const response = await fetch(base + 'web/catalog.json', {cache:'no-cache', signal:controller.signal});
      if (response.ok) {
        const catalog:Catalog = await response.json();
        if (validCatalog(catalog)) return {catalog, base};
      }
    } catch { /* The repository also serves the published catalog. */ }
    finally { window.clearTimeout(timer); }
  }
  throw new Error(t('无法读取游戏列表，请检查网络后重试。'));
}

type LocalGame = {id:string; title:string; directory:string};
type GameSource = 'online' | 'local';
type ControllerSession = {webSocketUrl?:string; session:string; port:number; addresses:string[]; discovery:boolean};
type ControllerPlayer = {id:number; connected:boolean; controllerId:string};
type ControllerState = {session:string; revision:number; connections:number; players:ControllerPlayer[]};
type ActiveGame = {
  id:string;
  source:GameSource;
  frame:HTMLIFrameElement;
  origin:string;
  ready:boolean;
  enteredFullscreen?:boolean;
  localMount?:string;
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
  source:GameSource = 'online';
  private localGames:LocalGame[] = [];
  private listing = 0;
  private localLoading = false;
  private localError = '';
  private choosing = false;
  private configOpen = false;
  private player = document.createElement('dialog');
  private active?:ActiveGame;
  private readyTimeout?:number;
  private catalog?:Catalog;
  private coverBase = libraryBase;
  private loading = false;
  private catalogError = '';
  private completedDuringRefresh = new Map<string,string>();
  // Finish late starts and stops in order when a player exits and opens another title.
  private socketWork = Promise.resolve();

  private windowWork = Promise.resolve();

  private readonly packaging:WebGamePackaging;

  constructor(deployment:GameDeployment, private readonly changed:() => void) {
    this.packaging = new WebGamePackaging(deployment);
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

  get playing():boolean { return !!this.active; }

  async setSource(source:GameSource):Promise<void> {
    this.source = source;
    const refresh = source === 'local' && desktop ? this.refreshLocal() : undefined;
    this.changed();
    await refresh;
  }

  async refreshLocal():Promise<void> {
    const request = ++this.listing;
    this.localLoading = true;
    this.localError = '';
    try {
      const games = await invoke<LocalGame[]>('list_local_games');
      if (request === this.listing) this.localGames = games;
    } catch (error) {
      if (request === this.listing) this.localError = String(error);
    } finally {
      if (request === this.listing) {
        this.localLoading = false;
        this.changed();
      }
    }
  }

  async chooseLocal():Promise<void> {
    if (this.choosing) return;
    this.choosing = true;
    this.localError = '';
    this.changed();
    let added:LocalGame | null = null;
    try {
      added = await invoke<LocalGame | null>('choose_local_game');
      if (added) await this.refreshLocal();
    } catch (error) {
      this.localError = String(error);
    } finally {
      this.choosing = false;
      this.changed();
      const selector = added ? `[data-play-local="${CSS.escape(added.id)}"]` : '[data-choose-local]';
      document.querySelector<HTMLElement>(selector)?.focus({preventScroll:true});
    }
  }

  toggleConfig():void {
    this.configOpen = !this.configOpen;
    this.changed();
    document.querySelector<HTMLElement>('[data-game-config]')?.focus({preventScroll:true});
  }

  private renderLocal(info:McpInfo | null, error:string):string {
    if (!desktop) return `<p>${t('请在桌面客户端中添加和游玩本地游戏。')}</p>`;
    const config = info ? `<pre tabindex="0" class="mcp-config">${escape(JSON.stringify(info.config, null, 2))}</pre>` :
      `<p class="hint">${escape(error || t('正在读取 MCP 配置…'))}</p>`;
    return `<div class="web-game-tools"><button type="button" class="primary" data-choose-local${this.choosing ? ' disabled' : ''}>${t('添加游戏文件夹')}</button>
      <button type="button" data-game-config aria-expanded="${this.configOpen}" aria-controls="game-mcp-config">MCP · ${t('游戏开发')}</button></div>
      <div class="local-games-scroll" data-scroll="local-games">
      <section class="panel" id="game-mcp-config" ${this.configOpen ? '' : 'hidden'}>
        <p>${t('保持管理器打开，将以下配置加入 Agent 的 MCP 设置：')}</p>${config}
        <p>${t('调用以下工具读取手柄协议、注册游戏和测试按键。')}</p>
        <code>get_gamepad_protocol · register_local_game · test_gamepad_button</code>
      </section>
      ${this.localError ? `<div role="alert">${escape(message(this.localError))} <button data-refresh-local>${t('重试')}</button></div>` : ''}
      ${this.localGames.length ? `<div class="local-games-list">${this.localGames.map(game =>
        `<button class="local-game-entry" data-play-local="${escape(game.id)}"><span><strong>${escape(game.title)}</strong><small>${escape(game.directory)}</small></span><span aria-hidden="true">▶</span></button>`).join('')}</div>` :
        `<p class="hint">${this.localLoading ? t('正在读取游戏列表…') : t('选择包含 index.html 的文件夹，即可从这里启动游戏。')}</p>`}
      </div>`;
  }

  async refresh():Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.catalogError = '';
    try {
      const result = desktop ? {catalog:await invoke<Catalog>('game_library_catalog'), base:libraryBase} : await browserCatalog();
      if (!validCatalog(result.catalog)) throw new Error(t('游戏列表格式无效。'));
      // A download may finish after the native command snapshots its cache status.
      for (const game of result.catalog.games) {
        const completed = this.completedDuringRefresh.get(game.id);
        if (completed && completed === projectRevision(result.catalog, game)) game.downloaded = true;
      }
      this.catalog = result.catalog;
      this.coverBase = result.base;
      if (!this.catalog.groups.some(group => group.id === this.group)) this.group = '';
    } catch (error) {
      this.catalogError = error instanceof Error ? error.message : String(error);
    } finally {
      this.loading = false;
      this.completedDuringRefresh.clear();
      this.changed();
    }
  }

  private downloadedBadge(game:Game):string {
    return `<span class="web-game-downloaded" id="downloaded-${escape(game.id)}" data-downloaded-game="${escape(game.id)}">${t('已下载')}</span>`;
  }

  private markDownloaded(game:Game, revision:string):void {
    if (this.loading) this.completedDuringRefresh.set(game.id, revision);
    const catalog = this.catalog;
    const current = catalog?.games.find(entry => entry.id === game.id);
    if (!catalog || current?.kind !== 'project' || projectRevision(catalog, current) !== revision || current.downloaded) return;
    current.downloaded = true;
    const cover = document.querySelector<HTMLButtonElement>(`[data-play-game="${CSS.escape(game.id)}"]`);
    cover?.querySelector('.web-game-image')?.insertAdjacentHTML('beforeend', this.downloadedBadge(current));
    cover?.setAttribute('aria-describedby', 'downloaded-' + game.id);
  }

  render(info:McpInfo | null, error:string):string {
    const tabs = (['online', 'local'] as const).map(source => {
      const selected = this.source === source;
      return `<button type="button" id="game-source-${source}" role="tab" data-game-source="${source}" aria-controls="game-source-panel" aria-selected="${selected}" tabindex="${selected ? 0 : -1}" class="${selected ? 'primary' : ''}">${source === 'online' ? t('线上游戏') : t('本地游戏')}</button>`;
    }).join('');
    return `<div class="application-tabs" role="tablist" aria-label="${t('游戏来源')}">${tabs}</div>
      <section class="game-source-panel" id="game-source-panel" role="tabpanel" aria-labelledby="game-source-${this.source}">${this.source === 'local' ? this.renderLocal(info, error) : this.renderOnline()}</section>`;
  }

  private renderOnline():string {
    if (!this.catalog && !this.loading && !this.catalogError) void this.refresh();
    const reload = `<button type="button" data-refresh-games${this.loading ? ' disabled' : ''}>${this.loading ? t('正在读取游戏列表…') : this.catalogError ? t('重试') : t('刷新列表')}</button>`;
    const error = this.catalogError ? `<p role="alert">${escape(message(this.catalogError))}</p>` : '';
    if (!this.catalog) return `<div class="web-game-tools">${reload}</div>${error}`;
    const {games, groups} = this.catalog;
    const options = groups.map(group => `<option value="${escape(group.id)}"${group.id === this.group ? ' selected' : ''}>${escape(locale() === 'en' ? group.en : t(group.zh))}</option>`).join('');
    const listed = games.filter(game => !this.group || game.category === this.group);
    const card = (game:Game) => {
      const id = escape(game.id);
      const cover = game.kind === 'hosted' ? 'thumb.webp' : 'thumb.png';
      const imagePath = encodeURIComponent(game.id) + '/' + cover;
      const name = escape(gameName(game));
      const downloaded = desktop && game.kind === 'project' && game.downloaded;
      const deploy = desktop ? `<div class="web-game-actions"><button type="button" class="primary" data-deploy-game="${id}"
        aria-label="${name} · ${t('部署到电视')}">${t('部署到电视')}</button></div>` : '';
      return `<article class="web-game-card"><button type="button" class="web-game-cover" data-play-game="${id}" aria-label="${name}"${downloaded ? ` aria-describedby="downloaded-${id}"` : ''}>
        <span class="web-game-image"><img loading="lazy" src="${escape(this.coverBase + 'web/' + imagePath)}" alt="">${downloaded ? this.downloadedBadge(game) : ''}</span>
        <strong>${name}</strong></button>${deploy}</article>`;
    };
    return `<div class="web-game-tools"><label>${t('游戏分类')} <select name="gameGroup"><option value="">${t('全部游戏')}</option>${options}</select></label><span>${t('游戏数量')} · ${listed.length}</span>${reload}</div>${error}<div class="web-game-grid" data-scroll="games-${this.group || 'all'}">${listed.map(card).join('')}</div>`;
  }

  setGroup(group:string):void { this.group = group; }

  deploy(id:string, opener:HTMLButtonElement):void {
    const catalog = this.catalog;
    const game = catalog?.games.find(entry => entry.id === id);
    if (!desktop || !catalog || !game || this.active) return;
    const revision = projectRevision(catalog, game);
    this.packaging.open(id, gameName(game), game.kind, opener, () => this.markDownloaded(game, revision));
  }

  private createPlayer(id:string, title:string, loading:string, hint:string):ActiveGame {
    const content = document.createElement('div');
    content.className = 'game-player-content';
    content.innerHTML = `<div class="game-player-toolbar">
      <button type="button" data-close-game>← ${t('返回游戏列表')}</button>
      <h2 id="game-player-title">${escape(title)}</h2>
      <div class="game-status" role="status" aria-label="${t('游戏状态')}" tabindex="0">
        <p><span data-frame-status></span> <span data-socket-status></span></p>
      </div>
    </div>`;
    const frame = document.createElement('iframe');
    frame.title = title;
    frame.allow = 'gamepad; fullscreen; autoplay';
    frame.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-pointer-lock');
    const active:ActiveGame = {id, source:this.source, frame, ready:false, origin:''};
    this.active = active;
    content.append(frame);
    this.player.append(content);
    this.status('[data-frame-status]', loading);
    this.status('[data-socket-status]', hint);
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
    return active;
  }

  openLocal(id:string):void {
    const game = this.localGames.find(entry => entry.id === id);
    if (!desktop || !game || this.active || this.source !== 'local') return;
    const active = this.createPlayer(id, game.title, t('正在加载游戏…'), t('正在启动无线手柄服务…'));
    this.socketWork = this.socketWork.then(async () => {
      if (this.active !== active) return;
      const mount = await invoke<string>('play_local_game', {id});
      if (this.active !== active) {
        await invoke('release_local_game', {url:mount});
        return;
      }
      active.localMount = mount;
      const url = new URL(mount);
      if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !['48735','48736','48737','48738'].includes(url.port) ||
          !/^\/games\/[a-f0-9]{32}\/index\.html$/.test(url.pathname)) throw new Error(t('本地游戏资源暂不可用。'));
      active.origin = url.origin;
      try {
        await this.startControllers(active, url.origin);
        if (active.controller?.webSocketUrl) url.searchParams.set('puretvSocket', active.controller.webSocketUrl);
      } catch {
        if (this.active !== active) return;
        this.status('[data-socket-status]', t('无线手柄服务不可用，仍可使用键盘游玩。'));
      }
      if (this.active !== active) return;
      active.frame.addEventListener('load', () => {
        if (this.active !== active) return;
        active.ready = true;
        this.status('[data-frame-status]', '');
        this.forward(active);
        active.frame.focus();
      }, {once:true});
      active.frame.src = url.href;
    }).catch(error => {
      if (this.active === active) {
        this.status('[data-frame-status]', message(String(error)));
        this.status('[data-socket-status]', '');
      }
    });
  }

  open(id:string):void {
    const game = this.catalog?.games.find(entry => entry.id === id);
    if (!game || this.active) return;
    const local = desktop && game.kind === 'project';
    const loading = local && !game.downloaded ? t('正在准备本地游戏，首次使用需要下载…') : t('正在加载游戏…');
    const hint = game.controls ? game.controls[gameLanguage()] : desktop ? t('正在启动无线手柄服务…') : t('可使用键盘游玩。');
    const active = this.createPlayer(id, gameName(game), loading, hint);
    const frame = active.frame;
    if (local) {
      const revision = projectRevision(this.catalog!, game);
      void invoke<string>('local_game_base', {gameId:id}).then(base => {
        const url = new URL(base);
        if (!localOrigins.has(url.origin) || !url.pathname.startsWith('/games/') || !url.pathname.endsWith('/')) {
          throw new Error(t('本地游戏资源暂不可用。'));
        }
        this.markDownloaded(game, revision);
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
      active.origin = new URL(gamesBase).origin;
      frame.src = gameUrl(gamesBase, id);
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

  private async startControllers(active:ActiveGame, gameOrigin?:string):Promise<void> {
    if (this.active !== active) return;
    const unlisten = await listen<ControllerState>('game-controller-state', ({payload}) => this.update(active, payload));
    if (this.active !== active) { unlisten(); return; }
    active.unlisten = unlisten;
    const controller = await invoke<ControllerSession>('start_game_controllers', gameOrigin ? {players:2, gameOrigin, localGameId:active.id} : {players:twoPlayerGames.has(active.id) ? 2 : 1});
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
    if (active.localMount) void invoke('release_local_game', {url:active.localMount}).catch(() => {});
    const session = active.controller?.session;
    if (session) this.socketWork = this.socketWork.then(() => invoke<void>('stop_game_controllers', {session})).catch(() => {});
    if (desktop) {
      this.windowWork = this.windowWork.then(async () => {
        if (active.enteredFullscreen) await getCurrentWindow().setFullscreen(false);
      }).catch(() => {});
    }
    this.player.close();
    this.player.replaceChildren();
    document.querySelector<HTMLElement>(`[data-play-${active.source === 'local' ? 'local' : 'game'}="${CSS.escape(active.id)}"]`)?.focus({preventScroll:true});
  }
}
