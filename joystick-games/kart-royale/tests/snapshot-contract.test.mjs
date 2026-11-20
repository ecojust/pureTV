import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Bundle and execute the real installTV and its snapshot. Stub only the native
// controller; no copy of the observation implementation is used by this test.
const bundled = await build({
    absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
    entryPoints: ['src/src/tv-input.ts'], bundle: true, write: false,
    platform: 'browser', format: 'iife', globalName: 'TVAdapterContract',
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

function fixture({ version = 'WebGL 2.0 contract context', state = 2, contextAvailable = true } = {}) {
    const calls = { peek: 0, poll: 0, storageWrites: 0, glReads: 0, rendererReads: 0 };
    let frame = freeze({ pollCount: 41, buttons: {}, pressed: {}, released: {}, connected: true });
    const forbidden = name => () => { throw new Error(`snapshot invoked ${name}`); };
    function makeContext(version, renderer) {
        return { version, renderer, lost: false, canvas: new EventTarget(), VERSION: 0x1f02,
            isContextLost() { return this.lost; },
            getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 0x9246 }),
            getParameter(parameter) {
                assert.equal(this.lost, false);
                if (parameter === this.VERSION) { calls.glReads++; return this.version; }
                assert.equal(parameter, 0x9246); calls.rendererReads++; return this.renderer;
            } };
    }
    let gl = makeContext(version, 'original GPU');
    const position = freeze({ x: 1, y: 2, z: 3, toArray() { return [this.x, this.y, this.z]; } });
    const ctx = freeze({
        settings: { quality: 0 },
        race: { state, raceTime: 12.5, setPaused: forbidden('setPaused'), update: forbidden('race update'),
            player: { forwardSpeed: 57, position, lap: 2, place: 3, driftDir: -1, driftTier: 2,
                driftCharge: 0.6, boostTime: 0.2, cancelControllerDrift: forbidden('cancelControllerDrift') } },
        renderer: { getContext: () => contextAvailable ? gl : null },
    });
    const input = freeze({ pad: { prefs: { hand: 'left' } }, state: { accel: 1, steer: -1, drift: true },
        cancelTV: forbidden('cancelTV'), setTV: forbidden('setTV'), update: forbidden('input update') });
    const document = { body: { append() {} }, activeElement: { textContent: 'Race view' },
        createElement: () => ({}), querySelector: () => null, getElementById: () => null };
    const sandbox = { document, window: {},
        localStorage: { getItem: () => null, setItem() { calls.storageWrites++; throw new Error('snapshot wrote storage'); } },
        __controller: { peek() { calls.peek++; return frame; }, poll() { calls.poll++; throw new Error('snapshot consumed input'); } },
    };
    vm.runInNewContext(bundled.outputFiles[0].text, sandbox);
    sandbox.TVAdapterContract.installTV(ctx, input);
    const before = JSON.stringify({ ctx, input });
    return { calls, ctx, input, before, snapshot: () => sandbox.window.JoystickGameQA.snapshot(),
        get gl() { return gl; },
        replaceContext(version, renderer) { gl = makeContext(version, renderer); },
        setFrameCount(value) { frame = freeze({ ...frame, pollCount: value }); } };
}

test('production snapshot identifies Kart Royale and reads the current renderer context', () => {
    const f = fixture();
    for (const [version, renderer] of [['WebGL 2.0 contract context', 'webgl2'], ['WebGL 1.0 contract context', 'webgl1'], [null, null]]) {
        f.replaceContext(version, 'current GPU');
        const snapshot = f.snapshot();
        assert.equal(snapshot.game, 'kart-royale');
        assert.equal(snapshot.renderer, renderer); assert.equal(snapshot.webglVersion, version);
    }
    assert.ok(f.calls.glReads > 0); assert.equal(f.calls.poll, 0);
});

test('renderer identity is sampled once per live context and refreshed after restore or replacement', () => {
    const f = fixture();
    function expectIdentity(renderer, version, device, reads) {
        const snap = f.snapshot();
        assert.deepEqual([snap.renderer, snap.webglVersion, snap.webglRenderer], [renderer, version, device]);
        assert.deepEqual([f.calls.glReads, f.calls.rendererReads], [reads, reads]);
    }
    expectIdentity('webgl2', f.gl.version, 'original GPU', 1);
    expectIdentity('webgl2', f.gl.version, 'original GPU', 1);
    f.gl.lost = true;
    expectIdentity(null, null, null, 1);
    f.gl.lost = false;
    f.gl.renderer = 'restored GPU';
    f.gl.canvas.dispatchEvent(new Event('webglcontextrestored'));
    expectIdentity('webgl2', f.gl.version, 'restored GPU', 2);
    // The same context object may also finish recovering between observations.
    f.gl.version = 'WebGL 2.0 renewed contract context';
    f.gl.canvas.dispatchEvent(new Event('webglcontextrestored'));
    expectIdentity('webgl2', f.gl.version, 'restored GPU', 3);
    const oldCanvas = f.gl.canvas;
    f.replaceContext('WebGL 1.0 replacement context', 'replacement GPU');
    expectIdentity('webgl1', f.gl.version, 'replacement GPU', 4);
    oldCanvas.dispatchEvent(new Event('webglcontextrestored'));
    expectIdentity('webgl1', f.gl.version, 'replacement GPU', 4);
});

test('missing, lost or unknown contexts cannot report an available WebGL renderer', () => {
    const absent = fixture({ contextAvailable: false });
    assert.equal(absent.snapshot().renderer, null);
    assert.equal(absent.snapshot().webglVersion, null);
    assert.equal(absent.calls.glReads, 0);
    for (const version of [null, '', 'unknown', 'OpenGL ES 3.0', 'WebGL 10.0', 2]) {
        const f = fixture({ version });
        assert.equal(f.snapshot().renderer, null);
        assert.equal(f.snapshot().webglVersion, version);
        assert.equal(f.calls.poll, 0);
    }
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
    assert.equal(JSON.stringify({ ctx: f.ctx, input: f.input }), f.before);
});

test('racing, paused and results observations do not advance or mutate the game', () => {
    for (const [state, stage] of [[2, 'playing'], [5, 'paused'], [4, 'ended']]) {
        const f = fixture({ state });
        const first = f.snapshot();
        assert.equal(first.game, 'kart-royale'); assert.equal(first.stage, stage);
        assert.equal(first.paused, state === 5);
        assert.equal(first.gameplay.time, 12.5); assert.equal(first.gameplay.lap, 2);
        first.gameplay.position[0] = 999; first.gameplay.controls.accel = 0;
        const again = f.snapshot();
        assert.equal(again.gameplay.position[0], 1); assert.equal(again.gameplay.controls.accel, 1);
        assert.equal(JSON.stringify({ ctx: f.ctx, input: f.input }), f.before);
        assert.equal(f.calls.storageWrites, 0); assert.equal(f.calls.poll, 0);
    }
});
