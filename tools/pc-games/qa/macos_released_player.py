"""Drive the staged portable bytes using the launcher's real catalog and fresh cache."""
import contextlib
import json
import os
import subprocess
import sys
import tempfile

import hashlib
from pathlib import Path
import platform
ROOT = Path.cwd()
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def write_json(name, value):
    target = ROOT / 'desktop-evidence'
    target.mkdir(exist_ok=True)
    (target / name).write_text(json.dumps(value, indent=2)+'\n')
from playwright.sync_api import sync_playwright
checkout=str(ROOT)
sys.path.insert(0,checkout+'/tools/pc-games')
import verify_resource_inputs as verify

def main():
    staged=ROOT/'download/player'
    zipped=ROOT/'download/pureTV-Games-portable.zip'
    assert platform.machine()=='arm64' and digest(zipped)=='661dd93581802f8e21b0f0b35ec850d824f783e80bdae02da894da8f13a244f5'
    catalog=json.loads((staged/'catalog.json').read_text())
    e=next(game for game in catalog if game['id']=='used-car-racing')
    assert e['sha256']=='1b0879c9ae8ac10188ea34e9694dbc9527048ee76e10d735a61aa24da53bd9e7' and e['bytes']==1752553
    assert len(catalog)==35 and e['url']=='https://raw.githubusercontent.com/ecojust/pureTV/8461633327d2cf043c02c96342c0e01b4e12d066/packages/used-car-racing/used-car-racing-0.1.7.apk'
    with tempfile.TemporaryDirectory(prefix='lt-player-101-') as temp, sync_playwright() as pw:
        from pathlib import Path
        cache=Path(temp)
        assert not list(cache.iterdir())
        expected=cache/('used-car-racing-'+e['sha256'][:16]+'.apk')
        @contextlib.contextmanager
        def desktop(slug,package):
            assert slug=='used-car-racing' and not list(cache.iterdir())
            cmd=[sys.executable,'-u',str(staged/'launcher.py'),slug,'--language','en','--cache',str(cache),
                 '--http-port','0','--controller-port','0','--no-browser']
            proc=subprocess.Popen(cmd,stdout=subprocess.PIPE,text=True)
            try:
                for line in proc.stdout:
                    print(line,end='',flush=True)
                    if line.startswith('Game: '):
                        url=line.split()[1]
                        break
                else:
                    raise RuntimeError(f'player exited before serving the game ({proc.poll()})')
                pad=proc.stdout.readline(); print(pad,end='',flush=True)
                assert pad.startswith('Controller: TCP ')
                assert list(cache.iterdir())==[expected] and digest(expected)==e['sha256'] and expected.stat().st_size==e['bytes']
                yield url,int(pad.split()[2])
            finally:
                proc.terminate();proc.wait(timeout=20)
        verify.desktop=desktop
        browser=pw.chromium.launch(executable_path=CHROME)
        result=verify.exercise(browser,'used-car-racing',expected)
        assert result['sha256']==e['sha256'] and result['keyboard']==result['wifi']=='countdown' and result['seats']==2
        browser.close()
    report={'source':os.environ['GITHUB_SHA'],'releaseSource':'01c029c38f8902e5aa95d3b5c6eac9929e9295b1',
            'gameVersion':'0.1.7','portableUrl':'https://github.com/ecojust/pureTV/releases/download/catalog-player-v1.0.1/pureTV-Games-portable.zip',
            'portableSha256':digest(zipped),'portableBytes':zipped.stat().st_size,'catalogSha256':digest(staged/'catalog.json'),
            'catalogEntries':len(catalog),'download':e,'emptyCache':True,'system':platform.mac_ver()[0],'machine':platform.machine(),
            'chrome':subprocess.check_output([CHROME,'--version'],text=True).strip(),'tests':result}
    write_json('results.json',report)
    print(json.dumps(report),flush=True)
if __name__=='__main__':
    main()
