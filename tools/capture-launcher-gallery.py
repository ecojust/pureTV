#!/usr/bin/env python3
"""Render eight real native launcher captures as a 2400 x 1004 browser gallery.

Run from the repository after native CI captures have been staged:
  python tools/capture-launcher-gallery.py --locale en
  python tools/capture-launcher-gallery.py --locale zh

English reads docs/previews/en/launcher-<slug>.png and the names in
resource-index.en.json. Chinese reads resource/launcher/<slug>/thumb.png and
resource metadata. Neither mode translates or edits screenshot pixels, and
missing captures are errors; no placeholder artwork is generated.

Requires Node, desktop/node_modules/playwright and an installed Chromium.
CHROMIUM_PATH optionally selects an existing browser. --output overrides the
PNG path; --html-output keeps the HTML for inspection. --html-only requires
--html-output and validates the inputs without producing a PNG.
"""
import argparse
import hashlib
import html
import json
import subprocess
import tempfile
from pathlib import Path

SLUGS = ('aster', 'sol', 'moss', 'forma', 'mono', 'drift', 'circuit', 'pixel')
WIDTH, HEIGHT = 2400, 1004
COPY = {
    'en': {
        'lang': 'en',
        'title': 'pureTV · Launcher Collection',
        'subtitle': '8 independent TV launchers · layout v5',
        'footer': 'Native Android UI renders · Sample apps · Not photographs of a physical TV',
        'alt': 'native Home screenshot',
        'output': 'docs/previews/launcher-collection-en.png',
    },
    'zh': {
        'lang': 'zh-CN',
        'title': 'pureTV · Launcher Collection',
        'subtitle': '8 款独立电视启动器 · layout v5',
        'footer': 'Android 原生界面渲染 · 使用测试应用 · 非电视实拍',
        'alt': '原生首页截图',
        'output': 'docs/previews/launcher-collection-010.png',
    },
}
RENDER_JS = r'''
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const settings=JSON.parse(fs.readFileSync(0,'utf8'));
const {chromium}=require(path.join(settings.root,'desktop/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  try {
    const page=await browser.newPage({viewport:{width:settings.width,height:settings.height},deviceScaleFactor:1,locale:settings.locale==='en'?'en-US':'zh-CN'});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
    await page.goto(pathToFileURL(settings.html).href,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(()=>({
      images:[...document.images].map(i=>({complete:i.complete,width:i.naturalWidth,height:i.naturalHeight,src:i.src})),
      width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
      captions:[...document.querySelectorAll('figcaption')].map(n=>({scroll:n.scrollWidth,client:n.clientWidth})),
      containsCJK:/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(document.body.innerText+' '+document.title+' '+[...document.images].map(i=>i.alt).join(' '))
    }));
    if(errors.length)throw Error(errors.join('\n'));
    if(metrics.images.length!==8||metrics.images.some(i=>!i.complete||i.width<960||i.height<540||i.width*9!==i.height*16))throw Error('Missing or invalid native 16:9 capture: '+JSON.stringify(metrics.images));
    if(metrics.width!==settings.width||metrics.height!==settings.height)throw Error('Unexpected gallery bounds: '+JSON.stringify(metrics));
    if(metrics.captions.some(c=>c.scroll>c.client))throw Error('A caption overflows');
    if(settings.locale==='en'&&metrics.containsCJK)throw Error('English gallery text contains CJK characters');
    await page.screenshot({path:settings.output,type:'png',fullPage:false,animations:'disabled',caret:'hide'});
  } finally {await browser.close();}
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)});
'''


def read_records(root, locale):
    captures = {
        slug: root / (f'docs/previews/en/launcher-{slug}.png' if locale == 'en'
                      else f'resource/launcher/{slug}/thumb.png')
        for slug in SLUGS
    }
    missing = [str(path) for path in captures.values() if not path.is_file()]
    if missing:
        raise ValueError('Native screenshots are not ready; stage CI captures first:\n' + '\n'.join(missing))
    english = None
    if locale == 'en':
        config = root / 'tools/resource-index.en.json'
        if not config.is_file():
            raise ValueError(f'English resource-name configuration is missing: {config}')
        english = json.loads(config.read_text(encoding='utf-8'))
    records = []
    for slug, capture in captures.items():
        data = capture.read_bytes()
        if not data.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError(f'Native screenshot is not a PNG: {capture}')
        if english is not None:
            info = english.get(f'launcher/{slug}', {})
        else:
            folder = root / 'resource/launcher' / slug
            metadata = folder / 'resource.json'
            if not metadata.is_file():
                metadata = folder / 'build-resource.json'
            if not metadata.is_file():
                raise ValueError(f'Launcher metadata is missing: {metadata}')
            info = json.loads(metadata.read_text(encoding='utf-8'))
        name = info.get('name')
        if not isinstance(name, str) or not name.strip():
            raise ValueError(f'Launcher display name is missing: {slug} ({locale})')
        if locale == 'en' and not name.isascii():
            raise ValueError(f'English launcher name must be plain English: {slug}: {name}')
        records.append({'slug': slug, 'name': name, 'capture': capture.resolve(),
                        'sha256': hashlib.sha256(data).hexdigest()})
    return records


