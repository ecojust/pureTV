"""The archive generator must attribute runtime evidence to the tested APK."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


class CompatibilityTest(unittest.TestCase):
    def test_new_package_does_not_inherit_execution_or_diagnosis(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            folder = root / 'education/sample'
            folder.mkdir(parents=True)
            app = {'name': 'Sample', 'path': 'education/sample', 'category': 'education',
                   'manifest': 'education/sample/manifest.json'}
            category = {'id': 'education', 'name': 'Education', 'appCount': 1, 'apkCount': 2}
            catalog = {'source': {'commit': '1' * 40}, 'apps': [app], 'categories': [category],
                       'appCount': 1, 'apkCount': 2, 'apkBytes': 2}
            (root / 'catalog.json').write_text(json.dumps(catalog))
            (folder / 'assets.json').write_text('{}')
            digest = hashlib.sha256(b'1').hexdigest()
            note = {'summary': 'Observed startup failure', 'report': 'verification/report.md',
                    'apkExecuted': True}
            (root / 'compatibility.json').write_text(json.dumps({'packages': {digest: note}}))
            package = {'file': 'sample.apk', 'versionName': '1', 'versionCode': 1,
                       'minSdk': 21, 'bytes': 1, 'sha256': digest}
            (folder / 'second.apk').write_bytes(b'3')
            untested = dict(package, file='second.apk', sha256=hashlib.sha256(b'3').hexdigest())
            manifest = {'description': 'Sample', 'notes': [], 'packages': [package, untested],
                        'apkExecuted': False}
            manifest_path = folder / 'manifest.json'
            manifest_path.write_text(json.dumps(manifest))
            script = Path(__file__).resolve().parents[1] / 'tvapp' / 'import-tvapp.py'
            for content, expected in [(b'1', True), (b'2', False)]:
                with self.subTest(content=content):
                    (folder / 'sample.apk').write_bytes(content)
                    manifest = json.loads(manifest_path.read_text())
                    manifest['packages'][0]['sha256'] = hashlib.sha256(content).hexdigest()
                    manifest_path.write_text(json.dumps(manifest))
                    subprocess.run([sys.executable, str(script), '--finalize', '--output', str(root)],
                                   check=True, capture_output=True)
                    self.assertIs(json.loads(manifest_path.read_text())['apkExecuted'], expected)
                    for readme in (folder / 'README.md', folder.parent / 'README.md', root / 'README.md'):
                        warnings = [line for line in readme.read_text().splitlines()
                                    if note['summary'] in line]
                        self.assertEqual(len(warnings), int(expected))
                        if expected:
                            self.assertIn('sample.apk', warnings[0])
                            self.assertNotIn('second.apk', warnings[0])


if __name__ == '__main__':
    unittest.main()
