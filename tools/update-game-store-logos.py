#!/usr/bin/env python3
"""Render the TV store's bounded shortcut SVGs from the installed game's artwork."""
import argparse
from collections import defaultdict
from io import BytesIO
from itertools import groupby
import json
from pathlib import Path

from PIL import Image

from game_icons import save_png

ROOT = Path(__file__).resolve().parents[1]
# The store and launcher both enforce 8192 bytes, including XML normalization.
SVG_BUDGET = 8100


def pixel_art(image, size):
    """Encode each palette row with horizontal runs, exact at the chosen resolution."""
    # Sparse bright objects such as a ship or a playing-card suit need palette
    # entries even when most of the screenshot is the same background color.
    indexed = image.resize((size, size), Image.Resampling.LANCZOS).quantize(
        colors=24, method=Image.Quantize.MAXCOVERAGE, kmeans=1)
    palette = indexed.getpalette()
    background = max(indexed.getcolors())[1]

    def color(index):
        return '#' + bytes(palette[3 * index:3 * index + 3]).hex()

    paths = defaultdict(list)
    for y in range(size):
        x = 0
        row = indexed.crop((0, y, size, y + 1)).tobytes()
        for index, run in groupby(row):
            width = sum(1 for _ in run)
            if index != background:
                paths[index].append(f'M{x} {y}h{width}')
            x += width
    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">',
        f'<rect width="64" height="64" fill="{color(background)}"/>',
        f'<g transform="scale({64 / size:.8g}) translate(0 .5)" fill="none" stroke-width="1">',
    ]
    for index, operations in sorted(paths.items()):
        svg.append(f'<path stroke="{color(index)}" d="{"".join(operations)}"/>')
    return ''.join(svg) + '</g></svg>\n'


def game_logo(directory):
    png = BytesIO()
    save_png(directory, png, 256)
    png.seek(0)
    with Image.open(png) as image:
        for size in (64, 56, 48, 40, 36, 32, 28, 24, 20):
            svg = pixel_art(image, size)
            if len(svg.encode()) <= SVG_BUDGET:
                return svg
    raise ValueError(f'{directory.name}: SVG exceeds store size limit')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    games = json.loads((ROOT / 'tools/resource-order.json').read_text())['game']
    for key in games:
        path = ROOT / 'resource' / key / 'logo.svg'
        svg = game_logo(path.parent)
        if path.read_text() != svg:
            if args.check:
                raise ValueError(f'Outdated game shortcut icon: {path}')
            path.write_text(svg)
    print(f'Checked {len(games)} game shortcut icons.')


if __name__ == '__main__':
    main()