def gallery_html(records, locale):
    copy = COPY[locale]
    cards = '\n'.join(
        '<figure data-theme="' + html.escape(row['slug'], quote=True) + '">'
        '<img src="' + html.escape(row['capture'].as_uri(), quote=True) + '" alt="' +
        html.escape(row['name'] + ' ' + copy['alt'], quote=True) + '">'
        '<figcaption>' + html.escape(row['name']) + '</figcaption></figure>'
        for row in records
    )
    # Fixed 4 x 2 layout: 562 x 316 capture, 60 px caption, 24 px gutters.
    return f'''<!doctype html>
<html lang="{copy['lang']}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(copy['title'])}</title>
<style>
*{{box-sizing:border-box}}html,body{{margin:0;padding:0;width:2400px;height:1004px;overflow:hidden}}
body{{background:#eef1f4;color:#16202c;font-family:"Noto Sans CJK SC","Noto Sans SC",sans-serif;-webkit-font-smoothing:antialiased}}
h1{{position:absolute;left:40px;top:24px;margin:0;font-size:42px;line-height:58px;font-weight:700;letter-spacing:-.5px}}
.subtitle{{position:absolute;left:40px;top:84px;margin:0;font-size:23px;line-height:32px;color:#566474}}
main{{position:absolute;left:40px;top:140px;display:grid;grid-template-columns:repeat(4,562px);gap:24px}}
figure{{width:562px;height:376px;margin:0;background:white;position:relative;outline:1px solid #d6dde5;outline-offset:-1px}}
img{{display:block;width:562px;height:316px;object-fit:contain;background:#0b0e14}}
figcaption{{height:60px;padding:10px 16px 0;font-size:27px;line-height:40px;font-weight:700;white-space:nowrap;color:#18212d}}
footer{{position:absolute;left:40px;bottom:17px;height:30px;font-size:21px;line-height:30px;color:#637080}}
</style></head><body>
<h1>{html.escape(copy['title'])}</h1><p class="subtitle">{html.escape(copy['subtitle'])}</p>
<main>{cards}</main>
<footer>{html.escape(copy['footer'])}</footer>
</body></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--locale', choices=('en', 'zh'), default='zh')
    parser.add_argument('--output', type=Path, help='PNG destination; defaults to the locale-specific docs/previews path')
    parser.add_argument('--html-output', type=Path, help='Keep the generated HTML at this path')
    parser.add_argument('--html-only', action='store_true', help='Validate inputs and write HTML only; requires --html-output')
    args = parser.parse_args()
    if args.html_only and args.html_output is None:
        parser.error('--html-only requires --html-output')
    root = args.root.resolve()
    try:
        records = read_records(root, args.locale)
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
    output = (args.output or root / COPY[args.locale]['output']).resolve()
    with tempfile.TemporaryDirectory(prefix='puretv-launcher-gallery-') as temporary:
        target = (args.html_output or Path(temporary) / 'gallery.html').resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(gallery_html(records, args.locale), encoding='utf-8')
        settings = {'root': str(root), 'html': str(target), 'output': str(output),
                    'width': WIDTH, 'height': HEIGHT, 'locale': args.locale}
        if not args.html_only:
            output.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(['node', '-e', RENDER_JS], input=json.dumps(settings), text=True, check=True)
        print(json.dumps({'locale': args.locale, 'width': WIDTH, 'height': HEIGHT,
                          'output': None if args.html_only else str(output),
                          'html': str(target) if args.html_output else None,
                          'captures': {row['slug']: row['sha256'] for row in records}}, ensure_ascii=False))


if __name__ == '__main__':
    main()
