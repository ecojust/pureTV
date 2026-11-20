// Alchemist's Lattice — entry point. Boots the view, the UI and the sound; routes input to the play
// controller, the map and the menus; sends commands to the sim; plays its events through the view,
// the audio and the UI; plays the story's scenes; saves after every command; and moves between the
// title, the chapter map, a level, the shop and the ending.
//
// ?debug=1 exposes window.__al for the dev/ harnesses; &fast=N speeds the bot's autoplay.

import { createTV, menuInput } from '../../../shared/triptych/tv.js';
import { MAX_FRAME, VERSION } from './config.js';
import { View } from './view/view.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { Art } from './art.js';
import { Controller } from './play.js';
import { loadSettings, saveSettings, hasSave, saveGame, loadGame, clearSave, clearAll, loadBest, saveBest } from './save.js';
import { newGame, act, choices } from './sim/game.js';
import { live } from './sim/level.js';

import { ELEMENT_IDS } from './sim/data/elements.js';
import { SHAPES } from './sim/data/shapes.js';

const $ = (id) => document.getElementById(id);

const settings = loadSettings();
const best = loadBest();
const audio = new Audio();
audio.setVolumes(settings.sfx, settings.music);
const input = new Input();
const art = new Art();
// what the first screens need; the rest loads when it is first shown
art.loadAll(['workshop', 'table', 'coin', ...ELEMENT_IDS.map((e) => 'el-' + e), 'foe-warden', 'foe-serpent', 'foe-homunculus',
    ...['imp', 'hulk', 'crawler', 'vinelord', 'wisp', 'sentinel'].map((f) => 'foe-' + f)]);

let mode = 'title';          // title | map | level | shop | ending
let G = null;
let sel = null, enh = [];
let endAt = 0, endShown = false;
let time = 0, last = performance.now(), frames = 0;

let wasRunning = false;
const seen = {};

/** The space the HUD and the tool bar leave free for the lattice. */
function margins() {
    const M = { top: 10, bottom: 10, left: 10, right: 10 };
    const W = window.visualViewport?.width ?? innerWidth, H = window.visualViewport?.height ?? innerHeight;
    if (!$('hud').hidden) {
        const r = $('hud').getBoundingClientRect();
        if (r.height > r.width) M.left = Math.round(r.right + 10);      // the side column on a short landscape screen
        else M.top = Math.round(r.bottom + 12);
    }
    const t = $('tools');
    if (!t.hidden) {
        const r = t.getBoundingClientRect();
        if (r.height <= r.width) M.bottom = Math.round(H - r.top + 8);
        else if (r.left > W / 2) M.right = Math.round(W - r.left + 8);
        else M.left = Math.max(M.left, Math.round(r.right + 8));
    }
    M.right = Math.max(M.right, 216);
    return M;
}

const view = new View($('view'), { margins: () => margins(), art });
const ui = new UI({
    audio, art, settings,
    onSettings: (s) => { saveSettings(s); audio.setVolumes(s.sfx, s.music); applyCalm(); },
    onDelete: () => { clearAll(); G = null; toTitle(); },
    onItem: (id) => ctl.item(id),
    onSkill: (id) => ctl.skill(id),
});
const ctl = new Controller({
    view, audio, ui,
    getL: () => G?.level,
    enabled: () => mode === 'level' && !ui.anyScreen() && !!G?.level && live(G.level) && !G.level.events.length,
    act: (cmd) => doAct(cmd),
});

function applyCalm() {
    const calm = settings.calm === 'on' || (settings.calm === 'auto' && !!window.A11Y?.reducedMotion);
    view.setCalm(calm);
}
applyCalm();
$('version').textContent = 'v' + VERSION;

function doAct(cmd) {
    if (!G) return false;
    const ok = act(G, cmd);
    flush();
    if (ok) saveGame(G);
    return ok;
}

// ------------------------------------------------------------------ scenes

/** Play every queued scene in turn, then call after(). */
function scenes(after = () => {}) {
    if (!G || !G.queue.length || ui.dlg) { if (!ui.dlg) after(); return; }
    const id = G.queue[0];
    ui.play(id, () => { act(G, { t: 'seen', id }); saveGame(G); scenes(after); });
}

