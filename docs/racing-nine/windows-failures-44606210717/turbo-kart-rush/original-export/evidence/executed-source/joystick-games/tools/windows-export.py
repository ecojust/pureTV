#!/usr/bin/env python3
"""Validate native Windows results and export an immutable, explicit partial result."""
import argparse,hashlib,importlib.util,json,os,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--directory',type=Path,required=True);args=p.parse_args()
root=Path(__file__).resolve().parents[2];out=args.directory.resolve();source=os.environ['GITHUB_SHA'];games=json.loads(os.environ['REQUESTED_GAMES']);passed=[]
scope_spec=importlib.util.spec_from_file_location('windows_inputs',Path(__file__).with_name('windows-inputs.py'));source_scope=importlib.util.module_from_spec(scope_spec);scope_spec.loader.exec_module(source_scope)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def same(path,item):assert path.stat().st_size==item['bytes'] and sha(path)==item['sha256'],path
for game in games:
    evidence=out/('joystick-windows-evidence-'+game);packages=out/('joystick-windows-packages-'+game)
    receipt=json.loads((evidence/'evidence-manifest.json').read_text(encoding='utf-8'));assert receipt['sourceCommit']==source and receipt['game']==game and receipt['runId']==os.environ['GITHUB_RUN_ID'] and receipt['runAttempt']==os.environ['GITHUB_RUN_ATTEMPT']
    for name,item in receipt['files'].items():same(evidence/name,item)
    if not packages.is_dir():continue
    manifest=json.loads((packages/'build-manifest.json').read_text(encoding='utf-8'));assert manifest['sourceCommit']==source and manifest['game']==game and manifest['committedInputsVerified'] and manifest['architecture']=='x86_64'
    assert receipt['sourceScopeComplete'] and source_scope.file_records(source_scope.select(game))==manifest['inputFiles'],'Complete source closure differs from artifact'
    for name,item in manifest['inputFiles'].items():same(root/name,item)
    for name,item in manifest['packages'].items():same(packages/name,item)
    installed=json.loads((evidence/'package-verification.json').read_text(encoding='utf-8'));assert installed['status']=='passed' and installed['sourceCommit']==source and installed['installedBytesMatchPortable'] and installed['completeFileSetVerified'] and installed['uninstallPreservesUnrelatedFiles'] and installed['uninstallRemovesOnlyPackagedFiles']
    for mode in ['runtime-normal','runtime-occupied']:
        report=json.loads((evidence/mode/'report.json').read_text(encoding='utf-8'));assert report['status']=='passed' and report['game']==game and report['qaSourceCommit']==source and report['binarySha256']==installed['binarySha256']
        assert len(report['tests'])==10 and all(t['status']=='passed' for t in report['tests'])
        assert report['storageRestart']['initialHydrationEqual'] and report['storageRestart']['cleanBrowserCacheVerified']
        if report['qaPlan'].get('storageRestartRequired'):assert report['storageRestart']['status']=='passed' and report['storageRestart']['nativeSavedAfterQuit']
        for name,hash_value in report['sourceHashes'].items():assert sha(root/name)==hash_value,name
    passed.append(game)
files={}
for path in sorted(out.rglob('*')):
    assert not path.is_symlink()
    if path.is_file():
        assert path.stat().st_size<100000000,'Git export needs a smaller package or a release-asset transport: '+str(path)
        files[path.relative_to(out).as_posix()]={'bytes':path.stat().st_size,'sha256':sha(path)}
branch=f"build-assets/joystick-catalog-windows-{os.environ['GITHUB_RUN_ID']}-attempt-{os.environ['GITHUB_RUN_ATTEMPT']}"
report={'sourceCommit':source,'runId':int(os.environ['GITHUB_RUN_ID']),'runAttempt':int(os.environ['GITHUB_RUN_ATTEMPT']),'requestedGames':games,'verifiedGames':passed,'allGamesVerified':set(passed)==set(games),'nativePlatform':'windows-x64','authenticodeSigned':False,'physicalControllerTested':False,'files':files}
(out/'export-manifest.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
assert os.environ['GITHUB_REPOSITORY']=='ecojust/pureTV'
def git(*argv):subprocess.run(['git','-C',str(out),*argv],check=True)
git('init','-b','export');git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');git('add','.');git('commit','-m','Preserve original Windows joystick packages and evidence [skip ci]')
subprocess.run(['gh','auth','setup-git'],check=True);remote='https://github.com/ecojust/pureTV.git';git('remote','add','origin',remote)
assert not subprocess.check_output(['git','ls-remote','--heads',remote,'refs/heads/'+branch],text=True).strip(),'Immutable export already exists'
git('push','--force-with-lease=refs/heads/'+branch+':','origin','HEAD:refs/heads/'+branch)
