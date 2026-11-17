#!/usr/bin/env python3
"""Bake the original, seamless material library for Used Car Racing TV.

Developer-only tool: Python 3, Pillow and numpy. No downloaded source images.
Run from any directory; deterministic seeds and fixed-size textures are intentional.
"""
from pathlib import Path
import json
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'resource/apps/used-car-racing/src/main/assets/textures'
OUT.mkdir(parents=True, exist_ok=True)
MANIFEST = {}


def noise(n, freq, seed):
    """Periodic smooth value noise sampled on a torus."""
    r = np.random.default_rng(seed)
    grid = r.random((freq, freq), dtype=np.float32)
    u = np.arange(n, dtype=np.float32) * freq / n
    at = np.floor(u).astype(np.int32)
    t = u - at
    t = t * t * (3 - 2 * t)
    a = grid[at[:, None] % freq, at[None, :] % freq]
    b = grid[at[:, None] % freq, (at[None, :] + 1) % freq]
    c = grid[(at[:, None] + 1) % freq, at[None, :] % freq]
    d = grid[(at[:, None] + 1) % freq, (at[None, :] + 1) % freq]
    return (a * (1 - t[None, :]) + b * t[None, :]) * (1 - t[:, None]) + (c * (1 - t[None, :]) + d * t[None, :]) * t[:, None]


def fractal(n, seed):
    return sum((noise(n, f, seed + i) - .5) * w for i, (f, w) in enumerate(((3, .45), (7, .24), (17, .15), (43, .10), (113, .06))))


def rgb(value, tint=(1, 1, 1)):
    return np.clip(value[:, :, None] * np.asarray(tint)[None, None, :], 0, 255).astype(np.uint8)


def save(name, color, height=None, spec=None, normal_strength=2.0):
    color = Image.fromarray(color)
    path = OUT / (name + '-color.jpg')
    color.save(path, quality=89, subsampling=0, optimize=True)
    entry = {'map': path.name, 'size': color.width}
    if height is not None:
        normal_size = 512 if name in ('asphalt', 'rock', 'rubber') else 256
        h = np.asarray(Image.fromarray(height.astype(np.float32)).resize((normal_size, normal_size), Image.Resampling.BILINEAR))
        dx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * normal_strength
        dy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * normal_strength
        vec = np.stack((-dx, dy, np.ones_like(h)), axis=-1)
        vec /= np.linalg.norm(vec, axis=-1)[:, :, None]
        normal = np.clip((vec * .5 + .5) * 255, 0, 255).astype(np.uint8)
        normal_path = OUT / (name + '-normal.jpg')
        Image.fromarray(normal).save(normal_path, quality=92, subsampling=0, optimize=True)
        entry['normalMap'] = normal_path.name
        entry['normalSize'] = normal_size
    if spec is not None:
        specular_size = 512 if name == 'asphalt' else 256
        spec = np.asarray(Image.fromarray(np.clip(spec, 0, 255).astype(np.uint8)).resize((specular_size, specular_size), Image.Resampling.BILINEAR))
        spec_path = OUT / (name + '-specular.jpg')
        Image.fromarray(spec).save(spec_path, quality=85, optimize=True)
        entry['specularMap'] = spec_path.name
        entry['specularSize'] = specular_size
    MANIFEST[name] = entry


def crack_mask(n, seed, count, width=1):
    im = Image.new('L', (n, n))
    d = ImageDraw.Draw(im)
    r = np.random.default_rng(seed)
    for _ in range(count):
        x, y = r.integers(0, n, size=2)
        pts = [(int(x), int(y))]
        angle = r.random() * math.tau
        for __ in range(int(r.integers(10, 23))):
            angle += r.normal(0, .36)
            x += math.cos(angle) * r.uniform(5, 15)
            y += math.sin(angle) * r.uniform(5, 15)
            pts.append((int(x), int(y)))
        for ox in (-n, 0, n):
            for oy in (-n, 0, n):
                d.line([(x + ox, y + oy) for x, y in pts], fill=255, width=width)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(.5)), dtype=np.float32) / 255


