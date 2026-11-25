import { createController } from '../../shared/web/input.js';
window.kindlePad = createController({ keyboard: true, onSuspend: () => window.dispatchEvent(new Event("kindle-suspend")) });
