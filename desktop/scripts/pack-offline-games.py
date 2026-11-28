"""Build the desktop offline library and the self-contained Windows portable executable."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory
from zipfile import ZipFile, ZipInfo, ZIP_STORED, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / 'tools/pc-games'
sys.path.insert(0, str(TOOLS))
from launcher import cache_directory, fetch_game


def revision():
    if (ROOT / '.git').exists():
        result = subprocess.run(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], capture_output=True, text=True)
        if result.returncode == 0 and re.fullmatch(r'[0-9a-f]{40}', result.stdout.strip()):
            return result.stdout.strip()
    return 'refs/heads/master'


def put(archive, path, name, compression):
    info = ZipInfo(name)
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    info.compress_type = compression
    with path.open('rb') as source, archive.open(info, 'w') as output:
        shutil.copyfileobj(source, output, length=1024 * 1024)


def build(output, cache):
    catalog = json.loads((TOOLS / 'catalog.json').read_text(encoding='utf-8'))
    rev = revision()
    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=output.parent) as temporary:
        stage = Path(temporary)
        sources = stage / 'apks'
        web = stage / 'web'
        pending = stage / output.name
        with ZipFile(pending, 'w') as archive:
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
                # A stored APK permits the PC player to seek directly into its original asset ZIP.
                put(archive, staged, f'apks/{ident}/{name}', ZIP_STORED)
            subprocess.run([sys.executable, str(TOOLS / 'offline_web_assets.py'),
                            '--apk-dir', str(sources), '--output', str(web)], check=True)
            for path in sorted(p for p in web.rglob('*') if p.is_file()):
                put(archive, path, 'web/' + path.relative_to(web).as_posix(), ZIP_DEFLATED)
        with pending.open('rb') as file:
            digest = hashlib.file_digest(file, 'sha256').hexdigest()
        if output.is_file():
            with output.open('rb') as current:
                unchanged = hashlib.file_digest(current, 'sha256').hexdigest() == digest
        else:
            unchanged = False
        if not unchanged:
            pending.replace(output)
        receipt = output.with_suffix('.sha256')
        if not receipt.is_file() or receipt.read_text(encoding='ascii').strip() != digest:
            temporary_receipt = stage / 'digest'
            temporary_receipt.write_text(digest + '\n', encoding='ascii')
            temporary_receipt.replace(receipt)
    print(f'{output.name}: {output.stat().st_size:,} bytes, SHA-256 {digest}', flush=True)


def portable(executable, library, output):
    # A PE image may carry an overlay. ZIP readers locate the appended archive via
    # its central directory; the installed exe and the single-file edition share code.
    with executable.open('rb') as exe, library.open('rb') as archive, output.open('xb') as target:
        shutil.copyfileobj(exe, target)
        shutil.copyfileobj(archive, target)
    with ZipFile(library) as original, ZipFile(output) as combined:
        if original.namelist() != combined.namelist() or combined.testzip() is not None:
            raise ValueError('Portable game library does not match the source archive')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--cache', type=Path, default=os.environ.get('PURETV_GAME_APK_CACHE') or cache_directory())
    parser.add_argument('--portable', type=Path, help='Append --library to this Windows executable')
    parser.add_argument('--library', type=Path)
    parser.add_argument('--verify', action='store_true', help='Check a prebuilt library against its SHA-256 receipt')
    args = parser.parse_args()
    if args.verify:
        expected = args.output.with_suffix('.sha256').read_text(encoding='ascii').strip()
        with args.output.open('rb') as file:
            if hashlib.file_digest(file, 'sha256').hexdigest() != expected:
                raise ValueError('Game library differs from its build receipt')
    elif args.portable:
        if not args.library:
            parser.error('--portable needs --library')
        portable(args.portable, args.library, args.output)
    else:
        build(args.output.resolve(), args.cache)
