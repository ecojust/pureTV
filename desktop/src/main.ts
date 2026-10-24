import {t,ui,message,locale,setLocale,setTheme,localeOptions,themeOptions} from './i18n';
import './styles.css';
import {UnifiedEditor} from './unified-editor';
import {validUnified,systemUnchanged} from './unified-layout';
import {sameSubnet} from './subnet';
import {validGeometry,validScene,sceneLabels,autoFrame,sceneNode,frameStyle} from './scene';
import {version as appVersion} from '../package.json';
import * as api from './bridge';
import { emptySnapshot, type Request, type PackageInfo, type PlatformToolsInfo, type DownloadProgress, type Snapshot, type LauncherLayout, type LauncherLayoutInfo, type LauncherRequest } from './types';

type Page = 'connect' | 'apps' | 'launchers' | 'install' | 'history';
type Filter = 'all' | 'system' | 'user' | 'disabled' | 'recoverable';
const pages: Record<Page, [string, string, string]> = {
  connect: ['设备连接', '连接电视，开始管理你的应用和桌面', 'monitor'],
  apps: ['应用管理', '查看电视中的应用，按需停用或恢复', 'grid'],
  launchers: ['启动器', '选择电视的默认桌面，随时回到原来的启动器', 'home'],
  install: ['应用管理', '导入本地安装包，安装后可用于启动器排布', 'download'],
  history: ['操作记录', '逐项查看操作结果，确认电视上的实际变化', 'list'],
};
let snapshot = emptySnapshot();
let mcpInfo: api.McpInfo | null = null, mcpError = "";
let localBusy = false, agentOperation: api.McpOperation | null = null, agentProgress: DownloadProgress | null = null;
function applySnapshot(value: Snapshot): boolean {
  if ((value.revision ?? 0) < (snapshot.revision ?? 0)) return false;
  if(snapshot.device?.serial!==value.device?.serial || snapshot.device?.userId!==value.device?.userId || snapshot.defaultHome!==value.defaultHome)layoutDirty=true;
  if (!connectionEdited && value.lastConnection) { host=value.lastConnection.host;port=String(value.lastConnection.port); }
  snapshot = value; return true;
}
let page: Page = api.demo ? 'apps' : 'connect';
let filter: Filter = 'all', query = '', busy = false, busyLabel = '', cancelling = false;
let notice = '', noticeKind: 'info' | 'success' | 'error' = 'info';
let connectionEdited=false;
let host = api.demo ? '192.168.1.50' : '', port = '5555', adbPath = '';
let selected = new Set<string>();
let apkPaths: string[] = [], selectedApks = new Set<string>();
let toolsInfo: PlatformToolsInfo | null = null, toolsInfoError = '', toolsPreparing = false, downloadingTools = false;
let toolsProgress: DownloadProgress | null = null;
let launcherLayout: LauncherLayoutInfo | null = null;
let covers:Record<string,string> = {}, launcherApks:{path:string;cover?:string|null;homeBackground?:string|null}[]=[];
let layoutNode:string|null=null;
const homeBackgrounds=new Map<string,string>();
let layoutSelected=0, layoutDrag:number|null=null;
let layoutModalTarget='';
let layoutDirty = true;
let layoutComponent = '', layoutTarget = '', layoutSection: 'home' | 'apps' = 'home', layoutJson = '', layoutApp = '';
function launcherTarget(serial = snapshot.device?.serial, userId = snapshot.device?.userId, component = snapshot.defaultHome): string { return `${serial || ''}/${userId ?? ''}/${component || ''}`; }
function layoutAvailable(): boolean { return !!launcherLayout?.supported && layoutTarget === launcherTarget(); }
function draftLayout(): LauncherLayout | null {
  try {
    if(new TextEncoder().encode(layoutJson).length>48*1024)return null;
    const value = JSON.parse(layoutJson);
    if (!value || typeof value !== 'object' || ![2,3].includes(value.version) || Object.keys(value).some(key=>!['version','home','apps'].includes(key))) return null;
    for (const [section,max] of [['home',24],['apps',100]] as const) {
      const part=value[section];
      if(!part || Object.keys(part).some(key=>!['columns','items','scene'].includes(key)) || !Number.isInteger(part.columns) || part.columns<1 || part.columns>6) return null;
      if(value.version===3 && !validScene(part.scene,section))return null;
      if(value.version===2 && part.scene!==undefined)return null;
      const entries=part.items; if(!Array.isArray(entries) || entries.length>max) return null;
      const seen=new Set<string>();
      for (const entry of entries) {
        if(!entry || typeof entry!=='object' || Array.isArray(entry) || Object.keys(entry).some(key=>!['action','packageName','label','icon','color','frame','visible','zIndex'].includes(key))) return null;
        if(!validGeometry(entry))return null;
        const action=entry.action ?? 'app';if(!['app','music','bilibili','files','apps','shortvideo','webtv','placeholder'].includes(action))return null;
        if(action==='app' && (typeof entry.packageName!=='string' || !/^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+$/.test(entry.packageName)))return null;
        if(action!=='app' && entry.packageName!==undefined)return null;
        const key=action==='app'?entry.packageName:action;if(action!=='placeholder' && seen.has(key))return null;seen.add(key);
        if(entry.label!==undefined && (typeof entry.label!=='string' || entry.label.length>100))return null;
        if(entry.icon!==undefined && !['app','music','video','files','apps','picture','settings','input'].includes(entry.icon))return null;
        if(entry.color!==undefined && (typeof entry.color!=='string' || !/^#[0-9a-fA-F]{6}$/.test(entry.color)))return null;
      }
    }
    return value as LauncherLayout;
  } catch { return null; }
}
function acceptLauncherBackgrounds(value:LauncherLayoutInfo):void {
 if(!value.backgrounds || value.serial!==snapshot.device?.serial || value.userId!==snapshot.device?.userId)return;
 for(const launcher of snapshot.launchers){const key=launcherTarget(value.serial,value.userId,launcher.component),image=value.backgrounds[launcher.component];if(image)homeBackgrounds.set(key,image);else homeBackgrounds.delete(key);}
}
function acceptLauncherResult(value: LauncherLayoutInfo): void {
  launcherLayout = value; layoutComponent = value.component || snapshot.defaultHome || ''; layoutTarget = launcherTarget(value.serial ?? snapshot.device?.serial,value.userId ?? snapshot.device?.userId,layoutComponent);
  if (value.layout) {
    layoutJson = JSON.stringify(value.layout, null, 2);
    const key=launcherTarget(value.serial ?? snapshot.device?.serial,value.userId ?? snapshot.device?.userId,value.component || snapshot.defaultHome);
    const layout=value.layout;const image=layout.version===4?layout.home.background.image:layout.version===3?layout.home.scene?.background.image:undefined;
    if(image)homeBackgrounds.set(key,image);else homeBackgrounds.delete(key);
  }
}
const root = document.querySelector<HTMLDivElement>('#app')!;
const dialog = document.createElement('dialog');
dialog.className = 'modal'; document.body.append(dialog);
const layoutDialog=document.createElement('dialog');layoutDialog.className='layout-modal';layoutDialog.setAttribute('aria-label',t('调整启动器布局'));document.body.append(layoutDialog);
function unifiedDraft():import('./types').UnifiedLayout|null {try{const value=JSON.parse(layoutJson);return validUnified(value)?value:null;}catch{return null;}}
function forwardLayoutAction(action:string):void {const button=document.createElement('button');button.dataset.act=action;void doAction(button).catch(error=>showNotice(error instanceof Error?error.message:String(error),'error'));}
const unifiedEditor=new UnifiedEditor(layoutDialog,{json:()=>layoutJson,baseline:()=>launcherLayout?.layout,write:text=>{layoutJson=text;notice='';},render:()=>render(),busy:()=>busy,apps:()=>layoutApps(),notice:text=>showNotice(text,'error'),close:()=>{if(!busy)layoutDialog.close();},apply:()=>forwardLayoutAction('apply-layout'),reset:()=>forwardLayoutAction('reset-layout'),import:()=>forwardLayoutAction('import-layout')});

layoutDialog.addEventListener('close',()=>{if(launcherLayout?.layout)layoutJson=JSON.stringify(launcherLayout.layout,null,2);});
layoutDialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const disabled = (value: boolean): string => value ? ' disabled' : '';
const online = (): boolean => snapshot.device?.status === 'device';
const available = (): boolean => (api.desktop || api.demo) && snapshot.adbAvailable;
const fileName = (path: string): string => path.split(/[\\/]/).pop() || path;
function icon(name: string): string {
  const paths: Record<string, string> = {
    monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    music: '<path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/>',
    video: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 8 6 4-6 4Z"/>',
    files: '<path d="M3 7h7l2-3h9v16H3Z"/>',
    picture: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m4 18 5-5 4 4 3-7 5 8"/>',
    input: '<path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    home: '<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    list: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
    refresh: '<path d="M20 7a9 9 0 0 0-15-2L2 8m0-6v6h6M4 17a9 9 0 0 0 15 2l3-3m0 6v-6h-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="m10 13 4-4m-6 8-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2-1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 -1)"/>',
    settings: '<path d="m10 3-1 3-3 1-3-1-1 3 2 2v3l-2 2 2 3 3-1 3 1 1 3h3l1-3 3-1 3 1 1-3-2-2v-3l2-2-2-3-3 1-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    box: '<path d="m3 7 9-4 9 4v10l-9 4-9-4Zm0 0 9 4 9-4M12 11v10"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  };
  return `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.box}</svg>`;
}
function actionButton(act: string, label: string, options = '', cls = ''): string { return `<button type="button" data-act="${act}" class="${cls}"${options}>${label}</button>`; }
function deviceStatus(): [string, string] {
  if (!snapshot.device) return [t('未连接电视'), 'muted'];
  if (online()) return [snapshot.device.model || snapshot.device.serial, 'good'];
  return [snapshot.device.status === 'unauthorized' ? t('等待电视授权') : t('设备离线'), 'warn'];
}
function showNotice(message: string, kind: typeof noticeKind = 'info'): void { notice = message; noticeKind = kind; render(); }
const bytes = (value: number): string => `${(Math.max(0, value) / 1048576).toFixed(1)} MiB`;
const platformName = (value: string): string => ({ windows: 'Windows', macos: 'macOS', linux: 'Linux', demo: t('演示电脑') }[value] || t('当前电脑'));
function progressText(progress = toolsProgress): string {
  if (!progress) return t('准备官方 Platform Tools…');
  const labels = { downloading: t('正在下载'), verifying: t('校验下载文件'), extracting: t('解压工具'), checking: t('检查 ADB 并配置路径') };
  if (progress.stage !== 'downloading') return labels[progress.stage];
  const total = progress.total, downloaded = Math.min(Math.max(0, progress.downloaded), total);
  return total > 0 ? `${labels.downloading} ${Math.floor(downloaded / total * 100)}% · ${bytes(downloaded)} / ${bytes(total)}` : labels.downloading;
}
function busyIndicator(): string {
  if (!busy) return '';
  const external = !!agentOperation?.running;
  const download = external ? agentOperation?.tool === 'install_platform_tools' : downloadingTools;
  const progress = external ? agentProgress : toolsProgress;
  const label = download ? progressText(progress) : external ? ui`Agent 正在执行 ${agentOperation?.tool}…` : busyLabel;
  const cancellingLabel = download ? t(' · 正在取消并清理临时文件') : t(' · 当前修改会完成并复查，后续项将停止');
  return `<div class="busy-bar" role="status"><span class="spinner"></span><span data-busy-label>${esc(label)}${cancelling ? cancellingLabel : ''}</span>${download ? downloadMeter(progress) : ''}${actionButton('cancel', cancelling ? t('正在取消') : download ? t('取消下载') : t('停止后续操作'), disabled(cancelling), 'small')}</div>`;
}
function downloadMeter(progress = toolsProgress): string {
  if (!progress || progress.stage !== 'downloading' || progress.total <= 0) return '';
  const value = Math.min(Math.max(0, progress.downloaded), progress.total);
  return ui`<progress class="download-meter" max="${progress.total}" value="${value}" aria-label="Platform Tools 下载进度"></progress>`;
}
function mcpPanel(): string {
  if (!api.desktop || api.demo) return '';
  return ui`<section class="panel mcp-panel"><h2>MCP · Agent 调试</h2><p>Agent 可操作当前窗口的全部电视管理功能，状态和结果同步显示。</p>${mcpInfo ? ui`<p class="hint">保持管理器打开，将以下配置加入 Agent 的 MCP 设置：</p><pre class="mcp-config" tabindex="0">${esc(JSON.stringify(mcpInfo.config, null, 2))}</pre><p class="hint">仅本机连接；关闭管理器后停止服务。操作沿用设备保护规则，批量结果请查看操作记录。</p>` : `<p class="hint">${esc(mcpError || t('正在读取 MCP 配置…'))}</p>`}</section>`;
}
function adbPanel(): string {
  const unavailable = busy || toolsPreparing || (!api.desktop && !api.demo), connected = !!snapshot.device;
  const installLabel = snapshot.adbAvailable ? t('ADB 已就绪') : toolsPreparing ? t('读取工具信息…') : t('下载 ADB 工具');
  const detail = snapshot.adbAvailable ? t('当前 ADB 已可用，无需重复下载。') : toolsInfo ? toolsInfo.supported ? `Platform Tools ${toolsInfo.version} · ${platformName(toolsInfo.platform)} · ${toolsInfo.installed ? t('已下载，优先使用本地工具') : ui`下载 ${bytes(toolsInfo.downloadBytes)}`}` : toolsInfo.message : toolsInfoError || t('从 Google 官方下载，完成后自动配置。');
  return ui`<section class="panel adb-panel"><div class="panel-heading">${icon('settings')}<div><h2>ADB 工具</h2><p>${snapshot.adbAvailable ? t('已找到本地工具，可直接连接电视') : t('连接电视前，先准备 ADB 工具')}</p></div></div><div class="adb-download"><div class="button-row">${actionButton('download-adb', icon(snapshot.adbAvailable ? 'check' : 'download') + installLabel, disabled(snapshot.adbAvailable || unavailable || connected || toolsInfo?.supported === false), snapshot.adbAvailable ? 'adb-ready' : 'primary')}${actionButton('redownload-adb',icon('refresh')+t('重新下载'),disabled(unavailable || connected || toolsInfo?.supported === false))}</div><p class="hint">${esc(message(detail))}</p>${connected ? t('<p class="hint">请先断开电视，再更换或配置 ADB。</p>') : ''}${api.demo ? t('<p class="hint">演示模式仅模拟进度，不会下载文件。</p>') : ''}</div><label class="field-label">已有 ADB 路径<input name="adbPath" placeholder="自动查找，或选择 adb / adb.exe" value="${esc(adbPath || snapshot.adbPath || '')}"${disabled(unavailable || connected)}></label><div class="button-row">${actionButton('choose-adb', t('选择 ADB'), disabled(unavailable || connected))}${actionButton('save-adb', t('应用路径'), disabled(unavailable || connected))}${actionButton('auto-adb', t('自动查找'), disabled(unavailable || connected), 'text-button')}</div>${actionButton('platform-tools', t('手动下载官方工具 ↗'), '', 'text-button link-button')}<p class="hint">也可选择已解压的 adb.exe（Windows）或 adb（macOS / Linux）。</p></section>`;
}
function shell(): string {
  const [label, status] = deviceStatus();
  return ui`<aside class="sidebar"><nav aria-label="主要页面">${(Object.entries(pages) as [Page, [string, string, string]][]).filter(([key])=>key!=='install').map(([key, data]) => `<button class="nav-item ${page === key || page==='install' && key==='apps' ? 'active' : ''}" data-page="${key}" ${page === key || page==='install' && key==='apps' ? 'aria-current="page"' : ''}>${icon(data[2])}<span>${t(data[0])}</span></button>`).join('')}</nav><section class="appearance-panel" aria-label="语言与外观"><label>语言<select name="locale" aria-label="界面语言">${localeOptions()}</select></label><label>主题<select name="theme" aria-label="界面主题">${themeOptions()}</select></label></section><a class="brand" href="#" aria-label="pureTV 电视管理器"><img src="/puretv-logo.png" alt="" width="42" height="42">pure<span>TV</span></a><p class="brand-caption">电视管理器<span class="app-version">v${esc(appVersion)}</span></p></aside><main class="${page === 'connect' ? '' : 'list-page'}"><header class="page-header"><div><h1>${t(pages[page][0])}</h1><p>${t(pages[page][1])}</p></div><div class="header-actions"><span class="device-badge"><i class="dot ${status}"></i>${online() ? t('已连接 · ') : ''}${esc(label)}</span></div></header>${api.demo ? t('<div class="banner demo-banner">演示模式 · 示例设备和应用，所有操作仅用于预览，不会连接真实电视。</div>') : !api.desktop ? t('<div class="banner warning-banner">这是浏览器预览。请运行桌面应用来连接电视和安装 APK。</div>') : ''}${notice ? ui`<div class="banner notice ${noticeKind}" role="status"><span>${esc(message(notice))}</span><button class="icon-button" aria-label="关闭提示" data-act="dismiss">${icon('close')}</button></div>` : ''}${busyIndicator()}<section id="page-content">${content()}</section><footer class="app-footer"><span>pureTV 电视管理器</span><span>${api.demo ? t('演示数据 · 不执行 ADB') : snapshot.device ? (page === 'connect' ? ui`目标 ${esc(snapshot.device.serial)} · 用户 ${snapshot.device.userId}` : ui`当前 Android 用户 ${snapshot.device.userId}`) : t('选择设备后开始管理')}</span></footer></main>`;
}
function syncSceneScale():void {const canvas=layoutDialog.querySelector<HTMLElement>('.scene-canvas');if(canvas)canvas.style.setProperty('--scene-unit',`${canvas.clientWidth/960}px`);}
function scrollAreas():HTMLElement[]{return [...root.querySelectorAll<HTMLElement>('[data-scroll]'),...layoutDialog.querySelectorAll<HTMLElement>('[data-scroll]')];}
const scrollPositions = new Map<string, { top: number; left: number }>();
function render(): void {
  for (const area of scrollAreas()) scrollPositions.set(area.dataset.scroll!, { top: area.scrollTop, left: area.scrollLeft });
  root.innerHTML = shell(); updateSelectAll();layoutDialog.setAttribute('aria-label',t('调整启动器布局'));
  if(layoutDialog.open) {if(layoutModalTarget!==launcherTarget() || !layoutAvailable())layoutDialog.close();else {layoutDialog.innerHTML=layoutEditor();syncSceneScale();}}
  for (const area of scrollAreas()) {
    const position = scrollPositions.get(area.dataset.scroll!); if (position) { area.scrollTop = position.top; area.scrollLeft = position.left; }
  }
}
function content(): string {
  switch (page) {
    case 'connect': return connectionPage() + mcpPanel();
    case 'apps': return appTabs() + appsPage();
    case 'launchers': return launchersPage();
    case 'install': return appTabs() + installPage();
    case 'history': return historyPage();
  }
}
function appTabs(): string {
  return ui`<div class="application-tabs" aria-label="应用管理视图">${actionButton('go-apps',ui`已安装应用 · ${snapshot.packages.filter(app=>app.installed).length}`,'',page==='apps'?'primary':'')}${actionButton('go-install',ui`待安装应用 · ${apkPaths.length}`,'',page==='install'?'primary':'')}</div>`;
}
function storageBytes(value: number | null | undefined): string {
  if (value == null) return t('未知'); const units=['B','KiB','MiB','GiB','TiB']; let unit=0;
  while(value>=1024 && unit<units.length-1){value/=1024;unit++;}return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}
function deviceInfoPanel(): string {
  if (!snapshot.device) return '';
  const info=snapshot.systemInfo;
  const rows: [string,unknown][]=[[t('设备'),snapshot.device.model],['Android',snapshot.device.androidVersion],[t('制造商 / 品牌'),info ? [info.manufacturer,info.brand].filter(Boolean).join(' / ') : null],[t('SDK / 安全补丁'),info ? [info.sdkVersion,info.securityPatch].filter(Boolean).join(' / ') : null],[t('CPU / 架构'),info ? [info.cpu,info.cpuAbi].filter(Boolean).join(' / ') : null],[t('内存（可用 / 总量）'),`${storageBytes(info?.memoryAvailableBytes)} / ${storageBytes(info?.memoryTotalBytes)}`],[t('数据分区 /data（可用 / 总量）'),`${storageBytes(info?.storageAvailableBytes)} / ${storageBytes(info?.storageTotalBytes)}`],[t('画面分辨率'),info?.displayResolution],[t('已运行'),info?.uptimeSeconds == null ? null : ui`${Math.floor(info.uptimeSeconds/3600)} 小时 ${Math.floor(info.uptimeSeconds/60)%60} 分钟`]];
  return ui`<section class="panel device-info"><div class="section-title"><h2>电视系统信息</h2><div class="button-row">${actionButton('refresh-system',t('刷新信息'),disabled(busy || !online()))}</div></div><dl>${rows.map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(value || t('未知'))}</dd></div>`).join('')}</dl><p class="hint">内存与 /data 磁盘容量来自设备实际查询；固件限制时显示未知。${info?.queriedAt ? ui` 最近查询：${esc(new Date(info.queriedAt*1000).toLocaleTimeString(locale()))}` : ''}</p></section>`;
}
function connectionStrip(): string {
  if (page !== 'connect') return '';
  const [label, status] = deviceStatus();
  return ui`<div class="connection-strip"><label>电视 IP<input name="host" autocomplete="off" placeholder="192.168.1.50" value="${esc(host)}"${disabled(busy)}></label><label class="port-field">端口<input name="port" inputmode="numeric" maxlength="5" value="${esc(port)}"${disabled(busy)}></label>${actionButton('connect', icon('link') + (snapshot.device ? t('重新连接') : t('连接电视')), disabled(busy || !available()))}<span class="connection-status"><i class="dot ${status}"></i>${online() ? ui`已连接 · Android ${esc(snapshot.device?.androidVersion)}` : esc(label)}</span>${snapshot.device ? actionButton('disconnect', t('断开'), disabled(busy), 'text-button') : t('<span class="strip-hint">首次连接请在电视上允许调试</span>')}</div>`;
}
function localNetworkPanel():string {
  const info=snapshot.localNetwork;
  const availableHere=api.desktop || api.demo;
  return ui`<section class="panel local-network-panel"><div class="section-title"><div><h2>当前电脑的局域网 IP</h2><p>电视与电脑需要位于可互通的网络</p></div>${actionButton('refresh-local-network',t('刷新本机 IP'),disabled(busy || !availableHere))}</div>${info?.addresses.length?`<ul class="local-network-addresses">${info.addresses.map(address=>`<li><code>${esc(address.ip)}/${address.prefixLength}</code><span>${esc(address.interfaceName)}</span></li>`).join('')}</ul>`:`<p class="hint">${esc(!availableHere?t('本机地址仅在桌面管理器中显示'):info?.error?message(info.error):info?t('未检测到可用的局域网 IPv4 地址'):t('正在读取本机网络地址…'))}</p>`}</section>`;
}
function connectionPage(): string {
  return ui`${connectionStrip()}${deviceInfoPanel()}${localNetworkPanel()}<div class="two-columns"><section class="panel"><div class="panel-heading">${icon('monitor')}<div><h2>连接你的电视</h2><p>电视与电脑连接同一网络</p></div></div><ol class="steps"><li><span>1</span><div><strong>开启电视开发者选项</strong><p>在系统设置中找到“关于”，连续点击版本号，再开启 USB 或网络调试。</p></div></li><li><span>2</span><div><strong>输入电视 IP 和调试端口</strong><p>常见端口为 5555；如果电视显示其他端口，以电视上的值为准。</p></div></li><li><span>3</span><div><strong>在电视上允许连接</strong><p>确认电脑的调试授权。连接成功后会扫描当前用户的应用。</p></div></li></ol>${snapshot.device ? ui`<div class="device-summary"><span>设备</span><strong>${esc(snapshot.device.model || snapshot.device.serial)}</strong><span>地址</span><code>${esc(snapshot.device.serial)}</code><span>当前用户</span><strong>${snapshot.device.userId}</strong><span>状态</span><strong>${esc(deviceStatus()[0])}</strong></div>` : ''}</section><div class="stack">${adbPanel()}</div></div>`;
}
const filters: [Filter, string][] = [['all', '全部'], ['system', '系统应用'], ['user', '用户应用'], ['disabled', '已停用'], ['recoverable', '可恢复']];
function inFilter(p: PackageInfo, f: Filter): boolean { return f === 'recoverable' ? !p.installed : p.installed && (f === 'all' || f === 'system' && p.system || f === 'user' && !p.system || f === 'disabled' && !p.enabled); }
function visiblePackages(): PackageInfo[] { const needle = query.trim().toLocaleLowerCase(); return snapshot.packages.filter(p => inFilter(p, filter) && (!needle || `${p.label} ${p.packageName}`.toLocaleLowerCase().includes(needle))); }
function selectedPackages(): PackageInfo[] { return snapshot.packages.filter(p => selected.has(p.packageName)); }
function appIcon(p: PackageInfo): string {
  let color = 'slate', text = (p.label || p.packageName).slice(0, 1).toUpperCase();
  if (p.packageName === 'com.ecojust.puretv') { color = 'green'; text = 'P'; }
  else if (p.packageName === 'com.ecojust.music') { color = 'rose'; text = '♪'; }
  else if (p.packageName === 'com.ecojust.webtv') { color = 'blue'; text = '▶'; }
  else if (p.packageName === 'com.ecojust.shortvideo') { color = 'charcoal'; text = '▶'; }
  else if (p.system) color = 'violet';
  return `<span class="app-icon ${color}" aria-hidden="true">${p.protectedReason ? icon('shield') : esc(text)}</span>`;
}
function packageSize(p: PackageInfo): string {
  if (!p.installed) return '—';
  if (p.apkSizeBytes == null) return t('未能读取');
  const units = ['B', 'KiB', 'MiB', 'GiB']; let value = p.apkSizeBytes, unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}
function appRows(): string {
  const list = visiblePackages();
  if (!list.length) return `<tr><td colspan="6"><div class="empty-state">${icon(snapshot.device ? 'search' : 'monitor')}<h3>${!online() ? t('先连接一台电视') : query ? t('没有匹配的应用') : filter === 'recoverable' ? t('暂无可恢复的应用') : t('暂无应用')}</h3><p>${!online() ? t('连接并授权后，即可扫描电视当前用户的应用。') : query ? t('试试其他应用名或包名。') : t('重新扫描可获取设备上的最新状态。')}</p>${!online() ? actionButton('go-connect', t('前往连接'), '', 'primary') : ''}</div></td></tr>`;
  return list.map(p => ui`<tr data-package="${esc(p.packageName)}" class="${selected.has(p.packageName) ? 'selected' : ''}"><td class="check-cell"><input type="checkbox" data-select-package="${esc(p.packageName)}" aria-label="选择 ${esc(p.label)}"${selected.has(p.packageName) ? ' checked' : ''}${disabled(busy || !online() || !!p.protectedReason)}></td><td><div class="app-identity">${appIcon(p)}<div><strong>${esc(p.label || p.packageName)}</strong><code>${esc(p.packageName)}</code></div></div></td><td><span class="type-text">${p.system ? t('系统应用') : t('用户应用')}</span></td><td><span class="status"><i class="dot ${p.protectedReason ? 'muted' : !p.installed || !p.enabled ? 'muted' : 'good'}"></i>${p.protectedReason ? t('受保护') : !p.installed ? t('可恢复') : p.enabled ? t('正常') : t('已停用')}</span></td><td class="size-cell" title="主 APK 与分包 APK 合计，不含私有数据和缓存">${packageSize(p)}</td><td class="row-actions">${actionButton('details', t('详情'), ` data-pkg="${esc(p.packageName)}"`, 'small')}${!p.protectedReason && (!p.installed || !p.enabled) ? actionButton(p.installed ? 'enable-one' : 'restore-one', p.installed ? t('启用') : t('恢复'), ` data-pkg="${esc(p.packageName)}"${disabled(busy || !online())}`, 'small text-button') : ''}</td></tr>`).join('');
}
function selectionBar(): string {
  const items = selectedPackages(), ready = !busy && online() && items.length > 0 && !items.some(p => p.protectedReason);
  return ui`<div class="bulk-bar"><strong>已选择 ${items.length} 项</strong>${actionButton('clear-selection', t('取消选择'), disabled(!items.length || busy))}${actionButton('disable', t('停用'), disabled(!ready || items.some(p => !p.installed || !p.enabled)), 'primary')}${actionButton('enable', t('启用'), disabled(!ready || items.some(p => !p.installed || p.enabled)))}${actionButton('uninstall', t('为当前用户卸载'), disabled(!ready || items.some(p => !p.installed)), 'danger-outline')}${actionButton('restore', t('恢复安装'), disabled(!ready || items.some(p => p.installed)))}<p>操作前会列出所选应用；已完成的操作可在记录中查看。</p></div>`;
}
function appsPage(): string {
  return ui`${connectionStrip()}<section class="panel app-panel"><div class="apps-toolbar"><label class="search">${icon('search')}<input name="search" aria-label="搜索应用名称或包名" value="${esc(query)}" placeholder="搜索应用名称或包名"></label><div class="toolbar-buttons">${actionButton('scan', icon('refresh') + t('重新扫描'), disabled(busy || !online()))}${actionButton('go-install', icon('plus') + t('添加安装包'), disabled(busy), 'primary')}</div></div><div class="filter-tabs" aria-label="应用分类">${filters.map(([f, label]) => `<button data-filter="${f}" class="${filter === f ? 'active' : ''}" aria-pressed="${filter === f}">${t(label)}<span>${snapshot.packages.filter(p => inFilter(p, f)).length}</span></button>`).join('')}</div><div id="selection-bar">${selectionBar()}</div><div class="table-scroll" data-scroll="apps" tabindex="0" aria-label="应用列表"><table class="apps-table"><thead><tr><th class="check-cell"><input type="checkbox" data-select-all aria-label="选择当前列表中可操作的应用"${disabled(busy || !online() || !visiblePackages().some(p => !p.protectedReason))}></th><th>应用</th><th>类型</th><th>状态</th><th title="主 APK 与分包 APK 合计，不含私有数据和缓存">安装包大小</th><th>操作</th></tr></thead><tbody id="app-rows">${appRows()}</tbody></table></div><div id="list-count" class="list-count">显示 ${visiblePackages().length} / ${snapshot.packages.filter(p => inFilter(p, filter)).length} 个应用</div></section><p class="hint">名称无法读取时显示完整包名。系统应用“卸载”仅针对当前用户，不会删除系统分区中的安装包。</p>`;
}
function layoutApps() {
  return (launcherLayout?.apps || []).filter(app=>snapshot.packages.some(p=>p.packageName===app.packageName && p.installed && !p.system && p.enabled));
}
function layoutTargetInfo(entry:import('./types').LayoutEntry):string {
 const appName=(pkg:string,fallback:string)=>launcherLayout?.apps?.find(app=>app.packageName===pkg)?.label || snapshot.packages.find(app=>app.packageName===pkg)?.label || fallback;
 let name='',target=entry.packageName || `action:${entry.action}`,detail='';
 if(entry.packageName){name=appName(entry.packageName,entry.packageName);detail=t('按应用包名打开；显示名称和图标不会改变打开目标。');}
 else switch(entry.action){
  case 'music':name=appName('com.ecojust.music','Music TV');target='com.ecojust.music → https://somafm.com/player/';detail=t('内置音乐入口：优先打开 Music TV，不可用时打开音乐网站。');break;
  case 'shortvideo':name=appName('com.ecojust.shortvideo','ShortVideo TV');target='com.ecojust.shortvideo';detail=t('打开短视频应用。');break;
  case 'webtv':name=appName('com.ecojust.webtv','WebTV');target='com.ecojust.webtv';detail=t('打开电视直播应用。');break;
  case 'bilibili':name=t('哔哩哔哩');target='com.xiaodianshi.tv.yst → tv.danmaku.bili → tv.danmaku.bilibilihd';detail=t('内置入口：依次尝试可启动的哔哩哔哩应用。');break;
  case 'files':name=t('文件管理器');detail=t('内置入口：使用可用的文件管理器，或打开系统文件选择器。');break;
  case 'apps':name=t('应用商店');target='action:apps → https://www.dangbei.com/';detail=t('内置入口：使用可用的应用商店，或打开当贝网站。');break;
  default:name=t('未配置功能');detail=t('这是占位卡片，尚未配置打开的应用。');break;
 }
 return ui`<div class="layout-target-info"><span>实际打开目标</span><strong>${esc(name)}</strong><code>${esc(target)}</code><p class="hint">${esc(detail)}</p></div>`;
}
function layoutEditor(): string {
  const unified=unifiedDraft();if(unified)return unifiedEditor.render(unified);
  const draft=draftLayout(), entries=draft?.[layoutSection].items || [], options=layoutApps();
  const selected=entries[layoutSelected];
  const markup=ui`<header class="layout-modal-heading"><div><h2>调整布局</h2><p>拖动卡片调整顺序；home 和 apps 分别保存列数。应用后同步到电视。</p></div>${actionButton('close-layout',t('关闭'),disabled(busy))}</header>${noticeKind==='error' && notice?`<div class="banner notice error" role="status">${esc(message(notice))}</div>`:''}<div class="layout-modal-toolbar"><div class="button-row">${actionButton('layout-home',t('Home · 首页'),disabled(busy),layoutSection==='home'?'primary':'')}${actionButton('layout-apps',t('Apps · 其他应用'),disabled(busy),layoutSection==='apps'?'primary':'')}</div><label>每行列数 <input name="layoutColumns" type="number" min="1" max="6" value="${draft?.[layoutSection].columns || 4}"${disabled(busy)}></label><div class="button-row">${actionButton('import-layout',t('导入 layout.json'),disabled(busy))}${actionButton('reset-layout',t('恢复默认'),disabled(busy))}</div></div><div class="layout-workspace"><div class="tv-canvas-scroll" data-scroll="layout-canvas"><div class="tv-canvas ${layoutSection}" role="group" aria-label="电视布局画布"><div class="tv-canvas-header"><strong>pureTV</strong><span>${layoutSection==='home'?t('Home 首页'):t('Apps 其他应用')}</span><span>12:00</span></div><div class="tv-canvas-grid" style="--columns:${draft?.[layoutSection].columns || 4}">${entries.map((entry,i)=>{
    const app=options.find(app=>app.packageName===entry.packageName), image=app?.iconPng;
    return ui`<button type="button" draggable="${!busy}" data-layout-tile="${i}" class="tv-tile ${i===layoutSelected?'selected':''}" aria-label="选择卡片 ${i+1}" aria-pressed="${i===layoutSelected}" style="background:${esc(entry.color || '#374959')}"${disabled(busy)}>${image && (!entry.icon || entry.icon==='app')?`<img src="data:image/png;base64,${esc(image)}" alt="">`:icon(entry.icon==='app' || entry.icon==='apps' || entry.action==='apps'?'grid':entry.icon || entry.action || 'grid')}<strong>${esc(entry.label || app?.label || entry.packageName || (entry.action==='placeholder'?ui`应用 ${i+1}`:({music:t('音乐'),bilibili:t('哔哩哔哩'),files:t('文件'),apps:t('应用'),shortvideo:t('短视频'),webtv:t('电视直播')}[entry.action || ''] || t('入口'))))}</strong><small>${i+1}</small></button>`;
  }).join('') || t('<div class="canvas-empty">从右侧添加已安装用户应用</div>')}</div><div class="tv-canvas-footer">${layoutSection==='home'?t('首页 · 全部应用 ↓'):t('其他应用 · 返回首页 ↑')}</div></div></div><aside class="layout-inspector" data-scroll="layout-inspector"><h3>卡片属性</h3>${selected?ui`${layoutTargetInfo(selected)}<label>打开的应用<select data-layout-target="${layoutSelected}" aria-label="卡片打开的应用"${disabled(busy)}>${selected.action && selected.action!=='app'?`<option value="__builtin__" selected>${t('保留当前内置功能')}</option>`:!options.some(app=>app.packageName===selected.packageName)?`<option value="${esc(selected.packageName || '')}" selected disabled>${esc(selected.packageName || t('当前应用不可用'))}</option>`:''}${options.map(app=>`<option value="${esc(app.packageName)}"${selected.packageName===app.packageName?' selected':''}${disabled(entries.some((entry,index)=>index!==layoutSelected && entry.packageName===app.packageName))}>${esc(app.label)} · ${esc(app.packageName)}</option>`).join('')}</select></label><label>显示名称<input data-layout-label="${layoutSelected}" aria-label="卡片显示名称" value="${esc(selected.label || '')}" maxlength="100"${disabled(busy)}></label><label>图标<select data-layout-icon="${layoutSelected}" aria-label="卡片图标"${disabled(busy)}>${['app','music','video','files','apps','picture','settings','input'].map(name=>`<option value="${name}"${(selected.icon || 'app')===name?' selected':''}>${esc({app:t('应用原图标'),music:t('音乐'),video:t('视频'),files:t('文件'),apps:t('应用'),picture:t('图片'),settings:t('设置'),input:t('输入')}[name])}</option>`).join('')}</select></label><label>颜色<input type="color" data-layout-color="${layoutSelected}" aria-label="卡片颜色" value="${esc(selected.color || '#374959')}"${disabled(busy)}></label><div class="button-row">${actionButton('layout-up',t('前移'),` data-index="${layoutSelected}"${disabled(busy || layoutSelected===0)}`)}${actionButton('layout-down',t('后移'),` data-index="${layoutSelected}"${disabled(busy || layoutSelected===entries.length-1)}`)}${actionButton('layout-remove',t('移除'),` data-index="${layoutSelected}"${disabled(busy)}`)}</div>`:t('<p class="hint">点击画布中的卡片编辑。</p>')}<h3>添加用户应用</h3><p class="hint">仅显示当前用户已安装、可启动的非系统应用。</p><select name="layoutApp" aria-label="选择已安装用户应用"${disabled(busy || !options.length)}><option value="">选择用户应用…</option>${options.map(app=>`<option value="${esc(app.packageName)}"${layoutApp===app.packageName?' selected':''}>${esc(app.label)} · ${esc(app.packageName)}</option>`).join('')}</select>${actionButton('layout-add',t('添加到当前页面'),disabled(busy || !layoutApp || !draft || entries.length>=(layoutSection==='home'?24:100) || entries.some(entry=>entry.packageName===layoutApp)))}<details class="layout-json"><summary>layout.json</summary><textarea name="layoutJson" aria-label="layout.json 配置" spellcheck="false"${disabled(busy)}>${esc(layoutJson)}</textarea>${actionButton('parse-layout',t('解析配置'),disabled(busy))}</details></aside></div><footer class="layout-modal-actions"><span>${entries.length} 张卡片 · 本地草稿</span><div class="button-row">${actionButton('close-layout',t('取消'),disabled(busy))}${actionButton('apply-layout',t('应用到电视'),disabled(busy || !draft),'primary')}</div></footer>`;
  return draft?.version===3?sceneEditor(markup,draft):markup;
}
function sceneEditor(markup:string,draft:LauncherLayout):string {
 const page=draft[layoutSection],scene=page.scene!;
 if(!sceneNode(draft,layoutSection,layoutNode,layoutSelected)){layoutNode="background";layoutSelected=-1;}
 const template=document.createElement('template');template.innerHTML=markup;
 const canvas=template.content.querySelector<HTMLElement>('.tv-canvas')!;
 const tiles=Array.from(canvas.querySelectorAll<HTMLElement>('.tv-tile'));
 canvas.classList.add('scene-canvas');canvas.replaceChildren();canvas.setAttribute('style','');
 const draw=(node:import('./types').LayoutGeometry,element:HTMLElement,frame:import('./types').LayoutFrame)=>{
  element.style.cssText+=frameStyle(frame)+`z-index:${node.zIndex ?? 1};`;element.classList.add('scene-element');
  if(node.visible===false)element.classList.add('scene-hidden');canvas.append(element);
 };
 const bg=document.createElement('button');bg.type='button';bg.className='scene-background';bg.dataset.sceneNode='background';bg.setAttribute('aria-label',t('背景'));
 bg.style.backgroundColor=scene.background.color;
 if(scene.background.image)bg.style.backgroundImage=`url(${JSON.stringify(scene.background.image)})`;
 draw(scene.background,bg,scene.background.frame!);
 const sample:Record<string,string>={clock:'12:00',date:t('星期一 · 10月24日'),weather:t('天气 · 由电视实时更新'),title:t('其他应用'),subtitle:t('已安装应用与常用入口')};
 for(const node of scene.elements){const el=document.createElement('button');el.type='button';el.dataset.sceneNode=node.id;el.className=`scene-control scene-${node.id}`;el.textContent=sample[node.id] || t(sceneLabels[node.id]);el.setAttribute('aria-label',t(sceneLabels[node.id]));if(layoutNode===node.id)el.classList.add('selected');draw(node,el,node.frame);}
 tiles.forEach((el,i)=>{const entry=page.items[i];el.draggable=false;el.style.setProperty('--tile-color',entry.color || '#374959');const frame=entry.frame || autoFrame(layoutSection,i,page.columns,page.items.length);el.style.setProperty('--tile-icon',`calc(${Math.min(38,frame.height*.3)} * var(--scene-unit))`);el.style.setProperty('--tile-font',`calc(${Math.min(14,frame.height*14/150)} * var(--scene-unit))`);draw(entry,el,frame);});
 const toolbar=template.content.querySelector('.layout-modal-heading p')!;toolbar.textContent=t('同一份 layout.json 驱动电视与画布；拖动元素或输入坐标调整位置。');
 const inspector=template.content.querySelector('.layout-inspector')!;
 const target=sceneNode(draft,layoutSection,layoutNode,layoutSelected);
 const frame=target?.frame || (!layoutNode && layoutSelected>=0?autoFrame(layoutSection,layoutSelected,page.columns,page.items.length):undefined);
 const geometry=document.createElement('section');geometry.className='scene-geometry';
 geometry.innerHTML=ui`<h3>元素位置</h3><p class="hint">960 × 540 设计坐标 · 等比缩放</p><label>页面元素<select name="sceneSelection" aria-label="选择页面元素"><option value="background"${layoutNode==='background'?' selected':''}>${t('背景')}</option>${scene.elements.map(n=>`<option value="${esc(n.id)}"${layoutNode===n.id?' selected':''}>${esc(t(sceneLabels[n.id]))}</option>`).join('')}${page.items.map((e,i)=>`<option value="tile:${i}"${layoutNode===null && layoutSelected===i?' selected':''}>${esc(e.label || e.packageName || e.action || t('应用'))}</option>`).join('')}</select></label>${target && frame?`<div class="scene-frame-fields">${(['x','y','width','height'] as const).map(key=>`<label>${esc(t({x:'横坐标',y:'纵坐标',width:'宽度',height:'高度'}[key]))}<input type="number" data-scene-frame="${key}" aria-label="${key}" value="${frame[key]}" step="1" min="${key==='width'||key==='height'?1:0}" max="${key==='x'||key==='width'?960:540}"${disabled(busy)}></label>`).join('')}</div><label>${t('图层')}<input type="number" data-scene-layer aria-label="${t('图层')}" min="0" max="20" value="${target.zIndex ?? 1}"${disabled(busy)}></label><label class="scene-visible"><input type="checkbox" data-scene-visible${target.visible!==false?' checked':''}${disabled(busy)}> ${t('显示元素')}</label>`:''}${layoutNode==='background'?`<label>${t('背景颜色')}<input type="color" data-scene-background value="${scene.background.color}"${disabled(busy)}></label><label>${t('背景图片')}<input type="file" data-scene-image accept="image/png,image/jpeg,image/webp"${disabled(busy)}></label><p class="hint">${t('图片将缩放压缩后嵌入 layout.json，不引用电脑路径。')}</p>${actionButton('scene-clear-image',t('移除背景图片'),disabled(busy || !scene.background.image))}`:layoutNode?`<p class="hint">${t('内置功能保持不变，仅调整位置、尺寸与显示状态。')}</p>`:''}`;
 if(layoutNode){while(inspector.firstElementChild && inspector.firstElementChild.textContent!==t('添加用户应用'))inspector.firstElementChild.remove();}
 inspector.prepend(geometry);
 return template.innerHTML;
}

async function launcherOperation(request: LauncherRequest, preserveDraft = false): Promise<void> {
  const savedDraft = preserveDraft && layoutAvailable() ? layoutJson : null;
  if (busy || !online()) return;
  localBusy = true; busy = true; cancelling = false; busyLabel = t('读取／应用当前启动器布局…'); notice = ''; render();
  try { const value = await api.launcherExecute(request); acceptLauncherResult(value); if(request.action==='getLayout'&&!value.supported){try{acceptLauncherBackgrounds(await api.launcherExecute({action:'getBackgrounds'}));}catch{/* Cover metadata is optional; never activate a launcher to read it. */}} if (savedDraft && layoutAvailable()) layoutJson = savedDraft; if(request.action==='getLayout')layoutDirty=false; try {applySnapshot(await api.execute({action:'getState'}));} catch { /* Another operation may have started; its event supplies the new state. */ } notice = value.message || (value.supported ? t('布局已读取，可调整后应用') : t('此启动器暂不可编辑')); noticeKind = 'info'; }
  catch (error) { notice = error instanceof Error ? error.message : String(error); noticeKind = 'error'; }
  finally { localBusy = false; busy = !!agentOperation?.running; cancelling = false; render(); }
}
function modifyLayout(change: (draft: LauncherLayout) => void): void {
  if (busy || !layoutAvailable()) return;
  const draft = draftLayout(); if (!draft) throw new Error(t('请先解析有效的 layout.json'));
  const previous=layoutJson; change(draft); layoutJson = JSON.stringify(draft, null, 2);
  if(!draftLayout()){layoutJson=previous;showNotice(t('布局未修改：请检查元素边界、应用数量、名称、图标与颜色。'),'error');return;}
  notice='';noticeKind='info';render();
}
function launcherCardBackground(component:string):string|undefined {return covers[component] || homeBackgrounds.get(launcherTarget(snapshot.device?.serial,snapshot.device?.userId,component));}
function launcherCardCover(image?:string|null):string {
  return image && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image)?`<img class="launcher-card-background" src="${esc(image)}" alt="">`:'';
}
function launchersPage(): string {
  return ui`<div class="section-title launcher-toolbar"><div><h2>电视启动器</h2><p>安装、激活启动器；当前桌面支持时可调整布局。</p></div><div class="button-row">${actionButton('scan',icon('refresh')+t('重新扫描'),disabled(busy || !online()))}${actionButton('add-launcher',icon('plus')+t('添加启动器 APK'),disabled(busy),'primary')}</div></div><div class="launcher-grid" data-scroll="launchers" tabindex="0" aria-label="启动器列表">${launcherApks.map(item=>ui`<article class="panel launcher-card pending-launcher ${item.cover||item.homeBackground?'has-background':''}" data-launcher-apk="${esc(item.path)}">${launcherCardCover(item.cover || item.homeBackground)}<div class="launcher-card-content"><span class="pill">待安装</span><h3>${esc(fileName(item.path))}</h3><code>${esc(item.path)}</code><p class="hint">同目录的 thumb.png 或 APK名.thumb.png 可作为背景。</p><div class="launcher-card-actions">${actionButton('install-launcher',t('安装启动器'),` data-path="${esc(item.path)}"${disabled(busy || !online())}`,'primary')}${actionButton('remove-launcher-apk',t('移除'),` data-path="${esc(item.path)}"${disabled(busy)}`)}</div></div></article>`).join('')}${snapshot.launchers.map(l=>ui`<article data-launcher-component="${esc(l.component)}" class="panel launcher-card ${l.isDefault?'current':''} ${launcherCardBackground(l.component)?'has-background':''}">${launcherCardCover(launcherCardBackground(l.component))}<div class="launcher-card-content"><div class="launcher-top"><span class="large-icon">${icon('home')}</span>${l.isDefault?t('<span class="pill">当前默认桌面</span>'):''}</div><h3>${esc(l.label || l.packageName)}</h3><code>${esc(l.component)}</code><p class="launcher-size">安装包大小：${l.apkSizeBytes!=null?storageBytes(l.apkSizeBytes):packageSize(snapshot.packages.find(p=>p.packageName===l.packageName) || {packageName:l.packageName,label:l.label,installed:true,system:false,enabled:true,protectedReason:null})}</p><div class="launcher-card-actions">${actionButton('set-home',l.isDefault?t('正在使用'):t('设为默认桌面'),` data-component="${esc(l.component)}"${disabled(busy || !online() || l.isDefault)}`,l.isDefault?'':'primary')}${l.isDefault && layoutAvailable()?actionButton('open-layout',t('调整布局'),disabled(busy),'primary'):''}${actionButton('launcher-cover',t('选择背景图'),` data-component="${esc(l.component)}"${disabled(busy)}`)}${covers[l.component]?actionButton('remove-launcher-cover',t('移除背景'),` data-component="${esc(l.component)}"${disabled(busy)}`):''}</div></div></article>`).join('')}${!snapshot.launchers.length && !launcherApks.length?ui`<section class="panel empty-state">${icon('home')}<h3>${online()?t('未查询到启动器'):t('连接后查看启动器')}</h3><p>也可以添加本地启动器 APK，在此页面直接安装。</p></section>`:''}</div><section class="panel restore-panel"><div><h2>恢复原桌面</h2><p>${snapshot.originalHome?esc(snapshot.originalHome):t('首次切换前会记录原来的默认桌面。')}</p></div>${actionButton('restore-home',t('恢复原桌面'),disabled(busy || !online() || !snapshot.originalHome || snapshot.originalHome===snapshot.defaultHome))}</section>${layoutTarget===launcherTarget() && launcherLayout && !launcherLayout.supported?`<p class="hint">${esc(message(launcherLayout.message || t('此启动器不支持布局调整')))}</p>`:''}`;
}
function installPage(): string {
  return ui`${connectionStrip()}<section class="panel install-panel"><div class="section-title"><div><h2>待安装的 APK</h2><p>从电脑导入安装包，勾选要安装的文件；添加不会立即安装。</p></div>${actionButton('add-apks', icon('plus') + t('添加安装包'), disabled(busy || (!api.desktop && !api.demo)), 'primary')}</div><div class="install-footer"><span>共 ${apkPaths.length} 个文件 · 已选择 ${selectedApks.size} 个</span><div class="button-row">${actionButton('select-apks', t('全选'), disabled(busy || !apkPaths.length))}${actionButton('clear-apks-selection', t('取消选择'), disabled(busy || !selectedApks.size))}${actionButton('install-apks', t('安装所选'), disabled(busy || !online() || !selectedApks.size), 'primary')}</div></div>${apkPaths.length ? ui`<div class="apk-list" data-scroll="apks" tabindex="0" aria-label="待安装 APK 列表">${apkPaths.map(path => ui`<div class="apk-item" data-apk="${esc(path)}"><input type="checkbox" data-select-apk="${esc(path)}" aria-label="选择 ${esc(fileName(path))}"${selectedApks.has(path) ? ' checked' : ''}${disabled(busy)}><span class="large-icon">${icon('box')}</span><div class="apk-name"><strong>${esc(fileName(path))}</strong><code>${esc(path)}</code></div><div class="button-row apk-item-actions">${actionButton('install-one-apk',t('安装'),` data-path="${esc(path)}"${disabled(busy || !online())}`,'primary')}${actionButton('remove-apk', t('移除'), ` data-path="${esc(path)}"${disabled(busy)}`, 'text-button')}</div></div>`).join('')}</div>` : ui`<div class="empty-state upload-state">${icon('download')}<h3>添加你自己的安装包</h3><p>支持多次添加和多选 APK。移除列表项不会删除电脑文件。</p>${actionButton('add-apks', t('选择本地 APK'), disabled(busy || (!api.desktop && !api.demo)))}</div>`}</section><div class="two-columns install-notes"><section class="panel"><h2>电视应用资源</h2><p>启动器和第三方电视应用可从公共资源目录下载。</p>${actionButton('resource-catalog', t('打开资源目录 ↗'), '', 'text-button link-button')}</section><section class="panel"><h2>安装说明</h2><p>首版支持单个 APK 文件，可批量顺序安装多个应用。分包应用（APKS / XAPK）需使用其他安装方式。</p><p class="hint">同包名升级需签名一致。安装结束后会更新应用列表。</p></section></div>`;
}
const actionNames: Record<string, string> = { setEnabled: '更改启用状态', disable: '停用', enable: '启用', uninstall: '当前用户卸载', restore: '恢复安装', install: '安装 APK', setHome: '切换桌面', restoreHome: '恢复桌面', connect: '连接设备', pair: '配对设备', scan: '扫描应用', disconnect: '断开连接' };
function historyPage(): string {
  return ui`<div class="section-title"><div><h2>最近的操作</h2><p>最多保留 200 条记录。每条记录包含执行设备、用户和结果。</p></div>${actionButton('clear-history', t('清空记录'), disabled(busy || !snapshot.history.length))}</div><section class="panel history-panel">${snapshot.history.length ? ui`<div class="table-scroll" data-scroll="history" tabindex="0" aria-label="操作记录列表"><table><thead><tr><th>时间 / 操作</th><th>目标</th><th>结果</th></tr></thead><tbody>${snapshot.history.map(h => ui`<tr><td><strong>${esc(t(actionNames[h.action] || h.action))}</strong><span class="secondary">${esc(new Date(h.timestamp * 1000).toLocaleString(locale()))}</span></td><td><code class="history-target">${esc(h.target)}</code><span class="secondary">${esc(h.device)} · 用户 ${h.userId}</span></td><td><span class="status"><i class="dot ${h.success ? 'good' : 'bad'}"></i>${h.success ? t('完成') : t('未完成')}</span><p class="history-message">${esc(message(h.message))}</p></td></tr>`).join('')}</tbody></table></div>` : ui`<div class="empty-state">${icon('list')}<h3>还没有操作记录</h3><p>应用安装、停用、卸载和桌面切换的结果会显示在这里。</p></div>`}</section><p class="hint">需要恢复应用时，在应用管理的“已停用”或“可恢复”分类中选择目标操作。</p>`;
}
function updateSelectAll(): void {
  const box = root.querySelector<HTMLInputElement>('[data-select-all]'); if (!box) return;
  const eligible = visiblePackages().filter(p => !p.protectedReason);
  const count = eligible.filter(p => selected.has(p.packageName)).length;
  box.checked = eligible.length > 0 && count === eligible.length; box.indeterminate = count > 0 && count < eligible.length;
}
function updateList(): void {
  const focused = document.activeElement as HTMLElement | null;
  const focusPackage = focused?.dataset.selectPackage;
  const focusAll = focused?.hasAttribute('data-select-all');
  const rows = document.querySelector('#app-rows'); if (rows) rows.innerHTML = appRows();
  const count = document.querySelector('#list-count'); if (count) count.textContent = ui`显示 ${visiblePackages().length} / ${snapshot.packages.filter(p => inFilter(p, filter)).length} 个应用`;
  const bar = document.querySelector('#selection-bar'); if (bar) bar.innerHTML = selectionBar();
  updateSelectAll();
  if (focusPackage) Array.from(root.querySelectorAll<HTMLInputElement>('[data-select-package]')).find(input => input.dataset.selectPackage === focusPackage)?.focus({ preventScroll: true });
  else if (focusAll) root.querySelector<HTMLInputElement>('[data-select-all]')?.focus({ preventScroll: true });
}
function cleanSelection(): void {
  const valid = new Set(snapshot.packages.filter(p => !p.protectedReason).map(p => p.packageName));
  selected = new Set([...selected].filter(p => valid.has(p)));
}
async function run(request: Request, label: string): Promise<boolean> {
  if (busy) return false; localBusy = true; busy = true; cancelling = false; busyLabel = label; notice = ''; render();
  let success = false;
  try {
    const before = snapshot.device?.serial, previousEntries = new Set(snapshot.history.map(entry => entry.id));
    applySnapshot(await api.execute(request));
    if(request.action==='install')layoutDirty=true;
    if (before !== snapshot.device?.serial) selected.clear(); cleanSelection();
    const failed = snapshot.history.some(entry => !previousEntries.has(entry.id) && !entry.success);
    const unready = request.action === 'connect' && !online();
    notice = snapshot.message;
    noticeKind = failed ? 'error' : cancelling || unready ? 'info' : 'success';
    success = !failed && !cancelling && !unready;
    if (request.action === 'connect' && online()) page = 'connect';
    if (request.action === 'setAdbPath') adbPath = snapshot.adbPath || '';
  } catch (e) {
    notice = e instanceof Error ? e.message : String(e); noticeKind = 'error';
    try { const previousDevice = snapshot.device?.serial; applySnapshot(await api.execute({ action: 'getState' })); if (previousDevice !== snapshot.device?.serial) selected.clear(); cleanSelection(); } catch { /* Keep the last known snapshot if state refresh also fails. */ }
  } finally { localBusy = false; busy = !!agentOperation?.running; cancelling = false; render(); }
  return success;
}
function confirm(title: string, description: string, targets: string[], button: string, danger = false): Promise<boolean> {
  if (dialog.open) dialog.close();
  dialog.innerHTML = ui`<div class="modal-heading"><h2>${esc(title)}</h2><button class="icon-button" data-act="close-dialog" aria-label="关闭">${icon('close')}</button></div><p>${esc(description)}</p>${snapshot.device ? ui`<div class="target-device">目标电视：<strong>${esc(snapshot.device.model || snapshot.device.serial)}</strong><br><code>${esc(snapshot.device.serial)}</code> · 当前用户 ${snapshot.device.userId}</div>` : ''}<ul class="target-list">${targets.map(t => `<li>${esc(t)}</li>`).join('')}</ul><div class="modal-actions">${actionButton('close-dialog', t('取消'))}<button id="confirm-operation" class="${danger ? 'danger' : 'primary'}">${esc(button)}</button></div>`;
  dialog.setAttribute('aria-label', title); dialog.returnValue = ''; dialog.showModal(); dialog.querySelector<HTMLButtonElement>('[data-act="close-dialog"]')?.focus();
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirmed'), { once: true });
    dialog.querySelector<HTMLButtonElement>('#confirm-operation')!.onclick = () => dialog.close('confirmed');
  });
}
async function refreshToolsInfo(): Promise<void> {
  if (!api.desktop && !api.demo) return;
  try { toolsInfo = await api.platformToolsInfo(); toolsInfoError = ''; }
  catch (error) { toolsInfoError = ui`暂时无法读取下载信息：${error instanceof Error ? error.message : String(error)}`; }
}
function confirmTools(info: PlatformToolsInfo,forceDownload=false): Promise<boolean> {
  if (dialog.open) dialog.close();
  const title = forceDownload ? t('重新下载 ADB 工具') : info.installed ? t('使用已下载的 ADB') : t('下载官方 Platform Tools');
  const reuseCache=info.installed && !forceDownload;
  dialog.innerHTML = ui`<div class="modal-heading"><h2>${title}</h2><button class="icon-button" data-act="close-dialog" aria-label="关闭">${icon('close')}</button></div><p>${forceDownload ? t('强制重新下载完整工具包并校验，配置成功后才切换；失败或取消保留当前 ADB。Google 不可用时自动尝试腾讯镜像。') : reuseCache ? t('优先验证并使用已下载工具；校验失败时会重新下载并修复；Google 不可用时自动尝试腾讯镜像。') : t('优先从 Google 官方下载，失败时自动尝试腾讯镜像；校验并解压到本应用的数据目录后自动配置 ADB。')}</p><dl><dt>版本</dt><dd>${esc(info.version)}</dd><dt>适用系统</dt><dd>${esc(platformName(info.platform))}</dd><dt>下载大小</dt><dd>${reuseCache ? ui`缓存完整时 0 MiB；需修复时 ${bytes(info.downloadBytes)}` : bytes(info.downloadBytes)}</dd><dt>来源</dt><dd>Google · dl.google.com<br>备用：腾讯镜像 · mirrors.cloud.tencent.com<br>所有来源均核对官方文件大小和 SHA256</dd></dl>${api.demo ? t('<p>演示模式：仅模拟此流程，不下载文件。</p>') : ''}${actionButton('platform-tools-license', t('阅读 Android SDK 许可协议 ↗'), '', 'text-button link-button')}<label class="license-consent"><input type="checkbox" id="platform-tools-license"><span>我已阅读并同意 Android SDK 许可协议</span></label><div class="modal-actions">${actionButton('close-dialog', t('取消'))}<button id="confirm-platform-tools" class="primary" disabled>${reuseCache ? t('验证并使用') : t('确认下载')}</button></div>`;
  dialog.setAttribute('aria-label', title); dialog.returnValue = ''; dialog.showModal();
  const consent = dialog.querySelector<HTMLInputElement>('#platform-tools-license')!;
  const accept = dialog.querySelector<HTMLButtonElement>('#confirm-platform-tools')!;
  consent.onchange = () => { accept.disabled = !consent.checked; };
  dialog.querySelector<HTMLButtonElement>('[data-act="close-dialog"]')?.focus();
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirmed'), { once: true });
    accept.onclick = () => { if (consent.checked) dialog.close('confirmed'); };
  });
}
function updateToolsProgress(progress: DownloadProgress): void {
  if (!downloadingTools) return;
  toolsProgress = progress;
  const bar = root.querySelector<HTMLDivElement>('.busy-bar');
  if (!bar) return;
  const label = bar.querySelector<HTMLElement>('[data-busy-label]');
  if (label) label.textContent = progressText() + (cancelling ? t(' · 正在取消并清理临时文件') : '');
  const meter = bar.querySelector<HTMLProgressElement>('progress');
  if (progress.stage === 'downloading' && progress.total > 0) {
    if (meter) { meter.max = progress.total; meter.value = Math.min(Math.max(0, progress.downloaded), progress.total); }
    else bar.querySelector('button')?.insertAdjacentHTML('beforebegin', downloadMeter());
  } else meter?.remove();
}
async function downloadTools(forceDownload=false): Promise<void> {
  if (busy || toolsPreparing || snapshot.device || (!api.desktop && !api.demo)) return;
  toolsPreparing = true; render();
  let info: PlatformToolsInfo;
  try { info = await api.platformToolsInfo(); toolsInfo = info; toolsInfoError = ''; }
  finally { toolsPreparing = false; render(); }
  if (!info.supported) throw new Error(info.message || t('当前电脑不支持在线配置，请手动选择 ADB'));
  if (!await confirmTools(info,forceDownload) || busy || snapshot.device) return;
  localBusy = true; busy = true; downloadingTools = true; cancelling = false; notice = '';
  toolsProgress = { stage: info.installed && !forceDownload ? 'checking' : 'downloading', downloaded: 0, total: info.downloadBytes }; render();
  try {
    const value = await api.installPlatformTools(updateToolsProgress,forceDownload);
    if (!value.adbAvailable || !value.adbPath) throw new Error(t('工具尚未就绪，请重试或手动选择 ADB'));
    applySnapshot(value); adbPath = snapshot.adbPath || ""; toolsInfo = { ...info, installed: true };
    notice = value.message || t('ADB 已就绪，可以连接电视'); noticeKind = cancelling ? 'info' : 'success';
  } catch (error) {
    notice = error instanceof Error ? error.message : String(error);
    noticeKind = cancelling ? 'info' : 'error';
    try { applySnapshot(await api.execute({ action: 'getState' })); adbPath = snapshot.adbPath || ''; } catch { /* Retain last known state if refresh fails. */ }
  } finally {
    downloadingTools = false; localBusy = false; busy = !!agentOperation?.running; cancelling = false; toolsProgress = null; render();
  }
}
function details(pkg: string): void {
  const p = snapshot.packages.find(p => p.packageName === pkg); if (!p) return;
  if (dialog.open) dialog.close();
  dialog.innerHTML = ui`<div class="modal-heading"><h2>应用详情</h2><button class="icon-button" data-act="close-dialog" aria-label="关闭">${icon('close')}</button></div><div class="detail-identity">${appIcon(p)}<h3>${esc(p.label)}</h3></div><dl><dt>包名</dt><dd><code>${esc(p.packageName)}</code></dd><dt>类型</dt><dd>${p.system ? t('系统应用') : t('用户应用')}</dd><dt>安装包大小</dt><dd>${packageSize(p)}${p.installed ? t('（含分包，不含私有数据和缓存）') : ''}</dd><dt>当前用户状态</dt><dd>${!p.installed ? t('未安装，可尝试恢复') : p.enabled ? t('已安装，已启用') : t('已安装，已停用')}</dd>${p.protectedReason ? ui`<dt>保护原因</dt><dd>${esc(message(p.protectedReason || ''))}</dd>` : ''}</dl><p class="hint">名称无法读取时以包名显示；操作前请确认具体应用。</p><div class="modal-actions">${actionButton('close-dialog', t('关闭'))}</div>`;
  dialog.setAttribute('aria-label', t('应用详情')); dialog.showModal();
}
function checkedPackages(kind: 'disable' | 'enable' | 'uninstall' | 'restore', one?: string): PackageInfo[] {
  const items = one ? snapshot.packages.filter(p => p.packageName === one) : selectedPackages();
  if (!items.length) throw new Error(t('请先选择应用'));
  if (items.length > 100) throw new Error(t('一次最多操作 100 个应用，请减少所选数量后重试'));
  if (items.some(p => p.protectedReason)) throw new Error(t('所选应用中包含受保护组件，请先取消选择'));
  if (items.some(p => kind === 'restore' ? p.installed : !p.installed)) throw new Error(t('所选应用的安装状态不适合此操作，请重新扫描'));
  return items;
}
async function packageAction(kind: 'disable' | 'enable' | 'uninstall' | 'restore', one?: string): Promise<void> {
  if (busy || !online()) return;
  const items = checkedPackages(kind, one), labels = { disable: t('停用'), enable: t('启用'), uninstall: t('为当前用户卸载'), restore: t('恢复安装') };
  const descriptions = {
    disable: t('停用后，这些应用将不能在当前电视用户下运行。可在“已停用”分类中重新启用。'),
    enable: t('重新启用以下应用。'),
    uninstall: t('仅为当前用户卸载并保留数据。系统分区安装包不会删除；普通第三方应用可能需要重新安装 APK 才能恢复。'),
    restore: t('尝试恢复设备仍保有安装包的以下应用，实际结果将在操作记录中显示。'),
  };
  if (!await confirm(ui`${labels[kind]} ${items.length} 个应用`, descriptions[kind], items.map(p => `${p.label} · ${p.packageName}`), labels[kind], kind === 'uninstall')) return;
  const packages = items.map(p => p.packageName);
  const request: Request = kind === 'disable' || kind === 'enable' ? { action: 'setEnabled', packages, enabled: kind === 'enable' } : { action: kind, packages };
  await run(request, ui`${labels[kind]}，逐项执行并核对结果…`); selected.clear(); render();
}
function validAddress(rawHost: string, rawPort: string): { host: string; port: number } {
  const value = rawHost.trim(), number = Number(rawPort);
  if (!value || value.length > 253 || /[\s/\\;|&$`'"<>]/.test(value)) throw new Error(t('请输入有效的电视 IP 或主机名，不要包含协议或端口'));
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(number) || number < 1 || number > 65535) throw new Error(t('端口应为 1–65535 的整数'));
  return { host: value, port: number };
}
async function confirmConnectionNetwork(address:{host:string;port:number}):Promise<boolean> {
 if(busy)return false;
 localBusy=true;busy=true;cancelling=false;busyLabel=t('正在检查本机网段…');render();
 let info:import('./types').LocalNetworkInfo,stopped=false;
 try {info=await api.localNetwork();snapshot.localNetwork=info;stopped=cancelling;}
 catch(error){info={addresses:[],error:error instanceof Error?error.message:String(error)};snapshot.localNetwork=info;stopped=cancelling;}
 finally{localBusy=false;busy=!!agentOperation?.running;cancelling=false;render();}
 if(stopped || busy)return false;
 if(sameSubnet(address.host,info)!==false)return true;
 return confirm(t('电视与电脑不在同一网段'),t('电视 IP 与当前所有本机网卡的网段都不匹配，可能无法直接连接。如果已配置跨网段路由或 VPN，仍可继续。'),[ui`电视地址：${address.host}:${address.port}`,...info.addresses.map(adapter=>`${adapter.ip}/${adapter.prefixLength} · ${adapter.interfaceName}`)],t('继续连接'));
}
async function addApks(): Promise<void> {
  if (busy) return; const values = await api.chooseApks();
  if (!values.length) return;
  let added = 0;
  for (const path of values) if (!apkPaths.includes(path)) { apkPaths.push(path); selectedApks.add(path); added++; }
  page = 'install'; showNotice(ui`已添加 ${added} 个安装包。请勾选后点击“安装所选”。`);
}
async function doAction(button: HTMLButtonElement): Promise<void> {
  if (button.disabled) return; const action = button.dataset.act;
  switch (action) {
    case 'go-apps': page='apps';render();break;
    case 'refresh-system': await run({action:'refreshSystemInfo'},t('刷新电视系统信息…'));break;
    case 'go-connect': page = 'connect'; render(); break;
    case 'go-install': page = 'install'; render(); break;
    case 'dismiss': notice = ''; render(); break;
    case 'close-dialog': dialog.close(); break;
    case 'connect': { const address=validAddress(host,port);if(!await confirmConnectionNetwork(address))break;host=address.host;port=String(address.port);connectionEdited=false;await run({ action: 'connect', ...address }, t('连接电视并读取设备信息…'));break; }
    case 'refresh-local-network': await run({action:'refreshLocalNetwork'},t('正在刷新本机网络地址…'));break;
    case 'disconnect': await run({ action: 'disconnect' }, t('断开当前电视…')); break;
    case 'choose-adb': { const path = await api.chooseAdb(); if (path) { adbPath = path; await run({ action: 'setAdbPath', path }, t('验证 ADB 工具…')); } break; }
    case 'save-adb': await run({ action: 'setAdbPath', path: adbPath.trim() }, t('验证 ADB 工具…')); break;
    case 'auto-adb': adbPath = ''; await run({ action: 'setAdbPath', path: '' }, t('查找 ADB 工具…')); break;
    case 'download-adb': await downloadTools(); break;
    case 'redownload-adb': await downloadTools(true); break;
    case 'platform-tools': await api.openResource('platformTools'); break;
    case 'platform-tools-license': await api.openResource('platformToolsLicense'); break;
    case 'releases': await api.openResource('releases'); break;
    case 'resource-catalog': await api.openResource('catalog'); break;
    case 'scan': await run({ action: 'scan' }, t('扫描电视应用，读取当前用户状态…')); if(page==='launchers' && online())await launcherOperation({action:'getLayout'},true);break;
    case 'cancel': cancelling = true; render(); await api.cancel(); break;
    case 'details': details(button.dataset.pkg!); break;
    case 'clear-selection': selected.clear(); updateList(); break;
    case 'disable': case 'enable': case 'uninstall': case 'restore': await packageAction(action); break;
    case 'enable-one': await packageAction('enable', button.dataset.pkg); break;
    case 'restore-one': await packageAction('restore', button.dataset.pkg); break;
    case 'add-launcher': { const values=await api.chooseLauncherApks();for(const value of values)if(!launcherApks.some(item=>item.path===value.path))launcherApks.push(value);render();break; }
    case 'remove-launcher-apk': launcherApks=launcherApks.filter(item=>item.path!==button.dataset.path);render();break;
    case 'install-launcher': {
      const path=button.dataset.path!;if(busy || !online())return;
      if(await confirm(t('安装启动器'),t('将安装此 APK，完成后刷新启动器列表。'),[path],t('开始安装'))) {
        const before=new Set(snapshot.launchers.map(item=>item.component)), item=launcherApks.find(item=>item.path===path);
        await run({action:'install',paths:[path]},t('正在安装启动器…'));
        if(snapshot.installResults?.some(result=>result.path===path && result.success)) {
          launcherApks=launcherApks.filter(item=>item.path!==path);
          if(item?.homeBackground)for(const launcher of snapshot.launchers.filter(value=>!before.has(value.component)))homeBackgrounds.set(launcherTarget(snapshot.device?.serial,snapshot.device?.userId,launcher.component),item.homeBackground);
          if(item?.cover)for(const launcher of snapshot.launchers.filter(item=>!before.has(item.component)))covers=await api.adoptLauncherCover(launcher.component,path);
        }
        render();if(online())await launcherOperation({action:'getLayout'});
      }break;
    }
    case 'launcher-cover': case 'remove-launcher-cover': covers=await api.chooseLauncherCover(button.dataset.component!,action==='remove-launcher-cover');render();break;
    case 'open-layout': if(layoutDirty && online())await launcherOperation({action:'getLayout'},true);if(layoutAvailable()){layoutNode=null;layoutSelected=0;layoutSection='home';layoutModalTarget=launcherTarget();layoutDialog.innerHTML=layoutEditor();layoutDialog.showModal();syncSceneScale();}break;
    case 'close-layout': if(!busy)layoutDialog.close();break;
    case 'add-apks': await addApks(); break;
    case 'remove-apk': { const path = button.dataset.path!; apkPaths = apkPaths.filter(p => p !== path); selectedApks.delete(path); render(); break; }
    case 'select-apks': selectedApks = new Set(apkPaths); render(); break;
    case 'clear-apks-selection': selectedApks.clear(); render(); break;
    case 'install-one-apk': case 'install-apks': {
      const paths = action==='install-one-apk' ? apkPaths.filter(p=>p===button.dataset.path) : apkPaths.filter(p => selectedApks.has(p)); if (!paths.length || busy || !online()) return;
      if (paths.length > 10) throw new Error(t('一次最多安装 10 个 APK，请减少所选数量；其他文件会保留在列表中'));
      if (await confirm(ui`安装 ${paths.length} 个应用`, t('将按顺序安装以下 APK。同包名且签名一致的应用会尝试覆盖升级。'), paths, t('开始安装'))) {
        const complete=await run({ action: 'install', paths }, t('正在安装所选 APK，完成后刷新应用…'));
        const installed=new Set(snapshot.installResults?.filter(result=>result.success && paths.includes(result.path)).map(result=>result.path) || (complete?paths:[]));
        apkPaths=apkPaths.filter(path=>!installed.has(path));selectedApks=new Set([...selectedApks].filter(path=>!installed.has(path)));render();
      } break;
    }
    case 'read-layout': await launcherOperation({action:'getLayout'}); break;
    case 'apply-layout': {
      const draft=unifiedDraft() || draftLayout();if(!draft || !layoutAvailable()) throw new Error(t('请先读取并编辑受支持启动器的布局'));
      if(!(draft.version===4?(['home','apps'] as const).every(section=>draft[section].users.every(entry=>layoutApps().some(app=>app.packageName===entry.action))):['home','apps'].every(section=>draft[section as 'home'|'apps'].items.every(entry=>!entry.packageName || layoutApps().some(app=>app.packageName===entry.packageName)))))throw new Error(t('只能使用已安装、可启动的用户应用'));
      if(await confirm(t('应用启动器布局'),t('将 layout.json 写入当前启动器，并复查返回的配置。'),[snapshot.defaultHome || ''],t('应用布局'))) await launcherOperation({action:'applyLayout',layout:draft});
      break;
    }
    case 'reset-layout': if(layoutAvailable() && await confirm(t('恢复默认布局'),t('移除当前启动器的 layout.json 自定义配置，壁纸和其他设置保留。'),[snapshot.defaultHome || ''],t('恢复默认布局'))) await launcherOperation({action:'resetLayout'}); break;
    case 'import-layout': { const text=await api.chooseLauncherJson();if(text){const previous=layoutJson;layoutJson=text;const unified=unifiedDraft();if(!draftLayout()&&!unified){layoutJson=previous;throw new Error(t('布局文件格式无效'));}if(unified&&validUnified(launcherLayout?.layout)&&!systemUnchanged(unified,launcherLayout.layout)){layoutJson=previous;throw new Error(t('系统组件只读，不能修改属性或位置'));}render();} break; }
    case 'parse-layout': if(!draftLayout()&&!unifiedDraft()) throw new Error(t('layout.json 格式无效')); render(); break;
    case 'layout-home': layoutSection='home';layoutNode=null;layoutSelected=0;render();break;
    case 'layout-apps': layoutSection='apps';layoutNode=null;layoutSelected=0;render();break;
    case 'layout-up': case 'layout-down': {
      const index=Number(button.dataset.index), offset=button.dataset.act==='layout-up'?-1:1;
      modifyLayout(draft=>{const entries=draft[layoutSection].items, next=index+offset;if(next>=0 && next<entries.length){[entries[index],entries[next]]=[entries[next],entries[index]];layoutSelected=next;}});break;
    }
    case 'layout-remove': modifyLayout(draft=>{draft[layoutSection].items.splice(Number(button.dataset.index),1);});break;
    case 'layout-add': modifyLayout(draft=>{if(!layoutApp || draft[layoutSection].items.some(entry=>entry.packageName===layoutApp))return;const page=draft[layoutSection];page.items.push({packageName:layoutApp,icon:'app',color:'#374959',...(draft.version===3?{frame:autoFrame(layoutSection,page.items.length,page.columns,page.items.length+1),visible:true,zIndex:1}:{})});layoutNode=null;layoutSelected=page.items.length-1;});break;
    case 'set-home': {
      const component = button.dataset.component!;
      if (await confirm(t('更换默认桌面'), t('切换前会记录原来的桌面，便于之后恢复。'), [component], t('设为默认桌面'))) {await run({ action: 'setHome', component }, t('切换默认桌面并核对结果…'));await launcherOperation({action:'getLayout'});} break;
    }
    case 'restore-home': if (snapshot.originalHome && await confirm(t('恢复原来的桌面'), t('将当前电视的默认桌面切换回记录的启动器。'), [snapshot.originalHome], t('恢复原桌面'))) {await run({ action: 'restoreHome' }, t('恢复原桌面并核对结果…'));await launcherOperation({action:'getLayout'});} break;
    case 'clear-history': if (await confirm(t('清空操作记录'), t('仅清空本机保存的记录，不撤销电视上已执行的操作。'), [ui`${snapshot.history.length} 条记录`], t('清空记录'))) await run({ action: 'clearHistory' }, t('清空记录…')); break;
  }
}
document.addEventListener('click', event => {
  const target = event.target as HTMLElement;
  if (target.closest('.brand')) { event.preventDefault(); page = 'connect'; render(); return; }
  const nav = target.closest<HTMLButtonElement>('[data-page]');
  if (nav) { page = nav.dataset.page as Page; render(); if(page==='launchers' && layoutDirty && online() && !busy)void launcherOperation({action:'getLayout'},true); return; }
  const node=target.closest<HTMLElement>('[data-scene-node]');if(node){layoutNode=node.dataset.sceneNode || null;layoutSelected=-1;render();return;}
  const tile=target.closest<HTMLElement>('[data-layout-tile]');if(tile){layoutNode=null;layoutSelected=Number(tile.dataset.layoutTile);render();return;}
  const tab = target.closest<HTMLButtonElement>('[data-filter]');
  if (tab) { filter = tab.dataset.filter as Filter; selected.clear(); render(); return; }
  const button = target.closest<HTMLButtonElement>('button[data-act]');
  if (button) void doAction(button).catch(e => showNotice(e instanceof Error ? e.message : String(e), 'error'));
});
document.addEventListener('input', event => {
  if ((event.target as HTMLTextAreaElement).name==='layoutJson') { layoutJson=(event.target as HTMLTextAreaElement).value; return; }

  const input = event.target as HTMLInputElement;
  switch (input.name) {
    case 'host': host = input.value; connectionEdited=true; break;
    case 'port': port = input.value; connectionEdited=true; break;
    case 'adbPath': adbPath = input.value; break;
    case 'search': query = input.value; updateList(); break;
  }
});
document.addEventListener('change', event => {
  const control = event.target as HTMLInputElement;
  if(control.name==='locale'){setLocale(control.value);render();void api.setInterfacePreferences({locale:control.value}).catch(error=>showNotice(String(error),'error'));return;}
  if(control.name==='theme'){setTheme(control.value);render();void api.setInterfacePreferences({theme:control.value}).catch(error=>showNotice(String(error),'error'));return;}
  if(control.dataset.layoutTarget!==undefined){const packageName=control.value;if(packageName==='__builtin__')return;if(!layoutApps().some(app=>app.packageName===packageName)){showNotice(t('只能使用已安装、可启动的用户应用'),'error');return;}modifyLayout(draft=>{const entry=draft[layoutSection].items[Number(control.dataset.layoutTarget)];if(entry){delete entry.action;entry.packageName=packageName;}});return;}
  if (control.name === 'layoutApp') { layoutApp = control.value; render(); return; }
  if (control.name === 'layoutColumns') { const columns=Number(control.value); if(!Number.isInteger(columns) || columns<1 || columns>6){showNotice(t('每行列数应为 1–6'),'error');return;} modifyLayout(draft=>{const page=draft[layoutSection];page.columns=columns;if(draft.version===3)page.items.forEach((item,i)=>item.frame=autoFrame(layoutSection,i,columns,page.items.length));}); return; }
  for (const [attribute,field] of [['layoutLabel','label'],['layoutIcon','icon'],['layoutColor','color']] as const) {
    if (control.dataset[attribute] !== undefined) { modifyLayout(draft=>{const entry=draft[layoutSection].items[Number(control.dataset[attribute])]; if(entry)entry[field]=control.value;}); return; }
  }

  const input = event.target as HTMLInputElement;
  if (input.dataset.selectPackage) { input.checked ? selected.add(input.dataset.selectPackage) : selected.delete(input.dataset.selectPackage); updateList(); }
  else if (input.hasAttribute('data-select-all')) { for (const p of visiblePackages().filter(p => !p.protectedReason)) input.checked ? selected.add(p.packageName) : selected.delete(p.packageName); updateList(); }
  else if (input.dataset.selectApk) {
    const path = input.dataset.selectApk; input.checked ? selectedApks.add(path) : selectedApks.delete(path); render();
    Array.from(root.querySelectorAll<HTMLInputElement>('[data-select-apk]')).find(checkbox => checkbox.dataset.selectApk === path)?.focus();
  }
});
document.addEventListener('keydown', event => {
  const input = event.target as HTMLInputElement;
  if (event.key === 'Enter' && !busy && !dialog.open && ['host', 'port'].includes(input.name)) {
    event.preventDefault(); const button = root.querySelector<HTMLButtonElement>('[data-act="connect"]'); if (button && !button.disabled) button.click();
  }
});
render();
void api.execute({ action: 'getState' }).then(value => {
  if (!applySnapshot(value)) return;
  adbPath = snapshot.adbPath || ''; notice = snapshot.message;
  render();
  void refreshToolsInfo().then(render);
}).catch(e => showNotice(e instanceof Error ? e.message : String(e), 'error'));

