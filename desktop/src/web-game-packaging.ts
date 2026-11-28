import {Channel, invoke} from '@tauri-apps/api/core';
import type {MarketProgress} from './types';
import {message, t} from './i18n';

type GameApk = {path:string; packageName?:string | null; sha256:string};
export type QueueGameApk = (path:string) => void | Promise<void>;

export class WebGamePackaging {
  private dialog?:HTMLDialogElement;

  constructor(private readonly enqueue:QueueGameApk) {}

  open(gameId:string, name:string, generate:boolean, opener:HTMLButtonElement):void {
    if (this.dialog?.open) return;
    const dialog = document.createElement('dialog');
    this.dialog = dialog;
    dialog.className = 'modal game-apk-dialog';
    dialog.setAttribute('aria-labelledby', 'game-apk-heading');
    dialog.innerHTML = `<div class="modal-heading"><h2 id="game-apk-heading"></h2>
      <button type="button" class="text-button" data-apk-close autofocus>${t('关闭')}</button></div>
      <p role="status" aria-live="polite" data-apk-status></p>
      <div class="game-apk-progress" data-apk-progress hidden>
        <progress aria-label="${t('下载进度')}"></progress><span></span>
      </div>
      <dl data-apk-details hidden><dt>${t('包名')}</dt><dd></dd><dt>SHA-256</dt><dd></dd></dl>
      <div class="game-apk-actions">
        <button type="button" data-apk-retry hidden>${t('重试')}</button>
        <button type="button" data-apk-save hidden>${t('保存到电脑')}</button>
        <button type="button" class="primary" data-apk-queue hidden>${t('加入安装队列')}</button>
      </div>`;
    dialog.querySelector('h2')!.textContent = name;
    const status = dialog.querySelector<HTMLElement>('[data-apk-status]')!;
    const transfer = dialog.querySelector<HTMLElement>('[data-apk-progress]')!;
    const bar = transfer.querySelector('progress')!;
    const bytes = transfer.querySelector('span')!;
    const details = dialog.querySelector('dl')!;
    const [packageValue, digestValue] = Array.from(details.querySelectorAll('dd'));
    const retry = dialog.querySelector<HTMLButtonElement>('[data-apk-retry]')!;
    const save = dialog.querySelector<HTMLButtonElement>('[data-apk-save]')!;
    const queue = dialog.querySelector<HTMLButtonElement>('[data-apk-queue]')!;
    let apk:GameApk | undefined;

    function showError(prefix:string, error:unknown) {
      status.textContent = prefix + ' · ' + message(error instanceof Error ? error.message : String(error));
      status.classList.add('error');
    }

    async function prepare() {
      retry.hidden = true;
      status.classList.remove('error');
      status.textContent = generate ? t('正在生成电视 APK…') : t('正在准备电视 APK…');
      try {
        const onProgress = new Channel<MarketProgress>(event => {
          if (generate || !dialog.open || apk) return;
          const label = event.stage === 'verifying' ? t('正在校验安装包…') : t('正在下载安装包…');
          if (status.textContent !== label) status.textContent = label;
          transfer.hidden = event.stage !== 'downloading';
          if (transfer.hidden) return;
          if (event.total > 0) {
            bar.max = event.total;
            bar.value = event.downloaded;
          } else {
            bar.removeAttribute('value');
          }
          const received = (event.downloaded / 1048576).toFixed(1);
          bytes.textContent = event.total ? received + ' / ' + (event.total / 1048576).toFixed(1) + ' MiB' : received + ' MiB';
        });
        const result = await invoke<GameApk>('build_web_game_apk', {gameId, onProgress});
        if (!dialog.open) return;
        transfer.hidden = true;
        apk = result;
        packageValue.textContent = result.packageName || '';
        packageValue.hidden = !result.packageName;
        details.querySelector('dt')!.hidden = !result.packageName;
        digestValue.textContent = result.sha256;
        details.hidden = false;
        status.textContent = t('电视 APK 已就绪');
        save.hidden = false;
        queue.hidden = false;
      } catch (error) {
        if (!dialog.open) return;
        transfer.hidden = true;
        showError(generate ? t('生成失败') : t('获取失败'), error);
        retry.hidden = false;
      }
    }

    const useApk = async (action:'save' | 'queue') => {
      if (!apk || save.disabled) return;
      save.disabled = queue.disabled = true;
      status.classList.remove('error');
      try {
        if (action === 'save') {
          status.textContent = t('正在保存…');
          const destination = await invoke<string | null>('save_web_game_apk', {gameId});
          if (dialog.open) status.textContent = destination ? t('已保存到') + ' ' + destination : t('电视 APK 已就绪');
        } else {
          await this.enqueue(apk.path);
          if (dialog.open) dialog.close();
        }
      } catch (error) {
        if (dialog.open) showError(action === 'save' ? t('保存失败') : t('加入安装队列失败'), error);
      } finally {
        save.disabled = queue.disabled = false;
      }
    };

    retry.addEventListener('click', () => void prepare());
    save.addEventListener('click', () => void useApk('save'));
    queue.addEventListener('click', () => void useApk('queue'));
    dialog.querySelector('[data-apk-close]')!.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (this.dialog !== dialog) return;
      this.dialog = undefined;
      const target = opener.isConnected ? opener : document.querySelector<HTMLElement>(`[data-build-game="${CSS.escape(gameId)}"]`);
      target?.focus({preventScroll:true});
    }, {once:true});
    document.body.append(dialog);
    dialog.showModal();
    void prepare();
  }
}
