// Route the pureTV pad through the original menu buttons and lattice controller.
import { createTV, menuInput } from '../../../shared/triptych/tv.js';

export function mountTV({ view, audio, ui, ctl, input, mode, game, pause }) {
    const gl = view.stage.renderer.getContext();
    const version = gl.getParameter(gl.VERSION);
    const renderer = /^WebGL 2/.test(version) ? 'webgl2' : 'webgl1';
    let palette = null;
    let resumeLocked = false;

    function selectPower(button = null) {
        palette?.removeAttribute('data-tv-selected');
        palette = button;
        if (palette) palette.setAttribute('data-tv-selected', '');
    }
    function paletteButtons() {
        const items = [...document.querySelectorAll('#powers .pwr')];
        items.push(document.getElementById('hud-arc'));
        if (!document.getElementById('stuck').hidden) items.push(document.getElementById('btn-concede'));
        return items;
    }
    function suspend() {
        audio.suspendForHost();
        input.flush();
        ctl.drag = null;
        ctl.hover = null;
        selectPower();
        if (mode() !== 'play') return;
        resumeLocked = true;
        while (ui.anyScreen() && ui.top() !== 'pause') ui.closeTop();
        pause();
    }
    function observe() {
        const g = game(), stage = mode();
        const paused = stage === 'play' && ui.anyScreen();
        return {
            renderer, webglVersion: gl.isContextLost() ? null : version,
            stage: stage === 'title' ? 'menu' : stage === 'play' ? (paused ? 'paused' : 'playing') : 'ended',
            paused, audioState: audio.ctx?.state || 'idle',
            gameplay: {
                mode: g.mode, screen: ui.top() || null, elapsed: g.t, moves: g.moves,
                score: g.score, light: g.light, arc: g.arc, sparks: g.sparks,
                cells: Array.from(g.cells), hand: g.hand.map(h => h?.uid ?? null),
                selected: ctl.sel, cursorX: ctl.cursor.x, cursorY: ctl.cursor.y, target: ctl.target,
                palette: palette?.dataset.power || palette?.id || 'board',
                owned: [...g.owned], restored: [...g.restored], stuck: g.stuck,
            },
        };
    }
    const tv = createTV({
        game: 'neon-arcana', title: '霓虹秘仪',
        controls: '方向键 移动格位\nA 选择 / 放置 · B 换符块\nX 打开能力栏 · Y 取消\n能力栏 ←→ 选择 · A 使用',
        observe, suspend,
    });

    function resume() {
        if (ui.top() === 'pause') {
            resumeLocked = false;
            audio.resumeForPlay();
            ui.closeScreen('pause');
        }
    }
    function poll() {
        const { pressed, cancelled } = tv.poll(mode() === 'play' && !ui.anyScreen());
        if (cancelled || !Object.values(pressed).some(Boolean)) return;
        audio.init();
        if (pressed.START) {
            selectPower();
            if (ui.top() === 'title') document.querySelector('#title-menu button:not([hidden])')?.click();
            else if (ui.top() === 'pause') resume();
            else if (mode() === 'play' && !ui.anyScreen()) pause();
            return;
        }
        if (ui.anyScreen()) {
            if (!(resumeLocked && ui.top() === 'pause') && ui.top() !== 'ending') menuInput(ui, pressed);
            else if (ui.top() === 'ending') menuInput(ui, { ...pressed, B: false, Y: false });
            return;
        }
        if (mode() !== 'play') return;
        if (palette) {
            const choices = paletteButtons();
            if (pressed.X || pressed.Y || pressed.B) selectPower();
            else if (pressed.A) {
                const chosen = palette;
                selectPower();
                if (chosen.dataset.power && chosen.disabled) ui.toast(chosen.title);
                else chosen.click();
            } else {
                const dir = Number(pressed.RIGHT || pressed.DOWN) - Number(pressed.LEFT || pressed.UP);
                if (dir) selectPower(choices[(choices.indexOf(palette) + dir + choices.length) % choices.length]);
            }
            return;
        }
        if (pressed.X) { selectPower(paletteButtons()[0]); return; }
        for (const [name, key] of Object.entries({
            A: 'Space', B: 'Tab', Y: 'Escape',
            LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', UP: 'ArrowUp', DOWN: 'ArrowDown',
        })) {
            if (pressed[name]) { if (ctl.key(key) === 'pause') pause(); return; }
        }
    }
    return { poll, resume, locked: () => resumeLocked, reset() { resumeLocked = false; selectPower(); } };
}
