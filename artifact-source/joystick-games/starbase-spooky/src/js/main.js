// Starbase Spooky — entry point. Boots the view, runs the fixed-step simulation, routes pointer, touch, keyboard
// and gamepad input onto the sim's commands, and moves between the title, play and the screens.
//
// Read-only TV observations report the same simulation used to drive the view.

import '../lib/page-audio.js';
import '../lib/a11y.js';
import { createTV, menuInput } from '../../../shared/triptych/tv.js';
import { STEP, MAX_FRAME, W, H } from './config.js';
import { View } from './view/view.js';
import { artPending, loadArt } from './view/assets.js';
import { Audio } from './audio.js';
import { UI } from './ui.js';
import { loadSettings, saveSettings, hasSave, saveGame, loadGame, clearSave } from './save.js';
import { newGame, step, act, front, objective } from './sim/game.js';

import { ROOMS } from './sim/data/rooms.js';



const $ = (id) => document.getElementById(id);

const settings = loadSettings();
const audio = new Audio();
audio.setVolumes(settings);
const canvas = $('view');
const view = new View(canvas);
loadArt();

let G = null;
let mode = 'title';          // title | play
let map = false;             // the station map is open
let acc = 0, time = 0, last = performance.now();

let hover = null, focus = null, pointer = null;
let idle = 0;                // seconds Kit has stood around with nothing happening (Orby's hint button nudges)
let autoT = null;
const seen = {};
const keys = [];             // presses in order, one handled per frame

const ui = new UI({
    audio, settings,
    onSettings: (s) => { saveSettings(s); audio.setVolumes(s); },
    onDeleteSave: () => { clearSave(); refreshTitle(); },
    onAnswer: (i) => command({ t: 'answer', i }),
    onNext: () => next(),
    onSolve: () => command({ t: 'solve' }),
});

// ------------------------------------------------------------------ layout
let lastBarH = -1;
function layout() {
    const vv = window.visualViewport;
    const vw = $('game-area').clientWidth, vh = Math.round(vv ? vv.height : innerHeight);
    const portrait = vh > vw * 1.05;
    // Anywhere but a short landscape phone: the picture, then the toolbar under it, then a strip for the dialogue
    // (or today's jobs). On a short landscape phone the toolbar is a slim bottom row and the dialogue floats over
    // the bottom of the picture.
    const below = portrait || vh >= 480;
    const body = document.body.classList;
    body.toggle('below', below);
    body.toggle('tall', portrait);
    body.toggle('narrow', vw < 620);
    const bar = $('bar');
    const barH = bar.hidden ? 0 : bar.offsetHeight;
    lastBarH = barH;
    let cw, ch, cx, cy, bary, stripy;
    if (below) {
        const top = portrait ? 46 : 6;
        const strip = portrait ? 190 : Math.max(144, Math.min(176, Math.round(vh * 0.24)));
        const s = Math.min(vw / W, (vh - top - barH - 12 - strip) / H);
        cw = Math.round(W * s); ch = Math.round(H * s);
        cx = Math.round((vw - cw) / 2); cy = top;
        bary = cy + ch + 6;
        stripy = bary + barH + 6;
    } else {
        bary = vh - barH - 3;
        const s = Math.min(vw / W, (bary - 4) / H);
        cw = Math.round(W * s); ch = Math.round(H * s);
        cx = Math.round((vw - cw) / 2); cy = Math.max(0, Math.round((bary - 4 - ch) / 2));
        stripy = bary;
    }
    const r = document.documentElement.style;
    r.setProperty('--game-w', vw + 'px');
    r.setProperty('--game-half-w', vw / 2 + 'px');
    r.setProperty('--cx', cx + 'px'); r.setProperty('--cy', cy + 'px');
    r.setProperty('--cw', cw + 'px'); r.setProperty('--ch', ch + 'px');
    r.setProperty('--bary', bary + 'px'); r.setProperty('--stripy', stripy + 'px');
}
layout();
window.addEventListener('resize', layout);
window.visualViewport?.addEventListener('resize', layout);

// ------------------------------------------------------------------ menus
function refreshTitle() { $('btn-continue').hidden = !hasSave(); }
refreshTitle();
ui.openScreen('title');