void api.mcpInfo().then(value => { mcpInfo = value; render(); }).catch(error => { mcpError = String(error); render(); });
void api.watchMcp(value => {
  agentOperation = value; busy = localBusy || value.running;
  if (!localBusy) cancelling = false;
  if (value.running) { notice = ''; agentProgress = null; }
  if (value.snapshot) {
    const previous = snapshot.device?.serial;
    if (applySnapshot(value.snapshot)) {
      adbPath = snapshot.adbPath || '';
      if (previous !== snapshot.device?.serial) selected.clear();
      cleanSelection();
      notice = value.error || snapshot.message; noticeKind = value.error ? 'error' : 'info';
    }
  }
  if (['install','uninstall','restore','set_enabled','scan'].includes(value.tool) && !value.running) layoutDirty=true;
  if (value.launcherResult) {if(value.tool==='get_launcher_backgrounds')acceptLauncherBackgrounds(value.launcherResult);else acceptLauncherResult(value.launcherResult);}
  if(value.tool==='set_launcher_cover' && !value.running)void api.launcherCovers().then(value=>{covers=value;render();});
  if (!value.running) { agentProgress = null; void refreshToolsInfo().then(render); }
  if(value.tool==='get_launcher_layout' && value.launcherResult)layoutDirty=false;
  render();
  if(page==='launchers' && !busy && layoutDirty && online())void launcherOperation({action:'getLayout'},true);
}, value => { agentProgress = value; render(); }).catch(error => { mcpError = ui`无法订阅 Agent 状态：${String(error)}`; render(); });

