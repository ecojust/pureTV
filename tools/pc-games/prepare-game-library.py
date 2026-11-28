"""Stage a new static game-library directory from verified signed APKs and player assets."""
import argparse
import json
import mmap
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
from tempfile import TemporaryDirectory
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / 'tools/pc-games'
from launcher import cache_directory, fetch_game


def revision():
    if (ROOT / '.git').exists():
        result = subprocess.run(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], capture_output=True, text=True)
        if result.returncode == 0 and re.fullmatch(r'[0-9a-f]{40}', result.stdout.strip()):
            return result.stdout.strip()
    return 'refs/heads/master'


def project(output, ident, source):
    # The original compressed Android resources, alignment and central records remain
    # byte-for-byte intact. Both JAR (v1) records and the APK signing block are removed.
    with source.open('rb') as file, ZipFile(file) as apk, mmap.mmap(file.fileno(), 0, access=mmap.ACCESS_READ) as data:
        central = apk.start_dir
        end = len(data) - len(apk.comment) - 22
        eocd = bytearray(data[end:])
        disk, central_disk, count, total, size, offset = struct.unpack_from('<HHHHII', eocd, 4)
        if (eocd[:4] != b'PK\x05\x06' or disk or central_disk or count != total or
                count != len(apk.infolist()) or offset != central or central + size != end):
            raise ValueError(f'{ident}: expected a single-volume Android ZIP32 archive')
        if data[central - 16:central] != b'APK Sig Block 42':
            raise ValueError(f'{ident}: missing APK signing block')
        block_size, = struct.unpack_from('<Q', data, central - 24)
        block = central - block_size - 8
        if block < 0 or block_size < 24 or struct.unpack_from('<Q', data, block)[0] != block_size:
            raise ValueError(f'{ident}: invalid APK signing block')

        signature = re.compile(r'META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))', re.IGNORECASE)
        entries = apk.infolist()
        signed = [e for e in entries if signature.fullmatch(e.filename)]
        ordinary = [e for e in entries if not signature.fullmatch(e.filename)]
        # All catalog APKs put their JAR signatures last in both ZIP directories.
        # Reject a changed upstream layout instead of dropping interspersed game files.
        if (not ordinary or entries != ordinary + signed or
                signed and max(e.header_offset for e in ordinary) >= min(e.header_offset for e in signed)):
            raise ValueError(f'{ident}: unsupported JAR signature layout')
        prefix = min((e.header_offset for e in signed), default=block)
        if prefix > block:
            raise ValueError(f'{ident}: invalid local Android entries')
        directory_end = central
        for _ in ordinary:
            if data[directory_end:directory_end + 4] != b'PK\x01\x02':
                raise ValueError(f'{ident}: invalid central directory entry')
            directory_end += 46 + sum(struct.unpack_from('<HHH', data, directory_end + 28))
        directory_size = directory_end - central
        struct.pack_into('<HHII', eocd, 8, len(ordinary), len(ordinary), directory_size, prefix)
        directory = output / 'projects' / ident
        directory.mkdir(parents=True)
        with memoryview(data) as view, (directory / 'project.zip').open('wb') as out:
            out.write(view[:prefix])
            out.write(view[central:directory_end])
            out.write(eocd)
        # Versioned recipe: project prefix/directory sizes, then the two missing
        # signed ranges. No private key or whole APK is needed for the recipe.
        with memoryview(data) as view, (directory / 'signing.bin').open('wb') as out:
            out.write(struct.pack('<8sQQQ', b'PTVSIG01', prefix, directory_size, central - prefix))
            out.write(view[prefix:central])
            out.write(view[directory_end:])


def build(output, cache):
    catalog = json.loads((TOOLS / 'catalog.json').read_text(encoding='utf-8'))
    online_only = set(json.loads((TOOLS / 'online-only.json').read_text(encoding='utf-8')))
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
            if ident in online_only:
                continue
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
            project(pending, ident, staged)
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