const unlock = () => { audio.init(); if (mode === 'title') audio.play('title'); };
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { capture: true });

$('title-menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    audio.ui('click');
    const a = b.dataset.act;
    if (a === 'new') startGame(newGame((Date.now() % 1e9) | 0));
    else if (a === 'continue') { const g = loadGame(); if (g) startGame(g); else ui.toast('That save could not be read.'); }
    else ui.openScreen(a);
});
$('pause-menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    audio.ui('click');
    const a = b.dataset.act;
    if (a === 'resume') ui.closeScreen('pause');
    else if (a === 'quit') { saveGame(G); toTitle(); }
    else ui.openScreen(a);
});
$('btn-pause').addEventListener('click', () => pause());
$('btn-hint').addEventListener('click', () => command({ t: 'hint' }));
$('btn-map').addEventListener('click', () => toggleMap());
$('nav-prev').addEventListener('click', () => command({ t: 'exit', dir: -1 }));
$('nav-next').addEventListener('click', () => command({ t: 'exit', dir: 1 }));
$('btn-notebook').addEventListener('click', () => openNotebook('clues'));
$('night-next').addEventListener('click', () => { audio.ui('click'); next(true); });
$('end-again').addEventListener('click', () => { audio.ui('click'); startGame(newGame((Date.now() % 1e9) | 0)); });
$('end-title').addEventListener('click', () => { audio.ui('click'); toTitle(); });

function startGame(g) {
    G = g;
    for (const id of [...ui.stack]) ui.closeScreen(id);
    document.activeElement?.blur?.();
    mode = 'play';
    map = false;
    acc = 0; idle = 0;
    keys.length = 0;
    hover = focus = null;
    ui.shownKey = null;
    ui.showHud(true);
    layout();
    audio.init();
    flushEvents();
    saveGame(G);
}

function toTitle() {
    for (const id of [...ui.stack]) ui.closeScreen(id);
    audio.stopVoice();
    mode = 'title';
    map = false;
    G = null;
    ui.showHud(false);
    for (const id of ['talk', 'quiz', 'pz-bar']) $(id).hidden = true;
    refreshTitle();
    ui.openScreen('title');
    audio.play('title');
}

function pause() {
    if (mode !== 'play' || ui.top() === 'end' || ui.stack.includes('pause')) return;
    keys.length = 0;
    clearTimeout(autoT);
    audio.stopVoice();
    audio.ui('open');
    saveGame(G);
    ui.openScreen('pause');
}

function openNotebook(tab) {
    if (mode !== 'play' || !G) return;
    ui.renderNotebook(G);
    ui.tab(tab);
    audio.ui('open');
    ui.openScreen('notebook');
}

function toggleMap(on = !map) {
    if (mode !== 'play' || !G) return;
    if (on && front(G)) return;
    map = on;
    focus = null;
    audio.ui(on ? 'open' : 'close');
}

// ------------------------------------------------------------------ commands
function command(cmd) {
    if (mode !== 'play' || !G || ui.stack.includes('pause')) return false;
    if (cmd.t === 'closemap') { toggleMap(false); return true; }
    const okd = act(G, cmd);
    if (okd) {
        idle = 0;
        if (cmd.t === 'go') { map = false; focus = null; }
        if (cmd.t === 'pick' && cmd.i !== undefined) view.press(cmd.i);
        if (cmd.t !== 'next') audio.ui('click');
    }
    flushEvents();
    return okd;
}

/** Advance the current line (or the night card). A line can't be skipped in its first quarter second. */
function next(force = false) {
    if (!G) return;
    const f = front(G);
    if (!f || !(f.say || f.night)) return;
    if (!force && f.say && performance.now() - ui.lineAt < 250) return;
    clearTimeout(autoT);
    audio.stopVoice();
    command({ t: 'next' });
}

function activate(t) {
    if (!t) return;
    command(t.cmd);
}

