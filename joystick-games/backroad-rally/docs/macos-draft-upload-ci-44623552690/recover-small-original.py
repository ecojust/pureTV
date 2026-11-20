import base64,hashlib,importlib.util,json,subprocess,datetime
from pathlib import Path
ROOT=Path('/dev/shm/puretv-submit')
OUT=ROOT/'joystick-games/backroad-rally/docs/macos-draft-upload-ci-44623552690'
OUT.mkdir(exist_ok=False)
RUN=44623552690; ATTEMPT=1; SOURCE='59fa240bd9733211cb5097dbb0df8ec945160dc0'; BASE='repos/ecojust/pureTV'
def get(path,name):
 p=subprocess.run(['/usr/bin/gh','api',path],capture_output=True,check=True,timeout=40)
 value=json.loads(p.stdout); (OUT/name).write_bytes(p.stdout if p.stdout.endswith(b'\n') else p.stdout+b'\n'); return value
run=get(f'{BASE}/actions/runs/{RUN}/attempts/{ATTEMPT}','original-executor-run.json')
assert run['id']==RUN and run['run_attempt']==ATTEMPT and run['head_sha']==SOURCE and run['head_branch']=='build-source/backroad-macos-original-draft-v1'
assert run['event']=='workflow_dispatch' and run['path']=='.github/workflows/joystick-backroad-macos-draft-upload.yml' and run['status']=='completed' and run['conclusion']=='success'
assert run['repository']['full_name']==run['head_repository']['full_name']=='ecojust/pureTV'
jobs=get(f'{BASE}/actions/runs/{RUN}/attempts/{ATTEMPT}/jobs?per_page=100','original-executor-jobs.json')
assert jobs['total_count']==len(jobs['jobs'])==1
job=jobs['jobs'][0]
assert job['id']==135911282106 and job['head_sha']==SOURCE and job['run_id']==RUN and job['run_attempt']==ATTEMPT and job['conclusion']=='success'
for name in ['Test fixed original-package and existing-draft boundaries','Verify original artifact and copy only the two fixed original packages','Run actions/upload-artifact@v4','Preserve only the small receipt on a new immutable branch']:
 matches=[s for s in job['steps'] if s['name']==name]; assert len(matches)==1 and matches[0]['status']=='completed' and matches[0]['conclusion']=='success'
ref=get(f'{BASE}/git/ref/heads/build-assets/artifact-draft-transfer-{RUN}-attempt-{ATTEMPT}','original-receipt-ref.json')
commit=ref['object']['sha']; assert ref['object']['type']=='commit'
c=get(f'{BASE}/git/commits/{commit}','original-receipt-commit.json'); assert c['sha']==commit and c['parents']==[]
tree=get(f'{BASE}/git/trees/{c["tree"]["sha"]}?recursive=1','original-receipt-tree.json')
assert not tree.get('truncated') and len(tree['tree'])==1
item=tree['tree'][0]; assert item['path']=='transfer.json' and item['mode']=='100644' and item['type']=='blob' and item['size']<128000
blob=get(f'{BASE}/git/blobs/{item["sha"]}','original-receipt-blob-api.json')
raw=base64.b64decode(blob['content']); assert blob['encoding']=='base64' and len(raw)==item['size']==blob['size']
assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==item['sha']==blob['sha']
(OUT/'original-transfer.json').write_bytes(raw); report=json.loads(raw)
assert report['status']=='passed' and report['phase']=='verified-two-original-packages-in-existing-draft'
assert report['request']=={'run':44608415225,'attempt':1,'source':'68d343d22c762c904eb83854d4ab9c4113a7c30f','artifact':14570673468,'release':451969286}
assert report['executor']=={'run':str(RUN),'attempt':str(ATTEMPT),'source':SOURCE}
assert report['releaseCreatedOrPublished'] is False and report['packagesRebuiltOrResigned'] is False
assert report['originalArchive']=={'bytes':259564880,'sha256':'a8bfc0f08fdf71fc88719792075953f76a22cf4a64a308e597db169a3ccd7476','repacked':False}
assert report['archiveValidation']['allMembersCrcVerified'] is True and report['archiveValidation']['memberCount']==12
spec=importlib.util.spec_from_file_location('fixedhelper',ROOT/'joystick-games/tools/backroad-macos-draft-upload.py'); helper=importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
assert report['game']==helper.GAME and report['request']==helper.REQUEST
source_checks=[]
for name,expected in report['executedSources'].items():
 path='joystick-games/tools/'+name
 data=subprocess.run(['git','show',SOURCE+':'+path],cwd=ROOT,capture_output=True,check=True,timeout=40).stdout
 assert {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}==expected
 target=OUT/'executed-source'/path; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(data)
 source_checks.append({'path':path,**expected,'fixedCommit':SOURCE})
