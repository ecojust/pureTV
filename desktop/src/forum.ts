import { t, ui, message, locale } from './i18n';
import * as api from './bridge';
import type { ForumPage, ForumPost, ForumPostDetail, ForumRepliesPage, ForumReply } from './types';

const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const forumIcon = '<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9H13a8.5 8.5 0 0 1 8 8v.5Z"/></svg>';
const replyIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 4h16v12H9l-5 4V4Z"/></svg>';
const refreshIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 7a9 9 0 0 0-15-2L2 8m0-6v6h6M4 17a9 9 0 0 0 15 2l3-3m0 6v-6h-6"/></svg>';
const externalIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>';
const disabled = (value: boolean): string => value ? ' disabled' : '';
const dateLabel = (value: string | number): string => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(locale()) : t('时间未知');
};
const stateLabels: Record<string, string> = { open: '讨论中', progressing: '处理中', closed: '已关闭', rejected: '已拒绝', unknown: '状态未知' };

/** Read-only forum browsing has its own request lifecycle and never reserves ADB. */
export class Forum {
  private active = false;
  private generation = 0;
  private loading = false;
  private loadingPage = 1;
  private data: ForumPage | null = null;
  private error = '';
  private linkError = '';
  private linkGeneration = 0;
  private detailNumber: string | null = null;
  private detail: ForumPostDetail | null = null;
  private replies: ForumRepliesPage | null = null;
  private postLoading = false;
  private repliesLoading = false;
  private postError = '';
  private repliesError = '';
  private postGeneration = 0;
  private repliesGeneration = 0;

  constructor(private readonly changed: () => void) {}

  syncActive(active: boolean): void {
    if (active === this.active) return;
    this.active = active;
    const generation = ++this.generation;
    this.loading = false;
    if (!active) this.clearDetail();
    if (active && (api.desktop || api.demo)) queueMicrotask(() => {
      if (this.active && this.generation === generation) void this.load(this.data?.page || 1, false);
    });
  }

  async action(button: HTMLButtonElement): Promise<void> {
    if (!this.active || button.disabled) return;
    switch (button.dataset.forumAction) {
      case 'refresh': await this.load(this.data?.page || 1, true); break;
      case 'previous': if (this.data && this.data.page > 1) await this.load(this.data.page - 1, false); break;
      case 'next': if (this.data?.hasMore) await this.load(this.data.page + 1, false); break;
      case 'create': await this.open(() => api.openResource('forumCreate')); break;
      case 'open': {
        const number = button.dataset.forumNumber;
        if (number && this.data?.posts.some(post => post.number === number)) this.showDetail(number);
        break;
      }
      case 'reply': {
        const number = button.dataset.forumNumber;
        if (number && (this.detailNumber === number || this.data?.posts.some(post => post.number === number))) await this.open(() => api.openForumPost(number));
        break;
      }
      case 'back': this.back(); break;
      case 'refresh-detail': if (this.detailNumber) await Promise.all([this.loadPost(this.detailNumber, true), this.loadReplies(this.detailNumber, this.replies?.page || 1, true)]); break;
      case 'refresh-replies': if (this.detailNumber) await this.loadReplies(this.detailNumber, this.replies?.page || 1, true); break;
      case 'replies-previous': if (this.detailNumber && this.replies && this.replies.page > 1) await this.loadReplies(this.detailNumber, this.replies.page - 1, false); break;
      case 'replies-next': if (this.detailNumber && this.replies?.hasMore) await this.loadReplies(this.detailNumber, this.replies.page + 1, false); break;
    }
  }

  private redraw(): void {
    if (!this.active) return;
    const element = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const action = element?.closest<HTMLButtonElement>('[data-forum-action]');
    const focusedPanel = element?.classList.contains('forum-panel');
    const focusedTitle = element?.classList.contains('forum-detail-title');
    const key = action ? { action: action.dataset.forumAction, number: action.dataset.forumNumber } : null;
    this.changed();
    if (focusedTitle) document.querySelector<HTMLElement>('.forum-detail-title')?.focus({ preventScroll: true });
    if (key || focusedPanel) {
      const button = key && [...document.querySelectorAll<HTMLButtonElement>('[data-forum-action]')].find(button => !button.disabled && button.dataset.forumAction === key.action && button.dataset.forumNumber === key.number);
      (button || document.querySelector<HTMLElement>('.forum-panel'))?.focus({ preventScroll: true });
    }
  }

  private async load(page: number, refresh: boolean): Promise<void> {
    if (this.loading || !this.active || this.detailNumber || (!api.desktop && !api.demo)) return;
    const generation = ++this.generation;
    this.loading = true; this.loadingPage = page; this.error = ''; this.linkError = ''; this.redraw();
    try {
      const data = await api.getForumPosts(page, refresh);
      if (!this.active || generation !== this.generation) return;
      if (data.page !== page) throw new Error('论坛返回的帖子数据无效，请稍后重试');
      this.data = data;
    } catch (error) {
      if (this.active && generation === this.generation) this.error = error instanceof Error ? error.message : String(error);
    } finally {
      if (this.active && generation === this.generation) { this.loading = false; this.redraw(); }
    }
  }

