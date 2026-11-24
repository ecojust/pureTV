/*ARENA-CORE:BEGIN v2.0.1 sha256:cfe1449bc854*/
/* ARENA-CORE v2 — shared visual / feel / test layer for the Claude Game Arena games (Furki Ozkan).
 *
 * Injected inline as <script type="module"> right after each game's importmap by tools/inject.mjs,
 * so every game stays a single file. It runs before the game's own module (document order) and puts
 * everything on window.ArenaCore. Everything is optional: a game that never calls ArenaCore behaves exactly as before.
 * The one global side effect is ?capture (see test.capture below), which only exists when that query flag is set.
 *
 *   ArenaCore.kalite                      'dusuk' | 'orta' | 'yuksek' (auto: integrated GPU -> orta; ?q=… overrides; saved)
 *   ArenaCore.render.setup(renderer, scene, camera, opts) -> fx { render(), setSize(w,h), dispose(), info }
 *       opts: { tonlama: 'neutral'|'aces'|'agx'|'none', pozlama, ortam (0..1 env light), bloom: {guc, esik, yaricap}|false,
 *               renk: {doygunluk, kontrast}, tonlama 'koru' keeps the game's own tone mapping,
 *               vinyet (0..1), grain (0..1), saydam (true when the canvas is transparent over a CSS background) }
 *   ArenaCore.kabuk.yukleme({ baslik, alt, renk }) -> { ilerle(0..1), bitir() }   loading overlay
 *   ArenaCore.kabuk.onceDerle(renderer, scene, camera) -> Promise   shader warm-up (renderer.compile, never throws)
 *   ArenaCore.his.{ tween, hitstop, zamanOlcegi, sarsinti, ucanYazi }   game feel (Sumiro-tuned defaults)
 *   ArenaCore.kamera.yay(cur, target, omega, dt, vel)                    critically damped spring (numbers or Vector3)
 *   ArenaCore.test.kur({ read, step })     exposes window.__game for bots / gates
 *   ArenaCore.test.capture                 ?capture&fps=30&seed=1 : virtual clock, window.__capture.advance(n)
 */
import * as THREE from 'three';

const VERSION = '2.0.1';
const Q = new URLSearchParams(location.search);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { if (!Q.has('auto') && !Q.has('nosave') && !Q.has('capture')) localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
};

/* ---------- test: deterministic capture (must run before the game module) ---------- */
const test = (() => {
  const t = { capture: null };
  if (Q.has('capture')) {
    const fps = parseFloat(Q.get('fps')) || 30;
    let now = 0, seed = (parseInt(Q.get('seed')) || 1) >>> 0;
    const queue = [];
    const realNow = performance.now.bind(performance);
    performance.now = () => now;
    window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
    window.cancelAnimationFrame = () => { };
    Math.random = () => { seed = (seed + 0x6D2B79F5) >>> 0; let x = seed; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    t.capture = window.__capture = {
      fps,
      get time() { return now; },
      advance(n = 1) { for (let i = 0; i < n; i++) { now += 1000 / fps; const cbs = queue.splice(0); for (const cb of cbs) cb(now); } return now; },
      realNow,
    };
  }
  t.kur = (api) => { window.__game = Object.assign(window.__game || {}, api); return window.__game; };
  return t;
})();

/* ---------- quality tier ---------- */
const kalite = (() => {
  const forced = Q.get('q');
  if (forced === 'dusuk' || forced === 'orta' || forced === 'yuksek') return forced;
  if (Q.has('low')) return 'dusuk';
  const saved = store.get('arena.core.kalite', null);
  if (saved) return saved;
  let tier = 'yuksek';
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    if (/Intel|UHD|Iris|Mali|Adreno [1-5]|PowerVR|SwiftShader|llvmpipe/i.test(name)) tier = 'orta';
    if (/SwiftShader|llvmpipe/i.test(name) || (navigator.deviceMemory && navigator.deviceMemory <= 2)) tier = 'dusuk';
  } catch (e) { }
  store.set('arena.core.kalite', tier);
  return tier;
})();

/* ---------- render preset ---------- */
const TONLAMA = { none: THREE.NoToneMapping, aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping };

