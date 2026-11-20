"""Transfer five approved immutable originals into their existing draft; verify every GitHub asset."""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

REPOSITORY = 'ecojust/pureTV'
SLUGS = {'alchemists-lattice', 'atlas-of-ink', 'bumble-basket', 'neon-arcana', 'oathstones',
         'solder-and-rain', 'starbase-spooky', 'starsling', 'story-thief'}
def release(number):
    return json.loads(subprocess.check_output(['gh','api',f'repos/{REPOSITORY}/releases/{number}']))
def verify(asset, expected):
    assert asset['state']=='uploaded' and asset['size']==expected['bytes']
    assert asset['digest']=='sha256:'+expected['sha256'], expected['file']
def main(slug):
    assert slug in SLUGS and os.environ['GITHUB_REPOSITORY']==REPOSITORY
    decision=json.loads((Path('.github/puzzle-transfer-approved')/(slug+'.json')).read_text())
    assert decision['game']==slug and decision['tag'].startswith('joystick-'+slug+'-v')
    assert decision['source']==('a370be712a803cb65d6b9077399c9ae718bb0b6b' if slug=='starbase-spooky' else '84eedab7caf4e7feb2d4292e64bf4468e8f6c6b0')
    items=decision['files']
    assert len(items)==len({x['file'] for x in items})==5
    assert sorted(Path(x['file']).suffix for x in items)==['.apk','.dmg','.exe','.zip','.zip']
    rid=decision['releaseId']
    assert type(rid) is int and rid>0
    tag=decision['tag']
    with tempfile.TemporaryDirectory() as temporary:
        for item in items:
            name=item['file'];size=item['bytes'];digest=item['sha256'];url=item['original']
            assert re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]+',name) and re.fullmatch('[a-f0-9]{64}',digest) and size>0
            u=urllib.parse.urlsplit(url); assert (u.scheme,u.netloc,u.query,u.fragment)==('https','raw.githubusercontent.com','','')
            assert re.fullmatch(r'/ecojust/pureTV/[a-f0-9]{40}/[A-Za-z0-9_./-]+',u.path) and '..' not in u.path.split('/') and u.path.endswith('/'+name)
            r=release(rid); assert r['id']==rid and (r['tag_name'],r['target_commitish'])==(tag,decision['source'])
            existing={a['name']:a for a in r['assets']};assert set(existing)<={x['file'] for x in items}
            if name in existing:verify(existing[name],item);continue
            assert r['draft'], 'Only existing draft releases accept bytes'
            path=Path(temporary)/name
            subprocess.run(['curl','--silent','--show-error','--fail','--location','--retry','3','--output',str(path),url],check=True)
            assert path.stat().st_size==size
            with path.open('rb') as stream: assert hashlib.file_digest(stream,'sha256').hexdigest()==digest
            with path.open('rb') as stream:
                endpoint=f'https://uploads.github.com/repos/{REPOSITORY}/releases/{rid}/assets?'+urllib.parse.urlencode({'name':name})
                request=urllib.request.Request(endpoint,data=stream,method='POST',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Content-Type':'application/octet-stream','Content-Length':str(size),'User-Agent':'pureTV verified package transfer'})
                with urllib.request.urlopen(request,timeout=300) as response:
                    actual=json.load(response)
                assert actual['name']==name
                verify(actual,item)
            print(f'{name}: {size} bytes, sha256 {digest}',flush=True)
    r=release(rid);assets={a['name']:a for a in r['assets']};assert set(assets)=={x['file'] for x in items}
    for item in items:verify(assets[item['file']],item)
if __name__=='__main__':main(sys.argv[1])
