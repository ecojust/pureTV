#!/usr/bin/env python3
"""Validate this documentation expansion against its preserved Git baseline."""
import collections
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
BASE = 'dbb84be8f6a981606ec9f2c7436d43c9486fb9ea'
old = json.loads(subprocess.check_output(['git', 'show', BASE + ':docs/claude-games/catalog.json'], cwd=ROOT))
current = json.loads((ROOT / 'docs/claude-games/catalog.json').read_text())
games = current['games']
assert current['count'] == len(games) == 380
assert current['repositoryCount'] == len({g['repository'].lower() for g in games}) == 236
assert len({g['id'].lower() for g in games}) == len(games)
assert len({g['sourceUrl'].lower() for g in games}) == len(games)
assert dict(collections.Counter(g['category'] for g in games)) == current['categoryCounts']
assert len(current['categoryCounts']) == 8
mapped = {g['id']: g for g in games}
for entry in old['games']:
    expected = dict(entry)
    if expected['category'] == '3D 动作、探索与模拟':
        expected['category'] = '动作、角色扮演与探索'
    expected.setdefault('checkedAt', '2026-11-17')
    assert mapped[entry['id']] == expected, 'Unexpected prior-reference modification: ' + entry['id']

assembly = json.loads((HERE / 'assembly-inputs.json').read_text())
citation = json.loads((HERE / 'independent-final79.json').read_text())
assert citation['count'] == citation['passed'] == 79
for name, digest in assembly['inputs'].items():
    assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest
    assert citation['inputs'][name] == digest, 'Final citations must bind the same research input'
added = set(mapped) - {g['id'] for g in old['games']}
assert len(added) == 79 and added == {r['id'] for r in citation['results']}
for result in citation['results']:
    assert result['ok'] and not result['errors']
    assert all(check['ok'] for check in result['checks'])

cn = (ROOT / 'README.md').read_text()
en = (ROOT / 'README.en.md').read_text()
begin, end = '<!-- claude-games:start -->', '<!-- claude-games:end -->'
block = cn.split(begin, 1)[1].split(end, 1)[0]
table_rows = [line for line in block.splitlines() if line.startswith('| [')]
assert len(table_rows) == 380
assert block.count('<details') == block.count('</details>') == 8
for category, count in current['categoryCounts'].items():
    assert f'{category}（{count}）' in block
for game in games:
    assert block.count('](' + game['sourceUrl'] + ')') == 1, game['title']
assert '380 项 / 236 个仓库' in block and '380' in en and '236' in en
assert '79 项' in block and '79 newly researched' in en
for name in ['README.md', 'README.en.md']:
    previous = subprocess.check_output(['git', 'show', BASE + ':' + name], cwd=ROOT).decode()
    now = (ROOT / name).read_text()
    assert previous.split(begin, 1)[0] == now.split(begin, 1)[0]
    assert previous.split(end, 1)[1] == now.split(end, 1)[1]
for name in ['docs/claude-games/porting-baseline-93.json', 'docs/claude-games/tv-assessment.json',
             'docs/claude-games/tv-assessment.md', 'joystick-games/catalog-registry.json',
             'joystick-games/porting-progress.json']:
    assert (ROOT / name).read_bytes() == subprocess.check_output(['git', 'show', BASE + ':' + name], cwd=ROOT)
paths = [ROOT / 'README.md', ROOT / 'README.en.md', ROOT / 'docs/claude-games/catalog.json', ROOT / 'docs/claude-games/README.md']
paths += [p for p in HERE.rglob('*') if p.is_file() and p.name not in {'verification.json', 'publication-verification.json'}]
result = {'checkedAt': '2026-11-19', 'ok': True, 'baselineCommit': BASE, 'count': len(games),
          'addedCount': len(added), 'repositoryCount': current['repositoryCount'], 'categoryCounts': current['categoryCounts'],
          'independentlyRefetchedCitations': citation['passed'],
          'independentlyRefetchedSourceFiles': sum(c['name'].startswith('source:') for r in citation['results'] for c in r['checks']),
          'priorReferencesPreserved': 301, 'readmeOutsideReferenceBlocksUnchanged': True,
          'originalPortingScopeAndPublishedCountsUnchanged': True, 'newGamesPlaytested': False,
          'files': {str(p.relative_to(ROOT)): {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(paths)}}
(HERE / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k != 'files'}, ensure_ascii=False))
