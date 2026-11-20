#!/usr/bin/env python3
"""Retain bounded original Windows CI evidence without browser cache or secrets."""
import hashlib,importlib.util,json,os,shutil,traceback
from pathlib import Path
root=Path(__file__).resolve().parents[2];temp=Path(os.environ['RUNNER_TEMP']);out=temp/'evidence';out.mkdir(exist_ok=False)
for name in ['build.log','install.log','runtime-normal.log','runtime-occupied.log','runtime-bootstrap.log','installer-tests.log','web-bridge-tests.log','source-inputs-tests.log','source-scope-tests.log','assets-tests.log','display-tests.log','observation-tests.log','window-lifecycle-tests.log','observation-replace-evidence.json']:
    if (temp/name).is_file():shutil.copy2(temp/name,out/name)
for mode in ['runtime-normal','runtime-occupied','runtime-bootstrap']:
    if not (temp/mode).is_dir():continue
    for path in (temp/mode).rglob('*'):
        relative=path.relative_to(temp/mode)
        if path.is_file() and not {'profile','fixture-app'}.intersection(relative.parts) and path.suffix in {'.json','.jsonl','.log','.txt','.png','.py'}:
            target=out/mode/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    if (temp/mode/'profile/preferences.json').is_file():shutil.copy2(temp/mode/'profile/preferences.json',out/mode/'native-preferences-after-run.json')
for source,name in [('packages/build-manifest.json','build-manifest.json'),('install-verification/package-verification.json','package-verification.json'),('packages/build/Testing/Temporary/LastTest.log','ctest-last-test.log')]:
    if (temp/source).is_file():shutil.copy2(temp/source,out/name)
scope_spec=importlib.util.spec_from_file_location('windows_inputs',Path(__file__).with_name('windows-inputs.py'));source_scope=importlib.util.module_from_spec(scope_spec);scope_spec.loader.exec_module(source_scope)
complete=False
try:
    selection=source_scope.select(os.environ['GAME']);complete=True
    (out/'source-scope.json').write_text(json.dumps(selection,indent=2)+'\n',encoding='utf-8')
    paths=[root/name for name in source_scope.executed_sources(selection)]
except Exception:
    (out/'source-scope-error.txt').write_text(traceback.format_exc(),encoding='utf-8')
    # Preserve available directly executed code even when source validation failed.
    paths=[root/'joystick-games/tools'/name for name in source_scope.TOOLS]+[root/source_scope.WORKFLOW]
    for directory in ('Sources','Web','tests'):paths.extend((root/source_scope.HOST/directory).rglob('*'))
for path in paths:
    if path.is_file() and not path.is_symlink():
        target=out/'executed-source'/path.relative_to(root);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
files={p.relative_to(out).as_posix():{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.rglob('*') if p.is_file()}
record={'game':os.environ['GAME'],'sourceCommit':os.environ['GITHUB_SHA'],'runId':os.environ['GITHUB_RUN_ID'],'runAttempt':os.environ['GITHUB_RUN_ATTEMPT'],'jobStatusAtCollection':os.environ['JOB_STATUS'],'sourceScopeComplete':complete,'files':files}
(out/'evidence-manifest.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
