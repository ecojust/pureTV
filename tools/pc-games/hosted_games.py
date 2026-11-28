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


def localized(text):
    return f'<span data-en="{escape(text["en"], quote=True)}">{escape(text["zh"])}</span>'


def hosted_cover(game, read_file):
    number = game['number']
    start = (number - 1) // 500 * 500 + 1
    preview = f'joystick-games/catalog/previews/{start:04}-{start + 499:04}/{number:04}.webp'
    return read_file(preview)


def stage_hosted(game, output, read_file):
    title = escape(game['zh'])
    upstream = escape(game['url'], quote=True)
    title_en = escape(game['en'], quote=True)
    target = output / game['id']
    target.mkdir()
    (target / 'thumb.webp').write_bytes(hosted_cover(game, read_file))
    guide = game['guide']
    steps = '\n'.join(f'<li>{localized(step)}</li>' for step in guide['steps'])
    terms = '\n'.join(f'<dt>{escape(term["label"])}</dt><dd>{localized(term)}</dd>'
                      for term in guide['terms'])
    (target / 'tv.html').write_text(f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · pureTV</title><style>
*{{box-sizing:border-box}}
html,body{{margin:0;width:100%;height:100%}}
body{{display:flex;flex-direction:column;background:#101820;color:#edf4f5;font:1rem/1.5 system-ui,sans-serif}}
iframe{{width:100%;flex:1 1 0;min-height:0;border:0}}
nav{{display:flex;justify-content:flex-end;padding:.15rem .65rem}}
button{{background:#243a46;color:inherit;border:1px solid #74929f;border-radius:.35rem;padding:.25rem .8rem;font:inherit;cursor:pointer}}
button:focus-visible,#guide-body:focus-visible{{outline:3px solid #ffd45e;outline-offset:-3px}}
dialog{{width:min(42rem,95vw);max-height:92vh;padding:0;background:#152630;color:inherit;border:1px solid #74929f;border-radius:.65rem}}
dialog[open]{{display:flex;flex-direction:column}}
dialog::backdrop{{background:rgba(0,0,0,.68)}}
header{{display:flex;align-items:center;gap:1rem;justify-content:space-between;border-bottom:1px solid #45606c;padding:.75rem 1rem}}
header button{{flex-shrink:0}}
h1,h2,p,ol,dl,dd{{margin:0}}
h1{{font-size:1.25rem}}h2{{font-size:1.1rem;margin:1rem 0 .35rem}}
#guide-body{{min-height:0;overflow:auto;overscroll-behavior:contain;padding:.9rem 1rem 1.1rem}}
ol{{padding-inline-start:1.6rem}}li+li{{margin-top:.4rem}}
dl{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);column-gap:1rem;row-gap:.4rem;overflow-wrap:anywhere}}dt{{font-weight:600}}
</style><script defer src="../hosted-player.js?v=2"></script></head>
<body data-src="{upstream}" data-title="{title}" data-title-en="{title_en}">
<nav><button type="button" id="open-guide" aria-haspopup="dialog" aria-controls="guide" data-en="Game guide">中文指南</button></nav>
<dialog id="guide" aria-labelledby="guide-title">
<header><h1 id="guide-title" data-en="{title_en}">{title}</h1>
<button type="button" id="close-guide" autofocus data-en="Return to game">返回游戏</button></header>
<div id="guide-body" tabindex="0">
<p>{localized(guide['objective'])}</p>
<h2 data-en="How to play">玩法与操作</h2><ol>{steps}</ol>
<h2 data-en="On-screen terms">画面词汇</h2><dl>{terms}</dl>
</div></dialog></body></html>\n''', encoding='utf-8')