// ------------------------------------------------------------------ title, map, shop, level

function toTitle() {
    for (const id of [...ui.stack]) ui.closeScreen(id);
    mode = 'title';
    view.show = false;
    ui.showHud(false);
    ui.title(hasSave());
    audio.setIntensity(0);
    ui.openScreen('title');
}

$('title-menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    audio.ui('click');
    const a = b.dataset.act;
    if (a === 'new') {
        if (hasSave() && !confirm('Begin again? The apprenticeship in progress will be forgotten.')) return;
        clearSave();
        G = newGame(seed());
        saveGame(G);
        ui.closeScreen('title');
        toMap();
    } else if (a === 'continue') {
        const g = loadGame();
        if (!g) { ui.toast('That apprenticeship could not be read.'); clearSave(); ui.title(false); return; }
        G = g;
        ui.closeScreen('title');
        if (G.level) toLevel(false);
        else if (G.shop) toShop();
        else toMap();
    } else ui.openScreen(a);
});

function seed() { return ((Date.now() % 1e9) ^ Math.floor(performance.now() * 1000)) >>> 0; }

function toMap() {
    for (const id of [...ui.stack]) ui.closeScreen(id);
    mode = 'map';
    view.show = false;
    ui.showHud(false);
    sel = null; enh = [];
    art.load('map');
    ui.openScreen('map');
    renderMap();
    audio.setIntensity(0.5);
    audio.setWorld(Math.min(1, (G.chapter - 1) / 3));
    if (G.chapter > best.chapter) { best.chapter = G.chapter; saveBest(best); }
    scenes(() => {
        if (G.won && !endShown && !G.seen['ending-screen']) { G.seen['ending-screen'] = true; saveGame(G); showEnding(); return; }
        // the first node of the chapter is chosen for you when there is only one way in
        const open = choices(G);
        if (open.length === 1 && !G.at) select(open[0]);
    });
}

function renderMap() {
    ui.renderMap(G, { onSelect: (id) => { audio.ui('pick'); select(id); }, sel });
}
function select(id) {
    sel = id; enh = [];
    renderMap();
    showInfo();
}
function showInfo() {
    ui.mapInfo(G, sel, {
        enh,
        onToggle: (e) => { audio.ui('click'); enh = enh.includes(e) ? enh.filter((x) => x !== e) : [...enh, e]; showInfo(); },
        onClose: () => { sel = null; renderMap(); ui.mapInfo(G, null, {}); },
        onGo: () => go(),
    });
}
function go() {
    if (!sel) return;
    audio.ui('click');
    const id = sel;
    if (!doAct({ t: 'go', id, enh })) { ui.toast("You can't go there from here."); return; }
    ui.mapInfo(G, null, {});
    sel = null;
    if (G.shop) toShop();
    else if (G.level) toLevel(true);
    else if (G.reward?.cache) { renderMap(); scenes(() => { ui.result(G.reward, G); ui.openScreen('result'); }); }
}

for (const b of document.querySelectorAll('.map-bar [data-open]')) {
    b.addEventListener('click', () => {
        audio.ui('open');
        const w = b.dataset.open;
        if (w === 'cauldron') openCauldron();
        else if (w === 'skills') { ui.skills(G, train); ui.openScreen('skills'); }
        else if (w === 'journal') { for (const p of Object.keys(G.potions)) art.load('potion-' + p); ui.journal(G); ui.openScreen('journal'); }
        else if (w === 'pause') ui.openScreen('pause');
    });
}
function openCauldron() {
    art.load('cauldron');
    ui.cauldron(G, learn);
    ui.openScreen('cauldron');
    if (!G.seen['first-cauldron']) ui.play('first-cauldron', () => { act(G, { t: 'seen', id: 'first-cauldron' }); saveGame(G); });
}
function learn(id) { if (doAct({ t: 'learn', id })) { ui.cauldron(G, learn); ui.toast('A new tile type joins your repertoire.'); } }
function train(id) { if (doAct({ t: 'train', id })) { ui.skills(G, train); renderMap(); } }