function cssKatman(vinyet, grain) {
  const el = document.createElement('div');
  el.className = 'arena-core-katman';
  el.setAttribute('aria-hidden', 'true');
  const noise = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
  el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;' +
    `background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${(0.55 * vinyet).toFixed(3)}) 100%)` +
    (grain > 0 ? `, ${noise}` : '') + ';' + (grain > 0 ? `background-size:auto, 160px 160px;opacity:1;` : '');
  if (grain > 0) {
    const g = document.createElement('div');
    g.style.cssText = `position:absolute;inset:0;background-image:${noise};background-size:160px 160px;opacity:${(0.5 * grain).toFixed(3)};mix-blend-mode:overlay;`;
    el.style.background = `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${(0.55 * vinyet).toFixed(3)}) 100%)`;
    el.appendChild(g);
  }
  return el;
}

const NAN_SHADER = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); bvec4 bad = bvec4(c.r != c.r || c.r > 65000.0, c.g != c.g || c.g > 65000.0, c.b != c.b || c.b > 65000.0, c.a != c.a);
      if (any(bad)) c = vec4(0.0, 0.0, 0.0, 1.0); gl_FragColor = c; }`,
};

const VINYET_SHADER = {
  uniforms: { tDiffuse: { value: null }, guc: { value: 0.35 }, grain: { value: 0.0 }, zaman: { value: 0 }, doygunluk: { value: 1 }, kontrast: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float guc; uniform float grain; uniform float zaman; uniform float doygunluk; uniform float kontrast; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + zaman) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float v = smoothstep(0.85, 0.25, length(d) * 1.25);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); c.rgb = mix(vec3(l), c.rgb, doygunluk); c.rgb = (c.rgb - 0.5) * kontrast + 0.5;
      c.rgb *= mix(1.0, v, guc); c.rgb += (h(vUv * 1000.0) - 0.5) * grain * 0.08; gl_FragColor = c; }`,
};

