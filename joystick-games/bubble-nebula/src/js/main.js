import { createTV, menuInput } from '../../../shared/triptych/tv.js';
// BUBBLE NEBULA — entry point. Boots the view, runs the fixed-step simulation, routes input and
// events, and moves between the title (with the bot playing a demo behind it), play, pause,
// GAME OVER and the ending.
//
// ?debug=1 exposes window.__bn for the dev/ harnesses; &fast=N runs N× simulation per frame;
// &quality=0|1|2 overrides the graphics setting.

import { STEP, MAX_FRAME } from './config.js';
import { View } from './view/view.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { loadSettings, saveSettings, hasSave, saveGame, loadGame, clearSave, loadScores, qualifies, addScore } from './save.js';
import { newGame, step, continueGame, loadLevel } from './sim/game.js';
import { makeBot, botInput } from './sim/bot.js';
import { LAST, LEVELS } from './sim/levels.js';

const params = new URLSearchParams(location.search);
const DEBUG = false;
const FAST = 1;

const settings = loadSettings();
const coarse = !!window.matchMedia?.('(pointer: coarse)').matches;
const autoQuality = () => (coarse ? 1 : 2);
const quality = params.has('quality') ? +params.get('quality') : settings.quality >= 0 ? settings.quality : autoQuality();
const audio = new Audio();
audio.setVolumes(settings.sfx, settings.music);
const input = new Input();
const view = new View(document.getElementById('view'), quality);
const ui = new UI({
    audio, settings,
    onSettings: (s) => {
        saveSettings(s);
        audio.setVolumes(s.sfx, s.music);
        const q = s.quality >= 0 ? s.quality : autoQuality();
        if (q !== view.stage.quality) view.setQuality(q);
        updateTouch();
    },
    onDeleteSave: () => { clearSave(); refreshTitle(); },
});

let G = null;
let mode = 'title';          // title | play | over | ending
let acc = 0, time = 0, last = performance.now(), saveT = 0;
let bot = null;              // the debug autoplay bot
let demoBot = null;          // the attract-mode bot behind the title
let demoT = 0;
let wasRunning = false;
let hi = loadScores()[0].score;
const seen = {};             // a count of every sim event drained, for the tests

function newDemo() {
    const seed = (Date.now() % 1e6) | 0;
    const g = newGame(seed, { lives: 99, level: Math.floor(Math.random() * 6) });
    demoBot = makeBot({ skill: 1, seed });
    demoT = 0;
    return g;
}
G = newDemo();
view.reset(G);

// ------------------------------------------------------------------ menus
function refreshTitle() { document.getElementById('btn-continue').hidden = !hasSave(); }
refreshTitle();
ui.openScreen('title');
audio.play('title');

const unlock = () => audio.init();
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { capture: true });

document.getElementById('title-menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    audio.ui('click');
    const act = b.dataset.act;
    if (act === 'new') { if (hasSave()) ui.openScreen('confirm-new'); else startGame(newGame((Date.now() % 1e9) | 0)); }
    else if (act === 'continue') {
        const g = loadGame();
        if (g) startGame(g); else ui.toast('That save could not be read.');
    } else ui.openScreen(act);
});
document.getElementById('btn-new-yes').addEventListener('click', () => { audio.ui('click'); startGame(newGame((Date.now() % 1e9) | 0)); });
document.getElementById('pause-menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    audio.ui('click');
    const act = b.dataset.act;
    if (act === 'resume') ui.closeScreen('pause');
    else if (act === 'quit') { saveGame(G); toTitle(); }
    else ui.openScreen(act);
});
document.getElementById('btn-pause').addEventListener('click', () => pause());
document.getElementById('over-continue').addEventListener('click', () => {
    audio.ui('click');
    recordScore('name-input');
    continueGame(G);
    startGame(G);
});
document.getElementById('over-title').addEventListener('click', () => { audio.ui('click'); recordScore('name-input'); toTitle(); });
document.getElementById('ending-done').addEventListener('click', () => { audio.ui('click'); recordScore('name-input2'); toTitle(); });

let pendingScore = null;
function recordScore(inputId) {
    if (!pendingScore) return;
    const name = (document.getElementById(inputId).value || 'PIP').trim().toUpperCase().slice(0, 8) || 'PIP';
    settings.name = name;
    saveSettings(settings);
    addScore(name, pendingScore.score, pendingScore.sector);
    hi = loadScores()[0].score;
    pendingScore = null;
}

