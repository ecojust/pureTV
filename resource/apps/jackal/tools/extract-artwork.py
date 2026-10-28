#!/usr/bin/env python3
"""Restore the exact, attributed artwork inputs from the catalogued preview APK.

This does not download assets or alter their licenses. The APK and each generated
asset must match the committed resource metadata and its packaged provenance.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import zipfile

APP = Path(__file__).resolve().parents[1]


def required_paths():
    paths = {'levels/sprites.json', 'fonts/hud.png', 'boss_patches.json', 'data/audio-score.json'}
    paths.update(json.loads((APP/'src/main/assets/scene-update-paths.json').read_text()))
    for stage in range(1, 7):
        paths.update([f'textures/stage_{stage:02d}_tiles.png', f'textures/stage_{stage:02d}_sprites.png'])
    scenes = ['title_1p', 'title_2p', 'intro_1p', 'intro_2p', 'attract', 'continue_yes', 'continue_no', 'game_over', 'ending', 'ending_restart']
    scenes += [f'stage_clear_{stage:02d}' for stage in range(1, 6)]
    scenes += [f'{kind}_{stage:02d}' for stage in range(1, 7) for kind in ('stage_load', 'continue_load')]
    for scene in scenes:
        paths.update([f'cinematics/{scene}/timeline.json', f'cinematics/{scene}/tiles.png'])
    return paths


def extract(output):
    metadata = json.loads((APP/'resource.json').read_text())
    name = metadata['apk']
    if Path(name).name != name or not name.endswith('.apk'):
        raise ValueError('Invalid catalog APK filename')
    apk = APP/name
    with apk.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if digest != metadata['sha256'] or apk.stat().st_size != metadata['apkBytes']:
        raise ValueError('Catalog APK checksum or size mismatch')
    output = output.absolute()
    if output.is_symlink() or (output.exists() and not (output/'.puretv-jackal-artwork').is_file()):
        raise ValueError('Output must be new or an artwork directory created by this tool')
    output.parent.mkdir(parents=True, exist_ok=True)
    required = required_paths()
    if any(not isinstance(name, str) or Path(name).is_absolute() or '..' in Path(name).parts
           or '\\' in name for name in required):
        raise ValueError('Unsafe artwork path in renderer requirements')
    with tempfile.TemporaryDirectory(prefix='jackal-artwork-', dir=output.parent) as temporary:
        staged = Path(temporary)/'art'
        staged.mkdir()
        with zipfile.ZipFile(apk) as archive:
            prefix = 'assets/art/'
            names = [item.filename for item in archive.infolist() if item.filename.startswith(prefix)]
            if len(names) != len(set(names)):
                raise ValueError('Duplicate artwork entries in APK')
            def read(relative):
                member = archive.getinfo(prefix+relative)
                if member.file_size > 16*1024*1024:
                    raise ValueError(f'Oversized artwork file: {relative}')
                return archive.read(member)
            provenance = json.loads(read('preview-asset-provenance.json'))
            records = {item['path']:item for item in provenance['files']}
            if len(records) != len(provenance['files']) or set(records) != required:
                raise ValueError('Artwork manifest does not match the renderer requirements')
            total = 0
            for relative in sorted(required):
                data = read(relative)
                record = records[relative]
                if len(data) != record['generatedBytes'] or hashlib.sha256(data).hexdigest() != record['generatedSha256']:
                    raise ValueError(f'Artwork checksum mismatch: {relative}')
                total += len(data)
                if total > 64*1024*1024:
                    raise ValueError('Artwork exceeds the extraction size limit')
                destination = staged/relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(data)
            for relative in ('provenance.json', 'scene-updates-provenance.json', 'preview-asset-provenance.json'):
                (staged/relative).write_bytes(read(relative))
        (staged/'.puretv-jackal-artwork').write_text(digest+'\n')
        if output.exists():
            shutil.rmtree(output)
        staged.rename(output)
    print(json.dumps({'directory':str(output), 'verifiedAssets':len(required), 'apkSha256':digest}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    extract(parser.parse_args().output)
