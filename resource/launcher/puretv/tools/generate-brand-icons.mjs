// Convert the shared brand artwork into the launcher's existing Android icons.
// Requires desktop/node_modules from `npm ci`; run this file from any directory.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {copyFile, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const desktop = join(root, 'desktop');
const source = join(root, 'docs/branding/puretv-dragon-source.png');
const resources = fileURLToPath(new URL('../app/src/main/res/', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'puretv-android-brand-icons-'));
const densities = [['mdpi', 48, 108], ['hdpi', 72, 162], ['xhdpi', 96, 216], ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432]];

function convert(input, output, extra = []) {
  const result = spawnSync(process.execPath, [join(desktop, 'node_modules/@tauri-apps/cli/tauri.js'), 'icon', input, '--output', output, ...extra], {cwd: desktop, stdio: 'inherit'});
  if (result.error) throw result.error;
  assert.equal(result.status, 0, 'Tauri icon conversion failed');
}

async function verifyPng(path, size) {
  const bytes = await readFile(path);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', path);
  assert.equal(bytes.readUInt32BE(16), size, `${path}: width`);
  assert.equal(bytes.readUInt32BE(20), size, `${path}: height`);
}

try {
  const manifest = join(temporary, 'icons.json');
  await writeFile(manifest, JSON.stringify({default: source, bg_color: '#10251e'}));
  const icons = join(temporary, 'icons');
  convert(manifest, icons);

  // Android masks only the middle of its 108dp foreground canvas. Keep the
  // complete dragon inside a centered 60dp image so its horns and claws remain
  // visible under circular masks. The original PNG is embedded unchanged;
  // Tauri performs all raster resizing and format conversion.
  const foregroundSource = join(temporary, 'foreground.svg');
  const png = (await readFile(source)).toString('base64');
  await writeFile(foregroundSource, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="108" height="108" viewBox="0 0 108 108"><image x="24" y="24" width="60" height="60" xlink:href="data:image/png;base64,${png}"/></svg>\n`);
  const foreground = join(temporary, 'foreground');
  convert(foregroundSource, foreground, densities.flatMap(([, , size]) => ['--png', String(size)]));

  const files = [];
  for (const [density, iconSize, foregroundSize] of densities) {
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
      const isForeground = name === 'ic_launcher_foreground.png';
      const generated = isForeground ? join(foreground, `${foregroundSize}x${foregroundSize}.png`) : join(icons, 'android', `mipmap-${density}`, name);
      const target = join(resources, `mipmap-${density}`, name);
      const size = isForeground ? foregroundSize : iconSize;
      await verifyPng(generated, size);
      await verifyPng(target, size);
      files.push([generated, target]);
    }
  }
  for (const [generated, target] of files) await copyFile(generated, target);
  console.log(`Updated ${files.length} pureTV Launcher icons; existing dimensions and adaptive background are preserved.`);
} finally {
  await rm(temporary, {recursive: true, force: true});
}
