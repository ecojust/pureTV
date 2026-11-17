import { t, ui, message, locale } from './i18n';
import * as api from './bridge';
import type { PackageInfo, PackageInsight, Snapshot } from './types';

const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const closeIcon = '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>';
const localPurposes: Record<string, string> = {
  android: 'Android 系统框架，提供应用运行所需的核心系统资源。',
  'com.android.systemui': '系统界面组件，负责系统导航、通知及部分电视交互界面。',
  'com.android.settings': 'Android 系统设置，管理网络、应用、账号及设备选项。',
  'com.android.tv.settings': 'Android TV 系统设置，管理电视网络、显示、应用及设备选项。',
  'com.android.providers.downloads': '系统下载管理服务，供浏览器和其他应用管理下载任务。',
  'com.android.providers.media': '系统媒体资料库，供其他应用查找设备中的音频、视频和图片。',
  'com.ecojust.puretv': 'pureTV 电视桌面，提供应用入口与可编辑的首页布局。',
  'com.ecojust.webtv': 'WebTV 电视直播播放器，用于播放直播频道与 M3U 播放列表。',
  'com.ecojust.usedcartv': '极品二手车赛车游戏，支持手机手柄与本地多人竞速。',
};
const riskLabels: Record<PackageInsight['risk'], string> = {
  low: '较低风险', medium: '中等风险', high: '高风险', critical: '极高风险', unknown: '风险未知',
};
const riskReasons: Record<PackageInsight['risk'], string> = {
  low: '社区将此包列为 Recommended。通常不影响主要系统功能，但会失去该应用的功能，仍需核对当前电视的用途和依赖。',
  medium: '社区将此包列为 Advanced。卸载可能影响部分功能、默认应用或替代应用配置。',
  high: '社区将此包列为 Expert。卸载可能破坏重要功能，需了解其依赖及恢复方式。',
  critical: '社区将此包列为 Unsafe。卸载可能影响关键系统功能或正常启动。',
  unknown: '现有资料不足以评估卸载影响，不能据此判断可以安全卸载。',
};

/** Read-only package lookup, with its own lifecycle rather than the ADB operation dialog. */
export class PackageInfoDialog {
  private readonly dialog = document.createElement('dialog');
  private packageName = '';
  private target = '';
  private generation = 0;
  private loading = false;
  private result: PackageInsight | null = null;
  private error = '';
  private linkError = '';
  private opener: HTMLElement | null = null;
  private markup = '';

