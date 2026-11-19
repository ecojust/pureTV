import { createController } from '../../../shared/web/input.js';
import { h, isTypingTarget } from './game/dom.js';
import { modalOpen, topModal, moveFocus, focusablesIn } from './game/ui.js';
import { raceInput, makeRepeater } from './tv-mapping.js';
const DIR = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' };
const activeRace = app => app.tvRace && !app.tvRace.disposed && ['countdown', 'racing', 'finished', 'paused'].includes(app.tvRace.state) ? app.tvRace : null;
export function installTV(app) {
    let editorGrid = false, previousScreen = null, lastContext = '', lastPlaying = null;
    const repeat = makeRepeater();
    const hint = h('div#puretv-key-hint', { role: 'status' });
    document.body.append(hint);
    const suspend = () => {
        app.controls.cancelAll(); repeat.clear(); activeRace(app)?.pause();
        const replay = app.screenId === 'play' && app.screen?.session;
        if (replay?.playing && typeof replay.toggle === 'function') replay.toggle();
    };
    const controller = createController({ side: 'left', width: 178, top: '124px', onSuspend: suspend, onCancel: suspend });
    app.tvController = controller;
    const root = () => modalOpen() ? topModal().panel : activeRace(app)?.state === 'paused' ? app.tvRace.pauseEl : app.ui;
    function focusFirst() { const el = focusablesIn(root())[0]; el?.focus(); el?.scrollIntoView({ block: 'nearest' }); }
    function linear(delta) {
        const items = focusablesIn(root()); if (!items.length) return;
        const index = items.indexOf(document.activeElement), next = items[(index + delta + items.length) % items.length];
        next.focus(); next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function adjust(el, delta) {
        if (el?.tagName === 'SELECT') {
            const next = Math.max(0, Math.min(el.options.length - 1, el.selectedIndex + delta));
            if (el.options[next]?.disabled) return true; el.selectedIndex = next;
        } else if (el?.tagName === 'INPUT' && ['range', 'number'].includes(el.type)) {
            const step = Number(el.step) || 1, min = el.min === '' ? -Infinity : Number(el.min), max = el.max === '' ? Infinity : Number(el.max);
            el.value = String(Math.max(min, Math.min(max, Number(el.value) + delta * step)));
        } else return false;
        el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true;
    }
    async function keyboard(target) {
        let value = target.value || '';
        const result = await app.modal(close => {
            const display = h('output.tv-keyboard-value', value || ' ');
            const update = text => { value = text.slice(0, target.maxLength > 0 ? target.maxLength : 100000); display.textContent = value || ' '; };
            const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -_.,:/?=&+#{}[]"'.split('');
            return h('div.tv-keyboard', h('h2.pt-subtitle', target.getAttribute('aria-label') || 'Edit text'), display,
                h('div.tv-keyboard-grid', keys.map(c => h('button.pt-btn', { type: 'button', onclick: () => update(value + c) }, c === ' ' ? 'Space' : c))),
                h('div.pt-row', h('button.pt-btn', { onclick: () => update(value.slice(0, -1)) }, 'Delete'), h('button.pt-btn', { onclick: () => update('') }, 'Clear'), h('button.pt-btn', { onclick: () => close(null) }, 'Cancel'), h('button.pt-btn.primary', { onclick: () => close(value), 'data-autofocus': true }, 'Done')));
        }, { label: 'Controller keyboard' });
        if (result !== null && target.isConnected) { target.value = result; target.dispatchEvent(new Event('input', { bubbles: true })); target.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    function accept() {
        const el = document.activeElement; if (!el || !root().contains(el)) return focusFirst();
        if (isTypingTarget(el) && el.tagName !== 'SELECT') return keyboard(el);
        if (el.tagName === 'SELECT') return adjust(el, 1);
        if (el.type === 'file') return app.toast('File import uses the system file picker. Shared track codes can be entered with the controller keyboard.', { ms: 5000 });
        el.click();
    }
    function back() {
        if (modalOpen()) return topModal().cancel();
        if (editorGrid) { editorGrid = false; return focusFirst(); }
        if (app.screen?.back) return app.screen.back(app);
        if (app.screenId !== 'menu') app.goto('menu');
    }
    async function editorActions(s) {
        const choice = await app.modal(close => h('div.pt-col', h('h2.pt-subtitle', 'Track editor'),
            ...[['grid', 'Build with D-pad'], ['test', 'Test drive'], ['save', 'Save track'], ['delete', 'Delete block'], ['undo', 'Undo'], ['redo', 'Redo'], ['up', 'Layer up'], ['down', 'Layer down'], ['frame', 'Frame track'], ['menu', 'Main menu'], ['close', 'Close']].map(([id, label]) => h('button.pt-btn', { onclick: () => close(id), 'data-autofocus': id === 'grid' }, label))), { label: 'Editor controller actions' });
        if (app.screen?.session !== s) return;
        if (choice === 'grid') { editorGrid = true; document.activeElement?.blur(); }
        else if (choice === 'test') s.testDrive(); else if (choice === 'save') s.save(); else if (choice === 'delete') s.deleteAtCursor(); else if (choice === 'undo') s.undo(); else if (choice === 'redo') s.redo(); else if (choice === 'up') s.setLayer(s.state.layer + 1); else if (choice === 'down') s.setLayer(s.state.layer - 1); else if (choice === 'frame') s.frameTrack(); else if (choice === 'menu') s.leave();
    }
    function help() {
        app.modal(close => h('div.pt-col', h('h2.pt-subtitle', 'Penguintrack · pureTV'),
            h('p', 'Race: ↑ / A accelerate · ↓ / B brake · ← → steer · X checkpoint · Y camera · START pause. Resume only after a fresh START or Resume selection.'),
            h('p', 'Menus: D-pad focus · A select / edit · B back · X / Y previous / next control. Editor: Y switches grid / controls, A places, X rotates, START opens editor actions.'),
            h('p', '35 campaign tracks, the editor, local records and ghosts work offline. Online rooms, accounts and Pro purchases are unavailable in this edition. Local multiplayer keeps the original keyboard rules; the Wi-Fi controller operates one seat.'),
            h('button.pt-btn.primary', { onclick: () => close(), 'data-autofocus': true }, 'Continue')), { label: 'Controller help' });
    }
    document.addEventListener('click', event => { const a = event.target.closest?.('a[href]'); if (a && a.getAttribute('href')?.includes('../Empire/')) { event.preventDefault(); help(); } }, true);
    function poll(now) {
        const frame = controller.poll();
        if (previousScreen !== app.screenId) { editorGrid = false; previousScreen = app.screenId; repeat.clear(); }
        const race = activeRace(app), driving = !!race && race.state !== 'paused' && !modalOpen();
        const context = `${app.screenId}/${race?.state}/${modalOpen()}/${editorGrid}`;
        if (context !== lastContext) { app.controls.clearTV(); lastContext = context; }
        app.controls.setTV(raceInput(frame, driving));
        if (lastPlaying !== driving) { controller.setPlaying(driving); lastPlaying = driving; }
        document.documentElement.dataset.tvDriving = String(driving);
        let text = driving ? '↑ / A Gas   ↓ / B Brake   ← → Steer   X Respawn   Y Camera   START Pause' : app.screenId === 'editor' && editorGrid ? 'D-pad Grid   A Place   X Rotate   Y Controls   B Back   START Actions' : 'D-pad Focus   A Select   B Back   X / Y Previous / Next   START Menu';
        if (app.screenId === 'editor' && !editorGrid && !modalOpen()) { const label = document.activeElement?.getAttribute('aria-label') || document.activeElement?.getAttribute('title'); if (label) text += ' · ' + label; }
        if (hint.textContent !== text) hint.textContent = text;
        if (frame.cancelled) return;
        if (frame.pressed.START) {
            if (modalOpen()) { topModal().cancel(); return; }
            if (race) { race.state === 'paused' ? race.resume() : race.pause(); app.controls.clearTV(); return; }
            if (app.screenId === 'editor') { editorActions(app.screen.session); return; }
            if (app.screenId === 'menu') { help(); return; }
            back(); return;
        }
        if (driving) return;
        if (app.screenId === 'editor' && !modalOpen()) {
            if (frame.pressed.Y) { editorGrid = !editorGrid; editorGrid ? document.activeElement?.blur() : focusFirst(); return; }
            if (editorGrid) {
                const s = app.screen.session;
                for (const key of repeat.read(frame, now)) s.moveCursorKeys(DIR[key]);
                if (frame.pressed.A) s.placeAtCursorFromKeys(); if (frame.pressed.X) s.rotate(1);
                if (frame.pressed.B) { editorGrid = false; focusFirst(); } return;
            }
        }
        for (const key of repeat.read(frame, now)) { if ((key === 'LEFT' || key === 'RIGHT') && adjust(document.activeElement, key === 'LEFT' ? -1 : 1)) continue; moveFocus(root(), DIR[key]); }
        if (frame.pressed.X) linear(-1); if (frame.pressed.Y) linear(1);
        if (frame.pressed.B) back(); else if (frame.pressed.A) accept();
    }
    window.JoystickGameQA = { snapshot() {
        const race = activeRace(app), editor = app.screenId === 'editor' && app.screen?.session, panel = document.getElementById('puretv-controller-panel'), rect = panel?.getBoundingClientRect();
        const frame = controller.peek(), gl = app.renderer?.webgl?.getContext();
        let savedSettings = false; try { savedSettings = !!localStorage.getItem('penguintrack:settings'); } catch {}
        return { game: 'penguintrack', stage: race ? race.state === 'paused' ? 'paused' : race.state === 'finished' ? 'ended' : 'playing' : 'menu', renderer: gl ? (String(gl.getParameter(gl.VERSION)).startsWith('WebGL 2') ? 'webgl2' : 'webgl1') : null, webglVersion: gl ? gl.getParameter(gl.VERSION) : null, frames: frame.pollCount, controller: frame, paused: race?.state === 'paused', gameplay: { screen: app.screenId, focus: document.activeElement?.textContent?.trim().slice(0, 100) || '', savedSettings, showGhost: app.settings.showGhost, phase: race?.state || null, track: race?.track?.id || null, tick: race?.sim?.tick ?? null, time: race?.sim?.timeMs ?? null, speed: race?.sim?.car?.speedKmh ?? null, car: race?.sim?.car ? { pos: Array.from(race.sim.car.pos), vel: Array.from(race.sim.car.vel) } : null, controls: { ...app.controls.tv }, camera: race?.camIndex ?? null, ghostCount: race?.ghosts?.length ?? null, editorGrid, editorBlocks: editor?.doc?.track?.blocks?.length ?? null }, panel: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight, hidden: panel.hidden } : null, focused: document.activeElement?.textContent?.slice(0, 100) };
    } };
    return { poll, suspend, help };
}