function toShop() {
    for (const id of [...ui.stack]) ui.closeScreen(id);
    mode = 'shop';
    view.show = false;
    ui.shop(G, buy);
    ui.openScreen('shop');
    scenes();
}
function buy(id) { if (doAct({ t: 'buy', id })) ui.shop(G, buy); else audio.ui('deny'); }
$('shop-leave').addEventListener('click', () => { audio.ui('click'); doAct({ t: 'leave' }); toMap(); });

function toLevel(fresh) {
    for (const id of [...ui.stack]) ui.closeScreen(id);
    mode = 'level';
    view.show = true;
    view.reset();
    ctl.reset();
    input.flush();
    endAt = 0;
    ui.showHud(true);
    ui.hud(G.level);
    ui.tools(G.level);
    view.resize(true);
    audio.setIntensity(1);
    G.level.events.length = 0;
    document.activeElement?.blur?.();
    scenes(() => { if (fresh) { ui.brief(G.level); ui.openScreen('brief'); } });
}
$('brief-go').addEventListener('click', () => { audio.ui('click'); ui.closeScreen('brief'); });
$('brief-back').addEventListener('click', () => { audio.ui('click'); ui.closeScreen('brief'); });
$('btn-pause').addEventListener('click', () => pause());
$('btn-concede').addEventListener('click', () => { audio.ui('click'); doAct({ t: 'concede' }); });

function finishLevel() {
    doAct({ t: 'finish' });
    const R = G.reward;
    if (R.won && R.potion) art.load('potion-' + R.potion);
    ui.showHud(false);
    ui.result(R, G);
    ui.openScreen('result');
    if (R.ending) { best.marks++; saveBest(best); }
}
$('result-ok').addEventListener('click', () => {
    audio.ui('click');
    ui.closeScreen('result');
    if (mode === 'level') toMap();
});

function showEnding() {
    mode = 'ending';
    art.load('ending');
    const S = G.stats;
    $('ending-stats').textContent = `${S.levels} levels cleared · ${S.lines} lines · ${S.harvests} deposits · ${S.potions} potions · ${G.shapes.length} tile types · ${G.skills.length} skills.`;
    endShown = true;
    ui.openScreen('ending');
}
$('ending-on').addEventListener('click', () => { audio.ui('click'); ui.closeScreen('ending'); toMap(); });
$('ending-menu').addEventListener('click', () => { audio.ui('click'); saveGame(G); toTitle(); });

$('pause-menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    audio.ui('click');
    const a = b.dataset.act;
    if (a === 'resume') ui.closeScreen('pause');
    else if (a === 'quit') { if (G) saveGame(G); toTitle(); }
    else ui.openScreen(a);
});
function pause() {
    if (ui.is('pause') || mode === 'title') return;
    audio.ui('open');
    if (G) saveGame(G);
    ui.openScreen('pause');
}

const unlock = () => audio.init();
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { capture: true });

// ------------------------------------------------------------------ input routing

function handlePresses() {
    input.pollPad();
    const press = input.next();
    if (!press) return;
    const key = press.key;
    if (ui.dlg) { ui.dlgKey(key); return; }
    if (ui.anyScreen()) {
        const top = ui.top();
        if (top === 'map') { mapKey(key, press); return; }
        if (key === 'ArrowDown' || key === 'ArrowRight') ui.moveFocus(1);
        else if (key === 'ArrowUp' || key === 'ArrowLeft') ui.moveFocus(-1);
        else if ((key === 'Escape' || key === 'KeyP') && !['title', 'result', 'ending', 'shop'].includes(top)) { audio.ui('close'); ui.closeTop(); }
        else if ((key === 'Enter' && press.pad) || (key === 'Enter' && !press.onButton)) {
            const el = document.activeElement;
            if (el && el.tagName === 'BUTTON' && el.closest('.screen')) el.click();
        }
        return;
    }
    if (mode === 'level' && ctl.key(key) === 'pause') pause();
}

