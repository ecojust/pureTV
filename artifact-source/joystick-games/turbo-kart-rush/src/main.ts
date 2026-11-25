import './upstream/src/style.css';
import './tv.css';
import { Game } from './upstream/src/game/Game';
import { createTVAdapter } from './tv-adapter';

// The production entry keeps the original Game/menu flow and does not expose
// writable upstream __turboKartRush / developer autoplay globals.
const adapter = createTVAdapter();
try {
  const game = new Game(document.getElementById('app')!);
  game.tv = adapter;
  adapter.attach(game);
  game.start();
} catch (error) {
  adapter.fail(error);
  const message = document.createElement('p');
  message.className = 'tv-fatal';
  message.textContent = 'Turbo Kart Rush 需要支持 WebGL 2 的系统浏览器。' + String(error);
  document.body.appendChild(message);
}
