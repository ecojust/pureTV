"""Build the desktop player's small web overlays for its bundled, signed game APKs."""
import argparse
import json
from pathlib import Path
import shutil
from zipfile import ZipFile

from hosted_games import hosted_cover, hosted_games
from launcher import matching_file
from prepare_standalone import ROOT, source_revision, tracked_file
from stage_web_games import write_player_assets


def stage(apks, output):
    source = Path(__file__).resolve().parent
    catalog = json.loads((source / 'catalog.json').read_text(encoding='utf-8'))
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
        filename = game['url'].rsplit('/', 1)[1]
        apk = apks / slug / filename
        if not matching_file(apk, game):
            raise ValueError(f'{slug}: missing or incorrect signed APK in {apks}')
        target = output / slug
        target.mkdir()
        pinned = {**game, 'url': game['url'].replace('/refs/heads/master/', '/' + revision + '/')}
        with ZipFile(apk) as archive:
            write_player_assets(archive, pinned, 'joystick-games/' + slug, target)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apk-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    stage(args.apk_dir, args.output)
