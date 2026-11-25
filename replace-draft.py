"""Run in GitHub Actions with only the pinned replacement plan and verified APK export."""
import hashlib, json, os, re, subprocess
from pathlib import Path

repo = 'ecojust/pureTV'
tag = 'games-zh-cn-2026.11.25'
release_id = 457489608
run, source, export_sha, group = [os.environ[k] for k in ('SIGN_RUN', 'SOURCE', 'EXPORT_SHA', 'GROUP')]
assert os.environ['GITHUB_REPOSITORY'] == repo
assert re.fullmatch('[0-9]+', run) and re.fullmatch('[0-9a-f]{40}', source) and re.fullmatch('[0-9a-f]{40}', export_sha)
assert group in ('neon', 'legacy')

def gh(*args): return subprocess.check_output(['gh', *args], text=True)
def api(suffix): return json.loads(gh('api', f'repos/{repo}/'+suffix))
def release(): 
    data=api('releases/'+str(release_id));assert data['tag_name']==tag and data['draft']
def assets():
    data=json.loads(gh('api','--paginate','--slurp',f'repos/{repo}/releases/{release_id}/assets?per_page=100'))
    return {x['name']:x for pg in data for x in pg}
def verify(asset, sha, size):
    assert asset['digest']=='sha256:'+sha and asset['size']==size and asset['state']=='uploaded',asset['name']
def rename(asset,new):
    release()
    data=json.loads(gh('api','--method','PATCH',f'repos/{repo}/releases/assets/{asset["id"]}','-f','name='+new))
    assert data['id']==asset['id'] and data['name']==new
def remove(asset):
    release()
    gh('api','--method','DELETE',f'repos/{repo}/releases/assets/{asset["id"]}')

plan=json.loads(Path('workflow/replacement-plan.json').read_bytes())
items=plan['groups'][group]
assert items and plan['source']==source and items['run']==run and items['export']==export_sha
workflow = 'controller-games.yml' if group=='legacy' else 'sign-game-kit.yml'
export_ref = f'build-assets/controller-games-{run}-attempt-{items["attempt"]}' if group=='legacy' else f'build-assets/game-kit-signed-{run}'
job=api('actions/runs/'+run)
assert job['path']=='.github/workflows/'+workflow and job['conclusion']=='success' and job['head_repository']['full_name']==repo
assert api('git/ref/heads/'+export_ref)['object']['sha']==export_sha
release()
for slug,p in items['games'].items():
    assert re.fullmatch('[a-z0-9-]+',slug)
    base=Path('export')/('packages' if group=='legacy' else '.')/slug
    rc=json.loads((base/'signing-receipt.json').read_bytes())
    assert rc['sourceSha']==source and rc['slug']==slug and str(rc.get('runId',rc.get('workflowRun')))==run
    assert rc['signatureVerified'] and rc['certificateSha256']=='eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23'
    filename=p['filename']
    assert filename==slug+'-'+rc.get('versionName',rc.get('version'))+'.apk'
    apk=base/filename
    assert apk.stat().st_size==rc['bytes']==p['bytes'] and hashlib.sha256(apk.read_bytes()).hexdigest()==rc['sha256']==p['sha256']
    prior_name='prior-'+p['priorSha256'][:12]+'-'+filename
    candidate_name='candidate-'+run+'-'+filename
    snapshot=assets()
    old=snapshot.get(filename);prior=snapshot.get(prior_name);candidate=snapshot.get(candidate_name)
    if prior: verify(prior,p['priorSha256'],p['priorBytes'])
    if candidate: verify(candidate,p['sha256'],p['bytes'])
    if old and old['digest']=='sha256:'+p['sha256']:
        verify(old,p['sha256'],p['bytes'])
        if prior: remove(prior)
        if candidate: remove(candidate)
        continue
    if old: verify(old,p['priorSha256'],p['priorBytes'])
    else: assert prior, 'Expected either the previous draft asset or the rollback copy'
    if not candidate:
        temp=Path(candidate_name);os.link(apk,temp)
        release();gh('release','upload',tag,str(temp),'--repo',repo)
        candidate=assets()[candidate_name];verify(candidate,p['sha256'],p['bytes'])
    if old:
        assert not prior
        rename(old,prior_name);prior=assets()[prior_name]
    try:
        rename(candidate,filename)
    except Exception:
        if filename not in assets():rename(prior,filename)
        raise
    final=assets()
    verify(final[filename],p['sha256'],p['bytes'])
    verify(final[prior_name],p['priorSha256'],p['priorBytes'])
    assert final[filename]['id']==candidate['id'] and final[prior_name]['id']==prior['id']
    remove(prior)
    print(f'{slug}: replaced verified draft {p["priorSha256"]} -> {p["sha256"]}',flush=True)
