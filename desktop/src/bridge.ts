import { Channel, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { emptySnapshot, type Snapshot, type LocalNetworkInfo, type Request, type PlatformToolsInfo, type DownloadProgress, type MarketCatalog, type MarketProgress, type MarketResult, type MarketEventResult, type PackageInsight } from './types';

export const demo = new URLSearchParams(location.search).get('demo') === '1';
export const desktop = '__TAURI_INTERNALS__' in window;
const unavailable = '浏览器预览不能连接电视，请运行 pureTV 桌面应用。';
const sample = emptySnapshot();
let demoDownloadCancelled = false, demoToolsInstalled = false;
if (demo) {
  sample.localNetwork={addresses:[{interfaceName:'演示 Wi-Fi',ip:'192.168.1.20',prefixLength:24}],error:null};
  sample.adbAvailable = true;
  sample.adbPath = '演示 / platform-tools / adb';
  sample.device = { serial: '192.168.1.50:5555', model: '客厅电视', androidVersion: '12', userId: 0, status: 'device' };
  sample.packages = [
    { packageName: 'com.ecojust.puretv', label: 'pureTV', system: false, enabled: true, installed: true, protectedReason: null },
    { packageName: 'com.ecojust.music', label: 'Music TV', system: false, enabled: true, installed: true, protectedReason: null },
    { packageName: 'com.ecojust.webtv', label: 'WebTV', system: false, enabled: true, installed: true, protectedReason: null },
    { packageName: 'com.vendor.recommendations', label: '厂商推荐', system: true, enabled: true, installed: true, protectedReason: null },
    { packageName: 'com.vendor.contentcenter', label: '厂商内容中心', system: true, enabled: false, installed: true, protectedReason: null },
    { packageName: 'com.android.tv.settings', label: '系统设置', system: true, enabled: true, installed: true, protectedReason: '系统设置组件' },
    { packageName: 'com.ecojust.shortvideo', label: 'ShortVideo TV', system: false, enabled: true, installed: true, protectedReason: null },
    { packageName: 'com.vendor.launcher', label: '原厂桌面', system: true, enabled: true, installed: true, protectedReason: '当前默认启动器' },
    { packageName: 'com.vendor.suggestions', label: '内容推荐服务', system: true, enabled: false, installed: false, protectedReason: null },
  ];
  sample.defaultHome = 'com.vendor.launcher/.Home';
  sample.launchers = [
    { component: 'com.vendor.launcher/.Home', packageName: 'com.vendor.launcher', label: '原厂桌面', isDefault: true },
    { component: 'com.ecojust.puretv/.MainActivity', packageName: 'com.ecojust.puretv', label: 'pureTV', isDefault: false },
  ];
}
function copy(): Snapshot { return structuredClone(sample); }
function record(action: string, target: string): void {
  sample.history.unshift({ id: crypto.randomUUID(), timestamp: Math.floor(Date.now() / 1000), action, target, device: sample.device?.serial ?? '演示设备', userId: sample.device?.userId ?? 0, success: true, message: '演示结果，未向任何设备发送命令' });
  sample.history = sample.history.slice(0, 200);
}
function protectCurrentHome(): void {
  const pkg = sample.defaultHome?.split('/')[0];
  for (const p of sample.packages) {
    if (p.protectedReason === '当前默认启动器') p.protectedReason = null;
    if (p.packageName === pkg) p.protectedReason = '当前默认启动器';
  }
  for (const l of sample.launchers) l.isDefault = l.component === sample.defaultHome;
}
async function simulate(request: Request): Promise<Snapshot> {
  if (request.action !== 'getState') await new Promise(resolve => setTimeout(resolve, 200));
  if (request.action === 'disconnect') { sample.device = null; sample.packages = []; sample.launchers = []; sample.defaultHome = null; sample.originalHome = null; }
  else if (request.action === 'connect') sample.device = { serial: `${request.host}:${request.port}`, model: '演示电视', androidVersion: '12', userId: 0, status: 'device' };
  else if (request.action === 'setAdbPath') { sample.adbPath = request.path || '演示 / platform-tools / adb'; sample.adbAvailable = true; }
  else if (request.action === 'clearHistory') sample.history = [];
  else if (request.action === 'setEnabled' || request.action === 'uninstall' || request.action === 'restore') {
    for (const pkg of request.packages) {
      const p = sample.packages.find(value => value.packageName === pkg);
      if (!p || p.protectedReason) throw new Error('该应用在演示中受保护');
      if (request.action === 'setEnabled') p.enabled = request.enabled;
      else if (request.action === 'uninstall') p.installed = false;
      else { p.installed = true; p.enabled = true; }
      record(request.action, p.packageName);
    }
  } else if (request.action === 'setHome') {
    sample.originalHome ??= sample.defaultHome; sample.defaultHome = request.component;
    protectCurrentHome(); record('setHome', request.component);
  } else if (request.action === 'restoreHome') {
    if (!sample.originalHome) throw new Error('没有已记录的原桌面');
    sample.defaultHome = sample.originalHome; protectCurrentHome(); record('restoreHome', sample.defaultHome);
  } else if (request.action === 'install') {
    sample.installResults = request.paths.map(path => ({ path, success: true, message: '演示结果，未向任何设备发送命令' }));
    for (const file of request.paths) record('install', file);
  }
  sample.message = request.action === 'getState' ? '' : '演示操作完成，未连接真实设备';
  return copy();
}
export async function execute(request: Request): Promise<Snapshot> {
  if (demo) return simulate(request);
  if (!desktop) {
    if (request.action === 'getState') return { ...emptySnapshot(), message: unavailable };
    throw new Error(unavailable);
  }
  return invoke<Snapshot>('execute', { request });
}
export async function cancel(): Promise<void> { if (demo) { demoDownloadCancelled = true; return; } if (!desktop) throw new Error(unavailable); await invoke('cancel'); }
export async function chooseApks(): Promise<string[]> {
  if (demo) return ['C:\\Applications\\pureTV-0.1.5.apk'];
  if (!desktop) throw new Error(unavailable);
  return invoke<string[]>('choose_apks');
}
export async function chooseAdb(): Promise<string | null> {
  if (demo) return 'C:\\platform-tools\\adb.exe';
  if (!desktop) throw new Error(unavailable);
  return invoke<string | null>('choose_adb');
}
export async function platformToolsInfo(): Promise<PlatformToolsInfo> {
  if (demo) return { version: '37.0.1', platform: 'demo', downloadBytes: 16110554, installed: demoToolsInstalled, supported: true, message: '演示模式，不会下载文件' };
  if (!desktop) throw new Error(unavailable);
  return invoke<PlatformToolsInfo>('platform_tools_info');
}
export async function installPlatformTools(onProgress: (progress: DownloadProgress) => void, forceDownload=false): Promise<Snapshot> {
  if (demo) {
    if (sample.device) throw new Error('请先断开当前电视，再配置 ADB');
    demoDownloadCancelled = false;
    for (const downloaded of [0, 8055277, 16110554]) {
      onProgress({ stage: 'downloading', downloaded, total: 16110554 });
      await new Promise(resolve => setTimeout(resolve, 250));
      if (demoDownloadCancelled) throw new Error('演示下载已取消，未下载真实文件');
    }
    demoToolsInstalled = true; sample.adbAvailable = true; sample.adbPath = '演示 / 已下载工具 / adb';
    sample.message = '演示配置完成，未下载真实文件'; return copy();
  }
  if (!desktop) throw new Error(unavailable);
  const progress = new Channel<DownloadProgress>(onProgress);
  return invoke<Snapshot>('install_platform_tools', { acceptedLicense: true, onProgress: progress, ...(forceDownload?{forceDownload:true}:{}) });
}
export async function openResource(resource: 'catalog' | 'market' | 'repository' | 'releases' | 'platformTools' | 'platformToolsLicense'): Promise<void> {
  if (demo || !desktop) {
    const url = resource === 'repository' ? 'https://github.com/ecojust/pureTV' : resource === 'market' ? 'https://gitee.com/juzisang331/pure-tv-store' : resource === 'catalog' ? 'https://github.com/ecojust/pureTV/tree/master/resource' : resource === 'releases' ? 'https://github.com/ecojust/pureTV/releases' : resource === 'platformToolsLicense' ? 'https://developer.android.com/studio/terms' : 'https://developer.android.com/tools/releases/platform-tools';
    window.open(url, '_blank', 'noopener,noreferrer'); return;
  }
  await invoke('open_resource', { resource });
}

export async function getPackageInsight(packageName: string, refresh = false): Promise<PackageInsight> {
  if (demo) {
    await new Promise(resolve => setTimeout(resolve, 180));
    const found = packageName === 'com.vendor.recommendations';
    return { packageName, found, description: found ? 'Demo recommendation service. This is simulated reference data, not an assessment of a real television package.' : null, removal: found ? 'Recommended' : null, risk: found ? 'low' : 'unknown', list: null, sourceName: 'UAD-ng (demo)', sourceUrl: 'https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation/blob/main/resources/assets/uad_lists.json', licenseUrl: 'https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation/blob/main/LICENSE', fetchedAt: Date.now(), stale: false, warning: null };
  }
  if (!desktop) throw new Error(unavailable);
  return invoke<PackageInsight>('get_package_insight', { packageName, refresh });
}

export async function openPackageResource(packageName: string, resource: 'source' | 'search'): Promise<void> {
  if (demo || !desktop) {
    if (packageName.length > 255 || !/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*$/.test(packageName)) throw new Error('无效的应用包名');
    const url = resource === 'source' ? 'https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation/blob/main/resources/assets/uad_lists.json' : `https://www.bing.com/search?q=${encodeURIComponent('"' + packageName + '" Android package uninstall')}`;
    window.open(url, '_blank', 'noopener,noreferrer'); return;
  }
  await invoke('open_package_resource', { packageName, resource });
}

export interface McpInfo { config: { mcpServers: Record<string, { command: string; args: string[] }> }; sessionPath: string }
export interface McpOperation { running: boolean; tool: string; snapshot?: Snapshot; error?: string; launcherResult?: import('./types').LauncherLayoutInfo; marketResult?: MarketEventResult }
export async function mcpInfo(): Promise<McpInfo | null> {
  if (!desktop || demo) return null;
  return invoke<McpInfo>('mcp_info');
}
export async function watchMcp(operation: (value: McpOperation) => void, progress: (value: DownloadProgress) => void, marketProgress?: (value: MarketProgress) => void): Promise<void> {
  if (!desktop || demo) return;
  await listen<McpOperation>('mcp-operation', event => operation(event.payload));
  await listen<DownloadProgress>('mcp-progress', event => progress(event.payload));
  if (marketProgress) await listen<MarketProgress>('mcp-market-progress', event => marketProgress(event.payload));
}

const demoMarket: MarketCatalog = {
  sourceUrl: 'https://gitee.com/juzisang331/pure-tv-store', revision: 'demo', fetchedAt: Date.now(), stale: false,
  items: [
    {id: 'apps/demo/Demo-Music-1.0.apk', kind: 'app', name: 'Demo Music', version: '1.0', fileName: 'Demo-Music-1.0.apk', bytes: 4194304, blobSha: 'demo-music', folderUrl: ''},
    {id: 'launcher/demo/Demo-Home-1.0.apk', kind: 'launcher', name: 'Demo Home', version: '1.0', fileName: 'Demo-Home-1.0.apk', bytes: 786432, blobSha: 'demo-home', folderUrl: ''},
  ],
};
export async function getMarketCatalog(refresh = false, onProgress?: (progress: MarketProgress) => void): Promise<MarketCatalog> {
  if (demo) { onProgress?.({stage: 'catalog', downloaded: 0, total: 0}); return structuredClone(demoMarket); }
  if (!desktop) throw new Error(unavailable);
  return invoke<MarketCatalog>('get_market_catalog', {refresh, onProgress: new Channel<MarketProgress>(onProgress || (() => {}))});
}
export async function marketItem(operation: 'download' | 'install', id: string, revision: string, onProgress: (progress: MarketProgress) => void): Promise<MarketResult> {
  if (demo) {
    const item = demoMarket.items.find(item => item.id === id);
    if (!item) throw new Error('Market item not found');
    demoDownloadCancelled = false;
    for (const downloaded of [0, Math.floor(item.bytes / 2), item.bytes]) {
      onProgress({stage: 'downloading', downloaded, total: item.bytes, itemId: id});
      await new Promise(resolve => setTimeout(resolve, 250));
      if (demoDownloadCancelled) throw new Error('演示下载已取消，未下载真实文件');
    }
    const path = `/demo/market/${item.fileName}`;
    if (operation === 'install') {
      onProgress({stage: 'installing', downloaded: item.bytes, total: item.bytes, itemId: id});
      return {operation, download: {item, path}, installed: true, snapshot: await simulate({action: 'install', paths: [path]})};
    }
    return {operation, download: {item, path}, installed: false};
  }
  if (!desktop) throw new Error(unavailable);
  return invoke<MarketResult>(operation === 'download' ? 'download_market_item' : 'install_market_item', {id, revision, onProgress: new Channel<MarketProgress>(onProgress)});
}
export async function launcherExecute(request: import('./types').LauncherRequest): Promise<import('./types').LauncherLayoutInfo> {
  if (!desktop || demo) throw new Error('请在真实桌面管理器中连接电视，读取启动器布局接口。');
  return invoke('launcher_execute', { request });
}
export async function chooseLauncherJson(): Promise<string | null> {
  if (!desktop || demo) throw new Error('请在桌面管理器中选择 layout.json。');
  return invoke('choose_launcher_json');
}

export async function launcherCovers(): Promise<Record<string,string>> { if(!desktop || demo)return {}; return invoke('get_launcher_covers'); }
export async function chooseLauncherCover(key:string, remove=false): Promise<Record<string,string>> { return invoke('choose_launcher_cover',{key,remove}); }
export async function chooseLauncherApks(): Promise<{path:string;cover?:string|null;homeBackground?:string|null;homeBackgroundColor?:string|null}[]> { if(demo)return [{path:'pureTV.apk'}]; return invoke('choose_launcher_apks'); }

export async function adoptLauncherCover(key:string,apkPath:string):Promise<Record<string,string>> {return invoke('choose_launcher_cover',{key,apkPath});}

export interface InterfacePreferences {locale?:string|null;theme?:string|null}
export async function interfacePreferences():Promise<InterfacePreferences> {if(!desktop || demo)return {};return invoke('get_interface_preferences');}
export async function setInterfacePreferences(preferences:InterfacePreferences,onlyIfUnset=false):Promise<InterfacePreferences> {if(!desktop || demo)return preferences;return invoke('set_interface_preferences',{preferences,onlyIfUnset});}
export async function watchInterfacePreferences(callback:(value:InterfacePreferences)=>void):Promise<void> {if(!desktop || demo)return;await listen<InterfacePreferences>('interface-preferences',event=>callback(event.payload));}

export async function localNetwork():Promise<LocalNetworkInfo> {
 if(demo)return structuredClone(sample.localNetwork || {addresses:[],error:null});
 if(!desktop)throw new Error(unavailable);
 return invoke<LocalNetworkInfo>('get_local_network');
}
