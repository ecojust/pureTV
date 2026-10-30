import { t, ui, message, locale } from './i18n';
import { version as appVersion } from '../package.json';
import * as api from './bridge';
import type { ClientUpdateInfo, ClientUpdateProgress, ClientUpdateResult } from './types';

const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const closeIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>';
const updateIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 7a9 9 0 0 0-15-2L2 8m0-6v6h6M4 17a9 9 0 0 0 15 2l3-3m0 6v-6h-6"/></svg>';
const source = 'https://gitee.com/juzisang331/pure-tv-store';
const platforms: Record<string, string> = { 'windows-x64': 'Windows x64', 'macos-arm64': 'macOS · Apple Silicon', 'macos-x64': 'macOS · Intel', 'linux-x64': 'Linux x64' };
const formatBytes = (value: number): string => value >= 1048576 ? `${(value / 1048576).toFixed(1)} MiB` : `${Math.ceil(value / 1024)} KiB`;
function diagnostic(value: string): string {
  const prefix = '客户端更新未完成：';
  return value.startsWith(prefix) ? t(prefix) + message(value.slice(prefix.length)) : message(value);
}
interface Options {
  busy: () => boolean;
  setWorking: (working: boolean) => void;
  changed: () => void;
  refreshState: () => Promise<void>;
}

/** A self-update has a separate lifecycle and only starts after an explicit click. */
export class ClientUpdater {
  private readonly dialog = document.createElement('dialog');
  private info: ClientUpdateInfo | null = null;
  private previousResult: ClientUpdateResult | null = null;
  private checking = false;
  private started = false;
  private startedInstall = false;
  private checkedOnce = false;
  private checkPromise: Promise<void> | null = null;
  private generation = 0;
  private error = '';
  private linkError = '';
  private cancelled = false;
  private cancelRequested = false;
  private cancelError = '';
  private demoComplete = false;
  private handoff = false;
  private progress: ClientUpdateProgress | null = null;
  private opener: HTMLElement | null = null;
  private markup = '';
  working = false;

