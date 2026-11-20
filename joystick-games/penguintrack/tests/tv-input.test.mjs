import test from 'node:test';
import assert from 'node:assert/strict';
import { raceInput, makeRepeater } from '../src/js/tv-mapping.js';
import { Controls } from '../src/js/game/controls.js';
import { sanitizeSettings } from '../src/js/game/settings.js';
import { isDevHost, hasProAI, hasProTAS } from '../src/js/services/entitlements.js';

const frame = (buttons = {}, pressed = {}, cancelled = false) => ({ buttons, pressed, cancelled });
test('nine independent buttons feed the original driving controls, not a model shortcut', () => {
    const c = new Controls(sanitizeSettings({}));
    c.setTV(raceInput(frame({ UP: true, DOWN: true, LEFT: true, RIGHT: true, A: true, B: true, START: true, X: true, Y: true }, { X: true, Y: true }), true));
    const input = c.input();
    assert.equal(input.steer, 0); assert.equal(input.gas, true); assert.equal(input.brake, true); assert.equal(input.respawn, true);
    assert.equal(c.pressed('cameraCycle'), true); assert.equal(c.pressed('pause'), false);
    c.setTV(raceInput(frame({ LEFT: true }), true)); assert.ok(c.input().steer < 0);
    c.setTV(raceInput(frame({ RIGHT: true }), true)); assert.ok(c.input().steer > 0);
});
test('pause/cancellation clears held, queued respawn and taps, without synthetic release', () => {
    const c = new Controls(sanitizeSettings({}));
    c.codes.add('ArrowUp'); c.taps.gas = true;
    c.setTV(raceInput(frame({ A: true, B: true, LEFT: true }, { X: true, Y: true }), true));
    c.cancelAll(); assert.deepEqual(c.input(), { steer: 0, gas: false, brake: false, respawn: false }); assert.equal(c.pressed('cameraCycle'), false);
    c.setTV(raceInput(frame({ UP: true, X: true }, { X: true }, true), true)); assert.equal(c.input().respawn, false);
    c.setTV(raceInput(frame({ UP: true }, {}), false)); assert.equal(c.input().gas, false);
});
test('touch-only play keeps the local pad, and a remote seat frees the race HUD', () => {
    const settings = sanitizeSettings({});
    const controls = new Controls(settings);
    controls.touchSeen = true;
    const idle = raceInput(frame(), true);
    assert.equal(controls.touchEnabled(), true);
    controls.setTV(idle, true);
    assert.equal(controls.touchEnabled(), false);
    controls.setTV(idle, false);
    assert.equal(controls.touchEnabled(), true);

    controls.setSettings({ ...settings, touchControls: 'on' });
    controls.setTV(idle, true);
    assert.equal(controls.touchEnabled(), true);
});

test('menu repeat has a delay and cancellation erases pending direction', () => {
    const r = makeRepeater(); assert.deepEqual(r.read(frame({ DOWN: true }, { DOWN: true }), 0), ['DOWN']);
    assert.deepEqual(r.read(frame({ DOWN: true }), 100), []); assert.deepEqual(r.read(frame({ DOWN: true }), 380), ['DOWN']);
    assert.deepEqual(r.read(frame({ DOWN: true }, {}, true), 400), []); assert.deepEqual(r.read(frame({}), 600), []);
});
test('native localhost cannot activate upstream development Pro bypass', () => {
    assert.equal(isDevHost({ hostname: 'localhost', protocol: 'http:' }), false);
    assert.equal(isDevHost({ protocol: 'file:' }), false);
    assert.equal(hasProAI(), false); assert.equal(hasProTAS(), false);
});
