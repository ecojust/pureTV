"""Play the public portable ZIP against its unchanged public Tetris catalog entry."""
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import tempfile

from playwright.sync_api import sync_playwright

ROOT = Path.cwd()
sys.path.insert(0, str(ROOT / 'tools/pc-games'))
from smoke import wait_for
from verify_resource_inputs import expect_seat, pad

ZIP = ROOT / 'download/pureTV-Games-portable.zip'
PLAYER = ROOT / 'download/player'
OUT = ROOT / 'desktop-evidence'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
URL = 'https://github.com/ecojust/pureTV/releases/download/catalog-player-v1.0.0/pureTV-Games-portable.zip'
APK = 'https://raw.githubusercontent.com/ecojust/pureTV/7f5adc1d00668aa4b79ca012d4e9a49b31bec4f4/packages/tetris/tetris-0.5.7.apk'
SHA = '5d0dd8a2ecbe54047f27c0d6f1a6794cc1e57f67b3b77bdee624d455f34a04a8'
ZIP_SHA = 'c934ec300a27698d0bcae291cdc67bc228f8b17df01a26d351e57b55e93b7c3d'
def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

assert platform.machine()=='arm64'
assert ZIP.stat().st_size==40833 and digest(ZIP)==ZIP_SHA
entries=json.loads((PLAYER/'catalog.json').read_text())
entry=next(x for x in entries if x['id']=='tetris')
assert len(entries)==35 and entry['url']==APK and entry['sha256']==SHA and entry['bytes']==95679
OUT.mkdir(exist_ok=True)
report=dict(runner='macos-15',machine=platform.machine(),macOS=platform.mac_ver()[0],
            chrome=subprocess.check_output([CHROME,'--version'],text=True).strip(),
            qaCommit=os.environ['GITHUB_SHA'],playerUrl=URL,playerBytes=ZIP.stat().st_size,
            playerSha256=digest(ZIP), catalogEntries=len(entries), game='tetris', version='0.5.7',
            apkUrl=APK, catalogSha256=digest(PLAYER/'catalog.json'),checks={})
def record():
    (OUT/'results.json').write_text(json.dumps(report,indent=2)+'\n')
record()
with tempfile.TemporaryDirectory() as tmp:
    cache=Path(tmp)
    assert list(cache.iterdir())==[]
    cmd=[sys.executable,'-u',str(PLAYER/'launcher.py'),'tetris','--cache',str(cache),'--language','en',
         '--http-port','0','--controller-port','0','--no-browser']
    child=subprocess.Popen(cmd,stdout=subprocess.PIPE,text=True)
    try:
        for line in child.stdout:
            print(line, end='', flush=True)
            if line.startswith('Game: '):
                url=line.split()[1]
                break
        else:
            raise RuntimeError(f'player exited before startup ({child.poll()})')
        line=child.stdout.readline()
        print(line,end='',flush=True)
        assert line.startswith('Controller: TCP ')
        port=int(line.split()[2])
        files=list(cache.iterdir()); assert len(files)==1
        cached=files[0]
        assert digest(cached)==SHA and cached.stat().st_size==entry['bytes']
        assert cached.name=='tetris-'+SHA[:16]+'.apk'
        report.update(cachedFilename=cached.name,cachedApkSha256=digest(cached),cachedApkBytes=cached.stat().st_size)
        report['checks']['freshEmptyCache']=True
        record()
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=CHROME)
            page=browser.new_page(viewport={'width':1280,'height':720})
            phase='window.PureTVQA?.snapshot().phase'
            px='window.PureTVQA.snapshot().players[0].piece?.x'
            page.goto(url,wait_until='domcontentloaded')
            wait_for(page,'() => '+phase+' === "title"')
            page.keyboard.press('Enter',delay=100)
            wait_for(page,'() => '+phase+' === "playing"')
            x0=page.evaluate('() => '+px)
            page.keyboard.down('ArrowLeft')
            try:
                wait_for(page,'x => '+px+' < x',x0)
                x1=page.evaluate('() => '+px)
            finally:
                page.keyboard.up('ArrowLeft')
            assert x1 < x0
            report['checks']['keyboard']={'transition':['title','playing'],'key':'ArrowLeft','pieceX':[x0,x1]}
            record()
            page.screenshot(path=OUT/'keyboard.png')
            page.reload(wait_until='domcontentloaded')
            wait_for(page,'() => '+phase+' === "title"')
            with pad(port) as client:
                expect_seat(page,client,1)
                client.button('START','down')
                try:
                    wait_for(page,'() => '+phase+' === "playing"')
                finally:
                    client.button('START','up')
                x0=page.evaluate('() => '+px)
                client.button('RIGHT','down')
                try:
                    wait_for(page,'x => '+px+' > x',x0)
                    x1=page.evaluate('() => '+px)
                finally:
                    client.button('RIGHT','up')
                expect_seat(page,client,1,right=False,x=0)
                assert x1 > x0
                report['checks']['sdk']={'transition':['title','playing'],'key':'RIGHT','pieceX':[x0,x1],'release':True}
                record()
                page.screenshot(path=OUT/'tcp-sdk.png')
            wait_for(page,'id => !document.body.innerText.includes(id)',client.identity)
            report['checks']['sdk']['disconnected']=True
            record()
            browser.close()
    finally:
        child.terminate()
        child.wait(timeout=15)
print(json.dumps(report),flush=True)
