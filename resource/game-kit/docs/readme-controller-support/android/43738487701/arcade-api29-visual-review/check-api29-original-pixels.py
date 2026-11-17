#!/usr/bin/env python3
"""Read-only verification of the original API29 Tank/Jackal capture bytes."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, required=True)
args = parser.parse_args()
root = args.root.resolve()
base = root / 'resource/game-kit/docs/readme-controller-support/android/43738487701/evidence/controller-runtime-retry-arcade-visual'
box = (1480, 110, 1880, 940)
sha = lambda data: hashlib.sha256(data).hexdigest()
result = {'method': 'Decode unmodified PNG bytes with Pillow; compare all 332000 pixels of each gameplay sidebar against paused and reconnected captures.', 'sidebarBox': list(box), 'imagesModified': False, 'games': []}
for slug in ['tank', 'jackal']:
    folder = base / slug / 'gameplay'
    reference = Image.open(folder / 'gameplay.png').convert('RGB').crop(box)
    captures = []
    for name in ['gameplay.png', 'paused.png', 'reconnected.png']:
        path = folder / name
        image = Image.open(path).convert('RGB')
        sidebar = image.crop(box)
        diff = ImageChops.difference(reference, sidebar)
        changed = sum(rgb != (0, 0, 0) for rgb in diff.get_flattened_data())
        assert changed == 0
        assert image.getpixel((1600, 390)) == (255, 255, 255)
        captures.append({'path': str(path.relative_to(root)), 'pngSha256': sha(path.read_bytes()), 'sidebarRgbSha256': sha(sidebar.tobytes()), 'sidebarChangedPixelCountVsGameplay': changed, 'qrWhiteSample': {'xy': [1600, 390], 'rgb': list(image.getpixel((1600, 390)))}})
    result['games'].append({'slug': slug, 'captures': captures})
print(json.dumps(result, ensure_ascii=False, indent=2))
