"""Validate explicit TVAPP size exceptions against the immutable upstream tree."""
import json
from pathlib import Path, PurePosixPath
import re

REPOSITORY = 'https://github.com/youhunwl/TVAPP'
LIMIT = 10_000_000


def load_overrides(path, commit):
    path = Path(path)
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding='utf-8'))
    if (data.get('schemaVersion') != 1 or data.get('repository') != REPOSITORY
            or data.get('commit') != commit or data.get('thresholdExclusiveBytes') != LIMIT):
        raise ValueError('Selection overrides must identify the same fixed TVAPP snapshot and original threshold')
    tree = json.loads((path.parent / 'tree.json').read_text(encoding='utf-8'))
    snapshot = json.loads((path.parent / 'commit.json').read_text(encoding='utf-8'))
    if (tree.get('truncated') is not False or snapshot.get('sha') != commit
            or tree.get('sha') not in {commit, snapshot.get('commit', {}).get('tree', {}).get('sha')}):
        raise ValueError('Selection overrides require the complete pinned upstream tree')
    upstream = {entry['path']: entry for entry in tree['tree']}
    entries = data.get('entries')
    if not isinstance(entries, list):
        raise ValueError('Selection overrides entries must be a list')
    seen = set()
    for entry in entries:
        source = entry.get('path', '')
        p = PurePosixPath(source)
        original = upstream.get(source, {})
        if (not source or p.is_absolute() or '..' in p.parts or '\\' in source
                or any(ord(c) < 32 for c in source) or p.suffix.lower() != '.apk'
                or source in seen or original.get('type') != 'blob'
                or original.get('mode') not in ('100644', '100755')
                or not isinstance(entry.get('size'), int) or entry['size'] < LIMIT
                or original.get('size') != entry['size'] or original.get('sha') != entry.get('sha')
                or re.fullmatch('[0-9a-f]{40}', entry.get('sha', '')) is None
                or entry.get('category') not in ('media', 'game', 'education', 'tools', 'fitness')
                or re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', entry.get('id', '')) is None
                or not isinstance(entry.get('name'), str) or not entry['name'].strip()
                or not isinstance(entry.get('reason'), str) or not entry['reason'].strip()
                or re.fullmatch(r'\d{4}-\d{2}-\d{2}', entry.get('requestedAt', '')) is None):
            raise ValueError(f'Invalid or unpinned explicit APK selection: {source}')
        seen.add(source)
    return entries
