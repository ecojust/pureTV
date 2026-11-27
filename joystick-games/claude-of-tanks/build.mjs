import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const revision = '8f3dd548c1e78242f73d37c6b37797c7f9cdcb22';
const repo = 'https://github.com/Kevin-Liu-01/Claude-of-Tanks.git';
const patterns = ['/src/', '/public/audio/', '/public/fx/', '/public/maps/', '/public/textures/',
  '/public/icons/*_side_silhouette.png', '/public/icons/*_top_silhouette.png',
  '/public/media/featured/f1_09_winter_lake_duel.webp', '/LICENSE', '/NOTICE.md', '/docs/ATTRIBUTION.md'];
const temp = mkdtempSync(join(tmpdir(), 'puretv-tanks-'));
const dist = join(temp, 'dist');
const read = path => readFileSync(path, 'utf8');
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], {encoding: 'utf8'});
function span(source, first, after, replacement) {
  const start = source.indexOf(first), end = source.indexOf(after, start + first.length);
  if (start < 0 || end < 0) throw Error('Pinned source marker missing: ' + first);
  return source.slice(0, start) + replacement + source.slice(end);
}
function list(path) {
  return readdirSync(path, {withFileTypes: true}).flatMap(e => e.isDirectory() ? list(join(path, e.name)) : [join(path, e.name)]).sort();
}
try {
  let upstream = process.env.COT_UPSTREAM;
  if (upstream) {
    upstream = resolve(upstream);
    if (git(upstream, 'rev-parse', 'HEAD').trim() !== revision) throw Error('Incorrect upstream commit');
    if (git(upstream, 'diff', '--name-only', 'HEAD', '--', 'src', 'public', 'LICENSE', 'NOTICE.md').trim()) throw Error('Original upstream checkout must be clean');
  } else {
    upstream = join(temp, 'upstream');
    mkdirSync(upstream);
    git(upstream, 'init', '--quiet');
    git(upstream, 'remote', 'add', 'origin', repo);
    git(upstream, 'config', 'remote.origin.promisor', 'true');
    git(upstream, 'config', 'remote.origin.partialclonefilter', 'blob:none');
    git(upstream, 'fetch', '-q', '--depth=1', '--filter=blob:none', 'origin', revision);
    git(upstream, 'sparse-checkout', 'set', '--no-cone', ...patterns);
    git(upstream, 'checkout', '--quiet', '--detach', revision);
  }
  const work = join(temp, 'work');
  mkdirSync(work);
  cpSync(join(upstream, 'src'), join(work, 'src'), {recursive: true});
  git(work, 'apply', '--unsafe-paths', join(root, 'input.patch'));
  cpSync(join(root, 'puretv-input.js'), join(work, 'src/puretv-input.js'));
  for (const [from, to] of Object.entries({
    'garage.js': 'ui/garage.js', 'boot.js': 'ui/bootScreen.js', 'featured.js': 'ui/featuredShots.js',
    'fonts.js': 'ui/fonts.js', 'status.js': 'game/killcam.js',
  })) cpSync(join(root, 'src', from), join(work, 'src', to));
  for (const file of ['shotInfo.js', 'damagePanel.js']) cpSync(join(root, 'src/status.js'), join(work, 'src/ui', file));

  // The desktop/TV edition exposes only the offline game. Remove editor, remote rooms,
  // developer capture, detailed hit analysis and debugging before bundling.
  const entry = join(work, 'src/main.js');
  let main = read(entry);
  main = span(main, 'const STUDIO_BOOT_INTENT =', 'const DEG =', 'const STUDIO_BOOT_INTENT = false;\n');
  main = span(main, 'const pendingRoomInvitePromise =', 'function loadLastSpec', 'const pendingRoomInvitePromise = null;\n');
  main = span(main, 'function loadPlayMenuModule()', 'const garage = await', '');
  main = span(main, '  onPlayRequest: (request)', '  // MAP-CONFIG', '');
  main = span(main, 'const VIEW_TIME =', 'damagePanel.setTank(getSpec(selectedSpecId), pedestalVisual);', '');
  main = span(main, 'let studioRuntimePromise =', 'bootComplete = true;', '');
  main = span(main, 'let debugAimTargetId =', "await bootStage('ready'", 'let debugAimTargetId = null;\n');
  main = span(main, '  aim.penRatio = null;\n  const shellSpec =', 'let lastPenRatio =', '  aim.penRatio = null;\n}\n');
  main = main.replace('const entryReady = boot.ready();', 'boot.ready();');
  main = span(main, 'if (pendingRoomInvitePromise)', 'window.__GAME_READY =', '');
  writeFileSync(entry, main);
  const transition = join(work, 'src/ui/transition.js');
  writeFileSync(transition, read(transition).replace('<img class="mark" src="/brand/logo-mark.svg" alt="" draggable="false">', ''));
  const icons = join(work, 'src/ui/uiIcons.js');
  writeFileSync(icons, read(icons).split('\n').filter(line => !line.includes('<image href="/brand/')).join('\n'));
  const settings = join(work, 'src/ui/settings.js');
  writeFileSync(settings, read(settings).replace('b.textContent = tier;', 'b.dataset.difficulty = tier; b.textContent = tier;').replaceAll('x.textContent === ', 'x.dataset.difficulty === ').replace(
    /'Easy bots aim slower,[^\n]+\n\s*'Takes effect when the next battle starts\.'/,
    "'难度更改将在下一场对战时生效。'"));
  const loading = join(work, 'src/ui/battleLoad.js');
  writeFileSync(loading, span(read(loading), 'const BATTLE_TIPS = [', '\n];',
    "const BATTLE_TIPS = [['暂停','按 Esc 打开暂停菜单。'], ['车库','回到车库可更换车辆和地图。']"));
  const paint = join(work, 'src/vehicles/materials.js');
  writeFileSync(paint, read(paint).replace(/export const CLAUDE_(?:CODE|SPARK)_MARK\s*=[\s\S]*?;/g, ''));
  // Both former optional branded patterns fall back to the standard factory paint.
  writeFileSync(paint, span(read(paint), "  } else if (scheme === 'claude' && patches.length)", "  } else if (scheme ===", '').replace(/  } else if \(scheme === 'spark' && patches.length\)[\s\S]*?(?=  } else if \(scheme ===)/, ''));
  const renderer = await build({
    entryPoints: [entry], bundle: true, minify: true, write: false, format: 'esm',
    target: 'es2020', supported: {'top-level-await': true}, legalComments: 'eof',
    define: {'import.meta': '{"env":{"BASE_URL":"./","MODE":"production","DEV":false,"PROD":true}}', 'import.meta.env.BASE_URL': '"./"', 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true'},
    logOverride: {'commonjs-variable-in-esm':'silent'},
    nodePaths: [join(root, 'node_modules')], alias: {'puretv-input-bridge': join(root, '../shared/web/input.js')},
    loader: {'.svg': 'dataurl'},
    plugins: [{name:'local-assets', setup(b) {
      b.onLoad({filter: /\.js$/}, args => {
        if (!args.path.startsWith(work)) return;
        let text = read(args.path);
        text = text.replace(/(['"`])\/(textures|fx|maps|icons)\//g,'$1./$2/');
        return {contents: text, resolveDir: dirname(args.path)};
      });
    }}],
  });
  mkdirSync(dist);
  // All top-level awaits run inside this function so even Android file/asset hosts
  // which reject ES-module loads can start the same classic-script bundle.
  const gameCode = renderer.outputFiles[0].text;
  writeFileSync(join(dist, 'claude-of-tanks.js'), '(async()=>{\n'+gameCode+'\n})().catch(e=>{console.error(e);const s=document.querySelector("#cot-boot p");if(s)s.textContent="无法启动游戏："+e.message;});\n');
  for (const file of ['tv.html', 'garage.css']) cpSync(join(root,'src',file),join(dist,file));
  cpSync(join(root,'zh.js'),join(dist,'zh.js'));
  for (const dir of ['textures','fx','audio']) cpSync(join(upstream,'public',dir),join(dist,dir),{recursive:true});
  mkdirSync(join(dist,'icons'));
  for (const f of readdirSync(join(upstream,'public/icons')).filter(f=>/_(side|top)_silhouette\.png$/.test(f))) cpSync(join(upstream,'public/icons',f),join(dist,'icons',f));
  cpSync(join(upstream,'public/media/featured/f1_09_winter_lake_duel.webp'),join(dist,'field.webp'));
  cpSync(join(root,'THIRD-PARTY-NOTICES.txt'),join(dist,'THIRD-PARTY-NOTICES.txt'));
  for (const a of ['maps']) cpSync(join(upstream,'public',a),join(dist,a),{recursive:true});
  const output = join(root,'dist');
  if (process.argv.includes('--check')) {
    const expected = list(dist).map(f=>relative(dist,f)), actual=list(output).map(f=>relative(output,f));
    if (JSON.stringify(expected)!==JSON.stringify(actual)) throw Error('Staged files differ');
    for (const f of expected) if(!readFileSync(join(dist,f)).equals(readFileSync(join(output,f)))) throw Error('Stale dist/'+f);
  } else {
    mkdirSync(output,{recursive:true}); cpSync(dist,output,{recursive:true});
  }
} finally { rmSync(temp,{recursive:true,force:true}); }
