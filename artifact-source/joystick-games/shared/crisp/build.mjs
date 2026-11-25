import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { patchEngine } from './patch-engine.mjs';
const shared = path.dirname(fileURLToPath(import.meta.url));
export function buildGame(directory, check = process.argv.includes('--check')) {
  const read = file => fs.readFileSync(file, 'utf8');
  const config = JSON.parse(read(path.join(directory, 'src/config.json')));
  const upstream = read(path.join(directory, 'src/game.js'));
  const expected = JSON.parse(read(path.join(directory, 'upstream.json')));
  if (crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, 'src/game.js'))).digest('hex') !== expected.sourceSha256) throw Error('Original source hash changed');
  const vendorLock = JSON.parse(read(path.join(shared, 'vendor-lock.json')));
  for (const item of vendorLock.files) if (crypto.createHash('sha256').update(fs.readFileSync(path.join(shared,item.path))).digest('hex') !== item.sha256) throw Error('Vendor integrity mismatch: '+item.path);
  const controller = read(path.join(shared, '../web/input.js')).replace("import './controller-clients.js';", '').replaceAll('export ', '');
  const stateNames = config.stateFields.join(',');
  let game = upstream;
  for (const item of config.audio) game = game.replace(new RegExp(item.key + ': "\\./[^\\"]+"'), `${item.key}: "./${item.name}"`);
  const scripts = [
    config.pixi ? read(path.join(shared,'vendor/pixi-5.3.0.js')) : '',
    read(path.join(shared,'vendor/sounds-some-sounds-3.1.1.js')),
    patchEngine(read(path.join(shared,'vendor/crisp-game-lib-1.4.0.js'))),
    game,
    read(path.join(shared, '../web/controller-clients.js')),
    `(() => {\n${controller}\nconst config = ${JSON.stringify(config)};\nconst readGameState = () => ({${stateNames}});\n${read(path.join(shared,'tv.js'))}\n})();`
  ];
  const script = scripts.join('\n;\n').replace(/<\/script/gi, '<\\/script');
  const html = read(path.join(shared,'tv.html')).replace('<!--STYLE-->',() => read(path.join(shared,'tv.css'))).replace('<!--SCRIPT-->',() => script);
  const notices = read(path.join(directory,'NOTICE.md')) + '\n\n' + fs.readdirSync(path.join(shared,'licenses')).sort().map(name => `--- ${name} ---\n${read(path.join(shared,'licenses',name))}`).join('\n\n');
  const outputs = {'tv.html':Buffer.from(html), 'THIRD-PARTY-NOTICES.txt':Buffer.from(notices)};
  for (const item of expected.assets) {
    const bytes = fs.readFileSync(path.join(directory,'src',item.name));
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw Error('Audio integrity mismatch: '+item.name);
    outputs[item.name] = bytes;
  }
  const dest = path.join(directory,'dist');
  if (!check) fs.mkdirSync(dest,{recursive:true});
  for (const [name, bytes] of Object.entries(outputs)) {
    const file = path.join(dest,name);
    if (check) { if (!fs.existsSync(file) || !fs.readFileSync(file).equals(bytes)) throw Error(name+' differs; run npm run build'); }
    else fs.writeFileSync(file,bytes);
  }
  if (check && fs.readdirSync(dest).sort().join() !== Object.keys(outputs).sort().join()) throw Error('Unexpected dist files');
  console.log(config.id + ': ' + (check ? 'build:check passed' : 'built offline distribution'));
}
