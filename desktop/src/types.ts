export interface Device { serial: string; model: string; androidVersion: string; userId: number; status: string }
export interface PackageInfo { apkSizeBytes?: number | null; packageName: string; label: string; system: boolean; enabled: boolean; installed: boolean; protectedReason: string | null }
export interface LauncherInfo { apkSizeBytes?: number | null; component: string; packageName: string; label: string; isDefault: boolean }
export interface HistoryEntry { id: string; timestamp: number; action: string; target: string; device: string; userId: number; success: boolean; message: string }
export interface PlatformToolsInfo {
  version: string; platform: string; downloadBytes: number; installed: boolean; supported: boolean; message: string;
}
export interface DownloadProgress {
  stage: 'downloading' | 'verifying' | 'extracting' | 'checking'; downloaded: number; total: number;
}
export interface SystemInfo {
  manufacturer: string | null; brand: string | null; sdkVersion: string | null; securityPatch: string | null;
  cpu: string | null; cpuAbi: string | null; memoryTotalBytes: number | null; memoryAvailableBytes: number | null;
  storageTotalBytes: number | null; storageAvailableBytes: number | null; displayResolution: string | null; uptimeSeconds: number | null; queriedAt: number;
}
export interface LocalNetworkInfo {addresses:{interfaceName:string;ip:string;prefixLength:number}[];error:string|null}
export interface Snapshot {
  localNetwork?: LocalNetworkInfo;
  lastConnection?: {host:string;port:number} | null;
  installResults?: {path: string; success: boolean; message: string}[];
  systemInfo?: SystemInfo | null;
  revision: number;
  adbPath: string | null; adbAvailable: boolean; device: Device | null;
  packages: PackageInfo[]; launchers: LauncherInfo[]; defaultHome: string | null;
  originalHome: string | null; history: HistoryEntry[]; message: string;
}
export type Request =
  | { action: 'refreshLocalNetwork' | 'getState' | 'refreshSystemInfo' | 'disconnect' | 'scan' | 'restoreHome' | 'clearHistory' }
  | { action: 'setAdbPath'; path: string }
  | { action: 'connect'; host: string; port: number }
  | { action: 'pair'; host: string; port: number; code: string }
  | { action: 'setEnabled'; packages: string[]; enabled: boolean }
  | { action: 'uninstall' | 'restore'; packages: string[] }
  | { action: 'install'; paths: string[] }
  | { action: 'setHome'; component: string };
export const emptySnapshot = (): Snapshot => ({ revision: 0, adbPath: null, adbAvailable: false, device: null, packages: [], launchers: [], defaultHome: null, originalHome: null, history: [], message: '' });
export interface LayoutFrame {x:number;y:number;width:number;height:number}
export interface LayoutGeometry {frame?:LayoutFrame;visible?:boolean;zIndex?:number}
export interface LayoutScene {background:LayoutGeometry & {color:string;image?:string};elements:(LayoutGeometry & {id:string;frame:LayoutFrame})[]}
export interface LayoutEntry extends LayoutGeometry { action?: string; packageName?: string; label?: string; icon?: string; color?: string }
export interface LauncherLayout { version: 2 | 3; home: {columns:number;items:LayoutEntry[];scene?:LayoutScene}; apps: {columns:number;items:LayoutEntry[];scene?:LayoutScene} }
export interface LauncherLayoutInfo { systemBasis?:{screen:{width:number;height:number};home:UnifiedComponent[];apps:UnifiedComponent[]}; backgrounds?:Record<string,string>; backgroundColors?:Record<string,string>; failedComponents?:string[]; serial?: string; userId?: number; supported: boolean; component?: string; message?: string; custom?: boolean; layout?: LauncherLayout|UnifiedLayout; apps?: {packageName: string; label: string; iconPng?: string}[] }
export type LauncherRequest = { action:'getLayout'|'getBackgrounds'|'resetLayout' } | { action:'applyLayout'; layout: LauncherLayout|UnifiedLayout };

export interface UnifiedComponent {id:string;name:string;frame:LayoutFrame;action:string;text:string;visible:boolean;icon:string;color?:string;textColor?:string;iconColor?:string;backgroundColor:string}
export interface UnifiedLayout {version:4|5;screen:{width:number;height:number};home:UnifiedPage;apps:UnifiedPage}

export interface UnifiedPage {users:UnifiedComponent[];system:UnifiedComponent[];background:{color:string;image?:string};navigation:Partial<Record<'up'|'down','home'|'apps'>>}
