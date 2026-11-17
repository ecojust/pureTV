#!/usr/bin/env python3
"""Extract APK artwork and render explicitly labelled third-party catalog covers.

This tool never runs, patches or re-signs an APK. Original raster icons retain
their exact ZIP-entry bytes. A small static SVG is a documented conversion of
the APK's vector icon or an approximation of its raster icon, never a data URI.
"""
import argparse
import base64
import hashlib
import html
import io
import json
import re
import shutil
import struct
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from pathlib import Path

from PIL import Image

MAX_SVG = 8192
MAX_ICON = 8 * 1024 * 1024
SVG_NS = 'http://www.w3.org/2000/svg'
CATEGORIES = {
    'media': ('影音', '#315ED8', '#E9EFFD'),
    'game': ('游戏', '#B76B26', '#FFF0DC'),
    'education': ('教育学习', '#20806A', '#E1F2EA'),
    'tools': ('实用工具', '#6854BA', '#EEEAFB'),
    'fitness': ('运动健身', '#BB4F79', '#FCE7EE'),
    'launcher': ('启动器', '#3B6E86', '#E5F0F5'),
}
TAGS = {'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'}
ATTRS = {'viewBox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy',
         'r', 'rx', 'ry', 'd', 'points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
         'stroke-linejoin', 'fill-rule', 'clip-rule', 'opacity', 'fill-opacity',
         'stroke-opacity', 'transform', 'color'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def valid_svg(svg, maximum=MAX_SVG):
    """Match the manager's bounded static subset; require resource dimensions."""
    data = svg.encode('utf-8')
    if not 0 < len(data) <= maximum or re.search(r'<!DOCTYPE|<!ENTITY', svg, re.I):
        raise ValueError('SVG exceeds its byte limit or declares entities')
    root = ET.fromstring(svg)
    if root.tag != '{' + SVG_NS + '}svg' or any(root.get(k) != v for k, v in
            [('width', '64'), ('height', '64'), ('viewBox', '0 0 64 64')]):
        raise ValueError('SVG must declare the 64×64 resource dimensions')
    for element in root.iter():
        if element.tag.removeprefix('{' + SVG_NS + '}') not in TAGS:
            raise ValueError('Unsupported SVG element')
        for key, value in element.attrib.items():
            if key not in ATTRS or re.search(r'url|javascript:|http:|https:|data:|@import|[<>]', value, re.I):
                raise ValueError('Unsupported SVG attribute or resource')
    return data


def icon_candidates(badging):
    candidates = []
    for density, path in re.findall(r"^application-icon-(\d+):'([^']+)'$", badging, re.M):
        candidates.append((int(density), path))
    for path in re.findall(r"^application:.*? icon='([^']+)'", badging, re.M):
        candidates.append((10000, path))
    for path in re.findall(r"^launchable-activity:.*? icon='([^']+)'", badging, re.M):
        candidates.append((9999, path))
    return list(dict.fromkeys(path for _, path in sorted(candidates, reverse=True)))


def alternate_icon_resources(apk, candidates, build_tools):
    """Resolve other density/API configurations of the same declared icon ID."""
    output = subprocess.check_output([str(build_tools / 'aapt'), 'dump', '--values', 'resources', str(apk)], text=True)
    resources, current = defaultdict(list), None
    for line in output.splitlines():
        match = re.match(r'\s+resource (0x[0-9a-fA-F]+) .*:', line)
        if match:
            current = match[1]
        else:
            match = re.match(r'\s+\(string(?:8|16)\) "([^"]+)"$', line)
            if match and current:
                resources[current].append(match[1])
    paths = []
    for values in resources.values():
        if set(values).intersection(candidates):
            paths.extend(values)
    return list(dict.fromkeys([*candidates, *paths]))


def read_icon(archive, path):
    entry = archive.getinfo(path)
    if not 0 < entry.file_size <= MAX_ICON:
        raise ValueError('Unbounded icon entry')
    data = archive.read(entry)
    with Image.open(io.BytesIO(data)) as image:
        if image.format not in ('PNG', 'WEBP', 'JPEG') or max(image.size) > 4096:
            raise ValueError('Unsupported icon image')
        image.load()
        return data, image.convert('RGBA'), {'PNG': 'png', 'WEBP': 'webp', 'JPEG': 'jpg'}[image.format]


def xml_tree(apk, asset, build_tools):
    output = subprocess.check_output([str(build_tools / 'aapt'), 'dump', 'xmltree', str(apk), asset], text=True)
    root, stack = None, []
    for line in output.splitlines():
        match = re.match(r'^(\s*)E: ([^ ]+)', line)
        if match:
            depth = len(match[1])
            node = {'tag': match[2], 'attrs': {}, 'children': []}
            while stack and stack[-1][0] >= depth:
                stack.pop()
            if stack:
                stack[-1][1]['children'].append(node)
            else:
                root = node
            stack.append((depth, node))
        else:
            match = re.match(r'\s*A: (?:android:)?([^ (=]+)(?:\([^)]*\))?=(.*)$', line)
            if match and stack:
                value = match[2].strip()
                quoted = re.search(r'\(Raw: "(.*)"\)$', value) or re.match(r'^"(.*)"$', value)
                stack[-1][1]['attrs'][match[1]] = quoted[1] if quoted else value
    if root is None:
        raise ValueError('No vector XML root')
    return root


def number(value):
    match = re.fullmatch(r'\(type 0x4\)0x([0-9a-fA-F]+)', value)
    if match:
        return struct.unpack('!f', bytes.fromhex(match[1].zfill(8)))[0]
    match = re.fullmatch(r'\(type 0x1[01]\)0x([0-9a-fA-F]+)', value)
    return int(match[1], 16) if match else float(value)


def decimal(value):
    return format(value, '.6g')


def color(value):
    match = re.fullmatch(r'\(type 0x1[c-f]\)0x([0-9a-fA-F]+)', value)
    if match:
        argb = int(match[1], 16)
        return '#' + format(argb & 0xffffff, '06x'), ((argb >> 24) & 255) / 255
    if re.fullmatch(r'#[a-fA-F0-9]{6}', value):
        return value, 1
    if re.fullmatch(r'#[a-fA-F0-9]{8}', value):
        return '#' + value[3:], int(value[1:3], 16) / 255
    raise ValueError('Vector color depends on unresolved resources')


def android_vector(apk, asset, build_tools):
    tree = xml_tree(apk, asset, build_tools)
    if tree['tag'] != 'vector':
        raise ValueError('Adaptive or drawable XML requires a raster fallback')
    attrs = tree['attrs']
    width, height = number(attrs['viewportWidth']), number(attrs['viewportHeight'])
    if width <= 0 or height <= 0 or any(key in attrs for key in ('tint', 'tintMode', 'autoMirrored')):
        raise ValueError('Unsupported vector viewport or tint')

    def convert(node):
        values, children = node['attrs'], node['children']
        if node['tag'] == 'group':
            x, y = number(values.get('pivotX', '0')), number(values.get('pivotY', '0'))
            tx, ty = number(values.get('translateX', '0')), number(values.get('translateY', '0'))
            sx, sy = number(values.get('scaleX', '1')), number(values.get('scaleY', '1'))
            rotation = number(values.get('rotation', '0'))
            transform = f'translate({decimal(x + tx)} {decimal(y + ty)}) rotate({decimal(rotation)}) scale({decimal(sx)} {decimal(sy)}) translate({decimal(-x)} {decimal(-y)})'
            return f'<g transform="{transform}">' + ''.join(map(convert, children)) + '</g>'
        if node['tag'] != 'path' or children or any(key.startswith('trimPath') for key in values):
            raise ValueError('Unsupported vector element or trimming')
        result = {'d': values['pathData'], 'fill': 'none'}
        for source, target in [('fillColor', 'fill'), ('strokeColor', 'stroke')]:
            if source in values:
                paint, opacity = color(values[source])
                result[target] = paint
                opacity *= number(values.get(target + 'Alpha', '1'))
                if opacity != 1:
                    result[target + '-opacity'] = decimal(opacity)
        for source, target in [('strokeWidth', 'stroke-width')]:
            if source in values:
                result[target] = decimal(number(values[source]))
        for source, target, options in [('strokeLineCap', 'stroke-linecap', ['butt', 'round', 'square']),
                                        ('strokeLineJoin', 'stroke-linejoin', ['miter', 'round', 'bevel']),
                                        ('fillType', 'fill-rule', ['nonzero', 'evenodd'])]:
            if source in values:
                result[target] = options[int(number(values[source]))]
        return '<path ' + ' '.join(f'{key}="{html.escape(value, quote=True)}"' for key, value in result.items()) + '/>'

    svg = f'<svg xmlns="{SVG_NS}" width="64" height="64" viewBox="0 0 64 64"><g transform="scale({decimal(64 / width)} {decimal(64 / height)})" opacity="{decimal(number(attrs.get("alpha", "1")))}">'
    svg += ''.join(map(convert, tree['children'])) + '</g></svg>'
    valid_svg(svg, maximum=2 * 1024 * 1024)
    return svg


def rasterize_vector(svg, destination):
    """Render a validated original vector conversion, without altering its paths."""
    valid_svg(svg, maximum=2 * 1024 * 1024)
    executable = shutil.which('inkscape')
    if not executable:
        raise ValueError('Inkscape is required for large vector-only APK icons')
    with tempfile.TemporaryDirectory(prefix='puretv-fork-vector-') as temporary:
        source = Path(temporary) / 'original.svg'
        source.write_text(svg)
        subprocess.run([executable, str(source), '--export-type=png', '--export-width=256', '--export-height=256',
                        '--export-filename=' + str(destination)], check=True, capture_output=True, timeout=60)
    with Image.open(destination) as image:
        image.load()
        return image.convert('RGBA')


def raster_svg(image):
    """Palette/runs conversion with explicit approximation metadata and size bound."""
    for size, colors in [(64, 24), (48, 20), (40, 16), (32, 16), (24, 12), (20, 8), (16, 8)]:
        canvas = Image.new('RGBA', (size, size))
        fitted = image.copy()
        fitted.thumbnail((size, size), Image.Resampling.LANCZOS)
        canvas.alpha_composite(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
        quantized = canvas.convert('RGB').quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        pixels, alpha, palette = quantized.load(), canvas.getchannel('A').load(), quantized.getpalette()
        rectangles, active = defaultdict(list), {}
        for y in range(size + 1):
            runs = set()
            if y < size:
                x = 0
                while x < size:
                    if alpha[x, y] < 96:
                        x += 1
                        continue
                    start, paint = x, pixels[x, y]
                    while x < size and alpha[x, y] >= 96 and pixels[x, y] == paint:
                        x += 1
                    runs.add((paint, start, x))
            for key in list(active):
                if key not in runs:
                    paint, start, end = key
                    rectangles[paint].append((start, active.pop(key), end - start, y))
            for key in runs:
                active.setdefault(key, y)
        paths = []
        for paint, boxes in sorted(rectangles.items()):
            fill = '#' + ''.join(f'{value:02x}' for value in palette[paint * 3:paint * 3 + 3])
            path = ''.join(f'M{x} {y}h{width}v{end - y}h-{width}z' for x, y, width, end in boxes)
            paths.append(f'<path fill="{fill}" stroke="{fill}" d="{path}"/>')
        # Adjacent palette regions otherwise expose transparent antialias seams.
        # A small same-color overlap closes them without embedding a bitmap.
        svg = f'<svg xmlns="{SVG_NS}" width="64" height="64" viewBox="0 0 64 64"><g transform="scale({decimal(64 / size)})" stroke-width=".35" stroke-linejoin="round">' + ''.join(paths) + '</g></svg>'
        if len(svg.encode()) <= MAX_SVG:
            valid_svg(svg)
            return svg, {'method': 'palette-run-vectorization', 'approximate': True,
                         'samplePixels': size, 'paletteColors': colors, 'seamOverlapPixels': 0.35,
                         'description': 'Simplified vector conversion of the APK icon; its original raster or full converted source vector is retained separately.'}
    raise ValueError('Cannot produce a bounded SVG from the APK icon')


def extract_artwork(apk, badging, directory, build_tools):
    candidates = icon_candidates(badging)
    if any(path.lower().endswith('.xml') for path in candidates):
        candidates = alternate_icon_resources(apk, candidates, build_tools)
    original, vector, errors = None, None, []
    with zipfile.ZipFile(apk) as archive:
        for path in candidates:
            if path.lower().endswith('.xml'):
                if vector is None:
                    try:
                        vector = (android_vector(apk, path, build_tools), path)
                    except (ValueError, KeyError, IndexError, subprocess.CalledProcessError) as error:
                        errors.append({'resource': path, 'reason': str(error)[:240]})
                continue
            try:
                data, image, extension = read_icon(archive, path)
                if original is None or image.width * image.height > original[1].width * original[1].height:
                    original = data, image, extension, path
            except (ValueError, KeyError, OSError) as error:
                errors.append({'resource': path, 'reason': str(error)[:240]})
    if original is None and vector is None:
        raise ValueError(f'No readable declared APK icon: {apk.name}; {errors}')
    result = {'representativeApk': apk.name, 'representativeApkSha256': digest(apk.read_bytes())}
    if original:
        data, image, extension, source = original
        name = 'logo.' + extension
        (directory / name).write_bytes(data)
        result['originalLogo'] = {'file': name, 'apkResource': source, 'bytes': len(data), 'sha256': digest(data),
                                  'width': image.width, 'height': image.height, 'method': 'exact-apk-zip-entry'}
    if vector and len(vector[0].encode()) <= MAX_SVG:
        svg, source = vector
        details = {'method': 'android-vector-conversion', 'approximate': False, 'apkResource': source}
    else:
        if original:
            image, source = original[1], original[3]
        else:
            source_svg, source = vector
            (directory / 'logo.source.svg').write_text(source_svg)
            image = rasterize_vector(source_svg, directory / 'logo.png')
            rendered = (directory / 'logo.png').read_bytes()
            result['renderedLogo'] = {'file': 'logo.png', 'bytes': len(rendered), 'sha256': digest(rendered),
                                      'width': image.width, 'height': image.height,
                                      'method': 'inkscape-render-of-android-vector', 'apkResource': source,
                                      'sourceSvg': 'logo.source.svg', 'sourceSvgSha256': digest(source_svg.encode()),
                                      'originalZipBytes': False}
        svg, details = raster_svg(image)
        details['apkResource'] = source
    data = valid_svg(svg)
    (directory / 'logo.svg').write_bytes(data)
    result['logo'] = {'file': 'logo.svg', 'bytes': len(data), 'sha256': digest(data), **details}
    if errors:
        result['iconConversionNotes'] = errors
    return result


def cover_html(item, directory, assets):
    category, accent, tint = CATEGORIES.get(item['category'], (item['category'], '#315ED8', '#E9EFFD'))
    logo = assets.get('originalLogo', assets.get('renderedLogo', assets['logo']))['file']
    extension = Path(logo).suffix
    mime = {'.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg'}[extension]
    encoded = base64.b64encode((directory / logo).read_bytes()).decode()
    name, version = html.escape(item['name']), html.escape(str(item['version']))
    size = item['bytes'] / 1_000_000
    return f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>
*{{box-sizing:border-box}}html,body{{margin:0;width:960px;height:540px;overflow:hidden}}
body{{font-family:"Noto Sans CJK SC",sans-serif;color:#213149;background:#f5f7fc}}
.page{{height:100%;padding:42px 48px;position:relative;border-top:8px solid {accent}}}
.top{{display:flex;align-items:center;justify-content:space-between;font-size:17px;color:#62718a}}
.pill{{padding:7px 17px;border-radius:99px;background:{tint};color:{accent};font-weight:700}}
.main{{display:flex;align-items:center;gap:36px;height:334px}}
.copy{{flex:1;min-width:0}}h1{{font-size:48px;line-height:1.34;letter-spacing:-1px;margin:0 0 22px;overflow-wrap:anywhere;font-weight:700}}
.meta{{display:flex;gap:10px;flex-wrap:wrap;font-size:19px;color:#51627a}}
.meta span{{background:white;border:1px solid #e0e6ef;border-radius:9px;padding:8px 13px}}
.art{{width:240px;height:240px;flex:none;background:white;border:1px solid #dfe6f0;border-radius:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 35px #183d7310}}
.art img{{width:188px;height:188px;object-fit:contain}}
.bottom{{position:absolute;left:48px;right:48px;bottom:34px;display:flex;justify-content:space-between;border-top:1px solid #dce3ee;padding-top:18px;color:#697991;font-size:16px}}
</style><div class="page"><div class="top"><span class="pill">{html.escape(category)}</span><span>TVAPP · 第三方应用收录</span></div>
<div class="main"><div class="copy"><h1>{name}</h1><div class="meta"><span>版本 {version}</span><span>{size:.2f} MB</span></div></div><div class="art"><img alt="APK 内置图标" src="data:{mime};base64,{encoded}"></div></div>
<div class="bottom"><span>应用介绍封面 · 非运行截图</span><span>fork / {html.escape(item['category'])}</span></div></div></html>'''


def render_covers(jobs, playwright, chromium):
    script = r'''
const fs=require('fs');
const {chromium}=require(process.argv[1]);
(async()=>{
 const jobs=JSON.parse(fs.readFileSync(0,'utf8'));
 const browser=await chromium.launch({executablePath:process.argv[2],headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
  await page.route('**/*',route=>route.request().url().startsWith('http')?route.abort():route.continue());
  for(const job of jobs){
   await page.setContent(fs.readFileSync(job.html,'utf8'));
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('img').evaluate(img=>img.decode());
   const measurements=await page.evaluate(()=>{
    const title=document.querySelector('h1'),box=document.querySelector('.copy');
    while(title.getBoundingClientRect().height>180&&parseInt(getComputedStyle(title).fontSize)>28)
     title.style.fontSize=(parseInt(getComputedStyle(title).fontSize)-2)+'px';
    return {title: title.getBoundingClientRect().toJSON(),copy:box.getBoundingClientRect().toJSON(),
     horizontalOverflow:document.documentElement.scrollWidth>innerWidth,verticalOverflow:document.documentElement.scrollHeight>innerHeight};
   });
   if(measurements.horizontalOverflow||measurements.verticalOverflow||measurements.title.height>185)
    throw new Error('Cover text overflow: '+job.output);
   await page.screenshot({path:job.output});
   console.log(JSON.stringify({file:job.output,...measurements}));
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
'''
    return subprocess.check_output(['node', '-e', script, str(playwright), str(chromium)],
                                   input=json.dumps(jobs), text=True)


def generate(items, build_tools, playwright, chromium):
    results, jobs = [], []
    with tempfile.TemporaryDirectory(prefix='puretv-fork-covers-') as temporary:
        for index, item in enumerate(items):
            directory = Path(item['appDir']).resolve()
            directory.mkdir(parents=True, exist_ok=True)
            apk = Path(item['apk'])
            if not apk.is_absolute():
                apk = directory / apk
            if not apk.is_file() or apk.stat().st_size != int(item['bytes']):
                raise ValueError('APK file or declared byte count does not match')
            badging = Path(item['badgingFile']).read_text() if item.get('badgingFile') else subprocess.check_output(
                [str(build_tools / 'aapt'), 'dump', 'badging', str(apk)], text=True)
            assets = extract_artwork(apk, badging, directory, build_tools)
            document = Path(temporary) / f'{index}.html'
            document.write_text(cover_html(item, directory, assets))
            jobs.append({'html': str(document), 'output': str(directory / 'thumb.png')})
            results.append((directory, assets))
        rendering = [json.loads(line) for line in render_covers(jobs, playwright, chromium).splitlines()]
    for (directory, assets), rendered in zip(results, rendering):
        data = (directory / 'thumb.png').read_bytes()
        assets['thumb'] = {'file': 'thumb.png', 'bytes': len(data), 'sha256': digest(data), 'width': 960, 'height': 540,
                           'method': 'chromium-catalog-card', 'screenshotOfApplication': False, 'physicalTvCapture': False,
                           'label': '应用介绍封面 · 非运行截图', 'textOverflow': False}
        assets['generator'] = 'tools/fork-tvapp-assets.py'
        (directory / 'assets.json').write_text(json.dumps(assets, ensure_ascii=False, indent=2) + '\n')
    return [{'appDir': str(directory), **assets} for directory, assets in results]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', type=Path, help='JSON array: appDir/apk/name/category/version/bytes/badgingFile(optional)')
    parser.add_argument('--app-dir', type=Path)
    parser.add_argument('--apk')
    parser.add_argument('--name')
    parser.add_argument('--category')
    parser.add_argument('--version')
    parser.add_argument('--bytes', type=int)
    parser.add_argument('--badging-file')
    parser.add_argument('--build-tools', type=Path, required=True)
    parser.add_argument('--playwright', type=Path, default=Path(__file__).resolve().parents[1] / 'desktop/node_modules/playwright')
    parser.add_argument('--chromium', type=Path, default=Path(shutil.which('chromium') or '/usr/bin/chromium'))
    arguments = parser.parse_args()
    if arguments.batch:
        items = json.loads(arguments.batch.read_text())
        if not isinstance(items, list) or not items:
            parser.error('--batch must contain a non-empty JSON array')
    else:
        if any(getattr(arguments, field) is None for field in ('app_dir', 'apk', 'name', 'category', 'version', 'bytes')):
            parser.error('Single-item mode requires --app-dir, --apk, --name, --category, --version and --bytes')
        items = [{'appDir': str(arguments.app_dir), 'apk': arguments.apk, 'name': arguments.name,
                  'category': arguments.category, 'version': arguments.version, 'bytes': arguments.bytes,
                  'badgingFile': arguments.badging_file}]
    print(json.dumps(generate(items, arguments.build_tools, arguments.playwright, arguments.chromium), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
