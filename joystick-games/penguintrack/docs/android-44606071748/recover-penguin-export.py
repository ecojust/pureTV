#!/usr/bin/env python3
"""Recover one immutable read-only evidence export and verify every Git blob."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import tarfile
import urllib.request

base = Path(__file__).resolve().parent
commit = '742a31ef09869e15a35a638fe16e55e484c1d064'
archive = base / ('penguin-evidence-' + commit + '.tar.gz')
output = base / ('penguin-evidence-' + commit)
assert not output.exists()
if not archive.exists():
    with urllib.request.urlopen('https://codeload.github.com/ecojust/pureTV/tar.gz/' + commit, timeout=60) as source, archive.open('xb') as dest:
        total = 0
        while block := source.read(1024 * 1024):
            total += len(block); assert total < 250_000_000
            dest.write(block)
raw = subprocess.check_output(['/usr/bin/gh','api','repos/ecojust/pureTV/git/trees/' + commit + '?recursive=1'])
(base / 'penguin-evidence-git-tree.json').write_bytes(raw)
tree = json.loads(raw); assert not tree['truncated']
expected = {i['path']: i for i in tree['tree'] if i['type'] == 'blob'}
assert all(i['mode'] in ('100644','100755') for i in expected.values())
prefix = 'pureTV-' + commit + '/'
files = {}
with tarfile.open(archive, 'r:gz') as tar:
    members = tar.getmembers(); total = 0
    for member in members:
        assert member.name.startswith(prefix) or member.name == prefix[:-1]
        if member.isdir(): continue
        assert member.isfile()
        name = member.name[len(prefix):]; path = PurePosixPath(name)
        assert name == path.as_posix() and not path.is_absolute() and '..' not in path.parts
        assert name in expected and name not in files and 0 <= member.size < 100_000_000
        total += member.size; assert total < 250_000_000
        data = tar.extractfile(member).read()
        assert len(data) == member.size == expected[name]['size']
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == expected[name]['sha']
        dest = output / name; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(data)
        files[name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
assert set(files) == set(expected)
manifest = json.loads((output / 'export-manifest.json').read_text())
assert manifest['sourceRunId'] == 44606071748 and manifest['sourceCommit'] == 'c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'
assert manifest['sourceRunAttempt'] == 1 and manifest['exportRunId'] == 44608777482 and manifest['game'] == 'penguintrack'
assert manifest['gamesRerun'] is False and manifest['installPackagesValidated'] is False
assert manifest['files'] == {k: v for k, v in files.items() if k != 'export-manifest.json'}
result = {'status': 'passed', 'exportCommit': commit, 'originalRunId': 44606071748,
          'recoveryRunId': 44608777482, 'sourceCommit': manifest['sourceCommit'], 'files': len(files),
          'everyGitBlobVerified': True, 'everyExportManifestSizeAndSha256Verified': True,
          'archive': {'bytes': archive.stat().st_size, 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest()},
          'gamesRerun': False, 'installPackagesValidated': False}
(base / 'penguin-evidence-recovery-validation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
for mode in ('normal','occupied'):
    r = json.loads((output / f'artifact/penguintrack-{mode}/report.json').read_text())
    print(json.dumps({'mode': mode, 'status': r['status'], 'checks': len(r.get('tests', [])), 'error': r.get('error'),
                      'tests': [{'name':t['name'],'status':t['status']} for t in r.get('tests',[])]}))
