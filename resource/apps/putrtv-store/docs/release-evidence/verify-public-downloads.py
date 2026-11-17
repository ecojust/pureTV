from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
import hashlib,json,re,subprocess,time
from datetime import datetime, timezone
root=Path('/workspace/pureTV')
revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
assert re.fullmatch(r'[0-9a-f]{40}',revision)
base='https://raw.githubusercontent.com/ecojust/pureTV/'+revision+'/'

def fetch(path,expected_bytes,expected_hash):
    for attempt in range(3):
        try:
            with urlopen(Request(base+path,headers={'User-Agent':'pureTV-publication-check','Accept-Encoding':'identity'}),timeout=30) as response:
                assert response.status==200
                h=hashlib.sha256();size=0
                while True:
                    chunk=response.read(65536)
                    if not chunk:break
                    size+=len(chunk);assert size<=expected_bytes;h.update(chunk)
                assert size==expected_bytes and h.hexdigest()==expected_hash
                return {'path':path,'httpStatus':200,'bytes':size,'sha256':h.hexdigest(),'verified':True}
        except Exception:
            if attempt==2:raise
            time.sleep(2*(attempt+1))

feed=root/'resource/tv-store-catalog.json';feed_data=feed.read_bytes();catalog=fetch('resource/tv-store-catalog.json',len(feed_data),hashlib.sha256(feed_data).hexdigest())
assert len(json.loads(feed_data)['entries'])==127
paths=['resource/apps/putrtv-store']+['resource/launcher/'+x for x in ('puretv','nova','forma','moss','aster','sol','mono','pixel','circuit','drift')]

def verify(folder):
    metadata=json.loads((root/folder/'resource.json').read_text())
    return {**fetch(folder+'/'+metadata['apk'],metadata['apkBytes'],metadata['sha256']),'packageName':metadata['packageName'],'version':metadata['version'],'versionCode':metadata['versionCode']}

with ThreadPoolExecutor(max_workers=4) as executor:files=list(executor.map(verify,paths))
observed=json.loads(subprocess.check_output(['gh','api','repos/ecojust/pureTV/git/ref/heads/master'],cwd=root))['object']['sha']
assert observed==revision
report={'publicationCommit':revision,'observedMaster':observed,'checkedAt':datetime.now(timezone.utc).isoformat(),'catalogEntries':127,'catalog':catalog,'files':files,'physicalTvTested':False}
p=root/'resource/apps/putrtv-store/docs/release-evidence/public-downloads.json';p.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'publicationCommit':revision,'catalogEntries':127,'apkDownloadsVerified':len(files),'bytesDownloaded':sum(f['bytes'] for f in files)},indent=2))