// ------------------------------------------------------------------ pointer and touch
function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
}
function hit(p) {
    const list = view.targets;
    for (let i = list.length - 1; i >= 0; i--) {
        const t = list[i];
        if (p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y && p.y <= t.y + t.h) return t;
    }
    return null;
}
canvas.addEventListener('pointerdown', (e) => {
    if (mode !== 'play' || ui.anyScreen()) return;
    e.preventDefault();
    if (ui.bagOpen) ui.closeBag();
    const p = toGame(e);
    pointer = p;
    const f = front(G);
    if (f?.say) { next(); return; }
    const t = hit(p);
    if (t) { focus = null; activate(t); return; }
    // a tap on the floor just walks there
    if (!f && !map && p.y > ROOMS[G.room].floor - 60) command({ t: 'walk', x: p.x });
});
canvas.addEventListener('pointermove', (e) => {
    pointer = toGame(e);
    hover = mode === 'play' ? hit(pointer) : null;
    showLabel(hover);
});
canvas.addEventListener('pointerleave', () => { hover = null; pointer = null; showLabel(null); });

function showLabel(t) {
    const el = $('label');
    if (!t || !t.label) { el.hidden = true; return; }
    const r = canvas.getBoundingClientRect();
    el.hidden = false;
    el.textContent = t.label;
    el.style.left = `${((t.x + t.w / 2) * r.width) / W}px`;
    el.style.top = `${(Math.max(14, t.y) * r.height) / H}px`;
}

// ------------------------------------------------------------------ keyboard and gamepad
const NO_SCROLL = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
window.addEventListener('keydown', (e) => {
    const tag = e.target?.tagName;
    if ((tag === 'INPUT' || tag === 'SELECT') && e.code !== 'Escape') return;
    // Space and the arrows must not scroll the page, but Space must still press a focused button
    if (NO_SCROLL.includes(e.code) && !(e.code === 'Space' && tag === 'BUTTON')) e.preventDefault();
    if (e.repeat) return;
    keys.push({ key: e.code, tag });
});
const padPrev = [];
function pollPad() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()] : [];
    const gp = pads.find((p) => p && p.connected);
    if (!gp) { padPrev.length = 0; return; }
    const MAP = { 0: 'Enter', 1: 'Escape', 9: 'KeyP', 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 2: 'KeyH', 3: 'KeyM', 4: 'KeyQ', 5: 'KeyE', 8: 'KeyB' };
    for (const i in MAP) {
        const on = !!gp.buttons[i]?.pressed;
        if (on && !padPrev[i]) keys.push({ key: MAP[i], pad: true });
        padPrev[i] = on;
    }
}

/** The canvas targets in reading order, for the arrow keys. */
function ordered() {
    return [...view.targets].sort((a, b) => (Math.abs(a.y + a.h / 2 - (b.y + b.h / 2)) < 40 ? a.x - b.x : a.y + a.h / 2 - (b.y + b.h / 2)));
}
function moveFocus(dir) {
    const list = ordered();
    if (!list.length) return;
    const i = focus ? list.findIndex((t) => t.key === focus.key) : -1;
    focus = list[(i + dir + list.length) % list.length];
    showLabel(focus);
}

function handleKeys() {
    const k = keys.shift();
    if (!k) return;
    const key = k.key;
    if (key === 'KeyP') { togglePause(); return; }
    if (ui.anyScreen()) {
        const top = ui.top();
        if (key === 'ArrowDown' || key === 'ArrowRight') ui.moveFocus(1);
        else if (key === 'ArrowUp' || key === 'ArrowLeft') ui.moveFocus(-1);
        else if (key === 'Escape' && !['title', 'night', 'end'].includes(top)) { audio.ui('close'); ui.closeTop(); }
        else if (key === 'Enter' && k.pad) document.activeElement?.click?.();
        return;
    }
    if (mode !== 'play') return;
    const f = front(G);
    if (key === 'Escape') { if (ui.bagOpen) ui.closeBag(); else if (map) toggleMap(false); else pause(); return; }
    if (f?.say) {
        // Enter or Space on the focused ▶ button is the browser's own click; anything else here is "next"
        if ((key === 'Space' || key === 'Enter') && k.tag !== 'BUTTON') next();
        else if (k.pad && key === 'Enter') next();
        return;
    }
    if (f && (f.ask || f.ded !== undefined)) {
        const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[key];
        if (n !== undefined) command({ t: 'answer', i: n });
        else if (key === 'ArrowDown' || key === 'ArrowRight') moveButtons(1);
        else if (key === 'ArrowUp' || key === 'ArrowLeft') moveButtons(-1);
        else if (key === 'Enter' && k.pad) document.activeElement?.click?.();
        return;
    }
    if (key === 'KeyH' && !f) command({ t: 'hint' });
    else if ((key === 'KeyQ' || key === 'BracketLeft') && !f) command({ t: 'exit', dir: -1 });
    else if ((key === 'KeyE' || key === 'BracketRight') && !f) command({ t: 'exit', dir: 1 });
    else if (key === 'KeyB') ui.toggleBag(G);
    else if (key === 'KeyJ') ui.toggleJobs();
    else if (key === 'KeyM' && !f) toggleMap();
    else if (key === 'KeyN') openNotebook('clues');
    else if (['ArrowRight', 'ArrowDown'].includes(key)) moveFocus(1);
    else if (['ArrowLeft', 'ArrowUp'].includes(key)) moveFocus(-1);
    else if ((key === 'Enter' || key === 'Space') && focus) activate(view.targets.find((t) => t.key === focus.key));
}
function moveButtons(dir) {
    const list = [...document.querySelectorAll('#quiz-answers .ans')].filter((b) => !b.disabled);
    const i = list.indexOf(document.activeElement);
    list[(i + dir + list.length) % list.length]?.focus();
}