function startGame(g) {
    G = g;
    ui.closeAll();
    // a focused button would swallow Space and Enter for the whole game
    document.activeElement?.blur?.();
    mode = 'play';
    acc = 0;
    input.flush();
    view.reset(G);
    ui.showHud(true);
    updateTouch();
    // a loaded or continued game announces its sector too
    if (!G.events.some((e) => e.type === 'level')) G.events.push({ type: 'level', idx: G.level, name: LEVELS[G.level].name, boss: G.level === LAST });
    saveGame(G);
    if (ui.touchOn && view.stage.h > view.stage.w * 1.2 && !hintedPortrait) { hintedPortrait = true; ui.toast('Turn your phone sideways for a bigger view'); }
}
let hintedPortrait = false;

function toTitle() {
    ui.closeAll();
    mode = 'title';
    ui.showHud(false);
    G = newDemo();
    view.reset(G);
    refreshTitle();
    ui.openScreen('title');
    audio.play('title');
}

function pause() {
    if (mode !== 'play' || ui.anyScreen()) return;
    audio.ui('open');
    saveGame(G);
    document.getElementById('pause-info').textContent = `${G.level === LAST ? 'The Core' : 'Sector ' + (G.level + 1)} · ${G.score.toLocaleString()} points`;
    ui.openScreen('pause');
}

function updateTouch() {
    ui.setTouch(settings.touch === 'on' || (settings.touch === 'auto' && (coarse || input.lastDevice === 'touch')));
    layout();
}
input.onTouch = updateTouch;
input.bindDpad(document.getElementById('dpad'), document.getElementById('dpad-l'), document.getElementById('dpad-r'));
input.bindButton(document.getElementById('btn-jump'), 'jump');
input.bindButton(document.getElementById('btn-bubble'), 'fire');

/** Tell the camera how much of the screen the HUD and the touch deck take. */
function layout() {
    const w = view.stage.w, h = view.stage.h;
    const ins = { top: 0, bottom: 0, left: 0, right: 0 };
    if (mode === 'play') ins.top = 50;
    if (!document.getElementById('touch').hidden) {
        const pad = document.getElementById('dpad').getBoundingClientRect();
        const jb = document.getElementById('btn-jump').getBoundingClientRect();
        const bb = document.getElementById('btn-bubble').getBoundingClientRect();
        const deckTop = Math.min(pad.top, jb.top, bb.top);
        if (h > w * 1.1) ins.bottom = h - deckTop + 8;
        else { ins.left = pad.right + 6; ins.right = w - Math.min(jb.left, bb.left) + 6; }
    }
    view.stage.setInsets(ins);
}
window.addEventListener('resize', () => requestAnimationFrame(layout));
window.visualViewport?.addEventListener('resize', () => requestAnimationFrame(layout));

// ------------------------------------------------------------------ input routing
function handlePresses() {
    const press = input.next();               // one per frame: presses never merge
    if (!press) return;
    const key = press.key;
    if (ui.anyScreen()) {
        const top = ui.top();
        if (key === 'ArrowDown' || key === 'ArrowRight') ui.moveFocus(1);
        else if (key === 'ArrowUp' || key === 'ArrowLeft') ui.moveFocus(-1);
        else if ((key === 'Escape' || key === 'KeyP' || key === 'PadB') && !['title', 'over', 'ending'].includes(top)) { audio.ui('close'); ui.closeTop(); }
        else if ((key === 'Enter' && press.pad) || (['KeyZ', 'KeyX', 'KeyJ', 'Enter', 'Space'].includes(key) && !press.onButton && document.activeElement?.tagName !== 'INPUT')) ui.pressFocused();
        return;
    }
    if (mode === 'play' && (key === 'Escape' || key === 'KeyP')) pause();
}

