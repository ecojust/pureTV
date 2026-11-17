#!/usr/bin/env python3
"""Build one small, independent TV APK with the shared, unsigned Android host.

No signing key is read here. The output directory must be outside the game tree.
The Android command line SDK, JDK 17 and pinned ZXing jar are the only tools used.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

KIT = Path(__file__).resolve().parent
REPO = KIT.parents[1]
MAX_APK_BYTES = 10_000_000
ZXING_SHA256 = '8d8064c1636fdaef7189dd9055c7d59950a8940a12f2293956446ec3c109fd82'
ANDROID = '{http://schemas.android.com/apk/res/android}'
SAFE_ASSET = re.compile(r'[A-Za-z0-9][A-Za-z0-9_.-]*')
ASSET_EXTENSIONS = {'.html', '.css', '.js', '.json', '.png', '.webp', '.jpg', '.jpeg', '.svg', '.ogg', '.wav', '.mp3', '.txt'}


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def require(test, message):
    if not test:
        raise ValueError(message)


def checked_directory(path, label):
    """Reject symlinks before resolving paths or passing files to native tools."""
    path = Path(path)
    require('..' not in path.parts, label + ' must not contain parent traversal')
    if not path.is_absolute():
        path = Path.cwd() / path
    for part in (path, *path.parents):
        require(not part.is_symlink(), label + ' must not traverse symlinks: ' + str(part))
    require(path.is_dir(), 'Missing ' + label)
    return path.resolve(strict=True)


def validate_native_source(kit):
    native = checked_directory(kit / 'android/src/main', 'native source directory')
    for path in native.rglob('*'):
        require(not path.is_symlink(), 'Native source must not contain symlinks: ' + str(path))
        require(path.is_file() or path.is_dir(), 'Native source must contain only regular files/directories')


def game_icon(game):
    """Optional self-contained Android vector data; no resource/URI dependencies."""
    icon = game / 'icon.xml'
    if not icon.exists() and not icon.is_symlink():
        return None
    require(icon.is_file() and not icon.is_symlink(), 'icon.xml must be a regular non-symlink file')
    require(0 < icon.stat().st_size <= 32_768, 'icon.xml must be at most 32 KiB')
    data = icon.read_bytes()
    text = data.decode('utf-8')
    require(not re.search(r'<!\s*(?:DOCTYPE|ENTITY)\b', text, re.I), 'icon.xml must not declare a DOCTYPE or ENTITY')
    require(not re.search(r'<\?(?!xml\s)', text, re.I), 'icon.xml must not contain processing instructions')
    vector = ET.fromstring(data)
    require(vector.tag == 'vector', 'icon.xml root must be vector')
    for element in vector.iter():
        require(element.tag in ('vector', 'group', 'path', 'clip-path'), 'icon.xml must contain only self-contained vector elements')
        for key, value in element.attrib.items():
            require(key.startswith(ANDROID), 'icon.xml attributes must use the Android namespace')
            require(not re.search(r'@|\?|(?:[A-Za-z][A-Za-z0-9+.-]*:)|//', value), 'icon.xml must not contain external or resource references')
    return data


def metadata(game):
    game = checked_directory(game, 'game directory')
    path = game / 'game.json'
    require(path.is_file() and not path.is_symlink(), 'Missing regular game.json')
    data = json.loads(path.read_text())
    require(isinstance(data, dict), 'game.json must contain an object')
    require(re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', data.get('id', '')), 'Invalid game id')
    require(re.fullmatch(r'com\.ecojust\.[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*', data.get('packageName', '')), 'Invalid packageName')
    require(re.fullmatch(r'\d+\.\d+\.\d+', data.get('version', '')), 'Invalid version')
    require(type(data.get('versionCode')) is int and 1 <= data['versionCode'] <= 2_100_000_000, 'Invalid versionCode')
    for key in ('name', 'nameEn'):
        require(isinstance(data.get(key), str) and 0 < len(data[key]) <= 80 and not any(ord(c) < 32 for c in data[key]), 'Invalid ' + key)
    return data


def asset_inputs(game):
    """Return the exact payload, with explicit per-game overrides forbidden."""
    files = {}
    for folder in (KIT / 'web', game / 'src/main/assets'):
        if not folder.exists() and not folder.is_symlink():
            continue
        folder = checked_directory(folder, 'asset directory')
        for source in sorted(folder.iterdir()):
            require(source.is_file() and not source.is_symlink(), 'Assets must be regular top-level files: ' + str(source))
            name = source.name
            require(SAFE_ASSET.fullmatch(name) and source.suffix.lower() in ASSET_EXTENSIONS, 'Unsupported asset: ' + name)
            require(name not in files and name not in ('assets-index.json', 'game-config.json'), 'Duplicate or reserved asset: ' + name)
            require(source.stat().st_size <= 8_000_000, 'Oversized asset: ' + name)
            files[name] = source
    require({'tv.html', 'controller.html', 'controller.js', 'controller.css'} <= files.keys(), 'Missing TV or phone controller assets')
    return files


def payload(game):
    files = asset_inputs(game)
    data = {name: path.read_bytes() for name, path in files.items()}
    data['game-config.json'] = (json.dumps(metadata(game), ensure_ascii=False, separators=(',', ':')) + '\n').encode()
    data['assets-index.json'] = (json.dumps(sorted(data), separators=(',', ':')) + '\n').encode()
    require(sum(map(len, data.values())) < 32_000_000, 'Assets exceed uncompressed budget')
    return data


def run(args, env=None):
    subprocess.run([str(a) for a in args], check=True, env=env)


def main():
    global KIT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--kit', type=Path, default=KIT, help='Shared source directory; the builder itself stays pinned by CI')
    parser.add_argument('--game', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--sdk', type=Path, default=os.environ.get('ANDROID_HOME', '/workspace/scratch/usedcar-android-sdk'))
    parser.add_argument('--jdk', type=Path, default=os.environ.get('JAVA_HOME', '/workspace/scratch/usedcar-local-https/jdk-17.0.21+9'))
    parser.add_argument('--zxing', type=Path)
    parser.add_argument('--cache', type=Path, default=Path('/workspace/scratch/hundred-games/dex-cache'))
    args = parser.parse_args()
    KIT = checked_directory(args.kit, 'game kit directory')
    validate_native_source(KIT)
    game, output = checked_directory(args.game, 'game directory'), args.output.resolve()
    require(not output.is_relative_to(game) and not output.is_relative_to(KIT), 'Output must be outside source directories')
    meta = metadata(game)
    data = payload(game)
    icon = game_icon(game)
    tools = args.sdk / 'build-tools/34.0.0'
    android_jar = args.sdk / 'platforms/android-35/android.jar'
    zxing = args.zxing
    if zxing is None:
        candidates = sorted(Path('/workspace/scratch/usedcar-gradle/caches/modules-2/files-2.1/com.google.zxing/core/3.5.3').glob('*/*.jar'))
        require(len(candidates) == 1, 'Pass --zxing /path/to/core-3.5.3.jar')
        zxing = candidates[0]
    require(zxing.is_file() and android_jar.is_file(), 'Missing Android platform or ZXing jar')
    require(digest(zxing) == ZXING_SHA256, 'ZXing jar does not match the pinned dependency')
    env = dict(os.environ, JAVA_HOME=str(args.jdk), PATH=str(args.jdk / 'bin') + os.pathsep + os.environ['PATH'], SOURCE_DATE_EPOCH='315532800')
    output.mkdir(parents=True, exist_ok=True)
    args.cache.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='game-kit-', dir=output) as temp:
        work = Path(temp)
        res = work / 'res'
        shutil.copytree(KIT / 'android/src/main/res', res)
        if icon is not None:
            (res / 'drawable/ic_game.xml').write_bytes(icon)
        for folder, title in (('values', meta['name']), ('values-en', meta['nameEn'])):
            path = res / folder / 'strings.xml'
            tree = ET.parse(path)
            tree.find(".//string[@name='app_name']").text = title
            tree.write(path, encoding='utf-8', xml_declaration=True)
        asset_dir = work / 'assets'
        asset_dir.mkdir()
        for name, content in data.items():
            (asset_dir / name).write_bytes(content)
        manifest = ET.parse(KIT / 'android/src/main/AndroidManifest.xml')
        manifest.getroot().set('package', meta['packageName'])
        ET.register_namespace('android', ANDROID[1:-1])
        manifest.write(work / 'AndroidManifest.xml', encoding='utf-8', xml_declaration=True)
        generated = work / 'generated'
        run([tools / 'aapt2', 'compile', '--dir', res, '-o', work / 'compiled.zip'], env)
        run([tools / 'aapt2', 'link', '--manifest', work / 'AndroidManifest.xml', '-I', android_jar,
             '--java', generated, '--custom-package', 'com.ecojust.gamekit', '--min-sdk-version', '26',
             '--target-sdk-version', '29', '--version-code', str(meta['versionCode']), '--version-name', meta['version'],
             '-A', asset_dir, '-o', work / 'resources.apk', work / 'compiled.zip'], env)
        java = sorted((KIT / 'android/src/main/java').rglob('*.java')) + sorted(generated.rglob('*.java'))
        cache_key = hashlib.sha256(b'game-kit-d8-api26-jdk17-v1' + bytes.fromhex(digest(zxing)) + bytes.fromhex(digest(android_jar)) + b''.join(path.read_bytes() for path in java)).hexdigest()
        cached = args.cache / cache_key / 'classes.dex'
        if not cached.is_file():
            classes = work / 'classes'
            classes.mkdir()
            run([args.jdk / 'bin/javac', '-proc:none', '-encoding', 'UTF-8', '-source', '8', '-target', '8', '-bootclasspath', str(android_jar) + os.pathsep + str(tools / 'core-lambda-stubs.jar'),
                 '-classpath', zxing, '-d', classes, *java], env)
            run([args.jdk / 'bin/jar', 'cf', work / 'classes.jar', '-C', classes, '.'], env)
            dex = work / 'dex'
            dex.mkdir()
            run([tools / 'd8', '--release', '--min-api', '26', '--lib', android_jar, '--output', dex, work / 'classes.jar', zxing], env)
            require([p.name for p in dex.iterdir()] == ['classes.dex'], 'Unexpected multidex output')
            cached.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(dex / 'classes.dex', cached)
        unaligned = work / 'unaligned.apk'
        shutil.copyfile(work / 'resources.apk', unaligned)
        with zipfile.ZipFile(unaligned, 'a', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            info = zipfile.ZipInfo('classes.dex', (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, cached.read_bytes())
        apk = output / 'unsigned.apk'
        run([tools / 'zipalign', '-f', '4', unaligned, apk], env)
        run([tools / 'zipalign', '-c', '4', apk], env)
        require(0 < apk.stat().st_size < MAX_APK_BYTES, 'APK must be smaller than 10,000,000 bytes')
        with zipfile.ZipFile(apk) as archive:
            require(archive.testzip() is None, 'APK ZIP integrity failure')
            require(len(archive.namelist()) == len(set(archive.namelist())), 'Duplicate APK entries')
            for name, content in data.items():
                require(archive.read('assets/' + name) == content, 'Packaged asset differs: ' + name)
        receipt = {'schema': 1, 'game': meta['id'], 'packageName': meta['packageName'], 'version': meta['version'],
                   'versionCode': meta['versionCode'], 'unsigned': True, 'bytes': apk.stat().st_size, 'sha256': digest(apk),
                   'minSdk': 26, 'assets': {name: hashlib.sha256(value).hexdigest() for name, value in data.items()},
                   'hostDexCacheKey': cache_key, 'gameIconSha256': hashlib.sha256(icon).hexdigest() if icon is not None else None,
                   'physicalTvTested': False}
        (output / 'build-receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({'apk': str(apk), 'bytes': receipt['bytes'], 'sha256': receipt['sha256'], 'unsigned': True}))


if __name__ == '__main__':
    main()
