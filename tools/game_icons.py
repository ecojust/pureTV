"""Render launcher artwork from a game's own gameplay capture.

Game paths can belong to a separate frozen checkout. A sparse checkout may
omit a tracked capture, in which case Git supplies the bytes from its index.
"""

import argparse
import io
import json
from pathlib import Path
import subprocess

def _location(game):
    game = Path(game).resolve()
    if game.parent.name == 'apps' and game.parent.parent.name == 'resource':
        root = game.parents[2]
    elif game.parent.name == 'joystick-games':
        root = game.parents[1]
    else:
        raise ValueError(f'Expected a resource/apps or joystick-games directory: {game}')
    return root, game.relative_to(root).as_posix()


def _read(root, path):
    if path.is_file():
        return path.read_bytes()
    relative = path.relative_to(root).as_posix()
    state = subprocess.run(['git', 'ls-files', '-t', '--', relative], cwd=root,
                           capture_output=True, text=True, check=True)
    if not state.stdout.startswith('S '):
        raise FileNotFoundError(path)
    return subprocess.check_output(['git', 'show', ':' + relative], cwd=root)


def catalog_game_dir(root, slug):
    """Resolve the source of a standalone client, including hidden games."""
    root = Path(root).resolve()
    if not slug or Path(slug).name != slug or slug in {'.', '..'}:
        raise ValueError(f'Invalid game id: {slug}')
    catalog = json.loads(_read(root, root / 'tools/readme-app-games.json'))
    for category in catalog:
        for entry in category['games']:
            location = entry.get('page') or 'resource/' + entry['resource']
            if Path(location).name == slug:
                return root / location
    for parent in ('resource/apps', 'joystick-games'):
        candidate = root / parent / slug
        for manifest in ('resource.json', 'game.json'):
            try:
                _read(root, candidate / manifest)
            except FileNotFoundError:
                continue
            return candidate
    raise ValueError(f'Unknown game: {slug}')


def source_image(game):
    """Return the path of the original gameplay capture in the game's checkout."""
    root, key = _location(game)
    sources = json.loads(_read(root, root / 'tools/game-icon-sources.json'))
    path = (root / sources.get(key, key + '/thumb.png')).resolve()
    if not path.is_relative_to(root) or path.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
        raise ValueError(f'Invalid gameplay capture path: {path}')
    return path


def source_bytes(game):
    root, _ = _location(game)
    return _read(root, source_image(game))


def _artwork(game, size, square):
    from PIL import Image, ImageOps

    root, key = _location(game)
    with Image.open(io.BytesIO(source_bytes(game))) as capture:
        picture = ImageOps.exif_transpose(capture).convert('RGB')
    if square:
        crops = json.loads(_read(root, root / 'tools/game-icon-crops.json'))
        if key in crops:
            left, top, right, bottom = crops[key]
            if not (0 <= left < right <= 1 and 0 <= top < bottom <= 1):
                raise ValueError(f'Invalid gameplay crop for {key}: {crops[key]}')
            w, h = picture.size
            picture = picture.crop((round(left * w), round(top * h),
                                    round(right * w), round(bottom * h)))
    return ImageOps.fit(picture, size, method=Image.Resampling.LANCZOS)


def save_png(game, output, size):
    """Write square artwork at the target launcher's pixel size."""
    _artwork(game, (size, size), True).save(output, format='PNG')


def save_banner(game, output, size=(320, 180)):
    """Use the full scene for the landscape Android TV launcher."""
    _artwork(game, size, False).save(output, format='PNG')


def save_ico(game, output):
    sizes = [(s, s) for s in (16, 24, 32, 48, 64, 128, 256)]
    _artwork(game, (256, 256), True).save(output, format='ICO', sizes=sizes)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game', type=Path)
    parser.add_argument('output', type=Path)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--size', type=int, default=512)
    group.add_argument('--banner', action='store_true')
    args = parser.parse_args()
    if args.size <= 0:
        parser.error('--size must be positive')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.suffix.lower() == '.ico' and not args.banner:
        save_ico(args.game, args.output)
    elif args.output.suffix.lower() != '.png':
        parser.error('Use a .png image or a square .ico')
    elif args.banner:
        save_banner(args.game, args.output)
    else:
        save_png(args.game, args.output, args.size)


if __name__ == '__main__':
    main()