const render = {
  async _addons() {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { ShaderPass }] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/OutputPass.js'),
      import('three/addons/postprocessing/ShaderPass.js')]);
    return { EffectComposer, RenderPass, UnrealBloomPass, OutputPass, ShaderPass };
  },
  setup(renderer, scene, camera, opts = {}) {
    const o = Object.assign({ tonlama: 'neutral', pozlama: 1.0, ortam: 0.0, bloom: { guc: 0.35, esik: 0.85, yaricap: 0.4 }, vinyet: 0.3, grain: 0.04, saydam: false }, opts);
    if (Q.has('nocore')) return { render: () => renderer.render(scene, camera), setSize() { }, dispose() { }, info: { mod: 'kapali' } };
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (o.tonlama !== 'koru') { // 'koru' keeps the game's own tone mapping / exposure
      renderer.toneMapping = TONLAMA[o.tonlama] ?? THREE.NeutralToneMapping;
      renderer.toneMappingExposure = o.pozlama;
    }
    let pmrem = null, envRT = null;
    let ortamBizim = null;
    // a game that loads its own environment map later must not inherit our low intensity
    const ortamDenetle = () => { if (ortamBizim && scene.environment !== ortamBizim && scene.environmentIntensity === o.ortam) { scene.environmentIntensity = 1; ortamBizim = null; } };
    if (o.ortam > 0) {
      import('three/addons/environments/RoomEnvironment.js').then(({ RoomEnvironment }) => {
        pmrem = new THREE.PMREMGenerator(renderer);
        envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
        if (!scene.environment) { scene.environment = envRT.texture; scene.environmentIntensity = o.ortam; }
        ortamBizim = envRT.texture;
      }).catch(() => { });
    }
    const info = { mod: 'dogrudan', kalite, tonlama: o.tonlama };
    const fx = { info, composer: null };
    let css = null;
    const cssKur = () => { if (css || !(o.vinyet > 0 || o.grain > 0)) return; css = cssKatman(o.vinyet, kalite === 'dusuk' ? 0 : o.grain); const c = renderer.domElement; (c.parentNode || document.body).insertBefore(css, c.nextSibling); info.mod = 'dogrudan+css'; };
    if (o.saydam || kalite === 'dusuk' || !o.bloom) cssKur();
    // colour grade: saturation / contrast. Direct mode uses a compositor-side CSS filter (no extra GPU pass);
    // composer mode does it in the vignette shader instead (see below).
    const renk = Object.assign({ doygunluk: 1, kontrast: 1 }, o.renk);
    const cssFiltre = (renk.doygunluk !== 1 || renk.kontrast !== 1) ? `saturate(${renk.doygunluk}) contrast(${renk.kontrast})` : '';
    if (cssFiltre) renderer.domElement.style.filter = cssFiltre;
    fx.render = () => { ortamDenetle(); renderer.render(scene, camera); };
    fx.setSize = () => { };
    if (!o.saydam && o.bloom && kalite !== 'dusuk') {
      // composer is created asynchronously; until it is ready, frames render directly
      render._addons().then(A => {
        const size = renderer.getSize(new THREE.Vector2());
        const pr = renderer.getPixelRatio();
        const rt = new THREE.WebGLRenderTarget(size.x * pr, size.y * pr, { type: THREE.HalfFloatType, samples: kalite === 'yuksek' ? 4 : 2 });
        const composer = new A.EffectComposer(renderer, rt);
        composer.addPass(new A.RenderPass(scene, camera));
        composer.addPass(new A.ShaderPass(NAN_SHADER));
        const bloom = new A.UnrealBloomPass(new THREE.Vector2(size.x, size.y), o.bloom.guc, o.bloom.yaricap, o.bloom.esik);
        if (kalite === 'orta') bloom.resolution.set(size.x / 2, size.y / 2);
        composer.addPass(bloom);
        composer.addPass(new A.OutputPass());
        let vin = null;
        if (o.vinyet > 0 || o.grain > 0 || cssFiltre) {
          vin = new A.ShaderPass(VINYET_SHADER); vin.uniforms.guc.value = o.vinyet; vin.uniforms.grain.value = o.grain;
          vin.uniforms.doygunluk.value = renk.doygunluk; vin.uniforms.kontrast.value = renk.kontrast; composer.addPass(vin);
          renderer.domElement.style.filter = ''; // the shader grades now
        }
        fx.composer = composer; info.mod = 'composer';
        fx.render = () => { ortamDenetle(); if (vin) vin.uniforms.zaman.value = (performance.now() / 1000) % 100; composer.render(); };
        fx.setSize = (w, h) => { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); };
      }).catch(e => { info.hata = String(e); cssKur(); }); // e.g. no three/addons/ in the import map: keep the CSS look
    }
    fx.dispose = () => { if (css) css.remove(); if (envRT) envRT.dispose(); if (pmrem) pmrem.dispose(); if (fx.composer) fx.composer.dispose(); };
    return fx;
  },
};

/* ---------- shell: loading overlay + shader warm-up ---------- */
const kabuk = {
  yukleme({ baslik = '', alt = 'Yükleniyor', renk = '#e0a01c', zemin = '#15120f' } = {}) {
    if (Q.has('auto') || Q.has('capture')) return { ilerle() { }, bitir() { } };
    const el = document.createElement('div');
    el.className = 'arena-core-yukleme';
    el.setAttribute('role', 'status');
    el.style.cssText = `position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:${zemin};color:#f1efea;font:600 18px/1.3 system-ui,sans-serif;transition:opacity .45s ease`;
    el.innerHTML = `<div style="font-size:clamp(28px,6vw,46px);font-weight:800;letter-spacing:.02em">${baslik}</div>` +
      `<div style="width:min(280px,60vw);height:6px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden"><div class="cubuk" style="height:100%;width:4%;background:${renk};transition:width .25s ease"></div></div>` +
      `<div class="alt" style="opacity:.7;font-size:14px">${alt}</div>`;
    document.body.appendChild(el);
    const cubuk = el.querySelector('.cubuk');
    let bitti = false;
    const api = {
      ilerle(p) { if (!bitti) cubuk.style.width = Math.max(4, Math.min(100, p * 100)).toFixed(1) + '%'; },
      bitir() { if (bitti) return; bitti = true; cubuk.style.width = '100%'; el.style.opacity = '0'; setTimeout(() => el.remove(), 500); },
    };
    setTimeout(() => api.bitir(), 12000); // never trap the player behind the overlay
    return api;
  },
  async onceDerle(renderer, scene, camera) {
    // synchronous compile: compileAsync threw an uncatchable TypeError ('isReady') in one game; compile() is safe and still warms the programs
    try { renderer.compile(scene, camera); } catch (e) { }
  },
};

