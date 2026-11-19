#!/usr/bin/env python3
"""Retain bounded original Windows CI evidence without browser cache or secrets."""
import hashlib,json,os,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[2];temp=Path(os.environ['RUNNER_TEMP']);out=temp/'evidence';out.mkdir(exist_ok=False)
for name in ['build.log','install.log','runtime-normal.log','runtime-occupied.log','installer-tests.log','web-bridge-tests.log','source-inputs-tests.log']:
    if (temp/name).is_file():shutil.copy2(temp/name,out/name)
for mode in ['runtime-normal','runtime-occupied']:
    if not (temp/mode).is_dir():continue
    for path in (temp/mode).rglob('*'):
        relative=path.relative_to(temp/mode)
        if path.is_file() and 'profile' not in relative.parts and path.suffix in {'.json','.jsonl','.log','.txt','.png','.py'}:
            target=out/mode/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    if (temp/mode/'profile/preferences.json').is_file():shutil.copy2(temp/mode/'profile/preferences.json',out/mode/'native-preferences-after-run.json')
for source,name in [('packages/build-manifest.json','build-manifest.json'),('install-verification/package-verification.json','package-verification.json')]:
    if (temp/source).is_file():shutil.copy2(temp/source,out/name)
paths=list((root/'joystick-games/shared/windows').rglob('*'))+list((root/'joystick-games/tools').glob('windows-*.py'))+[root/'.github/workflows/joystick-catalog-windows.yml']
for path in paths:
    if path.is_file():target=out/'executed-source'/path.relative_to(root);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
files={p.relative_to(out).as_posix():{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.rglob('*') if p.is_file()}
record={'game':os.environ['GAME'],'sourceCommit':os.environ['GITHUB_SHA'],'runId':os.environ['GITHUB_RUN_ID'],'runAttempt':os.environ['GITHUB_RUN_ATTEMPT'],'jobStatusAtCollection':os.environ['JOB_STATUS'],'files':files}
(out/'evidence-manifest.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
