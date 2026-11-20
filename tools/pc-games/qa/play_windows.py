"""Open two original signed games through the Windows launcher and exercise their actual rules."""
import argparse
import hashlib
import http.server
import json
import os
from pathlib import Path
import platform
import socket
import subprocess
import sys
import threading
import time
from urllib.request import urlopen
from zipfile import ZipFile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT / 'joystick-games/qa/controller-input'))
from sdk import MeasuredClient

GAMES = ['ponpoko-kart','emberbrood']
KEYS = {'A':'Numpad1','B':'Numpad3','START':'Numpad5','RIGHT':'Numpad6','UP':'Numpad8','DOWN':'Numpad2'}
SNAP = 'window.JoystickGameQA?.snapshot?.()'
SCRATCH = Path(os.environ['RUNNER_TEMP'])
FILES = SCRATCH / 'sample-files'
RESULTS = SCRATCH / 'sample-results'
CATALOG = ROOT / 'tools/pc-games/catalog.json'
PORT = 63721


def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f,'sha256').hexdigest()


def prepare():
    FILES.mkdir(exist_ok=True)
    original=json.loads(CATALOG.read_text(encoding='utf-8'))
    rows=[g for g in original if g['id'] in GAMES]
    assert len(rows)==2
    for game in rows:
        slug=game['id']
        package=FILES/(slug+'.apk')
        with ZipFile(package) as z:
            meta=json.loads(z.read('assets/game-config.json'))
            tvhash=hashlib.sha256(z.read('assets/tv.html')).hexdigest()
        expected='0.1.2' if slug=='emberbrood' else '0.1.6'
        assert meta['id']==slug and meta['version']==expected,meta
        if slug=='emberbrood':
            assert tvhash=='8a62186c1b00bef9a197ef7ec221e884a66f2d5ffb688ddd28d7b06f578328cd'
        else:
            assert sha(package)=='23caf1f988765a8f074120046b626055e7a7cf76dbb3a12ae1c6840961baaf74'
        game.update(url=f'http://127.0.0.1:{PORT}/{slug}.apk',bytes=package.stat().st_size,sha256=sha(package))
    CATALOG.write_text(json.dumps(rows,ensure_ascii=False),encoding='utf-8')


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0))
        return sock.getsockname()[1]


def snapshot(page):
    return page.evaluate(f"""() => {{const s={SNAP},g=s.gameplay;
       const keep=['screen','mode','course','character','tick','playerX','playerZ','speed','progress','lap','position','seed','rosterCount','overlay','node','steps','focus'];
       return {{stage:s.stage,frames:s.frames,polls:s.controller.pollCount,renderer:s.renderer,
                gameplay:Object.fromEntries(keep.filter(k=>k in g).map(k=>[k,g[k]]))}};}}""")


def wait(page, expr):
    page.wait_for_function(f"() => {{const s={SNAP};return s && ({expr});}}",timeout=240_000)


def key(page, key, client=None, effect=None):
    if client:
        client.button(key,'down')
    else:
        page.keyboard.down(KEYS[key])
    wait(page,f"s.controller.buttons.{key} === true")
    if effect:
        wait(page,effect)
    if client:
        client.button(key,'tap',150)
    else:
        page.keyboard.up(KEYS[key])
    wait(page,f"s.controller.buttons.{key} === false")


