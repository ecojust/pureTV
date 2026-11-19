#!/usr/bin/env python3
"""Independently re-fetch reference citations and reviewed source bytes, not gameplay."""
import argparse
import concurrent.futures
import hashlib
import json
import re
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--inputs', nargs='+', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()
rows = []
for filename in args.inputs:
    data = json.loads(Path(filename).read_text())
    rows.extend(data['games'])

def raw_url(url):
    parts = urllib.parse.urlsplit(url)
    path = parts.path.split('/')
    if parts.netloc == 'github.com' and len(path) >= 6 and path[3] == 'blob':
        return 'https://raw.githubusercontent.com/' + '/'.join(path[1:3] + path[4:])
    return url

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'pureTV-reference-source-check'})
    with urllib.request.urlopen(request, timeout=45) as response:
        body = response.read(8 * 1024 * 1024 + 1)
        assert len(body) <= 8 * 1024 * 1024, 'unexpectedly large source'
        return body

def normalized(value):
    return re.sub(r'\s+', ' ', value).strip()

def verify(game):
    result = {'id': game['id'], 'title': game['title'], 'repository': game['repository'],
              'commit': game['commit'], 'checks': [], 'errors': []}
    def check(name, action):
        try:
            result['checks'].append({'name': name, 'ok': True, **action()})
        except Exception as exc:
            result['errors'].append({'name': name, 'error': str(exc)})

    def evidence():
        item = game['claudeEvidence']
        url = item['url']
        match = re.fullmatch(r'https://github.com/([^/]+/[^/]+)/commit/([a-f0-9]{40})', url)
        if match:
            assert match[1].lower() == game['repository'].lower()
            body = subprocess.check_output(['gh', 'api', 'repos/' + match[1] + '/commits/' + match[2]], stderr=subprocess.PIPE)
            data = json.loads(body)
            assert normalized(item['quote']) in normalized(data['commit']['message']), 'quote absent from commit message'
            affected = item['sourcePathAffected']
            matches = [f for f in data['files'] if f['filename'] == affected and f['changes'] > 0]
            assert matches, 'cited commit does not change the claimed game source'
            return {'url': url, 'quoteFound': True, 'affectedPath': affected,
                    'changes': matches[0]['changes'], 'responseSha256': hashlib.sha256(body).hexdigest()}
        body = fetch(raw_url(url))
        assert normalized(item['quote']) in normalized(body.decode('utf-8')), 'quote absent from fixed author source'
        assert game['commit'] in url, 'author reference must be pinned'
        return {'url': url, 'quoteFound': True, 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}
    check('claudeEvidence', evidence)

    def source(item):
        url = raw_url(item['url'])
        assert game['commit'] in url, 'review source must use the frozen commit'
        body = fetch(url)
        assert len(body) == item['bytes'], 'byte length changed'
        digest = hashlib.sha256(body).hexdigest()
        assert digest == item['sha256'], 'SHA256 mismatch'
        return {'path': item['path'], 'url': url, 'bytes': len(body), 'sha256': digest}
    for item in game['sourceReview']:
        check('source:' + item['path'], lambda item=item: source(item))
    if game['license'].get('url'):
        def license_file():
            url = raw_url(game['license']['url'])
            body = fetch(url)
            assert len(body) > 20, 'empty license source'
            label = game['licenseLabel'].upper()
            text = body.decode('utf-8').lower()
            if label == 'MIT':
                assert 'permission is hereby granted' in text, 'MIT grant not found'
            if label in {'APACHE-2.0', 'APACHE 2.0'}:
                assert 'apache license' in text, 'Apache grant not found'
            return {'url': url, 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}
        check('license', license_file)
    result['ok'] = not result['errors']
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(verify, rows))
report = {'checkedAt': '2026-11-19', 'scope': 'New references only; source and citation verification, no gameplay tests.',
          'inputs': {path: hashlib.sha256(Path(path).read_bytes()).hexdigest() for path in args.inputs},
          'count': len(rows), 'passed': sum(x['ok'] for x in results), 'results': results}
Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'count': len(rows), 'passed': report['passed'], 'errors': [x for x in results if not x['ok']]}, ensure_ascii=False))
raise SystemExit(0 if report['passed'] == len(rows) else 1)
