#!/usr/bin/env python3
"""Reconstruct the reviewed expansion and render its standalone catalog pages."""
import collections
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
catalog_path = ROOT / 'docs/claude-games/catalog.json'
data = json.loads(catalog_path.read_text())
inputs = [HERE / (name + '-research.json') for name in ('root', 'karts', 'strategy', 'arcade')]
new = [game for path in inputs for game in json.loads(path.read_text())['games']]
assert len(new) == 79
new_ids = {game['id'] for game in new}
old = [game for game in data['games'] if game['id'] not in new_ids]
assert len(old) == 301, 'Preserve the existing 301 references'
games = new + old
assert len({game['id'].lower() for game in games}) == len(games)
assert len({game['sourceUrl'].lower() for game in games}) == len(games)
category_rename = {'3D 动作、探索与模拟': '动作、角色扮演与探索'}
categories = [category_rename.get(name, name) for name in data['categoryCounts']]
for game in games:
    game['category'] = category_rename.get(game['category'], game['category'])
    game.setdefault('checkedAt', '2026-11-19' if game['id'] in new_ids else '2026-11-17')
    if game['title'] == 'Couch Colony':
        game['runtimeLabel'] = 'webOS / 需 root'
counts = collections.Counter(game['category'] for game in games)
assert set(counts) == set(categories)
previous_expansion = data.get('expansion')
if previous_expansion and previous_expansion['checkedAt'] == '2026-11-17':
    data['previousExpansion'] = previous_expansion
data.update(checkedAt='2026-11-19', count=len(games), repositoryCount=len({game['repository'].lower() for game in games}),
            games=games, categoryCounts={name: counts[name] for name in categories})
data['expansion'] = {'checkedAt': '2026-11-19', 'previousCount': 301, 'addedCount': len(new),
                     'previousRepositoryCount': 178, 'originalPortingBaseline': 'porting-baseline-93.json',
                     'researchDirectory': 'expansion-2026-11-19/'}

receipt = json.loads((HERE / 'assembly-inputs.json').read_text())
assert receipt['inputs'] == {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}
assert receipt['categoryCounts'] == data['categoryCounts'] and receipt['count'] == len(games)
reconstructed = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
if catalog_path.read_text() != reconstructed:
    catalog_path.write_text(reconstructed)
subprocess.run([sys.executable, str(catalog_path.parent / 'render-catalog.py')], check=True)