def asphalt():
    n = 1024
    r = np.random.default_rng(371)
    macro = fractal(n, 50)
    aggregate = noise(n, 256, 44) - .5
    grain = r.normal(0, 1, (n, n))
    cracks = crack_mask(n, 16, 7, 2)
    patched = np.clip((noise(n, 4, 88) - .68) * 6, 0, 1)
    value = 144 + macro * 29 + aggregate * 29 + grain * 4.5 - cracks * 37 - patched * 13
    color = rgb(value, (.96, .985, 1))
    height = aggregate * .34 + grain * .035 - cracks * .28 + macro * .08
    spec = 83 - aggregate * 40 + patched * 48 - cracks * 26 + macro * 17
    save('asphalt', color, height, spec, 2.2)


def concrete():
    n = 512
    f = fractal(n, 36)
    pores = np.maximum(0, noise(n, 128, 270) - .70) * 50
    hair = crack_mask(n, 82, 3)
    v = 194 + f * 47 - pores - hair * 22
    save('concrete', rgb(v, (1, .99, .955)), f * .35 - pores * .025 - hair * .1, normal_strength=2.4)


def rock():
    n = 1024
    y, x = np.mgrid[0:n, 0:n] / n
    f = fractal(n, 100)
    bend = noise(n, 5, 177)
    strata = np.sin(math.tau * (y * 17 + bend * .8 + np.sin(x * math.tau * 2) * .25))
    fissure = np.clip((strata - .72) * 3, 0, 1)
    blocks = noise(n, 19, 273)
    chips = noise(n, 143, 87) - .5
    v = 168 + f * 85 + strata * 15 - fissure * 35 + chips * 14 + blocks * 12
    save('rock', rgb(v, (1, .96, .895)), f * .5 + strata * .11 - fissure * .23 + chips * .10, normal_strength=2.4)


def sand():
    n = 512
    y, x = np.mgrid[0:n, 0:n] / n
    f = fractal(n, 15)
    ripple = np.sin(math.tau * (y * 33 + np.sin(x * math.tau * 3) * .6 + noise(n, 5, 38) * 1.6))
    grain = noise(n, 175, 49) - .5
    v = 203 + f * 45 + ripple * 4 + grain * 10
    save('sand', rgb(v, (1, .94, .83)), ripple * .08 + grain * .12 + f * .18, normal_strength=2.3)


def grass():
    n = 512
    f = fractal(n, 610)
    grit = noise(n, 140, 93) - .5
    moss = noise(n, 13, 85)
    rgbv = rgb(160 + f * 57 + grit * 20, (.88, 1, .72)).astype(np.float32)
    dry = np.clip((moss - .58) * 4, 0, 1)
    rgbv[:, :, 0] += dry * 26
    rgbv[:, :, 2] += dry * 12
    save('grass', np.clip(rgbv, 0, 255).astype(np.uint8), f * .3 + grit * .18, normal_strength=1.7)


def facade():
    n = 512
    r = np.random.default_rng(188)
    im = Image.new('RGB', (n, n), '#6b7880')
    d = ImageDraw.Draw(im)
    for y in range(0, n, 64):
        for x in range(0, n, 64):
            lit = r.random() < .31
            shade = int(r.integers(60, 95))
            d.rectangle((x+3, y+3, x+60, y+60), fill=(shade, shade+5, shade+8))
            d.rectangle((x+7, y+7, x+56, y+55), fill=(27, 40, 49))
            base = (148, 142, 111) if lit else (47, 69, 85)
            for row in range(10, 53):
                delta = (53-row)*.23
                col = tuple(int(min(255, c+delta)) for c in base)
                d.line((x+10, y+row, x+53, y+row), fill=col)
            d.rectangle((x+30, y+8, x+33, y+55), fill='#8a9292')
            d.line((x+7, y+57, x+56, y+57), fill='#a7acad', width=2)
            d.line((x+8, y+7, x+56, y+7), fill='#374952')
            d.line((x+11, y+12, x+23, y+12), fill='#778f9a')
            if lit:
                d.line((x+11, y+28, x+53, y+28), fill='#776f5a')
                d.line((x+11, y+33, x+53, y+33), fill='#817860')
    a = np.asarray(im).astype(np.float32)
    a += fractal(n, 288)[:, :, None] * 13
    save('facade', np.clip(a, 0, 255).astype(np.uint8))


