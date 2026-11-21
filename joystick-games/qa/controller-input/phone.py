"""Decode a visible game-menu QR and move the real phone controller in every selected title."""
import argparse
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tempfile
import time
from zipfile import ZipFile

from playwright.sync_api import sync_playwright
from android import BRIDGE, SNAP, digest, touch
from sdk import ROOT, wait_for


def copy_assets(archive, target):
    with ZipFile(archive) as packed:
        for name in packed.namelist():
            path = PurePosixPath(name)
            if name.endswith('/') or not path.parts or path.parts[0] != 'assets': continue
            if '..' in path.parts or '\\' in name: raise ValueError(f'Invalid asset: {name}')
            dest = target.joinpath(*path.parts[1:])
            dest.parent.mkdir(parents=True, exist_ok=True)
            with packed.open(name) as src, dest.open('wb') as out: shutil.copyfileobj(src, out)
    config = json.loads((target/'game-config.json').read_text())
    assert config['phoneControllerButtons'] == 9
    return config['id']


def summary(page):
    return page.evaluate(f"""() => {{const s={SNAP}, g=s?.gameplay || {{}}, a=document.activeElement;
      return {{stage:s?.stage, screen:g.screen || g.phase || null, frames:s?.frames || null,
               active:a?.id || a?.textContent?.trim().slice(0,60) || null, polls:s?.controller?.pollCount}};}}""")


def verify(browser, mobile_browser, java, slug, packed, output, timeout, gameplay=None):
    start = time.monotonic()
    report = {'game':slug, 'payloadSha256':digest(packed), 'browser':browser.version}
    phase = 'extract'
    with tempfile.TemporaryDirectory() as tmp:
        assets = Path(tmp)
        assert copy_assets(packed, assets) == slug
        report['tvSha256'] = digest(assets/'tv.html')
        host = subprocess.Popen([*java, str(assets)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        tv = phone = None
        try:
            info = json.loads(host.stdout.readline())
            phase = 'visible game and QR'
            tv = browser.new_page(viewport={'width':960,'height':540})
            tv.set_default_timeout(timeout * 1000)
            tv.add_init_script(BRIDGE)
            tv.goto(info['tv'], wait_until='commit')
            wait_for(tv, f"() => {{const s={SNAP};return s?.controller?.pollCount > 2 && !s.webglError && !['loading','boot','error'].includes(s.stage);}}", timeout)
            qr = tv.locator('.ptv-phone img')
            qr.wait_for(state='visible')
            shot = output / (slug + '-menu.png')
            deadline = time.monotonic() + timeout
            attempts = 0
            while True:
                rect = qr.evaluate("""e=>{const r=e.getBoundingClientRect(),x=Math.floor(r.left),y=Math.floor(r.top);
                  return [x,y,Math.ceil(r.right)-x,Math.ceil(r.bottom)-y];}""")
                x, y, width, height = rect
                assert min(x, y) >= 0 and x + width <= 960 and y + height <= 540, rect
                tv.screenshot(path=str(shot), timeout=timeout * 1000)
                attempts += 1
                scan = subprocess.run(
                    [*java, 'decode', str(shot), *map(str, rect)],
                    capture_output=True, text=True, timeout=12)
                if scan.returncode == 0:
                    room = scan.stdout.strip()
                    assert room == info['room'], 'Displayed QR points to a different room'
                    break
                # A game can start polling before its opaque startup curtain actually disappears.
                if time.monotonic() >= deadline:
                    raise AssertionError(f'No readable QR in the rendered menu after {attempts} screenshots')
                time.sleep(1)
            report.update(qrRect=rect, qrScreenshots=attempts, screenshotSha256=digest(shot), menu=summary(tv))
            phase = 'phone room'
            phone = mobile_browser.new_page(viewport={'width':800,'height':450}, locale='zh-CN', has_touch=True)
            phone.set_default_timeout(timeout*1000)
            phone.goto(room,wait_until='commit')
            phone.get_by_text('已连接 · 看着电视玩',exact=True).wait_for()
            wait_for(tv, f"{SNAP}?.controller?.transport === 'phone'", timeout)
            cdp = phone.context.new_cdp_session(phone)
            if gameplay:
                phase = 'phone gameplay'

                def press(key, hold_ms=0, while_held=None):
                    touch(phone, cdp, key, tv, timeout, hold_ms, while_held)

                report['gameplay'] = gameplay(slug, tv, press, lambda: tv.evaluate(SNAP))
                gameplay_shot = output / (slug + '-gameplay.png')
                tv.screenshot(path=str(gameplay_shot))
                report['gameplayScreenshotSha256'] = digest(gameplay_shot)
            phase = 'touch and release'
            touch(phone, cdp, 'DOWN', tv, timeout)
            report.update(touch='DOWN', afterTouch=summary(tv))
            phone.close();phone=None
            wait_for(tv, f"{SNAP}?.controller?.connected === false && {SNAP}?.controller?.buttons?.DOWN === false", timeout)
            report.update(disconnectReleased=True, passed=True)
        except Exception as error:
            report.update(passed=False, phase=phase, error=str(error).splitlines()[0] if str(error) else type(error).__name__)
        finally:
            if phone: phone.close()
            if tv: tv.close()
            host.stdin.close()
            try:host.wait(timeout=8)
            except subprocess.TimeoutExpired:host.kill();host.wait()
    report['seconds'] = round(time.monotonic()-start,1)
    return report


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--gameplay-module', type=Path, help='Python file defining run_gameplay(slug, tv, touch, snapshot)')
    p.add_argument('--payloads',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--source',type=Path,default=ROOT)
    p.add_argument('--android-json',type=Path,required=True)
    p.add_argument('--zxing',type=Path,required=True)
    p.add_argument('--chromium',default='/usr/bin/chromium')
    p.add_argument('--timeout',type=int,default=240)
    p.add_argument('games',nargs='+')
    args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    gameplay = None
    if args.gameplay_module:
        spec = importlib.util.spec_from_file_location('phone_gameplay', args.gameplay_module)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        gameplay = module.run_gameplay
    servers=args.source/'resource/game-kit/android/src/main/java/com/ecojust/gamekit'
    with tempfile.TemporaryDirectory() as tmp:
        jars=os.pathsep.join(str(j.resolve()) for j in (args.android_json,args.zxing))
        subprocess.run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-cp',jars,'-d',tmp,
                        Path(__file__).with_name('Host.java'),servers/'LanGameServer.java',servers/'WifiControllerServer.java'],check=True)
        java=['java','-XX:ActiveProcessorCount=2','-cp',tmp+os.pathsep+jars,'Host']
        with sync_playwright() as pw:
            flags=['--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding']
            tv=pw.chromium.launch(executable_path=args.chromium,args=flags,timeout=180000)
            phone=pw.chromium.launch(executable_path=args.chromium,args=flags,timeout=180000)
            success=True
            for slug in args.games:
                result=verify(tv,phone,java,slug,args.payloads/(slug+'.zip'),args.output,args.timeout,gameplay)
                (args.output/(slug+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
                print(slug,result['passed'],result.get('phase',''),result.get('error',''),flush=True)
                success=success and result['passed']
            phone.close();tv.close()
        return int(not success)


if __name__=='__main__': raise SystemExit(main())
