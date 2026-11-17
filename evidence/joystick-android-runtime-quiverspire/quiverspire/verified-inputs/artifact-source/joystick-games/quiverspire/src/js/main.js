import { createTV } from '../../../shared/triptych/tv.js';
/**
 * main.js — Quiverspire entry point.
 *
 * Modes: 'title' (attract demo: the bot plays the selected chapter behind the
 *        menu) ⇄ 'talents'; 'playing' ⇄ 'paused'; 'choice' (a card pick is
 *        open); 'over'.
 *
 * Frame loop: real dt (capped at 0.05 s) × time scale (hit-stop, slow-mo)
 * feeds a fixed 1/120 s simulation accumulator. The sim's fx queue is
 * drained once a frame into the juice director (and room changes rebuild
 * the 3D room), then every view syncs from the world.
 *
 * three.js r165 via import map (see index.html).
 */

import { TICK, CHAPTERS, STAGE_PLAN, TALENTS, BOSSES, BOSS_ORDER } from './config.js';
import { createRun, stepWorld, choose, runRewards, stageLabel } from './sim/world.js';
import { makeBot, botInput } from './sim/bot.js';
import { killEnemy } from './sim/combat.js';
import {
    scene as sceneRef, camera as cameraRef, renderer as rendererRef, initScene, renderFrame, follow, snapCamera, setDanger, setQuality, getQuality,
} from './view/scene.js';
import { buildRoom, updateRoom } from './view/roomView.js';
import { initActors, resetActors, syncActors, setActorBiome } from './view/actors.js';
import { initProjectiles, syncProjectiles } from './view/projectiles.js';
import { initFx, updateFx, resetFx } from './view/fx.js';
import { initJuice, handleEvent } from './juice.js';
import { initInput, readInput, setInputEnabled, cancelInput } from './input.js';
import {
    initUI, showScreen, showHUD, refreshTitle, refreshTalents, showChoice, showPause, showOver,
    updateHUD, resetHUD, banner, setMuted, setHint,
} from './ui.js';
import { initAudio, sfx, startMusic, setIntensity, setSoundEnabled, isSoundEnabled } from './sounds.js';
import { state } from './state.js';

const debug = false;

// ============================================================
// Boot
// ============================================================

initScene();
initActors();
initProjectiles();
initFx();

let mode = 'title';
let world = null;
let bot = makeBot();
let attract = true;
let runOpts = null;
let hitstop = 0, slowScale = 1, slowTimer = 0;
let overTimer = -1;
let acc = 0;
let audioReady = false;
const fade = document.getElementById('fade');

initJuice({
    hitstop: (s) => { hitstop = Math.max(hitstop, s); },
    slowmo: (scale, s) => { slowScale = Math.min(slowScale, scale); slowTimer = Math.max(slowTimer, s); },
});

const maxedTalents = Object.fromEntries(Object.keys(TALENTS).map((k) => [k, 8]));

function wakeAudio() {
    initAudio();
    if (!audioReady) {
        audioReady = true;
        setSoundEnabled(!state.muted);
        startMusic(world ? world.chapter : state.chapter);
        setIntensity(0);
    }
}

initUI({
    play: () => startRun({ chapter: state.chapter, endless: false }),
    endless: () => startRun({ chapter: 1, endless: true }),
    talents: () => { wakeAudio(); sfx.click(); mode = 'talents'; refreshTalents(); showScreen('talents'); },
    back: () => { sfx.click(); toTitle(false); },
    buy: (id) => { if (state.buyTalent(id)) { sfx.levelUp(); refreshTalents(); } else sfx.click(); },
    resume: () => setPaused(false),
    quit: () => { if (world && !attract) { world.result = world.result ?? 'dead'; finishRun(); } },
    again: () => startRun(runOpts),
    menu: () => toTitle(true),
    mute: () => {
        wakeAudio();
        state.muted = !state.muted;
        state.save();
        setSoundEnabled(!state.muted);
        setMuted(state.muted);
    },
    pause: () => setPaused(true),
    choose: (id) => {
        if (mode !== 'choice' || !world) return;
        choose(world, id);
        showScreen(null);
        mode = 'playing';
        setInputEnabled(true);
    },
    chapter: (d) => {
        wakeAudio();
        sfx.click();
        state.chapter = Math.max(1, Math.min(CHAPTERS.length, state.chapter + d));
        state.save();
        refreshTitle(state.chapter);
        newAttract();
    },
});
setMuted(state.muted);

