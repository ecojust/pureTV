import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const source = readFileSync(new URL('../../main/assets/player-focus.js', import.meta.url), 'utf8');
const script = new Script(source);
const HIDDEN = 'data-puretv-cctv-hidden';
const ROOT = 'data-puretv-cctv-root';
const PATH = 'data-puretv-cctv-path';
const FILL = 'data-puretv-cctv-fill';

class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
    dispatch(type) { for (const fn of this.listeners.get(type) || []) fn(); }
    listenerCount() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}

class Element extends Target {
    constructor(tag, id = '') {
        super(); this.nodeType = 1; this.tagName = tag.toUpperCase(); this.id = id;
        this.children = []; this.attributes = new Map(); this.parentElement = null; this.parentNode = null;
        this.paused = true; this.ended = false; this.error = null; this.readyState = 0; this.playCalls = 0;
    }
    appendChild(node) { if (node.parentNode) node.parentNode.removeChild(node); this.children.push(node); node.parentElement = this; node.parentNode = this; return node; }
    removeChild(node) { this.children.splice(this.children.indexOf(node), 1); node.parentElement = null; node.parentNode = null; return node; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    contains(node) { return this === node || this.children.some(child => child.contains(node)); }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.tagName === selector.toUpperCase() ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    play() { this.playCalls++; return Promise.reject(new Error('Fixture autoplay needs a gesture')); }
}

class Document {
    constructor() {
        this.title = 'CCTV-1 官方直播'; this.documentElement = new Element('html');
        this.head = this.documentElement.appendChild(new Element('head'));
        this.body = this.documentElement.appendChild(new Element('body'));
    }
    createElement(tag) { return new Element(tag); }
    querySelector(selector) { return this.documentElement.querySelector(selector); }
    getElementById(id) {
        const find = node => node.id === id ? node : node.children.map(find).find(Boolean);
        return find(this.documentElement) || null;
    }
}

function environment() {
    let time = 0, serial = 0;
    const timers = new Map(), observers = [];
    const win = new Target();
    win.setTimeout = (fn, delay) => { const id = ++serial; timers.set(id, { fn, due: time + delay }); return id; };
    win.clearTimeout = id => timers.delete(id);
    win.MutationObserver = class {
        constructor(callback) { this.callback = callback; this.active = false; observers.push(this); }
        observe(target, options) { this.target = target; this.options = options; this.active = true; }
        disconnect() { this.active = false; }
        emit() { if (this.active) this.callback([]); }
    };
    function doc() { const d = new Document(); d.defaultView = win; return d; }
    const document = doc();
    const context = { window: win, document, Date: { now: () => time } };
    function advance(ms) {
        const end = time + ms;
        while (true) {
            const next = [...timers.entries()].filter(([, t]) => t.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
            if (!next) break;
            time = next[1].due; timers.delete(next[0]); next[1].fn();
        }
        time = end;
    }
    return { win, document, doc, observers, timers, advance, run: () => script.runInNewContext(context, { timeout: 1000 }), get api() { return win.__puretvCctvFocus; } };
}

function official(doc) {
    const header = doc.body.appendChild(new Element('header'));
    const layout = doc.body.appendChild(new Element('div', 'live-layout'));
    const left = layout.appendChild(new Element('div', 'video'));
    const player = left.appendChild(new Element('div', 'player'));
    const toolbar = left.appendChild(new Element('div', 'share-toolbar'));
    const listings = layout.appendChild(new Element('aside', 'programmes'));
    const advert = doc.body.appendChild(new Element('iframe', 'framecoment1'));
    return { header, layout, left, player, toolbar, listings, advert };
}

function video(parent) { return parent.appendChild(new Element('video', 'h5player_player')); }
function plain(value) { return JSON.parse(JSON.stringify(value)); }

test('recognizes the actual official player, preserves its tree and error/controls, excludes promotional iframe', () => {
    const e = environment(), f = official(e.document), v = video(f.player);
    const error = f.player.appendChild(new Element('div', 'error_msg_player'));
    const controls = f.player.appendChild(new Element('div', 'control_bar'));
    const parent = v.parentElement;
    assert.deepEqual(plain(e.run()), { found: true, playing: false, title: e.document.title });
    assert.equal(v.parentElement, parent);
    assert.equal(f.player.parentElement, f.left);
    for (const node of [f.header, f.toolbar, f.listings, f.advert]) assert.equal(node.hasAttribute(HIDDEN), true);
    for (const node of [v, error, controls]) assert.equal(node.hasAttribute(HIDDEN), false);
    assert.equal(v.hasAttribute(PATH), false, 'do not override official video display:none on an error');
    assert.equal(v.controls, true);
    assert.equal(v.playCalls, 1);
    assert.equal(f.advert.listenerCount(), 0);
    assert.equal(e.observers[0].options.attributes, undefined);
});

test('reinjection is idempotent and refresh never resumes a user-paused video', () => {
    const e = environment(), f = official(e.document), v = video(f.player);
    e.run(); const api = e.api;
    v.paused = false; v.readyState = 3;
    assert.equal(e.run().playing, true);
    assert.equal(e.api, api);
    v.paused = true;
    assert.equal(api.refresh().playing, false);
    assert.equal(v.playCalls, 1);
    assert.equal(e.document.head.children.length, 1);
    assert.equal(e.observers.length, 1);
});

test('handles an asynchronously created player and video without selecting the unrelated iframe', () => {
    const e = environment();
    const ad = e.document.body.appendChild(new Element('iframe', 'framecoment1'));
    assert.equal(e.run().found, false);
    assert.equal(ad.listenerCount(), 0);
    const f = official(e.document), v = video(f.player);
    e.observers[0].emit(); e.observers[0].emit(); e.advance(120);
    assert.equal(e.api.refresh().found, true);
    assert.equal(v.playCalls, 1);
    assert.equal(ad.hasAttribute(HIDDEN), true);
});

test('focuses nested same-origin frames in place and leaves cross-origin content opaque', () => {
    const e = environment(), f = official(e.document);
    const first = f.player.appendChild(new Element('iframe'));
    first.contentDocument = e.doc();
    const nested = first.contentDocument.body.appendChild(new Element('iframe'));
    nested.contentDocument = e.doc();
    const inner = official(nested.contentDocument), v = video(inner.player);
    v.paused = false; v.readyState = 3;
    const foreign = f.player.appendChild(new Element('iframe'));
    let reads = 0;
    Object.defineProperty(foreign, 'contentDocument', { get() { reads++; throw new Error('SecurityError'); } });
    assert.equal(e.run().playing, true);
    assert.equal(v.parentElement, inner.player);
    assert.equal(first.parentElement, f.player);
    assert.equal(first.hasAttribute(FILL), true);
    assert.equal(inner.header.hasAttribute(HIDDEN), true);
    assert.equal(foreign.hasAttribute(HIDDEN), false);
    assert.equal(foreign.hasAttribute(FILL), true);
    assert.equal(reads, 1);
    assert.equal(foreign.listenerCount(), 1);
});

test('frame load refreshes the player; navigation cleans detached documents and their observers', () => {
    const e = environment(), f = official(e.document);
    const frame = f.player.appendChild(new Element('iframe'));
    frame.contentDocument = e.doc();
    const old = frame.contentDocument, oldFixture = official(old);
    const oldVideo = video(oldFixture.player);
    e.run();
    frame.contentDocument = e.doc();
    const replacement = official(frame.contentDocument), newVideo = video(replacement.player);
    frame.dispatch('load'); e.advance(120);
    assert.equal(old.head.children.length, 0);
    assert.equal(e.observers[1].active, false);
    assert.equal(oldFixture.player.hasAttribute(ROOT), false);
    assert.equal(newVideo.playCalls, 1);
    assert.equal(oldVideo.playCalls, 1);
});

test('a replacement player clears stale hidden markers and preserves its new ancestry', () => {
    const e = environment(), f = official(e.document);
    video(f.player); e.run();
    const newParent = e.document.body.appendChild(new Element('section'));
    e.api.refresh(); assert.equal(newParent.hasAttribute(HIDDEN), true);
    f.left.removeChild(f.player);
    const replacement = newParent.appendChild(new Element('div', 'player'));
    const v = video(replacement);
    e.api.refresh();
    assert.equal(newParent.hasAttribute(HIDDEN), false);
    assert.equal(replacement.hasAttribute(ROOT), true);
    assert.equal(v.playCalls, 1);
    assert.equal(f.layout.hasAttribute(HIDDEN), true);
});

test('observers expire and dispose removes timers, listeners and injected styles; reinjection works', () => {
    const e = environment(), f = official(e.document);
    const v = video(f.player), frame = f.player.appendChild(new Element('iframe'));
    e.run(); e.advance(45000);
    assert.ok(e.observers.every(o => !o.active));
    assert.equal(e.api.refresh().found, true, 'explicit native refresh remains usable after the observer deadline');
    e.win.dispatch('pagehide');
    assert.equal(e.api.disposed, true);
    assert.equal(frame.listenerCount(), 0);
    assert.equal(e.win.listenerCount(), 0);
    assert.equal(e.timers.size, 0);
    assert.equal(e.document.head.children.length, 0);
    assert.equal(f.player.hasAttribute(ROOT), false);
    assert.equal(f.header.hasAttribute(HIDDEN), false);
    assert.equal(e.api.refresh().found, false);
    assert.equal(e.run().found, true);
    assert.equal(v.playCalls, 2);
});

test('frame discovery and observation are bounded even for hostile or unexpectedly large DOMs', () => {
    const e = environment(), f = official(e.document);
    for (let i = 0; i < 40; i++) {
        const frame = f.player.appendChild(new Element('iframe'));
        frame.contentDocument = e.doc(); official(frame.contentDocument);
    }
    e.run();
    assert.equal(e.observers.length, 8);
    assert.equal(f.player.children.filter(n => n.listenerCount() === 1).length, 16);
    const first = f.player.children[0];
    let doc = first.contentDocument;
    for (let i = 0; i < 12; i++) {
        const frame = doc.getElementById('player').appendChild(new Element('iframe'));
        frame.contentDocument = e.doc(); official(frame.contentDocument); doc = frame.contentDocument;
    }
    e.api.refresh();
    assert.equal(doc.getElementById('player').hasAttribute(ROOT), false, 'depth cap stops traversal');
});

test('CSS fills the viewport without scrollbars or overscroll but does not hide player internals', () => {
    const e = environment(), f = official(e.document); video(f.player); e.run();
    const css = e.document.head.children[0].textContent;
    assert.match(css, /overscroll-behavior:none!important/);
    assert.match(css, /::-webkit-scrollbar\{display:none!important/);
    assert.match(css, /object-fit:contain!important/);
    assert.doesNotMatch(css, /video[^{}]*\{[^}]*display:/);
});
