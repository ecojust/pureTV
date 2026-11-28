"""Stage the README games as static browser pages from their verified web assets."""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory
from zipfile import ZipFile

from host import ALIASES
from hosted_games import hosted_games, stage_hosted
from launcher import cache_directory, fetch_game
from package import REPOSITORY_RAW
from prepare_standalone import ROOT, tracked_file, write_notices

sys.path.insert(0, str(ROOT / 'tools'))
from game_icons import save_banner

# These pages need desktop-specific presentation newer than their signed TV assets.
WEB_BUNDLES = {
    'alien-shooter': 'src/main/assets/runtime.js',
    'nerd-of-duty': 'dist/nerd-of-duty.js',
    'used-car-racing': 'src/main/assets/game.js',
}


def write_player_cover(directory, target):
    save_banner(ROOT / directory, target / 'thumb.png', size=(480, 270))


def write_player_assets(archive, game, directory, target):
    """Write the PC entry and adapters alongside the unmodified signed game assets."""
    slug = game['id']
    write_notices(archive, game, directory, target / 'puretv-licenses')
    if slug in WEB_BUNDLES:
        bundle_path = f'{directory}/{WEB_BUNDLES[slug]}'
        data = tracked_file(bundle_path)
        (target / Path(bundle_path).name).write_bytes(data)
        source_file = target / 'puretv-licenses/source.json'
        source = json.loads(source_file.read_text(encoding='utf-8'))
        source['web_bundle'] = {'path': bundle_path, 'sha256': hashlib.sha256(data).hexdigest()}
        source_file.write_text(json.dumps(source, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    entry = target / 'tv.html'
    config = json.dumps({'alias': ALIASES.get(slug), 'gameKit': slug == 'neon-rush'})
    scripts = (f'<script>const pureTVPCConfig={config};</script>'
               '<script src="../web-host.js"></script><script src="../pc-bridge.js"></script>')
    layout = Path(__file__).with_name('web-layouts') / f'{slug}.css'
    if layout.is_file():
        shutil.copyfile(layout, target / 'web-layout.css')
        scripts += '<link rel="stylesheet" href="web-layout.css">'
    adapter = layout.with_suffix('.js')
    if adapter.is_file():
        shutil.copyfile(adapter, target / 'web-layout.js')
        scripts += '<script src="web-layout.js"></script>'
    html, matches = re.subn(r'<head(?:\s[^>]*)?>', lambda match: match.group() + scripts,
                            archive.read('assets/tv.html').decode('utf-8-sig'), count=1, flags=re.I)
    if not matches:
        raise ValueError(f'{slug} has no game page head')
    entry.write_text(html, encoding='utf-8')
    write_player_cover(directory, target)


def stage(game, output, cache, revision):
    slug = game['id']
    directory = f'joystick-games/{slug}'
    prefix = REPOSITORY_RAW + directory + '/'
    if not re.fullmatch(r'[a-z0-9-]+', slug) or not game['url'].startswith(prefix):
        raise ValueError(f'Invalid catalog entry for {slug}')
    pinned = game['url'].replace(REPOSITORY_RAW, f'https://github.com/ecojust/pureTV/raw/{revision}/', 1)
    pinned_game = {**game, 'url': pinned}
    apk = fetch_game(pinned_game, cache)
    with TemporaryDirectory(dir=output) as temporary:
        target = Path(temporary) / slug
        target.mkdir()
        with ZipFile(apk) as archive:
            for member in archive.infolist():
                if not member.filename.startswith('assets/') or member.is_dir():
                    continue
                path = PurePosixPath(member.filename.removeprefix('assets/'))
                if path.is_absolute() or '..' in path.parts or '\\' in member.filename:
                    raise ValueError(f'Invalid asset path in {slug}: {member.filename}')
                destination = target / path
                destination.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(member) as source, destination.open('xb') as file:
                    shutil.copyfileobj(source, file)
            write_player_assets(archive, pinned_game, directory, target)
        target.rename(output / slug)
    print(f'{slug} ready', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='Destination games directory')
    parser.add_argument('--apk-cache', type=Path, default=cache_directory())
    parser.add_argument('--game', help='Stage only this game for local testing')
    args = parser.parse_args()
    source = Path(__file__).resolve().parent
    games = json.loads((source / 'catalog.json').read_text(encoding='utf-8'))
    genres = json.loads((ROOT / 'tools/readme-app-games.json').read_text(encoding='utf-8'))
    featured = [Path(item.get('page') or item['resource']).name for genre in genres for item in genre['games']]
    if [game['id'] for game in games] != featured or len(featured) != len(set(featured)):
        raise ValueError('Desktop and README game catalogs differ')
    hosted = hosted_games()
    online_ids = {game['id'] for game in hosted}
    if online_ids.intersection(featured):
        raise ValueError('Duplicate game in the packaged and hosted catalogs')
    if {game['category'] for game in hosted} - {genre['id'] for genre in genres}:
        raise ValueError('Hosted game has an unknown Manager category')
    if args.game and args.game not in featured and args.game not in online_ids:
        parser.error('Unknown game ID')
    revision = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip()
    args.output.mkdir(parents=True, exist_ok=True)
    for asset in ('pc-bridge.js', 'web-host.js', 'web-host.css', 'hosted-player.js'):
        shutil.copyfile(source / asset, args.output / asset)
    for game in games:
        if not args.game or args.game == game['id']:
            stage(game, args.output, args.apk_cache, revision)
    for game in hosted:
        if not args.game or args.game == game['id']:
            stage_hosted(game, args.output, tracked_file)


if __name__ == '__main__':
    main()
