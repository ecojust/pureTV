import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

commit='96dde5c68e9a1762af557231ca3712b4f96ef50c'
out=Path('/dev/shm/puretv-joystick-games/joystick-games/qa/android/catalog-ci/44148578083/original-export')
base='https://raw.githubusercontent.com/ecojust/pureTV/'+commit+'/'
def download(name):
    with urllib.request.urlopen(base+name, timeout=90) as response:
        assert response.status==200
        data=response.read()
    return name,data
_,raw=download('export-manifest.json')
manifest=json.loads(raw)
assert manifest['sourceSha']=='127d108053297e2ae5f2b6e14aa20550ae97dae4'
assert manifest['runId']=='44148578083' and manifest['runAttempt']=='1'
assert manifest['installPackagesValidated'] is False
assert manifest['buildResult']=='failure' and manifest['signResult']=='skipped'
files=manifest['files']
for name in files:
    assert not Path(name).is_absolute() and '..' not in Path(name).parts
    assert name.startswith('reports/') or name=='runtime-verification.json'
out.mkdir(parents=True,exist_ok=True)
(out/'export-manifest.json').write_bytes(raw)
verified={}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for name,data in pool.map(download,files):
        record={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
        assert record==files[name],name
        p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
        verified[name]=record
(out.parent/'fetch-verification.json').write_text(json.dumps({'status':'passed',
    'scope':'Full public GET bytes checked against immutable export manifest, not runtime acceptance',
    'exportCommit':commit,'sourceCommit':manifest['sourceSha'],'runId':manifest['runId'],
    'manifestSha256':hashlib.sha256(raw).hexdigest(),'files':verified},indent=2)+'\n')
print(json.dumps({'filesVerified':len(verified),'output':str(out),'buildResult':manifest['buildResult']}))
