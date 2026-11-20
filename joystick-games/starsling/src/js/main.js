import '../vendor/page-audio.js';
import '../vendor/a11y.js';
import {createTV, menuInput} from '../../../shared/triptych/tv.js';
// STARSLING — entry point. Boots the view, runs the fixed-step simulation, routes input and
// events, and moves between the title, play, pause and the end-of-sector sheet.
//
// ?debug=1 exposes window.__ss for the dev/ harnesses; &fast=N runs N× simulation per frame.

import { STEP, MAX_FRAME } from './config.js';
import { View } from './view/view.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { loadSettings, saveSettings, hasSave, saveGame, loadGame, clearSave, loadProgress, recordResult, unlocked, clearProgress } from './save.js';
import { newGame, step } from './sim/game.js';
import { makeBot, botInput } from './sim/bot.js';
import { LEVELS } from './sim/levels.js';

const FAST = 1;

const settings = loadSettings();
const audio = new Audio();
audio.setVolumes(settings.sfx, settings.music);
const input = new Input();
const view = new View(document.getElementById('view'));
const ui = new UI({
    audio, settings,
    onSettings: (s) => { saveSettings(s); audio.setVolumes(s.sfx, s.music); updateTouch(); },
    onDeleteSave: () => { clearSave(); clearProgress(); progress = loadProgress(); refreshTitle(); },
});
ui.project = (x, y) => view.worldToScreen(x, y);
input.screenToWorld = (x, y) => view.screenToWorld(x, y);
input.canPull = () => mode === 'play' && !ui.anyScreen() && G.state === 'ready' && G.ammo.length > 0;
input.inFlight = () => mode === 'play' && !ui.anyScreen() && G.state === 'flight';
input.bindCanvas(document.getElementById('view'));

let G = newGame(1, 0);       // the title screen shows a sector in the background
let mode = 'title';          // title | play | over
let progress = loadProgress();
let acc = 0;
let time = 0;
let last = performance.now();
let saveT = 0;
let bot = null;
let wasRunning = false;
const seen = {};             // a count of every sim event drained, for the tests

const newSeed = () => (Date.now() % 1e9) | 0;

// ------------------------------------------------------------------ menus
function refreshTitle() { document.getElementById('btn-continue').hidden = !hasSave(); }
refreshTitle();
ui.openScreen('title');

const unlock = () => audio.init();
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { capture: true });

function openLevels() {
    ui.renderLevels(progress, (i) => unlocked(progress, i), (i) => { audio.ui('click'); startGame(newGame(newSeed(), i)); });
    ui.openScreen('levels');
}

document.getElementById('title-menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    audio.ui('click');
    const act = b.dataset.act;
    if (act === 'new') startGame(newGame(newSeed(), 0));
    else if (act === 'continue') {
        const g = loadGame();
        if (g) startGame(g); else ui.toast('That save could not be read.');
    } else if (act === 'levels') openLevels();
    else ui.openScreen(act);
});
document.getElementById('pause-menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    audio.ui('click');
    const act = b.dataset.act;
    if (act === 'resume') ui.closeScreen('pause');
    else if (act === 'retry') startGame(newGame(newSeed(), G.level));
    else if (act === 'quit') { saveGame(G); toTitle(); }
    else ui.openScreen(act);
});
document.getElementById('btn-pause').addEventListener('click', () => pause());
document.getElementById('over-retry').addEventListener('click', () => { audio.ui('click'); startGame(newGame(newSeed(), G.level)); });
document.getElementById('over-next').addEventListener('click', () => { audio.ui('click'); startGame(newGame(newSeed(), G.level + 1)); });
document.getElementById('over-levels').addEventListener('click', () => { audio.ui('click'); toTitle(); openLevels(); });

function startGame(g) {
    G = g;
    for (const id of [...ui.stack]) ui.closeScreen(id);
    // a focused button would swallow Space and Enter for the whole game
    document.activeElement?.blur?.();
    mode = 'play';
    acc = 0;
    input.flush();
    ui.showHud(true);
    updateTouch();
    saveGame(G);
}

function toTitle() {
    for (const id of [...ui.stack]) ui.closeScreen(id);
    mode = 'title';
    ui.showHud(false);
    G = newGame(1, 0);
    refreshTitle();
    ui.openScreen('title');
}

function pause() {
    if (mode !== 'play' || ui.anyScreen()) return;
    audio.ui('open');
    saveGame(G);
    ui.openScreen('pause');
}