  private clearDetail(): void {
    this.detailNumber = null;
    this.detail = null; this.replies = null;
    this.postLoading = false; this.repliesLoading = false;
    this.postError = ''; this.repliesError = ''; this.linkError = '';
    ++this.postGeneration; ++this.repliesGeneration;
  }

  private showDetail(number: string): void {
    ++this.generation;
    this.loading = false;
    this.clearDetail();
    this.detailNumber = number;
    this.redraw();
    document.querySelector<HTMLElement>('.forum-detail-title')?.focus({ preventScroll: true });
    void Promise.all([this.loadPost(number, false), this.loadReplies(number, 1, false)]);
  }

  private back(): void {
    const number = this.detailNumber;
    ++this.generation;
    this.clearDetail();
    this.redraw();
    [...document.querySelectorAll<HTMLButtonElement>('[data-forum-action="open"]')].find(button => button.dataset.forumNumber === number)?.focus({ preventScroll: true });
  }

  private currentDetail(number: string, generation: number): boolean {
    return this.active && this.detailNumber === number && this.generation === generation;
  }

  private async loadPost(number: string, refresh: boolean): Promise<void> {
    if (this.postLoading || !this.active || this.detailNumber !== number) return;
    const generation = this.generation, request = ++this.postGeneration;
    this.postLoading = true; this.postError = ''; this.redraw();
    try {
      const detail = await api.getForumPost(number, refresh);
      if (!this.currentDetail(number, generation) || request !== this.postGeneration) return;
      if (detail.post.number !== number) throw new Error('论坛返回的帖子详情无效，请稍后重试');
      this.detail = detail;
    } catch (error) {
      if (this.currentDetail(number, generation) && request === this.postGeneration) this.postError = error instanceof Error ? error.message : String(error);
    } finally {
      if (this.currentDetail(number, generation) && request === this.postGeneration) { this.postLoading = false; this.redraw(); }
    }
  }

  private async loadReplies(number: string, page: number, refresh: boolean): Promise<void> {
    if (this.repliesLoading || !this.active || this.detailNumber !== number) return;
    const generation = this.generation, request = ++this.repliesGeneration;
    this.repliesLoading = true; this.repliesError = ''; this.redraw();
    try {
      const replies = await api.getForumReplies(number, page, refresh);
      if (!this.currentDetail(number, generation) || request !== this.repliesGeneration) return;
      if (replies.number !== number || replies.page !== page) throw new Error('论坛返回的回复数据无效，请稍后重试');
      this.replies = replies;
    } catch (error) {
      if (this.currentDetail(number, generation) && request === this.repliesGeneration) this.repliesError = error instanceof Error ? error.message : String(error);
    } finally {
      if (this.currentDetail(number, generation) && request === this.repliesGeneration) { this.repliesLoading = false; this.redraw(); }
    }
  }

  private async open(action: () => Promise<void>): Promise<void> {
    const generation = this.generation;
    const linkGeneration = ++this.linkGeneration;
    this.linkError = '';
    this.redraw();
    try { await action(); }
    catch (error) {
      if (this.active && generation === this.generation && linkGeneration === this.linkGeneration) {
        this.linkError = error instanceof Error ? error.message : String(error);
        this.redraw();
      }
    }
  }

  private post(post: ForumPost): string {
    const status = Object.prototype.hasOwnProperty.call(stateLabels, post.state) ? t(stateLabels[post.state]) : post.state || t('状态未知');
    const tone = ['open', 'progressing', 'closed', 'rejected'].includes(post.state) ? post.state : 'unknown';
    const author = post.author || t('未知作者');
    return `<li class="forum-post" data-forum-number="${esc(post.number)}"><div class="forum-post-main"><div class="forum-post-heading"><span class="forum-state forum-state-${tone}">${esc(status)}</span><button type="button" class="forum-post-title" data-forum-action="open" data-forum-number="${esc(post.number)}">${esc(post.title)}</button></div><div class="forum-post-meta"><span class="forum-author" title="${esc(t('作者'))}">${esc(author)}</span><span class="forum-number">#${esc(post.number)}</span><span>${esc(t('更新于'))} ${esc(dateLabel(post.updatedAt))}</span></div>${post.labels.length ? `<div class="forum-labels">${post.labels.slice(0, 3).map(label => `<span class="forum-label" title="${esc(label)}">${esc(label)}</span>`).join('')}${post.labels.length > 3 ? `<span class="forum-label" title="${esc(post.labels.slice(3).join(' · '))}">+${post.labels.length - 3}</span>` : ''}</div>` : ''}</div><div class="forum-post-actions"><span class="forum-replies" aria-label="${esc(t('回复数'))}: ${esc(post.comments)}">${replyIcon}${esc(post.comments)}</span><button type="button" class="small forum-reply-button" data-forum-action="reply" data-forum-number="${esc(post.number)}"${disabled(api.demo)}${api.demo ? ` title="${esc(t('演示帖子仅用于预览，不能打开原帖。'))}"` : ''}>${esc(t('去回复'))}${externalIcon}</button></div></li>`;
  }

