"""Stage a new static game-library directory from verified signed APKs and player assets."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / 'tools/pc-games'
from launcher import cache_directory, fetch_game


def revision():
    if (ROOT / '.git').exists():
        result = subprocess.run(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], capture_output=True, text=True)
        if result.returncode == 0 and re.fullmatch(r'[0-9a-f]{40}', result.stdout.strip()):
            return result.stdout.strip()
    return 'refs/heads/master'


def build(output, cache):
    catalog = json.loads((TOOLS / 'catalog.json').read_text(encoding='utf-8'))
    rev = revision()
    if output.exists():
        raise FileExistsError(f'Choose a new staging directory: {output}')
    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=output.parent) as temporary:
        stage = Path(temporary)
        sources = stage / 'apks'
        pending = stage / 'library'
        for game in catalog:
            ident = game['id']
            name = game['url'].rsplit('/', 1)[-1]
            if not re.fullmatch(r'[a-z0-9-]+', ident) or not re.fullmatch(r'[a-zA-Z0-9_.-]+\.apk', name):
                raise ValueError(f'Invalid game file: {ident}/{name}')
            url = f'https://github.com/ecojust/pureTV/raw/{rev}/joystick-games/{ident}/{name}'
            apk = fetch_game({**game, 'url': url}, cache)
            staged = sources / ident / name
            staged.parent.mkdir(parents=True)
            try:
                os.link(apk, staged)
            except OSError:
                shutil.copyfile(apk, staged)
        subprocess.run([sys.executable, str(TOOLS / 'offline_web_assets.py'),
                        '--apk-dir', str(sources), '--output', str(pending / 'web')], check=True)
        subprocess.run([sys.executable, str(TOOLS / 'update-library-catalog.py'),
                        '--library', str(pending)], check=True)
        pending.rename(output)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='New directory for the static site')
    parser.add_argument('--cache', type=Path, default=os.environ.get('PURETV_GAME_APK_CACHE') or cache_directory())
    args = parser.parse_args()
    build(args.output.resolve(), args.cache)
