"""Exercise official signed APKs with the host files from the public portable release."""
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile
import hashlib
import json
import os
import platform
import shutil
import subprocess
import sys

workspace = Path(os.environ['GITHUB_WORKSPACE'])
project = workspace / 'project'
tools = project / 'tools/pc-games'
result = workspace / 'results'
result.mkdir(exist_ok=True)
scratch = Path(os.environ['RUNNER_TEMP']) / 'desktop-input'
scratch.mkdir(exist_ok=True)
player = scratch / 'player'
signed_commit = 'f1e41ebba5c58d6ab78a10eca07b3720bb2c5c79'
subject_commit = 'd03513ef9f6d775bf0cd9530582826dce98cd6af'
games = ['turbo-kart-rally', 'saber-magic-tower', 'operation-ironhold', 'lumenrift', 'kart-royale', 'clawd-pop']
pkgdir = tools / 'packages'

def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def save(file, obj):
    file.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def browser_binary():
    if sys.platform == 'win32':
        for app in ('Microsoft/Edge/Application/msedge.exe', 'Google/Chrome/Application/chrome.exe'):
            for base in ('PROGRAMFILES(X86)', 'PROGRAMFILES'):
                path = Path(os.environ.get(base, 'C:/Program Files')) / app
                if path.is_file():
                    return path
    else:
        path=Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
        if path.is_file():
            return path
    raise FileNotFoundError('Native Chromium browser missing')

assert subprocess.check_output(['git','-C',str(project),'rev-parse','HEAD'], text=True).strip() == subject_commit
checksums={}
for line in (pkgdir/'SHA256SUMS.txt').read_text().splitlines():
    digest, name=line.split()
    name=name.removeprefix("*")
    assert sha(pkgdir/name)==digest
    checksums[name]=digest
with ZipFile(pkgdir/'pureTV-Games-portable.zip') as z:
    z.extractall(player)
for name in ['host.py', 'pc-bridge.js','catalog.json','requirements.txt']:
    assert (tools/name).read_text(encoding='utf-8') == (player/name).read_text(encoding='utf-8')
launcher = [str(pkgdir/'pureTV-Games.exe')] if sys.platform=='win32' else [sys.executable, str(player/'launcher.py')]
rows=json.loads((player/'catalog.json').read_text(encoding='utf-8'))
listed=subprocess.check_output([*launcher,'--list','--language','en'], encoding='utf-8', timeout=60)
assert [line.split()[0] for line in listed.splitlines()] == [row['id'] for row in rows]
chrome=browser_binary()
meta={'os':platform.platform(), 'machine':platform.machine(), 'browserPath':str(chrome), 'APKCommit':signed_commit,
      'hostCommit':subject_commit, 'hostSha256':sha(player/'host.py'), 'bridgeSha256':sha(player/'pc-bridge.js'),
      'packages':checksums, 'launcherGameCount':len(rows),'workflowRef':os.environ['GITHUB_SHA'],'results':{}}
save(result/'environment.json',meta)
for slug in games:
    row=next(r for r in rows if r['id']==slug)
    assert row['url'].startswith('https://raw.githubusercontent.com/ecojust/pureTV/'+signed_commit+'/')
    # pc.py expects a .zip name; give it an exact byte copy of the signed APK.
    target=scratch/(slug+'.zip')
    with urlopen(Request(row['url'],headers={'User-Agent':'pureTV-Desktop-QA'}),timeout=90) as stream,target.open('wb') as f:
        shutil.copyfileobj(stream, f)
    assert target.stat().st_size==row['bytes'] and sha(target)==row['sha256']
status=0
for slug in games:
    # Isolate the browser process for each title so an early GPU context loss cannot mask unrelated titles.
    try:
        run=subprocess.run([sys.executable, str(project/'joystick-games/qa/controller-input/pc.py'),
            '--chromium',str(chrome),'--host',str(player/'host.py'),'--payloads',str(scratch),
            '--output',str(result),'--timeout','180',slug],timeout=380)
        game=json.loads((result/(slug+'.json')).read_text(encoding='utf-8'))
        passed=run.returncode==0 and game['passed']
        print('SIGNED_GAME_RESULT '+json.dumps(game,ensure_ascii=True),flush=True)
    except Exception as exc:
        print(slug, str(exc), flush=True)
        game={'game':slug,'passed':False,'harnessError':str(exc)}
        save(result/(slug+'-harness-error.json'),game)
        passed=False
    meta['results'][slug]=bool(passed)
    status |= int(not passed)
    save(result/'environment.json',meta)
print('SIGNED_DESKTOP_SUMMARY '+json.dumps(meta,ensure_ascii=True),flush=True)
sys.exit(status)
