"""Stage desktop overlays from the verified upstream packages used to build local game projects."""
import argparse
import json
from pathlib import Path
import shutil
from zipfile import ZipFile
from pathlib import PurePosixPath

from hosted_games import hosted_cover, hosted_games
from launcher import matching_file
from prepare_standalone import ROOT, source_revision, tracked_file
from stage_web_games import write_player_assets, write_player_cover


def stage(apks, output):
    source = Path(__file__).resolve().parent
    catalog = json.loads((source / 'catalog.json').read_text(encoding='utf-8'))
    online_only = set(json.loads((source / 'online-only.json').read_text(encoding='utf-8')))
    revision = source_revision()
    output.mkdir(parents=True, exist_ok=True)
    for name in ('pc-bridge.js', 'web-host.js', 'web-host.css'):
        shutil.copyfile(source / name, output / name)

    # Browsing the online section also works without contacting the authors' sites.
    for game in hosted_games():
        target = output / game['id']
        target.mkdir()
        (target / 'thumb.webp').write_bytes(hosted_cover(game, tracked_file))

    for game in catalog:
        slug = game['id']
        target = output / slug
        target.mkdir()
        directory = 'joystick-games/' + slug
        if slug in online_only:
            write_player_cover(directory, target)
            continue
        filename = game['url'].rsplit('/', 1)[1]
        apk = apks / slug / filename
        if not matching_file(apk, game):
            raise ValueError(f'{slug}: missing or incorrect signed APK in {apks}')
        pinned = {**game, 'url': game['url'].replace('/refs/heads/master/', '/' + revision + '/')}
        with ZipFile(apk) as archive:
            for member in archive.infolist():
                if member.is_dir() or not member.filename.startswith('assets/'):
                    continue
                name = member.filename.removeprefix('assets/')
                path = PurePosixPath(name)
                if path.is_absolute() or '..' in path.parts or '\\' in name:
                    raise ValueError(f'Invalid asset path: {name}')
                if name == 'assets-index.json':
                    continue
                destination = target / ('android-entry.html' if name == 'tv.html' else name)
                destination.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(member) as source, destination.open('xb') as output_file:
                    shutil.copyfileobj(source, output_file)
            write_player_assets(archive, pinned, directory, target)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apk-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    stage(args.apk_dir, args.output)
