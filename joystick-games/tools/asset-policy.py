#!/usr/bin/env python3
"""Explicit resource budgets for registered joystick games, never global overrides."""
import re

DEFAULT_ANDROID = {'maxAssetBytes': 8_000_000, 'maxTotalBytes': 32_000_000,
                   'maxApkBytes': 10_000_000}
DEFAULT_MACOS = {'maxAssetBytes': 10 * 1024 * 1024, 'maxTotalBytes': 32 * 1024 * 1024,
                 'maxApkBytes': 10_000_000}
HARD_LIMITS = {'maxAssetBytes': 64 * 1024 * 1024, 'maxTotalBytes': 256 * 1024 * 1024,
               'maxApkBytes': 128_000_000}
EXTRA_EXTENSIONS = ('.glb', '.gltf', '.bin', '.wasm', '.hdr', '.ktx2',
                    '.woff', '.woff2', '.ttf', '.otf', '.ico', '.opus', '.m4a')
MAX_FILES = 2048
MAX_INDEX_BYTES = 65_536


def declaration(meta, registered=None):
    """Both committed identities must opt into exactly the same bounded policy."""
    value = meta.get('assetPolicy')
    other = registered.get('assetPolicy') if isinstance(registered, dict) else None
    if value is None and other is None:
        assert 'assetPolicy' not in meta, 'Null assetPolicy is not a declaration'
        assert registered is None or 'assetPolicy' not in registered, 'Null registry assetPolicy'
        return None
    assert isinstance(registered, dict), 'Resource policy requires catalog registration'
    slug = meta.get('id')
    assert isinstance(slug, str) and re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug)
    assert meta.get('packageName') == registered.get('packageName') == 'com.ecojust.joystick.' + slug.replace('-', '')
    assert isinstance(value, dict) and value == other, 'Registry and game assetPolicy must match exactly'
    assert set(value) == {'schemaVersion', *HARD_LIMITS}, 'Unknown or missing assetPolicy field'
    assert type(value['schemaVersion']) is int and value['schemaVersion'] == 1
    for key, maximum in HARD_LIMITS.items():
        assert type(value[key]) is int and 0 < value[key] <= maximum, 'Invalid assetPolicy ' + key
    assert value['maxAssetBytes'] <= value['maxTotalBytes'], 'Per-file budget exceeds total budget'
    return dict(value)


def limits(meta, registered=None, platform='android'):
    assert platform in ('android', 'macos', 'windows')
    value = declaration(meta, registered)
    if value is None:
        return dict(DEFAULT_ANDROID if platform == 'android' else DEFAULT_MACOS)
    return {key: value[key] for key in HARD_LIMITS}


def android_limits(meta, registered=None):
    value = declaration(meta, registered)
    if value is None:
        return None  # Use the original GameKit interface and defaults exactly.
    return {**limits(meta, registered), 'extraExtensions': EXTRA_EXTENSIONS}


def desktop_package_limit(meta, registered=None):
    """Keep historical desktop cap unless a game explicitly declares its budget."""
    value = declaration(meta, registered)
    return 100_000_000 if value is None else value['maxApkBytes']
