import { localizeHtml } from '../shared/web/localize-html.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { pack } from 'gltfpack';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => fs.readFile(path.join(root, name));
async function names(directory) {
  const entries = await fs.readdir(path.join(root, directory), {withFileTypes:true});
  const groups = await Promise.all(entries.map(async entry => entry.isDirectory()
    ? (await names(path.join(directory, entry.name))).map(n => path.posix.join(entry.name, n))
    : [entry.name]));
  return groups.flat().sort();
}
const bundle = await build({
  absWorkingDir:root,entryPoints:['src/boot.js'],bundle:true,format:'iife',target:'es2020',
  minify:true,legalComments:'none',charset:'utf8',write:false,
  alias:{'three/addons':'./src/vendor/addons',three:'./src/vendor/three.module.js'},
});
const files = new Map([['game.js',Buffer.from(bundle.outputFiles[0].contents)]]);
for (const [dest,source] of Object.entries({
  'tv.html':'src/index.html','style.css':'src/style.css','tv.css':'src/tv.css',
  'character-inspector.css':'src/character-inspector.css','makehuman-sources.json':'src/vendor/makehuman/SOURCES.json',
})) files.set(dest, await read(source));
files.set('tv.html', Buffer.from(await localizeHtml(files.get('tv.html').toString(), root)));
const portraitSources=JSON.parse(await read('src/tv-portraits/sources.json'));
const hash=value=>createHash('sha256').update(value).digest('hex');
for (const name of await names('src/assets')) {
  if (name === 'characters/manifest.json') continue; // Export metadata, not a game asset.
  if(name.endsWith('.glb')) {
    // Retain the artist's LOD hierarchy, named materials and Blink morph;
    // share the four original full-resolution images between all twelve heads.
    let model;
    await pack(['-i','assets/'+name,'-o','packed.glb','-cc','-ce','ext','-tr','-kn','-km','-ke'], {
      // gltfpack sees portable logical paths, including its sibling texture reads.
      read: asset => readFileSync(path.join(root,'src',asset)),
      write(output, bytes) {
        if(output !== 'packed.glb') throw Error('Unexpected model output '+output);
        model=Buffer.from(bytes);
      },
    });
    files.set('assets/'+name,model);
  } else if(name.startsWith('portraits/')) {
    // Normalize TV-sized WebPs once. Windows, macOS and Android builds then
    // use identical bytes even if libvips was compiled with different SIMD.
    const key=name.slice('portraits/'.length);
    const webp=key.replace(/\.png$/,'.webp');
    const bytes=await read('src/tv-portraits/'+webp);
    const record=portraitSources[key];
    if(record?.originalSha256!==hash(await read('src/assets/'+name))||record.webpSha256!==hash(bytes)) {
      throw Error('Regenerate TV portraits with npm run assets:portraits: '+key);
    }
    files.set('assets/portraits/'+webp,bytes);
  } else {
    files.set('assets/'+name,await read('src/assets/'+name));
  }
}
const notices = await Promise.all(['NOTICE.md','LICENSE','src/vendor/THREE-LICENSE.txt',
  'src/vendor/makehuman/LICENSE.ASSETS.md','node_modules/meshoptimizer/LICENSE.md','src/puretv-license.txt'].map(read));
files.set('THIRD-PARTY-NOTICES.txt',Buffer.from(notices.join('\n\n')));
if(process.argv.includes('--check')) {
  if(JSON.stringify(await names('dist')) !== JSON.stringify([...files.keys()].sort())) throw Error('Distribution inventory mismatch');
  for(const [name, bytes] of files) if(!bytes.equals(await read('dist/'+name))) throw Error('Rebuild '+name);
} else {
  // Remove obsolete generated variants so no unused image enters the package.
  for(const existing of await names('dist').catch(error => { if(error.code==='ENOENT')return []; throw error; })) {
    if(!files.has(existing))await fs.unlink(path.join(root,'dist',existing));
  }
  for(const [name, bytes] of files) {
    const target=path.join(root,'dist',name);
    await fs.mkdir(path.dirname(target),{recursive:true});
    await fs.writeFile(target,bytes);
  }
}
