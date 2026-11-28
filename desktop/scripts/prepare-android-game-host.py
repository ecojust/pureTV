"""Extract the common compiled Game Kit host from its verified Neon Rush APK."""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("apk", type=Path)
args = parser.parse_args()
catalog = json.loads((root / 'tools/pc-games/catalog.json').read_bytes())
game = next(game for game in catalog if game['id'] == 'neon-rush')
with args.apk.open('rb') as stream:
    if hashlib.file_digest(stream, 'sha256').hexdigest() != game['sha256']:
        parser.error('Expected the verified Neon Rush APK from the game catalog')
path = root / 'desktop/web-game-templates/android-host.zip'
with ZipFile(args.apk) as source, ZipFile(path, 'w', ZIP_DEFLATED) as output:
    for name in ('AndroidManifest.xml', 'resources.arsc', 'classes.dex', 'res/raw/license.txt',
                 'res/drawable-nodpi-v4/banner.png', 'res/drawable-nodpi-v4/ic_game.png'):
        # The desktop packager fills both image slots using the game's thumbnail.
        data = b'' if name.endswith('.png') else source.read(name)
        data = data.replace('霓虹飞车'.encode(), '电视游戏'.encode()).replace(b'Neon Rush', b'pureTV TV')
        output.writestr(name, data)