void api.launcherCovers().then(value=>{covers=value;render();}).catch(error=>showNotice(String(error),'error'));
layoutDialog.addEventListener('dragstart',event=>{
 if(draftLayout()?.version===3){event.preventDefault();return;}
 const tile=(event.target as HTMLElement).closest<HTMLElement>('[data-layout-tile]');if(!tile || busy)return;
 layoutDrag=Number(tile.dataset.layoutTile);event.dataTransfer?.setData('text/plain',String(layoutDrag));
});
layoutDialog.addEventListener('dragover',event=>{if(!busy && layoutDrag!==null && (event.target as HTMLElement).closest('[data-layout-tile]'))event.preventDefault();});
layoutDialog.addEventListener('drop',event=>{
 const tile=(event.target as HTMLElement).closest<HTMLElement>('[data-layout-tile]');if(!tile || busy || layoutDrag===null)return;
 event.preventDefault();const from=layoutDrag,to=Number(tile.dataset.layoutTile);layoutDrag=null;
 modifyLayout(draft=>{const items=draft[layoutSection].items;if(from<items.length && to<items.length){items.splice(to,0,items.splice(from,1)[0]);layoutSelected=to;}});
});
layoutDialog.addEventListener('dragend',()=>{layoutDrag=null;});

function acceptPreferences(value:api.InterfacePreferences){if(value.locale)setLocale(value.locale);if(value.theme)setTheme(value.theme);render();}
void api.watchInterfacePreferences(acceptPreferences).catch(error=>showNotice(String(error),'error'));
void api.interfacePreferences().then(async value=>{
  if(value.locale || value.theme)acceptPreferences(value);
  if(api.desktop && !api.demo && (!value.locale || !value.theme))await api.setInterfacePreferences({locale:locale(),theme:document.documentElement.dataset.theme},true);
}).catch(error=>showNotice(String(error),'error'));