def container():
    n = 512
    y, x = np.mgrid[0:n, 0:n] / n
    wave = np.cos(x * math.tau * 16)
    rib = np.clip((wave - .1) * 2, 0, 1)
    f = fractal(n, 644)
    rust = np.clip((noise(n, 9, 15) + np.maximum(0, np.cos(y*math.tau))*.2 - .72)*5, 0, 1)
    v = 204 + rib * 25 + f * 19 - rust * 71
    a = rgb(v).astype(np.float32)
    a[:, :, 1] -= rust*16
    a[:, :, 2] -= rust*33
    edge = (np.abs(np.sin(y*math.pi)) < .025)
    a[edge] *= .66
    save('container', np.clip(a, 0, 255).astype(np.uint8), rib*.14 + f*.1, normal_strength=2.0)


def solar():
    n = 512
    r = np.random.default_rng(97)
    im = Image.new('RGB', (n, n), '#a0b3bb')
    d = ImageDraw.Draw(im)
    for y in range(0,n,64):
        for x in range(0,n,64):
            c = int(r.integers(0,12))
            d.rounded_rectangle((x+2,y+2,x+61,y+61),radius=5,fill=(32+c,59+c,86+c))
            for z in range(7,61,5):
                d.line((x+4,y+z,x+59,y+z),fill=(47+c,80+c,110+c))
            d.line((x+21,y+4,x+21,y+59),fill='#91a5b0')
            d.line((x+43,y+4,x+43,y+59),fill='#91a5b0')
    a=np.asarray(im).astype(np.float32)
    a += fractal(n, 944)[:, :, None]*7
    save('solar',np.clip(a,0,255).astype(np.uint8),spec=np.full((n,n),190.))


def paint():
    n=512
    f=fractal(n,911)
    grain=noise(n,214,104)-.5
    scratches=crack_mask(n,250,5,1)*.15
    v=244+f*5+grain*7-scratches*28
    save('paint',rgb(v),grain*.012-scratches*.012,spec=214+grain*30-scratches*90,normal_strength=1.0)


def rubber():
    n=512
    y,x=np.mgrid[0:n,0:n]/n
    f=fractal(n,311)
    zig=np.abs(np.sin(math.tau*(y*13+np.abs(x-.5)*7)))
    groove=np.clip((.32-zig)*8,0,1)
    vertical=np.maximum(np.clip((.06-np.abs(x-.28))*20,0,1),np.clip((.06-np.abs(x-.72))*20,0,1))
    groove=np.maximum(groove,vertical)
    v=143+f*27-groove*46
    save('rubber',rgb(v),-groove*.23+f*.08,normal_strength=2.0)


def lamp():
    n=512
    y,x=np.mgrid[0:n,0:n]/n
    rib=np.sin(x*math.tau*32)
    ridge=np.sin(y*math.tau*8)
    v=226+rib*14+ridge*6
    save('lamp',rgb(v),rib*.055+ridge*.02,spec=215+rib*25,normal_strength=1.7)


def fabric():
    n=512
    y,x=np.mgrid[0:n,0:n]
    weave=np.sin(x*math.tau/8)*np.sin(y*math.tau/8)
    f=fractal(n,217)
    save('fabric',rgb(192+weave*13+f*20),weave*.035,normal_strength=1.4)