  constructor(private readonly options: Options) {
    this.dialog.className = 'modal client-update-dialog';
    this.dialog.setAttribute('aria-labelledby', 'client-update-title');
    this.dialog.tabIndex = -1;
    document.body.append(this.dialog);
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); if (!this.working) this.close(); });
    this.dialog.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-client-update-action]');
      if (!button || button.disabled) return;
      switch (button.dataset.clientUpdateAction) {
        case 'close': if (!this.working) this.close(); break;
        case 'check': void this.check(); break;
        case 'install': void this.install(); break;
        case 'cancel': void this.cancel(); break;
        case 'source': void api.openResource('market').catch(error => { this.linkError = this.errorText(error); this.changed(); }); break;
      }
    });
  }

  start(): void {
    if (this.started || (!api.desktop && !api.demo)) return;
    this.started = true;
    // The first connection screen can render immediately; no package download happens here.
    window.setTimeout(() => { if (!this.checkedOnce) void this.check(); }, 750);
    void api.clientUpdateResult().then(result => { if (!this.startedInstall) { this.previousResult = result; this.changed(); } }).catch(() => { /* An unavailable previous result never blocks checking. */ });
  }

  sidebar(): string {
    const available = this.info?.available && !this.error;
    const text = this.working ? t('查看更新进度') : this.checking ? t('正在检查更新…') : available ? ui`发现新版本 ${esc(this.info?.latestVersion)}` : this.error ? t('更新检查失败') : this.previousResult?.success === false ? t('查看更新结果') : t('检查更新');
    return `<button type="button" class="client-update-link${available ? ' has-update' : ''}${this.error || this.previousResult?.success === false ? ' update-error' : ''}" data-act="client-update"${!api.desktop && !api.demo ? ' disabled' : ''} aria-label="${t('检查 PureTV Manager 更新')}">${this.checking ? '<span class="spinner" aria-hidden="true"></span>' : updateIcon}<span>${text}</span>${available ? '<i class="client-update-dot" aria-hidden="true"></i>' : ''}</button>`;
  }

  open(opener?: HTMLElement): void {
    this.opener = opener || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    this.render();
    if (!this.dialog.open) this.dialog.showModal();
    this.dialog.querySelector<HTMLButtonElement>('[data-client-update-action="close"]:not(:disabled),[data-client-update-action="cancel"]:not(:disabled)')?.focus();
    if (!this.info && !this.error && !this.checking) void this.check();
  }

  sync(): void { if (this.dialog.open) this.render(); }

  private close(): void {
    this.dialog.close();
    if (this.opener?.isConnected) this.opener.focus({preventScroll: true});
    else document.querySelector<HTMLButtonElement>('[data-act="client-update"]')?.focus({preventScroll: true});
  }

  private changed(): void { this.render(); this.options.changed(); }
  private errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }

  private check(): Promise<void> {
    if (this.working || (!api.desktop && !api.demo)) return Promise.resolve();
    if (this.checkPromise) return this.checkPromise;
    const generation = ++this.generation;
    this.checkedOnce = true;
    this.checking = true; this.error = ''; this.linkError = ''; this.cancelled = false; this.demoComplete = false; this.changed();
    this.checkPromise = (async () => {
      try {
        const info = await api.checkClientUpdate();
        if (generation !== this.generation) return;
        this.info = info;
      } catch (error) {
        if (generation !== this.generation) return;
        this.info = null; this.error = this.errorText(error);
      } finally {
        if (generation === this.generation) { this.checking = false; this.checkPromise = null; this.changed(); }
      }
    })();
    return this.checkPromise;
  }

  private async install(): Promise<void> {
    const info = this.info;
    if (this.working || this.checking || this.options.busy() || !info?.supported || !info.available || info.status !== 'available' || !info.latestVersion || !info.revision || this.error) return;
    const generation = ++this.generation;
    this.startedInstall = true; this.working = true; this.handoff = false; this.cancelRequested = false; this.cancelError = ''; this.cancelled = false; this.demoComplete = false; this.error = ''; this.previousResult = null;
    this.progress = {stage: 'downloading', downloaded: 0, total: info.bytes || 0};
    this.options.setWorking(true); this.changed();
    try {
      await api.installClientUpdate(info.latestVersion, info.revision, value => {
        if (generation !== this.generation || !this.working) return;
        this.progress = value;
        if (value.stage === 'installing') { this.handoff = true; this.cancelRequested = false; }
        this.changed();
      });
      if (generation !== this.generation) return;
      if (api.demo) {
        this.working = false; this.demoComplete = true; this.progress = null; this.options.setWorking(false);
      } else {
        // Native handoff returning only means the installer has been launched.
        // Successful installation is verified by the next process, not this one.
        this.handoff = true; this.progress = {stage: 'installing', downloaded: info.bytes || 0, total: info.bytes || 0};
      }
    } catch (error) {
      if (generation !== this.generation) return;
      const text = this.errorText(error);
      this.cancelled = this.cancelRequested && /取消|cancel/i.test(text);
      this.error = this.cancelled ? '' : text;
      this.working = false; this.handoff = false; this.progress = null; this.options.setWorking(false);
      await this.options.refreshState();
    } finally {
      if (generation === this.generation) { this.cancelRequested = false; this.changed(); }
    }
  }

  private async cancel(): Promise<void> {
    if (!this.working || this.handoff || this.cancelRequested) return;
    this.cancelRequested = true; this.cancelError = ''; this.changed();
    try { await api.cancelClientUpdate(); }
    catch (error) { this.cancelRequested = false; this.cancelError = this.errorText(error); this.changed(); }
  }

  private stageLabel(): string {
    if (this.cancelRequested) return t('正在取消并清理下载…');
    return t({checking: '正在检查更新…', downloading: '正在下载客户端…', verifying: '正在校验安装包…', preparing: '正在准备安装…', installing: '正在退出并安装…'}[this.progress?.stage || 'checking']);
  }

  private render(): void {
    const info = this.info;
    const state = this.working ? 'installing' : this.checking ? 'checking' : this.error ? 'error' : this.cancelled ? 'cancelled' : this.demoComplete ? 'demoComplete' : info?.status || 'idle';
    const status = this.working ? this.stageLabel() : this.checking ? t('正在从 Gitee 检查客户端版本…') : this.error ? t('无法检查或完成更新') : this.cancelled ? t('更新已取消，当前客户端仍可使用。') : this.demoComplete ? t('演示流程已完成，未下载或安装任何文件。') : info?.status === 'available' ? t('有适用于当前系统的新版本。') : info?.status === 'upToDate' ? t('当前客户端无需更新。') : info?.status === 'notPublished' ? t('更新仓库尚未提供当前系统的安装包。') : info?.status === 'unsupported' ? t('当前系统暂不支持自动更新。') : t('检查 Gitee 仓库中的客户端版本。');
    const platform = info?.platform || '';
    const method = platform.startsWith('windows-') ? t('Windows 将运行安装程序；便携版会安装为标准安装版。') : platform.startsWith('macos-') ? t('macOS 将替换当前应用并重新打开。') : platform.startsWith('linux-') ? t('Linux 将通过系统包管理器安装，可能需要管理员授权。') : '';
    const progress = this.progress;
    const total = progress?.total && Number.isFinite(progress.total) ? Math.max(0, progress.total) : 0;
    const downloaded = progress && Number.isFinite(progress.downloaded) ? Math.max(0, Math.min(progress.downloaded, total)) : 0;
    const installable = info?.supported && info.available && info.status === 'available' && !!info.latestVersion && !!info.revision;
    const locked = this.options.busy() && !this.working;
    const content = ui`<header class="modal-heading"><h2 id="client-update-title">Manager 更新</h2><button type="button" class="icon-button" data-client-update-action="close" aria-label="关闭"${this.working ? ' disabled' : ''}>${closeIcon}</button></header>
      <div class="client-update-content" data-client-update-content>
        <p class="client-update-status" data-client-update-state="${state}" role="status">${this.checking || this.working ? '<span class="spinner" aria-hidden="true"></span>' : ''}${esc(status)}</p>
        ${this.error ? `<p class="client-update-error" role="alert">${esc(diagnostic(this.error))}</p>` : ''}
        <dl class="client-update-details"><dt>当前版本</dt><dd>${esc(info?.currentVersion || appVersion)}</dd>${info?.latestVersion ? `<dt>${t('仓库版本')}</dt><dd>${esc(info.latestVersion)}</dd>` : ''}${platform ? `<dt>${t('适用系统')}</dt><dd>${esc(platforms[platform] || platform)}</dd>` : ''}${info?.bytes != null ? `<dt>${t('下载大小')}</dt><dd>${esc(formatBytes(info.bytes))}</dd>` : ''}${info?.fileName ? `<dt>${t('安装包')}</dt><dd>${esc(info.fileName)}</dd>` : ''}<dt>更新来源</dt><dd>${esc(info?.sourceUrl || source)}</dd>${info?.checkedAt ? `<dt>${t('检查时间')}</dt><dd>${esc(new Date(info.checkedAt).toLocaleString(locale()))}</dd>` : ''}</dl>
        ${this.working && progress ? `<div class="client-update-progress" data-client-update-stage="${progress.stage}">${progress.stage === 'downloading' && total > 0 ? `<progress data-client-update-meter aria-label="${t('客户端更新下载进度')}" max="${total}" value="${downloaded}"></progress><span>${esc(formatBytes(downloaded))} / ${esc(formatBytes(total))}</span>` : ''}</div>` : ''}
        ${installable ? `<p class="client-update-method">${esc(method)}</p><p class="hint">${esc(t('点击“下载并安装”后，校验通过会关闭 Manager、安装新版本并重新打开。系统可能要求确认授权。'))}</p>` : ''}
        ${locked && installable ? t('<p class="client-update-warning">请等待当前操作完成，再安装客户端更新。</p>') : ''}
        ${this.cancelError ? `<p class="client-update-error" role="alert">${esc(diagnostic(this.cancelError))}</p>` : ''}
        ${this.previousResult ? `<section class="client-update-result${this.previousResult.success ? '' : ' update-result-error'}" data-client-update-result="${this.previousResult.success ? 'success' : 'error'}"><h3>${t('上次更新结果')}</h3><p>${esc(diagnostic(this.previousResult.message))}</p><code>${esc(this.previousResult.version)}</code></section>` : ''}
        ${api.demo ? t('<p class="client-update-warning">演示模式：版本和进度为模拟数据，不会下载、安装或退出程序。</p>') : ''}
        ${this.linkError ? `<p class="client-update-error" role="alert">${esc(diagnostic(this.linkError))}</p>` : ''}
      </div>
      <footer class="client-update-actions"><button type="button" data-client-update-action="source"${this.working ? ' disabled' : ''}>查看 Gitee 仓库 ↗</button>${this.working ? `<button type="button" data-client-update-action="cancel"${this.handoff || this.cancelRequested ? ' disabled' : ''}>${t(this.handoff ? '正在安装' : this.cancelRequested ? '正在取消' : '取消更新')}</button>` : `<button type="button" data-client-update-action="check"${this.checking ? ' disabled' : ''}>${t(this.error ? '重新检查' : '检查更新')}</button>${installable ? `<button type="button" class="primary" data-client-update-action="install"${locked || this.checking || !!this.error ? ' disabled' : ''}>${t('下载并安装')}</button>` : ''}<button type="button" data-client-update-action="close">${t('关闭')}</button>`}</footer>`;
    if (content === this.markup) return;
    const active = document.activeElement instanceof HTMLElement && this.dialog.contains(document.activeElement) ? document.activeElement.dataset.clientUpdateAction : null;
    const scroll = this.dialog.querySelector<HTMLElement>('[data-client-update-content]')?.scrollTop || 0;
    this.dialog.innerHTML = content; this.markup = content;
    const area = this.dialog.querySelector<HTMLElement>('[data-client-update-content]'); if (area) area.scrollTop = scroll;
    if (active && this.dialog.open) (this.dialog.querySelector<HTMLButtonElement>(`[data-client-update-action="${active}"]:not(:disabled)`) || this.dialog.querySelector<HTMLButtonElement>('[data-client-update-action]:not(:disabled)') || this.dialog).focus({preventScroll: true});
  }
}
