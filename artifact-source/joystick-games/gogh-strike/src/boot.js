import {loadCharacterAssets} from './character-assets.js';

// All artist meshes must be available before actors and their portrait renders are created.
loadCharacterAssets().then(() => import('./game.js')).catch(window.showBootError);