/* ---------- feel (juice) ---------- */
const EASE = {
  lin: t => t, outQuad: t => 1 - (1 - t) * (1 - t), outCubic: t => 1 - Math.pow(1 - t, 3), inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
const his = (() => {
  const tweens = new Set();
  let stopT = 0, olcek = 1, travma = 0;
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches || (window.Arena && Arena.settings && Arena.settings.motion === false); } catch (e) { return false; } };
  const api = {
    EASE,
    tween(obj, hedef, sure = 0.3, ease = 'outCubic') {
      const bas = {}; for (const k in hedef) bas[k] = obj[k];
      const tw = { obj, bas, hedef, sure, t: 0, ease: EASE[ease] || ease, bitince: null };
      tweens.add(tw); return { then(f) { tw.bitince = f; return this; }, iptal() { tweens.delete(tw); } };
    },
    /** call once per frame with real dt; returns the dt the game should use (scaled by hitstop) */
    guncelle(dt) {
      for (const tw of tweens) {
        tw.t = Math.min(1, tw.t + dt / tw.sure); const e = tw.ease(tw.t);
        for (const k in tw.hedef) tw.obj[k] = tw.bas[k] + (tw.hedef[k] - tw.bas[k]) * e;
        if (tw.t >= 1) { tweens.delete(tw); if (tw.bitince) tw.bitince(); }
      }
      if (stopT > 0) { stopT -= dt; olcek = stopT > 0 ? 0.04 : 1; }
      travma = Math.max(0, travma - dt * 1.6);
      return dt * olcek;
    },
    /** Sumiro: hit 0.07 s, heavy 0.14 s, time scale 0.04 */
    hitstop(s = 0.07) { if (!reduce()) stopT = Math.max(stopT, s); },
    get zamanOlcegi() { return olcek; },
    /** trauma model: add 0.26 (hit), 0.42 (heavy), 0.55 (damage); read sarsinti.ofset each frame */
    sarsinti: {
      ekle(v = 0.26) { if (!reduce()) travma = Math.min(1, travma + v); },
      ofset(t = performance.now() / 1000, buyukluk = 0.35) {
        const s = travma * travma * buyukluk;
        return { x: s * Math.sin(t * 61.3) * Math.cos(t * 17.1), y: s * Math.sin(t * 47.7 + 1.3), rot: s * 0.1 * Math.sin(t * 29.9 + 2.1) };
      },
      get travma() { return travma; },
    },
    ucanYazi(metin, x, y, { renk = '#fff4c2', boyut = 22, sure = 0.9 } = {}) {
      const el = document.createElement('div');
      el.textContent = metin;
      el.style.cssText = `position:fixed;left:${x}px;top:${y}px;transform:translate(-50%,-50%);pointer-events:none;z-index:50;font:800 ${boyut}px system-ui,sans-serif;color:${renk};text-shadow:0 2px 6px rgba(0,0,0,.6);transition:transform ${sure}s cubic-bezier(.2,.8,.2,1),opacity ${sure}s ease`;
      document.body.appendChild(el);
      requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-160%) scale(1.15)'; el.style.opacity = '0'; });
      setTimeout(() => el.remove(), sure * 1000 + 100);
    },
  };
  return api;
})();

/* ---------- camera spring ---------- */
const kamera = {
  /** critically damped spring step. For numbers pass vel as {v:0}; for Vector3 pass a Vector3 velocity. omega ~ 6..14 */
  yay(cur, target, omega, dt, vel) {
    const x = omega * dt, exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    if (typeof cur === 'number') {
      const change = cur - target, temp = (vel.v + omega * change) * dt;
      vel.v = (vel.v - omega * temp) * exp; return target + (change + temp) * exp;
    }
    const change = cur.clone().sub(target), temp = vel.clone().addScaledVector(change, omega).multiplyScalar(dt);
    vel.sub(temp.clone().multiplyScalar(omega)).multiplyScalar(exp);
    return cur.copy(target).add(change.add(temp).multiplyScalar(exp));
  },
};

window.ArenaCore = { version: VERSION, kalite, render, kabuk, his, kamera, test };
/*ARENA-CORE:END*/