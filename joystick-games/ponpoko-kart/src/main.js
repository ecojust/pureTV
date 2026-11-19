import './fonts/fonts.css';
import './tv.css';
import { Game } from './upstream/src/core/Game.js';
import { STAGES } from './upstream/src/stages/index.js';
import { runMenus } from './upstream/src/core/Menus.js';
import { CHARACTERS } from './upstream/src/kart/characters.js';
import { createKartModel } from './upstream/src/kart/KartModel.js';
import { createGlider } from './upstream/src/kart/Glider.js';
import * as itemModels from './upstream/src/items/itemModels.js';
import { UI } from './upstream/src/ui/UI.js';
import { GameAudio } from './upstream/src/audio/Audio.js';
import { createTVAdapter } from './tv-adapter.js';

// Keep original menu -> racer -> course -> race flow. Upstream developer URL
// switches and writable __game/autopilot hooks are not exposed by this entry.
const adapter = createTVAdapter();
try {
  const ui = new UI(document.body);
  const audio = new GameAudio();
  const game = new Game(document.getElementById('app'), {
    ui, audio, stages: STAGES, characters: CHARACTERS,
    kartApi: { createKartModel, createGlider }, itemApi: itemModels,
  });
  adapter.attach(game, ui, audio);
  game.tv = adapter;
  const unlock = () => { if (!game.paused) audio.unlock(); };
  addEventListener('pointerdown', unlock, { once: true, capture: true });
  addEventListener('keydown', unlock, { once: true, capture: true });
  runMenus(game, { ui, audio, characters: CHARACTERS, stages: STAGES });
} catch (error) {
  adapter.fail(error);
  const message = document.createElement('p');
  message.id = 'tv-error';
  message.textContent = '无法启动ぽんぽこカート。此游戏需要支持 WebGL 2 的系统浏览器。' + String(error?.message || error);
  document.body.appendChild(message);
}