/** Keys on the map: the arrows walk the open nodes, Enter travels, C S J open the panels. */
function mapKey(key, press) {
    const open = choices(G);
    if (key === 'Escape' || key === 'KeyP') { if (sel) { sel = null; renderMap(); ui.mapInfo(G, null, {}); } else pause(); return; }
    if (key === 'KeyC') { openCauldron(); return; }
    if (key === 'KeyS' && !open.length) return;
    if (key === 'KeyJ') { ui.journal(G); ui.openScreen('journal'); return; }
    if (key === 'KeyK') { ui.skills(G, train); ui.openScreen('skills'); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Tab'].includes(key)) {
        if (!open.length) return;
        const d = ['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA'].includes(key) ? -1 : 1;
        const i = open.indexOf(sel);
        select(open[(i + d + open.length) % open.length]);
        audio.ui('move');
        return;
    }
    if (key === 'Enter' || key === 'Space') {
        const el = document.activeElement;
        if (el && el.tagName === 'BUTTON' && (press.pad || !press.onButton)) { el.click(); return; }
        if (sel && open.includes(sel)) go();
        else if (open.length) select(open[0]);
    }
}

// ------------------------------------------------------------------ events

function flush() {
    if (!G) return;
    const L = G.level;
    if (L && L.events.length) {
        const ev = L.events.splice(0);
        for (const e of ev) seen[e.type] = (seen[e.type] || 0) + 1;
        view.onEvents(L, ev, time);
        audio.onEvents(ev);
        for (const e of ev) {
            if (e.type === 'clear') audio.resonance = e.streak;
            if (e.type === 'stuck') ui.toast('Nothing fits. Use an item or a skill, or give up the level.');
            if (e.type === 'harvest') { ui.toast(`Harvested ${e.qty} ${e.el}.`); }
            if (e.type === 'won' || e.type === 'failed') endAt = time + (e.type === 'won' ? 1.6 : 1.3);
        }
    }
    if (G.events.length) {
        const ev = G.events.splice(0);
        for (const e of ev) seen['g:' + e.type] = (seen['g:' + e.type] || 0) + 1;
        audio.onEvents(ev);
    }
}

// ------------------------------------------------------------------ frame loop

function frame(now) {
    requestAnimationFrame(frame);
    frames++;
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    pollTV();
    if (!ui.is('pause')) time += dt;
    handlePresses();
    const running = mode === 'level' && !ui.anyScreen();
    if (running && !wasRunning) input.flush();
    wasRunning = running;
    if (running && endAt && time >= endAt && mode === 'level' && G?.level && !live(G.level)) { endAt = 0; finishLevel(); }
    flush();
    const L = mode === 'level' ? G?.level : null;
    let vs = {};
    if (L) {
        vs = live(L) && !ui.anyScreen() ? ctl.viewState() : { sel: -1, fits: L.hand.map(() => true) };
        vs.sight = L.skills.includes('sight');
        vs.vein = L.skills.includes('vein');
        if (L.skills.includes('surveyor')) vs.next = L.supply.slice(0, 3).map((s) => ({ el: s.el, cells: SHAPES[s.shape].cells }));
        ui.hud(L);
        ui.tools(L);
    }
    if (L && !ui.is('pause')) view.frame(L, dt, time, vs);
}

document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'level') pause(); });
window.addEventListener('pagehide', () => { if (G) saveGame(G); });
window.addEventListener('resize', () => { if (mode === 'map') renderMap(); });