// V3 scene editing: numeric controls and pointer movement share the same geometry values.
layoutDialog.addEventListener('change',event=>{
 const control=event.target as HTMLInputElement;
 if(control.name==='sceneSelection'){const value=control.value;layoutNode=value.startsWith('tile:')?null:value;layoutSelected=layoutNode?-1:Number(value.slice(5));render();return;}
 if(control.matches('[data-scene-image]')){const file=control.files?.[0];if(file)void embedSceneImage(file).catch(error=>showNotice(message(String(error)),'error'));return;}
 if(!control.matches('[data-scene-frame],[data-scene-layer],[data-scene-visible],[data-scene-background]'))return;
 modifyLayout(draft=>{
  const target=sceneNode(draft,layoutSection,layoutNode,layoutSelected);if(!target)return;
  if(control.dataset.sceneFrame){target.frame ??= autoFrame(layoutSection,layoutSelected,draft[layoutSection].columns,draft[layoutSection].items.length);target.frame[control.dataset.sceneFrame as keyof import('./types').LayoutFrame]=Number(control.value);}
  else if(control.hasAttribute('data-scene-layer'))target.zIndex=Number(control.value);
  else if(control.hasAttribute('data-scene-visible'))target.visible=control.checked;
  else if(control.hasAttribute('data-scene-background'))draft[layoutSection].scene!.background.color=control.value;
 });
});
layoutDialog.addEventListener('click',event=>{if((event.target as HTMLElement).closest('[data-act="scene-clear-image"]'))modifyLayout(draft=>{delete draft[layoutSection].scene!.background.image;});});
async function embedSceneImage(file:File):Promise<void> {
 if(busy)return;
 const expectedTarget=layoutModalTarget,section=layoutSection;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>16*1024*1024)throw Error(t('请选择不超过 16 MiB 的 PNG、JPEG 或 WebP 图片'));
 const image:ImageBitmap|HTMLImageElement=typeof createImageBitmap==='function'?await createImageBitmap(file):await new Promise<HTMLImageElement>((resolve,reject)=>{
  const reader=new FileReader();reader.onerror=()=>reject(Error(t('无法读取背景图片')));
  reader.onload=()=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error(t('无法读取背景图片')));img.src=String(reader.result);};reader.readAsDataURL(file);
 });
 try {
  const canvas=document.createElement('canvas');let result='';
  for(const width of [960,640,480,320]){
   const ratio=Math.min(1,width/image.width,540/image.height);canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
   const context=canvas.getContext('2d')!;context.drawImage(image,0,0,canvas.width,canvas.height);
   for(const quality of [.75,.5,.3]){result=canvas.toDataURL('image/webp',quality);if(!result.startsWith('data:image/webp;'))result=canvas.toDataURL('image/jpeg',quality);if(result.length<=33000)break;}if(result.length<=33000)break;
  }
  if(result.length>33000)throw Error(t('图片压缩后仍过大，请使用更简单的背景图'));
  if(expectedTarget!==layoutModalTarget || section!==layoutSection || !layoutDialog.open || busy)return;
  modifyLayout(draft=>{draft[section].scene!.background.image=result;});
 } finally {if('close' in image)image.close();}
}
let scenePointer:{pointer:number;element:HTMLElement;startX:number;startY:number;frame:import('./types').LayoutFrame;next:import('./types').LayoutFrame;node:string|null;index:number;section:'home'|'apps';target:string;moved:boolean}|null=null;
layoutDialog.addEventListener('pointerdown',event=>{
 if(busy || event.button!==0)return;
 const draft=draftLayout();if(draft?.version!==3)return;
 const element=(event.target as HTMLElement).closest<HTMLElement>('.scene-element');if(!element)return;
 const node=element.dataset.sceneNode || null,index=node?-1:Number(element.dataset.layoutTile);
 const target=sceneNode(draft,layoutSection,node,index);if(!target)return;
 const frame=target.frame || autoFrame(layoutSection,index,draft[layoutSection].columns,draft[layoutSection].items.length);
 scenePointer={pointer:event.pointerId,element,startX:event.clientX,startY:event.clientY,frame:{...frame},next:{...frame},node,index,section:layoutSection,target:layoutModalTarget,moved:false};
 element.setPointerCapture(event.pointerId);
});
layoutDialog.addEventListener('pointermove',event=>{
 const drag=scenePointer;if(!drag || drag.pointer!==event.pointerId)return;
 const rect=drag.element.closest('.scene-canvas')!.getBoundingClientRect(),dx=(event.clientX-drag.startX)*960/rect.width,dy=(event.clientY-drag.startY)*540/rect.height;
 if(Math.abs(dx)+Math.abs(dy)<3 && !drag.moved)return;drag.moved=true;event.preventDefault();
 drag.next={...drag.frame,x:Math.max(0,Math.min(960-drag.frame.width,Math.round(drag.frame.x+dx))),y:Math.max(0,Math.min(540-drag.frame.height,Math.round(drag.frame.y+dy)))};
 drag.element.style.left=`${drag.next.x/9.6}%`;drag.element.style.top=`${drag.next.y/5.4}%`;
});
layoutDialog.addEventListener('pointerup',event=>{
 const drag=scenePointer;if(!drag || drag.pointer!==event.pointerId)return;scenePointer=null;
 if(!drag.moved || busy || drag.target!==layoutModalTarget || drag.section!==layoutSection)return;
 layoutNode=drag.node;layoutSelected=drag.index;
 modifyLayout(draft=>{const node=sceneNode(draft,drag.section,drag.node,drag.index);if(node)node.frame=drag.next;});
});
layoutDialog.addEventListener('pointercancel',()=>{scenePointer=null;render();});

new ResizeObserver(syncSceneScale).observe(layoutDialog);