  private reply(reply: ForumReply): string {
    return `<li class="forum-reply" data-forum-reply-id="${esc(reply.id)}"><div class="forum-post-meta"><strong class="forum-author">${esc(reply.author || t('未知作者'))}</strong><span>${esc(t('发表于'))} ${esc(dateLabel(reply.createdAt))}</span>${reply.updatedAt && reply.updatedAt !== reply.createdAt ? `<span>${esc(t('更新于'))} ${esc(dateLabel(reply.updatedAt))}</span>` : ''}</div><div class="forum-reply-body">${reply.body ? esc(reply.body) : esc(t('这条回复没有正文。'))}</div></li>`;
  }

  private renderDetail(): string {
    const number = this.detailNumber!;
    const detail = this.detail;
    const post = detail?.post || this.data?.posts.find(post => post.number === number);
    const replies = this.replies;
    const state = post?.state || 'unknown';
    const status = Object.prototype.hasOwnProperty.call(stateLabels, state) ? t(stateLabels[state]) : state;
    const tone = ['open', 'progressing', 'closed', 'rejected'].includes(state) ? state : 'unknown';
    return ui`<section class="panel forum-panel forum-detail" data-forum-number="${esc(number)}" tabindex="-1" aria-label="帖子详情"><div class="forum-toolbar forum-detail-toolbar"><button type="button" data-forum-action="back">返回列表</button><div class="toolbar-buttons"><button type="button" data-forum-action="refresh-detail"${disabled(this.postLoading || this.repliesLoading)}>${refreshIcon}刷新帖子</button><button type="button" class="primary" data-forum-action="reply" data-forum-number="${esc(number)}"${disabled(api.demo)}>去回复${externalIcon}</button></div></div>
      ${this.linkError ? `<p class="forum-error forum-link-error" role="alert">${esc(message(this.linkError))}</p>` : ''}
      <div class="forum-detail-scroll" data-scroll="forum-detail-${esc(number)}" tabindex="0" aria-label="帖子正文和回复">
        <article class="forum-article" aria-busy="${this.postLoading}"><div class="forum-post-heading"><span class="forum-state forum-state-${tone}">${esc(status)}</span><span class="forum-number">#${esc(number)}</span></div><h2 class="forum-detail-title" tabindex="-1">${esc(post?.title || t('帖子详情'))}</h2>
          ${post ? `<div class="forum-post-meta"><span class="forum-author" title="${esc(t('作者'))}">${esc(post.author || t('未知作者'))}</span>${detail ? `<span>${esc(t('发表于'))} ${esc(dateLabel(detail.post.createdAt))}</span>` : ''}<span>${esc(t('更新于'))} ${esc(dateLabel(post.updatedAt))}</span><span class="forum-replies" aria-label="${esc(t('回复数'))}: ${esc(post.comments)}">${replyIcon}${esc(post.comments)}</span></div>` : ''}
          ${this.postLoading ? `<p class="forum-loading forum-detail-loading" role="status"><span class="spinner" aria-hidden="true"></span>${esc(t('正在读取帖子正文…'))}</p>` : ''}
          ${this.postError ? `<p class="forum-error forum-detail-error" role="alert">${detail ? `${esc(t('当前仍显示此前成功读取的帖子内容。'))} ` : ''}${esc(message(this.postError))}</p>` : ''}
          ${detail?.stale ? `<p class="forum-warning forum-detail-warning" role="status">${esc(message(detail.warning || '帖子内容暂时无法刷新，当前显示的是此前读取的内容。'))}</p>` : ''}
          ${detail ? `<div class="forum-post-body">${detail.post.body ? esc(detail.post.body) : esc(t('作者暂未填写正文。'))}</div>` : ''}
        </article>
        <section class="forum-replies-section" aria-label="帖子回复"><div class="forum-replies-heading"><h3>回复${post ? ` <span>${post.comments}</span>` : ''}</h3><button type="button" class="small" data-forum-action="refresh-replies"${disabled(this.repliesLoading)}>${refreshIcon}刷新回复</button></div>
          ${this.repliesLoading ? `<p class="forum-loading forum-replies-loading" role="status"><span class="spinner" aria-hidden="true"></span>${esc(t('正在读取回复…'))}</p>` : ''}
          ${this.repliesError ? `<p class="forum-error forum-replies-error" role="alert">${replies ? `${esc(t('当前仍显示此前成功读取的回复页。'))} ` : ''}${esc(message(this.repliesError))}</p>` : ''}
          ${replies?.stale ? `<p class="forum-warning forum-replies-warning" role="status">${esc(message(replies.warning || '回复暂时无法刷新，当前显示的是此前读取的回复。'))}</p>` : ''}
          <ul class="forum-reply-list" aria-busy="${this.repliesLoading}">${replies?.replies.map(reply => this.reply(reply)).join('') || ''}${replies && !replies.replies.length && !this.repliesLoading && !this.repliesError ? `<li class="forum-replies-empty">${esc(t('暂时还没有回复。'))}</li>` : ''}</ul>
          <div class="forum-pagination forum-replies-pagination"><div class="forum-page-details"><span class="forum-replies-page-number">${t('页码')} ${replies?.page || 1}</span>${replies?.fetchedAt ? `<span>${esc(t('读取于'))} ${esc(dateLabel(replies.fetchedAt))}</span>` : ''}</div><div class="toolbar-buttons"><button type="button" data-forum-action="replies-previous"${disabled(this.repliesLoading || !replies || replies.page <= 1)}>上一页</button><button type="button" data-forum-action="replies-next"${disabled(this.repliesLoading || !replies?.hasMore)}>下一页</button></div></div>
        </section>
      </div></section><p class="hint forum-note">去回复会在浏览器中打开 Gitee。${api.demo ? ` ${esc(t('演示帖子仅用于预览，不代表在线论坛内容。'))}` : ''}</p>`;
  }

