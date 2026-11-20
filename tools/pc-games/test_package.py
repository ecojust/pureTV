import json
import tempfile
import unittest
import zipfile
from pathlib import Path

import package


class PortablePackageTests(unittest.TestCase):
    def test_stale_port_download_is_rejected_even_when_game_id_matches(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            pc = root / 'tools' / 'pc-games'
            pc.mkdir(parents=True)
            (pc / 'catalog.json').write_text(json.dumps([{
                'id': 'example', 'url': 'https://example.com/old.apk',
                'bytes': 1, 'sha256': '0' * 64,
            }]))
            (pc.parent / 'readme-app-games.json').write_text(json.dumps([{
                'games': [{'page': 'joystick-games/example/', 'apk': 'https://example.com/new.apk'}]
            }]))
            with self.assertRaisesRegex(ValueError, 'Desktop and TV download URLs differ for example'):
                package.build(root / 'out', root)

    def test_windows_and_unix_text_checkouts_produce_the_same_archive(self):
        source = Path(__file__).resolve().parents[2]
        names = ('launcher.py', 'host.py', 'pc-bridge.js', 'requirements.txt', 'catalog.json')
        paths = [Path('tools/pc-games') / name for name in names]
        paths.extend((Path('tools/readme-app-games.json'), Path('LICENSE')))
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for path in paths:
                destination = root / path
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes((source / path).read_bytes().replace(b'\r\n', b'\n'))
            unix = package.build(root / 'unix', root).read_bytes()
            for path in paths:
                file = root / path
                file.write_bytes(file.read_bytes().replace(b'\n', b'\r\n'))
            windows = package.build(root / 'windows', root)
            self.assertEqual(unix, windows.read_bytes())
            with zipfile.ZipFile(windows) as bundle:
                self.assertEqual(set(bundle.namelist()), {*names, 'LICENSE'})
                self.assertTrue(all(entry.create_system == 3 for entry in bundle.infolist()))


if __name__ == '__main__':
    unittest.main()
