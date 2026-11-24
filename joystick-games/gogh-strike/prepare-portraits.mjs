import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root=path.dirname(fileURLToPath(import.meta.url));
const originals=path.join(root,'src/assets/portraits');
const destination=path.join(root,'src/tv-portraits');
const records={};
const hash=value=>createHash('sha256').update(value).digest('hex');
for(const folder of ['', 'faces']) {
  const input=path.join(originals,folder);
  await fs.mkdir(path.join(destination,folder),{recursive:true});
  for(const file of (await fs.readdir(input)).filter(f=>f.endsWith('.png')).sort()) {
    const source=await fs.readFile(path.join(input,file));
    const size=folder==='faces' ? 160 : 420;
    const portrait=await sharp(source).resize({width:size,height:size,fit:'inside',withoutEnlargement:true})
      .webp({quality:88,alphaQuality:100}).toBuffer();
    const name=path.posix.join(folder,file);
    records[name]={originalSha256:hash(source),webpSha256:hash(portrait)};
    await fs.writeFile(path.join(destination,name.replace(/\.png$/,'.webp')),portrait);
  }
}
await fs.writeFile(path.join(destination,'sources.json'),JSON.stringify(records,null,2)+'\n');
