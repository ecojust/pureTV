import hashlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

import launcher


class CatalogOutputTests(unittest.TestCase):
    def test_redirected_list_preserves_localized_titles_as_utf8(self):
        script = Path(launcher.__file__)
        games = json.loads(script.with_name('catalog.json').read_text(encoding='utf-8'))
        for language, options in [('en', ['--language', 'en']), ('zh', ['--language', 'zh']), ('zh', [])]:
            with self.subTest(language=language):
                output = subprocess.check_output(
                    [sys.executable, str(script), '--list', *options],
                    env={**os.environ, 'PYTHONIOENCODING': 'cp1252'},
                )
                self.assertEqual(output.decode('utf-8').splitlines(),
                                 [f'{game["id"]:<24} {game[language]}' for game in games])


class CatalogDownloadTests(unittest.TestCase):
    def setUp(self):
        self.cache = tempfile.TemporaryDirectory()
        self.addCleanup(self.cache.cleanup)
        self.data = b'PK verified game bytes'
        self.game = dict(id='demo', en='Demo', url='https://example.invalid/demo.apk',
                         bytes=len(self.data), sha256=hashlib.sha256(self.data).hexdigest())

    def fetch(self):
        return launcher.fetch_game(self.game, Path(self.cache.name))

    def test_source_archive_launches_verified_repository_apk_offline(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            apk = root / 'joystick-games' / 'demo' / 'demo.apk'
            apk.parent.mkdir(parents=True)
            apk.write_bytes(self.data)
            with (patch.object(launcher, '__file__', str(root / 'tools/pc-games/launcher.py')),
                  patch.object(launcher, 'urlopen', side_effect=AssertionError('offline'))):
                self.assertTrue(self.fetch().samefile(apk))

    def test_parallel_download_and_offline_launch(self):
        with patch.object(launcher, 'urlopen', side_effect=lambda *a, **k: io.BytesIO(self.data)):
            with ThreadPoolExecutor(2) as pool:
                paths = list(pool.map(lambda _: self.fetch(), (1, 2)))
        self.assertEqual(paths[0], paths[1])
        with patch.object(launcher, 'urlopen', side_effect=AssertionError('offline')):
            self.assertEqual(self.fetch().read_bytes(), self.data)

    def test_invalid_download_never_enters_cache(self):
        for body in (self.data[:-1], b'X' * len(self.data), self.data + b'!'):
            with self.subTest(body=body), patch.object(launcher, 'urlopen', return_value=io.BytesIO(body)):
                with self.assertRaises(ValueError):
                    self.fetch()
                self.assertEqual(list(Path(self.cache.name).iterdir()), [])


if __name__ == '__main__':
    unittest.main()
