import {Channel, invoke} from '@tauri-apps/api/core';
import type {DeviceTarget, MarketProgress} from './types';
import {message, t} from './i18n';
export type GameKind = 'online' | 'hosted' | 'project';

type GameApk = {path:string; packageName?:string | null; sha256:string};
export type QueueGameApk = (path:string) => void | Promise<void>;

export interface GameDeployment {
  target():DeviceTarget | undefined;
  connect():void;
  install(gameId:string, kind:GameKind, name:string, path:string, target:DeviceTarget):void;
}

type DeploymentStep = 'pack' | 'install' | 'complete';

export function deploymentDevice(target:DeviceTarget):string {
  return target.serial + ' · ' + t('当前用户') + ' ' + target.userId;
}

export function deploymentSteps(kind:GameKind, active:DeploymentStep, incomplete=false):string {
  const first = kind === 'online' ? t('获取正式 APK') : t('打包 APK');
  const steps = [['pack', first], ['install', t('安装到电视')], ['complete', t('完成')]];
  const position = steps.findIndex(([step]) => step === active);
  const items = steps.map(([step,label], index) => {
    const done = index < position || active === 'complete';
    const state = done ? 'done' : index !== position ? 'pending' : incomplete ? 'incomplete' : 'active';
    const symbol = done ? '✓' : state === 'incomplete' ? '!' : String(index + 1);
    return `<li data-deploy-step="${step}" data-state="${state}"${index === position ? ' aria-current="step"' : ''}><span aria-hidden="true">${symbol}</span>${label}</li>`;
  });
  return `<ol class="game-deployment-steps" aria-label="${t('部署进度')}">${items.join('')}</ol>`;
}

export class WebGamePackaging {
  private dialog?:HTMLDialogElement;

  constructor(private readonly enqueue:QueueGameApk, private readonly deployment:GameDeployment) {}

