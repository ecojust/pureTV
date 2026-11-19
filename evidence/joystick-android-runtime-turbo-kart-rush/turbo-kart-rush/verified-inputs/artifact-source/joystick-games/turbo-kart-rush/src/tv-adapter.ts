// The shared browser module is JavaScript and intentionally has no TypeScript declaration.
// @ts-expect-error shared runtime is covered by the repository's bridge tests.
import { createController } from '../../shared/web/input.js';
import type { Game } from './upstream/src/game/Game';
import type { TVFrame } from './tv-types';

export function createTVAdapter() {
  let game: Game | undefined, frames = 0, helpOpen = false;
  const errors: string[] = [];
  const fail = (error: unknown) => errors.push(error instanceof Error ? error.message : String(error));
  addEventListener('error', event => fail(event.error || event.message));
  addEventListener('unhandledrejection', event => fail(event.reason));
  const suspend = () => game?.suspendForTV();
  const controller = createController({ width: 190, onSuspend: suspend, onCancel: suspend });
  const panel = document.getElementById('puretv-controller-panel')!;
  const help = document.createElement('div');
  help.className = 'tv-help';
  help.innerHTML = '<strong>TURBO KART RUSH</strong><span>菜单：方向选择 · A / START 确认 · Y 返回</span><span>↑ 加速 · ↓ 刹车 / 倒车<br>← → 转向 · A 跳跃 / 漂移<br>B 道具 · X 回看 · Y 操作说明<br>START 暂停 / 手动继续</span>';
  panel.appendChild(help);
  const playing = () => !!game && ['countdown','racing','finished'].includes(game.currentState);
  const snapshot = () => ({ game: 'turbo-kart-rush', ...game?.observeForTV(),
    frames, controller: controller.peek(), helpOpen, errors: [...errors] });
  Object.defineProperty(window, 'JoystickGameQA', { value: Object.freeze({ snapshot }), writable: false, configurable: false });
  return {
    attach(value: Game) { game = value; }, fail,
    poll(): TVFrame {
      controller.setPlaying(playing());
      const frame: TVFrame = controller.poll();
      panel.dataset.mode = game?.currentState || 'boot';
      panel.dataset.connected = String(controller.peek().connected);
      if (!frame.cancelled) {
        if (playing() && frame.pressed.Y) { helpOpen = !helpOpen; panel.dataset.help = String(helpOpen); }
        if (game?.currentState !== 'paused' && Object.values(frame.pressed).some(Boolean)) game?.wakeAudioForTV();
      }
      return frame;
    },
    rendered() { frames++; },
    onPause() { controller.cancel(); },
    get helpOpen(): boolean { return helpOpen; },
  };
}
export type TVAdapter = ReturnType<typeof createTVAdapter>;