  render(): string {
    if (this.detailNumber) return this.renderDetail();
    const available = api.desktop || api.demo;
    const data = this.data;
    const error = this.error;
    const warning = data?.stale ? data.warning || t('论坛暂时无法刷新，当前显示的是此前读取的帖子。') : '';
    const posts = data?.posts || [];
    const empty = !this.loading && !error && data && !posts.length;
    return ui`<section class="panel forum-panel" tabindex="-1" aria-label="论坛帖子"><div class="forum-toolbar"><div><h2>社区帖子</h2><p>来自 Gitee · pure-tv-store · 按最近更新排序</p></div><div class="toolbar-buttons"><button type="button" class="primary" data-forum-action="create">发布帖子${externalIcon}</button><button type="button" data-forum-action="refresh"${disabled(!available || this.loading)}>${refreshIcon}刷新帖子</button></div></div>
      ${this.loading ? `<p class="forum-loading" role="status" data-forum-loading-page="${this.loadingPage}"><span class="spinner" aria-hidden="true"></span>${esc(t('正在读取帖子…'))}</p>` : ''}
      ${error ? `<p class="forum-error" role="alert">${data ? `${esc(t('当前仍显示此前成功读取的页面。'))} ` : ''}${esc(message(error))}</p>` : ''}
      ${warning ? `<p class="forum-warning" role="status">${esc(message(warning))}</p>` : ''}
      ${this.linkError ? `<p class="forum-error forum-link-error" role="alert">${esc(message(this.linkError))}</p>` : ''}
      <ul class="forum-list" data-scroll="forum-page-${data?.page || 1}" aria-label="论坛帖子列表" aria-busy="${this.loading}" tabindex="0">${posts.map(post => this.post(post)).join('')}${empty ? `<li class="empty-state forum-empty">${forumIcon}<h3>${esc(t('这一页暂时没有帖子'))}</h3><p>${esc(t('可以稍后刷新帖子列表。'))}</p></li>` : ''}${!available ? `<li class="empty-state forum-preview">${forumIcon}<h3>${esc(t('请在桌面管理器中浏览论坛。'))}</h3><p>${esc(t('发布帖子仍会在浏览器中打开 Gitee。'))}</p></li>` : ''}</ul>
      <div class="forum-pagination"><div class="forum-page-details"><span class="forum-page-number">${t('页码')} ${data?.page || 1}</span>${data ? `<span>${esc(t('本页帖子'))} ${posts.length}</span>` : ''}${data?.fetchedAt ? `<span>${esc(t('读取于'))} ${esc(dateLabel(data.fetchedAt))}</span>` : ''}</div><div class="toolbar-buttons"><button type="button" data-forum-action="previous"${disabled(this.loading || !data || data.page <= 1)}>上一页</button><button type="button" data-forum-action="next"${disabled(this.loading || !data?.hasMore)}>下一页</button></div></div></section>
      <p class="hint forum-note">点击标题查看正文和回复；发布帖子和去回复会在浏览器中打开 Gitee。${api.demo ? ` ${esc(t('演示帖子仅用于预览，不代表在线论坛内容。'))}` : ''}</p>`;
  }
}
