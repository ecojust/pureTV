import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Execute the production adapter. Only the native controller boundary is stubbed;
// the snapshot function itself is neither copied nor replaced.
const bundled = await build({
    absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
    entryPoints: ['src/js/tv-input.js'], bundle: true, write: false,
    platform: 'browser', format: 'iife', globalName: 'TVAdapterContract',
    // dom.js is the sole import.meta user in this dependency graph. Its lazy
    // stylesheet loader is not invoked here, but retain its real source URL.
    define: { 'import.meta.url': JSON.stringify(new URL('../src/js/game/dom.js', import.meta.url).href) },
    plugins: [{ name: 'native-controller-fixture', setup(build) {
        build.onResolve({ filter: /shared\/web\/input\.js$/ }, () => ({ path: 'controller', namespace: 'fixture' }));
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
            contents: 'export function createController() { return globalThis.__controller; }', loader: 'js',
        }));
    } }],
});

function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
}

function fixture({ version = 'WebGL 2.0 contract context', phase = 'racing' } = {}) {
    const calls = { peek: 0, poll: 0, storageWrites: 0, glReads: 0 };
    let frame = freeze({ pollCount: 41, buttons: {}, pressed: {}, released: {}, connected: true });
    let contextVersion = version;
    const forbidden = name => () => { throw new Error(`snapshot invoked ${name}`); };
    class Element {
        constructor() { this.children = []; this.classList = { add() {} }; }
        append(...children) { this.children.push(...children); }
        appendChild(child) { this.children.push(child); return child; }
        setAttribute(name, value) { this[name] = String(value); }
    }
    const document = {
        body: new Element(), activeElement: { textContent: 'Race view' },
        createElement: () => new Element(), addEventListener() {}, getElementById: () => null,
    };
    const gl = { VERSION: 0x1f02, getParameter(parameter) {
        assert.equal(parameter, this.VERSION); calls.glReads++; return contextVersion;
    } };
    const app = freeze({
        screenId: 'race', screen: {}, settings: { showGhost: true },
        renderer: { webgl: { getContext: () => contextVersion === null ? null : gl } },
        controls: { tv: { gas: true, brake: false, left: true, right: false },
            cancelAll: forbidden('cancelAll'), setTV: forbidden('setTV'), clearTV: forbidden('clearTV') },
        tvRace: { state: phase, disposed: false, track: { id: 'A01' }, camIndex: 2,
            ghosts: [{ id: 'personal-best' }], sim: { tick: 123, timeMs: 2460,
                car: { speedKmh: 57, pos: [1, 2, 3], vel: [4, 5, 6] }, step: forbidden('simulation step') },
            pause: forbidden('pause'), resume: forbidden('resume') },
    });
    // installTV assigns this public reference, but all model objects stay frozen.
    const installedApp = { ...app };
    const sandbox = { document, Node: Element, window: {},
        localStorage: { getItem: () => null, setItem() { calls.storageWrites++; throw new Error('snapshot wrote storage'); } },
        __controller: { peek() { calls.peek++; return frame; }, poll() { calls.poll++; throw new Error('snapshot consumed input'); } },
    };
    vm.runInNewContext(bundled.outputFiles[0].text, sandbox);
    sandbox.TVAdapterContract.installTV(installedApp);
    Object.freeze(installedApp);
    const before = JSON.stringify(app);
    return { calls, app, before, snapshot: () => sandbox.window.JoystickGameQA.snapshot(),
        setVersion(value) { contextVersion = value; },
        setFrameCount(value) { frame = freeze({ ...frame, pollCount: value }); } };
}

test('production snapshot identifies Penguintrack and reads the current renderer context', () => {
    const f = fixture();
    for (const [version, renderer] of [['WebGL 2.0 contract context', 'webgl2'], ['WebGL 1.0 contract context', 'webgl1'], [null, null]]) {
        f.setVersion(version);
        const snapshot = f.snapshot();
        assert.equal(snapshot.game, 'penguintrack');
        assert.equal(snapshot.renderer, renderer); assert.equal(snapshot.webglVersion, version);
    }
    assert.ok(f.calls.glReads > 0); assert.equal(f.calls.poll, 0);
});

test('snapshot uses peek pollCount without consuming another native frame', () => {
    const f = fixture();
    for (let i = 0; i < 4; i++) {
        const snapshot = f.snapshot();
        assert.equal(snapshot.frames, 41); assert.equal(snapshot.controller.pollCount, 41);
    }
    f.setFrameCount(79);
    assert.equal(f.snapshot().frames, 79);
    assert.equal(f.calls.peek, 5); assert.equal(f.calls.poll, 0);
    assert.equal(JSON.stringify(f.app), f.before);
});

test('racing, paused and finished observations do not advance or mutate the game', () => {
    for (const [phase, stage] of [['racing', 'playing'], ['paused', 'paused'], ['finished', 'ended']]) {
        const f = fixture({ phase });
        const first = f.snapshot();
        assert.equal(first.game, 'penguintrack'); assert.equal(first.stage, stage);
        assert.equal(first.paused, phase === 'paused');
        assert.equal(first.gameplay.tick, 123); assert.equal(first.gameplay.time, 2460);
        // Snapshot-owned vectors/controls must not permit a caller to edit the model.
        first.gameplay.car.pos[0] = 999; first.gameplay.car.vel[0] = 999; first.gameplay.controls.gas = false;
        const again = f.snapshot();
        assert.equal(again.gameplay.car.pos[0], 1); assert.equal(again.gameplay.car.vel[0], 4);
        assert.equal(again.gameplay.controls.gas, true);
        assert.equal(JSON.stringify(f.app), f.before);
        assert.equal(f.calls.storageWrites, 0); assert.equal(f.calls.poll, 0);
    }
});
