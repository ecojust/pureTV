#!/usr/bin/env python3
"""Read original image bytes; do not redraw, repair or replace artifacts."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

root = Path('/dev/shm/puretv-controller-games')
base = root / 'resource/game-kit/docs/readme-controller-support/android/43737205477'
sha = lambda data: hashlib.sha256(data).hexdigest()
report = {'method': 'Pillow decodes unchanged original PNG files. Compare every RGB pixel in the full sidebar rectangle, plus independent white-border/QR point samples.', 'imageFilesModified': False, 'sidebarBox': [1480, 130, 1880, 910], 'games': [], 'videoFrames': []}
points = [(1500, 135), (1600, 135), (1800, 135), (1874, 300), (1599, 380), (1610, 400), (1875, 500)]
for slug in ['tank', 'jackal']:
    folder = base / 'evidence/controller-runtime-arcade-1' / slug / 'gameplay'
    reference = Image.open(folder / 'gameplay.png').convert('RGB')
    ref_sidebar = reference.crop(tuple(report['sidebarBox']))
    captures = []
    for name in ['gameplay.png', 'paused.png', 'reconnected.png']:
        path = folder / name
        image = Image.open(path).convert('RGB')
        sidebar = image.crop(tuple(report['sidebarBox']))
        difference = ImageChops.difference(ref_sidebar, sidebar)
        count = sum(rgb != (0, 0, 0) for rgb in difference.get_flattened_data())
        assert count == 0
        captures.append({'path': str(path.relative_to(root)), 'pngSha256': sha(path.read_bytes()), 'sidebarRgbSha256': sha(sidebar.tobytes()), 'sidebarChangedPixelCountVsGameplay': count, 'samplePixels': [{'xy': [x, y], 'rgb': list(image.getpixel((x, y)))} for x, y in points]})
    report['games'].append({'slug': slug, 'captures': captures})
for path in sorted((base / 'arcade-visual-video-frames').glob('*.png')):
    image = Image.open(path).convert('RGB')
    # These PNGs are unchanged decoded 960x540 frames from the original video.
    border = image.getpixel((937, 250))
    qr = image.getpixel((805, 200))
    assert min(border) > 230 and min(qr) > 230
    report['videoFrames'].append({'path': str(path.relative_to(root)), 'pngSha256': sha(path.read_bytes()), 'rightBorderPixel': list(border), 'qrWhitePixel': list(qr), 'sidebarNonBlackPixels': sum(max(rgb) > 30 for rgb in image.crop((740, 65, 940, 455)).get_flattened_data())})
print(json.dumps(report, ensure_ascii=False, indent=2))