def play(page,client,slug,out):
    wait(page,"s.stage === 'menu' && s.controller.pollCount >= 4")
    out['menu']=snapshot(page)
    client.connect()
    wait(page,"s.controller.connected === true")
    identity=page.locator('[data-puretv-controller-id-text]').first
    assert identity.is_visible() and client.identity in identity.inner_text()
    out['controllerId']=client.identity
    if slug=='ponpoko-kart':
        key(page,'START',effect="s.gameplay.screen === 'chars'")
        key(page,'RIGHT')
        key(page,'A',effect="s.gameplay.screen === 'course'")
        key(page,'START',client,effect="s.stage === 'playing'")
        key(page,'A',client)
        wait(page,"s.gameplay.mode === 'racing'")
        out['beforeDrive']=snapshot(page)
        prior=out['beforeDrive']['gameplay']
        key(page,'UP',client,effect=f"s.gameplay.speed > 2 && Math.abs(s.gameplay.progress - {prior['progress']}) > .5")
        out['afterDrive']=snapshot(page)
        assert out['afterDrive']['frames']>out['beforeDrive']['frames']
        assert out['afterDrive']['gameplay']['course'] and out['afterDrive']['gameplay']['character']
    else:
        key(page,'DOWN',client)
        field=page.locator('input[aria-label="World seed"]')
        assert field.evaluate('el=>el===document.activeElement')
        page.keyboard.type('amber123',delay=45)
        assert field.input_value()=='amber123'
        out['typedWorldSeed']=field.input_value()
        page.keyboard.press('ArrowUp')
        wait(page,"s.gameplay.focus === 'New game'")
        key(page,'A',effect='s.gameplay.rosterCount === 1')
        out['createdWorld']=snapshot(page)
        count=0
        while page.evaluate(f'{SNAP}.gameplay.overlay') and count<15:
            key(page,'A',client)
            count+=1
        assert count>0 and not page.evaluate(f'{SNAP}.gameplay.overlay')
        key(page,'B',client,effect="s.gameplay.screen === 'map'")
        out['beforeTravel']=snapshot(page)
        for _ in range(3):
            key(page,'DOWN',client)
        key(page,'A',client,effect="s.gameplay.node === 'lowfields'")
        out['afterTravel']=snapshot(page)
        assert out['afterTravel']['gameplay']['steps']>out['beforeTravel']['gameplay']['steps']
        assert out['afterTravel']['frames']>out['beforeTravel']['frames']
    page.screenshot(path=str(RESULTS/(slug+'.png')))
    out['gameplayScreenshotSha256']=sha(RESULTS/(slug+'.png'))
    out['acknowledged']=client.acknowledged()
    client.disconnect()
    wait(page,"!s.controller.connected")
    out['disconnectStage']=snapshot(page)['stage']


def run_game(exe,browser,game):
    slug=game['id']
    result={'id':slug,'windows':platform.platform(),'machine':platform.machine(),'edge':browser.version,'exeSha256':sha(exe),'signedApkSha256':game['sha256']}
    with ZipFile(FILES/(slug+'.apk')) as z:
        result['tvSha256']=hashlib.sha256(z.read('assets/tv.html')).hexdigest()
        result['version']=json.loads(z.read('assets/game-config.json'))['version']
    cache=SCRATCH/('fresh-cache-'+slug)
    http_port,control=free_port(),free_port()
    assert http_port!=control
    log=(RESULTS/(slug+'.log')).open('w',encoding='utf-8')
    child=subprocess.Popen([exe,slug,'--cache',cache,'--http-port',str(http_port),'--controller-port',str(control),'--language','en','--no-browser'],stdout=log,stderr=log)
    page=None;client=None
    try:
        url=f'http://127.0.0.1:{http_port}/tv.html'
        deadline=time.monotonic()+110
        while time.monotonic()<deadline:
            if child.poll() is not None: raise RuntimeError('Launcher exited '+str(child.returncode))
            try:
                with urlopen(url,timeout=2) as resp:break
            except OSError:time.sleep(.25)
        else:raise RuntimeError('Launcher did not serve tv.html')
        cached=list(cache.glob('*.apk'))
        assert len(cached)==1 and sha(cached[0])==game['sha256']
        result['cacheVerified']=True
        page=browser.new_page(viewport={'width':960,'height':540})
        page.goto(url,wait_until='commit')
        client=MeasuredClient(control)
        play(page,client,slug,result)
        result['passed']=True
    except Exception as exc:
        result['passed']=False;result['error']=str(exc)[:1000]
        if page:
            try:result['lastSnapshot']=snapshot(page);page.screenshot(path=str(RESULTS/(slug+'-last.png')),timeout=12000)
            except Exception as e:result['lastError']=str(e)[:400]
    finally:
        if client:client.disconnect()
        if page:page.close()
        if child.poll() is None:subprocess.run(['taskkill','/PID',str(child.pid),'/T','/F'],stdout=subprocess.DEVNULL)
        child.wait(timeout=30);log.close()
    (RESULTS/(slug+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(slug,result['passed'],result.get('error',''),flush=True)
    return result['passed']


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--prepare',action='store_true');ap.add_argument('--exe',type=Path);args=ap.parse_args()
    if args.prepare: prepare();return 0
    RESULTS.mkdir(exist_ok=True)
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw):super().__init__(*a,directory=FILES,**kw)
    with http.server.ThreadingHTTPServer(('127.0.0.1',PORT),Handler) as server:
        worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
        try:
            with sync_playwright() as pw:
                browser=pw.chromium.launch(channel='msedge',args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding'])
                try:
                    passed=[run_game(args.exe.resolve(),browser,g) for g in json.loads(CATALOG.read_text(encoding='utf-8'))]
                finally:browser.close()
        finally:server.shutdown();worker.join()
    return 0 if all(passed) else 1


if __name__=='__main__':raise SystemExit(main())