function updateTouch() {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    ui.setTouch(settings.touch === 'on' || (settings.touch === 'auto' && (coarse || input.lastDevice === 'touch')));
}
input.onTouch = updateTouch;
input.bindButton(document.getElementById('btn-a'), () => input.pressAct());

// ------------------------------------------------------------------ input routing
function handlePresses() {
    const press = input.next();               // one per frame: presses never merge
    if (!press) return;
    const key = press.key;
    if (ui.anyScreen()) {
        if (key === 'ArrowDown') ui.moveFocus(1);
        else if (key === 'ArrowUp') ui.moveFocus(-1);
        else if ((key === 'Escape' || key === 'KeyP') && ui.top() !== 'title' && ui.top() !== 'over') { audio.ui('close'); ui.closeTop(); }
        else if (key === 'Enter' && press.pad) document.activeElement?.click?.();
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
    audio.onEvents(G, ev);
    ui.onEvents(G, ev);
    const over = ev.find((e) => e.type === 'over');
    if (over) {
        mode = 'over';
        clearSave();
        ui.showHud(false);
        let best = false;
        if (G.won) {
            best = G.score > (progress.best[G.level] || 0);
            progress = recordResult(G.level, G.stars, G.score);
        }
        ui.showOver(G, { hasNext: G.level + 1 < LEVELS.length, best });
    }
}

// ------------------------------------------------------------------ frame loop
function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    time += dt;
    pollTV();
    handlePresses();

    const running = mode === 'play' && !ui.anyScreen();
    // back from a menu: the key or tap that closed it must not also act in the game (game-078)
    if (running && !wasRunning) input.flush();
    wasRunning = running;
    if (running) {
        acc += dt * FAST;
        let n = 0;
        while (acc >= STEP && n < 12 * FAST) {
            const inp = bot ? botInput(G, bot) : input.state();
            step(G, inp, STEP);
            input.consumeEdges();             // only once a step has seen them
            acc -= STEP;
            n++;
        }
        saveT += dt;
        if (saveT > 20) { saveT = 0; saveGame(G); }
    } else acc = 0;
    flushEvents();
    view.frame(G, dt, time);
    if (mode === 'play') ui.hud(G);
}

document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', () => { if (mode === 'play') saveGame(G); });


const gl = view.renderer.getContext();
const tv = createTV({
    game: 'starsling', title: 'STARSLING',
    controls: '↑↓ 仰角 · ←→ 力度\nA 发射 · 飞行中 A/B 发动能力',
    suspend() { input.clear(); pause(); },
    observe() {
        return {
            renderer: gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl1',
            webglVersion: gl instanceof WebGL2RenderingContext ? 2 : 1,
            stage: mode === 'over' ? 'ended' : mode === 'title' ? 'menu' : ui.anyScreen() ? 'paused' : 'playing',
            paused: mode === 'play' && ui.anyScreen(),
            gameplay: {screen: ui.top() || 'play', tick: G.t, phase: G.state, shots: G.shots,
                angle: G.aim.angle, power: G.aim.power, ammo: G.ammo.length, score: G.score, robots: G.robots,
                specials: (seen.boost || 0) + (seen.slam || 0) + (seen.split || 0) + (seen.blast || 0),
                projectile: G.proj, sector: G.level},
        };
    },
});
function pollTV() {
    const {buttons, pressed} = tv.poll(mode === 'play' && !ui.anyScreen());
    input.tv = buttons;
    if (Object.values(pressed).some(Boolean)) unlock();
    if (pressed.START) {
        input.flush();
        if (ui.top() === 'title') document.querySelector('#title-menu button:not([hidden])')?.click();
        else if (ui.top() === 'pause') ui.closeScreen('pause');
        else if (!ui.anyScreen()) pause();
        else if (mode === 'over') document.querySelector('#over .primary:not([hidden])')?.click();
        return;
    }
    if (ui.anyScreen()) {
        if (ui.top() === 'pause' && (pressed.B || pressed.Y || (pressed.A && document.activeElement?.dataset.act === 'resume'))) return;
        menuInput(ui, pressed);
    } else if (pressed.A || (pressed.B && G.state === 'flight')) input.pressAct();
}

requestAnimationFrame((t) => { last = t; frame(t); });

// ------------------------------------------------------------------ debug hooks (?debug=1)