initInput({
    onKey: (e) => {
        if (e.code === 'KeyM') { document.getElementById('mute-btn').click(); return; }
        if (mode === 'title') {
            if (e.code === 'Enter' || e.code === 'Space') { if (state.chapter <= state.unlocked) startRun({ chapter: state.chapter, endless: false }); }
            else if (e.code === 'ArrowLeft' || e.code === 'KeyA') document.getElementById('ch-prev').click();
            else if (e.code === 'ArrowRight' || e.code === 'KeyD') document.getElementById('ch-next').click();
        } else if (mode === 'over' && (e.code === 'Enter' || e.code === 'Space')) startRun(runOpts);
        else if (mode === 'choice' && /^Digit[1-3]$/.test(e.code)) {
            const cards = document.querySelectorAll('#choice-cards .card');
            cards[Number(e.code.slice(5)) - 1]?.click();
        } else if (e.code === 'KeyP' || e.code === 'Escape') {
            if (mode === 'playing' || mode === 'choice') setPaused(true);
            else if (mode === 'paused') setPaused(false);
            else if (mode === 'talents') toTitle(false);
        }
    },
});

// ============================================================
// Worlds
// ============================================================

function installWorld(w) {
    fade.classList.remove('on');
    world = w;
    world.fxQueue.length = 0;
    acc = 0;
    hitstop = 0; slowScale = 1; slowTimer = 0;
    resetFx();
    rebuildRoomView();
}

function rebuildRoomView() {
    setActorBiome(world.room.biome);
    resetActors();
    buildRoom(world);
    snapCamera(world.player.x, world.player.y);
}

function newAttract() {
    attract = true;
    bot = makeBot();
    installWorld(createRun({ seed: (Date.now() & 0xffffff) ^ 0x2545f, chapter: state.chapter, talents: maxedTalents }));
    if (audioReady) startMusic(state.chapter);
}

function startRun(opts) {
    wakeAudio();
    sfx.click();
    runOpts = { ...opts };
    attract = false;
    installWorld(createRun({ seed: opts.seed ?? ((Date.now() ^ 0x9e3779b9) >>> 0), chapter: opts.chapter, endless: opts.endless, talents: state.talents }));
    startMusic(world.chapter);
    setIntensity(1);
    mode = 'playing';
    overTimer = -1;
    showScreen(null);
    showHUD(true);
    resetHUD();
    setInputEnabled(true);
    banner(opts.endless ? 'ENDLESS SPIRE' : `CHAPTER ${world.chapter}`, CHAPTERS[world.chapter - 1].name);
}

function toTitle(fresh) {
    sfx.click();
    mode = 'title';
    showHUD(false);
    setHint('');
    setInputEnabled(false);
    showScreen('title');
    refreshTitle(state.chapter);
    if (fresh || !attract) newAttract();
}

function setPaused(p) {
    if (p && (mode === 'playing' || mode === 'choice')) {
        pausedFrom = mode;
        mode = 'paused';
        setInputEnabled(false);
        showPause(world);
        showScreen('pause');
    } else if (!p && mode === 'paused') {
        sfx.click();
        mode = pausedFrom;
        if (mode === 'choice') { showChoice(world); showScreen('choice'); }
        else { showScreen(null); setInputEnabled(true); }
    }
}
let pausedFrom = 'playing';

function finishRun() {
    fade.classList.remove('on');        // a chapter clear ends mid-transition
    const coins = runRewards(world);
    const rec = state.recordRun(world, coins);
    showOver(world, coins, rec);
    mode = 'over';
    setHint('');
    setInputEnabled(false);
    showScreen('over');
    setIntensity(0);
}

document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

// ============================================================
// Events that the shell (not the juice) cares about
// ============================================================

