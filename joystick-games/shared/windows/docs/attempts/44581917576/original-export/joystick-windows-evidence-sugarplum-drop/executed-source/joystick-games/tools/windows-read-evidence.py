#!/usr/bin/env python3
"""Read a finished Windows artifact; never build or launch a game."""
import hashlib,json,os,re,shutil,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2];out=Path(os.environ['RUNNER_TEMP'])/'windows-original';provenance=out/'provenance'
repo=os.environ['GITHUB_REPOSITORY'];run=os.environ['SOURCE_RUN'];source=os.environ['SOURCE_SHA'];attempt=os.environ['SOURCE_ATTEMPT'];game=os.environ['GAME']
assert repo=='ecojust/pureTV' and re.fullmatch('[0-9]+',run) and re.fullmatch('[a-f0-9]{40}',source) and re.fullmatch('[1-9][0-9]*',attempt) and re.fullmatch('[a-z0-9-]+',game)
def api(path):return json.loads(subprocess.check_output(['gh','api',path],text=True))
def write(path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
if sys.argv[1]=='select':
    original=api(f'repos/{repo}/actions/runs/{run}/attempts/{attempt}')
    assert original['id']==int(run) and original['run_attempt']==int(attempt) and original['head_sha']==source and original['status']=='completed'
    assert original['path']=='.github/workflows/joystick-catalog-windows.yml'
    artifacts=api(f'repos/{repo}/actions/runs/{run}/artifacts?per_page=100')['artifacts']
    selected=[item for item in artifacts if item['name']=='joystick-windows-evidence-'+game and not item['expired']]
    assert len(selected)==1,'Exactly one original evidence artifact required'
    item=selected[0];assert item['workflow_run']['head_sha']==source
    jobs=api(f'repos/{repo}/actions/runs/{run}/attempts/{attempt}/jobs?per_page=100')['jobs'];job=next(j for j in jobs if j['name']==f'verify ({game})')
    assert job['status']=='completed' and job['started_at']<=item['created_at']<=job['completed_at']
    write(provenance/'original-run.json',original);write(provenance/'original-artifact.json',item);write(provenance/'original-job.json',job)
    with open(os.environ['GITHUB_OUTPUT'],'a') as target:target.write('artifact_id='+str(item['id'])+'\n')
elif sys.argv[1]=='export':
    evidence=out/'evidence';receipt=json.loads((evidence/'evidence-manifest.json').read_text(encoding='utf-8'))
    assert receipt['sourceCommit']==source and receipt['game']==game and receipt['runId']==run and receipt['runAttempt']==attempt
    missing=[];verified=[]
    for name,item in receipt['files'].items():
        relative=Path(name);assert not relative.is_absolute() and '..' not in relative.parts
        path=evidence/relative
        if not path.is_file():
            assert any(part.startswith('.') for part in relative.parts),'Unexplained missing non-hidden artifact file: '+name
            missing.append({'path':name,'expected':item,'reason':'Original upload-artifact excluded hidden paths; absent bytes are not reconstructed or claimed archived.'});continue
        assert path.stat().st_size==item['bytes'] and digest(path)==item['sha256'],name;verified.append(name)
    actual={p.relative_to(evidence).as_posix() for p in evidence.rglob('*') if p.is_file()};assert actual==set(verified)|{'evidence-manifest.json'}
    for path in [Path(__file__),root/'.github/workflows/joystick-catalog-windows-evidence.yml']:
        target=provenance/'executed-source'/path.relative_to(root);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    files={}
    for path in sorted(out.rglob('*')):
        assert not path.is_symlink()
        if path.is_file():
            assert path.suffix not in {'.exe','.dll','.zip','.apk','.dmg'} and path.stat().st_size<100000000
            files[path.relative_to(out).as_posix()]={'bytes':path.stat().st_size,'sha256':digest(path)}
    branch=f"build-assets/joystick-catalog-windows-evidence-{os.environ['GITHUB_RUN_ID']}-attempt-{os.environ['GITHUB_RUN_ATTEMPT']}"
    write(out/'export-manifest.json',{'sourceCommit':source,'artifactRunId':int(run),'artifactRunAttempt':int(attempt),'readerSourceCommit':os.environ['GITHUB_SHA'],'readerRunId':int(os.environ['GITHUB_RUN_ID']),'game':game,'verifiedOriginalFiles':len(verified),'missingOriginalFiles':missing,'installationPackagesIncluded':False,'gamesLaunched':False,'files':files})
    def git(*args):subprocess.run(['git','-C',str(out),*args],check=True)
    git('init','-b','export');git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');git('add','.');git('commit','-m','Preserve completed original Windows build evidence [skip ci]');subprocess.run(['gh','auth','setup-git'],check=True);remote='https://github.com/'+repo+'.git';git('remote','add','origin',remote)
    assert not subprocess.check_output(['git','ls-remote','--heads',remote,'refs/heads/'+branch],text=True).strip()
    git('push','--force-with-lease=refs/heads/'+branch+':','origin','HEAD:refs/heads/'+branch)
else:raise ValueError('Use select or export')