  open(gameId:string, name:string, kind:GameKind, opener:HTMLButtonElement, deploy:boolean):void {
    if (this.dialog?.open) return;
    const device = deploy ? this.deployment.target() : undefined;
    const online = kind === 'online';
    const generate = kind === 'hosted';
    const deployment = this.deployment;
    const dialog = document.createElement('dialog');
    this.dialog = dialog;
    dialog.className = 'modal game-apk-dialog';
    dialog.setAttribute('aria-labelledby', 'game-apk-heading');
    dialog.innerHTML = `<div class="modal-heading"><h2 id="game-apk-heading"></h2>
      <button type="button" class="text-button" data-apk-close autofocus>${t('取消')}</button></div>
      ${online ? `<p class="hint" data-online-apk>${t('首次获取正式 APK 需要联网。')}</p>` : kind === 'project' ? `<p class="hint">${t('首次游玩或部署时下载，之后可离线使用。')}</p>` : ''}
      ${device ? `<p data-deployment-device></p><div data-deployment-steps>${deploymentSteps(kind, 'pack')}</div>` : ''}
      <p role="status" aria-live="polite" data-apk-status></p>
      <div class="game-apk-progress" data-apk-progress hidden>
        <progress aria-label="${t('下载进度')}"></progress><span></span>
      </div>
      <dl data-apk-details hidden><dt>${t('包名')}</dt><dd></dd><dt>SHA-256</dt><dd></dd></dl>
      <div class="game-apk-actions">
        <button type="button" class="primary" data-apk-connect hidden>${t('前往设备连接')}</button>
        <button type="button" data-apk-retry hidden>${t('重试')}</button>
        <button type="button" data-apk-save hidden>${t('保存到电脑')}</button>
        <button type="button" class="primary" data-apk-queue hidden>${t('加入安装队列')}</button>
      </div>`;
    dialog.querySelector('h2')!.textContent = name;
    const steps = dialog.querySelector<HTMLElement>('[data-deployment-steps]');
    if (device) dialog.querySelector('[data-deployment-device]')!.textContent = deploymentDevice(device);
    const status = dialog.querySelector<HTMLElement>('[data-apk-status]')!;
    const transfer = dialog.querySelector<HTMLElement>('[data-apk-progress]')!;
    const bar = transfer.querySelector('progress')!;
    const bytes = transfer.querySelector('span')!;
    const details = dialog.querySelector('dl')!;
    const [packageValue, digestValue] = Array.from(details.querySelectorAll('dd'));
    const connect = dialog.querySelector<HTMLButtonElement>('[data-apk-connect]')!;
    const retry = dialog.querySelector<HTMLButtonElement>('[data-apk-retry]')!;
    const save = dialog.querySelector<HTMLButtonElement>('[data-apk-save]')!;
    const queue = dialog.querySelector<HTMLButtonElement>('[data-apk-queue]')!;
    const closeButton = dialog.querySelector<HTMLButtonElement>('[data-apk-close]')!;
    let preparing:Channel<MarketProgress> | undefined;
    let apk:GameApk | undefined;

    function cancelChannel(channelId:number) {
      void invoke('cancel_web_game_apk', {channelId}).catch(error => console.warn('APK cancellation failed', error));
    }

    function dismiss() {
      if (preparing) cancelChannel(preparing.id);
      dialog.close();
    }

    function showError(prefix:string, error:unknown) {
      status.textContent = prefix + ' · ' + message(error instanceof Error ? error.message : String(error));
      status.classList.add('error');
    }

    async function prepare() {
      let packed = false;
      retry.hidden = true;
      closeButton.textContent = t('取消');
      status.classList.remove('error');
      if (steps) steps.innerHTML = deploymentSteps(kind, 'pack');
      status.textContent = online ? t('正在获取正式 APK…') : deploy ? t('正在打包 APK…') : generate ? t('正在生成电视 APK…') : t('正在准备电视 APK…');
      try {
        let firstProgress = true;
        const onProgress:Channel<MarketProgress> = new Channel(event => {
          if (preparing !== onProgress) return;
          // Closing may precede native registration. Its first progress event acknowledges ownership.
          if (firstProgress && !dialog.open) cancelChannel(onProgress.id);
          firstProgress = false;
          if (!dialog.open) return;
          if (event.stage !== 'downloading' && event.stage !== 'verifying') {
            transfer.hidden = true;
            if (kind === 'project') status.textContent = t('正在准备电视 APK…');
            return;
          }
          const label = event.stage === 'verifying' ? t('正在校验安装包…') :
            kind === 'project' ? t('正在下载游戏资源…') : t('正在下载安装包…');
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
          bytes.textContent = event.total ? received + ' / ' + (event.total / 1048576).toFixed(1) + ' MiB' :
            event.downloaded ? received + ' MiB' : '';
        });
        preparing = onProgress;
        const result = await invoke<GameApk>('build_web_game_apk', {gameId, onProgress});
        if (!dialog.open) return;
        transfer.hidden = true;
        if (device) {
          // The native build is complete. Hand this exact APK to the existing installation dialog.
          packed = true;
          deployment.install(gameId, kind, name, result.path, device);
          dialog.close();
          return;
        }
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
        if (steps) steps.innerHTML = deploymentSteps(kind, packed ? 'install' : 'pack', true);
        showError(deploy ? t('部署未完成') : generate ? t('生成失败') : t('获取失败'), error);
        const current = deployment.target();
        retry.hidden = !!device && (current?.serial !== device.serial || current.userId !== device.userId);
        connect.hidden = !device || !!current;
      } finally {
        preparing = undefined;
        closeButton.textContent = t('关闭');
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

    connect.addEventListener('click', () => { dialog.close(); deployment.connect(); });
    retry.addEventListener('click', () => void prepare());
    save.addEventListener('click', () => void useApk('save'));
    queue.addEventListener('click', () => void useApk('queue'));
    closeButton.addEventListener('click', dismiss);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      dismiss();
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (this.dialog !== dialog) return;
      this.dialog = undefined;
      const target = opener.isConnected ? opener : document.querySelector<HTMLElement>(`[data-${deploy ? 'deploy' : 'build'}-game="${CSS.escape(gameId)}"]`);
      target?.focus({preventScroll:true});
    }, {once:true});
    document.body.append(dialog);
    dialog.showModal();
    if (deploy && !device) {
      status.textContent = t('请先连接电视并完成 ADB 授权，再部署游戏。');
      closeButton.textContent = t('关闭');
      connect.hidden = false;
      connect.focus();
    } else {
      void prepare();
    }
  }
}