// ------------------------------------------------------------------ events
function flushEvents() {
    if (!G || !G.events.length) return;
    const ev = G.events.splice(0);
    for (const e of ev) seen[e.type] = (seen[e.type] || 0) + 1;
    view.onEvents(G, ev);
    audio.onEvents(G, ev);
    ui.onEvents(G, ev);
    for (const e of ev) {
        if (e.type === 'say') {
            clearTimeout(autoT);
            const id = e.id;
            audio.say(id, () => {
                if (settings.auto === 'on' && G && !ui.anyScreen() && front(G)?.say === id) autoT = setTimeout(() => { if (!ui.anyScreen() && front(G)?.say === id) next(true); }, 700);
            });
            // warm the next few lines
            audio.prefetch(G.queue.slice(1, 5).filter((s) => s.say).map((s) => s.say));
        } else if (e.type === 'map') toggleMap(true);
        else if (e.type === 'book') { /* Orby mentions it; the Notebook opens after his line */ ui.wantBook = true; }
        else if (e.type === 'room') { map = false; focus = null; ui.closeBag(); }
        else if (e.type === 'job' || e.type === 'night' || e.type === 'day') saveGame(G);
        else if (e.type === 'end') { clearSave(); audio.play('ending'); }
    }
}

function theme() {
    if (!G || mode !== 'play') return 'title';
    if (G.over) return 'ending';
    if (G.puzzle) return 'fixit';
    if (G.room === 'vents' || front(G)?.night || (G.day === 5 && G.done.solve && !G.done.home)) return 'spooky';
    return 'station';
}

// pureTV routes actions through the same game commands as pointer and gamepad.
const tv = createTV({
    game: 'starbase-spooky',
    title: 'Starbase Spooky',
    controls: '↑↓ 热点 · A 调查 / 对话\n←→ 换房间 · X 地图\nB 背包 / 返回 · Y 笔记',
    suspend() { keys.length = 0; focus = null; showLabel(null); pause(); },
    observe() {
        const line = G && front(G);
        const top = ui.top();
        return {
            stage: mode === 'title' ? 'menu' : G?.over ? 'ended' : top ? 'paused' : 'playing',
            paused: mode === 'play' && !!top && !G?.over,
            loading: artPending() > 0,
            gameplay: {
                day: G?.day || 0, room: G?.room || '', tick: G?.t || 0,
                line: line?.say || '', question: line?.ask || '', puzzle: G?.puzzle?.kind || '',
                wireSelected: G?.puzzle?.sel ?? -1, wireLinks: G?.puzzle?.links?.filter(i => i !== null).length || 0,
                clues: G?.clues.slice() || [], items: G?.items.slice() || [], facts: G?.facts.slice() || [],
                solved: Object.keys(G?.fixed || {}), stickers: G?.stickers || 0,
                focus: focus?.key || '', screen: top || 'station', map, bag: !!ui.bagOpen,
                menuFocus: document.activeElement?.dataset.act || document.activeElement?.id || '',
                targetKeys: view.targets.map(t => t.key),
            },
        };
    },
});

