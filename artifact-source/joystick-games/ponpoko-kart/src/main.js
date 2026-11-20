import './fonts/fonts.css';
import './tv.css';
import menuArt from './menu-art/index.js';
import { Game } from './upstream/src/core/Game.js';
import { STAGES } from './upstream/src/stages/index.js';
import { preloadRoadTextures } from './upstream/src/track/roadTextures.js';
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
    async prepareCourse(stage) {
      const base = './road-' + stage.id;
      try {
        await preloadRoadTextures(stage.trackStyle, base + '-map.png', base + '-normal.png');
      } catch (error) {
        console.warn('Using the original procedural road texture for', stage.id, error);
      }
    },
  });
  adapter.attach(game, ui, audio);
  game.tv = adapter;
  const unlock = () => { if (!game.paused) audio.unlock(); };
  addEventListener('pointerdown', unlock, { capture: true });
  addEventListener('keydown', unlock, { capture: true });
  runMenus(game, { ui, audio, characters: CHARACTERS, stages: STAGES, menuArt });
} catch (error) {
  adapter.fail(error);
  const message = document.createElement('p');
  message.id = 'tv-error';
  message.textContent = '无法启动ぽんぽこカート。此游戏需要支持 WebGL 2 的系统浏览器。' + String(error?.message || error);
  document.body.appendChild(message);
}
