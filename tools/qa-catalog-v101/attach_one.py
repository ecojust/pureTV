import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from urllib.request import Request,urlopen
REPO='ecojust/pureTV'
DRAFT=452951273
TAG='catalog-tv-controls-v1.0.1'
name='used-car-racing-0.1.7.apk'
export='8461633327d2cf043c02c96342c0e01b4e12d066'
rev='5414b47b1614d2816e581be3b7d1ecdd1355d28a'
digest='1b0879c9ae8ac10188ea34e9694dbc9527048ee76e10d735a61aa24da53bd9e7'
size=1752553
repo_folder=Path(__file__).parent
def api(path):
    return json.loads(subprocess.check_output(['gh','api','repos/'+REPO+'/'+path]))
def draft():
    r=api('releases/'+str(DRAFT))
    assert (r['id'],r['tag_name'],r['published_at'],r['draft'])==(DRAFT,TAG,None,True)
    return {a['name']:a for a in r['assets']}
def fetch(path):return urlopen(Request(f'https://raw.githubusercontent.com/{REPO}/{export}/'+path,headers={'User-Agent':'pureTV-original-APK-reader'}),timeout=60).read()

assert os.environ['GITHUB_REPOSITORY']==REPO
signed=api('actions/runs/44778384342'); assert signed['head_sha']==rev and signed['conclusion']=='success'
receipt=json.loads(fetch('packages/used-car-racing/signing-receipt.json'))
assert (receipt['sourceSha'],receipt['runId'],receipt['sha256'],receipt['bytes'],receipt['signatureVerified'])==(rev,'44778384342',digest,size,True)
assert receipt['certificateSha256']=='eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23'
assert (receipt['packageName'],receipt['versionName'],receipt['versionCode'])==('com.ecojust.usedcartv','0.1.7',8)
payload=fetch('packages/used-car-racing/'+name)
assert len(payload)==size and hashlib.sha256(payload).hexdigest()==digest
fixed=repo_folder/'verified-current.json'
assert hashlib.sha256(fixed.read_bytes()).hexdigest()=='6b8d1fd06259bcbc5268b6ad5a66eb3b6741b3047d1c8aa8ebf51569dc327276'
expected={v['filename']:(v['bytes'],'sha256:'+v['sha256']) for s,v in json.loads(fixed.read_bytes()).items() if s!='used-car-racing'}
before=draft()
assert set(before)==set(expected) or set(before)==set(expected)|{name}
assert all((before[k]['size'],before[k]['digest'])==v for k,v in expected.items())
if name not in before:
    with tempfile.NamedTemporaryFile() as file:
        file.write(payload);file.flush()
        upload=f'https://uploads.github.com/repos/{REPO}/releases/{DRAFT}/assets?name={name}'
        a=json.loads(subprocess.check_output(['gh','api','--method','POST',upload,'-H','Content-Type: application/vnd.android.package-archive','--input',file.name]))
        assert (a['name'],a['size'],a['digest'],a['state'])==(name,size,'sha256:'+digest,'uploaded')
expected[name]=(size,'sha256:'+digest)
after=draft()
assert set(after)==set(expected) and all((a['size'],a['digest'])==expected[k] and a['state']=='uploaded' for k,a in after.items())
print('Unmodified signed original',name,size,digest,'draft asset',after[name]['id'],'total',len(after),sum(a['size'] for a in after.values()))