function shellEvent(ev) {
    if (ev.type === 'roomExit') {
        fade.classList.add('on');
    } else if (ev.type === 'roomEnter') {
        rebuildRoomView();
        setTimeout(() => fade.classList.remove('on'), 60);
        if (!attract) {
            const kind = ev.kind;
            if (kind === 'boss') {
                const id = BOSS_ORDER[(world.chapter - 1) % BOSS_ORDER.length];
                banner('BOSS', (world.diffChapter > 5 ? 'Ascended ' : '') + BOSSES[id].name, 'red');
            } else if (kind === 'angel') banner('SANCTUARY', 'An angel rests here', 'small');
            else if (kind !== 'miniboss') banner(world.endless ? `ROOM ${ev.label}` : ev.label, '', 'small');
        }
    } else if (ev.type === 'floorUp' && !attract) {
        startMusic(world.chapter);
    }
}

// ============================================================
// Frame loop
// ============================================================

let elapsed = 0, lastT = performance.now();
let fpsFrames = 0, fpsTime = 0, slowSamples = 0;

function frame(now) {
    requestAnimationFrame(frame);
    const tvFrame = tv.poll(mode === 'playing');
    pollTV(tvFrame);
    const realDt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    elapsed += realDt;

    // --- Time effects ---
    if (slowTimer > 0) { slowTimer -= realDt; if (slowTimer <= 0) slowScale = 1; }
    else if (slowScale < 1) slowScale = Math.min(1, slowScale + realDt * 2.5);
    let simDt = realDt * slowScale;
    if (hitstop > 0) { hitstop -= realDt; simDt = 0; }

    // --- Simulation ---
    const w = world;
    const running = mode === 'playing' || mode === 'title' || mode === 'talents' || (mode === 'over' && overTimer > 0);
    if (running && w) {
        const input = attract ? botInput(bot, w, simDt || 1 / 60) : readInput();
        if (!attract && mode === 'playing') {
            input.mx += Number(!!tvFrame.buttons.RIGHT) - Number(!!tvFrame.buttons.LEFT);
            input.my += Number(!!tvFrame.buttons.UP) - Number(!!tvFrame.buttons.DOWN);
            const length = Math.hypot(input.mx, input.my); if (length > 1) { input.mx /= length; input.my /= length; }
        }
        acc += simDt;
        let steps = 0;
        while (acc >= TICK && steps < 30) {
            stepWorld(w, input, TICK);
            acc -= TICK;
            steps++;
            if (w.phase === 'choice' || w.result) { acc = 0; break; }
        }
        if (steps >= 30) acc = 0;
    }

    // --- Events ---
    if (w) {
        const q = w.fxQueue;
        for (let i = 0; i < q.length; i++) {
            shellEvent(q[i]);
            handleEvent(q[i], w, attract);
        }
        q.length = 0;
    }

    // --- Attract demo restarts itself; real runs end in the over screen ---
    if (attract && w && (w.result || w.stageNum > 6)) newAttract();
    if (!attract && w) {
        if (mode === 'playing' && w.phase === 'choice') {
            mode = 'choice';
            setInputEnabled(false);
            showChoice(w);
            showScreen('choice');
            sfx.levelUp();
        }
        if (mode === 'playing' && w.result && overTimer < 0) overTimer = w.result === 'clear' ? 0.6 : 1.8;
        if (overTimer > 0 && mode === 'playing') {
            overTimer -= realDt;
            if (overTimer <= 0) finishRun();
        }
        // Music and hints follow the room.
        if (mode === 'playing') {
            setIntensity(w.phase === 'fight' ? (w.room.kind === 'boss' || w.room.kind === 'miniboss' ? 2 : 1) : 0);
            setDanger(Math.max(0, 1 - w.player.hp / w.player.stat.maxHp / 0.3));
            let hint = '';
            if (w.stageNum === 1 && w.roomTime < 6 && w.phase === 'fight') hint = 'Stand still to shoot · move to dodge';
            else if (w.phase === 'clear' && w.shrine && !w.shrine.used && w.shrine.kind === 'angel') hint = 'Walk to the angel';
            else if (w.phase === 'clear' && w.grid.doorOpen && w.clearT > 2.5) hint = !w.endless && w.stage === STAGE_PLAN.length - 1 ? '▲ Take the portal to finish the chapter' : '▲ Walk through the door';
            setHint(hint);
        } else setDanger(0);
    }

    // --- Views ---
    if (w) {
        // Frame the boss and the player together; otherwise look a little ahead of the player.
        const boss = w.boss && w.boss.alive ? w.boss : null;
        const ahead = boss ? Math.max(3, Math.min(5.2, (boss.y - w.player.y) * 0.5)) : 3;
        follow(w.player.x, w.player.y + ahead - 3);
        updateRoom(w, realDt, elapsed);
        syncActors(w, realDt, elapsed);
        syncProjectiles(w, realDt, elapsed);
        if (!attract && mode !== 'title') updateHUD(w);
    }
    updateFx(realDt);
    renderFrame(realDt, elapsed);

    // --- Adaptive quality: drop a tier after sustained low frame rates ---
    fpsFrames++; fpsTime += realDt;
    if (fpsTime >= 1) {
        const fps = fpsFrames / fpsTime;
        fpsFrames = 0; fpsTime = 0;
        if (fps < 40) slowSamples++; else slowSamples = 0;
        if (slowSamples >= 3 && getQuality() < 2 && !debug) { setQuality(getQuality() + 1); slowSamples = 0; }
    }
}