def vehicle_atlas():
    """Pack four periodic surfaces with wrapped gutters for one vehicle shader.

    Color cells retain 496 x 496 useful texels. The matching linear maps retain
    248 x 248, and every channel uses identical normalized UV rectangles.
    Standalone source maps are intermediate bake outputs, not runtime assets.
    """
    names = ('paint', 'rubber', 'lamp', 'fabric')
    entry = {'size': 1024, 'normalSize': 512, 'specularSize': 512, 'rectangles': {}}
    for channel, suffix, size, gutter in (('map', 'color', 1024, 8), ('normalMap', 'normal', 512, 4), ('specularMap', 'specular', 512, 4)):
        tile = size // 2
        inner = tile - gutter * 2
        atlas = Image.new('RGB', (size, size))
        for index, name in enumerate(names):
            source = MANIFEST[name].get(channel)
            if source:
                image = Image.open(OUT / source).convert('RGB').resize((inner, inner), Image.Resampling.LANCZOS)
            else:
                image = Image.new('RGB', (inner, inner), (128, 128, 255) if channel == 'normalMap' else (255, 255, 255))
            # Wrapped gutters make repeated texture samples continuous at tile edges;
            # the shader wraps local UVs before mapping into these bounded rectangles.
            padded = np.pad(np.asarray(image), ((gutter, gutter), (gutter, gutter), (0, 0)), mode='wrap')
            col, row = index % 2, index // 2
            atlas.paste(Image.fromarray(padded), (col * tile, row * tile))
            entry['rectangles'][name] = [col * .5 + gutter / size, (1 - row) * .5 + gutter / size, inner / size, inner / size]
        path = OUT / ('vehicle-atlas-' + suffix + '.jpg')
        atlas.save(path, quality=92 if channel != 'map' else 90, subsampling=0, optimize=True)
        entry[channel] = path.name
    for name in names:
        original = MANIFEST.pop(name)
        for channel in ('map', 'normalMap', 'specularMap'):
            if channel in original:
                (OUT / original[channel]).unlink()
    MANIFEST['vehicleAtlas'] = entry


def foliage():
    """Pine silhouette with transparent air between original needle clusters."""
    n=512
    r=np.random.default_rng(82341)
    im=Image.new('RGBA',(n,n),(0,0,0,0))
    d=ImageDraw.Draw(im)
    d.polygon([(250,504),(261,504),(260,40),(255,8)],fill=(86,79,58,255))
    for layer in range(22):
        y=45+layer*18
        half=(y-20)*(.38+r.uniform(-.045,.045))
        for side in (-1,1):
            rootx=256
            tipx=rootx+side*half
            tipy=y+12+r.uniform(-10,10)
            d.line((rootx,y-14,tipx,tipy),fill=(64,78,49,255),width=3)
            for branch in range(8):
                t=(branch+1)/8
                cx=rootx+side*half*t
                cy=y-12+t*24
                spread=8+(1-t)*16
                for needle in range(13):
                    ox,oy=r.normal(0,spread/2),r.normal(0,4)
                    green=int(r.integers(65,125))
                    col=(int(green*.58),green,int(green*.68),255)
                    dx=side*r.uniform(4,14)
                    dy=r.uniform(-11,3)
                    d.line((cx+ox,cy+oy,cx+ox+dx,cy+oy+dy),fill=col,width=1 if r.random()<.75 else 2)
    # Transparent pixels carry foliage RGB to avoid dark mip fringes.
    a=np.asarray(im).copy()
    a[a[:,:,3]==0,:3]=[40,74,48]
    Image.fromarray(a).save(OUT/'foliage-color.png',optimize=True)
    MANIFEST['foliage']={'map':'foliage-color.png','size':n,'alpha':True}


if __name__ == '__main__':
    for make in (asphalt, concrete, rock, sand, grass, facade, container, solar, paint, rubber, lamp, fabric, foliage, vehicle_atlas):
        make()
    manifest_json = json.dumps(MANIFEST, indent=2)
    (OUT/'manifest.json').write_text(manifest_json+'\n')
    library = OUT.parent / 'materials.js'
    if library.exists():
        source = library.read_text()
        begin, end = '/* material-definitions:start */', '/* material-definitions:end */'
        assert source.count(begin) == source.count(end) == 1, 'Missing material manifest boundaries'
        before, rest = source.split(begin, 1)
        _, after = rest.split(end, 1)
        library.write_text(before + begin + '\nvar DEFINITIONS=' + manifest_json + ';\n' + end + after)
    total=0
    for p in sorted(OUT.iterdir()):
        if p.suffix in ('.jpg','.png'):
            im=Image.open(p)
            assert im.width==im.height and im.width & (im.width-1)==0
            total+=p.stat().st_size
    print(json.dumps({'materials':len(MANIFEST),'bytes':total,'files':sum(1 for p in OUT.iterdir() if p.suffix in ('.jpg','.png'))},indent=2))
