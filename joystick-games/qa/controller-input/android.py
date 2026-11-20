"""Exercise the packaged Sugarplum Drop page and the actual Android LAN/TCP servers on a JVM."""
import argparse
import hashlib
import json
import platform
from pathlib import Path
import subprocess
import tempfile
from zipfile import ZipFile

from playwright.sync_api import sync_playwright
from sdk import MeasuredClient, ROOT, wait_for

# Match the two synchronous calls used by Game Kit's Android WebView. This
# fixture forwards each call to the live Java objects, without generating input.
BRIDGE = """{
 const read = path => { const x = new XMLHttpRequest(); x.open('GET', path, false); x.send(); return x.responseText; };
 window.PureGameHost = {getInfo: () => read('/room'), snapshot: () => read('/frame')};
}"""
SNAP = 'window.JoystickGameQA?.snapshot()'
KEYPAD = {'UP': 'Numpad8', 'DOWN': 'Numpad2', 'LEFT': 'Numpad4', 'RIGHT': 'Numpad6',
          'START': 'Numpad5', 'A': 'Numpad1', 'B': 'Numpad3', 'X': 'Numpad7', 'Y': 'Numpad9'}
GEOMETRY = """() => {
 const box = el => {const r = el.getBoundingClientRect(); return [r.x,r.y,r.width,r.height];};
 const panel = document.getElementById('puretv-controller-panel');
 return {canvas:box(document.querySelector('canvas')), badge:box(panel.querySelector('.ptv-client-card') || panel.querySelector('.ptv-status')),
         pointer:getComputedStyle(panel).pointerEvents, qr:!panel.querySelector('.ptv-phone').hidden,
         help:getComputedStyle(document.getElementById('tv-controls')).display};
}"""


