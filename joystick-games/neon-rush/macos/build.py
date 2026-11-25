#!/usr/bin/env python3
"""Build the standalone macOS app using Apple's SDK; no package downloads required."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import platform
import plistlib
import shutil
import subprocess
import tempfile
import sys

MACOS = Path(__file__).resolve().parent
GAME = MACOS.parent
REPO = GAME.parents[1]
sys.path.insert(0, str(REPO / 'tools'))
from macos_game_icons import committed_inputs, write_icns

METADATA = json.loads((GAME / 'game.json').read_text(encoding='utf-8'))
VERSION = METADATA['version']
BUILD_VERSION = str(METADATA['versionCode'])
NAME = 'Neon Rush'
EXECUTABLE = 'NeonRush'
ARCHITECTURES = ('arm64', 'x86_64')

def run(*args: str | Path, **kwargs):
    print('+', ' '.join(str(arg) for arg in args), flush=True)
    return subprocess.run([str(arg) for arg in args], check=True, **kwargs)

def capture(*args):
    return subprocess.check_output([str(arg) for arg in args], text=True).strip()

def digest(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def tree(root: Path):
    return {p.relative_to(root).as_posix(): {'bytes': p.stat().st_size, 'sha256': digest(p)}
            for p in sorted(root.rglob('*')) if p.is_file()}

def source_inputs():
    paths = [MACOS / 'build.py', GAME / 'package.json', GAME / 'package-lock.json', GAME / 'game.json', GAME / 'LICENSE', GAME / 'NOTICE.md',
             REPO / 'resource/game-kit/build.py', REPO / '.github/workflows/neon-rush-macos.yml']
    for directory in (MACOS / 'Sources', MACOS / 'Web', MACOS / 'tools', MACOS / 'tests',
                      GAME / 'source', GAME / 'tests', GAME / 'tools', GAME / 'src/main/assets',
                      REPO / 'resource/game-kit/web', REPO / 'resource/game-kit/qa'):
        if directory.exists():
            paths.extend(p for p in directory.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    return {p.relative_to(REPO).as_posix(): {'bytes': p.stat().st_size, 'sha256': digest(p)}
            for p in sorted(set(paths)) if p.is_file()}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if platform.system() != 'Darwin':
        parser.error('Building requires macOS with Xcode Command Line Tools')
    output = args.output.resolve()
    if output == REPO or REPO in output.parents:
        parser.error('Build into a scratch directory outside the repository')
    output.mkdir(parents=True, exist_ok=True)
    app = output / (NAME + '.app')
    if app.exists():
        parser.error('Output already contains an app; use a new directory to retain previous results')
    contents = app / 'Contents'
    resources = contents / 'Resources'
    binary_dir = contents / 'MacOS'
    resources.mkdir(parents=True)
    binary_dir.mkdir()
    plist = {
        'CFBundleName': NAME, 'CFBundleDisplayName': '霓虹飞车 · Neon Rush',
        'CFBundleIdentifier': 'com.ecojust.neonrush.macos', 'CFBundleExecutable': EXECUTABLE,
        'CFBundlePackageType': 'APPL', 'CFBundleShortVersionString': VERSION, 'CFBundleVersion': BUILD_VERSION,
        'CFBundleIconFile': 'NeonRush', 'LSMinimumSystemVersion': '11.0',
        'NSHighResolutionCapable': True, 'NSSupportsAutomaticGraphicsSwitching': True,
        'NSPrincipalClass': 'NSApplication', 'NSLocalNetworkUsageDescription':
        'Connect your pureTV Wi-Fi controller to play Neon Rush on this Mac.',
        'NSBonjourServices': ['_puretv._tcp'],
        'NSAppTransportSecurity': {'NSAllowsLocalNetworking': True},
        'NSHumanReadableCopyright': '© ecojust. MIT. Three.js: MIT; see bundled notices.',
    }
    (contents / 'Info.plist').write_bytes(plistlib.dumps(plist))
    (contents / 'PkgInfo').write_bytes(b'APPL????')
    run('python3', MACOS / 'tools/prepare-web.py', '--output', resources / 'Web')
    shutil.copy2(GAME / 'LICENSE', resources / 'LICENSE.txt')
    shutil.copy2(GAME / 'NOTICE.md', resources / 'NOTICE.md')
    sdk = capture('xcrun', '--sdk', 'macosx', '--show-sdk-path')
    source_commit = capture('git', '-C', REPO, 'rev-parse', 'HEAD')
    with tempfile.TemporaryDirectory(prefix='neon-rush-build-', dir=output) as temporary:
        work = Path(temporary)
        icon = write_icns(GAME, resources / 'NeonRush.icns')
        binaries = []
        sources = sorted((MACOS / 'Sources').glob('*.swift'))
        if not sources:
            raise RuntimeError('Native app sources are missing')
        for architecture in ARCHITECTURES:
            binary = work / (EXECUTABLE + '-' + architecture)
            run('xcrun', 'swiftc', '-swift-version', '5', '-O', '-target', architecture + '-apple-macos11.0',
                '-sdk', sdk, '-module-name', 'NeonRush', '-framework', 'AppKit', '-framework', 'WebKit', '-framework', 'Network',
                *sources, '-o', binary)
            binaries.append(binary)
        run('lipo', '-create', *binaries, '-output', binary_dir / EXECUTABLE)
        if set(capture('lipo', '-archs', binary_dir / EXECUTABLE).split()) != set(ARCHITECTURES):
            raise RuntimeError('Universal executable does not contain both architectures')
    run('codesign', '--force', '--sign', '-', '--timestamp=none', app)
    run('codesign', '--verify', '--deep', '--strict', '--verbose=2', app)
    run('plutil', '-lint', contents / 'Info.plist')
    stem = f'NeonRush-{VERSION}-macos-universal'
    zip_path = output / (stem + '.zip')
    dmg_path = output / (stem + '.dmg')
    run('ditto', '-c', '-k', '--sequesterRsrc', '--keepParent', app, zip_path)
    with tempfile.TemporaryDirectory(prefix='neon-rush-dmg-', dir=output) as temporary:
        staging = Path(temporary)
        run('ditto', app, staging / app.name)
        (staging / 'Applications').symlink_to('/Applications')
        run('hdiutil', 'create', '-volname', NAME, '-srcfolder', staging, '-format', 'UDZO', '-ov', dmg_path)
    run('hdiutil', 'verify', dmg_path)
    packages = {p.name: {'bytes': p.stat().st_size, 'sha256': digest(p)} for p in (zip_path, dmg_path)}
    (output / 'SHA256SUMS.txt').write_text(''.join(f"{value['sha256']}  {name}\n" for name, value in sorted(packages.items())))
    manifest = {'version': VERSION, 'buildVersion': BUILD_VERSION, 'bundleIdentifier': plist['CFBundleIdentifier'], 'sourceCommit': source_commit,
                'architectures': list(ARCHITECTURES), 'minimumMacOS': '11.0', 'signature': 'ad-hoc',
                'appleNotarized': False, 'gatekeeperApprovalTested': False,
                'sdkVersion': capture('xcrun', '--sdk', 'macosx', '--show-sdk-version'),
                'swiftVersion': capture('xcrun', 'swiftc', '--version'),
                'icon': icon, 'inputFiles': {**source_inputs(), **committed_inputs(GAME, REPO, source_commit)}, 'appFiles': tree(app), 'packages': packages,
                'physicalControllerTested': False}
    (output / 'build-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'app': str(app), 'packages': packages}, indent=2), flush=True)

if __name__ == '__main__':
    main()
