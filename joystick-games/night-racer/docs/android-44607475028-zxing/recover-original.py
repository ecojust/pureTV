#!/usr/bin/env python3
"""GET one original immutable Android export; check all blobs and manifest."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import sys
import tarfile
import urllib.request

base = Path(__file__).resolve().parent
run, commit = sys.argv[1:3]
source = '2e1f3b02160995d6a0ce19b47886bd52819b7a41'
archive = base / ('production-' + run + '-' + commit + '.tar.gz')
output = base / ('production-' + run + '-' + commit)
assert not output.exists()
if not archive.exists():
    with urllib.request.urlopen('https://codeload.github.com/ecojust/pureTV/tar.gz/' + commit, timeout=60) as response, archive.open('xb') as dest:
        total = 0
        while block := response.read(1024 * 1024):
            total += len(block); assert total < 300_000_000; dest.write(block)
raw = subprocess.check_output(['/usr/bin/gh', 'api', 'repos/ecojust/pureTV/git/trees/' + commit + '?recursive=1'])
(base / ('production-' + run + '-git-tree.json')).write_bytes(raw)
tree = json.loads(raw); assert not tree['truncated']
expected = {i['path']: i for i in tree['tree'] if i['type'] == 'blob'}
assert all(i['mode'] in ('100644','100755') for i in expected.values())
prefix = 'pureTV-' + commit + '/'; files = {}
with tarfile.open(archive, 'r:gz') as tar:
    total = 0
    for member in tar:
        assert member.name.startswith(prefix) or member.name == prefix[:-1]
        if member.isdir(): continue
        assert member.isfile()
        name = member.name[len(prefix):]; path = PurePosixPath(name)
        assert name == path.as_posix() and not path.is_absolute() and '..' not in path.parts
        assert name in expected and name not in files and 0 <= member.size < 100_000_000
        total += member.size; assert total < 500_000_000
        data = tar.extractfile(member).read(); assert len(data) == member.size == expected[name]['size']
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == expected[name]['sha']
        dest = output / name; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(data)
        files[name] = {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
assert set(files) == set(expected)
manifest = json.loads((output / 'export-manifest.json').read_text())
assert str(manifest['runId']) == run and str(manifest['runAttempt']) == '1' and manifest['sourceSha'] == source
assert manifest['files'] == {k:v for k,v in files.items() if k != 'export-manifest.json'}
result = {'status':'passed','exportCommit':commit,'sourceRunId':int(run),'sourceCommit':source,
          'everyGitBlobVerified':True,'everyExportManifestSizeAndSha256Verified':True,'files':len(files),
          'archive':{'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},
          'originalBuildResult':manifest['buildResult'],'originalSignResult':manifest['signResult'],
          'originalRuntimeResult':manifest['runtimeResult'],'originalInstallPackagesValidated':manifest['installPackagesValidated'],
          'localPackageValidationPerformed':False,'gamesRerun':False}
(base / ('production-' + run + '-recovery-validation.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
for p in output.glob('reports/joystick-android-report-runtime-*/*/report.json'):
    r=json.loads(p.read_text());print(json.dumps({'report':str(p.relative_to(output)),'status':r['status'],
       'checks':[{'name':t['name'],'status':t['status']} for t in r.get('tests',[])],'error':r.get('error')}))
