import { createController } from '../../shared/web/input.js';

let controller;
export function initializeController(onCancel) {
  controller = createController({ width: 162, onCancel, onSuspend: onCancel });
}
export function readController(playing) {
  controller.setPlaying(playing);
  return controller.poll();
}
export function controllerState() { return controller.peek(); }
