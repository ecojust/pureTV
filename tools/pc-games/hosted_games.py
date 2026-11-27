"""Build players for games served by their authors and listed in the pureTV library."""
from html import escape
import json
from pathlib import Path
import re
from urllib.parse import urlsplit


def hosted_games():
    entries = json.loads(Path(__file__).with_name('hosted-games.json').read_text(encoding='utf-8'))
    ids = set()
    for entry in entries:
        slug = entry['id']
        url = urlsplit(entry['url'])
        if (not re.fullmatch(r'[a-z0-9-]+', slug) or slug in ids or url.scheme != 'https'
                or not url.hostname or url.username or url.password):
            raise ValueError(f'Invalid hosted game: {slug}')
        ids.add(slug)
    return entries


def stage_hosted(game, output, read_file):
    title = escape(game['zh'])
    upstream = escape(game['url'], quote=True)
    hint = escape(game['controls']['zh'])
    hint_en = escape(game['controls']['en'], quote=True)
    title_en = escape(game['en'], quote=True)
    target = output / game['id']
    target.mkdir()
    number = game['number']
    start = (number - 1) // 500 * 500 + 1
    preview = f'joystick-games/catalog/previews/{start:04}-{start + 499:04}/{number:04}.webp'
    (target / 'thumb.webp').write_bytes(read_file(preview))
    (target / 'tv.html').write_text(f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · pureTV</title><style>
*{{box-sizing:border-box}}html,body{{margin:0;width:100%;height:100%}}body{{display:flex;flex-direction:column;background:#101820;color:#edf4f5;font:1rem/1.45 system-ui,sans-serif}}
iframe{{width:100%;flex:1 1 0;min-height:0;border:0}}details{{padding:.35rem 1rem}}summary{{cursor:pointer;width:max-content}}p{{margin:.4rem 0}}
</style><script defer src="../hosted-player.js"></script></head><body data-src="{upstream}" data-title="{title}" data-title-en="{title_en}">
<details><summary>操作说明</summary><p data-en="{hint_en}">{hint}</p></details></body></html>\n''', encoding='utf-8')