function togglePause() {
    if (ui.top() === 'title') { ui.buttons('title')[0]?.click(); return; }
    if (mode !== 'play' || ['end', 'night'].includes(ui.top())) return;
    if (ui.stack.includes('pause')) {
        while (ui.stack.includes('pause')) ui.closeTop();
    } else if (ui.top() === 'notebook') ui.closeTop();
    else pause();
}

function pollTV() {
    const { pressed, cancelled } = tv.poll(mode === 'play' && !ui.anyScreen());
    if (cancelled || !Object.values(pressed).some(Boolean)) return;
    unlock();
    if (pressed.START) { togglePause(); return; }
    if (ui.anyScreen()) {
        // Night and ending buttons are the game's own progression controls.
        if (['night', 'end'].includes(ui.top())) {
            if (pressed.UP || pressed.LEFT) ui.moveFocus(-1);
            if (pressed.DOWN || pressed.RIGHT) ui.moveFocus(1);
            if (pressed.A) document.activeElement?.click();
        } else {
            menuInput(ui, pressed);
        }
        return;
    }
    const f = front(G);
    if (f?.say) {
        if (pressed.UP || pressed.DOWN) $('talk').scrollBy(0, (pressed.DOWN ? 1 : -1) * 72);
        if (pressed.A) next(true);
        return;
    }
    if (ui.bagOpen) {
        const slots = ui.bagSlots(G);
        const dir = Number(!!(pressed.RIGHT || pressed.DOWN)) - Number(!!(pressed.LEFT || pressed.UP));
        if (dir && slots.length) {
            const current = slots.findIndex(s => s.kind === ui.bagOpen.kind && s.id === ui.bagOpen.id);
            const nextSlot = slots[(current + dir + slots.length) % slots.length];
            ui.openBag(nextSlot.kind, nextSlot.id);
        }
        if (pressed.A && ui.bagLine) audio.say(ui.bagLine);
        if (pressed.B) ui.closeBag();
        return;
    }
    if (pressed.B) {
        if (map) toggleMap(false);
        else if (!f) ui.toggleBag(G);
        return;
    }
    if (pressed.X && !f) { toggleMap(); return; }
    if (pressed.Y && !f) { openNotebook('clues'); return; }
    if (!map && !f && (pressed.LEFT || pressed.RIGHT)) {
        command({ t: 'exit', dir: pressed.RIGHT ? 1 : -1 });
        return;
    }
    // The game's own key dispatcher handles dialogue timing, multiple-choice answers,
    // map destinations and the five different kinds of repair puzzle.
    for (const [button, key] of Object.entries({ UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', A: 'Enter' })) {
        if (pressed[button]) keys.push({ key, pad: true });
    }
}

// ------------------------------------------------------------------ frame loop
function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    time += dt;
    pollTV();
    pollPad();
    handleKeys();
    const running = mode === 'play' && G && !ui.anyScreen();
    if (running) {
        acc += dt;
        let n = 0;
        while (acc >= STEP && n < 12) { step(G, STEP); acc -= STEP; n++; }
        if (!front(G) && G.kit.tx === null && !map) idle += dt; else idle = 0;
    } else acc = 0;
    flushEvents();
    if (G && mode === 'play') {
        ui.sync(G);
        ui.hud(G, idle > 20, map);
        if (ui.bagOpen && front(G)) ui.closeBag();
        if (ui.wantBook && !front(G)) { ui.wantBook = false; openNotebook('facts'); }
        if (front(G)?.end) ui.showEnd(G);
    }
    view.frame(G, { mode: map ? 'map' : mode, hover, focus, pointer, marker: idle > 6 }, dt, time);
    // a focus that isn't a target any more (the room changed, a puzzle piece went) is dropped
    if (!$('bar').hidden && $('bar').offsetHeight !== lastBarH) layout();
    if (focus && !view.targets.some((t) => t.key === focus.key)) { focus = null; showLabel(null); }
    if (hover && !view.targets.some((t) => t.key === hover.key)) { hover = null; if (!focus) showLabel(null); }
    if (audio.ctx) audio.play(theme());
}

document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') { saveGame(G); pause(); } });
window.addEventListener('pagehide', () => { if (mode === 'play') saveGame(G); });
requestAnimationFrame((t) => { last = t; frame(t); });