  constructor(private readonly snapshot: () => Snapshot) {
    this.dialog.className = 'modal package-info-dialog';
    this.dialog.setAttribute('aria-labelledby', 'package-info-title');
    document.body.append(this.dialog);
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
    this.dialog.addEventListener('close', () => { if (!this.dialog.open) this.invalidate(); });
    this.dialog.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-package-info-action]');
      if (!button || button.disabled) return;
      const action = button.dataset.packageInfoAction;
      if (action === 'close') this.close();
      else if (action === 'retry') void this.lookup(true);
      else if (action === 'source' || action === 'search') void this.openResource(action);
    });
  }

  open(packageName: string, opener: HTMLElement): void {
    if (!this.snapshot().packages.some(p => p.packageName === packageName)) return;
    this.generation++;
    this.packageName = packageName;
    this.target = this.deviceKey();
    this.opener = opener;
    this.result = null; this.error = ''; this.linkError = ''; this.loading = true;
    this.render();
    if (!this.dialog.open) this.dialog.showModal();
    this.dialog.querySelector<HTMLButtonElement>('[data-package-info-action="close"]')?.focus();
    void this.lookup(false);
  }

  sync(): void {
    if (!this.dialog.open) return;
    if (!this.current()) { this.close(); return; }
    this.render();
  }

  private deviceKey(): string {
    const device = this.snapshot().device;
    return JSON.stringify([device?.serial ?? null, device?.userId ?? null]);
  }

  private current(): PackageInfo | undefined {
    return this.target === this.deviceKey() ? this.snapshot().packages.find(p => p.packageName === this.packageName) : undefined;
  }

  private invalidate(): void {
    this.generation++; this.loading = false; this.packageName = ''; this.result = null;
  }

  private close(): void {
    const name = this.packageName, opener = this.opener;
    this.invalidate();
    this.dialog.close();
    if (opener?.isConnected) opener.focus();
    else Array.from(document.querySelectorAll<HTMLButtonElement>('[data-act="package-info"]')).find(button => button.dataset.pkg === name)?.focus();
  }

  private async lookup(refresh: boolean): Promise<void> {
    if (!this.current()) return;
    const generation = ++this.generation, packageName = this.packageName;
    this.loading = true; this.error = ''; this.linkError = ''; this.render();
    try {
      const result = await api.getPackageInsight(packageName, refresh);
      if (!this.accepts(generation)) return;
      if (result.packageName !== packageName) throw new Error(t('查询结果的包名不一致，请重试。'));
      this.result = result;
    } catch (error) {
      if (!this.accepts(generation)) return;
      this.result = null;
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      if (this.accepts(generation)) { this.loading = false; this.render(); }
    }
  }

  private accepts(generation: number): boolean {
    return generation === this.generation && this.dialog.open && !!this.current();
  }

  private async openResource(resource: 'source' | 'search'): Promise<void> {
    const generation = this.generation;
    try { await api.openPackageResource(this.packageName, resource); }
    catch (error) {
      if (!this.accepts(generation)) return;
      this.linkError = error instanceof Error ? error.message : String(error); this.render();
    }
  }

  private render(): void {
    const p = this.current(); if (!p) return;
    const result = this.result;
    const isHome = this.snapshot().defaultHome?.split('/')[0] === p.packageName;
    const protection = isHome ? t('当前默认启动器') : p.protectedReason ? message(p.protectedReason) : '';
    const risk = protection ? 'critical' : result?.risk ?? 'unknown';
    const state = this.loading ? 'loading' : this.error ? 'error' : result?.found ? 'loaded' : 'missing';
    const local = isHome ? t('当前电视的默认桌面，负责首页和应用启动入口。') : Object.hasOwn(localPurposes, p.packageName) ? t(localPurposes[p.packageName]) : '';
    const description = result?.found && result.description ? result.description : '';
    const updated = result?.fetchedAt && Number.isFinite(result.fetchedAt) ? new Date(result.fetchedAt).toLocaleString(locale()) : '';
    const content = ui`<header class="modal-heading"><h2 id="package-info-title">用途与卸载风险</h2><button type="button" class="icon-button" data-package-info-action="close" aria-label="关闭">${closeIcon}</button></header>
      <div class="package-info-identity"><strong>${esc(p.label || p.packageName)}</strong><code>${esc(p.packageName)}</code></div>
      <div class="package-info-content" data-package-info-content aria-busy="${this.loading}">
        <section class="package-risk-panel"><h3>卸载风险</h3><span class="package-risk" data-risk="${risk}">${esc(t(riskLabels[risk]))}${protection ? ` · ${t('受保护')}` : result?.found && risk !== 'unknown' ? ` · ${t('社区分类')}` : ''}</span>
          <p class="package-risk-reason">${protection ? `${esc(protection)} · ${t('卸载会影响电视的必要功能；此应用仍由管理器保护。')}` : esc(t(riskReasons[risk]))}</p></section>
        <section class="package-purpose-panel"><h3>用途</h3>${local ? `<p class="package-local-purpose">${esc(local)}</p><span class="package-info-caption">${t('内置说明')}</span>` : ''}
          ${description ? `<p class="package-purpose">${esc(description)}</p><span class="package-info-caption">${t('社区资料原文，未自动翻译')}</span>` : !local ? `<p class="package-purpose package-info-muted">${t(this.loading ? '等待包名查询结果。' : '暂未获得此包的用途说明。')}</p>` : ''}</section>
        <div data-package-info-state="${state}" role="status">${this.loading ? t('正在按包名查询资料…') : this.error ? `<strong>${t('查询失败')}</strong><p>${esc(message(this.error))}</p>` : !result?.found ? t('资料库未收录此包名；可继续搜索网页资料。') : t('已按完整包名匹配资料。')}</div>
        ${result?.stale ? `<p class="package-info-warning" role="status">${t('当前显示旧缓存，在线资料更新未成功。')} ${esc(message(result.warning || ''))}</p>` : result?.warning ? `<p class="package-info-warning">${esc(message(result.warning))}</p>` : ''}
        ${result ? `<dl class="package-info-source"><dt>${t('资料来源')}</dt><dd>${esc(result.sourceName)}</dd>${result.removal ? `<dt>${t('原始分类')}</dt><dd>${esc(result.removal)}</dd>` : ''}${updated ? `<dt>${t('资料获取时间')}</dt><dd>${esc(updated)}</dd>` : ''}<dt>${t('来源地址')}</dt><dd><span>${esc(result.sourceUrl)}</span></dd></dl><p class="package-info-caption">${t('社区资料由 UAD-ng 提供，采用 GPL-3.0 许可；来源页面可查看原始资料及许可。')}</p>` : ''}
        <p class="hint">社区资料可能不适用于当前机型和固件。风险说明仅供判断参考，不会解除应用保护或执行卸载。</p>
        ${api.demo ? `<p class="package-info-warning">${t('演示资料，仅用于预览；不会联网查询。')}</p>` : ''}
        ${this.linkError ? `<p class="package-info-warning" role="alert">${esc(message(this.linkError))}</p>` : ''}
      </div>
      <footer class="package-info-actions"><button type="button" data-package-info-action="source">查看资料来源 ↗</button><button type="button" data-package-info-action="search">网页搜索包名 ↗</button><button type="button" data-package-info-action="retry"${this.loading ? ' disabled' : ''}>${t(this.error ? '重试查询' : '刷新资料')}</button><button type="button" class="primary" data-package-info-action="close">关闭</button></footer>`;
    if (content === this.markup) return;
    const active = document.activeElement instanceof HTMLElement && this.dialog.contains(document.activeElement) ? document.activeElement.dataset.packageInfoAction : null;
    const scroll = this.dialog.querySelector<HTMLElement>('[data-package-info-content]')?.scrollTop ?? 0;
    this.dialog.innerHTML = content; this.markup = content;
    const area = this.dialog.querySelector<HTMLElement>('[data-package-info-content]'); if (area) area.scrollTop = scroll;
    if (active) this.dialog.querySelector<HTMLButtonElement>(`[data-package-info-action="${active}"]:not(:disabled)`)?.focus({preventScroll:true});
  }
}
