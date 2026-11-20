"""Run an extracted portable player with unchanged launcher/host using the new signed fixtures."""
import contextlib
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
import time
from zipfile import ZipFile

from playwright.sync_api import sync_playwright

ROOT = Path.cwd()
TOOLS = ROOT / 'tools/pc-games'
OUT = ROOT / 'desktop-evidence'
OUT.mkdir()
sys.path.insert(0, str(TOOLS))
import verify_resource_inputs as verify
import smoke

HOST = {
    'tetris': ('tetris-0.5.5.apk', '6370c9b2283e5f50a1325dfe9c323b6aeeeb25ddf8dfeea0b25c25c90a5863d3'),
    'coast-kart': ('coast-kart-0.5.5.apk','4f480cf8b132bdc2f91bf1905349f5a535fc6538835252933b9eb225f28ac02d'),
}
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

with tempfile.TemporaryDirectory() as temp:
    temp = Path(temp)
    player = temp / 'player'
    pczip = ROOT / 'dist/pureTV-Games-portable.zip'
    with ZipFile(pczip) as archive:
        archive.extractall(player)
    original = {name: digest(player / name) for name in ['launcher.py','host.py','pc-bridge.js','requirements.txt']}
    assert all(value == digest(TOOLS / name) for name,value in original.items())
    catalog = json.loads((player/'catalog.json').read_bytes())
    files = {}
    for slug,(name,expected) in HOST.items():
        paths = list((ROOT/'signed').rglob(name))
        assert len(paths) == 1, (slug,paths)
        pkg = files[slug] = paths[0].resolve()
        assert digest(pkg) == expected
        entry = next(item for item in catalog if item['id']==slug)
        # The production launcher still fetches and verifies both the byte count and digest.
        entry.update(url=pkg.as_uri(),bytes=pkg.stat().st_size,sha256=expected)
    (player/'catalog.json').write_text(json.dumps(catalog))
    chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    os.environ['PURETV_CHROMIUM'] = chrome
    report = dict(system=platform.platform(),machine=platform.machine(),macOS=platform.mac_ver()[0],
                  chrome=subprocess.check_output([chrome,'--version'],text=True).strip(),
                  qaCommit=os.environ['GITHUB_SHA'], sourceCommit='28e2fe4ea419cb08f94701d55ebccfd3e1a65db2',
                  artifactId=14641245660,producerRun=44756990162,portableZipSha256=digest(pczip),
                  executableFiles=original,transport='TCP SDK',games={})
    (OUT/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report),flush=True)
    smoke.exercise([sys.executable, str(player/'launcher.py')], 'chrome')
    report['tetrisMovement'] = {'keyboard':'Enter starts; ArrowLeft moves the falling piece left',
                                'wifi':'SDK START starts; RIGHT moves the falling piece right; disconnect removes the client'}
    (OUT/'results.json').write_text(json.dumps(report,indent=2)+'\n')

    @contextlib.contextmanager
    def launch(slug,package):
        with tempfile.TemporaryDirectory() as cache:
            proc = subprocess.Popen([sys.executable,'-u',str(player/'launcher.py'),slug,
                                     '--cache',cache,'--no-browser','--language','en',
                                     '--http-port','0','--controller-port','0'],
                                    stdout=subprocess.PIPE,text=True)
            try:
                while True:
                    line=proc.stdout.readline()
                    if line.startswith('Game: '): break
                    if not line:raise RuntimeError(f'Launcher exited: {proc.poll()}')
                url=line.split()[1]; pad_line=proc.stdout.readline()
                assert pad_line.startswith('Controller: TCP ')
                cached=list(Path(cache).glob('*.apk'))
                assert len(cached)==1 and digest(cached[0])==digest(package)
                yield url,int(pad_line.split()[2])
            finally:
                proc.terminate()
                proc.wait(timeout=20)

    # Use the reusable game's complete acceptance, changing only how its process is started.
    verify.desktop = launch
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chrome)
        for slug,package in files.items():
            result = verify.exercise(browser,slug,package)
            report['games'][slug]=result
            (OUT/'results.json').write_text(json.dumps(report,indent=2)+'\n')
            print(json.dumps(result),flush=True)
        browser.close()