def digest(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def held(tv, key, down, timeout=75):
    wait_for(tv, f'{SNAP}?.controller?.buttons?.{key} === {str(down).lower()}', timeout)


def touch(phone, cdp, key, tv, timeout=75):
    axes = {'UP': (0, -50), 'DOWN': (0, 50), 'LEFT': (-50, 0), 'RIGHT': (50, 0)}
    control = 'stick-zone' if key in axes else {'A':'a', 'B':'b', 'X':'buttonX', 'Y':'buttonY', 'START':'start'}[key]
    rect = phone.locator('#' + control).bounding_box()
    x, y = rect['x'] + rect['width']/2, rect['y'] + rect['height']/2
    def send(kind, points):
        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': points})
    send('touchStart', [{'x':x, 'y':y}])
    if key in axes:
        dx,dy=axes[key];send('touchMove', [{'x':x+dx, 'y':y+dy}])
    held(tv, key, True, timeout)
    send('touchEnd', [])
    held(tv, key, False, timeout)


def verify(args, assets, java, report):
    host = subprocess.Popen([*java, str(assets)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    try:
        info = json.loads(host.stdout.readline())
        with sync_playwright() as pw:
            flags = ['--disable-dev-shm-usage', '--disable-background-timer-throttling',
                     '--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']
            browser = pw.chromium.launch(executable_path=args.chromium, args=flags, timeout=180_000)
            report['browser'] = browser.version
            tv = browser.new_page(viewport={'width':960,'height':540})
            tv.set_default_timeout(75_000)
            tv.add_init_script(BRIDGE)
            tv.goto(info['tv'])
            tv.wait_for_function(f"{SNAP}?.stage === 'menu'")
            for w,h in [(960,540),(1280,720)]:
                tv.set_viewport_size({'width':w,'height':h})
                qr = args.output / f'qr-{w}.png'
                tv.locator('.ptv-phone img').screenshot(path=str(qr))
                url = subprocess.check_output([*java, 'decode', str(qr)],text=True).strip()
                assert url == info['room']
            report['decodedRoomAt'] = [[960,540],[1280,720]]
            mobile = pw.chromium.launch(executable_path=args.chromium, args=flags, timeout=180_000)
            phone = mobile.new_page(viewport={'width':800,'height':450},locale='zh-CN',has_touch=True)
            phone.goto(url)
            phone.get_by_text('已连接 · 看着电视玩',exact=True).wait_for()
            tv.wait_for_function(f"{SNAP}.controller.transport === 'phone'")
            cdp = phone.context.new_cdp_session(phone)
            print('Decoded room and joined original WebSocket service', flush=True)
            touch(phone, cdp, 'START', tv)
            tv.wait_for_function(f"{SNAP}.stage === 'playing'")
            report['phonePlaying'] = tv.evaluate(GEOMETRY)
            tv.screenshot(path=str(args.output/'phone-playing.png'))
            for key in KEYPAD:
                if key != 'START': touch(phone, cdp, key, tv)
            report['phoneTouchKeys'] = list(KEYPAD)
            if tv.evaluate(f'{SNAP}.paused'): touch(phone, cdp, 'START', tv)
            tv.wait_for_function(f"{SNAP}.stage === 'playing'")
            phone.close()
            tv.wait_for_function(f"{SNAP}.paused === true")
            report['phoneDisconnectPaused'] = True
            print('All nine touch inputs and disconnect pause reached gameplay', flush=True)
            mobile.close()
            client = MeasuredClient(info['wifi'])
            client.connect()
            try:
                tv.wait_for_function(f"{SNAP}.controller.transport === 'wifi'")
                client.button('START','down'); held(tv,'START',True)
                client.button('START','tap',90); held(tv,'START',False)
                tv.wait_for_function(f"{SNAP}.stage === 'playing'")
                report['tcpPlaying'] = {}
                for w,h in [(960,540),(1280,720)]:
                    tv.set_viewport_size({'width':w,'height':h})
                    tv.wait_for_function(f"document.querySelector('canvas').getBoundingClientRect().width === {w}")
                    assert client.identity in tv.locator('[data-puretv-controller-id-text]').inner_text()
                    g = tv.evaluate(GEOMETRY)
                    assert g['canvas'] == [0,0,w,h] and g['pointer'] == 'none' and not g['qr'] and g['help'] == 'none'
                    report['tcpPlaying'][f'{w}x{h}'] = g
                    tv.screenshot(path=str(args.output/f'sdk-playing-{w}.png'))
                for key in KEYPAD:
                    client.button(key,'down'); held(tv,key,True)
                    client.button(key,'tap',100); held(tv,key,False)
                report.update(tcpKeys=list(KEYPAD), tcpAcknowledged=client.acknowledged(), tcpControllerId=client.identity)
                print('SDK acknowledgements:', report['tcpAcknowledged'], flush=True)
            finally: client.disconnect()
            tv.wait_for_function(f"{SNAP}.controller.connected === false")
            for key, code in KEYPAD.items():
                tv.keyboard.down(code); held(tv,key,True)
                tv.keyboard.up(code); held(tv,key,False)
            report['keyboardKeys'] = list(KEYPAD)
            browser.close()
    finally:
        host.stdin.close()
        host.wait(timeout=10)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--payload',type=Path,required=True,help='APK or ZIP containing the original assets/ files')
    p.add_argument('--source',type=Path,default=ROOT,help='checkout containing the Game Kit Java sources')
    p.add_argument('--android-json',type=Path,required=True)
    p.add_argument('--zxing',type=Path,required=True)
    p.add_argument('--chromium',default='/usr/bin/chromium')
    p.add_argument('--output',type=Path,required=True)
    args=p.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report={'scope':'Linux JVM Game Kit LAN and TCP servers, matched SDK, Chromium TV and touch-emulated phone. No installed native package or physical device.',
            'game':'sugarplum-drop','system':platform.platform(), 'payloadSha256':digest(args.payload)}
    java_root=args.source/'resource/game-kit/android/src/main/java/com/ecojust/gamekit'
    java_sources=[java_root/n for n in ('LanGameServer.java','WifiControllerServer.java')]
    report['serverSha256'] = {f.name:digest(f) for f in java_sources}
    report['dependenciesSha256'] = {'androidJson':digest(args.android_json), 'zxing':digest(args.zxing)}
    report['java'] = subprocess.check_output(['java','-version'], stderr=subprocess.STDOUT, text=True).splitlines()[0]
    with tempfile.TemporaryDirectory() as temp:
        work=Path(temp);assets=work/'assets';assets.mkdir()
        with ZipFile(args.payload) as apk:
            for name in ('tv.html','controller.html','controller.js','controller.css','game-config.json'):
                (assets/name).write_bytes(apk.read('assets/'+name))
        assert json.loads((assets/'game-config.json').read_text())['phoneControllerButtons']==9
        report['tvSha256']=digest(assets/'tv.html')
        jars=str(args.android_json.resolve())+':'+str(args.zxing.resolve())
        subprocess.run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-cp',jars,'-d',str(work),
                        str(Path(__file__).with_name('Host.java')),*java_sources],check=True)
        java=['java','-XX:ActiveProcessorCount=2','-cp',str(work)+':'+jars,'Host']
        verify(args,assets,java,report)
    (args.output/'android.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':
    main()
