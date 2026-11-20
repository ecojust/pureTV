/** Small, asserted integration patches against the exact vendored 1.4.0 source.
 * Rules and drawing remain upstream. The TV adapter owns time and input. */
export function patchEngine(source) {
  function replace(before, after) {
    if (source.split(before).length !== 2) throw new Error('crisp patch context changed: ' + before.slice(0, 70));
    source = source.replace(before, after);
  }
  replace("    'use strict';", "    'use strict';\n    let puretvPixiApp, puretvDifficultyBase = 1;");
  replace('const app = new PIXI.Application({', 'const app = puretvPixiApp = new PIXI.Application({\n                autoStart: false, sharedTicker: false,');
  replace('        init$3(() => {\n            audioContext.resume();\n        });', '        // All keyboard, pointer and native input belongs to the TV controller.');
  replace('        _init$1();\n        update$3();', '        _init$1();');
  replace('        loopFrameRequestId = requestAnimationFrame(update$3);', '        // The TV adapter owns the only gameplay animation loop.');
  replace('        update$4();\n        _update$1();', '        _update$1();\n        if (puretvPixiApp) puretvPixiApp.render();');
  replace('        if (now < nextFrameTime - targetFps / 12) {\n            return;', '        if (now < nextFrameTime - targetFps / 12) {\n            return false;');
  replace('            enableCache();\n        }\n    }\n    function stop$1()', '            enableCache();\n        }\n        return true;\n    }\n    function stop$1()');
  replace('            else {\n                audioContext.resume();\n            }', '            // Foregrounding does not resume a paused TV game.');
  replace('exports.df = exports.difficulty = exports.ticks / 3600 + 1;', 'exports.df = exports.difficulty = exports.ticks / 3600 + puretvDifficultyBase;');
  replace('})(window || {});', `
    Object.defineProperty(window, '__puretvCrisp', { value: Object.freeze({
      initialize() { onLoad(); _update(); if (puretvPixiApp) puretvPixiApp.render(); audioContext.suspend(); },
      paintTitle() { if (state === 'title') { clear(); updateTitle(); if (puretvPixiApp) puretvPixiApp.render(); } },
      start(level) { puretvDifficultyBase = level; initInGame(); exports.ticks = 0; nextFrameTime = 0; audioContext.resume(); },
      step(button) { set({ pos: vec(50, 50), isPressed: button.held, isJustPressed: button.pressed, isJustReleased: button.released }); return update$3(); },
      cancel() { set({ pos: vec(50, 50), isPressed: false, isJustPressed: false, isJustReleased: false }); audioContext.suspend(); },
      resume() { nextFrameTime = 0; audioContext.resume(); },
      snapshot() { return { state, score: exports.score, ticks: exports.ticks, difficulty: exports.difficulty, time: exports.time, hiScore, audioState: audioContext.state }; }
    }) });
})(window || {});`);
  return source;
}
