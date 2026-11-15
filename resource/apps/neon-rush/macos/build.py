#!/usr/bin/env python3
"""Build the standalone macOS app using Apple's SDK; no package downloads required."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import platform
import plistlib
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

MACOS = Path(__file__).resolve().parent
GAME = MACOS.parent
REPO = GAME.parents[2]
VERSION = '0.1.3'
BUILD_VERSION = '3'
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

def svg_paths():
    """Render only the simple, local geometry used by this game's existing icon."""
    icon = ET.parse(GAME / 'logo.svg').getroot()
    if icon.attrib.get('viewBox') != '0 0 64 64':
        raise ValueError('Unexpected logo viewBox; update the icon renderer explicitly')
    lines = []
    for index, element in enumerate(icon):
        color = element.attrib.get('fill', '')
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', color):
            raise ValueError('Unsupported icon color')
        rgb = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        lines.append('ctx.setFillColor(CGColor(red: %s, green: %s, blue: %s, alpha: 1))' % tuple(rgb))
        kind = element.tag.rsplit('}', 1)[-1]
        name = 'path' + str(index)
        if kind == 'rect':
            x, y, w, h, r = (float(element.attrib.get(k, 0)) for k in ('x', 'y', 'width', 'height', 'rx'))
            lines.append(f'let {name} = CGPath(roundedRect: CGRect(x: {x}, y: {y}, width: {w}, height: {h}), cornerWidth: {r}, cornerHeight: {r}, transform: nil)')
        elif kind == 'path':
            data = element.attrib['d']
            tokens = re.findall(r'[MLHVZ]|-?\d+(?:\.\d+)?', data)
            if re.sub(r'[MLHVZ\s,\d.\-]', '', data):
                raise ValueError('Unsupported SVG path command')
            lines.append(f'let {name} = CGMutablePath()')
            i = 0
            x = y = 0.0
            while i < len(tokens):
                command = tokens[i]
                i += 1
                if command in ('M', 'L'):
                    x, y = float(tokens[i]), float(tokens[i + 1])
                    i += 2
                    method = 'move' if command == 'M' else 'addLine'
                    lines.append(f'{name}.{method}(to: CGPoint(x: {x}, y: {y}))')
                elif command == 'H':
                    x = float(tokens[i]); i += 1
                    lines.append(f'{name}.addLine(to: CGPoint(x: {x}, y: {y}))')
                elif command == 'V':
                    y = float(tokens[i]); i += 1
                    lines.append(f'{name}.addLine(to: CGPoint(x: {x}, y: {y}))')
                elif command == 'Z':
                    lines.append(f'{name}.closeSubpath()')
                else:
                    raise ValueError('SVG path requires explicit commands')
        else:
            raise ValueError('Unsupported SVG element: ' + kind)
        lines.append(f'ctx.addPath({name}); ctx.fillPath()')
    return '\n'.join(lines)

def make_icon(work: Path, resources: Path):
    source = work / 'render-icon.swift'
    source.write_text('''import AppKit
import CoreGraphics
let ctx = CGContext(data: nil, width: 1024, height: 1024, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.translateBy(x: 72, y: 952)
ctx.scaleBy(x: 13.75, y: -13.75)
''' + svg_paths() + '''
let image = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try image.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
''')
    renderer = work / 'render-icon'
    run('xcrun', 'swiftc', '-swift-version', '5', source, '-o', renderer)
    png = work / 'icon-1024.png'
    run(renderer, png)
    iconset = work / 'NeonRush.iconset'
    iconset.mkdir()
    for points in (16, 32, 128, 256, 512):
        for factor in (1, 2):
            pixels = points * factor
            name = f'icon_{points}x{points}' + ('@2x' if factor == 2 else '') + '.png'
            run('sips', '-z', str(pixels), str(pixels), png, '--out', iconset / name,
                stdout=subprocess.DEVNULL)
    run('iconutil', '-c', 'icns', iconset, '-o', resources / 'NeonRush.icns')

def source_inputs():
    paths = [MACOS / 'build.py', GAME / 'package.json', GAME / 'package-lock.json', GAME / 'game.json', GAME / 'logo.svg', GAME / 'LICENSE', GAME / 'NOTICE.md',
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
        make_icon(work, resources)
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
                'inputFiles': source_inputs(), 'appFiles': tree(app), 'packages': packages,
                'physicalControllerTested': False}
    (output / 'build-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'app': str(app), 'packages': packages}, indent=2), flush=True)

if __name__ == '__main__':
    main()
