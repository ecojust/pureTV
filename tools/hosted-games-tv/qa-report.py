#!/usr/bin/env python3
"""Combine independently booted TV cases, preserving missing and failed checks."""
import argparse
import json
from pathlib import Path
import shutil


CASES = ['controllers', 'bandit', 'fish-loop', 'noir-extreme', 'struggle-bus', 'vespertine', 'daejeon-campus']


def merge(source, out):
    out.mkdir(parents=True, exist_ok=True)
    combined = {'passed': True, 'physicalTvTested': False, 'physicalControllerTested': False,
                'games': {}, 'controllers': {}, 'cases': {}}
    for case in CASES:
        folder = source / ('hosted-games-tv-case-' + case)
        try:
            report = json.loads((folder / 'report.json').read_text())
            if report['case'] != case:
                raise ValueError('Unexpected case ID')
            apk = report['apkSha256']
            if apk != combined.setdefault('apkSha256', apk):
                raise ValueError('Cases used different APKs')
            if case == 'controllers':
                combined['controllers'] = report['controllers']
                represented = set(report['controllers']) == {'phone', 'wifi'}
                preview = folder / 'catalog-preview.png'
                if preview.is_file():
                    shutil.copyfile(preview, out / preview.name)
            else:
                entry = report.get('games', {}).get(case)
                represented = bool(entry and entry.get('returnedFocus'))
                if entry:
                    combined['games'][case] = entry
                for suffix in ['-played.png', '-author.xml', '-guide.xml', '-failure.xml']:
                    artifact = folder / (case + suffix)
                    if artifact.is_file():
                        shutil.copyfile(artifact, out / artifact.name)
            result = {key: report[key] for key in ('fingerprint', 'webview', 'fatal', 'adbStderr') if key in report}
            result['passed'] = report.get('passed') is True and represented
        except (KeyError, ValueError, OSError) as error:
            result = {'passed': False, 'error': str(error)}
        combined['cases'][case] = result
        combined['passed'] = combined['passed'] and result['passed']
    (out / 'report.json').write_text(json.dumps(combined, ensure_ascii=False, indent=2) + '\n')
    return combined['passed']


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    raise SystemExit(0 if merge(args.input, args.out) else 1)
