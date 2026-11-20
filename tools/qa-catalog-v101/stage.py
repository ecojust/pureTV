"""Copy the 34 unchanged signed packages from the public v1.0.0 release to the v1.0.1 draft."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen

REPO = 'ecojust/pureTV'
SOURCE = 'catalog-tv-controls-v1.0.0'
SOURCE_ID = 452834419
DEST = 'catalog-tv-controls-v1.0.1'
DEST_ID = 452951273
MANIFEST_SHA = '6b8d1fd06259bcbc5268b6ad5a66eb3b6741b3047d1c8aa8ebf51569dc327276'
EXCLUDED = 'used-car-racing-0.1.6.apk'
FILENAME = re.compile(r'^[a-z0-9-]+-[0-9]+\.[0-9]+\.[0-9]+\.apk$')


def public_json(url):
    with urlopen(Request(url, headers={'User-Agent':'pureTV-public-original-staging'}),timeout=45) as response:
        return json.load(response)


def draft():
    out=subprocess.check_output(['gh','api',f'repos/{REPO}/releases/{DEST_ID}'])
    data=json.loads(out)
    if not (data['id']==DEST_ID and data['tag_name']==DEST and data['draft'] and not data['published_at']):
        raise RuntimeError('Destination does not identify the expected unpublished draft')
    return {v['name']:v for v in data['assets']}


def verified(asset,row):
    return asset['state']=='uploaded' and asset['name']==row['filename'] and asset['size']==row['bytes'] and asset['digest']=='sha256:'+row['sha256']


def transfer(item):
    row,source_id=item
    name=row['filename']
    url=f'https://github.com/{REPO}/releases/download/{SOURCE}/{name}'
    with tempfile.TemporaryDirectory() as td:
        dest=Path(td)/name
        for attempt in range(3):
            try:
                digest=hashlib.sha256()
                count=0
                with urlopen(Request(url,headers={'User-Agent':'pureTV-public-original-staging','Accept-Encoding':'identity'}),timeout=90) as response, dest.open('wb') as sink:
                    assert response.status==200
                    final_host=urlsplit(response.geturl()).hostname
                    for chunk in iter(lambda:response.read(1024*1024),b''):
                        sink.write(chunk)
                        digest.update(chunk)
                        count+=len(chunk)
                assert count==row['bytes'] and digest.hexdigest()==row['sha256'], name+' original did not match frozen receipt'
                break
            except (HTTPError,URLError,OSError):
                if attempt==2:raise
                time.sleep(3*(attempt+1))
        for attempt in range(3):
            remote=draft().get(name)
            if remote:
                if not verified(remote,row):
                    raise ValueError('Destination already contains different bytes for '+name)
                break
            # This fixed numeric upload route is the only mutation.
            target=f'https://uploads.github.com/repos/{REPO}/releases/{DEST_ID}/assets?name='+quote(name)
            proc=subprocess.run(['gh','api','--method','POST',target,'-H','Content-Type: application/vnd.android.package-archive','--input',str(dest)],capture_output=True)
            if proc.returncode==0:
                remote=json.loads(proc.stdout)
                assert verified(remote,row), name+' upload disagrees with original'
                break
            if attempt==2:raise RuntimeError('Upload failed for '+name+': '+proc.stderr.decode()[:400])
            time.sleep(4*(attempt+1))
        print('Verified original and draft',name,count,digest.hexdigest(),flush=True)
        return {'file':name,'publicReleaseAssetId':source_id,'publicUrl':url,'downloadHost':final_host,'bytes':count,'sha256':digest.hexdigest(),'draftAssetId':remote['id']}


def main():
    assert os.environ.get('GITHUB_REPOSITORY')==REPO
    p=Path(__file__).with_name('verified-current.json')
    assert hashlib.sha256(p.read_bytes()).hexdigest()==MANIFEST_SHA
    manifest=json.loads(p.read_bytes())
    assert len(manifest)==35 and manifest['used-car-racing']['filename']==EXCLUDED
    rows=[v for k,v in sorted(manifest.items()) if k!='used-car-racing']
    assert len(rows)==34 and len({v['filename'] for v in rows})==34 and all(FILENAME.fullmatch(v['filename']) for v in rows)
    assert any(v['filename']=='backroad-rally-0.1.7.apk' and v['bytes']>100*1024*1024 for v in rows)
    public=public_json('https://api.github.com/repos/'+REPO+'/releases/tags/'+SOURCE)
    assert public['id']==SOURCE_ID and public['tag_name']==SOURCE and not public['draft'] and public['published_at']
    assets={a['name']:a for a in public['assets']}
    assert all(verified(assets[v['filename']],v) for v in rows)
    assert EXCLUDED not in draft()
    with ThreadPoolExecutor(3) as pool:
        originals=list(pool.map(transfer,[(v,assets[v['filename']]['id']) for v in rows]))
    final=draft()
    assert EXCLUDED not in final and all(verified(final[v['filename']],v) for v in rows)
    report=dict(source=SOURCE,sourceReleaseId=SOURCE_ID,destination=DEST,draftId=DEST_ID,draft=True,
                exclusions=[EXCLUDED],manifestSha256=MANIFEST_SHA,packageCount=len(originals),
                bytes=sum(v['bytes'] for v in originals),checkedUtc=datetime.now(timezone.utc).isoformat(),
                files=originals)
    report_dir=Path(os.environ['RUNNER_TEMP'])/'receipts'
    report_dir.mkdir(exist_ok=True)
    (report_dir/'copied-originals.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Staged',len(originals),'unchanged APKs;',report['bytes'],'bytes.',flush=True)

if __name__=='__main__':main()