// ------------------------------------------------------------------ events
function flushEvents() {
    if (!G.events.length) return;
    const ev = G.events.splice(0);
    for (const e of ev) seen[e.type] = (seen[e.type] || 0) + 1;
    view.onEvents(G, ev);
    if (mode === 'title') return;          // the demo plays silently and without banners
    audio.onEvents(G, ev);
    ui.onEvents(G, ev);
    for (const e of ev) {
        if (e.type === 'clear' || e.type === 'level') saveGame(G);
        if (e.type === 'over' && mode === 'play') {
            mode = 'over';
            clearSave();
            ui.showHud(false);
            pendingScore = qualifies(G.score) ? { score: G.score, sector: G.level + 1 } : null;
            setTimeout(() => ui.showOver(G, !!pendingScore), 900);
        }
        if (e.type === 'ending' && mode === 'play') {
            mode = 'ending';
            clearSave();
            pendingScore = qualifies(G.score) ? { score: G.score, sector: LAST + 2 } : null;
            setTimeout(() => { ui.showHud(false); ui.showEnding(G, !!pendingScore); }, 2400);
        }
    }
}

// ------------------------------------------------------------------ frame loop
function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    time += dt;
    input.frame();
    pollTV();

    const running = mode === 'play' && !ui.anyScreen();
    // the press that closed a menu must not also act in the game, but the next one must (game-081)
    if (running && !wasRunning) input.dropBefore(ui.closedAt);
    wasRunning = running;
    handlePresses();

    if (running || mode === 'ending' || mode === 'over') {
        acc += dt * FAST;
        let n = 0;
        while (acc >= STEP && n < 12 * FAST) {
            if (mode === 'play') step(G, bot ? botInput(G, bot) : input.state(), STEP);
            input.consumeEdges();             // only once a step has seen them
            acc -= STEP;
            n++;
        }
        if (mode === 'play') {
            saveT += dt;
            if (saveT > 15) { saveT = 0; saveGame(G); }
        }
    } else if (mode === 'title') {
        // the attract demo
        acc += dt;
        let n = 0;
        while (acc >= STEP && n < 12) { step(G, botInput(G, demoBot), STEP); acc -= STEP; n++; }
        demoT += dt;
        if (G.over || demoT > 90) { G = newDemo(); view.reset(G); }
    } else acc = 0;
    flushEvents();
    view.frame(G, dt, time);
    ui.tick(dt);
    if (mode === 'play') ui.hud(G, hi);
}

// Opportunistic saves only while a game is really being played: after Save & Quit, G is the demo
// behind the title, and a reload would overwrite the real save with it (game-080).
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') { pause(); saveGame(G); } });
window.addEventListener('pagehide', () => { if (mode === 'play') saveGame(G); });

layout();

const tvGL = view.stage.renderer.getContext();
const tvWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && tvGL instanceof WebGL2RenderingContext;
const tv = createTV({ game: 'bubble-nebula', title: 'BUBBLE NEBULA', controls: '←→ 移动 · A 跳跃 · B 吹泡泡\n困住敌人再碰破泡泡，收集战利品',
    suspend() { input.clear(); pause(); },
    observe: () => ({ renderer: tvWebGL2 ? 'webgl2' : 'webgl1', webglVersion: tvWebGL2 ? 2 : 1,
        stage: ['over','ending'].includes(mode) ? 'ended' : mode === 'title' ? 'menu' : ui.anyScreen() ? 'paused' : 'playing',
        paused: mode === 'play' && ui.anyScreen(), gameplay: { tick: G.t, score: G.score, playerX: G.player.x, playerY: G.player.y, blown: G.stats.blown, traps: G.stats.traps, pops: G.stats.pops, lives: G.lives, level: G.level, phase: G.phase, screen: ui.top() || 'play' } }),
});
function pollTV() {
    const f = tv.poll(mode === 'play' && !ui.anyScreen());
    input.tv = f.buttons;
    if (Object.values(f.pressed).some(Boolean)) { unlock(); input.lastDevice = 'tv'; }
    if (f.pressed.START) {
        input.clear();
        if (mode === 'title') document.querySelector('#title-menu button:not([hidden])')?.click();
        else if (['over','ending'].includes(mode)) { document.getElementById(mode === 'ending' ? 'ending-done' : 'over-continue').click(); }
        else if (ui.top() === 'pause') ui.closeScreen('pause');
        else if (!ui.anyScreen()) pause();
        return;
    }
    if (ui.anyScreen()) { menuInput(ui, f.pressed); return; }
    if (f.pressed.Y) { pause(); return; }
    if (f.pressed.A) input.tap.jump = true;
    if (f.pressed.B) input.tap.fire = true;
}

requestAnimationFrame((t) => { last = t; frame(t); });

