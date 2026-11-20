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
EXE_URL = BASE + 'catalog-player-v1.0.1/pureTV-Games.exe'
APK_URL = BASE + 'catalog-tv-controls-v1.0.1/emberbrood-0.1.2.apk'
EXE_SHA = '1332f7b2718511ce7faaec9e80d2869390ede0e38b4ee782ddd8f215379671dd'
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
    assert out['exeSha256']==EXE_SHA and out['exeBytes']==14592984
    # Read the actual public EXE's bundled catalogue, without modifying its contents.
    catalog_bytes=CArchiveReader(str(exe)).extract('catalog.json')
    out['bundledCatalogSha256']=hashlib.sha256(catalog_bytes).hexdigest()
    assert out['bundledCatalogSha256']=='0cc16bd7813f60c2067e5b15a1e89c40037226ce6e5e41ad00e63717c1f361ef'
    bundled=json.loads(catalog_bytes)
    assert len(bundled)==len({row['id'] for row in bundled})==35
    current,=[row for row in bundled if row['id']=='used-car-racing']
    assert current['url'].endswith('/used-car-racing-0.1.7.apk') and current['sha256']=='1b0879c9ae8ac10188ea34e9694dbc9527048ee76e10d735a61aa24da53bd9e7'
    out['currentUsedCarEntry']=current
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
