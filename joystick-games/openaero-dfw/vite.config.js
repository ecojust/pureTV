import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The start screen's Credits link (ticket 0045) opens credits.html, built from
// public/CREDITS.md: phones show a .md file (text/markdown) as tiny raw text or download it.
// Only what CREDITS.md uses: # headings, - bullets (continued on indented lines), **bold**,
// `code` and bare https links.
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (t) => esc(t)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code>$1</code>')
  .replace(/(https:\/\/[^\s),]+[^\s),.])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
export function creditsHtml(md) {
  const blocks = md.split(/\n(?=#|- |\n)/).map((b) => b.trim()).filter(Boolean);
  const body = blocks.map((b) => {
    const h = b.match(/^(#{1,3}) (.*)/);
    if (h) return `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
    const text = inline(b.replace(/^- /, '').replace(/\s*\n\s*/g, ' '));
    return b.startsWith('- ') ? `<li>${text}</li>` : `<p>${text}</p>`;
  }).join('\n').replace(/(<li>[\s\S]*?<\/li>)(?!\n<li>)/g, '$1</ul>').replace(/(?<!<\/li>\n)<li>/g, '<ul><li>');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>达拉斯飞行模拟 · 素材与授权</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:0 auto;padding:1rem max(1rem,env(safe-area-inset-left));background:#020617;color:#e2e8f0}
a{color:#7dd3fc;overflow-wrap:anywhere}code{font-size:.9em;color:#cbd5e1;overflow-wrap:anywhere}h1{font-size:1.4rem}h2{font-size:1.1rem;margin-top:1.6rem;color:#7dd3fc}li{margin:.4rem 0}</style></head>
<body>${body}</body></html>\n`;
}
const creditsPage = {
  name: 'credits-page',
  apply: 'build',
  generateBundle() {
    this.emitFile({type: 'asset', fileName: 'credits.html', source: creditsHtml(readFileSync('public/CREDITS.md', 'utf8'))});
  },
};

// Rapier (0043): its glue imports the .wasm as an ES module (`./rapier_wasm3d` → `import * as wasm from
// "./rapier_wasm3d_bg.wasm"`), which neither Vite nor Node loads. Its own import of that file resolves to
// src/world/rapierRaw.js (the same bindings, no .wasm import); physicsWorld.js initRapier instantiates the wasm.
const rapierRaw = fileURLToPath(new URL('./src/world/rapierRaw.js', import.meta.url));
const rapierWasm = {
  name: 'rapier-wasm',
  enforce: 'pre',
  resolveId(source, importer) {
    if (/^\.\/rapier_wasm3d(\.js)?$/.test(source) && importer?.includes('@dimforge/rapier3d')) return rapierRaw;
    return null;
  },
};

// Relative asset paths work in both the static game catalog and the native host.
export default defineConfig({
  base: './',
  plugins: [rapierWasm, creditsPage],
  // Boot budget (0084): three's prebuilt bundle is one module, so everything any lazy chunk
  // (glTF, 3D tiles) uses from it landed in the boot chunk. Its source is per-file and side-effect
  // free: the same single copy of three, but the bundler can leave the lazy chunks' classes in them.
  // (Don't group three's boot modules into one chunk: rolldown's runtime helpers stay in the entry
  // and the chunks import each other in a cycle; the page throws at boot.)
  // WebGLRenderer's WebXRManager is src/noXr.js, a stand-in with XR off (0174: ~4 kB gz of boot the sim never used);
  // its environments' PMREMGenerator is src/noPmrem.js (0022: the sim sets no env map, ~4 kB gz);
  // its WebGLShadowMap is src/noShadowMap.js (0191: the sim turns no shadow map on).
  resolve: { alias: [
    { find: /^three$/, replacement: fileURLToPath(new URL('./node_modules/three/src/Three.js', import.meta.url)) },
    { find: /^\.\/webxr\/WebXRManager\.js$/, replacement: fileURLToPath(new URL('./src/noXr.js', import.meta.url)) },
    { find: /^\.\.\/\.\.\/extras\/PMREMGenerator\.js$/, replacement: fileURLToPath(new URL('./src/noPmrem.js', import.meta.url)) },
    { find: /^\.\/webgl\/WebGLShadowMap\.js$/, replacement: fileURLToPath(new URL('./src/noShadowMap.js', import.meta.url)) },
  ] },
  build: {
    outDir: 'dist',
    rolldownOptions: {
      input: 'tv.html',
      output: {assetFileNames(asset) {
        return asset.names.some(name => name.endsWith('.mjs')) ? 'assets/[name]-[hash].js' : 'assets/[name]-[hash][extname]';
      }},
    },
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
});
