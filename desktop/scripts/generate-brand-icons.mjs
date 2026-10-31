// Convert the shared artwork to platform containers and web-sized PNGs.
// Run from desktop/: node scripts/generate-brand-icons.mjs
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {copyFile, mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const desktop = fileURLToPath(new URL('..', import.meta.url));
const source = fileURLToPath(new URL('../../docs/branding/puretv-dragon-source.png', import.meta.url));
const icons = join(desktop, 'src-tauri/icons');
const temporary = await mkdtemp(join(tmpdir(), 'puretv-brand-icons-'));

// ICNS chunk order can vary between converter runs. Preserve a container when
// all of its image chunks are unchanged, so regeneration is idempotent.
function icnsImages(data) {
  assert.equal(data.toString('ascii', 0, 4), 'icns');
  assert.equal(data.readUInt32BE(4), data.length);
  const chunks = [];
  for (let offset = 8; offset < data.length;) {
    const length = data.readUInt32BE(offset + 4);
    assert.ok(length >= 8 && offset + length <= data.length);
    chunks.push(data.subarray(offset, offset + length).toString('base64'));
    offset += length;
  }
  return chunks.sort().join('\n');
}

try {
  const result = spawnSync(process.execPath, [join(desktop, 'node_modules/@tauri-apps/cli/tauri.js'), 'icon', source, '--output', temporary], {cwd: desktop, stdio: 'inherit'});
  if (result.error) throw result.error;
  assert.equal(result.status, 0, 'Tauri icon conversion failed');
  const names = (await readdir(icons)).filter(name => /\.(png|ico|icns)$/.test(name));
  for (const name of names) {
    const generated = join(temporary, name), target = join(icons, name);
    if (name.endsWith('.icns') && icnsImages(await readFile(generated)) === icnsImages(await readFile(target))) continue;
    await copyFile(generated, target);
  }
  const web = join(temporary, '128x128@2x.png');
  await copyFile(web, join(desktop, 'public/puretv-logo.png'));
  await copyFile(web, fileURLToPath(new URL('../../docs/branding/puretv-logo.png', import.meta.url)));
  console.log(`Updated ${names.length} desktop icons and both 256px web/README logos.`);
} finally {
  await rm(temporary, {recursive: true, force: true});
}
