#!/usr/bin/env python3
"""Validate this documentation expansion against its preserved Git baseline."""
import collections
import hashlib
import json
import re
import subprocess
import sys
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


directory = HERE.parent
for name in ['porting-baseline-93.json', 'tv-assessment.json', 'tv-assessment.md']:
    path = directory / name
    assert path.read_bytes() == subprocess.check_output(['git', 'show', BASE + ':' + str(path.relative_to(ROOT))], cwd=ROOT)
subprocess.run([sys.executable, str(directory / 'render-catalog.py'), '--check'], check=True)
cn = (directory / 'catalog.md').read_text()
en = (directory / 'catalog.en.md').read_text()
table_rows = [line for line in cn.splitlines() if line.startswith('| [')]
assert len(table_rows) == len(games)
assert cn.count('<details') == cn.count('</details>') == len(current['categoryCounts'])
for category, count in current['categoryCounts'].items():
    assert f'{category}（{count}）' in cn
for game in games:
    assert cn.count('](' + game['sourceUrl'] + ')') == 1, game['title']
assert '380 项 / 236 个仓库' in cn and '380 games from 236 GitHub repositories' in en
assert '[full catalog](catalog.md)' in en
for homepage, entry in [('README.md', 'catalog.md'), ('README.en.md', 'catalog.en.md')]:
    text = (ROOT / homepage).read_text()
    assert f'](docs/claude-games/{entry})' in text, f'{homepage} is missing its catalog link'
    assert '| 游戏与源码 | 玩法与看点 | 运行方式 / 入口 | Claude 依据 / 许可 |' not in text

for page in [directory / 'catalog.md', directory / 'catalog.en.md', directory / 'README.md', HERE / 'README.md']:
    for url in re.findall(r'\]\(([^ )]+)\)', page.read_text()):
        if url.startswith(('https://', 'http://', '#')):
            continue
        name, _, anchor = url.partition('#')
        target = (page.parent / name).resolve()
        if not target.exists():
            # A sparse checkout may omit a valid destination in the repository.
            repo_path = target.relative_to(ROOT).as_posix()
            subprocess.run(['git', 'cat-file', '-e', f'HEAD:{repo_path}'], cwd=ROOT, check=True)
        if target.name == 'catalog.md' and anchor:
            assert f'id="{anchor}"' in cn, f'{page.name} links to a missing category: {anchor}'

print(f"Verified {len(games)} entries, {current['repositoryCount']} repositories, "
      f"{len(current['categoryCounts'])} categories, {len(old['games'])} original entries and {len(added)} additions.")