// ============================================================
// Go
// ============================================================


const tvGL = rendererRef.getContext();
const tvWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && tvGL instanceof WebGL2RenderingContext;
let tvScreen = '';
function menuButtons() {
    const id = mode === 'paused' ? 'pause' : mode;
    return [...(document.getElementById(id)?.querySelectorAll('button') || [])].filter(b => !b.disabled && b.offsetParent !== null);
}
function focusMenu() {
    if (tvScreen === mode && menuButtons().includes(document.activeElement)) return;
    tvScreen = mode;
    const preferred = { title:'play-btn', paused:'resume-btn', over:'again-btn', talents:'talents-back' }[mode];
    const list = menuButtons(); (list.find(b => b.id === preferred) || list[0])?.focus();
}
const tv = createTV({ game:'quiverspire', title:'Quiverspire', controls:'方向键移动闪避 · 停下自动射箭\n天赋与祝福卡可用方向键和A选择\nX 音乐开关 · Y 返回 / 暂停',
    suspend() { cancelInput(); setPaused(true); },
    observe: () => ({ renderer:tvWebGL2 ? 'webgl2' : 'webgl1', webglVersion:tvWebGL2 ? 2 : 1,
        stage:mode === 'playing' ? 'playing' : ['paused','choice'].includes(mode) ? 'paused' : mode === 'over' ? 'ended' : 'menu',
        paused:['paused','choice'].includes(mode), gameplay:{ tick:world?.time || 0, playerX:world?.player.x || 0, playerY:world?.player.y || 0,
            score:world?.coins || 0, kills:world?.stats.kills || 0, damage:world?.stats.dmgDealt || 0, hp:world?.player.hp || 0,
            lastShotAt:world?.player.shootT ?? -9, stageNumber:world?.stageNum || 0, screen:mode, phase:world?.phase || '', choices:world?.player.picked.length || 0 } }),
});
function pollTV(f) {
    const q=f.pressed;
    if (Object.values(q).some(Boolean)) wakeAudio();
    if (q.START) {
        cancelInput();
        if (mode === 'title') document.getElementById('play-btn').click();
        else if (mode === 'over') document.getElementById('again-btn').click();
        else if (mode === 'playing' || mode === 'choice') setPaused(true);
        else if (mode === 'paused') setPaused(false);
        return;
    }
    if (q.X) document.getElementById('mute-btn').click();
    if (q.Y) {
        if (mode === 'playing' || mode === 'choice') setPaused(true);
        else if (mode === 'paused') setPaused(false);
        else if (mode === 'talents') toTitle(false);
        return;
    }
    if (mode === 'playing') return;
    focusMenu();
    const buttons=menuButtons(), dir=Number(!!(q.DOWN || q.RIGHT)) - Number(!!(q.UP || q.LEFT));
    if (dir && buttons.length) buttons[(buttons.indexOf(document.activeElement) + dir + buttons.length) % buttons.length].focus();
    if (q.A) document.activeElement?.click?.();
}

newAttract();
refreshTitle(state.chapter);
showScreen('title');
requestAnimationFrame((t) => { lastT = t; frame(t); });
