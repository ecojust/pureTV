"""Publish English previews rendered by Android's Robolectric native graphics backend.

These are test renders of the real application with English resources and fixture
content, never physical-TV captures or translated screenshot pixels.
"""
import hashlib
import json
import os
import re
import struct
import tempfile
import zlib
from pathlib import Path


def validate_png(value):
    """Return complete PNG bytes and dimensions after checking chunks and pixels."""
    data = bytes(value) if isinstance(value, (bytes, bytearray)) else Path(value).read_bytes()
    if len(data) > 16 * 1024 * 1024 or not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('Preview must be a PNG smaller than 16 MiB')
    offset, header, compressed, ended = 8, None, bytearray(), False
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError('Truncated PNG chunk')
        length = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset + 4:offset + 8]
        end = offset + 12 + length
        if end > len(data):
            raise ValueError('Truncated PNG payload')
        payload = data[offset + 8:end - 4]
        if zlib.crc32(kind + payload) & 0xffffffff != struct.unpack_from('>I', data, end - 4)[0]:
            raise ValueError('PNG checksum mismatch')
        if header is None and kind != b'IHDR':
            raise ValueError('PNG must begin with IHDR')
        if kind == b'IHDR':
            if header is not None or length != 13:
                raise ValueError('Invalid PNG header')
            header = struct.unpack('>IIBBBBB', payload)
        elif kind == b'IDAT':
            compressed.extend(payload)
        elif kind == b'IEND':
            if length != 0 or end != len(data):
                raise ValueError('Invalid PNG end marker')
            ended = True
        offset = end
    if not ended or not header or not compressed:
        raise ValueError('Incomplete PNG preview')
    width, height, depth, color, compression, filtering, interlace = header
    depths = {0: (1, 2, 4, 8, 16), 2: (8, 16), 3: (1, 2, 4, 8), 4: (8, 16), 6: (8, 16)}
    if not 1 <= width <= 8192 or not 1 <= height <= 8192 or depth not in depths.get(color, ()) or compression or filtering or interlace not in (0, 1):
        raise ValueError('Unsupported PNG dimensions or pixel format')
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color]
    passes = [(0, 0, 1, 1)] if not interlace else [(0, 0, 8, 8), (4, 0, 8, 8), (0, 4, 4, 8), (2, 0, 4, 4), (0, 2, 2, 4), (1, 0, 2, 2), (0, 1, 1, 2)]
    rows = []
    for x, y, dx, dy in passes:
        columns, count = max(0, (width - x + dx - 1) // dx), max(0, (height - y + dy - 1) // dy)
        if columns and count:
            rows.extend([1 + (columns * channels * depth + 7) // 8] * count)
    expected = sum(rows)
    if expected > 128 * 1024 * 1024:
        raise ValueError('PNG pixel data is too large')
    decoder = zlib.decompressobj()
    pixels = decoder.decompress(compressed, expected + 1)
    if len(pixels) != expected or not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
        raise ValueError('Invalid PNG compressed pixel data')
    offset = 0
    for length in rows:
        if pixels[offset] > 4:
            raise ValueError('Invalid PNG scanline filter')
        offset += length
    return data, width, height


def _replace(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temporary:
        name = temporary.name
        temporary.write(data)
    try:
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def write_english_previews(root, category, slug, version, source_sha, build_run, home_png, apps_png=None):
    """Write validated English native captures and their reproducible provenance."""
    if category not in ('launcher', 'apps') or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
        raise ValueError('Invalid preview category or resource slug')
    if not isinstance(version, str) or not version.strip() or not re.fullmatch(r'[0-9a-f]{40}', source_sha):
        raise ValueError('Preview version and exact source commit are required')
    build_run = str(build_run)
    if build_run.isdigit():
        build_run = 'https://github.com/ecojust/pureTV/actions/runs/' + build_run
    if not re.fullmatch(r'https://github\.com/ecojust/pureTV/actions/runs/\d+', build_run):
        raise ValueError('Preview provenance requires a pureTV GitHub Actions run URL')
    if apps_png is not None and category != 'launcher':
        raise ValueError('Only launcher previews have an apps-page capture')
    prefix = 'launcher' if category == 'launcher' else 'app'
    sources = [(f'{prefix}-{slug}.png', home_png)]
    if apps_png is not None:
        sources.append((f'launcher-{slug}-apps.png', apps_png))
    images = [(name, *validate_png(value)) for name, value in sources]
    destination = Path(root) / 'docs/previews/en'
    manifest = destination / 'native-captures.json'
    records = json.loads(manifest.read_text()) if manifest.exists() else []
    if not isinstance(records, list) or any(not isinstance(item, dict) for item in records):
        raise ValueError('Native capture manifest must be a list of capture records')
    records = [item for item in records if (item.get('category'), item.get('slug')) != (category, slug)]
    added = []
    for name, data, width, height in images:
        added.append({'file': name, 'category': category, 'slug': slug, 'version': version,
                      'sourceCommit': source_sha, 'buildRun': build_run, 'locale': 'en-US',
                      'renderer': 'Robolectric native graphics', 'physicalTvCapture': False,
                      'provenance': 'Real Android UI with English locale and fixture content; not a physical TV capture.',
                      'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data),
                      'width': width, 'height': height})
    for name, data, _, _ in images:
        _replace(destination / name, data)
    records.extend(added)
    records.sort(key=lambda item: item['file'])
    _replace(manifest, (json.dumps(records, ensure_ascii=False, indent=2) + '\n').encode())
    return added
