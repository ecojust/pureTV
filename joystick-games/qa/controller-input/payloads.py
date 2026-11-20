"""Create deterministic, unsigned assets-only ZIPs for the deployed portable PC host."""
import argparse
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


def encoded(value):
    return (json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n').encode()


def prepare(root, slug, output, level=1):
    game = root / 'joystick-games' / slug
    dist = game / 'dist'
    metadata = json.loads((game / 'game.json').read_text())
    if metadata['id'] != slug or not (dist / 'tv.html').is_file():
        raise ValueError(f'Expected {slug} metadata and built dist/tv.html')
    originals = {file.relative_to(dist).as_posix(): file for file in dist.rglob('*') if file.is_file()}
    for name in ('controller.js','controller.css','controller.html'):
        if name in originals: raise ValueError(f'Reserved phone asset in {slug}: {name}')
        originals[name] = root / 'resource/game-kit/web' / name
    generated = {'game-config.json': encoded({**metadata, 'phoneControllerButtons':9})}
    generated['assets-index.json'] = encoded(sorted([*originals, *generated]))
    if originals.keys() & generated.keys(): raise ValueError(f'Reserved metadata in {slug} distribution')
    with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=level) as packed:
        for name in sorted([*originals, *generated]):
            item = ZipInfo('assets/'+name,(2026,11,20,0,0,0))
            item.compress_type = ZIP_DEFLATED
            packed.writestr(item, generated[name] if name in generated else originals[name].read_bytes(), compresslevel=level)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[3])
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--compression-level', type=int, choices=[1, 6], default=1,
                   help='The first catalogue input runs used 6. The portable player uses 1.')
    p.add_argument('games',nargs='+');args=p.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    for slug in args.games:prepare(args.root,slug,args.output/(slug+'.zip'),args.compression_level)
