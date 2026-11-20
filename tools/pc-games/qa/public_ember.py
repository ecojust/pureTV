"""Play the publicly released Windows executable with its embedded catalog and an empty cache."""
import hashlib
import json
import os
import platform
from pathlib import Path
import subprocess
import time
from urllib.request import Request, urlopen
from zipfile import ZipFile
from PyInstaller.archive.readers import CArchiveReader
from playwright.sync_api import sync_playwright
from play_windows import MeasuredClient, RESULTS, free_port, play, sha, snapshot

BASE = 'https://github.com/ecojust/pureTV/releases/download/'
EXE_URL = BASE + 'catalog-player-v1.0.0/pureTV-Games.exe'
APK_URL = BASE + 'catalog-tv-controls-v1.0.0/emberbrood-0.1.2.apk'
EXE_SHA = '497c19b73c9512f69c9412e7341032c86398fdadac9c7f57dc7fb45143c8344f'
APK_SHA = 'c25db32d6e6a021547a5925d5afbb2a403e49f8c90699f7327fce227ed258ed0'
TV_SHA = '8a62186c1b00bef9a197ef7ec221e884a66f2d5ffb688ddd28d7b06f578328cd'


def download(url, dest):
    request=Request(url,headers={'User-Agent':'pureTV-public-Windows-check','Accept-Encoding':'identity'})
    for attempt in range(3):
        try:
            with urlopen(request,timeout=90) as response, dest.open('wb') as out:
                assert response.status==200
                for block in iter(lambda:response.read(512*1024),b''):
                    out.write(block)
            return
        except OSError:
            if attempt==2:
                raise
            time.sleep(2*(attempt+1))


def check(out):
    root=Path(os.environ['RUNNER_TEMP'])/'public-player-smoke'
    root.mkdir()
    exe=root/'pureTV-Games.exe'
    download(EXE_URL,exe)
    out.update(exeUrl=EXE_URL,exeBytes=exe.stat().st_size,exeSha256=sha(exe))
    assert out['exeSha256']==EXE_SHA and out['exeBytes']==14593317
    # Read the actual public EXE's bundled catalogue, without modifying its contents.
    bundled=json.loads(CArchiveReader(str(exe)).extract('catalog.json'))
    game,=[row for row in bundled if row['id']=='emberbrood']
    assert game['url']==APK_URL and game['sha256']==APK_SHA and game['bytes']==369719
    out.update(bundledCatalogEntry=game,bundledGameCount=len(bundled))
    cache=root/'cache'
    assert not cache.exists()
    out['emptyOnStart']=True
    web,port=free_port(),free_port()
    while web==port:
        port=free_port()
    url=f'http://127.0.0.1:{web}/tv.html'
    with (RESULTS/'launcher.log').open('w',encoding='utf-8') as log:
        proc=subprocess.Popen([exe,'emberbrood','--http-port',str(web),'--controller-port',str(port),'--cache',cache,'--no-browser','--language','en'],stdout=log,stderr=log)
        client=None
        try:
            deadline=time.monotonic()+150
            while time.monotonic()<deadline:
                if proc.poll() is not None:
                    raise RuntimeError('Public launcher exited '+str(proc.returncode))
                try:
                    with urlopen(url,timeout=3) as response:
                        served=hashlib.sha256(response.read()).hexdigest()
                    break
                except OSError:
                    time.sleep(.4)
            else:raise TimeoutError('Public launcher did not serve the game')
            original,=cache.glob('*.apk')
            digest=sha(original)
            assert digest==APK_SHA and original.stat().st_size==369719
            with ZipFile(original) as z:
                tv=hashlib.sha256(z.read('assets/tv.html')).hexdigest()
                config=json.loads(z.read('assets/game-config.json'))
            assert config['id']=='emberbrood' and config['version']=='0.1.2' and tv==TV_SHA
            out.update(cachedApkName=original.name,cachedApkBytes=original.stat().st_size,
                       cachedApkSha256=digest,version=config['version'],originalTvSha256=tv,
                       servedTvWithDesktopBridgeSha256=served)
            with sync_playwright() as pw:
                browser=pw.chromium.launch(channel='msedge',args=['--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding'])
                try:
                    out['edge']=browser.version
                    page=browser.new_page(viewport={'width':960,'height':540})
                    page.goto(url,wait_until='commit')
                    client=MeasuredClient(port)
                    try:play(page,client,'emberbrood',out)
                    except Exception:
                        try:
                            out['lastSnapshot']=snapshot(page)
                            page.screenshot(path=str(RESULTS/'last.png'),timeout=8000)
                        except Exception:pass
                        raise
                finally:browser.close()
        finally:
            if client:client.disconnect()
            if proc.poll() is None:
                subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],stdout=subprocess.DEVNULL,check=False)
            proc.wait(timeout=30)


def main():
    RESULTS.mkdir(parents=True,exist_ok=True)
    result={'windows':platform.platform(),'architecture':platform.machine(),'game':'emberbrood'}
    try:
        check(result)
        assert result['afterTravel']['gameplay']['node']=='lowfields' and result['disconnectStage']=='paused'
        result['passed']=True
    except Exception as error:
        result.update(passed=False,error=f'{type(error).__name__}: {str(error)[:1500]}')
        raise
    finally:
        (RESULTS/'public-emberbrood.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':main()
