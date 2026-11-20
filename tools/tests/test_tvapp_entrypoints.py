"""The archived TVAPP commands still work from callers outside the repository."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


TOOLS = Path(__file__).resolve().parents[1]
COMMANDS = ('fetch-tvapp-apks.py', 'import-tvapp.py', 'fork-tvapp-assets.py',
            'update-tvapp-oversized.py', 'verify-fork-tvapp.py')


class TVAPPCommandTest(unittest.TestCase):
    def test_legacy_and_current_cli_options_match(self):
        with tempfile.TemporaryDirectory() as cwd:
            for name in COMMANDS:
                with self.subTest(name=name):
                    current = subprocess.check_output([sys.executable, str(TOOLS / 'tvapp' / name), '--help'], cwd=cwd)
                    previous = subprocess.check_output([sys.executable, str(TOOLS / name), '--help'], cwd=cwd)
                    self.assertEqual(previous, current)
                    self.assertIn(b'--help', current)


if __name__ == '__main__':
    unittest.main()
