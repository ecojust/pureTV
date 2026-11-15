#!/usr/bin/env python3
"""Assemble the existing game payload with a macOS-only presentation adapter."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

MACOS = Path(__file__).resolve().parents[1]
APP = MACOS.parent
KIT = APP.parents[1] / 'game-kit'
spec = importlib.util.spec_from_file_location('game_kit_build', KIT / 'build.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def prepare(output):
    output = output.resolve()
    if output.is_relative_to(APP) or output.is_relative_to(KIT):
        raise SystemExit('Build output must be outside the source directories')
    output.mkdir(parents=True, exist_ok=True)
    assets = module.payload(APP)
    base = {name: hashlib.sha256(data).hexdigest() for name, data in assets.items()}
    html = assets['tv.html'].decode('utf-8')
    assert html.count('<script src="runtime.js"></script>') == 1
    html = html.replace('<script src="runtime.js"></script>', '<script src="desktop-ui.js"></script><script src="runtime.js"></script>')
    html = html.replace('</head>', '<link rel="stylesheet" href="desktop.css"></head>')
    assets['tv.html'] = html.encode('utf-8')
    for name in ('bridge.js', 'desktop-ui.js', 'desktop.css'):
        assets[name] = (MACOS / 'Web' / name).read_bytes()
    for name, data in assets.items():
        (output / name).write_bytes(data)
    result = {
        'entry': 'tv.html', 'assets': len(assets),
        'originalPayloadSha256': base,
        'bundleSha256': {name: hashlib.sha256(data).hexdigest() for name, data in assets.items()},
        'changedOriginalAssets': ['tv.html'],
        'nativeInjection': 'bridge.js at document start, then initial NeonDesktop.receive(info,snapshot)',
    }
    (output.parent / 'web-assets.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'directory': str(output), 'assets': len(assets), 'unchangedGameModelAndRenderer': True}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    prepare(parser.parse_args().output)