const gl = view.stage.renderer.getContext();
const webglVersion = gl.getParameter(gl.VERSION);
let toolMode = false;
let mapControls = false;
function screenName() {
    if (ui.dlg) return ui.dlg.beats[ui.dlg.i]?.choice ? 'story-choice' : 'story';
    return ui.top() || mode;
}
function focusIn(box, delta = 0) {
    const buttons = [...box.querySelectorAll('button:not(:disabled):not([tabindex="-1"])')].filter(b => b.getClientRects().length);
    if (!buttons.length) return;
    const i = buttons.indexOf(document.activeElement);
    buttons[(Math.max(0, i) + delta + buttons.length) % buttons.length].focus();
}
const tv = createTV({
    game: 'alchemists-lattice', title: "Alchemist's Lattice",
    controls: '十字键 移动 · A 放置\nX 换手牌 · Y 转动（习得后）\nB 工具栏 / 地图操作 / 跳过对白',
    suspend() {
        input.flush();
        toolMode = false;
        mapControls = false;
        ctl.drag = null;
        ctl.cancelTarget();
        if (mode === 'level' && !ui.anyScreen()) pause();
    },
    observe() {
        const screen = screenName();
        const paused = ui.is('pause');
        const playing = mode === 'level' && screen === 'level';
        const L = G?.level;
        return { renderer: 'webgl2', webglVersion, stage: paused ? 'paused' : playing ? 'playing' : 'menu', paused,
            gameplay: { screen, moves: L?.moves ?? 0, score: L?.score ?? 0, chapter: G?.chapter ?? 0,
                cursorX: ctl.cursor.x, cursorY: ctl.cursor.y, selected: ctl.sel, toolMode, mapControls,
                tile: ctl.sel < 0 ? [] : L?.hand[ctl.sel]?.cells.map(c => [...c]) || [],
                filled: L?.cells.filter(Boolean).length ?? 0, storyBeat: ui.dlg?.i ?? -1 } };
    },
});
function pollTV() {
    const { pressed } = tv.poll(mode === 'level' && !ui.anyScreen());
    if (!Object.values(pressed).some(Boolean)) return;
    unlock();
    const dir = Number(!!(pressed.DOWN || pressed.RIGHT)) - Number(!!(pressed.UP || pressed.LEFT));
    if (ui.dlg) {
        if (dir) ui.dlgKey(dir > 0 ? 'ArrowDown' : 'ArrowUp');
        if (pressed.A || pressed.START) ui.dlgKey('Enter');
        else if (pressed.B || pressed.Y) ui.dlgKey('Escape');
        return;
    }
    const top = ui.top();
    if (top === 'map') {
        if (pressed.START) { mapControls = false; pause(); return; }
        if (pressed.B) {
            mapControls = !mapControls;
            if (mapControls) focusIn($('map'));
            else document.activeElement?.blur();
            return;
        }
        if (mapControls) {
            if (dir) focusIn($('map'), dir);
            if (pressed.A) document.activeElement?.click();
            return;
        }
        if (dir) mapKey(dir > 0 ? 'ArrowDown' : 'ArrowUp', { pad: true });
        if (pressed.A) { if (sel && choices(G).includes(sel)) go(); else if (choices(G).length) select(choices(G)[0]); }
        return;
    }
    if (top) {
        if (top === 'pause' && pressed.START) { ui.closeScreen('pause'); return; }
        if (top === 'title' && pressed.START) { $('title-menu').querySelector('button:not([hidden])')?.click(); return; }
        if (top === 'brief' && (pressed.START || pressed.A)) { $('brief-go').click(); return; }
        const fixed = ['title', 'result', 'shop', 'ending'].includes(top);
        const actions = {...pressed};
        if (fixed) { actions.Y = false; actions.B = false; }
        menuInput(ui, actions);
        return;
    }
    if (mode !== 'level') return;
    if (pressed.START) { toolMode = false; ctl.drag = null; pause(); return; }
    if (pressed.B) {
        if (ctl.target) { ctl.cancelTarget(); return; }
        toolMode = !toolMode;
        if (toolMode) focusIn($('tools')); else document.activeElement?.blur();
        return;
    }
    if (toolMode) {
        if (dir) focusIn($('tools'), dir);
        if (pressed.A) { document.activeElement?.click(); toolMode = false; document.activeElement?.blur(); }
        return;
    }
    if (pressed.X) ctl.key('Tab');
    if (pressed.Y) ctl.key('KeyR');
    for (const [button, key] of [['UP','ArrowUp'], ['DOWN','ArrowDown'], ['LEFT','ArrowLeft'], ['RIGHT','ArrowRight']]) {
        if (pressed[button]) ctl.key(key);
    }
    if (pressed.A) ctl.key('Enter');
}

toTitle();
requestAnimationFrame((t) => { last = t; frame(t); });