assert set(report['executedSources'])=={'backroad-macos-draft-upload.py','artifact-draft-transfer.py','android-runtime-artifact.py'}
for path in ['.github/workflows/joystick-backroad-macos-draft-upload.yml','joystick-games/tools/backroad-macos-draft-upload-test.py']:
 data=subprocess.run(['git','show',SOURCE+':'+path],cwd=ROOT,capture_output=True,check=True,timeout=40).stdout
 target=OUT/'executed-source'/path; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(data)
 source_checks.append({'path':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'fixedCommit':SOURCE,'binding':'Exact executor head commit, successful workflow test step'})
release=get(f'{BASE}/releases/451969286','release-draft-after-upload.json'); helper.draft_identity(release)
assert release['draft'] is True and release['published_at'] is None
assets=get(f'{BASE}/releases/451969286/assets?per_page=100','release-assets-after-upload.json')
assert len(assets)==2 and {a['name'] for a in assets}==set(helper.PACKAGES)
assert len(report['assets'])==2
actual=[]
for a in assets:
 info=helper.asset_identity(a,a['name'])
 direct=get(f'{BASE}/releases/assets/{a["id"]}',f'original-asset-{a["id"]}.json')
 assert helper.asset_identity(direct,a['name'])==info
 assert next(r for r in report['assets'] if r['name']==a['name'])=={**info,'operation':'uploaded-original-bytes'}
 actual.append(info)
artifacts=get(f'{BASE}/actions/runs/{RUN}/artifacts?per_page=100','executor-receipt-artifacts.json')
assert artifacts['total_count']==len(artifacts['artifacts'])==1
assert artifacts['artifacts'][0]['name']=='backroad-macos-draft-upload-receipt'
original=get(f'{BASE}/actions/artifacts/14570673468','original-package-artifact-metadata.json')
assert original['size_in_bytes']==259564880 and original['digest']=='sha256:a8bfc0f08fdf71fc88719792075953f76a22cf4a64a308e597db169a3ccd7476'
assert original['workflow_run']['id']==44608415225 and original['workflow_run']['head_sha']==helper.REQUEST['source']
result={'schemaVersion':1,'status':'passed-read-only-recovery','observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'executor':{'run':RUN,'attempt':ATTEMPT,'source':SOURCE,'job':job['id'],'status':'success'},'receipt':{'immutableCommit':commit,'branch':ref['ref'],'gitBlobSha':item['sha'],'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()},'exactExecutorSourceFiles':source_checks,'originalArtifact':{'id':14570673468,'bytes':259564880,'sha256':'a8bfc0f08fdf71fc88719792075953f76a22cf4a64a308e597db169a3ccd7476'},'assets':actual,'draftStillUnpublished':True,'targetSource':helper.REQUEST['source'],'tag':helper.TAG,'onlyTwoFixedAssetsPresent':True,'largePackagesDownloadedLocally':False,'releasePublishedByThisRecovery':False,'limitations':['Original package signature/source/native QA audits remain separate; this verifies unchanged byte transfer and API attachment identity.','Draft browser_download_url values are temporary untagged URLs, not final published URLs.']}
(OUT/'recovery-verification.json').write_text(json.dumps(result,indent=2)+'\n')
(OUT/'README.md').write_text(f'''# Original Backroad macOS draft upload: CI {RUN}\n\nThe fixed workflow at source `{SOURCE}` succeeded. Its create-only receipt branch resolves to immutable commit `{commit}`. The original receipt was recovered through the Git blob API and its Git SHA1, byte length and SHA256 were verified. Three actual executed helper/import hashes match the exact executor source; the workflow and tested helper fixture were also copied from that commit.\n\nThe two Release attachments were checked through both the specified release asset list and direct asset APIs against the receipt and fixed original package SHA256 values. Release `451969286` remained a draft with the original source/tag and exactly these two assets at recovery. No original large package was downloaded again. This recovery did not create, modify or publish a Release. Root handles final publication and public downloads separately.\n\nOriginal package signature/source/native runtime acceptance is separate evidence. The prior original run failure is not overwritten by this successful byte upload. See `recovery-verification.json` for exact identities, actual asset IDs and hashes.\n''')
print(json.dumps({'status':'passed','receiptCommit':commit,'receiptBytes':len(raw),'assets':[{k:v for k,v in a.items() if k!='downloadUrl'} for a in actual],'directory':str(OUT.relative_to(ROOT))},indent=2))
