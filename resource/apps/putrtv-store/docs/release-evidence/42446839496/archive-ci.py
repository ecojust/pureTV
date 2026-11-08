#!/usr/bin/env python3
"""Archive an already verified store export; run after prepare-tv-store-resources.py."""
import argparse
import hashlib
import json
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--run', required=True)
args = parser.parse_args()
assert args.run.isdecimal()
root = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
app = root / 'resource/apps/putrtv-store'
evidence = app / 'docs/release-evidence' / args.run
manifest = json.loads((evidence / 'export-metadata.json').read_text())
assert manifest['buildResult'] == manifest['signResult'] == 'success'
ref = 'refs/remotes/origin/build-assets/putrtv-store-' + args.run
prefix = 'release-staging/putrtv-store/'
tests = dict(tests=0, failures=0, errors=0, skipped=0)
classes = []
lint = {}
records = []
for item in manifest['files']:
    name = Path(item['path']).name
    content = subprocess.check_output(['git', 'show', ref + ':' + prefix + item['path']], cwd=root)
    assert len(content) == item['bytes'] and hashlib.sha256(content).hexdigest() == item['sha256']
    if name.endswith('.png'):
        target = app / 'docs/previews' / name
        assert target.read_bytes() == content
    elif name.endswith('.apk'):
        target = app / name
        assert target.read_bytes() == content
    else:
        group = 'reports' if name.endswith('.xml') else 'logs' if name.endswith('.log') else 'raw'
        target = evidence / group / name
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            assert target.read_bytes() == content
        else:
            target.write_bytes(content)
    records.append({**item, 'archivedPath': str(target.relative_to(root))})
    if name.startswith('TEST-') and name.endswith('.xml'):
        result = ET.fromstring(content)
        counts = {key: int(result.get(key, 0)) for key in tests}
        for key in tests:
            tests[key] += counts[key]
        classes.append({'class': result.get('name'), **counts})
    elif name.startswith('lint-results') and name.endswith('.xml'):
        for issue in ET.fromstring(content).findall('issue'):
            severity = issue.get('severity')
            lint[severity] = lint.get(severity, 0) + 1
assert tests['tests'] > 0 and tests['failures'] == tests['errors'] == tests['skipped'] == 0
assert lint.get('Error', 0) == lint.get('Fatal', 0) == 0
report = {'sourceSha': manifest['sourceSha'], 'runId': args.run, 'tests': tests,
          'classes': classes, 'lintIssues': lint, 'physicalTvTested': False, 'files': records}
(evidence / 'archive-index.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ('sourceSha', 'runId', 'tests', 'lintIssues')}, indent=2))
